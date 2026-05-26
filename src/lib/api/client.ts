import axios from 'axios';
import Cookies from 'js-cookie';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('API Client baseURL:', process.env.NEXT_PUBLIC_API_URL);

apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('jwt_token') || localStorage.getItem('jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Builds the URL for the GLB proxy endpoint with the JWT in a query
// parameter, since useGLTF / browser GET requests can't attach the
// Authorization header that the proxy requires.
export function getGenerationModelUrl(generationId: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const token =
    (typeof window !== 'undefined' &&
      (Cookies.get('jwt_token') || localStorage.getItem('jwt_token'))) ||
    '';
  return `${base}/generations/${generationId}/model?token=${encodeURIComponent(token)}`;
}

export default apiClient;
