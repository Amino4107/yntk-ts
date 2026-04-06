import type { Request, Response } from 'express';

import userService from '../services/user.service';
import { handleControllerError } from './controller-utils';

const parseUserIdParam = (req: Request, res: Response): string | null => {
  const id = req.params.id;

  if (typeof id !== 'string' || id.trim().length === 0) {
    res.status(400).json({
      status: 'error',
      message: 'User id must be a string',
    });
    return null;
  }

  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(id)) {
    res.status(404).json({
      status: 'error',
      message: 'User not found!',
    });
    return null;
  }

  return id;
};

const createUser = async (req: Request, res: Response) => {
  try {
    const { username, displayName, email } = req.body;

    const user = await userService.createUser({
      username,
      displayName,
      email,
    });

    return res.json({
      status: 'success',
      message: 'User created successfully!',
      data: user,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();

    return res.json({
      status: 'success',
      message: 'Users data retrieved successfully!',
      data: users,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const getUser = async (req: Request, res: Response) => {
  const id = parseUserIdParam(req, res);
  if (id === null) {
    return;
  }

  try {
    const user = await userService.getUserById(id);

    return res.json({
      status: 'success',
      message: 'User data retrieved successfully!',
      data: user,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const updateUser = async (req: Request, res: Response) => {
  const id = parseUserIdParam(req, res);
  if (id === null) {
    return;
  }

  try {
    const { username, displayName, email } = req.body;

    const user = await userService.updateUser(id, {
      username,
      displayName,
      email,
    });

    return res.json({
      status: 'success',
      message: `User ${id} updated successfully`,
      data: user,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const id = parseUserIdParam(req, res);
  if (id === null) {
    return;
  }

  try {
    await userService.deleteUser(id);

    return res.json({
      status: 'success',
      message: `User successfully deleted`,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const updatePassword = async (req: Request, res: Response) => {
  try {
    // Get user ID from authenticated user (set by auth middleware)
    const userId = req.userData?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated',
      });
    }

    const { currentPassword, newPassword } = req.body;

    await userService.updatePassword(userId, currentPassword, newPassword);

    return res.json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const assignRoles = async (req: Request, res: Response) => {
  const id = parseUserIdParam(req, res);
  if (id === null) return;

  try {
    const { roles } = req.body;
    const user = await userService.assignRoles(id, roles);
    res.status(200).json({ status: 'success', message: 'Roles assigned successfully', data: user });
  } catch (error) {
    handleControllerError(error, res);
  }
};

const userController = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updatePassword,
  assignRoles,
};

export default userController;
