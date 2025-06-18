import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { addFolder, getFolderTree } from '../services/folder.service';
import Folder, { IFolder } from '../models/Folder';
import FileMeta, { IFileMeta } from '../models/FileMeta';
import fs from 'fs';
import { Document, Types } from 'mongoose';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Create a new folder
 * @description Creates a new folder with optional parent folder assignment
 * @route POST /api/v1/folders
 * @access Private
 * @param {AuthRequest} req - Express request object containing folder data
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with created folder
 */
export const createFolder = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, parent } = req.body;
    const owner = req.user.id;

    logger.info(
      `Folder creation requested - Name: ${name}, Parent: ${parent || 'root'}, Owner: ${owner}`
    );

    const response = await addFolder(name, parent, owner);

    logger.info(`Folder created successfully -, Name: ${name}`);
    res.status(201).json(response);
  }
);

/**
 * List folder tree content
 * @description Retrieves folders and files within a specific folder or root
 * @route GET /api/v1/folders/tree
 * @access Private
 * @param {AuthRequest} req - Express request object with optional parent query
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with folder tree structure
 */
export const listFolderTree = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const owner = req.user.id;
    const { parent } = req.query;

    logger.info(
      `Folder tree requested - Owner: ${owner}, Parent: ${parent || 'root'}`
    );

    if (!owner) {
      logger.warn('Folder tree requested without authentication');
      throw createError('User not found', 401);
    }

    // Get folders in current directory
    const folders = await Folder.find({
      owner,
      parent: parent || null,
    })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    // Get files in current directory
    const files = await FileMeta.find({
      uploadedBy: owner,
      parentFolder: parent || null,
    })
      .populate('uploadedBy', 'name email')
      .populate('parentFolder', 'name')
      .sort({ createdAt: -1 });

    logger.info(
      `Folder tree retrieved - Folders: ${folders.length}, Files: ${files.length}, Parent: ${parent || 'root'}`
    );

    res.json({
      success: true,
      data: {
        folders,
        files,
        folderCount: folders.length,
        fileCount: files.length,
        currentFolder: parent || null,
      },
    });
  }
);

/**
 * Get all folders for tree view
 * @description Retrieves all user's folders for tree/navigation display
 * @route GET /api/v1/folders
 * @access Private
 * @param {AuthRequest} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with all user folders
 */
export const getAllFolders = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const owner = req.user.id;

    logger.info(`All folders requested for user: ${owner}`);

    if (!owner) {
      logger.warn('All folders requested without authentication');
      throw createError('User not found', 401);
    }

    const allFolders = await Folder.find({ owner })
      .populate('owner', 'name email')
      .populate('parent', 'name')
      .sort({ createdAt: -1 });

    logger.info(`Retrieved ${allFolders.length} folders for user: ${owner}`);

    res.json({
      success: true,
      data: {
        folders: allFolders,
        count: allFolders.length,
      },
    });
  }
);

/**
 * Delete folder and all its contents recursively
 * @description Deletes a folder and all nested folders and files
 * @route DELETE /api/v1/folders/:id
 * @access Private
 * @param {AuthRequest} req - Express request object with folder ID parameter
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with deletion result
 */
export const deleteFolder = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const folderId = req.params.id;
    const userId = req.user?.id;

    logger.info(
      `Folder deletion requested - Folder: ${folderId}, User: ${userId}`
    );

    if (!userId) {
      logger.warn('Folder deletion attempted without authentication');
      throw createError('User not authenticated', 401);
    }

    const folder = await Folder.findById(folderId);

    if (!folder) {
      logger.warn(`Folder not found for deletion: ${folderId}`);
      throw createError('Folder not found', 404);
    }

    // Check if user owns the folder
    if (folder.owner.toString() !== userId) {
      logger.warn(
        `Unauthorized folder deletion attempt - Folder: ${folderId}, User: ${userId}`
      );
      throw createError('Not authorized to delete this folder', 403);
    }

    try {
      logger.info(
        `Starting recursive deletion of folder: ${folder.name} (${folderId})`
      );

      // Recursively delete all contents
      await deleteFolderRecursive(folderId, userId);

      logger.info(`Folder deletion completed: ${folder.name} (${folderId})`);

      res.json({
        success: true,
        message: 'Folder and all contents deleted successfully',
      });
    } catch (error) {
      logger.error(`Delete folder error for ${folderId}:`, error);
      throw createError('Failed to delete folder', 500);
    }
  }
);

