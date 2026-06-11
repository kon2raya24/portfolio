/* =============================================================================
   NIGHT SHIFT — mission content (the load-bearing truth)
   Authored from the nine published case studies + resume.json. Every metric,
   every architectural "call", and every outcome is real — do not invent here.
   Rendered as DOM textContent throughout, so plain characters (->, &) are fine.
   Edit a case study? Update the matching mission so the game stays honest.
   ========================================================================== */

export const MISSIONS = {
  'wms-v2': {
    id: 'wms-v2', name: 'CANON-V3', realName: 'WMS v2 · Inventory Rewrite',
    systemClass: 'WAREHOUSE', schematicType: 'warehouse', tier: 1, difficulty: 'CRITICAL',
    summary: 'A ground-up rewrite of an enterprise multi-warehouse, multi-tenant WMS — receiving, picking, packing, dispatch, validation, count-sheets, stock movement, audit trails — onto Laravel 12 + Vue 3, organized around one canonical V3 list-page pattern so every new module mirrors a known-good template.',
    arrival_problem: 'The legacy WMS ran fine in production every day — but it had rotted to the point where writing a new system was faster than editing the old one. ~113 controllers on Laravel 8 with no shared CRUD foundation, ~130 Vue 2 pages with three competing grid patterns, and 5x the data volume since launch.',
    hotspots: [
      { label: 'No shared CRUD foundation', reveal: 'All ~113 legacy controllers reinvented pagination, validation, filtering, and audit logging by hand; adding a module touched ~15 files spread across the codebase.' },
      { label: 'Three competing grid patterns', reveal: 'The ~130 Vue 2 pages had at least three different list-grid implementations, so small UX changes shipped inconsistently across modules.' },
      { label: 'End-of-life toolchain', reveal: 'Vue 2 LTS ended, Nuxt 2 ended, and a PHP 7.x baseline capped what the backend could do — the stack itself was a liability.' },
      { label: 'Agents confused by drift', reveal: 'The team leans on Claude Code and Cursor, but inconsistent patterns made each AI session produce slightly different code shapes.' },
      { label: 'Full-table report scans', reveal: 'Some reports scanned entire 100K+ row tables because they were written with ->get() before ->cursor() was an option.' },
    ],
    call: {
      prompt: 'The legacy system is live and serving real multi-warehouse traffic — it cannot go down during the transition. Rewrite behind a flag module-by-module, or attempt a big-bang cutover?',
      options: [
        { id: 'a', label: 'Parity matrix, module-by-module behind a toggle', tradeoff: 'Two systems run in parallel for a long time; the parity matrix becomes a rollout source-of-truth you must keep honest.' },
        { id: 'b', label: 'Big-bang cutover to Laravel 12 / Vue 3', tradeoff: 'Clean break, but every legacy capability must be verified at once and any miss takes down production.' },
        { id: 'c', label: 'Strangler proxy routing per endpoint', tradeoff: 'Finer-grained than modules, but adds a routing layer and its own operational surface.' },
      ],
      actual: 'a',
      reasoning: 'He chose a parity-first, module-by-module rollout behind a toggle, with docs/parity/feature-matrix.md (planned / in-progress / shipped / verified) as the single source of truth. The legacy system stays the per-module fallback until v2 is verified. He knowingly ate the cost of running two systems in parallel — in exchange for never breaking production during the transition.',
    },
    outcomes: [
      { metric: 'domain models', value: '~103' }, { metric: 'migrations', value: '~121' },
      { metric: 'UI pages', value: '~130' }, { metric: 'canonical pattern', value: 'V3 receiving' },
      { metric: 'online DDL', value: 'INPLACE / LOCK=NONE' },
    ],
    tools: ['Laravel 12', 'Vue 3', 'Spatie Laravel-Permission', 'AG Grid Enterprise', 'PHPStan', 'ESLint', 'Playwright', 'MySQL online DDL'],
    archiveUrl: 'case-studies/wms-v2.html',
  },

  'tms': {
    id: 'tms', name: 'DISPATCH-1', realName: 'Transport Management System',
    systemClass: 'FLEET', schematicType: 'fleet', tier: 1, difficulty: 'CRITICAL',
    summary: 'A full-stack TMS on Vue 3 + Laravel 11 running an enterprise logistics operator\'s transport arm end-to-end — booking, dispatch, costing/charges, live-GPS tracking, incidents, maintenance scheduling, through to invoice. Shares Sanctum auth and Spatie permissions with the WMS mobile app and the CS CRM.',
    arrival_problem: 'Before the TMS, transport ops ran on whiteboards, a chat group, and a shared Excel file that drifted. GPS came from the carrier\'s portal in a second browser tab, costing was computed by hand from a rate-card workbook, and billing was an end-of-month reconciliation scramble.',
    hotspots: [
      { label: 'No single intake queue', reveal: 'Bookings arrived by email, phone, and spreadsheet templates with no unified intake; dispatch status lived in a shared Excel file that drifted.' },
      { label: 'Two-tab GPS reconciliation', reveal: 'GPS feeds came from the carrier\'s portal, so ops kept two browser tabs open and reconciled truck positions by eye.' },
      { label: 'Tariff edits are the feared change', reveal: 'Costing was computed manually from a rate-card workbook; tariff edits reverberate through costing and are still the most-feared edit in the system.' },
      { label: 'Charges: catalog vs applied', reveal: 'Charges are a first-class subsystem (Charges / ChargeList / ChargeDetail / ChargeHeader) so rate changes don\'t retroactively rewrite booking history.' },
      { label: 'Client-side GPS polling', reveal: 'The Vue app polls and interpolates truck positions client-side, draining dispatcher laptop batteries — a known item to push server-side.' },
    ],
    call: {
      prompt: 'The transport team needs dense, fine-grained role permissions (book, dispatch, edit costing, release invoice) shared with the WMS app and CRM. Buy a proven RBAC package, or hand-roll one like the earlier brokerage projects did?',
      options: [
        { id: 'a', label: 'Buy Spatie Laravel-Permission', tradeoff: 'An external dependency to track, but proven ergonomics for a dense permission matrix.' },
        { id: 'b', label: 'Hand-roll RBAC from scratch', tradeoff: 'Total control over OU-scoping, but days of build cost — the exact expense JBC and Pamanaland paid.' },
        { id: 'c', label: 'Laravel Gates / Policies only', tradeoff: 'No extra dependency, but every fine-grained verb becomes bespoke policy code that drifts.' },
      ],
      actual: 'a',
      reasoning: 'He bought Spatie Laravel-Permission rather than building from scratch. The transport team\'s permission matrix is dense enough that Spatie\'s ergonomics paid for themselves in week one, saving days versus the hand-rolled JBC/Pamanaland approach. The accepted tradeoff: a third-party dependency carried across the shared ops stack, layered with a CommonPermission overlay for OU-style data restrictions.',
    },
    outcomes: [
      { metric: 'domain models', value: '~68' }, { metric: 'API controllers', value: '~99' },
      { metric: 'migrations', value: '~98' }, { metric: 'UI pages', value: '~324' },
      { metric: 'domain folders', value: '20+' }, { metric: 'live GPS', value: 'yes' },
    ],
    tools: ['Vue 3', 'Laravel 11', 'Sanctum', 'Spatie Laravel-Permission', 'AG Grid Enterprise', 'Velzon', 'DomPDF', 'maatwebsite/excel', 'MySQL'],
    archiveUrl: 'case-studies/tms.html',
  },

  'ai-engineer': {
    id: 'ai-engineer', name: 'GHOST-CREW', realName: 'Autonomous AI Engineer (Ticketing)',
    systemClass: 'SERVICE-DESK', schematicType: 'queue', tier: 1, difficulty: 'CRITICAL',
    summary: 'A production multi-LLM agent pipeline inside an enterprise ticketing system, where a User row named "AI Engineer" can be assigned tickets like any human dev. `php artisan ai:work {ref}` picks up an ASSIGNED ticket, auto-detects the target repo, makes the change with the chosen LLM, and a separate verifier runs the real test suite before a human reviews the merge.',
    arrival_problem: 'A small dev team supporting WMS, TMS, CRM, Ticketing, HR, and a Developer Portal had a long tail of 15-30 minute tickets that cost hours of context-switching across 8+ repos. AI-assisted ad-hoc fixes were already happening informally — with no audit trail, no test verification, and no permission boundary.',
    hotspots: [
      { label: 'ASSIGNED-only security gate', reveal: 'The agent only works tickets in ASSIGNED board status (IDs 2 or 12); Triage, Backlog, In Review, and Done are rejected at the command level so the AI can\'t pick up unauthorized work.' },
      { label: 'One ticket -> one repo', reveal: 'The systems table maps each system code to its target repo (e.g. WMS -> aai-wms-api); the command auto-detects the repo from ticket.system, so there\'s no cross-repo drift.' },
      { label: 'Verifier is a separate process', reveal: 'ai:verify runs in its own process from ai:work using `php artisan test`, so the verifier can\'t be coerced by whatever the agent claimed it did — the real suite is the source of truth.' },
      { label: 'Persistent per-ticket memory', reveal: 'An AIChatMemory model keeps per-ticket conversation history so a follow-up ai:work continues the thread instead of cold-starting.' },
      { label: 'Runs on the host filesystem', reveal: 'The AI runs against the real repo on the host filesystem today; a per-run ephemeral container or worktree would isolate cross-ticket contamination risk.' },
    ],
    call: {
      prompt: 'The team wants AI assistance without paste-into-chat chaos — but the AI\'s patches still have to be trusted. Do you let ai:work also run and self-certify its tests, or split verification into a separate command the agent can\'t influence?',
      options: [
        { id: 'a', label: 'Separate, independent ai:verify process', tradeoff: 'An extra command in the loop, but the test result can\'t be faked by the agent.' },
        { id: 'b', label: 'Self-verification inside ai:work', tradeoff: 'One smooth command, but the agent reports its own pass/fail — the thing you least want to trust.' },
        { id: 'c', label: 'Defer all verification to human review', tradeoff: 'Simplest pipeline, but recreates the review-fatigue problem of hand-merging unverified AI code.' },
      ],
      actual: 'a',
      reasoning: 'He deliberately split ai:work from ai:verify into separate processes so the verifier can\'t be coerced by whatever the agent said it did — the real PHPUnit suite is the source of truth, and its pass/fail plus stdout is logged to the ticket thread before any human review. He accepts the extra command, and that verification currently runs locally on the AI host rather than in CI proper — the next thing he\'d tighten.',
    },
    outcomes: [
      { metric: 'LLM brains wired in', value: '5' }, { metric: 'console commands', value: '3' },
      { metric: 'security gates', value: 'board + repo' }, { metric: 'verification', value: 'PHPUnit' },
      { metric: 'auto-close after deploy', value: '72', unit: 'h' },
    ],
    tools: ['Laravel 11', 'Sanctum', 'Spatie Permissions', 'Claude', 'Gemini', 'OpenAI', 'OpenRouter', 'Qwen', 'PHPUnit'],
    archiveUrl: 'case-studies/ai-engineer.html',
  },

  'wms': {
    id: 'wms', name: 'FLOORHAND', realName: 'WMS Mobile App (Flutter)',
    systemClass: 'MOBILE', schematicType: 'beacon', tier: 1, difficulty: 'COMPLEX',
    summary: 'A hardware-integrated Flutter warehouse app that replaces paper picklists and laptop-bound operations with one device the picker carries on the floor. 13 feature modules sync to the same Laravel REST API the Nuxt web admin uses, with Bluetooth ESC/POS label printing and offline-first sync.',
    arrival_problem: 'Before the app, warehouse workflows lived on desktop browser sessions, printed picklists, and manual XLSX exports. Pickers walked back and forth between the floor and a fixed workstation to confirm each step, stock counts drifted through the day, and shaky warehouse Wi-Fi lost scans mid-aisle.',
    hotspots: [
      { label: 'Offline replay queue', reveal: 'A Hive-backed FIFO queue records every scan/confirm/print locally and replays it on reconnect, so Wi-Fi drops never cost an operator a confirm.' },
      { label: 'Dual-input scanning', reveal: 'The same screens accept either camera scans (mobile_scanner) or hardware keyboard-wedge input from Zebra/Honeywell devices — one UX, two device classes, no code fork.' },
      { label: 'Bluetooth ESC/POS printing', reveal: 'bluetooth_print_plus drives Epson TM-P80II thermal printers directly from the picker\'s phone for box-label print-on-pick at the bin.' },
      { label: 'Three picking generations', reveal: 'Picking was iterated three times (picking -> picking_enhanced -> picking_v3) on real floor feedback; the shared core grew implicitly across versions.' },
      { label: 'Turnstile pigeon channel-error', reveal: 'Cloudflare Turnstile\'s WebView raced plugin registration on cold start; promoting webview_flutter_android to a direct dependency with eager-init in main.dart fixed the cryptic pigeon channel-error.' },
    ],
    call: {
      prompt: 'The web WMS is the source of truth and must stay that way. Give the mobile app its own backend and mobile DTOs, or have it call the exact same REST endpoints the Nuxt admin already uses?',
      options: [
        { id: 'a', label: 'Reuse the existing REST API as-is', tradeoff: 'No divergent business rules to drift, but mobile is constrained by endpoints shaped for the web.' },
        { id: 'b', label: 'Build a dedicated mobile backend', tradeoff: 'Mobile-optimized payloads, but a second set of business rules that drift from the web over time.' },
        { id: 'c', label: 'BFF gateway in front of the API', tradeoff: 'Tailored mobile responses without forking rules, but a new layer to deploy and keep in sync.' },
      ],
      actual: 'a',
      reasoning: 'He had the mobile app call the exact same Laravel endpoints the Nuxt web admin calls — no separate mobile backend, no divergent DTOs, no parallel business rules to drift. The accepted tradeoff: mobile rides endpoints shaped for the web. He keeps a single source of truth and pairs it with an offline-first replay queue so the floor keeps working through Wi-Fi drops.',
    },
    outcomes: [
      { metric: 'build releases', value: '108' }, { metric: 'feature modules', value: '13' },
      { metric: 'app version', value: '1.4.27' }, { metric: 'API models', value: '~251' },
      { metric: 'API migrations', value: '~315' }, { metric: 'offline resilience', value: 'queue-replay' },
    ],
    tools: ['Flutter', 'Dart', 'Hive', 'bluetooth_print_plus', 'mobile_scanner', 'Laravel', 'MySQL', 'Cloudflare Turnstile'],
    archiveUrl: 'case-studies/wms.html',
  },

  'hris': {
    id: 'hris', name: 'ROSTER-CORE', realName: 'Enterprise HRIS',
    systemClass: 'HR-CORE', schematicType: 'org', tier: 2, difficulty: 'COMPLEX',
    summary: 'A modern HRIS on Laravel 12 + Vuestic Admin (Vite + Pinia + TypeScript) covering the full employee lifecycle — records, org units, time & attendance, leave, payroll, memos, performance — under OU-scoped RBAC with TOTP 2FA. Time logs, schedules, approvals, payroll, and audit trail share the same row of the same table.',
    arrival_problem: 'HR ran on spreadsheets and standalone tools per process — a payroll workbook, a leave tracker, a time-sheet exporter, a Word-template memo flow — and nothing talked to anything. Leave balances drifted from payroll deductions, and a Manila supervisor could accidentally see another branch\'s payslips.',
    hotspots: [
      { label: 'Concurrency-safe memo numbering', reveal: 'Memo numbers must be strictly sequential per OU per year, so allocation uses a MySQL GET_LOCK advisory lock that times out after 5s — two simultaneous publishes can\'t collide.' },
      { label: 'One concern per model', reveal: 'Employee is split into 9+ related models (PersonalInfo, Contact, Document, Allowance, Deduction, Certification, Training, EmploymentHistory) instead of one fat row.' },
      { label: 'OU scope on every query', reveal: 'Role + Permission + RolePermission + RoleOrganizationalUnit mean every payroll/employee/memo query checks both role permission AND OU scope.' },
      { label: 'Biometric reconciliation', reveal: 'Attendance from biometric exports is reconciled against schedules, shift assignments, and approved overtime/official-business slips rather than hand-matched.' },
      { label: 'Two CI pipelines', reveal: 'Jenkinsfile (on-prem) and buddy.yml (cloud) build the same target from different triggers — a double-maintenance cost he\'d now consolidate to one.' },
    ],
    call: {
      prompt: 'Two HR officers can click publish on draft memos in the same OU at the same instant, and each needs a strictly sequential number. Serialize numbering with a database advisory lock, or solve it at the application layer?',
      options: [
        { id: 'a', label: 'MySQL GET_LOCK advisory lock', tradeoff: 'A short serialization point per allocation, but correct under load with no app-level lock manager to maintain.' },
        { id: 'b', label: 'App-level distributed lock (Redis)', tradeoff: 'Scales across nodes but adds infrastructure and another failure mode to operate.' },
        { id: 'c', label: 'Retry-on-unique-collision', tradeoff: 'No locking, but retry storms under concurrent publishes and messier failure handling.' },
      ],
      actual: 'a',
      reasoning: 'He used a MySQL GET_LOCK advisory lock keyed per OU and year, scoped tightly with a 5s timeout and a finally-block release. It\'s correct under load with no retry storms and no app-level lock manager to maintain. The accepted tradeoff: a brief serialization point on each memo allocation — cheap, since memos publish far less often than the cost of a colliding number.',
    },
    outcomes: [
      { metric: 'domain models', value: '~54' }, { metric: 'API controllers', value: '~41' },
      { metric: 'migrations', value: '~57' }, { metric: 'UI pages', value: '~95' }, { metric: '2FA', value: 'TOTP' },
    ],
    tools: ['Laravel 12', 'Vue 3', 'Vite', 'Pinia', 'TypeScript', 'Vuestic Admin', 'AG Grid Enterprise', 'google2fa', 'Storybook', 'Playwright'],
    archiveUrl: 'case-studies/hris.html',
  },

  'jbc': {
    id: 'jbc', name: 'SPLITWORKS', realName: 'Brokerage Commission System',
    systemClass: 'COMMISSION', schematicType: 'grid', tier: 2, difficulty: 'COMPLEX',
    summary: 'A Vue + Laravel platform running a real-estate brokerage end-to-end — property catalog, sales pipeline, a multi-tier commission engine with approver workflow, multi-OU RBAC, expenses, cash advances, HR-lite. It replaces a tangle of spreadsheets with one auditable ledger where a sale, its installments, its approver chain, and its payouts live together.',
    arrival_problem: 'Real-estate brokerage commissions are unusually messy: one sale splits payouts across multiple agents, teams, and the brokerage, with releases over many periods as the buyer pays installments. Commission shares lived in spreadsheets with no single source of truth and no approval trail when a release moved money.',
    hotspots: [
      { label: 'Four explicit commission nouns', reveal: 'The lifecycle is modeled as transaction -> share -> release -> approver instead of one "commission" table, so every production edge case had a place to live.' },
      { label: 'Hand-rolled multi-OU RBAC', reveal: 'Roles, permissions, role-to-OU bindings, and per-user menu access were built from scratch — thorough but expensive; Spatie would have covered ~80% in a day.' },
      { label: 'CommissionRelease v1 -> v2', reveal: 'The first release model didn\'t separate "computed share" from "released amount" cleanly; the v2 rewrite that made the distinction explicit simplified downstream reports.' },
      { label: '~100 iterative migrations', reveal: 'About 100 migrations over ~22 months, many small add_column follow-ups as new edge cases surfaced in production — no multi-week schema-rewrite outage.' },
      { label: 'Cash advances reconcile to releases', reveal: 'CashAdvance with CashAdvancePayTerm deduction schedules tie repayments to upcoming commission releases automatically.' },
    ],
    call: {
      prompt: 'The brokerage runs several operating units that need their own data boundaries on a shared platform, with overlapping but distinct roles. Build the RBAC and OU-scoping yourself, or pull in a proven package?',
      options: [
        { id: 'a', label: 'Build roles/permissions/OU from scratch', tradeoff: 'Fits the org\'s exact shades of access, but an expensive, thorough build to maintain.' },
        { id: 'b', label: 'Adopt Spatie Laravel-Permission', tradeoff: 'Covers ~80% in a day, leaving only OU-scoping — but a one-size-fits-all admin/agent split doesn\'t match the real org.' },
      ],
      actual: 'a',
      reasoning: 'At the time he built the full roles + permissions + OU bindings + menu-access matrix from scratch, because the real org had more shades than a one-size-fits-all admin/agent split. He explicitly names the tradeoff as expensive and, in hindsight, would reach for Spatie next time to cover ~80% in a day and write only the OU-scoping — which is exactly what he later did on the TMS.',
    },
    outcomes: [
      { metric: 'domain models', value: '52' }, { metric: 'migrations', value: '~100' },
      { metric: 'combined commits', value: '~640' }, { metric: 'iteration span', value: '~22', unit: 'mo' },
      { metric: 'multi-OU RBAC', value: 'yes' },
    ],
    tools: ['Vue.js', 'Laravel', 'MySQL', 'Sanctum', 'REST', 'Velzon'],
    archiveUrl: 'case-studies/jbc.html',
  },

  'pamanaland': {
    id: 'pamanaland', name: 'DEEDFLOW', realName: 'Real-Estate Developer Portal',
    systemClass: 'REALTY', schematicType: 'grid', tier: 2, difficulty: 'COMPLEX',
    summary: 'A Vue 3 + Laravel 11 platform running a real-estate developer end-to-end — projects, units, reservations, sales (equity + amortization), in-house financing, commission, collection, sales returns, assumed units — with a five-tier seller hierarchy and OU-scoped RBAC. SOAs, payment reminders, and notices of cancellation are generated programmatically, not from Excel macros.',
    arrival_problem: 'The developer\'s day-to-day ran on shared Excel files for inventory, email threads for leads and approvals, and manual commission math across a multi-tier hierarchy that varied per project. In-house amortization schedules were tracked separately from the sale and SOA, so reconciliation was a manual cross-reference.',
    hotspots: [
      { label: 'Full lifecycle as explicit nouns', reveal: 'Reservation -> Sales -> Equity -> Amortization -> CollectionReceipt -> CommissionReceipt -> Release, so reports build themselves out of joins instead of a mega-table.' },
      { label: 'Five-tier commission cascade', reveal: 'A single sale generates commission entries for every tier above the closing salesperson — Director -> Manager -> Unit Manager -> Team Leader -> Salesperson — each with its own percent and ledger destination.' },
      { label: 'CASL plus OU permissions', reveal: 'Permissions in abilities.js are loaded per user from the API, cached in Vuex + localStorage, and re-checked on every route guard against what the backend enforces — no UI/API drift.' },
      { label: 'Scheduled reminders & notices', reveal: 'Payment-reminder and clock-out-reminder jobs run from Laravel\'s scheduler with production runbooks shipped next to the code.' },
      { label: 'Schema reverse-engineered', reveal: 'kitloong/laravel-migrations-generator and orangehill/iseed generated migrations and seeds from an existing schema and data.' },
    ],
    call: {
      prompt: 'Frontend and backend both need to enforce the same access rules down to the salesperson level across many domains. Enforce on the server and re-derive the UI from the same permission set, or let the frontend define its own menu/route logic?',
      options: [
        { id: 'a', label: 'CASL front + OU permissions back, one set', tradeoff: 'Dynamic menus and route guards stay in lockstep with the API, at the cost of loading and caching the permission set per user.' },
        { id: 'b', label: 'Independent frontend menu logic', tradeoff: 'Simpler client code, but "what the UI shows" drifts from "what the API allows".' },
      ],
      actual: 'a',
      reasoning: 'He drove CASL abilities on the frontend from the same permission set the backend\'s OU-scoped checks enforce — loaded per user, cached in Vuex + localStorage, re-validated in route guards. This kept dynamic menus and the API in lockstep with no drift. As with JBC he hand-built the matrix and notes he\'d reach for Spatie next time to save the ~80% boilerplate.',
    },
    outcomes: [
      { metric: 'domain models', value: '~65' }, { metric: 'API controllers', value: '~67' },
      { metric: 'migrations', value: '~99' }, { metric: 'UI views', value: '~102' }, { metric: 'seller tiers', value: '5' },
    ],
    tools: ['Vue 3', 'Laravel 11', 'tymon/jwt-auth', 'CASL', 'AG Grid Enterprise', 'Vuex', 'Bootstrap Vue 3', 'MySQL'],
    archiveUrl: 'case-studies/pamanaland.html',
  },

  'ph-dev-utils': {
    id: 'ph-dev-utils', name: 'PRIMITIVE-PH', realName: '@ph-dev-utils — Filipino Developer Utilities',
    systemClass: 'TOOLKIT', schematicType: 'grid', tier: 2, difficulty: 'COMPLEX',
    summary: 'An open-source family of 12 focused packages encoding the Philippine-specific primitives local apps keep rebuilding — peso formatting, ~10 government-ID validators, the full PSGC address hierarchy, ZIP codes, statutory payroll, BIR tax, holiday-aware dates, seedable fake data, a React address picker. 11 of 12 publish identical behavior on both npm and Packagist, fronted by a live playground running the real published packages.',
    arrival_problem: 'Almost every app built for the Philippine market needs the same primitives, and almost every team re-implements them incompletely and never the same way twice. Worse, the same business rule gets coded once in the Laravel backend and again in the JS frontend — they drift, so a TIN valid on one side fails on the other.',
    hotspots: [
      { label: 'JS-PHP parity as a hard rule', reveal: '11 packages publish on both npm (@ph-dev-utils/*) and Packagist (phdevutils/*) with the same function surface and identical outputs, so backend and frontend can\'t disagree by construction.' },
      { label: 'Demos are the test harness', reveal: 'The showcase lists the real packages as dependencies and runs them in the browser, so a breaking change in any published version surfaces as a visibly broken demo on the next deploy.' },
      { label: '42,046-barangay dataset', reveal: 'The PSGC barangay set (PSA Q4 2024) is too large for the browser, so psgc-barangays and postal are server-side packages while the other ten run in-browser.' },
      { label: 'Versioned, not frozen', reveal: 'Contribution and tax tables change by circular, so they\'re versioned inside the packages rather than hard-coded as permanent; sources (PSA, BIR/SSS/PhilHealth/Pag-IBIG/DOLE, GeoNames) are credited.' },
      { label: 'Single typed catalog', reveal: 'One typed PACKAGES[] array is the source of truth for every card, badge, version, anchor, and external link on the site — adding the 13th package is a single structured entry.' },
    ],
    call: {
      prompt: 'You\'re encoding many distinct PH concerns — money, IDs, addresses, payroll, tax, geo, banks. Ship one mega-library, or split each concern into its own small package?',
      options: [
        { id: 'a', label: 'Many small focused packages', tradeoff: 'Projects install only what they need and heavy datasets stay opt-in, at the cost of maintaining and versioning a whole family.' },
        { id: 'b', label: 'One mega-library', tradeoff: 'One install and one version, but the 42k-barangay dataset bloats everyone\'s bundle whether they use addresses or not.' },
      ],
      actual: 'a',
      reasoning: 'He split each concern into its own package (core, payroll, bir, dates, banks, geo, psic, business, postal, psgc-barangays, faker, address-picker) so a project pulls in only what it needs and the heavy datasets stay opt-in. The accepted tradeoff: maintaining a 12-package family across two ecosystems — which he keeps honest with a single typed catalog and a playground that doubles as the smoke test.',
    },
    outcomes: [
      { metric: 'packages in family', value: '12' }, { metric: 'dual-published', value: '11' },
      { metric: 'live in-browser demos', value: '10' }, { metric: 'PSGC barangays', value: '42,046' },
      { metric: 'ZIP/postal codes', value: '2,048' }, { metric: 'banks & e-money', value: '158' },
    ],
    tools: ['React 19', 'TypeScript', 'Vite 8', 'Tailwind CSS', 'npm', 'Packagist', 'Vercel'],
    archiveUrl: 'case-studies/ph-dev-utils.html',
  },

  'llm-wiki': {
    id: 'llm-wiki', name: 'MEMORY-VAULT', realName: 'LLM-Friendly Wiki (Obsidian)',
    systemClass: 'KNOWLEDGE', schematicType: 'beacon', tier: 2, difficulty: 'ROUTINE',
    summary: 'A hand-maintained Obsidian Markdown vault documenting a large enterprise WMS, built so a human engineer and an LLM coding agent land on the same page and immediately know what file maps to what doc, what depends on what, what was decided, and when it was last verified. Every page carries 7-field YAML frontmatter; every folder ships an _INDEX.md.',
    arrival_problem: 'The WMS is a real codebase — 251 models, 103 controllers, 315 migrations on the API; 130 Vue pages; 13 Flutter modules. A human onboarding to one module took days, and an LLM agent asked for a non-trivial change burned most of its context window just locating the right files. Decisions and runbooks lived in ephemeral, ungrepable Slack threads.',
    hotspots: [
      { label: 'Frontmatter as the contract', reveal: 'Every page has title, domain, source_paths[], db_connection, related[], tags[], last_verified; agents grep frontmatter first, body second — the structured fields answer ~80% of routing questions.' },
      { label: '_INDEX.md per folder', reveal: 'Each top-level folder ships an _INDEX.md naming every page with a one-line description, so agents grep the index instead of enumerating folders — cutting token cost dramatically.' },
      { label: 'Same-turn update rule', reveal: 'Every commit to source must bump last_verified on the matching wiki page in the same turn — the one rule that keeps a hand-maintained vault from rotting.' },
      { label: 'Decisions folder for the why', reveal: 'Architectural decisions live as dated ADRs, so when an agent finds an unusual choice in the code the wiki has the receipt instead of "a decision nobody remembers".' },
      { label: 'Integration quirks captured', reveal: 'One page per external system (SAP, YLEO, BBraun, BIPC, Epson) documents auth, payload shape, sample request/response, and known quirks so they aren\'t rediscovered per incident.' },
    ],
    call: {
      prompt: 'You need a single artifact both humans and AI agents can read deterministically and that stays current. Build an Obsidian Markdown vault sitting next to the code, or stand up a static-site documentation generator?',
      options: [
        { id: 'a', label: 'Obsidian Markdown vault, no build step', tradeoff: 'Plain Markdown editable anywhere with graph/backlinks for humans, but freshness depends on discipline rather than a pipeline.' },
        { id: 'b', label: 'Static-site generator', tradeoff: 'Polished rendered docs, but a build step, broken-link runtime, and a heavier path between an edit and a published page.' },
      ],
      actual: 'a',
      reasoning: 'He chose a plain Obsidian-compatible Markdown vault with no build step, so editing is plain Markdown in any editor while Obsidian gives humans graph view, tags, and backlinks. He knowingly accepts that a hand-maintained vault can rot, and counters it with the same-turn-update rule and helper scripts that flag stale last_verified dates — leaning on Karpathy\'s thesis that the most valuable artifact for AI-assisted coding is a well-structured wiki of your own code.',
    },
    outcomes: [
      { metric: 'top-level folders', value: '~20' }, { metric: 'frontmatter fields', value: '7' },
      { metric: 'source repos covered', value: '2' }, { metric: 'human + agent readable', value: 'yes' },
    ],
    tools: ['Obsidian', 'Markdown', 'YAML frontmatter', 'Claude Code', 'Karpathy guidelines'],
    archiveUrl: 'case-studies/llm-wiki.html',
  },
};

