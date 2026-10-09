// Einstellungen (v8): Glas-Sheet von unten – Farbwelt, Schrift, Größe. Gespeichert im Browser (localStorage).
// Geöffnet über das Zahnrad auf der Reise (und auf der Elternseite); kein schwebender Knopf über den Aktivitäten.
import { h } from './util.js?v=8';
import { getSetting, setSetting } from './store.js?v=8';

// Standard für neue Besucher: Studio (hell) + Figtree + Groß. Ältere gespeicherte Werte werden sanft umgeleitet;
// die vier Themen-Welten aus v7 bleiben wählbar – neu im Glas-Look.
export const DEFAULTS = { theme: 'studio', font: 'figtree', size: 'l' };
export const THEMES = [
  { id: 'studio', name: 'Studio', dark: false, sw: ['#E3EBF2', '#F6E6DB', '#2C7A7B', '#E8846B'] },
  { id: 'salbei', name: 'Salbei', dark: false, sw: ['#E6EDE4', '#F3E6D6', '#4E8C78', '#E49A3A'] },
  { id: 'rose', name: 'Rosé', dark: false, sw: ['#F6EAEC', '#EED6DE', '#2D7F86', '#E0715A'] },
  { id: 'nacht', name: 'Nacht', dark: true, sw: ['#1C1B22', '#2A2631', '#5CB39A', '#E8B65A'] },
  { id: 'tiefsee', name: 'Tiefsee', dark: true, sw: ['#0F1A26', '#1A2E40', '#4CC2A8', '#F0BE5E'] },
];
export const FONTS = [
  { id: 'figtree', name: 'Figtree', family: "'Figtree'", ff: "'ss01' 1" },
  { id: 'outfit', name: 'Outfit', family: "'Outfit'", ff: 'normal' },
  { id: 'dmsans', name: 'DM Sans', family: "'DM Sans'", ff: "'ss02' 1" },
];
// v1–v6-Werte → v7 (gleicher Charakter: warm-dunkel bleibt warm-dunkel, hell wird zu einem getönten Hell)
export const LEGACY = {
  theme: { kakao: 'nacht', hell: 'salbei', leinen: 'salbei', morgen: 'rose', sand: 'salbei', nebel: 'rose' },
  font: { andika: 'figtree', nunito: 'figtree', lexend: 'outfit', fredoka: 'outfit', atkinson: 'dmsans' },
  size: { s: 'k', m: 'l' },
};
const LISTS = { theme: THEMES, font: FONTS };
/** Gespeicherte Einstellung lesen – unbekannte/alte Werte werden auf v7 abgebildet (und so gespeichert). */
export function readSetting(key) {
  const raw = getSetting(key, DEFAULTS[key]);
  let v = LEGACY[key]?.[raw] || raw;
  if (LISTS[key] && !LISTS[key].some((x) => x.id === v)) v = DEFAULTS[key];
  if (key === 'size' && !['k', 'l', 'xl'].includes(v)) v = DEFAULTS.size;
  if (v !== raw) setSetting(key, v);
  return v;
}
const isDark = (id) => THEMES.find((t) => t.id === id)?.dark !== false;
export const SIZES = [
  { id: 'k', name: 'Kompakt' },
  { id: 'l', name: 'Groß' },
  { id: 'xl', name: 'Riesig' },
];

export function applySettings() {
  const root = document.documentElement;
  root.dataset.theme = readSetting('theme');
  root.dataset.font = readSetting('font');
  root.dataset.size = readSetting('size');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim() || '#1E2030';
}

const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z"/></svg>';

