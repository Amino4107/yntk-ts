import { AppError } from '../errors/app-error';
import { handleDuplicateEntryError, handleRecordNotFoundError } from '../errors/error-utils';
import roleRepository from '../repositories/role.repository';
import logger from '../config/logger';

// Hardcoded system roles that cannot be deleted or renamed freely
const PROTECTED_ROLES = ['SUPERADMIN', 'ADMIN', 'USER'];

const getAllRoles = async (
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'asc',
  search?: string
) => {
  const skip = (page - 1) * limit;
  const take = limit;

  // Secure sort mapping
  const validSortFields = ['name', 'createdAt'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  
  const orderBy = { [sortField]: sortOrder } as any;

  const { data, total } = await roleRepository.findAll(skip, take, orderBy, search);
  
  return { data, total };
};

const getRoleById = async (id: number) => {
  const role = await roleRepository.findById(id);
  if (!role) {
    throw new AppError('Role not found', 404);
  }
  return role;
};

const createRole = async (name: string, description?: string | undefined, permissionIds: number[] = []) => {
  const formattedName = name.toUpperCase();
  
  const existingRole = await roleRepository.findByName(formattedName);
  if (existingRole) {
    throw new AppError('Role with this name already exists', 409);
  }

  try {
    const newRole = await roleRepository.create({
      name: formattedName,
      description,
      permissionIds
    });

    logger.info({
      action: 'role_created',
      roleId: newRole.id,
      name: newRole.name,
    }, 'Role created successfully');

    return newRole;
  } catch (error) {
    handleRecordNotFoundError(error, 'Permission');
    handleDuplicateEntryError(error);
    throw error; // Fallback for TS compiler
  }
};

const updateRole = async (id: number, data: { name?: string | undefined; description?: string | undefined; permissionIds?: number[] | undefined }) => {
  const role = await getRoleById(id);

  // If attempting to change name, check protections and duplicate names
  if (data.name && data.name.toUpperCase() !== role.name) {
    if (PROTECTED_ROLES.includes(role.name)) {
      throw new AppError(`Cannot rename a protected system role: ${role.name}`, 403);
    }
    const formattedName = data.name.toUpperCase();
    const existingRole = await roleRepository.findByName(formattedName);
    if (existingRole) {
      throw new AppError('Role with this name already exists', 409);
    }
    data.name = formattedName;
  }

  try {
    const updatedRole = await roleRepository.update(id, data);

    logger.info({
      action: 'role_updated',
      roleId: id,
      updatedFields: Object.keys(data),
    }, 'Role updated successfully');

    return updatedRole;
  } catch (error) {
    handleRecordNotFoundError(error, 'Permission');
    handleDuplicateEntryError(error);
    throw error; // Fallback for TS compiler
  }
};

const deleteRole = async (id: number) => {
  const role = await getRoleById(id);

  if (PROTECTED_ROLES.includes(role.name)) {
    throw new AppError(`Cannot delete a protected system role: ${role.name}`, 403);
  }

  // NOTE: You might also want to prevent deleting a role if it is still assigned to users.
  // We can check if `role._count?.users > 0` or rely on Prisma foreign key protections if configured.
  // For now, allow deletion if not protected.
  
  const deletedRole = await roleRepository.deleteById(id);

  logger.warn({
    action: 'role_deleted',
    roleId: id,
    name: role.name,
  }, 'Role deleted');
  
  return deletedRole;
};

const roleService = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};

export default roleService;
