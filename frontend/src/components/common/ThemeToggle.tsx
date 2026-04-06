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
    return <div className="w-10 h-10 rounded-2xl bg-bg-muted animate-pulse" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-bg-surface border border-border-base transition-all hover:border-blue-500/50 hover:bg-bg-muted group"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6 overflow-hidden">
        <motion.div
           animate={{ y: isDark ? 0 : -30 }}
           transition={{ type: "spring", stiffness: 300, damping: 20 }}
           className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
        >
           <Moon className="h-6 w-6 text-blue-500" />
           <Sun className="h-6 w-6 text-amber-500" />
        </motion.div>
      </div>
    </button>
  );
}
