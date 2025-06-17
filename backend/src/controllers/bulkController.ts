import { Request, Response } from 'express';
import FileMeta from '../models/FileMeta';
import Folder from '../models/Folder';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import logger from '../utils/logger';

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface AuthRequest extends Request {
  user?: UserData;
}

interface BulkActionRequestBody {
  action: 'delete' | 'move' | 'download';
  files?: string[];
  folders?: string[];
  targetFolder?: string;
}

interface BulkActionRequest extends AuthRequest {
  body: BulkActionRequestBody;
}

interface FileDownloadInfo {
  id: string;
  name: string;
  downloadUrl: string;
  size: number;
  mimetype: string;
}

interface BulkDownloadResult {
  files: FileDownloadInfo[];
  folders: string[];
}

interface BulkDeleteResult {
  deletedFiles: number;
  deletedFolders: number;
}

/**
 * Helper function for recursive folder deletion
 * @description Recursively deletes all files and subfolders within a folder
 * @param {string} folderId - ID of the folder to delete recursively
 * @param {string} userId - ID of the user performing the deletion
 * @returns {Promise<BulkDeleteResult>} Object containing count of deleted files and folders
 */
const deleteFolderRecursively = async (
  folderId: string,
  userId: string
): Promise<BulkDeleteResult> => {
  let deletedFiles = 0;
  let deletedFolders = 0;

  logger.debug(`Starting recursive deletion of folder: ${folderId} for user: ${userId}`);

  // Delete all files in this folder
  const files = await FileMeta.find({
    parentFolder: folderId,
    uploadedBy: userId,
  });

  logger.info(`Found ${files.length} files to delete in folder: ${folderId}`);

  for (const file of files) {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        logger.debug(`Deleted file from filesystem: ${file.path}`);
      }
      // Delete all versions
      file.versions.forEach(version => {
        if (fs.existsSync(version.path)) {
          fs.unlinkSync(version.path);
          logger.debug(`Deleted file version from filesystem: ${version.path}`);
        }
      });
      await FileMeta.findByIdAndDelete(file._id);
      deletedFiles++;
      logger.debug(`Deleted file from database: ${file._id}`);
    } catch (error) {
      logger.error(`Failed to delete file ${file.id}:`, error);
    }
  }

  // Delete all subfolders recursively
  const subfolders = await Folder.find({ parent: folderId, owner: userId });
  logger.info(`Found ${subfolders.length} subfolders to delete in folder: ${folderId}`);

  for (const subfolder of subfolders) {
    const subfolderResults = await deleteFolderRecursively(
      subfolder.id, // Use .id instead of ._id.toString()
      userId
    );
    deletedFiles += subfolderResults.deletedFiles;
    deletedFolders += subfolderResults.deletedFolders;

    await Folder.findByIdAndDelete(subfolder._id);
    deletedFolders++;
    logger.debug(`Deleted subfolder from database: ${subfolder._id}`);
  }

  logger.info(`Completed recursive deletion of folder: ${folderId} - Files: ${deletedFiles}, Folders: ${deletedFolders}`);
  return { deletedFiles, deletedFolders };
};

/**
 * Perform bulk actions on files and folders
 * @description Handles bulk delete, move, and download operations for multiple files and folders
 * @route POST /api/v1/bulk
 * @access Private
 * @param {BulkActionRequest} req - Express request object containing bulk action data
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with bulk action results
 */
