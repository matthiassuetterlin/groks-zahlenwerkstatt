// Grok – der Werkstatt-Begleiter. Eine kleine Figur mit Sprechblase. Antippen = Tipp.
import { h, svg, pick } from './util.js?v=6';

export const GROK_SVG = `
<svg class="grok-svg" viewBox="0 0 140 160" aria-hidden="true">
  <g class="g-shadow"><ellipse cx="70" cy="152" rx="38" ry="5" fill="#2A2B3D" opacity=".10"/></g>
  <g class="g-all">
    <g class="g-antenna">
      <path d="M70 30 C70 22 72 17 76 13" style="stroke:var(--grok)" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <circle class="g-bead" cx="78" cy="11" r="8" style="fill:var(--one)"/>
      <circle cx="75.5" cy="8.5" r="2.4" fill="#fff" opacity=".65"/>
    </g>
    <rect class="g-foot g-foot-l" x="44" y="134" width="20" height="14" rx="7" style="fill:var(--grok-deep)"/>
    <rect class="g-foot g-foot-r" x="76" y="134" width="20" height="14" rx="7" style="fill:var(--grok-deep)"/>
    <path class="g-arm g-arm-l" d="M28 92 C17 98 15 108 19 116" style="stroke:var(--grok)" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path class="g-arm g-arm-r" d="M112 92 C123 98 125 108 121 116" style="stroke:var(--grok)" stroke-width="11" fill="none" stroke-linecap="round"/>
    <rect x="22" y="28" width="96" height="114" rx="44" style="fill:var(--grok)"/>
    <path d="M40 40 C52 32 88 32 100 40" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".12" fill="none"/>
    <rect x="33" y="42" width="74" height="56" rx="27" style="fill:var(--grok-face)"/>
    <g class="g-eyes">
      <g class="g-eyes-open">
        <ellipse cx="55" cy="68" rx="7.5" ry="8.5" fill="#23253F"/>
        <ellipse cx="85" cy="68" rx="7.5" ry="8.5" fill="#23253F"/>
        <circle cx="57.6" cy="64.6" r="2.6" fill="#fff"/>
        <circle cx="87.6" cy="64.6" r="2.6" fill="#fff"/>
      </g>
      <g class="g-eyes-happy">
        <path d="M47.5 70 Q55 61 62.5 70" stroke="#23253F" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M77.5 70 Q85 61 92.5 70" stroke="#23253F" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>
    </g>
    <ellipse cx="44" cy="81" rx="5.5" ry="3.4" fill="#F2A39B" opacity=".75"/>
    <ellipse cx="96" cy="81" rx="5.5" ry="3.4" fill="#F2A39B" opacity=".75"/>
    <path class="g-mouth" d="M63 82 Q70 89 77 82" stroke="#23253F" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <g class="g-five">
      <rect x="39" y="110" width="62" height="16" rx="8" style="fill:var(--grok-deep)"/>
      <circle cx="49" cy="118" r="4.4" style="fill:var(--one)"/>
      <circle cx="59.5" cy="118" r="4.4" style="fill:var(--one)"/>
      <circle cx="70" cy="118" r="4.4" style="fill:var(--one)"/>
      <circle cx="80.5" cy="118" r="4.4" style="fill:var(--one)"/>
      <circle cx="91" cy="118" r="4.4" style="fill:var(--one)"/>
    </g>
  </g>
</svg>`;

export const grokFigure = (cls = '') => h('div', { class: `grok-figure ${cls}` }, svg(GROK_SVG));

// Elemente, die Grok nie verdecken darf (Knöpfe, Perlen, Mulden, Felder, Karten …)
const INTERACTIVE = '.task > *, .ro-num, .zz-eq, .hdot, .hhandle, .hboard, .bmat .zone-head, button:not(.grok), a[href], input, [role="button"], [role="radio"], .bead, .well, .cell, .slot, .choice, .pick, .num-card, .love-piece, .wand, .sbar, .hcell, .zz-chain, .drop-zone, .tray, .act-btn, .settings-fab';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const area = (r) => Math.max(0, r.w) * Math.max(0, r.h);
const inter = (a, b) => area({ w: Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h: Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) });

/**
 * Grok mit Sprechblase.
 * say(text, {mood, hold, at}) · cheer(text) · visit(el, text) · setHints([...]) · hide()
 *
 * In Aktivitäten (Platzhalter liegt in .play-card) „lebt“ Grok in einer eigenen Ebene über der Karte:
 * Der Platzhalter in der Leiste hält nur den Platz frei (kein Umfließen). Mit {at: element} läuft er
 * ruhig neben das Ziel (Aufgabe, Knopf, Fehlerstelle), spricht dort und geht später zurück.
 * Er sucht sich dafür einen Platz, der keine Knöpfe/Perlen/Mulden verdeckt – findet er keinen,
 * spricht er von seinem Platz aus. Während eines Zugs lässt er alle Berührungen durch.
 * Ohne Ziel bei einem Fehler (mood 'think') geht er zur letzten Stelle, an der das Kind gearbeitet hat.
 */
