// Edelsteine (v8): Jede gelöste Station der Reise bringt einen Edelstein, eine sicher gelöste (zweimal
// geschafft) einen zweiten. Sie werden aus dem gespeicherten Fortschritt berechnet – älterer Fortschritt
// (v1–v7) wird so ohne Umbau zu Edelsteinen. Nichts wird abgezogen, nichts ist gesperrt.
import { levelState, getSetting, setSetting } from './store.js?v=8';
import { STEPS } from './path.js?v=8';

export const GEMS_PER_STEP = 2;

export function gemsFor(game, level) {
  const st = levelState(game, level);
  return st >= 3 ? 2 : st >= 2 ? 1 : 0;
}

export function gemTotal() {
  return STEPS.reduce((s, x) => s + gemsFor(x.game, x.level), 0);
}

export const gemMax = () => STEPS.length * GEMS_PER_STEP;

/** Zuletzt auf der Reise gesehene Zahl – für die kleine „Neu!“-Animation. */
export function gemsSeen() { return getSetting('gemsSeen', null); }
export function markGemsSeen(n = gemTotal()) { setSetting('gemsSeen', n); }

/** Wo Grok auf der Reise zuletzt stand (Index in STEPS). */
export function grokAt() { return getSetting('grokAt', null); }
export function setGrokAt(i) { setSetting('grokAt', i); }
