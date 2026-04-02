import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import app from '../../../src/app';
import prisma from '../../../src/config/prisma';
import { resetDb } from '../helpers/reset-db';

// Mock email service
vi.mock('../../../src/services/email.service', () => ({
  default: {
    sendVerificationEmail: vi.fn().mockResolvedValue(true),
    sendResetPasswordEmail: vi.fn().mockResolvedValue(true),
  },
}));

describe('Auth Routes Integration', () => {
  beforeEach(async () => {
    await resetDb(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Helper: register and login, returns { accessToken, refreshToken }
  const registerAndLogin = async (
    username = 'testuser',
    email = 'test@example.com',
    password = 'Password123!',
  ) => {
    await request(app).post('/auth/register').send({
      username,
      displayName: `${username} Display`,
      email,
      password,
    });

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email, password });

    return {
      accessToken: loginRes.body.data.accessToken,
      refreshToken: loginRes.body.data.refreshToken,
      loginRes,
    };
  };

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        username: 'newuser',
        displayName: 'New User',
        email: 'new@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('email');
    expect(res.body.data.email).toBe('new@example.com');
  }, 10000);

  it('should login a user and return accessToken + refreshToken', async () => {
    const { loginRes } = await registerAndLogin('loginuser', 'login@example.com');

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toHaveProperty('accessToken');
    expect(loginRes.body.data).toHaveProperty('refreshToken');
    expect(loginRes.body.data.user.email).toBe('login@example.com');
  }, 10000);

  it('should fail login with wrong password', async () => {
    await request(app).post('/auth/register').send({
      username: 'wronguser',
      displayName: 'Wrong User',
      email: 'wrong@example.com',
      password: 'Password123!',
    });

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
  }, 10000);

  it('should refresh tokens with valid refresh token', async () => {
    const { refreshToken } = await registerAndLogin('refreshuser', 'refresh@example.com');

    const res = await request(app)
      .post('/auth/refresh-token')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    // New refresh token should be different (token rotation)
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  }, 10000);

  it('should reject old refresh token after rotation (token reuse detection)', async () => {
    const { refreshToken } = await registerAndLogin('rotateuser', 'rotate@example.com');

    // First refresh — should succeed
    await request(app)
      .post('/auth/refresh-token')
      .send({ refreshToken });

    // Second refresh with same old token — should fail
    const res = await request(app)
      .post('/auth/refresh-token')
      .send({ refreshToken });

    expect(res.status).toBe(401);
  }, 10000);

  it('should reject refresh with invalid token', async () => {
    const res = await request(app)
      .post('/auth/refresh-token')
      .send({ refreshToken: 'completely_invalid_token' });

    expect(res.status).toBe(401);
  }, 10000);

  it('should logout and revoke refresh token', async () => {
    const { accessToken, refreshToken } = await registerAndLogin('logoutuser', 'logout@example.com');

    // Logout with refresh token
    const logoutRes = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);

    // Try to use the revoked refresh token — should fail
    const refreshRes = await request(app)
      .post('/auth/refresh-token')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  }, 10000);

  it('should clear old refresh tokens on new login', async () => {
    // First login
    const { refreshToken: firstToken } = await registerAndLogin('multilogin', 'multi@example.com');

    // Second login (should clear older tokens)
    const loginRes2 = await request(app)
      .post('/auth/login')
      .send({ email: 'multi@example.com', password: 'Password123!' });

    const secondToken = loginRes2.body.data.refreshToken;

    // Old token should be invalid
    const oldRefreshRes = await request(app)
      .post('/auth/refresh-token')
      .send({ refreshToken: firstToken });

    expect(oldRefreshRes.status).toBe(401);

    // New token should work
    const newRefreshRes = await request(app)
      .post('/auth/refresh-token')
      .send({ refreshToken: secondToken });

    expect(newRefreshRes.status).toBe(200);
    expect(newRefreshRes.body.data).toHaveProperty('accessToken');
  }, 15000);

  it('should initiate forgot password', async () => {
    await request(app).post('/auth/register').send({
      username: 'forgotuser',
      displayName: 'Forgot User',
      email: 'forgot@example.com',
      password: 'Password123!',
    });

    const res = await request(app)
      .post('/auth/forgot-password')
      .send({
        email: 'forgot@example.com'
      });

    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { email: 'forgot@example.com' } });
    expect(user?.resetPasswordToken).not.toBeNull();
  }, 10000);
});
