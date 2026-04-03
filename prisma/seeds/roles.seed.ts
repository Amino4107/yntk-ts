import { PrismaClient } from '../../src/generated/prisma/client';
import type { MasterPermissions } from './permissions.seed';

export const seedRoles = async (prisma: PrismaClient, permissions: MasterPermissions) => {
  // SUPERADMIN (All capabilities)
  const allPermissionIds = [
    { id: permissions.users.read.id },
    { id: permissions.users.create.id },
    { id: permissions.users.update.id },
    { id: permissions.users.delete.id },
    { id: permissions.roles.read.id },
    { id: permissions.roles.create.id },
    { id: permissions.roles.update.id },
    { id: permissions.roles.delete.id },
    { id: permissions.roles.assign.id },
  ];

  await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: {
      permissions: { set: allPermissionIds } // override/attach all
    },
    create: { 
      name: 'SUPERADMIN', 
      description: 'Super Administrator',
      permissions: {
        connect: allPermissionIds
      }
    },
  });

  // ADMIN (Non-destructive operations only)
  const adminPermissionIds = [
    { id: permissions.users.read.id },
    { id: permissions.users.create.id },
    { id: permissions.users.update.id },
    // NO users:delete
    { id: permissions.roles.read.id },
    { id: permissions.roles.create.id },
    { id: permissions.roles.update.id },
    { id: permissions.roles.assign.id },
    // NO roles:delete
  ];

  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {
      permissions: { set: adminPermissionIds }
    },
    create: { 
      name: 'ADMIN', 
      description: 'System Administrator',
      permissions: {
        connect: adminPermissionIds
      }
    },
  });

  // USER (No admin panel capabilities)
  const userPermissionIds = [
    { id: permissions.users.read.id },
    { id: permissions.users.update.id },
  ];
  
  await prisma.role.upsert({
    where: { name: 'USER' },
    update: {
       permissions: { set: userPermissionIds }
    },
    create: { 
      name: 'USER', 
      description: 'Standard Application User',
      permissions: {
        connect: userPermissionIds
      }
    },
  });
};
