/* =============================================================================
   NIGHT SHIFT — sound (optional, off by default)
   A low network hum whose harmonic layers light up one per restored facility —
   the soundtrack IS the progression meter. Plus soft UI ticks, a stamp chime,
   and a dawn swell. Pure WebAudio, no assets. Everything is decorative and
   guarded: nothing here is the only channel for any information.
   ========================================================================== */

let ctx = null;
let master = null;
let filter = null;
let partials = [];          // { osc, gain, freq }
let lfo = null, lfoGain = null;
let enabled = false;
let started = false;
let intensity = 0;          // facilities online → audible partials

// A1-rooted just-ish stack — warm, non-melodic drone.
const FREQS = [55, 82.5, 110, 165, 220, 275, 330, 412.5, 495];

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0;
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 0.6;
    filter.connect(master);
    master.connect(ctx.destination);
    // slow breathing LFO on the master gain
    lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();
  } catch (e) { ctx = null; }
  return ctx;
}

function buildDrone() {
  if (started || !ctx) return;
  started = true;
  partials = FREQS.map((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = i % 2 ? 'sine' : 'triangle';
    osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0;                 // silent until intensity lights it
    osc.connect(g); g.connect(filter);
    osc.start();
    return { osc, gain: g, freq: f };
  });
}

/** Resume context (needs a user gesture) and start/stop the drone. */
export function setEnabled(on) {
  enabled = !!on;
  if (!enabled) { fadeMaster(0); return; }
  if (!ensureCtx()) return;
  if (ctx.state === 'suspended') ctx.resume();
  buildDrone();
  applyIntensity();
  fadeMaster(0.06);
}

export function isEnabled() { return enabled; }

function fadeMaster(to) {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(to, now, 0.6);
}

/** How many facilities are online — lights that many harmonic partials. */
export function setIntensity(n) {
  intensity = Math.max(0, n | 0);
  applyIntensity();
}

function applyIntensity() {
  if (!started || !ctx) return;
  const now = ctx.currentTime;
  // base partial always on when enabled; one more per facility.
  const lit = Math.min(partials.length, 1 + intensity);
  partials.forEach((p, i) => {
    const target = enabled && i < lit ? (i === 0 ? 0.16 : 0.05 + 0.005 * i) : 0;
    p.gain.gain.setTargetAtTime(target, now, 0.8);
  });
}

/* ---- one-shot SFX (all no-ops if context unavailable / disabled) ---------- */

function blip(freq, dur, type, peak) {
  if (!enabled || !ensureCtx()) return;
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  g.gain.value = 0;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak || 0.08, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + (dur || 0.12));
  osc.connect(g); g.connect(master || ctx.destination);
  osc.start(now);
  osc.stop(now + (dur || 0.12) + 0.02);
}

export function tick() { blip(660, 0.06, 'square', 0.03); }
export function confirmTone() { blip(523.25, 0.16, 'triangle', 0.07); setTimeout(() => blip(659.25, 0.18, 'triangle', 0.06), 90); }
export function stampTone() { blip(784, 0.2, 'sine', 0.08); setTimeout(() => blip(1046.5, 0.3, 'sine', 0.06), 110); }

export function dawnSwell() {
  if (!enabled || !ensureCtx()) return;
  const seq = [261.63, 329.63, 392, 523.25];
  seq.forEach((f, i) => setTimeout(() => blip(f, 1.4, 'sine', 0.06), i * 220));
}
