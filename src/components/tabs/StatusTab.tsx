"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStatus } from "@/lib/api";
import { classNames, formatDateTime, formatDuration } from "@/lib/format";
import type {
  CategoryStatus,
  ParentStatus,
  StatusResponse,
  SubcategoryStatus,
} from "@/lib/types";
import { Card, SectionHeader, StatTile } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import { Loader, SkeletonBlock } from "../ui/Loader";
import { EmptyState, ErrorState } from "../ui/EmptyState";
import { TreeNode } from "../ui/TreeNode";
import { JsonModal } from "../ui/JsonModal";
import {
  ActivityIcon,
  BracesIcon,
  FolderIcon,
  HashIcon,
  LayersIcon,
  RefreshIcon,
} from "../ui/Icons";

const REFRESH_MS = 4000;

interface GroupedCategory extends CategoryStatus {
  subs: SubcategoryStatus[];
}

interface GroupedParent extends ParentStatus {
  categories: GroupedCategory[];
  totalProducts: number;
  totalSubcategories: number;
}

function groupTree(data: StatusResponse): GroupedParent[] {
  const subsByCat = new Map<string, SubcategoryStatus[]>();
  for (const s of data.subcategory_statuses ?? []) {
    const key = String(s.category ?? "").toLowerCase();
    if (!subsByCat.has(key)) subsByCat.set(key, []);
    subsByCat.get(key)!.push(s);
  }
  // sort subs by name inside each cat
  for (const arr of subsByCat.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name));
  }

  const grouped: GroupedCategory[] = (data.category_statuses ?? []).map((c) => ({
    ...c,
    subs: subsByCat.get(c.name.toLowerCase()) ?? [],
  }));

  const parents = data.assign_parent_categories ?? [];
  const parentStatuses = data.parent_statuses ?? [];

  // If we have explicit parents, attach every category to every parent group.
  // Backend doesn't disambiguate categories per parent in status, so we show
  // them grouped under each parent (typical of a flat taxonomy response).
  if (parents.length > 0) {
    return parentStatuses.map((p) => {
      const totalProducts = grouped.reduce((n, c) => n + (c.product_count || 0), 0);
      const totalSubcategories = grouped.reduce(
        (n, c) => n + (c.subcategory_count || c.subs.length || 0),
        0,
      );
      return {
        ...p,
        categories: grouped,
        totalProducts,
        totalSubcategories,
      };
    });
  }

  // No parents: still render a single virtual parent.
  return [
    {
      name: "(no parent configured)",
      status: "idle",
      started_at: null,
      finished_at: null,
      categories: grouped,
      totalProducts: grouped.reduce((n, c) => n + (c.product_count || 0), 0),
      totalSubcategories: grouped.reduce(
        (n, c) => n + (c.subcategory_count || c.subs.length || 0),
        0,
      ),
    },
  ];
}

export function StatusTab() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await fetchStatus();
      setData(s);
      setLastFetched(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const tree = useMemo(() => (data ? groupTree(data) : []), [data]);

  const topStatus = data?.products?.status ?? "idle";
  const hasAny =
    tree.length > 0 &&
    tree.some((p) => p.categories.length > 0);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden !p-0">
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-wider text-slate-300">
              Live status
            </div>
            <h1 className="text-2xl font-semibold text-white">Pipeline tree</h1>
            <p className="mt-1 text-sm text-slate-300">
              Parent → Category → Subcategory, refreshed every {REFRESH_MS / 1000}s.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge status={topStatus} />
              <span className="text-[11px] text-slate-400">
                Started: <span className="text-slate-200">{formatDateTime(data?.products?.started_at)}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Finished: <span className="text-slate-200">{formatDateTime(data?.products?.finished_at)}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Duration:{" "}
                <span className="tabular-nums text-slate-200">
                  {formatDuration(data?.products?.started_at, data?.products?.finished_at)}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading && data ? <Loader label="Refreshing" /> : null}
            {lastFetched ? (
              <span className="text-[11px] text-slate-400">
                Updated {lastFetched.toLocaleTimeString()}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setJsonOpen(true)}
              disabled={!data}
              className="btn-ghost"
              title="View raw JSON response"
            >
              <BracesIcon className="h-4 w-4" />
              JSON
            </button>
            <button type="button" onClick={load} className="btn-ghost">
              <RefreshIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Parent categories"
          value={data?.summary.parent_category_count ?? 0}
          icon={<LayersIcon />}
          tone="brand"
        />
        <StatTile
          label="Categories"
          value={data?.summary.category_count ?? 0}
          icon={<HashIcon />}
          tone="accent"
        />
        <StatTile
          label="Subcategories"
          value={data?.summary.subcategory_count ?? 0}
          icon={<ActivityIcon />}
          tone="emerald"
        />
      </div>

      {error ? <ErrorState error={error} onRetry={load} /> : null}

      <Card padded={false}>
        <div className="border-b border-white/5 px-5 pb-4 pt-5 md:px-6">
          <SectionHeader
            title="Tree"
            description="Expand a parent to drill into categories and subcategories."
            icon={<FolderIcon />}
          />
        </div>

        <div className="p-3 md:p-4">
          {loading && !data ? (
            <SkeletonBlock rows={6} />
          ) : !hasAny ? (
            <EmptyState
              icon={<FolderIcon />}
              title="Nothing to show yet"
              description="Start a scrape from the Start tab — category and subcategory nodes appear here as soon as the run begins reporting."
            />
          ) : (
            <div className="space-y-0.5">
              {tree.map((parent) => (
                <ParentNode key={parent.name} parent={parent} />
              ))}
            </div>
          )}
        </div>
      </Card>

      <JsonModal
        open={jsonOpen}
        title="Status response"
        subtitle="Raw JSON returned by GET /api/products/status"
        endpoint="GET /api/products/status"
        data={data}
        onClose={() => setJsonOpen(false)}
        filename="products-status.json"
      />
    </div>
  );
}

