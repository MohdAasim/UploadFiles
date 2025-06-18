import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Get list of online users
 * @description Retrieves all currently connected users from the socket server
 * @route GET /api/v1/realtime/online-users
 * @access Private
 * @param {AuthRequest} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with online users list
 */
export const getOnlineUsers = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;

    logger.info(`Online users requested by user: ${userId}`);

    const socketServer = req.app.get('socketServer');

    if (!socketServer) {
      logger.error('Socket server not available for online users request');
      throw createError('Real-time server not available', 503);
    }

    const onlineUsers = socketServer.getConnectedUsers();

    logger.info(`Retrieved ${onlineUsers.length} online users`);

    res.json({
      success: true,
      onlineUsers,
    });
  }
);

/**
 * Get file editing status
 * @description Checks if a specific file is currently being edited by another user
 * @route GET /api/v1/realtime/file/:fileId/editing-status
 * @access Private
 * @param {AuthRequest} req - Express request object with file ID parameter
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with file editing status
 */
export const getFileEditingStatus = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { fileId } = req.params;
    const userId = req.user?.id;

    logger.info(
      `File editing status requested - File: ${fileId}, User: ${userId}`
    );

    const socketServer = req.app.get('socketServer');

    if (!socketServer) {
      logger.error('Socket server not available for editing status request');
      throw createError('Real-time server not available', 503);
    }

    const editingSession = socketServer.fileEditingSessions.get(fileId);

    logger.info(
      `File editing status retrieved - File: ${fileId}, Being edited: ${!!editingSession}`
    );

    res.json({
      success: true,
      isBeingEdited: !!editingSession,
      editor: editingSession || null,
    });
  }
);

/**
 * Send notification to a user
 * @description Sends real-time notification to a specific user via socket connection
 * @route POST /api/v1/realtime/notify
 * @access Private
 * @param {AuthRequest} req - Express request object containing notification data
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with notification result
 */
export const notifyUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { targetUserId, type, message, resourceId } = req.body;
    const senderId = req.user?.id;

    logger.info(
      `Notification requested - From: ${senderId}, To: ${targetUserId}, Type: ${type}, Resource: ${resourceId}`
    );

    const socketServer = req.app.get('socketServer');

    if (!socketServer) {
      logger.error('Socket server not available for notification');
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
          email: req.user.email,
        },
        resourceId,
        timestamp: new Date(),
      });

      logger.info(
        `Notification sent successfully - From: ${senderId} to: ${targetUserId}`
      );

      res.json({
        success: true,
        message: 'Notification sent',
      });
    } else {
      logger.warn(`User offline for notification - Target: ${targetUserId}`);

      res.json({
        success: false,
        message: 'User is offline',
      });
    }
  }
);
