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
