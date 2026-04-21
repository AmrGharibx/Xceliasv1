# EXCELIAS V2 — UNIFIED PLATFORM MEGA-PROMPT

## MISSION STATEMENT

Build a **single unified application** called **"Excelias"** that serves as a **home portal** integrating **all 5 existing projects** into one seamless platform. **ZERO code deletion** — every single line of code from every project must be preserved and functional. The unified app adds ONLY a home/launcher layer on top; each project continues to run exactly as it does today.

---

## THE 5 PROJECTS (COMPLETE REFERENCE)

### PROJECT 1: "Red Materials Academy" (Activities)
- **Location:** `Activites ( WorkSpace )/RedMaterialsAcademy/`
- **Tech:** React 18 (CDN) + Babel standalone (in-browser JSX) — NO build tools, NO npm
- **Entry:** `index.html` loads CDN scripts → `app.jsx` (~10,451 lines) via `<script type="text/babel">`
- **Architecture:** Single-page app, React Context (`UIContext`), 100% inline JS styles, localStorage persistence
- **What it is:** A gamified real estate training academy with 43 interactive activities across 9 category lanes (Knowledge, Visual & Property, Broker vs Developer, Client Psychology, Calls & Communication, Professional Image, Advanced Scenarios, Classroom Tools, Fun & Review)
- **Key Systems:**
  - 6-rank progression (Rookie → Legend) with score/streak tracking
  - Per-activity mastery computation (accuracy 72% + repetition 28%)
  - Activity unlock gates (score thresholds, activity counts, mastery levels)
  - Red Ops daily missions (Warm-up, Variety, Score Push, Repair Loop)
  - Review queue for weak activities
  - Dashboard with command deck, performance signals, category lanes
  - Bilingual EN/Egyptian Arabic via `UI_STRINGS` + translation maps
  - Canvas particle system background (`BackgroundFX`)
  - Settings: language toggle, FX intensity, reduced motion, projector mode
- **Components (43 total):** 12 reusable UI components + 35 activity components + `App` orchestrator
- **All Activity IDs:** `rapidfire`, `truefalse`, `matching`, `oddone`, `blanks`, `acronym`, `hierarchy`, `accessories`, `unittype`, `finishing`, `commercial`, `sortinghat`, `procon`, `market`, `motive`, `needswants`, `whychain`, `brainheart`, `decoder`, `robot`, `mirror`, `callflow`, `abc`, `mistake`, `qualifying`, `dresscode`, `skills`, `impression`, `objectionduel`, `objection`, `triage`, `form`, `coldcall`, `21exp`, `teambattle`, `facilitator`, `debrief`, `consensus`, `reviewrescue`, `academysprint`, `bingo`, `crossword`, `exam`
- **State:** `currentActivity`, `globalScore`, `globalStreak`, `selectedCategory`, `academyProgress`, `tone`, `fxIntensity`, `reduceMotion`, `backgroundEnabled`, `projectorMode`, `settingsOpen`, `promotionNotice`, `rewardNotice`, `unlockNotice`
- **External CDNs:** React 18 (unpkg), ReactDOM 18 (unpkg), Babel standalone (unpkg), Inter font (Google)
- **CSS Animations (in index.html):** `fadeIn`, `pulse`, `shake`, `glow`, `slideIn`, `bounceIn`, `confetti`, `rmCardBreath`, `rmGradientShift`, `rmPulseGlow`, `auroraShift`

---

