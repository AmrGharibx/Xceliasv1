"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, RefreshCw, Users, GraduationCap, Building2 } from "lucide-react";

type SearchResult = {
  type: "trainee" | "batch" | "company";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
};

const OPEN_EVENT = "avaria:openPalette";

export function openCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CommandPalette() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSelectedIndex(0); setLoading(false); return; }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=14`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults((data?.results || []) as SearchResult[]);
          setSelectedIndex(0);
        } else {
          setResults([]);
        }
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [open, query]);

  const close = React.useCallback(() => setOpen(false), []);
  const go = React.useCallback((r: SearchResult | undefined) => {
    if (!r) return;
    close();
    router.push(r.url);
  }, [close, router]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/75 pt-[15vh] backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#a8a29e]/6 bg-[#1c1917]/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            {/* Search input bar */}
            <div className="flex items-center gap-3 border-b border-[#a8a29e]/6 px-4 py-4">
              <Search className="h-5 w-5 text-[#57534e]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1))); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
                  else if (e.key === "Enter") { e.preventDefault(); go(results[selectedIndex]); }
                  else if (e.key === "Escape") { e.preventDefault(); close(); }
                }}
                placeholder="Search trainees, companies, batches..."
                className="flex-1 bg-transparent text-lg text-white placeholder-[#44403c] outline-none"
                autoFocus
              />
              {loading && (
                <motion.div className="h-5 w-5" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <RefreshCw className="h-5 w-5 text-[#57534e]" />
                </motion.div>
              )}
              <kbd className="rounded bg-[#231f1d]/60 px-2 py-1 text-xs text-[#57534e]">ESC</kbd>
            </div>

            {/* Results body */}
            <div className="max-h-80 overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-[#57534e]">Type at least 2 characters to searchâ€¦</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <span className="rounded-lg bg-[#231f1d]/50 px-3 py-1.5 text-xs text-[#78716c]">Trainees</span>
                    <span className="rounded-lg bg-[#231f1d]/50 px-3 py-1.5 text-xs text-[#78716c]">Companies</span>
                    <span className="rounded-lg bg-[#231f1d]/50 px-3 py-1.5 text-xs text-[#78716c]">Batches</span>
                  </div>
                </div>
              ) : !loading && results.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-[#57534e]">No results found for &ldquo;{query.trim()}&rdquo;</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((r, i) => (
                    <motion.button
                      key={`${r.type}-${r.id}`}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => go(r)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition ${
                        i === selectedIndex ? "bg-emerald-500/10 text-white" : "text-[#d6d3d1] hover:bg-[#231f1d]/50"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          r.type === "trainee"
                            ? "bg-teal-500/10 text-teal-400"
                            : r.type === "company"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {r.type === "trainee" ? (
                          <Users className="h-5 w-5" />
                        ) : r.type === "company" ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          <GraduationCap className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{r.title}</p>
                        {r.subtitle && <p className="truncate text-sm text-[#57534e]">{r.subtitle}</p>}
                      </div>
                      <span className="rounded-full bg-[#231f1d]/50 px-2 py-0.5 text-xs capitalize text-[#57534e]">
                        {r.type}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div className="border-t border-[#a8a29e]/6 px-4 py-2">
                <div className="flex items-center justify-between text-xs text-[#57534e]">
                  <span>{results.length} results</span>
                  <div className="flex items-center gap-4">
                    <span>â†‘â†“ Navigate</span>
                    <span>â†µ Select</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
