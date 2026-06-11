/* =============================================================================
   NIGHT SHIFT — game state + persistence
   Single plain-object state, localStorage-backed, with a tiny pub/sub.
   No framework. Canvas never owns a word; this module never touches the DOM.
   ========================================================================== */

const SAVE_KEY = 'nightshift.save.v2';

/* Operator certifications. XP thresholds are cumulative. Each level unlocks one
   Service Record dossier so the player's climb replays the career's climb. */
export const CLEARANCE = [
  { level: 1, title: 'PROBATIONARY', xp: 0 },
  { level: 2, title: 'CERTIFIED', xp: 120 },
  { level: 3, title: 'SENIOR', xp: 300 },
  { level: 4, title: 'PRINCIPAL', xp: 560 },
  { level: 5, title: 'NETWORK ARCHITECT', xp: 900 },
];

/* XP awards — small, legible economy. */
export const XP = {
  restore: 100,     // bring a facility online
  hotspot: 12,      // each constraint uncovered
  concurrence: 30,  // matched the architect's call
  anomaly: 20,      // off-route signal found
  tutorial: 40,
};

/* Stamps (achievements) — professional in tone, printed on the report header. */
export const STAMPS = {
  FIRST_LIGHT:   { id: 'FIRST_LIGHT',   label: 'FIRST LIGHT',   hint: 'First facility restored.' },
  CONCURRENCE:   { id: 'CONCURRENCE',   label: 'CONCURRENCE ×5', hint: "Matched the architect's call five times." },
  DEEP_SCAN:     { id: 'DEEP_SCAN',     label: 'DEEP SCAN',     hint: 'Every hotspot in one facility.' },
  SIGNAL_HUNTER: { id: 'SIGNAL_HUNTER', label: 'SIGNAL HUNTER', hint: 'Six anomalies found.' },
  FULL_NETWORK:  { id: 'FULL_NETWORK',  label: 'FULL NETWORK',  hint: 'Every facility online.' },
  DAWN_OPERATOR: { id: 'DAWN_OPERATOR', label: 'DAWN OPERATOR', hint: 'Saw the network through to dawn.' },
};

function freshState() {
  return {
    v: 2,
    operatorName: '',
    screen: 'BOOT',          // BOOT | BOARD | TRAVEL | FACILITY | HQ | TOOLKIT | REPORT | COMMS | DAWN
    facilities: {},          // id -> { status, hotspotsFound:[], call, concurrence }
    toolkit: [],             // acquired tool names (unique)
    clearance: 1,
    xp: 0,
    stamps: [],              // earned stamp ids
    anomaliesFound: [],      // anomaly ids
    serviceUnlocked: 0,      // how many dossiers revealed (mirrors clearance)
    flags: {
      soundOn: false,
      tutorialDone: false,
      commsUnlocked: false,
      dawn: false,
      seenCommendations: [],
    },
  };
}

let state = freshState();
const subs = new Set();

/* ---- persistence ---------------------------------------------------------- */

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 2) state = Object.assign(freshState(), parsed);
    }
  } catch (e) { /* corrupt save → fresh */ }
  return state;
}

export function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}

export function reset() {
  state = freshState();
  save();
  emit();
  return state;
}

/* ---- pub/sub --------------------------------------------------------------- */

export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
function emit() { for (const fn of subs) fn(state); }

/* Mutate via this so every change persists + notifies. */
export function update(mutator) {
  mutator(state);
  save();
  emit();
  return state;
}

export function get() { return state; }

/* ---- derived selectors ----------------------------------------------------- */

export function facility(id) {
  return state.facilities[id] || { status: 'offline', hotspotsFound: [], call: null, concurrence: false };
}

export function isOnline(id) { return facility(id).status === 'online'; }

export function onlineCount() {
  // station-zero is the tutorial relay, not one of the nine — exclude it so
  // integrity and the dawn trigger are driven by the real facilities only.
  return Object.entries(state.facilities).filter(([id, f]) => id !== 'station-zero' && f.status === 'online').length;
}

/* Network Integrity — 0..100, the world-progression meter. Tutorial node is
   excluded from the denominator so the "real" nine drive the dawn. */
export function integrity(totalFacilities) {
  if (!totalFacilities) return 0;
  return Math.round((onlineCount() / totalFacilities) * 100);
}

