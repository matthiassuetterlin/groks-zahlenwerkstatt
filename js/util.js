// Kleine Helfer.
import { stepFor, STEPS } from './sizing.js?v=6';

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) el.style.setProperty(sk, sv); // eigene CSS-Variablen (z. B. --ms, --d)
        else el.style[sk] = sv;
      }
    }
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const svg = (markup) => {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
};

export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Zieht eine Zahl, die nicht in `avoid` liegt (für Abwechslung zwischen Runden). */
export function fresh(gen, avoid = [], tries = 30) {
  let v = gen();
  for (let i = 0; i < tries && avoid.includes(v); i++) v = gen();
  return v;
}

/** Antwortmöglichkeiten: richtige Zahl + plausible Verwechsler. */
export function options(correct, candidates, { min = 0, max = 100, count = 3 } = {}) {
  const set = new Set([correct]);
  for (const c of shuffle(candidates)) {
    if (set.size >= count) break;
    if (Number.isInteger(c) && c >= min && c <= max) set.add(c);
  }
  let d = 1;
  while (set.size < count) {
    if (correct + d <= max) set.add(correct + d);
    if (set.size < count && correct - d >= min) set.add(correct - d);
    d++;
  }
  return shuffle([...set]);
}

export const swapDigits = (n) => (n >= 10 && n < 100 && n % 10 !== 0 ? (n % 10) * 10 + Math.floor(n / 10) : null);

const ONES = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
const TEENS = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const TENS = ['', 'zehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

/** Deutsches Zahlwort 0–100. */
export function numberWord(n) {
  if (n === 100) return 'hundert';
  if (n < 10) return ONES[n];
  if (n < 20) return TEENS[n - 10];
  const t = Math.floor(n / 10), u = n % 10;
  if (u === 0) return TENS[t];
  return (u === 1 ? 'ein' : ONES[u]) + 'und' + TENS[t];
}

export const PRAISE = ['Super!', 'Genau!', 'Toll gesehen!', 'Richtig!', 'Klasse!', 'Stark!', 'Prima!'];

/** Skaliert das (einzige) Kind so, dass es vollständig in seine Box passt – nie größer als 1. */
export function fitInside(box, pad = 10, max = 1) {
  const child = box.firstElementChild;
  if (!child) return;
  child.style.transform = '';
  const bw = box.clientWidth - pad * 2, bh = box.clientHeight - pad * 2;
  const cw = child.offsetWidth, ch = child.offsetHeight;
  if (!cw || !ch || bw <= 0 || bh <= 0) return;
  const k = Math.min(max, bw / cw, bh / ch);
  if (Math.abs(k - 1) > 0.01) child.style.transform = `scale(${k.toFixed(3)})`;
}

/** Passt alle Boxen jetzt und bei Größenänderung ein. Gibt eine Aufräumfunktion zurück. */
export function fitAll(boxes, pad, max = 1) {
  const run = () => boxes.forEach((b) => fitInside(b, pad, max));
  requestAnimationFrame(run);
  document.fonts?.ready?.then(run);
  const ro = new ResizeObserver(run);
  boxes.forEach((b) => ro.observe(b));
  window.addEventListener('gzw:settings', run);
  return () => { ro.disconnect(); window.removeEventListener('gzw:settings', run); };
}

/**
 * Bühne mit Einpassung (Größenregel siehe sizing.js):
 * – Perlen-Spielfelder (Standard) bleiben in Originalgröße (--bead) und werden nur, wenn sie nicht passen,
 *   um höchstens 2 feste Stufen verkleinert (1 → 0.84 → 0.7). Nie vergrößert.
 * – `beads: false` (z. B. Rechenstrich ohne Perlen): stufenlos bis `max`-fach.
 * Gibt { box, refit, destroy } zurück; die aktuelle Stufe steht in data-step am Inhalt.
 */
export function fitStage(parent, content, { max = 1.8, pad = 6, beads = true } = {}) {
  const box = h('div', { class: 'fitbox' }, content);
  content.classList.add('fit-content');
  parent.append(box);
  let raf = 0;
  const run = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const bw = box.clientWidth - pad * 2, bh = box.clientHeight - pad * 2;
      const cw = content.offsetWidth, ch = content.offsetHeight;
      if (!cw || !ch || bw <= 0 || bh <= 0) return;
      const room = Math.min(bw / cw, bh / ch);
      const k = beads ? stepFor(Math.min(1, room)) : Math.min(max, room);
      content.dataset.step = beads ? String(STEPS.indexOf(k)) : 'free';
      content.style.transform = `translate(-50%, -50%) scale(${k.toFixed(4)})`;
      content.style.setProperty('--k', k.toFixed(4));
    });
  };
  const ro = new ResizeObserver(run);
  ro.observe(box);
  ro.observe(content);
  document.fonts?.ready?.then(run);
  window.addEventListener('gzw:settings', run);
  run();
  return { box, refit: run, destroy() { ro.disconnect(); window.removeEventListener('gzw:settings', run); cancelAnimationFrame(raf); } };
}
