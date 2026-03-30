import prisma from '../src/config/prisma';

async function main() {
  console.log('Seeding database with roles and permissions...');

  // Create permissions
  const usersRead = await prisma.permission.upsert({
    where: { name: 'users:read' },
    update: {},
    create: { name: 'users:read', description: 'Can read all users' },
  });

  const usersWrite = await prisma.permission.upsert({
    where: { name: 'users:write' },
    update: {},
    create: { name: 'users:write', description: 'Can modify or delete users' },
  });

  // Default USER role (minimal permissions)
  await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { 
      name: 'USER', 
      description: 'Standard Application User',
      permissions: {
        connect: [] // add basic permissions if needed
      }
    },
  });

  // SUPERADMIN role (all permissions)
  await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: {
      permissions: {
        connect: [
          { id: usersRead.id },
          { id: usersWrite.id },
        ]
      }
    },
    create: { 
      name: 'SUPERADMIN', 
      description: 'Super Administrator',
      permissions: {
        connect: [
          { id: usersRead.id },
          { id: usersWrite.id },
        ]
      }
    },
  });

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
