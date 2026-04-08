/* global fetch, localStorage */
"use strict";

// ══════════════════════════════════════════════════════════════════════
//  PITCH LAB — AI Call Simulation Studio
//  All DOM writes use escHtml() for any server/AI-derived content.
// ══════════════════════════════════════════════════════════════════════

/* ── XSS safety ── */
function escHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(String(str == null ? "" : str)));
  return d.innerHTML;
}

/* ── Language state ── */
let lang = localStorage.getItem("pitchlab_lang") || "en";

function t(el) {
  if (!el) return;
  const text = el.getAttribute("data-" + lang);
  if (text) el.textContent = text;
}

function applyLang() {
  document.body.classList.toggle("lang-ar", lang === "ar");
  document.querySelectorAll("[data-en]").forEach(t);
  document.getElementById("chat-input").placeholder =
    lang === "ar" ? "اكتب ردّك..." : "Type your response...";
}

// ══════════════════════════════════════════════════════════════════════
//  SCENARIO DATA
// ══════════════════════════════════════════════════════════════════════
const SCENARIOS = [
  {
    id: "skeptical-engineer",
    emoji: "🔵",
    difficulty: "hard",
    name: { en: "The Skeptical Engineer", ar: "المهندس المشكّك" },
    client: {
      en: "Ahmed, 35 — Senior Structural Engineer",
      ar: "أحمد، 35 — مهندس إنشائي",
    },
    profile: {
      en: 'Ahmed is precise and analytical. He questions every claim with "prove it." He wants hard numbers: price per sqm, maintenance fees, payment plan breakdown, finishing specs. He has been burned by vague promises before and will push back on anything that sounds like marketing fluff.',
      ar: "أحمد دقيق وتحليلي. يشكّك في كل ادّعاء. يريد أرقاماً حقيقية: سعر المتر، عمولات الصيانة، جداول السداد، مواصفات التشطيب. سبق أن وقع ضحية وعود غامضة ولن يتسامح مع الكلام التسويقي الفارغ.",
    },
    objective: {
      en: "Build credibility with data. Qualify his needs. Secure a site visit commitment.",
      ar: "ابنِ مصداقيتك بالأرقام. تعرّف على احتياجاته. احصل على تعهّد بزيارة الموقع.",
    },
    tips: [
      { en: "Lead with facts, not adjectives", ar: "ابدأ بالحقائق لا الصفات" },
      { en: "Acknowledge uncertainty honestly", ar: "اعترف بعدم اليقين بصدق" },
      {
        en: "Ask what data matters to him most",
        ar: "اسأل عن أهم البيانات بالنسبة له",
      },
    ],
    systemPrompt: function (a) {
      return `You are playing Ahmed, a 35-year-old structural engineer in an Egyptian real estate call.
You are skeptical and precise. Only respond in ${a}. Keep your turn SHORT (1-3 sentences max). Do NOT narrate actions.
Personality: Analytical, doubtful, challenges every claim with demands for proof or numbers. Sighs when he hears marketing language. Warms up only when given concrete data.
If the agent gives vague answers ask for exact numbers. If pressed about budget say around 3.5M EGP for a 3BR.
The scenario ends naturally if the agent manages to get you to agree to a site visit.`;
    },
  },
  {
    id: "impatient-investor",
    emoji: "💰",
    difficulty: "medium",
    name: { en: "The Impatient Investor", ar: "المستثمر المتسرّع" },
    client: {
      en: "Khaled, 42 — Serial Real Estate Investor",
      ar: "خالد، 42 — مستثمر عقاري متسلسل",
    },
    profile: {
      en: "Khaled owns 7 units across Cairo and New Cairo. He only cares about ROI, rental yield, and resale potential. He talks fast, interrupts, and will end the call if you waste his time. He knows the market better than most agents.",
      ar: "خالد يملك 7 وحدات في القاهرة والقاهرة الجديدة. يهتم فقط بالعائد والإيجار وإمكانية إعادة البيع. يتكلم بسرعة، يقاطع، وسيُنهي المكالمة إذا ضيّعت وقته.",
    },
    objective: {
      en: "Position the unit as a yield opportunity. Provide rental return estimates. Get him to agree to review a financial sheet.",
      ar: "قدّم الوحدة كفرصة استثمارية. أعطِ تقديرات للعائد الإيجاري. اجعله يوافق على مراجعة جدول مالي.",
    },
    tips: [
      {
        en: "Get to the numbers in < 30 seconds",
        ar: "وصل للأرقام في أقل من 30 ثانية",
      },
      { en: "Use % not EGP amounts", ar: "استخدم النسب لا المبالغ" },
      { en: "Compare with market benchmark", ar: "قارن بمعيار السوق" },
    ],
    systemPrompt: function (a) {
      return `You are playing Khaled, a 42-year-old serial real estate investor on a phone call.
Only respond in ${a}. Keep your turn VERY SHORT (1-2 sentences). Interrupt if agent wastes time.
Personality: Fast, impatient, purely financial mindset. Asks "what's the rental yield?" within the first exchange. Gets bored quickly when agents talk about views or finishing.
Budget: Up to 5M EGP for a strong-yield unit. Will hang up if agent can't give numbers in the first minute.`;
    },
  },
  {
    id: "indecisive-couple",
    emoji: "👫",
    difficulty: "hard",
    name: { en: "The Indecisive Couple", ar: "الزوجان المترددان" },
    client: {
      en: "Omar & Sara, married couple — first home buyers",
      ar: "عمر وسارة، زوجان — مشترون لأول مرة",
    },
    profile: {
      en: "Omar wants a compound with amenities. Sara wants proximity to schools. They constantly interrupt each other. Omar likes big spaces. Sara wants a lower budget. This is their fifth agent call this week. They cannot agree on anything.",
      ar: "عمر يريد كمبوند بمرافق. سارة تريد القرب من المدارس. يقاطعان بعضهما باستمرار. عمر يحب المساحات الكبيرة. سارة تريد ميزانية أقل. هذه مكالمتهم الخامسة مع وكيل هذا الأسبوع.",
    },
    objective: {
      en: "Find common ground between their priorities. Ask structured discovery questions. Get them to agree on ONE non-negotiable requirement.",
      ar: "جد أرضية مشتركة بين أولوياتهما. اطرح أسئلة اكتشافية منظّمة. اجعلهما يتفقان على متطلب واحد غير قابل للتفاوض.",
    },
    tips: [
      { en: "Address both by name", ar: "خاطب كلّاً منهما باسمه" },
      { en: "Summarise to find agreement", ar: "لخّص لتجد نقطة الاتفاق" },
      { en: "Never take sides", ar: "لا تنحاز لأيٍّ منهما أبداً" },
    ],
    systemPrompt: function (a) {
      return `You are playing BOTH Omar AND Sara, a married couple in their 30s on a real estate call.
Only respond in ${a}. Play both characters in the SAME message, label each: "Omar:" and "Sara:". Max 3 sentences total.
Omar: wants a large compound unit with pool and gym, budget up to 4.5M EGP, loves El Sheikh Zayed.
Sara: prioritises schools within 10 min, max 3.5M, prefers New Cairo.
They disagree gently but persistently. They are polite but can't make decisions together. Agent wins if they agree on ONE priority.`;
    },
  },
  {
    id: "price-hammerer",
    emoji: "💸",
    difficulty: "medium",
    name: { en: "The Price Hammerer", ar: "ضارب الأسعار" },
    client: {
      en: "Mohamed, 29 — First-time buyer, budget-conscious",
      ar: "محمد، 29 — مشترٍ لأول مرة، حريص على الميزانية",
    },
    profile: {
      en: 'Mohamed opens every call with "طب ده غالي أوي". He will negotiate every line item. He heard from a friend there are better prices somewhere else. He is not actually that price-sensitive — he is testing the agent\'s conviction. If you cave immediately he loses respect.',
      ar: 'محمد يفتتح كل مكالمة بـ"طب ده غالي أوي". سيتفاوض على كل بند. سمع من صديق أن هناك أسعاراً أفضل في مكان آخر. في الحقيقة ليس حساساً للسعر كثيراً — يختبر قناعة الوكيل. إذا استجبت فوراً سيفقد الاحترام.',
    },
    objective: {
      en: "Hold your value. Justify price with comparables. Re-frame cost as value. Get him to engage with the unit details.",
      ar: "حافظ على قيمتك. برّر السعر بمقارنات. أعد صياغة التكلفة كقيمة. اجعله يتعامل مع تفاصيل الوحدة.",
    },
    tips: [
      { en: "Don't discount too fast", ar: "لا تخفّض السعر بسرعة" },
      { en: "Anchor to value, not price", ar: "ارتكز على القيمة لا السعر" },
      {
        en: 'Ask: "What budget were you thinking?"',
        ar: 'اسأل: "ما الميزانية التي كنت تفكر فيها؟"',
      },
    ],
    systemPrompt: function (a) {
      return `You are playing Mohamed, a 29-year-old first-time buyer who opens every property call complaining about prices.
Only respond in ${a}. Keep replies SHORT (1-3 sentences). Use informal Egyptian Arabic if lang is ar.
Personality: Starts with "ده غالي" or "I heard it's cheaper elsewhere." Tests the agent's conviction. DOESN'T immediately share budget.
Actual budget: 2.8M EGP for a 2BR in a decent compound. Warms up if agent is confident and justifies price well — do not warm up too fast.`;
    },
  },
  {
    id: "silent-prospect",
    emoji: "🤐",
    difficulty: "hard",
    name: { en: "The Silent Prospect", ar: "العميل الصامت" },
    client: {
      en: "Nour, 31 — Software developer, introverted",
      ar: "نور، 31 — مطوّرة برمجيات، انطوائية",
    },
    profile: {
      en: 'Nour gives one-word answers. "Yes." "Maybe." "I don\'t know." She was referred by a friend. She is genuinely interested but terrible at phone conversations. Long silences. You have to ask very targeted open questions or she shuts down entirely.',
      ar: 'نور تجيب بكلمة واحدة. "آه." "ممكن." "مش عارفة." تمّت إحالتها من صديقة. مهتمة فعلاً لكنها سيئة في المحادثات الهاتفية. صمت طويل. تحتاج لأسئلة مفتوحة محدّدة وإلا ستغلق تماماً.',
    },
    objective: {
      en: "Ask open-ended questions that cannot be answered with one word. Uncover 3 qualifying facts: budget, timeline, area preference.",
      ar: "اطرح أسئلة مفتوحة لا يمكن الإجابة عليها بكلمة. اكتشف 3 حقائق تأهيلية: الميزانية، الإطار الزمني، تفضيل المنطقة.",
    },
    tips: [
      { en: "Never ask yes/no questions", ar: "لا تطرح أسئلة بنعم/لا أبداً" },
      { en: "Embrace short silences", ar: "قبَل الصمت القصير" },
      { en: "Reflect back what you hear", ar: "أعكس ما سمعته" },
    ],
    systemPrompt: function (a) {
      return `You are playing Nour, a 31-year-old introverted software developer who hates talking on the phone.
Only respond in ${a}. Give SHORT replies (1 sentence max, often just 2-4 words).
Personality: Answers yes/no to closed questions. Gives brief elaborations only if agent asks a specific open question. Long thinking pauses (represent with "...").
Actually interested in a 2BR in New Cairo for ~2.2M EGP by end of year. Agent wins if they extract 3 key facts.`;
    },
  },
  {
    id: "time-waster",
    emoji: "⏰",
    difficulty: "medium",
    name: { en: "The Time-Waster", ar: "مضيّع الوقت" },
    client: {
      en: 'Hassan, 52 — Business owner, always "thinking about it"',
      ar: 'حسن، 52 — صاحب عمل، دائماً "يفكّر في الأمر"',
    },
    profile: {
      en: 'Hassan has been "about to buy" for 3 years. He is warm and friendly. He loves chatting. He asks for brochures, says "send me the details" and then never follows up. He has no real urgency and no deadline. He needs a reason to decide NOW.',
      ar: 'حسن "على وشك الشراء" منذ 3 سنوات. دافئ وودود. يحب الدردشة. يطلب بروشورات ويقول "ابعتلي التفاصيل" ثم لا يتابع أبداً. لا يحس بأي إلحاح ولا موعد نهائي. يحتاج سبباً للقرار الآن.',
    },
    objective: {
      en: "Create urgency without lying. Uncover a real deadline or motivation. Redirect from chat to a concrete next step.",
      ar: "اصنع إلحاحاً دون كذب. اكتشف دافعاً أو موعداً حقيقياً. انتقل من الدردشة إلى خطوة ملموسة تالية.",
    },
    tips: [
      {
        en: "Ask about his pain point, not just the property",
        ar: "اسأل عن نقطة ألمه لا العقار فحسب",
      },
      {
        en: "Use limited availability honestly",
        ar: "استخدم محدودية التوافر بصدق",
      },
      {
        en: "Always close on a specific date",
        ar: "دائماً أغلق على تاريخ محدّد",
      },
    ],
    systemPrompt: function (a) {
      return `You are playing Hassan, a 52-year-old business owner who has been "thinking about buying" for years.
Only respond in ${a}. Medium length replies (2-3 sentences). Friendly and chatty.
Personality: Loves talking, deflects commitment with "send me the details", asks for brochures, has no urgency. Secretly wants to buy a unit for his daughter's future.
Warms up and starts engaging seriously ONLY if agent uncovers the emotional motivation (daughter). Budget is 4M EGP.`;
    },
  },
  {
    id: "cold-lead",
    emoji: "❄️",
    difficulty: "easy",
    name: { en: "The Cold Lead", ar: "العميل المتجمّد" },
    client: {
      en: "Asmaa, 27 — HR specialist, filled a form she barely remembers",
      ar: "أسماء، 27 — متخصصة موارد بشرية، ملأت نموذجاً لا تتذكره تقريباً",
    },
    profile: {
      en: "Asmaa filled a Facebook lead form 2 months ago and has no recollection of it. She is polite but confused. She is busy. She was not actually looking to buy — she probably clicked an ad by mistake. She is the hardest lead to convert but a great practice for re-qualification.",
      ar: "أسماء ملأت نموذج ليد على فيسبوك منذ شهرين ولا تتذكره. مؤدّبة لكن محتارة. مشغولة. لم تكن تبحث عن شراء فعلاً — ربما ضغطت على إعلان بالخطأ. أصعب العملاء تحويلاً لكنها رائعة للتدرّب على إعادة التأهيل.",
    },
    objective: {
      en: "Re-warm her without pressure. Re-qualify interest from scratch. Plant a seed. Do not push for a close on first contact.",
      ar: "أعد تدفئتها بلا ضغط. أعد تأهيل الاهتمام من الصفر. ازرع بذرة. لا تدفع نحو الإغلاق في الاتصال الأول.",
    },
    tips: [
      {
        en: "Lead with curiosity, not a pitch",
        ar: "ابدأ بالفضول لا بعرض تجاري",
      },
      {
        en: "Give her an easy out — she'll respect it",
        ar: "أعطها مخرجاً سهلاً — ستحترمك على ذلك",
      },
      {
        en: "Ask one low-commitment question",
        ar: "اطرح سؤالاً واحداً لا يستلزم التزاماً كبيراً",
      },
    ],
    systemPrompt: function (a) {
      return `You are playing Asmaa, a 27-year-old HR specialist who does not remember filling a real estate lead form.
Only respond in ${a}. Short polite replies (1-2 sentences). Slightly confused.
Personality: Polite, busy, doesn't want to be rude but genuinely doesn't remember the form. Slightly interested if approached with curiosity (not sales pressure).
If agent pushes hard → ends call politely. If agent is human and not pushy → starts opening up about eventually wanting a small studio. Budget: 1.8-2M EGP.`;
    },
  },
  {
    id: "urgent-buyer",
    emoji: "🚨",
    difficulty: "easy",
    name: { en: "The Urgent Buyer", ar: "المشتري العاجل" },
    client: {
      en: "Tarek, 38 — IT Manager, relocating in 30 days",
      ar: "طارق، 38 — مدير تقنية معلومات، ينتقل خلال 30 يوماً",
    },
    profile: {
      en: "Tarek is relocating from Alexandria to Cairo for a new job in 30 days. He needs to close within this week. He is decisive and pre-approved for a mortgage. He needs you to show him only relevant options and not waste his time. He will close today if you give him what he needs.",
      ar: "طارق ينتقل من الإسكندرية للقاهرة لوظيفة جديدة خلال 30 يوماً. يحتاج إلى الإغلاق هذا الأسبوع. حاسم وحصل على موافقة مسبقة للرهن. يريد منك فقط الخيارات المناسبة. سيغلق اليوم إذا أعطيته ما يحتاجه.",
    },
    objective: {
      en: "Ask focused qualification questions. Present 2-3 options that fit. Close for a same-day or next-morning site visit.",
      ar: "اطرح أسئلة تأهيل مركّزة. قدّم 2-3 خيارات مناسبة. أغلق على زيارة موقع نفس اليوم أو صباح الغد.",
    },
    tips: [
      { en: "Match his urgency — be direct", ar: "وازِن إلحاحه — كن مباشراً" },
      { en: "Propose 2 options, not 10", ar: "قدّم خيارين لا عشرة" },
      {
        en: "Confirm logistics: time, transport",
        ar: "أكّد اللوجستيات: الوقت والمواصلات",
      },
    ],
    systemPrompt: function (a) {
      return `You are playing Tarek, a 38-year-old IT manager relocating from Alexandria to Cairo within 30 days.
Only respond in ${a}. Direct, efficient replies (1-3 sentences). He is pre-approved for up to 3.2M EGP mortgage.
Personality: Decisive and ready to buy this week. Hates wasted time or vague answers. Approves quickly when agent asks the right qualifying questions.
If agent is focused and presents a relevant option → agrees to a site visit. If agent is disorganised → politely pushes for something concrete.`;
    },
  },
];

