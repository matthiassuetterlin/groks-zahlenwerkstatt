// Plus mit Struktur: verschiedene Wege über den Zehner.
// small/bridge/big: dazulegen (die Lücke bis zur nächsten 10 leuchtet – Zehnerstopp)
// double: Doppel ±1 (aus „Doppel & Nachbar“) · five: Kraft der Fünf · analog: 3 + 4 → 33 + 4
import { h, fresh, rand, numberWord, options, fitStage } from '../util.js?v=7';
import { createBuilder } from '../builder.js?v=7';
import { stick, rodSlot, rod, frame, speakCards } from '../blocks.js?v=7';
import { draggable, addDropZone } from '../drag.js?v=7';
import { Chain, centers } from '../beadfx.js?v=7';
import { glide } from '../glide.js?v=7';
import { choices } from '../fx.js?v=7';
import { handHint } from '../hint.js?v=7';
import { ICON_HAND } from '../icons.js?v=7';
import { playDoppel } from './doppel.js?v=7';

function makeSum(kind) {
  if (kind === 'small') return { a: fresh(() => rand(6, 9)), b: fresh(() => rand(3, 8)) };
  if (kind === 'bridge') {
    const a = fresh(() => rand(15, 48));
    return { a, b: Math.min(9, 10 - (a % 10) + rand(1, 5)) };
  }
  const a = fresh(() => rand(21, 64));
  let b = fresh(() => rand(12, 35));
  if (a + b > 99) b = 99 - a;
  return { a, b };
}

function solvedChoices(host, rail, sum, extra, onPick) {
  const opts = options(sum, [sum - 10, sum + 10, sum - 1, sum + 1, ...extra], { min: 1, max: 99, count: 3 });
  const row = choices(opts, onPick);
  host.replaceChildren(row);
  if (!host.isConnected) rail.append(host);
  return row;
}