### PROJECT 2: "Red Materials" (Content/Training Manual)
- **Location:** `Content ( WorkSpace )/red-materials-app/`
- **Tech:** Create React App (React 18, react-scripts 5.0.1) + framer-motion + lucide-react + recharts + Three.js (@react-three/fiber + @react-three/drei) + Lenis smooth scroll
- **Entry:** `public/index.html` (Tailwind CDN + Google Fonts) → `src/index.js` → `src/App.js`
- **Architecture:** Single-page scroll-based app, NO router, Lenis smooth scrolling, local React state only, IntersectionObserver for active section tracking
- **What it is:** An immersive chapter-based interactive training manual transforming a 30-slide PowerPoint into a premium web experience for real estate sales consultants
- **8 Chapters/Sections:**
  1. `HeroSection` (Ch.00) — Landing/overview with CTAs, promises, training posture cards
  2. `InventorySection` (Ch.01) — Property types (residential/commercial/land), finishing levels
  3. `MarketSection` (Ch.02) — Broker vs Developer comparison, Primary vs Resale paths
  4. `RequestSection` (Ch.03) — 7 qualification pillars (Context, Structure, Timing, Readiness, Trust, Signal, Commercial Reality)
  5. `PsychologySection` (Ch.04) — Buyer psychology, Needs vs Wants, emotion/rational lens
  6. `ArsenalSection` (Ch.05) — 8 sales skills radar chart, first-impression doctrine, 7 accessories rules
  7. `CallsSection` (Ch.06) — ABC principle, communication retention pie chart, call posture, rapport
  8. `MasterySection` (Ch.07) — Field recap, tomorrow morning ritual
- **3 Overlay Drawers:**
  - `ChapterMapDrawer` — 2-column grid of all 8 chapters
  - `QuickReferenceDrawer` — Left-slide briefing notes (6 chapter briefs + 4 quick reference groups)
  - `SourceDeckDrawer` — Right-slide verbatim transcript archive (30 slides, searchable, copyable)
- **Components:** `App`, `ProgressBar`, `TopNavigation`, `ChapterMapDrawer`, `QuickReferenceDrawer`, `SourceDeckDrawer`, `UltraCanvas` (Three.js 3D background with glass Monolith meshes + spiral RibbonField particles + Stars + Sparkles), `ErrorBoundary`, `UltraFallbackBg`, `useDialogAccessibility` (focus trap hook)
- **UI Primitives (ui.js):** `cx()`, `fadeUp`, `SectionShell`, `Panel`, `Eyebrow`, `StatChip`, `TakeawayList`, `PrimaryButton`, `SecondaryButton`, `SkipLink`
- **Data (content.js — 18 exports):** `SOURCE_DECK`, `NAV_ITEMS`, `HERO_PROMISES`, `HERO_STATS`, `INVENTORY_CATEGORIES`, `FINISHING_TYPES`, `MARKET_COMPARISON`, `PRIMARY_RESALE`, `REQUEST_PILLARS`, `PSYCHOLOGY_SIGNALS`, `NEEDS_WANTS`, `ARSENAL_SKILLS`, `ARSENAL_ACCESSORIES`, `CALLS_DATA`, `MASTERY_RECAP`, `CHAPTER_REFERENCES`, `CHAPTER_BRIEFS`, `QUICK_REFERENCE_GROUPS`
- **Styling:** 100% Tailwind utility classes (CDN), CSS custom properties for design tokens (dark theme, red/crimson accent, gold, glassmorphism), custom fonts (Manrope body, Fraunces display)
- **State Variables:** `activeSection`, `sourceOpen`, `mapOpen`, `briefingOpen`, `reducedMotion`, `enableCanvas`, `reducedEffects`
- **External CDNs:** Tailwind CSS (cdn.tailwindcss.com), Google Fonts (Fraunces + Manrope)
- **npm Dependencies:** react, react-dom, react-scripts, framer-motion, lucide-react, recharts, three, @react-three/fiber, @react-three/drei, @studio-freight/lenis
- **Legacy:** Root `App.js` (1613-line monolithic version) — NOT used by build system

---

