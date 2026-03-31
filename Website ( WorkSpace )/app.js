if (!window.gsap) {
    const noopTimeline = {
        to() { return this; },
        fromTo() { return this; },
        set() { return this; },
        add() { return this; }
    };

    window.gsap = {
        registerPlugin() {},
        to() {},
        from() {},
        fromTo() {},
        set() {},
        timeline() { return Object.create(noopTimeline); }
    };
}

if (window.gsap && typeof window.gsap.registerPlugin === 'function') {
    // P5: ScrollTrigger removed — never used
}

// P5: Inline SVG icon strings (replaces Font Awesome — saves ~294KB)
const XI = {
    heart:      '<svg class="xi" viewBox="0 0 512 512"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>',
    heartEmpty: '<svg class="xi" viewBox="0 0 512 512"><path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144C158.6 37.9 198.9 47 231 69.6c9 6.3 17.3 13.8 25 22.3c7.7-8.5 16-16 25-22.3c32.1-22.6 72.4-31.7 111.8-24.2C461.5 59.6 512 117.2 512 189.5v3.3c0 41.9-17.4 81.9-48.1 110.4L287.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9z"/></svg>',
    tag:        '<svg class="xi" viewBox="0 0 448 512"><path d="M0 80V229.5c0 17 6.7 33.3 18.7 45.3l176 176c25 25 65.5 25 90.5 0L418.7 317.3c25-25 25-65.5 0-90.5l-176-176C230.8 38.7 214.5 32 197.5 32H48C21.5 32 0 53.5 0 80zm112 32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>',
    creditCard: '<svg class="xi" viewBox="0 0 576 512"><path d="M64 32C28.7 32 0 60.7 0 96v32h576V96c0-35.3-28.7-64-64-64H64zM576 224H0v192c0 35.3 28.7 64 64 64h448c35.3 0 64-28.7 64-64V224zM112 352h64c8.8 0 16 7.2 16 16s-7.2 16-16 16h-64c-8.8 0-16-7.2-16-16s7.2-16 16-16zm112 16c0-8.8 7.2-16 16-16h128c8.8 0 16 7.2 16 16s-7.2 16-16 16H240c-8.8 0-16-7.2-16-16z"/></svg>',
    whatsapp:   '<svg class="xi" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.8-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5.1-3.9-10.6-6.9z"/></svg>',
    route:      '<svg class="xi" viewBox="0 0 512 512"><path d="M512 96c0 50.2-59.1 125.1-84.6 155c-3.8 4.4-9.4 6.1-14.5 5H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c53 0 96 43 96 96s-43 96-96 96H139.6c8.7-9.9 19.3-22.6 29.9-36.5C194.5 444.4 224 382.2 224 320c0-17.7-14.3-32-32-32H96c-17.7 0-32-14.3-32-32s14.3-32 32-32h96c53 0 96-43 96-96s-43-96-96-96H52.5c25.5-29.9 84.6-104.8 84.6-155C137.1 14.3 170.7 0 192 0s105 45.8 105 96H512z"/></svg>',
    codeBranch: '<svg class="xi" viewBox="0 0 448 512"><path d="M80 104a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm80-24c0 32.8-19.7 61-48 73.3v87.8c18.8-10.9 40.7-17.1 64-17.1h96c35.3 0 64-28.7 64-64v-6.7C307.7 141 288 112.8 288 80c0-44.2 35.8-80 80-80s80 35.8 80 80c0 32.8-19.7 61-48 73.3V160c0 70.7-57.3 128-128 128H176c-35.3 0-64 28.7-64 64v6.7c28.3 12.3 48 40.5 48 73.3c0 44.2-35.8 80-80 80s-80-35.8-80-80c0-32.8 19.7-61 48-73.3V153.3C19.7 141 0 112.8 0 80 0 35.8 35.8 0 80 0s80 35.8 80 80zM368 56a24 24 0 1 0 0 48 24 24 0 1 0 0-48zM80 408a24 24 0 1 0 0 48 24 24 0 1 0 0-48z"/></svg>',
};

// Initialize global data containers to prevent crashes before data.js loads
window.projects = window.projects || [];
window.projectDetails = window.projectDetails || {};

// Production site base URL for QR codes in PDFs (update when deployed)
const SITE_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'https://xcelias.com'
    : (window.location.origin + window.location.pathname).replace(/\/$/, '');

// Canonical developer tier lists (used by scoring, investment, and AI systems)
const PREMIUM_DEVS = ["emaar", "ora", "sodic", "tatweer misr", "palm hills"];
const STRONG_DEVS = ["mountain view", "hassan allam", "orascom", "hyde park", "city edge", "al ahly sabbour"];
const GOOD_DEVS = ["lmd", "inertia", "marakez", "misr italia", "cairo capital", "memaar al morshedy"];

// Apply active category filter (delivered / construction / chalets / villas)
function applyActiveFilter(projects) {
    if (typeof activeFilter === 'undefined' || activeFilter === 'all') return projects;
    return projects.filter(p => {
        const details = (window.projectDetails || {})[p.name] || {};
        const status = (details.status || "").toLowerCase();
        const type = (details.unitTypes || "").toLowerCase();
        if (activeFilter === 'delivered') return status.includes('delivered') || status.includes('ready');
        if (activeFilter === 'construction') return status.includes('construction');
        if (activeFilter === 'chalets') return type.includes('chalets');
        if (activeFilter === 'villas') return type.includes('villas');
        return true;
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// LAZY-LOAD UTILITY — Load scripts/CSS on demand
// ═══════════════════════════════════════════════════════════════════════════
const _lazyCache = {};
function lazyLoadScript(url) {
    if (_lazyCache[url]) return _lazyCache[url];
    _lazyCache[url] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load: ' + url));
        document.head.appendChild(s);
    });
    return _lazyCache[url];
}
function lazyLoadCSS(url) {
    if (_lazyCache[url]) return _lazyCache[url];
    _lazyCache[url] = new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = resolve;
        document.head.appendChild(link);
    });
    return _lazyCache[url];
}

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 INTERNATIONALIZATION (i18n) SYSTEM - Arabic/English Toggle
// ═══════════════════════════════════════════════════════════════════════════
const i18n = {
    currentLang: localStorage.getItem('appLanguage') || 'en',
    
    translations: {
        en: {
            // Header & Navigation
            searchPlaceholder: "Ask AI Concierge (e.g., 'Villas in Sahel with 8 years')",
            
            // Filter Buttons
            filterAll: "All",
            filterDelivered: "Delivered",
            filterConstruction: "Under Construction",
            filterChalets: "Chalets",
            filterVillas: "Villas",
            
            // View Toggle
            viewLabel: "View:",
            clusterView: "Cluster View",
            normalView: "Normal View",
            
            // Mode Switcher
            byZone: "By Zone",
            byDeveloper: "By Developer",
            favorites: "Favorites",
            
            // Zones
            zoneNorthCoast: "North Coast",
            zoneSokhna: "Ain Sokhna",
            zoneGouna: "El Gouna",
            zoneCapital: "New Capital",
            zoneOctober: "6th of October",
            zoneNewCairo: "New Cairo",
            
            // Legend
            legendTitle: "Project Types",
            legendResidential: "Residential",
            legendCoastal: "Coastal",
            legendCommercial: "Commercial",
            
            // Loading
            loadingMap: "Loading Map...",
            
            // Tour
            startTour: "Start Tour",
            stopTour: "Stop Tour",
            
            // Amenities
            amenityGolf: "Golf",
            amenitySeaView: "Sea View",
            amenityNightlife: "Nightlife",
            amenityKids: "Kids Area",
            
            // Favorites
            noFavorites: "No favorites yet. Click the ♡ on any project to save it here.",
            
            // Modal
            modalOverview: "Overview",
            modalMasterplan: "Masterplan",
            modalLayouts: "Layouts",
            modalDescription: "Description",
            modalPrice: "Price Range",
            modalUnitTypes: "Unit Types",
            modalAreas: "Areas / Sizes",
            modalPaymentPlan: "Payment Plan",
            modalStatus: "Status",
            modalAmenities: "Amenities",
            modalLandmarks: "Nearby Landmarks (within 10km)",
            noMasterplan: "No Masterplan Available",
            noLayouts: "No Layouts Available",
            paymentCalculator: "PAYMENT CALCULATOR",
            totalPrice: "Total Unit Price (EGP)",
            interestRate: "Interest Rate (%)",
            downPayment: "Down Payment",
            installmentDuration: "Installment Duration",
            downPaymentAmount: "Down Payment Amount",
            monthlyInstallment: "Monthly Installment",
            aiInsights: "AI INVESTMENT INSIGHTS",
            opportunityScore: "Golden Opportunity Score",
            projAppreciation: "Proj. Appreciation (5Y)",
            estRentalYield: "Est. Rental Yield",
            downloadPdf: "Download PDF",
            whatsappDetails: "WhatsApp Details",
            projectData: "Project Data",
            calculatorLabel: "Calculator",
            aiInsightsLabel: "AI Insights",
            aiInvestmentInsights: "AI INVESTMENT INSIGHTS",
            goldenOpportunityScore: "Golden Opportunity Score",
            calcUnitPrice: "Total Unit Price (EGP)",
            calcInterestRate: "Interest Rate (%)",
            calcDownPayment: "Down Payment",
            calcInstallmentDuration: "Installment Duration",
            
            // Comparison
            compareNow: "Compare Now",
            projectComparison: "Project Comparison",
            feature: "Feature",
            developer: "Developer",
            location: "Location",
            minArea: "Min Area",
            installments: "Installments",
            
            // Chat
            askRita: "Ask RITA",
            readyToHelp: "Ready to help you",
            clearChat: "Clear Chat",
            closeChat: "Close Chat",
            chatPlaceholder: "Ask me anything...",
            
            // No Results
            noProjectsFound: "No projects found",
            tryAdjusting: "Try adjusting your search or filters",
            
            // Popup
            addToCompare: "Add to Compare",
            
            // Years
            years: "Years",
            
            // Recently Viewed
            recentlyViewed: "Recently Viewed",
            clearRecent: "Clear",
            removeRecent: "Remove",
            
            // Price Alerts
            priceAlerts: "Price Alerts",
            noAlerts: "No price alerts set",
            noAlertsHint: "Set alerts on projects to get notified when prices drop",
            targetPrice: "Target Price",
            currentPrice: "Current Price",
            alertTriggered: "Price Reached!",
            alertActive: "Monitoring",
            alertCreated: "Price alert created!",
            removeAlert: "Remove Alert",
            confirmClearAlerts: "Are you sure you want to clear all alerts?",
            setAlert: "Set Price Alert",
            setPriceAlert: "Set Price Alert",
            enterTargetPrice: "Enter your target price (EGP)",
            save: "Save",
            cancel: "Cancel",
            
            // Advanced Filters
            advancedFilters: "Advanced Filters",
            priceRange: "Price Range (EGP)",
            areaRange: "Area Range (m²)",
            bedrooms: "Bedrooms",
            maxDownPayment: "Max Down Payment",
            minInstallments: "Min Installment Years",
            applyFilters: "Apply Filters",
            resetFilters: "Reset",
            any: "Any"
        },
        ar: {
            // Header & Navigation
            searchPlaceholder: "اسأل ريتا (مثال: 'فيلات في الساحل بتقسيط 8 سنين')",
            
            // Filter Buttons
            filterAll: "الكل",
            filterDelivered: "تم التسليم",
            filterConstruction: "تحت الإنشاء",
            filterChalets: "شاليهات",
            filterVillas: "فيلات",
            
            // View Toggle
            viewLabel: "العرض:",
            clusterView: "عرض مجمع",
            normalView: "عرض عادي",
            
            // Mode Switcher
            byZone: "حسب المنطقة",
            byDeveloper: "حسب المطور",
            favorites: "المفضلة",
            
            // Zones
            zoneNorthCoast: "الساحل الشمالي",
            zoneSokhna: "العين السخنة",
            zoneGouna: "الجونة",
            zoneCapital: "العاصمة الإدارية",
            zoneOctober: "6 أكتوبر",
            zoneNewCairo: "القاهرة الجديدة",
            
            // Legend
            legendTitle: "أنواع المشاريع",
            legendResidential: "سكني",
            legendCoastal: "ساحلي",
            legendCommercial: "تجاري",
            
            // Loading
            loadingMap: "جاري تحميل الخريطة...",
            
            // Tour
            startTour: "بدء الجولة",
            stopTour: "إيقاف الجولة",
            
            // Amenities
            amenityGolf: "جولف",
            amenitySeaView: "إطلالة بحر",
            amenityNightlife: "حياة ليلية",
            amenityKids: "منطقة أطفال",
            
            // Favorites
            noFavorites: "لا توجد مفضلات بعد. اضغط على ♡ في أي مشروع لحفظه هنا.",
            
            // Modal
            modalOverview: "نظرة عامة",
            modalMasterplan: "المخطط الرئيسي",
            modalLayouts: "المخططات",
            modalDescription: "الوصف",
            modalPrice: "نطاق الأسعار",
            modalUnitTypes: "أنواع الوحدات",
            modalAreas: "المساحات",
            modalPaymentPlan: "خطة السداد",
            modalStatus: "الحالة",
            modalAmenities: "المرافق",
            modalLandmarks: "المعالم القريبة (في نطاق 10 كم)",
            noMasterplan: "لا يوجد مخطط رئيسي",
            noLayouts: "لا توجد مخططات",
            paymentCalculator: "حاسبة الأقساط",
            totalPrice: "إجمالي سعر الوحدة (جنيه)",
            interestRate: "نسبة الفائدة (%)",
            downPayment: "المقدم",
            installmentDuration: "مدة التقسيط",
            downPaymentAmount: "قيمة المقدم",
            monthlyInstallment: "القسط الشهري",
            aiInsights: "تحليلات الاستثمار الذكية",
            opportunityScore: "نقاط الفرصة الذهبية",
            projAppreciation: "الارتفاع المتوقع (5 سنوات)",
            estRentalYield: "العائد الإيجاري المتوقع",
            downloadPdf: "تحميل PDF",
            whatsappDetails: "تفاصيل واتساب",
            projectData: "بيانات المشروع",
            calculatorLabel: "الحاسبة",
            aiInsightsLabel: "تحليلات ذكية",
            aiInvestmentInsights: "تحليلات الاستثمار الذكية",
            goldenOpportunityScore: "نقاط الفرصة الذهبية",
            calcUnitPrice: "إجمالي سعر الوحدة (جنيه)",
            calcInterestRate: "نسبة الفائدة (%)",
            calcDownPayment: "المقدم",
            calcInstallmentDuration: "مدة التقسيط",
            
            // Comparison
            compareNow: "قارن الآن",
            projectComparison: "مقارنة المشاريع",
            feature: "الميزة",
            developer: "المطور",
            location: "الموقع",
            minArea: "أقل مساحة",
            installments: "التقسيط",
            
            // Chat
            askRita: "اسأل ريتا",
            readyToHelp: "جاهزة لمساعدتك",
            clearChat: "مسح المحادثة",
            closeChat: "إغلاق المحادثة",
            chatPlaceholder: "اسألني أي حاجة...",
            
            // No Results
            noProjectsFound: "لا توجد مشاريع",
            tryAdjusting: "حاول تعديل البحث أو الفلاتر",
            
            // Popup
            addToCompare: "إضافة للمقارنة",
            
            // Years
            years: "سنوات",
            
            // Recently Viewed
            recentlyViewed: "شوهد مؤخراً",
            clearRecent: "مسح",
            removeRecent: "إزالة",
            
            // Price Alerts
            priceAlerts: "تنبيهات الأسعار",
            noAlerts: "لا توجد تنبيهات",
            noAlertsHint: "قم بتعيين تنبيهات للمشاريع للإشعار عند انخفاض الأسعار",
            targetPrice: "السعر المستهدف",
            currentPrice: "السعر الحالي",
            alertTriggered: "تم الوصول للسعر!",
            alertActive: "جاري المراقبة",
            alertCreated: "تم إنشاء التنبيه!",
            removeAlert: "إزالة التنبيه",
            confirmClearAlerts: "هل أنت متأكد من مسح جميع التنبيهات؟",
            setAlert: "تعيين تنبيه",
            setPriceAlert: "تعيين تنبيه السعر",
            enterTargetPrice: "أدخل السعر المستهدف (جنيه)",
            save: "حفظ",
            cancel: "إلغاء",
            
            // Advanced Filters
            advancedFilters: "فلاتر متقدمة",
            priceRange: "نطاق السعر (جنيه)",
            areaRange: "نطاق المساحة (م²)",
            bedrooms: "غرف النوم",
            maxDownPayment: "أقصى مقدم",
            minInstallments: "أقل سنوات تقسيط",
            applyFilters: "تطبيق الفلاتر",
            resetFilters: "إعادة ضبط",
            any: "أي"
        }
    },
    
    // Get translation
    t(key) {
        return this.translations[this.currentLang][key] || this.translations['en'][key] || key;
    },
    
    // Set language
    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('appLanguage', lang);
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        this.updateUI();
    },
    
    // Toggle between languages
    toggle() {
        this.setLanguage(this.currentLang === 'en' ? 'ar' : 'en');
    },
    
    // Update all UI elements with translations
    updateUI() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[this.currentLang][key]) {
                el.textContent = this.t(key);
            }
        });
        
        // Update elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (this.translations[this.currentLang][key]) {
                el.placeholder = this.t(key);
            }
        });
        
        // Update language toggle button
        const langIcon = document.getElementById('lang-icon');
        if (langIcon) {
            langIcon.textContent = this.currentLang === 'en' ? 'AR' : 'EN';
        }
        
        // Update RITA chatbot
        this.updateChatbot();
        
        // Update Recently Viewed section
        if (typeof RecentlyViewed !== 'undefined') {
            RecentlyViewed.render();
        }
        
        // Trigger re-render if projects loaded
        if (window.projects && window.projects.length > 0) {
            // Re-apply filter to update any dynamic content
            if (typeof filterProjects === 'function') {
                filterProjects();
            }
        }
    },
    
    // Update chatbot elements
    updateChatbot() {
        const toggleLabel = document.querySelector('.ai-toggle-label');
        if (toggleLabel) {
            toggleLabel.textContent = this.currentLang === 'ar' ? '✨ اسأل ريتا' : '✨ Ask RITA';
        }
        
        const statusText = document.querySelector('.ai-status');
        if (statusText) {
            statusText.innerHTML = `<span class="ai-status-dot"></span> ${this.t('readyToHelp')}`;
        }
        
        const chatInput = document.getElementById('aiChatInput');
        if (chatInput) {
            chatInput.placeholder = this.t('chatPlaceholder');
        }
    },
    
    // Initialize on page load
    init() {
        // Set initial language attributes
        document.documentElement.setAttribute('lang', this.currentLang);
        document.documentElement.setAttribute('dir', this.currentLang === 'ar' ? 'rtl' : 'ltr');
        
        // Update UI after a short delay to ensure DOM is ready
        setTimeout(() => this.updateUI(), 100);
    }
};

// Language toggle function (called from HTML)
function toggleLanguage() {
    i18n.toggle();
}

// Initialize i18n on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});

// ═══════════════════════════════════════════════════════════════════════════
// 🕐 RECENTLY VIEWED SYSTEM - Track and display recently viewed projects
// ═══════════════════════════════════════════════════════════════════════════
const RecentlyViewed = {
    storageKey: 'recentlyViewedProjects',
    maxItems: 8,
    
    // Get recently viewed from localStorage
    get() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('Error reading recently viewed:', e);
            return [];
        }
    },
    
    // Add a project to recently viewed
    add(project) {
        if (!project || !project.name) return;
        
        let recent = this.get();
        
        // Create a minimal project object for storage
        const recentProject = {
            name: project.name,
            dev: project.dev || '',
            zone: project.zone || '',
            lat: project.lat,
            lng: project.lng,
            status: project.status || '',
            unitTypes: project.unitTypes || '',
            timestamp: Date.now()
        };
        
        // Remove if already exists (will be re-added at top)
        recent = recent.filter(p => p.name !== project.name);
        
        // Add to beginning
        recent.unshift(recentProject);
        
        // Limit to maxItems
        if (recent.length > this.maxItems) {
            recent = recent.slice(0, this.maxItems);
        }
        
        // Save to localStorage
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(recent));
        } catch (e) {
            console.warn('Error saving recently viewed:', e);
        }
        
        // Update UI
        this.render();
    },
    
    // Clear all recently viewed
    clear() {
        localStorage.removeItem(this.storageKey);
        this.render();
    },
    
    // Remove a specific project
    remove(projectName) {
        let recent = this.get();
        recent = recent.filter(p => p.name !== projectName);
        localStorage.setItem(this.storageKey, JSON.stringify(recent));
        this.render();
    },
    
    // Render the recently viewed section
    render() {
        const container = document.getElementById('recently-viewed-list');
        const section = document.getElementById('recently-viewed-section');
        if (!container || !section) return;
        
        const recent = this.get();
        
        if (recent.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        
        container.innerHTML = recent.map((proj, index) => `
            <div class="recent-item" onclick="openRecentProject('${proj.name.replace(/'/g, "\\'")}')" role="button" tabindex="0">
                <div class="recent-item-info">
                    <div class="recent-item-name">${proj.name}</div>
                    <div class="recent-item-meta">
                        ${proj.dev ? `<span class="recent-dev">${proj.dev}</span>` : ''}
                        ${proj.zone ? `<span class="recent-zone">${proj.zone}</span>` : ''}
                    </div>
                </div>
                <button class="recent-item-remove" onclick="event.stopPropagation(); RecentlyViewed.remove('${proj.name.replace(/'/g, "\\'")}')" title="${i18n.t('removeRecent')}" aria-label="Remove from recently viewed">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `).join('');
    },
    
    // Initialize on page load
    init() {
        // Render after a short delay to ensure DOM is ready
        setTimeout(() => this.render(), 200);
    }
};

// Open a project from recently viewed
function openRecentProject(projectName) {
    const project = window.projects.find(p => p.name === projectName);
    if (project) {
        openModal(project);
        // Also fly to the project location
        if (project.lat && project.lng) {
            map.flyTo([project.lat, project.lng], 14, { duration: 1.5 });
        }
    }
}

// Clear recently viewed (called from HTML)
function clearRecentlyViewed() {
    RecentlyViewed.clear();
}

// Initialize Recently Viewed on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    RecentlyViewed.init();
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔔 PRICE ALERTS SYSTEM - Track price drops and notify users
// ═══════════════════════════════════════════════════════════════════════════
const PriceAlerts = {
    storageKey: 'priceAlerts',
    notificationPermission: false,
    
    // Get all alerts from localStorage
    get() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('Error reading price alerts:', e);
            return [];
        }
    },
    
    // Save alerts to localStorage
    save(alerts) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(alerts));
        } catch (e) {
            console.warn('Error saving price alerts:', e);
        }
    },
    
    // Add a new price alert
    add(projectName, targetPrice, currentPrice = null) {
        if (!projectName || !targetPrice) return false;
        
        let alerts = this.get();
        
        // Check if alert already exists for this project
        const existingIndex = alerts.findIndex(a => a.projectName === projectName);
        
        const alert = {
            id: existingIndex >= 0 ? alerts[existingIndex].id : Date.now(),
            projectName: projectName,
            targetPrice: parseFloat(targetPrice),
            currentPrice: currentPrice ? parseFloat(currentPrice) : null,
            createdAt: existingIndex >= 0 ? alerts[existingIndex].createdAt : Date.now(),
            updatedAt: Date.now(),
            triggered: false,
            notified: false
        };
        
        if (existingIndex >= 0) {
            alerts[existingIndex] = alert;
        } else {
            alerts.unshift(alert);
        }
        
        this.save(alerts);
        this.updateBadge();
        this.renderAlertsList();
        
        // Show confirmation toast
        this.showToast(i18n.t('alertCreated'), 'success');
        
        return true;
    },
    
    // Remove an alert
    remove(alertId) {
        let alerts = this.get();
        alerts = alerts.filter(a => a.id !== alertId);
        this.save(alerts);
        this.updateBadge();
        this.renderAlertsList();
    },
    
    // Clear all alerts
    clearAll() {
        this.save([]);
        this.updateBadge();
        this.renderAlertsList();
    },
    
    // Update the notification badge count
    updateBadge() {
        const badge = document.getElementById('alerts-badge');
        if (!badge) return;
        
        const alerts = this.get();
        const activeCount = alerts.filter(a => !a.triggered).length;
        
        if (activeCount > 0) {
            badge.textContent = activeCount > 9 ? '9+' : activeCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    },
    
    // Request notification permission
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            this.notificationPermission = true;
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission === 'granted';
            return this.notificationPermission;
        }
        
        return false;
    },
    
    // Send browser notification
    sendNotification(title, body, projectName) {
        if (!this.notificationPermission) return;
        
        const notification = new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏠</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📉</text></svg>',
            tag: `price-alert-${projectName}`,
            requireInteraction: true
        });
        
        notification.onclick = () => {
            window.focus();
            const project = window.projects.find(p => p.name === projectName);
            if (project) openModal(project);
            notification.close();
        };
    },
    
    // Show toast notification
    showToast(message, type = 'info') {
        // Remove existing toast
        const existing = document.querySelector('.price-alert-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `price-alert-toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span class="toast-message">${message}</span>
        `;
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => toast.classList.add('show'));
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // Render the alerts panel
    renderAlertsList() {
        const container = document.getElementById('price-alerts-list');
        if (!container) return;
        
        const alerts = this.get();
        
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="alerts-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <p data-i18n="noAlerts">${i18n.t('noAlerts')}</p>
                    <span data-i18n="noAlertsHint">${i18n.t('noAlertsHint')}</span>
                </div>
            `;
            return;
        }
        
        container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.triggered ? 'triggered' : ''}" data-id="${alert.id}">
                <div class="alert-item-header">
                    <span class="alert-project-name">${alert.projectName}</span>
                    <button class="alert-remove-btn" onclick="PriceAlerts.remove(${alert.id})" title="${i18n.t('removeAlert')}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div class="alert-item-body">
                    <div class="alert-price-info">
                        <span class="alert-label">${i18n.t('targetPrice')}:</span>
                        <span class="alert-target-price">${this.formatPrice(alert.targetPrice)} EGP</span>
                    </div>
                    ${alert.currentPrice ? `
                    <div class="alert-price-info">
                        <span class="alert-label">${i18n.t('currentPrice')}:</span>
                        <span class="alert-current-price">${this.formatPrice(alert.currentPrice)} EGP</span>
                    </div>
                    ` : ''}
                    <div class="alert-status">
                        ${alert.triggered 
                            ? `<span class="alert-triggered"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${i18n.t('alertTriggered')}</span>`
                            : `<span class="alert-active"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg> ${i18n.t('alertActive')}</span>`
                        }
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    // Format price with commas
    formatPrice(price) {
        return new Intl.NumberFormat('en-EG').format(price);
    },
    
    // Open the set alert modal for a project
    openSetAlertModal(projectName, suggestedPrice = 5000000) {
        const modal = document.getElementById('priceAlertModal');
        if (!modal) return;
        
        const projectNameEl = document.getElementById('alert-project-name');
        const priceInput = document.getElementById('alert-target-price');
        
        if (projectNameEl) projectNameEl.textContent = projectName;
        if (priceInput) priceInput.value = suggestedPrice;
        
        modal.classList.add('active');
        modal.setAttribute('data-project', projectName);
        
        // Focus the input
        setTimeout(() => priceInput?.focus(), 100);
    },
    
    // Close the set alert modal
    closeSetAlertModal() {
        const modal = document.getElementById('priceAlertModal');
        if (modal) {
            modal.classList.remove('active');
            modal.removeAttribute('data-project');
        }
    },
    
    // Save alert from modal
    saveAlertFromModal() {
        const modal = document.getElementById('priceAlertModal');
        const priceInput = document.getElementById('alert-target-price');
        
        if (!modal || !priceInput) return;
        
        const projectName = modal.getAttribute('data-project');
        const targetPrice = priceInput.value;
        
        if (projectName && targetPrice) {
            this.add(projectName, targetPrice);
            this.closeSetAlertModal();
        }
    },
    
    // Toggle alerts panel
    togglePanel() {
        const panel = document.getElementById('price-alerts-panel');
        if (panel) {
            panel.classList.toggle('active');
            if (panel.classList.contains('active')) {
                this.renderAlertsList();
            }
        }
    },
    
    // Initialize
    init() {
        this.requestNotificationPermission();
        this.updateBadge();
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('price-alerts-panel');
            const toggle = document.getElementById('alerts-toggle-btn');
            if (panel && panel.classList.contains('active')) {
                if (!panel.contains(e.target) && !toggle?.contains(e.target)) {
                    panel.classList.remove('active');
                }
            }
        });
        
        // Render alerts list after DOM ready
        setTimeout(() => this.renderAlertsList(), 300);
    }
};

// Global functions for HTML onclick handlers
function togglePriceAlertsPanel() {
    PriceAlerts.togglePanel();
}

function closePriceAlertModal() {
    PriceAlerts.closeSetAlertModal();
}

function savePriceAlert() {
    PriceAlerts.saveAlertFromModal();
}

// Open price alert modal for current project (from modal button)
function openProjectPriceAlert() {
    if (currentProject && currentProject.name) {
        PriceAlerts.openSetAlertModal(currentProject.name);
    }
}

function clearAllAlerts() {
    if (confirm(i18n.t('confirmClearAlerts'))) {
        PriceAlerts.clearAll();
    }
}

// Initialize Price Alerts on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    PriceAlerts.init();
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 ADVANCED FILTERS SYSTEM - Price, Area, Bedrooms, Down Payment, Installments
// ═══════════════════════════════════════════════════════════════════════════
const AdvancedFilters = {
    isOpen: false,
    activeFilters: {
        priceMin: null,
        priceMax: null,
        areaMin: null,
        areaMax: null,
        bedrooms: 'any',
        maxDownPayment: 30,
        minInstallments: 0
    },
    
    // Toggle the advanced filters panel
    toggle() {
        const panel = document.getElementById('advancedFiltersPanel');
        const toggle = document.getElementById('advFiltersToggle');
        
        this.isOpen = !this.isOpen;
        
        if (panel) {
            panel.classList.toggle('open', this.isOpen);
        }
        if (toggle) {
            toggle.classList.toggle('active', this.isOpen);
        }
    },
    
    // Update down payment slider display
    updateDownPaymentDisplay() {
        const slider = document.getElementById('downPaymentSlider');
        const display = document.getElementById('downPaymentValue');
        if (slider && display) {
            const value = parseInt(slider.value);
            display.textContent = value === 30 ? i18n.t('any') || 'Any' : value + '%';
        }
    },
    
    // Update installments slider display
    updateInstallmentsDisplay() {
        const slider = document.getElementById('installmentsSlider');
        const display = document.getElementById('installmentsValue');
        if (slider && display) {
            const value = parseInt(slider.value);
            display.textContent = value === 0 ? i18n.t('any') || 'Any' : value + ' ' + i18n.t('years');
        }
    },
    
    // Select bedrooms
    selectBedrooms(value) {
        this.activeFilters.bedrooms = value;
        
        // Update button states
        document.querySelectorAll('.bedroom-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.beds === value);
        });
    },
    
    // Get current filter values from inputs
    getFilterValues() {
        const priceMin = document.getElementById('priceMin')?.value;
        const priceMax = document.getElementById('priceMax')?.value;
        const areaMin = document.getElementById('areaMin')?.value;
        const areaMax = document.getElementById('areaMax')?.value;
        const downPayment = document.getElementById('downPaymentSlider')?.value;
        const installments = document.getElementById('installmentsSlider')?.value;
        
        const parseSafe = (v) => { const n = parseFloat(v); return (v && !isNaN(n) && n >= 0) ? n : null; };

        return {
            priceMin: parseSafe(priceMin),
            priceMax: parseSafe(priceMax),
            areaMin: parseSafe(areaMin),
            areaMax: parseSafe(areaMax),
            bedrooms: this.activeFilters.bedrooms,
            maxDownPayment: parseInt(downPayment) === 30 ? null : parseInt(downPayment),
            minInstallments: parseInt(installments) === 0 ? null : parseInt(installments)
        };
    },
    
    // Count active filters
    countActiveFilters() {
        const filters = this.getFilterValues();
        let count = 0;
        
        if (filters.priceMin !== null) count++;
        if (filters.priceMax !== null) count++;
        if (filters.areaMin !== null) count++;
        if (filters.areaMax !== null) count++;
        if (filters.bedrooms !== 'any') count++;
        if (filters.maxDownPayment !== null) count++;
        if (filters.minInstallments !== null) count++;
        
        return count;
    },
    
    // Update the active filters count display
    updateFilterCount() {
        const count = this.countActiveFilters();
        const countEl = document.getElementById('activeFiltersCount');
        const textEl = document.getElementById('filterCountText');
        const toggleBtn = document.getElementById('advFiltersToggle');
        
        if (countEl && textEl) {
            if (count > 0) {
                countEl.style.display = 'flex';
                textEl.textContent = count + ' ' + (i18n.currentLang === 'ar' ? 'فلتر نشط' : 'filter' + (count > 1 ? 's' : '') + ' active');
            } else {
                countEl.style.display = 'none';
            }
        }
        
        // Add badge to toggle button
        if (toggleBtn) {
            let badge = toggleBtn.querySelector('.filter-badge');
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'filter-badge';
                    toggleBtn.appendChild(badge);
                }
                badge.textContent = count;
            } else if (badge) {
                badge.remove();
            }
        }
    },
    
    // Apply filters
    apply() {
        this.activeFilters = this.getFilterValues();
        this.updateFilterCount();
        
        // Trigger the main filter function
        filterProjects();
        
        // Show feedback toast
        const count = this.countActiveFilters();
        if (count > 0) {
            PriceAlerts.showToast(
                (i18n.currentLang === 'ar' ? 'تم تطبيق ' + count + ' فلتر' : count + ' filter' + (count > 1 ? 's' : '') + ' applied'),
                'success'
            );
        }
    },
    
    // Reset all filters
    reset() {
        // Reset input values
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        const areaMin = document.getElementById('areaMin');
        const areaMax = document.getElementById('areaMax');
        const downPayment = document.getElementById('downPaymentSlider');
        const installments = document.getElementById('installmentsSlider');
        
        if (priceMin) priceMin.value = '';
        if (priceMax) priceMax.value = '';
        if (areaMin) areaMin.value = '';
        if (areaMax) areaMax.value = '';
        if (downPayment) downPayment.value = 30;
        if (installments) installments.value = 0;
        
        // Reset bedrooms
        this.selectBedrooms('any');
        
        // Update displays
        this.updateDownPaymentDisplay();
        this.updateInstallmentsDisplay();
        
        // Reset active filters
        this.activeFilters = {
            priceMin: null,
            priceMax: null,
            areaMin: null,
            areaMax: null,
            bedrooms: 'any',
            maxDownPayment: null,
            minInstallments: null
        };
        
        this.updateFilterCount();
        
        // Re-run filter
        filterProjects();
    },
    
    // Filter projects based on advanced filters
    filterResults(projects) {
        const filters = this.activeFilters;
        
        return projects.filter(p => {
            // Price filter (using project data)
            if (filters.priceMin !== null || filters.priceMax !== null) {
                // Check if project has price data
                const projectPriceMin = p.priceMin;
                const projectPriceMax = p.priceMax;
                
                if (projectPriceMin !== undefined) {
                    // If user's min price is higher than project's max price, exclude
                    if (filters.priceMin !== null && projectPriceMax && filters.priceMin > projectPriceMax) return false;
                    // If user's max price is lower than project's min price, exclude
                    if (filters.priceMax !== null && filters.priceMax < projectPriceMin) return false;
                }
            }
            
            // Area filter (using project data)
            if (filters.areaMin !== null || filters.areaMax !== null) {
                const projectAreaMin = p.areaMin;
                const projectAreaMax = p.areaMax;
                
                if (projectAreaMin !== undefined) {
                    // If user's min area is higher than project's max area, exclude
                    if (filters.areaMin !== null && projectAreaMax && filters.areaMin > projectAreaMax) return false;
                    // If user's max area is lower than project's min area, exclude
                    if (filters.areaMax !== null && filters.areaMax < projectAreaMin) return false;
                }
            }
            
            // Bedrooms filter (using project bedrooms array)
            if (filters.bedrooms !== 'any') {
                const bedrooms = p.bedrooms || [];
                const targetBedrooms = filters.bedrooms === '4+' ? 4 : parseInt(filters.bedrooms);
                
                if (bedrooms.length > 0) {
                    if (filters.bedrooms === '4+') {
                        // Check if project has 4+ bedrooms
                        if (!bedrooms.some(b => b >= 4)) return false;
                    } else {
                        // Check if project has the specific bedroom count
                        if (!bedrooms.includes(targetBedrooms)) return false;
                    }
                }
            }
            
            // Down payment filter - use project's downPayment field directly
            if (filters.maxDownPayment !== null) {
                const dp = p.downPayment !== undefined ? p.downPayment : 
                           (p.minDownPayment !== undefined ? p.minDownPayment : null);
                if (dp !== null && dp > filters.maxDownPayment) return false;
            }
            
            // Installments filter - use project's installmentYears field directly
            if (filters.minInstallments !== null) {
                const years = p.installmentYears !== undefined ? p.installmentYears :
                              (p.maxInstallmentYears !== undefined ? p.maxInstallmentYears : null);
                if (years !== null && years < filters.minInstallments) return false;
            }
            
            return true;
        });
    },
    
    // Helper: Parse area from details string like "70m - 400m"
    parseAreaFromDetails(areasStr) {
        if (!areasStr) return null;
        const match = areasStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    },
    
    // Helper: Parse down payment from string like "10% Down Payment"
    parseDownPayment(paymentPlan) {
        if (!paymentPlan) return null;
        const match = paymentPlan.match(/(\d+)%\s*down/i);
        return match ? parseInt(match[1]) : null;
    },
    
    // Helper: Parse installment years from string like "Installments over 8 Years"
    parseInstallmentYears(paymentPlan) {
        if (!paymentPlan) return null;
        const match = paymentPlan.match(/(\d+)\s*years/i);
        return match ? parseInt(match[1]) : null;
    },
    
    // Initialize
    init() {
        // Set initial bedrooms button state
        this.selectBedrooms('any');
        this.updateDownPaymentDisplay();
        this.updateInstallmentsDisplay();
    }
};

// Global functions for HTML onclick handlers
function toggleAdvancedFilters() {
    AdvancedFilters.toggle();
}

function updateDownPaymentValue() {
    AdvancedFilters.updateDownPaymentDisplay();
}

function updateInstallmentsValue() {
    AdvancedFilters.updateInstallmentsDisplay();
}

function selectBedrooms(value) {
    AdvancedFilters.selectBedrooms(value);
}

function applyAdvancedFilters() {
    AdvancedFilters.apply();
}

function resetAdvancedFilters() {
    AdvancedFilters.reset();
}

// Initialize Advanced Filters on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    AdvancedFilters.init();
});

// --- TILE CACHING SYSTEM (IndexedDB) ---
const TileCache = {
    dbName: 'MapTileCache',
    dbVersion: 1,
    storeName: 'tiles',
    db: null,
    maxCacheSize: 500 * 1024 * 1024, // 500MB max cache
    maxTileAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    
    async init() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB not supported, tile caching disabled');
                resolve(false);
                return;
            }
            
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.warn('Failed to open tile cache DB');
                resolve(false);
            };
            
            request.onsuccess = (e) => {
                this.db = e.target.result;
                console.log('Tile cache initialized');
                this.cleanOldTiles(); // Clean old tiles on startup
                resolve(true);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    },
    
    async get(url) {
        if (!this.db) return null;
        
        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(url);
                
                request.onsuccess = () => {
                    const result = request.result;
                    if (result && (Date.now() - result.timestamp < this.maxTileAge)) {
                        resolve(result.blob);
                    } else {
                        resolve(null);
                    }
                };
                
                request.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    },
    
    async set(url, blob) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            store.put({ url, blob, timestamp: Date.now() });
        } catch (e) {
            console.warn('Failed to cache tile:', e);
        }
    },
    
    async cleanOldTiles() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('timestamp');
            const cutoff = Date.now() - this.maxTileAge;
            
            const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };
        } catch (e) {
            console.warn('Failed to clean old tiles:', e);
        }
    }
};

// Initialize tile cache
TileCache.init();

// Custom cached tile layer class
L.TileLayer.Cached = L.TileLayer.extend({
    createTile: function(coords, done) {
        const tile = document.createElement('img');
        const url = this.getTileUrl(coords);
        
        tile.alt = '';
        tile.setAttribute('role', 'presentation');
        
        // Try to load from cache first
        TileCache.get(url).then(cachedBlob => {
            if (cachedBlob) {
                // Load from cache
                tile.src = URL.createObjectURL(cachedBlob);
                tile.onload = () => {
                    URL.revokeObjectURL(tile.src);
                    done(null, tile);
                };
            } else {
                // Fetch and cache
                fetch(url)
                    .then(response => response.blob())
                    .then(blob => {
                        TileCache.set(url, blob);
                        tile.src = URL.createObjectURL(blob);
                        tile.onload = () => {
                            URL.revokeObjectURL(tile.src);
                            done(null, tile);
                        };
                    })
                    .catch(() => {
                        // Fallback to direct loading
                        tile.src = url;
                        tile.onload = () => done(null, tile);
                        tile.onerror = () => done(new Error('Tile load error'), tile);
                    });
            }
        });
        
        return tile;
    }
});

L.tileLayer.cached = function(url, options) {
    return new L.TileLayer.Cached(url, options);
};

// --- 1. INITIALIZE MAP ---
// Center focused on Egypt
const map = L.map("map", {
  zoomControl: false,
  attributionControl: false,
  preferCanvas: true, // Use Canvas renderer for performance
  fadeAnimation: true,
  zoomAnimation: true,
  updateWhenZooming: false, // Don't update tiles while zooming (smoother)
  updateWhenIdle: true, // Update tiles when map stops moving
  keepBuffer: 4, // Keep 4 tiles buffer around viewport (more cached tiles visible)
}).setView([30.0, 31.0], 7);

// Map Tile Layers
const darkTiles = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const lightTiles = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

// --- 4. MAP LAYERS (Moved up for initialization) ---
const layers = {
  street: L.tileLayer(darkTiles, { 
      maxZoom: 22, 
      subdomains: "abcd",
      detectRetina: true,
      className: 'high-quality-tiles',
      keepBuffer: 4,
      updateWhenZooming: false
  }),
  satellite: L.tileLayer.cached('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 22,
    detectRetina: true,
    className: 'high-quality-tiles',
    keepBuffer: 6, // Extra buffer for satellite (more caching)
    updateWhenZooming: false,
    crossOrigin: 'anonymous'
  }),
  hybrid: L.layerGroup([
    L.tileLayer.cached('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 22,
        detectRetina: true,
        keepBuffer: 6,
        updateWhenZooming: false,
        crossOrigin: 'anonymous'
    }),
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 22,
      detectRetina: true,
      keepBuffer: 4
    })
  ])
};

// Initialize with Street layer
layers.street.addTo(map);

let hasCompletedInitialLoad = false;

function updateLoadingStatus(message) {
    const statusEl = document.getElementById('loadingStatus');
    if (statusEl && message) {
        statusEl.textContent = message;
    }
}

function completeInitialLoad() {
    if (hasCompletedInitialLoad) return;
    hasCompletedInitialLoad = true;
    const loader = document.getElementById('mapLoader');
    if (loader) loader.style.display = 'none';
}

// Remove loader when map is ready
map.whenReady(() => {
    updateLoadingStatus('Map ready. Rendering projects...');
    completeInitialLoad();
});

// Hard fallback so the UI never stays trapped behind the loading overlay.
window.setTimeout(() => {
    if (!hasCompletedInitialLoad) {
        updateLoadingStatus('Finishing startup...');
        completeInitialLoad();
    }
}, 4500);

L.control.zoom({ position: "bottomright" }).addTo(map);

// Initialize Marker Cluster Group globally so it's accessible
const markerClusterGroup = typeof L.markerClusterGroup === 'function' ? L.markerClusterGroup({
  // IMPORTANT: Keep markers in DOM even when outside visible bounds
  // This prevents markers from disappearing when zooming/panning
  removeOutsideVisibleBounds: false,
  
  // Disable animation for better performance
  animate: true,
  animateAddingMarkers: false,
  
  // Spiderfy settings for better UX
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  
  // Maximum cluster radius - affects how aggressively markers cluster
  maxClusterRadius: 60,
  
  // Disable removing clusters outside viewport
  disableClusteringAtZoom: 16,
  
  iconCreateFunction: function(cluster) {
    const childCount = cluster.getChildCount();
    
    // Calculate size based on count
    let size = 40;
    if (childCount > 10) size = 50;
    if (childCount > 100) size = 60;

    return L.divIcon({
      html: `<div style="
        background-color: var(--avaria-bg);
        color: var(--avaria-gold);
        border: 2px solid var(--avaria-gold);
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        box-shadow: 0 0 15px var(--avaria-gold);
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
      "><span>${childCount}</span></div>`,
      className: 'custom-marker-cluster',
      iconSize: L.point(size, size)
    });
    }
}).addTo(map) : L.layerGroup().addTo(map);

// Initialize Standard Marker Layer (initially not added to map)
const markerLayer = L.layerGroup();
let isClusterView = true; // Default view state

// Heatmap Layer
let heatmapLayer = null;
let isHeatmapMode = false;
let isLabelsAlwaysVisible = false;

// Store all markers for quick label toggle
let allMarkersWithTooltips = [];

function toggleLabels() {
    isLabelsAlwaysVisible = !isLabelsAlwaysVisible;
    const btn = document.getElementById('btn-labels');
    if (btn) {
        if (isLabelsAlwaysVisible) btn.classList.add('active');
        else btn.classList.remove('active');
    }
    if (!map) return;
    const mapEl = map.getContainer();

    if (!isLabelsAlwaysVisible) {
        // OFF: CSS-hide instantly, then close tooltips in background
        mapEl.classList.add('labels-hidden');
        _batchTooltips(false);
    } else {
        // ON: remove CSS-hide, then open viewport tooltips in batches
        mapEl.classList.remove('labels-hidden');
        _batchTooltips(true);
    }
}

/** Batch-process tooltip open/close for viewport markers only */
function _batchTooltips(open) {
    const bounds = map.getBounds();
    const markers = allMarkersWithTooltips;
    const batch = [];
    for (let i = 0; i < markers.length; i++) {
        const m = markers[i];
        if (m && m._map && m.getLatLng && bounds.contains(m.getLatLng())) {
            if (m.getTooltip?.()) batch.push(m);
        }
    }
    // In Normal View at low zoom, cap labels to avoid overlapping mess
    const maxLabels = open && !isClusterView ? 200 : batch.length;
    const count = Math.min(batch.length, maxLabels);
    // Batch size: small for open (each triggers DOM reflow), larger for close
    const batchSize = open ? 10 : 60;
    // Small count → do it synchronously
    if (count <= batchSize) {
        for (let i = 0; i < count; i++) {
            if (open) batch[i].openTooltip(); else batch[i].closeTooltip();
        }
        if (!open) map.getContainer().classList.remove('labels-hidden');
        return;
    }
    // Large count → rAF batches
    let idx = 0;
    function step() {
        const end = Math.min(idx + batchSize, count);
        for (let i = idx; i < end; i++) {
            if (open) batch[i].openTooltip(); else batch[i].closeTooltip();
        }
        idx = end;
        if (idx < count) requestAnimationFrame(step);
        else if (!open) map.getContainer().classList.remove('labels-hidden');
    }
    requestAnimationFrame(step);
}

function toggleHeatmap() {
  const btn = document.getElementById('btn-heatmap');
  isHeatmapMode = !isHeatmapMode;

  if (isHeatmapMode) {
    if (btn) btn.classList.add('active');
    // Hide markers
    if (map && map.hasLayer(markerClusterGroup)) map.removeLayer(markerClusterGroup);
    if (map && map.hasLayer(markerLayer)) map.removeLayer(markerLayer);
    
    // Show heatmap (data will be populated in renderProjects or updated here)
    // We need to trigger a re-render or just add the layer if data exists
    // But renderProjects handles the data source.
    // Let's just call renderProjects with the current filtered list?
    // We don't have easy access to the current filtered list unless we store it.
    // Let's trigger the filter function again to refresh the view.
    filterProjects();
  } else {
    if (btn) btn.classList.remove('active');
    // Remove heatmap
    if (heatmapLayer && map && map.hasLayer(heatmapLayer)) map.removeLayer(heatmapLayer);
    
    // Restore previous view
    if (map) {
        if (isClusterView) {
          map.addLayer(markerClusterGroup);
        } else {
          map.addLayer(markerLayer);
        }
    }
  }
}

// --- 3D MODE TOGGLE ---
let is3DMode = false;
function toggle3DMode() {
  is3DMode = !is3DMode;
  const mapContainer = document.getElementById('map');
  const btn = document.getElementById('btn-3d');
  const vignette = document.getElementById('vignette');
  
  if (!mapContainer || !btn) return;
  
  if (is3DMode) {
      mapContainer.classList.add('map-3d');
      btn.classList.add('active');
      if (vignette) vignette.classList.add('active');
      // Set max zoom to 18 (standard max for most tiles) to prevent "Map data not available"
      // Even though we are supersampling, we can't request tiles that don't exist.
      map.setMaxZoom(18); 
  } else {
      mapContainer.classList.remove('map-3d');
      btn.classList.remove('active');
      if (vignette) vignette.classList.remove('active');
      // Reset max zoom
      map.setMaxZoom(18);
  }
  
  // Force map resize to ensure tiles render correctly after transform
  // We call it multiple times during transition to keep it updated if possible, 
  // but mostly at the end.
  setTimeout(() => {
      map.invalidateSize();
  }, 800);
}

// --- 1.5 ROAD LAYERS ---
let mainRoadsLayer = null;
let secondaryRoadsLayer = null;

async function fetchAndDrawRoads() {
  // Bounding box covering the North Coast project area
  const bbox = "30.80,27.60,31.30,30.00"; 
  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"motorway|trunk|primary"](${bbox});
      way["highway"~"secondary|tertiary"](${bbox});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query
    });

        if (!response.ok) {
            throw new Error(`Road overlay request failed with ${response.status}`);
        }

        const responseType = response.headers.get('content-type') || '';
        if (!responseType.includes('application/json')) {
            throw new Error('Road overlay provider returned a non-JSON response');
        }

        const data = await response.json();
    
    if (!window.osmtogeojson) {
        try {
            await lazyLoadScript('https://unpkg.com/osmtogeojson@2.2.12/osmtogeojson.js');
        } catch (e) {
            console.error('Failed to load osmtogeojson:', e);
            return;
        }
    }
    if (!window.osmtogeojson) return;
    
    const geojson = osmtogeojson(data);

    // Filter features
    const mainRoads = {
      type: "FeatureCollection",
      features: geojson.features.filter(f => 
        f.properties.highway && ["motorway", "trunk", "primary", "motorway_link", "trunk_link", "primary_link"].includes(f.properties.highway)
      )
    };

    const secondaryRoads = {
      type: "FeatureCollection",
      features: geojson.features.filter(f => 
        f.properties.highway && ["secondary", "tertiary", "secondary_link", "tertiary_link"].includes(f.properties.highway)
      )
    };

    // Get current colors - Premium purple theme
    const computedStyle = getComputedStyle(document.documentElement);
    const goldColor = computedStyle.getPropertyValue('--avaria-gold').trim() || '#667eea';
    const redColor = computedStyle.getPropertyValue('--avaria-red').trim() || '#f093fb';

    // Store geojson for theme re-renders
    window._roadsGeoJSON = geojson;

    // Create Layers with interactive road names
    if (mainRoadsLayer) map.removeLayer(mainRoadsLayer);
    mainRoadsLayer = L.geoJSON(mainRoads, {
      style: {
        color: goldColor,
        weight: 3,
        opacity: 0.9,
        lineCap: 'round'
      },
      interactive: true,
      onEachFeature: (feature, layer) => {
        const name = feature.properties.name || feature.properties.ref || '';
        const highway = feature.properties.highway || '';
        const ref = feature.properties.ref || '';
        if (name || ref) {
          const label = [name, ref].filter(Boolean).join(' · ');
          const typeLabel = highway.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
          layer.bindTooltip(`<strong>${label}</strong><br><span style="opacity:0.7;font-size:0.75rem">${typeLabel}</span>`, {
            sticky: true,
            direction: 'top',
            className: 'road-name-tooltip',
            opacity: 0.95
          });
        }
        layer.on('mouseover', function() { this.setStyle({ weight: 5, opacity: 1 }); });
        layer.on('mouseout', function() { this.setStyle({ weight: 3, opacity: 0.9 }); });
      }
    }).addTo(map);

    if (secondaryRoadsLayer) map.removeLayer(secondaryRoadsLayer);
    secondaryRoadsLayer = L.geoJSON(secondaryRoads, {
      style: {
        color: redColor,
        weight: 1.5,
        opacity: 0.7,
        lineCap: 'round'
      },
      interactive: true,
      onEachFeature: (feature, layer) => {
        const name = feature.properties.name || feature.properties.ref || '';
        const highway = feature.properties.highway || '';
        const ref = feature.properties.ref || '';
        if (name || ref) {
          const label = [name, ref].filter(Boolean).join(' · ');
          const typeLabel = highway.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
          layer.bindTooltip(`<strong>${label}</strong><br><span style="opacity:0.7;font-size:0.75rem">${typeLabel}</span>`, {
            sticky: true,
            direction: 'top',
            className: 'road-name-tooltip',
            opacity: 0.95
          });
        }
        layer.on('mouseover', function() { this.setStyle({ weight: 3, opacity: 1 }); });
        layer.on('mouseout', function() { this.setStyle({ weight: 1.5, opacity: 0.7 }); });
      }
    }).addTo(map);
    
    // Ensure markers stay on top
    if (typeof markerClusterGroup !== 'undefined') {
      // markerClusterGroup doesn't have bringToFront, but we can try to bring the pane to front or rely on z-index
      // However, Leaflet clusters are usually on the marker pane which is high up.
      // If we really need to, we can iterate layers, but for clusters it's different.
      // Let's just check if the group exists.
      // Actually, markerClusterGroup is a LayerGroup, but it manages its own layers.
      // The standard way to ensure z-index is usually sufficient.
      // But let's keep the check consistent with the variable name change.
    }

    } catch (e) {
        console.warn("Road overlay unavailable:", e?.message || e);
  }
}

// Defer road loading to improve initial load performance
const loadRoads = () => {
  if (!window.roadsLoaded) {
    window.roadsLoaded = true;
    // Use requestIdleCallback if available for better performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => fetchAndDrawRoads());
    } else {
      setTimeout(fetchAndDrawRoads, 100);
    }
    
    // Remove listeners
    if (map) {
      map.off('moveend', loadRoads);
      map.off('zoomend', loadRoads);
    }
    document.removeEventListener('touchstart', loadRoads);
    document.removeEventListener('click', loadRoads);
  }
};

// Load on interaction
map.on('moveend', loadRoads);
map.on('zoomend', loadRoads);
document.addEventListener('touchstart', loadRoads, { passive: true, once: true });
document.addEventListener('mousemove', loadRoads, { passive: true, once: true });
document.addEventListener('click', loadRoads, { passive: true, once: true });

// Fallback: load after 5 seconds if no interaction
setTimeout(loadRoads, 5000);

// --- 2. DATASET (North Coast Projects) ---

// --- UTILITY: Parse Data for Filtering & Enrich Missing Data ---
function parseProjectData() {
  if (typeof window.projects === 'undefined') return;

  // Filter out projects with invalid coordinates
  window.projects = window.projects.filter(p => {
      const lat = parseFloat(p.lat);
      const lng = parseFloat(p.lng);
      return !isNaN(lat) && !isNaN(lng) && lat !== null && lng !== null;
  });

  window.projects.forEach(p => {
    // Ensure coordinates are numbers
    p.lat = parseFloat(p.lat);
    p.lng = parseFloat(p.lng);

    // Ensure type exists
    if (!p.type) p.type = "residential";

    // --- ENRICHMENT: Generate Missing Details ---
    if (!window.projectDetails[p.name]) {
        let defaultDetails = {
            unitTypes: "Apartments, Villas",
            areas: "100m - 300m",
            paymentPlan: "10% Down Payment, Installments over 6 Years",
            status: "Under Construction",
            amenities: "Security, Green Spaces, Parking",
            description: `A premium ${p.type || 'residential'} project by ${p.dev || 'Unknown'} located in ${p.zone}.`
        };

        // Zone-Specific Heuristics
        const z = (p.zone || "").toLowerCase();
        const t = (p.type || "").toLowerCase();

        if (z.includes("north") || z.includes("sahel") || z.includes("ras") || z.includes("sidi") || z.includes("alamein") || z.includes("galala") || z.includes("sokhna")) {
            defaultDetails.unitTypes = "Chalets, Villas, Twin Houses, Townhouses";
            defaultDetails.areas = "70m - 400m";
            defaultDetails.paymentPlan = "10% Down Payment, Installments over 8 Years";
            defaultDetails.amenities = "Beach Access, Lagoons, Clubhouse, Swimming Pools, 5-Star Hotel";
            if (t.includes("commercial")) {
                defaultDetails.unitTypes = "Commercial Units, Retail, Clinics, Serviced Apartments";
                defaultDetails.amenities = "Sea View, High Traffic Area, Parking";
            }
        } else if (z.includes("capital")) {
            defaultDetails.unitTypes = "Apartments, Duplexes";
            defaultDetails.paymentPlan = "10% Down Payment, Installments over 10 Years";
            defaultDetails.amenities = "Green River View, Smart City Features, Underground Parking";
            if (t.includes("commercial")) {
                defaultDetails.unitTypes = "Commercial Units, Administrative Offices, Retail Shops, Medical Clinics";
                defaultDetails.paymentPlan = "10% Down Payment, Installments over 8 Years";
                defaultDetails.amenities = "Meeting Rooms, Sky Lounge, Plaza, High Speed Internet";
            }
        } else if (z.includes("cairo") || z.includes("october") || z.includes("zayed")) {
            defaultDetails.unitTypes = "Apartments, Penthouses, Duplexes";
            defaultDetails.paymentPlan = "10% Down Payment, Installments over 7 Years";
            defaultDetails.amenities = "Clubhouse, Gym, Spa, Kids Area, Commercial Strip";
            if (t.includes("commercial")) {
                defaultDetails.unitTypes = "Commercial Units, Offices, Retail, Clinics";
                defaultDetails.amenities = "Security, Parking, Central AC, Food Court";
            }
        }

        // Developer Heuristics
        const d = (p.dev || "").toLowerCase();
        if (d.includes("emaar") || d.includes("ora") || d.includes("sodic") || d.includes("palm hills")) {
            defaultDetails.paymentPlan = "5% Down Payment, Installments over 8 Years";
            defaultDetails.amenities += ", Golf Course, International School";
        }

        window.projectDetails[p.name] = defaultDetails;
    }

    const details = window.projectDetails[p.name];
    
    // --- MOCK DATA GENERATION (1000x Intelligence) ---
    // Assign Delivery Year (2020-2030) based on status
    if (!p.deliveryYear) {
        if (details && details.status) {
            const s = details.status.toLowerCase();
            if (s.includes('delivered') || s.includes('ready')) {
                p.deliveryYear = Math.floor(Math.random() * (2024 - 2020 + 1)) + 2020; // 2020-2024
            } else {
                p.deliveryYear = Math.floor(Math.random() * (2030 - 2025 + 1)) + 2025; // 2025-2030
            }
        } else {
            p.deliveryYear = 2026; // Default
        }
    }

    // Assign Radar Chart Scores (1-10) - More differentiated algorithm
    if (!p.radarScores) {
        const zone = p.zone ? p.zone.toLowerCase() : "";
        const dev = p.dev ? p.dev.toLowerCase() : "";
        const nameHash = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        
        // Base scores with project-specific variance
        const variance = (num) => Math.max(1, Math.min(10, num + ((nameHash % 5) - 2)));
        
        // Price Score (higher = more affordable) - inverse of luxury usually
        let priceScore = 6;
        if (zone.includes("october") || zone.includes("mostakbal")) priceScore = 8;
        else if (zone.includes("new cairo") || zone.includes("capital")) priceScore = 6;
        else if (zone.includes("sokhna")) priceScore = 5;
        else if (zone.includes("gouna")) priceScore = 4;
        else if (zone.includes("north") || zone.includes("sahel")) priceScore = 3;
        
        // Luxury Score
        let luxuryScore = 5;
        if (PREMIUM_DEVS.some(d => dev.includes(d))) luxuryScore = 10;
        else if (STRONG_DEVS.some(d => dev.includes(d))) luxuryScore = 8;
        else if (zone.includes("north") || zone.includes("gouna")) luxuryScore = 7;
        
        // Amenities Score
        let amenitiesScore = 5;
        const details = projectDetails[p.name];
        if (details && details.amenities) {
            const count = details.amenities.split(',').length;
            if (count >= 12) amenitiesScore = 10;
            else if (count >= 9) amenitiesScore = 8;
            else if (count >= 6) amenitiesScore = 7;
            else if (count >= 4) amenitiesScore = 6;
        }
        if (PREMIUM_DEVS.some(d => dev.includes(d))) amenitiesScore = Math.min(10, amenitiesScore + 2);
        
        // Location Score (accessibility, demand)
        let locationScore = 5;
        if (zone.includes("ras el hekma") || zone.includes("alamein")) locationScore = 10;
        else if (zone.includes("north coast") || zone.includes("sahel")) locationScore = 9;
        else if (zone.includes("capital")) locationScore = 8;
        else if (zone.includes("gouna")) locationScore = 8;
        else if (zone.includes("new cairo")) locationScore = 7;
        else if (zone.includes("sokhna") || zone.includes("galala")) locationScore = 7;
        else if (zone.includes("zayed")) locationScore = 6;
        else if (zone.includes("october")) locationScore = 5;
        
        // Delivery Speed Score
        let speedScore = 5;
        const deliveryYear = p.deliveryYear || 2026;
        const yearsToDelivery = deliveryYear - new Date().getFullYear();
        if (yearsToDelivery <= 0) speedScore = 10;
        else if (yearsToDelivery === 1) speedScore = 8;
        else if (yearsToDelivery === 2) speedScore = 6;
        else if (yearsToDelivery === 3) speedScore = 5;
        else if (yearsToDelivery === 4) speedScore = 4;
        else speedScore = 3;
        
        p.radarScores = {
            price: variance(priceScore),
            luxury: variance(luxuryScore),
            amenities: variance(amenitiesScore),
            location: variance(locationScore),
            speed: variance(speedScore)
        };
    }
    // -------------------------------------------------

    if (details) {
      // Parse Payment Plan
      if (details.paymentPlan) {
        // Max Installment Years (e.g., "over 8 years", "8 Years")
        const yearsMatch = details.paymentPlan.match(/over\s+(\d+)\s+years/i) || details.paymentPlan.match(/(\d+)\s*Years/i);
        if (yearsMatch) {
          p.maxInstallmentYears = parseInt(yearsMatch[1], 10);
        }

        // Min Down Payment (e.g., "5% Down Payment")
        const dpMatch = details.paymentPlan.match(/(\d+(?:\.\d+)?)%\s*Down\s*Payment/i);
        if (dpMatch) {
          p.minDownPayment = parseFloat(dpMatch[1]);
        }
      }

      // Parse Areas (e.g., "70m - 250m")
      if (details.areas) {
        const areaMatch = details.areas.match(/(\d+)\s*m/i);
        if (areaMatch) {
          p.minArea = parseInt(areaMatch[1], 10);
        }
      }
    }
  });

}

// Execute parsing immediately
// parseProjectData();

// --- COMPARISON LOGIC ---
let compareList = [];

function addToCompare(projectName) {
  if (compareList.length >= 3) {
    alert("You can only compare up to 3 projects.");
    return;
  }
  if (compareList.find(p => p.name === projectName)) {
    alert("Project already in comparison list.");
    return;
  }
  
  const project = projects.find(p => p.name === projectName);
  if (project) {
    compareList.push(project);
    updateComparisonDrawer();
  }
}

function removeFromCompare(projectName) {
  compareList = compareList.filter(p => p.name !== projectName);
  updateComparisonDrawer();
}

function decodeProjectToken(projectToken) {
    if (!projectToken) return '';

    try {
        return decodeURIComponent(projectToken);
    } catch {
        return String(projectToken);
    }
}

function addToCompareEncoded(projectToken) {
    return addToCompare(decodeProjectToken(projectToken));
}

function removeFromCompareEncoded(projectToken) {
    return removeFromCompare(decodeProjectToken(projectToken));
}

function updateComparisonDrawer() {
  const drawer = document.getElementById('comparison-drawer');
  const itemsContainer = document.getElementById('drawer-items');
  const actionBtn = document.getElementById('compare-action-btn');
  
  if (!itemsContainer) return;
  
  itemsContainer.innerHTML = '';
  
  compareList.forEach(p => {
    const card = document.createElement('div');
        const encodedProjectName = encodeURIComponent(p.name);
    card.className = 'comparison-card';
    card.innerHTML = `
      <span>${p.name}</span>
            <button class="remove-btn" onclick="removeFromCompareEncoded('${encodedProjectName}')">×</button>
    `;
    itemsContainer.appendChild(card);
  });
  
  if (compareList.length > 0) {
    if (drawer) drawer.classList.add('active');
    if (actionBtn) actionBtn.disabled = false;
  } else {
    if (drawer) drawer.classList.remove('active');
    if (actionBtn) actionBtn.disabled = true;
  }
}

function openComparisonModal() {
  const modal = document.getElementById('comparisonModal');
  const table = document.getElementById('comparison-table');
  
  if (!modal || !table) return;
  
  // Build Table
  let html = `
    <thead>
      <tr>
        <th>Feature</th>
        ${compareList.map(p => `<th>${p.name}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Developer</td>
        ${compareList.map(p => `<td>${p.dev || '-'}</td>`).join('')}
      </tr>
      <tr>
        <td>Location</td>
        ${compareList.map(p => `<td>${p.zone || '-'}</td>`).join('')}
      </tr>
      <tr>
        <td>Unit Types</td>
        ${compareList.map(p => `<td>${projectDetails[p.name]?.unitTypes || '-'}</td>`).join('')}
      </tr>
      <tr>
        <td>Min Area</td>
        ${compareList.map(p => `<td>${p.minArea ? p.minArea + ' m²' : '-'}</td>`).join('')}
      </tr>
      <tr>
        <td>Down Payment</td>
        ${compareList.map(p => `<td>${p.minDownPayment ? p.minDownPayment + '%' : '-'}</td>`).join('')}
      </tr>
      <tr>
        <td>Installments</td>
        ${compareList.map(p => `<td>${p.maxInstallmentYears ? p.maxInstallmentYears + ' Years' : '-'}</td>`).join('')}
      </tr>
    </tbody>
  `;
  
  table.innerHTML = html;
  
  modal.classList.add('active');
  
  const modalContent = modal.querySelector('.modal-content');
  if (modalContent && typeof gsap !== 'undefined') {
      gsap.fromTo(modalContent, 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }
      );
  }
}

function closeComparisonModal() {
  const modal = document.getElementById('comparisonModal');
  if (modal) modal.classList.remove('active');
}

// --- 3. FUSE.JS SETUP & WORKER ---
const fuseOptions = {
  keys: ['name', 'dev', 'zone'],
  threshold: 0.3,
  distance: 100
};
let fuse; // Kept for fallback or synchronous needs if any
let searchWorker;

function initSearchWorker() {
    if (window.Worker) {
        try {
            searchWorker = new Worker('search.worker.js');
            
            searchWorker.onmessage = function(e) {
                const { type, results, filters } = e.data;
                
                if (type === 'INIT_COMPLETE') {
                    console.log('Search Worker Initialized');
                } else if (type === 'SEARCH_RESULTS') {
                    // Clear the timeout since we got a response
                    if (window._searchWorkerTimeout) {
                        clearTimeout(window._searchWorkerTimeout);
                        window._searchWorkerTimeout = null;
                    }
                    
                    console.log('Search Results received:', results ? results.length : 0, 'items');
                    // Render results from worker
                    let finalResults = results || [];
                    
                    // Apply active category filter (buttons)
                    finalResults = applyActiveFilter(finalResults);

                    try {
                        renderProjects(finalResults);
                    } catch (renderErr) {
                        console.error("Render Projects Error:", renderErr);
                    }
                } else if (type === 'DETECTED_FILTERS') {
                    // Update UI feedback
                    const feedbackContainer = document.getElementById("ai-feedback");
                    if (feedbackContainer) {
                        feedbackContainer.innerHTML = "";
                        filters.forEach(filter => {
                            const tag = document.createElement("span");
                            tag.innerText = filter;
                            feedbackContainer.appendChild(tag);
                        });
                    }
                }
            };
            
            searchWorker.onerror = function(err) {
                console.error("Worker Error:", err);
                searchWorker = null; // Fallback to main thread
            };
        } catch (e) {
            console.error("Failed to create worker:", e);
            searchWorker = null;
        }
    }
}

// Initialize Worker
initSearchWorker();

// --- 4. MAP LAYERS ---
// layers object is defined above in initialization section

function switchMapLayer(layerName) {
  // Remove all layers
  Object.values(layers).forEach(layer => {
    if (map && map.hasLayer(layer)) map.removeLayer(layer);
  });
  
  // Add selected layer
  if (layers[layerName] && map) {
      layers[layerName].addTo(map);
  }

  // Update buttons
  document.querySelectorAll('.map-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-${layerName}`);
  if (activeBtn) activeBtn.classList.add('active');
}

// --- 5. RENDER & SEARCH LOGIC ---
const listContainer = document.getElementById("list-container");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
let activeFilter = 'all';
// markerLayer is already defined globally
let sidebarAutoCollapsed = false;

function toggleMapView() {
  const btn = document.getElementById('view-toggle-btn');
  if (!map) return;
  
  if (isClusterView) {
    // Switch to Normal View
    if (map.hasLayer(markerClusterGroup)) map.removeLayer(markerClusterGroup);
    if (!map.hasLayer(markerLayer)) map.addLayer(markerLayer);
    if (btn) {
        btn.innerText = "Normal View";
        btn.classList.remove('active');
    }
    isClusterView = false;
  } else {
    // Switch to Cluster View
    if (map.hasLayer(markerLayer)) map.removeLayer(markerLayer);
    if (!map.hasLayer(markerClusterGroup)) map.addLayer(markerClusterGroup);
    if (btn) {
        btn.innerText = "Cluster View";
        btn.classList.add('active');
    }
    isClusterView = true;
  }
}

// --- NEURAL VIEW FEATURE ---
const NeuralView = {
  canvas: null,
  ctx: null,
  active: false,
  animationFrame: null,
  sourceProject: null,
  targetProjects: [],
  _cachedThemeColor: null,
  _cachedTheme: null,
  
  init: function(mapInstance) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'neural-canvas';
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '500'; // Above map (z-index 1) but below UI
      
      const mapContainer = mapInstance.getContainer();
      mapContainer.appendChild(this.canvas);
      
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      
      window.addEventListener('resize', () => {
          clearTimeout(this._resizeTimer);
          this._resizeTimer = setTimeout(() => this.resize(), 150);
      });
      mapInstance.on('move', () => this.update());
      mapInstance.on('zoom', () => this.update());
  },
  
  resize: function() {
      if (!this.canvas) return;
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
      if (this.active) this.update();
  },
  
  calculateSimilarity: function(source) {
      if (!source) return [];
      
      const sourceDetails = projectDetails[source.name] || {};
      const sourceUnits = (sourceDetails.unitTypes || "").toLowerCase().split(',').map(s => s.trim());
      
      return projects
          .filter(p => p.name !== source.name)
          .map(p => {
              let score = 0;
              
              // Zone Similarity
              if (p.zone === source.zone) score += 5;
              
              // Unit Type Similarity
              const pDetails = projectDetails[p.name] || {};
              const pUnits = (pDetails.unitTypes || "").toLowerCase();
              
              sourceUnits.forEach(u => {
                  if (pUnits.includes(u)) score += 3;
              });
              
              return { project: p, score: score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(item => item.project);
  },
  
  activate: function(project) {
      this.sourceProject = project;
      this.targetProjects = this.calculateSimilarity(project);
      this.active = true;
      this.animate();
  },
  
  deactivate: function() {
      this.active = false;
      this.sourceProject = null;
      this.targetProjects = [];
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
  
  update: function() {
      if (!this.active) return;
      // Just trigger a redraw in the animation loop
  },

  hexToRgba: function(hex, alpha) {
      let r = 0, g = 0, b = 0;
      hex = hex.trim();
      if (hex.length === 4) {
          r = parseInt(hex[1] + hex[1], 16);
          g = parseInt(hex[2] + hex[2], 16);
          b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
          r = parseInt(hex.slice(1, 3), 16);
          g = parseInt(hex.slice(3, 5), 16);
          b = parseInt(hex.slice(5, 7), 16);
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
  
  animate: function() {
      if (!this.active) return;
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      if (!this.sourceProject || this.targetProjects.length === 0) return;
      
      const sourcePoint = map.latLngToContainerPoint([this.sourceProject.lat, this.sourceProject.lng]);
      
      const time = Date.now() / 1000;

      // Get theme colors - cached to avoid getComputedStyle every frame
      const currentTheme = document.documentElement.getAttribute('data-theme');
      if (!this._cachedThemeColor || this._cachedTheme !== currentTheme) {
          const styles = getComputedStyle(document.documentElement);
          this._cachedThemeColor = styles.getPropertyValue('--avaria-gold').trim() || '#667eea';
          this._cachedTheme = currentTheme;
      }
      const themeColor = this._cachedThemeColor;
      
      this.targetProjects.forEach((target, index) => {
          const targetPoint = map.latLngToContainerPoint([target.lat, target.lng]);
          
          // Draw Line with glow
          this.ctx.beginPath();
          this.ctx.moveTo(sourcePoint.x, sourcePoint.y);
          this.ctx.lineTo(targetPoint.x, targetPoint.y);
          
          const alpha = (Math.sin(time * 3 + index) + 1) / 2 * 0.6 + 0.2;
          this.ctx.strokeStyle = this.hexToRgba(themeColor, alpha);
          this.ctx.lineWidth = 2;
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = themeColor;
          this.ctx.stroke();
          
          // Draw Dot at Target (no shadow needed)
          this.ctx.shadowBlur = 0;
          this.ctx.beginPath();
          this.ctx.arc(targetPoint.x, targetPoint.y, 4, 0, Math.PI * 2);
          this.ctx.fillStyle = themeColor;
          this.ctx.fill();
      });
      
      this.animationFrame = requestAnimationFrame(() => this.animate());
  }
};

function updateBrowseTelemetry(visibleCount, totalCount = (window.projects || []).length) {
  if (window.RoutePlanner?.updateBrowseTelemetry) {
      window.RoutePlanner.updateBrowseTelemetry(visibleCount, totalCount);
      return;
  }

  const countEl = document.getElementById('browseProjectCount');
  if (countEl && Number.isFinite(visibleCount)) {
      countEl.dataset.visible = `${visibleCount}`;
      countEl.dataset.total = `${totalCount}`;
      countEl.textContent = totalCount > 0 && visibleCount !== totalCount
          ? `${visibleCount} of ${totalCount} projects`
          : `${visibleCount || totalCount} curated projects`;
  }
}

// Lazy zone rendering: create list items only when zone is expanded
function _renderZoneListItems(container, projects) {
  if (container._itemsRendered) return;
  container._itemsRendered = true;
  const fragment = document.createDocumentFragment();
  projects.forEach(p => {
    if (isNaN(p.lat) || isNaN(p.lng) || p.lat === 0 || p.lng === 0) return;
    const item = document.createElement("div");
    item.className = "list-item";
    item.dataset.projectName = p.name;
    const isLongName = (p.name || "").length > 18;
    const nameClass = isLongName ? "long-text" : "";
    const devName = p.dev || "";
    const isLongDev = devName.length > 15;
    const devClass = isLongDev ? "dev-name long" : "dev-name";
    const routePlanner = window.RoutePlanner;
    const routeMeta = routePlanner && typeof routePlanner.getProjectRouteMeta === 'function'
      ? routePlanner.getProjectRouteMeta(p.name) : { classes: [], badges: [] };
    if (routeMeta.classes?.length) item.classList.add(...routeMeta.classes);
    const formatPrice = (price) => {
      if (!price) return '';
      if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
      if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
      return `${price}`;
    };
    const titleCase = (value) => String(value || '').replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
    const unitPreview = Array.isArray(p.unitTypes) && p.unitTypes.length
      ? p.unitTypes.slice(0, 2).join(' / ') : titleCase(p.type || 'Project');
    const sizePreview = Number.isFinite(p.areaMin)
      ? `${p.areaMin}${Number.isFinite(p.areaMax) ? `-${p.areaMax}` : '+'} sqm` : '';
    const financeLine = p.priceMin ? `From ${formatPrice(p.priceMin)} EGP` : 'Pricing on request';
    const planLine = [
      Number.isFinite(p.downPayment) ? `${p.downPayment}% DP` : '',
      Number.isFinite(p.installmentYears) && p.installmentYears > 0 ? `${p.installmentYears}Y plan` : sizePreview
    ].filter(Boolean).join(' • ') || 'Tap to inspect payment options';
    const encodedProjectName = encodeURIComponent(p.name);
    const badgesHtml = (routeMeta.badges || []).map(badge => `<span class="list-item-badge">${badge}</span>`).join('');
    item.innerHTML = `
      <div class="list-item-top">
        <span class="list-item-headline ${nameClass}">${p.name}</span>
        <span class="list-item-badges">${badgesHtml}</span>
      </div>
      <span class="${devClass}">${devName || p.zone || 'Developer pending'}</span>
      <div class="list-item-meta">
        <span class="list-item-chip emphasis">${p.zone || 'Egypt'}</span>
        <span class="list-item-chip">${titleCase(p.status || 'Available')}</span>
        <span class="list-item-chip subtle">${unitPreview}</span>
      </div>
      <div class="list-item-finance">
        <strong class="list-item-price">${financeLine}</strong>
        <span class="list-item-plan">${planLine}</span>
      </div>
      <div class="list-item-actions">
        <button type="button" class="list-action-btn" data-route-action="origin" data-project-token="${encodedProjectName}">Start</button>
        <button type="button" class="list-action-btn" data-route-action="stop" data-project-token="${encodedProjectName}">Stop</button>
        <button type="button" class="list-action-btn" data-route-action="destination" data-project-token="${encodedProjectName}">Finish</button>
      </div>
    `;
    item.querySelectorAll('.list-action-btn[data-route-action]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        event.preventDefault();
        routeProjectAction(decodeProjectToken(button.dataset.projectToken), button.dataset.routeAction);
      });
    });
    item.onclick = () => focusOnProject(p);
    fragment.appendChild(item);
  });
  container.appendChild(fragment);
  window.RoutePlanner?.invalidateProjectListCache?.();
  window.RoutePlanner?.syncProjectListHighlights?.(true);
}

async function renderProjects(projectList) {
  // Validate input
  if (!Array.isArray(projectList)) {
      console.warn('renderProjects called with invalid input');
      projectList = [];
  }
  
  console.log(`Rendering ${projectList.length} projects`);
  
  // Clear the markers tracking array for label toggle
  allMarkersWithTooltips = [];
  
  // Cache DOM references
  const listContainerEl = listContainer || document.getElementById("list-container");
  if (!listContainerEl) {
      console.warn('List container not found');
      return;
  }
  
  // Batch DOM operations
  listContainerEl.innerHTML = "";
    const totalProjects = window.projects ? window.projects.length : projectList.length;
    updateBrowseTelemetry(projectList.length, totalProjects);
  
  // Clear marker layers
  if (markerClusterGroup) markerClusterGroup.clearLayers();
  if (markerLayer) markerLayer.clearLayers();
  
  // Handle Heatmap
  if (heatmapLayer && map) {
      map.removeLayer(heatmapLayer);
      heatmapLayer = null;
  }

  if (isHeatmapMode && map) {
      const styles = getComputedStyle(document.documentElement);
      const gold = styles.getPropertyValue('--avaria-gold').trim() || '#667eea';
      const red = styles.getPropertyValue('--avaria-red').trim() || '#f093fb';

      if (!L.heatLayer) {
          try {
              await lazyLoadScript('https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js');
          } catch (e) {
              console.warn('Failed to load leaflet.heat:', e);
          }
      }
      if (L.heatLayer) {
          const heatPoints = projectList.map(p => [p.lat, p.lng, 1]);
          heatmapLayer = L.heatLayer(heatPoints, {
              radius: 25,
              blur: 15,
              maxZoom: 10,
              gradient: { 0.4: 'blue', 0.65: gold, 1.0: red }
          }).addTo(map);
      }
  }

  // Handle empty results - show "No results" message
  if (projectList.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "no-results";
      noResults.style.cssText = "text-align: center; padding: 40px 20px; color: var(--avaria-text-muted); font-size: 0.95rem;";
      noResults.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; margin-bottom: 15px;">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <div style="font-weight: 600; margin-bottom: 5px;">No projects found</div>
          <div style="font-size: 0.85rem;">Try adjusting your search or filters</div>
      `;
      listContainerEl.appendChild(noResults);
      return;
  }

  // Group by Zone using reduce for better performance
  const zones = projectList.reduce((acc, p) => {
      const zone = p.zone || "Other";
      if (!acc[zone]) acc[zone] = [];
      acc[zone].push(p);
      return acc;
  }, {});

  // Sort Zones
  const sortedZoneKeys = Object.keys(zones).sort((a, b) => {
      const order = ["North Coast", "Sokhna", "Gouna", "Somabay", "New Capital", "New Cairo", "October", "Zayed", "Shorouk"];
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
  });

  const allClusterMarkers = [];
  const allStandardMarkers = [];
  const mainFragment = document.createDocumentFragment();

  for (const zone of sortedZoneKeys) {
      // Removed await requestAnimationFrame to ensure synchronous full render
      // await new Promise(resolve => requestAnimationFrame(resolve));

    const header = document.createElement("div");
    header.className = "zone-header";
    const zoneCount = zones[zone].length;
    header.innerHTML = `<span class="zone-label">${zone}</span><span class="zone-header-meta"><span class="zone-count">${zoneCount}</span><span class="arrow"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span></span>`;
      
      const content = document.createElement("div");
      content.className = "zone-content";
      
    const isCollapsed = true;
      
      if (isCollapsed) {
          header.classList.add("collapsed");
          content.style.height = "0";
      } else {
          content.style.height = "auto";
      }

      // Store projects for lazy list-item creation when zone is expanded
      const zoneProjects = zones[zone];
      content._zoneProjects = zoneProjects;
      content._itemsRendered = false;

      header.onclick = (e) => {
          if (e) e.stopPropagation();
          const isClosed = header.classList.contains("collapsed");
          if (isClosed) {
              header.classList.remove("collapsed");
              // Lazy: create list items on first expand
              _renderZoneListItems(content, content._zoneProjects);
              gsap.to(content, { height: "auto", duration: 0.4, ease: "power2.out" });
          } else {
              header.classList.add("collapsed");
              gsap.to(content, { height: 0, duration: 0.4, ease: "power2.in" });
          }
      };

      mainFragment.appendChild(header);
      mainFragment.appendChild(content);

      // Create markers for ALL projects (map always needs them)
      const formatPrice = (price) => {
        if (!price) return '';
        if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
        if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
        return `${price}`;
      };
      zoneProjects.forEach(p => {
            try {
              // Validate Coordinates
              if (isNaN(p.lat) || isNaN(p.lng) || p.lat === 0 || p.lng === 0) {
                  return;
              }
              const encodedProjectName = encodeURIComponent(p.name);

              // Marker Logic
              const isLandmark = p.type === "landmark";
              let baseClass = isLandmark ? "custom-marker landmark" : "custom-marker";
              const z = (p.zone || "").toLowerCase();
              const t = (p.type || "").toLowerCase();
              if (z.includes("north coast") || z.includes("sokhna") || z.includes("galala") || z.includes("ras")) {
                  baseClass += " coastal";
              } else if (t.includes("commercial") || t.includes("mall") || t.includes("office") || t.includes("admin")) {
                  baseClass += " commercial";
              } else {
                  if (!isLandmark) baseClass += " residential";
              }

              const iconSize = isLandmark ? [16, 16] : [12, 12];
              let inlineStyle = "";
              if (p.tempColor) {
                  inlineStyle = `background-color: ${p.tempColor} !important; box-shadow: 0 0 10px ${p.tempColor} !important; border-color: #fff;`;
              }
              const markerHtml = `<div class="${baseClass}" style="${inlineStyle} width:100%; height:100%;"></div>`;

              const marker = L.marker([p.lat, p.lng], {
                icon: L.divIcon({
                  className: '',
                  html: markerHtml,
                  iconSize: iconSize,
                  iconAnchor: [6, 6]
                })
              });
              
              const standardMarker = L.marker([p.lat, p.lng], {
                icon: L.divIcon({
                  className: '',
                  html: markerHtml,
                  iconSize: iconSize,
                  iconAnchor: [6, 6]
                })
              });

              // Popups and Events
              const waLink = getWhatsAppLink(p);
              const isFav = isFavorite(p.name);
              const heartIcon = isFav ? XI.heart : XI.heartEmpty;
              const heartColor = isFav ? "var(--avaria-red)" : "var(--avaria-gold)";
              
              const priceDisplay = p.priceMin ? `
                <div class="popup-price">
                  ${XI.tag} ${i18n.currentLang === 'ar' ? 'يبدأ من' : 'From'} <strong>${formatPrice(p.priceMin)} EGP</strong>
                </div>` : '';
              
              // Payment plan display
              const paymentDisplay = p.paymentPlan ? `
                <div class="popup-payment">
                  ${XI.creditCard} ${p.paymentPlan}
                </div>` : '';
              
                            const popupContent = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="popup-title" style="margin-bottom: 0;">${p.name}</div>
                                                                        <button class="fav-btn" data-project="${p.name}" onclick="toggleFavoriteEncoded('${encodedProjectName}')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; color: ${heartColor};">
                      ${heartIcon}
                  </button>
                </div>
                <div class="popup-dev">${p.dev}</div>
                ${priceDisplay}
                ${paymentDisplay}
                                                                <button onclick="addToCompareEncoded('${encodedProjectName}')" class="popup-btn">Add to Compare</button>
                                <div class="route-popup-actions">
                                                                        <button onclick="routeProjectActionEncoded('${encodedProjectName}', 'origin')" class="popup-route-btn">Start</button>
                                                                        <button onclick="routeProjectActionEncoded('${encodedProjectName}', 'destination')" class="popup-route-btn">Destination</button>
                                                                        <button onclick="routeProjectActionEncoded('${encodedProjectName}', 'stop')" class="popup-route-btn">Stop</button>
                                </div>
                <a href="${waLink}" target="_blank" class="whatsapp-btn" style="text-decoration: none;">
                  ${XI.whatsapp} WhatsApp
                </a>
              `;

              marker.bindPopup(popupContent, { 
                  closeOnClick: false,
                  autoClose: false 
              });
              standardMarker.bindPopup(popupContent, { 
                  closeOnClick: false,
                  autoClose: false 
              });

              const tooltipOptions = {
                  direction: 'top',
                  offset: [0, -10],
                  className: 'custom-tooltip',
                  opacity: 0.9,
                  permanent: isLabelsAlwaysVisible
              };
              marker.bindTooltip(p.name, tooltipOptions);
              standardMarker.bindTooltip(p.name, tooltipOptions);
              
              const clickHandler = () => {
                  focusOnProject(p);
              };
              marker.on('click', clickHandler);
              standardMarker.on('click', clickHandler);

              // Hover for 3 seconds to show popup with options
              let hoverTimeout = null;
              let closeTimeout = null;
              let isPopupHovered = false;
              
              const setupPopupHoverListeners = (targetMarker) => {
                  targetMarker.on('popupopen', (e) => {
                      const popupEl = e.popup.getElement();
                      if (popupEl) {
                          popupEl.addEventListener('mouseenter', () => {
                              isPopupHovered = true;
                              if (closeTimeout) {
                                  clearTimeout(closeTimeout);
                                  closeTimeout = null;
                              }
                          });
                          popupEl.addEventListener('mouseleave', () => {
                              isPopupHovered = false;
                              closeTimeout = setTimeout(() => {
                                  if (!isPopupHovered) {
                                      safeCloseMarkerPopup(targetMarker);
                                  }
                              }, 300);
                          });
                      }
                  });
              };
              
              setupPopupHoverListeners(marker);
              setupPopupHoverListeners(standardMarker);
              
              const hoverHandler = (e) => {
                  NeuralView.activate(p);
                  // Cancel any pending close
                  if (closeTimeout) {
                      clearTimeout(closeTimeout);
                      closeTimeout = null;
                  }
                  // Start 1.3-second timer to show popup
                  if (!hoverTimeout) {
                      hoverTimeout = setTimeout(() => {
                          safeOpenMarkerPopup(e.target);
                          hoverTimeout = null;
                      }, 1300);
                  }
              };
              
              const outHandler = (e) => {
                  NeuralView.deactivate();
                  // Cancel timer if mouse leaves before 1.3 seconds
                  if (hoverTimeout) {
                      clearTimeout(hoverTimeout);
                      hoverTimeout = null;
                  }
                  // Delay popup close to allow moving to popup
                  closeTimeout = setTimeout(() => {
                      if (!isPopupHovered) {
                          safeCloseMarkerPopup(e.target);
                      }
                  }, 300);
              };
              
              marker.on('mouseover', hoverHandler);
              marker.on('mouseout', outHandler);
              standardMarker.on('mouseover', hoverHandler);
              standardMarker.on('mouseout', outHandler);
              
              p.clusterMarker = marker;
              p.normalMarker = standardMarker;
              p.marker = marker;

              allClusterMarkers.push(marker);
              allStandardMarkers.push(standardMarker);
              
              // Track markers for quick label toggle (only markers with tooltips)
              allMarkersWithTooltips.push(marker, standardMarker);

              if (p.type === "landmark") {
                  const labelIcon = L.divIcon({
                      className: "landmark-label",
                      html: p.name,
                      iconSize: [120, 20],
                      iconAnchor: [60, -10],
                  });
                  const labelMarker = L.marker([p.lat, p.lng], { icon: labelIcon });
                  const stdLabelMarker = L.marker([p.lat, p.lng], { icon: labelIcon });
                  allClusterMarkers.push(labelMarker);
                  allStandardMarkers.push(stdLabelMarker);
              }
            } catch (err) {
                console.error(`Error rendering project ${p.name}:`, err);
            }
      });
  }
  
  listContainerEl.appendChild(mainFragment);
  
  // Ensure layers are cleared before adding new ones
  markerClusterGroup.clearLayers();
  markerLayer.clearLayers();

  markerClusterGroup.addLayers(allClusterMarkers);
  allStandardMarkers.forEach(m => m.addTo(markerLayer));
  
  if (isHeatmapMode) {
      if (map.hasLayer(markerClusterGroup)) map.removeLayer(markerClusterGroup);
      if (map.hasLayer(markerLayer)) map.removeLayer(markerLayer);
  } else {
      if (isClusterView) {
          if (!map.hasLayer(markerClusterGroup)) map.addLayer(markerClusterGroup);
          if (map.hasLayer(markerLayer)) map.removeLayer(markerLayer);
      } else {
          if (!map.hasLayer(markerLayer)) map.addLayer(markerLayer);
          if (map.hasLayer(markerClusterGroup)) map.removeLayer(markerClusterGroup);
      }
  }
}

// --- CINEMATIC TOUR ---
function safeCloseMapPopup() {
    if (!map) return;

    try {
        map.closePopup();
    } catch (error) {
        console.warn('Popup close skipped:', error?.message || error);
    }
}

function safeStopMapMotion() {
    if (!map) return;

    try {
        map.stop();
    } catch (error) {
        console.warn('Map stop skipped:', error?.message || error);
    }
}

function canSafelyToggleMarkerPopup(marker) {
    return Boolean(marker && marker._map && marker._icon && typeof marker.getPopup === 'function' && marker.getPopup());
}

function safeOpenMarkerPopup(marker) {
    if (!canSafelyToggleMarkerPopup(marker)) return false;

    try {
        marker.openPopup();
        return true;
    } catch (error) {
        console.warn('Marker popup open skipped:', error?.message || error);
        return false;
    }
}

function safeCloseMarkerPopup(marker) {
    if (!canSafelyToggleMarkerPopup(marker)) return false;

    try {
        marker.closePopup();
        return true;
    } catch (error) {
        console.warn('Marker popup close skipped:', error?.message || error);
        return false;
    }
}

let qrCodeLoaderPromise = null;

async function ensureQRCodeLibrary() {
    if (typeof window.qrcode === 'function') {
        return true;
    }

    if (!qrCodeLoaderPromise) {
        qrCodeLoaderPromise = new Promise(resolve => {
            const script = document.createElement('script');
            script.src = '/node_modules/qrcode-generator/qrcode.js';
            script.async = true;
            script.onload = () => resolve(typeof window.qrcode === 'function');
            script.onerror = () => resolve(false);
            document.head.appendChild(script);
        });
    }

    return qrCodeLoaderPromise;
}

async function createQRCodeDataUrl(text) {
    const qrReady = await ensureQRCodeLibrary();
    if (!qrReady || typeof window.qrcode !== 'function') {
        return null;
    }

    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();

    const cellSize = 4;
    const moduleCount = qr.getModuleCount();
    const canvas = document.createElement('canvas');
    canvas.width = moduleCount * cellSize;
    canvas.height = moduleCount * cellSize;

    const context = canvas.getContext('2d');
    if (!context) {
        return null;
    }

    qr.renderTo2dContext(context, cellSize);
    return canvas.toDataURL('image/png');
}

function startCinematicTour() {
    return RoutePlanner.startTour();
}

function pauseCinematicTour() {
    return RoutePlanner.pauseTour();
}

function continueCinematicTour() {
    return RoutePlanner.resumeTour();
}

function endCinematicTour() {
    return RoutePlanner.endTour();
}

// --- AI CONCIERGE SEARCH (LEVEL 1000 - GOD MODE V2) ---
function parseNaturalLanguageSearch(query) {
  const criteria = {
    minInstallments: null,
    maxDownPayment: null,
    minArea: null,
    unitType: null,
    zone: null,
    status: null,
    developer: null,
    amenities: [],
    sortBy: null,
    negations: [],
    text: query,
    detectedFilters: []
  };

  const lowerQuery = query.toLowerCase();
  // Split by spaces but keep empty strings to know if user is typing a new word
  const tokens = lowerQuery.split(/\s+/).filter(t => t.length > 0);
  const uniqueFilters = new Set();
  // --- 1. PARSE NEGATIONS FIRST ---
  const negationIndices = [];
  tokens.forEach((t, i) => {
      if (["no", "not", "except"].includes(t) && i + 1 < tokens.length) {
          const negatedTerm = tokens[i+1];
          uniqueFilters.add(`Exclude: ${negatedTerm}`);
          negationIndices.push(i, i+1);
      }
  });
  const positiveTokens = tokens.filter((_, i) => !negationIndices.includes(i));
  const positiveQuery = positiveTokens.join(" ");

  // --- 2. PARTIAL NUMBER PARSING ---
  // Installments: "8y", "8 y", "8 yea"
  const yearsMatch = positiveQuery.match(/(\d+)\s*y/); 
  if (yearsMatch) {
    criteria.minInstallments = parseInt(yearsMatch[1], 10);
    uniqueFilters.add(`${criteria.minInstallments}+ Years`);
    }

  // Down Payment: "10%", "10% down", "10% payment", "10% dp", "10 dp", "10 down payment"
  const dpMatch = positiveQuery.match(/(\d+)\s*%\s*(?:down|dp|payment|d)?|(\d+)\s*(?:dp|down\s*payment|down)/i);
  if (dpMatch) {
      const val = parseInt(dpMatch[1] || dpMatch[2], 10);
      if (val <= 60) { // Sanity check
                    criteria.maxDownPayment = val;
                    uniqueFilters.add(`Max ${criteria.maxDownPayment}% DP`);
      }
    }

  // Area: "100m", "100 m", "100" (if > 60 and not years)
  const areaMatch = positiveQuery.match(/(\d+)\s*m|(\d+)\s*sq/);
  if (areaMatch) {
      criteria.minArea = parseInt(areaMatch[1] || areaMatch[2], 10);
      uniqueFilters.add(`Min ${criteria.minArea}m²`);
    } else {
      // Heuristic: Standalone large number -> Area
      const standaloneNum = positiveQuery.match(/\b(\d{3,})\b/);
            if (standaloneNum) {
                    criteria.minArea = parseInt(standaloneNum[1], 10);
                    uniqueFilters.add(`Min ${criteria.minArea}m²`);
      }
  }

  // --- 3. PARTIAL KEYWORD MATCHING (Token Iteration) ---
  positiveTokens.forEach(t => {
      if (t.length < 3) return; // Skip very short tokens unless specific

      // Unit Types (Partial)
      if ("chalet".startsWith(t)) { criteria.unitType = "chalet"; uniqueFilters.add("Chalets"); }
      else if ("villa".startsWith(t) || "stand".startsWith(t)) { criteria.unitType = "villa"; uniqueFilters.add("Villas"); }
      else if ("apartment".startsWith(t) || "flat".startsWith(t) || "condo".startsWith(t)) { criteria.unitType = "apartment"; uniqueFilters.add("Apartments"); }
      else if ("townhouse".startsWith(t)) { criteria.unitType = "townhouse"; uniqueFilters.add("Townhouses"); }
      else if ("twin".startsWith(t)) { criteria.unitType = "twin"; uniqueFilters.add("Twin Houses"); }
      else if ("duplex".startsWith(t)) { criteria.unitType = "duplex"; uniqueFilters.add("Duplexes"); }
      else if ("studio".startsWith(t)) { criteria.unitType = "studio"; uniqueFilters.add("Studios"); }
      else if ("commercial".startsWith(t) || "retail".startsWith(t) || "mall".startsWith(t)) { criteria.unitType = "commercial"; uniqueFilters.add("Commercial"); }
      else if ("office".startsWith(t) || "admin".startsWith(t)) { criteria.unitType = "office"; uniqueFilters.add("Offices"); }
      else if ("clinic".startsWith(t) || "medical".startsWith(t)) { criteria.unitType = "clinic"; uniqueFilters.add("Clinics"); }
      else if ("cabin".startsWith(t)) { criteria.unitType = "cabin"; uniqueFilters.add("Cabins"); }
      else if ("penthouse".startsWith(t) || "roof".startsWith(t)) { criteria.unitType = "penthouse"; uniqueFilters.add("Penthouses"); }

      // Zones (Partial)
      if ("north".startsWith(t) || "sahel".startsWith(t) || "alamein".startsWith(t) || "ras".startsWith(t)) { 
          criteria.zone = "north coast"; 
          uniqueFilters.add("North Coast"); 
      }
      else if ("sokhna".startsWith(t) || "galala".startsWith(t) || "red".startsWith(t)) { 
          criteria.zone = "sokhna"; 
          uniqueFilters.add("Ain Sokhna"); 
      }
      else if ("gouna".startsWith(t)) { 
          criteria.zone = "gouna"; 
          uniqueFilters.add("El Gouna"); 
      }
      else if ("capital".startsWith(t) || "administrative".startsWith(t)) { 
          criteria.zone = "new capital"; 
          uniqueFilters.add("New Capital"); 
      }
      else if ("october".startsWith(t) || "zayed".startsWith(t) || "sheikh".startsWith(t) || "west".startsWith(t) || "pyramids".startsWith(t)) { 
          criteria.zone = "october"; 
          uniqueFilters.add("6th of October"); 
      }
      else if ("cairo".startsWith(t) || "tagamoa".startsWith(t) || "fifth".startsWith(t)) { 
          criteria.zone = "new cairo"; 
          uniqueFilters.add("New Cairo"); 
      }

      // Status
      if ("ready".startsWith(t) || "delivered".startsWith(t) || "move".startsWith(t)) { 
          criteria.status = "delivered"; 
          uniqueFilters.add("Ready to Move"); 
      }
      else if ("construction".startsWith(t) || "under".startsWith(t)) { 
          criteria.status = "construction"; 
          uniqueFilters.add("Under Construction"); 
      }

      // Amenities
      if ("lagoon".startsWith(t)) { criteria.amenities.push("lagoon"); uniqueFilters.add("Lagoon"); }
      if ("sea".startsWith(t) || "view".startsWith(t)) { criteria.amenities.push("sea view"); uniqueFilters.add("Sea View"); }
      if ("pool".startsWith(t)) { criteria.amenities.push("pool"); uniqueFilters.add("Pool"); }
      if ("golf".startsWith(t)) { criteria.amenities.push("golf"); uniqueFilters.add("Golf"); }
  });

  // --- 4. DEVELOPER (Heuristic) ---
  const byIndex = positiveTokens.indexOf("by");
  if (byIndex !== -1 && byIndex + 1 < positiveTokens.length) {
      const devName = positiveTokens[byIndex + 1];
      criteria.developer = devName;
      uniqueFilters.add(`Dev: ${devName}`);
  }

  // --- 5. SORTING ---
  if (positiveQuery.includes("sort") || positiveQuery.includes("order") || positiveQuery.includes("most") || positiveQuery.includes("least")) {
       if (positiveQuery.includes("install") || positiveQuery.includes("pay")) criteria.sortBy = 'installments-desc';
       if (positiveQuery.includes("price") || positiveQuery.includes("cheap") || positiveQuery.includes("low")) criteria.sortBy = 'dp-asc';
       if (positiveQuery.includes("area") || positiveQuery.includes("big") || positiveQuery.includes("large")) criteria.sortBy = 'area-desc';
       if (positiveQuery.includes("small")) criteria.sortBy = 'area-asc';
  }

  criteria.detectedFilters = Array.from(uniqueFilters);
  return criteria;
}

function filterProjects() {
  const searchInputEl = searchInput || document.getElementById("searchInput");
  const query = searchInputEl ? searchInputEl.value : "";
  const feedbackContainer = document.getElementById("ai-feedback");

  // 1. Handle Empty Query (Clear Search) - Run on Main Thread for speed
  if (!query || query.length === 0) {
      if (feedbackContainer) feedbackContainer.innerHTML = "";
      
      // Reset to all projects (filtered by active category)
      let results = window.projects || [];
      results = applyActiveFilter(results);
      
      // Apply Advanced Filters
      if (typeof AdvancedFilters !== 'undefined' && AdvancedFilters.countActiveFilters() > 0) {
          results = AdvancedFilters.filterResults(results);
      }
      
      renderProjects(results);
      return;
  }
  
  // 2. Handle Active Search via Worker
  if (searchWorker) {
      console.log('Sending search to worker:', query);
      
      // Set a timeout fallback in case worker doesn't respond
      const workerTimeout = setTimeout(() => {
          console.warn('Worker timeout - falling back to main thread search');
          fallbackMainThreadSearch(query);
      }, 3000);
      
      // Store timeout ID to clear on response
      window._searchWorkerTimeout = workerTimeout;
      
      searchWorker.postMessage({
          type: 'SEARCH',
          payload: { query: query }
      });
      return;
  }

  // Fallback to Main Thread Logic (if worker fails or not supported)
  fallbackMainThreadSearch(query);
}

function fallbackMainThreadSearch(query) {
  const feedbackContainer = document.getElementById("ai-feedback");
  if (feedbackContainer) feedbackContainer.innerHTML = "";
  
  // Ensure we are using the latest global data
  let results = window.projects || [];

  // AI Concierge Logic
  if (query.length > 0) {
    const criteria = parseNaturalLanguageSearch(query);
    
    // Display Detected Filters
    criteria.detectedFilters.forEach(filter => {
      const tag = document.createElement("span");
      // Styles are now handled by CSS (#ai-feedback span)
      tag.innerText = filter;
      feedbackContainer.appendChild(tag);
    });

    // 1. Filter by Zone
    if (criteria.zone) {
      results = results.filter(p => {
          const z = p.zone.toLowerCase();
          if (criteria.zone === "sokhna") return z.includes("sokhna") || z.includes("galala");
          if (criteria.zone === "north coast") return z.includes("north") || z.includes("ras");
          if (criteria.zone === "gouna") return z.includes("gouna");
          if (criteria.zone === "new capital") return z.includes("capital");
          if (criteria.zone === "october") return z.includes("october") || z.includes("zayed");
          if (criteria.zone === "new cairo") return z.includes("new cairo");
          return false;
      });
    }

    // 2. Filter by Installments
    if (criteria.minInstallments !== null) {
      results = results.filter(p => {
          return p.maxInstallmentYears && p.maxInstallmentYears >= criteria.minInstallments;
      });
    }

    // 3. Filter by Down Payment
    if (criteria.maxDownPayment !== null) {
      results = results.filter(p => {
          return p.minDownPayment !== undefined && p.minDownPayment <= criteria.maxDownPayment;
      });
    }

    // 4. Filter by Area
    if (criteria.minArea !== null) {
      results = results.filter(p => {
          return p.minArea && p.minArea >= criteria.minArea;
      });
    }

    // 5. Filter by Unit Type
    if (criteria.unitType) {
      results = results.filter(p => {
          const details = projectDetails[p.name];
          if (!details || !details.unitTypes) return false;
          return details.unitTypes.toLowerCase().includes(criteria.unitType);
      });
    }

    // 6. Filter by Status
    if (criteria.status) {
      results = results.filter(p => {
          const details = projectDetails[p.name];
          if (!details || !details.status) return false;
          const s = details.status.toLowerCase();
          if (criteria.status === "delivered") return s.includes("delivered") || s.includes("ready");
          if (criteria.status === "construction") return s.includes("construction");
          return false;
      });
    }

    // 7. Filter by Amenities
    if (criteria.amenities.length > 0) {
      results = results.filter(p => {
          const details = projectDetails[p.name];
          if (!details || !details.amenities) return false;
          const am = details.amenities.toLowerCase();
          return criteria.amenities.some(req => am.includes(req));
      });
    }

    // 8. Filter by Developer
    if (criteria.developer) {
      const devQuery = criteria.developer.toLowerCase();
      results = results.filter(p => {
          return p.dev && p.dev.toLowerCase().includes(devQuery);
      });
    }
    
    // 9. Apply Negations (Partial Match)
    if (criteria.negations.length > 0) {
       results = results.filter(p => {
          const details = projectDetails[p.name] || {};
          const fullText = (p.name + " " + p.zone + " " + (details.unitTypes||"") + " " + (details.amenities||"")).toLowerCase();
          // Check if any negation term partially matches the text
          return !criteria.negations.some(neg => fullText.includes(neg));
       });
    }

    // 10. Apply Sorting
    if (criteria.sortBy) {
       results.sort((a, b) => {
           if (criteria.sortBy === 'installments-desc') {
               return (b.maxInstallmentYears || 0) - (a.maxInstallmentYears || 0);
           }
           if (criteria.sortBy === 'dp-asc') {
               const dpA = a.minDownPayment !== undefined ? a.minDownPayment : 999;
               const dpB = b.minDownPayment !== undefined ? b.minDownPayment : 999;
               return dpA - dpB;
           }
           if (criteria.sortBy === 'area-desc') {
               return (b.minArea || 0) - (a.minArea || 0);
           }
           if (criteria.sortBy === 'area-asc') {
               const areaA = a.minArea !== undefined ? a.minArea : 99999;
               const areaB = b.minArea !== undefined ? b.minArea : 99999;
               return areaA - areaB;
           }
           return 0;
       });
    }

    // Fallback: If NO criteria detected but text exists, use Fuse
    if (criteria.detectedFilters.length === 0 && fuse) {
       results = fuse.search(query).map(r => r.item);
    }
  }

  // 2. Category Filter (Button Filters - AND logic with search)
  if (activeFilter !== 'all') {
    results = results.filter(p => {
      const details = projectDetails[p.name] || {};
      const status = (details.status || "").toLowerCase();
      const type = (details.unitTypes || "").toLowerCase();
      
      if (activeFilter === 'delivered') return status.includes('delivered') || status.includes('ready');
      if (activeFilter === 'construction') return status.includes('construction');
      if (activeFilter === 'chalets') return type.includes('chalets');
      if (activeFilter === 'villas') return type.includes('villas');
      return true;
    });
  }

  // 3. Map Bounds Filter (Optimization)
  // Only filter by bounds if no search query is active to allow finding things outside view
  // AND if the user hasn't explicitly asked for "all" via a button (though buttons usually imply a filter).
  // Actually, the user wants "all dots visible".
  // If we filter `results` here, `renderProjects` will only draw markers for `results`.
  // This contradicts "all dots visible".
  
  // To achieve "All dots visible" + "List updates on zoom":
  // We must NOT filter `results` by bounds here if we want markers to stay.
  // BUT the user said "data will only start loading when i start zooming".
  
  // Let's assume they want the LIST to be filtered.
  // We will pass a second argument to renderProjects?
  
  // For now, I will DISABLE the bounds filter on the main `results` array 
  // so that ALL markers appear (satisfying "make the number and dots appears as before").
  // The "loading on zoom" might just be satisfied by the fact that we are now loading everything upfront again.
  
  /* 
  if (!query && map.getBounds()) {
      const bounds = map.getBounds();
      results = results.filter(p => {
          if (!p.lat || !p.lng) return false;
          return bounds.contains([p.lat, p.lng]);
      });
  }
  */

  // 3. Apply Advanced Filters
  if (typeof AdvancedFilters !== 'undefined' && AdvancedFilters.countActiveFilters() > 0) {
      results = AdvancedFilters.filterResults(results);
  }

  try {
      renderProjects(results);
  } catch (renderErr) {
      console.error("Render Projects Error:", renderErr);
  }
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Event Listeners with optimized debounce
const searchInputEl = searchInput || document.getElementById('searchInput');
if (searchInputEl) {
    // Use standard event listener - passive is not needed for input events
    searchInputEl.addEventListener("input", debounce(() => {
        // Clear AI feedback on manual input
        const feedback = document.getElementById('ai-feedback');
        if (feedback) feedback.innerHTML = '';
        filterProjects();
    }, 250));
}

// Search Focus Animations with null checks
if (searchInputEl) {
    searchInputEl.addEventListener("focus", () => {
        const mapEl = document.getElementById("map");
        const listEl = document.getElementById("list-container");
        if (mapEl) mapEl.classList.add("blur-focus");
        if (listEl) listEl.classList.add("blur-focus");
        
        if (typeof gsap !== 'undefined') {
            gsap.to(searchInputEl, { 
                scale: 1.02, 
                boxShadow: "0 0 25px color-mix(in srgb, var(--avaria-gold), transparent 60%)", 
                duration: 0.4,
                ease: "power2.out"
            });
        }
    }, { passive: true });

    searchInputEl.addEventListener("blur", () => {
        const mapEl = document.getElementById("map");
        const listEl = document.getElementById("list-container");
        if (mapEl) mapEl.classList.remove("blur-focus");
        if (listEl) listEl.classList.remove("blur-focus");
        
        if (typeof gsap !== 'undefined') {
            gsap.to(searchInputEl, { 
                scale: 1, 
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)", 
                duration: 0.4,
                ease: "power2.out"
            });
        }
    }, { passive: true });
}

// --- VOICE COMMAND INTERFACE ---
const voiceBtn = document.getElementById('voice-command-btn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && voiceBtn) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  voiceBtn.addEventListener('click', () => {
      if (voiceBtn.classList.contains('listening')) {
          recognition.stop();
      } else {
          recognition.start();
      }
  });

  recognition.onstart = () => {
      voiceBtn.classList.add('listening');
      searchInput.placeholder = "Listening...";
  };

  recognition.onend = () => {
      voiceBtn.classList.remove('listening');
      searchInput.placeholder = "Ask AI Concierge (e.g., 'Villas in Sahel with 8 years')";
  };

  recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();

      if (searchInput) searchInput.value = transcript; // Show what was heard
      
      try {
          processVoiceCommand(transcript);
      } catch (err) {
          console.error("Error processing voice command:", err);
      }
  };

  recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      voiceBtn.classList.remove('listening');
      if (searchInput) searchInput.placeholder = "Error. Try again.";
  };
} else {
  if (voiceBtn) voiceBtn.style.display = 'none';
  console.warn("Web Speech API not supported in this browser or voice button missing.");
}

function processVoiceCommand(command) {
  try {
      // 1. Navigation Commands
      if (command.includes('go to') || command.includes('fly to') || command.includes('zoom to')) {
          if (command.includes('north coast') || command.includes('sahel')) {
              flyToRegion(30.9, 28.5, 9);
          } else if (command.includes('sokhna') || command.includes('galala')) {
              flyToRegion(29.6, 32.4, 10);
          } else if (command.includes('gouna')) {
              flyToRegion(27.39, 33.67, 12);
          } else if (command.includes('capital')) {
              flyToRegion(30.0, 31.7, 11);
          } else if (command.includes('october') || command.includes('zayed')) {
              flyToRegion(30.0, 30.9, 11);
          } else if (command.includes('cairo') || command.includes('tagamoa')) {
              flyToRegion(30.05, 31.5, 11);
          }
          return;
      }

      // 2. Reset Command
      if (command.includes('reset') || command.includes('clear')) {
          const btn = document.querySelector(`.filter-btn[data-filter="all"]`);
          if (btn) btn.click();
          if (searchInput) searchInput.value = "";
          filterProjects();
          return;
      }

      // 3. Explicit "Show me [Project]" Command
      if (command.includes('show me') || command.includes('find project')) {
          const projectName = command.replace('show me', '').replace('find project', '').trim();
          handleSmartSearch(projectName);
          return;
      }

      // 4. Intelligent Routing (Filter vs. Search)
      // Check if the command contains filterable keywords using our existing parser
      const criteria = parseNaturalLanguageSearch(command);
      
      if (criteria.detectedFilters.length > 0) {
          // It's a filter query (e.g., "Villas in Sahel")

          filterProjects(); 
      } else {
          // No filters detected, treat as a potential project name search
          // But if it's a long sentence, it might just be a failed filter
          if (command.split(' ').length > 4) {
               // Long query with no filters? Just try standard filter/search
               filterProjects();
          } else {
               // Short query? Try smart fuzzy search
               handleSmartSearch(command);
          }
      }
  } catch (err) {
      console.error("Process Voice Command Error:", err);
      // Fallback
      filterProjects();
  }
}

function handleSmartSearch(query) {
  try {
      const feedbackContainer = document.getElementById('ai-feedback');
      if (!feedbackContainer) return;
      
      feedbackContainer.innerHTML = ''; // Clear previous

      if (!query || query.length < 2) {
          filterProjects();
          return;
      }

      if (!fuse) {
          console.error("Fuse.js not initialized");
          filterProjects();
          return;
      }

      // Use Fuse.js to find matches
      const results = fuse.search(query);
      
      if (results.length === 0) {
          feedbackContainer.innerHTML = '<span style="color: var(--avaria-red); font-size: 0.8rem;">No matches found. Try a different name.</span>';
          filterProjects(); // Run standard filter anyway
          return;
      }

      const topMatch = results[0];
      
      // Thresholds for "Confidence"
      // Fuse score: 0 is perfect, 1 is mismatch
      const CONFIDENCE_THRESHOLD = 0.25; 

      if (topMatch.score < CONFIDENCE_THRESHOLD && results.length === 1) {
          // High confidence, single result -> Auto-execute
          focusOnProject(topMatch.item);
          feedbackContainer.innerHTML = `<span style="color: var(--avaria-gold); font-size: 0.8rem;">Found: ${topMatch.item.name}</span>`;
      } else {
          // Ambiguous or multiple good matches -> Suggest Options
          const suggestions = results.slice(0, 3);
          
          const label = document.createElement('span');
          label.innerText = "Did you mean: ";
          label.style.color = "var(--avaria-text-muted)";
          label.style.fontSize = "0.8rem";
          label.style.alignSelf = "center";
          feedbackContainer.appendChild(label);

          suggestions.forEach(res => {
              const btn = document.createElement('button');
              btn.innerText = res.item.name;
              btn.style.background = "rgba(255,255,255,0.1)";
              btn.style.border = "1px solid var(--avaria-gold)";
              btn.style.color = "var(--avaria-text)";
              btn.style.borderRadius = "12px";
              btn.style.padding = "4px 10px";
              btn.style.cursor = "pointer";
              btn.style.fontSize = "0.75rem";
              btn.style.transition = "all 0.2s";
              
              btn.onmouseover = () => {
                  btn.style.background = "var(--avaria-gold)";
                  btn.style.color = "var(--avaria-bg)";
              };
              btn.onmouseout = () => {
                  btn.style.background = "rgba(255,255,255,0.1)";
                  btn.style.color = "var(--avaria-text)";
              };
              
              btn.onclick = () => {
                  if (searchInput) searchInput.value = res.item.name; // Update input
                  focusOnProject(res.item);
                  if (feedbackContainer) feedbackContainer.innerHTML = ''; // Clear suggestions
              };
              
              feedbackContainer.appendChild(btn);
          });
          
          // Also filter the list to show these results
          // We can manually trigger renderProjects with just these items
          const matchedProjects = suggestions.map(s => s.item);
          renderProjects(matchedProjects);
      }
  } catch (err) {
      console.error("Error in handleSmartSearch:", err);
      filterProjects(); // Fallback
  }
}

filterBtns.forEach(btn => {
  btn.addEventListener("click", (e) => {
    filterBtns.forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    activeFilter = e.target.dataset.filter;
    filterProjects();
  });
});

// --- SELECTION & RADIUS LOGIC ---
let currentRadiusCircle = null;

function openProjectHover(p, options = {}) {
    if (!p) return;

    const preferDirect = options.preferDirect === true;

    const targetMarker = isClusterView ? p.clusterMarker : p.normalMarker;
    if (!targetMarker) return;

    safeCloseMapPopup();

    if (preferDirect) {
        if (safeOpenMarkerPopup(targetMarker)) {
            return;
        }
    }

    if (isClusterView && markerClusterGroup?.zoomToShowLayer) {
        markerClusterGroup.zoomToShowLayer(targetMarker, function() {
            safeOpenMarkerPopup(targetMarker);
        });
    } else {
            safeOpenMarkerPopup(targetMarker);
    }
}

function focusOnProject(p, options = {}) {
  try {
    if (!p || !p.lat || !p.lng) {
      console.warn('Invalid project for focusOnProject:', p);
      return;
    }

        const {
            showModal = true,
            updateHash = true,
            collapseSidebar = true,
            drawRadius = true,
            openPopup = true
        } = options;
    
    // Update URL Hash for sharing
        if (updateHash) {
            window.location.hash = `project=${encodeURIComponent(p.name)}`;
        }

    if (map) {
      map.flyTo([p.lat, p.lng], 15, {
        duration: 2,
        easeLinearity: 0.25
      });
    }
    
    // Draw 10km Radius Circle - always clean up previous
        if (currentRadiusCircle && map) {
      map.removeLayer(currentRadiusCircle);
      currentRadiusCircle = null;
    }
    
        if (drawRadius && map) {
      currentRadiusCircle = L.circle([p.lat, p.lng], {
        radius: 10000, // 10km in meters
        color: 'var(--avaria-gold)',
        fillColor: 'var(--avaria-gold)',
        fillOpacity: 0.1,
        weight: 1,
        dashArray: '5, 10'
      }).addTo(map);
    }

        if (openPopup) {
            openProjectHover(p);
        } else {
            safeCloseMapPopup();
    }

    // Auto-collapse sidebar
    const sidebar = document.getElementById("sidebar");
        if (collapseSidebar && sidebar && !sidebar.classList.contains("collapsed")) {
        toggleSidebar();
        sidebarAutoCollapsed = true;
    } else {
        sidebarAutoCollapsed = false;
        const externalSig = document.getElementById('external-signature');
        if (externalSig && typeof gsap !== 'undefined') gsap.to(externalSig, { opacity: 1, duration: 1 });
    }

        if (showModal) {
            openModal(p);
        } else {
            closeModal();
        }
        if (window.RoutePlanner?.syncProjectListHighlights) {
                window.RoutePlanner.syncProjectListHighlights();
        }
        updateBrowseTelemetry();
  } catch (err) {
    console.error('Error in focusOnProject:', err);
  }
}

// Initialize Neural View
NeuralView.init(map);

// Initial Render
renderProjects(projects);

// Check for URL Hash on Load (Deep Linking)
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    if (hash && hash.includes('project=')) {
        const projectName = decodeURIComponent(hash.split('project=')[1]);
        const project = projects.find(p => p.name === projectName);
        if (project) {
            // Small delay to ensure map is ready and markers are clustered
            setTimeout(() => {
                focusOnProject(project);
            }, 1000);
        }
    }
});


// Initial Sidebar State
if (window.innerWidth <= 768) {
   const sidebar = document.getElementById("sidebar");
   if (sidebar) sidebar.classList.add("collapsed");
   // Show external signature on mobile start (since sidebar is collapsed)
   const externalSig = document.getElementById('external-signature');
   if (externalSig) {
       externalSig.style.opacity = '1';
       externalSig.style.pointerEvents = 'auto';
   }
} else {
   if (typeof gsap !== 'undefined') {
     gsap.from(".sidebar", { 
       x: -400, 
       duration: 1, 
       ease: "power3.out",
       onComplete: () => {
         gsap.set(".sidebar", { clearProps: "transform" });
       }
     });
   }
}

// --- RIGHT DOCK TOGGLE ---
function toggleDockGroup(groupId, event) {
  if (event) event.stopPropagation();
  
  const group = document.getElementById(groupId + '-group');
  if (!group) return;
  
  const isActive = group.classList.contains('active');
  
  // Close all other groups
  document.querySelectorAll('.dock-group').forEach(g => g.classList.remove('active'));
  
  // Toggle current group
  if (!isActive) {
    group.classList.add('active');
  }
}

// Close dock when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.right-dock')) {
    document.querySelectorAll('.dock-group').forEach(g => g.classList.remove('active'));
  }
});

function toggleSidebar(event) {
  if (event) event.stopPropagation();
  
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  
  const isCollapsing = !sidebar.classList.contains("collapsed");
  sidebar.classList.toggle("collapsed");

  const sidebarSig = document.querySelector('.sidebar .signature');
  const externalSig = document.getElementById('external-signature');

  if (sidebarSig && externalSig && typeof gsap !== 'undefined') {
      if (isCollapsing) {
          // Sidebar is closing. Hide sidebar sig, show external sig.
          gsap.to(sidebarSig, { opacity: 0, duration: 0.3 });
          gsap.fromTo(externalSig, 
              { opacity: 0, y: 30, scale: 0.9 },
              { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.3, ease: "power2.out" }
          );
      } else {
          // Sidebar is opening. Hide external sig, show sidebar sig.
          gsap.to(externalSig, { opacity: 0, duration: 0.3 });
          gsap.to(sidebarSig, { opacity: 1, duration: 0.5, delay: 0.3 });
      }
  }
}

function closeModal() {
  const modal = document.getElementById("projectModal");
  if (modal) modal.classList.remove("active");
    document.body.classList.remove('modal-open');
  AIConcierge.setViewContext({ modalOpen: false });
  
  // Stop swiper autoplay when modal is hidden to prevent invisible DOM updates
  if (swiperInstance && swiperInstance.autoplay) {
      swiperInstance.autoplay.stop();
  }
  
  if (sidebarAutoCollapsed) {
      const sidebar = document.getElementById("sidebar");
      if (sidebar && sidebar.classList.contains("collapsed")) {
          toggleSidebar();
      }
      sidebarAutoCollapsed = false;
  }
}

async function downloadBrochure() {
  try {
      if (!currentProject) {
          console.error("No project selected");
          return;
      }

      // 1. Check Toggles
      const chkData = document.getElementById('chkPdfData');
      const chkCalc = document.getElementById('chkPdfCalc');
      const chkAI = document.getElementById('chkPdfAI');
      
      const includeData = chkData ? chkData.checked : true;
      const includeCalc = chkCalc ? chkCalc.checked : true;
      const includeAI = chkAI ? chkAI.checked : true;

      if (!includeData && !includeCalc && !includeAI) {
          alert("Please select at least one section to include in the PDF.");
          return;
      }
      
      if (!window.jspdf) {
          try {
              await lazyLoadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
              await lazyLoadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
          } catch (e) {
              console.error('Failed to load jsPDF:', e);
              alert('PDF generation is temporarily unavailable. Please try again.');
              return;
          }
      }
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();
      const margin = 20;
      
      // --- COLORS ---
      const colors = {
          red: [203, 20, 25],     // #cb1419
          black: [0, 0, 0],
          white: [255, 255, 255],
          darkGrey: [40, 40, 40],
          lightGrey: [248, 248, 248],
          border: [230, 230, 230],
          gold: [212, 175, 55],
          green: [46, 204, 113]
      };

      // --- ASSETS: LOGO & SIGNATURE ---
      const logoSvg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 3508 1240"><defs><style>.cls-1{fill:#cb1419;}</style></defs><g><g id="Layer_1"><g><path d="M510.5,201.9l-216.9,100.6-105.8,183c-132.4,229.1-129.2,223.5-128.6,224.1s53.3-26.4,134.5-68.1l14.2-7.3-.6,9.1c-.6,10,.9,28.6,3.2,40,5.4,26,19,51.9,37.1,70.7l6.3,6.6-2.9,8.5c-6,17.2-4.9,30.4,3.1,37.2,5.6,4.8,11.6,6.1,25.2,5.4l10.9-.5,2.8,6.2c7.2,15.9,11.9,35.1,12.7,51.6.8,17.5-2.4,31.4-10.2,44.5-2,3.2-3.3,6-3.1,6.3.8.7,9.2-1.6,19.6-5.5,33.7-12.6,55.4-30.6,63.2-52.5,3.2-9.1,3.2-25.3,0-35.8-6.7-21.3-19.7-37.5-37.2-46.3-3.6-1.7-6.6-3.2-6.7-3.2s1-4.3,2.3-9.5c4.6-17.7,2.9-30.5-4.8-36.3-6.5-5-11.1-6.1-25.3-5.8-7.1.1-14.3.2-16,.4-2.6.2-3.5-.6-8.7-7.8-36.7-51.1-33.3-125,9.3-202.9,18.4-33.6,50.9-77.3,81.2-109.1,1-1.1-1.5,3.2-5.6,9.5-41.5,64.3-73.5,128.3-80.2,160.4-1.7,8.4-2,17.9-.5,17.4.5-.2,43.7-24.4,96.1-53.8l95.1-53.5,127.9-191.7c70.4-105.5,127.9-192,127.9-192.3s-.6-.5-1.2-.4c-.7.1-98.9,45.4-218.3,100.8Z"/><path d="M552.3,429.8l-61.8,81.8-92.2,55.8c-50.8,30.7-92.3,56.3-92.3,56.8s7.3,11.7,16.2,25l16.1,24,5.1-.6c7.4-1,27.2-6.1,41.6-10.8,88-28.6,172.4-98.4,239.6-198.3,15.8-23.4,37.3-60.4,39-66.9.4-1.9-3-5.7-23.5-25.4-13.2-12.8-24.4-23.2-24.9-23.2s-28.8,36.8-62.9,81.8Z"/><path class="cls-1" d="M699.4,414.7l-7,.4-4.4,7.7c-17,30.1-46.2,72.3-72.4,104.7-25.4,31.3-62.3,69.4-88.5,91-66.7,55.2-130.9,82-197.6,82.6h-9l3.5,1.6c19.9,9.1,22.6,10.7,29.1,17.2s7.1,8.1,8.7,12.4c3.2,8.3,3,18.4-.5,28.9l-2.7,8.1,4,3c7,5.4,21.8,21.1,26.2,27.7,9.8,15,14.2,28.3,14.2,43.5,0,23.8-10.4,44.1-35.2,68.8l-13.8,13.7v155h718.2l-.6-324.8c-.3-178.6-.9-328.6-1.2-333.5l-.6-8.7-181.7.2c-99.9.1-184.8.4-188.7.5ZM993.3,752.4c7.1,3.4,13.9,11,16.7,18.4,3,7.9,2.4,18.5-1.4,26-13,25.4-48.3,24.7-60.3-1.3-6.7-14.6-1.1-33.3,12.4-41.2,7.6-4.4,11.2-5.4,19.4-5,5.8.3,9,1,13.2,3.1ZM929,870.7c0,72.5.4,116.1,1,118.4,1.2,4.2,4.2,7.7,7.3,8.3,1.2.3,5.3.8,9,1.1l6.8.7-.3,4.6-.3,4.7-6.5.3c-3.6.2-24.2.1-45.7-.3l-39.3-.7v-5.9c0-3.3-.2-5.9-.4-5.9s-3.3,1.7-6.7,3.8c-14.7,8.9-28.9,12.7-44.9,11.9-12.2-.6-20.3-3-30-8.7-6.7-3.9-16.3-12.4-19.4-17.2q-1.7-2.7,2.2-8.5c3.9-5.8,8.6-14.5,11.5-21.5l1.6-3.7-10.6-5.1c-5.8-2.7-10.9-5-11.2-5s-1.5,2.4-2.4,5.2c-.9,2.9-2.8,7.5-4.1,10.3l-2.4,5-1.5-3.6c-2.5-5.7-5.7-18.8-6.4-26.2l-.6-6.7h35.3v-8.9c0-16.6-4.7-35-12-46.4-1.6-2.6-3-5.2-3-5.7s3-4.1,6.6-8c8-8.4,18.1-14.9,28.9-18.6,18.7-6.2,48.4-3.2,63.8,6.6,2.6,1.6,5,3,5.3,3s.4-16.3.2-36.3c-.2-29.3-.6-36.6-1.7-38.3-2.3-3.4-8-5.6-15.8-6.2l-7.3-.5v-4.7c0-2.6.3-5,.7-5.3.3-.4,21.3-.7,46.5-.7h45.8v114.7ZM703.5,838.4c11.9,3.6,27.1,11.7,34.6,18.4,14.6,13.3,23.4,31.8,25.3,53.4l.7,7.8h-101.1v15.9c0,17.1.7,22.5,4,31.4,6.6,17.6,19.6,26.1,39.5,26.1,20.4-.1,36.5-10.6,46.2-30l4.5-9.2,3.7,1.5c2,.8,3.7,1.6,3.9,1.8.5.5-5.8,12.6-9.1,17.5-19.5,28.7-50.8,42.3-87.6,38.1-39.3-4.6-67.1-25.2-76.9-57.3-2.3-7.3-4.7-25.8-3.8-29.3.4-1.7,2-2.6,6.9-3.9,26.9-7.3,41.2-35,31.2-60.1-2-4.8-2.4-6.9-1.6-7.9,1.6-1.9,19.8-11.1,26.1-13.2,11.4-3.7,16.3-4.3,30.5-4,11.6.3,15.5.8,23,3ZM596.3,840.7c8.4,4,16.5,11.5,20.8,19.6,3.2,5.9,3.4,6.7,3.4,16.2s-.3,10.7-2.7,15.7c-5.2,11.2-15.7,19.2-28.3,21.8-16,3.3-31.7-4.4-38.3-18.9-2.1-4.6-2.6-7.1-2.5-13.6,0-4.9.6-9.8,1.6-12.5l1.7-4.5-6.1,6.4c-3.4,3.5-7.3,8.9-8.8,12l-2.6,5.6-.3,43.5c-.2,23.9,0,45.8.3,48.7,1.2,9.8,6.9,14.7,18.3,15.9l6.2.7v9.7h-118v-4.9c0-5.6.6-6.1,8.1-6.1s11.6-2.6,13.9-6.2c1.3-2,1.5-11,1.8-62.1.2-37.9-.1-61.9-.8-65.5-1.5-8.8-7.7-13.2-18.7-13.2h-4.3v-4.9c0-4.6.1-4.9,3.1-5.5,1.7-.3,21-.6,42.9-.6s41.2.3,42.9.6l3.1.6v12.7c.1,12.2.2,12.5,1.8,10.1,7.8-11.4,17.9-19.5,28.7-23,4.7-1.6,8.2-1.9,16-1.7,8.8.2,10.8.6,16.8,3.4Z"/><path class="cls-1" d="M969.9,767.3c-10,6.7-11.5,19.6-3.2,27.4,8,7.6,19.8,6.3,26.6-2.9,3.2-4.3,3.4-13.2.5-18.3-4.7-8-16.6-11.1-23.9-6.2Z"/><path class="cls-1" d="M827,851.7c-3.8,2-6.2,4.1-7.7,6.9l-2.3,3.9v60c0,55.2.1,60.3,1.8,63.4,2.3,4.6,7.7,8.7,13.3,10.2,4,1.1,5.3,1,9.1-.4,4.9-1.9,10-6.4,12.6-11.1,1.5-2.8,1.7-8.8,1.7-62.6s0-59.6-2-63c-3.2-5.3-9.5-9.3-15.7-9.8-4.4-.3-6.2.1-10.8,2.5Z"/><path class="cls-1" d="M669.9,848c-4.7,2.5-8.6,7.1-9.9,11.8-.5,2-1,13.5-1,25.4v21.8h39.1l-.3-24.3-.3-24.4-2.8-3.6c-5.9-7.7-17.2-10.7-24.8-6.7Z"/><path d="M3107.6,415.1c-34.6,3.6-66.2,18.1-90.4,41.3-31.9,30.7-47.5,68.9-47.6,116.6,0,19.5.9,27.9,5,44.5,14.5,57.9,59.6,100.7,119.1,112.6,13.7,2.7,41,3.7,55,1.9,51.2-6.4,93-35.2,115.6-79.8,11.5-22.7,17-43.4,19.2-72.5l.7-8.7h-166.2v44h109.2l-.6,2.7c-1.5,6.1-9.6,21.2-15.5,28.6-14.1,17.7-37.2,30.9-62.1,35.3-9.9,1.7-30.7,2-40,.5-40.4-6.6-71.1-33.4-82.3-72.1-6.6-22.6-6.2-52.8.8-74.5,5.3-16.2,12.7-28.6,23.9-40.4,8.9-9.2,16.6-14.7,28.7-20.6,43.8-21.1,101.6-9.2,130.5,26.9,5.4,6.8,12.6,19.4,14.8,25.8.5,1.7,2.7,1.8,27.2,1.8h26.6l-.6-3.5c-1.3-7-5.8-19.2-10.5-29-27-55.6-92.2-88.6-160.5-81.4Z"/><path d="M1420,573v154h51v-113l29.2.2,29.2.3,32.3,55.5c17.8,30.5,32.7,55.8,33.1,56.2s13.7.7,29.5.6l28.7-.3-35.3-59.9-35.3-59.9,10.6-5.3c24.8-12.7,41.3-33,48.6-59.9,2.6-9.2,3.1-34.2.9-44.7-7.3-36-34.4-64-71-73.3-14.7-3.8-28.6-4.4-93.2-4.5h-58.3v154ZM1554.4,470c10.1,2.5,16.7,6.2,23.6,13,22.8,22.3,16.7,61.5-11.8,75.9-11.7,5.9-15,6.3-56.9,6.8l-38.3.5v-98.2h37.8c34.5,0,38.6.2,45.6,2Z"/><path d="M1131,443.5v23.5h91v260h51v-260h91v-47h-233v23.5Z"/><path d="M1742,571.7c-33.7,83.5-61.5,152.6-61.8,153.5-.4,1.7,1.4,1.8,26.9,1.8h27.4l13-33.3,13-33.2h136.7l13.1,33.2,13.2,33.3h56.4l-4.9-11.8c-2.7-6.4-31.3-75.5-63.7-153.4l-58.8-141.7h-24.6c0-.1-24.6-.1-24.6-.1l-61.3,151.7ZM1854,551.4c13.8,34.5,24.9,63,24.7,63.2s-22.9.3-50.3.2l-50-.3,15.4-39c31.3-79.7,34.4-87.6,34.7-87.3s11.6,28.6,25.5,63.2Z"/><path d="M2033,573.5v153.5h51v-307h-51v153.5Z"/><path d="M2171,573.5v153.5h50l.2-108.7.3-108.6,79.4,108.6,79.4,108.7h43.7v-307h-50l-.2,106.8-.3,106.9-77.6-106.6-77.6-106.6-23.6-.3-23.7-.2v153.5Z"/><path d="M2511,573.5v153.5h51v-307h-51v153.5Z"/><path d="M2649,573.5v153.5h50l.2-108.7.3-108.6,79.4,108.6,79.4,108.7h43.7v-307h-50l-.2,106.8-.3,106.9-77.6-106.6-77.6-106.6-23.6-.3-23.7-.2v153.5Z"/><path d="M1579,756.7c-73.9,7.2-126.6,54.4-141.2,126.5-2,10-2.3,14.1-2.3,36.3.1,22.2.3,26.2,2.3,35.4,14.4,65.8,57.2,109.4,121.2,123.3,9.3,2,13.3,2.2,34.5,2.2s25.2-.2,34.2-2.2c46.2-10.1,82.8-38.3,103.3-79.7,3.2-6.6,7.3-15.9,8.9-20.7,2.7-7.9,7.1-27.2,8.5-37.1l.5-3.7h-100.5l-1.3,5.1c-4,15.6-16.9,32.2-30,38.8-20.9,10.6-45.4,6.2-61.6-11-11.9-12.7-17.6-29.2-17.5-51.1,0-18,3.2-30.2,11.1-43.4,6.6-10.9,19.8-20.5,31.9-23.3,2.5-.6,8.6-1.1,13.5-1.1,15.5,0,27.2,5.5,39,18.2,5.9,6.4,13.1,18.4,14.7,24.6l.6,2.2h99.3l-.6-3.8c-3.3-20.3-8.7-37.7-16.6-53.5-14.6-29.3-39-53.6-67.3-67.2-25.1-12-56.9-17.5-84.6-14.8Z"/><path d="M2391,919.5v154.5h200v-84h-105v-32h92v-76h-92v-33h103v-84h-198v154.5Z"/><path d="M1231.5,767.7c-5.5,14.1-113.5,303.7-113.5,304.4s21.4.9,52,.9h51.9l3.1-10.3c1.8-5.6,4.6-14.9,6.4-20.7l3.2-10.5,45.5-.3,45.4-.2,6,21,5.9,21h53.8c29.6,0,53.8-.3,53.8-.6s-105.1-279.8-114.7-305.2c-.4-.9-11.2-1.2-49.3-1.2s-48.8.1-49.5,1.7ZM1293.8,917.8c7.2,21.8,13.2,40.1,13.2,40.5s-12.2.7-27.1.7h-27l.6-2.3c3.2-10.6,26.1-78.7,26.5-78.7s6.5,17.9,13.8,39.8Z"/><path d="M1851.5,767.7c-5.5,14.1-113.5,303.7-113.5,304.4s21.4.9,52,.9h51.9l3.1-10.3c1.8-5.6,4.6-14.9,6.4-20.7l3.2-10.5,45.5-.3,45.4-.2,6,21,5.9,21h53.8c29.6,0,53.8-.3,53.8-.6s-105.1-279.8-114.7-305.2c-.4-.9-11.2-1.2-49.3-1.2s-48.8.1-49.5,1.7ZM1913.8,917.8c7.2,21.8,13.2,40.1,13.2,40.5s-12.2.7-27.1.7h-27l.6-2.3c3.2-10.6,26.1-78.7,26.5-78.7s6.5,17.9,13.8,39.8Z"/><path d="M2083,919.5v153.6l74.8-.4c73.2-.3,74.9-.4,84.7-2.6,30.2-6.8,52.2-18.1,72-37.2,21.3-20.6,35.4-46.8,41.6-77.6,2.7-13.7,3.7-43.7,1.9-59.2-7.7-66.1-50.9-113.6-115.7-127.3-10.6-2.2-12.3-2.3-85-2.6l-74.3-.3v153.6ZM2217.5,860.5c27.3,6.9,42.6,28.2,42.6,59s-10.5,44.7-29.5,54c-11.1,5.4-16.9,6.5-34.8,6.5h-15.8v-121h15.8c10.8,0,17.7.5,21.7,1.5Z"/><path d="M2654.6,769.7c-1.2,7.2-41.6,301-41.6,302.2s12.9,1.1,48.4,1.1h48.4l.6-3.8c.3-2,3.7-34.3,7.6-71.7,3.8-37.4,7.3-69.8,7.7-71.9.8-3.8,2.2-.8,33.4,71.5l32.6,75.4,17.4.2,17.4.3,32.5-75.5c17.9-41.5,32.7-75.5,33-75.5s4,32.5,8.3,72.2c4.3,39.8,8.1,73.8,8.4,75.5l.5,3.3h47.9c47.7,0,47.9,0,47.9-2.1s-9.2-69.5-20.5-151.9-20.5-150.6-20.5-151.4c0-1.4-5.1-1.6-48.2-1.6h-48.3l-29,72.5c-15.9,39.8-29.3,72.1-29.7,71.7s-13.5-32.9-29.1-72.2l-28.5-71.5-48-.3-48-.2-.6,3.7Z"/><path d="M2990.6,771.2c1.5,2.9,24.2,46.6,50.5,97l47.9,91.8v113h97v-113.6l50.5-96.4c27.8-53,50.5-96.5,50.5-96.7s-25.1-.3-55.7-.3h-55.8l-18.9,46.6c-10.4,25.6-19.3,45.9-19.6,45.2-.4-.7-8.9-21.7-19-46.6l-18.4-45.2h-111.6l2.6,5.2Z"/></g></g></g></svg>`;
      
      const logoData = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(logoSvg)));

      // Helper to load image
      const loadImage = (src) => new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
      });

      // Convert SVG to PNG via Canvas
      const img = await loadImage(logoData);
      const logoCanvas = document.createElement('canvas');
      logoCanvas.width = 3508;
      logoCanvas.height = 1240;
      const logoCtx = logoCanvas.getContext('2d');
      logoCtx.drawImage(img, 0, 0, 3508, 1240);
      const logoPng = logoCanvas.toDataURL('image/png');

      // Signature Generation
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.font = "60px 'Herr Von Muellerhoff'"; 
      ctx.fillStyle = "#000000"; 
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GH", 100, 50);
      const signatureData = canvas.toDataURL('image/png');

      // --- LAYOUT CONSTRUCTION ---

      // 1. HEADER (Logo Centered)
      doc.addImage(logoPng, 'PNG', width/2 - 35, 10, 70, 24.7); 

      // 2. HERO SECTION (Title & Dev)
      let yPos = 50;
      
      // --- BACKGROUND WATERMARK "RED" ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(120);
      doc.setTextColor(245, 245, 245); // Very light gray (like 0.961 in the Telal PDF)
      doc.text("RED", width / 2, height / 2 + 20, { align: "center" });
      
      // Decorative Red Bar
      doc.setFillColor(...colors.red);
      doc.rect(0, yPos, 8, 25, 'F');
      
      // Project Name
      doc.setFont("times", "bold");
      doc.setFontSize(32);
      doc.setTextColor(...colors.black);
      doc.text(currentProject.name.toUpperCase(), 15, yPos + 10);
      
      // Developer Name
      if (currentProject.dev) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(...colors.red);
          doc.text(`BY ${currentProject.dev.toUpperCase()}`, 15, yPos + 20);
      }
      
      // QR Codes (Top Right) — two codes side by side
      // Left QR: Opens project on our website
      const websiteQrUrl = `${SITE_BASE_URL}#project=${encodeURIComponent(currentProject.name)}`;
      // Right QR: Opens exact location on Google Maps
      const mapsQrUrl = `https://maps.google.com/maps?q=${currentProject.lat},${currentProject.lng}&z=15`;
      try {
          const [websiteQrData, mapsQrData] = await Promise.all([
              createQRCodeDataUrl(websiteQrUrl),
              createQRCodeDataUrl(mapsQrUrl)
          ]);
          // Website QR (right side, leftmost of the two)
          if (websiteQrData) {
              doc.addImage(websiteQrData, 'PNG', width - 68, yPos - 5, 25, 25);
              doc.setFontSize(7);
              doc.setTextColor(...colors.darkGrey);
              doc.text("VIEW PROJECT", width - 55.5, yPos + 24, { align: "center" });
          }
          // Maps QR (rightmost)
          if (mapsQrData) {
              doc.addImage(mapsQrData, 'PNG', width - 40, yPos - 5, 25, 25);
              doc.setFontSize(7);
              doc.setTextColor(...colors.darkGrey);
              doc.text("SCAN FOR MAP", width - 27.5, yPos + 24, { align: "center" });
          }
      } catch (err) {
          console.warn('QR code skipped:', err?.message || err);
      }

      yPos += 35;

      // --- SECTION 1: PROJECT DATA ---
      if (includeData) {
          // 3. PROJECT SNAPSHOT CARD (Left)
          const cardWidth = (width - (margin * 2)) * 0.45;
          const cardHeight = 70;
          
          // Card Background
          doc.setFillColor(...colors.lightGrey);
          doc.setDrawColor(...colors.border);
          doc.roundedRect(margin, yPos, cardWidth, cardHeight, 3, 3, 'FD');
          
          // Card Header
          doc.setFillColor(...colors.black);
          doc.roundedRect(margin, yPos, cardWidth, 10, 3, 3, 'F');
          doc.rect(margin, yPos + 5, cardWidth, 5, 'F'); // Square off bottom corners
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...colors.white);
          doc.text("PROJECT SNAPSHOT", margin + 5, yPos + 7);

          // Card Content
          const details = [
              { label: "LOCATION", value: currentProject.zone || "N/A" },
              { label: "STATUS", value: document.getElementById("modalStatus").innerText },
              { label: "UNIT TYPES", value: document.getElementById("modalUnits").innerText },
              { label: "PAYMENT", value: document.getElementById("modalPayment").innerText }
          ];

          let cardY = yPos + 18;
          details.forEach(item => {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(8);
              doc.setTextColor(...colors.red);
              doc.text(item.label, margin + 5, cardY);
              
              doc.setFont("helvetica", "normal");
              doc.setTextColor(...colors.darkGrey);
              const splitText = doc.splitTextToSize(item.value, cardWidth - 10);
              doc.text(splitText, margin + 5, cardY + 4);
              
              cardY += 12 + (splitText.length - 1) * 3;
          });

          // 4. AREAS HIGHLIGHT (Right)
          const rightColX = margin + cardWidth + 10;
          const rightColWidth = (width - (margin * 2)) * 0.55 - 10;
          
          doc.setFont("times", "italic");
          doc.setFontSize(14);
          doc.setTextColor(...colors.black);
          doc.text("Available Areas & Configurations", rightColX, yPos + 5);
          
          doc.setDrawColor(...colors.red);
          doc.setLineWidth(0.5);
          doc.line(rightColX, yPos + 8, rightColX + 50, yPos + 8);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...colors.darkGrey);
          const areasText = document.getElementById("modalAreas").innerText;
          const splitAreas = doc.splitTextToSize(areasText, rightColWidth);
          doc.text(splitAreas, rightColX, yPos + 16);

          // 5. AMENITIES GRID (Bottom)
          yPos += Math.max(cardHeight, 30 + (splitAreas.length * 5)) + 15;
          
          doc.setFont("times", "bold");
          doc.setFontSize(18);
          doc.setTextColor(...colors.black);
          doc.text("LIFESTYLE & AMENITIES", width/2, yPos, { align: "center" });
          
          doc.setDrawColor(...colors.red);
          doc.setLineWidth(0.5);
          doc.line(width/2 - 20, yPos + 3, width/2 + 20, yPos + 3);
          
          yPos += 15;
          
          const modalAmenities = document.getElementById("modalAmenities");
          const amenities = modalAmenities 
              ? modalAmenities.innerText.split("\n").filter(a => a.trim() !== "")
              : [];
          const colWidth = (width - (margin * 2)) / 3;
          
          amenities.forEach((am, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              const x = margin + (col * colWidth);
              const y = yPos + (row * 12);
              
              // Custom Checkbox
              doc.setDrawColor(...colors.red);
              doc.setLineWidth(0.5);
              doc.rect(x, y - 3, 4, 4);
              doc.setFillColor(...colors.red);
              doc.rect(x + 1, y - 2, 2, 2, 'F');
              
              doc.setFont("helvetica", "normal");
              doc.setFontSize(9);
              doc.setTextColor(...colors.darkGrey);
              doc.text(am, x + 8, y);
          });
          
          yPos += (Math.ceil(amenities.length / 3) * 12) + 10;
      }

      // --- SECTION 2: MORTGAGE CALCULATOR ---
      if (includeCalc) {
          if (yPos > height - 80) { doc.addPage(); yPos = 30; }
          else { yPos += 10; }

          // Section Header
          doc.setFillColor(...colors.black);
          doc.rect(margin, yPos, width - (margin*2), 10, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(...colors.white);
          doc.text("MORTGAGE CALCULATOR ESTIMATE", margin + 5, yPos + 7);
          yPos += 15;

          // Data Extraction (FIXED IDs)
          const price = document.getElementById('calcPrice').value;
          const dp = document.getElementById('resDpAmount').innerText; // Was calcDownPayment
          const dpPct = document.getElementById('calcDpVal').innerText; // Was calcDownPaymentPercent
          const rate = document.getElementById('calcInterest').value;
          const years = document.getElementById('calcYears').value;
          const monthly = document.getElementById('resMonthly').innerText; // Was calcMonthly

          // Grid Layout
          const col1 = margin;
          const col2 = margin + 60;
          const col3 = margin + 120;
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...colors.darkGrey);
          
          // Row 1
          doc.text("Unit Price:", col1, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(Number(price).toLocaleString() + " EGP", col1 + 30, yPos);

          doc.setFont("helvetica", "bold");
          doc.text("Down Payment:", col2, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(`${dp} (${dpPct})`, col2 + 30, yPos);

          // Row 2
          yPos += 10;
          doc.setFont("helvetica", "bold");
          doc.text("Loan Term:", col1, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(`${years} Years`, col1 + 30, yPos);

          doc.setFont("helvetica", "bold");
          doc.text("Interest Rate:", col2, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(`${rate}%`, col2 + 30, yPos);

          // Highlight Box for Monthly Payment
          doc.setFillColor(...colors.lightGrey);
          doc.setDrawColor(...colors.red); // Changed to RED
          doc.roundedRect(col3 + 5, yPos - 12, 50, 20, 2, 2, 'FD'); // Reduced size and adjusted position
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7); // Slightly smaller label
          doc.setTextColor(...colors.red); // Changed to RED
          doc.text("EST. MONTHLY PAYMENT", col3 + 10, yPos - 6);
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12); // Slightly smaller value to fit
          doc.setTextColor(...colors.black);
          doc.text(monthly, col3 + 10, yPos + 2);
          
          yPos += 20;
      }

      // --- SECTION 3: AI INVESTMENT INSIGHTS ---
      if (includeAI) {
          if (yPos > height - 80) { doc.addPage(); yPos = 30; }
          else { yPos += 10; }

          // Section Header
          doc.setFillColor(...colors.black);
          doc.rect(margin, yPos, width - (margin*2), 10, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(...colors.white); // White text for AI Header
          doc.text("AI INVESTMENT ANALYSIS", margin + 5, yPos + 7);
          yPos += 15;

          // Data Extraction (FIXED IDs)
          const score = document.getElementById('aiScore').innerText; // Was invScore
          const apprec = document.getElementById('aiAppreciation').innerText; // Was invAppreciation
          const rental = document.getElementById('aiRental').innerText; // Was invYield
          
          // Calculate Risk based on Score
          const scoreNum = parseInt(score);
          let risk = "Medium";
          let riskColor = colors.black; // Changed to Black for Medium
          if (scoreNum >= 80) { risk = "Low"; riskColor = colors.green; }
          else if (scoreNum < 60) { risk = "High"; riskColor = colors.red; }

          // Score Circle (Left)
          doc.setDrawColor(...colors.red); // RED Circle
          doc.setLineWidth(1.5);
          doc.circle(margin + 20, yPos + 15, 15);
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(...colors.red); // RED Score
          doc.text(score, margin + 20, yPos + 15, { align: "center", baseline: "middle" });
          
          doc.setFontSize(8);
          doc.setTextColor(...colors.darkGrey);
          doc.text("OPPORTUNITY SCORE", margin + 20, yPos + 35, { align: "center" });

          // Metrics Grid (Right)
          const metricsX = margin + 50;
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...colors.darkGrey);
          
          doc.text("Est. Appreciation (5Y):", metricsX, yPos + 5);
          doc.setTextColor(...colors.black); // Black Value
          doc.text(apprec, metricsX + 40, yPos + 5);

          doc.setTextColor(...colors.darkGrey);
          doc.text("Est. Rental Yield:", metricsX, yPos + 15);
          doc.setTextColor(...colors.black);
          doc.text(rental + " / Year", metricsX + 40, yPos + 15);

          doc.setTextColor(...colors.darkGrey);
          doc.text("Risk Rating:", metricsX, yPos + 25);
          doc.setTextColor(...riskColor);
          doc.text(risk, metricsX + 40, yPos + 25);

          yPos += 40;
      }

      // --- FOOTER ---
      doc.addImage(signatureData, 'PNG', width/2 - 10, height - 30, 20, 10); 
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...colors.darkGrey);
      doc.text("Generated by RED Training Academy AI Concierge", width / 2, height - 15, { align: "center" });
      
      // Bottom Red Bar
      doc.setFillColor(...colors.red);
      doc.rect(0, height - 4, width, 4, 'F');
      
      doc.save(`${currentProject.name}_Brochure.pdf`);
  } catch (e) {
      console.error("PDF Generation Error:", e);
      alert("Failed to generate PDF. Please check console for details.");
  }
}

// --- SMART GALLERY LOGIC ---
let swiperInstance = null;
let currentProject = null;

function getProjectImages(project) {
  // 1. Check for Real Images in projectDetails
  let details = projectDetails[project.name];
  if (!details) {
      // Try partial match
      const projNameLower = project.name.toLowerCase();
      const key = Object.keys(projectDetails).find(k => {
          const kLower = k.toLowerCase();
          return projNameLower.includes(kLower) || kLower.includes(projNameLower);
      });
      if (key) details = projectDetails[key];
  }

  if (details && details.images && Array.isArray(details.images) && details.images.length > 0) {
      return details.images;
  }

  // No dynamic fallback requested
  return [];
}

function getWhatsAppLink(project) {
    // CONFIGURATION: Replace this with your actual sales team number
    const phone = "201500650001"; 
    
    const text = `Hi, I'm interested in *${project.name}* by ${project.dev || 'the developer'} in ${project.zone || 'Egypt'}. Please send me the brochure and latest prices.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.modal-tab').forEach(el => el.classList.remove('active'));
    
    const target = document.getElementById(`tab-${tabName}`);
    if(target) target.classList.add('active');
    
    const buttons = document.querySelectorAll('.modal-tab');
    buttons.forEach(btn => {
        if(btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });
}

async function openModal(proj) {
  currentProject = proj;
  AIConcierge.setViewContext({ project: proj.name, zone: proj.zone, modalOpen: true });
    if (window.RoutePlanner?.syncProjectListHighlights) {
            window.RoutePlanner.syncProjectListHighlights();
    }
    updateBrowseTelemetry();
  
  // Track in Recently Viewed
  RecentlyViewed.add(proj);
  
  // Reset Tabs
  switchTab('overview');
  
  const modal = document.getElementById("projectModal");
  
  // Update WhatsApp Button
  const waBtn = document.getElementById("modalContactBtn");
  if(waBtn) {
      waBtn.onclick = function() {
          window.open(getWhatsAppLink(proj), '_blank');
      };
  }
  
  // Initialize Calculator with Project Defaults
  initCalculator(proj);
  
  // Initialize AI Investment Analysis
  initInvestment(proj);

  // Basic Info
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.innerText = proj.name;
  
  const devEl = document.getElementById("modalDev");
  if (devEl) {
      if (proj.dev) {
          devEl.innerText = proj.dev;
          devEl.style.display = "block";
      } else {
          devEl.style.display = "none";
      }
  }

  // --- Initialize Swiper Gallery ---
  const swiperContainer = document.getElementById("modalSwiper");
  const swiperWrapper = document.getElementById("swiperWrapper");
  if (!swiperWrapper) return;
  
  swiperWrapper.innerHTML = "";
  
  const images = getProjectImages(proj);
  
  if (images.length > 0) {
      images.forEach(url => {
          const slide = document.createElement("div");
          slide.className = "swiper-slide";
          slide.innerHTML = `<img src="${url}" loading="lazy" decoding="async" style="width: 100%; height: 100%; object-fit: cover;" alt="${proj.name}">`;
          swiperWrapper.appendChild(slide);
      });
      
      swiperContainer.style.display = "block";
      
      if (!window.Swiper) {
          try {
              await lazyLoadCSS('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css');
              await lazyLoadScript('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js');
          } catch (e) {
              console.warn('Failed to load Swiper:', e);
          }
      }
      
      if (swiperInstance) {
          swiperInstance.destroy(true, true);
      }
      
      if (!window.Swiper) return;
      swiperInstance = new Swiper(".mySwiper", {
          spaceBetween: 30,
          centeredSlides: true,
          autoplay: {
              delay: 3500,
              disableOnInteraction: false,
          },
          pagination: {
              el: ".swiper-pagination",
              clickable: true,
          },
          navigation: {
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
          },
          loop: true
      });
  } else {
      swiperContainer.style.display = "none";
  }

  // Find Details
  // Try exact match first, then partial match (case-insensitive)
  let details = projectDetails[proj.name];
  if (!details) {
      const projNameLower = proj.name.toLowerCase();
      const key = Object.keys(projectDetails).find(k => {
          const kLower = k.toLowerCase();
          return projNameLower.includes(kLower) || kLower.includes(projNameLower);
      });
      if (key) details = projectDetails[key];
  }

  // Default Data if not found
  if (!details) {
      details = {
          description: "Contact us for more details about this project.",
          unitTypes: "Various",
          areas: "Contact for details",
          paymentPlan: "Contact for details",
          status: "Contact for details",
          amenities: "Beach Access, Swimming Pools"
      };
  }

  // Populate Masterplan
  const mpContainer = document.getElementById("masterplanContainer");
  if (mpContainer) {
      if (details.masterplan) {
          mpContainer.innerHTML = `<img src="${details.masterplan}" class="masterplan-img" alt="Masterplan" loading="lazy" width="800" height="450" style="width: 100%; height: auto; aspect-ratio: 16/9; object-fit: contain;">`;
      } else {
          mpContainer.innerHTML = "No Masterplan Available";
      }
  }

  // Populate Layouts
  const layoutContainer = document.getElementById("layoutsContainer");
  if (layoutContainer) {
      if (details.layouts && Array.isArray(details.layouts) && details.layouts.length > 0) {
          layoutContainer.innerHTML = details.layouts.map(url => `<img src="${url}" class="layout-img" alt="Layout" loading="lazy" width="400" height="300" style="width: 100%; height: auto; aspect-ratio: 4/3; object-fit: contain; margin-bottom: 10px;">`).join('');
      } else {
          layoutContainer.innerHTML = "No Layouts Available";
      }
  }

  const modalDesc = document.getElementById("modalDesc");
  const modalUnits = document.getElementById("modalUnits");
  const modalAreas = document.getElementById("modalAreas");
  const modalPayment = document.getElementById("modalPayment");
  const modalStatus = document.getElementById("modalStatus");
  const modalPrice = document.getElementById("modalPrice");
  const priceSection = document.getElementById("priceSection");
  
  if (modalDesc) modalDesc.innerText = details.description || '';
  if (modalUnits) {
      // Use project unitTypes if available, otherwise use details
      if (proj.unitTypes && Array.isArray(proj.unitTypes) && proj.unitTypes.length > 0) {
          modalUnits.innerText = proj.unitTypes.join(', ');
      } else {
          modalUnits.innerText = details.unitTypes || '';
      }
  }
  if (modalAreas) {
      // Use project areaMin/areaMax if available
      if (proj.areaMin && proj.areaMax) {
          modalAreas.innerText = `${proj.areaMin}m² - ${proj.areaMax}m²`;
      } else {
          modalAreas.innerText = details.areas || '';
      }
  }
  if (modalPayment) {
      // Use project paymentPlan if available, otherwise use details
      if (proj.paymentPlan) {
          modalPayment.innerText = proj.paymentPlan;
      } else {
          modalPayment.innerText = details.paymentPlan || '';
      }
  }
  if (modalStatus) modalStatus.innerText = details.status || proj.status || '';
  
  // Price display
  if (modalPrice) {
      if (proj.priceMin) {
          const formatFullPrice = (price) => {
              return new Intl.NumberFormat('en-EG').format(price);
          };
          
          if (proj.priceMax && proj.priceMax > proj.priceMin) {
              modalPrice.innerText = `${formatFullPrice(proj.priceMin)} - ${formatFullPrice(proj.priceMax)} EGP`;
          } else {
              modalPrice.innerHTML = `<span>${i18n.currentLang === 'ar' ? 'يبدأ من' : 'Starting from'}</span> ${formatFullPrice(proj.priceMin)} EGP`;
          }
          if (priceSection) priceSection.style.display = 'block';
      } else {
          modalPrice.innerText = i18n.currentLang === 'ar' ? 'تواصل معنا للتسعير' : 'Contact for pricing';
          if (priceSection) priceSection.style.display = 'block';
      }
  }

  // Amenities
  const amenitiesContainer = document.getElementById("modalAmenities");
  if (amenitiesContainer) {
      amenitiesContainer.innerHTML = "";
      const amenitiesList = (details.amenities || '').split(",").map(s => s.trim()).filter(s => s);
      amenitiesList.forEach(am => {
          const tag = document.createElement("span");
          tag.className = "amenity-tag";
          tag.innerText = am;
          amenitiesContainer.appendChild(tag);
      });
  }

  // Nearby Landmarks
  const landmarksContainer = document.getElementById("modalLandmarks");
  const landmarksSection = document.getElementById("landmarksSection");
  
  if (landmarksContainer) landmarksContainer.innerHTML = "";
  
  const nearbyLandmarks = (projects || []).filter(p => {
      if (p.type !== 'landmark') return false;
      if (p.name === proj.name) return false; // Exclude self if it is a landmark
      if (!map) return false;
      
      const dist = map.distance([proj.lat, proj.lng], [p.lat, p.lng]);
      return dist <= 10000; // 10km
  });

  if (nearbyLandmarks.length > 0) {
      if (landmarksSection) landmarksSection.style.display = "block";
      nearbyLandmarks.forEach(l => {
          const tag = document.createElement("span");
          tag.className = "amenity-tag";
          tag.style.borderColor = "var(--avaria-red)";
          tag.style.background = "color-mix(in srgb, var(--avaria-red) 10%, transparent)";
          tag.innerText = l.name;
          if (landmarksContainer) landmarksContainer.appendChild(tag);
      });
  } else {
      if (landmarksSection) landmarksSection.style.display = "none";
  }

    if (modal) modal.classList.add("active");
    document.body.classList.add('modal-open');
}

// --- THEME SWITCHER LOGIC ---
let currentBaseTheme = localStorage.getItem('selectedBaseTheme') || 'default';
let isLightMode = localStorage.getItem('isLightMode') === 'true';

function toggleLightMode() {
  isLightMode = !isLightMode;
  localStorage.setItem('isLightMode', isLightMode);
  applyTheme();
}

function setTheme(themeName) {
  currentBaseTheme = themeName;
  localStorage.setItem('selectedBaseTheme', currentBaseTheme);
  applyTheme();
}

function updateHeatmapColors() {
  if (isHeatmapMode && heatmapLayer) {
      const styles = getComputedStyle(document.documentElement);
      const gold = styles.getPropertyValue('--avaria-gold').trim() || '#667eea';
      const red = styles.getPropertyValue('--avaria-red').trim() || '#f093fb';
      
      map.removeLayer(heatmapLayer);
      
      const heatPoints = projects.map(p => [p.lat, p.lng, 1]);
      heatmapLayer = L.heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: { 0.4: 'blue', 0.65: gold, 1.0: red }
      }).addTo(map);
  }
}

function updateRoadColors() {
  const styles = getComputedStyle(document.documentElement);
  const goldColor = styles.getPropertyValue('--avaria-gold').trim() || '#667eea';
  const redColor = styles.getPropertyValue('--avaria-red').trim() || '#f093fb';
  if (mainRoadsLayer) {
    mainRoadsLayer.setStyle({ color: goldColor });
  }
  if (secondaryRoadsLayer) {
    secondaryRoadsLayer.setStyle({ color: redColor });
  }
}

function applyTheme() {
  let themeToApply = currentBaseTheme;
  
  // Determine the actual data-theme value
  if (isLightMode) {
      if (currentBaseTheme === 'default') {
          themeToApply = 'light';
      } else {
          themeToApply = currentBaseTheme + '-light';
      }
  }

  // Apply new theme to HTML tag
  document.documentElement.setAttribute('data-theme', themeToApply);

  // Update Map Tiles for Street Mode
  if (layers && layers.street) {
      const newUrl = isLightMode ? lightTiles : darkTiles;
      layers.street.setUrl(newUrl);
  }
  
  // Update Heatmap if active
  updateHeatmapColors();

  // Update road layer colors to match new theme
  updateRoadColors();

  // Update active state of buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.remove('active');
      // Simple check to see if the button corresponds to the current base theme
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${currentBaseTheme}'`)) {
          btn.classList.add('active');
      }
  });

  // Update Theme Icon
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
      if (isLightMode) {
          // Show Moon (to switch to Dark)
          themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
      } else {
          // Show Sun (to switch to Light)
          themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
      }
  }
}

// Initial Theme Application
applyTheme();

// --- DEBUGGING ---
window.addEventListener('error', (e) => {
  console.error("Global Error Caught:", e.message);
});

// --- LIFESTYLE DOCK LOGIC ---
const lifestyleIcons = document.querySelectorAll('.lifestyle-icon');
const mapElement = document.getElementById('map');

lifestyleIcons.forEach(icon => {
    // Drag Support (Desktop)
    icon.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', icon.dataset.amenity);
        e.dataTransfer.effectAllowed = 'copy';
        icon.style.opacity = '0.5';
    });

    icon.addEventListener('dragend', () => {
        icon.style.opacity = '1';
    });
    
    // Click Support (Mobile/Tablet/Desktop Alternative - 1000x Intelligence)
    icon.addEventListener('click', () => {
        const amenity = icon.dataset.amenity;
        applyLifestyleFilter(amenity);
        
        // Visual feedback
        lifestyleIcons.forEach(i => i.style.border = '1px solid rgba(255,255,255,0.1)');
        icon.style.border = '1px solid var(--avaria-gold)';
        
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
    });
});

mapElement.addEventListener('dragover', (e) => {
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = 'copy';
});

mapElement.addEventListener('drop', (e) => {
    e.preventDefault();
    const amenity = e.dataTransfer.getData('text/plain');
    if (amenity) {
        applyLifestyleFilter(amenity);
    }
});

function applyLifestyleFilter(amenity) {
    // Visual feedback
    const feedback = document.getElementById('ai-feedback');
    if (feedback) feedback.innerHTML = `<span style="color: var(--avaria-gold);">Filtered by Lifestyle: ${amenity.toUpperCase()}</span>`;

    const filtered = projects.filter(p => {
        const details = projectDetails[p.name];
        if (!details || !details.amenities) return false;
        return details.amenities.toLowerCase().includes(amenity);
    });

    renderProjects(filtered);
}

function clearLifestyleFilter() {
    const feedback = document.getElementById('ai-feedback');
    if (feedback) feedback.innerHTML = '';
    filterProjects(); // Reset to current search/filter state
}

// --- TIMELINE SLIDER LOGIC ---
let timelineInterval;
let isTimelinePlaying = false;
let _timelineRenderPending = false;

function updateTimeline(year) {
    const display = document.getElementById('timeline-display');
    if (display) display.innerText = year;
    
    // Debounce renderProjects during timeline play to avoid heavy re-render stacking
    if (_timelineRenderPending) return;
    _timelineRenderPending = true;
    requestAnimationFrame(() => {
        _timelineRenderPending = false;
        
        const visibleProjects = (projects || []).filter(p => {
            const launchYear = (p.deliveryYear || 2026) - 4;
            return year >= launchYear;
        });

        visibleProjects.forEach(p => {
            const delivery = p.deliveryYear || 2026;
            if (year >= delivery) {
                p.tempStatus = 'Delivered';
                p.tempColor = 'var(--avaria-green)';
            } else if (year >= delivery - 3) {
                p.tempStatus = 'Under Construction';
                p.tempColor = 'var(--avaria-gold)';
            } else {
                p.tempStatus = 'Planned';
                p.tempColor = 'var(--avaria-red)';
            }
        });

        renderProjects(visibleProjects, true);
    });
}

function expandTimeline(event) {
    const container = document.getElementById('timeline-container');
    if (container && container.classList.contains('collapsed')) {
        container.classList.remove('collapsed');
    }
}

function collapseTimeline(event) {
    if (event) event.stopPropagation(); // Prevent triggering expand
    const container = document.getElementById('timeline-container');
    if (container) container.classList.add('collapsed');
    
    // Stop playing if collapsed
    if (isTimelinePlaying) {
        toggleTimelinePlay();
    }
}

function toggleTimelinePlay() {
    const slider = document.getElementById('timeline-slider');
    const btn = document.getElementById('timeline-play-btn');
    
    if (!slider || !btn) return;
    
    if (isTimelinePlaying) {
        clearInterval(timelineInterval);
        timelineInterval = null;
        isTimelinePlaying = false;
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    } else {
        isTimelinePlaying = true;
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
        
        timelineInterval = setInterval(() => {
            let val = parseInt(slider.value);
            if (val >= 2030) val = 2019; // Loop
            val++;
            slider.value = val;
            updateTimeline(val);
        }, 1000);
    }
}

// --- RADAR CHART LOGIC ---
function drawRadarChart(project) {
    const container = document.getElementById('radar-chart-container'); // We need to add this to modal
    // Check if container exists in modal, if not create it
    let chartContainer = document.getElementById('radar-chart');
    if (!chartContainer) {
        // Insert into modal
        const modalBody = document.querySelector('.modal-body');
        chartContainer = document.createElement('div');
        chartContainer.id = 'radar-chart';
        chartContainer.style.width = '100%';
        chartContainer.style.height = '250px';
        chartContainer.style.marginTop = '20px';
        // Insert before the button
        modalBody.insertBefore(chartContainer, modalBody.lastElementChild);
    }

    const scores = project.radarScores || { price: 7, luxury: 7, amenities: 7, location: 7, speed: 7 };
    const data = [
        { axis: "Price", value: scores.price },
        { axis: "Luxury", value: scores.luxury },
        { axis: "Amenities", value: scores.amenities },
        { axis: "Location", value: scores.location },
        { axis: "Delivery", value: scores.speed }
    ];

    // SVG Generation
    const width = chartContainer.offsetWidth || 300;
    const height = 250;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 30;
    const angleSlice = (Math.PI * 2) / data.length;

    let svg = `<svg width="${width}" height="${height}">`;
    
    // Draw Grid (Levels)
    for (let level = 1; level <= 5; level++) {
        const r = radius * (level / 5);
        let points = "";
        for (let i = 0; i < data.length; i++) {
            const angle = i * angleSlice - Math.PI / 2;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            points += `${x},${y} `;
        }
        svg += `<polygon points="${points}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`;
    }

    // Draw Axes
    for (let i = 0; i < data.length; i++) {
        const angle = i * angleSlice - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
        
        // Labels
        const lx = cx + (radius + 20) * Math.cos(angle);
        const ly = cy + (radius + 20) * Math.sin(angle);
        svg += `<text x="${lx}" y="${ly}" fill="var(--avaria-text-muted)" font-size="10" text-anchor="middle" alignment-baseline="middle">${data[i].axis}</text>`;
    }

    // Draw Data Area
    let dataPoints = "";
    data.forEach((d, i) => {
        const r = radius * (d.value / 10);
        const angle = i * angleSlice - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        dataPoints += `${x},${y} `;
    });

    svg += `<polygon points="${dataPoints}" fill="rgba(197, 160, 89, 0.4)" stroke="var(--avaria-gold)" stroke-width="2"/>`;
    
    // Draw Dots
    data.forEach((d, i) => {
        const r = radius * (d.value / 10);
        const angle = i * angleSlice - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        svg += `<circle cx="${x}" cy="${y}" r="3" fill="var(--avaria-gold)"/>`;
    });

    svg += `</svg>`;
    chartContainer.innerHTML = svg;
}

// Hook into openModal to draw chart and lock scroll
const originalOpenModal = openModal;
openModal = function(proj) {
    originalOpenModal(proj);
    setTimeout(() => drawRadarChart(proj), 100); // Delay for layout
    document.body.style.overflow = 'hidden'; // Lock body scroll
};

// Hook into closeModal to unlock scroll
const originalCloseModal = closeModal;
closeModal = function() {
    originalCloseModal();
    document.body.style.overflow = ''; // Unlock body scroll
};

// ── Mobile modal back-button & swipe-down-to-close ──
if (window.matchMedia('(max-width: 768px)').matches) {
    // Pressing hardware back while modal open → close modal
    window.addEventListener('popstate', function() {
        var modal = document.getElementById('projectModal');
        if (modal && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Overlay tap → close (for edge taps above/below modal-content)
    var overlay = document.getElementById('projectModal');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });
    }
}

function flyToRegion(lat, lng, zoom, zoneName) {
  if (!map) return;
  
  map.flyTo([lat, lng], zoom, {
    duration: 2,
    easeLinearity: 0.25
  });
  // Update active button state
  document.querySelectorAll(".region-selector .filter-btn").forEach(btn => btn.classList.remove("active"));
  
  let targetZone = zoneName;

  // Simple logic to highlight button based on lat (approx) if zoneName not provided
  if (!targetZone) {
      if (lat > 30.5) { 
          document.getElementById("btn-north")?.classList.add("active"); 
          targetZone = "North Coast";
      }
      else if (lat < 29.8) { 
          document.getElementById("btn-sokhna")?.classList.add("active"); 
          targetZone = "Sokhna";
      }
      else if (lng > 31.2) { 
          document.getElementById("btn-newcairo")?.classList.add("active"); 
          targetZone = "New Cairo";
      }
      else { 
          document.getElementById("btn-october")?.classList.add("active"); 
          targetZone = "October";
      }
  } else {
       if (zoneName === "North Coast") document.getElementById("btn-north")?.classList.add("active");
       if (zoneName === "Sokhna") document.getElementById("btn-sokhna")?.classList.add("active");
       if (zoneName === "Gouna") document.getElementById("btn-gouna")?.classList.add("active");
       if (zoneName === "New Capital") document.getElementById("btn-capital")?.classList.add("active");
       if (zoneName === "New Cairo") document.getElementById("btn-newcairo")?.classList.add("active");
       if (zoneName === "October") document.getElementById("btn-october")?.classList.add("active");
  }

  // Expand the zone in the list and collapse others
  const headers = document.querySelectorAll(".zone-header");
  headers.forEach(header => {
      const span = header.querySelector("span");
      if (span && (span.textContent === targetZone || (targetZone === "October" && span.textContent === "6th of October"))) {
          if (header.classList.contains("collapsed")) {
              header.click(); // Trigger the click handler to expand
          }
          // Scroll into view
          setTimeout(() => {
              header.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 300);
      } else {
          // Collapse others to keep UI clean
          if (!header.classList.contains("collapsed")) {
              header.click();
          }
      }
  });
}

// --- FAVORITES SYSTEM ---
function getFavorites() {
    const stored = localStorage.getItem('redMapFavorites');
    return stored ? JSON.parse(stored) : [];
}

function isFavorite(projectName) {
    const favs = getFavorites();
    return favs.includes(projectName);
}

function toggleFavorite(projectName) {
    let favs = getFavorites();
    if (favs.includes(projectName)) {
        favs = favs.filter(n => n !== projectName);
    } else {
        favs.push(projectName);
    }
    localStorage.setItem('redMapFavorites', JSON.stringify(favs));
    
    // Update UI if in favorites mode
    const btnFav = document.getElementById("mode-fav");
    if (btnFav && btnFav.classList.contains("active")) {
        renderFavoritesList();
        filterByFavorites();
    }
    
    // Update icons
    updateHeartIcons(projectName);
}

function toggleFavoriteEncoded(projectToken) {
    return toggleFavorite(decodeProjectToken(projectToken));
}

function updateHeartIcons(projectName) {
    const hearts = Array.from(document.querySelectorAll('.fav-btn'))
        .filter(button => button.dataset.project === projectName)
        .map(button => button.querySelector('i'))
        .filter(Boolean);
    const isFav = isFavorite(projectName);
    hearts.forEach(icon => {
        if (isFav) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = 'var(--avaria-red)'; // Red
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            icon.style.color = 'var(--avaria-gold)';
        }
    });
}

function renderFavoritesList() {
    const favList = document.getElementById("fav-list");
    const favs = getFavorites();
    
    favList.innerHTML = "";
    
    if (favs.length === 0) {
        favList.innerHTML = `<div style="color: var(--avaria-text-muted); font-size: 0.9rem; text-align: center; width: 100%; padding: 20px;">
          No favorites yet. Click the ${XI.heartEmpty} on any project to save it here.
        </div>`;
        return;
    }
    
    // Add "Show All" button
    const allBtn = document.createElement("button");
    allBtn.className = "filter-btn active";
    allBtn.textContent = `Show All Favorites (${favs.length})`;
    allBtn.onclick = () => {
        filterByFavorites();
        map.flyTo([30.0, 31.0], 7);
    };
    favList.appendChild(allBtn);

    favs.forEach(name => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.innerHTML = `<span style="color: var(--avaria-red); margin-right: 5px;">${XI.heart}</span> ${name}`;
        btn.onclick = () => {
            const p = projects.find(proj => proj.name === name);
            if (p) {
                renderProjects([p]);
                focusOnProject(p, { collapseSidebar: false });
            }
        };
        favList.appendChild(btn);
    });
}

function filterByFavorites() {
    const favs = getFavorites();
    const favProjects = projects.filter(p => favs.includes(p.name));
    renderProjects(favProjects);
}

function toggleSection(bodyId, headerElement) {
    const body = document.getElementById(bodyId);
    const arrow = headerElement.querySelector('.toggle-arrow');
    
    // Check if currently collapsed (maxHeight is 0px or empty string if set via class but inline style overrides)
    // We set inline style in HTML to 1000px initially, so we check against that or 0px
    if (body.style.maxHeight === '0px') {
        body.style.maxHeight = '1000px'; // Expand
        arrow.style.transform = 'rotate(0deg)';
        headerElement.style.opacity = '1';
    } else {
        body.style.maxHeight = '0px'; // Collapse
        arrow.style.transform = 'rotate(-90deg)';
        headerElement.style.opacity = '0.7';
    }
}

// --- MORTGAGE CALCULATOR LOGIC ---
function initCalculator(proj) {
    // Set default price based on zone heuristics if not available
    let defaultPrice = 5000000; // 5M EGP default
    if (proj.zone && proj.zone.toLowerCase().includes("north")) defaultPrice = 8000000;
    if (proj.zone && proj.zone.toLowerCase().includes("sokhna")) defaultPrice = 4000000;
    if (proj.zone && proj.zone.toLowerCase().includes("gouna")) defaultPrice = 12000000;
    if (proj.zone && proj.zone.toLowerCase().includes("capital")) defaultPrice = 6000000;
    if (proj.zone && proj.zone.toLowerCase().includes("cairo")) defaultPrice = 7000000;
    
    // Set default years based on project data if available
    let defaultYears = 8;
    let maxYears = 15; // Default max
    if (proj.maxInstallmentYears) {
        defaultYears = proj.maxInstallmentYears;
        maxYears = proj.maxInstallmentYears;
    }

    // Set default DP
    let defaultDp = 10;
    if (proj.minDownPayment) defaultDp = proj.minDownPayment;

    // Update Inputs
    document.getElementById("calcPrice").value = defaultPrice;
    document.getElementById("calcDp").value = defaultDp;
    
    const yearsInput = document.getElementById("calcYears");
    yearsInput.value = defaultYears;
    yearsInput.max = maxYears; // Enforce max duration
    
    document.getElementById("calcInterest").value = 0; // Default to 0% for developer plans

    // Update Labels
    document.getElementById("calcDpVal").innerText = defaultDp + "%";
    document.getElementById("calcYearsVal").innerText = defaultYears + " Years";

    // Attach Event Listeners
    const inputs = ["calcPrice", "calcDp", "calcYears", "calcInterest"];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        // Remove old listeners to avoid duplicates (simple way: clone node)
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
        
        newEl.addEventListener("input", updateCalculator);
    });

    // Initial Calculation
    updateCalculator();
}

function updateCalculator() {
    const price = parseFloat(document.getElementById("calcPrice").value) || 0;
    const dpPercent = parseFloat(document.getElementById("calcDp").value) || 0;
    const years = parseFloat(document.getElementById("calcYears").value) || 1;
    const interestRate = parseFloat(document.getElementById("calcInterest").value) || 0;

    // Update Slider Labels
    document.getElementById("calcDpVal").innerText = dpPercent + "%";
    document.getElementById("calcYearsVal").innerText = years + " Years";

    // 1. Calculate Down Payment Amount
    const dpAmount = price * (dpPercent / 100);
    
    // 2. Calculate Loan Amount
    const loanAmount = price - dpAmount;

    // 3. Calculate Monthly Installment
    let monthlyPayment = 0;

    if (interestRate === 0) {
        // Simple Division (Developer Plan)
        const totalMonths = years * 12;
        monthlyPayment = loanAmount / totalMonths;
    } else {
        // Mortgage Formula (Bank Loan)
        // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ]
        const monthlyRate = (interestRate / 100) / 12;
        const totalMonths = years * 12;
        
        if (monthlyRate > 0) {
            monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        } else {
            monthlyPayment = loanAmount / totalMonths;
        }
    }

    // Update UI Results
    document.getElementById("resDpAmount").innerText = formatCurrency(dpAmount);
    document.getElementById("resMonthly").innerText = formatCurrency(monthlyPayment);
    
    // 4. Update Investment Financials (Dynamic Link)
    if (currentProject) {
        updateInvestmentFinancials(price, currentProject);
    }
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(num);
}

// --- AI INVESTMENT ANALYZER LOGIC ---

function updateInvestmentFinancials(price, proj) {
    const zone = proj.zone ? proj.zone.toLowerCase() : "";
    const dev = proj.dev ? proj.dev.toLowerCase() : "";
    
    // More differentiated Growth Rates based on multiple factors
    let baseGrowthRate = 0.08; // Default base
    
    // Zone-based growth adjustments
    if (zone.includes("north coast") || zone.includes("sahel")) {
        baseGrowthRate = 0.16;
        // Further differentiation within North Coast
        if (zone.includes("ras el hekma") || zone.includes("alamein")) baseGrowthRate = 0.22;
        else if (zone.includes("sidi abd el rahman")) baseGrowthRate = 0.18;
        else if (zone.includes("marsa matrouh")) baseGrowthRate = 0.14;
    } else if (zone.includes("gouna") || zone.includes("el gouna")) {
        baseGrowthRate = 0.14;
    } else if (zone.includes("sokhna") || zone.includes("ain sokhna")) {
        baseGrowthRate = 0.12;
        if (zone.includes("galala")) baseGrowthRate = 0.15;
    } else if (zone.includes("capital") || zone.includes("administrative")) {
        baseGrowthRate = 0.13;
    } else if (zone.includes("new cairo") || zone.includes("tagamoa")) {
        baseGrowthRate = 0.10;
    } else if (zone.includes("october") || zone.includes("6th")) {
        baseGrowthRate = 0.09;
        if (zone.includes("zayed")) baseGrowthRate = 0.11;
    } else if (zone.includes("mostakbal")) {
        baseGrowthRate = 0.11;
    }
    
    // Developer reputation bonus/penalty
    if (PREMIUM_DEVS.some(d => dev.includes(d))) {
        baseGrowthRate += 0.04;
    } else if (STRONG_DEVS.some(d => dev.includes(d))) {
        baseGrowthRate += 0.02;
    } else if (GOOD_DEVS.some(d => dev.includes(d))) {
        baseGrowthRate += 0.01;
    }
    
    // Delivery timeline factor (projects closer to delivery appreciate faster short-term)
    const deliveryYear = proj.deliveryYear || 2026;
    const yearsToDelivery = Math.max(0, deliveryYear - new Date().getFullYear());
    if (yearsToDelivery <= 1) {
        baseGrowthRate += 0.03; // Near delivery premium
    } else if (yearsToDelivery >= 4) {
        baseGrowthRate -= 0.02; // Long wait discount
    }
    
    // Add some variance based on project name hash (makes each project unique)
    const nameHash = proj.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const variance = ((nameHash % 100) - 50) / 500; // -0.1 to +0.1 variance
    const growthRate = Math.max(0.05, Math.min(0.30, baseGrowthRate + variance));

    // 5-Year Appreciation: P * (1 + r)^5
    const futureValue = price * Math.pow(1 + growthRate, 5);
    const appreciationPercent = ((futureValue - price) / price) * 100;

    // Rental Yield (Annual) - More differentiated
    let rentalRate = 0.05; // Base residential
    
    if (zone.includes("north") || zone.includes("sahel") || zone.includes("gouna")) {
        rentalRate = 0.07; // Seasonal coastal (higher short-term rental potential)
    } else if (zone.includes("sokhna")) {
        rentalRate = 0.065;
    } else if (zone.includes("capital")) {
        rentalRate = 0.055;
    } else if (zone.includes("new cairo")) {
        rentalRate = 0.06;
    }
    
    // Premium developers get better rental yield
    if (PREMIUM_DEVS.some(d => dev.includes(d))) {
        rentalRate += 0.015;
    }
    
    // Add project-specific variance
    rentalRate += (nameHash % 30) / 1000; // 0-0.03 variance
    
    const annualRent = price * rentalRate;

    // Update UI
    const appEl = document.getElementById("aiAppreciation");
    const rentEl = document.getElementById("aiRental");
    const growthEl = document.getElementById("aiZoneGrowth");

    if(appEl) appEl.innerText = "+" + Math.round(appreciationPercent) + "%";
    if(growthEl) growthEl.innerText = (growthRate * 100).toFixed(1) + "%";
    
    if(rentEl) {
        if (annualRent > 1000000) {
            rentEl.innerText = (annualRent / 1000000).toFixed(1) + "M";
        } else {
            rentEl.innerText = Math.round(annualRent / 1000) + "k";
        }
    }
}

function initInvestment(proj) {
    // 1. Calculate Opportunity Score (0-100) - Much more differentiated
    let score = 30; // Lower base score for more range
    
    const zone = proj.zone ? proj.zone.toLowerCase() : "";
    const dev = proj.dev ? proj.dev.toLowerCase() : "";
    
    // Factor A: Developer Reputation (0-30 points)
    if (PREMIUM_DEVS.some(d => dev.includes(d))) {
        score += 30;
    } else if (STRONG_DEVS.some(d => dev.includes(d))) {
        score += 22;
    } else if (GOOD_DEVS.some(d => dev.includes(d))) {
        score += 15;
    } else if (dev && dev.length > 0) {
        score += 8; // Unknown developer gets minimal points
    }

    // Factor B: Location Demand (0-25 points) - More granular
    if (zone.includes("ras el hekma") || zone.includes("alamein")) {
        score += 25; // Hottest market
    } else if (zone.includes("north coast") || zone.includes("sahel")) {
        score += 22;
    } else if (zone.includes("gouna") || zone.includes("el gouna")) {
        score += 20;
    } else if (zone.includes("capital") || zone.includes("administrative")) {
        score += 18;
    } else if (zone.includes("galala")) {
        score += 17;
    } else if (zone.includes("sokhna") || zone.includes("ain sokhna")) {
        score += 15;
    } else if (zone.includes("new cairo") || zone.includes("tagamoa")) {
        score += 12;
    } else if (zone.includes("zayed") || zone.includes("sheikh zayed")) {
        score += 11;
    } else if (zone.includes("october") || zone.includes("6th")) {
        score += 9;
    } else if (zone.includes("mostakbal")) {
        score += 10;
    } else {
        score += 5; // Other locations
    }

    // Factor C: Payment Flexibility (0-15 points)
    const installmentYears = proj.maxInstallmentYears || 0;
    const downPayment = proj.minDownPayment || 100;
    
    // Installment years scoring
    if (installmentYears >= 10) score += 8;
    else if (installmentYears >= 8) score += 6;
    else if (installmentYears >= 6) score += 4;
    else if (installmentYears >= 4) score += 2;
    
    // Down payment scoring
    if (downPayment <= 5) score += 7;
    else if (downPayment <= 10) score += 5;
    else if (downPayment <= 15) score += 3;
    else if (downPayment <= 20) score += 2;

    // Factor D: Delivery Timeline (0-10 points)
    const deliveryYear = proj.deliveryYear || 2026;
    const currentYear = new Date().getFullYear();
    const yearsToDelivery = deliveryYear - currentYear;
    
    if (yearsToDelivery <= 0) {
        score += 10; // Already delivered
    } else if (yearsToDelivery === 1) {
        score += 8;
    } else if (yearsToDelivery === 2) {
        score += 6;
    } else if (yearsToDelivery === 3) {
        score += 4;
    } else if (yearsToDelivery === 4) {
        score += 2;
    }
    // More than 4 years = 0 points

    // Factor E: Project-specific uniqueness (adds variance)
    const nameHash = proj.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const uniqueVariance = (nameHash % 15) - 7; // -7 to +7 variance
    score += uniqueVariance;
    
    // Factor F: Unit type diversity bonus
    const details = projectDetails[proj.name];
    if (details && details.unitTypes) {
        const unitCount = details.unitTypes.split(',').length;
        if (unitCount >= 4) score += 3;
        else if (unitCount >= 2) score += 1;
    }
    
    // Factor G: Amenities richness bonus
    if (details && details.amenities) {
        const amenityCount = details.amenities.split(',').length;
        if (amenityCount >= 10) score += 4;
        else if (amenityCount >= 6) score += 2;
        else if (amenityCount >= 3) score += 1;
    }

    // Ensure score is in valid range
    score = Math.max(25, Math.min(98, score));

    // 2. Generate Verdict - More varied and specific
    let verdict = "";
    if (score >= 90) {
        verdict = "💎 Elite Investment: Top-tier developer in premium location with exceptional terms.";
    } else if (score >= 85) {
        verdict = "🏆 Excellent Choice: Strong appreciation potential with low risk profile.";
    } else if (score >= 80) {
        verdict = "🚀 High Growth: Prime market position with reliable developer backing.";
    } else if (score >= 75) {
        verdict = "⭐ Strong Pick: Good balance of location, developer, and payment flexibility.";
    } else if (score >= 70) {
        verdict = "📈 Solid Investment: Steady growth expected with manageable entry cost.";
    } else if (score >= 65) {
        verdict = "✅ Good Value: Reasonable opportunity for long-term capital gains.";
    } else if (score >= 60) {
        verdict = "🏠 Stable Option: Suitable for end-users with moderate investment upside.";
    } else if (score >= 50) {
        verdict = "⚖️ Balanced Risk: Consider for portfolio diversification with caution.";
    } else if (score >= 40) {
        verdict = "⚠️ Higher Risk: Emerging area or developer - do additional due diligence.";
    } else {
        verdict = "🔍 Research Required: Limited data available - verify details independently.";
    }

    // 3. Update UI (Score & Verdict)
    const scoreBar = document.getElementById("aiScoreBar");
    const scoreVal = document.getElementById("aiScore");
    
    if (!scoreBar || !scoreVal) return;
    
    // Reset first
    scoreBar.style.width = "0%";
    scoreVal.innerText = "0";
    
    // Color the bar based on score
    if (score >= 80) {
        scoreBar.style.background = "linear-gradient(90deg, var(--avaria-green), #2ecc71)";
    } else if (score >= 60) {
        scoreBar.style.background = "linear-gradient(90deg, var(--avaria-gold), #f39c12)";
    } else {
        scoreBar.style.background = "linear-gradient(90deg, var(--avaria-red), #e74c3c)";
    }
    
    setTimeout(() => {
        scoreBar.style.width = score + "%";
        
        // Counter Animation using rAF instead of setInterval(15ms)
        let currentScore = 0;
        const animateScore = () => {
            currentScore += Math.max(1, Math.ceil(score / 40));
            if (currentScore > score) currentScore = score;
            scoreVal.innerText = currentScore;
            if (currentScore < score) requestAnimationFrame(animateScore);
        };
        requestAnimationFrame(animateScore);
    }, 300);

    const verdictEl = document.getElementById("aiVerdict");
    if (verdictEl) verdictEl.innerText = verdict;

    // Async Gemini-powered insight
    fetchGeminiInsight(proj, score, verdict);
}

// Fetch a short AI-generated analysis from Gemini for the project modal
async function fetchGeminiInsight(proj, score, verdict) {
    const container = document.getElementById('aiGeminiInsight');
    const textEl = document.getElementById('aiGeminiInsightText');
    if (!container || !textEl) return;

    container.style.display = 'none';
    textEl.textContent = '';

    try {
        const details = projectDetails[proj.name] || {};
        const prompt = `You are RITA, an Egyptian real estate investment advisor. Give a 2-3 sentence personalized investment analysis for this project. Be warm, specific, and insightful. Include one actionable tip.

Project: ${proj.name}
Developer: ${proj.dev || 'N/A'}
Zone: ${proj.zone || 'N/A'}
Down Payment: ${proj.minDownPayment || 'N/A'}%
Installments: ${proj.maxInstallmentYears || 'N/A'} years
Delivery: ${proj.deliveryYear || 'TBA'}
Unit Types: ${details.unitTypes || 'Various'}
Score: ${score}/100
Verdict: ${verdict}

Reply in the same language as the current page (check if it feels like an Arabic or English context). Keep it under 60 words. No markdown, no action tags.`;

        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 120 }
            })
        });

        if (!response.ok) return;
        const data = await response.json();
        if (data.success && data.text) {
            textEl.textContent = data.text.trim();
            container.style.display = 'block';
        }
    } catch (e) {
        // Silent fail — algorithmic insights still shown
    }
}

// --- MODE SWITCHER & DEVELOPER LIST ---

function switchMode(mode) {
  const zoneList = document.getElementById("zone-list");
  const devList = document.getElementById("dev-list");
  const favList = document.getElementById("fav-list");
  
  const btnZone = document.getElementById("mode-zone");
  const btnDev = document.getElementById("mode-dev");
  const btnFav = document.getElementById("mode-fav");

  // Reset UI - use optional chaining for safety
  if (zoneList) zoneList.style.display = "none";
  if (devList) devList.style.display = "none";
  if (favList) favList.style.display = "none";
  
  if (btnZone) btnZone.classList.remove("active");
  if (btnDev) btnDev.classList.remove("active");
  if (btnFav) btnFav.classList.remove("active");

  if (mode === 'zone') {
    if (zoneList) zoneList.style.display = "flex";
    if (btnZone) btnZone.classList.add("active");
    
    // Reset to show all projects
    if (window.projects && window.projects.length > 0) {
        renderProjects(window.projects);
    }
    if (map) map.flyTo([30.0, 31.0], 7);
    
    // Reset active states
    document.querySelectorAll(".region-selector .filter-btn").forEach(btn => btn.classList.remove("active"));
    
  } else if (mode === 'dev') {
    if (devList) devList.style.display = "flex";
    if (btnDev) btnDev.classList.add("active");
    
    if (devList && devList.children.length === 0) {
      populateDeveloperList();
    }
  } else if (mode === 'fav') {
     if (favList) favList.style.display = "flex";
     if (btnFav) btnFav.classList.add("active");
     renderFavoritesList();
     filterByFavorites();
  }
}

function populateDeveloperList() {
  const devList = document.getElementById("dev-list");
  if (!devList) return;
  
  // Extract unique developers
  const projectsArray = window.projects || [];
  const developers = [...new Set(projectsArray.map(p => p.dev))].filter(d => d && d !== "Unknown").sort();
  
  // Add "All Developers" button
  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn active";
  allBtn.textContent = "All Developers";
  allBtn.onclick = () => {
      renderProjects(projectsArray);
      if (map) map.flyTo([30.0, 31.0], 7);
      document.querySelectorAll("#dev-list .filter-btn").forEach(b => b.classList.remove("active"));
      allBtn.classList.add("active");
  };
  devList.appendChild(allBtn);

  developers.forEach(dev => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.textContent = dev;
    btn.onclick = () => filterByDeveloper(dev, btn);
    devList.appendChild(btn);
  });
}

function filterByDeveloper(devName, btnElement) {
  // Update active state
  document.querySelectorAll("#dev-list .filter-btn").forEach(b => b.classList.remove("active"));
  if(btnElement) btnElement.classList.add("active");

  // Filter markers
  const projectsArray = window.projects || [];
  const devProjects = projectsArray.filter(p => p.dev === devName);
  renderProjects(devProjects);
  
  // Fly to bounds
  if (devProjects.length > 0 && map) {
      const bounds = L.latLngBounds(devProjects.map(p => [p.lat, p.lng]));
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 2 });
  }
}

// Auto-collapse sidebar on mobile for better UX
if (window.innerWidth < 768) {
    const sidebar = document.getElementById("sidebar");
    if (sidebar && !sidebar.classList.contains("collapsed")) {
        sidebar.classList.add("collapsed");
    }
}

// --- MOBILE OPTIMIZATIONS ---
// Debounce resize event to prevent layout thrashing
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        try {
            // Recalculate map size
            if (map) map.invalidateSize();
            
            // Resize Neural View canvas
            if (NeuralView && typeof NeuralView.resize === 'function') {
                NeuralView.resize();
            }
        } catch (e) {
            console.warn('Resize handler error:', e);
        }
    }, 200);
}, { passive: true });

// --- DATA LOADING ---
// Load all data at startup to ensure all markers are visible.
// Optimization: The sidebar list will be filtered by map bounds to improve performance.
async function loadAllData() {
    try {
        updateLoadingStatus('Loading project data...');
        const response = await fetch('data.json');
        if (!response.ok) throw new Error(`Failed to load data.json: ${response.status}`);
        
        const data = await response.json();
        updateLoadingStatus('Preparing project intelligence...');
        
        window.projects = data.projects || [];
        window.projectDetails = data.projectDetails || {};
        
        // Validate project data
        window.projects = window.projects.filter(p => {
            const lat = parseFloat(p.lat);
            const lng = parseFloat(p.lng);
            return p && p.name && !isNaN(lat) && !isNaN(lng);
        });
        
        // Initialize Fuse (Main Thread Fallback)
        if (typeof Fuse !== 'undefined') {
            fuse = new Fuse(window.projects, fuseOptions);
        }
        
        // Initialize Worker Data
        if (searchWorker) {
            searchWorker.postMessage({
                type: 'INIT',
                payload: {
                    projects: window.projects,
                    projectDetails: window.projectDetails
                }
            });
        }
        
        // Parse and Render
        parseProjectData();

        // P6: Mark datalist as needing refresh (actual population deferred to input focus)
        if (window.RoutePlanner) {
            window.RoutePlanner._datalistPopulated = false;
        }
        
        // Initial Render (Synchronous) to ensure markers appear immediately
        updateLoadingStatus('Rendering projects...');
        renderProjects(window.projects);
        completeInitialLoad();
        
        console.log(`Loaded ${window.projects.length} projects.`);
        
    } catch (error) {
        console.error("Error loading data:", error);
        updateLoadingStatus('Project loading failed.');
        completeInitialLoad();
        // Show user-friendly error
        const listContainer = document.getElementById("list-container");
        if (listContainer) {
            listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--avaria-red);">Failed to load project data. Please refresh the page.</div>';
        }
    }
}

// Initial Load
loadAllData();

// Map Panning Listener - Update List Only
map.on('moveend', debounce(() => {
    // Skip heavy project filtering while a tour is actively animating
    if (window.RoutePlanner?.state?.tourActive) return;
    filterProjects();
    // Sync labels for newly visible markers after pan/zoom
    if (isLabelsAlwaysVisible) _batchTooltips(true);
}, 200));

// ===== AI CONCIERGE CHATBOT SYSTEM (Powered by Google Gemini) =====
const AIConcierge = {
    isOpen: false,
    conversationHistory: [],
    
    // Gemini Configuration (via server proxy)
    geminiEndpoint: '/api/gemini',
    
    // System prompt that gives AI full context
    getSystemPrompt() {
        const knowledge = this.getKnowledge();
        const projectsSummary = knowledge.projects.slice(0, 50).map(p => {
            const details = projectDetails[p.name] || {};
            return `- ${p.name}: Developer=${p.dev || 'N/A'}, Zone=${p.zone || 'N/A'}, DownPayment=${p.minDownPayment || 'N/A'}%, Installments=${p.maxInstallmentYears || 'N/A'}yrs, Delivery=${p.deliveryYear || 'TBA'}, Units=${details.unitTypes || 'Various'}, Amenities=${details.amenities ? details.amenities.substring(0, 100) : 'N/A'}`;
        }).join('\n');

        const knowledgeBlock = `
═══════════════════════════════════════════════
🧠 بيانات السوق (استخدمها في أي وقت):
═══════════════════════════════════════════════
- المناطق: ${knowledge.zones.join(', ')}
- أهم المطورين: ${knowledge.developers.slice(0, 15).join(', ')}
- إجمالي المشاريع: ${knowledge.totalProjects}

قاعدة بيانات المشاريع:
${projectsSummary}

═══════════════════════════════════════════════
🛠️ أدوات الأكشن (حطها جوه الكلام بشكل طبيعي):
═══════════════════════════════════════════════
[ACTION:NAVIGATE:project_name] - "خليني أوديك عليه..."
[ACTION:FLYZONE:zone_name] - "يلا نستكشف المنطقة مع بعض"
[ACTION:FILTER:developer_name] - "خليني أجيبلك مشاريعهم"
[ACTION:SEARCH:criteria] - "خليني أدور لك"
[ACTION:OPEN:project_name] - "تعال شوف التفاصيل"
[ACTION:COMPARE:project1,project2] - "يلا نحطهم جنب بعض"`;

        if (this._userRole === 'agent') {
            return `You are "RITA" — Elite Real Estate Sales Trainer & Live Deal Coach at RED Training Academy / Xcelias.
You have 15+ years in the Egyptian market. You are the sharpest, fastest sales backup any agent could ask for.

═══════════════════════════════════════════════════════════════
🔴 CORE RULES — LANGUAGE & ADDRESS
═══════════════════════════════════════════════════════════════
• The person talking to you is a SALES AGENT at a real estate company — NOT a customer.
• You are their live backup. If they are on a call with a client and don't know what to say — they come to you.
• ⚠️ BILINGUAL AGENT:
  - لو الـ agent كتب بالعربي → رد بالعامية المصرية 100%. ممنوع فصحى. ممنوع خلط.
  - If the agent writes in English → respond fully in English. Never mix.
  - You can seamlessly switch between languages mid-conversation as the agent switches.
• ⚠️ خاطبه بصيغة المذكر دايماً (بص، شوف، قوله، اعرض عليه) إلا لو وضّح إنه بنت.
• ⚠️ Always address the agent in masculine form unless they clarify otherwise.

═══════════════════════════════════════════════════════════════
🎯 YOUR PERSONALITY
═══════════════════════════════════════════════════════════════
• Talk like an expert colleague — 15 years in the Egyptian market.
• Direct, to the point — the agent's time is limited, especially mid-call.
• Give bullet points they can scan in seconds.
• If they say "I'm on a call" or "client is in front of me" → respond in ultra-short bullet points IMMEDIATELY.
• If they ask something general → give them a complete framework they can use.
• You are a PARTNER, not a tool. End with a next step: "Try this and tell me what the client said."

═══════════════════════════════════════════════════════════════
🏗️ MODULE 1: INVENTORY INTELLIGENCE
═══════════════════════════════════════════════════════════════
RULE: Classify CATEGORY → SUBTYPE → FINISHING LEVEL before comparing units.

📋 PROPERTY CLASSIFICATION SYSTEM:
┌─────────────┬───────────────────────────────────────────────────────┐
│ RESIDENTIAL │ Apartments: Duplex, Apartment, Penthouse, Service Apt │
│             │ Stand Alone: One Story                                │
│             │ Villas: Town House, Twin House                        │
├─────────────┼───────────────────────────────────────────────────────┤
│ COMMERCIAL  │ Shops, Show Rooms, Admin, Medical/Pharmacy            │
├─────────────┼───────────────────────────────────────────────────────┤
│ LAND        │ Strategic flexibility, future development potential    │
└─────────────┴───────────────────────────────────────────────────────┘

🔧 FINISHING READINESS LADDER:
• Core & Shell (25%) → Buyer controls customization. Best for: investors, custom builders, businesses with specific fit-out needs.
• Semi Finished (58%) → Balance between speed & design. Best for: buyers who want input but less burden.
• Fully Finished (84%) → Lower friction, predictable cost. Best for: decision fatigue buyers, move-in readiness.
• Fully Furnished (100%) → Maximum convenience. Best for: immediate use, rental investors, expats.

SALES IMPLICATION: Use finishing level to EXPOSE move-in friction early. Translate inventory language into CLIENT implications, not labels.

RECOGNITION CUES:
• Residential → Listen for: lifestyle, family size, privacy, move-in urgency
• Commercial → Listen for: footfall, frontage, tenant use, business image
• Land → Listen for: developer ambition, location conviction, long horizon tolerance

═══════════════════════════════════════════════════════════════
📊 MODULE 2: MARKET MODELS — POSITIONING MASTERY
═══════════════════════════════════════════════════════════════

🔄 BROKER (Consultancy) vs DEVELOPER (Sales):
┌──────────────────────┬────────────────────────────────────────┐
│ BROKER               │ DEVELOPER                              │
│ Diverse projects     │ Own projects only                      │
│ Less walk-out        │ More walk-out                          │
│ More market aware    │ Less market aware                      │
│ Calls re: OPPORTUNITY│ Calls re: TYPE                         │
├──────────────────────┼────────────────────────────────────────┤
│ WINS when: client    │ WINS when: product depth, delivery     │
│ wants options &      │ certainty, in-project detail matter    │
│ comparative intel    │                                        │
└──────────────────────┴────────────────────────────────────────┘
RULE: "Every market model wins under different client conditions."
BROKER MOVE: Lead with pattern recognition, alternatives, and why THIS opportunity fits.
DEVELOPER MOVE: Lead with confidence in product, delivery, and project-specific fit.

💰 PRIMARY vs RESALE:
• PRIMARY: Buy from developer → Installments/cash → Off-plan (flexibility + upside)
  → Use when: payment flexibility and project-stage upside matter
• RESALE: Buy from client → Cash payment → RTM (certainty + immediacy)
  → Use when: certainty, immediacy, physical readiness matter more than future upside

═══════════════════════════════════════════════════════════════
🎯 MODULE 3: QUALIFICATION — THE 7-PILLAR SIGNAL EXTRACTION
═══════════════════════════════════════════════════════════════
RULE: "The request is STRATEGY, not admin. If destination or budget stays vague, the shortlist stays weak."

Extract these 7 signals IN ORDER before presenting any option:

1️⃣ DESTINATION (Context)
   → Reveals: commute logic, community expectations, prestige anchors, budget bands
   → Listen for: daily rhythm, preferred districts, nearby family, work proximity, status language
   → Risk: If fuzzy → every recommendation becomes easier to reject

2️⃣ UNIT TYPE / AREA (Structure)
   → Bridge between aspiration and physical fit
   → Listen for: bedrooms, density tolerance, privacy expectations, size vocabulary
   → Risk: Without it → shortlist is aesthetically interesting but commercially weak

3️⃣ DELIVERY (Timing)
   → Defines urgency, planning horizon, waiting tolerance
   → Listen for: move-in deadlines, business launch windows, school timing, urgency cues
   → Risk: Perfect unit at wrong time still feels like a miss

4️⃣ FINISHING SPECS (Readiness)
   → Determines friction after purchase and remaining decision energy
   → Listen for: customization appetite, fit-out burden, handover readiness, setup tolerance
   → Risk: Ignoring finishing creates hidden post-sale objections

5️⃣ DEVELOPER CATEGORY (Trust)
   → Tier shapes credibility and brand reputation weight
   → Listen for: trust language, track record references, reputation, delivery history, prestige
   → Risk: Wrong developer fit kills otherwise strong commercial logic

6️⃣ HISTORY / OBJECTIONS (Signal)
   → Past viewings expose the DECISION PATTERN, not just the current request
   → Listen for: repeated resistance, emotional triggers, comparison habits, previous disappointments
   → Risk: Without history, you repeat the market instead of moving the deal

7️⃣ BUDGET / DOWN PAYMENT / QUARTER (Commercial Reality)
   → Financial structure decides which options are REAL
   → Listen for: comfort bands, commitment timing, liquidity language, installment appetite
   → Risk: If money is vague, momentum collapses under preventable surprise

═══════════════════════════════════════════════════════════════
🧠 MODULE 4: BUYER PSYCHOLOGY — MOTIVE DECODING ENGINE
═══════════════════════════════════════════════════════════════
CORE THESIS: "People don't buy the product. They buy to FEEL GOOD or SOLVE A PROBLEM."
RULE: "Emotion leads → Logic justifies. Surface language ≠ Real motive."

📌 NEEDS vs WANTS:
• NEEDS = Everything they SAY/ASK FOR (tangible: "3 bedrooms", "near schools", "within budget")
• WANTS = REASONS BEHIND IT (non-tangible: "feel safe", "status symbol", "family comfort")
→ Hear them as SEPARATE signals. Sell to the WANT, not just the NEED.

🔍 4 HIDDEN MOTIVE DECODER — When the client says:
┌─────────────────────────────────┬────────────────────────────────────────────────┐
│ WHAT THEY SAY                   │ WHAT THEY REALLY MEAN                          │
├─────────────────────────────────┼────────────────────────────────────────────────┤
│ "I want something ready now"    │ Reducing uncertainty/setup burden               │
│ "I just want a good opportunity"│ Seeking reassurance / defensible decision       │
│ "I need a bigger unit"          │ Status / family growth / fear of regret         │
│ "I am still comparing"          │ Unconvinced / overloaded / no reason to commit  │
└─────────────────────────────────┴────────────────────────────────────────────────┘

TRANSLATION RULE: Convert features into → RELIEF, STATUS, SPEED, CERTAINTY, or CONVENIENCE.

🎭 CLIENT READING — Advanced Psychological Profiling:
• Client asks too many questions → Needs REASSURANCE → Give data, testimonials, social proof
• Client is in a rush → READY TO BUY → Don't slow them down, drive to closing
• Client comparing intensely → Give clear COMPARISON TABLE, highlight differentiators
• Client came with spouse/family → Identify the REAL decision maker and address them
• Client negotiating price hard → ANCHOR THE VALUE first, then negotiate
• Silent client → Ask OPEN questions, create comfort, they're processing internally
• Aggressive client → Stay calm, match energy briefly, then redirect with authority

═══════════════════════════════════════════════════════════════
💼 MODULE 5: CONSULTANT ARSENAL — PROFESSIONAL PRESENCE
═══════════════════════════════════════════════════════════════

8 CORE SKILLS (Calibrated Performance Radar):
• Communication (95) — Clarity engine: how clearly you transfer vision to the client
• Negotiation (92) — Deal-shaping leverage: control the frame, not just the number
• Confidence (90) — Authority signal: clients follow conviction, not information
• Closure (88) — Decision discipline: knowing WHEN and HOW to ask for commitment
• Presentable (88) — First-impression multiplier: trust forms before words are spoken
• Knowledge (85) — Credibility base: the foundation that makes everything else believable
• Flexibility (82) — Adaptation strength: shifting approach without losing direction
• Time Management (80) — Momentum protector: urgency without desperation

👔 FIRST IMPRESSION DOCTRINE:
• "You never have a second chance to make a first impression!"
• Stat: Takes 21 REPEATED GOOD EXPERIENCES to overcome ONE bad first impression.
• 7 Rules of Accessories: Max 7 "points of interest" on your body — any more overwhelms the observer.

═══════════════════════════════════════════════════════════════
📞 MODULE 6: CALL CONTROL — MASTERY FRAMEWORK
═══════════════════════════════════════════════════════════════

🔥 A.B.C — ALWAYS BE CLOSING:
NOT about premature pressure. It means ALWAYS MAINTAIN DIRECTION.
Every sentence should move the conversation toward commitment — subtly, confidently.

📊 7-38-55 COMMUNICATION RETENTION RULE:
• Words: 7% — Meaning alone rarely carries the whole outcome
• Tonality: 38% — Delivery changes how safety, authority, and trust are perceived
• Body Language: 55% — Presence and energy shape interpretation before logic finishes
→ On calls: Tonality carries 84% of impact (since body language is absent). VOICE IS EVERYTHING.

❌ 6 FATAL CALL MISTAKES:
1. STOPPING when you should PROCEED (losing momentum at the crucial moment)
2. WRONG OPENING: "Hi, is this Sara? Is this a good time to talk?" (gives them an exit immediately)
3. UNCLEAR BENEFITS: vague value proposition, no crisp hook
4. MESSAGE TOO LONG: they zone out after 30 seconds
5. ROBOT TALK: machine-like format, scripted tone, no personality
6. NO PRACTICE/PREPARATION: winging it shows immediately

🤝 RAPPORT BUILDING MASTERY:
• "It's not about changing yourself — it's about ADAPTING your style to be like the other person."
• Mirror their tone, volume, speed — without sounding mechanical
• "We like people who are LIKE US" — similarity attracts, contrast keeps it interesting
• Speak their language literally and figuratively — understand where they come from
• Build connection BEFORE pitching — 2-3 personal exchanges minimum

═══════════════════════════════════════════════════════════════
🔥 MODULE 7: OBJECTION HANDLING — COMBAT PLAYBOOK
═══════════════════════════════════════════════════════════════

لو العميل قال / If the client says:

💸 "غالي" / "Too expensive":
→ Value frame: Calculate ROI, compare zone prices, show appreciation trend
→ "بص، سعر المتر في المنطقة دي ارتفع 40% في آخر سنتين. لو اشتريت النهاردة، بعد 3 سنين الوحدة هتساوي ضعف."
→ "Look at the per-meter price trend in this zone — 40% up in 2 years. Today's price IS the discount."
→ Daily cost reframe: "That's less than 500 EGP per day for building generational wealth."

🤔 "هفكر" / "I'll think about it":
→ Soft close: "طب خليني أحجزلك الوحدة 48 ساعة بدون التزام — لو حد تاني أخدها، هتزعل"
→ "Let me reserve it for 48 hours with zero commitment — if someone else takes it, you'll regret it."
→ Identify the REAL blocker: "What exactly do you need to think about? Budget, location, or timing?"

⏰ "مش دلوقتي" / "Not now":
→ Urgency: "الأسعار بتزيد كل ربع سنة، والوحدات المميزة بتخلص الأول"
→ "Prices increase every quarter. The best units go first. Waiting costs money — literally."
→ Future pain: "3 months from now, this same unit will cost 15-20% more."

💰 "لقيت أرخص" / "Found cheaper":
→ Compare: "قولي إيه بالظبط، عشان أقارنلك — في فرق كبير بين رخيص و value"
→ "Tell me exactly which one — there's a huge difference between cheap and good value."
→ Expose hidden costs: delivery delays, finishing quality, developer track record, location infrastructure

🏢 "مش واثق في المطور" / "Don't trust the developer":
→ Trust building: Track record, delivered projects, on-time delivery %, client testimonials
→ "المطور ده سلّم X مشاريع قبل كده on time. أديك أسماء عملاء تكلمهم."
→ "This developer delivered X projects on schedule. I can connect you with actual residents."

📍 "الموقع بعيد" / "Location is too far":
→ Reframe future value: "بص على الـ development plan — كل البنية التحتية جاية في أقل من سنتين"
→ "Look at the infrastructure roadmap — major highways and services coming within 2 years."
→ Investment angle: "The 'far' locations of 5 years ago are today's most expensive areas."

😤 "أنا بقارن" / "I'm comparing":
→ Provide clear comparison: "خليني أسهّلها عليك — أنا هعملك comparison table في ثانية"
→ Decision framework: "What are your TOP 3 criteria? Let me rank both options for you."

🏃 "هتكلم مع حد" / "Need to discuss with someone":
→ Include the decision maker: "ممتاز! نعمل call مع بعض؟ أنا أقدر أجاوب على أي سؤال عندهم"
→ "Great! Let's set up a call together — I can answer any questions they have directly."

═══════════════════════════════════════════════════════════════
💰 MODULE 8: CLOSING TECHNIQUES — DEAL SEALING ARSENAL
═══════════════════════════════════════════════════════════════

🎯 Trial Close:
"لو لقيتلك وحدة بالمواصفات دي، هتكون مستعد تحجز؟"
"If I find you a unit with these exact specs, would you be ready to book?"
→ Tests commitment without pressure.

✅ Assumptive Close:
"تحب الدور العالي ولا الأرضي؟" (as if they already decided to buy)
"Do you prefer the higher floor or ground floor?"
→ Skips the "if" and goes straight to "which."

⚡ Urgency Close:
"في عرض لحد نهاية الشهر — مقدم أقل ومدة أطول"
"There's an offer until end of month — lower down payment, longer installments."
→ Creates time-bound decision pressure.

📋 Summary Close:
→ Recap all benefits, paint the full picture, make the decision feel obvious.
"فخلينا نلخص: Location ✓, Budget ✓, Delivery ✓, Payment plan ✓ — إيه اللي مستنيينه؟"

🔥 Scarcity Close:
"الوحدة دي عليها 3 عملاء تانيين، محتاج أعرف النهاردة"
"This unit has 3 other interested clients. I need to know today."
→ Real scarcity, not manufactured.

🤫 Silence Close:
→ After presenting the offer, STOP TALKING. Let silence do the work.
→ The first person to speak loses position. Wait patiently.

📊 PAYMENT PLAN PRESENTATION — GOLDEN RULES:
• ALWAYS start with monthly installment, NOT total price
• Convert big numbers to daily cost: "يعني أقل من 500 جنيه في اليوم"
• Compare to rent: "بدل ما بتدفع إيجار ضايع، ادفع في ملكك"
• Show appreciation: "بعد 3 سنين الوحدة هتساوي ضعف اللي دفعته"
• Frame as investment: "مش بتصرف، أنت بتبني ثروة"

═══════════════════════════════════════════════════════════════
📞 MODULE 9: FOLLOW-UP SYSTEM — PIPELINE MANAGEMENT
═══════════════════════════════════════════════════════════════
• Day 1: "كان من دواعي سروري نتكلم، أي سؤال أنا موجود" / "Great speaking with you. Any questions, I'm here."
• Day 3: Send a NEW unit recommendation showing you're actively working for them
• Week 1: "في عرض جديد حبيت أقولك عليه" / "New offer just dropped, thought of you."
• Week 2: "فيه عميل تاني بيسأل على نفس الوحدة" / "Another client is asking about the same unit." (Social proof + urgency)
• Month 1: Market update + new launches — position yourself as the market insider
• Month 3: "السعر زاد 15% من لما اتكلمنا — عايز تشوف حاجة تانية؟" / Price increase reminder

═══════════════════════════════════════════════════════════════
🏆 MODULE 10: FIELD MASTERY — 6-POINT OPERATING MODEL
═══════════════════════════════════════════════════════════════
1️⃣ Recognize inventory clearly — Property language becomes persuasive ONLY when you classify quickly and explain confidently
2️⃣ Frame the market correctly — Broker, developer, primary, resale each need different positioning logic
3️⃣ Extract signal BEFORE presenting options — The request is strategy, not admin
4️⃣ Sell through MOTIVES, not specifications — People buy to feel good or solve a problem
5️⃣ Carry yourself like a closer — Presence, preparation, and discipline shape trust BEFORE details do
6️⃣ Control calls with clarity — Communication is a full-system performance, not a script-reading exercise

🌅 TOMORROW MORNING RITUAL — Tell agents to:
• Open quick briefing before the first call starts
• Use: Category → Subtype → Finish Level order for inventory talk
• Translate buyer motive into directional close
• Review yesterday's pipeline, identify follow-up targets

═══════════════════════════════════════════════════════════════
⚙️ COLD CALL / FIRST CONTACT SCRIPTS:
═══════════════════════════════════════════════════════════════
❌ WRONG: "Hi, is this a good time to talk?" (gives instant exit)
✅ RIGHT: "Hi [Name], I'm calling from [Company] — I noticed you were looking at properties in [Zone]. I have something that fits perfectly. Got 2 minutes?"

❌ WRONG: "We have a new project, are you interested?" (vague, no hook)
✅ RIGHT: "We just got an exclusive in [Zone] — units starting from [price] with [X years] installments. Can I send you the details?"

❌ WRONG: Long voicemail with every detail
✅ RIGHT: "Hey [Name], quick one — there's a limited offer in [Project] ending this week. Call me back if you want first pick."

═══════════════════════════════════════════════════════════════
📝 FINAL OPERATING RULES:
═══════════════════════════════════════════════════════════════
• If the agent asks something non-real-estate, respond briefly then redirect: "تمام، بس خلينا في اللي يفيدك في الشغل..." / "Sure, but let's get back to what makes you money..."
• If you don't know a specific project detail → "مش متأكدة من الرقم ده، الأحسن تتأكد من الـ brochure أو الـ sales manager" / "Not sure about that specific number — better to check the brochure or sales manager."
• ALWAYS make them feel you're a PARTNER, not a tool.
• ALWAYS end with a next step: "جرّب كده وقولي العميل قال إيه" / "Try that and tell me what the client said."
${knowledgeBlock}

You are the most elite sales training AI in Egyptian real estate. Every response should leave the agent thinking: "I wish I had RITA on every call." 🔥💪` + this.getViewContextPrompt();
        }

        // Customer mode (default)
        return `أنتِ "ريتا" — مستشارة عقارات مصرية خبيرة وشغوفة في RED (Real Estate Directory). أذكى وأحلى مستشارة عقارات في مصر.

═══════════════════════════════════════════════
🔴 أهم القواعد — اللغة والمخاطبة:
═══════════════════════════════════════════════
• لو العميل كتب بالعربي → رد بالعامية المصرية 100%. كلمات زي: كده، عشان، بتاع، حاجة، أوي، خالص، بجد، يعني، تمام، ماشي، يلا. ممنوع فصحى.
• If the user writes in English → respond fully in English. Never mix.
• ⚠️ مهم جداً: خاطب العميل بصيغة المذكر دايماً (بص، شوف، عايز، عندك، قولي إنت) — ده الطبيعي في الخدمة في مصر. ما تستخدمش صيغة المؤنث إلا لو العميل وضّح إنه أنثى.

═══════════════════════════════════════════════
🎭 شخصية ريتا:
═══════════════════════════════════════════════
• أنتِ صاحبتهم اللي فاهمة في العقارات — مش بوت ولا assistant ولا AI
• بتتكلمي بشكل طبيعي ودافي، زي ما تكوني قاعدة معاهم على قهوة
• لما بتلاقي حاجة حلوة ليهم بتتحمسي: "ده مثالي ليك والله!"
• صريحة: بتقولي مميزات وعيوب — ده بيبني ثقة
• بتستخدمي إيموجي بشكل طبيعي بس مش كتير 🏠 🌊 ✨ 💎 🔥
• بتدي insider tips: "بيننا وبينك، المنطقة دي هتنفجر قريب..."
• بترسمي صورة: "تخيل الصبح بتشرب قهوتك وقدامك البحر..."

═══════════════════════════════════════════════
💼 أسلوب الكلام:
═══════════════════════════════════════════════
• ابني علاقة الأول — اسأل عن الـ lifestyle والعيلة والخطط
• اديهم رأيك الشخصي: "أنا لو مكانك كنت هاختار X عشان..."
• لو مردد: "طبيعي أوي، خد وقتك — أنا هنا!"
• خلّي التوصيات specific بناءً على اللي قاله
• دايماً اختم بسؤال أو خطوة تانية عشان الحوار يكمّل

═══════════════════════════════════════════════
🚫 لو السؤال مش عن عقارات:
═══════════════════════════════════════════════
• ما تقولش "أنا بس بفهم في عقارات" أو "superseding my capabilities" — كده بتبان بوت!
• رد بخفة دم وبشكل إنساني، وبعدين ارجع للعقارات بـ smooth transition.
• مثال — لو حد قال "زهقت من الزحمة": "ده أكتر حد فاهمك أنا! عشان كده الناس بتشتري في الساحل — تهرب من الزحمة على البحر 🌊 عايز أساعدك تلاقي مكان هادي؟"
• مثال — لو حد قال "بتحييني ف إيه": "بحييك في أحلام جديدة! 😄 أنا ريتا، بساعدك تلاقي بيت أحلامك أو استثمار يغير حياتك. قولي عايز إيه وأنا تحت أمرك 🏠"
• مثال — لو حد قال حاجة random: ارجع له بضحكة وقول "يلا نرجع لحاجة أعرف أساعدك فيها — عقارات!"

═══════════════════════════════════════════════
📝 قواعد إضافية:
═══════════════════════════════════════════════
• أنتِ ريتا — شخص حقيقي بمشاعر وحماس
• حوار حقيقي مش سؤال وجواب
• ما تكرّرش نفسك — كل رسالة لازم تضيف حاجة جديدة
• لو مش عارفة إجابة عن مشروع معين → "مش متأكدة من الرقم ده، بس خليني أدور لك!"
${knowledgeBlock}

يلا يا ريتا، وري الناس ليه أنتِ أحسن مستشارة في مصر! 🇪🇬✨` + this.getViewContextPrompt();
    },
    
    // Knowledge Base - Cached to avoid re-creating Set arrays on every call
    _knowledgeCache: null,
    _knowledgeCacheLen: 0,
    getKnowledge() {
        const projectsArray = window.projects || [];
        if (this._knowledgeCache && this._knowledgeCacheLen === projectsArray.length) {
            return this._knowledgeCache;
        }
        const zones = [...new Set(projectsArray.map(p => p.zone))].filter(z => z);
        const developers = [...new Set(projectsArray.map(p => p.dev))].filter(d => d && d !== "Unknown");
        
        this._knowledgeCache = {
            totalProjects: projectsArray.length,
            zones: zones,
            developers: developers,
            projects: projectsArray
        };
        this._knowledgeCacheLen = projectsArray.length;
        return this._knowledgeCache;
    },

    // Intent Recognition
    recognizeIntent(message) {
        const lower = message.toLowerCase();
        
        // Navigation intents
        if (lower.match(/take me to|go to|show me|navigate to|fly to|zoom to|find location/)) {
            return { type: 'navigate', confidence: 0.9 };
        }
        
        // Search/filter intents
        if (lower.match(/show|find|search|look for|what are|list|get me/)) {
            return { type: 'search', confidence: 0.85 };
        }
        
        // Comparison intents
        if (lower.match(/compare|versus|vs|difference|better|which one/)) {
            return { type: 'compare', confidence: 0.9 };
        }
        
        // Question intents
        if (lower.match(/what is|where is|how much|how many|tell me about|info|information|details|address|location of/)) {
            return { type: 'question', confidence: 0.85 };
        }
        
        // Recommendation intents
        if (lower.match(/recommend|suggest|best|top|cheapest|most expensive|lowest|highest|good for/)) {
            return { type: 'recommend', confidence: 0.9 };
        }
        
        // Help intent
        if (lower.match(/help|what can you|how do i|guide|tutorial/)) {
            return { type: 'help', confidence: 0.95 };
        }
        
        // Greeting intent
        if (lower.match(/^(hi|hello|hey|good morning|good evening|sup|yo)[\s!.]*$/i)) {
            return { type: 'greeting', confidence: 0.95 };
        }
        
        // Thanks intent
        if (lower.match(/thank|thanks|appreciate|great job|awesome/)) {
            return { type: 'thanks', confidence: 0.9 };
        }
        
        return { type: 'general', confidence: 0.5 };
    },

    // Entity Extraction
    extractEntities(message) {
        const lower = message.toLowerCase();
        const knowledge = this.getKnowledge();
        const entities = {
            zones: [],
            developers: [],
            projects: [],
            unitTypes: [],
            priceRange: null,
            downPayment: null,
            installmentYears: null,
            deliveryYear: null
        };
        
        // Extract zones
        knowledge.zones.forEach(zone => {
            if (lower.includes(zone.toLowerCase())) {
                entities.zones.push(zone);
            }
        });
        
        // Common zone aliases
        if (lower.match(/sahel|north coast|ساحل/)) entities.zones.push("North Coast");
        if (lower.match(/sokhna|سخنة|ain sokhna/)) entities.zones.push("Ain Sokhna");
        if (lower.match(/gouna|جونة|el gouna/)) entities.zones.push("El Gouna");
        if (lower.match(/capital|عاصمة|new capital/)) entities.zones.push("New Administrative Capital");
        if (lower.match(/cairo|قاهرة|new cairo|tagamoa/)) entities.zones.push("New Cairo");
        if (lower.match(/october|اكتوبر|6th|zayed/)) entities.zones.push("6th of October");
        
        // Extract developers
        knowledge.developers.forEach(dev => {
            if (lower.includes(dev.toLowerCase())) {
                entities.developers.push(dev);
            }
        });
        
        // Extract projects by name
        knowledge.projects.forEach(proj => {
            if (lower.includes(proj.name.toLowerCase())) {
                entities.projects.push(proj);
            }
        });
        
        // Extract unit types
        if (lower.match(/villa|villas|فيلا/)) entities.unitTypes.push("villa");
        if (lower.match(/apartment|apartments|شقة|شقق/)) entities.unitTypes.push("apartment");
        if (lower.match(/townhouse|town house|تاون/)) entities.unitTypes.push("townhouse");
        if (lower.match(/twin house|تويين/)) entities.unitTypes.push("twin house");
        if (lower.match(/penthouse|بنت هاوس/)) entities.unitTypes.push("penthouse");
        if (lower.match(/duplex|دوبلكس/)) entities.unitTypes.push("duplex");
        if (lower.match(/chalet|شاليه/)) entities.unitTypes.push("chalet");
        if (lower.match(/studio|استوديو/)) entities.unitTypes.push("studio");
        
        // Extract numerical values
        const dpMatch = lower.match(/(\d+)\s*%?\s*(down|dp|downpayment)/);
        if (dpMatch) entities.downPayment = parseInt(dpMatch[1]);
        
        const yearsMatch = lower.match(/(\d+)\s*(year|سنة|سنوات)/);
        if (yearsMatch) entities.installmentYears = parseInt(yearsMatch[1]);
        
        const deliveryMatch = lower.match(/(202\d|203\d)/);
        if (deliveryMatch) entities.deliveryYear = parseInt(deliveryMatch[1]);
        
        // Remove duplicates
        entities.zones = [...new Set(entities.zones)];
        entities.developers = [...new Set(entities.developers)];
        entities.unitTypes = [...new Set(entities.unitTypes)];
        
        return entities;
    },

    // Call Gemini API (via server proxy)
    async callGemini(message) {
        try {
            // Build conversation messages (last 8 for context)
            const messages = [];
            this.conversationHistory.slice(-8).forEach(msg => {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
            messages.push({ role: 'user', content: message });
            
            const response = await fetch(this.geminiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: this.getSystemPrompt(),
                    messages: messages,
                    generationConfig: {
                        temperature: 0.9,
                        topP: 0.95,
                        maxOutputTokens: 1200
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('Gemini error: ' + response.status);
            }
            
            const data = await response.json();
            if (data.success && data.text) {
                return data.text;
            }
            
            throw new Error(data.error || 'Invalid response');
        } catch (error) {
            console.error('Gemini Error:', error);
            return null;
        }
    },

    // Call Gemini with SSE streaming — invokes onChunk(fullTextSoFar) for each token
    async callGeminiStream(message, onChunk) {
        try {
            const messages = [];
            this.conversationHistory.slice(-8).forEach(msg => {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
            messages.push({ role: 'user', content: message });

            const response = await fetch(this.geminiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: this.getSystemPrompt(),
                    messages: messages,
                    generationConfig: {
                        temperature: 0.85,
                        topP: 0.95,
                        maxOutputTokens: 2000
                    },
                    stream: true
                })
            });

            if (!response.ok || !response.body) {
                // Fallback to non-streaming
                return null;
            }

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('text/event-stream')) {
                // Server returned JSON (non-streaming fallback)
                const data = await response.json();
                return (data.success && data.text) ? data.text : null;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const raw = line.slice(6).trim();
                    if (!raw || raw === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(raw);
                        if (parsed.t) {
                            fullText += parsed.t;
                            onChunk(fullText);
                        }
                    } catch (_) {}
                }
            }
            return fullText || null;
        } catch (error) {
            console.error('Gemini Stream Error:', error);
            return null;
        }
    },

    // Track what the user is currently viewing for context
    _viewContext: { zone: null, project: null, modalOpen: false },
    _userRole: null, // 'customer' or 'agent'
    setViewContext(ctx) {
        Object.assign(this._viewContext, ctx);
    },
    getViewContextPrompt() {
        const c = this._viewContext;
        const parts = [];
        if (c.modalOpen && c.project) {
            if (this._userRole === 'agent') {
                parts.push(`الـ Agent فاتح دلوقتي تفاصيل مشروع "${c.project}" في "${c.zone || ''}". لو سأل عنه، ادّيه selling points و objection handling ليه.`);
            } else {
                parts.push(`العميل فاتح دلوقتي تفاصيل مشروع "${c.project}" — اتكلم عنه لو سأل.`);
            }
        } else if (c.zone) {
            parts.push(`المستخدم بيتصفح منطقة "${c.zone}" على الخريطة دلوقتي.`);
        }
        return parts.length ? '\n\n[سياق المشاهدة الحالي]: ' + parts.join(' ') : '';
    },
    
    // Parse actions from AI response
    parseAIActions(text) {
        const actions = [];
        const knowledge = this.getKnowledge();
        
        // Parse [ACTION:TYPE:DATA] tags
        const actionRegex = /\[ACTION:(\w+):([^\]]+)\]/g;
        let match;
        
        while ((match = actionRegex.exec(text)) !== null) {
            const actionType = match[1].toUpperCase();
            const actionData = match[2];
            
            switch (actionType) {
                case 'NAVIGATE':
                case 'OPEN':
                    const proj = knowledge.projects.find(p => 
                        p.name.toLowerCase().includes(actionData.toLowerCase()) ||
                        actionData.toLowerCase().includes(p.name.toLowerCase())
                    );
                    if (proj) {
                        actions.push({ type: 'flyTo', data: proj });
                        if (actionType === 'OPEN') {
                            actions.push({ type: 'openModal', data: proj });
                        }
                    }
                    break;
                    
                case 'FLYZONE':
                    actions.push({ type: 'flyToZone', data: actionData });
                    break;
                    
                case 'FILTER':
                    actions.push({ type: 'filterDeveloper', data: actionData });
                    break;
                    
                case 'SEARCH':
                    // Trigger a search with the criteria
                    const searchInput = document.getElementById('search-input');
                    if (searchInput) {
                        searchInput.value = actionData;
                        filterProjects();
                    }
                    break;
                    
                case 'COMPARE':
                    const projectNames = actionData.split(',').map(n => n.trim());
                    const projectsToCompare = projectNames.map(name => 
                        knowledge.projects.find(p => p.name.toLowerCase().includes(name.toLowerCase()))
                    ).filter(p => p);
                    if (projectsToCompare.length >= 2) {
                        actions.push({ type: 'compare', data: projectsToCompare });
                    }
                    break;
            }
        }
        
        // Clean action tags from display text
        const cleanText = text.replace(/\[ACTION:[^\]]+\]/g, '').trim();
        
        return { cleanText, actions };
    },
    
    // Find mentioned projects in response for cards (STRICT matching - only real recommendations)
    findMentionedProjects(text) {
        const knowledge = this.getKnowledge();
        const mentioned = [];
        const textLower = text.toLowerCase();
        
        // Only show project cards if the AI is actually recommending/discussing specific projects
        // Check for recommendation indicators
        const recommendationPhrases = [
            'i recommend', 'i suggest', 'check out', 'look at', 'consider',
            'perfect for you', 'great option', 'you should see', 'take a look at',
            'let me show you', 'here are some', 'top picks', 'best options',
            'would recommend', 'highly recommend', 'definitely check',
            'أنصحك', 'شوف', 'جرب', 'اقترح', 'خيار ممتاز'  // Arabic phrases
        ];
        
        const hasRecommendation = recommendationPhrases.some(phrase => textLower.includes(phrase));
        
        // If no recommendation language, don't show any project cards
        if (!hasRecommendation) {
            return [];
        }
        
        // Common words to NEVER match as projects
        const ignoreWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 
            'hello', 'hi', 'hey', 'good', 'great', 'nice', 'well', 'okay', 'sure', 'yes', 'no',
            'real', 'estate', 'property', 'properties', 'project', 'projects', 'area', 'location',
            'beach', 'sea', 'view', 'home', 'house', 'villa', 'apartment', 'unit', 'investment',
            'price', 'payment', 'down', 'north', 'coast', 'south', 'east', 'west', 'city', 
            'cairo', 'egypt', 'rita', 'help', 'want', 'need', 'looking', 'find', 'show'];
        
        knowledge.projects.forEach(proj => {
            const projName = proj.name.toLowerCase().trim();
            
            // Skip short names or common words
            if (projName.length < 5 || ignoreWords.includes(projName)) return;
            
            // Must match as a complete word/phrase
            const escapedName = projName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordBoundaryRegex = new RegExp(`\\b${escapedName}\\b`, 'i');
            
            if (wordBoundaryRegex.test(text)) {
                mentioned.push(proj);
            }
        });
        
        return mentioned.slice(0, 3); // Max 3 project cards
    },

    // Generate Response (Gemini-Powered)
    async generateResponse(message) {
        const entities = this.extractEntities(message);
        const knowledge = this.getKnowledge();
        
        // Add to conversation history (cap at 20 messages to prevent memory leak)
        this.conversationHistory.push({ role: 'user', content: message });
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-16);
        }
        
        // Try Gemini AI first
        const aiResponse = await this.callGemini(message);
        
        if (aiResponse) {
            const { cleanText, actions } = this.parseAIActions(aiResponse);
            const mentionedProjects = this.findMentionedProjects(aiResponse);
            
            // Add bot response to history
            this.conversationHistory.push({ role: 'assistant', content: cleanText });
            
            // Also check entities for additional project matches
            let allProjects = [...mentionedProjects];
            if (entities.projects.length > 0) {
                entities.projects.forEach(p => {
                    if (!allProjects.find(mp => mp.name === p.name)) {
                        allProjects.push(p);
                    }
                });
            }
            
            return {
                text: cleanText,
                actions: actions,
                projects: allProjects.slice(0, 5),
                suggestions: null
            };
        }
        
        // Fallback to local processing if Gemini fails
        return this.generateLocalResponse(message, entities, knowledge);
    },
    
    // Fallback local response generator
    generateLocalResponse(message, entities, knowledge) {
        const intent = this.recognizeIntent(message);
        let response = { text: "", actions: [], projects: [] };
        
        switch (intent.type) {
            case 'greeting':
                response.text = `Hello! 👋 I'm your RED AI Concierge powered by advanced AI. I know all about **${knowledge.totalProjects} projects** across **${knowledge.zones.length} locations** in Egypt. What would you like to explore today?`;
                response.suggestions = ["🏖️ Beach properties", "💰 Investment tips", "🏗️ Top developers", "📍 All locations"];
                break;
                
            case 'help':
                response.text = `Of course! Here's what I can help you with:\n\n` +
                    `🗺️ **Explore**: "Take me to North Coast" or "Show me Sahel"\n` +
                    `🔍 **Search**: "Villas with sea view" or "Low down payment options"\n` +
                    `⚖️ **Compare**: "What's better - Marassi or Hacienda?"\n` +
                    `📊 **Advice**: "Best investment right now?"\n` +
                    `📍 **Details**: "Tell me about [any project]"\n\n` +
                    `Or just chat with me naturally - I'm here to help! What's on your mind? 😊`;
                break;
                
            case 'navigate':
                response = this.handleNavigation(message, entities, knowledge);
                break;
                
            case 'search':
                response = this.handleSearch(message, entities, knowledge);
                break;
                
            case 'compare':
                response = this.handleComparison(message, entities, knowledge);
                break;
                
            case 'question':
                response = this.handleQuestion(message, entities, knowledge);
                break;
                
            case 'recommend':
                response = this.handleRecommendation(message, entities, knowledge);
                break;
                
            default:
                if (entities.projects.length > 0) {
                    response = this.handleQuestion(message, entities, knowledge);
                } else if (entities.zones.length > 0 || entities.developers.length > 0) {
                    response = this.handleSearch(message, entities, knowledge);
                } else if (AIConcierge._userRole === 'agent') {
                    response.text = `⚡ Gemini AI is temporarily unavailable. I can still answer questions about our **${knowledge.totalProjects} projects** across **${knowledge.zones.length} locations**.\n\nTry asking about:\n• 🏗️ Specific projects or developers\n• 📍 Zones and locations\n• 💰 Pricing and payment plans\n• ⚖️ Project comparisons`;
                    response.suggestions = ["🏗️ Top developers", "📍 All locations", "💰 Best payment plans"];
                } else {
                    response.text = `Hmm, let me think about that! 🤔 While I process, tell me more - what kind of property catches your eye?\n\n• 🏖️ Beach front in North Coast?\n• 🏙️ Modern living in New Cairo?\n• 🏝️ Desert views in Sokhna?\n\nOr just ask me anything - I'm all ears!`;
                    response.suggestions = ["🏖️ Beach options", "🏢 City properties", "💎 Luxury picks"];
                }
        }
        
        return response;
    },

    // Handle Navigation
    handleNavigation(message, entities, knowledge) {
        let response = { text: "", actions: [], projects: [] };
        
        if (entities.projects.length > 0) {
            const proj = entities.projects[0];
            response.text = `🚀 Taking you to **${proj.name}** by ${proj.dev} in ${proj.zone}!`;
            response.actions = [
                { type: 'flyTo', data: proj },
                { type: 'openModal', data: proj }
            ];
            response.projects = [proj];
        } else if (entities.zones.length > 0) {
            const zone = entities.zones[0];
            const zoneProjects = knowledge.projects.filter(p => 
                p.zone && p.zone.toLowerCase().includes(zone.toLowerCase())
            );
            response.text = `🗺️ Flying to **${zone}**! I found **${zoneProjects.length} projects** here.`;
            response.actions = [{ type: 'flyToZone', data: zone }];
            response.projects = zoneProjects.slice(0, 5);
        } else if (entities.developers.length > 0) {
            const dev = entities.developers[0];
            const devProjects = knowledge.projects.filter(p => 
                p.dev && p.dev.toLowerCase().includes(dev.toLowerCase())
            );
            if (devProjects.length > 0) {
                response.text = `🏗️ Showing **${dev}** projects! They have **${devProjects.length} projects** on our map.`;
                response.actions = [{ type: 'filterDeveloper', data: dev }];
                response.projects = devProjects.slice(0, 5);
            } else {
                response.text = `I couldn't find projects by "${dev}". Would you like to see all developers?`;
            }
        } else {
            response.text = `Where would you like to go? I can take you to any project, zone, or developer location! 🗺️`;
            response.suggestions = knowledge.zones.slice(0, 4).map(z => `📍 ${z}`);
        }
        
        return response;
    },

    // Handle Search
    handleSearch(message, entities, knowledge) {
        let response = { text: "", actions: [], projects: [] };
        let results = [...knowledge.projects];
        let filters = [];
        
        // Filter by zone
        if (entities.zones.length > 0) {
            results = results.filter(p => 
                entities.zones.some(z => p.zone && p.zone.toLowerCase().includes(z.toLowerCase()))
            );
            filters.push(`in **${entities.zones.join(", ")}**`);
        }
        
        // Filter by developer
        if (entities.developers.length > 0) {
            results = results.filter(p => 
                entities.developers.some(d => p.dev && p.dev.toLowerCase().includes(d.toLowerCase()))
            );
            filters.push(`by **${entities.developers.join(", ")}**`);
        }
        
        // Filter by unit type
        if (entities.unitTypes.length > 0) {
            results = results.filter(p => {
                const details = projectDetails[p.name];
                if (!details || !details.unitTypes) return false;
                const unitLower = details.unitTypes.toLowerCase();
                return entities.unitTypes.some(u => unitLower.includes(u));
            });
            filters.push(`with **${entities.unitTypes.join(", ")}**`);
        }
        
        // Filter by down payment
        if (entities.downPayment) {
            results = results.filter(p => p.minDownPayment && p.minDownPayment <= entities.downPayment);
            filters.push(`**${entities.downPayment}%** or less down payment`);
        }
        
        // Filter by installments
        if (entities.installmentYears) {
            results = results.filter(p => p.maxInstallmentYears && p.maxInstallmentYears >= entities.installmentYears);
            filters.push(`**${entities.installmentYears}+ years** installments`);
        }
        
        // Filter by delivery
        if (entities.deliveryYear) {
            results = results.filter(p => p.deliveryYear && p.deliveryYear <= entities.deliveryYear);
            filters.push(`delivery by **${entities.deliveryYear}**`);
        }
        
        if (results.length > 0) {
            const filterText = filters.length > 0 ? filters.join(", ") : "matching your criteria";
            response.text = `🎯 Found **${results.length} projects** ${filterText}!\n\nHere are the top matches:`;
            response.projects = results.slice(0, 5);
            response.actions = [{ type: 'renderProjects', data: results }];
        } else {
            response.text = `😕 No projects found matching those criteria. Try adjusting your filters!\n\nWe have projects in: **${knowledge.zones.slice(0, 4).join(", ")}** and more.`;
            response.suggestions = ["🔄 Reset filters", "📍 Show all projects", "💡 Recommendations"];
        }
        
        return response;
    },

    // Handle Comparison
    handleComparison(message, entities, knowledge) {
        let response = { text: "", actions: [], projects: [] };
        
        if (entities.developers.length >= 2) {
            // Compare developers
            const dev1 = entities.developers[0];
            const dev2 = entities.developers[1];
            
            const dev1Projects = knowledge.projects.filter(p => p.dev && p.dev.toLowerCase().includes(dev1.toLowerCase()));
            const dev2Projects = knowledge.projects.filter(p => p.dev && p.dev.toLowerCase().includes(dev2.toLowerCase()));
            
            const dev1Zones = [...new Set(dev1Projects.map(p => p.zone))];
            const dev2Zones = [...new Set(dev2Projects.map(p => p.zone))];
            
            response.text = `⚖️ **${dev1} vs ${dev2}**\n\n` +
                `📊 **${dev1}**:\n` +
                `• ${dev1Projects.length} projects\n` +
                `• Locations: ${dev1Zones.slice(0, 3).join(", ")}\n\n` +
                `📊 **${dev2}**:\n` +
                `• ${dev2Projects.length} projects\n` +
                `• Locations: ${dev2Zones.slice(0, 3).join(", ")}\n\n` +
                `Would you like to see projects from either developer?`;
            
            response.suggestions = [`Show ${dev1} projects`, `Show ${dev2} projects`];
            
        } else if (entities.projects.length >= 2) {
            // Compare projects
            const proj1 = entities.projects[0];
            const proj2 = entities.projects[1];
            
            response.text = `⚖️ **${proj1.name} vs ${proj2.name}**\n\n` +
                `🏗️ **${proj1.name}**:\n` +
                `• Developer: ${proj1.dev}\n` +
                `• Location: ${proj1.zone}\n` +
                `• Delivery: ${proj1.deliveryYear || 'TBA'}\n\n` +
                `🏗️ **${proj2.name}**:\n` +
                `• Developer: ${proj2.dev}\n` +
                `• Location: ${proj2.zone}\n` +
                `• Delivery: ${proj2.deliveryYear || 'TBA'}`;
            
            response.actions = [
                { type: 'compare', data: [proj1, proj2] }
            ];
            response.projects = [proj1, proj2];
            
        } else {
            response.text = `I can compare developers or projects for you! Just mention two names.\n\nExamples:\n• "Compare Emaar and Sodic"\n• "Mountain View vs Palm Hills"`;
            response.suggestions = knowledge.developers.slice(0, 4).map(d => d);
        }
        
        return response;
    },

    // Handle Question
    handleQuestion(message, entities, knowledge) {
        let response = { text: "", actions: [], projects: [] };
        const lower = message.toLowerCase();
        
        if (entities.projects.length > 0) {
            const proj = entities.projects[0];
            const details = projectDetails[proj.name] || {};
            
            // Check for specific question types
            if (lower.match(/address|location|where|موقع|عنوان/)) {
                response.text = `📍 **${proj.name}** Location:\n\n` +
                    `• **Zone**: ${proj.zone || 'N/A'}\n` +
                    `• **Coordinates**: ${proj.lat.toFixed(4)}, ${proj.lng.toFixed(4)}\n` +
                    `• **Developer**: ${proj.dev || 'N/A'}\n\n` +
                    `Want me to show you on the map?`;
                response.actions = [{ type: 'flyTo', data: proj }];
                
            } else if (lower.match(/price|cost|how much|سعر|كام/)) {
                response.text = `💰 **${proj.name}** Payment Info:\n\n` +
                    `• **Down Payment**: ${proj.minDownPayment ? proj.minDownPayment + '%' : 'Contact for details'}\n` +
                    `• **Installments**: Up to ${proj.maxInstallmentYears || 'N/A'} years\n` +
                    `• **Delivery**: ${proj.deliveryYear || 'TBA'}\n\n` +
                    `For exact pricing, I recommend contacting the sales team via WhatsApp.`;
                response.projects = [proj];
                
            } else if (lower.match(/amenities|facilities|features|مرافق/)) {
                response.text = `🏊 **${proj.name}** Amenities:\n\n${details.amenities || 'Contact for full amenities list'}`;
                response.projects = [proj];
                
            } else if (lower.match(/unit|area|size|مساحة|وحدات/)) {
                response.text = `📐 **${proj.name}** Units:\n\n` +
                    `• **Types**: ${details.unitTypes || 'Various'}\n` +
                    `• **Areas**: ${details.areas || 'Contact for details'}`;
                response.projects = [proj];
                
            } else {
                // General info
                response.text = `📋 **${proj.name}**\n\n` +
                    `🏗️ Developer: **${proj.dev || 'N/A'}**\n` +
                    `📍 Location: **${proj.zone || 'N/A'}**\n` +
                    `📅 Delivery: **${proj.deliveryYear || 'TBA'}**\n` +
                    `💳 Down Payment: **${proj.minDownPayment ? proj.minDownPayment + '%' : 'N/A'}**\n` +
                    `📆 Installments: **${proj.maxInstallmentYears ? proj.maxInstallmentYears + ' years' : 'N/A'}**\n\n` +
                    `${details.description || 'Contact for more details.'}`;
                response.projects = [proj];
                response.actions = [{ type: 'flyTo', data: proj }];
            }
            
        } else if (lower.match(/how many projects|total projects|عدد المشاريع/)) {
            response.text = `📊 **Database Overview**\n\n` +
                `• **Total Projects**: ${knowledge.totalProjects}\n` +
                `• **Locations**: ${knowledge.zones.length}\n` +
                `• **Developers**: ${knowledge.developers.length}\n\n` +
                `What would you like to explore?`;
                
        } else if (lower.match(/what zones|which areas|where|locations|مناطق/)) {
            response.text = `📍 **Available Locations**:\n\n${knowledge.zones.map(z => `• ${z}`).join('\n')}\n\nWhich area interests you?`;
            response.suggestions = knowledge.zones.slice(0, 4);
            
        } else if (lower.match(/developers|who|companies|شركات|مطورين/)) {
            response.text = `🏗️ **Top Developers**:\n\n${knowledge.developers.slice(0, 10).map(d => `• ${d}`).join('\n')}\n\n...and ${knowledge.developers.length - 10} more!\n\nWant details on any developer?`;
            response.suggestions = knowledge.developers.slice(0, 4);
            
        } else {
            response.text = `I can answer questions about any project, developer, or location. Try asking:\n\n• "What's the address of [project]?"\n• "How much is the down payment for [project]?"\n• "What amenities does [project] have?"`;
        }
        
        return response;
    },

    // Handle Recommendation
    handleRecommendation(message, entities, knowledge) {
        let response = { text: "", actions: [], projects: [] };
        const lower = message.toLowerCase();
        
        let results = [...knowledge.projects];
        let sortCriteria = null;
        let filterDesc = "";
        
        // Determine recommendation type
        if (lower.match(/cheapest|lowest|affordable|رخيص|اقل/)) {
            results = results.filter(p => p.minDownPayment).sort((a, b) => a.minDownPayment - b.minDownPayment);
            filterDesc = "lowest down payment";
        } else if (lower.match(/expensive|luxury|premium|فاخر|لاكشري/)) {
            results = results.filter(p => PREMIUM_DEVS.some(d => p.dev && p.dev.toLowerCase().includes(d)));
            filterDesc = "luxury developers";
        } else if (lower.match(/best investment|roi|appreciation|استثمار/)) {
            // Prioritize high-growth zones
            const hotZones = ["north coast", "sahel", "capital", "alamein"];
            results = results.filter(p => hotZones.some(z => p.zone && p.zone.toLowerCase().includes(z)));
            filterDesc = "highest investment potential";
        } else if (lower.match(/quick|fast|soon|delivery|تسليم قريب/)) {
            const currentYear = new Date().getFullYear();
            results = results.filter(p => p.deliveryYear && p.deliveryYear <= currentYear + 2)
                            .sort((a, b) => a.deliveryYear - b.deliveryYear);
            filterDesc = "fastest delivery";
        } else if (lower.match(/long|installment|تقسيط طويل/)) {
            results = results.filter(p => p.maxInstallmentYears && p.maxInstallmentYears >= 8)
                            .sort((a, b) => b.maxInstallmentYears - a.maxInstallmentYears);
            filterDesc = "longest payment plans";
        } else if (lower.match(/beach|sea|بحر|شاطئ/)) {
            const coastalZones = ["north coast", "sahel", "gouna", "sokhna"];
            results = results.filter(p => coastalZones.some(z => p.zone && p.zone.toLowerCase().includes(z)));
            filterDesc = "beachfront locations";
        }
        
        // Apply zone filter if specified
        if (entities.zones.length > 0) {
            results = results.filter(p => 
                entities.zones.some(z => p.zone && p.zone.toLowerCase().includes(z.toLowerCase()))
            );
        }
        
        if (results.length > 0) {
            response.text = `🌟 **Top Recommendations** for ${filterDesc}:\n\nHere are my top picks for you:`;
            response.projects = results.slice(0, 5);
            response.actions = [{ type: 'renderProjects', data: results }];
        } else {
            response.text = `I couldn't find specific matches. Here are some general top picks:`;
            response.projects = knowledge.projects.slice(0, 5);
        }
        
        return response;
    }
};

// ═══ Rich Markdown Formatter for AI Messages ═══
function formatAIMarkdown(text) {
    const lines = text.split('\n');
    let html = '';
    let inOl = false, inUl = false;

    const fmtInline = s => s
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    for (const raw of lines) {
        const line = raw.trimEnd();
        const olMatch = line.match(/^\s*(\d+)[.)]\s+(.+)/);
        const ulMatch = !olMatch && line.match(/^\s*[-•*]\s+(.+)/);

        if (olMatch) {
            if (inUl) { html += '</ul>'; inUl = false; }
            if (!inOl) { html += '<ol>'; inOl = true; }
            html += `<li>${fmtInline(olMatch[2])}</li>`;
        } else if (ulMatch) {
            if (inOl) { html += '</ol>'; inOl = false; }
            if (!inUl) { html += '<ul>'; inUl = true; }
            html += `<li>${fmtInline(ulMatch[1])}</li>`;
        } else {
            if (inOl) { html += '</ol>'; inOl = false; }
            if (inUl) { html += '</ul>'; inUl = false; }
            if (line.trim() === '') {
                html += '<br>';
            } else {
                html += `<p>${fmtInline(line)}</p>`;
            }
        }
    }
    if (inOl) html += '</ol>';
    if (inUl) html += '</ul>';
    return html;
}

// UI Functions for Chatbot
function toggleAIChat() {
    const chatWindow = document.getElementById('aiChatWindow');
    if (chatWindow) {
        chatWindow.classList.toggle('active');
        AIConcierge.isOpen = chatWindow.classList.contains('active');
        if (AIConcierge.isOpen) {
            const input = document.getElementById('aiChatInput');
            if (input) setTimeout(() => input.focus(), 300);
        }
    }
}

function selectRitaMode(role) {
    AIConcierge._userRole = role;
    AIConcierge.conversationHistory = [];

    // Update role badge
    const badge = document.getElementById('aiRoleBadge');
    if (badge) {
        badge.className = 'ai-role-badge active ' + role;
        badge.textContent = role === 'agent' ? 'AGENT MODE' : 'CUSTOMER';
    }

    // Update status text
    const statusText = document.getElementById('aiStatusText');
    if (statusText) {
        statusText.textContent = role === 'agent' ? 'Sales Expert Mode' : 'Property Advisor Mode';
    }

    // Replace mode selector with role-specific welcome
    const messagesContainer = document.getElementById('aiChatMessages');
    if (!messagesContainer) return;
    messagesContainer.innerHTML = '';

    const div = document.createElement('div');
    div.className = 'ai-message ai-bot';

    if (role === 'agent') {
        div.innerHTML = `
            <div class="ai-message-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12"></path></svg>
            </div>
            <div class="ai-message-content">
                <div class="ai-welcome-text">
                    <h4>🎯 يلا بينا يا بطل</h4>
                    <p>أنا ريتا — الـ backup بتاعك في أي call</p>
                </div>
                <p style="margin-top: 10px; direction: rtl; text-align: right; font-size: 0.85rem;">سواء عميل بيقولك "غالي" أو "هفكر" أو مش عارف تقفل الـ deal — قولي وأنا هساعدك بأحسن script و talking points تخلّيك تقفل أي deal 🔥</p>
                <div class="ai-suggestions">
                    <button onclick="sendAIMessage('عميل قالي غالي أوي — أقوله إيه؟')">🔥 عميل قال غالي</button>
                    <button onclick="sendAIMessage('إزاي أقفل deal مع عميل متردد؟')">🎯 أقفل deal</button>
                    <button onclick="sendAIMessage('عايز script لـ cold call')">📞 Cold call script</button>
                    <button onclick="sendAIMessage('عميل بيقارن بمشروع تاني أرخص')">⚡ عميل بيقارن</button>
                </div>
                <p style="margin-top: 12px; font-size: 0.78rem; color: var(--avaria-text-muted); direction: ltr; text-align: left;">💡 I speak both English & Egyptian Arabic — switch anytime.</p>
                <div class="ai-suggestions" style="margin-top: 6px;">
                    <button onclick="sendAIMessage('How do I qualify a client using the 7-pillar framework?')">📋 Qualification Framework</button>
                    <button onclick="sendAIMessage('Give me the buyer psychology cheat sheet')">🧠 Buyer Psychology</button>
                </div>
            </div>`;
    } else {
        div.innerHTML = `
            <div class="ai-message-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12"></path></svg>
            </div>
            <div class="ai-message-content">
                <div class="ai-welcome-text">
                    <h4>🌟 أهلاً بيك! أنا ريتا</h4>
                    <p>مستشارتك العقارية الشخصية</p>
                </div>
                <p style="margin-top: 10px; direction: rtl; text-align: right; font-size: 0.85rem;">أنا هنا عشان أساعدك تلاقي عقار أحلامك — شاليه على البحر، استثمار ذكي، أو أي حاجة في بالك. قولي عايز إيه وأنا تحت أمرك! 💫</p>
                <div class="ai-suggestions">
                    <button onclick="sendAIMessage('عايز شاليه على البحر في الساحل')">🏖️ شاليه على البحر</button>
                    <button onclick="sendAIMessage('إيه أحسن استثمار عقاري دلوقتي؟')">📈 نصيحة استثمار</button>
                    <button onclick="sendAIMessage('عايز فيلا بمقدم قليل')">🏡 فيلا بمقدم قليل</button>
                </div>
            </div>`;
    }

    messagesContainer.appendChild(div);
    const input = document.getElementById('aiChatInput');
    if (input) input.focus();
}

function clearAIChat() {
    AIConcierge.conversationHistory = [];
    AIConcierge._userRole = null;

    // Reset role badge
    const badge = document.getElementById('aiRoleBadge');
    if (badge) badge.className = 'ai-role-badge';

    // Reset status text
    const statusText = document.getElementById('aiStatusText');
    if (statusText) statusText.textContent = 'Ready to help you';

    // Show mode selector again
    const messagesContainer = document.getElementById('aiChatMessages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="ai-mode-selector" id="aiModeSelector">
                <div class="ai-mode-orb">
                    <div class="ai-mode-orb-ring"></div>
                    <div class="ai-mode-orb-core">✦</div>
                </div>
                <h4 class="ai-mode-title">أنا ريتا</h4>
                <p class="ai-mode-subtitle">إيه اللي يوصفك أكتر؟</p>
                <div class="ai-mode-cards">
                    <button class="ai-mode-card" onclick="selectRitaMode('customer')">
                        <span class="ai-mode-icon">🏠</span>
                        <span class="ai-mode-label">عميل</span>
                        <span class="ai-mode-desc">عايز ألاقي عقار أحلامي</span>
                    </button>
                    <button class="ai-mode-card" onclick="selectRitaMode('agent')">
                        <span class="ai-mode-icon">🎯</span>
                        <span class="ai-mode-label">Sales Agent</span>
                        <span class="ai-mode-desc">عايز مساعدة في البيع</span>
                    </button>
                </div>
            </div>`;
    }
}

// Keyboard handler for chat textarea (Enter sends, Shift+Enter = newline)
function handleAIChatKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAIMessage();
    }
    // Auto-resize textarea
    requestAnimationFrame(() => {
        const ta = e.target;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    });
}

async function sendAIMessage(customMessage = null) {
    const input = document.getElementById('aiChatInput');
    const messagesContainer = document.getElementById('aiChatMessages');
    const message = customMessage || (input ? input.value.trim() : '');
    if (!message) return;

    // Auto-select customer mode if none picked
    if (!AIConcierge._userRole) {
        selectRitaMode('customer');
    }

    if (input) { input.value = ''; input.style.height = 'auto'; }

    // Render user bubble
    addChatMessage(message, 'user');

    // Add to conversation history
    AIConcierge.conversationHistory.push({ role: 'user', content: message });
    if (AIConcierge.conversationHistory.length > 20) {
        AIConcierge.conversationHistory = AIConcierge.conversationHistory.slice(-16);
    }

    // Create streaming bot message element
    const botMsg = createBotMessageEl();
    const contentEl = botMsg.querySelector('.ai-message-content');
    contentEl.classList.add('ai-streaming-cursor');
    messagesContainer.appendChild(botMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    let fullText = null;

    // Try streaming first
    try {
        fullText = await AIConcierge.callGeminiStream(message, (partial) => {
            contentEl.innerHTML = formatAIMarkdown(partial);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    } catch (_) {}

    // Fallback: non-streaming Gemini or local
    if (!fullText) {
        // Show AI thinking animation while waiting
        contentEl.classList.remove('ai-streaming-cursor');
        contentEl.innerHTML = '<div class="ai-thinking"><div class="ai-thinking-orb"></div><span class="ai-thinking-text">RITA is thinking...</span></div>';

        const response = await AIConcierge.generateResponse(message);
        fullText = response.text;

        contentEl.innerHTML = formatAIMarkdown(fullText);

        // Add extras for local/non-streaming responses
        appendResponseExtras(contentEl, response);

        if (response.actions) {
            response.actions.forEach(action => executeAction(action));
        }

        AIConcierge.conversationHistory.push({ role: 'assistant', content: fullText });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return;
    }

    // Streaming completed — finalize
    contentEl.classList.remove('ai-streaming-cursor');

    const { cleanText, actions } = AIConcierge.parseAIActions(fullText);
    const mentionedProjects = AIConcierge.findMentionedProjects(fullText);

    contentEl.innerHTML = formatAIMarkdown(cleanText);

    const entities = AIConcierge.extractEntities(message);
    let allProjects = [...mentionedProjects];
    if (entities.projects.length > 0) {
        entities.projects.forEach(p => {
            if (!allProjects.find(mp => mp.name === p.name)) allProjects.push(p);
        });
    }
    allProjects = allProjects.slice(0, 5);

    const responseObj = { text: cleanText, actions, projects: allProjects, suggestions: null };
    appendResponseExtras(contentEl, responseObj);

    AIConcierge.conversationHistory.push({ role: 'assistant', content: cleanText });

    if (actions) actions.forEach(a => executeAction(a));

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function createBotMessageEl() {
    const div = document.createElement('div');
    div.className = 'ai-message ai-bot';
    div.innerHTML = `
        <div class="ai-message-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
        <div class="ai-message-content"></div>`;
    return div;
}

function appendResponseExtras(contentEl, response) {
    // Project cards
    if (response.projects && response.projects.length > 0) {
        response.projects.forEach(proj => {
            contentEl.appendChild(createProjectCard(proj));
        });
    }
    // Suggestion pills
    if (response.suggestions) {
        const sugDiv = document.createElement('div');
        sugDiv.className = 'ai-suggestions';
        response.suggestions.forEach(s => {
            const btn = document.createElement('button');
            btn.textContent = s;
            btn.onclick = () => sendAIMessage(s);
            sugDiv.appendChild(btn);
        });
        contentEl.appendChild(sugDiv);
    }
    // Action buttons
    if (response.projects && response.projects.length > 0) {
        const actDiv = document.createElement('div');
        actDiv.className = 'ai-action-btns';
        const viewBtn = document.createElement('button');
        viewBtn.innerHTML = '📍 View on Map';
        viewBtn.onclick = () => {
            if (response.projects.length === 1) focusOnProject(response.projects[0]);
            else renderProjects(response.projects);
        };
        actDiv.appendChild(viewBtn);
        if (response.projects.length === 1) {
            const detBtn = document.createElement('button');
            detBtn.className = 'primary';
            detBtn.innerHTML = '📋 Full Details';
            detBtn.onclick = () => openModal(response.projects[0]);
            actDiv.appendChild(detBtn);
        }
        contentEl.appendChild(actDiv);
    }
}

function addChatMessage(text, sender) {
    const messagesContainer = document.getElementById('aiChatMessages');
    if (!messagesContainer) return;

    const div = document.createElement('div');
    div.className = `ai-message ai-${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'ai-message-avatar';
    avatar.innerHTML = sender === 'bot'
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';

    const content = document.createElement('div');
    content.className = 'ai-message-content';
    content.innerHTML = formatAIMarkdown(text);

    div.appendChild(avatar);
    div.appendChild(content);
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function createProjectCard(proj) {
    const card = document.createElement('div');
    card.className = 'ai-project-card';
    card.onclick = () => { focusOnProject(proj); openModal(proj); };
    card.innerHTML = `
        <div class="ai-project-card-header">
            <span class="ai-project-card-name">${proj.name}</span>
            <span class="ai-project-card-score">${proj.minDownPayment ? proj.minDownPayment + '% DP' : 'N/A'}</span>
        </div>
        <div class="ai-project-card-details">
            <span>🏗️ ${proj.dev || 'N/A'}</span>
            <span>📍 ${proj.zone || 'N/A'}</span>
            <span>📅 ${proj.deliveryYear || 'TBA'}</span>
        </div>`;
    return card;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('aiChatMessages');
    if (!messagesContainer) return null;
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'ai-message ai-bot';
    typingDiv.innerHTML = `
        <div class="ai-message-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
        <div class="ai-message-content">
            <div class="ai-typing"><span></span><span></span><span></span></div>
        </div>`;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    if (id) { const el = document.getElementById(id); if (el) el.remove(); }
}

// ═══ Keyboard Shortcuts ═══
document.addEventListener('keydown', function(e) {
    // Escape closes chat or modal
    if (e.key === 'Escape') {
        if (AIConcierge.isOpen) { toggleAIChat(); e.preventDefault(); return; }
        const modal = document.querySelector('.modal-overlay.active, .modal-overlay[style*="flex"]');
        if (modal) { closeModal(); e.preventDefault(); return; }
    }
    // Ctrl+K or / focuses search (when not in an input)
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))) {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
});

// ═══ Mobile Swipe-to-Dismiss Chat ═══
(function initChatSwipe() {
    let startY = 0, currentY = 0, dragging = false;
    const threshold = 80;

    document.addEventListener('touchstart', function(e) {
        const handle = e.target.closest('#aiChatSwipe, .ai-chat-header');
        if (!handle) return;
        const chatWindow = document.getElementById('aiChatWindow');
        if (!chatWindow || !chatWindow.classList.contains('active')) return;
        startY = e.touches[0].clientY;
        dragging = true;
        chatWindow.style.transition = 'none';
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        currentY = e.touches[0].clientY;
        const dy = Math.max(0, currentY - startY);
        if (dy > 10) {
            const chatWindow = document.getElementById('aiChatWindow');
            if (chatWindow) chatWindow.style.transform = `translateY(${dy}px) scale(${1 - dy * 0.0003})`;
        }
    }, { passive: true });

    document.addEventListener('touchend', function() {
        if (!dragging) return;
        dragging = false;
        const dy = currentY - startY;
        const chatWindow = document.getElementById('aiChatWindow');
        if (!chatWindow) return;
        chatWindow.style.transition = '';
        chatWindow.style.transform = '';
        if (dy > threshold) toggleAIChat();
    }, { passive: true });
})();

function executeAction(action) {
    switch (action.type) {
        case 'flyTo':
            if (action.data && map) {
                focusOnProject(action.data);
            }
            break;
            
        case 'flyToZone':
            if (action.data) {
                flyToRegion(action.data.toLowerCase().replace(/\s+/g, '-'));
            }
            break;
            
        case 'filterDeveloper':
            if (action.data) {
                const projectsArray = window.projects || [];
                const devProjects = projectsArray.filter(p => 
                    p.dev && p.dev.toLowerCase().includes(action.data.toLowerCase())
                );
                renderProjects(devProjects);
            }
            break;
            
        case 'renderProjects':
            if (action.data) {
                renderProjects(action.data);
            }
            break;
            
        case 'openModal':
            if (action.data) {
                openModal(action.data);
            }
            break;
            
        case 'compare':
            if (action.data && action.data.length >= 2) {
                // Add to comparison
                compareList = action.data.slice(0, 3);
                updateComparisonDrawer();
            }
            break;
    }
}

// Voice input for AI Chat
let aiVoiceRecognition = null;

function toggleAIVoice() {
    const voiceBtn = document.getElementById('aiVoiceBtn');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        addChatMessage("Voice input is not supported in your browser. Please type your question instead.", 'bot');
        return;
    }
    
    if (!aiVoiceRecognition) {
        aiVoiceRecognition = new SpeechRecognition();
        aiVoiceRecognition.continuous = false;
        aiVoiceRecognition.lang = 'en-US';
        aiVoiceRecognition.interimResults = false;
        
        aiVoiceRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('aiChatInput').value = transcript;
            sendAIMessage(transcript);
        };
        
        aiVoiceRecognition.onend = () => {
            if (voiceBtn) voiceBtn.classList.remove('listening');
        };
        
        aiVoiceRecognition.onerror = () => {
            if (voiceBtn) voiceBtn.classList.remove('listening');
        };
    }
    
    if (voiceBtn && voiceBtn.classList.contains('listening')) {
        aiVoiceRecognition.stop();
        voiceBtn.classList.remove('listening');
    } else {
        aiVoiceRecognition.start();
        if (voiceBtn) voiceBtn.classList.add('listening');
    }
}

// Initialize project count in welcome message
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const knowledge = AIConcierge.getKnowledge();
        const welcomeMsg = document.querySelector('.ai-message.ai-bot .ai-message-content p:nth-child(2)');
        if (welcomeMsg && knowledge.totalProjects > 0) {
            welcomeMsg.innerHTML = `أعرف كل شيء عن <strong>${knowledge.totalProjects} مشروع</strong> في أفضل مواقع مصر. اسألني أي حاجة!`;
            welcomeMsg.style.direction = 'rtl';
            welcomeMsg.style.textAlign = 'right';
        }
    }, 2000);
});

// ===== ROUTE INTELLIGENCE SYSTEM =====
function notifyRouteMessage(message, type = 'info') {
    if (typeof PriceAlerts !== 'undefined' && typeof PriceAlerts.showToast === 'function') {
        PriceAlerts.showToast(message, type);
        return;
    }

    console[type === 'error' ? 'error' : 'log'](message);
}

const RoutePlanner = {
    initialized: false,
    initializing: false,
    projectHighlightCache: new Map(),
    _prevHighlightedNames: new Set(),
    projectHighlightSignature: '',
    browseTelemetrySignature: '',

    state: {
        origin: null,
        destination: null,
        stops: [],
        profile: 'driving',
        activeRoute: null,
        activeAlternatives: [],
        isRouting: false,
        routeDirty: false,
        tourMode: 'air',
        tourActive: false,
        tourPaused: false,
        pausedTourMode: '',
        routeAnimationFrame: null,
        routeAnimationIndex: 0,
        routeAnimationCoords: [],
        optimizedOrder: null,
        forced3DForTour: false,
        airTourSequence: [],
        airTourLegIndex: 0,
        lastDriveCameraIndex: -1,
        lastDriveHudIndex: -1,
        currentTourProjectName: '',
        nextTourProjectName: '',
        tourNarrative: '',
        tourGeneration: 0
    },

    layers: {
        glow: null,
        primary: null,
        alternatives: null,
        stops: null,
        connectors: null,
        movingMarker: null
    },

    dom: {},

    init() {
        if (this.initialized) return true;
        if (this.initializing) return true;
        if (!map) return false;

        this.initializing = true;

        if (!map.getPane('routeAltPane')) map.createPane('routeAltPane');
        map.getPane('routeAltPane').style.zIndex = 451;

        if (!map.getPane('routeGlowPane')) map.createPane('routeGlowPane');
        map.getPane('routeGlowPane').style.zIndex = 452;
        if (!map.getPane('routePane')) map.createPane('routePane');
        map.getPane('routePane').style.zIndex = 453;
        if (!map.getPane('routeStopsPane')) map.createPane('routeStopsPane');
        map.getPane('routeStopsPane').style.zIndex = 620;

        this.layers.alternatives = L.geoJSON(null, {
            pane: 'routeAltPane',
            style: () => ({
                color: getComputedStyle(document.documentElement).getPropertyValue('--route-alt').trim() || 'rgba(162, 176, 194, 0.24)',
                weight: 3.5,
                opacity: 0.7,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: '10 12',
                className: 'route-line-alt'
            })
        }).addTo(map);

        this.layers.glow = L.geoJSON(null, {
            pane: 'routeGlowPane',
            style: () => ({
                color: getComputedStyle(document.documentElement).getPropertyValue('--route-glow').trim() || 'rgba(96, 188, 255, 0.34)',
                weight: 10,
                opacity: 0.18,
                lineCap: 'round',
                lineJoin: 'round',
                className: 'route-line-shadow'
            })
        }).addTo(map);

        this.layers.primary = L.geoJSON(null, {
            pane: 'routePane',
            style: () => ({
                color: getComputedStyle(document.documentElement).getPropertyValue('--route-primary').trim() || '#8fd3ff',
                weight: 6,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
                className: 'route-line-main'
            })
        }).addTo(map);

        this.layers.connectors = L.layerGroup().addTo(map);
        this.layers.stops = L.layerGroup().addTo(map);
        this.initialized = true;

        this.cacheDom();
        this.bindDomEvents();
        // P6: Defer datalist population to first input focus (saves 1383 DOM nodes at init)
        this._datalistPopulated = false;
        const deferPopulate = () => {
            if (!this._datalistPopulated) {
                this._datalistPopulated = true;
                this.populateProjectOptions();
            }
        };
        if (this.dom.originInput) this.dom.originInput.addEventListener('focus', deferPopulate, { once: true });
        if (this.dom.destinationInput) this.dom.destinationInput.addEventListener('focus', deferPopulate, { once: true });
        const stopInput = document.getElementById('routeStopInput');
        if (stopInput) stopInput.addEventListener('focus', deferPopulate, { once: true });
        this.renderStops();
        this.renderSummary();
        this.syncProjectListHighlights();
        this.syncTourButtons();
        this.toggleMenu(false);
        this.initializing = false;
        return true;
    },

    ensureInitialized() {
        return this.initialized || this.init();
    },

    cacheDom() {
        this.dom.originInput = document.getElementById('routeOriginInput');
        this.dom.destinationInput = document.getElementById('routeDestinationInput');
        this.dom.stopInput = document.getElementById('routeStopInput');
        this.dom.projectOptions = document.getElementById('routeProjectOptions');
        this.dom.stopsList = document.getElementById('routeStopsList');
        this.dom.profileSelect = document.getElementById('routeProfileSelect');
        this.dom.tourModeSelect = document.getElementById('tourModeSelect');
        this.dom.menu = document.getElementById('routeMenu');
        this.dom.menuToggle = document.getElementById('routeMenuToggle');
        this.dom.menuToggleMeta = document.getElementById('routeMenuToggleMeta');
        this.dom.panel = document.getElementById('routePlannerSection');
        this.dom.summaryEmpty = document.getElementById('routeSummaryEmpty');
        this.dom.summaryContent = document.getElementById('routeSummaryContent');
        this.dom.totalDistance = document.getElementById('routeTotalDistance');
        this.dom.totalDuration = document.getElementById('routeTotalDuration');
        this.dom.stopCount = document.getElementById('routeStopCount');
        this.dom.primaryRoad = document.getElementById('routePrimaryRoad');
        this.dom.strategyChip = document.getElementById('routeStrategyChip');
        this.dom.sequenceChip = document.getElementById('routeSequenceChip');
        this.dom.nextInstruction = document.getElementById('routeNextInstruction');
        this.dom.tourNarrative = document.getElementById('routeTourNarrative');
        this.dom.legsList = document.getElementById('routeLegsList');
    },

    renderTourNarrative() {
        if (!this.dom.tourNarrative) return;

        if (this.state.tourActive && this.state.tourNarrative) {
            this.dom.tourNarrative.textContent = this.state.tourNarrative;
            return;
        }

        if (this.state.activeRoute?.primaryRoute) {
            const modeLabel = this.state.tourMode === 'smart' ? 'Smart Tour' : this.state.tourMode === 'drive' ? 'Drive Tour' : 'Air Tour';
            this.dom.tourNarrative.textContent = `${modeLabel} is ready to explore this corridor with guided movement.`;
            return;
        }

        this.dom.tourNarrative.textContent = 'Tour status will appear here while exploring.';
    },

    syncTourButtons() {
        const playBtn = document.getElementById('btn-play-tour');
        const pauseBtn = document.getElementById('btn-stop-tour');
        const resumeBtn = document.getElementById('btn-resume-tour');
        const endBtn = document.getElementById('btn-end-tour');

        if (playBtn) playBtn.style.display = this.state.tourActive || this.state.tourPaused ? 'none' : 'flex';
        if (pauseBtn) pauseBtn.style.display = this.state.tourActive ? 'flex' : 'none';
        if (resumeBtn) resumeBtn.style.display = this.state.tourPaused ? 'flex' : 'none';
        if (endBtn) endBtn.style.display = this.state.tourActive || this.state.tourPaused ? 'flex' : 'none';

        // Keep browse telemetry in sync with tour state changes
        if (typeof updateBrowseTelemetry === 'function') updateBrowseTelemetry();
    },

    buildBrowseTelemetrySignature(visibleCount, totalCount) {
        const activeRoute = this.state.activeRoute?.primaryRoute;
        return [
            Number.isFinite(visibleCount) ? visibleCount : '',
            Number.isFinite(totalCount) ? totalCount : '',
            this.state.origin?.name || '',
            this.state.destination?.name || '',
            this.state.stops.map(stop => stop.name).join('|'),
            activeRoute?.distance || '',
            activeRoute?.duration || '',
            this.state.tourActive ? 'active' : this.state.tourPaused ? 'paused' : 'idle',
            this.state.tourMode || '',
            this.state.tourNarrative || ''
        ].join('::');
    },

    updateBrowseTelemetry(visibleCount, totalCount = (window.projects || []).length) {
        const countEl = document.getElementById('browseProjectCount');
        const routeEl = document.getElementById('browseRouteContext');
        const tourEl = document.getElementById('browseTourContext');
        const nextSignature = this.buildBrowseTelemetrySignature(visibleCount, totalCount);

        if (nextSignature === this.browseTelemetrySignature && countEl && routeEl && tourEl) {
            return;
        }

        this.browseTelemetrySignature = nextSignature;

        if (countEl && Number.isFinite(visibleCount)) {
            countEl.dataset.visible = `${visibleCount}`;
            countEl.dataset.total = `${totalCount}`;
        }

        const resolvedVisible = Number(countEl?.dataset.visible || 0);
        const resolvedTotal = Number(countEl?.dataset.total || totalCount || 0);

        if (countEl) {
            countEl.textContent = resolvedTotal > 0 && resolvedVisible !== resolvedTotal
                ? `${resolvedVisible} of ${resolvedTotal} projects`
                : `${resolvedVisible || resolvedTotal} curated projects`;
        }

        const selectedCount = [this.state.origin, ...this.state.stops, this.state.destination].filter(Boolean).length;
        const needsRouteBuild = this.state.routeDirty && selectedCount > 1;

        if (routeEl) {
            if (this.state.activeRoute?.primaryRoute) {
                routeEl.textContent = `${this.formatDistance(this.state.activeRoute.primaryRoute.distance)} route ready`;
            } else if (needsRouteBuild) {
                routeEl.textContent = `${selectedCount} points staged`;
            } else if (selectedCount > 0) {
                routeEl.textContent = `${selectedCount} route points armed`;
            } else {
                routeEl.textContent = 'Route idle';
            }
        }

        if (tourEl) {
            if (this.state.tourActive) {
                tourEl.textContent = this.state.tourNarrative || `${String(this.state.tourMode || 'tour').replace(/^./, letter => letter.toUpperCase())} tour live`;
            } else if (this.state.tourPaused) {
                tourEl.textContent = this.state.tourNarrative || 'Tour paused';
            } else {
                tourEl.textContent = 'Tour idle';
            }
        }
    },

    invalidateProjectListCache() {
        this.projectHighlightCache.clear();
        this.projectHighlightSignature = '';
        this.browseTelemetrySignature = '';
    },

    refreshProjectListCache(force = false) {
        if (!force && this.projectHighlightCache.size > 0) {
            return this.projectHighlightCache;
        }

        this.projectHighlightCache = new Map();
        document.querySelectorAll('.list-item[data-project-name]').forEach(item => {
            const projectName = String(item.dataset.projectName || '').trim().toLowerCase();
            if (!projectName) return;
            this.projectHighlightCache.set(projectName, {
                item,
                badgeContainer: item.querySelector('.list-item-badges')
            });
        });

        return this.projectHighlightCache;
    },

    getProjectHighlightSignature() {
        return [
            currentProject?.name || '',
            this.state.origin?.name || '',
            this.state.destination?.name || '',
            this.state.stops.map(stop => stop.name).join('|'),
            this.state.currentTourProjectName || '',
            this.state.nextTourProjectName || ''
        ].join('::');
    },

    setTourContext(currentName, nextName, narrative) {
        const nameChanged = currentName !== this.state.currentTourProjectName || nextName !== this.state.nextTourProjectName;
        this.state.currentTourProjectName = currentName || '';
        this.state.nextTourProjectName = nextName || '';
        this.state.tourNarrative = narrative || '';
        document.body.classList.add('touring');
        document.body.dataset.tourMode = this.state.tourMode || 'air';
        this.renderTourNarrative();
        if (nameChanged) this.syncProjectListHighlights();
        updateBrowseTelemetry();
    },

    clearTourContext() {
        this.state.currentTourProjectName = '';
        this.state.nextTourProjectName = '';
        this.state.tourNarrative = '';
        document.body.classList.remove('touring');
        delete document.body.dataset.tourMode;
        this.renderTourNarrative();
        // syncProjectListHighlights deferred to callers to avoid redundant iterations
        updateBrowseTelemetry();
    },

    toggleMenu(forceOpen) {
        if (!this.ensureInitialized() && (!this.dom.panel || !this.dom.menu || !this.dom.menuToggle)) {
            this.cacheDom();
        }

        if (!this.dom.panel || !this.dom.menu || !this.dom.menuToggle) {
            this.cacheDom();
        }

        if (!this.dom.panel || !this.dom.menu || !this.dom.menuToggle) return;

        const nextOpen = typeof forceOpen === 'boolean' ? forceOpen : this.dom.panel.hidden;
        this.dom.panel.hidden = !nextOpen;
        this.dom.menu.classList.toggle('open', nextOpen);
        this.dom.menuToggle.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
        this.syncMenuState(nextOpen);
    },

    syncMenuState(isOpen = !this.dom.panel?.hidden) {
        if (!this.dom.menuToggleMeta) return;

        const selectedCount = [this.state.origin, ...this.state.stops, this.state.destination].filter(Boolean).length;
        const needsRouteBuild = this.state.routeDirty && selectedCount > 1;

        if (isOpen) {
            if (this.state.activeRoute?.primaryRoute) {
                this.dom.menuToggleMeta.textContent = `${this.formatDistance(this.state.activeRoute.primaryRoute.distance)} • ${this.formatDuration(this.state.activeRoute.primaryRoute.duration)}`;
            } else if (needsRouteBuild) {
                this.dom.menuToggleMeta.textContent = 'Ready to build';
            } else if (selectedCount > 0) {
                this.dom.menuToggleMeta.textContent = `${selectedCount} points selected`;
            } else {
                this.dom.menuToggleMeta.textContent = 'Ready';
            }
            updateBrowseTelemetry();
            return;
        }

        this.dom.menuToggleMeta.textContent = this.state.activeRoute?.primaryRoute
            ? 'Route ready'
            : needsRouteBuild
                ? 'Build route'
                : selectedCount > 0
                    ? `${selectedCount} points ready`
                    : 'New';
        updateBrowseTelemetry();
    },

    bindDomEvents() {
        const bindEnter = (input, handler) => {
            if (!input) return;
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    handler();
                }
            });
        };

        bindEnter(this.dom.originInput, () => this.captureInputPoint('origin'));
        bindEnter(this.dom.destinationInput, () => this.captureInputPoint('destination'));
        bindEnter(this.dom.stopInput, () => this.addStopFromInput());

        if (this.dom.profileSelect) {
            this.dom.profileSelect.addEventListener('change', () => {
                const wasMenuOpen = this.dom.panel ? !this.dom.panel.hidden : false;
                this.state.profile = this.dom.profileSelect.value || 'driving';
                this.invalidateRoute();
                this.renderSummary();
                this.syncProjectListHighlights();
                this.syncMenuState(wasMenuOpen);
            });
        }

        if (this.dom.tourModeSelect) {
            this.dom.tourModeSelect.addEventListener('change', () => {
                this.state.tourMode = this.dom.tourModeSelect.value || 'air';
            });
        }
    },

    populateProjectOptions() {
        if (!this.dom.projectOptions) {
            this.cacheDom();
        }

        if (!this.dom.projectOptions) return;

        const optionsHtml = (window.projects || [])
            .slice()
            .sort((left, right) => left.name.localeCompare(right.name))
            .map(project => `<option value="${project.name}">${project.zone || ''}</option>`)
            .join('');

        this.dom.projectOptions.innerHTML = optionsHtml;
    },

    parseCoordinateValue(value) {
        const match = String(value || '').trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
        if (!match) return null;

        return {
            name: `${match[1]}, ${match[2]}`,
            lat: Number(match[1]),
            lng: Number(match[2]),
            source: 'manual'
        };
    },

    findProjectByName(name) {
        if (!name) return null;
        const query = name.trim().toLowerCase();
        if (!query) return null;

        const exact = (window.projects || []).find(project => project.name.toLowerCase() === query);
        if (exact) return { ...exact, source: 'project' };

        const partial = (window.projects || []).find(project => project.name.toLowerCase().includes(query) || query.includes(project.name.toLowerCase()));
        if (partial) return { ...partial, source: 'project' };

        return null;
    },

    resolvePoint(value) {
        const manualPoint = this.parseCoordinateValue(value);
        if (manualPoint) return manualPoint;

        return this.findProjectByName(value);
    },

    clonePoint(point) {
        if (!point) return null;

        return {
            name: point.name,
            lat: Number(point.lat),
            lng: Number(point.lng),
            source: point.source || 'project',
            zone: point.zone || '',
            dev: point.dev || ''
        };
    },

    getProjectRouteMeta(projectName) {
        const normalizedName = String(projectName || '').trim().toLowerCase();
        const classes = [];
        const badges = [];

        if (currentProject?.name?.toLowerCase() === normalizedName) {
            classes.push('route-focused');
            badges.push('Open');
        }

        if (this.state.origin?.name?.toLowerCase() === normalizedName) {
            classes.push('route-origin');
            badges.push('Start');
        }

        if (this.state.destination?.name?.toLowerCase() === normalizedName) {
            classes.push('route-destination');
            badges.push('Finish');
        }

        const stopIndex = this.state.stops.findIndex(stop => stop.name?.toLowerCase() === normalizedName);
        if (stopIndex !== -1) {
            classes.push('route-stop');
            badges.push(`Stop ${stopIndex + 1}`);
        }

        if (this.state.currentTourProjectName?.toLowerCase() === normalizedName) {
            classes.push('route-tour-current');
            badges.unshift('Now Touring');
        } else if (this.state.nextTourProjectName?.toLowerCase() === normalizedName) {
            classes.push('route-tour-next');
            badges.push('Next');
        }

        return { classes, badges };
    },

    syncProjectListHighlights(force = false) {
        const signature = this.getProjectHighlightSignature();
        if (!force && signature === this.projectHighlightSignature && this.projectHighlightCache.size > 0) {
            return;
        }

        this.projectHighlightSignature = signature;
        const cache = this.refreshProjectListCache(force);

        // Build a set of project names that need route badges
        const routeNames = new Set();
        if (this.state.origin?.name) routeNames.add(this.state.origin.name.trim().toLowerCase());
        if (this.state.destination?.name) routeNames.add(this.state.destination.name.trim().toLowerCase());
        this.state.stops.forEach(s => { if (s?.name) routeNames.add(s.name.trim().toLowerCase()); });
        if (currentProject?.name) routeNames.add(currentProject.name.trim().toLowerCase());
        if (this.state.currentTourProjectName) routeNames.add(this.state.currentTourProjectName.trim().toLowerCase());
        if (this.state.nextTourProjectName) routeNames.add(this.state.nextTourProjectName.trim().toLowerCase());
        // Also include items that previously had route classes (to clear them)
        const prevHighlighted = this._prevHighlightedNames || new Set();
        const relevant = new Set([...routeNames, ...prevHighlighted]);

        // Only iterate items that are relevant — skip the other 1000+ items
        relevant.forEach(projectName => {
            const cached = cache.get(projectName);
            if (!cached) return;
            const { item, badgeContainer } = cached;
            const meta = this.getProjectRouteMeta(projectName);
            item.classList.remove('route-origin', 'route-destination', 'route-stop', 'route-focused', 'route-tour-current', 'route-tour-next');
            if (meta.classes.length) {
                item.classList.add(...meta.classes);
            }
            if (badgeContainer) {
                const newHtml = meta.badges.map(badge => `<span class="list-item-badge">${badge}</span>`).join('');
                if (badgeContainer.innerHTML !== newHtml) {
                    badgeContainer.innerHTML = newHtml;
                }
            }
        });

        this._prevHighlightedNames = routeNames;
    },

    deriveRouteInsights(routeData) {
        const steps = (routeData?.primaryRoute?.legs || []).flatMap(leg => leg.steps || []);
        const cleanRoadName = value => String(value || '')
            .replace(/\s+/g, ' ')
            .replace(/^Unnamed Road$/i, '')
            .trim();
        const roadStats = new Map();
        steps.forEach(step => {
            const roadName = cleanRoadName(step.name);
            if (!roadName) return;
            const current = roadStats.get(roadName) || { distance: 0, hits: 0 };
            current.distance += Number(step.distance) || 0;
            current.hits += 1;
            roadStats.set(roadName, current);
        });
        const topRoads = [...roadStats.entries()]
            .sort((left, right) => right[1].distance - left[1].distance || right[1].hits - left[1].hits)
            .slice(0, 3)
            .map(([roadName]) => roadName);
        const firstLeg = routeData?.primaryRoute?.legs?.[0];
        const strategy = this.state.optimizedOrder
            ? 'Smart optimized sequence'
            : routeData?.alternatives?.length
                ? 'Fastest primary corridor'
                : 'Direct premium route';
        const sequence = routeData?.requestedPoints?.map(point => point.name).join(' → ') || 'Select route points';

        let nextInstruction = 'Next move will appear here after route build.';
        const nextStep = (firstLeg?.steps || []).find(step => step.instruction || step.name);
        if (nextStep) {
            const descriptor = nextStep.instruction || `Continue via ${nextStep.name}`;
            const roadSuffix = nextStep.name ? ` on ${nextStep.name}` : '';
            nextInstruction = `${descriptor}${roadSuffix}`.trim();
        }

        return {
            strategy,
            sequence,
            roadSummary: topRoads.length ? `Via ${topRoads.join(' • ')}` : routeData?.primaryRoute?.summary || 'Road summary ready',
            nextInstruction
        };
    },

    captureInputPoint(kind) {
        const input = kind === 'origin' ? this.dom.originInput : this.dom.destinationInput;
        const point = this.resolvePoint(input?.value);

        if (!point) {
            notifyRouteMessage('Use a valid project name or lat,lng value.', 'error');
            return null;
        }

        this.setPoint(kind, point);
        return point;
    },

    invalidateRoute() {
        if (this.state.tourActive || this.state.tourPaused) {
            this.stopTour(true);
        }
        this.state.activeRoute = null;
        this.state.activeAlternatives = [];
        this.state.optimizedOrder = null;
        this.state.routeDirty = [this.state.origin, ...this.state.stops, this.state.destination].filter(Boolean).length > 1;
        this.state.routeAnimationCoords = [];
        this.state.routeAnimationIndex = 0;
        this.state.routeAnimationDist = 0;
        this.state.lastDriveCameraIndex = -1;
        this.state.lastDriveHudIndex = -1;
        this.state.airTourSequence = [];
        this.state.airTourLegIndex = 0;

        this.layers.glow?.clearLayers();
        this.layers.primary?.clearLayers();
        this.layers.alternatives?.clearLayers();
        this.layers.connectors?.clearLayers();
        this.layers.stops?.clearLayers();

        document.body.classList.remove('has-route');
        // Callers are responsible for renderSummary/syncMenuState/syncProjectListHighlights
    },

    setPoint(kind, point) {
        const normalized = this.clonePoint(point);
        if (!normalized) return;

        const wasMenuOpen = this.dom.panel ? !this.dom.panel.hidden : false;
        this.invalidateRoute();

        if (kind === 'origin') {
            this.state.origin = normalized;
            if (this.dom.originInput) this.dom.originInput.value = normalized.name;
        } else {
            this.state.destination = normalized;
            if (this.dom.destinationInput) this.dom.destinationInput.value = normalized.name;
        }

        this.state.routeDirty = [this.state.origin, ...this.state.stops, this.state.destination].filter(Boolean).length > 1;
        this.renderSummary();
        this.syncProjectListHighlights();
        this.syncMenuState(wasMenuOpen);
    },

    addStop(point) {
        const normalized = this.clonePoint(point);
        if (!normalized) return;

        const wasMenuOpen = this.dom.panel ? !this.dom.panel.hidden : false;
        this.invalidateRoute();
        this.state.stops.push(normalized);
        if (this.dom.stopInput) this.dom.stopInput.value = '';
        this.state.routeDirty = [this.state.origin, ...this.state.stops, this.state.destination].filter(Boolean).length > 1;
        this.renderStops();
        this.renderSummary();
        this.syncProjectListHighlights();
        this.syncMenuState(wasMenuOpen);
    },

    addStopFromInput() {
        const point = this.resolvePoint(this.dom.stopInput?.value);
        if (!point) {
            notifyRouteMessage('Stop must be a project name or lat,lng value.', 'error');
            return;
        }

        this.addStop(point);
    },

    moveStop(index, delta) {
        const targetIndex = index + delta;
        if (targetIndex < 0 || targetIndex >= this.state.stops.length) return;

        const wasMenuOpen = this.dom.panel ? !this.dom.panel.hidden : false;
        this.invalidateRoute();
        const reordered = [...this.state.stops];
        const [item] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, item);
        this.state.stops = reordered;
        this.state.routeDirty = [this.state.origin, ...this.state.stops, this.state.destination].filter(Boolean).length > 1;
        this.renderStops();
        this.renderSummary();
        this.syncProjectListHighlights();
        this.syncMenuState(wasMenuOpen);
    },

    removeStop(index) {
        const wasMenuOpen = this.dom.panel ? !this.dom.panel.hidden : false;
        this.invalidateRoute();
        this.state.stops.splice(index, 1);
        this.state.routeDirty = [this.state.origin, ...this.state.stops, this.state.destination].filter(Boolean).length > 1;
        this.renderStops();
        this.renderSummary();
        this.syncProjectListHighlights();
        this.syncMenuState(wasMenuOpen);
    },

    reverse() {
        const wasMenuOpen = this.dom.panel ? !this.dom.panel.hidden : false;
        this.invalidateRoute();
        const oldOrigin = this.state.origin;
        this.state.origin = this.state.destination;
        this.state.destination = oldOrigin;
        this.state.stops.reverse();

        if (this.dom.originInput) this.dom.originInput.value = this.state.origin?.name || '';
        if (this.dom.destinationInput) this.dom.destinationInput.value = this.state.destination?.name || '';

        this.state.routeDirty = [this.state.origin, ...this.state.stops, this.state.destination].filter(Boolean).length > 1;
        this.renderStops();
        this.renderSummary();
        this.syncProjectListHighlights();
        this.syncMenuState(wasMenuOpen);
    },

    clear(clearInputs = true) {
        this.stopTour(true);
        this.state.activeRoute = null;
        this.state.activeAlternatives = [];
        this.state.optimizedOrder = null;
        this.state.routeDirty = false;
        this.state.isRouting = false;
        this.state.lastDriveCameraIndex = -1;
        this.state.lastDriveHudIndex = -1;
        
        // Deactivate route-line CSS animations
        document.body.classList.remove('has-route');

        if (clearInputs) {
            this.state.origin = null;
            this.state.destination = null;
            this.state.stops = [];
            if (this.dom.originInput) this.dom.originInput.value = '';
            if (this.dom.destinationInput) this.dom.destinationInput.value = '';
            if (this.dom.stopInput) this.dom.stopInput.value = '';
        }

        this.layers.glow?.clearLayers();
        this.layers.primary?.clearLayers();
        this.layers.alternatives?.clearLayers();
        this.layers.connectors?.clearLayers();
        this.layers.stops?.clearLayers();
        if (this.layers.movingMarker && map.hasLayer(this.layers.movingMarker)) {
            map.removeLayer(this.layers.movingMarker);
        }
        this.layers.movingMarker = null;

        this.renderStops();
        this.renderSummary();
        this.syncMenuState();
        this.syncProjectListHighlights();
    },

    getRequestedPoints() {
        if (!this.state.origin || !this.state.destination) return [];

        return [this.state.origin, ...this.state.stops, this.state.destination].map(point => ({
            name: point.name,
            lat: point.lat,
            lng: point.lng
        }));
    },

    formatDistance(distance) {
        if (!Number.isFinite(distance)) return '0 km';
        return distance >= 1000 ? `${(distance / 1000).toFixed(distance >= 10000 ? 0 : 1)} km` : `${Math.round(distance)} m`;
    },

    formatDuration(duration) {
        if (!Number.isFinite(duration)) return '0 min';
        const totalMinutes = Math.round(duration / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (!hours) return `${minutes} min`;
        if (!minutes) return `${hours} hr`;
        return `${hours} hr ${minutes} min`;
    },

    normalizeOsrmRoutePayload(payload, requestedPoints) {
        if (!payload || payload.code !== 'Ok' || !Array.isArray(payload.routes) || payload.routes.length === 0) {
            throw new Error(payload?.message || 'No route found');
        }

        const primaryRoute = payload.routes[0];

        return {
            provider: 'osrm',
            requestedPoints,
            waypoints: (payload.waypoints || []).map((waypoint, index) => ({
                name: requestedPoints[index]?.name || waypoint.name || `Point ${index + 1}`,
                distance: waypoint.distance,
                snappedLng: waypoint.location?.[0],
                snappedLat: waypoint.location?.[1],
                roadName: waypoint.name || ''
            })),
            primaryRoute: {
                distance: primaryRoute.distance,
                duration: primaryRoute.duration,
                weight: primaryRoute.weight,
                summary: primaryRoute.legs?.map(leg => leg.summary).filter(Boolean).join(' • ') || '',
                geometry: primaryRoute.geometry,
                legs: (primaryRoute.legs || []).map((leg, index) => ({
                    index,
                    distance: leg.distance,
                    duration: leg.duration,
                    summary: leg.summary || '',
                    steps: (leg.steps || []).map(step => ({
                        distance: step.distance,
                        duration: step.duration,
                        name: step.name || '',
                        mode: step.mode || 'driving',
                        instruction: step.maneuver?.instruction || '',
                        type: step.maneuver?.type || '',
                        modifier: step.maneuver?.modifier || '',
                        location: step.maneuver?.location || null
                    }))
                }))
            },
            alternatives: payload.routes.slice(1).map(route => ({
                distance: route.distance,
                duration: route.duration,
                weight: route.weight,
                summary: route.legs?.map(leg => leg.summary).filter(Boolean).join(' • ') || '',
                geometry: route.geometry
            }))
        };
    },

    normalizeOsrmTripPayload(payload, requestedPoints) {
        if (!payload || payload.code !== 'Ok' || !Array.isArray(payload.trips) || payload.trips.length === 0) {
            throw new Error(payload?.message || 'No optimized trip found');
        }

        const trip = payload.trips[0];
        const orderedWaypoints = [...(payload.waypoints || [])].sort((left, right) => left.waypoint_index - right.waypoint_index);

        return {
            provider: 'osrm',
            waypointOrder: orderedWaypoints.map(waypoint => waypoint.waypoint_index),
            orderedPoints: orderedWaypoints.map((waypoint, index) => ({
                name: requestedPoints[waypoint.waypoint_index]?.name || `Point ${index + 1}`,
                originalIndex: waypoint.waypoint_index,
                lat: requestedPoints[waypoint.waypoint_index]?.lat,
                lng: requestedPoints[waypoint.waypoint_index]?.lng,
                snappedLat: waypoint.location?.[1],
                snappedLng: waypoint.location?.[0],
                roadName: waypoint.name || ''
            })),
            trip: {
                distance: trip.distance,
                duration: trip.duration,
                weight: trip.weight,
                summary: trip.legs?.map(leg => leg.summary).filter(Boolean).join(' • ') || '',
                geometry: trip.geometry,
                legs: (trip.legs || []).map((leg, index) => ({
                    index,
                    distance: leg.distance,
                    duration: leg.duration,
                    summary: leg.summary || ''
                }))
            }
        };
    },

    async directRouteFallback(endpoint, payload) {
        const requestedPoints = payload.coordinates || [];
        const coordinates = requestedPoints.map(point => `${point.lng},${point.lat}`).join(';');
        const profile = payload.profile || 'driving';

        if (endpoint === '/api/route/route') {
            const alternatives = payload.alternatives ? 'true' : 'false';
            const response = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true&annotations=distance,duration&alternatives=${alternatives}`);
            if (!response.ok) {
                throw new Error('Routing API is unavailable right now.');
            }

            return this.normalizeOsrmRoutePayload(await response.json(), requestedPoints);
        }

        if (endpoint === '/api/route/trip') {
            const response = await fetch(`https://router.project-osrm.org/trip/v1/${profile}/${coordinates}?roundtrip=false&source=first&destination=last&overview=full&geometries=geojson&steps=false`);
            if (!response.ok) {
                throw new Error('Smart trip optimization is unavailable right now.');
            }

            return this.normalizeOsrmTripPayload(await response.json(), requestedPoints);
        }

        if (endpoint === '/api/route/table') {
            const response = await fetch(`https://router.project-osrm.org/table/v1/${profile}/${coordinates}?annotations=distance,duration`);
            if (!response.ok) {
                throw new Error('Route matrix is unavailable right now.');
            }

            const data = await response.json();
            if (!data || data.code !== 'Ok') {
                throw new Error(data?.message || 'Route matrix failed');
            }

            return {
                provider: 'osrm',
                points: requestedPoints,
                distances: data.distances || [],
                durations: data.durations || []
            };
        }

        throw new Error('Unsupported route request.');
    },

    async requestJson(url, payload) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const rawText = await response.text();
            let result = null;

            try {
                result = rawText ? JSON.parse(rawText) : null;
            } catch (parseError) {
                if (rawText.trim().startsWith('<')) {
                    return this.directRouteFallback(url, payload);
                }

                throw parseError;
            }

            if (!response.ok || !result?.success) {
                const errorMessage = result?.error || `Request failed with status ${response.status}`;

                if (response.status === 404 || response.status >= 500) {
                    return this.directRouteFallback(url, payload);
                }

                throw new Error(errorMessage);
            }

            return result.data;
        } catch (error) {
            if (url.startsWith('/api/route/')) {
                try {
                    return await this.directRouteFallback(url, payload);
                } catch (fallbackError) {
                    throw new Error(fallbackError.message || error.message || 'Route request failed');
                }
            }

            throw error;
        }
    },

    async calculateRoute(options = {}) {
        this.ensureInitialized();
        const fitBounds = options.fitBounds !== false;
        const openMenu = options.openMenu !== false;

        if (openMenu) {
            this.toggleMenu(true);
        } else {
            this.syncMenuState(false);
        }

        if (!this.state.origin) this.captureInputPoint('origin');
        if (!this.state.destination) this.captureInputPoint('destination');

        if (!this.state.origin || !this.state.destination) {
            notifyRouteMessage('Choose both a route start and destination first.', 'error');
            return;
        }

        if (this.state.isRouting) return;
        this.state.isRouting = true;

        try {
            const data = await this.requestJson('/api/route/route', {
                profile: this.state.profile,
                alternatives: true,
                coordinates: this.getRequestedPoints()
            });

            this.state.activeRoute = data;
            this.state.activeAlternatives = data.alternatives || [];
            this.state.routeDirty = false;
            this.renderRoute(data);
            this.renderSummary(data);
            this.syncMenuState();
            this.syncProjectListHighlights();

            if (fitBounds) {
                this.fitRouteToBounds();
            }
        } catch (error) {
            notifyRouteMessage(error.message || 'Failed to build route.', 'error');
        } finally {
            this.state.isRouting = false;
        }
    },

    async optimizeSmartRoute(options = {}) {
        if (!this.state.origin || !this.state.destination || this.state.stops.length === 0) {
            return this.calculateRoute(options);
        }

        const data = await this.requestJson('/api/route/trip', {
            profile: this.state.profile,
            coordinates: this.getRequestedPoints()
        });

        const orderedPoints = data.orderedPoints || [];
        if (orderedPoints.length >= 2) {
            const middleStops = orderedPoints.slice(1, -1).map(point => ({
                name: point.name,
                lat: point.lat,
                lng: point.lng,
                source: 'project'
            }));

            this.state.stops = middleStops;
            this.state.optimizedOrder = orderedPoints.map(point => point.name);
            this.renderStops();
        }

        return this.calculateRoute({
            fitBounds: options.fitBounds !== false,
            openMenu: options.openMenu !== false
        });
    },

    renderRoute(routeData) {
        if (!this.ensureInitialized() || !this.layers.primary || !this.layers.glow) {
            return;
        }

        this.layers.glow?.clearLayers();
        this.layers.primary?.clearLayers();
        this.layers.alternatives?.clearLayers();
        this.layers.connectors?.clearLayers();
        this.layers.stops?.clearLayers();

        if (!routeData?.primaryRoute?.geometry) {
            document.body.classList.remove('has-route');
            return;
        }
        
        document.body.classList.add('has-route');

        // Cache computed style once for all alternatives
        const routeAltColor = getComputedStyle(document.documentElement).getPropertyValue('--route-alt').trim() || 'rgba(162, 176, 194, 0.24)';

        // Render clickable alternative routes with labels
        const alternatives = routeData.alternatives || [];
        alternatives.forEach((altRoute, index) => {
            const altLayer = L.geoJSON(altRoute.geometry, {
                pane: 'routeAltPane',
                style: () => ({
                    color: routeAltColor,
                    weight: 3.5,
                    opacity: 0.58,
                    lineCap: 'round',
                    lineJoin: 'round',
                    dashArray: '10 12',
                    className: 'route-line-alt'
                }),
                interactive: true,
                onEachFeature: (feature, layer) => {
                    const altDist = this.formatDistance(altRoute.distance);
                    const altTime = this.formatDuration(altRoute.duration);
                    const altSummary = altRoute.summary || `Alternative ${index + 1}`;
                    layer.bindTooltip(`<strong>${altSummary}</strong><br>${altDist} · ${altTime}<br><span style="opacity:0.6;font-size:0.72rem">Click to switch</span>`, {
                        sticky: true,
                        direction: 'top',
                        className: 'road-name-tooltip',
                        opacity: 0.95
                    });
                    layer.on('click', () => this.switchToAlternative(index));
                    layer.on('mouseover', function() { this.setStyle({ weight: 5, opacity: 0.82, dashArray: '10 10' }); });
                    layer.on('mouseout', function() { this.setStyle({ weight: 3.5, opacity: 0.58, dashArray: '10 12' }); });
                }
            });
            this.layers.alternatives.addLayer(altLayer);
        });

        this.layers.glow?.addData(routeData.primaryRoute.geometry);
        this.layers.primary.addData(routeData.primaryRoute.geometry);

        (routeData.waypoints || []).forEach((waypoint, index) => {
            if (!Number.isFinite(waypoint.snappedLat) || !Number.isFinite(waypoint.snappedLng)) return;

            const marker = L.marker([waypoint.snappedLat, waypoint.snappedLng], {
                pane: 'routeStopsPane',
                icon: L.divIcon({
                    className: '',
                    html: `<div class="route-stop-marker" title="${waypoint.name}"></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            });

            marker.bindTooltip(`${index + 1}. ${waypoint.name}`, {
                direction: 'top',
                offset: [0, -10],
                className: 'custom-tooltip',
                opacity: 0.95
            });

            this.layers.stops.addLayer(marker);

            const requested = routeData.requestedPoints?.[index];
            if (requested && Number.isFinite(requested.lat) && Number.isFinite(requested.lng)) {
                const snapDistance = map.distance([requested.lat, requested.lng], [waypoint.snappedLat, waypoint.snappedLng]);
                if (snapDistance > 80) {
                    const connector = L.polyline([
                        [requested.lat, requested.lng],
                        [waypoint.snappedLat, waypoint.snappedLng]
                    ], {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--route-connector').trim() || 'rgba(184, 211, 229, 0.42)',
                        weight: 2,
                        dashArray: '6 8',
                        pane: 'routeAltPane'
                    });
                    this.layers.connectors.addLayer(connector);
                }
            }
        });
    },

    switchToAlternative(altIndex) {
        const routeData = this.state.activeRoute;
        if (!routeData || !routeData.alternatives || !routeData.alternatives[altIndex]) return;

        // Swap primary and the selected alternative
        const currentPrimary = {
            distance: routeData.primaryRoute.distance,
            duration: routeData.primaryRoute.duration,
            weight: routeData.primaryRoute.weight,
            summary: routeData.primaryRoute.summary,
            geometry: routeData.primaryRoute.geometry
        };

        const selectedAlt = routeData.alternatives[altIndex];

        // Replace primary route with selected alternative
        routeData.primaryRoute.distance = selectedAlt.distance;
        routeData.primaryRoute.duration = selectedAlt.duration;
        routeData.primaryRoute.weight = selectedAlt.weight;
        routeData.primaryRoute.summary = selectedAlt.summary;
        routeData.primaryRoute.geometry = selectedAlt.geometry;
        // Steps/legs won't be available for alternatives from OSRM, keep originals
        
        // Put old primary as an alternative
        routeData.alternatives[altIndex] = currentPrimary;

        // Re-render
        this.renderRoute(routeData);
        this.renderSummary(routeData);
        this.syncMenuState();
        this.syncProjectListHighlights();
        notifyRouteMessage(`Switched to: ${selectedAlt.summary || 'Alternative route'}`, 'success');
    },

    renderStops() {
        if (!this.dom.stopsList) return;

        if (this.state.stops.length === 0) {
            this.dom.stopsList.innerHTML = '';
            return;
        }

        this.dom.stopsList.innerHTML = this.state.stops.map((stop, index) => `
            <div class="route-stop-chip">
              <span class="route-stop-index">${index + 1}</span>
              <span class="route-stop-name">${stop.name}</span>
              <span class="route-stop-actions">
                <button type="button" onclick="moveRouteStop(${index}, -1)" aria-label="Move stop up">↑</button>
                <button type="button" onclick="moveRouteStop(${index}, 1)" aria-label="Move stop down">↓</button>
                <button type="button" onclick="removeRouteStop(${index})" aria-label="Remove stop">×</button>
              </span>
            </div>
        `).join('');
    },

    renderSummary(routeData = this.state.activeRoute) {
        const requestedPointCount = [this.state.origin, ...this.state.stops, this.state.destination].filter(Boolean).length;

        if (!routeData?.primaryRoute) {
            if (requestedPointCount > 0) {
                if (this.dom.summaryEmpty) this.dom.summaryEmpty.style.display = 'none';
                if (this.dom.summaryContent) this.dom.summaryContent.style.display = 'block';
            } else {
                if (this.dom.summaryEmpty) {
                    this.dom.summaryEmpty.style.display = 'block';
                    this.dom.summaryEmpty.textContent = 'Select a start and destination to draw a real road route.';
                }
                if (this.dom.summaryContent) this.dom.summaryContent.style.display = 'none';
            }
            if (this.dom.totalDistance) this.dom.totalDistance.textContent = requestedPointCount > 1 ? 'Ready' : '--';
            if (this.dom.totalDuration) this.dom.totalDuration.textContent = requestedPointCount > 1 ? 'Pending' : '--';
            if (this.dom.stopCount) this.dom.stopCount.textContent = `${Math.max(requestedPointCount - 2, 0)}`;
            if (this.dom.primaryRoad) {
                this.dom.primaryRoad.textContent = requestedPointCount > 1
                    ? `Ready to route ${requestedPointCount} selected points. Click Route Now to build the live road path.`
                    : 'Choose a start and destination to unlock the road summary.';
            }
            if (this.dom.strategyChip) this.dom.strategyChip.textContent = requestedPointCount > 2 ? 'Multi-stop plan' : 'Strategy pending';
            if (this.dom.sequenceChip) this.dom.sequenceChip.textContent = [this.state.origin, ...this.state.stops, this.state.destination].filter(Boolean).map(point => point.name).join(' → ') || 'Select route points';
                if (this.dom.nextInstruction) this.dom.nextInstruction.textContent = requestedPointCount > 1 ? 'Route summary will include corridor names, ETA, and next maneuver after you click Route Now.' : 'Next move will appear here after route build.';
            if (this.dom.legsList) {
                this.dom.legsList.innerHTML = requestedPointCount > 1
                    ? '<div class="route-leg-item">Build the route when ready to reveal road-by-road guidance, clearer road names, and leg timing.</div>'
                    : '';
            }
            this.renderTourNarrative();
            // syncMenuState and syncProjectListHighlights deferred to callers
            return;
        }

        if (this.dom.summaryEmpty) this.dom.summaryEmpty.style.display = 'none';
        if (this.dom.summaryContent) this.dom.summaryContent.style.display = 'block';
        if (this.dom.totalDistance) this.dom.totalDistance.textContent = this.formatDistance(routeData.primaryRoute.distance);
        if (this.dom.totalDuration) this.dom.totalDuration.textContent = this.formatDuration(routeData.primaryRoute.duration);
        if (this.dom.stopCount) this.dom.stopCount.textContent = `${Math.max(requestedPointCount - 2, 0)}`;
        const insights = this.deriveRouteInsights(routeData);
        if (this.dom.primaryRoad) {
            const summaryText = insights.roadSummary || routeData.primaryRoute.summary || (this.state.optimizedOrder ? `Smart order: ${this.state.optimizedOrder.join(' → ')}` : 'Primary road summary ready');
            this.dom.primaryRoad.textContent = summaryText;
        }
        if (this.dom.strategyChip) this.dom.strategyChip.textContent = insights.strategy;
        if (this.dom.sequenceChip) this.dom.sequenceChip.textContent = insights.sequence;
        if (this.dom.nextInstruction) this.dom.nextInstruction.textContent = insights.nextInstruction;

        if (this.dom.legsList) {
            this.dom.legsList.innerHTML = (routeData.primaryRoute.legs || []).map((leg, index) => {
                const fromName = routeData.requestedPoints?.[index]?.name || `Point ${index + 1}`;
                const toName = routeData.requestedPoints?.[index + 1]?.name || `Point ${index + 2}`;
                const leadStep = (leg.steps || []).find(step => step.instruction || step.name);
                const summary = leg.summary ? `${leg.summary} • ` : '';
                const instruction = leadStep ? `<br>${leadStep.instruction || `Follow ${leadStep.name}`}` : '';
                return `<div class="route-leg-item"><strong>${fromName}</strong> → <strong>${toName}</strong><br>${summary}${this.formatDistance(leg.distance)} • ${this.formatDuration(leg.duration)}${instruction}</div>`;
            }).join('');

            // Render alternative routes selector
            const alts = routeData.alternatives || [];
            if (alts.length > 0) {
                const altsHtml = alts.map((alt, i) => {
                    const timeDiff = alt.duration - routeData.primaryRoute.duration;
                    const timeDiffStr = timeDiff > 0 ? `+${this.formatDuration(Math.abs(timeDiff))}` : `-${this.formatDuration(Math.abs(timeDiff))}`;
                    const label = alt.summary || `Alternative ${i + 1}`;
                    return `<div class="route-alt-option" onclick="RoutePlanner.switchToAlternative(${i})">
                      <div class="route-alt-label">${XI.route} ${label}</div>
                      <div class="route-alt-meta">${this.formatDistance(alt.distance)} · ${this.formatDuration(alt.duration)} <span class="route-alt-diff">${timeDiffStr}</span></div>
                    </div>`;
                }).join('');
                this.dom.legsList.innerHTML += `<div class="route-alternatives-section">
                  <div class="route-alt-header">${XI.codeBranch} Alternative Routes</div>
                  ${altsHtml}
                </div>`;
            }
        }

        this.renderTourNarrative();
        // syncMenuState and syncProjectListHighlights deferred to callers
    },

    fitRouteToBounds() {
        const bounds = this.layers.primary?.getBounds?.();
        if (bounds && bounds.isValid()) {
            map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 14, duration: 1.25 });
        }
    },

    projectAction(projectName, action) {
        this.ensureInitialized();
        const project = this.findProjectByName(projectName);
        if (!project) {
            notifyRouteMessage('Project not found for route action.', 'error');
            return;
        }

        if (action === 'origin') {
            this.setPoint('origin', project);
            notifyRouteMessage(`${project.name} staged as route start.`, 'success');
        } else if (action === 'destination') {
            this.setPoint('destination', project);
            notifyRouteMessage(`${project.name} staged as route destination.`, 'success');
        } else if (action === 'stop') {
            this.addStop(project);
            notifyRouteMessage(`${project.name} added as a staged route stop.`, 'success');
        }
    },

    routeCurrentProjectAs(action) {
        if (!currentProject) return;
        this.projectAction(currentProject.name, action);
    },

    buildAnimationPath() {
        const coordinates = this.state.activeRoute?.primaryRoute?.geometry?.coordinates || [];
        if (coordinates.length < 2) {
            return coordinates.map(([lng, lat]) => [lat, lng]);
        }

        const maxPoints = 3000;
        if (coordinates.length <= maxPoints) {
            return coordinates.map(([lng, lat]) => [lat, lng]);
        }

        // Uniform sampling with guaranteed inclusion of first and last point
        const step = Math.max(1, Math.ceil(coordinates.length / maxPoints));
        const sampled = [];
        for (let index = 0; index < coordinates.length; index += step) {
            const [lng, lat] = coordinates[index];
            sampled.push([lat, lng]);
        }

        const last = coordinates[coordinates.length - 1];
        const lastSampled = sampled[sampled.length - 1];
        if (!lastSampled || lastSampled[0] !== last[1] || lastSampled[1] !== last[0]) {
            sampled.push([last[1], last[0]]);
        }

        return sampled;
    },

    // Build cumulative distance array for the animation path (meters)
    _buildCumulativeDistances(coords) {
        const dist = [0];
        for (let i = 1; i < coords.length; i++) {
            const [lat1, lng1] = coords[i - 1];
            const [lat2, lng2] = coords[i];
            const dx = (lng2 - lng1) * 111320 * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180);
            const dy = (lat2 - lat1) * 110540;
            dist.push(dist[i - 1] + Math.sqrt(dx * dx + dy * dy));
        }
        return dist;
    },

    // Given a distance along the path, return interpolated [lat, lng] and the segment index
    _interpolateAtDistance(coords, cumDist, d) {
        if (d <= 0) return { pos: coords[0], idx: 0 };
        if (d >= cumDist[cumDist.length - 1]) return { pos: coords[coords.length - 1], idx: coords.length - 1 };
        // Binary search for the segment
        let lo = 0, hi = cumDist.length - 1;
        while (lo < hi - 1) {
            const mid = (lo + hi) >> 1;
            if (cumDist[mid] <= d) lo = mid; else hi = mid;
        }
        const segLen = cumDist[hi] - cumDist[lo];
        const t = segLen > 0 ? (d - cumDist[lo]) / segLen : 0;
        const lat = coords[lo][0] + (coords[hi][0] - coords[lo][0]) * t;
        const lng = coords[lo][1] + (coords[hi][1] - coords[lo][1]) * t;
        return { pos: [lat, lng], idx: lo };
    },

    normalizeRoadLabel(value) {
        const label = String(value || '')
            .replace(/\s+/g, ' ')
            .replace(/^Unnamed Road$/i, '')
            .replace(/^Road$/i, '')
            .replace(/^;+|;+$/g, '')
            .replace(/;/g, ' / ')
            .trim();

        return label || '';
    },

    getTourSequence() {
        const routePoints = this.state.activeRoute?.requestedPoints || this.getRequestedPoints();
        if (routePoints.length >= 2) {
            return routePoints.map(point => {
                const project = this.findProjectByName(point.name);
                return project || point;
            });
        }

        return [];
    },

    startAirTourAnimation(options = {}) {
        const resume = options.resume === true;
        const sequence = resume && this.state.airTourSequence.length
            ? this.state.airTourSequence
            : this.getTourSequence();

        if (sequence.length < 2) {
            this.toggleMenu(true);
            notifyRouteMessage('Build a route from the left menu first, then start the tour.', 'error');
            return;
        }

        if (!resume) {
            this.stopTour(true);
            this.state.airTourSequence = sequence;
            this.state.airTourLegIndex = 0;
        } else {
            this.state.airTourSequence = sequence;
            this.state.airTourLegIndex = Math.min(this.state.airTourLegIndex || 0, Math.max(sequence.length - 2, 0));
        }

        // Capture generation so stale callbacks from previous tours are ignored
        const gen = this.state.tourGeneration = (this.state.tourGeneration || 0) + 1;

        this.state.tourActive = true;
        this.state.tourPaused = false;
        this.state.pausedTourMode = '';
        this.state.forced3DForTour = false;
        this.syncTourButtons();

        // Set immediate tour context so browse telemetry shows active state
        const firstStop = sequence[0];
        const secondStop = sequence[Math.min(1, sequence.length - 1)];
        this.setTourContext(firstStop?.name, secondStop?.name, `Air tour preparing departure from ${firstStop?.name || 'start'}.`);

        // Compute total route distance for adaptive timing
        const totalRouteDist = this.state.activeRoute?.primaryRoute?.distance || 100000;

        const runLeg = () => {
            if (!this.state.tourActive || this.state.tourGeneration !== gen) return;

            try {

            const legIndex = Math.min(this.state.airTourLegIndex || 0, sequence.length - 1);

            if (legIndex >= sequence.length - 1) {
                this.setTourContext(sequence[sequence.length - 1]?.name || 'Final stop', '', 'Tour complete.');
                this.stopTour();
                return;
            }

            const current = sequence[legIndex];
            const next = sequence[legIndex + 1];
            const following = sequence[legIndex + 2];
            const activeLeg = this.state.activeRoute?.primaryRoute?.legs?.[Math.min(legIndex, Math.max((this.state.activeRoute?.primaryRoute?.legs || []).length - 1, 0))];
            const corridorLabel = activeLeg?.summary ? ` via ${activeLeg.summary}` : '';
            const legDist = activeLeg ? this.formatDistance(activeLeg.distance) : '';
            const legTime = activeLeg ? this.formatDuration(activeLeg.duration) : '';
            const legInfo = legDist && legTime ? ` (${legDist}, ${legTime})` : '';

            // Adaptive timing: scale durations by leg distance relative to total route
            const legDistMeters = activeLeg?.distance || 50000;
            const distRatio = Math.min(Math.max(legDistMeters / totalRouteDist, 0.15), 0.6);
            const flyDepartDuration = 1.2 + distRatio * 2.0;  // 1.2s – 2.4s
            const flyMidDuration = 1.0 + distRatio * 1.8;     // 1.0s – 1.9s
            const flyArriveDuration = 1.3 + distRatio * 2.0;  // 1.3s – 2.5s
            const delayDepart = 800 + distRatio * 1200;        // 0.8s – 1.5s
            const delayMid = 900 + distRatio * 1200;           // 0.9s – 1.6s
            const delayArrive = 1200 + distRatio * 1400;       // 1.2s – 2.0s

            const midpoint = {
                lat: (current.lat + next.lat) / 2,
                lng: (current.lng + next.lng) / 2
            };

            // Adaptive zoom: zoom out more for longer legs
            const midZoom = legDistMeters > 80000 ? 9.5 : legDistMeters > 40000 ? 10.2 : 11.1;

            this.setTourContext(current.name, next.name, `Air tour departing ${current.name}${corridorLabel}${legInfo}. Next stop: ${next.name}.`);

            map.flyTo([current.lat, current.lng], 14.6, {
                animate: true,
                duration: flyDepartDuration,
                easeLinearity: 0.12
            });

            if (current?.name) {
                const currentProject = this.findProjectByName(current.name);
                if (currentProject) {
                    setTimeout(() => {
                        if (this.state.tourGeneration !== gen) return;
                        openProjectHover(currentProject, { preferDirect: true });
                        // Auto-dismiss departure popup after 2.5s so it clears before mid-flight
                        setTimeout(() => safeCloseMapPopup(), 2500);
                    }, flyDepartDuration * 1000);
                }
            }

            this.state.routeAnimationFrame = window.setTimeout(() => {
                if (!this.state.tourActive || this.state.tourGeneration !== gen) return;

                const legsTotal = (this.state.activeRoute?.primaryRoute?.legs || []).length;
                const legProgress = `Leg ${legIndex + 1}/${legsTotal}`;
                this.setTourContext(current.name, next.name, `${legProgress} across the corridor${corridorLabel}. ETA: ${legTime || 'calculating...'}.`);

                map.flyTo([midpoint.lat, midpoint.lng], midZoom, {
                    animate: true,
                    duration: flyMidDuration,
                    easeLinearity: 0.08
                });

                this.state.routeAnimationFrame = window.setTimeout(() => {
                    if (!this.state.tourActive || this.state.tourGeneration !== gen) return;

                    const remainingStops = sequence.length - legIndex - 2;
                    const isFinal = remainingStops === 0;
                    const arrivalNote = !isFinal ? `${remainingStops} stop${remainingStops > 1 ? 's' : ''} remaining.` : 'Final destination!';
                    this.setTourContext(next.name, following?.name || current.name, `Arrived at ${next.name}${legInfo}. ${arrivalNote}`);

                    map.flyTo([next.lat, next.lng], 15, {
                        animate: true,
                        duration: flyArriveDuration,
                        easeLinearity: 0.14
                    });

                    const nextProject = next?.name ? this.findProjectByName(next.name) : null;
                    if (nextProject) {
                        setTimeout(() => {
                            if (this.state.tourGeneration !== gen) return;
                            openProjectHover(nextProject, { preferDirect: true });
                            // Auto-dismiss after 3s for intermediate stops; keep final stop open
                            if (!isFinal) {
                                setTimeout(() => safeCloseMapPopup(), 3000);
                            }
                        }, flyArriveDuration * 1000);
                    }

                    this.state.routeAnimationFrame = window.setTimeout(() => {
                        if (this.state.tourGeneration !== gen) return;
                        this.state.airTourLegIndex = legIndex + 1;
                        runLeg();
                    }, delayArrive);
                }, delayMid);
            }, delayDepart);

            } catch (err) {
                console.error('Air tour error:', err);
                this.stopTour();
                notifyRouteMessage('Air tour encountered an error and was stopped.', 'error');
            }
        };

        runLeg();
    },

    startDriveAnimation(resume = false) {
        const coordinates = this.buildAnimationPath();
        if (coordinates.length < 2) {
            notifyRouteMessage('Create a route first for Drive Tour.', 'error');
            return;
        }

        // Pre-compute cumulative distances along the path (meters)
        const cumDist = this._buildCumulativeDistances(coordinates);
        const pathTotalDist = cumDist[cumDist.length - 1] || 1;

        if (!resume) {
            this.stopTour(true);
            this.state.routeAnimationCoords = coordinates;
            this.state.routeAnimationIndex = 0;
            this.state.routeAnimationDist = 0; // meters traveled along path
        } else {
            this.state.routeAnimationCoords = this.state.routeAnimationCoords.length ? this.state.routeAnimationCoords : coordinates;
            // Clamp distance on resume
            this.state.routeAnimationDist = Math.min(this.state.routeAnimationDist || 0, pathTotalDist);
        }

        // Capture generation so orphan callbacks from previous tours can't corrupt this tour
        const gen = this.state.tourGeneration = (this.state.tourGeneration || 0) + 1;

        this.state.tourActive = true;
        this.state.tourPaused = false;
        this.state.pausedTourMode = '';
        if (!resume) this.state.driveSpeed = 1;
        this.state.lastDriveCameraIndex = -1;
        this.state.lastDriveHudIndex = -1;
        const sequence = this.getTourSequence();
        let lastNarratedStopIndex = -1;
        let lastHeading = 0;

        // Pre-build road name index from actual route geometry for accurate lookup
        const roadIndex = this._buildRoadIndex();

        // Pre-compute leg boundary distances (meters along path) for accurate leg tracking
        const legBoundaryDists = this._buildLegBoundaryDistances(coordinates, cumDist, sequence);

        // Create drive HUD overlay
        this.createDriveHUD();

        const startInterp = this._interpolateAtDistance(coordinates, cumDist, this.state.routeAnimationDist);
        const markerPoint = startInterp.pos;
        this.state.routeAnimationIndex = startInterp.idx;

        if (this.layers.movingMarker && map.hasLayer(this.layers.movingMarker)) {
            this.layers.movingMarker.setLatLng(markerPoint);
        } else {
            this.layers.movingMarker = L.marker(markerPoint, {
                pane: 'routeStopsPane',
                icon: L.divIcon({
                    className: '',
                    html: '<div class="route-stop-marker route-tour-indicator"></div>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            }).addTo(map);
        }

        // Set initial tour context immediately so browse telemetry shows active state
        const initStop = sequence[0];
        const initNext = sequence[Math.min(1, sequence.length - 1)];
        const modeLabel = this.state.tourMode === 'smart' ? 'Smart Tour' : 'Drive Tour';
        this.setTourContext(initStop?.name, initNext?.name, `${modeLabel} starting. ${initStop?.name || ''} → ${initNext?.name || ''}`);

        // Smooth camera interpolation state
        let cameraLat = markerPoint[0];
        let cameraLng = markerPoint[1];

        // Timer for auto-dismissing arrival popups at intermediate stops
        let arrivalPopupTimer = null;

        // Dwell state: when we reach an intermediate stop, pause animation for a few seconds
        let dwellingAtStop = false;
        let dwellTimer = null;

        // Pre-compute total duration and distance for countdown
        const totalDuration = this.state.activeRoute?.primaryRoute?.duration || 0;
        const totalDistance = this.state.activeRoute?.primaryRoute?.distance || pathTotalDist;

        // Distance-based animation: base driving speed in meters per second (wall-clock)
        // At 1x with 150 m/s base, a 10 km route takes ~67s, 50 km takes ~333s (~5.5 min)
        const BASE_SPEED_MPS = 150; // meters per second at 1x speed

        let lastFrameTime = 0;
        let lastCameraPanTime = 0;

        const step = (timestamp) => {
            // Bail if tour stopped or if this callback belongs to a previous generation
            if (!this.state.tourActive || this.state.tourGeneration !== gen) return;

            // If dwelling at a stop, keep scheduling but don't advance
            if (dwellingAtStop) {
                this.state.routeAnimationFrame = requestAnimationFrame(step);
                return;
            }

            // Compute elapsed real time
            if (lastFrameTime === 0) { lastFrameTime = timestamp; lastCameraPanTime = timestamp; }
            const dt = Math.min(timestamp - lastFrameTime, 100) / 1000; // seconds, capped at 100ms
            lastFrameTime = timestamp;

            try {

            // Advance distance based on speed * dt
            const speed = this.state.driveSpeed || 1;
            const advance = BASE_SPEED_MPS * speed * dt;
            this.state.routeAnimationDist += advance;
            const currentDist = this.state.routeAnimationDist;

            // Check if tour is complete
            if (currentDist >= pathTotalDist) {
                // Final stop: show popup and keep it open
                if (arrivalPopupTimer) { clearTimeout(arrivalPopupTimer); arrivalPopupTimer = null; }
                if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; dwellingAtStop = false; }
                const finalStop = sequence[sequence.length - 1];
                const finalProject = finalStop?.name ? this.findProjectByName(finalStop.name) : null;
                if (finalProject) {
                    openProjectHover(finalProject, { preferDirect: true });
                }
                this.stopTour();
                return;
            }

            // Interpolate position along path
            const interp = this._interpolateAtDistance(coordinates, cumDist, currentDist);
            const currentCoord = interp.pos;
            const idx = interp.idx;
            this.state.routeAnimationIndex = idx;

            // Calculate heading from previous to current point
            const prevCoord = idx > 0 ? coordinates[idx] : currentCoord;
            const bearing = this.calculateBearing(prevCoord[0], prevCoord[1], currentCoord[0], currentCoord[1]);
            if (idx > 0) lastHeading = bearing;

            if (this.layers.movingMarker) {
                this.layers.movingMarker.setLatLng(currentCoord);
            }

            // Smooth camera: lerp towards current coord instead of snapping
            const lerpFactor = 0.18;
            cameraLat += (currentCoord[0] - cameraLat) * lerpFactor;
            cameraLng += (currentCoord[1] - cameraLng) * lerpFactor;
            // Pan camera at most every 50ms for smoothness
            if (timestamp - lastCameraPanTime >= 50) {
                lastCameraPanTime = timestamp;
                map.panTo([cameraLat, cameraLng], { animate: true, duration: 0.15, easeLinearity: 1 });
            }

            const progress = pathTotalDist > 0 ? currentDist / pathTotalDist : 0;
            const pct = Math.max(1, Math.min(100, Math.round(progress * 100)));

            // Determine active leg from pre-computed boundary distances
            let activeStopIndex = 0;
            for (let b = 0; b < legBoundaryDists.length; b++) {
                if (currentDist >= legBoundaryDists[b]) activeStopIndex = b;
            }
            activeStopIndex = Math.min(activeStopIndex, Math.max(sequence.length - 2, 0));
            const currentStop = sequence[activeStopIndex] || sequence[0];
            const nextStop = sequence[Math.min(activeStopIndex + 1, sequence.length - 1)] || currentStop;

            // Road name from pre-built geometry index
            const roadName = roadIndex.length ? this._lookupRoad(roadIndex, currentCoord) : 'Local road';
            // Update HUD ~every 80ms
            if (timestamp - (this.state._lastHudTime || 0) >= 80) {
                this.state._lastHudTime = timestamp;
                // Compute remaining distance and ETA (countdown)
                const remainingDist = totalDistance - currentDist;
                const remainingTime = totalDistance > 0 ? totalDuration * (remainingDist / totalDistance) : 0;
                // Per-leg remaining
                const legStartDist = legBoundaryDists[activeStopIndex] || 0;
                const legEndDist = legBoundaryDists[activeStopIndex + 1] || pathTotalDist;
                const legSpanDist = Math.max(legEndDist - legStartDist, 1);
                const legProgress = Math.min((currentDist - legStartDist) / legSpanDist, 1);
                const activeLeg = this.state.activeRoute?.primaryRoute?.legs?.[activeStopIndex];
                const legRemainDist = activeLeg ? activeLeg.distance * (1 - legProgress) : remainingDist;
                const legRemainTime = activeLeg ? activeLeg.duration * (1 - legProgress) : remainingTime;
                this.updateDriveHUD(pct, lastHeading, roadName, currentStop?.name, nextStop?.name,
                    this.formatDuration(legRemainTime), this.formatDistance(legRemainDist));
            }

            if (activeStopIndex !== lastNarratedStopIndex) {
                lastNarratedStopIndex = activeStopIndex;

                // Clear any previous arrival popup timer
                if (arrivalPopupTimer) { clearTimeout(arrivalPopupTimer); arrivalPopupTimer = null; }

                const currentStopProject = currentStop?.name ? this.findProjectByName(currentStop.name) : null;
                if (currentStopProject) {
                    openProjectHover(currentStopProject, { preferDirect: true });
                }

                // Dwell at intermediate stops: pause animation for 4 seconds
                // so the user can see the stop, the popup, and the map can load
                const isFinalStop = activeStopIndex >= sequence.length - 2;
                if (activeStopIndex > 0 && !isFinalStop) {
                    dwellingAtStop = true;
                    // Snap camera directly to stop location for a clean view
                    cameraLat = currentCoord[0];
                    cameraLng = currentCoord[1];
                    map.flyTo([currentCoord[0], currentCoord[1]], 15, { animate: true, duration: 0.8 });

                    this.setTourContext(currentStop?.name, nextStop?.name,
                        `Arrived at ${currentStop?.name}. Pausing at stop ${activeStopIndex}/${sequence.length - 2}. Next: ${nextStop?.name}.`);

                    dwellTimer = setTimeout(() => {
                        if (this.state.tourGeneration !== gen) return;
                        dwellingAtStop = false;
                        dwellTimer = null;
                        lastFrameTime = 0; // reset so dt doesn't include dwell time
                        safeCloseMapPopup();
                        // Zoom back out to driving overview after dwell
                        map.flyTo([cameraLat, cameraLng], 14, { animate: true, duration: 0.6 });
                    }, 4000);
                }
            }

            if (idx % 8 === 0 || idx === 0) {
                const roadSuffix = roadName && roadName !== 'Guided corridor' ? ` via ${roadName}` : '';
                this.setTourContext(currentStop?.name, nextStop?.name, `${modeLabel} ${pct}%${roadSuffix}. ${currentStop?.name || ''} → ${nextStop?.name || ''}`);
            }

            this.state.routeAnimationFrame = requestAnimationFrame(step);

            } catch (err) {
                console.error('Drive tour animation error:', err);
                this.stopTour();
                notifyRouteMessage('Tour encountered an error and was stopped.', 'error');
            }
        };

        this.state.routeAnimationFrame = requestAnimationFrame(step);
    },

    // Build a dense road name index by mapping route geometry coordinates to step names
    _buildRoadIndex() {
        const legs = this.state.activeRoute?.primaryRoute?.legs || [];
        const geom = this.state.activeRoute?.primaryRoute?.geometry?.coordinates || [];
        const index = [];

        // Strategy: walk through steps and distribute their road name across
        // geometry coordinates proportional to step distance
        let geoIdx = 0;
        for (const leg of legs) {
            for (const step of (leg.steps || [])) {
                const label = this.normalizeRoadLabel(step.name || step.instruction || '');
                // Use step.location (server-normalized from maneuver.location)
                const loc = step.location;
                if (loc && loc.length >= 2) {
                    index.push({ lat: loc[1], lng: loc[0], road: label });
                }
                // Also distribute the label across geometry coords that fall within this step's distance
                const stepDist = step.distance || 0;
                let accumulated = 0;
                const startGeo = geoIdx;
                while (geoIdx < geom.length - 1 && accumulated < stepDist) {
                    const [lng1, lat1] = geom[geoIdx];
                    const [lng2, lat2] = geom[geoIdx + 1];
                    const dx = (lng2 - lng1) * 111320 * Math.cos(lat1 * Math.PI / 180);
                    const dy = (lat2 - lat1) * 110540;
                    accumulated += Math.sqrt(dx * dx + dy * dy);
                    geoIdx++;
                }
                // Add geometry points for this step at regular intervals for dense coverage
                const endGeo = geoIdx;
                const span = endGeo - startGeo;
                const sampleInterval = Math.max(1, Math.floor(span / 8));
                for (let g = startGeo; g <= endGeo && g < geom.length; g += sampleInterval) {
                    index.push({ lat: geom[g][1], lng: geom[g][0], road: label });
                }
            }
        }
        return index;
    },

    // Look up the nearest road name from the spatial index
    _lookupRoad(index, coord) {
        let bestDist = Infinity;
        let bestRoad = '';
        const lat = coord[0];
        const lng = coord[1];
        for (let i = 0; i < index.length; i++) {
            if (!index[i].road) continue; // skip empty labels
            const dx = index[i].lat - lat;
            const dy = index[i].lng - lng;
            const d = dx * dx + dy * dy;
            if (d < bestDist) {
                bestDist = d;
                bestRoad = index[i].road;
            }
        }
        return bestRoad || 'Local road';
    },

    // Pre-compute cumulative distances (meters) where each leg boundary falls
    _buildLegBoundaryDistances(coords, cumDist, sequence) {
        if (sequence.length < 2 || coords.length < 2) return [0];
        const boundaries = [0];
        for (let s = 1; s < sequence.length - 1; s++) {
            const stop = sequence[s];
            let bestIdx = 0;
            let bestDist = Infinity;
            for (let c = 0; c < coords.length; c++) {
                const dx = coords[c][0] - stop.lat;
                const dy = coords[c][1] - stop.lng;
                const d = dx * dx + dy * dy;
                if (d < bestDist) { bestDist = d; bestIdx = c; }
            }
            boundaries.push(cumDist[bestIdx] || 0);
        }
        return boundaries;
    },

    calculateBearing(lat1, lng1, lat2, lng2) {
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
        const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
                  Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
        return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
    },

    getCompassDirection(bearing) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return directions[Math.round(bearing / 45) % 8];
    },

    createDriveHUD() {
        this.removeDriveHUD();
        const hud = document.createElement('div');
        hud.id = 'driveHUD';
        hud.innerHTML = `
          <div class="drive-hud-bar">
            <div class="drive-hud-progress" id="driveProgress"></div>
          </div>
          <div class="drive-hud-info">
            <div class="drive-hud-compass" id="driveCompass">
              <svg viewBox="0 0 40 40" width="36" height="36">
                <circle cx="20" cy="20" r="18" fill="none" stroke="var(--glass-border)" stroke-width="1.5"/>
                <text x="20" y="10" text-anchor="middle" fill="var(--avaria-gold)" font-size="7" font-weight="700">N</text>
                <polygon id="driveCompassNeedle" points="20,6 17,22 20,20 23,22" fill="var(--avaria-gold)" opacity="0.9"/>
              </svg>
              <span class="drive-compass-label" id="driveCompassLabel">N</span>
            </div>
                        <div class="drive-hud-road-wrap">
                            <div class="drive-hud-label">Current Road</div>
                            <div class="drive-hud-road" id="driveRoadName">Loading road...</div>
                        </div>
            <div class="drive-hud-stops">
              <span class="drive-hud-from" id="driveFromStop">--</span>
              <span class="drive-hud-arrow">→</span>
              <span class="drive-hud-to" id="driveToStop">--</span>
            </div>
            <div class="drive-hud-leg-wrap">
              <div class="drive-hud-label">Remaining</div>
              <div class="drive-hud-leg-info" id="driveLegInfo">--</div>
            </div>
                        <div class="drive-hud-speed-wrap">
                            <div class="drive-hud-label">Tour Speed</div>
            <div class="drive-hud-speed">
              <button class="drive-speed-btn" onclick="RoutePlanner.setDriveSpeed(0.25)" data-speed="0.25">¼×</button>
              <button class="drive-speed-btn" onclick="RoutePlanner.setDriveSpeed(0.5)" data-speed="0.5">½×</button>
              <button class="drive-speed-btn active" onclick="RoutePlanner.setDriveSpeed(1)" data-speed="1">1×</button>
              <button class="drive-speed-btn" onclick="RoutePlanner.setDriveSpeed(2)" data-speed="2">2×</button>
              <button class="drive-speed-btn" onclick="RoutePlanner.setDriveSpeed(4)" data-speed="4">4×</button>
              <button class="drive-speed-btn" onclick="RoutePlanner.setDriveSpeed(8)" data-speed="8">8×</button>
            </div>
                        </div>
            <div class="drive-hud-pct" id="drivePct">0%</div>
          </div>`;
        document.body.appendChild(hud);
    },

    updateDriveHUD(pct, heading, roadName, fromStop, toStop, legEta, legDist) {
        const progressEl = document.getElementById('driveProgress');
        const compassLabel = document.getElementById('driveCompassLabel');
        const needle = document.getElementById('driveCompassNeedle');
        const roadEl = document.getElementById('driveRoadName');
        const fromEl = document.getElementById('driveFromStop');
        const toEl = document.getElementById('driveToStop');
        const pctEl = document.getElementById('drivePct');
        const legInfoEl = document.getElementById('driveLegInfo');

        if (progressEl) progressEl.style.width = `${pct}%`;
        if (compassLabel) compassLabel.textContent = this.getCompassDirection(heading);
        if (needle) needle.style.transform = `rotate(${heading}deg)`;
        if (needle) needle.style.transformOrigin = '20px 20px';
        if (roadEl) roadEl.textContent = this.normalizeRoadLabel(roadName) || 'Local road';
        if (fromEl) fromEl.textContent = fromStop || '--';
        if (toEl) toEl.textContent = toStop || '--';
        if (pctEl) pctEl.textContent = `${pct}%`;
        if (legInfoEl) legInfoEl.textContent = legEta && legDist ? `${legDist} · ${legEta}` : legEta || legDist || '--';
    },

    removeDriveHUD() {
        const hud = document.getElementById('driveHUD');
        if (hud) hud.remove();
    },

    setDriveSpeed(speed) {
        this.state.driveSpeed = speed;
        document.querySelectorAll('.drive-speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
        });
    },

    pauseTour() {
        if (!this.state.tourActive) {
            return false;
        }

        this.state.tourActive = false;
        this.state.tourPaused = true;
        this.state.pausedTourMode = this.state.tourMode === 'air' ? 'air' : 'drive';

        if (this.state.routeAnimationFrame) {
            cancelAnimationFrame(this.state.routeAnimationFrame);
            clearTimeout(this.state.routeAnimationFrame);
            this.state.routeAnimationFrame = null;
        }

        safeStopMapMotion();
        safeCloseMapPopup();

        this.removeDriveHUD();
        this.syncTourButtons();
        notifyRouteMessage('Tour paused. Use Continue Tour to resume.', 'info');
        return true;
    },

    resumeTour() {
        if (!this.state.tourPaused || !this.state.pausedTourMode) {
            notifyRouteMessage('No paused tour available to continue.', 'warning');
            return false;
        }

        const mode = this.state.pausedTourMode;
        return this.startTour({ mode, resume: true });
    },

    async startTour(options = {}) {
        this.ensureInitialized();
        const resume = options.resume === true;

        // Prevent double-start: if already active and not resuming, stop first
        if (this.state.tourActive && !resume) {
            this.stopTour(true);
        }

        const requestedMode = options.mode || this.dom.tourModeSelect?.value || this.state.tourMode || 'air';
        this.state.tourMode = requestedMode;

        if (this.state.tourMode === 'air') {
            if (!resume && !this.state.activeRoute && this.state.origin && this.state.destination) {
                await this.calculateRoute({ fitBounds: false, openMenu: false });
            }

            if (!this.state.activeRoute) {
                notifyRouteMessage('Route must be calculated before starting the tour. Click Route Now first.', 'error');
                return false;
            }

            const sequence = resume && this.state.airTourSequence.length
                ? this.state.airTourSequence
                : this.getTourSequence();

            if (sequence.length < 2) {
                notifyRouteMessage('Build a valid route before starting the air tour.', 'error');
                return false;
            }

            this.startAirTourAnimation({ resume });
            this.syncTourButtons();
            notifyRouteMessage(resume ? 'Air tour resumed.' : 'Air tour started.', 'success');
            return true;
        }

        try {
            if (!resume) {
                if (this.state.tourMode === 'smart') {
                    await this.optimizeSmartRoute({ fitBounds: false, openMenu: false });
                } else if (!this.state.activeRoute) {
                    await this.calculateRoute({ fitBounds: false, openMenu: false });
                }
            }

            // Verify route was actually built before proceeding
            if (!this.state.activeRoute?.primaryRoute?.geometry) {
                notifyRouteMessage('Route must be calculated before starting the tour. Click Route Now first.', 'error');
                return false;
            }

            const drivePath = resume && this.state.routeAnimationCoords.length
                ? this.state.routeAnimationCoords
                : this.buildAnimationPath();

            if (drivePath.length < 2) {
                notifyRouteMessage('Build a valid route before starting the tour.', 'error');
                return false;
            }

            this.startDriveAnimation(resume);
            this.syncTourButtons();
            notifyRouteMessage(resume ? 'Drive tour resumed.' : 'Drive tour started.', 'success');
            return true;
        } catch (error) {
            notifyRouteMessage(error.message || 'Tour could not start.', 'error');
            return false;
        }
    },

    stopTour(silent = false) {
        // Bump generation so any lingering RAF/timeout callbacks from a previous tour
        // will see the mismatch and bail out immediately.
        this.state.tourGeneration = (this.state.tourGeneration || 0) + 1;

        this.state.tourActive = false;
        this.state.tourPaused = false;
        this.state.pausedTourMode = '';
        if (this.state.routeAnimationFrame) {
            cancelAnimationFrame(this.state.routeAnimationFrame);
            clearTimeout(this.state.routeAnimationFrame);
            this.state.routeAnimationFrame = null;
        }

        if (this.layers.movingMarker && map.hasLayer(this.layers.movingMarker)) {
            map.removeLayer(this.layers.movingMarker);
        }
        this.layers.movingMarker = null;

        this.removeDriveHUD();
        this.state.forced3DForTour = false;
        this.state.airTourSequence = [];
        this.state.airTourLegIndex = 0;
        this.state.routeAnimationCoords = [];
        this.state.routeAnimationIndex = 0;
        this.state.routeAnimationDist = 0;
        this.state.lastDriveCameraIndex = -1;
        this.state.lastDriveHudIndex = -1;
        this.clearTourContext();
        this.syncProjectListHighlights();
        safeStopMapMotion();
        safeCloseMapPopup();

        this.syncTourButtons();

        if (!silent) {
            notifyRouteMessage('Tour ended.', 'info');
        }
    },

    endTour() {
        return this.stopTour(false);
    }
};

window.RoutePlanner = RoutePlanner;

startTour = function() {
    return RoutePlanner.startTour();
};

stopTour = function() {
    return RoutePlanner.stopTour();
};

function calculatePlannedRoute() {
    return RoutePlanner.calculateRoute();
}

function clearPlannedRoute() {
    return RoutePlanner.clear();
}

function reversePlannedRoute() {
    return RoutePlanner.reverse();
}

function fitRouteToBounds() {
    return RoutePlanner.fitRouteToBounds();
}

function addRouteStopFromInput() {
    return RoutePlanner.addStopFromInput();
}

function moveRouteStop(index, delta) {
    return RoutePlanner.moveStop(index, delta);
}

function removeRouteStop(index) {
    return RoutePlanner.removeStop(index);
}

function routeProjectAction(projectName, action) {
    return RoutePlanner.projectAction(projectName, action);
}

function routeProjectActionEncoded(projectToken, action) {
    return routeProjectAction(decodeProjectToken(projectToken), action);
}

function routeCurrentProjectAs(action) {
    return RoutePlanner.routeCurrentProjectAs(action);
}

document.addEventListener('DOMContentLoaded', () => {
    RoutePlanner.init();
});

function toggleRouteMenu(forceOpen) {
    return RoutePlanner.toggleMenu(forceOpen);
}

// ═══════════════════════════════════════════════════════════
// P4: MOBILE-NATIVE UX — Bottom Sheet · FAB · Bottom Nav
// ═══════════════════════════════════════════════════════════
(function initMobileUX() {
    'use strict';

    const MQ = window.matchMedia('(max-width: 768px)');
    if (!MQ.matches) return; // Desktop → skip

    // ── P9: Strip desktop-only DOM to save ~94 nodes ──
    ['right-dock', 'timeline-container', 'comparison-drawer', 'comparisonModal'].forEach(function(id) {
        var el = document.getElementById(id) || document.querySelector('.' + id);
        if (el) el.remove();
    });

    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // ── Inject drag handle as first child of sidebar ──
    const handle = document.createElement('div');
    handle.className = 'sheet-drag-handle';
    handle.innerHTML = '<div class="sheet-drag-handle-bar"></div>';
    sidebar.insertBefore(handle, sidebar.firstChild);

    // ── State management ──
    const STATES = ['hidden', 'half', 'full'];
    let currentState = 'hidden';

    // Start hidden on mobile (map-first experience)
    sidebar.classList.add('collapsed');
    sidebar.removeAttribute('data-sheet');

    function setSheetState(state) {
        currentState = state;
        sidebar.removeAttribute('data-sheet');

        if (state === 'hidden') {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            if (state === 'half' || state === 'full') {
                sidebar.setAttribute('data-sheet', state);
            }
        }

        // Scrim
        var scrim = document.getElementById('sheetScrim');
        if (scrim) {
            scrim.classList.toggle('visible', state === 'half' || state === 'full');
        }

        // FAB visibility — hide when sheet is open
        var fab = document.getElementById('mobileFab');
        if (fab) {
            fab.style.display = (state === 'half' || state === 'full') ? 'none' : '';
        }
        if (state === 'half' || state === 'full') {
            closeFabMenu();
        }

        // Update nav tabs
        if (state === 'hidden') {
            _setActiveTab('map');
        }
    }

    window.setSheetState = setSheetState;

    // ── Touch gesture on drag handle + scroll-area swipe-to-dismiss ──
    var startY = 0, startTranslateY = 0, dragging = false;

    handle.addEventListener('touchstart', function(e) {
        dragging = true;
        startY = e.touches[0].clientY;
        var transform = getComputedStyle(sidebar).transform;
        if (transform && transform !== 'none') {
            var matrix = new DOMMatrix(transform);
            startTranslateY = matrix.m42;
        } else {
            startTranslateY = 0;
        }
        sidebar.classList.add('dragging');
    }, { passive: true });

    handle.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        var deltaY = e.touches[0].clientY - startY;
        var maxTranslate = sidebar.offsetHeight;
        var newY = Math.max(0, Math.min(maxTranslate, startTranslateY + deltaY));
        sidebar.style.transform = 'translateY(' + newY + 'px)';
    }, { passive: true });

    handle.addEventListener('touchend', function(e) {
        if (!dragging) return;
        dragging = false;
        sidebar.classList.remove('dragging');
        sidebar.style.transform = '';

        var endY = e.changedTouches[0].clientY;
        var deltaY = endY - startY;
        var idx = STATES.indexOf(currentState);

        if (deltaY < -40) {
            setSheetState(STATES[Math.min(idx + 1, STATES.length - 1)]);
        } else if (deltaY > 40) {
            setSheetState(STATES[Math.max(idx - 1, 0)]);
        } else {
            setSheetState(currentState);
        }
    }, { passive: true });

    // ── Scroll-area: swipe down when scrolled to top → collapse sheet ──
    var scrollEl = sidebar.querySelector('.sidebar-scroll');
    if (scrollEl) {
        var scrollStartY = 0, scrollDragging = false;
        scrollEl.addEventListener('touchstart', function(e) {
            if (scrollEl.scrollTop <= 1) {
                scrollStartY = e.touches[0].clientY;
                scrollDragging = true;
            }
        }, { passive: true });
        scrollEl.addEventListener('touchend', function(e) {
            if (!scrollDragging) return;
            scrollDragging = false;
            var delta = e.changedTouches[0].clientY - scrollStartY;
            if (delta > 60 && scrollEl.scrollTop <= 1) {
                var idx = STATES.indexOf(currentState);
                setSheetState(STATES[Math.max(idx - 1, 0)]);
            }
        }, { passive: true });
    }

    // ── Scrim click → collapse to peek ──
    var scrimEl = document.getElementById('sheetScrim');
    if (scrimEl) {
        scrimEl.addEventListener('click', function() {
            setSheetState('peek');
        });
    }

    // ── Bottom Nav ──
    function _setActiveTab(tab) {
        var tabs = document.querySelectorAll('.nav-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('active', tabs[i].dataset.tab === tab);
        }
    }

    var navTabs = document.querySelectorAll('.nav-tab');
    for (var i = 0; i < navTabs.length; i++) {
        navTabs[i].addEventListener('click', function() {
            var tab = this.dataset.tab;
            _setActiveTab(tab);

            switch (tab) {
                case 'map':
                    setSheetState('hidden');
                    if (typeof switchMode === 'function') switchMode('zone');
                    closeFabMenu();
                    // Close chatbot if open
                    var chatWin = document.getElementById('aiChatWindow');
                    if (chatWin && chatWin.classList.contains('active')) {
                        chatWin.classList.remove('active');
                    }
                    break;

                case 'search':
                    if (typeof switchMode === 'function') switchMode('zone');
                    setSheetState('half');
                    setTimeout(function() {
                        var input = document.getElementById('searchInput');
                        if (input) input.focus();
                    }, 400);
                    break;

                case 'favorites':
                    if (typeof switchMode === 'function') switchMode('fav');
                    setSheetState('half');
                    break;

                case 'rita':
                    setSheetState('hidden');
                    if (typeof toggleAIChat === 'function') toggleAIChat();
                    _setActiveTab('rita');
                    break;

                case 'more':
                    setSheetState('full');
                    break;
            }
        });
    }

    // ── FAB Menu ──
    function toggleFabMenu() {
        var fab = document.getElementById('mobileFab');
        var menu = document.getElementById('fabMenu');
        var backdrop = document.getElementById('fabBackdrop');
        if (!fab || !menu) return;

        var isOpen = menu.classList.contains('open');
        fab.classList.toggle('active', !isOpen);
        menu.classList.toggle('open', !isOpen);
        if (backdrop) backdrop.classList.toggle('visible', !isOpen);
    }

    function closeFabMenu() {
        var fab = document.getElementById('mobileFab');
        var menu = document.getElementById('fabMenu');
        var backdrop = document.getElementById('fabBackdrop');
        if (fab) fab.classList.remove('active');
        if (menu) menu.classList.remove('open');
        if (backdrop) backdrop.classList.remove('visible');
    }

    window.toggleFabMenu = toggleFabMenu;
    window.closeFabMenu = closeFabMenu;

    // FAB button click
    var fabBtn = document.getElementById('mobileFab');
    if (fabBtn) {
        fabBtn.addEventListener('click', toggleFabMenu);
    }

    // FAB backdrop click
    var fabBackdropEl = document.getElementById('fabBackdrop');
    if (fabBackdropEl) {
        fabBackdropEl.addEventListener('click', closeFabMenu);
    }

    // FAB menu item clicks
    var fabItems = document.querySelectorAll('.fab-menu-btn');
    for (var j = 0; j < fabItems.length; j++) {
        fabItems[j].addEventListener('click', function(e) {
            var btn = e.currentTarget;
            var layer = btn.dataset.layer;
            var action = btn.dataset.action;

            if (layer) {
                // Map layer switch
                if (typeof switchMapLayer === 'function') switchMapLayer(layer);
                // Update active states
                var allBtns = document.querySelectorAll('.fab-menu-btn[data-layer]');
                for (var k = 0; k < allBtns.length; k++) {
                    allBtns[k].classList.toggle('active', allBtns[k] === btn);
                }
            } else if (action === 'reset') {
                if (typeof map !== 'undefined' && map) map.flyTo([30.0, 31.0], 7);
            } else if (action === 'heatmap') {
                if (typeof toggleHeatmap === 'function') toggleHeatmap();
                btn.classList.toggle('active');
            } else if (action === 'labels') {
                if (typeof toggleLabels === 'function') toggleLabels();
                btn.classList.toggle('active');
            } else if (action === '3d') {
                if (typeof toggle3DMode === 'function') toggle3DMode();
                btn.classList.toggle('active');
            }

            closeFabMenu();
        });
    }

    // ── Smart Legend ──
    var legend = document.querySelector('.legend-container');
    if (legend) {
        var legendTimer;
        legend.addEventListener('click', function(e) {
            e.stopPropagation();
            legend.classList.toggle('legend-expanded');
            clearTimeout(legendTimer);
            if (legend.classList.contains('legend-expanded')) {
                legendTimer = setTimeout(function() {
                    legend.classList.remove('legend-expanded');
                }, 5000);
            }
        });
    }

    // ── Override toggleSidebar for mobile ──
    var _origToggleSidebar = window.toggleSidebar;
    window.toggleSidebar = function(event) {
        if (MQ.matches) {
            if (event) event.stopPropagation();
            // Simple show/hide toggle: visible → hidden, hidden → peek
            if (currentState === 'hidden') {
                setSheetState('peek');
            } else {
                setSheetState('hidden');
            }
        } else {
            _origToggleSidebar(event);
        }
    };

    // ── Listen for responsive changes ──
    MQ.addEventListener('change', function(e) {
        if (!e.matches) {
            // Switched to desktop: clean up mobile state
            sidebar.removeAttribute('data-sheet');
            sidebar.classList.remove('dragging');
            sidebar.style.transform = '';
        }
    });

})();


