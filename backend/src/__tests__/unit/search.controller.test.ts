import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Mock the asyncHandler to pass through the function with proper types
jest.mock('../../middlewares/errorHandler', () => ({
  asyncHandler:
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        return await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    },
  createError: (message: string, statusCode: number): Error => {
    const error: any = new Error(message);
    error.statusCode = statusCode;
    return error;
  },
}));

// Mock the models
jest.mock('../../models/FileMeta', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('../../models/Folder', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

// Import after mocks are set up
import { searchFilesAndFolders } from '../../controllers/searchController';
import FileMeta from '../../models/FileMeta';
import Folder from '../../models/Folder';
import logger from '../../utils/logger';

// Create mock response and next function
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Search Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchFilesAndFolders', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const mockReq: any = {
        user: undefined,
        query: {
          q: 'test',
        },
      };

      const mockRes = mockResponse();

      // Act
      await searchFilesAndFolders(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
          statusCode: 401,
        })
      );
      expect(logger.warn).toHaveBeenCalledWith(
        'Search attempted without authentication'
      );
    });

    it('should return empty results for empty search query', async () => {
      // Arrange
      const mockReq: any = {
        user: { id: 'user123' },
        query: {
          q: '',
          kind: 'all',
        },
      };

      const mockRes = mockResponse();

      // Act
      await searchFilesAndFolders(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          files: [],
          folders: [],
          summary: {
            totalFiles: 0,
            totalFolders: 0,
            searchQuery: '',
            searchType: '',
            searchKind: 'all',
          },
        },
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Empty search query, returning empty results'
      );
    });

    it('should search files only when kind is file', async () => {
      // Arrange
      const mockReq: any = {
        user: { id: 'user123' },
        query: {
          q: 'test',
          kind: 'file',
        },
      };

      const mockRes = mockResponse();

      const mockFiles = [
        { _id: 'file1', originalName: 'test_file1.pdf' },
        { _id: 'file2', originalName: 'test_file2.png' },
      ];

      const mockFilesQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockFiles),
      };

      (FileMeta.find as jest.Mock).mockReturnValue(mockFilesQuery);

      // Act
      await searchFilesAndFolders(mockReq, mockRes, mockNext);

      // Assert
      expect(FileMeta.find).toHaveBeenCalledWith({
        uploadedBy: 'user123',
        originalName: { $regex: 'test', $options: 'i' },
      });
      expect(Folder.find).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          files: mockFiles,
          folders: [],
          summary: {
            totalFiles: 2,
            totalFolders: 0,
            searchQuery: 'test',
            searchType: '',
            searchKind: 'file',
          },
        },
      });
    });

    it('should search folders only when kind is folder', async () => {
      // Arrange
      const mockReq: any = {
        user: { id: 'user123' },
        query: {
          q: 'test',
          kind: 'folder',
        },
      };

      const mockRes = mockResponse();

      const mockFolders = [
        { _id: 'folder1', name: 'test_folder1' },
        { _id: 'folder2', name: 'test_folder2' },
      ];

      const mockFoldersQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockFolders),
      };

      (Folder.find as jest.Mock).mockReturnValue(mockFoldersQuery);

      // Act
      await searchFilesAndFolders(mockReq, mockRes, mockNext);

      // Assert
      expect(Folder.find).toHaveBeenCalledWith({
        owner: 'user123',
        name: { $regex: 'test', $options: 'i' },
      });
      expect(FileMeta.find).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          files: [],
          folders: mockFolders,
          summary: {
            totalFiles: 0,
            totalFolders: 2,
            searchQuery: 'test',
            searchType: '',
            searchKind: 'folder',
          },
        },
      });
    });

    it('should search both files and folders when kind is all', async () => {
      // Arrange
      const mockReq: any = {
        user: { id: 'user123' },
        query: {
          q: 'test',
          kind: 'all',
        },
      };

      const mockRes = mockResponse();

      const mockFiles = [
        { _id: 'file1', originalName: 'test_file1.pdf' },
        { _id: 'file2', originalName: 'test_file2.png' },
      ];

      const mockFolders = [{ _id: 'folder1', name: 'test_folder1' }];

      const mockFilesQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockFiles),
      };

      const mockFoldersQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockFolders),
      };

      (FileMeta.find as jest.Mock).mockReturnValue(mockFilesQuery);
      (Folder.find as jest.Mock).mockReturnValue(mockFoldersQuery);

      // Act
      await searchFilesAndFolders(mockReq, mockRes, mockNext);

      // Assert
      expect(FileMeta.find).toHaveBeenCalled();
      expect(Folder.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          files: mockFiles,
          folders: mockFolders,
          summary: {
            totalFiles: 2,
            totalFolders: 1,
            searchQuery: 'test',
            searchType: '',
            searchKind: 'all',
          },
        },
      });
    });

    it('should apply type filter when searching files', async () => {
      // Arrange
      const mockReq: any = {
        user: { id: 'user123' },
        query: {
          q: 'test',
          type: 'pdf',
          kind: 'file',
        },
      };

      const mockRes = mockResponse();

      const mockFiles = [
        {
          _id: 'file1',
          originalName: 'test_file1.pdf',
          mimetype: 'application/pdf',
        },
      ];

      const mockFilesQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockFiles),
      };

      (FileMeta.find as jest.Mock).mockReturnValue(mockFilesQuery);

      // Act
      await searchFilesAndFolders(mockReq, mockRes, mockNext);

      // Assert
      expect(FileMeta.find).toHaveBeenCalledWith({
        uploadedBy: 'user123',
        originalName: { $regex: 'test', $options: 'i' },
        mimetype: { $regex: 'pdf', $options: 'i' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          files: mockFiles,
          folders: [],
          summary: {
            totalFiles: 1,
            totalFolders: 0,
            searchQuery: 'test',
            searchType: 'pdf',
            searchKind: 'file',
          },
        },
      });
    });

    it('should apply inFolder filter when searching', async () => {
      // Arrange
      const folderId = 'folder123';

      const mockReq: any = {
        user: { id: 'user123' },
        query: {
          q: 'test',
          inFolder: folderId,
          kind: 'all',
        },
      };

      const mockRes = mockResponse();

      const mockFiles = [
        {
          _id: 'file1',
          originalName: 'test_file1.pdf',
          parentFolder: folderId,
        },
      ];

      const mockFolders = [
        { _id: 'subfolder1', name: 'test_subfolder', parent: folderId },
      ];

      const mockFilesQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockFiles),
      };

      const mockFoldersQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockFolders),
      };

      (FileMeta.find as jest.Mock).mockReturnValue(mockFilesQuery);
      (Folder.find as jest.Mock).mockReturnValue(mockFoldersQuery);

      // Act
      await searchFilesAndFolders(mockReq, mockRes, mockNext);

      // Assert
      expect(FileMeta.find).toHaveBeenCalledWith({
        uploadedBy: 'user123',
        originalName: { $regex: 'test', $options: 'i' },
        parentFolder: folderId,
      });

      expect(Folder.find).toHaveBeenCalledWith({
        owner: 'user123',
        name: { $regex: 'test', $options: 'i' },
        parent: folderId,
      });

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            summary: expect.objectContaining({
              searchQuery: 'test',
              searchKind: 'all',
            }),
          }),
        })
      );
    });

    it('should handle search errors and throw 500', async () => {
      // Arrange
      const mockReq: any = {
        user: { id: 'user123' },
        query: {
          q: 'test',
          kind: 'all',
        },
      };

      const mockRes = mockResponse();

      const testError = new Error('Database error');
      (FileMeta.find as jest.Mock).mockImplementation(() => {
        throw testError;
      });

      // Act
      await searchFilesAndFolders(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Search failed',
          statusCode: 500,
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
