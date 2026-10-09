// Hunderterfeld mit Abdeckwinkel (nach Mahiko): 10 × 10 Punkte mit 5er-Lücken.
// Den Winkel an der Ecke ziehen – die sichtbaren Punkte sind die Zahl (5er-, 25er- und 50er-Struktur).
// Stufe 1: Zahl zeigen · Stufe 2: Zahl erkennen · Stufe 3: Blitz (kurz sehen, dann wählen)
import { h, rand, fresh, numberWord, options, swapDigits, fitStage } from '../util.js?v=7';
import { speakCards } from '../blocks.js?v=7';
import { choices, burst, choiceSlot } from '../fx.js?v=7';
import { handHint } from '../hint.js?v=7';
import { ICON_EYE } from '../icons.js?v=7';

const NS = 'http://www.w3.org/2000/svg';

function makeField() {
  const grid = h('div', { class: 'hfield' });
  const dots = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const d = h('span', { class: 'hdot' + (c >= 5 ? ' hdot--b' : '') + (r >= 5 ? ' hdot--low' : ''), dataset: { n: r * 10 + c + 1 },
        style: { gridColumn: String(c < 5 ? c + 1 : c + 2), gridRow: String(r < 5 ? r + 1 : r + 2) } });
      dots.push(d);
      grid.append(d);
    }
  }
  return { grid, dots };
}

