import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { loginUser, registerUser } from '../services/auth-service';

export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;
    const resp = await registerUser({ name, email, password });
    res.status(201).json(resp);
  },
);

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const resp = await loginUser({ email, password });
    res.json(resp);
  },
);
