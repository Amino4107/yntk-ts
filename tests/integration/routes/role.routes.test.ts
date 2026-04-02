import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import app from '../../../src/app';
import prisma from '../../../src/config/prisma';
import { resetDb } from '../helpers/reset-db';
import { seedPermissions } from '../../../prisma/seeds/permissions.seed';
import { seedRoles } from '../../../prisma/seeds/roles.seed';

vi.mock('../../../src/services/email.service', () => ({
  default: {
    sendVerificationEmail: vi.fn(),
  },
}));

describe('Role Routes Integration', () => {
  let token: string;
  let userId: number;

  beforeEach(async () => {
    await resetDb(prisma);

    const permissions = await seedPermissions(prisma as any);
    await seedRoles(prisma as any, permissions);

    // Register User
    await request(app).post('/auth/register').send({
      username: 'adminuser',
      displayName: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
    });

    // Make them SUPERADMIN
    const user = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
    const saRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });
    if (user && saRole) {
      userId = user.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { roles: { set: [{ id: saRole.id }] } }
      });
    }

    // Login for Token
    const loginRes = await request(app).post('/auth/login').send({
      email: 'admin@example.com',
      password: 'Password123!'
    });
    token = loginRes.body.data.accessToken;
  }, 20000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should list all roles', async () => {
    const res = await request(app).get('/roles').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((r: any) => r.name === 'SUPERADMIN')).toBe(true);
  });

  it('should block non-admins from getting roles', async () => {
    const regRes = await request(app).post('/auth/register').send({
      username: 'basicuser', email: 'basic@example.com', password: 'Password123!', displayName: 'Basic'
    });
    expect(regRes.status).toBe(200);

    const login = await request(app).post('/auth/login').send({ email: 'basic@example.com', password: 'Password123!' });
    expect(login.status).toBe(200);
    
    const basicToken = login.body.data.accessToken;
    const res = await request(app).get('/roles').set('Authorization', `Bearer ${basicToken}`);
    
    expect(res.status).toBe(403);
  });

  it('should complete full CRUD for custom role', async () => {
    // Permission 1
    const permission = await prisma.permission.findFirst();

    // 1. Create Role
    const createRes = await request(app)
      .post('/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'MODERATOR',
        description: 'Global Mod',
        permissions: [permission?.id]
      });
    
    expect(createRes.status).toBe(201);
    const roleId = createRes.body.data.id;

    // 2. Validate update Role (changing description)
    const updateRes = await request(app)
      .put(`/roles/${roleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Regional Mod',
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.description).toBe('Regional Mod');

    // 3. Prevent deleting SUPERADMIN
    const saRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });
    const deleteSA = await request(app).delete(`/roles/${saRole?.id}`).set('Authorization', `Bearer ${token}`);
    expect(deleteSA.status).toBe(403);

    // 4. Delete the custom role
    const deleteCustom = await request(app).delete(`/roles/${roleId}`).set('Authorization', `Bearer ${token}`);
    expect(deleteCustom.status).toBe(200);
  });
});
