/**
 * Authentication Context
 * Manages global auth state, persistent login session in AsyncStorage, and login/register/logout actions.
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app startup
  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@freshmart_token');
      const storedUser = await AsyncStorage.getItem('@freshmart_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Background verification to keep profile fresh
        client
          .get('/auth/me', { headers: { Authorization: `Bearer ${storedToken}` } })
          .then((res) => {
            if (res.data?.user) {
              setUser(res.data.user);
              AsyncStorage.setItem('@freshmart_user', JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            // If token expired, clear session
            logout();
          });
      }
    } catch (error) {
      console.error('[AuthContext] Error restoring session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await client.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data;

    await AsyncStorage.setItem('@freshmart_token', receivedToken);
    await AsyncStorage.setItem('@freshmart_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (name, email, password, phone) => {
    const response = await client.post('/auth/register', { name, email, password, phone });
    const { token: receivedToken, user: receivedUser } = response.data;

    await AsyncStorage.setItem('@freshmart_token', receivedToken);
    await AsyncStorage.setItem('@freshmart_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@freshmart_token');
      await AsyncStorage.removeItem('@freshmart_user');
    } catch (e) {
      console.error('[AuthContext] Error during logout:', e);
    }
    setToken(null);
    setUser(null);
  };

  const updateUserData = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      AsyncStorage.setItem('@freshmart_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
