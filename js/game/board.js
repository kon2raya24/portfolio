/* =============================================================================
   NIGHT SHIFT — THE BOARD (the hub)
   A dark vector archipelago. Every facility is a real focusable button in the
   accessibility tree, spatially arranged. Selecting raises an HTML status card;
   confirming dispatches. Undiscovered nodes render as dim, unfocusable dots
   until a route reaches them. Ambient particle layer sits on one canvas
   underneath and is purely decorative (governed + reduced-motion aware).
   ========================================================================== */

import { VIEW, allNodes, edges, isDiscovered, STATION_ZERO, TOTAL_FACILITIES, ANOMALIES, isAnomalyRevealed } from './geometry.js';
import { missionFor } from './missions.data.js';
import { el, clear, prefersReducedMotion } from './util.js';
import * as S from './state.js';

/* Display fields come from the authoritative mission data (codename, class,
   difficulty); geometry only owns position, region, reveal, and routes. */
function display(node) {
  const m = missionFor(node.id) || {};
  return {
    name: m.name || node.name,
    systemClass: m.systemClass || node.systemClass,
    difficulty: m.difficulty || node.difficulty,
    region: node.region,
  };
}

const SVGNS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs) {
  const n = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

let host = null;
let onDispatch = null;
let onAnomaly = null;
let selectedId = null;
let ambient = null;

export function renderBoard(container, opts = {}) {
  host = container;
  onDispatch = opts.onDispatch || (() => {});
  onAnomaly = opts.onAnomaly || (() => {});
  clear(host);

  const wrap = el('.board-wrap');
  const canvas = el('canvas.board-ambient', { 'aria-hidden': 'true' });
  const svgEl = buildSvg();
  const cardLayer = el('.board-cardlayer', { 'aria-live': 'polite' });

  wrap.appendChild(canvas);
  wrap.appendChild(svgEl);
  wrap.appendChild(cardLayer);
  host.appendChild(wrap);

  startAmbient(canvas);
  bindKeys(svgEl);
  return { refresh: () => refresh(svgEl), focusFirst: () => focusNext(svgEl, 0) };
}

function state() { return S.get(); }
function onlineIds() {
  return Object.entries(state().facilities).filter(([, f]) => f.status === 'online').map(([id]) => id);
}

function buildSvg() {
  const root = svg('svg', {
    class: 'board-svg', viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
    role: 'group', 'aria-label': 'Network board. Use Tab or arrow keys to move between facilities, Enter to select.',
    preserveAspectRatio: 'xMidYMid meet',
  });

  // faint archipelago + grid (decorative)
  const deco = svg('g', { class: 'board-deco', 'aria-hidden': 'true' });
  deco.appendChild(svg('path', {
    class: 'board-coast',
    d: 'M250 250 Q360 200 430 300 T560 360 Q700 380 760 320 T880 420 Q820 560 720 640 T640 820 Q560 960 360 940 T200 760 Q160 560 240 460 T250 250 Z',
  }));
  for (let gx = 100; gx < VIEW.w; gx += 100) deco.appendChild(svg('line', { class: 'board-grid', x1: gx, y1: 0, x2: gx, y2: VIEW.h }));
  for (let gy = 100; gy < VIEW.h; gy += 100) deco.appendChild(svg('line', { class: 'board-grid', x1: 0, y1: gy, x2: VIEW.w, y2: gy }));
  root.appendChild(deco);

  // routes (drawn between discovered nodes; lit when both endpoints online)
  const routeG = svg('g', { class: 'board-routes', 'aria-hidden': 'true' });
  root.appendChild(routeG);
  root._routeG = routeG;

  // anomalies (off-network signals) — drawn beneath nodes
  const anomG = svg('g', { class: 'board-anoms' });
  root.appendChild(anomG);
  root._anomG = anomG;

  // nodes
  const nodeG = svg('g', { class: 'board-nodes' });
  root.appendChild(nodeG);
  root._nodeG = nodeG;

  refresh(root);
  return root;
}

function refresh(root) {
  const online = onlineIds();
  const tut = state().flags.tutorialDone;

  // --- routes ---
  clear(root._routeG);
  for (const e of edges()) {
    const aDisc = isDiscovered(e.a, online, tut);
    const bDisc = isDiscovered(e.b, online, tut);
    if (!aDisc && !bDisc) continue;
    const bothOnline = (online.includes(e.a.id) || e.a.id === STATION_ZERO.id && tut) && online.includes(e.b.id);
    const cls = 'route' + (online.includes(e.a.id) && online.includes(e.b.id) ? ' route-live'
      : (aDisc && bDisc ? ' route-known' : ' route-faint'));
    root._routeG.appendChild(svg('line', { class: cls, x1: e.a.x, y1: e.a.y, x2: e.b.x, y2: e.b.y }));
  }

  // --- anomalies --- (revealAfter counts real facilities, not the relay)
  clear(root._anomG);
  const found = state().anomaliesFound || [];
  const realOnline = S.onlineCount();
  for (const a of ANOMALIES) {
    if (!isAnomalyRevealed(a, realOnline, tut)) continue;
    root._anomG.appendChild(buildAnomaly(a, found.includes(a.id)));
  }

  // --- nodes ---
  clear(root._nodeG);
  for (const node of allNodes()) {
    const discovered = isDiscovered(node, online, tut);
    const isOnline = online.includes(node.id) || (node.tutorial && tut);
    if (!discovered) {
      // dim, unfocusable ghost dot
      const ghost = svg('circle', { class: 'node-ghost', cx: node.x, cy: node.y, r: 5, 'aria-hidden': 'true' });
      root._nodeG.appendChild(ghost);
      continue;
    }
    root._nodeG.appendChild(buildNode(node, isOnline));
  }
}

function buildNode(node, isOnline) {
  const d = display(node);
  const g = svg('g', {
    class: 'node' + (isOnline ? ' node-online' : ' node-offline') + (node.tutorial ? ' node-tutorial' : ''),
    tabindex: '0', role: 'button',
    'data-id': node.id,
    'aria-label': `${d.name} — ${d.region}. ${isOnline ? 'Online.' : 'Offline.'} ${d.difficulty}. Press Enter to view.`,
    transform: `translate(${node.x} ${node.y})`,
  });
  // reticle (focus ring, diegetic)
  g.appendChild(svg('rect', { class: 'node-reticle', x: -26, y: -26, width: 52, height: 52, rx: 4 }));
  g.appendChild(svg('circle', { class: 'node-halo', r: 18 }));
  g.appendChild(svg('circle', { class: 'node-core', r: isOnline ? 9 : 7 }));
  if (isOnline) g.appendChild(svg('circle', { class: 'node-pulse', r: 9 }));

  const label = svg('text', { class: 'node-label', x: 0, y: 38, 'text-anchor': 'middle' });
  label.textContent = d.name;
  g.appendChild(label);

  const sel = () => selectNode(node);
  g.addEventListener('click', sel);
  g.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); sel(); }
  });
  g.addEventListener('focus', () => { selectedId = node.id; });
  return g;
}