// ══════════════════════════════════════════════════════════════════════
//  DEBRIEF SYSTEM PROMPT
// ══════════════════════════════════════════════════════════════════════
function buildDebriefPrompt(scenario, transcript, langCode) {
  return `You are a senior real estate sales trainer evaluating a 1-on-1 call simulation.

SCENARIO: "${scenario.name.en}"
CLIENT BRIEF: ${scenario.profile.en}
CALL OBJECTIVE: ${scenario.objective.en}

FULL TRANSCRIPT (agent is the trainee):
${transcript}

Evaluate the agent's performance and respond ONLY with valid JSON in this exact format:
{
  "scores": {
    "rapport": <0-20>,
    "qualification": <0-20>,
    "objection_handling": <0-20>,
    "closing_attempt": <0-20>,
    "communication": <0-20>
  },
  "coaching": [
    {"emoji": "✅", "tip": "<what they did well — be specific, reference actual lines>"},
    {"emoji": "⚠️", "tip": "<what needed improvement — be specific>"},
    {"emoji": "💡", "tip": "<one actionable technique they should use next time>"}
  ]
}

Be honest and specific. If the call was short or the agent performed poorly, scores should reflect that.
Respond in ${langCode === "ar" ? "Arabic" : "English"}.`;
}

// ══════════════════════════════════════════════════════════════════════
//  INFINITE AI SCENARIO GENERATION
// ══════════════════════════════════════════════════════════════════════
const GENERATED_KEY = "pitchlab_generated";
const MAX_GENERATED = 20;

