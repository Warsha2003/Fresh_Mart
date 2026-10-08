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
        const restoredUser = JSON.parse(storedUser);
        const normalizedUser = {
          ...restoredUser,
          role: restoredUser.role || 'customer',
        };

        setToken(storedToken);
        setUser(normalizedUser);

        // Background verification to keep profile fresh
        client
          .get('/auth/me', { headers: { Authorization: `Bearer ${storedToken}` } })
          .then((res) => {
            if (res.data?.user) {
              const verifiedUser = {
                ...res.data.user,
                role: res.data.user.role || normalizedUser.role || 'customer',
              };
              setUser(verifiedUser);
              AsyncStorage.setItem('@freshmart_user', JSON.stringify(verifiedUser));
            }
          })
          .catch((error) => {
            // Only clear session if token is explicitly invalid or expired (401)
            if (error.response?.status === 401 || error.status === 401) {
              logout();
            } else {
              console.warn('[AuthContext] Background token refresh skipped (offline or network error)');
            }
          });
      }
    } catch (error) {
      console.error('[AuthContext] Error restoring session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password, role) => {
    const payload = { email, password };
    if (role) {
      payload.role = role;
    }
    const response = await client.post('/auth/login', payload);
    const { token: receivedToken, user: receivedUser } = response.data;
    const finalUser = {
      ...receivedUser,
      role: receivedUser.role || role || 'customer',
    };

    await AsyncStorage.setItem('@freshmart_token', receivedToken);
    await AsyncStorage.setItem('@freshmart_user', JSON.stringify(finalUser));

    setToken(receivedToken);
    setUser(finalUser);
    return finalUser;
  };

  const register = async (name, email, password, phone, role) => {
    const payload = {
      name,
      email,
      password,
      phone,
      role: role || 'customer',
    };
    const response = await client.post('/auth/register', payload);
    const { token: receivedToken, user: receivedUser } = response.data;
    const finalUser = {
      ...receivedUser,
      role: receivedUser.role || role || 'customer',
    };

    await AsyncStorage.setItem('@freshmart_token', receivedToken);
    await AsyncStorage.setItem('@freshmart_user', JSON.stringify(finalUser));

    setToken(receivedToken);
    setUser(finalUser);
    return finalUser;
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

  const deleteAccount = async () => {
    await client.delete('/profile');
    await logout();
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
        deleteAccount,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
