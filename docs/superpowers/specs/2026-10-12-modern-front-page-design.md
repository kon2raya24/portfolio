# Modern front page — design spec

Date: 2026-10-12 · Status: approved in brainstorming, pending spec review

## Goal

Replace the RPG "Player File" front page (`index.html`) with a modern, AI/tech-flavoured,
UX-first single page. Primary visitor: a recruiter who must reach resume, case studies and
contact within seconds, without typing.

Chosen visual direction: **C, Engineered / terminal grid** (mockup in
`.superpowers/brainstorm/…/content/visual-direction.html`).

## Decisions (from the brainstorm)

- Rebuild the front page; **delete Player File** (`css/player-file.css`, `js/player-file.js`, its markup).
- Normal **scrolling single page** with a sticky nav. No tab/panel menu, no boot screen.
- AI touch = **⌘K Ask**, reusing the existing FAQ chat widget. No backend, no voice.
- Keep **live telemetry**: views counter, GitHub heatmap/stats/recent repos, git-log patch notes.
- **Drop the game layer**: achievements, Konami, sound synth, accent picker, LV/XP, boot screen, CONTINUE save slot.
- All content stays as real HTML (SEO, no-JS, screen readers). Copy is reused; game vocabulary is removed.

## Out of scope

`classic.html`, `night-shift.html`, case-study pages, other pages, the `tech-fx.js` command
palette, the Netlify form backend, and regenerating `images/og-cover.png` (follow-up: it
still shows the old UI until re-captured).

## Page structure (top → bottom)

| # | Section id | Content (source in old page) |
|---|---|---|
| — | nav (sticky) | `~/lemmuel-turaya` · work · experience · stack · services · projects · contact · `⌘K ask` button · `resume.pdf ↓` |
| 0 | `#top` hero | `$ whoami → status: open_to_work · tz: GMT+8 · remote / hybrid / onsite`; visible **`<h1>`** headline; one-line sub; buttons `book_call()` (cal.com), `resume.pdf ↓`, `send_message()` (→ `#contact`); photo; stat row 6+ years · 40+ projects · 9 case studies · 108 app releases (CHARACTER card + stats) |
| 1 | `#about` | bio (lore), principles checklist (passive traits + codex), `profile.config` card, `~/.now.json` card with ● live badge, equipped-loadout chips |
| 2 | `#work` | 9 case studies + 1 "writeup in progress" card; the two former LEGENDARY ones (`autonomous-ai-engineer`, `wms-v2-inventory-rewrite`) lead with a FEATURED label, same card size as the rest (QUEST LOG) |
| 3 | `#experience` | timeline 2019 → now, one native `<details>` per role (6), newest open (CAREER LOG + loot) |
| 4 | `#stack` | grouped by layer, tier marks ▮▮▮ primary · ▮▮ strong · ▮ working, plus tools list (SKILL TREE + inventory) |
| 5 | `#services` | the 11 "what I build" items as a grid (ABILITIES) |
| 6 | `#projects` | the 22 shipped projects with thumbnails; filter chips all · live · prototype · archive · games (TROPHY ROOM; gold/silver/bronze → live/prototype/archive) |
| 7 | `#activity` | GitHub contribution heatmap, recent repos, site views, `git log -5` patch notes (proof of work + patch notes) |
| 8 | `#contact` | Netlify form (markup and `name`/`action` unchanged), direct channels (email + copy, phone, cal.com, LinkedIn, GitHub), availability status, 3-step "how hiring me works" (COMMS) |
| — | footer | changelog · now · uses · night-shift · classic · RSS · © 2026 |

Section headings use a mono marker (`// 01 about`) above an Inter `<h2>`. The existing
off-screen `pf-sr-only` H1 is removed because the hero headline becomes the real H1.

## Visual system

- **Colour tokens** (CSS custom properties in `:root`): `--bg #0b0d0c`, `--surface #0f1311`,
  `--line #26302a`, `--text #d7e0da`, `--dim #8a978f` (solid, not opacity), `--heading #ffffff`,
  `--accent #4ade80`, `--accent-ink #0b0d0c`. Body background adds a 20px grid at ~3.5% white.
  Text/background pairs must meet WCAG AA (4.5:1 body, 3:1 large).
- **Type**: Inter 400/600/700 (body, headings), JetBrains Mono 400/700 (labels, chips, buttons,
  section markers, nav). One Google Fonts request, `display=swap`. Orbitron/Rajdhani removed.
- **Shape**: square corners, 1px `--line` borders, no glows and no heavy shadows. Primary button
  is solid accent; secondary is accent outline.
