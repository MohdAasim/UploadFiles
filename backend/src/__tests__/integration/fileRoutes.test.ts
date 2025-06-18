import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// Reset all mocks at the start
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

// Mock the dependencies first, before any variable declarations
jest.mock('../../controllers/fileController');
jest.mock('../../middlewares/auth');
jest.mock('../../middlewares/upload', () => ({
  single: jest.fn().mockImplementation(fieldName => {
    return (req: Request, res: Response, next: NextFunction) => next();
  }),
}));
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

// Define interface to extend Express Request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

describe('File Routes', () => {
  let app: express.Application;
  let authenticate: jest.Mock;
  let uploadFile: jest.Mock;
  let listFiles: jest.Mock;
  let previewFile: jest.Mock;
  let deleteFile: jest.Mock;
  let upload: { single: jest.Mock };

  beforeEach(() => {
    // Clear previous mocks and imports
    jest.clearAllMocks();

    // Import after resetting mocks - need to require them dynamically
    const controllers = require('../../controllers/fileController');
    const authMiddleware = require('../../middlewares/auth');
    const uploadMiddleware = require('../../middlewares/upload');
    const fileRoutes = require('../../routes/fileRoutes').default;

    // Set up references to mocks
    authenticate = authMiddleware.authenticate;
    uploadFile = controllers.uploadFile;
    listFiles = controllers.listFiles;
    previewFile = controllers.previewFile;
    deleteFile = controllers.deleteFile;
    upload = uploadMiddleware;

    // Set up Express app
    app = express();
    app.use(express.json());

    // Configure mock for authenticate middleware
    authenticate.mockImplementation(
      (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        // Add a mock user to the request
        req.user = {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
        };
        next();
      }
    );

    // Use the routes
    app.use('/api/v1/files', fileRoutes);

    // Verify upload.single was called (this happens when routes are registered)
    expect(upload.single).toHaveBeenCalledWith('file');

    // Reset mocks after route registration so tests start fresh
    jest.clearAllMocks();
  });

  describe('POST /api/v1/files/upload', () => {
    it('should call uploadFile controller', async () => {
      // Arrange
      uploadFile.mockImplementation((req: Request, res: Response) => {
        res.status(201).json({
          success: true,
          message: 'File uploaded successfully',
          data: { file: { id: 'file123', name: 'test.pdf' } },
        });
      });

      // Act
      const response = await request(app)
        .post('/api/v1/files/upload')
        .field('parentFolder', 'folder123')
        .attach('file', Buffer.from('test file content'), 'test.pdf');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('File uploaded successfully');
      expect(authenticate).toHaveBeenCalled();
      expect(uploadFile).toHaveBeenCalled();
    });

    it('should handle authentication failure', async () => {
      // Arrange
      authenticate.mockImplementation(
        (req: Request, res: Response, next: NextFunction) => {
          return res.status(401).json({
            success: false,
            message: 'Authentication failed',
          });
        }
      );

      // Act
      const response = await request(app)
        .post('/api/v1/files/upload')
        .attach('file', Buffer.from('test file content'), 'test.pdf');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/files', () => {
    it('should call listFiles controller', async () => {
      // Arrange
      const mockFiles = [
        { id: 'file1', name: 'file1.pdf' },
        { id: 'file2', name: 'file2.jpg' },
      ];

      listFiles.mockImplementation((req: Request, res: Response) => {
        res.json({
          success: true,
          data: {
            files: mockFiles,
            count: mockFiles.length,
          },
        });
      });

      // Act
      const response = await request(app).get('/api/v1/files');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(2);
      expect(authenticate).toHaveBeenCalled();
      expect(listFiles).toHaveBeenCalled();
    });

    it('should pass parentFolder query parameter to controller', async () => {
      // Arrange
      listFiles.mockImplementation((req: Request, res: Response) => {
        res.json({
          success: true,
          data: {
            files: [],
            count: 0,
          },
        });
      });

      // Act
      await request(app).get('/api/v1/files?parentFolder=folder123');

      // Assert
      expect(listFiles).toHaveBeenCalled();
      // Check that req.query.parentFolder was passed correctly
      expect(listFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { parentFolder: 'folder123' },
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe('GET /api/v1/files/preview/:id', () => {
    it('should call previewFile controller with file ID', async () => {
      // Arrange
      const fileId = 'file123';

      previewFile.mockImplementation((req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="test.pdf"');
        res.send(Buffer.from('mock pdf content'));
      });

      // Act
      const response = await request(app).get(
        `/api/v1/files/preview/${fileId}`
      );

      // Assert
      expect(response.status).toBe(200);
      expect(previewFile).toHaveBeenCalled();
      expect(previewFile).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: fileId },
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should handle file not found error', async () => {
      // Arrange
      const fileId = 'nonexistent';

      previewFile.mockImplementation((req: Request, res: Response) => {
        res.status(404).json({
          success: false,
          message: 'File not found',
        });
      });

      // Act
      const response = await request(app).get(
        `/api/v1/files/preview/${fileId}`
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(previewFile).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/files/:id', () => {
    it('should call deleteFile controller with file ID', async () => {
      // Arrange
      const fileId = 'file123';

      deleteFile.mockImplementation((req: Request, res: Response) => {
        res.json({
          success: true,
          message: 'File deleted successfully',
        });
      });

      // Act
      const response = await request(app).delete(`/api/v1/files/${fileId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(deleteFile).toHaveBeenCalled();
      expect(deleteFile).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: fileId },
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should handle unauthorized deletion', async () => {
      // Arrange
      const fileId = 'file123';

      deleteFile.mockImplementation((req: Request, res: Response) => {
        res.status(403).json({
          success: false,
          message: 'Not authorized to delete this file',
        });
      });

      // Act
      const response = await request(app).delete(`/api/v1/files/${fileId}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(deleteFile).toHaveBeenCalled();
    });
  });
});
