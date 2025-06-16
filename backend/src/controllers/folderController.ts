import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { addFolder, getFolderTree } from '../services/folder.service';

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

    const response = await getFolderTree(owner, parent ? String(parent) : null);
    res.json(response);
  },
);
