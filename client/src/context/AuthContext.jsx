import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'otp'

  const checkCurrentUser = async () => {
    try {
      const res = await fetch('/api/v1/users/me');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.user) {
          setUser(json.data.user);
        }
      }
    } catch (e) {
      // not authenticated or server offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const openAuthModal = (view = 'login') => {
    setAuthView(view);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const login = async (emailOrPhone, password) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Login failed');
    }
    setUser(json.data.user);
    closeAuthModal();
    return json.data.user;
  };

  const register = async (name, email, phone, password) => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Registration failed');
    }
    setUser(json.data.user);
    closeAuthModal();
    return json.data.user;
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    setUser(null);
  };

  useEffect(() => {
    window.openAuthModal = openAuthModal;
    window.closeAuthModal = closeAuthModal;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        authModalOpen,
        authView,
        setAuthView,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

