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

export async function shareResourceService({
  permission,
  resourceId,
  resourceType,
  targetUserEmail,
  user,
  socketServer,
}: shareResourcePropType) {
  // Find target user
  const targetUser = await getUserByEmail(targetUserEmail);
  if (!targetUser) {
    throw createError('Target user not found', 404);
  }

  let resource: any;
  if (resourceType === 'file') {
    resource = await getFileMetaById(resourceId);
  } else if (resourceType === 'folder') {
    resource = await findFolderbyId(resourceId);
  } else {
    throw createError('Invalid resource type. Must be "file" or "folder"', 400);
  }

  if (!resource) {
    throw createError('Resource not found', 404);
  }

  // Check if user is owner or has admin permission
  const isOwner =
    resourceType === 'file'
      ? resource.uploadedBy.toString() === user.id
      : resource.owner.toString() === user.id;

  if (!isOwner) {
    // Check if user has admin permission for this resource
    const hasAdminAccess = resource.sharedWith.some(
      (entry: any) =>
        entry.user.toString() === user.id && entry.permission === 'admin',
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
      permission,
    });
  }

  await resource.save();

  // Notify target user in real-time
  socketServer.notifyFileShared(
    resourceId,
    resourceType,
    targetUserId,
    {
      id: user.id,
      email: user.email,
    },
    permission,
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

export async function getFilePermissionService({
  userId,
  fileId,
}: {
  userId: string;
  fileId: string;
}) {
  const file = await getFileMetaByFileId(fileId);

  if (!file) {
    throw createError('File not found', 404);
  }

  // Check if user is owner or has admin permission
  const isOwner = file.uploadedBy.toString() === userId;
  const hasAdminAccess = file.sharedWith.some(
    (entry: any) =>
      entry.user._id.toString() === userId && entry.permission === 'admin',
  );

  if (!isOwner && !hasAdminAccess) {
    throw createError('Only owner or admin can view permissions', 403);
  }
  const permissions = file.sharedWith.map((entry: any) => ({
    user: {
      id: entry.user._id,
      name: entry.user.name,
      email: entry.user.email,
    },
    permission: entry.permission,
  }));

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

export async function getSharedWithMeService(userId: string) {
  // Find files shared with this user
  const sharedFiles = await getFilesByUserID(userId);

  // Find folders shared with this user
  const sharedFolders = await getFoldersByUserId(userId);

  const files = sharedFiles.map((file: any) => {
    const userPermission = file.sharedWith.find(
      (entry: any) => entry.user.toString() === userId,
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
      (entry: any) => entry.user.toString() === userId,
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

  return {
    success: true,
    sharedWithMe: {
      files,
      folders,
    },
  };
}

export async function getSharedByMeService(userId: string) {
  // Find files owned by user that are shared
  const mySharedFiles = await getSharedFilesByUserID(userId);

  // Find folders owned by user that are shared
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
  return {
    success: true,
    mySharedResources: {
      files,
      folders,
    },
  };
}

export async function removePermissionService({
  resourceId,
  resourceType,
  targetUserEmail,
  userId,
}: removePermissionPropType) {
  // Find target user
  const targetUser = await getUserByEmail(targetUserEmail);
  if (!targetUser) {
    throw createError('Target user not found', 404);
  }

  let resource: any;
  if (resourceType === 'file') {
    resource = await getFileMetaById(resourceId);
  } else if (resourceType === 'folder') {
    resource = await findFolderbyId(resourceId);
  } else {
    throw createError('Invalid resource type', 400);
  }

  if (!resource) {
    throw createError('Resource not found', 404);
  }

  // Check if user is owner or has admin permission
  const isOwner =
    resourceType === 'file'
      ? resource.uploadedBy.toString() === userId
      : resource.owner.toString() === userId;

  if (!isOwner) {
    const hasAdminAccess = resource.sharedWith.some(
      (entry: any) =>
        entry.user.toString() === userId && entry.permission === 'admin',
    );
    if (!hasAdminAccess) {
      throw createError('Only owner or admin can remove permissions', 403);
    }
  }

  // Remove the user from sharedWith array
  const targetUserId = (targetUser._id as mongoose.Types.ObjectId).toString();
  resource.sharedWith = resource.sharedWith.filter(
    (entry: any) => entry.user.toString() !== targetUserId,
  );
}
