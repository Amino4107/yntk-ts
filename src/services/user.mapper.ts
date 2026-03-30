import type { User } from '../generated/prisma/client';
import type { PublicUser, AuthUser } from '../types/user';

export const toPublicUser = (user: any): PublicUser => {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    email: user.email,
  };
};

export const toAuthUser = (user: any): AuthUser => {
  const roles = user.roles?.map((r: any) => r.name) || [];
  const permissions = Array.from(
    new Set(
      user.roles?.flatMap((r: any) => r.permissions?.map((p: any) => p.name) || []) || []
    )
  ) as string[];

  return {
    ...toPublicUser(user),
    roles,
    permissions,
  };
};
