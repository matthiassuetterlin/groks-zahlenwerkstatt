// Konzept B · Zahlen-Reise – eine Spielwelt: Startseite ist eine Karte mit Stationen,
// Spiele laufen bildschirmfüllend mit minimalem HUD, Fortschritt sind sammelbare Edelsteine.
import { h, $, $$, Mat, draggable, confetti, grokSvg, beadVar, sleep, rand, shuffle, fly, union, glide } from '../shared/kit.js';
import { I } from '../shared/icons.js';

const app = $('#app');
const portrait = () => innerWidth < innerHeight * 1.05;
const icon = (k) => { const t = document.createElement('template'); t.innerHTML = I[k]; return t.content.firstElementChild; };
beadVar((w, H) => w >= H * 1.05 ? Math.max(20, Math.min(44, Math.min((H - 300) / 12, (w - 200) / 22))) : Math.max(18, Math.min(44, Math.min((w - 28) / 14.2, (H - 330) / 15.2))));
const syncP = () => document.body.classList.toggle('is-portrait', portrait()); syncP(); addEventListener('resize', syncP);

// ---------- Fortschritt (lokal, nur für den Prototyp) ----------
const KEY = 'kz-b';
const st = Object.assign({ gems: 7, done: [1, 2], at: 3 }, JSON.parse(localStorage.getItem(KEY) || '{}'));
const save = () => localStorage.setItem(KEY, JSON.stringify(st));

const STATIONS = [
  { id: 1, kind: 'see', icon: 'eye', col: '#3FA7A0' },
  { id: 2, kind: 'see', icon: 'eye', col: '#F07A5F' },
  { id: 3, kind: 'see', icon: 'eye', col: '#F2B544' },
  { id: 4, kind: 'build', icon: 'wrench', col: '#5B6FB5' },
  { id: 5, kind: 'see', icon: 'eye', col: '#3FA7A0' },
  { id: 6, kind: 'build', icon: 'wrench', col: '#F07A5F' },
  { id: 7, kind: 'see', icon: 'star', col: '#F2B544' },
];

// ---------- gemeinsame Teile ----------
const jellyBtn = (cls, kids, attrs = {}) => h('button', { class: 'b-jelly ' + cls, type: 'button', ...attrs }, kids);
function hud({ close = true, mid = null } = {}) {
  const gemN = h('b', {}, String(st.gems));
  const gem = h('div', { class: 'b-gemcount' }, h('span', { class: 'b-gemicon' }, icon('gem')), gemN);
  const el = h('header', { class: 'b-hud' },
    close ? jellyBtn('b-x', icon('close'), { 'aria-label': 'Zur Karte', onclick: () => go('home') }) : h('div', { class: 'b-brand' }, h('span', { class: 'b-brand-grok' }, grokSvg()), h('span', {}, 'Zahlen', h('i', {}, '-'), 'Reise')),
    h('div', { class: 'b-hud-mid' }, mid), gem);
  return { el, gem, add(k = 1) { st.gems += k; save(); gemN.textContent = String(st.gems); gem.classList.remove('bump'); void gem.offsetWidth; gem.classList.add('bump'); } };
}
// Edelstein fliegt vom Ort zur Anzeige
async function gemFly(fromEl, H) {
  const g = h('div', { class: 'b-flygem' }, icon('gem'));
  await fly(g, fromEl, H.gem.querySelector('.b-gemicon'), 700);
  H.add();
}
function grokCorner() {
  const bub = h('div', { class: 'b-bubble' });
  const fig = h('button', { class: 'b-grok', type: 'button', 'aria-label': 'Grok' }, grokSvg());
  const el = h('div', { class: 'b-grokc' }, fig, bub);
  let t;
  return { el, say(txt, mood = 'talk', ms = 2600) { bub.innerHTML = txt; bub.classList.remove('show'); void bub.offsetWidth; bub.classList.add('show'); fig.classList.remove('is-talk', 'is-happy'); void fig.offsetWidth; fig.classList.add('is-' + mood); clearTimeout(t); t = setTimeout(() => { bub.classList.remove('show'); fig.classList.remove('is-talk', 'is-happy'); }, ms); } };
}
const rodV = () => h('div', { class: 'rod b-rodv' }, Array.from({ length: 10 }, () => h('i', { class: 'bd t' })));
const fiveV = () => h('div', { class: 'five b-fivev' }, Array.from({ length: 5 }, () => h('i', { class: 'bd' })));
const one = () => h('i', { class: 'bd' });

