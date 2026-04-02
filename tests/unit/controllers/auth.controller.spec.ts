import { describe, it, expect, vi, beforeEach } from 'vitest';
import authController from '../../../src/controllers/auth.controller';
import authService from '../../../src/services/auth.service';

vi.mock('../../../src/services/auth.service');
vi.mock('../../../src/config/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('../../../src/config/env', () => ({
  default: {
    nodeEnv: 'development',
    enableRefreshToken: true,
    refreshTokenInJson: true,
    refreshTokenInCookie: true,
    refreshTokenExpiry: 604800000,
  },
}));

describe('Auth Controller', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      headers: {},
      userData: { id: 1 },
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    };
  });

  describe('register', () => {
    it('should register a user and return success response', async () => {
      req.body = {
        username: 'test',
        email: 'test@example.com',
        password: 'pass',
      };

      const mockUser = { id: 1, username: 'test', email: 'test@example.com' };
      vi.mocked(authService.register).mockResolvedValue(mockUser as any);

      await authController.register(req, res);

      expect(authService.register).toHaveBeenCalledWith({
        username: 'test',
        displayName: undefined,
        email: 'test@example.com',
        password: 'pass',
      });
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User created successfully!',
        data: mockUser,
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Registration failed');
      vi.mocked(authService.register).mockRejectedValue(error);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
    });
  });

  describe('login', () => {
    it('should login and return accessToken with refreshToken in JSON', async () => {
      req.body = { email: 'test@example.com', password: 'pass' };
      const mockResult = {
        user: { id: 1 },
        accessToken: 'jwt_abc',
        refreshToken: 'refresh_xyz',
      };

      vi.mocked(authService.login).mockResolvedValue(mockResult as any);

      await authController.login(req, res);

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass',
      });
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh_xyz', expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
      }));
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User logged in successfully!',
        data: mockResult,
      });
    });

    it('should not set cookie when refreshTokenInCookie is false', async () => {
      const env = await import('../../../src/config/env');
      (env.default as any).refreshTokenInCookie = false;

      req.body = { email: 'test@example.com', password: 'pass' };
      const mockResult = {
        user: { id: 1 },
        accessToken: 'jwt_abc',
        refreshToken: 'refresh_xyz',
      };
      vi.mocked(authService.login).mockResolvedValue(mockResult as any);

      await authController.login(req, res);

      expect(res.cookie).not.toHaveBeenCalled();

      // Restore
      (env.default as any).refreshTokenInCookie = true;
    });
  });

  describe('logout', () => {
    it('should logout and revoke refresh token from body', async () => {
      req.body = { refreshToken: 'token_to_revoke' };
      vi.mocked(authService.logout).mockResolvedValue({ message: 'Logged out successfully' });

      await authController.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith(1, 'token_to_revoke');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Logged out successfully',
      });
    });

    it('should logout and read refresh token from cookie', async () => {
      req.headers = { cookie: 'refreshToken=cookie_token; other=val' };
      vi.mocked(authService.logout).mockResolvedValue({ message: 'Logged out successfully' });

      await authController.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith(1, 'cookie_token');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens from body and return new tokens', async () => {
      req.body = { refreshToken: 'old_refresh' };
      const mockResult = { accessToken: 'new_jwt', refreshToken: 'new_refresh' };
      vi.mocked(authService.refreshToken).mockResolvedValue(mockResult);

      await authController.refreshToken(req, res);

      expect(authService.refreshToken).toHaveBeenCalledWith('old_refresh');
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'new_refresh', expect.objectContaining({
        httpOnly: true,
      }));
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Token refreshed successfully',
        data: mockResult,
      });
    });

    it('should refresh tokens from cookie', async () => {
      req.headers = { cookie: 'refreshToken=cookie_old_refresh' };
      const mockResult = { accessToken: 'new_jwt', refreshToken: 'new_refresh' };
      vi.mocked(authService.refreshToken).mockResolvedValue(mockResult);

      await authController.refreshToken(req, res);

      expect(authService.refreshToken).toHaveBeenCalledWith('cookie_old_refresh');
    });

    it('should return 401 if no refresh token provided', async () => {
      req.body = {};
      req.headers = {};

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Refresh token is required',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should call forgotPassword service', async () => {
      req.body = { email: 'test@example.com' };
      vi.mocked(authService.forgotPassword).mockResolvedValue({ message: 'Sent' });

      await authController.forgotPassword(req, res);

      expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Sent',
      });
    });
  });

  describe('resetPassword', () => {
    it('should call resetPassword service', async () => {
      req.body = { token: 'tok', password: 'new' };
      vi.mocked(authService.resetPassword).mockResolvedValue({ message: 'Reset' });

      await authController.resetPassword(req, res);

      expect(authService.resetPassword).toHaveBeenCalledWith('tok', 'new');
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Reset',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should call verifyEmail service', async () => {
      req.body = { token: 'tok' };
      vi.mocked(authService.verifyEmail).mockResolvedValue({ message: 'Verified' });

      await authController.verifyEmail(req, res);

      expect(authService.verifyEmail).toHaveBeenCalledWith('tok');
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Verified',
      });
    });
  });

  describe('resendVerification', () => {
    it('should call resendVerification service', async () => {
      req.body = { email: 'test@example.com' };
      vi.mocked(authService.resendVerification).mockResolvedValue({ message: 'Resent' });

      await authController.resendVerification(req, res);

      expect(authService.resendVerification).toHaveBeenCalledWith('test@example.com');
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Resent',
      });
    });
  });
});
