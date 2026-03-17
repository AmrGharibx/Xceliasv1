import React, { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BookOpenText, X } from 'lucide-react';

import { CHAPTER_BRIEFS, QUICK_REFERENCE_GROUPS } from '../data/content';
import useDialogAccessibility from './useDialogAccessibility';

const QuickReferenceDrawer = ({ open, onClose }) => {
  const prefersReducedMotion = useReducedMotion();
  const closeButtonRef = useRef(null);
  const panelRef = useDialogAccessibility({ open, onClose, initialFocusRef: closeButtonRef });
  const overlayTransition = prefersReducedMotion ? { duration: 0.16 } : { duration: 0.22, ease: 'easeOut' };
  const drawerTransition = prefersReducedMotion ? { duration: 0.16 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[88]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={overlayTransition}>
          <button type="button" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-black/78 backdrop-blur-md" aria-label="Close quick reference" />

          <motion.aside
            id="briefing-dialog"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="briefing-dialog-title"
            tabIndex={-1}
            initial={{ x: '-100%', opacity: prefersReducedMotion ? 1 : 0.96 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: prefersReducedMotion ? 1 : 0.98 }}
            transition={drawerTransition}
            onClick={(event) => event.stopPropagation()}
            className="absolute left-0 top-0 flex h-full w-full flex-col border-r border-white/10 bg-[#08080b]/96 md:w-[720px]"
          >
          <div className="border-b border-white/10 p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-1.5 text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">
                  <BookOpenText className="h-4 w-4" />
                  <span>Quick reference</span>
                </div>
                <h3 id="briefing-dialog-title" className="mt-4 font-display text-3xl text-white">Field briefing notes</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                  A compressed layer for repeat use. Revisit the operating rules before a call, viewing, or qualification session without rereading the full experience.
                </p>
              </div>
              <button ref={closeButtonRef} type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:ring-offset-2 focus:ring-offset-[#08080b]" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="grid gap-4">
              <div className="rounded-[28px] border border-[var(--line)] bg-[rgba(179,52,32,0.12)] p-4 md:p-5">
                <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">Chapter notes</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {Object.entries(CHAPTER_BRIEFS).map(([key, items]) => (
                    <div key={key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">{key}</div>
                      <div className="mt-3 space-y-2">
                        {items.map((item) => (
                          <div key={item} className="text-sm leading-6 text-[var(--text-soft)]">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {QUICK_REFERENCE_GROUPS.map((group) => (
                <div key={group.title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 md:p-5">
                  <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">{group.title}</div>
                  <h4 className="mt-3 text-2xl font-semibold text-white">{group.description}</h4>
                  <div className="mt-5 grid gap-3">
                    {group.items.map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-[var(--text-soft)]">
                        {item}
                      </div>
                    ))}
                  </div>
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

export default QuickReferenceDrawer;