function buildAnomaly(a, isFound) {
  const g = svg('g', {
    class: 'anom' + (isFound ? ' anom-found' : ''),
    tabindex: '0', role: 'button', 'data-id': a.id,
    'aria-label': `Anomaly signal: ${a.codename}.${isFound ? ' Decoded.' : ' Undecoded. Press Enter to scan.'}`,
    transform: `translate(${a.x} ${a.y})`,
  });
  g.appendChild(svg('rect', { class: 'anom-reticle', x: -22, y: -22, width: 44, height: 44, rx: 3 }));
  // a rotated square "signal" diamond, distinct from facility circles
  g.appendChild(svg('rect', { class: 'anom-ring', x: -11, y: -11, width: 22, height: 22, rx: 2, transform: 'rotate(45)' }));
  g.appendChild(svg('rect', { class: 'anom-core', x: -4, y: -4, width: 8, height: 8, transform: 'rotate(45)' }));
  const label = svg('text', { class: 'anom-label', x: 0, y: 30, 'text-anchor': 'middle' });
  label.textContent = a.codename;
  g.appendChild(label);

  const open = () => onAnomaly(a.id);
  g.addEventListener('click', open);
  g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
  return g;
}

/* ---- status card ----------------------------------------------------------- */

function selectNode(node) {
  selectedId = node.id;
  const d = display(node);
  const layer = host.querySelector('.board-cardlayer');
  clear(layer);
  const online = onlineIds().includes(node.id) || (node.tutorial && state().flags.tutorialDone);

  const card = el('.status-card', { role: 'dialog', 'aria-label': d.name + ' status' }, [
    el('.status-head', null, [
      el('span.status-class', { text: d.systemClass }),
      el('span.status-diff.diff-' + d.difficulty.toLowerCase(), { text: d.difficulty }),
    ]),
    el('h2.status-name', { text: d.name }),
    el('p.status-region', { text: d.region }),
    el('p.status-state', { text: online ? '◉ ONLINE — restored' : '○ OFFLINE — awaiting restoration' }),
    el('.status-actions', null, [
      el('button.btn-dispatch', {
        type: 'button',
        text: online ? 'RE-ENTER' : (node.tutorial ? 'BEGIN SHIFT ▸' : 'DISPATCH ▸'),
        on: { click: () => onDispatch(node.id) },
      }),
      el('button.btn-dismiss', { type: 'button', text: 'Close', on: { click: () => clear(layer) } }),
    ]),
  ]);
  layer.appendChild(card);
  const btn = card.querySelector('.btn-dispatch');
  if (btn) btn.focus();
}

