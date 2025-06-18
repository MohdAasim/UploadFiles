import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create mock implementations for winston functions
const mockCreateLogger = jest.fn().mockReturnValue({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  debug: jest.fn(),
});

const mockAddColors = jest.fn();
const mockFormatCombine = jest.fn().mockReturnThis();
const mockFormatTimestamp = jest.fn().mockReturnThis();
const mockFormatColorize = jest.fn().mockReturnThis();
const mockFormatPrintf = jest.fn().mockReturnThis();
const mockFormatJson = jest.fn().mockReturnThis();
const mockFormatSimple = jest.fn().mockReturnThis();
const mockConsoleTransport = jest.fn();
const mockFileTransport = jest.fn();

// Mock winston
jest.mock('winston', () => ({
  format: {
    combine: mockFormatCombine,
    timestamp: mockFormatTimestamp,
    colorize: mockFormatColorize,
    printf: mockFormatPrintf,
    json: mockFormatJson,
    simple: mockFormatSimple,
  },
  transports: {
    Console: mockConsoleTransport,
    File: mockFileTransport,
  },
  createLogger: mockCreateLogger,
  addColors: mockAddColors,
}));

// Mock path and fs
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  mkdirSync: jest.fn(),
}));

describe('Logger Utility', () => {
  // Store the original process.env.NODE_ENV
  const originalNodeEnv = process.env.NODE_ENV;
  let logger: any;
  
  // Before each test, reset mocks and clear the module cache
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Clear the require cache for logger module
    delete require.cache[require.resolve('../../utils/logger')];
  });
  
  // After all tests, restore process.env.NODE_ENV
  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('Logger Configuration', () => {
    it('should configure colors correctly', () => {
      // Import the logger to trigger its initialization
      logger = require('../../utils/logger').default;
      
      // Verify winston.addColors was called with the right colors
      expect(mockAddColors).toHaveBeenCalledWith({
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'white',
      });
    });
    
    it('should use debug level in development environment', () => {
      // Set environment to development
      process.env.NODE_ENV = 'development';
      
      // Import the logger to trigger its initialization
      logger = require('../../utils/logger').default;
      
      // Verify createLogger was called with the right level
      expect(mockCreateLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug'
        })
      );
    });
    
    it('should use warn level in production environment', () => {
      // Set environment to production
      process.env.NODE_ENV = 'production';
      
      // Import the logger to trigger its initialization
      logger = require('../../utils/logger').default;
      
      // Verify createLogger was called with the right level
      expect(mockCreateLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warn'
        })
      );
    });
    
    it('should configure Console transport', () => {
      // Import the logger to trigger its initialization
      logger = require('../../utils/logger').default;
      
      // Verify Console transport was created
      expect(mockConsoleTransport).toHaveBeenCalled();
      
      // Verify format functions were called
      expect(mockFormatColorize).toHaveBeenCalled();
      expect(mockFormatSimple).toHaveBeenCalled();
    });
    
    it('should configure File transports for error and combined logs', () => {
      // Import the logger to trigger its initialization
      logger = require('../../utils/logger').default;
      
      // Verify File transport was created twice (for error and combined logs)
      expect(mockFileTransport).toHaveBeenCalledTimes(2);
      
      // Verify error log File transport configuration
      const errorFileTransportCall = mockFileTransport.mock.calls.find(
        call => call[0].level === 'error'
      );
      expect(errorFileTransportCall).toBeDefined();
      expect(errorFileTransportCall[0].filename).toContain('error.log');
      
      // Verify combined log File transport configuration
      const combinedFileTransportCall = mockFileTransport.mock.calls.find(
        call => !call[0].level
      );
      expect(combinedFileTransportCall).toBeDefined();
      expect(combinedFileTransportCall[0].filename).toContain('combined.log');
      
      // Verify json format was used
      expect(mockFormatJson).toHaveBeenCalled();
    });

    it('should set exitOnError to false', () => {
      // Import the logger to trigger its initialization
      logger = require('../../utils/logger').default;
      
      // Verify createLogger was called with exitOnError: false
      expect(mockCreateLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          exitOnError: false
        })
      );
    });
  });
  
  describe('Logger Methods', () => {
    let winstonLogger: any;
    
    beforeEach(() => {
      // Create a mock logger instance with spies
      winstonLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        http: jest.fn(),
        debug: jest.fn(),
      };
      
      // Make createLogger return our mock logger
      mockCreateLogger.mockReturnValue(winstonLogger);
      
      // Import the logger to trigger its initialization
      logger = require('../../utils/logger').default;
    });
    
    it('should expose error, warn, info, http, and debug methods', () => {
      // Verify the logger exposes the expected methods
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.http).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
    
    it('should pass messages to the winston logger', () => {
      // Mock message
      const testMessage = 'Test log message';
      
      // Call logger methods
      logger.error(testMessage);
      logger.warn(testMessage);
      logger.info(testMessage);
      logger.debug(testMessage);
      logger.http(testMessage);
      
      // Verify messages were passed to winston logger
      expect(winstonLogger.error).toHaveBeenCalledWith(testMessage);
      expect(winstonLogger.warn).toHaveBeenCalledWith(testMessage);
      expect(winstonLogger.info).toHaveBeenCalledWith(testMessage);
      expect(winstonLogger.debug).toHaveBeenCalledWith(testMessage);
      expect(winstonLogger.http).toHaveBeenCalledWith(testMessage);
    });

    it('should handle multiple arguments', () => {
      // Mock messages and objects
      const testMessage = 'Test log message';
      const testObj = { foo: 'bar' };
      
      // Call logger method with multiple arguments
      logger.info(testMessage, testObj);
      
      // Verify all arguments were passed to winston logger
      expect(winstonLogger.info).toHaveBeenCalledWith(testMessage, testObj);
    });

    it('should handle error objects', () => {
      // Create test error
      const testError = new Error('Test error');
      
      // Call logger error method with error object
      logger.error('An error occurred', testError);
      
      // Verify error was passed to winston logger
      expect(winstonLogger.error).toHaveBeenCalledWith('An error occurred', testError);
    });
  });
  
  describe('Log File Paths', () => {
    // Create a mock for the join function
    const mockJoin = jest.fn().mockImplementation((...args) => args.join('/'));
    
    beforeEach(() => {
      // Override the path.join mock specifically for this test
      (path.join as jest.Mock).mockImplementation(mockJoin);
    });
    
    it('should use the correct paths for log files', () => {
      // Import the logger to trigger its initialization
      logger = require('../../utils/logger').default;
      
      // Look at all calls to mockFileTransport instead of path.join
      const calls = mockFileTransport.mock.calls;
      
      // Check if any call has error.log in the filename
      const hasErrorLog = calls.some(call => 
        call[0] && call[0].filename && call[0].filename.includes('error.log')
      );
      expect(hasErrorLog).toBe(true);
      
      // Check if any call has combined.log in the filename
      const hasCombinedLog = calls.some(call => 
        call[0] && call[0].filename && call[0].filename.includes('combined.log')
      );
      expect(hasCombinedLog).toBe(true);
      
      // Check if logs directory is used in the paths
      const usesLogsDir = calls.some(call => 
        call[0] && call[0].filename && call[0].filename.includes('logs/')
      );
      expect(usesLogsDir).toBe(true);
    });
  });
});