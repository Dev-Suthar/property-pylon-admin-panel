import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, LoginResponse } from '@/services/authService';
import { CONFIG } from '@/lib/config';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const ADMIN_ROLES = (import.meta.env.VITE_ADMIN_ROLES || 'super_admin')
  .split(',')
  .map((role: string) => role.trim());

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedToken = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    const storedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response: LoginResponse = await authService.login({
        username: email,
        password,
      });

      // The admin panel is for platform admins only; agency (broker) accounts
      // get 403 from every /admin endpoint, so stop them here with a clear message.
      if (!ADMIN_ROLES.includes(response.user.role)) {
        throw new Error('This account does not have access to the admin panel.');
      }

      setUser(response.user);
      setToken(response.token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, response.token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    } catch (error) {
      // Re-throw to let the component handle it
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
