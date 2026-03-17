import React, { useState } from 'react';
import { Brain, Heart, Quote, Sparkles } from 'lucide-react';

import { NEEDS_WANTS, PSYCHOLOGY_SIGNALS } from '../data/content';
import { Eyebrow, Panel, SectionShell } from '../components/ui';

const lenses = {
  emotional: {
    title: 'Emotion leads',
    summary: 'People often decide through feeling first, then justify the decision with logic later.',
    icon: Heart,
  },
  rational: {
    title: 'Rational language appears',
    summary: 'Even when the language sounds analytical, the buyer may still be seeking safety, certainty, or validation.',
    icon: Brain,
  },
};

const PsychologySection = () => {
  const [activeLens, setActiveLens] = useState('emotional');
  const active = lenses[activeLens];
  const ActiveIcon = active.icon;

  return (
    <SectionShell
      id="psychology"
      chapter="04"
      title="Buyer Psychology"
      subtitle="Move beyond specifications. The consultant must hear the stated request, the unstated motive, and the emotional problem the client is trying to solve."
      summary="The source deck says people do not buy the product; they buy to feel good or solve a problem. This chapter turns that idea into usable decoding logic so the learner can recognize motive, not only language."
      className="bg-[linear-gradient(180deg,transparent,rgba(98,27,18,0.18),transparent)]"
      takeaways={[
        'Surface language often hides the real motive.',
        'Emotion usually leads; logic often justifies.',
        'Translate features into relief, certainty, convenience, or status.',
      ]}
    >
      <div className="space-y-6">
        <Panel className="bg-[linear-gradient(180deg,rgba(102,126,234,0.18),rgba(255,255,255,0.03))]">
          <Eyebrow>Core thesis</Eyebrow>
          <h3 className="mt-4 max-w-4xl font-display text-4xl leading-tight text-white md:text-5xl">
            People don’t buy the product. They buy to feel good or to solve a problem.
          </h3>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--text-soft)]">
            That sentence is the pivot point of the whole training. Product knowledge matters, but persuasion improves only when the consultant can connect features to relief, confidence, status, safety, convenience, or progress.
          </p>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Panel>
            <div className="flex flex-wrap gap-2">
              {Object.entries(lenses).map(([key, lens]) => {
                const LensIcon = lens.icon;
                const isActive = key === activeLens;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setActiveLens(key)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white' : 'bg-white/5 text-[var(--text-soft)] hover:bg-white/10'
                    }`}
                  >
                    <LensIcon className="h-4 w-4" />
                    {lens.title}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))]">
                  <ActiveIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Active lens</div>
                  <div className="text-2xl font-semibold text-white">{active.title}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">{active.summary}</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">{NEEDS_WANTS.needs.title}</div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{NEEDS_WANTS.needs.description}</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">{NEEDS_WANTS.wants.title}</div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{NEEDS_WANTS.wants.description}</p>
                <div className="mt-4 space-y-2">
                  {NEEDS_WANTS.wants.details.map((detail) => (
                    <div key={detail} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white">
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="bg-[linear-gradient(180deg,rgba(198,147,84,0.12),rgba(255,255,255,0.03))]">
            <Eyebrow>Persuasion note</Eyebrow>
            <h3 className="mt-3 font-display text-3xl text-white">Surface ask versus hidden motive</h3>
            <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
              A better consultant does not reject the surface request. They translate it into the deeper need that makes the request meaningful.
            </p>
          </Panel>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {PSYCHOLOGY_SIGNALS.map((signal) => (
            <Panel key={signal.statement} className="h-full">
              <div className="flex items-center gap-2 text-[var(--accent-soft)]">
                <Quote className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.28em]">Buyer language</span>
              </div>
              <h4 className="mt-4 text-2xl font-semibold text-white">{signal.statement}</h4>
              <div className="mt-5 space-y-3 text-sm leading-6 text-[var(--text-soft)]">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">Surface meaning</div>
                  <p className="mt-2">{signal.surface}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]"><Sparkles className="h-4 w-4" /> Hidden motive</div>
                  <p className="mt-2">{signal.hidden}</p>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </SectionShell>
  );
};

export default PsychologySection;