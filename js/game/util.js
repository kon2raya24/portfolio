/* =============================================================================
   NIGHT SHIFT — small shared helpers. No dependencies.
   ========================================================================== */

let _rmCache = null;
export function prefersReducedMotion() {
  if (_rmCache !== null) return _rmCache;
  try {
    _rmCache = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { _rmCache = false; }
  return _rmCache;
}

/** Tiny hyperscript: el('button.foo#id', { aria-label:'x' }, [children|text]). */
export function el(spec, attrs, children) {
  const m = String(spec).match(/^([a-z0-9]+)?(#[-\w]+)?((?:\.[-\w]+)*)$/i) || [];
  const tag = m[1] || 'div';
  const node = document.createElement(tag);
  if (m[2]) node.id = m[2].slice(1);
  if (m[3]) node.className = m[3].split('.').filter(Boolean).join(' ');
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') node.className = (node.className ? node.className + ' ' : '') + v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'on' && typeof v === 'object') for (const ev in v) node.addEventListener(ev, v[ev]);
      else if (k in node && k !== 'style' && k !== 'list') { try { node[k] = v; } catch (e) { node.setAttribute(k, v); } }
      else node.setAttribute(k, v);
    }
  }
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  if (children == null) return;
  if (Array.isArray(children)) { for (const c of children) appendChildren(node, c); return; }
  if (children instanceof Node) { node.appendChild(children); return; }
  node.appendChild(document.createTextNode(String(children)));
}

export function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

/** Animate a number from a→b into el.textContent. Respects reduced motion. */
export function countUp(node, from, to, { dur = 900, suffix = '', prefix = '', decimals = 0 } = {}) {
  const final = () => { node.textContent = prefix + to.toFixed(decimals) + suffix; };
  if (prefersReducedMotion() || from === to) { final(); return Promise.resolve(); }
  return new Promise(resolve => {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = from + (to - from) * eased;
      node.textContent = prefix + val.toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else { final(); resolve(); }
    };
    requestAnimationFrame(tick);
  });
}

export function wait(ms) {
  if (prefersReducedMotion()) ms = Math.min(ms, 120);
  return new Promise(r => setTimeout(r, ms));
}

/** Parse a hash route like '#/facility/wms-v2' → { screen, arg }. */
export function parseHash() {
  const raw = (location.hash || '').replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);
  return { screen: parts[0] || '', arg: parts[1] || '' };
}

export function setHash(screen, arg) {
  const next = '#/' + screen + (arg ? '/' + arg : '');
  if (location.hash !== next) location.hash = next;
}
