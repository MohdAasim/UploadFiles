import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { loginUser, registerUser } from '../services/auth.service';
import logger from '../utils/logger';

/**
 * Register a new user
 * @description Handles user registration by validating input data and creating a new user account
 * @route POST /api/auth/register
 * @access Public
 * @param {Request} req - Express request object containing user registration data
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with registration result
 */
export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;
    logger.info(`Registration attempt for user: ${email}`);
    const resp = await registerUser({ name, email, password });
    logger.info(`User registered successfully: ${email}`);
    res.status(201).json(resp);
  }
);

/**
 * Authenticate user login
 * @description Handles user authentication by validating credentials and generating JWT token
 * @route POST /api/auth/login
 * @access Public
 * @param {Request} req - Express request object containing login credentials
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with authentication result and token
 */
export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    logger.info(`Login attempt for user: ${email}`);
    const resp = await loginUser({ email, password });
    logger.info(`User logged in successfully: ${email}`);
    res.json(resp);
  }
);
