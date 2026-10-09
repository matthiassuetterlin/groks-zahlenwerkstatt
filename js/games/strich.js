// Rechenstrich (nach PIK/Primakom): ein leerer Strich ohne Skala – keine hüpfende Zahlenreihe.
// Sprung-Chips +10 / +5 / +1 (und „bis zum Zehner“) legen Bögen an. Am Ende: wie viele Sprünge, und wie wenige gehen?
import { h, rand, fresh, numberWord, options, swapDigits, fitStage } from '../util.js?v=6';
import { speakCards } from '../blocks.js?v=6';
import { draggable, addDropZone } from '../drag.js?v=6';
import { choices, wiggle, choiceSlot } from '../fx.js?v=6';
import { handHint } from '../hint.js?v=6';
import { ICON_UNDO } from '../icons.js?v=6';

const NS = 'http://www.w3.org/2000/svg';
const ARC = '<svg class="ico" viewBox="0 0 28 16" aria-hidden="true"><path d="M3 14 Q14 -6 25 14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
const STAR = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" fill="currentColor"/></svg>';
const W = 640, H = 230, BASE = 150, X0 = 34, X1 = W - 30;
const WIDTH = { 10: 112, 5: 74, 1: 40 };
const el = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };

function makeTask(chips) {
  if (chips.includes('stop')) {
    const a = rand(1, 8) * 10 + rand(5, 9);
    const b = rand(Math.max(3, 11 - (a % 10)), 9);
    return { a, b: a + b > 99 ? 99 - a : b };
  }
  if (chips.includes(5)) {
    const a = rand(12, 48);
    let b = rand(1, 3) * 10 + rand(5, 9);
    if ((a % 10) + (b % 10) >= 10) b -= (a % 10) + (b % 10) - 9; // ohne Zehnerübergang (der kommt in Stufe 3)
    return { a, b };
  }
  const a = rand(11, 55);
  let b = rand(1, 3) * 10 + rand(1, 4);
  if ((a % 10) + (b % 10) >= 10) b -= (a % 10) + (b % 10) - 9;
  return { a, b };
}

function idealJumps(a, b, chips) {
  let cur = a, left = b, n = 0;
  if (chips.includes('stop') && (cur % 10) + left > 10) { const s = 10 - (cur % 10); cur += s; left -= s; n++; }
  n += Math.floor(left / 10); left %= 10;
  if (chips.includes(5) && left >= 5) { n++; left -= 5; }
  return n + left;
}

