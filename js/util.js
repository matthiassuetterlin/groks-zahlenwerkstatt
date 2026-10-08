// Kleine Helfer ohne Abhängigkeiten.

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
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
