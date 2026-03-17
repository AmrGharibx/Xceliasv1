import React, { useMemo, useState } from 'react';
import { Calendar, DollarSign, History, LayoutGrid, MapPin, Palette, Star } from 'lucide-react';

import { REQUEST_PILLARS } from '../data/content';
import { Eyebrow, Panel, SectionShell } from '../components/ui';

const iconMap = {
  Destination: MapPin,
  'Unit type / area': LayoutGrid,
  Delivery: Calendar,
  'Finishing Specs': Palette,
  'Developer Category': Star,
  'History (Viewed Prev / Objections)': History,
  'Budget / Down payment / Quarter': DollarSign,
};

const RequestSection = () => {
  const [activeLabel, setActiveLabel] = useState(REQUEST_PILLARS[0].label);
  const activePillar = REQUEST_PILLARS.find((item) => item.label === activeLabel) ?? REQUEST_PILLARS[0];
  const groups = useMemo(() => [...new Set(REQUEST_PILLARS.map((item) => item.group))], []);

  return (
    <SectionShell
      id="request"
      chapter="03"
      title="Qualification Command Center"
      subtitle="Treat the request as signal extraction, not note-taking. Each field is there to improve fit, expose risk, and accelerate the right recommendation."
      summary="The original deck names the inputs. This redesign turns them into a staged operating system so the learner understands what each signal means, what to listen for, and what breaks when it is skipped."
      takeaways={[
        'The request is a decision filter, not a form.',
        'History and objections often reveal the real friction point.',
        'If destination or budget stays vague, the shortlist stays weak.',
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <span key={group} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                {group}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {REQUEST_PILLARS.map((pillar) => {
              const Icon = iconMap[pillar.label];
              const isActive = pillar.label === activeLabel;
              return (
                <button
                  type="button"
                  key={pillar.label}
                  onClick={() => setActiveLabel(pillar.label)}
                  className={`rounded-[24px] border p-4 text-left transition ${
                    isActive ? 'border-[var(--line)] bg-[rgba(102,126,234,0.16)]' : 'border-white/10 bg-black/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${isActive ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))]' : 'bg-white/10'}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">{pillar.group}</div>
                      <div className="text-lg font-semibold text-white">{pillar.label}</div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">{pillar.why}</p>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="xl:sticky xl:top-32 xl:h-fit bg-[linear-gradient(180deg,rgba(102,126,234,0.12),rgba(255,255,255,0.03))]">
          <Eyebrow>Selected signal</Eyebrow>
          <h3 className="mt-3 font-display text-4xl text-white">{activePillar.label}</h3>
          <div className="mt-5 space-y-4 text-sm leading-6 text-[var(--text-soft)]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">Why it matters</div>
              <p className="mt-2">{activePillar.why}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">Listen for</div>
              <p className="mt-2">{activePillar.listenFor}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">Risk if skipped</div>
              <p className="mt-2">{activePillar.risk}</p>
            </div>
          </div>
        </Panel>
      </div>
    </SectionShell>
  );
};

export default RequestSection;