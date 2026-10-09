// Konzept A · Werkbank – ein Spielzeug-Tisch aus mattem Ton. Keine Web-Navigation:
// Dinge liegen auf dem Tisch, man nimmt Perlen aus einer Schublade und legt sie in Rillen.
import { h, $, $$, Mat, draggable, confetti, grokSvg, router, beadVar, word, sleep, rand, shuffle, fly, union, land } from '../shared/kit.js';
import { I } from '../shared/icons.js';

const app = $('#app');
const portrait = () => innerWidth < innerHeight * 1.05;
const icon = (k) => { const t = document.createElement('template'); t.innerHTML = I[k]; return t.content.firstElementChild; };

// Eine Perlengröße für alle drei Bildschirme dieses Konzepts
beadVar((w, H) => {
  let b;
  if (w >= H * 1.05) b = Math.min((w - 470) / 19.4, (H - 96) / 17.6);
  else b = Math.min((w - 30) / 13.4, (H - 250) / 18.6);
  return Math.max(18, Math.min(46, Math.floor(b)));
});
addEventListener('resize', () => document.body.classList.toggle('is-portrait', portrait()));
document.body.classList.toggle('is-portrait', portrait());

// ---------- Grok steht auf dem Tisch ----------
function grokActor(tips = []) {
  const bubble = h('div', { class: 'a-bubble', role: 'status' });
  const fig = h('button', { class: 'a-grok', type: 'button', 'aria-label': 'Grok – Tipp' }, grokSvg());
  const el = h('div', { class: 'a-grokwrap' }, bubble, fig);
  let t = 0, ti = 0;
  const say = (html, mood = 'talk', hold = 3400) => {
    bubble.innerHTML = html;
    bubble.classList.remove('show'); void bubble.offsetWidth; bubble.classList.add('show');
    fig.classList.remove('is-talk', 'is-happy'); void fig.offsetWidth; fig.classList.add('is-' + mood);
    clearTimeout(t); t = setTimeout(() => { bubble.classList.remove('show'); fig.classList.remove('is-talk', 'is-happy'); }, hold);
  };
  fig.addEventListener('click', () => tips.length && say(tips[ti++ % tips.length], 'talk'));
  return { el, say };
}

const knob = (href, k, label) => h('a', { class: 'a-knob', href, 'aria-label': label }, icon(k));

// Große Ton-Zahlenkacheln (Zehner | Einer), kippen beim Wechsel
function tiles() {
  const mk = (cls) => h('div', { class: 'a-tile ' + cls }, h('span', { class: 'a-tile-face' }, '0'));
  const T = mk('is-ten'), O = mk('is-one');
  const w = h('div', { class: 'a-word' }, 'null');
  const el = h('div', { class: 'a-tiles' }, h('div', { class: 'a-tilepair' }, T, O), w);
  const flip = (tile, d) => {
    const f = tile.firstChild; if (f.textContent === d) return;
    tile.classList.remove('flip'); void tile.offsetWidth; tile.classList.add('flip');
    setTimeout(() => { f.textContent = d; }, 120);
  };
  return { el, set(v) { flip(T, v >= 100 ? '10' : String(Math.floor(v / 10))); flip(O, String(v % 10)); T.classList.toggle('is-zero', v < 10); w.textContent = word(v); } };
}

// ---------- Schublade mit Perlen-Fächern ----------
function drawer(pieces) {
  const comps = pieces.map((p) => h('div', { class: 'a-comp a-comp--' + p.kind }, p.node()));
  const inner = h('div', { class: 'a-drawer-inner' }, comps);
  const handle = h('button', { class: 'a-drawer-handle', type: 'button', 'aria-label': 'Schublade' }, h('i'));
  const el = h('div', { class: 'a-drawer' }, inner, h('div', { class: 'a-drawer-front' }, handle));
  const set = (open) => el.classList.toggle('is-open', open);
  handle.addEventListener('click', () => set(!el.classList.contains('is-open')));
  set(!portrait());
  return { el, comps, set, inner };
}
const rodNode = (c = 't') => h('div', { class: 'rod' }, Array.from({ length: 10 }, () => h('i', { class: 'bd ' + c })));
const fiveNode = (c = '') => h('div', { class: 'five' }, Array.from({ length: 5 }, () => h('i', { class: 'bd ' + c })));
const oneNode = (c = '') => h('i', { class: 'bd ' + c });

