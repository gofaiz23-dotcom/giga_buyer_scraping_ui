import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "@/lib/format";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ className, children, padded = true, ...rest }: CardProps) {
  return (
    <div
      className={classNames(
        "card animate-slide-up",
        padded && "p-5 md:p-6",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  right?: ReactNode;
}

export function SectionHeader({ title, description, icon, right }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/25 to-accent-500/25 text-brand-200 ring-1 ring-white/10">
            {icon}
          </div>
        ) : null}
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-slate-400">{description}</p>
          ) : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "brand" | "accent" | "emerald" | "slate";
}

const toneStyles: Record<NonNullable<StatTileProps["tone"]>, string> = {
  brand: "from-brand-500/20 to-brand-500/5 text-brand-200",
  accent: "from-accent-500/20 to-accent-500/5 text-accent-400",
  emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-200",
  slate: "from-slate-500/20 to-slate-500/5 text-slate-200",
};

export function StatTile({ label, value, icon, tone = "brand" }: StatTileProps) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        {icon ? (
          <div
            className={classNames(
              "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10",
              toneStyles[tone],
            )}
          >
            {icon}
          </div>
        ) : null}
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400">
            {label}
          </div>
          <div className="mt-0.5 text-2xl font-semibold text-white tabular-nums">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}
