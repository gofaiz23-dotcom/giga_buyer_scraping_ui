"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { classNames } from "@/lib/format";
import { AlertIcon, CheckIcon, SparklesIcon } from "./Icons";

export type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastContextValue {
  push: (kind: ToastKind, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastKind, title: string, message?: string) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((prev) => [...prev, { id, kind, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <ToastView key={t.id} {...t} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({
  kind,
  title,
  message,
  onClose,
}: ToastItem & { onClose: () => void }) {
  useEffect(() => {
    // noop; auto dismiss handled in provider
  }, []);

  const palette: Record<ToastKind, { ring: string; bg: string; icon: ReactNode; text: string }> = {
    success: {
      ring: "ring-emerald-400/30",
      bg: "from-emerald-500/15 to-emerald-500/5",
      text: "text-emerald-100",
      icon: <CheckIcon className="h-4 w-4" />,
    },
    error: {
      ring: "ring-rose-400/30",
      bg: "from-rose-500/15 to-rose-500/5",
      text: "text-rose-100",
      icon: <AlertIcon className="h-4 w-4" />,
    },
    info: {
      ring: "ring-brand-400/30",
      bg: "from-brand-500/15 to-brand-500/5",
      text: "text-brand-100",
      icon: <SparklesIcon className="h-4 w-4" />,
    },
  };
  const p = palette[kind];

  return (
    <div
      className={classNames(
        "pointer-events-auto animate-slide-up overflow-hidden rounded-xl border border-white/10 bg-ink-900/90 p-3 shadow-xl backdrop-blur ring-1",
        p.ring,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={classNames("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-white/10", p.bg, p.text)}>
          {p.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">{title}</div>
          {message ? (
            <div className="mt-0.5 break-words text-xs text-slate-300">{message}</div>
          ) : null}
        </div>
        <button
          onClick={onClose}
          type="button"
          className="text-slate-400 hover:text-white"
          aria-label="Dismiss"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
