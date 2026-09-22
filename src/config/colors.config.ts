/**
 * K2 Color Palette Configuration
 * Defines brand colors for light and dark modes
 */

export const colorPalette = {
  primary: {
    light: {
      base: "#33538F", // K2 Blue
      hover: "#254069",
      active: "#1a2d47",
    },
    dark: {
      base: "#1e40af", // Darker K2 Blue
      hover: "#1e3a8a",
      active: "#172554",
    },
  },
  secondary: {
    light: {
      base: "#6366f1", // Indigo
      hover: "#4f46e5",
      active: "#4338ca",
    },
    dark: {
      base: "#4f46e5",
      hover: "#4338ca",
      active: "#3730a3",
    },
  },
  error: {
    light: {
      base: "#dc2626", // Red
      hover: "#b91c1c",
      active: "#991b1b",
    },
    dark: {
      base: "#ef4444",
      hover: "#dc2626",
      active: "#b91c1c",
    },
  },
  success: {
    light: {
      base: "#16a34a", // Green
      hover: "#15803d",
      active: "#166534",
    },
    dark: {
      base: "#22c55e",
      hover: "#16a34a",
      active: "#15803d",
    },
  },
  warning: {
    light: {
      base: "#d97706", // Amber
      hover: "#b45309",
      active: "#92400e",
    },
    dark: {
      base: "#f59e0b",
      hover: "#d97706",
      active: "#b45309",
    },
  },
  info: {
    light: {
      base: "#0891b2", // Cyan
      hover: "#0e7490",
      active: "#164e63",
    },
    dark: {
      base: "#06b6d4",
      hover: "#0891b2",
      active: "#0e7490",
    },
  },
};

/**
 * Neutral colors (same for light and dark modes, just inverted backgrounds)
 */
export const neutrals = {
  light: {
    background: "#ffffff",
    foreground: "#000000",
    card: "#ffffff",
    popover: "#ffffff",
    muted: "#f3f4f6",
    mutedForeground: "#6b7280",
    border: "#e5e7eb",
    input: "#e5e7eb",
    ring: "#33538F",
  },
  dark: {
    background: "#0f172a", // Very dark slate
    foreground: "#f8fafc",
    card: "#1e293b", // Slate 900
    popover: "#1e293b",
    muted: "#334155", // Slate 700
    mutedForeground: "#cbd5e1",
    border: "#334155",
    input: "#334155",
    ring: "#1e40af",
  },
};
