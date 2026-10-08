// Sanftes Feedback: kleine Perlen-Freude, Wackeln, große Antwortknöpfe.
import { h } from './util.js?v=5';

const COLORS = ['#F0A63A', '#2D7C79', '#9A86D6', '#F6C56E', '#5BAAA4'];

export function burst(target, n = 12, { dist = 70 } = {}) {
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const d = dist + Math.random() * dist * 0.85;
    const p = h('span', { class: 'burst' });
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.background = COLORS[i % COLORS.length];
    p.style.setProperty('--dx', Math.cos(a) * d + 'px');
    p.style.setProperty('--dy', Math.sin(a) * d + 'px');
    document.body.append(p);
    setTimeout(() => p.remove(), 900);
  }
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
