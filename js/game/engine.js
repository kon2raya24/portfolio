/* =============================================================================
   NIGHT SHIFT — engine / orchestrator
   The screen state machine, the operator console, hash routing, travel
   transitions, level-up commendations, and the dawn sequence. Mounts every
   screen into a single stage; the console is the only persistent chrome.
   ========================================================================== */

import * as S from './state.js';
import { CLEARANCE, STAMPS } from './state.js';
import { TOTAL_FACILITIES, nodeById, isDiscovered, allNodes, FACILITIES, ANOMALIES } from './geometry.js';
import { missionFor, OPERATOR } from './missions.data.js';
import { renderBoard, stopAmbient } from './board.js';
import { renderMission } from './mission.js';
import { renderReport } from './report.js';
import { renderComms } from './comms.js';
import { renderColdOpen } from './coldopen.js';
import { renderHQ, renderToolkit } from './screens.js';
import * as Sound from './sound.js';
import { el, clear, parseHash, setHash, wait, prefersReducedMotion } from './util.js';

let root, stage, consoleEl, hailEl, travelEl, commendEl, anomEl, toastEl;
let boardApi = null;
let lastClearance = 1;
let lastStampCount = 0;
let current = 'BOOT';

export function boot(mount) {
  root = mount;
  S.load();
  lastClearance = S.clearanceInfo().level;
  lastStampCount = S.get().stamps.length;

  clear(root);
  stage = el('.ns-stage', { id: 'ns-stage' });
  consoleEl = el('.ns-console', { role: 'toolbar', 'aria-label': 'Operator console', hidden: 'hidden' });
  hailEl = el('.ns-hail', { hidden: 'hidden', role: 'dialog', 'aria-label': 'Dispatcher', 'aria-modal': 'false' });
  anomEl = el('.ns-anom', { hidden: 'hidden', role: 'dialog', 'aria-label': 'Signal decode', 'aria-modal': 'true' });
  travelEl = el('.ns-travel', { hidden: 'hidden', 'aria-hidden': 'true' });
  commendEl = el('.ns-commend', { 'aria-live': 'assertive' });
  toastEl = el('.ns-toast', { 'aria-live': 'polite' });
  root.appendChild(stage);
  root.appendChild(consoleEl);
  root.appendChild(hailEl);
  root.appendChild(anomEl);
  root.appendChild(travelEl);
  root.appendChild(commendEl);
  root.appendChild(toastEl);

  buildConsole();
  S.subscribe(onStateChange);
  bindKeys();
  window.addEventListener('hashchange', routeFromHash);

  // returning users skip the cold open; resume their hum on the first gesture
  if (S.get().flags.soundOn) {
    const resume = () => {
      Sound.setEnabled(true);
      Sound.setIntensity(S.onlineCount());
      document.removeEventListener('pointerdown', resume);
    };
    document.addEventListener('pointerdown', resume, { once: true });
  }

  routeFromHash(true);
}

/* ---- routing --------------------------------------------------------------- */

function routeFromHash(initial) {
  const { screen, arg } = parseHash();
  const tutorialDone = S.get().flags.tutorialDone;

  if (!screen) {
    // first load: cold open unless mid-shift, else board
    return go(tutorialDone ? 'BOARD' : 'BOOT', null, { silent: true });
  }
  const map = { board: 'BOARD', facility: 'FACILITY', report: 'REPORT', hq: 'HQ', toolkit: 'TOOLKIT', comms: 'COMMS', boot: 'BOOT', dawn: 'DAWN' };
  const target = map[screen] || (tutorialDone ? 'BOARD' : 'BOOT');
  go(target, arg, { silent: true, fromHash: true });
}

