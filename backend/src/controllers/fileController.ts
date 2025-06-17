import { Request, Response } from 'express';
import FileMeta from '../models/FileMeta';
import path from 'path';
import fs from 'fs';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { uploadFileService } from '../services/file.service';
import {
  getFileMetaById,
  getFileMetaByownerAndFolder,
} from '../repository/filemeta.repo';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

/**
 * Upload a single file
 * @description Handles single file upload with optional parent folder assignment
 * @route POST /api/v1/files/upload
 * @access Private
 * @param {AuthRequest} req - Express request object containing file and user data
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with upload result
 */
export const uploadFile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    logger.info(`File upload initiated by user: ${req.user?.id}`);
    
    if (!req.file) {
      logger.warn('File upload attempted without file');
      throw createError('No file uploaded', 400);
    }

    if (!req.user) {
      logger.warn('File upload attempted without authentication');
      throw createError('User not found', 401);
    }

    const { parentFolder } = req.body;
    logger.info(`Uploading file: ${req.file.originalname} to folder: ${parentFolder || 'root'}`);
    
    const socketServer = req.app.get('socketServer');

    const response = await uploadFileService({
      file: req.file,
      socketServer,
      user: req.user,
      parentFolder,
    });
    
    logger.info(`File uploaded successfully: ${req.file.originalname} `);
    res.status(201).json(response);
  }
);

/**
 * List user's files
 * @description Retrieves all files for authenticated user with optional folder filtering
 * @route GET /api/v1/files
 * @access Private
 * @param {AuthRequest} req - Express request object with optional parentFolder query
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with user's files
 */
export const listFiles = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      logger.warn('File list attempted without authentication');
      throw createError('User not found', 401);
    }

    const parentFolder = (req.query.parentFolder as string) || null;
    logger.info(`Listing files for user: ${req.user.id} in folder: ${parentFolder || 'root'}`);

    const files = await getFileMetaByownerAndFolder(req.user.id, parentFolder);
    logger.info(`Found ${files.length} files for user: ${req.user.id}`);

    // Fix: Return the expected structure that frontend can parse
    res.json({
      success: true,
      data: {
        files: files, // Wrap files in data object
        count: files.length,
      },
    });
  }
);

/**
 * Preview/download a file
 * @description Serves file content for preview or download with permission checks
 * @route GET /api/v1/files/preview/:id
 * @access Private
 * @param {AuthRequest} req - Express request object with file ID parameter
 * @param {Response} res - Express response object
 * @returns {Promise<void>} File stream response
 */
export const previewFile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fileId = req.params.id;
    const userId = req.user.id;

    logger.info(`File preview requested - File: ${fileId}, User: ${userId}`);

    const file = await getFileMetaById(fileId);

    if (!file) {
      logger.warn(`File not found for preview: ${fileId}`);
      throw createError('File not found', 404);
    }

    const sharedId = file.sharedWith.find(
      (sharedUser: any) => sharedUser.user.toString() === userId
    );

    // Check permissions: Only owner can preview
    if (file.uploadedBy.toString() !== userId && !sharedId) {
      logger.warn(`Unauthorized file preview attempt - File: ${fileId}, User: ${userId}`);
      throw createError('Not authorized to preview this file', 403);
    }

    const filePath = path.resolve(file.path);
    logger.debug(`File path resolved: ${filePath}`);

    // Check if file exists on server
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found on filesystem: ${filePath}`);
      throw createError('File not found on server', 404);
    }

    logger.info(`Serving file for preview: ${file.originalName} to user: ${userId}`);

    // Set correct headers for preview
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.originalName}"`
    );
    res.setHeader('Content-Length', file.size.toString());

    // Stream the file
    const readStream = fs.createReadStream(filePath);

    // Handle stream errors
    readStream.on('error', (error) => {
      logger.error(`Error reading file stream for ${fileId}:`, error);
      throw createError('Error reading file', 500);
    });

    readStream.on('end', () => {
      logger.debug(`File stream completed for: ${file.originalName}`);
    });

    readStream.pipe(res);
  }
);

/**
 * Delete a file
 * @description Deletes a file and all its versions from filesystem and database
 * @route DELETE /api/v1/files/:id
 * @access Private
 * @param {AuthRequest} req - Express request object with file ID parameter
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with deletion result
 */
export const deleteFile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fileId = req.params.id;
    const userId = req.user?.id;

    logger.info(`File deletion requested - File: ${fileId}, User: ${userId}`);

    if (!userId) {
      logger.warn('File deletion attempted without authentication');
      throw createError('User not authenticated', 401);
    }

    const file = await getFileMetaById(fileId);

    if (!file) {
      logger.warn(`File not found for deletion: ${fileId}`);
      throw createError('File not found', 404);
    }

    // Check if user owns the file
    if (file.uploadedBy.toString() !== userId) {
      logger.warn(`Unauthorized file deletion attempt - File: ${fileId}, User: ${userId}`);
      throw createError('Not authorized to delete this file', 403);
    }

    try {
      logger.info(`Deleting file: ${file.originalName} with ID: ${fileId}`);
      
      // Delete physical file from filesystem
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        logger.debug(`Deleted file from filesystem: ${file.path}`);
      } else {
        logger.warn(`File not found on filesystem: ${file.path}`);
      }

      // Delete all versions if they exist
      if (file.versions && file.versions.length > 0) {
        logger.info(`Deleting ${file.versions.length} file versions`);
        file.versions.forEach(version => {
          if (fs.existsSync(version.path)) {
            fs.unlinkSync(version.path);
            logger.debug(`Deleted file version: ${version.path}`);
          } else {
            logger.warn(`File version not found on filesystem: ${version.path}`);
          }
        });
      }

      // Delete from database
      await FileMeta.findByIdAndDelete(fileId);
      logger.info(`File deleted from database: ${fileId}`);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      logger.error(`Delete file error for ${fileId}:`, error);
      throw createError('Failed to delete file', 500);
    }
  }
);
