import axios, { AxiosInstance, AxiosError } from 'axios';

// Use EC2 URL for both development and production
// Can be overridden with VITE_API_URL environment variable
// Note: If site is on HTTPS, API must also be on HTTPS or use a proxy to avoid mixed content errors
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // Default API URL - ensure it matches the protocol of the current site
  // If your API supports HTTPS, change http:// to https://
  const defaultUrl = 'http://98.92.75.163:3000/api/v1';
  
  // If we're on HTTPS and API is HTTP, this will cause mixed content errors
  // Solution: Either use HTTPS for API or set up a proxy
  if (window.location.protocol === 'https:' && defaultUrl.startsWith('http:')) {
    console.warn('Mixed content warning: Site is HTTPS but API is HTTP. Consider using HTTPS for API or setting up a proxy.');
  }
  
  return defaultUrl;
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
        const token = localStorage.getItem('admin_token');
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
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
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