/* Station Zero — the tutorial node. The network's own status site (this very
   portfolio), played as your first job with the Dispatcher. Carries the
   about-me. Authored, not extracted — it is the meta-mission. */
export const TUTORIAL = {
  id: 'station-zero', name: 'STATION ZERO', realName: 'The Network Status Relay',
  systemClass: 'KNOWLEDGE', schematicType: 'grid', isTutorial: true, difficulty: 'ROUTINE',
  summary: 'The relay you are sitting in — the network\'s own status site. Lighting it is your first job, and how the rest of the board comes online.',
  arrival_problem: 'Relay\'s dark. Before you can see the network, you have to bring up the board you read it on. Small job. Good way to learn the panel.',
  hotspots: [
    { label: 'Who you are relieving', reveal: 'Operator on record: Lemmuel Turaya — full-stack & mobile developer, 6+ years, nine shipped systems across logistics, real-estate, and HR. You\'re sitting his chair tonight.' },
    { label: 'How he works', reveal: 'Vue / Nuxt + Laravel on the web, Flutter on mobile. Pairs daily with Claude Code — and builds autonomous multi-LLM agent pipelines of his own.' },
  ],
  call: {
    prompt: 'Relay\'s on battery backup. Bring it up on mains now, or run diagnostics first?',
    options: [
      { id: 'a', label: 'Bring it up on mains', tradeoff: 'Board lights immediately — the fast, correct call for a known-good relay.' },
      { id: 'b', label: 'Run diagnostics first', tradeoff: 'Thorough, but the relay\'s healthy — you\'d be stalling.' },
    ],
    actual: 'a',
    reasoning: 'Known-good relay, healthy battery — you bring it up on mains and watch the board light. (That\'s the job: read the situation, make the obvious call fast, save the caution for when it\'s earned.)',
  },
  outcomes: [
    { metric: 'board', value: 'ONLINE' }, { metric: 'operator', value: 'signed in' },
  ],
  tools: ['Operator Console'],
  archiveUrl: 'index.html',
};

