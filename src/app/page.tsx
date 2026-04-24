"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar, type TabKey } from "@/components/Navbar";
import { StartTab } from "@/components/tabs/StartTab";
import { StatusTab } from "@/components/tabs/StatusTab";
import { BucketsTab } from "@/components/tabs/BucketsTab";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const VALID: TabKey[] = ["start", "status", "buckets"];

function readInitialTab(): TabKey {
  if (typeof window === "undefined") return "start";
  const hash = window.location.hash.replace(/^#/, "").toLowerCase();
  return (VALID as string[]).includes(hash) ? (hash as TabKey) : "start";
}

export default function HomePage() {
  const [tab, setTab] = useState<TabKey>("start");

  useEffect(() => {
    setTab(readInitialTab());
    const onHash = () => setTab(readInitialTab());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const onChange = useCallback((key: TabKey) => {
    setTab(key);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = key;
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <Navbar active={tab} onChange={onChange} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <div key={tab} className="animate-fade-in">
            {tab === "start" ? <StartTab /> : null}
            {tab === "status" ? <StatusTab /> : null}
            {tab === "buckets" ? <BucketsTab /> : null}
          </div>
          <footer className="mt-10 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              GigaBuyer UI · Next.js + Tailwind · proxied to{" "}
              <code className="kbd">/api/products/*</code>
            </span>
            <span>© {new Date().getFullYear()} GigaBuyer</span>
          </footer>
        </main>
      </ToastProvider>
    </ThemeProvider>
  );
}
