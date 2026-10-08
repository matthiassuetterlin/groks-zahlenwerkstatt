// Fortschritt und Einstellungen – nur im Browser (localStorage), kein Server.
const KEY = 'gzw.v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function write(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* privat-Modus: egal */ }
}

export function levelDone(game, level) {
  return !!read().progress?.[game]?.[level];
}

export function markLevel(game, level) {
  const d = read();
  d.progress = d.progress || {};
  d.progress[game] = d.progress[game] || {};
  d.progress[game][level] = (d.progress[game][level] || 0) + 1;
  write(d);
}

export function doneCount() {
  const p = read().progress || {};
  return Object.values(p).reduce((s, g) => s + Object.keys(g).length, 0);
}

export function getSetting(key, fallback) {
  const v = read().settings?.[key];
  return v === undefined ? fallback : v;
}

export function setSetting(key, value) {
  const d = read();
  d.settings = d.settings || {};
  d.settings[key] = value;
  write(d);
}

export function resetProgress() {
  const d = read();
  delete d.progress;
  write(d);
}
