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

// Mock dependencies
jest.mock('../../controllers/searchController');
jest.mock('../../middlewares/auth');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()
}));

// Import after mocks are set up
import { searchFilesAndFolders } from '../../controllers/searchController';
import { authenticate } from '../../middlewares/auth';
import searchRoutes from '../../routes/searchRoutes';

describe('Search Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Configure mock for authenticate middleware
    (authenticate as jest.Mock).mockImplementation((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // Add a mock user to the request
      req.user = { 
        id: 'user123', 
        name: 'Test User', 
        email: 'test@example.com',
        role: 'user'
      };
      next();
    });
    
    app.use('/api/v1/search', searchRoutes);
    jest.clearAllMocks();
  });

  describe('GET /api/v1/search', () => {
    it('should call searchFilesAndFolders controller', async () => {
      // Arrange
      (searchFilesAndFolders as jest.Mock).mockImplementation((req: Request, res: Response) => {
        res.json({
          success: true,
          data: {
            files: [],
            folders: [],
            summary: {
              totalFiles: 0,
              totalFolders: 0,
              searchQuery: req.query.q,
              searchType: req.query.type || '',
              searchKind: req.query.kind || 'all'
            }
          }
        });
      });

      // Act
      const response = await request(app).get('/api/v1/search?q=test');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(authenticate).toHaveBeenCalled();
      expect(searchFilesAndFolders).toHaveBeenCalled();
    });

    it('should pass search parameters to controller', async () => {
      // Arrange
      (searchFilesAndFolders as jest.Mock).mockImplementation((req: Request, res: Response) => {
        const { q, type, inFolder, kind } = req.query;
        
        res.json({
          success: true,
          data: {
            summary: {
              searchQuery: q,
              searchType: type || '',
              searchKind: kind || 'all',
              inFolder: inFolder || null
            }
          }
        });
      });

      // Act
      await request(app).get('/api/v1/search?q=test&type=pdf&kind=file&inFolder=folder123');

      // Assert
      expect(searchFilesAndFolders).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            q: 'test',
            type: 'pdf',
            kind: 'file',
            inFolder: 'folder123'
          }
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should handle authentication failure', async () => {
      // Arrange
      (authenticate as jest.Mock).mockImplementation((req: Request, res: Response, next: NextFunction) => {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      });

      // Act
      const response = await request(app).get('/api/v1/search?q=test');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(searchFilesAndFolders).not.toHaveBeenCalled();
    });

    it('should handle search errors from controller', async () => {
      // Arrange
      (searchFilesAndFolders as jest.Mock).mockImplementation((req: Request, res: Response) => {
        res.status(500).json({
          success: false,
          message: 'Search failed due to server error'
        });
      });

      // Act
      const response = await request(app).get('/api/v1/search?q=test');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(authenticate).toHaveBeenCalled();
      expect(searchFilesAndFolders).toHaveBeenCalled();
    });

    it('should return empty results for empty search query', async () => {
      // Arrange
      (searchFilesAndFolders as jest.Mock).mockImplementation((req: Request, res: Response) => {
        res.json({
          success: true,
          data: {
            files: [],
            folders: [],
            summary: {
              totalFiles: 0,
              totalFolders: 0,
              searchQuery: '',
              searchType: '',
              searchKind: 'all'
            }
          }
        });
      });

      // Act
      const response = await request(app).get('/api/v1/search?q=');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toEqual([]);
      expect(response.body.data.folders).toEqual([]);
    });
  });
});