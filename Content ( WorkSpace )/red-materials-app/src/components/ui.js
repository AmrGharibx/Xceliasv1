import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowDownRight } from 'lucide-react';

import { CHAPTER_REFERENCES, NAV_ITEMS } from '../data/content';
import { scrollToSection } from '../utils/scroll';

export const cx = (...values) => values.filter(Boolean).join(' ');

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const SectionShell = ({ id, chapter, title, subtitle, summary, takeaways = [], references, children, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });
  const sourceReferences = references ?? CHAPTER_REFERENCES[id] ?? [];
  const currentChapterIndex = NAV_ITEMS.findIndex((item) => item.id === id);
  const nextChapter = currentChapterIndex >= 0 ? NAV_ITEMS[currentChapterIndex + 1] : null;

  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ duration: 0.55 }}
      className={cx('relative px-5 py-16 md:px-8 md:py-24 lg:px-12', className)}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 grid gap-6 border-b border-white/10 pb-7 md:mb-12 md:gap-8 md:pb-8 md:grid-cols-[minmax(0,1fr)_280px] md:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-2 text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">
              <span>Chapter {chapter}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
              <span><span className="font-extrabold text-[#e8372a]">red</span> Xcelias</span>
            </div>
            <h2 className="max-w-4xl font-display text-4xl leading-none text-white md:text-6xl lg:text-7xl">{title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-soft)] md:text-lg">{subtitle}</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[var(--panel)] p-5 text-sm leading-6 text-[var(--text-soft)] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="mb-2 text-[11px] uppercase tracking-[0.32em] text-[var(--accent-soft)]">Why it matters</div>
            <p>{summary}</p>
          </div>
        </div>
        {children}
        {(takeaways.length || sourceReferences.length) ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            {takeaways.length ? (
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="mb-3 text-[11px] uppercase tracking-[0.32em] text-[var(--accent-soft)]">Chapter briefing</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {takeaways.map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-[var(--text-soft)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : <div />}
            {sourceReferences.length ? (
              <div className="rounded-[28px] border border-[var(--line)] bg-[rgba(102,126,234,0.12)] p-5">
                <div className="mb-3 text-[11px] uppercase tracking-[0.32em] text-[var(--accent-soft)]">Source traceability</div>
                <div className="flex flex-wrap gap-2">
                  {sourceReferences.map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-white">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {nextChapter ? (
          <div className="mt-8 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(102,126,234,0.08))] p-5 md:p-6">
            <div className="text-[11px] uppercase tracking-[0.32em] text-[var(--accent-soft)]">Continue the route</div>
            <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">Next chapter {nextChapter.chapter}</div>
                <h3 className="mt-3 font-display text-3xl text-white md:text-4xl">{nextChapter.label}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">{nextChapter.description}</p>
              </div>
              <SecondaryButton type="button" onClick={() => scrollToSection(nextChapter.id)} className="shrink-0">
                Enter {nextChapter.shortLabel}
                <ArrowDownRight className="ml-2 h-4 w-4" />
              </SecondaryButton>
            </div>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
};

export const Panel = ({ children, className = '', hover = true }) => (
  <motion.div
    whileHover={hover ? { y: -3, scale: 1.008 } : undefined}
    transition={{ duration: 0.22, ease: 'easeOut' }}
    className={cx(
      'relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl',
      className
    )}
  >
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(190,46,34,0.18),transparent_40%)]" />
    <div className="relative">{children}</div>
  </motion.div>
);

export const Eyebrow = ({ children, className = '' }) => (
  <div className={cx('text-xs uppercase tracking-[0.35em] text-[var(--accent-soft)]', className)}>{children}</div>
);

export const StatChip = ({ value, label }) => (
  <div className="rounded-[22px] border border-white/10 bg-black/30 px-4 py-3">
    <div className="font-display text-2xl text-white">{value}</div>
    <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{label}</div>
  </div>
);

export const TakeawayList = ({ items, className = '' }) => (
  <div className={cx('grid gap-3', className)}>
    {items.map((item) => (
      <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-[var(--text-soft)]">
        {item}
      </div>
    ))}
  </div>
);

export const PrimaryButton = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={cx(
      'inline-flex items-center justify-center rounded-full border border-[var(--accent)] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(127,22,22,0.35)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]',
      className
    )}
  />
);

export const SecondaryButton = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={cx(
      'inline-flex items-center justify-center rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]',
      className
    )}
  />
);

export const SkipLink = ({ targetId = 'main-content' }) => (
  <a
    href={`#${targetId}`}
    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-black"
  >
    Skip to main content
  </a>
);