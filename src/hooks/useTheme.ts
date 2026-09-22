"use client";

/**
 * useTheme Hook
 * Provides easy access to theme state and methods
 * Use in client components to access theme functionality
 */

import { useThemeStore } from "@/stores/themeStore";

export function useTheme() {
  const { mode, isDark, setMode, toggleTheme, initializeTheme } =
    useThemeStore();

  return {
    mode,
    isDark,
    setMode,
    toggleTheme,
    initializeTheme,
  };
}
