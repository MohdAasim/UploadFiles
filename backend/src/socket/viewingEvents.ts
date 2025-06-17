import { AuthenticatedSocket, SocketServer } from './socketServer';
import { Server as SocketIOServer } from 'socket.io';

// Define the viewer info type
interface ViewerInfo {
  id: string;
  name: string;
  email: string;
  socketId: string;
  joinedAt: Date;
}

// Use Map with proper typing
const fileViewers = new Map<string, Set<ViewerInfo>>(); // fileId -> Set of viewer objects

export const handleViewingEvents = (
  io: SocketIOServer,
  socket: AuthenticatedSocket
) => {
  // User starts viewing a file
  socket.on('start-viewing-file', async ({ fileId }: { fileId: string }) => {
    try {
      const userId = socket.userId;
      const userName = socket.userData?.name;
      const userEmail = socket.userData?.email;

      if (!userId || !fileId) return;

      // Initialize viewers set for this file if not exists
      if (!fileViewers.has(fileId)) {
        fileViewers.set(fileId, new Set<ViewerInfo>());
      }

      const viewers = fileViewers.get(fileId)!; // Non-null assertion since we just set it

      // Add viewer info
      const viewerInfo: ViewerInfo = {
        id: userId,
        name: userName || 'Unknown User',
        email: userEmail || '',
        socketId: socket.id,
        joinedAt: new Date(),
      };

      // Remove any existing entry for this user and add new one
      const existingViewer = Array.from(viewers).find(
        (v: ViewerInfo) => v.id === userId
      );
      if (existingViewer) {
        viewers.delete(existingViewer);
      }
      viewers.add(viewerInfo);

      // Join the file room
      socket.join(`file:${fileId}`);

      // Broadcast to all users in the file room
      const viewersList = Array.from(viewers);
      io.to(`file:${fileId}`).emit('file-viewers-updated', {
        fileId,
        viewers: viewersList,
      });

      // Also broadcast to general file list viewers
      socket.broadcast.emit('user-started-viewing-file', {
        fileId,
        viewer: viewerInfo,
      });

      console.log(`User ${userName} started viewing file ${fileId}`);
    } catch (error) {
      console.error('Error handling start-viewing-file:', error);
    }
  });

  // User stops viewing a file
  socket.on('stop-viewing-file', async ({ fileId }: { fileId: string }) => {
    try {
      const userId = socket.userId;

      if (!userId || !fileId) return;

      const viewers = fileViewers.get(fileId);
      if (viewers) {
        // Remove user from viewers
        const viewerToRemove = Array.from(viewers).find(
          (v: ViewerInfo) => v.id === userId
        );
        if (viewerToRemove) {
          viewers.delete(viewerToRemove);

          // Leave the file room
          socket.leave(`file:${fileId}`);

          // If no viewers left, clean up
          if (viewers.size === 0) {
            fileViewers.delete(fileId);
          }

          // Broadcast updated viewers list
          const viewersList = Array.from(viewers);
          io.to(`file:${fileId}`).emit('file-viewers-updated', {
            fileId,
            viewers: viewersList,
          });

          // Also broadcast to general file list viewers
          socket.broadcast.emit('user-stopped-viewing-file', {
            fileId,
            userId,
          });

          console.log(
            `User ${socket.userData?.name} stopped viewing file ${fileId}`
          );
        }
      }
    } catch (error) {
      console.error('Error handling stop-viewing-file:', error);
    }
  });

  // Handle disconnect - clean up all file viewing sessions
  socket.on('disconnect', () => {
    const userId = socket.userId;
    if (!userId) return;

    // Remove user from all file viewing sessions
    for (const [fileId, viewers] of fileViewers.entries()) {
      const viewerToRemove = Array.from(viewers).find(
        (v: ViewerInfo) => v.id === userId
      );
      if (viewerToRemove) {
        viewers.delete(viewerToRemove);

        // Broadcast updated viewers list
        const viewersList = Array.from(viewers);
        io.to(`file:${fileId}`).emit('file-viewers-updated', {
          fileId,
          viewers: viewersList,
        });

        socket.broadcast.emit('user-stopped-viewing-file', {
          fileId,
          userId,
        });

        // Clean up empty viewer sets
        if (viewers.size === 0) {
          fileViewers.delete(fileId);
        }
      }
    }
  });
};
