/* ==========================================================================
   Front page effects (v8). Vanilla, no dependencies.
   Behaviour that the page needs (nav, filters, telemetry) lives in site.js;
   this file is the fun layer. Every effect checks reduced motion and
   fine-pointer support, and the page reads fine if this file never runs.
   ========================================================================== */
(function () {
	'use strict';

	var d = document, h = d.documentElement, w = window;
	var reduced = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var finePointer = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
	function $(s, r) { return (r || d).querySelector(s); }
	function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
	function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
	function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
	function onScroll(fn) {
		var queued = false;
		function run() { queued = false; fn(); }
		w.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(run); } }, { passive: true });
		w.addEventListener('resize', fn);
		fn();
	}

	/* 1. Start the hero entrance (the <head> script has a failsafe for this). */
	h.classList.add('is-ready');

	/* ---------------------------------------------------------------------
	   2. Cursor blob that trails the pointer and swells over links.
	   --------------------------------------------------------------------- */
	if (finePointer && !reduced) (function cursor() {
		var c = d.createElement('div');
		c.className = 'cursor';
		c.setAttribute('aria-hidden', 'true');
		d.body.appendChild(c);
		var x = -100, y = -100, cx = x, cy = y;
		d.addEventListener('pointermove', function (e) {
			x = e.clientX; y = e.clientY;
			h.style.setProperty('--mx', x + 'px');
			h.style.setProperty('--my', y + 'px');
			var hot = e.target.closest && e.target.closest('a, button, summary, input, textarea, select, label, canvas, [data-tilt]');
			c.classList.toggle('is-hover', !!hot);
			c.classList.toggle('is-view', !!(e.target.closest && e.target.closest('.case, .project a')));
		}, { passive: true });
		d.addEventListener('pointerdown', function () { c.classList.add('is-down'); });
		d.addEventListener('pointerup', function () { c.classList.remove('is-down'); });
		d.addEventListener('pointerleave', function () { x = y = -100; });
		d.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { x = y = -100; cx = cy = -100; } });
		(function loop() {
			cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
			c.style.setProperty('--cx', cx.toFixed(1) + 'px');
			c.style.setProperty('--cy', cy.toFixed(1) + 'px');
			requestAnimationFrame(loop);
		})();
	})();

	/* ---------------------------------------------------------------------
	   3. Portrait leans toward the pointer; cards glow where the pointer is;
	      project cards tilt; primary buttons are magnetic.
	   --------------------------------------------------------------------- */
	if (finePointer && !reduced) {
		var portrait = $('[data-follow]');
		if (portrait) d.addEventListener('pointermove', function (e) {
			var nx = e.clientX / w.innerWidth - 0.5, ny = e.clientY / w.innerHeight - 0.5;
			portrait.style.setProperty('--ry', (nx * 14).toFixed(2) + 'deg');
			portrait.style.setProperty('--rx', (-ny * 10).toFixed(2) + 'deg');
			portrait.style.setProperty('--tx', (nx * 18).toFixed(1) + 'px');
			portrait.style.setProperty('--ty', (ny * 12).toFixed(1) + 'px');
		}, { passive: true });

		d.addEventListener('pointermove', function (e) {
			var el = e.target.closest && e.target.closest('.card, .project a, .case');
			if (!el) return;
			var r = el.getBoundingClientRect();
			var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
			el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
			el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
			if (el.matches('.project a, .service, .case')) {
				var k = el.matches('.project a') ? 1 : 0.6;
				el.style.setProperty('--ry', ((px - 0.5) * 10 * k).toFixed(2) + 'deg');
				el.style.setProperty('--rx', ((0.5 - py) * 8 * k).toFixed(2) + 'deg');
			}
		}, { passive: true });
		$$('.project a, .service, .case').forEach(function (a) {
			a.addEventListener('pointerleave', function () { a.style.setProperty('--rx', '0deg'); a.style.setProperty('--ry', '0deg'); });
		});

		$$('[data-magnetic], .btn, .nav__ask, .filter').forEach(function (b) {
			b.addEventListener('pointermove', function (e) {
				var r = b.getBoundingClientRect();
				b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px)';
			});
			b.addEventListener('pointerleave', function () { b.style.transform = ''; });
		});

		/* nav links scramble on hover; width is locked so neighbours don't shift */
		$$('.nav__links > a').forEach(function (a) {
			var last = 0;
			a.addEventListener('pointerenter', function () {
				if (Date.now() - last < 800) return;
				last = Date.now();
				a.style.width = a.getBoundingClientRect().width + 'px';
				scramble(a, function () { a.style.width = ''; });
			});
		});
	}

	/* ---------------------------------------------------------------------
	   4. Stats count up once they are on screen.
	   --------------------------------------------------------------------- */
	(function counters() {
		var els = $$('[data-count]');
		if (reduced || !els.length || !('IntersectionObserver' in w)) return;
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (!en.isIntersecting) return;
				io.unobserve(en.target);
				var el = en.target, m = el.textContent.match(/^(\d+)(.*)$/);
				if (!m) return;
				var end = +m[1], suffix = m[2], t0 = null;
				setTimeout(function () {
					requestAnimationFrame(function step(t) {
						if (t0 === null) t0 = t;
						var p = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(2, -10 * p);
						el.textContent = Math.round(end * (p === 1 ? 1 : e)) + suffix;
						if (p < 1) requestAnimationFrame(step);
					});
				}, h.classList.contains('is-ready') ? 200 : 1200);
			});
		}, { threshold: 0.6 });
		els.forEach(function (el) { io.observe(el); });
	})();

	/* ---------------------------------------------------------------------
	   5. Scroll-driven: statement words light up, timeline line fills,
	      work cards slide sideways while their section is pinned.
	   --------------------------------------------------------------------- */
	(function statement() {
		var el = $('[data-words]');
		if (!el) return;
		/* wrap words for the visual effect; aria-label keeps one clean string */
		el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
		el.innerHTML = el.innerHTML.split(/(\s+)/).map(function (part) {
			return /^\s+$/.test(part) || !part ? part : '<span class="wd" aria-hidden="true">' + part + '</span>';
		}).join('');
		var words = $$('.wd', el);
		if (reduced) { words.forEach(function (s) { s.classList.add('is-lit'); }); return; }
		onScroll(function () {
			var r = el.getBoundingClientRect(), vh = w.innerHeight;
			var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
			var n = Math.round(p * words.length);
			words.forEach(function (s, i) { s.classList.toggle('is-lit', i < n); });
		});
	})();

	(function timeline() {
		var tl = $('.timeline');
		if (!tl) return;
		var items = $$(':scope > li', tl);
		if (reduced) { tl.style.setProperty('--tp', 1); items.forEach(function (li) { li.classList.add('is-lit'); }); return; }
		onScroll(function () {
			var r = tl.getBoundingClientRect(), mark = w.innerHeight * 0.6;
			tl.style.setProperty('--tp', clamp((mark - r.top) / r.height, 0, 1).toFixed(3));
			items.forEach(function (li) { li.classList.toggle('is-lit', li.getBoundingClientRect().top + 24 < mark); });
		});
	})();

	(function horizontalWork() {
		var wrap = $('[data-hscroll]'), track = $('[data-hscroll-track]');
		if (!wrap || !track || reduced) return;
		var mq = w.matchMedia('(min-width: 861px)');
		var pin = track.parentNode, dist = 0, count = track.children.length;
		var meta = d.createElement('div');
		meta.className = 'hs-meta';
		meta.setAttribute('aria-hidden', 'true');
		meta.innerHTML = 'N&deg;<b>01</b>/ ' + String(count).padStart(2, '0') + '<span class="hs-bar"><i></i></span>';
		pin.appendChild(meta);
		/* giant outlined title drifting behind the cards, slower than they move */
		var ghost = d.createElement('div');
		ghost.className = 'hs-ghost';
		ghost.setAttribute('aria-hidden', 'true');
		ghost.innerHTML = 'Selected <em>work</em> &middot; shipped';
		pin.appendChild(ghost);
		var num = meta.querySelector('b'), cards = Array.prototype.slice.call(track.children), mids = [];
		/* the transform does the moving; stop focus/scroll-restore from scrolling the pin too */
		pin.addEventListener('scroll', function () { if (mq.matches && pin.scrollLeft) pin.scrollLeft = 0; });
		function measure() {
			h.classList.toggle('hs-on', mq.matches);
			if (!mq.matches) { wrap.style.height = ''; track.style.removeProperty('--hx'); cards.forEach(function (c) { c.style.removeProperty('--focus'); }); return; }
			pin.scrollLeft = 0;
			dist = Math.max(0, track.scrollWidth - w.innerWidth);
			wrap.style.height = (w.innerHeight + dist) + 'px';
			mids = cards.map(function (c) { return c.offsetLeft + c.offsetWidth / 2; });
			update();
		}
		function update() {
			if (!mq.matches) return;
			var p = clamp(-wrap.getBoundingClientRect().top / (dist || 1), 0, 1), vw = w.innerWidth;
			track.style.setProperty('--hx', (-p * dist).toFixed(1) + 'px');
			pin.style.setProperty('--hp', p.toFixed(3));
			/* the card nearest the middle is in focus; the rest recede */
			cards.forEach(function (c, i) {
				c.style.setProperty('--focus', (1 - clamp(Math.abs(mids[i] - p * dist - vw / 2) / (vw * 0.7), 0, 1)).toFixed(3));
			});
			num.textContent = String(Math.min(count, Math.floor(p * count) + 1)).padStart(2, '0');
		}
		w.addEventListener('resize', measure);
		w.addEventListener('load', measure);
		onScroll(update);
		measure();
		/* keyboard users tabbing into an off-screen card: scroll it into view */
		track.addEventListener('focusin', function (e) {
			if (!mq.matches) return;
			var card = e.target.closest('.case');
			if (!card) return;
			var target = wrap.getBoundingClientRect().top + w.scrollY + clamp(card.offsetLeft - w.innerWidth * 0.2, 0, dist);
			w.scrollTo({ top: target });
		});
	})();

	/* ---------------------------------------------------------------------
	   6. Section labels decode from random glyphs when they scroll in.
	   --------------------------------------------------------------------- */
	function scramble(el, done) {
		var GLYPHS = '!<>-_\\/[]{}=+*^?#01', nodes = [], left = 0;
		(function walk(n) { n.childNodes.forEach(function (c) { if (c.nodeType === 3) nodes.push(c); else if (!c.classList || !c.classList.contains('live')) walk(c); }); })(el);
		nodes.forEach(function (node) {
			var text = node.nodeValue, t0 = null, dur = Math.min(900, 300 + text.length * 22);
			left++;
			requestAnimationFrame(function step(t) {
				if (t0 === null) t0 = t;
				var p = (t - t0) / dur, out = '';
				for (var i = 0; i < text.length; i++) {
					out += (p * text.length > i || text[i] === ' ') ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
				}
				node.nodeValue = p >= 1 ? text : out;
				if (p < 1) requestAnimationFrame(step); else if (!--left && done) done();
			});
		});
	}
	(function decode() {
		var marks = $$('.sec__mark');
		if (reduced || !marks.length || !('IntersectionObserver' in w)) return;
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); scramble(en.target); } });
		}, { rootMargin: '0px 0px -15% 0px' });
		marks.forEach(function (m) { io.observe(m); });
	})();

	/* ---------------------------------------------------------------------
	   6b. Split identity portrait: the right side of the divider shows the
	       same photo rendered as live ASCII. The divider follows the cursor
	       (touch: a slow sweep). Adapted from adhamdannaway.com.
	   --------------------------------------------------------------------- */
	(function splitPortrait() {
		var fig = $('[data-split]'), cv = $('[data-ascii]'), img = fig && $('img', fig);
		if (!fig || !cv || !img || !cv.getContext) return;
		var RAMP = ' .:-=+*#%@', GLYPHS = '01<>/{}[]=+*#$%&', grid = [], cols = 0, rows = 0, cell = 0, rowH = 0, size = 0, ctx = cv.getContext('2d');
		function sample() {
			size = fig.getBoundingClientRect().width;
			if (!size || !img.naturalWidth) return false;
			var dpr = Math.min(2, w.devicePixelRatio || 1);
			cv.width = size * dpr; cv.height = size * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			cols = Math.round(size / 6.4); cell = size / cols; rowH = cell * 1.7; rows = Math.ceil(size / rowH);
			var off = d.createElement('canvas'), o = off.getContext('2d');
			off.width = cols; off.height = rows;
			o.drawImage(img, 0, 0, cols, rows);
			var px = o.getImageData(0, 0, cols, rows).data;
			grid = [];
			for (var i = 0; i < cols * rows; i++) {
				var lum = (px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114) / 255;
				grid.push(clamp((lum - 0.07) * 1.45, 0, 1));
			}
			return true;
		}
		/* noise: share of characters drawn as random glyphs; during the intro
		   it starts at 1 (a field of static) and falls to 0 as the face resolves */
		function draw(noise) {
			ctx.fillStyle = '#0b0a0f';
			ctx.fillRect(0, 0, size, size);
			ctx.font = '500 ' + (cell * 1.55).toFixed(1) + 'px "JetBrains Mono", monospace';
			ctx.textBaseline = 'top';
			for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
				var v = grid[y * cols + x], k = Math.round(v * (RAMP.length - 1));
				var a = 0.3 + v * 0.7;
				if (noise > 0.08 && Math.random() < noise * (k ? 1 : 0.85)) {
					/* static: same glyph weight everywhere, so no silhouette shows yet */
					ctx.fillStyle = 'rgba(196,181,253,' + ((k ? a * (1 - noise) : 0) + 0.45 * noise).toFixed(2) + ')';
					ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x * cell, y * rowH);
					continue;
				}
				if (!k) continue;
				if (noise && Math.random() < noise) k = 1 + ((Math.random() * (RAMP.length - 1)) | 0);
				ctx.fillStyle = 'rgba(196,181,253,' + a.toFixed(2) + ')';
				ctx.fillText(RAMP[k], x * cell, y * rowH);
			}
		}
		function build() { if (sample()) draw(0); }
		if (img.complete) build(); else img.addEventListener('load', build);
		var t;
		w.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(build, 150); });
		if (reduced) return;

		/* intro: static resolves into the face (1.4s), then the divider sweeps
		   from the left edge to the middle, uncovering the photo (0.9s). After that the divider
		   follows the cursor over the hero, otherwise it rests at 50%. */
		var DECODE = 1400, SWEEP = 900, introAt = null, introDone = false;
		var stage = $('.hero__stage') || fig, target = 50, cur = 0, over = false, visible = true;
		fig.style.setProperty('--split', '0%');
		fig.classList.add('is-decoding');
		if (finePointer) {
			stage.addEventListener('pointermove', function (e) {
				var r = fig.getBoundingClientRect();
				over = e.clientX > r.left - 40 && e.clientX < r.right + 40;
				target = over ? clamp((e.clientX - r.left) / r.width * 100, 6, 94) : 50;
			});
			stage.addEventListener('pointerleave', function () { over = false; target = 50; });
		}
		if ('IntersectionObserver' in w) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(fig);
		var lastShimmer = 0;
		function loop(now) {
			if (!introDone) {
				if (grid.length) {
					if (introAt === null) introAt = now;
					var t = now - introAt;
					if (t < DECODE) { var q = t / DECODE; draw(q < 0.25 ? 1 : 1 - Math.pow((q - 0.25) / 0.75, 1.4)); }
					else if (t < DECODE + SWEEP) {
						var e = 1 - Math.pow(1 - (t - DECODE) / SWEEP, 3);
						cur = 50 * e;
						fig.classList.remove('is-decoding');
						fig.style.setProperty('--split', cur.toFixed(2) + '%');
						if (t - DECODE < 40) draw(0);
					} else {
						introDone = true; cur = 50;
						fig.classList.remove('is-decoding');
						fig.style.setProperty('--split', '50%');
					}
				}
			} else if (visible) {
				if (!finePointer) target = 50 + 32 * Math.sin((now - introAt - DECODE - SWEEP) / 1600);
				cur += (target - cur) * 0.14;
				fig.style.setProperty('--split', cur.toFixed(2) + '%');
				if (now - lastShimmer > 140) { lastShimmer = now; draw(0.035); }
			}
			requestAnimationFrame(loop);
		}
		/* start on a real frame timestamp: calling loop(0) directly made the
		   first measured interval huge and skipped the intro when the photo
		   was already cached */
		requestAnimationFrame(loop);
	})();

	/* ---------------------------------------------------------------------
	   6c. Section index: numbered lines on the left edge; the current
	       section's line grows. Adapted from brittanychiang.com.
	   --------------------------------------------------------------------- */
	(function sectionIndex() {
		var secs = $$('main > section.sec[id]');
		if (!secs.length || !('IntersectionObserver' in w)) return;
		var nav = d.createElement('nav');
		nav.className = 'sindex';
		nav.setAttribute('aria-label', 'Page sections');
		nav.innerHTML = '<ol>' + secs.map(function (sec, i) {
			return '<li><a href="#' + sec.id + '"><b>' + String(i + 1).padStart(2, '0') + '</b><span>' + esc(sec.id) + '</span></a></li>';
		}).join('') + '</ol>';
		d.body.appendChild(nav);
		var links = $$('a', nav);
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (!en.isIntersecting) return;
				links.forEach(function (a) {
					if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
				});
			});
		}, { rootMargin: '-45% 0px -50% 0px' });
		secs.forEach(function (sec) { io.observe(sec); });
	})();

	/* ---------------------------------------------------------------------
	   6d. Hero dot field: dots brighten and part around the pointer, a click
	       (or the end of the portrait intro) sends a shockwave. Draws only
	       while something is moving and the hero is on screen.
	   --------------------------------------------------------------------- */
	(function heroField() {
		var hero = $('.hero'), fig = $('[data-split]');
		if (!hero || reduced) return;
		var cv = d.createElement('canvas'), ctx = cv.getContext('2d');
		if (!ctx) return;
		cv.className = 'hero__field';
		cv.setAttribute('aria-hidden', 'true');
		hero.insertBefore(cv, hero.firstChild);
		var GAP = 26, REACH = 170, W = 0, H = 0, dots = [], mx = -9999, my = -9999, waves = [], visible = true, raf = 0, movedAt = 0;
		function size() {
			var r = hero.getBoundingClientRect(), dpr = Math.min(2, w.devicePixelRatio || 1);
			W = r.width; H = r.height;
			cv.width = W * dpr; cv.height = H * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			/* leave a hole behind the portrait so the dots never show through the photo */
			var pr = fig ? fig.getBoundingClientRect() : null, pcx = pr ? pr.left - r.left + pr.width / 2 : -1e4, pcy = pr ? pr.top - r.top + pr.height / 2 : -1e4, hole = pr ? pr.width * 0.5 : 0;
			dots = [];
			for (var y = GAP / 2; y < H; y += GAP) for (var x = GAP / 2; x < W; x += GAP) {
				if (Math.hypot(x - pcx, y - pcy) > hole) dots.push(x, y);
			}
			kick();
		}
		function draw(now) {
			ctx.clearRect(0, 0, W, H);
			waves = waves.filter(function (v) { return now - v.t < 1500; });
			var hot = [];
			ctx.fillStyle = 'rgba(196,181,253,0.17)';
			ctx.beginPath();
			for (var i = 0; i < dots.length; i += 2) {
				var x = dots[i], y = dots[i + 1], dx = x - mx, dy = y - my, dist = Math.sqrt(dx * dx + dy * dy), a = 0, s = 0, ox = 0, oy = 0;
				if (dist < REACH) { var f = 1 - dist / REACH; a = f * f * 0.8; s = f * 1.8; ox = dx / (dist || 1) * f * 9; oy = dy / (dist || 1) * f * 9; }
				for (var j = 0; j < waves.length; j++) {
					var v = waves[j], age = now - v.t, off = Math.abs(Math.hypot(x - v.x, y - v.y) - age * 0.75);
					if (off < 46) { var k = (1 - off / 46) * (1 - age / 1500); a += k * 0.85; s += k * 2.2; }
				}
				if (a > 0.02) hot.push(x + ox, y + oy, Math.min(1, 0.17 + a), 1.4 + s);
				else ctx.rect(x - 0.7, y - 0.7, 1.4, 1.4);
			}
			ctx.fill();
			for (var n = 0; n < hot.length; n += 4) {
				ctx.fillStyle = 'rgba(196,181,253,' + hot[n + 2].toFixed(2) + ')';
				ctx.fillRect(hot[n] - hot[n + 3] / 2, hot[n + 1] - hot[n + 3] / 2, hot[n + 3], hot[n + 3]);
			}
		}
		function loop(now) {
			draw(now);
			raf = visible && (waves.length || now - movedAt < 900) ? requestAnimationFrame(loop) : 0;
		}
		function kick() { movedAt = performance.now(); if (!raf) raf = requestAnimationFrame(loop); }
		hero.addEventListener('pointermove', function (e) {
			var r = hero.getBoundingClientRect();
			mx = e.clientX - r.left; my = e.clientY - r.top;
			kick();
		}, { passive: true });
		hero.addEventListener('pointerleave', function () { mx = my = -9999; kick(); });
		hero.addEventListener('pointerdown', function (e) {
			var r = hero.getBoundingClientRect();
			waves.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
			kick();
		});
		if ('IntersectionObserver' in w) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe(hero);
		var t;
		w.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(size, 150); });
		size();
		/* one pulse from the portrait as the photo is uncovered */
		if (fig) setTimeout(function () {
			var r = hero.getBoundingClientRect(), pr = fig.getBoundingClientRect();
			waves.push({ x: pr.left - r.left + pr.width / 2, y: pr.top - r.top + pr.height / 2, t: performance.now() });
			kick();
		}, 2300);
	})();

	/* ---------------------------------------------------------------------
	   6e. Section titles split into letters so they can rise out of a mask
	       (css: .is-split). Only titles that start off screen get it.
	   --------------------------------------------------------------------- */
	(function splitTitles() {
		if (reduced) return;
		var i;
		$$('.reveal .sec__head h2').forEach(function (h2) {
			h2.setAttribute('aria-label', h2.textContent.replace(/\s+/g, ' ').trim());
			i = 0;
			(function walk(n) {
				Array.prototype.slice.call(n.childNodes).forEach(function (c) {
					if (c.nodeType === 1) return walk(c);
					if (c.nodeType !== 3) return;
					var frag = d.createDocumentFragment();
					c.nodeValue.split(/(\s+)/).forEach(function (word) {
						if (!word) return;
						if (/^\s+$/.test(word)) return frag.appendChild(d.createTextNode(word));
						var span = d.createElement('span');
						span.className = 'w';
						span.setAttribute('aria-hidden', 'true');
						span.innerHTML = word.split('').map(function (ch) { return '<span class="ch" style="--d:' + (i++) + '">' + esc(ch) + '</span>'; }).join('');
						frag.appendChild(span);
					});
					n.replaceChild(frag, c);
				});
			})(h2);
			h2.classList.add('is-split');
		});
	})();

	/* ---------------------------------------------------------------------
	   6f. Marquee follows the scroll: faster and skewed while you scroll,
	       reversing when you scroll up.
	   --------------------------------------------------------------------- */
	(function marqueeVelocity() {
		var band = $('.marquee'), track = band && $('.marquee__track', band);
		if (!track || reduced || !track.getAnimations || !('IntersectionObserver' in w)) return;
		var anim = track.getAnimations()[0];
		if (!anim) return;
		var lastY = w.scrollY, rate = 1, dir = 1, skew = 0, raf = 0;
		function tick() {
			var v = w.scrollY - lastY;
			lastY = w.scrollY;
			if (v) dir = v > 0 ? 1 : -1;
			rate += (dir * (1 + Math.min(10, Math.abs(v) * 0.22)) - rate) * 0.08;
			skew += (clamp(-v * 0.35, -14, 14) - skew) * 0.15;
			anim.playbackRate = rate;
			band.style.setProperty('--skew', skew.toFixed(2) + 'deg');
			raf = requestAnimationFrame(tick);
		}
		new IntersectionObserver(function (en) {
			if (en[0].isIntersecting && !raf) { lastY = w.scrollY; raf = requestAnimationFrame(tick); }
			else if (!en[0].isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
		}).observe(band);
	})();

	/* ---------------------------------------------------------------------
	   6g. Footer name: letters rise in, then lift and light up near the
	       pointer.
	   --------------------------------------------------------------------- */
	(function footName() {
		var el = $('.foot__name'), foot = $('.foot');
		if (!el || !foot || reduced || !('IntersectionObserver' in w)) return;
		el.innerHTML = el.textContent.split('').map(function (ch, i) {
			return ch === ' ' ? ' ' : '<span style="--i:' + i + '">' + esc(ch) + '</span>';
		}).join('');
		el.classList.add('is-split');
		var letters = $$('span', el);
		var io = new IntersectionObserver(function (en) {
			if (en[0].isIntersecting) { el.classList.add('is-in'); io.disconnect(); }
		}, { threshold: 0.4 });
		io.observe(el);
		if (!finePointer) return;
		foot.addEventListener('pointermove', function (e) {
			letters.forEach(function (s) {
				var r = s.getBoundingClientRect(), dx = (e.clientX - r.left - r.width / 2) / 180;
				s.style.setProperty('--lift-n', Math.exp(-dx * dx).toFixed(3));
			});
		}, { passive: true });
		foot.addEventListener('pointerleave', function () { letters.forEach(function (s) { s.style.setProperty('--lift-n', 0); }); });
	})();

	/* ---------------------------------------------------------------------
	   7. Confetti burst (terminal "hire", form sent).
	   --------------------------------------------------------------------- */
	function confetti() {
		if (reduced) return;
		var cv = d.createElement('canvas'), ctx = cv.getContext('2d'), dpr = Math.min(2, w.devicePixelRatio || 1);
		cv.className = 'confetti';
		cv.width = w.innerWidth * dpr; cv.height = w.innerHeight * dpr;
		d.body.appendChild(cv);
		ctx.scale(dpr, dpr);
		var colors = ['#c4b5fd', '#a78bfa', '#e879f9', '#86efac', '#fbbf24', '#ffffff'];
		var bits = [];
		for (var i = 0; i < 160; i++) {
			var a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, v = 8 + Math.random() * 10;
			bits.push({ x: w.innerWidth / 2, y: w.innerHeight * 0.75, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4, s: 5 + Math.random() * 6, c: colors[i % colors.length] });
		}
		var t0 = performance.now();
		(function frame(t) {
			ctx.clearRect(0, 0, w.innerWidth, w.innerHeight);
			bits.forEach(function (b) {
				b.vy += 0.32; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
				ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore();
			});
			if (t - t0 < 2600) requestAnimationFrame(frame); else cv.remove();
		})(t0);
	}
	if (/[?&]sent=1/.test(location.search)) setTimeout(confetti, 600);

	/* ---------------------------------------------------------------------
	   8. Interactive terminal.
	   --------------------------------------------------------------------- */
	(function terminal() {
		var form = $('[data-term-form]'), out = $('[data-term-out]'), input = $('[data-term-input]');
		if (!form || !out || !input) return;
		var history = [], hi = 0;
		var SECTIONS = { about: 'about', work: 'work', experience: 'experience', stack: 'stack', skills: 'stack', services: 'services', projects: 'projects', arcade: 'arcade', games: 'arcade', play: 'arcade', activity: 'activity', contact: 'contact' };
		function line(html, cls) {
			var p = d.createElement('p');
			p.className = 'is-new' + (cls ? ' ' + cls : '');
			p.innerHTML = html;
			out.appendChild(p);
			out.scrollTop = out.scrollHeight;
		}
		function go(id) {
			line('<span class="t-dim">&rarr; jumping to #' + id + '&hellip;</span>');
			setTimeout(function () { var el = d.getElementById(id); if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }, 350);
		}
		var CMDS = {
			help: function () {
				line('<span class="t-ai">available commands</span>');
				line('  whoami &middot; skills &middot; work &middot; projects &middot; experience\n  contact &middot; resume &middot; ask &lt;question&gt; &middot; date &middot; hire &middot; clear', 't-dim');
			},
			whoami: function () { line('Lemmuel Turaya &mdash; full-stack &amp; mobile developer. 6+ years, Vue.js + Laravel + Flutter, Claude in the loop. Bi&ntilde;an, PH (GMT+8).'); },
			skills: function () {
				var top = $$('.skills li').filter(function (li) { return li.querySelector('.tier--3'); }).map(function (li) { return li.firstChild.textContent.trim(); });
				line('<span class="t-ok">primary:</span> ' + esc(top.join(' · ')));
				line('<span class="t-dim">type "stack" to see the full playground</span>');
			},
			resume: function () { line('resume.pdf &rarr; <a href="resume.pdf" download>download</a> &middot; <a href="resume.html">read online</a>'); },
			date: function () {
				var t = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Manila', weekday: 'short', hour: '2-digit', minute: '2-digit' });
				line('Manila: ' + esc(t) + ' &middot; usually replies within 24h');
			},
			hire: function () {
				line('<span class="t-ok">excellent choice.</span> opening the contact form&hellip;');
				confetti();
				setTimeout(function () { go('contact'); }, 700);
			},
			ask: function (arg) {
				if (!arg) { line('usage: ask &lt;question&gt; &mdash; e.g. ask what is your notice period', 't-dim'); return; }
				if (w.PortfolioChat && w.PortfolioChat.ask) { line('<span class="t-ai">opening the assistant&hellip;</span>'); w.PortfolioChat.ask(arg); }
				else line('assistant is offline &mdash; email turayalemmuel@gmail.com', 't-warn');
			},
			sudo: function () { line('permission denied: nice try. &#128578;', 't-err'); },
			clear: function () { out.innerHTML = ''; },
			ls: function () { line('about/  work/  experience/  stack/  services/  projects/  arcade/  contact/  resume.pdf'); },
			coffee: function () { line('brewing&hellip; &#9749; while you wait, type "work".', 't-warn'); }
		};
		function run(raw) {
			var cmd = raw.trim();
			if (!cmd) return;
			line('<span class="term__ps">$</span>' + esc(cmd));
			var parts = cmd.split(/\s+/), name = parts[0].toLowerCase(), arg = parts.slice(1).join(' ');
			if (/^rm$/.test(name)) return line('not today. &#128517;', 't-err');
			if (name === 'cd' && arg) name = arg.replace(/[^a-z]/gi, '').toLowerCase();
			if (SECTIONS[name]) return go(SECTIONS[name]);
			if (CMDS[name]) return CMDS[name](arg);
			line('command not found: ' + esc(name) + ' &mdash; try <span class="t-ok">help</span>', 't-err');
		}
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var v = input.value;
			if (v.trim()) { history.push(v); hi = history.length; }
			input.value = '';
			run(v);
		});
		input.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowUp' && hi > 0) { hi--; input.value = history[hi]; e.preventDefault(); }
			else if (e.key === 'ArrowDown') { hi = Math.min(history.length, hi + 1); input.value = history[hi] || ''; e.preventDefault(); }
			else if (e.key === 'Tab' && input.value) {
				var all = Object.keys(CMDS).concat(Object.keys(SECTIONS));
				var hit = all.filter(function (k) { return k.indexOf(input.value.toLowerCase()) === 0; })[0];
				if (hit) { input.value = hit; e.preventDefault(); }
			}
		});
		out.addEventListener('click', function () { input.focus(); });

		/* type a short demo once the terminal is first seen (no focus stealing) */
		if (reduced || !('IntersectionObserver' in w)) return;
		var demoed = false;
		var io = new IntersectionObserver(function (en) {
			if (!en[0].isIntersecting || demoed) return;
			demoed = true; io.disconnect();
			var demo = 'help', i = 0;
			(function type() {
				if (d.activeElement === input) return;
				input.value = demo.slice(0, ++i);
				if (i < demo.length) return setTimeout(type, 110);
				setTimeout(function () { if (d.activeElement !== input) { input.value = ''; run(demo); } }, 400);
			})();
		}, { threshold: 0.6 });
		io.observe(out);
	})();

	/* ---------------------------------------------------------------------
	   9. Skills playground: the tier-3/2 skills as physical balls you can
	      drag and throw. Pauses when off screen.
	   --------------------------------------------------------------------- */
	(function playground() {
		var box = $('[data-play]'), cv = $('[data-play-canvas]');
		if (!box || !cv || !cv.getContext) return;
		var ctx = cv.getContext('2d'), dpr = Math.min(2, w.devicePixelRatio || 1);
		var W = 0, H = 0, balls = [], drag = null, visible = false, raf = 0;
		var skills = $$('.skills li').map(function (li) {
			var tier = li.querySelector('.tier--3') ? 3 : li.querySelector('.tier--2') ? 2 : 1;
			return { label: li.firstChild.textContent.trim(), tier: tier };
		}).filter(function (s) { return s.label; });
		var FILL = { 3: '#c4b5fd', 2: '#7c5cd6', 1: '#2d2540' }, INK = { 3: '#120d1f', 2: '#f6f4fb', 1: '#d7d1e4' };
		function size() {
			var r = box.getBoundingClientRect();
			W = r.width; H = r.height;
			cv.width = W * dpr; cv.height = H * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}
		function spawn() {
			var scale = clamp(W / 1100, 0.62, 1);
			balls = skills.map(function (s, i) {
				var rad = (s.tier === 3 ? 54 : s.tier === 2 ? 44 : 36) * scale;
				return { x: rad + Math.random() * (W - rad * 2), y: -rad - i * 26, vx: (Math.random() - 0.5) * 4, vy: 0, r: rad, s: s };
			});
		}
		function step() {
			var g = 0.45;
			balls.forEach(function (b) {
				if (b === drag) return;
				b.vy += g; b.vx *= 0.995; b.vy *= 0.995;
				b.x += b.vx; b.y += b.vy;
				if (b.y + b.r > H) { b.y = H - b.r; b.vy *= -0.55; b.vx *= 0.9; }
				if (b.x - b.r < 0) { b.x = b.r; b.vx *= -0.7; }
				if (b.x + b.r > W) { b.x = W - b.r; b.vx *= -0.7; }
			});
			for (var i = 0; i < balls.length; i++) for (var j = i + 1; j < balls.length; j++) {
				var a = balls[i], b = balls[j], dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), min = a.r + b.r;
				if (dist > 0 && dist < min) {
					var nx = dx / dist, ny = dy / dist, push = (min - dist) / 2;
					if (a !== drag) { a.x -= nx * push; a.y -= ny * push; }
					if (b !== drag) { b.x += nx * push; b.y += ny * push; }
					var rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
					if (rel < 0) {
						var imp = -rel * 0.85;
						if (a !== drag) { a.vx -= imp * nx; a.vy -= imp * ny; }
						if (b !== drag) { b.vx += imp * nx; b.vy += imp * ny; }
					}
				}
			}
		}
		function draw() {
			ctx.clearRect(0, 0, W, H);
			balls.forEach(function (b) {
				ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
				ctx.fillStyle = FILL[b.s.tier]; ctx.fill();
				if (b.s.tier === 3) { ctx.shadowColor = 'rgba(167,139,250,0.6)'; ctx.shadowBlur = 24; ctx.fill(); ctx.shadowBlur = 0; }
				ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.stroke();
				ctx.fillStyle = INK[b.s.tier];
				ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
				/* shrink the label until it fits inside the ball, then trim as a last resort */
				var label = b.s.label, max = b.r * 1.7, fs = Math.min(15, b.r * 0.32);
				do { ctx.font = '600 ' + fs + 'px Geist, Inter, system-ui, sans-serif'; } while (ctx.measureText(label).width > max && (fs -= 0.5) >= 9);
				while (ctx.measureText(label).width > max && label.length > 4) label = label.slice(0, -2) + '…';
				ctx.fillText(label, b.x, b.y);
			});
		}
		function loop() { step(); draw(); raf = visible ? requestAnimationFrame(loop) : 0; }
		function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
		var last = null;
		cv.addEventListener('pointerdown', function (e) {
			var p = pos(e);
			drag = balls.filter(function (b) { return Math.hypot(b.x - p.x, b.y - p.y) < b.r; }).pop() || null;
			if (drag) { cv.setPointerCapture(e.pointerId); last = { x: p.x, y: p.y, t: performance.now() }; drag.vx = drag.vy = 0; }
		});
		cv.addEventListener('pointermove', function (e) {
			if (!drag) return;
			var p = pos(e), now = performance.now(), dt = Math.max(16, now - last.t);
			drag.vx = (p.x - last.x) / dt * 16; drag.vy = (p.y - last.y) / dt * 16;
			drag.x = clamp(p.x, drag.r, W - drag.r); drag.y = clamp(p.y, drag.r, H - drag.r);
			last = { x: p.x, y: p.y, t: now };
		});
		function drop() { drag = null; }
		cv.addEventListener('pointerup', drop);
		cv.addEventListener('pointercancel', drop);
		w.addEventListener('resize', function () { size(); balls.forEach(function (b) { b.x = clamp(b.x, b.r, W - b.r); b.y = Math.min(b.y, H - b.r); }); });
		size(); spawn();
		if (reduced) { for (var k = 0; k < 600; k++) step(); draw(); return; } /* settled, static */
		if (!('IntersectionObserver' in w)) { visible = true; loop(); return; }
		new IntersectionObserver(function (en) {
			visible = en[0].isIntersecting;
			if (visible && !raf) { if (balls.every(function (b) { return b.y < 0; })) spawn(); loop(); }
		}, { threshold: 0.15 }).observe(box);
	})();
})();