export function playHundert(stage, { level, grok, onSolved, rail, actions }) {
  const mode = level.mode || 'set';
  const n = fresh(() => (Math.random() < 0.15 ? [25, 50, 75, 55, 45][rand(0, 4)] : rand(1, 9) * 10 + rand(1, 9)));
  const cleanups = [];
  let dead = false;

  const { grid, dots } = makeField();
  const cover = document.createElementNS(NS, 'svg');
  cover.setAttribute('class', 'hcover');
  const path = document.createElementNS(NS, 'path');
  cover.append(path);
  const handle = h('div', { class: 'hhandle', role: 'slider', tabindex: '0', 'aria-label': 'Winkel', 'aria-valuemin': '0', 'aria-valuemax': '100' });
  const board = h('div', { class: 'hboard' }, grid, cover, handle);

  const box = h('span', { class: 'box' }, '?');
  const task = h('div', { class: 'task' });
  if (mode === 'set') task.append(h('span', { class: 'task-num' }, String(n)));
  else task.append(h('span', { class: 'peek', 'aria-label': 'Schau' }, h('span', { html: ICON_EYE, style: { display: 'inline-flex' } })), h('span', { class: 'task-num' }, box));
  stage.append(task);
  const fs = fitStage(stage, h('div', { class: 'hwrap' }, board), { max: 1.8 });
  const host = mode === 'set' ? h('div', { class: 'rail-choices' }) : choiceSlot(3);
  rail.append(host);

  // Geometrie (lokal, unabhängig von der Skalierung)
  let geo = null;
  function measure() {
    const cx = [], cy = [];
    for (let c = 0; c < 10; c++) cx.push(dots[c].offsetLeft + dots[c].offsetWidth / 2);
    for (let r = 0; r < 10; r++) cy.push(dots[r * 10].offsetTop + dots[r * 10].offsetHeight / 2);
    const p = cx[1] - cx[0];
    const ex = [cx[0] - p / 2, ...cx.slice(1).map((x, i) => (x + cx[i]) / 2), cx[9] + p / 2];
    const ey = [cy[0] - p / 2, ...cy.slice(1).map((y, i) => (y + cy[i]) / 2), cy[9] + p / 2];
    geo = { cx, cy, ex, ey, gx: 0, gy: 0 }; // Punkte sind relativ zum Brett gemessen (offsetParent = .hboard)
  }

  let val = mode === 'set' ? 0 : n;
  let corner = null;   // Ecke rechts unter dem letzten sichtbaren Punkt (lokal)
  let grab = { x: 0, y: 0 };   // Abstand Finger ↔ Ecke beim Greifen – so springt der Winkel nicht
  function draw(v) {
    if (!geo) measure();
    const { ex, ey, gx, gy } = geo;
    const W = board.offsetWidth, H = board.offsetHeight;
    cover.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const r = Math.floor(v / 10), c = v % 10;
    const X = (i) => gx + ex[i], Y = (i) => gy + ey[i];
    // Winkel als L-Form; die Außenkanten liegen außerhalb des Bretts (werden sauber abgeschnitten),
    // sichtbar bleibt nur die innere Kante. Die vorstehende Ecke ist gerundet – dort sitzt der Griff.
    const o = 6, L = -o, T = -o, R = W + o, B = H + o;
    const q = Math.min(8, (ex[1] - ex[0]) * .4);
    let d = '';
    if (v >= 100) d = '';
    else if (c === 0) d = `M${L} ${r === 0 ? T : Y(r)}H${R}V${B}H${L}Z`;
    else d = `M${X(c) + q} ${Y(r)}H${R}V${B}H${L}V${Y(r + 1)}H${X(c)}V${Y(r) + q}Q${X(c)} ${Y(r)} ${X(c) + q} ${Y(r)}Z`;
    path.setAttribute('d', d);
    // Griff: seine linke obere Ecke sitzt genau in der Innenecke des Winkels (rechts unter dem letzten
    // sichtbaren Punkt) – er liegt also ganz auf der Abdeckung, verdeckt keine sichtbaren Punkte und bleibt im Brett.
    // Ecke (lokal): rechts unter dem letzten sichtbaren Punkt; volle Reihen → rechts am Ende der letzten Reihe.
    corner = v === 0 ? { x: X(0), y: Y(0) } : v >= 100 ? { x: X(10), y: Y(10) } : c === 0 ? { x: X(10), y: Y(r) } : { x: X(c), y: Y(r + 1) };
    const hs = handle.offsetWidth || 36, pad = 4;
    let hx = corner.x + 2, hy = corner.y + 2;
    hx = Math.max(pad, Math.min(W - hs - pad, hx));
    hy = Math.max(pad, Math.min(H - hs - pad, hy));
    handle.style.left = hx + 'px';
    handle.style.top = hy + 'px';
    handle.setAttribute('aria-valuenow', String(v));
    dots.forEach((dt, i) => dt.classList.toggle('is-vis', i < v));
  }
  // Wert aus der Position der Winkel-Ecke: sie rastet an der nächsten Kante zwischen den Punkten ein.
  function valueAt(clientX, clientY) {
    const br = board.getBoundingClientRect();
    const k = br.width / board.offsetWidth;
    const x = (clientX - br.left) / k - geo.gx - grab.x, y = (clientY - br.top) / k - geo.gy - grab.y;
    // Ein Punkt gilt als aufgedeckt, sobald die Ecke fast bis zu seiner Mitte reicht (0,3 Abstand vorher):
    // der Griff sitzt schräg unter der Ecke – so landet „Griff auf den nächsten Punkt“ genau richtig.
    const p = geo.cx[1] - geo.cx[0];
    const C = geo.cx.filter((v) => v < x + p * 0.3).length, R = geo.cy.filter((v) => v < y + p * 0.3).length;
    if (R === 0) return 0;
    return Math.max(0, Math.min(100, (R - 1) * 10 + C));
  }

  let done = false;
  function checkSet() {
    if (done || mode !== 'set') return;
    if (val === n) {
      done = true;
      board.classList.add('is-good');
      handle.classList.add('is-done');
      task.append(speakCards(n, { cls: 'speak--small' }));
      burst(handle, 10);
      grok.cheer(`${Math.floor(n / 10)} volle Reihen und ${n % 10} – ${numberWord(n)}!`);
      setTimeout(() => onSolved(['place']), 1300);
    } else if (val > 0) {
      grok.say(`Das sind <b>${val}</b>. ${val > n ? 'Etwas weniger.' : 'Etwas mehr.'}`, { mood: 'think' });
    }
  }

  // Ziehen am Griff (Maus & Finger)
  let drag = null;
  handle.addEventListener('pointerdown', (e) => {
    if (done || mode !== 'set') return;
    e.preventDefault();
    measure(); draw(val);
    { const br = board.getBoundingClientRect(), k = br.width / board.offsetWidth;
      grab = { x: (e.clientX - br.left) / k - corner.x, y: (e.clientY - br.top) / k - corner.y }; }
    drag = e.pointerId;
    handle.setPointerCapture?.(e.pointerId);
    handle.classList.add('is-drag');
  });
  handle.addEventListener('pointermove', (e) => {
    if (drag !== e.pointerId) return;
    const v = valueAt(e.clientX, e.clientY);
    if (v !== val) { val = v; draw(val); }
  });
  const up = (e) => {
    if (drag !== e.pointerId) return;
    drag = null; grab = { x: 0, y: 0 };
    handle.classList.remove('is-drag');
    checkSet();
  };
  handle.addEventListener('pointerup', up);
  handle.addEventListener('pointercancel', up);
  // Tippen auf einen Punkt setzt den Winkel dorthin
  grid.addEventListener('click', (e) => {
    const d = e.target.closest('.hdot');
    if (!d || done || mode !== 'set') return;
    val = +d.dataset.n; draw(val); checkSet();
  });
  handle.addEventListener('keydown', (e) => {
    if (done || mode !== 'set') return;
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 10, ArrowUp: -10 }[e.key];
    if (!step) return;
    e.preventDefault();
    val = Math.max(0, Math.min(100, val + step)); draw(val);
    clearTimeout(handle._t); handle._t = setTimeout(checkSet, 700);
  });

  const ro = new ResizeObserver(() => { geo = null; draw(val); });
  ro.observe(board);
  requestAnimationFrame(() => draw(val));

  function ask() {
    const sw = swapDigits(n);
    host.replaceChildren(choices(options(n, [sw, n + 10, n - 10, n + 1, n - 1].filter((x) => x != null), { min: 1, max: 100, count: 3 }), (v) => {
      if (v !== n) { grok.say(v === sw ? 'Vertauscht! Erst die vollen Reihen.' : 'Zähl die vollen Reihen: je 10.', { mood: 'think' }); if (mode === 'flash') { draw(n); board.classList.remove('is-blind'); } return false; }
      box.textContent = String(n); box.classList.add('is-filled');
      board.classList.remove('is-blind'); draw(n);
      task.append(speakCards(n, { cls: 'speak--small' }));
      grok.cheer(`${Math.floor(n / 10)} Reihen und ${n % 10}: ${numberWord(n)}!`);
      setTimeout(() => onSolved(['place']), 1200);
      return true;
    }));
  }

  if (mode === 'set') {
    grok.say(`Zieh die Ecke: zeig <b>${n}</b>!`);
    grok.setHints([`${Math.floor(n / 10)} volle Reihen.`, `Dann noch ${n % 10} in der nächsten Reihe.`, '5 und 5 sind eine Reihe.']);
    cleanups.push(handHint('hundert', () => handle, () => dots[Math.min(99, n - 1)]));
  } else if (mode === 'read') {
    board.classList.add('is-static');
    grok.say('Wie viele Punkte siehst du?');
    grok.setHints(['Volle Reihen = Zehner.', 'Eine halbe Reihe = 5.', 'Die Hälfte vom Feld = 50.']);
    ask();
  } else {
    board.classList.add('is-static');
    grok.say('Schau schnell!');
    grok.setHints(['Volle Reihen = Zehner.', 'Bei 50 ist das Feld halb voll.']);
    const t = setTimeout(() => { if (dead) return; board.classList.add('is-blind'); draw(0); ask(); }, 1600);
    cleanups.push(() => clearTimeout(t));
  }
  return () => { dead = true; ro.disconnect(); fs.destroy(); cleanups.forEach((f) => f()); };
}
