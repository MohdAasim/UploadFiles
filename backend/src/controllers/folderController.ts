import { Request, Response } from 'express';
import Folder from '../models/Folder';
import FileMeta from '../models/FileMeta';
import { asyncHandler, createError } from '../middlewares/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

// Create a new folder
export const createFolder = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, parent } = req.body;
    const owner = req.user.id;

    if (!owner) {
      throw createError('User not found', 401);
    }

    // Find parent path or set as root
    let path = '/';
    if (parent) {
      const parentFolder = await Folder.findById(parent);
      if (!parentFolder || parentFolder.owner.toString() !== owner) {
        throw createError('Parent folder not found or not yours', 404);
      }
      path = parentFolder.path + '' + parentFolder.name;
    }

    const folder = await Folder.create({
      name,
      parent: parent || null,
      owner,
      path,
    });

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      folder,
    });
  }
);

// List folder tree (folders and files inside a folder)
export const listFolderTree = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const owner = req.user.id;
    const { parent } = req.query; // parent = folderId or null for root

    if (!owner) {
      throw createError('User not found', 401);
    }

    // List folders in this parent
    const folders = await Folder.find({ owner, parent: parent || null });

    // List files in this folder (using parent folder id or null for root)
    let files;
    if (parent) {
      files = await FileMeta.find({ uploadedBy: owner, parentFolder: parent });
    } else {
      files = await FileMeta.find({ uploadedBy: owner, parentFolder: null });
    }

    res.json({
      success: true,
      data: {
        folders,
        files,
      },
    });
  }
);
