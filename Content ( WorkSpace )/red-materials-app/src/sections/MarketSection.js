import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Building2, CheckCircle2, Landmark, Users } from 'lucide-react';

import { MARKET_COMPARISON, PRIMARY_RESALE } from '../data/content';
import { Eyebrow, Panel, SectionShell } from '../components/ui';

const iconMap = {
  broker: Users,
  developer: Building2,
  primary: Landmark,
  resale: Users,
};

const MarketSection = () => {
  const [activeMode, setActiveMode] = useState('broker');
  const activeProfile = MARKET_COMPARISON[activeMode];

  return (
    <SectionShell
      id="market"
      chapter="02"
      title="Market Models"
      subtitle="Replace vague comparisons with sharper tradeoff logic so the consultant can explain structure, fit, and downside with confidence."
      summary="This chapter turns two common comparisons into a usable positioning framework. Instead of memorizing bullet lists, the learner sees why each model wins, where it weakens, and how to frame it on a call or viewing."
      className="bg-[linear-gradient(180deg,transparent,rgba(91,20,16,0.14),transparent)]"
      takeaways={[
        'Every market model wins under different client conditions.',
        'Primary trades certainty for flexibility more often than resale.',
        'The consultant should explain tradeoffs, not just list facts.',
      ]}
    >
      <div className="space-y-6">
        <Panel>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Comparison system</Eyebrow>
              <h3 className="mt-3 font-display text-4xl text-white">Broker vs Developer</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                The strongest consultant does not only define the model. They explain what that model gives the client and what the client sacrifices in exchange.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(MARKET_COMPARISON).map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setActiveMode(key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    key === activeMode ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white' : 'bg-white/5 text-[var(--text-soft)] hover:bg-white/10'
                  }`}
                >
                  {MARKET_COMPARISON[key].title}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(MARKET_COMPARISON).map(([key, profile]) => {
                const Icon = iconMap[key];
                const isActive = key === activeMode;
                return (
                  <Panel key={key} className={isActive ? 'border-[var(--line)] bg-[linear-gradient(180deg,rgba(179,52,32,0.16),rgba(255,255,255,0.03))]' : ''}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isActive ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))]' : 'bg-white/10'}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">{profile.subtitle}</div>
                        <div className="text-2xl font-semibold text-white">{profile.title}</div>
                      </div>
                    </div>
                    <div className="mt-6 space-y-3">
                      {profile.points.map((point) => (
                        <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-[var(--text-soft)]">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--gold)]" />
                          {point}
                        </div>
                      ))}
                    </div>
                  </Panel>
                );
              })}
            </div>

            <Panel className="bg-[linear-gradient(180deg,rgba(198,147,84,0.14),rgba(255,255,255,0.03))]">
              <Eyebrow>Active framing</Eyebrow>
              <h4 className="mt-3 text-3xl font-semibold text-white">{activeProfile.title}</h4>
              <div className="mt-5 space-y-4 text-sm leading-6 text-[var(--text-soft)]">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">Where it wins</div>
                  <p className="mt-2">{activeProfile.edge}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">What to watch</div>
                  <p className="mt-2">{activeProfile.caution}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">How to lead</div>
                  <p className="mt-2">{activeProfile.move}</p>
                </div>
              </div>
            </Panel>
          </div>
        </Panel>

        <Panel>
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))]">
              <ArrowRightLeft className="h-5 w-5 text-white" />
            </div>
            <div>
              <Eyebrow>Decision structure</Eyebrow>
              <h3 className="mt-2 font-display text-4xl text-white">Primary vs Resale</h3>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(PRIMARY_RESALE).map(([key, profile], index) => {
              const Icon = iconMap[key];
              return (
                <motion.div key={key} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                  <Panel className="h-full">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))]">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">{profile.subtitle}</div>
                        <div className="text-2xl font-semibold text-white">{profile.title}</div>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      {profile.points.map((point) => (
                        <div key={point} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-[var(--text-soft)]">
                          {point}
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[rgba(179,52,32,0.14)] p-4 text-sm leading-6 text-[var(--text-soft)]">
                      <div className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">Best used when</div>
                      <p className="mt-2">{profile.opportunity}</p>
                    </div>
                  </Panel>
                </motion.div>
              );
            })}
          </div>
        </Panel>
      </div>
    </SectionShell>
  );
};

export default MarketSection;