/* =======================================================
 *  Tech FX — dev-by-dev futuristic interactions
 *  Pure vanilla JS, no dependencies.
 * ======================================================= */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = matchMedia('(hover: none)').matches || window.innerWidth < 1025;

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

  /* ---------- Live GitHub stats + commit graph ---------- */
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
    function fallback() {
      var seed = 42;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      var buckets = [];
      for (var i = 0; i < CELLS; i++) {
        var v = rnd();
        buckets.push(v < 0.4 ? 0 : v < 0.65 ? 1 : v < 0.85 ? 3 : v < 0.96 ? 6 : 10);
      }
      paint(buckets);
    }

    // Day index: today = CELLS - 1, walk backwards
    function dayIndexFor(date) {
      var today = new Date();
      today.setHours(0,0,0,0);
      var d = new Date(date);
      d.setHours(0,0,0,0);
      var diffDays = Math.round((today - d) / 86400000);
      var idx = CELLS - 1 - diffDays;
      return (idx >= 0 && idx < CELLS) ? idx : -1;
    }

    function loadEvents() {
      var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 5000);
      // Public events: up to 30 of the most recent
      fetch('https://api.github.com/users/' + USER + '/events/public?per_page=100', ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('bad'); return r.json(); })
        .then(function (events) {
          if (!Array.isArray(events) || !events.length) { fallback(); return; }
          var buckets = new Array(CELLS).fill(0);
          events.forEach(function (e) {
            var idx = dayIndexFor(e.created_at);
            if (idx >= 0) buckets[idx] += 1;
          });
          paint(buckets);
          if (label) label.textContent = '// recent github activity · live · @' + USER;
        })
        .catch(function () { clearTimeout(t); fallback(); });
    }

    // Always paint the deterministic fallback first so layout is stable
    fallback();
    loadEvents();

    // Bonus: fetch profile stats and append a tiny meta line
    fetch('https://api.github.com/users/' + USER)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !label) return;
        var meta = document.createElement('div');
        meta.className = 'commit-graph-meta';
        meta.innerHTML =
          '<span><strong>' + fmt(d.public_repos) + '</strong> repos</span>' +
          '<span class="sep">·</span>' +
          '<span><strong>' + fmt(d.followers) + '</strong> followers</span>' +
          '<span class="sep">·</span>' +
          '<span><strong>' + fmt(d.following) + '</strong> following</span>' +
          '<span class="sep">·</span>' +
          '<a href="https://github.com/' + USER + '" target="_blank" rel="noopener">view profile &rarr;</a>';
        label.parentNode.insertBefore(meta, host.nextSibling);
      })
      .catch(function () {});
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

    /* Theme switcher */
    var themeBtns = el.querySelectorAll('.theme-pick__btn');
    var stored = null;
    try { stored = localStorage.getItem('portfolio.theme'); } catch (_) {}
    function applyTheme(name) {
      document.body.classList.remove('theme-matrix', 'theme-sunset');
      if (name === 'matrix') document.body.classList.add('theme-matrix');
      if (name === 'sunset') document.body.classList.add('theme-sunset');
      themeBtns.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-th') === name); });
      try { localStorage.setItem('portfolio.theme', name); } catch (_) {}
    }
    themeBtns.forEach(function (b) {
      b.addEventListener('click', function () { applyTheme(b.getAttribute('data-th')); });
    });
    if (stored === 'matrix' || stored === 'sunset') applyTheme(stored);

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
      { id: 'fh5co-features', label: 'services' },
      { id: 'fh5co-skills',   label: 'skills' },
      { id: 'fh5co-work',     label: 'projects' },
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

  /* ---------- Skill bars: animate fill + count when in view ---------- */
  (function skillBars() {
    var cards = document.querySelectorAll('.skill-card');
    if (!cards.length) return;
    function animate(card) {
      if (card._ran) return;
      card._ran = true;
      card.querySelectorAll('.skill-bar i').forEach(function (bar) {
        var lvl = parseInt(bar.getAttribute('data-lvl'), 10) || 0;
        requestAnimationFrame(function () {
          bar.style.inset = '0 ' + (100 - lvl) + '% 0 0';
        });
      });
      card.querySelectorAll('.skill-val').forEach(function (v) {
        var target = parseInt(v.getAttribute('data-target'), 10) || 0;
        var start = performance.now(), dur = 1100;
        function step(now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          v.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); }
        });
      }, { threshold: 0.25 });
      cards.forEach(function (c) { io.observe(c); });
    } else {
      cards.forEach(animate);
    }
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

  /* ---------- Contact form success ---------- */
  (function contactSuccess() {
    if (window.location.search.indexOf('sent=1') === -1) return;
    var wrap = document.querySelector('.cta-form-wrap');
    if (!wrap) return;
    wrap.setAttribute('open', '');
    wrap.classList.add('is-sent');
    setTimeout(function () {
      var t = document.getElementById('fh5co-started');
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    // strip the param so refresh doesn't replay
    if (history.replaceState) {
      history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }
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
