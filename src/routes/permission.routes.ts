import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import permissionController from '../controllers/permission.controller';
import authMiddleware from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';

const permissionRouter: ExpressRouter = Router();

// Require specific capability instead of hardcoded role
permissionRouter.get('/', authMiddleware, requirePermission('roles:read'), permissionController.getAllPermissions);

export default permissionRouter;
