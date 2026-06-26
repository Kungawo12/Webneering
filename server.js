require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const { compress: hrCompress } = require('headroom-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Headroom: set HEADROOM_BASE_URL (local proxy) or HEADROOM_API_KEY (cloud)
// Without one of these, compress() returns text uncompressed (safe no-op).
const HEADROOM_URL     = process.env.HEADROOM_BASE_URL || 'http://localhost:8787';
const HEADROOM_ENABLED = !!(process.env.HEADROOM_BASE_URL || process.env.HEADROOM_API_KEY);

if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-api-key-here') {
  console.error('\n❌  No Anthropic API key found.\n');
  if (require.main === module) process.exit(1);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'missing' });
const gemini    = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname)));

// ── Conversational website builder ───────────────────────────────────────────
app.post('/build', async (req, res) => {
  const { description, websiteType = 'business', improvements = [], iteration = 0 } = req.body || {};
  if (!description) return res.status(400).json({ error: 'description is required.' });

  try {
    const designSpec = await callGeminiDesigner(
      websiteType, description, improvements.join(', ')
    );

    const [pageMsg, svgMsg] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8000,
        messages: [{ role: 'user', content: buildConversationalPrompt(description, websiteType, improvements, designSpec) }],
      }),
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildHeroSvgPrompt(description, websiteType, designSpec) }],
      }),
    ]);

    let html = clean(pageMsg.content[0]?.text || '');
    if (!html.includes('<!DOCTYPE') && !html.includes('<html'))
      return res.status(500).json({ error: 'Generation failed. Please try again.' });

    const heroSvg = clean(svgMsg.content[0]?.text || '');
    if (heroSvg.includes('<svg')) html = html.replace('<!--HERO_SVG-->', heroSvg);

    const message = iteration === 0
      ? "Here's your website! I've built it with real backend routes ready to go. What would you like to improve — colors, layout, sections, content, or features?"
      : iteration === 1
        ? "Updated! Does this feel closer to what you had in mind? Any other changes?"
        : "Here's the refined version. Want to tweak anything else, or are you ready to deploy?";

    const suggestions = iteration === 0
      ? ['Change the color scheme', 'Make it darker/moodier', 'Add a pricing section', 'Simplify — fewer sections', 'Add customer testimonials', '🚀 I love it — how do I deploy?']
      : ['Adjust the hero section', 'Change fonts & typography', 'Make buttons bigger', 'Add more visual elements', 'Change the footer', '🚀 This is perfect — deploy it!'];

    res.json({ html, message, suggestions, designSpec });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

