---
name: house-of-ugc-design
description: Use this skill to generate well-branded interfaces and assets for House of UGC, a premium creative agency specialising in UGC content, performance marketing, and creative strategy. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping and production.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick Design Reference

**Brand essence:** Minimal luxury. Premium SaaS meets creative agency. Black and white, strong type, smooth motion.

**Color palette:**
- Background: `#0A0A0A` (primary), `#111111` (elevated), `#141414` (surface/card)
- Text: `#FFFFFF` (primary), `rgba(255,255,255,0.65)` (secondary), `rgba(255,255,255,0.35)` (muted)
- Borders: `rgba(255,255,255,0.08)` (default), `rgba(255,255,255,0.15)` (strong)

**Typography:**
- Display/Heading: `Space Grotesk`, 700–800, tight tracking (−0.02 to −0.04em)
- Body/UI: `Inter`, 400–600
- Mono: `JetBrains Mono`

**Key rules:**
- No emoji. No gradients on backgrounds. No heavy shadows on cards.
- Cards: `background:#141414`, `border:1px solid rgba(255,255,255,0.08)`, `border-radius:12px`
- Buttons: primary = white fill + black text; secondary = bordered; ghost = transparent
- Animations: fade-up (`translateY 16px → 0`, `opacity 0→1`, `0.5s cubic-bezier(0.22,1,0.36,1)`)
- Section padding: 80–128px vertical
- Max content width: 1200px

**Components available:** Button, Badge, Card, Input, Tag (see `components/core/`)

**UI Kit:** `ui_kits/house_of_ugc/index.html` — full agency website prototype

**Fonts (Google Fonts CDN):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">
```
