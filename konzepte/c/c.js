// Konzept C · Studio – ruhig, luftig, wenige Elemente. Riesige Zahl als Held, Werkzeuge in einem
// Bottom-Sheet, Gesten statt Knöpfe: Einer nach oben wischen = Zehner machen, Stange lange drücken = aufbrechen.
import { h, $, $$, Mat, draggable, confetti, grokSvg, beadVar, word, sleep, rand, shuffle, fly, union, longPress, reduced } from '../shared/kit.js';
import { I } from '../shared/icons.js';

const app = $('#app');
const portrait = () => innerWidth < innerHeight * 1.05;
const icon = (k) => { const t = document.createElement('template'); t.innerHTML = I[k]; return t.content.firstElementChild; };
beadVar((w, H) => w >= H * 1.05 ? Math.max(20, Math.min(42, Math.min((w * .58 - 80) / 12.6, (H - 190) / 17.6))) : Math.max(18, Math.min(42, Math.min((w - 40) / 12.6, (H - 372) / 18))));
const syncP = () => document.body.classList.toggle('is-portrait', portrait()); syncP(); addEventListener('resize', syncP);

// Grok als stiller Begleiter: ein Glas-Chip, der kurz eine Nachricht aufklappt
function grokChip() {
  const msg = h('span', { class: 'c-chip-msg' });
  const el = h('button', { class: 'c-chip', type: 'button', 'aria-label': 'Grok' }, h('span', { class: 'c-chip-face' }, grokSvg()), msg);
  let t;
  return { el, say(txt, mood = 'talk', ms = 2800) { msg.innerHTML = txt; el.classList.add('open'); el.classList.remove('is-happy', 'is-talk'); void el.offsetWidth; el.classList.add('is-' + mood); clearTimeout(t); t = setTimeout(() => el.classList.remove('open', 'is-happy', 'is-talk'), ms); } };
}
const back = () => h('a', { class: 'c-back', href: '#/home', 'aria-label': 'Zurück' }, icon('back'));
const rod = () => h('div', { class: 'rod' }, Array.from({ length: 10 }, () => h('i', { class: 'bd t' })));
const five = () => h('div', { class: 'five' }, Array.from({ length: 5 }, () => h('i', { class: 'bd' })));
const one = () => h('i', { class: 'bd' });

// Riesige Ziffern, die wie ein Zählwerk rollen
function odometer() {
  const col = (cls) => h('span', { class: 'c-odo-col ' + cls }, h('span', { class: 'c-odo-strip' }, Array.from({ length: 10 }, (_, i) => h('span', {}, String(i)))));
  const hund = h('span', { class: 'c-odo-h' }, '1');
  const T = col('is-t'), O = col('is-o');
  const el = h('div', { class: 'c-odo', 'aria-live': 'polite' }, hund, T, O);
  return { el, set(v) { el.classList.toggle('is-100', v >= 100); el.classList.toggle('is-small', v < 10); T.firstChild.style.transform = `translateY(${-(Math.floor(v / 10) % 10)}em)`; O.firstChild.style.transform = `translateY(${-(v % 10)}em)`; el.setAttribute('aria-label', String(v)); } };
}

// ================= HOME =================
function home() {
  const chip = grokChip();
  const card = (href, cls, hero, vis, title) => h('a', { class: 'c-card ' + cls, href }, h('div', { class: 'c-card-hero' }, hero), h('div', { class: 'c-card-vis' }, vis), h('div', { class: 'c-card-foot' }, h('span', { class: 'c-card-title' }, title), h('span', { class: 'c-play' }, icon('play'))));
  const visW = h('div', { class: 'c-vis-stack' }, rod(), rod(), rod(), rod(), h('div', { class: 'c-vis-ones' }, five(), one(), one()));
  const visL = h('div', { class: 'c-vis-split' }, h('div', { class: 'rod c-splitrod', style: { '--cut': 7 } }, Array.from({ length: 10 }, (_, i) => h('i', { class: 'bd ' + (i < 7 ? '' : 't') }))));
  const scr = h('section', { class: 'c-screen c-home' },
    h('header', { class: 'c-top' }, h('div', { class: 'c-mark' }, 'Zahlenwerkstatt'), chip.el),
    h('div', { class: 'c-cards' },
      card('#/werk', 'c-card--werk', h('span', { class: 'c-hero-n' }, h('b', { class: 't' }, '4'), h('b', { class: 'o' }, '7')), visW, 'Werkstatt'),
      card('#/spiel', 'c-card--love', h('span', { class: 'c-hero-n' }, h('b', { class: 'o' }, '7'), h('i', {}, '+'), h('b', { class: 't' }, '3')), visL, 'Verliebte Zahlen')));
  setTimeout(() => chip.say('Wähl eine Karte.', 'happy', 3200), 700);
  return scr;
}

