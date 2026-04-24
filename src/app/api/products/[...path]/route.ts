import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAW_BASE_URL = process.env.BASE_URL || "http://127.0.0.1:8005";
const BASE_URL = RAW_BASE_URL.replace("://localhost", "://127.0.0.1").replace(/\/+$/, "");

function buildTargetUrl(pathParts: string[], req: NextRequest): string {
  const path = pathParts.map((p) => encodeURIComponent(p)).join("/");
  const qs = req.nextUrl.search || "";
  return `${BASE_URL}/api/products/${path}${qs}`;
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const targetUrl = buildTargetUrl(path ?? [], req);

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("accept", "application/json");
  reqHeaders.delete("host");
  reqHeaders.delete("connection");
  reqHeaders.delete("content-length");

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers: reqHeaders,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
      cache: "no-store",
      redirect: "manual",
    });

    const outHeaders = new Headers(res.headers);
    outHeaders.delete("content-encoding");
    outHeaders.delete("content-length");
    outHeaders.set("x-proxied-by", "next-route");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: outHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      {
        detail: `Proxy request failed for ${targetUrl}`,
        error: message,
      },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}

export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
