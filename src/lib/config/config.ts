/**
 * Application Configuration
 * Centralized configuration for the entire application
 */

import { getApiBaseUrl, getEnvironmentConfig, getGoogleMapsApiKey } from './environment';

const envConfig = getEnvironmentConfig();

export const CONFIG = {
  APP_NAME: 'DreamToBuy',
  APP_VERSION: '1.0.0',
  API_BASE_URL: getApiBaseUrl(),
  API_VERSION: 'v1',
  TIMEOUT: envConfig.TIMEOUT,
  DEBUG: envConfig.DEBUG,
  LOG_LEVEL: envConfig.LOG_LEVEL,
  GOOGLE_MAPS_API_KEY: getGoogleMapsApiKey(),
  STORAGE_KEYS: {
    AUTH_TOKEN: 'admin_token',
    USER_DATA: 'admin_user',
    COMPANY_ID: 'companyId',
    REFRESH_TOKEN: 'refreshToken',
  },
  USER_ROLES: {
    ADMIN: 'admin',
    AGENT: 'agent',
    MANAGER: 'manager',
    CUSTOMER: 'customer',
  },
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
} as const;

// Export types for better TypeScript support
export type StorageKey = typeof CONFIG.STORAGE_KEYS[keyof typeof CONFIG.STORAGE_KEYS];
export type UserRole = typeof CONFIG.USER_ROLES[keyof typeof CONFIG.USER_ROLES];

