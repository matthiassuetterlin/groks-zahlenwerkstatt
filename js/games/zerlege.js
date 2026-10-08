// Zerlege-Zauber: Eine Zahl in zwei Teile zerlegen (Teil-Ganzes).
// Stufe 1/2: eine Perlenkette mit dem Zauberstab teilen. Stufe 3: Zahlenhaus bis 100.
import { h, fresh, rand, numberWord, options, fitStage } from '../util.js?v=3';
import { bead, quantity } from '../blocks.js?v=3';
import { draggable, addDropZone } from '../drag.js?v=3';
import { wiggle, burst } from '../fx.js?v=3';

const WAND = `<svg viewBox="0 0 64 64" aria-hidden="true">
  <defs><linearGradient id="wg" x1="0" x2="1"><stop offset="0" style="stop-color:var(--grok)"/><stop offset="1" style="stop-color:var(--grok-soft)"/></linearGradient></defs>
  <path d="M12 52 L38 26" style="stroke:url(#wg)" stroke-width="7" stroke-linecap="round"/>
  <path d="M12 52 L17 47" style="stroke:var(--one)" stroke-width="7" stroke-linecap="round"/>
  <path d="M44 8 l3.2 7.4 7.4 3.2 -7.4 3.2 -3.2 7.4 -3.2 -7.4 -7.4 -3.2 7.4 -3.2z" style="fill:var(--one)"/>
  <circle cx="56" cy="34" r="2.6" style="fill:var(--mate)"/><circle cx="28" cy="10" r="2.2" style="fill:var(--ten)"/><circle cx="58" cy="10" r="1.6" style="fill:var(--mate)"/>
</svg>`;

export function playZerlege(stage, ctx) {
  return ctx.level.mode === 'house' ? house(stage, ctx) : chain(stage, ctx);
}