### PROJECT 3: "RED Report Generator" (Report Generation)
- **Location:** `Report Generation 3/`
- **Tech:** Single-file HTML, NO frameworks, Tesseract.js 5 OCR, html2canvas + jsPDF for PDF
- **Entry:** `index.html` (~1,745 lines — current v3 with OCR)
- **Architecture:** 4-step wizard SPA, vanilla JavaScript, all inline, zero backend, zero API keys
- **What it is:** A trainee performance report generator that extracts data from screenshots via OCR, generates professional A4 PDF reports with score calculations, assessment tiers, and smart text generation
- **4-Step Wizard:**
  1. **Setup** — Company Name + Batch Number
  2. **Screenshots** — Upload images, OCR extraction (Tesseract.js with preprocessing: 2-4x upscale, grayscale, binarization), raw OCR text display, reference panel
  3. **Review** — Trainee cards with expandable sections: Personal Info, Score Breakdown (4 scores × 0-5), Attendance, Overall Assessment (auto-generated), Trainer's Comments (auto-generated)
  4. **Report** — Full A4 preview with toolbar (Edit, Print, Download PDF, New Report)
- **Score Formula:** `totalCore = PK + Map`, `techScore% = totalCore/10 × 100`, `conductRating = Present + SS`, `softScore% = conductRating/10 × 100`, `overall% = (tech% + soft%) / 2`
- **5 Tiers:** Aced (≥90%), Excellent (≥80%), Good (≥70%), Passed (≥60%), Failed (<60%)
- **Smart Text Engine:** `genAssessment(t)` — multi-sentence performance paragraph, `genComments(t)` — trainer feedback with strengths/areas to improve
- **OCR Parser:** Dual-mode — Notion Card View Parser (multi-pass field extraction) + Spreadsheet/Table Parser (header detection + column mapping)
- **Report Pages:** Cover page (RED sidebar + logo + title + info), Individual trainee pages (details card + assessment + score tables + attendance + comments), Concluding remarks page (tier-grouped summaries + motivational quote)
- **State:** `S = { step, maxStep, co, batch, imgs[], trainees[] }`
- **Key Functions:** `extractFromScreenshots()`, `ocrPreprocess()`, `parseCardView()`, `parseOCRText()`, `genAssessment()`, `genComments()`, `genReport()`, `mkIntro()`, `mkPage()`, `mkOutro()`, `dlPDF()`, `recalcAll()`
- **External CDNs:** Google Fonts (Sora + Playfair Display), html2canvas 1.4.1, jsPDF 2.5.1, Tesseract.js 5
- **Backup Files:** `index_backup.html` (v1 — static hardcoded), `index_v2_backup.html` (v2 — AI API powered with Gemini/OpenAI)

---

### PROJECT 4: "Avaria Academy" (LMS/Operations OS)
- **Location:** `System Before Prompting V2/avaria/`
- **Tech:** Next.js 16 + React 19 + TypeScript + Prisma 7 (SQLite) + Tailwind CSS 4 + Three.js + GSAP + Zustand + framer-motion + recharts + jose (JWT) + bcryptjs + zod + react-hook-form + date-fns
- **Entry:** `npm run dev` → `next dev --webpack -p 3005` → `app/layout.tsx` → `app/page.tsx`
- **Architecture:** Full-stack Next.js App Router, Server + Client Components, JWT auth (httpOnly cookies), Prisma ORM with SQLite, 4 Zustand stores, NOVA Design System
- **What it is:** A complete Learning Management System for managing real estate training batches, trainees, attendance, assessments, and analytics with a cinematic dark-themed UI
- **14 Page Routes:**
  - `/` — Dashboard "Command Center" (hero panel, 4 metrics, 3 charts, live feed)
  - `/login` — Email/password authentication
  - `/setup` — First-time admin creation
  - `/trainees` — Trainee list (CRUD, search, filters, pagination)
  - `/trainees/[id]` — Trainee profile (3 tabs: Overview/Attendance/Assessments)
  - `/batches` — Batch list (grid + kanban views)
  - `/batches/[id]` — Batch detail (4 tabs: Trainees/Daily/10-Day/Assessments)
  - `/attendance/daily` — Daily attendance log
  - `/attendance/10-day` — 10-day attendance summary
  - `/assessments` — Assessment management (score sliders 0-5)
  - `/analytics` — Analytics dashboard (5 chart types + date range)
  - `/companies` — Company leaderboard
  - `/companies/[name]` — Company detail
  - `/settings` — Appearance, password, notifications, export/import
