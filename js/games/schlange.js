// Schlangen-Zehner (Montessori-Schlangenspiel, in unserer weichen Palette):
// Eine bunte Perlenschlange. Die goldene Zehner-Schablone wird an die Stangen gelegt:
// sind es zusammen 10, wird daraus ein goldener Zehner. Was übersteht, wird grau und kommt wieder nach vorn.
// Am Ende prüft sich die Schlange selbst: die bunten Stangen liegen genau unter jedem goldenen Zehner.
import { h, rand, shuffle, numberWord, options, swapDigits, fitStage } from '../util.js?v=8';
import { sbar, speakCards } from '../blocks.js?v=8';
import { draggable, addDropZone } from '../drag.js?v=8';
import { Chain, centers, reducedMotion } from '../beadfx.js?v=8';
import { glide } from '../glide.js?v=8';
import { choices, wiggle, burst } from '../fx.js?v=8';
import { handHint } from '../hint.js?v=8';

const PAIRS = [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]];

function makeSnake(mode) {
  if (mode === 'pairs') {
    const ps = shuffle(PAIRS.slice()).slice(0, 3);
    const bars = shuffle(ps.flat());
    return bars;
  }
  for (let t = 0; t < 200; t++) {
    const len = rand(5, 6);
    const bars = Array.from({ length: len }, () => rand(2, 9));
    const sum = bars.reduce((a, b) => a + b, 0);
    if (sum < 23 || sum > 39 || sum % 10 === 0) continue;
    // mindestens ein Überstand (Split) soll vorkommen
    let s = 0, splits = 0;
    for (const k of bars) { if (s + k > 10) splits++; s = (s + k) % 10; }
    if (splits >= 1) return bars;
  }
  return [7, 5, 8, 6, 4];
}

// Prüf-Streifen: genau so viele bunte Perlen wie im goldenen Zehner – Perle für Perle darunter.
function segStrip(host, segs) {
  let first = true;
  for (const sg of segs) {
    for (let i = 0; i < sg.k; i++) {
      host.append(h('span', { class: `bead bead--s${sg.tone}` + (i === 0 && !first ? ' seg-start' : '') }));
    }
    first = false;
  }
}

const later = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));

