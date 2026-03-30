import type { AuthUser } from '../user';

declare global {
  namespace Express {
    interface Request {
      userData?: AuthUser;
    }
  }
}

export {};