function loadGeneratedScenarios() {
  try {
    return JSON.parse(localStorage.getItem(GENERATED_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveGeneratedScenario(raw) {
  const existing = loadGeneratedScenarios().filter((s) => s.id !== raw.id);
  existing.unshift(raw);
  if (existing.length > MAX_GENERATED) existing.length = MAX_GENERATED;
  localStorage.setItem(GENERATED_KEY, JSON.stringify(existing));
}

function buildScenarioFromRaw(raw) {
  if (!raw || !raw.id || !raw.name) return null;
  const template = raw.systemPromptTemplate || "";
  return {
    id: raw.id,
    emoji: raw.emoji || "🤖",
    difficulty: raw.difficulty || "medium",
    name: raw.name,
    client: raw.client || { en: "", ar: "" },
    profile: raw.profile || { en: "", ar: "" },
    objective: raw.objective || { en: "", ar: "" },
    tips: Array.isArray(raw.tips) ? raw.tips : [],
    isGenerated: true,
    systemPrompt: function (langLabel) {
      return template.replace(/\{LANG\}/g, langLabel);
    },
  };
}

function hydrateGeneratedScenarios() {
  loadGeneratedScenarios().forEach((raw) => {
    if (SCENARIOS.some((s) => s.id === raw.id)) return;
    const s = buildScenarioFromRaw(raw);
    if (s) SCENARIOS.push(s);
  });
}

function buildScenarioGeneratorPrompt(difficulty, existingNames) {
  const exclude = existingNames.slice(0, 14).join(", ");
  return `You are designing a brand-new Egyptian real estate sales training scenario for phone call simulation.

DIFFICULTY: ${difficulty}
DO NOT duplicate any of these existing client types: ${exclude}

Create a UNIQUE, realistic Egyptian client persona with:
• A real Egyptian name (romanised), authentic age and profession
• A genuine emotional backstory driving the purchase decision
• ONE dominant communication quirk that challenges the sales agent
• Realistic budget for the Egyptian market (1.5M – 8M EGP)
• Specific location preference (New Cairo, Sheikh Zayed, 6th October, Heliopolis, North Coast, Ain Sokhna, Madinaty, or El Mostakbal City)

Respond ONLY with valid JSON (no markdown fences, no extra text):
{
  "emoji": "<one emoji that represents this persona>",
  "difficulty": "${difficulty}",
  "name": {
    "en": "<The Archetype Title, e.g. The Grieving Widow>",
    "ar": "<Arabic translation>"
  },
  "client": {
    "en": "<First name>, <age> — <profession>",
    "ar": "<Arabic version>"
  },
  "profile": {
    "en": "<3-4 sentence backstory: emotional driver, budget, area preference, communication quirk>",
    "ar": "<Arabic version>"
  },
  "objective": {
    "en": "<What the agent must do to win this call>",
    "ar": "<Arabic version>"
  },
  "tips": [
    {"en": "<tip 1>", "ar": "<Arabic>"},
    {"en": "<tip 2>", "ar": "<Arabic>"},
    {"en": "<tip 3>", "ar": "<Arabic>"}
  ],
  "systemPromptTemplate": "You are playing [first name], [age and role description].\\nOnly respond in {LANG}. [reply length instruction: SHORT 1-2 sentences / MEDIUM 2-3 / VARIED].\\nPersonality: [detailed character notes — quirks, triggers, warm-up condition].\\n[Budget and location details].\\n[Win condition: what the agent must say/do for the scenario to end positively]."
}`;
}

let _isGenerating = false;

async function generateAIScenario(difficulty) {
  if (_isGenerating) return;
  _isGenerating = true;

  const existingNames = SCENARIOS.map((s) => s.name.en);
  const prompt = buildScenarioGeneratorPrompt(difficulty || "medium", existingNames);

  showLoading(
    lang === "ar"
      ? "🤖 الذكاء الاصطناعي يبتكر عميلاً جديداً…"
      : "🤖 AI is crafting a new client persona…",
  );

  try {
    const rawJson = await callGemini(null, [{ role: "user", content: prompt }]);

    let raw;
    try {
      const match = rawJson.match(/\{[\s\S]*\}/);
      raw = JSON.parse(match ? match[0] : rawJson);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    if (!raw.name || !raw.profile || !raw.systemPromptTemplate) {
      throw new Error("Incomplete scenario from AI");
    }

    raw.id = "ai-" + Date.now();
    const scenario = buildScenarioFromRaw(raw);
    if (!scenario) throw new Error("Could not build scenario object");

    SCENARIOS.push(scenario);
    saveGeneratedScenario(raw);
    hideLoading();
    renderScenarios();

    const newCard = document.querySelector('[data-id="' + raw.id + '"]');
    if (newCard) newCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    hideLoading();
    console.error("Scenario generation error:", err);
    const grid = $("scenarios-grid");
    if (grid) {
      const errDiv = document.createElement("div");
      errDiv.className = "scenario-gen-error";
      errDiv.textContent =
        lang === "ar"
          ? "تعذّر توليد السيناريو. حاول مرة أخرى."
          : "Could not generate scenario. Please try again.";
      grid.after(errDiv);
      setTimeout(() => errDiv.remove(), 4000);
    }
  } finally {
    _isGenerating = false;
  }
}

// ══════════════════════════════════════════════════════════════════════
//  SESSION HISTORY
// ══════════════════════════════════════════════════════════════════════
const HISTORY_KEY = "pitchlab_history";
const MAX_HISTORY = 5;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistoryEntry(entry) {
  const h = loadHistory();
  h.unshift(entry);
  if (h.length > MAX_HISTORY) h.length = MAX_HISTORY;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

// ══════════════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════════════
let currentScenario = null;
let callMessages = []; // [{role, content}] for Gemini
let callTranscript = []; // [{speaker, text}] for debrief
let callTimerHandle = null;
let callSeconds = 0;
let briefingTimer = null;
let isWaitingForAI = false;

// ══════════════════════════════════════════════════════════════════════
//  DOM REFS (cached for safety)
// ══════════════════════════════════════════════════════════════════════
const $ = (id) => document.getElementById(id);

// ══════════════════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════════════════
function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  const scr = $(id);
  if (scr) scr.classList.add("active");
  window.scrollTo(0, 0);
}

// ══════════════════════════════════════════════════════════════════════
//  HOME SCREEN
// ══════════════════════════════════════════════════════════════════════
function renderScenarios() {
  const grid = $("scenarios-grid");
  if (!grid) return;
  const cards = SCENARIOS.map((s) => {
    const name = escHtml(s.name[lang] || s.name.en);
    const client = escHtml(s.client[lang] || s.client.en);
    const desc = escHtml(
      s.profile[lang]
        ? (s.profile[lang] || "").slice(0, 100) + "…"
        : (s.profile.en || "").slice(0, 100) + "…",
    );
    const diff = escHtml(s.difficulty);
    const diffLabel =
      lang === "ar"
        ? { easy: "سهل", medium: "متوسط", hard: "صعب" }[s.difficulty] ||
          s.difficulty
        : s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1);
    const aiBadge = s.isGenerated
      ? `<span class="scenario-ai-badge" aria-label="AI generated">✨ AI</span>`
      : "";
    return `<div class="scenario-card${s.isGenerated ? " scenario-ai-card" : ""}" data-id="${escHtml(s.id)}" role="button" tabindex="0" aria-label="${name}">
      ${aiBadge}
      <span class="scenario-emoji" aria-hidden="true">${escHtml(s.emoji)}</span>
      <span class="scenario-difficulty difficulty-${diff}">${escHtml(diffLabel)}</span>
      <h2 class="scenario-name">${name}</h2>
      <p class="scenario-client">${client}</p>
      <p class="scenario-desc">${desc}</p>
    </div>`;
  });

  // Difficulty picker cards for generating new scenarios
  const genLabel = lang === "ar" ? "توليد عميل جديد بالذكاء الاصطناعي" : "Generate New AI Client";
  const genSub = lang === "ar" ? "اختر مستوى الصعوبة" : "Choose difficulty";
  cards.push(
    `<div class="scenario-card scenario-generate" id="generate-card" role="group" aria-label="${genLabel}">
      <span class="scenario-emoji generate-icon" aria-hidden="true">🎲</span>
      <h2 class="scenario-name generate-title">${escHtml(genLabel)}</h2>
      <p class="scenario-client">${escHtml(genSub)}</p>
      <div class="generate-btns">
        <button class="gen-btn gen-easy" data-diff="easy">${lang === "ar" ? "سهل" : "Easy"}</button>
        <button class="gen-btn gen-medium" data-diff="medium">${lang === "ar" ? "متوسط" : "Medium"}</button>
        <button class="gen-btn gen-hard" data-diff="hard">${lang === "ar" ? "صعب" : "Hard"}</button>
      </div>
    </div>`,
  );

  grid.innerHTML = cards.join("");

  grid.querySelectorAll(".scenario-card:not(.scenario-generate)").forEach((card) => {
    card.addEventListener("click", () => openBriefing(card.dataset.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openBriefing(card.dataset.id);
      }
    });
  });

  grid.querySelectorAll(".gen-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      generateAIScenario(btn.dataset.diff);
    });
  });
}