export function go(screen, arg, opts = {}) {
  current = screen;
  if (!opts.silent) setHash(hashFor(screen), arg);
  // console visible everywhere except the cold open
  consoleEl.hidden = (screen === 'BOOT');
  closeHail();
  if (screen !== 'BOARD') stopAmbient();

  switch (screen) {
    case 'BOOT': return showColdOpen();
    case 'BOARD': return showBoard();
    case 'FACILITY': return showFacility(arg, opts);
    case 'REPORT': return showReport();
    case 'HQ': clear(stage); renderHQ(stage); return refreshConsole();
    case 'TOOLKIT': clear(stage); renderToolkit(stage); return refreshConsole();
    case 'COMMS': clear(stage); renderComms(stage); return refreshConsole();
    case 'DAWN': return showDawn();
    default: return showBoard();
  }
}

function hashFor(screen) {
  return ({ BOOT: 'boot', BOARD: 'board', FACILITY: 'facility', REPORT: 'report', HQ: 'hq', TOOLKIT: 'toolkit', COMMS: 'comms', DAWN: 'dawn' })[screen] || 'board';
}

/* ---- screens --------------------------------------------------------------- */

function showColdOpen() {
  clear(stage);
  renderColdOpen(stage, {
    onBegin: () => {
      // the click is the user gesture WebAudio needs to start
      Sound.setEnabled(S.get().flags.soundOn);
      Sound.setIntensity(S.onlineCount());
      const tutorialDone = S.get().flags.tutorialDone;
      if (tutorialDone) go('BOARD');
      else go('FACILITY', 'station-zero');
    },
    onSkipToReport: () => go('REPORT'),
  });
}

function showBoard() {
  clear(stage);
  boardApi = renderBoard(stage, {
    onDispatch: (id) => go('FACILITY', id),
    onAnomaly: (id) => showAnomaly(id),
  });
  refreshConsole();
}

/* ---- anomaly decode (off-network signal encounter) ------------------------ */

function showAnomaly(id) {
  const a = ANOMALIES.find(x => x.id === id);
  if (!a) return;
  const fresh = !S.get().anomaliesFound.includes(id);
  S.findAnomaly(id);
  if (boardApi && boardApi.refresh) boardApi.refresh();

  const external = /^https?:/.test(a.href);
  clear(anomEl);
  const panel = el('.anom-panel', null, [
    el('.anom-head', null, [
      el('span.anom-tag', { text: 'SIGNAL DECODED' }),
      el('button.anom-x', { type: 'button', text: '✕', 'aria-label': 'Close', on: { click: closeAnomaly } }),
    ]),
    el('h2.anom-name', { text: a.codename }),
    el('p.anom-detail', { text: a.detail }),
    el('.anom-acts', null, [
      el('a.anom-go', { href: a.href, text: a.cta, target: external ? '_blank' : '_self', rel: 'noopener' }),
      el('button.anom-dismiss', { type: 'button', text: 'Leave the signal', on: { click: closeAnomaly } }),
    ]),
  ]);
  anomEl.appendChild(panel);
  anomEl.hidden = false;
  const x = anomEl.querySelector('.anom-x'); if (x) x.focus();
  if (fresh) toast(`§ signal logged · ${a.codename}`);
}

function closeAnomaly() { if (anomEl) { anomEl.hidden = true; clear(anomEl); } }

function showFacility(id, opts) {
  const node = nodeById(id);
  const online = S.get().flags;
  // guard: undiscovered facility via deep link → bounce to board
  if (!node || (!isDiscovered(node, onlineIds(), online.tutorialDone) && id !== 'station-zero')) {
    return go('BOARD');
  }
  const enter = () => {
    clear(stage);
    renderMission(stage, id, {
      onExit: () => go('BOARD'),
      onStateChange: () => refreshConsole(),
      onRestore: (fid, mission) => afterRestore(fid, mission),
    });
    refreshConsole();
  };
  if (opts && opts.fromHash) enter();
  else travel(node, enter);
}

function showReport() {
  clear(stage);
  renderReport(stage);
  refreshConsole();
}

