import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Copy, Search, Shield, X } from 'lucide-react';

import { SOURCE_DECK } from '../data/content';
import useDialogAccessibility from './useDialogAccessibility';

const parseSlides = (source) => {
  const parts = source.split(/(?=== SLIDE \d+ ===)/g).map((part) => part.trim()).filter(Boolean);
  return parts.map((part) => {
    const [header, ...body] = part.split('\n');
    return {
      header,
      body: body.join('\n').trim(),
    };
  });
};

const SourceDeckDrawer = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const closeButtonRef = useRef(null);
  const panelRef = useDialogAccessibility({ open, onClose, initialFocusRef: closeButtonRef });
  const slides = useMemo(() => parseSlides(SOURCE_DECK), []);
  const overlayTransition = prefersReducedMotion ? { duration: 0.16 } : { duration: 0.22, ease: 'easeOut' };
  const drawerTransition = prefersReducedMotion ? { duration: 0.16 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

  const filteredSlides = useMemo(() => {
    if (!query.trim()) {
      return slides;
    }
    const normalized = query.toLowerCase();
    return slides.filter((slide) => `${slide.header}\n${slide.body}`.toLowerCase().includes(normalized));
  }, [query, slides]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SOURCE_DECK);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[90]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={overlayTransition}>
          <motion.button
            type="button"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-black/78 backdrop-blur-md"
            aria-label="Close source deck"
          />

          <motion.aside
            id="source-deck-dialog"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-deck-dialog-title"
            tabIndex={-1}
            initial={{ x: '100%', opacity: prefersReducedMotion ? 1 : 0.96 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: prefersReducedMotion ? 1 : 0.98 }}
            transition={drawerTransition}
            onClick={(event) => event.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full flex-col border-l border-white/10 bg-[#08080b]/96 md:w-[760px]"
          >
            <div className="border-b border-white/10 p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-1.5 text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">
                    <Shield className="h-4 w-4" />
                    <span>Verbatim Source Archive</span>
                  </div>
                  <h3 id="source-deck-dialog-title" className="mt-4 font-display text-3xl text-white">Transcript integrity layer</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                    Every extracted slide reference remains available here so the polished experience never drifts away from the original training material.
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:ring-offset-2 focus:ring-offset-[#08080b]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <label className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search slides, phrases, or source wording"
                    className="w-full rounded-full border border-white/10 bg-white/5 px-11 py-3 text-sm text-white outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(102,126,234,0.18)]"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy all'}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                <span>{slides.length} slides parsed</span>
                <span>{filteredSlides.length} slides visible</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid gap-4">
                {filteredSlides.map((slide) => (
                  <div key={slide.header} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 md:p-5">
                    <div className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">{slide.header}</div>
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[var(--text-soft)]">{slide.body || ' '}</pre>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default SourceDeckDrawer;