- **Motion**: hover/focus transitions (≤150ms, colour/transform only); sections fade/slide in
  once on first intersection. Everything is disabled under `prefers-reduced-motion`. No
  infinite animations, no canvas.
- **Focus**: visible 2px accent `:focus-visible` outline on every interactive element.
- **Responsive**: a single column below 768px, where the nav links collapse behind a menu
  button (`aria-expanded`, `aria-controls`). Case-study and project grids go 3 → 2 → 1 columns.

## Ask (⌘K)

- Load the existing `css/portfolio-chat.css` + `js/portfolio-chat.js` (unchanged files). They
  provide `window.PortfolioChat.open()/ask()`, search, browse and the 95-entry FAQ.
- The nav `⌘K ask` button calls `PortfolioChat.open()`; `⌘K` / `Ctrl+K` does the same.
- A style-C skin for the widget lives in `css/site.css`, scoped to the widget's own classes and
  overriding colours, fonts and radii only.

## Behaviour — `js/site.js` (one IIFE, vanilla, `defer`)

1. **Legacy hash redirect**: map old anchors to new section ids on load and on `hashchange`.
   Classic: `fh5co-header`/`fh5co-about`→`about`, `fh5co-resume`→`experience`,
   `fh5co-features`→`services`, `fh5co-skills`→`stack`, `fh5co-work`→`projects`,
   `fh5co-blog`→`work`, `fh5co-started`→`contact`. Player File: `character`→`about`,
   `quests`→`work`, `career`→`experience`, `skills`→`stack`, `abilities`→`services`,
   `archives`→`projects`, `comms`→`contact`. Uses `history.replaceState` and then scrolls to the
   target. This also covers the FAQ answers' `#fh5co-*` links.
2. **Nav**: the menu toggle on mobile closes when a link is clicked; the active section is
   highlighted with `IntersectionObserver` (`aria-current="true"` on the link).
3. **Ask**: button + ⌘K/Ctrl+K → `PortfolioChat.open()` (no-op if the widget failed to load).
4. **Projects filter**: chips are `<button aria-pressed>`; each card has space-separated
   `data-tags` (status `live|prototype|archive`, plus `games` for the game titles), so a live game
   shows under both. Filtering toggles `hidden`. Without JS the chips are hidden (`.js` class gate) and all cards
   show.
5. **Telemetry**, ported from `player-file.js` with the same endpoints, keys and caches:
   counterapi.dev views (session-guarded increment), GitHub user/repos/events with the 30-min
   `localStorage` `gh.*` cache, heatmap from events, git-log patch notes (30-min cache). Each
   widget keeps its loading text and falls back to a static "view on GitHub →" link on error.
6. **Copy email** button (`data-copy`) using `navigator.clipboard`, with a "copied" state.
7. **Form sent**: when `?sent=1` is present, show the success notice in `#contact` and scroll to it.
8. **Section reveal**: add `is-in` on first intersection; skipped entirely under reduced motion.

## File changes

- `index.html`: keep the `<head>` meta, OG/Twitter tags and JSON-LD. Replace the fonts link,
  stylesheets, noscript block and the whole `<body>`. Keep the service-worker registration.
- New: `css/site.css`, `js/site.js`.
- Delete: `css/player-file.css`, `js/player-file.js`.
- `sw.js`: precache `/css/site.css`, `/js/site.js`, `/css/portfolio-chat.css`,
  `/js/portfolio-chat.js` instead of the player-file pair; bump `VERSION` to `pf-v147-2026-10-12`.
- `changelog.html` + `feed.xml`: a v7.0 entry in the existing format.
- `server/server.js`: update the one comment that names `player-file.js` (comment only).
- `.gitignore`: add `.superpowers/` (done).
- `netlify.toml`: add a forced `/docs/*` → 404 redirect (same pattern as `/server/*` and
  `/deploy/*`), because `publish = "."` would otherwise serve this spec publicly.

## Verification

- Serve locally and check in Chrome at 1440, 768 and 375 widths: layout, sticky nav, menu toggle,
  filter chips, ⌘K opens Ask, legacy hashes (`/#fh5co-work`, `/#comms`) land on the right
  section, `?sent=1` notice.
- Keyboard-only pass: tab order follows the page, the focus ring is visible everywhere, and
  `<details>` and the chips work with the keyboard.
- No-JS pass: all content is visible and readable.
- Console: zero errors on load and during interaction.
- Scratch link-check script (not committed): every local `href`/`src` in `index.html`
  resolves to a file, and every in-page `#id` link has a target.
- Grep: no remaining references to `player-file` outside `changelog.html` history.