// ---------- Berge: Schichten wie im Mood (spitze Gipfel, keine Kreise) ----------
function mountains() {
  const ns = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '0 0 1600 600'); s.setAttribute('preserveAspectRatio', 'xMidYMax slice'); s.setAttribute('class', 'b-mtn');
  s.innerHTML = `
  <defs>
    <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9CFE6"/><stop offset="1" stop-color="#F3E2DE"/></linearGradient>
    <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E9BD0"/><stop offset=".7" stop-color="#E8C9D2"/></linearGradient>
    <linearGradient id="m3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0876A"/><stop offset="1" stop-color="#F6C3AE"/></linearGradient>
    <linearGradient id="m4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#47A9A2"/><stop offset="1" stop-color="#A6D8CF"/></linearGradient>
    <linearGradient id="m5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE9DA"/><stop offset="1" stop-color="#F8DCC9"/></linearGradient>
  </defs>
  <path fill="url(#m1)" d="M0 330 L120 250 L210 290 L330 170 L430 260 L560 190 L680 280 L800 150 L930 250 L1040 200 L1170 290 L1290 160 L1420 260 L1600 200 V600 H0Z"/>
  <path fill="url(#m2)" opacity=".85" d="M0 400 L150 300 L260 360 L390 250 L520 370 L640 300 L760 380 L900 260 L1010 350 L1150 280 L1280 370 L1420 290 L1600 360 V600 H0Z"/>
  <path fill="url(#m3)" opacity=".92" d="M0 470 L170 380 L300 440 L470 330 L600 450 L760 390 L900 470 L1060 360 L1200 450 L1360 380 L1600 460 V600 H0Z"/>
  <path fill="url(#m4)" opacity=".9" d="M0 530 L210 450 L380 520 L560 440 L740 530 L920 470 L1110 540 L1300 460 L1600 540 V600 H0Z"/>
  <path fill="url(#m5)" d="M0 580 L300 545 L640 575 L980 548 L1320 578 L1600 556 V600 H0Z"/>
  <path fill="#fff" opacity=".55" d="M330 170 L360 196 L345 200 L330 190 L312 204 L300 190Z M800 150 L834 182 L815 186 L800 175 L782 190 L770 176Z M1290 160 L1322 190 L1304 193 L1290 182 L1274 196 L1262 184Z"/>`;
  return s;
}

