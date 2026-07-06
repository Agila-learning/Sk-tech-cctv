import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from '../utils/storage';
import { fetchWithAuth } from '../api/client';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'technician' | 'admin';
  phone?: string;
  address?: string;
  availabilityStatus?: string;
  isOnline?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (user && token) {
      registerPushToken();
    }
  }, [user, token]);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('sk_auth_token');
      const storedUser = await SecureStore.getItemAsync('sk_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setTimeout(registerPushToken, 1000);
      }
    } catch (e) {
      console.error('Failed to load auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const registerPushToken = async (retryCount = 0) => {
    try {
      if (Platform.OS === 'web') return;

      // On Android, POST_NOTIFICATIONS permission is needed for Android 13+
      if (Platform.OS === 'android') {
        const { status: androidStatus } = await Notifications.getPermissionsAsync();
        if (androidStatus !== 'granted') {
          const { status: requestedStatus } = await Notifications.requestPermissionsAsync({
            android: { allowAlert: true, allowBadge: true, allowSound: true }
          });
          if (requestedStatus !== 'granted') {
            console.log('[Push Token] Android notification permission denied.');
            return;
          }
        }
      } else {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            console.log('[Push Token] iOS notification permission denied.');
            return;
          }
        }
      }

      // Fetch native FCM / APNs device token for direct backend delivery
      const pushTokenData = await Notifications.getDevicePushTokenAsync();
      const token = pushTokenData.data;

      if (token) {
        await fetchWithAuth('/auth/push-token', {
          method: 'PATCH',
          body: JSON.stringify({ token })
        });
        console.log('[Push Token Registered Successfully]', token);
      }
    } catch (error: any) {
      console.log(`Push token registration failed (Attempt ${retryCount + 1}):`, error?.message || error);
      if (retryCount < 3) {
        setTimeout(() => registerPushToken(retryCount + 1), 3000 * (retryCount + 1));
      }
    }
  };

  const login = async (email: string, password: string) => {
    const data = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
    });

    await SecureStore.setItemAsync('sk_auth_token', data.token);
    await SecureStore.setItemAsync('sk_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    
    // Register push token after successful login
    setTimeout(registerPushToken, 1000);
  };

  const register = async (regData: any) => {
    const data = await fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(regData),
    });

    await SecureStore.setItemAsync('sk_auth_token', data.token);
    await SecureStore.setItemAsync('sk_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('sk_auth_token');
    await SecureStore.deleteItemAsync('sk_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      SecureStore.setItemAsync('sk_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
