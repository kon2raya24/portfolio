/* =============================================================================
   NIGHT SHIFT — the mission screen (one facility, four beats)
   ARRIVAL → DIAGNOSIS → THE CALL → RESTORE. Left: a living schematic diorama
   with focusable hotspot overlays. Right: the comms pane (Dispatcher dialogue,
   hotspot log, the decision card, telemetry). All text is real DOM.
   ========================================================================== */

import { el, clear, countUp, wait } from './util.js';
import { say, echo, clearComms, mountDispatcher } from './dispatcher.js';
import { buildSchematic, healSchematic } from './schematics.js';
import { missionFor } from './missions.data.js';
import * as S from './state.js';

export function renderMission(container, facilityId, opts = {}) {
  const m = missionFor(facilityId);
  if (!m) { opts.onExit && opts.onExit(); return; }
  clear(container);

  const already = S.isOnline(facilityId) || (m.isTutorial && S.get().flags.tutorialDone);

  // one-way beat guard: transitions only ever move forward, and each is
  // idempotent — a stray or duplicate click can never skip ahead a beat.
  let beat = 'init';

  const screen = el('.mission', { 'data-facility': facilityId });

  // ---- stage (left): schematic + hotspot overlay --------------------------
  const stage = el('.mission-stage');
  const { svg, anchors } = buildSchematic(m.schematicType);
  const schemWrap = el('.schem-wrap', null, [svg]);
  const hotLayer = el('.hotspot-layer', { 'aria-hidden': 'false' });
  schemWrap.appendChild(hotLayer);
  stage.appendChild(el('.mission-stage-head', null, [
    el('span.ms-class', { text: m.systemClass }),
    el('span.ms-real', { text: m.realName }),
  ]));
  stage.appendChild(schemWrap);
  const telemetry = el('.telemetry', { 'aria-live': 'polite' });
  stage.appendChild(telemetry);

  // ---- comms (right): name, dialogue, beat actions ------------------------
  const comms = el('.mission-comms');
  comms.appendChild(el('.mc-head', null, [
    el('h1.mc-name', { text: m.name }),
    el('button.mc-exit', { type: 'button', text: '↩ BOARD', title: 'Return to the board (Esc)', on: { click: exit } }),
  ]));
  const log = el('.comms-log', { role: 'log', 'aria-live': 'polite', tabindex: '0' });
  comms.appendChild(log);
  const actions = el('.mc-actions');
  comms.appendChild(actions);

  screen.appendChild(stage);
  screen.appendChild(comms);
  container.appendChild(screen);
  mountDispatcher(log);

  // re-entering a restored facility: show it already healed, not degraded
  if (already) healSchematic(svg);

  function exit() { opts.onExit && opts.onExit(); }
  // Esc returns to board
  const escHandler = (e) => { if (e.key === 'Escape') { e.preventDefault(); exit(); } };
  document.addEventListener('keydown', escHandler);
  const cleanup = () => document.removeEventListener('keydown', escHandler);
  const origExit = opts.onExit;
  opts.onExit = () => { cleanup(); origExit && origExit(); };

  /* ---- BEAT 1 — ARRIVAL ------------------------------------------------- */
  function beatArrival() {
    beat = 'arrival';
    clear(actions);
    const intro = already
      ? [`Welcome back to ${m.name}. ${m.realName} — already nominal. Look around if you like.`]
      : [`Arriving at ${m.name}. ${m.realName}.`, m.arrival_problem];
    say(intro).then(() => {
      if (already) { beatDiagnosis(true); return; }
      const btn = el('button.btn-primary', { type: 'button', text: 'PROBE THE FLOOR ▸', on: { click: beatDiagnosis } });
      actions.appendChild(btn);
      btn.focus();
    });
  }

  /* ---- BEAT 2 — DIAGNOSIS (hotspots) ------------------------------------ */
  function beatDiagnosis(quiet) {
    if (beat !== 'arrival' && beat !== 'diagnosis') return;
    beat = 'diagnosis';
    clear(actions);
    if (!quiet) say('Probe the schematic. Each marker is a real constraint this system had to answer. Find what you can — then make the call.');
    placeHotspots();
    const proceed = el('button.btn-primary', { type: 'button', text: 'MAKE THE CALL ▸', on: { click: beatCall } });
    actions.appendChild(proceed);
    if (quiet) proceed.focus();
  }

  function placeHotspots() {
    clear(hotLayer);
    const found = S.facility(facilityId).hotspotsFound || [];
    m.hotspots.forEach((h, i) => {
      const a = anchors[i] || { x: 50, y: 50 };
      const isFound = found.includes(i);
      const dot = el('button.hotspot' + (isFound ? ' hotspot-found' : ''), {
        type: 'button',
        style: `left:${a.x}%;top:${a.y}%`,
        'aria-label': `Hotspot ${i + 1}: ${h.label}${isFound ? ' (inspected)' : ''}`,
        text: String(i + 1),
        on: { click: () => inspect(i, h, dot) },
      });
      hotLayer.appendChild(dot);
    });
  }

  function inspect(i, h, dot) {
    const first = S.recordHotspot(facilityId, i, m.hotspots.length);
    dot.classList.add('hotspot-found');
    dot.setAttribute('aria-label', `Hotspot ${i + 1}: ${h.label} (inspected)`);
    echo(`◢ ${h.label}`, 'comms-hotspot');
    say(h.reveal);
    if (first) {
      toast('§ logged to shift report');
      opts.onStateChange && opts.onStateChange();
    }
  }

  /* ---- BEAT 3 — THE CALL (decision) ------------------------------------- */
  function beatCall() {
    if (beat !== 'diagnosis') return;
    beat = 'call';
    clear(actions);
    const prior = S.facility(facilityId).call;
    say(['The Call.', m.call.prompt, 'Your call, operator.']).then(() => {
      const card = el('.decision', { role: 'group', 'aria-label': 'Architectural decision' });
      m.call.options.forEach(opt => {
        const o = el('button.decision-opt', {
          type: 'button',
          on: { click: () => chooseOption(opt, card) },
        }, [
          el('span.do-id', { text: opt.id.toUpperCase() }),
          el('span.do-label', { text: opt.label }),
          el('span.do-tradeoff', { text: opt.tradeoff }),
        ]);
        if (prior === opt.id) o.classList.add('decision-prior');
        card.appendChild(o);
      });
      actions.appendChild(card);
      const firstOpt = card.querySelector('.decision-opt');
      if (firstOpt) firstOpt.focus();
    });
  }

  let pendingOption = null;
  function chooseOption(opt, card) {
    if (beat !== 'call') return;
    if (pendingOption === opt.id) { confirmOption(opt); return; }
    pendingOption = opt.id;
    // reset all options, then arm only the chosen one
    card.querySelectorAll('.decision-opt').forEach(b => b.classList.remove('decision-armed'));
    card.querySelectorAll('.do-confirm').forEach(c => c.remove());
    const btn = Array.from(card.querySelectorAll('.decision-opt')).find(b => b.querySelector('.do-id').textContent === opt.id.toUpperCase());
    if (btn) {
      btn.classList.add('decision-armed');
      btn.appendChild(el('span.do-confirm', { text: 'COMMIT ▸ (click again to confirm)' }));
    }
  }

  function confirmOption(opt) {
    if (beat !== 'call') return;
    beat = 'committed';
    const isConcurrence = opt.id === m.call.actual;
    S.recordCall(facilityId, opt.id, isConcurrence);
    clear(actions);
    const actualOpt = m.call.options.find(o => o.id === m.call.actual);
    const verdict = isConcurrence
      ? `CONCURRENCE. That's the call I made.`
      : `Reasonable — but I went a different way. I chose "${actualOpt.label}".`;
    echo(`▶ YOUR CALL: ${opt.label}`, 'comms-choice');
    say([verdict, m.call.reasoning]).then(() => {
      opts.onStateChange && opts.onStateChange();
      const btn = el('button.btn-restore', { type: 'button', text: '⏻ THROW THE SWITCH', on: { click: beatRestore } });
      actions.appendChild(btn);
      btn.focus();
    });
  }

  /* ---- BEAT 4 — RESTORE (outcomes) -------------------------------------- */
  function beatRestore() {
    if (beat !== 'committed') return;
    beat = 'restore';
    clear(actions);
    // remove remaining hotspot affordances; heal the diorama
    healSchematic(svg);
    say(`${m.name} coming online. Watch the floor settle.`);
    renderTelemetry().then(() => {
      const wasOffline = !S.isOnline(facilityId);
      S.restore(facilityId, m);
      opts.onRestore && opts.onRestore(facilityId, m);

      const tools = (m.tools || []).slice(0, 8);
      if (tools.length) echo(`✚ TOOLKIT: ${tools.join(', ')}`, 'comms-reward');
      say(['Facility green. Toolkit updated, report appended.', 'Back to the board when you’re ready — or pull the full archive on this site.']).then(() => {
        clear(actions);
        actions.appendChild(el('a.btn-archive', { href: m.archiveUrl, text: 'OPEN FACILITY ARCHIVE ↗', target: '_self', rel: 'noopener' }));
        actions.appendChild(el('button.btn-primary', { type: 'button', text: 'RETURN TO BOARD ▸', on: { click: exit } }));
        const ret = actions.querySelector('.btn-primary');
        if (ret) ret.focus();
      });
    });
  }

  function renderTelemetry() {
    clear(telemetry);
    telemetry.appendChild(el('.telemetry-head', { text: 'TELEMETRY · LIVE' }));
    const grid = el('.telemetry-grid');
    telemetry.appendChild(grid);
    const proms = [];
    (m.outcomes || []).forEach((o) => {
      const valEl = el('span.tm-val');
      const cell = el('.tm-cell', null, [valEl, el('span.tm-label', { text: o.metric })]);
      grid.appendChild(cell);
      const num = parseFloat(String(o.value).replace(/[^0-9.]/g, ''));
      if (!isNaN(num) && /^[~\d]/.test(String(o.value))) {
        const prefix = String(o.value).startsWith('~') ? '~' : '';
        proms.push(countUp(valEl, 0, num, { dur: 800, prefix, suffix: o.unit ? ' ' + o.unit : '' }));
      } else {
        valEl.textContent = o.value + (o.unit ? ' ' + o.unit : '');
      }
    });
    return Promise.all(proms);
  }

  /* ---- transient toast -------------------------------------------------- */
  function toast(text) {
    const t = el('.mc-toast', { role: 'status', text });
    comms.appendChild(t);
    wait(1600).then(() => t.classList.add('out')).then(() => wait(300)).then(() => t.remove());
  }

  // kick off
  clearComms();
  beatArrival();
}
