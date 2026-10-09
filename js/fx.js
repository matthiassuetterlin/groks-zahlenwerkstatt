// Sanftes Feedback: kleine Perlen-Freude, Wackeln, große Antwortknöpfe.
import { h } from './util.js?v=7';

// Perlen-Konfetti: kleine 3D-Perlen in den Farben des Themas fliegen in einem ruhigen Bogen auseinander
// und blenden aus. Keine Verzerrung (kein Strecken/Stauchen), bei „Bewegung reduzieren“ entfällt es.
const KINDS = ['one', 'ten', 'mate', 'one', 'hun', 'ten'];

export function burst(target, n = 12, { dist = 70 } = {}) {
  if (!target?.isConnected || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const tok = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bead')) || 28;
  const size = Math.round(Math.max(9, Math.min(15, tok * .42)));
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.5;    // überwiegend nach oben
    const d = dist * (.7 + Math.random() * .8);
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d;
    const fall = 40 + Math.random() * 50;
    const p = h('span', { class: `burst bead-c--${KINDS[i % KINDS.length]}` });
    p.style.left = cx - size / 2 + 'px';
    p.style.top = cy - size / 2 + 'px';
    p.style.width = p.style.height = size + 'px';
    document.body.append(p);
    const dur = 900 + Math.random() * 300;
    const anim = p.animate([
      { transform: 'translate(0, 0)', opacity: 1 },
      { transform: `translate(${dx * .75}px, ${dy * .9}px)`, opacity: 1, offset: .45 },
      { transform: `translate(${dx}px, ${dy + fall}px)`, opacity: 0 },
    ], { duration: dur, easing: 'cubic-bezier(.25,.6,.4,1)', delay: i * 12, fill: 'both' });
    anim.onfinish = () => p.remove();
    setTimeout(() => p.remove(), dur + 400);
  }
}

/** Kurzes, sanftes „Richtig“-Leuchten um ein Element. */
export function glow(el) {
  if (!el) return;
  el.classList.remove('ok-glow'); void el.offsetWidth; el.classList.add('ok-glow');
  setTimeout(() => el.classList.remove('ok-glow'), 900);
}

/**
 * Platz für Antwort-Knöpfe, die erst später erscheinen: unsichtbare Platzhalter gleicher Größe.
 * Später host.replaceChildren(choices(...)) – die Leiste wächst nicht, die Bühne springt nicht.
 */
export function choiceSlot(n = 3) {
  const host = h('div', { class: 'rail-choices' });
  const ph = h('div', { class: 'choices is-ph', 'aria-hidden': 'true' });
  for (let i = 0; i < n; i++) ph.append(h('button', { class: 'choice', type: 'button', disabled: true, tabindex: '-1' }, '00'));
  host.append(ph);
  return host;
}

/** Sichtbar/unsichtbar schalten, OHNE den Platz freizugeben (kein Umfließen). */
export function setShown(el, on) {
  el.hidden = false;
  el.classList.toggle('is-off', !on);
  if ('disabled' in el && el.tagName === 'BUTTON') el.disabled = !on;
  if (on) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
}

export function wiggle(el) {
  el.classList.remove('wiggle');
  void el.offsetWidth;
  el.classList.add('wiggle');
  setTimeout(() => el.classList.remove('wiggle'), 600);
}

/**
 * Große Antwort-Knöpfe. onPick(value) → true = richtig.
 * Falsche Wahl: Knopf wackelt und wird blass, kein rotes X.
 */
export function choices(values, onPick, { label = (v) => String(v) } = {}) {
  const row = h('div', { class: 'choices' });
  let locked = false;
  for (const v of values) {
    const b = h('button', { class: 'choice', type: 'button', dataset: { value: v } }, label(v));
    b.addEventListener('click', () => {
      if (locked || b.classList.contains('is-dim')) return;
      const ok = onPick(v, b);
      if (ok) {
        locked = true;
        b.classList.add('is-right');
        row.classList.add('is-solved');
        burst(b, 10);
      } else {
        b.classList.add('is-dim');
        wiggle(b);
      }
    });
    row.append(b);
  }
  return row;
}
