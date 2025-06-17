import { createError } from '../middlewares/errorHandler';
import {
  getFileMetaById,
  getFileVersoinHistoryByFileId,
} from '../repository/filemeta.repo';
import fs from 'fs';
import logger from '../utils/logger';

interface uploadNewVersionServicePropsType {
  fileId: string;
  userId: string;
  remark: string;
  newFile: Express.Multer.File;
}

/**
 * Upload new file version
 * @description Creates a new version of an existing file while preserving previous versions
 * @param {uploadNewVersionServicePropsType} versionData - New version upload data
 * @param {string} versionData.fileId - ID of the file to create new version for
 * @param {string} versionData.userId - ID of user uploading the version
 * @param {string} versionData.remark - Optional remark for the version
 * @param {Express.Multer.File} versionData.newFile - New file data from multer
 * @returns {Promise<Object>} New version upload result with file and version data
 * @throws {Error} If file not found, permission denied, or upload fails
 */
export async function uploadNewVersionService({
  newFile,
  fileId,
  remark,
  userId,
}: uploadNewVersionServicePropsType) {
  logger.info(
    `New version upload service initiated - File: ${fileId}, User: ${userId}, Size: ${newFile.size} bytes`
  );

  const file = await getFileMetaById(fileId);
  if (!file) {
    logger.warn(`Version upload failed - file not found: ${fileId}`);
    throw createError('File not found', 404);
  }

  logger.debug(
    `Checking permissions for version upload - File: ${fileId}, User: ${userId}`
  );

  // Check permissions: Only owner or users with edit/admin permission
  const isOwner = file.uploadedBy.toString() === userId;
  const hasEditAccess = file.sharedWith.some(
    (entry: any) =>
      entry.user.toString() === userId &&
      ['edit', 'admin'].includes(entry.permission)
  );

  if (!isOwner && !hasEditAccess) {
    logger.warn(
      `Version upload denied - insufficient permissions: File: ${fileId}, User: ${userId}`
    );
    throw createError('You do not have permission to upload new version', 403);
  }

  logger.debug(
    `Permissions validated for version upload - File: ${fileId}, User: ${userId}`
  );

  // Get next version number
  const currentVersionNumber = Math.max(
    ...file.versions.map(v => v.versionNumber),
    0
  );
  const newVersionNumber = currentVersionNumber + 1;

  logger.info(`Creating version ${newVersionNumber} for file: ${file.originalName}`);

  // Add current file as a version before updating
  file.versions.push({
    versionNumber: newVersionNumber,
    filename: file.filename,
    path: file.path,
    uploadedAt: new Date(),
    uploadedBy: userId as any,
    remark: remark || `Version ${newVersionNumber}`,
  });

  logger.debug(`Previous version saved as version ${newVersionNumber}`);

  // Update file metadata with new uploaded file
  file.filename = newFile.filename;
  file.path = newFile.path;
  file.size = newFile.size;
  file.mimetype = newFile.mimetype;

  await file.save();

  logger.info(
    `New version uploaded successfully - File: ${fileId}, Version: ${newVersionNumber}, Size: ${newFile.size} bytes`
  );

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

/**
 * Get file version history
 * @description Retrieves complete version history for a specific file
 * @param {Object} params - Version history parameters
 * @param {string} params.fileId - File ID to get version history for
 * @param {string} params.userId - User ID requesting the history
 * @returns {Promise<Object>} Version history data with file info and versions
 * @throws {Error} If file not found or user lacks access
 */
export async function versionHistoryService({
  fileId,
  userId,
}: {
  fileId: string;
  userId: string;
}) {
  logger.info(`Version history service requested - File: ${fileId}, User: ${userId}`);

  const file = await getFileVersoinHistoryByFileId(fileId);
  if (!file) {
    logger.warn(`Version history failed - file not found: ${fileId}`);
    throw createError('File not found', 404);
  }

  logger.debug(
    `Checking access permissions for version history - File: ${fileId}, User: ${userId}`
  );

  // Check permissions: Only allow if owner or shared
  const isOwner = file.uploadedBy.toString() === userId;
  const hasAccess = file.sharedWith.some(
    (entry: any) => entry.user.toString() === userId
  );

  if (!isOwner && !hasAccess) {
    logger.warn(
      `Version history denied - insufficient access: File: ${fileId}, User: ${userId}`
    );
    throw createError('You do not have permission to view this file', 403);
  }

  const currentVersion = Math.max(...file.versions.map(v => v.versionNumber), 1);
  const sortedVersions = file.versions.sort((a, b) => b.versionNumber - a.versionNumber);

  logger.info(
    `Version history retrieved - File: ${fileId}, Current version: ${currentVersion}, Total versions: ${sortedVersions.length}`
  );

  return {
    success: true,
    file: {
      id: file._id,
      originalName: file.originalName,
      currentVersion: currentVersion,
    },
    versions: sortedVersions,
  };
}

/**
 * Restore file version
 * @description Restores a specific version of a file as the current version
 * @param {Object} params - Version restore parameters
 * @param {string} params.fileId - File ID to restore version for
 * @param {string} params.userId - User ID performing the restore
 * @param {number} params.versionNumber - Version number to restore
 * @returns {Promise<Object>} Version restore result with file and restored version data
 * @throws {Error} If file/version not found, permission denied, or restore fails
 */
export async function restoreVersionService({
  fileId,
  userId,
  versionNumber,
}: {
  fileId: string;
  userId: string;
  versionNumber: number;
}) {
  logger.info(
    `Version restore service initiated - File: ${fileId}, Version: ${versionNumber}, User: ${userId}`
  );

  const file = await getFileMetaById(fileId);
  if (!file) {
    logger.warn(`Version restore failed - file not found: ${fileId}`);
    throw createError('File not found', 404);
  }

  logger.debug(
    `Checking permissions for version restore - File: ${fileId}, User: ${userId}`
  );

  // Check permissions: Only owner or users with edit/admin permission
  const isOwner = file.uploadedBy.toString() === userId;
  const hasEditAccess = file.sharedWith.some(
    (entry: any) =>
      entry.user.toString() === userId &&
      ['edit', 'admin'].includes(entry.permission)
  );

  if (!isOwner && !hasEditAccess) {
    logger.warn(
      `Version restore denied - insufficient permissions: File: ${fileId}, User: ${userId}`
    );
    throw createError('You do not have permission to restore versions', 403);
  }

  const version = file.versions.find(v => v.versionNumber === versionNumber);
  if (!version) {
    logger.warn(
      `Version restore failed - version not found: ${versionNumber} for file: ${fileId}`
    );
    throw createError('Version not found', 404);
  }

  logger.debug(
    `Found version ${versionNumber} for file: ${fileId}, checking file existence`
  );

  // Check if the version file still exists
  if (!fs.existsSync(version.path)) {
    logger.error(`Version restore failed - version file missing: ${version.path}`);
    throw createError('Version file not found on server', 404);
  }

  logger.info(`Restoring version ${versionNumber} for file: ${file.originalName}`);

  // Save current file as a new version before restoring
  const newVersionNumber =
    Math.max(...file.versions.map(v => v.versionNumber)) + 1;

  logger.debug(`Saving current state as version ${newVersionNumber} before restore`);

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

  logger.info(
    `Version restore completed successfully - File: ${fileId}, Restored version: ${versionNumber}, New backup version: ${newVersionNumber}`
  );

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
