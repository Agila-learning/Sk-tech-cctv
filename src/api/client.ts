import * as SecureStore from '../utils/storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

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

  const isFormData = options.body && (
    options.body instanceof FormData || 
    typeof (options.body as any).append === 'function' || 
    !!(options.body as any)._parts
  );
  
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const method = (options.method || 'GET').toUpperCase();
  const hasBody = !!options.body;

  if (!isFormData) {
    if (hasBody || (method !== 'GET' && method !== 'DELETE' && method !== 'HEAD')) {
      headers['Content-Type'] = 'application/json';
    }
  }

  // Prevent aggressive caching on React Native for GET requests
  if (method === 'GET') {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';
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
      const detailedMessage = errorData.details ? ` - ${errorData.details}` : '';
      throw new Error((errorData.error || errorData.message || `HTTP error! status: ${response.status}`) + detailedMessage);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};

/**
 * Ultra-robust cross-platform file uploader.
 * Uses native FileSystem.uploadAsync on iOS/Android to bypass React Native fetch() FormData bugs.
 */
export const uploadFile = async (endpoint: string, fileUri: string, fieldName: string = 'images', mimeType: string = 'image/jpeg'): Promise<any> => {
  const token = await SecureStore.getItemAsync('sk_auth_token');
  const url = `${API_BASE}${endpoint}`;

  if (Platform.OS === 'web') {
    const fd = new FormData();
    const fetchedUrl = await fetch(fileUri);
    const blob = await fetchedUrl.blob();
    const file = new File([blob], 'upload.file', { type: blob.type || mimeType });
    fd.append(fieldName, file);

    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || 'Upload failed');
    }
    return response.json();
  } else {
    // Native Mobile (Android/iOS)
    try {
      const uploadResult = await FileSystem.uploadAsync(url, fileUri, {
        httpMethod: 'POST',
        uploadType: 1 as any, // FileSystem.FileSystemUploadType.MULTIPART
        fieldName: fieldName,
        mimeType: mimeType,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        let errorMsg = 'Upload failed';
        try {
          const parsed = JSON.parse(uploadResult.body);
          errorMsg = parsed.details || parsed.error || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
      }
      return JSON.parse(uploadResult.body);
    } catch (err: any) {
      console.error('[Upload API] Error:', err);
      throw err;
    }
  }
};