export const SERVICE_RECORD = [
  { company: 'AAI Worldwide Logistics', role: 'Application Developer', start: '2024', end: 'present', contributed: 'Shipping a Flutter WMS mobile app concept-to-production plus FMS features and SAP-to-WMS XML/JSON integration, while adopting AI-assisted delivery with Claude to compress prototyping and refactoring cycles.' },
  { company: 'Octal Philippines Inc.', role: 'Software Developer', start: '2022', end: '2024', contributed: 'Two years embedded in the AAI Worldwide Logistics IT department building core FMS/CRM/TMS/WMS systems — including the TMS Trucking Rates module, a transport-monitoring dashboard, and a FAREYE API integration for real-time package tracking.' },
  { company: 'Uratex Philippines', role: 'Full-Stack Developer', start: '2022', end: '2022', contributed: 'Built internal tools, Laravel surveys with reporting, a Trip Management System for company vehicles, and brand landing pages on the Statamic CMS.' },
  { company: 'Lumina Homes, Inc.', role: 'Marketing Staff (Full-Stack Developer)', start: '2021', end: '2022', contributed: 'A hybrid dev-plus-marketing role: built and optimized marketing sites and an amortization loan calculator on SilverStripe, and applied SEO with SEMrush and Ahrefs to power the lead pipeline.' },
  { company: 'Switch Connect Pty Ltd', role: 'Junior Web Developer', start: '2019', end: '2020', contributed: 'First taste of integration-heavy ERP work — wiring Google Maps address validation, ABN Lookup, Xero financials, and Eversign document signing into the company\'s ERP.' },
  { company: 'Trimex Colleges', role: 'Graphic Designer', start: '2019', end: '2019', contributed: 'Built the design fundamentals — typography, layout, hierarchy — on Adobe Suite that still inform his approach to UI/UX today.' },
];