// ── Download full project as ZIP ─────────────────────────────────────────────
app.post('/build-project', async (req, res) => {
  const { description, websiteType = 'business', improvements = [], currentHtml } = req.body || {};
  if (!description) return res.status(400).json({ error: 'description is required.' });

  try {
    const designSpec = await callGeminiDesigner(websiteType, description, '');

    // Generate backend + data files in parallel
    const [backendMsg, dataMsg] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{ role: 'user', content: buildFunctionalBackendPrompt(description, websiteType) }],
      }),
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildSampleDataPrompt(description, websiteType) }],
      }),
    ]);

    let backendJs = clean(backendMsg.content[0]?.text || '');
    if (!backendJs.includes("require('express'") && !backendJs.includes('require("express"'))
      return res.status(500).json({ error: 'Backend generation failed.' });

    let sampleData = clean(dataMsg.content[0]?.text || '{}');
    try { JSON.parse(sampleData); } catch { sampleData = '{}'; }

    const html = currentHtml || '<html><body>No HTML provided</body></html>';
    const slug  = (description.split(' ').slice(0,3).join('-')).replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'my-website';

    const packageJson = JSON.stringify({
      name: slug, version: '1.0.0', description,
      main: 'server.js',
      scripts: { start: 'node server.js', dev: 'node --watch server.js' },
      dependencies: { express: '^4.19.2', dotenv: '^16.4.5' },
    }, null, 2);

    const readme = buildReadme(description, websiteType, slug);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => console.error('Archive error:', err));
    archive.pipe(res);

    archive.append(html,         { name: `${slug}/public/index.html` });
    archive.append(backendJs,    { name: `${slug}/server.js` });
    archive.append(packageJson,  { name: `${slug}/package.json` });
    archive.append(sampleData,   { name: `${slug}/data/data.json` });
    archive.append(readme,       { name: `${slug}/README.md` });
    archive.append('PORT=3000\n',{ name: `${slug}/.env.example` });

    await archive.finalize();
  } catch (err) {
    if (!res.headersSent)
      res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

// ── Webeneering unified create ───────────────────────────────────────────────
app.post('/create', async (req, res) => {
  const { title, description, websiteType = 'business', features = '', improvements = [], iteration = 0, cachedDesignSpec = null } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: 'title and description are required.' });

  try {
    // Reuse the cached design spec on improvement iterations to save a Gemini call
    const designSpec = (iteration > 0 && cachedDesignSpec)
      ? cachedDesignSpec
      : await callGeminiDesigner(websiteType, description, features);

    // Compress accumulated improvements once they grow past 2 entries
    let effectiveImprovements = improvements;
    if (improvements.length > 2) {
      const { text: compressed } = await headroomCompress(
        improvements.join('\n---\n'), 'improvements→Gemini'
      );
      effectiveImprovements = [compressed];
    }

    // Generate frontend first so Claude can see which API routes it calls
    const frontendHtml = await callGeminiFrontend(title, description, websiteType, features, effectiveImprovements, designSpec);
    const backendJs = await generateBackendCode(description, websiteType, frontendHtml);

    if (!frontendHtml.includes('<!DOCTYPE') && !frontendHtml.includes('<html'))
      return res.status(500).json({ error: 'Frontend generation failed. Please try again.' });

    const message = iteration === 0
      ? "Webeneering is done. Gemini designed the frontend and Claude built the backend. What would you like to improve?"
      : iteration === 1
        ? "Updated. What else would you like to change?"
        : "Here's the refined version. Ready to download?";

    const suggestions = iteration === 0
      ? ['Change the color scheme', 'Make it darker', 'Add a pricing section', 'Add testimonials', 'Simplify the layout', 'Change the fonts']
      : ['Adjust the hero section', 'Change button styles', 'Make it more minimal', 'Add more sections', 'Change the footer'];

    res.json({ html: frontendHtml, backendJs, message, suggestions, designSpec: designSpec || null });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

// ── Download pre-generated project as ZIP ────────────────────────────────────
app.post('/download', async (req, res) => {
  const { html, backendJs, description = 'my website', websiteType = 'business' } = req.body || {};
  if (!html) return res.status(400).json({ error: 'html is required.' });

  try {
    const slug = (description.split(' ').slice(0, 3).join('-')).replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'webeneering-site';
    const packageJson = JSON.stringify({
      name: slug, version: '1.0.0', description,
      main: 'server.js',
      scripts: { start: 'node server.js', dev: 'node --watch server.js' },
      dependencies: { express: '^4.19.2', dotenv: '^16.4.5' },
    }, null, 2);

    const finalBackend = backendJs || buildFallbackBackend();
    const readme = buildReadme(description, websiteType, slug);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => console.error('Archive error:', err));
    archive.pipe(res);
    archive.append(html,          { name: `${slug}/public/index.html` });
    archive.append(finalBackend,  { name: `${slug}/server.js` });
    archive.append(packageJson,   { name: `${slug}/package.json` });
    archive.append(readme,        { name: `${slug}/README.md` });
    archive.append('PORT=3000\n', { name: `${slug}/.env.example` });
    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

// ── Legacy single-page generate ──────────────────────────────────────────────
app.post('/generate', async (req, res) => {
  const { name, description, features } = req.body || {};
  if (!name || !description || !features)
    return res.status(400).json({ error: 'name, description, and features are required.' });
  try {
    const designSpec = await callGeminiDesigner(name, description, features);
    const [pageMsg, svgMsg] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', max_tokens: 8000,
        messages: [{ role: 'user', content: buildFrontendPrompt(name, description, features, designSpec) }],
      }),
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', max_tokens: 2000,
        messages: [{ role: 'user', content: buildHeroSvgPrompt(description, name, designSpec) }],
      }),
    ]);
    let html = clean(pageMsg.content[0]?.text || '');
    if (!html.includes('<!DOCTYPE') && !html.includes('<html'))
      return res.status(500).json({ error: 'Claude returned unexpected content.' });
    const heroSvg = clean(svgMsg.content[0]?.text || '');
    if (heroSvg.includes('<svg')) html = html.replace('<!--HERO_SVG-->', heroSvg);
    res.json({ html, designSpec });
  } catch (err) { res.status(500).json({ error: err?.message || 'Unknown error' }); }
});

