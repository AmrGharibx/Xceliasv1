# ═══════════════════════════════════════════════════════════════════════════════
# ██████╗ ██╗  ██╗ ██████╗ ███████╗███╗   ██╗██╗██╗  ██╗    ██████╗ ██████╗  ██████╗ ███╗   ███╗██████╗ ████████╗
# ██╔══██╗██║  ██║██╔═══██╗██╔════╝████╗  ██║██║╚██╗██╔╝    ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔══██╗╚══██╔══╝
# ██████╔╝███████║██║   ██║█████╗  ██╔██╗ ██║██║ ╚███╔╝     ██████╔╝██████╔╝██║   ██║██╔████╔██║██████╔╝   ██║
# ██╔═══╝ ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║██║ ██╔██╗     ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔═══╝    ██║
# ██║     ██║  ██║╚██████╔╝███████╗██║ ╚████║██║██╔╝ ██╗    ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║██║        ██║
# ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝        ╚═╝
# ═══════════════════════════════════════════════════════════════════════════════
#
#   PHOENIX PROMPT — THE ULTIMATE 1000-LINE DESIGN REVOLUTION PROTOCOL
#   Version: 4.0 | Classification: MAXIMUM FIDELITY | Tokens: UNLIMITED
#   Target: Avaria Academy LMS | Stack: Next.js 16 + React 19 + Three.js + GSAP
#
# ═══════════════════════════════════════════════════════════════════════════════

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 0 — PRIME DIRECTIVE & EXECUTION PROTOCOL                       ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

You are an elite design systems engineer, creative director, and full-stack
visual architect. You are about to perform a TOTAL DESIGN REVOLUTION on the
Avaria Academy LMS application. This is not a color swap. This is not a theme
change. This is a ground-up visual rebirth that must make anyone who sees the
application believe they are looking at a $50M enterprise product designed by
a team of 40 world-class designers from studios like Pentagram, Fantasy, and
Instrument.

### EXECUTION RULES:
1. **DELETE AND REPLACE** — Do not patch. Do not append. Delete every old
   design file and recreate from scratch. Every `globals.css`, every
   `ThreeBackdrop.tsx`, every `layout/index.tsx`, every `ui/index.tsx`,
   every page file. If it has visual code, it dies and is reborn.

