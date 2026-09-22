/**
 * Users Hooks Wrapper
 * Wraps generated API hooks for user management operations
 *
 * NOTE: The current K2 Tax API does not expose GET endpoints for users.
 * Only user creation and authentication endpoints are available.
 * This file is a placeholder for future user management hooks.
 */

"use client";

import { usePostApiV1User } from "@/lib/api/generated/k2-tax-api";
import type { CreateAppUserRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import type { AxiosError } from "axios";

/**
 * Custom hook to create a new user (signup)
 *
 * @example
 * const { createUser, isLoading } = useCreateUser();
 * createUser({ email: 'user@example.com', password: 'password', name: 'John' });
 */
export const useCreateUser = () => {
  const { mutate, ...rest } = usePostApiV1User({
    mutation: {
      onSuccess: () => {
        console.log("User created successfully");
      },
      onError: (error: AxiosError) => {
        console.error("Failed to create user:", error);
      },
    },
  });

  return {
    createUser: (data: CreateAppUserRequest) => mutate({ data }),
    ...rest,
  };
};

/**
 * Placeholder for future user fetching functionality
 *
 * NOTE: GET endpoints for users are not currently available in the K2 Tax API.
 * Consider adding:
 * - useGetAllUsers() - fetch all users with pagination
 * - useGetUserById() - fetch a single user by ID
 * - useGetCurrentUser() - fetch current authenticated user profile
 *
 * These would require API endpoints to be implemented:
 * - GET /api/v1/Users
 * - GET /api/v1/Users/{id}
 * - GET /api/v1/Users/me
 */
export const userHooksPlaceholder = () => {
  console.warn(
    "User fetch hooks are not yet available. " +
      "The K2 Tax API does not currently expose GET endpoints for users.",
  );
};
