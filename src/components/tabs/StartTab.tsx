"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchStatus, startProducts } from "@/lib/api";
import { formatDateTime, formatDuration, statusTone } from "@/lib/format";
import type { StatusResponse } from "@/lib/types";
import { Card, SectionHeader, StatTile } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import { Loader, SkeletonBlock } from "../ui/Loader";
import { ErrorState } from "../ui/EmptyState";
import { useToast } from "../ui/Toast";
import { JsonModal } from "../ui/JsonModal";
import {
  ActivityIcon,
  BracesIcon,
  HashIcon,
  LayersIcon,
  PlayIcon,
  RefreshIcon,
  SparklesIcon,
  SpinnerIcon,
} from "../ui/Icons";

const STATUS_REFRESH_MS = 5000;

export function StartTab() {
  const { push } = useToast();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await fetchStatus();
      setStatus(s);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, STATUS_REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const onStart = useCallback(async () => {
    setStarting(true);
    try {
      const resp = await startProducts();
      push("success", "Scrape started", resp.message || "Products job kicked off.");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      push("error", "Could not start", msg);
    } finally {
      setStarting(false);
    }
  }, [load, push]);

  const topStatus = status?.products?.status ?? "idle";
  const tone = statusTone(topStatus);
  const isRunning = String(topStatus).toLowerCase() === "running";

  return (
    <div className="space-y-6">
      <Hero
        status={topStatus}
        toneGlow={tone.glow}
        starting={starting}
        disabled={starting || isRunning}
        onStart={onStart}
        onRefresh={load}
        onShowJson={() => setJsonOpen(true)}
        jsonDisabled={!status}
        startedAt={status?.products?.started_at ?? null}
        finishedAt={status?.products?.finished_at ?? null}
      />

      {error ? <ErrorState error={error} onRetry={load} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Parent categories"
          value={loading ? "—" : status?.summary.parent_category_count ?? 0}
          icon={<LayersIcon />}
          tone="brand"
        />
        <StatTile
          label="Categories"
          value={loading ? "—" : status?.summary.category_count ?? 0}
          icon={<HashIcon />}
          tone="accent"
        />
        <StatTile
          label="Subcategories"
          value={loading ? "—" : status?.summary.subcategory_count ?? 0}
          icon={<ActivityIcon />}
          tone="emerald"
        />
      </div>

      <Card>
        <SectionHeader
          title="Configured targets"
          description="Top-level parent and category labels the scraper will process."
          icon={<SparklesIcon />}
          right={
            loading ? (
              <Loader label="Refreshing" />
            ) : (
              <button
                type="button"
                onClick={load}
                className="btn-ghost !py-1.5 !text-xs"
              >
                <RefreshIcon className="h-3.5 w-3.5" />
                Refresh
              </button>
            )
          }
        />

        {loading && !status ? (
          <SkeletonBlock rows={4} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TargetList
              title="Parent categories"
              items={status?.assign_parent_categories ?? []}
              accent="brand"
            />
            <TargetList
              title="Categories"
              items={status?.assign_categories ?? []}
              accent="accent"
            />
          </div>
        )}
      </Card>

      <JsonModal
        open={jsonOpen}
        title="Status response"
        subtitle="Raw JSON returned by GET /api/products/status"
        endpoint="GET /api/products/status"
        data={status}
        onClose={() => setJsonOpen(false)}
        filename="products-status.json"
      />
    </div>
  );
}

interface HeroProps {
  status: string;
  toneGlow: string;
  starting: boolean;
  disabled: boolean;
  onStart: () => void;
  onRefresh: () => void;
  onShowJson: () => void;
  jsonDisabled: boolean;
  startedAt: string | null;
  finishedAt: string | null;
}

function Hero({
  status,
  toneGlow,
  starting,
  disabled,
  onStart,
  onRefresh,
  onShowJson,
  jsonDisabled,
  startedAt,
  finishedAt,
}: HeroProps) {
  const isRunning = String(status).toLowerCase() === "running";

  return (
    <Card className="relative overflow-hidden !p-0">
      <div className="bg-grid absolute inset-0 opacity-40" />
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-wider text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              Products pipeline
            </div>
            <h1 className="text-2xl font-semibold leading-tight text-white md:text-3xl">
              Start a new scrape run
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Queues the <code className="kbd">products</code> job on the backend
              and streams live progress to the Status tab. Safe to re-trigger when
              idle.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <span className="text-[11px] text-slate-400">
                Started: <span className="text-slate-200">{formatDateTime(startedAt)}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Finished: <span className="text-slate-200">{formatDateTime(finishedAt)}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Duration: <span className="text-slate-200 tabular-nums">{formatDuration(startedAt, finishedAt)}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onShowJson}
              disabled={jsonDisabled}
              className="btn-ghost"
              title="View raw JSON response"
            >
              <BracesIcon className="h-4 w-4" />
              JSON
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="btn-ghost"
              title="Refresh status"
            >
              <RefreshIcon className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={onStart}
              disabled={disabled}
              className={`btn-primary !px-5 !py-2.5 !text-sm ${toneGlow}`}
            >
              {starting ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Starting…
                </>
              ) : isRunning ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Running…
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  Start scrape
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function TargetList({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "brand" | "accent";
}) {
  const accentCls =
    accent === "brand"
      ? "from-brand-500/20 to-brand-500/5 text-brand-200"
      : "from-accent-500/20 to-accent-500/5 text-accent-400";

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-slate-400">{title}</div>
        <div className="text-xs font-medium text-slate-300 tabular-nums">
          {items.length}
        </div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-400">
          Nothing configured.
        </div>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((name) => (
            <li
              key={name}
              className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br px-2.5 py-1 text-xs ring-1 ring-white/10 ${accentCls}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
