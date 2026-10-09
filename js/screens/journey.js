// Die Reise (v8, Startseite): Stationen des Lernpfads (4 Phasen A–D) auf einem ruhigen Weg.
// Jede Station ist ein Spiel-Level. Gelöste Stationen tragen Edelsteine; die empfohlene Station ist
// hervorgehoben, Grok steht dort (und geht nach einem gelösten Level ruhig weiter). Nichts ist gesperrt –
// jede Station ist antippbar. Die Werkstatt ist immer einen Tipp entfernt (Glaskarte unten).
import { h, svg, clamp } from '../util.js?v=8';
import { GAMES, gameById } from '../games/index.js?v=8';
import { levelState } from '../store.js?v=8';
import { PHASES, STEPS, nextStep, phaseProgress } from '../path.js?v=8';
import { GROK_SVG } from '../grok.js?v=8';
import { gemsFor, gemTotal, gemMax, gemsSeen, markGemsSeen, grokAt, setGrokAt } from '../gems.js?v=8';
import { ICON_GEM, ICON_GEAR, ICON_PLAY } from '../icons.js?v=8';
import { rod, bead } from '../blocks.js?v=8';
import { reducedMotion } from '../beadfx.js?v=8';

const SAY_NEXT = ['Weiter geht’s!', 'Hier geht’s weiter!', 'Komm mit!'];

