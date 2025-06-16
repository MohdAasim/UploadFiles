// Update the response format to match frontend expectations
import { Request, Response } from 'express';
import FileMeta from '../models/FileMeta';
import Folder from '../models/Folder';
import { asyncHandler, createError } from '../middlewares/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

export const searchFilesAndFolders = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const {
      q, // keyword
      type, // file extension or mimetype
      inFolder, // folder id (optional)
      kind = 'all', // "file" | "folder" | "all"
    } = req.query;

    console.log('Search params:', { q, type, inFolder, kind, userId });

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.json({
        success: true,
        data: {
          files: [],
          folders: [],
          summary: {
            totalFiles: 0,
            totalFolders: 0,
            searchQuery: '',
            searchType: '',
            searchKind: kind,
          },
        },
      });
      return;
    }

    const searchQuery = q.trim();
    let files: any[] = [];
    let folders: any[] = [];

    try {
      // Search files - simplified query
      if (kind === 'all' || kind === 'file') {
        const fileQuery: any = {
          uploadedBy: userId,
          originalName: { $regex: searchQuery, $options: 'i' },
        };

        // Add type filter if provided
        if (type) {
          fileQuery.mimetype = { $regex: type as string, $options: 'i' };
        }

        // Add folder filter if provided
        if (inFolder) {
          fileQuery.parentFolder = inFolder;
        }

        console.log('File query:', fileQuery);

        files = await FileMeta.find(fileQuery)
          .populate('uploadedBy', 'name email')
          .populate('parentFolder', 'name')
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        console.log('Found files:', files.length);
      }

      // Search folders - simplified query
      if (kind === 'all' || kind === 'folder') {
        const folderQuery: any = {
          owner: userId,
          name: { $regex: searchQuery, $options: 'i' },
        };

        // Add folder filter if provided
        if (inFolder) {
          folderQuery.parent = inFolder;
        }

        console.log('Folder query:', folderQuery);

        folders = await Folder.find(folderQuery)
          .populate('owner', 'name email')
          .populate('parent', 'name')
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        console.log('Found folders:', folders.length);
      }

      // Return response in expected format
      res.json({
        success: true,
        data: {
          files,
          folders,
          summary: {
            totalFiles: files.length,
            totalFolders: folders.length,
            searchQuery,
            searchType: type || '',
            searchKind: kind,
          },
        },
      });
    } catch (error) {
      console.error('Search error:', error);
      throw createError('Search failed', 500);
    }
  },
);