- **23 API Endpoints:** `/api/dashboard`, `/api/analytics`, `/api/search`, `/api/export`, `/api/ingest`, `/api/health`, `/api/auth/*` (login, logout, me, setup, change-password), `/api/trainees/*`, `/api/batches/*`, `/api/attendance/daily/*`, `/api/attendance/10-day/*`, `/api/assessments/*`, `/api/companies/*`
- **8 Database Models:** Batch, Trainee, DailyAttendance, TenDayAttendance, Assessment, User, DataImport, SystemLog
- **Auth:** JWT (HS256 via jose) + bcryptjs (12 rounds) + httpOnly cookies, 3 roles (admin/instructor/viewer), middleware.ts protects all routes
- **4 Zustand Stores:** `useThemeStore` (colors, backgrounds, animations), `useDashboardStore` (widget layout), `useUIStore` (sidebar, modals, notifications), `useVisualModeStore` (performance/cinematic)
- **Components:**
  - Layout: `Sidebar` (collapsible 288↔92px), `Header` (command palette + cinematic toggle + user)
  - UI (18): `StatsCard`, `CompletionRing`, `ProgressBar`, `Badge`, `Button`, `Input`, `FormField`, `Select`, `Card`, `Avatar`, `Skeleton`, `Tooltip`, `EmptyState`, `Breadcrumb`, `CardSkeleton`, `PageSkeleton`, `TableSkeleton`, `StatSkeleton`
  - Modal: `Modal`, `ConfirmDialog`, `ModalInput`, `ModalSelect`, `ModalFooter`
  - Toast: `ToastProvider`, `useToast`
  - Search: `CommandPalette` (⌘K overlay, debounced, keyboard nav)
  - Customization: `CustomizationPanel` (visual mode, color scheme, background, density, speed, font)
  - Visuals: `ThreeBackdrop` (800 aurora particles, emerald orb, orbital rings, parallax camera), `GlobalFx` (GSAP pulse + Three.js), `RouteFx` (route transition bar), `VisualModeSync`
  - Utilities: `ClientOnly`, `ErrorBoundary`
- **Design System (NOVA):** Deep ocean/void theme, `--app-bg: #060912`, electric cyan `#06b6d4`, warm gold `#f59e0b`, 5 signal colors, `obsidian-card` + `glass-card` + `hero-panel` surfaces, Plus Jakarta Sans / Space Grotesk / JetBrains Mono fonts
- **Data Pipeline:** Notion CSV exports → `parseNotionData.ts` → `notionData.json` → `seed-db.ts` → SQLite, or POST `/api/ingest` for CSV upload
- **Security Headers (next.config.ts):** X-Content-Type-Options, X-Frame-Options (DENY), X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS

---

