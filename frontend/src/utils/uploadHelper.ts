// Utility for uploading files to the server
import { fetchWithAuth } from './api';

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Since we use fetchWithAuth, we can't easily pass FormData if fetchWithAuth stringifies it.
  // We need to do a standard fetch with auth token for multipart data.
  const token = localStorage.getItem('token');
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload file');
  }
  
  const data = await response.json();
  return data.url;
};
