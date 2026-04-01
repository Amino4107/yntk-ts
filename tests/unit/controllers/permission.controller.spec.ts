import { describe, it, expect, vi, beforeEach } from 'vitest';
import permissionController from '../../../src/controllers/permission.controller';
import permissionRepository from '../../../src/repositories/permission.repository';

vi.mock('../../../src/repositories/permission.repository');

describe('Permission Controller', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('getAllPermissions', () => {
    it('should fetch all permissions and return 200', async () => {
      const mockResult = [{ id: 1, name: 'users:read' }];
      vi.mocked(permissionRepository.findAll).mockResolvedValue(mockResult as any);

      await permissionController.getAllPermissions(req, res);

      expect(permissionRepository.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockResult }));
    });
  });
});
