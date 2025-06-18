import request from 'supertest';
import express from 'express';
import bulkRoutes from '../../routes/bulkRoutes';
import { bulkAction } from '../../controllers/bulkController';
import { authenticate } from '../../middlewares/auth';

// Mock the dependencies
jest.mock('../../controllers/bulkController');
jest.mock('../../middlewares/auth');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('Bulk Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Configure mock for authenticate middleware
    (authenticate as jest.Mock).mockImplementation((req, res, next) => {
      // Add a mock user to the request
      req.user = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
      };
      next();
    });

    app.use('/api/v1/bulk', bulkRoutes);
    jest.clearAllMocks();
  });

  describe('POST /api/v1/bulk', () => {
    it('should call bulkAction controller for delete action', async () => {
      // Arrange
      const mockBulkAction = bulkAction as jest.Mock;
      mockBulkAction.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Successfully deleted 2 file(s) and 1 folder(s)',
          data: {
            deletedFiles: 2,
            deletedFolders: 1,
          },
        });
      });

      const requestData = {
        action: 'delete',
        files: ['file123', 'file456'],
        folders: ['folder789'],
      };

      // Act
      const response = await request(app)
        .post('/api/v1/bulk')
        .send(requestData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedFiles).toBe(2);
      expect(response.body.data.deletedFolders).toBe(1);
      expect(mockBulkAction).toHaveBeenCalled();
    });

    it('should call bulkAction controller for move action', async () => {
      // Arrange
      const mockBulkAction = bulkAction as jest.Mock;
      mockBulkAction.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Successfully moved 2 file(s) and 1 folder(s)',
          data: {
            movedFiles: 2,
            movedFolders: 1,
          },
        });
      });

      const requestData = {
        action: 'move',
        files: ['file123', 'file456'],
        folders: ['folder789'],
        targetFolder: 'folder999',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/bulk')
        .send(requestData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.movedFiles).toBe(2);
      expect(response.body.data.movedFolders).toBe(1);
      expect(mockBulkAction).toHaveBeenCalled();
    });

    it('should call bulkAction controller for download action', async () => {
      // Arrange
      const mockBulkAction = bulkAction as jest.Mock;
      mockBulkAction.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: {
            files: [
              {
                id: 'file123',
                name: 'test.pdf',
                downloadUrl: '/api/v1/files/preview/file123',
                size: 12345,
                mimetype: 'application/pdf',
              },
            ],
            folders: ['folder789'],
          },
        });
      });

      const requestData = {
        action: 'download',
        files: ['file123'],
        folders: ['folder789'],
      };

      // Act
      const response = await request(app)
        .post('/api/v1/bulk')
        .send(requestData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.folders).toHaveLength(1);
      expect(mockBulkAction).toHaveBeenCalled();
    });

    it('should handle authentication failure', async () => {
      // Override authenticate middleware to simulate auth failure
      const mockBulkAction = bulkAction as jest.Mock;
      (authenticate as jest.Mock).mockImplementation((req, res, next) => {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed',
        });
      });

      const requestData = {
        action: 'delete',
        files: ['file123'],
      };

      // Act
      const response = await request(app)
        .post('/api/v1/bulk')
        .send(requestData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(mockBulkAction).not.toHaveBeenCalled();
    });
  });
});