### PROJECT 5: "RED Real Estate Website" (Property Explorer)
- **Location:** `Website ( WorkSpace )/`
- **Tech:** Vanilla JS SPA (8,100-line app.js + 5,915-line styles.css) + Express backend (server.ultra.js) + Service Worker + Web Worker
- **Entry:** `index.html` (~1,580 lines) loads all CDN scripts → `app.js`
- **Architecture:** Single-page app, Leaflet interactive map, Express API server (optional), Service Worker (offline-first), Web Worker (search), IndexedDB (tile cache)
- **What it is:** A premium real estate property explorer with interactive map, AI chatbot (RITA), route planning, investment analysis, PDF brochure generation, and 8 theme system
- **Major Systems (15+):**
  1. **i18n** — Full Arabic/English with RTL layout, 150+ translation keys, localStorage persistence
  2. **Interactive Map** — Leaflet with 3 tile layers (street/satellite/hybrid), MarkerCluster, heatmap, 3D CSS perspective mode, road overlay (Overpass API)
  3. **TileCache** — IndexedDB (500MB max, 7-day TTL), custom `L.TileLayer.Cached`
  4. **Search** — Web Worker with NLP parser (negations, numeric extraction, 12 unit types, 6 zones, status, amenities, developer, sorting) + Fuse.js fuzzy matching
  5. **Voice Commands** — Web Speech API SpeechRecognition for navigation/search
  6. **NeuralView** — Canvas overlay showing similarity lines between source project and top 3 similar
  7. **Advanced Filters** — Price/area ranges, bedrooms, down payment %, installment years
  8. **Comparison System** — Compare up to 3 projects side-by-side
  9. **Route Planner** — Full OSRM-powered routing with origin/destination/stops, alternative routes, tour modes (air/drive/smart), moving marker animation, stop reordering
  10. **RITA AI Chatbot** — Ollama (local qwen2.5:7b), 8 intent types, entity extraction (zones/developers/projects/units/prices), action parsing, local fallback handlers, voice input
  11. **PDF Brochure** — jsPDF + AutoTable with configurable sections, QR code, inline SVG logo
  12. **Mortgage Calculator** — Zone-based defaults, standard mortgage formula, 0% interest option
  13. **AI Investment Analyzer** — Opportunity Score 0-100 (7 factors), 5-year appreciation, rental yield, 10 verdict tiers
  14. **8 Theme System** — default/royal, midnight, forest, sunset, slate, dark-red, light, plus light variants + CSS custom properties
  15. **Favorites/Recently Viewed/Price Alerts** — All localStorage-persisted
  16. **Cinematic Tour** — Auto-fly to 5 featured projects with narrative
  17. **Timeline Slider** — Year filter 2020-2030 with auto-play
  18. **Lifestyle Dock** — Drag-and-drop amenity icons (golf/sea/pool/kids) for filtering
  19. **Spatial Audio** — AudioContext with zone-based volume
  20. **Deep Linking** — URL params (`?project=`, `?search=`, `?zone=`) + hash (`#project=`)
- **Data Files:** `data.json` (master bundle), `cairo.json`, `gouna.json`, `north_coast.json`, `sokhna.json`, `others.json`
- **Server (server.ultra.js):** Express with helmet, cors, compression, OSRM route proxy with cache, project query API, search API, static serving
- **Service Worker (sw.js):** 3 cache stores, cache-first tiles, stale-while-revalidate CDN, network-first data
- **Search Worker (search.worker.js):** Fuse.js + NLP parser, runs off main thread
- **Scraper System:** `scraper.py` (Nawy + REDWW), `merge_data.js/py` (fuzzy matching), `payment_plans_scraper.js` (150+ entries), `price_database.json`
- **Deployment:** Vercel (vercel.json with security headers + cache control)
- **External Services:** Carto tiles, ArcGIS satellite, OSRM routing, Overpass roads, Ollama (local AI), Google Fonts, cdnjs, unpkg, jsDelivr

---

## UNIFIED APP ARCHITECTURE

### Approach: "Portal Shell + Isolated Project Modules"

The unified app creates a **top-level portal/launcher** that wraps all 5 projects. Each project lives in its own **iframe** or **route** and runs completely unmodified. The portal provides:

1. **Home Page** — A branded landing page with 5 project cards/tiles
2. **Navigation** — Switch between projects seamlessly
3. **Session continuity** — Each project maintains its own state (localStorage, IndexedDB, etc.)
4. **Zero code modification** — Every project's files remain untouched

### Technical Strategy

```
excelias-unified/
├── index.html                    ← Portal home page (NEW)
├── portal.js                     ← Portal logic (NEW)
├── portal.css                    ← Portal styles (NEW)
├── manifest.json                 ← PWA manifest (NEW)
├── activities/                   ← Project 1 files (COPIED AS-IS)
│   ├── index.html
│   └── app.jsx
├── content/                      ← Project 2 files (BUILT, COPIED AS-IS)
│   └── (CRA build output)
├── reports/                      ← Project 3 files (COPIED AS-IS)
│   ├── index.html
│   ├── index_backup.html
│   └── index_v2_backup.html
├── avaria/                       ← Project 4 (runs as separate Next.js server)
│   └── (entire avaria/ folder)
└── website/                      ← Project 5 files (COPIED AS-IS)
    ├── index.html
    ├── app.js
    ├── styles.css
    ├── sw.js
    ├── search.worker.js
    ├── data.json
    ├── cairo.json, gouna.json, north_coast.json, sokhna.json, others.json
    ├── icons/
    └── scraper/
```