2. **NO MERCY ON PREVIOUS DESIGNS** — The current "AURORA BOREALIS" design
   system with warm charcoal (#0c0a09) backgrounds, emerald (#10b981) accents,
   and magenta (#ec4899) secondary colors is DEAD. Do not reference it. Do not
   carry forward any of its tokens, variables, or patterns. The previous NOVA
   and OBSIDIAN designs are also dead. Start from absolute zero.

3. **ZERO BUILD ERRORS** — After every phase, the project MUST compile with
   `npx next build` producing 0 errors across all 39 routes. Do not leave
   broken imports, missing types, or syntax errors.

4. **PRESERVE ALL FUNCTIONALITY** — Every API route, every data flow, every
   auth mechanism, every CRUD operation must continue working. You are
   changing the SKIN, not the SKELETON.

5. **FULL FILE COVERAGE** — You must transform EVERY file listed below.
   No file can be skipped. No file can retain old design tokens.

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 1 — COMPLETE FILE MANIFEST (MUST TRANSFORM ALL)                ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### TIER 1 — DESIGN DNA (transform first, everything depends on these)
```
app/globals.css                              — 480+ lines, ALL CSS variables, classes, keyframes
components/visuals/ThreeBackdrop.tsx          — 271 lines, entire 3D scene
components/visuals/GlobalFx.tsx              — 60 lines, GSAP pulse + backdrop wrapper
components/visuals/RouteFx.tsx               — 50 lines, route transition bar
```

### TIER 2 — STRUCTURAL SHELL (layout + core components)
```
components/layout/index.tsx                  — 310 lines, Sidebar + Header
components/ui/index.tsx                      — 671 lines, 18 components (StatsCard, Button, Input, etc.)
components/ui/Modal.tsx                      — 260 lines, Modal + FormField + ConfirmDialog
components/ui/Toast.tsx                      — 100 lines, ToastProvider + useToast
components/search/CommandPalette.tsx          — 210 lines, Cmd+K search overlay
components/customization/CustomizationPanel.tsx — 170 lines, settings panel
components/ClientOnly.tsx                    — 35 lines, loading screen
components/ErrorBoundary.tsx                 — 50 lines, error fallback
```

### TIER 3 — ALL PAGES (every single page must be transformed)
```
app/layout.tsx                               — Root layout, metadata, fonts, providers
app/page.tsx                                 — Dashboard "Command Center" (478 lines)
app/login/page.tsx                           — Authentication page
app/setup/page.tsx                           — First-time admin setup
app/error.tsx                                — Error boundary page
app/loading.tsx                              — Global loading state
app/not-found.tsx                            — 404 page
app/trainees/page.tsx                        — Trainees list with filters, table, modals
app/trainees/[id]/page.tsx                   — Trainee detail profile
app/batches/page.tsx                         — Batches grid with filters
app/batches/[id]/page.tsx                    — Batch detail + roster
app/attendance/daily/page.tsx                — Daily attendance log
app/attendance/10-day/page.tsx               — 10-day attendance summary
app/assessments/page.tsx                     — Assessments table
app/companies/page.tsx                       — Companies overview
app/companies/[name]/page.tsx                — Company detail page
app/analytics/page.tsx                       — Analytics dashboard with 6 chart types
app/settings/page.tsx                        — User settings + preferences
```

### TIER 4 — SUPPORT FILES
```
stores/index.ts                              — Zustand stores (theme colors, visual mode)
app/icon.svg                                 — Favicon/app icon
components/visuals/VisualModeSync.tsx         — data attribute sync
DESIGN_SYSTEM.md                             — Documentation (rewrite completely)
```

### DO NOT MODIFY (backend must remain untouched):
```
app/api/**/*                                 — All 23 API routes
lib/auth.ts, lib/db.ts, lib/validations.ts   — Backend logic
lib/batchRules.ts, lib/utils/calculations.ts — Business logic
prisma/schema.prisma                         — Database schema
scripts/*                                    — Data pipeline
types/index.ts                               — Type definitions
hooks/*                                      — Auth hooks (only visual hooks may change)
middleware.ts                                 — Auth middleware
```

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 2 — NEW DESIGN SYSTEM SPECIFICATION                            ║
## ║  Choose ONE of the following revolutionary design concepts.              ║
## ║  Each is researched from the absolute cutting edge of 2025-2026 design. ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### OPTION A — "VOID CRYSTAL" (Recommended)
**Inspiration**: Linear.app meets Raycast meets Vercel's design language.
**Philosophy**: Absolute darkness with surgical light. Think black hole with
crystalline data structures floating at its event horizon.

**Depth Palette (7 layers, near-pure black with warm brown micro-tint)**:
```
--void:     #050505    /* True void — page background */
--depth-1:  #0a0a0b    /* Card surface */
--depth-2:  #0f0f11    /* Raised surface */
--depth-3:  #141416    /* Hover states */
--depth-4:  #1a1a1d    /* Active states */
--depth-5:  #222225    /* Elevated panels */
--depth-6:  #2a2a2e    /* Maximum elevation */
```

**Accent System (tri-chromatic with purpose)**:
```
--accent-primary:     #a78bfa    /* Violet 400 — primary actions, links, active states */
--accent-secondary:   #818cf8    /* Indigo 400 — secondary elements, charts */
--accent-tertiary:    #c084fc    /* Purple 400 — highlights, decorative */
--accent-success:     #34d399    /* Emerald 400 — positive states */
--accent-warning:     #fbbf24    /* Amber 400 — warnings */
--accent-danger:      #fb7185    /* Rose 400 — destructive, errors */
--accent-info:        #38bdf8    /* Sky 400 — informational */
```

**Text Hierarchy (6 precise levels)**:
```
--text-100:  #f5f5f7    /* Primary headings, values — near-white with micro blue tint */
--text-90:   #d1d1d6    /* Secondary text, labels */
--text-70:   #a1a1a9    /* Tertiary, descriptions */
--text-50:   #71717a    /* Muted, timestamps */
--text-30:   #52525b    /* Disabled, placeholders */
--text-10:   #3f3f46    /* Ghost text, divider labels */
```

**Border System**:
```
--border-subtle:   rgba(255,255,255,0.04)   /* Default borders */
--border-default:  rgba(255,255,255,0.06)   /* Input borders */
--border-strong:   rgba(255,255,255,0.10)   /* Hover borders */
--border-accent:   rgba(167,139,250,0.20)   /* Focus/active borders */
--border-glow:     rgba(167,139,250,0.40)   /* Glowing focus rings */
```

### OPTION B — "OBSIDIAN PRISM"
**Inspiration**: Apple Vision Pro spatial UI meets Figma's dark mode meets Arc browser.
**Philosophy**: Layered glass planes floating in deep space with prismatic light refractions.

### OPTION C — "CARBON FIBER"
**Inspiration**: Porsche Design System meets Bloomberg Terminal meets F1 telemetry dashboards.
**Philosophy**: Industrial precision, zero decoration, pure information density.

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 3 — TYPOGRAPHY REVOLUTION                                      ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### Current State (to be REPLACED):
- Inter → `--font-geist-sans` (misleading variable name)
- Poppins → `--font-poppins` (imported but barely used)
- JetBrains Mono → `--font-geist-mono`

### New Font Stack:
Replace ALL three fonts. Choose from these researched pairings:

**PAIRING 1** (recommended for "Void Crystal"):
```
Display/Headlines: "Plus Jakarta Sans" — geometric, modern, excellent weight range
Body/UI: "Inter" — keep for readability but RENAME variable to --font-ui
Mono/Code: "JetBrains Mono" — keep for data tables, code snippets
Accent/Numbers: "Tabular Lining" figures from Jakarta Sans for dashboard stats
```

**PAIRING 2** (recommended for "Obsidian Prism"):
```
Display: "Satoshi" (custom @font-face from fontshare.com)
Body: "General Sans"
Mono: "Fira Code" with ligatures
```

**PAIRING 3** (recommended for "Carbon Fiber"):
```
Display: "Space Grotesk"
Body: "DM Sans"
Mono: "IBM Plex Mono"
```

### Typography Scale (must implement):
```css
--text-display:  2.5rem/1.1    /* Page titles, hero numbers */
--text-title:    1.75rem/1.2   /* Section headers */
--text-heading:  1.25rem/1.3   /* Card titles */
--text-subhead:  1rem/1.4      /* Subsection headers */
--text-body:     0.875rem/1.5  /* Default body text (14px) */
--text-caption:  0.8125rem/1.5 /* Captions, labels (13px) */
--text-micro:    0.6875rem/1.4 /* Timestamps, badges (11px) */
--text-nano:     0.625rem/1.4  /* Minor labels (10px) */
```

### Letter-spacing System:
```css
--tracking-tightest: -0.04em   /* Display text */
--tracking-tight:    -0.02em   /* Headings */
--tracking-normal:    0em      /* Body */
--tracking-wide:      0.02em  /* Labels */
--tracking-wider:     0.06em  /* Uppercase labels */
--tracking-widest:    0.12em  /* Micro tags */
```

### Font Weight Rules:
- Display numbers: 800 (extrabold)
- Page titles: 700 (bold)
- Card titles: 600 (semibold)
- Body text: 400 (regular)
- Labels: 500 (medium)
- Uppercase micro: 600 + tracking-wider

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 4 — THREE.JS 3D ENVIRONMENT (COMPLETE REWRITE)                 ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### Current State (to be DELETED):
- AuroraParticles (800 points in torus, 5-color palette)
- EmeraldOrb (dodecahedron, metalness 0.9)
- 2-3 OrbitalRings (torus geometry)
- Sparkles (drei)
- ParallaxRig (mouse-responsive camera)
- 2 directional + 2 point lights

### NEW 3D SCENE REQUIREMENTS:

**Architecture — "Void Crystal" scene must contain:**

1. **Crystal Lattice Network** — NOT particles, NOT orbs. A procedural
   wireframe lattice structure made of interconnected nodes and edges.
   Think: molecular structure visualization or constellation map.
   - 80-150 nodes (icosphere positions) connected by thin luminous lines
   - Lines should pulse with traveling light (shader-based, not JS animation)
   - Nodes should be tiny glowing spheres (radius 0.02-0.04)
   - The entire structure slowly rotates and breathes (scale oscillation)
   - Use `THREE.BufferGeometry` + custom `THREE.LineSegments` for performance
   - Colors: violet (#a78bfa) lines, indigo (#818cf8) nodes, with 10% random
     purple (#c084fc) nodes

2. **Volumetric Light Rays** — 3-4 soft volumetric cones of light
   - Use `drei`'s `<Spotlight>` with volumetric prop OR custom shader
   - Slowly sweep across the scene (GSAP-driven rotation)
   - Colors: desaturated violet, cool white, faint blue
   - Opacity: 0.03-0.06 for subtlety

3. **Floating Data Planes** — 2-3 semi-transparent rectangular planes
   - Use `<Plane>` geometry with `MeshPhysicalMaterial`
   - `transmission: 0.9, roughness: 0.1, metalness: 0.0, ior: 1.5`
   - Slight rotation animation (0.001 rad/frame), different axes
   - Subtle refraction of the light behind them
   - These represent "data windows" — purely decorative but suggestive

4. **Ambient Particle Dust** — Very fine background dust
   - 200-400 tiny points (size 0.005-0.01)
   - NO color — pure desaturated white at 15% opacity
   - Brownian motion (random drift, no orbital flow)
   - Depth-of-field blur via `drei`'s `<EffectComposer>` + `<DepthOfField>`

5. **Post-Processing Pipeline** (CINEMATIC MODE ONLY):
   - `@react-three/postprocessing` — add as dependency if not present
   - `<EffectComposer>`:
     - `<Bloom luminanceThreshold={0.6} intensity={0.4} radius={0.8} />`
     - `<ChromaticAberration offset={[0.0005, 0.0005]} />`
     - `<Vignette eskil={false} offset={0.1} darkness={0.5} />`
   - Performance mode: NO post-processing, reduce all counts by 60%

6. **Camera System**:
   - FOV: 35 (tighter than current 42 for more cinematic feel)
   - Position: [0, 0, 6] (slightly further back)
   - Mouse parallax: Maintain but reduce amplitude to 0.08x, 0.05y
   - Add subtle auto-orbit: 0.0003 rad/frame around Y axis
   - Smooth camera transitions on visual mode switch (GSAP lerp)

7. **Lighting Rig**:
   - 1 `ambientLight` intensity 0.15 (dimmer than current)
   - 1 `directionalLight` from top-right: color violet #a78bfa, intensity 0.6
   - 1 `directionalLight` from bottom-left: color indigo #818cf8, intensity 0.3
   - 1 `pointLight` at center: color white #f5f5f7, intensity 0.2, distance 8
   - 1 `rectAreaLight` (drei) behind the crystal lattice: color purple, 4x2, intensity 0.4
   - NO green, NO pink, NO amber lights

8. **Gradient Underlays** (HTML divs behind the Canvas):
   - Top: `radial-gradient(ellipse_at_top, rgba(167,139,250,0.06), transparent 55%)`
   - Bottom-left: `radial-gradient(circle_at_20%_80%, rgba(129,140,248,0.04), transparent 50%)`
   - Center: `radial-gradient(circle, rgba(192,132,252,0.03), transparent 40%)`
   - Noise grain: Keep SVG feTurbulence but reduce to 2% opacity

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 5 — GSAP ANIMATION SYSTEM (COMPLETE OVERHAUL)                  ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### Current GSAP Usage (to be REPLACED):
- GlobalFx: Simple `--fxPulse` 0→1 yoyo tween driving filter
- RouteFx: scaleX bar animation on route change

### NEW GSAP ARCHITECTURE:

1. **ScrollTrigger Integration** — Install `gsap/ScrollTrigger`
   - Every card, stat, chart section should animate in on scroll
   - Stagger: 0.08s between siblings
   - `trigger: element, start: "top 85%", toggleActions: "play none none none"`
   - Animation: `{ opacity: 0, y: 40, scale: 0.96 } → { opacity: 1, y: 0, scale: 1 }`
   - Duration: 0.7s, ease: `"power3.out"`
   - Use the `.gsap-reveal` class system from globals.css

2. **Magnetic Cursor Effect** — On ALL interactive elements
   - On mousemove within 80px radius: element translates toward cursor
   - `gsap.to(el, { x: deltaX * 0.15, y: deltaY * 0.15, duration: 0.4, ease: "power2.out" })`
   - On mouseleave: `gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" })`
   - Apply to: Buttons, cards, nav items, stat counters

3. **Text Reveal Animations** — For page titles and headings
   - Split text into individual characters using GSAP SplitText (or manual split)
   - Stagger each character: `{ opacity: 0, y: 20, rotateX: -80 } → visible`
   - Duration: 0.04s per character, ease: `"power4.out"`
   - Only trigger on initial page load, not on re-renders

4. **Number Counter Animations** — For ALL dashboard statistics
   - Replace `react-countup` with GSAP-driven counters
   - `gsap.to(el, { innerText: targetValue, duration: 2, snap: { innerText: 1 }, ease: "power2.out" })`
   - Add a subtle scale pulse at completion: `{ scale: 1.05, duration: 0.15 } → { scale: 1 }`

5. **Route Transition System** — Replace current simple bar
   - Phase 1: Full-width overlay slides in from left with gradient
   - Phase 2: Content fades out, overlay holds for 200ms
   - Phase 3: Overlay slides out to right, new content fades in
   - Gradient: `linear-gradient(90deg, transparent, rgba(167,139,250,0.08), transparent)`
   - Total duration: 0.5s, coordinated via GSAP timeline

6. **Ambient Pulse System** — Replace current `--fxPulse`
   - Dual-frequency pulse: fast (3s) for subtle breathing, slow (12s) for mood shifts
   - Drive CSS variables: `--pulse-fast` and `--pulse-slow`
   - Fast: modulates `filter: brightness()` by ±2%
   - Slow: modulates background gradient opacity by ±15%
   - Cinematic mode: amplify both by 2x

7. **Hover Micro-interactions** — On every card and button
   - Card hover: `{ y: -4, boxShadow: "0 20px 60px -12px rgba(167,139,250,0.15)" }`
   - Button hover: `{ scale: 1.02, boxShadow spread }` (already exists, enhance)
   - Stat icon: `{ rotate: 5, scale: 1.08 }` on parent card hover
   - Table row hover: `{ x: 2, backgroundColor: rgba(255,255,255,0.02) }`

8. **Loading Choreography** — For initial page load
   - Sidebar slides in from left (0.4s delay)
   - Header fades down from top (0.3s delay)
   - Stats cascade in from bottom (stagger 0.1s)
   - Charts fade in with scale (0.6s delay)
   - Total orchestration: 1.2s, feels like the app is "booting up"

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 6 — FRAMER MOTION ENHANCEMENT PROTOCOL                         ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### Current Usage (enhance, don't remove):
- Basic opacity/y entry animations
- whileHover scale/y transforms
- AnimatePresence for modals/overlays
- layoutId for sidebar active indicator

### NEW PATTERNS TO IMPLEMENT:

1. **Layout Animations** — Use `layout` prop on ALL cards in grid views
   - When filters change, cards should smoothly reflow with layout animation
   - `layout transition={{ type: "spring", stiffness: 300, damping: 30 }}`
   - Apply to: Batch cards, trainee cards, assessment rows

2. **Shared Layout Transitions** — Between list and detail views
   - When clicking a batch/trainee card, the card should expand into the detail page
   - Use `layoutId={`card-${id}`}` on the card and the detail page header
   - This creates the illusion of the card "opening up"

3. **Stagger Children** — Use `variants` for coordinated entry
   ```tsx
   const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
   const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
   ```
   Apply to: all grid/list views

4. **Spring Physics** — Replace all linear/ease transitions with springs
   - Cards: `type: "spring", stiffness: 260, damping: 25`
   - Modals: `type: "spring", stiffness: 400, damping: 30, mass: 0.8`
   - Sidebar: `type: "spring", stiffness: 300, damping: 35`
   - Always define responsive springs, never use `duration` alone

5. **Exit Animations** — Every element that can disappear must animate out
   - Cards being filtered: `exit={{ opacity: 0, scale: 0.95, y: 10 }}`
   - Modal: `exit={{ opacity: 0, scale: 0.96, y: 8 }}`
   - Toast: `exit={{ opacity: 0, x: 80, filter: "blur(4px)" }}`
   - Sidebar items: `exit={{ opacity: 0, x: -16 }}`

6. **Gesture Interactions**:
   - Cards: `whileTap={{ scale: 0.98 }}` for press feedback
   - Drag-to-dismiss on mobile for modals: `drag="y" dragConstraints={{ top: 0 }}`
   - Long-press tooltip reveal on mobile (use `onTapStart` + timeout)

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 7 — COMPONENT DESIGN SPECIFICATIONS                            ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### SIDEBAR — Complete Redesign
```
Width: 240px expanded / 64px collapsed (reduce from 260/72)
Background: --depth-1 solid (no gradient)
Border-right: 1px solid var(--border-subtle)
Logo area: 56px height
  - Icon: Geometric crystal shape (CSS-only, no image)
  - Text: "Avaria" in --text-90, "Academy" in --text-30
Nav items:
  - Height: 36px (compact)
  - Text: --text-50 default, --text-100 on hover, --text-100 on active
  - Icon: 16px, --text-30 default, accent color on active
  - Active indicator: 2px left bar, accent color, with glow
  - Active background: rgba(accent, 0.06)
  - Hover background: rgba(255,255,255,0.02)
  - Border-radius: 8px
  - Transition: background 150ms, color 150ms
User card at bottom:
  - Avatar: 32px, gradient from --accent-primary to --accent-tertiary
  - Name: --text-90, 13px, medium
  - Role: --text-30, 11px
  - Background: --depth-2
  - Border: var(--border-subtle)
Collapse animation:
  - Use Framer Motion `animate={{ width }}` with spring
  - Text should fade out at 180px threshold, not slide
  - Icons should center-align when collapsed
```

### HEADER — Complete Redesign
```
Height: 52px (reduce from 56px for tighter feel)
Background: rgba(--depth-1, 0.8) with backdrop-blur-xl
Border-bottom: 1px solid var(--border-subtle)
Position: sticky top-0 z-30
Search bar:
  - Width: 240px (expand to 320px on focus, animated)
  - Background: var(--depth-2)
  - Border: var(--border-default), accent on focus
  - Placeholder: "Search or press ⌘K..." in --text-30
  - Icon: 14px, --text-30
  - Kbd badge: --depth-3 bg, --text-30 text, 10px font
Right actions:
  - Icon buttons: 32px, --text-30, hover --text-70, 6px border-radius
  - Cinematic toggle: glow ring when active (box-shadow accent)
  - Notification dot: 6px, accent-primary (not emerald)
  - Separator: 1px, --border-subtle, 16px height
```

### STATS CARDS — Complete Redesign
```
Border-radius: 12px
Background: var(--depth-1)
Border: 1px solid var(--border-subtle)
Padding: 20px
Hover: border-color → var(--border-strong), y: -2px, shadow
Structure:
  - Top row: Icon (left, 36px container) + Trend badge (right)
  - Middle: Value (--text-display size, font-weight 800, --text-100)
  - Bottom: Label (11px, uppercase, tracking-wider, --text-30)
Icon container:
  - 36px rounded-lg
  - Background: color-specific at 6% opacity
  - Icon: 18px, color-specific
Hover effect:
  - Accent-colored line appears at bottom (2px, animated width 0→100%)
  - Icon rotates 5° and scales 1.08
  - Subtle glow behind icon increases
```

### CARDS (Generic) — Design Language
```
Background: var(--depth-1)
Border: 1px solid var(--border-subtle)
Border-radius: 12px
Padding: 24px
Shadow: none by default
Hover: {
  border-color: var(--border-strong),
  transform: translateY(-2px),
  box-shadow: 0 16px 48px -12px rgba(0,0,0,0.4)
}
Header: 16px font, semibold, --text-100
Subtitle: 12px, --text-50
Divider: 1px --border-subtle, margin-y 16px
```

### BUTTONS — Design Language
```
Primary:
  background: var(--accent-primary)
  color: white
  font-weight: 500
  border-radius: 8px
  height: 36px (md), 32px (sm), 40px (lg)
  shadow: 0 0 0 1px rgba(accent,0.3), 0 1px 2px rgba(0,0,0,0.2)
  hover: brightness(1.1), shadow intensifies
  active: brightness(0.95), scale(0.98)

Secondary:
  background: var(--depth-2)
  color: var(--text-90)
  border: 1px solid var(--border-default)
  hover: border-color var(--border-strong), bg var(--depth-3)

Ghost:
  background: transparent
  color: var(--text-50)
  hover: bg rgba(255,255,255,0.04), color var(--text-90)

Danger:
  background: rgba(danger, 0.08)
  color: var(--accent-danger)
  border: 1px solid rgba(danger, 0.15)
  hover: bg rgba(danger, 0.15)
```

### INPUTS — Design Language
```
Height: 36px
Background: var(--depth-2)
Border: 1px solid var(--border-default)
Border-radius: 8px
Text: --text-100, 13px
Placeholder: --text-30
Padding: 0 12px
Focus: {
  border-color: var(--accent-primary),
  box-shadow: 0 0 0 3px var(--border-glow),
  outline: none
}
Label: 11px, uppercase, tracking-wider, --text-30, font-weight 500
Error: border-color danger, shadow danger glow
```

### TABLES — Design Language
```
Header row:
  background: var(--depth-2)
  text: 11px, uppercase, tracking-wider, --text-30
  padding: 12px 16px
  border-bottom: 1px solid var(--border-default)
Body rows:
  background: transparent
  text: 13px, --text-90
  padding: 12px 16px
  border-bottom: 1px solid var(--border-subtle)
  hover: background rgba(255,255,255,0.02)
  transition: background 150ms
Zebra: NO (breaks the clean void aesthetic)
Selected row: background rgba(accent, 0.04), left border 2px accent
```

### BADGES — Design Language
```
Height: 20px
Padding: 0 8px
Border-radius: 6px
Font: 11px, font-weight 600
Variants:
  success: bg emerald/8, text emerald-400, border emerald/15
  warning: bg amber/8, text amber-400, border amber/15
  error: bg rose/8, text rose-400, border rose/15
  info: bg sky/8, text sky-400, border sky/15
  neutral: bg depth-3, text text-50, border border-default
  accent: bg accent/8, text accent-primary, border accent/15
```

### MODALS — Design Language
```
Backdrop: rgba(0,0,0,0.75) with backdrop-blur-sm
Panel:
  background: var(--depth-1)
  border: 1px solid var(--border-default)
  border-radius: 16px
  max-width: 480px (sm), 640px (md), 800px (lg)
  shadow: 0 32px 96px -16px rgba(0,0,0,0.6)
  padding: 24px
Entry animation: spring scale(0.95→1) + opacity(0→1) + blur(4px→0)
Exit animation: scale(1→0.98) + opacity(1→0) + y(0→8)
Title: 18px, semibold, --text-100
Close button: top-right, 32px, ghost style, X icon
Divider after title: 1px, --border-subtle
Footer: flex justify-end gap-8px, padding-top 16px
```

### TOOLTIPS — Design Language
```
Background: var(--depth-5)
Border: 1px solid var(--border-default)
Border-radius: 8px
Padding: 6px 10px
Text: 11px, --text-90
Shadow: 0 8px 24px -4px rgba(0,0,0,0.5)
Arrow: Optional, CSS triangle matching bg color
Delay: 300ms show, 100ms hide
Animation: opacity + y(4→0), 150ms
Max-width: 240px
```

### COMMAND PALETTE — Design Language
```
Backdrop: rgba(0,0,0,0.6)
Panel:
  width: 560px
  max-height: 400px
  background: var(--depth-1)
  border: 1px solid var(--border-default)
  border-radius: 12px
  shadow: 0 32px 80px rgba(0,0,0,0.5)
Input:
  Full width, no border, 48px height
  Background: transparent
  Placeholder: "Search trainees, batches, companies..."
  Icon: Search, 18px, --text-30
Results:
  Grouped by type (Trainees, Batches, Companies)
  Group header: 11px, uppercase, --text-30, padding 8px 16px
  Result item: 40px height, hover bg rgba(255,255,255,0.03)
  Icon per type: Users, GraduationCap, Building2
  Name: 13px, --text-100
  Meta: 12px, --text-50
Keyboard hints: ↑↓ navigate, ↵ select, esc close
```

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 8 — CHART & DATA VISUALIZATION SPECIFICATIONS                  ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### Recharts Theming (apply to ALL charts across ALL pages):

**Colors Palette for Charts**:
```
const chartColors = {
  primary:   "#a78bfa",  // Violet — main data series
  secondary: "#818cf8",  // Indigo — comparison series
  tertiary:  "#c084fc",  // Purple — tertiary data
  success:   "#34d399",  // Emerald — positive metrics
  danger:    "#fb7185",  // Rose — negative metrics
  warning:   "#fbbf24",  // Amber — warning metrics
  info:      "#38bdf8",  // Sky — informational
  neutral:   "#71717a",  // Zinc — background/baseline
};
```

**Outcome Colors** (replace current):
```
Aced:              "#a78bfa"   (violet)
Excellent:         "#818cf8"   (indigo)
Very Good:         "#34d399"   (emerald)
Good:              "#38bdf8"   (sky)
Needs Improvement: "#fbbf24"   (amber)
Failed:            "#fb7185"   (rose)
```

**Tooltip Styling** (unified across all charts):
```tsx
contentStyle={{
  background: "#141416",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "12px 16px",
  fontSize: 12,
  color: "#f5f5f7",
  boxShadow: "0 16px 48px -12px rgba(0,0,0,0.6)",
  backdropFilter: "blur(12px)",
}}
labelStyle={{ color: "#f5f5f7", fontWeight: 600, marginBottom: 4 }}
itemStyle={{ color: "#a1a1a9", fontSize: 12 }}
```

**Axis Styling**:
```tsx
tick={{ fill: "#52525b", fontSize: 11 }}
axisLine={false}
tickLine={false}
```

**Grid Styling**:
```tsx
<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
```

**Area Chart Gradients** (use for attendance trends):
```tsx
<linearGradient id="grad-primary" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.20} />
  <stop offset="50%" stopColor="#a78bfa" stopOpacity={0.05} />
  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
</linearGradient>
```

**Pie/Donut Charts**:
- Inner radius: 60% of outer (donut, not pie)
- Padding angle: 3
- Stroke width: 0
- Active sector: +4px outerRadius expansion on hover
- Center label: percentage or total count

**Bar Charts**:
- Border-radius: [4, 4, 0, 0] (top corners rounded)
- Hover: brightness(1.15)
- Gap between bars: 4px minimum
- Horizontal bars for "Top Companies" style charts

**Radar Charts**:
- PolarGrid: stroke rgba(255,255,255,0.06)
- PolarAngleAxis: tick fill #71717a, fontSize 11
- Fill: accent color at 15% opacity
- Stroke: accent color at 80% opacity

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 9 — PAGE-BY-PAGE TRANSFORMATION GUIDE                          ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### PAGE: Dashboard (app/page.tsx) — ~478 lines
**Role**: Primary landing page, "Command Center"
**Must contain**:
1. Page header: "Command Center" title with character-split GSAP reveal
2. Live pulse indicator (keep, update colors)
3. 4 stat cards in responsive grid (sm:2, xl:4)
4. Attendance pulse section with:
   - Today's rate as massive number (--text-display)
   - Animated progress bar (accent gradient)
   - Breakdown grid (Present/Absent/Late/Tour)
5. Live feed sidebar (recent attendance entries, max 5)
6. Area chart: "Attendance Trend" (7-day)
7. Donut chart: "Assessment Outcomes" with legend
8. Horizontal bar chart: "Top Companies"
9. 10-day completion list with CompletionRings
10. Ambient aurora blobs (3, using new accent colors at 2-4% opacity)
11. All sections use GSAP ScrollTrigger for entry animation
12. Refresh button with spin animation when loading
13. Customization panel trigger

### PAGE: Login (app/login/page.tsx)
**Must contain**:
1. Full-screen centered layout, NO sidebar, NO header
2. Subtle 3D backdrop visible behind a frosted glass card
3. Card: 400px max-width, --depth-1 bg, 16px radius, generous padding
4. Logo at top (crystal icon or gradient text)
5. "Welcome back" heading, "Sign in to continue" subtitle
6. Email + Password inputs with proper labels
7. "Sign In" primary button, full width
8. Loading state: button shows spinner
9. Error state: shake animation + red border on inputs
10. Subtle entry animation: card scales in from 0.95 with spring

### PAGE: Trainees List (app/trainees/page.tsx)
**Must contain**:
1. Page header with title + count badge
2. Filter bar: search, company dropdown, batch dropdown
3. "Add Trainee" primary button
4. Table view with columns: Name, Company, Batch, Attendance%, Status
5. Each row clickable → navigate to [id] detail
6. Pagination component at bottom
7. Empty state with icon + "No trainees found"
8. Create/Edit modal (from Modal.tsx)
9. Table uses layout animation for smooth re-sorting

### PAGE: Trainee Detail (app/trainees/[id]/page.tsx)
**Must contain**:
1. Breadcrumb: Trainees / {name}
2. Profile header card with:
   - Avatar (gradient initial)
   - Name (large), Company, Batch, Email, Phone
   - Edit + Delete action buttons
3. Stats row: Attendance%, Present, Absent, Late days
4. Area chart: Attendance trend over time
5. Radar chart: Skills assessment radar
6. Assessment history table
7. 10-day attendance timeline

### PAGE: Analytics (app/analytics/page.tsx)
**Must contain**:
1. 6 chart panels in 2-column grid:
   - Monthly attendance trend (Area)
   - Assessment outcomes distribution (Donut)
   - Batch comparison (grouped Bar)
   - Late patterns over time (Line)
   - Skills radar comparison (Radar)
   - Top companies leaderboard (horizontal Bar)
2. Each chart in its own card with title + subtitle
3. Date range selector (if applicable)
4. All charts use unified color palette from Section 8

### ALL OTHER PAGES: Follow the same patterns. Every page gets:
- Sidebar + Header shell
- motion.main wrapper with entry animation
- GSAP ScrollTrigger on major sections
- Consistent use of new color tokens
- Consistent typography scale
- Consistent component usage (Card, Button, Input, Badge, etc.)

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 10 — CSS ARCHITECTURE (globals.css SPECIFICATION)               ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

The new `globals.css` must contain AT MINIMUM:

### 1. CSS Custom Properties (60+ variables)
- Full depth palette (7 levels)
- Full accent system (7 semantic colors)
- Full text hierarchy (6 levels)
- Full border system (5 levels)
- Full radius system (5 sizes)
- Full shadow system (4 elevations)
- Aurora/glow variables for accent glows
- Font variables (3 families)
- Spacing scale variables (optional but recommended)

### 2. Utility Classes (30+ classes)
- `.surface-*` classes for each depth level
- `.obsidian-card` — primary card styling
- `.glass-card` — frosted glass variant
- `.btn-*` — primary, secondary, ghost, danger
- `.input-*` — text inputs, selects
- `.text-gradient` — accent gradient text
- `.skeleton-shimmer` — loading placeholder
- `.gsap-reveal` family (4 directions)
- `.magnetic-hover` — cursor interaction
- `.glow-border` — accent glow effect
- `.stat-glow-*` — per-color stat glows
- `.noise-overlay` — texture overlay
- `.mesh-blob` — ambient gradient blob
- `.modal-backdrop` / `.modal-panel`
- `.scrollbar` customization

### 3. Keyframe Animations (8+ animations)
- `shimmerBtn` — button loading shimmer
- `skeletonShimmer` — skeleton loading
- `pulse` — generic breathing pulse
- `float` — gentle floating motion
- `glow` — accent glow intensification
- `slideInLeft/Right/Up/Down` — directional entries
- `spin` — loading spinner

### 4. Global Resets & Base Styles
- Tailwind v4 `@import "tailwindcss"`
- `@theme` block for design tokens (Tailwind v4 CSS-first config)
- Selection colors (accent background)
- Focus-visible rings (accent glow)
- Scrollbar styling (thin, themed)
- `prefers-reduced-motion` respect

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 11 — RESPONSIVE DESIGN REQUIREMENTS                            ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### Breakpoints (standard Tailwind):
```
sm: 640px    — Mobile landscape, small tablets
md: 768px    — Tablets
lg: 1024px   — Laptops, sidebar visible
xl: 1280px   — Desktops
2xl: 1536px  — Large monitors
```

### Mobile (< 640px):
- Sidebar: Hidden, accessible via hamburger menu (overlay mode)
- Header: Compact, search becomes icon-only → opens CommandPalette
- Stats grid: 1 column
- Charts: Full width, reduced height (200px instead of 260px)
- Tables: Horizontal scroll with sticky first column
- Modals: Full screen (no rounded corners, full width)
- Cards: Single column, reduced padding (16px)
- Font sizes: No change (already using small px values)

### Tablet (640px - 1024px):
- Sidebar: Collapsed by default (64px), expandable
- Stats grid: 2 columns
- Charts: 1 column (stacked)
- Tables: Horizontal scroll as needed
- Modals: 90% width

### Desktop (1024px+):
- Sidebar: Expanded by default (240px)
- Stats grid: 4 columns
- Charts: 2 columns
- Tables: Full width, no scroll
- Modals: Fixed max-width

### Touch Interactions:
- All tap targets: minimum 44x44px (WCAG)
- Swipe to dismiss for modals/toasts (if drag implemented)
- No hover-dependent critical interactions

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 12 — ACCESSIBILITY REQUIREMENTS                                ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

1. **Color Contrast**: All text must meet WCAG AA (4.5:1 for body, 3:1 for large)
   - --text-100 (#f5f5f7) on --void (#050505) = 19:1 ✓
   - --text-70 (#a1a1a9) on --void (#050505) = 8.5:1 ✓
   - --text-50 (#71717a) on --void (#050505) = 5.2:1 ✓
   - --text-30 (#52525b) on --void (#050505) = 3.4:1 ✓ (large text only)

2. **Focus Management**:
   - `focus-visible` ring on ALL interactive elements
   - Ring: `0 0 0 2px var(--depth-1), 0 0 0 4px var(--accent-primary)`
   - Logical tab order
   - Focus trap in modals

3. **Aria Labels**:
   - All icon-only buttons must have `aria-label`
   - Charts should have `role="img"` and `aria-label` describing the data
   - Modal must have `role="dialog"` + `aria-modal="true"`

4. **Reduced Motion**:
   - `prefers-reduced-motion: reduce` → disable ALL animations
   - Set `transition: none` and `animation: none` globally
   - GSAP should check `window.matchMedia("(prefers-reduced-motion: reduce)")`
   - Three.js should reduce to static scene (no rotation, no particles)

5. **Screen Reader**:
   - Stats cards should announce "Active Batches: 12" not just "12"
   - Navigation landmarks: `<nav>`, `<main>`, `<header>`, `<aside>`
   - Tables must have `<thead>` and `<th scope="col">`

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 13 — PERFORMANCE REQUIREMENTS                                  ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

1. **Three.js Performance Mode**:
   - DPR: [1, 1.25] performance / [1.5, 2] cinematic
   - Geometry budget: <5000 vertices total
   - Draw calls: <20
   - No real-time shadows
   - `powerPreference: "high-performance"`
   - `frameloop: "demand"` when tab not visible (if possible with drei)

2. **CSS Performance**:
   - Use `will-change: transform` on animated elements
   - Use `contain: layout style` on cards
   - Avoid `filter` on large areas (keep to small elements)
   - `backdrop-filter` only on header and modals

3. **JavaScript Budget**:
   - All Recharts components: dynamic import with `ssr: false`
   - ThreeBackdrop: dynamic import with `ssr: false`
   - Intersection Observer for lazy chart rendering (only render when visible)
   - Image optimization: next/image for any future images
   - Bundle analysis target: <200KB first-load JS (excluding vendor)

4. **Animation Performance**:
   - GSAP: Use `gsap.quickTo()` for mouse-following animations
   - Framer Motion: Prefer `transform` and `opacity` (GPU-composited)
   - Avoid animating `width`, `height`, `margin`, `padding`
   - Use `layout="position"` instead of `layout` where possible

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 14 — EXECUTION PHASES (STEP-BY-STEP ORDER)                     ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### PHASE 1: Foundation (must complete first)
1. Delete and recreate `globals.css` with complete new design system
2. Update `app/layout.tsx` metadata, fonts, theme-color
3. Update `stores/index.ts` with new default colors
4. Update `app/icon.svg` with new accent gradient
5. Build verify: `npx next build` → 0 errors

### PHASE 2: Visual Layer
6. Delete and recreate `ThreeBackdrop.tsx` with new 3D scene
7. Update `GlobalFx.tsx` with new ambient gradients
8. Update `RouteFx.tsx` with new transition colors
9. Update `VisualModeSync.tsx` if needed
10. Build verify

### PHASE 3: Structural Components
11. Delete and recreate `layout/index.tsx` (Sidebar + Header)
12. Delete and recreate `ui/index.tsx` (all 18 components)
13. Update `Modal.tsx` with new design tokens
14. Update `Toast.tsx` with new design tokens
15. Update `CommandPalette.tsx` with new design tokens
16. Update `CustomizationPanel.tsx` with new design tokens
17. Update `ClientOnly.tsx` loading screen
18. Update `ErrorBoundary.tsx` fallback UI
19. Build verify

### PHASE 4: Pages — Core
20. Delete and recreate `app/page.tsx` (Dashboard)
21. Transform `app/login/page.tsx`
22. Transform `app/setup/page.tsx`
23. Transform `app/error.tsx`
24. Transform `app/loading.tsx`
25. Transform `app/not-found.tsx`
26. Build verify

### PHASE 5: Pages — Data Views
27. Transform `app/trainees/page.tsx`
28. Transform `app/trainees/[id]/page.tsx`
29. Transform `app/batches/page.tsx`
30. Transform `app/batches/[id]/page.tsx`
31. Transform `app/attendance/daily/page.tsx`
32. Transform `app/attendance/10-day/page.tsx`
33. Transform `app/assessments/page.tsx`
34. Transform `app/companies/page.tsx`
35. Transform `app/companies/[name]/page.tsx`
36. Transform `app/analytics/page.tsx`
37. Transform `app/settings/page.tsx`
38. Build verify

### PHASE 6: Polish & Documentation
39. Run through ALL pages and verify visual consistency
40. Update `DESIGN_SYSTEM.md` with new documentation
41. Final build verify: `npx next build` → 0 errors, 39 routes
42. Start dev server: `npx next dev --port 3005`

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 15 — QUALITY CHECKLIST (VERIFY EVERY ITEM)                     ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

Before declaring the transformation complete, verify:

### Visual Consistency:
- [ ] Every background uses --depth-* tokens (no hardcoded bg colors outside globals.css)
- [ ] Every text color uses --text-* or Tailwind accent utilities
- [ ] Every border uses --border-* tokens
- [ ] Every card uses `.obsidian-card` or equivalent class
- [ ] Every button uses `.btn-*` or Button component
- [ ] Every input uses `.input-*` or Input component
- [ ] No remnants of old colors (#0c0a09, #171412, #10b981, #ec4899, #34d399)
- [ ] No remnants of old class names (emerald-500/400, teal-500/400 as primary)

### Animation Quality:
- [ ] Page entry animations are smooth (no jank)
- [ ] Card hover transitions feel responsive (< 200ms start)
- [ ] Modal open/close is spring-based (no linear)
- [ ] Three.js scene renders at 60fps in performance mode
- [ ] GSAP scroll reveals trigger at correct scroll positions
- [ ] Route transitions feel fast (< 500ms total)
- [ ] Number counters animate smoothly on dashboard

### Responsive:
- [ ] Mobile (375px): sidebar hidden, single column, no overflow
- [ ] Tablet (768px): sidebar collapsed, 2-column grids
- [ ] Desktop (1280px): sidebar expanded, 4-column stats
- [ ] No horizontal scrollbar at any breakpoint (except tables)
- [ ] Touch targets are 44x44px minimum

### Performance:
- [ ] Build completes with 0 errors
- [ ] No console warnings in dev mode
- [ ] No TypeScript errors
- [ ] Three.js canvas doesn't cause layout shifts
- [ ] Charts lazy-load (not in initial bundle)

### Accessibility:
- [ ] All interactive elements are keyboard accessible
- [ ] Focus rings are visible and properly colored
- [ ] Color contrast passes WCAG AA
- [ ] `prefers-reduced-motion` is respected
- [ ] All images/icons have alt text or aria-label

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 16 — ADVANCED TECHNIQUES REFERENCE                             ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### CSS Techniques to Implement:

**1. Glass Morphism (for elevated panels)**:
```css
.glass-card {
  background: rgba(20, 20, 22, 0.6);
  backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.03) inset,
    0 8px 32px -4px rgba(0,0,0,0.4);
}
```

**2. Neumorphic Inset (for progress tracks)**:
```css
.progress-track {
  background: var(--depth-3);
  box-shadow:
    inset 2px 2px 4px rgba(0,0,0,0.3),
    inset -1px -1px 2px rgba(255,255,255,0.03);
  border-radius: 999px;
}
```

**3. Prismatic Border (for active/focus states)**:
```css
.prismatic-border {
  position: relative;
}
.prismatic-border::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, #a78bfa, #818cf8, #c084fc, #a78bfa);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0;
  transition: opacity 300ms;
}
.prismatic-border:hover::before,
.prismatic-border:focus-within::before {
  opacity: 1;
}
```

**4. Shimmer Loading Effect**:
```css
@keyframes skeletonShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--depth-2) 25%,
    var(--depth-3) 50%,
    var(--depth-2) 75%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 2s infinite ease-in-out;
}
```

**5. Radial Glow on Hover**:
```css
.glow-on-hover {
  position: relative;
}
.glow-on-hover::after {
  content: "";
  position: absolute;
  inset: -20%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-primary), transparent 70%);
  opacity: 0;
  transition: opacity 400ms;
  pointer-events: none;
  z-index: -1;
  filter: blur(40px);
}
.glow-on-hover:hover::after {
  opacity: 0.08;
}
```

### Three.js Advanced Techniques:

**1. Custom Shader for Lattice Lines (GLSL)**:
```glsl
// Traveling light pulse along edges
uniform float uTime;
varying float vProgress;

void main() {
  float pulse = smoothstep(0.0, 0.1, sin(vProgress * 6.28 - uTime * 2.0));
  vec3 color = mix(vec3(0.5, 0.42, 0.84), vec3(0.75, 0.52, 0.98), pulse);
  gl_FragColor = vec4(color, 0.3 + pulse * 0.5);
}
```

**2. Instanced Mesh for Nodes (performance)**:
```tsx
<instancedMesh args={[undefined, undefined, nodeCount]}>
  <sphereGeometry args={[0.02, 8, 8]} />
  <meshBasicMaterial color="#818cf8" transparent opacity={0.8} />
</instancedMesh>
```

**3. Post-Processing Stack**:
```tsx
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
// Only in cinematic mode:
<EffectComposer>
  <Bloom luminanceThreshold={0.6} intensity={0.3} radius={0.7} />
  <Vignette offset={0.1} darkness={0.4} />
  <ChromaticAberration offset={[0.0003, 0.0003]} />
</EffectComposer>
```

### GSAP Advanced Techniques:

**1. SplitText for Heading Reveals**:
```ts
// Manual character split (no GSAP Club required)
const chars = heading.textContent.split("").map((ch, i) => {
  const span = document.createElement("span");
  span.textContent = ch === " " ? "\u00A0" : ch;
  span.style.display = "inline-block";
  return span;
});
heading.textContent = "";
chars.forEach(s => heading.appendChild(s));
gsap.from(chars, {
  opacity: 0, y: 20, rotateX: -60,
  stagger: 0.03, duration: 0.6, ease: "power4.out"
});
```

**2. ScrollTrigger Batch for Cards**:
```ts
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.batch(".gsap-reveal", {
  onEnter: (elements) => {
    gsap.from(elements, {
      opacity: 0, y: 40, scale: 0.96,
      stagger: 0.08, duration: 0.7, ease: "power3.out"
    });
  },
  start: "top 85%",
  once: true,
});
```

**3. Magnetic Button Effect**:
```ts
const handleMouseMove = (e: MouseEvent) => {
  const rect = button.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  gsap.to(button, { x: x * 0.15, y: y * 0.15, duration: 0.4, ease: "power2.out" });
};
const handleMouseLeave = () => {
  gsap.to(button, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
};
```

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 17 — DEPENDENCY MANAGEMENT                                     ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

### Current Dependencies (DO NOT REMOVE):
```
@react-three/fiber ^9.3.0        — Keep, core 3D engine
@react-three/drei ^10.7.4        — Keep, Three.js helpers
three ^0.176.0                   — Keep, Three.js core
gsap ^3.13.0                     — Keep, animation engine
framer-motion ^12.30.1           — Keep, React animations
recharts ^3.7.0                  — Keep, charts
react-countup ^6.5.3             — Keep (or replace with GSAP counters)
lucide-react ^0.563.0            — Keep, icons
```

### Dependencies to ADD (if implementing post-processing or ScrollTrigger):
```
@react-three/postprocessing      — For Bloom, Vignette, ChromaticAberration
postprocessing                   — Peer dependency of above
```
Note: GSAP ScrollTrigger is built into `gsap` package, just import from `gsap/ScrollTrigger`.

### Dependencies to POTENTIALLY ADD:
```
@fontsource/plus-jakarta-sans    — If using Plus Jakarta Sans font
@fontsource/space-grotesk        — If using Space Grotesk font
```

### DO NOT ADD (keep bundle lean):
- No Tailwind UI, Radix UI, or Shadcn — we build custom
- No Lottie — GSAP handles all animations
- No D3.js — Recharts handles all charts
- No CSS-in-JS (styled-components, emotion) — Tailwind + globals.css only

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 18 — COLOR MAPPING REFERENCE (OLD → NEW)                       ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

Use this table for systematic find-and-replace across ALL files:

### Background Colors:
```
#0c0a09   →  #050505     (void)
#171412   →  #0a0a0b     (depth-1)
#1c1917   →  #0f0f11     (depth-2)
#231f1d   →  #141416     (depth-3)
#2c2724   →  #1a1a1d     (depth-4)
#3d3632   →  #222225     (depth-5)
#050507   →  #050505     (loading screen)
```

### Text Colors:
```
#fafaf9   →  #f5f5f7     (text-100)
#d6d3d1   →  #d1d1d6     (text-90)
#a8a29e   →  #a1a1a9     (text-70)
#78716c   →  #71717a     (text-50)
#57534e   →  #52525b     (text-30)
#44403c   →  #3f3f46     (text-10)
```

### Accent Colors:
```
#10b981   →  #a78bfa     (emerald → violet, primary)
#34d399   →  #818cf8     (mint → indigo, secondary)
#ec4899   →  #c084fc     (magenta → purple, tertiary)
#f59e0b   →  #fbbf24     (fire → amber, keep similar)
#059669   →  #7c3aed     (dark emerald → dark violet)
```

### Tailwind Class Mapping:
```
emerald-600  →  violet-600
emerald-500  →  violet-500
emerald-400  →  violet-400
teal-600     →  indigo-600
teal-500     →  indigo-500
teal-400     →  indigo-400
cyan-600     →  purple-600
cyan-500     →  purple-500
cyan-400     →  purple-400
pink-500     →  fuchsia-500
pink-400     →  fuchsia-400
```

### Border Colors:
```
rgba(168,162,158,0.04)  →  rgba(255,255,255,0.04)
rgba(168,162,158,0.06)  →  rgba(255,255,255,0.06)
rgba(168,162,158,0.08)  →  rgba(255,255,255,0.08)
rgba(168,162,158,0.10)  →  rgba(255,255,255,0.10)
rgba(168,162,158,0.12)  →  rgba(255,255,255,0.12)
rgba(168,162,158,0.15)  →  rgba(255,255,255,0.15)
rgba(16,185,129,0.15)   →  rgba(167,139,250,0.20)
rgba(16,185,129,0.25)   →  rgba(167,139,250,0.30)
rgba(16,185,129,0.35)   →  rgba(167,139,250,0.40)
```

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 19 — DESIGN PRINCIPLES & PHILOSOPHY                            ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

1. **Void First** — Start with absolute darkness. Every pixel of light must
   be earned. Backgrounds should feel like deep space, not dark gray.

2. **Surgical Light** — Accent colors are scalpels, not paintbrushes. Use
   them sparingly and with purpose. A single violet line has more impact
   than a violet-tinted card.

3. **Hierarchy Through Luminance** — Never use size alone for hierarchy.
   The interplay of brightness levels should guide the eye from primary
   (brightest) to tertiary (dimmest) information.

4. **Motion With Meaning** — Every animation must communicate something:
   entry (element appeared), state change (data updated), or interaction
   feedback (you clicked this). Never animate for decoration alone.

5. **Depth Through Layers** — Use the 7-level depth system to create
   spatial hierarchy. Cards float above the void. Modals float above cards.
   Tooltips float above everything. Each layer is 1 step brighter.

6. **Precision Over Decoration** — No gratuitous gradients, no decorative
   borders, no ornamental icons. Every visual element must serve information.
   This is a data command center, not a landing page.

7. **Consistent Rhythm** — Use the 4px grid. All spacing should be
   multiples of 4: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
   All border-radii should follow: 4, 6, 8, 12, 16.

8. **Breathable Density** — Dense information presented with adequate
   whitespace. Never let elements touch each other. Minimum 8px gap between
   any two elements, 16px between sections.

---

## ╔═══════════════════════════════════════════════════════════════════════════╗
## ║  SECTION 20 — FINAL DIRECTIVE                                           ║
## ╚═══════════════════════════════════════════════════════════════════════════╝

Execute this prompt from Phase 1 through Phase 6 without stopping. Do not
ask for confirmation between phases. Do not ask for design choices — use
Option A "Void Crystal" as the default. If any file has old design tokens
remaining after your transformation, the job is not done.

The final product must feel like a completely different application. If someone
who used the old version (AURORA BOREALIS warm charcoal + emerald + magenta)
sees the new version, they should not recognize it. The emotional response
should shift from "warm organic forest" to "cold precision void with
crystalline violet light."

The 3D backdrop should feel like looking into deep space with a geometric
crystal constellation floating in darkness — NOT particles orbiting an orb.

The GSAP animations should feel like the UI is alive and responsive to
the user — NOT like things are bouncing around randomly.

The Framer Motion transitions should feel like iOS-quality spring physics —
NOT like CSS ease-in-out.

The typography should feel like a premium design tool (Linear, Raycast,
Figma) — NOT like a generic dashboard template.

The color palette should feel like a luxury brand (Porsche, Apple, Prada) —
NOT like a Bootstrap theme with dark mode enabled.

Build. Verify. Deploy. Zero errors. Zero compromises.

# ═══════════════════════════════════════════════════════════════════════════════
# END OF PHOENIX PROMPT — 1000 LINES OF PURE DESIGN ENGINEERING FIREPOWER
# ═══════════════════════════════════════════════════════════════════════════════