// ══════════════════════════════════════════════════════════════════════
//  BRIEFING SCREEN
// ══════════════════════════════════════════════════════════════════════
function openBriefing(id) {
  const scenario = SCENARIOS.find((s) => s.id === id);
  if (!scenario) return;
  currentScenario = scenario;

  $("briefing-badge").textContent = scenario.name[lang] || scenario.name.en;
  $("briefing-name").textContent = scenario.name[lang] || scenario.name.en;
  $("briefing-profile").textContent =
    scenario.profile[lang] || scenario.profile.en;
  $("briefing-objective").textContent =
    scenario.objective[lang] || scenario.objective.en;

  const tipsEl = $("briefing-tips");
  tipsEl.innerHTML = (scenario.tips || [])
    .map(
      (tip) =>
        `<span class="briefing-tip">${escHtml(tip[lang] || tip.en)}</span>`,
    )
    .join("");

  showScreen("screen-briefing");
  startBriefingCountdown();
}

function startBriefingCountdown() {
  clearInterval(briefingTimer);
  let secs = 8;
  const el = $("briefing-countdown");
  if (el) el.textContent = String(secs);
  briefingTimer = setInterval(() => {
    secs--;
    if (el) el.textContent = String(secs);
    if (secs <= 0) {
      clearInterval(briefingTimer);
      startCall();
    }
  }, 1000);
}

