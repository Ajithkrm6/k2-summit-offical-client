/**
 * Auth Store
 * Zustand store for managing authentication state
 * Uses Immer for immutable state updates
 *
 * State managed here:
 * - user: Current authenticated user
 * - isAuthenticated: Whether user is logged in
 * - isLoading: API call in progress
 * - error: Last error message
 *
 * Note: Authentication token stored in httpOnly cookie by backend
 *
 * @example
 * const { user, isAuthenticated, setUser, setError } = useAuthStore()
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  avatar?: string;
}

interface AuthState {
  // ===== STATE =====
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // ===== SETTERS =====
  setUser: (user: AuthUser) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;

  // ===== ACTIONS =====
  reset: () => void;
  clearError: () => void;

  // ===== INITIALIZATION =====
  /**
   * Called on app init to restore user from backend if authenticated
   * Should be called in a useEffect on app mount
   */
  initialize: () => Promise<void>;
}

/**
 * Custom auth store with Zustand + Immer
 * Automatically enables draft mode for immutable updates
 */
export const useAuthStore = create<AuthState>()(
  immer((set) => ({
    // ===== INITIAL STATE =====
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // ===== SETTERS =====
    /**
     * Set the current user and mark as authenticated
     */
    setUser: (user: AuthUser) => {
      set((state) => {
        state.user = user;
        state.isAuthenticated = true;
        state.error = null;
      });
    },

    /**
     * Set loading state for API calls
     */
    setLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    /**
     * Set error message
     */
    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },

    /**
     * Set authentication status
     */
    setAuthenticated: (authenticated: boolean) => {
      set((state) => {
        state.isAuthenticated = authenticated;
      });
    },

    // ===== ACTIONS =====
    /**
     * Reset all auth state
     * Called on logout or when auth fails
     */
    reset: () => {
      set((state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;
        // httpOnly cookie is cleared by backend
      });
    },

    /**
     * Clear only the error message
     */
    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },

    // ===== INITIALIZATION =====
    /**
     * Initialize auth on app load
     * - Checks if user is still authenticated
     * - Validates session with backend
     * - Restores user data if available
     *
     * Called in useEffect on app mount
     */
    initialize: async () => {
      set((state) => {
        state.isLoading = true;
      });

      try {
        // TODO: Call API to validate session and get user profile
        // const response = await apiClient.get('/api/v1/User/Profile')
        // if (response.data?.value) {
        //   set user data
        // }

        // For now, if httpOnly cookie exists, user should be authenticated
        // This will be verified by backend on first API call
        set((state) => {
          state.isLoading = false;
        });
      } catch (error) {
        // Clear auth if session is invalid
        set((state) => {
          state.isAuthenticated = false;
          state.user = null;
          state.error =
            error instanceof Error ? error.message : "Failed to verify session";
          state.isLoading = false;
        });
      }
    },
  })),
);

export default useAuthStore;