export function playStrich(stage, { level, grok, onSolved, rail, actions }) {
  const chips = level.chips || [10, 1];
  const { a, b } = fresh(() => makeTask(chips), [], 10);
  const target = a + b;
  const ideal = idealJumps(a, b, chips);
  const cleanups = [];

  const box = h('span', { class: 'box' }, '?');
  const jumpsEl = h('b', {}, '0');
  const idealEl = h('span', { class: 'meta-chip meta-chip--ideal', hidden: true, title: 'geht mit' }, h('span', { html: STAR, style: { display: 'inline-flex', width: '1.05em' } }), h('b', {}, String(ideal)));
  const task = h('div', { class: 'task' }, h('span', { class: 'task-num task-num--eq' }, `${a} + ${b} = `, box),
    h('span', { class: 'meta-chip', title: 'Sprünge', 'aria-label': 'Sprünge' }, h('span', { html: ARC, style: { display: 'inline-flex', width: '1.4em' } }), jumpsEl), idealEl);
  stage.append(task);

  const svg = el('svg', { class: 'strich', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Rechenstrich' });
  svg.append(el('line', { x1: X0 - 14, y1: BASE, x2: X1 + 14, y2: BASE, class: 'strich-line' }));
  const gArcs = el('g'); const gMarks = el('g');
  svg.append(gArcs, gMarks);
  const wrap = h('div', { class: 'strich-wrap' }, svg);
  const fs = fitStage(stage, wrap, { max: 2, beads: false });

  const chipRow = h('div', { class: 'jump-chips' });
  const undo = h('button', { class: 'btn btn--soft btn-icon', type: 'button', disabled: true, 'aria-label': 'Zurück', title: 'Zurück', html: ICON_UNDO });
  actions.append(undo);
  rail.append(chipRow);
  const host = choiceSlot(3);
  rail.append(host);

  grok.say(`Spring von <b>${a}</b> nach vorn – mit großen Sprüngen!`);
  grok.setHints(chips.includes('stop')
    ? ['Erst bis zum nächsten Zehner.', `Bis ${Math.ceil(a / 10) * 10} fehlen ${10 - (a % 10)}.`, 'Dann der Rest.']
    : [`${b} = ${Math.floor(b / 10)} Zehner und ${b % 10} Einer.`, 'Erst die großen Sprünge.', chips.includes(5) ? '+5 spart Sprünge.' : 'Dann die kleinen.']);

  let jumps = [];   // Sprungweiten (Zahlen)
  let done = false;
  const cur = () => a + jumps.reduce((s, j) => s + j, 0);
  const wOf = (j) => WIDTH[j] || (40 + j * 7);

  // Breite: der kürzeste Weg füllt den Strich gut aus (ohne Skala – nur die Sprünge zählen)
  const idealW = (() => {
    let cur = a, left = b, w = 0;
    if (chips.includes('stop') && (cur % 10) + left > 10) { const s0 = 10 - (cur % 10); w += wOf(s0); cur += s0; left -= s0; }
    w += Math.floor(left / 10) * wOf(10); left %= 10;
    if (chips.includes(5) && left >= 5) { w += wOf(5); left -= 5; }
    return w + left * wOf(1);
  })();
  function render() {
    gArcs.replaceChildren(); gMarks.replaceChildren();
    const total = jumps.reduce((s, j) => s + wOf(j), 0);
    const k = Math.min(2.4, ((X1 - X0) * 0.9) / Math.max(1, idealW, total));
    let x = X0, v = a;
    const mark = (x, label, cls = '') => {
      gMarks.append(el('line', { x1: x, y1: BASE - 12, x2: x, y2: BASE + 12, class: 'strich-tick' }));
      const t = el('text', { x, y: BASE + 42, class: 'strich-num ' + cls, 'text-anchor': 'middle' });
      t.textContent = label;
      gMarks.append(t);
    };
    mark(x, String(a), 'is-start');
    jumps.forEach((j, i) => {
      const w = wOf(j) * k, x2 = x + w;
      const hgt = Math.min(92, 26 + w * 0.5);
      const p = el('path', { d: `M${x} ${BASE - 4} Q${(x + x2) / 2} ${BASE - hgt * 2 + 4} ${x2} ${BASE - 4}`, class: `strich-arc strich-arc--${j >= 10 ? 'ten' : j === 5 ? 'five' : j === 1 ? 'one' : 'stop'}` });
      gArcs.append(p);
      if (i === jumps.length - 1 && p.getTotalLength) {
        const L = p.getTotalLength();
        p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
        p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 420, easing: 'ease-out', fill: 'forwards' });
      }
      const lab = el('text', { x: (x + x2) / 2, y: BASE - hgt - 8, class: 'strich-lab', 'text-anchor': 'middle' });
      lab.textContent = '+' + j;
      gArcs.append(lab);
      v += j;
      const last = i === jumps.length - 1;
      mark(x2, last && v === target && !done ? '?' : String(v), last ? 'is-now' : '');
      x = x2;
    });
  }

  function refreshChips() {
    chipRow.replaceChildren();
    for (const c of chips) {
      const stop = c === 'stop';
      const amt = stop ? 10 - (cur() % 10) : c;
      const label = stop ? `→${Math.ceil((cur() + 1) / 10) * 10}` : `+${c}`;
      const btn = h('button', { class: `jump-chip jump-chip--${stop ? 'stop' : c >= 10 ? 'ten' : c === 5 ? 'five' : 'one'}`, type: 'button', dataset: { j: String(c) }, disabled: done || (stop && cur() % 10 === 0), 'aria-label': stop ? `bis ${Math.ceil((cur() + 1) / 10) * 10}` : `plus ${c}` }, label);
      cleanups.push(draggable(btn, { payload: { src: 'jump', amt }, onTap: () => jump(amt) }));
      chipRow.append(btn);
    }
  }

  function jump(j) {
    if (done) return false;
    if (cur() + j > target) {
      wiggle(chipRow);
      grok.say(`Zu weit! ${cur()} + ${j} = ${cur() + j}. Nimm einen kleineren Sprung.`, { mood: 'think' });
      return false;
    }
    jumps.push(j);
    jumpsEl.textContent = String(jumps.length);
    undo.disabled = false;
    render();
    refreshChips();
    if (cur() === target) arrive();
    else if (j >= 10 && target - cur() < 10 && !chips.includes('stop')) grok.say('Jetzt die kleinen Sprünge.');
    else if (chips.includes('stop') && cur() % 10 === 0 && j !== 10) grok.say(`Zehnerstopp bei ${cur()}! Noch ${target - cur()}.`, { mood: 'happy' });
    return true;
  }

  function arrive() {
    done = true;
    refreshChips();
    undo.disabled = true;
    grok.say('Angekommen! Welche Zahl?');
    const sw = swapDigits(target);
    host.replaceChildren(choices(options(target, [sw, target + 10, target - 10, target + 1].filter((x) => x != null), { min: 1, max: 99, count: 3 }), (v) => {
      if (v !== target) { grok.say('Schau auf die Sprünge.', { mood: 'think' }); return false; }
      box.textContent = String(target); box.classList.add('is-filled');
      done = true; render();
      idealEl.hidden = false;
      idealEl.classList.toggle('is-met', jumps.length <= ideal);
      task.append(speakCards(target, { cls: 'speak--small' }));
      grok.cheer(jumps.length <= ideal ? `${numberWord(target)} – mit nur ${jumps.length} Sprüngen!` : `${numberWord(target)}! Geht auch mit ${ideal} Sprüngen.`);
      setTimeout(() => onSolved(chips.includes('stop') ? ['bonds10'] : ['place']), 1300);
      return true;
    }));
  }

  undo.addEventListener('click', () => {
    if (done || !jumps.length) return;
    jumps.pop();
    jumpsEl.textContent = String(jumps.length);
    undo.disabled = !jumps.length;
    render(); refreshChips();
  });
  cleanups.push(addDropZone(wrap, { accepts: (p) => p.src === 'jump', onDrop: (p) => jump(p.amt) }));
  render(); refreshChips();
  cleanups.push(handHint('strich', () => chipRow.querySelector('.jump-chip'), null));
  return () => { fs.destroy(); cleanups.forEach((f) => f()); };
}
