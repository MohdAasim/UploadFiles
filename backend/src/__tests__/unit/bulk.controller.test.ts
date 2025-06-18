import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Mock the asyncHandler to pass through the function with proper types
jest.mock('../../middlewares/errorHandler', () => ({
  asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
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
  }
}));

// Mock the dependencies before imports
jest.mock('../../models/FileMeta', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn()
  }
}));

jest.mock('../../models/Folder', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn()
  }
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn()
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()
}));

// Also mock mongoose.Types.ObjectId
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id)
    }
  };
});

// Import after mocks are set up
import { bulkAction } from '../../controllers/bulkController';
import FileMeta from '../../models/FileMeta';
import Folder from '../../models/Folder';
import fs from 'fs';

// Create mock response object
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Create mock next function
const mockNext = jest.fn();

describe('Bulk Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('bulkAction', () => {
    // Common test setup
    const userId = 'user123';
    const mockUser = { id: userId, name: 'Test User', email: 'test@example.com' };

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const req: any = {
        user: undefined,
        body: { action: 'delete', files: ['file1'] }
      };
      const res = mockResponse();
      
      // Act
      await bulkAction(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not authenticated',
        statusCode: 401
      }));
    });

    it('should return 400 if no files or folders are provided', async () => {
      // Arrange
      const req: any = {
        user: mockUser,
        body: { 
          action: 'delete' 
        }
      };
      const res = mockResponse();
      
      // Act
      await bulkAction(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No items selected for bulk action', // Changed to match actual error
        statusCode: 400
      }));
    });

    it('should return 400 if files and folders arrays are empty', async () => {
      // Arrange
      const req: any = {
        user: mockUser,
        body: { action: 'delete', files: [], folders: [] }
      };
      const res = mockResponse();
      
      // Act
      await bulkAction(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No items selected for bulk action',
        statusCode: 400
      }));
    });

    describe('Delete Action', () => {
      it('should successfully delete files', async () => {
        // Arrange
        const fileId1 = '507f1f77bcf86cd799439011'; // Valid ObjectId format
        const fileId2 = '507f1f77bcf86cd799439012'; // Valid ObjectId format
        
        const mockFile1 = {
          _id: fileId1,
          id: fileId1,
          path: '/path/to/file1.pdf',
          uploadedBy: userId,
          versions: [{ path: '/path/to/file1_v1.pdf' }]
        };
        
        const mockFile2 = {
          _id: fileId2,
          id: fileId2,
          path: '/path/to/file2.jpg',
          uploadedBy: userId,
          versions: [{ path: '/path/to/file2_v1.jpg' }]
        };
        
        const req: any = {
          user: mockUser,
          body: { 
            action: 'delete', 
            files: [fileId1, fileId2],
            folders: []
          }
        };
        
        const res = mockResponse();
        
        (FileMeta.findById as jest.Mock).mockImplementation((id) => {
          if (id === fileId1) return Promise.resolve(mockFile1);
          if (id === fileId2) return Promise.resolve(mockFile2);
          return Promise.resolve(null);
        });
        
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (FileMeta.findByIdAndDelete as jest.Mock).mockResolvedValue({});
        
        // Act
        await bulkAction(req, res, mockNext);
        
        // Assert
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: {
            deletedFiles: 2,
            deletedFolders: 0
          }
        }));
        
        expect(fs.unlinkSync).toHaveBeenCalledTimes(4); // 2 files + 2 versions
        expect(FileMeta.findByIdAndDelete).toHaveBeenCalledTimes(2);
      });
      
      it('should successfully delete folders recursively', async () => {
        // Arrange
        const folderId = '507f1f77bcf86cd799439013'; // Valid ObjectId format
        const subFolderId = '507f1f77bcf86cd799439014'; // Valid ObjectId format
        
        const mockFolder = {
          _id: folderId,
          id: folderId,
          owner: userId
        };
        
        const mockSubFolder = {
          _id: subFolderId,
          id: subFolderId,
          owner: userId,
          parent: folderId
        };
        
        const mockFileInFolder = {
          _id: '507f1f77bcf86cd799439015',
          id: '507f1f77bcf86cd799439015',
          path: '/path/to/fileInFolder.txt',
          uploadedBy: userId,
          versions: []
        };
        
        const req: any = {
          user: mockUser,
          body: { 
            action: 'delete', 
            files: [],
            folders: [folderId]
          }
        };
        
        const res = mockResponse();
        
        (Folder.findById as jest.Mock).mockImplementation((id) => {
          if (id === folderId) return Promise.resolve(mockFolder);
          if (id === subFolderId) return Promise.resolve(mockSubFolder);
          return Promise.resolve(null);
        });
        
        (Folder.find as jest.Mock).mockImplementation((query) => {
          if (query.parent === folderId && query.owner === userId) {
            return Promise.resolve([mockSubFolder]);
          }
          return Promise.resolve([]);
        });
        
        (FileMeta.find as jest.Mock).mockImplementation((query) => {
          if (query.parentFolder === folderId && query.uploadedBy === userId) {
            return Promise.resolve([mockFileInFolder]);
          }
          return Promise.resolve([]);
        });
        
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (Folder.findByIdAndDelete as jest.Mock).mockResolvedValue({});
        (FileMeta.findByIdAndDelete as jest.Mock).mockResolvedValue({});
        
        // Act
        await bulkAction(req, res, mockNext);
        
        // Assert
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            deletedFolders: expect.any(Number)
          })
        }));
        
        expect(Folder.findByIdAndDelete).toHaveBeenCalled();
        expect(FileMeta.findByIdAndDelete).toHaveBeenCalled();
      });
    });
    
    describe('Move Action', () => {
      it('should return 400 if target folder is not provided', async () => {
        // Arrange
        const req: any = {
          user: mockUser,
          body: { 
            action: 'move', 
            files: ['507f1f77bcf86cd799439016'], // Valid ObjectId format
            folders: []
          }
        };
        
        const res = mockResponse();
        
        // Act
        await bulkAction(req, res, mockNext);
        
        // Assert
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
          message: 'No target folder provided',
          statusCode: 400
        }));
      });
      
      it('should validate target folder when not root', async () => {
        // Arrange
        const targetFolderId = '507f1f77bcf86cd799439017'; // Valid ObjectId format
        const req: any = {
          user: mockUser,
          body: { 
            action: 'move', 
            files: ['507f1f77bcf86cd799439018'], // Valid ObjectId format
            targetFolder: targetFolderId
          }
        };
        
        const res = mockResponse();
        
        (Folder.findById as jest.Mock).mockResolvedValue(null);
        
        // Act
        await bulkAction(req, res, mockNext);
        
        // Assert
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
          message: 'Invalid target folder',
          statusCode: 400
        }));
      });
      
      it('should successfully move files to target folder', async () => {
        // Arrange
        const fileId = '507f1f77bcf86cd799439019'; // Valid ObjectId format
        const targetFolderId = '507f1f77bcf86cd799439020'; // Valid ObjectId format
        
        const mockFile = {
          _id: fileId,
          id: fileId,
          uploadedBy: userId,
          parentFolder: null, // Add this property that will be set by the controller
          save: jest.fn().mockResolvedValue(true)
        };
        
        const mockTargetFolder = {
          _id: targetFolderId,
          id: targetFolderId,
          owner: userId
        };
        
        const req: any = {
          user: mockUser,
          body: { 
            action: 'move', 
            files: [fileId],
            folders: [],
            targetFolder: targetFolderId
          }
        };
        
        const res = mockResponse();
        
        (FileMeta.findById as jest.Mock).mockResolvedValue(mockFile);
        (Folder.findById as jest.Mock).mockResolvedValue(mockTargetFolder);
        
        // Act
        await bulkAction(req, res, mockNext);
        
        // Assert
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: {
            movedFiles: 1,
            movedFolders: 0
          }
        }));
        
        expect(mockFile.save).toHaveBeenCalled();
        // Check that the parentFolder property was set
        expect(mockFile.parentFolder).toBeTruthy();
      });
    });
    
    describe('Download Action', () => {
      it('should prepare download list of files', async () => {
        // Arrange
        const fileId = '507f1f77bcf86cd799439021'; // Valid ObjectId format
        const mockFile = {
          _id: fileId,
          id: fileId,
          originalName: 'test.pdf',
          size: 12345,
          mimetype: 'application/pdf',
          uploadedBy: userId
        };
        
        const req: any = {
          user: mockUser,
          body: { 
            action: 'download', 
            files: [fileId],
            folders: []
          }
        };
        
        const res = mockResponse();
        
        (FileMeta.findById as jest.Mock).mockResolvedValue(mockFile);
        
        // Act
        await bulkAction(req, res, mockNext);
        
        // Assert
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            files: [expect.objectContaining({
              id: fileId,
              name: 'test.pdf',
              downloadUrl: `/api/v1/files/preview/${fileId}`
            })],
            folders: []
          })
        }));
      });
      
      it('should prepare download list for files in folders', async () => {
        // Arrange
        const folderId = '507f1f77bcf86cd799439022'; // Valid ObjectId format
        const fileInFolderId = '507f1f77bcf86cd799439023'; // Valid ObjectId format
        
        const mockFileInFolder = {
          _id: fileInFolderId,
          id: fileInFolderId,
          originalName: 'fileInFolder.txt',
          size: 5678,
          mimetype: 'text/plain',
          uploadedBy: userId
        };
        
        const req: any = {
          user: mockUser,
          body: { 
            action: 'download', 
            files: [],
            folders: [folderId]
          }
        };
        
        const res = mockResponse();
        
        (Folder.find as jest.Mock).mockResolvedValue([]);
        (FileMeta.find as jest.Mock).mockResolvedValue([mockFileInFolder]);
        
        // Act
        await bulkAction(req, res, mockNext);
        
        // Assert
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            files: [expect.objectContaining({
              id: fileInFolderId,
              name: 'fileInFolder.txt'
            })],
            folders: [folderId]
          })
        }));
      });
    });
    
    it('should return 400 for invalid action', async () => {
      // Arrange
      const req: any = {
        user: mockUser,
        body: { 
          action: 'invalidAction', 
          files: ['507f1f77bcf86cd799439024'] // Valid ObjectId format
        }
      };
      
      const res = mockResponse();
      
      // Act
      await bulkAction(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid action',
        statusCode: 400
      }));
    });
  });
});