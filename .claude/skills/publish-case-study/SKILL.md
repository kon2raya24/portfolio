---
name: publish-case-study
description: Publish a new case study end-to-end — write the HTML, generate the OG card, generate a mock screenshot, wire it into the index work-tree + hero stat + sitemap + feed.xml, bump sw.js VERSION, then chain into the update-resume skill. Use this whenever a new project is ready to ship as a public case study, or when promoting a DRAFT to LIVE. Encodes the conventions established across the 8 existing case studies so the 9th doesn't drift.
---

# publish-case-study

End-to-end publish ritual for a new case study. Run this when a project is ready to leave DRAFT or arrive fresh. Follows the conventions every existing case study already uses — don't reinvent.

## Order of operations

1. **Write** `case-studies/{slug}.html`
2. **Generate OG card** → `images/og-{slug}.png` (1200×630)
3. **Generate mock screenshot** → `images/shot-{slug}.png` (1600×900)
4. **Wire into `index.html`** — add work-tree entry, bump hero "Case Studies" stat
5. **Update `sitemap.xml`** — add the new URL
6. **Add feed.xml entry** — `v4.x` item near the top
7. **Bump `sw.js` VERSION**
8. **Invoke `update-resume` skill** — keep the resume in sync

Stop at step 8. Commit locally. Ask the user before pushing.

---

## 1. The case study HTML

Use an existing case study as the template — pick the closest in shape:
- **Dashboard / table view** → mirror `case-studies/pamanaland.html`
- **Mobile / hardware integration** → mirror `case-studies/wms.html`
- **AI / agent pipeline** → mirror `case-studies/ai-engineer.html`
- **Documentation / meta-engineering** → mirror `case-studies/llm-wiki.html`
- **Active rewrite with architecture story** → mirror `case-studies/wms-v2.html`

Required `<head>` boilerplate (copy from any existing study):
- Theme-bootstrap inline script (`document.documentElement.setAttribute('data-theme', ...)`)
- `<link rel="canonical">` pointing to `https://kon2raya.netlify.app/case-studies/{slug}.html`
- `<meta name="robots" content="index, follow">`
- Full `og:` + `twitter:` meta with the new OG image path
- Google Fonts preconnect + `case-study.css` stylesheet

Required body structure (in order):
1. `<nav class="cs-nav">` — back-to-portfolio breadcrumb
2. `<header class="cs-hero">` with:
   - `.cs-hero__label` (always `// case-study.md`)
   - `<h1>` with subtitle in cyan span
   - `.cs-hero__tagline` — 2–3 sentences positioning the work
   - `.cs-meta` block with **client** (NDA-framed), **role**, **period**, **status**, **scope** (counts)
   - `.cs-hero__chips` — 6–10 tech chips, use `cs-chip--ai` for AI/LLM ones
3. Sections in this order: `tl;dr` → `problem` → `approach` → `solution` (with code sample + `<figure class="cs-shot-real">`) → `stack` → `outcome` (4 metric tiles) → `lessons` (worked well + would tighten)
4. `<aside class="cs-cta">` close-out

### Anonymization rules (always)

- **Client name**: never appears in the body. Hero meta uses `<span class="cs-meta__v">Confidential &middot; <descriptor> under NDA</span>`.
- **Live URLs**: never linked. Replace with phrases like "access-gated tenant portal" or "internal operations system".
- **Customer / payee / employee names in code samples**: redact with `████` block characters.
- **Repo links**: only if the repo is on the user's own personal GitHub (`github.com/kon2raya24/...`) AND the repo name doesn't reveal the client.
- **Resume employer names are different** — those stay (resume convention). The case study and the resume diverge on this intentionally.

### Code samples

Use the `cs-code` block pattern (see `pamanaland.html` lines 148–166 for the canonical shape). Tokens: `tk-key`, `tk-fn`, `tk-str`, `tk-num`, `tk-punct`, `tk-cmt`. File path goes in `cs-code__file` with `<span class="active">` on the active part.

