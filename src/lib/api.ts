import axios, { AxiosInstance, AxiosError } from 'axios';
import { CONFIG } from './config';

// Use proxy to avoid CORS issues and mixed content problems
const getApiBaseUrl = () => {
  // Check if VITE_API_URL is explicitly set (for development)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // In development (localhost), always use relative path to go through Vite proxy
  // This avoids CORS issues when making requests to the backend API
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // For localhost development, use relative path that goes through Vite proxy
    // The Vite proxy forwards to the proxy server, which forwards to the backend
    if (isLocalhost) {
      return '/api';
    }
    
    // In production (deployed), use relative path that goes through proxy
    // This works for both HTTP and HTTPS
    return '/api';
  }
  
  // Fallback (shouldn't normally reach here)
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      // Set timeout similar to mobile app (30 seconds)
      timeout: CONFIG.TIMEOUT || 30000,
      // Accept all status codes and handle them in interceptors (matching mobile app behavior)
      validateStatus: () => true,
      // Note: Browsers automatically handle compression (gzip/deflate) and set Accept-Encoding
      // The proxy (api-proxy.php) handles decompression for responses from the backend
    });

    // Request interceptor to add headers (matching mobile app exactly)
    this.client.interceptors.request.use(
      (config) => {
        // Set Content-Type header (matching mobile app)
        config.headers['Content-Type'] = 'application/json';
        
        // Note: Do NOT set Accept-Encoding header - browsers block this for security
        // Browsers automatically handle compression and set Accept-Encoding themselves
        // Axios also handles compression automatically
        
        // Add auth token if available (matching mobile app behavior)
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling (matching mobile app behavior)
    this.client.interceptors.response.use(
      (response) => {
        // Handle non-OK responses similar to mobile app
        if (response.status >= 200 && response.status < 300) {
          return response;
        }
        
        // Handle 401 Unauthorized (matching mobile app)
        if (response.status === 401) {
          localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
          window.location.href = '/login';
        }
        
        return Promise.reject(response);
      },
      (error: AxiosError) => {
        // Handle network errors and other axios errors
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
          console.error('[API Client] Network error:', error.message);
        }
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
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

