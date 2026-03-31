import { PrismaClient } from '../../src/generated/prisma/client';
import type { Permission } from '../../src/generated/prisma/client';

export type MasterPermissions = {
  users: {
    read: Permission;
    create: Permission;
    update: Permission;
    delete: Permission;
  };
  roles: {
    read: Permission;
    create: Permission;
    update: Permission;
    delete: Permission;
    assign: Permission;
  };
};

export const seedPermissions = async (prisma: PrismaClient): Promise<MasterPermissions> => {
  // Users
  const usersRead = await prisma.permission.upsert({
    where: { name: 'users:read' },
    update: {},
    create: { name: 'users:read', description: 'Can read user profiles' },
  });
  const usersCreate = await prisma.permission.upsert({
    where: { name: 'users:create' },
    update: {},
    create: { name: 'users:create', description: 'Can create new users' },
  });
  const usersUpdate = await prisma.permission.upsert({
    where: { name: 'users:update' },
    update: {},
    create: { name: 'users:update', description: 'Can edit existing users' },
  });
  const usersDelete = await prisma.permission.upsert({
    where: { name: 'users:delete' },
    update: {},
    create: { name: 'users:delete', description: 'Can delete users' },
  });

  // Roles
  const rolesRead = await prisma.permission.upsert({
    where: { name: 'roles:read' },
    update: {},
    create: { name: 'roles:read', description: 'Can read roles and permissions' },
  });
  const rolesCreate = await prisma.permission.upsert({
    where: { name: 'roles:create' },
    update: {},
    create: { name: 'roles:create', description: 'Can create custom roles' },
  });
  const rolesUpdate = await prisma.permission.upsert({
    where: { name: 'roles:update' },
    update: {},
    create: { name: 'roles:update', description: 'Can edit existing custom roles' },
  });
  const rolesDelete = await prisma.permission.upsert({
    where: { name: 'roles:delete' },
    update: {},
    create: { name: 'roles:delete', description: 'Can delete custom roles' },
  });
  const rolesAssign = await prisma.permission.upsert({
    where: { name: 'roles:assign' },
    update: {},
    create: { name: 'roles:assign', description: 'Can attach or detach roles to users' },
  });

  return {
    users: { read: usersRead, create: usersCreate, update: usersUpdate, delete: usersDelete },
    roles: { read: rolesRead, create: rolesCreate, update: rolesUpdate, delete: rolesDelete, assign: rolesAssign },
  };
};
