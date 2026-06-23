import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || '';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    canChangeScores: boolean;
    isSuperAdmin: boolean;
  };
}

interface JwtPayload {
  id: string;
  role: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ message: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      canChangeScores: user.canChangeScores,
      isSuperAdmin: user.email === SUPER_ADMIN_EMAIL || user.isSuperAdmin === true,
    };
    next();
  } catch (error) {
    console.error('authenticate error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
