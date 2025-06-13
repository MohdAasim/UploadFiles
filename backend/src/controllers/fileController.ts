import { Request, Response } from 'express';
import FileMeta from '../models/FileMeta';
import Folder from '../models/Folder';
import path from 'path';
import fs from 'fs';
import { asyncHandler, createError } from '../middlewares/errorHandler';

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

    // Validate parent folder if provided
    if (parentFolder) {
      const folder = await Folder.findById(parentFolder);
      if (!folder || folder.owner.toString() !== req.user.id) {
        throw createError('Parent folder not found or not yours', 404);
      }
    }

    const fileMeta = await FileMeta.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user.id,
      parentFolder: parentFolder || null,
    });

    // Emit real-time event
    const socketServer = req.app.get('socketServer');
    if (socketServer) {
      // Emit to all connected users (or specific room)
      socketServer.io.emit('new-file-uploaded', {
        file: fileMeta,
        uploadedBy: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
        },
        parentFolder: parentFolder,
      });
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: fileMeta,
    });
  }
);

// GET /api/files/ (list user's files)
export const listFiles = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError('User not found', 401);
    }

    const { parentFolder } = req.query; // Get parent folder from query params

    const files = await FileMeta.find({
      uploadedBy: req.user.id,
      parentFolder: parentFolder || null,
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      files,
    });
  }
);

// GET /api/files/preview/:id (preview file)
export const previewFile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fileId = req.params.id;
    const userId = req.user.id;

    if (!userId) {
      throw createError('User not found', 401);
    }

    const file = await FileMeta.findById(fileId);

    if (!file) {
      throw createError('File not found', 404);
    }

    // Check permissions: Only owner can preview
    if (file.uploadedBy.toString() !== userId) {
      throw createError('Not authorized to preview this file', 403);
    }

    const filePath = path.resolve(file.path);

    // Check if file exists on server
    if (!fs.existsSync(filePath)) {
      throw createError('File not found on server', 404);
    }

    // Set correct headers for preview
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    res.setHeader('Content-Length', file.size.toString());

    // Stream the file
    const readStream = fs.createReadStream(filePath);

    // Handle stream errors
    readStream.on('error', () => {
      throw createError('Error reading file', 500);
    });

    readStream.pipe(res);
  }
);
