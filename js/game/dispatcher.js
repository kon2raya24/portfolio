/* =============================================================================
   NIGHT SHIFT — the Dispatcher
   The single NPC: guide, mission-giver, help system, and (at dawn) the contact
   channel. Renders lines into a comms log as real DOM text with a typewriter
   reveal. Skip is scoped to ONE click handler on the log element (no global
   document listeners — those leaked across screens and cascaded beats), and a
   sequence token guarantees stale timers from a torn-down screen resolve to
   no-ops. Reduced motion renders instantly.
   ========================================================================== */

import { prefersReducedMotion } from './util.js';

let logEl = null;
let speed = 18;                 // ms per char
let seq = 0;                    // bumps on every mount/clear — invalidates old timers
let activeFinish = null;        // completes the currently-typing line, if any

export function mountDispatcher(el) {
  logEl = el;
  seq++;
  activeFinish = null;
  // one persistent, scoped skip handler: clicking the log completes the
  // current line. stopPropagation so the click never reaches game controls.
  el.addEventListener('click', (e) => {
    if (activeFinish) { e.stopPropagation(); activeFinish(); }
  });
}

/** Speak one or more lines. Resolves when fully typed (or when the owning
    screen is torn down, in which case later lines become no-ops). */
export function say(lines, opts = {}) {
  if (!logEl) return Promise.resolve();
  const arr = Array.isArray(lines) ? lines : [lines];
  const mySeq = seq;
  let chain = Promise.resolve();
  for (const text of arr) chain = chain.then(() => (mySeq === seq ? typeLine(text, opts, mySeq) : undefined));
  return chain;
}

/** Drop a line instantly (no typing) — used for system/status echoes. */
export function echo(text, cls = '') {
  if (!logEl) return;
  const row = document.createElement('p');
  row.className = 'comms-line comms-echo ' + cls;
  row.textContent = text;
  logEl.appendChild(row);
  scroll();
}

function typeLine(text, opts, mySeq) {
  return new Promise(resolve => {
    const row = document.createElement('p');
    row.className = 'comms-line' + (opts.system ? ' comms-system' : ' comms-dispatcher');
    if (!opts.system) {
      const tag = document.createElement('span');
      tag.className = 'comms-tag';
      tag.textContent = 'DISPATCH';
      row.appendChild(tag);
    }
    const body = document.createElement('span');
    body.className = 'comms-body';
    row.appendChild(body);
    logEl.appendChild(row);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      body.textContent = text;
      row.classList.remove('typing');
      if (activeFinish === finish) activeFinish = null;
      scroll();
      resolve();
    };

    if (prefersReducedMotion() || mySeq !== seq) { finish(); return; }

    let i = 0, timer = 0;
    row.classList.add('typing');
    activeFinish = finish;
    const step = () => {
      if (mySeq !== seq) { finish(); return; }    // screen torn down → stop
      if (i >= text.length) { finish(); return; }
      body.textContent = text.slice(0, ++i);
      scroll();
      timer = setTimeout(step, speed);
    };
    step();
  });
}

function scroll() { if (logEl) logEl.scrollTop = logEl.scrollHeight; }

export function clearComms() {
  seq++;                        // invalidate any in-flight typing
  activeFinish = null;
  if (logEl) logEl.innerHTML = '';
}