function ParentNode({ parent }: { parent: GroupedParent }) {
  return (
    <TreeNode
      depth={0}
      defaultOpen
      icon={<LayersIcon />}
      label={<span className="font-semibold">{parent.name}</span>}
      badge={<StatusBadge status={parent.status} size="sm" />}
      meta={
        <>
          <Meta label="Categories" value={parent.categories.length} />
          <Meta label="Subcategories" value={parent.totalSubcategories} />
          <Meta label="Products" value={parent.totalProducts} />
          <Meta label="Started" value={formatDateTime(parent.started_at)} mono />
          <Meta
            label="Duration"
            value={formatDuration(parent.started_at, parent.finished_at)}
            mono
          />
        </>
      }
    >
      {parent.categories.length === 0 ? (
        <div className="px-4 py-3 text-xs text-slate-400">
          No categories reported yet.
        </div>
      ) : (
        parent.categories.map((cat) => <CategoryNode key={cat.name} cat={cat} />)
      )}
    </TreeNode>
  );
}

function CategoryNode({ cat }: { cat: GroupedCategory }) {
  return (
    <TreeNode
      depth={1}
      defaultOpen
      icon={<HashIcon />}
      label={cat.name}
      badge={<StatusBadge status={cat.status} size="sm" />}
      meta={
        <>
          <Meta label="Products" value={cat.product_count} />
          <Meta
            label="Subs"
            value={cat.subcategory_count || cat.subs.length}
          />
          <Meta label="Started" value={formatDateTime(cat.started_at)} mono />
          <Meta
            label="Duration"
            value={formatDuration(cat.started_at, cat.finished_at)}
            mono
          />
        </>
      }
    >
      {cat.subs.length === 0 ? (
        <div className="px-4 py-2 text-[11px] text-slate-500">
          No subcategory activity yet.
        </div>
      ) : (
        cat.subs.map((s) => <SubNode key={`${cat.name}:${s.name}`} sub={s} />)
      )}
    </TreeNode>
  );
}

function SubNode({ sub }: { sub: SubcategoryStatus }) {
  return (
    <TreeNode
      depth={2}
      leaf
      icon={<ActivityIcon />}
      label={sub.name}
      badge={<StatusBadge status={sub.status} size="sm" />}
      meta={
        <>
          <Meta label="Products" value={sub.product_count} />
          {typeof sub.variant_count === "number" ? (
            <Meta label="Variants" value={sub.variant_count} />
          ) : null}
          <Meta label="Started" value={formatDateTime(sub.started_at)} mono />
          <Meta
            label="Duration"
            value={formatDuration(sub.started_at, sub.finished_at)}
            mono
          />
        </>
      }
    />
  );
}

function Meta({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-slate-500">{label}:</span>
      <span className={classNames("text-slate-200", mono && "tabular-nums")}>
        {value}
      </span>
    </span>
  );
}