/* ---- keyboard spatial nav -------------------------------------------------- */

function focusableNodes(root) {
  return Array.from(root.querySelectorAll('.node'));
}
function focusNext(root, i) {
  const ns = focusableNodes(root);
  if (ns.length) ns[Math.max(0, Math.min(ns.length - 1, i))].focus();
}
function bindKeys(root) {
  root.addEventListener('keydown', (ev) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) return;
    const ns = focusableNodes(root);
    const cur = document.activeElement;
    if (!ns.includes(cur)) { ev.preventDefault(); ns[0] && ns[0].focus(); return; }
    ev.preventDefault();
    const here = cur.transform.baseVal[0].matrix;
    const cx = here.e, cy = here.f;
    let best = null, bestScore = Infinity;
    for (const n of ns) {
      if (n === cur) continue;
      const m = n.transform.baseVal[0].matrix;
      const dx = m.e - cx, dy = m.f - cy;
      const dirOk =
        (ev.key === 'ArrowLeft' && dx < -10) || (ev.key === 'ArrowRight' && dx > 10) ||
        (ev.key === 'ArrowUp' && dy < -10) || (ev.key === 'ArrowDown' && dy > 10);
      if (!dirOk) continue;
      const score = Math.hypot(dx, dy);
      if (score < bestScore) { bestScore = score; best = n; }
    }
    if (best) best.focus();
  });
}

/* ---- ambient canvas (decorative only) ------------------------------------- */

function startAmbient(canvas) {
  stopAmbient();
  if (prefersReducedMotion()) { paintStatic(canvas); return; }
  const ctx = canvas.getContext('2d', { alpha: true });
  let raf = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  let stars = [];
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, r.width * dpr);
    canvas.height = Math.max(1, r.height * dpr);
    stars = makeStars(Math.min(90, Math.floor((r.width * r.height) / 14000)), canvas.width, canvas.height);
  };
  resize();
  ambient = { stop: () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); } };
  window.addEventListener('resize', resize);
  let last = 0;
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    if (t - last < 33) return;           // cap ~30fps for the ambience
    last = t;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.p += s.s;
      const a = 0.25 + 0.25 * Math.sin(s.p);
      ctx.globalAlpha = a;
      ctx.fillStyle = s.c;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
  };
  raf = requestAnimationFrame(loop);
}

function makeStars(n, w, h) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: ((i * 9301 + 49297) % 233280) / 233280 * w,
      y: ((i * 49297 + 9301) % 233280) / 233280 * h,
      r: (i % 3) + 1,
      s: 0.01 + (i % 5) * 0.004,
      p: i,
      c: i % 7 === 0 ? '#6fd3ff' : '#9fb4d8',
    });
  }
  return out;
}

function paintStatic(canvas) {
  const ctx = canvas.getContext('2d');
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width; canvas.height = r.height;
  const stars = makeStars(60, canvas.width, canvas.height);
  ctx.globalAlpha = 0.4;
  for (const s of stars) { ctx.fillStyle = s.c; ctx.fillRect(s.x, s.y, s.r, s.r); }
}

export function stopAmbient() { if (ambient) { ambient.stop(); ambient = null; } }