// ── Kraft der Fünf: 7 + 8 = 5 + 5 + 2 + 3 ──────────────────────────────
function playFive(stage, { grok, onSolved, rail }) {
  const r1 = fresh(() => rand(1, 4)), r2 = rand(1, 4);
  const a = 5 + r1, b = 5 + r2, sum = a + b;
  const box = h('span', { class: 'box' }, '?');
  const task = h('div', { class: 'task' }, h('span', { class: 'task-num task-num--eq' }, `${a} + ${b} = `, box));
  stage.append(task);
  const fA = stick(5), fB = stick(5), rA = stick(r1), rB = stick(r2);
  [fA, fB].forEach((f) => f.classList.add('k5-five'));
  [rA, rB].forEach((r) => r.classList.add('k5-rest'));
  const numA = h('div', { class: 'k5-num' }, h('span', { class: 'k5-label' }, String(a)), h('div', { class: 'k5-parts' }, fA, rA));
  const numB = h('div', { class: 'k5-num' }, h('span', { class: 'k5-label' }, String(b)), h('div', { class: 'k5-parts' }, fB, rB));
  const tenSlot = rodSlot();
  tenSlot.classList.add('k5-ten');
  const restFrame = frame(0);
  restFrame.classList.add('k5-restframe');
  const result = h('div', { class: 'k5-result' }, tenSlot, restFrame);
  const board = h('div', { class: 'k5-board' }, h('div', { class: 'k5-nums' }, numA, numB), result);
  const sr = stage.getBoundingClientRect();
  if (sr.width / Math.max(1, sr.height) < 1) board.classList.add('is-narrow');
  const fs = fitStage(stage, board, { max: 2.2 });
  const choicesHost = h('div', { class: 'rail-choices' });

  grok.say('Die Fünfer zusammen!');
  grok.setHints(['Tipp auf einen Fünfer.', '5 + 5 = 10.', `Dann ${r1} + ${r2}.`]);
  let fivesDone = false, restDone = false, dead = false;
  const cleanups = [];
  const beadsOf = (el) => [...el.children];

  function fives(chain = null, from = fA) {
    if (fivesDone || dead) return false;
    fivesDone = true;
    board.classList.add('fives-done');
    const wells = [...tenSlot.querySelectorAll('.well')];
    const other = from === fA ? fB : fA;
    const tFrom = from === fA ? wells.slice(0, 5) : wells.slice(5);
    const tOther = from === fA ? wells.slice(5) : wells.slice(0, 5);
    let left = 2;
    const done = () => {
      if (--left > 0 || dead) return;
      tenSlot.querySelector('.slot-track').append(rod('ten'));
      tenSlot.classList.add('has-rod');
      [fA, fB].forEach((f) => f.classList.add('is-used'));
      grok.say(`5 + 5 = 10! Jetzt ${r1} und ${r2}.`, { mood: 'happy' });
      cleanups.push(handHint('k5-rest', () => rA, () => restFrame, { delay: 400 }));
    };
    if (chain) { beadsOf(from).forEach((e) => { e.style.visibility = 'hidden'; }); chain.land(centers(tFrom), { kindTo: 'ten', onDone: done }); }
    else if (!glide(beadsOf(from), tFrom, 'one', { kindTo: 'ten', onDone: done })) { /* reduzierte Bewegung */ }
    if (!glide(beadsOf(other), tOther, 'one', { kindTo: 'ten', onDone: done })) { /* sofort */ }
    return true;
  }

  function rests(chain = null, from = rA) {
    if (!fivesDone || restDone || dead) return false;
    restDone = true;
    const cells = [...restFrame.children];
    const tA = cells.slice(0, r1), tB = cells.slice(r1, r1 + r2);
    let left = 2;
    const done = () => {
      if (--left > 0 || dead) return;
      cells.slice(0, r1 + r2).forEach((c) => c.classList.add('on', 'on--one'));
      [rA, rB].forEach((r) => r.classList.add('is-used'));
      grok.say(`10 und ${r1 + r2} – wie viele?`);
      solvedChoices(choicesHost, rail, sum, [10 + r1, 10 + r2], (v) => {
        if (v !== sum) { grok.say(`Schau: 10 und ${r1 + r2}.`, { mood: 'think' }); return false; }
        box.textContent = String(sum); box.classList.add('is-filled');
        task.append(speakCards(sum, { cls: 'speak--small' }));
        grok.cheer(`${a} + ${b} = ${sum}. Kraft der Fünf!`);
        setTimeout(() => onSolved(['kraft5']), 1000);
        return true;
      });
    };
    const fromBeads = from === rA ? [beadsOf(rA), tA, beadsOf(rB), tB] : [beadsOf(rB), tB, beadsOf(rA), tA];
    if (chain) { fromBeads[0].forEach((e) => { e.style.visibility = 'hidden'; }); chain.land(centers(fromBeads[1]), { onDone: done }); }
    else glide(fromBeads[0], fromBeads[1], 'one', { onDone: done });
    glide(fromBeads[2], fromBeads[3], 'one', { onDone: done });
    return true;
  }

  for (const f of [fA, fB]) {
    cleanups.push(draggable(f, { payload: { kind: 'five', f }, chain: () => new Chain('one', centers(beadsOf(f))), onTap: () => fives(null, f) }));
    cleanups.push(addDropZone(f, { accepts: (p) => p.kind === 'five' && p.f !== f, onDrop: (p, pt, ch) => fives(ch, p.f) }));
  }
  cleanups.push(addDropZone(tenSlot, { accepts: (p) => p.kind === 'five', onDrop: (p, pt, ch) => fives(ch, p.f) }));
  for (const r of [rA, rB]) {
    cleanups.push(draggable(r, { payload: (e) => (fivesDone ? { kind: 'rest', r } : null), chain: () => new Chain('one', centers(beadsOf(r))), onTap: () => rests(null, r) }));
    cleanups.push(addDropZone(r, { accepts: (p) => p.kind === 'rest' && p.r !== r, onDrop: (p, pt, ch) => rests(ch, p.r) }));
  }
  cleanups.push(addDropZone(restFrame, { accepts: (p) => p.kind === 'rest', onDrop: (p, pt, ch) => rests(ch, p.r) }));
  cleanups.push(handHint('k5-fives', () => fA, () => fB));
  return () => { dead = true; cleanups.forEach((f) => f()); fs.destroy(); };
}

