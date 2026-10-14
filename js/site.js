/* ==========================================================================
   Front page behaviour (v7.0). Vanilla, no dependencies.
   Telemetry (views, GitHub, git log) is ported from the old player-file.js
   with the same endpoints, cache keys and fallbacks.
   ========================================================================== */
(function () {
	'use strict';

	var d = document;
	var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	function $(sel, root) { return (root || d).querySelector(sel); }
	function $$(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }
	function escapeHtml(s) {
		return (s == null ? '' : String(s))
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}

	/* ---------------------------------------------------------------------
	   Legacy anchors: the classic page (#fh5co-*) and the old Player File
	   tabs are still linked from case studies, the FAQ and old shares.
	   --------------------------------------------------------------------- */
	var LEGACY = {
		'fh5co-header': 'about', 'fh5co-about': 'about', 'fh5co-resume': 'experience',
		'fh5co-features': 'services', 'fh5co-skills': 'stack', 'fh5co-work': 'projects',
		'fh5co-blog': 'work', 'fh5co-started': 'contact',
		character: 'about', quests: 'work', career: 'experience', skills: 'stack',
		abilities: 'services', archives: 'projects', comms: 'contact'
	};
	function resolveLegacyHash() {
		var id = LEGACY[location.hash.slice(1)];
		/* native fragment jump, no new history entry */
		if (id && d.getElementById(id)) location.replace('#' + id);
	}
	resolveLegacyHash();
	window.addEventListener('hashchange', resolveLegacyHash);

	/* ---------------------------------------------------------------------
	   Nav: mobile toggle + current-section highlight
	   --------------------------------------------------------------------- */
	(function nav() {
		var toggle = $('[data-nav-toggle]');
		var links = $('#nav-links');
		if (!toggle || !links) return;
		function setOpen(open) {
			links.classList.toggle('is-open', open);
			toggle.setAttribute('aria-expanded', String(open));
			toggle.textContent = open ? 'close' : 'menu';
		}
		toggle.addEventListener('click', function () { setOpen(!links.classList.contains('is-open')); });
		links.addEventListener('click', function (e) { if (e.target.closest('a, button')) setOpen(false); });
		d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && links.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });

		if (!('IntersectionObserver' in window)) return;
		var byId = {};
		$$('a[href^="#"]', links).forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (!en.isIntersecting) return;
				$$('[aria-current]', links).forEach(function (a) { a.removeAttribute('aria-current'); });
				var a = byId[en.target.id];
				if (a) a.setAttribute('aria-current', 'true');
			});
		}, { rootMargin: '-45% 0px -50% 0px' });
		$$('main > section[id]').forEach(function (s) { io.observe(s); });
	})();

	/* ---------------------------------------------------------------------
	   Ask: nav button + Cmd/Ctrl+K open the FAQ assistant (portfolio-chat.js)
	   --------------------------------------------------------------------- */
	function openAsk() { if (window.PortfolioChat) window.PortfolioChat.open(); }
	$$('[data-ask]').forEach(function (b) { b.addEventListener('click', openAsk); });
	d.addEventListener('keydown', function (e) {
		if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
			e.preventDefault();
			openAsk();
		}
	});

	/* ---------------------------------------------------------------------
	   Projects filter. Cards carry space-separated data-tags.
	   --------------------------------------------------------------------- */
	(function filters() {
		var bar = $('[data-filters]');
		var cards = $$('[data-projects] > [data-tags]');
		if (!bar || !cards.length) return;
		cards.forEach(function (c, i) { c.style.viewTransitionName = 'pj-' + i; });
		function matches(card, tag) { return tag === 'all' || card.getAttribute('data-tags').split(' ').indexOf(tag) !== -1; }
		$$('[data-filter]', bar).forEach(function (btn) {
			var tag = btn.getAttribute('data-filter');
			var count = $('[data-filter-count]', btn);
			if (count) count.textContent = cards.filter(function (c) { return matches(c, tag); }).length;
			btn.addEventListener('click', function () {
				$$('[data-filter]', bar).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
				function apply() { cards.forEach(function (c) { c.hidden = !matches(c, tag); }); }
				/* native View Transitions morph the grid when supported */
				if (d.startViewTransition && !reducedMotion) d.startViewTransition(apply); else apply();
			});
		});
	})();

	/* ---------------------------------------------------------------------
	   Local time in Manila next to the status line
	   --------------------------------------------------------------------- */
	(function clock() {
		var el = $('[data-clock]');
		if (!el) return;
		function tick() {
			try {
				el.textContent = ' · local ' + new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' });
				el.hidden = false;
			} catch (e) {}
		}
		tick();
		setInterval(tick, 30000);
	})();

	/* ---------------------------------------------------------------------
	   Section reveal (once). Skipped under reduced motion.
	   --------------------------------------------------------------------- */
	if (!reducedMotion && 'IntersectionObserver' in window) {
		var revealIO = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); }
			});
		}, { rootMargin: '0px 0px -10% 0px' });
		/* grids whose children enter one after another (css: [data-stagger]) */
		$$('.about, .stack, .services, .projects, .activity, .contact, .steps, .timeline').forEach(function (g) {
			g.setAttribute('data-stagger', '');
			Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 8)); });
		});
		$$('main > .sec').forEach(function (s) {
			var r = s.getBoundingClientRect();
			if (r.top < window.innerHeight) return; /* already on screen — don't hide it */
			s.classList.add('reveal');
			revealIO.observe(s);
		});
	}

	/* ---------------------------------------------------------------------
	   Copy buttons
	   --------------------------------------------------------------------- */
	$$('[data-copy]').forEach(function (btn) {
		btn.addEventListener('click', function () {
			if (!navigator.clipboard || !navigator.clipboard.writeText) return;
			navigator.clipboard.writeText(btn.getAttribute('data-copy')).then(function () {
				btn.classList.add('is-copied');
				btn.textContent = 'copied';
				setTimeout(function () { btn.classList.remove('is-copied'); btn.textContent = 'copy'; }, 2200);
			}).catch(function () {});
		});
	});

	/* ---------------------------------------------------------------------
	   Contact form return (?sent=1)
	   --------------------------------------------------------------------- */
	if (/[?&]sent=1/.test(location.search)) {
		var ok = $('[data-form-success]');
		if (ok) {
			ok.hidden = false;
			try { history.replaceState(null, '', location.pathname + '#contact'); } catch (e) {}
			$('#transmission').scrollIntoView();
		}
	}

	if (!window.fetch) return;

	/* ---------------------------------------------------------------------
	   Views counter — counterapi.dev, same namespace/key + session guard
	   as the classic UI so counts stay consistent across both.
	   --------------------------------------------------------------------- */
	(function views() {
		var el = $('[data-views]');
		if (!el) return;
		var BASE = 'https://api.counterapi.dev/v1/kon2raya-portfolio/views';
		/* Read with a trailing slash: the no-slash URL 301-redirects without
		   CORS headers, so the browser blocks it. (/up needs no slash.) */
		var READ = BASE + '/';
		var UP = BASE + '/up';
		var SESS = 'portfolio.views.incremented';
		function parseCount(data) {
			if (!data) return null;
			if (typeof data.count === 'number') return data.count;
			if (data.data && typeof data.data.count === 'number') return data.data.count;
			return null;
		}
		var incremented = false;
		try { incremented = !!sessionStorage.getItem(SESS); } catch (e) {}
		function get(url, retry) {
			fetch(url)
				.then(function (r) { return r.json(); })
				.then(function (data) {
					var n = parseCount(data);
					if (n != null && n > 0) el.textContent = n.toLocaleString();
					if (n != null && !incremented) { try { sessionStorage.setItem(SESS, '1'); } catch (e) {} }
					if (n == null && retry) setTimeout(function () { get(READ, false); }, 5000);
				})
				.catch(function () { if (retry) setTimeout(function () { get(READ, false); }, 5000); });
		}
		get(incremented ? READ : UP, true);
	})();

	/* ---------------------------------------------------------------------
	   GitHub — 30-min localStorage cache with stale tolerance
	   --------------------------------------------------------------------- */
	var USER = 'kon2raya24';
	var ghCache = {
		TTL: 30 * 60 * 1000,
		get: function (key) {
			try {
				var p = JSON.parse(localStorage.getItem('gh.' + key) || 'null');
				if (!p || typeof p.t !== 'number') return null;
				var age = Date.now() - p.t;
				return { data: p.d, fresh: age < this.TTL };
			} catch (e) { return null; }
		},
		set: function (key, data) {
			try { localStorage.setItem('gh.' + key, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
		}
	};
	function ghFetch(url, key) {
		var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
		var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 4500);
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
			.then(function (json) { ghCache.set(key, json); return json; })
			.catch(function (e) { clearTimeout(t); throw e; });
	}

	/* recent repos */
	(function recentRepos() {
		var host = $('[data-recent-repos]');
		if (!host) return;
		function relativeTime(iso) {
			var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
			if (diff < 60) return 'just now';
			if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
			if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
			if (diff < 86400 * 7) return Math.floor(diff / 86400) + 'd ago';
			if (diff < 86400 * 30) return Math.floor(diff / (86400 * 7)) + 'w ago';
			if (diff < 86400 * 365) return Math.floor(diff / (86400 * 30)) + 'mo ago';
			return Math.floor(diff / (86400 * 365)) + 'y ago';
		}
		function render(repos, fromCache) {
			if (!repos || !repos.length) { host.innerHTML = '<li class="muted">no public repos found.</li>'; return; }
			var nonFork = repos.filter(function (r) { return !r.fork; });
			host.innerHTML = (nonFork.length ? nonFork : repos).slice(0, 4).map(function (r) {
				return '<li>' +
					'<div class="repo__head">' +
						'<a class="repo__name" href="' + escapeHtml(r.html_url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(r.name) + '</a>' +
						(r.language ? '<span class="repo__lang">' + escapeHtml(r.language) + '</span>' : '') +
						'<span class="repo__stars">★ ' + (r.stargazers_count || 0) + '</span>' +
					'</div>' +
					(r.description ? '<p class="repo__desc">' + escapeHtml(r.description) + '</p>' : '') +
					'<div class="repo__when">updated ' + relativeTime(r.pushed_at || r.updated_at) + (fromCache ? ' · cached' : '') + '</div>' +
				'</li>';
			}).join('');
		}
		var cached = ghCache.get('repos');
		if (cached) render(cached.data, !cached.fresh);
		if (cached && cached.fresh) return;
		ghFetch('https://api.github.com/users/' + USER + '/repos?sort=updated&per_page=8', 'repos')
			.then(function (repos) { if (Array.isArray(repos)) render(repos, false); })
			.catch(function (e) {
				if (cached) return;
				var minutes = e && e.resetAt ? Math.max(1, Math.ceil((e.resetAt - Date.now()) / 60000)) : null;
				host.innerHTML = '<li class="muted">$ ' +
					(e && e.code === 'RATE_LIMIT' ? 'GitHub rate-limited for this IP' + (minutes ? ' — resets in ~' + minutes + ' min' : '') : 'couldn\'t reach GitHub') +
					' — <a href="https://github.com/' + USER + '" target="_blank" rel="noopener noreferrer">view profile &rarr;</a></li>';
			});
	})();

	/* contribution heatmap + profile stats. GitHub has no public contributions
	   API, so the heatmap is built from recent public events; a deterministic
	   synthetic pattern fills in when the API is unavailable. */
	(function githubStats() {
		var host = $('[data-commit-graph]');
		if (!host) return;
		var label = $('.commit-graph-label');
		var CELLS = 26 * 7;
		function levelFor(c) { return !c ? 0 : c < 2 ? 1 : c < 4 ? 2 : c < 7 ? 3 : 4; }
		function paint(buckets) {
			var html = '';
			for (var i = 0; i < CELLS; i++) {
				var c = buckets[i] || 0;
				html += '<span class="commit-cell" style="--c:' + Math.floor(i / 7) + '" data-level="' + levelFor(c) + '" title="' + c + ' event' + (c !== 1 ? 's' : '') + '"></span>';
			}
			host.innerHTML = html;
		}
		function fallbackBuckets() {
			var seed = 42, out = [];
			function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
			for (var i = 0; i < CELLS; i++) {
				var v = rnd();
				out.push(v < 0.4 ? 0 : v < 0.65 ? 1 : v < 0.85 ? 3 : v < 0.96 ? 6 : 10);
			}
			return out;
		}
		function eventsToBuckets(events) {
			var out = new Array(CELLS).fill(0);
			var today = new Date(); today.setHours(0, 0, 0, 0);
			events.forEach(function (e) {
				var day = new Date(e.created_at); day.setHours(0, 0, 0, 0);
				var idx = CELLS - 1 - Math.round((today - day) / 86400000);
				if (idx >= 0 && idx < CELLS) out[idx] += 1;
			});
			return out;
		}
		function setLabel(status, stale) {
			if (!label) return;
			if (status === 'live') label.innerHTML = '// recent github activity &middot; <span>live</span>' + (stale ? ' <em>(cached)</em>' : '');
			else if (status === 'rate') label.innerHTML = '// github rate-limited &middot; <em>retry later</em>';
		}
		function setMeta(u, fromCache) {
			var old = $('.commit-graph-meta');
			if (old) old.remove();
			if (!u) return;
			var meta = d.createElement('div');
			meta.className = 'commit-graph-meta';
			meta.innerHTML =
				'<span><strong>' + Number(u.public_repos || 0).toLocaleString('en-US') + '</strong> repos</span> &middot; ' +
				'<span><strong>' + Number(u.followers || 0).toLocaleString('en-US') + '</strong> followers</span>' +
				(fromCache ? ' &middot; <em>cached</em>' : '') +
				' &middot; <a href="https://github.com/' + USER + '" target="_blank" rel="noopener noreferrer">view profile &rarr;</a>';
			host.parentNode.insertBefore(meta, host.nextSibling);
		}
		var evCache = ghCache.get('events');
		var usCache = ghCache.get('user');
		if (evCache) { paint(eventsToBuckets(evCache.data)); setLabel('live', !evCache.fresh); }
		else paint(fallbackBuckets());
		if (usCache) setMeta(usCache.data, !usCache.fresh);
		if (evCache && evCache.fresh && usCache && usCache.fresh) return;
		ghFetch('https://api.github.com/users/' + USER + '/events/public?per_page=100', 'events')
			.then(function (events) {
				if (!Array.isArray(events) || !events.length) return;
				paint(eventsToBuckets(events));
				setLabel('live', false);
			})
			.catch(function (e) { if (!evCache && e && e.code === 'RATE_LIMIT') setLabel('rate'); });
		ghFetch('https://api.github.com/users/' + USER, 'user')
			.then(function (u) { setMeta(u, false); })
			.catch(function () {});
	})();

	/* patch notes — last 5 commits of this site */
	(function gitlog() {
		var host = $('[data-git-log]');
		if (!host) return;
		var KEY = 'pf.gitLog.cache';
		var TTL = 30 * 60 * 1000;
		function render(items) {
			host.innerHTML = '';
			items.forEach(function (c) {
				var li = d.createElement('li');
				var hash = d.createElement('span');
				hash.className = 'gitlog__hash';
				hash.textContent = c.sha;
				var msg = d.createElement('span');
				msg.textContent = c.msg;
				var date = d.createElement('span');
				date.className = 'gitlog__date';
				date.textContent = c.date;
				li.appendChild(hash);
				li.appendChild(msg);
				li.appendChild(date);
				host.appendChild(li);
			});
		}
		try {
			var cached = JSON.parse(localStorage.getItem(KEY) || 'null');
			if (cached && cached.items) {
				render(cached.items);
				if (Date.now() - cached.at < TTL) return;
			}
		} catch (e) {}
		fetch('https://api.github.com/repos/' + USER + '/portfolio/commits?per_page=5', { headers: { Accept: 'application/vnd.github+json' } })
			.then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
			.then(function (commits) {
				if (!Array.isArray(commits)) return;
				var items = commits.map(function (c) {
					return {
						sha: c.sha.slice(0, 7),
						msg: (c.commit.message || '').split('\n')[0],
						date: (c.commit.author && c.commit.author.date || '').slice(0, 10)
					};
				});
				render(items);
				try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), items: items })); } catch (e) {}
			})
			.catch(function () {
				if (host.querySelector('.muted')) host.innerHTML = '<li class="muted">$ offline — view history on GitHub instead</li>';
			});
	})();
})();
