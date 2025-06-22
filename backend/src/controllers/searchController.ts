// /home/arslaanas/Desktop/UploadFiles/backend/src/controllers/searchController.ts
// Update the response format to match frontend expectations
import { Request, Response } from 'express';
import FileMeta from '../models/FileMeta';
import Folder from '../models/Folder';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import logger from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';
import util from 'util';
import { exec } from 'child_process';
import { filterFilesByContent } from '../utils/filterFilesByContent';

const execPromise = util.promisify(exec);

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Search files and folders with advanced filtering and content search
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

    logger.info(`Advanced search initiated by user: ${userId}`);

    if (!userId) {
      logger.warn('Search attempted without authentication');
      throw createError('User not authenticated', 401);
    }

    const {
      q, // keyword
      type, // file extension or mimetype
      inFolder, // folder id (optional)
      kind = 'all', // "file" | "folder" | "all"
      fileType, // specific file type category
      dateFrom, // date range start
      dateTo, // date range end
      minSize, // minimum file size in MB
      maxSize, // maximum file size in MB
      tags, // comma-separated tags
      owner, // owner name or email
      searchContent, // whether to search in file contents
      sortBy = 'name', // sorting criteria
    } = req.query;

    logger.info(
      `Advanced search parameters - Query: "${q}", Kind: ${kind}, Type: ${fileType}, Content Search: ${searchContent}`
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
    let filesWithContentMatch: any[] = [];
    let contentMatchCount = 0;

    try {
      // Search files with advanced filters
      if (kind === 'all' || kind === 'file') {
        logger.info(`Searching files with query: "${searchQuery}"`);

        const fileQuery: any = {
          uploadedBy: userId,
        };
        if (!(searchContent === 'true')) {
          fileQuery.originalName = { $regex: searchQuery, $options: 'i' };
          if (fileType) {
            // Apply advanced filters
            // Map fileType to appropriate mimetype patterns
            const mimePatterns: Record<string, RegExp> = {
              image: /^image\//,
              document:
                /^(application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain)$/,
              pdf: /^application\/pdf$/,
              video: /^video\//,
              audio: /^audio\//,
              spreadsheet:
                /^(application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/,
              presentation:
                /^(application\/vnd\.ms-powerpoint|application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation)$/,
              archive:
                /^(application\/zip|application\/x-rar-compressed|application\/x-tar|application\/x-7z-compressed)$/,
              code: /^(text\/(x-java-source|x-python|x-c|x-c\+\+|plain)|application\/(json|javascript|xml|x-httpd-php))$/,
            };

            if (mimePatterns[fileType as string]) {
              fileQuery.mimetype = {
                $regex: mimePatterns[fileType as string],
                $options: 'i',
              };
              logger.debug(`Added file type filter: ${fileType}`);
            }
          } else if (type) {
            fileQuery.mimetype = { $regex: type as string, $options: 'i' };
            logger.debug(`Added type filter: ${type}`);
          }

          // Date filters
          if (dateFrom) {
            fileQuery.createdAt = { $gte: new Date(dateFrom as string) };
            logger.debug(`Added date from filter: ${dateFrom}`);
          }

          if (dateTo) {
            if (!fileQuery.createdAt) fileQuery.createdAt = {};
            fileQuery.createdAt.$lte = new Date(dateTo as string);
            logger.debug(`Added date to filter: ${dateTo}`);
          }

          // Size filters (convert MB to bytes)
          if (minSize) {
            const minBytes = Number(minSize) * 1024 * 1024;
            fileQuery.size = { $gte: minBytes };
            logger.debug(
              `Added min size filter: ${minSize}MB (${minBytes} bytes)`
            );
          }

          if (maxSize) {
            if (!fileQuery.size) fileQuery.size = {};
            const maxBytes = Number(maxSize) * 1024 * 1024;
            fileQuery.size.$lte = maxBytes;
            logger.debug(
              `Added max size filter: ${maxSize}MB (${maxBytes} bytes)`
            );
          }
          // Folder filter
          if (inFolder) {
            fileQuery.parentFolder = inFolder;
            logger.debug(`Added folder filter: ${inFolder}`);
          }
        }

        // Execute the query
        let filesQuery = FileMeta.find(fileQuery)
          .populate('uploadedBy', 'name email')
          .populate('parentFolder', 'name')
          .limit(100)
          .lean();

        files = await filesQuery;
        logger.info({ files });

        // Filter by owner name/email if specified
        if (owner && typeof owner === 'string') {
          const ownerFilter = owner.toLowerCase();
          files = files.filter(
            file =>
              file.uploadedBy &&
              ((file.uploadedBy.name &&
                file.uploadedBy.name.toLowerCase().includes(ownerFilter)) ||
                (file.uploadedBy.email &&
                  file.uploadedBy.email.toLowerCase().includes(ownerFilter)))
          );
        }

        logger.info(
          `Found ${files.length} files matching name/metadata criteria`
        );

        // Content search (if enabled)
        if (searchContent === 'true' && files.length > 0) {
          files = await filterFilesByContent(files, searchQuery);
        }
      }

      // Search folders - with filters
      if (kind === 'all' || kind === 'folder') {
        logger.info(`Searching folders with query: "${searchQuery}"`);

        const folderQuery: any = {
          owner: userId,
          name: { $regex: searchQuery, $options: 'i' },
        };

        // Apply applicable filters

        // Date filters
        if (dateFrom) {
          folderQuery.createdAt = { $gte: new Date(dateFrom as string) };
        }

        if (dateTo) {
          if (!folderQuery.createdAt) folderQuery.createdAt = {};
          folderQuery.createdAt.$lte = new Date(dateTo as string);
        }

        // Tags filter
        if (tags) {
          const tagArray = (tags as string).split(',').map(tag => tag.trim());
          folderQuery.tags = { $in: tagArray };
        }

        // Parent folder filter
        if (inFolder) {
          folderQuery.parent = inFolder;
        }

        // Determine sort order
        let sortOptions: any = { createdAt: -1 };
        switch (sortBy) {
          case 'name':
            sortOptions = { name: 1 };
            break;
          case 'date_newest':
            sortOptions = { createdAt: -1 };
            break;
          case 'date_oldest':
            sortOptions = { createdAt: 1 };
            break;
        }

        let foldersQuery = Folder.find(folderQuery)
          .populate('owner', 'name email')
          .populate('parent', 'name')
          .sort(sortOptions)
          .limit(50)
          .lean();

        folders = await foldersQuery;

        // Filter by owner name/email if specified
        if (owner && typeof owner === 'string') {
          const ownerFilter = owner.toLowerCase();
          folders = folders.filter(
            folder =>
              folder.owner &&
              ((folder.owner.name &&
                folder.owner.name.toLowerCase().includes(ownerFilter)) ||
                (folder.owner.email &&
                  folder.owner.email.toLowerCase().includes(ownerFilter)))
          );
        }

        logger.info(`Found ${folders.length} folders matching search criteria`);
      }

      const totalResults = files.length + folders.length;
      const filteredCount = files.length + folders.length; // This will be different if filters were applied

      logger.info(
        `Advanced search completed - Total results: ${totalResults} (Files: ${files.length}, Folders: ${folders.length}, Content matches: ${contentMatchCount})`
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
            searchType: fileType || type || '',
            searchKind: kind,
            filteredCount,
            matchesInContent: contentMatchCount,
          },
        },
      });
    } catch (error) {
      logger.error(`Advanced search error for user ${userId}:`, error);
      throw createError('Search failed', 500);
    }
  }
);
