const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If not localhost, try to hit the same host on port 5000
    if (hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
      return `http://${hostname}:5000/api`;
    }
  }
  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();

export const getImageUrl = (path: string) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  
  // Normalize path to always start with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Local assets (in frontend public folder) should not be prefixed with backend URL
  if (cleanPath.startsWith('/products/') || cleanPath.startsWith('/images/') || cleanPath === '/placeholder.png') {
    return cleanPath;
  }

  // Combine with backend URL robustly
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}${cleanPath}`;
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sk_auth_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
};
