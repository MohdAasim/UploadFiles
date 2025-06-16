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

interface AuthRequest extends Request {
  user: JwtPayload;
}

export const shareResource = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { resourceId, resourceType, targetUserEmail, permission } = req.body;

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
    res.json(response);
  },
);

// Get who has access to a specific file
export const getFilePermissions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { fileId } = req.params;
    const userId = req.user.id;
    const response = await getFilePermissionService({ userId, fileId });
    res.json(response);
  },
);

// Get who has access to a specific folder
export const getFolderPermissions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { folderId } = req.params;
    const userId = req.user.id;

    const folder = await Folder.findById(folderId).populate(
      'sharedWith.user',
      'name email',
    );

    if (!folder) {
      throw createError('Folder not found', 404);
    }

    // Check if user is owner or has admin permission
    const isOwner = folder.owner.toString() === userId;
    const hasAdminAccess = folder.sharedWith.some(
      (entry: any) =>
        entry.user._id.toString() === userId && entry.permission === 'admin',
    );

    if (!isOwner && !hasAdminAccess) {
      throw createError('Only owner or admin can view permissions', 403);
    }

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
  },
);

// Get all files shared with current user
export const getSharedWithMe = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user.id;
    const response = await getSharedWithMeService(userId);
    res.json(response);
  },
);

// Get all resources current user has shared with others
export const getMySharedResources = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user.id;
    const response = await getSharedByMeService(userId);
    res.json(response);
  },
);

// Remove permission for a user
export const removePermission = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { resourceId, resourceType, targetUserEmail } = req.body;
    const userId = req.user.id;
    //issue we are not sending back anything yet
    await removePermissionService({
      resourceId,
      resourceType,
      targetUserEmail,
      userId,
    });
  },
);
