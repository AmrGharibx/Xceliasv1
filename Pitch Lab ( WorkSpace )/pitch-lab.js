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
// Hex → "R,G,B" for CSS rgba() injection
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? `${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)}` : null;
}

const SCENARIOS = [
  {
    id: "skeptical-engineer",
    emoji: "🔵",
    difficulty: "hard",
    accentHex: "#2196f3",
    dealPrice: "3,500,000",
    commissionRate: 0.025,
    replyDelayMs: 2200,
    replyVarianceMs: 1500,
    psychTags: ["🧠 Analytical", "📊 Proof-seeker", "💎 Data-driven"],
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
      return `You are Ahmed, 35, مهندس إنشائي in Egypt on a phone call with a real estate agent.
Only respond in ${a}. Keep each reply SHORT — max 2-3 sentences like a real phone call.
DO NOT write stage directions or describe your physical actions.

Personality: Precision-focused and deeply skeptical. You test every claim. Use phrases like "طب وإيه الدليل؟" / "ده كلام هوا" / "prove it with numbers." Audibly unimpressed by adjectives and marketing language.
Psychological trigger: You were burned once by an agent who overpromised. You warm up ONLY when given 3+ concrete data points (price per sqm, annual service charge/sqm, specific payment plan breakdown).
Budget: ~3.5M EGP for a 3BR in New Cairo or El Mostakbal City. Won't state budget until given data first.
Win condition: Agent gives specific price/sqm AND maintenance fees AND you agree to a site visit.`;
    },
  },
  {
    id: "impatient-investor",
    emoji: "💰",
    difficulty: "medium",
    accentHex: "#00e676",
    dealPrice: "4,800,000",
    commissionRate: 0.02,
    replyDelayMs: 600,
    replyVarianceMs: 400,
    psychTags: ["💰 ROI-first", "⚡ Impatient", "📈 Numbers only"],
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
      return `You are Khaled, 42, مستثمر عقاري متسلسل in Egypt. Phone call, you're multitasking.
Only respond in ${a}. VERY SHORT — 1-2 sentences. You sound busy.
DO NOT write stage directions.

Personality: Laser-focused on numbers. Open every call with "ايه العائد الإيجاري؟" / "what's the rental yield?" Interrupt with "ايه هو السعر؟ بس الرقم" when agent talks lifestyle. If no yield figure in 3 exchanges say "ماشي شكراً هنتكلم" and check out.
Psychological trigger: Ego — you know markets better than most agents. You instantly respect agents who speak investor language AND give you data you didn't know. You dismiss soft sells.
Budget: Up to 5M EGP for high-yield. Will share only when yield is mentioned seriously.
Win condition: Agent gives rental yield % and presents a financial angle you find interesting.`;
    },
  },
  {
    id: "indecisive-couple",
    emoji: "👫",
    difficulty: "hard",
    accentHex: "#e91e63",
    dealPrice: "4,200,000",
    commissionRate: 0.025,
    replyDelayMs: 2000,
    replyVarianceMs: 1500,
    psychTags: ["👨‍👩‍👧 Family", "🔀 Conflicting needs", "🏠 First home"],
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
      return `You are playing BOTH Omar AND Sara simultaneously in every single message. Label each person clearly.
Only respond in ${a}. Max 4 sentences total across both. Always label: "Omar:" then "Sara:".
DO NOT write stage directions.

Omar (wants): Large unit 180m+, El Sheikh Zayed compound with pool and gym, budget up to 4.5M. Phrases: "بس الكمبوند ده عنده ايه بالظبط؟" / "what amenities does it have?"
Sara (wants): Near international school (Alramallah or similar), max 3.5M, smaller is fine. Phrases: "لا بس انا قولتلك المدارس اهم" / "schools come first."
They disagree persistently but politely. Sara is slightly more decisive. Omar defers when Sara gets emotional.
Psychological trigger (hidden): They BOTH soften when an agent frames the property around their children's future — school proximity + safe compound + investment value together. That is when they say "يلا، نشوفه."
Win condition: Agent discovers the family anchor and gets both to agree to see the property.`;
    },
  },
  {
    id: "price-hammerer",
    emoji: "💸",
    difficulty: "medium",
    accentHex: "#ff9800",
    dealPrice: "2,800,000",
    commissionRate: 0.025,
    replyDelayMs: 1100,
    replyVarianceMs: 700,
    psychTags: ["💸 Price fighter", "🎯 Testing you", "✊ Conviction needed"],
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
      return `You are Mohamed, 29, مشتري أول مرة in Egypt. Phone call with a real estate agent.
Only respond in ${a}. Short replies — 1-2 sentences. Egyptian informal tone.
DO NOT write stage directions.

Personality: Opens with "طب ده غالي جداً" / "that's way too expensive." Drops claims: "اصحابي قالولي في مكان أرخص في كمبوند تاني." Tests agent's conviction — NOT because he can't afford it, but to see if the agent believes in the product.
Psychological trigger: Social proof + scarcity. Responds positively to "الوحدة دي اتباع منها 3 الأسبوع ده" or "العرض ده بيخلص بسرعة." If agent caves on price too fast → loses respect and trust; becomes colder.
Budget: 2.8M EGP for a 2BR in a decent compound (does NOT reveal easily — make agent work).
Win condition: Agent holds firm twice, uses real market comparison, and Mohamed asks about the payment plan details.`;
    },
  },
  {
    id: "silent-prospect",
    emoji: "🤐",
    difficulty: "hard",
    accentHex: "#9c27b0",
    dealPrice: "2,200,000",
    commissionRate: 0.025,
    replyDelayMs: 3200,
    replyVarianceMs: 2000,
    psychTags: ["🤐 Introverted", "❓ Open Q's only", "🔍 Hidden interest"],
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
      return `You are Nour, 31, software developer in Egypt. An unexpected phone call you're awkward on.
Only respond in ${a}. MAX one short sentence, often just 2-5 words. Use "..." before answering.
DO NOT write stage directions.

Personality: Monosyllabic on phone. Closed questions get "آه" / "ممكن" / "مش عارفة". Opens up ONLY if agent asks genuinely open questions that give her something specific to react to. If agent uses pressure → "اوكي ممنون" and ends call.
Psychological trigger: Curiosity + zero pressure. She actually likes New Cairo but won't volunteer that until turn 4+.
Budget: ~2.2M EGP by end of year for a 2BR (won't share until third qualifying exchange).
Win condition: Agent asks 3 genuinely open questions — Nour volunteers at least 3 qualifying facts (area, timeline, budget).`;
    },
  },
  {
    id: "time-waster",
    emoji: "⏰",
    difficulty: "medium",
    accentHex: "#00bcd4",
    dealPrice: "4,000,000",
    commissionRate: 0.025,
    replyDelayMs: 1400,
    replyVarianceMs: 900,
    psychTags: ["⏳ No urgency", "💬 Loves chatting", "❤️ Hidden family driver"],
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
      return `You are Hassan, 52, صاحب عمل in Egypt who's been "about to buy" for 3 years.
Only respond in ${a}. Medium warmth — 2-3 sentences. Friendly and slightly rambling.
DO NOT write stage directions.

Personality: Loves talking. Deflects commitment: "ابعتلي البروشور" / "send me the file, I'll look at it." Starts tangents about traffic, prices in 2020, etc. No visible urgency. Very likeable.
Hidden emotional driver (SECRET): He wants to buy an apartment for his daughter Amira who just got engaged. He won't mention this unless agent creates safe space or asks a warm personal question about family or motivation.
Psychological trigger: Family anchor — if the agent connects the property to his daughter's future (even obliquely), Hassan completely opens up, becomes emotional, and suddenly has "urgency."
Budget: 4M EGP. Has the cash. Just needs emotional permission to pull the trigger.
Win condition: Agent discovers the daughter motivation AND closes Hassan to confirm a specific visit day and time.`;
    },
  },
  {
    id: "cold-lead",
    emoji: "❄️",
    difficulty: "easy",
    accentHex: "#607d8b",
    dealPrice: "1,900,000",
    commissionRate: 0.02,
    replyDelayMs: 1800,
    replyVarianceMs: 900,
    psychTags: ["❄️ Cold lead", "😕 Confused", "🌱 Future potential"],
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
      return `You are Asmaa, 27, HR specialist in Egypt. Phone call you weren't expecting.
Only respond in ${a}. Polite but brief — 1-2 sentences. Slightly distracted.
DO NOT write stage directions.

Personality: Genuinely doesn't remember filling the lead form. Not rude, just confused. Says "أنا فاكرة ضغطت غلط" / "I think I clicked by accident." If agent pushes hard → politely excuses herself ("شكراً، أنا مش محتاجة دلوقتي").
Hidden interest: Secretly wants a small studio in New Cairo at some point in the next 1-2 years. Has never spoken to a real estate agent before and has vague fears about the process.
Psychological trigger: Education + zero pressure. If agent explains how the process works in a clear, friendly, non-pushy way and asks one curious question → she starts asking questions herself.
Budget: 1.8-2M EGP (future, not immediate — she'll clarify this if asked gently).
Win condition: Asmaa asks ONE question about the buying process of her own initiative — a future seed planted.`;
    },
  },
  {
    id: "urgent-buyer",
    emoji: "🚨",
    difficulty: "easy",
    accentHex: "#f44336",
    dealPrice: "3,200,000",
    commissionRate: 0.025,
    replyDelayMs: 700,
    replyVarianceMs: 500,
    psychTags: ["🚨 Urgent", "⚡ Decisive", "✅ Ready to close"],
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
      return `You are Tarek, 38, مدير تقنية معلومات relocating from Alexandria to Cairo in 30 days.
Only respond in ${a}. Direct and efficient — 1-2 sentences. In decision mode.
DO NOT write stage directions.

Personality: Pre-approved mortgage up to 3.2M EGP. Wants to sign this week. Hates vagueness or circular conversation. Respects agents who match his energy and ask sharp qualifying questions.
Phrases: "أنا عارف اللي عايزه، قولي في وحدة ولا لا" / "I know what I want — do you have it?" "متى أقدر أشوفها؟" / "When can I see it?"
No emotional complexity — pure logistics. He has a moving truck booked.
Psychological trigger: Competence + directness. He instantly trusts an organised agent who listens and presents relevant options quickly.
Win condition: Agent confirms 2-3 matching options and closes Tarek on a same-day or next-morning site visit.`;
    },
  },
  {
    id: "sayed-father",
    emoji: "👨‍🦳",
    difficulty: "medium",
    accentHex: "#8d6e63",
    dealPrice: "1,950,000",
    commissionRate: 0.025,
    replyDelayMs: 2000,
    replyVarianceMs: 1200,
    psychTags: ["👨‍🦳 Traditional", "🙏 Family honour", "💍 Wedding pressure"],
    name: { en: "The Sa'eedi Father", ar: "الأب الصعيدي" },
    client: {
      en: "Sayed, 58 — Retired military officer, Upper Egypt origin",
      ar: "سيد، 58 — ضابط متقاعد، أصل صعيدي",
    },
    profile: {
      en: "Sayed moved from Sohag to Cairo 20 years ago. His son Hassan is getting married and Sayed must buy an apartment — it is a matter of family honour. He speaks slowly in a warm Upper Egyptian dialect and deeply distrusts Cairo agents he considers 'smooth-talkers'. He opens up only when treated with genuine respect and given plain, simple facts.",
      ar: "سيد انتقل من سوهاج للقاهرة منذ 20 سنة. ابنه حسن على وشك الزواج وسيد لازم يشتري شقة — دي مسألة شرف عيلة. بيتكلم ببطء بلهجة صعيدية دافئة وبيمسكه الظن في وكلاء القاهرة اللي بيسميهم 'ناس كلامهم هوا'. بيتفتح لمن بيتعامل معاه باحترام حقيقي ويديه معلومات بسيطة وواضحة.",
    },
    objective: {
      en: "Earn his trust with respectful simplicity. Clarify delivery date and finishing type. Confirm a suitable unit for Hassan's new home.",
      ar: "اكسب ثقته بالاحترام والبساطة. وضّح موعد التسليم ونوع التشطيب. أكّد وحدة مناسبة لبيت حسن الجديد.",
    },
    tips: [
      { en: "Address him as 'Hader Sayed' — always use respectful titles", ar: "ناديه 'حضرة سيد' — استخدم الألقاب المحترمة دائماً" },
      { en: "Keep language simple — zero jargon", ar: "ابقَ بسيطاً وتجنّب المصطلحات تماماً" },
      { en: "Connect the unit to Hassan's future family", ar: "اربط الوحدة بمستقبل عائلة حسن" },
    ],
    systemPrompt: function (a) {
      return `You are Sayed, 58, a retired military officer originally from Sohag, now living in Cairo. Phone call with a real estate agent about buying an apartment for your son Hassan's upcoming wedding.
Only respond in ${a}. Medium pace — 2-3 sentences. Upper Egyptian (Sa'eedi) dialect and tone.
DO NOT write stage directions.

Personality: Formal, deliberate, uses phrases like "والنبي يا ابني" / "يا حبيبي ده بيت ابني مش بيت فندق" / "قولي الحق بس" / "أنا مش بيّاع أو مشتري ريّان — أنا عايز حاجة حلوة لولادي." Very suspicious of fast-talking sales language. Insists on "مفيش كلام هوا — الأرقام بس."
Dialect cues (Sa'eedi): elongated vowels, "يا عمّي", "يا ابني", formal address "حضرتك" when warmed up, references family and honour frequently.
Hidden emotional driver: Deep family honour — بيت ابنه هو بيت العيلة كلها. Mentions Hassan by name when talking about the apartment.
Budget: 1.9M EGP max for a 2BR fully finished or semi-finished unit. Prefers 6th October City or Ain Sokhna area (familiar from old military days). Willing to consider El Obour.
Win condition: Agent addresses him respectfully (uses حضرتك), gives delivery date + finishing spec clearly, and explicitly connects the unit to Hassan starting his new life there.`;
    },
  },
  {
    id: "gulf-returnee",
    emoji: "🌴",
    difficulty: "medium",
    accentHex: "#ffd600",
    dealPrice: "5,500,000",
    commissionRate: 0.02,
    replyDelayMs: 950,
    replyVarianceMs: 600,
    psychTags: ["🌴 Gulf influenced", "💵 Dollar mindset", "👑 VIP expectations"],
    name: { en: "The Gulf Returnee", ar: "العائد من الخليج" },
    client: {
      en: "Magdy, 45 — Engineer returned from Riyadh after 12 years",
      ar: "مجدي، 45 — مهندس عاد من الرياض بعد 12 سنة",
    },
    profile: {
      en: "Magdy spent 12 years working in Saudi Arabia and just returned to Egypt with dollar and SAR savings worth about 5.5M EGP. He wants a luxury compound — nothing below Palm Hills or Mountain View caliber. He mixes Gulf Arabic expressions into his Egyptian dialect and has high expectations for service quality. He is frustrated that Egypt 'has changed too much' and compares everything to Saudi standards.",
      ar: "مجدي قضى 12 سنة في السعودية ورجع مصر للتو بمدخرات بالدولار والريال تعادل حوالي 5.5 مليون جنيه. عايز كمبوند فاخر — متدني عن مستوى Palm Hills أو Mountain View. بيمزج كلمات خليجية في لهجته المصرية وتوقعاته للخدمة عالية جداً. محبط لأن 'مصر اتغيرت كتير' وبيقارن كل حاجة بالمعايير السعودية.",
    },
    objective: {
      en: "Match his VIP expectations with composure. Position a premium compound's prestige and investment upside. Close on a private viewing.",
      ar: "وازِن توقعاته العالية بهدوء. قدّم هيبة الكمبوند الراقي وإمكانيات الاستثمار. أغلق على جولة خاصة.",
    },
    tips: [
      { en: "Lead with compound prestige — not price", ar: "ابدأ بهيبة الكمبوند لا بالسعر" },
      { en: "Use investment framing — appreciation since 2021", ar: "استخدم إطار الاستثمار — نسبة الارتفاع منذ 2021" },
      { en: "Offer a private exclusive tour — not a group visit", ar: "اقترح جولة خاصة حصرية لا زيارة جماعية" },
    ],
    systemPrompt: function (a) {
      return `You are Magdy, 45, an Egyptian engineer who just returned to Egypt after 12 years in Riyadh. Phone call with a real estate agent about buying a luxury property.
Only respond in ${a}. Confident, slightly impatient — 2-3 sentences. Egyptian dialect naturally mixed with Gulf Arabic expressions.
DO NOT write stage directions.

Personality: High standards. Compares everything to Saudi Arabia. Uses Gulf expressions like "يلا بلا" when bored, "هذا مو مناسب" when something is below standard, "يسلموا" as polite acknowledgement. Egyptian base but code-switches to Gulf terms when expressing frustration.
Phrases: "اللي شفته دلوقتي مش بمستوى اللي كنت متوقعه" / "في السعودية كانوا يعملوا كده..." / "إيه الكمبوند الأعلى في القاهرة الجديدة دلوقتي؟"
Budget: 5-6M EGP for a luxurious 3BR or standalone villa. Has the money but won't reveal it until he feels genuinely respected.
Win condition: Agent confidently names a premium compound (Palm Hills / Mountain View / SODIC / Emaar Mivida caliber), mentions capital appreciation % since 2021, and offers an exclusive private viewing — not a general showroom visit.`;
    },
  },
  {
    id: "govt-employee",
    emoji: "🗂️",
    difficulty: "easy",
    accentHex: "#78909c",
    dealPrice: "1,350,000",
    commissionRate: 0.02,
    replyDelayMs: 1600,
    replyVarianceMs: 800,
    psychTags: ["🗂️ Budget-limited", "😰 Mortgage fears", "🙏 First-time buyer"],
    name: { en: "The Government Employee", ar: "الموظف الحكومي" },
    client: {
      en: "Walid, 47 — Ministry clerk, first-time buyer on a tight salary",
      ar: "وليد، 47 — موظف وزارة، مشترٍ لأول مرة بدخل محدود",
    },
    profile: {
      en: "Walid works at a government ministry earning 9,000 EGP per month. He has saved 400,000 EGP over 10 years and desperately wants to buy before inflation erodes his savings further. He is terrified of installments he cannot afford, confused by developer contracts, and overwhelmed easily. He responds very positively to patient, plain-language guidance with no jargon.",
      ar: "وليد بيشتغل في وزارة حكومية براتب 9,000 جنيه شهرياً. وفّر 400,000 جنيه على مدى 10 سنوات وعايز يشتري قبل ما مدخراته تتآكل بالتضخم. خايف من الأقساط اللي مش هيقدر يدفعها، محتار في عقود التطوير، وبيتعقّد بسهولة. بيستجيب بشكل إيجابي جداً لمن يتعامل معاه بصبر ولغة بسيطة بدون مصطلحات.",
    },
    objective: {
      en: "Help him understand what is realistically achievable. Calculate a workable monthly installment within his budget. Give him clarity and the confidence to take the next step.",
      ar: "ساعده يفهم إيه اللي ممكن تحقيقه فعلاً. احسب له قسطاً شهرياً محتملاً في حدود ميزانيته. أعطه وضوحاً وثقة للمضي قُدُماً.",
    },
    tips: [
      { en: "Confirm what his 400k covers as a down payment first", ar: "أكّد ما يمكن أن يغطيه الـ400 ألف جنيه كمقدم دفع أولاً" },
      { en: "Use simple EGP monthly numbers — avoid percentages", ar: "استخدم أرقام الجنيه الشهرية البسيطة — تجنّب النسب المئوية" },
      { en: "Reassure him about what happens if a payment is missed", ar: "طمئنه على ما يحدث إذا فاته قسط" },
    ],
    systemPrompt: function (a) {
      return `You are Walid, 47, a government ministry employee in Egypt. This is your first time seriously speaking with a real estate agent about buying an apartment.
Only respond in ${a}. Polite, hesitant — 2 sentences. Middle-class Egyptian dialect, careful and slightly nervous.
DO NOT write stage directions.

Personality: Anxious about finances. Full of hesitation phrases: "بس أنا مش عارف هقدر أسدد إزاي" / "ده ميزانيتي مش هتكفي على الأرجح" / "خايف من الالتزامات". Not uneducated — just genuinely anxious about money and contracts.
Responding positively: When agent patiently breaks down monthly installment in plain numbers AND confirms that 400k covers the down payment → Walid visibly relaxes and says "طب دي فكرة كويسة فعلاً — ممكن أعرف أكتر؟"
Budget: 1.2-1.5M EGP total. Has 400k saved as down payment. Monthly comfort zone: 1,500-3,000 EGP/month installment maximum.
Preferred area: 6th October City, El Obour, or Badr City (affordable areas near family).
Win condition: Agent calculates a realistic monthly installment that fits his budget AND confirms the 400k down payment is sufficient — Walid agrees to visit one project.`;
    },
  },
  {
    id: "diaspora-caller",
    emoji: "✈️",
    difficulty: "medium",
    accentHex: "#5c6bc0",
    dealPrice: "4,200,000",
    commissionRate: 0.02,
    replyDelayMs: 1200,
    replyVarianceMs: 800,
    psychTags: ["✈️ Overseas buyer", "💶 Currency hedge", "📱 Remote-only"],
    name: { en: "The Diaspora Caller", ar: "المغترب" },
    client: {
      en: "Sherif, 40 — Egyptian engineer in Frankfurt, Germany",
      ar: "شريف، 40 — مهندس مصري في فرانكفورت، ألمانيا",
    },
    profile: {
      en: "Sherif has lived in Frankfurt for 8 years. He watches the EGP weaken and wants to buy an Egyptian property as a currency hedge. He has around 85,000 EUR saved. He can only deal remotely — no in-person visit possible for 4 months. He mixes Arabic with quick English phrases, is very efficient, and will not tolerate agents who insist on in-person meetings.",
      ar: "شريف يعيش في فرانكفورت منذ 8 سنوات. بيراقب ضعف الجنيه وعايز يشتري عقار مصري كتحوّط للعملة. عنده حوالي 85,000 يورو مدخرات. ما يقدرش يزور بنفسه خلال 4 شهور. بيمزج العربي مع جمل إنجليزية سريعة، فعّال جداً، ولن يتحمل وكلاء لا يستطيعون التعامل عن بُعد.",
    },
    objective: {
      en: "Explain the remote buying process clearly. Address currency payment options. Close him on a virtual tour and discuss Power of Attorney.",
      ar: "اشرح عملية الشراء عن بُعد بوضوح. ناقش خيارات الدفع بالعملة الأجنبية. أغلق على جولة افتراضية وناقش التوكيل الرسمي.",
    },
    tips: [
      { en: "Mention virtual tours immediately — don't wait for him to ask", ar: "اذكر الجولات الافتراضية فوراً — لا تنتظر حتى يسأل" },
      { en: "Explain the Power of Attorney (TOW) process for remote signing", ar: "اشرح عملية التوكيل الرسمي للتوقيع عن بُعد" },
      { en: "Discuss EGP/EUR — some developers accept USD direct transfer", ar: "ناقش خيارات جنيه/يورو — بعض المطورين يقبلون تحويل دولار مباشر" },
    ],
    systemPrompt: function (a) {
      return `You are Sherif, 40, an Egyptian electrical engineer living in Frankfurt, Germany. Phone call with a Cairo real estate agent — you are calling from abroad.
Only respond in ${a}. Efficient and direct — 1-2 sentences. Egyptian Arabic naturally mixed with English phrases (authentic code-switching).
DO NOT write stage directions.

Personality: Businesslike. Mixes English naturally and fluidly: "look, مش عارف exactly what's available" / "can we handle this remotely?" / "لو مفيش virtual tour option, مش هينفع دلوقتي." Gets frustrated with agents who say "تعالى بنفسك" as the only option.
Psychological trigger: Professional competence + remote-process clarity. Immediately trusts an agent who says "I've handled several overseas buyers — here's exactly how the process works."
Budget: 4-4.5M EGP (from EUR savings, roughly 80-85k EUR). Wants New Cairo investment property or North Coast chalet.
Key concern: EGP devaluation protection + property that can be rented out remotely while abroad.
Win condition: Agent clearly explains virtual tour option AND Power of Attorney process → Sherif says "ok, let's schedule the virtual tour."`;
    },
  },
  {
    id: "maadi-elite",
    emoji: "👜",
    difficulty: "hard",
    accentHex: "#ab47bc",
    dealPrice: "9,500,000",
    commissionRate: 0.02,
    replyDelayMs: 1800,
    replyVarianceMs: 1000,
    psychTags: ["👜 High standards", "🗣️ Code-switcher", "🏆 Prestige driven"],
    name: { en: "The Maadi Elite", ar: "نخبة المعادي" },
    client: {
      en: "Hind, 52 — Former diplomat's wife, upper-class Cairo",
      ar: "هند، 52 — زوجة دبلوماسي سابق، نخبة القاهرة",
    },
    profile: {
      en: "Hind has lived in Maadi, London, and briefly Paris. She code-switches effortlessly between Arabic and English. She will not consider anything outside Maadi, Zamalek, or the most prestigious New Cairo compounds like SODIC or Emaar. She is politely dismissive of agents she considers beneath her standard and ends calls the moment she senses desperation or script-reading.",
      ar: "هند عاشت في المعادي ولندن وباريس للفترة الوجيزة. تتنقل بسلاسة بين العربي والإنجليزي في نفس الجملة. لن تقبل بأي شيء خارج المعادي أو الزمالك أو أرقى كمبوندات القاهرة الجديدة كـSODIC أو إعمار. مؤدبة لكنها تتجاهل الوكلاء الذين تعتبرهم 'دون مستواها' وتنهي المكالمة لحظة تشعر باليأس أو قراءة السكريبت.",
    },
    objective: {
      en: "Match her caliber with composed confidence. Present only genuinely prestigious options. Build peer-level rapport — never appear sales-hungry.",
      ar: "وازِن معاييرها بثقة هادئة. قدّم فقط الخيارات المرموقة حقاً. أنشئ تواصلاً من نظير لنظير — لا تبدو جائعاً للصفقة.",
    },
    tips: [
      { en: "Never mention price first — open with project credentials", ar: "لا تذكر السعر أولاً — ابدأ بمؤهلات المشروع" },
      { en: "Match her code-switching naturally — use English when she does", ar: "وازِن تبديل لغتها بشكل طبيعي — استخدم الإنجليزية عندما تفعل ذلك" },
      { en: "Ask about her previous residence — she loves discussing that", ar: "اسأل عن سكنها السابق — تحب الحديث عن ذلك" },
    ],
    systemPrompt: function (a) {
      return `You are Hind, 52, an upper-class Cairo woman — former diplomat's wife. You have lived in Maadi, London, and briefly Paris. Phone call with a real estate agent.
Only respond in ${a}. Measured and composed — 2 sentences. Fluid code-switching between Arabic and English naturally in every message.
DO NOT write stage directions.

Personality: Politely evaluating the agent constantly. Immediately becomes cool if the agent sounds clichéd or desperate. Phrases: "I'm interested, but it needs to be truly exceptional يعني" / "we saw a unit in SODIC — كان أحسن بكتير from what you've described" / "darling, المشروع ده لازم يكون at the right level."
Psychological trigger: Being treated as a highly sophisticated equal, not a buyer who needs convincing. Opens up fully when the agent mentions a project she recognises positively (Maadi Degla, Il Primo, Villette, Emaar Mivida) AND maintains composure without sounding eager.
Budget: 9-12M EGP for a 4BR penthouse or villa. Will not reveal budget until genuinely impressed.
Win condition: Agent impresses Hind by confidently naming a specific premium project she recognises AND maintains calm composure — she asks to schedule a private viewing.`;
    },
  },
  {
    id: "north-coast-seeker",
    emoji: "🏖️",
    difficulty: "easy",
    accentHex: "#00acc1",
    dealPrice: "3,500,000",
    commissionRate: 0.02,
    replyDelayMs: 850,
    replyVarianceMs: 500,
    psychTags: ["🏖️ Vacation buyer", "💬 WhatsApp style", "🤔 Management concern"],
    name: { en: "The North Coast Seeker", ar: "باحث الساحل الشمالي" },
    client: {
      en: "Youssef, 36 — Cairo entrepreneur, holiday property buyer",
      ar: "يوسف، 36 — رائد أعمال قاهري، مشترٍ لعقار اصطياف",
    },
    profile: {
      en: "Youssef runs a small tech startup in Cairo. He wants a chalet or apartment on the North Coast for summer use and potential year-round rental income. He is young, fast-communicating, and writes in short WhatsApp-style messages. His biggest question is: who manages the property when he is back in Cairo?",
      ar: "يوسف يدير شركة تقنية ناشئة صغيرة في القاهرة. عايز شاليه أو شقة على الساحل الشمالي للاستخدام الصيفي وربما دخل إيجاري طوال العام. صغير، سريع التواصل، ويكتب برسائل قصيرة على طريقة واتساب. سؤاله الأكبر: مين يدير العقار لما يرجع القاهرة؟",
    },
    objective: {
      en: "Qualify his summer usage needs. Present a rental management solution. Close on a weekend compound visit.",
      ar: "أهّل احتياجاته الصيفية. قدّم حلاً لإدارة التأجير. أغلق على زيارة للكمبوند في نهاية الأسبوع.",
    },
    tips: [
      { en: "Mention property management service immediately — it's his #1 concern", ar: "اذكر خدمة إدارة العقار فوراً — ده قلقه الأول" },
      { en: "Be brief and punchy — WhatsApp voice-note energy", ar: "كن موجزاً وقوياً — بأجواء رسائل الواتساب الصوتية" },
      { en: "Share seasonal rental yield data for North Coast", ar: "شارك بيانات العائد الإيجاري الموسمي للساحل الشمالي" },
    ],
    systemPrompt: function (a) {
      return `You are Youssef, 36, a young Cairo entrepreneur. Phone call about buying a North Coast vacation property.
Only respond in ${a}. Very casual and concise — 1-2 sentences max. Hip young Cairo dialect, startup energy.
DO NOT write stage directions.

Personality: Communicates like sending voice notes — short punchy messages. Phrases: "عايز حاجة على البحر، مش أكتر" / "طب مين هيدير الشقة لما أكون في القاهرة؟" / "بعتلّي links؟ أشوف أونلاين الأول." Values speed, convenience, and practical answers.
Psychological trigger: Solving the "who manages it" concern immediately. When agent explains an in-house rental management service within the compound → Youssef says "اوكي ده كلام تاني — فين الكمبوند ده بالظبط؟"
Budget: 3-4M EGP for a 2BR chalet or ground-floor apartment with garden. North Coast (Sahel) only — Hacienda Bay, Marassi, or similar branded resort compound preferred.
Key concern: Proving rental income covers annual maintenance fees + who handles it remotely.
Win condition: Agent names a specific North Coast compound with in-house rental management AND shares estimated seasonal rental income → Youssef agrees to a weekend site visit.`;
    },
  },
];

