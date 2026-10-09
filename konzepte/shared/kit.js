// Gemeinsamer Baukasten der Design-Konzepte (eigenständig, keine Abhängigkeit zur Live-App).
import { GROK_SVG } from './grok-svg.js';
export { GROK_SVG };

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') for (const [a, b] of Object.entries(v)) a.startsWith('--') ? el.style.setProperty(a, b) : (el.style[a] = b);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const grokSvg = () => { const t = document.createElement('template'); t.innerHTML = GROK_SVG.trim(); return t.content.firstElementChild; };

const WORDS = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const TENS = ['', 'zehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig', 'hundert'];
export function word(n) {
  if (n < 20) return WORDS[n];
  if (n === 100) return 'hundert';
  const t = Math.floor(n / 10), o = n % 10;
  return o ? (o === 1 ? 'ein' : WORDS[o]) + 'und' + TENS[t] : TENS[t];
}

// ---------- Modell der Werkstatt: Zehner und Einer (Einer höchstens 20 = zwei Zehnerfelder) ----------
export class Mat {
  constructor() { this.tens = 0; this.ones = 0; this.subs = new Set(); }
  get value() { return this.tens * 10 + this.ones; }
  on(f) { this.subs.add(f); return () => this.subs.delete(f); }
  emit(ev) { for (const f of this.subs) f(ev, this); }
  canTens(k = 1) { return this.tens + k <= 10 && this.value + 10 * k <= 100; }
  canOnes(k = 1) { return this.ones + k <= 20 && this.value + k <= 100; }
  addTens(k = 1) { if (!this.canTens(k)) return false; this.tens += k; this.emit({ type: 'tens', k }); return true; }
  addOnes(k = 1) { if (!this.canOnes(k)) return false; this.ones += k; this.emit({ type: 'ones', k }); return true; }
  removeTens(k = 1) { if (this.tens < k) return false; this.tens -= k; this.emit({ type: 'tens', k: -k }); return true; }
  removeOnes(k = 1) { if (this.ones < k) return false; this.ones -= k; this.emit({ type: 'ones', k: -k }); return true; }
  get canBundle() { return this.ones >= 10 && this.tens < 10; }
  get canSplit() { return this.tens > 0 && this.ones <= 10; }
  bundle() { if (!this.canBundle) return false; this.ones -= 10; this.tens += 1; this.emit({ type: 'bundle' }); return true; }
  split() { if (!this.canSplit) return false; this.tens -= 1; this.ones += 10; this.emit({ type: 'split' }); return true; }
  clear() { this.tens = 0; this.ones = 0; this.emit({ type: 'clear' }); }
}

