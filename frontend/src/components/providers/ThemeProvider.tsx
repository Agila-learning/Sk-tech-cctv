"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderPrSystems } from "next-themes";

export function ThemeProvider({ children, ...prSystems }: ThemeProviderPrSystems) {
  return <NextThemesProvider {...prSystems}>{children}</NextThemesProvider>;
}
