// Doppel & Nachbar: Eine Reihe wird gespiegelt (Doppel), daraus werden Nachbaraufgaben abgeleitet (6 + 7 = 6 + 6 + 1).
import { h, rand, fresh, numberWord, options, fitStage } from '../util.js?v=6';
import { speakCards } from '../blocks.js?v=6';
import { draggable, addDropZone } from '../drag.js?v=6';
import { Chain, centers } from '../beadfx.js?v=6';
import { glide } from '../glide.js?v=6';
import { choices } from '../fx.js?v=6';
import { handHint } from '../hint.js?v=6';
import { ICON_MIRROR } from '../icons.js?v=6';

function row(n, kind = 'one') {
  const el = h('div', { class: 'mrow' });
  for (let i = 0; i < 10; i++) {
    const c = h('span', { class: 'cell' });
    if (i < n) c.classList.add('on', `on--${kind}`);
    el.append(c);
  }
  return el;
}

export function playDoppel(stage, { level, grok, onSolved, rail, actions }) {
  const mode = level.mode || 'double';
  const a = fresh(() => rand(level.min ?? 1, level.max ?? 5));
  const d = mode === 'neighbor' ? (a >= 9 ? -1 : a <= 2 ? 1 : (Math.random() < 0.65 ? 1 : -1)) : 0;
  const b = a + d;
  const sum = a + b;

  const box = h('span', { class: 'box' }, '?');
  const fact = h('span', { class: 'dfact', hidden: true }, `${a} + ${a} = ${2 * a}`);
  const task = h('div', { class: 'task task--stack' }, h('span', { class: 'task-num task-num--eq' }, `${a} + ${b} = `, box), fact);
  stage.append(task);

  const top = row(a);
  const bot = row(0);
  const line = h('div', { class: 'mirror-line', 'aria-hidden': 'true' });
  const board = h('div', { class: 'mirror-board' }, top, line, bot);
  const fs = fitStage(stage, board, { max: 2.6 });

  const mirrorBtn = h('button', { class: 'btn btn--soft btn-icon btn-mirror is-pulse', type: 'button', 'aria-label': 'Spiegeln', title: 'Spiegeln', html: ICON_MIRROR });
  actions.append(mirrorBtn);
  const choicesHost = h('div', { class: 'rail-choices' });
  const tray = h('div', { class: 'tray', hidden: true, 'aria-label': 'Eine Perle dazu' }, h('span', { class: 'bead bead--mate' }));
  rail.append(tray, choicesHost);

  grok.say(mode === 'neighbor' ? `${a} + ${b}? Spiegel erst die ${a}!` : 'Spiegel die Reihe!');
  grok.setHints(mode === 'neighbor'
    ? [`${a} + ${a} weißt du schon?`, d > 0 ? 'Dann noch 1 mehr.' : 'Dann 1 weniger.', `${b} ist der Nachbar von ${a}.`]
    : ['Tipp auf den Spiegel.', 'Zwei gleiche Reihen = Doppel.', 'Schau auf die Fünfer.']);

  let mirrored = false, adjusted = mode !== 'neighbor', dead = false;
  const cleanups = [];
  const cellsOn = (r) => [...r.children].filter((c) => c.classList.contains('on'));

  function askSum() {
    grok.say('Wie viele zusammen?');
    const opts = options(sum, [sum - 1, sum + 1, sum - 2, sum + 2, sum + 10, sum - 10], { min: 2, max: 20, count: 3 });
    choicesHost.replaceChildren(choices(opts, (v) => {
      if (v !== sum) { grok.say(sum >= 10 ? 'Schau: 5 und 5 sind 10.' : 'Schau auf die Fünfer.', { mood: 'think' }); return false; }
      box.textContent = String(sum);
      box.classList.add('is-filled');
      task.append(speakCards(sum, { cls: 'speak--small' }));
      grok.cheer(mode === 'neighbor' ? `${a} + ${a} = ${2 * a}, ${d > 0 ? 'eins mehr' : 'eins weniger'}: ${sum}!` : `Doppel ${a}: ${numberWord(sum)}!`);
      setTimeout(() => onSolved(mode === 'neighbor' ? ['neighbors', 'doubles'] : ['doubles']), 1000);
      return true;
    }));
  }

  function mirror(chain = null) {
    if (mirrored || dead) return false;
    mirrored = true;
    mirrorBtn.classList.remove('is-pulse');
    mirrorBtn.disabled = true;
    const targets = [...bot.children].slice(0, a);
    const done = () => {
      if (dead) return;
      board.classList.add('is-mirrored');
      if (mode === 'neighbor') {
        fact.hidden = false;
        if (d > 0) { tray.hidden = false; grok.say(`Doppel ${a} = ${2 * a}. Noch 1 dazu!`); setupTray(); }
        else { grok.say(`Doppel ${a} = ${2 * a}. Tipp eine weg!`); bot.classList.add('can-take'); }
      } else askSum();
    };
    targets.forEach((c) => c.classList.add('on', 'on--one'));
    if (chain) {
      targets.forEach((c) => { c.style.visibility = 'hidden'; });
      chain.land(centers(targets), { onBead: (i) => { targets[i].style.visibility = ''; }, onDone: done });
    } else glide(cellsOn(top), targets, 'one', { hideFrom: false, duration: 640, onDone: done });
    return true;
  }

  function addOne(chain = null) {
    if (adjusted || !mirrored) return false;
    adjusted = true;
    const c = bot.children[a];
    c.classList.add('on', 'on--mate');
    tray.hidden = true;
    if (chain) { c.style.visibility = 'hidden'; chain.land(centers([c]), { onDone: () => { c.style.visibility = ''; askSum(); } }); }
    else glide(tray.children, [c], 'mate', { onDone: askSum });
    return true;
  }

  function setupTray() {
    const bead = tray.firstChild;
    cleanups.push(draggable(bead, {
      payload: { kind: 'plus1' },
      chain: () => new Chain('mate', centers([bead])),
      onStart: () => { bead.style.visibility = 'hidden'; },
      onEnd: () => { bead.style.visibility = ''; },
      onTap: () => addOne(),
    }));
    cleanups.push(addDropZone(bot, { accepts: (p) => p.kind === 'plus1', onDrop: (p, pt, ch) => addOne(ch) }));
    cleanups.push(handHint('doppel-plus1', () => bead, () => bot));
  }

  // −1: die letzte Perle unten antippen → sie wird grau (weggenommen)
  bot.addEventListener('click', () => {
    if (adjusted || !mirrored || d >= 0) return;
    adjusted = true;
    bot.classList.remove('can-take');
    const c = bot.children[a - 1];
    c.classList.remove('on--one');
    c.classList.add('on--grey');
    askSum();
  });

  // Spiegeln: Knopf, Tippen auf die obere Reihe oder die Reihe nach unten ziehen
  mirrorBtn.addEventListener('click', () => mirror());
  cleanups.push(draggable(top, {
    payload: { kind: 'row' },
    chain: () => new Chain('one', centers(cellsOn(top))),
    onTap: () => mirror(),
  }));
  cleanups.push(addDropZone(bot, { accepts: (p) => p.kind === 'row', onDrop: (p, pt, ch) => mirror(ch) }));
  cleanups.push(handHint('doppel-mirror', () => top, () => bot));

  return () => { dead = true; cleanups.forEach((f) => f()); fs.destroy(); };
}
