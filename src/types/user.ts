export type PublicUser = {
  id: number;
  username: string;
  displayName: string | null;
  email: string;
};

export type AuthUser = PublicUser & {
  roles: string[];
  permissions: string[];
};
