export type AuthRole = "management" | "internal";

export type AuthUser = {
  id: string;
  nik: string;
  username: string;
  name: string;
  role: AuthRole;
  avatarUrl?: string;
  codeDivision?: string;
  allowedDashboards?: string[];
  permissions?: string[];
};

export type LoginRequest = {
  identifier: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: AuthUser;
};
