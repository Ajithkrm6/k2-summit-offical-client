/**
 * useReturnTo Hook
 *
 * Manages redirect after successful login
 *
 * Usage:
 * const { returnTo, isReturningFromAuth } = useReturnTo();
 *
 * - returnTo: URL to redirect to after login (from URL search param)
 * - isReturningFromAuth: true if redirected here by proxy.ts
 */

"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const DEFAULT_POST_LOGIN_REDIRECT = "/dashboard";

export const useReturnTo = () => {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const returnTo = searchParams.get("returnTo");
    const isReturningFromAuth = !!returnTo;

    // Validate returnTo to prevent open redirects
    // Only allow internal paths starting with /
    const validReturnTo =
      returnTo && returnTo.startsWith("/") && !returnTo.includes("//")
        ? returnTo
        : DEFAULT_POST_LOGIN_REDIRECT;

    return {
      returnTo: validReturnTo,
      isReturningFromAuth,
    };
  }, [searchParams]);
};

/**
 * useRedirectIfAuthenticated Hook
 *
 * Redirects authenticated users away from auth pages
 *
 * Usage in login page:
 * const router = useRouter();
 * useRedirectIfAuthenticated(router);
 *
 * If user is already authenticated, immediately redirects to /dashboard
 */

import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useEffect } from "react";

export const useRedirectIfAuthenticated = (
  router: AppRouterInstance,
  redirectTo: string = DEFAULT_POST_LOGIN_REDIRECT,
) => {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // If user is authenticated and we're on an auth page, redirect to dashboard
    if (isAuthenticated && user) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, user, router, redirectTo]);
};
