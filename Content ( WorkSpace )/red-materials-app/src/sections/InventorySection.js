import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, Building, Castle, CheckCircle2, Home, Hotel, Store, Stethoscope, TreeDeciduous } from 'lucide-react';

import { FINISHING_TYPES, INVENTORY_CATEGORIES } from '../data/content';
import { Eyebrow, Panel, SectionShell } from '../components/ui';

const categoryIcons = {
  residential: Home,
  commercial: Store,
  land: TreeDeciduous,
};

const typeIcons = {
  Apartments: Building,
  'Service Apartment': Hotel,
  'Stand Alone': Castle,
  Villas: Home,
  'Shops / Show Room': Store,
  Admin: Briefcase,
  'Medical / Pharmacy': Stethoscope,
  Land: TreeDeciduous,
};

const InventorySection = () => {
  const [activeKey, setActiveKey] = useState('residential');
  const activeCategory = INVENTORY_CATEGORIES.find((item) => item.key === activeKey) ?? INVENTORY_CATEGORIES[0];

  return (
    <SectionShell
      id="inventory"
      chapter="01"
      title="Inventory Intelligence"
      subtitle="Turn property and finishing language into a recognition system the consultant can retrieve instantly under pressure."
      summary="This chapter reduces ambiguity. Instead of remembering isolated slide bullets, the learner gets a structured taxonomy, a clearer finish ladder, and a practical way to connect product language to client intent."
      takeaways={[
        'Classify the category before comparing units.',
        'Use subtypes to sharpen fit, not to impress with vocabulary.',
        'Frame finishing level as readiness and friction, not just quality.',
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Panel className="xl:sticky xl:top-32 xl:h-fit">
          <Eyebrow>Category selector</Eyebrow>
          <div className="mt-5 grid gap-3">
            {INVENTORY_CATEGORIES.map((category) => {
              const Icon = categoryIcons[category.key];
              const isActive = category.key === activeKey;
              return (
                <button
                  type="button"
                  key={category.key}
                  onClick={() => setActiveKey(category.key)}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    isActive ? 'border-[var(--line)] bg-[rgba(179,52,32,0.16)]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${isActive ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))]' : 'bg-white/10'}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">{category.title}</div>
                      <div className="text-sm text-[var(--text-muted)]">Recognition track</div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">{category.description}</p>
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <Eyebrow>Active taxonomy</Eyebrow>
                <h3 className="mt-3 font-display text-4xl text-white">{activeCategory.title}</h3>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-soft)]">{activeCategory.description}</p>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                    <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">Listen for</div>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{activeCategory.recognitionCue}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                    <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">Sales implication</div>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{activeCategory.salesImplication}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(179,52,32,0.16),rgba(0,0,0,0.06))] p-5">
                <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">Retention rule</div>
                <div className="mt-4 text-2xl font-semibold text-white">Name the category first.</div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  Once the learner recognizes the category clearly, subtypes stop feeling like random labels and start behaving like usable options inside a system.
                </p>
              </div>
            </div>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            {activeCategory.types.map((type, index) => {
              const Icon = typeIcons[type.name] ?? Building;
              return (
                <motion.div key={type.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }}>
                  <Panel className="h-full">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))]">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="mt-4 text-2xl font-semibold text-white">{type.name}</h4>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[var(--gold)]" />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">{type.details}</p>
                    {type.subtypes.length ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {type.subtypes.map((subtype) => (
                          <span key={subtype} className="rounded-full border border-[var(--line)] bg-[rgba(179,52,32,0.16)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--accent-soft)]">
                            {subtype}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Panel>
                </motion.div>
              );
            })}
          </div>

          <Panel>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <Eyebrow>Finishing ladder</Eyebrow>
                <h3 className="mt-3 font-display text-4xl text-white">Readiness is a persuasion tool</h3>
                <div className="mt-6 space-y-4">
                  {FINISHING_TYPES.map((type) => (
                    <div key={type.name} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold text-white">{type.name}</div>
                          <div className="text-sm text-[var(--text-soft)]">{type.summary}</div>
                        </div>
                        <div className="text-2xl font-semibold text-[var(--gold)]">{type.level}%</div>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-2 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong),var(--gold))]" style={{ width: `${type.level}%` }} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{type.implication}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">Memory anchor</div>
                <div className="mt-4 space-y-3">
                  {['Category first', 'Subtype second', 'Finish level third', 'Client implication always'].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white">
                      <CheckCircle2 className="h-4 w-4 text-[var(--gold)]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </SectionShell>
  );
};

export default InventorySection;