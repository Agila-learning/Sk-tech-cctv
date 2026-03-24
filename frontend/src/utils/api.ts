const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
      return `https://${hostname}/api`; // Default to HTTPS for production
    }
  }

  // During build time (server-side, no NEXT_PUBLIC_API_URL), return a placeholder
  // that won't cause connection hangs on restricted build environments.
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    return 'https://api-placeholder.sktech.com/api';
  }

  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();

export const getImageUrl = (path: string) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/products/') || cleanPath.startsWith('/images/')) {
    return cleanPath;
  }

  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}${cleanPath}`;
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sk_auth_token') : null;
  
  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
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
    // During build, we want to fail silently or return empty data to prevent hanging
    if (typeof window === 'undefined') {
      console.warn(`Fetch to ${endpoint} failed during pre-render:`, error.message);
      return null; 
    }
    throw error;
  }
};
