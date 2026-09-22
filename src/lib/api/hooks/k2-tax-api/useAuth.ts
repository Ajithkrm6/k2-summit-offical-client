/**
 * Authentication Hooks Wrapper
 * Bridges Orval-generated API hooks with Zustand store
 *
 * Responsibilities:
 * - Handle API calls via Orval hooks
 * - Update auth store with results
 * - Handle errors and user feedback
 * - Manage navigation on auth changes
 */

"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  usePostApiV1UserLogin,
  usePostApiV1UserLogOut,
  usePostApiV1UserForgotPassword,
  usePostApiV1UserResetPassword,
} from "@/lib/api/generated/k2-tax-api";
import type {
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import type { AxiosError } from "axios";

/**
 * Actual API response structure for login
 * (matches backend response, not Swagger definition)
 */
interface ActualLoginResponse {
  success?: boolean;
  appUserId?: string;
  staffUserId?: string;
  token?: string | null;
}

/**
 * Helper to extract error message from API response
 */
const getErrorMessage = (error: AxiosError, defaultMessage: string): string => {
  if (error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    if (data.error && typeof data.error === "object") {
      const errorObj = data.error as Record<string, unknown>;
      if (typeof errorObj.message === "string") {
        return errorObj.message;
      }
    }
  }
  return defaultMessage;
};

/**
 * Custom login hook
 * - Manages login API call
 * - Updates auth store with user data
 * - Handles loading/error states
 * - Redirects to dashboard on success
 */
export const useLogin = () => {
  const router = useRouter();
  const { setUser, setError, setLoading } = useAuthStore();

  const { mutate, ...rest } = usePostApiV1UserLogin({
    mutation: {
      onMutate: () => {
        // Clear previous errors and set loading
        setError(null);
        setLoading(true);
      },
      onSuccess: (data) => {
        // Handle successful login
        const loginData = (data.data?.value ||
          data.data) as ActualLoginResponse;

        if (loginData?.appUserId) {
          // Update auth store with user info
          // Token is automatically handled via httpOnly cookie by backend
          setUser({
            id: loginData.appUserId || loginData.staffUserId || "unknown",
            email: "", // Email not provided in response
            name: "", // Name not provided in response
            role: "user", // Default role, update if staffUserId is present
          });

          // Redirect to dashboard
          router.push("/dashboard");
        } else {
          // Login failed - API returned error response
          const errorMsg = "Login failed. Please check your credentials.";
          setError(errorMsg);
        }
      },
      onError: (error: AxiosError) => {
        const errorMessage = getErrorMessage(
          error,
          "Login failed. Please check your credentials.",
        );
        setError(errorMessage);
        console.error("Login failed:", error);
      },
      onSettled: () => {
        // Clear loading state
        setLoading(false);
      },
    },
  });

  return {
    login: (credentials: LoginRequest) => mutate({ data: credentials }),
    ...rest,
  };
};

/**
 * Custom logout hook
 * - Manages logout API call
 * - Clears auth store
 * - Cleans up backend session
 * - Redirects to login
 */
export const useLogout = () => {
  const router = useRouter();
  const { reset, setError, setLoading } = useAuthStore();

  const { mutate, ...rest } = usePostApiV1UserLogOut({
    mutation: {
      onMutate: () => {
        setLoading(true);
        setError(null);
      },
      onSuccess: () => {
        // Clear auth state in store
        reset();

        // httpOnly cookie is cleared automatically by backend
        // Redirect to login
        router.push("/auth/login");
      },
      onError: (error: AxiosError) => {
        // Even if logout fails, clear local state
        reset();

        const errorMessage = getErrorMessage(error, "Logout failed");
        setError(errorMessage);
        console.error("Logout failed:", error);
      },
      onSettled: () => {
        setLoading(false);
      },
    },
  });

  return {
    logout: () => mutate(),
    ...rest,
  };
};

/**
 * Forgot password hook
 * - Sends password reset email
 * - Manages loading/error states
 */
export const useForgotPassword = () => {
  const { setError, setLoading, clearError } = useAuthStore();

  const { mutate, ...rest } = usePostApiV1UserForgotPassword({
    mutation: {
      onMutate: () => {
        setLoading(true);
        clearError();
      },
      onSuccess: () => {
        console.log("Password reset email sent successfully");
      },
      onError: (error: AxiosError) => {
        const errorMessage = getErrorMessage(
          error,
          "Failed to send password reset email",
        );
        setError(errorMessage);
        console.error("Forgot password failed:", error);
      },
      onSettled: () => {
        setLoading(false);
      },
    },
  });

  return {
    sendResetEmail: (data: ForgotPasswordRequest) => mutate({ data }),
    ...rest,
  };
};

/**
 * Reset password hook
 * - Resets password with token
 * - Manages loading/error states
 * - Redirects to login on success
 */
export const useResetPassword = () => {
  const router = useRouter();
  const { setError, setLoading, clearError } = useAuthStore();

  const { mutate, ...rest } = usePostApiV1UserResetPassword({
    mutation: {
      onMutate: () => {
        setLoading(true);
        clearError();
      },
      onSuccess: () => {
        console.log("Password reset successful");
        // Redirect to login after short delay
        setTimeout(() => router.push("/auth/login"), 1500);
      },
      onError: (error: AxiosError) => {
        const errorMessage = getErrorMessage(error, "Password reset failed");
        setError(errorMessage);
        console.error("Password reset failed:", error);
      },
      onSettled: () => {
        setLoading(false);
      },
    },
  });

  return {
    resetPassword: (data: ResetPasswordRequest) => mutate({ data }),
    ...rest,
  };
};