/**
 * Update folder (rename)
 * @description Updates folder name with validation
 * @route PUT /api/v1/folders/:id
 * @access Private
 * @param {AuthRequest} req - Express request object with folder ID and new name
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with updated folder
 */
export const updateFolder = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const folderId = req.params.id;
    const { name } = req.body;
    const userId = req.user?.id;

    logger.info(
      `Folder update requested - Folder: ${folderId}, New name: ${name}, User: ${userId}`
    );

    if (!userId) {
      logger.warn('Folder update attempted without authentication');
      throw createError('User not authenticated', 401);
    }

    if (!name || name.trim().length === 0) {
      logger.warn('Folder update attempted without name');
      throw createError('Folder name is required', 400);
    }

    const folder = await Folder.findById(folderId);

    if (!folder) {
      logger.warn(`Folder not found for update: ${folderId}`);
      throw createError('Folder not found', 404);
    }

    // Check if user owns the folder
    if (folder.owner.toString() !== userId) {
      logger.warn(
        `Unauthorized folder update attempt - Folder: ${folderId}, User: ${userId}`
      );
      throw createError('Not authorized to update this folder', 403);
    }

    // Check if folder with same name already exists in same parent
    const existingFolder = await Folder.findOne({
      owner: userId,
      parent: folder.parent,
      name: name.trim(),
      _id: { $ne: folderId }, // Exclude current folder
    });

    if (existingFolder) {
      logger.warn(
        `Duplicate folder name in same parent - Name: ${name}, Parent: ${folder.parent}`
      );
      throw createError(
        'A folder with this name already exists in the same location',
        400
      );
    }

    try {
      const oldName = folder.name;
      folder.name = name.trim();
      await folder.save();

      logger.info(
        `Folder updated successfully - ID: ${folderId}, Old name: ${oldName}, New name: ${name}`
      );

      const updatedFolder = await Folder.findById(folderId)
        .populate('owner', 'name email')
        .populate('parent', 'name');

      res.json({
        success: true,
        data: updatedFolder,
        message: 'Folder updated successfully',
      });
    } catch (error) {
      logger.error(`Update folder error for ${folderId}:`, error);
      throw createError('Failed to update folder', 500);
    }
  }
);

/**
 * Helper function to recursively delete folder contents
 * @description Recursively deletes all files and subfolders within a folder
 * @param {string} folderId - ID of the folder to delete recursively
 * @param {string} userId - ID of the user performing the deletion
 * @returns {Promise<void>} Completes when all contents are deleted
 */
async function deleteFolderRecursive(
  folderId: string,
  userId: string
): Promise<void> {
  logger.debug(`Starting recursive deletion of folder contents: ${folderId}`);

  // Get all subfolders with proper typing
  const subfolders: (Document<any, any, IFolder> & IFolder)[] =
    await Folder.find({
      parent: folderId,
      owner: userId,
    });

  logger.info(
    `Found ${subfolders.length} subfolders to delete in folder: ${folderId}`
  );

  // Recursively delete all subfolders
  for (const subfolder of subfolders) {
    // Now TypeScript knows _id is an ObjectId
    await deleteFolderRecursive(subfolder._id.toString(), userId);
  }

  // Get all files in this folder with proper typing
  const files: (Document<any, any, IFileMeta> & IFileMeta)[] =
    await FileMeta.find({
      parentFolder: folderId,
      uploadedBy: userId,
    });

  logger.info(`Found ${files.length} files to delete in folder: ${folderId}`);

  // Delete all files physically and from database
  for (const file of files) {
    try {
      // Delete physical file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        logger.debug(`Deleted file from filesystem: ${file.path}`);
      }

      // Delete all versions if they exist
      if (file.versions && file.versions.length > 0) {
        file.versions.forEach((version: any) => {
          if (fs.existsSync(version.path)) {
            fs.unlinkSync(version.path);
            logger.debug(`Deleted file version: ${version.path}`);
          }
        });
      }

      // Delete from database
      await FileMeta.findByIdAndDelete(file._id);
      logger.debug(`Deleted file from database: ${file._id}`);
    } catch (error) {
      logger.error(`Error deleting file ${file._id}:`, error);
      // Continue with other files even if one fails
    }
  }

  // Finally, delete the folder itself
  await Folder.findByIdAndDelete(folderId);
  logger.debug(`Deleted folder from database: ${folderId}`);
}
