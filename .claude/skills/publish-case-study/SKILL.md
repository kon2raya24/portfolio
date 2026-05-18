---
name: publish-case-study
description: Publish a new case study end-to-end — write the HTML, generate the OG card, generate a mock screenshot, wire it into the index work-tree + hero stat + sitemap + feed.xml, bump sw.js VERSION, then chain into the update-resume skill. Use this whenever a new project is ready to ship as a public case study, or when promoting a DRAFT to LIVE. Encodes the conventions established across the 8 existing case studies so the 9th doesn't drift.
---

# publish-case-study

End-to-end publish ritual for a new case study. Run this when a project is ready to leave DRAFT or arrive fresh. Follows the conventions every existing case study already uses — don't reinvent.

## Order of operations

1. **Write** `case-studies/{slug}.html` (including Article+BreadcrumbList JSON-LD, twitter:creator, prev/next pager — see § 1)
2. **Generate OG card** → `images/og-{slug}.png` (1200×630)
3. **Generate mock screenshot** → `images/shot-{slug}.png` (1600×900)
4. **Update the previous-last case study's pager** — its `next` placeholder becomes a link to the new study (otherwise readers hit a dead end)
5. **Wire into `index.html`** — add work-tree entry (with `case-outcome` chip; optional `★ start here` if flagship), bump hero "Case Studies" stat
6. **Update `sitemap.xml`** — add the new URL with current `lastmod`
7. **Add feed.xml entry** — `v4.x` item near the top
8. **Bump `sw.js` VERSION**
9. **Invoke `update-resume` skill** — keep the resume in sync

Stop at step 9. Commit locally. Ask the user before pushing.

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
- `<meta name="twitter:creator" content="@kon2raya24" />` + `<meta name="twitter:site" content="@kon2raya24" />` (sit alongside `twitter:card`)
- Google Fonts preconnect + `case-study.css` stylesheet
- Single `<script type="application/ld+json">` with `@graph` containing **Article** + **BreadcrumbList** (mirror any existing case study — the shape is identical, just swap the headline / description / datePublished / breadcrumb name). `datePublished` is the publish moment; `dateModified` is "now". Breadcrumb: Home → Case Studies (`/#fh5co-work`) → this study.

Required body structure (in order):
1. `<nav class="cs-nav">` — back-to-portfolio breadcrumb
2. `<header class="cs-hero">` with:
   - `.cs-hero__label` (always `// case-study.md`)
   - `<h1>` with subtitle in cyan span
   - `.cs-hero__tagline` — 2–3 sentences positioning the work
   - `.cs-meta` block with **client** (NDA-framed), **role**, **period**, **status**, **scope** (counts), and a **last touched** item: `<time class="cs-last-touched" data-cs-slug="{slug}" data-loading="true">fetching...</time>` — the JS at `/js/case-study.js` paints this from the GitHub commits API.
   - `.cs-hero__chips` — 6–10 tech chips, use `cs-chip--ai` for AI/LLM ones
