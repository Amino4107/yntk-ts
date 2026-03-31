import permissionRepository from '../repositories/permission.repository';
import type { Permission } from '../generated/prisma/client';

const getAllPermissions = async (): Promise<Permission[]> => {
  return await permissionRepository.findAll();
};

const permissionService = {
  getAllPermissions,
};

export default permissionService;
