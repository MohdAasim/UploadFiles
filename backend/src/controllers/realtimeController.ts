import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

export const getOnlineUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const socketServer = req.app.get('socketServer');
  
  if (!socketServer) {
    throw createError('Real-time server not available', 503);
  }

  const onlineUsers = socketServer.getConnectedUsers();
  
  res.json({
    success: true,
    onlineUsers
  });
});

export const getFileEditingStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { fileId } = req.params;
  const socketServer = req.app.get('socketServer');
  
  if (!socketServer) {
    throw createError('Real-time server not available', 503);
  }

  const editingSession = socketServer.fileEditingSessions.get(fileId);
  
  res.json({
    success: true,
    isBeingEdited: !!editingSession,
    editor: editingSession || null
  });
});

export const notifyUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { targetUserId, type, message, resourceId } = req.body;
  const socketServer = req.app.get('socketServer');
  
  if (!socketServer) {
    throw createError('Real-time server not available', 503);
  }

  // Send notification through socket
  const targetUser = socketServer.connectedUsers.get(targetUserId);
  
  if (targetUser) {
    socketServer.io.to(targetUser.socketId).emit('notification', {
      type,
      message,
      from: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      resourceId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Notification sent'
    });
  } else {
    res.json({
      success: false,
      message: 'User is offline'
    });
  }
});