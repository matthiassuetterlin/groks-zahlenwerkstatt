// Zahlenhaus mit Zehnern (Stellenwert): Wer wohnt im leeren Zimmer? – gehört jetzt zu „Lege die Zahl“.
import { h, fresh, rand, options, fitStage } from '../util.js?v=8';
import { quantity } from '../blocks.js?v=8';
import { draggable, addDropZone } from '../drag.js?v=8';
import { wiggle, burst } from '../fx.js?v=8';
import { handHint } from '../hint.js?v=8';

export function playHaus(stage, ctx) {
  return house(stage, ctx);
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
  const fs = fitStage(stage, houseEl, { max: 1.6 });
  const cards = h('div', { class: 'num-cards' });
  rail.append(cards);

  grok.say('Wer wohnt im leeren Zimmer?');
  grok.setHints([
    `${whole} = ${Math.floor(whole / 10)} Zehner, ${whole % 10} Einer.`,
    `${partA} = ${partA / 10} Zehner. Wie viele fehlen?`,
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
      grok.cheer(`${whole} = ${partA} + ${partB}!`);
      setTimeout(onSolved, 1300);
      return true;
    }
    roomB.classList.add('is-try');
    wiggle(roomB);
    grok.say(`${partA} + ${v} = ${partA + v}. Nicht ${whole}.`, { mood: 'think' });
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
  cleanups.push(handHint('haus', () => cards.querySelector('.num-card'), () => roomB));
  cleanups.push(addDropZone(fs.box, {
    outline: false,
    accepts: (p) => p.src === 'card',
    onDrop: (p) => tryCard(p.v, cards.querySelector(`[data-v="${p.v}"]`)),
  }));
  return () => { fs.destroy(); cleanups.forEach((f) => f()); };
}
