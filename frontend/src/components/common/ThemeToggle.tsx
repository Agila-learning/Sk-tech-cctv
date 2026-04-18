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
      className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/30 transition-all hover:bg-blue-600 hover:text-white group shadow-lg shadow-blue-500/10"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6 overflow-hidden">
        <motion.div
           animate={{ y: isDark ? 0 : -30 }}
           transition={{ type: "spring", stiffness: 300, damping: 20 }}
           className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
        >
           <Moon className="h-5 w-5 text-blue-500 group-hover:text-white" />
           <Sun className="h-5 w-5 text-amber-500 group-hover:text-white" />
        </motion.div>
      </div>
    </button>
  );
}
