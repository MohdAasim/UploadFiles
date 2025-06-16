import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
export interface JwtPayload {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export const generateToken = (user: IUser) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role } as JwtPayload,
    process.env.JWT_SECRET as string,
    { expiresIn: '1d' },
  );
};
