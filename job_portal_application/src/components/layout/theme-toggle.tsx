"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon-sm"
        className="rounded-xl border-2 border-black dark:border-white/50 opacity-70"
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className="rounded-xl border-2 border-black dark:border-white/50 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-neo-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-foreground" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
