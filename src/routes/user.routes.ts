import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import requireVerifiedEmail from '../middleware/require-verified.middleware';
import validate from '../middleware/validation.middleware';
import { createUserSchema, updateUserSchema, updatePasswordSchema } from '../validations/user.validation';
import userController from '../controllers/user.controller';
import { requireRole } from '../middleware/permission.middleware';


const userRouter: ExpressRouter = Router();

userRouter.post('/', authMiddleware, requireVerifiedEmail, requireRole('SUPERADMIN'), validate(createUserSchema), userController.createUser);
userRouter.get('/', authMiddleware, requireRole('SUPERADMIN'), userController.getUsers);
userRouter.patch('/password', authMiddleware, requireRole('SUPERADMIN'), validate(updatePasswordSchema), userController.updatePassword);
userRouter.get('/:id', authMiddleware, userController.getUser);
userRouter.put('/:id', authMiddleware, requireRole('SUPERADMIN'), validate(updateUserSchema), userController.updateUser);
userRouter.delete('/:id', authMiddleware, requireVerifiedEmail, requireRole('SUPERADMIN'), userController.deleteUser);

export default userRouter;
