import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';
import { handleViewingEvents } from './viewingEvents';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userData?: any;
}

export class SocketServer {
  io: SocketIOServer;
  private connectedUsers: Map<string, { socketId: string; userData: any }> =
    new Map();
  public fileEditingSessions: Map<
    string,
    { userId: string; userName: string; timestamp: Date }
  > = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupAuthentication();
    this.setupEventHandlers();
  }

  private setupAuthentication() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = (user._id as mongoose.Types.ObjectId).toString();
        socket.userData = {
          id: user._id,
          name: user.name,
          email: user.email,
        };

        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userData.name} connected: ${socket.id}`);
      //handle viewing events
      handleViewingEvents(this.io, socket);

      // Add user to connected users
      this.connectedUsers.set(socket.userId!, {
        socketId: socket.id,
        userData: socket.userData,
      });

      // Notify user of successful connection
      socket.emit('connected', {
        message: 'Connected to real-time server',
        userData: socket.userData,
      });

      // File editing events
      this.handleFileEvents(socket);

      // Sharing events
      this.handleSharingEvents(socket);

      // Collaboration events
      this.handleCollaborationEvents(socket);

      // Notification events
      this.handleNotificationEvents(socket);

      // Notify all clients about updated online users
      this.io.emit('onlineUsersUpdated', Array.from(this.connectedUsers.values()).map(
        user => user.userData
      ));

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userData?.name} disconnected: ${socket.id}`);
        this.connectedUsers.delete(socket.userId!);

        // Notify all clients about updated online users
        this.io.emit('onlineUsersUpdated', Array.from(this.connectedUsers.values()).map(
          user => user.userData
        ));

        // Remove from all file editing sessions
        for (const [fileId, session] of this.fileEditingSessions.entries()) {
          if (session.userId === socket.userId) {
            this.fileEditingSessions.delete(fileId);
            // Notify others that user stopped editing
            socket.broadcast.emit('user-stopped-editing', {
              fileId,
              userId: socket.userId,
              userName: socket.userData.name,
            });
          }
        }
      });
    });
  }

  private handleFileEvents(socket: AuthenticatedSocket) {
    // User starts editing a file
    socket.on('start-editing-file', (data: { fileId: string }) => {
      const { fileId } = data;

      // Check if someone else is already editing
      const existingSession = this.fileEditingSessions.get(fileId);
      if (existingSession && existingSession.userId !== socket.userId) {
        socket.emit('file-being-edited', {
          fileId,
          editor: existingSession,
        });
        return;
      }

      // Set editing session
      this.fileEditingSessions.set(fileId, {
        userId: socket.userId!,
        userName: socket.userData.name,
        timestamp: new Date(),
      });

      // Notify all other users
      socket.broadcast.emit('user-started-editing', {
        fileId,
        userId: socket.userId,
        userName: socket.userData.name,
      });

      socket.emit('editing-started', { fileId });
    });

    // User stops editing a file
    socket.on('stop-editing-file', (data: { fileId: string }) => {
      const { fileId } = data;

      if (this.fileEditingSessions.get(fileId)?.userId === socket.userId) {
        this.fileEditingSessions.delete(fileId);

        // Notify all other users
        socket.broadcast.emit('user-stopped-editing', {
          fileId,
          userId: socket.userId,
          userName: socket.userData.name,
        });
      }
    });

    // File uploaded
    socket.on(
      'file-uploaded',
      (data: { fileData: any; parentFolder?: string }) => {
        socket.broadcast.emit('new-file-uploaded', {
          file: data.fileData,
          uploadedBy: socket.userData,
          parentFolder: data.parentFolder,
        });
      }
    );

    // File updated/new version
    socket.on(
      'file-version-updated',
      (data: { fileId: string; versionData: any }) => {
        socket.broadcast.emit('file-version-changed', {
          fileId: data.fileId,
          version: data.versionData,
          updatedBy: socket.userData,
        });
      }
    );

    // File deleted
    socket.on('file-deleted', (data: { fileId: string }) => {
      socket.broadcast.emit('file-was-deleted', {
        fileId: data.fileId,
        deletedBy: socket.userData,
      });
    });
  }

  private handleSharingEvents(socket: AuthenticatedSocket) {
    // File/folder shared
    socket.on(
      'resource-shared',
      (data: {
        resourceId: string;
        resourceType: 'file' | 'folder';
        targetUserId: string;
        permission: string;
      }) => {
        const targetUser = this.connectedUsers.get(data.targetUserId);

        if (targetUser) {
          this.io.to(targetUser.socketId).emit('resource-shared-with-you', {
            resourceId: data.resourceId,
            resourceType: data.resourceType,
            permission: data.permission,
            sharedBy: socket.userData,
          });
        }
      }
    );

    // Permission changed
    socket.on(
      'permission-changed',
      (data: {
        resourceId: string;
        targetUserId: string;
        newPermission: string;
      }) => {
        const targetUser = this.connectedUsers.get(data.targetUserId);

        if (targetUser) {
          this.io.to(targetUser.socketId).emit('permission-updated', {
            resourceId: data.resourceId,
            newPermission: data.newPermission,
            updatedBy: socket.userData,
          });
        }
      }
    );
  }

  private handleCollaborationEvents(socket: AuthenticatedSocket) {
    // Join collaboration room for a file/folder
    socket.on('join-collaboration', (data: { resourceId: string }) => {
      socket.join(`collab-${data.resourceId}`);

      // Notify others in the room
      socket.to(`collab-${data.resourceId}`).emit('user-joined-collaboration', {
        user: socket.userData,
        resourceId: data.resourceId,
      });
    });

    // Leave collaboration room
    socket.on('leave-collaboration', (data: { resourceId: string }) => {
      socket.leave(`collab-${data.resourceId}`);

      // Notify others in the room
      socket.to(`collab-${data.resourceId}`).emit('user-left-collaboration', {
        user: socket.userData,
        resourceId: data.resourceId,
      });
    });

    // Send cursor position (for file preview collaboration)
    socket.on(
      'cursor-position',
      (data: { resourceId: string; position: any }) => {
        socket.to(`collab-${data.resourceId}`).emit('user-cursor-moved', {
          user: socket.userData,
          position: data.position,
        });
      }
    );
  }

  private handleNotificationEvents(socket: AuthenticatedSocket) {
    // Send notification to specific user
    socket.on(
      'send-notification',
      (data: {
        targetUserId: string;
        type: string;
        message: string;
        resourceId?: string;
      }) => {
        const targetUser = this.connectedUsers.get(data.targetUserId);

        if (targetUser) {
          this.io.to(targetUser.socketId).emit('notification', {
            type: data.type,
            message: data.message,
            from: socket.userData,
            resourceId: data.resourceId,
            timestamp: new Date(),
          });
        }
      }
    );

    // Get online users - Fix to emit the correct event name
    socket.on('get-online-users', () => {
      const onlineUsers = Array.from(this.connectedUsers.values()).map(
        user => user.userData
      );
      console.log('Sending online users list:', onlineUsers.length);
      socket.emit('onlineUsersUpdated', onlineUsers); // Changed from 'online-users' to match frontend
    });

    // Check if specific user is online
    socket.on('check-user-online', (data: { userId: string }) => {
      const isOnline = this.connectedUsers.has(data.userId);
      socket.emit('user-online-status', {
        userId: data.userId,
        isOnline,
      });
    });
  }

  // Public methods for server-side events
  public notifyFileShared(
    resourceId: string,
    resourceType: 'file' | 'folder',
    targetUserId: string,
    sharedBy: any,
    permission: string
  ) {
    const targetUser = this.connectedUsers.get(targetUserId);

    if (targetUser) {
      this.io.to(targetUser.socketId).emit('resource-shared-with-you', {
        resourceId,
        resourceType,
        permission,
        sharedBy,
      });
    }
  }

  public notifyResourceDeleted(
    resourceId: string,
    resourceType: 'file' | 'folder',
    deletedBy: any
  ) {
    this.io.emit('resource-was-deleted', {
      resourceId,
      resourceType,
      deletedBy,
    });
  }

  public getConnectedUsers() {
    return Array.from(this.connectedUsers.values()).map(user => user.userData);
  }

  // Getter for the io instance
  public get socketIO() {
    return this.io;
  }
}
