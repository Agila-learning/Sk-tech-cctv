import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://sk-tech-cctv.onrender.com/api';

export const API_URL = API_BASE;

export const getImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = API_BASE.replace(/\/api\/?$/, '');

  if (cleanPath.startsWith('/assets/') || cleanPath.startsWith('/placeholder')) {
    return `${baseUrl}${cleanPath}`;
  }

  if (!cleanPath.startsWith('/uploads/')) {
    return `${baseUrl}/uploads${cleanPath}`;
  }

  return `${baseUrl}${cleanPath}`;
};

export const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = await SecureStore.getItemAsync('sk_auth_token');

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const method = (options.method || 'GET').toUpperCase();
  const isGetOrDelete = method === 'GET' || method === 'DELETE';
  const hasBody = !!options.body;

  if (!isFormData && !(isGetOrDelete && !hasBody)) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for Render cold start

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};
