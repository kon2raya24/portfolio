// js/case-study.js
//
// Per-case-study client-side enhancements that don't belong in the main
// portfolio tech-fx.js bundle (which is index.html-only).
//
// Currently:
//   - last-touched stamp populated from the GitHub commits API
//
// Future home for:
//   - reading progress bar
//   - TOC anchor pulse on click

(function () {
  'use strict';

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
//  Reading progress bar — thin gradient strip at top:0 of
//  viewport that fills as you scroll the document. Cheap
//  feedback for long writeups (wms-v2, ai-engineer, hris).
//  Pure CSS bar; this just updates the --read-progress
//  custom property on the root element.
// =======================================================
(function () {
  'use strict';
  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
