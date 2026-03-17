import React from 'react';
import { AlertTriangle, CheckCircle2, PhoneCall, Volume2 } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { CALLS_DATA } from '../data/content';
import { Eyebrow, Panel, SectionShell } from '../components/ui';

const pieColors = ['#b33420', '#d16f42', '#c69354'];

const CallsSection = () => (
  <SectionShell
    id="calls"
    chapter="06"
    title="Call Control"
    subtitle="Calls are not only about what is said. They are about direction, energy, clarity, rapport, and whether the conversation keeps moving toward an outcome."
    summary="The original material covers ABC, communication retention, common mistakes, and rapport. This redesign turns those ideas into a tactical communication chapter that is easier to scan, remember, and apply in live conversations."
    className="bg-[linear-gradient(180deg,transparent,rgba(91,20,16,0.22),transparent)]"
    takeaways={[
      'Always Be Closing means preserve direction, not pressure prematurely.',
      'Delivery changes how meaning lands.',
      'Rapport is adaptive control, not performance theater.',
    ]}
  >
    <div className="space-y-6">
      <Panel className="bg-[linear-gradient(180deg,rgba(179,52,32,0.18),rgba(255,255,255,0.03))]">
        <Eyebrow>A.B.C. principle</Eyebrow>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="font-display text-5xl text-white md:text-6xl">Always Be Closing</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
              Closing here does not mean rushing. It means maintaining direction. Every question, clarification, and reassurance should move the conversation closer to a defined next step.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-black/20 px-5 py-4 text-sm leading-6 text-[var(--text-soft)]">
            How to qualify someone during the call starts with a directional mindset, not a script.
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <Eyebrow>Communication retention</Eyebrow>
          <h3 className="mt-3 font-display text-4xl text-white">How communication is retained</h3>
          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-3">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={CALLS_DATA.communication} dataKey="value" innerRadius={78} outerRadius={112} paddingAngle={5}>
                    {CALLS_DATA.communication.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Weight']}
                    contentStyle={{
                      backgroundColor: '#111214',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '14px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {CALLS_DATA.communication.map((item, index) => (
                <div key={item.name} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-white">{item.name}</div>
                      <div className="text-sm text-[var(--text-soft)]">{item.note}</div>
                    </div>
                    <div className="text-3xl font-semibold" style={{ color: pieColors[index] }}>{item.value}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="bg-[linear-gradient(180deg,rgba(198,147,84,0.12),rgba(255,255,255,0.03))]">
          <Eyebrow>Call posture</Eyebrow>
          <div className="mt-4 space-y-4 text-sm leading-6 text-[var(--text-soft)]">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-white"><PhoneCall className="h-4 w-4 text-[var(--gold)]" /> Direction</div>
              <p>Know the next step you want before you begin the call.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-white"><Volume2 className="h-4 w-4 text-[var(--gold)]" /> Delivery</div>
              <p>Mirror tone and volume without sounding artificial or rehearsed.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-white"><CheckCircle2 className="h-4 w-4 text-[var(--gold)]" /> Close logic</div>
              <p>Summarize value, remove confusion, and make the next action feel natural.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="mb-7 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-[var(--gold)]" />
          <div>
            <Eyebrow>Failure patterns</Eyebrow>
            <h3 className="mt-2 font-display text-4xl text-white">Common mistakes during the call</h3>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {CALLS_DATA.mistakes.map((mistake) => (
            <div key={mistake} className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-[var(--text-soft)]">
              {mistake}
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <Eyebrow>Rapport</Eyebrow>
        <h3 className="mt-3 font-display text-4xl text-white">Mirror without becoming mechanical</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {CALLS_DATA.rapport.map((item) => (
            <div key={item} className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-6 text-[var(--text-soft)]">
              {item}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  </SectionShell>
);

export default CallsSection;