function onlineIds() {
  return Object.entries(S.get().facilities).filter(([, f]) => f.status === 'online').map(([id]) => id);
}

/* ---- post-restore: commendations + dawn ----------------------------------- */

function afterRestore(fid, mission) {
  refreshConsole();
  Sound.setIntensity(S.onlineCount());   // one more harmonic layer lights up
  Sound.confirmTone();
  // dawn check — all real facilities online
  if (S.onlineCount() >= TOTAL_FACILITIES && !S.get().flags.dawn) {
    S.triggerDawn();
    // let the mission debrief finish, then sweep to dawn
    wait(prefersReducedMotion() ? 200 : 1400).then(() => go('DAWN'));
  }
}

function onStateChange(st) {
  refreshConsole();
  const lvl = S.clearanceInfo().level;
  if (lvl > lastClearance) {
    const reached = CLEARANCE.find(c => c.level === lvl);
    commend(lvl, reached ? reached.title : '');
    lastClearance = lvl;
  }
  // stamp-earned feedback — announce any newly earned commendation stamp
  if (st.stamps.length > lastStampCount) {
    const newest = st.stamps[st.stamps.length - 1];
    const stp = STAMPS[newest];
    if (stp) { toast(`★ STAMP EARNED · ${stp.label}`); Sound.stampTone(); }
    lastStampCount = st.stamps.length;
  }
}

/* ---- transient toast (stamps, anomaly logs) ------------------------------- */

let toastTimer = 0;
function toast(text) {
  if (!toastEl) return;
  clear(toastEl);
  const card = el('.toast-card', { role: 'status', text });
  toastEl.appendChild(card);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    card.classList.add('out');
    setTimeout(() => clear(toastEl), 400);
  }, prefersReducedMotion() ? 2200 : 2800);
}

function commend(level, title) {
  const seen = S.get().flags.seenCommendations || [];
  if (seen.includes(level)) return;
  S.update(s => { s.flags.seenCommendations = [...seen, level]; });
  const card = el('.commend-card', { role: 'status' }, [
    el('span.commend-kicker', { text: 'CLEARANCE RAISED' }),
    el('span.commend-level', { text: `L${level} · ${title}` }),
    el('span.commend-note', { text: 'A sealed posting just opened in your Service Record.' }),
  ]);
  clear(commendEl); commendEl.appendChild(card);
  wait(prefersReducedMotion() ? 1800 : 3600).then(() => card.classList.add('out')).then(() => wait(400)).then(() => clear(commendEl));
}

/* ---- travel transition ----------------------------------------------------- */

function travel(node, done) {
  if (prefersReducedMotion()) {
    travelEl.hidden = false;
    travelEl.className = 'ns-travel rm';
    wait(120).then(() => { travelEl.hidden = true; done(); });
    return;
  }
  travelEl.hidden = false;
  travelEl.className = 'ns-travel';
  clear(travelEl);
  travelEl.appendChild(el('.travel-comet'));
  travelEl.appendChild(el('.travel-dest', { text: `DISPATCHING → ${displayName(node)}` }));
  // allow skip
  const skip = () => finish();
  travelEl.addEventListener('pointerdown', skip, { once: true });
  let to = setTimeout(finish, 1400);
  function finish() {
    clearTimeout(to);
    travelEl.hidden = true;
    done();
  }
}

function displayName(node) {
  const m = missionFor(node.id);
  return (m && m.name) || node.name;
}

/* ---- operator console ------------------------------------------------------ */

