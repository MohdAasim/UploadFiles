import mongoose from 'mongoose';
import { createError } from '../middlewares/errorHandler';
import { getUserByEmail } from '../repository/auth.repo';
import {
  getFileMetaByFileId,
  getFileMetaById,
  getFilesByUserID,
  getSharedFilesByUserID,
} from '../repository/filemeta.repo';
import {
  findFolderbyId,
  getFoldersByUserId,
  getSharedFoldersByUserId,
} from '../repository/folder.repo';
import { JwtPayload } from './jwt-service';
import { SocketServer } from '../socket/socketServer';
import logger from '../utils/logger';

interface shareResourcePropType {
  resourceId: string;
  resourceType: string;
  targetUserEmail: string;
  permission: string;
  user: JwtPayload;
  socketServer: SocketServer;
}

interface removePermissionPropType {
  resourceId: string;
  resourceType: string;
  targetUserEmail: string;
  userId: string;
}

/**
 * Share a resource with another user
 * @description Shares files or folders with specified permissions and sends real-time notifications
 * @param {shareResourcePropType} shareData - Resource sharing parameters
 * @param {string} shareData.resourceId - ID of the resource to share
 * @param {string} shareData.resourceType - Type of resource ('file' or 'folder')
 * @param {string} shareData.targetUserEmail - Email of user to share with
 * @param {string} shareData.permission - Permission level ('view', 'edit', 'admin')
 * @param {JwtPayload} shareData.user - User performing the sharing
 * @param {SocketServer} shareData.socketServer - Socket server for real-time notifications
 * @returns {Promise<Object>} Sharing result with success status
 * @throws {Error} If resource not found, user not found, or sharing fails
 */
export async function shareResourceService({
  permission,
  resourceId,
  resourceType,
  targetUserEmail,
  user,
  socketServer,
}: shareResourcePropType) {
  logger.info(
    `Share resource service initiated - Resource: ${resourceId} (${resourceType}), Target: ${targetUserEmail}, Permission: ${permission}, Sharer: ${user.id}`
  );

  // Find target user
  logger.debug(`Looking up target user: ${targetUserEmail}`);
  const targetUser = await getUserByEmail(targetUserEmail);
  if (!targetUser) {
    logger.warn(`Share failed - target user not found: ${targetUserEmail}`);
    throw createError('Target user not found', 404);
  }

  logger.debug(
    `Target user found - ID: ${targetUser._id}, Name: ${targetUser.name}`
  );

  let resource: any;
  if (resourceType === 'file') {
    logger.debug(`Processing file share for file: ${resourceId}`);
    resource = await getFileMetaById(resourceId);
  } else if (resourceType === 'folder') {
    logger.debug(`Processing folder share for folder: ${resourceId}`);
    resource = await findFolderbyId(resourceId);
  } else {
    logger.warn(`Invalid resource type for sharing: ${resourceType}`);
    throw createError('Invalid resource type. Must be "file" or "folder"', 400);
  }

  if (!resource) {
    logger.warn(
      `Share failed - resource not found: ${resourceId} (${resourceType})`
    );
    throw createError('Resource not found', 404);
  }

  logger.debug(
    `Resource found for sharing - ID: ${resourceId}, Type: ${resourceType}`
  );

  // Check if user is owner or has admin permission
  const isOwner =
    resourceType === 'file'
      ? resource.uploadedBy.toString() === user.id
      : resource.owner.toString() === user.id;

  if (!isOwner) {
    logger.debug(
      `User is not owner, checking admin permissions - Resource: ${resourceId}, User: ${user.id}`
    );
    // Check if user has admin permission for this resource
    const hasAdminAccess = resource.sharedWith.some(
      (entry: any) =>
        entry.user.toString() === user.id && entry.permission === 'admin'
    );

    if (!hasAdminAccess) {
      logger.warn(
        `Share denied - insufficient permissions: Resource: ${resourceId}, User: ${user.id}`
      );
      throw createError('Only owner or admin can share this resource', 403);
    }
    logger.debug(
      `Admin permissions validated for sharing - Resource: ${resourceId}, User: ${user.id}`
    );
  }

  // Validate permission
  const validPermissions = ['view', 'edit', 'admin'];
  if (!validPermissions.includes(permission)) {
    logger.warn(`Invalid permission level for sharing: ${permission}`);
    throw createError('Invalid permission. Must be view, edit, or admin', 400);
  }

  logger.debug(`Permission level validated: ${permission}`);

  // Convert targetUser._id to string for comparison
  const targetUserId = (targetUser._id as mongoose.Types.ObjectId).toString();

  // Check if already shared
  const alreadyShared = resource.sharedWith.find(
    (entry: any) => entry.user.toString() === targetUserId
  );

  if (alreadyShared) {
    logger.info(
      `Updating existing share permission - Resource: ${resourceId}, User: ${targetUserEmail}, Old: ${alreadyShared.permission}, New: ${permission}`
    );
    alreadyShared.permission = permission; // Update permission
  } else {
    logger.info(
      `Adding new share - Resource: ${resourceId}, User: ${targetUserEmail}, Permission: ${permission}`
    );
    resource.sharedWith.push({
      user: targetUser._id as mongoose.Types.ObjectId,
      permission,
    });
  }

  await resource.save();
  logger.info(
    `Resource sharing saved to database - Resource: ${resourceId} with ${targetUserEmail}`
  );

  // Notify target user in real-time
  logger.debug(`Sending real-time notification for resource share`);
  socketServer.notifyFileShared(
    resourceId,
    resourceType,
    targetUserId,
    {
      id: user.id,
      email: user.email,
    },
    permission
  );
  logger.debug(`Real-time notification sent for resource share`);

  logger.info(
    `Share resource service completed successfully - Resource: ${resourceId} (${resourceType}) with ${targetUserEmail}`
  );

  return {
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
  };
}