// ================= WERKSTATT =================
function werk() {
  const mat = new Mat();
  const chip = grokChip();
  const odo = odometer();
  const wordEl = h('div', { class: 'c-word' }, 'null');
  const lanes = Array.from({ length: 10 }, () => h('div', { class: 'c-lane' }));
  const wells = Array.from({ length: 20 }, () => h('span', { class: 'c-well' }));
  const frames = [0, 1].map((f) => h('div', { class: 'c-frame' }, wells.slice(f * 10, f * 10 + 10)));
  const swipeHint = h('div', { class: 'c-swipe' }, icon('swipeUp'));
  const tensZ = h('div', { class: 'c-tens' }, lanes);
  const onesZ = h('div', { class: 'c-ones' }, frames, swipeHint);
  const plate = h('div', { class: 'c-plate' }, tensZ, onesZ);
  // Bottom-Sheet: Teile + (aufgeklappt) Werkzeuge
  const pieces = [['ten', rod], ['five', five], ['one', one]].map(([k, mk]) => h('div', { class: 'c-piece c-piece--' + k }, mk()));
  const grab = h('button', { class: 'c-grab', type: 'button', 'aria-label': 'Werkzeuge' }, h('i'));
  const tools = h('div', { class: 'c-tools' },
    h('button', { class: 'c-tool', type: 'button', onclick: () => { mat.clear(); render(); sheet.classList.remove('open'); } }, icon('broom'), h('span', {}, 'Leeren')),
    h('button', { class: 'c-tool', type: 'button', onclick: () => { sheet.classList.remove('open'); demo(); } }, icon('swipeUp'), h('span', {}, 'Gesten')));
  const sheet = h('div', { class: 'c-sheet' }, grab, h('div', { class: 'c-pieces' }, pieces), tools);
  grab.addEventListener('click', () => sheet.classList.toggle('open'));
  const scr = h('section', { class: 'c-screen c-werk' }, h('header', { class: 'c-top' }, back(), chip.el), h('div', { class: 'c-werk-main' }, h('div', { class: 'c-numcol' }, odo.el, wordEl), plate), sheet);

  function render(arr) {
    lanes.forEach((l, i) => { const has = i < mat.tens; if (has && !l.firstChild) { const r = rod(); if (arr === 'tens' && i === mat.tens - 1) r.classList.add('arriving'); l.append(r); matRod(r); } if (!has && l.firstChild) l.firstChild.remove(); });
    wells.forEach((w, i) => { const has = i < mat.ones; if (has && !w.firstChild) { const b = one(); w.append(b); matOne(b); } if (!has && w.firstChild) w.firstChild.remove(); });
    odo.set(mat.value); wordEl.textContent = word(mat.value);
    onesZ.classList.toggle('can-bundle', mat.canBundle);
    plate.classList.toggle('is-empty', mat.value === 0);
    if (mat.canBundle && !said.b) { said.b = 1; chip.say('Wisch die Einer <b>nach oben</b>.', 'talk', 3400); }
  }
  const said = {};
  const newOnes = (k) => wells.slice(mat.ones - k, mat.ones).map((w) => w.firstChild);
  function add(kind) {
    if (kind === 'ten') { if (!mat.addTens()) return null; render('tens'); return lanes[mat.tens - 1].firstChild; }
    const k = kind === 'five' ? 5 : 1;
    if (!mat.addOnes(k)) { onesZ.classList.add('kz-shake'); setTimeout(() => onesZ.classList.remove('kz-shake'), 700); chip.say(mat.ones >= 10 ? 'Erst nach oben wischen.' : 'Kein Platz.'); return null; }
    render(); const els = newOnes(k); els.forEach((e) => e.classList.add('arriving')); return union(els);
  }
  async function bundle() {
    if (!mat.canBundle) return null;
    frames[0].classList.add('lift');
    await sleep(reduced() ? 0 : 200);
    frames[0].classList.remove('lift');
    mat.bundle(); render('tens');
    const t = lanes[mat.tens - 1].firstChild;
    chip.say('Zehn Einer = <b>ein Zehner</b>.', 'happy', 2400);
    return t;
  }
  const zones = () => [
    { el: tensZ, accepts: (p) => (p.from === 'sheet' && p.kind === 'ten') || (p.from === 'mat' && p.kind === 'one' && mat.canBundle), drop: (p) => p.from === 'mat' ? bundle() : add('ten') },
    { el: onesZ, accepts: (p) => p.from === 'sheet' && p.kind !== 'ten', drop: (p) => add(p.kind) },
    { el: sheet, accepts: (p) => p.from === 'mat', drop: (p) => { p.kind === 'ten' ? mat.removeTens() : mat.removeOnes(1); render(); return pieces[p.kind === 'ten' ? 0 : 2].firstChild; } },
  ];
  pieces.forEach((pc, i) => { const kind = ['ten', 'five', 'one'][i], mk = [rod, five, one][i]; draggable(pc.firstChild, { payload: { kind, from: 'sheet' }, zones, ghost: mk, onStart: () => sheet.classList.remove('open'), onTap: async () => { const t = add(kind); if (t) await fly(mk(), pc.firstChild, t, 420); } }); });
  // Einer: nach oben wischen (wenn ≥ 10) = bündeln; zum Sheet ziehen = wegräumen
  const tenGhost = () => h('div', { class: 'c-frame c-frame--ghost' }, Array.from({ length: 10 }, () => h('span', { class: 'c-well' }, one())));
  function matOne(b) { draggable(b, { payload: () => ({ kind: 'one', from: 'mat' }), zones, ghost: () => mat.canBundle ? tenGhost() : one(), onStart: () => { (mat.canBundle ? frames[0] : b).style.opacity = '.15'; }, onEnd: () => { frames[0].style.opacity = ''; b.style.opacity = ''; } }); }
  // Stange: lange drücken = aufbrechen (mit Licht, das über die Stange läuft); zum Sheet ziehen = wegräumen
  function matRod(r) {
    draggable(r, { payload: { kind: 'ten', from: 'mat' }, zones, ghost: rod, onStart: () => { r.classList.remove('charging'); r.style.opacity = '.15'; }, onEnd: () => (r.style.opacity = '') });
    longPress(r, 650, () => split(r), { onStart: () => r.classList.add('charging'), onCancel: () => r.classList.remove('charging') });
  }
  async function split(r) {
    r.classList.remove('charging');
    if (r.style.opacity) return;  // wird gerade gezogen
    if (!mat.canSplit) { chip.say('Zu viele Einer.'); return; }
    r.classList.add('crack');
    await sleep(reduced() ? 0 : 240);
    mat.split(); render();
    const els = newOnes(10); els.forEach((e, i) => { e.classList.add('scatter'); e.style.setProperty('--i', i); });
    setTimeout(() => els.forEach((e) => e.classList.remove('scatter')), 700);
    chip.say('Aufgebrochen: <b>10 Einer</b>.', 'talk', 2200);
  }
  async function demo() {
    chip.say('Einer nach oben = <b>Zehner</b>. Stange lange drücken = <b>aufbrechen</b>.', 'talk', 4600);
    swipeHint.classList.add('demo'); setTimeout(() => swipeHint.classList.remove('demo'), 2600);
  }
  render();
  setTimeout(() => chip.say('Zieh Perlen aus dem Fach.', 'talk', 3000), 700);
  return scr;
}