### Mock screenshot embed

Use `<figure class="cs-shot-real">` (defined in `css/case-study.css`):

```html
<figure class="cs-shot-real">
  <img src="../images/shot-{slug}.png" alt="..." loading="lazy" decoding="async">
  <figcaption><span class="tag">MOCK</span>...descriptive context...</figcaption>
</figure>
```

`alt` text is for screen readers; `figcaption` always opens with the `<span class="tag">MOCK</span>` chip so a recruiter can't mistake the render for a literal product capture.

---

## 2. OG card generation

1200×630 PNG, cyber-themed (browser chrome dots + accent grid + brand mark). The pattern is in `c:\xampp\htdocs\portfolio\images\og-*.png` already — copy any of the existing PowerShell scripts I've used and change:
- `Title`
- `Subtitle`
- `Tagline`
- `Chips` (5–7 tech chips)
- `AccentHex` (see palette below)

### Accent color palette (don't reinvent)

| Family | Accent | Existing studies |
|---|---|---|
| Logistics / Inventory (WMS, TMS, WMS v2) | `#00e5ff` cyan | wms, tms, wms-v2 |
| Real-estate / commercial ops | `#00e5ff` cyan or `#ff2bd6` magenta | pamanaland (cyan), jbc (magenta) |
| AI / autonomy / meta-engineering | `#ff2bd6` magenta | ai-engineer, llm-wiki |
| HR / employee | `#ff9000` brand orange | hris |
| WMS family secondary | `#7cff8c` green | wms (mobile picking) |

Pick the family, use its accent. Don't introduce a new color unless the new study genuinely opens a new domain.

PowerShell skeleton: see any commit that touched `images/og-*.png` (`git log -- images/og-tms.png`).

---

## 3. Mock screenshot generation

1600×900 PNG. Pick the right template:

- **Dashboard / table view** (most common) — copy the structure from `images/shot-pamanaland-releases.png`. Browser chrome → dark sidebar nav with active highlight → header with breadcrumb → filter bar → AG-Grid-style table with status pills, redacted text.
- **Phone-frame mobile screen** — copy `images/shot-wms-picking.png`. Dark cyber backdrop + bullet feature list on the left + phone bezel on the right with app UI inside.
- **Terminal session** — copy `images/shot-ai-engineer.png`. Dark cyber backdrop + feature list on the left + macOS terminal window on the right with realistic command output.
- **Documentation tool** (Obsidian / Notion style) — copy `images/shot-llm-wiki.png`. Top bar + left file tree + right open-page with frontmatter block + body render.
- **Web admin with canonical pattern callouts** — copy `images/shot-wms-v2.png`.

Always end with a watermark line in `Consolas Italic`:

```
// case-study mock · <what's anonymized>
```

Common watermarks already in use: `data anonymized`, `payee names anonymized`, `SKU and lot codes anonymized`, `customer + route data anonymized`, `ticket and file names anonymized`, `source paths anonymized`.

---

## 4. Wire into `index.html`

### Work-tree (around line 1490–1550)

Add a `<li>` entry above the PLANNED Uratex line, in slug order. Pattern:

```html
<li>
    <span class="case-tree">├─</span>
    <a class="case-name case-name--link" href="case-studies/{slug}.html">{kebab-slug}/</a>
    <span class="case-tags">
        <span class="exp-chip">{Tech 1}</span>
        <span class="exp-chip">{Tech 2}</span>
        <span class="exp-chip">{Tech 3}</span>
    </span>
    <a class="case-status case-status--live" href="case-studies/{slug}.html">LIVE &middot; read writeup &rarr;</a>
</li>
```

Update the **last entry above the new one** to use `├─` if it was previously `└─`, and the new entry to `└─` only if it's the very last LIVE row.

### Hero stat

Find the `data-count="N"` for `Case Studies` in `index.html` (around line 175). Bump `N` to the new total.

