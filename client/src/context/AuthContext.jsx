import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = [
  { role: 'donor', name: 'Chef Rajesh Khanna', email: 'rajesh.mumbai@demo-rescuebite.org', city: 'Mumbai' },
  { role: 'recipient', name: 'Sunita Patil (Seva NGO)', email: 'sunita.seva@demo-rescuebite.org', city: 'Mumbai' },
  { role: 'volunteer', name: 'Rohan Sharma', email: 'rohan.volunteer@demo-rescuebite.org', city: 'Mumbai' },
  { role: 'admin', name: 'Platform Admin', email: 'superadmin@rescuebite.org', city: 'System' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore authenticated session from HttpOnly cookie on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const res = await api.getMe();
        if (isMounted && res?.data?.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        // Unauthenticated or expired session - user is guest
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await api.login(email, password);
      if (res?.data?.user) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error(res?.message || 'Login failed');
    } catch (err) {
      const message = err.message || 'Invalid email or password';
      setAuthError(message);
      throw err;
    }
  };

  const register = async (registrationData) => {
    setAuthError(null);
    try {
      const res = await api.register(registrationData);
      if (res?.data?.user) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error(res?.message || 'Registration failed');
    } catch (err) {
      const message = err.message || 'Registration failed';
      setAuthError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
    }
  };

  // Quick Switcher for Demo Persona Testing (calls real backend login)
  const switchDemoRole = async (roleKey) => {
    if (roleKey === 'guest') {
      await logout();
      return;
    }

    const demoAccount = DEMO_CREDENTIALS.find(d => d.role === roleKey);
    if (!demoAccount) return;

    try {
      await login(demoAccount.email, 'DemoPassword123!');
    } catch (err) {
      console.warn(`[Demo Switcher] Could not log into demo account ${demoAccount.email}:`, err.message);
    }
  };

  const isDonor = user?.role === 'donor';
  const isRecipient = user?.role === 'recipient';
  const isVolunteer = user?.role === 'volunteer';
  const isAdmin = user?.role === 'admin';
  const isGuest = !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        login,
        register,
        logout,
        switchRole: switchDemoRole,
        isDonor,
        isRecipient,
        isVolunteer,
        isAdmin,
        isGuest,
        demoCredentials: DEMO_CREDENTIALS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
