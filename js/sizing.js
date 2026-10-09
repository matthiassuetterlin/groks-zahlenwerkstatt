// ============================================================
// EINE Größenregel für alle Perlen (v7)
// ------------------------------------------------------------
// --bead  = Perlendurchmesser in px. Er wird EINMAL pro Fenstergröße berechnet und gilt überall:
//           Werkstatt-Matte, Auswahl-Karten, gezogene Perlen und alle Spiele.
//
//   Querformat mit Seitenleiste (≥ 900 px breit, landscape):
//       bead = min( (vh − 340) / 15.6 ,  (min(vw, 1680) − 386) / 29.4 )
//   Hochkant/schmal, Leiste unten – Telefon (< 600 px breit):
//       bead = min( (vw − 38) / 22 ,     (vh − 445) / 24.6 )
//   Hochkant/schmal, Leiste unten – Tablet:
//       bead = min( (vw − 80) / 24.6 ,   (vh − 480) / 20.5 )
//   → abgerundet und auf 12 … 46 px begrenzt.
//   Beispiele: 390×844 → 16 · 820×1180 → 30 · 1180×820 → 27 · 1440×900 → 35 · 1920×1080 → 44
//   Herleitung: Eine volle Werkstatt-Matte (10 Zehner-Plätze + 3 Zehnerfelder) und die Auswahl-Karten
//   mit einer echten Zehnerstange passen genau in die Karte. Kleinere Spielfelder sind damit kleiner –
//   aber jede Perle ist gleich groß.
//
// Stufen: Ein Spielfeld, das bei --bead nicht in die Bühne passt (z. B. das Hunderterfeld mit 100
//   Perlen), wird NICHT stufenlos eingepasst, sondern höchstens 2 feste Stufen kleiner:
//       Stufe 1 = 0.84 · bead,  Stufe 2 = 0.7 · bead   (STEPS)
//   Erst wenn auch Stufe 2 nicht passt, wird als Notlösung stufenlos verkleinert.
//   Feste Viele-Perlen-Felder: „Verliebte Zahlen bis 100“ nutzt --bead-2 (Stufe 2), das Hunderterfeld
//   wird bei Bedarf gestuft. Alle anderen Spiele laufen bei den Ziel-Fenstern auf Stufe 0 (getestet).
//
// Bühne: alle Spiele nutzen dieselbe Karte (.play-card) mit demselben Innenabstand (--stage-pad);
//   Inhalte werden nie vergrößert.
// Ausnahmen: kleine Vorschaubilder (Lernen-Übersicht, Regel-Kärtchen, Fundstreifen) sind Symbole,
//   keine Spielperlen.
// ============================================================
export const STEPS = [1, 0.84, 0.7];
export const BEAD_MIN = 12, BEAD_MAX = 46;

export function beadFor(vw, vh) {
  const side = vw >= 900 && vw >= vh;
  let b;
  if (side) b = Math.min((vh - 340) / 15.6, (Math.min(vw, 1680) - 386) / 29.4);
  else if (vw < 600) b = Math.min((vw - 38) / 22, (vh - 445) / 24.6);
  else b = Math.min((vw - 80) / 24.6, (vh - 480) / 20.5);
  return Math.max(BEAD_MIN, Math.min(BEAD_MAX, Math.floor(b)));
}

let current = 0;
export const bead = () => current || beadFor(innerWidth, innerHeight);

/** Stufe für einen Platzbedarf: größte Stufe ≤ k (k = verfügbarer/benötigter Platz). */
export function stepFor(k) {
  for (const s of STEPS) if (k >= s - 0.001) return s;
  return k; // Notlösung: stufenlos
}

export function applySizing() {
  const force = +(new URLSearchParams(location.search).get('bead') || 0);   // nur zum Kalibrieren/Testen
  const b = force || beadFor(innerWidth, innerHeight);
  if (b === current) return;
  current = b;
  const root = document.documentElement.style;
  root.setProperty('--bead', b + 'px');
  root.setProperty('--bead-1', Math.round(b * STEPS[1]) + 'px');
  root.setProperty('--bead-2', Math.round(b * STEPS[2]) + 'px');
  window.dispatchEvent(new Event('gzw:settings'));
}

export function initSizing() {
  applySizing();
  let raf = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(applySizing); });
}
