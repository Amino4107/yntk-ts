import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from '../../../src/services/auth.service';
import userRepository from '../../../src/repositories/user.repository';
import refreshTokenRepository from '../../../src/repositories/refresh-token.repository';
import emailService from '../../../src/services/email.service';
import logger from '../../../src/config/logger';

// Mock dependencies
vi.mock('../../../src/repositories/user.repository');
vi.mock('../../../src/repositories/refresh-token.repository');
vi.mock('../../../src/services/email.service');
vi.mock('../../../src/config/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('../../../src/utils/password-utils', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
  comparePassword: vi.fn().mockResolvedValue(true),
}));
vi.mock('../../../src/utils/token-utils', () => ({
  generateVerificationToken: vi.fn().mockReturnValue('verification_token'),
  generateResetToken: vi.fn().mockReturnValue('reset_token'),
  hashToken: vi.fn().mockReturnValue('hashed_token'),
  generateAccessToken: vi.fn().mockReturnValue('jwt_token'),
  generateRefreshToken: vi.fn().mockReturnValue('refresh_token_value'),
}));
vi.mock('../../../src/config/env', () => ({
  default: {
    jwtSecret: 'test-secret',
    accessTokenExpiry: '1h',
    enableRefreshToken: true,
    refreshTokenInJson: true,
    refreshTokenInCookie: true,
    refreshTokenExpiry: 604800000, // 7 days in ms
    emailVerificationTokenExpiry: 86400000,
    resetPasswordTokenExpiry: 3600000,
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const payload = {
        username: 'newuser',
        displayName: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      const createdUser = {
        id: 1,
        ...payload,
        password: 'hashed_password',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(userRepository.create).mockResolvedValue(createdUser as any);

      const result = await authService.register(payload);

      expect(userRepository.create).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(payload.email, 'verification_token');
      expect(result).toHaveProperty('id');
      expect(result).not.toHaveProperty('password');
    });

    it('should handle registration failure (duplicate entry)', async () => {
      const payload = {
        username: 'existing',
        displayName: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      };

      vi.mocked(userRepository.create).mockRejectedValue(new Error('Duplicate entry'));

      await expect(authService.register(payload)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginPayload = { email: 'test@example.com', password: 'password123' };
    const user = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      password: 'hashed_password',
      roles: [],
    };

    it('should login successfully and return accessToken with refreshToken', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(user as any);
      vi.mocked(refreshTokenRepository.deleteAllRefreshTokensForUser).mockResolvedValue({ count: 0 });
      vi.mocked(refreshTokenRepository.saveRefreshToken).mockResolvedValue({} as any);

      const result = await authService.login(loginPayload);

      expect(result).toHaveProperty('accessToken', 'jwt_token');
      expect(result).toHaveProperty('refreshToken', 'refresh_token_value');
      expect(result.user).toHaveProperty('email', 'test@example.com');
      expect(refreshTokenRepository.deleteAllRefreshTokensForUser).toHaveBeenCalledWith(1);
      expect(refreshTokenRepository.saveRefreshToken).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      await expect(authService.login({ email: 'unknown@example.com', password: 'pwd' }))
        .rejects.toThrow('User not found!');
    });

    it('should throw error if password is invalid', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(user as any);

      // Override mock for this test
      const passwordUtils = await import('../../../src/utils/password-utils');
      vi.mocked(passwordUtils.comparePassword).mockResolvedValueOnce(false);

      await expect(authService.login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials!');
    });
  });

  describe('logout', () => {
    it('should revoke refresh token on logout', async () => {
      vi.mocked(refreshTokenRepository.deleteRefreshToken).mockResolvedValue({ count: 1 });

      const result = await authService.logout(1, 'some_refresh_token');

      expect(refreshTokenRepository.deleteRefreshToken).toHaveBeenCalledWith('some_refresh_token');
      expect(result).toHaveProperty('message', 'Logged out successfully');
    });

    it('should handle logout without refresh token', async () => {
      const result = await authService.logout(1, undefined);

      expect(refreshTokenRepository.deleteRefreshToken).not.toHaveBeenCalled();
      expect(result).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('refreshToken', () => {
    const storedToken = {
      id: 1,
      token: 'old_refresh_token',
      userId: 1,
      expiresAt: new Date(Date.now() + 86400000), // expires tomorrow
      createdAt: new Date(),
      user: {
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
        password: 'hashed',
        roles: [],
      },
    };

    it('should rotate tokens successfully', async () => {
      vi.mocked(refreshTokenRepository.findRefreshToken).mockResolvedValue(storedToken as any);
      vi.mocked(refreshTokenRepository.deleteRefreshToken).mockResolvedValue({ count: 1 });
      vi.mocked(refreshTokenRepository.deleteExpiredRefreshTokens).mockResolvedValue({ count: 0 });
      vi.mocked(refreshTokenRepository.saveRefreshToken).mockResolvedValue({} as any);

      const result = await authService.refreshToken('old_refresh_token');

      expect(result).toHaveProperty('accessToken', 'jwt_token');
      expect(result).toHaveProperty('refreshToken', 'refresh_token_value');
      expect(refreshTokenRepository.deleteRefreshToken).toHaveBeenCalledWith('old_refresh_token');
      expect(refreshTokenRepository.deleteExpiredRefreshTokens).toHaveBeenCalled();
      expect(refreshTokenRepository.saveRefreshToken).toHaveBeenCalled();
    });

    it('should throw error for invalid refresh token', async () => {
      vi.mocked(refreshTokenRepository.findRefreshToken).mockResolvedValue(null);

      await expect(authService.refreshToken('invalid_token'))
        .rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for expired refresh token', async () => {
      const expiredToken = {
        ...storedToken,
        expiresAt: new Date(Date.now() - 86400000), // expired yesterday
      };

      vi.mocked(refreshTokenRepository.findRefreshToken).mockResolvedValue(expiredToken as any);
      vi.mocked(refreshTokenRepository.deleteRefreshToken).mockResolvedValue({ count: 1 });

      await expect(authService.refreshToken('expired_token'))
        .rejects.toThrow('Refresh token has expired, please login again');
      expect(refreshTokenRepository.deleteRefreshToken).toHaveBeenCalledWith('expired_token');
    });
  });
});
