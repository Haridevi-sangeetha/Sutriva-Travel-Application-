import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.model';

/**
 * Enforces Role-Based Access Control (RBAC) on protected endpoints
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required.'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to access this resource.'
      });
      return;
    }

    next();
  };
}

/**
 * Prevents Insecure Direct Object Reference (IDOR / BOLA)
 * Ensures a user can only access their own user data unless they are an ADMIN.
 */
export function enforceOwnerOrAdmin(paramUserIdName: string = 'userId') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required.'
      });
      return;
    }

    const resourceUserId = req.params[paramUserIdName] || req.body[paramUserIdName];

    if (req.user.role !== 'ADMIN' && req.user.userId !== resourceUserId) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Access denied. You can only view or modify your own records.'
      });
      return;
    }

    next();
  };
}
