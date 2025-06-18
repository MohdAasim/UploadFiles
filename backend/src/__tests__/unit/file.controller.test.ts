import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

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

// Mock dependencies
jest.mock('../../models/FileMeta', () => ({
  __esModule: true,
  default: {
    findByIdAndDelete: jest.fn(),
  },
}));

jest.mock('../../services/file.service', () => ({
  uploadFileService: jest.fn(),
}));

jest.mock('../../repository/filemeta.repo', () => ({
  getFileMetaById: jest.fn(),
  getFileMetaByownerAndFolder: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  createReadStream: jest.fn(),
}));

jest.mock('path', () => ({
  resolve: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

// Import after mocks are set up
import {
  uploadFile,
  listFiles,
  previewFile,
  deleteFile,
} from '../../controllers/fileController';
import FileMeta from '../../models/FileMeta';
import { uploadFileService } from '../../services/file.service';
import {
  getFileMetaById,
  getFileMetaByownerAndFolder,
} from '../../repository/filemeta.repo';

// Create mock response and next function
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  return res;
};

const mockNext = jest.fn();

// Mock file stream
const mockReadStream = {
  pipe: jest.fn(),
  on: jest.fn().mockImplementation((event, callback) => {
    // Store the callback to simulate events later
    if (event === 'end') {
      mockReadStream.endCallback = callback;
    }
    return mockReadStream;
  }),
  endCallback: null,
};

describe('File Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
  });

  describe('uploadFile', () => {
    it('should throw 400 error if no file is uploaded', async () => {
      // Arrange
      const req: any = {
        user: { id: 'user123' },
        file: undefined,
        body: {},
      };
      const res = mockResponse();

      // Act
      await uploadFile(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No file uploaded',
          statusCode: 400,
        })
      );
      expect(uploadFileService).not.toHaveBeenCalled();
    });

    it('should throw 401 error if user is not authenticated', async () => {
      // Arrange
      const req: any = {
        user: undefined,
        file: { originalname: 'test.pdf' },
        body: {},
      };
      const res = mockResponse();

      // Act
      await uploadFile(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 401,
        })
      );
      expect(uploadFileService).not.toHaveBeenCalled();
    });

    it('should successfully upload a file', async () => {
      // Arrange
      const mockFile = { originalname: 'test.pdf' };
      const mockUser = { id: 'user123' };
      const mockSocketServer = {};
      const mockUploadResponse = {
        success: true,
        message: 'File uploaded successfully',
        data: { file: { id: 'file123', name: 'test.pdf' } },
      };

      const req: any = {
        user: mockUser,
        file: mockFile,
        body: { parentFolder: 'folder123' },
        app: { get: jest.fn().mockReturnValue(mockSocketServer) },
      };
      const res = mockResponse();

      (uploadFileService as jest.Mock).mockResolvedValue(mockUploadResponse);

      // Act
      await uploadFile(req, res, mockNext);

      // Assert
      expect(uploadFileService).toHaveBeenCalledWith({
        file: mockFile,
        socketServer: mockSocketServer,
        user: mockUser,
        parentFolder: 'folder123',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockUploadResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('listFiles', () => {
    it('should throw 401 error if user is not authenticated', async () => {
      // Arrange
      const req: any = {
        user: undefined,
        query: {},
      };
      const res = mockResponse();

      // Act
      await listFiles(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 401,
        })
      );
      expect(getFileMetaByownerAndFolder).not.toHaveBeenCalled();
    });

    it('should return files for root folder if no parentFolder is specified', async () => {
      // Arrange
      const mockUser = { id: 'user123' };
      const mockFiles = [
        { id: 'file1', name: 'file1.pdf' },
        { id: 'file2', name: 'file2.jpg' },
      ];

      const req: any = {
        user: mockUser,
        query: {},
      };
      const res = mockResponse();

      (getFileMetaByownerAndFolder as jest.Mock).mockResolvedValue(mockFiles);

      // Act
      await listFiles(req, res, mockNext);

      // Assert
      expect(getFileMetaByownerAndFolder).toHaveBeenCalledWith('user123', null);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          files: mockFiles,
          count: 2,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return files for specific folder if parentFolder is specified', async () => {
      // Arrange
      const mockUser = { id: 'user123' };
      const parentFolder = 'folder123';
      const mockFiles = [{ id: 'file3', name: 'file3.docx' }];

      const req: any = {
        user: mockUser,
        query: { parentFolder },
      };
      const res = mockResponse();

      (getFileMetaByownerAndFolder as jest.Mock).mockResolvedValue(mockFiles);

      // Act
      await listFiles(req, res, mockNext);

      // Assert
      expect(getFileMetaByownerAndFolder).toHaveBeenCalledWith(
        'user123',
        parentFolder
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          files: mockFiles,
          count: 1,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('previewFile', () => {
    it('should throw 404 error if file is not found', async () => {
      // Arrange
      const req: any = {
        user: { id: 'user123' },
        params: { id: 'file123' },
      };
      const res = mockResponse();

      (getFileMetaById as jest.Mock).mockResolvedValue(null);

      // Act
      await previewFile(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'File not found',
          statusCode: 404,
        })
      );
    });

    it('should throw 403 error if user is not authorized to preview file', async () => {
      // Arrange
      const userId = 'user123';
      const fileId = 'file123';
      const mockFile = {
        _id: fileId,
        uploadedBy: 'otherUser456',
        sharedWith: [],
      };

      const req: any = {
        user: { id: userId },
        params: { id: fileId },
      };
      const res = mockResponse();

      (getFileMetaById as jest.Mock).mockResolvedValue(mockFile);

      // Act
      await previewFile(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to preview this file',
          statusCode: 403,
        })
      );
    });

    it('should throw 404 error if file does not exist on filesystem', async () => {
      // Arrange
      const userId = 'user123';
      const fileId = 'file123';
      const mockFile = {
        _id: fileId,
        uploadedBy: userId,
        path: '/path/to/file.pdf',
        sharedWith: [],
      };

      const req: any = {
        user: { id: userId },
        params: { id: fileId },
      };
      const res = mockResponse();

      (getFileMetaById as jest.Mock).mockResolvedValue(mockFile);
      (path.resolve as jest.Mock).mockReturnValue('/resolved/path/to/file.pdf');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act
      await previewFile(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'File not found on server',
          statusCode: 404,
        })
      );
    });

    it('should stream file successfully for owner', async () => {
      // Arrange
      const userId = 'user123';
      const fileId = 'file123';
      const mockFile = {
        _id: fileId,
        uploadedBy: userId,
        path: '/path/to/file.pdf',
        originalName: 'test.pdf',
        mimetype: 'application/pdf',
        size: 12345,
        sharedWith: [],
      };

      const req: any = {
        user: { id: userId },
        params: { id: fileId },
      };
      const res = mockResponse();

      (getFileMetaById as jest.Mock).mockResolvedValue(mockFile);
      (path.resolve as jest.Mock).mockReturnValue('/resolved/path/to/file.pdf');
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Act
      await previewFile(req, res, mockNext);

      // Assert
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf'
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'inline; filename="test.pdf"'
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Length', '12345');
      expect(fs.createReadStream).toHaveBeenCalledWith(
        '/resolved/path/to/file.pdf'
      );
      expect(mockReadStream.pipe).toHaveBeenCalledWith(res);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should stream file successfully for shared user', async () => {
      // Arrange
      const userId = 'user123';
      const fileId = 'file123';
      const mockFile = {
        _id: fileId,
        uploadedBy: 'otherUser456',
        path: '/path/to/file.pdf',
        originalName: 'test.pdf',
        mimetype: 'application/pdf',
        size: 12345,
        sharedWith: [{ user: userId }],
      };

      const req: any = {
        user: { id: userId },
        params: { id: fileId },
      };
      const res = mockResponse();

      (getFileMetaById as jest.Mock).mockResolvedValue(mockFile);
      (path.resolve as jest.Mock).mockReturnValue('/resolved/path/to/file.pdf');
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Act
      await previewFile(req, res, mockNext);

      // Assert
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf'
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'inline; filename="test.pdf"'
      );
      expect(fs.createReadStream).toHaveBeenCalledWith(
        '/resolved/path/to/file.pdf'
      );
      expect(mockReadStream.pipe).toHaveBeenCalledWith(res);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('should throw 401 error if user is not authenticated', async () => {
      // Arrange
      const req: any = {
        user: undefined,
        params: { id: 'file123' },
      };
      const res = mockResponse();

      // Act
      await deleteFile(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
          statusCode: 401,
        })
      );
    });

    it('should throw 404 error if file is not found', async () => {
      // Arrange
      const req: any = {
        user: { id: 'user123' },
        params: { id: 'file123' },
      };
      const res = mockResponse();

      (getFileMetaById as jest.Mock).mockResolvedValue(null);

      // Act
      await deleteFile(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'File not found',
          statusCode: 404,
        })
      );
    });

    it('should throw 403 error if user is not authorized to delete file', async () => {
      // Arrange
      const userId = 'user123';
      const fileId = 'file123';
      const mockFile = {
        _id: fileId,
        uploadedBy: { toString: () => 'otherUser456' },
      };

      const req: any = {
        user: { id: userId },
        params: { id: fileId },
      };
      const res = mockResponse();

      (getFileMetaById as jest.Mock).mockResolvedValue(mockFile);

      // Act
      await deleteFile(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to delete this file',
          statusCode: 403,
        })
      );
    });

    it('should successfully delete file and its versions', async () => {
      // Arrange
      const userId = 'user123';
      const fileId = 'file123';
      const mockFile = {
        _id: fileId,
        originalName: 'test.pdf',
        path: '/path/to/file.pdf',
        uploadedBy: { toString: () => userId },
        versions: [
          { path: '/path/to/file_v1.pdf' },
          { path: '/path/to/file_v2.pdf' },
        ],
      };

      const req: any = {
        user: { id: userId },
        params: { id: fileId },
      };
      const res = mockResponse();

      (getFileMetaById as jest.Mock).mockResolvedValue(mockFile);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (FileMeta.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      // Act
      await deleteFile(req, res, mockNext);

      // Assert
      expect(fs.unlinkSync).toHaveBeenCalledTimes(3); // Main file + 2 versions
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(1, '/path/to/file.pdf');
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(2, '/path/to/file_v1.pdf');
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(3, '/path/to/file_v2.pdf');
      expect(FileMeta.findByIdAndDelete).toHaveBeenCalledWith(fileId);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'File deleted successfully',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing file on filesystem gracefully', async () => {
      // Arrange
      const userId = 'user123';
      const fileId = 'file123';
      const mockFile = {
        _id: fileId,
        originalName: 'test.pdf',
        path: '/path/to/file.pdf',
        uploadedBy: { toString: () => userId },
        versions: [],
      };

      const req: any = {
        user: { id: userId },
        params: { id: fileId },
      };
      const res = mockResponse();

      (getFileMetaById as jest.Mock).mockResolvedValue(mockFile);
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (FileMeta.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      // Act
      await deleteFile(req, res, mockNext);

      // Assert
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(FileMeta.findByIdAndDelete).toHaveBeenCalledWith(fileId);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'File deleted successfully',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
