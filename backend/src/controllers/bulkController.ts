import { Request, Response } from 'express';
import FileMeta from '../models/FileMeta';
import Folder from '../models/Folder';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { asyncHandler, createError } from '../middlewares/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

// Helper for recursive folder deletion
const deleteFolderRecursively = async (folderId: string, userId: string): Promise<void> => {
  // Delete all files in this folder
  const files = await FileMeta.find({
    parentFolder: folderId,
    uploadedBy: userId,
  });
  for (const file of files) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    // Delete all versions
    file.versions.forEach(version => {
      if (fs.existsSync(version.path)) fs.unlinkSync(version.path);
    });
    await FileMeta.findByIdAndDelete(file._id);
  }
  // Delete all subfolders recursively
  const subfolders = await Folder.find({ parent: folderId, owner: userId });
  for (const subfolder of subfolders) {
    await deleteFolderRecursively((subfolder._id as mongoose.Types.ObjectId).toString(), userId);
    await Folder.findByIdAndDelete(subfolder._id);
  }
};

export const bulkAction = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { action, files, folders, targetFolder } = req.body; // arrays of IDs
  const userId = req.user?.id;

  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  if (!Array.isArray(files) && !Array.isArray(folders)) {
    throw createError('No files or folders provided', 400);
  }

  // Bulk Delete
  if (action === 'delete') {
    // Delete files
    if (Array.isArray(files)) {
      for (const fileId of files) {
        const file = await FileMeta.findById(fileId);
        if (file && file.uploadedBy.toString() === userId) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          // Delete all versions
          file.versions.forEach(version => {
            if (fs.existsSync(version.path)) fs.unlinkSync(version.path);
          });
          await FileMeta.findByIdAndDelete(fileId);
        }
      }
    }
    // Delete folders recursively
    if (Array.isArray(folders)) {
      for (const folderId of folders) {
        const folder = await Folder.findById(folderId);
        if (folder && folder.owner.toString() === userId) {
          await deleteFolderRecursively(folderId, userId);
          await Folder.findByIdAndDelete(folderId);
        }
      }
    }
    
    res.json({ 
      success: true,
      message: 'Delete operation complete' 
    });
    return;
  }

  // Bulk Move
  if (action === 'move') {
    // Target folder required
    if (!targetFolder) {
      throw createError('No target folder provided', 400);
    }

    // Move files
    if (Array.isArray(files)) {
      for (const fileId of files) {
        const file = await FileMeta.findById(fileId);
        if (file && file.uploadedBy.toString() === userId) {
          file.parentFolder = targetFolder;
          await file.save();
        }
      }
    }
    // Move folders
    if (Array.isArray(folders)) {
      for (const folderId of folders) {
        const folder = await Folder.findById(folderId);
        if (folder && folder.owner.toString() === userId) {
          folder.parent = targetFolder;
          await folder.save();
        }
      }
    }
    
    res.json({ 
      success: true,
      message: 'Move operation complete' 
    });
    return;
  }

  // Bulk Download (returns file info for client to fetch/download)
  if (action === 'download') {
    const result: { files: any[]; folders: string[] } = { files: [], folders: [] };

    // Files
    if (Array.isArray(files)) {
      for (const fileId of files) {
        const file = await FileMeta.findById(fileId);
        if (file && file.uploadedBy.toString() === userId) {
          result.files.push({
            id: file._id,
            name: file.originalName,
            downloadUrl: `/api/v1/files/preview/${file._id}`,
            size: file.size,
            mimetype: file.mimetype
          });
        }
      }
    }
    
    // Folders (could return all files in those folders)
    if (Array.isArray(folders)) {
      for (const folderId of folders) {
        // Recursively collect all files in folder
        const stack: string[] = [folderId];
        while (stack.length) {
          const currFolderId = stack.pop();
          if (currFolderId) {
            const subfolders = await Folder.find({
              parent: currFolderId,
              owner: userId,
            });
            subfolders.forEach(sub => stack.push((sub._id as mongoose.Types.ObjectId).toString()));
            
            const filesInFolder = await FileMeta.find({
              parentFolder: currFolderId,
              uploadedBy: userId,
            });
            
            filesInFolder.forEach(file =>
              result.files.push({
                id: file._id,
                name: file.originalName,
                downloadUrl: `/api/v1/files/preview/${file._id}`,
                size: file.size,
                mimetype: file.mimetype
              }),
            );
            result.folders.push(currFolderId);
          }
        }
      }
    }
    
    res.json({
      success: true,
      data: result
    });
    return;
  }

  // Unknown Action
  throw createError('Invalid action', 400);
});