// ══════════════════════════════════════════════════════════════════════
//  CALL SCREEN
// ══════════════════════════════════════════════════════════════════════
function startCall() {
  clearInterval(briefingTimer);
  if (!currentScenario) return;

  callMessages = [];
  callTranscript = [];
  callSeconds = 0;
  isWaitingForAI = false;

  const s = currentScenario;
  $("call-avatar").textContent = s.emoji;
  $("call-persona-name").textContent = s.name[lang] || s.name.en;
  $("call-persona-sub").textContent = s.client[lang] || s.client.en;

  const chatArea = $("chat-area");
  chatArea.innerHTML = "";
  appendSystem(
    lang === "ar"
      ? "المكالمة بدأت — أنت تتحدث أولاً."
      : "Call connected — you speak first.",
  );

  showScreen("screen-call");

  clearInterval(callTimerHandle);
  callTimerHandle = setInterval(tickCallTimer, 1000);

  const input = $("chat-input");
  if (input) {
    input.value = "";
    input.focus();
    autoResize(input);
  }

  $("call-hint").textContent =
    lang === "ar"
      ? "أجب كما لو كانت هذه مكالمة حقيقية. كن محترفاً."
      : "Respond as if this is a real phone call. Be professional.";
}

function tickCallTimer() {
  callSeconds++;
  const m = String(Math.floor(callSeconds / 60)).padStart(2, "0");
  const s = String(callSeconds % 60).padStart(2, "0");
  const el = $("call-timer");
  if (el) el.textContent = m + ":" + s;
}

