import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import logger from '../utils/logger';

export interface JwtPayload {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

/**
 * Generate JWT token for user authentication
 * @description Creates a signed JWT token with user payload for authentication
 * @param {IUser} user - User object containing user information
 * @returns {string} Signed JWT token
 * @throws {Error} If JWT secret is not configured or token generation fails
 */
export const generateToken = (user: IUser) => {
  logger.info(`JWT token generation initiated for user: ${user.email}`);

  if (!process.env.JWT_SECRET) {
    logger.error('JWT token generation failed - JWT_SECRET not configured');
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  logger.debug(`Creating JWT payload for user: ${user.email}`);

  try {
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role } as JwtPayload,
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    logger.info(`JWT token generated successfully for user: ${user.email}`);
    logger.debug(`Token expires in: 1d`);

    return token;
  } catch (error) {
    logger.error(`JWT token generation failed for user ${user.email}:`, error);
    throw error;
  }
};
