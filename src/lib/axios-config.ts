/**
 * Global Axios Configuration
 *
 * This ensures ALL axios instances (including Orval-generated ones)
 * use the correct base URL and settings from the environment
 */
import axios from "axios";

// Set defaults for all axios instances
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL;
axios.defaults.timeout = 30000;
axios.defaults.withCredentials = true;

// Response interceptor: Handle 401 (unauthenticated)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const url = new URL("/auth/login", window.location.origin);
        window.location.href = url.toString();
      }
    }
    return Promise.reject(error);
  },
);

export default axios;
