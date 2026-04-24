"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { classNames } from "@/lib/format";
import { BracesIcon, CheckIcon, CloseIcon, CopyIcon, DownloadIcon } from "./Icons";

interface JsonModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  endpoint?: string;
  data: unknown;
  onClose: () => void;
  filename?: string;
}

const tokenRegex =
  /"(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function highlightJson(jsonText: string): string {
  // Escape HTML first.
  const escaped = jsonText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(tokenRegex, (match) => {
    let cls = "text-amber-300"; // number
    if (match.startsWith('"')) {
      if (match.endsWith(":")) {
        cls = "text-brand-300";
      } else {
        cls = "text-emerald-300";
      }
    } else if (match === "true" || match === "false") {
      cls = "text-fuchsia-300";
    } else if (match === "null") {
      cls = "text-slate-400";
    }
    return `<span class="${cls}">${match}</span>`;
  });
}

export function JsonModal({
  open,
  title,
  subtitle,
  endpoint,
  data,
  onClose,
  filename = "response.json",
}: JsonModalProps) {
  const [copied, setCopied] = useState(false);

  const jsonText = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2) ?? "null";
    } catch {
      return String(data);
    }
  }, [data]);

  const highlighted = useMemo(() => highlightJson(jsonText), [jsonText]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }, [jsonText]);

  const onDownload = useCallback(() => {
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }, [jsonText, filename]);

  if (!open) return null;

  const sizeBytes = new Blob([jsonText]).size;
  const lines = jsonText.split("\n").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-md"
      />

      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-4xl animate-slide-up flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl ring-1 ring-white/5">
        <header className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/25 to-accent-500/25 text-brand-200 ring-1 ring-white/10">
              <BracesIcon />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold text-white">
                  {title}
                </h2>
                {endpoint ? (
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10.5px] text-slate-300">
                    {endpoint}
                  </span>
                ) : null}
              </div>
              {subtitle ? (
                <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
              ) : null}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                <span>
                  {lines.toLocaleString()} lines
                </span>
                <span>{formatBytes(sizeBytes)}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onCopy}
              className={classNames(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                copied
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                  : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]",
              )}
              title="Copy JSON"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
              title="Download JSON"
            >
              <DownloadIcon className="h-4 w-4" />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-ink-950/60">
          {data === undefined || data === null ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              No response yet.
            </div>
          ) : (
            <pre className="m-0 p-5 font-mono text-[12.5px] leading-relaxed text-slate-200">
              <code
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
          )}
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-white/5 px-5 py-2.5 text-[11px] text-slate-500">
          <span>
            Tip: press <kbd className="kbd">Esc</kbd> to close
          </span>
          <span>
            Raw JSON from the last successful fetch
          </span>
        </footer>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
