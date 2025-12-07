import axios, { AxiosInstance, AxiosError } from 'axios';
import { CONFIG } from './config';

// Use relative API path when in production (HTTPS) to avoid mixed content issues
// The .htaccess file will proxy /api/* requests to the backend server
// For development, use the full API URL
const getApiBaseUrl = () => {
  // Check if VITE_API_URL is explicitly set (takes precedence)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // In production (HTTPS), use relative path that goes through proxy
  // In development, use direct API URL from config
  if (import.meta.env.PROD && window.location.protocol === 'https:') {
    // Use relative path - .htaccess will proxy to backend
    return '/api';
  }
  
  // Use configured API base URL
  return CONFIG.API_BASE_URL;
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  get instance() {
    return this.client;
  }
}

export const apiClient = new ApiClient().instance;

// Error handler utility
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: { message?: string } }>;
    return (
      axiosError.response?.data?.error?.message ||
      axiosError.message ||
      'An error occurred'
    );
  }
  return 'An unexpected error occurred';
};

