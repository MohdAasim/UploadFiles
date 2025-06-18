import { Request, Response } from 'express';
import Folder from '../models/Folder';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { JwtPayload } from '../services/jwt-service';
import { SocketServer } from '../socket/socketServer';
import {
  getFilePermissionService,
  getSharedByMeService,
  getSharedWithMeService,
  removePermissionService,
  shareResourceService,
} from '../services/share.service';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user: JwtPayload;
}

/**
 * Share a resource (file or folder) with another user
 * @description Shares files or folders with specified permissions and notifies target user
 * @route POST /api/v1/share
 * @access Private
 * @param {AuthRequest} req - Express request object containing share data
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with sharing result
 */
export const shareResource = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { resourceId, resourceType, targetUserEmail, permission } = req.body;

    logger.info(
      `Share resource initiated - Resource: ${resourceId} (${resourceType}), Target: ${targetUserEmail}, Permission: ${permission}, Sharer: ${req.user.id}`
    );

    // Get socket server instance
    const socketServer = req.app.get('socketServer') as SocketServer;
    const response = await shareResourceService({
      permission,
      resourceId,
      resourceType,
      socketServer,
      targetUserEmail,
      user: req.user,
    });

    logger.info(
      `Resource shared successfully - Resource: ${resourceId} with ${targetUserEmail}`
    );
    res.json(response);
  }
);

/**
 * Get file permissions
 * @description Retrieves list of users who have access to a specific file
 * @route GET /api/v1/share/file/:fileId/permissions
 * @access Private
 * @param {AuthRequest} req - Express request object with file ID parameter
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with file permissions
 */
export const getFilePermissions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { fileId } = req.params;
    const userId = req.user.id;

    logger.info(
      `File permissions requested - File: ${fileId}, User: ${userId}`
    );

    const response = await getFilePermissionService({ userId, fileId });

    logger.info(`File permissions retrieved for file: ${fileId}`);
    res.json(response);
  }
);

/**
 * Get folder permissions
 * @description Retrieves list of users who have access to a specific folder
 * @route GET /api/v1/share/folder/:folderId/permissions
 * @access Private
 * @param {AuthRequest} req - Express request object with folder ID parameter
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with folder permissions
 */
export const getFolderPermissions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { folderId } = req.params;
    const userId = req.user.id;

    logger.info(
      `Folder permissions requested - Folder: ${folderId}, User: ${userId}`
    );

    const folder = await Folder.findById(folderId).populate(
      'sharedWith.user',
      'name email'
    );

    if (!folder) {
      logger.warn(`Folder not found for permissions: ${folderId}`);
      throw createError('Folder not found', 404);
    }

    // Check if user is owner or has admin permission
    const isOwner = folder.owner.toString() === userId;
    const hasAdminAccess = folder.sharedWith.some(
      (entry: any) =>
        entry.user._id.toString() === userId && entry.permission === 'admin'
    );

    if (!isOwner && !hasAdminAccess) {
      logger.warn(
        `Unauthorized folder permissions request - Folder: ${folderId}, User: ${userId}`
      );
      throw createError('Only owner or admin can view permissions', 403);
    }

    logger.info(`Folder permissions retrieved for folder: ${folderId}`);

    res.json({
      success: true,
      folder: {
        id: folder._id,
        name: folder.name,
        owner: isOwner ? 'You' : 'Someone else',
      },
      permissions: folder.sharedWith.map((entry: any) => ({
        user: {
          id: entry.user._id,
          name: entry.user.name,
          email: entry.user.email,
        },
        permission: entry.permission,
      })),
    });
  }
);

/**
 * Get files and folders shared with current user
 * @description Retrieves all resources that have been shared with the authenticated user
 * @route GET /api/v1/share/shared-with-me
 * @access Private
 * @param {AuthRequest} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with shared resources
 */
export const getSharedWithMe = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user.id;

    logger.info(`Shared with me requested for user: ${userId}`);

    const response = await getSharedWithMeService(userId);

    logger.info(`Retrieved shared resources for user: ${userId}`);
    res.json(response);
  }
);

/**
 * Get resources current user has shared with others
 * @description Retrieves all files and folders that the current user has shared with other users
 * @route GET /api/v1/share/shared-by-me
 * @access Private
 * @param {AuthRequest} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with resources shared by user
 */
export const getMySharedResources = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user.id;

    logger.info(`Shared by me requested for user: ${userId}`);

    const response = await getSharedByMeService(userId);

    logger.info(`Retrieved resources shared by user: ${userId}`);
    res.json(response);
  }
);

/**
 * Remove permission for a user
 * @description Removes sharing permissions for a specific user on a resource
 * @route DELETE /api/v1/share/permission
 * @access Private
 * @param {AuthRequest} req - Express request object containing permission removal data
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with removal result
 */
export const removePermission = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { resourceId, resourceType, targetUserEmail } = req.body;
    const userId = req.user.id;

    logger.info(
      `Permission removal requested - Resource: ${resourceId} (${resourceType}), Target: ${targetUserEmail}, Remover: ${userId}`
    );

    const response = await removePermissionService({
      resourceId,
      resourceType,
      targetUserEmail,
      userId,
    });

    logger.info(
      `Permission removed successfully - Resource: ${resourceId} from ${targetUserEmail}`
    );
    res.json(response);
  }
);