/**
 * Get file permissions
 * @description Retrieves permissions for a specific file
 * @param {Object} params - Parameters object
 * @param {string} params.userId - User ID requesting permissions
 * @param {string} params.fileId - File ID to get permissions for
 * @returns {Promise<Object>} File permissions data
 * @throws {Error} If file not found or user lacks permissions
 */
export async function getFilePermissionService({
  userId,
  fileId,
}: {
  userId: string;
  fileId: string;
}) {
  logger.info(`File permissions service requested - File: ${fileId}, User: ${userId}`);

  const file = await getFileMetaByFileId(fileId);

  if (!file) {
    logger.warn(`File permissions failed - file not found: ${fileId}`);
    throw createError('File not found', 404);
  }

  logger.debug(`File found for permissions check - ID: ${fileId}, Name: ${file.originalName}`);

  // Check if user is owner or has admin permission
  const isOwner = file.uploadedBy.toString() === userId;
  const hasAdminAccess = file.sharedWith.some(
    (entry: any) =>
      entry.user._id.toString() === userId && entry.permission === 'admin'
  );

  if (!isOwner && !hasAdminAccess) {
    logger.warn(`File permissions denied - insufficient access: File: ${fileId}, User: ${userId}`);
    throw createError('Only owner or admin can view permissions', 403);
  }

  logger.debug(`Permissions access validated for file: ${fileId}, User: ${userId}`);

  const permissions = file.sharedWith.map((entry: any) => ({
    user: {
      id: entry.user._id,
      name: entry.user.name,
      email: entry.user.email,
    },
    permission: entry.permission,
  }));

  logger.info(`File permissions retrieved successfully - File: ${fileId}, Permissions: ${permissions.length}`);

  return {
    success: true,
    file: {
      id: file._id,
      name: file.originalName,
      owner: isOwner ? 'You' : 'Someone else',
    },
    permissions,
  };
}

/**
 * Get resources shared with user
 * @description Retrieves all files and folders shared with the specified user
 * @param {string} userId - User ID to get shared resources for
 * @returns {Promise<Object>} Shared resources data
 */
export async function getSharedWithMeService(userId: string) {
  logger.info(`Shared with me service requested for user: ${userId}`);

  // Find files shared with this user
  logger.debug(`Fetching files shared with user: ${userId}`);
  const sharedFiles = await getFilesByUserID(userId);

  // Find folders shared with this user
  logger.debug(`Fetching folders shared with user: ${userId}`);
  const sharedFolders = await getFoldersByUserId(userId);

  const files = sharedFiles.map((file: any) => {
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
        email: file.uploadedBy.email,
      },
      permission: userPermission?.permission,
      sharedAt: file.createdAt,
    };
  });

  const folders = sharedFolders.map((folder: any) => {
    const userPermission = folder.sharedWith.find(
      (entry: any) => entry.user.toString() === userId
    );
    return {
      id: folder._id,
      name: folder.name,
      path: folder.path,
      owner: {
        name: folder.owner.name,
        email: folder.owner.email,
      },
      permission: userPermission?.permission,
      sharedAt: folder.createdAt,
    };
  });

  logger.info(`Shared with me retrieved - Files: ${files.length}, Folders: ${folders.length}, User: ${userId}`);

  return {
    success: true,
    sharedWithMe: {
      files,
      folders,
    },
  };
}

/**
 * Get resources shared by user
 * @description Retrieves all files and folders that the user has shared with others
 * @param {string} userId - User ID to get shared resources by
 * @returns {Promise<Object>} Resources shared by user
 */