export function mountSettings() {
  const panel = h('div', { class: 'settings-panel', role: 'dialog', 'aria-label': 'Einstellungen', hidden: true });
  const refreshers = [];
  const changed = () => {
    applySettings();
    refreshers.forEach((f) => f());
    // Layouts neu einpassen, sobald die neue Schrift geladen ist
    requestAnimationFrame(() => window.dispatchEvent(new Event('gzw:settings')));
    document.fonts?.ready?.then(() => window.dispatchEvent(new Event('gzw:settings')));
  };

  function group(title, key, list, fallback, render) {
    const row = h('div', { class: 'seg pills', role: 'radiogroup', 'aria-label': title });
    for (const it of list) {
      const b = h('button', { class: 'seg-btn', type: 'button', role: 'radio', dataset: { id: it.id } }, render(it));
      b.addEventListener('click', () => { setSetting(key, it.id); changed(); });
      row.append(b);
    }
    const refresh = () => {
      const cur = readSetting(key);
      row.querySelectorAll('.seg-btn').forEach((x) => { const on = x.dataset.id === cur; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', String(on)); });
    };
    refreshers.push(refresh); refresh();
    return h('div', { class: 'set-group' }, h('div', { class: 'set-title' }, title), row);
  }

  // Sonne/Mond: zwischen dem zuletzt gewählten hellen und dunklen Thema wechseln
  // (Standard: Studio ↔ Nacht). Das jeweils letzte Paar merken wir uns in den Einstellungen.
  const sunBtn = h('button', { type: 'button', 'aria-label': 'Hell', title: 'Hell', html: SUN });
  const moonBtn = h('button', { type: 'button', 'aria-label': 'Dunkel', title: 'Dunkel', html: MOON });
  const mode = h('div', { class: 'mode-toggle', role: 'group', 'aria-label': 'Hell oder dunkel' }, sunBtn, moonBtn);
  const pick = (dark) => {
    const cur = readSetting('theme');
    if (isDark(cur) === dark) return;
    setSetting(isDark(cur) ? 'lastDark' : 'lastLight', cur);
    const want = getSetting(dark ? 'lastDark' : 'lastLight', dark ? 'nacht' : 'studio');
    setSetting('theme', THEMES.some((t) => t.id === want && t.dark === dark) ? want : (dark ? 'nacht' : 'studio'));
    changed();
  };
  sunBtn.addEventListener('click', () => pick(false));
  moonBtn.addEventListener('click', () => pick(true));
  refreshers.push(() => { const light = !isDark(readSetting('theme')); sunBtn.classList.toggle('is-on', light); moonBtn.classList.toggle('is-on', !light); });

  // Größe: dünner Regler mit rundem Griff (Kompakt · Groß · Riesig)
  const range = h('input', { type: 'range', min: '0', max: String(SIZES.length - 1), step: '1', 'aria-label': 'Größe' });
  const labels = h('div', { class: 'size-labels' }, ...SIZES.map((sz, i) => {
    const b = h('button', { type: 'button', class: 'seg-btn-size', dataset: { id: sz.id } }, sz.name);
    b.addEventListener('click', () => { setSetting('size', sz.id); changed(); });
    return b;
  }));
  range.addEventListener('input', () => { setSetting('size', SIZES[+range.value].id); changed(); });
  refreshers.push(() => {
    const cur = readSetting('size');
    const i = Math.max(0, SIZES.findIndex((x) => x.id === cur));
    range.value = String(i);
    range.style.setProperty('--p', (i / (SIZES.length - 1)) * 100 + '%');
    labels.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b.dataset.id === cur));
  });

  panel.append(
    h('div', { class: 'sheet-grab-deco', 'aria-hidden': 'true' }, h('i')),
    h('div', { class: 'settings-head' }, h('b', {}, 'Einstellungen'), mode, h('button', { class: 'settings-close', type: 'button', 'aria-label': 'Schließen' }, '×')),
    group('Farben', 'theme', THEMES, DEFAULTS.theme, (t) => [
      h('span', { class: 'swatch' }, ...t.sw.map((c) => h('i', { style: { background: c } }))),
      h('span', {}, t.name),
    ]),
    group('Schrift', 'font', FONTS, DEFAULTS.font, (f) => [
      h('span', { class: 'font-sample', style: { fontFamily: f.family, fontFeatureSettings: f.ff } }, 'aä47'),
      h('span', { style: { fontFamily: f.family, fontFeatureSettings: f.ff } }, f.name),
    ]),
    h('div', { class: 'set-group' }, h('div', { class: 'set-title' }, 'Größe'), h('div', { class: 'size-slider' }, range, labels)),
    h('div', { class: 'settings-foot' }, h('a', { href: '#/eltern' }, 'Für Eltern')),
  );
  refreshers.forEach((f) => f());
  const backdrop = h('div', { class: 'settings-backdrop', hidden: true });
  document.body.append(backdrop, panel);

  const open = (v) => {
    panel.hidden = !v;
    backdrop.hidden = !v;
    document.querySelectorAll('[data-settings]').forEach((b) => b.setAttribute('aria-expanded', String(v)));
    if (v) refreshers.forEach((f) => f());
  };
  panel.querySelector('.settings-close').addEventListener('click', () => open(false));
  backdrop.addEventListener('click', () => open(false));
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-settings]'); if (b) { e.preventDefault(); open(panel.hidden); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
  window.addEventListener('hashchange', () => open(false));
  return { open };
}
