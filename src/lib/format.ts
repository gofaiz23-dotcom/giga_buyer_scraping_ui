import type { JobStatus } from "./types";

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDuration(
  started?: string | null,
  finished?: string | null,
): string {
  if (!started) return "—";
  const start = new Date(started).getTime();
  const end = finished ? new Date(finished).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "—";
  const ms = end - start;
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function statusTone(status: JobStatus | undefined | null): {
  label: string;
  dot: string;
  chip: string;
  ring: string;
  glow: string;
} {
  const s = String(status || "").toLowerCase();
  if (s === "running")
    return {
      label: "Running",
      dot: "bg-brand-400 animate-pulseSoft",
      chip: "bg-brand-500/15 text-brand-200 border-brand-400/30",
      ring: "ring-brand-400/40",
      glow: "shadow-[0_0_0_3px_rgba(59,99,255,0.18)]",
    };
  if (s === "completed")
    return {
      label: "Completed",
      dot: "bg-emerald-400",
      chip: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
      ring: "ring-emerald-400/40",
      glow: "shadow-[0_0_0_3px_rgba(16,185,129,0.15)]",
    };
  if (s === "failed")
    return {
      label: "Failed",
      dot: "bg-rose-400",
      chip: "bg-rose-500/15 text-rose-200 border-rose-400/30",
      ring: "ring-rose-400/40",
      glow: "shadow-[0_0_0_3px_rgba(244,63,94,0.15)]",
    };
  return {
    label: s ? s.replace(/^\w/, (c) => c.toUpperCase()) : "Idle",
    dot: "bg-slate-500",
    chip: "bg-slate-500/10 text-slate-300 border-slate-500/30",
    ring: "ring-slate-500/30",
    glow: "",
  };
}

export function guessIconForFile(name: string): "json" | "xlsx" | "folder" | "file" {
  const n = name.toLowerCase();
  if (n.endsWith(".json")) return "json";
  if (n.endsWith(".xlsx") || n.endsWith(".xls") || n.endsWith(".csv")) return "xlsx";
  return "file";
}

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
