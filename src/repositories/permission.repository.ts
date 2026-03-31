import prisma from '../config/prisma';
import type { Permission } from '../generated/prisma/client';

const findAll = (): Promise<Permission[]> =>
  prisma.permission.findMany({
    orderBy: {
      name: 'asc'
    }
  });

const permissionRepository = {
  findAll,
};

export default permissionRepository;
