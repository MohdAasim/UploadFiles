import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';

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

// Mock the dependencies
jest.mock('../../models/Folder', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.mock('../../models/FileMeta', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.mock('../../services/folder.service', () => ({
  addFolder: jest.fn(),
  getFolderTree: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

// Import after mocks are set up
import {
  createFolder,
  listFolderTree,
  getAllFolders,
  deleteFolder,
  updateFolder,
} from '../../controllers/folderController';
import Folder from '../../models/Folder';
import FileMeta from '../../models/FileMeta';
import { addFolder } from '../../services/folder.service';

// Create mock response and next function
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Folder Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFolder', () => {
    it('should create a folder successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };
      const mockReq: any = {
        user: mockUser,
        body: {
          name: 'New Folder',
          parent: 'parent123',
        },
      };

      const mockRes = mockResponse();

      const mockFolderResponse = {
        success: true,
        data: {
          _id: 'folder123',
          name: 'New Folder',
          parent: 'parent123',
          owner: 'user123',
        },
      };

      (addFolder as jest.Mock).mockResolvedValue(mockFolderResponse);

      // Act
      await createFolder(mockReq, mockRes, mockNext);

      // Assert
      expect(addFolder).toHaveBeenCalledWith(
        'New Folder',
        'parent123',
        'user123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockFolderResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should create a root folder when parent is not provided', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };
      const mockReq: any = {
        user: mockUser,
        body: {
          name: 'Root Folder',
        },
      };

      const mockRes = mockResponse();

      const mockFolderResponse = {
        success: true,
        data: {
          _id: 'folder123',
          name: 'Root Folder',
          parent: null,
          owner: 'user123',
        },
      };

      (addFolder as jest.Mock).mockResolvedValue(mockFolderResponse);

      // Act
      await createFolder(mockReq, mockRes, mockNext);

      // Assert
      expect(addFolder).toHaveBeenCalledWith(
        'Root Folder',
        undefined,
        'user123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockFolderResponse);
    });
  });

  describe('listFolderTree', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const mockReq: any = {
        user: {},
        query: {},
      };

      const mockRes = mockResponse();

      // Act
      await listFolderTree(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 401,
        })
      );
    });

    it('should list folders and files for root folder', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };
      const mockReq: any = {
        user: mockUser,
        query: {},
      };

      const mockRes = mockResponse();

      const mockFolders = [
        { _id: 'folder1', name: 'Folder 1', owner: 'user123' },
        { _id: 'folder2', name: 'Folder 2', owner: 'user123' },
      ];

      const mockFiles = [
        { _id: 'file1', originalName: 'file1.pdf', uploadedBy: 'user123' },
        { _id: 'file2', originalName: 'file2.jpg', uploadedBy: 'user123' },
      ];

      (Folder.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockFolders),
        }),
      });

      (FileMeta.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockFiles),
          }),
        }),
      });

      // Act
      await listFolderTree(mockReq, mockRes, mockNext);

      // Assert
      expect(Folder.find).toHaveBeenCalledWith({
        owner: 'user123',
        parent: null,
      });

      expect(FileMeta.find).toHaveBeenCalledWith({
        uploadedBy: 'user123',
        parentFolder: null,
      });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          folders: mockFolders,
          files: mockFiles,
          folderCount: 2,
          fileCount: 2,
          currentFolder: null,
        },
      });
    });

    it('should list folders and files for specific parent folder', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };
      const parentFolderId = 'parent123';

      const mockReq: any = {
        user: mockUser,
        query: { parent: parentFolderId },
      };

      const mockRes = mockResponse();

      const mockFolders = [
        {
          _id: 'subfolder1',
          name: 'Sub Folder 1',
          owner: 'user123',
          parent: parentFolderId,
        },
      ];

      const mockFiles = [
        {
          _id: 'file1',
          originalName: 'file1.pdf',
          uploadedBy: 'user123',
          parentFolder: parentFolderId,
        },
      ];

      (Folder.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockFolders),
        }),
      });

      (FileMeta.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockFiles),
          }),
        }),
      });

      // Act
      await listFolderTree(mockReq, mockRes, mockNext);

      // Assert
      expect(Folder.find).toHaveBeenCalledWith({
        owner: 'user123',
        parent: parentFolderId,
      });

      expect(FileMeta.find).toHaveBeenCalledWith({
        uploadedBy: 'user123',
        parentFolder: parentFolderId,
      });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          folders: mockFolders,
          files: mockFiles,
          folderCount: 1,
          fileCount: 1,
          currentFolder: parentFolderId,
        },
      });
    });
  });

  describe('getAllFolders', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const mockReq: any = {
        user: {},
      };

      const mockRes = mockResponse();

      // Act
      await getAllFolders(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 401,
        })
      );
    });

    it('should list all user folders', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };
      const mockReq: any = {
        user: mockUser,
      };

      const mockRes = mockResponse();

      const mockFolders = [
        { _id: 'folder1', name: 'Folder 1', owner: 'user123', parent: null },
        {
          _id: 'folder2',
          name: 'Folder 2',
          owner: 'user123',
          parent: 'folder1',
        },
      ];

      (Folder.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockFolders),
          }),
        }),
      });

      // Act
      await getAllFolders(mockReq, mockRes, mockNext);

      // Assert
      expect(Folder.find).toHaveBeenCalledWith({ owner: 'user123' });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          folders: mockFolders,
          count: 2,
        },
      });
    });
  });

  describe('deleteFolder', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const mockReq: any = {
        user: {},
        params: { id: 'folder123' },
      };

      const mockRes = mockResponse();

      // Act
      await deleteFolder(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
          statusCode: 401,
        })
      );
    });

    it('should return 404 if folder does not exist', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };
      const mockReq: any = {
        user: mockUser,
        params: { id: 'folder123' },
      };

      const mockRes = mockResponse();

      (Folder.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await deleteFolder(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Folder not found',
          statusCode: 404,
        })
      );
    });

    it('should return 403 if user does not own the folder', async () => {
      // Arrange
      const userId = 'user123';
      const otherUserId = 'otherUser456';

      const mockUser = { id: userId, email: 'test@example.com', role: 'user' };
      const mockReq: any = {
        user: mockUser,
        params: { id: 'folder123' },
      };

      const mockRes = mockResponse();

      const mockFolder = {
        _id: 'folder123',
        name: 'Test Folder',
        owner: { toString: () => otherUserId },
      };

      (Folder.findById as jest.Mock).mockResolvedValue(mockFolder);

      // Act
      await deleteFolder(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to delete this folder',
          statusCode: 403,
        })
      );
    });

    it('should delete folder recursively with all contents', async () => {
      // Arrange
      const userId = 'user123';

      const mockUser = { id: userId, email: 'test@example.com', role: 'user' };
      const mockReq: any = {
        user: mockUser,
        params: { id: 'folder123' },
      };

      const mockRes = mockResponse();

      const mockFolder = {
        _id: 'folder123',
        name: 'Test Folder',
        owner: { toString: () => userId },
      };

      const mockSubfolder = {
        _id: { toString: () => 'subfolder123' },
        name: 'Sub Folder',
      };

      const mockFile = {
        _id: 'file123',
        path: '/path/to/file.pdf',
        versions: [{ path: '/path/to/file_v1.pdf' }],
      };

      (Folder.findById as jest.Mock).mockResolvedValue(mockFolder);

      // Set up find calls for recursive function
      (Folder.find as jest.Mock).mockImplementation(query => {
        if (query.parent === 'folder123' && query.owner === userId) {
          return Promise.resolve([mockSubfolder]);
        }
        if (query.parent === 'subfolder123' && query.owner === userId) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      (FileMeta.find as jest.Mock).mockImplementation(query => {
        if (query.parentFolder === 'folder123' && query.uploadedBy === userId) {
          return Promise.resolve([mockFile]);
        }
        if (
          query.parentFolder === 'subfolder123' &&
          query.uploadedBy === userId
        ) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (Folder.findByIdAndDelete as jest.Mock).mockResolvedValue({});
      (FileMeta.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      // Act
      await deleteFolder(mockReq, mockRes, mockNext);

      // Assert
      expect(fs.unlinkSync).toHaveBeenCalledWith('/path/to/file.pdf');
      expect(fs.unlinkSync).toHaveBeenCalledWith('/path/to/file_v1.pdf');
      expect(FileMeta.findByIdAndDelete).toHaveBeenCalledWith('file123');
      expect(Folder.findByIdAndDelete).toHaveBeenCalledTimes(2); // Main folder + subfolder

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Folder and all contents deleted successfully',
      });
    });
  });

  describe('updateFolder', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const mockReq: any = {
        user: {},
        params: { id: 'folder123' },
        body: { name: 'Updated Folder' },
      };

      const mockRes = mockResponse();

      // Act
      await updateFolder(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
          statusCode: 401,
        })
      );
    });

    it('should return 400 if folder name is missing', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };
      const mockReq: any = {
        user: mockUser,
        params: { id: 'folder123' },
        body: {}, // Missing name
      };

      const mockRes = mockResponse();

      // Act
      await updateFolder(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Folder name is required',
          statusCode: 400,
        })
      );
    });

    it('should return 404 if folder does not exist', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };
      const mockReq: any = {
        user: mockUser,
        params: { id: 'folder123' },
        body: { name: 'Updated Folder' },
      };

      const mockRes = mockResponse();

      (Folder.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await updateFolder(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Folder not found',
          statusCode: 404,
        })
      );
    });

    it('should return 403 if user does not own the folder', async () => {
      // Arrange
      const userId = 'user123';
      const otherUserId = 'otherUser456';

      const mockUser = { id: userId, email: 'test@example.com', role: 'user' };
      const mockReq: any = {
        user: mockUser,
        params: { id: 'folder123' },
        body: { name: 'Updated Folder' },
      };

      const mockRes = mockResponse();

      const mockFolder = {
        _id: 'folder123',
        name: 'Test Folder',
        owner: { toString: () => otherUserId },
      };

      (Folder.findById as jest.Mock).mockResolvedValue(mockFolder);

      // Act
      await updateFolder(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to update this folder',
          statusCode: 403,
        })
      );
    });

    it('should return 400 if folder with same name exists in same parent', async () => {
      // Arrange
      const userId = 'user123';

      const mockUser = { id: userId, email: 'test@example.com', role: 'user' };
      const mockReq: any = {
        user: mockUser,
        params: { id: 'folder123' },
        body: { name: 'Duplicate Folder' },
      };

      const mockRes = mockResponse();

      const mockFolder = {
        _id: 'folder123',
        name: 'Test Folder',
        parent: 'parent123',
        owner: { toString: () => userId },
      };

      const mockExistingFolder = {
        _id: 'existing123',
        name: 'Duplicate Folder',
        parent: 'parent123',
      };

      (Folder.findById as jest.Mock).mockResolvedValue(mockFolder);
      (Folder.findOne as jest.Mock).mockResolvedValue(mockExistingFolder);

      // Act
      await updateFolder(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            'A folder with this name already exists in the same location',
          statusCode: 400,
        })
      );
    });
  });
});
