import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-200 ring-1 ring-white/10">
          <span className="[&_svg]:h-6 [&_svg]:w-6">{icon}</span>
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  error: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", error, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-rose-100">{title}</h3>
          <p className="mt-0.5 text-sm text-rose-200/80">{error}</p>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="btn-ghost !py-1 !text-xs"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
