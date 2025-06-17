import { createError } from '../middlewares/errorHandler';
import { createUser, getUserByEmail } from '../repository/auth.repo';
import { generateToken } from './jwt-service';
import logger from '../utils/logger';

/**
 * Register a new user
 * @description Creates a new user account with encrypted password and returns user data
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password (will be hashed)
 * @returns {Promise<Object>} User registration result with user data
 * @throws {Error} If user already exists or registration fails
 */
export async function registerUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  logger.info(`User registration service initiated for email: ${email}`);

  const userExist = await getUserByEmail(email);
  if (userExist) {
    logger.warn(`Registration failed - user already exists: ${email}`);
    throw createError('User already exists', 400);
  }

  logger.debug(`Creating new user account for: ${email}`);
  const user = await createUser({ name, email, password });

  logger.info(`User registration successful - ID: ${user._id}, Email: ${email}`);

  return {
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Authenticate user login
 * @description Validates user credentials and generates JWT token for authentication
 * @param {Object} loginData - User login credentials
 * @param {string} loginData.email - User's email address
 * @param {string} loginData.password - User's password
 * @returns {Promise<Object>} Login result with JWT token and user data
 * @throws {Error} If credentials are invalid or login fails
 */
export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  logger.info(`User login service initiated for email: ${email}`);

  const user = await getUserByEmail(email);
  if (!user) {
    logger.warn(`Login failed - user not found: ${email}`);
    throw createError('Invalid credentials', 400);
  }

  logger.debug(`Validating password for user: ${email}`);
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    logger.warn(`Login failed - invalid password for user: ${email}`);
    throw createError('Invalid credentials', 400);
  }

  logger.debug(`Generating JWT token for user: ${email}`);
  const token = generateToken(user);

  logger.info(`User login successful - ID: ${user._id}, Email: ${email}`);

  return {
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
