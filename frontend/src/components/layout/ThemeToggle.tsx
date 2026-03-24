"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-3 bg-bg-muted hover:bg-bg-surface text-fg-primary rounded-xl transition-all relative group border border-border-base"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-400 group-hover:scale-110 transition-transform" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
}
