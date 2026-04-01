import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requirePermission } from '../../../src/middleware/permission.middleware';

describe('Permission Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      userData: {
        permissions: [] as string[],
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe('requirePermission', () => {
    it('should return 401 if userData is completely missing', () => {
      req.userData = undefined;
      const middleware = requirePermission('users:read');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Unauthorized') }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user lacks the required permission', () => {
      req.userData.permissions = ['roles:read']; // Missing 'users:read'
      const middleware = requirePermission('users:read');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Forbidden: You do not have the required permissions') }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if user has the requested permission', () => {
      req.userData.permissions = ['users:read', 'users:write'];
      const middleware = requirePermission('users:read');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
