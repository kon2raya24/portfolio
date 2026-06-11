/* =============================================================================
   NIGHT SHIFT — the Cold Open (about-me as a playable sign-in)
   Black screen, a terminal, three lines of self-aware sign-in, the Dispatcher's
   hail. Doubles as the consent gate (sound) and — critically — the recruiter
   escape hatch ("Just here for the file? → SHIFT REPORT") is on screen one.
   ========================================================================== */

import { el, clear, wait, prefersReducedMotion } from './util.js';
import { OPERATOR } from './missions.data.js';
import * as S from './state.js';

export function renderColdOpen(container, opts = {}) {
  clear(container);
  const st = S.get();

  const scene = el('.coldopen');
  const term = el('.co-terminal', { role: 'group', 'aria-label': 'Sign-in terminal' });
  scene.appendChild(term);

  // recruiter fast-path — present immediately, top-right
  scene.appendChild(el('button.co-skip', {
    type: 'button',
    text: 'Just here for the file? → SHIFT REPORT',
    on: { click: () => opts.onSkipToReport && opts.onSkipToReport() },
  }));

  container.appendChild(scene);

  const lines = [
    { t: 'PHILSPAN LOGISTICS NETWORK', cls: 'co-l1' },
    { t: '> night shift · relief operator terminal', cls: 'co-l2' },
    { t: '> storm knocked the network offline at 22:00. day shift is gone.', cls: 'co-l2' },
    { t: '> you have the board tonight.', cls: 'co-l2' },
  ];

  let i = 0;
  const addLine = () => {
    if (i >= lines.length) { return signIn(); }
    const ln = lines[i++];
    const p = el('p.co-line.' + ln.cls, { text: ln.t });
    term.appendChild(p);
    wait(prefersReducedMotion() ? 60 : 460).then(addLine);
  };
  addLine();

  function signIn() {
    const form = el('.co-signin');
    form.appendChild(el('label.co-label', { for: 'co-name', text: 'OPERATOR NAME (optional):' }));
    const input = el('input#co-name.co-input', {
      type: 'text', maxlength: '24', autocomplete: 'off', spellcheck: 'false',
      value: st.operatorName || '', placeholder: 'whatever you like',
    });
    form.appendChild(input);

    const sound = el('label.co-consent', null, [
      el('input', { type: 'checkbox', id: 'co-sound', checked: st.flags.soundOn }),
      el('span', { text: ' Headset on (ambient sound)' }),
    ]);
    form.appendChild(sound);

    const begin = el('button.co-begin', {
      type: 'button',
      text: st.flags.tutorialDone ? 'RESUME SHIFT ▸' : 'CLOCK IN ▸',
      on: {
        click: () => {
          S.setOperatorName(input.value.trim());
          S.setSound(sound.querySelector('input').checked);
          opts.onBegin && opts.onBegin();
        },
      },
    });
    form.appendChild(begin);

    term.appendChild(form);
    wait(40).then(() => begin.focus());

    // Enter submits from the name field
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); begin.click(); } });
  }
}
