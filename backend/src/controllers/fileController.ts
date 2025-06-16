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

interface AuthRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

// POST /api/files/upload (single file upload)
export const uploadFile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    if (!req.user) {
      throw createError('User not found', 401);
    }

    const { parentFolder } = req.body; // Get parent folder from request body
    const socketServer = req.app.get('socketServer');

    const response = await uploadFileService({
      file: req.file,
      socketServer,
      user: req.user,
      parentFolder,
    });
    res.status(201).json(response);
  },
);

// GET /api/files/ (list user's files)
export const listFiles = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError('User not found', 401);
    }

    const parentFolder = (req.query.parentFolder as string) || null;

    const files = await getFileMetaByownerAndFolder(req.user.id, parentFolder);

    // Fix: Return the expected structure that frontend can parse
    res.json({
      success: true,
      data: {
        files: files, // Wrap files in data object
        count: files.length,
      },
    });
  },
);

// GET /api/files/preview/:id (preview file)
export const previewFile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fileId = req.params.id;
    const userId = req.user.id;

    const file = await getFileMetaById(fileId);

    if (!file) {
      throw createError('File not found', 404);
    }

   
    const sharedId = file.sharedWith.find((sharedUser: any) => sharedUser.user.toString() === userId);

    // Check permissions: Only owner can preview
    if (file.uploadedBy.toString() !== userId && !sharedId) {
      throw createError('Not authorized to preview this file', 403);
    }

    const filePath = path.resolve(file.path);

    // Check if file exists on server
    if (!fs.existsSync(filePath)) {
      throw createError('File not found on server', 404);
    }

    // Set correct headers for preview
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.originalName}"`,
    );
    res.setHeader('Content-Length', file.size.toString());

    // Stream the file
    const readStream = fs.createReadStream(filePath);

    // Handle stream errors
    readStream.on('error', () => {
      throw createError('Error reading file', 500);
    });

    readStream.pipe(res);
  },
);

// DELETE /api/files/:id (delete file)
export const deleteFile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fileId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const file = await getFileMetaById(fileId);

    if (!file) {
      throw createError('File not found', 404);
    }

    // Check if user owns the file
    if (file.uploadedBy.toString() !== userId) {
      throw createError('Not authorized to delete this file', 403);
    }

    try {
      // Delete physical file from filesystem
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Delete all versions if they exist
      if (file.versions && file.versions.length > 0) {
        file.versions.forEach(version => {
          if (fs.existsSync(version.path)) {
            fs.unlinkSync(version.path);
          }
        });
      }

      // Delete from database
      await FileMeta.findByIdAndDelete(fileId);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      console.error('Delete file error:', error);
      throw createError('Failed to delete file', 500);
    }
  },
);
