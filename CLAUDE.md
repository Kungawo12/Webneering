# Webeneering — Claude Context

**Project:** Webeneering — AI-powered website generator for House of UGC  
**Owner:** Tenzin (pema@karmastaff.com)  
**Deployment:** Vercel + GitHub (`https://github.com/Kungawo12/Webneering.git`, branch `main`)

---

## What This Project Is

Webeneering lets users describe a website in plain language → Gemini designs it → Claude codes it → user downloads a working zip. It runs as a Node.js/Express server with vanilla HTML/CSS/JS frontends.

The agency behind it is **House of UGC** — a premium creative agency for founders/startups (UGC content, performance marketing, creative strategy). The Webeneering tool is both internal tooling and a potential product.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js + Express 4.x (CommonJS only — no ESM, no TypeScript) |
| AI Designer | Google Gemini (gemini-2.5-flash → 2.0-flash → 2.0-flash-lite fallback chain) |
| AI Coder | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| Archive | archiver (ZIP downloads) |
| Frontend | Vanilla HTML/CSS/JS (no framework) |
| Env | dotenv |

**Required env vars (`.env`):**
```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
PORT=3000
```

---

## File Map

```
/
├── server.js              ← ALL backend logic — routes + prompt builders
├── webeneering.html       ← MAIN UI — sidebar (chat) + iframe preview
├── builder.html           ← Alternative builder UI
├── generator.html         ← Legacy generator
├── image-agent.html       ← SVG/graphic tool
├── House of UGC - Website.html  ← Agency prototype
├── package.json           ← {express, @anthropic-ai/sdk, @google/generative-ai, archiver, dotenv}
├── .env                   ← API keys — NEVER commit
├── .gitignore             ← node_modules/, .env, .DS_Store
├── vercel.json            ← Vercel deployment config
├── readme.md              ← Design system documentation
├── SKILL.md               ← Claude skill definition
├── styles.css + tokens/   ← CSS design tokens
├── components/core/       ← Button, Badge, Card, Input, Tag
├── guidelines/            ← Visual reference cards
├── ui_kits/house_of_ugc/  ← Agency website prototype
└── uploads/               ← Reference PDFs
```

---

## API Routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/build` | Conversational builder — Gemini design spec + Claude HTML + SVG |
| POST | `/build-project` | Full project — HTML + backend.js → ZIP |
| POST | `/create` | Webeneering unified — Gemini frontend + Claude backend |
| POST | `/download` | Package pre-generated HTML + backend into ZIP |
| POST | `/generate` | Legacy single-page generator |
| POST | `/generate-graphic` | SVG graphic generation |

---

## Generation Pipeline

```
User prompt
  → callGeminiDesigner()      → JSON design spec (theme, palette, typography, mood)
  → callGeminiFrontend()      → Full HTML (Tailwind CDN, IntersectionObserver animations)
  → generateBackendCode()     → Express server.js (Claude, system prompt with ephemeral cache)
  → archiver                  → ZIP download
```

**Key rule:** Gemini generates the frontend; Claude generates the backend. Claude receives the frontend HTML first so it knows which API routes exist.

---

## Design System (House of UGC)

**Monochrome dark.** No accent colors — contrast creates hierarchy.

```css
--bg: #0A0A0A  |  --surface: #141414  |  --fg: #FFFFFF
--fg2: rgba(255,255,255,.65)  |  --fg3: rgba(255,255,255,.35)
--border: rgba(255,255,255,.08)  |  --border2: rgba(255,255,255,.15)
--success: #4ADE80  |  --danger: #F87171
```

**Fonts:** Space Grotesk (headings, 700–800) + Inter (body, 400–600) + JetBrains Mono (code)

**Animation:** fade-up entrance (`opacity:0→1`, `translateY(16px→0)`, `0.5s`, `cubic-bezier(0.22,1,0.36,1)`) + 60ms stagger. IntersectionObserver for scroll reveals. No spin/bounce/elastic.

