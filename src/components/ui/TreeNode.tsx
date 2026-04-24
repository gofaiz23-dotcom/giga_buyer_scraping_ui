"use client";

import { useState, type ReactNode } from "react";
import { classNames } from "@/lib/format";
import { ChevronDownIcon, ChevronRightIcon } from "./Icons";

interface TreeNodeProps {
  icon?: ReactNode;
  label: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  depth?: number;
  children?: ReactNode;
  leaf?: boolean;
  highlight?: boolean;
}

export function TreeNode({
  icon,
  label,
  meta,
  actions,
  badge,
  defaultOpen = false,
  depth = 0,
  children,
  leaf = false,
  highlight = false,
}: TreeNodeProps) {
  const [open, setOpen] = useState(defaultOpen);

  const indent = depth * 18;

  return (
    <div className="group/tree">
      <div
        className={classNames(
          "relative flex items-center gap-2 rounded-lg px-2 py-2 transition-colors",
          "hover:bg-white/[0.04]",
          highlight && "bg-white/[0.03]",
        )}
        style={{ paddingLeft: indent + 8 }}
      >
        {/* Guide line */}
        {depth > 0 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-white/5"
            style={{ left: indent - 9 }}
          />
        ) : null}

        <button
          type="button"
          onClick={() => !leaf && setOpen((v) => !v)}
          className={classNames(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded",
            leaf
              ? "text-transparent"
              : "text-slate-400 hover:text-white hover:bg-white/[0.06]",
          )}
          aria-label={open ? "Collapse" : "Expand"}
        >
          {leaf ? (
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          ) : open ? (
            <ChevronDownIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronRightIcon className="h-3.5 w-3.5" />
          )}
        </button>

        {icon ? (
          <span className="shrink-0 text-slate-300 [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm text-slate-100">{label}</div>
            {badge}
          </div>
          {meta ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
              {meta}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-1 opacity-70 transition-opacity group-hover/tree:opacity-100">
            {actions}
          </div>
        ) : null}
      </div>

      {!leaf && open ? (
        <div className="relative">
          {children}
        </div>
      ) : null}
    </div>
  );
}
