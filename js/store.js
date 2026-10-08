// Fortschritt und Einstellungen – nur im Browser (localStorage), kein Server.
// Schlüssel bleiben kompatibel: progress[spiel][stufe] = wie oft die Stufe geschafft wurde (seit v1).
// Neu (v6, leicht): seen[spiel][stufe] = angefangen, rounds[spiel][stufe] = gelöste Runden,
// groups[gruppe] = gelöste Runden pro Strategiegruppe (Partner zu 10, Kraft der 5, Doppel, Nachbar …).
const KEY = 'gzw.v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function write(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* privat-Modus: egal */ }
}
const bump = (obj, a, b, by = 1) => {
  obj[a] = obj[a] || {};
  obj[a][b] = (obj[a][b] || 0) + by;
};

export function levelDone(game, level) {
  return !!read().progress?.[game]?.[level];
}

/** 0 = neu, 1 = angefangen, 2 = gelöst (Stufe einmal geschafft), 3 = sicher (Stufe mind. 2× geschafft) */
export function levelState(game, level) {
  const d = read();
  const done = d.progress?.[game]?.[level] || 0;
  if (done >= 2) return 3;
  if (done >= 1) return 2;
  if (d.seen?.[game]?.[level] || d.rounds?.[game]?.[level]) return 1;
  return 0;
}

export function markLevel(game, level) {
  const d = read();
  d.progress = d.progress || {};
  bump(d.progress, game, level);
  write(d);
}

export function markSeen(game, level) {
  const d = read();
  d.seen = d.seen || {};
  d.seen[game] = d.seen[game] || {};
  d.seen[game][level] = 1;
  write(d);
}

/** Eine gelöste Runde – optional mit Strategiegruppen. */
export function markRound(game, level, groups = []) {
  const d = read();
  d.rounds = d.rounds || {};
  bump(d.rounds, game, level);
  if (groups.length) {
    d.groups = d.groups || {};
    for (const g of groups) d.groups[g] = (d.groups[g] || 0) + 1;
  }
  write(d);
}

export function groupCount(g) {
  return read().groups?.[g] || 0;
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
  delete d.progress; delete d.seen; delete d.rounds; delete d.groups;
  write(d);
}
