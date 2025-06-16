import { createError } from '../middlewares/errorHandler';
import {
  getFileMetaById,
  getFileVersoinHistoryByFileId,
} from '../repository/filemeta.repo';
import fs from 'fs';

interface uploadNewVersionServicePropsType {
  fileId: string;
  userId: string;
  remark: string;
  newFile: Express.Multer.File;
}

export async function uploadNewVersionService({
  newFile,
  fileId,
  remark,
  userId,
}: uploadNewVersionServicePropsType) {
  const file = await getFileMetaById(fileId);
  if (!file) {
    throw createError('File not found', 404);
  }

  // Check permissions: Only owner or users with edit/admin permission
  const isOwner = file.uploadedBy.toString() === userId;
  const hasEditAccess = file.sharedWith.some(
    (entry: any) =>
      entry.user.toString() === userId &&
      ['edit', 'admin'].includes(entry.permission),
  );

  if (!isOwner && !hasEditAccess) {
    throw createError('You do not have permission to upload new version', 403);
  }

  // Get next version number
  const currentVersionNumber = Math.max(
    ...file.versions.map(v => v.versionNumber),
    0,
  );
  const newVersionNumber = currentVersionNumber + 1;

  // Add current file as a version before updating
  file.versions.push({
    versionNumber: newVersionNumber,
    filename: file.filename,
    path: file.path,
    uploadedAt: new Date(),
    uploadedBy: userId as any,
    remark: remark || `Version ${newVersionNumber}`,
  });

  // Update file metadata with new uploaded file
  file.filename = newFile.filename;
  file.path = newFile.path;
  file.size = newFile.size;
  file.mimetype = newFile.mimetype;

  await file.save();
  return {
    success: true,
    message: 'New version uploaded successfully',
    file,
    newVersion: {
      versionNumber: newVersionNumber,
      filename: newFile.filename,
      remark: remark || `Version ${newVersionNumber}`,
    },
  };
}

export async function versionHistoryService({
  fileId,
  userId,
}: {
  fileId: string;
  userId: string;
}) {
  const file = await getFileVersoinHistoryByFileId(fileId);
  if (!file) {
    throw createError('File not found', 404);
  }

  // Check permissions: Only allow if owner or shared
  const isOwner = file.uploadedBy.toString() === userId;
  const hasAccess = file.sharedWith.some(
    (entry: any) => entry.user.toString() === userId,
  );

  if (!isOwner && !hasAccess) {
    throw createError('You do not have permission to view this file', 403);
  }

  return {
    success: true,
    file: {
      id: file._id,
      originalName: file.originalName,
      currentVersion: Math.max(...file.versions.map(v => v.versionNumber), 1),
    },
    versions: file.versions.sort((a, b) => b.versionNumber - a.versionNumber),
  };
}

export async function restoreVersionService({
  fileId,
  userId,
  versionNumber,
}: {
  fileId: string;
  userId: string;
  versionNumber: number;
}) {
  const file = await getFileMetaById(fileId);
  if (!file) {
    throw createError('File not found', 404);
  }

  // Check permissions: Only owner or users with edit/admin permission
  const isOwner = file.uploadedBy.toString() === userId;
  const hasEditAccess = file.sharedWith.some(
    (entry: any) =>
      entry.user.toString() === userId &&
      ['edit', 'admin'].includes(entry.permission),
  );

  if (!isOwner && !hasEditAccess) {
    throw createError('You do not have permission to restore versions', 403);
  }

  const version = file.versions.find(v => v.versionNumber === versionNumber);
  if (!version) {
    throw createError('Version not found', 404);
  }

  // Check if the version file still exists
  if (!fs.existsSync(version.path)) {
    throw createError('Version file not found on server', 404);
  }

  // Save current file as a new version before restoring
  const newVersionNumber =
    Math.max(...file.versions.map(v => v.versionNumber)) + 1;
  file.versions.push({
    versionNumber: newVersionNumber,
    filename: file.filename,
    path: file.path,
    uploadedAt: new Date(),
    uploadedBy: userId as any,
    remark: 'Auto-saved before restore',
  });

  // Restore from chosen version
  file.filename = version.filename;
  file.path = version.path;
  file.size = fs.statSync(version.path).size;
  // Keep original mimetype or derive from file extension if needed

  await file.save();

  return {
    success: true,
    message: `Version ${versionNumber} restored successfully`,
    file,
    restoredVersion: {
      versionNumber,
      filename: version.filename,
      remark: version.remark,
    },
  };
}
