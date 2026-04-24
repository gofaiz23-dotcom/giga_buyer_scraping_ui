"use client";

import type { ReactNode } from "react";
import { classNames } from "@/lib/format";
import { ActivityIcon, CloudIcon, PlayIcon, SparklesIcon } from "./ui/Icons";
import { ThemeToggle } from "./theme/ThemeToggle";

export type TabKey = "start" | "status" | "buckets";

export interface NavItem {
  key: TabKey;
  label: string;
  description: string;
  icon: ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: "start",
    label: "Start",
    description: "Kick off a products scrape run",
    icon: <PlayIcon />,
  },
  {
    key: "status",
    label: "Status",
    description: "Live parent / category / subcategory progress",
    icon: <ActivityIcon />,
  },
  {
    key: "buckets",
    label: "Buckets",
    description: "Browse S3 output and download zips",
    icon: <CloudIcon />,
  },
];

interface NavbarProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

export function Navbar({ active, onChange }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-6 md:px-8">
        <Brand />

        <nav className="flex-1">
          <ul
            role="tablist"
            className="glass relative flex items-center gap-1 rounded-xl p-1"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === active;
              return (
                <li key={item.key} className="flex-1 md:flex-none">
                  <button
                    role="tab"
                    aria-selected={isActive}
                    type="button"
                    onClick={() => onChange(item.key)}
                    className={classNames(
                      "group relative flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r from-brand-500/25 to-accent-500/20 text-white shadow-[inset_0_0_0_1px_rgba(99,130,255,0.35)]"
                        : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
                    )}
                  >
                    <span
                      className={classNames(
                        "shrink-0 [&_svg]:h-4 [&_svg]:w-4",
                        isActive ? "text-brand-200" : "text-slate-400 group-hover:text-slate-200",
                      )}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <StatusPill />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow">
        <SparklesIcon className="h-5 w-5 text-white" />
      </div>
      <div className="leading-tight">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          GigaBuyer
        </div>
        <div className="text-sm font-semibold text-white">Control Center</div>
      </div>
    </div>
  );
}

function StatusPill() {
  return (
    <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 md:flex">
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      API connected
    </div>
  );
}
