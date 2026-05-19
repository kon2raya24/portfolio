// js/case-study.js
//
// Per-case-study client-side enhancements that don't belong in the main
// portfolio tech-fx.js bundle (which is index.html-only).
//
// Currently:
//   - page-dive transition (matched with tech-fx.js)
//   - 3D systems: cursor spotlight, card tilt, scroll-reveal, heading entries
//   - reading progress bar
//   - TOC anchor pulse on click
//   - last-touched stamp populated from the GitHub commits API

(function () {
  'use strict';

  // ---------- Page-Dive transition ----------
  //
  // Matches the index.html dive-in/out. On case-study pages we need:
  //   - dive-in if we arrived from a portfolio link (sessionStorage signal)
  //   - dive-out when navigating away to another case study or back to home
  //
  // The CSS lives in tech-fx.css but is now also referenced by case-study.css
  // via a small bridge below.
  var prefersReduced = window.matchMedia &&
                        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced) {
    // Incoming dive-in
    try {
      if (sessionStorage.getItem('pf-dive') === '1') {
        sessionStorage.removeItem('pf-dive');
        document.body.classList.add('page-dive-in');
        setTimeout(function () {
          document.body.classList.remove('page-dive-in');
        }, 1200);
      }
    } catch (_) {}

    // Outgoing dive-out for in-portfolio links
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      if (a.target && a.target !== '_self') return;

      var href = a.getAttribute('href');
      if (!href || href[0] === '#') return;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;

      try {
        var url = new URL(a.href, window.location.href);
        if (url.origin !== window.location.origin) return;
      } catch (_) { return; }

      // Intercept: any same-origin link going to another case study, or
      // back to the index. Skip downloads / blob / hash-only.
      var isCS    = /\/case-studies\//.test(url.pathname) || /^case-studies\//.test(href);
      var isHome  = url.pathname === '/' || /\/index\.html$/.test(url.pathname) ||
                    /^(\.\.\/)?(index\.html)?$/.test(href);
      if (!isCS && !isHome) return;

      e.preventDefault();
      var flash = document.createElement('div');
      flash.className = 'page-dive-flash';
      document.body.appendChild(flash);

      document.body.classList.add('page-dive-out');
      try { sessionStorage.setItem('pf-dive', '1'); } catch (_) {}
      setTimeout(function () { window.location.href = a.href; }, 720);
    }, true);

    // bfcache safety — clear any stale dive state when restored from cache
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) {
        document.body.classList.remove('page-dive-out', 'page-dive-in');
        document.querySelectorAll('.page-dive-flash').forEach(function (n) {
          n.parentNode && n.parentNode.removeChild(n);
        });
        try { sessionStorage.removeItem('pf-dive'); } catch (_) {}
      }
    });
  }

  // ---------- 3D systems (case-study pages) ----------
  //
  // Slim mirror of the four big 3D systems on the home page, scoped to the
  // case-study DOM. Keeps the visual language consistent after a dive so
  // the user doesn't land in a flat space.
  //   1. Cursor spotlight (global, pointer-tracked)
  //   2. Magnetic card tilt (.cs-metric, .cs-code, .cs-og-preview, etc.)
  //   3. Scroll-reveal 3D for .cs-section
  //   4. 3D heading entry for section h2's
  //
  // All four are skipped under prefers-reduced-motion or (hover:none).
  if (!prefersReduced) {
    var isTouchOnly = window.matchMedia &&
                       window.matchMedia('(hover: none)').matches;

    // 1. Cursor spotlight
    (function cursorSpotlight() {
      if (isTouchOnly) return;
      document.documentElement.classList.add('has-spotlight');
      document.documentElement.style.setProperty('--spot-x', '50vw');
      document.documentElement.style.setProperty('--spot-y', '50vh');
      var targetX = window.innerWidth * 0.5;
      var targetY = window.innerHeight * 0.5;
      var curX = targetX, curY = targetY;
      var raf = 0;
      function tick() {
        curX += (targetX - curX) * 0.18;
        curY += (targetY - curY) * 0.18;
        document.documentElement.style.setProperty('--spot-x', curX.toFixed(1) + 'px');
        document.documentElement.style.setProperty('--spot-y', curY.toFixed(1) + 'px');
        if (Math.abs(targetX - curX) > 0.3 || Math.abs(targetY - curY) > 0.3) {
          raf = requestAnimationFrame(tick);
        } else {
          raf = 0;
        }
      }
      window.addEventListener('pointermove', function (e) {
        targetX = e.clientX; targetY = e.clientY;
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
      var lastScrollY = window.scrollY;
      window.addEventListener('scroll', function () {
        var dy = window.scrollY - lastScrollY;
        lastScrollY = window.scrollY;
        targetY += dy * 0.5;
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
    })();

    // 2. Magnetic 3D tilt on case-study cards
    (function cardTilt3d() {
      if (isTouchOnly) return;
      var SEL = '.cs-metric, .cs-code, .cs-og-preview, .cs-cta, ' +
                '.cs-pager__link, .cs-shot-real, .cs-outcome-row';
      var MAX_TILT = 7;
      var LIFT = 5;
      document.querySelectorAll(SEL).forEach(function (el) {
        el.classList.add('cs-tilt3d');
        var raf = 0;
        var lastX = 0, lastY = 0;
        function apply() {
          raf = 0;
          var r = el.getBoundingClientRect();
          var px = (lastX - r.left) / r.width;
          var py = (lastY - r.top)  / r.height;
          var rx = (0.5 - py) * MAX_TILT * 2;
          var ry = (px - 0.5) * MAX_TILT * 2;
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

    // 3. Scroll-reveal 3D on .cs-section
    (function scrollReveal3d() {
      if (!('IntersectionObserver' in window)) return;
      var nodes = document.querySelectorAll('.cs-section');
      if (!nodes.length) return;
      nodes.forEach(function (n, i) {
        n.classList.add('cs-reveal3d');
        n.style.setProperty('--reveal-delay', Math.min(i, 4) * 70 + 'ms');
      });
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (ent) {
          if (ent.isIntersecting) {
            ent.target.classList.add('cs-reveal3d-in');
            obs.unobserve(ent.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      nodes.forEach(function (n) { obs.observe(n); });
    })();

    // 5. Scroll-state class — pauses expensive paint during scroll
    (function scrollStateClass() {
      var root = document.documentElement;
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

    // 4. 3D heading entry on .cs-section h2
    (function heading3d() {
      if (!('IntersectionObserver' in window)) return;
      var headings = document.querySelectorAll('.cs-section h2');
      if (!headings.length) return;
      headings.forEach(function (h) { h.classList.add('cs-heading3d'); });
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (ent) {
          if (ent.isIntersecting) {
            ent.target.classList.add('cs-heading3d-in');
            obs.unobserve(ent.target);
          }
        });
      }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });
      headings.forEach(function (h) { obs.observe(h); });
    })();
  }

  // ---------- Reading progress bar ----------
  //
  // Top-of-viewport horizontal bar that fills as the user scrolls through
  // the article. Useful nav signal — at a glance the reader knows how
  // much is left. Respects reduced-motion only for the easing; the bar
  // itself stays visible (it's informational, not decorative).
  (function readingProgress() {
    var bar = document.createElement('div');
    bar.className = 'cs-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<i class="cs-progress__fill"></i>';
    document.body.appendChild(bar);
    var fill = bar.querySelector('.cs-progress__fill');

    var ticking = false;
    function update() {
      ticking = false;
      var h = document.documentElement;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      var p = Math.min(1, Math.max(0, h.scrollTop / max));
      fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      // Hide entirely when at the very top (cleaner look)
      bar.classList.toggle('is-active', p > 0.005);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  // ---------- TOC anchor pulse ----------
  //
  // When the reader clicks a TOC link, the target section briefly pulses
  // with a cyan outline glow — visual confirmation that the right
  // destination was reached. Uses box-shadow rather than transform so it
  // doesn't clobber any 3D heading entry already in flight.
  (function tocPulse() {
    if (prefersReduced) return;
    var toc = document.querySelector('.cs-toc__nav');
    if (!toc) return;
    toc.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var hash = a.getAttribute('href');
      if (!hash || hash === '#') return;
      var target;
      try { target = document.querySelector(hash); } catch (_) { return; }
      if (!target) return;

      target.classList.remove('is-pulse-target');
      // Force reflow so the animation restarts even if the same link is
      // clicked repeatedly.
      // eslint-disable-next-line no-unused-expressions
      target.offsetWidth;
      target.classList.add('is-pulse-target');
      setTimeout(function () {
        target.classList.remove('is-pulse-target');
      }, 1400);
    });
  })();

  // ---------- "last touched" stamp ----------
  //
  // Looks for any element matching [data-cs-slug] on the page, fetches the
  // most recent commit on case-studies/{slug}.html from the public GitHub
  // API, and writes a relative-time string ("3 days ago", "last week").
  //
  // localStorage-cached with a 1-hour TTL so a binge-reading EM hitting all
  // 8 case studies in a row burns just one API call per file per hour.

  var GH_OWNER = 'kon2raya24';
  var GH_REPO = 'portfolio';
  var CACHE_PREFIX = 'cs.lastTouched.';
  var CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  function relativeTime(iso) {
    var then = new Date(iso).getTime();
    if (!isFinite(then)) return null;
    var diffMs = Date.now() - then;
    var sec = Math.floor(diffMs / 1000);
    if (sec < 60) return 'just now';
    var min = Math.floor(sec / 60);
    if (min < 60) return min + ' min ago';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' hr ago';
    var day = Math.floor(hr / 24);
    if (day === 1) return 'yesterday';
    if (day < 7) return day + ' days ago';
    if (day < 14) return 'last week';
    var wk = Math.floor(day / 7);
    if (wk < 5) return wk + ' weeks ago';
    var mo = Math.floor(day / 30);
    if (mo === 1) return 'last month';
    if (mo < 12) return mo + ' months ago';
    var yr = Math.floor(day / 365);
    return yr === 1 ? '1 year ago' : yr + ' years ago';
  }

  function getCached(key) {
    try {
      var raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !obj.iso || !obj.fetchedAt) return null;
      if (Date.now() - obj.fetchedAt > CACHE_TTL_MS) return null;
      return obj.iso;
    } catch (_) { return null; }
  }

  function setCached(key, iso) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
        iso: iso,
        fetchedAt: Date.now()
      }));
    } catch (_) { /* quota, private mode, whatever — ignore */ }
  }

  function fetchLastCommit(slug) {
    var path = encodeURIComponent('case-studies/' + slug + '.html');
    var url = 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO +
              '/commits?path=' + path + '&per_page=1';
    return fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('github ' + r.status);
        return r.json();
      })
      .then(function (commits) {
        if (!Array.isArray(commits) || !commits.length) return null;
        var iso = commits[0].commit && commits[0].commit.author &&
                  commits[0].commit.author.date;
        return iso || null;
      });
  }

  function paintLastTouched(el, iso) {
    var rel = relativeTime(iso);
    if (!rel) return;
    el.removeAttribute('data-loading');
    el.setAttribute('datetime', iso);
    el.setAttribute('title', new Date(iso).toLocaleString());
    el.textContent = rel;
  }

  function init() {
    var targets = document.querySelectorAll('[data-cs-slug]');
    if (!targets.length) return;

    targets.forEach(function (el) {
      var slug = el.getAttribute('data-cs-slug');
      if (!slug) return;

      // 1. Try cache first
      var cached = getCached(slug);
      if (cached) {
        paintLastTouched(el, cached);
        return;
      }

      // 2. Otherwise fetch
      el.setAttribute('data-loading', 'true');
      el.textContent = 'fetching...';
      fetchLastCommit(slug)
        .then(function (iso) {
          if (!iso) {
            el.textContent = '—';
            el.removeAttribute('data-loading');
            return;
          }
          setCached(slug, iso);
          paintLastTouched(el, iso);
        })
        .catch(function () {
          // Rate limited or offline — fail quiet
          el.textContent = '—';
          el.removeAttribute('data-loading');
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// =======================================================
//  Calm-mode toggle
//
//  Injects a "MOTION: ON" / "MOTION: OFF" button into the
//  viewport-HUD readout. Click toggles
//  data-motion="reduced" on <html>; CSS kills all animations
//  when that attribute is set. Preference persists to
//  localStorage.
//
//  Duplicated in tech-fx.js so the toggle works on both
//  index.html (which loads tech-fx.js) and case studies
//  (which load case-study.js). Each guards against
//  double-injection.
// =======================================================
(function () {
  'use strict';
  var STORAGE_KEY = 'portfolio.motion';

  // Apply saved preference BEFORE any motion can play. Safe to run
  // before DOMContentLoaded because we only touch <html>'s attribute.
  try {
    var pref = localStorage.getItem(STORAGE_KEY);
    if (pref === 'reduced') {
      document.documentElement.setAttribute('data-motion', 'reduced');
    }
  } catch (e) { /* private mode / storage disabled */ }

  function inject() {
    if (document.querySelector('.motion-toggle')) return;

    var isReduced = document.documentElement.getAttribute('data-motion') === 'reduced';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'motion-toggle motion-toggle--standalone';
    btn.setAttribute('aria-pressed', isReduced ? 'true' : 'false');
    btn.setAttribute('aria-label', 'Toggle reduced motion');
    btn.innerHTML =
      '<span class="motion-toggle__dot" aria-hidden="true"></span>' +
      '<span class="motion-toggle__label">motion: ' + (isReduced ? 'off' : 'on') + '</span>';

    btn.addEventListener('click', function () {
      var nowReduced = document.documentElement.getAttribute('data-motion') !== 'reduced';
      if (nowReduced) {
        document.documentElement.setAttribute('data-motion', 'reduced');
      } else {
        document.documentElement.removeAttribute('data-motion');
      }
      btn.setAttribute('aria-pressed', nowReduced ? 'true' : 'false');
      btn.querySelector('.motion-toggle__label').textContent = 'motion: ' + (nowReduced ? 'off' : 'on');
      try {
        localStorage.setItem(STORAGE_KEY, nowReduced ? 'reduced' : 'full');
      } catch (e) {}
    });

    // Standalone position — fixed at top-right where my readout used to be.
    // (Case studies don't have the .hud widget that tech-fx.js builds.)
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

// =======================================================
//  Reading progress bar — thin gradient strip at top:0 of
//  viewport that fills as you scroll the document. Cheap
//  feedback for long writeups (wms-v2, ai-engineer, hris).
//  Pure CSS bar; this just updates the --read-progress
//  custom property on the root element.
// =======================================================
(function () {
  'use strict';
  // The progress bar's CSS transition handles prefers-reduced-motion via
  // @media (prefers-reduced-motion: reduce) in case-study.css — no JS
  // smooth-scrolls happen in this IIFE so no JS-side check needed here.

  function init() {
    if (document.querySelector('.cs-progress')) return; // already injected
    var bar = document.createElement('div');
    bar.className = 'cs-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var ticking = false;
    function compute() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      document.documentElement.style.setProperty('--read-progress', p);
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(compute);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    compute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// =======================================================
//  Share row — injects COPY LINK / LINKEDIN / X buttons
//  just above the prev/next pager on every case study so
//  readers can forward the page in one click. Pure JS, no
//  external scripts pulled.
// =======================================================
(function () {
  'use strict';

  function init() {
    var pager = document.querySelector('.cs-pager');
    if (!pager) return;
    if (document.querySelector('.cs-share')) return; // already injected

    var url = window.location.href.split('#')[0];
    var title = (document.title || 'Case study').replace(/\s*—.*$/, ''); // strip "— Lemmuel Turaya"

    var share = document.createElement('div');
    share.className = 'cs-share';
    share.setAttribute('aria-label', 'Share this case study');
    share.innerHTML =
      '<span class="cs-share__label">// share:</span>' +
      '<button type="button" class="cs-share__btn cs-share__btn--copy" aria-label="Copy link to clipboard">copy link</button>' +
      '<a class="cs-share__btn cs-share__btn--linkedin" href="https://www.linkedin.com/sharing/share-offsite/?url=' +
        encodeURIComponent(url) +
        '" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">linkedin</a>' +
      '<a class="cs-share__btn cs-share__btn--x" href="https://twitter.com/intent/tweet?text=' +
        encodeURIComponent(title + ' — Lemmuel Turaya') +
        '&url=' + encodeURIComponent(url) +
        '" target="_blank" rel="noopener noreferrer" aria-label="Share on X">x</a>';

    pager.parentNode.insertBefore(share, pager);

    var copyBtn = share.querySelector('.cs-share__btn--copy');
    copyBtn.addEventListener('click', function () {
      var text = url;
      var done = function () {
        var original = 'copy link';
        copyBtn.textContent = 'copied ✓';
        copyBtn.setAttribute('data-state', 'ok');
        clearTimeout(copyBtn._t);
        copyBtn._t = setTimeout(function () {
          copyBtn.textContent = original;
          copyBtn.removeAttribute('data-state');
        }, 1400);
      };
      var fail = function () {
        copyBtn.textContent = 'failed';
        copyBtn.setAttribute('data-state', 'fail');
        clearTimeout(copyBtn._t);
        copyBtn._t = setTimeout(function () {
          copyBtn.textContent = 'copy link';
          copyBtn.removeAttribute('data-state');
        }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(fail);
      } else {
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.top = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy') ? done() : fail();
          document.body.removeChild(ta);
        } catch (e) { fail(); }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// =======================================================
//  Code-block copy buttons
//
//  Finds every .cs-code block, injects a small hex "COPY"
//  button into the chrome header. Click → copy the inner
//  <pre> text content to the clipboard, flash "COPIED" for
//  ~1.4s, then revert. Falls back to execCommand on browsers
//  without the modern Clipboard API.
// =======================================================
(function () {
  'use strict';

  function init() {
    var blocks = document.querySelectorAll('.cs-code');
    if (!blocks.length) return;

    blocks.forEach(function (block) {
      var chrome = block.querySelector('.cs-code__chrome');
      var pre = block.querySelector('pre');
      if (!chrome || !pre) return;
      if (chrome.querySelector('.cs-code__copy')) return; // already injected

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cs-code__copy';
      btn.setAttribute('aria-label', 'Copy code to clipboard');
      btn.textContent = 'COPY';

      btn.addEventListener('click', function () {
        var text = pre.textContent || '';
        copyText(text).then(function () {
          flash(btn, 'COPIED', true);
        }).catch(function () {
          flash(btn, 'FAILED', false);
        });
      });

      chrome.appendChild(btn);
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback: hidden textarea + execCommand
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject();
      } catch (e) { reject(e); }
    });
  }

  function flash(btn, label, ok) {
    var original = 'COPY';
    btn.textContent = label;
    btn.setAttribute('data-state', ok ? 'ok' : 'fail');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.textContent = original;
      btn.removeAttribute('data-state');
    }, 1400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// =======================================================
//  Section-heading reveal — IntersectionObserver toggles
//  .is-revealed on every .cs-section h2 once it enters the
//  viewport. CSS in case-study.css handles the draw animation.
// =======================================================
(function () {
  'use strict';

  function reveal(el) {
    el.classList.add('is-revealed');
  }

  function init() {
    var headings = document.querySelectorAll('.cs-section h2');
    if (!headings.length) return;

    // No IntersectionObserver? Reveal everything immediately.
    if (!('IntersectionObserver' in window)) {
      headings.forEach(reveal);
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.4,
      // Slight bottom margin so the underline doesn't draw the instant the
      // heading peeks in — wait until it's actually being read.
      rootMargin: '0px 0px -8% 0px'
    });

    headings.forEach(function (h) { obs.observe(h); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