export function playSchlange(stage, { level, grok, onSolved, rail }) {
  const mode = level.mode || 'pairs';
  const ordered = mode !== 'pairs';           // Montessori: immer die vorderste Stange
  const bars = makeSnake(mode);
  const total = bars.reduce((a, b) => a + b, 0);
  const tensN = Math.floor(total / 10), restN = total % 10;
  const cleanups = [];
  let dead = false, busy = false;

  // ── Aufbau ──
  const snakeEl = h('div', { class: 'snake' });
  const head = h('div', { class: 'snake-head' });            // hierhin kommen graue Reste (vorne)
  if (ordered) snakeEl.append(head);
  const items = [];   // { k, tone, el, gone }
  bars.forEach((k) => {
    const el = sbar(k);
    el.classList.add('snake-bar');
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    el.setAttribute('aria-label', `${k}er-Stange`);
    snakeEl.append(el);
    items.push({ k, tone: k, el, gone: false });
  });

  const wells = [];
  const tmpl = h('div', { class: 'snake-tmpl', 'aria-label': 'Zehner-Schablone' });
  for (let i = 0; i < 10; i++) { const w = h('span', { class: 'twell' }); wells.push(w); tmpl.append(w); }
  const bench = h('div', { class: 'snake-bench' }, tmpl);

  const out = h('div', { class: 'snake-out' });
  const tenSlots = [];
  for (let i = 0; i < tensN; i++) {
    const rodEl = h('div', { class: 'snake-gold' });
    for (let j = 0; j < 10; j++) rodEl.append(h('span', { class: 'bead bead--gold' }));
    const segs = h('div', { class: 'snake-segs' });
    const ok = h('span', { class: 'snake-ok', 'aria-hidden': 'true' }, '✓');
    const slot = h('div', { class: 'snake-ten' }, rodEl, segs, ok);
    tenSlots.push({ slot, rodEl, segs, ok });
    out.append(slot);
  }
  let restSlot = null;
  if (restN) {
    restSlot = h('div', { class: 'snake-ten snake-ten--rest' }, h('div', { class: 'snake-restbar' }), h('div', { class: 'snake-segs' }), h('span', { class: 'snake-ok', 'aria-hidden': 'true' }, '✓'));
    out.append(restSlot);
  }

  const game = h('div', { class: 'snake-game' + (ordered ? ' is-ordered' : '') }, snakeEl, bench, out);
  const sr = stage.getBoundingClientRect();
  if (sr.width / Math.max(1, sr.height) < 1.15) game.classList.add('is-narrow');
  const fs = fitStage(stage, game, { max: 1.5 });

  const host = h('div', { class: 'rail-choices' });
  rail.append(h('div', { class: 'rule-card rule-card--snake', 'aria-label': 'Zusammen 10 wird ein goldener Zehner' },
    sbar(7), h('span', { class: 'rule-plus' }, '+'), sbar(3), h('span', { class: 'rule-arrow' }, '→'), (() => { const g = h('div', { class: 'snake-gold snake-gold--mini' }); for (let j = 0; j < 10; j++) g.append(h('span', { class: 'bead bead--gold' })); return g; })()));

  grok.say(mode === 'pairs' ? 'Leg zwei Stangen in die Schablone – zusammen 10!' : 'Leg die vorderste Stange in die Schablone!');
  grok.setHints(mode === 'pairs'
    ? ['Such den Partner zur 10.', '7 und 3, 6 und 4 …', 'Zu lang? Dann passt sie nicht.']
    : ['Immer die vorderste Stange.', 'Was übersteht, wird grau und kommt nach vorn.', 'Jede volle Schablone = 1 Zehner.']);

  // ── Zustand ──
  let tmplSum = 0;
  let tmplSegs = [];      // { k, tone }
  let tenRows = [];       // fertige Zehner: [{k,tone}]
  const front = () => items.find((it) => !it.gone);
  function refreshFront() {
    items.forEach((it) => it.el.classList.remove('is-front'));
    if (ordered) front()?.el.classList.add('is-front');
  }
  refreshFront();

  // ── Stange in die Schablone ──
  async function take(it, chain = null) {
    if (busy || dead || it.gone) return false;
    if (ordered && it !== front()) { wiggle(it.el); grok.say('Erst die vorderste!', { mood: 'think' }); return false; }
    const k = it.k;
    if (mode === 'pairs' && tmplSum > 0 && tmplSum + k !== 10) {
      wiggle(it.el);
      grok.say(tmplSum + k > 10 ? 'Zu lang! Such den Partner.' : `Zusammen ${tmplSum + k} – nicht 10. Such den Partner!`, { mood: 'think' });
      return false;
    }
    busy = true;
    const fit = Math.min(k, 10 - tmplSum), rest = k - fit;
    const beads = [...it.el.children];
    const targets = [];
    for (let i = 0; i < fit; i++) {
      const b = h('span', { class: `bead bead--s${it.tone}` });
      wells[tmplSum + i].append(b);
      targets.push(b);
    }
    let restIt = null;
    if (rest) {
      const el = sbar(rest, { tone: 'grey' });
      el.classList.add('snake-bar', 'is-rest');
      el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', `graue ${rest}er-Stange`);
      head.prepend(el);
      restIt = { k: rest, tone: 'grey', el, gone: false };
      bindBar(restIt);
    }
    it.gone = true;
    it.el.classList.add('is-gone');
    tmplSegs.push({ k: fit, tone: it.tone });
    tmplSum += fit;

    await new Promise((res) => {
      let left = rest ? 2 : 1;
      const done = () => { if (--left <= 0) res(); };
      const restTargets = restIt ? [...restIt.el.children] : [];
      if (chain) {
        targets.forEach((t) => { t.style.visibility = 'hidden'; });
        restTargets.forEach((t) => { t.style.visibility = 'hidden'; });
        const all = [...targets, ...restTargets];
        chain.land(centers(all), { onBead: (i) => { all[i].style.visibility = ''; }, onDone: () => { left = 1; done(); } });
      } else {
        glide(beads.slice(0, fit), targets, `s${it.tone}`, { onDone: done });
        if (rest) glide(beads.slice(fit), restTargets, `s${it.tone}`, { kindTo: 'grey', onDone: done });
      }
    });
    if (it.el.parentNode === head) { it.el.remove(); items.splice(items.indexOf(it), 1); }
    if (restIt) {
      items.unshift(restIt);
      grok.say(`${fit} passen, ${rest} ${rest === 1 ? 'bleibt' : 'bleiben'} übrig – grau, nach vorn.`, { mood: 'happy' });
    }
    if (tmplSum === 10) await completeTen();
    refreshFront();
    busy = false;
    if (!items.some((x) => !x.gone)) await finish();
    return true;
  }

  async function completeTen() {
    tmpl.classList.add('is-full');
    const tb = wells.map((w) => w.firstChild);
    tb.forEach((b, i) => setTimeout(() => { b.className = 'bead bead--gold'; }, reducedMotion() ? 0 : i * 40));
    await later(650);
    const slot = tenSlots[tenRows.length];
    tenRows.push(tmplSegs);
    burst(tmpl, 10);
    grok.cheer(tenRows.length === 1 ? 'Gold! Ein Zehner.' : `${tenRows.length} Zehner!`);
    await new Promise((res) => {
      glide(tb, [...slot.rodEl.children], 'gold', { duration: 620, onDone: res });
      if (reducedMotion()) res();
    });
    slot.slot.classList.add('is-filled');
    // Prüf-Stangen schon bereitlegen (sichtbar erst beim Selbst-Check)
    segStrip(slot.segs, tmplSegs);
    wells.forEach((w) => w.replaceChildren());
    tmpl.classList.remove('is-full');
    tmplSum = 0; tmplSegs = [];
  }

  async function finish() {
    busy = true;
    // Rest: was in der Schablone liegt, wird grau
    if (tmplSum > 0 && restSlot) {
      const tb = wells.map((w) => w.firstChild).filter(Boolean);
      const bar = restSlot.querySelector('.snake-restbar');
      const restBar = sbar(tmplSum, { tone: 'grey' });
      bar.append(restBar);
      await new Promise((res) => { glide(tb, [...restBar.children], 'grey', { onDone: res }); if (reducedMotion()) res(); });
      segStrip(restSlot.querySelector('.snake-segs'), tmplSegs);
      restSlot.classList.add('is-filled');
      wells.forEach((w) => w.replaceChildren());
      tmplSum = 0;
    }
    bench.classList.add('is-done');
    await later(400);
    // Selbst-Check: die bunten Stangen legen sich unter jeden Zehner – gleich lang = stimmt.
    grok.say('Die Schlange prüft sich selbst …');
    game.classList.add('is-checking');
    const rows = [...out.children];
    for (const r of rows) {
      r.classList.add('is-checked');
      await later(520);
    }
    await later(300);
    if (dead) return;
    if (mode !== 'number') {
      grok.cheer(restN ? `Stimmt! ${tensN} Zehner und ${restN} Rest.` : `Stimmt! ${tensN} goldene Zehner.`);
      setTimeout(() => onSolved(mode === 'pairs' ? ['bonds10'] : ['tens']), 1500);
      return;
    }
    grok.say(`${tensN} Zehner und ${restN}. Wie viel ist die Schlange?`);
    const sw = swapDigits(total);
    host.append(choices(options(total, [sw, total + 10, total - 10, total + 1].filter((x) => x != null), { min: 10, max: 99, count: 3 }), (v) => {
      if (v !== total) { grok.say(v === sw ? 'Vertauscht! Erst die Zehner.' : `Schau: ${tensN} goldene Zehner.`, { mood: 'think' }); return false; }
      out.append(speakCards(total, { cls: 'speak--small snake-speak' }));
      grok.cheer(`${tensN * 10} und ${restN} – ${numberWord(total)}!`);
      setTimeout(() => onSolved(['tens', 'place']), 1600);
      return true;
    }));
    rail.append(host);
  }

  function bindBar(it) {
    cleanups.push(draggable(it.el, {
      payload: () => (busy || it.gone ? null : { src: 'snake', it }),
      chain: () => new Chain(`s${it.tone}`, centers([...it.el.children])),
      onStart: () => it.el.classList.add('lifted'),
      onEnd: () => it.el.classList.remove('lifted'),
      onTap: () => take(it),
    }));
    it.el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); take(it); } });
  }
  items.forEach(bindBar);
  cleanups.push(addDropZone(bench, {
    accepts: (p) => p.src === 'snake',
    onDrop: (p, pt, ch) => {
      if (busy || p.it.gone) return false;
      const ok = (!ordered || p.it === front()) && !(mode === 'pairs' && tmplSum > 0 && tmplSum + p.it.k !== 10);
      if (!ok) { take(p.it); return false; }   // take() erklärt, warum nicht
      take(p.it, ch);
      return true;
    },
  }));
  cleanups.push(handHint('schlange', () => (ordered ? front()?.el : items[0].el), () => tmpl));
  return () => { dead = true; fs.destroy(); cleanups.forEach((f) => f()); };
}
