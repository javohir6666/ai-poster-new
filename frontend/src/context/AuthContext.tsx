import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  refresh: string | null;
  login: (access: string, refresh: string | undefined, user: User) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedRefresh = localStorage.getItem("refresh");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setRefresh(storedRefresh);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (access: string, refreshToken: string | undefined, newUser: User) => {
    localStorage.setItem("token", access);
    if (refreshToken) localStorage.setItem("refresh", refreshToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(access);
    setRefresh(refreshToken || null);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setToken(null);
    setRefresh(null);
    setUser(null);
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => {
      const next = { ...(prev || ({} as User)), ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo(
    () => ({ user, token, refresh, login, logout, updateUser, isAuthenticated: !!token }),
    [user, token, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