// ================= HOME =================
function home() {
  const grok = grokActor(['Tipp auf die Werkstatt!', 'Oder spiel Verliebte Zahlen.']);
  const mini = h('div', { class: 'a-mini' },
    h('div', { class: 'a-mini-tens' }, [0, 1, 2, 3].map((i) => h('div', { class: 'a-groove' }, i < 3 ? rodNode() : null))),
    h('div', { class: 'a-mini-ones' }, Array.from({ length: 10 }, (_, i) => h('span', { class: 'a-well' }, i < 7 ? oneNode() : null))));
  const objWerk = h('a', { class: 'a-obj a-obj--werk', href: '#/werk', 'aria-label': 'Werkstatt' }, mini, h('span', { class: 'a-plate' }, icon('wrench'), 'Werkstatt'));
  const love = h('div', { class: 'a-lovestack' },
    h('div', { class: 'a-tile is-one big' }, h('span', { class: 'a-tile-face' }, '7')),
    h('div', { class: 'a-heart' }, icon('heart')),
    h('div', { class: 'a-tile is-pink big' }, h('span', { class: 'a-tile-face' }, '3')));
  const objLove = h('a', { class: 'a-obj a-obj--love', href: '#/spiel', 'aria-label': 'Verliebte Zahlen' }, love, h('span', { class: 'a-plate' }, icon('heart'), 'Verliebte Zahlen'));
  const brand = h('div', { class: 'a-brand' }, h('b', {}, 'Grok’s'), ' Zahlenwerkstatt');
  const scr = h('section', { class: 'a-screen a-home' }, brand, h('div', { class: 'a-home-table' }, objWerk, grok.el, objLove));
  setTimeout(() => grok.say('Hallo! Was bauen wir heute?', 'happy', 4200), 450);
  return scr;
}

