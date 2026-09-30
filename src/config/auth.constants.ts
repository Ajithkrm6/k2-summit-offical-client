/**
 * Authentication Constants
 *
 * Centralized authentication configuration used across the application:
 * - proxy.ts (request-time protection)
 * - Client-side auth state management
 * - Route access configuration
 */

/**
 * Backend authentication cookie name
 * Set by K2 backend after successful login
 * HttpOnly and Secure for security
 */
export const AUTH_COOKIE_NAME = "K2Tax.Authentication";

/**
 * Routes accessible to anyone (no authentication required)
 */
export const PUBLIC_ROUTES = ["/", "/api"];

/**
 * Authentication routes - accessible to both authenticated and unauthenticated users
 *
 * Authenticated users accessing these pages are redirected to /dashboard
 * (Prevents logged-in users from seeing login page)
 */
export const AUTH_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset",
  "/reset-password",
  "/signup",
];

/**
 * Default redirect path after successful login
 */
export const DEFAULT_POST_LOGIN_REDIRECT = "/dashboard";

/**
 * Endpoint paths for authentication
 * Used by useAuth hooks and API client
 */
export const AUTH_ENDPOINTS = {
  login: "/api/v1/User/login",
  logout: "/api/v1/User/logout",
  forgotPassword: "/api/v1/User/forgot-password",
  resetPassword: "/api/v1/User/reset-password",
} as const;
