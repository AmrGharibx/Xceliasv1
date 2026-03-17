"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Monitor, Palette, RotateCcw, Sparkles, X, Zap } from "lucide-react";
import { useThemeStore, useVisualModeStore } from "@/stores";
import { cn } from "@/lib/utils";

interface CustomizationPanelProps {
  open: boolean;
  onClose: () => void;
}

const colorSchemes = [
  { id: "cyan", label: "Cyan", color: "#42d3ff" },
  { id: "sky", label: "Sky", color: "#77c7ff" },
  { id: "blue", label: "Blue", color: "#2f8fff" },
  { id: "green", label: "Mint", color: "#6de5c2" },
  { id: "amber", label: "Amber", color: "#f5c96a" },
  { id: "red", label: "Rose", color: "#ff7c95" },
] as const;

const backgroundStyles = [
  { id: "gradient", label: "Gradient" },
  { id: "solid", label: "Solid" },
  { id: "mesh", label: "Mesh" },
] as const;

const cardStyles = [
  { id: "glass", label: "Glass" },
  { id: "solid", label: "Solid" },
  { id: "bordered", label: "Bordered" },
] as const;

const animationSpeeds = [
  { id: "slow", label: "Slow" },
  { id: "normal", label: "Normal" },
  { id: "fast", label: "Fast" },
] as const;

const fontFamilies = [
  { id: "inter", label: "Jakarta Sans" },
  { id: "poppins", label: "Space Grotesk" },
  { id: "system", label: "System" },
] as const;

export function CustomizationPanel({ open, onClose }: CustomizationPanelProps) {
  const { config, setConfig, resetConfig } = useThemeStore();
  const { mode, toggleMode } = useVisualModeStore();

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close customization panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-[rgba(4,8,14,0.72)] backdrop-blur-md"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-[56] flex h-full w-full max-w-[360px] flex-col border-l border-white/8 bg-[rgba(8,12,22,0.95)] shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.05] text-[var(--signal-aqua)]">
                  <Palette className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Workspace</p>
                  <h2 className="font-display text-lg font-bold text-white">Customization</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-2xl border border-white/8 bg-white/[0.04] p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-muted)]">Visual mode</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (mode === "cinematic") toggleMode();
                    }}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      mode === "performance"
                        ? "border-[rgba(66,211,255,0.25)] bg-[rgba(66,211,255,0.1)] text-white"
                        : "border-white/8 bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.06]"
                    )}
                  >
                    <Zap className="mb-3 h-5 w-5 text-[var(--signal-aqua)]" />
                    <p className="text-sm font-semibold">Performance</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Sharper and lighter.</p>
                  </button>
                  <button
                    onClick={() => {
                      if (mode === "performance") toggleMode();
                    }}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      mode === "cinematic"
                        ? "border-[rgba(155,140,255,0.25)] bg-[rgba(155,140,255,0.1)] text-white"
                        : "border-white/8 bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.06]"
                    )}
                  >
                    <Sparkles className="mb-3 h-5 w-5 text-[var(--signal-violet)]" />
                    <p className="text-sm font-semibold">Cinematic</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Heavier visual presence.</p>
                  </button>
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-muted)]">Color scheme</p>
                <div className="grid grid-cols-2 gap-3">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => setConfig({ colorScheme: scheme.id, primaryColor: scheme.color })}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all",
                        config.colorScheme === scheme.id
                          ? "border-[rgba(66,211,255,0.25)] bg-[rgba(66,211,255,0.1)] text-white"
                          : "border-white/8 bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.06]"
                      )}
                    >
                      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: scheme.color }} />
                      <span>{scheme.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-muted)]">Background</p>
                <div className="grid grid-cols-3 gap-2">
                  {backgroundStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setConfig({ backgroundStyle: style.id })}
                      className={cn(
                        "rounded-2xl border px-3 py-2 text-xs font-medium transition-all",
                        config.backgroundStyle === style.id
                          ? "border-[rgba(66,211,255,0.25)] bg-[rgba(66,211,255,0.1)] text-white"
                          : "border-white/8 bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.06]"
                      )}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-muted)]">Card density</p>
                <div className="grid grid-cols-3 gap-2">
                  {cardStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setConfig({ cardStyle: style.id })}
                      className={cn(
                        "rounded-2xl border px-3 py-2 text-xs font-medium transition-all",
                        config.cardStyle === style.id
                          ? "border-[rgba(66,211,255,0.25)] bg-[rgba(66,211,255,0.1)] text-white"
                          : "border-white/8 bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.06]"
                      )}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-muted)]">Animation speed</p>
                <div className="grid grid-cols-3 gap-2">
                  {animationSpeeds.map((speed) => (
                    <button
                      key={speed.id}
                      onClick={() => setConfig({ animationSpeed: speed.id })}
                      className={cn(
                        "rounded-2xl border px-3 py-2 text-xs font-medium transition-all",
                        config.animationSpeed === speed.id
                          ? "border-[rgba(66,211,255,0.25)] bg-[rgba(66,211,255,0.1)] text-white"
                          : "border-white/8 bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.06]"
                      )}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-muted)]">Typography</p>
                <div className="grid grid-cols-1 gap-2">
                  {fontFamilies.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setConfig({ fontFamily: font.id })}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-3 py-3 text-sm transition-all",
                        config.fontFamily === font.id
                          ? "border-[rgba(66,211,255,0.25)] bg-[rgba(66,211,255,0.1)] text-white"
                          : "border-white/8 bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.06]"
                      )}
                    >
                      <span>{font.label}</span>
                      <Monitor className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3 rounded-[26px] border border-white/8 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Compact density</p>
                    <p className="text-xs text-[var(--text-muted)]">Tighten spacing for data-heavy pages.</p>
                  </div>
                  <button
                    onClick={() => setConfig({ compactMode: !config.compactMode })}
                    className={cn(
                      "h-7 w-12 rounded-full border transition-all",
                      config.compactMode ? "border-[rgba(66,211,255,0.3)] bg-[rgba(66,211,255,0.18)]" : "border-white/10 bg-white/[0.05]"
                    )}
                  >
                    <span
                      className={cn(
                        "block h-5 w-5 rounded-full bg-white transition-transform",
                        config.compactMode ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Sparklines</p>
                    <p className="text-xs text-[var(--text-muted)]">Show extra micro-visuals in summaries.</p>
                  </div>
                  <button
                    onClick={() => setConfig({ showSparklines: !config.showSparklines })}
                    className={cn(
                      "h-7 w-12 rounded-full border transition-all",
                      config.showSparklines ? "border-[rgba(66,211,255,0.3)] bg-[rgba(66,211,255,0.18)]" : "border-white/10 bg-white/[0.05]"
                    )}
                  >
                    <span
                      className={cn(
                        "block h-5 w-5 rounded-full bg-white transition-transform",
                        config.showSparklines ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </section>
            </div>

            <div className="border-t border-white/8 px-5 py-4">
              <button
                onClick={resetConfig}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Reset customizations
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
