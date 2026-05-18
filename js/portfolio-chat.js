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
      aliases: ["who is lemmuel", "introduce yourself", "bio", "about you"],
      category: "about",
      a: "I'm <strong>Lemmuel Turaya</strong> — full-stack and mobile app developer based in Biñan, Laguna, Philippines (GMT+8). 6+ years shipping production platforms across logistics, real estate, HR, and autonomous AI engineering. <a href='#fh5co-about'>About section ↓</a>" },

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
      a: "There's a konami code in here somewhere. ↑↑↓↓←→←→BA. Also right-click for a dev menu, backtick for a terminal. Have fun." }
  ];

  // Suggested-question chips — rotated/shuffled on each open.
  var SUGGESTIONS = [
    "What's your stack?",
    "Are you available?",
    "Tell me about your AI work",
    "What's your rate?",
    "How do I reach you?",
    "How was this portfolio built?",
    "Tell me about the WMS mobile app"
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

  function findMatch(userInput) {
    var normIn = normalize(userInput);
    if (!normIn) return null;

    var best = { score: 0, entry: null };
    for (var i = 0; i < FAQ.length; i++) {
      var e = FAQ[i];
      var candidates = [e.q].concat(e.aliases || []);
      var entryScore = 0;
      for (var j = 0; j < candidates.length; j++) {
        var c = candidates[j];
        var normC = normalize(c);
        var s = 0;
        // Substring hit is a strong signal
        if (normC.indexOf(normIn) !== -1 || normIn.indexOf(normC) !== -1) {
          s = Math.max(s, 0.85);
        }
        // Token overlap (input tokens found in candidate)
        s = Math.max(s, tokenOverlap(userInput, c) * 0.90);
        // Edit-distance similarity (penalizes typos lightly)
        s = Math.max(s, similarity(userInput, c) * 0.95);
        if (s > entryScore) entryScore = s;
      }
      if (entryScore > best.score) {
        best.score = entryScore;
        best.entry = e;
      }
    }
    // Threshold tuned for the seed FAQ set; raise if false-positives appear.
    return best.score >= 0.42 ? best.entry : null;
  }

  // ---------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------
  var isTouch = matchMedia('(hover: none)').matches || window.innerWidth < 1025;
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STORAGE_KEY = 'portfolio.chat.history';

  function build() {
    if (document.querySelector('.pchat')) return;

    var wrap = document.createElement('div');
    wrap.className = 'pchat';
    wrap.setAttribute('aria-live', 'polite');
    wrap.innerHTML =
      '<button type="button" class="pchat__bubble" aria-label="Open chat — ask me anything about the portfolio" data-pchat-open>' +
        '<span class="pchat__bubble-icon" aria-hidden="true">💬</span>' +
        '<span class="pchat__bubble-pulse" aria-hidden="true"></span>' +
      '</button>' +
      '<div class="pchat__panel" role="dialog" aria-modal="false" aria-label="Ask me about the portfolio" hidden>' +
        '<header class="pchat__head">' +
          '<div class="pchat__head-title">' +
            '<span class="pchat__dot" aria-hidden="true"></span>' +
            '<span class="pchat__head-name">~/ask-me</span>' +
          '</div>' +
          '<div class="pchat__head-actions">' +
            '<button type="button" class="pchat__reset" data-pchat-reset aria-label="Reset conversation" title="Reset">↻</button>' +
            '<button type="button" class="pchat__close" data-pchat-close aria-label="Close chat" title="Close (Esc)">×</button>' +
          '</div>' +
        '</header>' +
        '<div class="pchat__body" data-pchat-body>' +
          '<div class="pchat__welcome">' +
            '<p>Hey 👋 ask me anything about Lemmuel’s portfolio — stack, projects, availability, AI work, rates.</p>' +
            '<p class="pchat__welcome-sub">Curated answers, no API costs. <a href="https://cal.com/lemmuel-turaya/intro" target="_blank" rel="noopener">Or book a call</a>.</p>' +
          '</div>' +
          '<div class="pchat__suggestions" data-pchat-suggestions></div>' +
        '</div>' +
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
    var body = wrap.querySelector('[data-pchat-body]');
    var form = wrap.querySelector('[data-pchat-form]');
    var input = wrap.querySelector('[data-pchat-input]');
    var suggBox = wrap.querySelector('[data-pchat-suggestions]');

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
          appendMsg('bot',
            "I don’t have a curated answer for that yet. The fastest path is direct:<br>" +
            "<div class=\"pchat__fallback-actions\">" +
              "<a class=\"pchat__fallback-btn pchat__fallback-btn--primary\" href=\"https://cal.com/lemmuel-turaya/intro\" target=\"_blank\" rel=\"noopener\">Book a 15-min call →</a>" +
              "<a class=\"pchat__fallback-btn\" href=\"mailto:turayalemmuel@gmail.com\">Email me</a>" +
            "</div>");
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