// ── SVG graphic generator ─────────────────────────────────────────────────────
app.post('/generate-graphic', async (req, res) => {
  const { description, type, style } = req.body || {};
  if (!description) return res.status(400).json({ error: 'description is required.' });
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 4000,
      messages: [{ role: 'user', content: buildGraphicPrompt(description, type, style) }],
    });
    let svg = clean(message.content[0]?.text || '').replace(/^<\?xml[^>]*\?>\s*/i, '').trim();
    if (!svg.includes('<svg')) return res.status(500).json({ error: 'Graphic generation failed.' });
    res.json({ svg });
  } catch (err) { res.status(500).json({ error: err?.message || 'Unknown error' }); }
});

// ── Gemini UI/UX Design Agent ─────────────────────────────────────────────────
async function callGeminiDesigner(title, description, extras) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const GEMINI_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    let result, lastErr;
    const prompt = buildGeminiDesignPrompt(title, description, extras);
    for (const modelName of GEMINI_MODELS) {
      try {
        result = await gemini.getGenerativeModel({ model: modelName }).generateContent(prompt);
        break;
      } catch (e) {
        lastErr = e;
        if (!e.message?.includes('429') && !e.message?.includes('quota') && !e.message?.includes('503')) throw e;
      }
    }
    if (!result) throw lastErr;
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    console.log('✅ Gemini design spec generated');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn('⚠️  Gemini fallback:', err.message?.split('\n')[0]);
    return null;
  }
}

// ── Gemini Frontend Agent ─────────────────────────────────────────────────────
async function callGeminiFrontend(title, description, websiteType, features, improvements, designSpec) {
  if (!process.env.GEMINI_API_KEY) {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 8000,
      messages: [{ role: 'user', content: buildConversationalPrompt(description, websiteType, improvements, designSpec) }],
    });
    return clean(msg.content[0]?.text || '');
  }

  const rawPrompt = buildGeminiFrontendPrompt(title, description, websiteType, features, improvements, designSpec);
  const { text: prompt } = await headroomCompress(rawPrompt, 'prompt→Gemini');
  const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  let result, lastErr;

  for (const modelName of MODELS) {
    try {
      const model = gemini.getGenerativeModel({ model: modelName, generationConfig: { maxOutputTokens: 8192 } });
      result = await model.generateContent(prompt);
      console.log(`✅ Gemini frontend generated (${modelName})${HEADROOM_ENABLED ? ' [Headroom]' : ''}`);
      break;
    } catch (e) {
      lastErr = e;
      console.warn(`⚠️  Gemini ${modelName} failed: ${e.message?.slice(0, 120)}`);
    }
  }
  if (!result) throw lastErr;
  return clean(result.response.text().trim());
}

// ── Headroom compression helper ──────────────────────────────────────────────
// Compresses a plain-text string before it reaches a model.
// Returns { text: string, tokensSaved: number }.
// Falls back to the original text if Headroom is unconfigured or the proxy is down.
// CCR is disabled: user-generated code is never written to disk by Headroom.
async function headroomCompress(text, label) {
  if (!HEADROOM_ENABLED) return { text, tokensSaved: 0 };
  try {
    const result = await hrCompress(
      [{ role: 'user', content: text }],
      {
        model: 'claude-haiku-4-5-20251001',
        baseUrl: HEADROOM_URL,
        fallback: true,
        timeout: 6000,
        config: { ccr: { enabled: false } },
      }
    );
    const compressed = typeof result.messages?.[0]?.content === 'string'
      ? result.messages[0].content
      : text;
    const saved  = result.tokensSaved    || 0;
    const ratio  = result.compressionRatio;
    if (saved > 0) {
      const pct = ratio != null ? ((1 - ratio) * 100).toFixed(0) : '?';
      console.log(`🗜  Headroom [${label}]: ${saved} tokens saved (${pct}% reduction)`);
    }
    return { text: compressed, tokensSaved: saved };
  } catch (err) {
    console.warn(`⚠️  Headroom unavailable [${label}]: ${err.message?.split('\n')[0]}`);
    return { text, tokensSaved: 0 };
  }
}

