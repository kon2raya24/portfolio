/* =============================================================================
   NIGHT SHIFT — the Shift Report
   The document that writes itself as you play — and the load-bearing recruiter
   / accessibility surface. It is ALWAYS complete: facilities you haven't
   restored still render their full summary and the architect's call, marked
   "NOT YET SURVEYED". Prints cleanly; links to the real resume + archives.
   ========================================================================== */

import { el, clear } from './util.js';
import { MISSIONS, SERVICE_RECORD, TOOLKIT_CATALOG, OPERATOR, toolAcquired } from './missions.data.js';
import { FACILITIES, TOTAL_FACILITIES } from './geometry.js';
import { STAMPS } from './state.js';
import * as S from './state.js';

export function renderReport(container, opts = {}) {
  clear(container);
  const st = S.get();
  const clr = S.clearanceInfo();
  const onlineN = S.onlineCount();
  const integ = S.integrity(TOTAL_FACILITIES);

  const doc = el('.report', { role: 'document', 'aria-label': 'Shift Report' });

  // ---- masthead -----------------------------------------------------------
  doc.appendChild(el('header.report-head', null, [
    el('p.report-kicker', { text: 'PHILSPAN LOGISTICS NETWORK · SHIFT REPORT' }),
    el('h1.report-title', { text: OPERATOR.name }),
    el('p.report-sub', { text: OPERATOR.title + ' · ' + OPERATOR.location }),
    el('p.report-intro', { text: OPERATOR.intro_line }),
    el('.report-stamps', { 'aria-label': 'Commendations earned' },
      Object.values(STAMPS).map(stp => el('span.report-stamp' + (S.hasStamp(stp.id) ? ' earned' : ''), {
        title: stp.hint, text: stp.label,
      }))),
  ]));

  // ---- shift status strip -------------------------------------------------
  doc.appendChild(el('.report-status', null, [
    statCell('OPERATOR CLEARANCE', `L${clr.level} · ${clr.title}`),
    statCell('NETWORK INTEGRITY', integ + '%'),
    statCell('FACILITIES RESTORED', `${onlineN} / ${TOTAL_FACILITIES}`),
    statCell('TOOLKIT ACQUIRED', `${st.toolkit.length} tools`),
  ]));

  if (opts.banner) {
    doc.appendChild(el('.report-banner', { text: opts.banner }));
  }

  // ---- facilities ---------------------------------------------------------
  const facSec = el('section.report-sec', { 'aria-labelledby': 'rs-fac' });
  facSec.appendChild(el('h2#rs-fac.report-h', { text: 'FACILITIES — Case Studies' }));
  FACILITIES.forEach(node => {
    const m = MISSIONS[node.id];
    if (!m) return;
    facSec.appendChild(facilityBlock(m, node));
  });
  doc.appendChild(facSec);

  // ---- service record -----------------------------------------------------
  const srSec = el('section.report-sec', { 'aria-labelledby': 'rs-sr' });
  srSec.appendChild(el('h2#rs-sr.report-h', { text: 'SERVICE RECORD — Experience' }));
  SERVICE_RECORD.forEach((p, i) => {
    const unlocked = i < st.serviceUnlocked || st.serviceUnlocked >= SERVICE_RECORD.length || i === 0;
    srSec.appendChild(el('.report-posting', null, [
      el('.rp-head', null, [
        el('span.rp-role', { text: p.role }),
        el('span.rp-co', { text: p.company }),
        el('span.rp-when', { text: `${p.start}–${p.end}` }),
      ]),
      el('p.rp-contrib', { text: p.contributed }),
    ]));
  });
  doc.appendChild(srSec);

  // ---- toolkit ------------------------------------------------------------
  const tkSec = el('section.report-sec', { 'aria-labelledby': 'rs-tk' });
  tkSec.appendChild(el('h2#rs-tk.report-h', { text: 'TOOLKIT — Skills' }));
  TOOLKIT_CATALOG.forEach(cat => {
    tkSec.appendChild(el('.report-cat', null, [
      el('h3.rc-name', { text: cat.category }),
      el('.rc-items', null, cat.items.map(it => {
        const acquired = toolAcquired(it, st.toolkit);
        return el('span.rc-tool' + (acquired ? ' acquired' : ''), { text: it });
      })),
    ]));
  });
  doc.appendChild(tkSec);

  // ---- footer / real links ------------------------------------------------
  doc.appendChild(el('footer.report-foot', null, [
    el('p', { text: 'The interactive shift is one way in. These are the same facts, the traditional way out:' }),
    el('.report-links', null, [
      el('a.report-link', { href: OPERATOR.links.resume, text: 'Résumé (PDF) ↗', target: '_blank', rel: 'noopener' }),
      el('a.report-link', { href: 'mailto:' + OPERATOR.email, text: 'Email ↗' }),
      el('a.report-link', { href: OPERATOR.links.linkedin, text: 'LinkedIn ↗', target: '_blank', rel: 'noopener' }),
      el('a.report-link', { href: OPERATOR.links.github, text: 'GitHub ↗', target: '_blank', rel: 'noopener' }),
    ]),
    el('button.report-print', { type: 'button', text: '⎙ Print / Save this report', on: { click: () => window.print() } }),
  ]));

  container.appendChild(doc);
}

function statCell(label, value) {
  return el('.report-stat', null, [el('span.rstat-v', { text: value }), el('span.rstat-l', { text: label })]);
}

function facilityBlock(m, node) {
  const f = S.facility(m.id);
  const restored = f.status === 'online';
  const surveyed = restored || (f.hotspotsFound && f.hotspotsFound.length) || f.call;
  const actualOpt = m.call.options.find(o => o.id === m.call.actual);

  const block = el('.report-fac' + (restored ? ' fac-restored' : ''));
  block.appendChild(el('.rf-head', null, [
    el('span.rf-name', { text: m.name }),
    el('span.rf-real', { text: m.realName }),
    el('span.rf-flag' + (restored ? ' on' : ''), { text: restored ? '◉ RESTORED' : '○ NOT YET SURVEYED' }),
  ]));
  block.appendChild(el('p.rf-summary', { text: m.summary }));

  // The architect's call — shown always (it's the substance), annotated with
  // the player's own choice if they made one.
  const callBlock = el('.rf-call');
  callBlock.appendChild(el('p.rf-call-q', { text: 'The call: ' + m.call.prompt }));
  if (f.call) {
    const yours = m.call.options.find(o => o.id === f.call);
    callBlock.appendChild(el('p.rf-call-yours', {
      text: `Your call: ${yours ? yours.label : f.call}${f.concurrence ? ' — concurred with the architect.' : '.'}`,
    }));
  }
  callBlock.appendChild(el('p.rf-call-actual', { text: `Architect's call: ${actualOpt.label}. ${m.call.reasoning}` }));
  block.appendChild(callBlock);

  // outcomes
  block.appendChild(el('.rf-outcomes', { 'aria-label': 'Measured outcomes' },
    (m.outcomes || []).map(o => el('span.rf-metric', null, [
      el('span.rfm-v', { text: o.value + (o.unit ? ' ' + o.unit : '') }),
      el('span.rfm-l', { text: o.metric }),
    ]))));

  // tools + archive
  block.appendChild(el('.rf-tools', null, (m.tools || []).map(t => el('span.rf-tool', { text: t }))));
  block.appendChild(el('a.rf-archive', { href: m.archiveUrl, text: 'Full case study ↗', target: '_self' }));
  return block;
}
