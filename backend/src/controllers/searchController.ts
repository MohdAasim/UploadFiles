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
      `Advanced search parameters - Query: "${q}", Kind: ${kind}, Content Search: ${searchContent}`
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
          originalName: { $regex: searchQuery, $options: 'i' },
        };

        // Apply advanced filters
        if (fileType) {
          // Map fileType to appropriate mimetype patterns
          const mimePatterns: Record<string, string> = {
            image: '^image/',
            document: '(application/msword|application/vnd.openxmlformats|text/plain)',
            pdf: 'application/pdf',
            video: '^video/',
            audio: '^audio/',
            spreadsheet: '(application/vnd.ms-excel|application/vnd.openxmlformats.*sheet)',
            presentation: '(application/vnd.ms-powerpoint|application/vnd.openxmlformats.*presentation)',
            archive: '(application/zip|application/x-rar|application/x-tar)',
            code: '(text/|application/json|application/javascript|application/xml)',
          };
          
          if (mimePatterns[fileType as string]) {
            fileQuery.mimetype = { $regex: mimePatterns[fileType as string], $options: 'i' };
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
          logger.debug(`Added min size filter: ${minSize}MB (${minBytes} bytes)`);
        }
        
        if (maxSize) {
          if (!fileQuery.size) fileQuery.size = {};
          const maxBytes = Number(maxSize) * 1024 * 1024;
          fileQuery.size.$lte = maxBytes;
          logger.debug(`Added max size filter: ${maxSize}MB (${maxBytes} bytes)`);
        }

        // Tags filter
        if (tags) {
          const tagArray = (tags as string).split(',').map(tag => tag.trim());
          fileQuery.tags = { $in: tagArray };
          logger.debug(`Added tags filter: ${tags}`);
        }

        // Folder filter
        if (inFolder) {
          fileQuery.parentFolder = inFolder;
          logger.debug(`Added folder filter: ${inFolder}`);
        }

        // Owner filter (requires join with user collection)
        if (owner) {
          // This will be handled in the populate and filter stage
          logger.debug(`Added owner filter: ${owner}`);
        }

        // Determine sort order
        let sortOptions: any = { createdAt: -1 };
        switch (sortBy) {
          case 'name':
            sortOptions = { originalName: 1 };
            break;
          case 'date_newest':
            sortOptions = { createdAt: -1 };
            break;
          case 'date_oldest':
            sortOptions = { createdAt: 1 };
            break;
          case 'size_largest':
            sortOptions = { size: -1 };
            break;
          case 'size_smallest':
            sortOptions = { size: 1 };
            break;
        }

        // Execute the query
        let filesQuery = FileMeta.find(fileQuery)
          .populate('uploadedBy', 'name email')
          .populate('parentFolder', 'name')
          .sort(sortOptions)
          .limit(100)
          .lean();

        files = await filesQuery;

        // Filter by owner name/email if specified
        if (owner && typeof owner === 'string') {
          const ownerFilter = owner.toLowerCase();
          files = files.filter(file => 
            file.uploadedBy && 
            (
              (file.uploadedBy.name && file.uploadedBy.name.toLowerCase().includes(ownerFilter)) || 
              (file.uploadedBy.email && file.uploadedBy.email.toLowerCase().includes(ownerFilter))
            )
          );
        }

        logger.info(`Found ${files.length} files matching name/metadata criteria`);

        // Content search (if enabled)
        if (searchContent === 'true' && files.length > 0) {
          logger.info(`Performing content search for: "${searchQuery}"`);
          contentMatchCount = 0;
          
          // Get list of files that can be content-searched
          const searchableFiles = files.filter(file => {
            const mimetype = file.mimetype;
            return (
              mimetype.includes('text/') ||
              mimetype.includes('application/json') ||
              mimetype.includes('application/xml') ||
              mimetype.includes('application/javascript') ||
              mimetype.includes('application/pdf') ||
              mimetype.includes('application/msword') ||
              mimetype.includes('application/vnd.openxmlformats') ||
              mimetype.includes('application/vnd.ms-excel') ||
              mimetype.includes('application/vnd.ms-powerpoint')
            );
          });
          
          // Track which files have content matches
          const contentMatchIds = new Set<string>();
          
          // Search content for each file (with appropriate method based on file type)
          for (const file of searchableFiles) {
            try {
              const filePath = path.join(process.env.UPLOAD_DIR || 'uploads', file.filename);
              
              let hasMatch = false;
              
              // Choose search method based on file type
              if (file.mimetype.includes('text/') || 
                  file.mimetype.includes('application/json') || 
                  file.mimetype.includes('application/javascript') ||
                  file.mimetype.includes('application/xml')) {
                // Text-based files - read directly
                const content = await fs.readFile(filePath, 'utf8');
                hasMatch = content.toLowerCase().includes(searchQuery.toLowerCase());
              } 
              else if (file.mimetype.includes('application/pdf')) {
                // PDF files - use external tool (pdftotext)
                try {
                  const { stdout } = await execPromise(`pdftotext "${filePath}" - | grep -i "${searchQuery}"`);
                  hasMatch = stdout.trim().length > 0;
                } catch (err: any) {
                  // grep returns non-zero exit code when no matches found
                  hasMatch = false;
                }
              } 
              else if (file.mimetype.includes('application/vnd.openxmlformats') || 
                       file.mimetype.includes('application/msword') ||
                       file.mimetype.includes('application/vnd.ms-excel') ||
                       file.mimetype.includes('application/vnd.ms-powerpoint')) {
                // Office documents - use external tool (antiword, xlsx2csv, etc.)
                try {
                  let cmd = '';
                  if (file.mimetype.includes('msword') || file.mimetype.includes('openxmlformats-officedocument.wordprocessingml')) {
                    cmd = `antiword "${filePath}" | grep -i "${searchQuery}"`;
                  } else if (file.mimetype.includes('spreadsheetml')) {
                    cmd = `xlsx2csv "${filePath}" | grep -i "${searchQuery}"`;
                  } else {
                    // Skip other office formats for now
                    continue;
                  }
                  
                  const { stdout } = await execPromise(cmd);
                  hasMatch = stdout.trim().length > 0;
                } catch (err: any) {
                  // grep returns non-zero exit code when no matches found
                  hasMatch = false;
                }
              }
              
              // If content match found, add to results
              if (hasMatch) {
                contentMatchIds.add(file._id.toString());
                contentMatchCount++;
              }
            } catch (error) {
              logger.error(`Error searching content in file ${file._id}:`, error);
              // Continue with next file
            }
          }
          
          // Mark files with content matches
          files = files.map(file => ({
            ...file,
            hasContentMatch: contentMatchIds.has(file._id.toString())
          }));
          
          // Add a filter option to only show content matches
          filesWithContentMatch = files.filter(file => file.hasContentMatch);
          
          logger.info(`Found ${contentMatchCount} files with content matches`);
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
          folders = folders.filter(folder => 
            folder.owner && 
            (
              (folder.owner.name && folder.owner.name.toLowerCase().includes(ownerFilter)) || 
              (folder.owner.email && folder.owner.email.toLowerCase().includes(ownerFilter))
            )
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