async function generateBackendCode(description, websiteType, frontendHtml) {
  const systemPrompt = `You are a senior Node.js/Express.js backend engineer. Generate complete, immediately-runnable backend servers. Output raw JavaScript only — no markdown, no code fences, no explanations.

REQUIRED STRUCTURE (in this exact order):
1. require('dotenv').config();
2. const express = require('express'); const fs = require('fs'); const path = require('path');
3. const app = express();
4. Middleware: express.json(), urlencoded, static from 'public', CORS headers
5. Helper functions: readData(filename) and writeData(filename, data)
6. All routes with try/catch on every handler
7. initData() function called immediately to seed sample data
8. app.listen(PORT)

MIDDLEWARE (include exactly):
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

HELPER FUNCTIONS (always define before routes):
function readData(filename) {
  try {
    const fp = path.join(__dirname, 'data', filename);
    return fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, 'utf8')) : [];
  } catch { return []; }
}
function writeData(filename, data) {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2));
}

ROUTE RULES:
- Every handler wrapped in try/catch
- POST: validate required fields first, return res.status(400).json({ error: '...' }) if missing
- Trim all string inputs: name.trim(), email.trim()
- GET success: return array/object directly (never wrap in { data: ... })
- POST success: return { ok: true }
- Errors: { error: 'descriptive message' } with 400 or 500 status
- ID generation: const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;

SAMPLE DATA RULES:
- 4-8 realistic records with real-sounding names, descriptions, and prices
- Match the business type exactly

STARTUP:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running at http://localhost:' + PORT));

PROHIBITIONS:
- No ES modules (import/export) — CommonJS only
- No TypeScript, no JSDoc
- No async file operations — synchronous fs only
- No external DB packages (mongoose, pg, sqlite3)
- No auth packages (bcrypt, jsonwebtoken, passport)
- No TODO comments or unimplemented stubs
- Output starts with require('dotenv').config() — nothing before it`;

  // Build prompt first (URL extraction from HTML happens here), then compress
  const fullUserPrompt = buildFunctionalBackendPrompt(description, websiteType, frontendHtml);
  const { text: userPrompt } = await headroomCompress(fullUserPrompt, 'HTML→Claude');

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  });
  console.log('✅ Claude Haiku backend generated');
  return clean(msg.content[0]?.text || '');
}

function buildFallbackBackend() {
  return `require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  const msgs = fs.existsSync('data/messages.json') ? JSON.parse(fs.readFileSync('data/messages.json')) : [];
  msgs.push({ name, email, message, date: new Date().toISOString() });
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/messages.json', JSON.stringify(msgs, null, 2));
  res.json({ ok: true });
});
app.listen(process.env.PORT || 3000, () => console.log('Running on http://localhost:' + (process.env.PORT || 3000)));
`;
}

// ── Prompts ───────────────────────────────────────────────────────────────────
function buildGeminiDesignPrompt(title, description, extras) {
  return `You are a senior UI/UX designer. Analyze this brief and return a design JSON.

PROJECT: ${title}
DESCRIPTION: ${description}
EXTRAS: ${extras}

Return ONLY this JSON (no markdown):
{
  "theme": "light or dark",
  "palette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "surface": "#hex", "text": "#hex" },
  "gradients": { "hero": "CSS gradient", "button": "CSS gradient", "card": "CSS gradient" },
  "typography": { "heading": "Google Font name", "body": "Google Font or system-ui", "headingWeight": "700 or 800", "style": "modern|elegant|playful|bold|minimal" },
  "mood": "2-sentence visual mood",
  "heroStyle": "hero section description",
  "borderRadius": "4px|8px|16px|24px",
  "spacing": "compact|comfortable|spacious"
}`;
}

