import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../core/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    if (token === 'demo-admin-token') {
      setUser({ user_id: 'demo-admin-1', full_name: 'System Admin', email: 'admin@printit.com', role: 'admin' });
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    if (token) {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('admin_token');
      }
    }
    setIsLoading(false);
  };

  const login = (token, userData) => {
    localStorage.setItem('admin_token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const enableDemoMode = () => {
    const demoUser = { user_id: 'demo-admin-1', full_name: 'System Admin', email: 'admin@printit.com', role: 'admin' };
    localStorage.setItem('admin_token', 'demo-admin-token');
    setUser(demoUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, enableDemoMode }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
