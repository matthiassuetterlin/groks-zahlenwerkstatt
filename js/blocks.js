// Bausteine: Perlen, Zehnerstangen, Fünfer, Zehnerfelder.
// Alles wird über die CSS-Variable --b (Perlengröße) skaliert.
import { h, numberWord } from './util.js?v=8';

export const bead = (kind = 'one') => h('span', { class: `bead bead--${kind}` });

/** Waagerechte Zehnerstange: 10 Perlen, sichtbar 5 + 5. */
export function rod(kind = 'ten') {
  const el = h('div', { class: `rod rod--${kind}` });
  for (let i = 0; i < 10; i++) el.append(bead(kind));
  return el;
}

/** Stäbchen mit n Perlen (z. B. ein Fünfer), Lücke nach jeder 5. */
export function stick(n, kind = 'one') {
  const el = h('div', { class: `stick stick--${kind}`, dataset: { n } });
  for (let i = 0; i < n; i++) el.append(bead(kind));
  return el;
}

/** Zehnerfeld 2 × 5. `filled` Perlen der Art `kind`, optional `extra` in Partnerfarbe dahinter. */
export function frame(filled, { kind = 'one', extra = 0, extraKind = 'mate' } = {}) {
  const el = h('div', { class: 'frame' });
  for (let i = 0; i < 10; i++) {
    const c = h('span', { class: 'cell' });
    if (i < filled) c.classList.add('on', `on--${kind}`);
    else if (i < filled + extra) c.classList.add('on', `on--${extraKind}`);
    el.append(c);
  }
  if (filled + extra >= 10) el.classList.add('full');
  return el;
}

/** Zwanzigerfeld: zwei Reihen à 10, Lücke nach 5. Erst Reihe 1 voll, dann Reihe 2. */
export function field20(n) {
  const el = h('div', { class: 'field20' });
  for (let r = 0; r < 2; r++) {
    const row = h('div', { class: 'field20-row' });
    for (let i = 0; i < 10; i++) {
      const c = h('span', { class: 'cell' });
      if (r * 10 + i < n) c.classList.add('on', 'on--one');
      row.append(c);
    }
    el.append(row);
  }
  return el;
}

/** Hunderterfeld aus Stangen-Plätzen: 10 Reihen, Lücke nach 5. `tens` volle Stangen, `mates` in Partnerfarbe. */
export function tensField(tens, { mates = 0 } = {}) {
  const el = h('div', { class: 'tens-field' });
  for (let i = 0; i < 10; i++) el.append(rodSlot(i < tens ? rod('ten') : i < tens + mates ? rod('mate') : null));
  return el;
}

/** Stangen-Platz: gestrichelte Stangenform mit 10 Mulden (5 + 5); optional mit Stange. */
export function rodSlot(rodEl = null) {
  const wells = h('span', { class: 'wells', 'aria-hidden': 'true' });
  for (let k = 0; k < 10; k++) wells.append(h('span', { class: 'well' }));
  const track = h('div', { class: 'slot-track' }, wells);
  const slot = h('div', { class: 'rod-slot' }, track);
  if (rodEl) { track.append(rodEl); slot.classList.add('has-rod'); }
  return slot;
}

/** Kompakte Menge: Zehnerstangen untereinander + ein Zehnerfeld für die Einer. */
export function quantity(n, { showEmptyFrame = false } = {}) {
  const t = Math.floor(n / 10), u = n % 10;
  const el = h('div', { class: 'qty' });
  if (t) {
    const stack = h('div', { class: 'rod-stack' });
    for (let i = 0; i < t; i++) stack.append(rod('ten'));
    el.append(stack);
  }
  if (u || showEmptyFrame || !t) el.append(frame(u));
  return el;
}

/** Päckchen aus k Zehnerstangen (für „Verliebt in 100“). */
export function rodPack(k, kind = 'mate') {
  const el = h('div', { class: 'rod-pack', dataset: { n: k } });
  for (let i = 0; i < k; i++) el.append(rod(kind));
  return el;
}

/** Ziffern in Stellenwertfarben. */
export function digits(n, cls = '') {
  const s = String(n);
  const el = h('span', { class: `digits ${cls}` });
  [...s].forEach((d, i) => {
    const place = s.length - 1 - i; // 0 = Einer, 1 = Zehner, 2 = Hunderter
    el.append(h('span', { class: `dg dg--${['one', 'ten', 'hun'][place]}` }, d));
  });
  return el;
}

/** Zahlenkarten (Montessori-Idee): 60 + 3, übereinandergelegt → 63. */
export function numberCards(tens, units, { stacked = false } = {}) {
  const wrap = h('div', { class: 'ncards' + (stacked ? ' stacked' : ''), role: 'button', tabindex: '0', 'aria-label': 'Zahlenkarten' });
  const tCard = h('div', { class: 'ncard ncard--ten' });
  if (tens >= 10) {
    tCard.classList.add('wide');
    [...String(tens * 10)].forEach((d, i) => tCard.append(h('span', { class: i === 0 ? 'nd nd--hun' : 'nd' }, d)));
  } else {
    tCard.append(h('span', { class: 'nd' }, String(tens)), h('span', { class: 'nd' }, '0'));
  }
  const plus = h('span', { class: 'ncards-plus' }, '+');
  const uStr = String(units);
  const uCard = h('div', { class: 'ncard ncard--one' + (uStr.length > 1 ? ' two' : '') });
  [...uStr].forEach((d) => uCard.append(h('span', { class: 'nd' }, d)));
  wrap.append(tCard, plus, uCard);
  // Übereinanderlegen geht nur, wenn die Einer einstellig sind.
  if (units > 9 || tens >= 10) wrap.classList.add('no-stack');
  return wrap;
}

/** Farbige Perlenstange 1–9 für den Schlangen-Zehner (weiche Eigenfarben, sichtbare 5er-Struktur). */
export function sbar(k, { tone = null } = {}) {
  const el = h('div', { class: `sbar sbar--${tone || k}`, dataset: { k } });
  for (let i = 0; i < k; i++) el.append(h('span', { class: 'bead sbead' }));
  return el;
}

/** Kleines Hunderterfeld (10 × 10, Lücke nach 5) mit Abdeckwinkel: n Punkte sichtbar. */
export function hundredMini(n) {
  const el = h('div', { class: 'hmini' });
  for (let i = 0; i < 100; i++) el.append(h('i', { class: i < n ? 'on' : '' }));
  return el;
}

/** „Zwanzig und drei“ vor „dreiundzwanzig“: erst die Karten 20 + 3, dann (verzögert) das Zahlwort. */
export function speakCards(n, { word = true, cls = '' } = {}) {
  const t = Math.floor(n / 10), u = n % 10;
  const el = h('div', { class: `speak ${cls}`, 'aria-label': `${t ? t * 10 : ''}${t && u ? ' und ' : ''}${u || !t ? u : ''} – ${numberWord(n)}` });
  if (n >= 10 && n < 100) {
    const cards = h('span', { class: 'speak-cards', 'aria-hidden': 'true' },
      h('span', { class: 'scard scard--ten' }, String(t * 10)));
    if (u) cards.append(h('span', { class: 'speak-plus' }, '+'), h('span', { class: 'scard scard--one' }, String(u)));
    el.append(cards);
  }
  if (word) el.append(h('span', { class: 'speak-word' }, numberWord(n)));
  return el;
}
