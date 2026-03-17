# NOVA Design System

> Avaria Academy LMS — A deep-ocean interface illuminated by electric cyan light and warm gold accents.

---

## Philosophy

NOVA treats every surface as a depth layer in a deep ocean environment.  
Light comes from above — electric cyan and sky blue radiance cuts through navy depths, with warm amber/gold accents marking key interaction points.  
The result is an interface that feels *alive*, not flat.

---

## Color Tokens

### Surface Layers (depth ordering)

| Token             | Hex        | Usage                        |
| ----------------- | ---------- | ---------------------------- |
| `--void`          | `#030712`  | Page background, true deep   |
| `--ocean-1`       | `#0a1120`  | Sidebar, deep card surfaces  |
| `--ocean-2`       | `#0c1322`  | Primary card backgrounds     |
| `--ocean-3`       | `#111d2e`  | Elevated card surfaces       |
| `--ocean-4`       | `#1a2332`  | Hover states, raised panels  |
| `--ocean-5`       | `#2d3b50`  | Active / pressed states      |

### Electric Accents

| Token             | Hex        | Usage                     |
| ----------------- | ---------- | ------------------------- |
| `--electric-start`| `#06b6d4`  | Gradient start (cyan)     |
| `--electric-mid`  | `#0ea5e9`  | Gradient midpoint (sky)   |
| `--electric-end`  | `#3b82f6`  | Gradient end (blue)       |
| `--warm-accent`   | `#f59e0b`  | Warm accent (amber)       |

### Text Hierarchy (Ocean Clarity)

| Token             | Opacity | Hex        | Usage                   |
| ----------------- | ------- | ---------- | ----------------------- |
| `--clarity-100`   | 100%    | `#f0f4f8`  | Headings, KPI numbers   |
| `--clarity-80`    | 80%     | `#ccd5e4`  | Secondary text          |
| `--clarity-60`    | 60%     | `#b8c5d6`  | Body text               |
| `--clarity-40`    | 40%     | `#8896a8`  | Labels, captions        |
| `--clarity-20`    | 20%     | `#586880`  | Muted text, placeholders|
| `--clarity-10`    | 10%     | `#384860`  | Dividers, subtle labels |
| `--clarity-5`     | 5%      | `#243044`  | Barely visible hints    |

### Ocean Borders

| Token                    | Value                         |
| ------------------------ | ----------------------------- |
| `--ocean-border`         | `rgba(56, 130, 176, 0.08)`    |
| `--ocean-border-hover`   | `rgba(6, 182, 212, 0.15)`     |

### Signal Colors (Aurora)

| Token               | Hex        | Usage        |
| -------------------- | ---------- | ------------ |
| `--aurora-emerald`   | `#34d399`  | Success      |
| `--aurora-rose`      | `#f43f5e`  | Error        |
| `--aurora-amber`     | `#fbbf24`  | Warning      |
| `--aurora-sky`       | `#38bdf8`  | Info         |

---

## Tailwind Mappings

When writing Tailwind classes in page files, use these arbitrary color values:

```
bg-[#030712]          → void background
bg-[#0a1120]          → ocean-1
bg-[#0c1322]          → ocean-2
bg-[#111d2e]          → ocean-3
bg-[#1a2332]          → ocean-4
bg-[#2d3b50]          → ocean-5

text-[#f0f4f8]        → clarity-100 (headings)
text-[#ccd5e4]        → clarity-80
text-[#b8c5d6]        → clarity-60
text-[#8896a8]        → clarity-40
text-[#586880]        → clarity-20 (muted)
text-[#384860]        → clarity-10

border-[#3882b0]/8    → ocean border (standard)
border-[#3882b0]/6    → ocean border (subtle)
border-[#3882b0]/12   → ocean border (emphasis)
```

---

## Surface Classes

| Class             | Effect                                                    |
| ----------------- | --------------------------------------------------------- |
| `.obsidian-card`  | Rounded-2xl card with cyan refraction gradient top-edge   |
| `.glass-card`     | Frosted glass — `blur(40px) saturate(1.4)`                |
| `.card-phantom`   | Animated electric border (10s `prismRefract` loop)        |
| `.surface-card`   | Minimal card — border only, no gradient decoration        |

---

## Typography

- **Headings**: `font-bold tracking-tight text-[#f0f4f8]`
- **Section Labels**: `text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400/70`
- **Input Labels**: `text-[11px] font-semibold uppercase tracking-[0.15em] text-[#586880]`
- **Body Text**: `text-[13px] text-[#b8c5d6]`
- **Muted**: `text-[11px] text-[#384860]`

---

## Spacing & Radius

| Token            | Value     |
| ---------------- | --------- |
| `--radius-sm`    | `8px`     |
| `--radius-md`    | `12px`    |
| `--radius-lg`    | `16px`    |
| `--radius-xl`    | `20px`    |
| `--radius-2xl`   | `24px`    |
| `--radius-full`  | `9999px`  |

Primary radius for cards: `rounded-2xl`  
Secondary radius for inputs, badges: `rounded-xl`

---

## Animations

| Name             | Duration | Purpose                                 |
| ---------------- | -------- | --------------------------------------- |
| `prismRefract`   | 10s      | Animated electric border gradient       |
| `auroraFloat`    | 25s      | Ambient background blob drift           |
| `breathe`        | 4s       | Subtle scale pulse for live indicators  |
| `skeleton-shimmer` | CSS    | Cyan/gold skeleton loading shimmer      |

---

## Component API Reference

All components are exported from `@/components/ui`:

| Component        | Key Props                                          |
| ---------------- | -------------------------------------------------- |
| `StatsCard`      | `title, value, subtitle, icon, color, trend`       |
| `CompletionRing` | `value, size?, strokeWidth?`                       |
| `ProgressBar`    | `value, max?, color?, showLabel?`                  |
| `Badge`          | `children, variant?, size?`                        |
| `Button`         | `variant?, size?, loading?, children`              |
| `Input`          | `label?, error?` + native input props              |
| `FormField`      | `label, error?, children`                          |
| `Select`         | `label?, options, error?` + native select props    |
| `Card`           | `children, className?, padding?`                   |
| `Avatar`         | `name, size?, className?`                          |
| `Skeleton`       | `className?`                                       |
| `Tooltip`        | `content, children, side?`                         |
| `EmptyState`     | `icon, title, description, action?, onAction?`     |
| `Breadcrumb`     | `items: {label, href?}[]`                          |
| `CardSkeleton`   | `lines?`                                           |
| `PageSkeleton`   | (no props)                                         |
| `TableSkeleton`  | `rows?, columns?`                                  |
| `StatSkeleton`   | `count?`                                           |

Layout components from `@/components/layout`:

| Component | Notes                                                |
| --------- | ---------------------------------------------------- |
| `Sidebar` | Collapsible, gradient bg, electric active indicator  |
| `Header`  | Glass blur, search bar, cinematic mode toggle        |

---

## Design Principles

1. **Depth over decoration** — Use layered surfaces instead of decorative borders or shadows
2. **Electric restraint** — Color accents only at interaction points (hover, active, focus)
3. **Ocean borders** — Ultra-thin `rgba(56,130,176,0.08)` lines, never solid colors
4. **Ambient atmosphere** — `mix-blend-mode: screen` aurora blobs create living depth
5. **Spring physics** — Use `ease: [0.22, 1, 0.36, 1]` for all motion (never linear)
6. **Clarity hierarchy** — Text opacity controls visual importance, not font weight alone
7. **Uppercase tracking** — All labels use `uppercase tracking-[0.15em]` for clean feel

---

*NOVA v1.0 — Avaria Academy LMS*
