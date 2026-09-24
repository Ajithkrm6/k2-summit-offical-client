"use client";

/**
 * Theme Toggle Component
 * Button to switch between light and dark modes
 * Shows current theme and toggles on click
 */

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  //   DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { mode, setMode, isDark } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-9 h-9"
        aria-label="Toggle theme"
      >
        {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuCheckboxItem
          checked={mode === "light"}
          onCheckedChange={() => setMode("light")}
        >
          <Sun className="w-4 h-4 mr-2" />
          Light
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={mode === "dark"}
          onCheckedChange={() => setMode("dark")}
        >
          <Moon className="w-4 h-4 mr-2" />
          Dark
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={mode === "system"}
          onCheckedChange={() => setMode("system")}
        >
          <div className="w-4 h-4 mr-2">⚙️</div>
          System
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
