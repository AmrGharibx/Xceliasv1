"use client";

import { AlertTriangle, Home } from "lucide-react";
import Link from "next/link";
import { Sidebar, Header } from "@/components/layout";

export default function NotFound() {
  return (
    <div className="flex min-h-screen bg-[#0c0a09]">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 rounded-2xl bg-amber-500/10 p-5">
              <AlertTriangle className="h-10 w-10 text-amber-400" />
            </div>
            <h1 className="text-5xl font-extrabold text-gradient">404</h1>
            <p className="mt-3 text-lg font-medium text-[#d6d3d1]">Page not found</p>
            <p className="mt-2 max-w-md text-sm text-[#57534e]">
              The page you are looking for doesn&apos;t exist or has been moved.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
