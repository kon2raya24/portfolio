/* portfolio service worker
   strategy:
     - same-origin static assets: stale-while-revalidate
     - same-origin HTML pages: stale-while-revalidate (cap), falls back to cached index
     - cross-origin api calls (github/counterapi): network-only, no caching
*/
const VERSION = 'pf-v17-2026-05-14';
const STATIC_CACHE = 'pf-static-' + VERSION;
const PAGE_CACHE   = 'pf-pages-'  + VERSION;

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/tech-fx.css',
  '/css/animate.css',
  '/css/icomoon.css',
  '/css/bootstrap.css',
  '/css/case-study.css',
  '/js/main.js',
  '/js/tech-fx.js',
  '/js/case-study.js',
  '/images/logo.png',
  '/images/logo-192.png',
  '/manifest.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return Promise.all(
        STATIC_PRECACHE.map(function (url) {
          return cache.add(url).catch(function () { /* swallow individual failures */ });
        })
      );
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) {
          return k.indexOf('pf-') === 0 && k !== STATIC_CACHE && k !== PAGE_CACHE;
        }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request).then(function (cached) {
      var fetched = fetch(request).then(function (response) {
        if (response && response.status === 200 && response.type === 'basic') {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(function () { return cached; });
      return cached || fetched;
    });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  // cross-origin: don't intercept (api calls, fonts.googleapis, etc — let browser handle)
  if (url.origin !== self.location.origin) return;

  var accept = req.headers.get('accept') || '';
  var isHTML = req.mode === 'navigate' || accept.indexOf('text/html') !== -1;

  if (isHTML) {
    event.respondWith(
      staleWhileRevalidate(req, PAGE_CACHE).catch(function () {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // static assets (css, js, images, etc)
  event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
});
