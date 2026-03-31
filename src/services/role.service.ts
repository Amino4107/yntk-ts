import { AppError } from '../errors/app-error';
import roleRepository from '../repositories/role.repository';

// Hardcoded system roles that cannot be deleted or renamed freely
const PROTECTED_ROLES = ['SUPERADMIN', 'ADMIN', 'USER'];

const getAllRoles = async () => {
  return await roleRepository.findAll();
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

  return await roleRepository.create({
    name: formattedName,
    description,
    permissionIds
  });
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

  return await roleRepository.update(id, data);
};

const deleteRole = async (id: number) => {
  const role = await getRoleById(id);

  if (PROTECTED_ROLES.includes(role.name)) {
    throw new AppError(`Cannot delete a protected system role: ${role.name}`, 403);
  }

  // NOTE: You might also want to prevent deleting a role if it is still assigned to users.
  // We can check if `role._count?.users > 0` or rely on Prisma foreign key protections if configured.
  // For now, allow deletion if not protected.
  
  return await roleRepository.deleteById(id);
};

const roleService = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};

export default roleService;
