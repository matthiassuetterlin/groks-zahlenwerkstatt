// Zerlege-Zauber: Eine Zahl in zwei Teile zerlegen (Teil-Ganzes).
// Stufe 1/2: eine Perlenkette zaubern-schneiden. Stufe 3: Zahlenhaus bis 100.
import { h, fresh, rand, shuffle, numberWord, options } from '../util.js?v=2';
import { bead, quantity } from '../blocks.js?v=2';
import { draggable, addDropZone } from '../drag.js?v=2';
import { wiggle, burst } from '../fx.js?v=2';

const WAND = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 38 L30 18" stroke="#3B3F6B" stroke-width="5" stroke-linecap="round"/><path d="M33 6 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4z" fill="#F0A63A"/><circle cx="42" cy="26" r="2" fill="#9A86D6"/><circle cx="22" cy="8" r="1.6" fill="#5BAAA4"/></svg>`;

export function playZerlege(stage, ctx) {
  return ctx.level.mode === 'house' ? house(stage, ctx) : chain(stage, ctx);
}

function chain(stage, { level, grok, onSolved }) {
  const cleanups = [];
  const n = fresh(() => rand(level.min, level.max));
  const want = n <= 5 ? 2 : 3;
  const found = new Set();

  const bar = h('div', { class: 'chain' });
  const cuts = [];
  for (let i = 0; i < n; i++) {
    const b = bead('one');
    b.dataset.i = i;
    if (Math.floor(i / 5) % 2) b.classList.add('alt');
    bar.append(b);
    if (i < n - 1) {
      const c = h('button', { class: 'cut' + ((i + 1) % 5 === 0 ? ' cut--five' : ''), type: 'button', 'aria-label': `Nach ${i + 1} schneiden`, dataset: { k: i + 1 } });
      c.addEventListener('click', () => cut(i + 1));
      cuts.push(c);
      bar.append(c);
    }
  }
  const eq = h('div', { class: 'chain-eq' }, h('span', { class: 'muted' }, ' '));
  const list = h('div', { class: 'found' });
  for (let i = 0; i < want; i++) list.append(h('span', { class: 'found-slot' }, '?'));
  const wand = h('button', { class: 'wand', type: 'button', 'aria-label': 'Zauberstab', html: WAND });

  stage.append(h('div', { class: 'zerlege' },
    h('p', { class: 'prompt' }, `Zerlege die ${n}`),
    h('div', { class: 'chain-wrap' }, bar),
    eq,
    h('div', { class: 'zerlege-row' }, wand, h('span', { class: 'hint-line' }, 'Zieh den Zauberstab zwischen zwei Perlen – oder tippe in eine Lücke.')),
    list,
  ));

  // Perlengröße an die Breite anpassen
  requestAnimationFrame(() => {
    const w = bar.parentElement.clientWidth || 700;
    const bsize = Math.max(18, Math.min(46, Math.floor((w - 40) / (n * 1.42 + 1))));
    bar.style.setProperty('--b', bsize + 'px');
  });
  grok.say(`Finde <b>${want}</b> Arten, die ${n} zu zerlegen.`);
  grok.setHints([
    'Schneide an der Fünfer-Lücke – das geht ganz ohne Zählen.',
    n > 10 ? 'Probier mal 10 und den Rest.' : 'Probier mal 5 und den Rest.',
    '3 + 5 und 5 + 3 sind Tauschaufgaben – das zählt nur einmal.',
  ]);

  let busy = false;
  function cut(k) {
    if (busy) return;
    busy = true;
    const a = k, b = n - k;
    const key = [Math.min(a, b), Math.max(a, b)].join('+');
    bar.classList.add('is-cut');
    cuts[k - 1].classList.add('is-open');
    [...bar.querySelectorAll('.bead')].forEach((el) => el.classList.toggle('part-b', +el.dataset.i >= k));
    eq.replaceChildren(h('span', {}, `${n} = `), h('b', { class: 'pa' }, String(a)), h('span', {}, ' + '), h('b', { class: 'pb' }, String(b)));
    if (found.has(key)) {
      grok.say(a === b || found.has(`${a}+${b}`) && a < b ? 'Die hast du schon! Findest du eine andere?' : `Das ist die Tauschaufgabe – die hast du schon. Noch eine andere?`, { mood: 'think' });
    } else {
      found.add(key);
      const slot = list.children[found.size - 1];
      slot.textContent = `${a} + ${b}`;
      slot.classList.add('is-on');
      burst(slot, 8);
      if (found.size >= want) {
        grok.cheer(`Zauberhaft! Du hast ${want} Zerlegungen gefunden.`);
        setTimeout(onSolved, 1200);
        return;
      }
      grok.cheer(a === 5 || b === 5 || a === 10 || b === 10 ? `Ja! ${numberWord(n)} = ${a} + ${b}. Die Fünf oder Zehn sieht man sofort!` : `Ja! ${a} + ${b}. Noch ${want - found.size}!`);
    }
    setTimeout(() => {
      bar.classList.remove('is-cut');
      cuts[k - 1].classList.remove('is-open');
      bar.querySelectorAll('.part-b').forEach((el) => el.classList.remove('part-b'));
      busy = false;
    }, 1500);
  }

  cleanups.push(draggable(wand, { payload: { src: 'wand' }, onTap: () => grok.say('Zieh mich zwischen zwei Perlen!') }));
  cleanups.push(addDropZone(bar.parentElement || bar, {
    accepts: (p) => p.src === 'wand',
    onDrop: (p, pt) => {
      let best = null, bd = Infinity;
      for (const c of cuts) {
        const r = c.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - pt.x);
        if (d < bd) { bd = d; best = c; }
      }
      if (best) cut(+best.dataset.k);
      return true;
    },
  }));
  return () => cleanups.forEach((f) => f());
}

