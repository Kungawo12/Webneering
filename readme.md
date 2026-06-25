# House of UGC Design System

## Overview

**House of UGC** is a premium creative agency specializing in:
- **UGC Content** — User-generated content production and strategy
- **Performance Marketing** — Conversion-focused ad creative and campaigns
- **Creative Strategy** — Brand storytelling and visual direction

The agency serves **founders and startups** seeking lead generation, authority, and trust-building through premium web presence.

**Source material:** `uploads/Website-Design-Guide-2026-17-06-04-56-1.pdf` — "Claude Code Website Mastery Blueprint: From Beginner To AI Web Design Agency Owner" (18 pages, Google Docs PDF). No Figma links or GitHub repos were provided.

---

## CONTENT FUNDAMENTALS

### Voice & Tone
- **Minimal, direct, powerful.** Short sentences. No filler. Every word earns its place.
- **Confident, not arrogant.** The brand speaks from authority — facts, not hype.
- **Premium signal.** The tone mirrors high-end B2B SaaS brands (Stripe, Linear, Vercel).

### Copy Style
- **Casing:** Sentence case for body; ALL CAPS used selectively for labels, tags, and short section markers.
- **Pronouns:** "We" for the agency, "you" for the client/founder audience.
- **Emoji:** Never used. The brand is too premium for emoji.
- **Punctuation:** Restrained. Em-dashes for rhythm breaks. No exclamation marks.
- **Length:** Short, punchy headlines. Three-word fragments are fine. Body copy is concise.

### Example Copy Patterns
```
Headline:   "Build websites that close."
Sub:        "We help founders launch premium digital experiences — faster."
CTA label:  "Start a project"
Tag:        "PERFORMANCE MARKETING"
```

### What to Avoid
- Hyperbole ("revolutionary", "game-changing")
- Passive voice
- Filler adjectives ("amazing", "incredible", "stunning")
- Numbered emoji lists or icon-heavy UI copy

---

## VISUAL FOUNDATIONS

### Color Philosophy
Strictly monochromatic — near-black backgrounds, white foregrounds, and controlled transparency layers. The brand does not use accent colors; contrast alone creates hierarchy.

- **Background:** `#0A0A0A` (primary) / `#111111` (elevated) / `#1A1A1A` (overlay)
- **Surfaces (cards, panels):** `#141414` with a subtle white-alpha border
- **Foreground:** `#FFFFFF` primary / `rgba(255,255,255,0.65)` secondary / `rgba(255,255,255,0.35)` muted
- **Borders:** `rgba(255,255,255,0.08)` default / `rgba(255,255,255,0.15)` strong / `rgba(255,255,255,0.25)` focus

### Typography
- **Display / Headings:** Space Grotesk — bold, geometric, modern. Used for hero headlines and section titles.
- **Body / UI:** Inter — neutral, highly legible, industry standard for premium SaaS.
- **Monospace:** JetBrains Mono — code snippets, technical labels.
- **Scale:** From `--text-xs` (12px) up to `--text-7xl` (72px).
- **Weight palette:** 400 (body), 500 (UI labels), 600 (sub-headings), 700 (headings), 800 (display).
- **Letter spacing:** Display text uses `−0.02em` to `−0.04em` tight tracking. Labels use `0.08em` expanded.
- **Line height:** Display: 1.1. Body: 1.6. UI: 1.4.

### Backgrounds
- Full-bleed solid dark backgrounds. No gradients on backgrounds.
- Subtle noise/grain texture may be applied at low opacity (3–5%) for premium depth.
- Section dividers via `border-top: 1px solid var(--color-border)` — no heavy separators.
- No hero images by default; the product speaks through typography.

### Spacing
Generous and intentional. Sections breathe with 80–128px vertical padding. Cards use 24–32px internal padding. Based on a 4px base unit.

