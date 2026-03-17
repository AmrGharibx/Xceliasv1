"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Sidebar, Header } from "@/components/layout";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen bg-[#0c0a09]">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 rounded-2xl bg-rose-500/10 p-5">
              <AlertTriangle className="h-10 w-10 text-rose-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#fafaf9]">Something went wrong</h1>
            <p className="mt-3 max-w-md text-sm text-[#57534e]">
              {error.message || "An unexpected error occurred while loading this page."}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] px-5 py-2.5 text-sm font-medium text-[#d6d3d1] transition hover:bg-[#231f1d]"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