// ══════════════════════════════════════════════════════════════════════
//  MARKET KNOWLEDGE BASE  (injected into every AI call as grounding context)
// ══════════════════════════════════════════════════════════════════════
const MARKET_KNOWLEDGE = `=== EGYPTIAN REAL ESTATE — SIMULATION GROUNDING CONTEXT ===

PRICE BENCHMARKS (2024-2025, primary market):
• New Cairo / El Mostakbal City: 18,000–28,000 EGP/sqm
• Madinaty (Talaat Mostafa Group): 20,000–26,000 EGP/sqm; service charge ~1,100–1,400 EGP/sqm/year
• Sheikh Zayed / 6th October City: 12,000–20,000 EGP/sqm
• Heliopolis (resale): 25,000–40,000 EGP/sqm
• Maadi / Zamalek (resale): 35,000–55,000 EGP/sqm (very limited supply)
• Ain Sokhna / North Sokhna: 18,000–32,000 EGP/sqm for chalets
• North Coast (Sahel branded compounds): 25,000–65,000 EGP/sqm

MAJOR DEVELOPERS & FLAGSHIP PROJECTS:
• Talaat Mostafa Group (TMG): Madinaty, Al Rehab City
• Palm Hills Developments: Palm Hills Katameya, Palm Hills New Cairo, Badya (6th October)
• SODIC: East (New Cairo), West (Sheikh Zayed), Il Primo, Villette
• Mountain View (DMG): iCity New Cairo, Mountain View El Sokhna, Hyde Park New Cairo
• Emaar Misr: Uptown Cairo, Mivida (New Cairo)
• Hyde Park Developments: Hyde Park New Cairo
• Ora Developers: Zed East (New Cairo), Zed West (6th October)
• Al Ahly Sabbour: Galeria Moon Valley, Keeva (Zayed)
• Mnhd (Al Masryeen): Naeem Compound, M Square
• Hacienda Bay / Marassi / Cali Coast: North Coast resort compounds

TYPICAL PAYMENT PLANS (2024):
• Down payment: 5%–30% of contract value depending on developer
• Installment period: 4–10 years (most common sweet spot: 6–8 years)
• Annual service charge: 800–1,500 EGP/sqm/year in gated compounds
• Delivery timeline: off-plan 2–5 years; RTM (Ready To Move) = immediate handover
• Some premium developers (Emaar, SODIC) accept USD/EUR wire transfers for overseas buyers

RENTAL YIELD BENCHMARKS:
• New Cairo compounds: 6%–9% gross annual yield
• 6th October / Sheikh Zayed: 5%–8% gross
• North Coast (Sahel) seasonal: 8%–14% if rented Jun–Sep via management company
• Average North Coast seasonal rental: 8,000–18,000 EGP/week for 2BR chalet

QUALIFICATION PILLARS (RED Academy framework):
1. Destination — area/compound preference (commute, school zone, social status)
2. Unit type / area — apartment, duplex, villa? sqm required?
3. Delivery date tolerance — urgent move-in vs off-plan acceptance
4. Finishing specs — Core & Shell / Semi Finished / Fully Finished / Furnished
5. Developer trust preference — branded vs independent developer
6. History — what has client seen? what objections have already been raised?
7. Budget / Down payment / Payment quarter — financial reality

BUYER PSYCHOLOGY PRINCIPLES:
• People buy to feel good OR to solve a problem — identify the real driver
• Stated need is surface; emotional want is deeper (listen for family, status, security anchors)
• Mirror the client's tonality and vocabulary to build rapport
• Tonality drives 38% of call outcome; words only 7%; physical presence 55%
• Never use yes/no questions with introverted or hesitant clients
• Scarcity + social proof closes price fighters — not discounts
• Family anchors (children, spouse, parents) unlock hidden urgency

COMMON PRICE/MARKET OBJECTIONS:
• "Too expensive" → Anchor to all-in value: sqm price + service charge + finishing quality
• "Prices will drop" → EGP property prices have not dropped in nominal terms since 2016; appreciation 15–25%/year in prime compounds
• "I'll think about it" → Find the ONE real blocker; the thought is always about something specific
• "I have another agent" → Ask if they have access to off-market or exclusive pre-launch stock
• "I don't trust developers" → Offer reference list of delivered units + recent construction photos

AUTHENTIC EGYPTIAN CLIENT ARCHETYPES (for scenario realism):
• Sa'eedi dialect: elongated vowels, "يا عمّي", "والنبي", formal "حضرتك", family-honour references
• Gulf-returnee: Egyptian base + Khaleeji loan words ("يلا بلا", "هذا مو", "يسلموا"), high service expectations
• Alexandrian: Mediterranean warmth, "يسلمو", relaxed pace, skeptical of Cairo developers
• Upper-class Cairene: Arabic-English code-switching, brand awareness, composure, peer-level tone
• Young entrepreneur: WhatsApp-style brevity, tech-savvy, practical and direct
• Diaspora caller: Latin/European time zone, Arabic with English/foreign language mix, efficiency-focused
• Government employee: polite, anxious about finance, responds to patience and plain numbers
• Traditional family buyer: honour-driven, formal, deeply relational, family-centric`.trim();