// ================= SPIEL: Verliebte Zahlen – teile die Zehn =================
function spiel() {
  const chip = grokChip();
  const ROUNDS = 5;
  const segs = Array.from({ length: ROUNDS }, () => h('i'));
  const nums = shuffle([1, 2, 3, 4, 6, 7, 8, 9]).slice(0, ROUNDS);
  let round = 0, n = 0, cut = 5, done = false;
  const nL = h('b', { class: 'o' }), nR = h('b', { class: 't is-q' }, '?');
  const hero = h('div', { class: 'c-eq' }, nL, h('i', {}, '+'), nR, h('span', { class: 'c-eq-ten' }, '= 10'));
  const beads = Array.from({ length: 10 }, () => h('i', { class: 'bd' }));
  const theRod = h('div', { class: 'rod c-bigrod' }, beads);
  const knife = h('div', { class: 'c-knife', role: 'slider', 'aria-label': 'Teilen', tabindex: '0' }, h('i'));
  const track = h('div', { class: 'c-track' }, theRod, knife);
  const scr = h('section', { class: 'c-screen c-spiel' }, h('header', { class: 'c-top' }, back(), h('div', { class: 'c-segs' }, segs), chip.el), h('div', { class: 'c-spiel-main' }, hero, track, h('div', { class: 'c-gesture' }, icon('arrow'), h('span', {}, 'schieben'))));
  // Position der Lücke nach Perle k (0..10) in px relativ zur Stange
  const gapX = (k) => {
    const rr = theRod.getBoundingClientRect();
    if (k <= 0) return beads[0].getBoundingClientRect().left - rr.left - 6;
    if (k >= 10) return beads[9].getBoundingClientRect().right - rr.left + 6;
    const a = beads[k - 1].getBoundingClientRect(), b = beads[k].getBoundingClientRect();
    return (a.right + b.left) / 2 - rr.left;
  };
  function paint() { beads.forEach((b, i) => b.classList.toggle('t', i >= cut)); knife.style.transform = `translateX(${gapX(cut)}px)`; knife.setAttribute('aria-valuenow', cut); }
  // Messer ziehen: rastet an den Lücken ein
  knife.addEventListener('pointerdown', (e) => {
    if (done) return;
    e.preventDefault(); knife.setPointerCapture(e.pointerId); knife.classList.add('drag');
    const rr = theRod.getBoundingClientRect();
    const move = (ev) => { const x = ev.clientX - rr.left; let best = 0, bd = 1e9; for (let k = 0; k <= 10; k++) { const d = Math.abs(gapX(k) - x); if (d < bd) { bd = d; best = k; } } if (best !== cut) { cut = best; paint(); } };
    const up = () => { knife.classList.remove('drag'); knife.removeEventListener('pointermove', move); knife.removeEventListener('pointerup', up); knife.removeEventListener('pointercancel', up); check(); };
    knife.addEventListener('pointermove', move); knife.addEventListener('pointerup', up); knife.addEventListener('pointercancel', up);
  });
  knife.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' && cut > 0) { cut--; paint(); } if (e.key === 'ArrowRight' && cut < 10) { cut++; paint(); } if (e.key === 'Enter') check(); });
  theRod.addEventListener('click', (e) => { if (done) return; const rr = theRod.getBoundingClientRect(); const x = e.clientX - rr.left; let best = 0, bd = 1e9; for (let k = 0; k <= 10; k++) { const d = Math.abs(gapX(k) - x); if (d < bd) { bd = d; best = k; } } cut = best; paint(); check(); });
  async function check() {
    if (done) return;
    if (cut !== n) { if (cut !== 0 && cut !== 10) { track.classList.add('kz-shake'); setTimeout(() => track.classList.remove('kz-shake'), 700); chip.say(`Links sollen <b>${n}</b> sein. Schau auf die Fünf.`, 'talk', 2600); } return; }
    done = true;
    nR.classList.remove('is-q'); nR.classList.add('reveal'); nR.textContent = String(10 - n);
    track.classList.add('is-good'); hero.classList.add('is-good');
    const r = knife.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top, ['#E8846B', '#2C7A7B', '#F2C46D', '#9DB6D8'], 16);
    chip.say(`<b>${n}</b> und <b>${10 - n}</b>.`, 'happy', 2000);
    segs[round].classList.add('on');
    await sleep(1900);
    round++;
    if (round >= ROUNDS) return finish();
    scr.classList.add('out'); await sleep(320); start(); scr.classList.remove('out');
  }
  function start() {
    n = nums[round]; cut = n < 5 ? 8 : 2; done = false;
    nL.textContent = String(n); nR.textContent = '?'; nR.classList.add('is-q'); nR.classList.remove('reveal');
    track.classList.remove('is-good'); hero.classList.remove('is-good');
    requestAnimationFrame(paint);
  }
  function finish() {
    scr.append(h('div', { class: 'c-fin' }, h('div', { class: 'c-fin-n' }, '5', h('small', {}, '/5')), h('div', { class: 'c-fin-row' }, h('a', { class: 'c-pill', href: '#/home' }, icon('home')), h('button', { class: 'c-pill c-pill--go', type: 'button', onclick: () => go('spiel', true) }, icon('again')))));
  }
  addEventListener('resize', () => requestAnimationFrame(paint));
  start();
  setTimeout(() => chip.say('Teile die Zehn.', 'talk', 2600), 700);
  return scr;
}

// ---------- Router: ruhige Überblendung ----------
const screens = { home, werk, spiel };
let current = null;
function go(k, force = false) {
  if (k === current && !force) return;
  current = k;
  const swap = () => app.replaceChildren(screens[k]());
  if (document.startViewTransition && !reduced()) { const t = document.startViewTransition(swap); [t.ready, t.finished, t.updateCallbackDone].forEach((x) => x.catch(() => {})); } else swap();
}
const fromHash = () => { const k = location.hash.replace(/^#\/?/, '') || 'home'; go(screens[k] ? k : 'home'); };
addEventListener('hashchange', fromHash); fromHash();