function buildGeminiFrontendPrompt(title, description, websiteType, features, improvements, designSpec) {
  const p    = designSpec?.palette?.primary    || '#7c3aed';
  const sec  = designSpec?.palette?.secondary  || '#db2777';
  const bg   = designSpec?.palette?.background || '#ffffff';
  const font = designSpec?.typography?.heading  || 'Inter';
  const improvementText = improvements.length
    ? `\nAPPLY ALL OF THESE IMPROVEMENTS:\n${improvements.map(i => `• ${i}`).join('\n')}`
    : '';

  const apiRoutes = {
    restaurant: 'fetch /api/menu → menu grid; POST /api/reserve {name,email,date,time,guests}',
    portfolio:  'fetch /api/projects → projects grid; POST /api/contact {name,email,message}',
    store:      'fetch /api/products → products grid; POST /api/order {name,email,items}',
    blog:       'fetch /api/posts → posts grid; POST /api/subscribe {email}',
    booking:    'fetch /api/slots → services; POST /api/book {name,email,date,time,service}',
    business:   'POST /api/contact {name,email,message}',
    event:      'POST /api/rsvp {name,email}; JS countdown timer',
    saas:       'fetch /api/features → features grid; POST /api/waitlist {email}',
  }[websiteType] || 'POST /api/contact {name,email,message}';

  const sectionMap = {
    restaurant: 'Nav, Hero+SVG, MenuGrid, ReservationForm, Footer',
    portfolio:  'Nav, Hero+SVG, ProjectsGrid, Skills, ContactForm, Footer',
    store:      'Nav, Hero+SVG, ProductsGrid, CartSummary, Footer',
    blog:       'Nav, Hero+SVG, PostsGrid, SubscribeForm, Footer',
    booking:    'Nav, Hero+SVG, ServicesGrid, BookingForm, Footer',
    business:   'Nav, Hero+SVG, Services(6 cards), Testimonials(3), ContactForm, Footer',
    event:      'Nav, Hero+Countdown+SVG, Speakers, RSVPForm, Footer',
    saas:       'Nav, Hero+SVG, Features(6 icons), Pricing(3 tiers), WaitlistForm, Footer',
  }[websiteType] || 'Nav, Hero+SVG, Features, ContactForm, Footer';

  return `You are a senior UI/UX designer and frontend developer. Create a stunning, professional ${websiteType} website.

PROJECT TITLE: ${title}
DESCRIPTION: ${description}
FEATURES: ${features || 'standard features for this type of site'}${improvementText}

DESIGN SPEC:
Primary: ${p} | Secondary: ${sec} | Background: ${bg}
Heading font: ${font} | Theme: ${designSpec?.theme || 'light'} | Mood: ${designSpec?.mood || 'modern professional'}
Border radius: ${designSpec?.borderRadius || '8px'} | Spacing: ${designSpec?.spacing || 'comfortable'}

HEAD SETUP (use exactly):
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{colors:{brand:"${p}",accent:"${sec}"}}}}</script>
<link href="https://fonts.googleapis.com/css2?family=${font.replace(/ /g,'+')}:wght@400;600;700;800&display=swap" rel="stylesheet">

SECTIONS (in order): ${sectionMap}

HERO ILLUSTRATION RULES (you own this — make it great):
• Create an inline <svg viewBox="0 0 420 340" width="420" height="340"> illustration in the hero right column
• Multi-element, rich composition matching the business: "${description}"
• Use gradients from ${p} to ${sec}; use <defs> for gradients and filters
• No text inside the SVG; visual elements only

FEATURE ICONS: Inline SVG icons (24x24) for each feature card — unique, stroke-based, matching brand colors

API INTEGRATION: ${apiRoutes}

CODING RULES (must follow):
• Tailwind CDN only — zero custom CSS, zero <style> tags
• Hero bg: style="background:linear-gradient(135deg,${p},${sec})" with white text
• CTA buttons: style with gradient background, rounded-full, px-8 py-3, font-bold, white text
• Cards: bg-white rounded-2xl shadow-lg p-6
• All forms: preventDefault → disable submit btn → fetch JSON to /api/route → show ✅ success or ❌ error inline
• GET data grids: DOMContentLoaded → fetch → render; show "Loading…" placeholder first
• Nav: logo left, links right, hamburger mobile toggle
• Scroll animations: IntersectionObserver, each section fades up on enter
• NO comments, NO blank lines between tags, keep HTML tight

Output ONLY the raw HTML from <!DOCTYPE html> to </html>. No markdown. No code fences. No explanation.`;
}

