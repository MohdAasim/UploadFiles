import { Request, Response } from 'express';
import FileMeta from '../models/FileMeta';
import Folder from '../models/Folder';
import User from '../models/User';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: any;
}

export const shareResource = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { resourceId, resourceType, targetUserEmail, permission } = req.body;
    const ownerId = req.user.id;

    if (!ownerId) {
      throw createError('User not found', 401);
    }

    // Find target user
    const targetUser = await User.findOne({ email: targetUserEmail });
    if (!targetUser) {
      throw createError('Target user not found', 404);
    }

    let resource: any;
    if (resourceType === 'file') {
      resource = await FileMeta.findById(resourceId);
    } else if (resourceType === 'folder') {
      resource = await Folder.findById(resourceId);
    } else {
      throw createError('Invalid resource type. Must be "file" or "folder"', 400);
    }

    if (!resource) {
      throw createError('Resource not found', 404);
    }

    // Check if user is owner or has admin permission
    const isOwner =
      resourceType === 'file'
        ? resource.uploadedBy.toString() === ownerId
        : resource.owner.toString() === ownerId;

    if (!isOwner) {
      // Check if user has admin permission for this resource
      const hasAdminAccess = resource.sharedWith.some(
        (entry: any) => entry.user.toString() === ownerId && entry.permission === 'admin',
      );

      if (!hasAdminAccess) {
        throw createError('Only owner or admin can share this resource', 403);
      }
    }

    // Validate permission
    const validPermissions = ['view', 'edit', 'admin'];
    if (!validPermissions.includes(permission)) {
      throw createError('Invalid permission. Must be view, edit, or admin', 400);
    }

    // Convert targetUser._id to string for comparison
    const targetUserId = (targetUser._id as mongoose.Types.ObjectId).toString();

    // Check if already shared
    const alreadyShared = resource.sharedWith.find(
      (entry: any) => entry.user.toString() === targetUserId,
    );

    if (alreadyShared) {
      alreadyShared.permission = permission; // Update permission
    } else {
      resource.sharedWith.push({ 
        user: targetUser._id as mongoose.Types.ObjectId, 
        permission 
      });
    }

    await resource.save();

    // Get socket server instance
    const socketServer = req.app.get('socketServer');
    
    // Notify target user in real-time
    socketServer.notifyFileShared(
      resourceId,
      resourceType,
      targetUserId,
      {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      permission
    );

    res.json({
      success: true,
      message: 'Resource shared successfully',
      sharedWith: {
        user: {
          id: targetUserId,
          name: targetUser.name,
          email: targetUser.email,
        },
        permission,
        resourceType,
      },
    });
  },
);

// Get who has access to a specific file
export const getFilePermissions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { fileId } = req.params;
    const userId = req.user.id;

    const file = await FileMeta.findById(fileId).populate('sharedWith.user', 'name email');
    
    if (!file) {
      throw createError('File not found', 404);
    }

    // Check if user is owner or has admin permission
    const isOwner = file.uploadedBy.toString() === userId;
    const hasAdminAccess = file.sharedWith.some(
      (entry: any) => entry.user._id.toString() === userId && entry.permission === 'admin'
    );

    if (!isOwner && !hasAdminAccess) {
      throw createError('Only owner or admin can view permissions', 403);
    }

    res.json({
      success: true,
      file: {
        id: file._id,
        name: file.originalName,
        owner: isOwner ? 'You' : 'Someone else'
      },
      permissions: file.sharedWith.map((entry: any) => ({
        user: {
          id: entry.user._id,
          name: entry.user.name,
          email: entry.user.email
        },
        permission: entry.permission
      }))
    });
  }
);

// Get who has access to a specific folder
export const getFolderPermissions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { folderId } = req.params;
    const userId = req.user.id;

    const folder = await Folder.findById(folderId).populate('sharedWith.user', 'name email');
    
    if (!folder) {
      throw createError('Folder not found', 404);
    }

    // Check if user is owner or has admin permission
    const isOwner = folder.owner.toString() === userId;
    const hasAdminAccess = folder.sharedWith.some(
      (entry: any) => entry.user._id.toString() === userId && entry.permission === 'admin'
    );

    if (!isOwner && !hasAdminAccess) {
      throw createError('Only owner or admin can view permissions', 403);
    }

    res.json({
      success: true,
      folder: {
        id: folder._id,
        name: folder.name,
        owner: isOwner ? 'You' : 'Someone else'
      },
      permissions: folder.sharedWith.map((entry: any) => ({
        user: {
          id: entry.user._id,
          name: entry.user.name,
          email: entry.user.email
        },
        permission: entry.permission
      }))
    });
  }
);