// ══════════════════════════════════════════════════════════════════════
//  DEBRIEF SYSTEM PROMPT
// ══════════════════════════════════════════════════════════════════════
function buildDebriefPrompt(scenario, transcript, langCode) {
  // Extract agent turns (numbered) for turn-by-turn rating
  const agentTurns = transcript
    .split("\n")
    .filter((l) => l.startsWith("Agent:"))
    .map((l, i) => `Turn ${i + 1}: ${l.slice(7).trim()}`);

  return `You are a senior real estate sales trainer evaluating a 1-on-1 call simulation.
Use the following market context to assess whether the agent's numbers and claims are accurate:
${MARKET_KNOWLEDGE}

SCENARIO: "${scenario.name.en}"
CLIENT BRIEF: ${scenario.profile.en}
CALL OBJECTIVE: ${scenario.objective.en}

FULL TRANSCRIPT (agent is the trainee):
${transcript}

AGENT TURNS ONLY (for turn-by-turn rating):
${agentTurns.join("\n")}

Evaluate the agent's performance and respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "scores": {
    "rapport": <integer 0-20>,
    "qualification": <integer 0-20>,
    "objection_handling": <integer 0-20>,
    "closing_attempt": <integer 0-20>,
    "communication": <integer 0-20>
  },
  "turnRatings": [
    {"turn": 1, "rating": "strong|ok|weak", "reason": "<10 words max>"}
  ],
  "wins": [
    {"quote": "<exact agent phrase>", "why": "<why it worked, 1 sentence>"}
  ],
  "losses": [
    {"quote": "<exact agent phrase>", "why": "<why it failed, 1 sentence>"}
  ],
  "betterPhrase": "<one improved version of the WORST agent line — in ${langCode === "ar" ? "Arabic" : "English"}>",
  "coaching": [
    {"emoji": "✅", "tip": "<specific win, reference actual lines>"},
    {"emoji": "⚠️", "tip": "<specific weakness, reference actual lines>"},
    {"emoji": "💡", "tip": "<one actionable technique for next time>"}
  ]
}

Rules:
- wins: 1-2 items max. Only include if there are genuine strong moments.
- losses: 1-2 items max. Only include if there are genuine weak moments.
- turnRatings: one entry per agent turn, same count as AGENT TURNS above.
- betterPhrase: rewrite the single weakest agent line only.
- Be brutally honest. Short poor calls should score low.
- Respond in ${langCode === "ar" ? "Arabic" : "English"}.`;
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
  const exclude = existingNames.slice(0, 20).join(", ");
  return `You are designing a brand-new Egyptian real estate sales training scenario for phone call simulation.
Use this market knowledge to ensure realistic prices, compound names, and buyer behaviour:
${MARKET_KNOWLEDGE}

DIFFICULTY: ${difficulty}
DO NOT duplicate any of these existing client types: ${exclude}

Create a UNIQUE, realistic Egyptian client persona. Prioritise archetypes NOT yet covered by the existing list above, including: Sa'eedi (Upper Egypt) dialect speakers, Gulf returnees, diaspora callers from abroad, government employees on tight budgets, Alexandrian buyers, elderly parents buying for children, and upper-class Maadi/Zamalek-tier clients.

Each persona MUST include:
• A real Egyptian name (romanised), authentic age and profession
• A genuine emotional backstory driving the purchase decision
• ONE dominant communication quirk that challenges the sales agent
• Authentic dialect cues (Sa'eedi phrases, Gulf expressions, code-switching, etc.) where relevant
• Realistic budget for the Egyptian market (1.2M – 12M EGP)
• Specific location preference drawn from the market knowledge above

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
//  OBJECTION LIBRARY  (per-scenario Q&A for the Objection panel)
// ══════════════════════════════════════════════════════════════════════
const OBJECTION_LIBRARY = {
  'skeptical-engineer': [
    { q: "Your price per sqm is too high", a: "Let's compare: 3.5M for 160sqm = ~21k/sqm. Competitor at 19k/sqm BUT has 6% annual maintenance vs our 1.5%. That gap is 250k+ over 5 years." },
    { q: "All agents make the same promises", a: "Understood — skip the pitch. Give me your top 3 questions right now and I'll get you exact numbers before we hang up." },
    { q: "I heard this project is delayed", a: "Valid concern. The project is 78% complete. I can send today's construction photos and the official Q3 handover schedule within 5 minutes." },
    { q: "I don't trust your payment plan numbers", a: "I can arrange a 3-way call with the developer's finance team right now to walk through the contract schedule line by line." },
  ],
  'impatient-investor': [
    { q: "What's the rental yield?", a: "Similar units on Palm Hills Katameya yield 7.2%. This unit is positioned to hit 8.5% based on Q1 2024 rental data in this exact zone." },
    { q: "I can get a better ROI elsewhere", a: "Which benchmark? If it's 6% on older stock — true. But this compound appreciates 12-15% annually vs 6-7% on older buildings. Net ROI is higher." },
    { q: "Is this unit actually rentable?", a: "Compound occupancy for similar units is 94%. Average contract: 2 years. I can connect you with 2 current tenants in the same building." },
    { q: "How quickly can I resell?", a: "Secondary market: avg 4-6 months to sell at 8-12% above purchase. I have 2 comp transactions from Q1 2024 I can share now." },
  ],
  'indecisive-couple': [
    { q: "We can't agree on location", a: "Let me solve both: Omar needs amenities, Sara needs schools. Zayed compound — 3 schools within 800m AND pool/gym. Can we agree it's worth a quick visit?" },
    { q: "We need more time to think", a: "Totally fine. Let me shortlist 2 options — one for Omar's priorities, one for Sara's. Just see them. No decision needed before the visit." },
    { q: "Our budgets don't match", a: "Sara at 3.5M, Omar at 4.5M — there's a 4M 3BR that checks both lists. Let me pull that one scenario and show you both." },
    { q: "We've already visited too many places", a: "What did you like best in any of them? I want to build on what already worked — not repeat what didn't." },
  ],
  'price-hammerer': [
    { q: "This is too expensive!", a: "Compared to what you saw — or what you expected? Share the number and I'll tell you exactly what's different, line by line." },
    { q: "Can you give me a discount?", a: "I can't move the base price. But covered parking (70k value) is available if we move this week. More useful than a 2% cut?" },
    { q: "I heard better prices somewhere else", a: "Which project? Some quotes exclude maintenance fees, finishing quality, and parking. Show me the quote — let's compare all-in." },
    { q: "I'll think about it and call back", a: "The unit is available now. There's another appointment request for tomorrow. Can I lock you in for a visit today so you have priority?" },
  ],
  'silent-prospect': [
    { q: "Yes. (one-word answer)", a: "Tell me more about that 'yes' — what matters most to you in this? I want to make sure we're on the same page about your priorities." },
    { q: "Maybe.", a: "Fair answer. What would need to be true for it to become a 'yes'? Just one specific thing — I want to work toward that for you." },
    { q: "I don't know.", a: "That's okay. Specific question: if you were to visit one property this Saturday, what would make that 20 minutes worth your time?" },
    { q: "(Long silence)", a: "Take your time — I'm not going anywhere. Or if easier, I can ask just 3 quick questions — one minute total. Completely up to you." },
  ],
  'time-waster': [
    { q: "I'm still thinking, not ready yet", a: "You've been thinking for a while — what's the ONE thing still holding you back? If I can answer that today, are you closer to moving forward?" },
    { q: "Send me brochures first", a: "I can send materials, but they won't show what matters to you personally. A 20-minute visit gives more info than 20 brochures. Which day this week?" },
    { q: "I have another agent already", a: "I respect that. One question: how long have you been waiting for them to deliver something specific? I have an option for you right now." },
    { q: "Prices will drop soon", a: "Let me show you 3 years of pricing data in this area. The trend hasn't gone the direction most people expect. Can I walk you through 2 minutes of numbers?" },
  ],
  'cold-lead': [
    { q: "I don't remember any form", a: "Totally understandable. You filled a property inquiry form on [platform] about 2 months ago for a unit in [compound]. Does that ring a bell at all?" },
    { q: "I'm not really looking right now", a: "No pressure. Quick question: what would need to change for you to start looking? Just curious — genuinely not a sales pitch." },
    { q: "How did you get my number?", a: "You shared it on a property inquiry form. I only contact people who've expressed interest. Is now a bad time? I can call back at a better moment." },
    { q: "I already have an agent", a: "Great — I won't interfere. One thing: do they have access to off-market listings? Those are rare. Just want to make sure you're not missing anything." },
  ],
  'urgent-buyer': [
    { q: "Can you arrange a visit this week?", a: "Yes — tomorrow at 10am or Saturday at 2pm. Which works? I'll confirm the slot right now and make sure the unit is ready for you." },
    { q: "Is the unit vacant and move-in ready?", a: "Yes, fully finished and vacant. Handover walk-through can happen the same day you sign — this week if your mortgage is already approved." },
    { q: "My mortgage might take time", a: "Your broker can fast-track with our finance partner — 48-hour in-principle approval. I'll connect you both right after this call." },
    { q: "What if I find something better?", a: "I want you to find the best option. But this unit matches your criteria exactly and there are 2 pending requests. To get priority, we need to move today." },
  ],
  'sayed-father': [
    { q: "How do I know this developer is trustworthy?", a: "سؤال في محله يا حضرة سيد. المطوّر ده سلّم 3 مشاريع قبل كده في مواعيدها. أنا هبعتلك قائمة بأسماء عملاء في نفس الكمبوند تقدر تتكلمهم بنفسك." },
    { q: "The price seems too high for what I get", a: "السوق اتغيّر — مش غلطتك يا حاج سيد. بس قارن: نفس المساحة في موقع أضعف بـ200 ألف أرخص — بس الفرق في الجار والأمان والمصايف. الأسعار مش بتنزل في مصر من 2016." },
    { q: "I need more time — this is a big decision", a: "أكيد يا حضرتك — ده قرار مهم. بس قولي: حسن عنده تاريخ محدد للأفراح؟ عشان أنسّق التسليم بشكل صح وأضمنلك الوحدة متتحجزش." },
    { q: "Can I bring my son to see it first?", a: "ده أصح قرار يا حضرة سيد. أنا هرتّب جولة حضرتك وحسن مع بعض ونشوف الوحدة بالتفصيل. يوم الجمعة مناسب ولا السبت أحسن؟" },
  ],
  'gulf-returnee': [
    { q: "Everything here has changed — I don't recognise Egypt anymore", a: "التغيير ده صبّ في صالح المستثمر يا مجدي. من 2021 لحد دلوقتي أسعار القاهرة الجديدة اتضاعفت تقريباً. اللي اشترى وقتها اتعوّض ضعفين على مدخراته." },
    { q: "The quality here is nothing like Saudi", a: "مفيش حاجة زي ما تشوف بعينك. أنا هآخدك في جولة خاصة في مشروع واحد بس — على مستوى اللي تعودت عليه. لو مش مقنعك خالص، مفيش مشكلة." },
    { q: "I need to discuss this with my wife first", a: "أحسن قرار. هل مدام معاك في مصر ولا لسه هناك؟ ممكن نرتّب جولة للاتنين مع بعض — ومعاكم وقت كافي تشوفوا بالراحة." },
    { q: "What's the return if I rent it out?", a: "كمبوند من مستوى Palm Hills Katameya بيدّي 7-9% عائد سنوي إيجاري. اللي اشترى في Badya 2021 بيعيد بيعه دلوقتي بزيادة فوق 60%. أنا هبعتلك مقارنة كاملة." },
  ],
  'govt-employee': [
    { q: "I can't afford the down payment", a: "لحظة — الـ400,000 جنيه اللي معاك هي المقدم المطلوب بالظبط لوحدة بـ1.3 مليون. مش محتاج تدفع أكتر دلوقتي. الباقي على 8 سنين = قسط شهري حوالي 1,100 جنيه." },
    { q: "What if I miss an installment one month?", a: "عادةً في العقود، لو فاتت قسط واحدة مش بيحصل حاجة فورية — بيتواصلوا معاك ويدوك grace period. الأهم تفتح خط تواصل مع المطوّر. أنا هشرح لك البند ده في العقد بالتفصيل." },
    { q: "All prices are too high for my budget", a: "في مشاريع بتبدأ من 1.2 مليون في 6 أكتوبر والبدر. مش فاخرة — بس نظيفة وآمنة ومطوّر محترم. خليني أشوفلك الأنسب لميزانيتك بالظبط." },
    { q: "I've never signed a developer contract before", a: "مش محتاج تعرف كل حاجة — ده دوري. أنا هبقى معاك في كل خطوة من أول التفاوض لحد التسليم. أي سؤال مش ممنوع — اسألني أي حاجة." },
  ],
  'diaspora-caller': [
    { q: "Can I really buy a property without being in Egypt?", a: "Yes — وده بيحصل كتير مع مصريين في الخارج. التوكيل الرسمي لشخص تثق فيه أو محامي، الدفع أونلاين، وكل الأوراق على الإيميل. اشتغلت مع عملاء من ألمانيا وهولندا بنفس الطريقة بالظبط." },
    { q: "How do I pay in EUR or USD?", a: "بعض المطورين الكبار — Emaar وغيرهم — بيقبلوا تحويل بالدولار مباشرةً على حسابات الشركة. غيرهم بيحوّلوا بسعر السوق. أنا هبعتلك التفاصيل بعد ما تختار المشروع." },
    { q: "What if the EGP falls even more?", a: "دي بالظبط الفرصة. العقار المصري بيحمي من التضخم تاريخياً — من 2016 لحد 2024 سعر المتر اتضاعف 4-5 مرات. أنت مش بتشتري بالجنيه — أنت بتحوّل EUR لأصل حقيقي ثابت." },
    { q: "How do I see the property virtually?", a: "عندي جولة فيديو كاملة للمشروع، وأقدر أعمل معك Zoom وأنا جوّا الوحدة بنفسي. إيه وقت مناسب الأسبوع الجاي؟" },
  ],
  'maadi-elite': [
    { q: "I've seen every project — nothing has impressed me", a: "I believe you — بس this one opened last quarter and it's genuinely different. The interior specs are على مستوى Maadi Degla, and it's not yet open publicly. Would you like a private preview before it is?" },
    { q: "Typical agents always disappoint me", a: "That's fair — والصراحة أحسن من الإطراء. I won't pitch you anything that doesn't match what you've lived in. Tell me: what was the one thing about Maadi you truly couldn't compromise on?" },
    { q: "The location has to be exactly right", a: "Absolutely. The compound is في قلب التجمع الخامس — same privacy as Maadi Degla, completely gated. لا جيران من الخارج خالص. Shall I elaborate on the immediate neighbourhood profile?" },
    { q: "I'll take time to decide — no rush", a: "Of course — هده قرارك. I just want to make sure you have the right information. There are only a few penthouses in that block and two are under negotiation. No pressure — I just didn't want you to miss it." },
  ],
  'north-coast-seeker': [
    { q: "Who manages the property when I'm in Cairo?", a: "ده السؤال الصح — الكمبوند ده عنده rental management service داخلية. هم بيديروا التأجير ويبعتولك الفلوس شهرياً مع تقرير. مش محتاج تعمل حاجة." },
    { q: "What rental income can I realistically expect?", a: "موسم الصيف (يونيو-سبتمبر) متوسط 10,000–16,000 جنيه في الأسبوع لشاليه 2 غرف في منطقة مرسى مطروح. 4 أسابيع = 40,000–65,000 جنيه — ده بيغطي الصيانة السنوية وزيادة." },
    { q: "Is North Coast a good investment right now?", a: "الساحل الشمالي ارتفع 70-90% من 2021 لحد 2024. غير الإيجار الموسمي — القيمة نفسها بترتفع سنة بعد سنة. الطلب مش بيوقف." },
    { q: "Can I see it online before visiting?", a: "أكيد — بعتلك drone footage للكمبوند وجولة 360 للوحدة على واتساب دلوقتي. بس صدقني النوع ده من العقار لازم تحسّه بنفسك — يوم الجمعة مناسب لزيارة سريعة؟" },
  ],
};

// ══════════════════════════════════════════════════════════════════════
//  CAMPAIGN TRACKS
// ══════════════════════════════════════════════════════════════════════
const CAMPAIGN_TRACKS = [
  {
    id: "classic",
    icon: "🎯",
    name: { en: "The Classic Sprint", ar: "السباق الكلاسيكي" },
    scenarioIds: ["cold-lead", "price-hammerer", "skeptical-engineer"],
  },
  {
    id: "gauntlet",
    icon: "🏆",
    name: { en: "The Gauntlet", ar: "الاختبار الكبير" },
    scenarioIds: ["urgent-buyer", "impatient-investor", "indecisive-couple"],
  },
];

// ══════════════════════════════════════════════════════════════════════
//  CLIENT OPENING LINES  (client speaks first when call connects)
// ══════════════════════════════════════════════════════════════════════
const OPENING_LINES = {
  'skeptical-engineer':  { en: "Hello? ...Yeah, who's this?", ar: "آلو؟ ... أيوه — مين معايا لو سمحت؟" },
  'impatient-investor':  { en: "Yeah? Make it fast.", ar: "آلو — نعم؟ سريع." },
  'indecisive-couple':   { en: "Omar: Hello? ...Sara (in background): Omar who is that?", ar: "عمر: آلو؟ ... سارة (في الخلفية): عمر مين ده؟" },
  'price-hammerer':      { en: "Hello — yeah?", ar: "آلو — أيوه؟ قولي." },
  'silent-prospect':     { en: "... Hello.", ar: "... آلو." },
  'time-waster':         { en: "Hellooo! Welcome welcome! Who is this? How are you?", ar: "آلووو! أهلاً أهلاً أهلاً! مين معايا يا فندم؟ إزيك؟" },
  'cold-lead':           { en: "Hello? Yes, who's calling?", ar: "آلو؟ نعم — مين بيكلمني؟" },
  'urgent-buyer':        { en: "Tarek speaking — go ahead.", ar: "معاك طارق — اتكلم." },
  'sayed-father':        { en: "Hello... yes... who is this, son?", ar: "آلو... نعم يا ابني... مين حضرتك؟" },
  'gulf-returnee':       { en: "آلو — yes, go ahead يا عم.", ar: "آلو — أيوه اتفضل يا عم." },
  'govt-employee':       { en: "Hello? ... Yes?", ar: "آلو؟ ... أيوه، نعم؟" },
  'diaspora-caller':     { en: "Hello? آلو — okay one sec, connection's bad. Alright, go ahead.", ar: "هاي؟ آلو — ثانية الاتصال وحيش. أوكي، اتكلم." },
  'maadi-elite':         { en: "Yes? Speaking.", ar: "آلو — أيوه، معاكي هند." },
  'north-coast-seeker':  { en: "Hey — yeah, go ahead man.", ar: "آلو — أيوه كلمني يا عم." },
};

// ══════════════════════════════════════════════════════════════════════
//  DIALECT LABELS  (shown on scenario cards)
// ══════════════════════════════════════════════════════════════════════
const DIALECT_LABELS = {
  'skeptical-engineer':  '🗣️ Formal Cairo',
  'impatient-investor':  '🗣️ Cairo Business',
  'indecisive-couple':   '🗣️ Mixed Cairo',
  'price-hammerer':      '🗣️ Informal Egyptian',
  'silent-prospect':     '🗣️ Minimal Dialect',
  'time-waster':         '🗣️ Warm Cairo',
  'cold-lead':           '🗣️ Polite Cairo',
  'urgent-buyer':        '🗣️ Direct MSA',
  'sayed-father':        '🗣️ Saʿeedi / Upper Egypt',
  'gulf-returnee':       '🗣️ Egyptian × Gulf',
  'govt-employee':       '🗣️ Middle-Class Cairo',
  'diaspora-caller':     '🗣️ Arabic × English',
  'maadi-elite':         '🗣️ Code-switching',
  'north-coast-seeker':  '🗣️ Young Cairene',
};

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
//  PERSONAL BEST  (per scenario, persisted in localStorage)
// ══════════════════════════════════════════════════════════════════════
const PB_KEY = "pitchlab_pb";

function loadPBs() {
  try { return JSON.parse(localStorage.getItem(PB_KEY) || "{}"); } catch { return {}; }
}

function savePB(scenarioId, total) {
  const pbs = loadPBs();
  if (!pbs[scenarioId] || total > pbs[scenarioId].best) {
    pbs[scenarioId] = { best: total, date: new Date().toLocaleDateString() };
    localStorage.setItem(PB_KEY, JSON.stringify(pbs));
  }
}

function getStars(total) {
  if (total >= 70) return "⭐⭐⭐";
  if (total >= 40) return "⭐⭐";
  if (total >= 15) return "⭐";
  return "";
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
let closingTemp = 0;  // 0–100 deal temperature
let ringTimer = null; // auto-answer timer for incoming screen
let coachOpen = false; // live coach panel visible

// Speed Round state
let speedMode = false;
let speedTimeouts = 0;
let speedHandle = null;
let speedSecsLeft = 0;
const SPEED_LIMITS = { easy: 20, medium: 15, hard: 10 };

// Objection library state
let objectionOpen = false;

// Campaign state
let campaignMode  = false;
let campaignTrack = null;   // CAMPAIGN_TRACKS entry
let campaignScores = [];    // [{name, score, stars}] — grows per completed call

// ══════════════════════════════════════════════════════════════════════
//  WEB AUDIO — RING TONE
// ══════════════════════════════════════════════════════════════════════
let _audioCtx = null;
let _ringOscillators = [];
let _ringHandle = null;

function getAudioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new AudioContext(); } catch { return null; }
  }
  if (_audioCtx.state === "suspended") _audioCtx.resume().catch(() => {});
  return _audioCtx;
}

function playRingTone() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  stopRingTone();

  function ringOnce() {
    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(480, ctx.currentTime);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(620, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.85);
      osc2.stop(ctx.currentTime + 0.85);
      _ringOscillators.push(osc1, osc2);
    } catch { /* audio not available */ }
  }

  ringOnce();
  _ringHandle = setInterval(ringOnce, 2200);
}

function stopRingTone() {
  clearInterval(_ringHandle);
  _ringOscillators.forEach((o) => { try { o.stop(); } catch { /* stopped already */ } });
  _ringOscillators = [];
}

// ══════════════════════════════════════════════════════════════════════
//  SCENARIO THEME
// ══════════════════════════════════════════════════════════════════════
function setScenarioTheme(scenario) {
  const hex = scenario.accentHex || "#0096ff";
  const rgb = hexToRgb(hex);
  const root = document.documentElement;
  root.style.setProperty("--sa", hex);
  if (rgb) {
    root.style.setProperty("--sa-dim", `rgba(${rgb},0.1)`);
    root.style.setProperty("--sa-glow", `rgba(${rgb},0.28)`);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  INCOMING CALL SCREEN
// ══════════════════════════════════════════════════════════════════════
function showIncomingCall() {
  if (!currentScenario) return;
  const s = currentScenario;

  const avatarEl = $("incoming-avatar");
  if (avatarEl) avatarEl.textContent = s.emoji;
  const nameEl = $("incoming-name");
  if (nameEl) nameEl.textContent = s.name[lang] || s.name.en;
  const subEl = $("incoming-sub");
  if (subEl) subEl.textContent = s.client[lang] || s.client.en;

  setScenarioTheme(s);
  showScreen("screen-incoming");
  playRingTone();

  // Auto-answer after 9 s if user doesn't interact
  clearTimeout(ringTimer);
  ringTimer = setTimeout(() => {
    stopRingTone();
    startCall();
  }, 9000);
}

// ══════════════════════════════════════════════════════════════════════
//  SIGNAL BARS ANIMATION
// ══════════════════════════════════════════════════════════════════════
function animateSignalBars() {
  const bars = document.querySelectorAll(".sb");
  bars.forEach((b) => b.classList.remove("active"));
  let i = 0;
  const interval = setInterval(() => {
    if (i < bars.length) {
      bars[i].classList.add("active");
      i++;
    } else {
      clearInterval(interval);
    }
  }, 200);
}

// ══════════════════════════════════════════════════════════════════════
//  CLOSING METER
// ══════════════════════════════════════════════════════════════════════
function updateClosingMeter(temp) {
  const fill = $("closing-fill");
  const badge = $("closing-pct");
  if (fill) fill.style.width = Math.max(0, Math.min(100, temp)) + "%";
  if (badge) {
    if (temp < 30) {
      badge.textContent = "COLD";
      badge.className = "closing-pct-badge";
    } else if (temp < 65) {
      badge.textContent = "WARM";
      badge.className = "closing-pct-badge warm";
    } else {
      badge.textContent = "HOT 🔥";
      badge.className = "closing-pct-badge hot";
    }
  }
}

function estimateClosingTemp(aiText) {
  const strongPos = /site visit|موعد|نزور|نروح نشوف|اتفقنا|let.*go|when can|when are|متى|نيجي|نشوف|deal|هنعمل|confirmed/i;
  const pos = /okay|ok يلا|agree|متفق|جميل|آه طب|طيب|interested|more|tell me|أكتر|أشوف|opening up|مناسب|follow|نكمل|يمكن|possible|sure|ممكن/i;
  const neg = /bye|goodbye|شكراً.*مش|مش محتاج|not interested|later|مش مهتم|مش مناسب|هنتكلم|وداعاً/i;

  let delta = 4; // base increment per exchange
  if (strongPos.test(aiText)) delta = 22;
  else if (pos.test(aiText)) delta = 10;
  else if (neg.test(aiText)) delta = -12;

  closingTemp = Math.max(0, Math.min(100, closingTemp + delta));
  updateClosingMeter(closingTemp);
}

// ══════════════════════════════════════════════════════════════════════
//  LIVE COACH SYSTEM
// ══════════════════════════════════════════════════════════════════════
const COACH_SIGNALS = {
  opening:   { icon: "🎯", label: "Opening phase",   cls: "" },
  curious:   { icon: "✅", label: "They're curious",  cls: "good" },
  warming:   { icon: "🔥", label: "Warming up",       cls: "hot" },
  objecting: { icon: "⚡", label: "Objecting",         cls: "warning" },
  cooling:   { icon: "⚠️", label: "Cooling off",       cls: "danger" },
  neutral:   { icon: "💬", label: "Neutral exchange",  cls: "" },
};

function analyzeSignal(aiText) {
  const cooling   = /bye|وداعاً|مش مهتم|not interested|مشغول|مش وقته|مش محتاج|مش مناسب|هنتكلم|بعدين خليني/i;
  const warming   = /site visit|موعد|نزور|نروح نشوف|اتفقنا|let.*go|when can|متى|يلا|نيجي|deal|هنعمل|confirmed|مظبوط|أيوه تمام|ممتاز/i;
  const curious   = /tell me more|أكمّل|أكمل|عايز أعرف|ايه التفاصيل|و إيه|وإيه|more details|كمان|و بعدين|طيب و|أقولي|اشرحلي|interested|قوليلي/i;
  const objecting = /غالي|too expensive|expensive|ده غالي|ارخص|discount|خصم|مش مقتنع|prove|بيقولوا|سمعت إن|مش متأكد|not sure|دليل/i;
  if (cooling.test(aiText))   return "cooling";
  if (warming.test(aiText))   return "warming";
  if (curious.test(aiText))   return "curious";
  if (objecting.test(aiText)) return "objecting";
  return "neutral";
}

const SCENARIO_COACH = {
  "skeptical-engineer": {
    opening:   { tactic: "Lead with one verifiable fact — never an unproven claim.", phrase: "أنا عارف إنك بتحتاج أرقام أكيدة — عندي تقرير تسليم ومعدل إيجار فعلي هبعتهولك." },
    curious:   { tactic: "Give a specific yield % or delivery record — don't generalise.", phrase: "الوحدات في نفس المشروع بتوفر 8–9% عائد إيجاري — عندي الشيت هبعته دلوقتي." },
    objecting: { tactic: "Never counter a skeptic. Agree + give independent proof.", phrase: "محق تماماً إنك تشك — ده بالظبط إيه دفعني أجيبلك مقارنة بـ 3 مشاريع." },
    cooling:   { tactic: "Offer a step they can verify without trusting you.", phrase: "مش هطلبك تثق فيّ — فقط اتصل بمكتب تسجيل عقاري وأكد الأرقام اللي قوليك." },
    warming:   { tactic: "Mirror his analytical language — use % not EGP sums.", phrase: "ممتاز — إيه الـ IRR اللي بتستهدفه؟ نشوف لو المشروع ده يوفره." },
    neutral:   { tactic: "Apply the '3-data-point' rule — every claim needs proof.", phrase: "عندك حق تفكر بعناية — خلينا نبدأ بالأرقام الفعلية." },
  },
  "impatient-investor": {
    opening:   { tactic: "Get to ROI within 15 seconds or he'll disengage.", phrase: "خالد — الوحدة دي 8.5% عائد إيجاري في منطقة بيتصاعد فيها السعر 20% سنوياً." },
    curious:   { tactic: "Feed another number — ROI → flipping potential → timeline.", phrase: "طيب والـ exit strategy — نفس المشروع ارتفع 22% ومع التسليم هتقدر تبيع فوراً." },
    objecting: { tactic: "Don't negotiate price — reframe as investment math.", phrase: "مش بنبيعلك شقة — بنبيعلك asset بقيمة X اللي هتبقى Y في 3 سنين." },
    cooling:   { tactic: "One sharp scarcity fact — limit creates urgency for investors.", phrase: "تمام — في 2 وحدة بس بنفس الـ floor plan. لو مش مهتم عندي مشتري ثاني." },
    warming:   { tactic: "Jump to closing — propose a 24h decision window.", phrase: "يلا — بكرة أوعدلك بجولة ومعاها محاسب يأكد الأرقام. الساعة كام يريحك؟" },
    neutral:   { tactic: "Cut fluff. Numbers only. He respects speed and directness.", phrase: "باختصار — عائد 8.5%، تسليم 2026، New Cairo من أعلى 3 مناطق طلب." },
  },
  "indecisive-couple": {
    opening:   { tactic: "Don't pick sides — validate BOTH Omar and Sara by name.", phrase: "عمر وسارة — فاهم إن عمر شايف الـ amenities مهمة وسارة محتاجة المدارس قريبة. عندنا الاتنين." },
    curious:   { tactic: "Anchor to the children's future — it unites both spouses.", phrase: "لما البنت دي تصحى في البيت الجديد هتلاقي مدرسة بـ 5 دقايق وحديقة قدام الباب." },
    objecting: { tactic: "When they disagree with each other, bridge — never take sides.", phrase: "أنا شايف إن الإثنين محقين — ولا أنتم عايزين تعيشوا بدون الاتنين؟ المشروع ده فيه الاتنين." },
    cooling:   { tactic: "Use the neighborhood community as a family anchor.", phrase: "أكتر ناس اشتروا في الكومباوند ده عائلات زيكم — هيتعرفوا على ناس بنفس المرحلة." },
    warming:   { tactic: "Soft close — invite them for a visit with the kids, no commitment.", phrase: "تعالوا تشوفوه مع الأولاد — مش لازم تقرروا. بس لما تشوفوا عينيهم هيقولولكم." },
    neutral:   { tactic: "Speak to the family unit — pitch the life, not the features.", phrase: "الشقة دي مش بس 3 أوضة — دي حياة جديدة لعيلتكم كاملة." },
  },
  "price-hammerer": {
    opening:   { tactic: "Expect 'ده غالي أوي' as the first line. Don't flinch.", phrase: "أنا عارف إن السعر أول سؤال — خليني أقولك ليه الناس بتدفع وبتكون عارفة قيمته." },
    curious:   { tactic: "Use social proof — specific recent buyers, not vague stats.", phrase: "في الشهر اللي فات اتباعوا 4 وحدات بنفس المواصفات — كلهم سألوا نفس السؤال اللي بتسأله." },
    objecting: { tactic: "Hold the price. Counter with scarcity + comparable market data.", phrase: "لو قدرت تجيبلي بيت زي ده بسعر أقل — جيبه وأنا أشتريه. السعر ده هو السوق." },
    cooling:   { tactic: "Don't chase. Plant scarcity and let silence work.", phrase: "تمام — أنا مش هضغط عليك. بس متعجبش لو الوحدة أتباعت قبل ما ترد." },
    warming:   { tactic: "Confirm price and get a micro-commitment: WhatsApp or visit.", phrase: "يلا — أبعتلك الـ offer sheet على الواتساب دلوقتي وبكرة نحدد موعد المشروع." },
    neutral:   { tactic: "Never defend price — reframe as value per EGP paid.", phrase: "مش بتدفع للمساحة — بتدفع للموقع وللموعد التسليم اللي هيضاعف السعر." },
  },
  "silent-prospect": {
    opening:   { tactic: "One open question, then wait. NEVER fill the silence.", phrase: "نور — إيه اللي كان بيدور في بالك لما عبيتي الفورم؟" },
    curious:   { tactic: "Match her pace — short sentences. Never overwhelm.", phrase: "حلو — إيه أهم حاجة في الشقة بالنسبالك؟" },
    objecting: { tactic: "Silence is NOT a no. Ask what would make it easier.", phrase: "مش محتاج منك إجابة دلوقتي — إيه اللي ممكن يخلي القرار ده أسهل؟" },
    cooling:   { tactic: "Direct binary re-engagement — give her an easy out.", phrase: "قوليني بصراحة — في اهتمام ولو بسيط، ولا خير بنكمل وقت تاني؟" },
    warming:   { tactic: "She's warming — confirm slowly, zero pressure.", phrase: "ممتاز — ياريت آخد رقمك على الواتساب وأبعتلك صور المشروع تفكري في راحتك." },
    neutral:   { tactic: "Speak less than she does. Let the conversation breathe.", phrase: "على مهلك — في أي وقت عايزة تكملي الكلام أنا موجود." },
  },
  "time-waster": {
    opening:   { tactic: "Let him chat briefly — then introduce urgency gently.", phrase: "حسن بيه — بسمعك بتقول دايماً بكرة. إيه اللي ناقص يخليك تقول أيوه النهارده؟" },
    curious:   { tactic: "Use the Amira driver: daughter's engagement = need for home.", phrase: "ده بالظبط اللي بيقولهولي الناس — لو عندك خطوبة أو جواز قرّب، ده الوقت الصح." },
    objecting: { tactic: "Don't debate — redirect to the compounding cost of waiting.", phrase: "كل سنة تعدي السعر بيزيد 15–20%. 'بكرة' بتكلف فلوس حقيقية يا حسن." },
    cooling:   { tactic: "Name-drop 'أميرة' — his daughter is the hidden urgency driver.", phrase: "أنا فاكر قلتلي قبل إن أميرة مخطوبة — إمتى الفرح؟ ده الوقت المناسب نفكر في الشقة." },
    warming:   { tactic: "Convert warmth into a specific appointment this week.", phrase: "يلا تعالى الأسبوع ده — أنا بعرض عليك موعد يناسبك، مش لازم أكتر من ساعة." },
    neutral:   { tactic: "Redirect every 2 turns to a concrete decision point.", phrase: "حسن بيه — كل كلامك صح. بس سؤال واحد: إيه اللي لازم يتغير عشان تقول أيوه النهارده؟" },
  },
  "cold-lead": {
    opening:   { tactic: "Don't pitch. Remind her why she filled the form — no pressure.", phrase: "أسماء — مش مشكلة لو مش فاكرة الفورم. بس سؤال واحد: الإيجار اللي بتدفعيه — بيريحك؟" },
    curious:   { tactic: "Educate lightly — one market insight, not a sales pitch.", phrase: "معظم الناس في سنك بيكتشفوا إن التمليك أرخص على المدى البعيد من الإيجار — أوريلك بالأرقام؟" },
    objecting: { tactic: "Absolutely zero pressure — offer only information.", phrase: "أنا مش بطلبك تشتري — بس اسمحيلي أبعتلك ورقة صغيرة توضح الفرق. تقفلي التليفون بعدين لو مش مهتمة." },
    cooling:   { tactic: "Don't fight it. Leave a soft door open for later.", phrase: "لا مشكلة خالص — هبعتلك واتساب فيه معلومات بسيطة. في يوم متفرغة تشوفي." },
    warming:   { tactic: "She's curious — move gently to a low-commitment visit.", phrase: "يلا لو وقتك يسمح — أبعتلك لوكيشن المشروع وتعدي في يوم مناسب. مفيش إلزام." },
    neutral:   { tactic: "Plant a seed — ask about her current monthly rent.", phrase: "قوليلي — دلوقتي بتدفعي إيجار؟ عشان أقدر أقولك لو التمليك أفضل ليكي." },
  },
  "urgent-buyer": {
    opening:   { tactic: "Match his urgency — give a direct answer within 20 seconds.", phrase: "طارق — معاك وحدة جاهزة في القاهرة الجديدة، تسليم فوري، وهقولك السعر دلوقتي." },
    curious:   { tactic: "Answer direct questions directly. No detours.", phrase: "نعم — الوحدة متاحة، سند مُسجَّل، تسليم خلال 30 يوم. إيه السؤال الجاي؟" },
    objecting: { tactic: "Address the objection in one sentence then move forward.", phrase: "السعر ده هو سوق الوحدات السريعة التسليم — وميزته إنك مش هتلاقي تاني بنفس الشروط." },
    cooling:   { tactic: "Restate his 30-day deadline as the reason to act now.", phrase: "أنا فاهم وقتك ضيق — ده بالظبط سبب إني اتصلت بيك. مش وقت بحث طويل، وقت حركة." },
    warming:   { tactic: "He's ready — propose the site visit for TODAY or TOMORROW.", phrase: "ممتاز — قولي النهارده ولا بكرة وأنا هرتب الجولة. الوقت يناسبك إمتى؟" },
    neutral:   { tactic: "Be brief and confident. Urgency mirrors urgency.", phrase: "طارق — خلينا بالموضوع مباشرة. إيه اللي بتحتاجه في الوحدة؟" },
  },
  "sayed-father": {
    opening:   { tactic: "Address him as 'Hader Sayed' — formal respect opens everything.", phrase: "حضرة سيد بيه — أنا سامعك معاه. عايز أساعدك توصل لأفضل حاجة لحسن إن شاء الله." },
    curious:   { tactic: "Mention Hassan by name — he responds to family references.", phrase: "الوحدة دي يا حضرة سيد كـأنها اتعملت لبيت حسن — التسليم على المقاس." },
    objecting: { tactic: "Offer to show him past delivery certificates — papers beat words.", phrase: "حضرتك صح — الكلام مش كفاية. هبعتلك بالواتساب صور التسليم اللي اتعمل السنة دي." },
    cooling:   { tactic: "Never push. Say 'take your time, this is important'. Patience earns respect.", phrase: "مفيش أي عجلة يا حضرة سيد — ده قرار مهم وحضرتك اللي بتعرف الأصلح لأولادك." },
    warming:   { tactic: "Invite him AND Hassan for a joint visit — two-generation approach.", phrase: "يا ريت حضرتك تيجي مع حسن تشوفها مع بعض — علشان رأيه مهم زي رأي حضرتك." },
    neutral:   { tactic: "Speak slowly and formally. Use 'يا حضرتك' often.", phrase: "يا حضرة سيد — إيه اللي أهمه في الوحدة بالنسبالك أكتر حاجة؟" },
  },
  "gulf-returnee": {
    opening:   { tactic: "Lead immediately with a premium compound name — don't warm up.", phrase: "مجدي بيه — عندنا وحدة في Emaar Mivida، على مستوى أحسن ما شفته في القاهرة الجديدة." },
    curious:   { tactic: "Give capital appreciation % since 2021 — investor language.", phrase: "نفس الكمبوند ارتفع 75% من 2021 لحد دلوقتي. ده أفضل من معظم ما كنت تعمله بالسعودية." },
    objecting: { tactic: "Never over-justify. Calmly name another comparable project.", phrase: "صح — في خيارات تانية. بس هل شفت Sodic East؟ دي تقريباً نفس المستوى اللي بتفكر فيه." },
    cooling:   { tactic: "Offer a private exclusive viewing — VIP treatment wins him back.", phrase: "لو حضرتك تديني ساعة — بنزور الوحدة لوحدنا، مفيش عملاء تانيين. هيبة الزيارة مختلفة." },
    warming:   { tactic: "Invite him to a quiet private tour — match his VIP expectations.", phrase: "ممتاز — يلا نحدد جولة خاصة يا مجدي بيه. نهار الجمعة بعد الظهر؟" },
    neutral:   { tactic: "Speak with quiet confidence — he reads desperation instantly.", phrase: "يا مجدي بيه — إيه المواصفات اللي حضرتك شايفها في الكمبوند الأنسب؟" },
  },
  "govt-employee": {
    opening:   { tactic: "Open with empathy about savings — acknowledge the effort.", phrase: "وليد بيه — إيه اللي حضرتك عايزه بالظبط؟ عشان أقدر أفيدك بالأنسب في ميزانيتك." },
    curious:   { tactic: "Break down monthly installment in plain EGP — avoid % and jargon.", phrase: "لو الأمر عليّ — وحدة بـ1.3 مليون بمقدم 400 ألف = قسط شهري حوالي 1,100 جنيه على 8 سنين." },
    objecting: { tactic: "Validate the fear. Then simplify. One step at a time.", phrase: "خوفك طبيعي جداً يا وليد بيه — بس خليني أورّيك خطوة خطوة إيه اللي هيحصل بالظبط." },
    cooling:   { tactic: "Remind him of inflation eroding savings — turn waiting into risk.", phrase: "كل سنة تعدي قيمة الـ400 ألف بتنقص بالتضخم. الشراء دلوقتي بيحمي فلوسك مش يخاطر بيها." },
    warming:   { tactic: "Offer to come with him to the site — reduce friction maximally.", phrase: "ممتاز يا وليد بيه — أنا قادر أيجي معاك وأشرح كل حاجة في الموقع. السبت مناسب؟" },
    neutral:   { tactic: "Patience is your greatest asset with this profile. Never rush.", phrase: "خد وقتك خالص يا وليد بيه — السؤال الجاي: تقريباً إيه أكبر قسط شهري مريح ليك؟" },
  },
  "diaspora-caller": {
    opening:   { tactic: "Immediately confirm you can handle remote buyers — remove the #1 blocker.", phrase: "شريف — أنا اشتغلت مع عملاء في ألمانيا وكندا. كل حاجة بتتعمل أونلاين، مفيش مشكلة." },
    curious:   { tactic: "Explain Power of Attorney clearly — it's the deal enabler.", phrase: "التوكيل الرسمي بيشيل كل عقبة. محامي معتمد بيوقع عنك هنا، وحضرتك بتوقع من ألمانيا أونلاين." },
    objecting: { tactic: "Address EGP devaluation fear with a real appreciation argument.", phrase: "بالظبط — ده سبب إن أفضل توقيت هو دلوقتي. العقار المصري بيحمي من انخفاض العملة تاريخياً." },
    cooling:   { tactic: "Offer a Zoom virtual tour at his convenient time zone.", phrase: "مش لازم تيجي — عندي فيديو كامل للوحدة. لو فيه وقت على Zoom، نعمل جولة افتراضية دلوقتي." },
    warming:   { tactic: "Name a specific next step: Zoom tour → WhatsApp contract → transfer.", phrase: "يلا — نحدد Zoom tour الأسبوع الجاي؟ بعدها بعتلك العقد على الإيميل وتراجعه براحتك." },
    neutral:   { tactic: "Match his efficiency — short, direct answers. Never over-explain.", phrase: "شريف — سؤال مباشر: القاهرة الجديدة ولا الساحل الشمالي؟ كل منهم ليه logic تاني." },
  },
  "maadi-elite": {
    opening:   { tactic: "Start with a project name she'll recognise. Never start with price.", phrase: "هند هانم — أنا اتصلت بحضرتك عشان في وحدة في Villette مش معلنة للعموم لسه." },
    curious:   { tactic: "Match her code-switching naturally — use English when she does.", phrase: "The penthouse في Mivida literally just came back available — the previous buyer withdrew. Would you like a private preview before it's relisted?" },
    objecting: { tactic: "Never justify or defend. Calmly redirect to a project she respects.", phrase: "Totally understand. Il Primo has a unit with the same finishes — different building, same standards. Should I arrange a quiet look?" },
    cooling:   { tactic: "Let silence work. One final mention of exclusivity, then stop.", phrase: "مفيش ضغط خالص يا هند هانم — بس الوحدة دي مش هتتعلن. I just wanted to make sure you had first refusal." },
    warming:   { tactic: "Propose a private viewing — just the two of you. No group tours.", phrase: "Perfect — أقترح يوم الخميس في الصبح؟ هنكون لوحدنا، مفيش وكلاء تانيين." },
    neutral:   { tactic: "Ask about her previous home — she loves discussing taste and standards.", phrase: "هند هانم — اللي كنتم فيه في Maadi Degla — إيه اللي كانت بتحبيه فيه أكتر؟" },
  },
  "north-coast-seeker": {
    opening:   { tactic: "Be casual and punchy — match his voice-note energy.", phrase: "يوسف — شاليه اتنين غرف في Marassi، على البحر مباشرة، إدارة تأجير مدمجة. إيه رأيك؟" },
    curious:   { tactic: "Immediately address property management — it's his #1 blockers.", phrase: "والإدارة مش مشكلة — الكمبوند ده عنده rental service داخلية بتديرك التأجير وتبعتلك الفلوس كل شهر." },
    objecting: { tactic: "Give seasonal rental math quickly — let the numbers do the talking.", phrase: "4 أسابيع في الصيف × 12,000 جنيه/أسبوع = 48,000 جنيه. ده بيغطي الصيانة السنوية وزيادة." },
    cooling:   { tactic: "Offer drone footage on WhatsApp immediately — digital-first buyer.", phrase: "حلو — ابعتلك فيديو بالدرون للكمبوند على الواتساب دلوقتي. تشوف وترجعلي." },
    warming:   { tactic: "Close on a weekend visit — frame it as a fun trip not a sales visit.", phrase: "اعتبرها يوم فرفشة مش زيارة عقار — إيه رأيك نيجي الجمعة؟ بتكون الساحل ولسه مشيتش." },
    neutral:   { tactic: "Short messages only. He's a voice-note buyer — 1-2 sentence replies.", phrase: "سؤال واحد — Marassi ولا Hacienda Bay — إيه اللي بتميل له أكتر؟" },
  },
};

const PSYCH_KEYS = {
  "skeptical-engineer": "Fear of deception — he needs 3+ independent data points before trusting.",
  "impatient-investor": "Ego validation — speak his language: ROI, IRR, exit strategy only.",
  "indecisive-couple":  "Family anchor — children's future unites both spouses instantly.",
  "price-hammerer":     "Scarcity + social proof — never cave on price before they push hard.",
  "silent-prospect":    "Curiosity + zero pressure — silence is NOT rejection.",
  "time-waster":        "Daughter Amira's engagement — the hidden urgency driver.",
  "cold-lead":          "Seed planting — compare her monthly rent vs. ownership cost.",
  "urgent-buyer":       "Competence + speed — match his directness, give direct answers.",
  "sayed-father":       "Family honour — this apartment is Hassan's wedding gift; frame it as legacy.",
  "gulf-returnee":      "Peer respect — treat him as equal, not as a client; lead with prestige.",
  "govt-employee":      "Financial safety — break down monthly EGP numbers simply; he just needs clarity.",
  "diaspora-caller":    "Remote-process confidence — explain exactly how overseas buyers close deals.",
  "maadi-elite":        "Composed authority — any hint of desperation ends the call instantly.",
  "north-coast-seeker": "Property management answer — solve 'who runs it' and the deal unlocks.",
};

function getPsychKey(scenario) {
  return PSYCH_KEYS[scenario.id] || scenario.psychTags?.join(" · ") || "—";
}

function getCoachData(scenario, state) {
  const tips = SCENARIO_COACH[scenario.id];
  if (tips && tips[state]) return tips[state];
  if (tips && tips.neutral) return tips.neutral;
  const fallback = {
    opening:   { tactic: "Start with one open question about their situation.", phrase: "قوليلي — إيه اللي بيخليك تفكر في العقار دلوقتي تحديداً؟" },
    curious:   { tactic: "Give one solid fact then ask what matters most to them.", phrase: "ممتاز — إيه أهم شيء في الوحدة بالنسبالك غير السعر؟" },
    objecting: { tactic: "Don't defend. Acknowledge + pivot to value.", phrase: "وجهة نظرك مهمة — ده بالظبط اللي عايز أفهمه عشان أقدم أنسب حاجة ليك." },
    cooling:   { tactic: "Pattern interrupt — ask one surprising question.", phrase: "أنا مش هضغطك — بس قبل ما نخلّص، قولي: إيه اللي لو اتغير كان خلّاك تفكر؟" },
    warming:   { tactic: "Propose a small concrete next step.", phrase: "يلا — نحدد موعد سريع تشوف المشروع، مفيش إلزام خالص." },
    neutral:   { tactic: "Listen more than you speak.", phrase: "عايزك تكمل — قولي أكتر عن اللي بتدور عليه." },
  };
  return fallback[state] || fallback.neutral;
}

function updateCoach(aiText) {
  if (!currentScenario || !coachOpen) return;
  const state  = analyzeSignal(aiText);
  const sig    = COACH_SIGNALS[state] || COACH_SIGNALS.neutral;
  const advice = getCoachData(currentScenario, state);

  const pill    = $("coach-signal-pill");
  const iconEl  = $("coach-signal-icon");
  const textEl  = $("coach-signal-text");
  const tactic  = $("coach-tactic-body");
  const phrase  = $("coach-phrase-body");
  if (!pill) return;

  pill.className = `coach-signal-pill${sig.cls ? " " + sig.cls : ""}`;
  if (iconEl) iconEl.textContent = sig.icon;
  if (textEl) textEl.textContent = sig.label;
  if (tactic) tactic.textContent = advice.tactic;
  if (phrase) phrase.textContent = advice.phrase;
}

function initCoach() {
  if (!currentScenario) return;
  const advice   = getCoachData(currentScenario, "opening");
  const psychKey = getPsychKey(currentScenario);

  const pill   = $("coach-signal-pill");
  const iconEl = $("coach-signal-icon");
  const textEl = $("coach-signal-text");
  const tactic = $("coach-tactic-body");
  const phrase = $("coach-phrase-body");
  const psych  = $("coach-psych-body");

  if (pill) {
    pill.className = "coach-signal-pill";
    if (iconEl) iconEl.textContent = "🎯";
    if (textEl) textEl.textContent = "Opening phase";
  }
  if (tactic) tactic.textContent = advice.tactic;
  if (phrase) phrase.textContent = advice.phrase;
  if (psych)  psych.textContent  = psychKey;
}

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
  const pbs = loadPBs();
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
        ? { easy: "سهل", medium: "متوسط", hard: "صعب" }[s.difficulty] || s.difficulty
        : s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1);
    const aiBadge = s.isGenerated
      ? `<span class="scenario-ai-badge" aria-label="AI generated">✨ AI</span>`
      : "";

    // Per-scenario accent
    const hex = s.accentHex || "#0096ff";
    const rgb = hexToRgb(hex);
    const styleAttr = rgb
      ? `style="--sa:${hex};--sa-dim:rgba(${rgb},0.1);--sa-glow:rgba(${rgb},0.28)"`
      : "";

    // Psychology chips
    const chipsHtml = (s.psychTags || []).length
      ? `<div class="scenario-psych-chips">${(s.psychTags).map((t) => `<span class="psych-chip">${escHtml(t)}</span>`).join("")}</div>`
      : "";

    // Personal best row
    const pb = pbs[s.id];
    let pbRowHtml = "";
    if (pb) {
      const stars = getStars(pb.best);
      const isGold = pb.best >= 70;
      const pbLabel = lang === "ar" ? `أفضل: ${pb.best}/100` : `PB: ${pb.best}/100`;
      pbRowHtml = `<div class="scenario-pb-row">
        <span class="scenario-stars" aria-label="${escHtml(stars)}">${escHtml(stars)}</span>
        <span class="scenario-pb-chip${isGold ? " pb-gold" : ""}">${escHtml(pbLabel)}</span>
      </div>`;
    }

    const dialectLabel = DIALECT_LABELS[s.id] || "";
    const dialectHtml = dialectLabel ? `<span class="scenario-dialect">${escHtml(dialectLabel)}</span>` : "";

    return `<div class="scenario-card${s.isGenerated ? " scenario-ai-card" : ""}" ${styleAttr} data-id="${escHtml(s.id)}" role="button" tabindex="0" aria-label="${name}">
      ${aiBadge}
      <span class="scenario-emoji" aria-hidden="true">${escHtml(s.emoji)}</span>
      <span class="scenario-difficulty difficulty-${diff}">${escHtml(diffLabel)}</span>
      <h2 class="scenario-name">${name}</h2>
      <p class="scenario-client">${client}</p>
      ${dialectHtml}
      <p class="scenario-desc">${desc}</p>
      ${chipsHtml}
      ${pbRowHtml}
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

  // Sync speed mode checkbox to current state
  const cb = $("speed-mode-checkbox");
  if (cb) {
    cb.checked = speedMode;
    // Re-apply lang to the new briefing elements
    applyLang();
  }

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
      showIncomingCall(); // ← goes to incoming screen, not directly to call
    }
  }, 1000);
}

