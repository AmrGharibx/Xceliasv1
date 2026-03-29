import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, BookMarked, Compass, ShieldCheck, Sparkles, Target } from 'lucide-react';

import { HERO_PROMISES, HERO_STATS, NAV_ITEMS } from '../data/content';
import { Eyebrow, Panel, PrimaryButton, SecondaryButton, StatChip, TakeawayList } from '../components/ui';
import { scrollToSection } from '../utils/scroll';

const HeroSection = ({ onOpenSource, onOpenMap }) => {
  const route = NAV_ITEMS.filter((item) => item.id !== 'hero');

  return (
    <section id="hero" className="relative min-h-screen px-5 pb-14 pt-28 md:px-8 md:pb-20 md:pt-36 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.08fr)_420px] lg:items-start xl:grid-cols-[minmax(0,1fr)_460px]">
        <div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-2 text-xs uppercase tracking-[0.32em] text-[var(--accent-soft)]">
              <ShieldCheck className="h-4 w-4" />
              <span>Immersive sales mastery system</span>
            </div>
            <Eyebrow className="mt-8">Executive training experience</Eyebrow>
            <h1 className="mt-4 max-w-5xl font-display text-5xl leading-[0.92] text-white md:text-7xl xl:text-[6.2rem]">
              Red Materials
              <span className="mt-2 block font-sans text-lg font-medium uppercase tracking-[0.32em] text-[var(--gold)] md:text-2xl">
                The Ultimate Real Estate Mastery
              </span>
              <span className="mt-1 block font-sans text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
                <span className="font-extrabold text-[#e8372a]">by red</span> Training Academy
              </span>
            </h1>
            <p className="mt-8 max-w-3xl text-lg leading-8 text-[var(--text-soft)] md:text-xl">
              A premium, chapter-based field guide for real-estate consultants who need to classify inventory clearly, qualify demand precisely, read buyer motives intelligently, and control calls with authority.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3 md:mt-10"
          >
            <PrimaryButton onClick={() => scrollToSection('inventory')}>
              Enter the training
              <ArrowDownRight className="ml-2 h-4 w-4" />
            </PrimaryButton>
            <SecondaryButton onClick={onOpenMap}>
              <Compass className="mr-2 h-4 w-4" />
              View chapter map
            </SecondaryButton>
            <SecondaryButton onClick={onOpenSource}>
              <BookMarked className="mr-2 h-4 w-4" />
              Open source archive
            </SecondaryButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 grid gap-3 md:mt-10 md:grid-cols-3"
          >
            {HERO_STATS.map((item) => (
              <StatChip key={item.label} value={item.value} label={item.label} />
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 grid gap-5 md:mt-10 xl:grid-cols-[minmax(0,1fr)_280px]"
          >
            <Panel>
              <Eyebrow>What you will master</Eyebrow>
              <h2 className="mt-4 font-display text-3xl text-white md:text-4xl">From slide content to field-ready judgment</h2>
              <TakeawayList items={HERO_PROMISES} className="mt-6" />
            </Panel>

            <Panel className="bg-[linear-gradient(180deg,rgba(102,126,234,0.12),rgba(255,255,255,0.03))]">
              <Eyebrow>Training posture</Eyebrow>
              <div className="mt-5 space-y-4 text-sm leading-6 text-[var(--text-soft)]">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-white"><Target className="h-4 w-4 text-[var(--gold)]" /> Precision over volume</div>
                  <p>Extract the real brief before presenting options.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-white"><Sparkles className="h-4 w-4 text-[var(--gold)]" /> Presence with discipline</div>
                  <p>Style, tone, and credibility should strengthen the case, not distract from it.</p>
                </div>
              </div>
            </Panel>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <Panel className="sticky top-28 overflow-hidden md:top-32">
            <Eyebrow>Mastery route</Eyebrow>
            <h2 className="mt-4 font-display text-3xl text-white">Seven systems. One operating model.</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
              The experience moves from recognition, to qualification, to persuasion, to performance. Each chapter is revisitable on its own, but together they form a sharper sales discipline.
            </p>
            <div className="mt-7 space-y-3">
              {route.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="flex w-full items-start gap-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-left transition hover:bg-white/[0.06]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <div className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;