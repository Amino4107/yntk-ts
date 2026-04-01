import { describe, it, expect, vi, beforeEach } from 'vitest';
import roleService from '../../../src/services/role.service';
import roleRepository from '../../../src/repositories/role.repository';

// Mock dependencies
vi.mock('../../../src/repositories/role.repository');

describe('Role Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const mockRoles = [{ id: 1, name: 'ADMIN' }, { id: 2, name: 'USER' }];
      vi.mocked(roleRepository.findAll).mockResolvedValue(mockRoles as any);

      const result = await roleService.getAllRoles();

      expect(roleRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('getRoleById', () => {
    it('should return the role if found', async () => {
      const mockRole = { id: 1, name: 'ADMIN' };
      vi.mocked(roleRepository.findById).mockResolvedValue(mockRole as any);

      const result = await roleService.getRoleById(1);

      expect(roleRepository.findById).toHaveBeenCalledWith(1);
      expect(result.name).toBe('ADMIN');
    });

    it('should throw Error 404 if role not found', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null);

      await expect(roleService.getRoleById(999)).rejects.toThrow('Role not found');
    });
  });

  describe('createRole', () => {
    it('should create and return role successfully', async () => {
      const inputName = 'editor';
      const formattedName = 'EDITOR';
      
      vi.mocked(roleRepository.findByName).mockResolvedValue(null);
      vi.mocked(roleRepository.create).mockResolvedValue({ id: 3, name: formattedName } as any);

      const result = await roleService.createRole(inputName, 'Edits content', [1, 2]);

      expect(roleRepository.findByName).toHaveBeenCalledWith(formattedName);
      expect(roleRepository.create).toHaveBeenCalledWith({
        name: formattedName,
        description: 'Edits content',
        permissionIds: [1, 2],
      });
      expect(result.name).toBe(formattedName);
    });

    it('should throw error 409 if role name already exists', async () => {
      vi.mocked(roleRepository.findByName).mockResolvedValue({ id: 1, name: 'EDITOR' } as any);

      await expect(roleService.createRole('editor')).rejects.toThrow('Role with this name already exists');
      expect(roleRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('should update role without name change seamlessly', async () => {
      const mockRole = { id: 1, name: 'CUSTOM_ROLE' };
      vi.mocked(roleRepository.findById).mockResolvedValue(mockRole as any);
      vi.mocked(roleRepository.update).mockResolvedValue({ ...mockRole, description: 'Updated' } as any);

      const result = await roleService.updateRole(1, { description: 'Updated', permissionIds: [1] });

      expect(roleRepository.update).toHaveBeenCalledWith(1, { description: 'Updated', permissionIds: [1] });
      expect(result.description).toBe('Updated');
    });

    it('should reject renaming a protected system role', async () => {
      const mockRole = { id: 1, name: 'SUPERADMIN' };
      vi.mocked(roleRepository.findById).mockResolvedValue(mockRole as any);

      await expect(
        roleService.updateRole(1, { name: 'NOT_SUPERADMIN' })
      ).rejects.toThrow('Cannot rename a protected system role');

      expect(roleRepository.update).not.toHaveBeenCalled();
    });

    it('should reject renaming to a duplicate name', async () => {
      const mockRole = { id: 1, name: 'EDITOR' };
      vi.mocked(roleRepository.findById).mockResolvedValue(mockRole as any);
      // Attempting to rename EDITOR to MODERATOR, but MODERATOR exists
      vi.mocked(roleRepository.findByName).mockResolvedValue({ id: 2, name: 'MODERATOR' } as any);

      await expect(
        roleService.updateRole(1, { name: 'moderator' })
      ).rejects.toThrow('Role with this name already exists');
    });
  });

  describe('deleteRole', () => {
    it('should delete unprotected custom roles successfully', async () => {
      const mockRole = { id: 4, name: 'EDITOR' };
      vi.mocked(roleRepository.findById).mockResolvedValue(mockRole as any);
      vi.mocked(roleRepository.deleteById).mockResolvedValue(mockRole as any);

      await roleService.deleteRole(4);

      expect(roleRepository.deleteById).toHaveBeenCalledWith(4);
    });

    it('should reject deletion of protected roles', async () => {
      const mockRoleUser = { id: 3, name: 'USER' };
      vi.mocked(roleRepository.findById).mockResolvedValue(mockRoleUser as any);

      await expect(
        roleService.deleteRole(3)
      ).rejects.toThrow('Cannot delete a protected system role');

      expect(roleRepository.deleteById).not.toHaveBeenCalled();
    });
  });
});
