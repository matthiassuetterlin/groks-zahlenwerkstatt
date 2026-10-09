// Zerlege-Zauber: Eine Zahl in zwei Teile zerlegen (Teil-Ganzes).
// Stufe 1: ALLE Zerlegungen systematisch finden (Tausch zählt einmal). Stufe 2: bis 20.
// Stufe 3: Schüttelbox (ein Teil ist verdeckt). Stufe 4: Blitz-Gruppen nach Gaidoschik.
import { h, fresh, rand, pick, numberWord, options, fitStage } from '../util.js?v=6';
import { bead as beadToken } from '../sizing.js?v=6';
import { bead, frame } from '../blocks.js?v=6';
import { draggable, addDropZone } from '../drag.js?v=6';
import { wiggle, burst, choices } from '../fx.js?v=6';
import { handHint } from '../hint.js?v=6';
import { ICON_WAND, ICON_SEEN_FIVE, ICON_SEEN_DOUBLE, ICON_SEEN_GAP } from '../icons.js?v=6';

const WAND = `<svg viewBox="0 0 64 64" aria-hidden="true">
  <defs><linearGradient id="wg" x1="0" x2="1"><stop offset="0" style="stop-color:var(--grok)"/><stop offset="1" style="stop-color:var(--grok-soft)"/></linearGradient></defs>
  <path d="M12 52 L38 26" style="stroke:url(#wg)" stroke-width="7" stroke-linecap="round"/>
  <path d="M12 52 L17 47" style="stroke:var(--one)" stroke-width="7" stroke-linecap="round"/>
  <path d="M44 8 l3.2 7.4 7.4 3.2 -7.4 3.2 -3.2 7.4 -3.2 -7.4 -7.4 -3.2 7.4 -3.2z" style="fill:var(--one)"/>
  <circle cx="56" cy="34" r="2.6" style="fill:var(--mate)"/><circle cx="28" cy="10" r="2.2" style="fill:var(--ten)"/><circle cx="58" cy="10" r="1.6" style="fill:var(--mate)"/>
</svg>`;

export function playZerlege(stage, ctx) {
  if (ctx.level.mode === 'shake') return shake(stage, ctx);
  if (ctx.level.mode === 'groups') return groups(stage, ctx);
  return chain(stage, ctx);
}