function buildConsole() {
  consoleEl.appendChild(el('.con-id', null, [
    el('span.con-net', { text: 'PHILSPAN' }),
    el('span.con-op', { id: 'con-op', text: '' }),
  ]));

  const clr = el('button.con-clear', { id: 'con-clear', type: 'button', title: 'Clearance & XP', on: { click: () => go('HQ') } });
  consoleEl.appendChild(clr);

  const integ = el('.con-integ', { title: 'Network integrity' }, [
    el('.con-integ-bar', null, [el('.con-integ-fill', { id: 'con-integ-fill' })]),
    el('span.con-integ-pct', { id: 'con-integ-pct', text: '0%' }),
  ]);
  consoleEl.appendChild(integ);

  const nav = el('.con-nav');
  nav.appendChild(navBtn('BOARD', 'B', () => go('BOARD')));
  nav.appendChild(navBtn('HQ', '', () => go('HQ')));
  nav.appendChild(navBtn('TOOLKIT', '', () => go('TOOLKIT')));
  nav.appendChild(navBtn('REPORT', 'R', () => go('REPORT')));
  const commsBtn = navBtn('COMMS', '', () => go('COMMS'));
  commsBtn.id = 'con-comms';
  nav.appendChild(commsBtn);
  consoleEl.appendChild(nav);

  const right = el('.con-right');
  right.appendChild(el('button.con-hail', { type: 'button', title: 'Hail the Dispatcher (H)', on: { click: toggleHail } }, [
    el('span.con-hail-ico', { text: '🎧' }), el('span.con-hail-txt', { text: 'HAIL' }),
  ]));
  right.appendChild(el('button.con-sound', { id: 'con-sound', type: 'button', title: 'Toggle ambient sound', on: { click: toggleSound } }));
  right.appendChild(el('button.con-reset', { type: 'button', title: 'Start a new shift (resets progress)', text: 'NEW SHIFT', on: { click: newShift } }));
  consoleEl.appendChild(right);
}

function toggleSound() {
  const on = !S.get().flags.soundOn;
  S.setSound(on);
  Sound.setEnabled(on);
  Sound.setIntensity(S.onlineCount());
  refreshConsole();
}

function navBtn(label, key, fn) {
  return el('button.con-btn', { type: 'button', on: { click: fn } }, [
    el('span.con-btn-txt', { text: label }),
    key ? el('span.con-key', { text: key }) : null,
  ]);
}

function refreshConsole() {
  const st = S.get();
  const clr = S.clearanceInfo();
  const integ = S.integrity(TOTAL_FACILITIES);
  const opEl = document.getElementById('con-op');
  if (opEl) opEl.textContent = st.operatorName ? '· ' + st.operatorName : '· operator';
  const clrEl = document.getElementById('con-clear');
  if (clrEl) clrEl.textContent = `L${clr.level} ${clr.title}`;
  const fill = document.getElementById('con-integ-fill');
  if (fill) fill.style.width = integ + '%';
  const pct = document.getElementById('con-integ-pct');
  if (pct) pct.textContent = integ + '%';
  const comms = document.getElementById('con-comms');
  if (comms) {
    const unlocked = st.flags.commsUnlocked;
    comms.classList.toggle('locked', !unlocked);
    comms.title = unlocked ? 'Open the channel to the operator' : 'Locked — bring the first facility online';
    if (st.flags.dawn) comms.classList.add('con-comms-live');
  }
  const snd = document.getElementById('con-sound');
  if (snd) { snd.textContent = st.flags.soundOn ? '🔊' : '🔇'; snd.classList.toggle('on', st.flags.soundOn); }
}

/* ---- HAIL overlay (help / guidance, unified into the NPC) ------------------ */

function toggleHail() { if (hailEl.hidden) openHail(); else closeHail(); }

