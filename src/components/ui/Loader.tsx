import { SpinnerIcon } from "./Icons";

interface LoaderProps {
  label?: string;
}

export function Loader({ label = "Loading…" }: LoaderProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <SpinnerIcon className="h-4 w-4 text-brand-300" />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="h-4 w-4 rounded skeleton" />
      <div className="h-4 w-48 rounded skeleton" />
      <div className="ml-auto h-4 w-20 rounded skeleton" />
    </div>
  );
}

export function SkeletonBlock({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
