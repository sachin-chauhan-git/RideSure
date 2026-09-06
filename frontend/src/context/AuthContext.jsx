import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';
import { wsService } from '../services/websocket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
          if (userData.role === 'ROLE_DRIVER') {
            const profile = await api.getDriverProfile().catch(() => null);
            setDriverProfile(profile);
          }
        } catch (err) {
          console.warn('Session expired or invalid token');
          removeAuthToken();
        }
      }
      setLoading(false);
    };

    initAuth();
    wsService.connect();

    return () => {
      wsService.disconnect();
    };
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setAuthToken(data.token);
    setUser({
      id: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
    });
    if (data.driverProfile) {
      setDriverProfile(data.driverProfile);
    }
    return data;
  };

  const register = async (registerData) => {
    const data = await api.register(registerData);
    setAuthToken(data.token);
    setUser({
      id: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
    });
    if (data.driverProfile) {
      setDriverProfile(data.driverProfile);
    }
    return data;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setDriverProfile(null);
  };

  // Quick switch between test accounts for pair-testing
  const switchQuickAccount = async (accountType) => {
    const accounts = {
      rider: { email: 'rider@test.com', password: 'password123' },
      bikeDriver: { email: 'bike.driver@test.com', password: 'password123' },
      autoDriver: { email: 'auto.driver@test.com', password: 'password123' },
      cabDriver: { email: 'cab.driver@test.com', password: 'password123' },
      admin: { email: 'admin@test.com', password: 'password123' },
    };

    const creds = accounts[accountType];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        driverProfile,
        setDriverProfile,
        loading,
        login,
        register,
        logout,
        switchQuickAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
