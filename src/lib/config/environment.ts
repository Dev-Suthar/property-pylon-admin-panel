/**
 * Environment Configuration
 * Handles different environment settings (development, staging, production)
 */

export type Environment = "development" | "staging" | "production";

export interface EnvironmentConfig {
  TIMEOUT: number;
  DEBUG: boolean;
  LOG_LEVEL: "debug" | "info" | "warn" | "error";
}

const developmentConfig: EnvironmentConfig = {
  TIMEOUT: 30000, // 30 seconds
  DEBUG: true,
  LOG_LEVEL: "debug",
};

const stagingConfig: EnvironmentConfig = {
  TIMEOUT: 30000, // 30 seconds
  DEBUG: true,
  LOG_LEVEL: "info",
};

const productionConfig: EnvironmentConfig = {
  TIMEOUT: 30000, // 30 seconds
  DEBUG: false,
  LOG_LEVEL: "error",
};

/**
 * Get current environment
 */
export const getEnvironment = (): Environment => {
  // Check Vite environment mode
  if (import.meta.env.MODE === "development") {
    return "development";
  }

  if (import.meta.env.MODE === "staging") {
    return "staging";
  }

  // Default to production
  return "production";
};

/**
 * Get environment-specific configuration
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = getEnvironment();

  switch (env) {
    case "development":
      return developmentConfig;
    case "staging":
      return stagingConfig;
    case "production":
      return productionConfig;
    default:
      return developmentConfig;
  }
};

/**
 * Get API base URL based on environment
 */
export const getApiBaseUrl = (): string => {
  // Check if VITE_API_URL is explicitly set
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  const env = getEnvironment();

  // Development URLs
  if (env === "development") {
    return "http://98.92.75.163:3000/api/v1";
  }

  // Staging URL
  if (env === "staging") {
    return "http://98.92.75.163:3000/api/v1";
  }

  // Production URL
  return "http://98.92.75.163:3000/api/v1";
};