function house(stage, { grok, onSolved }) {
  const cleanups = [];
  const whole = fresh(() => rand(3, 9) * 10 + rand(1, 9));
  const partA = rand(1, Math.floor(whole / 10) - 1) * 10;
  const partB = whole - partA;
  const opts = options(partB, [partB + 10, partB - 10, partB + 1, partB - 1, partB % 10 * 10 + Math.floor(partB / 10)], { min: 1, max: 99, count: 3 });

  const roomB = h('div', { class: 'room room--b drop-target' }, h('span', { class: 'room-q' }, '?'));
  const houseEl = h('div', { class: 'house' },
    h('div', { class: 'roof' }, h('span', {}, String(whole))),
    h('div', { class: 'rooms' },
      h('div', { class: 'room room--a' }, h('span', { class: 'room-num' }, String(partA)), quantity(partA)),
      roomB,
    ),
  );
  const cards = h('div', { class: 'num-cards' });
  stage.append(h('div', { class: 'zerlege zerlege--house' },
    h('p', { class: 'prompt' }, 'Zahlenhaus'),
    houseEl,
    h('p', { class: 'hint-line' }, 'Welche Zahl gehört in das leere Zimmer? Zieh die Karte hinein.'),
    cards,
  ));

  grok.say(`Im Dach steht <b>${whole}</b>. Ein Zimmer hat ${partA}. Was fehlt?`);
  grok.setHints([
    `${whole} hat ${Math.floor(whole / 10)} Zehner und ${whole % 10} Einer.`,
    `${partA} sind ${partA / 10} Zehner. Wie viele Zehner fehlen noch?`,
    'Die Einer bleiben gleich!',
  ]);

  let busy = false;
  function tryCard(v, el) {
    if (busy) return false;
    if (v === partB) {
      busy = true;
      roomB.replaceChildren(h('span', { class: 'room-num' }, String(v)), quantity(v));
      roomB.classList.add('is-good');
      el?.classList.add('is-used');
      burst(houseEl.querySelector('.roof'), 12);
      grok.cheer(`${whole} = ${partA} + ${partB}. Das Haus ist voll!`);
      setTimeout(onSolved, 1300);
      return true;
    }
    busy = true;
    roomB.replaceChildren(h('span', { class: 'room-num' }, String(v)), quantity(v));
    roomB.classList.add('is-try');
    wiggle(roomB);
    grok.say(`${partA} + ${v} = ${partA + v}. Das Dach sagt ${whole}.`, { mood: 'think' });
    el?.classList.add('is-tried');
    setTimeout(() => {
      roomB.classList.remove('is-try');
      roomB.replaceChildren(h('span', { class: 'room-q' }, '?'));
      busy = false;
    }, 1600);
    return false;
  }

  for (const v of opts) {
    const c = h('button', { class: 'num-card', type: 'button', dataset: { v } }, String(v));
    cleanups.push(draggable(c, { payload: { src: 'card', v }, onTap: () => tryCard(v, c) }));
    cards.append(c);
  }
  cleanups.push(addDropZone(roomB, {
    accepts: (p) => p.src === 'card',
    onDrop: (p) => tryCard(p.v, cards.querySelector(`[data-v="${p.v}"]`)),
  }));
  return () => cleanups.forEach((f) => f());
}