export function renderJourney(app, { treasure = false, phase = null } = {}) {
  const nx = nextStep();
  const nxIndex = nx ? STEPS.findIndex((s) => s.game === nx.game && s.level === nx.level) : STEPS.length - 1;
  let cur = PHASES.find((p) => p.id === phase) || PHASES.find((p) => p.id === (nx ? nx.phase : 'D'));
  const cleanups = [];
  let alive = true;

  // ---------- Kopf ----------
  const gemN = h('span', { class: 'gem-n' }, String(gemsSeen() ?? gemTotal()));
  const gemBtn = h('button', { class: 'hud-gems', type: 'button', 'aria-label': 'Schatz: Edelsteine ansehen' }, h('span', { class: 'gem-ico', html: ICON_GEM }), gemN);
  const gear = h('button', { class: 'glass-btn', type: 'button', 'data-settings': '', 'aria-label': 'Einstellungen', html: ICON_GEAR });
  const tabs = h('nav', { class: 'j-tabs', 'aria-label': 'Phasen' });
  const tabEls = PHASES.map((p) => {
    const pr = phaseProgress(p);
    const b = h('button', { class: 'j-tab', type: 'button', 'aria-label': `Phase ${p.id}: ${p.title}` },
      h('span', { class: 'j-tab-l' }, p.id),
      h('span', { class: 'j-tab-bar' }, h('i', { style: { width: (pr.solved / pr.total) * 100 + '%' } })));
    b.addEventListener('click', () => show(p, p.id > cur.id ? 1 : -1));
    tabs.append(b);
    return b;
  });
  const head = h('header', { class: 'j-head' },
    h('div', { class: 'j-brand' }, h('span', {}, 'Grok’s'), h('b', {}, 'Zahlenwerkstatt')),
    tabs,
    h('div', { class: 'j-right' }, gemBtn, gear),
  );

  // ---------- Titel der Phase (Held: riesiger, dünner Buchstabe) ----------
  const titleL = h('span', { class: 'j-title-l' });
  const titleT = h('b');
  const titleS = h('small');
  const title = h('div', { class: 'j-title' }, titleL, h('span', { class: 'j-title-t' }, titleT, titleS));

  // ---------- Karte ----------
  const land = svg(`<svg class="j-land" viewBox="0 0 1600 600" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="jl1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--land-1a)"/><stop offset="1" stop-color="var(--land-1b)"/></linearGradient>
      <linearGradient id="jl2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--land-2a)"/><stop offset="1" stop-color="var(--land-2b)"/></linearGradient>
      <linearGradient id="jl3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--land-3a)"/><stop offset="1" stop-color="var(--land-3b)"/></linearGradient>
    </defs>
    <path d="M0 330 C 260 250, 520 300, 800 250 S 1320 170, 1600 230 V600 H0Z" fill="url(#jl1)"/>
    <path d="M0 420 C 300 350, 640 420, 980 360 S 1400 330, 1600 370 V600 H0Z" fill="url(#jl2)"/>
    <path d="M0 500 C 380 450, 760 520, 1120 470 S 1480 450, 1600 480 V600 H0Z" fill="url(#jl3)"/>
  </svg>`);
  const pathSvg = svg('<svg class="j-path" aria-hidden="true"><path class="j-path-done"/><path class="j-path-todo"/></svg>');
  const stations = h('div', { class: 'j-stations' });
  const jgrok = h('div', { class: 'j-grok', 'aria-hidden': 'true' }, h('div', { class: 'j-grok-fig' }, svg(GROK_SVG)), h('div', { class: 'j-bubble' }));
  const map = h('div', { class: 'j-map' }, pathSvg, stations, jgrok);

  // ---------- Dock: Werkstatt (immer da) + Weiter ----------
  const werkVis = h('span', { class: 'j-werk-vis' }, rod('ten'), rod('ten'), rod('ten'), rod('ten'), h('span', { class: 'j-werk-ones' }, ...Array.from({ length: 7 }, () => bead('one'))));
  const werk = h('a', { class: 'j-werk glass', href: '#/werkstatt', 'aria-label': 'Werkstatt: frei bauen' },
    h('span', { class: 'j-werk-n' }, h('b', { class: 't' }, '4'), h('b', { class: 'o' }, '7')),
    h('span', { class: 'j-werk-txt' }, werkVis, h('b', {}, 'Werkstatt')));
  const nxGame = nx && gameById(nx.game);
  const go = nxGame
    ? h('a', { class: 'j-go', href: `#/spiel/${nx.game}/${nx.level}`, 'aria-label': `Weiter: ${nxGame.title}, ${nxGame.levels[nx.level - 1].label}` },
      h('span', { class: 'j-go-ico', html: ICON_PLAY }))
    : null;
  const dock = h('div', { class: 'j-dock' }, werk, go);

  const page = h('section', { class: 'journey' }, land, head, title, map, dock);
  app.append(page);

  // ---------- Schatz (Bottom-Sheet) ----------
  const tSheet = h('div', { class: 'j-treasure glass', role: 'dialog', 'aria-label': 'Schatz', hidden: true });
  const tBack = h('div', { class: 'j-treasure-back', hidden: true });
  function renderTreasure() {
    const total = gemTotal();
    tSheet.replaceChildren(
      h('div', { class: 'sheet-grab-deco', 'aria-hidden': 'true' }, h('i')),
      h('div', { class: 't-hero' }, h('span', { class: 't-n' }, String(total)), h('span', { class: 'gem-ico t-gem', html: ICON_GEM }), h('small', {}, `von ${gemMax()}`)),
      h('div', { class: 't-rows' }, ...PHASES.map((p) => h('div', { class: 't-row' },
        h('span', { class: 't-l' }, p.id),
        h('div', { class: 't-slots' }, ...p.steps.map(([g, l]) => {
          const n = gemsFor(g, l);
          const game = gameById(g);
          return h('a', { class: `t-slot g${n}`, href: `#/spiel/${g}/${l}`, 'aria-label': `${game?.title} ${l}: ${n} Edelsteine` },
            h('span', { class: 'gem-ico', html: ICON_GEM }), h('span', { class: 'gem-ico', html: ICON_GEM }));
        }))))),
    );
  }
  const openT = (v) => {
    if (v) renderTreasure();
    tSheet.hidden = !v; tBack.hidden = !v;
    if (!v && location.hash === '#/schatz') history.replaceState(null, '', '#/');
  };
  gemBtn.addEventListener('click', () => openT(true));
  tBack.addEventListener('click', () => openT(false));
  const onKey = (e) => { if (e.key === 'Escape') openT(false); };
  document.addEventListener('keydown', onKey);
  page.append(tBack, tSheet);
  if (treasure) openT(true);

  // ---------- Stationen legen ----------
  let pts = [];        // Mittelpunkte der Stationen (Karten-Koordinaten)
  let samples = [];    // Punkte entlang des Wegs
  let stIdx = [];      // Index in samples je Station
  let tile = 72;

  function layout(p) {
    const W = map.clientWidth, H = map.clientHeight;
    if (!W || !H) return;
    const n = p.steps.length;
    const portrait = W < H * 1.05;
    let rows, cols;
    if (portrait) { cols = W < 520 ? (n <= 6 ? 2 : 3) : (n <= 6 ? 3 : 4); rows = Math.ceil(n / cols); }
    else { rows = n <= 6 ? 1 : n <= 10 ? 2 : 3; cols = Math.ceil(n / rows); }
    // Kachelgröße aus dem Raster; oben Platz für die Edelsteine, unten für das Schild der nächsten Station
    const cw0 = W / Math.max(cols, 1), rh0 = H / Math.max(rows, 1);
    tile = Math.round(clamp(Math.min(cw0 * (portrait ? 0.5 : 0.56), rh0 * (rows === 1 ? 0.42 : 0.5), portrait ? (W < 520 ? 92 : 112) : 122), 56, 122));
    const padX = Math.max(tile * 0.75 + 8, portrait ? W * 0.14 : W * 0.07);
    const padTop = tile * 0.65 + 16, padBot = tile * 0.75 + 72;
    const cw = cols > 1 ? (W - 2 * padX) / (cols - 1) : 0;
    const rhFull = rows > 1 ? (H - padTop - padBot) / (rows - 1) : 0;
    const rh = Math.min(rhFull, tile * 2.6);
    const lift = rows > 1 ? (rhFull - rh) * (rows - 1) * 0.45 : 0;
    pts = p.steps.map((_, i) => {
      const r = Math.floor(i / cols), k = i % cols;
      const c = r % 2 === 0 ? k : cols - 1 - k;          // Schlangenlinie, von unten nach oben
      const x = cols > 1 ? padX + c * cw : W / 2;
      let y = rows > 1 ? H - padBot - lift - r * rh : padTop + (H - padTop - padBot) * 0.55;
      if (rows === 1) y += Math.sin(i * 1.2 + 0.6) * Math.min(H * 0.16, 90) - (i / Math.max(1, n - 1)) * Math.min(H * 0.1, 60);
      else y += (k % 2 ? -1 : 1) * Math.min(rh * 0.08, 12);
      return { x, y };
    });
    // Weg: Catmull-Rom durch alle Stationen (weiche Kehren an den Reihenenden)
    const P = [pts[0], ...pts, pts[pts.length - 1]];
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    samples = []; stIdx = [];
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      const turn = Math.abs(p2.y - p1.y) > Math.abs(p2.x - p1.x);
      const t = turn ? 0.5 : 1 / 6;
      const c1 = { x: p1.x + (p2.x - p0.x) * t, y: p1.y + (p2.y - p0.y) * t };
      const c2 = { x: p2.x - (p3.x - p1.x) * t, y: p2.y - (p3.y - p1.y) * t };
      if (turn) { const side = p1.x > W / 2 ? 1 : -1; c1.x = clamp(p1.x + side * tile * 0.9, 8, W - 8); c2.x = clamp(p2.x + side * tile * 0.9, 8, W - 8); }
      d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      stIdx[i - 1] = samples.length;
      for (let s = 0; s < 24; s++) {
        const u = s / 24, v = 1 - u;
        samples.push({ x: v * v * v * p1.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * p2.x, y: v * v * v * p1.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * p2.y });
      }
    }
    stIdx[pts.length - 1] = samples.length;
    samples.push(pts[pts.length - 1]);
    pathSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    pathSvg.setAttribute('width', W); pathSvg.setAttribute('height', H);
    const todo = pathSvg.querySelector('.j-path-todo'), done = pathSvg.querySelector('.j-path-done');
    todo.setAttribute('d', d);
    // erledigter Teil bis zur empfohlenen Station (bzw. bis zur letzten gelösten)
    const first = STEPS.findIndex((s) => s.phase === p.id);
    const upto = clamp(nxIndex - first, 0, n - 1);
    const pd = samples.slice(0, stIdx[upto] + 1).map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ');
    done.setAttribute('d', nxIndex <= first ? '' : pd);
    map.style.setProperty('--tile', tile + 'px');
    [...stations.children].forEach((el, i) => { el.style.left = pts[i].x + 'px'; el.style.top = pts[i].y + 'px'; });
    placeGrok(false);
  }

  function build(p) {
    titleL.textContent = p.id;
    titleT.textContent = p.title;
    titleS.textContent = p.sub;
    tabEls.forEach((t, i) => { const on = PHASES[i] === p; t.classList.toggle('is-on', on); t.setAttribute('aria-current', on ? 'true' : 'false'); });
    stations.replaceChildren();
    const first = STEPS.findIndex((s) => s.phase === p.id);
    p.steps.forEach(([g, l], i) => {
      const game = gameById(g);
      const st = levelState(g, l);
      const gi = first + i;
      const isNext = gi === nxIndex && !!nx;
      const gems = gemsFor(g, l);
      const vis = h('span', { class: 'j-st-vis' }, game.icon());
      const el = h('a', {
        class: `j-st s${st}` + (isNext ? ' is-next' : '') + (gi < nxIndex ? ' is-past' : ''),
        href: `#/spiel/${g}/${l}`, style: { '--d': i * 40 + 'ms' },
        'aria-label': `${game.title}, Stufe ${l}: ${game.levels[l - 1].label}` + (gems ? `, ${gems} Edelsteine` : '') + (isNext ? ', als Nächstes' : ''),
      },
      h('span', { class: 'j-st-tile' }, vis, h('span', { class: 'j-st-lv' }, String(l))),
      h('span', { class: 'j-st-gems' + (gems ? ' has' : '') }, ...Array.from({ length: gems }, () => h('span', { class: 'gem-ico', html: ICON_GEM }))),
      isNext ? h('span', { class: 'j-st-tag' }, h('b', {}, game.title), h('small', {}, game.levels[l - 1].label)) : null);
      stations.append(el);
    });
    requestAnimationFrame(() => {
      layout(p);
      fitIcons();
    });
  }

  function fitIcons() {
    stations.querySelectorAll('.j-st-vis').forEach((box) => {
      const c = box.firstElementChild; if (!c) return;
      c.style.transform = '';
      const k = Math.min(4, (box.clientWidth - 2) / c.offsetWidth, (box.clientHeight - 2) / c.offsetHeight);
      c.style.transform = `scale(${k.toFixed(3)})`;
    });
  }

  // ---------- Grok auf der Reise ----------
  let walking = false;
  function grokSpot(i) {
    const q = pts[i]; if (!q) return null;
    const gw = jgrok.offsetWidth || 60, gh = jgrok.offsetHeight || 70;
    const right = q.x + tile / 2 + gw + 10 < map.clientWidth;
    return { x: right ? q.x + tile * 0.5 + 4 : q.x - tile * 0.5 - gw - 4, y: q.y - gh * 0.62, flip: !right };
  }
  function placeGrok() {
    if (walking) return;
    const first = STEPS.findIndex((s) => s.phase === cur.id);
    const local = nxIndex - first;
    const inPhase = local >= 0 && local < cur.steps.length;
    jgrok.classList.toggle('is-away', !inPhase);
    if (!inPhase) return;
    const s = grokSpot(local); if (!s) return;
    jgrok.style.transform = `translate(${s.x}px, ${s.y}px)`;
    jgrok.classList.toggle('face-left', s.flip);
  }
  function say(text, ms = 3200) {
    const b = jgrok.querySelector('.j-bubble');
    b.textContent = text; jgrok.classList.add('is-talking');
    clearTimeout(say.t); say.t = setTimeout(() => jgrok.classList.remove('is-talking'), ms);
  }
  // Nach einem gelösten Level: Grok läuft von der alten zur neuen Station
  function walkIfMoved() {
    const from = grokAt();
    setGrokAt(nxIndex);
    const first = STEPS.findIndex((s) => s.phase === cur.id);
    if (from == null || from >= nxIndex || from < first || reducedMotion()) { say(SAY_NEXT[0]); return; }
    const a = stIdx[from - first], b = stIdx[nxIndex - first];
    if (a == null || b == null) return;
    walking = true;
    jgrok.classList.add('is-walking');
    const gw = jgrok.offsetWidth || 60, gh = jgrok.offsetHeight || 70;
    const t0 = performance.now(), dur = clamp((b - a) * 38, 900, 2600);
    const step = (now) => {
      if (!alive) return;
      const u = Math.min(1, (now - t0) / dur);
      const e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const k = a + (b - a) * e, i0 = Math.floor(k), f = k - i0;
      const p0 = samples[i0], p1 = samples[Math.min(samples.length - 1, i0 + 1)];
      const x = p0.x + (p1.x - p0.x) * f, y = p0.y + (p1.y - p0.y) * f;
      jgrok.classList.toggle('face-left', p1.x < p0.x - 0.5);
      jgrok.style.transform = `translate(${x - gw / 2}px, ${y - gh * 0.86}px)`;
      if (u < 1) requestAnimationFrame(step);
      else {
        walking = false; jgrok.classList.remove('is-walking');
        jgrok.style.transition = 'transform .5s cubic-bezier(.45,0,.25,1)';
        placeGrok();
        setTimeout(() => { jgrok.style.transition = ''; }, 520);
        say(SAY_NEXT[1]);
      }
    };
    setTimeout(() => requestAnimationFrame(step), 450);
  }

  // ---------- Neue Edelsteine: fliegen von der gelösten Station zum Zähler ----------
  function flyNewGems() {
    const seen = gemsSeen();
    const total = gemTotal();
    markGemsSeen(total);
    if (seen == null || total <= seen) { gemN.textContent = String(total); return; }
    const from = grokAt() != null ? STEPS[Math.max(0, nxIndex - 1)] : null;
    const first = STEPS.findIndex((s) => s.phase === cur.id);
    const src = from ? stations.children[STEPS.indexOf(from) - first] : null;
    const r0 = (src || map).getBoundingClientRect(), r1 = gemBtn.getBoundingClientRect();
    const k = total - seen;
    for (let i = 0; i < Math.min(k, 6); i++) {
      const g = h('span', { class: 'gem-fly', html: ICON_GEM });
      document.body.append(g);
      const x0 = r0.left + r0.width / 2 - 14, y0 = r0.top + r0.height / 2 - 14, x1 = r1.left + 10, y1 = r1.top + r1.height / 2 - 14;
      const a = g.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(.4)`, opacity: 0 },
        { transform: `translate(${x0}px, ${y0 - 40}px) scale(1.2)`, opacity: 1, offset: .25 },
        { transform: `translate(${x1}px, ${y1}px) scale(.8)`, opacity: 1 },
      ], { duration: reducedMotion() ? 1 : 1100, delay: 300 + i * 160, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'both' });
      a.onfinish = () => {
        g.remove();
        gemN.textContent = String(seen + i + 1 >= total || i === Math.min(k, 6) - 1 ? total : seen + i + 1);
        gemBtn.classList.remove('is-bump'); void gemBtn.offsetWidth; gemBtn.classList.add('is-bump');
      };
    }
  }

  // ---------- Phase wechseln (Tabs oder Wischen) ----------
  function show(p, dir = 0) {
    if (p === cur && stations.childElementCount) return;
    cur = p;
    if (dir && !reducedMotion()) {
      map.classList.remove('slide-l', 'slide-r'); void map.offsetWidth;
      map.classList.add(dir > 0 ? 'slide-l' : 'slide-r');
    }
    build(p);
  }
  let sx = null, sy = 0;
  map.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
  map.addEventListener('pointerup', (e) => {
    if (sx == null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const i = PHASES.indexOf(cur) + (dx < 0 ? 1 : -1);
      if (PHASES[i]) show(PHASES[i], dx < 0 ? 1 : -1);
    }
  });

  build(cur);
  const ro = new ResizeObserver(() => { layout(cur); fitIcons(); });
  ro.observe(map);
  cleanups.push(() => ro.disconnect());
  setTimeout(() => { if (alive) { walkIfMoved(); flyNewGems(); } }, 350);

  return () => { alive = false; cleanups.forEach((f) => f()); document.removeEventListener('keydown', onKey); clearTimeout(say.t); };
}

export { GAMES };