// Get all files shared with current user
export const getSharedWithMe = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user.id;

    // Find files shared with this user
    const sharedFiles = await FileMeta.find({
      'sharedWith.user': userId
    }).populate('uploadedBy', 'name email');

    // Find folders shared with this user
    const sharedFolders = await Folder.find({
      'sharedWith.user': userId
    }).populate('owner', 'name email');

    res.json({
      success: true,
      sharedWithMe: {
        files: sharedFiles.map((file: any) => {
          const userPermission = file.sharedWith.find(
            (entry: any) => entry.user.toString() === userId
          );
          return {
            id: file._id,
            name: file.originalName,
            size: file.size,
            mimetype: file.mimetype,
            owner: {
              name: file.uploadedBy.name,
              email: file.uploadedBy.email
            },
            permission: userPermission?.permission,
            sharedAt: file.createdAt
          };
        }),
        folders: sharedFolders.map((folder: any) => {
          const userPermission = folder.sharedWith.find(
            (entry: any) => entry.user.toString() === userId
          );
          return {
            id: folder._id,
            name: folder.name,
            path: folder.path,
            owner: {
              name: folder.owner.name,
              email: folder.owner.email
            },
            permission: userPermission?.permission,
            sharedAt: folder.createdAt
          };
        })
      }
    });
  }
);

// Get all resources current user has shared with others
export const getMySharedResources = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user.id;

    // Find files owned by user that are shared
    const mySharedFiles = await FileMeta.find({
      uploadedBy: userId,
      'sharedWith.0': { $exists: true } // Has at least one shared entry
    }).populate('sharedWith.user', 'name email');

    // Find folders owned by user that are shared
    const mySharedFolders = await Folder.find({
      owner: userId,
      'sharedWith.0': { $exists: true } // Has at least one shared entry
    }).populate('sharedWith.user', 'name email');

    res.json({
      success: true,
      mySharedResources: {
        files: mySharedFiles.map((file: any) => ({
          id: file._id,
          name: file.originalName,
          size: file.size,
          mimetype: file.mimetype,
          sharedWith: file.sharedWith.map((entry: any) => ({
            user: {
              id: entry.user._id,
              name: entry.user.name,
              email: entry.user.email
            },
            permission: entry.permission
          }))
        })),
        folders: mySharedFolders.map((folder: any) => ({
          id: folder._id,
          name: folder.name,
          path: folder.path,
          sharedWith: folder.sharedWith.map((entry: any) => ({
            user: {
              id: entry.user._id,
              name: entry.user.name,
              email: entry.user.email
            },
            permission: entry.permission
          }))
        }))
      }
    });
  }
);

// Remove permission for a user
export const removePermission = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { resourceId, resourceType, targetUserEmail } = req.body;
    const userId = req.user.id;

    // Find target user
    const targetUser = await User.findOne({ email: targetUserEmail });
    if (!targetUser) {
      throw createError('Target user not found', 404);
    }

    let resource: any;
    if (resourceType === 'file') {
      resource = await FileMeta.findById(resourceId);
    } else if (resourceType === 'folder') {
      resource = await Folder.findById(resourceId);
    } else {
      throw createError('Invalid resource type', 400);
    }

    if (!resource) {
      throw createError('Resource not found', 404);
    }

    // Check if user is owner or has admin permission
    const isOwner = resourceType === 'file' 
      ? resource.uploadedBy.toString() === userId 
      : resource.owner.toString() === userId;

    if (!isOwner) {
      const hasAdminAccess = resource.sharedWith.some(
        (entry: any) => entry.user.toString() === userId && entry.permission === 'admin'
      );
      if (!hasAdminAccess) {
        throw createError('Only owner or admin can remove permissions', 403);
      }
    }

    // Remove the user from sharedWith array
    const targetUserId = (targetUser._id as mongoose.Types.ObjectId).toString();
    resource.sharedWith = resource.sharedWith.filter(
      (entry: any) => entry.user.toString() !== targetUserId
    );
});
