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

interface AuthRequest extends Request {
  user: JwtPayload;
  file?: Express.Multer.File;
}

// Upload a new version
export const uploadNewVersion = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fileId = req.params.id;
    const userId = req.user.id;
    const remark = req.body.remark;

    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const response = await uploadNewVersionService({
      fileId,
      newFile: req.file,
      remark,
      userId,
    });

    res.json(response);
  },
);

// Get version history
export const getVersionHistory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fileId = req.params.id;
    const userId = req.user.id;

    const response = await versionHistoryService({ fileId, userId });
    res.json(response);
  },
);

// Restore a previous version
export const restoreVersion = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fileId = req.params.id;
    const versionNumber = parseInt(req.body.versionNumber, 10);
    const userId = req.user.id;

    if (!versionNumber || isNaN(versionNumber)) {
      throw createError('Valid version number is required', 400);
    }

    const response = await restoreVersionService({
      fileId,
      userId,
      versionNumber,
    });

    res.json(response);
  },
);