/* ── Chat messaging ── */
function appendBubble(role, text) {
  const chatArea = $("chat-area");
  if (!chatArea) return;
  const cls =
    role === "client"
      ? "bubble-client"
      : role === "agent"
        ? "bubble-agent"
        : "bubble-system";
  const div = document.createElement("div");
  div.className = "chat-bubble " + cls;
  div.textContent = text; // safe — AI text is rendered as textContent
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function appendSystem(text) {
  const chatArea = $("chat-area");
  if (!chatArea) return;
  const div = document.createElement("div");
  div.className = "chat-bubble bubble-system";
  div.textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function showTypingIndicator() {
  const chatArea = $("chat-area");
  if (!chatArea) return null;
  const div = document.createElement("div");
  div.className = "chat-bubble bubble-client bubble-typing";
  div.id = "typing-indicator";
  div.setAttribute("aria-hidden", "true");
  div.innerHTML =
    '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  return div;
}

function removeTypingIndicator() {
  const el = $("typing-indicator");
  if (el) el.remove();
}

async function sendMessage() {
  if (isWaitingForAI || !currentScenario) return;
  const input = $("chat-input");
  const text = (input.value || "").trim();
  if (!text) return;

  input.value = "";
  autoResize(input);

  // Record agent message
  appendBubble("agent", text);
  callTranscript.push({ speaker: "Agent", text });
  callMessages.push({ role: "user", content: text });

  isWaitingForAI = true;
  setSendDisabled(true);
  showTypingIndicator();

  try {
    const sysPrompt = currentScenario.systemPrompt(
      lang === "ar" ? "Egyptian Arabic" : "English",
    );
    const aiText = await callGemini(sysPrompt, callMessages);

    removeTypingIndicator();
    appendBubble("client", aiText);
    callTranscript.push({ speaker: "Client", text: aiText });
    callMessages.push({ role: "assistant", content: aiText });
  } catch (err) {
    removeTypingIndicator();
    appendSystem(
      lang === "ar"
        ? "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى."
        : "Connection error. Please try again.",
    );
    console.error("Gemini error:", err);
  }

  isWaitingForAI = false;
  setSendDisabled(false);
  if (input) input.focus();
}

function setSendDisabled(disabled) {
  const btn = $("btn-send");
  if (btn) btn.disabled = disabled;
}

/* ── End call ── */
async function endCall() {
  clearInterval(callTimerHandle);
  setSendDisabled(true);

  if (callTranscript.length < 2) {
    appendSystem(
      lang === "ar"
        ? "أجرِ بعض التبادلات أولاً!"
        : "Have at least a few exchanges first!",
    );
    setSendDisabled(false);
    clearInterval(callTimerHandle);
    callTimerHandle = setInterval(tickCallTimer, 1000);
    return;
  }

  showLoading(
    lang === "ar" ? "جاري تحليل المكالمة..." : "Analysing your call...",
  );

  try {
    const transcriptText = callTranscript
      .map((m) => m.speaker + ": " + m.text)
      .join("\n");

    const debriefPrompt = buildDebriefPrompt(
      currentScenario,
      transcriptText,
      lang,
    );
    const rawJson = await callGemini(null, [
      { role: "user", content: debriefPrompt },
    ]);

    let debrief;
    try {
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      debrief = JSON.parse(jsonMatch ? jsonMatch[0] : rawJson);
    } catch {
      debrief = buildFallbackDebrief();
    }

    hideLoading();
    showDebrief(debrief);

    const total = Object.values(debrief.scores || {}).reduce(
      (a, b) => a + (b || 0),
      0,
    );
    saveHistoryEntry({
      scenarioId: currentScenario.id,
      scenarioName: currentScenario.name.en,
      total,
      date: new Date().toLocaleDateString(),
      duration: callSeconds,
    });
  } catch (err) {
    hideLoading();
    appendSystem(
      lang === "ar"
        ? "تعذّر تحليل المكالمة. يرجى المحاولة مرة أخرى."
        : "Could not generate debrief. Try again.",
    );
    setSendDisabled(false);
    clearInterval(callTimerHandle);
    callTimerHandle = setInterval(tickCallTimer, 1000);
    console.error("Debrief error:", err);
  }
}

function buildFallbackDebrief() {
  return {
    scores: {
      rapport: 10,
      qualification: 10,
      objection_handling: 10,
      closing_attempt: 10,
      communication: 10,
    },
    coaching: [
      {
        emoji: "💡",
        tip: "Could not generate detailed feedback. Review the transcript manually.",
      },
    ],
  };
}

// ══════════════════════════════════════════════════════════════════════
//  DEBRIEF SCREEN
// ══════════════════════════════════════════════════════════════════════
const SCORE_LABELS = {
  rapport: { en: "Rapport", ar: "بناء العلاقة" },
  qualification: { en: "Qualification", ar: "التأهيل" },
  objection_handling: { en: "Objection Handling", ar: "التعامل مع الاعتراضات" },
  closing_attempt: { en: "Closing Attempt", ar: "محاولة الإغلاق" },
  communication: { en: "Communication", ar: "التواصل" },
};

function showDebrief(debrief) {
  const scores = debrief.scores || {};
  const total = Object.values(scores).reduce((a, b) => a + (b || 0), 0);

  $("debrief-scenario-badge").textContent =
    currentScenario.name[lang] || currentScenario.name.en;
  $("debrief-total").textContent = String(Math.round(total));

  // Score bars
  const scoresEl = $("debrief-scores");
  scoresEl.innerHTML = Object.entries(SCORE_LABELS)
    .map(([key, labels]) => {
      const score = Math.max(0, Math.min(20, scores[key] || 0));
      const pct = (score / 20) * 100;
      const label = escHtml(labels[lang] || labels.en);
      const cls =
        pct >= 65 ? "score-high" : pct >= 40 ? "score-medium" : "score-low";
      return `<div class="score-row ${escHtml(cls)}">
      <div class="score-row-head">
        <span class="score-label">${label}</span>
        <span class="score-value">${escHtml(String(score))}/20</span>
      </div>
      <div class="score-bar-track">
        <div class="score-bar-fill" data-pct="${escHtml(String(pct))}"></div>
      </div>
    </div>`;
    })
    .join("");

  // Animate bars after DOM insertion
  requestAnimationFrame(() => {
    scoresEl.querySelectorAll(".score-bar-fill").forEach((bar) => {
      bar.style.width = bar.dataset.pct + "%";
    });
  });

  // Coaching tips
  const coachingEl = $("debrief-coaching");
  const coachingItems = Array.isArray(debrief.coaching) ? debrief.coaching : [];
  coachingEl.innerHTML =
    `<p class="coaching-title">${escHtml(lang === "ar" ? "ملاحظات المدرّب" : "Trainer Notes")}</p>` +
    coachingItems
      .map(
        (item) =>
          `<div class="coaching-item">
        <span class="coaching-item-icon" aria-hidden="true">${escHtml(item.emoji || "💬")}</span>
        <span>${escHtml(item.tip || "")}</span>
      </div>`,
      )
      .join("");

  showScreen("screen-debrief");
}

// ══════════════════════════════════════════════════════════════════════
//  HISTORY PANEL
// ══════════════════════════════════════════════════════════════════════
function renderHistory() {
  const list = $("history-list");
  if (!list) return;
  const h = loadHistory();
  if (!h.length) {
    list.innerHTML = `<p class="history-empty">${escHtml(lang === "ar" ? "لا توجد جلسات سابقة." : "No sessions yet.")}</p>`;
    return;
  }
  list.innerHTML = h
    .map(
      (entry) =>
        `<div class="history-item">
      <div class="history-item-head">
        <span class="history-item-name">${escHtml(entry.scenarioName || "")}</span>
        <span class="history-item-score">${escHtml(String(entry.total || 0))}/100</span>
      </div>
      <span class="history-item-date">${escHtml(entry.date || "")}</span>
    </div>`,
    )
    .join("");
}

// ══════════════════════════════════════════════════════════════════════
//  GEMINI API CALL
// ══════════════════════════════════════════════════════════════════════
async function callGemini(systemPrompt, messages) {
  const body = { messages };
  if (systemPrompt) body.systemPrompt = systemPrompt;

  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 401)
    throw new Error("Session expired. Please log in again.");
  if (res.status === 429)
    throw new Error("Rate limit reached. Please wait a moment.");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "AI service error");
  }

  const data = await res.json();
  return data.text || "";
}

