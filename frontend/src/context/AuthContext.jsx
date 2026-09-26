import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const token = localStorage.getItem('documind_token');
      localStorage.removeItem('documind_guest_id');

      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.data.success && res.data.user && !res.data.user.isGuest) {
            setUser(res.data.user);
            setLoading(false);
            return;
          }
        } catch (tokenErr) {
          localStorage.removeItem('documind_token');
        }
      }

      setUser(null);
    } catch (err) {
      console.warn('Auth init note:', err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data.success) {
      localStorage.setItem('documind_token', res.data.token);
      localStorage.removeItem('documind_guest_id');
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    if (res.data.success) {
      localStorage.setItem('documind_token', res.data.token);
      localStorage.removeItem('documind_guest_id');
      setUser(res.data.user);
    }
    return res.data;
  };

  const forgotPassword = async (email) => {
    const res = await authApi.forgotPassword({ email });
    return res.data;
  };

  const resetPassword = async (email, code, newPassword) => {
    const res = await authApi.resetPassword({ email, code, newPassword });
    if (res.data.success && res.data.token) {
      localStorage.setItem('documind_token', res.data.token);
      localStorage.removeItem('documind_guest_id');
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('documind_token');
    localStorage.removeItem('documind_guest_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        isAuthenticated: !!user && !user.isGuest,
        isGuest: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
