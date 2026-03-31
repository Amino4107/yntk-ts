import type { Request, Response } from 'express';
import permissionService from '../services/permission.service';
import { handleControllerError } from './controller-utils';

const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await permissionService.getAllPermissions();

    res.status(200).json({
      status: 'success',
      data: permissions,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

const permissionController = {
  getAllPermissions,
};

export default permissionController;