// Verliebte Zahlen: Welche Zahl ist in die andere verliebt? Zusammen ergeben sie 10 (oder den nächsten Zehner, oder 100).
// Selbstkontrolle: Ein zu kurzes Stück lässt Lücken, ein zu langes steht über – und fliegt zurück.
import { h, fresh, shuffle, numberWord, rand, fitStage } from '../util.js?v=5';
import { frame, tensField, rodPack, rod, bead } from '../blocks.js?v=5';
import { draggable, addDropZone } from '../drag.js?v=5';
import { Chain, centers } from '../beadfx.js?v=5';
import { wiggle, burst } from '../fx.js?v=5';
import { handHint } from '../hint.js?v=5';

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21Z"/></svg>';

export function playVerliebt(stage, { level, grok, onSolved, rail }) {
  const cleanups = [];
  const mode = level.mode; // 'ten' | 'next' | 'hundred'
  let given, need, goal;
  if (mode === 'ten') {
    given = fresh(() => rand(1, 9));
    need = 10 - given; goal = 10;
  } else if (mode === 'next') {
    given = fresh(() => rand(1, 8) * 10 + rand(1, 9));
    need = 10 - (given % 10); goal = given + need;
  } else {
    given = fresh(() => rand(1, 9) * 10);
    need = 100 - given; goal = 100;
  }

  // ---------- Darstellung ----------
  const vis = h('div', { class: 'love-vis' + (mode === 'hundred' ? ' is-hundred' : '') });
  let holeCells = [];
  let slotEls = [];
  let target;
  if (mode === 'hundred') {
    target = tensField(given / 10);
    slotEls = [...target.children].slice(given / 10);
    vis.append(target);
  } else {
    if (mode === 'next') {
      const stack = h('div', { class: 'rod-stack' });
      for (let i = 0; i < Math.floor(given / 10); i++) stack.append(rod('ten'));
      vis.append(stack);
    }
    target = frame(given % 10 || given);
    holeCells = [...target.querySelectorAll('.cell')].filter((c) => !c.classList.contains('on'));
    vis.append(target);
  }
  target.classList.add('drop-target');

  const unit = mode === 'hundred' ? 10 : 1;
  const box = h('span', { class: 'box' }, '?');
  stage.append(h('div', { class: 'task' },
    h('span', { class: 'task-num task-num--eq' }, `${given} `, h('span', { class: 'heart', html: HEART }), ' ', box, ` = ${goal}`),
  ));
  const fs = fitStage(stage, vis, { max: mode === 'hundred' ? 1.5 : 2.2 });

  // Antwortstücke: das richtige und zwei Nachbarn
  const k = need / unit;
  const cand = shuffle([k - 1, k + 1, k - 2, k + 2].filter((x) => x >= 1 && x <= 9)).slice(0, 2);
  const pieces = shuffle([k, ...cand]);
  const tray = h('div', { class: 'love-tray', dataset: { mode } });
  rail.append(tray);

  grok.say(mode === 'hundred'
    ? `Wer ist in die <b>${given}</b> verliebt? Zusammen <b>100</b>.`
    : `Wer ist in die <b>${mode === 'ten' ? given : given % 10}</b> verliebt?`);
  grok.setHints([
    mode === 'hundred' ? 'Jeder leere Platz ist ein Zehner.' : 'Schau auf die leeren Löcher.',
    mode === 'ten' ? `${given} und wie viel sind 10?` : mode === 'next' ? `Bis ${goal}.` : `${given / 10} Zehner und wie viele bis 10 Zehner?`,
    'Probier ruhig – du siehst sofort, ob es passt.',
  ]);

  let busy = false;
  let solved = false;
  const cellPx = () => (holeCells[0] || target).getBoundingClientRect().width || 30;

  function win() {
    solved = true;
    target.classList.add('is-good');
    box.textContent = String(need);
    box.classList.add('is-filled');
    burst(target, 10);
    tray.classList.add('is-done');
    grok.cheer(mode === 'hundred'
      ? `${given} ♥ ${need} = 100!`
      : `${numberWord(mode === 'ten' ? given : given % 10)} ♥ ${numberWord(need)}!`);
    setTimeout(onSolved, 1400);
  }

  // Perlen-Stücke (bis 10 / nächster Zehner): fliegen als Kette
  function tryBeads(kk, piece, chain) {
    if (busy || solved) return false;
    busy = true;
    const beads = [...piece.querySelectorAll('.bead')];
    const holes = holeCells.length;
    piece.classList.add('is-lifted');
    const markMate = (c, cls) => c.classList.add('on', 'on--mate', cls);
    if (kk === k) {
      chain.land(centers(holeCells.slice(0, kk)), {
        onBead: (i) => markMate(holeCells[i], 'is-final'),
        onDone: () => { busy = false; win(); },
      });
      return true;
    }
    // Zu kurz: landen, Lücken leuchten, dann zurückfliegen. Zu lang: Überstand neben dem Feld, dann zurück.
    const fr = target.getBoundingClientRect();
    const s = cellPx();
    const targets = holeCells.slice(0, Math.min(kk, holes)).map((c) => centers([c])[0]);
    for (let j = 0; targets.length < kk; j++) targets.push({ x: fr.right + s * 0.9 + j * s * 1.1, y: fr.top + fr.height / 2, w: s });
    const park = (p) => {
      const b = bead('mate');
      b.classList.add('fx-bead', 'is-parked');
      b.style.transform = `translate3d(${p.x - 20}px, ${p.y - 20}px, 0) scale(${p.w / 40})`;
      extraLayer.append(b);
    };
    chain.land(targets, {
      onBead: (i) => { if (i < holes) markMate(holeCells[i], 'is-try'); else park(targets[i]); },
      onDone: () => {
        if (kk < holes) {
          target.classList.add('show-holes');
          grok.say('Noch Lücken! Nimm ein längeres.', { mood: 'think' });
        } else {
          grok.say('Zu lang! Nimm ein kürzeres.', { mood: 'think' });
        }
        wiggle(target);
        setTimeout(() => {
          const tried = holeCells.filter((c) => c.classList.contains('is-try'));
          const extra = targets.slice(tried.length);
          const back = new Chain('mate', [...centers(tried), ...extra], { size: s });
          tried.forEach((c) => c.classList.remove('on', 'on--mate', 'is-try'));
          extraLayer.replaceChildren();
          target.classList.remove('show-holes');
          back.land(centers(beads), {
            stagger: 18, duration: 420,
            onDone: () => { piece.classList.remove('is-lifted'); piece.classList.add('is-tried'); busy = false; },
          });
        }, 1150);
      },
    });
    return true;
  }
  const extraLayer = h('div', { class: 'fx-layer fx-layer--parked', 'aria-hidden': 'true' });
  document.body.append(extraLayer);
  cleanups.push(() => extraLayer.remove());

  // Hunderter: ganze Zehnerstangen-Päckchen
  function tryRods(kk, piece) {
    if (busy || solved) return false;
    const holes = slotEls.length;
    const show = (n, cls) => slotEls.forEach((s, i) => { if (i < n) { const r = rod('mate'); r.classList.add('pop', cls); r.style.setProperty('--i', i); s.querySelector('.slot-track').append(r); s.classList.add('has-rod'); } });
    if (kk === k) { show(kk, 'is-final'); piece.classList.add('is-lifted'); win(); return true; }
    busy = true;
    show(Math.min(kk, holes), 'is-try');
    grok.say(kk < holes ? 'Noch Plätze frei! Nimm mehr.' : 'Zu viel – mehr als 100!', { mood: 'think' });
    wiggle(target);
    piece.classList.add('is-tried');
    setTimeout(() => { target.querySelectorAll('.is-try').forEach((el) => { el.closest('.rod-slot')?.classList.remove('has-rod'); el.remove(); }); busy = false; }, 1300);
    return false;
  }

  for (const kk of pieces) {
    const label = `Stück mit ${kk * unit}`;
    if (mode === 'hundred') {
      const el = h('button', { class: 'love-piece love-piece--rods', type: 'button', 'aria-label': label }, rodPack(kk));
      cleanups.push(draggable(el, { payload: { src: 'love', k: kk, el }, onTap: () => tryRods(kk, el) }));
      tray.append(el);
      continue;
    }
    const visEl = h('span', { class: 'love-beads' });
    for (let i = 0; i < kk; i++) visEl.append(bead('mate'));
    const el = h('button', { class: 'love-piece', type: 'button', 'aria-label': label }, visEl);
    const mk = () => new Chain('mate', centers(visEl.children), { size: cellPx() });
    cleanups.push(draggable(el, {
      payload: { src: 'love', k: kk, el },
      chain: () => (busy || solved ? null : mk()),
      onStart: () => el.classList.add('is-lifted'),
      onEnd: (p, ok) => { if (!ok) el.classList.remove('is-lifted'); },
      onTap: () => { if (!busy && !solved) tryBeads(kk, el, mk()); },
    }));
    tray.append(el);
  }

  const onDrop = (p, pt, chain) => {
    if (mode === 'hundred') return tryRods(p.k, p.el);
    if (!chain) return false;
    return tryBeads(p.k, p.el, chain);
  };
  cleanups.push(addDropZone(target, { accepts: (p) => p.src === 'love', onDrop }));
  cleanups.push(addDropZone(fs.box, { accepts: (p) => p.src === 'love', onDrop, outline: false }));

  cleanups.push(handHint('verliebt', () => tray.querySelector('.love-piece'), () => target));
  return () => { fs.destroy(); cleanups.forEach((f) => f()); };
}
