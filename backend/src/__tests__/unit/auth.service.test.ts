import { registerUser, loginUser } from '../../services/auth.service';
import { createUser, getUserByEmail } from '../../repository/auth.repo';
import { generateToken } from '../../services/jwt-service';

// Mock the dependencies
jest.mock('../../repository/auth.repo');
jest.mock('../../services/jwt-service');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const mockUserData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockCreatedUser = {
        _id: 'user123',
        name: mockUserData.name,
        email: mockUserData.email,
        role: 'user',
      };
      
      (getUserByEmail as jest.Mock).mockResolvedValue(null);
      (createUser as jest.Mock).mockResolvedValue(mockCreatedUser);
      
      // Act
      const result = await registerUser(mockUserData);
      
      // Assert
      expect(getUserByEmail).toHaveBeenCalledWith(mockUserData.email);
      expect(createUser).toHaveBeenCalledWith(mockUserData);
      expect(result).toEqual({
        success: true,
        user: {
          id: mockCreatedUser._id,
          name: mockCreatedUser.name,
          email: mockCreatedUser.email,
          role: mockCreatedUser.role,
        },
      });
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      const mockUserData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      (getUserByEmail as jest.Mock).mockResolvedValue({ email: mockUserData.email });
      
      // Act & Assert
      await expect(registerUser(mockUserData)).rejects.toThrow('User already exists');
      expect(getUserByEmail).toHaveBeenCalledWith(mockUserData.email);
      expect(createUser).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const mockLoginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: mockLoginData.email,
        role: 'user',
        matchPassword: jest.fn().mockResolvedValue(true)
      };
      
      const mockToken = 'mock-jwt-token';
      
      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue(mockToken);
      
      // Act
      const result = await loginUser(mockLoginData);
      
      // Assert
      expect(getUserByEmail).toHaveBeenCalledWith(mockLoginData.email);
      expect(mockUser.matchPassword).toHaveBeenCalledWith(mockLoginData.password);
      expect(generateToken).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        success: true,
        token: mockToken,
        user: {
          id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        }
      });
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const mockLoginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      (getUserByEmail as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(loginUser(mockLoginData)).rejects.toThrow('Invalid credentials');
      expect(getUserByEmail).toHaveBeenCalledWith(mockLoginData.email);
    });

    it('should throw error if password is incorrect', async () => {
      // Arrange
      const mockLoginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: mockLoginData.email,
        role: 'user',
        matchPassword: jest.fn().mockResolvedValue(false)
      };
      
      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      
      // Act & Assert
      await expect(loginUser(mockLoginData)).rejects.toThrow('Invalid credentials');
      expect(getUserByEmail).toHaveBeenCalledWith(mockLoginData.email);
      expect(mockUser.matchPassword).toHaveBeenCalledWith(mockLoginData.password);
      expect(generateToken).not.toHaveBeenCalled();
    });
  });
});