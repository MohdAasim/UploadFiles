import { Request, Response } from 'express';
import FileMeta from '../models/FileMeta';
import path from 'path';
import fs from 'fs';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { JwtPayload } from '../services/jwt-service';
import { ObjectId, Schema } from 'mongoose';
import { getFileMetaById } from '../repository/filemeta.repo';
import {
  restoreVersionService,
  uploadNewVersionService,
  versionHistoryService,
} from '../services/version.service';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user: JwtPayload;
  file?: Express.Multer.File;
}

/**
 * Upload a new version of an existing file
 * @description Creates a new version of an existing file while preserving previous versions
 * @route POST /api/v1/files/:id/versions
 * @access Private
 * @param {AuthRequest} req - Express request object with file ID and new file data
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with new version details
 */
export const uploadNewVersion = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fileId = req.params.id;
    const userId = req.user.id;
    const remark = req.body.remark;

    logger.info(`New version upload initiated - File: ${fileId}, User: ${userId}, Remark: ${remark || 'No remark'}`);

    if (!req.file) {
      logger.warn('Version upload attempted without file');
      throw createError('No file uploaded', 400);
    }

    const response = await uploadNewVersionService({
      fileId,
      newFile: req.file,
      remark,
      userId,
    });

    logger.info(`New version uploaded successfully - File: ${fileId}`);
    res.json(response);
  }
);

/**
 * Get version history for a file
 * @description Retrieves all versions of a specific file with metadata
 * @route GET /api/v1/files/:id/versions
 * @access Private
 * @param {AuthRequest} req - Express request object with file ID parameter
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with version history
 */
export const getVersionHistory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fileId = req.params.id;
    const userId = req.user.id;

    logger.info(`Version history requested - File: ${fileId}, User: ${userId}`);

    const response = await versionHistoryService({ fileId, userId });
    
    logger.info(`Version history retrieved - File: ${fileId}`);
    res.json(response);
  }
);

/**
 * Restore a previous version of a file
 * @description Restores a specific version of a file as the current version
 * @route POST /api/v1/files/:id/versions/restore
 * @access Private
 * @param {AuthRequest} req - Express request object with file ID and version number
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with restoration result
 */
export const restoreVersion = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fileId = req.params.id;
    const versionNumber = parseInt(req.body.versionNumber, 10);
    const userId = req.user.id;

    logger.info(`Version restore requested - File: ${fileId}, Version: ${versionNumber}, User: ${userId}`);

    if (!versionNumber || isNaN(versionNumber)) {
      logger.warn('Version restore attempted with invalid version number');
      throw createError('Valid version number is required', 400);
    }

    const response = await restoreVersionService({
      fileId,
      userId,
      versionNumber,
    });

    logger.info(`Version restored successfully - File: ${fileId}, Restored version: ${versionNumber}`);
    res.json(response);
  }
);
