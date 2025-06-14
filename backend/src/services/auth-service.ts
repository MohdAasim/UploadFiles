import { createError } from '../middlewares/errorHandler';
import { createUser, getUserByEmail } from '../repository/auth-repo';
import { generateToken } from './jwt-service';

export async function registerUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const userExist = await getUserByEmail(email);
  if (userExist) {
    throw createError('User already exists', 400);
  }

  const user = await createUser({ name, email, password });
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

export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw createError('Invalid credentials', 400);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw createError('Invalid credentials', 400);
  }

  const token = generateToken(user);
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
