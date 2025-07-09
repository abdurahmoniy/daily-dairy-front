import { createContext, useContext } from "react";
import { User } from "@shared/api";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dairy_auth_token");
};

export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("dairy_auth_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setStoredAuth = (token: string, user: User): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("dairy_auth_token", token);
  localStorage.setItem("dairy_auth_user", JSON.stringify(user));
};

export const clearStoredAuth = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("dairy_auth_token");
  localStorage.removeItem("dairy_auth_user");
};

export const hasPermission = (
  user: User | null,
  requiredRole: "ADMIN" | "MANAGER" | "USER",
): boolean => {
  if (!user) return false;

  const roleHierarchy = {
    ADMIN: 3,
    MANAGER: 2,
    USER: 1,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
};
