// Seguin-Brett (Teen-/Ten-Board): „zwanzig und drei“ → die 3 rutscht auf die Null der 20 → 23 → erst dann „dreiundzwanzig“.
// Gegen Zahlendreher: Landet die Ziffer in der falschen Reihe (32 statt 23), bietet Grok das Tauschen an.
import { h, rand, fresh, numberWord, fitStage } from '../util.js?v=7';
import { quantity, digits } from '../blocks.js?v=7';
import { draggable, addDropZone } from '../drag.js?v=7';
import { burst, wiggle, setShown } from '../fx.js?v=7';
import { flip } from '../glide.js?v=7';
import { handHint } from '../hint.js?v=7';
import { ICON_SWAP } from '../icons.js?v=7';

export function playTeen(stage, { level, round = 0, grok, onSolved, rail, actions }) {
  const teen = round < 2;
  const n = fresh(() => (teen ? rand(11, 19) : rand(2, 9) * 10 + rand(1, 9)));
  const t = Math.floor(n / 10), u = n % 10;
  const cleanups = [];

  const said = h('div', { class: 'teen-said' },
    h('span', { class: 'teen-said-t' }, numberWord(t * 10)), h('span', { class: 'teen-said-und' }, ' und '), h('span', { class: 'teen-said-u' }, numberWord(u)));
  const word = h('div', { class: 'teen-word is-off', 'aria-hidden': 'true' }, numberWord(n));
  const left = h('div', { class: 'teen-task' }, quantity(n), said, word);

  const rows = [];
  const boardEl = h('div', { class: 'seguin' });
  for (let r = 1; r <= 9; r++) {
    const zero = h('span', { class: 'seg-zero' }, '0');
    const row = h('div', { class: 'seg-row', dataset: { r }, role: 'button', tabindex: '0', 'aria-label': `${r * 10}` },
      h('span', { class: 'seg-ten' }, String(r)), zero);
    rows.push({ r, row, zero });
    boardEl.append(row);
  }
  const wrap = h('div', { class: 'teen-wrap' }, left, boardEl);
  const fs = fitStage(stage, wrap, { max: 1.6 });

  const tiles = h('div', { class: 'num-cards num-cards--digits' });
  let picked = null;
  for (let d = 1; d <= 9; d++) {
    const c = h('button', { class: 'num-card', type: 'button', dataset: { v: d } }, String(d));
    cleanups.push(draggable(c, {
      payload: { src: 'digit', v: d },
      onTap: () => { picked = d; tiles.querySelectorAll('.num-card').forEach((x) => x.classList.toggle('is-picked', x === c)); grok.say('Jetzt tipp die Reihe.'); },
    }));
    tiles.append(c);
  }
  rail.append(tiles);
  const swapBtn = h('button', { class: 'btn btn--soft btn-icon btn-swap is-pulse is-off', type: 'button', disabled: true, 'aria-label': 'Tauschen', title: 'Tauschen', html: ICON_SWAP });
  actions.append(swapBtn);

  grok.say(`${numberWord(t * 10)} und ${numberWord(u)}. Schieb die ${u} auf die ${t * 10}!`);
  grok.setHints([`Erst die ${t * 10}: such die Reihe.`, `Dann die ${u} auf die Null.`, 'Die Zehner stehen vorne!']);

  let placed = null, done = false, tile = null;
  function place(r, d) {
    if (done) return false;
    const target = rows[r - 1];
    if (!tile) tile = h('span', { class: 'seg-tile' });
    tile.textContent = String(d);
    const move = () => { target.zero.append(tile); rows.forEach((x) => x.row.classList.toggle('is-set', x === target)); };
    if (tile.isConnected) flip(tile, move); else move();
    placed = { r, d };
    const v = r * 10 + d;
    setShown(swapBtn, false);
    if (v === n) { win(); return true; }
    if (r === u && d === t) {
      grok.say(`Das ist <b>${v}</b> – ${numberWord(v)}. Vertauscht? Tipp ⇄`, { mood: 'think' });
      setShown(swapBtn, true);
      return true;
    }
    wiggle(target.row);
    grok.say(`Das ist ${v}. Wir brauchen ${numberWord(t * 10)} und ${numberWord(u)}.`, { mood: 'think' });
    return true;
  }
  function win() {
    done = true;
    rows[t - 1].row.classList.add('is-good');
    tiles.querySelectorAll('.num-card').forEach((x) => x.classList.remove('is-picked'));
    burst(rows[t - 1].row, 10);
    // erst die Ziffern, dann (verzögert) das Zahlwort
    said.classList.add('is-done');
    setShown(word, true);
    word.prepend(digits(n, 'teen-digits'));
    grok.cheer(`${t * 10} und ${u} – man sagt <b>${numberWord(n)}</b>.`);
    setTimeout(() => onSolved(['place']), 1500);
  }
  swapBtn.addEventListener('click', () => {
    if (!placed || done) return;
    // Zahlendreher tauschen: Die Ziffer wandert in die richtige Reihe
    const { r, d } = placed;
    place(d, r);
  });

  for (const { r, row } of rows) {
    cleanups.push(addDropZone(row, { accepts: (p) => p.src === 'digit', onDrop: (p) => place(r, p.v) }));
    row.addEventListener('click', () => {
      if (picked == null) { grok.say('Nimm erst eine Ziffer.'); return; }
      place(r, picked);
    });
  }
  cleanups.push(handHint('seguin', () => tiles.children[u - 1], () => rows[t - 1].row));
  return () => { fs.destroy(); cleanups.forEach((f) => f()); };
}
