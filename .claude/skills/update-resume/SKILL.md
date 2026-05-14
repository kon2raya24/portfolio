---
name: update-resume
description: Synchronize resume.json + resume-ats.html + resume.pdf with the current state of the portfolio. Use this skill whenever a change to the portfolio could affect what the resume should say — a new case study published, a case study revised, hero-stat updated, work experience added, skills section updated, or major architecture changes called out in case-study bodies. Keeps the resume in lockstep with the live portfolio so a recruiter who clicks resume.pdf gets the same story they see on the site.
---

# update-resume

Keep the resume in lockstep with the live portfolio. Run after any change that affects what a recruiter should see in a 2-page resume.

## When to run

Run this skill **after** any of these:

- A new `case-studies/*.html` file ships and gets indexed (LIVE badge on the index work-tree).
- A case study is substantially revised (new domain framing, new code samples, new metrics, new scope numbers).
- The hero "Case Studies" stat counter on `index.html` changes.
- A new project gets listed on the index work section, even if it's not a full case study.
- A new tech is added to the Tools & Stack section that should appear in the resume's Technical Skills.
- Work experience changes (new role, role change, end-date update on the current role).
- Open-source projects in the portfolio change (new repo, new package, deprecated module).
- The "Selected Projects" framing on the resume needs to mirror a portfolio change.

Do **not** run for:

- Pure CSS / styling changes.
- Bug fixes that don't change visible portfolio content.
- Light-mode tweaks, scroll-restoration fixes, animation polish.
- Service-worker version bumps.
- OG-image regenerations that don't change the case-study's framing.

## What to update

The resume lives in three coupled files. Update them in this order:

1. **`resume.json`** — the JSON Resume source of truth. Reflects work, education, skills, projects, languages.
2. **`resume-ats.html`** — the ATS-optimized single-column HTML rendered to PDF.
3. **`resume.pdf`** — regenerated from `resume-ats.html` via Chrome headless.

Then bump the service worker.

## Steps

### 1. Read the current state

```bash
cat resume.json
cat resume-ats.html | head -60
```

Confirm what's already there before adding new content. Avoid duplicating projects or skills already listed.

### 2. Update `resume.json`

Add or revise the relevant nodes:

- **`work[]`** — new role / end-date update / new highlights bullet. Always reverse-chronological (newest first).
- **`skills[]`** — append new keyword to the appropriate category. Don't create a new category unless the new tech is genuinely distinct.
- **`projects[]`** — add a new entry **only if** the project is now a published case study or a substantial standalone (open-source library, etc.). Use:
  - `name`, `description`, `highlights[]`, `keywords[]`, `url` (link to the case study), `roles[]`, `type`.
- **`basics.summary`** — only revise if a major narrative shift (e.g., now also positioned as "AI Engineer").
- **`meta.lastModified`** — bump to today's date in `YYYY-MM-DD`.

### 3. Update `resume-ats.html`

The HTML must stay ATS-friendly:

- **Keep** single-column layout, system fonts (Calibri / Segoe UI / Arial), real text (no images-of-text), standard section headings.
- **Don't** introduce tables for layout, multi-column flex, web fonts, or icons-as-text.

For a new case study, add an `<article class="project">` to the **Selected Projects** section in the same generic / NDA-friendly framing the live case studies use. Don't reveal client names if the case study itself is anonymized.

For a new tech, add it to the right `<li>` line under `Technical Skills` — keep the category groupings tight.

For a new role, add a full `<article class="job">` block at the **top** of `Work Experience` (reverse-chronological), or update the current top entry's date range.

For the keyword strip at the bottom: add new terms only if they appear in the body content above — the strip is for density, not for keywords that don't already appear naturally.

### 4. Regenerate `resume.pdf`

From the portfolio root:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --headless --disable-gpu --no-sandbox `
  --print-to-pdf="C:\xampp\htdocs\portfolio\resume.pdf" `
  --print-to-pdf-no-header --no-pdf-header-footer `
  "file:///C:/xampp/htdocs/portfolio/resume-ats.html"
```

Verify:
- File size is in the 120–180 KB range (a sudden jump signals an unintended image embed).
- Open in a PDF viewer and confirm text is selectable (drag-select the name at the top).

### 5. Bump the service worker

In `sw.js` increment the `VERSION` constant so the new PDF (and any HTML changes) aren't served stale from the SW cache:

```js
const VERSION = 'pf-vN+1-YYYY-MM-DD';
```

### 6. (Optional) Update `feed.xml`

If the resume change reflects a notable portfolio milestone (new case study, role change), add a small `<item>` near the top of `feed.xml` so RSS subscribers and the changelog narrative stays in sync.

## Verification checklist

Before committing:

- [ ] `resume.json` validates as JSON (no trailing commas, balanced braces).
- [ ] `resume-ats.html` opens cleanly in a browser and looks the same shape as before.
- [ ] `resume.pdf` regenerated, ~140 KB, text selectable.
- [ ] No client names leaked into the resume that aren't already in `resume.json`'s `work[]` (employers are named per resume convention; clients in case studies stay anonymized).
- [ ] Reverse-chronological order preserved in `work[]` and the work-experience section.
- [ ] `meta.lastModified` bumped in `resume.json`.
- [ ] `sw.js` `VERSION` bumped.

## Commit conventions

Use a concise message that names what changed:

```
docs: sync resume with new <thing>

- resume.json: <node> updated
- resume-ats.html: <section> updated
- resume.pdf: regenerated
- sw.js: VERSION bumped to vN+1
```

Do **not** auto-push. Ask the user before pushing — they may want to review the PDF first.

## Anti-patterns

- **Don't** rewrite the whole resume when a small change is enough.
- **Don't** add every tech the user mentions to the resume — only what's load-bearing for a 2-page document.
- **Don't** name confidential clients in the resume — even if the case study is anonymized, the employer name on the resume stays (resume convention), but client names within job descriptions should stay generic.
- **Don't** push to main automatically. The resume is the most human-reviewed artifact on the site.
- **Don't** skip the PDF regeneration step. The HTML is the source; the PDF is what recruiters actually download.
