import axios from "axios";

/**
 * API Client
 *
 * Configured to communicate with .NET backend
 *
 * Features:
 * - httpOnly cookie authentication (managed by backend)
 * - 401 redirect to login on auth failure
 * - Configurable timeout
 * - Automatic cookie inclusion in all requests
 *
 * Note: Authentication tokens are managed via httpOnly cookies set by the backend.
 * No manual token storage or injection required.
 *
 * Usage:
 * import { apiClient } from '@/lib/api-client'
 * const { data } = await apiClient.get('/api/users')
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  // Enable automatic cookie inclusion in all requests (for httpOnly cookies)
  withCredentials: true,
});

// Response interceptor: Handle 401 (unauthenticated)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Redirect to login on authentication failure
        // httpOnly cookies will be automatically cleared by backend
        const url = new URL("/auth/login", window.location.origin);
        window.location.href = url.toString();
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
