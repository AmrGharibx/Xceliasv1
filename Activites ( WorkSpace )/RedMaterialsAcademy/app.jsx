// ============================================
// RED
// Dynamic Training Platform - Phase 1: Core Data & Utilities
// ============================================

const { useState, useEffect, useCallback, useMemo, useRef } = React;

// ============================================
// UI CONTEXT (Tone, Motion, FX Intensity)
// ============================================

const UIContext = React.createContext({
  tone: 'en',
  fxIntensity: 0.95,
  reduceMotion: false,
  backgroundEnabled: true,
  projectorMode: false,
  setTone: () => {},
  setFxIntensity: () => {},
  setReduceMotion: () => {},
  setBackgroundEnabled: () => {},
  setProjectorMode: () => {}
});

const useUI = () => React.useContext(UIContext);

// ============================================
// TRAINING DATA - All content from presentation
// ============================================
const TRAINING_DATA = {
  // Property Types
  propertyTypes: {
    category: "Property Types",
    main: ["Residential", "Commercial", "Land"],
    residential: {
      apartments: [
        { name: "Apartment", description: "Standard residential unit in a building" },
        { name: "Duplex", description: "Two floors connected by internal staircase within the same unit" },
        { name: "Penthouse", description: "Luxury apartment on the top floor with premium views and amenities" },
        { name: "Service Apartment", description: "Furnished apartment with hotel-like services" },
        { name: "Studio", description: "Single room apartment combining living and sleeping areas" }
      ],
      villas: [
        { name: "Stand Alone", description: "Independent villa on its own plot, not attached to other units" },
        { name: "One Story", description: "Single level villa/bungalow" },
        { name: "Town House", description: "Multi-story home sharing walls with adjacent properties in a row" },
        { name: "Twin House", description: "Two houses sharing one common wall, mirror images of each other" }
      ]
    },
    commercial: [
      { name: "Shops", description: "Retail spaces for selling goods", category: "Commercial" },
      { name: "Show Room", description: "Large display spaces for products like cars or furniture", category: "Commercial" },
      { name: "Admin", description: "Office and administrative spaces", category: "Admin" },
      { name: "Medical", description: "Healthcare facilities and clinics", category: "Medical" },
      { name: "Pharmacy", description: "Pharmaceutical retail spaces", category: "Medical" }
    ]
  },

  // Finishing Types
  finishingTypes: {
    category: "Finishing Types",
    types: [
      { 
        name: "Core & Shell", 
        description: "Basic structure only - no internal finishing, bare walls and floors",
        level: 1
      },
      { 
        name: "Semi Finished", 
        description: "Basic finishing with plastered walls, basic flooring, electrical and plumbing in place",
        level: 2
      },
      { 
        name: "Fully Finished", 
        description: "Complete finishing with painted walls, tiles, fixtures, ready to move in",
        level: 3
      },
      { 
        name: "Fully Furnished", 
        description: "Fully finished plus furniture, appliances, and decor included",
        level: 4
      }
    ]
  },

  // Broker vs Developer
  brokerVsDeveloper: {
    category: "Broker vs Developer",
    broker: {
      role: "Consultancy",
      traits: [
        "Working on diverse projects",
        "Less walk out",
        "More awareness with the market",
        "Calling with regards to opportunity"
      ]
    },
    developer: {
      role: "Sales",
      traits: [
        "Working on their projects",
        "More walk out",
        "Less awareness with the market",
        "Calling with regards to type"
      ]
    }
  },

  // Primary vs Resale
  primaryVsResale: {
    category: "Primary vs Resale",
    resale: {
      name: "Resale (Secondary)",
      traits: [
        "Buy from client",
        "Cash payment",
        "Most of the resales are RTM (Ready To Move)"
      ]
    },
    primary: {
      name: "Primary",
      traits: [
        "Buy from developer",
        "Installments / cash",
        "Most of the primary are Off-plan"
      ]
    }
  },

  // Terminology
  terminology: {
    category: "Terminology",
    terms: [
      { term: "RTM", fullForm: "Ready To Move", description: "Property that is complete and available for immediate occupancy" },
      { term: "Off-plan", fullForm: "Off-plan", description: "Property sold before construction is complete, bought from plans/designs" },
      { term: "A.B.C", fullForm: "Acknowledgment, Benefits, Commitment", description: "Sales technique for qualifying clients during calls" },
      { term: "Core & Shell", fullForm: "Core & Shell", description: "Basic structure with no internal finishing" },
      { term: "ROI", fullForm: "Return On Investment", description: "The profit or loss from an investment" },
      { term: "SQM", fullForm: "Square Meter", description: "Unit of area measurement for properties" },
      { term: "BUA", fullForm: "Built Up Area", description: "Total constructed area of a property" }
    ]
  },

  // Needs vs Wants
  needsVsWants: {
    category: "Sales Psychology",
    needs: {
      description: "Everything that they say or ask for",
      characteristics: ["Tangible requirements", "Specific requests", "Measurable criteria"],
      examples: ["3 bedrooms", "Near schools", "Within budget of 2M", "Ground floor", "Parking space"]
    },
    wants: {
      description: "Reasons behind it - can be emotional or rational",
      characteristics: ["Not tangible", "Is a concept", "Emotional or rational motivation"],
      examples: ["Feel safe", "Status symbol", "Investment security", "Family comfort", "Peace of mind"]
    },
    motives: {
      emotional: ["Feel safe", "Status symbol", "Prestige", "Family happiness", "Peace of mind", "Pride of ownership"],
      rational: ["Investment return", "Location convenience", "Price value", "Future appreciation", "Rental income"]
    }
  },

  // Agent Skills
  agentSkills: {
    category: "Professionalism",
    skills: [
      "Confidence",
      "Strong communication skills",
      "Knowledge",
      "Presentable",
      "Strong time management skills",
      "Flexibility",
      "Negotiation skills",
      "Strong closure techniques"
    ]
  },

  // First Impression
  firstImpression: {
    category: "Professionalism",
    quote: "You never have a second chance to make a first impression!",
    statistic: "Studies show it can take 21 repeated good experiences with a person to make up for a bad first impression",
    redemptionCount: 21
  },

  // Dress Code - 7 Accessories Rule
  dressCode: {
    category: "Dress Code",
    rule: "You shouldn't have more than 7 points of interest on your body",
    maxPoints: 7,
    reason: "Any more than seven points could be too overwhelming for the eyes",
    accessories: [
      "Bold patterns", "Non-conservative color", "Pocket squares", "Cufflinks",
      "Watches", "Brightly-colored neckties", "Waistcoats", "Boutonnieres",
      "Braces", "Brass buttons", "Trendy eyeglasses", "Necklace",
      "Belt buckles", "Facial hair", "Rings", "Scarves", "Hats", "Pins"
    ]
  },

  // Communication - 7-38-55 Rule
  communication: {
    category: "Call Techniques",
    rule: "7-38-55 Rule",
    breakdown: [
      { type: "Words", percentage: 7, description: "The actual words you say" },
      { type: "Tonality", percentage: 38, description: "How you say it - tone, pitch, pace" },
      { type: "Body Language", percentage: 55, description: "Non-verbal cues, gestures, posture" }
    ]
  },

  // Call Techniques
  callTechniques: {
    category: "Call Techniques",
    abcTechnique: {
      name: "A.B.C Technique",
      steps: ["Acknowledgment", "Benefits", "Commitment"]
    },
    commonMistakes: [
      { mistake: "Stop when you should proceed", correct: "Continue with confidence" },
      { mistake: "Asking wrong questions like 'Is this a good time to talk?'", correct: "Get straight to the value proposition" },
      { mistake: "Unclear benefits", correct: "State clear, specific benefits" },
      { mistake: "Length of message too long", correct: "Keep message concise and focused" },
      { mistake: "Talking like robots (Machine talk format)", correct: "Sound natural and conversational" },
      { mistake: "Lack of practice & preparation", correct: "Practice scripts and know your material" }
    ],
    rapport: {
      description: "Building rapport is very important during the call",
      key: "It's not about changing yourself, it's about adapting yourself & your style to be like the other person",
      techniques: [
        "Speaking the same language & understand where they come from",
        "Mirror the same tone / volume",
        "We like people who are like us (similar attracts)"
      ]
    }
  },

  // Client Qualification
  clientQualification: {
    category: "Sales Process",
    requestItems: ["Destination", "Unit Type", "Budget", "Delivery Timeline"],
    qualifyingQuestions: [
      "What area are you looking in?",
      "What type of property do you need?",
      "What is your budget range?",
      "When do you need to move in?"
    ]
  }
};

// Arabic-first parallel dataset for EG mode.
// Important: values contain NO Latin letters.
const TRAINING_DATA_EG = {
  propertyTypes: {
    category: 'أنواع العقارات',
    main: ['سكني', 'تجاري', 'أراضي'],
    residential: {
      apartments: [
        { name: 'شقة', description: 'وحدة سكنية عادية داخل عمارة' },
        { name: 'دوبلكس', description: 'وحدة بدورين متصلين بسلم داخلي' },
        { name: 'بنتهاوس', description: 'شقة فاخرة في آخر دور بإطلالة ومميزات أعلى' },
        { name: 'شقة فندقية', description: 'شقة مفروشة بخدمات شبيهة بالفنادق' },
        { name: 'ستوديو', description: 'وحدة غرفة واحدة تجمع المعيشة والنوم' }
      ],
      villas: [
        { name: 'فيلا مستقلة', description: 'فيلا على أرض مستقلة وغير متصلة بوحدات أخرى' },
        { name: 'دور واحد', description: 'فيلا/بنجلو بمستوى واحد' },
        { name: 'تاون هاوس', description: 'بيت متعدد الأدوار متصل بجدار مع وحدات مجاورة' },
        { name: 'توين هاوس', description: 'بيتين بينهم حائط مشترك، شبه بعض' }
      ]
    },
    commercial: [
      { name: 'محلات', description: 'مساحات بيع بالتجزئة', category: 'تجاري' },
      { name: 'شو روم', description: 'مساحة عرض كبيرة لمنتجات مثل سيارات أو أثاث', category: 'تجاري' },
      { name: 'إداري', description: 'مكاتب ومساحات إدارية', category: 'إداري' },
      { name: 'طبي', description: 'عيادات ومنشآت رعاية صحية', category: 'طبي' },
      { name: 'صيدلية', description: 'مساحة بيع أدوية ومنتجات صيدلية', category: 'طبي' }
    ]
  },

  finishingTypes: {
    category: 'أنواع التشطيب',
    types: [
      { name: 'كور أند شِل', description: 'هيكل بس من غير تشطيب داخلي — حوائط وأرضيات على الطوب.', level: 1 },
      { name: 'نصف تشطيب', description: 'تشطيب أساسي — محارة + أرضيات بسيطة + كهرباء وسباكة جاهزين.', level: 2 },
      { name: 'تشطيب كامل', description: 'تشطيب كامل — دهانات + سيراميك/أرضيات + تركيبات — جاهز للسكن.', level: 3 },
      { name: 'تشطيب كامل + فرش', description: 'تشطيب كامل + فرش وأجهزة وديكور شاملين.', level: 4 }
    ]
  },

  brokerVsDeveloper: {
    category: 'بروكر ولا مطوّر',
    broker: {
      role: 'استشارة',
      traits: [
        'بيشتغل على مشاريع متنوعة',
        'نسبة انسحاب أقل',
        'وعيه بالسوق أعلى',
        'بيتصل بخصوص فرص'
      ]
    },
    developer: {
      role: 'مبيعات',
      traits: [
        'بيشتغل على مشاريعه بس',
        'نسبة انسحاب أعلى',
        'وعيه بالسوق أقل',
        'بيتصل بخصوص نوع معين'
      ]
    }
  },

  primaryVsResale: {
    category: 'برايمري ولا ريسيل',
    resale: {
      name: 'ريسيل (ثانوي)',
      traits: ['بتشتري من عميل', 'غالبًا كاش', 'معظم الريسيل جاهز للسكن']
    },
    primary: {
      name: 'برايمري',
      traits: ['بتشتري من المطوّر', 'تقسيط أو كاش', 'معظم البرايمري أوف بلان']
    }
  },

  terminology: {
    category: 'مصطلحات',
    terms: [
      { term: 'جاهز للسكن', fullForm: 'جاهز للاستلام والسكن', description: 'عقار مكتمل ومتجهز للسكن الفوري' },
      { term: 'أوف بلان', fullForm: 'قبل الإنشاء', description: 'عقار بيتباع قبل اكتمال البناء اعتمادًا على مخططات وتصميم' },
      { term: 'أ.ب.ج', fullForm: 'إقرار، مميزات، التزام', description: 'تكنيك لتأهيل العميل أثناء المكالمة' },
      { term: 'كور أند شِل', fullForm: 'هيكل فقط', description: 'أقل مستوى تشطيب: هيكل بدون تشطيب داخلي' },
      { term: 'عائد الاستثمار', fullForm: 'عائد على الاستثمار', description: 'الربح أو الخسارة الناتجة عن الاستثمار' },
      { term: 'متر مربع', fullForm: 'وحدة مساحة', description: 'وحدة قياس مساحة العقار' },
      { term: 'مساحة مبنية', fullForm: 'إجمالي المساحة المبنية', description: 'إجمالي المساحة التي تم بناؤها داخل العقار' }
    ]
  },

  needsVsWants: {
    category: 'علم نفس البيع',
    needs: {
      description: 'كل حاجة العميل بيقولها أو بيطلبها',
      characteristics: ['احتياجات ملموسة', 'طلبات محددة', 'معايير قابلة للقياس'],
      examples: ['٣ غرف', 'قريب من مدارس', 'داخل ميزانية ٢ مليون', 'أرضي', 'مكان لركن العربية']
    },
    wants: {
      description: 'السبب ورا الطلب — ممكن يكون عاطفي أو عقلاني',
      characteristics: ['مش ملموسة', 'فكرة/معنى', 'دافع عاطفي أو عقلاني'],
      examples: ['يحس بالأمان', 'وجاهة اجتماعية', 'أمان استثماري', 'راحة الأسرة', 'راحة بال']
    },
    motives: {
      emotional: ['يحس بالأمان', 'وجاهة اجتماعية', 'برستيج', 'سعادة الأسرة', 'راحة بال', 'فخر بالملكية'],
      rational: ['عائد استثماري', 'سهولة الموقع', 'قيمة مقابل السعر', 'زيادة مستقبلية', 'دخل إيجار']
    }
  },

  agentSkills: {
    category: 'الاحترافية',
    skills: [
      'ثقة',
      'تواصل قوي',
      'معرفة',
      'مظهر لائق',
      'إدارة وقت قوية',
      'مرونة',
      'مهارة تفاوض',
      'إغلاق بيع قوي'
    ]
  },

  firstImpression: {
    category: 'الاحترافية',
    quote: 'مفيش فرصة تانية تعمل انطباع أول!',
    statistic: 'الدراسات بتقول ممكن تحتاج ٢١ تجربة كويسة متكررة لتعويض الانطباع الأول الوحش',
    redemptionCount: 21
  },

  dressCode: {
    category: 'اللبس والمظهر',
    rule: 'ماينفعش يبقى عندك أكتر من ٧ نقاط لافتة في اللبس/المظهر',
    maxPoints: 7,
    reason: 'أكتر من كده بيبقى مُشتّت للعين',
    accessories: [
      'نقشات ملفتة', 'ألوان صارخة', 'منديل جيب', 'كبكات',
      'ساعة', 'كرافتة لونها قوي', 'صديري', 'وردة بدلة',
      'حمالات', 'أزرار لامعة', 'نظارة موضة', 'سلسلة',
      'إبزيم حزام كبير', 'لحية/شارب ملفت', 'خواتم', 'إيشارب', 'قبعة', 'دبوس'
    ]
  },

  communication: {
    category: 'تقنيات المكالمة',
    rule: 'قاعدة ٧-٣٨-٥٥',
    breakdown: [
      { type: 'الكلام', percentage: 7, description: 'الكلمات اللي بتقولها' },
      { type: 'نبرة الصوت', percentage: 38, description: 'طريقة الكلام: نبرة، طبقة، سرعة' },
      { type: 'لغة الجسد', percentage: 55, description: 'إشارات غير لفظية: حركة، وضعية، تعبيرات' }
    ]
  },

  callTechniques: {
    category: 'تقنيات المكالمة',
    abcTechnique: {
      name: 'تقنية أ.ب.ج',
      steps: ['إقرار', 'مميزات', 'التزام']
    },
    commonMistakes: [
      { mistake: 'توقف وانت المفروض تكمل', correct: 'كمّل بثقة' },
      { mistake: 'تسأل سؤال غلط زي "ينفع أتكلم دلوقتي؟"', correct: 'ادخل على القيمة مباشرة' },
      { mistake: 'مميزات مش واضحة', correct: 'قول مميزات واضحة ومحددة' },
      { mistake: 'الرسالة طويلة زيادة', correct: 'خليها قصيرة ومركّزة' },
      { mistake: 'أسلوب آلي', correct: 'خليك طبيعي ومريح' },
      { mistake: 'قلة تدريب وتحضير', correct: 'اتدرّب على السكريبت واعرف المادة كويس' }
    ],
    rapport: {
      description: 'بناء الألفة مهم جدًا أثناء المكالمة',
      key: 'الموضوع مش إنك تغيّر نفسك؛ الموضوع إنك تتأقلم في ستايلك عشان يبقى قريب من الشخص اللي قدامك',
      techniques: [
        'اتكلم بلغته وافهم وجهة نظره',
        'قلّد نفس النبرة/الصوت',
        'إحنا بنرتاح للناس اللي شبهنا'
      ]
    }
  },

  clientQualification: {
    category: 'خطوات البيع',
    requestItems: ['الوجهة/المنطقة', 'نوع الوحدة', 'الميزانية', 'ميعاد الاستلام'],
    qualifyingQuestions: [
      'حضرتك بتدور في أنهي منطقة؟',
      'حضرتك محتاج نوع وحدة إيه؟',
      'ميزانيتك في حدود كام؟',
      'حضرتك عايز الاستلام إمتى؟'
    ]
  }
};

const getTrainingData = (lang) => (lang === 'eg' ? TRAINING_DATA_EG : TRAINING_DATA);

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Get random items from array
const getRandomItems = (array, count) => {
  return shuffleArray(array).slice(0, count);
};

// Get random item from array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// ============================================
// THEME HELPERS
// ============================================

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const lerp = (a, b, t) => a + (b - a) * t;

const UI_STRINGS = {
  en: {
    appTitle: 'Xcelias',
    appSubtitle: 'A premium real estate training game with 35+ interactive drills',
    totalScore: 'Total Score',
    currentStreak: 'Current Streak',
    activitiesLabel: 'Activities',
    selectCategory: 'Select a Training Category',
    backToCategories: '← Back to Categories',
    activitiesAvailable: 'activities available',
    clickToStart: 'Click to start',
    quickStart: 'Quick Start',
    takeFinalExam: 'Take the Final Exam',
    voteDistribution: 'Vote Distribution',
    revealAnswer: 'Reveal Answer',
    nextPrompt: 'Next Prompt →',
    done: 'Done',
    score: 'Score',
    streak: 'Streak',
    progress: 'Progress',
    correct: 'Correct!',
    incorrect: 'Incorrect!',
    back: '← Back to Menu',
    next: 'Next →',
    nextQuestion: 'Next Question →',
    submit: 'Submit',
    timeUp: "Time's up!",
    settings: 'Settings',
    toneLabel: 'Tone',
    toneEn: 'Professional English',
    toneEg: 'Egyptian Arabic (Agent Tone)',
    fxLabel: 'Background Energy',
    fxToggle: 'Background FX',
    motionLabel: 'Reduce Motion',
    projectorLabel: 'Projector Mode',
    projectorHint: 'Bigger + cleaner layout for classroom screens',
    on: 'On',
    off: 'Off',
    enabled: 'Enabled',
    disabled: 'Disabled',
    categories: {
      knowledge: 'Knowledge & Terminology',
      visual: 'Visual & Layout Mastery',
      broker: 'Broker vs Developer',
      psychology: 'Sales Psychology',
      calls: 'The Perfect Call',
      professional: 'Professionalism & Skills',
      advanced: 'Advanced Simulations',
      classroom: 'Classroom & Teams',
      fun: 'Random & Fun',
      gaming: '🕹️ Fun Games Zone'
    },
    activityNames: {
      rapidfire: 'Rapid Fire MCQ',
      truefalse: 'True/False Speed Run',
      matching: 'Definition Matching',
      oddone: 'Odd One Out',
      blanks: 'Fill in the Blanks',
      acronym: 'Acronym Decoder',
      hierarchy: 'Hierarchy Sorter',

      accessories: '7 Accessories Inspection',
      unittype: 'Unit Type Identifier',
      finishing: 'Finishing Visualizer',
      commercial: 'Commercial Tycoon',

      sortinghat: 'The Sorting Hat',
      procon: 'Pro/Con Matrix',
      market: 'Market Awareness Check',

      motive: 'Motive Detective',
      needswants: 'Needs vs Wants Sorter',
      whychain: 'The "Why" Chain',
      brainheart: 'Brain vs Heart',

      decoder: '7-38-55 Decoder',
      robot: 'Robot Talk Buzzer',
      mirror: 'Mirroring Drill',
      abc: 'ABC Closing Challenge',
      mistake: 'Mistake Sniper',
      qualifying: 'Qualifying Quest',

      dresscode: 'Dress Code Police',
      skills: 'Skills Radar',
      impression: 'First Impression Trial',

      objection: 'Objection Deflector',
      triage: 'Lead Triage',
      form: 'Request Form Builder',
      coldcall: 'Cold Call Simulator',
      '21exp': '21 Experiences Game',

      teambattle: 'Team Battle Arena',
      facilitator: 'Facilitator Deck',
      debrief: 'Coach Debrief Console',
      consensus: 'Consensus Clash',

      reviewrescue: 'Review Rescue',
      academysprint: 'Academy Sprint',
      objectionduel: 'Objection Duel Arena',
      callflow: 'Call Flow Builder',

      bingo: 'Real Estate Bingo',
      crossword: "Salesman's Word Game",
      exam: 'Final Exam',

      clientmatch: 'Client Match',
      objblitz: 'Objection Blitz',
      propquest: 'Property Quest'
    }
  },
  eg: {
    appTitle: 'Xcelias',
    appSubtitle: 'لعبة تدريب عقاري بريميوم فيها +٣٥ تمرين تفاعلي',
    totalScore: 'إجمالي النقط',
    currentStreak: 'الستريك الحالي',
    activitiesLabel: 'الأنشطة',
    selectCategory: 'اختار تصنيف التدريب',
    backToCategories: '← رجوع للتصنيفات',
    activitiesAvailable: 'نشاط متاح',
    clickToStart: 'اضغط عشان تبدأ',
    quickStart: 'بداية سريعة',
    takeFinalExam: 'ادخل الامتحان النهائي',
    voteDistribution: 'توزيع التصويت',
    revealAnswer: 'اظهر الإجابة',
    nextPrompt: 'برومبت اللي بعده →',
    done: 'تمام',
    score: 'نقط',
    streak: 'ستريك',
    progress: 'تقدّم',
    correct: 'صح!',
    incorrect: 'مش صح!',
    back: '← رجوع',
    next: 'التالي →',
    nextQuestion: 'السؤال اللي بعده →',
    submit: 'تأكيد',
    timeUp: 'الوقت خلص!',
    settings: 'الإعدادات',
    toneLabel: 'ستايل الكلام',
    toneEn: 'إنجليزي رسمي',
    toneEg: 'مصري (ستايل سيلز)',
    fxLabel: 'طاقة الخلفية',
    fxToggle: 'خلفية متحركة',
    motionLabel: 'تقليل الحركة',
    projectorLabel: 'وضع البروجكتور',
    projectorHint: 'شكل أكبر وأنضف للعرض قدام الفصل',
    on: 'شغّال',
    off: 'مقفول',
    enabled: 'مفعّل',
    disabled: 'مقفول',
    categories: {
      knowledge: 'مصطلحات ومعرفة',
      visual: 'مخططات ولاي-أوت',
      broker: 'بروكر ولا ديفيلوبر',
      psychology: 'سيكولوجية البيع',
      calls: 'المكالمة المظبوطة',
      professional: 'بروفيشنال ومهارات',
      advanced: 'سيموليشنز متقدمة',
      classroom: 'فصل وتيمز',
      fun: 'فَن وخلطبيطة',
      gaming: '🕹️ منطقة الألعاب'
    },
    activityNames: {
      rapidfire: 'أسئلة سريعة (اختيارات)',
      truefalse: 'صح/غلط بسرعة',
      matching: 'توصيل التعريفات',
      oddone: 'الغريب برّه',
      blanks: 'كمّل الفراغات',
      acronym: 'فك الاختصارات',
      hierarchy: 'ترتيب هرمية',

      accessories: 'تفتيش ٧ إكسسوارات',
      unittype: 'تحديد نوع الوحدة',
      finishing: 'تصوّر التشطيب',
      commercial: 'تايكون تجاري',

      sortinghat: 'قبعة الفرز',
      procon: 'مميزات/عيوب',
      market: 'اختبار الوعي بالسوق',

      motive: 'محقق الدوافع',
      needswants: 'احتياج ولا رغبة',
      whychain: 'سلسلة الـ Why',
      brainheart: 'العقل ولا القلب',

      decoder: 'ديكودر 7-38-55',
      robot: 'جرس الروبوت',
      mirror: 'تمرين المراية',
      abc: 'تحدي قفل أ.ب.ج',
      mistake: 'قناص الغلطات',
      qualifying: 'مهمة الكواليـفاي',

      dresscode: 'شرطة اللبس',
      skills: 'رادار المهارات',
      impression: 'انطباع أول',

      objection: 'مصدّ الاعتراضات',
      triage: 'فرز الليدز',
      form: 'بناء فورم الطلب',
      coldcall: 'سيموليتر كولد كول',
      '21exp': 'لعبة 21 تجربة',

      teambattle: 'ساحة معركة التيم',
      facilitator: 'كروت المُيسّر',
      debrief: 'كونسول الديبريف',
      consensus: 'صدام الإجماع',

      reviewrescue: 'إنقاذ المراجعة',
      academysprint: 'سبرينت الأكاديمية',
      objectionduel: 'ساحة اعتراضات',
      callflow: 'بناء مسار المكالمة',

      bingo: 'بينجو عقارات',
      crossword: 'لعبة كلمات سيلز',
      exam: 'الامتحان النهائي',

      clientmatch: 'ماتش العميل',
      objblitz: 'بليتز الاعتراضات',
      propquest: 'مهمة العقار'
    }
  }
};

const EG_TERM_MAP = {
  // People / roles
  Broker: 'بروكر',
  Developer: 'مطوّر',

  // Property types
  Residential: 'سكني',
  Commercial: 'تجاري',
  Land: 'أراضي',

  // Unit types
  Apartment: 'شقة',
  Duplex: 'دوبلكس',
  Penthouse: 'بنتهاوس',
  'Service Apartment': 'شقة فندقية',
  Studio: 'استوديو',
  'Stand Alone': 'فيلا مستقلة',
  'One Story': 'دور واحد',
  'Town House': 'تاون هاوس',
  'Twin House': 'توين هاوس',

  // Commercial
  Shops: 'محلات',
  'Show Room': 'شو روم',
  Admin: 'إداري',
  Medical: 'طبي',
  Pharmacy: 'صيدلية',

  // Finishing
  'Core & Shell': 'كور أند شِل',
  'Semi Finished': 'نصف تشطيب',
  'Fully Finished': 'تشطيب كامل',
  'Fully Furnished': 'تشطيب كامل + فرش',

  // Common terms
  RTM: 'جاهز للسكن',
  'Ready To Move': 'جاهز للسكن',
  'Off-plan': 'أوف بلان',
  'A.B.C': 'أ.ب.ج',
  'Acknowledgment, Benefits, Commitment': 'إقرار، مميزات، التزام',
  ROI: 'عائد على الاستثمار',
  'Return On Investment': 'عائد على الاستثمار',
  SQM: 'متر مربع',
  'Square Meter': 'متر مربع',
  BUA: 'مساحة مبنية',
  'Built Up Area': 'مساحة مبنية'
};

const EG_EXACT_MAP = {
  // Finishing descriptions (presentation-derived)
  'Basic structure only - no internal finishing, bare walls and floors': 'هيكل بس من غير تشطيب داخلي — حوائط وأرضيات على الطوب.',
  'Basic finishing with plastered walls, basic flooring, electrical and plumbing in place': 'تشطيب أساسي — محارة + أرضيات بسيطة + كهرباء وسباكة جاهزين.',
  'Complete finishing with painted walls, tiles, fixtures, ready to move in': 'تشطيب كامل — دهانات + سيراميك/أرضيات + تركيبات — جاهز للسكن.',
  'Fully finished plus furniture, appliances, and decor included': 'تشطيب كامل + فرش وأجهزة وديكور شاملين.'
};

const EG_SENTENCE_MAP = {
  // True/False Speed Run (presentation-derived concepts)
  'Most resales are Off-plan.': 'معظم الريسيل مش أوف بلان؛ أغلبه جاهز للسكن.',
  'Most resales are RTM (Ready To Move), not Off-plan. Off-plan properties are typically primary sales from developers.': 'معظم الريسيل بيكون جاهز للسكن، مش أوف بلان. الأوف بلان غالبًا بيكون برايمري من الديفيلوبر.',
  'Most primary properties are Off-plan.': 'معظم البرايمري بيكون أوف بلان.',
  'Correct! Most primary properties are Off-plan, meaning they are sold before construction is complete.': 'صح! معظم البرايمري أوف بلان يعني بيتباع قبل ما البناء يخلص.',
  'Brokers have more walk out than developers.': 'البروكر عنده نسبة انسحاب أكتر من المطوّر.',
  'Developers have more walk out. Brokers have less walk out because they offer consultancy and diverse projects.': 'المطوّر عنده نسبة انسحاب أعلى. البروكر أقل عشان بيقدّم استشارة وشغله على مشاريع متنوعة.',
  'A Duplex has two floors connected by an internal staircase.': 'الدوبلكس دورين متصلين بسلم داخلي.',
  'Correct! A Duplex is a unit with two floors connected by an internal staircase.': 'صح! الدوبلكس وحدة بدورين متصلين بسلم داخلي.',
  'You should have more than 7 points of interest on your body.': 'ينفع يبقى عندك أكتر من ٧ نقاط لافتة في لبسك/شكلِك.',
  "You shouldn't have more than 7 points of interest. More than seven points could be too overwhelming for the eyes.": 'المفروض مايزيدوش عن ٧ نقاط. أكتر من كده بيبقى مُشتّت للعين.',
  'It takes 21 good experiences to make up for a bad first impression.': 'بيحتاج ٢١ تجربة كويسة عشان تعوّض انطباع أول وحش.',
  'Correct! Studies show it can take 21 repeated good experiences to make up for a bad first impression.': 'صح! الدراسات بتقول ممكن تحتاج ٢١ تجربة كويسة متكررة لتعويض الانطباع الأول الوحش.',
  'Words account for 55% of communication retention.': 'الكلام مسؤول عن ٥٥٪ من تأثير التواصل.',
  'Words account for only 7%. Body Language accounts for 55% of communication retention.': 'الكلام بس حوالي ٧٪. لغة الجسد حوالي ٥٥٪ من تأثير التواصل.',
  'Tonality accounts for 38% of communication retention.': 'نبرة الصوت مسؤولة عن ٣٨٪ من تأثير التواصل.',
  'Correct! Tonality accounts for 38% of how communication is retained.': 'صح! نبرة الصوت حوالي ٣٨٪ من تأثير التواصل.',
  'A.B.C stands for Always Be Closing.': 'تقنية أ.ب.ج معناها: دايمًا اقفل البيع.',
  'A.B.C stands for Acknowledgment, Benefits, Commitment - a technique for qualifying clients during calls.': 'أ.ب.ج معناها: إقرار، مميزات، التزام — تكنيك لتأهيل العميل أثناء المكالمة.',
  'Core & Shell means the property is fully furnished.': 'كور أند شِل يعني الوحدة مفروشة بالكامل.',
  'Core & Shell is the most basic finishing - only the structure with no internal finishing, bare walls and floors.': 'كور أند شِل أقل مستوى تشطيب — هيكل بس من غير تشطيب داخلي.',
  'Brokers work on diverse projects.': 'البروكر بيشتغل على مشاريع متنوعة.',
  'Correct! Brokers work on diverse projects while developers work only on their own projects.': 'صح! البروكر شغله على مشاريع متنوعة، إنما الديفيلوبر على مشاريعه بس.',
  'Resale properties are typically bought with installments.': 'الريسيل عادة بيتشترى بالتقسيط.',
  'Resale properties typically require cash payment. Primary/developer properties offer installment options.': 'الريسيل غالبًا كاش. البرايمري/الديفيلوبر بيكون فيه اختيارات تقسيط.',
  'A Penthouse is located on the ground floor.': 'البنتهاوس بيكون في الدور الأرضي.',
  'A Penthouse is a luxury apartment on the TOP floor with premium views and amenities.': 'البنتهاوس شقة فاخرة في آخر دور (فوق) بإطلالة ومميزات أعلى.',
  'Building rapport means changing yourself completely.': 'بناء الألفة يعني تغيّر نفسك بالكامل.',
  "It's not about changing yourself, it's about ADAPTING yourself & your style to be like the other person.": 'الموضوع مش إنك تغيّر نفسك؛ الموضوع إنك تتأقلم في ستايلك عشان يبقى قريب من الشخص اللي قدامك.',
  'Needs are tangible requirements that clients ask for.': 'الاحتياجات هي حاجات ملموسة العميل بيطلبها.',
  'Correct! Needs are everything that clients say or ask for - tangible, specific, measurable requirements.': 'صح! الاحتياجات هي كل اللي العميل بيقوله/بيطلبه: حاجات ملموسة ومحددة وقابلة للقياس.',

  // Market Awareness Check
  'Who has MORE awareness with the market?': 'مين وعيه بالسوق أعلى؟',
  'Brokers have more market awareness because they work across diverse projects and the entire market.': 'البروكر وعيه بالسوق أعلى عشان شغله على مشاريع كتير ومن كذا ديفيلوبر.',
  'Who experiences MORE walk out?': 'مين عنده نسبة انسحاب أكتر؟',
  'Developer sales teams experience more walk out compared to brokers.': 'تيم مبيعات المطوّر بيواجه انسحاب أكتر مقارنة بالبروكر.',
  'Who works on DIVERSE projects?': 'مين بيشتغل على مشاريع متنوعة؟',
  'Brokers work on diverse projects from multiple developers.': 'البروكر بيشتغل على مشاريع متنوعة من أكتر من ديفيلوبر.',
  'Who provides CONSULTANCY services?': 'مين بيقدّم استشارة؟',
  'Brokers provide consultancy services, while developers focus on sales.': 'البروكر دوره استشاري، إنما الديفيلوبر مركز على البيع.',
  'Who calls with regards to OPPORTUNITY?': 'مين بيتصل بخصوص فرصة؟',
  'Brokers call about opportunities since they represent multiple projects.': 'البروكر بيتصل بخصوص فرص لأنه بيمثّل مشاريع كتير.',
  'Who calls with regards to TYPE?': 'مين بيتصل بخصوص نوع الوحدة؟',
  'Developers call about specific unit types available in their projects.': 'الديفيلوبر بيتصل بخصوص أنواع وحدات محددة موجودة في مشاريعه.'
};

const replaceKnownTerms = (input) => {
  let t = String(input);
  // Replace known multi-word terms first (case-sensitive list keys)
  const keys = Object.keys(EG_TERM_MAP).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    // escape regex specials
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`\\b${esc}\\b`, 'g'), EG_TERM_MAP[k]);
  }
  return t;
};

const latinCharRatio = (s) => {
  const str = String(s);
  const latin = (str.match(/[A-Za-z]/g) || []).length;
  const total = Math.max(1, str.length);
  return latin / total;
};

const egReplaceWords = (input) => {
  let t = input;
  const rules = [
    [/\bMost\b/gi, 'معظم'],
    [/\bresales\b/gi, 'الريسيل'],
    [/\bprimary properties\b/gi, 'العقارات الأساسية (Primary)'],
    [/\bdevelopers?\b/gi, 'الديفيلوبر'],
    [/\bbrokers?\b/gi, 'البروكر'],
    [/\bwalk out\b/gi, 'نسبة الـ Walk-out'],
    [/\bawareness\b/gi, 'وعي'],
    [/\bmarket\b/gi, 'السوق'],
    [/\bstand for\b/gi, 'اختصار لـ'],
    [/\bmeans\b/gi, 'يعني'],
    [/\bCorrect!?\b/gi, 'صح'],
    [/\bTrue\b/g, 'صح'],
    [/\bFalse\b/g, 'غلط']
  ];
  for (const [re, rep] of rules) t = t.replace(re, rep);
  return t;
};

const egTranslateTerm = (term) => {
  const s = String(term);
  return EG_TERM_MAP[s] || s;
};

const egTranslateText = (text, kind) => {
  if (text == null) return text;
  const s = String(text);
  if (/[\u0600-\u06FF]/.test(s)) return s;
  if (EG_EXACT_MAP[s]) return EG_EXACT_MAP[s];
  if (EG_SENTENCE_MAP[s]) return EG_SENTENCE_MAP[s];

  // Fast path: if it's mostly English prose and we don't have a rule for it yet,
  // show a clean Arabic placeholder (NOT arabized gibberish). We'll expand coverage in phases.
  if (latinCharRatio(s) > 0.45) {
    if (kind === 'question') return 'سؤال (ترجمة مصرية تحت التجهيز)…';
    if (kind === 'explain') return 'توضيح (ترجمة مصرية تحت التجهيز)…';
    if (kind === 'label') return 'ترجمة تحت التجهيز';
    if (kind === 'desc') return 'ترجمة تحت التجهيز';
  }

  // Template-driven translations (keeps meaning, presentation-derived)
  const m1 = s.match(/^What finishing type is described as: "([\s\S]+)"\?$/);
  if (m1) return `أنهي نوع تشطيب الوصف بتاعه: "${egTranslateText(m1[1], 'desc')}"؟`;

  const m2 = s.match(/^What does "([\s\S]+)" stand for\?$/);
  if (m2) return `اختصار "${m2[1]}" معناه إيه؟`;

  const m3 = s.match(/^Which unit type matches this description: "([\s\S]+)"\?$/);
  if (m3) return `أنهي نوع وحدة ينطبق عليه الوصف ده: "${egTranslateText(m3[1], 'desc')}"؟`;

  const m4 = s.match(/^A (.+) is: ([\s\S]+)$/);
  if (m4) return `يعني إيه ${egTranslateTerm(m4[1])}؟ — ${egTranslateText(m4[2], 'desc')}`;

  const m5 = s.match(/^(.+) stands for "(.+)" - ([\s\S]+)$/);
  if (m5) return `${m5[1]} اختصار لـ "${m5[2]}" — ${egTranslateText(m5[3], 'desc')}`;

  const m6 = s.match(/^(.+) = (.+): ([\s\S]+)$/);
  if (m6) return `${m6[1]} = ${m6[2]} — ${egTranslateText(m6[3], 'desc')}`;

  // Fallback: best-effort Egyptian agent paraphrase + word replacements
  const softened = egReplaceWords(s);
  let out = softened;
  if (kind === 'question') out = `سؤال يا برو: ${softened}`;
  else if (kind === 'explain') out = `الخلاصة يا كابتن: ${softened}`;
  else out = softened;

  // Replace known terms; if Latin still remains, switch to Arabic placeholder.
  out = replaceKnownTerms(out);
  if (/[A-Za-z]/.test(out)) {
    if (kind === 'question') return 'سؤال (ترجمة مصرية تحت التجهيز)…';
    if (kind === 'explain') return 'توضيح (ترجمة مصرية تحت التجهيز)…';
    return 'ترجمة تحت التجهيز';
  }
  return out;
};

const toneifyText = (lang, text, kind) => {
  if (text == null) return text;
  const s = String(text);
  if (lang !== 'eg') return s;
  const out = egTranslateText(s, kind);
  return replaceKnownTerms(out);
};

const toneifyTermLabel = (lang, term) => {
  const raw = String(term);
  if (lang !== 'eg') return raw;
  const ar = egTranslateTerm(raw);
  const out = replaceKnownTerms(ar);
  if (/[A-Za-z]/.test(out)) return 'مصطلح';
  return out;
};

const optionLetter = (lang, idx) => {
  if (lang !== 'eg') return String.fromCharCode(65 + idx);
  const ar = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك'];
  return ar[idx] || '•';
};

// Game-style option button class builder
// Returns className string with color + correct/incorrect/dimmed state
const OPTION_COLOR_CYCLE = ['blue', 'pink', 'amber', 'green', 'red', 'purple', 'cyan', 'teal'];

const optionClass = (idx, chosen, correctAnswer, showFeedback, option) => {
  const color = OPTION_COLOR_CYCLE[idx % OPTION_COLOR_CYCLE.length];
  let base = `game-option game-option--${color}`;
  if (!showFeedback) return base;
  if (option === correctAnswer) return `${base} game-option--correct`;
  if (option === chosen) return `${base} game-option--incorrect`;
  return `${base} game-option--dimmed`;
};

// Two-choice variant: idx 0 = green (TRUE/A), idx 1 = red (FALSE/B)
const tfClass = (value, chosen, correct, showFeedback) => {
  const color = value === true || value === 'a' ? 'green' : 'red';
  let base = `game-option game-option--${color}`;
  if (!showFeedback) return base;
  if (value === correct) return `${base} game-option--correct`;
  if (value === chosen) return `${base} game-option--incorrect`;
  return `${base} game-option--dimmed`;
};


const EG_COACH_LINES = {
  good: [
    'جامد! كمّل بنفس الرتم.',
    'حلو قوي — ده شغل بروفيشنال.',
    'تمام يا كابتن. ركّز كده.',
    'فل! كده انت بتقفل صح.'
  ],
  bad: [
    'ولا يهمك — جرّب تاني بشكل أهدى.',
    'قريبة… بس ركّز في الفكرة الأساسية.',
    'خلي كلامك طبيعي ومش روبوت.',
    'اسأل صح وخليك مختصر.'
  ]
};

const RM_THEME = {
  bg: '#0f0f1a',
  panel: 'rgba(255,255,255,0.06)',
  panel2: 'rgba(255,255,255,0.09)',
  border: 'rgba(102,126,234,0.15)',
  border2: 'rgba(102,126,234,0.25)',
  text: 'rgba(232,232,240,0.94)',
  muted: 'rgba(152,152,184,0.80)',
  faint: 'rgba(90,90,122,0.55)',
  red: '#667eea',
  red2: '#764ba2',
  cyan: '#f093fb',
  violet: '#764ba2',
  amber: '#ffb020',
  green: '#50fa7b'
};

// ============================================
// STYLED COMPONENTS
// ============================================

const styles = {
  // Layout
  container: {
    minHeight: '100vh',
    padding: '28px',
    maxWidth: '1440px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1
  },
  
  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 22px',
    background: 'linear-gradient(135deg, rgba(20,20,35,0.92), rgba(18,18,30,0.88))',
    borderRadius: '18px',
    marginBottom: '30px',
    border: `1px solid ${RM_THEME.border}`,
    boxShadow: '0 18px 60px rgba(0,0,0,0.45)'
  },
  
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  
  logoIcon: {
    width: '50px',
    height: '50px',
    position: 'relative',
    background: `linear-gradient(135deg, #667eea, #764ba2)`,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '800',
    boxShadow: '0 14px 32px rgba(102,126,234,0.25), inset 0 0 0 1px rgba(255,255,255,0.14)'
  },
  logoRing: {
    position: 'absolute',
    inset: '-6px',
    borderRadius: '18px',
    border: '1.5px solid transparent',
    background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb) border-box',
    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    opacity: 0.4,
    animation: 'logoRingPulse 3s ease-in-out 1'
  },
  
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    background: `linear-gradient(90deg, rgba(255,255,255,0.95), ${RM_THEME.red})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  logoSub: {
    fontSize: '9px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: 'rgba(255,255,255,0.5)',
    marginTop: '2px'
  },
  logoRed: {
    color: '#e8372a',
    fontWeight: '800',
    WebkitTextFillColor: '#e8372a',
    letterSpacing: '2px'
  },
  
  // Score Panel
  scorePanel: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  },
  
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '14px',
    border: `1px solid ${RM_THEME.border}`
  },
  
  scoreLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  
  scoreValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#fff'
  },
  
  streakValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: RM_THEME.amber
  },
  
  // Cards
  card: {
    background: 'linear-gradient(180deg, rgba(22,22,38,0.94), rgba(18,18,32,0.90))',
    borderRadius: '22px',
    padding: '30px',
    border: `1px solid ${RM_THEME.border}`,
    marginBottom: '20px',
    boxShadow: '0 22px 70px rgba(0,0,0,0.45)',
    position: 'relative',
    overflow: 'hidden',
    backgroundImage:
      `radial-gradient(600px 300px at 10% 10%, rgba(102,126,234,0.10), transparent 60%),` +
      `radial-gradient(600px 300px at 90% 20%, rgba(240,147,251,0.08), transparent 62%),` +
      `radial-gradient(600px 400px at 60% 92%, rgba(118,75,162,0.10), transparent 62%),` +
      `linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025))`,
    transition: 'transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s ease'
  },
  
  // Buttons
  primaryBtn: {
    background: `linear-gradient(135deg, ${RM_THEME.red}, ${RM_THEME.red2})`,
    color: '#fff',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 12px 32px rgba(102,126,234,0.22), inset 0 0 0 1px rgba(255,255,255,0.14)'
  },
  
  secondaryBtn: {
    background: 'rgba(30,30,50,0.85)',
    color: '#fff',
    border: `1px solid ${RM_THEME.border}`,
    padding: '15px 30px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))'
  },
  
  optionBtn: {
    background: 'linear-gradient(145deg, rgba(30,32,60,0.9), rgba(20,22,45,0.95))',
    color: '#e2e8f0',
    border: '1.5px solid rgba(102,126,234,0.25)',
    padding: '20px 22px',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s ease, box-shadow 0.2s ease',
    textAlign: 'left',
    width: '100%',
    marginBottom: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    position: 'relative',
    overflow: 'hidden'
  },
  
  optionBtnHover: {
    background: 'linear-gradient(145deg, rgba(102,126,234,0.18), rgba(30,32,60,0.95))',
    borderColor: '#667eea',
    transform: 'translateY(-2px)'
  },
  
  correctBtn: {
    background: 'linear-gradient(145deg, rgba(16,185,129,0.22), rgba(5,150,105,0.15))',
    borderColor: '#10b981',
    color: '#6ee7b7',
    boxShadow: '0 0 20px rgba(16,185,129,0.25), 0 4px 16px rgba(0,0,0,0.3)'
  },
  
  incorrectBtn: {
    background: 'linear-gradient(145deg, rgba(239,68,68,0.22), rgba(185,28,28,0.15))',
    borderColor: '#ef4444',
    color: '#fca5a5',
    boxShadow: '0 0 20px rgba(239,68,68,0.25), 0 4px 16px rgba(0,0,0,0.3)'
  },
  
  // Grid
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px'
  },
  
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px'
  },
  
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },

  // Big stage elements
  stageTitle: {
    fontSize: '44px',
    letterSpacing: '-0.02em',
    lineHeight: 1.05,
    fontWeight: 850,
    marginBottom: '10px'
  },

  stageSubtitle: {
    fontSize: '18px',
    color: RM_THEME.muted,
    maxWidth: '820px',
    margin: '0 auto'
  },

  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '999px',
    border: `1px solid ${RM_THEME.border}`,
    background: 'rgba(255,255,255,0.06)'
  },

  divider: {
    height: '1px',
    width: '100%',
    background: 'rgba(255,255,255,0.10)'
  },
  
  // Typography
  title: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '10px',
    color: '#fff'
  },
  
  subtitle: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '30px'
  },
  
  questionText: {
    fontSize: '26px',
    fontWeight: '700',
    marginBottom: '28px',
    lineHeight: '1.45',
    color: '#fff',
    textAlign: 'center'
  },

  // Feedback — now delegated to CSS classes
  feedbackCorrect: {
    borderRadius: '20px',
    padding: '24px 28px',
    marginTop: '20px',
    background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.10))',
    border: '1px solid rgba(16,185,129,0.35)',
    position: 'relative',
    overflow: 'hidden'
  },
  
  feedbackIncorrect: {
    borderRadius: '20px',
    padding: '24px 28px',
    marginTop: '20px',
    background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(220,38,38,0.10))',
    border: '1px solid rgba(239,68,68,0.35)',
    position: 'relative',
    overflow: 'hidden'
  },
  
  // Category Cards
  categoryCard: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
    borderRadius: '16px',
    padding: '25px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden'
  },
  
  categoryIcon: {
    fontSize: '40px',
    marginBottom: '15px'
  },
  
  categoryTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  
  categoryCount: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)'
  },
  
  // Progress Bar — now uses game-progress CSS class, these are fallbacks
  progressBar: {
    width: '100%',
    height: '12px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '99px',
    overflow: 'hidden',
    marginBottom: '24px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
  },
  
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea, #a78bfa, #f093fb)',
    borderRadius: '99px',
    transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
    position: 'relative'
  },
  
  // Timer
  timer: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#667eea',
    textAlign: 'center',
    marginBottom: '20px'
  },
  
  // Badge
  badge: {
    display: 'inline-block',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  
  badgeRed: {
    background: 'rgba(102, 126, 234, 0.2)',
    color: '#667eea'
  },
  
  badgeGreen: {
    background: 'rgba(72, 187, 120, 0.2)',
    color: '#48bb78'
  },
  
  badgeBlue: {
    background: 'rgba(66, 153, 225, 0.2)',
    color: '#4299e1'
  }
};

// ============================================
// SCROLL REVEAL — Animate sections once on entry
// ============================================
const useScrollReveal = (threshold = 0.1) => {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, className: visible ? 'reveal visible' : 'reveal' };
};

// ============================================
// CONFETTI BURST — One-shot celebration
// ============================================
const fireConfetti = (count = 30) => {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#667eea', '#f093fb', '#48bb78', '#fbbf24', '#ff6b6b', '#764ba2'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.appendChild(container);
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = (10 + Math.random() * 80) + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 0.8) + 's';
    piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.width = (4 + Math.random() * 8) + 'px';
    piece.style.height = (4 + Math.random() * 8) + 'px';
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 4000);
};

// ============================================
// SCORE POP — Animate score counter on change
// ============================================
const ScoreCounter = ({ value, style }) => {
  const prevRef = React.useRef(value);
  const [pop, setPop] = React.useState(false);
  useEffect(() => {
    if (value !== prevRef.current) {
      setPop(true);
      prevRef.current = value;
      const t = setTimeout(() => setPop(false), 400);
      return () => clearTimeout(t);
    }
  }, [value]);
  return React.createElement('span', {
    className: pop ? 'score-pop' : '',
    style: { ...style, display: 'inline-block' }
  }, value);
};

// ============================================
// BACKGROUND FX (Canvas Particles + Aurora)
// ============================================

const BackgroundFX = () => {
  const { fxIntensity, reduceMotion, backgroundEnabled, projectorMode } = useUI();
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const particlesRef = React.useRef([]);
  const mouseRef = React.useRef({ x: 0, y: 0, active: false });

  const prefersReducedRender = reduceMotion || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (!backgroundEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    const prefersReduced = reduceMotion || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const isMobile = window.innerWidth <= 768;

    // PERF: No canvas on mobile — pure CSS aurora is enough
    if (isMobile) return;

    // PERF: Cap DPR to 1 to halve pixel count on retina
    const DPR = 1;

    let W = window.innerWidth;
    let H = window.innerHeight;
    let vignette = null;
    let lastTs = 0;
    // PERF: 20fps is buttery for ambient particles, saves 33% CPU vs 30fps
    const targetFps = prefersReduced ? 12 : 20;
    const minFrameMs = 1000 / targetFps;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      vignette = ctx.createRadialGradient(W * 0.5, H * 0.35, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.28)');
    };

    const seed = () => {
      // PERF: Drastically fewer particles — 12-24 max
      const base = prefersReduced ? 8 : 18;
      const count = Math.min(24, Math.max(6, Math.floor(base * clamp(fxIntensity, 0.6, 1.5))));
      const pts = [];
      for (let i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: lerp(1.5, 3.5, Math.random()),
          a: lerp(0.12, 0.32, Math.random()),
          vx: lerp(-0.18, 0.18, Math.random()),
          vy: lerp(-0.12, 0.12, Math.random()),
          hue: Math.random() < 0.34 ? 355 : (Math.random() < 0.5 ? 195 : 265)
        });
      }
      particlesRef.current = pts;
    };

    let moveThrottle = 0;
    const onMove = (e) => {
      const now = performance.now();
      if (now - moveThrottle < 50) return; // PERF: throttle mousemove to 20hz
      moveThrottle = now;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };
    const onLeave = () => { mouseRef.current.active = false; };

    const tick = (ts) => {
      if (ts && lastTs && (ts - lastTs) < minFrameMs) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (ts) lastTs = ts;
      if (document.hidden) { rafRef.current = requestAnimationFrame(tick); return; }

      const w = W, h = H;
      ctx.clearRect(0, 0, w, h);
      if (vignette) { ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h); }

      const m = mouseRef.current;
      const pull = m.active ? 0.001 : 0;
      const pts = particlesRef.current;

      // PERF: No shadowBlur, no globalCompositeOperation change
      // Batch by hue color to minimize state changes
      const groups = { 355: [], 195: [], 265: [] };
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        if (m.active) {
          const dx = m.x - p.x, dy = m.y - p.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 180 * 180) { p.vx += dx * pull; p.vy += dy * pull; }
        }
        p.vx *= 0.988; p.vy *= 0.988;
        (groups[p.hue] || (groups[p.hue] = [])).push(p);
      }

      // PERF: Single beginPath per color group — massively fewer draw calls
      for (const hue of [355, 195, 265]) {
        const g = groups[hue];
        if (!g || !g.length) continue;
        ctx.fillStyle = `hsla(${hue}, 90%, 62%, 0.30)`;
        ctx.beginPath();
        for (const p of g) {
          ctx.moveTo(p.x + p.r, p.y);
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    resize(); seed();
    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);

    const onVisibility = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else {
        if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fxIntensity, reduceMotion, backgroundEnabled]);

  if (!backgroundEnabled) return null;

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          contain: 'strict'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%'
          }}
        />
        {/* PERF: Static aurora — no animation, reduced blur, GPU-composited */}
        <div
          style={{
            position: 'absolute',
            inset: '-10vh -10vw',
            background:
              `radial-gradient(55vmax 38vmax at 12% 14%, rgba(255,59,59,${0.14 * clamp(fxIntensity, 0.7, 1.5)}), transparent 60%),` +
              `radial-gradient(50vmax 40vmax at 88% 18%, rgba(0,212,255,${0.12 * clamp(fxIntensity, 0.7, 1.5)}), transparent 62%),` +
              `radial-gradient(50vmax 50vmax at 60% 92%, rgba(139,92,246,${0.12 * clamp(fxIntensity, 0.7, 1.5)}), transparent 62%)`,
            filter: 'blur(14px) saturate(110%)',
            opacity: prefersReducedRender ? 0.35 : (projectorMode ? 0.45 : 0.55),
            transform: 'translate3d(0,0,0)',
            contain: 'layout style'
          }}
        />
      </div>
    </>
  );
};

// ============================================
// REUSABLE COMPONENTS
// ============================================

// Score Display Component
const ScorePanel = ({ score, streak, totalQuestions, currentQuestion }) => {
  const { tone } = useUI();
  const s = UI_STRINGS[tone === 'eg' ? 'eg' : 'en'];

  const streakClass = streak >= 10
    ? 'game-hud__streak game-hud__streak--fire'
    : streak >= 5
    ? 'game-hud__streak game-hud__streak--hot'
    : 'game-hud__streak';

  return (
    <div className="game-hud">
      <div className="game-hud__item game-hud__score">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#a78bfa" style={{ flexShrink: 0 }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        {React.createElement(ScoreCounter, { value: score, style: { color: '#c4b5fd', fontWeight: 700, fontSize: 15 } })}
      </div>
      {streak > 0 && (
        <div className={`game-hud__item ${streakClass}`}>
          🔥&nbsp;
          {React.createElement(ScoreCounter, { value: streak, style: { fontWeight: 700, fontSize: 15 } })}
        </div>
      )}
      {totalQuestions > 0 && (
        <div className="game-hud__item" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          {currentQuestion}/{totalQuestions}
        </div>
      )}
    </div>
  );
};

const RED_RANKS = [
  { minScore: 0, en: 'Rookie', eg: 'مبتدئ', accent: '#94a3b8' },
  { minScore: 120, en: 'Operator', eg: 'أوبريتور', accent: '#f093fb' },
  { minScore: 300, en: 'Closer', eg: 'كلوزر', accent: '#ffb020' },
  { minScore: 650, en: 'Strategist', eg: 'استراتيجي', accent: '#764ba2' },
  { minScore: 1100, en: 'Captain', eg: 'كابتن', accent: '#50fa7b' },
  { minScore: 1700, en: 'Legend', eg: 'أسطورة', accent: '#667eea' }
];

const getRedRank = (score) => {
  const normalizedScore = Number.isFinite(score) ? score : 0;
  return [...RED_RANKS].reverse().find(rank => normalizedScore >= rank.minScore) || RED_RANKS[0];
};

const getNextRedRank = (score) => {
  const normalizedScore = Number.isFinite(score) ? score : 0;
  return RED_RANKS.find(rank => rank.minScore > normalizedScore) || null;
};

const getHeatState = (streak) => {
  const normalizedStreak = Number.isFinite(streak) ? streak : 0;
  if (normalizedStreak >= 10) return { en: 'Overdrive', eg: 'أوفر درايف', accent: RM_THEME.red };
  if (normalizedStreak >= 6) return { en: 'Hot', eg: 'سخن', accent: RM_THEME.amber };
  if (normalizedStreak >= 3) return { en: 'Warm', eg: 'مُسخّن', accent: RM_THEME.green };
  return { en: 'Cold Start', eg: 'بداية باردة', accent: '#94a3b8' };
};

const ACTIVITY_UNLOCK_RULES = {
  facilitator: { minPlayedActivities: 2 },
  callflow: { minScore: 90, minPlayedActivities: 2 },
  qualifying: { minScore: 90, minPlayedActivities: 2 },
  debrief: { minScore: 120, minPlayedActivities: 3 },
  objection: { minScore: 150, minPlayedActivities: 4 },
  objectionduel: { minScore: 180, minPlayedActivities: 4 },
  triage: { minScore: 220, minPlayedActivities: 5 },
  form: { minScore: 220, minPlayedActivities: 5 },
  coldcall: { minScore: 320, minMasteredActivities: 4 },
  teambattle: { minScore: 180, minPlayedActivities: 6 },
  consensus: { minScore: 240, minPlayedActivities: 7 },
  exam: { minScore: 350, minMasteredActivities: 6, minPlayedActivities: 10 }
};

const formatUnlockText = (lang, rule) => {
  if (!rule) return '';
  const chunks = [];
  if (rule.minScore) chunks.push(lang === 'eg' ? `${rule.minScore}+ نقطة` : `${rule.minScore}+ score`);
  if (rule.minPlayedActivities) chunks.push(lang === 'eg' ? `${rule.minPlayedActivities}+ أنشطة متجربة` : `${rule.minPlayedActivities}+ activities played`);
  if (rule.minMasteredActivities) chunks.push(lang === 'eg' ? `${rule.minMasteredActivities}+ أنشطة متقنة` : `${rule.minMasteredActivities}+ mastered activities`);
  return chunks.join(lang === 'eg' ? ' • ' : ' • ');
};

const getActivityUnlockState = (activityId, academyStats, globalScore, lang) => {
  const rule = ACTIVITY_UNLOCK_RULES[activityId];
  if (!rule) {
    return { unlocked: true, requirementText: '', completionRatio: 1 };
  }

  const scoreRatio = rule.minScore ? Math.min(1, globalScore / rule.minScore) : 1;
  const playedRatio = rule.minPlayedActivities ? Math.min(1, (academyStats.playedActivities || 0) / rule.minPlayedActivities) : 1;
  const masteredRatio = rule.minMasteredActivities ? Math.min(1, (academyStats.masteredActivities || 0) / rule.minMasteredActivities) : 1;
  const unlocked =
    globalScore >= (rule.minScore || 0) &&
    (academyStats.playedActivities || 0) >= (rule.minPlayedActivities || 0) &&
    (academyStats.masteredActivities || 0) >= (rule.minMasteredActivities || 0);

  return {
    unlocked,
    requirementText: formatUnlockText(lang, rule),
    completionRatio: Math.round(((scoreRatio + playedRatio + masteredRatio) / 3) * 100)
  };
};

const RunStatusBar = ({ lang, globalScore, globalStreak, academyStats, currentActivity, recommendedActivity }) => {
  const rank = getRedRank(globalScore);
  const nextRank = getNextRedRank(globalScore);
  const heat = getHeatState(globalStreak);
  const progressToNextRank = nextRank
    ? Math.max(0, Math.min(100, Math.round(((globalScore - rank.minScore) / Math.max(1, nextRank.minScore - rank.minScore)) * 100)))
    : 100;

  return (
    <div style={{
      marginBottom: 20,
      padding: '18px 20px',
      borderRadius: 20,
      border: `1px solid ${RM_THEME.border}`,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
      boxShadow: '0 18px 50px rgba(0,0,0,0.25)'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1.35fr) repeat(auto-fit, minmax(150px, 0.85fr))', gap: 12, alignItems: 'stretch' }}>
        <div style={{
          padding: 16,
          borderRadius: 16,
          border: `1px solid ${RM_THEME.border}`,
          background: `linear-gradient(135deg, ${rank.accent}22, rgba(255,255,255,0.04))`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ ...styles.badge, ...styles.badgeBlue }}>{lang === 'eg' ? 'رتبة Xcelias' : 'Xcelias Rank'}</span>
            <span style={{ color: rank.accent, fontWeight: 900, fontSize: 13 }}>{lang === 'eg' ? rank.eg : rank.en}</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>
            {currentActivity
              ? (lang === 'eg' ? `دلوقتي: ${currentActivity.name}` : `Now Playing: ${currentActivity.name}`)
              : (lang === 'eg' ? 'غرفة تشغيل Xcelias' : 'Xcelias Command Run')}
          </div>
          <div style={{ color: RM_THEME.muted, lineHeight: 1.55, fontSize: 14, marginBottom: 10 }}>
            {currentActivity
              ? (lang === 'eg'
                ? 'حافظ على الستريك عشان تزود حرارة الجولة وترفع الرتبة أسرع.'
                : 'Keep the streak alive to build heat and climb the rank ladder faster.')
              : (lang === 'eg'
                ? `النشاط الموصّى به دلوقتي: ${recommendedActivity?.name || 'ابدأ أي نشاط لبناء المومنتام'}.`
                : `Recommended next move: ${recommendedActivity?.name || 'start any activity to build momentum'}.`)}
          </div>
          <div style={{ ...styles.progressBar, marginBottom: 8 }}>
            <div style={{ ...styles.progressFill, width: `${progressToNextRank}%`, background: `linear-gradient(90deg, ${rank.accent}, rgba(255,255,255,0.7))` }} />
          </div>
          <div style={{ color: RM_THEME.faint, fontSize: 12 }}>
            {nextRank
              ? (lang === 'eg'
                ? `فاضل ${Math.max(0, nextRank.minScore - globalScore)} نقطة عشان توصل ${nextRank.eg}`
                : `${Math.max(0, nextRank.minScore - globalScore)} points to ${nextRank.en}`)
              : (lang === 'eg' ? 'أعلى رتبة مفتوحة' : 'Top rank unlocked')}
          </div>
        </div>

        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{lang === 'eg' ? 'الهيت' : 'Heat'}</span>
          <span style={{ ...styles.scoreValue, color: heat.accent, fontSize: 24 }}>{lang === 'eg' ? heat.eg : heat.en}</span>
          <span style={{ color: RM_THEME.faint, fontSize: 12, marginTop: 4 }}>{lang === 'eg' ? `${globalStreak} ستريك` : `${globalStreak} streak`}</span>
        </div>

        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{lang === 'eg' ? 'المتقن' : 'Mastered'}</span>
          <span style={styles.scoreValue}>{academyStats.masteredActivities}</span>
          <span style={{ color: RM_THEME.faint, fontSize: 12, marginTop: 4 }}>{lang === 'eg' ? `من ${academyStats.playedActivities} متجرب` : `${academyStats.playedActivities} played`}</span>
        </div>

        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{lang === 'eg' ? 'ضغط المراجعة' : 'Review Pressure'}</span>
          <span style={{ ...styles.scoreValue, color: academyStats.reviewCount > 0 ? RM_THEME.red : RM_THEME.green }}>{academyStats.reviewCount}</span>
          <span style={{ color: RM_THEME.faint, fontSize: 12, marginTop: 4 }}>{lang === 'eg' ? 'مسارات محتاجة رجوع' : 'lanes need attention'}</span>
        </div>
      </div>
    </div>
  );
};

const PromotionBanner = ({ lang, promotionNotice, onClose }) => {
  if (!promotionNotice) return null;

  const { rank, nextRank } = promotionNotice;

  return (
    <div style={{
      marginBottom: 20,
      padding: '18px 20px',
      borderRadius: 20,
      border: `1px solid ${RM_THEME.border}`,
      background: `linear-gradient(135deg, ${rank.accent}22, rgba(255,255,255,0.05))`,
      boxShadow: '0 18px 50px rgba(0,0,0,0.28)'
    }} className="animate-bounceIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ ...styles.badge, ...styles.badgeRed }}>{lang === 'eg' ? 'ترقية جديدة' : 'Promotion Unlocked'}</span>
            <span style={{ color: rank.accent, fontWeight: 900 }}>{lang === 'eg' ? rank.eg : rank.en}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
            {lang === 'eg' ? `دخلت رتبة ${rank.eg}` : `You reached ${rank.en}`}
          </div>
          <div style={{ color: RM_THEME.muted, lineHeight: 1.55 }}>
            {nextRank
              ? (lang === 'eg'
                ? `كمّل ضغطك عشان توصل ${nextRank.eg} بعديها.`
                : `Keep the pressure on and push toward ${nextRank.en} next.`)
              : (lang === 'eg' ? 'أعلى رتبة في Xcelias اتفتحت.' : 'You have unlocked the top Xcelias rank.')}
          </div>
        </div>
        <button onClick={onClose} style={styles.secondaryBtn}>{lang === 'eg' ? 'إقفال' : 'Dismiss'}</button>
      </div>
    </div>
  );
};

const UnlockRevealBanner = ({ lang, unlockNotice, onClose, onLaunch }) => {
  if (!unlockNotice) return null;

  return (
    <div style={{
      marginBottom: 20,
      padding: '18px 20px',
      borderRadius: 20,
      border: `1px solid ${RM_THEME.border}`,
      background: 'linear-gradient(135deg, rgba(0,212,255,0.14), rgba(255,59,59,0.10))',
      boxShadow: '0 18px 50px rgba(0,0,0,0.28)'
    }} className="animate-bounceIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ ...styles.badge, ...styles.badgeBlue }}>{lang === 'eg' ? 'مود جديد' : 'New Mode Unlocked'}</span>
            <span style={{ ...styles.badge, ...styles.badgeGreen }}>{unlockNotice.modeLabel}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{unlockNotice.name}</div>
          <div style={{ color: RM_THEME.muted, lineHeight: 1.55 }}>{unlockNotice.requirementText}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onLaunch} style={styles.primaryBtn}>{lang === 'eg' ? 'افتحه' : 'Launch It'}</button>
          <button onClick={onClose} style={styles.secondaryBtn}>{lang === 'eg' ? 'لاحقًا' : 'Later'}</button>
        </div>
      </div>
    </div>
  );
};

const MissionRewardBanner = ({ lang, rewardNotice, onClose }) => {
  if (!rewardNotice) return null;

  return (
    <div style={{
      marginBottom: 20,
      padding: '18px 20px',
      borderRadius: 20,
      border: `1px solid ${RM_THEME.border}`,
      background: 'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(255,176,32,0.12))',
      boxShadow: '0 18px 50px rgba(0,0,0,0.28)'
    }} className="animate-bounceIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ ...styles.badge, ...styles.badgeGreen }}>{lang === 'eg' ? 'مكافأة Xcelias Ops' : 'Xcelias Ops Reward'}</span>
            <span style={{ color: RM_THEME.amber, fontWeight: 900 }}>+{rewardNotice.points}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{rewardNotice.title}</div>
          <div style={{ color: RM_THEME.muted, lineHeight: 1.55 }}>{lang === 'eg' ? `أضفنا ${rewardNotice.points} نقطة للران الحالي.` : `${rewardNotice.points} points were added to your run.`}</div>
        </div>
        <button onClick={onClose} style={styles.secondaryBtn}>{lang === 'eg' ? 'تمام' : 'Nice'}</button>
      </div>
    </div>
  );
};

// ============================================
// GAME SYSTEM: Floating Score + Viewport Flash
// ============================================

// Spawn a floating "+10" or "-0" score that drifts upward
const spawnFloatScore = (points, isCorrect, streak) => {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.createElement('div');
  el.className = `float-score ${isCorrect ? 'float-score--positive' : 'float-score--negative'}`;
  const label = isCorrect
    ? `+${points}${streak >= 3 ? ` 🔥×${streak}` : ''}`
    : '✕';
  el.textContent = label;
  el.style.left = (35 + Math.random() * 30) + '%';
  el.style.top = '60%';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
};

// Flash the entire viewport green (correct) or red (incorrect)
const spawnViewportFlash = (isCorrect) => {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.createElement('div');
  el.className = `viewport-flash ${isCorrect ? 'viewport-flash--correct' : 'viewport-flash--incorrect'}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
};

// ============================================
// Feedback Component — Game-quality redesign
// ============================================
const Feedback = ({ isCorrect, message, explanation }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const s = UI_STRINGS[lang];

  const coachLine = useMemo(() => {
    if (lang !== 'eg') return null;
    return getRandomItem(isCorrect ? EG_COACH_LINES.good : EG_COACH_LINES.bad);
  }, [lang, isCorrect]);

  return (
    <div className={`game-feedback ${isCorrect ? 'game-feedback--correct' : 'game-feedback--incorrect'}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div className="fb-icon">{isCorrect ? '✓' : '✕'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '19px', color: isCorrect ? '#34d399' : '#f87171' }}>
              {isCorrect ? s.correct : s.incorrect}
            </strong>
            {coachLine && (
              <span style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.7)',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.08)',
                border: `1px solid ${RM_THEME.border}`
              }}>{coachLine}</span>
            )}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', fontSize: '15px', margin: 0 }}>
            {toneifyText(lang, explanation, 'explain')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Progress Bar Component — Game-quality redesign
// ============================================
const ProgressBar = ({ current, total }) => {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  // Build step dots for small totals (≤ 12 steps)
  const showSteps = total > 0 && total <= 12;
  return (
    <div className="game-progress" style={{ marginBottom: 20 }}>
      <div className="game-progress__fill" style={{ width: `${pct}%` }} />
      {showSteps && Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`game-progress__step${i < current - 1 ? ' game-progress__step--done' : i === current - 1 ? ' game-progress__step--current' : ''}`}
          style={{ left: `${((i + 1) / (total + 1)) * 100}%` }}
        />
      ))}
    </div>
  );
};

// ============================================
// Timer Component
// ============================================
const Timer = ({ seconds, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const onTimeUpRef = React.useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUpRef.current();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);
  
  const danger = timeLeft <= 5;
  return (
    <div style={{
      ...styles.timer,
      color: danger ? '#ef4444' : timeLeft <= 10 ? '#f97316' : '#667eea',
      transform: danger ? 'scale(1.1)' : 'scale(1)',
      transition: 'color 0.3s ease, transform 0.2s ease'
    }}>
      {timeLeft}s
    </div>
  );
};

// ============================================
// Back Button Component — Game quality
// ============================================
const BackButton = ({ onClick }) => {
  const { tone } = useUI();
  const s = UI_STRINGS[tone === 'eg' ? 'eg' : 'en'];
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.secondaryBtn,
        marginBottom: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px',
        fontSize: 14
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
      </svg>
      {s.back}
    </button>
  );
};

// ============================================
// Next Button Component — Game quality
// ============================================
const NextButton = ({ onClick, label }) => {
  const { tone } = useUI();
  const s = UI_STRINGS[tone === 'eg' ? 'eg' : 'en'];
  return (
    <button onClick={onClick} className="game-next-btn">
      {label || s.nextQuestion}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
      </svg>
    </button>
  );
};

const SettingsModal = ({ open, onClose }) => {
  const {
    tone,
    setTone,
    fxIntensity,
    setFxIntensity,
    reduceMotion,
    setReduceMotion,
    backgroundEnabled,
    setBackgroundEnabled,
    projectorMode,
    setProjectorMode
  } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const s = UI_STRINGS[lang];

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(8,8,18,0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 'min(740px, 96vw)',
          borderRadius: 20,
          border: `1px solid ${RM_THEME.border}`,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05))',
          boxShadow: '0 30px 120px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${RM_THEME.border}`
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${RM_THEME.cyan}, ${RM_THEME.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
              ⚙
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{s.settings}</div>
              <div style={{ color: RM_THEME.muted, fontSize: 13 }}>
                Make it more alive • Classroom-ready • Agent tone
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ ...styles.secondaryBtn, padding: '10px 14px' }}>✕</button>
        </div>

        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${RM_THEME.border}`, background: 'rgba(0,0,0,0.35)' }}>
            <div style={{ fontSize: 12, color: RM_THEME.faint, textTransform: 'uppercase', letterSpacing: '0.10em' }}>{s.toneLabel}</div>
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <button
                onClick={() => setTone('en')}
                style={{
                  ...styles.optionBtn,
                  marginBottom: 0,
                  padding: 14,
                  borderRadius: 14,
                  ...(tone === 'en' ? { borderColor: RM_THEME.cyan, background: 'rgba(0,212,255,0.10)' } : {})
                }}
              >
                {s.toneEn}
              </button>
              <button
                onClick={() => setTone('eg')}
                style={{
                  ...styles.optionBtn,
                  marginBottom: 0,
                  padding: 14,
                  borderRadius: 14,
                  ...(tone === 'eg' ? { borderColor: RM_THEME.cyan, background: 'rgba(0,212,255,0.10)' } : {})
                }}
              >
                {s.toneEg}
              </button>
              <div style={{ color: RM_THEME.muted, fontSize: 13, lineHeight: 1.6 }}>
                {tone === 'eg'
                  ? 'هنخلي الكلام مترجم ومكتوب بستايل سيلز مصري (بنفس معنى محتوى التدريب).'
                  : 'Keeps the training content intact, only changes the UI voice.'}
              </div>
            </div>
          </div>

          <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${RM_THEME.border}`, background: 'rgba(0,0,0,0.35)' }}>
            <div style={{ fontSize: 12, color: RM_THEME.faint, textTransform: 'uppercase', letterSpacing: '0.10em' }}>{s.fxLabel}</div>
            <div style={{ marginTop: 12 }}>
              <input
                type="range"
                min={0.6}
                max={2.2}
                step={0.05}
                value={fxIntensity}
                onChange={(e) => setFxIntensity(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: RM_THEME.muted, fontSize: 13, marginTop: 10 }}>
                <span>Chill</span>
                <strong style={{ color: RM_THEME.text }}>{fxIntensity.toFixed(2)}x</strong>
                <span>Insane</span>
              </div>

              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ color: RM_THEME.muted, fontSize: 13 }}>{s.fxToggle}</div>
                <button
                  onClick={() => setBackgroundEnabled(!backgroundEnabled)}
                  style={{
                    ...styles.secondaryBtn,
                    padding: '10px 12px',
                    borderRadius: 12,
                    borderColor: backgroundEnabled ? 'rgba(0,212,255,0.55)' : RM_THEME.border,
                    background: backgroundEnabled ? 'rgba(0,212,255,0.10)' : 'rgba(255,255,255,0.06)'
                  }}
                >
                  {backgroundEnabled ? s.on : s.off}
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${RM_THEME.border}`, background: 'rgba(0,0,0,0.35)' }}>
            <div style={{ fontSize: 12, color: RM_THEME.faint, textTransform: 'uppercase', letterSpacing: '0.10em' }}>{s.motionLabel}</div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => setReduceMotion(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <div style={{ color: RM_THEME.muted, fontSize: 13, lineHeight: 1.6 }}>
                {tone === 'eg'
                  ? 'لو الجهاز تقيل أو عايز حركة أقل.'
                  : 'Use this on slower machines or for accessibility.'}
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${RM_THEME.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ color: RM_THEME.text, fontSize: 13, fontWeight: 800 }}>{s.projectorLabel}</div>
                <div style={{ color: RM_THEME.muted, fontSize: 12, marginTop: 4 }}>{s.projectorHint}</div>
              </div>
              <button
                onClick={() => setProjectorMode(!projectorMode)}
                style={{
                  ...styles.secondaryBtn,
                  padding: '10px 12px',
                  borderRadius: 12,
                  borderColor: projectorMode ? 'rgba(0,212,255,0.55)' : RM_THEME.border,
                  background: projectorMode ? 'rgba(0,212,255,0.10)' : 'rgba(255,255,255,0.06)'
                }}
              >
                {projectorMode ? s.enabled : s.disabled}
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: 18, borderTop: `1px solid ${RM_THEME.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onClose} style={styles.primaryBtn}>{s.done}</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ACTIVITY MODULES - PHASE 2 (1-12)
// ============================================

// Activity 1: Rapid Fire MCQ
const RapidFireMCQ = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const s = UI_STRINGS[lang];

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = () => {
    const TD = getTrainingData(lang);
    const allQuestions = [];
    
    // From finishing types
    TD.finishingTypes.types.forEach(type => {
      const wrongAnswers = TD.finishingTypes.types
        .filter(t => t.name !== type.name)
        .map(t => t.name);
      const extraWrong = lang === 'eg'
        ? ['تشطيب سوبر لوكس', 'تشطيب اقتصادي', 'هيكل فاخر']
        : ["Premium Shell", "Basic Finished", "Luxury Core"];
      allQuestions.push({
        question: lang === 'eg'
          ? `أنهي نوع تشطيب بيتوصف كده: "${type.description}"؟`
          : `What finishing type is described as: "${type.description}"?`,
        correct: type.name,
        options: shuffleArray([type.name, ...getRandomItems([...wrongAnswers, ...extraWrong], 3)]),
        explanation: lang === 'eg'
          ? `${type.name}: ${type.description}`
          : `${type.name}: ${type.description}`
      });
    });

    // From terminology
    TD.terminology.terms.forEach(term => {
      const wrongAnswers = lang === 'eg'
        ? ['جاهز للبناء', 'عائد على التسويق', 'مخطط خارجي', 'دايمًا اتصل', 'مساحة تحتية']
        : ["Ready To Build", "Return On Marketing", "Off-site Plan", "Always Be Calling", "Built Under Area"];
      allQuestions.push({
        question: lang === 'eg'
          ? `يعني إيه "${term.term}"؟`
          : `What does "${term.term}" stand for?`,
        correct: term.fullForm,
        options: shuffleArray([term.fullForm, ...getRandomItems(wrongAnswers, 3)]),
        explanation: lang === 'eg'
          ? `${term.term}: ${term.fullForm} — ${term.description}`
          : `${term.term} stands for "${term.fullForm}" - ${term.description}`
      });
    });

    // From unit types
    const allUnits = [...TD.propertyTypes.residential.apartments, ...TD.propertyTypes.residential.villas];
    allUnits.forEach(unit => {
      const wrongAnswers = allUnits.filter(u => u.name !== unit.name).map(u => u.name);
      allQuestions.push({
        question: lang === 'eg'
          ? `أنهي نوع وحدة مناسب للوصف ده: "${unit.description}"؟`
          : `Which unit type matches this description: "${unit.description}"?`,
        correct: unit.name,
        options: shuffleArray([unit.name, ...getRandomItems(wrongAnswers, 3)]),
        explanation: lang === 'eg'
          ? `وحدة ${unit.name}: ${unit.description}`
          : `A ${unit.name} is: ${unit.description}`
      });
    });

    setQuestions(shuffleArray(allQuestions).slice(0, 10));
  };

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].correct) {
      setLocalScore(prev => prev + 10);
      setStreak(prev => prev + 1);
      updateScore(10, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <span style={{ ...styles.badge, ...styles.badgeRed }}>{s.activityNames.rapidfire}</span>
        </div>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>
      
      <ProgressBar current={currentQ + 1} total={questions.length} />
      
      <h2 style={styles.questionText}>{toneifyText(lang, q.question, 'question')}</h2>
      
      <div className="game-options-grid">
        {q.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option)}
            className={optionClass(idx, selected, q.correct, showFeedback, option)}
          >
            <span className="opt-letter">{optionLetter(lang, idx)}</span>
            {toneifyTermLabel(lang, option)}
          </button>
        ))}
      </div>

      {showFeedback && (
        <>
          <Feedback 
            isCorrect={selected === q.correct} 
            explanation={q.explanation}
          />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>{lang === 'eg' ? '🎉 خلّصت النشاط!' : '🎉 Activity Complete!'}</h3>
              <p>{lang === 'eg' ? 'النتيجة النهائية:' : 'Final Score:'} {localScore} / {questions.length * 10}</p>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{s.back}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 2: True/False Speed Run
const TrueFalseSpeedRun = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const s = UI_STRINGS[lang];

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const tfQuestions = [
      { statement: "Most resales are Off-plan.", answer: false, explanation: "Most resales are RTM (Ready To Move), not Off-plan. Off-plan properties are typically primary sales from developers." },
      { statement: "Most primary properties are Off-plan.", answer: true, explanation: "Correct! Most primary properties are Off-plan, meaning they are sold before construction is complete." },
      { statement: "Brokers have more walk out than developers.", answer: false, explanation: "Developers have more walk out. Brokers have less walk out because they offer consultancy and diverse projects." },
      { statement: "A Duplex has two floors connected by an internal staircase.", answer: true, explanation: "Correct! A Duplex is a unit with two floors connected by an internal staircase." },
      { statement: "You should have more than 7 points of interest on your body.", answer: false, explanation: "You shouldn't have more than 7 points of interest. More than seven points could be too overwhelming for the eyes." },
      { statement: "It takes 21 good experiences to make up for a bad first impression.", answer: true, explanation: "Correct! Studies show it can take 21 repeated good experiences to make up for a bad first impression." },
      { statement: "Words account for 55% of communication retention.", answer: false, explanation: "Words account for only 7%. Body Language accounts for 55% of communication retention." },
      { statement: "Tonality accounts for 38% of communication retention.", answer: true, explanation: "Correct! Tonality accounts for 38% of how communication is retained." },
      { statement: "A.B.C stands for Always Be Closing.", answer: false, explanation: "A.B.C stands for Acknowledgment, Benefits, Commitment - a technique for qualifying clients during calls." },
      { statement: "Core & Shell means the property is fully furnished.", answer: false, explanation: "Core & Shell is the most basic finishing - only the structure with no internal finishing, bare walls and floors." },
      { statement: "Brokers work on diverse projects.", answer: true, explanation: "Correct! Brokers work on diverse projects while developers work only on their own projects." },
      { statement: "Resale properties are typically bought with installments.", answer: false, explanation: "Resale properties typically require cash payment. Primary/developer properties offer installment options." },
      { statement: "A Penthouse is located on the ground floor.", answer: false, explanation: "A Penthouse is a luxury apartment on the TOP floor with premium views and amenities." },
      { statement: "Building rapport means changing yourself completely.", answer: false, explanation: "It's not about changing yourself, it's about ADAPTING yourself & your style to be like the other person." },
      { statement: "Needs are tangible requirements that clients ask for.", answer: true, explanation: "Correct! Needs are everything that clients say or ask for - tangible, specific, measurable requirements." }
    ];
    setQuestions(shuffleArray(tfQuestions).slice(0, 10));
  }, []);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].answer) {
      setLocalScore(prev => prev + 10);
      setStreak(prev => prev + 1);
      updateScore(10, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>{s.activityNames.truefalse}</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>
      
      <ProgressBar current={currentQ + 1} total={questions.length} />
      
      <h2 style={styles.questionText}>{toneifyText(lang, q.statement, 'question')}</h2>
      
      <div style={styles.grid2}>
        <button
          onClick={() => handleAnswer(true)}
          className={tfClass(true, selected, q.answer, showFeedback)}
          style={{ padding: '36px 20px', textAlign: 'center', fontSize: '22px', fontWeight: 800 }}
        >
          {lang === 'eg' ? '✓ صح' : '✓ TRUE'}
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className={tfClass(false, selected, q.answer, showFeedback)}
          style={{ padding: '36px 20px', textAlign: 'center', fontSize: '22px', fontWeight: 800 }}
        >
          {lang === 'eg' ? '✗ غلط' : '✗ FALSE'}
        </button>
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected === q.answer} explanation={q.explanation} />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>{lang === 'eg' ? '🎉 خلّصت النشاط!' : '🎉 Activity Complete!'} {lang === 'eg' ? 'السكور:' : 'Score:'} {localScore}/{questions.length * 10}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{s.back}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 3: Definition Matching (Drag & Drop simulation with clicks)
const DefinitionMatching = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const s = UI_STRINGS[lang];
  const TD = getTrainingData(lang);

  const [items, setItems] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [matches, setMatches] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    const allItems = [
      ...TD.propertyTypes.residential.apartments.map(u => ({ term: u.name, definition: u.description })),
      ...TD.finishingTypes.types.map(f => ({ term: f.name, definition: f.description }))
    ];
    setItems(shuffleArray(allItems).slice(0, 6));
  }, [lang]);

  const handleTermClick = (term) => {
    if (showResults) return;
    setSelectedTerm(term);
  };

  const handleDefinitionClick = (definition) => {
    if (showResults || !selectedTerm) return;
    setMatches(prev => ({ ...prev, [selectedTerm]: definition }));
    setSelectedTerm(null);
  };

  const checkAnswers = () => {
    let correct = 0;
    items.forEach(item => {
      if (matches[item.term] === item.definition) correct++;
    });
    setLocalScore(correct * 15);
    updateScore(correct * 15, correct === items.length);
    setShowResults(true);
  };

  const resetGame = () => {
    setMatches({});
    setSelectedTerm(null);
    setShowResults(false);
    setLocalScore(0);
    const allItems = [
      ...TD.propertyTypes.residential.apartments.map(u => ({ term: u.name, definition: u.description })),
      ...TD.finishingTypes.types.map(f => ({ term: f.name, definition: f.description }))
    ];
    setItems(shuffleArray(allItems).slice(0, 6));
  };

  const shuffledDefinitions = useMemo(() => shuffleArray(items.map(i => i.definition)), [items]);

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeBlue }}>{s.activityNames.matching}</span>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{lang === 'eg' ? 'اتطابق' : 'Matched'}</span>
          <span style={styles.scoreValue}>{Object.keys(matches).length}/{items.length}</span>
        </div>
      </div>

      <p style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.7)' }}>
        {lang === 'eg' ? 'اختار المصطلح… وبعدها اختار التعريف الصح.' : 'Click a term, then click its matching definition'}
      </p>

      <div style={styles.grid2}>
        <div>
          <h4 style={{ marginBottom: '15px', color: '#667eea' }}>{lang === 'eg' ? 'مصطلحات' : 'Terms'}</h4>
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleTermClick(item.term)}
              disabled={matches[item.term]}
              className={`game-option game-option--${['purple','blue','cyan','teal'][idx % 4]}${showResults && matches[item.term] === item.definition ? ' game-option--correct' : ''}${showResults && matches[item.term] && matches[item.term] !== item.definition ? ' game-option--incorrect' : ''}${selectedTerm === item.term ? ' game-option--selected' : ''}`}
              style={{ opacity: matches[item.term] ? 0.5 : 1 }}
            >
              {item.term}
            </button>
          ))}
        </div>
        <div>
          <h4 style={{ marginBottom: '15px', color: '#4299e1' }}>{lang === 'eg' ? 'تعريفات' : 'Definitions'}</h4>
          {shuffledDefinitions.map((def, idx) => (
            <button
              key={idx}
              onClick={() => handleDefinitionClick(def)}
              disabled={Object.values(matches).includes(def)}
              className={`game-option game-option--${['blue','purple','cyan','teal'][idx % 4]}`}
              style={{ opacity: Object.values(matches).includes(def) ? 0.5 : 1, fontSize: '14px' }}
            >
              {def}
            </button>
          ))}
        </div>
      </div>

      {!showResults && Object.keys(matches).length === items.length && (
        <button onClick={checkAnswers} style={{ ...styles.primaryBtn, marginTop: '20px' }}>
          {lang === 'eg' ? 'راجع الإجابات ✓' : 'Check Answers ✓'}
        </button>
      )}

      {showResults && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>
            {lang === 'eg' ? 'النتيجة:' : 'Score:'} {localScore}/{items.length * 15} ({Math.round((localScore / (items.length * 15)) * 100)}%)
          </h3>
          <button onClick={resetGame} style={{ ...styles.primaryBtn, marginRight: '10px' }}>{lang === 'eg' ? 'جرّب تاني' : 'Try Again'}</button>
          <button onClick={onBack} style={styles.secondaryBtn}>{s.back}</button>
        </div>
      )}
    </div>
  );
};

// Activity 4: The Odd One Out
const OddOneOut = ({ onBack, updateScore }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const oddQuestions = [
      {
        category: "Finishing Types",
        items: ["Core & Shell", "Semi Finished", "Fully Finished"],
        oddOne: "Twin House",
        explanation: "Twin House is a villa type, not a finishing type."
      },
      {
        category: "Residential Apartments",
        items: ["Apartment", "Duplex", "Penthouse"],
        oddOne: "Admin",
        explanation: "Admin is a commercial property type, not a residential apartment."
      },
      {
        category: "Villa Types",
        items: ["Stand Alone", "Town House", "Twin House"],
        oddOne: "Service Apartment",
        explanation: "Service Apartment is an apartment type, not a villa type."
      },
      {
        category: "Commercial Properties",
        items: ["Shops", "Show Room", "Admin"],
        oddOne: "Penthouse",
        explanation: "Penthouse is a residential property, not commercial."
      },
      {
        category: "Agent Skills",
        items: ["Confidence", "Negotiation skills", "Strong communication skills"],
        oddOne: "Cash payment",
        explanation: "Cash payment is a payment method, not an agent skill."
      },
      {
        category: "Call Mistakes to Avoid",
        items: ["Stop when you should proceed", "Talking like robots", "Unclear benefits"],
        oddOne: "Mirror the same tone",
        explanation: "Mirroring tone is a GOOD technique for building rapport, not a mistake."
      },
      {
        category: "Broker Characteristics",
        items: ["Less walk out", "More market awareness", "Working on diverse projects"],
        oddOne: "Working on their projects",
        explanation: "Working on their own projects is a Developer characteristic, not Broker."
      },
      {
        category: "Primary Sale Characteristics",
        items: ["Buy from developer", "Installments available", "Off-plan"],
        oddOne: "Cash payment only",
        explanation: "Cash payment only is typical of Resale, not Primary sales."
      }
    ];

    const formattedQuestions = shuffleArray(oddQuestions).slice(0, 8).map(q => ({
      ...q,
      options: shuffleArray([...q.items, q.oddOne])
    }));

    setQuestions(formattedQuestions);
  }, []);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].oddOne) {
      setLocalScore(prev => prev + 15);
      setStreak(prev => prev + 1);
      updateScore(15, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>Loading...</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>Odd One Out</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <h2 style={styles.questionText}>
        Find the ODD ONE OUT from the category: <span style={{ color: '#667eea' }}>{q.category}</span>
      </h2>

      <div style={styles.grid2}>
        {q.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option)}
            className={optionClass(idx, selected, q.oddOne, showFeedback, option)} style={{padding: '25px',
              textAlign: 'center',}}
          >
            {option}
          </button>
        ))}
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected === q.oddOne} explanation={q.explanation} />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 Activity Complete! Score: {localScore}/{questions.length * 15}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 5: Fill in the Blanks
const FillInBlanks = ({ onBack, updateScore }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const blankQuestions = [
      {
        sentence: "_____ are everything that clients say or ask for - tangible requirements.",
        answer: "Needs",
        options: ["Needs", "Wants", "Motives", "Benefits"]
      },
      {
        sentence: "_____ are the reasons behind client requests - can be emotional or rational.",
        answer: "Wants",
        options: ["Wants", "Needs", "Skills", "Features"]
      },
      {
        sentence: "The A.B.C technique stands for Acknowledgment, _____, Commitment.",
        answer: "Benefits",
        options: ["Benefits", "Business", "Building", "Buying"]
      },
      {
        sentence: "You shouldn't have more than _____ points of interest on your body.",
        answer: "7",
        options: ["7", "5", "10", "3"]
      },
      {
        sentence: "It takes _____ repeated good experiences to make up for a bad first impression.",
        answer: "21",
        options: ["21", "10", "15", "30"]
      },
      {
        sentence: "Body Language accounts for _____% of how communication is retained.",
        answer: "55",
        options: ["55", "38", "7", "45"]
      },
      {
        sentence: "Tonality accounts for _____% of communication retention.",
        answer: "38",
        options: ["38", "55", "7", "25"]
      },
      {
        sentence: "Words account for only _____% of communication retention.",
        answer: "7",
        options: ["7", "38", "55", "15"]
      },
      {
        sentence: "RTM stands for Ready To _____.",
        answer: "Move",
        options: ["Move", "Market", "Manage", "Meet"]
      },
      {
        sentence: "_____ properties are typically bought with cash payment from clients.",
        answer: "Resale",
        options: ["Resale", "Primary", "Off-plan", "Commercial"]
      }
    ];

    setQuestions(shuffleArray(blankQuestions).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    })));
  }, []);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].answer) {
      setLocalScore(prev => prev + 10);
      setStreak(prev => prev + 1);
      updateScore(10, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>Loading...</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeBlue }}>Fill in the Blanks</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <h2 style={styles.questionText}>{q.sentence}</h2>

      <div style={styles.grid2}>
        {q.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option)}
            className={optionClass(idx, selected, q.answer, showFeedback, option)} style={{textAlign: 'center',}}
          >
            {option}
          </button>
        ))}
      </div>

      {showFeedback && (
        <>
          <Feedback 
            isCorrect={selected === q.answer} 
            explanation={`The correct answer is "${q.answer}". Complete sentence: ${q.sentence.replace('_____', q.answer)}`}
          />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 Activity Complete! Score: {localScore}/{questions.length * 10}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 6: Acronym Decoder
const AcronymDecoder = ({ onBack, updateScore }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const acronymQuestions = [
      { acronym: "RTM", answer: "Ready To Move", options: ["Ready To Move", "Return To Market", "Real Time Management", "Ready To Manage"] },
      { acronym: "A.B.C", answer: "Acknowledgment, Benefits, Commitment", options: ["Acknowledgment, Benefits, Commitment", "Always Be Closing", "Attractive Building Complex", "Active Buyer Connection"] },
      { acronym: "BUA", answer: "Built Up Area", options: ["Built Up Area", "Building Usage Area", "Buyer Unit Assessment", "Basic Unit Allocation"] },
      { acronym: "SQM", answer: "Square Meter", options: ["Square Meter", "Standard Quality Measure", "Sales Quota Management", "Space Quality Metric"] },
      { acronym: "ROI", answer: "Return On Investment", options: ["Return On Investment", "Rate Of Interest", "Real Owner Index", "Revenue On Income"] }
    ];

    setQuestions(shuffleArray(acronymQuestions).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    })));
  }, []);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].answer) {
      setLocalScore(prev => prev + 20);
      setStreak(prev => prev + 1);
      updateScore(20, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>Loading...</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>Acronym Decoder</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <span style={{ fontSize: '64px', fontWeight: '800', color: '#667eea' }}>{q.acronym}</span>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>What does this acronym stand for?</p>
      </div>

      <div>
        {q.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option)}
            className={optionClass(idx, selected, q.answer, showFeedback, option)}
          >
            {option}
          </button>
        ))}
      </div>

      {showFeedback && (
        <>
          <Feedback 
            isCorrect={selected === q.answer} 
            explanation={`${q.acronym} stands for "${q.answer}"`}
          />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 Activity Complete! Score: {localScore}/{questions.length * 20}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 7: Hierarchy Sorter
const HierarchySorter = ({ onBack, updateScore }) => {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [userOrder, setUserOrder] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  const challenges = [
    {
      title: "Sort Finishing Types (Basic → Premium)",
      items: ["Core & Shell", "Semi Finished", "Fully Finished", "Fully Furnished"],
      correctOrder: ["Core & Shell", "Semi Finished", "Fully Finished", "Fully Furnished"],
      explanation: "Core & Shell is the most basic (just structure), then Semi Finished (basic finishing), Fully Finished (ready to move in), and Fully Furnished (includes furniture)."
    },
    {
      title: "Sort Communication Impact (Lowest → Highest)",
      items: ["Words", "Tonality", "Body Language"],
      correctOrder: ["Words", "Tonality", "Body Language"],
      explanation: "Words account for 7%, Tonality for 38%, and Body Language for 55% of communication retention."
    }
  ];

  useEffect(() => {
    setUserOrder(shuffleArray([...challenges[currentChallenge].items]));
  }, [currentChallenge]);

  const moveItem = (fromIdx, direction) => {
    if (showFeedback) return;
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= userOrder.length) return;
    
    const newOrder = [...userOrder];
    [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];
    setUserOrder(newOrder);
  };

  const checkAnswer = () => {
    const isCorrect = JSON.stringify(userOrder) === JSON.stringify(challenges[currentChallenge].correctOrder);
    if (isCorrect) {
      setLocalScore(prev => prev + 25);
      updateScore(25, true);
    } else {
      updateScore(0, false);
    }
    setShowFeedback(true);
  };

  const nextChallenge = () => {
    if (currentChallenge < challenges.length - 1) {
      setCurrentChallenge(prev => prev + 1);
      setShowFeedback(false);
    }
  };

  const challenge = challenges[currentChallenge];
  const isCorrect = JSON.stringify(userOrder) === JSON.stringify(challenge.correctOrder);

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>Hierarchy Sorter</span>
        <ScorePanel score={localScore} streak={0} totalQuestions={challenges.length} currentQuestion={currentChallenge + 1} />
      </div>

      <h2 style={styles.questionText}>{challenge.title}</h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>Use arrows to reorder the items</p>

      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {userOrder.map((item, idx) => (
          <div key={item} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px',
            padding: '15px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
            border: showFeedback 
              ? (challenge.correctOrder[idx] === item ? '2px solid #48bb78' : '2px solid #f56565')
              : '2px solid transparent'
          }}>
            <span style={{ fontSize: '18px', fontWeight: '600', minWidth: '30px' }}>{idx + 1}.</span>
            <span style={{ flex: 1 }}>{item}</span>
            {!showFeedback && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button 
                  onClick={() => moveItem(idx, 'up')} 
                  disabled={idx === 0}
                  style={{ ...styles.secondaryBtn, padding: '5px 10px', opacity: idx === 0 ? 0.3 : 1 }}
                >↑</button>
                <button 
                  onClick={() => moveItem(idx, 'down')} 
                  disabled={idx === userOrder.length - 1}
                  style={{ ...styles.secondaryBtn, padding: '5px 10px', opacity: idx === userOrder.length - 1 ? 0.3 : 1 }}
                >↓</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!showFeedback && (
        <button onClick={checkAnswer} style={{ ...styles.primaryBtn, marginTop: '20px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
          Check Order ✓
        </button>
      )}

      {showFeedback && (
        <>
          <Feedback isCorrect={isCorrect} explanation={challenge.explanation} />
          {currentChallenge < challenges.length - 1 ? (
            <NextButton onClick={nextChallenge} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 Activity Complete! Score: {localScore}/{challenges.length * 25}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 8: 7 Accessories Inspection
const AccessoriesInspection = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];
  const TD = getTrainingData(lang);

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const generateScenarios = () => {
      const allAccessories = TD.dressCode.accessories;
      const newScenarios = [];
      
      // Generate pass scenarios (7 or fewer)
      for (let i = 0; i < 4; i++) {
        const count = Math.floor(Math.random() * 4) + 4; // 4-7 accessories
        const items = getRandomItems(allAccessories, count);
        newScenarios.push({
          description: lang === 'eg'
            ? `الوكيل لابس: ${items.join('، ')}`
            : `Agent is wearing: ${items.join(', ')}`,
          accessories: items,
          count: count,
          shouldPass: true,
          explanation: lang === 'eg'
            ? `${count} نقطة لافتة مقبولين. القاعدة حدها الأقصى ٧ نقاط.`
            : `${count} points of interest is acceptable. The rule is maximum 7 points.`
        });
      }
      
      // Generate fail scenarios (more than 7)
      for (let i = 0; i < 4; i++) {
        const count = Math.floor(Math.random() * 4) + 8; // 8-11 accessories
        const items = getRandomItems(allAccessories, count);
        newScenarios.push({
          description: lang === 'eg'
            ? `الوكيل لابس: ${items.join('، ')}`
            : `Agent is wearing: ${items.join(', ')}`,
          accessories: items,
          count: count,
          shouldPass: false,
          explanation: lang === 'eg'
            ? `${count} نقطة لافتة زيادة عن الحد! القاعدة حدها الأقصى ٧ نقاط — أكتر من كده بيبقى مُشتّت للعين.`
            : `${count} points of interest exceeds the limit! The rule is maximum 7 points - more than seven could be too overwhelming for the eyes.`
        });
      }
      
      return shuffleArray(newScenarios);
    };
    
    setScenarios(generateScenarios());
  }, [lang]);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    const correct = answer === scenarios[currentQ].shouldPass;
    if (correct) {
      setLocalScore(prev => prev + 15);
      setStreak(prev => prev + 1);
      updateScore(15, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < scenarios.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (scenarios.length === 0) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const scenario = scenarios[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>{ui.activityNames.accessories}</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={scenarios.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={scenarios.length} />

      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '12px', marginBottom: '25px' }}>
        <h3 style={{ marginBottom: '15px', color: '#667eea' }}>{lang === 'eg' ? '👔 فحص المظهر' : '👔 Agent Appearance Check'}</h3>
        <p style={{ lineHeight: '1.8', fontSize: '16px' }}>{scenario.description}</p>
        <p style={{ marginTop: '15px', color: 'rgba(255,255,255,0.6)' }}>
          {lang === 'eg' ? 'العدد:' : 'Count:'}{' '}
          <strong style={{ color: '#fff' }}>{lang === 'eg' ? `${scenario.count} إكسسوارات` : `${scenario.count} accessories`}</strong>
        </p>
      </div>

      <p style={styles.questionText}>{lang === 'eg' ? 'اللبس ده مطابق للقاعدة ولا لا؟' : 'Does this outfit PASS or FAIL the dress code?'}</p>

      <div style={styles.grid2}>
        <button
          onClick={() => handleAnswer(true)}
          className={tfClass(true, selected, scenario.shouldPass, showFeedback)}
          style={{ padding: '36px 20px', textAlign: 'center', fontSize: '22px', fontWeight: 800 }}
        >
          {lang === 'eg' ? '✓ تمام' : '✓ PASS'}
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className={tfClass(false, selected, scenario.shouldPass, showFeedback)}
          style={{ padding: '36px 20px', textAlign: 'center', fontSize: '22px', fontWeight: 800 }}
        >
          {lang === 'eg' ? '✗ مش تمام' : '✗ FAIL'}
        </button>
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected === scenario.shouldPass} explanation={scenario.explanation} />
          {currentQ < scenarios.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>
                {lang === 'eg'
                  ? `🎉 خلّصت النشاط! النتيجة: ${localScore}/${scenarios.length * 15}`
                  : `🎉 Activity Complete! Score: ${localScore}/${scenarios.length * 15}`}
              </h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 9: Unit Type Identifier
const UnitTypeIdentifier = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const s = UI_STRINGS[lang];
  const TD = getTrainingData(lang);

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const allUnits = [
      ...TD.propertyTypes.residential.apartments,
      ...TD.propertyTypes.residential.villas
    ];
    
    const unitQuestions = allUnits.map(unit => {
      const wrongOptions = allUnits.filter(u => u.name !== unit.name).map(u => u.name);
      return {
        description: unit.description,
        correct: unit.name,
        options: shuffleArray([unit.name, ...getRandomItems(wrongOptions, 3)])
      };
    });
    
    setQuestions(shuffleArray(unitQuestions).slice(0, 8));
  }, [lang]);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].correct) {
      setLocalScore(prev => prev + 15);
      setStreak(prev => prev + 1);
      updateScore(15, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeBlue }}>{s.activityNames.unittype}</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '30px', borderRadius: '12px', marginBottom: '25px', textAlign: 'center' }}>
        <span style={{ fontSize: '50px' }}>🏠</span>
        <p style={{ fontSize: '20px', marginTop: '15px', lineHeight: '1.6' }}>"{toneifyText(lang, q.description, 'body')}"</p>
      </div>

      <h3 style={{ marginBottom: '20px' }}>{lang === 'eg' ? 'ده أنهي نوع وحدة؟' : 'What type of unit is this?'}</h3>

      <div style={styles.grid2}>
        {q.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option)}
            className={optionClass(idx, selected, q.correct, showFeedback, option)} style={{textAlign: 'center',
              padding: '20px',}}
          >
            {option}
          </button>
        ))}
      </div>

      {showFeedback && (
        <>
          <Feedback 
            isCorrect={selected === q.correct} 
            explanation={lang === 'eg'
              ? `الوصف ده يطابق: ${q.correct} — ${q.description}`
              : `This describes a ${q.correct}: ${q.description}`}
          />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>
                {lang === 'eg'
                  ? `🎉 خلّصت النشاط! النتيجة: ${localScore}/${questions.length * 15}`
                  : `🎉 Activity Complete! Score: ${localScore}/${questions.length * 15}`}
              </h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{s.back}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 10: Finishing Visualizer
const FinishingVisualizer = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const s = UI_STRINGS[lang];
  const TD = getTrainingData(lang);

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    const finishingCards = TD.finishingTypes.types.map(type => ({
      name: type.name,
      description: type.description,
      level: type.level,
      icon: type.level === 1 ? '🏗️' : type.level === 2 ? '🔨' : type.level === 3 ? '🏠' : '🛋️'
    }));
    
    setQuestions(shuffleArray(finishingCards));
  }, [lang]);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].name) {
      setLocalScore(prev => prev + 25);
      updateScore(25, true);
    } else {
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const q = questions[currentQ];
  const allOptions = TD.finishingTypes.types.map(t => t.name);

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>{s.activityNames.finishing}</span>
        <ScorePanel score={localScore} streak={0} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <div style={{ 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        padding: '40px',
        borderRadius: '16px',
        marginBottom: '25px',
        textAlign: 'center',
        border: '2px solid rgba(255,255,255,0.1)'
      }}>
        <span style={{ fontSize: '80px' }}>{q.icon}</span>
        <p style={{ fontSize: '18px', marginTop: '20px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>
          "{q.description}"
        </p>
        <div style={{ marginTop: '15px' }}>
          <span style={{ ...styles.badge, background: 'rgba(102,126,234,0.2)', color: '#667eea' }}>
            Level {q.level} of 4
          </span>
        </div>
      </div>

      <h3 style={{ marginBottom: '20px' }}>Match this to the correct finishing type:</h3>

      <div style={styles.grid2}>
        {allOptions.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option)}
            className={optionClass(idx, selected, q.name, showFeedback, option)} style={{textAlign: 'center',
              padding: '20px',}}
          >
            {option}
          </button>
        ))}
      </div>

      {showFeedback && (
        <>
          <Feedback 
            isCorrect={selected === q.name} 
            explanation={`${q.name} (Level ${q.level}): ${q.description}`}
          />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 Activity Complete! Score: {localScore}/{questions.length * 25}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 11: Commercial Tycoon
const CommercialTycoon = ({ onBack, updateScore }) => {
  const [items, setItems] = useState([]);
  const [sorted, setSorted] = useState({ Commercial: [], Admin: [], Medical: [] });
  const [showResults, setShowResults] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    const commercialItems = [
      { name: "Shops", correctCategory: "Commercial" },
      { name: "Show Room", correctCategory: "Commercial" },
      { name: "Office Space", correctCategory: "Admin" },
      { name: "Admin Building", correctCategory: "Admin" },
      { name: "Medical Clinic", correctCategory: "Medical" },
      { name: "Pharmacy", correctCategory: "Medical" },
      { name: "Retail Store", correctCategory: "Commercial" },
      { name: "Corporate HQ", correctCategory: "Admin" }
    ];
    setItems(shuffleArray(commercialItems));
  }, []);

  const handleDrop = (item, category) => {
    if (showResults) return;
    setItems(prev => prev.filter(i => i.name !== item.name));
    setSorted(prev => ({
      ...prev,
      [category]: [...prev[category], item]
    }));
  };

  const checkAnswers = () => {
    let correct = 0;
    Object.entries(sorted).forEach(([category, items]) => {
      items.forEach(item => {
        if (item.correctCategory === category) correct++;
      });
    });
    setLocalScore(correct * 10);
    updateScore(correct * 10, correct === 8);
    setShowResults(true);
  };

  const totalSorted = Object.values(sorted).flat().length;

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeBlue }}>Commercial Tycoon</span>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>Sorted</span>
          <span style={styles.scoreValue}>{totalSorted}/8</span>
        </div>
      </div>

      <p style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.7)' }}>
        Click an item below, then click a category to sort it
      </p>

      {/* Unsorted Items */}
      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ marginBottom: '10px' }}>🏢 Properties to Sort:</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{
              padding: '12px 20px',
              background: 'rgba(229,62,62,0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid rgba(229,62,62,0.5)'
            }}>
              {item.name}
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div style={styles.grid3}>
        {Object.entries(sorted).map(([category, categoryItems]) => (
          <div key={category} style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '20px',
            borderRadius: '12px',
            minHeight: '200px',
            border: '2px dashed rgba(255,255,255,0.2)'
          }}>
            <h4 style={{ marginBottom: '15px', color: '#4299e1' }}>{category}</h4>
            {categoryItems.map((item, idx) => (
              <div key={idx} style={{
                padding: '10px',
                background: showResults 
                  ? (item.correctCategory === category ? 'rgba(72,187,120,0.2)' : 'rgba(245,101,101,0.2)')
                  : 'rgba(255,255,255,0.1)',
                borderRadius: '6px',
                marginBottom: '8px',
                border: showResults 
                  ? (item.correctCategory === category ? '1px solid #48bb78' : '1px solid #f56565')
                  : '1px solid transparent'
              }}>
                {item.name}
              </div>
            ))}
            {items.length > 0 && !showResults && (
              <button 
                onClick={() => handleDrop(items[0], category)}
                style={{ ...styles.secondaryBtn, padding: '10px', width: '100%', marginTop: '10px' }}
              >
                + Add here
              </button>
            )}
          </div>
        ))}
      </div>

      {!showResults && totalSorted === 8 && (
        <button onClick={checkAnswers} style={{ ...styles.primaryBtn, marginTop: '20px' }}>
          Check Answers ✓
        </button>
      )}

      {showResults && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3>Score: {localScore}/80</h3>
          <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
        </div>
      )}
    </div>
  );
};

// Activity 12: The Sorting Hat (Broker vs Developer)
const SortingHat = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const s = UI_STRINGS[lang];

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const sortingQuestions = [
      { statement: "Working on diverse projects", answer: "Broker", explanation: "Brokers work on diverse projects across multiple developers." },
      { statement: "Less walk out", answer: "Broker", explanation: "Brokers have less walk out because they provide consultancy services." },
      { statement: "More awareness with the market", answer: "Broker", explanation: "Brokers have more market awareness due to working across the industry." },
      { statement: "Calling with regards to opportunity", answer: "Broker", explanation: "Brokers call about opportunities since they represent multiple projects." },
      { statement: "Working on their projects", answer: "Developer", explanation: "Developers work exclusively on their own projects." },
      { statement: "More walk out", answer: "Developer", explanation: "Developer sales teams have more walk out." },
      { statement: "Less awareness with the market", answer: "Developer", explanation: "Developers focus on their own projects, so have less overall market awareness." },
      { statement: "Calling with regards to type", answer: "Developer", explanation: "Developers call about specific unit types in their projects." },
      { statement: "Consultancy role", answer: "Broker", explanation: "Brokers provide consultancy services to clients." },
      { statement: "Sales role", answer: "Developer", explanation: "Developer teams have a direct sales role." }
    ];
    setQuestions(shuffleArray(sortingQuestions));
  }, []);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].answer) {
      setLocalScore(prev => prev + 10);
      setStreak(prev => prev + 1);
      updateScore(10, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>{s.activityNames.sortinghat} 🎩</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <div style={{ 
        background: 'rgba(0,0,0,0.4)', 
        padding: '40px', 
        borderRadius: '16px', 
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '50px' }}>🎩</span>
        <h2 style={{ fontSize: '24px', marginTop: '20px' }}>{toneifyText(lang, q.statement, 'question')}</h2>
      </div>

      <p style={{ textAlign: 'center', marginBottom: '20px', color: 'rgba(255,255,255,0.7)' }}>
        {lang === 'eg' ? 'اختار السايد الصح بسرعة!' : 'Swipe this characteristic to the correct side!'}
      </p>

      <div style={styles.grid2}>
        <button
          onClick={() => handleAnswer("Broker")}
          className={tfClass("Broker", selected, q.answer, showFeedback)}
          style={{ padding: '40px', textAlign: 'center' }}
        >
          <span style={{ fontSize: '40px' }}>👔</span>
          <div style={{ marginTop: '10px', fontSize: '20px', fontWeight: '600' }}>{lang === 'eg' ? 'بروكر' : 'BROKER'}</div>
        </button>
        <button
          onClick={() => handleAnswer("Developer")}
          className={tfClass("Developer", selected, q.answer, showFeedback)}
          style={{ padding: '40px', textAlign: 'center' }}
        >
          <span style={{ fontSize: '40px' }}>🏗️</span>
          <div style={{ marginTop: '10px', fontSize: '20px', fontWeight: '600' }}>{lang === 'eg' ? 'ديفيلوبر' : 'DEVELOPER'}</div>
        </button>
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected === q.answer} explanation={q.explanation} />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>{lang === 'eg' ? '🎉 خلّصت النشاط!' : '🎉 Activity Complete!'} {lang === 'eg' ? 'السكور:' : 'Score:'} {localScore}/{questions.length * 10}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{s.back}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================
// ACTIVITY MODULES - PHASE 3 (13-24)
// ============================================

// Activity 13: Pro/Con Matrix (Primary vs Resale)
const ProConMatrix = ({ onBack, updateScore }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const matrixQuestions = [
      { feature: "Cash payment required", answer: "Resale", explanation: "Resale properties typically require cash payment since you're buying from another client." },
      { feature: "Installment options available", answer: "Primary", explanation: "Primary sales from developers typically offer installment payment plans." },
      { feature: "Most properties are RTM (Ready To Move)", answer: "Resale", explanation: "Most resale properties are RTM - they're already completed and ready for occupancy." },
      { feature: "Most properties are Off-plan", answer: "Primary", explanation: "Most primary properties are Off-plan - sold before construction is complete." },
      { feature: "Buy from client", answer: "Resale", explanation: "Resale means buying from another client/owner, not directly from developer." },
      { feature: "Buy from developer", answer: "Primary", explanation: "Primary sales are purchases made directly from the developer." },
      { feature: "Property already constructed", answer: "Resale", explanation: "Resale properties are typically already built since they were previously owned." },
      { feature: "Can customize before completion", answer: "Primary", explanation: "Off-plan primary purchases may allow customization during construction." }
    ];
    setQuestions(shuffleArray(matrixQuestions));
  }, []);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].answer) {
      setLocalScore(prev => prev + 12);
      setStreak(prev => prev + 1);
      updateScore(12, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>Loading...</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>Pro/Con Matrix</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <div style={{ 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        padding: '30px',
        borderRadius: '16px',
        marginBottom: '25px',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '40px' }}>📊</span>
        <h2 style={{ fontSize: '22px', marginTop: '15px' }}>"{q.feature}"</h2>
      </div>

      <p style={{ textAlign: 'center', marginBottom: '20px' }}>Is this typical of PRIMARY or RESALE?</p>

      <div style={styles.grid2}>
        <button
          onClick={() => handleAnswer("Primary")}
          className={tfClass("Primary", selected, q.answer, showFeedback)}
          style={{ padding: '30px', textAlign: 'center' }}
        >
          <span style={{ fontSize: '30px' }}>🏗️</span>
          <div style={{ marginTop: '10px', fontWeight: '600' }}>PRIMARY</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>From Developer</div>
        </button>
        <button
          onClick={() => handleAnswer("Resale")}
          className={tfClass("Resale", selected, q.answer, showFeedback)}
          style={{ padding: '30px', textAlign: 'center' }}
        >
          <span style={{ fontSize: '30px' }}>🔄</span>
          <div style={{ marginTop: '10px', fontWeight: '600' }}>RESALE</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>From Client</div>
        </button>
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected === q.answer} explanation={q.explanation} />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 Score: {localScore}/{questions.length * 12}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 14: Market Awareness Check
const MarketAwarenessCheck = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const s = UI_STRINGS[lang];

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    const awarenessQuestions = [
      { question: "Who has MORE awareness with the market?", answer: "Broker", explanation: "Brokers have more market awareness because they work across diverse projects and the entire market." },
      { question: "Who experiences MORE walk out?", answer: "Developer", explanation: "Developer sales teams experience more walk out compared to brokers." },
      { question: "Who works on DIVERSE projects?", answer: "Broker", explanation: "Brokers work on diverse projects from multiple developers." },
      { question: "Who provides CONSULTANCY services?", answer: "Broker", explanation: "Brokers provide consultancy services, while developers focus on sales." },
      { question: "Who calls with regards to OPPORTUNITY?", answer: "Broker", explanation: "Brokers call about opportunities since they represent multiple projects." },
      { question: "Who calls with regards to TYPE?", answer: "Developer", explanation: "Developers call about specific unit types available in their projects." }
    ];
    setQuestions(shuffleArray(awarenessQuestions));
  }, []);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].answer) {
      setLocalScore(prev => prev + 15);
      updateScore(15, true);
    } else {
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeBlue }}>{s.activityNames.market}</span>
        <ScorePanel score={localScore} streak={0} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <h2 style={styles.questionText}>{toneifyText(lang, q.question, 'question')}</h2>

      <div style={styles.grid2}>
        <button
          onClick={() => handleAnswer("Broker")}
          className={tfClass("Broker", selected, q.answer, showFeedback)}
          style={{ padding: '40px', textAlign: 'center' }}
        >
          <span style={{ fontSize: '50px' }}>👔</span>
          <div style={{ marginTop: '15px', fontSize: '20px', fontWeight: '700' }}>{lang === 'eg' ? 'بروكر' : 'BROKER'}</div>
        </button>
        <button
          onClick={() => handleAnswer("Developer")}
          className={tfClass("Developer", selected, q.answer, showFeedback)}
          style={{ padding: '40px', textAlign: 'center' }}
        >
          <span style={{ fontSize: '50px' }}>🏢</span>
          <div style={{ marginTop: '15px', fontSize: '20px', fontWeight: '700' }}>{lang === 'eg' ? 'ديفيلوبر' : 'DEVELOPER'}</div>
        </button>
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected === q.answer} explanation={q.explanation} />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>{lang === 'eg' ? '🎉 خلّصت!' : '🎉 Done!'} {lang === 'eg' ? 'السكور:' : 'Score:'} {localScore}/{questions.length * 15}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{s.back}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 15: Motive Detective (Emotional vs Rational)
const MotiveDetective = ({ onBack, updateScore }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const motiveQuestions = [
      { scenario: "Client says: 'I want a home where my family feels safe and protected.'", answer: "Emotional", motive: "Safety/Security", explanation: "Feeling 'safe' is an emotional need - it's about comfort and peace of mind, not tangible features." },
      { scenario: "Client says: 'I need good ROI within 5 years.'", answer: "Rational", motive: "Investment Return", explanation: "ROI is a rational, measurable, financial goal - purely logical decision-making." },
      { scenario: "Client says: 'I want my neighbors to respect me.'", answer: "Emotional", motive: "Status/Prestige", explanation: "Seeking respect and status is an emotional need driven by feelings of self-worth." },
      { scenario: "Client says: 'The unit must be at least 200 sqm.'", answer: "Rational", motive: "Size Requirement", explanation: "A specific size requirement is a tangible, measurable need - rational and practical." },
      { scenario: "Client says: 'I've always dreamed of a penthouse.'", answer: "Emotional", motive: "Dream/Aspiration", explanation: "Dreams and aspirations are emotionally driven - this is about fulfilling a personal vision." },
      { scenario: "Client says: 'It needs to be close to my children's school.'", answer: "Rational", motive: "Location/Convenience", explanation: "Proximity to school is a practical, logical requirement based on convenience." },
      { scenario: "Client says: 'I want to feel proud when guests visit.'", answer: "Emotional", motive: "Pride/Status", explanation: "Pride and impression on others are emotional drivers." },
      { scenario: "Client says: 'The monthly payment must not exceed 20,000.'", answer: "Rational", motive: "Budget Constraint", explanation: "Budget limits are practical, measurable constraints - purely rational." },
      { scenario: "Client says: 'I want somewhere I can finally call my own.'", answer: "Emotional", motive: "Ownership Pride", explanation: "The feeling of ownership and belonging is deeply emotional." },
      { scenario: "Client says: 'Must have 3 bedrooms minimum.'", answer: "Rational", motive: "Space Requirement", explanation: "Number of bedrooms is a specific, tangible requirement - rational." }
    ];
    setQuestions(shuffleArray(motiveQuestions));
  }, []);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].answer) {
      setLocalScore(prev => prev + 10);
      setStreak(prev => prev + 1);
      updateScore(10, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>Loading...</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>🔍 Motive Detective</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <div style={{ 
        background: 'rgba(0,0,0,0.4)',
        padding: '30px',
        borderRadius: '16px',
        marginBottom: '25px'
      }}>
        <span style={{ fontSize: '30px' }}>🗣️</span>
        <p style={{ fontSize: '20px', marginTop: '15px', lineHeight: '1.6', fontStyle: 'italic' }}>
          {q.scenario}
        </p>
      </div>

      <p style={{ textAlign: 'center', marginBottom: '20px' }}>Is this an EMOTIONAL or RATIONAL motive?</p>

      <div style={styles.grid2}>
        <button
          onClick={() => handleAnswer("Emotional")}
          className={tfClass("Emotional", selected, q.answer, showFeedback)}
          style={{ padding: '30px', textAlign: 'center' }}
        >
          <span style={{ fontSize: '40px' }}>❤️</span>
          <div style={{ marginTop: '10px', fontWeight: '700' }}>EMOTIONAL</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Feelings & Concepts</div>
        </button>
        <button
          onClick={() => handleAnswer("Rational")}
          className={tfClass("Rational", selected, q.answer, showFeedback)}
          style={{ padding: '30px', textAlign: 'center' }}
        >
          <span style={{ fontSize: '40px' }}>🧠</span>
          <div style={{ marginTop: '10px', fontWeight: '700' }}>RATIONAL</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Logic & Facts</div>
        </button>
      </div>

      {showFeedback && (
        <>
          <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ ...styles.badge, ...styles.badgeBlue }}>Motive: {q.motive}</span>
          </div>
          <Feedback isCorrect={selected === q.answer} explanation={q.explanation} />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 Score: {localScore}/{questions.length * 10}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 16: Needs vs Wants Sorter
const NeedsWantsSorter = ({ onBack, updateScore }) => {
  const [items, setItems] = useState([]);
  const [sorted, setSorted] = useState({ Needs: [], Wants: [] });
  const [showResults, setShowResults] = useState(false);
  const [localScore, setLocalScore] = useState(0);
  const [currentItem, setCurrentItem] = useState(null);

  useEffect(() => {
    const allItems = [
      { text: "3 bedrooms", category: "Needs", explanation: "Tangible requirement" },
      { text: "Near metro station", category: "Needs", explanation: "Specific location request" },
      { text: "Budget under 3M", category: "Needs", explanation: "Measurable constraint" },
      { text: "Ground floor unit", category: "Needs", explanation: "Specific requirement" },
      { text: "Feel safe", category: "Wants", explanation: "Emotional concept" },
      { text: "Status symbol", category: "Wants", explanation: "Emotional motivation" },
      { text: "Peace of mind", category: "Wants", explanation: "Feeling, not tangible" },
      { text: "Pride of ownership", category: "Wants", explanation: "Emotional driver" },
      { text: "Parking space", category: "Needs", explanation: "Tangible requirement" },
      { text: "Investment security", category: "Wants", explanation: "Conceptual/emotional" }
    ];
    const shuffled = shuffleArray(allItems);
    setItems(shuffled);
    setCurrentItem(shuffled[0]);
  }, []);

  const handleSort = (category) => {
    if (!currentItem || showResults) return;
    
    setSorted(prev => ({
      ...prev,
      [category]: [...prev[category], currentItem]
    }));
    
    const remaining = items.filter(i => i.text !== currentItem.text);
    setItems(remaining);
    setCurrentItem(remaining[0] || null);
    
    if (remaining.length === 0) {
      setTimeout(() => checkResults(), 100);
    }
  };

  const checkResults = () => {
    let correct = 0;
    [...sorted.Needs, ...sorted.Wants].forEach(item => {
      const cat = sorted.Needs.includes(item) ? 'Needs' : 'Wants';
      if (item.category === cat) correct++;
    });
    setLocalScore(correct * 10);
    updateScore(correct * 10, correct >= 8);
    setShowResults(true);
  };

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>Needs vs Wants Sorter</span>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>Remaining</span>
          <span style={styles.scoreValue}>{items.length}</span>
        </div>
      </div>

      {currentItem && !showResults && (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(229,62,62,0.2), rgba(229,62,62,0.1))',
          padding: '40px',
          borderRadius: '16px',
          marginBottom: '30px',
          textAlign: 'center',
          border: '2px solid rgba(229,62,62,0.3)'
        }}>
          <span style={{ fontSize: '24px' }}>🏷️</span>
          <h2 style={{ fontSize: '28px', marginTop: '15px' }}>"{currentItem.text}"</h2>
        </div>
      )}

      {!showResults && (
        <div style={styles.grid2}>
          <button
            onClick={() => handleSort("Needs")}
            className="game-option game-option--blue"
            style={{ padding: '40px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '40px' }}>📋</span>
            <div style={{ marginTop: '10px', fontSize: '20px', fontWeight: '700' }}>NEEDS</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '5px' }}>
              Tangible requirements they ask for
            </div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              Sorted: {sorted.Needs.length}
            </div>
          </button>
          <button
            onClick={() => handleSort("Wants")}
            className="game-option game-option--pink"
            style={{ padding: '40px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '40px' }}>💭</span>
            <div style={{ marginTop: '10px', fontSize: '20px', fontWeight: '700' }}>WANTS</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '5px' }}>
              Concepts &amp; feelings behind it
            </div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              Sorted: {sorted.Wants.length}
            </div>
          </button>
        </div>
      )}

      {items.length === 0 && !showResults && (
        <button onClick={checkResults} style={{ ...styles.primaryBtn, marginTop: '20px' }}>
          See Results ✓
        </button>
      )}

      {showResults && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Results:</h3>
          <div style={styles.grid2}>
            {Object.entries(sorted).map(([category, categoryItems]) => (
              <div key={category} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '15px' }}>{category}</h4>
                {categoryItems.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '10px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    background: item.category === category ? 'rgba(72,187,120,0.2)' : 'rgba(245,101,101,0.2)',
                    border: item.category === category ? '1px solid #48bb78' : '1px solid #f56565'
                  }}>
                    {item.text}
                    <span style={{ fontSize: '12px', marginLeft: '10px', opacity: 0.7 }}>
                      ({item.explanation})
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <h3>Score: {localScore}/100</h3>
            <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Activity 17: The "Why" Chain
const WhyChain = ({ onBack, updateScore }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [localScore, setLocalScore] = useState(0);
  const [chain, setChain] = useState([]);

  const scenario = {
    initial: "Client: 'I'm looking for a 3-bedroom apartment in New Cairo.'",
    steps: [
      {
        question: "What's the best follow-up to understand WHY?",
        options: [
          { text: "What's your budget?", correct: false },
          { text: "Why New Cairo specifically?", correct: true },
          { text: "Do you want furnished?", correct: false },
          { text: "When do you need it?", correct: false }
        ],
        explanation: "Asking 'Why New Cairo?' digs deeper into their motivation - understanding the reason behind the location choice.",
        response: "Client: 'My kids go to school there, and I want them closer.'"
      },
      {
        question: "Client mentioned kids' school. What's the next 'Why' question?",
        options: [
          { text: "How many kids do you have?", correct: false },
          { text: "What's important about them being closer?", correct: true },
          { text: "Which school is it?", correct: false },
          { text: "Do they take the bus?", correct: false }
        ],
        explanation: "Understanding what 'closer' means to them reveals the emotional motivation - safety, family time, convenience.",
        response: "Client: 'I want to spend more quality time with them. Currently, their commute is 2 hours.'"
      },
      {
        question: "The emotional motive is becoming clear. What question solidifies understanding?",
        options: [
          { text: "How would having more family time make you feel?", correct: true },
          { text: "Is 2 hours really that bad?", correct: false },
          { text: "Can't you just move their school?", correct: false },
          { text: "What about traffic?", correct: false }
        ],
        explanation: "This question confirms the emotional driver - family bonding, being a present parent. This is the WANT behind the NEED.",
        response: "Client: 'It would mean everything. I feel like I'm missing their childhood.'"
      }
    ]
  };

  const handleAnswer = (option) => {
    if (showFeedback) return;
    setSelected(option);
    setShowFeedback(true);
    
    if (option.correct) {
      setLocalScore(prev => prev + 30);
      updateScore(30, true);
      setChain(prev => [...prev, scenario.steps[currentStep].response]);
    } else {
      updateScore(0, false);
    }
  };

  const nextStep = () => {
    if (currentStep < scenario.steps.length - 1 && selected?.correct) {
      setCurrentStep(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  const step = scenario.steps[currentStep];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>🔗 The "Why" Chain</span>
        <ScorePanel score={localScore} streak={0} totalQuestions={3} currentQuestion={currentStep + 1} />
      </div>

      <ProgressBar current={currentStep + 1} total={scenario.steps.length} />

      {/* Conversation chain */}
      <div style={{ marginBottom: '25px' }}>
        <div style={{ background: 'rgba(66,153,225,0.1)', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
          <strong>🗣️ Start:</strong> {scenario.initial}
        </div>
        {chain.map((response, idx) => (
          <div key={idx} style={{ background: 'rgba(72,187,120,0.1)', padding: '15px', borderRadius: '12px', marginBottom: '10px', marginLeft: '20px' }}>
            <strong>💬</strong> {response}
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom: '20px' }}>{step.question}</h3>

      <div>
        {step.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option)}
            className={`game-option game-option--${['blue','pink','amber','green'][idx % 4]}${showFeedback && option.correct ? ' game-option--correct' : ''}${showFeedback && selected === option && !option.correct ? ' game-option--incorrect' : ''}${showFeedback && selected !== option && !option.correct ? ' game-option--dimmed' : ''}`}
          >
            {option.text}
          </button>
        ))}
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected?.correct} explanation={step.explanation} />
          {currentStep < scenario.steps.length - 1 && selected?.correct ? (
            <NextButton onClick={nextStep} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 Chain Complete! Score: {localScore}/90</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>
                You uncovered the emotional motive: Family connection & being present for their children.
              </p>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 18: Brain vs Heart (Balance Scale)
const BrainVsHeart = ({ onBack, updateScore }) => {
  const [reasons, setReasons] = useState([]);
  const [sorted, setSorted] = useState({ emotional: [], rational: [] });
  const [showResult, setShowResult] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    const clientReasons = shuffleArray([
      { text: "Good investment potential", type: "rational" },
      { text: "I want to feel proud", type: "emotional" },
      { text: "Near my workplace", type: "rational" },
      { text: "My family will be happy", type: "emotional" },
      { text: "Price is within budget", type: "rational" },
      { text: "It's always been my dream", type: "emotional" }
    ]);
    setReasons(clientReasons);
  }, []);

  const handleSort = (reason, type) => {
    if (showResult) return;
    setReasons(prev => prev.filter(r => r.text !== reason.text));
    setSorted(prev => ({
      ...prev,
      [type]: [...prev[type], reason]
    }));
  };

  const checkResult = () => {
    let correct = 0;
    Object.entries(sorted).forEach(([type, items]) => {
      items.forEach(item => {
        if (item.type === type) correct++;
      });
    });
    setLocalScore(correct * 15);
    updateScore(correct * 15, correct >= 5);
    setShowResult(true);
  };

  const emotionalCount = sorted.emotional.length;
  const rationalCount = sorted.rational.length;
  const totalSorted = emotionalCount + rationalCount;

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>⚖️ Brain vs Heart</span>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>Sorted</span>
          <span style={styles.scoreValue}>{totalSorted}/6</span>
        </div>
      </div>

      {/* Balance Scale Visualization */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '50px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '40px' }}>❤️</span>
            <div style={{ 
              width: '100px', 
              height: `${50 + emotionalCount * 20}px`, 
              background: 'rgba(237,100,166,0.3)', 
              borderRadius: '8px',
              marginTop: '10px',
              transition: 'height 0.3s ease'
            }} />
            <div style={{ marginTop: '10px' }}>Emotional: {emotionalCount}</div>
          </div>
          <div style={{ fontSize: '60px' }}>⚖️</div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '40px' }}>🧠</span>
            <div style={{ 
              width: '100px', 
              height: `${50 + rationalCount * 20}px`, 
              background: 'rgba(66,153,225,0.3)', 
              borderRadius: '8px',
              marginTop: '10px',
              transition: 'height 0.3s ease'
            }} />
            <div style={{ marginTop: '10px' }}>Rational: {rationalCount}</div>
          </div>
        </div>
      </div>

      {reasons.length > 0 && !showResult && (
        <>
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '10px', color: 'rgba(255,255,255,0.7)' }}>Client says:</p>
            <h3>"{reasons[0].text}"</h3>
          </div>

          <div style={styles.grid2}>
            <button
              onClick={() => handleSort(reasons[0], 'emotional')}
              className="game-option game-option--pink"
              style={{ textAlign: 'center', padding: '24px' }}
            >
              ❤️ Emotional
            </button>
            <button
              onClick={() => handleSort(reasons[0], 'rational')}
              className="game-option game-option--blue"
              style={{ textAlign: 'center', padding: '24px' }}
            >
              🧠 Rational
            </button>
          </div>
        </>
      )}

      {reasons.length === 0 && !showResult && (
        <button onClick={checkResult} style={{ ...styles.primaryBtn, display: 'block', margin: '20px auto' }}>
          See Balance Result ⚖️
        </button>
      )}

      {showResult && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px' }}>
            Client leans: {emotionalCount > rationalCount ? '❤️ EMOTIONAL' : rationalCount > emotionalCount ? '🧠 RATIONAL' : '⚖️ BALANCED'}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
            {emotionalCount > rationalCount 
              ? 'Focus on feelings, dreams, and lifestyle benefits when presenting properties.' 
              : rationalCount > emotionalCount
              ? 'Emphasize ROI, practical features, and logical benefits.'
              : 'Balance both emotional appeal and practical benefits.'}
          </p>
          <h4>Score: {localScore}/90</h4>
          <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
        </div>
      )}
    </div>
  );
};

// Activity 19: 7-38-55 Decoder
const CommunicationDecoder = ({ onBack, updateScore }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const decoderQuestions = [
      { 
        scenario: "Agent says 'This is a GREAT opportunity!' but sounds monotone and bored.", 
        error: "Tonality", 
        percentage: 38,
        explanation: "The words are positive, but the tonality (38%) doesn't match. Enthusiasm must come through in HOW you say it." 
      },
      { 
        scenario: "Agent is explaining benefits but keeps looking at their phone and slouching.", 
        error: "Body Language", 
        percentage: 55,
        explanation: "Body language accounts for 55% of communication. Looking at phone and slouching shows disinterest." 
      },
      { 
        scenario: "Agent says 'This unit is, um, like, kind of okay I guess' while smiling confidently.", 
        error: "Words", 
        percentage: 7,
        explanation: "The words (7%) are weak and non-committal. Even with good delivery, the actual words matter." 
      },
      { 
        scenario: "Agent speaks with great enthusiasm but uses crossed arms and backs away from client.", 
        error: "Body Language", 
        percentage: 55,
        explanation: "Crossed arms and backing away are defensive body language (55%), contradicting verbal enthusiasm." 
      },
      { 
        scenario: "Agent reads script perfectly but speaks in a fast, robotic, rushed manner.", 
        error: "Tonality", 
        percentage: 38,
        explanation: "Robotic delivery is a tonality problem (38%). The pace and natural flow of speech matters." 
      },
      { 
        scenario: "Agent maintains eye contact and open posture but says 'I dunno if this is worth it.'", 
        error: "Words", 
        percentage: 7,
        explanation: "Words matter (7%)! Saying 'I dunno' and questioning value undermines the entire pitch." 
      },
      { 
        scenario: "Agent speaks clearly and uses good words, but yawns repeatedly during presentation.", 
        error: "Body Language", 
        percentage: 55,
        explanation: "Yawning is body language (55%) that signals boredom or lack of interest to the client." 
      },
      { 
        scenario: "Agent whispers the key benefits so quietly the client keeps asking 'what?'", 
        error: "Tonality", 
        percentage: 38,
        explanation: "Volume is part of tonality (38%). Speaking too quietly prevents the message from being heard." 
      }
    ];
    setQuestions(shuffleArray(decoderQuestions));
  }, []);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].error) {
      setLocalScore(prev => prev + 12);
      setStreak(prev => prev + 1);
      updateScore(12, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>Loading...</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeBlue }}>📊 7-38-55 Decoder</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      {/* Rule reminder */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '25px' }}>
        <span style={{ ...styles.badge, fontSize: '14px', padding: '8px 15px' }}>Words: 7%</span>
        <span style={{ ...styles.badge, fontSize: '14px', padding: '8px 15px' }}>Tonality: 38%</span>
        <span style={{ ...styles.badge, fontSize: '14px', padding: '8px 15px' }}>Body Language: 55%</span>
      </div>

      <div style={{ 
        background: 'rgba(0,0,0,0.4)', 
        padding: '30px', 
        borderRadius: '16px', 
        marginBottom: '25px' 
      }}>
        <span style={{ fontSize: '30px' }}>🎭</span>
        <p style={{ fontSize: '18px', marginTop: '15px', lineHeight: '1.6' }}>{q.scenario}</p>
      </div>

      <p style={{ textAlign: 'center', marginBottom: '20px' }}>Where is the communication ERROR?</p>

      <div style={styles.grid3}>
        {[
          { type: "Words", pct: "7%", icon: "💬" },
          { type: "Tonality", pct: "38%", icon: "🎤" },
          { type: "Body Language", pct: "55%", icon: "🕺" }
        ].map((option, idx) => (
          <button
            key={option.type}
            onClick={() => handleAnswer(option.type)}
            className={optionClass(idx, selected, q.error, showFeedback, option.type)}
            style={{ padding: '25px', textAlign: 'center' }}
          >
            <span style={{ fontSize: '30px' }}>{option.icon}</span>
            <div style={{ marginTop: '10px', fontWeight: '600' }}>{option.type}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{option.pct}</div>
          </button>
        ))}
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected === q.error} explanation={q.explanation} />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 Score: {localScore}/{questions.length * 12}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 20: Robot Talk Buzzer
const RobotTalkBuzzer = ({ onBack, updateScore }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    const buzzerQuestions = [
      {
        scripts: [
          { text: "Hi! I noticed you were looking at properties in New Cairo - that's such a vibrant area!", robot: false },
          { text: "Good morning. I am calling to inform you about available units. Please listen.", robot: true },
          { text: "Hey, I've got something exciting that might interest you based on what you mentioned!", robot: false }
        ],
        explanation: "Script 2 is robot talk - it's impersonal, commanding ('please listen'), and lacks warmth or personalization."
      },
      {
        scripts: [
          { text: "Thank you for your time. I will now proceed to explain the payment options.", robot: true },
          { text: "So about the payment - there's actually some really flexible options I think you'll love!", robot: false },
          { text: "Let me walk you through how we can make this work for your budget.", robot: false }
        ],
        explanation: "'Proceed to explain' is robotic language. Natural conversation doesn't announce what you're about to do."
      },
      {
        scripts: [
          { text: "I understand that's a concern - a lot of my clients felt the same way initially.", robot: false },
          { text: "Your concern has been noted. Moving to the next point.", robot: true },
          { text: "That's a really valid point! Here's what I'd suggest...", robot: false }
        ],
        explanation: "'Your concern has been noted' sounds like a customer service bot, not a helpful human advisor."
      },
      {
        scripts: [
          { text: "Please hold while I transfer your inquiry to the relevant department.", robot: true },
          { text: "Let me connect you with someone who specializes in exactly what you're looking for.", robot: false },
          { text: "I know just the person to help with that - give me one sec!", robot: false }
        ],
        explanation: "Formal, impersonal language like 'transfer your inquiry to the relevant department' is classic robot talk."
      }
    ];
    setQuestions(shuffleArray(buzzerQuestions));
  }, []);

  const handleBuzz = (script) => {
    if (showFeedback) return;
    setSelected(script);
    setShowFeedback(true);
    
    if (script.robot) {
      setLocalScore(prev => prev + 25);
      updateScore(25, true);
    } else {
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>Loading...</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>🤖 Robot Talk Buzzer</span>
        <ScorePanel score={localScore} streak={0} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <span style={{ fontSize: '60px' }}>🚨</span>
        <h2 style={{ marginTop: '10px' }}>Hit the BUZZER on the ROBOT TALK!</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Which script sounds like "machine talk format"?</p>
      </div>

      <div>
        {q.scripts.map((script, idx) => (
          <button
            key={idx}
            onClick={() => handleBuzz(script)}
            className={`game-option game-option--${['blue','pink','amber','green'][idx % 4]}${showFeedback && script.robot ? ' game-option--correct' : ''}${showFeedback && selected === script && !script.robot ? ' game-option--incorrect' : ''}${showFeedback && selected !== script && !script.robot ? ' game-option--dimmed' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}
          >
            <span style={{ fontSize: '24px' }}>🔊</span>
            <span style={{ flex: 1 }}>"{script.text}"</span>
            <span style={{ fontSize: '24px' }}>🚨</span>
          </button>
        ))}
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected?.robot} explanation={q.explanation} />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 Score: {localScore}/{questions.length * 25}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 21: The Mirroring Drill
const MirroringDrill = ({ onBack, updateScore }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const mirrorQuestions = [
      {
        scenario: "Client speaks slowly and softly, taking long pauses.",
        correct: "Match their pace - speak slowly, softly, with thoughtful pauses",
        wrong: "Speed up to show enthusiasm and energy",
        explanation: "Mirror the same tone/volume. Speaking fast to a slow speaker creates disconnect."
      },
      {
        scenario: "Client is excited, speaking quickly with high energy.",
        correct: "Match their energy - be enthusiastic and responsive",
        wrong: "Stay calm and slow to balance them out",
        explanation: "We like people who are like us. Match their excitement to build rapport."
      },
      {
        scenario: "Client uses very formal, professional language.",
        correct: "Use professional terminology and formal structure",
        wrong: "Be casual and use slang to loosen them up",
        explanation: "Speaking the same language means adapting to their style, not changing them."
      },
      {
        scenario: "Client is a numbers person, asking about ROI and appreciation rates.",
        correct: "Lead with data, statistics, and financial analysis",
        wrong: "Focus on how the property will make them feel",
        explanation: "Understand where they come from - this client wants rational, data-driven conversation."
      },
      {
        scenario: "Client keeps making jokes and has a light-hearted tone.",
        correct: "Engage with their humor and keep things light",
        wrong: "Stay strictly professional to maintain credibility",
        explanation: "Rapport means adapting yourself. If they're playful, being rigid creates disconnect."
      },
      {
        scenario: "Client is quiet, reserved, and gives short answers.",
        correct: "Give them space, ask open questions, don't overwhelm",
        wrong: "Fill silence with lots of information and energy",
        explanation: "Mirror their reserved nature. Overwhelming quiet people pushes them away."
      }
    ];
    setQuestions(shuffleArray(mirrorQuestions));
  }, []);

  const handleAnswer = (isCorrect) => {
    if (showFeedback) return;
    setSelected(isCorrect);
    setShowFeedback(true);
    
    if (isCorrect) {
      setLocalScore(prev => prev + 15);
      setStreak(prev => prev + 1);
      updateScore(15, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>Loading...</div>;

  const q = questions[currentQ];
  const shuffledOptions = useMemo(() => 
    shuffleArray([
      { text: q.correct, isCorrect: true },
      { text: q.wrong, isCorrect: false }
    ]), [q]);

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>🪞 Mirroring Drill</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <div style={{ 
        background: 'rgba(0,0,0,0.4)', 
        padding: '30px', 
        borderRadius: '16px', 
        marginBottom: '25px',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '40px' }}>🗣️</span>
        <p style={{ fontSize: '18px', marginTop: '15px', lineHeight: '1.6' }}>
          <strong>Client Behavior:</strong> {q.scenario}
        </p>
      </div>

      <h3 style={{ marginBottom: '20px' }}>How should you adapt your style?</h3>

      <div>
        {shuffledOptions.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option.isCorrect)}
            className={optionClass(idx, selected, true, showFeedback, option.isCorrect)}
          >
            {option.text}
          </button>
        ))}
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected} explanation={q.explanation} />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 Score: {localScore}/{questions.length * 15}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 22: ABC Closing Challenge
const ABCClosingChallenge = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];
  const TD = getTrainingData(lang);

  const [scrambled, setScrambled] = useState([]);
  const [userOrder, setUserOrder] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  const correctOrder = TD.callTechniques.abcTechnique.steps;

  useEffect(() => {
    setScrambled(shuffleArray([...correctOrder]));
    setUserOrder([]);
    setShowResult(false);
    setLocalScore(0);
  }, [lang]);

  const selectItem = (item) => {
    if (showResult || userOrder.includes(item)) return;
    setUserOrder(prev => [...prev, item]);
  };

  const resetOrder = () => {
    setUserOrder([]);
  };

  const checkOrder = () => {
    const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
    if (isCorrect) {
      setLocalScore(50);
      updateScore(50, true);
    } else {
      updateScore(0, false);
    }
    setShowResult(true);
  };

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>🔤 {ui.activityNames.abc}</span>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{ui.progress}</span>
          <span style={styles.scoreValue}>{userOrder.length}/3</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <span style={{ fontSize: '60px' }}>🎯</span>
        <h2 style={{ marginTop: '15px' }}>
          {lang === 'eg' ? 'رتّب تقنية أ.ب.ج صح!' : 'Unscramble the A.B.C Technique!'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>
          {lang === 'eg' ? 'اضغط على العناصر بالترتيب الصح' : 'Click the letters in the correct order'}
        </p>
      </div>

      {/* User's order */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'center', 
        marginBottom: '30px',
        minHeight: '80px'
      }}>
        {[0, 1, 2].map(idx => (
          <div key={idx} style={{
            width: '150px',
            padding: '20px',
            background: userOrder[idx] ? 'rgba(229,62,62,0.2)' : 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            textAlign: 'center',
            border: showResult 
              ? (userOrder[idx] === correctOrder[idx] ? '2px solid #48bb78' : '2px solid #f56565')
              : '2px dashed rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{lang === 'eg' ? ['أ', 'ب', 'ج'][idx] : ['A', 'B', 'C'][idx]}.</div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              {userOrder[idx] || '?'}
            </div>
          </div>
        ))}
      </div>

      {/* Scrambled options */}
      {!showResult && (
        <>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {scrambled.map((item, idx) => (
              <button
                key={idx}
                onClick={() => selectItem(item)}
                disabled={userOrder.includes(item)}
                style={{
                  ...styles.primaryBtn,
                  opacity: userOrder.includes(item) ? 0.3 : 1,
                  cursor: userOrder.includes(item) ? 'not-allowed' : 'pointer'
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {userOrder.length > 0 && userOrder.length < 3 && (
              <button onClick={resetOrder} style={styles.secondaryBtn}>
                {lang === 'eg' ? 'إعادة' : 'Reset'}
              </button>
            )}
            {userOrder.length === 3 && (
              <button onClick={checkOrder} style={styles.primaryBtn}>
                {lang === 'eg' ? 'راجع الإجابة ✓' : 'Check Answer ✓'}
              </button>
            )}
          </div>
        </>
      )}

      {showResult && (
        <>
          <Feedback 
            isCorrect={localScore > 0}
            explanation={
              lang === 'eg'
                ? 'أ.ب.ج معناها: إقرار (اعترف باحتياج العميل)، مميزات (اشرح هتفيده إزاي)، التزام (خلّيه ياخد خطوة). دي طريقة كواليـفاي في المكالمات.'
                : "A.B.C stands for Acknowledgment (recognize client's needs), Benefits (explain how you can help), and Commitment (get them to take action). This is the technique for qualifying clients during calls."
            }
          />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h3>{lang === 'eg' ? `النتيجة: ${localScore}/٥٠` : `Score: ${localScore}/50`}</h3>
            <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
          </div>
        </>
      )}
    </div>
  );
};

// Activity 23: Mistake Sniper
const MistakeSniper = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const mistakeQuestionsEn = [
      {
        transcript: [
          'Agent: Good morning!',
          'Agent: Is this a good time to talk?',
          'Agent: I have an exciting opportunity for you.'
        ],
        mistakeIndex: 1,
        explanation: "'Is this a good time to talk?' is a common mistake! It gives the client an easy way to end the call. Get straight to the value proposition instead."
      },
      {
        transcript: [
          "Agent: I'd like to tell you about our new project.",
          'Agent: *continues explaining for 5 minutes straight*',
          'Agent: So, what do you think?'
        ],
        mistakeIndex: 1,
        explanation: "Length of message is a mistake! Long monologues lose the client's attention. Keep messages concise and engage the client."
      },
      {
        transcript: [
          'Agent: Hello, this is regarding real estate.',
          "Client: I'm not interested.",
          'Agent: Oh, okay. Sorry to bother you. Goodbye.'
        ],
        mistakeIndex: 2,
        explanation: "Stop when you should proceed! Don't give up at first resistance. The presentation says 'Don't stop when you should proceed.'"
      },
      {
        transcript: [
          'Agent: This unit has features.',
          'Agent: It comes with things.',
          'Agent: Please consider it.'
        ],
        mistakeIndex: 0,
        explanation: "Unclear benefits! 'Features' and 'things' are vague. Be specific about what benefits the client will receive."
      },
      {
        transcript: [
          'Agent: Good morning, how are you today?',
          'Agent: I wanted to share something that might help with your property goals.',
          "Agent: You mentioned wanting something near schools - I have exactly that."
        ],
        mistakeIndex: -1,
        explanation: "This is actually a GOOD call! Personalized, benefit-focused, and references the client's stated needs. No mistakes here!"
      }
    ];

    const mistakeQuestionsEg = [
      {
        transcript: [
          'الوكيل: صباح الفل!',
          'الوكيل: ينفع أتكلم دلوقتي؟',
          'الوكيل: عندي فرصة جامدة ليك.'
        ],
        mistakeIndex: 1,
        explanation: 'سؤال "ينفع أتكلم دلوقتي؟" غالبًا غلطة لأنه بيدي للعميل مخرج يقفل المكالمة بسهولة. ادخل على القيمة على طول.'
      },
      {
        transcript: [
          'الوكيل: أحب أحكيلك عن مشروع جديد عندنا.',
          'الوكيل: *يكمل شرح لوحده ٥ دقايق متواصل*',
          'الوكيل: إيه رأيك؟'
        ],
        mistakeIndex: 1,
        explanation: 'طول الرسالة غلطة. المونولوجات الطويلة بتضيّع تركيز العميل. خليك مختصر وادّي مساحة تفاعل.'
      },
      {
        transcript: [
          'الوكيل: ألو، بتكلمك بخصوص عقارات.',
          'العميل: مش مهتم.',
          'الوكيل: تمام، آسف على الإزعاج. مع السلامة.'
        ],
        mistakeIndex: 2,
        explanation: 'هنا بتقف وانت المفروض تكمل. متستسلمش من أول اعتراض؛ من المبادئ: متوقفش وانت لازم تكمل.'
      },
      {
        transcript: [
          'الوكيل: الوحدة دي فيها مميزات.',
          'الوكيل: ومعاها حاجات كتير.',
          'الوكيل: اتفضل فكر فيها.'
        ],
        mistakeIndex: 0,
        explanation: 'المميزات مش واضحة. كلام زي "مميزات" و"حاجات" عام جدًا. قول ميزة محددة وتأثيرها على العميل.'
      },
      {
        transcript: [
          'الوكيل: صباح الخير، أخبارك إيه؟',
          'الوكيل: عندي حاجة ممكن تساعدك في هدفك العقاري.',
          'الوكيل: حضرتك قلت عايز قريب من مدارس — عندي حاجة مناسبة جدًا.'
        ],
        mistakeIndex: -1,
        explanation: 'دي مكالمة كويسة فعلًا: شخصية، مركّزة على الفايدة، وبتربط بكلام العميل. مفيش غلط هنا.'
      }
    ];

    setCurrentQ(0);
    setSelected(null);
    setShowFeedback(false);
    setLocalScore(0);
    setStreak(0);
    setQuestions(shuffleArray(lang === 'eg' ? mistakeQuestionsEg : mistakeQuestionsEn));
  }, [lang]);

  const handleSelect = (idx) => {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);
    
    if (idx === questions[currentQ].mistakeIndex) {
      setLocalScore(prev => prev + 20);
      setStreak(prev => prev + 1);
      updateScore(20, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>{lang === 'eg' ? 'جارٍ التحميل…' : 'Loading...'}</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>🎯 {ui.activityNames.mistake}</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '40px' }}>📞</span>
        <h2 style={{ marginTop: '10px' }}>
          {lang === 'eg' ? 'فين الغلطة في نص المكالمة؟' : 'Find the MISTAKE in this call transcript!'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>
          {lang === 'eg' ? 'اضغط على السطر الغلط (أو اختار "مفيش غلط" لو كله تمام)' : 'Click the line with the error (or "No Mistakes" if it\'s clean)'}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {q.transcript.map((line, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            className={optionClass(idx, selected, q.mistakeIndex, showFeedback, idx)} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
          >
            <span style={{ fontSize: '20px' }}>🎯</span>
            <span>{line}</span>
          </button>
        ))}
        <button
          onClick={() => handleSelect(-1)}
          className={optionClass(999, selected, -1, showFeedback, -1)}
          style={{ textAlign: 'center' }}
        >
          ✓ {lang === 'eg' ? 'مفيش غلط — المكالمة تمام' : 'No Mistakes - This call is clean!'}
        </button>
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected === q.mistakeIndex} explanation={q.explanation} />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>
                🎉 {lang === 'eg'
                  ? `النتيجة: ${localScore}/${questions.length * 20}`
                  : `Score: ${localScore}/${questions.length * 20}`}
              </h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 24: Qualifying Quest
const QualifyingQuest = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];

  const [story, setStory] = useState(null);
  const [answers, setAnswers] = useState({ Destination: '', UnitType: '', Budget: '', Delivery: '' });
  const [showResult, setShowResult] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    const storiesEn = [
      {
        text: "Client says: 'So my wife and I have been looking around for months. We really like New Cairo, but 6th of October could work too. We need at least 3 bedrooms for the kids - probably a townhouse or twin house. Our budget is around 4 to 5 million, and we'd love to move in within the next year since our lease ends then.'",
        answers: {
          Destination: ['New Cairo', '6th of October'],
          UnitType: ['Townhouse', 'Twin House'],
          Budget: ['4-5 million', '4 to 5 million', '4M-5M'],
          Delivery: ['Within 1 year', 'Next year', 'When lease ends']
        }
      },
      {
        text: "Client says: 'I'm an investor looking for something in the North Coast area. I'm thinking a chalet or apartment that I can rent out in summer. I don't want to spend more than 2 million. Timing isn't urgent - even 2-3 years is fine if it's off-plan with good payment terms.'",
        answers: {
          Destination: ['North Coast'],
          UnitType: ['Chalet', 'Apartment'],
          Budget: ['2 million', 'Under 2M', 'Max 2 million'],
          Delivery: ['2-3 years', 'Not urgent', 'Off-plan']
        }
      }
    ];

    const storiesEg = [
      {
        text: 'العميل بيقول: "أنا ومراتي بندوّر بقالنا شهور. عاجبنا القاهرة الجديدة، وممكن كمان ٦ أكتوبر. محتاجين على الأقل ٣ غرف عشان الأولاد — غالبًا تاون هاوس أو توين هاوس. الميزانية حوالي ٤ لـ ٥ مليون، ونتمنى نستلم خلال سنة عشان الإيجار بينتهي ساعتها."',
        answers: {
          Destination: ['القاهرة الجديدة', '٦ أكتوبر'],
          UnitType: ['تاون هاوس', 'توين هاوس'],
          Budget: ['٤ لـ ٥ مليون', '٤-٥ مليون', 'من ٤ ل ٥ مليون'],
          Delivery: ['خلال سنة', 'السنة الجاية', 'وقت انتهاء الإيجار']
        }
      },
      {
        text: 'العميل بيقول: "أنا مستثمر وبدور على حاجة في الساحل الشمالي. بفكر في شاليه أو شقة أأجرها في الصيف. مش عايز أعدّي ٢ مليون. التوقيت مش مستعجل — حتى ٢ لـ ٣ سنين تمام لو أوف بلان وبنظام سداد كويس."',
        answers: {
          Destination: ['الساحل الشمالي'],
          UnitType: ['شاليه', 'شقة'],
          Budget: ['٢ مليون', 'أقل من ٢ مليون', 'حد أقصى ٢ مليون'],
          Delivery: ['٢ لـ ٣ سنين', 'مش مستعجل', 'أوف بلان']
        }
      }
    ];

    setStory(getRandomItem(lang === 'eg' ? storiesEg : storiesEn));
    setAnswers({ Destination: '', UnitType: '', Budget: '', Delivery: '' });
    setShowResult(false);
    setLocalScore(0);
  }, [lang]);

  const handleChange = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const checkAnswers = () => {
    let score = 0;
    const fields = ['Destination', 'UnitType', 'Budget', 'Delivery'];
    
    fields.forEach(field => {
      const userAnswer = answers[field].toLowerCase().trim();
      const correctAnswers = story.answers[field].map(a => a.toLowerCase());
      if (correctAnswers.some(correct => userAnswer.includes(correct) || correct.includes(userAnswer))) {
        score += 25;
      }
    });
    
    setLocalScore(score);
    updateScore(score, score >= 75);
    setShowResult(true);
  };

  if (!story) return <div>{lang === 'eg' ? 'جارٍ التحميل…' : 'Loading...'}</div>;

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeBlue }}>🔍 {ui.activityNames.qualifying}</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '40px' }}>📋</span>
        <h2 style={{ marginTop: '10px' }}>
          {lang === 'eg' ? 'طلّع الأربع عناصر الأساسية من طلب العميل!' : 'Extract the 4 Key Request Items!'}
        </h2>
      </div>

      <div style={{ 
        background: 'rgba(0,0,0,0.4)', 
        padding: '25px', 
        borderRadius: '12px', 
        marginBottom: '25px' 
      }}>
        <p style={{ fontSize: '16px', lineHeight: '1.8' }}>{story.text}</p>
      </div>

      <div style={styles.grid2}>
        {['Destination', 'UnitType', 'Budget', 'Delivery'].map(field => (
          <div key={field} style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
              {lang === 'eg'
                ? (field === 'Destination' ? 'الوجهة/المنطقة' : field === 'UnitType' ? 'نوع الوحدة' : field === 'Budget' ? 'الميزانية' : 'ميعاد الاستلام')
                : (field === 'UnitType' ? 'Unit Type' : field)}:
            </label>
            <input
              type="text"
              value={answers[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              disabled={showResult}
              placeholder={
                lang === 'eg'
                  ? (field === 'Destination' ? 'اكتب المنطقة…' : field === 'UnitType' ? 'اكتب نوع الوحدة…' : field === 'Budget' ? 'اكتب الميزانية…' : 'اكتب ميعاد الاستلام…')
                  : `Enter ${field.toLowerCase()}...`
              }
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: showResult 
                  ? (story.answers[field].some(a => answers[field].toLowerCase().includes(a.toLowerCase())) 
                    ? '2px solid #48bb78' 
                    : '2px solid #f56565')
                  : '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '16px'
              }}
            />
            {showResult && (
              <div style={{ fontSize: '12px', marginTop: '5px', color: 'rgba(255,255,255,0.6)' }}>
                {lang === 'eg' ? 'إجابات مقبولة:' : 'Acceptable:'} {story.answers[field].join(' / ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {!showResult && (
        <button 
          onClick={checkAnswers} 
          style={{ ...styles.primaryBtn, display: 'block', margin: '20px auto' }}
          disabled={Object.values(answers).some(a => !a.trim())}
        >
          {lang === 'eg' ? 'سلّم الإجابات ✓' : 'Submit Answers ✓'}
        </button>
      )}

      {showResult && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <h3>{lang === 'eg' ? `النتيجة: ${localScore}/١٠٠` : `Score: ${localScore}/100`}</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>
            {lang === 'eg'
              ? 'الأربع عناصر الأساسية في الكواليـفاي: الوجهة/المنطقة، نوع الوحدة، الميزانية، وميعاد الاستلام.'
              : 'The 4 key qualification items are: Destination, Unit Type, Budget, and Delivery Timeline.'}
          </p>
          <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
        </div>
      )}
    </div>
  );
};

// ============================================
// ACTIVITY MODULES - PHASE 4 (25-35) + MAIN APP
// ============================================

// Activity 25: Dress Code Police
const DressCodePolice = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];
  const TD = getTrainingData(lang);

  const [scenarios, setScenarios] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userCount, setUserCount] = useState('');
  const [userVerdict, setUserVerdict] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const accessories = TD.dressCode.accessories;
    const newScenarios = [];
    
    for (let i = 0; i < 8; i++) {
      const count = Math.floor(Math.random() * 8) + 3; // 3-10 accessories
      const items = getRandomItems(accessories, count);
      newScenarios.push({
        items,
        count,
        isViolation: count > 7
      });
    }
    setScenarios(newScenarios);
  }, [lang]);

  const handleSubmit = () => {
    if (userCount === '' || userVerdict === null) return;
    
    const scenario = scenarios[currentIdx];
    const countCorrect = parseInt(userCount) === scenario.count;
    const verdictCorrect = userVerdict === scenario.isViolation;
    
    let points = 0;
    if (countCorrect) points += 5;
    if (verdictCorrect) points += 10;
    
    setLocalScore(prev => prev + points);
    if (countCorrect && verdictCorrect) {
      setStreak(prev => prev + 1);
      updateScore(points, true);
    } else {
      setStreak(0);
      updateScore(points, false);
    }
    setShowResult(true);
  };

  const nextScenario = () => {
    if (currentIdx < scenarios.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setUserCount('');
      setUserVerdict(null);
      setShowResult(false);
    }
  };

  if (scenarios.length === 0) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const scenario = scenarios[currentIdx];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>👮 {ui.activityNames.dresspolice || (lang === 'eg' ? 'شرطة اللبس' : 'Dress Code Police')}</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={scenarios.length} currentQuestion={currentIdx + 1} />
      </div>

      <ProgressBar current={currentIdx + 1} total={scenarios.length} />

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '50px' }}>👔</span>
        <h2 style={{ marginTop: '10px' }}>Count & Judge!</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Remember: Maximum 7 points of interest allowed</p>
      </div>

      <div style={{ 
        background: 'rgba(0,0,0,0.4)', 
        padding: '25px', 
        borderRadius: '12px', 
        marginBottom: '25px' 
      }}>
        <h4 style={{ marginBottom: '15px' }}>Agent is wearing:</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {scenario.items.map((item, idx) => (
            <span key={idx} style={{
              padding: '8px 15px',
              background: 'rgba(229,62,62,0.2)',
              borderRadius: '20px',
              fontSize: '14px'
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {!showResult && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}>How many accessories did you count?</label>
            <input
              type="number"
              min="1"
              max="15"
              value={userCount}
              onChange={(e) => setUserCount(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '20px',
                width: '100px',
                textAlign: 'center'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}>Does this VIOLATE the Rule of 7?</label>
            <div style={styles.grid2}>
              <button
                onClick={() => setUserVerdict(true)}
                className={`game-option game-option--red${userVerdict === true ? ' game-option--correct' : ''}`}
                style={{ textAlign: 'center' }}
              >
                🚫 VIOLATION
              </button>
              <button
                onClick={() => setUserVerdict(false)}
                className={`game-option game-option--green${userVerdict === false ? ' game-option--correct' : ''}`}
                style={{ textAlign: 'center' }}
              >
                ✓ ACCEPTABLE
              </button>
            </div>
          </div>

          <button 
            onClick={handleSubmit} 
            style={styles.primaryBtn}
            disabled={userCount === '' || userVerdict === null}
          >
            Submit Judgment
          </button>
        </>
      )}

      {showResult && (
        <>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
            <p><strong>Actual count:</strong> {scenario.count} accessories</p>
            <p><strong>Your count:</strong> {userCount} {parseInt(userCount) === scenario.count ? '✅' : '❌'}</p>
            <p><strong>Verdict:</strong> {scenario.isViolation ? 'VIOLATION (more than 7)' : 'Acceptable (7 or fewer)'}</p>
            <p><strong>Your verdict:</strong> {userVerdict ? 'Violation' : 'Acceptable'} {userVerdict === scenario.isViolation ? '✅' : '❌'}</p>
          </div>
          
          {currentIdx < scenarios.length - 1 ? (
            <NextButton onClick={nextScenario} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <h3>🎉 Score: {localScore}/{scenarios.length * 15}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 26: Skills Radar
const SkillsRadar = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];

  const [scenario, setScenario] = useState(null);
  const [ratings, setRatings] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  const skills = TD.agentSkills.skills;

  useEffect(() => {
    const scenarios = lang === 'eg'
      ? [
          {
            description: 'وكيلة سارة: بتتكلم بثقة بس كانت بتقاطع العميل كتير. فاهمة تفاصيل الوحدة كويس بس مش عارفة ترد على أسئلة عن المنطقة. مظهرها محترم، بس كانت بتبص في تليفونها أثناء المقابلة ومتابعتش بعد المقابلة.',
            expectedRatings: {
              'ثقة': 4,
              'تواصل قوي': 2,
              'معرفة': 3,
              'مظهر لائق': 5,
              'إدارة وقت قوية': 2,
              'مرونة': 2,
              'مهارة تفاوض': 3,
              'إغلاق بيع قوي': 1
            }
          },
          {
            description: 'وكيل عمر: سمع احتياجات العميل كويس وسأل أسئلة متابعة ممتازة. عدّل عرضه لما لاحظ إن العميل مهتم أكتر بالعائد الاستثماري. كان عنده صعوبة يشرح شروط الدفع بوضوح. دايمًا في معاده ومجهّز. وقدر يحدد مع العميل ميعاد معاينة.',
            expectedRatings: {
              'ثقة': 4,
              'تواصل قوي': 5,
              'معرفة': 3,
              'مظهر لائق': 4,
              'إدارة وقت قوية': 5,
              'مرونة': 5,
              'مهارة تفاوض': 4,
              'إغلاق بيع قوي': 5
            }
          }
        ]
      : [
          {
            description: "Agent Sarah: Spoke confidently but interrupted the client multiple times. Knew the property details well but couldn't answer questions about the neighborhood. Dressed professionally. Kept checking her phone during the meeting. Didn't follow up after the meeting.",
            expectedRatings: {
              "Confidence": 4,
              "Strong communication skills": 2,
              "Knowledge": 3,
              "Presentable": 5,
              "Strong time management skills": 2,
              "Flexibility": 2,
              "Negotiation skills": 3,
              "Strong closure techniques": 1
            }
          },
          {
            description: "Agent Omar: Listened carefully to client needs and asked great follow-up questions. Adapted his presentation when he noticed the client was more interested in investment returns. Struggled to explain payment terms clearly. Always on time and well-prepared. Successfully got the client to schedule a site visit.",
            expectedRatings: {
              "Confidence": 4,
              "Strong communication skills": 5,
              "Knowledge": 3,
              "Presentable": 4,
              "Strong time management skills": 5,
              "Flexibility": 5,
              "Negotiation skills": 4,
              "Strong closure techniques": 5
            }
          }
        ];

    setScenario(getRandomItem(scenarios));
    
    const initialRatings = {};
    skills.forEach(skill => { initialRatings[skill] = 3; });
    setRatings(initialRatings);
  }, [lang]);

  const handleRating = (skill, value) => {
    setRatings(prev => ({ ...prev, [skill]: value }));
  };

  const submitRatings = () => {
    let totalDiff = 0;
    skills.forEach(skill => {
      totalDiff += Math.abs(ratings[skill] - scenario.expectedRatings[skill]);
    });
    
    const maxScore = 100;
    const score = Math.max(0, maxScore - (totalDiff * 5));
    setLocalScore(score);
    updateScore(score, score >= 60);
    setShowResult(true);
  };

  if (!scenario) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>📊 {ui.activityNames.skills}</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '40px' }}>🎯</span>
        <h2 style={{ marginTop: '10px' }}>{lang === 'eg' ? 'قيّم مهارات الوكيل' : "Rate this Agent's Skills"}</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>{lang === 'eg' ? 'بناءً على السيناريو: قيّم كل مهارة من ١ لـ ٥' : 'Based on the scenario, rate each skill from 1-5'}</p>
      </div>

      <div style={{ 
        background: 'rgba(0,0,0,0.4)', 
        padding: '25px', 
        borderRadius: '12px', 
        marginBottom: '25px' 
      }}>
        <p style={{ lineHeight: '1.8' }}>{scenario.description}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {skills.map(skill => (
          <div key={skill} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '15px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            <span style={{ flex: 1 }}>{skill}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  onClick={() => !showResult && handleRating(skill, value)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: showResult ? 'default' : 'pointer',
                    background: ratings[skill] >= value 
                      ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                      : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontWeight: '600'
                  }}
                >
                  {value}
                </button>
              ))}
              {showResult && (
                <span style={{ 
                  marginLeft: '10px', 
                  color: Math.abs(ratings[skill] - scenario.expectedRatings[skill]) <= 1 ? '#48bb78' : '#f56565'
                }}>
                  {lang === 'eg' ? `(المتوقع: ${scenario.expectedRatings[skill]})` : `(Expected: ${scenario.expectedRatings[skill]})`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!showResult ? (
        <button onClick={submitRatings} style={styles.primaryBtn}>
          {lang === 'eg' ? 'سلّم التقييم' : 'Submit Ratings'}
        </button>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h3>{lang === 'eg' ? `النتيجة: ${localScore}/١٠٠` : `Score: ${localScore}/100`}</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>
            {lang === 'eg'
              ? (localScore >= 80 ? 'تقييم ممتاز!' : localScore >= 60 ? 'شغل كويس!' : 'كمّل تمرين على ملاحظة التفاصيل!')
              : (localScore >= 80 ? 'Excellent assessment!' : localScore >= 60 ? 'Good job!' : 'Keep practicing your observation skills!')}
          </p>
          <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
        </div>
      )}
    </div>
  );
};

// Activity 27: First Impression Time Trial
const FirstImpressionTrial = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];
  const TD = getTrainingData(lang);

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    const impressionQuestionsEn = [
      { 
        opening: "Hey, so like, I got your number from somewhere and wanted to talk about some property stuff maybe?",
        isGood: false,
        explanation: "Unprofessional opening - vague, uncertain, and doesn't inspire confidence."
      },
      { 
        opening: "Good morning! I'm reaching out because I noticed you're interested in properties in New Cairo - I specialize in that area and have some opportunities I think you'd love.",
        isGood: true,
        explanation: "Professional, specific, shows research, and immediately provides value."
      },
      { 
        opening: "Hi, is this Ahmed? Great! Listen, you NEED to buy this property RIGHT NOW because it's selling fast!",
        isGood: false,
        explanation: "Too pushy and aggressive. Creates pressure, not trust."
      },
      { 
        opening: "Hello, I hope I'm not bothering you. Sorry to call. I know you're probably busy...",
        isGood: false,
        explanation: "Apologetic and lacks confidence. First impressions need assurance, not uncertainty."
      },
      { 
        opening: "Good afternoon! Based on your interest in investment properties, I've put together some options that match your criteria. Do you have a few minutes to discuss?",
        isGood: true,
        explanation: "Confident, personalized, respectful of their time, and offers clear value."
      }
    ];

    const impressionQuestionsEg = [
      {
        opening: 'ألو… أنا جبت رقمك من مكان كده وحبيت أكلمك في موضوع عقارات يعني…',
        isGood: false,
        explanation: 'افتتاحية غير احترافية: كلام عام ومتلخبط ومش بيدي ثقة.'
      },
      {
        opening: 'صباح الخير! بكلمك عشان لاحظت اهتمامك بوحدات في القاهرة الجديدة — أنا متخصص هناك وعندي كام اختيار مناسبين ليك.',
        isGood: true,
        explanation: 'احترافي ومحدد وبيوضح إنك فاهم طلبه وبتقدم قيمة من أول ثانية.'
      },
      {
        opening: 'ألو يا أستاذ… لازم تشتري دلوقتي حالًا عشان الوحدة بتطير!',
        isGood: false,
        explanation: 'ضغط وهجوم بدري بيكسر الثقة. الانطباع الأول محتاج هدوء وثقة مش تهديد.'
      },
      {
        opening: 'أنا آسف إني بكلمك… أكيد حضرتك مشغول… معلش…',
        isGood: false,
        explanation: 'اعتذار زيادة وعدم ثقة. الانطباع الأول محتاج طمأنة وثبات.'
      },
      {
        opening: 'مساء الخير! بناءً على اهتمامك بالاستثمار، جهّزتلك اختيارات على نفس معاييرك. ينفع ناخد دقيقتين نتكلم؟',
        isGood: true,
        explanation: 'واثق وشخصي ومحترم للوقت وبيقدم قيمة واضحة.'
      }
    ];

    setCurrentQ(0);
    setSelected(null);
    setShowFeedback(false);
    setLocalScore(0);
    setTimeLeft(3);
    setTimerActive(true);
    setQuestions(shuffleArray(lang === 'eg' ? impressionQuestionsEg : impressionQuestionsEn));
  }, [lang]);

  useEffect(() => {
    if (timerActive && timeLeft > 0 && !showFeedback) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showFeedback) {
      handleTimeout();
    }
  }, [timeLeft, timerActive, showFeedback]);

  const handleTimeout = () => {
    setShowFeedback(true);
    setSelected(null);
    updateScore(0, false);
  };

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setTimerActive(false);
    setSelected(answer);
    setShowFeedback(true);
    
    if (answer === questions[currentQ].isGood) {
      const bonus = timeLeft > 0 ? timeLeft * 5 : 0;
      setLocalScore(prev => prev + 20 + bonus);
      updateScore(20 + bonus, true);
    } else {
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
      setTimeLeft(3);
      setTimerActive(true);
    }
  };

  if (questions.length === 0) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>⚡ {ui.activityNames.impression}</span>
        <ScorePanel score={localScore} streak={0} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      {!showFeedback && (
        <div style={{ ...styles.timer, color: timeLeft <= 1 ? '#f093fb' : '#667eea' }}>
          ⏱️ {timeLeft}{lang === 'eg' ? 'ث' : 's'}
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2>{lang === 'eg' ? 'بسرعة! الانطباع الأول كويس ولا وحش؟' : 'Quick! Good or Bad First Impression?'}</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
          {lang === 'eg' ? `فاكر: ${TD.firstImpression.quote}` : 'Remember: You never have a second chance to make a first impression!'}
        </p>
      </div>

      <div style={{ 
        background: 'rgba(0,0,0,0.4)', 
        padding: '30px', 
        borderRadius: '16px', 
        marginBottom: '25px',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '30px' }}>🗣️</span>
        <p style={{ fontSize: '18px', marginTop: '15px', lineHeight: '1.6', fontStyle: 'italic' }}>
          "{q.opening}"
        </p>
      </div>

      <div style={styles.grid2}>
        <button
          onClick={() => handleAnswer(true)}
          className={tfClass(true, selected, q.isGood, showFeedback)}
          style={{ padding: '30px', textAlign: 'center' }}
        >
          <span style={{ fontSize: '40px' }}>👍</span>
          <div style={{ marginTop: '10px', fontWeight: '600' }}>{lang === 'eg' ? 'كويس' : 'GOOD'}</div>
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className={tfClass(false, selected, !q.isGood, showFeedback)}
          style={{ padding: '30px', textAlign: 'center' }}
        >
          <span style={{ fontSize: '40px' }}>👎</span>
          <div style={{ marginTop: '10px', fontWeight: '600' }}>{lang === 'eg' ? 'وحش' : 'BAD'}</div>
        </button>
      </div>

      {showFeedback && (
        <>
          {selected === null && (
            <div style={{ ...styles.feedbackIncorrect, textAlign: 'center' }}>
              <span style={{ fontSize: '24px' }}>⏰</span>
              <p style={{ marginTop: '10px' }}>{lang === 'eg' ? 'الوقت خلص! الانطباع الأول بييجي بسرعة!' : "Time's up! First impressions happen fast!"}</p>
            </div>
          )}
          <Feedback 
            isCorrect={selected === q.isGood} 
            explanation={q.explanation}
          />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>🎉 {lang === 'eg' ? `النتيجة: ${localScore}` : `Score: ${localScore}`}</h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 28: Objection Deflector
const ObjectionDeflector = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const objectionQuestionsEn = [
      {
        objection: "I only want Resale properties - I need to move in immediately.",
        responses: [
          { text: "I understand the urgency! While resales are RTM, they require full cash. With primary, you could get better payment terms and find an RTM unit from a developer's ready stock.", correct: true },
          { text: "Resale is a bad idea. You should only buy from developers.", correct: false },
          { text: "Okay, I only have primary properties, so I can't help you.", correct: false },
          { text: "Let me check if we have any resales available.", correct: false }
        ],
        explanation: "Acknowledge their need (RTM/urgency), but present the benefits of primary (payment terms) while offering a solution (ready stock from developers)."
      },
      {
        objection: "Why should I use a broker? I can go directly to the developer.",
        responses: [
          { text: "Developers don't know what they're doing.", correct: false },
          { text: "We're cheaper than developers.", correct: false },
          { text: "Great question! As a broker, I offer consultancy across diverse projects, giving you more market awareness and opportunities. Developers are limited to their own projects.", correct: true },
          { text: "Fine, go to the developer then.", correct: false }
        ],
        explanation: "Brokers offer: consultancy (not just sales), diverse projects, more market awareness, and less walk out. These are the key differentiators from the presentation."
      },
      {
        objection: "I don't have cash for a resale. What are my options?",
        responses: [
          { text: "You need cash for any property purchase.", correct: false },
          { text: "Perfect! Primary properties from developers offer installment plans, not just cash. Most primary units are off-plan with flexible payment terms.", correct: true },
          { text: "Try to get a loan.", correct: false },
          { text: "Resale is the only good option, so you need to find cash.", correct: false }
        ],
        explanation: "Primary sales from developers offer installment options, unlike resale which requires cash. This is a key differentiator from the presentation."
      },
      {
        objection: "I'm worried about buying off-plan - what if it's never finished?",
        responses: [
          { text: "That's a valid concern. I work with established developers with strong track records. Plus, primary off-plan offers better prices and payment flexibility compared to RTM resales.", correct: true },
          { text: "Don't worry, it will be fine.", correct: false },
          { text: "You're right, only buy ready properties.", correct: false },
          { text: "That never happens.", correct: false }
        ],
        explanation: "Acknowledge the concern, then address it with facts (track record) while presenting the benefits of off-plan (price, payment terms)."
      }
    ];

    const objectionQuestionsEg = [
      {
        objection: 'أنا عايز ريسيل بس — محتاج أستلم وأسكن فورًا.',
        responses: [
          { text: 'فاهم استعجالك. الريسيل غالبًا جاهز للسكن بس بيحتاج كاش. في البرايمري ممكن تلاقي جاهز استلام من مخزون المطوّر وبنظام سداد أحسن.', correct: true },
          { text: 'الريسيل فكرة وحشة. لازم تشتري من مطوّر وبس.', correct: false },
          { text: 'أنا عندي برايمري بس، يبقى مش هقدر أساعدك.', correct: false },
          { text: 'تمام، هدوّرلك على ريسيل وخلاص.', correct: false }
        ],
        explanation: 'إقرار بالاستعجال + حل عملي: جاهز استلام من المطوّر مع ميزة السداد في البرايمري.'
      },
      {
        objection: 'ليه أتعامل مع بروكر؟ أنا ممكن أروح للمطوّر على طول.',
        responses: [
          { text: 'المطوّرين مش فاهمين شغلهم.', correct: false },
          { text: 'إحنا أرخص من المطوّر.', correct: false },
          { text: 'سؤال مهم. أنا كبروكر بقدملك استشارة عبر مشاريع كتير، وده بيديك وعي سوق وفرص أكتر. المطوّر محدود في مشروعه بس.', correct: true },
          { text: 'خلاص روح للمطوّر.', correct: false }
        ],
        explanation: 'ميزة البروكر: استشارة + مشاريع متنوعة + وعي سوق + فرص أكتر (وده من أساسيات المادة).'
      },
      {
        objection: 'مش معايا كاش لريسيل. إيه الحل؟',
        responses: [
          { text: 'لازم كاش لأي شراء عقار.', correct: false },
          { text: 'تمام جدًا. البرايمري من المطوّر بيبقى بأقساط ونُظم سداد، ومش لازم كاش زي الريسيل.', correct: true },
          { text: 'خد قرض وخلاص.', correct: false },
          { text: 'الريسيل هو الحل الوحيد، لازم تدبّر كاش.', correct: false }
        ],
        explanation: 'الريسيل عادة كاش؛ البرايمري عادة أقساط ونُظم سداد مرنة.'
      },
      {
        objection: 'قلقان من الأوف بلان… لو المشروع ما خلصش؟',
        responses: [
          { text: 'قلقك طبيعي. بنشتغل مع مطوّرين ليهم سابقة أعمال قوية. وكمان الأوف بلان بيبقى سعره أحسن ومرن في السداد مقارنة بالجاهز.', correct: true },
          { text: 'متقلقش، كله هيبقى تمام.', correct: false },
          { text: 'عندك حق، اشتري جاهز بس.', correct: false },
          { text: 'ده عمره ما بيحصل.', correct: false }
        ],
        explanation: 'إقرار بالقلق + طمأنة مبنية على سابقة أعمال + عرض فوائد الأوف بلان (سعر/سداد).'
      }
    ];

    setCurrentQ(0);
    setSelected(null);
    setShowFeedback(false);
    setLocalScore(0);
    setStreak(0);
    setQuestions(shuffleArray(lang === 'eg' ? objectionQuestionsEg : objectionQuestionsEn));
  }, [lang]);

  const handleAnswer = (response) => {
    if (showFeedback) return;
    setSelected(response);
    setShowFeedback(true);
    
    if (response.correct) {
      setLocalScore(prev => prev + 25);
      setStreak(prev => prev + 1);
      updateScore(25, true);
    } else {
      setStreak(0);
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const q = questions[currentQ];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>🛡️ {ui.activityNames.objection}</span>
        <ScorePanel score={localScore} streak={streak} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <div style={{ 
        background: 'rgba(245,101,101,0.1)', 
        padding: '25px', 
        borderRadius: '16px', 
        marginBottom: '25px',
        border: '1px solid rgba(245,101,101,0.3)'
      }}>
        <span style={{ fontSize: '30px' }}>😤</span>
        <p style={{ fontSize: '18px', marginTop: '10px', fontWeight: '500' }}>
          {lang === 'eg' ? 'اعتراض العميل:' : 'Client objection:'} "{q.objection}"
        </p>
      </div>

      <h3 style={{ marginBottom: '20px' }}>{lang === 'eg' ? 'اختار أفضل رد:' : 'Choose the best response:'}</h3>

      <div>
        {q.responses.map((response, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(response)}
            className={`game-option game-option--${['blue','pink','amber','green'][idx % 4]}${showFeedback && response.correct ? ' game-option--correct' : ''}${showFeedback && selected === response && !response.correct ? ' game-option--incorrect' : ''}${showFeedback && selected !== response && !response.correct ? ' game-option--dimmed' : ''}`}
          >
            {response.text}
          </button>
        ))}
      </div>

      {showFeedback && (
        <>
          <Feedback isCorrect={selected?.correct} explanation={q.explanation} />
          {currentQ < questions.length - 1 ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3>
                🎉 {lang === 'eg'
                  ? `النتيجة: ${localScore}/${questions.length * 25}`
                  : `Score: ${localScore}/${questions.length * 25}`}
              </h3>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Activity 29: Lead Triage
const LeadTriage = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];

  const [leads, setLeads] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    const leadOptionsEn = [
      {
        type: 'Broker Lead',
        description: 'Client referred by a broker, already qualified, looking for specific units',
        walkOut: 'Low',
        priority: 1,
        reason: 'Brokers have less walk out and provide consultancy - leads are pre-qualified'
      },
      {
        type: 'Developer Sales Lead',
        description: 'Walk-in client at developer showroom, browsing options',
        walkOut: 'High',
        priority: 3,
        reason: 'Developers have more walk out - these clients may just be browsing'
      },
      {
        type: 'Resale Buyer',
        description: 'Investor with cash ready, wants RTM property immediately',
        walkOut: 'Medium',
        priority: 2,
        reason: 'Cash buyers are serious, but resale process can have complications'
      }
    ];

    const leadOptionsEg = [
      {
        type: 'ليد بروكر',
        description: 'عميل جاي عن طريق بروكر — غالبًا متأهل وعايز حاجة محددة',
        walkOut: 'Low',
        priority: 1,
        reason: 'ليدز البروكر عادة نسبة الانسحاب أقل وبيكون في استشارة وتأهيل مسبق.'
      },
      {
        type: 'ليد ديفيلوبر (ووك-إن)',
        description: 'عميل داخل على شو روم المطوّر وبيتفرّج على اختيارات',
        walkOut: 'High',
        priority: 3,
        reason: 'ليدز المطوّر غالبًا نسبة الانسحاب أعلى لأن ناس كتير بتبقى بتشوف وبس.'
      },
      {
        type: 'مشتري ريسيل',
        description: 'مستثمر جاهز كاش وعايز جاهز للسكن بسرعة',
        walkOut: 'Medium',
        priority: 2,
        reason: 'الكاش بيبقى جاد، بس الريسيل ممكن يبقى فيه تفاصيل/تعقيدات أكتر.'
      }
    ];

    setLeads(shuffleArray(lang === 'eg' ? leadOptionsEg : leadOptionsEn));
    setRanking([]);
    setShowResult(false);
    setLocalScore(0);
  }, [lang]);

  const walkOutLabel = (level) => {
    if (lang !== 'eg') return level;
    if (level === 'Low') return 'قليل';
    if (level === 'High') return 'عالي';
    return 'متوسط';
  };

  const addToRanking = (lead) => {
    if (ranking.includes(lead)) return;
    setRanking(prev => [...prev, lead]);
  };

  const removeFromRanking = (lead) => {
    setRanking(prev => prev.filter(l => l !== lead));
  };

  const checkRanking = () => {
    const correctOrder = [...leads].sort((a, b) => a.priority - b.priority);
    let score = 0;
    
    ranking.forEach((lead, idx) => {
      if (lead.priority === correctOrder[idx].priority) {
        score += 33;
      }
    });
    
    setLocalScore(Math.min(100, score));
    updateScore(score, score >= 66);
    setShowResult(true);
  };

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeBlue }}>🚨 {ui.activityNames.triage}</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '40px' }}>📊</span>
        <h2 style={{ marginTop: '10px' }}>
          {lang === 'eg' ? 'رتّب الليدز حسب احتمالية القفل' : 'Rank Leads by Likelihood to Close'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
          {lang === 'eg'
            ? 'بناءً على نسبة الانسحاب (Walk-out): رتّب من الأكثر للأقل'
            : 'Based on walk-out rates, rank from MOST to LEAST likely'}
        </p>
      </div>

      {/* Available Leads */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>{lang === 'eg' ? 'الليدز المتاحة:' : 'Available Leads:'}</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {leads.filter(l => !ranking.includes(l)).map((lead, idx) => (
            <button
              key={idx}
              onClick={() => addToRanking(lead)}
              disabled={showResult}
              className={`game-option game-option--${['blue','pink','amber','green','purple','cyan'][idx % 6]}`}
              style={{ flex: '1 1 200px', opacity: showResult ? 0.5 : 1 }}
            >
              <div style={{ fontWeight: '600' }}>{lead.type}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '5px' }}>
                {lead.description}
              </div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>
                {lang === 'eg' ? 'الانسحاب:' : 'Walk-out:'}{' '}
                <span style={{ color: lead.walkOut === 'Low' ? '#48bb78' : lead.walkOut === 'High' ? '#f56565' : '#ed8936' }}>
                  {walkOutLabel(lead.walkOut)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ranking Area */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>
          {lang === 'eg' ? 'ترتيبك (من الأكثر للأقل):' : 'Your Ranking (Most → Least Likely):'}
        </h4>
        {[1, 2, 3].map(position => (
          <div key={position} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            padding: '15px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            marginBottom: '10px',
            border: showResult && ranking[position - 1]
              ? (ranking[position - 1].priority === position ? '2px solid #48bb78' : '2px solid #f56565')
              : '2px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700'
            }}>
              {position}
            </div>
            <div style={{ flex: 1 }}>
              {ranking[position - 1] ? (
                <div>
                  <strong>{ranking[position - 1].type}</strong>
                  {showResult && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '5px' }}>
                      {ranking[position - 1].reason}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {lang === 'eg' ? 'اضغط على ليد عشان تضيفه…' : 'Click a lead to add...'}
                </span>
              )}
            </div>
            {ranking[position - 1] && !showResult && (
              <button 
                onClick={() => removeFromRanking(ranking[position - 1])}
                style={{ ...styles.secondaryBtn, padding: '5px 10px' }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {!showResult && ranking.length === 3 && (
        <button onClick={checkRanking} style={styles.primaryBtn}>
          {lang === 'eg' ? 'سلّم الترتيب ✓' : 'Submit Ranking ✓'}
        </button>
      )}

      {showResult && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <h3>{lang === 'eg' ? `النتيجة: ${localScore}/١٠٠` : `Score: ${localScore}/100`}</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>
            {lang === 'eg'
              ? 'عادةً: ليد البروكر أعلى احتمالية (انسحاب أقل)، بعده ريسيل كاش، وبعده ووك-إن المطوّر (انسحاب أكتر).'
              : 'Broker leads are most likely (less walk out), followed by cash-ready resale buyers, then developer walk-ins (more walk out).'}
          </p>
          <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
        </div>
      )}
    </div>
  );
};

// Activity 30: Request Form Builder
const RequestFormBuilder = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];
  const TD = getTrainingData(lang);

  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  const requiredFields = lang === 'eg'
    ? TD.clientQualification.requestItems
    : ['Destination', 'Unit Type', 'Budget', 'Delivery Timeline'];
  
  useEffect(() => {
    const allFieldsEn = [
      'Destination', 'Unit Type', 'Budget', 'Delivery Timeline',
      'Favorite Color', 'Pet Names', 'Horoscope Sign', 'Shoe Size',
      'Contact Number', 'Preferred View', 'Number of Bedrooms', 'Payment Method'
    ];
    const allFieldsEg = [
      'الوجهة/المنطقة', 'نوع الوحدة', 'الميزانية', 'ميعاد الاستلام',
      'لونك المفضل', 'اسم الحيوان الأليف', 'برجك', 'مقاس الجزمة',
      'رقم التواصل', 'الڤيو المفضل', 'عدد الغرف', 'طريقة الدفع'
    ];

    setAvailableFields(shuffleArray(lang === 'eg' ? allFieldsEg : allFieldsEn));
    setSelectedFields([]);
    setShowResult(false);
    setLocalScore(0);
  }, [lang]);

  const addField = (field) => {
    if (selectedFields.includes(field)) return;
    setSelectedFields(prev => [...prev, field]);
  };

  const removeField = (field) => {
    setSelectedFields(prev => prev.filter(f => f !== field));
  };

  const checkForm = () => {
    let score = 0;
    const correctCount = selectedFields.filter(f => requiredFields.includes(f)).length;
    const incorrectCount = selectedFields.filter(f => !requiredFields.includes(f)).length;
    
    score = (correctCount * 25) - (incorrectCount * 10);
    score = Math.max(0, Math.min(100, score));
    
    setLocalScore(score);
    updateScore(score, correctCount === 4 && incorrectCount === 0);
    setShowResult(true);
  };

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>📋 {ui.activityNames.form}</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '40px' }}>📝</span>
        <h2 style={{ marginTop: '10px' }}>
          {lang === 'eg' ? 'ابني فورم كواليـفاي مظبوط للعميل' : "Build the Perfect Client Qualification Form"}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
          {lang === 'eg'
            ? 'اختار الأربع خانات الأساسية اللي لازم تسألهم في طلب العميل'
            : "Select the 4 essential fields for qualifying a client's request"}
        </p>
      </div>

      {/* Available Fields */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ marginBottom: '10px' }}>
          {lang === 'eg' ? 'الخانات المتاحة:' : 'Available Fields:'}
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {availableFields.filter(f => !selectedFields.includes(f)).map((field, idx) => (
            <button
              key={idx}
              onClick={() => addField(field)}
              disabled={showResult}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                cursor: showResult ? 'default' : 'pointer'
              }}
            >
              + {field}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Fields (Form Preview) */}
      <div style={{ 
        background: 'rgba(0,0,0,0.4)', 
        padding: '25px', 
        borderRadius: '16px', 
        marginBottom: '20px' 
      }}>
        <h4 style={{ marginBottom: '15px' }}>
          📋 {lang === 'eg' ? 'فورم الكواليـفاي بتاعك:' : 'Your Qualification Form:'}
        </h4>
        {selectedFields.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>
            {lang === 'eg' ? 'اضغط على الخانات فوق عشان تضيفها للفورم…' : 'Click fields above to add them to your form...'}
          </p>
        ) : (
          selectedFields.map((field, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              background: showResult 
                ? (requiredFields.includes(field) ? 'rgba(72,187,120,0.2)' : 'rgba(245,101,101,0.2)')
                : 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              marginBottom: '8px',
              border: showResult 
                ? (requiredFields.includes(field) ? '1px solid #48bb78' : '1px solid #f56565')
                : '1px solid transparent'
            }}>
              <span>{field}</span>
              {!showResult && (
                <button onClick={() => removeField(field)} style={{ background: 'none', border: 'none', color: '#f56565', cursor: 'pointer' }}>
                  ✕
                </button>
              )}
              {showResult && (
                <span>{requiredFields.includes(field) ? '✅' : '❌'}</span>
              )}
            </div>
          ))
        )}
      </div>

      {!showResult && selectedFields.length >= 4 && (
        <button onClick={checkForm} style={styles.primaryBtn}>
          {lang === 'eg' ? 'سلّم الفورم ✓' : 'Submit Form ✓'}
        </button>
      )}

      {showResult && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <h3>{lang === 'eg' ? `النتيجة: ${localScore}/١٠٠` : `Score: ${localScore}/100`}</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>
            {lang === 'eg'
              ? `الأربع خانات الأساسية: ${requiredFields.join('، ')}`
              : `The 4 essential qualification fields are: ${requiredFields.join(', ')}`}
          </p>
          <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
        </div>
      )}
    </div>
  );
};

// Activity 31: Cold Call Simulator
const ColdCallSimulator = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];

  const [step, setStep] = useState(0);
  const [path, setPath] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const scenarioEn = {
    intro: "You're about to make a cold call to a potential client who expressed interest in New Cairo properties online.",
    steps: [
      {
        situation: "Phone rings... Client answers: 'Hello?'",
        options: [
          { text: 'Hi, is this a good time to talk?', correct: false, feedback: "Wrong question! This gives them an easy out. Don't stop when you should proceed!" },
          { text: 'Good morning! This is [Name] from Xcelias. I noticed your interest in New Cairo properties - I have something exciting to share!', correct: true, feedback: 'Perfect! Confident, introduces yourself, and leads with value.' }
        ]
      },
      {
        situation: "Client: 'Oh, I'm kind of busy right now...'",
        options: [
          { text: "Oh, sorry to bother you then. I'll call back another time. Goodbye.", correct: false, feedback: "Don't stop when you should proceed! You gave up too easily." },
          { text: 'I completely understand - this will only take 30 seconds. I found a property that matches exactly what you were looking for. Can I share one quick detail?', correct: true, feedback: 'Great recovery! You acknowledged their time, kept it brief, and created curiosity.' }
        ]
      },
      {
        situation: "Client: 'Okay, go ahead, but make it quick.'",
        options: [
          { text: '*Proceeds to explain every feature of the property for 5 minutes*', correct: false, feedback: 'Length of message! They said make it quick. Keep it concise!' },
          { text: "There's a 3-bedroom in New Cairo, fully finished, within your budget, available in 6 months. Would you like to see it this weekend?", correct: true, feedback: 'Excellent! Covered the 4 key points (unit type, finishing, budget, delivery) and asked for commitment.' }
        ]
      },
      {
        situation: "Client: 'That does sound interesting. But I've been burned before by brokers...'",
        options: [
          { text: "I understand that concern - a lot of my clients felt the same initially. What I offer is consultancy, not just sales. I work across many projects to find what's truly right for you.", correct: true, feedback: 'Perfect rapport building and addressing the objection by highlighting broker advantages!' },
          { text: "Well, I'm not like other brokers. Trust me.", correct: false, feedback: "This doesn't build rapport or address the concern with substance." }
        ]
      }
    ]
  };

  const scenarioEg = {
    intro: 'إنت داخل تعمل كولد كول لعميل كان مهتم بوحدات في القاهرة الجديدة أونلاين.',
    steps: [
      {
        situation: 'التليفون بيرن… العميل: "ألو؟"',
        options: [
          { text: 'ألو، ينفع أتكلم دلوقتي؟', correct: false, feedback: 'ده سؤال بيدي للعميل مخرج سهل يقفل. ادخل على القيمة على طول.' },
          { text: 'صباح الخير! معاك [الاسم] من Xcelias. لاحظت اهتمامك بالقاهرة الجديدة — عندي حاجة مناسبة جدًا أحب أقولك عليها بسرعة.', correct: true, feedback: 'ممتاز: تعريف سريع + ثقة + قيمة واضحة.' }
        ]
      },
      {
        situation: 'العميل: "أنا مشغول شوية دلوقتي…"',
        options: [
          { text: 'تمام آسف على الإزعاج، هكلمك مرة تانية. مع السلامة.', correct: false, feedback: 'متوقفش وانت لازم تكمل. استأذنه في ٣٠ ثانية وادّيه سبب يسمع.' },
          { text: 'تمام جدًا — مش هاخد غير ٣٠ ثانية. عندي وحدة مطابقة للِّي كنت بتدور عليه. ينفع أقولك تفصيلة واحدة؟', correct: true, feedback: 'حلو: احترمت وقته + اختصرت + عملت فضول.' }
        ]
      },
      {
        situation: 'العميل: "ماشي قول بس بسرعة."',
        options: [
          { text: '*يقعد يشرح كل تفصيلة ٥ دقايق متواصل*', correct: false, feedback: 'طول الرسالة غلطة. هو قال بسرعة — خليك مختصر ومباشر.' },
          { text: 'عندي ٣ غرف في القاهرة الجديدة، تشطيب كامل، في حدود ميزانيتك، والاستلام كمان ٦ شهور. تحب نعمل معاينة الويك إند؟', correct: true, feedback: 'ممتاز: غطّيت أهم نقاط الطلب وطلبت التزام بخطوة.' }
        ]
      },
      {
        situation: 'العميل: "الكلام حلو… بس اتلسعت قبل كده من بروكر."',
        options: [
          { text: 'فاهم جدًا. كتير من العملاء كانوا حاسين كده. أنا دوري استشارة مش بيع وبس — بشتغل على مشاريع مختلفة عشان أطلعلك الأنسب فعلًا.', correct: true, feedback: 'ده رد قوي: إقرار + بناء ثقة + توضيح قيمة البروكر.' },
          { text: 'أنا مش زي باقي البروكرز… صدّقني.', correct: false, feedback: 'رد عام ومش بيبني ثقة ولا بيقدم دليل.' }
        ]
      }
    ]
  };

  const scenario = lang === 'eg' ? scenarioEg : scenarioEn;

  useEffect(() => {
    setStep(0);
    setPath([]);
    setLocalScore(0);
    setGameOver(false);
  }, [lang]);

  const handleChoice = (option) => {
    setPath(prev => [...prev, option]);
    
    if (option.correct) {
      setLocalScore(prev => prev + 25);
      updateScore(25, true);
    } else {
      updateScore(0, false);
    }

    if (step < scenario.steps.length - 1) {
      setTimeout(() => setStep(prev => prev + 1), 1500);
    } else {
      setTimeout(() => setGameOver(true), 1500);
    }
  };

  const currentStep = scenario.steps[step];
  const lastChoice = path[path.length - 1];

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>📞 {ui.activityNames.coldcall}</span>
        <ScorePanel score={localScore} streak={0} totalQuestions={scenario.steps.length} currentQuestion={step + 1} />
      </div>

      <ProgressBar current={step + 1} total={scenario.steps.length} />

      {!gameOver ? (
        <>
          <div style={{ 
            background: 'rgba(0,0,0,0.4)', 
            padding: '25px', 
            borderRadius: '16px', 
            marginBottom: '25px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '50px' }}>📱</span>
            <p style={{ fontSize: '18px', marginTop: '15px', lineHeight: '1.6' }}>
              {currentStep.situation}
            </p>
          </div>

          {lastChoice && (
            <div style={{
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              background: lastChoice.correct ? 'rgba(72,187,120,0.2)' : 'rgba(245,101,101,0.2)',
              border: lastChoice.correct ? '1px solid #48bb78' : '1px solid #f56565'
            }}>
              <strong>
                {lastChoice.correct
                  ? (lang === 'eg' ? '✅ اختيار ممتاز!' : '✅ Good choice!')
                  : (lang === 'eg' ? '❌ مش أحسن اختيار…' : '❌ Not ideal...')}
              </strong>
              <p style={{ marginTop: '5px', fontSize: '14px' }}>{lastChoice.feedback}</p>
            </div>
          )}

          <div>
            {currentStep.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleChoice(option)}
                disabled={lastChoice}
                className={`game-option game-option--${['blue','pink','amber','green'][idx % 4]}`}
                style={{ opacity: lastChoice ? 0.5 : 1 }}
              >
                {option.text}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '80px' }}>{localScore >= 75 ? '🏆' : localScore >= 50 ? '👍' : '📚'}</span>
          <h2 style={{ marginTop: '20px' }}>{lang === 'eg' ? 'المكالمة خلصت!' : 'Call Complete!'}</h2>
          <h3 style={{ marginTop: '10px' }}>{lang === 'eg' ? `النتيجة: ${localScore}/١٠٠` : `Score: ${localScore}/100`}</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '15px' }}>
            {localScore >= 75 
              ? (lang === 'eg' ? 'تقنية ممتازة! عديت الاعتراضات وقفلت بشكل قوي.' : 'Excellent call technique! You navigated objections and closed strong.')
              : localScore >= 50 
              ? (lang === 'eg' ? 'شغل كويس! راجع الغلطات الشائعة عشان تتحسّن.' : 'Good effort! Review the common mistakes to improve.')
              : (lang === 'eg' ? 'كمّل تدريب! فاكر: متوقفش وانت لازم تكمل.' : "Keep practicing! Remember: Don't stop when you should proceed.")}
          </p>
          <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
        </div>
      )}
    </div>
  );
};

// Activity 32: The 21 Experiences Game
const TwentyOneExperiences = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];
  const TD = getTrainingData(lang);

  const [clicks, setClicks] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [positions, setPositions] = useState([]);
  const TARGET = 21;

  useEffect(() => {
    generatePositions();
    setClicks(0);
    setStartTime(null);
    setEndTime(null);
  }, [lang]);

  const generatePositions = () => {
    const newPositions = [];
    for (let i = 0; i < TARGET; i++) {
      newPositions.push({
        top: Math.random() * 70 + 10,
        left: Math.random() * 80 + 5,
        clicked: false
      });
    }
    setPositions(newPositions);
  };

  const handleClick = (idx) => {
    if (positions[idx].clicked) return;
    
    if (!startTime) {
      setStartTime(Date.now());
    }

    const newPositions = [...positions];
    newPositions[idx].clicked = true;
    setPositions(newPositions);
    setClicks(prev => prev + 1);

    if (clicks + 1 === TARGET) {
      setEndTime(Date.now());
      const timeTaken = (Date.now() - (startTime || Date.now())) / 1000;
      const score = Math.max(10, Math.round(100 - timeTaken * 2));
      updateScore(score, true);
    }
  };

  const timeTaken = endTime && startTime ? ((endTime - startTime) / 1000).toFixed(1) : null;

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>🔄 {ui.activityNames['21exp']}</span>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{lang === 'eg' ? 'ضغطات' : 'Clicks'}</span>
          <span style={styles.scoreValue}>{clicks}/{TARGET}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)' }}>
          🙁 {lang === 'eg' ? 'يا نهار… عملت انطباع أول وحش…' : 'Oh no! You made a bad first impression...'}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>
          {lang === 'eg'
            ? 'بسرعة! اضغط على كل ٢١ زرار تجربة كويسة عشان تصلّح الموقف!'
            : 'Quick! Click all 21 "Good Experience" buttons to redeem yourself!'}
        </p>
        <p style={{ fontSize: '14px', color: '#667eea', marginTop: '5px' }}>
          {lang === 'eg'
            ? '(الدراسات بتقول إنك تحتاج ٢١ تجربة كويسة لتعويض انطباع أول وحش)'
            : '(Studies show it takes 21 good experiences to make up for a bad first impression)'}
        </p>
      </div>

      {clicks < TARGET ? (
        <div style={{ 
          position: 'relative', 
          height: '400px', 
          background: 'rgba(0,0,0,0.3)', 
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          {positions.map((pos, idx) => (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              style={{
                position: 'absolute',
                top: `${pos.top}%`,
                left: `${pos.left}%`,
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: 'none',
                background: pos.clicked 
                  ? 'rgba(72,187,120,0.3)' 
                  : 'linear-gradient(135deg, #48bb78, #38a169)',
                cursor: pos.clicked ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: pos.clicked ? 'none' : '0 4px 15px rgba(72,187,120,0.4)'
              }}
            >
              {pos.clicked ? '✓' : '😊'}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <span style={{ fontSize: '80px' }}>🎉</span>
          <h2 style={{ marginTop: '20px' }}>{lang === 'eg' ? 'تمام… اتصلّحت!' : 'Redemption Complete!'}</h2>
          <p style={{ fontSize: '24px', marginTop: '15px' }}>
            {lang === 'eg' ? `الوقت: ${timeTaken} ثانية` : `Time: ${timeTaken} seconds`}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>
            {lang === 'eg'
              ? 'قدّمت ٢١ تجربة كويسة ورجّعت العلاقة!' 
              : "You've delivered 21 good experiences and restored the relationship!"}
          </p>
          <p style={{ color: '#667eea', marginTop: '15px', fontStyle: 'italic' }}>
            “{TD.firstImpression.quote}”
          </p>
          <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
        </div>
      )}
    </div>
  );
};

// Activity 33: Real Estate Bingo
const RealEstateBingo = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];

  const [board, setBoard] = useState([]);
  const [called, setCalled] = useState([]);
  const [marked, setMarked] = useState([]);
  const [currentCall, setCurrentCall] = useState(null);
  const [gameWon, setGameWon] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  const allTermsEn = [
    { term: 'Duplex', definition: 'Two floors connected by internal staircase' },
    { term: 'Penthouse', definition: 'Luxury apartment on the top floor' },
    { term: 'RTM', definition: 'Ready To Move property' },
    { term: 'Off-plan', definition: 'Property sold before construction complete' },
    { term: 'Core & Shell', definition: 'Basic structure, no finishing' },
    { term: 'Semi Finished', definition: 'Basic finishing, plastered walls' },
    { term: 'Fully Finished', definition: 'Complete finishing, ready to move in' },
    { term: 'Twin House', definition: 'Two houses sharing one common wall' },
    { term: 'Town House', definition: 'Multi-story home in a row' },
    { term: 'Broker', definition: 'Works on diverse projects, consultancy' },
    { term: 'Primary', definition: 'Buy from developer with installments' },
    { term: 'Resale', definition: 'Buy from client, cash payment' },
    { term: 'Needs', definition: 'Tangible requirements clients ask for' },
    { term: 'Wants', definition: 'Emotional/rational reasons behind requests' },
    { term: 'A.B.C', definition: 'Acknowledgment, Benefits, Commitment' },
    { term: '7-38-55', definition: 'Words, Tonality, Body Language rule' },
    { term: 'Rule of 7', definition: 'Max accessories for dress code' },
    { term: '21 Experiences', definition: 'Good experiences to fix bad impression' },
    { term: 'Rapport', definition: 'Adapting yourself to match the client' },
    { term: 'Mirroring', definition: "Match client's tone and volume" },
    { term: 'Stand Alone', definition: 'Independent villa on its own plot' },
    { term: 'Admin', definition: 'Office and administrative spaces' },
    { term: 'Walk Out', definition: 'Clients who leave without buying' },
    { term: 'Consultancy', definition: "Broker's advisory role" },
    { term: 'BUA', definition: 'Built Up Area measurement' }
  ];

  const allTermsEg = [
    { term: 'دوبلكس', definition: 'وحدة على دورين بسلم داخلي' },
    { term: 'بنتهاوس', definition: 'وحدة فاخرة في آخر دور' },
    { term: 'جاهز للسكن', definition: 'الوحدة جاهزة تستلم وتسكن' },
    { term: 'أوف بلان', definition: 'شراء قبل ما المشروع يخلص' },
    { term: 'كور أند شِل', definition: 'هيكل فقط بدون تشطيب داخلي' },
    { term: 'نصف تشطيب', definition: 'تشطيب أساسي (محارة وخلافه)' },
    { term: 'تشطيب كامل', definition: 'تشطيب كامل جاهز للاستخدام' },
    { term: 'توين هاوس', definition: 'بيتين لازقين في حيط مشتركة' },
    { term: 'تاون هاوس', definition: 'بيت ضمن صف بيوت متصلة' },
    { term: 'بروكر', definition: 'بيشتغل على أكتر من مشروع وبيقدّم استشارة' },
    { term: 'مطوّر', definition: 'صاحب المشروع وبيبيع وحدات مشروعه' },
    { term: 'برايمري', definition: 'شراء من المطوّر غالبًا بأقساط' },
    { term: 'ريسيل', definition: 'شراء من عميل غالبًا كاش وجاهز' },
    { term: 'احتياجات', definition: 'طلبات ملموسة ومحددة من العميل' },
    { term: 'رغبات', definition: 'الدافع ورا الطلب (عاطفي/عقلاني)' },
    { term: 'أ.ب.ج', definition: 'إقرار، مميزات، التزام' },
    { term: 'قاعدة ٧-٣٨-٥٥', definition: 'الكلام، نبرة الصوت، لغة الجسد' },
    { term: 'قاعدة ٧', definition: 'أقصى ٧ نقاط لافتة في المظهر' },
    { term: '٢١ تجربة', definition: 'تجارب كويسة لتعوض انطباع أول وحش' },
    { term: 'ألفة', definition: 'تبني علاقة وتوافق مع العميل' },
    { term: 'مراية', definition: 'تقلّد نبرة وصوت العميل بشكل طبيعي' },
    { term: 'شقة', definition: 'وحدة سكنية داخل عمارة' },
    { term: 'استوديو', definition: 'مساحة مفتوحة غالبًا غرفة واحدة' },
    { term: 'فيلا مستقلة', definition: 'فيلا لوحدها على قطعة أرض' },
    { term: 'محلات', definition: 'وحدات تجارية للبيع بالتجزئة' },
    { term: 'إداري', definition: 'مساحات مكاتب وإدارة' },
    { term: 'طبي', definition: 'عيادات ومراكز طبية' },
    { term: 'صيدلية', definition: 'وحدة صيدلية' }
  ];

  useEffect(() => {
    const shuffled = shuffleArray(lang === 'eg' ? allTermsEg : allTermsEn);
    setBoard(shuffled.slice(0, 25));
    setMarked(Array(25).fill(false));
    setCalled([]);
    setCurrentCall(null);
    setGameWon(false);
    setLocalScore(0);
  }, [lang]);

  const callNext = () => {
    const uncalled = board.filter(item => !called.includes(item.term));
    if (uncalled.length === 0) return;
    
    const next = getRandomItem(uncalled);
    setCalled(prev => [...prev, next.term]);
    setCurrentCall(next);
  };

  const handleMark = (idx) => {
    if (gameWon) return;
    const term = board[idx].term;
    
    if (called.includes(term)) {
      const newMarked = [...marked];
      newMarked[idx] = !newMarked[idx];
      setMarked(newMarked);
      
      if (!marked[idx]) {
        setLocalScore(prev => prev + 10);
      }
      
      // Check for bingo
      checkBingo(newMarked);
    }
  };

  const checkBingo = (markedArray) => {
    const lines = [
      [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // rows
      [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // cols
      [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // diagonals
    ];
    
    for (let line of lines) {
      if (line.every(idx => markedArray[idx])) {
        setGameWon(true);
        updateScore(localScore + 100, true);
        return;
      }
    }
  };

  if (board.length === 0) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>🎱 {ui.activityNames.bingo}</span>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{ui.score}</span>
          <span style={styles.scoreValue}>{localScore}</span>
        </div>
      </div>

      {/* Current Call */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(229,62,62,0.2), rgba(229,62,62,0.1))',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        textAlign: 'center',
        border: '2px solid rgba(229,62,62,0.3)'
      }}>
        {currentCall ? (
          <>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>
              {lang === 'eg' ? 'دَوّر على المصطلح ده:' : 'Find this term:'}
            </p>
            <p style={{ fontSize: '18px' }}>"{currentCall.definition}"</p>
          </>
        ) : (
          <p>{lang === 'eg' ? 'اضغط "نادِي اللي بعده" عشان تبدأ!' : 'Click "Call Next" to start!'}</p>
        )}
      </div>

      {!gameWon && (
        <button onClick={callNext} style={{ ...styles.primaryBtn, marginBottom: '20px' }}>
          📢 {lang === 'eg' ? 'نادِي اللي بعده' : 'Call Next'}
        </button>
      )}

      {/* Bingo Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px'
      }}>
        {board.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleMark(idx)}
            style={{
              padding: '15px 5px',
              borderRadius: '8px',
              border: marked[idx] ? '2px solid #48bb78' : '2px solid rgba(255,255,255,0.2)',
              background: marked[idx] ? 'rgba(72,187,120,0.3)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'center',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {item.term}
            {marked[idx] && <span style={{ marginLeft: '5px' }}>✓</span>}
          </button>
        ))}
      </div>

      {gameWon && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <span style={{ fontSize: '60px' }}>🎉</span>
          <h2 style={{ marginTop: '10px' }}>{lang === 'eg' ? 'بينجو!' : 'BINGO!'}</h2>
          <p style={{ marginTop: '10px' }}>{lang === 'eg' ? `النتيجة النهائية: ${localScore + 100}` : `Final Score: ${localScore + 100}`}</p>
          <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
        </div>
      )}
    </div>
  );
};

// Activity 34: Salesman's Crossword (Simplified word search)
const SalesmanCrossword = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];

  const [words, setWords] = useState([]);
  const [found, setFound] = useState([]);
  const [input, setInput] = useState('');
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    const crosswordWordsEn = [
      { word: 'DUPLEX', hint: 'Two floors, one unit' },
      { word: 'OFFPLAN', hint: 'Bought before completion' },
      { word: 'RTM', hint: 'Ready To Move' },
      { word: 'BROKER', hint: 'Works on diverse projects' },
      { word: 'PENTHOUSE', hint: 'Top floor luxury' },
      { word: 'RESALE', hint: 'Buy from client, cash' },
      { word: 'RAPPORT', hint: 'Building connection' },
      { word: 'NEEDS', hint: 'Tangible requirements' }
    ];
    const crosswordWordsEg = [
      { word: 'دوبلكس', hint: 'وحدة على دورين' },
      { word: 'أوف بلان', hint: 'شراء قبل التسليم' },
      { word: 'جاهز للسكن', hint: 'تستلم وتسكن فورًا' },
      { word: 'بروكر', hint: 'بيشتغل على مشاريع كتير' },
      { word: 'بنتهاوس', hint: 'وحدة فاخرة في آخر دور' },
      { word: 'ريسيل', hint: 'شراء من عميل غالبًا كاش' },
      { word: 'ألفة', hint: 'بناء توافق مع العميل' },
      { word: 'احتياجات', hint: 'طلبات ملموسة ومحددة' }
    ];

    setWords(shuffleArray(lang === 'eg' ? crosswordWordsEg : crosswordWordsEn));
    setFound([]);
    setInput('');
    setLocalScore(0);
  }, [lang]);

  const handleGuess = () => {
    const normalizeEg = (s) => s.replace(/\s+/g, ' ').trim();
    const guess = lang === 'eg' ? normalizeEg(input) : input.toUpperCase().trim();
    const wordObj = lang === 'eg'
      ? words.find(w => normalizeEg(w.word) === guess)
      : words.find(w => w.word === guess);
    
    if (wordObj && !found.includes(wordObj.word)) {
      setFound(prev => [...prev, wordObj.word]);
      setLocalScore(prev => prev + 15);
      updateScore(15, true);
    }
    setInput('');
  };

  const isComplete = found.length === words.length;

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ ...styles.badge, ...styles.badgeBlue }}>🔤 {ui.activityNames.crossword}</span>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{lang === 'eg' ? 'اتلاقى' : 'Found'}</span>
          <span style={styles.scoreValue}>{found.length}/{words.length}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2>{lang === 'eg' ? 'اعرف مصطلحات العقار!' : 'Find the Real Estate Terms!'}</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
          {lang === 'eg' ? 'استخدم التلميحات وخمّن كل كلمة' : 'Use the hints to guess each word'}
        </p>
      </div>

      {!isComplete && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
            placeholder={lang === 'eg' ? 'اكتب تخمينك…' : 'Type your guess...'}
            style={{
              flex: 1,
              padding: '15px',
              borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '16px'
            }}
          />
          <button onClick={handleGuess} style={styles.primaryBtn}>{lang === 'eg' ? 'خمّن' : 'Guess'}</button>
        </div>
      )}

      {/* Hints */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '10px' 
      }}>
        {words.map((wordObj, idx) => (
          <div key={idx} style={{
            padding: '15px',
            background: found.includes(wordObj.word) ? 'rgba(72,187,120,0.2)' : 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            border: found.includes(wordObj.word) ? '1px solid #48bb78' : '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>
              {found.includes(wordObj.word) ? wordObj.word : '_ '.repeat(wordObj.word.length)}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
              💡 {wordObj.hint}
            </div>
          </div>
        ))}
      </div>

      {isComplete && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <span style={{ fontSize: '60px' }}>🏆</span>
          <h2 style={{ marginTop: '10px' }}>{lang === 'eg' ? 'كده لقيت كل الكلمات!' : 'All Words Found!'}</h2>
          <p>{lang === 'eg' ? `النتيجة: ${localScore}` : `Score: ${localScore}`}</p>
          <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>{ui.back}</button>
        </div>
      )}
    </div>
  );
};

// Activity 35: Final Exam (Mixed 50 Questions)
const FinalExam = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const s = UI_STRINGS[lang];
  const TD = getTrainingData(lang);

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [localScore, setLocalScore] = useState(0);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    // Generate 50 random questions from all categories
    const allQuestions = [];

    // MCQ from terminology
    TD.terminology.terms.forEach(term => {
      const wrongAnswers = lang === 'eg'
        ? ['جاهز للبناء', 'عائد على التسويق', 'مساحة وحدة أساسية']
        : ["Ready To Build", "Return On Marketing", "Basic Unit Area"];
      allQuestions.push({
        type: 'mcq',
        category: lang === 'eg' ? 'مصطلحات' : 'Terminology',
        question: lang === 'eg'
          ? `يعني إيه "${term.term}"؟`
          : `What does "${term.term}" stand for?`,
        correct: term.fullForm,
        options: shuffleArray([term.fullForm, ...getRandomItems(wrongAnswers, 3)]),
        explanation: lang === 'eg'
          ? `${term.term}: ${term.fullForm} — ${term.description}`
          : `${term.term} = ${term.fullForm}: ${term.description}`
      });
    });

    // True/False
    const tfQuestions = lang === 'eg'
      ? [
          { q: 'البروكر عنده نسبة انسحاب أكتر من المطوّر.', a: false, e: 'البروكر عادة نسبة الانسحاب عنده أقل.' },
          { q: 'معظم الريسيل بيكون جاهز للسكن.', a: true, e: 'الريسيل غالبًا جاهز للسكن.' },
          { q: 'لغة الجسد مسؤولة عن ٥٥٪ من تأثير التواصل.', a: true, e: 'قاعدة ٧-٣٨-٥٥: لغة الجسد = ٥٥٪.' },
          { q: 'ممكن تلبس لحد ١٠ إكسسوارات.', a: false, e: 'قاعدة ٧: الحد الأقصى ٧ نقاط لافتة.' },
          { q: 'الاحتياجات هي دوافع عاطفية.', a: false, e: 'الاحتياجات ملموسة. الرغبات ممكن تكون عاطفية.' },
          { q: 'تقنية أ.ب.ج معناها: دايمًا اقفل البيع.', a: false, e: 'أ.ب.ج = إقرار، مميزات، التزام.' },
          { q: 'ممكن تحتاج ٢١ تجربة كويسة لتعويض انطباع أول وحش.', a: true, e: 'الدراسات بتقول ٢١ تجربة كويسة متكررة.' },
          { q: 'المطوّر وعيه بالسوق أعلى من البروكر.', a: false, e: 'البروكر وعيه بالسوق أعلى.' },
          { q: 'معظم البرايمري بيكون أوف بلان.', a: true, e: 'البرايمري غالبًا قبل الإنشاء.' },
          { q: 'نبرة الصوت مسؤولة عن ٧٪ من تأثير التواصل.', a: false, e: 'نبرة الصوت = ٣٨٪. الكلام = ٧٪.' }
        ]
      : [
          { q: "Brokers have more walk out than developers.", a: false, e: "Brokers have LESS walk out." },
          { q: "Most resales are RTM.", a: true, e: "Most resales are RTM (Ready To Move)." },
          { q: "Body language accounts for 55% of communication.", a: true, e: "7-38-55 rule: Body language = 55%." },
          { q: "You can have up to 10 accessories.", a: false, e: "Rule of 7: Maximum 7 accessories." },
          { q: "Needs are emotional concepts.", a: false, e: "Needs are tangible requirements. Wants are emotional." },
          { q: "A.B.C means Always Be Closing.", a: false, e: "A.B.C = Acknowledgment, Benefits, Commitment." },
          { q: "It takes 21 good experiences to fix a bad first impression.", a: true, e: "Studies show 21 repeated good experiences needed." },
          { q: "Developers have more market awareness.", a: false, e: "BROKERS have more market awareness." },
          { q: "Primary properties are usually Off-plan.", a: true, e: "Most primary properties are Off-plan." },
          { q: "Tonality accounts for 7% of communication.", a: false, e: "Tonality = 38%. Words = 7%." }
        ];
    
    tfQuestions.forEach(tf => {
      allQuestions.push({
        type: 'tf',
        category: 'True/False',
        question: tf.q,
        correct: tf.a,
        explanation: tf.e
      });
    });

    // Unit type questions
    const allUnits = [...TD.propertyTypes.residential.apartments, ...TD.propertyTypes.residential.villas];
    allUnits.forEach(unit => {
      allQuestions.push({
        type: 'mcq',
        category: lang === 'eg' ? 'أنواع الوحدات' : 'Unit Types',
        question: lang === 'eg'
          ? `أنهي نوع وحدة مناسب للوصف ده: "${unit.description}"؟`
          : `What type of property: "${unit.description}"?`,
        correct: unit.name,
        options: shuffleArray([unit.name, ...getRandomItems(allUnits.filter(u => u.name !== unit.name).map(u => u.name), 3)]),
        explanation: `${unit.name}: ${unit.description}`
      });
    });

    // Broker vs Developer
    TD.brokerVsDeveloper.broker.traits.forEach(trait => {
      allQuestions.push({
        type: 'choice',
        category: lang === 'eg' ? 'بروكر ولا مطوّر' : 'Broker vs Developer',
        question: lang === 'eg'
          ? `"${trait}" — ده يخص بروكر ولا مطوّر؟`
          : `"${trait}" - Is this Broker or Developer?`,
        correct: lang === 'eg' ? 'بروكر' : 'Broker',
        options: lang === 'eg' ? ['بروكر', 'مطوّر'] : ["Broker", "Developer"],
        explanation: lang === 'eg'
          ? `"${trait}" من صفات البروكر.`
          : `"${trait}" is a Broker characteristic.`
      });
    });

    TD.brokerVsDeveloper.developer.traits.forEach(trait => {
      allQuestions.push({
        type: 'choice',
        category: lang === 'eg' ? 'بروكر ولا مطوّر' : 'Broker vs Developer',
        question: lang === 'eg'
          ? `"${trait}" — ده يخص بروكر ولا مطوّر؟`
          : `"${trait}" - Is this Broker or Developer?`,
        correct: lang === 'eg' ? 'مطوّر' : 'Developer',
        options: lang === 'eg' ? ['بروكر', 'مطوّر'] : ["Broker", "Developer"],
        explanation: lang === 'eg'
          ? `"${trait}" من صفات المطوّر.`
          : `"${trait}" is a Developer characteristic.`
      });
    });

    // Shuffle and take 50
    setQuestions(shuffleArray(allQuestions).slice(0, 20));
  }, [lang]);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    setSelected(answer);
    setShowFeedback(true);
    
    const isCorrect = answer === questions[currentQ].correct || 
                      (typeof answer === 'boolean' && answer === questions[currentQ].correct);
    
    setAnswers(prev => [...prev, { question: currentQ, correct: isCorrect }]);
    
    if (isCorrect) {
      setLocalScore(prev => prev + 5);
      updateScore(5, true);
    } else {
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) return <div>{lang === 'eg' ? 'جاري تجهيز الامتحان…' : 'Loading exam...'}</div>;

  const q = questions[currentQ];
  const isLastQuestion = currentQ === questions.length - 1;

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <span style={{ ...styles.badge, ...styles.badgeRed }}>📝 {s.activityNames.exam}</span>
          <span style={{ ...styles.badge, ...styles.badgeBlue, marginLeft: '10px' }}>{toneifyText(lang, q.category, 'label')}</span>
        </div>
        <ScorePanel score={localScore} streak={0} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <h2 style={styles.questionText}>{toneifyText(lang, q.question, 'question')}</h2>

      {q.type === 'tf' ? (
        <div style={styles.grid2}>
          <button
            onClick={() => handleAnswer(true)}
            className={tfClass(true, selected, q.correct, showFeedback)}
            style={{ padding: '36px 20px', textAlign: 'center', fontSize: '22px', fontWeight: 800 }}
          >
            {lang === 'eg' ? '✓ صح' : '✓ TRUE'}
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className={tfClass(false, selected, q.correct, showFeedback)}
            style={{ padding: '36px 20px', textAlign: 'center', fontSize: '22px', fontWeight: 800 }}
          >
            {lang === 'eg' ? '✗ غلط' : '✗ FALSE'}
          </button>
        </div>
      ) : (
        <div>
          {q.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              className={optionClass(idx, selected, q.correct, showFeedback, option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {showFeedback && (
        <>
          <Feedback 
            isCorrect={selected === q.correct} 
            explanation={q.explanation}
          />
          {!isLastQuestion ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <span style={{ fontSize: '60px' }}>🎓</span>
              <h2 style={{ marginTop: '15px' }}>Exam Complete!</h2>
              <h3 style={{ marginTop: '10px' }}>Final Score: {localScore}/{questions.length * 5}</h3>
              <p style={{ marginTop: '10px', color: 'rgba(255,255,255,0.7)' }}>
                {localScore >= questions.length * 4 ? "🏆 Outstanding! You're an Xcelias expert!" :
                 localScore >= questions.length * 3 ? "👏 Great job! Keep refining your knowledge." :
                 localScore >= questions.length * 2 ? "📚 Good effort! Review the material for better results." :
                 "💪 Keep studying! Practice makes perfect."}
              </p>
              <button onClick={onBack} style={{ ...styles.primaryBtn, marginTop: '20px' }}>Back to Menu</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================

// ============================================
// CLASSROOM / TEAM ACTIVITIES (NEW)
// ============================================

const buildRandomQuestion = (lang = 'en') => {
  const TD = getTrainingData(lang);
  const questionBuilders = [];

  // 1) Unit type from description
  questionBuilders.push(() => {
    const units = [
      ...TD.propertyTypes.residential.apartments,
      ...TD.propertyTypes.residential.villas
    ];
    const correct = getRandomItem(units);
    const distractors = getRandomItems(units.filter(u => u.name !== correct.name), 3);
    const options = shuffleArray([correct, ...distractors]).map(u => u.name);
    return {
      category: lang === 'eg' ? 'أنواع الوحدات' : 'Unit Types',
      prompt: lang === 'eg'
        ? `حدّد نوع الوحدة من الوصف: “${correct.description}”`
        : `Identify the property type: “${correct.description}”`,
      options,
      correctIndex: options.indexOf(correct.name),
      explanation: `${correct.name}: ${correct.description}`
    };
  });

  // 2) Finishing level ordering
  questionBuilders.push(() => {
    const types = TD.finishingTypes.types;
    const a = getRandomItem(types);
    const b = getRandomItem(types.filter(t => t.name !== a.name));
    const correct = a.level > b.level ? a.name : b.name;
    const options = shuffleArray([a.name, b.name]);
    return {
      category: lang === 'eg' ? 'التشطيب' : 'Finishing',
      prompt: lang === 'eg' ? 'أنهي تشطيب أكمل؟' : `Which finishing level is MORE complete?`,
      options,
      correctIndex: options.indexOf(correct),
      explanation: lang === 'eg'
        ? `${a.name} (مستوى ${a.level}) ضد ${b.name} (مستوى ${b.level}). المستوى الأعلى = تشطيب أكمل.`
        : `${a.name} (level ${a.level}) vs ${b.name} (level ${b.level}). Higher level = more complete.`
    };
  });

  // 3) Broker vs Developer classification (traits)
  questionBuilders.push(() => {
    const brokerTrait = getRandomItem(TD.brokerVsDeveloper.broker.traits);
    const devTrait = getRandomItem(TD.brokerVsDeveloper.developer.traits);
    const pair = getRandomItem([
      { trait: brokerTrait, correct: lang === 'eg' ? 'بروكر' : 'Broker' },
      { trait: devTrait, correct: lang === 'eg' ? 'مطوّر' : 'Developer' }
    ]);
    const options = lang === 'eg' ? ['بروكر', 'مطوّر'] : ['Broker', 'Developer'];
    return {
      category: lang === 'eg' ? 'بروكر ولا مطوّر' : 'Broker vs Developer',
      prompt: lang === 'eg' ? `“${pair.trait}” يخص:` : `“${pair.trait}” belongs to:`,
      options,
      correctIndex: options.indexOf(pair.correct),
      explanation: (lang === 'eg' ? pair.correct === 'بروكر' : pair.correct === 'Broker')
        ? (lang === 'eg'
          ? `البروكر: ${TD.brokerVsDeveloper.broker.role} — ومن صفاته: “${pair.trait}”.`
          : `Broker: ${TD.brokerVsDeveloper.broker.role} + traits include “${pair.trait}”.`)
        : (lang === 'eg'
          ? `المطوّر: ${TD.brokerVsDeveloper.developer.role} — ومن صفاته: “${pair.trait}”.`
          : `Developer: ${TD.brokerVsDeveloper.developer.role} + traits include “${pair.trait}”.`)
    };
  });

  // 4) Primary vs Resale classification
  questionBuilders.push(() => {
    const primaryTrait = getRandomItem(TD.primaryVsResale.primary.traits);
    const resaleTrait = getRandomItem(TD.primaryVsResale.resale.traits);
    const pair = getRandomItem([
      { trait: primaryTrait, correct: lang === 'eg' ? TD.primaryVsResale.primary.name : 'Primary' },
      { trait: resaleTrait, correct: lang === 'eg' ? TD.primaryVsResale.resale.name : 'Resale (Secondary)' }
    ]);
    const options = lang === 'eg'
      ? [TD.primaryVsResale.primary.name, TD.primaryVsResale.resale.name]
      : ['Primary', 'Resale (Secondary)'];
    return {
      category: lang === 'eg' ? 'برايمري ولا ريسيل' : 'Primary vs Resale',
      prompt: lang === 'eg' ? `“${pair.trait}” يخص:` : `“${pair.trait}” describes:`,
      options,
      correctIndex: options.indexOf(pair.correct),
      explanation: (lang === 'eg' ? pair.correct === TD.primaryVsResale.primary.name : pair.correct === 'Primary')
        ? (lang === 'eg'
          ? `${TD.primaryVsResale.primary.name}: ${TD.primaryVsResale.primary.traits.join(' • ')}`
          : `Primary: ${TD.primaryVsResale.primary.traits.join(' • ')}`)
        : (lang === 'eg'
          ? `${TD.primaryVsResale.resale.name}: ${TD.primaryVsResale.resale.traits.join(' • ')}`
          : `Resale: ${TD.primaryVsResale.resale.traits.join(' • ')}`)
    };
  });

  // 5) 7-38-55 mapping
  questionBuilders.push(() => {
    const item = getRandomItem(TD.communication.breakdown);
    const options = shuffleArray([7, 38, 55]).map(n => `${n}%`);
    return {
      category: lang === 'eg' ? 'قاعدة ٧-٣٨-٥٥' : '7-38-55 Rule',
      prompt: lang === 'eg'
        ? `في قاعدة ٧-٣٨-٥٥، “${item.type}” نسبته كام؟`
        : `In the 7-38-55 rule, “${item.type}” accounts for what percentage?`,
      options,
      correctIndex: options.indexOf(`${item.percentage}%`),
      explanation: `${item.type} = ${item.percentage}% (${item.description}).`
    };
  });

  // 6) Dress code rule
  questionBuilders.push(() => {
    const max = TD.dressCode.maxPoints;
    const options = shuffleArray([max, max - 2, max + 2, max + 3].map(String));
    return {
      category: lang === 'eg' ? 'اللبس والمظهر' : 'Dress Code',
      prompt: lang === 'eg'
        ? 'طبقًا لقاعدة ٧، الحد الأقصى كام نقطة لافتة؟'
        : `According to the Rule of 7, you should NOT have more than how many points of interest?`,
      options,
      correctIndex: options.indexOf(String(max)),
      explanation: `${TD.dressCode.rule} (max = ${max}). ${TD.dressCode.reason}`
    };
  });

  // 7) Common mistakes -> correct behavior
  questionBuilders.push(() => {
    const item = getRandomItem(TD.callTechniques.commonMistakes);
    const correct = item.correct;
    const distractors = getRandomItems(
      TD.callTechniques.commonMistakes
        .filter(m => m.correct !== correct)
        .map(m => m.correct),
      3
    );
    const options = shuffleArray([correct, ...distractors]);
    return {
      category: lang === 'eg' ? 'تقنيات المكالمة' : 'Call Techniques',
      prompt: lang === 'eg' ? `صلّح الغلطة دي: “${item.mistake}”` : `Fix this mistake: “${item.mistake}”`,
      options,
      correctIndex: options.indexOf(correct),
      explanation: lang === 'eg' ? `الصح: ${correct}.` : `Correct approach: ${correct}.`
    };
  });

  const builder = getRandomItem(questionBuilders);
  return builder();
};

const TeamBattleArena = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];

  const [phase, setPhase] = useState('setup'); // setup | round | reveal | end
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState(['Team A', 'Team B', 'Team C', 'Team D']);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState(null);
  const [buzzedTeam, setBuzzedTeam] = useState(null);
  const [attempted, setAttempted] = useState([]); // team indexes who attempted
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(12);
  const [locked, setLocked] = useState(false);
  const [localLog, setLocalLog] = useState([]);

  const activeTeams = useMemo(() => Array.from({ length: teamCount }, (_, i) => i), [teamCount]);

  const startGame = () => {
    setScores([0, 0, 0, 0]);
    setRound(1);
    setLocalLog([]);
    nextRound(1);
    setPhase('round');
  };

  const nextRound = (nextRoundNumber = round + 1) => {
    setQuestion(buildRandomQuestion(lang));
    setBuzzedTeam(null);
    setAttempted([]);
    setSelected(null);
    setLocked(false);
    setTimeLeft(12);
    setRound(nextRoundNumber);
  };

  useEffect(() => {
    if (phase !== 'round') return;
    if (buzzedTeam === null) return;
    if (locked) return;

    if (timeLeft <= 0) {
      setLocked(true);
      setLocalLog(prev => [{
        id: generateId(),
        text: `${teamNames[buzzedTeam]} ran out of time.`,
        tone: 'bad'
      }, ...prev].slice(0, 6));
      setAttempted(prev => [...prev, buzzedTeam]);
      setBuzzedTeam(null);
      setSelected(null);
      setTimeLeft(12);
      setLocked(false);
      return;
    }

    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, buzzedTeam, timeLeft, locked, teamNames]);

  const buzz = (teamIdx) => {
    if (phase !== 'round') return;
    if (buzzedTeam !== null) return;
    if (attempted.includes(teamIdx)) return;
    setBuzzedTeam(teamIdx);
    setTimeLeft(12);
  };

  const scoreDelta = (correct) => (correct ? 120 : -40);

  const pick = (option, optionIdx) => {
    if (phase !== 'round') return;
    if (buzzedTeam === null) return;
    if (locked) return;
    setLocked(true);
    setSelected(optionIdx);

    const correct = optionIdx === question.correctIndex;
    const delta = scoreDelta(correct);

    setScores(prev => {
      const next = [...prev];
      next[buzzedTeam] = (next[buzzedTeam] || 0) + delta;
      return next;
    });

    updateScore(Math.max(0, correct ? 20 : 0), correct);

    setLocalLog(prev => [{
      id: generateId(),
      text: correct
        ? `${teamNames[buzzedTeam]} nailed it (+${delta}).`
        : `${teamNames[buzzedTeam]} missed (${delta}).`,
      tone: correct ? 'good' : 'bad'
    }, ...prev].slice(0, 6));

    setTimeout(() => {
      setAttempted(prev => [...prev, buzzedTeam]);
      setBuzzedTeam(null);
      setLocked(false);
      setSelected(null);
      setTimeLeft(12);

      // End/advance rules
      const maxRounds = 8;
      if (round >= maxRounds) {
        setPhase('end');
      } else {
        nextRound(round + 1);
      }
    }, 900);
  };

  const winnerIdx = useMemo(() => {
    const pairs = activeTeams.map(i => ({ i, s: scores[i] || 0 }));
    pairs.sort((a, b) => b.s - a.s);
    return pairs[0]?.i ?? 0;
  }, [scores, activeTeams]);

  if (phase === 'setup') {
    return (
      <div style={styles.card} className="animate-fadeIn">
        <BackButton onClick={onBack} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ ...styles.badge, ...styles.badgeRed }}>🏟️ Team Battle Arena</span>
          <span style={{ ...styles.badge, ...styles.badgeBlue }}>Classroom Mode</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 10 }}>⚡</div>
          <div style={styles.stageTitle}>Fastest team wins</div>
          <div style={styles.stageSubtitle}>
            Buzzer-first. One answer. Big points. Built for a projector + teams.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={styles.pill}>
            <span style={{ color: RM_THEME.muted }}>Teams</span>
            <button
              style={{ ...styles.secondaryBtn, padding: '10px 14px' }}
              onClick={() => setTeamCount(c => clamp(c - 1, 2, 4))}
            >
              −
            </button>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{teamCount}</div>
            <button
              style={{ ...styles.secondaryBtn, padding: '10px 14px' }}
              onClick={() => setTeamCount(c => clamp(c + 1, 2, 4))}
            >
              +
            </button>
          </div>
          <div style={styles.pill}>
            <span style={{ color: RM_THEME.muted }}>Rounds</span>
            <strong>8</strong>
          </div>
          <div style={styles.pill}>
            <span style={{ color: RM_THEME.muted }}>Timer</span>
            <strong>12s</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 22 }}>
          {Array.from({ length: teamCount }, (_, idx) => (
            <div key={idx} style={{
              background: 'rgba(0,0,0,0.35)',
              border: `1px solid ${RM_THEME.border}`,
              borderRadius: 16,
              padding: 16
            }}>
              <div style={{ fontSize: 12, color: RM_THEME.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Team {idx + 1}</div>
              <input
                value={teamNames[idx]}
                onChange={(e) => setTeamNames(prev => {
                  const next = [...prev];
                  next[idx] = e.target.value || `Team ${idx + 1}`;
                  return next;
                })}
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: '12px 12px',
                  borderRadius: 12,
                  border: `1px solid ${RM_THEME.border2}`,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16
                }}
                placeholder={`Team ${idx + 1}`}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={startGame} style={{ ...styles.primaryBtn, padding: '18px 34px', fontSize: 18 }}>
            🚀 Start Battle
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'end') {
    const ordered = activeTeams
      .map(i => ({ i, name: teamNames[i], s: scores[i] || 0 }))
      .sort((a, b) => b.s - a.s);

    return (
      <div style={styles.card} className="animate-fadeIn">
        <BackButton onClick={onBack} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 74 }}>🏆</div>
          <div style={{ ...styles.stageTitle, marginTop: 10 }}>Winner: {teamNames[winnerIdx]}</div>
          <div style={{ marginTop: 12, color: RM_THEME.muted }}>Final standings</div>
        </div>

        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {ordered.map((t, idx) => (
            <div key={t.i} style={{
              padding: 18,
              borderRadius: 16,
              border: `1px solid ${RM_THEME.border}`,
              background: idx === 0
                ? 'linear-gradient(135deg, rgba(255,59,59,0.20), rgba(139,92,246,0.12))'
                : 'rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{idx + 1}. {t.name}</div>
                <div style={{ fontWeight: 900, fontSize: 22 }}>{t.s}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22, gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setPhase('setup')} style={styles.secondaryBtn}>↩️ New Setup</button>
          <button onClick={startGame} style={styles.primaryBtn}>🔁 Rematch</button>
        </div>
      </div>
    );
  }

  // round
  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ ...styles.badge, ...styles.badgeRed }}>🏟️ Team Battle Arena</span>
          <span style={{ ...styles.badge, ...styles.badgeBlue }}>{question?.category}</span>
          <span style={{ ...styles.badge, ...styles.badgeGreen }}>Round {round}/8</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {activeTeams.map(i => (
            <div key={i} style={{ ...styles.scoreItem, minWidth: 130 }}>
              <span style={styles.scoreLabel}>{teamNames[i]}</span>
              <span style={styles.scoreValue}>{scores[i] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: 18,
        borderRadius: 18,
        background: 'rgba(0,0,0,0.35)',
        border: `1px solid ${RM_THEME.border}`,
        marginBottom: 16
      }}>
        <div style={{ fontSize: 12, color: RM_THEME.faint, textTransform: 'uppercase', letterSpacing: '0.10em' }}>Question</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, lineHeight: 1.4 }}>{question?.prompt}</div>
        <div style={{ marginTop: 10, color: RM_THEME.muted, fontSize: 14 }}>
          {buzzedTeam === null ? 'First team to BUZZ gets the shot.' : `Answering: ${teamNames[buzzedTeam]} • ${timeLeft}s`}
        </div>
      </div>

      {/* Buzzers */}
      {buzzedTeam === null && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${teamCount}, minmax(180px, 1fr))`, gap: 12, marginBottom: 14 }}>
          {activeTeams.map(i => (
            <button
              key={i}
              onClick={() => buzz(i)}
              disabled={attempted.includes(i)}
              className={`game-option game-option--${['blue','pink','amber','green'][i % 4]}`}
              style={{ textAlign: 'center', padding: '22px 16px', opacity: attempted.includes(i) ? 0.4 : 1 }}
            >
              <div style={{ fontSize: 34, marginBottom: 6 }}>🔔</div>
              <div style={{ fontWeight: 900 }}>{teamNames[i]}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: RM_THEME.faint }}>{attempted.includes(i) ? 'Attempt used' : 'BUZZ'}</div>
            </button>
          ))}
        </div>
      )}

      {/* Options */}
      <div>
        {question?.options?.map((opt, idx) => {
          const isCorrect = idx === question.correctIndex;
          const isSelected = idx === selected;
          const show = selected !== null;
          return (
            <button
              key={idx}
              onClick={() => pick(opt, idx)}
              disabled={buzzedTeam === null || locked || selected !== null}
              className={optionClass(idx, selected, question.correctIndex, show, idx)}
              style={{ opacity: buzzedTeam === null ? 0.65 : 1 }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <Feedback
          isCorrect={selected === question.correctIndex}
          explanation={question.explanation}
        />
      )}

      <div style={{ marginTop: 14 }}>
        <div style={{ ...styles.divider, marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {localLog.map(item => (
              <div key={item.id} style={{
                padding: '10px 12px',
                borderRadius: 14,
                border: `1px solid ${RM_THEME.border}`,
                background: item.tone === 'good' ? 'rgba(34,197,94,0.10)' : 'rgba(255,59,59,0.10)',
                color: RM_THEME.text,
                fontSize: 13
              }}>
                {item.text}
              </div>
            ))}
          </div>
          <button onClick={() => setPhase('end')} style={{ ...styles.secondaryBtn, padding: '12px 16px' }}>
            Finish Early
          </button>
        </div>
      </div>
    </div>
  );
};

const FacilitatorDeck = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const ui = UI_STRINGS[lang];
  const TD = getTrainingData(lang);

  const [card, setCard] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [seconds, setSeconds] = useState(90);
  const [running, setRunning] = useState(false);

  const makeCard = () => {
    const need = getRandomItem(TD.needsVsWants.needs.examples);
    const want = getRandomItem(TD.needsVsWants.wants.examples);
    const unit = getRandomItem([
      ...TD.propertyTypes.residential.apartments,
      ...TD.propertyTypes.residential.villas
    ]);
    const finishing = getRandomItem(TD.finishingTypes.types);
    const abc = TD.callTechniques.abcTechnique.steps;
    const rapport = getRandomItem(TD.callTechniques.rapport.techniques);

    return {
      id: generateId(),
      title: lang === 'eg' ? 'سبرينت تمثيل أدوار' : 'Group Roleplay Sprint',
      brief: {
        need,
        want,
        unit: unit.name,
        finishing: finishing.name
      },
      prompt: lang === 'eg'
        ? `بالتيم: اعملوا مكالمة ٦٠–٩٠ ثانية بتقنية أ.ب.ج. حوّلوا “${need}” للسبب الأعمق “${want}”، وبعدين اقفلوا على التزام.`
        : `In teams, run a 60–90s call using A.B.C. Turn “${need}” into the deeper want “${want}”, then close for a commitment.`,
      guide: {
        abc,
        rapport,
        reminder: TD.communication.rule,
        note: TD.callTechniques.rapport.key
      }
    };
  };

  useEffect(() => {
    setCard(makeCard());
  }, [lang]);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, seconds]);

  const next = () => {
    setCard(makeCard());
    setReveal(false);
    setSeconds(90);
    setRunning(false);
    updateScore(5, true);
  };

  if (!card) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ ...styles.badge, ...styles.badgeBlue }}>🎛️ {ui.activityNames.facilitator}</span>
          <span style={{ ...styles.badge, ...styles.badgeGreen }}>{lang === 'eg' ? 'مناسب للبروجكتور' : 'Projector Friendly'}</span>
        </div>
        <div style={{ ...styles.pill, gap: 12 }}>
          <span style={{ color: RM_THEME.muted }}>{lang === 'eg' ? 'المؤقّت' : 'Timer'}</span>
          <strong style={{ fontSize: 18 }}>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</strong>
          <button
            onClick={() => setRunning(r => !r)}
            style={{ ...styles.secondaryBtn, padding: '10px 14px' }}
          >
            {running ? (lang === 'eg' ? 'إيقاف' : 'Pause') : (lang === 'eg' ? 'ابدأ' : 'Start')}
          </button>
          <button
            onClick={() => { setSeconds(90); setRunning(false); }}
            style={{ ...styles.secondaryBtn, padding: '10px 14px' }}
          >
            Reset
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 54 }}>🧑‍🏫</div>
        <div style={{ ...styles.stageTitle, fontSize: 36, marginTop: 8 }}>{card.title}</div>
        <div style={{ ...styles.stageSubtitle, maxWidth: 920 }}>{card.prompt}</div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 14,
        marginBottom: 16
      }}>
        {[
          { k: 'Need', v: card.brief.need, icon: '📌' },
          { k: 'Want', v: card.brief.want, icon: '❤️' },
          { k: 'Unit', v: card.brief.unit, icon: '🏠' },
          { k: 'Finishing', v: card.brief.finishing, icon: '🧱' }
        ].map(item => (
          <div key={item.k} style={{
            padding: 16,
            borderRadius: 16,
            background: 'rgba(0,0,0,0.35)',
            border: `1px solid ${RM_THEME.border}`
          }}>
            <div style={{ fontSize: 12, color: RM_THEME.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.icon} {item.k}</div>
            <div style={{ marginTop: 10, fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{item.v}</div>
          </div>
        ))}
      </div>

      {!reveal ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setReveal(true)} style={{ ...styles.primaryBtn, padding: '16px 30px' }}>
            👁️ {lang === 'eg' ? 'اظهر دليل المُدرّب' : 'Reveal Coach Guide'}
          </button>
          <button onClick={next} style={styles.secondaryBtn}>{lang === 'eg' ? 'الكارت اللي بعده →' : 'Next Card →'}</button>
        </div>
      ) : (
        <div style={{
          marginTop: 10,
          padding: 18,
          borderRadius: 18,
          border: `1px solid ${RM_THEME.border}`,
          background: 'linear-gradient(135deg, rgba(0,212,255,0.10), rgba(255,59,59,0.10))'
        }}>
          <h3 style={{ marginBottom: 10 }}>{lang === 'eg' ? 'دليل المُدرّب' : 'Coach Guide'}</h3>
          <div style={{ color: RM_THEME.muted, lineHeight: 1.7 }}>
            <div><strong>{lang === 'eg' ? 'أ.ب.ج' : 'A.B.C'}:</strong> {card.guide.abc.join(' → ')}</div>
            <div><strong>{lang === 'eg' ? 'إشارة الألفة' : 'Rapport cue'}:</strong> {card.guide.rapport}</div>
            <div><strong>{lang === 'eg' ? 'تذكير التواصل' : 'Communication reminder'}:</strong> {card.guide.reminder}</div>
            <div style={{ marginTop: 8, color: RM_THEME.faint }}>{card.guide.note}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
            <button onClick={next} style={styles.primaryBtn}>{lang === 'eg' ? 'الكارت اللي بعده →' : 'Next Card →'}</button>
            <button onClick={() => setReveal(false)} style={styles.secondaryBtn}>{lang === 'eg' ? 'اخفي الدليل' : 'Hide Guide'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

const ConsensusClash = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';

  const [prompt, setPrompt] = useState(null);
  const [choices, setChoices] = useState([]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [votes, setVotes] = useState({});
  const [reveal, setReveal] = useState(false);
  const [teamCount, setTeamCount] = useState(3);

  const buildPrompt = () => {
    const q = buildRandomQuestion(lang);
    return q;
  };

  useEffect(() => {
    const q = buildPrompt();
    setPrompt(q);
    setChoices(q.options);
    setCorrectIdx(q.correctIndex);
    setVotes({});
    setReveal(false);
  }, [lang]);

  const castVote = (team, idx) => {
    if (reveal) return;
    setVotes(prev => ({ ...prev, [team]: idx }));
  };

  const revealNow = () => {
    setReveal(true);
    const correctTeams = Object.values(votes).filter(v => v === correctIdx).length;
    updateScore(correctTeams * 10, correctTeams > 0);
  };

  const next = () => {
    const q = buildPrompt();
    setPrompt(q);
    setChoices(q.options);
    setCorrectIdx(q.correctIndex);
    setVotes({});
    setReveal(false);
  };

  if (!prompt) return <div>Loading...</div>;

  const teams = Array.from({ length: teamCount }, (_, i) => `Team ${i + 1}`);
  const counts = choices.map((_, idx) => Object.values(votes).filter(v => v === idx).length);
  const maxCount = Math.max(1, ...counts);

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ ...styles.badge, ...styles.badgeGreen }}>🗳️ Consensus Clash</span>
          <span style={{ ...styles.badge, ...styles.badgeBlue }}>{prompt.category}</span>
        </div>
        <div style={styles.pill}>
          <span style={{ color: RM_THEME.muted }}>Teams</span>
          <button onClick={() => setTeamCount(c => clamp(c - 1, 2, 4))} style={{ ...styles.secondaryBtn, padding: '10px 14px' }}>−</button>
          <strong>{teamCount}</strong>
          <button onClick={() => setTeamCount(c => clamp(c + 1, 2, 4))} style={{ ...styles.secondaryBtn, padding: '10px 14px' }}>+</button>
        </div>
      </div>

      <div style={{
        padding: 18,
        borderRadius: 18,
        background: 'rgba(0,0,0,0.35)',
        border: `1px solid ${RM_THEME.border}`,
        marginBottom: 14
      }}>
        <div style={{ fontSize: 12, color: RM_THEME.faint, textTransform: 'uppercase', letterSpacing: '0.10em' }}>Prompt</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, lineHeight: 1.4 }}>{prompt.prompt}</div>
        <div style={{ marginTop: 10, color: RM_THEME.muted, fontSize: 14 }}>Each team votes. Then reveal the distribution.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 14 }}>
        {teams.map(team => (
          <div key={team} style={{
            padding: 16,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${RM_THEME.border}`
          }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>{team}</div>
            {choices.map((c, idx) => (
              <button
                key={idx}
                onClick={() => castVote(team, idx)}
                className={optionClass(idx, votes[team], correctIdx, reveal, idx)} style={{ marginBottom: 10, padding: 14, borderRadius: 14 }}
              >
                {c}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div style={{
        padding: 18,
        borderRadius: 18,
        background: 'rgba(0,0,0,0.28)',
        border: `1px solid ${RM_THEME.border}`
      }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Vote Distribution</div>
        {choices.map((c, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <div style={{ color: RM_THEME.muted, fontSize: 14 }}>{c}</div>
            <div style={{
              height: 10,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.10)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${(counts[idx] / maxCount) * 100}%`,
                background: reveal
                  ? (idx === correctIdx ? `linear-gradient(90deg, ${RM_THEME.green}, rgba(34,197,94,0.5))` : `linear-gradient(90deg, ${RM_THEME.red}, rgba(255,59,59,0.45))`)
                  : `linear-gradient(90deg, rgba(0,212,255,0.65), rgba(139,92,246,0.45))`
              }} />
            </div>
          </div>
        ))}

        {!reveal ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
            <button onClick={revealNow} style={styles.primaryBtn}>Reveal Answer</button>
            <button onClick={next} style={styles.secondaryBtn}>Next Prompt →</button>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <Feedback isCorrect={true} explanation={prompt.explanation} />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
              <button onClick={next} style={styles.primaryBtn}>Next Prompt →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewRescue = ({ onBack, updateScore, academyContext }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const targets = (academyContext?.reviewQueue || []).slice(0, 4);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    setQuestions(Array.from({ length: 6 }, () => buildRandomQuestion(lang)));
    setCurrentQ(0);
    setSelected(null);
    setShowFeedback(false);
    setLocalScore(0);
  }, [lang]);

  if (!questions.length) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const question = questions[currentQ];
  const isLast = currentQ === questions.length - 1;

  const handleAnswer = (option, idx) => {
    if (showFeedback) return;
    const correct = idx === question.correctIndex;
    setSelected(idx);
    setShowFeedback(true);
    if (correct) {
      setLocalScore(prev => prev + 12);
      updateScore(12, true);
    } else {
      updateScore(0, false);
    }
  };

  const next = () => {
    if (isLast) return;
    setCurrentQ(prev => prev + 1);
    setSelected(null);
    setShowFeedback(false);
  };

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ ...styles.badge, ...styles.badgeRed }}>🛟 {UI_STRINGS[lang].activityNames.reviewrescue}</span>
          <span style={{ ...styles.badge, ...styles.badgeBlue }}>{lang === 'eg' ? 'أضعف النقاط' : 'Weak Areas'}</span>
        </div>
        <ScorePanel score={localScore} streak={0} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />

      <div style={{ marginBottom: 18, color: RM_THEME.muted, lineHeight: 1.7 }}>
        {lang === 'eg'
          ? 'دي جولة إنقاذ سريعة مبنية على فكرة المراجعة الذكية. كمّل الجولة وبعدين ارجع لأكتر أنشطة محتاجة شغل.'
          : 'This is an adaptive rescue round built to pull weak areas back into active recall. Finish the round, then jump into the activities that need work most.'}
      </div>

      <h2 style={styles.questionText}>{question.prompt}</h2>
      {question.options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => handleAnswer(option, idx)}
          className={optionClass(idx, selected, question.correctIndex, showFeedback, idx)}
        >
          {option}
        </button>
      ))}

      {showFeedback && (
        <>
          <Feedback isCorrect={selected === question.correctIndex} explanation={question.explanation} />
          {!isLast ? (
            <NextButton onClick={next} />
          ) : (
            <div style={{ marginTop: 18 }}>
              <div style={{ ...styles.divider, marginBottom: 14 }} />
              <h3 style={{ marginBottom: 12 }}>{lang === 'eg' ? 'إيه اللي تراجع عليه بعد كده؟' : 'What should you review next?'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {targets.map(target => (
                  <div key={target.id} style={{
                    padding: 14,
                    borderRadius: 16,
                    border: `1px solid ${RM_THEME.border}`,
                    background: 'rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                      <strong>{target.name}</strong>
                      <span style={{ color: RM_THEME.red, fontSize: 12, fontWeight: 800 }}>{target.mastery}%</span>
                    </div>
                    <div style={{ marginTop: 6, color: RM_THEME.muted, fontSize: 12 }}>{target.categoryTitle}</div>
                    <button onClick={() => academyContext?.launchActivity?.(target)} style={{ ...styles.secondaryBtn, marginTop: 12 }}>
                      {lang === 'eg' ? 'افتح النشاط' : 'Open Activity'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const AcademySprint = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [localScore, setLocalScore] = useState(0);
  const [timerSeed, setTimerSeed] = useState(0);

  useEffect(() => {
    setQuestions(Array.from({ length: 8 }, () => buildRandomQuestion(lang)));
    setCurrentQ(0);
    setSelected(null);
    setShowFeedback(false);
    setLocalScore(0);
    setTimerSeed(prev => prev + 1);
  }, [lang]);

  if (!questions.length) return <div>{lang === 'eg' ? 'جاري التحميل…' : 'Loading...'}</div>;

  const question = questions[currentQ];
  const isLast = currentQ === questions.length - 1;

  const submitAnswer = (idx) => {
    if (showFeedback) return;
    const correct = idx === question.correctIndex;
    setSelected(idx);
    setShowFeedback(true);
    if (correct) {
      setLocalScore(prev => prev + 15);
      updateScore(15, true);
    } else {
      updateScore(0, false);
    }
  };

  const nextQuestion = () => {
    if (isLast) return;
    setCurrentQ(prev => prev + 1);
    setSelected(null);
    setShowFeedback(false);
    setTimerSeed(prev => prev + 1);
  };

  const handleTimeUp = () => {
    if (showFeedback) return;
    setSelected(null);
    setShowFeedback(true);
    updateScore(0, false);
  };

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ ...styles.badge, ...styles.badgeGreen }}>⚡ {UI_STRINGS[lang].activityNames.academysprint}</span>
          <span style={{ ...styles.badge, ...styles.badgeBlue }}>{lang === 'eg' ? 'ميكس سريع' : 'Mixed Pressure Round'}</span>
        </div>
        <ScorePanel score={localScore} streak={0} totalQuestions={questions.length} currentQuestion={currentQ + 1} />
      </div>

      <ProgressBar current={currentQ + 1} total={questions.length} />
      <Timer key={timerSeed} seconds={10} onTimeUp={handleTimeUp} />

      <h2 style={styles.questionText}>{question.prompt}</h2>
      {question.options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => submitAnswer(idx)}
          className={optionClass(idx, selected, question.correctIndex, showFeedback, idx)}
        >
          {option}
        </button>
      ))}

      {showFeedback && (
        <>
          <Feedback isCorrect={selected === question.correctIndex} explanation={question.explanation} />
          {!isLast ? (
            <NextButton onClick={nextQuestion} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <div style={{ fontSize: 56 }}>🏁</div>
              <h3 style={{ marginTop: 10 }}>{lang === 'eg' ? `خلصت السبرينت! ${localScore} نقطة` : `Sprint complete! ${localScore} points`}</h3>
              <p style={{ color: RM_THEME.muted, marginTop: 8 }}>
                {lang === 'eg' ? 'الجولة دي ممتازة للتسخين أو قبل الامتحان النهائي.' : 'Use this as a warm-up lap or a sharp pre-exam pressure round.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ObjectionDuelArena = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const scenarios = useMemo(() => {
    if (lang === 'eg') {
      return [
        {
          objection: 'السعر عالي عليا جدًا دلوقتي.',
          prompt: 'أنهي رد أحسن؟',
          options: [
            'أيوه بس كل الأسعار غليت ومفيش حاجة نعملها.',
            'أتفهم ده. خلّيني أربط السعر بالقيمة والعائد أو خيارات الدفع المناسبة لحضرتك.',
            'طب خلّيك في حاجة أرخص وخلاص.',
            'هو ده السعر النهائي وخدها أو سيبها.'
          ],
          correctIndex: 1,
          explanation: 'أفضل رد يعترف بالاعتراض ثم يربط السعر بالقيمة/العائد أو بخيارات مناسبة بدل الدفاع أو الإغلاق العدائي.'
        },
        {
          objection: 'أنا لسه هشوف كذا شركة تانية.',
          prompt: 'أنهي رد يخلّي المكالمة ذكية؟',
          options: [
            'تمام براحتك وكلمني لما تخلّص.',
            'ليه؟ إحنا أحسن شركة أصلًا.',
            'طبيعي تقارن. قبل ما تقفل، أخلّيك تقارن على 3 معايير صح عشان القرار يبقى أوضح؟',
            'طب أنا هبعت كل المشاريع اللي عندي وخلاص.'
          ],
          correctIndex: 2,
          explanation: 'الرد الأقوى يعترف إن المقارنة منطقية ويعيد قيادة القرار بمعايير تقييم ذكية بدل الدفاع أو الانسحاب.'
        },
        {
          objection: 'مش مقتنع إن دي فرصة استثمارية دلوقتي.',
          prompt: 'أفضل رد استشاري هو:',
          options: [
            'لا دي فرصة عظيمة وماتتفوتش.',
            'إيه اللي محتاج تشوفه عشان تحس إنها فرصة فعلًا: عائد، خطة سداد، ولا قوة الموقع؟',
            'يبقى الاستثمار مش مناسب لحضرتك.',
            'كل الناس بتشتري دلوقتي فإنت لازم تلحق.'
          ],
          correctIndex: 1,
          explanation: 'أفضل رد يفتح استكشاف المعايير الحقيقية وراء الاعتراض بدل الضغط أو التعميم.'
        }
      ];
    }

    return [
      {
        objection: 'The price feels too high for me right now.',
        prompt: 'Which response is strongest?',
        options: [
          'Prices are up everywhere, so there is nothing we can do.',
          'I get that. Let me connect the price to value, return, and payment structure that fits your situation.',
          'Then just look at something cheaper.',
          'This is the final price, take it or leave it.'
        ],
        correctIndex: 1,
        explanation: 'The strongest response acknowledges the objection, then reframes around value, ROI, and fit rather than defending or becoming rigid.'
      },
      {
        objection: 'I still want to compare with a few other companies.',
        prompt: 'Which reply keeps control intelligently?',
        options: [
          'Sure, call me when you finish comparing.',
          'Why? We are obviously better than everyone else.',
          'That makes sense. Before you go, want a cleaner 3-point comparison framework so your decision is smarter?',
          'I will just send everything I have and you decide.'
        ],
        correctIndex: 2,
        explanation: 'The best response validates comparison, then reclaims the conversation by offering decision criteria instead of surrendering control.'
      },
      {
        objection: 'I am not convinced this is an investment opportunity yet.',
        prompt: 'What is the most consultative next line?',
        options: [
          'No, this is definitely a great opportunity.',
          'What would you need to see to believe it is an opportunity: return, payment plan, or location strength?',
          'Maybe investment is not right for you then.',
          'Everyone is buying now, so you should move fast.'
        ],
        correctIndex: 1,
        explanation: 'The best line explores the underlying criteria behind the objection instead of pushing, generalizing, or withdrawing.'
      }
    ];
  }, [lang]);

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [localScore, setLocalScore] = useState(0);
  const [roundSide, setRoundSide] = useState('A');

  const scenario = scenarios[currentQ];
  const isLast = currentQ === scenarios.length - 1;

  const choose = (idx) => {
    if (showFeedback) return;
    const correct = idx === scenario.correctIndex;
    setSelected(idx);
    setShowFeedback(true);
    if (correct) {
      setLocalScore(prev => prev + 20);
      updateScore(20, true);
    } else {
      updateScore(0, false);
    }
  };

  const next = () => {
    if (isLast) return;
    setCurrentQ(prev => prev + 1);
    setSelected(null);
    setShowFeedback(false);
    setRoundSide(prev => (prev === 'A' ? 'B' : 'A'));
  };

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...styles.badge, ...styles.badgeRed }}>🥊 {UI_STRINGS[lang].activityNames.objectionduel}</span>
          <span style={{ ...styles.badge, ...styles.badgeBlue }}>{lang === 'eg' ? `الجولة لطرف ${roundSide}` : `Round for Side ${roundSide}`}</span>
        </div>
        <ScorePanel score={localScore} streak={0} totalQuestions={scenarios.length} currentQuestion={currentQ + 1} />
      </div>

      <div style={{
        padding: 18,
        borderRadius: 18,
        border: `1px solid ${RM_THEME.border}`,
        background: 'linear-gradient(135deg, rgba(255,59,59,0.12), rgba(0,212,255,0.08))',
        marginBottom: 18
      }}>
        <div style={{ color: RM_THEME.faint, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.10em' }}>
          {lang === 'eg' ? 'اعتراض العميل' : 'Client Objection'}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8, lineHeight: 1.4 }}>{scenario.objection}</div>
        <div style={{ marginTop: 10, color: RM_THEME.muted }}>{scenario.prompt}</div>
      </div>

      {scenario.options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => choose(idx)}
          className={optionClass(idx, selected, scenario.correctIndex, showFeedback, idx)}
        >
          {option}
        </button>
      ))}

      {showFeedback && (
        <>
          <Feedback isCorrect={selected === scenario.correctIndex} explanation={scenario.explanation} />
          {!isLast ? (
            <NextButton onClick={next} label={lang === 'eg' ? 'بدّل الدور →' : 'Swap Role →'} />
          ) : (
            <div style={{ textAlign: 'center', marginTop: 18, color: RM_THEME.muted }}>
              {lang === 'eg'
                ? 'الخطوة الجاية: خلو الطرف التاني يعيد نفس الجولة بصياغته هو.'
                : 'Next move: have the other side replay the same objections in their own wording.'}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CallFlowBuilder = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const challenge = useMemo(() => {
    if (lang === 'eg') {
      return {
        title: 'رتّب مسار المكالمة الذكية',
        steps: [
          'ابدأ بهوك قيمة واضح وواثق',
          'اعترف بسياق العميل وخليه يحس إنك فاهمه',
          'اسأل أسئلة تأهيل تكشف الاحتياج الحقيقي',
          'حوّل الاحتياج للدافع الأعمق أو الفايدة',
          'اربط أفضل اختيار بالاحتياج والدافع',
          'اختم بالتزام أو خطوة جاية واضحة'
        ],
        explanation: 'المكالمة القوية تمشي من فتح قوي إلى فهم، ثم تأهيل، ثم ربط بالقيمة، ثم التزام واضح.'
      };
    }
    return {
      title: 'Order the Smart Call Flow',
      steps: [
        'Open with a clear, confident value hook',
        'Acknowledge the client context so they feel understood',
        'Ask qualification questions to surface the real need',
        'Translate the need into the deeper motive or benefit',
        'Connect the best-fit option to the need and motive',
        'Close on a commitment or clear next step'
      ],
      explanation: 'A strong call moves from opening, to understanding, to qualification, to value linkage, to commitment.'
    };
  }, [lang]);

  const [available, setAvailable] = useState(() => shuffleArray([...challenge.steps]));
  const [chosen, setChosen] = useState([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAvailable(shuffleArray([...challenge.steps]));
    setChosen([]);
    setChecked(false);
  }, [challenge]);

  const pickStep = (step) => {
    if (checked) return;
    setChosen(prev => [...prev, step]);
    setAvailable(prev => prev.filter(item => item !== step));
  };

  const undo = () => {
    if (checked || !chosen.length) return;
    const previousStep = chosen[chosen.length - 1];
    setChosen(prev => prev.slice(0, -1));
    setAvailable(prev => [previousStep, ...prev]);
  };

  const reset = () => {
    setAvailable(shuffleArray([...challenge.steps]));
    setChosen([]);
    setChecked(false);
  };

  const check = () => {
    if (chosen.length !== challenge.steps.length) return;
    const correct = JSON.stringify(chosen) === JSON.stringify(challenge.steps);
    setChecked(true);
    if (correct) updateScore(60, true);
    else updateScore(0, false);
  };

  const correct = JSON.stringify(chosen) === JSON.stringify(challenge.steps);

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>🧭 {UI_STRINGS[lang].activityNames.callflow}</span>
        <div style={styles.pill}>{lang === 'eg' ? 'كووتش مود' : 'Coach Mode'}</div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={styles.stageTitle}>{challenge.title}</div>
        <div style={styles.stageSubtitle}>
          {lang === 'eg'
            ? 'اختار العناصر بالترتيب اللي يخلي المكالمة تمشي صح من أول ثانية لحد الالتزام.'
            : 'Select the steps in the order that makes the call move intelligently from opening to commitment.'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div style={{ padding: 16, borderRadius: 18, border: `1px solid ${RM_THEME.border}`, background: 'rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginBottom: 12 }}>{lang === 'eg' ? 'اختياراتك' : 'Your Order'}</h3>
          {chosen.length === 0 && <div style={{ color: RM_THEME.muted }}>{lang === 'eg' ? 'ابدأ اختار من العمود التاني.' : 'Start picking from the right column.'}</div>}
          {chosen.map((step, idx) => (
            <div key={step} style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: checked
                ? (challenge.steps[idx] === step ? 'rgba(34,197,94,0.12)' : 'rgba(255,59,59,0.12)')
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${RM_THEME.border}`,
              marginBottom: 10
            }}>
              <strong style={{ marginRight: 8 }}>{idx + 1}.</strong>
              {step}
            </div>
          ))}
        </div>

        <div style={{ padding: 16, borderRadius: 18, border: `1px solid ${RM_THEME.border}`, background: 'rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginBottom: 12 }}>{lang === 'eg' ? 'الخطوات المتاحة' : 'Available Steps'}</h3>
          {available.map(step => (
            <button key={step} onClick={() => pickStep(step)} className="game-option game-option--blue" style={{ marginBottom: 10 }}>{step}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
        <button onClick={check} disabled={chosen.length !== challenge.steps.length || checked} style={styles.primaryBtn}>
          {lang === 'eg' ? 'شيّك الترتيب' : 'Check Order'}
        </button>
        <button onClick={undo} disabled={!chosen.length || checked} style={styles.secondaryBtn}>
          {lang === 'eg' ? 'ارجع خطوة' : 'Undo Step'}
        </button>
        <button onClick={reset} style={styles.secondaryBtn}>{lang === 'eg' ? 'إعادة ترتيب' : 'Reset'}</button>
      </div>

      {checked && (
        <Feedback isCorrect={correct} explanation={challenge.explanation} />
      )}
    </div>
  );
};

const CoachDebriefConsole = ({ onBack, academyContext }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const recentSessions = academyContext?.recentSessions || [];
  const categorySummaries = academyContext?.categorySummaries || [];
  const academyStats = academyContext?.academyStats || { playedActivities: 0, masteredActivities: 0, reviewCount: 0 };
  const recommendedActivity = academyContext?.recommendedActivity || null;
  const coachingPriority = academyContext?.coachingPriority || null;
  const weakestCategory = academyContext?.weakestCategory || null;
  const strongestCategory = academyContext?.strongestCategory || null;

  const recentWindow = recentSessions.slice(0, 8);
  const recentAccuracy = recentWindow.length
    ? Math.round((recentWindow.filter(session => session.isCorrect).length / recentWindow.length) * 100)
    : 0;
  const recentPoints = recentWindow.reduce((sum, session) => sum + session.points, 0);

  const laneSignals = [...categorySummaries]
    .filter(category => category.playedCount > 0 || category.activities.length > 0)
    .sort((left, right) => left.mastery - right.mastery)
    .slice(0, 4);

  const recommendedWarmup = recentSessions.length
    ? (academyContext?.activityInsights || []).find(activity => activity.id === 'reviewrescue') || recommendedActivity
    : (academyContext?.activityInsights || []).find(activity => activity.id === 'academysprint') || recommendedActivity;

  return (
    <div style={styles.card} className="animate-fadeIn">
      <BackButton onClick={onBack} />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ ...styles.badge, ...styles.badgeBlue }}>🧑‍🏫 {UI_STRINGS[lang].activityNames.debrief}</span>
          <span style={{ ...styles.badge, ...styles.badgeGreen }}>{lang === 'eg' ? 'إدارة الجلسة' : 'Session Intelligence'}</span>
        </div>
        <div style={styles.pill}>{lang === 'eg' ? `آخر ${recentWindow.length || 0} نتائج` : `Last ${recentWindow.length || 0} results`}</div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={styles.stageTitle}>{lang === 'eg' ? 'ديبريف سريع للمدرب' : 'Fast Coach Debrief'}</div>
        <div style={styles.stageSubtitle}>
          {lang === 'eg'
            ? 'اعرف مين محتاج شغل، إيه المسار الأقوى، وابدأ الجلسة الجاية من أنسب نقطة.'
            : 'See what is slipping, what is strongest, and where the next coaching session should start.'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 }}>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{lang === 'eg' ? 'الدقة الأخيرة' : 'Recent Accuracy'}</span>
          <span style={styles.scoreValue}>{recentAccuracy}%</span>
        </div>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{lang === 'eg' ? 'نقاط الجلسات' : 'Recent Points'}</span>
          <span style={styles.scoreValue}>{recentPoints}</span>
        </div>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{lang === 'eg' ? 'أنشطة متجربة' : 'Played Activities'}</span>
          <span style={styles.scoreValue}>{academyStats.playedActivities}</span>
        </div>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel}>{lang === 'eg' ? 'قائمة المراجعة' : 'Review Queue'}</span>
          <span style={styles.scoreValue}>{academyStats.reviewCount}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 18 }}>
        <div style={{ padding: 18, borderRadius: 18, border: `1px solid ${RM_THEME.border}`, background: 'rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginBottom: 12 }}>{lang === 'eg' ? 'قرارات سريعة للمدرب' : 'Coach Decisions'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ color: RM_THEME.faint, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'eg' ? 'ابدأ بـ' : 'Start With'}</div>
              <div style={{ fontWeight: 900, marginTop: 4 }}>{recommendedWarmup ? recommendedWarmup.name : (lang === 'eg' ? 'Academy Sprint' : 'Academy Sprint')}</div>
              <div style={{ color: RM_THEME.muted, fontSize: 13, marginTop: 4 }}>
                {recentSessions.length
                  ? (lang === 'eg' ? 'ابدأ بمراجعة واسترجاع سريع قبل التدريب الأعمق.' : 'Open with a retrieval-based warm-up before deeper coaching.')
                  : (lang === 'eg' ? 'ابدأ بجولة baseline سريعة عشان تبني صورة واضحة.' : 'Open with a baseline sprint to create a clean starting picture.')}
              </div>
            </div>
            <div>
              <div style={{ color: RM_THEME.faint, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'eg' ? 'درّل أساسي' : 'Primary Drill'}</div>
              <div style={{ fontWeight: 900, marginTop: 4 }}>{coachingPriority ? coachingPriority.name : (lang === 'eg' ? 'كروت المُيسّر' : 'Facilitator Deck')}</div>
              <div style={{ color: RM_THEME.muted, fontSize: 13, marginTop: 4 }}>
                {lang === 'eg'
                  ? 'اختار نشاط coaching أو partner عليه أقل إتقان واشتغل عليه واحد لواحد أو role-swap.'
                  : 'Run the weakest coaching or partner drill next and use it for 1:1 work or a role-swap round.'}
              </div>
            </div>
            <div>
              <div style={{ color: RM_THEME.faint, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'eg' ? 'إقفال الجلسة' : 'Session Close'}</div>
              <div style={{ fontWeight: 900, marginTop: 4 }}>{weakestCategory?.suggested ? weakestCategory.suggested.name : (recommendedActivity?.name || (lang === 'eg' ? 'الامتحان النهائي' : 'Final Exam'))}</div>
              <div style={{ color: RM_THEME.muted, fontSize: 13, marginTop: 4 }}>
                {lang === 'eg'
                  ? 'اختم بسؤال check أو نشاط صغير في أضعف مسار عشان تشوف التحسن فورًا.'
                  : 'Close with a check activity inside the weakest lane so the improvement is immediately visible.'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 18, borderRadius: 18, border: `1px solid ${RM_THEME.border}`, background: 'rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginBottom: 12 }}>{lang === 'eg' ? 'إشارات المسارات' : 'Lane Signals'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,59,59,0.10)', border: `1px solid ${RM_THEME.border}` }}>
              <div style={{ color: RM_THEME.faint, fontSize: 12 }}>{lang === 'eg' ? 'أضعف مسار' : 'Weakest Lane'}</div>
              <div style={{ fontWeight: 900, marginTop: 4 }}>{weakestCategory ? weakestCategory.title : '—'}</div>
              <div style={{ color: RM_THEME.muted, fontSize: 13, marginTop: 4 }}>{weakestCategory ? `${weakestCategory.mastery}%` : (lang === 'eg' ? 'ابدأ لعب عشان يبان' : 'Play to unlock')}</div>
            </div>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(34,197,94,0.10)', border: `1px solid ${RM_THEME.border}` }}>
              <div style={{ color: RM_THEME.faint, fontSize: 12 }}>{lang === 'eg' ? 'أقوى مسار' : 'Strongest Lane'}</div>
              <div style={{ fontWeight: 900, marginTop: 4 }}>{strongestCategory ? strongestCategory.title : '—'}</div>
              <div style={{ color: RM_THEME.muted, fontSize: 13, marginTop: 4 }}>{strongestCategory ? `${strongestCategory.mastery}%` : (lang === 'eg' ? 'مفيش baseline لسه' : 'No baseline yet')}</div>
            </div>
            <div style={{ color: RM_THEME.muted, fontSize: 13, lineHeight: 1.6 }}>
              {lang === 'eg'
                ? 'استخدم أقوى مسار كبداية ثقة، ثم انقل الفريق أو الفرد إلى أضعف مسار لما الطاقة تبقى جاهزة.'
                : 'Use the strongest lane to build confidence early, then move the learner or room into the weakest lane once energy is established.'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 18, padding: 18, borderRadius: 18, border: `1px solid ${RM_THEME.border}`, background: 'rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <h3>{lang === 'eg' ? 'Heatmap سريع للمسارات' : 'Quick Lane Heatmap'}</h3>
          <span style={{ color: RM_THEME.faint, fontSize: 12 }}>{lang === 'eg' ? 'من الأقل للأعلى' : 'Lowest to highest'}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {laneSignals.map(category => (
            <div key={category.id} style={{ padding: 14, borderRadius: 14, border: `1px solid ${RM_THEME.border}`, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <strong>{category.title}</strong>
                <span style={{ color: category.mastery < 72 ? RM_THEME.red : RM_THEME.green, fontWeight: 800 }}>{category.mastery}%</span>
              </div>
              <div style={{ ...styles.progressBar, marginTop: 10, marginBottom: 8 }}>
                <div style={{ ...styles.progressFill, width: `${category.mastery}%` }} />
              </div>
              <div style={{ color: RM_THEME.muted, fontSize: 12 }}>
                {lang === 'eg'
                  ? `أنسب نشاط دلوقتي: ${category.suggested?.name || '—'}`
                  : `Best next activity: ${category.suggested?.name || '—'}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 18, padding: 18, borderRadius: 18, border: `1px solid ${RM_THEME.border}`, background: 'rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <h3>{lang === 'eg' ? 'آخر المحاولات' : 'Recent Attempts'}</h3>
          <span style={{ ...styles.badge, ...styles.badgeGreen }}>{recentWindow.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recentWindow.map(session => (
            <div key={session.id} style={{ padding: '12px 14px', borderRadius: 14, border: `1px solid ${RM_THEME.border}`, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <strong>{session.activityName}</strong>
                <span style={{ color: session.isCorrect ? RM_THEME.green : RM_THEME.red, fontWeight: 800 }}>{session.isCorrect ? '+' : ''}{session.points}</span>
              </div>
              <div style={{ color: RM_THEME.muted, fontSize: 12, marginTop: 4 }}>{session.categoryTitle} • {formatLastPlayed(lang, session.at)}</div>
            </div>
          ))}
          {recentWindow.length === 0 && (
            <div style={{ color: RM_THEME.muted, lineHeight: 1.6 }}>
              {lang === 'eg'
                ? 'أول ما يبدأ اللاعب أو الفريق أنشطة، الديبريف هيبدأ يبني لك صورة أدق للجلسة.'
                : 'As soon as sessions begin, this debrief will build a sharper picture of what the next coaching block should do.'}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        {recommendedWarmup && (
          <button onClick={() => academyContext?.launchActivity?.(recommendedWarmup)} style={styles.primaryBtn}>
            {lang === 'eg' ? 'ابدأ الـ Warm-up' : 'Launch Warm-up'}
          </button>
        )}
        {coachingPriority && (
          <button onClick={() => academyContext?.launchActivity?.(coachingPriority)} style={styles.secondaryBtn}>
            {lang === 'eg' ? 'افتح الدرّل الأساسي' : 'Open Primary Drill'}
          </button>
        )}
        {weakestCategory?.suggested && (
          <button onClick={() => academyContext?.launchActivity?.(weakestCategory.suggested)} style={styles.secondaryBtn}>
            {lang === 'eg' ? 'عالِج أضعف مسار' : 'Fix Weakest Lane'}
          </button>
        )}
      </div>
    </div>
  );
};

const APP_STORAGE = {
  tone: 'rmTone',
  fxIntensity: 'rmFxIntensity',
  reduceMotion: 'rmReduceMotion',
  backgroundEnabled: 'rmBackgroundEnabled',
  projectorMode: 'rmProjectorMode',
  globalScore: 'rmGlobalScore',
  globalStreak: 'rmGlobalStreak',
  academyProgress: 'rmAcademyProgress'
};

const readJsonStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const createEmptyActivityTrack = () => ({
  attempts: 0,
  correct: 0,
  incorrect: 0,
  totalPoints: 0,
  bestPoints: 0,
  lastPlayedAt: null
});

const computeMastery = (stats) => {
  const track = stats || createEmptyActivityTrack();
  if (!track.attempts) return 0;
  const accuracy = track.correct / Math.max(1, track.attempts);
  const repetition = Math.min(track.attempts / 8, 1);
  return Math.round((accuracy * 0.72 + repetition * 0.28) * 100);
};

const formatLastPlayed = (lang, timestamp) => {
  if (!timestamp) return lang === 'eg' ? 'لسه ما اتلعبش' : 'Not played yet';
  const diffMs = Date.now() - timestamp;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return lang === 'eg' ? 'من شوية' : 'Just now';
  if (diffHours < 24) return lang === 'eg' ? `من ${diffHours} س` : `${diffHours}h ago`;
  if (diffDays < 7) return lang === 'eg' ? `من ${diffDays} يوم` : `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(lang === 'eg' ? 'ar-EG' : 'en-US');
};

const MODE_LABELS = {
  en: {
    solo: 'Solo',
    coaching: '1:1 Coach',
    partner: 'Partner',
    group: 'Group',
    classroom: 'Classroom'
  },
  eg: {
    solo: 'سولو',
    coaching: 'واحد لواحد',
    partner: 'بارتنر',
    group: 'جروب',
    classroom: 'فصل'
  }
};

// ═══════════════════════════════════════════════════════════════
// GAME 1 — CLIENT MATCH
// Match the right unit type to each client profile (10 rounds)
// ═══════════════════════════════════════════════════════════════
const CLIENT_MATCH_DATA = [
  { id:1, name:{en:'The El-Sayed Family',eg:'عيلة السيد'}, emoji:'👨‍👩‍👧‍👦', profile:{en:'Budget: 3M EGP • Family of 5 • Wants garden & privacy',eg:'ميزانية: ٣م • عيلة ٥ أفراد • عايزين جنينة وخصوصية'}, bestMatch:'Twin House', reason:{en:'Shared wall saves cost, private garden, family-sized',eg:'حيط مشترك بيوفّر في التكلفة وفيها جنينة'}, options:['Twin House','Penthouse','Studio','Admin'] },
  { id:2, name:{en:'Eng. Ramy',eg:'م. رامي'}, emoji:'👨‍💼', profile:{en:'Budget: 800K EGP • Single • Investment-focused, wants rental income',eg:'ميزانية: ٨٠٠ك • أعزب • استثمار، عايز إيجار'}, bestMatch:'Studio', reason:{en:'Low cost, high rental demand, easy to manage',eg:'سعر منخفض، طلب إيجار عالي، سهل التأجير'}, options:['Studio','Stand Alone','Town House','Twin House'] },
  { id:3, name:{en:'Dr. Hana',eg:'د. هنا'}, emoji:'👩‍⚕️', profile:{en:'Budget: 5M EGP+ • Professional • Wants luxury & top-floor prestige',eg:'ميزانية: +٥م • متخصصة • عايزة فخامة وبريستيج'}, bestMatch:'Penthouse', reason:{en:'Top floor luxury, prestige views, matches professional image',eg:'أعلى دور بتشطيب فاخر، يناسب شخصية بروفيشنال'}, options:['Penthouse','Apartment','Studio','Duplex'] },
  { id:4, name:{en:'Mr. Karim',eg:'أ. كريم'}, emoji:'🧔', profile:{en:'Budget: 2.5M EGP • Couple • Wants two-floor layout for privacy',eg:'ميزانية: ٢.٥م • محتاج شقة على دورين لفراغات منفصلة'}, bestMatch:'Duplex', reason:{en:'Two-level living with internal staircase, unique layout',eg:'حياة على دورين بسلم داخلي، تصميم مختلف'}, options:['Duplex','Town House','Studio','Admin'] },
  { id:5, name:{en:'Startup Office',eg:'مكاتب ستارت-أب'}, emoji:'🏢', profile:{en:'Commercial • Needs offices for 20 staff, branding important',eg:'تجاري • مكاتب لـ٢٠ موظف والبراند مهم'}, bestMatch:'Admin', reason:{en:'Administrative offices, professional image for corporate use',eg:'وحدات إدارية، صورة احترافية للشركة'}, options:['Admin','Studio','Penthouse','Apartment'] },
  { id:6, name:{en:'Osama & Family',eg:'أسامة وعيلته'}, emoji:'👪', profile:{en:'Budget: 4M EGP • Family of 3 • Row home in compound, community feel',eg:'ميزانية: ٤م • يريد بيت في صف ضمن كمباوند'}, bestMatch:'Town House', reason:{en:'Row home in compound, community-oriented, multi-story',eg:'تاون هاوس في كمباوند، كوميونيتي، أدوار متعددة'}, options:['Town House','Penthouse','Studio','Duplex'] },
  { id:7, name:{en:'Retail Brand X',eg:'براند تجاري X'}, emoji:'🛍️', profile:{en:'Commercial • Storefront on ground floor, high foot traffic',eg:'تجاري • واجهة محل في دور أرضي بمرور عالي'}, bestMatch:'Shops', reason:{en:'Ground floor shop with high street visibility',eg:'محل أرضي مرئية عالية ومرور ناس كتير'}, options:['Shops','Admin','Apartment','Stand Alone'] },
  { id:8, name:{en:'Newlyweds',eg:'العرسان الجدد'}, emoji:'💑', profile:{en:'Budget: 1.5M EGP • Couple, first home, small & cozy',eg:'ميزانية: ١.٥م • عرسان جدد، أول بيت صغير ومريح'}, bestMatch:'Apartment', reason:{en:'Standard apartment, right size for two, affordable entry',eg:'شقة عادية، مناسبة لاثنين، مدخل معقول في السعر'}, options:['Apartment','Stand Alone','Twin House','Penthouse'] },
  { id:9, name:{en:'Mr. Hassan',eg:'أ. حسن'}, emoji:'🤵', profile:{en:'Budget: 8M EGP+ • Wealthy • Max privacy, large plot, no shared walls',eg:'ميزانية: +٨م • عايز خصوصية قصوى وأرض كبيرة'}, bestMatch:'Stand Alone', reason:{en:'Standalone villa on own plot, no neighbors on any side',eg:'فيلا مستقلة على قطعة أرض خاصة كاملة'}, options:['Stand Alone','Twin House','Town House','Penthouse'] },
  { id:10, name:{en:'Medical Center',eg:'مركز طبي'}, emoji:'🏥', profile:{en:'Commercial • Clinic space, regulated, accessible location',eg:'تجاري • عيادة أو مركز طبي، موقع سهل الوصول'}, bestMatch:'Medical', reason:{en:'Medical unit designed for clinics and health centers',eg:'وحدة طبية مصممة للعيادات والمراكز الصحية'}, options:['Medical','Admin','Studio','Shops'] }
];

const UNIT_ICONS = { 'Twin House':'🏘️','Penthouse':'🌆','Studio':'🏠','Admin':'🏢','Apartment':'🏬','Stand Alone':'🏡','Town House':'🏠','Duplex':'🏗️','Shops':'🛍️','Medical':'🏥','Pharmacy':'💊','Show Room':'🚗' };

const ClientMatch = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const [round, setRound] = useState(0);
  const [pts, setPts] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [opts, setOpts] = useState([]);
  const [correct, setCorrect] = useState(0);

  const cur = CLIENT_MATCH_DATA[round];

  useEffect(() => {
    if (!cur) return;
    setOpts(shuffleArray([...cur.options]));
    setTimeLeft(20);
    setSelected(null);
    setFeedback(null);
  }, [round]);

  useEffect(() => {
    if (feedback || gameOver) return;
    if (timeLeft <= 0) { handlePick(null, true); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, feedback, gameOver]);

  const handlePick = (opt, timeout = false) => {
    if (feedback) return;
    setSelected(opt);
    const isCorrect = !timeout && opt === cur.bestMatch;
    const award = isCorrect ? Math.max(5, timeLeft) + 5 : -5;
    setFeedback({ correct: isCorrect, award, timeout });
    updateScore(award, isCorrect);
    setPts(p => p + award);
    if (isCorrect) setCorrect(p => p + 1);
  };

  const next = () => {
    if (round + 1 >= CLIENT_MATCH_DATA.length) setGameOver(true);
    else setRound(p => p + 1);
  };

  const reset = () => { setRound(0); setPts(0); setSelected(null); setFeedback(null); setGameOver(false); setTimeLeft(20); setCorrect(0); };

  if (gameOver) {
    const pct = Math.round((correct / CLIENT_MATCH_DATA.length) * 100);
    return (
      <div className="animate-fadeIn" style={{ maxWidth:520, margin:'0 auto', padding:'40px 20px', textAlign:'center' }}>
        <div style={{ fontSize:70, marginBottom:16 }}>{pct>=80?'🏆':pct>=60?'⭐':'💪'}</div>
        <h2 style={{ fontSize:28, marginBottom:10 }}>{lang==='eg'?'خلصت اللعبة!':'Game Complete!'}</h2>
        <div style={{ fontSize:48, fontWeight:900, color:RM_THEME.amber, marginBottom:8 }}>{correct}/{CLIENT_MATCH_DATA.length}</div>
        <p style={{ color:RM_THEME.muted, marginBottom:24, fontSize:15 }}>{lang==='eg'?`مجموع النقط: ${pts}`:`Total Score: ${pts}`}</p>
        <p style={{ color:RM_THEME.muted, fontSize:14, marginBottom:28, lineHeight:1.6 }}>
          {pct>=80?(lang==='eg'?'ممتاز! فاهم احتياجات العميل كويس.':'Excellent! You nail client-to-unit matching.'):pct>=60?(lang==='eg'?'كويس، بس راجع أنواع الوحدات التجارية.':'Good — review commercial unit types.'):(lang==='eg'?'راجع أنواع الوحدات وتعريفاتها.':'Review unit types and their definitions.')}
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={reset} style={styles.primaryBtn}>{lang==='eg'?'العب تاني':'Play Again'}</button>
          <button onClick={onBack} style={styles.secondaryBtn}>{lang==='eg'?'رجوع':'Back'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth:560, margin:'0 auto', padding:'0 16px 60px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, gap:12, flexWrap:'wrap' }}>
        <button onClick={onBack} style={{ ...styles.secondaryBtn, padding:'8px 14px', fontSize:13 }}>← {lang==='eg'?'رجوع':'Back'}</button>
        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
          <span style={{ color:RM_THEME.amber, fontWeight:800, fontSize:14 }}>{lang==='eg'?`جولة ${round+1}/${CLIENT_MATCH_DATA.length}`:`Round ${round+1}/${CLIENT_MATCH_DATA.length}`}</span>
          <span style={{ fontWeight:800, fontSize:14 }}>{pts} pts</span>
        </div>
      </div>
      <div style={{ height:6, borderRadius:6, background:'rgba(255,255,255,0.08)', marginBottom:20, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:6, transition:'width 1s linear, background 0.3s', width:`${(timeLeft/20)*100}%`, background:timeLeft>10?RM_THEME.green:timeLeft>5?RM_THEME.amber:'#f56565' }} />
      </div>
      <div style={{ padding:'24px 22px', borderRadius:24, marginBottom:22, border:`1px solid ${RM_THEME.border}`, background:'linear-gradient(135deg, rgba(102,126,234,0.14), rgba(102,126,234,0.04))', textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:10 }}>{cur.emoji}</div>
        <h2 style={{ fontSize:20, marginBottom:8 }}>{lang==='eg'?cur.name.eg:cur.name.en}</h2>
        <p style={{ color:RM_THEME.muted, fontSize:14, lineHeight:1.6 }}>{lang==='eg'?cur.profile.eg:cur.profile.en}</p>
        <div style={{ marginTop:14, padding:'6px 14px', borderRadius:12, background:'rgba(255,176,32,0.1)', display:'inline-block' }}>
          <span style={{ color:RM_THEME.amber, fontWeight:800, fontSize:13 }}>⏱ {timeLeft}s</span>
        </div>
      </div>
      <p style={{ textAlign:'center', color:RM_THEME.muted, marginBottom:16, fontSize:14, fontWeight:700 }}>
        {lang==='eg'?'👇 اختار أنسب نوع وحدة لهذا العميل':'👇 Pick the best unit type for this client'}
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        {opts.map(opt => {
          const isCor = opt===cur.bestMatch, isSel = opt===selected;
          let bg='rgba(255,255,255,0.05)', border=RM_THEME.border;
          if (feedback) { if (isCor){bg='rgba(80,250,123,0.12)';border=RM_THEME.green;} else if (isSel&&!isCor){bg='rgba(245,101,101,0.12)';border='#f56565';} }
          else if (isSel) { bg='rgba(102,126,234,0.15)'; border=RM_THEME.red; }
          return (
            <button key={opt} onClick={()=>handlePick(opt)} disabled={!!feedback}
              style={{ padding:'18px 12px', borderRadius:18, border:`2px solid ${border}`, background:bg, cursor:feedback?'default':'pointer', transition:'all 0.2s ease', display:'flex', flexDirection:'column', alignItems:'center', gap:8, fontFamily:'inherit', color:RM_THEME.text }}>
              <span style={{ fontSize:30 }}>{UNIT_ICONS[opt]||'🏠'}</span>
              <span style={{ fontWeight:800, fontSize:15 }}>{opt}</span>
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className="animate-fadeIn" style={{ padding:'18px 20px', borderRadius:18, marginBottom:16, background:feedback.correct?'rgba(80,250,123,0.1)':'rgba(245,101,101,0.1)', border:`1px solid ${feedback.correct?RM_THEME.green:'#f56565'}` }}>
          <div style={{ fontWeight:800, fontSize:16, marginBottom:6 }}>
            {feedback.timeout?(lang==='eg'?'⏰ الوقت خلص!':'⏰ Time\'s up!'):feedback.correct?(lang==='eg'?`✅ صح! +${feedback.award}`:`✅ Correct! +${feedback.award} pts`):(lang==='eg'?'❌ غلط!':'❌ Wrong!')}
          </div>
          <p style={{ color:RM_THEME.muted, fontSize:13, lineHeight:1.5 }}>
            <strong>{lang==='eg'?'الأنسب: ':'Best match: '}</strong>{cur.bestMatch} — {lang==='eg'?cur.reason.eg:cur.reason.en}
          </p>
          <button onClick={next} style={{ ...styles.primaryBtn, marginTop:12, padding:'10px 18px', fontSize:14 }}>
            {round+1>=CLIENT_MATCH_DATA.length?(lang==='eg'?'شوف النتيجة':'Results'):(lang==='eg'?'التالي ←':'Next →')}
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// GAME 2 — OBJECTION BLITZ
// Rapid-fire objection handling — use A.B.C. to respond (12 rounds)
// ═══════════════════════════════════════════════════════════════
const OBJECTION_BLITZ_DATA = [
  { obj:{en:"The price is too expensive!",eg:"غالي جداً!"}, opts:{en:[{t:"I understand. Let me show you the payment plan — 10% down over 7 years. Could that work?",c:true},{t:"It's not that expensive for this area.",c:false},{t:"Maybe look at smaller units if budget is tight.",c:false}],eg:[{t:"أنا فاهم. خليني أوريلك خطة التقسيط — ١٠٪ مقدم على ٧ سنين. يناسبك؟",c:true},{t:"مش غالي على المنطقة دي.",c:false},{t:"ممكن تبص على وحدات أصغر لو الميزانية ضيقة.",c:false}]} },
  { obj:{en:"I need to think about it.",eg:"محتاج أفكر."}, opts:{en:[{t:"Absolutely. FYI there are 2 other buyers interested. Want to reserve it and decide in 48h?",c:true},{t:"Take your time, call me whenever.",c:false},{t:"What exactly do you need to think about?",c:false}],eg:[{t:"طبعاً. على علمك فيه مشترين تانيين. تحجزها وتفكر ٤٨ ساعة؟",c:true},{t:"تمام، خد وقتك وكلمني.",c:false},{t:"في إيه بالذات هتفكر فيه؟",c:false}]} },
  { obj:{en:"The location isn't convenient.",eg:"الموقع مش مناسب."}, opts:{en:[{t:"I hear you. Which area works best for you? I may have options there, or we can review the commute.",c:true},{t:"The location is actually great, all amenities are close.",c:false},{t:"Many clients felt that at first but ended up loving it.",c:false}],eg:[{t:"فاهم. أنهي منطقة أنسب؟ ممكن يكون عندي بديل أو نشوف خط السير مع بعض.",c:true},{t:"الموقع في الحقيقة ممتاز، كل حاجة قريبة.",c:false},{t:"كتير عملاء أحسوا كده في الأول وبعدين حبّوه.",c:false}]} },
  { obj:{en:"I want to see it finished before buying.",eg:"عايز أشوفه خلص أول."}, opts:{en:[{t:"Valid concern. Buying now locks in today's price — by delivery it'll be 30-40% higher. Want to see the model unit?",c:true},{t:"We can't guarantee what it'll look like finished.",c:false},{t:"Most investors buy off-plan, it's normal.",c:false}],eg:[{t:"قلقك منطقي. الشراء دلوقتي يقفل سعر اليوم — لما يخلص السعر هيعلى ٣٠-٤٠٪. تيجي تشوف وحدة نموذج؟",c:true},{t:"ما نقدرش نضمن هيبقى إزاي لما يخلص.",c:false},{t:"معظم المستثمرين بيشتروا أوف-بلان، ده طبيعي.",c:false}]} },
  { obj:{en:"Your competitor has a lower price.",eg:"المنافس عنده سعر أرخص."}, opts:{en:[{t:"Good point. Let's compare finishing spec, developer track record, and facilities — price alone doesn't tell the full story.",c:true},{t:"Their quality honestly isn't as good as ours.",c:false},{t:"If it's cheaper maybe it's better for you.",c:false}],eg:[{t:"نقطة كويسة. بس خليني أريلك الفرق في التشطيب وسمعة المطوّر والمرافق. السعر وحده مش بيقول الحكاية كلها.",c:true},{t:"جودتهم مش بالمستوى ده بصراحة.",c:false},{t:"لو أرخص يمكن يكون الأنسب ليك.",c:false}]} },
  { obj:{en:"I don't have cash right now.",eg:"مش عندي كاش دلوقتي."}, opts:{en:[{t:"No problem at all — most clients use installment plans. With just 10% down you secure the unit. Want me to walk you through it?",c:true},{t:"You'll need at least some cash to proceed.",c:false},{t:"We have mortgage options but they're complicated.",c:false}],eg:[{t:"مفيش مشكلة، معظم عملائنا بيشتروا بالتقسيط. بـ١٠٪ بس تضمن الوحدة. أشرحلك الخطة؟",c:true},{t:"هتحتاج شوية كاش على الأقل.",c:false},{t:"عندنا تمويل بنكي بس معقد شوية.",c:false}]} },
  { obj:{en:"Is the developer trustworthy?",eg:"المطوّر موثوق؟"}, opts:{en:[{t:"Great question. They've delivered 12 projects on time in 20 years. Want to visit a completed project nearby?",c:true},{t:"Yes, they're one of the best, everyone knows them.",c:false},{t:"I personally vouch for them, don't worry.",c:false}],eg:[{t:"سؤال ممتاز. سلّموا ١٢ مشروع في مواعيدهم على ٢٠ سنة. تيجي تزور مشروع جاهز قريب؟",c:true},{t:"آه من أحسن الناس، كلهم يعرفوهم.",c:false},{t:"أنا شخصيًا بضمنهم، متقلقش.",c:false}]} },
  { obj:{en:"I want my family involved before deciding.",eg:"عايز أشرك عيلتي الأول."}, opts:{en:[{t:"Absolutely — family decisions are the most important. Can we schedule a meeting with them this week?",c:true},{t:"It's a great deal, your family will love it.",c:false},{t:"Most investment decisions are individual, you can tell them later.",c:false}],eg:[{t:"طبعاً قرارات العيلة هي الأهم. نعمل موعد معاهم الأسبوع ده؟",c:true},{t:"فرصة رائعة عيلتك هتحبها.",c:false},{t:"القرارات دي عادةً فردية، تقدر تقولهم بعدين.",c:false}]} },
  { obj:{en:"The finishing quality looks weak.",eg:"التشطيب يبان ضعيف."}, opts:{en:[{t:"Your observation matters. Let me show you the exact specs — brands used, material grade, and warranty. Want to visit a delivered unit?",c:true},{t:"It's standard for this price range.",c:false},{t:"The price reflects the finishing quality.",c:false}],eg:[{t:"ملاحظتك مهمة. خليني أوريلك المواصفات الدقيقة — الماركات والخامات والضمان. تيجي تزور وحدة مسلمة؟",c:true},{t:"ده طبيعي للسعر ده.",c:false},{t:"السعر بيعكس مستوى التشطيب.",c:false}]} },
  { obj:{en:"I'll wait for prices to drop.",eg:"هستنى الأسعار ترخص."}, opts:{en:[{t:"I understand. But in Egypt's market prices have risen 25-35% annually for years. Waiting typically costs more — want to see the price history?",c:true},{t:"Prices might drop, it's possible.",c:false},{t:"That's your choice, let me know if you change your mind.",c:false}],eg:[{t:"فاهم المنطق. بس في سوق مصر أسعار ترتفع ٢٥-٣٥٪ سنويًا. الانتظار عادةً بيكلف أكتر — تشوف تاريخ الأسعار؟",c:true},{t:"ممكن ترخص، محتمل.",c:false},{t:"ده قرارك، كلمني لو غيّرت رأيك.",c:false}]} },
  { obj:{en:"The unit is too small.",eg:"الوحدة صغيرة."}, opts:{en:[{t:"Tell me more — what size do you actually need and how many rooms? I want to show you the right options.",c:true},{t:"It's the standard size for this tower.",c:false},{t:"Small spaces can feel bigger with good design.",c:false}],eg:[{t:"قولي أكتر — إيه المساحة اللي محتاجها وكام أوضة؟ عايز أوريلك الأنسب.",c:true},{t:"دي المساحة المعيارية للبرج ده.",c:false},{t:"المساحات الصغيرة ممكن تتصمم تحس فيها بالاتساع.",c:false}]} },
  { obj:{en:"I'm not ready to decide today.",eg:"مش جاهز أقرر النهارده."}, opts:{en:[{t:"That's completely fine. What would help you feel ready — is there missing info, or shall I follow up when you've had time?",c:true},{t:"We have a limited offer today only.",c:false},{t:"What's stopping you from deciding now?",c:false}],eg:[{t:"ده تمام. إيه اللي هيخليك جاهز — في معلومة ناقصة ولا نتابع بعد ما تفكر؟",c:true},{t:"عندنا عرض محدود النهارده بس.",c:false},{t:"إيه اللي بيمنعك تقرر دلوقتي؟",c:false}]} }
];

const ObjectionBlitz = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(18);
  const [shuffledOpts, setShuffledOpts] = useState([]);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);

  const cur = OBJECTION_BLITZ_DATA[round];
  const roundTime = Math.max(10, 18 - Math.floor(round / 3));

  useEffect(() => {
    if (!cur) return;
    setShuffledOpts(shuffleArray([...cur.opts[lang]]));
    setTimeLeft(roundTime);
    setSelected(null);
    setFeedback(null);
  }, [round, lang]);

  useEffect(() => {
    if (feedback || gameOver) return;
    if (timeLeft <= 0) { handlePick(null, true); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, feedback, gameOver]);

  const handlePick = (opt, timeout = false) => {
    if (feedback) return;
    setSelected(opt);
    const isCorrect = !timeout && !!opt?.c;
    const newStreak = isCorrect ? streak + 1 : 0;
    const bonus = newStreak >= 3 ? 10 : newStreak >= 2 ? 5 : 0;
    const award = isCorrect ? Math.max(8, timeLeft) + bonus : -5;
    setFeedback({ correct: isCorrect, award, timeout, newStreak });
    setStreak(newStreak);
    updateScore(award, isCorrect);
    setScore(p => p + award);
    if (isCorrect) setCorrect(p => p + 1);
  };

  const next = () => {
    if (round + 1 >= OBJECTION_BLITZ_DATA.length) setGameOver(true);
    else setRound(p => p + 1);
  };

  const reset = () => { setRound(0); setScore(0); setSelected(null); setFeedback(null); setGameOver(false); setTimeLeft(18); setStreak(0); setCorrect(0); };

  if (gameOver) {
    const pct = Math.round((correct / OBJECTION_BLITZ_DATA.length) * 100);
    return (
      <div className="animate-fadeIn" style={{ maxWidth:520, margin:'0 auto', padding:'40px 20px', textAlign:'center' }}>
        <div style={{ fontSize:70, marginBottom:16 }}>{pct>=80?'🎯':pct>=60?'⭐':'📚'}</div>
        <h2 style={{ fontSize:28, marginBottom:10 }}>{lang==='eg'?'انتهت الجولات!':'All Rounds Done!'}</h2>
        <div style={{ fontSize:48, fontWeight:900, color:RM_THEME.amber, marginBottom:8 }}>{correct}/{OBJECTION_BLITZ_DATA.length}</div>
        <p style={{ color:RM_THEME.muted, marginBottom:28, fontSize:15 }}>{lang==='eg'?`نقط: ${score}`:`Score: ${score}`} • {pct}%</p>
        <p style={{ color:RM_THEME.muted, fontSize:14, marginBottom:28, lineHeight:1.6 }}>
          {pct>=80?(lang==='eg'?'محترف في رد الاعتراضات! أ.ب.ج في دمك.':'Objection pro! A.B.C. is in your blood.'):(lang==='eg'?'راجع تقنية أ.ب.ج وردود الاعتراضات.':'Review A.B.C. objection handling technique.')}
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={reset} style={styles.primaryBtn}>{lang==='eg'?'العب تاني':'Play Again'}</button>
          <button onClick={onBack} style={styles.secondaryBtn}>{lang==='eg'?'رجوع':'Back'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth:600, margin:'0 auto', padding:'0 16px 60px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, gap:12, flexWrap:'wrap' }}>
        <button onClick={onBack} style={{ ...styles.secondaryBtn, padding:'8px 14px', fontSize:13 }}>← {lang==='eg'?'رجوع':'Back'}</button>
        <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
          {streak>=2&&<span style={{ color:RM_THEME.amber, fontWeight:800 }}>🔥 ×{streak}</span>}
          <span style={{ fontWeight:800, fontSize:14 }}>{lang==='eg'?`${round+1}/${OBJECTION_BLITZ_DATA.length} جولة`:`${round+1}/${OBJECTION_BLITZ_DATA.length}`}</span>
          <span style={{ fontWeight:800 }}>{score} pts</span>
        </div>
      </div>
      <div style={{ height:6, borderRadius:6, background:'rgba(255,255,255,0.08)', marginBottom:20, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:6, transition:'width 1s linear, background 0.3s', width:`${(timeLeft/roundTime)*100}%`, background:timeLeft>8?RM_THEME.green:timeLeft>4?RM_THEME.amber:'#f56565' }} />
      </div>
      <div style={{ padding:'28px 24px', borderRadius:24, marginBottom:24, textAlign:'center', border:`2px solid rgba(245,101,101,0.3)`, background:'linear-gradient(135deg, rgba(245,101,101,0.1), rgba(245,101,101,0.04))' }}>
        <div style={{ fontSize:36, marginBottom:10 }}>🚨</div>
        <p style={{ fontSize:12, color:RM_THEME.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:1, fontWeight:700 }}>
          {lang==='eg'?'اعتراض العميل':'Client Objection'}
        </p>
        <h2 style={{ fontSize:22, lineHeight:1.4, fontWeight:900 }}>"{lang==='eg'?cur.obj.eg:cur.obj.en}"</h2>
        <div style={{ marginTop:12, color:RM_THEME.amber, fontWeight:800 }}>⏱ {timeLeft}s</div>
      </div>
      <p style={{ color:RM_THEME.muted, fontSize:13, textAlign:'center', marginBottom:14, fontWeight:700 }}>
        {lang==='eg'?'👇 اختار أفضل رد باستخدام أ.ب.ج':'👇 Pick the best A.B.C. response'}
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
        {shuffledOpts.map((opt, idx) => {
          const isSel = opt===selected;
          let bg='rgba(255,255,255,0.04)', border=RM_THEME.border;
          if (feedback) { if (opt.c){bg='rgba(80,250,123,0.12)';border=RM_THEME.green;} else if (isSel&&!opt.c){bg='rgba(245,101,101,0.12)';border='#f56565';} }
          else if (isSel) { bg='rgba(102,126,234,0.15)'; border=RM_THEME.red; }
          return (
            <button key={idx} onClick={()=>handlePick(opt)} disabled={!!feedback}
              style={{ padding:'16px 18px', borderRadius:18, border:`2px solid ${border}`, background:bg, cursor:feedback?'default':'pointer', transition:'all 0.2s ease', textAlign:'left', fontFamily:'inherit', color:RM_THEME.text, fontSize:14, lineHeight:1.55, display:'flex', alignItems:'flex-start', gap:10 }}>
              <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{feedback?(opt.c?'✅':'❌'):['A','B','C'][idx]}</span>
              {opt.t}
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className="animate-fadeIn" style={{ padding:'16px 20px', borderRadius:16, marginBottom:12, background:feedback.correct?'rgba(80,250,123,0.1)':'rgba(245,101,101,0.1)', border:`1px solid ${feedback.correct?RM_THEME.green:'#f56565'}` }}>
          <div style={{ fontWeight:800, marginBottom:8 }}>
            {feedback.timeout?(lang==='eg'?'⏰ الوقت راح!':'⏰ Time up!'):feedback.correct?(lang==='eg'?`✅ صح! +${feedback.award}`:`✅ Great! +${feedback.award} pts`):(lang==='eg'?'❌ مش الأفضل.':'❌ Not the best approach.')}
            {feedback.correct&&feedback.newStreak>=2&&<span style={{ color:RM_THEME.amber, marginLeft:10 }}>🔥×{feedback.newStreak}</span>}
          </div>
          <button onClick={next} style={{ ...styles.primaryBtn, padding:'10px 18px', fontSize:14 }}>
            {round+1>=OBJECTION_BLITZ_DATA.length?(lang==='eg'?'النتائج':'Results'):(lang==='eg'?'التالي ←':'Next →')}
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// GAME 3 — PROPERTY QUEST
// Text-adventure RPG: run a full sales call from cold to close
// ═══════════════════════════════════════════════════════════════
const PQ_NODES = {
  start: {
    scene:{en:"📞 Your phone rings. Hot lead — Mr. Naser, referred by a colleague. He's looking for a unit in the New Capital. This is your shot.",eg:"📞 موبايلك يرن. ليد حلو — أ. ناصر، جاي بتوصية. بيدور على وحدة في العاصمة الإدارية. دي فرصتك."},
    choices:[
      {en:"Start with small talk to build rapport first",eg:"ابدأ بكلام خفيف لتبني ألفة أول",next:'qualify_warm',interest:+10,pts:15,c:true},
      {en:"Jump straight into pitching your best project",eg:"اتكلم مباشرة عن أحسن مشروع عندك",next:'qualify_cold',interest:-10,pts:0,c:false},
      {en:"Ask immediately for a budget figure",eg:"اسأل على الميزانية على طول",next:'qualify_budget_early',interest:-5,pts:5,c:false}
    ]
  },
  qualify_warm: {
    scene:{en:"Mr. Naser relaxes. He's been looking 6 months and is frustrated. You have his attention. Qualify him now.",eg:"أ. ناصر استرخى. بيدور من ٦ شهور وزهق. عنده انتباهك. كوّالفيه دلوقتي."},
    choices:[
      {en:"\"What's driving your search — investment or to live in it?\"",eg:"\"إيه اللي بيقودك — استثمار ولا سكن مع عيلتك؟\"",next:'present',interest:+15,pts:20,c:true},
      {en:"\"How much exactly is your budget?\"",eg:"\"كام بالظبط ميزانيتك؟\"",next:'present_budget',interest:+0,pts:8,c:false},
      {en:"\"Have you seen other projects before?\"",eg:"\"اتفرجت على مشاريع تانية قبل كده؟\"",next:'present',interest:+5,pts:10,c:false}
    ]
  },
  qualify_cold: {
    scene:{en:"Mr. Naser sounds put off. \"Wait — what exactly are you offering?\" You've lost ground. Recover fast.",eg:"أ. ناصر مش مبسوط. \"استنى — إيه بالظبط اللي بتعرضه؟\" خسرت شوية. تعافى."},
    choices:[
      {en:"Apologize and ask about his needs first",eg:"اعتذر واسأل عن احتياجاته قبل أي حاجة",next:'present',interest:+5,pts:10,c:true},
      {en:"Continue pitching — \"It's the best in the capital!\"",eg:"كمّل البيتش — \"ده الأحسن في العاصمة!\"",next:'objection',interest:-15,pts:0,c:false}
    ]
  },
  qualify_budget_early: {
    scene:{en:"He pauses. \"Why do you need that first? Can't you show me options without a number?\" He's defensive.",eg:"وقف. \"ليه محتاجها الأول؟ مش تقدر توريني خيارات بدون رقم؟\" عنده دفاعية."},
    choices:[
      {en:"\"Of course! Tell me — investment or own use?\"",eg:"\"طبعاً! قولي — استثمار ولا استخدام شخصي؟\"",next:'present',interest:+5,pts:12,c:true},
      {en:"Press again: \"I just need a rough budget range\"",eg:"اضغط تاني: \"محتاج بس رنج تقريبي\"",next:'objection',interest:-20,pts:0,c:false}
    ]
  },
  present_budget: {
    scene:{en:"He gives a range. You present 3 units by budget only. He listens politely but seems unmoved. You missed his real motivation.",eg:"أعطالك رنج. عرضت ٣ وحدات بناءً على الميزانية بس. بيسمعك بأدب بس مش مندفع. تجاهلت دوافعه الحقيقية."},
    choices:[
      {en:"\"Before we continue — investment or for you to live in?\"",eg:"\"قبل ما نكمل — استثمار ولا سكن شخصي؟\"",next:'objection',interest:+10,pts:15,c:true},
      {en:"Continue detailing all the units anyway",eg:"كمّل تفاصيل الوحدات على أي حال",next:'objection',interest:-5,pts:0,c:false}
    ]
  },
  present: {
    scene:{en:"He's investment-focused, budget 3-5M EGP. You have: Studio (high ROI, low entry) vs Twin House (lifestyle, medium ROI). Which do you lead with?",eg:"هدفه استثمار، ميزانية ٣-٥م. عندك: استوديو (عائد عالي، سعر أقل) أو توين هاوس (لايف ستايل، عائد معتدل). بتبدأ بإيه؟"},
    choices:[
      {en:"Present the Studio — \"High rental yield, your money works from day one\"",eg:"اعرض الاستوديو — \"عائد إيجاري عالي، فلوسك تشتغل من اليوم الأول\"",next:'objection',interest:+20,pts:25,c:true},
      {en:"Present the Twin House — \"Great family lifestyle with private garden\"",eg:"اعرض التوين هاوس — \"لايف ستايل عيلي رائع بجنينة خاصة\"",next:'objection',interest:-5,pts:5,c:false},
      {en:"Present both equally without a clear recommendation",eg:"اعرض الاتنين بدون توصية واضحة",next:'objection',interest:+5,pts:10,c:false}
    ]
  },
  objection: {
    scene:{en:"\"The Studio is interesting but the price per sqm seems high vs other compounds I've seen.\"",eg:"\"الاستوديو مثير للاهتمام بس سعر المتر عالي مقارنة بكمباوندات تانية شوفتها.\""},
    choices:[
      {en:"\"Great point. Let me show you the 5-year ROI — this compound delivers 18% annually. The price is the entry, the return is the game.\"",eg:"\"نقطة ممتازة. خليني أوريلك العائد على ٥ سنين — الكمباوند ده بيوصل ١٨٪ سنويًا. السعر هو المدخل، العائد هو اللعبة.\"",next:'close',interest:+20,pts:30,c:true},
      {en:"\"The other compounds don't have our facilities or track record.\"",eg:"\"الكمباوندات التانية ملهاش مرافقنا ولا سمعتنا.\"",next:'close',interest:-5,pts:5,c:false},
      {en:"\"Let me try to get you a small discount.\"",eg:"\"هحاول أجبلك خصم صغير.\"",next:'close',interest:+5,pts:8,c:false}
    ]
  },
  close: {
    scene:{en:"Mr. Naser is intrigued. \"Okay, I like the numbers. What do I need to do to reserve it?\" This is THE moment.",eg:"أ. ناصر مهتم. \"تمام، يعجبني الأرقام. إيه اللي محتاج أعمله عشان أحجز؟\" دي اللحظة."},
    choices:[
      {en:"\"Just 1% token — 50K EGP — to lock this price today. I'll send the contract now. Shall I?\"",eg:"\"بس ١٪ حجز — ٥٠ ألف — تقفل السعر النهارده. هبعتلك العقد دلوقتي. تمام؟\"",next:'win',interest:+25,pts:40,c:true},
      {en:"Explain all the paperwork in detail before asking for a decision",eg:"اشرح كل الأوراق بالتفصيل قبل ما تطلب قرار",next:'partial',interest:-10,pts:10,c:false},
      {en:"\"Take your time, call me when you're ready.\"",eg:"\"خد وقتك، كلمني لما تبقى جاهز.\"",next:'lose',interest:-30,pts:0,c:false}
    ]
  },
  win: { scene:{en:"🏆 Mr. Naser says YES. Deal closed! He transfers the token that evening. Your manager congratulates you. Perfect sales call.",eg:"🏆 أ. ناصر قال آه! صفقة مقفولة! حوّل المقدم المساء. مديرك بيبارك عليك. كول مثالي!"}, choices:[], ending:'win' },
  partial: { scene:{en:"⭐ Mr. Naser says he'll 'think about it.' He never calls back. You got close but didn't close with confidence.",eg:"⭐ أ. ناصر قال هيفكر. وما رجعش يكلمك. اقتربت بس ما أغلقتش بثقة."}, choices:[], ending:'partial' },
  lose: { scene:{en:"📉 Mr. Naser went with another broker who called him the next day and closed confidently. You missed it.",eg:"📉 أ. ناصر راح مع بروكر تاني اتصل بيه النهارده التالي وأغلق بثقة. فاتتك الصفقة."}, choices:[], ending:'lose' }
};

const PropertyQuest = ({ onBack, updateScore }) => {
  const { tone } = useUI();
  const lang = tone === 'eg' ? 'eg' : 'en';
  const [nodeId, setNodeId] = useState('start');
  const [interest, setInterest] = useState(50);
  const [totalPts, setTotalPts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [ending, setEnding] = useState(null);

  const node = PQ_NODES[nodeId];

  const handleChoice = (choice) => {
    const newInterest = Math.min(100, Math.max(0, interest + (choice.interest || 0)));
    setInterest(newInterest);
    setTotalPts(p => p + (choice.pts || 0));
    updateScore(choice.pts || 0, choice.c);

    if (newInterest <= 0) { setEnding('lost'); setGameOver(true); return; }

    const next = PQ_NODES[choice.next];
    if (next?.ending) { setEnding(next.ending); setGameOver(true); }
    setNodeId(choice.next);
  };

  const reset = () => { setNodeId('start'); setInterest(50); setTotalPts(0); setGameOver(false); setEnding(null); };

  const endings = {
    win:    { emoji:'🏆', color:RM_THEME.green, title:{en:'Deal Closed!',eg:'صفقة مقفولة!'}, tip:{en:"You built rapport, qualified well, matched the right unit, and handled objections like a pro — that's how deals close!",eg:"بنيت ألفة، كوّالفيت صح، عارضت الأنسب، وردّيت على الاعتراض باحتراف — هكذا تتقفل الصفقات!"} },
    partial:{ emoji:'⭐', color:RM_THEME.amber, title:{en:'So Close...',eg:'اقتربت...'}, tip:{en:"Your approach was solid but you didn't close with confidence. Practice assertive closing and A.B.C.",eg:"خطواتك كانت كويسة بس ما أغلقتش بثقة. تمرّن على الإغلاق الحازم وأ.ب.ج."} },
    lose:   { emoji:'📉', color:'#f56565', title:{en:'Missed It',eg:'فاتت الصفقة'}, tip:{en:"Review rapport-building, client-need qualification, and closing technique.",eg:"راجع بناء الثقة، تحديد احتياج العميل، وأسلوب الإغلاق."} },
    lost:   { emoji:'📵', color:'#f56565', title:{en:'Client Hung Up!',eg:'العميل قطع!'}, tip:{en:"The client lost interest — work on rapport and pacing before pressing.",eg:"العميل فقد الاهتمام — اشتغل على الألفة والتدرّج قبل الضغط."} }
  };

  if (gameOver) {
    const ed = endings[ending] || endings.lose;
    const curNode = PQ_NODES[nodeId];
    return (
      <div className="animate-fadeIn" style={{ maxWidth:520, margin:'0 auto', padding:'40px 20px', textAlign:'center' }}>
        <div style={{ fontSize:72, marginBottom:16 }}>{ed.emoji}</div>
        <h2 style={{ fontSize:28, marginBottom:8, color:ed.color }}>{lang==='eg'?ed.title.eg:ed.title.en}</h2>
        {curNode&&<p style={{ color:RM_THEME.muted, fontSize:15, lineHeight:1.65, marginBottom:20, padding:'0 10px' }}>{lang==='eg'?curNode.scene.eg:curNode.scene.en}</p>}
        <div style={{ fontSize:42, fontWeight:900, color:RM_THEME.amber, marginBottom:8 }}>{totalPts} pts</div>
        <div style={{ padding:'14px 20px', borderRadius:16, marginBottom:24, background:'rgba(255,255,255,0.04)', border:`1px solid ${RM_THEME.border}` }}>
          <div style={{ color:RM_THEME.muted, fontSize:13 }}>{lang==='eg'?`اهتمام العميل: ${interest}%`:`Client Interest: ${interest}%`}</div>
          <div style={{ ...styles.progressBar, marginTop:8 }}><div style={{ ...styles.progressFill, width:`${interest}%`, background:ed.color }} /></div>
        </div>
        <p style={{ color:RM_THEME.muted, fontSize:14, marginBottom:28, lineHeight:1.6 }}>{lang==='eg'?ed.tip.eg:ed.tip.en}</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={reset} style={styles.primaryBtn}>{lang==='eg'?'العب تاني':'Play Again'}</button>
          <button onClick={onBack} style={styles.secondaryBtn}>{lang==='eg'?'رجوع':'Back'}</button>
        </div>
      </div>
    );
  }

  const interestColor = interest>=60?RM_THEME.green:interest>=35?RM_THEME.amber:'#f56565';
  return (
    <div className="animate-fadeIn" style={{ maxWidth:580, margin:'0 auto', padding:'0 16px 60px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, gap:12, flexWrap:'wrap' }}>
        <button onClick={onBack} style={{ ...styles.secondaryBtn, padding:'8px 14px', fontSize:13 }}>← {lang==='eg'?'رجوع':'Back'}</button>
        <span style={{ fontWeight:800, fontSize:13, color:RM_THEME.muted }}>{lang==='eg'?`+${totalPts} نقطة`:`+${totalPts} pts`}</span>
      </div>
      <div style={{ padding:'14px 18px', borderRadius:18, marginBottom:20, border:`1px solid ${RM_THEME.border}`, background:'rgba(255,255,255,0.03)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
          <span style={{ color:RM_THEME.muted, fontWeight:700 }}>{lang==='eg'?'📊 اهتمام العميل':'📊 Client Interest'}</span>
          <span style={{ fontWeight:900, color:interestColor }}>{interest}%</span>
        </div>
        <div style={{ ...styles.progressBar }}>
          <div style={{ ...styles.progressFill, width:`${interest}%`, background:`linear-gradient(90deg, ${interestColor}, ${interestColor}88)`, transition:'width 0.6s ease' }} />
        </div>
        {interest<30&&<p style={{ color:'#f56565', fontSize:12, marginTop:6, fontWeight:700 }}>⚠️ {lang==='eg'?'أوشكت على خسارة العميل!':'Losing the client — choose wisely!'}</p>}
      </div>
      <div style={{ padding:'24px 22px', borderRadius:24, marginBottom:24, border:`1px solid ${RM_THEME.border}`, background:'linear-gradient(135deg, rgba(102,126,234,0.10), rgba(255,255,255,0.03))' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontSize:24 }}>📞</span>
          <span style={{ fontSize:12, fontWeight:800, color:RM_THEME.muted, textTransform:'uppercase', letterSpacing:1 }}>{lang==='eg'?'المشهد':'Scene'}</span>
        </div>
        <p style={{ fontSize:16, lineHeight:1.7 }}>{lang==='eg'?node.scene.eg:node.scene.en}</p>
      </div>
      <p style={{ color:RM_THEME.muted, fontSize:13, fontWeight:700, marginBottom:14 }}>{lang==='eg'?'🤔 إيه اللي بتعمله؟':'🤔 What do you do?'}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {node.choices.map((choice, idx) => (
          <button key={idx} onClick={()=>handleChoice(choice)}
            style={{ padding:'18px 20px', borderRadius:18, border:`2px solid ${RM_THEME.border}`, background:'rgba(255,255,255,0.04)', cursor:'pointer', textAlign:'left', fontFamily:'inherit', color:RM_THEME.text, fontSize:14, lineHeight:1.55, transition:'all 0.2s ease', display:'flex', gap:12, alignItems:'flex-start' }}>
            <span style={{ flexShrink:0, width:28, height:28, borderRadius:8, background:'rgba(102,126,234,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:RM_THEME.red }}>{idx+1}</span>
            {lang==='eg'?choice.eg:choice.en}
          </button>
        ))}
      </div>
    </div>
  );
};

const CATEGORY_ACTIVITY_META = {
  knowledge: { mode: 'solo', difficulty: 1, duration: 4, tags: ['terminology', 'recall'] },
  visual: { mode: 'solo', difficulty: 2, duration: 5, tags: ['recognition', 'classification'] },
  broker: { mode: 'solo', difficulty: 2, duration: 4, tags: ['judgment', 'market logic'] },
  psychology: { mode: 'solo', difficulty: 3, duration: 5, tags: ['motives', 'judgment'] },
  calls: { mode: 'solo', difficulty: 3, duration: 5, tags: ['calls', 'communication'] },
  professional: { mode: 'solo', difficulty: 2, duration: 4, tags: ['professionalism', 'habits'] },
  advanced: { mode: 'coaching', difficulty: 4, duration: 6, tags: ['simulation', 'application'] },
  classroom: { mode: 'classroom', difficulty: 3, duration: 8, tags: ['teams', 'facilitation'] },
  fun: { mode: 'solo', difficulty: 2, duration: 5, tags: ['review', 'exam'] },
  gaming: { mode: 'solo', difficulty: 3, duration: 8, tags: ['game', 'simulation', 'fun'] }
};

const ACTIVITY_META = {
  rapidfire: { tags: ['retrieval', 'speed'] },
  truefalse: { tags: ['retrieval', 'accuracy'] },
  matching: { tags: ['definitions', 'mapping'] },
  oddone: { tags: ['classification', 'logic'] },
  blanks: { tags: ['recall', 'sentence completion'] },
  acronym: { tags: ['terms', 'decoding'] },
  hierarchy: { tags: ['sequencing', 'ordering'] },
  accessories: { tags: ['dress code', 'inspection'] },
  unittype: { tags: ['unit types', 'recognition'] },
  finishing: { tags: ['finishing', 'comparison'] },
  commercial: { tags: ['commercial', 'sorting'] },
  sortinghat: { tags: ['broker vs developer', 'classification'] },
  procon: { tags: ['comparison', 'decision'] },
  market: { tags: ['market awareness', 'recall'] },
  motive: { tags: ['motives', 'psychology'] },
  needswants: { tags: ['needs', 'wants'] },
  whychain: { tags: ['discovery', 'depth'], difficulty: 4 },
  brainheart: { tags: ['emotion', 'rational'] },
  decoder: { tags: ['communication', 'signals'] },
  robot: { mode: 'partner', tags: ['scripts', 'call quality'] },
  mirror: { mode: 'partner', tags: ['rapport', 'mirroring'] },
  abc: { mode: 'coaching', tags: ['abc', 'call flow'] },
  mistake: { tags: ['mistakes', 'call review'] },
  qualifying: { mode: 'coaching', tags: ['qualification', 'discovery'] },
  dresscode: { tags: ['image', 'presentation'] },
  skills: { mode: 'coaching', tags: ['skills', 'reflection'] },
  impression: { tags: ['first impression', 'speed'] },
  callflow: { mode: 'coaching', tags: ['call flow', 'sequencing'], difficulty: 4, duration: 6 },
  objection: { mode: 'partner', tags: ['objections', 'response'] },
  objectionduel: { mode: 'partner', tags: ['objections', 'duel'], difficulty: 4, duration: 6 },
  triage: { tags: ['lead triage', 'prioritization'] },
  form: { tags: ['request form', 'completeness'] },
  coldcall: { mode: 'coaching', tags: ['cold call', 'branching'], difficulty: 5, duration: 7 },
  '21exp': { tags: ['impression', 'recovery'] },
  teambattle: { mode: 'classroom', tags: ['teams', 'buzzer'], difficulty: 4, duration: 9 },
  facilitator: { mode: 'coaching', tags: ['facilitator', 'roleplay'], duration: 6 },
  debrief: { mode: 'coaching', tags: ['debrief', 'coaching'], difficulty: 3, duration: 5 },
  consensus: { mode: 'group', tags: ['consensus', 'debate'], duration: 7 },
  reviewrescue: { mode: 'solo', tags: ['review', 'adaptive'], difficulty: 3, duration: 6 },
  academysprint: { mode: 'solo', tags: ['mixed', 'speed'], difficulty: 3, duration: 5 },
  bingo: { mode: 'classroom', tags: ['review', 'teams'] },
  crossword: { tags: ['terminology', 'review'] },
  exam: { tags: ['assessment', 'mastery'], difficulty: 5, duration: 10 },
  clientmatch: { tags: ['qualification', 'matching', 'unit types'], difficulty: 2, duration: 7 },
  objblitz: { tags: ['objections', 'abc', 'arcade'], difficulty: 3, duration: 6 },
  propquest: { tags: ['sales process', 'call flow', 'story'], difficulty: 4, duration: 10 }
};

const getActivityMeta = (categoryId, activityId) => {
  const base = CATEGORY_ACTIVITY_META[categoryId] || { mode: 'solo', difficulty: 2, duration: 5, tags: [] };
  const override = ACTIVITY_META[activityId] || {};
  return {
    mode: override.mode || base.mode,
    difficulty: override.difficulty || base.difficulty,
    duration: override.duration || base.duration,
    tags: override.tags || base.tags || []
  };
};

// ════════════════════════════════════════════════════════════════
// ACTIVITY GAME SHELL — countdown + HUD + multiplier + lives
// Wraps every solo activity. Classroom activities bypass it.
// ════════════════════════════════════════════════════════════════
const CLASSROOM_IDS = new Set(['teambattle', 'facilitator', 'debrief', 'consensus']);

const ActivityGameShell = ({ children, updateScore }) => {
  const [phase, setPhase] = React.useState('countdown');
  const [countVal, setCountVal] = React.useState(3);
  const [lives, setLives] = React.useState(3);
  const [inStreak, setInStreak] = React.useState(0);
  const [multiplier, setMultiplier] = React.useState(1);
  const [multiLabel, setMultiLabel] = React.useState(null);
  const [sessionScore, setSessionScore] = React.useState(0);

  const streakRef = React.useRef(0);
  const multiRef = React.useRef(1);

  // Countdown: 3 → 2 → 1 → GO! → play
  React.useEffect(() => {
    let frame = 3;
    let timerId;
    const tick = () => {
      frame--;
      if (frame <= 0) {
        setCountVal('GO!');
        timerId = setTimeout(() => setPhase('playing'), 700);
      } else {
        setCountVal(frame);
        timerId = setTimeout(tick, 800);
      }
    };
    timerId = setTimeout(tick, 700);
    return () => clearTimeout(timerId);
  }, []);

  const wrappedUpdateScore = React.useCallback((points, isCorrect) => {
    const newStreak = isCorrect ? streakRef.current + 1 : 0;
    streakRef.current = newStreak;
    setInStreak(newStreak);

    const newMulti = newStreak >= 6 ? 3 : newStreak >= 3 ? 2 : 1;
    if (newMulti > multiRef.current) {
      setMultiLabel(`🔥 ${newMulti}x COMBO!`);
      setTimeout(() => setMultiLabel(null), 2200);
    }
    multiRef.current = newMulti;
    setMultiplier(newMulti);

    if (!isCorrect) setLives(prev => Math.max(0, prev - 1));

    const boosted = isCorrect && points > 0 ? Math.round(points * newMulti) : points;
    setSessionScore(prev => prev + Math.max(0, boosted));
    updateScore(boosted, isCorrect);
  }, [updateScore]);

  if (phase === 'countdown') {
    return (
      <div className="xc-game-countdown">
        <div className="xc-countdown-orb" key={countVal}>{countVal}</div>
        <div className="xc-countdown-hint">Get ready…</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* ── In-activity HUD ── */}
      <div className="xc-game-hud">
        <span className="xc-hud-lives">
          {'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}
        </span>
        <span className={`xc-hud-multi${multiplier > 1 ? ' xc-hud-multi--active' : ''}`}>
          ×{multiplier}
        </span>
        {inStreak > 1 && (
          <span className="xc-hud-streak">🔥×{inStreak}</span>
        )}
        <span className="xc-hud-score">+{sessionScore} pts</span>
      </div>

      {/* ── Combo banner ── */}
      {multiLabel && (
        <div className="xc-multi-banner">{multiLabel}</div>
      )}

      {children(wrappedUpdateScore)}
    </div>
  );
};

const App = () => {
  // Inject logo ring pulse animation
  React.useEffect(() => {
    if (!document.getElementById('xcelias-ring-css')) {
      const s = document.createElement('style');
      s.id = 'xcelias-ring-css';
      s.textContent = '@keyframes logoRingPulse{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:0.6;transform:scale(1.06)}}';
      document.head.appendChild(s);
    }
  }, []);

  // PERF: Global IntersectionObserver for scroll-reveal
  React.useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    // Observe all .reveal elements in the app
    const observe = () => {
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
    };
    observe();
    // Re-observe on navigation/state changes via MutationObserver
    const mo = new MutationObserver(() => observe());
    const root = document.getElementById('root');
    if (root) mo.observe(root, { childList: true, subtree: true });
    return () => { obs.disconnect(); mo.disconnect(); };
  }, []);

  // ─── MULTI-USER AUTH STATE ─────────────────────────
  const [currentUser, setCurrentUser] = useState(() => xcRead(XC_KEYS.currentUser, null));
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAdmin, setShowAdmin]             = useState(false);
  const [showRoom, setShowRoom]               = useState(false);
  const [mobileTab, setMobileTab]             = useState('home');

  const handleLogin  = (user) => { setCurrentUser(user); xcWrite(XC_KEYS.currentUser, user); };
  const handleLogout = async () => {
    if (!window.confirm('Sign out of Xcelias?')) return;
    await XC.signOut();
    setCurrentUser(null);
    setGlobalScore(0); setGlobalStreak(0); setCurrentActivity(null); setSelectedCategory(null);
    setAcademyProgress({ activityStats: {}, recentSessions: [], lastPlayedId: null, claimedMissionKeys: [], seenUnlockIds: [] });
    try { localStorage.removeItem(APP_STORAGE.academyProgress); localStorage.removeItem(APP_STORAGE.globalScore); localStorage.removeItem(APP_STORAGE.globalStreak); } catch {}
  };

  // ─── VERIFY LOCALSTORAGE AUTH AGAINST FIREBASE SESSION ─────
  useEffect(() => {
    if (!currentUser || !window.xcFirebaseReady || !window.xcAuth) return;
    const unsub = window.xcAuth.onAuthStateChanged((fbUser) => {
      unsub();
      if (fbUser) return; // Real Firebase session — all good
      // No Firebase session — check for legitimate offline accounts
      const adminSetup = xcRead(XC_KEYS.adminSetup, null);
      const accounts = xcRead(XC_KEYS.accounts, []);
      const isOfflineAdmin = currentUser.uid === 'admin_local' && adminSetup;
      const isOfflineAccount = accounts.some(a => a.uid === currentUser.uid);
      if (!isOfflineAdmin && !isOfflineAccount) {
        // Forged localStorage — force logout
        try { localStorage.removeItem(XC_KEYS.currentUser); } catch {}
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, [currentUser]); // re-run whenever currentUser changes (e.g. after login)

  const [currentActivity, setCurrentActivity] = useState(null);
  const [globalScore, setGlobalScore] = useState(() => {
    try {
      const raw = parseInt(localStorage.getItem(APP_STORAGE.globalScore) || '0', 10);
      return Number.isFinite(raw) ? Math.max(0, raw) : 0;
    } catch {
      return 0;
    }
  });
  const [globalStreak, setGlobalStreak] = useState(() => {
    try {
      const raw = parseInt(localStorage.getItem(APP_STORAGE.globalStreak) || '0', 10);
      return Number.isFinite(raw) ? raw : 0;
    } catch {
      return 0;
    }
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [academyProgress, setAcademyProgress] = useState(() => readJsonStorage(APP_STORAGE.academyProgress, {
    activityStats: {},
    recentSessions: [],
    lastPlayedId: null,
    claimedMissionKeys: [],
    seenUnlockIds: []
  }));

  const [tone, setTone] = useState(() => {
    try { return localStorage.getItem(APP_STORAGE.tone) || 'en'; } catch { return 'en'; }
  });
  const [fxIntensity, setFxIntensity] = useState(() => {
    try {
      const v = parseFloat(localStorage.getItem(APP_STORAGE.fxIntensity) || '0.95');
      return Number.isFinite(v) ? clamp(v, 0.6, 2.2) : 0.95;
    } catch {
      return 0.95;
    }
  });
  const [reduceMotion, setReduceMotion] = useState(() => {
    try { return localStorage.getItem(APP_STORAGE.reduceMotion) === '1'; } catch { return false; }
  });
  const [backgroundEnabled, setBackgroundEnabled] = useState(() => {
    try {
      const v = localStorage.getItem(APP_STORAGE.backgroundEnabled);
      if (v === null) return true;
      return v === '1';
    } catch {
      return true;
    }
  });
  const [projectorMode, setProjectorMode] = useState(() => {
    try { return localStorage.getItem(APP_STORAGE.projectorMode) === '1'; } catch { return false; }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(APP_STORAGE.tone, tone); } catch {}
  }, [tone]);
  useEffect(() => {
    try { localStorage.setItem(APP_STORAGE.fxIntensity, String(fxIntensity)); } catch {}
  }, [fxIntensity]);
  useEffect(() => {
    try { localStorage.setItem(APP_STORAGE.reduceMotion, reduceMotion ? '1' : '0'); } catch {}
  }, [reduceMotion]);
  useEffect(() => {
    try { localStorage.setItem(APP_STORAGE.backgroundEnabled, backgroundEnabled ? '1' : '0'); } catch {}
  }, [backgroundEnabled]);
  useEffect(() => {
    try { localStorage.setItem(APP_STORAGE.projectorMode, projectorMode ? '1' : '0'); } catch {}
  }, [projectorMode]);
  useEffect(() => {
    try { localStorage.setItem(APP_STORAGE.globalScore, String(globalScore)); } catch {}
  }, [globalScore]);
  useEffect(() => {
    try { localStorage.setItem(APP_STORAGE.globalStreak, String(globalStreak)); } catch {}
  }, [globalStreak]);
  useEffect(() => {
    writeJsonStorage(APP_STORAGE.academyProgress, academyProgress);
  }, [academyProgress]);

  // ─── SYNC SCORE TO FIREBASE / OFFLINE LEADERBOARD ──
  useEffect(() => {
    if (!currentUser?.uid || currentUser?.role === 'admin') return;
    const timer = setTimeout(() => {
      const rank = getRedRank(globalScore);
      const activitiesPlayed = Object.keys(academyProgress.activityStats || {}).length;
      XC.pushScore(currentUser.uid, currentUser.batchId, globalScore, globalStreak, rank.en, activitiesPlayed);
    }, 1500);
    return () => clearTimeout(timer);
  }, [globalScore, globalStreak, currentUser]);

  useEffect(() => {
    try {
      document.body.classList.toggle('rm-projector', !!projectorMode);
    } catch {}
  }, [projectorMode]);

  useEffect(() => {
    try {
      document.body.classList.toggle('rm-bg-off', !backgroundEnabled);
    } catch {}
  }, [backgroundEnabled]);

  const lang = tone === 'eg' ? 'eg' : 'en';
  const s = UI_STRINGS[lang];
  const modeLabels = MODE_LABELS[lang];

  const rawCategories = [
    {
      id: 'knowledge',
      title: s.categories.knowledge,
      icon: '📚',
      color: '#667eea',
      activities: [
        { id: 'rapidfire', name: s.activityNames.rapidfire, component: RapidFireMCQ },
        { id: 'truefalse', name: s.activityNames.truefalse, component: TrueFalseSpeedRun },
        { id: 'matching', name: s.activityNames.matching, component: DefinitionMatching },
        { id: 'oddone', name: s.activityNames.oddone, component: OddOneOut },
        { id: 'blanks', name: s.activityNames.blanks, component: FillInBlanks },
        { id: 'acronym', name: s.activityNames.acronym, component: AcronymDecoder },
        { id: 'hierarchy', name: s.activityNames.hierarchy, component: HierarchySorter }
      ]
    },
    {
      id: 'visual',
      title: s.categories.visual,
      icon: '🏠',
      color: '#4299e1',
      activities: [
        { id: 'accessories', name: s.activityNames.accessories, component: AccessoriesInspection },
        { id: 'unittype', name: s.activityNames.unittype, component: UnitTypeIdentifier },
        { id: 'finishing', name: s.activityNames.finishing, component: FinishingVisualizer },
        { id: 'commercial', name: s.activityNames.commercial, component: CommercialTycoon }
      ]
    },
    {
      id: 'broker',
      title: s.categories.broker,
      icon: '⚔️',
      color: '#ed8936',
      activities: [
        { id: 'sortinghat', name: s.activityNames.sortinghat, component: SortingHat },
        { id: 'procon', name: s.activityNames.procon, component: ProConMatrix },
        { id: 'market', name: s.activityNames.market, component: MarketAwarenessCheck }
      ]
    },
    {
      id: 'psychology',
      title: s.categories.psychology,
      icon: '🧠',
      color: '#9f7aea',
      activities: [
        { id: 'motive', name: s.activityNames.motive, component: MotiveDetective },
        { id: 'needswants', name: s.activityNames.needswants, component: NeedsWantsSorter },
        { id: 'whychain', name: s.activityNames.whychain, component: WhyChain },
        { id: 'brainheart', name: s.activityNames.brainheart, component: BrainVsHeart }
      ]
    },
    {
      id: 'calls',
      title: s.categories.calls,
      icon: '📞',
      color: '#48bb78',
      activities: [
        { id: 'decoder', name: s.activityNames.decoder, component: CommunicationDecoder },
        { id: 'robot', name: s.activityNames.robot, component: RobotTalkBuzzer },
        { id: 'mirror', name: s.activityNames.mirror, component: MirroringDrill },
        { id: 'callflow', name: s.activityNames.callflow, component: CallFlowBuilder },
        { id: 'abc', name: s.activityNames.abc, component: ABCClosingChallenge },
        { id: 'mistake', name: s.activityNames.mistake, component: MistakeSniper },
        { id: 'qualifying', name: s.activityNames.qualifying, component: QualifyingQuest }
      ]
    },
    {
      id: 'professional',
      title: s.categories.professional,
      icon: '💼',
      color: '#ed64a6',
      activities: [
        { id: 'dresscode', name: s.activityNames.dresscode, component: DressCodePolice },
        { id: 'skills', name: s.activityNames.skills, component: SkillsRadar },
        { id: 'impression', name: s.activityNames.impression, component: FirstImpressionTrial }
      ]
    },
    {
      id: 'advanced',
      title: s.categories.advanced,
      icon: '🎮',
      color: '#667eea',
      activities: [
        { id: 'objectionduel', name: s.activityNames.objectionduel, component: ObjectionDuelArena },
        { id: 'objection', name: s.activityNames.objection, component: ObjectionDeflector },
        { id: 'triage', name: s.activityNames.triage, component: LeadTriage },
        { id: 'form', name: s.activityNames.form, component: RequestFormBuilder },
        { id: 'coldcall', name: s.activityNames.coldcall, component: ColdCallSimulator },
        { id: '21exp', name: s.activityNames['21exp'], component: TwentyOneExperiences }
      ]
    },
    {
      id: 'classroom',
      title: s.categories.classroom,
      icon: '🏫',
      color: '#f093fb',
      activities: [
        { id: 'teambattle', name: s.activityNames.teambattle, component: TeamBattleArena },
        { id: 'facilitator', name: s.activityNames.facilitator, component: FacilitatorDeck },
        { id: 'debrief', name: s.activityNames.debrief, component: CoachDebriefConsole },
        { id: 'consensus', name: s.activityNames.consensus, component: ConsensusClash }
      ]
    },
    {
      id: 'fun',
      title: s.categories.fun,
      icon: '🎲',
      color: '#f6ad55',
      activities: [
        { id: 'reviewrescue', name: s.activityNames.reviewrescue, component: ReviewRescue },
        { id: 'academysprint', name: s.activityNames.academysprint, component: AcademySprint },
        { id: 'bingo', name: s.activityNames.bingo, component: RealEstateBingo },
        { id: 'crossword', name: s.activityNames.crossword, component: SalesmanCrossword },
        { id: 'exam', name: s.activityNames.exam, component: FinalExam }
      ]
    },
    {
      id: 'gaming',
      title: s.categories.gaming,
      icon: '🕹️',
      color: '#a78bfa',
      activities: [
        { id: 'clientmatch', name: s.activityNames.clientmatch, component: ClientMatch },
        { id: 'objblitz', name: s.activityNames.objblitz, component: ObjectionBlitz },
        { id: 'propquest', name: s.activityNames.propquest, component: PropertyQuest }
      ]
    }
  ];

  const categories = useMemo(() => rawCategories.map(category => ({
    ...category,
    activities: category.activities.map(activity => ({
      ...activity,
      categoryId: category.id,
      categoryTitle: category.title,
      categoryColor: category.color,
      categoryIcon: category.icon,
      ...getActivityMeta(category.id, activity.id)
    }))
  })), [lang]);

  const activityRegistry = useMemo(
    () => categories.flatMap(category => category.activities),
    [categories]
  );

  const getActivityTrack = useCallback(
    (activityId) => academyProgress.activityStats[activityId] || createEmptyActivityTrack(),
    [academyProgress]
  );

  const launchActivity = useCallback((activity) => {
    if (!activity) return;
    if (activity.unlock && !activity.unlock.unlocked) return;
    setSelectedCategory(activity.categoryId || null);
    setCurrentActivity(activity);
  }, []);

  const launchActivityById = useCallback((activityId) => {
    const nextActivity = activityInsights.find(activity => activity.id === activityId && activity.unlock?.unlocked);
    if (nextActivity) launchActivity(nextActivity);
  }, [activityInsights, launchActivity]);

  const updateScore = useCallback((points, isCorrect) => {
    // Fire game effects immediately
    spawnViewportFlash(isCorrect);
    setGlobalStreak(prevStreak => {
      const nextStreak = isCorrect ? prevStreak + 1 : 0;
      if (points > 0) spawnFloatScore(points, isCorrect, nextStreak);
      if (isCorrect && (nextStreak === 3 || nextStreak === 5 || nextStreak % 10 === 0)) fireConfetti(15);
      return nextStreak;
    });

    setGlobalScore(prev => prev + points);

    if (!currentActivity) return;

    const now = Date.now();
    setAcademyProgress(prev => {
      const currentTrack = prev.activityStats[currentActivity.id] || createEmptyActivityTrack();
      const nextTrack = {
        attempts: currentTrack.attempts + 1,
        correct: currentTrack.correct + (isCorrect ? 1 : 0),
        incorrect: currentTrack.incorrect + (isCorrect ? 0 : 1),
        totalPoints: currentTrack.totalPoints + points,
        bestPoints: Math.max(currentTrack.bestPoints, points),
        lastPlayedAt: now
      };

      const sessionEntry = {
        id: generateId(),
        activityId: currentActivity.id,
        activityName: currentActivity.name,
        categoryTitle: currentActivity.categoryTitle,
        points,
        isCorrect,
        at: now
      };

      return {
        ...prev,
        activityStats: {
          ...prev.activityStats,
          [currentActivity.id]: nextTrack
        },
        recentSessions: [sessionEntry, ...(prev.recentSessions || [])].slice(0, 24),
        lastPlayedId: currentActivity.id
      };
    });
  }, [currentActivity]);

  const rawActivityInsights = useMemo(() => activityRegistry.map(activity => {
    const track = getActivityTrack(activity.id);
    const mastery = computeMastery(track);
    const accuracy = track.attempts ? Math.round((track.correct / track.attempts) * 100) : 0;
    const reviewWeight = track.attempts
      ? (track.incorrect * 14) + Math.max(0, 70 - mastery) + Math.min(track.attempts, 5)
      : 16;
    return {
      ...activity,
      track,
      mastery,
      accuracy,
      reviewWeight
    };
  }), [activityRegistry, getActivityTrack]);

  const academyStatsBase = useMemo(() => {
    const playedActivities = rawActivityInsights.filter(activity => activity.track.attempts > 0).length;
    const masteredActivities = rawActivityInsights.filter(activity => activity.mastery >= 80).length;
    return {
      playedActivities,
      masteredActivities
    };
  }, [rawActivityInsights]);

  const activityInsights = useMemo(() => rawActivityInsights.map(activity => ({
    ...activity,
    unlock: getActivityUnlockState(activity.id, academyStatsBase, globalScore, lang)
  })), [rawActivityInsights, academyStatsBase, globalScore, lang]);

  const unlockedActivityInsights = useMemo(
    () => activityInsights.filter(activity => activity.unlock.unlocked),
    [activityInsights]
  );

  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyChallenge = useMemo(() => {
    if (!unlockedActivityInsights.length) return null;
    const seed = todayKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return unlockedActivityInsights[seed % unlockedActivityInsights.length];
  }, [unlockedActivityInsights, todayKey]);

  const reviewQueue = useMemo(
    () => [...unlockedActivityInsights]
      .filter(activity => activity.track.attempts === 0 || activity.mastery < 72 || activity.track.incorrect > 0)
      .sort((left, right) => right.reviewWeight - left.reviewWeight),
    [unlockedActivityInsights]
  );

  const todaySessions = useMemo(
    () => (academyProgress.recentSessions || []).filter(session => new Date(session.at).toISOString().slice(0, 10) === todayKey),
    [academyProgress.recentSessions, todayKey]
  );

  const redOpsMissions = useMemo(() => {
    const uniqueActivitiesToday = new Set(todaySessions.map(session => session.activityId)).size;
    const pointsToday = todaySessions.reduce((sum, session) => sum + session.points, 0);
    const reviewTouchCount = todaySessions.filter(session => reviewQueue.some(activity => activity.id === session.activityId)).length;
    const claimedMissionKeys = academyProgress.claimedMissionKeys || [];

    return [
      {
        id: 'warmup',
        title: lang === 'eg' ? 'Warm-up جاهز' : 'Warm-up Ready',
        description: lang === 'eg' ? 'ابدأ نشاط واحد على الأقل النهارده.' : 'Start at least one activity today.',
        current: Math.min(todaySessions.length, 1),
        target: 1,
        reward: lang === 'eg' ? 'يشغّل الإيقاع' : 'Starts momentum',
        rewardPoints: 20
      },
      {
        id: 'variety',
        title: lang === 'eg' ? 'تنويع ذكي' : 'Variety Run',
        description: lang === 'eg' ? 'العب 3 أنشطة مختلفة في نفس اليوم.' : 'Play 3 different activities in one day.',
        current: Math.min(uniqueActivitiesToday, 3),
        target: 3,
        reward: lang === 'eg' ? 'يبني إتقان أوسع' : 'Builds wider mastery',
        rewardPoints: 45
      },
      {
        id: 'pressure',
        title: lang === 'eg' ? 'ضغط نقاط' : 'Score Push',
        description: lang === 'eg' ? 'اجمع 120 نقطة النهارده.' : 'Bank 120 points today.',
        current: Math.min(pointsToday, 120),
        target: 120,
        reward: lang === 'eg' ? 'يزوّد سرعة الرتبة' : 'Accelerates rank climb',
        rewardPoints: 60
      },
      {
        id: 'repair',
        title: lang === 'eg' ? 'إصلاح سريع' : 'Repair Loop',
        description: lang === 'eg' ? 'ارجع لنشاط من قائمة المراجعة مرة واحدة.' : 'Touch one activity from the review queue.',
        current: Math.min(reviewTouchCount, 1),
        target: 1,
        reward: lang === 'eg' ? 'يقلل ضغط المراجعة' : 'Cuts review pressure',
        rewardPoints: 30
      }
    ].map(mission => {
      const claimKey = `${todayKey}:${mission.id}`;
      const completed = mission.current >= mission.target;
      const claimed = claimedMissionKeys.includes(claimKey);
      return {
        ...mission,
        claimKey,
        completed,
        claimed,
        claimable: completed && !claimed,
        progress: Math.round((mission.current / mission.target) * 100)
      };
    });
  }, [todaySessions, reviewQueue, lang, academyProgress.claimedMissionKeys, todayKey]);

  const recommendedActivity = useMemo(() => {
    const weakPlayed = reviewQueue.find(activity => activity.track.attempts > 0);
    const neverPlayed = reviewQueue.find(activity => activity.track.attempts === 0);
    return weakPlayed || neverPlayed || dailyChallenge || unlockedActivityInsights[0] || null;
  }, [reviewQueue, dailyChallenge, unlockedActivityInsights]);

  const resumeActivity = useMemo(
    () => activityInsights.find(activity => activity.id === academyProgress.lastPlayedId && activity.unlock.unlocked) || null,
    [activityInsights, academyProgress.lastPlayedId]
  );

  const finalExamActivity = useMemo(
    () => activityInsights.find(activity => activity.id === 'exam') || null,
    [activityInsights]
  );

  const categorySummaries = useMemo(() => categories.map(category => {
    const enriched = activityInsights.filter(activity => activity.categoryId === category.id);
    const unlockedActivities = enriched.filter(activity => activity.unlock.unlocked);
    const playedCount = unlockedActivities.filter(activity => activity.track.attempts > 0).length;
    const mastery = unlockedActivities.length
      ? Math.round(unlockedActivities.reduce((sum, activity) => sum + activity.mastery, 0) / unlockedActivities.length)
      : 0;
    const accuracy = playedCount
      ? Math.round(
          unlockedActivities.reduce((sum, activity) => sum + activity.accuracy, 0) /
          Math.max(1, playedCount)
        )
      : 0;
    const suggested = [...unlockedActivities].sort((left, right) => {
      if (left.track.attempts === 0 && right.track.attempts > 0) return -1;
      if (right.track.attempts === 0 && left.track.attempts > 0) return 1;
      return left.mastery - right.mastery;
    })[0] || null;
    return {
      ...category,
      activities: enriched,
      unlockedCount: unlockedActivities.length,
      playedCount,
      mastery,
      accuracy,
      suggested
    };
  }), [categories, activityInsights]);

  const academyStats = useMemo(() => {
    const playedActivities = unlockedActivityInsights.filter(activity => activity.track.attempts > 0).length;
    const masteredActivities = unlockedActivityInsights.filter(activity => activity.mastery >= 80).length;
    return {
      playedActivities,
      masteredActivities,
      reviewCount: reviewQueue.filter(activity => activity.track.attempts > 0 && activity.mastery < 72).length,
      unlockedActivities: unlockedActivityInsights.length,
      totalActivities: activityInsights.length
    };
  }, [unlockedActivityInsights, activityInsights.length, reviewQueue]);

  const lockedActivityTargets = useMemo(
    () => [...activityInsights]
      .filter(activity => !activity.unlock.unlocked)
      .sort((left, right) => (right.unlock.completionRatio || 0) - (left.unlock.completionRatio || 0))
      .slice(0, 4),
    [activityInsights]
  );

  const currentRank = useMemo(() => getRedRank(globalScore), [globalScore]);
  const nextRank = useMemo(() => getNextRedRank(globalScore), [globalScore]);
  const [promotionNotice, setPromotionNotice] = useState(null);
  const [rewardNotice, setRewardNotice] = useState(null);
  const [unlockNotice, setUnlockNotice] = useState(null);
  const rankMilestoneRef = React.useRef(getRedRank(globalScore).minScore);

  useEffect(() => {
    if (currentRank.minScore > rankMilestoneRef.current) {
      setPromotionNotice({ rank: currentRank, nextRank });
      fireConfetti(40);
    }
    rankMilestoneRef.current = currentRank.minScore;
  }, [currentRank, nextRank]);

  useEffect(() => {
    const seenUnlockIds = academyProgress.seenUnlockIds || [];
    const newlyUnlocked = activityInsights.find(activity => activity.unlock.unlocked && ACTIVITY_UNLOCK_RULES[activity.id] && !seenUnlockIds.includes(activity.id));
    if (!newlyUnlocked) return;

    setUnlockNotice({
      id: newlyUnlocked.id,
      name: newlyUnlocked.name,
      requirementText: newlyUnlocked.unlock.requirementText,
      modeLabel: modeLabels[newlyUnlocked.mode] || modeLabels.solo,
      activity: newlyUnlocked
    });
  }, [activityInsights, academyProgress.seenUnlockIds, modeLabels]);

  const dismissUnlockNotice = useCallback(() => {
    if (!unlockNotice) return;
    setAcademyProgress(prev => ({
      ...prev,
      seenUnlockIds: Array.from(new Set([...(prev.seenUnlockIds || []), unlockNotice.id]))
    }));
    setUnlockNotice(null);
  }, [unlockNotice]);

  const launchUnlockNoticeActivity = useCallback(() => {
    if (!unlockNotice?.activity) return;
    setAcademyProgress(prev => ({
      ...prev,
      seenUnlockIds: Array.from(new Set([...(prev.seenUnlockIds || []), unlockNotice.id]))
    }));
    const nextActivity = unlockNotice.activity;
    setUnlockNotice(null);
    launchActivity(nextActivity);
  }, [unlockNotice, launchActivity]);

  const claimMissionReward = useCallback((mission) => {
    if (!mission?.claimable) return;
    setGlobalScore(prev => prev + mission.rewardPoints);
    setAcademyProgress(prev => ({
      ...prev,
      claimedMissionKeys: Array.from(new Set([...(prev.claimedMissionKeys || []), mission.claimKey]))
    }));
    setRewardNotice({
      id: mission.id,
      title: mission.title,
      points: mission.rewardPoints
    });
  }, []);

  const weakestCategory = useMemo(
    () => [...categorySummaries].sort((left, right) => left.mastery - right.mastery)[0] || null,
    [categorySummaries]
  );

  const strongestCategory = useMemo(
    () => [...categorySummaries].sort((left, right) => right.mastery - left.mastery)[0] || null,
    [categorySummaries]
  );

  const coachingPriority = useMemo(
    () => [...activityInsights]
      .filter(activity => activity.mode === 'coaching' || activity.mode === 'partner' || activity.categoryId === 'calls')
      .sort((left, right) => {
        if (left.track.attempts === 0 && right.track.attempts > 0) return -1;
        if (right.track.attempts === 0 && left.track.attempts > 0) return 1;
        return left.mastery - right.mastery;
      })[0] || null,
    [activityInsights]
  );

  const handleBack = () => {
    if (currentActivity) {
      setCurrentActivity(null);
    } else {
      setSelectedCategory(null);
    }
  };

  const renderModeBadge = (mode) => (
    <span
      style={{
        ...styles.badge,
        ...(mode === 'classroom'
          ? styles.badgeBlue
          : mode === 'coaching'
            ? styles.badgeGreen
            : styles.badgeRed)
      }}
    >
      {modeLabels[mode] || modeLabels.solo}
    </span>
  );

  const renderDifficulty = (difficulty) => (
    <span style={{ color: RM_THEME.faint, fontSize: 12, fontWeight: 700 }}>
      {lang === 'eg' ? `مستوى ${difficulty}/5` : `Level ${difficulty}/5`}
    </span>
  );

  const renderActivity = () => {
    const ActivityComponent = currentActivity.component;
    const ctx = { reviewQueue, launchActivity, activityInsights, categorySummaries, academyStats, recentSessions: academyProgress.recentSessions || [], recommendedActivity, coachingPriority, weakestCategory, strongestCategory, redOpsMissions, lockedActivityTargets };

    if (CLASSROOM_IDS.has(currentActivity.id)) {
      // Classroom / facilitator activities: no game shell
      return <ActivityComponent onBack={handleBack} updateScore={updateScore} academyContext={ctx} />;
    }

    return (
      <ActivityGameShell key={currentActivity.id} updateScore={updateScore}>
        {(wrappedUpdate) => (
          <ActivityComponent onBack={handleBack} updateScore={wrappedUpdate} academyContext={ctx} />
        )}
      </ActivityGameShell>
    );
  };

  const renderCategoryActivities = () => {
    const category = categorySummaries.find(c => c.id === selectedCategory);
    if (!category) return null;

    const categoryReviewCount = category.activities.filter(activity => activity.unlock.unlocked && activity.track.attempts > 0 && activity.mastery < 72).length;
    
    return (
      <div className="animate-fadeIn">
        <button onClick={handleBack} style={{ ...styles.secondaryBtn, marginBottom: '20px' }}>
          {s.backToCategories}
        </button>
        
        <div style={{
          marginBottom: '24px',
          padding: '24px',
          borderRadius: '24px',
          border: `1px solid ${RM_THEME.border}`,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '56px' }}>{category.icon}</span>
                <div>
                  <h2 style={{ marginBottom: 6 }}>{category.title}</h2>
                  <p style={{ color: RM_THEME.muted }}>
                    {lang === 'eg'
                      ? `${category.unlockedCount}/${category.activities.length} نشاط مفتوح • ${category.playedCount} متجرب`
                      : `${category.unlockedCount}/${category.activities.length} activities unlocked • ${category.playedCount} played`}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={styles.scoreItem}>
                <span style={styles.scoreLabel}>{lang === 'eg' ? 'إتقان' : 'Mastery'}</span>
                <span style={styles.scoreValue}>{category.mastery}%</span>
              </div>
              <div style={styles.scoreItem}>
                <span style={styles.scoreLabel}>{lang === 'eg' ? 'دقة' : 'Accuracy'}</span>
                <span style={styles.scoreValue}>{category.accuracy}%</span>
              </div>
              <div style={styles.scoreItem}>
                <span style={styles.scoreLabel}>{lang === 'eg' ? 'مراجعة' : 'Review'}</span>
                <span style={styles.scoreValue}>{categoryReviewCount}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 260px' }}>
              <div style={{ ...styles.progressBar, marginBottom: 8 }}>
                <div style={{ ...styles.progressFill, width: `${category.mastery}%` }} />
              </div>
              <div style={{ color: RM_THEME.faint, fontSize: 13 }}>
                {category.suggested
                  ? (lang === 'eg'
                    ? `أفضل نشاط تكمل بيه دلوقتي: ${category.suggested.name}`
                    : `Best next activity in this lane: ${category.suggested.name}`)
                  : ''}
              </div>
            </div>
            {category.suggested && (
              <button onClick={() => launchActivity(category.suggested)} style={styles.primaryBtn}>
                {lang === 'eg' ? 'ابدأ النشاط الموصّى به' : 'Start Recommended Activity'}
              </button>
            )}
          </div>
        </div>

        <div style={styles.grid3}>
          {category.activities.map((activity, idx) => (
            <div
              key={activity.id}
              onClick={() => launchActivity(activity)}
              style={{
                ...styles.categoryCard,
                borderLeft: `4px solid ${category.color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                minHeight: 240,
                opacity: activity.unlock.unlocked ? 1 : 0.68,
                cursor: activity.unlock.unlocked ? 'pointer' : 'not-allowed'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ fontSize: '24px' }}>
                  {['🎯', '⚡', '🎮', '🧩', '🔥', '💡', '🏆'][idx % 7]}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {renderModeBadge(activity.mode)}
                  {!activity.unlock.unlocked && <span style={{ ...styles.badge, ...styles.badgeRed }}>{lang === 'eg' ? 'مقفول' : 'Locked'}</span>}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', marginBottom: 6 }}>{activity.name}</h3>
                <p style={{ fontSize: 13, color: RM_THEME.muted, lineHeight: 1.5 }}>
                  {lang === 'eg'
                    ? `جاهز لـ ${activity.duration} دقايق تقريبًا • ${activity.tags.slice(0, 2).join(' • ')}`
                    : `Built for ~${activity.duration} min • ${activity.tags.slice(0, 2).join(' • ')}`}
                </p>
                {!activity.unlock.unlocked && (
                  <p style={{ fontSize: 12, color: RM_THEME.red, lineHeight: 1.5, marginTop: 8 }}>
                    {lang === 'eg' ? `الفتح: ${activity.unlock.requirementText}` : `Unlock: ${activity.unlock.requirementText}`}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {renderDifficulty(activity.difficulty)}
                <span style={{ color: RM_THEME.faint, fontSize: 12 }}>
                  {lang === 'eg' ? `آخر مرّة: ${formatLastPlayed(lang, activity.track.lastPlayedAt)}` : `Last played: ${formatLastPlayed(lang, activity.track.lastPlayedAt)}`}
                </span>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: RM_THEME.faint, fontSize: 12 }}>
                  <span>{lang === 'eg' ? 'إتقان' : 'Mastery'}</span>
                  <span>{activity.mastery}%</span>
                </div>
                <div style={{ ...styles.progressBar, marginBottom: 8 }}>
                  <div style={{ ...styles.progressFill, width: `${activity.mastery}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: RM_THEME.muted, fontSize: 12 }}>
                  <span>{lang === 'eg' ? `دقة: ${activity.accuracy}%` : `Accuracy: ${activity.accuracy}%`}</span>
                  <span>{lang === 'eg' ? `${activity.track.attempts} محاولة` : `${activity.track.attempts} attempts`}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const coachLaunchActivity = academyProgress.recentSessions.length
    ? (activityInsights.find(activity => activity.id === 'debrief' && activity.unlock.unlocked) || activityInsights.find(activity => activity.id === 'facilitator' && activity.unlock.unlocked) || null)
    : (activityInsights.find(activity => activity.id === 'facilitator' && activity.unlock.unlocked) || null);
  const partnerLaunchActivity = activityInsights.find(activity => activity.id === 'objectionduel' && activity.unlock.unlocked) || null;
  const classroomLaunchActivity = activityInsights.find(activity => activity.id === 'teambattle' && activity.unlock.unlocked) || null;

  const renderDashboard = () => {
    const currentRank = getRedRank(globalScore);
    const nextRank = getNextRedRank(globalScore);
    const rankProgress = nextRank ? ((globalScore - currentRank.minScore) / (nextRank.minScore - currentRank.minScore)) * 100 : 100;
    const ringRadius = 52;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringOffset = ringCircumference - (ringCircumference * Math.min(rankProgress, 100) / 100);
    const cmdColors = {
      daily: { bg: 'rgba(255,176,32,0.12)', icon: 'rgba(255,176,32,0.85)', glow: 'rgba(255,176,32,0.2)' },
      review: { bg: 'rgba(80,250,123,0.12)', icon: 'rgba(80,250,123,0.85)', glow: 'rgba(80,250,123,0.2)' },
      resume: { bg: 'rgba(102,126,234,0.12)', icon: 'rgba(102,126,234,0.85)', glow: 'rgba(102,126,234,0.2)' },
      classroom: { bg: 'rgba(240,147,251,0.12)', icon: 'rgba(240,147,251,0.85)', glow: 'rgba(240,147,251,0.2)' }
    };
    return (
    <div className="animate-fadeIn xstagger">
      {/* ═══ HERO: Rank + Stats ═══ */}
      <div className="xcard" style={{
        marginBottom: 28, padding: '32px 28px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035))',
        border: `1px solid ${RM_THEME.border}`, borderRadius: 26,
        boxShadow: '0 28px 90px rgba(0,0,0,0.28)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -80, right: -60, width: 280, height: 280, background: `radial-gradient(circle, ${currentRank.accent}22, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 220, height: 220, background: 'radial-gradient(circle, rgba(240,147,251,0.08), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 680, flex: '1 1 380px' }}>
            <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ ...styles.badge, ...styles.badgeRed }}>{lang === 'eg' ? 'أكاديمية الأداء' : 'Performance Academy'}</span>
              <span style={{ ...styles.badge, ...styles.badgeBlue }}>{lang === 'eg' ? `${activityInsights.length} نشاط` : `${activityInsights.length} Activities`}</span>
              {projectorMode && <span style={{ ...styles.badge, ...styles.badgeGreen }}>{lang === 'eg' ? 'وضع بروجكتور' : 'Projector Ready'}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14 }}>
              <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                <svg className="xring" width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle className="xring-fill" cx="60" cy="60" r={ringRadius} fill="none" stroke={currentRank.accent} strokeWidth="6"
                    strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} strokeLinecap="round" />
                </svg>
                <div className="xrank-orb" style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: 56, height: 56,
                  background: `linear-gradient(135deg, ${currentRank.accent}44, ${currentRank.accent}22)`,
                  border: `2px solid ${currentRank.accent}66`
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={currentRank.accent} opacity="0.9"/></svg>
                </div>
              </div>
              <div>
                <h1 style={{ fontSize: 38, lineHeight: 1.05, marginBottom: 4, fontWeight: 850 }}>{s.appTitle}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: currentRank.accent, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                    {lang === 'eg' ? currentRank.eg : currentRank.en}
                  </span>
                  {nextRank && <span style={{ fontSize: 12, color: RM_THEME.faint }}>→ {nextRank.minScore - globalScore} {lang === 'eg' ? 'XP للترقية' : 'XP to next'}</span>}
                </div>
                {nextRank && (
                  <div className="xxp-bar" style={{ marginTop: 10, width: 200, maxWidth: '100%' }}>
                    <div className="xxp-fill" style={{ width: `${Math.min(rankProgress, 100)}%` }} />
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: 16, color: RM_THEME.muted, lineHeight: 1.65, maxWidth: 600 }}>{s.appSubtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, flex: '1 1 360px' }}>
            <div className="xstat" style={{ '--xstat-accent': `linear-gradient(90deg, ${RM_THEME.red}, ${RM_THEME.red2})` }}>
              <span style={{ fontSize: 12, color: RM_THEME.muted, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>{s.totalScore}</span>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', display: 'block' }}>{globalScore}</span>
            </div>
            <div className="xstat" style={{ '--xstat-accent': `linear-gradient(90deg, ${RM_THEME.amber}, #ff8c00)` }}>
              <span style={{ fontSize: 12, color: RM_THEME.muted, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>{s.currentStreak}</span>
              <span style={{ fontSize: 32, fontWeight: 800, color: RM_THEME.amber, display: 'block' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={RM_THEME.amber} style={{ verticalAlign: 'middle', marginRight: 6 }}><path d="M12 23c-3.2-2.4-8-7.1-8-12.7C4 5.8 7.6 2 12 2s8 3.8 8 8.3c0 5.6-4.8 10.3-8 12.7z"/><path d="M12 18c-1.4-1.2-4-3.8-4-6.5C8 9.2 9.8 7 12 7s4 2.2 4 4.5c0 2.7-2.6 5.3-4 6.5z" fill="rgba(255,255,255,0.3)"/></svg>
                {globalStreak}
              </span>
            </div>
            <div className="xstat" style={{ '--xstat-accent': `linear-gradient(90deg, ${RM_THEME.green}, #2ecc71)` }}>
              <span style={{ fontSize: 12, color: RM_THEME.muted, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>{lang === 'eg' ? 'متقن' : 'Mastered'}</span>
              <span style={{ fontSize: 32, fontWeight: 800, color: RM_THEME.green, display: 'block' }}>{academyStats.masteredActivities}</span>
            </div>
            <div className="xstat" style={{ '--xstat-accent': `linear-gradient(90deg, #f093fb, #764ba2)` }}>
              <span style={{ fontSize: 12, color: RM_THEME.muted, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>{lang === 'eg' ? 'مراجعة' : 'Review Queue'}</span>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#f093fb', display: 'block' }}>{academyStats.reviewCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ COMMAND DECK ═══ */}
      <div className="reveal" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={RM_THEME.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          {lang === 'eg' ? 'غرفة قيادة الأكاديمية' : 'Academy Command Deck'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            {
              key: 'daily', color: cmdColors.daily,
              svgPath: 'M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z',
              title: lang === 'eg' ? 'تحدي النهارده' : 'Daily Challenge',
              text: dailyChallenge ? `${dailyChallenge.name} • ${dailyChallenge.categoryTitle}` : (lang === 'eg' ? 'اختيار يومي تلقائي' : 'Fresh mixed challenge'),
              action: dailyChallenge ? () => launchActivity(dailyChallenge) : null,
              actionLabel: lang === 'eg' ? 'ابدأ' : 'Launch'
            },
            {
              key: 'review', color: cmdColors.review,
              svgPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
              title: lang === 'eg' ? 'Review Rescue' : 'Review Rescue',
              text: recommendedActivity ? `${recommendedActivity.name} • ${lang === 'eg' ? 'إتقان' : 'Mastery'} ${recommendedActivity.mastery}%` : (lang === 'eg' ? 'مراجعة أضعف نقطة' : 'Rescue the weakest area'),
              action: recommendedActivity ? () => launchActivity(recommendedActivity) : null,
              actionLabel: lang === 'eg' ? 'أنقذ المستوى' : 'Rescue It'
            },
            {
              key: 'resume', color: cmdColors.resume,
              svgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
              title: lang === 'eg' ? 'كمّل من آخر مرة' : 'Resume Momentum',
              text: resumeActivity ? `${resumeActivity.name} • ${formatLastPlayed(lang, resumeActivity.track.lastPlayedAt)}` : (lang === 'eg' ? 'مفيش نشاط سابق، ابدأ امتحان أو نشاط جديد' : 'No recent session yet'),
              action: resumeActivity ? () => launchActivity(resumeActivity) : (finalExamActivity ? () => launchActivity(finalExamActivity) : null),
              actionLabel: resumeActivity ? (lang === 'eg' ? 'كمّل' : 'Resume') : (lang === 'eg' ? 'ادخل الامتحان' : 'Start Exam')
            },
            {
              key: 'classroom', color: cmdColors.classroom,
              svgPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
              title: lang === 'eg' ? 'تشغيل فصل بسرعة' : 'Facilitator Quick Launch',
              text: lang === 'eg' ? 'شغّل تيـم باتل أو كروت المُيسّر فورًا' : 'Launch Team Battle or Facilitator Deck',
              action: () => launchActivityById('teambattle'),
              actionLabel: lang === 'eg' ? 'ابدأ الفصل' : 'Launch Room'
            }
          ].map(card => (
            <div key={card.key} className="xcmd" style={{
              '--xcmd-glow': card.color.glow, padding: 22,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
              border: `1px solid ${RM_THEME.border}`, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 210
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div className="xcmd-icon" style={{ background: card.color.bg }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={card.color.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={card.svgPath} /></svg>
                </div>
                <div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 6 }}>{card.title}</h3>
                  <p style={{ color: RM_THEME.muted, lineHeight: 1.55, fontSize: 14 }}>{card.text}</p>
                </div>
              </div>
              <div style={{ marginTop: 'auto' }}>
                {card.action && <button onClick={card.action} style={{ ...styles.primaryBtn, padding: '12px 22px', fontSize: 14 }}>{card.actionLabel}</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ OPS + UNLOCK RADAR ═══ */}
      <div className="reveal cv-auto" style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div className="xcard" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', border: `1px solid ${RM_THEME.border}`, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f093fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Xcelias Ops
            </h3>
            <span style={{ ...styles.badge, ...styles.badgeBlue }}>{redOpsMissions.filter(m => m.completed).length}/{redOpsMissions.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {redOpsMissions.map(mission => (
              <div key={mission.id} className={mission.claimable ? 'xmission-claim' : ''} style={{
                padding: 14, borderRadius: 16,
                border: `1px solid ${mission.completed ? 'rgba(80,250,123,0.2)' : RM_THEME.border}`,
                background: mission.completed ? 'rgba(80,250,123,0.06)' : 'rgba(255,255,255,0.03)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                  <strong style={{ fontSize: 14 }}>{mission.title}</strong>
                  <span style={{ color: mission.claimed ? RM_THEME.green : mission.completed ? RM_THEME.amber : RM_THEME.faint, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {mission.claimed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={RM_THEME.green} strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    {mission.claimed ? (lang === 'eg' ? 'تم' : 'Claimed') : `${mission.current}/${mission.target}`}
                  </span>
                </div>
                <div style={{ color: RM_THEME.muted, fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>{mission.description}</div>
                <div className="xxp-bar" style={{ marginTop: 10, marginBottom: 6 }}>
                  <div className="xxp-fill" style={{ width: `${mission.progress}%`, background: mission.completed ? `linear-gradient(90deg, ${RM_THEME.green}, rgba(34,197,94,0.55))` : undefined }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                  <div style={{ color: RM_THEME.faint, fontSize: 12 }}>{lang === 'eg' ? `+${mission.rewardPoints} نقطة` : `+${mission.rewardPoints} pts`}</div>
                  {mission.claimable && (
                    <button onClick={() => claimMissionReward(mission)} style={{ ...styles.primaryBtn, padding: '8px 14px', fontSize: 12 }}>
                      {lang === 'eg' ? 'حصّل المكافأة' : 'Claim'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xcard" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', border: `1px solid ${RM_THEME.border}`, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={RM_THEME.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="6"/></svg>
              {lang === 'eg' ? 'الرادار الجاي' : 'Next Unlock Radar'}
            </h3>
            <span style={{ ...styles.badge, ...styles.badgeRed }}>{lockedActivityTargets.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lockedActivityTargets.map(activity => {
              const unlockR = 18; const unlockC = 2 * Math.PI * unlockR; const unlockOff = unlockC - (unlockC * activity.unlock.completionRatio / 100);
              return (
                <div key={activity.id} style={{ padding: 14, borderRadius: 16, border: `1px solid ${RM_THEME.border}`, background: 'rgba(255,255,255,0.03)', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                    <svg className="xring" width="44" height="44" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r={unlockR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <circle className="xring-fill" cx="22" cy="22" r={unlockR} fill="none" stroke={RM_THEME.red} strokeWidth="3"
                        strokeDasharray={unlockC} strokeDashoffset={unlockOff} strokeLinecap="round" />
                    </svg>
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 10, fontWeight: 800, color: RM_THEME.red }}>{activity.unlock.completionRatio}%</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14 }}>{activity.name}</strong>
                    <div style={{ color: RM_THEME.muted, fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{activity.unlock.requirementText}</div>
                  </div>
                </div>
              );
            })}
            {lockedActivityTargets.length === 0 && (
              <div style={{ color: RM_THEME.muted, lineHeight: 1.6, padding: '20px 0', textAlign: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={RM_THEME.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.6 }}><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                {lang === 'eg' ? 'كل الأنشطة المفتوحة اتفتحت. كمّل لعب وارفع الرتبة.' : 'All unlocked. Keep pushing the rank ladder.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ PERFORMANCE SIGNAL ═══ */}
      <div className="xcard reveal" style={{ marginBottom: 24, padding: 24, background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(255,59,59,0.06))', border: `1px solid ${RM_THEME.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 420px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...styles.badge, ...styles.badgeBlue }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  {lang === 'eg' ? 'إشارة الأداء' : 'Performance Signal'}
                </span>
                {weakestCategory && <span style={{ ...styles.badge, ...styles.badgeRed }}>{lang === 'eg' ? 'أولوية' : 'Priority'}</span>}
              </div>
              <h3 style={{ marginBottom: 8, fontSize: 20 }}>
                {weakestCategory
                  ? (lang === 'eg' ? `أضعف مسار: ${weakestCategory.title}` : `Weakest lane: ${weakestCategory.title}`)
                  : (lang === 'eg' ? 'ابدأ أول نشاط لبناء خط الأساس' : 'Start your first activity to build a baseline')}
              </h3>
              <p style={{ color: RM_THEME.muted, lineHeight: 1.6 }}>
                {weakestCategory
                  ? (lang === 'eg'
                    ? `الإتقان ${weakestCategory.mastery}% فقط. أفضل خطوة: ${weakestCategory.suggested?.name || 'نشاط من المسار ده'}.`
                    : `Mastery is only ${weakestCategory.mastery}%. Best move: ${weakestCategory.suggested?.name || 'an activity in this lane'}.`)
                  : (lang === 'eg' ? 'ابدأ بتحدي اليوم، وبعدها هنديك توصيات أدق.' : 'Start with the daily challenge for tailored recommendations.')}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, flex: '1 1 340px' }}>
              <div className="xstat" style={{ '--xstat-accent': `linear-gradient(90deg, ${RM_THEME.green}, #2ecc71)` }}>
                <span style={{ fontSize: 12, color: RM_THEME.muted, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>{lang === 'eg' ? 'أقوى مسار' : 'Strongest Lane'}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{strongestCategory ? strongestCategory.title : '—'}</span>
              </div>
              <div className="xstat" style={{ '--xstat-accent': `linear-gradient(90deg, ${RM_THEME.red}, ${RM_THEME.red2})` }}>
                <span style={{ fontSize: 12, color: RM_THEME.muted, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>{lang === 'eg' ? 'كووتشينج أولويّة' : 'Coaching Priority'}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{coachingPriority ? coachingPriority.name : '—'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            {weakestCategory?.suggested && (
              <button onClick={() => launchActivity(weakestCategory.suggested)} style={styles.primaryBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                {lang === 'eg' ? 'عالِج أضعف مسار' : 'Fix Weakest Lane'}
              </button>
            )}
            {coachingPriority && (
              <button onClick={() => launchActivity(coachingPriority)} style={styles.secondaryBtn}>
                {lang === 'eg' ? 'افتح تدريب الكووتشينج' : 'Open Coaching Drill'}
              </button>
            )}
          </div>
      </div>

      {/* ═══ TRAINING MODES ═══ */}
      <div className="reveal cv-auto" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={RM_THEME.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          {lang === 'eg' ? 'أوضاع التدريب' : 'Training Modes'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            {
              id: 'solo-launch', title: lang === 'eg' ? 'Solo Sprint' : 'Solo Sprint',
              copy: lang === 'eg' ? 'أفضل نشاط فردي تبدأ بيه دلوقتي.' : 'The smartest self-study launch.',
              svgPath: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 6v4l3 3', color: '#667eea',
              action: recommendedActivity ? () => launchActivity(recommendedActivity) : null
            },
            {
              id: 'coach-launch', title: lang === 'eg' ? 'Coach Flow' : 'Coach Flow',
              copy: lang === 'eg' ? 'ابدأ جلسة واحد لواحد.' : 'Open a trainer-led deck or coaching simulation.',
              svgPath: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
              color: '#ffb020',
              action: coachLaunchActivity ? () => launchActivity(coachLaunchActivity) : null,
              lockedText: coachLaunchActivity ? '' : (lang === 'eg' ? 'افتح شوية أنشطة الأول.' : 'Play a few activities first.')
            },
            {
              id: 'partner-launch', title: lang === 'eg' ? 'Partner Duel' : 'Partner Duel',
              copy: lang === 'eg' ? 'تمارين رول-سواب واعتراضات.' : 'Role-swap drills and objections.',
              svgPath: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M14 10l2 2 4-4M12 7a4 4 0 11-8 0 4 4 0 018 0z',
              color: '#50fa7b',
              action: partnerLaunchActivity ? () => launchActivity(partnerLaunchActivity) : null,
              lockedText: partnerLaunchActivity ? '' : (lang === 'eg' ? 'ارفع السكور لفتح البارتنر مود.' : 'Raise score to unlock partner mode.')
            },
            {
              id: 'classroom-launch', title: lang === 'eg' ? 'Classroom Arena' : 'Classroom Arena',
              copy: lang === 'eg' ? 'بزّر، فرق، ونتائج مباشرة.' : 'Buzzer battles, teams, and projector pacing.',
              svgPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4',
              color: '#f093fb',
              action: classroomLaunchActivity ? () => launchActivity(classroomLaunchActivity) : null,
              lockedText: classroomLaunchActivity ? '' : (lang === 'eg' ? 'شغّل جولات فردية الأول.' : 'Run solo rounds first.')
            }
          ].map(modeCard => (
            <div key={modeCard.id} className="xlane" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, opacity: modeCard.action ? 1 : 0.6, minHeight: 190 }}>
              <div className="xlane-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${modeCard.color}15, transparent 70%)` }} />
              <div className="xlane-icon" style={{ width: 48, height: 48, borderRadius: 14, background: `${modeCard.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s ease' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={modeCard.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={modeCard.svgPath} /></svg>
              </div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{modeCard.title}</div>
              <div style={{ color: RM_THEME.muted, lineHeight: 1.5, fontSize: 13 }}>{modeCard.copy}</div>
              {!modeCard.action && modeCard.lockedText && (
                <div style={{ color: RM_THEME.red, fontSize: 12, lineHeight: 1.4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: 4 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  {modeCard.lockedText}
                </div>
              )}
              <div style={{ marginTop: 'auto' }}>
                <button onClick={modeCard.action} disabled={!modeCard.action} style={{
                  ...styles.secondaryBtn, padding: '10px 18px', fontSize: 13,
                  ...(modeCard.action ? { borderColor: `${modeCard.color}44`, color: modeCard.color } : {})
                }}>
                  {modeCard.action ? (lang === 'eg' ? 'شغّل' : 'Launch') : (lang === 'eg' ? 'مقفول' : 'Locked')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ ACADEMY LANES — Game-like Level Grid ═══ */}
      <div className="reveal cv-auto" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={RM_THEME.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          {lang === 'eg' ? 'مسارات الأكاديمية' : 'Academy Lanes'}
        </h2>
        <div style={styles.grid4}>
          {categorySummaries.map(category => {
            const laneR = 30; const laneC = 2 * Math.PI * laneR; const laneOff = laneC - (laneC * category.mastery / 100);
            return (
              <div key={category.id} onClick={() => setSelectedCategory(category.id)} className="xlane"
                style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, borderTop: `3px solid ${category.color}` }}>
                <div className="xlane-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${category.color}12, transparent 70%)` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div className="xlane-icon" style={{ fontSize: 36, marginBottom: 10, transition: 'transform 0.3s ease' }}>{category.icon}</div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>{category.title}</h3>
                  </div>
                  <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                    <svg className="xring" width="64" height="64" viewBox="0 0 68 68">
                      <circle cx="34" cy="34" r={laneR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                      <circle className="xring-fill" cx="34" cy="34" r={laneR} fill="none" stroke={category.color} strokeWidth="4"
                        strokeDasharray={laneC} strokeDashoffset={laneOff} strokeLinecap="round" />
                    </svg>
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 13, fontWeight: 800, color: category.color }}>{category.mastery}%</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: RM_THEME.muted, lineHeight: 1.5 }}>
                  {lang === 'eg'
                    ? `${category.activities.length} نشاط • ${category.playedCount} متجرب • دقة ${category.accuracy || 0}%`
                    : `${category.activities.length} activities • ${category.playedCount} played • ${category.accuracy || 0}% acc`}
                </p>
                <div className="xxp-bar" style={{ marginTop: 'auto' }}>
                  <div className="xxp-fill" style={{ width: `${category.mastery}%`, background: `linear-gradient(90deg, ${category.color}, ${category.color}88)` }} />
                </div>
                {category.suggested && (
                  <div style={{ color: RM_THEME.faint, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    {lang === 'eg' ? `موصى به: ${category.suggested.name}` : `Next: ${category.suggested.name}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ RECENT SESSIONS + AREAS NEEDING ATTENTION ═══ */}
      <div className="reveal cv-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div className="xcard" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', border: `1px solid ${RM_THEME.border}`, display: 'flex', flexDirection: 'column', minHeight: 260 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={RM_THEME.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              {lang === 'eg' ? 'آخر الجلسات' : 'Recent Sessions'}
            </h3>
            <span style={{ ...styles.badge, ...styles.badgeGreen }}>{academyProgress.recentSessions.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(academyProgress.recentSessions || []).slice(0, 6).map(session => (
              <div key={session.id} style={{ padding: '12px 14px', borderRadius: 14, border: `1px solid ${RM_THEME.border}`, background: 'rgba(255,255,255,0.03)', transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{session.activityName}</div>
                  <div style={{ color: session.isCorrect ? RM_THEME.green : '#f56565', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {session.isCorrect
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={RM_THEME.green} strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f56565" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>}
                    {session.isCorrect ? '+' : ''}{session.points}
                  </div>
                </div>
                <div style={{ color: RM_THEME.muted, fontSize: 12, marginTop: 4 }}>
                  {session.categoryTitle} • {formatLastPlayed(lang, session.at)}
                </div>
              </div>
            ))}
            {academyProgress.recentSessions.length === 0 && (
              <div style={{ color: RM_THEME.muted, lineHeight: 1.6, textAlign: 'center', padding: '20px 0' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                {lang === 'eg' ? 'ابدأ أي نشاط، وسجلّك هيظهر هنا.' : 'Start any activity and your history will build up here.'}
              </div>
            )}
          </div>
        </div>

        <div className="xcard" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', border: `1px solid ${RM_THEME.border}`, display: 'flex', flexDirection: 'column', minHeight: 260 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f56565" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
              {lang === 'eg' ? 'مناطق محتاجة شغل' : 'Areas Needing Attention'}
            </h3>
            <span style={{ ...styles.badge, ...styles.badgeRed }}>{reviewQueue.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviewQueue.slice(0, 6).map(activity => (
              <button key={activity.id} onClick={() => launchActivity(activity)}
                className="game-option game-option--blue" style={{ padding: '12px 16px', marginBottom: 0, textAlign: 'left', borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                  <strong style={{ fontSize: 14 }}>{activity.name}</strong>
                  <span style={{ color: '#f56565', fontSize: 12, fontWeight: 800 }}>{activity.mastery}%</span>
                </div>
                <div style={{ color: RM_THEME.muted, fontSize: 12, marginTop: 6 }}>
                  {activity.categoryTitle} • {activity.track.attempts === 0
                    ? (lang === 'eg' ? 'لسه ما اتجربش' : 'Never played')
                    : (lang === 'eg' ? `دقة ${activity.accuracy}%` : `${activity.accuracy}% accuracy`)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
    );
  };

  // ─── AUTH GUARD ──────────────────────────────────────
  if (!currentUser) {
    return <XcLoginScreen onLogin={handleLogin} />;
  }

  return (
    <UIContext.Provider value={{
      tone,
      fxIntensity,
      reduceMotion,
      backgroundEnabled,
      projectorMode,
      setTone,
      setFxIntensity,
      setReduceMotion,
      setBackgroundEnabled,
      setProjectorMode
    }}>
      <>
        <BackgroundFX />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        {showLeaderboard && <XcLeaderboard currentUser={currentUser} onClose={() => { setShowLeaderboard(false); setMobileTab('home'); }} />}
        {showAdmin && currentUser?.role === 'admin' && <XcAdminPanel currentUser={currentUser} onClose={() => { setShowAdmin(false); setMobileTab('home'); }} />}
        {showRoom && <XcRoomPanel currentUser={currentUser} onClose={() => { setShowRoom(false); setMobileTab('home'); }} />}
        <div style={styles.container} className="rm-app-shell">
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          {/* ANIMATED LOGO */}
          <div style={styles.logoIcon} className="xc-logo-icon">
            <div className="xc-logo-ring-spin"></div>
            <div className="xc-logo-ring-pulse"></div>
            <div className="xc-orb-track xc-orb-track--1"><span className="xc-orb xc-orb--1"></span></div>
            <div className="xc-orb-track xc-orb-track--2"><span className="xc-orb xc-orb--2"></span></div>
            <div className="xc-orb-track xc-orb-track--3"><span className="xc-orb xc-orb--3"></span></div>
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="xc-logo-svg" style={{width:'28px',height:'28px',position:'relative',zIndex:2}}>
              <defs><linearGradient id="xlg" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stopColor="#667eea"/><stop offset="50%" stopColor="#764ba2"/><stop offset="100%" stopColor="#f093fb"/></linearGradient></defs>
              <rect x="4" y="4" width="48" height="48" rx="14" stroke="url(#xlg)" strokeWidth="2" fill="none" opacity="0.8"/>
              <text x="28" y="37" textAnchor="middle" fill="url(#xlg)" fontFamily="Montserrat" fontWeight="900" fontSize="26">X</text>
            </svg>
          </div>
          <div style={{display:'flex',flexDirection:'column'}}>
            <span style={styles.logoText}>{s.appTitle}</span>
            <span style={styles.logoSub}><span style={styles.logoRed}>by red</span> Training Academy</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Leaderboard */}
          <button className="xc-header-btn xc-header-btn--trophy" onClick={() => setShowLeaderboard(true)} title="Leaderboard">
            🏆 <span style={{display:'inline-block'}}>Board</span>
          </button>
          {/* Room */}
          <button className="xc-header-btn xc-header-btn--room" onClick={() => setShowRoom(true)} title="Join Classroom Room">
            🎮 <span style={{display:'inline-block'}}>Room</span>
          </button>
          {/* Admin panel for admin only */}
          {currentUser?.role === 'admin' && (
            <button className="xc-header-btn xc-header-btn--admin" onClick={() => setShowAdmin(true)} title="Admin Panel">
              👑 <span style={{display:'inline-block'}}>Admin</span>
            </button>
          )}
          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            style={{ ...styles.secondaryBtn, padding: '10px 14px', borderRadius: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            title={lang === 'eg' ? 'الإعدادات' : 'Settings'}
          >
            <span style={{ fontSize: 16 }}>⚙</span>
            <span style={{ fontSize: 12, color: RM_THEME.muted, fontWeight: 800 }}>{s.settings}</span>
          </button>
          {/* Score panel */}
          <ScorePanel score={globalScore} streak={globalStreak} totalQuestions={0} currentQuestion={0} />
          {/* User chip + logout */}
          <div className="xc-user-chip" onClick={handleLogout} title="Click to sign out">
            <div className="xc-user-avatar">
              {currentUser?.role === 'admin' ? '👑' : (currentUser?.displayName||currentUser?.username||'U').charAt(0).toUpperCase()}
            </div>
            <span className="xc-user-name">{currentUser?.displayName || currentUser?.username}</span>
          </div>
        </div>
      </header>

      <RunStatusBar
        lang={lang}
        globalScore={globalScore}
        globalStreak={globalStreak}
        academyStats={academyStats}
        currentActivity={currentActivity}
        recommendedActivity={recommendedActivity}
      />

      <PromotionBanner
        lang={lang}
        promotionNotice={promotionNotice}
        onClose={() => setPromotionNotice(null)}
      />

      <UnlockRevealBanner
        lang={lang}
        unlockNotice={unlockNotice}
        onClose={dismissUnlockNotice}
        onLaunch={launchUnlockNoticeActivity}
      />

      <MissionRewardBanner
        lang={lang}
        rewardNotice={rewardNotice}
        onClose={() => setRewardNotice(null)}
      />

      {/* Main Content */}
      <main>
        {currentActivity 
          ? renderActivity()
          : selectedCategory 
            ? renderCategoryActivities()
            : renderDashboard()
        }
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
        <p>
          🏆 {lang === 'eg' ? 'منصة تدريب تفاعلية • سيناريوهات مالهاش آخر' : 'Dynamic Training Platform • Infinite Scenarios Engine'}
        </p>
        <p style={{ marginTop: '5px' }}>
          {lang === 'eg'
            ? 'كل المحتوى مبني على عرض تدريب Xcelias'
            : 'All content derived from Xcelias Training Presentation'}
        </p>
      </footer>

        {/* ── Mobile Bottom Navigation ── */}
        <nav className="xc-bottom-nav">
          <button className={`xc-bnav-item${mobileTab==='home'?' active':''}`}
            onClick={() => { setMobileTab('home'); setCurrentActivity(null); setSelectedCategory(null); }}>
            <span className="xc-bnav-icon">🏠</span>
            <span className="xc-bnav-label">Home</span>
          </button>
          <button className={`xc-bnav-item${mobileTab==='games'?' active':''}`}
            onClick={() => { setMobileTab('games'); setSelectedCategory('gaming'); setCurrentActivity(null); }}>
            <span className="xc-bnav-icon">🕹️</span>
            <span className="xc-bnav-label">{lang==='eg'?'ألعاب':'Games'}</span>
          </button>
          <button className={`xc-bnav-item${mobileTab==='board'?' active':''}`}
            onClick={() => { setMobileTab('board'); setShowLeaderboard(true); }}>
            <span className="xc-bnav-icon">🏆</span>
            <span className="xc-bnav-label">Board</span>
          </button>
          <button className={`xc-bnav-item${mobileTab==='room'?' active':''}`}
            onClick={() => { setMobileTab('room'); setShowRoom(true); }}>
            <span className="xc-bnav-icon">🎮</span>
            <span className="xc-bnav-label">Room</span>
          </button>
          <button className={`xc-bnav-item${mobileTab==='profile'?' active':''}`}
            onClick={() => { setMobileTab('profile'); setCurrentActivity(null); setSelectedCategory(null); }}>
            <span className="xc-bnav-icon">👤</span>
            <span className="xc-bnav-label">Profile</span>
          </button>
          {currentUser?.role === 'admin' && (
            <button className={`xc-bnav-item${mobileTab==='admin'?' active':''}`}
              onClick={() => { setMobileTab('admin'); setShowAdmin(true); }}>
              <span className="xc-bnav-icon">⚙️</span>
              <span className="xc-bnav-label">Admin</span>
            </button>
          )}
        </nav>

        </div>
      </>
    </UIContext.Provider>
  );
};

// Render the app
// ═══════════════════════════════════════════════════════════════════════
// XCELIAS MULTI-USER ENGINE
// Offline (localStorage) + Online (Firebase Realtime Database)
// ═══════════════════════════════════════════════════════════════════════

const XC_MAX_TRAINEES = 35;
const XC_KEYS = {
  currentUser: 'xcCurrentUser',
  accounts:    'xcAccounts',
  adminSetup:  'xcAdminSetup',
  roomJoined:  'xcRoomJoined',
};
const xcRead  = (key, fb=null) => { try { const v=localStorage.getItem(key); return v?JSON.parse(v):fb; } catch{return fb;} };
const xcWrite = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch{} };
const xcGenPassword = () => { const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let p='XC-'; for(let i=0;i<4;i++) p+=c[Math.floor(Math.random()*c.length)]; p+='-'; for(let i=0;i<4;i++) p+=c[Math.floor(Math.random()*c.length)]; return p; };
const xcId = () => Math.random().toString(36).slice(2,10).toUpperCase();
const xcHash = async (s) => { try { const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''); } catch { throw new Error('Secure hashing unavailable — HTTPS required'); } };
const xcDownloadTextFile = (filename, text, type='text/plain') => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
const xcDownloadJsonFile = (filename, data) => xcDownloadTextFile(filename, JSON.stringify(data, null, 2), 'application/json');
const xcReadJsonFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    try { resolve(JSON.parse(reader.result)); }
    catch { reject(new Error('Invalid JSON backup file')); }
  };
  reader.onerror = () => reject(new Error('Failed to read backup file'));
  reader.readAsText(file);
});

const xcCreateFirebaseUser = async (email, password) => {
  const cfg = window.XCELIAS_FB_CONFIG;
  if (!cfg || !cfg.apiKey) throw new Error('Firebase not configured');
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${cfg.apiKey}`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password, returnSecureToken: false })
  });
  const data = await res.json();
  if (data.error) {
    const msg = data.error.message;
    if (msg==='EMAIL_EXISTS') throw new Error('Username already taken');
    throw new Error(msg||'Failed to create account');
  }
  return data.localId;
};

const XC = {
  isOnline: () => !!window.xcFirebaseReady,
  fbEmail:  (u) => `${u.toLowerCase().trim()}@xcelias.internal`,

  // ─── SIGN IN ────────────────────────────────────────
  signIn: async (username, password) => {
    const u = username.toLowerCase().trim();
    if (XC.isOnline()) {
      try {
        const cred = await window.xcAuth.signInWithEmailAndPassword(XC.fbEmail(u), password);
        const snap = await window.xcDB.ref(`users/${cred.user.uid}`).once('value');
        let profile = snap.val();
        if (!profile) {
          /* Auto-create missing DB profile from Firebase Auth user */
          const isAdmin = u === 'admin';
          profile = { username: u, displayName: isAdmin ? 'Admin' : u, role: isAdmin ? 'admin' : 'trainee', batchId: isAdmin ? 'admin' : 'default', createdAt: Date.now() };
          try { await window.xcDB.ref(`users/${cred.user.uid}`).set(profile); } catch {}
        }
        const user = { uid: cred.user.uid, ...profile };
        xcWrite(XC_KEYS.currentUser, user);
        return user;
      } catch(e) {
        if (e.code==='auth/wrong-password'||e.code==='auth/user-not-found'||e.code==='auth/invalid-credential') throw new Error('Invalid username or password');
        throw e;
      }
    }
    // Offline
    const adminSetup = xcRead(XC_KEYS.adminSetup, null);
    if (u === 'admin') {
      if (!adminSetup) throw new Error('Admin not set up yet');
      const hash = await xcHash(password);
      if (hash !== adminSetup.passwordHash) throw new Error('Invalid username or password');
      const user = { uid:'admin_local', username:'admin', displayName:'Admin', role:'admin', batchId:'admin' };
      xcWrite(XC_KEYS.currentUser, user);
      return user;
    }
    const accounts = xcRead(XC_KEYS.accounts, []);
    const account  = accounts.find(a => a.username.toLowerCase() === u);
    if (!account) throw new Error('Invalid username or password');
    const hash = await xcHash(password);
    if (hash !== account.passwordHash) throw new Error('Invalid username or password');
    xcWrite(XC_KEYS.currentUser, account);
    return account;
  },

  signOut: async () => {
    xcWrite(XC_KEYS.currentUser, null);
    xcWrite(XC_KEYS.roomJoined, null);
    if (XC.isOnline()) { try { await window.xcAuth.signOut(); } catch{} }
  },

  currentUser: () => xcRead(XC_KEYS.currentUser, null),
  isAdminSetup: () => XC.isOnline() || !!xcRead(XC_KEYS.adminSetup, null),
  offlineBackupSummary: () => {
    const accounts = xcRead(XC_KEYS.accounts, []);
    const adminSetup = xcRead(XC_KEYS.adminSetup, null);
    return {
      mode: 'offline',
      exportedAt: Date.now(),
      app: 'Xcelias Academy',
      version: 1,
      hasAdmin: !!adminSetup,
      traineeCount: accounts.filter(a => a.role !== 'admin').length,
    };
  },
  exportOfflineBackup: () => ({
    meta: XC.offlineBackupSummary(),
    data: {
      adminSetup: xcRead(XC_KEYS.adminSetup, null),
      accounts: xcRead(XC_KEYS.accounts, []),
    }
  }),
  importOfflineBackup: (backup) => {
    if (!backup || typeof backup !== 'object' || !backup.data) throw new Error('Backup file is missing data');
    const adminSetup = backup.data.adminSetup || null;
    const accounts = Array.isArray(backup.data.accounts) ? backup.data.accounts : [];
    xcWrite(XC_KEYS.adminSetup, adminSetup);
    xcWrite(XC_KEYS.accounts, accounts);
    return {
      hasAdmin: !!adminSetup,
      traineeCount: accounts.filter(a => a.role !== 'admin').length,
    };
  },

  // ─── ADMIN SETUP ────────────────────────────────────
  setupAdmin: async (password) => {
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
    if (XC.isOnline()) {
      try {
        const cred = await window.xcAuth.createUserWithEmailAndPassword(XC.fbEmail('admin'), password);
        const uid = cred.user.uid;
        await window.xcDB.ref(`users/${uid}`).set({ username:'admin', displayName:'Admin', role:'admin', batchId:'admin', createdAt:Date.now() });
        const user = { uid, username:'admin', displayName:'Admin', role:'admin', batchId:'admin' };
        xcWrite(XC_KEYS.currentUser, user);
        return user;
      } catch(e) {
        if (e.code==='auth/email-already-in-use') throw new Error('Admin already set up. Sign in with your admin password.');
        throw e;
      }
    }
    const hash = await xcHash(password);
    xcWrite(XC_KEYS.adminSetup, { passwordHash:hash, createdAt:Date.now() });
    const user = { uid:'admin_local', username:'admin', displayName:'Admin', role:'admin', batchId:'admin' };
    xcWrite(XC_KEYS.currentUser, user);
    return user;
  },

  // ─── ACCOUNTS ───────────────────────────────────────
  listAccounts: async (batchId=null) => {
    if (XC.isOnline()) {
      const userSnap = await window.xcDB.ref('users').once('value');
      const users = userSnap.val() || {};
      const boardSnap = await window.xcDB.ref('leaderboard').once('value');
      const leaderboard = boardSnap.val() || {};
      const all = Object.entries(users).map(([uid, profile]) => {
        const scoreData = profile?.batchId && leaderboard[profile.batchId] ? leaderboard[profile.batchId][uid] : null;
        return { uid, ...profile, ...(scoreData || {}) };
      });
      return batchId ? all.filter(a => a.batchId === batchId) : all;
    }
    const acc = xcRead(XC_KEYS.accounts, []);
    return batchId ? acc.filter(a=>a.batchId===batchId) : acc;
  },

  createTrainee: async ({ displayName, username, password, batchId, batchName, role = 'trainee' }) => {
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');
    const u = username.toLowerCase().trim();
    const resolvedRole = (role === 'agent') ? 'agent' : 'trainee';
    if (XC.isOnline()) {
      const usersSnap = await window.xcDB.ref('users').once('value');
      const users = usersSnap.val() || {};
      const existing = Object.values(users);
      if (existing.find(a => (a.username || '').toLowerCase() === u)) throw new Error('Username already taken');
      if (existing.filter(a => a.batchId === batchId && a.role !== 'admin').length >= XC_MAX_TRAINEES) throw new Error(`Maximum ${XC_MAX_TRAINEES} trainees per batch`);
      const email = XC.fbEmail(u);
      const uid = await xcCreateFirebaseUser(email, password);
      const profile = { username:u, displayName, role:resolvedRole, batchId, batchName, totalScore:0, streak:0, activitiesPlayed:0, rank:'Rookie', lastActive:Date.now(), createdAt:Date.now() };
      await window.xcDB.ref(`users/${uid}`).set(profile);
      await window.xcDB.ref(`leaderboard/${batchId}/${uid}`).set({ displayName, username:u, totalScore:0, streak:0, rank:'Rookie', activitiesPlayed:0, lastActive:Date.now() });
      return { uid, ...profile };
    }
    const accounts = xcRead(XC_KEYS.accounts, []);
    if (accounts.find(a=>a.username.toLowerCase()===u)) throw new Error('Username already taken');
    if (accounts.filter(a=>a.batchId===batchId).length >= XC_MAX_TRAINEES) throw new Error(`Maximum ${XC_MAX_TRAINEES} trainees per batch`);
    const hash = await xcHash(password);
    const uid = `local_${xcId()}`;
    const account = { uid, username:u, displayName, passwordHash:hash, role:resolvedRole, batchId, batchName, totalScore:0, streak:0, activitiesPlayed:0, rank:'Rookie', lastActive:Date.now(), createdAt:Date.now() };
    accounts.push(account);
    xcWrite(XC_KEYS.accounts, accounts);
    return account;
  },

  deleteTrainee: async (uid, batchId) => {
    if (XC.isOnline()) {
      await window.xcDB.ref(`users/${uid}`).remove();
      await window.xcDB.ref(`leaderboard/${batchId}/${uid}`).remove();
      return;
    }
    xcWrite(XC_KEYS.accounts, xcRead(XC_KEYS.accounts,[]).filter(a=>a.uid!==uid));
  },

  // ─── SCORE SYNC ─────────────────────────────────────
  pushScore: (uid, batchId, totalScore, streak, rank, activitiesPlayed) => {
    if (!uid || !batchId || batchId==='admin') return;
    if (XC.isOnline()) {
      window.xcDB.ref(`leaderboard/${batchId}/${uid}`).update({ totalScore, streak, rank, activitiesPlayed, lastActive:Date.now() });
    }
    const accounts = xcRead(XC_KEYS.accounts,[]);
    const idx = accounts.findIndex(a=>a.uid===uid);
    if (idx!==-1) { accounts[idx]={...accounts[idx],totalScore,streak,rank,activitiesPlayed}; xcWrite(XC_KEYS.accounts,accounts); }
  },

  // ─── LEADERBOARD ────────────────────────────────────
  subscribeLeaderboard: (batchId, callback) => {
    if (XC.isOnline() && batchId && batchId!=='admin') {
      const ref = window.xcDB.ref(`leaderboard/${batchId}`);
      ref.on('value', snap => {
        const data = snap.val() || {};
        const list = Object.entries(data).map(([uid,d])=>({uid,...d})).sort((a,b)=>(b.totalScore||0)-(a.totalScore||0));
        callback(list);
      });
      return () => ref.off();
    }
    const poll = () => {
      const accounts = xcRead(XC_KEYS.accounts,[]);
      const filtered = (batchId && batchId!=='admin') ? accounts.filter(a=>a.batchId===batchId) : accounts.filter(a=>a.role!=='admin');
      callback(filtered.slice().sort((a,b)=>(b.totalScore||0)-(a.totalScore||0)));
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  },

  // ─── ROOMS ──────────────────────────────────────────
  createRoom: async (adminUid, batchId, mode) => {
    const code = xcId().slice(0,4) + '-' + xcId().slice(0,4);
    const room = { code, batchId, adminUid, mode:mode||'solo_race', status:'lobby', participants:{}, createdAt:Date.now() };
    if (XC.isOnline()) { await window.xcDB.ref(`rooms/${code}`).set(room); return room; }
    xcWrite(`xcRoom_${code}`, room);
    return room;
  },

  joinRoom: async (code, uid, displayName) => {
    if (XC.isOnline()) {
      const snap = await window.xcDB.ref(`rooms/${code}`).once('value');
      const room = snap.val();
      if (!room) throw new Error('Room not found');
      if (room.status==='ended') throw new Error('This session has already ended');
      await window.xcDB.ref(`rooms/${code}/participants/${uid}`).set({ displayName, score:0, joinedAt:Date.now() });
      xcWrite(XC_KEYS.roomJoined, { code, uid });
      return room;
    }
    const room = xcRead(`xcRoom_${code}`, null);
    if (!room) throw new Error('Room not found');
    xcWrite(XC_KEYS.roomJoined, { code, uid });
    return room;
  },

  subscribeRoom: (code, callback) => {
    if (XC.isOnline()) {
      const ref = window.xcDB.ref(`rooms/${code}`);
      ref.on('value', snap => callback(snap.val()));
      return () => ref.off();
    }
    const poll = () => callback(xcRead(`xcRoom_${code}`,null));
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  },

  updateRoomStatus: async (code, status) => {
    if (XC.isOnline()) await window.xcDB.ref(`rooms/${code}/status`).set(status);
    const room = xcRead(`xcRoom_${code}`, null);
    if (room) xcWrite(`xcRoom_${code}`, { ...room, status });
  },

  updateRoomScore: async (code, uid, score) => {
    if (XC.isOnline()) window.xcDB.ref(`rooms/${code}/participants/${uid}/score`).set(score);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════
const XcLoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showSetup, setShowSetup]   = useState(false);
  const [adminPw, setAdminPw]       = useState('');
  const [adminPw2, setAdminPw2]     = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError]     = useState('');
  const [pwVisible, setPwVisible]   = useState(false);
  const fileInputRef = useRef(null);
  const [adminStatus, setAdminStatus] = useState(() => XC.isOnline() ? 'checking' : (XC.isAdminSetup() ? 'ready' : 'missing'));
  const noAdmin = adminStatus === 'missing';

  useEffect(() => {
    let alive = true;
    if (!XC.isOnline()) {
      setAdminStatus(XC.isAdminSetup() ? 'ready' : 'missing');
      return () => { alive = false; };
    }
    setAdminStatus('checking');
    setSetupError('');
    window.xcAuth.fetchSignInMethodsForEmail(XC.fbEmail('admin'))
      .then((methods) => {
        if (!alive) return;
        setAdminStatus(methods && methods.length ? 'ready' : 'missing');
      })
      .catch((err) => {
        if (!alive) return;
        if (err && err.code === 'auth/operation-not-allowed') {
          setSetupError('Enable Email/Password inside Firebase Authentication before continuing.');
        }
        setAdminStatus('missing');
      });
    return () => { alive = false; };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Enter username and password'); return; }
    setError(''); setLoading(true);
    try { const user = await XC.signIn(username.trim(), password); onLogin(user); }
    catch(err) { setError(err.message || 'Login failed'); }
    setLoading(false);
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    if (adminPw.length < 6) { setSetupError('Password must be at least 6 characters'); return; }
    if (adminPw !== adminPw2) { setSetupError("Passwords don't match"); return; }
    setSetupError(''); setSetupLoading(true);
    try { const user = await XC.setupAdmin(adminPw); onLogin(user); }
    catch(err) {
      const message = err.message || 'Setup failed';
      if (message === 'Admin already set up. Sign in with your admin password.') {
        setAdminStatus('ready');
        setShowSetup(false);
        setUsername('admin');
        setPassword('');
        setAdminPw('');
        setAdminPw2('');
        setError(message);
      } else {
        setSetupError(message);
      }
    }
    setSetupLoading(false);
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError('');
    setSetupError('');
    try {
      const backup = await xcReadJsonFile(file);
      const result = XC.importOfflineBackup(backup);
      const countLabel = result.traineeCount === 1 ? '1 trainee' : `${result.traineeCount} trainees`;
      if (result.hasAdmin) {
        setShowSetup(false);
        setError(`Offline backup imported. Sign in with the admin password from the original device. ${countLabel} restored.`);
      } else {
        setSetupError('Backup imported, but it does not include an admin setup.');
      }
    } catch (err) {
      setError(err.message || 'Import failed');
    }
    e.target.value = '';
  };

  return (
    <div className="xc-login-screen">
      <div className="xc-login-bg">
        <div className="xc-login-orb xc-login-orb--1"></div>
        <div className="xc-login-orb xc-login-orb--2"></div>
        <div className="xc-login-orb xc-login-orb--3"></div>
      </div>
      <div className="xc-login-card">
        <div className="xc-login-logo">
          <div className="xc-login-logo-ring xc-login-logo-ring--outer"></div>
          <div className="xc-login-logo-ring xc-login-logo-ring--inner"></div>
          <div className="xc-login-logo-orb xc-login-logo-orb--1"></div>
          <div className="xc-login-logo-orb xc-login-logo-orb--2"></div>
          <div className="xc-login-logo-orb xc-login-logo-orb--3"></div>
          <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="xc-login-logo-svg">
            <defs><linearGradient id="xlg_login" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stopColor="#667eea"/><stop offset="50%" stopColor="#764ba2"/><stop offset="100%" stopColor="#f093fb"/></linearGradient></defs>
            <rect x="4" y="4" width="48" height="48" rx="14" stroke="url(#xlg_login)" strokeWidth="2.5" fill="none"/>
            <text x="28" y="37" textAnchor="middle" fill="url(#xlg_login)" fontFamily="Montserrat" fontWeight="900" fontSize="26">X</text>
          </svg>
        </div>
        <div className="xc-login-title">
          <span className="xc-login-title-x">Xcelias</span>
          <span className="xc-login-title-sub">Training Academy</span>
        </div>
        {adminStatus === 'checking' ? (
          <div className="xc-login-first-time">
            <p className="xc-login-hint">Checking Firebase admin setup...</p>
            <div className="xc-login-loading" style={{justifyContent:'center'}}><span/><span/><span/></div>
          </div>
        ) : showSetup ? (
          <form onSubmit={handleSetup} className="xc-login-form">
            <p className="xc-login-form-title">Admin Setup</p>
            <div className="xc-login-field">
              <label className="xc-login-label">New Admin Password</label>
              <input type="password" value={adminPw} onChange={e=>setAdminPw(e.target.value)} className="xc-login-input" placeholder="At least 6 characters" minLength={6} autoFocus />
            </div>
            <div className="xc-login-field">
              <label className="xc-login-label">Confirm Password</label>
              <input type="password" value={adminPw2} onChange={e=>setAdminPw2(e.target.value)} className="xc-login-input" placeholder="Repeat password" />
            </div>
            {setupError && <div className="xc-login-error">{setupError}</div>}
            <button type="submit" className="xc-login-btn xc-login-btn--primary" disabled={setupLoading}>
              {setupLoading ? <span className="xc-login-loading"><span/><span/><span/></span> : '✓ Create Admin Account'}
            </button>
            <button type="button" className="xc-login-link" onClick={() => { setShowSetup(false); setSetupError(''); }}>← Back to Login</button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="xc-login-form">
            <div className="xc-login-field">
              <label className="xc-login-label">Username</label>
              <input type="text" value={username} onChange={e=>setUsername(e.target.value)} className="xc-login-input" placeholder="Enter your username" autoCapitalize="none" autoCorrect="off" spellCheck="false" />
            </div>
            <div className="xc-login-field">
              <label className="xc-login-label">Password</label>
              <div className="xc-login-pw-wrap">
                <input type={pwVisible?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="xc-login-input" placeholder="Enter your password" />
                <button type="button" className="xc-login-pw-toggle" onClick={() => setPwVisible(v=>!v)}>{pwVisible?'🙈':'👁'}</button>
              </div>
            </div>
            {error && <div className="xc-login-error">{error}</div>}
            <button type="submit" className="xc-login-btn xc-login-btn--primary" disabled={loading}>
              {loading ? <span className="xc-login-loading"><span/><span/><span/></span> : '⚡ Enter the Academy'}
            </button>
            {noAdmin ? (
              <>
                <p className="xc-login-hint">👋 No Firebase admin exists yet. Create it once on one device, then sign in everywhere else.</p>
                <button type="button" className="xc-login-btn" onClick={() => { setShowSetup(true); setError(''); }}>⚙ Setup Admin Account</button>
              </>
            ) : null}
            {!XC.isOnline() && !noAdmin ? (
              <button type="button" className="xc-login-btn" onClick={() => fileInputRef.current?.click()}>⬆ Import Offline Backup</button>
            ) : null}
            <p className="xc-login-footer-hint">Contact your trainer if you need access</p>
            {!XC.isOnline() && (
              <p className="xc-login-footnote">Without Firebase, each device has its own local admin, trainees, scores, and rooms.</p>
            )}
          </form>
        )}
        {!XC.isOnline() && (
          <div className="xc-login-sync-note">
            <strong>📡 Offline mode</strong><br/>This device is using local storage only. To share the same admin and leaderboard across devices, either configure Firebase or import an offline backup from the original device.
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="application/json,.json" style={{display:'none'}} onChange={handleImportBackup} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════
const XcLeaderboard = ({ currentUser, onClose, embedded=false }) => {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const batchId = currentUser?.batchId;

  useEffect(() => {
    if (!batchId) { setLoading(false); return; }
    setLoading(true);
    const unsub = XC.subscribeLeaderboard(batchId, (list) => { setEntries(list); setLoading(false); });
    return unsub;
  }, [batchId]);

  const getRankEmoji = (i) => i===0?'👑':i===1?'🥈':i===2?'🥉':`#${i+1}`;
  const getStreakColor = (s) => s>=10?'#ff4444':s>=5?'#ff7700':s>=3?'#ffb020':'rgba(152,152,184,0.6)';
  const getBadge = (score) => {
    if (score>=500) return { label:'Legend', color:'#f093fb' };
    if (score>=300) return { label:'Elite',  color:'#667eea' };
    if (score>=150) return { label:'Pro',    color:'#50fa7b' };
    if (score>=60)  return { label:'Operator',color:'#ffb020'};
    return { label:'Rookie', color:'rgba(152,152,184,0.8)' };
  };

  const inner = (
    <>
      <div className="xc-leaderboard__header">
        <div className="xc-leaderboard__title"><span>🏆</span><span>Leaderboard</span></div>
        {!embedded && <button className="xc-modal-close" onClick={onClose}>✕</button>}
      </div>
      {loading ? (
        <div className="xc-leaderboard__loading">
          <div className="xc-loading-dots"><span/><span/><span/></div>
          <p>Loading scores...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="xc-leaderboard__empty">
          <div style={{fontSize:48}}>🎮</div>
          <p>No scores yet. Start playing!</p>
        </div>
      ) : (
        <div className="xc-leaderboard__list">
          {entries.map((entry, idx) => {
            const isMe = entry.uid === currentUser?.uid;
            const badge = getBadge(entry.totalScore || 0);
            return (
              <div key={entry.uid} className={`xc-lb-row${isMe?' xc-lb-row--me':''}${idx<3?' xc-lb-row--top':''}`}>
                <div className="xc-lb-rank"><span className={`xc-lb-rank-num${idx<3?' xc-lb-rank-num--podium':''}`}>{getRankEmoji(idx)}</span></div>
                <div className="xc-lb-avatar">{(entry.displayName||entry.username||'U').charAt(0).toUpperCase()}</div>
                <div className="xc-lb-info">
                  <span className="xc-lb-name">{entry.displayName||entry.username}{isMe&&<span className="xc-lb-you"> (You)</span>}</span>
                  <div className="xc-lb-meta">
                    <span className="xc-lb-badge" style={{color:badge.color}}>{badge.label}</span>
                    {(entry.activitiesPlayed||0)>0 && <span className="xc-lb-acts">{entry.activitiesPlayed} {entry.activitiesPlayed===1?'activity':'activities'}</span>}
                  </div>
                </div>
                <div className="xc-lb-score-col">
                  <div className="xc-lb-score">{(entry.totalScore||0).toLocaleString()}</div>
                  {(entry.streak||0)>0 && <div className="xc-lb-streak" style={{color:getStreakColor(entry.streak)}}>🔥{entry.streak}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!XC.isOnline() && (
        <div className="xc-leaderboard__offline-note">
          📡 Offline mode — scores shown for this device only.<br/>Configure firebase-config.js for real-time sync.
        </div>
      )}
    </>
  );

  if (embedded) return <div className="xc-leaderboard">{inner}</div>;
  return (
    <div className="xc-modal-overlay" onClick={onClose}>
      <div className="xc-leaderboard" onClick={e=>e.stopPropagation()}>{inner}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════
const XcAdminPanel = ({ currentUser, onClose }) => {
  const [tab, setTab]                   = useState('accounts');
  const [accounts, setAccounts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [newName, setNewName]           = useState('');
  const [newUsername, setNewUsername]   = useState('');
  const [newPassword, setNewPassword]   = useState(xcGenPassword);
  const [batchName, setBatchName]       = useState('Batch 1');
  const [batchId, setBatchId]           = useState(() => 'batch_' + Date.now());
  const [addLoading, setAddLoading]     = useState(false);
  const [addError, setAddError]         = useState('');
  const [credentials, setCredentials]   = useState([]);
  const [newRole, setNewRole]           = useState('trainee');
  const [roomMode, setRoomMode]         = useState('solo_race');
  const [createdRoom, setCreatedRoom]   = useState(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [batchFilter, setBatchFilter]   = useState('');
  const importRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const accs = await XC.listAccounts();
        setAccounts(accs);
        const firstBatch = accs.find(a => a.batchId && a.batchId !== 'admin' && a.role !== 'admin');
        if (firstBatch) { setBatchId(firstBatch.batchId); setBatchName(firstBatch.batchName || firstBatch.batchId); }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const batches = useMemo(() => {
    const map = {};
    for (const a of accounts) {
      if (!a.batchId || a.batchId==='admin') continue;
      if (!map[a.batchId]) map[a.batchId] = { id:a.batchId, name:a.batchName||a.batchId, trainees:[] };
      map[a.batchId].trainees.push(a);
    }
    return Object.values(map);
  }, [accounts]);

  const currentBatch = accounts.filter(a => a.batchId===batchId && a.role!=='admin');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim()) { setAddError('Name and username are required'); return; }
    setAddError(''); setAddLoading(true);
    try {
      const trainee = await XC.createTrainee({ displayName:newName.trim(), username:newUsername.trim(), password:newPassword, batchId, batchName, role:newRole });
      setAccounts(p => [...p, trainee]);
      setCredentials(p => [...p, { name:newName.trim(), username:newUsername.trim().toLowerCase(), password:newPassword, role:newRole }]);
      setNewName(''); setNewUsername(''); setNewPassword(xcGenPassword()); setNewRole('trainee'); setShowAddForm(false);
    } catch(err) { setAddError(err.message||'Failed to create account'); }
    setAddLoading(false);
  };

  const handleDelete = async (uid, bid) => {
    if (!window.confirm('Delete this account? This cannot be undone.')) return;
    await XC.deleteTrainee(uid, bid);
    setAccounts(p => p.filter(a=>a.uid!==uid));
  };

  const handleCreateRoom = async () => {
    setCreatingRoom(true);
    try { setCreatedRoom(await XC.createRoom(currentUser.uid, batchId||'all', roomMode)); }
    catch(err) { alert(err.message); }
    setCreatingRoom(false);
  };

  const handleExportBackup = () => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    xcDownloadJsonFile(`xcelias-offline-backup-${stamp}.json`, XC.exportOfflineBackup());
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const backup = await xcReadJsonFile(file);
      XC.importOfflineBackup(backup);
      setAccounts(await XC.listAccounts());
      setCredentials([]);
      alert('Offline backup imported on this device.');
    } catch (err) {
      alert(err.message || 'Import failed');
    }
    e.target.value = '';
  };

  const displayAccounts = batchFilter ? accounts.filter(a=>a.batchId===batchFilter&&a.role!=='admin') : currentBatch;

  return (
    <div className="xc-modal-overlay">
      <div className="xc-admin-panel" onClick={e=>e.stopPropagation()}>
        <div className="xc-admin-header">
          <div className="xc-admin-title"><span className="xc-admin-badge">ADMIN</span><span>Control Center</span></div>
          <button className="xc-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="xc-admin-tabs">
          {[{id:'accounts',label:'👥 Accounts',count:accounts.filter(a=>a.role!=='admin').length},{id:'rooms',label:'🎮 Rooms'},{id:'scores',label:'📊 Scores'}].map(t => (
            <button key={t.id} className={`xc-admin-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
              {t.label}{t.count!==undefined&&<span className="xc-tab-count">{t.count}</span>}
            </button>
          ))}
        </div>

        <div className="xc-admin-body">
          {tab === 'accounts' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="xc-admin-row">
                <div className="xc-admin-field">
                  <label className="xc-admin-label">Active Batch Name</label>
                  <input type="text" value={batchName} onChange={e=>setBatchName(e.target.value)} className="xc-admin-input" placeholder="e.g., Batch 12 — March 2026" />
                </div>
                <div className="xc-admin-stat" style={{textAlign:'right',justifyContent:'flex-end',paddingBottom:6}}>
                  <span className="xc-admin-stat-num">{currentBatch.length}</span>
                  <span className="xc-admin-stat-label">/ {XC_MAX_TRAINEES}</span>
                </div>
              </div>

              {batches.length > 1 && (
                <div className="xc-admin-field">
                  <label className="xc-admin-label">View Batch</label>
                  <select className="xc-admin-input" value={batchFilter} onChange={e=>setBatchFilter(e.target.value)}>
                    <option value="">Current batch ({batchName})</option>
                    {batches.map(b=><option key={b.id} value={b.id}>{b.name} ({b.trainees.length})</option>)}
                  </select>
                </div>
              )}

              <div className="xc-admin-trainee-list">
                {loading ? <div className="xc-loading-center"><div className="xc-loading-dots"><span/><span/><span/></div></div>
                : displayAccounts.length === 0 ? (
                  <div className="xc-admin-empty"><div style={{fontSize:36}}>👥</div><p>No trainees yet in this batch.<br/>Add up to {XC_MAX_TRAINEES}.</p></div>
                ) : displayAccounts.map(t => (
                  <div key={t.uid} className="xc-admin-trainee-card">
                    <div className="xc-trainee-avatar">{(t.displayName||t.username).charAt(0).toUpperCase()}</div>
                    <div className="xc-trainee-info">
                      <span className="xc-trainee-name">{t.displayName}</span>
                      <span className="xc-trainee-username">@{t.username}</span>
                      {t.role==='agent'&&<span style={{fontSize:10,fontWeight:800,color:'#a78bfa',display:'block',marginTop:2}}>🏠 Agent</span>}
                    </div>
                    <div className="xc-trainee-score">⭐ {(t.totalScore||0).toLocaleString()}</div>
                    <button className="xc-trainee-delete" onClick={()=>handleDelete(t.uid,t.batchId)} title="Delete">🗑</button>
                  </div>
                ))}
              </div>

              {!XC.isOnline() && (
                <div className="xc-sync-box">
                  <div className="xc-sync-box__title">Offline Sync Between Devices</div>
                  <p className="xc-sync-box__text">This app is still local-only. Export a backup from this device, then import it on the other device so it gets the same admin setup and trainee accounts.</p>
                  <div className="xc-sync-box__actions">
                    <button className="xc-admin-btn" onClick={handleExportBackup}>⬇ Export Device Backup</button>
                    <button className="xc-admin-btn" onClick={() => importRef.current?.click()}>⬆ Import Device Backup</button>
                  </div>
                  <div className="xc-sync-box__hint">For live multi-device sync, fill in firebase-config.js once and redeploy the app.</div>
                  <input ref={importRef} type="file" accept="application/json,.json" style={{display:'none'}} onChange={handleImportBackup} />
                </div>
              )}

              {currentBatch.length < XC_MAX_TRAINEES && (
                showAddForm ? (
                  <form onSubmit={handleAdd} className="xc-add-trainee-form">
                    <div className="xc-admin-field">
                      <label className="xc-admin-label">Full Name</label>
                      <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} className="xc-admin-input" placeholder="e.g., Ahmed Hassan" autoFocus />
                    </div>
                    <div className="xc-admin-row">
                      <div className="xc-admin-field">
                        <label className="xc-admin-label">Username</label>
                        <input type="text" value={newUsername} onChange={e=>setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} className="xc-admin-input" placeholder="Ahmed01" />
                      </div>
                      <div className="xc-admin-field">
                        <label className="xc-admin-label">Password</label>
                        <div style={{display:'flex',gap:8}}>
                          <input type="text" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="xc-admin-input" style={{flex:1}} />
                          <button type="button" className="xc-admin-gen-btn" onClick={()=>setNewPassword(xcGenPassword())} title="Generate">🔄</button>
                        </div>
                      </div>
                    </div>
                    <div className="xc-admin-field">
                      <label className="xc-admin-label">Role</label>
                      <select value={newRole} onChange={e=>setNewRole(e.target.value)} className="xc-admin-input">
                        <option value="trainee">🎓 Trainee — Activities only</option>
                        <option value="agent">🏠 Agent — Activities + Website</option>
                      </select>
                    </div>
                    {addError && <div className="xc-login-error">{addError}</div>}
                    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                      <button type="submit" className="xc-admin-btn xc-admin-btn--primary" disabled={addLoading}>{addLoading?'⏳...':'✓ Create Account'}</button>
                      <button type="button" className="xc-admin-btn" onClick={()=>{setShowAddForm(false);setAddError('');}}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button className="xc-admin-btn xc-admin-btn--add" onClick={()=>setShowAddForm(true)}>
                    + Add Trainee ({XC_MAX_TRAINEES - currentBatch.length} slots left)
                  </button>
                )
              )}

              {credentials.length > 0 && (
                <div className="xc-credentials-box">
                  <div className="xc-credentials-header">
                    <span>📋 New Credentials — save before closing</span>
                    <button className="xc-admin-btn xc-admin-btn--small" onClick={() => {
                      const text = credentials.map(c=>`Name: ${c.name}\nUsername: ${c.username}\nPassword: ${c.password}\n`).join('\n---\n');
                      xcDownloadTextFile('xcelias_credentials.txt', text);
                    }}>⬇ Export</button>
                  </div>
                  {credentials.map((c,i) => (
                    <div key={i} className="xc-credential-row">
                      <span className="xc-cred-name">{c.name}</span>
                      <span className="xc-cred-user">@{c.username}</span>
                      <code className="xc-cred-pw">{c.password}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'rooms' && (
            <div className="xc-admin-room-create">
              <h3 className="xc-admin-section-title">Create Classroom Session</h3>
              <div className="xc-room-modes">
                {[{id:'solo_race',label:'🏃 Solo Race',desc:'Everyone plays independently, ranked by score'},{id:'team_battle',label:'⚔️ Team Battle',desc:'Teams compete for highest combined score'}].map(m => (
                  <div key={m.id} className={`xc-room-mode-card${roomMode===m.id?' active':''}`} onClick={()=>setRoomMode(m.id)}>
                    <div className="xc-room-mode-label">{m.label}</div>
                    <div className="xc-room-mode-desc">{m.desc}</div>
                  </div>
                ))}
              </div>
              <button className="xc-admin-btn xc-admin-btn--primary xc-admin-btn--large" onClick={handleCreateRoom} disabled={creatingRoom}>
                {creatingRoom ? '⏳ Creating...' : '🎮 Create Room'}
              </button>
              {createdRoom && (
                <div className="xc-room-created-card">
                  <div className="xc-room-created-label">Room Created!</div>
                  <div className="xc-room-code">{createdRoom.code}</div>
                  <p className="xc-room-code-hint">Share this code with trainees to join</p>
                  <button className="xc-admin-btn xc-admin-btn--danger" onClick={async()=>{ await XC.updateRoomStatus(createdRoom.code,'ended'); setCreatedRoom(null); }}>End Session</button>
                </div>
              )}
            </div>
          )}

          {tab === 'scores' && (
            <div className="xc-admin-scores">
              <XcLeaderboard currentUser={{ ...currentUser, batchId: batchFilter||batchId }} onClose={()=>{}} embedded={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ROOM JOIN + LOBBY
// ═══════════════════════════════════════════════════════════════════════
const XcRoomPanel = ({ currentUser, onClose }) => {
  const [code, setCode]         = useState('');
  const [joining, setJoining]   = useState(false);
  const [error, setError]       = useState('');
  const [joinedRoom, setJoinedRoom] = useState(() => xcRead(XC_KEYS.roomJoined, null));
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    if (!joinedRoom?.code) return;
    const unsub = XC.subscribeRoom(joinedRoom.code, data => setRoomData(data));
    return unsub;
  }, [joinedRoom]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(''); setJoining(true);
    try {
      await XC.joinRoom(code.trim().toUpperCase(), currentUser.uid, currentUser.displayName||currentUser.username);
      setJoinedRoom({ code: code.trim().toUpperCase(), uid: currentUser.uid });
    } catch(err) { setError(err.message||'Room not found'); }
    setJoining(false);
  };

  const leave = () => { xcWrite(XC_KEYS.roomJoined, null); setJoinedRoom(null); setRoomData(null); onClose(); };

  if (joinedRoom && roomData) {
    const sorted = Object.values(roomData.participants||{}).sort((a,b)=>(b.score||0)-(a.score||0));
    return (
      <div className="xc-modal-overlay" onClick={onClose}>
        <div className="xc-room-lobby" onClick={e=>e.stopPropagation()}>
          <div className="xc-room-lobby-header">
            <div>
              <div className="xc-room-lobby-title">Live Session</div>
              <div className="xc-room-lobby-code">Room: {joinedRoom.code}</div>
            </div>
            <div className={`xc-room-status xc-room-status--${roomData.status}`}>
              {roomData.status==='lobby'?'⏳ Waiting...':roomData.status==='active'?'🔴 LIVE':'✓ Ended'}
            </div>
          </div>
          <div className="xc-room-participants">
            <div className="xc-room-section-title">{sorted.length} connected</div>
            {sorted.map((p,i) => (
              <div key={p.joinedAt||i} className="xc-room-participant">
                <span className="xc-room-p-rank">{i+1}</span>
                <span className="xc-room-p-avatar">{(p.displayName||'U').charAt(0)}</span>
                <span className="xc-room-p-name">{p.displayName}</span>
                <span className="xc-room-p-score">⭐ {p.score||0}</span>
              </div>
            ))}
          </div>
          <div style={{padding:'16px 20px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            <button className="xc-admin-btn" onClick={leave}>Leave Room</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="xc-modal-overlay" onClick={onClose}>
      <div className="xc-room-join" onClick={e=>e.stopPropagation()}>
        <div className="xc-room-join-header">
          <span className="xc-room-join-icon">🎮</span>
          <div>
            <div className="xc-room-join-title">Join Classroom Room</div>
            <div className="xc-room-join-hint">Enter the code shown by your trainer</div>
          </div>
          <button className="xc-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleJoin} className="xc-room-join-form">
          <input type="text" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} className="xc-room-code-input" placeholder="XXXX-XXXX" maxLength={9} autoFocus />
          {error && <div className="xc-login-error">{error}</div>}
          <button type="submit" className="xc-login-btn xc-login-btn--primary" disabled={joining}>
            {joining ? <span className="xc-login-loading"><span/><span/><span/></span> : '🚀 Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