export const TOOLKIT_CATALOG = [
  { category: 'Frontend', items: ['Vue.js', 'Nuxt.js', 'React', 'Vuetify', 'HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'Bootstrap', 'jQuery'] },
  { category: 'Backend', items: ['Laravel', 'PHP', 'Node.js', 'MySQL', 'SQL', 'REST API Design', 'SilverStripe', 'Statamic', 'WordPress'] },
  { category: 'Mobile', items: ['Flutter', 'Dart', 'Firebase', 'Android Studio'] },
  { category: 'AI & Automation', items: ['Claude AI', 'Claude Code', 'Gemini', 'OpenAI API', 'OpenRouter', 'Qwen', 'GitHub Copilot', 'Autonomous Agents', 'Multi-LLM Orchestration', 'Prompt Engineering', 'n8n', 'Zapier', 'Make.com', 'Workflow Automation'] },
  { category: 'Libraries & Integrations', items: ['AG Grid', 'jsPDF', 'SurveyJS', 'SAP API', 'XERO', 'Eversign', 'ABN Lookup', 'Google Maps API', 'FAREYE API'] },
  { category: 'DevOps & Tooling', items: ['Git', 'GitHub', 'Docker', 'Linux', 'VS Code', 'Postman', 'Composer', 'npm', 'Vite'] },
  { category: 'Design & SEO', items: ['Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'SEMrush', 'Ahrefs', 'SEO'] },
];

export const OPERATOR = {
  name: 'Lemmuel Turaya',
  title: 'Full-Stack & Mobile App Developer',
  intro_line: 'Six-plus years and nine shipped systems deep — a full-stack & mobile developer who runs logistics, real-estate, and HR platforms on Vue/Nuxt + Laravel and Flutter, and who pairs daily with Claude Code while building autonomous multi-LLM agent pipelines of his own.',
  location: 'Biñan, Laguna, Philippines',
  years_experience: '6+',
  email: 'turayalemmuel@gmail.com',
  links: {
    github: 'https://github.com/kon2raya24',
    linkedin: 'https://www.linkedin.com/in/lemmuel-turaya/',
    resume: 'resume.pdf',
  },
};

/** Merge a board node's geometry with its mission display fields. */
export function missionFor(id) { return MISSIONS[id] || (id === 'station-zero' ? TUTORIAL : null); }

/* Mission tools are specific ("Laravel 12", "Vue 3", "AG Grid Enterprise");
   the Toolkit/Report catalog is generic ("Laravel", "Vue.js", "AG Grid"). This
   bridges them so earned tools visibly light the locker. A catalog item counts
   as acquired if any acquired tool matches by case-insensitive substring (either
   direction, ≥3 chars) or an explicit alias. */
const TOOL_ALIASES = {
  'Vue.js': ['Vue 3', 'Vuestic Admin', 'Velzon', 'Bootstrap Vue 3'],
  'Nuxt.js': ['Nuxt'],
  'Node.js': ['Node'],
  'REST API Design': ['REST', 'Sanctum'],
  'AG Grid': ['AG Grid Enterprise'],
  'PHP': ['Laravel', 'Laravel 11', 'Laravel 12', 'PHPUnit', 'PHPStan', 'Packagist'],
  'SQL': ['MySQL', 'MySQL online DDL'],
  'TypeScript': ['TypeScript'],
};

export function toolAcquired(catalogItem, toolkit) {
  if (!toolkit || !toolkit.length) return false;
  const c = catalogItem.toLowerCase();
  const aliases = TOOL_ALIASES[catalogItem] || [];
  return toolkit.some(t => {
    if (aliases.includes(t)) return true;
    const tl = String(t).toLowerCase();
    if (tl === c) return true;
    if (c.length >= 3 && tl.length >= 3 && (tl.includes(c) || c.includes(tl))) return true;
    return false;
  });
}