### "Shipped impact" praise card (optional)

If the new study is genuinely distinctive (new domain, flagship work, AI/agent angle), consider swapping it into the 3-card praise pane (around line 1568–1655). Keep the pane at 3 cards — swap, don't append. Current rotation: Pamanaland, WMS, AI Engineer.

---

## 5. `sitemap.xml`

Add a `<url>` block. Standard:

```xml
<url>
    <loc>https://kon2raya.netlify.app/case-studies/{slug}.html</loc>
    <lastmod>YYYY-MM-DD</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
</url>
```

**Priority 0.95** only if the study is a flagship signal (AI/agent work, novel meta-engineering). Otherwise 0.9.

---

## 6. `feed.xml`

Add an `<item>` near the top (above the most recent existing entry). Increment `v4.x`. Pattern:

```xml
<item>
    <title>v4.X — {short headline}</title>
    <link>https://kon2raya.netlify.app/case-studies/{slug}.html</link>
    <guid isPermaLink="false">portfolio-v4.X-YYYY-MM-DD</guid>
    <pubDate>Day, DD Mon YYYY HH:MM:SS +0800</pubDate>
    <category>case-study</category>
    <description><![CDATA[
      {2-3 sentences. Lead with the most distinctive technical detail.
      Include the scope numbers if they're meaningful (model count,
      migration count, page count, model selector list, etc.).}
    ]]></description>
</item>
```

Voice: technical, specific, no marketing. The feed is for developers.

---

## 7. Bump `sw.js`

```js
const VERSION = 'pf-vN+1-YYYY-MM-DD';
```

So the new HTML / images / etc. don't get served stale from the SW cache on first reload.

---

## 8. Chain into `update-resume`

After steps 1–7 are complete, invoke the **`update-resume`** skill (defined at `.claude/skills/update-resume/SKILL.md`). New case study → new `projects[]` entry in `resume.json` + new `<article class="project">` in `resume-ats.html` + PDF regen + SW bump.

---

## Verification checklist before commit

- [ ] HTML opens cleanly in a browser; theme toggle works on the page; no console errors.
- [ ] OG image renders correctly (open it directly to eyeball — 1200×630, accent color matches family).
- [ ] Mock screenshot has the `// case-study mock` watermark visible.
- [ ] Index work-tree shows the new LIVE entry with correct chips + slug.
- [ ] Hero "Case Studies" stat shows the new total when reloaded.
- [ ] `sitemap.xml` validates as XML (well-formed `<urlset>`).
- [ ] `feed.xml` validates as RSS (well-formed `<channel>`).
- [ ] `sw.js` VERSION bumped.
- [ ] `update-resume` skill ran and its checklist passed (resume.pdf regenerated, lastModified bumped).
- [ ] No client name leaked into the case study body, hero, OG, or screenshot.

## Commit conventions

Single commit per case-study publish. Message shape:

```
feat: new case study — {Title}

{2–4 paragraphs covering: what it is in one sentence, the scope numbers,
the most distinctive technical detail or pattern, and what was generated
(HTML / OG / screenshot / wiring / resume sync).}

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Don't push automatically. Ask the user — same rule as `update-resume`. The case study is a public artifact and the user reviews before push.

## Anti-patterns

- **Don't invent a new template structure.** Mirror an existing one. Eight studies in, the pattern is the value.
- **Don't introduce a new accent color** unless the new study is a genuinely new domain. The accent palette is a brand cue.
- **Don't link the client's live URL** even if it's already public. The case study lives in NDA-framed neutral.
- **Don't skip the `MOCK` tag** on screenshot captions. Recruiters who think a render is a real screenshot are a credibility risk.
- **Don't push without the user.** This skill is for content; content gets human review.
- **Don't add a 4th praise card** on the index — keep the grid at 3.
- **Don't write generic ChatGPT-style filler in the body.** The case study earns its slot by having concrete numbers and specific patterns; remove anything that could be said about any project.
