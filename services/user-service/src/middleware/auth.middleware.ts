/**
 * Auth Middleware
 * Validates JWT tokens and protects routes
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'haderos-jwt-secret-key-2025';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    phone: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        phone: string;
        role: string;
      };

      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};