### Integration Method Per Project

| # | Project | Method | Why |
|---|---------|--------|-----|
| 1 | Activities (Red Academy) | **iframe** pointing to `activities/index.html` | CDN-based, no build, runs from any path |
| 2 | Content (Red Materials) | **iframe** pointing to `content/index.html` | CRA build output is static HTML, works from any path |
| 3 | Reports (Report Generator) | **iframe** pointing to `reports/index.html` | Single HTML file, fully self-contained |
| 4 | Avaria (LMS) | **iframe** pointing to `http://localhost:3005` OR **reverse proxy** | Full Next.js server app with API routes + database, MUST run as its own server |
| 5 | Website (Property Explorer) | **iframe** pointing to `website/index.html` OR `http://localhost:PORT` | Can run static (no server features) or with Express server for OSRM proxy + search API |

### Home Page Design Requirements

The portal home page should:
- Match the premium dark aesthetic shared across all projects (deep dark backgrounds, glassmorphism, gradient accents)
- Show 5 project cards arranged in a visually stunning grid
- Each card shows: project icon/logo, project name, brief description, "Launch" button
- Smooth entrance animations (GSAP or CSS)
- Full-screen immersive feel
- Responsive (works on mobile + desktop)
- The RED Training Academy branding/logo should be prominent

### The 5 Project Cards

