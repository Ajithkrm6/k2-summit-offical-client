"use client";

/**
 * Theme Toggle Component
 * Button to switch between light and dark modes
 * Shows current theme and toggles on click
 */

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
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
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9"
          aria-label="Toggle theme"
        >
          {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
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
