"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemePref;
  resolved: ResolvedTheme;
  setTheme: (t: ThemePref) => void;
  toggle: () => void;
  /** `true` only after the first client-side mount (post-hydration). */
  mounted: boolean;
}

const STORAGE_KEY = "gigabuyer-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

function readSystem(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function readStored(): ThemePref {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // ignore
  }
  return "system";
}

function applyClass(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  // data attribute as well (useful for CSS attribute selectors)
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Important: use *static* defaults here so server and client render the
  // same markup on first pass. The pre-paint script in <head> already
  // applied the correct `dark` / `light` class to <html>, so visuals are
  // already correct even though this React state is briefly stale.
  // We sync to real values in useEffect below (after hydration).
  const [theme, setThemeState] = useState<ThemePref>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("dark");
  const [mounted, setMounted] = useState(false);

  const resolved: ResolvedTheme = theme === "system" ? systemTheme : theme;

  // Post-hydration: pull the real preference from storage + OS.
  useEffect(() => {
    setThemeState(readStored());
    setSystemTheme(readSystem());
    setMounted(true);
  }, []);

  // Keep the <html> class in sync with React state, but only after mount
  // so we don't step on the pre-paint script during hydration.
  useEffect(() => {
    if (!mounted) return;
    applyClass(resolved);
  }, [resolved, mounted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "light" : "dark");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, toggle, mounted }),
    [theme, resolved, setTheme, toggle, mounted],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Runs synchronously in <head> before React hydrates, so there's no FOUC.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var resolved;
    if (stored === 'light' || stored === 'dark') {
      resolved = stored;
    } else {
      resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    var root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.classList.toggle('light', resolved === 'light');
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
  } catch (e) {
    document.documentElement.classList.add('dark');
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;