export function createGrok(slot, { layout = 'column', greeting = null } = {}) {
  const card = slot.closest('.play-card');
  if (!card) return createStaticGrok(slot, { layout, greeting });

  const bubbleText = h('div', { class: 'bubble-text' });
  const bubble = h('div', { class: 'bubble walker-bubble', role: 'status', 'aria-live': 'polite' }, bubbleText);
  const fig = h('button', { class: 'grok', type: 'button', 'aria-label': 'Grok antippen für einen Tipp' }, svg(GROK_SVG));
  const body = h('div', { class: 'walker-body' }, fig);
  const walker = h('div', { class: 'grok-walker' }, body, bubble);
  const home = h('div', { class: 'grok-home', 'aria-hidden': 'true' });
  slot.append(home);
  card.append(walker);

  let hints = [], hintIdx = 0;
  let hideTimer = null, moodTimer = null, backTimer = null, walkTimer = null, arriveTimer = null;
  let pos = null;          // aktuelle Position (Karten-Koordinaten, linke obere Ecke der Figur)
  let away = false;        // nicht auf dem Heimplatz
  let lastTouch = null;    // letzte Arbeitsstelle auf der Bühne (für Fehler-Hinweise)
  let alive = true;

  const cardRect = () => card.getBoundingClientRect();
  const figSize = () => { const r = home.getBoundingClientRect(); return { w: r.width || 70, h: r.height || 80 }; };
  function homePos() {
    const c = cardRect(), r = home.getBoundingClientRect();
    return { x: r.left - c.left, y: r.top - c.top };
  }
  function setPos(p, ms = 0) {
    walker.style.transition = ms ? `transform ${ms}ms cubic-bezier(.45,.05,.4,1)` : 'none';
    walker.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`;
    pos = p;
  }

  // Hindernisse in Karten-Koordinaten (nur sichtbare, nicht zu große Elemente)
  function obstacles() {
    const c = cardRect(), out = [];
    for (const el of card.querySelectorAll(INTERACTIVE)) {
      if (walker.contains(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      out.push({ x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height });
    }
    return out;
  }
  const cost = (box, obs) => { let s = 0; for (const o of obs) s += inter(box, o); return s; };

  // Blase um die Figur legen: über, rechts oder links – möglichst ohne etwas zu verdecken
  function placeBubble(p, obs) {
    const c = cardRect(), f = figSize();
    bubble.style.maxWidth = Math.min(300, c.width - 24) + 'px';
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    const opts = [
      { k: 'top', x: p.x, y: p.y - bh - 8 },
      { k: 'top', x: p.x + f.w - bw, y: p.y - bh - 8 },
      { k: 'right', x: p.x + f.w + 8, y: p.y + f.h * .1 },
      { k: 'left', x: p.x - bw - 8, y: p.y + f.h * .1 },
      { k: 'right', x: p.x + f.w + 8, y: p.y + f.h - bh },
      { k: 'left', x: p.x - bw - 8, y: p.y + f.h - bh },
    ];
    // dazu ein Raster in der Nähe: so findet die Blase auch auf dem Telefon eine freie Ecke
    for (let dy = -3; dy <= 1; dy++) for (let dx = -3; dx <= 3; dx++) {
      opts.push({ k: 'free', x: p.x + f.w / 2 - bw / 2 + dx * 40, y: p.y - bh - 8 + dy * 30 });
    }
    const fb = { x: p.x - 4, y: p.y - 4, w: f.w + 8, h: f.h + 8 };
    let best = null;
    for (const o of opts) {
      const x = Math.max(8, Math.min(c.width - bw - 8, o.x)), y = Math.max(8, Math.min(c.height - bh - 8, o.y));
      const box = { x, y, w: bw, h: bh };
      const near = Math.max(0, Math.hypot(x + bw / 2 - (p.x + f.w / 2), y + bh / 2 - (p.y + f.h / 2)) - (bw + f.w) / 2);
      const sc = cost(box, obs) * 3 + inter(box, fb) * 50 + near * near * .6 + (o.k === 'free' ? 30 : 0);
      if (!best || sc < best.sc) best = { ...o, x, y, sc };
    }
    bubble.style.transform = '';
    bubble.style.left = Math.round(best.x - p.x) + 'px';
    bubble.style.top = Math.round(best.y - p.y) + 'px';
    bubble.dataset.side = best.k;
  }

  // Freien Platz neben einem Element suchen (Figur + Blase dürfen nichts Bedienbares verdecken)
  function spotNear(el) {
    const c = cardRect(), f = figSize(), r = el.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    const t = { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height };
    const obs = obstacles();
    const g = 10, cx = t.x + t.w / 2, cy = t.y + t.h / 2;
    const cands = [];
    for (const fy of [0, .5, 1]) {
      const y = t.y + t.h * fy - f.h * fy;
      cands.push({ x: t.x - f.w - g, y }, { x: t.x + t.w + g, y });
    }
    for (const fx of [0, .5, 1]) {
      const x = t.x + t.w * fx - f.w * fx;
      cands.push({ x, y: t.y - f.h - g }, { x, y: t.y + t.h + g });
    }
    let best = null;
    for (const p of cands) {
      if (p.x < 6 || p.y < 6 || p.x + f.w > c.width - 6 || p.y + f.h > c.height - 6) continue;
      const box = { x: p.x, y: p.y, w: f.w, h: f.h };
      const hit = cost(box, obs) + inter(box, t) * 3;
      if (hit > f.w * f.h * .04) continue;      // verdeckt etwas → kein Platz für Grok
      const d = Math.hypot(p.x + f.w / 2 - cx, p.y + f.h / 2 - cy);
      const sc = hit * 20 + d;
      if (!best || sc < best.sc) best = { ...p, sc };
    }
    return best;
  }

  function walkTo(p, then) {
    clearTimeout(walkTimer); clearTimeout(arriveTimer);
    const from = pos || homePos();
    const dist = Math.hypot(p.x - from.x, p.y - from.y);
    if (dist < 4) { setPos(p); then?.(); return; }
    if (reduced()) {
      // ohne Bewegung: kurz ausblenden, versetzen, einblenden
      walker.classList.add('is-fading');
      walkTimer = setTimeout(() => { setPos(p); walker.classList.remove('is-fading'); then?.(); }, 160);
      return;
    }
    const ms = Math.round(Math.max(520, Math.min(1500, dist * 2.4)));
    walker.classList.toggle('face-left', p.x < from.x);
    walker.classList.add('is-walking');
    walker.style.setProperty('--steps', String(Math.max(2, Math.round(ms / 340))));
    setPos(p, ms);
    arriveTimer = setTimeout(() => { walker.classList.remove('is-walking'); then?.(); }, ms + 20);
  }

  function goHome(instant = false) {
    clearTimeout(backTimer);
    away = false;
    bubble.classList.remove('show');
    const hp = homePos();
    if (instant) { setPos(hp); return; }
    walkTo(hp, () => { walker.classList.remove('face-left'); });
  }

  function setMood(m) {
    fig.classList.remove('is-talk', 'is-happy', 'is-think');
    void fig.offsetWidth;
    if (m) fig.classList.add('is-' + m);
    clearTimeout(moodTimer);
    moodTimer = setTimeout(() => fig.classList.remove('is-talk', 'is-happy', 'is-think'), m === 'happy' ? 1600 : 1400);
  }

  function speak(text, mood, hold) {
    bubbleText.innerHTML = text;
    bubble.classList.remove('show');
    setMood(mood);
    requestAnimationFrame(() => {
      if (!alive) return;
      placeBubble(pos || homePos(), obstacles());
      bubble.classList.add('show');
    });
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => bubble.classList.remove('show'), hold || Math.max(3600, text.length * 75));
  }

  function say(text, { mood = 'talk', hold = 0, at = null } = {}) {
    if (!alive) return;
    clearTimeout(hideTimer); clearTimeout(backTimer);
    let target = at;
    if (!target && mood === 'think' && lastTouch && lastTouch.isConnected && Date.now() - lastTouch.t < 6000) target = lastTouch;
    const spot = target && target.isConnected ? spotNear(target) : null;
    if (spot) {
      bubble.classList.remove('show');
      away = true;
      walkTo(spot, () => {
        speak(text, mood, hold);
        const stay = hold || Math.max(3600, text.length * 75);
        backTimer = setTimeout(() => goHome(), stay + 400);
      });
    } else {
      if (away) { goHome(true); }
      speak(text, mood, hold);
    }
  }

  // Letzte Arbeitsstelle merken; sobald das Kind weiterarbeitet, verschwindet die Blase
  const onDown = (e) => {
    if (fig.contains(e.target)) return;
    const st = card.querySelector('.stage');
    if (st && st.contains(e.target)) {
      const el = e.target.closest(INTERACTIVE) || e.target;
      lastTouch = el; el.t = Date.now();
    }
    if (bubble.classList.contains('show') && !away) bubble.classList.remove('show');
  };
  document.addEventListener('pointerdown', onDown, true);

  fig.addEventListener('click', () => {
    if (hints.length) { say(hints[hintIdx % hints.length], { mood: 'think', at: null }); hintIdx++; }
    else say(pick(['Hallo! Ich bin Grok.', 'Ich helfe dir gern.', 'Bauen macht Spaß!']), { mood: 'happy' });
  });

  // Heimplatz verfolgen (Layoutwechsel, Drehen, Schriftgröße)
  const sync = () => { if (!alive) return; if (!away) { setPos(homePos()); if (bubble.classList.contains('show')) placeBubble(pos, obstacles()); } };
  const ro = new ResizeObserver(sync);
  ro.observe(card); ro.observe(home);
  window.addEventListener('resize', sync);
  window.addEventListener('gzw:settings', sync);
  requestAnimationFrame(() => { setPos(homePos()); if (greeting) say(greeting); });

  return {
    el: walker,
    say,
    cheer: (text, opts = {}) => say(text, { mood: 'happy', ...opts }),
    visit: (el, text, opts = {}) => say(text, { ...opts, at: el }),
    home: () => goHome(),
    setHints(list) { hints = list || []; hintIdx = 0; },
    hide() { bubble.classList.remove('show'); },
    destroy() {
      alive = false;
      [hideTimer, moodTimer, backTimer, walkTimer, arriveTimer].forEach(clearTimeout);
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('resize', sync);
      window.removeEventListener('gzw:settings', sync);
      ro.disconnect(); walker.remove(); home.remove();
    },
  };
}

/** Grok fest an seinem Platz (Startseite). */
function createStaticGrok(slot, { layout = 'column', greeting = null } = {}) {
  const bubbleText = h('div', { class: 'bubble-text' });
  const bubble = h('div', { class: 'bubble', role: 'status', 'aria-live': 'polite' }, bubbleText);
  const fig = h('button', { class: 'grok', type: 'button', 'aria-label': 'Grok antippen für einen Tipp' }, svg(GROK_SVG));
  const wrap = h('div', { class: `grok-wrap grok-wrap--${layout}` }, bubble, fig);
  slot.append(wrap);

  let hints = [];
  let hintIdx = 0;
  let hideTimer = null;
  let moodTimer = null;

  function setMood(m) {
    fig.classList.remove('is-talk', 'is-happy', 'is-think');
    void fig.offsetWidth;
    if (m) fig.classList.add('is-' + m);
    clearTimeout(moodTimer);
    moodTimer = setTimeout(() => fig.classList.remove('is-talk', 'is-happy', 'is-think'), m === 'happy' ? 1600 : 1400);
  }

  function say(text, { mood = 'talk', hold = 0 } = {}) {
    clearTimeout(hideTimer);
    bubbleText.innerHTML = text;
    bubble.classList.remove('show');
    void bubble.offsetWidth;
    bubble.classList.add('show');
    setMood(mood);
    if (!hold && floating()) hold = Math.max(5000, text.length * 80);
    if (hold) hideTimer = setTimeout(() => bubble.classList.remove('show'), hold);
  }

  // In engen Layouts schwebt die Blase über der Bühne: antippen = ausblenden, sonst nach einer Weile weg.
  // Sie lässt Berührungen durch und verschwindet, sobald das Kind weiterarbeitet.
  const floating = () => getComputedStyle(bubble).position === 'absolute';
  const onDown = (e) => { if (bubble.classList.contains('show') && !fig.contains(e.target) && floating()) bubble.classList.remove('show'); };
  document.addEventListener('pointerdown', onDown, true);

  fig.addEventListener('click', () => {
    if (hints.length) {
      say(hints[hintIdx % hints.length], { mood: 'think' });
      hintIdx++;
    } else {
      say(pick(['Hallo! Ich bin Grok.', 'Ich helfe dir gern.', 'Bauen macht Spaß!']), { mood: 'happy' });
    }
  });

  if (greeting) say(greeting);

  return {
    el: wrap,
    say,
    cheer: (text) => say(text, { mood: 'happy' }),
    setHints(list) { hints = list || []; hintIdx = 0; },
    hide() { bubble.classList.remove('show'); },
    destroy() { clearTimeout(hideTimer); clearTimeout(moodTimer); document.removeEventListener('pointerdown', onDown, true); wrap.remove(); },
  };
}
