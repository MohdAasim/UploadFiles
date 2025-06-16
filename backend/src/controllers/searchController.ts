import { Request, Response } from 'express';
import FileMeta from '../models/FileMeta';
import Folder from '../models/Folder';
import { asyncHandler, createError } from '../middlewares/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

export const searchFilesAndFolders = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const {
      q, // keyword
      type, // file extension or mimetype, e.g. "pdf" or "image/png"
      inFolder, // folder id (optional)
      uploadedBy, // search by uploader (optional)
      kind, // "file" | "folder" | "all"
      dateFrom, // ISO string
      dateTo, // ISO string
    } = req.query;

    let fileQuery: any = { $or: [] };
    let folderQuery: any = {};

    // Search for files
    if (kind !== 'folder') {
      // Include files owned by user OR shared with user
      fileQuery = {
        $and: [
          {
            $or: [
              { uploadedBy: userId }, // Files owned by user
              { 'sharedWith.user': userId }, // Files shared with user
            ],
          },
        ],
      };

      // Add search conditions
      const searchConditions: any[] = [];

      if (q) {
        searchConditions.push({
          originalName: { $regex: q as string, $options: 'i' },
        });
      }

      if (type) {
        // Allow searching by extension or mimetype
        searchConditions.push(
          { mimetype: { $regex: type as string, $options: 'i' } },
          {
            originalName: {
              $regex: '\\.' + (type as string) + '$',
              $options: 'i',
            },
          },
        );
      }

      if (searchConditions.length > 0) {
        fileQuery.$and.push({ $or: searchConditions });
      }

      if (inFolder) {
        fileQuery.$and.push({ parentFolder: inFolder });
      }

      if (uploadedBy) {
        fileQuery.$and.push({ uploadedBy: uploadedBy });
      }

      if (dateFrom || dateTo) {
        const dateQuery: any = {};
        if (dateFrom) dateQuery.$gte = new Date(dateFrom as string);
        if (dateTo) dateQuery.$lte = new Date(dateTo as string);
        fileQuery.$and.push({ createdAt: dateQuery });
      }
    }

    // Search for folders
    if (kind !== 'file') {
      // Include folders owned by user OR shared with user
      folderQuery = {
        $or: [
          { owner: userId }, // Folders owned by user
          { 'sharedWith.user': userId }, // Folders shared with user
        ],
      };

      const folderConditions: any[] = [];

      if (q) {
        folderConditions.push({
          name: { $regex: q as string, $options: 'i' },
        });
      }

      if (inFolder) {
        folderConditions.push({ parent: inFolder });
      }

      if (dateFrom || dateTo) {
        const dateQuery: any = {};
        if (dateFrom) dateQuery.$gte = new Date(dateFrom as string);
        if (dateTo) dateQuery.$lte = new Date(dateTo as string);
        folderConditions.push({ createdAt: dateQuery });
      }

      if (folderConditions.length > 0) {
        folderQuery = {
          $and: [folderQuery, ...folderConditions],
        };
      }
    }

    const results: { files?: any; folders?: any; summary?: any } = {};

    if (kind === 'file') {
      results.files = await FileMeta.find(fileQuery)
        .populate('uploadedBy', 'name email')
        .populate('parentFolder', 'name path')
        .sort({ createdAt: -1 });
    } else if (kind === 'folder') {
      results.folders = await Folder.find(folderQuery)
        .populate('owner', 'name email')
        .populate('parent', 'name path')
        .sort({ createdAt: -1 });
    } else {
      // Search both files and folders
      const [files, folders] = await Promise.all([
        FileMeta.find(fileQuery)
          .populate('uploadedBy', 'name email')
          .populate('parentFolder', 'name path')
          .sort({ createdAt: -1 }),
        Folder.find(folderQuery)
          .populate('owner', 'name email')
          .populate('parent', 'name path')
          .sort({ createdAt: -1 }),
      ]);

      results.files = files;
      results.folders = folders;
    }

    // Add summary
    results.summary = {
      totalFiles: results.files?.length || 0,
      totalFolders: results.folders?.length || 0,
      searchQuery: q || '',
      searchType: type || '',
      searchKind: kind || 'all',
    };

    res.json({
      success: true,
      results,
    });
  },
);
