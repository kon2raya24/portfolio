/* =============================================================================
   NIGHT SHIFT — schematic dioramas
   One living mini-diagram per system class. Each renders in a 0..100 × 0..70
   SVG and exposes hotspot anchor points (in %) so the mission screen can overlay
   real, focusable hotspot buttons on the diorama. Visual misbehaviour is driven
   by CSS on the `.schem-degraded` parent; `heal()` flips it to `.schem-healthy`.
   No per-frame JS; CSS owns the motion, so reduced-motion is honored for free.
   ========================================================================== */

const SVGNS = 'http://www.w3.org/2000/svg';
function s(tag, attrs, kids) {
  const n = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (kids) for (const c of kids) n.appendChild(c);
  return n;
}

/** Returns { svg, anchors } where anchors are {x,y} in percentages (0..100). */
export function buildSchematic(type) {
  const root = s('svg', {
    class: 'schem schem-' + type + ' schem-degraded',
    viewBox: '0 0 100 70', preserveAspectRatio: 'xMidYMid meet',
    role: 'img', 'aria-label': 'System schematic — currently degraded.',
  });
  const builder = BUILDERS[type] || BUILDERS.grid;
  const anchors = builder(root);
  return { svg: root, anchors };
}

export function healSchematic(root) {
  if (!root) return;
  root.classList.remove('schem-degraded');
  root.classList.add('schem-healthy');
  root.setAttribute('aria-label', 'System schematic — restored and nominal.');
}

const BUILDERS = {
  /* WAREHOUSE — a rack grid; degraded cells drift and flicker, healthy locks. */
  warehouse(root) {
    const g = s('g', { class: 'schem-racks' });
    let i = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = s('rect', {
          class: 'schem-cell c' + (i % 5), x: 8 + c * 9.5, y: 8 + r * 13, width: 8, height: 10, rx: 1,
          style: `--i:${i}`,
        });
        g.appendChild(cell); i++;
      }
    }
    root.appendChild(g);
    return [{ x: 18, y: 22 }, { x: 50, y: 16 }, { x: 78, y: 30 }, { x: 35, y: 60 }, { x: 88, y: 64 }];
  },

  /* FLEET — routes with trucks; degraded trucks scatter off-route, healthy snaps. */
  fleet(root) {
    const routes = s('g', { class: 'schem-routes' }, [
      s('path', { class: 'schem-route', d: 'M6 60 Q30 10 55 35 T96 14' }),
      s('path', { class: 'schem-route', d: 'M6 20 Q40 55 70 30 T96 58' }),
    ]);
    root.appendChild(routes);
    const trucks = s('g', { class: 'schem-trucks' });
    const pts = [[20, 52], [44, 26], [66, 40], [82, 22], [33, 44], [58, 50]];
    pts.forEach((p, i) => trucks.appendChild(s('circle', { class: 'schem-truck t' + (i % 3), cx: p[0], cy: p[1], r: 2.4, style: `--i:${i}` })));
    root.appendChild(trucks);
    return [{ x: 20, y: 74 }, { x: 50, y: 30 }, { x: 78, y: 22 }, { x: 60, y: 70 }, { x: 90, y: 58 }];
  },

  /* QUEUE — the showpiece: tickets pile up red (degraded), resolve themselves
     to green checks (healthy). The AI Engineer's queue answering itself. */
  queue(root) {
    const g = s('g', { class: 'schem-queue' });
    for (let i = 0; i < 7; i++) {
      const row = s('g', { class: 'schem-ticket', style: `--i:${i}`, transform: `translate(14 ${6 + i * 8.5})` });
      row.appendChild(s('rect', { class: 'schem-tk-bar', x: 0, y: 0, width: 56, height: 6, rx: 1 }));
      row.appendChild(s('circle', { class: 'schem-tk-dot', cx: 64, cy: 3, r: 2.6 }));
      row.appendChild(s('path', { class: 'schem-tk-check', d: 'M61.6 3 L63.4 4.8 L66.6 1.2', fill: 'none' }));
      g.appendChild(row);
    }
    // the "AI worker" beam on the right that sweeps the queue when healthy
    g.appendChild(s('line', { class: 'schem-worker', x1: 80, y1: 4, x2: 80, y2: 66 }));
    root.appendChild(g);
    return [{ x: 40, y: 12 }, { x: 75, y: 24 }, { x: 88, y: 40 }, { x: 40, y: 50 }, { x: 88, y: 64 }];
  },

  /* ORG — a hierarchy lattice; degraded links broken, healthy connected. */
  org(root) {
    const links = s('g', { class: 'schem-links' });
    const nodes = s('g', { class: 'schem-orgnodes' });
    const layout = [[50, 10], [26, 32], [50, 32], [74, 32], [16, 56], [38, 56], [62, 56], [84, 56]];
    const pairs = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [3, 6], [3, 7]];
    pairs.forEach((p, i) => links.appendChild(s('line', {
      class: 'schem-link', style: `--i:${i}`,
      x1: layout[p[0]][0], y1: layout[p[0]][1], x2: layout[p[1]][0], y2: layout[p[1]][1],
    })));
    layout.forEach((n, i) => nodes.appendChild(s('circle', { class: 'schem-orgnode', cx: n[0], cy: n[1], r: 3.4, style: `--i:${i}` })));
    root.appendChild(links); root.appendChild(nodes);
    return [{ x: 50, y: 6 }, { x: 26, y: 32 }, { x: 74, y: 32 }, { x: 38, y: 60 }, { x: 84, y: 60 }];
  },

  /* GRID — a data table; degraded rows ragged/empty, healthy aligned/filled. */
  grid(root) {
    const g = s('g', { class: 'schem-grid' });
    g.appendChild(s('rect', { class: 'schem-grid-head', x: 8, y: 6, width: 84, height: 7, rx: 1 }));
    for (let r = 0; r < 6; r++) {
      const row = s('g', { class: 'schem-row', style: `--i:${r}`, transform: `translate(8 ${16 + r * 8})` });
      for (let c = 0; c < 4; c++) row.appendChild(s('rect', { class: 'schem-gcell', x: c * 22, y: 0, width: 18, height: 5.5, rx: 0.8 }));
      g.appendChild(row);
    }
    root.appendChild(g);
    return [{ x: 50, y: 9 }, { x: 20, y: 28 }, { x: 80, y: 36 }, { x: 30, y: 52 }, { x: 80, y: 60 }];
  },

  /* BEACON — a knowledge relay; degraded weak/dark, healthy strong rings. */
  beacon(root) {
    const g = s('g', { class: 'schem-beacon', transform: 'translate(50 35)' });
    [22, 16, 10].forEach((r, i) => g.appendChild(s('circle', { class: 'schem-ring', r, style: `--i:${i}` })));
    g.appendChild(s('circle', { class: 'schem-core2', r: 5 }));
    // satellite nodes catching the signal
    const sats = [[-30, -18], [32, -14], [28, 20], [-26, 22]];
    sats.forEach((p, i) => g.appendChild(s('circle', { class: 'schem-sat', cx: p[0], cy: p[1], r: 2.6, style: `--i:${i}` })));
    root.appendChild(g);
    return [{ x: 50, y: 35 }, { x: 26, y: 24 }, { x: 78, y: 30 }, { x: 30, y: 64 }, { x: 80, y: 66 }];
  },
};
