// Einstellungen unten rechts: Farbwelt, Schrift, Größe. Gespeichert im Browser (localStorage).
import { h } from './util.js?v=3';
import { getSetting, setSetting } from './store.js?v=3';

export const THEMES = [
  { id: 'leinen', name: 'Leinen', sw: ['#F6F1EA', '#2D7C79', '#F0A63A'] },
  { id: 'salbei', name: 'Salbei', sw: ['#EEF2EE', '#3F7F6E', '#E9A23B'] },
  { id: 'nacht', name: 'Nacht', sw: ['#1E2030', '#5FB3AC', '#F2B24C'] },
];
export const FONTS = [
  { id: 'nunito', name: 'Nunito', family: "'Nunito'" },
  { id: 'andika', name: 'Andika', family: "'Andika'" },
  { id: 'atkinson', name: 'Atkinson', family: "'Atkinson Hyperlegible'" },
];
export const SIZES = [
  { id: 's', name: 'Klein' },
  { id: 'm', name: 'Mittel' },
  { id: 'l', name: 'Groß' },
];

export function applySettings() {
  const root = document.documentElement;
  root.dataset.theme = getSetting('theme', 'leinen');
  root.dataset.font = getSetting('font', 'nunito');
  root.dataset.size = getSetting('size', 'm');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim() || '#F6F1EA';
}

const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9M19 7h1M4 17h3M13 17h7"/><circle cx="16" cy="7" r="2.6"/><circle cx="10" cy="17" r="2.6"/></svg>';

export function mountSettings() {
  const panel = h('div', { class: 'settings-panel', role: 'dialog', 'aria-label': 'Einstellungen', hidden: true });
  const fab = h('button', { class: 'settings-fab', type: 'button', 'aria-label': 'Einstellungen', 'aria-expanded': 'false', html: GEAR });

  function group(title, key, list, fallback, render) {
    const row = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': title });
    const cur = getSetting(key, fallback);
    for (const it of list) {
      const b = h('button', { class: 'seg-btn' + (it.id === cur ? ' is-on' : ''), type: 'button', role: 'radio', 'aria-checked': String(it.id === cur), dataset: { id: it.id } }, render(it));
      b.addEventListener('click', () => {
        setSetting(key, it.id);
        row.querySelectorAll('.seg-btn').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', String(on)); });
        applySettings();
        // Layouts neu einpassen, sobald die neue Schrift geladen ist
        requestAnimationFrame(() => window.dispatchEvent(new Event('gzw:settings')));
        document.fonts?.ready?.then(() => window.dispatchEvent(new Event('gzw:settings')));
      });
      row.append(b);
    }
    return h('div', { class: 'set-group' }, h('div', { class: 'set-title' }, title), row);
  }

  panel.append(
    h('div', { class: 'settings-head' }, h('b', {}, 'Einstellungen'), h('button', { class: 'settings-close', type: 'button', 'aria-label': 'Schließen' }, '×')),
    group('Farben', 'theme', THEMES, 'leinen', (t) => [
      h('span', { class: 'swatch' }, ...t.sw.map((c) => h('i', { style: { background: c } }))),
      h('span', {}, t.name),
    ]),
    group('Schrift', 'font', FONTS, 'nunito', (f) => [
      h('span', { class: 'font-sample', style: { fontFamily: f.family } }, 'Aa 7'),
      h('span', { style: { fontFamily: f.family } }, f.name),
    ]),
    group('Größe', 'size', SIZES, 'm', (s) => [
      h('span', { class: `size-sample size-sample--${s.id}` }, 'A'),
      h('span', {}, s.name),
    ]),
  );
  document.body.append(fab, panel);

  const open = (v) => {
    panel.hidden = !v;
    fab.setAttribute('aria-expanded', String(v));
    fab.classList.toggle('is-open', v);
  };
  fab.addEventListener('click', () => open(panel.hidden));
  panel.querySelector('.settings-close').addEventListener('click', () => open(false));
  document.addEventListener('pointerdown', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !fab.contains(e.target)) open(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
  window.addEventListener('hashchange', () => open(false));
  return { open };
}
