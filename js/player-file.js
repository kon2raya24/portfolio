/* ==========================================================================
   PLAYER FILE — game-menu behaviors (v6.0)
   Boot screen + save slot, tab rail, exploration XP, achievements, sound,
   quest briefing modal, tooltips-by-CSS, decode titles, card tilt,
   HUD clock + views, toasts, contact-form success, patch-notes git log.
   Vanilla JS, no dependencies. Pairs with css/player-file.css.
   ========================================================================== */
(function () {
	'use strict';

	var d = document;
	var html = d.documentElement;
	var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
	var loadAt = Date.now();

	/* ?og=1 — capture mode for regenerating the social-share image:
	   freezes the PRESS START pulse and suppresses toasts */
	var ogMode = /[?&]og=1/.test(location.search);
	if (ogMode) html.classList.add('pf-og');

	function $(sel, root) { return (root || d).querySelector(sel); }
	function $$(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }
	function store(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
	function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

	/* ---------------------------------------------------------------------
	   Sound — tiny WebAudio synth, muted by default, HUD toggle
	   --------------------------------------------------------------------- */
	var snd = (function () {
		var SND_KEY = 'pf.sound';
		var enabled = read(SND_KEY) === 'on';
		var ctx = null;
		var btn = $('[data-snd]');
		var label = $('[data-snd-label]');

		function ensureCtx() {
			if (!ctx) {
				try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
			}
			if (ctx.state === 'suspended') ctx.resume();
			return ctx;
		}
		function tone(freq, start, dur, type, peak) {
			var c = ensureCtx();
			if (!c) return;
			var osc = c.createOscillator();
			var gain = c.createGain();
			var t = c.currentTime + (start || 0);
			osc.type = type || 'square';
			osc.frequency.setValueAtTime(freq, t);
			gain.gain.setValueAtTime(0.0001, t);
			gain.gain.exponentialRampToValueAtTime(peak || 0.04, t + 0.012);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.07));
			osc.connect(gain).connect(c.destination);
			osc.start(t);
			osc.stop(t + (dur || 0.07) + 0.02);
		}
		function play(name) {
			if (!enabled) return;
			if (name === 'nav') { tone(392, 0, 0.05); tone(523, 0.04, 0.06); }
			else if (name === 'open') { tone(330, 0, 0.06, 'triangle', 0.05); tone(494, 0.05, 0.08, 'triangle', 0.05); }
			else if (name === 'close') { tone(494, 0, 0.05, 'triangle', 0.04); tone(330, 0.04, 0.07, 'triangle', 0.04); }
			else if (name === 'ach') { tone(523, 0, 0.09, 'square', 0.045); tone(659, 0.08, 0.09, 'square', 0.045); tone(784, 0.16, 0.16, 'square', 0.05); }
			else if (name === 'tick') { tone(880, 0, 0.035, 'square', 0.03); }
		}
		function paint() {
			if (label) label.textContent = enabled ? 'ON' : 'OFF';
			if (btn) {
				btn.classList.toggle('is-on', enabled);
				btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
			}
		}
		if (btn) btn.addEventListener('click', function () {
			enabled = !enabled;
			store(SND_KEY, enabled ? 'on' : 'off');
			paint();
			if (enabled) play('nav');
		});
		paint();
		return { play: play };
	})();

	/* ---------------------------------------------------------------------
	   Toasts — achievement-style notifications
	   --------------------------------------------------------------------- */
	var toastHost = $('[data-toast]');
	function toast(kicker, message, ms) {
		if (!toastHost || ogMode) return;
		var el = d.createElement('div');
		el.className = 'pf-toast__item';
		var k = d.createElement('strong');
		k.textContent = kicker;
		el.appendChild(k);
		el.appendChild(d.createTextNode(message));
		toastHost.appendChild(el);
		requestAnimationFrame(function () { el.classList.add('is-on'); });
		setTimeout(function () {
			el.classList.remove('is-on');
			setTimeout(function () { el.remove(); }, 350);
		}, ms || 4200);
	}

	/* ---------------------------------------------------------------------
	   Achievements — persistent, with HUD counter + modal list
	   --------------------------------------------------------------------- */
	var ACH_DEFS = [
		{ id: 'new-game', icon: '▶', name: 'FIRST BOOT', desc: 'Load the player file' },
		{ id: 'map-100', icon: '⌖', name: 'CARTOGRAPHER', desc: 'Visit all 7 sections' },
		{ id: 'legendary', icon: '★', name: 'LEGENDARY HUNTER', desc: 'Open a legendary quest briefing' },
		{ id: 'copycat', icon: '@', name: 'DIRECT LINE', desc: 'Copy the email address' },
		{ id: 'transmission', icon: '✉︎', name: 'FIRST CONTACT', desc: 'Send a transmission via the contact form' },
		{ id: 'speedrun', icon: '⚡︎', name: 'ANY% SPEEDRUN', desc: 'Clear all 7 sections within 60 seconds' },
		{ id: 'konami', icon: '♛', name: 'GOD MODE', desc: '↑↑↓↓←→←→ B A' }
	];
	var ach = (function () {
		var KEY = 'pf.ach.v1';
		var state = {};
		try { state = JSON.parse(read(KEY) || '{}') || {}; } catch (e) { state = {}; }
		/* migrate the v6.0 first-visit flag */
		if (read('pf.ach.newgame')) state['new-game'] = true;

		function count() {
			return ACH_DEFS.filter(function (a) { return state[a.id]; }).length;
		}
		function paintHud() {
			var el = $('[data-ach-count]');
			if (el) el.textContent = count() + '/' + ACH_DEFS.length;
		}
		function unlock(id, silent) {
			var def = null;
			for (var i = 0; i < ACH_DEFS.length; i++) if (ACH_DEFS[i].id === id) def = ACH_DEFS[i];
			if (!def || state[id]) return false;
			state[id] = true;
			store(KEY, JSON.stringify(state));
			paintHud();
			if (!silent) {
				snd.play('ach');
				toast('ACHIEVEMENT UNLOCKED', def.icon + ' ' + def.name + ' — ' + def.desc.toLowerCase(), 5200);
			}
			return true;
		}
		function has(id) { return !!state[id]; }
		paintHud();
		return { unlock: unlock, has: has, count: count, defs: ACH_DEFS, state: function () { return state; } };
	})();

	/* ---------------------------------------------------------------------
	   Modal — shared shell for quest briefings + achievements
	   --------------------------------------------------------------------- */
	var modal = (function () {
		var root = $('[data-modal]');
		var content = $('[data-modal-content]');
		var closeBtn = $('[data-modal-close]');
		var lastFocus = null;
		var isOpen = false;

		function open(node) {
			if (!root || !content) return;
			content.innerHTML = '';
			content.appendChild(node);
			lastFocus = d.activeElement;
			root.removeAttribute('hidden');
			isOpen = true;
			snd.play('open');
			if (closeBtn) closeBtn.focus();
		}
		function close() {
			if (!root || !isOpen) return;
			root.setAttribute('hidden', '');
			isOpen = false;
			snd.play('close');
			if (lastFocus && lastFocus.focus) lastFocus.focus();
		}
		if (root) {
			root.addEventListener('click', function (ev) { if (ev.target === root) close(); });
		}
		if (closeBtn) closeBtn.addEventListener('click', close);
		d.addEventListener('keydown', function (ev) {
			if (!isOpen) return;
			if (ev.key === 'Escape') { close(); ev.stopPropagation(); return; }
			if (ev.key === 'Tab') {
				/* simple focus trap inside the box */
				var focusables = $$('button, a[href], input, select, textarea', root.firstElementChild);
				if (!focusables.length) return;
				var first = focusables[0];
				var last = focusables[focusables.length - 1];
				if (ev.shiftKey && d.activeElement === first) { last.focus(); ev.preventDefault(); }
				else if (!ev.shiftKey && d.activeElement === last) { first.focus(); ev.preventDefault(); }
			}
		}, true);
		return { open: open, close: close, opened: function () { return isOpen; } };
	})();

	/* ---------------------------------------------------------------------
	   Quest briefings — modal detail view before deploying to a case study
	   --------------------------------------------------------------------- */
	var BRIEFS = {
		'autonomous-ai-engineer/': 'A multi-LLM agent — Claude, Gemini, OpenAI and more — that picks up assigned tickets from the board, detects the right repository, does the work, and verifies it with independently-run PHPUnit tests before reporting back. The flagship quest: start here.',
		'wms-v2-inventory-rewrite/': 'A parity rewrite of the WMS inventory core onto Laravel 12 + Vue 3 using a canonical V3 pattern — same behavior, modern foundations, with CI-enforced guardrails keeping the rewrite honest.',
		'wms-mobile-app/': 'Cross-platform warehouse companion built in Flutter — real-time inventory, receiving, and pick/pack on the warehouse floor, with Bluetooth label printing. 108 production releases and counting.',
		'transport-mgmt-system/': 'Transport management at scale — 324 pages on Vue 3 + Laravel 11, with a live dispatch board and real-time GPS tracking.',
		'enterprise-hris/': 'Enterprise HR information system — 95 pages on Vue 3 + Laravel 12 + Vite, secured with TOTP two-factor auth.',
		'realty-developer-portal/': 'Full property-lifecycle portal for a realty developer — 65 models across the pipeline, shipped end-to-end on Vue.js + Laravel.',
		'brokerage-commission-system/': 'Commission engine for a brokerage — 5-tier share computation with audit trails, running 22 months in continuous production on Vue.js + Laravel.',
		'llm-friendly-wiki/': 'A Karpathy-pattern knowledge base designed for LLM consumption — per-folder _INDEX files in Obsidian + Markdown, so agents and humans navigate the same docs.',
		'ph-dev-utils-family/': 'Open-source monorepo of 12 packages for Filipino developers — JS↔PHP parity APIs published to npm and Packagist, with React 19 docs.'
	};

	function openQuestBriefing(card) {
		var name = ($('.pf-quest__name', card) || {}).textContent || '';
		var rarityEl = $('.pf-quest__rarity', card);
		var typeEl = $('.pf-quest__type', card);
		var objEl = $('.pf-quest__obj', card);
		var preview = $('.pf-quest__preview', card);
		var tags = $('.pf-quest__tags', card);
		var cta = $('a.pf-quest__cta', card);

		var box = d.createElement('div');

		var top = d.createElement('div');
		top.className = 'pf-brief__top';
		var kick = d.createElement('span');
		kick.className = 'pf-brief__kicker';
		kick.textContent = '// MISSION BRIEFING';
		top.appendChild(kick);
		if (rarityEl) { var r = rarityEl.cloneNode(true); r.className = 'pf-quest__rarity ' + (card.className.match(/pf-quest--\w+/) || [''])[0]; top.appendChild(r); }
		if (typeEl) top.appendChild(typeEl.cloneNode(true));
		box.appendChild(top);

		var h = d.createElement('h3');
		h.className = 'pf-brief__name';
		h.textContent = name;
		box.appendChild(h);

		if (preview) {
			var img = preview.cloneNode(false);
			img.className = 'pf-brief__preview';
			box.appendChild(img);
		}

		var p = d.createElement('p');
		p.className = 'pf-brief__text';
		p.textContent = BRIEFS[name] || 'Full write-up available in the quest file.';
		box.appendChild(p);

		if (objEl) {
			var obj = objEl.cloneNode(true);
			obj.className = 'pf-brief__obj';
			box.appendChild(obj);
		}
		if (tags) {
			var t = tags.cloneNode(true);
			t.className = 'pf-quest__tags pf-brief__tags';
			box.appendChild(t);
		}

		var actions = d.createElement('div');
		actions.className = 'pf-brief__actions';
		if (cta) {
			var deploy = d.createElement('a');
			deploy.className = 'pf-btn pf-btn--primary';
			deploy.href = cta.href;
			deploy.innerHTML = '&#9654; deploy &mdash; read the full writeup';
			actions.appendChild(deploy);
		}
		var dismiss = d.createElement('button');
		dismiss.type = 'button';
		dismiss.className = 'pf-btn';
		dismiss.textContent = 'back to quest log';
		dismiss.addEventListener('click', modal.close);
		actions.appendChild(dismiss);
		box.appendChild(actions);

		modal.open(box);
		if (card.classList.contains('pf-quest--legendary')) ach.unlock('legendary');
	}

	$$('.pf-quest').forEach(function (card) {
		if (card.classList.contains('pf-quest--locked')) return;
		card.addEventListener('click', function (ev) {
			if (ev.target.closest('a')) {
				/* direct deploy still counts for legendary hunters */
				if (card.classList.contains('pf-quest--legendary')) ach.unlock('legendary', true);
				return;
			}
			openQuestBriefing(card);
		});
		/* keyboard access to the briefing */
		card.setAttribute('tabindex', '0');
		card.setAttribute('role', 'button');
		card.setAttribute('aria-haspopup', 'dialog');
		card.addEventListener('keydown', function (ev) {
			if (ev.key === 'Enter' || ev.key === ' ') {
				if (ev.target !== card) return;
				ev.preventDefault();
				openQuestBriefing(card);
			}
		});
	});

	/* achievements modal from the HUD counter */
	(function () {
		var btn = $('[data-ach-open]');
		if (!btn) return;
		btn.addEventListener('click', function () {
			var box = d.createElement('div');
			var kick = d.createElement('div');
			kick.className = 'pf-brief__kicker';
			kick.textContent = '// ACHIEVEMENTS · ' + ach.count() + '/' + ach.defs.length + ' UNLOCKED';
			box.appendChild(kick);
			var list = d.createElement('ul');
			list.className = 'pf-achlist';
			ach.defs.forEach(function (def) {
				var li = d.createElement('li');
				var unlocked = ach.has(def.id);
				if (!unlocked) li.className = 'is-locked';
				var icon = d.createElement('span');
				icon.className = 'pf-achlist__icon';
				icon.textContent = unlocked ? def.icon : '🔒︎';
				var txt = d.createElement('div');
				var nm = d.createElement('strong');
				nm.textContent = unlocked ? def.name : '???';
				var ds = d.createElement('em');
				ds.textContent = def.desc;
				txt.appendChild(nm);
				txt.appendChild(ds);
				li.appendChild(icon);
				li.appendChild(txt);
				list.appendChild(li);
			});
			box.appendChild(list);
			modal.open(box);
		});
	})();

	/* ---------------------------------------------------------------------
	   Tabs — menu rail / panels / hash routing / exploration XP
	   --------------------------------------------------------------------- */
	var TABS = ['character', 'quests', 'career', 'skills', 'abilities', 'archives', 'comms'];
	var LEGACY = {
		'fh5co-header': 'character',
		'fh5co-about': 'character',
		'fh5co-resume': 'career',
		'fh5co-features': 'abilities',
		'fh5co-skills': 'skills',
		'fh5co-work': 'archives',
		'fh5co-blog': 'quests',
		'fh5co-started': 'comms',
		'transmission': 'comms'
	};

	var railButtons = $$('[data-tab]');
	var panels = $$('[data-panel]');
	var stage = $('[data-stage]');
	var visited = {};
	var visitedCount = 0;
	var SAVE_KEY = 'pf.save.tab';

	/* stagger indexes — used by the CSS entrance cascade */
	panels.forEach(function (panel) {
		$$('.pf-card, .pf-quest, .pf-ability, .pf-trophy, .pf-act, .pf-stat, .pf-char__card, .pf-dialogue', panel)
			.forEach(function (el, i) {
				el.style.setProperty('--i', String(Math.min(i, 14)));
			});
	});

	/* scramble-decode effect on panel titles — rAF + elapsed-time progress,
	   so background-timer throttling can never strand a half-decoded title */
	var DECODE_CHARS = '█▓▚#%&@$01';
	function decodeTitle(panel) {
		if (reducedMotion) return;
		var title = $('.pf-panel__title', panel);
		if (!title || !title.firstChild || title.firstChild.nodeType !== 3) return;
		var node = title.firstChild;
		if (!title.__pfText) title.__pfText = node.nodeValue;
		var target = title.__pfText;
		var DUR = 380;
		var run = (title.__pfRun || 0) + 1;
		title.__pfRun = run;
		var t0 = null;
		function step(ts) {
			if (title.__pfRun !== run) return; /* superseded by a newer run */
			if (!t0) t0 = ts;
			var p = Math.min((ts - t0) / DUR, 1);
			var done = Math.floor(p * target.length);
			var out = '';
			for (var i = 0; i < target.length; i++) {
				out += (i < done || target[i] === ' ')
					? target[i]
					: DECODE_CHARS[(Math.random() * DECODE_CHARS.length) | 0];
			}
			node.nodeValue = p >= 1 ? target : out;
			if (p < 1) requestAnimationFrame(step);
		}
		requestAnimationFrame(step);
		/* belt-and-braces: force the clean title even if rAF stalls */
		setTimeout(function () {
			if (title.__pfRun === run) node.nodeValue = target;
		}, DUR + 150);
	}

	function trackExploration(id) {
		if (visited[id]) return;
		visited[id] = true;
		visitedCount++;
		var xp = $('[data-xp]');
		var label = $('[data-explored]');
		if (xp) xp.style.width = Math.round((visitedCount / TABS.length) * 100) + '%';
		if (label) label.textContent = String(visitedCount);
		if (visitedCount === TABS.length) {
			ach.unlock('map-100');
			if (Date.now() - loadAt < 60000) ach.unlock('speedrun');
		}
	}

	function activate(id, pushHash, silent) {
		if (TABS.indexOf(id) === -1) id = 'character';
		var prevIdx = TABS.indexOf(currentTab());
		var nextIdx = TABS.indexOf(id);
		railButtons.forEach(function (btn) {
			var on = btn.getAttribute('data-tab') === id;
			btn.classList.toggle('is-active', on);
			btn.setAttribute('aria-selected', on ? 'true' : 'false');
			btn.setAttribute('tabindex', on ? '0' : '-1');
		});
		panels.forEach(function (p) {
			var on = p.id === id;
			if (on) {
				p.setAttribute('data-dir', nextIdx < prevIdx ? 'back' : 'fwd');
				p.classList.add('is-active');
				p.removeAttribute('hidden');
			} else {
				p.classList.remove('is-active');
				p.setAttribute('hidden', '');
			}
		});
		if (stage) stage.scrollTop = 0;
		if (pushHash !== false) {
			try { history.replaceState(null, '', '#' + id); } catch (e) {}
		}
		if (!silent && nextIdx !== prevIdx) snd.play('nav');
		store(SAVE_KEY, id);
		trackExploration(id);
		decodeTitle($('#' + id));
		if (id === 'character') animateStats();
	}

	railButtons.forEach(function (btn) {
		btn.addEventListener('click', function () { activate(btn.getAttribute('data-tab')); });
	});
	$$('[data-tab-link]').forEach(function (btn) {
		btn.addEventListener('click', function () { activate(btn.getAttribute('data-tab-link')); });
	});

	function currentTab() {
		var active = $('[data-panel].is-active');
		return active ? active.id : 'character';
	}

	d.addEventListener('keydown', function (ev) {
		if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
		if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
		if (modal.opened()) return;
		var idx = TABS.indexOf(currentTab());
		if (ev.key >= '1' && ev.key <= '7') {
			activate(TABS[parseInt(ev.key, 10) - 1]);
		} else if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
			if (boot && !boot.classList.contains('is-dismissed')) return;
			activate(TABS[(idx + 1) % TABS.length]);
			ev.preventDefault();
		} else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
			if (boot && !boot.classList.contains('is-dismissed')) return;
			activate(TABS[(idx - 1 + TABS.length) % TABS.length]);
			ev.preventDefault();
		}
	});

	function resolveHash() {
		var h = (location.hash || '').replace('#', '');
		if (!h) return null;
		if (LEGACY[h]) return LEGACY[h];
		if (TABS.indexOf(h) !== -1) return h;
		return null;
	}
	window.addEventListener('hashchange', function () { activate(resolveHash() || 'character', false); });

	/* ---------------------------------------------------------------------
	   Boot screen + CONTINUE save slot
	   --------------------------------------------------------------------- */
	var boot = $('[data-boot]');
	var BOOT_KEY = 'pf.boot.seen';
	var bootSeen = false;
	try { bootSeen = !!sessionStorage.getItem(BOOT_KEY); } catch (e) {}

	function dismissBoot(targetTab) {
		if (!boot || boot.classList.contains('is-dismissed')) return;
		boot.classList.add('is-dismissed');
		try { sessionStorage.setItem(BOOT_KEY, '1'); } catch (e) {}
		d.removeEventListener('keydown', bootKey, true);
		if (targetTab) activate(targetTab);
		announceArrival();
	}
	function bootKey(ev) {
		if (boot.classList.contains('is-dismissed')) return;
		if (ev.key === 'Tab') return; /* keep keyboard nav between START / CONTINUE */
		dismissBoot();
	}

	if (boot) {
		var deepLinked = !!resolveHash() || /[?&]sent=1/.test(location.search);
		if (bootSeen || deepLinked || reducedMotion) {
			boot.classList.add('is-dismissed');
		} else {
			var startBtn = $('[data-boot-start]');
			if (startBtn) startBtn.addEventListener('click', function (ev) { ev.stopPropagation(); dismissBoot(); });

			/* CONTINUE slot — restore the last visited section like a save file */
			var saved = read(SAVE_KEY);
			var contBtn = $('[data-boot-continue]');
			if (contBtn && saved && saved !== 'character' && TABS.indexOf(saved) !== -1) {
				var savedLabel = (function () {
					var btn = $('[data-tab="' + saved + '"] strong');
					return btn ? btn.textContent : saved.toUpperCase();
				})();
				contBtn.innerHTML = 'CONTINUE &mdash; ' + savedLabel + '<small>restore last save</small>';
				contBtn.removeAttribute('hidden');
				contBtn.addEventListener('click', function (ev) {
					ev.stopPropagation();
					dismissBoot(saved);
				});
			}

			boot.addEventListener('click', function (ev) {
				if (ev.target.closest('button')) return;
				dismissBoot();
			});
			d.addEventListener('keydown', bootKey, true);
		}
	}

	var arrivalDone = false;
	function announceArrival() {
		if (arrivalDone) return;
		arrivalDone = true;
		var fresh = ach.unlock('new-game');
		if (!fresh) {
			toast('CONTINUE', 'PLAYER FILE RESTORED — welcome back');
		} else {
			toast('NEW GAME', 'PLAYER FILE LOADED — use keys 1–7 or the menu to explore');
		}
	}

	/* ---------------------------------------------------------------------
	   Stat count-up (character panel)
	   --------------------------------------------------------------------- */
	var statsAnimated = false;
	function animateStats() {
		if (statsAnimated || reducedMotion) { statsAnimated = true; return; }
		statsAnimated = true;
		$$('[data-count]').forEach(function (el) {
			var target = parseInt(el.getAttribute('data-count'), 10);
			var suffix = el.getAttribute('data-suffix') || '';
			if (isNaN(target)) return;
			var t0 = null;
			var DUR = 900;
			function step(ts) {
				if (!t0) t0 = ts;
				var p = Math.min((ts - t0) / DUR, 1);
				el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
				if (p < 1) requestAnimationFrame(step);
			}
			requestAnimationFrame(step);
		});
	}

	/* ---------------------------------------------------------------------
	   Card tilt — pointer-driven, rAF-batched, desktop only
	   --------------------------------------------------------------------- */
	if (finePointer && !reducedMotion) {
		var tiltEl = null;
		var tiltEv = null;
		var tiltRaf = 0;
		function applyTilt() {
			tiltRaf = 0;
			if (!tiltEl || !tiltEv) return;
			var r = tiltEl.getBoundingClientRect();
			var px = (tiltEv.clientX - r.left) / r.width - 0.5;
			var py = (tiltEv.clientY - r.top) / r.height - 0.5;
			tiltEl.style.transform =
				'perspective(700px) translateY(-3px) rotateX(' + (-py * 4).toFixed(2) + 'deg) rotateY(' + (px * 4).toFixed(2) + 'deg)';
		}
		['.pf-quests', '.pf-trophies'].forEach(function (sel) {
			var host = $(sel);
			if (!host) return;
			host.addEventListener('pointermove', function (ev) {
				var card = ev.target.closest('.pf-quest, .pf-trophy');
				if (!card) return;
				if (tiltEl && tiltEl !== card) tiltEl.style.transform = '';
				tiltEl = card;
				tiltEv = ev;
				if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
			});
			host.addEventListener('pointerleave', function () {
				if (tiltEl) tiltEl.style.transform = '';
				tiltEl = null;
			}, true);
			host.addEventListener('pointerout', function (ev) {
				var card = ev.target.closest('.pf-quest, .pf-trophy');
				if (card && (!ev.relatedTarget || !card.contains(ev.relatedTarget))) {
					card.style.transform = '';
					if (tiltEl === card) tiltEl = null;
				}
			});
		});
	}

	/* ---------------------------------------------------------------------
	   Accent variants — plasma / crimson / gold
	   --------------------------------------------------------------------- */
	(function accents() {
		var KEY = 'pf.accent';
		var host = $('[data-accents]');
		function apply(name, persist) {
			html.classList.remove('pf-accent-crimson', 'pf-accent-gold');
			if (name === 'crimson' || name === 'gold') html.classList.add('pf-accent-' + name);
			if (host) $$('button', host).forEach(function (b) {
				b.classList.toggle('is-on', b.getAttribute('data-accent') === name);
			});
			if (persist) store(KEY, name);
		}
		var saved = read(KEY);
		if (saved && saved !== 'plasma') apply(saved);
		if (host) host.addEventListener('click', function (ev) {
			var b = ev.target.closest('[data-accent]');
			if (!b) return;
			apply(b.getAttribute('data-accent'), true);
			snd.play('tick');
		});
		window.__pfAccent = apply; /* konami uses this */
	})();

	/* ---------------------------------------------------------------------
	   Konami code → GOD MODE
	   --------------------------------------------------------------------- */
	(function konami() {
		var SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
		var pos = 0;
		d.addEventListener('keydown', function (ev) {
			var key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
			pos = (key === SEQ[pos]) ? pos + 1 : (key === SEQ[0] ? 1 : 0);
			if (pos === SEQ.length) {
				pos = 0;
				if (window.__pfAccent) window.__pfAccent('gold', true);
				if (!ach.unlock('konami')) toast('GOD MODE', 'already unlocked — gold accent re-applied');
			}
		});
	})();

	/* ---------------------------------------------------------------------
	   HUD clock
	   --------------------------------------------------------------------- */
	(function clock() {
		var el = $('[data-clock]');
		if (!el) return;
		function pad(n) { return n < 10 ? '0' + n : '' + n; }
		function tick() {
			var t = new Date();
			el.textContent = pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds());
		}
		tick();
		setInterval(tick, 1000);
	})();

	/* ---------------------------------------------------------------------
	   Views counter — counterapi.dev, same namespace/key + session guard
	   as the classic UI so counts stay consistent across both.
	   --------------------------------------------------------------------- */
	(function views() {
		var el = $('[data-views]');
		if (!el || !window.fetch) return;
		var BASE = 'https://api.counterapi.dev/v1/kon2raya-portfolio/views';
		var SESS = 'portfolio.views.incremented';
		function parseCount(data) {
			if (!data) return null;
			if (typeof data.count === 'number') return data.count;
			if (data.data && typeof data.data.count === 'number') return data.data.count;
			return null;
		}
		function show(n) { if (n != null && n > 0) el.textContent = n.toLocaleString(); }
		var incremented = false;
		try { incremented = !!sessionStorage.getItem(SESS); } catch (e) {}
		function get(url, retry) {
			fetch(url)
				.then(function (r) { return r.json(); })
				.then(function (data) {
					var n = parseCount(data);
					show(n);
					if (n != null && !incremented) { try { sessionStorage.setItem(SESS, '1'); } catch (e) {} }
					if (n == null && retry) setTimeout(function () { get(BASE, false); }, 5000);
				})
				.catch(function () { if (retry) setTimeout(function () { get(BASE, false); }, 5000); });
		}
		get(incremented ? BASE : BASE + '/up', true);
	})();

	/* ---------------------------------------------------------------------
	   Copy buttons
	   --------------------------------------------------------------------- */
	$$('[data-copy]').forEach(function (btn) {
		btn.addEventListener('click', function () {
			var text = btn.getAttribute('data-copy');
			function done() {
				btn.classList.add('is-copied');
				btn.textContent = 'copied';
				snd.play('tick');
				toast('ITEM ACQUIRED', text + ' → clipboard', 2600);
				ach.unlock('copycat');
				setTimeout(function () { btn.classList.remove('is-copied'); btn.textContent = 'copy'; }, 2200);
			}
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(text).then(done).catch(function () {});
			}
		});
	});

	/* ---------------------------------------------------------------------
	   Patch notes — last 5 commits, 30-min localStorage cache
	   --------------------------------------------------------------------- */
	(function gitlog() {
		var host = $('[data-git-log]');
		if (!host || !window.fetch) return;
		var KEY = 'pf.gitLog.cache';
		var TTL = 30 * 60 * 1000;

		function render(items) {
			host.innerHTML = '';
			items.forEach(function (c) {
				var li = d.createElement('li');
				var hash = d.createElement('span');
				hash.className = 'pf-gitlog__hash';
				hash.textContent = c.sha;
				var date = d.createElement('span');
				date.className = 'pf-gitlog__date';
				date.textContent = c.date;
				li.appendChild(hash);
				li.appendChild(d.createTextNode(c.msg));
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

		fetch('https://api.github.com/repos/kon2raya24/portfolio/commits?per_page=5', {
			headers: { 'Accept': 'application/vnd.github+json' }
		})
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
				if (!host.children.length || host.querySelector('.pf-gitlog__loading')) {
					host.innerHTML = '<li class="pf-gitlog__loading">$ offline — view history on GitHub instead</li>';
				}
			});
	})();

	/* ---------------------------------------------------------------------
	   Contact form return (?sent=1) → comms + success state
	   --------------------------------------------------------------------- */
	var sentReturn = /[?&]sent=1/.test(location.search);
	if (sentReturn) {
		var ok = $('[data-form-success]');
		if (ok) ok.removeAttribute('hidden');
		toast('QUEST COMPLETE', 'TRANSMISSION SENT — reply lands within 24h', 6000);
		ach.unlock('transmission');
		try { history.replaceState(null, '', location.pathname + '#comms'); } catch (e) {}
	}

	/* ---------------------------------------------------------------------
	   Init — route the starting tab
	   --------------------------------------------------------------------- */
	var initial = resolveHash() || 'character';
	if (sentReturn) initial = 'comms';
	activate(initial, false, true);
	if (boot && boot.classList.contains('is-dismissed')) announceArrival();
})();
