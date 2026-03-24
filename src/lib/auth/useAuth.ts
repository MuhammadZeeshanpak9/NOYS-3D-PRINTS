import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useStore, User } from '../store/useStore';
import apiClient from '../api/client';

export const useAuth = () => {
  const { user, token, setUser, setToken, logout: clearStore } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = Cookies.get('jwt_token') || localStorage.getItem('jwt_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          // Attempt to fetch user profile with token
          const response = await apiClient.get('/user/me');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to authenticate stored token:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    if (!user) {
      initializeAuth();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (newToken: string, userData: User) => {
    Cookies.set('jwt_token', newToken, { expires: 7 });
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove('jwt_token');
    localStorage.removeItem('jwt_token');
    clearStore();
  };

  return { user, token, isLoading, isAuthenticated: !!user, login, logout };
};
