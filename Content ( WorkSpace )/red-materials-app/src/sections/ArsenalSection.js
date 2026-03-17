import React from 'react';
import { Eye, Gem, Palette, Shirt, Sparkles, User, Watch } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';

import { ARSENAL_ACCESSORIES, ARSENAL_SKILLS } from '../data/content';
import { Eyebrow, Panel, SectionShell } from '../components/ui';

const accessoryIcons = [Shirt, Palette, Gem, Sparkles, Watch, Shirt, Shirt, Sparkles, Shirt, Gem, Eye, Gem, User];

const ArsenalSection = () => (
  <SectionShell
    id="arsenal"
    chapter="05"
    title="Consultant Arsenal"
    subtitle="Combine capability, presence, and presentation into a stronger first impression and a more credible sales posture."
    summary="The source deck covers skills, dress code, and the seven-point rule. This redesign turns those ideas into a more coherent performance framework so the learner understands what must feel strong before, during, and after the conversation."
    takeaways={[
      'Presence should strengthen trust before details appear.',
      'Skill quality is felt through clarity and composure.',
      'The 7-point rule protects visual discipline, not style for its own sake.',
    ]}
  >
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <Eyebrow>Performance radar</Eyebrow>
          <h3 className="mt-3 font-display text-4xl text-white">Skills and qualities of a successful sales individual</h3>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-3">
              {ARSENAL_SKILLS.map((item) => (
                <div key={item.skill} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-white">{item.skill}</div>
                      <div className="text-sm text-[var(--text-soft)]">{item.priority}</div>
                    </div>
                    <div className="text-2xl font-semibold text-[var(--gold)]">{item.value}</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong),var(--gold))]" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-3">
              <ResponsiveContainer width="100%" height={360}>
                <RadarChart data={ARSENAL_SKILLS}>
                  <PolarGrid stroke="rgba(255,255,255,0.15)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#e4d9cc', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#8d8580', fontSize: 10 }} />
                  <Radar dataKey="value" stroke="#b33420" fill="#b33420" fillOpacity={0.32} strokeWidth={2} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111214',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '14px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>

        <Panel className="bg-[linear-gradient(180deg,rgba(198,147,84,0.12),rgba(255,255,255,0.03))]">
          <Eyebrow>Presence doctrine</Eyebrow>
          <h3 className="mt-3 font-display text-3xl text-white">You never have a second chance to make a first impression.</h3>
          <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
            The most credible visual system is disciplined, not noisy. Presentation should reduce friction, build trust, and communicate that the consultant is organized, observant, and serious.
          </p>
          <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-6 text-[var(--text-soft)]">
            Studies show it can take 21 repeated good experiences with a person to make up for a bad first impression.
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Dress code control</Eyebrow>
            <h3 className="mt-3 font-display text-4xl text-white">7 Rules of Accessories</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
              The rule is simple: too many points of interest compete with each other. Keep style intentional enough to be memorable, but controlled enough to feel composed.
            </p>
          </div>
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--line)] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] font-display text-4xl text-white shadow-[0_24px_60px_rgba(127,22,22,0.35)]">
            7
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {ARSENAL_ACCESSORIES.map((item, index) => {
            const Icon = accessoryIcons[index] ?? Sparkles;
            return (
              <div key={item} className={`rounded-[24px] border p-4 ${index < 7 ? 'border-[var(--line)] bg-[rgba(179,52,32,0.14)]' : 'border-white/10 bg-black/20'}`}>
                <Icon className={`h-5 w-5 ${index < 7 ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'}`} />
                <div className="mt-4 text-sm leading-6 text-white">{item}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-6 text-[var(--text-soft)]">
          The reason is that any more than seven points could be too overwhelming for the eyes.
        </div>
      </Panel>
    </div>
  </SectionShell>
);

export default ArsenalSection;