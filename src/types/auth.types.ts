export type AuthRole = "management" | "internal";
import type { DataScope } from "@/lib/auth/data-scope";

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
  dataScope?: DataScope;
};

export type LoginRequest = {
  identifier: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: AuthUser;
};