// ================= HOME: Karte =================
function home() {
  const H = hud({ close: false });
  const map = h('div', { class: 'b-map' });
  const scr = h('section', { class: 'b-screen b-home' }, mountains(), map, H.el);
  const g = grokCorner();
  const book = jellyBtn('b-book', [icon('gem'), h('span', {}, 'Schatz')], { 'aria-label': 'Schatzkiste', onclick: () => openBook() });
  scr.append(book);
  requestAnimationFrame(() => layoutMap());
  function layoutMap() {
    map.replaceChildren();
    const W = map.clientWidth, Hh = map.clientHeight, P = portrait();
    // Wegpunkte: geschwungen über die Karte
    const pts = STATIONS.map((_, i) => {
      const t = i / (STATIONS.length - 1);
      return P ? { x: W * (0.5 + 0.3 * Math.sin(t * Math.PI * 2.2 + 0.4)), y: Hh * (0.92 - t * 0.84) } : { x: W * (0.07 + t * 0.86), y: Hh * (0.6 + 0.24 * Math.sin(t * Math.PI * 2 + 0.5)) };
    });
    const d = pts.map((p, i) => {
      if (!i) return `M${p.x} ${p.y}`;
      const q = pts[i - 1], mx = (q.x + p.x) / 2, my = (q.y + p.y) / 2;
      return P ? `Q${q.x} ${my} ${mx} ${my} T${p.x} ${p.y}` : `Q${mx} ${q.y} ${mx} ${my} T${p.x} ${p.y}`;
    }).join(' ');
    const ns = 'http://www.w3.org/2000/svg';
    const sv = document.createElementNS(ns, 'svg'); sv.setAttribute('class', 'b-path'); sv.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    const doneIdx = Math.max(...st.done, 0) - 1;
    sv.innerHTML = `<path d="${d}" class="b-path-base"/><path d="${d}" class="b-path-dash"/>`;
    map.append(sv);
    STATIONS.forEach((s, i) => {
      const done = st.done.includes(s.id), cur = st.at === s.id;
      const b = jellyBtn('b-node' + (done ? ' is-done' : '') + (cur ? ' is-cur' : '') + (!done && !cur ? ' is-next' : ''),
        [h('span', { class: 'b-node-ico' }, icon(s.icon)), done ? h('span', { class: 'b-node-gem' }, icon('gem')) : null],
        { style: { left: pts[i].x + 'px', top: pts[i].y + 'px', '--nc': s.col }, 'aria-label': (s.kind === 'build' ? 'Bauplatz ' : 'Schnelles Sehen ') + s.id });
      b.addEventListener('click', () => enter(b, s));
      map.append(b);
      if (cur) {
        g.el.style.left = pts[i].x + 'px'; g.el.style.top = pts[i].y + 'px';
        g.el.classList.add('on-map', P ? 'left' : 'up');
      }
    });
    map.append(g.el);
    setTimeout(() => g.say('Los geht’s!', 'happy', 3200), 500);
  }
  addEventListener('resize', layoutMap);
  function openBook() {
    const items = Array.from({ length: 12 }, (_, i) => h('div', { class: 'b-slot' + (i < st.gems ? ' has' : '') }, i < st.gems ? h('span', { style: { '--nc': STATIONS[i % 7].col } }, icon('gem')) : null));
    const sheet = h('div', { class: 'b-sheet' }, h('div', { class: 'b-sheet-card' }, h('div', { class: 'b-sheet-grab' }), h('div', { class: 'b-slots' }, items), jellyBtn('b-x b-sheet-x', icon('close'), { 'aria-label': 'Schließen', onclick: () => sheet.remove() })));
    sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.remove(); });
    scr.append(sheet);
  }
  return scr;
}

