import axios from "axios";

/**
 * API Client
 *
 * Configured to communicate with .NET backend
 *
 * Features:
 * - Automatic token injection from localStorage
 * - 401 redirect to login on auth failure
 * - Configurable timeout
 *
 * Usage:
 * import { apiClient } from '@/lib/api-client'
 *
 * const { data } = await apiClient.get('/api/users')
 */
export const apiClient = axios.create({
  baseURL:
    "https://app-k2summit-api-poc-eastus-d3b5hzbkgaftfab5.eastus-01.azurewebsites.net/",
  timeout: 30000,
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        // Use router.push instead of window.location.href for Next.js
        const url = new URL("/login", window.location.origin);
        window.location.href = url.toString();
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
