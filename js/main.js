/* portfolio/js/main.js
   Vanilla replacement for the jQuery + Stellar + Waypoints + Easing + Bootstrap-JS stack.
   No external deps. Uses IntersectionObserver / requestAnimationFrame / matchMedia.
*/
(function () {
  'use strict';

  function isMobile() {
    return /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  }

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // .js-fullheight — pin to viewport height. Skipped on mobile to avoid the
  // iOS Safari address-bar resize jitter (matches the original's behavior).
  function fullHeight() {
    if (isMobile()) return;
    var els = document.querySelectorAll('.js-fullheight');
    if (!els.length) return;
    function apply() {
      var h = window.innerHeight + 'px';
      els.forEach(function (el) { el.style.height = h; });
    }
    apply();
    window.addEventListener('resize', apply, { passive: true });
  }

  // Background parallax — replaces $(window).stellar() for [data-stellar-background-ratio]
  function parallax() {
    if (prefersReduced) return;
    var els = document.querySelectorAll('[data-stellar-background-ratio]');
    if (!els.length) return;
    var ticking = false;
    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      els.forEach(function (el) {
        var ratio = parseFloat(el.getAttribute('data-stellar-background-ratio')) || 0.5;
        el.style.backgroundPositionY = (-y * ratio) + 'px';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  // Scroll-triggered fade-in for .animate-box — replaces jquery.waypoints.
  // Mirrors the original's staggered-cascade behavior (100ms between siblings)
  // by batching all entries that intersect in the same observer tick.
  function animateBoxes() {
    var boxes = document.querySelectorAll('.animate-box');
    if (!boxes.length) return;
    if (!('IntersectionObserver' in window)) {
      boxes.forEach(function (el) { el.classList.add('fadeInUp', 'animated-fast'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      var batch = [];
      entries.forEach(function (en) {
        if (en.isIntersecting && !en.target.classList.contains('animated-fast')) {
          batch.push(en.target);
          io.unobserve(en.target);
        }
      });
      batch.forEach(function (el, i) {
        setTimeout(function () {
          var effect = el.getAttribute('data-animate-effect');
          var cls = 'fadeInUp';
          if (effect === 'fadeIn') cls = 'fadeIn';
          else if (effect === 'fadeInLeft') cls = 'fadeInLeft';
          else if (effect === 'fadeInRight') cls = 'fadeInRight';
          el.classList.add(cls, 'animated-fast');
        }, i * 100);
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.01 });
    boxes.forEach(function (el) { io.observe(el); });
  }

  // Back-to-top button — .js-top is the floating wrapper, .js-gotop is the link.
  function goToTop() {
    var btn = document.querySelector('.js-gotop');
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
    }
    var wrap = document.querySelector('.js-top');
    if (!wrap) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        wrap.classList.toggle('active', (window.pageYOffset || document.documentElement.scrollTop) > 200);
        ticking = false;
      });
    }, { passive: true });
  }

  // .fh5co-loader fade-out — replaces $(loader).fadeOut('slow') (default ~600ms).
  function loaderPage() {
    var loader = document.querySelector('.fh5co-loader');
    if (!loader) return;
    loader.style.transition = 'opacity 0.6s';
    loader.style.opacity = '0';
    setTimeout(function () { loader.style.display = 'none'; }, 650);
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    animateBoxes();
    goToTop();
    loaderPage();
    fullHeight();
    parallax();
  });
}());
