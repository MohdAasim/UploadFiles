// Update the response format to match frontend expectations
import { Request, Response } from 'express';
import FileMeta from '../models/FileMeta';
import Folder from '../models/Folder';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Search files and folders
 * @description Performs comprehensive search across user's files and folders with filtering options
 * @route GET /api/v1/search
 * @access Private
 * @param {AuthRequest} req - Express request object with search query parameters
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with search results and summary
 */
export const searchFilesAndFolders = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;

    logger.info(`Search initiated by user: ${userId}`);

    if (!userId) {
      logger.warn('Search attempted without authentication');
      throw createError('User not authenticated', 401);
    }

    const {
      q, // keyword
      type, // file extension or mimetype
      inFolder, // folder id (optional)
      kind = 'all', // "file" | "folder" | "all"
    } = req.query;

    logger.info(
      `Search parameters - Query: "${q}", Type: ${type}, Folder: ${inFolder}, Kind: ${kind}`
    );

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      logger.info('Empty search query, returning empty results');
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
        logger.info(`Searching files with query: "${searchQuery}"`);

        const fileQuery: any = {
          uploadedBy: userId,
          originalName: { $regex: searchQuery, $options: 'i' },
        };

        // Add type filter if provided
        if (type) {
          fileQuery.mimetype = { $regex: type as string, $options: 'i' };
          logger.debug(`Added type filter: ${type}`);
        }

        // Add folder filter if provided
        if (inFolder) {
          fileQuery.parentFolder = inFolder;
          logger.debug(`Added folder filter: ${inFolder}`);
        }

        files = await FileMeta.find(fileQuery)
          .populate('uploadedBy', 'name email')
          .populate('parentFolder', 'name')
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        logger.info(`Found ${files.length} files matching search criteria`);
      }

      // Search folders - simplified query
      if (kind === 'all' || kind === 'folder') {
        logger.info(`Searching folders with query: "${searchQuery}"`);

        const folderQuery: any = {
          owner: userId,
          name: { $regex: searchQuery, $options: 'i' },
        };

        // Add folder filter if provided
        if (inFolder) {
          folderQuery.parent = inFolder;
          logger.debug(`Added parent folder filter: ${inFolder}`);
        }

        folders = await Folder.find(folderQuery)
          .populate('owner', 'name email')
          .populate('parent', 'name')
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        logger.info(`Found ${folders.length} folders matching search criteria`);
      }

      const totalResults = files.length + folders.length;
      logger.info(
        `Search completed - Total results: ${totalResults} (Files: ${files.length}, Folders: ${folders.length})`
      );

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
      logger.error(`Search error for user ${userId}:`, error);
      throw createError('Search failed', 500);
    }
  }
);
