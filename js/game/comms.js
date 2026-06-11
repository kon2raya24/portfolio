/* =============================================================================
   NIGHT SHIFT — COMMS (contact as the final mission / NPC interaction)
   The contact form, reframed as a secure transmission to L. TURAYA. Posts to
   the same Netlify "contact" form the rest of the site uses, so messages land
   in the existing inbox + admin viewer. After send, the Dispatcher acknowledges
   in character — then the fiction steps aside and the real links surface plainly.
   ========================================================================== */

import { el, clear } from './util.js';
import { OPERATOR } from './missions.data.js';
import * as S from './state.js';

function encode(data) {
  return Object.keys(data).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k])).join('&');
}

export function renderComms(container, opts = {}) {
  clear(container);
  const dawn = S.get().flags.dawn;

  const screen = el('.comms-screen');
  screen.appendChild(el('.cs-head', null, [
    el('p.cs-kicker', { text: dawn ? 'DAWN · 05:14 — SHIFT COMPLETE' : 'SECURE CHANNEL OPEN' }),
    el('h1.cs-title', { text: 'DIRECT LINE — L. TURAYA' }),
    el('p.cs-sub', {
      text: dawn
        ? 'Network’s stable. Shift’s over. If you want to talk about what you saw — channel’s open.'
        : 'You’ve seen enough of the network to know who runs it. Channel’s open if you want to reach the operator directly.',
    }),
  ]));

  // --- transmission composer (the contact form) ---------------------------
  const form = el('form.cs-form', {
    name: 'contact', method: 'POST', 'data-netlify': 'true', 'netlify-honeypot': 'bot-field', action: '?sent=1',
  });
  form.appendChild(el('input', { type: 'hidden', name: 'form-name', value: 'contact' }));
  const honey = el('p.cs-honey', { 'aria-hidden': 'true' }, [
    el('label', null, ['Skip if human: ', el('input', { name: 'bot-field', tabindex: '-1', autocomplete: 'off' })]),
  ]);
  form.appendChild(honey);

  form.appendChild(field('TO', el('input.cs-input.cs-locked', { type: 'text', value: 'L. TURAYA · OPERATIONS', readonly: 'readonly', tabindex: '-1' })));
  form.appendChild(field('FROM (your name)', el('input.cs-input', { type: 'text', name: 'name', required: 'required', autocomplete: 'name', placeholder: 'Your name' })));
  form.appendChild(field('REPLY-TO (email)', el('input.cs-input', { type: 'email', name: 'email', required: 'required', autocomplete: 'email', placeholder: 'you@company.com' })));
  form.appendChild(field('ORG / ROLE', el('input.cs-input', { type: 'text', name: 'company', autocomplete: 'organization', placeholder: 'Acme Inc. · Engineering Manager' })));
  const sel = el('select.cs-input', { name: 'opportunity_type' }, [
    el('option', { value: '', text: 'Select…' }),
    el('option', { text: 'Full-time role' }), el('option', { text: 'Contract / Freelance' }),
    el('option', { text: 'Short project' }), el('option', { text: 'Just chatting' }),
  ]);
  form.appendChild(field('CHANNEL', sel));
  form.appendChild(field('TRANSMISSION', el('textarea.cs-input.cs-area', { name: 'message', required: 'required', rows: '4', placeholder: 'A few lines about the role or project…' })));

  const foot = el('.cs-foot', null, [
    el('button.cs-send', { type: 'submit' }, [el('span', { text: 'TRANSMIT ▸' })]),
    el('span.cs-hint', { text: 'usually a reply within 24h · GMT+8 PHT' }),
  ]);
  form.appendChild(foot);

  const status = el('.cs-status', { role: 'status', 'aria-live': 'polite' });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = v; });
    const sendBtn = form.querySelector('.cs-send');
    sendBtn.disabled = true; sendBtn.querySelector('span').textContent = 'TRANSMITTING…';
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: encode(data) })
      .then(() => acknowledge(data.name))
      .catch(() => {
        status.classList.add('cs-status-err');
        status.textContent = 'Transmission failed — reach the operator directly below.';
        sendBtn.disabled = false; sendBtn.querySelector('span').textContent = 'TRANSMIT ▸';
        revealLinks();
      });
  });

  function acknowledge(name) {
    form.classList.add('cs-sent');
    status.classList.add('cs-status-ok');
    status.textContent = `Transmission received${name ? ', ' + name : ''}. The operator will reply within 24 hours. — DISPATCH`;
    revealLinks();
  }

  // --- real links (the fiction steps aside) -------------------------------
  const links = el('.cs-links', { hidden: 'hidden' }, [
    el('p.cs-links-lead', { text: 'Direct lines:' }),
    el('a.cs-link', { href: 'mailto:' + OPERATOR.email, text: OPERATOR.email }),
    el('a.cs-link', { href: OPERATOR.links.linkedin, text: 'LinkedIn ↗', target: '_blank', rel: 'noopener' }),
    el('a.cs-link', { href: OPERATOR.links.github, text: 'GitHub ↗', target: '_blank', rel: 'noopener' }),
    el('a.cs-link', { href: OPERATOR.links.resume, text: 'Résumé (PDF) ↗', target: '_blank', rel: 'noopener' }),
  ]);
  function revealLinks() { links.hidden = false; }

  screen.appendChild(form);
  screen.appendChild(status);
  screen.appendChild(links);

  // always-available plain links too (don't gate contact behind a successful POST)
  screen.appendChild(el('button.cs-reveal', { type: 'button', text: 'or just show me the direct links', on: { click: revealLinks } }));

  container.appendChild(screen);
  const firstInput = form.querySelector('input[name="name"]');
  if (firstInput) firstInput.focus();
}

function field(label, control) {
  const id = 'cs-' + label.toLowerCase().replace(/[^a-z]+/g, '-');
  control.id = control.id || id;
  return el('label.cs-field', { for: control.id }, [el('span.cs-flabel', { text: label }), control]);
}
