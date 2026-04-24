"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { classNames } from "@/lib/format";
import {
  AlertIcon,
  BracesIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileIcon,
  JsonIcon,
  SearchIcon,
  SpinnerIcon,
  TableIcon,
} from "./Icons";

type SheetRow = Array<string | number | boolean | null>;

interface SheetData {
  name: string;
  headers: string[];
  rows: SheetRow[];
  totalRows: number;
}

type PreviewContent =
  | { kind: "json"; text: string; parsed: unknown }
  | { kind: "text"; text: string }
  | { kind: "sheets"; sheets: SheetData[] };

interface FilePreviewModalProps {
  open: boolean;
  file: { name: string; url: string } | null;
  onClose: () => void;
}

const MAX_DISPLAY_ROWS = 5000;
const LARGE_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function kindOfExtension(
  ext: string,
): "json" | "xlsx" | "csv" | "text" | "unknown" {
  if (ext === "json") return "json";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "csv" || ext === "tsv") return "csv";
  if (["txt", "log", "md", "yml", "yaml", "xml", "html"].includes(ext)) return "text";
  return "unknown";
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

// ---------- JSON highlight (same palette as JsonModal) ----------
const jsonTokenRegex =
  /"(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function highlightJson(jsonText: string): string {
  const escaped = jsonText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(jsonTokenRegex, (match) => {
    let cls = "text-amber-300";
    if (match.startsWith('"')) {
      cls = match.endsWith(":") ? "text-brand-300" : "text-emerald-300";
    } else if (match === "true" || match === "false") {
      cls = "text-fuchsia-300";
    } else if (match === "null") {
      cls = "text-slate-400";
    }
    return `<span class="${cls}">${match}</span>`;
  });
}

// ---------- CSV / TSV parser (RFC 4180-ish, good enough for previews) ----------
function parseDelimited(text: string, delimiter: string): SheetRow[] {
  const rows: SheetRow[] = [];
  let current: SheetRow = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      current.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      current.push(field);
      rows.push(current);
      current = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }
  return rows;
}

// ---------- Dynamic XLSX loader ----------
async function loadXlsx(): Promise<typeof import("xlsx") | null> {
  try {
    const mod = await import(/* webpackIgnore: false */ "xlsx");
    return mod;
  } catch {
    return null;
  }
}