3. **Top-of-page TL;DR metric grid** (`<div class="cs-metrics cs-metrics--top">`) right after `</header>` (before the TOC if present). 4 metric tiles in the same shape as the bottom outcome grid — pick the most-impactful numbers from the body so a 30-second scanner sees the receipts up front. The bottom outcome grid stays — same shape, different angle (top = headline metrics, bottom = full outcome breakdown).
4. Sections in this order: `tl;dr` → `problem` → `approach` → `solution` (with code sample + `<figure class="cs-shot-real">`) → `stack` → `outcome` (4 metric tiles) → `lessons` (worked well + would tighten). Give each `<section class="cs-section">` an `id` matching its label slug (`id="tldr"`, `id="problem"`, etc.) so the on-page TOC anchors land cleanly even for short writeups.
5. **Sticky on-page TOC** (`<aside class="cs-toc">`) between the top metric grid and the first `<section>`, only if the writeup is long (6+ sections; ai-engineer, wms-v2, hris are the precedent). Pattern: 7 anchor links pointing to the section IDs above. Skip the TOC for short studies — it adds chrome without value.
6. `<aside class="cs-cta">` close-out
7. **Inline OG-card preview** (`<aside class="cs-og-preview">`) right before the prev/next pager. Embeds `../images/og-{slug}.png` in a dashed-border card with a "// when shared on LinkedIn / X / Slack:" label. Self-aware signal that the social-share story is intentional. Hidden in print stylesheet.
8. **Prev/next pager** (`<nav class="cs-pager">`) before `</main>`. Canonical order matches the work-tree on `index.html`: wms → pamanaland → jbc → hris → tms → ai-engineer → wms-v2 → llm-wiki → **new study goes at the end**. The new study gets `<span class="cs-pager__placeholder">` on the `next` side; the previously-last study (currently llm-wiki) needs its `next` placeholder replaced with a link to the new study. **Don't forget this chain update or readers hit a dead end.**
9. **Script tag**: `<script src="../js/case-study.js"></script>` immediately before `</body>`. This powers the last-touched stamp (and any future per-case-study client-side polish like reading progress bars).

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
        <span class="exp-chip exp-chip--featured">★ start here</span>  <!-- ONLY on flagship studies -->
        <span class="exp-chip">{Tech 1}</span>
        <span class="exp-chip">{Tech 2}</span>
        <span class="exp-chip">{Tech 3}</span>
    </span>
    <span class="case-outcome">{outcome metric · second metric}</span>
    <a class="case-status case-status--live" href="case-studies/{slug}.html">LIVE &middot; read writeup &rarr;</a>
</li>
```

- **`case-outcome`** is required. Pull the single most compelling concrete outcome from the writeup body (e.g. `108 releases · BT label printing`, `5 LLMs · PHPUnit-verified`, `324 pages · live dispatch`). Two short fragments separated by `&middot;`. This is what a 90-second recruiter scan sees — make it count.
- **`exp-chip--featured`** is optional and rare. Use only when the new study is a flagship signal that materially outshines the others on a dimension nobody else has (AI/agent work, novel architecture pattern, meta-engineering). Current featured: ai-engineer, wms-v2. If you add a third, consider dropping one — featured-everywhere is featured-nowhere.

Update the **last entry above the new one** to use `├─` if it was previously `└─`, and the new entry to `└─` only if it's the very last LIVE row.

### Hero stat

Find the `data-count="N"` for `Case Studies` in `index.html` (around line 175). Bump `N` to the new total.

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
- [ ] Top-of-page `.cs-metrics--top` grid renders 4 headline metrics under the hero, sourced from the writeup body. Bottom outcome grid remains, with the FULL set of outcome metrics.
- [ ] `.cs-last-touched` time element in the hero meta block has `data-cs-slug="{slug}"` and reads its commit time from GitHub API on load (visible after ~1s on fresh visit, instant on cached visit).
- [ ] `.cs-og-preview` aside renders the OG image and is hidden in the print preview.
- [ ] `js/case-study.js` is linked at the bottom of `<body>`.
- [ ] Print preview (Ctrl+P) shows a clean Georgia-serif version without sticky chrome, TOC, pager, or OG preview.
- [ ] OG image renders correctly (open it directly to eyeball — 1200×630, accent color matches family).
- [ ] Mock screenshot has the `// case-study mock` watermark visible.
- [ ] Article + BreadcrumbList JSON-LD parses on https://search.google.com/test/rich-results (no errors).
- [ ] `twitter:creator` and `twitter:site` are present in the new study's `<head>`.
- [ ] Prev/next pager renders at the foot of the new study AND the previously-last study's `next` placeholder was replaced with a link to the new study.
- [ ] If the writeup is long (6+ sections), sticky TOC renders below the hero and every anchor link lands at the right `<h2>` clear of the sticky chrome.
- [ ] Index work-tree shows the new LIVE entry with correct chips, the `case-outcome` chip, and a slug.
- [ ] Hero "Case Studies" stat shows the new total when reloaded.
- [ ] `sitemap.xml` validates as XML (well-formed `<urlset>`).
- [ ] `feed.xml` validates as RSS (well-formed `<channel>`).
- [ ] `sw.js` VERSION bumped (last edit before commit).
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
- **Don't write generic ChatGPT-style filler in the body.** The case study earns its slot by having concrete numbers and specific patterns; remove anything that could be said about any project.