export const bulkAction = asyncHandler(
  async (req: BulkActionRequest, res: Response): Promise<void> => {
    const { action, files = [], folders = [], targetFolder } = req.body;
    const userId = req.user?.id;

    logger.info(`Bulk action initiated - Action: ${action}, User: ${userId}, Files: ${files.length}, Folders: ${folders.length}`);

    if (!userId) {
      logger.warn('Bulk action attempted without authentication');
      throw createError('User not authenticated', 401);
    }

    if (!Array.isArray(files) && !Array.isArray(folders)) {
      logger.warn('Bulk action attempted with invalid data structure');
      throw createError('No files or folders provided', 400);
    }

    if (files.length === 0 && folders.length === 0) {
      logger.warn('Bulk action attempted with no items selected');
      throw createError('No items selected for bulk action', 400);
    }

    // Bulk Delete
    if (action === 'delete') {
      logger.info(`Starting bulk delete operation for user: ${userId}`);
      let totalDeletedFiles = 0;
      let totalDeletedFolders = 0;

      // Delete files
      if (Array.isArray(files) && files.length > 0) {
        logger.info(`Deleting ${files.length} files`);
        for (const fileId of files) {
          try {
            const file = await FileMeta.findById(fileId);
            if (file && file.uploadedBy.toString() === userId) {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                logger.debug(`Deleted file from filesystem: ${file.path}`);
              }
              // Delete all versions
              file.versions.forEach(version => {
                if (fs.existsSync(version.path)) {
                  fs.unlinkSync(version.path);
                  logger.debug(`Deleted file version: ${version.path}`);
                }
              });
              await FileMeta.findByIdAndDelete(fileId);
              totalDeletedFiles++;
              logger.debug(`Successfully deleted file: ${fileId}`);
            } else {
              logger.warn(`File not found or access denied: ${fileId}`);
            }
          } catch (error) {
            logger.error(`Failed to delete file ${fileId}:`, error);
          }
        }
      }

      // Delete folders recursively
      if (Array.isArray(folders) && folders.length > 0) {
        logger.info(`Deleting ${folders.length} folders recursively`);
        for (const folderId of folders) {
          try {
            const folder = await Folder.findById(folderId);
            if (folder && folder.owner.toString() === userId) {
              const folderResults = await deleteFolderRecursively(
                folderId,
                userId
              );
              totalDeletedFiles += folderResults.deletedFiles;
              totalDeletedFolders += folderResults.deletedFolders;

              await Folder.findByIdAndDelete(folderId);
              totalDeletedFolders++;
              logger.debug(`Successfully deleted folder: ${folderId}`);
            } else {
              logger.warn(`Folder not found or access denied: ${folderId}`);
            }
          } catch (error) {
            logger.error(`Failed to delete folder ${folderId}:`, error);
          }
        }
      }

      logger.info(`Bulk delete completed - Files: ${totalDeletedFiles}, Folders: ${totalDeletedFolders}`);
      res.json({
        success: true,
        message: `Successfully deleted ${totalDeletedFiles} file(s) and ${totalDeletedFolders} folder(s)`,
        data: {
          deletedFiles: totalDeletedFiles,
          deletedFolders: totalDeletedFolders,
        },
      });
      return;
    }

    // Bulk Move
    if (action === 'move') {
      logger.info(`Starting bulk move operation for user: ${userId} to target: ${targetFolder}`);
      
      if (!targetFolder) {
        logger.warn('Bulk move attempted without target folder');
        throw createError('No target folder provided', 400);
      }

      // Validate target folder if it's not root
      if (targetFolder !== 'root') {
        const targetFolderDoc = await Folder.findById(targetFolder);
        if (!targetFolderDoc || targetFolderDoc.owner.toString() !== userId) {
          logger.warn(`Invalid target folder for move operation: ${targetFolder}`);
          throw createError('Invalid target folder', 400);
        }
        logger.debug(`Target folder validated: ${targetFolder}`);
      }

      let movedFiles = 0;
      let movedFolders = 0;

      // Move files
      if (Array.isArray(files) && files.length > 0) {
        logger.info(`Moving ${files.length} files to ${targetFolder}`);
        for (const fileId of files) {
          try {
            const file = await FileMeta.findById(fileId);
            if (file && file.uploadedBy.toString() === userId) {
              file.parentFolder =
                targetFolder === 'root'
                  ? null
                  : new mongoose.Types.ObjectId(targetFolder);
              await file.save();
              movedFiles++;
              logger.debug(`Successfully moved file: ${fileId} to ${targetFolder}`);
            } else {
              logger.warn(`File not found or access denied for move: ${fileId}`);
            }
          } catch (error) {
            logger.error(`Failed to move file ${fileId}:`, error);
          }
        }
      }

      // Move folders
      if (Array.isArray(folders) && folders.length > 0) {
        logger.info(`Moving ${folders.length} folders to ${targetFolder}`);
        for (const folderId of folders) {
          try {
            const folder = await Folder.findById(folderId);
            if (folder && folder.owner.toString() === userId) {
              // Prevent moving folder into itself or its descendants
              if (
                targetFolder !== 'root' &&
                (await isDescendantFolder(folderId, targetFolder))
              ) {
                logger.warn(`Cannot move folder ${folderId} into its descendant ${targetFolder}`);
                continue;
              }

              // Convert string to ObjectId or set to null for root
              folder.parent =
                targetFolder === 'root'
                  ? null
                  : new mongoose.Types.ObjectId(targetFolder);
              await folder.save();
              movedFolders++;
              logger.debug(`Successfully moved folder: ${folderId} to ${targetFolder}`);
            } else {
              logger.warn(`Folder not found or access denied for move: ${folderId}`);
            }
          } catch (error) {
            logger.error(`Failed to move folder ${folderId}:`, error);
          }
        }
      }

      logger.info(`Bulk move completed - Files: ${movedFiles}, Folders: ${movedFolders}`);
      res.json({
        success: true,
        message: `Successfully moved ${movedFiles} file(s) and ${movedFolders} folder(s)`,
        data: {
          movedFiles,
          movedFolders,
        },
      });
      return;
    }

    // Bulk Download
    if (action === 'download') {
      logger.info(`Starting bulk download preparation for user: ${userId}`);
      const result: BulkDownloadResult = {
        files: [],
        folders: [],
      };

      // Files
      if (Array.isArray(files) && files.length > 0) {
        logger.info(`Preparing ${files.length} files for download`);
        for (const fileId of files) {
          try {
            const file = await FileMeta.findById(fileId);
            if (file && file.uploadedBy.toString() === userId) {
              result.files.push({
                id: file.id, // Use .id instead of ._id.toString()
                name: file.originalName,
                downloadUrl: `/api/v1/files/preview/${file.id}`, // Use .id here too
                size: file.size,
                mimetype: file.mimetype,
              });
              logger.debug(`Added file to download list: ${file.originalName}`);
            } else {
              logger.warn(`File not found or access denied for download: ${fileId}`);
            }
          } catch (error) {
            logger.error(`Failed to prepare download for file ${fileId}:`, error);
          }
        }
      }

      // Folders (collect all files in those folders)
      if (Array.isArray(folders) && folders.length > 0) {
        logger.info(`Preparing files from ${folders.length} folders for download`);
        for (const folderId of folders) {
          try {
            // Recursively collect all files in folder
            const stack: string[] = [folderId];
            while (stack.length) {
              const currFolderId = stack.pop();
              if (currFolderId) {
                const subfolders = await Folder.find({
                  parent: currFolderId,
                  owner: userId,
                });
                subfolders.forEach(
                  sub => stack.push(sub.id) // Use .id instead of ._id.toString()
                );

                const filesInFolder = await FileMeta.find({
                  parentFolder: currFolderId,
                  uploadedBy: userId,
                });

                filesInFolder.forEach(file => {
                  result.files.push({
                    id: file.id, // Use .id instead of ._id.toString()
                    name: file.originalName,
                    downloadUrl: `/api/v1/files/preview/${file.id}`, // Use .id here too
                    size: file.size,
                    mimetype: file.mimetype,
                  });
                  logger.debug(`Added file from folder to download list: ${file.originalName}`);
                });
                result.folders.push(currFolderId);
              }
            }
          } catch (error) {
            logger.error(`Failed to process folder ${folderId} for download:`, error);
          }
        }
      }

      logger.info(`Bulk download preparation completed - Total files: ${result.files.length}, Folders processed: ${result.folders.length}`);
      res.json({
        success: true,
        data: result,
      });
      return;
    }

    // Unknown Action
    logger.warn(`Invalid bulk action attempted: ${action}`);
    throw createError('Invalid action', 400);
  }
);