function chain(stage, { level, grok, onSolved, rail }) {
  const cleanups = [];
  const n = fresh(() => rand(level.min, level.max));
  const want = 3;
  const found = new Set();

  const bar = h('div', { class: 'zz-chain' });
  const beads = [];
  const cuts = [];
  for (let i = 0; i < n; i++) {
    const b = bead('one');
    if (Math.floor(i / 5) % 2) b.classList.add('alt');
    beads.push(b);
    bar.append(b);
    if (i < n - 1) {
      const c = h('button', { class: 'cut' + ((i + 1) % 5 === 0 ? ' cut--five' : ''), type: 'button', 'aria-label': `Nach ${i + 1} teilen`, dataset: { k: i + 1 } });
      c.addEventListener('click', () => cut(i + 1));
      cuts.push(c);
      bar.append(c);
    }
  }
  const badgeA = h('span', { class: 'zz-badge zz-badge--a' });
  const badgeB = h('span', { class: 'zz-badge zz-badge--b' });
  const chainWrap = h('div', { class: 'zz-chain-wrap' }, badgeA, badgeB, bar);
  const eq = h('div', { class: 'zz-eq' }, h('span', { class: 'zz-eq-n' }, String(n)), ' = ', h('span', { class: 'pa' }, '?'), ' + ', h('span', { class: 'pb' }, '?'));
  const list = h('div', { class: 'zz-found' });
  for (let i = 0; i < want; i++) list.append(h('div', { class: 'zz-card' }, h('span', { class: 'zz-card-q' }, '?')));
  const content = h('div', { class: 'zz' }, chainWrap, eq, list);

  stage.append(h('div', { class: 'task' }, h('span', { class: 'task-text' }, 'Zerlege die '), h('span', { class: 'task-num' }, String(n))));
  // Hochkant: lange Ketten in Zehner-Reihen umbrechen (wie im Zwanzigerfeld) – so bleiben die Perlen groß.
  const sr = stage.getBoundingClientRect();
  if (n > 10 && sr.width / Math.max(1, sr.height) < 1.3) bar.classList.add('is-wrap');
  const fs = fitStage(stage, content, { max: 1.7 });

  const wand = h('button', { class: 'wand', type: 'button', 'aria-label': 'Zauberstab', html: WAND });
  rail.append(h('div', { class: 'wand-card' }, wand, h('span', { class: 'wand-text' }, 'Zieh den Zauberstab zwischen zwei Perlen – oder tippe in eine Lücke.')));

  grok.say(`Finde <b>${want}</b> Arten, die ${n} zu zerlegen.`);
  grok.setHints([
    'Teile an der Fünfer-Lücke – das geht ganz ohne Zählen.',
    n > 10 ? 'Probier mal 10 und den Rest.' : 'Probier mal 5 und den Rest.',
    '3 + 5 und 5 + 3 sind Tauschaufgaben – das zählt nur einmal.',
  ]);

  let busy = false;
  let resetT = null;
  function placeBadges(k) {
    const split = parseFloat(getComputedStyle(bar).getPropertyValue('--split')) || 30;
    // Abzeichen über der Mitte des Teils (bei Umbruch: über der ersten Reihe des Teils)
    const place = (badge, a, b, dx) => {
      const row = beads.slice(a, b + 1).filter((el) => el.offsetTop === beads[a].offsetTop);
      const last = row[row.length - 1];
      badge.style.left = (beads[a].offsetLeft + last.offsetLeft + last.offsetWidth) / 2 + dx + bar.offsetLeft + 'px';
      badge.style.top = bar.offsetTop + beads[a].offsetTop - 54 + 'px';
    };
    badgeA.textContent = String(k);
    badgeB.textContent = String(n - k);
    place(badgeA, 0, k - 1, -split / 2);
    place(badgeB, k, n - 1, split / 2);
    chainWrap.classList.add('show-badges');
  }
  function reset() {
    bar.classList.remove('is-cut');
    chainWrap.classList.remove('show-badges');
    cuts.forEach((c) => c.classList.remove('is-open'));
    beads.forEach((b) => b.classList.remove('part-a', 'part-b', 'bead--mate'));
    eq.querySelector('.pa').textContent = '?';
    eq.querySelector('.pb').textContent = '?';
    busy = false;
  }
  function cut(k) {
    if (busy) return;
    busy = true;
    clearTimeout(resetT);
    const a = k, b = n - k;
    const key = [Math.min(a, b), Math.max(a, b)].join('+');
    bar.classList.add('is-cut');
    cuts[k - 1].classList.add('is-open');
    beads.forEach((el, i) => {
      el.classList.toggle('part-a', i < k);
      el.classList.toggle('part-b', i >= k);
      el.classList.toggle('bead--mate', i >= k);
    });
    placeBadges(k);
    burst(cuts[k - 1], 8);
    eq.querySelector('.pa').textContent = String(a);
    eq.querySelector('.pb').textContent = String(b);
    if (found.has(key)) {
      grok.say(a === b ? 'Die hast du schon! Findest du eine andere?' : 'Das ist die Tauschaufgabe – die hast du schon. Noch eine andere?', { mood: 'think' });
    } else {
      found.add(key);
      const card = list.children[found.size - 1];
      const strip = h('span', { class: 'zz-strip' });
      for (let i = 0; i < n; i++) { const m = bead(i < a ? 'one' : 'mate'); if (i === a) m.classList.add('gap'); strip.append(m); }
      card.replaceChildren(strip, h('span', { class: 'zz-card-eq' }, h('b', { class: 'pa' }, String(a)), ' + ', h('b', { class: 'pb' }, String(b))));
      card.classList.add('is-on');
      if (found.size >= want) {
        grok.cheer(`Zauberhaft! Du hast ${want} Zerlegungen gefunden.`);
        setTimeout(onSolved, 1400);
        return;
      }
      grok.cheer(a === 5 || b === 5 || a === 10 || b === 10 ? `Ja! ${numberWord(n)} = ${a} + ${b}. Die Fünf oder Zehn sieht man sofort!` : `Ja! ${a} + ${b}. Noch ${want - found.size}!`);
    }
    resetT = setTimeout(reset, 1500);
  }

  cleanups.push(draggable(wand, { payload: { src: 'wand' }, onTap: () => grok.say('Zieh mich zwischen zwei Perlen!') }));
  cleanups.push(addDropZone(chainWrap, {
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
  return () => { clearTimeout(resetT); fs.destroy(); cleanups.forEach((f) => f()); };
}

function house(stage, { grok, onSolved, rail }) {
  const cleanups = [];
  const whole = fresh(() => rand(3, 9) * 10 + rand(1, 9));
  const partA = rand(1, Math.floor(whole / 10) - 1) * 10;
  const partB = whole - partA;
  const opts = options(partB, [partB + 10, partB - 10, partB + 1, partB - 1, partB % 10 * 10 + Math.floor(partB / 10)], { min: 1, max: 99, count: 3 });

  const roomB = h('div', { class: 'room room--b drop-target' }, h('span', { class: 'room-q' }, '?'));
  const houseEl = h('div', { class: 'house' },
    h('div', { class: 'roof' }, h('span', { class: 'roof-num' }, String(whole))),
    h('div', { class: 'rooms' },
      h('div', { class: 'room room--a' }, h('span', { class: 'room-num' }, String(partA)), quantity(partA)),
      roomB,
    ),
  );
  stage.append(h('div', { class: 'task' }, h('span', { class: 'task-text' }, 'Zahlenhaus: Was gehört ins leere Zimmer?')));
  const fs = fitStage(stage, houseEl, { max: 1.6 });
  const cards = h('div', { class: 'num-cards' });
  rail.append(h('p', { class: 'choices-q' }, 'Zieh die Karte ins Zimmer'), cards);

  grok.say(`Im Dach steht <b>${whole}</b>. Ein Zimmer hat ${partA}. Was fehlt?`);
  grok.setHints([
    `${whole} hat ${Math.floor(whole / 10)} Zehner und ${whole % 10} Einer.`,
    `${partA} sind ${partA / 10} Zehner. Wie viele Zehner fehlen noch?`,
    'Die Einer bleiben gleich!',
  ]);

  let busy = false;
  function tryCard(v, el) {
    if (busy) return false;
    busy = true;
    roomB.replaceChildren(h('span', { class: 'room-num' }, String(v)), quantity(v));
    if (v === partB) {
      roomB.classList.add('is-good');
      el?.classList.add('is-used');
      burst(houseEl.querySelector('.roof'), 12);
      grok.cheer(`${whole} = ${partA} + ${partB}. Das Haus ist voll!`);
      setTimeout(onSolved, 1300);
      return true;
    }
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
  cleanups.push(addDropZone(fs.box, {
    accepts: (p) => p.src === 'card',
    onDrop: (p) => tryCard(p.v, cards.querySelector(`[data-v="${p.v}"]`)),
  }));
  return () => { fs.destroy(); cleanups.forEach((f) => f()); };
}