// ---------- Main component ----------
export function FilePreviewModal({
  open,
  file,
  onClose,
}: FilePreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [content, setContent] = useState<PreviewContent | null>(null);
  const [byteSize, setByteSize] = useState<number | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const load = useCallback(async () => {
    if (!file) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);
    setWarning(null);
    setContent(null);
    setActiveSheet(0);
    setQuery("");
    setByteSize(null);

    const ext = extensionOf(file.name);
    const kind = kindOfExtension(ext);

    try {
      const res = await fetch(file.url, {
        cache: "no-store",
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

      const lenHeader = res.headers.get("content-length");
      const approxBytes = lenHeader ? Number(lenHeader) : null;
      if (approxBytes != null) setByteSize(approxBytes);
      if (approxBytes != null && approxBytes > LARGE_FILE_BYTES) {
        setWarning(
          `Large file (${formatBytes(approxBytes)}). Showing the first ${formatNumber(
            MAX_DISPLAY_ROWS,
          )} rows / lines.`,
        );
      }

      if (kind === "xlsx") {
        const buf = await res.arrayBuffer();
        setByteSize(buf.byteLength);
        const XLSX = await loadXlsx();
        if (!XLSX) {
          throw new Error(
            "The `xlsx` package is not installed yet. Run `npm install` and reload.",
          );
        }
        const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
        const sheets: SheetData[] = wb.SheetNames.map((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<SheetRow>(ws, {
            header: 1,
            defval: "",
            blankrows: false,
          }) as SheetRow[];
          const headers =
            rows.length > 0
              ? (rows[0] as SheetRow).map((h) =>
                  h == null ? "" : String(h),
                )
              : [];
          const body = rows.slice(1);
          const cappedBody = body.slice(0, MAX_DISPLAY_ROWS);
          if (body.length > MAX_DISPLAY_ROWS) {
            setWarning(
              `Sheet "${sheetName}" has ${formatNumber(
                body.length,
              )} rows. Showing the first ${formatNumber(MAX_DISPLAY_ROWS)}.`,
            );
          }
          return {
            name: sheetName,
            headers,
            rows: cappedBody,
            totalRows: body.length,
          };
        });
        setContent({ kind: "sheets", sheets });
      } else if (kind === "csv" || ext === "tsv") {
        const text = await res.text();
        setByteSize(new Blob([text]).size);
        const rows = parseDelimited(text, ext === "tsv" ? "\t" : ",");
        const headers =
          rows.length > 0 ? rows[0].map((h) => (h == null ? "" : String(h))) : [];
        const body = rows.slice(1);
        const capped = body.slice(0, MAX_DISPLAY_ROWS);
        if (body.length > MAX_DISPLAY_ROWS) {
          setWarning(
            `File has ${formatNumber(
              body.length,
            )} rows. Showing the first ${formatNumber(MAX_DISPLAY_ROWS)}.`,
          );
        }
        setContent({
          kind: "sheets",
          sheets: [
            {
              name: ext.toUpperCase(),
              headers,
              rows: capped,
              totalRows: body.length,
            },
          ],
        });
      } else if (kind === "json") {
        const text = await res.text();
        setByteSize(new Blob([text]).size);
        try {
          const parsed = JSON.parse(text);
          const pretty = JSON.stringify(parsed, null, 2);
          setContent({ kind: "json", text: pretty, parsed });
        } catch {
          // Not valid JSON? Render as raw text instead.
          setContent({ kind: "text", text });
          setWarning("File is not valid JSON — showing raw text.");
        }
      } else {
        const text = await res.text();
        setByteSize(new Blob([text]).size);
        setContent({ kind: "text", text });
      }
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [file]);

  useEffect(() => {
    if (open && file) load();
    return () => abortRef.current?.abort();
  }, [open, file, load]);

  const onCopyUrl = useCallback(async () => {
    if (!file?.url) return;
    try {
      await navigator.clipboard.writeText(file.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }, [file?.url]);

  if (!open || !file) return null;

  const ext = extensionOf(file.name);
  const kind = kindOfExtension(ext);
  const typeLabel = kind === "unknown" ? ext.toUpperCase() || "FILE" : kind.toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${file.name}`}
      className="fixed inset-0 z-50 flex items-stretch justify-center p-3 md:p-6"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-md"
      />

      <div className="relative flex w-full max-w-[min(1400px,100%)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl ring-1 ring-white/5 animate-slide-up">
        <Header
          file={file}
          kind={kind}
          typeLabel={typeLabel}
          byteSize={byteSize}
          content={content}
          activeSheet={activeSheet}
          loading={loading}
          copied={copied}
          onCopyUrl={onCopyUrl}
          onClose={onClose}
        />

        <Body
          loading={loading}
          error={error}
          warning={warning}
          content={content}
          file={file}
          activeSheet={activeSheet}
          onPickSheet={setActiveSheet}
          query={query}
          setQuery={setQuery}
          onRetry={load}
        />

        <Footer />
      </div>
    </div>
  );
}

// --------------------------- Header ---------------------------

function Header({
  file,
  kind,
  typeLabel,
  byteSize,
  content,
  activeSheet,
  loading,
  copied,
  onCopyUrl,
  onClose,
}: {
  file: { name: string; url: string };
  kind: ReturnType<typeof kindOfExtension>;
  typeLabel: string;
  byteSize: number | null;
  content: PreviewContent | null;
  activeSheet: number;
  loading: boolean;
  copied: boolean;
  onCopyUrl: () => void;
  onClose: () => void;
}) {
  const kindBadge = (() => {
    if (kind === "json")
      return { cls: "bg-amber-500/15 text-amber-200 border-amber-400/30", icon: <JsonIcon /> };
    if (kind === "xlsx" || kind === "csv")
      return { cls: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30", icon: <TableIcon /> };
    return { cls: "bg-slate-500/15 text-slate-200 border-slate-500/30", icon: <FileIcon /> };
  })();

  let meta: string[] = [];
  if (content?.kind === "sheets") {
    const sheet = content.sheets[activeSheet];
    if (sheet) {
      meta = [
        `${formatNumber(content.sheets.length)} sheet${content.sheets.length === 1 ? "" : "s"}`,
        `${formatNumber(sheet.headers.length)} cols`,
        `${formatNumber(sheet.totalRows)} rows`,
      ];
    }
  } else if (content?.kind === "json") {
    const lines = content.text.split("\n").length;
    meta = [`${formatNumber(lines)} lines`];
  } else if (content?.kind === "text") {
    const lines = content.text.split("\n").length;
    meta = [`${formatNumber(lines)} lines`];
  }
  if (byteSize != null) meta.push(formatBytes(byteSize));

  return (
    <header className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/25 to-accent-500/25 text-brand-200 ring-1 ring-white/10">
          <EyeIcon />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-mono text-sm font-semibold text-white">
              {file.name}
            </h2>
            <span
              className={classNames(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                kindBadge.cls,
              )}
            >
              <span className="[&_svg]:h-3 [&_svg]:w-3">{kindBadge.icon}</span>
              {typeLabel}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
            {loading ? (
              <span className="inline-flex items-center gap-1.5 text-brand-200">
                <SpinnerIcon className="h-3 w-3" />
                Loading preview…
              </span>
            ) : null}
            {meta.map((m, i) => (
              <span key={i} className="tabular-nums">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onCopyUrl}
          title="Copy URL"
          className={classNames(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
            copied
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
              : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]",
          )}
        >
          {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          {copied ? "Copied" : "URL"}
        </button>
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          title="Open original"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
        >
          <ExternalLinkIcon className="h-4 w-4" />
          Open
        </a>
        <a
          href={file.url}
          download={file.name}
          title="Download file"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
        >
          <DownloadIcon className="h-4 w-4" />
          Save
        </a>
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
  );
}

// --------------------------- Body ---------------------------

function Body({
  loading,
  error,
  warning,
  content,
  file,
  activeSheet,
  onPickSheet,
  query,
  setQuery,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  warning: string | null;
  content: PreviewContent | null;
  file: { name: string; url: string };
  activeSheet: number;
  onPickSheet: (i: number) => void;
  query: string;
  setQuery: (q: string) => void;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ink-950/60">
      {/* Toolbar */}
      {content?.kind === "sheets" ? (
        <SheetToolbar
          content={content}
          activeSheet={activeSheet}
          onPickSheet={onPickSheet}
          query={query}
          setQuery={setQuery}
        />
      ) : content?.kind === "json" || content?.kind === "text" ? (
        <TextToolbar query={query} setQuery={setQuery} />
      ) : null}

      {/* Warning */}
      {warning ? (
        <div className="mx-5 mt-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{warning}</span>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        {loading && !content ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBlock file={file} error={error} onRetry={onRetry} />
        ) : !content ? null : content.kind === "sheets" ? (
          <TableView sheet={content.sheets[activeSheet]} query={query} />
        ) : content.kind === "json" ? (
          <JsonView text={content.text} query={query} />
        ) : (
          <TextView text={content.text} query={query} />
        )}
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <SpinnerIcon className="h-4 w-4 text-brand-300" />
        Fetching file…
      </div>
    </div>
  );
}

function ErrorBlock({
  file,
  error,
  onRetry,
}: {
  file: { name: string; url: string };
  error: string;
  onRetry: () => void;
}) {
  const isCors = /cors|failed to fetch|network/i.test(error);
  return (
    <div className="m-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/30">
          <AlertIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-rose-100">
            Could not preview this file
          </div>
          <p className="mt-0.5 text-xs text-rose-200/80">{error}</p>
          {isCors ? (
            <p className="mt-2 text-[11px] text-rose-200/70">
              The S3 presigned URL may not allow cross-origin reads from the browser.
              You can still open the file directly below.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.08]"
            >
              Retry
            </button>
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.08]"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Open raw
            </a>
            <a
              href={file.url}
              download={file.name}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.08]"
            >
              <DownloadIcon className="h-4 w-4" />
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------- Toolbars ---------------------------

function SearchInput({
  value,
  onChange,
  placeholder = "Filter…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
        <SearchIcon className="h-3.5 w-3.5" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-56 rounded-lg border border-white/10 bg-white/[0.03] py-1.5 pl-8 pr-2.5 text-xs text-white placeholder:text-slate-500 focus:border-brand-400/40 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-brand-400/30"
      />
    </div>
  );
}

function SheetToolbar({
  content,
  activeSheet,
  onPickSheet,
  query,
  setQuery,
}: {
  content: Extract<PreviewContent, { kind: "sheets" }>;
  activeSheet: number;
  onPickSheet: (i: number) => void;
  query: string;
  setQuery: (q: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-2.5">
      <div className="flex min-w-0 flex-wrap items-center gap-1 overflow-x-auto">
        {content.sheets.map((s, i) => {
          const active = i === activeSheet;
          return (
            <button
              key={`${s.name}-${i}`}
              type="button"
              onClick={() => onPickSheet(i)}
              className={classNames(
                "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-gradient-to-r from-brand-500/25 to-accent-500/20 text-white shadow-[inset_0_0_0_1px_rgba(99,130,255,0.35)]"
                  : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="max-w-[200px] truncate">{s.name}</span>
              <span
                className={classNames(
                  "rounded-md px-1 py-0.5 text-[10px] tabular-nums",
                  active
                    ? "bg-white/[0.08] text-brand-100"
                    : "bg-white/[0.03] text-slate-400",
                )}
              >
                {formatNumber(s.totalRows)}
              </span>
            </button>
          );
        })}
      </div>
      <SearchInput value={query} onChange={setQuery} placeholder="Filter rows…" />
    </div>
  );
}

function TextToolbar({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (q: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-2.5">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <BracesIcon className="h-4 w-4" />
        Syntax-highlighted preview
      </div>
      <SearchInput value={query} onChange={setQuery} placeholder="Find…" />
    </div>
  );
}

// --------------------------- Views ---------------------------

function TableView({
  sheet,
  query,
}: {
  sheet: SheetData | undefined;
  query: string;
}) {
  const filtered = useMemo(() => {
    if (!sheet) return [];
    const q = query.trim().toLowerCase();
    if (!q) return sheet.rows;
    return sheet.rows.filter((row) =>
      row.some((cell) => String(cell ?? "").toLowerCase().includes(q)),
    );
  }, [sheet, query]);

  if (!sheet) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        Sheet is empty.
      </div>
    );
  }

  if (sheet.rows.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No rows in this sheet.
      </div>
    );
  }

  const headers =
    sheet.headers.length > 0
      ? sheet.headers
      : Array.from({ length: sheet.rows[0]?.length ?? 0 }, (_, i) => `col ${i + 1}`);

  return (
    <div className="relative min-h-0">
      <table className="w-full min-w-max border-separate border-spacing-0 text-[12.5px]">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 border-b border-white/10 bg-ink-900/95 px-3 py-2 text-right font-mono text-[11px] font-medium text-slate-500 backdrop-blur">
              #
            </th>
            {headers.map((h, i) => (
              <th
                key={`${h}-${i}`}
                className="border-b border-white/10 bg-ink-900/95 px-3 py-2 text-left font-semibold text-slate-100 backdrop-blur"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate">{h || <em className="text-slate-500">col {i + 1}</em>}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, r) => (
            <tr
              key={r}
              className="transition-colors hover:bg-white/[0.03]"
            >
              <td className="sticky left-0 z-[1] border-b border-white/[0.04] bg-ink-950/70 px-3 py-1.5 text-right font-mono text-[11px] tabular-nums text-slate-500">
                {r + 1}
              </td>
              {headers.map((_h, c) => {
                const cell = row[c];
                return (
                  <td
                    key={c}
                    className="border-b border-white/[0.04] px-3 py-1.5 align-top text-slate-200"
                  >
                    {renderCell(cell, query)}
                  </td>
                );
              })}
            </tr>
          ))}
          {filtered.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length + 1}
                className="px-3 py-8 text-center text-xs text-slate-400"
              >
                No rows match “{query}”.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(cell: SheetRow[number], query: string) {
  if (cell === null || cell === undefined || cell === "") {
    return <span className="text-slate-600">—</span>;
  }
  const str = String(cell);
  if (/^https?:\/\//.test(str)) {
    return (
      <a
        href={str}
        target="_blank"
        rel="noreferrer"
        className="inline-flex max-w-[420px] items-center gap-1 truncate text-brand-300 hover:text-brand-200 hover:underline"
      >
        <ExternalLinkIcon className="h-3 w-3 shrink-0" />
        <span className="truncate">{str}</span>
      </a>
    );
  }
  if (typeof cell === "number") {
    return <span className="font-mono tabular-nums text-amber-200">{str}</span>;
  }
  if (typeof cell === "boolean") {
    return <span className="font-mono text-fuchsia-300">{str}</span>;
  }
  return <span className="max-w-[480px] truncate">{highlightMatch(str, query)}</span>;
}

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-brand-500/30 px-0.5 text-white">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function JsonView({ text, query }: { text: string; query: string }) {
  const highlighted = useMemo(() => {
    let html = highlightJson(text);
    const q = query.trim();
    if (q) {
      const escaped = q
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const re = new RegExp(escaped, "gi");
      html = html.replace(
        re,
        (m) => `<mark class="rounded bg-brand-500/30 px-0.5 text-white">${m}</mark>`,
      );
    }
    return html;
  }, [text, query]);

  return (
    <pre className="m-0 p-5 font-mono text-[12.5px] leading-relaxed text-slate-200">
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}

function TextView({ text, query }: { text: string; query: string }) {
  const content = useMemo(() => {
    const q = query.trim();
    const esc = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    if (!q) return esc;
    const escaped = q
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const re = new RegExp(escaped, "gi");
    return esc.replace(
      re,
      (m) => `<mark class="rounded bg-brand-500/30 px-0.5 text-white">${m}</mark>`,
    );
  }, [text, query]);

  return (
    <pre className="m-0 p-5 font-mono text-[12.5px] leading-relaxed text-slate-200 whitespace-pre-wrap break-words">
      <code dangerouslySetInnerHTML={{ __html: content }} />
    </pre>
  );
}

function Footer() {
  return (
    <footer className="flex items-center justify-between gap-4 border-t border-white/5 px-5 py-2.5 text-[11px] text-slate-500">
      <span>
        Tip: press <kbd className="kbd">Esc</kbd> to close
      </span>
      <span>Fetched directly from the presigned S3 URL</span>
    </footer>
  );
}
