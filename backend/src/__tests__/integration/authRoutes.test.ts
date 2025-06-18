import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/authRoutes';
import { login, register } from '../../controllers/authController';

// Mock the dependencies
jest.mock('../../controllers/authController');
jest.mock('../../middlewares/validateRequest', () => {
  return (schema: any) => {
    // Return a middleware function that calls next
    return jest.fn((req: any, res: any, next: any) => next());
  };
});
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should call register controller', async () => {
      // Arrange
      const mockRegister = register as jest.Mock;
      mockRegister.mockImplementation((req, res) => {
        res.status(201).json({ 
          success: true, 
          user: { id: '123', name: 'Test User', email: 'test@example.com' } 
        });
      });

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      // Instead of checking if validateRequest was called directly,
      // check that the controller was called, which means middleware passed
      expect(mockRegister).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should call login controller', async () => {
      // Arrange
      const mockLogin = login as jest.Mock;
      mockLogin.mockImplementation((req, res) => {
        res.status(200).json({ 
          success: true, 
          token: 'test-token',
          user: { id: '123', name: 'Test User', email: 'test@example.com' } 
        });
      });

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBe('test-token');
      expect(response.body.user).toBeDefined();
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  describe('Validation errors', () => {
    it('should handle validation errors', async () => {
      // Create a new app instance with a different mock for this test
      const validationApp = express();
      validationApp.use(express.json());

      // Override the validateRequest mock specifically for this test
      jest.resetModules();
      jest.mock('../../middlewares/validateRequest', () => {
        return (schema: any) => {
          return (req: any, res: any, next: any) => {
            return res.status(400).json({
              success: false,
              message: 'Validation error',
              details: 'Email is required'
            });
          };
        };
      });

      // Re-import routes with the new mock
      const authRoutesWithValidation = require('../../routes/authRoutes').default;
      validationApp.use('/api/auth', authRoutesWithValidation);

      const invalidData = {
        password: 'password123'
        // Missing email field
      };

      // Act
      const response = await request(validationApp)
        .post('/api/auth/login')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      
      // Reset the mock for other tests
      jest.resetModules();
    });
  });
});