// ── Analogie: erst 3 + 4, dann 33 + 4 ─────────────────────────────────
function playAnalog(stage, ctx) {
  const { grok, onSolved, rail } = ctx;
  const sa = fresh(() => rand(1, 5)), sb = rand(1, 9 - sa);
  const t = rand(2, 8);
  const A = t * 10 + sa, S = A + sb;
  const box1 = h('span', { class: 'box' }, '?');
  const line1 = h('span', { class: 'task-num task-num--eq' }, `${sa} + ${sb} = `, box1);
  const task = h('div', { class: 'task task--stack' }, line1);
  stage.append(task);
  const small = h('div', { class: 'analog-small' }, frame(sa, { extra: sb, extraKind: 'one' }));
  const fs = fitStage(stage, small, { max: 2.4 });
  const choicesHost = h('div', { class: 'rail-choices' });
  rail.append(choicesHost);
  grok.say(`Erst die kleine: ${sa} + ${sb}.`);
  grok.setHints([`${sa} + ${sb} kennst du.`, `${A} hat ${t} Zehner und ${sa} Einer.`, `Die Zehner bleiben: ${t * 10}.`]);
  let bld = null, stopHint = () => {};
  choicesHost.append(choices(options(sa + sb, [sa + sb - 1, sa + sb + 1, sa + sb + 2], { min: 1, max: 10, count: 3 }), (v) => {
    if (v !== sa + sb) { grok.say('Schau auf die Fünf.', { mood: 'think' }); return false; }
    box1.textContent = String(sa + sb); box1.classList.add('is-filled');
    line1.classList.add('task-small');
    setTimeout(big, 800);
    return true;
  }));

  function big() {
    fs.destroy(); fs.box.remove(); choicesHost.replaceChildren();
    const box = h('span', { class: 'box' }, '?');
    const addChip = h('span', { class: 'add-chip' }, '+0');
    task.append(h('span', { class: 'task-num task-num--eq' }, `${A} + ${sb} = `, box),
      h('span', { class: 'meta-chip', title: 'dazugelegt' }, h('span', { html: ICON_HAND, style: { display: 'inline-flex', width: '1.1em' } }), addChip));
    const matHost = h('div', { class: 'bmat-host' });
    stage.append(matHost);
    grok.say(`Und jetzt ${A} + ${sb}? Leg dazu!`);
    let asked = false;
    bld = createBuilder({
      matHost, pickerHost: rail, pieces: [5, 1], tens: t, units: sa,
      allowHundred: false, maxValue: 99, maxUnits: 20, slots: 'auto',
      onChange: (st) => {
        const added = st.value - A;
        addChip.textContent = (added >= 0 ? '+' : '') + added;
        addChip.classList.toggle('is-ok', added === sb);
        if (added === sb && !asked) {
          asked = true;
          grok.say(`Wie ${sa} + ${sb} – nur mit ${t} Zehnern!`);
          solvedChoices(choicesHost, rail, S, [sa + sb], (v) => {
            if (v !== S) { grok.say(v === sa + sb ? `Die ${t} Zehner sind auch noch da!` : `${t * 10} und ${sa + sb}.`, { mood: 'think' }); return false; }
            box.textContent = String(S); box.classList.add('is-filled');
            grok.cheer(`${sa} + ${sb} = ${sa + sb}, also ${A} + ${sb} = ${S}!`);
            setTimeout(() => onSolved(['place']), 1000);
            return true;
          });
        } else if (added !== sb && asked) { asked = false; choicesHost.replaceChildren(); }
      },
    });
    stopHint = bld.hint('drag1', 'plus-analog');
  }
  return () => { stopHint(); bld?.destroy(); fs.destroy(); };
}

