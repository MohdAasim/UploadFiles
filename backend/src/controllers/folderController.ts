import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { addFolder, getFolderTree } from '../services/folder.service';
import Folder, { IFolder } from '../models/Folder'; // Import the interface
import FileMeta, { IFileMeta } from '../models/FileMeta'; // Import the interface
import fs from 'fs';
import { Document, Types } from 'mongoose';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// Create a new folder
export const createFolder = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, parent } = req.body;
    const owner = req.user.id;
    const response = await addFolder(name, parent, owner);
    res.status(201).json(response);
  },
);

// List folder tree (folders and files inside a folder)
export const listFolderTree = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const owner = req.user.id;
    const { parent } = req.query; // parent = folderId or null for root

    if (!owner) {
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
  },
);

// Get all folders for tree view (returns all user's folders)
export const getAllFolders = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const owner = req.user.id;

    if (!owner) {
      throw createError('User not found', 401);
    }

    const allFolders = await Folder.find({ owner })
      .populate('owner', 'name email')
      .populate('parent', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        folders: allFolders,
        count: allFolders.length,
      },
    });
  },
);

// Delete folder and all its contents (recursive)
export const deleteFolder = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const folderId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const folder = await Folder.findById(folderId);

    if (!folder) {
      throw createError('Folder not found', 404);
    }

    // Check if user owns the folder
    if (folder.owner.toString() !== userId) {
      throw createError('Not authorized to delete this folder', 403);
    }

    try {
      // Recursively delete all contents
      await deleteFolderRecursive(folderId, userId);

      res.json({
        success: true,
        message: 'Folder and all contents deleted successfully',
      });
    } catch (error) {
      console.error('Delete folder error:', error);
      throw createError('Failed to delete folder', 500);
    }
  },
);

// Update folder (rename)
export const updateFolder = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const folderId = req.params.id;
    const { name } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    if (!name || name.trim().length === 0) {
      throw createError('Folder name is required', 400);
    }

    const folder = await Folder.findById(folderId);

    if (!folder) {
      throw createError('Folder not found', 404);
    }

    // Check if user owns the folder
    if (folder.owner.toString() !== userId) {
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
      throw createError(
        'A folder with this name already exists in the same location',
        400,
      );
    }

    try {
      folder.name = name.trim();
      await folder.save();

      const updatedFolder = await Folder.findById(folderId)
        .populate('owner', 'name email')
        .populate('parent', 'name');

      res.json({
        success: true,
        data: updatedFolder,
        message: 'Folder updated successfully',
      });
    } catch (error) {
      console.error('Update folder error:', error);
      throw createError('Failed to update folder', 500);
    }
  },
);

// Helper function to recursively delete folder contents
async function deleteFolderRecursive(
  folderId: string,
  userId: string,
): Promise<void> {
  // Get all subfolders with proper typing
  const subfolders: (Document<any, any, IFolder> & IFolder)[] =
    await Folder.find({
      parent: folderId,
      owner: userId,
    });

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

  // Delete all files physically and from database
  for (const file of files) {
    try {
      // Delete physical file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Delete all versions if they exist
      if (file.versions && file.versions.length > 0) {
        file.versions.forEach((version: any) => {
          if (fs.existsSync(version.path)) {
            fs.unlinkSync(version.path);
          }
        });
      }

      // Delete from database
      await FileMeta.findByIdAndDelete(file._id);
    } catch (error) {
      console.error(`Error deleting file ${file._id}:`, error);
      // Continue with other files even if one fails
    }
  }

  // Finally, delete the folder itself
  await Folder.findByIdAndDelete(folderId);
}
