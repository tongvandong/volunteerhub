import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/client';
import { registerForPush, unregisterPush } from '../utils/push';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          setUser(JSON.parse(raw));
          registerForPush(); // có phiên sẵn → đăng ký push (fire-and-forget)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (username, password) => {
    const { data } = await authApi.login(username, password);
    await AsyncStorage.setItem('token', data.token);
    if (data.refreshToken) await AsyncStorage.setItem('refreshToken', data.refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    registerForPush(); // đăng ký Expo push token sau khi đăng nhập
    return data.user;
  };

  const logout = async () => {
    await unregisterPush();
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
    setUser(null);
  };

  // Cập nhật một phần thông tin user cục bộ (sau khi sửa hồ sơ)
  const updateLocalUser = async (partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem('user', JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
}
