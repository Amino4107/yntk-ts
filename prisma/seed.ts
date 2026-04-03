import prisma from '../src/config/prisma';
import { seedPermissions } from './seeds/permissions.seed';
import { seedRoles } from './seeds/roles.seed';
import { seedUsers } from './seeds/users.seed';

async function main() {
  console.log('Seeding database with modular roles and permissions...');

  console.log('1. Seeding Master Permissions...');
  const permissions = await seedPermissions(prisma as any);
  
  console.log('2. Seeding Master Roles and wiring their permissions...');
  await seedRoles(prisma as any, permissions);

  console.log('3. Seeding Initial Users...');
  await seedUsers(prisma as any);

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