**Icons:** Lucide Icons (stroke, 1.5px, rounded). Never filled, never emoji.

**Copy:** Minimal, direct, confident. Sentence case. No emoji. No filler adjectives.

---

## What Agents Should Know (from Research)

Verified from deep research on MotionSites.ai and the AI animated website space:

1. **Visual feedback doubles output quality.** Claude-3.5-Sonnet website accuracy: 26.4% → 51.9% when given screenshot-based visual feedback (WebGen-Agent research). The `/refine` endpoint and future screenshot loop are the highest-leverage improvements.

2. **Standard animation stack to target in generated sites:**
   - **Lenis** (smooth scroll) — add to every generated site
   - **GSAP + ScrollTrigger** — for premium/saas/portfolio types
   - **anime.js** — for element/logo animations (lightweight, LLM-friendly)
   - **CSS view-timeline** — for simple scroll animations without JS
   - **IntersectionObserver** — currently used, keep for standard tier

3. **MotionSites' model:** They sell curated prompts + visual previews. Their value is pre-engineered, tested prompts. Webeneering's advantage is end-to-end generation — no separate builder needed.

4. **Competitors to know:** Framer (no-code, Motion engine), Webflow (timeline animation), Dora (3D AI), Motn AI (prompt-to-motion → React/Framer export).

5. **Don't use in generated sites:** Three.js (too heavy for default), Locomotive Scroll (dead, replaced by Lenis), Framer Motion (requires React).

---

## Prioritized Improvements

### Quick wins (add to prompts now)
1. Add Lenis CDN to `buildGeminiFrontendPrompt()` — smooth scroll on every generated site
2. Add `prefers-reduced-motion` check to animation code
3. Add GSAP + ScrollTrigger for `saas` and `portfolio` website types
4. Animate SVG hero on page load (CSS keyframes or SMIL)

### Medium term
5. Template gallery — browse visual templates, use pre-engineered prompts
6. `/refine` endpoint — visual feedback iteration (user describes what's wrong → targeted fix)
7. Animation level toggle in UI (None / Standard / Premium)

### Strategic
8. Screenshot-based auto-review loop (html2canvas → Claude vision → auto-fix)
9. Template prompt library stored as JSON files
10. Vercel stateless fix — file-based JSON doesn't persist; add Vercel KV or Upstash for prod

---

## Vercel Deployment

`vercel.json` (add to project root):
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

**Set in Vercel dashboard:** `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`

**Warning:** Vercel free tier has 10s function timeout. Claude/Gemini calls take 20–30s — upgrade to Pro or implement streaming responses.

**Warning:** File-based JSON storage (current `/data/*.json`) does NOT persist between Vercel function invocations. Flag this to user if they ask about saving user data in production.

---

## Common Problems & Fixes

| Problem | Fix |
|---|---|
| Gemini 429/quota | Auto-fallback chain handles it; verify GEMINI_API_KEY is set |
| No `<!DOCTYPE` in response | Generation truncated — increase `max_tokens` or simplify prompt |
| ZIP download hangs | Check `res.headersSent` before calling `res.status(500)` after archiver starts |
| Backend missing routes | Pass `frontendHtml` to `buildFunctionalBackendPrompt` so Claude sees which routes exist |
| Port 3000 in use | `lsof -ti:3000 \| xargs kill -9` |
| ANTHROPIC_API_KEY error | Check `.env` file; run `node -e "require('dotenv').config(); console.log(process.env.ANTHROPIC_API_KEY)"` |
| Generated site has no animations | Check that `buildGeminiFrontendPrompt` includes the IntersectionObserver + Lenis code block |

---

## Local Development

```bash
npm run dev    # node --watch server.js
# Open: http://localhost:3000/webeneering.html
```

Always test the golden path after changes: fill in the form → Generate → verify iframe loads with animations → Download zip → unzip → `node server.js` → verify `/api/*` routes work.
