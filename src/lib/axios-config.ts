/**
 * Global Axios Configuration
 *
 * This ensures ALL axios instances (including Orval-generated ones)
 * use the correct base URL and settings from the environment
 */
import axios from "axios";

// Set defaults for all axios instances
axios.defaults.baseURL = "";
axios.defaults.timeout = 30000;
axios.defaults.withCredentials = true;

// Request interceptor: Log API calls to browser console
axios.interceptors.request.use((config) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend.api";
  // This is just for logging what URL will be called
  // The actual route handler at /api/[...path] will handle the forwarding
  console.log(
    `[API CALL] Browser calls: ${config.url} (hits route handler at same domain)`,
  );
  return config;
});

// Response interceptor: Handle 401 (unauthenticated)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const url = new URL("/login", window.location.origin);
        window.location.href = url.toString();
      }
    }
    return Promise.reject(error);
  },
);

export default axios;