// ---------- Ziehen (Maus + Finger), nachsichtiges Ablegen ----------
// el: Griff. opts.payload, opts.ghost() → Node (gleiche Perlengröße), opts.zones() → [{el, accepts, drop}]
// drop(zone, payload) → true wenn angenommen. Die Mitte des Geists zählt, Zonen haben einen Rand.
let active = null;
export const dragging = () => !!active;
export function draggable(el, opts) {
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', (e) => {
    if (active || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const payload = typeof opts.payload === 'function' ? opts.payload(e) : opts.payload;
    if (payload == null) return;
    e.preventDefault();
    const s = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, ghost: null, hover: null, touch: e.pointerType !== 'mouse' };
    active = s;
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    const lift = s.touch ? 26 : 0;
    const loop = () => { cx += (tx - cx) * 0.38; cy += (ty - cy) * 0.38; if (s.ghost) s.ghost.style.transform = `translate3d(${cx}px,${cy}px,0) scale(1.06)`; raf = requestAnimationFrame(loop); };
    const move = (ev) => {
      if (ev.pointerId !== s.id) return;
      if (!s.moved && Math.hypot(ev.clientX - s.x0, ev.clientY - s.y0) > 6) {
        s.moved = true;
        const g = opts.ghost(payload);
        g.classList.add('kz-ghost');
        document.body.append(g);
        const r = el.getBoundingClientRect(), gr = g.getBoundingClientRect();
        s.offX = gr.width / 2; s.offY = gr.height / 2;
        // Startpunkt: dort, wo das Original liegt
        cx = r.left + r.width / 2 - s.offX; cy = r.top + r.height / 2 - s.offY;
        s.ghost = g; raf = requestAnimationFrame(loop);
        document.body.classList.add('kz-dragging');
        opts.onStart?.(payload, el);
        for (const z of opts.zones()) if (z.accepts(payload)) z.el.classList.add('kz-can');
      }
      if (s.moved) {
        tx = ev.clientX - s.offX; ty = ev.clientY - s.offY - lift;
        const z = findZone(opts.zones(), payload, ev.clientX, ev.clientY - lift, s.touch);
        if (z !== s.hover) { s.hover?.el.classList.remove('kz-hover'); z?.el.classList.add('kz-hover'); s.hover = z; }
      }
    };
    const up = async (ev) => {
      if (ev.pointerId !== s.id) return;
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      document.body.classList.remove('kz-dragging');
      for (const z of opts.zones()) z.el.classList.remove('kz-can', 'kz-hover');
      if (!s.moved) { active = null; opts.onTap?.(payload, el, ev); return; }
      cancelAnimationFrame(raf);
      const z = ev.type === 'pointerup' ? findZone(opts.zones(), payload, ev.clientX, ev.clientY - lift, s.touch) : null;
      const g = s.ghost;
      let target = null;
      if (z) target = await z.drop(payload, g);
      if (target && target.getBoundingClientRect) {
        await land(g, target, s.offX, s.offY);
      } else if (target) { g.remove(); }
      else {
        const r = el.getBoundingClientRect();
        await glide(g, r.left + r.width / 2 - s.offX, r.top + r.height / 2 - s.offY, 1, 260);
        g.remove();
      }
      opts.onEnd?.(payload, !!target);
      active = null;
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });
}
function findZone(zones, payload, x, y, touch) {
  let best = null, bd = Infinity;
  const m = touch ? 34 : 18;
  for (const z of zones) {
    if (!z.el.isConnected || !z.accepts(payload)) continue;
    const r = z.el.getBoundingClientRect();
    if (x < r.left - m || x > r.right + m || y < r.top - m || y > r.bottom + m) continue;
    const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
    const d = Math.hypot(dx, dy);
    if (d < bd) { bd = d; best = z; }
  }
  return best;
}
// Geist sanft auf das Ziel setzen; Ziel = Element oder { getBoundingClientRect(), els: [...] }
export async function land(g, target, offX, offY, ms = 220) {
  const r = target.getBoundingClientRect();
  if (offX == null) { const gr = g.getBoundingClientRect(); offX = gr.width / 2; offY = gr.height / 2; }
  await glide(g, r.left + r.width / 2 - offX, r.top + r.height / 2 - offY, 1, ms);
  g.remove();
  for (const e of target.els || [target]) { e.classList.remove('arriving'); e.classList.add('kz-landed'); setTimeout(() => e.classList.remove('kz-landed'), 420); }
}
// Ein Teil ohne Ziehen vom Ort A zum Ziel fliegen lassen (Tippen statt Ziehen, Zehner machen …)
export async function fly(node, fromEl, target, ms = 380) {
  node.classList.add('kz-ghost');
  document.body.append(node);
  const fr = fromEl.getBoundingClientRect(), gr = node.getBoundingClientRect();
  node.style.transform = `translate3d(${fr.left + fr.width / 2 - gr.width / 2}px,${fr.top + fr.height / 2 - gr.height / 2}px,0)`;
  await land(node, target, gr.width / 2, gr.height / 2, ms);
}
export const union = (els) => ({ els, getBoundingClientRect() { const rs = els.map((e) => e.getBoundingClientRect()); const l = Math.min(...rs.map((r) => r.left)), t = Math.min(...rs.map((r) => r.top)), r = Math.max(...rs.map((r) => r.right)), b = Math.max(...rs.map((r) => r.bottom)); return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t }; } });

export function glide(node, x, y, s = 1, ms = 240) {
  return new Promise((res) => {
    if (reduced()) { res(); return; }
    const a = node.animate([{ transform: node.style.transform || 'none' }, { transform: `translate3d(${x}px,${y}px,0) scale(${s})` }], { duration: ms, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' });
    a.onfinish = res; a.oncancel = res;
  });
}

// Lange drücken (für Geste „Zehner aufbrechen“)
export function longPress(el, ms, fn, { onStart, onCancel } = {}) {
  let t = null, x = 0, y = 0;
  el.addEventListener('pointerdown', (e) => { x = e.clientX; y = e.clientY; onStart?.(el); t = setTimeout(() => { t = null; fn(el); }, ms); });
  const cancel = (e) => { if (t && (!e || e.type !== 'pointermove' || Math.hypot(e.clientX - x, e.clientY - y) > 10)) { clearTimeout(t); t = null; onCancel?.(el); } };
  el.addEventListener('pointerup', cancel); el.addEventListener('pointerleave', cancel); el.addEventListener('pointercancel', cancel); el.addEventListener('pointermove', cancel);
}

// Feier: kleine Jelly-Konfetti (abgerundete Rechtecke / Sterne – keine Deko-Kreise)
export function confetti(x, y, colors, n = 18) {
  if (reduced()) return;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'kz-confetti';
    const c = colors[i % colors.length];
    p.style.cssText = `left:${x}px;top:${y}px;background:linear-gradient(145deg, color-mix(in srgb, ${c} 55%, white), ${c});`;
    document.body.append(p);
    const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 120, rot = (Math.random() - .5) * 540;
    p.animate([
      { transform: 'translate(-50%,-50%) scale(.4) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 40}px)) scale(1) rotate(${rot * .6}deg)`, opacity: 1, offset: .55 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.15}px), calc(-50% + ${Math.sin(a) * d + 60}px)) scale(.8) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => p.remove();
  }
}

// Einfacher Hash-Router: #/home, #/werk, #/spiel
export function router(routes, render) {
  const go = () => { const k = (location.hash.replace(/^#\/?/, '') || 'home').split('/')[0]; render(routes[k] ? k : 'home'); };
  addEventListener('hashchange', go); go();
}

// Eine Perlengröße pro Fenster – jedes Konzept gibt seine Formel an; Ergebnis als --b (px)
export function beadVar(fn) {
  const set = () => document.documentElement.style.setProperty('--b', Math.round(fn(innerWidth, innerHeight)) + 'px');
  set(); addEventListener('resize', set);
}