function buildConversationalPrompt(description, websiteType, improvements, designSpec) {
  const improvementText = improvements.length > 0
    ? `\nUSER IMPROVEMENTS (apply all):\n${improvements.map(i => `• ${i}`).join('\n')}`
    : '';

  const p    = designSpec?.palette?.primary    || '#7c3aed';
  const sec  = designSpec?.palette?.secondary  || '#db2777';
  const bg   = designSpec?.palette?.background || '#ffffff';
  const font = designSpec?.typography?.heading  || 'Inter';

  const apiRoutes = {
    restaurant: 'fetch /api/menu → menu grid; POST /api/reserve {name,email,date,time,guests}',
    portfolio:  'fetch /api/projects → projects grid; POST /api/contact {name,email,message}',
    store:      'fetch /api/products → products grid; POST /api/order {name,email,items}',
    blog:       'fetch /api/posts → posts grid; POST /api/subscribe {email}',
    booking:    'fetch /api/slots → services; POST /api/book {name,email,date,time,service}',
    business:   'POST /api/contact {name,email,message}',
    event:      'POST /api/rsvp {name,email}; JS countdown timer to event date',
    saas:       'POST /api/contact {name,email,message}',
  }[websiteType] || 'POST /api/contact {name,email,message}';

  const sectionList = {
    restaurant: 'Nav, Hero(<!--HERO_SVG-->), MenuGrid, ReservationForm, Footer',
    portfolio:  'Nav, Hero(<!--HERO_SVG-->), ProjectsGrid, Skills, ContactForm, Footer',
    store:      'Nav, Hero(<!--HERO_SVG-->), ProductsGrid, ContactForm, Footer',
    blog:       'Nav, Hero(<!--HERO_SVG-->), PostsGrid, SubscribeForm, Footer',
    booking:    'Nav, Hero(<!--HERO_SVG-->), ServicesGrid, BookingForm, Footer',
    business:   'Nav, Hero(<!--HERO_SVG-->), Services, Testimonials, ContactForm, Footer',
    event:      'Nav, Hero+Countdown(<!--HERO_SVG-->), Speakers, RSVPForm, Footer',
    saas:       'Nav, Hero(<!--HERO_SVG-->), Features(6 icons), Pricing(3 tiers), ContactForm, Footer',
  }[websiteType] || 'Nav, Hero(<!--HERO_SVG-->), Features, ContactForm, Footer';

  return `Build a ${websiteType} website. Use Tailwind CSS CDN only — zero custom CSS.
BRIEF: ${description}${improvementText}

HEAD:
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{colors:{brand:"${p}",accent:"${sec}"}}}}</script>
<link href="https://fonts.googleapis.com/css2?family=${font.replace(/ /g,'+')}:wght@400;700&display=swap" rel="stylesheet">

BRAND: primary=${p} accent=${sec} bg=${bg}
SECTIONS (in order): ${sectionList}
API: ${apiRoutes}

RULES — MUST FOLLOW:
• Hero bg: style="background:linear-gradient(135deg,${p},${sec})" — text white
• CTA buttons: same gradient, rounded-full px-8 py-3 font-bold
• Cards: bg-white rounded-2xl shadow-lg p-6
• Forms: preventDefault, disable btn, fetch JSON to /api/route, show ✅/❌ inline
• Data grids: DOMContentLoaded → fetch GET → render. Show "Loading…" placeholder div first
• Nav: logo left, links right, hamburger on mobile (toggle class)
• KEEP EVERY SECTION SHORT — max 20 lines of HTML each
• NO comments, NO blank lines between tags, NO verbose class strings — keep HTML tight

Output ONLY <!DOCTYPE html>…</html>. No markdown. No code fences.`;
}

