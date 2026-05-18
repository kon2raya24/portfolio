/* =======================================================
 *  Portfolio chat — FAQ-style matcher dressed as a chat widget.
 *
 *  No external API, no token cost. User questions are fuzzy-matched
 *  against a hand-curated Q&A array. If no good match: graceful
 *  fallback to "ask me directly" with cal.com + email CTAs.
 *
 *  Edit the FAQ array below to expand the bot's knowledge.
 *  Each entry: { q, aliases[], a, category }
 *    q        — canonical question
 *    aliases  — alternate phrasings users might type
 *    a        — answer HTML (links + <strong>/<em> + <code> ok)
 *    category — for the suggested-chip rotation
 * ======================================================= */
(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // FAQ DATA — edit freely. Re-deploy to update; no API to push.
  // ---------------------------------------------------------------------
  var FAQ = [
    // -- Identity -----------------------------------------------------
    { q: "Who are you?",
      aliases: ["who is lemmuel", "introduce yourself", "bio", "about you", "tell me about yourself", "about lemmuel"],
      category: "about",
      a: "I'm <strong>Lemmuel Turaya</strong> — full-stack and mobile app developer based in Biñan, Laguna, Philippines (GMT+8). 6+ years shipping production platforms across logistics, real estate, HR, and autonomous AI engineering. <a href='#fh5co-about'>About section ↓</a>" },

    { q: "What's your full name?",
      aliases: ["full name", "your name", "what is your name", "whats your name", "name", "what's your name", "first name", "last name", "surname"],
      category: "about",
      a: "<strong>Lemmuel Turaya</strong>. Filipino developer, based in Biñan, Laguna · GMT+8. Friends and colleagues call me Lemmuel (or <code>kon2raya</code> online — same person, same vibes)." },

    { q: "Where are you based?",
      aliases: ["location", "country", "timezone", "tz", "where do you live", "philippines"],
      category: "about",
      a: "Biñan, Laguna, <strong>Philippines</strong> · <strong>GMT+8</strong>. Strong overlap with APAC, EU mornings, and US evenings." },

    { q: "What languages do you speak?",
      aliases: ["languages", "english", "filipino", "tagalog"],
      category: "about",
      a: "<strong>English</strong> (professional) and <strong>Filipino</strong> (native)." },

    // -- Stack / skills ----------------------------------------------
    { q: "What's your stack?",
      aliases: ["stack", "tech stack", "what do you use", "tools", "daily driver", "what languages", "tech you use"],
      category: "stack",
      a: "<strong>Web:</strong> Vue.js / Nuxt.js + Laravel + MySQL.<br><strong>Mobile:</strong> Flutter + Dart.<br><strong>AI workflow:</strong> Claude Code daily, multi-LLM agent pipelines in production (Claude / Gemini / OpenAI / OpenRouter / Qwen).<br>Full breakdown in the <a href='#fh5co-skills'>Skills section ↓</a>" },

    { q: "What's your AI workflow?",
      aliases: ["ai", "claude", "karpathy", "vibe coding", "ai workflow", "pair programming", "ai assisted", "how do you use ai"],
      category: "ai",
      a: "<strong>Karpathy-style</strong> AI-augmented engineering. Pair-program with <strong>Claude Code</strong> every day — prototyping, refactoring, large reviews, with code review + tests staying in the loop. I also build <em>autonomous</em> AI engineer pipelines that ship alongside the human team. See the <a href='case-studies/ai-engineer.html'>AI Engineer case study</a>." },

    { q: "Do you know Vue.js?",
      aliases: ["vue", "vue.js", "vue3", "nuxt", "frontend framework", "do you use vue"],
      category: "stack",
      a: "Yes — <strong>daily, for years</strong>. Vue 3 + Nuxt + Vuetify + Vuex/Pinia + Bootstrap Vue. Production examples: <a href='case-studies/pamanaland.html'>Pamanaland</a>, <a href='case-studies/hris.html'>HRIS</a>, <a href='case-studies/tms.html'>TMS</a>, <a href='case-studies/wms-v2.html'>WMS v2</a>." },

    { q: "Do you know React?",
      aliases: ["react", "next.js", "nextjs"],
      category: "stack",
      a: "I can work in React but it's <strong>not my daily driver</strong>. Vue 3 is. Happy to pick up React for the right role — patterns translate." },

    { q: "Do you know TypeScript?",
      aliases: ["typescript", "ts", "typed javascript"],
      category: "stack",
      a: "Yes — in production on <a href='case-studies/wms-v2.html'>WMS v2</a> and <a href='case-studies/hris.html'>HRIS</a> (Vue 3 + Vite + Pinia + TypeScript)." },

    { q: "What about mobile?",
      aliases: ["mobile", "flutter", "dart", "android", "ios", "mobile apps"],
      category: "stack",
      a: "<strong>Flutter + Dart</strong>. Hardware-integrated production app: <a href='case-studies/wms.html'>WMS Mobile</a> — 13 modules, 108 build releases, Bluetooth ESC/POS label printing, dual-input scanning, offline replay queue." },

    { q: "Do you know Laravel?",
      aliases: ["laravel", "php", "backend framework"],
      category: "stack",
      a: "Yes — Laravel 11/12 on every recent backend (HRIS, TMS, AI Engineer, WMS v2). PHP 8.x. Spatie Permissions for RBAC. Sanctum or JWT for auth." },

    // -- Case studies -------------------------------------------------
    { q: "Tell me about your AI work",
      aliases: ["ai engineer", "autonomous", "multi llm", "agent", "phpunit", "ai pipeline"],
      category: "ai",
      a: "Built a <strong>production multi-LLM autonomous AI engineer</strong> wired into an enterprise ticketing system. Picks up ASSIGNED tickets, auto-detects the right repo, dispatches to the chosen LLM (Claude / Gemini / OpenAI / OpenRouter / Qwen), and a separate verifier runs the real PHPUnit suite before any merge. Full writeup: <a href='case-studies/ai-engineer.html'>case-studies/ai-engineer.html</a>" },

    { q: "Tell me about the WMS mobile app",
      aliases: ["wms", "wms mobile", "warehouse", "bluetooth", "label printing", "scanner", "flutter wms"],
      category: "case-study",
      a: "Flutter WMS for AAI Worldwide Logistics — 13 feature modules, <strong>108 build releases</strong>, Bluetooth ESC/POS printing on Epson TM-P80II, dual-input scanning (camera + keyboard-wedge), offline replay queue (no scans lost mid-aisle). <a href='case-studies/wms.html'>Full case study →</a>" },

    { q: "Tell me about Pamanaland",
      aliases: ["pamanaland", "real estate", "realty", "developer portal", "rms"],
      category: "case-study",
      a: "Real-estate developer portal: Vue 3 + Laravel 11. Full lifecycle (reservation → sales → equity → amortization → in-house financing → commission → collection), 5-tier seller hierarchy, OU-scoped CASL RBAC. ~65 models. <a href='case-studies/pamanaland.html'>Case study →</a>" },

    { q: "Tell me about JBC",
      aliases: ["jbc", "brokerage", "commission system", "commission management", "sales commission"],
      category: "case-study",
      a: "Brokerage commission system: ~22 months in production, ~640 combined commits, 5-tier commission shares with approver workflow, multi-OU RBAC. <a href='case-studies/jbc.html'>Case study →</a>" },

    { q: "Tell me about the HRIS",
      aliases: ["hris", "hr system", "totp", "2fa", "payroll", "hr information system"],
      category: "case-study",
      a: "Enterprise HRIS: Laravel 12 + Vue 3 + Vite + Pinia + TypeScript + Vuestic Admin. Full HR lifecycle, payroll with PH gov tables, TOTP 2FA, OU-scoped RBAC, dual CI/CD (Jenkins + Buddy). 95 pages. <a href='case-studies/hris.html'>Case study →</a>" },

    { q: "Tell me about the TMS",
      aliases: ["tms", "transport", "transport management", "logistics", "gps", "dispatch"],
      category: "case-study",
      a: "Transport Management System: Vue 3 + Laravel 11. End-to-end booking → dispatch → live GPS → costing → invoice. 324 pages, 68 models. <a href='case-studies/tms.html'>Case study →</a>" },

    { q: "Tell me about the WMS v2 rewrite",
      aliases: ["wms v2", "wms-v2", "rewrite", "inventory rewrite", "canonical pattern", "v3", "baseCrud"],
      category: "case-study",
      a: "Active modernization of a legacy enterprise WMS onto Laravel 12 + Vue 3, organized around a single canonical V3 list-page pattern + BaseCrud foundation + CI-enforced architectural guardrails (ESLint + PHPStan). 103 models, 121 migrations. <a href='case-studies/wms-v2.html'>Case study →</a>" },

    { q: "Tell me about the LLM wiki",
      aliases: ["llm wiki", "obsidian", "karpathy wiki", "knowledge base", "ai documentation"],
      category: "case-study",
      a: "Karpathy-inspired Obsidian vault — a Markdown knowledge base that both human engineers and AI agents (Claude Code / Cursor / Cline) share for context. Per-folder <code>_INDEX.md</code> cuts agent token cost; same-turn-update discipline keeps the vault fresh. <a href='case-studies/llm-wiki.html'>Case study →</a>" },

    // -- Availability / engagement -----------------------------------
    { q: "Are you available?",
      aliases: ["open to work", "looking for work", "hiring", "for hire", "availability", "open to opportunities", "current status"],
      category: "hire",
      a: "<strong>Yes — open to remote, hybrid, or onsite</strong>. Currently full-time at AAI Worldwide Logistics; available for a serious offer within ~30-45 days. <a href='https://cal.com/lemmuel-turaya/intro' target='_blank' rel='noopener'>Book a 15-min intro call</a>." },

    { q: "What's your notice period?",
      aliases: ["notice period", "start date", "when can you start", "earliest start"],
      category: "hire",
      a: "<strong>30 days</strong> from current role. Available for a serious offer within ~30-45 days of signing." },

    { q: "What's your rate?",
      aliases: ["rate", "salary", "day rate", "pricing", "cost", "how much"],
      category: "hire",
      a: "<strong>Negotiable</strong> based on scope and engagement type (full-time / contract / project). Happy to share specifics on a call once the role is clear. <a href='https://cal.com/lemmuel-turaya/intro' target='_blank' rel='noopener'>Book a call →</a>" },

    { q: "Remote, hybrid, or onsite?",
      aliases: ["remote", "hybrid", "onsite", "work setup", "location flexibility"],
      category: "hire",
      a: "<strong>All three open.</strong> Strong async-collaboration habits. Biñan PH (GMT+8) with strong APAC, EU-morning, and US-evening overlap." },

    { q: "Contract or full-time?",
      aliases: ["contract", "freelance", "full time", "full-time", "engagement type", "permanent"],
      category: "hire",
      a: "<strong>Either</strong> — tell me what you need. Currently full-time; open to contract on the side or a full move for the right role." },

    { q: "Visa or work eligibility?",
      aliases: ["visa", "sponsorship", "work permit", "eligibility", "right to work"],
      category: "hire",
      a: "Philippine citizen. Work-from-PH or contract globally without sponsorship. Sponsorship needed for onsite roles outside PH." },

    // -- Contact ------------------------------------------------------
    { q: "How do I reach you?",
      aliases: ["contact", "reach you", "get in touch", "how to contact"],
      category: "contact",
      a: "Three options:<br>📞 <a href='https://cal.com/lemmuel-turaya/intro' target='_blank' rel='noopener'>Book a 15-min call (cal.com)</a><br>✉️ <a href='mailto:turayalemmuel@gmail.com'>turayalemmuel@gmail.com</a><br>💬 <a href='#fh5co-started'>Contact form ↓</a>" },

    { q: "LinkedIn?",
      aliases: ["linkedin", "professional profile"],
      category: "contact",
      a: "<a href='https://www.linkedin.com/in/lemmuel-turaya/' target='_blank' rel='noopener'>linkedin.com/in/lemmuel-turaya</a>" },

    { q: "GitHub?",
      aliases: ["github", "git", "code"],
      category: "contact",
      a: "<a href='https://github.com/kon2raya24' target='_blank' rel='noopener'>github.com/kon2raya24</a> — including the open-source <code>ph-dev-utils</code> library and the source of this portfolio." },

    { q: "Email?",
      aliases: ["email", "mail", "email address"],
      category: "contact",
      a: "<a href='mailto:turayalemmuel@gmail.com'>turayalemmuel@gmail.com</a> — replies within 24 hours." },

    // -- Process / philosophy -----------------------------------------
    { q: "How do you work with clients or teams?",
      aliases: ["process", "how do you work", "engagement", "kickoff", "intake", "collaboration"],
      category: "process",
      a: "Intake call → scope alignment → build with regular check-ins (weekly demo cadence works well) → handoff with docs. I write <a href='https://github.com/kon2raya24' target='_blank' rel='noopener'>code as if the next person on it is me</a>. AI-augmented where it speeds delivery without compromising code review or tests." },

    { q: "Do you really use AI for production work?",
      aliases: ["ai for production", "claude in production", "use ai for real work", "is ai real"],
      category: "ai",
      a: "Yes. Daily. The <a href='case-studies/ai-engineer.html'>AI Engineer case study</a> is a real multi-LLM agent pipeline running against production tickets. I also pair with Claude on every commit — not just chat, but actual code that ships." },

    // -- Meta ---------------------------------------------------------
    { q: "How was this portfolio built?",
      aliases: ["this site", "this portfolio", "how built", "stack of this site", "tech of this site", "framework"],
      category: "meta",
      a: "Hand-built. <strong>Zero frameworks</strong> on the cyber-FX layer. Vanilla HTML/CSS/JS — no jQuery, no React, no build step. Theme system with 5 palettes (cyber / matrix / sunset / xeno / crt) toggled via CSS vars + color-mix. Deployed on Netlify. Source: <a href='https://github.com/kon2raya24/portfolio' target='_blank' rel='noopener'>github.com/kon2raya24/portfolio</a>" },

    { q: "Can I see the source code?",
      aliases: ["source code", "repository", "github repo", "open source"],
      category: "meta",
      a: "Sure — <a href='https://github.com/kon2raya24/portfolio' target='_blank' rel='noopener'>github.com/kon2raya24/portfolio</a>. Hand-curated commit history shows the iteration." },

    // -- Easter eggs --------------------------------------------------
    { q: "How do I change theme?",
      aliases: ["change theme", "dark mode", "light mode", "theme picker", "palettes", "xeno", "crt", "matrix", "sunset"],
      category: "meta",
      a: "Click the theme picker in the top-right of the nav (or press <code>Alt+T</code>). 5 palettes: <strong>cyber</strong> (default), <strong>matrix</strong> (green), <strong>sunset</strong> (magenta), <strong>xeno</strong> (alien red), <strong>crt</strong> (retro phosphor)." },

    { q: "Are there keyboard shortcuts?",
      aliases: ["keyboard", "shortcuts", "hotkeys", "key bindings"],
      category: "meta",
      a: "Yes — press <code>?</code> to see the full list. Highlights: <code>Ctrl+K</code> command palette · <code>`</code> dev terminal · <code>Alt+T</code> cycle theme · <code>Esc</code> close overlays." },

    { q: "Easter eggs?",
      aliases: ["easter egg", "secret", "hidden", "konami"],
      category: "meta",
      a: "There's a konami code in here somewhere. ↑↑↓↓←→←→BA. Also right-click for a dev menu, backtick for a terminal. Have fun." },

    // -- Background / experience depth -------------------------------
    { q: "How many years of experience do you have?",
      aliases: ["how many years", "years of experience", "experience level", "years coding", "how long coding", "tenure"],
      category: "about",
      a: "<strong>6+ years</strong> shipping production work — from junior web dev (Switch Connect, Australia · 2019) through full-stack and mobile at current role (AAI Worldwide Logistics · since Nov 2024). Full timeline in the <a href='#fh5co-resume'>resume section ↓</a>" },

    { q: "Where did you study?",
      aliases: ["education", "university", "college", "school", "degree", "where did you go to school", "alma mater"],
      category: "about",
      a: "<strong>B.S. Information Technology</strong> · Trimex Colleges, Philippines · 2015–2019 · GPA 1.50 (Philippine scale, equivalent to ~3.85/4.0)." },

    { q: "Are you self-taught?",
      aliases: ["self taught", "bootcamp", "formal education", "cs degree"],
      category: "about",
      a: "Formal CS-adjacent degree (B.S. IT at Trimex Colleges) plus continuous self-learning. The fundamentals came from school; everything practical came from shipping production work for the last 6+ years." },

    { q: "Are you senior, mid-level, or junior?",
      aliases: ["senior", "mid level", "midlevel", "junior", "seniority", "level", "title", "role level"],
      category: "about",
      a: "<strong>Senior-leaning mid-to-senior</strong> on the IC track. 6+ yrs · 8 published case studies · architectural ownership on multiple shipped systems. Titles have lagged scope (typical PH market). Happy to discuss leveling on a call." },

    { q: "When did you start coding?",
      aliases: ["how did you get into coding", "start coding", "career start", "first job", "got into programming", "how did you start"],
      category: "about",
      a: "First production role: <strong>Junior Web Developer at Switch Connect (Australia, remote)</strong> in 2019. Built ERP modules + integrated Xero / Eversign / Google Maps / ABN Lookup. Programming itself started during the B.S. IT at Trimex (2015–2019)." },

    // -- Specific tech: yes ------------------------------------------
    { q: "Do you know Nuxt.js?",
      aliases: ["nuxt", "nuxt3", "nuxt.js", "ssr"],
      category: "stack",
      a: "<strong>Yes</strong> — Nuxt 3 is my default when SSR or static-generation matters. Shipped projects use Vue CLI for SPAs and Nuxt for marketing pages." },

    { q: "Do you know SQL / MySQL?",
      aliases: ["sql", "mysql", "database", "rdbms", "queries", "schema design"],
      category: "stack",
      a: "Yes — <strong>MySQL is my daily DB</strong>. Schema design, migrations, query tuning, online DDL (ALGORITHM=INPLACE LOCK=NONE for big-table changes in <a href='case-studies/wms-v2.html'>wms-v2</a>). Comfortable with EXPLAIN, indexing strategy, and <code>GET_LOCK</code> for concurrency (see <a href='case-studies/hris.html'>HRIS</a> memo numbering)." },

    { q: "Do you know REST API design?",
      aliases: ["rest", "api", "rest api", "endpoint design", "api design"],
      category: "stack",
      a: "Yes — REST-first, OpenAPI when shape-sharing with frontend matters. Token-based auth (JWT, Sanctum, OAuth flows). Pagination + versioning + idempotency patterns. Background: 5 production back-ends with substantial REST surfaces." },

    { q: "Do you know Bootstrap?",
      aliases: ["bootstrap", "bootstrap css", "bootstrap vue"],
      category: "stack",
      a: "Yes — Bootstrap 4/5 + Bootstrap Vue 3. Used on most production projects for fast grid + utility classes." },

    { q: "Do you know Vuetify?",
      aliases: ["vuetify", "vue material", "material design"],
      category: "stack",
      a: "Yes — Vuetify 2 + 3. Used on TMS and Trucking Rates module at AAI. Familiar with theming + custom component overrides." },

    { q: "Do you know AG Grid?",
      aliases: ["ag grid", "ag-grid", "ag grid enterprise", "data grid", "table component"],
      category: "stack",
      a: "Yes — AG Grid <strong>Enterprise</strong> on multiple production projects (Pamanaland, HRIS, WMS v2). Comfortable with column defs, row models, server-side pagination, custom cell renderers, master/detail." },

    { q: "Do you know Pinia or Vuex?",
      aliases: ["pinia", "vuex", "state management", "store"],
      category: "stack",
      a: "Both. <strong>Vuex</strong> on older Vue 2 projects (Pamanaland), <strong>Pinia</strong> on Vue 3 (HRIS, WMS v2). Pinia for new work — better TS support + smaller surface." },

    { q: "Do you know Firebase?",
      aliases: ["firebase", "firestore", "fcm", "google cloud", "auth firebase"],
      category: "stack",
      a: "Yes — Auth + Firestore + FCM on Flutter mobile work. Not my deepest area; my mobile backend defaults to a Laravel REST API." },

    { q: "Do you know Docker?",
      aliases: ["docker", "containers", "containerization"],
      category: "stack",
      a: "Yes — Docker for local dev environments. Not deeply ops-focused (no Kubernetes in production yet); happy to grow that surface for an infra-leaning role." },

    { q: "Do you know Git?",
      aliases: ["git", "github", "version control", "vcs"],
      category: "stack",
      a: "Daily — GitHub workflow, feature branches, PR reviews, conventional commits. ~640 combined commits on a single project (JBC). I treat git history as documentation." },

    { q: "Do you know CI/CD?",
      aliases: ["ci/cd", "ci cd", "continuous integration", "deployment", "github actions", "jenkins", "buddy"],
      category: "stack",
      a: "Yes — Jenkins + Buddy dual-CI on <a href='case-studies/hris.html'>HRIS</a>, GitHub Actions for personal projects. PHPUnit + ESLint + PHPStan as deploy gates." },

    { q: "Do you know testing?",
      aliases: ["testing", "tdd", "unit tests", "phpunit", "playwright", "cypress", "jest", "test driven"],
      category: "stack",
      a: "Yes — <strong>PHPUnit</strong> for Laravel back-ends (the <a href='case-studies/ai-engineer.html'>AI engineer</a> uses real PHPUnit as a deploy gate), <strong>Playwright</strong> for Vue 3 e2e (on <a href='case-studies/hris.html'>HRIS</a> and <a href='case-studies/wms-v2.html'>WMS v2</a>). TDD on critical paths, integration tests on the rest." },

    { q: "Do you know Statamic or SilverStripe?",
      aliases: ["statamic", "silverstripe", "cms"],
      category: "stack",
      a: "Yes to both. <strong>SilverStripe</strong> at Lumina Homes (real-estate site). <strong>Statamic</strong> at Uratex (landing pages)." },

    { q: "Do you know WordPress?",
      aliases: ["wordpress", "wp", "wp theme"],
      category: "stack",
      a: "Yes — corporate sites + light theme customization. Not my favorite tool (PHP CMS work tends to be SilverStripe or Statamic for me) but happy to maintain WP sites." },

    { q: "Do you know jsPDF / DomPDF?",
      aliases: ["pdf generation", "jspdf", "dompdf", "pdf reports"],
      category: "stack",
      a: "Yes — jsPDF for client-side PDF (reports), DomPDF for server-side (Laravel templated documents, payslips, SOAs). See <a href='case-studies/hris.html'>HRIS payroll</a> and <a href='case-studies/tms.html'>TMS invoices</a>." },

    { q: "Do you know Figma?",
      aliases: ["figma", "design tool", "wireframe", "ui design"],
      category: "stack",
      a: "Yes — design-to-code workflow daily. Comfortable reading specs, building responsive layouts pixel-accurate, and producing prototypes when needed (Uratex portal prototype)." },

    // -- Specific tech: not daily driver -----------------------------
    { q: "Do you know Angular?",
      aliases: ["angular", "angularjs"],
      category: "stack",
      a: "<strong>Not a daily driver</strong>. Vue 3 is. Patterns translate (components, services, RxJS-like reactivity); can pick up for the right role." },

    { q: "Do you know Svelte?",
      aliases: ["svelte", "sveltekit"],
      category: "stack",
      a: "Not in production work. Vue 3 is my frontend. Happy to learn for the right role." },

    { q: "Do you know Python?",
      aliases: ["python", "django", "flask", "fastapi"],
      category: "stack",
      a: "Comfortable basics; <strong>not in production work</strong>. My back-end stack is Laravel (PHP). I'd ramp up on Django/FastAPI for the right role." },

    { q: "Do you know Java or C# or Go?",
      aliases: ["java", "spring", "c#", "csharp", ".net", "dotnet", "go", "golang"],
      category: "stack",
      a: "Not in production work. My backend is Laravel/PHP. I read these languages comfortably and could ramp up for the right role." },

    { q: "Do you know Rust?",
      aliases: ["rust"],
      category: "stack",
      a: "Not in production work. PHP/Laravel is my back-end. Open to learning for the right project." },

    { q: "Do you know Node.js?",
      aliases: ["node", "node.js", "express", "nestjs", "nest.js"],
      category: "stack",
      a: "Comfortable — <strong>not as deep as Laravel</strong>. I use Node for tooling (build steps, scripts, CLIs). Most of my back-end production work is Laravel." },

    { q: "Do you know Next.js?",
      aliases: ["next.js", "nextjs", "vercel"],
      category: "stack",
      a: "Not daily — <strong>Nuxt 3</strong> is my SSR framework when I need SSR. Concepts transfer cleanly between the two." },

    { q: "Do you know React Native?",
      aliases: ["react native", "rn", "expo"],
      category: "stack",
      a: "Not in production — <strong>Flutter</strong> is my mobile stack. See <a href='case-studies/wms.html'>WMS Mobile</a>." },

    { q: "Do you know Swift / iOS native?",
      aliases: ["swift", "ios", "ios native", "swiftui", "xcode"],
      category: "stack",
      a: "No native iOS work — Flutter handles iOS for me. Happy to defer to a native iOS specialist when truly native APIs matter." },

    { q: "Do you know Kotlin / Android native?",
      aliases: ["kotlin", "android native", "android studio"],
      category: "stack",
      a: "Android Studio comfortable for Flutter builds + debugging Android-specific issues. No production native Kotlin work — Flutter covers the cross-platform need." },

    { q: "Do you know PostgreSQL?",
      aliases: ["postgresql", "postgres", "psql"],
      category: "stack",
      a: "Comfortable — but my production DB is <strong>MySQL</strong>. Concepts transfer; would ramp up on PG-specific features (JSONB, full-text, partial indexes) for the right role." },

    { q: "Do you know MongoDB or NoSQL?",
      aliases: ["mongodb", "mongo", "nosql", "redis", "dynamodb"],
      category: "stack",
      a: "Limited production exposure — my DB work is mostly MySQL relational. Redis for caching/sessions in some projects. Comfortable picking up document or KV stores where they fit." },

    { q: "Do you know GraphQL?",
      aliases: ["graphql", "apollo", "relay"],
      category: "stack",
      a: "<strong>REST-first</strong> in my production work. Comfortable reading GraphQL; would happily pick it up for a role where it's the API style." },

    { q: "Do you know AWS / GCP / Azure?",
      aliases: ["aws", "amazon web services", "gcp", "google cloud", "azure", "cloud", "cloud platforms"],
      category: "stack",
      a: "<strong>Limited direct ops work</strong> — deploy targets so far have been Netlify (this site) and the customer's own infra. Familiar with the concepts; would ramp on the specific platform for an infra-leaning role." },

    { q: "Do you know Kubernetes?",
      aliases: ["kubernetes", "k8s", "helm"],
      category: "stack",
      a: "No production Kubernetes work — Docker for local dev. Happy to grow into k8s for an ops-adjacent role." },

    // -- AI deep ------------------------------------------------------
    { q: "Claude or ChatGPT?",
      aliases: ["claude vs chatgpt", "claude or gpt", "preferred llm", "favorite llm", "best llm"],
      category: "ai",
      a: "<strong>Claude is my daily driver</strong> (Claude Code, Claude Max). The autonomous AI engineer wires all five (Claude, Gemini, OpenAI, OpenRouter, Qwen) behind one harness so the operator picks the brain per task — no religious preference, just whichever brain fits the work." },

    { q: "Do you know LangChain?",
      aliases: ["langchain", "llamaindex", "haystack", "agent framework"],
      category: "ai",
      a: "Hand-rolled the agent harness (AiHarnessService) for the production AI Engineer rather than wrapping LangChain. Same patterns (tool use, memory, chains) but built minimal in Laravel for tighter control + audit trail. See <a href='case-studies/ai-engineer.html'>case study</a>." },

    { q: "Do you know prompt engineering?",
      aliases: ["prompt engineering", "system prompts", "prompts", "prompting"],
      category: "ai",
      a: "Yes — production system prompts for the multi-LLM agent + the Karpathy-style LLM wiki design itself is prompt-context engineering (per-folder <code>_INDEX.md</code> shapes what an agent sees in its context window)." },

    { q: "Do you know RAG?",
      aliases: ["rag", "retrieval augmented", "vector db", "embeddings", "semantic search"],
      category: "ai",
      a: "Conceptually yes — the <a href='case-studies/llm-wiki.html'>LLM-Friendly Wiki</a> is a <em>structured</em> retrieval system (file paths + per-folder indexes) without a vector DB. Comfortable with embedding-based RAG patterns; would build the right one per use case." },

    { q: "Have you trained or fine-tuned models?",
      aliases: ["fine tuning", "fine-tune", "trained models", "model training", "lora"],
      category: "ai",
      a: "<strong>No production fine-tuning work</strong>. My AI engineering is at the orchestration + agent layer (multi-LLM harness, tool use, prompt context). Open to growing the training-side surface for the right role." },

    { q: "What is multi-LLM orchestration?",
      aliases: ["multi llm", "multi-llm", "llm orchestration", "ai harness"],
      category: "ai",
      a: "One service interface, multiple LLM providers behind it. In the <a href='case-studies/ai-engineer.html'>AI Engineer</a>: <code>AiHarnessService</code> dispatches to Claude / Gemini / OpenAI / OpenRouter / Qwen based on operator choice per ticket. Adding a new brain is a one-class change." },

    { q: "Will AI replace developers?",
      aliases: ["ai replace developers", "will ai take jobs", "ai taking jobs", "future of coding"],
      category: "ai",
      a: "It's already changing the shape of the work. The leverage shifts from typing code to <strong>system design + judgment + verification</strong>. Engineers who let AI compress prototyping while keeping code review + tests in the loop ship more, not less." },

    { q: "Why no AI in production back-end?",
      aliases: ["are you using ai", "ai integration", "ai features in app", "embed ai in product"],
      category: "ai",
      a: "I do — the <a href='case-studies/ai-engineer.html'>autonomous AI Engineer</a> is production multi-LLM agentry wired into a real ticketing system. The <a href='case-studies/llm-wiki.html'>LLM-Friendly Wiki</a> is the agent's context layer. Both ship under NDA but the patterns are documented." },

    // -- Work history depth ------------------------------------------
    { q: "Where do you work now?",
      aliases: ["current job", "current employer", "currently work", "current role", "current company"],
      category: "work",
      a: "<strong>AAI Worldwide Logistics</strong> · Application Developer · Nov 2024 – Present. FMS, WMS (mobile + web), TMS, CRM, autonomous AI engineer pipeline. SAP integration + heavy logistics-domain work." },

    { q: "Tell me about your time at Octal",
      aliases: ["octal", "octal philippines"],
      category: "work",
      a: "<strong>Octal Philippines Inc.</strong> · Software Developer · Oct 2022 – Oct 2024 (assigned to AAI Worldwide Logistics IT). Two years of continuous delivery on FMS / CRM / TMS / WMS. Trucking Rates module, TMS dashboard, LES UI, FAREYE API integration." },

    { q: "Tell me about your time at Uratex",
      aliases: ["uratex"],
      category: "work",
      a: "<strong>Uratex Philippines</strong> · Full-Stack Developer · Mar – Oct 2022. Laravel surveys with detailed reporting, Trip Management System for company vehicles, corporate landing page, Statamic CMS-driven brand page with countdown timer." },

    { q: "Tell me about your time at Lumina",
      aliases: ["lumina", "lumina homes"],
      category: "work",
      a: "<strong>Lumina Homes</strong> · Marketing Staff (Full-Stack Developer) · Mar 2021 – Mar 2022. Hybrid dev + marketing role. Property-listing loan calculator with email delivery, SilverStripe real-estate site maintenance, SEO via SEMrush + Ahrefs." },

    { q: "Tell me about your time at Switch Connect",
      aliases: ["switch connect", "first job", "first role", "australia"],
      category: "work",
      a: "<strong>Switch Connect Pty Ltd</strong> · Junior Web Developer · Aug 2019 – Sep 2020 (Australia, fully remote). First professional role. ERP modules, Google Maps API for address validation, ABN Lookup, Xero + Eversign integrations." },

    // -- Engagement depth --------------------------------------------
    { q: "Will you relocate?",
      aliases: ["relocate", "relocation", "move", "willing to move"],
      category: "hire",
      a: "Within the Philippines: <strong>yes</strong>, for the right onsite role. Outside the Philippines: <strong>requires sponsorship</strong> — happy to discuss for a serious offer." },

    { q: "Project basis or long-term?",
      aliases: ["project basis", "long term", "short term", "project work", "ongoing"],
      category: "hire",
      a: "<strong>Both</strong>. Short scoped projects work well. Long-term partnerships (months → years) also welcome — most of my production work has been multi-year on the same systems." },

    { q: "Will you sign an NDA?",
      aliases: ["nda", "non disclosure", "confidentiality"],
      category: "hire",
      a: "Standard NDAs — <strong>yes</strong>, no problem. Most of my current portfolio is anonymized under client NDAs already (Pamanaland, JBC, WMS, HRIS, TMS are all NDA-framed)." },

    { q: "Will you do a paid trial?",
      aliases: ["trial", "trial period", "paid trial", "test project", "tryout"],
      category: "hire",
      a: "Open to it — <strong>1-2 week paid trial</strong> on a real scoped piece of work usually de-risks both sides faster than a long interview loop. Discuss on a call." },

    { q: "Do you have a side project quota?",
      aliases: ["moonlighting", "side project", "side work", "freelance on the side"],
      category: "hire",
      a: "I'm currently full-time at AAI. Open to <strong>contract on the side</strong> with reasonable scope (5-10 hrs/week) — but full-time + a separate sustained contract is a hard no. Honest about availability." },

    { q: "Hourly rate?",
      aliases: ["hourly", "hourly rate", "rate per hour", "$/hr"],
      category: "hire",
      a: "Negotiable based on scope. I prefer <strong>scoped project rates</strong> over hourly when possible — better aligned incentives. <a href='https://cal.com/lemmuel-turaya/intro' target='_blank' rel='noopener'>Book a call</a> to discuss your specific engagement." },

    // -- Process / philosophy depth ----------------------------------
    { q: "Do you write tests?",
      aliases: ["tests", "test coverage", "testing philosophy", "do you test"],
      category: "process",
      a: "Yes — PHPUnit on Laravel, Playwright on Vue. Coverage depth scales with risk: <strong>critical paths get TDD</strong>, the rest get integration tests. The AI engineer requires PHPUnit to pass before any merge — same standard I apply to my own work." },

    { q: "How do you handle deadlines?",
      aliases: ["deadlines", "estimates", "estimation", "project planning", "scoping"],
      category: "process",
      a: "Break work into thin slices, estimate each, ship the spine first, then refine. I'm honest when estimates slip — usually the cause is hidden complexity, and the right move is to scope-reduce or extend, not heroics. Weekly demos catch drift early." },

    { q: "Do you do code review?",
      aliases: ["code review", "pull requests", "pr review", "merge review"],
      category: "process",
      a: "Yes — both giving and receiving. I treat PRs as conversations + documentation. AI-assisted code still gets human review (the AI engineer also runs PHPUnit before any merge for the same reason)." },

    { q: "Can you lead a team?",
      aliases: ["lead", "team lead", "leadership", "tech lead", "manage", "managing"],
      category: "process",
      a: "Yes — I lead the WMS v2 rewrite (architecture decisions, CI guardrails, canonical patterns). Comfortable owning a system, setting conventions, and mentoring juniors. Not interested in pure people management — IC track with leadership scope." },

    { q: "Do you mentor?",
      aliases: ["mentor", "mentoring", "teach", "onboard juniors", "pair programming"],
      category: "process",
      a: "Yes — pair programming, PR feedback, internal docs (Karpathy-style LLM wiki is literally a mentorship artifact for both humans and AI). Comfortable onboarding new engineers onto a codebase." },

    { q: "How do you communicate with clients or teams?",
      aliases: ["communication", "async", "remote work", "communication style", "how do you communicate"],
      category: "process",
      a: "<strong>Async-default</strong>. Written specs, recorded walkthroughs, weekly demos. Synchronous for kickoffs, blockers, and tough calls. Slack/Teams day-to-day. GMT+8 timezone with strong APAC, EU-morning, US-evening overlap." },

    // -- Personal / soft ---------------------------------------------
    { q: "What's your /now page?",
      aliases: ["what are you working on", "now", "current focus", "right now", "currently"],
      category: "about",
      a: "Open <a href='now.html'>/now</a> — Derek-Sivers-style current-focus page. Updated regularly." },

    { q: "What tools do you use?",
      aliases: ["uses", "tools", "what's in your kit", "your setup", "editor setup", "daily tools"],
      category: "about",
      a: "Editor + terminal + hardware + daily software — open <a href='uses.html'>/uses</a> (Wes-Bos-style tradition). Highlights: VS Code + Claude Code, Windows Terminal + WSL Ubuntu, Figma." },

    { q: "What's your work style?",
      aliases: ["work style", "how do you work", "productivity"],
      category: "process",
      a: "Async-default, ship-incremental, README-as-you-build. AI-augmented where it speeds delivery without compromising code review or tests. Treat git history as documentation; treat <code>CLAUDE.md</code> as onboarding for both humans and AI." },

    { q: "Do you blog or write?",
      aliases: ["blog", "writing", "articles", "posts", "publications", "twitter", "x"],
      category: "about",
      a: "No public blog (yet). The portfolio case studies + the LLM-friendly wiki + this chat are the public writing for now. Reach out if you want long-form thinking on a specific topic." },

    // -- Meta / portfolio --------------------------------------------
    { q: "Why no React?",
      aliases: ["why vue not react", "why not react", "react vs vue", "vue over react"],
      category: "meta",
      a: "Vue happened to be the stack at my first deep production role (Lumina, 2021) and it's stuck because the team familiarity + Vue 3 + Pinia + TypeScript is a delightful combo. Not religious — I'd ship React for a React-shop role." },

    { q: "Why so much chrome on this site?",
      aliases: ["why cyber", "why cyberpunk", "design choice", "aesthetic", "why so themed", "why so much animation"],
      category: "meta",
      a: "Intentional brand signal — proves I can build polished interactive UIs <strong>without</strong> a React/Vue framework, in pure vanilla. The 5 themes + animations + this chat widget are demos disguised as decoration. <a href='changelog.html'>/changelog</a> shows the iteration." },

    { q: "Who built this chatbot?",
      aliases: ["who made you", "what are you", "are you a real ai", "are you claude", "are you chatgpt", "who built you"],
      category: "meta",
      a: "I'm a hand-curated FAQ matcher dressed as a chat widget — <strong>not</strong> a real LLM. Lemmuel wrote every answer; the matcher is fuzzy Levenshtein + token overlap. Zero API costs, zero hallucination. Source: <a href='https://github.com/kon2raya24/portfolio/blob/main/js/portfolio-chat.js' target='_blank' rel='noopener'>js/portfolio-chat.js</a>" },

    { q: "What if I have a question you can't answer?",
      aliases: ["question not answered", "you don't know", "don't have answer", "off topic"],
      category: "meta",
      a: "Two options: <a href='https://cal.com/lemmuel-turaya/intro' target='_blank' rel='noopener'>book a 15-min call</a> or <a href='mailto:turayalemmuel@gmail.com'>email Lemmuel directly</a>. Real human, usually replies within 24 hours." },

    { q: "Can I see your CV?",
      aliases: ["cv", "resume pdf", "download resume", "resume download", "pdf resume"],
      category: "contact",
      a: "Yes — <a href='resume.pdf' target='_blank'>download resume.pdf</a> (ATS-friendly). Also available as machine-readable <a href='resume.json' target='_blank'>resume.json</a> (JSON Resume format)." },

    { q: "What's the meaning of life?",
      aliases: ["meaning of life", "42", "philosophy", "why are we here"],
      category: "meta",
      a: "42. Now ask me about Vue." }
  ];

  // Suggested-question chips — rotated/shuffled on each open.
  var SUGGESTIONS = [
    "What's your stack?",
    "Are you available?",
    "Tell me about your AI work",
    "What's your rate?",
    "How do I reach you?",
    "How was this portfolio built?",
    "Tell me about the WMS mobile app",
    "How many years of experience?",
    "Do you know Vue.js?",
    "Do you know React?",
    "Claude or ChatGPT?",
    "Remote, hybrid, or onsite?",
    "Notice period?",
    "Can I see your CV?",
    "What if I have a question you can't answer?"
  ];

  // ---------------------------------------------------------------------
  // Matcher — fuzzy similarity over (question, aliases) per FAQ entry.
  // ---------------------------------------------------------------------
  function normalize(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  }
  function tokens(s) { return normalize(s).split(' ').filter(Boolean); }

  // Levenshtein with early-exit cap. Bounded O(m*n) but most calls short.
  function lev(a, b) {
    a = normalize(a); b = normalize(b);
    if (!a) return b.length;
    if (!b) return a.length;
    var prev = new Array(b.length + 1);
    var curr = new Array(b.length + 1);
    for (var j = 0; j <= b.length; j++) prev[j] = j;
    for (var i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (var k = 1; k <= b.length; k++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(k - 1) ? 0 : 1;
        curr[k] = Math.min(curr[k - 1] + 1, prev[k] + 1, prev[k - 1] + cost);
      }
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[b.length];
  }
  function similarity(a, b) {
    var d = lev(a, b);
    var L = Math.max(normalize(a).length, normalize(b).length);
    return L === 0 ? 0 : 1 - d / L;
  }
  function tokenOverlap(input, target) {
    var inT = tokens(input), tgT = tokens(target);
    if (!inT.length || !tgT.length) return 0;
    var hits = 0;
    for (var i = 0; i < inT.length; i++) {
      if (tgT.indexOf(inT[i]) !== -1) hits++;
    }
    return hits / inT.length;
  }

  // Quick greeting bypass — "hi" / "hello" / etc. shouldn't go through the
  // matcher (where "hi" is a substring of "hiring" and would false-match).
  var GREETINGS = ['hi', 'hello', 'hey', 'yo', 'sup', 'howdy', 'hi there', 'hey there', 'hello there', 'hiya', 'greetings'];
  var GREETING_REPLY = {
    q: '(greeting)',
    a: "Hey 👋 ask me anything about Lemmuel's portfolio — <strong>stack</strong>, <strong>projects</strong>, <strong>availability</strong>, <strong>AI work</strong>, <strong>rates</strong>, contact. Try one of the chips above ↑ or type your own question."
  };

  // Core scoring — returns numeric score for one (input, entry) pair using
  // substring + token-overlap + Levenshtein signals. Shared by findMatch and
  // findCloseMatches so ranking stays consistent.
  function scoreEntry(userInput, normIn, entry) {
    var candidates = [entry.q].concat(entry.aliases || []);
    var best = 0;
    for (var j = 0; j < candidates.length; j++) {
      var c = candidates[j];
      var normC = entry._normCache && entry._normCache[j] != null
        ? entry._normCache[j]
        : normalize(c);
      var s = 0;
      // 1) Substring — strongest, but only when input ≥3 chars (so "hi"
      //    doesn't match "hiring" via substring).
      if (normIn.length >= 3 &&
          (normC.indexOf(normIn) !== -1 || normIn.indexOf(normC) !== -1)) {
        s = Math.max(s, 0.90);
      }
      // 2) Token overlap — only credit when ≥66% of input tokens hit.
      var overlap = tokenOverlap(userInput, c);
      if (overlap >= 0.66) {
        s = Math.max(s, overlap === 1 ? 0.90 : 0.80);
      }
      // 3) Edit-distance similarity — only counts at ≥0.78.
      var lev = similarity(userInput, c);
      if (lev >= 0.78) {
        s = Math.max(s, lev * 0.85);
      }
      if (s > best) best = s;
    }
    return best;
  }

  function findMatch(userInput) {
    var normIn = normalize(userInput);
    if (!normIn) return null;
    if (GREETINGS.indexOf(normIn) !== -1) return GREETING_REPLY;

    var best = { score: 0, entry: null };
    for (var i = 0; i < FAQ.length; i++) {
      var s = scoreEntry(userInput, normIn, FAQ[i]);
      if (s > best.score) { best.score = s; best.entry = FAQ[i]; }
    }
    return best.score >= 0.55 ? best.entry : null;
  }

  // Returns the top-N entries by raw score (regardless of match threshold).
  // Used by the fallback "did you mean?" suggestions so a missed query
  // surfaces the closest related FAQ entries the user can click to rebound.
  function findCloseMatches(userInput, n) {
    var normIn = normalize(userInput);
    if (!normIn) return [];
    var scored = [];
    for (var i = 0; i < FAQ.length; i++) {
      var s = scoreEntry(userInput, normIn, FAQ[i]);
      if (s > 0.18) scored.push({ score: s, entry: FAQ[i] });  // weak floor
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, n).map(function (x) { return x.entry; });
  }

  // ---------------------------------------------------------------------
  // Data validation + alias pre-normalization (runs once at IIFE start).
  // Warns in console if FAQ data is malformed. Caches normalized
  // candidates per entry for matcher speed + consistency.
  // ---------------------------------------------------------------------
  (function validateAndCacheFAQ() {
    var seenAliases = Object.create(null);
    var problems = 0;
    for (var i = 0; i < FAQ.length; i++) {
      var e = FAQ[i];
      if (!e || typeof e !== 'object') {
        console.warn('[pchat] FAQ entry #' + i + ' is not an object'); problems++; continue;
      }
      if (typeof e.q !== 'string' || !e.q.trim()) {
        console.warn('[pchat] FAQ entry #' + i + ' missing canonical q'); problems++;
      }
      if (typeof e.a !== 'string' || !e.a.trim()) {
        console.warn('[pchat] FAQ entry #' + i + ' (q="' + e.q + '") missing answer a'); problems++;
      }
      if (e.aliases && !Array.isArray(e.aliases)) {
        console.warn('[pchat] FAQ entry #' + i + ' (q="' + e.q + '") aliases should be array'); problems++;
        e.aliases = [];
      }
      if (!e.aliases) e.aliases = [];
      // Pre-normalize candidates (q + each alias) into _normCache for the matcher
      var cands = [e.q].concat(e.aliases);
      e._normCache = cands.map(normalize);
      // Watch for cross-entry alias collisions (same normalized alias on two entries)
      for (var k = 0; k < cands.length; k++) {
        var key = e._normCache[k];
        if (!key) continue;
        if (seenAliases[key] && seenAliases[key] !== e.q) {
          console.warn('[pchat] alias collision: "' + cands[k] + '" appears on both "' + seenAliases[key] + '" and "' + e.q + '"');
        }
        seenAliases[key] = e.q;
      }
    }
    if (problems > 0) console.warn('[pchat] FAQ validation: ' + problems + ' problem(s) — see warnings above');
  })();

  // ---------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------
  var isTouch = matchMedia('(hover: none)').matches || window.innerWidth < 1025;
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STORAGE_KEY = 'portfolio.chat.history';
  var BROWSE_QUERY_KEY = 'portfolio.chat.browseQuery';

  function build() {
    if (document.querySelector('.pchat')) return;

    var wrap = document.createElement('div');
    wrap.className = 'pchat';
    wrap.setAttribute('aria-live', 'polite');
    // Bubble icon: inline SVG chat-bubble-with-dots (Feather/Lucide-style).
    // currentColor inherits the theme accent — bubble glows red in xeno,
    // phosphor green in crt, etc. Crisp at every size; no emoji rendering
    // inconsistency across Windows/macOS/Linux.
    var BUBBLE_SVG =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>' +
        '<circle cx="8.5" cy="11.5" r="0.9" fill="currentColor" stroke="none"/>' +
        '<circle cx="12" cy="11.5" r="0.9" fill="currentColor" stroke="none"/>' +
        '<circle cx="15.5" cy="11.5" r="0.9" fill="currentColor" stroke="none"/>' +
      '</svg>';
    var CLOSE_SVG =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<line x1="6" y1="6" x2="18" y2="18"/>' +
        '<line x1="18" y1="6" x2="6" y2="18"/>' +
      '</svg>';
    var BROWSE_SVG =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<line x1="8" y1="6" x2="20" y2="6"/>' +
        '<line x1="8" y1="12" x2="20" y2="12"/>' +
        '<line x1="8" y1="18" x2="20" y2="18"/>' +
        '<circle cx="4" cy="6" r="1" fill="currentColor"/>' +
        '<circle cx="4" cy="12" r="1" fill="currentColor"/>' +
        '<circle cx="4" cy="18" r="1" fill="currentColor"/>' +
      '</svg>';

    wrap.innerHTML =
      '<button type="button" class="pchat__bubble" aria-label="Open chat — ask me anything about the portfolio" data-pchat-open>' +
        '<span class="pchat__bubble-icon pchat__bubble-icon--chat" aria-hidden="true">' + BUBBLE_SVG + '</span>' +
        '<span class="pchat__bubble-icon pchat__bubble-icon--close" aria-hidden="true">' + CLOSE_SVG + '</span>' +
        '<span class="pchat__bubble-pulse" aria-hidden="true"></span>' +
      '</button>' +
      '<div class="pchat__panel" role="dialog" aria-modal="false" aria-label="Ask me about the portfolio" hidden>' +
        '<header class="pchat__head">' +
          '<div class="pchat__head-title">' +
            '<span class="pchat__dot" aria-hidden="true"></span>' +
            '<span class="pchat__head-name">~/ask-me</span>' +
          '</div>' +
          '<div class="pchat__head-actions">' +
            '<button type="button" class="pchat__icon-btn pchat__browse" data-pchat-browse aria-label="Browse all questions" aria-pressed="false" title="Browse all questions">' + BROWSE_SVG + '</button>' +
            '<button type="button" class="pchat__icon-btn pchat__reset" data-pchat-reset aria-label="Reset conversation" title="Reset">↻</button>' +
            '<button type="button" class="pchat__icon-btn pchat__close" data-pchat-close aria-label="Close chat" title="Close (Esc)">×</button>' +
          '</div>' +
        '</header>' +
        '<div class="pchat__body" data-pchat-body>' +
          '<div class="pchat__welcome">' +
            '<p>Hey 👋 ask me anything about Lemmuel’s portfolio — stack, projects, availability, AI work, rates.</p>' +
            '<p class="pchat__welcome-sub">Curated answers, no API costs. <a href="https://cal.com/lemmuel-turaya/intro" target="_blank" rel="noopener">Or book a call</a>.</p>' +
          '</div>' +
          '<div class="pchat__suggestions" data-pchat-suggestions></div>' +
        '</div>' +
        '<div class="pchat__browse-view" data-pchat-browse-view hidden></div>' +
        '<form class="pchat__form" data-pchat-form>' +
          '<input type="text" class="pchat__input" data-pchat-input placeholder="Ask a question…" autocomplete="off" spellcheck="false" aria-label="Type your question">' +
          '<button type="submit" class="pchat__submit" aria-label="Send">→</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(wrap);

    var bubble = wrap.querySelector('[data-pchat-open]');
    var panel = wrap.querySelector('.pchat__panel');
    var closeBtn = wrap.querySelector('[data-pchat-close]');
    var resetBtn = wrap.querySelector('[data-pchat-reset]');
    var browseBtn = wrap.querySelector('[data-pchat-browse]');
    var body = wrap.querySelector('[data-pchat-body]');
    var browseView = wrap.querySelector('[data-pchat-browse-view]');
    var form = wrap.querySelector('[data-pchat-form]');
    var input = wrap.querySelector('[data-pchat-input]');
    var suggBox = wrap.querySelector('[data-pchat-suggestions]');

    // Display names for the category slugs used in the FAQ data
    var CATEGORY_LABELS = {
      about:        'About Lemmuel',
      stack:        'Tech stack',
      ai:           'AI / LLM work',
      'case-study': 'Case studies',
      hire:         'Hiring & availability',
      contact:      'Get in touch',
      process:      'How I work',
      work:         'Work history',
      meta:         'About this site / chat'
    };
    var CATEGORY_ORDER = ['about', 'stack', 'ai', 'case-study', 'work', 'hire', 'process', 'contact', 'meta'];

    function buildBrowseView() {
      // Bucket FAQ by category
      var buckets = {};
      for (var i = 0; i < FAQ.length; i++) {
        var c = FAQ[i].category || 'meta';
        if (!buckets[c]) buckets[c] = [];
        buckets[c].push(FAQ[i]);
      }
      var header =
        '<div class="pchat__browse-head">' +
          '<span>Browse all <strong>' + FAQ.length + '</strong> questions</span>' +
        '</div>' +
        '<div class="pchat__browse-search-wrap">' +
          '<input type="text" class="pchat__browse-search" data-browse-search ' +
            'placeholder="filter questions…  (↓ navigate, ↵ ask)" ' +
            'autocomplete="off" spellcheck="false" aria-label="Filter questions">' +
          '<span class="pchat__browse-empty" data-browse-empty hidden>no questions match — try fewer words</span>' +
        '</div>';
      // Render in canonical order, then any leftover categories alphabetically
      var html = header;
      var rendered = {};
      CATEGORY_ORDER.forEach(function (cat) {
        if (!buckets[cat] || !buckets[cat].length) return;
        rendered[cat] = true;
        html += renderCategory(cat, buckets[cat]);
      });
      Object.keys(buckets).sort().forEach(function (cat) {
        if (rendered[cat]) return;
        html += renderCategory(cat, buckets[cat]);
      });
      browseView.innerHTML = html;
      // Wire row clicks → submit as a new chat message
      browseView.querySelectorAll('[data-browse-q]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var q = btn.getAttribute('data-browse-q');
          closeBrowse();
          send(q);
        });
      });
      // Wire the search/filter
      var searchEl = browseView.querySelector('[data-browse-search]');
      var emptyEl = browseView.querySelector('[data-browse-empty]');
      if (searchEl) {
        searchEl.addEventListener('input', function () {
          filterBrowse(searchEl.value, emptyEl);
        });
        // Keyboard nav from the search box
        searchEl.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            focusFirstVisibleRow();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            // Submit the first visible row's question
            var first = visibleRows()[0];
            if (first) { closeBrowse(); send(first.getAttribute('data-browse-q')); }
          }
        });
      }
      // Keyboard nav on rows themselves (arrow up/down + enter)
      browseView.querySelectorAll('[data-browse-q]').forEach(function (btn) {
        btn.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            var rows = visibleRows();
            var idx = rows.indexOf(btn);
            var next = e.key === 'ArrowDown' ? rows[idx + 1] : rows[idx - 1];
            if (next) next.focus();
            else if (e.key === 'ArrowUp' && searchEl) searchEl.focus();
          }
        });
      });
    }
    function visibleRows() {
      return Array.prototype.slice.call(
        browseView.querySelectorAll('[data-browse-q]:not([hidden])')
      );
    }
    function focusFirstVisibleRow() {
      var rows = visibleRows();
      if (rows[0]) rows[0].focus();
    }
    function filterBrowse(query, emptyEl) {
      var q = normalize(query);
      var anyVisible = false;
      // Persist the query so opening browse later restores it
      try {
        if (q) sessionStorage.setItem(BROWSE_QUERY_KEY, query);
        else sessionStorage.removeItem(BROWSE_QUERY_KEY);
      } catch (_) {}
      var sections = browseView.querySelectorAll('.pchat__browse-cat');
      sections.forEach(function (section) {
        var sectionVisible = false;
        section.querySelectorAll('[data-browse-q]').forEach(function (row) {
          var entryIdx = parseInt(row.getAttribute('data-browse-idx'), 10);
          var entry = FAQ[entryIdx];
          if (!entry) { row.hidden = true; return; }
          var qText = row.getAttribute('data-browse-q') || '';
          var match = !q;
          if (!match && entry._normCache) {
            for (var i = 0; i < entry._normCache.length; i++) {
              if (entry._normCache[i].indexOf(q) !== -1) { match = true; break; }
            }
          }
          row.hidden = !match;
          // Highlight matching substring in the visible row text
          if (match && q) {
            row.innerHTML = highlightMatch(qText, query);
          } else if (match) {
            row.innerHTML = escapeText(qText);
          }
          if (match) { sectionVisible = true; anyVisible = true; }
        });
        section.hidden = !sectionVisible;
      });
      if (emptyEl) emptyEl.hidden = anyVisible || !q;
    }
    // Wraps every occurrence of `query` (case-insensitive) in the haystack
    // with a <mark> so the user sees why each row matched.
    function highlightMatch(haystack, query) {
      var qNorm = String(query || '').trim();
      if (!qNorm) return escapeText(haystack);
      // Build a case-insensitive matcher escaping regex special chars
      var safe = qNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp('(' + safe + ')', 'gi');
      // Escape the haystack first, then run regex on the escaped version
      var escaped = escapeText(haystack);
      return escaped.replace(re, '<mark class="pchat__hl">$1</mark>');
    }
    function renderCategory(slug, entries) {
      var label = CATEGORY_LABELS[slug] || slug;
      var rows = entries.map(function (e) {
        var idx = FAQ.indexOf(e);
        return '<button type="button" class="pchat__browse-row" data-browse-q="' + escapeAttr(e.q) + '" data-browse-idx="' + idx + '">' +
                 escapeText(e.q) +
               '</button>';
      }).join('');
      return '<section class="pchat__browse-cat">' +
               '<h4 class="pchat__browse-cat-title">' + escapeText(label) + ' <span class="pchat__browse-cat-count">' + entries.length + '</span></h4>' +
               '<div class="pchat__browse-rows">' + rows + '</div>' +
             '</section>';
    }
    function openBrowse() {
      buildBrowseView();
      body.hidden = true;
      browseView.hidden = false;
      browseView.scrollTop = 0;
      browseBtn.setAttribute('aria-pressed', 'true');
      var searchEl = browseView.querySelector('[data-browse-search]');
      var emptyEl = browseView.querySelector('[data-browse-empty]');
      // Restore the last query (if any) so the filter persists across opens
      try {
        var lastQ = sessionStorage.getItem(BROWSE_QUERY_KEY);
        if (lastQ && searchEl) {
          searchEl.value = lastQ;
          filterBrowse(lastQ, emptyEl);
        }
      } catch (_) {}
      // Auto-focus the filter input so the user can start typing immediately
      if (searchEl) setTimeout(function () {
        searchEl.focus();
        // Select existing value so a new query overwrites cleanly
        if (searchEl.value) searchEl.select();
      }, 40);
    }
    function closeBrowse() {
      browseView.hidden = true;
      body.hidden = false;
      browseBtn.setAttribute('aria-pressed', 'false');
    }
    function toggleBrowse() {
      browseView.hidden ? openBrowse() : closeBrowse();
    }

    var lastFocus = null;

    function renderSuggestions() {
      // Pick 4 random suggestions; if conversation has messages, show 3.
      var hasMessages = body.querySelectorAll('.pchat__msg').length > 0;
      var n = hasMessages ? 3 : 4;
      var shuffled = SUGGESTIONS.slice().sort(function () { return Math.random() - 0.5; });
      suggBox.innerHTML = shuffled.slice(0, n).map(function (q) {
        return '<button type="button" class="pchat__sugg" data-q="' + escapeAttr(q) + '">' + escapeText(q) + '</button>';
      }).join('');
      suggBox.querySelectorAll('.pchat__sugg').forEach(function (b) {
        b.addEventListener('click', function () { send(b.getAttribute('data-q')); });
      });
    }
    function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }
    function escapeText(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function appendMsg(role, html) {
      var msg = document.createElement('div');
      msg.className = 'pchat__msg pchat__msg--' + role;
      msg.innerHTML = '<div class="pchat__msg-bubble">' + html + '</div>';
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
      return msg;
    }
    function appendTyping() {
      var msg = document.createElement('div');
      msg.className = 'pchat__msg pchat__msg--bot pchat__msg--typing';
      msg.innerHTML = '<div class="pchat__msg-bubble"><span class="pchat__dots"><i></i><i></i><i></i></span></div>';
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
      return msg;
    }

    function send(rawText) {
      var text = String(rawText || '').trim();
      if (!text) return;
      appendMsg('user', escapeText(text));
      saveHistory();
      input.value = '';
      renderSuggestions();

      var typing = appendTyping();
      // Small delay so it feels like the bot is thinking, not instant-search
      var delay = prefersReduced ? 80 : 320 + Math.random() * 180;
      setTimeout(function () {
        typing.remove();
        var match = findMatch(text);
        if (match) {
          appendMsg('bot', match.a);
        } else {
          // Solidified fallback: show top-3 "did you mean?" entries as
          // clickable chips so a missed query has a rebound path. The
          // contact CTAs stay as the secondary option.
          var related = findCloseMatches(text, 3);
          var html =
            "I don’t have a curated answer for <em>" + escapeText(text) + "</em>.";
          if (related.length) {
            html += " Did you mean one of these?" +
              "<div class=\"pchat__fallback-related\">" +
                related.map(function (e, idx) {
                  return '<button type="button" class="pchat__sugg" data-rebound="' + idx + '">' + escapeText(e.q) + '</button>';
                }).join('') +
              "</div>";
          } else {
            html += " The fastest path is to ask directly:";
          }
          html +=
            "<div class=\"pchat__fallback-actions\">" +
              "<a class=\"pchat__fallback-btn pchat__fallback-btn--primary\" href=\"https://cal.com/lemmuel-turaya/intro\" target=\"_blank\" rel=\"noopener\">Book a 15-min call →</a>" +
              "<a class=\"pchat__fallback-btn\" href=\"mailto:turayalemmuel@gmail.com\">Email me</a>" +
            "</div>";
          var node = appendMsg('bot', html);
          // Wire the rebound chips so clicking one resubmits as a new question
          node.querySelectorAll('[data-rebound]').forEach(function (b, i) {
            b.addEventListener('click', function () { send(related[i].q); });
          });
        }
        saveHistory();
      }, delay);
    }

    function saveHistory() {
      try {
        var msgs = [];
        body.querySelectorAll('.pchat__msg').forEach(function (m) {
          if (m.classList.contains('pchat__msg--typing')) return;
          msgs.push({
            role: m.classList.contains('pchat__msg--user') ? 'user' : 'bot',
            html: m.querySelector('.pchat__msg-bubble').innerHTML
          });
        });
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
      } catch (e) {}
    }
    function restoreHistory() {
      try {
        var raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var msgs = JSON.parse(raw);
        if (!Array.isArray(msgs) || !msgs.length) return;
        msgs.forEach(function (m) { appendMsg(m.role, m.html); });
      } catch (e) {}
    }

    function open() {
      lastFocus = document.activeElement;
      panel.hidden = false;
      bubble.setAttribute('aria-expanded', 'true');
      // Body class lets CSS dim the siderail / HUD / viewport-hud so
      // their tooltips and dots don't show through the chat panel.
      document.body.classList.add('pchat-active');
      renderSuggestions();
      setTimeout(function () { input.focus(); }, 30);
    }
    function close() {
      panel.hidden = true;
      bubble.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('pchat-active');
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
        lastFocus = null;
      }
    }
    function reset() {
      body.querySelectorAll('.pchat__msg').forEach(function (m) { m.remove(); });
      try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
      renderSuggestions();
    }

    bubble.addEventListener('click', function () {
      panel.hidden ? open() : close();
    });
    closeBtn.addEventListener('click', close);
    resetBtn.addEventListener('click', reset);
    browseBtn.addEventListener('click', toggleBrowse);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      send(input.value);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) close();
    });

    restoreHistory();
    renderSuggestions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
}());
