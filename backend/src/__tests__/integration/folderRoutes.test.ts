import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// Define interface to extend Express Request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Mock the dependencies first, before any variable declarations
jest.mock('../../controllers/folderController');
jest.mock('../../middlewares/auth');
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
import { authenticate } from '../../middlewares/auth';
import folderRoutes from '../../routes/folderRoutes';

describe('Folder Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Configure mock for authenticate middleware
    (authenticate as jest.Mock).mockImplementation(
      (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        // Add a mock user to the request
        req.user = {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        };
        next();
      }
    );

    app.use('/api/v1/folders', folderRoutes);
    jest.clearAllMocks();
  });

  describe('POST /api/v1/folders/create', () => {
    it('should call createFolder controller', async () => {
      // Arrange
      const folderData = {
        name: 'New Folder',
        parent: 'parent123',
      };

      (createFolder as jest.Mock).mockImplementation(
        (req: Request, res: Response) => {
          res.status(201).json({
            success: true,
            data: {
              _id: 'folder123',
              name: 'New Folder',
              parent: 'parent123',
              owner: 'user123',
            },
          });
        }
      );

      // Act
      const response = await request(app)
        .post('/api/v1/folders/create')
        .send(folderData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(authenticate).toHaveBeenCalled();
      expect(createFolder).toHaveBeenCalled();
    });

    it('should handle authentication failure', async () => {
      // Arrange
      (authenticate as jest.Mock).mockImplementation(
        (req: Request, res: Response, next: NextFunction) => {
          return res.status(401).json({
            success: false,
            message: 'Authentication failed',
          });
        }
      );

      // Act
      const response = await request(app)
        .post('/api/v1/folders/create')
        .send({ name: 'New Folder' });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(createFolder).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/folders/tree', () => {
    it('should call listFolderTree controller', async () => {
      // Arrange
      (listFolderTree as jest.Mock).mockImplementation(
        (req: Request, res: Response) => {
          res.json({
            success: true,
            data: {
              folders: [{ _id: 'folder1', name: 'Folder 1', owner: 'user123' }],
              files: [],
              folderCount: 1,
              fileCount: 0,
              currentFolder: null,
            },
          });
        }
      );

      // Act
      const response = await request(app).get('/api/v1/folders/tree');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(authenticate).toHaveBeenCalled();
      expect(listFolderTree).toHaveBeenCalled();
    });

    it('should pass parent query parameter to controller', async () => {
      // Arrange
      (listFolderTree as jest.Mock).mockImplementation(
        (req: Request, res: Response) => {
          res.json({
            success: true,
            data: {
              folders: [],
              files: [],
              folderCount: 0,
              fileCount: 0,
              currentFolder: req.query.parent,
            },
          });
        }
      );

      // Act
      await request(app).get('/api/v1/folders/tree?parent=folder123');

      // Assert
      expect(listFolderTree).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { parent: 'folder123' },
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe('GET /api/v1/folders/all', () => {
    it('should call getAllFolders controller', async () => {
      // Arrange
      (getAllFolders as jest.Mock).mockImplementation(
        (req: Request, res: Response) => {
          res.json({
            success: true,
            data: {
              folders: [
                { _id: 'folder1', name: 'Folder 1', owner: 'user123' },
                { _id: 'folder2', name: 'Folder 2', owner: 'user123' },
              ],
              count: 2,
            },
          });
        }
      );

      // Act
      const response = await request(app).get('/api/v1/folders/all');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.folders).toHaveLength(2);
      expect(authenticate).toHaveBeenCalled();
      expect(getAllFolders).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/folders/:id', () => {
    it('should call deleteFolder controller with folder ID', async () => {
      // Arrange
      const folderId = 'folder123';

      (deleteFolder as jest.Mock).mockImplementation(
        (req: Request, res: Response) => {
          res.json({
            success: true,
            message: 'Folder and all contents deleted successfully',
          });
        }
      );

      // Act
      const response = await request(app).delete(`/api/v1/folders/${folderId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(authenticate).toHaveBeenCalled();
      expect(deleteFolder).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: folderId },
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe('PUT /api/v1/folders/:id', () => {
    it('should call updateFolder controller with folder ID and new data', async () => {
      // Arrange
      const folderId = 'folder123';
      const updateData = {
        name: 'Updated Folder Name',
      };

      (updateFolder as jest.Mock).mockImplementation(
        (req: Request, res: Response) => {
          res.json({
            success: true,
            data: {
              _id: folderId,
              name: updateData.name,
              owner: 'user123',
            },
            message: 'Folder updated successfully',
          });
        }
      );

      // Act
      const response = await request(app)
        .put(`/api/v1/folders/${folderId}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Folder Name');
      expect(authenticate).toHaveBeenCalled();
      expect(updateFolder).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: folderId },
          body: updateData,
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should handle folder not found error', async () => {
      // Arrange
      const folderId = 'notfound123';

      (updateFolder as jest.Mock).mockImplementation(
        (req: Request, res: Response) => {
          res.status(404).json({
            success: false,
            message: 'Folder not found',
          });
        }
      );

      // Act
      const response = await request(app)
        .put(`/api/v1/folders/${folderId}`)
        .send({ name: 'Updated Name' });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(updateFolder).toHaveBeenCalled();
    });
  });
});
