import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware to check if the authenticated user has a specific permission.
 * MUST be used after authMiddleware.
 */
export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure user data exists (authMiddleware should have set it)
    if (!req.userData || !Array.isArray(req.userData.permissions)) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: User data not found',
      });
    }

    const { permissions } = req.userData;

    // Check if user has the specific permission or a wildcard mapping
    if (permissions.includes(requiredPermission) || permissions.includes('*')) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: You do not have the required permissions',
    });
  };
};

/**
 * Middleware to check if the authenticated user has a specific role.
 * MUST be used after authMiddleware.
 */
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userData || !Array.isArray(req.userData.roles)) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: User data not found',
      });
    }

    if (req.userData.roles.includes(requiredRole)) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: You do not have the required role',
    });
  };
};
