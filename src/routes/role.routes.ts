import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import roleController from '../controllers/role.controller';
import validate from '../middleware/validation.middleware';
import authMiddleware from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { createRoleSchema, updateRoleSchema } from '../validations/role.validation';
import { paginationQuerySchema } from '../validations/pagination.validation';

const roleRouter: ExpressRouter = Router();

roleRouter.get('/', authMiddleware, requirePermission('roles:read'), validate(paginationQuerySchema), roleController.getRoles);
roleRouter.get('/:id', authMiddleware, requirePermission('roles:read'), roleController.getRole);
roleRouter.post('/', authMiddleware, requirePermission('roles:create'), validate(createRoleSchema), roleController.createRole);
roleRouter.put('/:id', authMiddleware, requirePermission('roles:update'), validate(updateRoleSchema), roleController.updateRole);
roleRouter.delete('/:id', authMiddleware, requirePermission('roles:delete'), roleController.deleteRole);

export default roleRouter;