function buildFunctionalBackendPrompt(description, websiteType, frontendHtml) {
  // Extract fetch() API URLs the frontend uses so Claude implements matching routes
  const detectedRoutes = [];
  if (frontendHtml) {
    const fetchMatches = frontendHtml.match(/fetch\s*\(\s*['"`](\/api\/[^'"`?#]+)['"`]/g) || [];
    fetchMatches.forEach(m => {
      const url = m.match(/\/api\/[^'"`?#]+/)?.[0];
      if (url && !detectedRoutes.includes(url)) detectedRoutes.push(url);
    });
  }
  const routeHint = detectedRoutes.length > 0
    ? `\nFRONTEND USES THESE EXACT API ROUTES (implement all of them):\n${detectedRoutes.map(u => `- ${u}`).join('\n')}\n`
    : '';

  const routes = {
    restaurant: `
- GET  /api/menu          → read data/data.json and return items array
- POST /api/reserve        → accept {name,email,date,time,guests}, append to data/reservations.json, return {ok:true}
- POST /api/contact        → accept {name,email,message}, append to data/messages.json, return {ok:true}`,
    portfolio: `
- GET  /api/projects       → read data/data.json and return projects array
- POST /api/contact        → accept {name,email,message}, append to data/messages.json, return {ok:true}`,
    store: `
- GET  /api/products       → read data/data.json and return products array
- POST /api/order          → accept {name,email,items,total}, append to data/orders.json, return {ok:true,orderId}`,
    blog: `
- GET  /api/posts          → read data/data.json and return posts array
- GET  /api/posts/:id      → return single post by id
- POST /api/subscribe      → accept {email}, append to data/subscribers.json, return {ok:true}`,
    booking: `
- GET  /api/slots          → return available time slots from data/data.json
- POST /api/book           → accept {name,email,date,time,service}, mark slot as booked, append to data/bookings.json, return {ok:true,bookingId}
- POST /api/contact        → accept {name,email,message}, append to data/messages.json, return {ok:true}`,
  }[websiteType] || `
- GET  /api/items          → read data/data.json and return items array
- POST /api/contact        → accept {name,email,message}, append to data/messages.json, return {ok:true}`;

  return `Generate a complete Node.js Express backend for a ${websiteType} website: "${description}"
${routeHint}
ROUTES TO IMPLEMENT:${routes}

REQUIREMENTS:
- require('dotenv').config() at top
- Serve static files from "public" folder
- Use fs.readFileSync / fs.writeFileSync with JSON for data persistence
- Create data directory if it doesn't exist (fs.mkdirSync)
- Proper error handling with try/catch on every route
- CORS headers: res.setHeader('Access-Control-Allow-Origin', '*')
- Listen on process.env.PORT || 3000, log the URL
- Seed data.json with 4-8 realistic sample records on first run

Output ONLY raw JavaScript. No markdown, no code fences.`;
}

function buildSampleDataPrompt(description, websiteType) {
  const dataShape = {
    restaurant: '{"items": [{"id":1,"name":"Margherita Pizza","category":"Pizza","price":14.99,"description":"Fresh tomato, mozzarella, basil","emoji":"🍕"},{"id":2,"name":"Pasta Carbonara","category":"Pasta","price":16.99,"description":"Creamy egg sauce, pancetta, parmesan","emoji":"🍝"},{"id":3,"name":"Caesar Salad","category":"Salads","price":11.99,"description":"Romaine, croutons, Caesar dressing","emoji":"🥗"},{"id":4,"name":"Tiramisu","category":"Desserts","price":7.99,"description":"Classic Italian dessert","emoji":"☕"}]}',
    portfolio:  '{"projects": [{"id":1,"title":"Brand Identity Design","category":"Branding","description":"Complete visual identity for a tech startup","year":2024,"tags":["Logo","Colors","Typography"]},{"id":2,"title":"E-commerce Website","category":"Web Design","description":"Full redesign of an online clothing store","year":2024,"tags":["UI","UX","Figma"]},{"id":3,"title":"Mobile App UI","category":"App Design","description":"iOS app for a fitness tracking platform","year":2023,"tags":["Mobile","iOS","Prototype"]}]}',
    store:      '{"products": [{"id":1,"name":"Classic Tee","price":29.99,"category":"Tops","description":"Premium cotton everyday tee","badge":"Bestseller"},{"id":2,"name":"Slim Jeans","price":79.99,"category":"Bottoms","description":"Modern slim fit denim","badge":"New"},{"id":3,"name":"Canvas Sneakers","price":59.99,"category":"Footwear","description":"Lightweight all-day comfort","badge":""},{"id":4,"name":"Leather Bag","price":129.99,"category":"Accessories","description":"Genuine leather tote bag","badge":"Popular"}]}',
    blog:       '{"posts": [{"id":1,"title":"10 Tips for a Productive Morning Routine","category":"Lifestyle","date":"2024-06-01","excerpt":"Start your day right with these proven strategies...","readTime":"5 min"},{"id":2,"title":"The Future of Remote Work","category":"Tech","date":"2024-05-28","excerpt":"How distributed teams are reshaping the workplace...","readTime":"7 min"},{"id":3,"title":"Healthy Eating on a Budget","category":"Health","date":"2024-05-20","excerpt":"Nutritious meals that won\'t break the bank...","readTime":"4 min"}]}',
    booking:    '{"slots": [{"id":1,"service":"Consultation","duration":60,"price":80,"available":true},{"id":2,"service":"Full Session","duration":90,"price":120,"available":true},{"id":3,"service":"Follow-up","duration":30,"price":50,"available":true}]}',
  }[websiteType] || `{"items": [{"id":1,"name":"Service One","description":"Our flagship offering","price":"From $99"},{"id":2,"name":"Service Two","description":"Premium package","price":"From $199"},{"id":3,"name":"Service Three","description":"Enterprise solution","price":"Custom"}]}`;

  return `Generate realistic sample data JSON for a ${websiteType} website about: "${description}".
Base it on this structure but customize names, descriptions, and details to match the specific business.
Return ONLY valid JSON. No markdown, no explanation.
Template: ${dataShape}`;
}

function buildReadme(description, websiteType, slug) {
  return `# ${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}

${description}

## Quick Start (Local)

\`\`\`bash
npm install
cp .env.example .env
npm start
\`\`\`

Open **http://localhost:3000**

## Project Structure

\`\`\`
├── server.js          Express backend
├── public/
│   └── index.html     Frontend
├── data/
│   └── data.json      Sample data (replace with your real data)
├── package.json
└── .env.example
\`\`\`

## Deploy to Render.com (Free — 5 minutes)

1. Push this folder to a GitHub repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Build command: \`npm install\`
5. Start command: \`node server.js\`
6. Click Deploy — your site is live!

## Deploy to Railway (With Database)

1. Install Railway CLI: \`npm install -g @railway/cli\`
2. \`railway login\`
3. \`railway init\` (in this folder)
4. \`railway up\`
5. Add a PostgreSQL or MongoDB plugin in the Railway dashboard

## Connect a Real Database

Replace the JSON file storage in \`server.js\` with:

**MongoDB Atlas (Free):**
\`\`\`bash
npm install mongoose
\`\`\`

**PostgreSQL (Railway/Supabase):**
\`\`\`bash
npm install pg
\`\`\`

See \`server.js\` — each route that reads/writes \`data/*.json\` is clearly marked.
Replace those sections with your database queries.
`;
}

function buildFrontendPrompt(title, description, featuresRaw, designSpec) {
  const features = featuresRaw.split('\n').map(f => f.trim()).filter(Boolean).join(', ');
  const designCtx = designSpec ? `
=== DESIGN (Gemini) ===
Theme: ${designSpec.theme}, Primary: ${designSpec.palette?.primary}, Secondary: ${designSpec.palette?.secondary}
Hero gradient: ${designSpec.gradients?.hero}, Button: ${designSpec.gradients?.button}
Font: ${designSpec.typography?.heading} from Google Fonts` : `=== DESIGN ===\nUse vibrant gradients, not plain black/white.`;

  return `Generate a complete landing page for "${title}": ${description}. Features: ${features}.
${designCtx}
SECTIONS: Hero (two-col, right = <!--HERO_SVG-->), Features with SVG icons, Testimonials, Footer.
TECHNICAL: Mobile responsive, Google Fonts, all inline CSS/JS, scroll animations, contact form with fetch().
Output ONLY raw HTML from <!DOCTYPE html> to </html>.`;
}

function buildHeroSvgPrompt(description, title, designSpec) {
  const primary   = designSpec?.palette?.primary   || '#8b5cf6';
  const secondary = designSpec?.palette?.secondary || '#ec4899';
  return `Create a hero illustration SVG for: "${title}" — ${description}
Choose the illustration style that best fits the business type:
- Creator/media agency → video cards, phone screens, social media elements
- SaaS/tech → floating UI cards, dashboard elements, abstract data viz
- Restaurant/food → food items, plates, steam, chef elements
- Portfolio/design → creative tools, frames, color palettes
- Fitness/health → organic curves, motion lines, body/nature shapes
- E-commerce → product cards, shopping bags, tags
- Real estate → building outlines, keys, home shapes
viewBox="0 0 420 340" width="420" height="340". Brand colors: primary=${primary}, secondary=${secondary}.
Use gradients from these colors. Rich multi-element illustration, no text inside SVG.
Output ONLY raw <svg...> to </svg>. No markdown.`;
}

function buildGraphicPrompt(description, type = 'illustration', style = 'colorful') {
  return `Create a ${type} SVG (${style} style) for: "${description}".
viewBox="0 0 400 300". Valid SVG with xmlns, use defs for gradients, vibrant colors, no external resources.
Output ONLY raw SVG starting with <svg. No markdown.`;
}

function clean(text) {
  return text.replace(/^```html\s*/i,'').replace(/^```javascript\s*/i,'').replace(/^```svg\s*/i,'')
    .replace(/^```xml\s*/i,'').replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
}

// Local development: start the server directly
// Vercel: imports this file as a module, skips listen, uses module.exports = app
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n✅  Server running at http://localhost:${PORT}`);
    console.log(`   🚀  Webeneering      : http://localhost:${PORT}/webeneering.html`);
    console.log(`   🏗️  Builder (legacy) : http://localhost:${PORT}/builder.html`);
    console.log(`   ⚡  Generator (legacy): http://localhost:${PORT}/generator.html`);
    console.log(`   Gemini (UI/UX):  ${process.env.GEMINI_API_KEY ? '✅ active' : '⚠️  not configured'}`);
    console.log(`   Claude (Backend): Haiku 4.5\n`);
  });
}

module.exports = app;
