import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import { asyncHandler, createError } from '../middlewares/errorHandler';

const generateToken = (user: IUser) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1d' },
  );
};

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;
  
  let user = await User.findOne({ email });
  if (user) {
    throw createError('User already exists', 400);
  }

  user = new User({ name, email, password });
  await user.save();


  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    throw createError('Invalid credentials', 400);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw createError('Invalid credentials', 400);
  }

  const token = generateToken(user);
  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});
