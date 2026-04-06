import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import app from '../../../src/app';
import prisma from '../../../src/config/prisma';
import { resetDb } from '../helpers/reset-db';
import { seedPermissions } from '../../../prisma/seeds/permissions.seed';
import { seedRoles } from '../../../prisma/seeds/roles.seed';

// Mock email service
vi.mock('../../../src/services/email.service', () => ({
  default: {
    sendVerificationEmail: vi.fn().mockResolvedValue(true),
    sendResetPasswordEmail: vi.fn().mockResolvedValue(true),
  },
}));

describe('User Routes Integration', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    await resetDb(prisma);
    
    const permissions = await seedPermissions(prisma as any);
    await seedRoles(prisma as any, permissions);

    // Create user and get token
    const regRes = await request(app).post('/auth/register').send({
      username: 'authuser',
      displayName: 'Auth User',
      email: 'auth@example.com',
      password: 'Password123!',
    });

    const loginRes = await request(app).post('/auth/login').send({
      email: 'auth@example.com',
      password: 'Password123!'
    });

    if (loginRes.status !== 200) {
      console.error('Login failed in beforeEach:', JSON.stringify(loginRes.body));
    }

    // Access data property
    token = loginRes.body.data?.accessToken;
    userId = loginRes.body.data?.user?.id;

    // VERY IMPORTANT: Upgrade user to SUPERADMIN so they bypass requirePermission() on the routes
    const saRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });
    if (saRole) {
      await prisma.user.update({
        where: { id: userId },
        data: { roles: { set: [{ id: saRole.id }] } }
      });
      
      // We must re-login to get the updated JWT that contains the new permissions!
      const reLogin = await request(app).post('/auth/login').send({
        email: 'auth@example.com',
        password: 'Password123!'
      });
      token = reLogin.body.data?.accessToken;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should get all users', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  }, 10000);

  it('should get user by id', async () => {
    const res = await request(app)
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(userId);
  }, 10000);

  it('should fail without auth token', async () => {
    const res = await request(app)
      .get('/users');

    expect(res.status).toBe(401);
  }, 10000);

  it('should update user', async () => {
    const res = await request(app)
      .put(`/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        displayName: 'Updated Name',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe('Updated Name');
  }, 10000);

  it('should return 409 Conflict when updating to an existing email', async () => {
    // create a second user first
    await request(app).post('/auth/register').send({
      username: 'seconduser',
      displayName: 'Second User',
      email: 'second@example.com',
      password: 'Password123!',
    });

    // attempt to update the first user with the second user's email
    const res = await request(app)
      .put(`/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'second@example.com',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  }, 10000);

  it('should fail delete user without verified email', async () => {
    const res = await request(app)
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');
  }, 10000);

  it('should delete user with verified email', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true }
    });

    const res = await request(app)
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const check = await prisma.user.findUnique({ where: { id: userId } });
    expect(check).toBeNull();
  }, 10000);
});
