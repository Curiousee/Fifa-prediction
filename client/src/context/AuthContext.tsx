import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import type { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);
export { AuthContext };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data as User);
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: userData } = res.data as {
      token: string;
      user: User;
    };
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    toast.success(`Welcome back, ${userData.name}! ⚽`);
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    const res = await authAPI.register({ name, email, password });
    const { token: newToken, user: userData } = res.data as {
      token: string;
      user: User;
    };
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    toast.success(`Welcome to the contest, ${userData.name}! 🏆`);
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