// ══════════════════════════════════════════════════════════════════════
//  CALL SCREEN
// ══════════════════════════════════════════════════════════════════════
function startCall() {
  clearInterval(briefingTimer);
  clearTimeout(ringTimer);
  stopRingTone();
  if (!currentScenario) return;

  callMessages = [];
  callTranscript = [];
  callSeconds = 0;
  closingTemp = 0;
  coachOpen = false;
  objectionOpen = false;
  isWaitingForAI = false;
  speedTimeouts = 0;

  const s = currentScenario;

  // Apply per-scenario theme to call screen
  setScenarioTheme(s);

  // Avatar + persona header
  const avtEl = $("call-avatar");
  if (avtEl) avtEl.textContent = s.emoji;
  const nameEl = $("call-persona-name");
  if (nameEl) nameEl.textContent = s.name[lang] || s.name.en;
  const subEl = $("call-persona-sub");
  if (subEl) subEl.textContent = s.client[lang] || s.client.en;

  // Deal data sidebar
  const priceEl = $("deal-price");
  const commEl = $("deal-commission");
  if (s.dealPrice) {
    const priceNum = parseFloat(s.dealPrice.replace(/,/g, ""));
    const commRate = s.commissionRate || 0.025;
    const commAmount = isNaN(priceNum) ? "—" : Math.round(priceNum * commRate).toLocaleString() + " EGP";
    if (priceEl) priceEl.textContent = s.dealPrice + " EGP";
    if (commEl)  commEl.textContent  = commAmount;
  } else {
    if (priceEl) priceEl.textContent = "—";
    if (commEl)  commEl.textContent  = "—";
  }

  // Reset closing meter
  updateClosingMeter(0);

  const chatArea = $("chat-area");
  if (chatArea) {
    chatArea.innerHTML = "";
    appendSystem(lang === "ar" ? "📞 المتصل ردّ..." : "📞 They picked up...");
  }

  showScreen("screen-call");

  // Animate signal bars loading
  animateSignalBars();

  // Reset coach panel to opening state
  const coachPanel = $('call-coach');
  if (coachPanel) coachPanel.hidden = true;
  const coachToggle = $('btn-coach-toggle');
  if (coachToggle) coachToggle.classList.remove('active');
  initCoach();

  // Reset objection panel
  const objPanel  = $('call-objections');
  const objToggle = $('btn-objections-toggle');
  if (objPanel)  objPanel.hidden = true;
  if (objToggle) objToggle.classList.remove('active');

  // Populate objections for this scenario
  populateObjections(s);

  clearInterval(callTimerHandle);
  callTimerHandle = setInterval(tickCallTimer, 1000);

  const input = $("chat-input");
  if (input) {
    input.value = "";
    input.placeholder = lang === "ar" ? "اكتب ردّك..." : "Type your response...";
    input.focus();
    autoResize(input);
  }

  // Initialise voice input (shows mic button, no-ops if already done or unsupported)
  initVoice();

  // Client opening line — if scenario has one, client speaks first
  const _openLine = OPENING_LINES[currentScenario.id];
  if (_openLine) {
    const _line = lang === 'ar' ? _openLine.ar : _openLine.en;
    setTimeout(() => {
      if (!currentScenario) return; // call was ended
      appendBubble('client', _line);
      callMessages.push({ role: 'assistant', content: _line });
      callTranscript.push({ speaker: 'Client', text: _line });
      startSpeedTimer(); // now it's agent's turn
    }, 1600);
  } else {
    appendSystem(lang === 'ar' ? 'المكالمة بدأت — أنت تتحدث أولاً.' : 'Call connected — you speak first.');
    startSpeedTimer();
  }

  // Update campaign progress pill in sidebar
  updateCampaignProgress();

  const hintEl = $("call-hint");
  if (hintEl)
    hintEl.textContent =
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
  const outer = document.createElement("div");
  outer.className = "chat-bubble " + cls;

  // Sender name + timestamp header for agent/client bubbles
  if (role !== "system") {
    const meta = document.createElement("div");
    meta.className = "bubble-meta";

    const senderSpan = document.createElement("span");
    senderSpan.className = "bubble-sender";
    if (role === "client" && currentScenario) {
      const raw = (currentScenario.client[lang] || currentScenario.client.en || "");
      senderSpan.textContent = raw.split(/,|،/)[0].split(/&/)[0].trim().split(" ").slice(0, 2).join(" ");
    } else {
      senderSpan.textContent = lang === "ar" ? "أنت" : "You";
    }

    const timeSpan = document.createElement("span");
    timeSpan.className = "bubble-time";
    const m = String(Math.floor(callSeconds / 60)).padStart(2, "0");
    const s2 = String(callSeconds % 60).padStart(2, "0");
    timeSpan.textContent = m + ":" + s2;

    meta.appendChild(senderSpan);
    meta.appendChild(timeSpan);
    outer.appendChild(meta);
  }

  const textEl = document.createElement("div");
  textEl.className = "bubble-text";
  textEl.setAttribute('dir', 'auto'); // auto-detect RTL for Arabic agent text
  textEl.textContent = text; // safe — AI text is rendered as textContent
  outer.appendChild(textEl);
  chatArea.appendChild(outer);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function appendSystem(text) {
  const chatArea = $("chat-area");
  if (!chatArea) return null;
  const div = document.createElement("div");
  div.className = "chat-bubble bubble-system";
  div.textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  return div;
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
  const text = (input ? input.value : "").trim();
  if (!text) return;

  stopSpeedTimer(); // stop countdown the moment agent sends

  if (input) { input.value = ""; autoResize(input); }

  // Record agent message
  appendBubble("agent", text);
  callTranscript.push({ speaker: "Agent", text });
  callMessages.push({ role: "user", content: text });

  isWaitingForAI = true;
  setSendDisabled(true);

  try {
    // Variable think delay — simulates persona reaction time
    const baseDelay = Math.min(currentScenario.replyDelayMs || 1200, 2800);
    const variance  = Math.min(currentScenario.replyVarianceMs || 800, 1200);
    const delay = baseDelay + Math.floor(Math.random() * variance);

    await new Promise((resolve) => setTimeout(resolve, delay));
    if (!isWaitingForAI) return; // call was ended during delay

    showTypingIndicator();

    // Show avatar "talking" animation while AI generates
    const avtEl = $("call-avatar");
    const wvEl = $("avatar-waveform");
    if (avtEl) avtEl.classList.add("is-talking");
    if (wvEl) wvEl.classList.add("visible");

    const sysPrompt = currentScenario.systemPrompt(
      lang === "ar" ? "Egyptian Arabic" : "English",
    ) + "\n\n" + MARKET_KNOWLEDGE;
    const aiText = await callGemini(sysPrompt, callMessages);

    if (avtEl) avtEl.classList.remove("is-talking");
    if (wvEl) wvEl.classList.remove("visible");
    removeTypingIndicator();
    appendBubble("client", aiText);
    callTranscript.push({ speaker: "Client", text: aiText });
    callMessages.push({ role: "assistant", content: aiText });

    // Update deal temperature heuristic
    estimateClosingTemp(aiText);
    // Update live coach panel
    updateCoach(aiText);
    // Resume speed timer — it's the agent's turn again
    startSpeedTimer();

  } catch (err) {
    const avtEl = $("call-avatar");
    const wvEl2 = $("avatar-waveform");
    if (avtEl) avtEl.classList.remove("is-talking");
    if (wvEl2) wvEl2.classList.remove("visible");
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
  stopSpeedTimer();
  // Stop any active voice recording
  if (voiceListening && voiceRec) {
    voiceRec.abort();
    voiceListening = false;
    removeVoiceHint();
    const micBtn = $("btn-mic");
    if (micBtn) micBtn.classList.remove("listening");
  }

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
    // Apply speed round penalty (-5 per timeout, floor at 0)
    const speedPenalty = speedMode ? Math.min(speedTimeouts * 5, total) : 0;
    const finalTotal = Math.max(0, Math.round(total - speedPenalty));
    if (speedPenalty > 0 && $("debrief-total")) {
      const el = $("debrief-total");
      el.textContent = String(finalTotal);
      el.title = `${Math.round(total)} - ${speedPenalty} speed penalty`;
    }

    saveHistoryEntry({
      scenarioId: currentScenario.id,
      scenarioName: currentScenario.name.en,
      total: finalTotal,
      date: new Date().toLocaleDateString(),
      duration: callSeconds,
    });
    savePB(currentScenario.id, finalTotal);

    // Campaign mode: record score and update debrief action button
    if (campaignMode && campaignTrack) {
      campaignScores.push({
        name:  currentScenario.name.en,
        score: finalTotal,
        stars: getStars(finalTotal),
      });
      const isLast = campaignScores.length >= campaignTrack.scenarioIds.length;
      const btnHomeEl = $("btn-home");
      if (btnHomeEl) {
        if (isLast) {
          appendCampaignResult();
          btnHomeEl.textContent = lang === "ar" ? "← انتهت الحملة" : "Campaign Complete ←";
        } else {
          const nextId = campaignTrack.scenarioIds[campaignScores.length];
          const nextSc = SCENARIOS.find((s) => s.id === nextId);
          const nextName = nextSc ? (nextSc.name[lang] || nextSc.name.en) : "";
          btnHomeEl.textContent =
            lang === "ar" ? `التالي: ${nextName} ←` : `Next: ${nextName} →`;
        }
      }
    }
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
    turnRatings: [],
    wins: [],
    losses: [],
    betterPhrase: "",
    coaching: [
      { emoji: "💡", tip: "Could not generate detailed feedback. Review the transcript manually." },
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

// ── Radar chart drawing ──────────────────────────────────────────────
function drawRadar(canvasId, scores) {
  const canvas = $(canvasId);
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const keys  = Object.keys(SCORE_LABELS);
  const n     = keys.length;
  const cx    = W / 2;
  const cy    = H / 2;
  const R     = Math.min(cx, cy) - 60;
  const step  = (Math.PI * 2) / n;
  const offset = -Math.PI / 2; // start at top

  // Grid rings (5 levels)
  for (let level = 1; level <= 5; level++) {
    const r = (R * level) / 5;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = offset + step * i;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Spokes
  keys.forEach((_, i) => {
    const a = offset + step * i;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Data polygon
  const vals = keys.map((k) => Math.max(0, Math.min(20, scores[k] || 0)) / 20);
  ctx.beginPath();
  vals.forEach((v, i) => {
    const a = offset + step * i;
    const r = R * v;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  grad.addColorStop(0, "rgba(0,150,255,0.35)");
  grad.addColorStop(1, "rgba(0,150,255,0.08)");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,150,255,0.85)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots on vertices
  vals.forEach((v, i) => {
    const a = offset + step * i;
    const r = R * v;
    ctx.beginPath();
    ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 4, 0, Math.PI * 2);
    ctx.fillStyle = "#0096ff";
    ctx.fill();
  });

  // Labels
  ctx.font = "600 10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  keys.forEach((k, i) => {
    const a = offset + step * i;
    const lx = cx + (R + 20) * Math.cos(a);
    const ly = cy + (R + 20) * Math.sin(a);
    const label = SCORE_LABELS[k][lang] || SCORE_LABELS[k].en;
    // Two-word labels: split to 2 lines
    const words = label.split(" ");
    if (words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(" ");
      const line2 = words.slice(mid).join(" ");
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText(line1, lx, ly - 5);
      ctx.fillText(line2, lx, ly + 6);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText(label, lx, ly);
    }
  });
}

function showDebrief(debrief) {
  const scores = debrief.scores || {};
  const total = Object.values(scores).reduce((a, b) => a + (b || 0), 0);

  const scBadge = $("debrief-scenario-badge");
  if (scBadge) scBadge.textContent = currentScenario.name[lang] || currentScenario.name.en;
  const totalEl = $("debrief-total");
  if (totalEl) totalEl.textContent = String(Math.round(total));

  // Commission banner (before top-grid)
  const topGrid = $("debrief-top-grid");
  if (currentScenario.dealPrice) {
    const priceNum = parseFloat(currentScenario.dealPrice.replace(/,/g, ""));
    const commRate = currentScenario.commissionRate || 0.025;
    if (!isNaN(priceNum)) {
      const old = document.querySelector(".debrief-commission-banner");
      if (old) old.remove();
      const commAmount = Math.round(priceNum * commRate).toLocaleString();
      const commPct = Math.round(commRate * 1000) / 10; // e.g. 0.025 → 2.5, not 3
      const banner = document.createElement("div");
      banner.className = "debrief-commission-banner";
      banner.innerHTML =
        `<div style="font-size:1.8rem;flex-shrink:0">💰</div>` +
        `<div>` +
        `<p class="dcb-label">${escHtml(lang === "ar" ? "عمولتك المحتملة" : "Potential Commission")}</p>` +
        `<p class="dcb-amount">${escHtml(commAmount)} EGP</p>` +
        `<p class="dcb-note">${escHtml(lang === "ar" ? `${commPct}٪ عند الإغلاق` : `${commPct}% if deal closes`)}</p>` +
        `</div>`;
      const card = document.querySelector(".debrief-card");
      if (topGrid) {
        topGrid.before(banner);
      } else {
        const titleEl = card ? card.querySelector(".debrief-title") : null;
        if (titleEl) titleEl.after(banner);
      }
    }
  }

  // Score bars (right side of top-grid)
  const scoresEl = $("debrief-scores");
  if (scoresEl) {
    scoresEl.innerHTML = Object.entries(SCORE_LABELS)
      .map(([key, labels]) => {
        const score = Math.max(0, Math.min(20, scores[key] || 0));
        const pct   = (score / 20) * 100;
        const label = escHtml(labels[lang] || labels.en);
        const cls   = pct >= 65 ? "score-high" : pct >= 40 ? "score-medium" : "score-low";
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
    requestAnimationFrame(() => {
      scoresEl.querySelectorAll(".score-bar-fill").forEach((bar) => {
        bar.style.width = bar.dataset.pct + "%";
      });
    });
  }

  // Draw radar (slight delay so canvas is in DOM)
  requestAnimationFrame(() => drawRadar("debrief-radar", scores));

  // Wins / Losses
  const momentsEl = $("debrief-moments");
  if (momentsEl) {
    const wins   = Array.isArray(debrief.wins)   ? debrief.wins.slice(0, 2)   : [];
    const losses = Array.isArray(debrief.losses) ? debrief.losses.slice(0, 2) : [];
    let html = "";
    if (wins.length || losses.length) {
      html += `<p class="debrief-sect-title">${escHtml(lang === "ar" ? "اللحظات البارزة" : "Key Moments")}</p>`;
    }
    wins.forEach((w) => {
      html += `<div class="moment-card win">
        <p class="moment-icon">✅ ${escHtml(lang === "ar" ? "نقطة قوة" : "Strong moment")}</p>
        <p class="moment-quote">"${escHtml(w.quote || "")}"</p>
        <p class="moment-why">${escHtml(w.why || "")}</p>
      </div>`;
    });
    losses.forEach((l) => {
      html += `<div class="moment-card loss">
        <p class="moment-icon">❌ ${escHtml(lang === "ar" ? "نقطة ضعف" : "Weak moment")}</p>
        <p class="moment-quote">"${escHtml(l.quote || "")}"</p>
        <p class="moment-why">${escHtml(l.why || "")}</p>
      </div>`;
    });
    momentsEl.innerHTML = html;
  }

  // Better phrase suggestion
  const betterEl = $("debrief-better-phrase");
  if (betterEl) {
    const phrase = (debrief.betterPhrase || "").trim();
    if (phrase) {
      betterEl.hidden = false;
      betterEl.innerHTML =
        `<p class="better-label">💬 ${escHtml(lang === "ar" ? "كان ممكن تقول" : "Instead, try saying")}</p>` +
        `<p class="better-text">"${escHtml(phrase)}"</p>`;
    } else {
      betterEl.hidden = true;
    }
  }

  // Turn heatmap
  const heatmapWrap = $("debrief-heatmap-wrap");
  const heatmapEl   = $("debrief-heatmap");
  const ratings     = Array.isArray(debrief.turnRatings) ? debrief.turnRatings : [];
  if (heatmapEl && ratings.length > 0) {
    const ratingMap = { strong: "✅", ok: "⚡", weak: "❌" };
    heatmapEl.innerHTML = ratings
      .map((r) => {
        const cls   = ["strong","ok","weak"].includes(r.rating) ? r.rating : "ok";
        const icon  = ratingMap[cls] || "⚡";
        const label = `${escHtml(lang === "ar" ? "دور" : "Turn")} ${escHtml(String(r.turn))}`;
        return `<div class="hm-turn ${escHtml(cls)}" title="${escHtml(r.reason || "")}">
          <span class="hm-dot"></span>
          <span class="hm-label">${label}</span>
          <div class="hm-tooltip">${escHtml(icon)} ${escHtml(r.reason || cls)}</div>
        </div>`;
      })
      .join("");
    if (heatmapWrap) heatmapWrap.hidden = false;
  } else if (heatmapWrap) {
    heatmapWrap.hidden = true;
  }

  // Coaching tips
  const coachingEl = $("debrief-coaching");
  if (coachingEl) {
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
  }

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
//  SPEED ROUND  — per-turn countdown timer
// ══════════════════════════════════════════════════════════════════════
function getSpeedLimit() {
  return SPEED_LIMITS[currentScenario?.difficulty] || 15;
}

function startSpeedTimer() {
  if (!speedMode || isWaitingForAI) return;
  stopSpeedTimer();
  const wrap  = $("speed-bar-wrap");
  const fill  = $("speed-bar-fill");
  const label = $("speed-bar-label");
  if (!wrap || !fill || !label) return;

  speedSecsLeft = getSpeedLimit();
  wrap.hidden = false;
  wrap.classList.remove("urgent");
  fill.style.transition = "none";
  fill.style.width = "100%";

  // Force reflow then animate
  fill.getBoundingClientRect();
  fill.style.transition = `width ${speedSecsLeft}s linear`;
  fill.style.width = "0%";

  speedHandle = setInterval(() => {
    speedSecsLeft--;
    if (label) label.textContent = String(speedSecsLeft);
    if (speedSecsLeft <= 3) wrap.classList.add("urgent");
    if (speedSecsLeft <= 0) {
      stopSpeedTimer();
      handleSpeedTimeout();
    }
  }, 1000);

  if (label) label.textContent = String(speedSecsLeft);
}

function stopSpeedTimer() {
  clearInterval(speedHandle);
  speedHandle = null;
  const wrap = $("speed-bar-wrap");
  if (wrap) {
    wrap.hidden = true;
    wrap.classList.remove("urgent");
  }
  const fill = $("speed-bar-fill");
  if (fill) { fill.style.transition = "none"; fill.style.width = "100%"; }
}

function handleSpeedTimeout() {
  speedTimeouts++;
  // If there's text typed, auto-send it; otherwise append a timeout system msg
  const input = $("chat-input");
  if (input && input.value.trim()) {
    sendMessage();
  } else {
    const msg = lang === "ar"
      ? `⏱ انتهى الوقت! (-5 نقاط)`
      : `⏱ Time's up! (-5 pts)`;
    const el = appendSystem(msg);
    if (el) el.classList.add("timeout-msg");
    // Re-start so trainer can still reply
    startSpeedTimer();
  }
}

// ══════════════════════════════════════════════════════════════════════
//  OBJECTION LIBRARY PANEL
// ══════════════════════════════════════════════════════════════════════
function populateObjections(scenario) {
  const body = $("objections-body");
  if (!body) return;
  const items = OBJECTION_LIBRARY[scenario.id] || [];
  if (!items.length) {
    body.innerHTML = `<p class="obj-empty">${escHtml(lang === "ar" ? "لا توجد بيانات بعد." : "No objections data yet for this scenario.")}</p>`;
    return;
  }
  body.innerHTML = items
    .map(
      (item) =>
        `<div class="objection-card">` +
        `<div class="objection-q">${escHtml(item.q)}</div>` +
        `<div class="objection-a">${escHtml(item.a)}</div>` +
        `</div>`,
    )
    .join("");
  body.querySelectorAll(".objection-card").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("open"));
  });
}

function toggleObjections() {
  objectionOpen = !objectionOpen;
  const panel  = $("call-objections");
  const toggle = $("btn-objections-toggle");
  if (panel)  panel.hidden = !objectionOpen;
  if (toggle) toggle.classList.toggle("active", objectionOpen);
}

// ══════════════════════════════════════════════════════════════════════
//  CAMPAIGN MODE
// ══════════════════════════════════════════════════════════════════════
function startCampaign(trackId) {
  const track = CAMPAIGN_TRACKS.find((t) => t.id === trackId);
  if (!track) return;
  campaignMode   = true;
  campaignTrack  = track;
  campaignScores = [];
  openBriefing(track.scenarioIds[0]);
}

function advanceCampaign() {
  if (!campaignMode || !campaignTrack) return;
  const nextId = campaignTrack.scenarioIds[campaignScores.length];
  if (nextId) {
    openBriefing(nextId);
  } else {
    // Shouldn't happen normally, but guard anyway
    campaignMode  = false;
    campaignScores = [];
    campaignTrack = null;
    renderScenarios();
    showScreen("screen-home");
  }
}

function appendCampaignResult() {
  if (!campaignTrack || !campaignScores.length) return;
  const avg = Math.round(
    campaignScores.reduce((a, s) => a + s.score, 0) / campaignScores.length,
  );
  const medal = avg >= 80 ? "🥇" : avg >= 60 ? "🥈" : avg >= 40 ? "🥉" : "🎖️";
  const title =
    avg >= 80
      ? lang === "ar" ? "أداء ذهبي" : "Gold Performance"
      : avg >= 60
        ? lang === "ar" ? "فضي ممتاز" : "Silver Run"
        : avg >= 40
          ? lang === "ar" ? "برونزي جيد" : "Bronze Effort"
          : lang === "ar" ? "واصل التدريب" : "Keep Practicing";

  const div = document.createElement("div");
  div.className = "campaign-result";
  div.innerHTML =
    `<div class="cr-medal">${medal}</div>` +
    `<h3 class="cr-title">${escHtml(title)}</h3>` +
    `<p class="cr-sub">${escHtml(campaignTrack.name[lang] || campaignTrack.name.en)}</p>` +
    `<div class="cr-scores">` +
    campaignScores
      .map(
        (s) =>
          `<div class="cr-score-row">` +
          `<span>${escHtml(s.name)}</span>` +
          `<span>${escHtml(s.stars)} ${escHtml(String(s.score))}/100</span>` +
          `</div>`,
      )
      .join("") +
    `<div class="cr-score-row cr-total">` +
    `<span>${escHtml(lang === "ar" ? "المتوسط" : "Average")}</span>` +
    `<span>${escHtml(String(avg))}/100</span>` +
    `</div>` +
    `</div>`;

  const btnRow = document.querySelector(".debrief-actions");
  if (btnRow) btnRow.before(div);
}

function updateCampaignProgress() {
  const pill = $("campaign-progress-pill");
  const dotsEl = $("cpp-dots");
  if (!pill || !dotsEl) return;
  if (!campaignMode || !campaignTrack) {
    pill.hidden = true;
    return;
  }
  pill.hidden = false;
  const total = campaignTrack.scenarioIds.length;
  const done  = campaignScores.length;
  dotsEl.innerHTML = Array.from({ length: total }, (_, i) => {
    const cls = i < done ? "done" : i === done ? "active" : "pending";
    return `<span class="cpp-dot ${cls}" title="${escHtml(lang === "ar" ? `مكالمة ${i + 1}` : `Call ${i + 1}`)}"></span>`;
  }).join("");
}

// ══════════════════════════════════════════════════════════════════════
//  VOICE INPUT  (Web Speech API — bilingual, auto-send on silence)
// ══════════════════════════════════════════════════════════════════════
let voiceRec = null;
let voiceListening = false;
let voiceAutoSendTimer = null;
let voiceInited = false;

function initVoice() {
  if (voiceInited) {
    // Re-show the mic button if it was hidden
    const micBtn = $("btn-mic");
    if (micBtn) micBtn.hidden = false;
    return;
  }
  voiceInited = true;
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = $("btn-mic");
  if (!micBtn) return;
  if (!SpeechRec) {
    micBtn.classList.add("unsupported");
    micBtn.hidden = false;
    micBtn.title = "Voice input not supported in this browser";
    return;
  }

  voiceRec = new SpeechRec();
  voiceRec.continuous = false;
  voiceRec.interimResults = true;
  voiceRec.maxAlternatives = 1;

  voiceRec.onresult = (e) => {
    clearTimeout(voiceAutoSendTimer);
    const input = $("chat-input");
    if (!input) return;
    const transcript = Array.from(e.results)
      .map((r) => r[0].transcript)
      .join(" ")
      .trim();
    input.value = transcript;
    autoResize(input);
    // If final result, schedule auto-send
    if (e.results[e.results.length - 1].isFinal) {
      voiceAutoSendTimer = setTimeout(() => {
        if (!voiceListening && input.value.trim()) {
          removeVoiceHint();
          $("btn-send")?.click();
        }
      }, 700);
    }
  };

  voiceRec.onend = () => {
    voiceListening = false;
    if (micBtn) micBtn.classList.remove("listening");
    const input = $("chat-input");
    // If no auto-send was scheduled (e.g. no-speech), restore placeholder
    if (input && !input.value.trim()) {
      removeVoiceHint();
      input.placeholder = lang === "ar" ? "اكتب ردّك..." : "Type your response...";
    }
  };

  voiceRec.onerror = (e) => {
    voiceListening = false;
    if (micBtn) micBtn.classList.remove("listening");
    removeVoiceHint();
    if (e.error !== "aborted" && e.error !== "no-speech") {
      console.warn("Voice recognition error:", e.error);
    }
  };

  micBtn.hidden = false;
  micBtn.addEventListener("click", toggleVoice);
}

function showVoiceHint() {
  const footer = document.querySelector(".chat-footer");
  if (!footer || footer.querySelector(".voice-hint")) return;
  const hint = document.createElement("p");
  hint.className = "voice-hint";
  hint.textContent = lang === "ar" ? "🎙️ يستمع... تكلّم الآن" : "🎙️ Listening... speak now";
  footer.insertBefore(hint, footer.querySelector(".call-hint"));
}

function removeVoiceHint() {
  document.querySelector(".voice-hint")?.remove();
}

function toggleVoice() {
  if (!voiceRec) return;
  const micBtn = $("btn-mic");
  const input  = $("chat-input");
  if (!micBtn) return;

  if (voiceListening) {
    voiceRec.abort();
    voiceListening = false;
    micBtn.classList.remove("listening");
    removeVoiceHint();
    if (input) input.placeholder = lang === "ar" ? "اكتب ردّك..." : "Type your response...";
  } else {
    clearTimeout(voiceAutoSendTimer);
    voiceRec.lang = lang === "ar" ? "ar-EG" : "en-US";
    try {
      if (input) {
        input.value = "";
        input.placeholder = lang === "ar" ? "🎙️ يستمع..." : "🎙️ Listening...";
        autoResize(input);
      }
      voiceRec.start();
      voiceListening = true;
      micBtn.classList.add("listening");
      showVoiceHint();
    } catch (err) {
      console.warn("Voice start error:", err.message);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
//  EVENT WIRING
// ══════════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  hydrateGeneratedScenarios(); // restore AI-generated scenarios from localStorage
  applyLang();
  renderScenarios();

  /* Language toggle */
  const btnLang = $("btn-lang");
  if (btnLang) btnLang.addEventListener("click", () => {
    lang = lang === "en" ? "ar" : "en";
    localStorage.setItem("pitchlab_lang", lang);
    applyLang();
    renderScenarios();
    if ($("screen-call").classList.contains("active")) {
      const h = $("call-hint");
      if (h) h.textContent =
        lang === "ar"
          ? "أجب كما لو كانت هذه مكالمة حقيقية. كن محترفاً."
          : "Respond as if this is a real phone call. Be professional.";
    }
  });

  /* History panel */
  const btnHistory = $("btn-history");
  if (btnHistory) btnHistory.addEventListener("click", () => {
    renderHistory();
    const panel = $("history-panel");
    if (panel) panel.hidden = false;
  });
  const btnHistoryClose = $("btn-history-close");
  if (btnHistoryClose) btnHistoryClose.addEventListener("click", () => {
    const panel = $("history-panel");
    if (panel) panel.hidden = true;
  });
  const btnClearHistory = $("btn-clear-history");
  if (btnClearHistory) btnClearHistory.addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });

  /* Briefing back */
  const briefingBack = $("briefing-back");
  if (briefingBack) briefingBack.addEventListener("click", () => {
    clearInterval(briefingTimer);
    showScreen("screen-home");
  });

  /* Start call now (override countdown) → goes to incoming screen */
  const btnStartCall = $("btn-start-call");
  if (btnStartCall) btnStartCall.addEventListener("click", () => {
    clearInterval(briefingTimer);
    showIncomingCall();
  });

  /* Incoming call — Answer */
  const btnAnswer = $("btn-answer");
  if (btnAnswer) btnAnswer.addEventListener("click", () => {
    clearTimeout(ringTimer);
    stopRingTone();
    startCall();
  });

  /* Incoming call — Decline */
  const btnDecline = $("btn-decline");
  if (btnDecline) btnDecline.addEventListener("click", () => {
    clearTimeout(ringTimer);
    stopRingTone();
    showScreen("screen-home");
  });

  /* Send message */
  const btnSend = $("btn-send");
  if (btnSend) btnSend.addEventListener("click", sendMessage);
  const chatInput = $("chat-input");
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    chatInput.addEventListener("input", () => autoResize(chatInput));
  }

  /* End call */
  const btnEndCall = $("btn-end-call");
  if (btnEndCall) btnEndCall.addEventListener("click", endCall);

  /* Live Coach toggle */
  const btnCoachToggle = $("btn-coach-toggle");
  if (btnCoachToggle) btnCoachToggle.addEventListener("click", () => {
    const panel = $("call-coach");
    if (!panel) return;
    coachOpen = !coachOpen;
    panel.hidden = !coachOpen;
    btnCoachToggle.classList.toggle("active", coachOpen);
    if (coachOpen) initCoach();
  });
  const coachClose = $("coach-close");
  if (coachClose) coachClose.addEventListener("click", () => {
    const panel  = $("call-coach");
    const toggle = $("btn-coach-toggle");
    if (panel)  panel.hidden = true;
    if (toggle) toggle.classList.remove("active");
    coachOpen = false;
  });

  /* Speed Round toggle */
  const speedCb = $("speed-mode-checkbox");
  if (speedCb) {
    // Restore from localStorage
    speedMode = localStorage.getItem("pitchlab_speed") === "1";
    speedCb.checked = speedMode;
    speedCb.addEventListener("change", () => {
      speedMode = speedCb.checked;
      localStorage.setItem("pitchlab_speed", speedMode ? "1" : "0");
    });
  }

  /* Debrief buttons */
  const btnRetry = $("btn-retry");
  if (btnRetry) btnRetry.addEventListener("click", () => {
    if (currentScenario) openBriefing(currentScenario.id);
    else showScreen("screen-home");
  });
  const btnHome = $("btn-home");
  if (btnHome) btnHome.addEventListener("click", () => {
    // If in campaign and more calls remain, advance; otherwise go home
    if (campaignMode && campaignTrack && campaignScores.length < campaignTrack.scenarioIds.length) {
      advanceCampaign();
    } else {
      campaignMode   = false;
      campaignScores = [];
      campaignTrack  = null;
      renderScenarios();
      showScreen("screen-home");
    }
  });

  /* Objection library panel */
  const objToggle = $("btn-objections-toggle");
  if (objToggle) objToggle.addEventListener("click", toggleObjections);
  const objClose = $("objections-close");
  if (objClose) objClose.addEventListener("click", () => {
    const panel  = $("call-objections");
    const toggle = $("btn-objections-toggle");
    if (panel)  panel.hidden = true;
    if (toggle) toggle.classList.remove("active");
    objectionOpen = false;
  });

  /* Campaign track buttons */
  const cpClassic  = $("cp-classic");
  if (cpClassic)  cpClassic.addEventListener("click",  () => startCampaign("classic"));
  const cpGauntlet = $("cp-gauntlet");
  if (cpGauntlet) cpGauntlet.addEventListener("click", () => startCampaign("gauntlet"));
});
