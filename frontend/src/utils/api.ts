const getApiUrl = () => {
  // Priority 1: Direct Environment Variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    if (typeof window !== 'undefined') console.log('[API] Using Environment URL:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Priority 2: Client-side dynamic detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Broaden local detection: localhost, 127.x.x.x, 192.168.x.x, 10.x.x.x, 172.16-31.x.x, and .local or .lan domains
    const isLocal = hostname === 'localhost' || 
                    hostname === '127.0.0.1' || 
                    hostname.startsWith('192.168.') || 
                    hostname.startsWith('10.') ||
                    (hostname.startsWith('172.') && parseInt(hostname.split('.')[1]) >= 16 && parseInt(hostname.split('.')[1]) <= 31) ||
                    hostname.endsWith('.local') ||
                    hostname.endsWith('.lan') ||
                    hostname.includes('.local-'); // For some tunnel services

    if (isLocal) {
      const localUrl = `http://${hostname}:5000/api`;
      console.log('[API] Local Environment Detected:', localUrl);
      return localUrl;
    }

    // Production Fallback (Render.com)
    const renderUrl = 'https://sk-tech-cctv.onrender.com/api';
    console.log('[API] Rendering Environment Detected:', renderUrl);
    return renderUrl;
  }

  // Priority 3: Server-side (during build/pre-render)
  return 'https://sk-tech-cctv.onrender.com/api';
};

export const API_URL = getApiUrl();

export const getImageUrl = (path: string) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Only return as-is if it's clearly a local static asset from the public folder
  if (cleanPath.startsWith('/assets/') || cleanPath.startsWith('/placeholder')) {
    return cleanPath;
  }

  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  
  // If the path doesn't already have /uploads/ and isn't a cloud-origin
  if (!cleanPath.startsWith('/uploads/')) {
     return `${baseUrl}/uploads${cleanPath}`;
  }

  return `${baseUrl}${cleanPath}`;
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sk_auth_token') : null;
  
  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for Render cold start

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...Object.fromEntries(
      Object.entries(options.headers || {}).map(([k, v]) => [k, String(v)])
    ),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      cache: 'no-store',
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const statusMessages: Record<number, string> = {
        400: 'The information provided was invalid. Please check and try again.',
        401: 'Your session has expired. Please log in again.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource could not be found.',
        409: 'There was a conflict with your request (e.g., duplicate entry).',
        500: 'We are experiencing a temporary server issue. Please try again later.',
        502: 'The server is temporarily unavailable. Please try again in a few moments.',
        503: 'Service is temporarily down for maintenance. Please try again later.',
        504: 'The request timed out. Please check your connection and try again.',
      };
      
      const errorMessage = errorData.message || statusMessages[response.status] || `An unexpected error occurred (Code: ${response.status}). Please try again.`;
      throw new Error(errorMessage);
    }

    let responseData;
    try {
      const text = await response.text();
      responseData = text ? JSON.parse(text) : {};
    } catch (parseError) {
      responseData = {}; // Fallback if not valid JSON
    }
    return responseData;
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
