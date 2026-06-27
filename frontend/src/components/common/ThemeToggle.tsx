"use client";
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by waiting for mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-12 h-12 rounded-2xl bg-blue-600/5 border border-blue-500/10" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-bg-muted border border-border-base transition-all hover:border-blue-500 hover:bg-blue-600/10 group shadow-lg"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Moon className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
      ) : (
        <Sun className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
}
