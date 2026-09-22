/**
 * Theme Store - Zustand
 * Manages theme state (light/dark) with localStorage persistence
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

/**
 * Detect system preference for dark mode
 */
const getSystemThemePreference = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/**
 * Determine if dark mode should be active based on mode setting
 */
const isDarkMode = (mode: ThemeMode): boolean => {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return getSystemThemePreference();
};

/**
 * Theme store
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "system",
      isDark: false,

      /**
       * Set theme mode and update DOM
       */
      setMode: (mode: ThemeMode) => {
        set({ mode });
        const isDark = isDarkMode(mode);
        set({ isDark });

        // Update HTML class and CSS variables
        if (typeof window !== "undefined") {
          const html = document.documentElement;
          if (isDark) {
            html.classList.add("dark");
          } else {
            html.classList.remove("dark");
          }
        }
      },

      /**
       * Toggle between light and dark mode
       */
      toggleTheme: () => {
        const { mode } = get();
        const newMode: ThemeMode = mode === "light" ? "dark" : "light";
        get().setMode(newMode);
      },

      /**
       * Initialize theme from localStorage and system preference
       */
      initializeTheme: () => {
        const { mode, setMode } = get();
        setMode(mode);

        // Listen for system theme changes
        if (typeof window !== "undefined" && mode === "system") {
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
          const handleChange = () => {
            const isDark = isDarkMode("system");
            set({ isDark });

            const html = document.documentElement;
            if (isDark) {
              html.classList.add("dark");
            } else {
              html.classList.remove("dark");
            }
          };

          mediaQuery.addEventListener("change", handleChange);
          return () => mediaQuery.removeEventListener("change", handleChange);
        }
      },
    }),
    {
      name: "theme-storage", // localStorage key
      partialize: (state) => ({ mode: state.mode }), // Only persist mode, not isDark
    },
  ),
);