export function clearanceInfo() {
  let cur = CLEARANCE[0];
  for (const c of CLEARANCE) if (state.xp >= c.xp) cur = c;
  const next = CLEARANCE.find(c => c.xp > state.xp) || null;
  return {
    level: cur.level,
    title: cur.title,
    xp: state.xp,
    nextAt: next ? next.xp : null,
    progress: next ? (state.xp - cur.xp) / (next.xp - cur.xp) : 1,
  };
}

export function hasStamp(id) { return state.stamps.includes(id); }

/* ---- high-level actions (the game's verbs touch state only here) ---------- */

/** Add XP and recompute clearance; returns { leveledTo } if a new level reached. */
export function awardXp(amount) {
  const before = clearanceInfo().level;
  let after = before;
  update(s => {
    s.xp += amount;
    let lvl = CLEARANCE[0].level;
    for (const c of CLEARANCE) if (s.xp >= c.xp) lvl = c.level;
    s.clearance = lvl;
    s.serviceUnlocked = Math.max(s.serviceUnlocked, lvl);
    after = lvl;
  });
  return { leveledTo: after > before ? after : null };
}

export function earnStamp(id) {
  if (!STAMPS[id] || hasStamp(id)) return false;
  update(s => { s.stamps.push(id); });
  return true;
}

export function acquireTools(tools) {
  if (!tools || !tools.length) return;
  update(s => {
    for (const t of tools) if (!s.toolkit.includes(t)) s.toolkit.push(t);
  });
}

export function recordHotspot(facilityId, index, totalHotspots) {
  let firstTime = false;
  update(s => {
    const f = s.facilities[facilityId] || (s.facilities[facilityId] = { status: 'offline', hotspotsFound: [], call: null, concurrence: false });
    if (!f.hotspotsFound.includes(index)) { f.hotspotsFound.push(index); firstTime = true; }
  });
  if (firstTime) {
    awardXp(XP.hotspot);
    const f = facility(facilityId);
    if (totalHotspots && f.hotspotsFound.length === totalHotspots) earnStamp('DEEP_SCAN');
  }
  return firstTime;
}

export function recordCall(facilityId, optionId, isConcurrence) {
  update(s => {
    const f = s.facilities[facilityId] || (s.facilities[facilityId] = { status: 'offline', hotspotsFound: [], call: null, concurrence: false });
    f.call = optionId;
    f.concurrence = !!isConcurrence;
  });
  if (isConcurrence) {
    awardXp(XP.concurrence);
    const matched = Object.values(get().facilities).filter(f => f.concurrence).length;
    if (matched >= 5) earnStamp('CONCURRENCE');
  }
}

/** Bring a facility online. Returns nothing; callers handle UI feedback. */
export function restore(facilityId, mission) {
  let wasOffline = false;
  update(s => {
    const f = s.facilities[facilityId] || (s.facilities[facilityId] = { status: 'offline', hotspotsFound: [], call: null, concurrence: false });
    if (f.status !== 'online') { f.status = 'online'; wasOffline = true; }
  });
  if (!wasOffline) return;

  acquireTools(mission && mission.tools);
  awardXp(mission && mission.isTutorial ? XP.tutorial : XP.restore);
  earnStamp('FIRST_LIGHT');

  if (mission && mission.isTutorial) {
    update(s => { s.flags.tutorialDone = true; s.flags.commsUnlocked = true; });
  }
}

export function unlockComms() { update(s => { s.flags.commsUnlocked = true; }); }
export function setSound(on) { update(s => { s.flags.soundOn = !!on; }); }
export function setOperatorName(n) { update(s => { s.operatorName = (n || '').slice(0, 24); }); }
export function setScreen(screen) { update(s => { s.screen = screen; }); }

export function findAnomaly(id) {
  let firstTime = false;
  update(s => { if (!s.anomaliesFound.includes(id)) { s.anomaliesFound.push(id); firstTime = true; } });
  if (firstTime) {
    awardXp(XP.anomaly);
    if (get().anomaliesFound.length >= 6) earnStamp('SIGNAL_HUNTER');
  }
  return firstTime;
}

export function triggerDawn() {
  update(s => { s.flags.dawn = true; });
  earnStamp('FULL_NETWORK');
  earnStamp('DAWN_OPERATOR');
}