// Feierlicher Übergang: die Station wächst zur Spielwelt (Jelly-Iris)
async function enter(btn, s) {
  const r = btn.getBoundingClientRect();
  const iris = h('div', { class: 'b-iris', style: { '--nc': s.col } });
  document.body.append(iris);
  const from = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 28px)`;
  btn.classList.add('is-press');
  await iris.animate([{ clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: 520, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).finished;
  level = s;
  go(s.kind === 'build' ? 'werk' : 'spiel', true);
  await sleep(60);
  await iris.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' }).finished;
  iris.remove();
}
let level = STATIONS[2];

// ================= SPIEL: Schnelles Sehen =================
function picture(n) {
  const t = Math.floor(n / 10), o = n % 10;
  const towers = h('div', { class: 'b-towers' }, Array.from({ length: t }, () => rodV()));
  const fr = h('div', { class: 'b-frame b-frame--pic' }, Array.from({ length: 10 }, (_, i) => h('span', { class: 'b-well' }, i < o ? one() : null)));
  return h('div', { class: 'b-pic' }, t ? towers : null, o || !t ? fr : null);
}
function spiel() {
  const ROUNDS = 5;
  const pills = Array.from({ length: ROUNDS }, () => h('i', { class: 'b-pill' }));
  const H = hud({ mid: h('div', { class: 'b-pills' }, pills) });
  const g = grokCorner();
  const card = h('div', { class: 'b-card' });
  const shutter = h('div', { class: 'b-shutter' }, icon('eye'));
  const timer = h('div', { class: 'b-timer' }, h('i'));
  const answers = h('div', { class: 'b-answers' });
  const stage = h('div', { class: 'b-stage' }, h('div', { class: 'b-cardwrap' }, card, shutter), timer, answers);
  const scr = h('section', { class: 'b-screen b-spiel' }, H.el, stage, g.el);
  const max = level.id <= 2 ? 20 : level.id <= 5 ? 50 : 99;
  const nums = shuffle(Array.from({ length: max - 5 }, (_, i) => i + 6)).slice(0, ROUNDS);
  let round = 0;
  async function show(n, ms = 1700) {
    card.replaceChildren(picture(n));
    scr.classList.remove('is-hidden'); answers.classList.remove('show');
    timer.firstChild.getAnimations().forEach((a) => a.cancel());
    timer.firstChild.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: ms, easing: 'linear', fill: 'forwards' });
    await sleep(ms);
    scr.classList.add('is-hidden');
  }
  function choices(n) {
    const c = new Set([n]);
    const cand = shuffle([n + 10, n - 10, n + 1, n - 1, n + 5, n - 5].filter((x) => x > 0 && x < 100 && x !== n));
    for (const x of cand) { if (c.size >= 3) break; c.add(x); }
    return shuffle([...c]);
  }
  async function play() {
    const n = nums[round];
    card.classList.remove('flipin'); void card.offsetWidth; card.classList.add('flipin');
    await show(n);
    answers.replaceChildren(...choices(n).map((x, i) => jellyBtn('b-ans', h('span', {}, String(x)), { style: { '--i': i }, onclick: (e) => pickAns(e.currentTarget, x, n) })));
    answers.classList.add('show');
  }
  let lock = false;
  async function pickAns(btn, x, n) {
    if (lock) return;
    if (x !== n) {
      btn.classList.add('kz-shake', 'is-wrong'); btn.disabled = true;
      g.say('Schau nochmal genau!', 'talk', 2000);
      scr.classList.remove('is-hidden'); card.classList.add('hint');
      await sleep(1600); card.classList.remove('hint'); scr.classList.add('is-hidden');
      return;
    }
    lock = true;
    btn.classList.add('is-right');
    const r = btn.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, ['#F07A5F', '#3FA7A0', '#F2B544', '#5B6FB5'], 22);
    scr.classList.remove('is-hidden');
    g.say(pick2(n), 'happy', 1800);
    await gemFly(btn, H);
    pills[round].classList.add('on');
    await sleep(600);
    round++; lock = false;
    if (round >= ROUNDS) return finish();
    play();
  }
  const pick2 = (n) => [`Ja, <b>${n}</b>!`, 'Blitzschnell!', 'Super gesehen!'][rand(0, 2)];
  function finish() {
    if (!st.done.includes(level.id)) st.done.push(level.id);
    st.at = Math.min(7, Math.max(st.at, level.id + 1)); save();
    const trophy = h('div', { class: 'b-trophy', style: { '--nc': level.col } }, icon('gem'));
    const ov = h('div', { class: 'b-win' }, h('div', { class: 'b-win-inner' }, trophy, h('div', { class: 'b-win-n' }, '+5'), jellyBtn('b-go', [h('span', {}, 'Weiter'), icon('arrow')], { onclick: () => go('home') })));
    scr.append(ov);
    const r = trophy.getBoundingClientRect(); setTimeout(() => confetti(r.left + r.width / 2, r.top + r.height / 2, ['#F07A5F', '#3FA7A0', '#F2B544', '#5B6FB5'], 34), 350);
  }
  setTimeout(play, 650);
  setTimeout(() => g.say('Schau – wie viele?', 'talk', 1800), 300);
  return scr;
}

// ================= WERKSTATT: Bauplatz =================
function werk() {
  const mat = new Mat();
  const targets = [23, 41, 35, 17, 52, 64];
  let ti = 0;
  const tgt = h('div', { class: 'b-target' }, h('span', { class: 'b-target-ico' }, icon('wrench')), h('b', { class: 'b-glassnum' }, String(targets[0])));
  const H = hud({ mid: tgt });
  const g = grokCorner();
  const slotsT = Array.from({ length: 10 }, () => h('div', { class: 'b-tslot' }));
  const wells = Array.from({ length: 20 }, () => h('span', { class: 'b-well' }));
  const frames = [0, 1].map((f) => h('div', { class: 'b-frame' }, wells.slice(f * 10, f * 10 + 10)));
  const tensZ = h('div', { class: 'b-tensz' }, slotsT);
  const onesZ = h('div', { class: 'b-onesz' }, frames);
  const now = h('div', { class: 'b-now' }, h('b', { class: 'b-now-t' }, '0'), h('b', { class: 'b-now-o' }, '0'));
  const tray = h('div', { class: 'b-tray' }, tensZ, onesZ);
  const sp = (kind, label, mini) => jellyBtn('b-spawn b-spawn--' + kind, mini, { 'aria-label': label });
  const miniRod = h('span', { class: 'b-mini b-mini--rod' }, Array.from({ length: 10 }, () => h('i')));
  const miniFive = h('span', { class: 'b-mini b-mini--five' }, Array.from({ length: 5 }, () => h('i')));
  const miniOne = h('span', { class: 'b-mini b-mini--one' }, h('i'));
  const sT = sp('ten', 'Zehner', miniRod), sF = sp('five', 'Fünfer', miniFive), sO = sp('one', 'Einer', miniOne);
  const bB = jellyBtn('b-bundle', [icon('bundle')], { 'aria-label': 'Zehner machen' });
  const bar = h('div', { class: 'b-bar' }, sT, sF, sO, bB);
  const scr = h('section', { class: 'b-screen b-werk' }, H.el, h('div', { class: 'b-buildstage' }, tray, now), bar, g.el);
  function render(arr) {
    slotsT.forEach((s, i) => { const has = i < mat.tens; if (has && !s.firstChild) { const r = rodV(); if (arr === 'tens' && i === mat.tens - 1) r.classList.add('arriving'); s.append(r); matRod(r); } if (!has && s.firstChild) s.firstChild.remove(); });
    wells.forEach((w, i) => { const has = i < mat.ones; if (has && !w.firstChild) { const b = one(); w.append(b); matOne(b); } if (!has && w.firstChild) w.firstChild.remove(); });
    now.children[0].textContent = String(Math.floor(mat.value / 10)); now.children[1].textContent = String(mat.value % 10);
    now.classList.toggle('is-small', mat.value < 10);
    bB.classList.toggle('show', mat.canBundle);
    if (mat.value === targets[ti % targets.length]) win();
  }
  let winning = false;
  async function win() {
    if (winning) return; winning = true;
    tray.classList.add('is-win');
    const r = tray.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 3, ['#F07A5F', '#3FA7A0', '#F2B544', '#5B6FB5'], 28);
    g.say(`<b>${mat.value}</b> gebaut!`, 'happy', 2200);
    await gemFly(tgt, H);
    await sleep(700);
    ti++; mat.clear(); tray.classList.remove('is-win');
    tgt.lastChild.textContent = String(targets[ti % targets.length]); tgt.classList.remove('pop'); void tgt.offsetWidth; tgt.classList.add('pop');
    winning = false; render();
  }
  const newOnes = (k) => wells.slice(mat.ones - k, mat.ones).map((w) => w.firstChild);
  function add(kind) {
    if (winning) return null;
    if (kind === 'ten') { if (!mat.addTens()) return null; render('tens'); return slotsT[mat.tens - 1].firstChild; }
    const k = kind === 'five' ? 5 : 1;
    if (!mat.addOnes(k)) { onesZ.classList.add('kz-shake'); setTimeout(() => onesZ.classList.remove('kz-shake'), 700); g.say(mat.ones >= 10 ? 'Mach erst einen <b>Zehner</b>!' : 'Kein Platz.'); return null; }
    render(); const els = newOnes(k); els.forEach((e) => e.classList.add('arriving')); return union(els);
  }
  const zones = () => [
    { el: tensZ, accepts: (p) => p.from === 'bar' && p.kind === 'ten', drop: (p) => add(p.kind) },
    { el: onesZ, accepts: (p) => p.from === 'bar' && p.kind !== 'ten', drop: (p) => add(p.kind) },
    { el: bar, accepts: (p) => p.from === 'mat', drop: (p) => { p.kind === 'ten' ? mat.removeTens() : mat.removeOnes(1); render(); return p.kind === 'ten' ? sT : sO; } },
  ];
  [[sT, 'ten', rodV], [sF, 'five', fiveV], [sO, 'one', one]].forEach(([btn, kind, mk]) => {
    draggable(btn, { payload: { kind, from: 'bar' }, zones, ghost: mk, onTap: async () => { btn.classList.remove('tap'); void btn.offsetWidth; btn.classList.add('tap'); const t = add(kind); if (t) await fly(mk(), btn, t, 420); } });
  });
  function matRod(r) { draggable(r, { payload: { kind: 'ten', from: 'mat' }, zones, ghost: rodV, onStart: () => (r.style.opacity = '.2'), onEnd: () => (r.style.opacity = ''), onTap: () => splitRod() }); }
  function matOne(b) { draggable(b, { payload: { kind: 'one', from: 'mat' }, zones, ghost: one, onStart: () => (b.style.opacity = '.2'), onEnd: () => (b.style.opacity = ''), onTap: () => { b.classList.add('popout'); setTimeout(() => { mat.removeOnes(1); render(); }, 200); } }); }
  async function splitRod() {
    if (!mat.canSplit) { g.say('Zu viele Einer!'); return; }
    const src = slotsT[mat.tens - 1].firstChild;
    src.classList.add('burst');
    await sleep(220);
    mat.split(); render();
    const els = newOnes(10); els.forEach((e) => e.classList.add('arriving'));
    await fly(rodV(), src || tensZ, union(els), 380);
    g.say('Peng – <b>10 Einer</b>!', 'talk', 1800);
  }
  bB.addEventListener('click', async () => {
    if (!mat.canBundle) return;
    const src = frames[0];
    mat.bundle(); render('tens');
    await fly(rodV(), src, slotsT[mat.tens - 1].firstChild, 520);
    g.say('Ein <b>Zehner</b>!', 'happy', 1800);
  });
  render();
  setTimeout(() => g.say(`Bau die <b>${targets[0]}</b>!`, 'talk', 3000), 600);
  return scr;
}

// ---------- Router ----------
const screens = { home, spiel, werk };
let current = null;
function go(k, force = false) {
  if (location.hash !== '#/' + k) history.replaceState(null, '', '#/' + k);
  if (k === current && !force) return;
  current = k;
  app.replaceChildren(screens[k]());
}
addEventListener('hashchange', () => { const k = location.hash.replace(/^#\/?/, '') || 'home'; go(screens[k] ? k : 'home'); });
{ const k = location.hash.replace(/^#\/?/, '') || 'home'; if (k === 'werk') level = STATIONS[3]; go(screens[k] ? k : 'home'); }