// ══════════════════════════════════════════════════════════════════════
//  LOADING OVERLAY
// ══════════════════════════════════════════════════════════════════════
function showLoading(text) {
  const overlay = $("loading-overlay");
  const textEl = $("loading-text");
  if (textEl) textEl.textContent = text || "Loading...";
  if (overlay) overlay.hidden = false;
}

function hideLoading() {
  const overlay = $("loading-overlay");
  if (overlay) overlay.hidden = true;
}

// ══════════════════════════════════════════════════════════════════════
//  TEXTAREA AUTO-RESIZE
// ══════════════════════════════════════════════════════════════════════
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}

// ══════════════════════════════════════════════════════════════════════
//  EVENT WIRING
// ══════════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  hydrateGeneratedScenarios(); // restore AI-generated scenarios from localStorage
  applyLang();
  renderScenarios();

  /* Language toggle */
  $("btn-lang").addEventListener("click", () => {
    lang = lang === "en" ? "ar" : "en";
    localStorage.setItem("pitchlab_lang", lang);
    applyLang();
    renderScenarios();
    if ($("screen-call").classList.contains("active")) {
      $("call-hint").textContent =
        lang === "ar"
          ? "أجب كما لو كانت هذه مكالمة حقيقية. كن محترفاً."
          : "Respond as if this is a real phone call. Be professional.";
    }
  });

  /* History panel */
  $("btn-history").addEventListener("click", () => {
    renderHistory();
    const panel = $("history-panel");
    if (panel) panel.hidden = false;
  });
  $("btn-history-close").addEventListener("click", () => {
    const panel = $("history-panel");
    if (panel) panel.hidden = true;
  });
  $("btn-clear-history").addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });

  /* Briefing back */
  $("briefing-back").addEventListener("click", () => {
    clearInterval(briefingTimer);
    showScreen("screen-home");
  });

  /* Start call now (override countdown) */
  $("btn-start-call").addEventListener("click", () => {
    clearInterval(briefingTimer);
    startCall();
  });

  /* Send message */
  $("btn-send").addEventListener("click", sendMessage);
  $("chat-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  $("chat-input").addEventListener("input", () => autoResize($("chat-input")));

  /* End call */
  $("btn-end-call").addEventListener("click", endCall);

  /* Debrief buttons */
  $("btn-retry").addEventListener("click", () => {
    if (currentScenario) openBriefing(currentScenario.id);
    else showScreen("screen-home");
  });
  $("btn-home").addEventListener("click", () => {
    showScreen("screen-home");
  });
});
