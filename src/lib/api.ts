import axios, { AxiosInstance, AxiosError } from 'axios';
import { CONFIG } from './config';
import { endViewAs, viewAsTokenFor } from './viewAs';

// One source of truth for the API URL: VITE_API_URL, else lib/config/environment.ts.
const API_BASE_URL = CONFIG.API_BASE_URL;

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
        // Read-only "view as": that company's calls go out as the viewed user.
        const viewAs = viewAsTokenFor(config.url);
        if (viewAs) {
          config.headers.Authorization = `Bearer ${viewAs}`;
          (config as { _viewAs?: boolean })._viewAs = true;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling (matching mobile app behavior)
    this.client.interceptors.response.use(
      (response) => {
        // For blob responses, always return them (let the caller handle status codes)
        if (response.config.responseType === 'blob') {
          return response;
        }
        
        // Handle non-OK responses similar to mobile app
        if (response.status >= 200 && response.status < 300) {
          return response;
        }
        
        // Handle 401 Unauthorized (matching mobile app)
        if (response.status === 401 && (response.config as { _viewAs?: boolean })._viewAs) {
          // The view-as session expired: end it, keep the admin signed in.
          endViewAs();
        } else if (response.status === 401) {
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
        if (error.response?.status === 401 && (error.config as { _viewAs?: boolean } | undefined)?._viewAs) {
          endViewAs();
        } else if (error.response?.status === 401) {
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