function openHail() {
  const st = S.get();
  clear(hailEl);
  const next = suggestNext();
  const lines = [];
  if (!st.flags.tutorialDone) lines.push('Start at STATION ZERO — bring the relay up and the board lights.');
  else if (next) lines.push(`Network’s still dark in places. ${next.name} is reachable and offline — good next move.`);
  else lines.push('Every facility’s green. Channel to the operator is open — bottom of the console, or here.');

  const panel = el('.hail-panel', null, [
    el('.hail-head', null, [el('span.hail-tag', { text: 'DISPATCH' }), el('button.hail-x', { type: 'button', text: '✕', 'aria-label': 'Close', on: { click: closeHail } })]),
    el('p.hail-line', { text: lines[0] }),
  ]);
  const acts = el('.hail-acts');
  if (next) acts.appendChild(el('button.hail-act', { type: 'button', text: `Route me to ${next.name} ▸`, on: { click: () => { closeHail(); go('FACILITY', next.id); } } }));
  if (st.flags.commsUnlocked) acts.appendChild(el('button.hail-act', { type: 'button', text: 'Open the channel ▸', on: { click: () => { closeHail(); go('COMMS'); } } }));
  acts.appendChild(el('button.hail-act.ghost', { type: 'button', text: 'Shift report ▸', on: { click: () => { closeHail(); go('REPORT'); } } }));
  panel.appendChild(acts);
  hailEl.appendChild(panel);
  hailEl.hidden = false;
  const x = hailEl.querySelector('.hail-x'); if (x) x.focus();
}

function closeHail() { if (hailEl) { hailEl.hidden = true; clear(hailEl); } }

function suggestNext() {
  const online = onlineIds();
  const tut = S.get().flags.tutorialDone;
  const cand = FACILITIES.filter(n => isDiscovered(n, online, tut) && !online.includes(n.id));
  cand.sort((a, b) => (a.tier || 9) - (b.tier || 9));
  const pick = cand[0];
  return pick ? { id: pick.id, name: displayName(pick) } : null;
}

/* ---- dawn sequence --------------------------------------------------------- */

function showDawn() {
  clear(stage);
  document.documentElement.classList.add('ns-dawn');
  const wrap = el('.dawn');
  wrap.appendChild(el('.dawn-sky', { 'aria-hidden': 'true' }));
  wrap.appendChild(el('.dawn-body', null, [
    el('p.dawn-kicker', { text: '05:14 · DAWN' }),
    el('h1.dawn-title', { text: 'NETWORK STABLE' }),
    el('p.dawn-sub', { text: `Every facility green. You ran the whole board, ${S.get().operatorName || 'operator'}.` }),
    el('p.dawn-line', { text: '“Network’s stable. Shift’s over. If you want to talk about what you saw — channel’s open.” — DISPATCH' }),
    el('.dawn-acts', null, [
      el('button.btn-primary', { type: 'button', text: 'OPEN THE CHANNEL ▸', on: { click: () => go('COMMS') } }),
      el('button.btn-ghost', { type: 'button', text: 'Read the shift report', on: { click: () => go('REPORT') } }),
      el('button.btn-ghost', { type: 'button', text: 'Leave the network running', on: { click: () => go('BOARD') } }),
    ]),
  ]));
  stage.appendChild(wrap);
  refreshConsole();
  Sound.dawnSwell();
  const b = wrap.querySelector('.btn-primary'); if (b) wait(60).then(() => b.focus());
}

/* ---- new shift ------------------------------------------------------------- */

function newShift() {
  S.reset();
  lastClearance = 1;
  document.documentElement.classList.remove('ns-dawn');
  go('BOOT');
}

/* ---- global keys ----------------------------------------------------------- */

function bindKeys() {
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    const t = e.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (typing) return;
    if (e.key === 'h' || e.key === 'H') { e.preventDefault(); toggleHail(); }
    else if (e.key === 'r' || e.key === 'R') { if (current !== 'REPORT') { e.preventDefault(); go('REPORT'); } }
    else if (e.key === 'b' || e.key === 'B') { if (current !== 'FACILITY') { e.preventDefault(); go('BOARD'); } }
    else if (e.key === 'Escape') {
      if (!anomEl.hidden) { e.preventDefault(); closeAnomaly(); }
      else if (!hailEl.hidden) { e.preventDefault(); closeHail(); }
    }
  });
}
