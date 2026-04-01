import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import app from '../../../src/app';
import prisma from '../../../src/config/prisma';
import { resetDb } from '../helpers/reset-db';
import { seedPermissions } from '../../../prisma/seeds/permissions.seed';
import { seedRoles } from '../../../prisma/seeds/roles.seed';

vi.mock('../../../src/services/email.service', () => ({
  default: { sendVerificationEmail: vi.fn() }
}));

describe('Permission Routes Integration', () => {
  let token: string;

  beforeEach(async () => {
    await resetDb(prisma);
    
    const permissions = await seedPermissions(prisma as any);
    await seedRoles(prisma as any, permissions);

    await request(app).post('/auth/register').send({
      username: 'admin2', displayName: 'Admin 2', email: 'admin2@example.com', password: 'Password123!',
    });

    const user = await prisma.user.findUnique({ where: { email: 'admin2@example.com' } });
    const saRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });
    if (user && saRole) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roles: { set: [{ id: saRole.id }] } }
      });
    }

    const loginRes = await request(app).post('/auth/login').send({
      email: 'admin2@example.com', password: 'Password123!'
    });
    token = loginRes.body.data.token;
  }, 20000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should retrieve all system permissions', async () => {
    const res = await request(app).get('/permissions').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('name');
  });
});
