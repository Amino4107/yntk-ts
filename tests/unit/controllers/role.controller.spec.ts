import { describe, it, expect, vi, beforeEach } from 'vitest';
import roleController from '../../../src/controllers/role.controller';
import roleService from '../../../src/services/role.service';

vi.mock('../../../src/services/role.service');

describe('Role Controller', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      params: {},
      body: {},
      query: {},
      protocol: 'http',
      get: vi.fn().mockReturnValue('localhost'),
      baseUrl: '/api/v1',
      path: '/roles',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('getRoles', () => {
    it('should retrieve all roles successfully', async () => {
      vi.mocked(roleService.getAllRoles).mockResolvedValue({ data: [{ id: 1, name: 'ADMIN' }], total: 1 } as any);

      await roleController.getRoles(req, res);

      expect(roleService.getAllRoles).toHaveBeenCalledWith(1, 10, 'createdAt', 'asc', undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        status: 'success', 
        data: expect.any(Array),
        meta: expect.any(Object),
        links: expect.any(Object)
      }));
    });

    it('should pass search parameter to service', async () => {
      req.query = { search: 'admin' };
      vi.mocked(roleService.getAllRoles).mockResolvedValue({ data: [{ id: 1, name: 'ADMIN' }], total: 1 } as any);

      await roleController.getRoles(req, res);

      expect(roleService.getAllRoles).toHaveBeenCalledWith(1, 10, 'createdAt', 'asc', 'admin');
    });
  });

  describe('getRole', () => {
    it('should retrieve a single role by ID', async () => {
      req.params.id = '1';
      vi.mocked(roleService.getRoleById).mockResolvedValue({ id: 1, name: 'USER' } as any);

      await roleController.getRole(req, res);

      expect(roleService.getRoleById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createRole', () => {
    it('should create a role and return 201', async () => {
      req.body = { name: 'MODERATOR', description: 'desc', permissions: [1, 2] };
      vi.mocked(roleService.createRole).mockResolvedValue({ id: 2, name: 'MODERATOR' } as any);

      await roleController.createRole(req, res);

      expect(roleService.createRole).toHaveBeenCalledWith('MODERATOR', 'desc', [1, 2]);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateRole', () => {
    it('should properly structure update payload and call service', async () => {
      req.params.id = '2';
      req.body = { description: 'New description' }; // no name, no permissions

      vi.mocked(roleService.updateRole).mockResolvedValue({ id: 2, description: 'New description' } as any);

      await roleController.updateRole(req, res);

      expect(roleService.updateRole).toHaveBeenCalledWith(2, { description: 'New description' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteRole', () => {
    it('should call delete Role on service and return properly', async () => {
      req.params.id = '4';
      vi.mocked(roleService.deleteRole).mockResolvedValue({} as any);

      await roleController.deleteRole(req, res);

      expect(roleService.deleteRole).toHaveBeenCalledWith(4);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Role deleted successfully' }));
    });
  });
});
