export type PublicUser = {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
};

export type AuthUser = PublicUser & {
  roles: string[];
  permissions: string[];
};
