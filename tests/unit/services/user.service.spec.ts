import { describe, it, expect, vi, beforeEach } from 'vitest';
import userService from '../../../src/services/user.service';
import userRepository from '../../../src/repositories/user.repository';
import logger from '../../../src/config/logger';

// Mock dependencies
vi.mock('../../../src/repositories/user.repository');
vi.mock('../../../src/config/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));


describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user and return public user data', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(userRepository.create).mockResolvedValue(mockUser as any);

      const result = await userService.createUser({
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
      });

      expect(userRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
      });
      expect(result).toHaveProperty('id', 1);
      expect(result).not.toHaveProperty('password');
    });

    it('should handle duplicate entry error', async () => {
      const error = new Error('Duplicate entry');
      vi.mocked(userRepository.create).mockRejectedValue(error);

      // We assume handleDuplicateEntryError re-throws the error or throws a specific AppError
      // Since we are mocking, we just expect the promise to reject
      await expect(userService.createUser({
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
      })).rejects.toThrow();
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users and transform to public format', async () => {
      const mockUsers = [{ id: 1, username: 'test1', password: 'pwd' }, { id: 2, username: 'test2', password: 'pwd' }];
      vi.mocked(userRepository.findAll).mockResolvedValue({ data: mockUsers, total: 2 } as any);

      const result = await userService.getAllUsers();

      expect(userRepository.findAll).toHaveBeenCalledWith(0, 10, { createdAt: 'asc' });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]).not.toHaveProperty('password');
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const mockUser = { id: 1, username: 'test', email: 'test@example.com' };
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);

      const result = await userService.getUserById('1');
      expect(result.id).toBe(1);
    });

    it('should throw error if user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);
      await expect(userService.getUserById('999')).rejects.toThrow('User not found!');
    });
  });

  describe('updateUser', () => {
    it('should update user and log the action', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const updatedUser = { ...mockUser, displayName: 'Updated' };

      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);
      vi.mocked(userRepository.update).mockResolvedValue(updatedUser as any);

      const result = await userService.updateUser('1', { displayName: 'Updated' });

      expect(userRepository.update).toHaveBeenCalledWith('1', { displayName: 'Updated' });
      expect(logger.info).toHaveBeenCalled();
      expect(result.displayName).toBe('Updated');
    });

    it('should throw error if user to update does not exist', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);
      await expect(userService.updateUser('999', {})).rejects.toThrow('User not found!');
    });

    it('should catch repository errors (like duplicates) and forward them', async () => {
      const mockUser = { id: 1 };
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);
      vi.mocked(userRepository.update).mockRejectedValue(new Error('Unique constraint failed'));

      await expect(userService.updateUser('1', {})).rejects.toThrow('Unique constraint failed');
    });
  });

  describe('deleteUser', () => {
    it('should delete user and log the action', async () => {
      const mockUser = { id: 1, email: 'test@example.com', username: 'test' };
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);
      vi.mocked(userRepository.deleteById).mockResolvedValue(mockUser as any);

      await userService.deleteUser('1');

      expect(userRepository.deleteById).toHaveBeenCalledWith('1');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should throw error if user to delete does not exist', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);
      await expect(userService.deleteUser('999')).rejects.toThrow('User not found!');
    });
  });

  describe('assignRoles', () => {
    it('should properly call updateRoles repository and return public user', async () => {
      const mockUser = { id: 1, email: 'test@example.com', username: 'test' };
      const roleIds = [1, 2];
      
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);
      vi.mocked(userRepository.updateRoles).mockResolvedValue({ ...mockUser, roles: [] } as any);

      const result = await userService.assignRoles('1', roleIds);

      expect(userRepository.updateRoles).toHaveBeenCalledWith('1', roleIds);
      expect(logger.info).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(1);
    });

    it('should throw error if user does not exist', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);
      
      await expect(userService.assignRoles('999', [1])).rejects.toThrow('User not found!');
      expect(userRepository.updateRoles).not.toHaveBeenCalled();
    });
  });
});
