"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" storageKey="infradash-codex7-theme" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