### Cards & Surfaces
- Background: `var(--color-surface)` (#141414)
- Border: `1px solid var(--color-border)` (rgba white ~8%)
- Border radius: 12px (`--radius-lg`)
- Shadow: None (flat design) or ultra-subtle ambient: `0 1px 3px rgba(0,0,0,0.5)`
- On hover: border brightens to `var(--color-border-strong)`, slight background lift to `#1E1E1E`

### Animation
Framer Motion-style principles:
- **Entrance:** Fade-up — `opacity: 0 → 1`, `translateY(16px) → 0`, `duration: 0.5s`, `ease: cubic-bezier(0.22, 1, 0.36, 1)`
- **Stagger:** Section children reveal with 60ms stagger delay
- **Hover:** Smooth `0.2s` transitions — no jumps
- **Scroll:** Intersection Observer-driven reveal animations
- **No spin/bounce/elastic** — everything is smooth and controlled

### Hover States
- Buttons: background lightens or border brightens; no scale transform on primary
- Cards: border opacity increases, background lightens slightly
- Links: opacity fades to 0.65 on non-CTA links
- Interactive icons: 0.85 opacity on hover

### Press / Active States
- Primary button: very subtle scale-down `scale(0.98)` + slightly darker bg
- Secondary/ghost: same scale, border dims

### Borders & Radius
- `--radius-sm`: 4px (tags, chips)
- `--radius-md`: 8px (inputs, small cards)
- `--radius-lg`: 12px (cards, panels)
- `--radius-xl`: 16px (modals, large cards)
- `--radius-full`: 9999px (pills, avatars)
- Borders: always 1px, never thicker

### Shadows
- Minimal. Only on elevated surfaces (modals, dropdowns).
- `box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)` for elevated elements
- Cards prefer border over shadow

### Transparency & Blur
- Glassmorphism used sparingly — only on nav overlays or sticky headers
- `backdrop-filter: blur(20px)` on dark semi-transparent surfaces `rgba(10,10,10,0.85)`
- Never use blur on static content

### Imagery
- Color tone: desaturated / near monochrome, dark, cinematic
- High-contrast black-and-white photography preferred
- No stock-photo warmth; cool, editorial look
- Images always full-bleed within containers; no float/inset

### Iconography
- Lucide Icons (stroke-based, consistent 1.5px stroke weight, 24×24 default)
- Never filled icons; always outlined stroke
- No emoji substitution for icons

---

## ICONOGRAPHY

The brand uses **Lucide Icons** (https://lucide.dev/) — a clean, consistent stroke-weight icon library popular in premium SaaS products.

- **Style:** Outlined, 1.5px stroke, rounded caps/joins
- **Size:** 16px (small / inline), 20px (default), 24px (featured), 32px (illustration-size)
- **Color:** Inherits foreground color; uses opacity to reduce visual weight
- **Loading:** CDN — `https://unpkg.com/lucide@latest` or `lucide-react` npm package
- **Emoji:** Never used as icons or decorative elements
- **Unicode chars:** Not used as icons

---

## FILE INDEX

```
/
├── readme.md               ← This file
├── SKILL.md                ← Claude skill definition
├── styles.css              ← Root CSS entry (imports only)
├── tokens/
│   ├── colors.css          ← Color custom properties
│   ├── typography.css      ← Type scale + font-stack tokens
│   ├── spacing.css         ← Spacing, radius, z-index tokens
│   ├── effects.css         ← Shadows, transitions, animation tokens
│   └── fonts.css           ← @font-face declarations
├── assets/
│   └── logo.svg            ← House of UGC wordmark (placeholder)
├── guidelines/
│   ├── colors-bg.card.html         ← Background color swatches
│   ├── colors-fg.card.html         ← Foreground / text colors
│   ├── colors-border.card.html     ← Border tokens
│   ├── type-display.card.html      ← Display / heading type
│   ├── type-body.card.html         ← Body type specimens
│   ├── type-scale.card.html        ← Full type scale
│   ├── type-mono.card.html         ← Monospace specimens
│   ├── spacing-scale.card.html     ← Spacing tokens visual
│   ├── radius.card.html            ← Border radius tokens
│   ├── shadows.card.html           ← Shadow/elevation tokens
│   ├── animations.card.html        ← Motion tokens
│   └── brand-logo.card.html        ← Logo lockup
├── components/
│   └── core/
│       ├── Button.jsx / Button.d.ts / Button.prompt.md
│       ├── Badge.jsx / Badge.d.ts / Badge.prompt.md
│       ├── Card.jsx / Card.d.ts / Card.prompt.md
│       ├── Input.jsx / Input.d.ts / Input.prompt.md
│       ├── Tag.jsx / Tag.d.ts / Tag.prompt.md
│       └── buttons.card.html       ← Component card
└── ui_kits/
    └── house_of_ugc/
        ├── README.md
        └── index.html              ← Interactive agency website prototype
```

### Components
| Name | Description |
|---|---|
| Button | Primary, secondary, ghost, destructive; sm/md/lg sizes |
| Badge | Status indicators — default, success, warning, muted |
| Card | Content surface with optional hover state |
| Input | Text input with label, placeholder, error state |
| Tag | Small label chip for categories / metadata |

### UI Kits
| Product | Path | Description |
|---|---|---|
| House of UGC Website | `ui_kits/house_of_ugc/index.html` | Full agency website prototype |
