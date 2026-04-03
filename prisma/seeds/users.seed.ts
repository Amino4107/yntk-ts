import { PrismaClient } from '../../src/generated/prisma/client';
import { hashPassword } from '../../src/utils/password-utils';

export const seedUsers = async (prisma: PrismaClient) => {
  const commonPassword = await hashPassword('rayaTAMPAN#1');

  // SUPERADMIN User
  await prisma.user.upsert({
    where: { email: 'superadmin@rayasabari.com' },
    update: {},
    create: {
      email: 'superadmin@rayasabari.com',
      username: 'superadmin',
      displayName: 'Super Admin',
      password: commonPassword,
      emailVerified: true,
      roles: {
        connect: [{ name: 'SUPERADMIN' }]
      }
    }
  });

  // ADMIN User
  await prisma.user.upsert({
    where: { email: 'admin@rayasabari.com' },
    update: {},
    create: {
      email: 'admin@rayasabari.com',
      username: 'admin',
      displayName: 'Administrator',
      password: commonPassword,
      emailVerified: true,
      roles: {
        connect: [{ name: 'ADMIN' }]
      }
    }
  });

  // USER User
  await prisma.user.upsert({
    where: { email: 'user@rayasabari.com' },
    update: {},
    create: {
      email: 'user@rayasabari.com',
      username: 'user',
      displayName: 'Regular User',
      password: commonPassword,
      emailVerified: true,
      roles: {
        connect: [{ name: 'USER' }]
      }
    }
  });
};
