import React, { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BookOpenText, Building2, Compass, ScrollText, X } from 'lucide-react';

import { NAV_ITEMS } from '../data/content';
import { scrollToSection } from '../utils/scroll';
import useDialogAccessibility from './useDialogAccessibility';

export const ProgressBar = ({ progress }) => (
  <div className="fixed left-0 right-0 top-0 z-[70] h-[3px] bg-white/5">
    <motion.div className="h-full origin-left bg-[linear-gradient(90deg,var(--accent),var(--accent-strong),var(--gold))]" style={{ scaleX: progress }} />
  </div>
);

export const TopNavigation = ({ activeSection, onOpenMap, onOpenSource, onOpenBriefing, mapOpen, sourceOpen, briefingOpen }) => {
  const active = NAV_ITEMS.find((item) => item.id === activeSection) ?? NAV_ITEMS[0];

  return (
    <div className="fixed inset-x-0 top-3 z-[65] px-3 md:px-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 rounded-[28px] border border-white/10 bg-black/30 px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:px-5">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => scrollToSection('hero')} className="flex items-center gap-3 rounded-full text-left text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white shadow-[0_12px_30px_rgba(127,22,22,0.35)]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-soft)]">Red Materials</div>
              <div className="text-sm font-semibold md:text-base">The Ultimate Real Estate Mastery</div>
            </div>
          </button>

          <div className="hidden min-w-0 items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 md:flex">
            <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Live chapter</span>
            <span className="min-w-0 truncate text-sm font-semibold text-white">{active.chapter} / {active.label}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenMap}
              aria-haspopup="dialog"
              aria-expanded={mapOpen}
              aria-controls="chapter-map-dialog"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
            >
              <Compass className="h-4 w-4" />
              <span className="hidden md:inline">Chapter map</span>
            </button>
            <button
              type="button"
              onClick={onOpenBriefing}
              aria-haspopup="dialog"
              aria-expanded={briefingOpen}
              aria-controls="briefing-dialog"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
            >
              <BookOpenText className="h-4 w-4" />
              <span className="hidden md:inline">Briefing</span>
            </button>
            <button
              type="button"
              onClick={onOpenSource}
              aria-haspopup="dialog"
              aria-expanded={sourceOpen}
              aria-controls="source-deck-dialog"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[rgba(102,126,234,0.18)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
            >
              <ScrollText className="h-4 w-4" />
              <span className="hidden md:inline">Source deck</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Chapter navigation" role="navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === activeSection;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] ${
                  isActive ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white' : 'bg-white/5 text-[var(--text-soft)] hover:bg-white/10'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.shortLabel}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ChapterMapDrawer = ({ open, activeSection, onClose }) => {
  const prefersReducedMotion = useReducedMotion();
  const closeButtonRef = useRef(null);
  const panelRef = useDialogAccessibility({ open, onClose, initialFocusRef: closeButtonRef });
  const overlayTransition = prefersReducedMotion ? { duration: 0.16 } : { duration: 0.22, ease: 'easeOut' };
  const drawerTransition = prefersReducedMotion ? { duration: 0.16 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[85]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={overlayTransition}>
          <button type="button" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-black/78 backdrop-blur-md" aria-label="Close chapter map" />

          <motion.div
            id="chapter-map-dialog"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chapter-map-dialog-title"
            tabIndex={-1}
            initial={{ y: prefersReducedMotion ? 0 : -22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: prefersReducedMotion ? 0 : -16, opacity: 0 }}
            transition={drawerTransition}
            onClick={(event) => event.stopPropagation()}
            className="absolute left-1/2 top-16 w-[min(960px,calc(100%-20px))] -translate-x-1/2 rounded-[32px] border border-white/10 bg-[#0a0a0d]/96 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.5)] md:top-20 md:w-[min(960px,calc(100%-24px))] md:p-6"
          >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">Chapter map</div>
              <h3 id="chapter-map-dialog-title" className="mt-3 font-display text-4xl text-white">Mastery route</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                Every chapter is designed as a progression from recognition to application so the learner can revisit specific systems without losing the overall story.
              </p>
            </div>
            <button ref={closeButtonRef} type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:ring-offset-2 focus:ring-offset-[#0a0a0d]" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === activeSection;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    scrollToSection(item.id);
                    onClose();
                  }}
                  className={`rounded-[24px] border px-5 py-5 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:ring-offset-2 focus:ring-offset-[#0a0a0d] ${
                    isActive ? 'border-[var(--line)] bg-[rgba(102,126,234,0.14)]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Chapter {item.chapter}</div>
                  <div className="mt-3 text-xl font-semibold text-white">{item.label}</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{item.description}</p>
                </button>
              );
            })}
          </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};