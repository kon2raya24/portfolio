/* =======================================================
 *  Tech FX — dev-by-dev futuristic interactions
 *  Pure vanilla JS, no dependencies.
 * ======================================================= */
/* Calm-mode toggle — apply saved preference BEFORE any motion can
   play. Same logic as case-study.js, duplicated so index works too.
   The button itself is injected after DOMContentLoaded below. */
try {
  var __motionPref = localStorage.getItem('portfolio.motion');
  if (__motionPref === 'reduced') {
    document.documentElement.setAttribute('data-motion', 'reduced');
  }
} catch (e) { /* private mode / storage disabled */ }

(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Collapse heavy decoration (3D systems, star canvas, particles, parallax) onto
     the same skip path when the user is on Save-Data, prefers-reduced-data, or a
     slow connection. Same outcome the reduce-motion path already produces; this
     just widens the trigger so we don't burn data on users who can't afford it. */
  try {
    var __prefersLessData = window.matchMedia && window.matchMedia('(prefers-reduced-data: reduce)').matches;
    var __conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var __saveData = !!(__conn && __conn.saveData);
    var __slowNet = !!(__conn && /^(slow-2g|2g)$/.test(__conn.effectiveType || ''));
    if (__prefersLessData || __saveData || __slowNet) prefersReduced = true;
  } catch (e) { /* matchMedia or navigator.connection unavailable */ }
  var isTouch = matchMedia('(hover: none)').matches || window.innerWidth < 1025;

  /* ---------- Shared theme helpers (used by HUD palette picker + nav theme picker) ----------
     Single source of truth for mode (light/dark) and palette (cyber/matrix/sunset/xeno).
     Both UIs sync via 'mode:change' and 'palette:change' custom events. */
  var PALETTES = ['cyber', 'matrix', 'sunset', 'xeno', 'crt'];

  function currentMode() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function currentPalette() {
    for (var i = 0; i < PALETTES.length; i++) {
      if (document.documentElement.classList.contains('theme-' + PALETTES[i])) return PALETTES[i];
    }
    return 'cyber';
  }
  function applyMode(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    try { localStorage.setItem('portfolio.mode', mode); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'light' ? '#f6f4ee' : '#050814');
    var hero = document.getElementById('fh5co-header');
    if (hero) {
      if (mode === 'light') {
        if (!hero.dataset.origBg) hero.dataset.origBg = hero.style.backgroundImage || '';
        hero.style.backgroundImage = 'none';
      } else if (hero.dataset.origBg !== undefined) {
        hero.style.backgroundImage = hero.dataset.origBg;
      }
    }
    document.dispatchEvent(new CustomEvent('mode:change', { detail: { mode: mode } }));
  }
  function applyPalette(palette) {
    if (PALETTES.indexOf(palette) === -1) palette = 'cyber';
    PALETTES.forEach(function (p) { document.documentElement.classList.remove('theme-' + p); });
    if (palette !== 'cyber') document.documentElement.classList.add('theme-' + palette);
    try {
      if (palette === 'cyber') localStorage.removeItem('portfolio.palette');
      else localStorage.setItem('portfolio.palette', palette);
    } catch (e) {}
    document.dispatchEvent(new CustomEvent('palette:change', { detail: { palette: palette } }));
  }

  /* ---------- Calm-mode toggle (injected into the existing .hud) ---------- */
  (function motionToggle() {
    var STORAGE_KEY = 'portfolio.motion';
    function paint(btn, reduced) {
      btn.setAttribute('aria-pressed', reduced ? 'true' : 'false');
      btn.querySelector('.motion-toggle__label').textContent = 'motion: ' + (reduced ? 'off' : 'on');
    }
    function inject() {
      var hud = document.querySelector('.hud');
      if (!hud) return;
      if (hud.querySelector('.motion-toggle')) return;
      var isReduced = document.documentElement.getAttribute('data-motion') === 'reduced';

      // Build as a hud-row so it visually slots into the existing list
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'hud__row motion-toggle';
      row.setAttribute('aria-pressed', isReduced ? 'true' : 'false');
      row.setAttribute('aria-label', 'Toggle reduced motion');
      row.innerHTML =
        '<span class="hud__label">motion</span>' +
        '<span class="hud__val motion-toggle__label">' + (isReduced ? 'off' : 'on') + '</span>';
      row.addEventListener('click', function () {
        var nowReduced = document.documentElement.getAttribute('data-motion') !== 'reduced';
        if (nowReduced) document.documentElement.setAttribute('data-motion', 'reduced');
        else document.documentElement.removeAttribute('data-motion');
        paint(row, nowReduced);
        try { localStorage.setItem(STORAGE_KEY, nowReduced ? 'reduced' : 'full'); } catch (e) {}
      });

      // Insert before the .hud__now block so it sits with the data rows
      var nowEl = hud.querySelector('.hud__now');
      if (nowEl) hud.insertBefore(row, nowEl);
      else hud.appendChild(row);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject);
    } else {
      // Slight defer because the .hud is built inside the same IIFE later
      setTimeout(inject, 0);
    }
    // Also retry once after a small delay because the .hud is created
    // by another IIFE below — order isn't guaranteed during initial load
    setTimeout(inject, 250);
  })();

  /* ---------- Console welcome (dev-by-dev) ---------- */
  try {
    var css1 = 'font-family: monospace; font-size: 14px; color: #00e5ff; text-shadow: 0 0 8px #00e5ff;';
    var css2 = 'font-family: monospace; font-size: 12px; color: #FF9000;';
    var css3 = 'font-family: monospace; font-size: 12px; color: #fff;';
    console.log('%c> ./init_developer.sh', css1);
    console.log('%c[+] portfolio.boot()  %cok', css2, 'color:#28c840;font-family:monospace;');
    console.log('%cHey dev 👋  Like the matrix rain? Try the konami code (↑↑↓↓←→←→BA).', css3);
    console.log('%cBuilt with caffeine, Claude AI, and zero frameworks for this layer.', css3);
    console.log('%cmailto:turayalemmuel@gmail.com  · github.com/kon2raya24', 'color:#0ea5b8;font-family:monospace;');
  } catch (e) { /* noop */ }

  /* ---------- Scroll progress bar ---------- */
  (function scrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var sc = document.documentElement.scrollTop || document.body.scrollTop;
      var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = h > 0 ? (sc / h) * 100 : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ---------- Matrix rain (hero) — theme-aware: katakana for cyber/matrix/sunset,
       alien-tech glyphs in xeno mode so the canvas matches the rest of the skin. */
  (function matrixRain() {
    if (prefersReduced) return;
    var host = document.getElementById('fh5co-header');
    if (!host) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'matrix-canvas';
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var CHARS_DEFAULT = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789{}[]<>/=+-*&|';
    var CHARS_XENO    = '◢◤◥◣◇◆▣▤⌬⌷⎔⏣◈⬚⬢⬡▦▩▨ΞΛΔΨΣΦΘΩ0123456789█▓▒░⏃⏄⏅';
    var cols = 0, drops = [], fontSize = 16;

    function resize() {
      canvas.width = host.offsetWidth;
      canvas.height = host.offsetHeight;
      cols = Math.floor(canvas.width / fontSize);
      drops = new Array(cols).fill(0).map(function () { return Math.random() * -50; });
    }
    resize();
    window.addEventListener('resize', resize);

    // Pause when host scrolls offscreen — saves CPU dramatically on long pages
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(host);
    }
    document.addEventListener('visibilitychange', function () {
      visible = visible && document.visibilityState === 'visible';
    });

    var lastFrame = 0;
    function draw(ts) {
      if (visible && document.visibilityState === 'visible' && ts - lastFrame > 55) {
        lastFrame = ts;
        var xeno = currentPalette() === 'xeno';
        var chars = xeno ? CHARS_XENO : CHARS_DEFAULT;
        var trailColor = xeno ? 'rgba(2, 0, 10, 0.20)' : 'rgba(5, 8, 20, 0.18)';
        var primary   = xeno ? '#ff1840' : '#00e5ff';
        var accent    = xeno ? '#00ff85' : '#FF9000';
        ctx.fillStyle = trailColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = fontSize + 'px "JetBrains Mono", monospace';
        for (var i = 0; i < cols; i++) {
          var ch = chars.charAt(Math.floor(Math.random() * chars.length));
          var x = i * fontSize;
          var y = drops[i] * fontSize;
          var c = (Math.random() < 0.02) ? accent : primary;
          ctx.fillStyle = c;
          ctx.shadowColor = c;
          ctx.shadowBlur = 6;
          ctx.fillText(ch, x, y);
          if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
          drops[i] += 1;
        }
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();

  /* ---------- Hero terminal-tag typewriter — `> ./init_developer.sh_` ----------
     Variable per-char delay for a natural feel. Locks the element's width
     beforehand so the centered hero doesn't jitter as text grows. Skipped
     under prefers-reduced-motion (text appears immediately as before). */
  (function heroTyping() {
    if (prefersReduced) return;
    var el = document.querySelector('.terminal-tag');
    if (!el) return;
    var textNode = el.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    var fullText = textNode.textContent;
    if (!fullText || fullText.length < 2) return;

    // Reserve the rendered width so the centered terminal tag doesn't shift
    // as characters type in (the box stays put, text fills it left-to-right).
    var rect = el.getBoundingClientRect();
    if (rect.width > 0) {
      el.style.minWidth = Math.ceil(rect.width) + 'px';
      el.style.textAlign = 'left';
    }

    textNode.textContent = '';
    var i = 0;
    function step() {
      if (i >= fullText.length) return;
      textNode.textContent += fullText.charAt(i);
      i++;
      var ch = fullText.charAt(i - 1);
      // Slower on punctuation + space, faster on letters; tiny random jitter
      var base = (ch === '.' || ch === '/' || ch === ' ') ? 75 : 32;
      setTimeout(step, base + Math.random() * 20);
    }
    setTimeout(step, 320);
  })();

  /* ---------- Particles canvas (services bg) ---------- */
  (function particles() {
    if (prefersReduced) return;
    var host = document.getElementById('fh5co-features');
    if (!host) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'particles-canvas';
    host.insertBefore(canvas, host.firstChild);
    var ctx = canvas.getContext('2d');
    var pts = [];
    var visible = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(host);
    } else { visible = true; }
    function resize() {
      canvas.width = host.offsetWidth;
      canvas.height = host.offsetHeight;
      var count = Math.min(60, Math.floor(canvas.width / 28));
      pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1 + Math.random() * 1.6
        });
      }
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!visible || document.visibilityState !== 'visible') { requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 229, 255, 0.55)';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      for (var a = 0; a < pts.length; a++) {
        for (var b = a + 1; b < pts.length; b++) {
          var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 14000) {
            ctx.strokeStyle = 'rgba(0, 229, 255,' + (0.18 * (1 - d2 / 14000)) + ')';
            ctx.lineWidth = 0.6;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(pts[a].x, pts[a].y);
            ctx.lineTo(pts[b].x, pts[b].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();

  /* ---------- Typewriter cycle for terminal-tag ---------- */
  (function typewriter() {
    var el = document.querySelector('.terminal-tag');
    if (!el) return;
    var lines = [
      { p: '$ ', c: 'whoami', o: 'lemmuel.turaya — full-stack dev' },
      { p: '$ ', c: 'cat stack.txt', o: 'vue · laravel · flutter · claude' },
      { p: '$ ', c: 'npm run vibe', o: 'shipping features at hyper-speed ✓' },
      { p: '$ ', c: './init_developer.sh', o: 'system online · ready to build' },
      { p: '$ ', c: 'git status', o: 'on branch main · everything green' }
    ];
    var idx = 0, charIdx = 0, phase = 'typing-cmd', buffer = '';
    el.innerHTML = '<span class="term-prompt">$</span> <span class="term-cmd"></span><span class="cursor-blink">_</span><span class="term-out"></span>';
    var cmdEl = el.querySelector('.term-cmd');
    var outEl = el.querySelector('.term-out');

    function tick() {
      var line = lines[idx];
      if (phase === 'typing-cmd') {
        if (charIdx <= line.c.length) {
          cmdEl.textContent = line.c.slice(0, charIdx++);
          setTimeout(tick, 55 + Math.random() * 35);
        } else { phase = 'pause-cmd'; setTimeout(tick, 350); }
      } else if (phase === 'pause-cmd') {
        phase = 'typing-out'; charIdx = 0; outEl.textContent = ' → '; setTimeout(tick, 120);
      } else if (phase === 'typing-out') {
        if (charIdx <= line.o.length) {
          outEl.textContent = ' → ' + line.o.slice(0, charIdx++);
          setTimeout(tick, 28 + Math.random() * 25);
        } else { phase = 'hold'; setTimeout(tick, 2200); }
      } else if (phase === 'hold') {
        phase = 'erase'; setTimeout(tick, 80);
      } else if (phase === 'erase') {
        var combined = (cmdEl.textContent + (outEl.textContent || ''));
        if (combined.length > 0) {
          if (outEl.textContent.length > 0) {
            outEl.textContent = outEl.textContent.slice(0, -1);
          } else {
            cmdEl.textContent = cmdEl.textContent.slice(0, -1);
          }
          setTimeout(tick, 14);
        } else {
          idx = (idx + 1) % lines.length;
          phase = 'typing-cmd';
          charIdx = 0;
          setTimeout(tick, 280);
        }
      }
    }
    tick();
  })();

  /* ---------- Glitch wrap for hero H1 ---------- */
  (function glitchHeroName() {
    var h1 = document.querySelector('#fh5co-header .display-tc h1 span');
    if (!h1) return;
    var text = h1.textContent;
    h1.classList.add('glitch');
    h1.setAttribute('data-text', text);
  })();

  /* ---------- Section heading data attributes (// labels) ---------- */
  (function sectionLabels() {
    var map = [
      { id: 'fh5co-about',    label: 'about_me' },
      { id: 'fh5co-resume',   label: 'experience.log' },
      { id: 'fh5co-features', label: 'services()' },
      { id: 'fh5co-skills',   label: 'skills.json' },
      { id: 'fh5co-work',     label: 'projects/' },
      { id: 'fh5co-started',  label: 'contact.init' }
    ];
    map.forEach(function (m) {
      var sec = document.getElementById(m.id);
      if (!sec) return;
      var head = sec.querySelector('.fh5co-heading');
      if (head) head.setAttribute('data-section', m.label);
    });
  })();

  /* ---------- Magnetic hover on socials/buttons ---------- */
  (function magnetic() {
    if (isTouch) return;
    var targets = document.querySelectorAll('.fh5co-social-icons li a, #fh5co-started .btn, #fh5co-about .btn');
    targets.forEach(function (el) {
      el.classList.add('magnetic');
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = 'translate(' + (dx * 0.25) + 'px,' + (dy * 0.25) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  })();

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  (function revealOnScroll() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  })();

  /* ---------- GitHub cache helper (shared) ---------- */
  var ghCache = {
    TTL: 30 * 60 * 1000,                 // 30 minutes
    STALE_MAX: 7 * 24 * 60 * 60 * 1000,   // 7 days — still show as "stale" before giving up
    get: function (key) {
      try {
        var raw = localStorage.getItem('gh.' + key);
        if (!raw) return null;
        var p = JSON.parse(raw);
        if (!p || typeof p.t !== 'number') return null;
        var age = Date.now() - p.t;
        return { data: p.d, age: age, fresh: age < this.TTL, stale: age >= this.TTL };
      } catch (e) { return null; }
    },
    set: function (key, data) {
      try { localStorage.setItem('gh.' + key, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
    }
  };
  function ghFetch(url, key, timeoutMs) {
    timeoutMs = timeoutMs || 4500;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, timeoutMs);
    return fetch(url, ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) {
        clearTimeout(t);
        if (r.status === 403 || r.status === 429) {
          var reset = r.headers.get('X-RateLimit-Reset');
          var err = new Error('rate-limit');
          err.code = 'RATE_LIMIT';
          err.resetAt = reset ? Number(reset) * 1000 : null;
          throw err;
        }
        if (!r.ok) throw new Error('bad-' + r.status);
        return r.json();
      })
      .then(function (json) {
        if (key) ghCache.set(key, json);
        return json;
      })
      .catch(function (e) {
        clearTimeout(t);
        throw e;
      });
  }

  /* ---------- Recent repos panel (live, cached) ---------- */
  (function recentRepos() {
    var host = document.querySelector('[data-recent-repos]');
    if (!host) return;
    var USER = 'kon2raya24';

    function relativeTime(iso) {
      var d = new Date(iso);
      var diff = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      if (diff < 86400 * 7) return Math.floor(diff / 86400) + 'd ago';
      if (diff < 86400 * 30) return Math.floor(diff / (86400 * 7)) + 'w ago';
      if (diff < 86400 * 365) return Math.floor(diff / (86400 * 30)) + 'mo ago';
      return Math.floor(diff / (86400 * 365)) + 'y ago';
    }
    function escapeHtml(s) {
      return (s == null ? '' : String(s))
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function render(repos, fromCache) {
      if (!repos || !repos.length) {
        host.innerHTML = '<li class="px-repos__loading">no public repos found.</li>';
        return;
      }
      var nonFork = repos.filter(function (r) { return !r.fork; });
      var list = (nonFork.length ? nonFork : repos).slice(0, 4);
      host.innerHTML = list.map(function (r) {
        var desc = r.description ? '<p class="px-repo__desc">' + escapeHtml(r.description) + '</p>' : '';
        var lang = r.language ? '<span class="px-repo__lang">' + escapeHtml(r.language) + '</span>' : '';
        return '<li>' +
          '<div class="px-repo__head">' +
            '<a class="px-repo__name" href="' + escapeHtml(r.html_url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(r.name) + '</a>' +
            '<span class="px-repo__visibility">' + (r.private ? 'private' : 'public') + '</span>' +
            lang +
            '<span class="px-repo__stars"><strong>★</strong> ' + (r.stargazers_count || 0) + '</span>' +
          '</div>' +
          desc +
          '<div class="px-repo__when">updated ' + relativeTime(r.pushed_at || r.updated_at) + (fromCache ? ' · <em>cached</em>' : '') + '</div>' +
        '</li>';
      }).join('');
    }
    function rateLimitMsg(resetAt) {
      var minutes = resetAt ? Math.max(1, Math.ceil((resetAt - Date.now()) / 60000)) : null;
      return '<li class="px-repos__loading">$ GitHub rate-limited for this IP' +
        (minutes ? ' &mdash; resets in ~' + minutes + ' min' : '') +
        ' &mdash; <a href="https://github.com/' + USER + '" target="_blank" rel="noopener" style="color:var(--cyan)">view profile directly &rarr;</a></li>';
    }

    var cached = ghCache.get('repos');
    if (cached) render(cached.data, !cached.fresh);
    if (cached && cached.fresh) return;

    ghFetch('https://api.github.com/users/' + USER + '/repos?sort=updated&per_page=8', 'repos')
      .then(function (repos) { if (Array.isArray(repos)) render(repos, false); })
      .catch(function (e) {
        if (cached) { /* keep showing stale cache */ return; }
        if (e && e.code === 'RATE_LIMIT') host.innerHTML = rateLimitMsg(e.resetAt);
        else host.innerHTML = '<li class="px-repos__loading">$ couldn\'t reach GitHub &mdash; <a href="https://github.com/' + USER + '" target="_blank" rel="noopener" style="color:var(--cyan)">view profile &rarr;</a></li>';
      });
  })();

  /* ---------- Live GitHub stats + commit graph (cached) ---------- */
  (function githubStats() {
    var host = document.querySelector('[data-commit-graph]');
    if (!host) return;
    var label = document.querySelector('.commit-graph-label');
    var WEEKS = 26, DAYS = 7, CELLS = WEEKS * DAYS;
    var USER = 'kon2raya24';

    function fmt(n) { return n.toLocaleString('en-US'); }
    function levelFor(count) {
      if (!count) return 0;
      if (count < 2) return 1;
      if (count < 4) return 2;
      if (count < 7) return 3;
      return 4;
    }
    function paint(buckets) {
      var html = '';
      for (var i = 0; i < CELLS; i++) {
        var c = buckets[i] || 0;
        html += '<span class="commit-cell" data-level="' + levelFor(c) + '" title="' + c + ' event' + (c !== 1 ? 's' : '') + '"></span>';
      }
      host.innerHTML = html;
    }
    function fallbackBuckets() {
      var seed = 42, buckets = [];
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      for (var i = 0; i < CELLS; i++) {
        var v = rnd();
        buckets.push(v < 0.4 ? 0 : v < 0.65 ? 1 : v < 0.85 ? 3 : v < 0.96 ? 6 : 10);
      }
      return buckets;
    }
    function eventsToBuckets(events) {
      var buckets = new Array(CELLS).fill(0);
      events.forEach(function (e) {
        var d = new Date(e.created_at); d.setHours(0,0,0,0);
        var today = new Date(); today.setHours(0,0,0,0);
        var diffDays = Math.round((today - d) / 86400000);
        var idx = CELLS - 1 - diffDays;
        if (idx >= 0 && idx < CELLS) buckets[idx] += 1;
      });
      return buckets;
    }
    function setLabel(status, stale) {
      if (!label) return;
      if (status === 'live')  label.innerHTML = '// recent github activity &middot; <span style="color:#28c840">live</span>' + (stale ? ' <em style="color:rgba(255,255,255,0.4)">(cached)</em>' : '') + ' &middot; @' + USER;
      else if (status === 'cached') label.innerHTML = '// recent github activity &middot; <span style="color:var(--brand)">cached</span> &middot; @' + USER;
      else if (status === 'rate')   label.innerHTML = '// github rate-limited &middot; <span style="color:var(--brand)">retry later</span>';
      else label.textContent = '// last 6 months · contribution heatmap';
    }
    function setMeta(d, fromCache) {
      var existing = document.querySelector('.commit-graph-meta');
      if (existing) existing.remove();
      if (!d || !label) return;
      var meta = document.createElement('div');
      meta.className = 'commit-graph-meta';
      meta.innerHTML =
        '<span><strong>' + fmt(d.public_repos) + '</strong> repos</span>' +
        '<span class="sep">·</span>' +
        '<span><strong>' + fmt(d.followers) + '</strong> followers</span>' +
        '<span class="sep">·</span>' +
        '<span><strong>' + fmt(d.following) + '</strong> following</span>' +
        (fromCache ? '<span class="sep">·</span><em style="color:rgba(255,255,255,0.4)">cached</em>' : '') +
        '<span class="sep">·</span>' +
        '<a href="https://github.com/' + USER + '" target="_blank" rel="noopener">view profile &rarr;</a>';
      label.parentNode.insertBefore(meta, host.nextSibling);
    }

    // 1) Paint cache if we have it, immediately
    var evCache = ghCache.get('events');
    var usCache = ghCache.get('user');
    if (evCache) {
      paint(eventsToBuckets(evCache.data));
      setLabel('live', !evCache.fresh);
    } else {
      paint(fallbackBuckets());
    }
    if (usCache) setMeta(usCache.data, !usCache.fresh);

    // 2) If both caches are fresh, don't re-fetch
    if (evCache && evCache.fresh && usCache && usCache.fresh) return;

    // 3) Otherwise re-fetch (events first, then user)
    ghFetch('https://api.github.com/users/' + USER + '/events/public?per_page=100', 'events')
      .then(function (events) {
        if (!Array.isArray(events) || !events.length) return;
        paint(eventsToBuckets(events));
        setLabel('live', false);
      })
      .catch(function (e) {
        if (evCache) return; // keep stale cache rendering
        if (e && e.code === 'RATE_LIMIT') setLabel('rate');
      });

    ghFetch('https://api.github.com/users/' + USER, 'user')
      .then(function (d) { if (d) setMeta(d, false); })
      .catch(function () { /* keep cached meta if present */ });
  })();

  /* ---------- Boot loader screen ---------- */
  (function bootLoader() {
    var loader = document.querySelector('.fh5co-loader');
    if (!loader) return;
    var lines = [
      '> booting portfolio.v3...',
      '> loading modules: [vue, laravel, flutter, claude]',
      '> connecting to vibe-coding stream...',
      '> hydrating animations...',
      '> ready.'
    ];
    var html = '<div class="boot-screen">';
    lines.forEach(function (l, i) {
      html += '<div class="boot-line ' + (i === lines.length - 1 ? 'ok' : '') + '" style="animation-delay:' + (i * 220) + 'ms;">' + l + '</div>';
    });
    html += '<div class="boot-bar"><div class="boot-bar__fill"></div></div></div>';
    loader.innerHTML = html;
  })();

  /* ---------- HUD status panel ---------- */
  (function hud() {
    if (isTouch) return;
    var el = document.createElement('aside');
    el.className = 'hud';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="theme-pick">' +
        '<span class="theme-pick__label">theme</span>' +
        '<button class="theme-pick__btn is-on" data-th="cyber"  aria-label="cyber theme"></button>' +
        '<button class="theme-pick__btn"       data-th="matrix" aria-label="matrix theme"></button>' +
        '<button class="theme-pick__btn"       data-th="sunset" aria-label="sunset theme"></button>' +
        '<button class="theme-pick__btn"       data-th="xeno"   aria-label="xeno theme"></button>' +
        '<button class="theme-pick__btn"       data-th="crt"    aria-label="crt theme"></button>' +
      '</div>' +
      '<div class="hud__row"><span class="hud__label">[ sys ]</span><span class="hud__val">online</span></div>' +
      '<div class="hud__row"><span class="hud__label">time</span><span class="hud__val" data-h="time">--:--:--</span></div>' +
      '<div class="hud__row"><span class="hud__label">fps</span><span class="hud__val" data-h="fps">--</span></div>' +
      '<div class="hud__row"><span class="hud__label">scroll</span><span class="hud__val" data-h="scroll">0%</span></div>' +
      '<div class="hud__row"><span class="hud__label">section</span><span class="hud__val" data-h="section">hero</span></div>' +
      '<div class="hud__row"><span class="hud__label">views</span><span class="hud__val" data-h="views">…</span></div>' +
      '<div class="hud__row hud__row--coords"><span class="hud__label">coords</span><span class="hud__val" data-h="coords">14.6°N 121.0°E</span></div>' +
      '<div class="hud__row hud__row--hw"><span class="hud__label">cores</span><span class="hud__val" data-h="cores">—</span></div>' +
      '<div class="hud__row hud__row--hw"><span class="hud__label">mem</span><span class="hud__val" data-h="mem">—</span></div>' +
      '<div class="hud__row hud__row--hw"><span class="hud__label">net</span><span class="hud__val" data-h="net">—</span></div>' +
      '<div class="hud__row hud__row--hw"><span class="hud__label">batt</span><span class="hud__val" data-h="batt">—</span></div>' +
      '<div class="hud__row hud__row--dev"><span class="hud__label">[ dev ]</span><span class="hud__val" data-h="dev">unlocked</span></div>' +
      '<div class="hud__bar"><i data-h="bar"></i></div>' +
      '<div class="hud__now"><span class="hud__now-label">now</span><span class="hud__now-val" data-h="now">booting…</span></div>';
    document.body.appendChild(el);

    var elTime = el.querySelector('[data-h="time"]');
    var elFps = el.querySelector('[data-h="fps"]');
    var elScroll = el.querySelector('[data-h="scroll"]');
    var elSection = el.querySelector('[data-h="section"]');
    var elBar = el.querySelector('[data-h="bar"]');
    var elCores = el.querySelector('[data-h="cores"]');
    var elMem   = el.querySelector('[data-h="mem"]');
    var elNet   = el.querySelector('[data-h="net"]');
    var elBatt  = el.querySelector('[data-h="batt"]');

    // Hardware HUD lines — pure read-only browser-exposed device metrics.
    // Recruiters who notice these signal the site is hardware-aware in the
    // same way modern dev tools are.
    (function fillHardware() {
      var cores = navigator.hardwareConcurrency || null;
      if (cores) elCores.textContent = cores;
      else elCores.textContent = 'n/a';

      var mem = navigator.deviceMemory || null;
      if (mem) elMem.textContent = mem + 'GB';
      else elMem.textContent = 'n/a';

      function updateNet() {
        var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) { elNet.textContent = 'n/a'; return; }
        var t = conn.effectiveType || '—';
        var down = conn.downlink ? conn.downlink.toFixed(1) + 'mbps' : '';
        var save = conn.saveData ? ' · save' : '';
        elNet.textContent = (t + (down ? ' · ' + down : '') + save).toUpperCase();
      }
      updateNet();
      var conn = navigator.connection;
      if (conn && typeof conn.addEventListener === 'function') {
        conn.addEventListener('change', updateNet);
      }

      function updateBatt(b) {
        var pct = Math.round(b.level * 100);
        var charging = b.charging ? '+' : '';
        elBatt.textContent = charging + pct + '%';
        // Color-shift when low
        elBatt.style.color = pct < 20 ? 'var(--brand)' : '';
      }
      if (navigator.getBattery) {
        navigator.getBattery().then(function (b) {
          updateBatt(b);
          ['levelchange', 'chargingchange'].forEach(function (ev) {
            b.addEventListener(ev, function () { updateBatt(b); });
          });
        }).catch(function () { elBatt.textContent = 'n/a'; });
      } else {
        elBatt.textContent = 'n/a';
      }
    })();

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    setInterval(function () {
      var d = new Date();
      elTime.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }, 1000);

    var last = performance.now(), frames = 0, fps = 60;
    function fpsLoop(now) {
      frames++;
      if (now - last >= 1000) {
        fps = Math.round((frames * 1000) / (now - last));
        elFps.textContent = fps;
        elFps.classList.toggle('warn', fps < 45);
        frames = 0; last = now;
      }
      requestAnimationFrame(fpsLoop);
    }
    requestAnimationFrame(fpsLoop);

    var sectionMap = [
      { id: 'fh5co-header',   label: 'hero' },
      { id: 'fh5co-about',    label: 'about_me' },
      { id: 'fh5co-resume',   label: 'experience.log' },
      { id: 'fh5co-features', label: 'services()' },
      { id: 'fh5co-skills',   label: 'skills.json' },
      { id: 'fh5co-work',     label: 'projects/' },
      { id: 'fh5co-blog',     label: 'brewing...' },
      { id: 'fh5co-started',  label: 'contact.init' }
    ];
    function updateScroll() {
      var sc = window.scrollY || document.documentElement.scrollTop;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? Math.round((sc / h) * 100) : 0;
      elScroll.textContent = pct + '%';
      elBar.style.inset = '0 ' + (100 - pct) + '% 0 0';
      // section detection
      var mid = sc + window.innerHeight * 0.4;
      var current = sectionMap[0].label;
      for (var i = 0; i < sectionMap.length; i++) {
        var sec = document.getElementById(sectionMap[i].id);
        if (!sec) continue;
        if (sec.offsetTop <= mid) current = sectionMap[i].label;
      }
      elSection.textContent = current;
    }
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    /* Theme switcher — uses the shared applyPalette() defined in the navThemePicker
       IIFE below so the nav picker and the HUD picker stay in sync (no more
       portfolio.theme key collision). */
    var themeBtns = el.querySelectorAll('.theme-pick__btn');
    function syncHud() {
      var current = currentPalette();
      themeBtns.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-th') === current); });
    }
    themeBtns.forEach(function (b) {
      b.addEventListener('click', function () { applyPalette(b.getAttribute('data-th')); });
    });
    document.addEventListener('palette:change', syncHud);
    syncHud();

    /* Now: rotating status */
    var nowVal = el.querySelector('[data-h="now"]');
    var statuses = [
      'shipping a Flutter feature',
      'pairing with Claude AI',
      'reviewing a Laravel PR',
      'wiring REST endpoints',
      'refactoring with care',
      'writing tests · TDD mode',
      'optimizing Vue components',
      'sketching UI in Figma',
      'reading docs · learning daily',
      'coffee.refill()'
    ];
    var nowIdx = 0;
    function rotateNow() {
      if (!nowVal) return;
      nowVal.style.opacity = 0;
      setTimeout(function () {
        nowVal.textContent = statuses[nowIdx];
        nowVal.style.opacity = 1;
        nowIdx = (nowIdx + 1) % statuses.length;
      }, 250);
    }
    rotateNow();
    setInterval(rotateNow, 3800);

    // Live commit ticker — folds the latest public PushEvents from
    // kon2raya24's GitHub into the rotating status array, so visitors see
    // what's actually shipping today. Cached in sessionStorage for 15 min
    // to stay well inside GitHub's 60 req/hr unauth limit.
    (function liveCommits() {
      var CACHE_KEY = 'portfolio.gh.events';
      var TTL = 15 * 60 * 1000;
      function inject(phrases) {
        if (!phrases || !phrases.length) return;
        statuses = phrases.concat(statuses);
        // Align nowIdx to 0 so the init's pending rotateNow() setTimeout
        // (or the setInterval) reads statuses[0] = our injected phrase. Also
        // snap textContent synchronously in case the fetch resolved after
        // the init's timeout already fired.
        nowIdx = 0;
        if (nowVal) {
          nowVal.textContent = statuses[0];
          nowVal.style.opacity = 1;
        }
      }
      try {
        var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
        if (cached && cached.data && Date.now() - cached.t < TTL) {
          inject(cached.data);
          return;
        }
      } catch (_) {}
      function timeAgo(iso) {
        var s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (s < 60)        return s + 's ago';
        if (s < 3600)      return Math.floor(s / 60) + 'm ago';
        if (s < 86400)     return Math.floor(s / 3600) + 'h ago';
        if (s < 86400 * 7) return Math.floor(s / 86400) + 'd ago';
        return Math.floor(s / (86400 * 7)) + 'w ago';
      }
      fetch('https://api.github.com/users/kon2raya24/events/public?per_page=20', {
        headers: { 'Accept': 'application/vnd.github+json' }
      })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (events) {
          // Note: GitHub's PushEvent public payload may omit the commits[]
          // array for some users/repos. So we surface repo + freshness only,
          // which is still a strong "actively shipping" signal.
          var phrases = [];
          var seenRepos = {};
          events.forEach(function (e) {
            if (e.type !== 'PushEvent') return;
            var repo = (e.repo && e.repo.name) ? e.repo.name.split('/').pop() : null;
            if (!repo || seenRepos[repo]) return;
            seenRepos[repo] = true;
            var ago = e.created_at ? timeAgo(e.created_at) : null;
            // If commits array is present (some events have it), prefer that;
            // otherwise fall back to the "pushed to {repo}" framing.
            var msg = '';
            if (e.payload && Array.isArray(e.payload.commits) && e.payload.commits.length) {
              var c = e.payload.commits[e.payload.commits.length - 1];
              msg = String(c.message || '').split('\n')[0].trim();
              if (msg.length > 48) msg = msg.slice(0, 45) + '…';
            }
            var line = msg
              ? 'shipped: ' + msg + ' → ' + repo
              : 'pushed to ' + repo + (ago ? ' · ' + ago : '');
            phrases.push(line);
          });
          phrases = phrases.slice(0, 5);
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: phrases })); } catch (_) {}
          inject(phrases);
        })
        .catch(function () { /* offline or rate-limited — fall back to hardcoded statuses */ });
    })();

    // Visit counter HUD value is shared with footer LiveStats
    var viewsEl = el.querySelector('[data-h="views"]');
    var cached = null;
    try { cached = parseInt(localStorage.getItem('portfolio.views') || '0', 10); } catch (_) {}
    if (cached && cached > 0 && viewsEl) viewsEl.textContent = cached.toLocaleString('en-US');
  })();

  /* ---------- Live visitor stats (counter + polling) ---------- */
  (function liveStats() {
    var NAMESPACE = 'kon2raya-portfolio';
    var KEY = 'views';
    var POLL_MS = 30000; // 30s

    var totalEl = document.querySelector('[data-live="total"]');
    var sessionEl = document.querySelector('[data-live="session"]');
    var refreshEl = document.querySelector('[data-live="refresh"]');
    var hudEl = document.querySelector('[data-h="views"]');

    function fmt(n) { return n.toLocaleString('en-US'); }
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    // ----- session timer -----
    var sessionStart = Date.now();
    if (sessionEl) {
      setInterval(function () {
        var s = Math.floor((Date.now() - sessionStart) / 1000);
        var m = Math.floor(s / 60);
        var sec = s % 60;
        sessionEl.textContent = pad(m) + ':' + pad(sec);
      }, 1000);
    }

    // ----- local fallback so the counter is never blank -----
    function localFallback() {
      var k = 'portfolio.views', seedKey = 'portfolio.views.seed', sessKey = 'portfolio.views.session';
      var seed = parseInt(localStorage.getItem(seedKey) || '0', 10);
      if (!seed) {
        seed = 1247 + Math.floor(Math.random() * 80);
        try { localStorage.setItem(seedKey, String(seed)); } catch (_) {}
      }
      var n = parseInt(localStorage.getItem(k) || '0', 10) || seed;
      if (!sessionStorage.getItem(sessKey)) {
        n += 1;
        try {
          localStorage.setItem(k, String(n));
          sessionStorage.setItem(sessKey, '1');
        } catch (_) {}
      }
      return n;
    }

    function bump(el) {
      if (!el) return;
      el.classList.remove('is-bumped');
      // force reflow then re-add
      void el.offsetWidth;
      el.classList.add('is-bumped');
      setTimeout(function () { el.classList.remove('is-bumped'); }, 600);
    }

    function setTotal(n, didIncrement) {
      var prev = parseInt((totalEl && totalEl.dataset.raw) || '0', 10);
      if (totalEl) {
        totalEl.dataset.raw = String(n);
        totalEl.textContent = fmt(n);
        if (didIncrement || (prev && n > prev)) bump(totalEl);
      }
      if (hudEl) hudEl.textContent = fmt(n);
      try { localStorage.setItem('portfolio.views', String(n)); } catch (_) {}
    }

    function stampRefresh() {
      if (!refreshEl) return;
      var d = new Date();
      refreshEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function withTimeout(url, ms) {
      var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms);
      return fetch(url, ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('bad'); return r.json(); })
        .catch(function (e) { clearTimeout(t); throw e; });
    }

    function parseCount(d) {
      if (!d) return null;
      if (typeof d.count === 'number') return d.count;
      if (d.data) {
        if (typeof d.data.up_count === 'number') return d.data.up_count;
        if (typeof d.data.count === 'number') return d.data.count;
      }
      if (typeof d.value === 'number') return d.value;
      return null;
    }

    // ---- Increment on first load (only once per session) ----
    function initialIncrement() {
      var sessKey = 'portfolio.views.incremented';
      if (sessionStorage.getItem(sessKey)) { poll(); return; }
      withTimeout('https://api.counterapi.dev/v1/' + NAMESPACE + '/' + KEY + '/up', 4000)
        .then(function (d) {
          var n = parseCount(d);
          if (n != null && n > 0) {
            setTotal(n, true);
            try { sessionStorage.setItem(sessKey, '1'); } catch (_) {}
          } else {
            setTotal(localFallback(), true);
          }
        })
        .catch(function () { setTotal(localFallback(), true); })
        .then(stampRefresh);
    }

    // ---- Poll (read-only) every 30s ----
    function poll() {
      withTimeout('https://api.counterapi.dev/v1/' + NAMESPACE + '/' + KEY, 4000)
        .then(function (d) {
          var n = parseCount(d);
          if (n != null && n > 0) setTotal(n, false);
        })
        .catch(function () {})
        .then(stampRefresh);
    }

    // initial cached value so the slot isn't empty during fetch
    var cached = 0;
    try { cached = parseInt(localStorage.getItem('portfolio.views') || '0', 10); } catch (_) {}
    if (cached > 0 && totalEl) totalEl.textContent = fmt(cached);

    initialIncrement();

    setInterval(poll, POLL_MS);

    // poll once when the tab becomes visible again
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') poll();
    });
  })();

  /* ---------- Hover tooltip system ---------- */
  (function tooltips() {
    if (isTouch) return;
    var dict = {
      'vue.js':       'Progressive JS framework · reactive UI components',
      'vue':          'Progressive JS framework · reactive UI components',
      'laravel':      'PHP framework · Eloquent ORM, queues, auth',
      'flutter':      'Cross-platform mobile · single codebase, native perf',
      'dart':         'Modern, type-safe language · powers Flutter',
      'claude ai':    'Anthropic\'s AI · pair-programming partner',
      'claude':       'Anthropic\'s AI · pair-programming partner',
      'claude code':  'Anthropic\'s CLI for AI-assisted coding',
      'claude api':   'Anthropic\'s API for LLM-powered features',
      'openai api':   'GPT models · embeddings · function calling',
      'vibe coding':  'AI-assisted dev flow · ship at hyper-speed',
      'n8n':          'Open-source workflow automation · self-hosted',
      'n8n workflows':'Open-source workflow automation · self-hosted',
      'zapier':       'SaaS automation · 6000+ app integrations',
      'zapier / make.com': 'No-code automation platforms',
      'make.com':     'Visual no-code automation (formerly Integromat)',
      'pipedream':    'Code-first event-driven workflows',
      'webhooks':     'Event-driven integrations · push notifications',
      'cron jobs':    'Scheduled task execution',
      'ai-assisted dev': 'Pair programming with AI agents',
      'html5':        'Semantic markup · accessible structure',
      'css3':         'Styling, animations, modern layout systems',
      'jquery':       'Battle-tested DOM utility · legacy projects',
      'php':          'Server-side scripting · backbone of Laravel',
      'mysql':        'Relational database · indexing & query tuning',
      'api':          'REST design · auth, versioning, contracts',
      'statamic':     'Flat-file Laravel CMS · content modeling',
      'wordpress':    'WP themes, plugins, custom Gutenberg blocks',
      'silverstripe': 'PHP CMS · enterprise content',
      'adobe suite':  'Photoshop · Illustrator · graphic design',
      'github copilot': 'AI code completion · IDE integration',
      'android studio': 'Android dev IDE · Flutter tooling',
      'firebase':     'Realtime DB · auth · cloud functions',
      'git':          'Distributed VCS · branching, rebases, hooks',
      'vs code':      'Daily-driver editor · extensions, workspaces',
      'figma':        'Collaborative UI design · prototyping',
      'postman':      'API testing · environments, collections',
      'docker':       'Containerization · isolated dev/prod parity',
      'composer':     'PHP dependency manager · PSR autoloading',
      'npm / vite':   'JS package manager · lightning-fast bundler',
      'linux':        'Server / WSL · shell, scripting, sysadmin',
      'rest apis':    'JSON over HTTP · stateless interfaces'
    };

    var tip = document.createElement('div');
    tip.className = 'tech-tip';
    document.body.appendChild(tip);
    var current = null;

    function show(target) {
      var label = (target.textContent || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*new$/, '');
      label = label.split(/\s{2,}/)[0];
      var desc = dict[label];
      if (!desc) return;
      tip.innerHTML = '<span class="tech-tip__key">' + label + '</span>' + desc;
      var r = target.getBoundingClientRect();
      tip.style.left = (r.left + r.width / 2) + 'px';
      tip.style.top = r.top + 'px';
      tip.classList.add('is-show');
      current = target;
    }
    function hide() { tip.classList.remove('is-show'); current = null; }

    var sel = '.tech-chip, .tool-badge';
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest && e.target.closest(sel);
      if (t && t !== current) show(t);
    });
    document.addEventListener('mouseout', function (e) {
      var t = e.target.closest && e.target.closest(sel);
      if (t) hide();
    });
    window.addEventListener('scroll', hide, { passive: true });
  })();

  /* ---------- Hyperframe brackets injection ---------- */
  (function hyperframes() {
    var sels = ['.code-card'];
    sels.forEach(function (s) {
      document.querySelectorAll(s).forEach(function (n) {
        if (n.classList.contains('hyperframe')) return;
        n.classList.add('hyperframe');
        var tr = document.createElement('span'); tr.className = 'hf-tr';
        var bl = document.createElement('span'); bl.className = 'hf-bl';
        n.appendChild(tr); n.appendChild(bl);
      });
    });
  })();

  /* ---------- 3D mouse-tilt on cards ---------- */
  (function tilt() {
    if (isTouch || prefersReduced) return;
    var sels = '.code-card, .svc-card, .exp-card, .skill-card';
    document.querySelectorAll(sels).forEach(function (el) {
      el.classList.add('tilt');
      el.style.perspective = '900px';
      var raf = null;
      el.addEventListener('mousemove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;
          var ry = (px - 0.5) * 8;   // rotateY
          var rx = (0.5 - py) * 6;   // rotateX
          el.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(0)';
          raf = null;
        });
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  })();

  /* ---------- Command palette ----------
   * Sectioned, fuzzy, alias-aware. Ingests the 95-entry FAQ from
   * window.PortfolioChat.faq and hands selected questions off to the chat.
   * Free-form queries surface an "Ask the assistant" pseudo-row so any input
   * has a path forward.
   * ------------------------------------------------------------------------- */
  (function cmdk() {
    var CASE_STUDIES = [
      { slug: 'ai-engineer', title: 'Autonomous AI Engineer',      meta: 'AI · Laravel',      aliases: ['ai', 'agent', 'multi-llm', 'claude', 'gemini', 'phpunit', 'autonomous'] },
      { slug: 'wms-v2',      title: 'WMS v2 Inventory Rewrite',    meta: 'Web · Vue/Laravel', aliases: ['wms', 'rewrite', 'canonical', 'v3', 'basecrud'] },
      { slug: 'hris',        title: 'Enterprise HRIS',             meta: 'Web · Vue 3',       aliases: ['hr', 'payroll', 'totp', '2fa', 'human resources'] },
      { slug: 'tms',         title: 'Transport Management System', meta: 'Web · GPS',         aliases: ['transport', 'dispatch', 'logistics', 'gps'] },
      { slug: 'pamanaland',  title: 'Pamanaland Realty Portal',    meta: 'Web · Vue/Laravel', aliases: ['real estate', 'realty', 'developer portal', 'rms'] },
      { slug: 'jbc',         title: 'JBC Commission System',       meta: 'Web · Vue/Laravel', aliases: ['brokerage', 'commission'] },
      { slug: 'wms',         title: 'WMS Mobile App',              meta: 'Mobile · Flutter',  aliases: ['warehouse', 'bluetooth', 'scanner', 'flutter'] },
      { slug: 'llm-wiki',    title: 'LLM-Friendly Wiki',           meta: 'Docs · Obsidian',   aliases: ['obsidian', 'karpathy', 'knowledge base', 'wiki'] }
    ];

    var items = [
      { section: 'navigate', label: 'Go to: About',         hash: '#fh5co-about',    icon: '#', meta: 'jump', aliases: ['about', 'bio'] },
      { section: 'navigate', label: 'Go to: Experience',    hash: '#fh5co-resume',   icon: '#', meta: 'jump', aliases: ['resume', 'experience', 'work history', 'timeline'] },
      { section: 'navigate', label: 'Go to: Build',         hash: '#fh5co-features', icon: '#', meta: 'jump', aliases: ['services', 'features', 'build', 'what i build'] },
      { section: 'navigate', label: 'Go to: Skills',        hash: '#fh5co-skills',   icon: '#', meta: 'jump', aliases: ['skills', 'tech', 'stack'] },
      { section: 'navigate', label: 'Go to: Projects',      hash: '#fh5co-work',     icon: '#', meta: 'jump', aliases: ['work', 'projects'] },
      { section: 'navigate', label: 'Go to: Case Studies',  hash: '#fh5co-blog',     icon: '#', meta: 'jump', aliases: ['case studies', 'blog', 'writeups'] },
      { section: 'navigate', label: 'Go to: Contact',       hash: '#fh5co-started',  icon: '#', meta: 'jump', aliases: ['contact'] }
    ];

    CASE_STUDIES.forEach(function (cs) {
      items.push({
        section: 'case-study',
        label: 'Case study: ' + cs.title,
        href: 'case-studies/' + cs.slug + '.html',
        icon: '◆', meta: cs.meta,
        thumb: 'images/og-' + cs.slug + '.png',  // inline preview in palette rows
        aliases: [cs.slug].concat(cs.aliases)
      });
    });

    // Deep links into named sections inside each case study. Each entry
    // points at a stable <h2 id> added across all 8 writeups. Hand-curated
    // — same discipline as the FAQ aliases — so typing "PHPUnit", "BaseCrud"
    // or "Bluetooth" lands the user at the right anchor, not the page top.
    var CASE_SECTIONS = [
      // ai-engineer
      { slug: 'ai-engineer', anchor: 'what-i-built',         label: 'AI Engineer · Multi-LLM dispatcher (Claude/Gemini/OpenAI/OpenRouter/Qwen)', meta: 'What I built',  aliases: ['multi llm', 'dispatcher', 'claude', 'gemini', 'openai', 'openrouter', 'qwen', 'llm router'] },
      { slug: 'ai-engineer', anchor: 'tech',                 label: 'AI Engineer · PHPUnit deploy verifier',                                    meta: 'Tech',           aliases: ['phpunit', 'verifier', 'deploy gate', 'tests'] },
      { slug: 'ai-engineer', anchor: 'how-i-broke-it-down',  label: 'AI Engineer · Repo auto-detection + ticket pickup',                        meta: 'Approach',       aliases: ['ticket', 'auto detect repo', 'assigned ticket', 'workflow'] },
      { slug: 'ai-engineer', anchor: 'what-it-is',           label: 'AI Engineer · Karpathy-style autonomous engineering',                      meta: 'Context',        aliases: ['karpathy', 'autonomous', 'ai engineer'] },
      // wms (Flutter)
      { slug: 'wms',         anchor: 'what-i-built',         label: 'WMS Mobile · Bluetooth ESC/POS label printing (Epson TM-P80II)',           meta: 'What I built',  aliases: ['bluetooth', 'esc/pos', 'escpos', 'label printing', 'epson', 'tm-p80ii', 'printer'] },
      { slug: 'wms',         anchor: 'what-i-built',         label: 'WMS Mobile · Offline replay queue (no scans lost mid-aisle)',              meta: 'What I built',  aliases: ['offline', 'replay queue', 'offline first', 'sync queue'] },
      { slug: 'wms',         anchor: 'what-i-built',         label: 'WMS Mobile · Dual-input scanning (camera + keyboard-wedge)',               meta: 'What I built',  aliases: ['scanner', 'scanning', 'keyboard wedge', 'camera scan', 'barcode'] },
      { slug: 'wms',         anchor: 'results',              label: 'WMS Mobile · 108 build releases, 13 feature modules',                      meta: 'Results',        aliases: ['108 releases', 'release cadence', 'modules'] },
      // wms-v2
      { slug: 'wms-v2',      anchor: 'what-i-built',         label: 'WMS v2 · Canonical V3 list-page pattern + BaseCrud foundation',            meta: 'What I built',  aliases: ['canonical v3', 'basecrud', 'list page', 'v3 pattern', 'crud framework'] },
      { slug: 'wms-v2',      anchor: 'tech',                 label: 'WMS v2 · CI-enforced architectural guardrails (ESLint + PHPStan)',         meta: 'Tech',           aliases: ['eslint', 'phpstan', 'guardrails', 'architecture rules', 'ci gates'] },
      { slug: 'wms-v2',      anchor: 'tech',                 label: 'WMS v2 · Online DDL on huge tables (ALGORITHM=INPLACE LOCK=NONE)',          meta: 'Tech',           aliases: ['online ddl', 'algorithm inplace', 'lock none', 'big table migration', 'zero downtime ddl'] },
      // hris
      { slug: 'hris',        anchor: 'tech',                 label: 'HRIS · TOTP 2FA',                                                          meta: 'Tech',           aliases: ['totp', '2fa', 'two factor', 'mfa'] },
      { slug: 'hris',        anchor: 'tech',                 label: 'HRIS · Jenkins + Buddy dual CI/CD',                                        meta: 'Tech',           aliases: ['jenkins', 'buddy', 'dual ci', 'pipeline'] },
      { slug: 'hris',        anchor: 'tech',                 label: 'HRIS · GET_LOCK-serialized memo numbering',                                meta: 'Tech',           aliases: ['get_lock', 'memo number', 'serialization', 'concurrent numbering'] },
      { slug: 'hris',        anchor: 'what-i-built',         label: 'HRIS · PH government payroll tables (SSS/PhilHealth/PagIBIG/BIR)',         meta: 'What I built',  aliases: ['payroll', 'sss', 'philhealth', 'pag-ibig', 'pagibig', 'bir', 'philippines payroll'] },
      { slug: 'hris',        anchor: 'what-i-built',         label: 'HRIS · 95 pages across the full HR lifecycle',                             meta: 'What I built',  aliases: ['95 pages', 'hr lifecycle', 'pages'] },
      // tms
      { slug: 'tms',         anchor: 'what-i-built',         label: 'TMS · Live GPS dispatch + booking → invoice pipeline',                     meta: 'What I built',  aliases: ['live gps', 'dispatch', 'booking', 'invoice pipeline', 'route'] },
      { slug: 'tms',         anchor: 'results',              label: 'TMS · 324 pages, 68 models',                                               meta: 'Results',        aliases: ['324 pages', '68 models', 'scale'] },
      // pamanaland
      { slug: 'pamanaland',  anchor: 'what-i-built',         label: 'Pamanaland · Reservation → equity → amortization → in-house financing',   meta: 'What I built',  aliases: ['reservation', 'equity', 'amortization', 'in-house financing', 'real estate lifecycle'] },
      { slug: 'pamanaland',  anchor: 'tech',                 label: 'Pamanaland · OU-scoped CASL RBAC, 5-tier seller hierarchy',                meta: 'Tech',           aliases: ['casl', 'rbac', 'permissions', 'ou', 'seller tier', 'sales hierarchy'] },
      // jbc
      { slug: 'jbc',         anchor: 'what-i-built',         label: 'JBC · 5-tier commission shares + approver workflow',                       meta: 'What I built',  aliases: ['commission share', '5 tier', 'approver workflow', 'sales commission'] },
      { slug: 'jbc',         anchor: 'results',              label: 'JBC · 22 months in production, ~640 commits',                              meta: 'Results',        aliases: ['22 months', '640 commits', 'longevity'] },
      // llm-wiki
      { slug: 'llm-wiki',    anchor: 'what-i-built',         label: 'LLM Wiki · Per-folder _INDEX.md (cuts agent token cost)',                  meta: 'What I built',  aliases: ['_index.md', 'per folder index', 'token cost', 'agent context'] },
      { slug: 'llm-wiki',    anchor: 'what-it-is',           label: 'LLM Wiki · Karpathy-pattern Obsidian vault shared by humans + agents',     meta: 'Context',        aliases: ['obsidian', 'karpathy', 'shared vault', 'agent docs'] }
    ];
    CASE_SECTIONS.forEach(function (cs) {
      items.push({
        section: 'case-section',
        label: cs.label,
        href: 'case-studies/' + cs.slug + '.html#' + cs.anchor,
        icon: '⬡',
        meta: cs.meta,
        aliases: [cs.slug].concat(cs.aliases || [])
      });
    });

    items.push(
      { section: 'action', label: 'Hire Me',                  hash: '#fh5co-started', icon: '$', meta: 'cta',         aliases: ['hire', 'work with me'] },
      { section: 'action', label: 'Explore case studies in 3D',action: 'orbital',     icon: '◎', meta: 'gallery',     aliases: ['3d', 'orbital', 'gallery', 'showcase', 'spin', 'ring', 'explore', 'orbit'] },
      { section: 'action', label: 'Take the 30-second tour',  action: 'tour',         icon: '▶', meta: 'guided',      aliases: ['tour', 'walkthrough', 'demo', 'guided'] },
      { section: 'action', label: 'Cycle theme (Alt+T)',      action: 'cycleTheme',   icon: '◐', meta: 'theme',       aliases: ['theme', 'palette', 'dark mode', 'cyber', 'matrix', 'sunset', 'xeno', 'crt'] },
      { section: 'action', label: 'Toggle Konami Mode',       action: 'konami',       icon: '★', meta: 'easter egg',  aliases: ['konami', 'easter egg', 'secret'] },
      { section: 'action', label: 'Scroll to Top',            action: 'top',          icon: '↑', meta: 'nav',         aliases: ['top', 'scroll to top'] }
    );

    items.push(
      { section: 'resource', label: 'Email: turayalemmuel@gmail.com', href: 'mailto:turayalemmuel@gmail.com', icon: '@', meta: 'contact', aliases: ['email', 'mail'] },
      { section: 'resource', label: 'GitHub: kon2raya24',              href: 'https://github.com/kon2raya24',                icon: '↗', meta: 'link', aliases: ['github', 'repo', 'code'] },
      { section: 'resource', label: 'LinkedIn',                        href: 'https://www.linkedin.com/in/lemmuel-turaya/',  icon: '↗', meta: 'link', aliases: ['linkedin'] },
      { section: 'resource', label: 'Book a 15-min intro call',        href: 'https://cal.com/lemmuel-turaya/intro',         icon: '☎', meta: 'cal.com', aliases: ['cal.com', 'call', 'book', 'meeting', 'intro'] },
      { section: 'resource', label: 'Download Resume (PDF)',           href: 'resume.pdf',     icon: '⇣', meta: 'file', aliases: ['cv', 'resume', 'pdf', 'download'] },
      { section: 'resource', label: 'Open /uses',                      href: 'uses.html',      icon: '⚙', meta: 'page', aliases: ['uses', 'setup', 'tools'] },
      { section: 'resource', label: 'Open /changelog',                 href: 'changelog.html', icon: '◷', meta: 'page', aliases: ['changelog', 'updates', 'history'] },
      { section: 'resource', label: 'Open resume.json',                href: 'resume.json',    icon: '{}', meta: 'data', aliases: ['json', 'resume json', 'data'] },
      // Clipboard actions — useful for recruiters/hiring managers pasting
      // contact info into ATS forms, Slack, or notes. action='copy' + text.
      { section: 'resource', label: 'Copy email address',  action: 'copy', text: 'turayalemmuel@gmail.com',                  icon: '⎘', meta: 'copy', aliases: ['copy email', 'paste email', 'clipboard'] },
      { section: 'resource', label: 'Copy GitHub URL',     action: 'copy', text: 'https://github.com/kon2raya24',             icon: '⎘', meta: 'copy', aliases: ['copy github', 'github link'] },
      { section: 'resource', label: 'Copy LinkedIn URL',   action: 'copy', text: 'https://www.linkedin.com/in/lemmuel-turaya/', icon: '⎘', meta: 'copy', aliases: ['copy linkedin', 'linkedin link'] },
      { section: 'resource', label: 'Copy resume PDF link',action: 'copy', text: 'https://kon2raya.netlify.app/resume.pdf', icon: '⎘', meta: 'copy', aliases: ['copy resume', 'cv link', 'paste resume'] }
    );

    // FAQ ingestion — the chat IIFE exposes its curated entries on
    // window.PortfolioChat.faq. The chat may bootstrap after us on slow
    // loads, so we try inline first and fall back to DOMContentLoaded.
    function loadFaqItems() {
      var src = (window.PortfolioChat && window.PortfolioChat.faq) || [];
      src.forEach(function (e) {
        items.push({
          section: 'faq',
          label: e.q,
          action: 'ask',
          ask: e.q,
          icon: '?',
          meta: e.category || 'faq',
          aliases: (e.aliases || []).concat([e.category || ''])
        });
      });
    }
    if (window.PortfolioChat && window.PortfolioChat.faq) loadFaqItems();
    else document.addEventListener('DOMContentLoaded', loadFaqItems, { once: true });

    var SECTION_LABELS = {
      'ask':          'Ask the assistant',
      'recent':       'Recently used',
      'navigate':     'Navigate',
      'case-study':   'Case studies',
      'case-section': 'Inside the case studies',
      'faq':          'FAQ',
      'action':       'Actions',
      'resource':     'Resources'
    };
    var SECTION_ORDER = ['ask', 'recent', 'navigate', 'case-study', 'case-section', 'faq', 'action', 'resource'];

    // Recent-items persistence — stores label+section composite keys for the
    // last few items the user picked. Returning visitors get a one-click
    // re-entry to what they cared about last session.
    var RECENT_KEY = 'portfolio.cmdk.recent';
    var RECENT_MAX = 4;
    function itemKey(it) { return it.section + '|' + it.label; }
    function loadRecent() {
      try { var raw = localStorage.getItem(RECENT_KEY); return raw ? JSON.parse(raw) : []; }
      catch (e) { return []; }
    }
    function pushRecent(it) {
      if (!it || it.section === 'ask' || it.__virtual) return; // skip virtual ask-row
      var keys = loadRecent().filter(function (k) { return k !== itemKey(it); });
      keys.unshift(itemKey(it));
      keys = keys.slice(0, RECENT_MAX);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(keys)); } catch (e) {}
    }
    function recentItems() {
      var keys = loadRecent();
      if (!keys.length) return [];
      var byKey = {};
      items.forEach(function (it) { byKey[itemKey(it)] = it; });
      return keys.map(function (k) { return byKey[k]; }).filter(Boolean);
    }

    function normalize(s) {
      return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    }
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function highlight(text, q) {
      if (!q) return escapeHtml(text);
      var safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return escapeHtml(text).replace(new RegExp('(' + safe + ')', 'gi'),
        '<mark class="cmdk__hl">$1</mark>');
    }
    function scoreItem(it, nq) {
      if (!nq) return 1;
      var nl = normalize(it.label);
      var nm = normalize(it.meta || '');
      if (nl === nq) return 100;
      if (nl.indexOf(nq) === 0) return 80;
      if (nl.indexOf(nq) !== -1) return 60;
      var na = it.aliases || [];
      for (var i = 0; i < na.length; i++) {
        var a = normalize(na[i]);
        if (!a) continue;
        if (a === nq) return 70;
        if (a.indexOf(nq) === 0) return 50;
        if (a.indexOf(nq) !== -1) return 40;
      }
      if (nm.indexOf(nq) !== -1) return 30;
      // Per-token prefix overlap on the label — handles "vue laravel" → "Vue/Laravel"
      var qToks = nq.split(' ').filter(Boolean);
      var lToks = nl.split(' ').filter(Boolean);
      if (qToks.length && lToks.length) {
        var hits = 0;
        for (var k = 0; k < qToks.length; k++) {
          for (var j = 0; j < lToks.length; j++) {
            if (lToks[j].indexOf(qToks[k]) === 0) { hits++; break; }
          }
        }
        if (hits === qToks.length) return 25;
        if (hits / qToks.length >= 0.5) return 15;
      }
      return 0;
    }

    var overlay = document.createElement('div');
    overlay.className = 'cmdk-overlay';
    overlay.innerHTML =
      '<div class="cmdk" role="dialog" aria-modal="true" aria-label="Command palette">' +
        '<div class="cmdk__head">' +
          '<span class="cmdk__prompt">&gt;</span>' +
          '<input class="cmdk__input" type="text" placeholder="Search: case studies, FAQ, jump-to… (or type to ask)" autocomplete="off" spellcheck="false" aria-label="Command palette search">' +
          '<span class="cmdk__kbd">ESC</span>' +
        '</div>' +
        '<ul class="cmdk__list" role="listbox"></ul>' +
        '<div class="cmdk__foot">' +
          '<span><kbd>↑↓</kbd> navigate</span>' +
          '<span><kbd>tab</kbd> section</span>' +
          '<span><kbd>↵</kbd> select</span>' +
          '<span><kbd>esc</kbd> close</span>' +
          '<span class="cmdk__count" data-cmdk-count></span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var hint = document.createElement('div');
    hint.className = 'cmdk-hint';
    var mac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    hint.innerHTML = 'press <kbd>' + (mac ? '⌘' : 'ctrl') + '</kbd> + <kbd>k</kbd> for commands';
    document.body.appendChild(hint);
    setTimeout(function () { hint.style.transition = 'opacity 0.6s'; hint.style.opacity = '0'; }, 9000);

    // Mobile FAB — Ctrl+K is keyboard-only, so phones need a tap target.
    // Placed bottom-left so the bottom-right chat bubble + go-to-top stack
    // stays uncluttered. CSS hides it on viewports >= 769px.
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'cmdk-fab';
    fab.setAttribute('aria-label', 'Open command palette');
    fab.innerHTML = '<span class="cmdk-fab__kbd">⌘K</span>';
    fab.addEventListener('click', function () {
      overlay.classList.contains('is-open') ? close() : open();
    });
    document.body.appendChild(fab);

    // First-time mobile coachmark — most phone visitors won't know what ⌘K
    // does. A speech-bubble pointing at the FAB introduces it on first run.
    // Auto-dismisses after 6s, on first FAB tap, or on any scroll. Flag is
    // persisted in localStorage so it shows once per device.
    var COACH_KEY = 'portfolio.cmdk.fab.seen';
    function maybeShowCoach() {
      try { if (localStorage.getItem(COACH_KEY)) return; } catch (e) {}
      if (!matchMedia('(max-width: 768px)').matches) return;
      var coach = document.createElement('div');
      coach.className = 'cmdk-fab-coach';
      coach.setAttribute('role', 'tooltip');
      coach.innerHTML =
        '<div class="cmdk-fab-coach__body">' +
          '<strong>Tap to search</strong>' +
          '<span class="cmdk-fab-coach__sub">100+ Q&amp;A · 8 case studies</span>' +
        '</div>' +
        '<i class="cmdk-fab-coach__arrow" aria-hidden="true"></i>';
      document.body.appendChild(coach);
      var dismissed = false;
      var dismiss = function () {
        if (dismissed) return;
        dismissed = true;
        coach.classList.add('is-leaving');
        setTimeout(function () { if (coach.parentNode) coach.parentNode.removeChild(coach); }, 320);
        try { localStorage.setItem(COACH_KEY, '1'); } catch (e) {}
        window.removeEventListener('scroll', onScroll, { passive: true });
      };
      var onScroll = function () { dismiss(); };
      fab.addEventListener('click', dismiss, { once: true });
      coach.addEventListener('click', dismiss);
      window.addEventListener('scroll', onScroll, { passive: true });
      setTimeout(dismiss, 6000);
      // Fade in on next frame so transitions catch
      requestAnimationFrame(function () { coach.classList.add('is-open'); });
    }
    setTimeout(maybeShowCoach, 1400);

    var input   = overlay.querySelector('.cmdk__input');
    var list    = overlay.querySelector('.cmdk__list');
    var countEl = overlay.querySelector('[data-cmdk-count]');
    var rows = [];        // focusable row DOM nodes
    var rowsItems = [];   // parallel: the item for each row
    var active = 0;

    function buildAskItem(q) {
      return {
        section: 'ask',
        label: 'Ask the assistant: "' + q + '"',
        action: 'ask',
        ask: q,
        icon: '✦',
        meta: 'chat',
        __virtual: true
      };
    }

    function render(query) {
      query = query || '';
      var nq = normalize(query);
      list.innerHTML = '';
      rows = [];
      rowsItems = [];

      var grouped = {};
      SECTION_ORDER.forEach(function (k) { grouped[k] = []; });

      items.forEach(function (it) {
        var s = scoreItem(it, nq);
        if (s > 0) grouped[it.section].push({ s: s, it: it });
      });

      // Sort each section by score desc, preserving insertion order for ties
      Object.keys(grouped).forEach(function (k) {
        grouped[k].sort(function (a, b) { return b.s - a.s; });
        grouped[k] = grouped[k].map(function (x) { return x.it; });
      });

      // Prepend virtual "Ask the assistant: <query>" when typing free-form
      if (query.trim()) grouped.ask.unshift(buildAskItem(query.trim()));

      // Surface recently-used items at the top — only on the no-query state,
      // so a filtered view stays a pure search and isn't polluted by history.
      // Also remove them from their native section so they don't render twice.
      if (!nq) {
        var recents = recentItems();
        if (recents.length) {
          var recentKeys = {};
          recents.forEach(function (it) {
            recentKeys[itemKey(it)] = true;
            grouped.recent.push(it);
          });
          Object.keys(grouped).forEach(function (k) {
            if (k === 'recent') return;
            grouped[k] = grouped[k].filter(function (it) { return !recentKeys[itemKey(it)]; });
          });
        }
      }

      SECTION_ORDER.forEach(function (key) {
        var bucket = grouped[key];
        if (!bucket || !bucket.length) return;
        var header = document.createElement('li');
        header.className = 'cmdk__section';
        header.setAttribute('aria-hidden', 'true');
        header.textContent = SECTION_LABELS[key] || key;
        list.appendChild(header);

        // Cap larger sections when the user hasn't typed yet — surfacing all
        // 100+ FAQ + 20+ case-section entries unfiltered would wall-of-text
        // the open state. Once a query is present, show every match.
        var cap = (!nq && (key === 'faq' || key === 'case-section')) ? 6 : 60;
        var visible = bucket.slice(0, cap);
        visible.forEach(function (it) {
          var li = document.createElement('li');
          li.className = 'cmdk__row';
          if (it.__virtual) li.classList.add('cmdk__row--ask');
          li.setAttribute('role', 'option');
          li.setAttribute('data-section', it.section);
          // Case-study rows render a thumbnail of their OG image instead of
          // the generic ◆ glyph; gives the palette a magazine-cover feel.
          var iconCell = it.thumb
            ? '<span class="cmdk__icon cmdk__icon--thumb"><img src="' + escapeHtml(it.thumb) + '" alt="" width="44" height="24" loading="lazy" decoding="async"></span>'
            : '<span class="cmdk__icon">' + escapeHtml(it.icon || '') + '</span>';
          li.innerHTML =
            iconCell +
            '<span class="cmdk__label">' + highlight(it.label, query.trim()) + '</span>' +
            '<span class="cmdk__meta">' + highlight(it.meta || '', query.trim()) + '</span>';
          // Stagger row entry — index capped at 8 so a 50-row result set
          // doesn't take a full second to finish drawing in.
          li.style.animationDelay = (Math.min(rows.length, 8) * 18) + 'ms';
          // 3D parallax on case-study rows — the OG thumbnail floats forward
          // on translateZ as the row tilts under the cursor. Builds on the
          // existing tilt() IIFE pattern; respects reduced-motion + touch.
          if (it.section === 'case-study' && !isTouch && !prefersReduced) {
            li.classList.add('cmdk__row--tilt');
            var raf = null;
            li.addEventListener('mousemove', function (ev) {
              if (raf) return;
              raf = requestAnimationFrame(function () {
                var r = li.getBoundingClientRect();
                var px = (ev.clientX - r.left) / r.width;
                var py = (ev.clientY - r.top) / r.height;
                var ry = (px - 0.5) * 6;
                var rx = (0.5 - py) * 4;
                li.style.transform = 'perspective(700px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
                raf = null;
              });
            });
            li.addEventListener('mouseleave', function () {
              li.style.transform = '';
            });
          }
          li.addEventListener('click', function () { exec(it); });
          list.appendChild(li);
          rows.push(li);
          rowsItems.push(it);
        });
        if (bucket.length > cap) {
          var more = document.createElement('li');
          more.className = 'cmdk__more';
          more.setAttribute('aria-hidden', 'true');
          more.textContent = '+ ' + (bucket.length - cap) + ' more — type to filter';
          list.appendChild(more);
        }
      });

      if (!rows.length) {
        var empty = document.createElement('li');
        empty.className = 'cmdk__empty';
        empty.textContent = 'No matches. Press Enter to ask the assistant.';
        list.appendChild(empty);
      }

      active = 0;
      paintActive();
      if (countEl) countEl.textContent = rows.length + ' result' + (rows.length === 1 ? '' : 's');
    }

    function paintActive() {
      rows.forEach(function (r, i) {
        var isActive = i === active;
        r.classList.toggle('is-active', isActive);
        if (isActive) r.scrollIntoView({ block: 'nearest' });
      });
    }

    // Toast — non-blocking confirmation for actions that don't navigate
    // (clipboard copy mainly). Anchored bottom-center of the palette.
    function showToast(msg) {
      var t = overlay.querySelector('.cmdk__toast');
      if (!t) {
        t = document.createElement('div');
        t.className = 'cmdk__toast';
        overlay.querySelector('.cmdk').appendChild(t);
      }
      t.textContent = msg;
      t.classList.remove('is-open');
      // Reflow so animation re-triggers
      void t.offsetWidth;
      t.classList.add('is-open');
      clearTimeout(t._timer);
      t._timer = setTimeout(function () { t.classList.remove('is-open'); }, 1500);
    }

    function exec(it) {
      if (!it) {
        var q = (input.value || '').trim();
        if (q) { close(); if (window.PortfolioChat) window.PortfolioChat.ask(q); }
        return;
      }
      pushRecent(it);
      // Copy actions don't close the palette — visitors often want to copy
      // several things in a row. Toast confirms each paste-buffer write.
      if (it.action === 'copy' && it.text) {
        var done = function () { showToast('Copied: ' + it.text); };
        var fail = function () { showToast('Copy failed — select manually'); };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(it.text).then(done, fail);
          } else {
            // Older browsers: fallback via a temp textarea
            var ta = document.createElement('textarea');
            ta.value = it.text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            document.execCommand('copy');
            ta.remove();
            done();
          }
        } catch (e) { fail(); }
        return;
      }
      close();
      if (it.action === 'ask' && it.ask) {
        if (window.PortfolioChat) window.PortfolioChat.ask(it.ask);
        return;
      }
      if (it.action === 'konami')     { document.body.classList.toggle('konami-on'); return; }
      if (it.action === 'top')        { window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }); return; }
      if (it.action === 'tour')       { if (window.PortfolioTour) window.PortfolioTour.start(); return; }
      if (it.action === 'orbital')    { if (window.PortfolioOrbital) window.PortfolioOrbital.open(); return; }
      if (it.action === 'cycleTheme') {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 't', altKey: true, bubbles: true }));
        return;
      }
      if (it.hash) {
        var t = document.querySelector(it.hash);
        if (t) t.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        return;
      }
      if (it.href) {
        if (it.href.indexOf('mailto:') === 0 || /\.(pdf|zip)$/i.test(it.href)) {
          window.location.href = it.href;
        } else {
          window.open(it.href, '_blank', 'noopener');
        }
      }
    }

    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      overlay.classList.add('is-open');
      input.value = '';
      render('');
      setTimeout(function () { input.focus(); }, 10);
    }
    function close() {
      overlay.classList.remove('is-open');
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
        lastFocus = null;
      }
    }

    input.addEventListener('input', function (e) { render(e.target.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!rows.length) return;
        active = (active + 1) % rows.length; paintActive();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!rows.length) return;
        active = (active - 1 + rows.length) % rows.length; paintActive();
      } else if (e.key === 'Tab') {
        // Tab / Shift+Tab — jump to the first row of the next/previous
        // section. Conflict-free with browser tab-switching shortcuts and
        // makes long result sets scannable in one keystroke per section.
        if (!rows.length) return;
        e.preventDefault();
        var dir = e.shiftKey ? -1 : 1;
        var current = rowsItems[active] ? rowsItems[active].section : null;
        var len = rows.length;
        for (var step = 1; step <= len; step++) {
          var i = (active + dir * step + len * len) % len;
          if (rowsItems[i] && rowsItems[i].section !== current) {
            // Going backward, we hit the LAST row of the prev section first.
            // Walk back through it until we land on its FIRST row.
            if (dir === -1) {
              var landed = rowsItems[i].section;
              while (i > 0 && rowsItems[i - 1] && rowsItems[i - 1].section === landed) i--;
            }
            active = i; paintActive();
            break;
          }
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        exec(rowsItems[active] || null);
      } else if (e.key === 'Escape') {
        close();
      }
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        overlay.classList.contains('is-open') ? close() : open();
      } else if (e.key === '/' && !overlay.classList.contains('is-open')) {
        var tag = (document.activeElement && document.activeElement.tagName) || '';
        var ce  = document.activeElement && document.activeElement.isContentEditable;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !ce) {
          e.preventDefault(); open();
        }
      }
    });

    window.PortfolioPalette = { open: open, close: close };
  })();

  /* ---------- Guided 30-second tour ----------
   * Auto-scrolls through key sections with caption bubbles. Triggered from
   * the command palette ("Take the 30-second tour"). ESC cancels, click
   * → advances, button-bar gives Pause/Next/Skip control.
   * ------------------------------------------------------------------------- */
  (function tour() {
    var STEPS = [
      { id: 'fh5co-header',   title: '~/hero',          caption: "Hey — I'm <strong>Lemmuel Turaya</strong>. Full-stack &amp; mobile dev, 6+ years shipping production work." },
      { id: 'fh5co-about',    title: 'about_me',        caption: "<strong>Vue · Laravel · Flutter</strong> daily. Karpathy-style AI-augmented engineering with <strong>Claude Code</strong> every day." },
      { id: 'fh5co-resume',   title: 'experience',      caption: "Logistics → real estate → HR → autonomous AI engineering. The timeline shows the surface area." },
      { id: 'fh5co-skills',   title: 'skills',          caption: "The daily stack and what I'd pair on. Vue 3 / Nuxt / Pinia, Laravel 11/12, Flutter, MySQL, Playwright + PHPUnit." },
      { id: 'fh5co-blog',     title: 'case_studies',    caption: "<strong>8 deep-dives</strong> into shipped systems. The AI-engineer + WMS v2 writeups are starred — start there." },
      { id: 'fh5co-started',  title: 'contact',         caption: "Open to remote / hybrid / onsite. <strong>Book a 15-min call</strong> or use the form — replies within 24h." }
    ];

    var prefersReducedLocal = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var STEP_MS = prefersReducedLocal ? 1200 : 4500;

    var bubble = null;
    var idx = 0;
    var paused = false;
    var timer = null;

    function ensureBubble() {
      if (bubble) return bubble;
      bubble = document.createElement('div');
      bubble.className = 'tour-bubble';
      bubble.setAttribute('role', 'dialog');
      bubble.setAttribute('aria-modal', 'false');
      bubble.setAttribute('aria-label', 'Guided tour');
      document.body.appendChild(bubble);
      return bubble;
    }

    // Step-mode content (the per-section caption + control bar). Re-rendered
    // fresh on each tour start so post-finale state doesn't leak in.
    function renderStepUI() {
      bubble.classList.remove('tour-bubble--finale');
      bubble.innerHTML =
        '<div class="tour-bubble__head">' +
          '<span class="tour-bubble__title" data-tour-title></span>' +
          '<span class="tour-bubble__step" data-tour-step></span>' +
        '</div>' +
        '<div class="tour-bubble__caption" data-tour-caption></div>' +
        '<div class="tour-bubble__bar">' +
          '<button type="button" class="tour-btn" data-tour-prev>← Back</button>' +
          '<button type="button" class="tour-btn" data-tour-pause>Pause</button>' +
          '<button type="button" class="tour-btn" data-tour-skip>Skip</button>' +
          '<button type="button" class="tour-btn tour-btn--primary" data-tour-next>Next →</button>' +
        '</div>' +
        '<div class="tour-bubble__progress"><span data-tour-progress></span></div>';
      bubble.querySelector('[data-tour-prev]').addEventListener('click',  function () { goto(idx - 1); });
      bubble.querySelector('[data-tour-next]').addEventListener('click',  function () { goto(idx + 1); });
      bubble.querySelector('[data-tour-skip]').addEventListener('click',  stop);
      bubble.querySelector('[data-tour-pause]').addEventListener('click', function () {
        paused = !paused;
        bubble.querySelector('[data-tour-pause]').textContent = paused ? 'Resume' : 'Pause';
        if (paused) clearTimer(); else scheduleNext();
      });
    }

    // Finale CTA — what visitors see after the last step. Soft sell: book a
    // call / email / replay the tour. Auto-fades after 18s unless interacted
    // with, so the bubble doesn't camp on the page forever.
    var finaleTimer = null;
    function renderFinaleUI() {
      bubble.classList.add('tour-bubble--finale');
      bubble.innerHTML =
        '<div class="tour-bubble__head">' +
          '<span class="tour-bubble__title">tour_complete</span>' +
          '<span class="tour-bubble__step">★ end</span>' +
        '</div>' +
        '<div class="tour-bubble__caption">' +
          "That's the 30-second version. If anything caught your eye, the fastest paths are below — or press <kbd>⌘K</kbd> to search the 100+ Q&amp;A and 8 case studies." +
        '</div>' +
        '<div class="tour-bubble__bar tour-bubble__bar--finale">' +
          '<button type="button" class="tour-btn"                 data-tour-replay>↻ Replay</button>' +
          '<a      type="button" class="tour-btn"                 data-tour-email href="mailto:turayalemmuel@gmail.com">✉ Email</a>' +
          '<a      type="button" class="tour-btn tour-btn--primary" data-tour-book  href="https://cal.com/lemmuel-turaya/intro" target="_blank" rel="noopener">☎ Book a 15-min call →</a>' +
          '<button type="button" class="tour-btn tour-btn--ghost" data-tour-close>Close</button>' +
        '</div>' +
        '<div class="tour-bubble__progress"><span style="width:100%"></span></div>';
      bubble.querySelector('[data-tour-replay]').addEventListener('click', function () {
        clearTimer(); if (finaleTimer) { clearTimeout(finaleTimer); finaleTimer = null; }
        renderStepUI(); paused = false; goto(0);
      });
      bubble.querySelector('[data-tour-close]').addEventListener('click', stop);
      // Email/book links: user clicks naturally close the bubble after action
      ['[data-tour-email]', '[data-tour-book]'].forEach(function (sel) {
        bubble.querySelector(sel).addEventListener('click', function () {
          // Give the link a tick to navigate, then dismiss
          setTimeout(stop, 300);
        });
      });
      if (finaleTimer) clearTimeout(finaleTimer);
      finaleTimer = setTimeout(stop, 18000);
    }

    function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }
    function scheduleNext() {
      clearTimer();
      if (paused) return;
      timer = setTimeout(function () { goto(idx + 1); }, STEP_MS);
    }
    function clearHighlights() {
      document.querySelectorAll('.tour-target').forEach(function (el) {
        el.classList.remove('tour-target');
      });
    }
    function setProgress() {
      var p = bubble.querySelector('[data-tour-progress]');
      if (p) p.style.width = ((idx + 1) / STEPS.length * 100).toFixed(1) + '%';
    }

    function goto(next) {
      if (next < 0) next = 0;
      if (next >= STEPS.length) { complete(); return; }
      idx = next;
      var step = STEPS[idx];
      var target = document.getElementById(step.id);
      clearHighlights();
      if (target) {
        target.classList.add('tour-target');
        target.scrollIntoView({ behavior: prefersReducedLocal ? 'auto' : 'smooth', block: 'start' });
      }
      bubble.querySelector('[data-tour-title]').textContent   = step.title;
      bubble.querySelector('[data-tour-step]').textContent    = (idx + 1) + ' / ' + STEPS.length;
      bubble.querySelector('[data-tour-caption]').innerHTML   = step.caption;
      setProgress();
      scheduleNext();
    }

    function complete() {
      clearTimer();
      clearHighlights();
      renderFinaleUI();
    }

    function start() {
      if (bubble && bubble.classList.contains('is-open')) return;
      ensureBubble();
      renderStepUI();
      bubble.classList.add('is-open');
      document.body.classList.add('tour-active');
      paused = false;
      goto(0);
    }
    function stop() {
      clearTimer();
      if (finaleTimer) { clearTimeout(finaleTimer); finaleTimer = null; }
      clearHighlights();
      if (bubble) bubble.classList.remove('is-open');
      document.body.classList.remove('tour-active');
    }

    document.addEventListener('keydown', function (e) {
      if (!bubble || !bubble.classList.contains('is-open')) return;
      if (e.key === 'Escape')          { e.preventDefault(); stop(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goto(idx + 1); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); goto(idx - 1); }
    });

    window.PortfolioTour = { start: start, stop: stop };
  })();

  /* ---------- Orbital 3D case-study selector ----------
   * Full-screen 3D ring of the 8 case studies, drag to rotate, ←→ to snap to
   * the next card, Enter to dive in, ESC to close. Triggered from a palette
   * command. Vanilla CSS 3D — no Three.js. Reduced-motion degrades to a
   * flat row layout (the keyframe animation is suppressed but the static
   * positioning still works).
   * ------------------------------------------------------------------------- */
  (function orbital3d() {
    var CARDS = [
      { slug: 'ai-engineer', title: 'Autonomous AI Engineer',      meta: 'Multi-LLM · Laravel' },
      { slug: 'wms-v2',      title: 'WMS v2 Inventory Rewrite',    meta: 'Vue 3 · Laravel 12' },
      { slug: 'hris',        title: 'Enterprise HRIS',             meta: 'Vue 3 · TypeScript' },
      { slug: 'tms',         title: 'Transport Management System', meta: 'Live GPS · Dispatch' },
      { slug: 'pamanaland',  title: 'Pamanaland Realty Portal',    meta: 'Real estate · CASL' },
      { slug: 'jbc',         title: 'JBC Commission System',       meta: '22 months in prod' },
      { slug: 'wms',         title: 'WMS Mobile App',              meta: 'Flutter · BT printing' },
      { slug: 'llm-wiki',    title: 'LLM-Friendly Wiki',           meta: 'Obsidian · Karpathy' }
    ];

    var overlay = null;
    var ring    = null;
    var rot     = 0;
    var targetRot = 0;
    var focusedIdx = -1;
    var rafId   = null;
    var drag    = null;
    var perDeg  = 360 / CARDS.length;

    // Starfield state — populated lazily in build()
    var starCanvas = null;
    var starCtx    = null;
    var stars      = [];
    var starW      = 0;
    var starH      = 0;
    var starSpeed  = 0.0015;  // baseline z-velocity per frame
    var starWarp   = 0;       // additive warp speed during drag (eases back to 0)
    var lastRotForStars = 0;  // tracks rotation delta → side-drift for stars

    function spawnStar(z) {
      // Stars distributed in a wide cone around the camera; (x,y) are NDC-ish
      // multiplied by a large factor so they fly off-screen as z→0.
      return {
        x: (Math.random() - 0.5) * 2.6,
        y: (Math.random() - 0.5) * 2.6,
        z: typeof z === 'number' ? z : Math.random(),
        c: Math.random() < 0.18 ? 'cyan' : (Math.random() < 0.5 ? 'white' : 'soft')
      };
    }

    function initStars() {
      stars = [];
      var n = window.innerWidth < 700 ? 220 : 480;
      for (var i = 0; i < n; i++) stars.push(spawnStar(Math.random()));
    }

    function sizeStarCanvas() {
      if (!starCanvas) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      starW = starCanvas.clientWidth  = window.innerWidth;
      starH = starCanvas.clientHeight = window.innerHeight;
      starCanvas.width  = Math.floor(starW * dpr);
      starCanvas.height = Math.floor(starH * dpr);
      if (starCtx) starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function renderStars() {
      if (!starCtx || prefersReduced) return;
      starCtx.clearRect(0, 0, starW, starH);
      var cx = starW * 0.5;
      var cy = starH * 0.5;
      // Convert ring rotation delta into a horizontal drift so the starfield
      // appears to pan with the user's spin — a small but addictive coupling.
      var drotDeg = rot - lastRotForStars;
      lastRotForStars = rot;
      var drift = drotDeg * 0.6;   // px per frame, signed

      // Ease warp speed back down each frame (decay)
      starWarp *= 0.92;
      if (starWarp < 0.0001) starWarp = 0;

      var dz = starSpeed + starWarp;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.z -= dz;
        if (s.z <= 0.001) { stars[i] = spawnStar(1); continue; }
        // Apply horizontal drift directly (perspective-scaled)
        s.x += drift * 0.0008 / s.z;
        if (s.x >  2.0) s.x -= 4.0;
        if (s.x < -2.0) s.x += 4.0;

        var k = 1 / s.z;
        var sx = cx + s.x * k * cx * 0.7;
        var sy = cy + s.y * k * cy * 0.7;
        if (sx < -20 || sx > starW + 20 || sy < -20 || sy > starH + 20) continue;

        // Size + brightness scale with closeness (1-z); add warp-trail length
        var size  = Math.max(0.4, (1 - s.z) * 2.2);
        var alpha = Math.min(1, (1 - s.z) * 1.3);

        // Color
        var fill;
        if (s.c === 'cyan')      fill = 'rgba(0, 229, 255, ' + (alpha * 0.95) + ')';
        else if (s.c === 'soft') fill = 'rgba(180, 210, 255, ' + (alpha * 0.7) + ')';
        else                     fill = 'rgba(255, 255, 255, ' + alpha + ')';

        if (starWarp > 0.002) {
          // Streak: draw a short line from prev (deeper) position
          var prevK  = 1 / (s.z + dz);
          var prevSx = cx + s.x * prevK * cx * 0.7;
          var prevSy = cy + s.y * prevK * cy * 0.7;
          starCtx.strokeStyle = fill;
          starCtx.lineWidth = size;
          starCtx.beginPath();
          starCtx.moveTo(prevSx, prevSy);
          starCtx.lineTo(sx, sy);
          starCtx.stroke();
        } else {
          starCtx.fillStyle = fill;
          starCtx.beginPath();
          starCtx.arc(sx, sy, size, 0, Math.PI * 2);
          starCtx.fill();
        }
      }
    }

    function build() {
      overlay = document.createElement('div');
      overlay.className = 'orbital3d-overlay';
      overlay.hidden = true;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Case studies in 3D');

      var cardsHtml = CARDS.map(function (c, i) {
        return '<a class="orbital3d-card" data-cs="' + c.slug + '" href="case-studies/' + c.slug + '.html" style="--i: ' + i + ';" aria-label="' + c.title + '">' +
          '<img class="orbital3d-card__img" src="images/og-' + c.slug + '.png" alt="" loading="lazy" decoding="async">' +
          '<div class="orbital3d-card__inner">' +
            '<div class="orbital3d-card__title">' + c.title + '</div>' +
            '<div class="orbital3d-card__meta">' + c.meta + '</div>' +
          '</div>' +
        '</a>';
      }).join('');

      overlay.innerHTML =
        '<button type="button" class="orbital3d-close" aria-label="Close 3D view">[ ESC ]</button>' +
        '<canvas class="orbital3d-starfield" aria-hidden="true"></canvas>' +
        '<div class="orbital3d-nebula" aria-hidden="true">' +
          '<span class="orbital3d-nebula__cloud orbital3d-nebula__cloud--a"></span>' +
          '<span class="orbital3d-nebula__cloud orbital3d-nebula__cloud--b"></span>' +
          '<span class="orbital3d-nebula__cloud orbital3d-nebula__cloud--c"></span>' +
        '</div>' +
        '<div class="orbital3d-grid" aria-hidden="true"></div>' +
        '<div class="orbital3d-horizon" aria-hidden="true"></div>' +
        '<div class="orbital3d-stage">' +
          '<div class="orbital3d-ring" style="--total: ' + CARDS.length + '; --rot: 0deg;">' + cardsHtml + '</div>' +
        '</div>' +
        '<div class="orbital3d-hud">' +
          '<span class="orbital3d-hud__title" data-orb-title>Case Studies · spin to explore</span>' +
          '<span class="orbital3d-hud__hint">drag · <kbd>←</kbd><kbd>→</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close</span>' +
        '</div>';

      document.body.appendChild(overlay);
      ring = overlay.querySelector('.orbital3d-ring');

      // Starfield canvas — context lazily created here, sized on open()
      starCanvas = overlay.querySelector('.orbital3d-starfield');
      if (starCanvas) {
        starCtx = starCanvas.getContext('2d');
        starCtx.lineCap = 'round';
      }

      var stage = overlay.querySelector('.orbital3d-stage');
      stage.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.orbital3d-card')) return;  // let card clicks through
        drag = { startX: e.clientX, startRot: targetRot, prevX: e.clientX };
        starWarp = Math.max(starWarp, 0.012);  // initial warp kick
        try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      });
      stage.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var dx = e.clientX - drag.startX;
        targetRot = drag.startRot - dx * 0.5;
        // Continuous warp: speed proportional to drag velocity
        var vx = Math.abs(e.clientX - drag.prevX);
        drag.prevX = e.clientX;
        starWarp = Math.min(0.05, Math.max(starWarp, vx * 0.0015));
      });
      var endDrag = function () {
        if (!drag) return;
        drag = null;
        // Snap to nearest card
        targetRot = Math.round(targetRot / perDeg) * perDeg;
        focusedIdx = ((-Math.round(targetRot / perDeg)) % CARDS.length + CARDS.length) % CARDS.length;
        updateHud();
      };
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);

      // Card clicks: first click snaps + focuses, second click on the focused
      // card navigates. Avoids accidental dives during exploration.
      overlay.querySelectorAll('.orbital3d-card').forEach(function (a, i) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          if (focusedIdx === i) { window.location.href = a.getAttribute('href'); return; }
          targetRot = -i * perDeg;
          focusedIdx = i;
          updateHud();
        });
      });

      overlay.querySelector('.orbital3d-close').addEventListener('click', close);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    }

    function updateHud() {
      if (!overlay) return;
      var t = overlay.querySelector('[data-orb-title]');
      if (t && focusedIdx >= 0) t.textContent = CARDS[focusedIdx].title + ' · ' + CARDS[focusedIdx].meta;
    }

    function animate() {
      if (!overlay || overlay.hidden) { rafId = null; return; }
      // Idle auto-drift so the ring breathes when the user isn't interacting
      if (!drag && focusedIdx < 0) targetRot -= 0.08;
      // Spring-ease toward target
      rot += (targetRot - rot) * 0.12;
      if (ring) ring.style.setProperty('--rot', rot.toFixed(3) + 'deg');
      // Mark front-facing card so CSS can highlight it
      var frontIdx = ((-Math.round(rot / perDeg)) % CARDS.length + CARDS.length) % CARDS.length;
      overlay.querySelectorAll('.orbital3d-card').forEach(function (c, i) {
        c.classList.toggle('is-front', i === frontIdx);
      });
      renderStars();
      rafId = requestAnimationFrame(animate);
    }

    var resizeHandler = function () { sizeStarCanvas(); };
    var lastFocus = null;

    function open() {
      if (!overlay) build();
      lastFocus = document.activeElement;
      overlay.hidden = false;
      document.body.classList.add('orbital3d-active');
      focusedIdx = -1;
      updateHud();
      if (!prefersReduced) {
        sizeStarCanvas();
        if (!stars.length) initStars();
        window.addEventListener('resize', resizeHandler);
      }
      if (!rafId) rafId = requestAnimationFrame(animate);
      // Move focus into the modal so keyboard users can ESC / arrow-nav
      var closeBtn = overlay.querySelector('.orbital3d-close');
      setTimeout(function () { if (closeBtn) closeBtn.focus(); }, 50);
    }
    function close() {
      if (overlay) overlay.hidden = true;
      document.body.classList.remove('orbital3d-active');
      window.removeEventListener('resize', resizeHandler);
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      // Return focus to whatever launched the orbital (typically the palette)
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
        lastFocus = null;
      }
    }

    document.addEventListener('keydown', function (e) {
      if (!overlay || overlay.hidden) return;
      if (e.key === 'Escape')          { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') {
        e.preventDefault();
        focusedIdx = (focusedIdx < 0 ? 0 : focusedIdx + 1) % CARDS.length;
        targetRot = -focusedIdx * perDeg; starWarp = Math.max(starWarp, 0.022); updateHud();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        focusedIdx = (focusedIdx < 0 ? CARDS.length - 1 : focusedIdx - 1 + CARDS.length) % CARDS.length;
        targetRot = -focusedIdx * perDeg; starWarp = Math.max(starWarp, 0.022); updateHud();
      } else if (e.key === 'Enter' && focusedIdx >= 0) {
        e.preventDefault();
        window.location.href = 'case-studies/' + CARDS[focusedIdx].slug + '.html';
      }
    });

    window.PortfolioOrbital = { open: open, close: close };
  })();

  /* -------------------------------------------------------------------------
   * 3D Card Tilt — magnetic pointer-follow tilt on every card-like element.
   * Applies rotateX/Y based on cursor offset from the card center; eases
   * smoothly back to neutral when the pointer leaves. Sets a CSS variable
   * --tilt-glow so the inner glow can follow the cursor too. Skipped under
   * prefers-reduced-motion and on touch-only devices to avoid jittery tilts
   * on cards the user is trying to scroll past.
   * ------------------------------------------------------------------------- */
  (function cardTilt3d() {
    if (prefersReduced) return;
    var isTouchOnly = window.matchMedia && window.matchMedia('(hover: none)').matches;
    if (isTouchOnly) return;

    var SEL = '.exp-card, .proj-card, .svc-card, .skill-card, .px-card, .cta-card, .code-card, .about-panel';
    var MAX_TILT = 8;   // degrees
    var LIFT     = 6;   // translateZ on hover (px)

    document.querySelectorAll(SEL).forEach(function (el) {
      el.classList.add('tilt3d');
      var raf = 0;
      var lastX = 0, lastY = 0;

      function apply() {
        raf = 0;
        var r = el.getBoundingClientRect();
        var px = (lastX - r.left) / r.width;     // 0..1
        var py = (lastY - r.top)  / r.height;
        var rx = (0.5 - py) * MAX_TILT * 2;       // top→tilt back, bottom→tilt forward
        var ry = (px - 0.5) * MAX_TILT * 2;       // left→tilt left, right→tilt right
        el.style.setProperty('--tilt-rx', rx.toFixed(2) + 'deg');
        el.style.setProperty('--tilt-ry', ry.toFixed(2) + 'deg');
        el.style.setProperty('--tilt-z',  LIFT + 'px');
        el.style.setProperty('--tilt-gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--tilt-gy', (py * 100).toFixed(1) + '%');
      }
      el.addEventListener('pointermove', function (e) {
        lastX = e.clientX; lastY = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        el.style.setProperty('--tilt-rx', '0deg');
        el.style.setProperty('--tilt-ry', '0deg');
        el.style.setProperty('--tilt-z',  '0px');
      });
    });
  })();

  /* -------------------------------------------------------------------------
   * Hero Parallax — multi-layer pointer-driven depth in the hero. Each
   * layer reads its own CSS variable --depth (set via JS), so the magnitude
   * of motion is controlled by layer. The avatar moves least (deepest), the
   * stats float in the middle, and the CTA buttons feel like they're closest
   * to the camera. Also hooks into scroll position for a subtle Y parallax.
   * ------------------------------------------------------------------------- */
  (function heroParallax3d() {
    if (prefersReduced) return;
    var hero = document.getElementById('fh5co-header');
    if (!hero) return;

    // Layer definitions: selector + depth (px of motion per 100px of pointer offset)
    var layers = [
      { sel: '.profile-thumb',     depth: 14 },
      { sel: '.terminal-tag',      depth: 8  },
      { sel: 'h1',                 depth: 18 },
      { sel: 'h2',                 depth: 12 },
      { sel: '.hero-status',       depth: 9  },
      { sel: '.tech-stack-strip',  depth: 6  },
      { sel: '.hero-stats',        depth: 22 },
      { sel: '.hero-cta',          depth: 26 },
      { sel: '.fh5co-social-icons', depth: 16 }
    ];
    var nodes = [];
    layers.forEach(function (L) {
      var el = hero.querySelector(L.sel);
      if (el) {
        el.classList.add('hero-parallax-layer');
        nodes.push({ el: el, depth: L.depth });
      }
    });
    if (!nodes.length) return;

    var targetX = 0, targetY = 0;
    var curX = 0, curY = 0;
    var raf = 0;

    function tick() {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      nodes.forEach(function (n) {
        var dx = (curX * n.depth).toFixed(2);
        var dy = (curY * n.depth).toFixed(2);
        n.el.style.transform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0)';
      });
      // Continue easing until close enough to target
      if (Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      // Map pointer to -0.5..+0.5 around hero center
      targetX = ((e.clientX - r.left) / r.width  - 0.5);
      targetY = ((e.clientY - r.top)  / r.height - 0.5);
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener('pointerleave', function () {
      targetX = 0; targetY = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  })();

  /* -------------------------------------------------------------------------
   * Scroll-Reveal 3D — IntersectionObserver-driven 3D entry animation for
   * sections coming into view. Adds .reveal3d-in when ≥18% of the target is
   * visible. CSS handles the transform/opacity animation (translateZ from
   * -180px → 0, rotateX from -10deg → 0). Once revealed, the observer stops
   * watching that element. Skipped under prefers-reduced-motion.
   * ------------------------------------------------------------------------- */
  (function scrollReveal3d() {
    if (prefersReduced) return;
    if (!('IntersectionObserver' in window)) return;

    var TARGETS = [
      '#fh5co-about .about-panel',
      '#fh5co-resume .exp-card',
      '#fh5co-features .svc-card',
      '#fh5co-skills .skill-card',
      '#fh5co-work .proj-card',
      '#fh5co-blog .case-studies',
      '#fh5co-started .cta-card',
      'section > .container > .row > .col-md-12 > .heading',
      'section .section-heading'
    ].join(', ');

    var nodes = document.querySelectorAll(TARGETS);
    if (!nodes.length) return;

    nodes.forEach(function (n, i) {
      n.classList.add('reveal3d');
      // Stagger siblings so a grid of cards waterfalls in rather than
      // popping in unison. Cap the stagger so very-long lists don't have
      // visible final-element lag.
      var idx = Array.prototype.indexOf.call(n.parentNode.children, n);
      n.style.setProperty('--reveal-delay', Math.min(idx, 5) * 70 + 'ms');
    });

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (ent) {
        if (ent.isIntersecting) {
          ent.target.classList.add('reveal3d-in');
          obs.unobserve(ent.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    nodes.forEach(function (n) { obs.observe(n); });
  })();

  /* -------------------------------------------------------------------------
   * 3D Section Headings — bigger, more theatrical reveal than the card
   * reveal: heading rotates in from rotateY(-30deg) translateZ(-200px) with
   * a slight overshoot via --ez-back. One observer per heading; unobserve
   * after firing.
   * ------------------------------------------------------------------------- */
  (function heading3d() {
    if (prefersReduced) return;
    if (!('IntersectionObserver' in window)) return;

    // Pick the first <h2> inside each major section.
    var SECTION_IDS = ['fh5co-about', 'fh5co-resume', 'fh5co-features',
                       'fh5co-skills', 'fh5co-work', 'fh5co-blog', 'fh5co-started'];
    var headings = [];
    SECTION_IDS.forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec) return;
      var h = sec.querySelector('h2, h3.heading-section, .section-heading');
      if (h) headings.push(h);
    });
    if (!headings.length) return;

    headings.forEach(function (h) { h.classList.add('heading3d'); });

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (ent) {
        if (ent.isIntersecting) {
          ent.target.classList.add('heading3d-in');
          obs.unobserve(ent.target);
        }
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });

    headings.forEach(function (h) { obs.observe(h); });
  })();

  /* -------------------------------------------------------------------------
   * Page Dive — when navigating to a case-study (or any in-portfolio link
   * we choose to intercept), animate the dive-out before navigation. The
   * receiving page reads sessionStorage on load and runs the dive-in
   * animation. Cmd/Ctrl-click and middle-click bypass the dive so opening
   * in a new tab is unaffected.
   * ------------------------------------------------------------------------- */
  (function pageDive() {
    if (prefersReduced) return;

    // 1) Outgoing: intercept case-study link clicks
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      // Modifier keys or non-primary button → let the browser handle it
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      if (a.target && a.target !== '_self') return;

      var href = a.getAttribute('href');
      if (!href || href[0] === '#') return;       // anchor links skip
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;

      // Only intercept same-origin case-study links
      var isCaseStudy = href.indexOf('case-studies/') !== -1 ||
                        href.indexOf('/case-studies/') !== -1;
      if (!isCaseStudy) return;

      try {
        var url = new URL(a.href, window.location.href);
        if (url.origin !== window.location.origin) return;
      } catch (_) { return; }

      e.preventDefault();

      // Flash overlay covers the discontinuity
      var flash = document.createElement('div');
      flash.className = 'page-dive-flash';
      document.body.appendChild(flash);

      document.body.classList.add('page-dive-out');
      try { sessionStorage.setItem('pf-dive', '1'); } catch (_) {}

      // Navigate after the animation has visually completed (~1.0s)
      setTimeout(function () { window.location.href = a.href; }, 720);
    }, true);

    // 2) Incoming: if we arrived via a dive, play the dive-in animation
    try {
      if (sessionStorage.getItem('pf-dive') === '1') {
        sessionStorage.removeItem('pf-dive');
        // Wait one frame so the class actually triggers an animation
        document.body.classList.add('page-dive-in');
        // Remove the class after the animation completes so it doesn't
        // affect subsequent page interactions.
        setTimeout(function () {
          document.body.classList.remove('page-dive-in');
        }, 1200);
      }
    } catch (_) {}

    // 3) bfcache safety: when iOS Safari / Firefox restore from
    //    back-forward cache, the body may still wear a stale
    //    .page-dive-out class (with pointer-events: none locking the page).
    //    Clear all dive state on pageshow so the restored page is usable.
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) {
        document.body.classList.remove('page-dive-out', 'page-dive-in');
        document.querySelectorAll('.page-dive-flash').forEach(function (n) {
          n.parentNode && n.parentNode.removeChild(n);
        });
        try { sessionStorage.removeItem('pf-dive'); } catch (_) {}
      }
    });
  })();

  /* -------------------------------------------------------------------------
   * Cursor Spotlight — a global, viewport-anchored radial-gradient that
   * tracks the cursor across every page. Lives as a fixed pseudo-element on
   * <body> with mix-blend-mode: screen so it adds light to elements rather
   * than washing them out. Makes the whole portfolio feel like one
   * continuous lit space rather than disconnected dark cards.
   * ------------------------------------------------------------------------- */
  // cursorSpotlight: lightweight bootstrap. The actual position updates
  // are merged into customCursor() below so we have a single
  // pointermove listener + single RAF feeding both the dot/ring AND the
  // spotlight CSS variables. Cuts the always-on pointer infra in half.
  (function cursorSpotlightBootstrap() {
    if (prefersReduced) return;
    var isTouchOnly = window.matchMedia && window.matchMedia('(hover: none)').matches;
    if (isTouchOnly) return;
    document.documentElement.classList.add('has-spotlight');
    document.documentElement.style.setProperty('--spot-x', '50vw');
    document.documentElement.style.setProperty('--spot-y', '50vh');
  })();

  /* -------------------------------------------------------------------------
   * Siderail 3D Depth — the existing right-rail dot navigator now has real
   * depth: the active dot pops forward via translateZ, its immediate
   * neighbors lift slightly less, and far-away dots recede. The whole rail
   * also subtly tilts toward the cursor when hovered. JS just adds the
   * .is-near class to the 2 nearest-to-active dots; CSS handles the
   * transforms.
   * ------------------------------------------------------------------------- */
  (function siderail3d() {
    if (prefersReduced) return;
    // The siderail IIFE below builds the DOM, so we wait one tick.
    setTimeout(function () {
      var rail = document.querySelector('.siderail');
      if (!rail) return;
      rail.classList.add('siderail--3d');

      var items = rail.querySelectorAll('.siderail__item');

      function updateNear() {
        var activeIdx = -1;
        items.forEach(function (it, i) {
          if (it.classList.contains('is-active')) activeIdx = i;
        });
        items.forEach(function (it, i) {
          var d = Math.abs(i - activeIdx);
          it.classList.toggle('is-near-1', d === 1);
          it.classList.toggle('is-near-2', d === 2);
        });
      }

      // Watch for is-active changes on each item (siderail IIFE toggles it
      // on scroll). MutationObserver is the cleanest way without rewriting
      // the existing siderail.
      var mo = new MutationObserver(updateNear);
      items.forEach(function (it) {
        mo.observe(it, { attributes: true, attributeFilter: ['class'] });
      });
      updateNear();
    }, 50);
  })();

  /* -------------------------------------------------------------------------
   * Section Parallax Depth — as you scroll through each section, the
   * section's <h2> heading gets a small translateZ proportional to how
   * deep you are within that section. Subtle but pervasive — creates a
   * spatial sense of "moving past" a heading rather than just scrolling.
   * ------------------------------------------------------------------------- */
  (function sectionParallax3d() {
    if (prefersReduced) return;

    var SECTION_IDS = ['fh5co-about', 'fh5co-resume', 'fh5co-features',
                       'fh5co-skills', 'fh5co-work', 'fh5co-blog', 'fh5co-started'];
    var entries = [];
    SECTION_IDS.forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec) return;
      var h = sec.querySelector('h2, h3.heading-section, .section-heading');
      if (!h) return;
      h.classList.add('section-parallax');
      entries.push({ section: sec, heading: h });
    });
    if (!entries.length) return;

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      entries.forEach(function (e) {
        var r = e.section.getBoundingClientRect();
        // Progress through the section: 0 = section just entered viewport
        // bottom, 1 = section about to leave viewport top
        var progress = 1 - (r.bottom / (r.height + vh));
        progress = Math.max(0, Math.min(1, progress));
        // Map 0..1 → translateZ from +20 (when entering) to -40 (leaving)
        var z = 20 - progress * 60;
        // Map 0..1 → rotateX from +6deg to -6deg
        var rx = 6 - progress * 12;
        e.heading.style.setProperty('--sp-z',  z.toFixed(1) + 'px');
        e.heading.style.setProperty('--sp-rx', rx.toFixed(2) + 'deg');
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* -------------------------------------------------------------------------
   * Custom Cursor — dot + ring follower. The dot snaps to the actual
   * pointer; the ring lags via spring easing. Both scale when over
   * interactive elements (a, button, [role=button], inputs). Pairs with the
   * global spotlight (cursorSpotlight) — together they make the cursor feel
   * like a physical light source rather than an OS arrow. Skipped on touch
   * and reduced-motion.
   * ------------------------------------------------------------------------- */
  (function customCursor() {
    if (prefersReduced) return;
    var isTouchOnly = window.matchMedia && window.matchMedia('(hover: none)').matches;
    if (isTouchOnly) return;

    var dot  = document.createElement('div');
    var ring = document.createElement('div');
    dot.className  = 'cursor-dot';
    ring.className = 'cursor-ring';
    dot.setAttribute('aria-hidden', 'true');
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    document.documentElement.classList.add('has-custom-cursor');

    var dx = window.innerWidth * 0.5, dy = window.innerHeight * 0.5;
    var rx = dx, ry = dy;
    var raf = 0;

    var root = document.documentElement;

    function tick() {
      // Spring-ease the ring toward the dot. Higher factor = snappier ring.
      rx += (dx - rx) * 0.38;
      ry += (dy - ry) * 0.38;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%, -50%)';
      // Spotlight follows the ring's eased position — single RAF drives
      // both. No separate spotlight tick required.
      root.style.setProperty('--spot-x', rx.toFixed(1) + 'px');
      root.style.setProperty('--spot-y', ry.toFixed(1) + 'px');
      if (Math.abs(dx - rx) > 0.4 || Math.abs(dy - ry) > 0.4) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    }

    window.addEventListener('pointermove', function (e) {
      dx = e.clientX; dy = e.clientY;
      // Dot snaps to the pointer immediately — no waiting for the next RAF
      // tick. Removes the 1-frame (up to 16ms) lag that made the cursor
      // feel sluggish.
      dot.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0) translate(-50%, -50%)';
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    // Scale up over interactive elements
    var HOVER_SEL = 'a, button, [role="button"], input, textarea, select, .cmdk__row, .siderail__item, .orbital3d-card, .tilt3d, .cs-tilt3d';
    document.addEventListener('pointerover', function (e) {
      if (e.target.closest && e.target.closest(HOVER_SEL)) {
        document.documentElement.classList.add('cursor-over-link');
      }
    });
    document.addEventListener('pointerout', function (e) {
      if (e.target.closest && e.target.closest(HOVER_SEL)) {
        // Only clear if we're not entering another hover target
        var rel = e.relatedTarget;
        if (!rel || !(rel.closest && rel.closest(HOVER_SEL))) {
          document.documentElement.classList.remove('cursor-over-link');
        }
      }
    });
    // On pointerdown, briefly contract the ring
    window.addEventListener('pointerdown', function () {
      document.documentElement.classList.add('cursor-down');
    });
    window.addEventListener('pointerup', function () {
      document.documentElement.classList.remove('cursor-down');
    });
    // Hide when leaving the window
    document.addEventListener('mouseleave', function () {
      document.documentElement.classList.add('cursor-out');
    });
    document.addEventListener('mouseenter', function () {
      document.documentElement.classList.remove('cursor-out');
    });
  })();

  /* -------------------------------------------------------------------------
   * Glitch Text — RGB-split + character scramble on hover and ambient
   * intervals. CSS handles the chromatic-aberration text-shadow (cyan +
   * magenta). JS adds momentary scramble on the hero h1 + section h2's
   * every 8-14s and on hover.
   * ------------------------------------------------------------------------- */
  (function glitchText() {
    if (prefersReduced) return;

    var GLYPHS = '!@#$%^&*<>?/\\|+=~01';
    function scramble(el, originalText, duration) {
      var len = originalText.length;
      var startTime = performance.now();
      function frame(now) {
        var t = (now - startTime) / duration;
        if (t >= 1) { el.textContent = originalText; return; }
        // Scramble first ~30% of characters with random glyphs, decreasing
        // over time
        var newText = '';
        for (var i = 0; i < len; i++) {
          var ch = originalText.charAt(i);
          if (ch === ' ') { newText += ' '; continue; }
          if (Math.random() < (1 - t) * 0.35) {
            newText += GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
          } else {
            newText += ch;
          }
        }
        el.textContent = newText;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    // Target: hero name (first h1 span) + section h2's
    var targets = [];
    var heroH1 = document.querySelector('#fh5co-header h1 span');
    if (heroH1) targets.push(heroH1);
    document.querySelectorAll('#fh5co-about h2, #fh5co-resume h2, #fh5co-features h2, #fh5co-skills h2, #fh5co-work h2, #fh5co-blog h2, #fh5co-started h2').forEach(function (h) {
      // Use a wrapping span so the glitch class can scope without
      // disturbing nested anchors/elements
      targets.push(h);
    });
    if (!targets.length) return;

    targets.forEach(function (t) {
      var originalText = t.textContent;
      t.dataset.glitchOriginal = originalText;
      t.classList.add('glitch-text');

      // Hover trigger
      t.addEventListener('pointerenter', function () {
        t.classList.add('glitch-text--active');
        scramble(t, originalText, 380);
        setTimeout(function () {
          t.classList.remove('glitch-text--active');
        }, 420);
      });
    });

    // One-shot intro glitch on page load (hero only)
    if (heroH1) {
      setTimeout(function () {
        heroH1.classList.add('glitch-text--active');
        scramble(heroH1, heroH1.dataset.glitchOriginal, 700);
        setTimeout(function () { heroH1.classList.remove('glitch-text--active'); }, 750);
      }, 600);
    }

    // Ambient glitch: pick a random target every 8-14s, but only if it's
    // currently visible — skip targets that scroll out of view.
    function ambientPulse() {
      var visible = targets.filter(function (t) {
        var r = t.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      if (visible.length) {
        var t = visible[(Math.random() * visible.length) | 0];
        t.classList.add('glitch-text--active');
        scramble(t, t.dataset.glitchOriginal, 320);
        setTimeout(function () { t.classList.remove('glitch-text--active'); }, 360);
      }
      setTimeout(ambientPulse, 8000 + Math.random() * 6000);
    }
    setTimeout(ambientPulse, 6000);
  })();

  /* -------------------------------------------------------------------------
   * Marquee Tech-Stack Ticker — a continuous-loop horizontal scroller
   * injected between the hero and the about section. Lists the user's full
   * tech-stack repertoire as a self-repeating band. CSS @keyframes handles
   * the motion; we duplicate the content so the loop is seamless.
   * ------------------------------------------------------------------------- */
  (function marqueeTechTicker() {
    var hero = document.getElementById('fh5co-header');
    var about = document.getElementById('fh5co-about');
    if (!hero || !about) return;
    // Don't double-inject if a previous run already placed it
    if (document.querySelector('.tech-marquee')) return;

    var TECH = [
      'Vue 3', 'Laravel 12', 'TypeScript', 'Flutter', 'Tailwind',
      'PHP 8', 'MySQL', 'Node.js', 'Inertia.js', 'Pinia',
      'Claude', 'Gemini', 'OpenAI', 'Karpathy-style', 'Vibe Coding',
      'Docker', 'Git', 'REST', 'WebSockets', 'PWA',
      'Vite', 'Sass', 'CASL', 'Element Plus', 'Capacitor'
    ];

    var marquee = document.createElement('div');
    marquee.className = 'tech-marquee';
    marquee.setAttribute('aria-hidden', 'true');
    // Build TECH-list items (no wrapper); we'll duplicate inside one row so
    // the loop is seamless — animating the row by -50% slides exactly one
    // copy left, and the second copy is identical so there's no visible
    // jump at the boundary.
    function buildItems() {
      return TECH.map(function (t) {
        return '<span class="tech-marquee__item">' + t +
               '<span class="tech-marquee__sep" aria-hidden="true">◇</span></span>';
      }).join('');
    }
    marquee.innerHTML = '<span class="tech-marquee__row">' +
                         buildItems() + buildItems() +
                       '</span>';
    about.parentNode.insertBefore(marquee, about);

    // Pause the marquee animation when it scrolls offscreen. Without this
    // the CSS @keyframes runs continuously, forcing the browser to
    // recomposite the entire compositing tree every frame — which combined
    // with the spotlight's mix-blend-mode was costing real fps even when
    // the marquee itself wasn't visible.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        marquee.classList.toggle('is-paused', !entries[0].isIntersecting);
      }, { threshold: 0 }).observe(marquee);
    }

    // Scroll-velocity boost — when the user scrolls fast, briefly speed up
    // the marquee + tint it brighter. Decays exponentially back to baseline.
    // Caps so a long furious scroll doesn't run at warp speed indefinitely.
    if (!prefersReduced) {
      var row = marquee.querySelector('.tech-marquee__row');
      var baseDuration = 38;       // seconds — must match CSS
      var lastScrollY = window.scrollY;
      var lastTs = performance.now();
      var boost = 0;               // 0..1, decays each frame
      var raf = 0;

      function decay() {
        boost *= 0.92;
        if (boost < 0.01) {
          boost = 0;
          // Reset to CSS baseline
          row.style.animationDuration = '';
          marquee.style.setProperty('--marquee-boost', '0');
          raf = 0;
          return;
        }
        // Lerp duration from base → fast (base/4) based on boost
        var dur = baseDuration * (1 - boost * 0.75);
        row.style.animationDuration = dur.toFixed(2) + 's';
        marquee.style.setProperty('--marquee-boost', boost.toFixed(2));
        raf = requestAnimationFrame(decay);
      }

      window.addEventListener('scroll', function () {
        var now = performance.now();
        var dy = Math.abs(window.scrollY - lastScrollY);
        var dt = Math.max(1, now - lastTs);
        var velocity = dy / dt;     // px/ms
        lastScrollY = window.scrollY;
        lastTs = now;
        // Map ~0..3 px/ms → 0..1 boost. Trackpad fling = ~2 px/ms.
        var b = Math.min(1, velocity / 3);
        if (b > boost) boost = b;
        if (!raf) raf = requestAnimationFrame(decay);
      }, { passive: true });
    }
  })();

  /* -------------------------------------------------------------------------
   * Boot Sequence Overlay — a brief terminal-style boot screen on first
   * visit. Types out "> ./init_developer.sh" then dissolves into the hero.
   * Total duration ~700ms. sessionStorage-gated so it only fires once per
   * session — repeat visits in the same session skip directly to content.
   * Disabled under prefers-reduced-motion and on touch (no time to read on
   * mobile, and many mobile browsers paint over the overlay weirdly).
   * ------------------------------------------------------------------------- */
  (function bootSequence() {
    if (prefersReduced) return;
    var isTouchOnly = window.matchMedia && window.matchMedia('(hover: none)').matches;
    if (isTouchOnly) return;
    try {
      if (sessionStorage.getItem('pf-booted') === '1') return;
      sessionStorage.setItem('pf-booted', '1');
    } catch (_) { /* private mode → still play; harmless */ }

    // If we arrived via a page-dive, skip — the dive itself is the entry.
    try {
      if (sessionStorage.getItem('pf-dive') === '1') return;
    } catch (_) {}

    var overlay = document.createElement('div');
    overlay.className = 'boot-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="boot-overlay__inner">' +
        '<div class="boot-overlay__lines">' +
          '<div class="boot-overlay__line"><span class="boot-overlay__prompt">$</span> <span class="boot-overlay__cmd" data-boot="cmd"></span><span class="boot-overlay__cursor">_</span></div>' +
          '<div class="boot-overlay__line boot-overlay__line--out" data-boot="line1">[ ok ] motion subsystem online</div>' +
          '<div class="boot-overlay__line boot-overlay__line--out" data-boot="line2">[ ok ] spotlight calibrated</div>' +
          '<div class="boot-overlay__line boot-overlay__line--out" data-boot="line3">[ ok ] 8 case studies loaded</div>' +
          '<div class="boot-overlay__line boot-overlay__line--out boot-overlay__line--final" data-boot="ready">→ welcome.</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var cmdEl = overlay.querySelector('[data-boot="cmd"]');
    var CMD = './init_developer.sh';
    var i = 0;
    var dismissed = false;
    var timers = [];

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      timers.forEach(clearTimeout);
      overlay.classList.add('boot-overlay--out');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 220);
    }

    function typeChar() {
      if (dismissed) return;
      if (i <= CMD.length) {
        cmdEl.textContent = CMD.slice(0, i);
        i++;
        timers.push(setTimeout(typeChar, 14));   // was 22
      } else {
        // Reveal status lines with a tight stagger
        ['line1', 'line2', 'line3', 'ready'].forEach(function (k, idx) {
          timers.push(setTimeout(function () {
            var n = overlay.querySelector('[data-boot="' + k + '"]');
            if (n) n.classList.add('is-in');
          }, idx * 30));                          // was 70
        });
        timers.push(setTimeout(dismiss, 180));    // was 380
      }
    }

    // Click anywhere to skip — important on repeat visits where the user
    // already knows the bit and just wants the content.
    overlay.style.pointerEvents = 'auto';
    overlay.addEventListener('click', dismiss);
    document.addEventListener('keydown', function k(e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        document.removeEventListener('keydown', k);
        dismiss();
      }
    }, { once: false });

    // Start typing on next frame so the overlay has time to render
    requestAnimationFrame(function () { timers.push(setTimeout(typeChar, 40)); });
  })();

  /* -------------------------------------------------------------------------
   * Console Signature — when a recruiter (or anyone) opens devtools, they
   * find an ASCII banner + a "let's talk" message. Cheap, runs once on
   * script load. The %c styling makes it look real — same techniques big
   * companies use (Facebook's "STOP! This is a developer feature" warning,
   * Vercel's gradient logo, etc).
   * ------------------------------------------------------------------------- */
  (function consoleSignature() {
    try {
      var titleStyle = [
        'color: #00e5ff',
        'font-size: 18px',
        'font-weight: 700',
        'letter-spacing: 4px',
        'font-family: "JetBrains Mono", monospace',
        'text-shadow: 0 0 10px rgba(0, 229, 255, 0.6)',
        'padding: 8px 0'
      ].join(';');
      var subStyle = [
        'color: #FF9000',
        'font-size: 11px',
        'letter-spacing: 1.5px',
        'font-family: "JetBrains Mono", monospace',
        'padding: 2px 0'
      ].join(';');
      var bodyStyle = [
        'color: rgba(255, 255, 255, 0.7)',
        'font-size: 11px',
        'line-height: 1.6',
        'font-family: "JetBrains Mono", monospace'
      ].join(';');
      var linkStyle = [
        'color: #00e5ff',
        'font-weight: 600',
        'font-size: 11px',
        'font-family: "JetBrains Mono", monospace'
      ].join(';');

      console.log('%cLEMMUEL · TURAYA', titleStyle);
      console.log('%c> full-stack & mobile dev · 8 shipped case studies', subStyle);
      console.log(
        '%c\nYou opened devtools. That means you actually look at code.\n' +
        'The whole site is vanilla JS / CSS — no framework taxes.\n\n' +
        'If you\'re hiring, the case studies are above.\n' +
        'Or jump straight to %ccal.com/lemmuel-turaya/intro%c — 15 min, no slides.',
        bodyStyle, linkStyle, bodyStyle
      );
      console.log(
        '%c\ntry: %cKonami code%c (↑↑↓↓←→←→BA) for developer mode.',
        bodyStyle, linkStyle, bodyStyle
      );
    } catch (_) { /* ancient browser — skip */ }
  })();

  /* -------------------------------------------------------------------------
   * Time-of-Day Greeting — the hero's terminal-tag command appends a flag
   * based on the local hour. Tiny touch, signals the page is reactive to
   * the visitor's context.
   * ------------------------------------------------------------------------- */
  (function timeOfDayGreeting() {
    var slot = document.querySelector('[data-tod-arg]');
    if (!slot) return;
    var h = new Date().getHours();
    var arg;
    if (h >= 5  && h < 12) arg = ' --morning';
    else if (h >= 12 && h < 17) arg = ' --afternoon';
    else if (h >= 17 && h < 22) arg = ' --evening';
    else arg = ' --burning-midnight-oil';
    slot.textContent = arg;
  })();

  /* -------------------------------------------------------------------------
   * Konami Code Easter Egg — ↑↑↓↓←→←→BA unlocks "developer mode": adds
   * .developer-mode-on to <html> (CSS amps the glitch + reveals a hidden
   * HUD line), shows a toast, and persists for the session. A small,
   * earned moment for anyone who tries it.
   * ------------------------------------------------------------------------- */
  (function konamiCode() {
    var SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
               'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    var pos = 0;
    var armed = true;

    // Restore developer mode if already unlocked this session
    try {
      if (sessionStorage.getItem('pf-devmode') === '1') {
        document.documentElement.classList.add('developer-mode-on');
        armed = false;
      }
    } catch (_) {}

    function unlock() {
      if (!armed) return;
      armed = false;
      document.documentElement.classList.add('developer-mode-on');
      try { sessionStorage.setItem('pf-devmode', '1'); } catch (_) {}

      // Toast
      var toast = document.createElement('div');
      toast.className = 'konami-toast';
      toast.setAttribute('role', 'status');
      toast.innerHTML =
        '<div class="konami-toast__title">[ DEVELOPER MODE: ACTIVATED ]</div>' +
        '<div class="konami-toast__body">glitch amplified · hidden HUD line revealed</div>' +
        '<div class="konami-toast__hint">press <kbd>esc</kbd> to dismiss</div>';
      document.body.appendChild(toast);
      requestAnimationFrame(function () { toast.classList.add('is-in'); });
      var dismiss = function () {
        toast.classList.remove('is-in');
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 280);
      };
      setTimeout(dismiss, 4200);
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', escHandler);
          dismiss();
        }
      });

      console.log('%c[ KONAMI OK ]%c developer mode unlocked.',
        'color:#00e5ff;font-weight:600;font-family:"JetBrains Mono",monospace;',
        'color:rgba(255,255,255,0.7);font-family:"JetBrains Mono",monospace;');
    }

    window.addEventListener('keydown', function (e) {
      // Ignore if typing into an input (don't trigger on chat / palette)
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
                t.isContentEditable)) {
        pos = 0; return;
      }
      var expected = SEQ[pos];
      var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === expected) {
        pos++;
        if (pos === SEQ.length) { pos = 0; unlock(); }
      } else {
        pos = (key === SEQ[0]) ? 1 : 0;
      }
    });
  })();

  /* -------------------------------------------------------------------------
   * Scroll-State Class — adds body.is-scrolling during active scroll;
   * removes 150ms after the last scroll event. CSS uses this to pause
   * expensive paint ops (mix-blend-mode spotlight, glitch text-shadow,
   * tilt-card glow pseudos) while the user is scrolling. The spotlight
   * alone is a viewport-sized mix-blend-mode: screen layer — easily
   * 8-12ms of paint per frame on mid-range mobile. Pausing it during
   * scroll = the single biggest frame-rate recovery available.
   * ------------------------------------------------------------------------- */
  (function scrollStateClass() {
    if (prefersReduced) return;
    var root = document.documentElement;       // <html> — ancestor of everything
    var t = 0;
    window.addEventListener('scroll', function () {
      if (t === 0) root.classList.add('is-scrolling');
      else clearTimeout(t);
      t = setTimeout(function () {
        root.classList.remove('is-scrolling');
        t = 0;
      }, 150);
    }, { passive: true });
  })();

  /* -------------------------------------------------------------------------
   * Idle Nudge — after 45s of no input, gently pulse the chat bubble and
   * show a tooltip ("still there? — ask me anything"). Resets on any
   * pointer/key/scroll event. Tech-savvy version of "are you still
   * watching?" — but with a developer's preferred channel: chat.
   * ------------------------------------------------------------------------- */
  (function idleNudge() {
    if (prefersReduced) return;
    var IDLE_MS = 45000;
    var timer = null;
    var nudged = false;

    function findBubble() {
      return document.querySelector('.pchat__bubble, .pchat__fab, [data-pchat-toggle]');
    }

    function nudge() {
      if (nudged) return;
      var bubble = findBubble();
      if (!bubble) return;
      nudged = true;
      bubble.classList.add('is-nudging');

      var tip = document.createElement('div');
      tip.className = 'idle-nudge-tip';
      tip.setAttribute('role', 'status');
      tip.textContent = 'still there? — ask me anything';
      document.body.appendChild(tip);
      requestAnimationFrame(function () { tip.classList.add('is-in'); });

      // Auto-clear after 6s, OR on any activity (handled below)
      var dismissTip = function () {
        tip.classList.remove('is-in');
        setTimeout(function () {
          if (tip.parentNode) tip.parentNode.removeChild(tip);
        }, 280);
      };
      setTimeout(dismissTip, 6000);
    }

    function reset() {
      if (nudged) {
        nudged = false;
        var bubble = findBubble();
        if (bubble) bubble.classList.remove('is-nudging');
        document.querySelectorAll('.idle-nudge-tip').forEach(function (n) {
          n.classList.remove('is-in');
          setTimeout(function () {
            if (n.parentNode) n.parentNode.removeChild(n);
          }, 280);
        });
      }
      clearTimeout(timer);
      timer = setTimeout(nudge, IDLE_MS);
    }

    ['pointermove', 'pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart']
      .forEach(function (ev) {
        window.addEventListener(ev, reset, { passive: true });
      });
    reset();
  })();

  /* -------------------------------------------------------------------------
   * Tab-Away Title — when the visitor switches tabs, the document.title
   * becomes a witty come-back line. Restored when they tab back. Classic
   * tech-savvy detail that signals "this person sweats the small stuff".
   * ------------------------------------------------------------------------- */
  (function tabAwayTitle() {
    var MESSAGES = [
      '👀 come back · still here',
      '⏳ pinged · I\'m waiting',
      '⌘+K when you\'re back',
      '✦ don\'t be a stranger',
      '🪐 still building stuff'
    ];
    var original = document.title;
    var altIdx = (Math.random() * MESSAGES.length) | 0;

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        document.title = MESSAGES[altIdx];
        altIdx = (altIdx + 1) % MESSAGES.length;   // rotate for next time
      } else {
        document.title = original;
      }
    });
  })();

  /* ---------- Side-rail section navigator ---------- */
  (function siderail() {
    var sections = [
      { id: 'fh5co-header',   label: '~/hero' },
      { id: 'fh5co-about',    label: 'about_me' },
      { id: 'fh5co-resume',   label: 'experience' },
      { id: 'fh5co-features', label: 'build' },
      { id: 'fh5co-skills',   label: 'skills' },
      { id: 'fh5co-work',     label: 'projects' },
      { id: 'fh5co-blog',     label: 'case_studies' },
      { id: 'fh5co-started',  label: 'contact' }
    ];
    var nav = document.createElement('nav');
    nav.className = 'siderail';
    nav.setAttribute('aria-label', 'section navigator');
    var items = [];
    sections.forEach(function (s) {
      if (!document.getElementById(s.id)) return;
      var a = document.createElement('a');
      a.className = 'siderail__item';
      a.href = '#' + s.id;
      a.innerHTML = '<span class="siderail__label">' + s.label + '</span><span class="siderail__dot"></span>';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.getElementById(s.id);
        if (t) t.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      });
      nav.appendChild(a);
      items.push({ id: s.id, el: a });
    });
    document.body.appendChild(nav);

    /* Top-nav scroll-spy — piggyback the siderail's update() so we don't
       open a second scroll listener. Map each section id to its top-nav
       anchor (if any) and toggle aria-current="location" in lockstep.
       Sections without a corresponding nav link (hero, case-studies) are
       silently skipped. */
    var topNavLinks = {};
    document.querySelectorAll('.fh5co-nav-links li a[href^="#"]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (h && h.length > 1) topNavLinks[h.slice(1)] = a;
    });

    function update() {
      var mid = (window.scrollY || document.documentElement.scrollTop) + window.innerHeight * 0.35;
      var activeIdx = 0;
      for (var i = 0; i < items.length; i++) {
        var sec = document.getElementById(items[i].id);
        if (sec && sec.offsetTop <= mid) activeIdx = i;
      }
      items.forEach(function (it, i) {
        it.el.classList.toggle('is-active', i === activeIdx);
        var topLink = topNavLinks[it.id];
        if (topLink) {
          if (i === activeIdx) topLink.setAttribute('aria-current', 'location');
          else topLink.removeAttribute('aria-current');
        }
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  /* ---------- Count-up animation for hero stats ---------- */
  (function countUp() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;
    function run(node) {
      if (node._ran) return;
      node._ran = true;
      var target = parseInt(node.getAttribute('data-count'), 10) || 0;
      var suffix = node.getAttribute('data-suffix') || '';
      // Respect reduced-motion: skip the animation, set the final value
      // directly. Motion-sensitive users still see the number, just not
      // the count-up effect.
      if (prefersReduced) {
        node.textContent = target + suffix;
        return;
      }
      var dur = 1200, start = performance.now();
      function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        var v = Math.round(target * eased);
        node.textContent = v + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      nodes.forEach(function (n) { io.observe(n); });
    } else {
      nodes.forEach(run);
    }
  })();

  /* ---------- Tech-stack chips on work tiles ---------- */
  (function workTags() {
    var map = [
      { match: 'deviantart',     tags: ['design', 'vexel'] },
      { match: 'bpc-binan',      tags: ['logo', 'brand'] },
      { match: 'uphdjgt',        tags: ['vue', 'php', 'web'] },
      { match: 'pamanaland',     tags: ['vue', 'laravel', 'mysql'] },
      { match: 'jbcmarketing.com.ph/',     tags: ['wp', 'php', 'web'] },
      { match: 'portal.jbcmarketing',      tags: ['vue', 'laravel', 'api'] },
      { match: 'figma.com',      tags: ['figma', 'ui/ux'] },
      { match: 'kon2raya.netlify',         tags: ['html', 'css', 'js'] }
    ];
    document.querySelectorAll('#fh5co-work .work').forEach(function (tile) {
      var href = tile.getAttribute('href') || '';
      var entry = null;
      for (var i = 0; i < map.length; i++) {
        if (href.indexOf(map[i].match) > -1) { entry = map[i]; break; }
      }
      if (!entry) return;
      var wrap = document.createElement('div');
      wrap.className = 'tech-tags';
      entry.tags.forEach(function (t) {
        var sp = document.createElement('span');
        sp.className = 'tech-tag';
        sp.textContent = t;
        wrap.appendChild(sp);
      });
      tile.appendChild(wrap);
    });
  })();

  /* ---------- Contact form: success + non-Netlify fallback ---------- */
  (function contactForm() {
    var wrap = document.querySelector('.cta-form-wrap');
    var form = wrap && wrap.querySelector('form');

    // Show success state after Netlify's ?sent=1 redirect
    if (window.location.search.indexOf('sent=1') > -1 && wrap) {
      wrap.setAttribute('open', '');
      wrap.classList.add('is-sent');
      // Personalize the success message with the email the user submitted
      // (stashed in sessionStorage on submit; cleared after read).
      try {
        var sentEmail = sessionStorage.getItem('portfolio.contactEmail');
        if (sentEmail) {
          wrap.querySelectorAll('[data-success-email]').forEach(function (el) {
            el.textContent = sentEmail;
          });
          sessionStorage.removeItem('portfolio.contactEmail');
        }
      } catch (_) {}
      setTimeout(function () {
        var t = document.getElementById('fh5co-started');
        if (t) t.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      }, 300);
      if (history.replaceState) {
        history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      }
    }

    if (!form) return;

    // Stash the email value on submit so we can restore it into the success
    // message after Netlify's redirect. Runs in both local + production modes.
    form.addEventListener('submit', function () {
      try {
        var em = form.querySelector('[name="email"]');
        if (em && em.value) sessionStorage.setItem('portfolio.contactEmail', em.value.trim());
      } catch (_) {}
    });

    // Detect whether this is running on Netlify (or a real server that handles forms).
    // On localhost/file:// the native submit would 404, so we intercept and fall back to mailto.
    var host = window.location.hostname || '';
    var isLocal =
      host === '' ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      /^192\.168\./.test(host) ||
      /^10\./.test(host) ||
      window.location.protocol === 'file:';
    if (!isLocal) return; // production / Netlify handles natively

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      // honeypot check
      if (get('bot-field')) return;
      var name = get('name'), email = get('email'), company = get('company'),
          type = get('opportunity_type'), msg = get('message');
      var body =
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n' +
        (company ? 'Company / role: ' + company + '\n' : '') +
        (type ? 'Type: ' + type + '\n' : '') +
        '\n' + msg + '\n';
      var subject = 'Portfolio inquiry' + (type ? ' — ' + type : '');
      var mailto = 'mailto:turayalemmuel@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      techToast('localhost mode · opening your mail client');
      setTimeout(function () { window.location.href = mailto; }, 350);

      // Show a friendly localhost notice once
      if (!form.querySelector('.cta-form__localhost')) {
        var notice = document.createElement('div');
        notice.className = 'cta-form__localhost';
        notice.innerHTML =
          '<strong>Localhost mode</strong> &mdash; this form only sends through Netlify Forms ' +
          'once the site is deployed. For now your message has been pre-filled in your mail client.';
        form.appendChild(notice);
      }
    });
  })();

  /* ---------- Accessibility decorations ---------- */
  (function a11y() {
    var iconMap = {
      'icon-github2':    'GitHub',
      'icon-linkedin2':  'LinkedIn',
      'icon-facebook2':  'Facebook',
      'icon-facebook3':  'Facebook',
      'icon-instagram2': 'Instagram',
      'icon-paintbrush': 'DeviantArt',
      'icon-envelope':   'Email',
      'icon-phone':      'Phone',
      'icon-link':       'Website',
      'icon-location':   'Location',
      'icon-user2':      'Full name',
      'icon-download':   'Download',
      'icon-arrow-up22': 'Back to top',
      'icon-mobile':     'Mobile',
      'icon-suitcase':   'Work experience',
      'icon-graduation-cap': 'Education'
    };
    document.querySelectorAll('a, button').forEach(function (el) {
      // skip if already labeled or has text content
      if (el.getAttribute('aria-label')) return;
      var text = (el.textContent || '').trim();
      if (text.length > 0 && !/^[<>→↓↤⋯\s]+$/.test(text)) return;
      var icon = el.querySelector('[class*="icon-"]');
      if (icon) {
        var cls = icon.className.split(/\s+/).filter(function (c) { return c.indexOf('icon-') === 0; })[0];
        var label = iconMap[cls];
        if (label) el.setAttribute('aria-label', label);
        icon.setAttribute('aria-hidden', 'true');
      }
    });
    // Decorative canvases
    document.querySelectorAll('.matrix-canvas, .particles-canvas').forEach(function (c) {
      c.setAttribute('aria-hidden', 'true');
    });
  })();

  /* ---------- Toast helper (shared) ---------- */
  var techToast = (function () {
    var el = null, timer = null;
    return function (msg) {
      if (!el) {
        el = document.createElement('div');
        el.className = 'tech-toast';
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.classList.add('is-show');
      clearTimeout(timer);
      timer = setTimeout(function () { el.classList.remove('is-show'); }, 1800);
    };
  })();

  /* ---------- Copy buttons (profile.config etc.) ---------- */
  (function copyButtons() {
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy') || '';
        var done = function () {
          var prev = btn.textContent;
          btn.textContent = 'copied';
          btn.classList.add('is-done');
          techToast('copied: ' + text);
          setTimeout(function () {
            btn.textContent = prev;
            btn.classList.remove('is-done');
          }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {});
        } else {
          var ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (_) {}
          document.body.removeChild(ta);
        }
      });
    });
  })();

  /* ---------- Keyboard shortcuts help overlay (?) ---------- */
  (function kbdHelp() {
    var rows = [
      { keys: ['ctrl', 'k'], desc: 'Open command palette' },
      { keys: ['/'],         desc: 'Quick search commands' },
      { keys: ['↑', '↓'],    desc: 'Navigate palette results' },
      { keys: ['tab'],       desc: 'Jump between palette sections' },
      { keys: ['↵'],         desc: 'Open selected result' },
      { keys: ['`'],         desc: 'Toggle dev terminal' },
      { keys: ['alt', 't'],  desc: 'Cycle theme palette (cyber → matrix → sunset → xeno → crt)' },
      { keys: ['?'],         desc: 'Show this help' },
      { keys: ['↑', '↑', '↓', '↓', '←', '→', '←', '→', 'b', 'a'], desc: 'Konami mode (hue cycle)' },
      { keys: ['esc'],       desc: 'Close any overlay' },
      { keys: ['right-click'], desc: 'Dev context menu', mono: true }
    ];
    var overlay = document.createElement('div');
    overlay.className = 'kbdhelp-overlay';
    var html = '<div class="kbdhelp" role="dialog" aria-modal="true">' +
      '<div class="kbdhelp__head"><span>keyboard.shortcuts</span>' +
      '<button class="kbdhelp__close" type="button">[ ESC ]</button></div>' +
      '<div class="kbdhelp__body">';
    rows.forEach(function (r) {
      var keysHtml = r.keys.map(function (k, i) {
        if (r.mono) return '<kbd>' + k + '</kbd>';
        return (i > 0 ? '<span>+</span>' : '') + '<kbd>' + k + '</kbd>';
      }).join('');
      html += '<div class="kbdhelp__row"><span class="kbdhelp__keys">' + keysHtml + '</span><span class="kbdhelp__desc">' + r.desc + '</span></div>';
    });
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    // Track where focus was before opening so we can restore it on close —
    // proper dialog a11y pattern. Without this, keyboard users land at the
    // top of the page after closing the help overlay.
    var lastFocus = null;
    var closeBtn = overlay.querySelector('.kbdhelp__close');
    function open() {
      lastFocus = document.activeElement;
      overlay.classList.add('is-open');
      // Move focus into the dialog so screen readers + keyboard users
      // know they're "in" a modal. Close button is the safe default.
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      overlay.classList.remove('is-open');
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
        lastFocus = null;
      }
    }
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '?') { e.preventDefault(); overlay.classList.contains('is-open') ? close() : open(); }
      else if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  })();

  /* ---------- Case-studies tree filter pills ---------- */
  (function caseFilter() {
    var list = document.querySelector('.case-studies__list');
    var bar = document.querySelector('.case-filters');
    if (!list || !bar) return;
    var items = list.querySelectorAll('[data-cs-tags]');
    if (!items.length) return;

    var counts = { all: items.length };
    items.forEach(function (it) {
      (it.getAttribute('data-cs-tags') || '').split(',').forEach(function (tag) {
        tag = tag.trim();
        if (!tag) return;
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });

    // Display order: all, ai (flagship), web, mobile, docs, design
    var order = ['all', 'ai', 'web', 'mobile', 'docs', 'design'];
    order = order.filter(function (k) { return counts[k]; });

    order.forEach(function (tag, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'case-filter' + (i === 0 ? ' is-active' : '');
      b.setAttribute('data-filter', tag);
      b.innerHTML = tag + '<span class="case-filter__count">' + counts[tag] + '</span>';
      b.addEventListener('click', function () { apply(tag); });
      bar.appendChild(b);
    });

    function apply(tag) {
      bar.querySelectorAll('.case-filter').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-filter') === tag);
      });
      items.forEach(function (it) {
        var tags = (it.getAttribute('data-cs-tags') || '').split(',').map(function (s) { return s.trim(); });
        var show = tag === 'all' || tags.indexOf(tag) > -1;
        it.classList.toggle('is-hidden', !show);
      });
    }
  })();

  /* ---------- Project filter pills ---------- */
  (function workFilter() {
    var grid = document.getElementById('work-grid');
    var bar = document.querySelector('.work-filters');
    if (!grid || !bar) return;
    var tiles = grid.querySelectorAll('[data-tags]');
    var tagCounts = { all: tiles.length };
    tiles.forEach(function (t) {
      (t.getAttribute('data-tags') || '').split(',').forEach(function (tag) {
        tag = tag.trim();
        if (!tag) return;
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    var order = ['all', 'web', 'vue', 'laravel', 'php', 'design', 'figma', 'brand', 'wp'];
    order = order.filter(function (k) { return tagCounts[k]; });
    order.forEach(function (tag, i) {
      var b = document.createElement('button');
      b.className = 'work-filter' + (i === 0 ? ' is-active' : '');
      b.type = 'button';
      b.setAttribute('data-filter', tag);
      b.innerHTML = tag + '<span class="count">' + tagCounts[tag] + '</span>';
      b.addEventListener('click', function () { apply(tag); });
      bar.appendChild(b);
    });
    function apply(tag) {
      bar.querySelectorAll('.work-filter').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-filter') === tag);
      });
      tiles.forEach(function (t) {
        var tags = (t.getAttribute('data-tags') || '').split(',').map(function (s) { return s.trim(); });
        var show = tag === 'all' || tags.indexOf(tag) > -1;
        t.classList.toggle('is-hidden', !show);
      });
    }
  })();

  /* ---------- Custom right-click context menu ---------- */
  (function ctxMenu() {
    if (isTouch) return;
    var menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.innerHTML =
      '<div class="ctx-menu__title">dev_actions</div>' +
      '<div class="ctx-menu__item" data-act="copy-email"><span class="ctx-menu__icon">@</span>Copy email<span class="ctx-menu__shortcut">.com</span></div>' +
      '<div class="ctx-menu__item" data-act="github"><span class="ctx-menu__icon">↗</span>Open GitHub<span class="ctx-menu__shortcut">↗</span></div>' +
      '<div class="ctx-menu__item" data-act="linkedin"><span class="ctx-menu__icon">↗</span>Open LinkedIn<span class="ctx-menu__shortcut">↗</span></div>' +
      '<div class="ctx-menu__item" data-act="resume"><span class="ctx-menu__icon">⇣</span>Download Resume<span class="ctx-menu__shortcut">.pdf</span></div>' +
      '<div class="ctx-menu__sep"></div>' +
      '<div class="ctx-menu__title">view</div>' +
      '<div class="ctx-menu__item" data-act="cmdk"><span class="ctx-menu__icon">⌘</span>Command palette<span class="ctx-menu__shortcut">ctrl+k</span></div>' +
      '<div class="ctx-menu__item" data-act="help"><span class="ctx-menu__icon">?</span>Keyboard shortcuts<span class="ctx-menu__shortcut">?</span></div>' +
      '<div class="ctx-menu__item" data-act="konami"><span class="ctx-menu__icon">★</span>Toggle konami mode<span class="ctx-menu__shortcut">★</span></div>' +
      '<div class="ctx-menu__item" data-act="top"><span class="ctx-menu__icon">↑</span>Scroll to top<span class="ctx-menu__shortcut">⤒</span></div>';
    document.body.appendChild(menu);

    function open(x, y) {
      menu.style.left = '0px';
      menu.style.top = '0px';
      menu.classList.add('is-open');
      var r = menu.getBoundingClientRect();
      var nx = Math.min(x, window.innerWidth - r.width - 8);
      var ny = Math.min(y, window.innerHeight - r.height - 8);
      menu.style.left = nx + 'px';
      menu.style.top = ny + 'px';
    }
    function close() { menu.classList.remove('is-open'); }

    document.addEventListener('contextmenu', function (e) {
      if (e.target.closest && e.target.closest('input, textarea, .cmdk-overlay')) return;
      e.preventDefault();
      open(e.clientX, e.clientY);
    });
    document.addEventListener('click', close);
    document.addEventListener('scroll', close, { passive: true });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    menu.addEventListener('click', function (e) {
      var item = e.target.closest('.ctx-menu__item');
      if (!item) return;
      var act = item.getAttribute('data-act');
      close();
      if (act === 'copy-email') {
        var email = 'turayalemmuel@gmail.com';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(function () { techToast('copied: ' + email); });
        } else {
          var ta = document.createElement('textarea');
          ta.value = email; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); techToast('copied: ' + email); } catch (_) {}
          document.body.removeChild(ta);
        }
      } else if (act === 'github')   { window.open('https://github.com/kon2raya24', '_blank', 'noopener'); }
      else if (act === 'linkedin')   { window.open('https://www.linkedin.com/in/lemmuel-turaya/', '_blank', 'noopener'); }
      else if (act === 'resume')     { window.location.href = 'resume.pdf'; }
      else if (act === 'cmdk')       {
        var ev = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
        document.dispatchEvent(ev);
      }
      else if (act === 'help')       {
        var ev2 = new KeyboardEvent('keydown', { key: '?' });
        document.dispatchEvent(ev2);
      }
      else if (act === 'konami')     { document.body.classList.toggle('konami-on'); techToast(document.body.classList.contains('konami-on') ? 'konami: ON' : 'konami: OFF'); }
      else if (act === 'top')        { window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }); }
    });
  })();

  /* ---------- Interactive terminal (` to toggle) ---------- */
  (function devTerminal() {
    if (isTouch) return;

    var el = document.createElement('div');
    el.className = 'dev-term';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="dev-term__bar">' +
        '<span class="dev-term__dots"><i></i><i></i><i></i></span>' +
        '<span class="dev-term__path">~/portfolio &mdash; bash</span>' +
        '<button class="dev-term__close" type="button" aria-label="close terminal">×</button>' +
      '</div>' +
      '<div class="dev-term__body" data-term-body>' +
        '<div class="dev-term__line">' +
          '<span class="dev-term__welcome">welcome to <strong>lemmuel@portfolio</strong> &mdash; type <strong>help</strong> for commands. press <strong>` (backtick)</strong> to toggle, <strong>esc</strong> to close.</span>' +
        '</div>' +
      '</div>' +
      '<form class="dev-term__form">' +
        '<span class="dev-term__prompt"><span class="user">lemmuel@portfolio</span>:<span class="path">~</span>$</span>' +
        '<input class="dev-term__input" type="text" autocomplete="off" spellcheck="false" autocapitalize="off">' +
      '</form>';
    document.body.appendChild(el);

    var body = el.querySelector('[data-term-body]');
    var input = el.querySelector('.dev-term__input');
    var form = el.querySelector('.dev-term__form');
    var closeBtn = el.querySelector('.dev-term__close');

    var history = [];
    var historyIdx = -1;

    function escape(s) {
      return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function print(html, cls) {
      var line = document.createElement('div');
      line.className = 'dev-term__line' + (cls ? ' ' + cls : '');
      line.innerHTML = html;
      body.appendChild(line);
      body.scrollTop = body.scrollHeight;
    }
    function echo(cmd) {
      print('<span class="dev-term__prompt"><span class="user">lemmuel@portfolio</span>:<span class="path">~</span>$</span> ' + escape(cmd));
    }

    var commands = {
      help: function () {
        print('Available commands:', 'dim');
        print('  <span class="ok">help</span>        list commands');
        print('  <span class="ok">ls</span>          list sections');
        print('  <span class="ok">whoami</span>      who am i');
        print('  <span class="ok">cat resume</span>  show resume summary');
        print('  <span class="ok">skills</span>      list my skills');
        print('  <span class="ok">stack</span>       my daily-driver stack');
        print('  <span class="ok">contact</span>     contact info');
        print('  <span class="ok">github</span>      open my github');
        print('  <span class="ok">resume</span>      download resume.pdf');
        print('  <span class="ok">uses</span>        open /uses page');
        print('  <span class="ok">changelog</span>   open /changelog');
        print('  <span class="ok">cat resume.json</span>  open machine-readable resume');
        print('  <span class="ok">sudo hire-me</span>  request immediate hiring');
        print('  <span class="ok">date</span>        current date · time');
        print('  <span class="ok">neofetch</span>    system info');
        print('  <span class="ok">theme &lt;name&gt;</span>  cyber | matrix | sunset | xeno | crt');
        print('  <span class="ok">go &lt;section&gt;</span>  jump to a section');
        print('  <span class="ok">open &lt;url&gt;</span>     open an https:// URL in a new tab');
        print('  <span class="ok">konami</span>      toggle hue cycle');
        print('  <span class="ok">clear</span>       clear the terminal');
        print('  <span class="ok">exit</span>        close terminal');
      },
      ls: function () {
        print('about/  resume/  services/  skills/  work/  contact/');
      },
      whoami: function () {
        print('<span class="ok">lemmuel.turaya</span> &mdash; full-stack &amp; mobile app developer, philippines, GMT+8.');
        print('6+ yrs · open to opportunities · pair-programs with claude.', 'dim');
      },
      'cat resume': function () {
        print('<span class="ok">Lemmuel Turaya</span>');
        print('Full-Stack &amp; Mobile App Developer · Biñan, Laguna · PH');
        print('-- experience --', 'dim');
        print('AAI Worldwide Logistics  · Application Developer · Nov 2024 – Now');
        print('Octal Philippines        · Software Developer    · 2022 – 2024');
        print('Uratex Philippines       · Full-Stack Developer  · Mar – Oct 2022');
        print('Lumina Homes             · Marketing Staff (Dev) · 2021 – 2022');
        print('Switch Connect Pty Ltd   · Junior Web Developer  · 2019 – 2020');
        print('-- education --', 'dim');
        print('B.S. Information Technology · Trimex Colleges · GPA 1.50');
        print('see <a href="resume.pdf" target="_blank">resume.pdf</a> for the full document.', 'dim');
      },
      skills: function () {
        print('<span class="ok">frontend</span>  · vue.js · nuxt.js · vuetify · html5 · css3 · javascript · typescript · bootstrap');
        print('<span class="ok">backend </span>  · laravel · php · mysql · node.js · rest · silverstripe · statamic');
        print('<span class="ok">mobile  </span>  · flutter · dart · firebase');
        print('<span class="ok">ai/auto </span>  · claude · gemini · openai · openrouter · qwen · multi-llm orchestration · autonomous agents · n8n · zapier');
      },
      stack: function () {
        print('editor:   vs code + claude code');
        print('shell:    bash · wsl ubuntu');
        print('terminal: windows terminal');
        print('design:   figma');
        print('api:      postman');
        print('vc:       git · github');
      },
      contact: function () {
        print('email:    <a href="mailto:turayalemmuel@gmail.com">turayalemmuel@gmail.com</a>');
        print('phone:    +63 922 778 6152');
        print('linkedin: <a href="https://www.linkedin.com/in/lemmuel-turaya/" target="_blank">lemmuel-turaya</a>');
        print('github:   <a href="https://github.com/kon2raya24" target="_blank">@kon2raya24</a>');
        print('book:     <a href="https://cal.com/lemmuel-turaya/intro" target="_blank">cal.com/lemmuel-turaya/intro</a>');
      },
      github: function () {
        print('opening github.com/kon2raya24 ...', 'ok');
        window.open('https://github.com/kon2raya24', '_blank', 'noopener');
      },
      resume: function () {
        print('downloading <a href="resume.pdf" target="_blank">resume.pdf</a> ...', 'ok');
        window.location.href = 'resume.pdf';
      },
      uses: function () {
        print('opening <a href="uses.html" target="_blank">/uses</a> &mdash; what I work with daily.', 'ok');
        window.open('uses.html', '_blank', 'noopener');
      },
      changelog: function () {
        print('opening <a href="changelog.html" target="_blank">/changelog</a> &mdash; portfolio iteration log.', 'ok');
        window.open('changelog.html', '_blank', 'noopener');
      },
      'cat resume.json': function () {
        print('opening <a href="resume.json" target="_blank">resume.json</a> (JSON Resume format)', 'ok');
        window.open('resume.json', '_blank', 'noopener');
      },
      'sudo hire-me': function () {
        print('[sudo] elevating privileges...', 'dim');
        print('granted.', 'ok');
        print('redirecting to the hire section &mdash; let\'s talk.', 'ok');
        setTimeout(function () {
          var t = document.getElementById('fh5co-started');
          if (t) t.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
        }, 500);
      },
      date: function () {
        var d = new Date();
        print(d.toString());
      },
      neofetch: function () {
        print('             <span class="ok">lemmuel@portfolio</span>');
        print('             -------------------');
        print('  ◢◤◤◣◣      <span class="ok">OS:</span>       Portfolio v3 (cyber-os)');
        print(' ◢◤    ◣◣    <span class="ok">Host:</span>     kon2raya.netlify.app');
        print(' ◤      ◥    <span class="ok">Uptime:</span>   ' + Math.floor(performance.now() / 1000) + 's (since page load)');
        print(' ◣      ◢    <span class="ok">Shell:</span>    bash · zsh');
        print(' ◥◣    ◢◤    <span class="ok">Editor:</span>   VS Code + Claude Code');
        print('  ◥◣◣◢◢      <span class="ok">Stack:</span>    Vue · Laravel · Flutter · Claude');
        print('             <span class="ok">Status:</span>   Open to opportunities');
      },
      konami: function () {
        document.body.classList.toggle('konami-on');
        print(document.body.classList.contains('konami-on') ? 'konami mode: <span class="ok">ON</span> 🎮' : 'konami mode: <span class="err">OFF</span>');
      },
      clear: function () { body.innerHTML = ''; },
      cls:   function () { body.innerHTML = ''; },
      exit:  function () { close(); },
      quit:  function () { close(); }
    };

    var themeAliases = { cyber: 'cyber', matrix: 'matrix', sunset: 'sunset', xeno: 'xeno', crt: 'crt' };
    function handleTheme(arg) {
      if (!arg || !themeAliases[arg]) {
        print('usage: theme &lt;cyber | matrix | sunset | xeno | crt&gt;', 'err');
        return;
      }
      applyPalette(arg);
      print('theme set: <span class="ok">' + arg + '</span>');
    }

    function handleGo(arg) {
      var map = {
        about: 'fh5co-about', resume: 'fh5co-resume', services: 'fh5co-features',
        skills: 'fh5co-skills', work: 'fh5co-work', contact: 'fh5co-started',
        hire: 'fh5co-started', home: 'fh5co-header', hero: 'fh5co-header'
      };
      var id = map[arg];
      if (!id) { print('unknown section: ' + escape(arg), 'err'); return; }
      var t = document.getElementById(id);
      if (t) {
        t.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
        print('navigating to /' + arg + ' ...', 'ok');
      }
    }

    function run(cmd) {
      cmd = cmd.trim();
      if (!cmd) return;
      echo(cmd);
      history.push(cmd);
      historyIdx = history.length;

      if (commands[cmd]) { commands[cmd](); return; }

      var parts = cmd.split(/\s+/);
      var head = parts[0];
      var arg = parts.slice(1).join(' ');

      if (head === 'theme') return handleTheme(arg);
      if (head === 'go' || head === 'cd') return handleGo(arg);
      if (head === 'cat' && (arg === 'resume' || arg === 'resume.pdf')) { commands['cat resume'](); return; }
      if (head === 'sudo' && (arg === 'hire-me' || arg === 'hire')) { commands['sudo hire-me'](); return; }
      if (head === 'open' && arg) {
        var ok = /^https?:\/\//.test(arg);
        if (ok) { window.open(arg, '_blank', 'noopener'); print('opening ' + escape(arg) + ' ...', 'ok'); }
        else print('open: only https://… urls allowed', 'err');
        return;
      }
      if (head === 'echo') { print(escape(arg)); return; }
      if (head === 'pwd')  { print('/home/lemmuel/portfolio'); return; }
      if (head === 'man' || head === '--help' || head === '-h') { commands.help(); return; }

      print('command not found: <span class="err">' + escape(head) + '</span> &mdash; type <strong>help</strong>.');
    }

    // Track focus-before-open so we restore it on close (dialog a11y).
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      el.classList.add('is-open');
      el.setAttribute('aria-hidden', 'false');
      setTimeout(function () { input.focus(); }, 30);
    }
    function close() {
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
      input.blur();
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
        lastFocus = null;
      }
    }
    function toggle() {
      el.classList.contains('is-open') ? close() : open();
    }

    closeBtn.addEventListener('click', close);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value;
      input.value = '';
      run(v);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') {
        if (historyIdx > 0) historyIdx--;
        if (history[historyIdx]) { input.value = history[historyIdx]; e.preventDefault(); }
      } else if (e.key === 'ArrowDown') {
        if (historyIdx < history.length - 1) {
          historyIdx++; input.value = history[historyIdx];
        } else { historyIdx = history.length; input.value = ''; }
        e.preventDefault();
      } else if (e.key === 'Escape') { close(); }
    });

    document.addEventListener('keydown', function (e) {
      // Don't fire when typing in an input/textarea
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (e.key === '`' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        toggle();
      } else if (e.key === '`' && document.activeElement === input) {
        // Allow backtick to close from inside the term too
        e.preventDefault();
        close();
      }
    });

    console.log('%c💻 Press ` (backtick) to open the dev terminal', 'color:#FF9000;font-family:monospace;font-size:12px;');
  })();

  /* ---------- UTM-aware welcome pill ---------- */
  (function utmPill() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get('utm_source') || params.get('utm') || params.get('from') || params.get('ref');
    var stored = null;
    try { stored = sessionStorage.getItem('portfolio.referrer'); } catch (e) {}
    if (raw) {
      try { sessionStorage.setItem('portfolio.referrer', raw); } catch (e) {}
      stored = raw;
    } else if (!stored) {
      // Fall back to document.referrer hostname
      try {
        var r = document.referrer || '';
        if (r) {
          var url = new URL(r);
          var h = url.hostname.replace(/^www\./, '');
          if (h && h !== window.location.hostname) {
            stored = h;
            try { sessionStorage.setItem('portfolio.referrer', h); } catch (e) {}
          }
        }
      } catch (e) {}
    }
    if (!stored) return;

    // Strip the utm params so a refresh doesn't keep them in the URL
    if (raw && history.replaceState) {
      ['utm_source','utm','from','ref'].forEach(function (k) { params.delete(k); });
      var qs = params.toString();
      history.replaceState({}, document.title, window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
    }

    var key = String(stored).toLowerCase().replace(/[^a-z0-9.-]/g, '');
    var sources = {
      linkedin: { label: 'LinkedIn', emoji: '🟦', color: '#0a66c2' },
      'linkedin.com': { label: 'LinkedIn', emoji: '🟦', color: '#0a66c2' },
      github: { label: 'GitHub', emoji: '🐙', color: '#fff' },
      'github.com': { label: 'GitHub', emoji: '🐙', color: '#fff' },
      twitter: { label: 'Twitter / X', emoji: '✕', color: '#fff' },
      'twitter.com': { label: 'Twitter / X', emoji: '✕', color: '#fff' },
      x: { label: 'X', emoji: '✕', color: '#fff' },
      upwork: { label: 'Upwork', emoji: '💼', color: '#14a800' },
      'upwork.com': { label: 'Upwork', emoji: '💼', color: '#14a800' },
      reddit: { label: 'Reddit', emoji: '👽', color: '#ff4500' },
      'reddit.com': { label: 'Reddit', emoji: '👽', color: '#ff4500' },
      hn: { label: 'Hacker News', emoji: '🟧', color: '#ff6600' },
      'news.ycombinator.com': { label: 'Hacker News', emoji: '🟧', color: '#ff6600' },
      facebook: { label: 'Facebook', emoji: '👍', color: '#1877f2' },
      'facebook.com': { label: 'Facebook', emoji: '👍', color: '#1877f2' },
      instagram: { label: 'Instagram', emoji: '📷', color: '#e1306c' },
      'instagram.com': { label: 'Instagram', emoji: '📷', color: '#e1306c' },
      'google.com': { label: 'Google search', emoji: '🔎', color: '#4285f4' },
      google: { label: 'Google', emoji: '🔎', color: '#4285f4' },
      email: { label: 'Email', emoji: '✉️', color: '#FF9000' },
      resume: { label: 'Resume link', emoji: '📄', color: '#FF9000' }
    };
    var meta = sources[key] || { label: stored, emoji: '👋', color: '#00e5ff' };

    var pill = document.createElement('div');
    pill.className = 'utm-pill';
    pill.innerHTML =
      '<span class="utm-pill__emoji">' + meta.emoji + '</span>' +
      '<span class="utm-pill__txt">welcome from <strong>' + meta.label + '</strong></span>' +
      '<button class="utm-pill__close" type="button" aria-label="dismiss">×</button>';
    document.body.appendChild(pill);
    pill.style.setProperty('--utm-accent', meta.color);

    setTimeout(function () { pill.classList.add('is-show'); }, 600);
    pill.querySelector('.utm-pill__close').addEventListener('click', function () {
      pill.classList.remove('is-show');
      setTimeout(function () { pill.remove(); }, 400);
    });
    // Auto-dismiss after 12s
    setTimeout(function () {
      pill.classList.remove('is-show');
      setTimeout(function () { if (pill.parentNode) pill.remove(); }, 400);
    }, 12000);

    // Bonus: add a "source" row to the live-stats footer if it exists
    var stats = document.querySelector('.live-stats');
    if (stats && !stats.querySelector('[data-live="source"]')) {
      var item = document.createElement('div');
      item.className = 'live-stats__item';
      item.innerHTML =
        '<span class="live-stats__label">source</span>' +
        '<span class="live-stats__val" data-live="source">' + meta.label + '</span>';
      stats.appendChild(item);
    }
  })();

  /* ---------- Scroll restoration on reload (paired with the head-inline
                  bootstrap that disables `history.scrollRestoration` and
                  flagged `scroll-pending`). Apply the saved Y as early as
                  possible after parse, then unhide content. Save throttled
                  on every scroll. ---------- */
  (function scrollRestore() {
    function applyScroll() {
      try {
        var y = window.__scrollPending;
        if (typeof y === 'number' && y > 0) {
          // `behavior: 'instant'` overrides `html { scroll-behavior: smooth }`
          // for this one call — we want a jump, not an animated scroll.
          // Fallback: temp-disable scroll-behavior on <html>, scrollTo, restore.
          if (typeof window.scrollTo === 'function') {
            try {
              window.scrollTo({ top: y, left: 0, behavior: 'instant' });
            } catch (err) {
              var prev = document.documentElement.style.scrollBehavior;
              document.documentElement.style.scrollBehavior = 'auto';
              window.scrollTo(0, y);
              document.documentElement.style.scrollBehavior = prev;
            }
          }
        }
      } catch (e) {}
      document.documentElement.classList.remove('scroll-pending');
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        // Two rAFs: one for next paint, one for layout settle. Cheap insurance.
        requestAnimationFrame(function () { requestAnimationFrame(applyScroll); });
      });
    } else {
      requestAnimationFrame(function () { requestAnimationFrame(applyScroll); });
    }

    // Re-apply once on full load to correct for late layout shifts (fonts,
    // images that change page height). Only if the offset is meaningful.
    window.addEventListener('load', function () {
      var y = window.__scrollPending;
      if (typeof y === 'number' && y > 0 && Math.abs(window.scrollY - y) > 4) {
        try {
          window.scrollTo({ top: y, left: 0, behavior: 'instant' });
        } catch (err) {
          var prev = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo(0, y);
          document.documentElement.style.scrollBehavior = prev;
        }
      }
    });

    // Throttled save — captures current scroll every 200ms while scrolling.
    var t = 0;
    window.addEventListener('scroll', function () {
      if (t) return;
      t = setTimeout(function () {
        try { sessionStorage.setItem('portfolio.scroll', String(window.scrollY)); } catch (e) {}
        t = 0;
      }, 200);
    }, { passive: true });

    // Persist immediately when the user leaves the tab so a fresh reload
    // catches the latest position even if the throttle hasn't fired yet.
    window.addEventListener('beforeunload', function () {
      try { sessionStorage.setItem('portfolio.scroll', String(window.scrollY)); } catch (e) {}
    });
  })();

  /* ---------- Skip entrance animations on reload/back-forward.
                  If this is a fresh visit, leave .animate-box alone so
                  Waypoints can do its staggered fadeInUp as the user
                  scrolls. If it's a reload OR back/forward nav, mark
                  EVERY .animate-box as already-revealed RIGHT NOW
                  (synchronously, before main.js's $(document).ready
                  queue fires) so Waypoints' first scan sees them all as
                  animated-fast and never triggers the fade. ---------- */
  (function skipAnimsOnReload() {
    var isReload = false;
    try {
      if (typeof performance !== 'undefined' && performance.getEntriesByType) {
        var nav = performance.getEntriesByType('navigation')[0];
        if (nav && (nav.type === 'reload' || nav.type === 'back_forward')) {
          isReload = true;
        }
      } else if (typeof performance !== 'undefined' && performance.navigation) {
        // legacy API fallback
        var t = performance.navigation.type;
        if (t === 1 /* reload */ || t === 2 /* back_forward */) isReload = true;
      }
    } catch (e) {}

    if (!isReload) return;

    // Synchronous mark — runs at tech-fx.js script-execution time, before
    // DOMContentLoaded fires and before main.js's contentWayPoint() runs.
    var boxes = document.querySelectorAll('.animate-box');
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].classList.add('animated-fast', 'reveal-instant');
    }
  })();

  /* ---------- Footer git-log: recent commits to portfolio repo ---------- */
  (function gitLog() {
    var list = document.querySelector('[data-git-log-list]');
    if (!list) return;

    var REPO = 'kon2raya24/portfolio';
    var URL = 'https://api.github.com/repos/' + REPO + '/commits?per_page=5';
    var CACHE_KEY = 'portfolio.gitLog.cache';
    var CACHE_TTL = 30 * 60 * 1000; // 30 min

    function escape(s) {
      return String(s || '').replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function shortDate(iso) {
      try {
        var d = new Date(iso);
        return d.toISOString().slice(0, 10);
      } catch (e) { return ''; }
    }

    function render(commits) {
      if (!commits || !commits.length) {
        list.innerHTML = '<li class="git-log__empty">$ no commits cached &mdash; check back later</li>';
        return;
      }
      var html = commits.slice(0, 5).map(function (c) {
        var sha = (c.sha || '').slice(0, 7);
        var msg = (c.commit && c.commit.message || '').split('\n')[0];
        var date = shortDate(c.commit && c.commit.author && c.commit.author.date);
        var url = c.html_url || ('https://github.com/' + REPO + '/commit/' + (c.sha || ''));
        return '<li class="git-log__entry">' +
                 '<a class="git-log__sha" href="' + escape(url) + '" target="_blank" rel="noopener">' + escape(sha) + '</a>' +
                 '<span class="git-log__msg">' + escape(msg) + '</span>' +
                 '<span class="git-log__date">' + escape(date) + '</span>' +
               '</li>';
      }).join('');
      list.innerHTML = html;
    }

    function readCache() {
      try {
        var raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (Date.now() - parsed.at > CACHE_TTL) return parsed; // still usable as fallback
        return parsed;
      } catch (e) { return null; }
    }
    function writeCache(commits) {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), commits: commits })); } catch (e) {}
    }

    var cached = readCache();
    if (cached && cached.commits) render(cached.commits);

    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 5000);

    fetch(URL, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) {
        clearTimeout(timer);
        if (r.status === 403) {
          if (!cached) list.innerHTML = '<li class="git-log__empty">$ github rate-limited &middot; retry later</li>';
          return null;
        }
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.length) return;
        render(data);
        writeCache(data);
      })
      .catch(function () {
        if (!cached) list.innerHTML = '<li class="git-log__empty">$ offline &middot; could not fetch commits</li>';
      });
  })();

  /* ---------- Footer 'last shipped' stamp ---------- */
  (function lastShipped() {
    var el = document.querySelector('[data-last-shipped]');
    if (!el) return;
    var d;
    try { d = new Date(document.lastModified); } catch (e) { d = new Date(); }
    if (isNaN(d.getTime())) d = new Date();
    var iso = d.getFullYear() + '-' +
              String(d.getMonth() + 1).padStart(2, '0') + '-' +
              String(d.getDate()).padStart(2, '0');
    el.textContent = 'last shipped · ' + iso;
  })();

  /* ---------- Work portfolio filter chips ---------- */
  (function workFilter() {
    var container = document.querySelector('.work-filters');
    var grid = document.getElementById('work-grid');
    if (!container || !grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-tags]'));
    if (!cards.length) return;

    // Count tags across all cards
    var counts = {};
    cards.forEach(function (card) {
      (card.getAttribute('data-tags') || '').split(',').forEach(function (t) {
        t = t.trim();
        if (!t) return;
        counts[t] = (counts[t] || 0) + 1;
      });
    });

    // Sort tags by count desc, then alpha
    var tags = Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a] || a.localeCompare(b);
    }).slice(0, 7);

    // Build chip nodes: [all] + top tags
    var chips = [{ tag: 'all', count: cards.length }].concat(
      tags.map(function (t) { return { tag: t, count: counts[t] }; })
    );

    container.innerHTML = '';
    chips.forEach(function (c) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'work-filter';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('data-filter', c.tag);
      btn.setAttribute('aria-selected', c.tag === 'all' ? 'true' : 'false');
      btn.innerHTML = '<span class="work-filter__tag">' + c.tag + '</span>' +
                      '<span class="work-filter__count">' + c.count + '</span>';
      container.appendChild(btn);
    });

    function applyFilter(tag) {
      cards.forEach(function (card) {
        var cardTags = (card.getAttribute('data-tags') || '').split(',').map(function (t) { return t.trim(); });
        var match = tag === 'all' || cardTags.indexOf(tag) !== -1;
        card.classList.toggle('is-hidden', !match);
      });
      container.querySelectorAll('.work-filter').forEach(function (b) {
        var active = b.getAttribute('data-filter') === tag;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      try { localStorage.setItem('portfolio.workFilter', tag); } catch (e) {}
    }

    container.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]');
      if (b) applyFilter(b.getAttribute('data-filter'));
    });

    // Restore prior selection
    var saved;
    try { saved = localStorage.getItem('portfolio.workFilter'); } catch (e) {}
    if (saved && counts[saved]) applyFilter(saved);
    else applyFilter('all');
  })();

  /* ---------- Mobile nav hamburger — toggle the slide-down menu on ≤768px ----------
     Without this, mobile visitors couldn't navigate at all — style.css hides
     .fh5co-nav-links on small viewports and there was never a replacement. */
  (function mobileNavToggle() {
    var btn = document.querySelector('[data-nav-toggle]');
    var menu = document.getElementById('fh5co-nav-menu');
    if (!btn || !menu) return;

    function setOpen(open) {
      menu.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    // Close when any nav link is clicked (anchor scrolls land cleanly)
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    // Outside click closes the menu — but ignore clicks inside the theme picker
    // (its own popover lives in the menu and would otherwise close instantly).
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('is-open') &&
          !menu.contains(e.target) &&
          !btn.contains(e.target)) {
        setOpen(false);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
    });
    // Reset on resize past the breakpoint so the menu doesn't stay "open" on desktop
    var mql = window.matchMedia('(max-width: 768px)');
    function onChange() { if (!mql.matches) setOpen(false); }
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else if (mql.addListener) mql.addListener(onChange); // older Safari
  })();

  /* ---------- Theme picker (popover in nav) — uses the shared helpers above ---------- */
  (function navThemePicker() {
    var root = document.querySelector('[data-theme-picker]');
    if (!root) return;
    var trigger = root.querySelector('[data-theme-picker-trigger]');
    var menu = root.querySelector('.theme-picker__menu');
    var modeBtns = root.querySelectorAll('.theme-picker__mode');
    var paletteBtns = root.querySelectorAll('.theme-picker__dot');

    function syncUI() {
      var mode = currentMode();
      var palette = currentPalette();
      modeBtns.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-mode') === mode); });
      paletteBtns.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-palette') === palette); });
      trigger.setAttribute('title', 'Theme · ' + mode + ' · ' + palette);
    }
    function openMenu() {
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      setTimeout(function () {
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onMenuKeydown);
      }, 0);
    }
    function closeMenu(returnFocus) {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onMenuKeydown);
      // Return focus to the trigger so keyboard users don't lose their place
      if (returnFocus) trigger.focus();
    }
    function onDocClick(e) { if (!root.contains(e.target)) closeMenu(false); }
    function onMenuKeydown(e) {
      // Escape closes from anywhere inside the menu (or anywhere on page),
      // and returns focus to the trigger — proper a11y dialog pattern.
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu(true);
      }
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hidden) openMenu(); else closeMenu(false);
    });
    modeBtns.forEach(function (b) {
      b.addEventListener('click', function () { applyMode(b.getAttribute('data-mode')); syncUI(); });
    });
    paletteBtns.forEach(function (b) {
      b.addEventListener('click', function () { applyPalette(b.getAttribute('data-palette')); syncUI(); });
    });

    // Cross-component sync (HUD picker may also change palette/mode)
    document.addEventListener('palette:change', syncUI);
    document.addEventListener('mode:change', syncUI);

    // Alt+T cycles palettes (cyber → matrix → sunset → xeno → cyber).
    // Ignored when an input/textarea is focused so it doesn't hijack typing.
    document.addEventListener('keydown', function (e) {
      if (!e.altKey || (e.key !== 't' && e.key !== 'T')) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      var idx = PALETTES.indexOf(currentPalette());
      applyPalette(PALETTES[(idx + 1) % PALETTES.length]);
    });

    // Initialize state to match what the FOUC bootstrap applied
    applyMode(currentMode());
    syncUI();
  })();

  /* ---------- Hire CTA: Hiring/Client track toggle ---------- */
  (function ctaTrack() {
    var tabs = document.querySelectorAll('[data-cta-track]');
    if (!tabs.length) return;

    var form     = document.querySelector('form[name="contact"]');
    var typeSel  = form ? form.querySelector('select[name="opportunity_type"]') : null;
    var msgArea  = form ? form.querySelector('textarea[name="message"]') : null;

    var presets = {
      hiring: {
        opportunity: 'Full-time role',
        placeholder: 'A few lines about the role, team, and what success looks like in the first 90 days…'
      },
      client:  {
        opportunity: 'Contract / Freelance',
        placeholder: 'A few lines about the project, timeline, and the outcome you need…'
      }
    };

    function setTrack(track) {
      tabs.forEach(function (t) {
        var active = t.getAttribute('data-cta-track') === track;
        t.classList.toggle('is-active', active);
        // Radio pattern: aria-checked (not aria-selected which is for tabs)
        t.setAttribute('aria-checked', active ? 'true' : 'false');
      });
      var preset = presets[track];
      if (!preset) return;
      if (typeSel) {
        for (var i = 0; i < typeSel.options.length; i++) {
          if (typeSel.options[i].text === preset.opportunity) {
            typeSel.selectedIndex = i;
            break;
          }
        }
      }
      if (msgArea && !msgArea.value) {
        msgArea.setAttribute('placeholder', preset.placeholder);
      }
      try { localStorage.setItem('portfolio.ctaTrack', track); } catch (e) {}
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        setTrack(t.getAttribute('data-cta-track'));
      });
    });

    var saved;
    try { saved = localStorage.getItem('portfolio.ctaTrack'); } catch (e) {}
    if (saved && presets[saved]) setTrack(saved);
  })();

  /* ---------- Konami code easter egg ---------- */
  (function konami() {
    var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var i = 0;
    document.addEventListener('keydown', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === seq[i]) {
        i++;
        if (i === seq.length) {
          document.body.classList.toggle('konami-on');
          console.log('%c🎮 KONAMI MODE ' + (document.body.classList.contains('konami-on') ? 'ENABLED' : 'DISABLED'),
            'font-family: monospace; font-size: 14px; color: #ff2bd6; text-shadow: 0 0 10px #ff2bd6;');
          i = 0;
        }
      } else {
        i = (k === seq[0]) ? 1 : 0;
      }
    });
  })();

}());