/**
 * Helper function to check if target folder is a descendant of source folder
 * @description Prevents circular folder moves by checking folder hierarchy
 * @param {string} sourceFolderId - ID of the source folder being moved
 * @param {string} targetFolderId - ID of the target destination folder
 * @returns {Promise<boolean>} True if target is a descendant of source, false otherwise
 */
const isDescendantFolder = async (
  sourceFolderId: string,
  targetFolderId: string
): Promise<boolean> => {
  logger.debug(`Checking if ${targetFolderId} is descendant of ${sourceFolderId}`);
  
  if (targetFolderId === 'root' || !targetFolderId) {
    logger.debug('Target is root folder, not a descendant');
    return false;
  }

  if (sourceFolderId === targetFolderId) {
    logger.debug('Source and target are the same folder');
    return true;
  }

  let currentFolder = await Folder.findById(targetFolderId);
  while (currentFolder && currentFolder.parent) {
    if (currentFolder.parent.toString() === sourceFolderId) {
      logger.debug(`Found descendant relationship: ${targetFolderId} is descendant of ${sourceFolderId}`);
      return true;
    }
    currentFolder = await Folder.findById(currentFolder.parent);
  }

  logger.debug(`No descendant relationship found between ${sourceFolderId} and ${targetFolderId}`);
  return false;
};
