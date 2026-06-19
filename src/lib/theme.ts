"use client";

const THEME_KEY = "cargosafe-theme";

export type Theme = "dark" | "light";

/** Read stored theme or default to dark */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(THEME_KEY) as Theme) || "dark";
}

/** Save theme preference */
export function setStoredTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

/** Apply theme by toggling the `data-theme` attribute on <html> */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/** Toggle between light and dark */
export function toggleTheme(): Theme {
  const current = getStoredTheme();
  const next: Theme = current === "dark" ? "light" : "dark";
  setStoredTheme(next);
  return next;
}