export async function getSharedByMeService(userId: string) {
  logger.info(`Shared by me service requested for user: ${userId}`);

  // Find files owned by user that are shared
  logger.debug(`Fetching files shared by user: ${userId}`);
  const mySharedFiles = await getSharedFilesByUserID(userId);

  // Find folders owned by user that are shared
  logger.debug(`Fetching folders shared by user: ${userId}`);
  const mySharedFolders = await getSharedFoldersByUserId(userId);

  const files = mySharedFiles.map((file: any) => ({
    id: file._id,
    name: file.originalName,
    size: file.size,
    mimetype: file.mimetype,
    sharedWith: file.sharedWith.map((entry: any) => ({
      user: {
        id: entry.user._id,
        name: entry.user.name,
        email: entry.user.email,
      },
      permission: entry.permission,
    })),
  }));

  const folders = mySharedFolders.map((folder: any) => ({
    id: folder._id,
    name: folder.name,
    path: folder.path,
    sharedWith: folder.sharedWith.map((entry: any) => ({
      user: {
        id: entry.user._id,
        name: entry.user.name,
        email: entry.user.email,
      },
      permission: entry.permission,
    })),
  }));

  logger.info(`Shared by me retrieved - Files: ${files.length}, Folders: ${folders.length}, User: ${userId}`);

  return {
    success: true,
    mySharedResources: {
      files,
      folders,
    },
  };
}

/**
 * Remove sharing permission
 * @description Removes sharing permissions for a user on a specific resource
 * @param {removePermissionPropType} params - Permission removal parameters
 * @param {string} params.resourceId - Resource ID to remove permission from
 * @param {string} params.resourceType - Type of resource ('file' or 'folder')
 * @param {string} params.targetUserEmail - Email of user to remove permission from
 * @param {string} params.userId - ID of user performing the removal
 * @returns {Promise<Object>} Permission removal result
 * @throws {Error} If resource not found, user not found, or removal fails
 */
export async function removePermissionService({
  resourceId,
  resourceType,
  targetUserEmail,
  userId,
}: removePermissionPropType) {
  logger.info(
    `Remove permission service initiated - Resource: ${resourceId} (${resourceType}), Target: ${targetUserEmail}, Remover: ${userId}`
  );

  // Find target user
  logger.debug(`Looking up target user: ${targetUserEmail}`);
  const targetUser = await getUserByEmail(targetUserEmail);
  if (!targetUser) {
    logger.warn(`Permission removal failed - target user not found: ${targetUserEmail}`);
    throw createError('Target user not found', 404);
  }

  logger.debug(`Target user found for permission removal - ID: ${targetUser._id}, Name: ${targetUser.name}`);

  let resource: any;
  if (resourceType === 'file') {
    logger.debug(`Processing file permission removal for file: ${resourceId}`);
    resource = await getFileMetaById(resourceId);
  } else if (resourceType === 'folder') {
    logger.debug(`Processing folder permission removal for folder: ${resourceId}`);
    resource = await findFolderbyId(resourceId);
  } else {
    logger.warn(`Invalid resource type for permission removal: ${resourceType}`);
    throw createError('Invalid resource type', 400);
  }

  if (!resource) {
    logger.warn(`Permission removal failed - resource not found: ${resourceId} (${resourceType})`);
    throw createError('Resource not found', 404);
  }

  logger.debug(`Resource found for permission removal - ID: ${resourceId}, Type: ${resourceType}`);

  // Check if user is owner or has admin permission
  const isOwner =
    resourceType === 'file'
      ? resource.uploadedBy.toString() === userId
      : resource.owner.toString() === userId;

  if (!isOwner) {
    logger.debug(`User is not owner, checking admin permissions for removal - Resource: ${resourceId}, User: ${userId}`);
    const hasAdminAccess = resource.sharedWith.some(
      (entry: any) =>
        entry.user.toString() === userId && entry.permission === 'admin'
    );
    if (!hasAdminAccess) {
      logger.warn(`Permission removal denied - insufficient permissions: Resource: ${resourceId}, User: ${userId}`);
      throw createError('Only owner or admin can remove permissions', 403);
    }
    logger.debug(`Admin permissions validated for removal - Resource: ${resourceId}, User: ${userId}`);
  }

  // Remove the user from sharedWith array
  const targetUserId = (targetUser._id as mongoose.Types.ObjectId).toString();
  logger.debug(`Removing permission for user: ${targetUserId} from resource: ${resourceId}`);
  
  resource.sharedWith = resource.sharedWith.filter(
    (entry: any) => entry.user.toString() !== targetUserId
  );

  await resource.save();
  logger.info(`Permission removed successfully - Resource: ${resourceId} (${resourceType}) from ${targetUserEmail}`);

  return {
    success: true,
    message: `Permission removed successfully from ${targetUserEmail}`,
  };
}
