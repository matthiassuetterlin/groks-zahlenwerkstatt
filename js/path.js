// Lernpfad in 4 Phasen. Er EMPFIEHLT eine Reihenfolge – nichts ist gesperrt, die Werkstatt ist immer frei.
// Jeder Schritt ist [Spiel-ID, Stufe]. Fortschritt: siehe store.js (neu · angefangen · gelöst · sicher).
import { levelState } from './store.js?v=7';

export const PHASES = [
  {
    id: 'A', title: 'Sehen & Zerlegen', sub: 'bis 10',
    tip: 'Mengen auf einen Blick sehen, Partner zu 10 finden, Zahlen zerlegen.',
    steps: [['sehen', 1], ['freunde', 1], ['zerlege', 1], ['doppel', 1], ['zerlege', 3]],
  },
  {
    id: 'B', title: 'Zehn & Bündeln', sub: 'bis 20',
    tip: 'Zehn als Einheit: bündeln, tauschen, „zehn und drei“, über den Zehner.',
    steps: [['lege', 4], ['buendeln', 1], ['buendeln', 2], ['schlange', 1], ['schlange', 2], ['sehen', 2], ['freunde', 2], ['zerlege', 2], ['doppel', 2], ['plus', 1]],
  },
  {
    id: 'C', title: 'Stellenwert', sub: 'bis 100',
    tip: 'Zehner und Einer bis 100: legen, tauschen, am Hunderterfeld sehen.',
    steps: [['lege', 1], ['lege', 2], ['lege', 3], ['lege', 5], ['lege', 6], ['buendeln', 3], ['sehen', 3], ['hundert', 1], ['hundert', 2], ['freunde', 3], ['schlange', 3], ['plus', 2], ['plus', 3]],
  },
  {
    id: 'D', title: 'Strategien', sub: 'Wege finden',
    tip: 'Ableiten statt zählen: Doppel und Nachbarn, Kraft der Fünf, Analogien, Rechenstrich.',
    steps: [['doppel', 3], ['plus', 4], ['plus', 5], ['plus', 6], ['zerlege', 4], ['strich', 1], ['strich', 2], ['strich', 3], ['hundert', 3]],
  },
];

export const STEPS = PHASES.flatMap((p) => p.steps.map(([game, level]) => ({ phase: p.id, game, level })));

/** Erster Schritt im Pfad, der noch nicht gelöst ist (Empfehlung „als Nächstes“). */
export function nextStep(after = null) {
  let i = 0;
  if (after) {
    const k = STEPS.findIndex((s) => s.game === after.game && s.level === after.level);
    if (k >= 0) {
      for (let j = k + 1; j < STEPS.length; j++) if (levelState(STEPS[j].game, STEPS[j].level) < 2) return STEPS[j];
    }
  }
  for (; i < STEPS.length; i++) if (levelState(STEPS[i].game, STEPS[i].level) < 2) return STEPS[i];
  return null;
}

/** Aktuelle Phase = Phase des empfohlenen Schritts (oder D, wenn alles gelöst ist). */
export function currentPhase() {
  const n = nextStep();
  return PHASES.find((p) => p.id === (n ? n.phase : 'D'));
}

export function phaseProgress(p) {
  const st = p.steps.map(([g, l]) => levelState(g, l));
  return { total: st.length, solved: st.filter((s) => s >= 2).length, mastered: st.filter((s) => s >= 3).length, seen: st.filter((s) => s >= 1).length };
}

/** Strategiegruppen für die Elternansicht */
export const GROUPS = [
  { id: 'bonds10', name: 'Partner zu 10', short: '7 + 3' },
  { id: 'kraft5', name: 'Kraft der Fünf', short: '5 + 3' },
  { id: 'doubles', name: 'Doppel', short: '6 + 6' },
  { id: 'neighbors', name: 'Nachbaraufgaben', short: '6 + 7' },
  { id: 'tens', name: 'Bündeln & Tauschen', short: '10 = 1 Z' },
  { id: 'place', name: 'Stellenwert', short: '20 + 3' },
];
export const GROUP_GOAL = 8; // so viele gelöste Runden = ruhiges Häkchen
