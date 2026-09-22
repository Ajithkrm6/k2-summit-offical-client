"use client";

/**
 * Theme Provider Component
 * Initializes theme on client mount
 * Wraps application to provide theme context
 */

import { useEffect } from "react";
import { useThemeStore } from "@/stores/themeStore";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    // Initialize theme when component mounts
    initializeTheme();
  }, [initializeTheme]);

  return <>{children}</>;
}
