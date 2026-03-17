import React from 'react';
import { ArrowUp, BookMarked, Flag } from 'lucide-react';

import { MASTERY_RECAP } from '../data/content';
import { Eyebrow, Panel, PrimaryButton, SecondaryButton, SectionShell } from '../components/ui';
import { scrollToSection } from '../utils/scroll';

const scrollToTop = () => scrollToSection('hero');

const MasterySection = ({ onOpenSource }) => (
  <SectionShell
    id="mastery"
    chapter="07"
    title="Field Recap"
    subtitle="End the experience with a concise operating model the learner can revisit quickly before calls, viewings, and qualification sessions."
    summary="Strong endings matter. This recap compresses the journey into a memorable final structure so the product closes with clarity rather than simply running out of sections."
    takeaways={[
      'Recognize inventory clearly.',
      'Qualify before you present.',
      'Position through motive and close with direction.',
    ]}
  >
    <div className="space-y-6">
      <Panel className="bg-[linear-gradient(180deg,rgba(102,126,234,0.16),rgba(255,255,255,0.03))]">
        <Eyebrow>Final doctrine</Eyebrow>
        <h3 className="mt-3 max-w-4xl font-display text-4xl leading-tight text-white md:text-5xl">
          Recognize clearly. Qualify precisely. Position intelligently. Present credibly. Close directionally.
        </h3>
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryButton onClick={scrollToTop}>
            Return to top
            <ArrowUp className="ml-2 h-4 w-4" />
          </PrimaryButton>
          <SecondaryButton onClick={onOpenSource}>
            <BookMarked className="mr-2 h-4 w-4" />
            Reopen source archive
          </SecondaryButton>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MASTERY_RECAP.map((item) => (
          <Panel key={item.title} className="h-full">
            <div className="flex items-center gap-2 text-[var(--accent-soft)]">
              <Flag className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.28em]">Takeaway</span>
            </div>
            <h4 className="mt-4 text-2xl font-semibold text-white">{item.title}</h4>
            <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{item.detail}</p>
          </Panel>
        ))}
      </div>

      <Panel className="bg-[linear-gradient(180deg,rgba(198,147,84,0.12),rgba(255,255,255,0.03))]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <Eyebrow>Tomorrow morning ritual</Eyebrow>
            <h3 className="mt-3 font-display text-4xl text-white md:text-5xl">Leave with a repeatable operating cadence</h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)] md:text-base">
              Before the next call or viewing, revisit the briefing, name the inventory correctly, extract the brief before presenting, and guide the conversation with a clear motive-based angle.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                'Open the quick briefing before the call starts.',
                'Use category, subtype, and finish level in that order.',
                'Translate the buyer motive into a directional close.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-[var(--text-soft)]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-[rgba(102,126,234,0.14)] p-5">
            <div className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Chapter-end payoff</div>
            <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
              The experience should not end as inspiration. It should end as a usable sales routine the consultant can reopen, rehearse, and apply with less friction under pressure.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  </SectionShell>
);

export default MasterySection;