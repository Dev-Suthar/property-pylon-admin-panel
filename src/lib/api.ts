import axios, { AxiosInstance, AxiosError } from 'axios';
import { CONFIG } from './config';

// Use proxy when on HTTPS to avoid mixed content issues
// Use direct backend URL when on HTTP (development)
const getApiBaseUrl = () => {
  // Check if VITE_API_URL is explicitly set (takes precedence)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // If page is served over HTTPS, use relative path that goes through proxy
  // This avoids mixed content errors (HTTPS page trying to load HTTP resources)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    // Use relative path - .htaccess will proxy to backend via api-proxy.php
    return '/api';
  }
  
  // For HTTP (development), use direct backend API URL
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

