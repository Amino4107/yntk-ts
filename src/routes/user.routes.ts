import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import requireVerifiedEmail from '../middleware/require-verified.middleware';
import validate from '../middleware/validation.middleware';
import { createUserSchema, updateUserSchema, updatePasswordSchema, assignRolesSchema } from '../validations/user.validation';
import userController from '../controllers/user.controller';
import { requirePermission } from '../middleware/permission.middleware';


const userRouter: ExpressRouter = Router();

userRouter.post('/', authMiddleware, requireVerifiedEmail, requirePermission('users:create'), validate(createUserSchema), userController.createUser);
userRouter.get('/', authMiddleware, requirePermission('users:read'), userController.getUsers);
userRouter.patch('/password', authMiddleware, requirePermission('users:update'), validate(updatePasswordSchema), userController.updatePassword);
userRouter.get('/:id', authMiddleware, requirePermission('users:read'), userController.getUser);
userRouter.put('/:id', authMiddleware, requirePermission('users:update'), validate(updateUserSchema), userController.updateUser);
userRouter.put('/:id/roles', authMiddleware, requirePermission('roles:assign'), validate(assignRolesSchema), userController.assignRoles);
userRouter.delete('/:id', authMiddleware, requireVerifiedEmail, requirePermission('users:delete'), userController.deleteUser);

export default userRouter;