// ================= WERKSTATT =================
function werk() {
  const mat = new Mat();
  const grok = grokActor(['Zieh eine Stange in eine Rille.', 'Zehn Einer? Drück den Zehner-Knopf.', 'Stange auf die Einer = aufbrechen.']);
  const tl = tiles();
  const grooves = Array.from({ length: 10 }, () => h('div', { class: 'a-groove' }));
  const wells = Array.from({ length: 20 }, () => h('span', { class: 'a-well' }));
  const frames = [0, 1].map((f) => h('div', { class: 'a-frame' }, wells.slice(f * 10, f * 10 + 10)));
  const tensZ = h('div', { class: 'a-tens' }, grooves);
  const onesZ = h('div', { class: 'a-ones' }, frames);
  const board = h('div', { class: 'a-board' }, tensZ, h('div', { class: 'a-right' }, onesZ, tl.el));
  const dr = drawer([{ kind: 'ten', node: () => rodNode() }, { kind: 'five', node: () => fiveNode() }, { kind: 'one', node: () => oneNode() }]);
  const bBundle = h('button', { class: 'a-tool a-tool--bundle', type: 'button', 'aria-label': 'Zehner machen' }, icon('bundle'));
  const bSplit = h('button', { class: 'a-tool', type: 'button', 'aria-label': 'Zehner aufbrechen' }, icon('hammer'));
  const bClear = h('button', { class: 'a-tool', type: 'button', 'aria-label': 'Leeren' }, icon('broom'));
  const bDrawer = h('button', { class: 'a-tool a-tool--drawer', type: 'button', 'aria-label': 'Schublade' }, icon('drawer'));
  const dock = h('nav', { class: 'a-dock' }, knob('#/home', 'home', 'Zum Tisch'), h('span', { class: 'a-dock-sep' }), bDrawer, bBundle, bSplit, bClear);
  const scr = h('section', { class: 'a-screen a-werk' }, h('div', { class: 'a-stage' }, board, grok.el), dr.el, dock);

  let said = {};
  const once = (k, txt, mood) => { if (!said[k]) { said[k] = 1; grok.say(txt, mood); } };
  function render(arrive = null) {
    grooves.forEach((g, i) => {
      const has = i < mat.tens, rod = g.firstChild;
      if (has && !rod) { const r = rodNode(); if (arrive === 'tens' && i === mat.tens - 1) r.classList.add('arriving'); g.append(r); makeMatRod(r); }
      if (!has && rod) rod.remove();
    });
    wells.forEach((w, i) => {
      const has = i < mat.ones, b = w.firstChild;
      if (has && !b) { const n = oneNode(); w.append(n); makeMatOne(n); }
      if (!has && b) b.remove();
    });
    frames.forEach((f, i) => f.classList.toggle('is-full', mat.ones >= (i + 1) * 10));
    tl.set(mat.value);
    bBundle.classList.toggle('is-ready', mat.canBundle);
    bBundle.disabled = !mat.canBundle; bSplit.disabled = !mat.canSplit; bClear.disabled = mat.value === 0;
    if (mat.canBundle) once('b', '10 Einer! Mach einen <b>Zehner</b>.');
    if (mat.value === 100) once('h', '<b>Hundert!</b> Alles voll.', 'happy');
  }
  const newOnes = (k) => wells.slice(mat.ones - k, mat.ones);
  function apply(p) {
    if (p.kind === 'ten' && p.from === 'drawer') { if (!mat.addTens()) return null; render('tens'); return grooves[mat.tens - 1].firstChild; }
    if ((p.kind === 'five' || p.kind === 'one') && p.from === 'drawer') {
      if (!mat.addOnes(p.k)) { onesZ.classList.add('kz-shake'); setTimeout(() => onesZ.classList.remove('kz-shake'), 700); grok.say(mat.ones >= 10 ? 'Voll! Erst einen <b>Zehner</b> machen.' : 'Passt nicht mehr.'); return null; }
      render(); const els = newOnes(p.k).map((w) => w.firstChild); els.forEach((e) => e.classList.add('arriving')); return union(els);
    }
    return null;
  }
  const zones = () => [
    { el: tensZ, accepts: (p) => (p.kind === 'ten' && p.from === 'drawer') || p.kind === 'bundle', drop: (p) => p.kind === 'bundle' ? doBundle(true) : apply(p) },
    { el: onesZ, accepts: (p) => p.from === 'drawer' ? p.kind !== 'ten' : p.kind === 'ten' && p.from === 'mat', drop: (p) => p.from === 'mat' ? doSplit(true) : apply(p) },
    { el: dr.el, accepts: (p) => p.from === 'mat', drop: (p) => { p.kind === 'ten' ? mat.removeTens() : mat.removeOnes(1); render(); return dr.comps[p.kind === 'ten' ? 0 : 2]; } },
  ];
  // Teile aus der Schublade: ziehen ODER antippen
  [['ten', 10], ['five', 5], ['one', 1]].forEach(([kind, k], i) => {
    const comp = dr.comps[i], piece = comp.firstChild;
    draggable(piece, {
      payload: { kind, k, from: 'drawer' }, zones,
      ghost: () => kind === 'ten' ? rodNode() : kind === 'five' ? fiveNode() : oneNode(),
      onStart: () => { if (portrait()) dr.set(false); },
      onTap: async () => { const t = apply({ kind, k, from: 'drawer' }); if (t) await fly(kind === 'ten' ? rodNode() : kind === 'five' ? fiveNode() : oneNode(), piece, t); },
    });
  });
  function makeMatRod(r) { draggable(r, { payload: () => ({ kind: 'ten', from: 'mat' }), zones, ghost: () => rodNode(), onStart: () => { r.style.opacity = '.25'; if (portrait()) dr.set(true); }, onEnd: () => { r.style.opacity = ''; } }); }
  function makeMatOne(b) { draggable(b, { payload: () => ({ kind: 'one', from: 'mat' }), zones, ghost: () => oneNode(), onStart: () => { b.style.opacity = '.25'; if (portrait()) dr.set(true); }, onEnd: () => { b.style.opacity = ''; } }); }
  frames.forEach((f, i) => draggable(f, { payload: () => i === 0 && mat.canBundle ? { kind: 'bundle', from: 'mat' } : null, zones, ghost: () => h('div', { class: 'a-frame is-ghost' }, Array.from({ length: 10 }, () => h('span', { class: 'a-well' }, oneNode()))) }));

  async function doBundle(fromDrag = false) {
    if (!mat.canBundle) return null;
    const src = frames[0];
    const g = rodNode();
    mat.bundle(); render('tens');
    const target = grooves[mat.tens - 1].firstChild;
    if (!fromDrag) await fly(g, src, target, 520);
    grok.say('Super – ein <b>Zehner</b>!', 'happy', 2400);
    const r = target.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, ['#3E9C83', '#E8A23A', '#D1A5B8'], 12);
    return fromDrag ? target : null;
  }
  async function doSplit(fromDrag = false) {
    if (!mat.canSplit) { grok.say('Erst Platz bei den Einern machen.'); return null; }
    const src = grooves[mat.tens - 1].firstChild;
    mat.split(); render();
    const els = newOnes(10).map((w) => w.firstChild);
    els.forEach((e) => e.classList.add('arriving'));
    if (!fromDrag) { await fly(rodNode(), src || tensZ, union(els), 520); }
    grok.say('Aufgebrochen: <b>10 Einer</b>.', 'talk', 2400);
    return fromDrag ? union(els) : null;
  }
  bBundle.addEventListener('click', () => doBundle());
  bSplit.addEventListener('click', () => doSplit());
  bClear.addEventListener('click', () => { mat.clear(); said = {}; render(); });
  bDrawer.addEventListener('click', () => dr.set(!dr.el.classList.contains('is-open')));
  render();
  setTimeout(() => grok.say(portrait() ? 'Öffne die <b>Schublade</b>!' : 'Nimm Perlen aus der <b>Schublade</b>!', 'talk', 3800), 500);
  return scr;
}

