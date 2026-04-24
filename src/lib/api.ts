import type { BucketResponse, StartResponse, StatusResponse } from "./types";

// All API calls go through Next.js rewrites → BASE_URL from .env.
// This avoids CORS and lets the browser use same-origin URLs everywhere.
const API_PREFIX = "/api/products";

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_PREFIX}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.detail) detail = String(data.detail);
      else if (data?.message) detail = String(data.message);
    } catch {
      // ignore body parse errors; fall back to status
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

export function startProducts(): Promise<StartResponse> {
  return request<StartResponse>("/start", { method: "POST" });
}

export function fetchStatus(): Promise<StatusResponse> {
  return request<StatusResponse>("/status");
}

export function fetchBucket(params?: {
  date?: string;
  time?: string;
}): Promise<BucketResponse> {
  const search = new URLSearchParams();
  if (params?.date) search.set("date", params.date);
  if (params?.time) search.set("time", params.time);
  const qs = search.toString();
  return request<BucketResponse>(`/s3${qs ? `?${qs}` : ""}`);
}

// Direct URL for streaming the zip (browser follows it as a normal download).
export function bucketZipUrl(params?: {
  date?: string;
  time?: string;
  folder?: string;
}): string {
  const search = new URLSearchParams();
  if (params?.date) search.set("date", params.date);
  if (params?.time) search.set("time", params.time);
  if (params?.folder) search.set("folder", params.folder);
  const qs = search.toString();
  return `${API_PREFIX}/s3/zip${qs ? `?${qs}` : ""}`;
}
