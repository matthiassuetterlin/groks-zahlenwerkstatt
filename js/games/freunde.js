// Zehnerfreunde: Was fehlt bis zum Zehner (oder bis 100)? Das passende Stück hineinziehen.
// Selbstkontrolle: Ein zu kurzes Stück lässt Lücken, ein zu langes passt nicht hinein.
import { h, fresh, shuffle, numberWord, rand } from '../util.js';
import { frame, tensField, stick, rodPack, rod, bead } from '../blocks.js';
import { draggable, addDropZone } from '../drag.js';
import { wiggle } from '../fx.js';

export function playFreunde(stage, { level, grok, onSolved }) {
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

  // Darstellung
  const vis = h('div', { class: 'freunde-vis' });
  let holeCells = [];
  let slotEls = [];
  let target; // Ablagefläche
  const stackEl = h('div', { class: 'rod-stack' });
  if (mode === 'hundred') {
    vis.classList.add('is-hundred');
    target = tensField(given / 10);
    slotEls = [...target.children].slice(given / 10);
    vis.append(target);
  } else {
    if (mode === 'next') {
      for (let i = 0; i < Math.floor(given / 10); i++) stackEl.append(rod('ten'));
      vis.append(stackEl);
    }
    target = frame(given % 10 || (mode === 'ten' ? given : 0));
    holeCells = [...target.querySelectorAll('.cell')].filter((c) => !c.classList.contains('on'));
    vis.append(target);
  }
  target.classList.add('drop-target');

  const unit = mode === 'hundred' ? 10 : 1;
  const prompt = h('p', { class: 'prompt' }, `${given} + `, h('span', { class: 'box' }, '?'), ` = ${goal}`);
  const trayEl = h('div', { class: 'friend-tray' });
  stage.append(h('div', { class: 'freunde' }, prompt, vis, h('p', { class: 'hint-line' }, 'Zieh das passende Stück hinein.'), trayEl));

  // Antwortstücke: das richtige und zwei Nachbarn
  const maxK = 9;
  const k = need / unit;
  const cand = shuffle([k - 1, k + 1, k - 2, k + 2].filter((x) => x >= 1 && x <= maxK)).slice(0, 2);
  const pieces = shuffle([k, ...cand]);

  grok.say(mode === 'hundred'
    ? `Hier liegen <b>${given}</b>. Wie viele Zehner fehlen bis <b>100</b>?`
    : `Hier liegen <b>${given}</b>. Was fehlt bis <b>${goal}</b>? Zieh das passende lila Stück hinein.`);
  grok.setHints([
    mode === 'hundred' ? 'Schau auf die leeren Plätze. Jeder ist ein Zehner.' : 'Schau auf die leeren Löcher. Eine Reihe hat 5.',
    mode === 'ten' ? `${given} und wie viel macht 10?` : `Bis zum vollen Zehner: ${goal}.`,
    'Wenn ein Stück nicht passt, siehst du es sofort. Probier ruhig!',
  ]);

  let busy = false;

  function show(kk, cls) {
    if (mode === 'hundred') {
      slotEls.forEach((s, i) => { if (i < kk) { const r = rod('mate'); r.classList.add('pop', cls); s.append(r); } });
    } else {
      holeCells.forEach((c, i) => { if (i < kk) { c.classList.add('on', 'on--mate', 'pop', cls); c.style.setProperty('--i', i); } });
    }
  }
  function unshow(cls) {
    target.querySelectorAll('.' + cls).forEach((el) => {
      if (el.classList.contains('rod')) el.remove();
      else el.classList.remove('on', 'on--mate', 'pop', cls);
    });
  }

  function tryPiece(kk, pieceEl) {
    if (busy) return false;
    busy = true;
    const holes = mode === 'hundred' ? slotEls.length : holeCells.length;
    if (kk === k) {
      show(kk, 'is-final');
      target.classList.add('is-good');
      prompt.querySelector('.box').textContent = String(need);
      prompt.querySelector('.box').classList.add('is-filled');
      grok.cheer(mode === 'hundred'
        ? `Ja! ${given} und ${need} sind 100 – zehn Zehner.`
        : `Ja! ${numberWord(given)} und ${numberWord(need)} sind ${numberWord(goal)}.`);
      trayEl.classList.add('is-done');
      setTimeout(() => {
        if (mode === 'next') target.classList.add('to-rod');
      }, 500);
      setTimeout(onSolved, 1300);
      return true;
    }
    if (kk < holes) {
      show(kk, 'is-try');
      target.classList.add('show-holes');
      grok.say('Da sind noch Lücken. Nimm ein längeres Stück.', { mood: 'think' });
    } else {
      show(holes, 'is-try');
      const over = h('div', { class: 'overflow' }, mode === 'hundred' ? rodPack(kk - holes) : stick(kk - holes, 'mate'));
      vis.append(over);
      setTimeout(() => over.remove(), 1300);
      grok.say('Zu viel – das passt nicht mehr hinein.', { mood: 'think' });
    }
    pieceEl.classList.add('is-tried');
    wiggle(target);
    setTimeout(() => {
      unshow('is-try');
      target.classList.remove('show-holes');
      busy = false;
    }, 1300);
    return false;
  }

  for (const kk of pieces) {
    const vis2 = mode === 'hundred' ? rodPack(kk) : stick(kk, 'mate');
    const el = h('button', { class: 'friend-piece', type: 'button', 'aria-label': `Stück mit ${kk * unit}` }, vis2);
    cleanups.push(draggable(el, {
      payload: { src: 'friend', k: kk },
      onTap: () => tryPiece(kk, el),
    }));
    trayEl.append(el);
  }
  cleanups.push(addDropZone(target, {
    accepts: (p) => p.src === 'friend',
    onDrop: (p) => {
      const el = [...trayEl.children].find((c) => c.firstChild && +c.firstChild.dataset.n === p.k);
      return tryPiece(p.k, el || trayEl);
    },
  }));
  // Etwas großzügiger: auch die ganze Darstellung nimmt Stücke an
  cleanups.push(addDropZone(vis, {
    accepts: (p) => p.src === 'friend',
    onDrop: (p) => {
      const el = [...trayEl.children].find((c) => c.firstChild && +c.firstChild.dataset.n === p.k);
      return tryPiece(p.k, el || trayEl);
    },
  }));

  return () => cleanups.forEach((f) => f());
}
