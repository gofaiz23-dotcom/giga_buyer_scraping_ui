"use client";

import { useEffect, useState } from "react";
import { classNames } from "@/lib/format";
import { MoonIcon, SunIcon, SystemIcon } from "../ui/Icons";
import { useTheme, type ThemePref } from "./ThemeProvider";

/**
 * Animated sun/moon toggle for the navbar.
 * The first render (SSR + initial client pass) uses a neutral label and
 * base classes, so server and client markup match. After mount we flip to
 * the theme-aware variant — this prevents hydration mismatches.
 */
export function ThemeToggle() {
  const { resolved, theme, toggle, setTheme, mounted } = useTheme();

  const isDark = resolved === "dark";
  // Until mounted, render a stable placeholder label to avoid hydration diffs.
  const label = mounted
    ? `Switch to ${isDark ? "light" : "dark"} mode`
    : "Toggle theme";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className={classNames(
          "group relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border transition-all",
          "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08] hover:border-white/[0.14]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60",
        )}
      >
        {/* Sun */}
        <SunIcon
          className={classNames(
            "absolute h-4 w-4 text-amber-300 transition-all duration-300 ease-out",
            mounted && isDark
              ? "-rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100",
          )}
        />
        {/* Moon */}
        <MoonIcon
          className={classNames(
            "absolute h-4 w-4 text-brand-200 transition-all duration-300 ease-out",
            mounted && isDark
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0",
          )}
        />

        {/* Glow ring — only applied after mount so SSR/client markup match */}
        <span
          aria-hidden
          className={classNames(
            "pointer-events-none absolute inset-0 rounded-xl transition-opacity",
            mounted && isDark
              ? "opacity-100 shadow-[inset_0_0_0_1px_rgba(99,130,255,0.25)]"
              : "opacity-0",
          )}
        />
      </button>

      <ThemeMenu current={theme} onPick={setTheme} mounted={mounted} />
    </div>
  );
}

function ThemeMenu({
  current,
  onPick,
  mounted,
}: {
  current: ThemePref;
  onPick: (t: ThemePref) => void;
  mounted: boolean;
}) {
  const [open, setOpen] = useState(false);
  const activeLight = mounted && current === "light";
  const activeDark = mounted && current === "dark";
  const activeSystem = mounted && current === "system";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-theme-menu]")) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" data-theme-menu>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme options"
        title="Theme options"
        className={classNames(
          "inline-flex h-9 w-7 items-center justify-center rounded-lg border transition-all",
          "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white",
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-40 animate-fade-in overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 p-1 shadow-xl backdrop-blur ring-1 ring-white/5"
        >
          <MenuRow
            active={activeLight}
            icon={<SunIcon />}
            label="Light"
            onClick={() => {
              onPick("light");
              setOpen(false);
            }}
          />
          <MenuRow
            active={activeDark}
            icon={<MoonIcon />}
            label="Dark"
            onClick={() => {
              onPick("dark");
              setOpen(false);
            }}
          />
          <MenuRow
            active={activeSystem}
            icon={<SystemIcon />}
            label="System"
            onClick={() => {
              onPick("system");
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuRow({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={classNames(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
        active
          ? "bg-gradient-to-r from-brand-500/25 to-accent-500/15 text-white"
          : "text-slate-200 hover:bg-white/[0.06]",
      )}
    >
      <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      <span className="flex-1">{label}</span>
      {active ? (
        <span className="text-[10px] uppercase tracking-wider text-brand-200">
          On
        </span>
      ) : null}
    </button>
  );
}
