"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { bucketZipUrl, fetchBucket } from "@/lib/api";
import { classNames, guessIconForFile } from "@/lib/format";
import type {
  BucketCategory,
  BucketFile,
  BucketResponse,
  BucketSubcategory,
} from "@/lib/types";

const PreviewCtx = createContext<(f: BucketFile) => void>(() => undefined);
import { Card, SectionHeader, StatTile } from "../ui/Card";
import { IconButton } from "../ui/IconButton";
import { Loader, SkeletonBlock } from "../ui/Loader";
import { EmptyState, ErrorState } from "../ui/EmptyState";
import { TreeNode } from "../ui/TreeNode";
import { JsonModal } from "../ui/JsonModal";
import { FilePreviewModal } from "../ui/FilePreviewModal";
import {
  BracesIcon,
  CloudIcon,
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileIcon,
  FolderIcon,
  HashIcon,
  JsonIcon,
  LayersIcon,
  RefreshIcon,
  TableIcon,
  ZipIcon,
} from "../ui/Icons";

interface QueryParams {
  date?: string;
  time?: string;
}

export function BucketsTab() {
  const [data, setData] = useState<BucketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [jsonOpen, setJsonOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<BucketFile | null>(null);
  const openPreview = useCallback((f: BucketFile) => setPreviewFile(f), []);

  const load = useCallback(async (params?: QueryParams) => {
    setLoading(true);
    try {
      const b = await fetchBucket(params);
      setData(b);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onApply = useCallback(
    (ev?: React.FormEvent) => {
      ev?.preventDefault();
      load({ date: date || undefined, time: time || undefined });
    },
    [date, time, load],
  );

  const onClear = useCallback(() => {
    setDate("");
    setTime("");
    load();
  }, [load]);

  const counts = data?.counts;
  const hasAny =
    (data?.tree?.categories?.length ?? 0) > 0 ||
    (data?.tree?.parentassign?.files?.length ?? 0) > 0;

  const queryParams: QueryParams = useMemo(
    () => ({
      date: date || undefined,
      time: time || undefined,
    }),
    [date, time],
  );

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden !p-0">
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="relative flex flex-col gap-5 p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-wider text-slate-300">
                S3 bucket
              </div>
              <h1 className="text-2xl font-semibold text-white">
                {data?.bucket ?? "Bucket"}
              </h1>
              <p className="mt-1 max-w-xl break-all text-sm text-slate-300">
                Run prefix:{" "}
                <span className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-slate-200 ring-1 ring-white/5">
                  {data?.base_prefix || "—"}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
              <IconButton
                as="a"
                href={bucketZipUrl(queryParams)}
                tone="brand"
                icon={<ZipIcon />}
                label="Download full run"
              />
              <button type="button" onClick={() => load(queryParams)} className="btn-ghost">
                <RefreshIcon className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <form
            onSubmit={onApply}
            className="glass flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-end"
          >
            <Field
              id="bucket-date"
              label="Date"
              placeholder="YYYY-MM-DD"
              value={date}
              onChange={setDate}
            />
            <Field
              id="bucket-time"
              label="Time"
              placeholder="HH-MM-SS"
              value={time}
              onChange={setTime}
            />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary !py-2 !text-xs">
                Apply
              </button>
              <button
                type="button"
                onClick={onClear}
                className="btn-ghost !py-2 !text-xs"
              >
                Latest run
              </button>
            </div>
          </form>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label="Parent folders"
          value={counts?.parent_category_folders ?? 0}
          icon={<LayersIcon />}
          tone="brand"
        />
        <StatTile
          label="Categories"
          value={counts?.category_folders ?? 0}
          icon={<HashIcon />}
          tone="accent"
        />
        <StatTile
          label="Subcategories"
          value={counts?.subcategory_folders ?? 0}
          icon={<FolderIcon />}
          tone="emerald"
        />
        <StatTile
          label="Files"
          value={counts?.total_files ?? 0}
          icon={<FileIcon />}
          tone="slate"
        />
        <StatTile
          label="Folders"
          value={counts?.total_folders ?? 0}
          icon={<FolderIcon />}
          tone="slate"
        />
        <StatTile
          label="Products (XLSX)"
          value={counts?.total_products_xlsx ?? 0}
          icon={<TableIcon />}
          tone="emerald"
        />
      </div>

      {error ? <ErrorState error={error} onRetry={() => load(queryParams)} /> : null}

      <Card padded={false}>
        <div className="border-b border-white/5 px-5 pb-4 pt-5 md:px-6">
          <SectionHeader
            title="Bucket tree"
            description="Folders zip on click. Individual files open via their presigned URL."
            icon={<CloudIcon />}
            right={loading && data ? <Loader label="Refreshing" /> : null}
          />
        </div>
        <div className="p-3 md:p-4">
          {loading && !data ? (
            <SkeletonBlock rows={8} />
          ) : !hasAny ? (
            <EmptyState
              icon={<FolderIcon />}
              title="No files yet"
              description="Run a scrape from the Start tab. Once the backend writes to S3, folders and downloads appear here."
            />
          ) : (
            <PreviewCtx.Provider value={openPreview}>
              <div className="space-y-0.5">
                <ParentAssignNode
                  data={data!.tree.parentassign}
                  queryParams={queryParams}
                />
                {data!.tree.categories.map((c) => (
                  <CategoryFolder
                    key={`${c.parent_category ?? ""}:${c.name}`}
                    cat={c}
                    queryParams={queryParams}
                  />
                ))}
              </div>
            </PreviewCtx.Provider>
          )}
        </div>
      </Card>

      <JsonModal
        open={jsonOpen}
        title="Bucket response"
        subtitle="Raw JSON returned by GET /api/products/s3"
        endpoint="GET /api/products/s3"
        data={data}
        onClose={() => setJsonOpen(false)}
        filename="products-s3.json"
      />

      <FilePreviewModal
        open={previewFile !== null}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-[11px] uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400/40 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-brand-400/30"
      />
    </div>
  );
}

function ParentAssignNode({
  data,
  queryParams,
}: {
  data: { url: string; files: BucketFile[] };
  queryParams: QueryParams;
}) {
  const files = data?.files ?? [];
  if (files.length === 0) return null;
  return (
    <TreeNode
      depth={0}
      defaultOpen
      icon={<LayersIcon />}
      label={<span className="font-semibold">parentassign</span>}
      badge={<CountBadge count={files.length} label="files" tone="brand" />}
      actions={
        <>
          {data.url ? (
            <IconButton
              as="a"
              href={data.url}
              target="_blank"
              rel="noreferrer"
              size="sm"
              tone="default"
              icon={<ExternalLinkIcon />}
              tooltip="Open parent folder"
            />
          ) : null}
          <IconButton
            as="a"
            href={bucketZipUrl({ ...queryParams, folder: undefined })}
            size="sm"
            tone="brand"
            icon={<ZipIcon />}
            tooltip="Download full run as zip"
          />
        </>
      }
    >
      {files.map((f) => (
        <FileLeaf key={f.url || f.name} file={f} depth={1} />
      ))}
    </TreeNode>
  );
}

function CategoryFolder({
  cat,
  queryParams,
}: {
  cat: BucketCategory;
  queryParams: QueryParams;
}) {
  const folderPath = cat.parent_category
    ? `${cat.parent_category}/${cat.name}`
    : cat.name;
  const parentFolderPath = cat.parent_category ?? "";

  const allFilesCount =
    cat.files.length +
    cat.subcategories.reduce((n, s) => n + s.files.length, 0);

  return (
    <TreeNode
      depth={cat.parent_category ? 0 : 0}
      defaultOpen
      icon={<FolderIcon />}
      label={
        <span className="flex items-center gap-2">
          {cat.parent_category ? (
            <span className="text-xs font-normal text-slate-400">
              {cat.parent_category}
              <span className="mx-1 text-slate-600">/</span>
            </span>
          ) : null}
          <span className="font-semibold">{cat.name}</span>
        </span>
      }
      badge={
        <>
          <CountBadge
            count={cat.subcategories.length}
            label="subs"
            tone="accent"
          />
          <CountBadge count={allFilesCount} label="files" tone="slate" />
          <CountBadge count={cat.product_count_xlsx ?? 0} label="products" tone="emerald" />
        </>
      }
      meta={
        cat.parent_category ? (
          <span className="text-slate-500">
            Parent: <span className="text-slate-300">{cat.parent_category}</span>
          </span>
        ) : null
      }
      actions={
        <>
          {cat.url ? (
            <IconButton
              as="a"
              href={cat.url}
              target="_blank"
              rel="noreferrer"
              size="sm"
              tone="default"
              icon={<ExternalLinkIcon />}
              tooltip="Open folder URL"
            />
          ) : null}
          {parentFolderPath ? (
            <IconButton
              as="a"
              href={bucketZipUrl({ ...queryParams, folder: parentFolderPath })}
              size="sm"
              tone="brand"
              icon={<ZipIcon />}
              tooltip={`Download parent "${parentFolderPath}" as zip`}
            />
          ) : null}
          <IconButton
            as="a"
            href={bucketZipUrl({ ...queryParams, folder: folderPath })}
            size="sm"
            tone="brand"
            icon={<ZipIcon />}
            tooltip={`Download "${folderPath}" as zip`}
          />
        </>
      }
    >
      {cat.files.map((f) => (
        <FileLeaf key={f.url || f.name} file={f} depth={1} />
      ))}
      {cat.subcategories.map((s) => (
        <SubcategoryFolder
          key={`${folderPath}/${s.name}`}
          sub={s}
          folderPath={`${folderPath}/${s.name}`}
          queryParams={queryParams}
        />
      ))}
    </TreeNode>
  );
}

function SubcategoryFolder({
  sub,
  folderPath,
  queryParams,
}: {
  sub: BucketSubcategory;
  folderPath: string;
  queryParams: QueryParams;
}) {
  return (
    <TreeNode
      depth={1}
      defaultOpen
      icon={<FolderIcon />}
      label={sub.name}
      badge={
        <>
          <CountBadge count={sub.files.length} label="files" tone="slate" />
          <CountBadge count={sub.product_count_xlsx ?? 0} label="products" tone="emerald" />
        </>
      }
      actions={
        <>
          {sub.url ? (
            <IconButton
              as="a"
              href={sub.url}
              target="_blank"
              rel="noreferrer"
              size="sm"
              tone="default"
              icon={<ExternalLinkIcon />}
              tooltip="Open folder URL"
            />
          ) : null}
          <IconButton
            as="a"
            href={bucketZipUrl({ ...queryParams, folder: folderPath })}
            size="sm"
            tone="brand"
            icon={<ZipIcon />}
            tooltip={`Download "${sub.name}" as zip`}
          />
        </>
      }
    >
      {sub.files.map((f) => (
        <FileLeaf key={f.url || f.name} file={f} depth={2} />
      ))}
    </TreeNode>
  );
}

function FileLeaf({ file, depth }: { file: BucketFile; depth: number }) {
  const openPreview = useContext(PreviewCtx);
  const kind = guessIconForFile(file.name);
  const icon =
    kind === "json" ? (
      <JsonIcon />
    ) : kind === "xlsx" ? (
      <TableIcon />
    ) : (
      <FileIcon />
    );
  const tone =
    kind === "json" ? "text-amber-300" : kind === "xlsx" ? "text-emerald-300" : "text-slate-300";
  return (
    <TreeNode
      depth={depth}
      leaf
      icon={<span className={tone}>{icon}</span>}
      label={<span className="font-mono text-[12.5px]">{file.name}</span>}
      actions={
        <>
          {file.url ? (
            <IconButton
              size="sm"
              tone="brand"
              icon={<EyeIcon />}
              tooltip={`Preview ${file.name}`}
              onClick={() => openPreview(file)}
            />
          ) : null}
          {file.url ? (
            <IconButton
              as="a"
              href={file.url}
              target="_blank"
              rel="noreferrer"
              size="sm"
              tone="default"
              icon={<ExternalLinkIcon />}
              tooltip="Open raw URL"
            />
          ) : null}
          {file.url ? (
            <IconButton
              as="a"
              href={file.url}
              download={file.name}
              size="sm"
              tone="accent"
              icon={<DownloadIcon />}
              tooltip={`Download ${file.name}`}
            />
          ) : null}
        </>
      }
    />
  );
}

function CountBadge({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: "brand" | "accent" | "slate" | "emerald";
}) {
  const palette =
    tone === "brand"
      ? "bg-brand-500/15 text-brand-200 border-brand-400/30"
      : tone === "accent"
        ? "bg-accent-500/15 text-accent-400 border-accent-500/30"
        : tone === "emerald"
          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
        : "bg-white/[0.05] text-slate-300 border-white/10";
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] tabular-nums",
        palette,
      )}
    >
      <span className="font-semibold">{count}</span>
      <span className="opacity-70">{label}</span>
    </span>
  );
}
