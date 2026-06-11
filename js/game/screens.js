/* =============================================================================
   NIGHT SHIFT — HQ (Service Record) + Toolkit (equipment locker)
   Experience as postings that unlock with clearance; skills as gear that
   arrives through missions. Both readable in full from the Shift Report too —
   these are the in-world, explorable versions.
   ========================================================================== */

import { el, clear } from './util.js';
import { SERVICE_RECORD, TOOLKIT_CATALOG, toolAcquired } from './missions.data.js';
import * as S from './state.js';

export function renderHQ(container) {
  clear(container);
  const st = S.get();
  const unlocked = Math.max(1, st.serviceUnlocked); // posting 0 always visible

  const wrap = el('.hq');
  wrap.appendChild(el('.hq-head', null, [
    el('p.hq-kicker', { text: 'HQ · PERSONNEL TERMINAL' }),
    el('h1.hq-title', { text: 'SERVICE RECORD' }),
    el('p.hq-sub', { text: 'Six prior postings. Each unlocks as your clearance climbs — the same ladder the operator climbed.' }),
  ]));

  const line = el('.hq-line', { 'aria-label': 'Career timeline' });
  SERVICE_RECORD.forEach((p, i) => {
    const open = i < unlocked || unlocked >= SERVICE_RECORD.length;
    const station = el('.hq-post' + (open ? '' : ' locked'), { 'aria-hidden': open ? 'false' : 'true' });
    station.appendChild(el('.hq-dot'));
    if (open) {
      station.appendChild(el('.hq-card', null, [
        el('.hq-when', { text: `${p.start} — ${p.end}` }),
        el('h2.hq-role', { text: p.role }),
        el('p.hq-co', { text: p.company }),
        el('p.hq-contrib', { text: p.contributed }),
      ]));
    } else {
      station.appendChild(el('.hq-card.hq-card-locked', null, [
        el('.hq-lockicon', { text: '🔒' }),
        el('p.hq-locktext', { text: `Posting sealed — reach clearance L${i + 1} to unlock.` }),
      ]));
    }
    line.appendChild(station);
  });
  wrap.appendChild(line);
  container.appendChild(wrap);
}

export function renderToolkit(container) {
  clear(container);
  const st = S.get();
  const total = TOOLKIT_CATALOG.reduce((n, c) => n + c.items.length, 0);
  const have = TOOLKIT_CATALOG.reduce((n, c) => n + c.items.filter(it => toolAcquired(it, st.toolkit)).length, 0);

  const wrap = el('.toolkit');
  wrap.appendChild(el('.tk-head', null, [
    el('p.tk-kicker', { text: 'EQUIPMENT LOCKER' }),
    el('h1.tk-title', { text: 'TOOLKIT' }),
    el('p.tk-sub', { text: `Every tool was earned in the mission that used it. Empty slots are the work left to do. Acquired: ${have} / ${total}.` }),
  ]));

  TOOLKIT_CATALOG.forEach(cat => {
    const sec = el('.tk-cat');
    sec.appendChild(el('h2.tk-cat-name', { text: cat.category }));
    const grid = el('.tk-grid');
    cat.items.forEach(it => {
      const got = toolAcquired(it, st.toolkit);
      grid.appendChild(el('.tk-slot' + (got ? ' filled' : ''), { 'aria-label': it + (got ? ' — acquired' : ' — not yet acquired') }, [
        el('span.tk-tool', { text: it }),
        got ? el('span.tk-check', { text: '◉' }) : el('span.tk-empty', { text: '○' }),
      ]));
    });
    sec.appendChild(grid);
    wrap.appendChild(sec);
  });
  container.appendChild(wrap);
}
