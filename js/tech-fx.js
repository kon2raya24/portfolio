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
  var isTouch = matchMedia('(hover: none)').matches || window.innerWidth < 1025;

  /* ---------- Shared theme helpers (used by HUD palette picker + nav theme picker) ----------
     Single source of truth for mode (light/dark) and palette (cyber/matrix/sunset/xeno).
     Both UIs sync via 'mode:change' and 'palette:change' custom events. */
  var PALETTES = ['cyber', 'matrix', 'sunset', 'xeno'];

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

  /* ---------- Custom cursor (desktop only) ---------- */
  (function customCursor() {
    if (isTouch) return;
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.appendChild(dot); document.body.appendChild(ring);

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)';
    }, { passive: true });

    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    }
    loop();

    var hoverables = 'a, button, .btn, .tech-chip, .tool-badge, .work, .feature-left, .timeline-panel, .commit-cell, .info li, .fh5co-nav-brand';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(hoverables)) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(hoverables)) ring.classList.remove('is-hover');
    });
  })();

  /* ---------- Matrix rain (hero) ---------- */
  (function matrixRain() {
    if (prefersReduced) return;
    var host = document.getElementById('fh5co-header');
    if (!host) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'matrix-canvas';
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789{}[]<>/=+-*&|';
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
        ctx.fillStyle = 'rgba(5, 8, 20, 0.18)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = fontSize + 'px "JetBrains Mono", monospace';
        for (var i = 0; i < cols; i++) {
          var ch = chars.charAt(Math.floor(Math.random() * chars.length));
          var x = i * fontSize;
          var y = drops[i] * fontSize;
          var grad = (Math.random() < 0.02) ? '#FF9000' : '#00e5ff';
          ctx.fillStyle = grad;
          ctx.shadowColor = grad;
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
      '</div>' +
      '<div class="hud__row"><span class="hud__label">[ sys ]</span><span class="hud__val">online</span></div>' +
      '<div class="hud__row"><span class="hud__label">time</span><span class="hud__val" data-h="time">--:--:--</span></div>' +
      '<div class="hud__row"><span class="hud__label">fps</span><span class="hud__val" data-h="fps">--</span></div>' +
      '<div class="hud__row"><span class="hud__label">scroll</span><span class="hud__val" data-h="scroll">0%</span></div>' +
      '<div class="hud__row"><span class="hud__label">section</span><span class="hud__val" data-h="section">hero</span></div>' +
      '<div class="hud__row"><span class="hud__label">views</span><span class="hud__val" data-h="views">…</span></div>' +
      '<div class="hud__bar"><i data-h="bar"></i></div>' +
      '<div class="hud__now"><span class="hud__now-label">now</span><span class="hud__now-val" data-h="now">booting…</span></div>';
    document.body.appendChild(el);

    var elTime = el.querySelector('[data-h="time"]');
    var elFps = el.querySelector('[data-h="fps"]');
    var elScroll = el.querySelector('[data-h="scroll"]');
    var elSection = el.querySelector('[data-h="section"]');
    var elBar = el.querySelector('[data-h="bar"]');

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

  /* ---------- Command palette ---------- */
  (function cmdk() {
    var items = [
      { label: 'Go to: About',     hash: '#fh5co-about',    icon: '#', meta: 'jump' },
      { label: 'Go to: Resume',    hash: '#fh5co-resume',   icon: '#', meta: 'jump' },
      { label: 'Go to: Services',  hash: '#fh5co-features', icon: '#', meta: 'jump' },
      { label: 'Go to: Skills',    hash: '#fh5co-skills',   icon: '#', meta: 'jump' },
      { label: 'Go to: Work',      hash: '#fh5co-work',     icon: '#', meta: 'jump' },
      { label: 'Hire Me',          hash: '#fh5co-started',  icon: '$', meta: 'action' },
      { label: 'Email: turayalemmuel@gmail.com', href: 'mailto:turayalemmuel@gmail.com', icon: '@', meta: 'contact' },
      { label: 'GitHub: kon2raya24', href: 'https://github.com/kon2raya24', icon: '↗', meta: 'link' },
      { label: 'LinkedIn',          href: 'https://www.linkedin.com/in/lemmuel-turaya/', icon: '↗', meta: 'link' },
      { label: 'Download Resume',  href: 'resume.pdf', icon: '⇣', meta: 'file' },
      { label: 'Open /uses',       href: 'uses.html', icon: '⚙', meta: 'page' },
      { label: 'Open /changelog',  href: 'changelog.html', icon: '◷', meta: 'page' },
      { label: 'Open resume.json', href: 'resume.json', icon: '{}', meta: 'data' },
      { label: 'Toggle Konami Mode', action: 'konami', icon: '★', meta: 'easter egg' },
      { label: 'Scroll to Top',    action: 'top', icon: '↑', meta: 'nav' }
    ];

    var overlay = document.createElement('div');
    overlay.className = 'cmdk-overlay';
    overlay.innerHTML =
      '<div class="cmdk" role="dialog" aria-modal="true">' +
        '<div class="cmdk__head">' +
          '<span class="cmdk__prompt">&gt;</span>' +
          '<input class="cmdk__input" type="text" placeholder="Search commands… (try: hire, github, resume)" autocomplete="off" spellcheck="false">' +
          '<span class="cmdk__kbd">ESC</span>' +
        '</div>' +
        '<ul class="cmdk__list" role="listbox"></ul>' +
        '<div class="cmdk__foot">' +
          '<span><kbd>↑↓</kbd> navigate</span>' +
          '<span><kbd>↵</kbd> select</span>' +
          '<span><kbd>esc</kbd> close</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var hint = document.createElement('div');
    hint.className = 'cmdk-hint';
    var mac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    hint.innerHTML = 'press <kbd>' + (mac ? '⌘' : 'ctrl') + '</kbd> + <kbd>k</kbd> for commands';
    document.body.appendChild(hint);
    setTimeout(function () { hint.style.transition = 'opacity 0.6s'; hint.style.opacity = '0'; }, 9000);

    var input = overlay.querySelector('.cmdk__input');
    var list = overlay.querySelector('.cmdk__list');
    var active = 0;
    var filtered = items.slice();

    function render() {
      list.innerHTML = '';
      filtered.forEach(function (it, i) {
        var li = document.createElement('li');
        li.className = i === active ? 'is-active' : '';
        li.innerHTML =
          '<span class="cmdk__icon">' + it.icon + '</span>' +
          '<span>' + it.label + '</span>' +
          '<span class="cmdk__meta">' + it.meta + '</span>';
        li.addEventListener('click', function () { exec(it); });
        list.appendChild(li);
      });
    }

    function filter(q) {
      q = q.trim().toLowerCase();
      if (!q) { filtered = items.slice(); }
      else {
        filtered = items.filter(function (it) {
          return it.label.toLowerCase().indexOf(q) > -1 || it.meta.toLowerCase().indexOf(q) > -1;
        });
      }
      active = 0;
      render();
    }

    function exec(it) {
      if (!it) return;
      close();
      if (it.action === 'konami') { document.body.classList.toggle('konami-on'); return; }
      if (it.action === 'top')    { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (it.hash) {
        var t = document.querySelector(it.hash);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    function open() {
      overlay.classList.add('is-open');
      input.value = '';
      filter('');
      setTimeout(function () { input.focus(); }, 10);
    }
    function close() {
      overlay.classList.remove('is-open');
    }

    input.addEventListener('input', function (e) { filter(e.target.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(filtered.length, 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + filtered.length) % Math.max(filtered.length, 1); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); exec(filtered[active]); }
      else if (e.key === 'Escape') { close(); }
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        overlay.classList.contains('is-open') ? close() : open();
      } else if (e.key === '/' && !overlay.classList.contains('is-open')) {
        var tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault(); open();
        }
      }
    });

    render();
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
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      nav.appendChild(a);
      items.push({ id: s.id, el: a });
    });
    document.body.appendChild(nav);

    function update() {
      var mid = (window.scrollY || document.documentElement.scrollTop) + window.innerHeight * 0.35;
      var activeIdx = 0;
      for (var i = 0; i < items.length; i++) {
        var sec = document.getElementById(items[i].id);
        if (sec && sec.offsetTop <= mid) activeIdx = i;
      }
      items.forEach(function (it, i) {
        it.el.classList.toggle('is-active', i === activeIdx);
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
      setTimeout(function () {
        var t = document.getElementById('fh5co-started');
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      if (history.replaceState) {
        history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      }
    }

    if (!form) return;

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
      { keys: ['`'],         desc: 'Toggle dev terminal' },
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

    function open() { overlay.classList.add('is-open'); }
    function close() { overlay.classList.remove('is-open'); }
    overlay.querySelector('.kbdhelp__close').addEventListener('click', close);
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
      else if (act === 'top')        { window.scrollTo({ top: 0, behavior: 'smooth' }); }
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
        print('  <span class="ok">theme &lt;name&gt;</span>  cyber | matrix | sunset');
        print('  <span class="ok">go &lt;section&gt;</span>  jump to a section');
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
        print('<span class="ok">frontend</span>  · vue.js · nuxt.js · vuetify · html5 · css3 · javascript · bootstrap');
        print('<span class="ok">backend </span>  · laravel · php · mysql · node.js · rest · silverstripe · statamic');
        print('<span class="ok">mobile  </span>  · flutter · dart · firebase');
        print('<span class="ok">ai/auto </span>  · claude ai · openai · n8n · zapier · make.com');
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
          if (t) t.scrollIntoView({ behavior: 'smooth' });
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

    var themeAliases = { cyber: 'cyber', matrix: 'matrix', sunset: 'sunset', xeno: 'xeno' };
    function handleTheme(arg) {
      if (!arg || !themeAliases[arg]) {
        print('usage: theme &lt;cyber | matrix | sunset | xeno&gt;', 'err');
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
        t.scrollIntoView({ behavior: 'smooth' });
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

    function open() {
      el.classList.add('is-open');
      el.setAttribute('aria-hidden', 'false');
      setTimeout(function () { input.focus(); }, 30);
    }
    function close() {
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
      input.blur();
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
      setTimeout(function () { document.addEventListener('click', onDocClick); }, 0);
    }
    function closeMenu() {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClick);
    }
    function onDocClick(e) { if (!root.contains(e.target)) closeMenu(); }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hidden) openMenu(); else closeMenu();
    });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
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
        t.setAttribute('aria-selected', active ? 'true' : 'false');
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