// ================= SPIEL: Verliebte Zahlen =================
function spiel() {
  const grok = grokActor(['Fülle die Rille bis 10.', 'Ein Fünfer spart Zeit!']);
  const ROUNDS = 5;
  const nums = shuffle([1, 2, 3, 4, 6, 7, 8, 9]).slice(0, ROUNDS);
  let round = 0, n = 0, add = 0, busy = false;
  const pegs = Array.from({ length: ROUNDS }, () => h('i', { class: 'a-peg' }));
  const tN = h('div', { class: 'a-tile is-one big' }, h('span', { class: 'a-tile-face' }, ''));
  const tP = h('div', { class: 'a-tile is-pink big is-q' }, h('span', { class: 'a-tile-face' }, '?'));
  const heart = h('div', { class: 'a-heart' }, icon('heart'));
  const wells = Array.from({ length: 10 }, () => h('span', { class: 'a-well' }));
  const groove = h('div', { class: 'a-tenrow' }, wells);
  const dr = drawer([{ kind: 'five', node: () => fiveNode('p') }, { kind: 'one', node: () => oneNode('p') }]);
  const dock = h('nav', { class: 'a-dock' }, knob('#/home', 'home', 'Zum Tisch'), h('span', { class: 'a-dock-sep' }), h('div', { class: 'a-pegs', 'aria-label': 'Fortschritt' }, pegs));
  const scr = h('section', { class: 'a-screen a-spiel' },
    h('div', { class: 'a-stage a-stage--game' }, h('div', { class: 'a-lovestack a-lovestack--game' }, tN, heart, tP), h('div', { class: 'a-tenboard' }, groove), dr.el, grok.el),
    dock);
  dr.set(true);

  function paint(arr = 0) {
    wells.forEach((w, i) => {
      const want = i < n ? 'n' : i < n + add ? 'p' : '';
      const b = w.firstChild;
      if (!want) { b?.remove(); return; }
      if (b && b.dataset.k === want) return;
      b?.remove();
      const nb = oneNode(want === 'p' ? 'p' : ''); nb.dataset.k = want; w.append(nb);
      if (want === 'p') draggable(nb, { payload: { kind: 'one', from: 'mat' }, zones, ghost: () => oneNode('p'), onStart: () => (nb.style.opacity = '.25'), onEnd: () => (nb.style.opacity = '') });
    });
  }
  const zones = () => [
    { el: groove, accepts: (p) => p.from === 'drawer' && !busy, drop: (p) => put(p.k) },
    { el: dr.el, accepts: (p) => p.from === 'mat' && !busy, drop: () => { add--; paint(); return dr.comps[1]; } },
  ];
  function put(k) {
    if (n + add + k > 10) { groove.classList.add('kz-shake'); setTimeout(() => groove.classList.remove('kz-shake'), 700); grok.say('Zu viel – nimm weniger.'); return null; }
    add += k; paint();
    const els = wells.slice(n + add - k, n + add).map((w) => w.firstChild); els.forEach((e) => e.classList.add('arriving'));
    if (n + add === 10) setTimeout(solved, 320);
    return union(els);
  }
  [['five', 5], ['one', 1]].forEach(([kind, k], i) => {
    const piece = dr.comps[i].firstChild;
    draggable(piece, { payload: { kind, k, from: 'drawer' }, zones, ghost: () => kind === 'five' ? fiveNode('p') : oneNode('p'),
      onTap: async () => { if (busy) return; const t = put(k); if (t) await fly(kind === 'five' ? fiveNode('p') : oneNode('p'), piece, t); } });
  });
  async function solved() {
    busy = true;
    tP.classList.remove('is-q'); tP.classList.add('flip'); setTimeout(() => (tP.firstChild.textContent = String(10 - n)), 120);
    heart.classList.add('beat'); groove.classList.add('is-full');
    const r = heart.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, ['#E8A23A', '#E07A8A', '#3E9C83', '#F3D36B'], 22);
    grok.say(`<b>${n}</b> und <b>${10 - n}</b> sind verliebt!`, 'happy', 2600);
    pegs[round].classList.add('on');
    await sleep(2300);
    round++;
    if (round >= ROUNDS) return finish();
    scr.classList.add('next'); await sleep(260); start(); scr.classList.remove('next');
  }
  function start() {
    n = nums[round]; add = 0; busy = false;
    tN.firstChild.textContent = String(n); tP.firstChild.textContent = '?'; tP.classList.add('is-q'); tP.classList.remove('flip');
    heart.classList.remove('beat'); groove.classList.remove('is-full');
    wells.forEach((w) => w.firstChild?.remove()); paint();
  }
  function finish() {
    const ov = h('div', { class: 'a-done' }, h('div', { class: 'a-done-card' },
      h('div', { class: 'a-done-stars' }, Array.from({ length: ROUNDS }, () => h('span', {}, icon('star')))),
      h('div', { class: 'a-done-row' }, knob('#/home', 'home', 'Zum Tisch'), h('button', { class: 'a-knob a-knob--go', type: 'button', 'aria-label': 'Nochmal', onclick: () => go('spiel', true) }, icon('again')))));
    scr.append(ov); grok.say('Alle gefunden!', 'happy', 4000);
  }
  start();
  setTimeout(() => grok.say('Mach die <b>10</b> voll!', 'talk', 3000), 500);
  return scr;
}

// ---------- Router mit weichen Übergängen ----------
const screens = { home, werk, spiel };
let current = null;
function go(k, force = false) {
  if (k === current && !force) return;
  current = k;
  const swap = () => { app.replaceChildren(screens[k]()); };
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(swap); else swap();
}
router(screens, (k) => go(k));
