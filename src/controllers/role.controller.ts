import type { Request, Response } from 'express';
import roleService from '../services/role.service';
import { handleControllerError } from './controller-utils';
import { getPaginationMeta, getPaginationLinks } from '../utils/pagination.util';
import type { PaginationQuery } from '../validations/pagination.validation';
import type { CreateRoleInput, UpdateRoleInput } from '../validations/role.validation';

const getRoles = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'asc', search } = req.query as unknown as PaginationQuery;
    
    const { data: roles, total } = await roleService.getAllRoles(
      Number(page),
      Number(limit),
      sortBy,
      sortOrder,
      search
    );

    res.status(200).json({ 
      status: 'success', 
      message: 'Roles retrieved successfully', 
      data: roles,
      meta: getPaginationMeta(total, Number(page), Number(limit)),
      links: getPaginationLinks(req, Number(page), Number(limit), total),
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

const getRole = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const role = await roleService.getRoleById(id);
    res.status(200).json({ status: 'success', message: 'Role retrieved successfully', data: role });
  } catch (error) {
    handleControllerError(error, res);
  }
};

const createRole = async (req: Request<{}, {}, CreateRoleInput>, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await roleService.createRole(name as string, description, permissions);
    res.status(201).json({ status: 'success', message: 'Role created successfully', data: role });
  } catch (error) {
    handleControllerError(error, res);
  }
};

const updateRole = async (req: Request<{ id: string }, {}, UpdateRoleInput>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, permissions } = req.body;
    const payload: any = {};
    if (name !== undefined) payload.name = name;
    if (description !== undefined) payload.description = description;
    if (permissions !== undefined) payload.permissionIds = permissions;

    const role = await roleService.updateRole(id, payload);
    res.status(200).json({ status: 'success', message: 'Role updated successfully', data: role });
  } catch (error) {
    handleControllerError(error, res);
  }
};

const deleteRole = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await roleService.deleteRole(id);
    res.status(200).json({ status: 'success', message: 'Role deleted successfully' });
  } catch (error) {
    handleControllerError(error, res);
  }
};

const roleController = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};

export default roleController;