| # | Card Title | Subtitle | Icon/Emoji | Color Accent |
|---|-----------|----------|------------|-------------|
| 1 | Training Academy | Interactive Learning Activities | 🎮 | Red/Crimson (#b33420) |
| 2 | Training Manual | Red Materials Mastery Guide | 📚 | Deep Red/Gold (#b33420, #c69354) |
| 3 | Report Generator | Trainee Performance Reports | 📊 | Red/Professional (#b33420) |
| 4 | Academy Operations | LMS & Analytics Dashboard | 🏛️ | Cyan/Emerald (#06b6d4) |
| 5 | Property Explorer | Real Estate Map & Intelligence | 🗺️ | Purple/Pink (#667eea, #f093fb) |

---

## WHAT MUST NOT CHANGE

### Absolute Rules — Zero Tolerance

1. **NOT A SINGLE LINE of code may be removed, modified, or overwritten** in any of the 5 projects
2. Every project must run EXACTLY as it does today — same features, same behavior, same data, same styling
3. The portal is ADDITIVE ONLY — it adds a home page and navigation wrapper, nothing else
4. Each project's localStorage keys, IndexedDB databases, Service Worker scopes, CSS variables, and global variables must remain isolated and functional
5. All external CDN/API dependencies must continue to load correctly
6. The Avaria project's database (dev.db), auth system, and API routes must work unchanged
7. The Website project's Service Worker, Web Worker, and TileCache must work unchanged
8. The Activities project's in-browser Babel transpilation must work unchanged
9. The Content project's Three.js 3D scene, Lenis scroll, and framer-motion animations must work unchanged
10. The Report Generator's Tesseract.js OCR, html2canvas, and jsPDF must work unchanged

### Isolation Requirements

- Each iframe gets its own JavaScript execution context (no global variable conflicts)
- CSS from one project must not leak into another
- localStorage keys are partitioned by origin (same-origin iframes share localStorage — if this causes conflicts, use distinct paths or subdomain strategy)
- Service Workers must be scoped to their respective project paths
- Each project's `<head>` CDN loads are independent

---

## IMPLEMENTATION PHASES

### Phase 1: Portal Shell (Current Task)
- Create the unified `index.html` portal with 5 project tiles
- Set up the folder structure with all project files in their respective directories
- Test that each project loads correctly via iframe
- Handle navigation (clicking a tile → shows that project full-screen, with a back-to-home button)

### Phase 2: Unified Design (Future)
- After all 5 are working in the portal, gradually unify the visual design
- Apply consistent branding, typography, and color system across all projects
- This will be done one project at a time, carefully, without breaking functionality

### Phase 3: Deep Integration (Future)
- Cross-project data sharing (e.g., Avaria LMS trainee data feeding into Report Generator)
- Shared authentication (Avaria auth extending to other projects)
- Unified search across all projects
- Shared notifications system

---

## TECHNICAL NOTES FOR IMPLEMENTATION

### Handling Project 4 (Avaria — Next.js)
This is the most complex integration because it's a full-stack Next.js app with:
- Server-side rendering
- API routes that query SQLite via Prisma
- JWT authentication with httpOnly cookies
- Middleware that intercepts all requests

**Options:**
1. **Separate server approach:** Run `next dev` on port 3005, iframe to `http://localhost:3005`
2. **Build and export:** If all pages can be statically exported, use `next export` (unlikely given API routes and database)
3. **Reverse proxy:** The portal's server proxies requests to the Next.js server

**Recommended:** Option 1 — Run Avaria as its own Next.js server, portal iframes to it.

### Handling Project 5 (Website — Express Server)
The website has both static and server-dependent features:
- **Static mode:** Map, search, themes, favorites, PDF — all work without server
- **Server-dependent:** OSRM route proxy, project query API, search suggestions

**Recommended:** Run `server.ultra.js` on its own port, iframe to it. This gives full functionality.

### Service Worker Scoping
The Website project registers `sw.js`. In an iframe context, the Service Worker scope is relative to the iframe's origin. If all projects are served from the same origin but different paths:
- SW scope for website: `/website/`
- Ensure `sw.js` registration in the website's `index.html` uses a relative path

### localStorage Partitioning
All projects on the same origin share localStorage. Current key patterns:
- Activities: `APP_STORAGE_*` prefix
- Content: No localStorage (state is ephemeral)
- Reports: `red_cfg`
- Avaria: `avaria-academy-*` prefix
- Website: Various keys (theme, lang, favorites, alerts, etc.)

**No conflicts expected** as each project uses distinct key prefixes. But verify after integration.

---

## FILE-BY-FILE INVENTORY PER PROJECT

### Project 1: Activities (2 files)
```
RedMaterialsAcademy/index.html     — Entry point, CDN scripts, CSS animations, root div
RedMaterialsAcademy/app.jsx        — Entire app (~10,451 lines): all components, data, styles, logic
```

### Project 2: Content (16 source files + build output)
```
red-materials-app/package.json              — Dependencies
red-materials-app/public/index.html         — HTML shell (Tailwind CDN, fonts, dark theme)
red-materials-app/src/index.js              — React entry point
red-materials-app/src/App.js                — Main app component (232 lines)
red-materials-app/src/components/Navigation.js        — ProgressBar, TopNavigation, ChapterMapDrawer
red-materials-app/src/components/QuickReferenceDrawer.js — Briefing notes drawer
red-materials-app/src/components/SourceDeckDrawer.js    — Transcript archive drawer
red-materials-app/src/components/ui.js                  — 9 UI primitives
red-materials-app/src/components/UltraCanvas.js         — Three.js 3D background
red-materials-app/src/components/useDialogAccessibility.js — Focus trap hook
red-materials-app/src/data/content.js                   — All data (651 lines, 18 exports)
red-materials-app/src/sections/HeroSection.js           — Chapter 00
red-materials-app/src/sections/InventorySection.js      — Chapter 01
red-materials-app/src/sections/MarketSection.js         — Chapter 02
red-materials-app/src/sections/RequestSection.js        — Chapter 03
red-materials-app/src/sections/PsychologySection.js     — Chapter 04
red-materials-app/src/sections/ArsenalSection.js        — Chapter 05
red-materials-app/src/sections/CallsSection.js          — Chapter 06
red-materials-app/src/sections/MasterySection.js        — Chapter 07
red-materials-app/src/utils/scroll.js                   — Lenis scroll helper
red-materials-app/build/                                — Production build output (static)
```

### Project 3: Reports (4 files)
```
index.html              — Current v3 (OCR-powered, 1745 lines)
index_backup.html       — V1 (static, 691 lines)
index_v2_backup.html    — V2 (AI API, 1725 lines)
README.md               — Documentation
```

### Project 4: Avaria (~80+ files)
```
package.json, next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs, prisma.config.ts, middleware.ts
DESIGN_SYSTEM.md, MEGA_PROMPT.md, README.md
prisma/schema.prisma, dev.db
app/globals.css, layout.tsx, page.tsx, loading.tsx, error.tsx, not-found.tsx
app/login/page.tsx, app/setup/page.tsx
app/trainees/page.tsx, app/trainees/[id]/page.tsx
app/batches/page.tsx, app/batches/[id]/page.tsx
app/attendance/daily/page.tsx, app/attendance/10-day/page.tsx
app/assessments/page.tsx
app/analytics/page.tsx
app/companies/page.tsx, app/companies/[name]/page.tsx
app/settings/page.tsx
app/api/ (23 route files across auth/, trainees/, batches/, attendance/, assessments/, companies/, plus dashboard, analytics, search, export, ingest, health)
components/ClientOnly.tsx, ErrorBoundary.tsx
components/layout/index.tsx
components/ui/index.tsx, Modal.tsx, Toast.tsx
components/search/CommandPalette.tsx
components/customization/CustomizationPanel.tsx
components/visuals/ThreeBackdrop.tsx, GlobalFx.tsx, RouteFx.tsx, VisualModeSync.tsx
hooks/index.ts, useAuth.tsx, useHydrated.ts
lib/auth.ts, db.ts, utils.ts, validations.ts, batchRules.ts, utils/calculations.ts, notionData.json
stores/index.ts
types/index.ts
scripts/parseNotionData.ts, seed-db.ts
datanew/ (CSV exports), datacv/ (CSV exports)
avaria-academy-lms/ (legacy Express backend — preserved but not actively used)
```

### Project 5: Website (~20+ files)
```
index.html, app.js, styles.css, sw.js, search.worker.js, server.ultra.js
manifest.json, vercel.json, package.json, README.md, .env, .gitignore
split_data.js
data.json, cairo.json, gouna.json, north_coast.json, sokhna.json, others.json
icons/icon.svg
scraper/merge_data.js, merge_data.py, payment_plans_scraper.js, price_database.json, scraper.py
```

---

## CROSS-PROJECT CONNECTIONS (For Future Integration)

These are the natural data/conceptual bridges between projects that can be leveraged in Phase 3:

1. **Avaria (LMS) ↔ Report Generator:** Both deal with trainee assessments with the EXACT same score formula (PK, Mapping, SS, Presentability → techScore%, softScore%, overall%) and the EXACT same tier system (Aced/Excellent/Good/Passed/Failed). The Report Generator could pull data directly from Avaria's database.

2. **Avaria (LMS) ↔ Activities (Academy):** Both are training systems. Avaria tracks attendance and assessments; the Academy tracks activity performance and mastery. A trainee's Academy progress could feed into their Avaria profile.

3. **Content (Training Manual) ↔ Activities (Academy):** The manual is the theoretical content; the activities are the practical exercises. They cover the same 7 chapters/topics. Activities could link back to relevant manual sections.

4. **Website (Property Explorer) ↔ Content (Manual):** Both deal with real estate knowledge. The manual teaches property types, market models, and qualification — the website is where that knowledge is applied with real data.

5. **Report Generator ↔ Activities (Academy):** Activity completion / mastery scores could auto-populate into report assessments.

6. **All Projects:** Share the RED Training Academy branding, real estate domain, and Egyptian market focus.

---

## SUMMARY

This prompt documents **every single file, component, function, variable, style, data structure, API endpoint, database model, external dependency, and architectural decision** across all 5 projects in the Excelias V2 workspace. The unified app must wrap all of them into a single portal without modifying, removing, or breaking any existing code. The portal is purely additive — a new home page and navigation shell that launches each project in isolation.
