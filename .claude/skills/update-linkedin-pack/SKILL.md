---
name: update-linkedin-pack
description: Refresh linkedin-summary.md so the LinkedIn copy-paste pack (Headline, About, Experience entries, Skills, Recommendation-request script, Featured-link blurbs) matches the current state of resume.json and the published case studies. Run this whenever resume.json changes substantially — new project, new role, summary reframing, new case study published. The pack is the source the user actually pastes into LinkedIn fields, so keeping it current is the single most leverage thing for the job-hunt vector outside of the resume PDF itself.
---

# update-linkedin-pack

Keep `linkedin-summary.md` in lockstep with `resume.json` and the live case studies. Run after `update-resume` (or as part of the same content update).

## When to run

Trigger when:
- `resume.json` `basics.summary` was reframed (e.g., added an "AI Engineering" angle).
- A new project landed in `resume.json` `projects[]` that should appear in the Featured section.
- A new case study was published (chains naturally after `publish-case-study` → `update-resume` → this).
- Work experience changes (new role, role change, end-date update on current role).
- Skills section gained meaningful new categories or technologies.

Skip when:
- Pure CSS / styling / bug fixes.
- Mock screenshot regeneration.
- Service worker version bumps.
- Anything that doesn't change recruiter-visible content.

## Source of truth

`resume.json` is canonical. The LinkedIn pack restates that data in LinkedIn's voice and shape — never invent new content here that isn't backed by the resume.

## Sections to keep aligned

`linkedin-summary.md` has 7 sections. Each maps to a LinkedIn field with a character limit. **Respect the limits** — LinkedIn truncates silently.

| # | Section | LinkedIn field | Limit | Source in resume.json |
|---|---|---|---|---|
| 1 | Headline | Profile headline | 220 chars | `basics.label` + `basics.summary` first line |
| 2 | About / Summary | About section | ~2,600 chars | `basics.summary` + skill highlights |
| 3 | Current role | Top of Experience | n/a | First entry in `work[]` (current role with no `endDate`) |
| 4 | Prior roles | Experience entries | per-role bullets ≤ ~200 chars each | Each `work[]` entry below the first |
| 5 | Skills | Skills section | each skill ≤ 80 chars | `skills[].keywords[]` flattened |
| 6 | Featured | Featured links | n/a | Top `projects[]` entries with `url` |
| 7 | Recommendation-request script | Outbound DM template | n/a | Static, hand-tuned tone |

## Steps

### 1. Read the current state

```bash
cat resume.json
cat linkedin-summary.md | head -50
```

Note the current `basics.summary`, the order of `work[]` (newest first), and the top 4–6 `projects[]` entries (these become Featured links).

### 2. Update each section in `linkedin-summary.md`

**Section 1 — Headline** (220 char cap):

Lead with the most distinctive role frame. If the resume positions the user as "Full-Stack and Mobile App Developer (with growing AI Engineering focus)", the headline should reflect both. Three variants below the primary headline:
- **Hiring-funnel focused** — short, recruiter-skim friendly
- **Specialist** — names the current employer + tech stack
- **Punchier** — verb-led, opinion-bearing

**Section 2 — About / Summary** (≤ 2,600 chars):

First-person voice ("I work end-to-end…"). Use single-character bullets (`•`) — LinkedIn renders them well. Structure:

1. One opening sentence framing role + years.
2. One sentence on operating style ("I work end-to-end…").
3. `— Specializations —` block with bulleted skill list.
4. `— Recent / Current —` block naming the latest work *neutrally* (no client names that aren't in `resume.json` `work[].name`).
5. `— What I bring to a team —` bullets (4 max, action-oriented).
6. `— Open to —` line listing engagement types + timezone overlap.
7. Optional closing line with the portfolio URL.

When the resume adds a major capability (e.g., "Autonomous AI Engineer"), surface it in Specializations *and* in the opening sentence. Don't bury it in bullet 8.

**Section 3 — Current role**:

Mirror the first `work[]` entry but in LinkedIn's narrative form:
- Title + company + dates exactly as in `resume.json`.
- 4–6 bulleted achievements, each ≤ ~200 chars, action-verb-led.
- Include the case-study URL for the most representative shipped work at this employer (e.g., the WMS Mobile App case study under AAI Worldwide Logistics).

**Section 4 — Prior roles**:

One block per `work[]` entry below the first. Same shape as the current role but shorter (3–4 bullets each). Keep reverse-chronological. Don't drop roles to save space — recruiters check continuity.

**Section 5 — Skills**:

Flatten `skills[].keywords[]` into a single de-duplicated list, ordered by category (Frontend → Backend → Mobile → AI & Automation → Integrations → DevOps → Design). LinkedIn caps the "top 3" pinned skills — call out which three to pin (typically: Vue.js, Laravel, Flutter — adjust if the AI-engineering angle deserves promotion).

**Section 6 — Featured links**:

Pick 4–6 entries from `resume.json` `projects[]` that have a `url` pointing at a live case study. For each, write a 1-sentence blurb LinkedIn shows below the link card:

- Autonomous AI Engineer → "Multi-LLM agent pipeline (Claude / Gemini / OpenAI / OpenRouter / Qwen) inside a production ticketing system."
- WMS v2 → "Active rewrite of a legacy enterprise WMS onto Laravel 12 + Vue 3 with a canonical V3 pattern + CI-enforced architecture."
- LLM-Friendly Wiki → "Karpathy-style Obsidian vault that gives both humans and AI agents the same context for a complex codebase."

**Section 7 — Recommendation-request DM template**:

Static, hand-tuned. Update only if the user changes voice. Should reference a *specific* shipped feature, not a generic ask.

### 3. Verify character limits

Quick check the headline + About counts:

```powershell
$lp = Get-Content 'C:\xampp\htdocs\portfolio\linkedin-summary.md' -Raw
# Find headline (first '> ' line under "Headline")
# Find About block (text between '```' fences under "About / Summary")
```

If either exceeds its cap, tighten. LinkedIn truncates the About section with a "…see more" link at ~250 characters in mobile previews — front-load the most important sentence.

### 4. Commit

Single commit, message shape:

```
docs: refresh LinkedIn pack — sync with <thing that changed>

- Headline: <what changed>
- About: <what changed>
- Featured: added/swapped <project>
```

Don't auto-push. The LinkedIn pack is human-edited per session before paste; bundling it with the resume push is fine, separate push is also fine.

## Verification checklist

- [ ] Headline ≤ 220 characters (count the primary headline, not the variants).
- [ ] About section ≤ 2,600 characters.
- [ ] First sentence of About is recruiter-skimmable in one line (the mobile "see more" cutoff is ~250 chars).
- [ ] Featured links section has 4–6 entries, each pointing at a live case-study URL.
- [ ] No client names appear that aren't already in `resume.json` `work[].name` (the case studies anonymize clients; the LinkedIn pack must not re-leak them).
- [ ] Skills order matches `resume.json` `skills[]` ordering (Frontend → Backend → Mobile → AI & Automation → …).
- [ ] Reverse-chronological work order preserved.
- [ ] Recommendation script names a *specific* shipped feature, not "your work."

## Anti-patterns

- **Don't write new content here that isn't in `resume.json`.** The pack restates; it doesn't invent.
- **Don't paste the resume verbatim.** LinkedIn is first-person + scannable + warmer tone; the resume is third-person + dense + employer-tone.
- **Don't drop the variant headlines.** The user A/B tests these by switching them seasonally.
- **Don't push to main automatically.** This pack is reviewed before paste — keep human-in-the-loop.
- **Don't break the section ordering** (1–7 above). The user has muscle memory for which section to copy when refreshing LinkedIn.
- **Don't include the verification checklist or this skill's metadata** in `linkedin-summary.md` itself. The pack is *content* the user copy-pastes; the skill is *process*.

## Pairs with

- [[update-resume]] — `linkedin-summary.md` is downstream of `resume.json`. After running `update-resume`, run this. The two together cover both the PDF artifact and the LinkedIn artifact from a single resume edit.
- [[publish-case-study]] — when a new case study lands, the Featured section in the LinkedIn pack may need a swap.