function chain(stage, { level, grok, onSolved, rail }) {
  const cleanups = [];
  const n = fresh(() => rand(level.min, level.max));
  const all = !!level.all;
  const want = all ? Math.floor(n / 2) : 3;   // alle Zerlegungen (ohne 0): 1 + 7, 2 + 6, 3 + 5, 4 + 4
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
  const list = h('div', { class: 'zz-found' + (all ? ' zz-found--all' : ''), dataset: { want } });
  for (let i = 0; i < want; i++) list.append(h('div', { class: 'zz-card' }, h('span', { class: 'zz-card-q' }, '?')));
  const content = h('div', { class: 'zz' }, chainWrap, eq, list);

  stage.append(h('div', { class: 'task' }, h('span', { class: 'task-ico', html: ICON_WAND, 'aria-label': 'Zerlege' }), h('span', { class: 'task-num' }, String(n))));
  // Hochkant: lange Ketten in Zehner-Reihen umbrechen (wie im Zwanzigerfeld) – so bleiben die Perlen groß.
  const sr = stage.getBoundingClientRect();
  // Umbrechen, sobald die Kette in einer Reihe nicht bei voller Perlengröße passt (Größenregel: sizing.js)
  const tb = beadToken();
  const rowW = n * (tb + 4) + (n - 1) * 16 + 32 + tb * .9;
  if (n > 10 && (rowW > sr.width - 24 || sr.width / Math.max(1, sr.height) < 1.3)) bar.classList.add('is-wrap');
  const fs = fitStage(stage, content, { max: 1.7 });

  const wand = h('button', { class: 'wand', type: 'button', 'aria-label': 'Zauberstab', html: WAND });
  rail.append(h('div', { class: 'wand-card' }, wand));

  grok.say(all ? `Finde alle Zerlegungen von ${n}!` : `Zauber die ${n} in zwei Teile – ${want}-mal!`);
  grok.setHints(all ? [
    'Fang vorne an: 1 und der Rest.',
    `1 + ${n - 1}, 2 + ${n - 2} … siehst du das Muster?`,
    '3 + 5 und 5 + 3 zählen nur einmal.',
  ] : [
    'Teil an der Fünfer-Lücke.',
    n > 10 ? 'Probier 10 und den Rest.' : 'Probier 5 und den Rest.',
    '3 + 5 und 5 + 3 zählen nur einmal.',
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
      grok.say(a === b ? 'Die hast du schon!' : 'Tauschaufgabe – hast du schon!', { mood: 'think' });
    } else {
      found.add(key);
      // Systematisch: jede Zerlegung hat ihren festen Platz (1 + 7, 2 + 6, …) – das Muster wird sichtbar.
      const card = all ? list.children[Math.min(a, b) - 1] : list.children[found.size - 1];
      const strip = h('span', { class: 'zz-strip' });
      for (let i = 0; i < n; i++) { const m = bead(i < a ? 'one' : 'mate'); if (i === a) m.classList.add('gap'); strip.append(m); }
      const [x, y] = all ? [Math.min(a, b), Math.max(a, b)] : [a, b];
      strip.replaceChildren();
      for (let i = 0; i < n; i++) { const m = bead(i < x ? 'one' : 'mate'); if (i === x) m.classList.add('gap'); strip.append(m); }
      card.replaceChildren(strip, h('span', { class: 'zz-card-eq' }, h('b', { class: 'pa' }, String(x)), ' + ', h('b', { class: 'pb' }, String(y))));
      card.classList.add('is-on');
      if (found.size >= want) {
        grok.cheer(all ? `Alle ${want} gefunden!` : 'Zauberhaft!');
        list.classList.add('is-complete');
        setTimeout(() => onSolved(n === 10 ? ['bonds10'] : undefined), 1400);
        return;
      }
      grok.cheer(`${a} + ${b}! Noch ${want - found.size}.`);
    }
    resetT = setTimeout(reset, 1500);
  }

  cleanups.push(draggable(wand, { payload: { src: 'wand' }, onTap: () => grok.say('Zieh mich zwischen zwei Perlen!') }));
  cleanups.push(handHint('zerlege', () => wand, () => cuts[Math.floor(cuts.length / 2)]));
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


// ── Schüttelbox: n Perlen, ein Teil verschwindet unter dem Deckel. n = a + ? ──────────
const SHAKE_ICON = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="5" y="8" width="14" height="11" rx="2.5" fill="currentColor" fill-opacity=".16"/><path d="M4 8h16"/><path d="M1.5 11v5M22.5 11v5"/></svg>`;

function shake(stage, { grok, onSolved, rail, actions }) {
  const cleanups = [];
  const n = fresh(() => rand(5, 10));
  const b = rand(1, n - 1), a = n - b;
  const row = h('div', { class: 'shake-row' });
  const beads = [];
  for (let i = 0; i < n; i++) { const el = bead('one'); beads.push(el); row.append(el); }
  const lid = h('div', { class: 'shake-lid', hidden: true, 'aria-label': 'verdeckt' }, h('span', {}, '?'));
  const boxEl = h('div', { class: 'shake-box' }, row, lid);
  const q = h('span', { class: 'box' }, '?');
  const task = h('div', { class: 'task' }, h('span', { class: 'task-num task-num--eq' }, `${n} = `, h('span', { class: 'sh-a' }, '…'), ' + ', q));
  stage.append(task);
  const fs = fitStage(stage, h('div', { class: 'shake-wrap' }, boxEl), { max: 2.4 });
  const shakeBtn = h('button', { class: 'btn btn--soft btn-icon is-pulse', type: 'button', 'aria-label': 'Schütteln', title: 'Schütteln', html: SHAKE_ICON });
  actions.append(shakeBtn);
  const cards = h('div', { class: 'num-cards' });
  rail.append(cards);

  grok.say(`${n} Perlen. Schüttel die Box!`);
  grok.setHints([`Zusammen sind es ${n}.`, `${a} siehst du. Wie viele fehlen bis ${n}?`, n === 10 ? 'Partner zur 10!' : 'Schau auf die Fünf.']);

  let shaken = false, busy = false;
  function doShake() {
    if (shaken) return;
    shaken = true;
    shakeBtn.classList.remove('is-pulse');
    shakeBtn.disabled = true;
    boxEl.classList.add('is-shaking');
    setTimeout(() => {
      boxEl.classList.remove('is-shaking');
      beads.forEach((el, i) => el.classList.toggle('bead--mate', i >= a));
      lid.style.left = (beads[a].offsetLeft - 6) + 'px';
      lid.hidden = false;
      task.querySelector('.sh-a').textContent = String(a);
      grok.say(`${a} siehst du. Wie viele sind versteckt?`);
      const opts = options(b, [b - 1, b + 1, b + 2, b - 2, a], { min: 1, max: n, count: 3 });
      for (const v of opts) {
        const c = h('button', { class: 'num-card', type: 'button', dataset: { v } }, String(v));
        cleanups.push(draggable(c, { payload: { src: 'card', v }, onTap: () => tryV(v, c) }));
        cards.append(c);
      }
      cleanups.push(handHint('schuettel', () => cards.querySelector('.num-card'), () => lid));
    }, 650);
  }
  function tryV(v, el) {
    if (busy || !shaken) return false;
    if (v === b) {
      busy = true;
      q.textContent = String(b); q.classList.add('is-filled');
      lid.classList.add('is-open');
      el?.classList.add('is-used');
      burst(lid, 10);
      grok.cheer(`${n} = ${a} + ${b}!`);
      setTimeout(() => onSolved(n === 10 ? ['bonds10'] : ['kraft5']), 1300);
      return true;
    }
    el?.classList.add('is-tried');
    wiggle(lid);
    grok.say(`${a} + ${v} = ${a + v}. Nicht ${n}.`, { mood: 'think' });
    return false;
  }
  shakeBtn.addEventListener('click', doShake);
  boxEl.addEventListener('click', () => { if (!shaken) doShake(); });
  cleanups.push(addDropZone(lid, { accepts: (p) => p.src === 'card', onDrop: (p) => tryV(p.v, cards.querySelector(`[data-v="${p.v}"]`)) }));
  cleanups.push(handHint('schuettel-box', () => shakeBtn, null));
  return () => { fs.destroy(); cleanups.forEach((f) => f()); };
}

// ── Blitz-Gruppen (Gaidoschik): mit 1 · Hälften · Kraft der Fünf · gleich 10 ──────────
const GROUPS = [
  { key: 'mit1', group: 'neighbors', label: 'mit 1', icon: `<svg class="ico" viewBox="0 0 44 20" aria-hidden="true"><text x="22" y="15.5" text-anchor="middle" font-size="15" font-weight="900" fill="currentColor">±1</text></svg>`,
    make: () => { const n = rand(3, 10); return Math.random() < 0.5 ? { n, a: n - 1 } : { n, a: 1 }; } },
  { key: 'half', group: 'doubles', label: 'Hälften', icon: ICON_SEEN_DOUBLE, make: () => { const k = rand(2, 5); return { n: 2 * k, a: k }; } },
  { key: 'five', group: 'kraft5', label: 'Kraft der Fünf', icon: ICON_SEEN_FIVE, make: () => { const n = rand(6, 10); return Math.random() < 0.6 ? { n, a: 5 } : { n, a: n - 5 }; } },
  { key: 'ten', group: 'bonds10', label: 'gleich 10', icon: ICON_SEEN_GAP, make: () => ({ n: 10, a: rand(1, 9) }) },
];

function groups(stage, { round = 0, grok, onSolved, rail }) {
  const g = GROUPS[round % GROUPS.length];
  const { n, a } = fresh(() => g.make(), [], 10);
  const b = n - a;
  const q = h('span', { class: 'box' }, '?');
  const task = h('div', { class: 'task' },
    h('span', { class: 'group-chip', title: g.label, 'aria-label': g.label, html: g.icon }),
    h('span', { class: 'task-num task-num--eq' }, `${n} = ${a} + `, q));
  stage.append(task);
  const fr = frame(a, { extra: 0 });
  // Erst nur der bekannte Teil – nach einem Fehler zeigen gestrichelte Plätze, wie viele fehlen.
  const showGhosts = () => [...fr.children].forEach((c, i) => { if (i >= a && i < n) c.classList.add('ghost-cell'); });
  const fs = fitStage(stage, h('div', { class: 'blitz-board' }, fr), { max: 2.6 });
  const host = h('div', { class: 'rail-choices' });
  rail.append(host);
  grok.say(pick(['Blitz!', 'Schnell!', 'Weißt du es?']));
  grok.setHints([g.key === 'ten' ? 'Partner zur 10.' : g.key === 'five' ? '5 und …?' : g.key === 'half' ? 'Zwei gleiche Teile.' : 'Eins mehr, eins weniger.', 'Schau aufs Feld.']);
  const t0 = performance.now();
  host.append(choices(options(b, [b - 1, b + 1, b + 2, b - 2], { min: 0, max: 10, count: 3 }), (v) => {
    if (v !== b) { showGhosts(); grok.say(`${a} + ${v} = ${a + v}.`, { mood: 'think' }); return false; }
    q.textContent = String(b); q.classList.add('is-filled');
    [...fr.children].forEach((c, i) => { if (i >= a && i < n) c.classList.add('on', 'on--mate'); });
    const fast = performance.now() - t0 < 4000;
    grok.cheer(fast ? `Blitzschnell! ${n} = ${a} + ${b}.` : `${n} = ${a} + ${b}.`);
    setTimeout(() => onSolved([g.group]), 900);
    return true;
  }));
  return () => fs.destroy();
}
