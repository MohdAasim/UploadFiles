import { Request, Response } from 'express';
import FileMeta from '../models/FileMeta';
import path from 'path';
import fs from 'fs';
import { asyncHandler, createError } from '../middlewares/errorHandler';

interface AuthRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

// Upload a new version
export const uploadNewVersion = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const fileId = req.params.id;
  const userId = req.user.id;
  const remark = req.body.remark;

  if (!req.file) {
    throw createError('No file uploaded', 400);
  }

  if (!userId) {
    throw createError('User not found', 401);
  }

  const file = await FileMeta.findById(fileId);
  if (!file) {
    throw createError('File not found', 404);
  }

  // Check permissions: Only owner or users with edit/admin permission
  const isOwner = file.uploadedBy.toString() === userId;
  const hasEditAccess = file.sharedWith.some(
    (entry: any) =>
      entry.user.toString() === userId &&
      ['edit', 'admin'].includes(entry.permission),
  );

  if (!isOwner && !hasEditAccess) {
    throw createError('You do not have permission to upload new version', 403);
  }

  // Get next version number
  const currentVersionNumber = Math.max(...file.versions.map(v => v.versionNumber), 0);
  const newVersionNumber = currentVersionNumber + 1;

  // Add current file as a version before updating
  file.versions.push({
    versionNumber: newVersionNumber,
    filename: file.filename,
    path: file.path,
    uploadedAt: new Date(),
    uploadedBy: userId,
    remark: remark || `Version ${newVersionNumber}`,
  });

  // Update file metadata with new uploaded file
  file.filename = req.file.filename;
  file.path = req.file.path;
  file.size = req.file.size;
  file.mimetype = req.file.mimetype;

  await file.save();

  res.json({
    success: true,
    message: 'New version uploaded successfully',
    file,
    newVersion: {
      versionNumber: newVersionNumber,
      filename: req.file.filename,
      remark: remark || `Version ${newVersionNumber}`
    }
  });
});

// Get version history
export const getVersionHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const fileId = req.params.id;
  const userId = req.user.id;

  if (!userId) {
    throw createError('User not found', 401);
  }

  const file = await FileMeta.findById(fileId).populate('versions.uploadedBy', 'name email');
  if (!file) {
    throw createError('File not found', 404);
  }

  // Check permissions: Only allow if owner or shared
  const isOwner = file.uploadedBy.toString() === userId;
  const hasAccess = file.sharedWith.some(
    (entry: any) => entry.user.toString() === userId
  );

  if (!isOwner && !hasAccess) {
    throw createError('You do not have permission to view this file', 403);
  }

  res.json({
    success: true,
    file: {
      id: file._id,
      originalName: file.originalName,
      currentVersion: Math.max(...file.versions.map(v => v.versionNumber), 1)
    },
    versions: file.versions.sort((a, b) => b.versionNumber - a.versionNumber)
  });
});

// Restore a previous version
export const restoreVersion = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const fileId = req.params.id;
  const versionNumber = parseInt(req.body.versionNumber, 10);
  const userId = req.user.id;

  if (!userId) {
    throw createError('User not found', 401);
  }

  if (!versionNumber || isNaN(versionNumber)) {
    throw createError('Valid version number is required', 400);
  }

  const file = await FileMeta.findById(fileId);
  if (!file) {
    throw createError('File not found', 404);
  }

  // Check permissions: Only owner or users with edit/admin permission
  const isOwner = file.uploadedBy.toString() === userId;
  const hasEditAccess = file.sharedWith.some(
    (entry: any) =>
      entry.user.toString() === userId &&
      ['edit', 'admin'].includes(entry.permission),
  );

  if (!isOwner && !hasEditAccess) {
    throw createError('You do not have permission to restore versions', 403);
  }

  const version = file.versions.find(v => v.versionNumber === versionNumber);
  if (!version) {
    throw createError('Version not found', 404);
  }

  // Check if the version file still exists
  if (!fs.existsSync(version.path)) {
    throw createError('Version file not found on server', 404);
  }

  // Save current file as a new version before restoring
  const newVersionNumber = Math.max(...file.versions.map(v => v.versionNumber)) + 1;
  file.versions.push({
    versionNumber: newVersionNumber,
    filename: file.filename,
    path: file.path,
    uploadedAt: new Date(),
    uploadedBy: userId,
    remark: 'Auto-saved before restore',
  });

  // Restore from chosen version
  file.filename = version.filename;
  file.path = version.path;
  file.size = fs.statSync(version.path).size;
  // Keep original mimetype or derive from file extension if needed

  await file.save();

  res.json({
    success: true,
    message: `Version ${versionNumber} restored successfully`,
    file,
    restoredVersion: {
      versionNumber,
      filename: version.filename,
      remark: version.remark
    }
  });
});
