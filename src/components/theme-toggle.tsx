"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-full py-1.5 bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground rounded text-[10px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-3 w-3" />
          Switch to Light Mode
        </>
      ) : (
        <>
          <Moon className="h-3 w-3" />
          Switch to Dark Mode
        </>
      )}
    </button>
  );
}