export function playPlus(stage, ctx) {
  const { level, grok, onSolved, rail } = ctx;
  if (level.kind === 'double') return playDoppel(stage, { ...ctx, level: { ...level, mode: 'neighbor', min: 6, max: 9 } });
  if (level.kind === 'five') return playFive(stage, ctx);
  if (level.kind === 'analog') return playAnalog(stage, ctx);

  let { a, b } = makeSum(level.kind);
  if (a % 10 + b <= 10 && level.kind !== 'big') b = 10 - (a % 10) + rand(1, 3); // immer über den Zehner
  const sum = a + b;
  const toTen = 10 - (a % 10);
  const big = level.kind === 'big';
  const pieces = big ? [10, 5, 1] : [5, 1];

  const addChip = h('span', { class: 'add-chip' }, '+0');
  const box = h('span', { class: 'box' }, '?');
  const task = h('div', { class: 'task' },
    h('span', { class: 'task-num task-num--eq' }, `${a} + ${b} = `, box),
    h('span', { class: 'meta-chip', title: 'dazugelegt', 'aria-label': 'dazugelegt' }, h('span', { html: ICON_HAND, style: { display: 'inline-flex', width: '1.1em' } }), addChip),
  );
  const matHost = h('div', { class: 'bmat-host' });
  stage.append(task, matHost);
  const choicesHost = h('div', { class: 'rail-choices' });

  grok.say(big ? `Leg <b>${b}</b> dazu!` : `Leg <b>${b}</b> dazu. Erst bis zur 10!`);
  grok.setHints([
    big ? `${b} = ${Math.floor(b / 10)} Zehner, ${b % 10} Einer.` : `Bis zur 10 fehlen ${toTen}. Die Lücke leuchtet.`,
    big ? '10 Einer? <b>Zehner machen</b>!' : `${b} = ${toTen} + ${b - toTen}.`,
    'Ein Fünfer ist schneller als 5 Einer.',
  ]);

  let asked = false, tenNoted = false, row = null;
  const bld = createBuilder({
    matHost, pickerHost: rail, pieces,
    tens: Math.floor(a / 10), units: a % 10,
    allowHundred: false, maxValue: 99, maxUnits: 30, slots: 'auto',
    gapTo: big ? 0 : 10,
    onChange: (st, info) => {
      const added = st.value - a;
      addChip.textContent = (added >= 0 ? '+' : '') + added;
      addChip.classList.toggle('is-ok', added === b);
      if (!tenNoted && info.type === 'add' && st.units >= 10 && !big) {
        tenNoted = true;
        bld?.setOption('gapTo', 0);
        grok.say('Zehnerstopp! Jetzt der Rest.', { mood: 'happy' });
      }
      if (added > b) grok.say('Zu viel! Zieh etwas weg.', { mood: 'think' });
      if (added === b && !asked) {
        asked = true;
        grok.say('Wie viele zusammen?');
        row = solvedChoices(choicesHost, rail, sum, [], (v) => {
          if (v === sum) {
            box.textContent = String(sum);
            box.classList.add('is-filled');
            grok.cheer(`${a} + ${b} = ${sum}. ${numberWord(sum)}!`);
            setTimeout(() => onSolved(), 900);
            return true;
          }
          grok.say('Schau: volle Zehner, dann Einer.', { mood: 'think' });
          return false;
        });
      } else if (added !== b && asked && !row?.classList.contains('is-solved')) {
        asked = false;
        choicesHost.remove();
      }
    },
    onLimit: (why) => { if (why === 'units') grok.say('Voll! Erst <b>Zehner machen</b>.', { mood: 'think' }); },
    onHint: (k) => { if (k === 'ones-to-tens') grok.say('Noch keine 10.', { mood: 'think' }); },
  });
  const stopHint = bld.hint('drag5', 'plus');
  return () => { stopHint(); bld.destroy(); };
}
