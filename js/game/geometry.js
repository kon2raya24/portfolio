/* =============================================================================
   NIGHT SHIFT — board geometry
   Node positions on a stylized 1000×1400 archipelago, region labels, the
   route graph (travel lines), and progressive-reveal gating. Lightweight on
   purpose: the rich mission content lives in missions.data.js. Facility ids
   match the case-study filenames so deep links and the archive layer line up.
   ========================================================================== */

export const VIEW = { w: 1000, h: 1400 };

/* The tutorial node — the network's own status site (this portfolio, as a
   meta-mission). Always visible; lighting it reveals the Tier-1 core. */
export const STATION_ZERO = {
  id: 'station-zero',
  name: 'STATION ZERO',
  region: 'RELAY · OPERATOR ENTRY',
  systemClass: 'KNOWLEDGE',
  difficulty: 'ROUTINE',
  x: 500, y: 1170,
  tutorial: true,
  reveal: { always: true },
  routes: ['wms-v2', 'tms', 'hris'],
};

/* The nine facilities. x/y in the VIEW box. `reveal.needs` lists facility ids
   whose restoration uncovers this dark node; `reveal.afterTutorial` reveals it
   the moment Station Zero is online. */
export const FACILITIES = [
  // ---- Tier 1 · AAI core (the showpieces) --------------------------------
  { id: 'wms-v2',      name: 'CANON-V3',   region: 'CENTRAL WAREHOUSE GRID', systemClass: 'WAREHOUSE',    difficulty: 'CRITICAL', tier: 1, x: 430, y: 520, reveal: { afterTutorial: true }, routes: ['wms', 'tms', 'hris', 'station-zero'] },
  { id: 'tms',         name: 'DISPATCH-1', region: 'NATIONAL DISPATCH',      systemClass: 'FLEET',        difficulty: 'CRITICAL', tier: 1, x: 620, y: 450, reveal: { afterTutorial: true }, routes: ['wms-v2', 'ai-engineer', 'pamanaland', 'station-zero'] },
  { id: 'ai-engineer', name: 'GHOST-CREW', region: 'AUTONOMOUS SERVICE',     systemClass: 'SERVICE-DESK', difficulty: 'CRITICAL', tier: 1, x: 740, y: 600, reveal: { needs: ['tms'] }, routes: ['tms', 'hris', 'llm-wiki'] },
  { id: 'hris',        name: 'ROSTER-CORE',region: 'PERSONNEL CORE',         systemClass: 'HR-CORE',      difficulty: 'COMPLEX',  tier: 2, x: 540, y: 690, reveal: { afterTutorial: true }, routes: ['wms-v2', 'ai-engineer', 'jbc', 'station-zero'] },
  { id: 'wms',         name: 'FLOORHAND',  region: 'WAREHOUSE FLOOR · MOBILE',systemClass: 'MOBILE',       difficulty: 'COMPLEX',  tier: 1, x: 300, y: 630, reveal: { needs: ['wms-v2'] }, routes: ['wms-v2', 'jbc'] },

  // ---- Tier 2 · contract sites + signals ---------------------------------
  { id: 'jbc',          name: 'SPLITWORKS',  region: 'COMMISSION OUTPOST',    systemClass: 'COMMISSION',  difficulty: 'COMPLEX',  tier: 2, x: 250, y: 880, reveal: { needs: ['hris'] }, routes: ['hris', 'wms'] },
  { id: 'pamanaland',   name: 'DEEDFLOW',    region: 'REALTY FRONTIER',       systemClass: 'REALTY',      difficulty: 'COMPLEX',  tier: 2, x: 720, y: 860, reveal: { needs: ['tms'] }, routes: ['tms'] },
  { id: 'ph-dev-utils', name: 'PRIMITIVE-PH',region: 'PUBLIC PACKAGE FIELD',  systemClass: 'TOOLKIT',     difficulty: 'COMPLEX',  tier: 2, x: 175, y: 400, reveal: { needs: ['wms-v2'] }, routes: ['wms-v2', 'llm-wiki'] },
  { id: 'llm-wiki',     name: 'MEMORY-VAULT',region: 'KNOWLEDGE RELAY',       systemClass: 'KNOWLEDGE',   difficulty: 'ROUTINE',  tier: 2, x: 830, y: 360, reveal: { needs: ['ai-engineer'] }, routes: ['ai-engineer', 'ph-dev-utils'] },
];

export const TOTAL_FACILITIES = FACILITIES.length; // 9 — the dawn denominator

/** Every node including the tutorial relay. */
export function allNodes() { return [STATION_ZERO, ...FACILITIES]; }

export function nodeById(id) { return allNodes().find(n => n.id === id) || null; }

/** Unique undirected edge list for drawing route lines. */
export function edges() {
  const seen = new Set(); const out = [];
  for (const n of allNodes()) {
    for (const to of (n.routes || [])) {
      const key = [n.id, to].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const b = nodeById(to);
      if (b) out.push({ a: n, b });
    }
  }
  return out;
}

/** Is a node discovered (drawable as a real target) given current online set? */
export function isDiscovered(node, onlineIds, tutorialDone) {
  const r = node.reveal || {};
  if (r.always) return true;
  if (r.afterTutorial && tutorialDone) return true;
  if (r.needs && r.needs.some(id => onlineIds.includes(id))) return true;
  return false;
}

/* Anomalies — off-network signals out in the sea, revealed progressively as the
   network comes online (rewarding the curious). Each is a one-beat decode that
   surfaces a real secondary surface of the site via an outbound link.
   `revealAfter` = how many real facilities must be online before the ping shows. */
export const ANOMALIES = [
  { id: 'uses',      codename: 'GEAR CRATE',  x: 145, y: 470,  revealAfter: 0, detail: 'A supply crate adrift off the grid — the operator’s own kit: editor, terminal, machine, the tools behind every facility you’ve seen.', cta: 'Open the gear crate', href: 'uses.html' },
  { id: 'now',       codename: 'STATUS PING', x: 905, y: 1075, revealAfter: 0, detail: 'A live status ping. What the operator is actually working on right now — current focus, what’s shipping, what’s next.', cta: 'Read the status ping', href: 'now.html' },
  { id: 'changelog', codename: 'FLIGHT RECORDER', x: 120, y: 1010, revealAfter: 1, detail: 'A flight recorder logging every change to this network — the dated changelog of the portfolio itself.', cta: 'Open the flight recorder', href: 'changelog.html' },
  { id: 'github',    codename: 'SOURCE FEED', x: 930, y: 545,  revealAfter: 2, detail: 'An open broadcast of raw source — the operator’s public repositories, commits, and open-source work.', cta: 'Tune to the source feed ↗', href: 'https://github.com/kon2raya24' },
  { id: 'resume',    codename: 'PERSONNEL DOSSIER', x: 500, y: 1295, revealAfter: 2, detail: 'A sealed personnel dossier — the operator’s full résumé, the traditional one-page record, as a PDF.', cta: 'Pull the dossier (PDF) ↗', href: 'resume.pdf' },
  { id: 'linkedin',  codename: 'EXTERNAL RELAY', x: 150, y: 1230, revealAfter: 3, detail: 'A relay to the outside network — the operator’s LinkedIn, for the recruiters and the long-form version.', cta: 'Open the external relay ↗', href: 'https://www.linkedin.com/in/lemmuel-turaya/' },
];

export function isAnomalyRevealed(a, onlineCount, tutorialDone) {
  return tutorialDone && onlineCount >= (a.revealAfter || 0);
}
