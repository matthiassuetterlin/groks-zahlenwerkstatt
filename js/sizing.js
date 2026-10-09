// ============================================================
// EINE Größenregel für alle Perlen (v8 „Studio“)
// ------------------------------------------------------------
// --bead  = Perlendurchmesser in px. Er wird EINMAL pro Fenstergröße berechnet und gilt überall:
//           Werkstatt-Matte, Ablage im Bottom-Sheet, gezogene Perlen und alle Spiele.
//
// v8-Rahmen: oben eine schmale Kopfzeile (Zurück · Fortschritt · Edelsteine · Grok), in der Mitte die
// Glasfläche mit Held-Zahl und Spielfeld, unten das Bottom-Sheet mit den Teilen (eine echte Zehnerstange).
//
//   Querformat (≥ 900 px breit, landscape):
//       bead = min( (vh − 300) / 16.5 ,  (min(vw, 1760) − 150) / 22.6 )
//   Hochkant – Telefon (< 600 px breit):
//       bead = min( (vw − 40) / 14.6 ,   (vh − 360) / 21.6 )
//   Hochkant – Tablet:
//       bead = min( (vw − 70) / 22.6 ,   (vh − 330) / 17.5 )
//   → abgerundet und auf 14 … 46 px begrenzt.
//   Herleitung: Eine volle Werkstatt-Matte (10 Zehner-Plätze + Zehnerfelder) passt mit Held-Zahl darüber
//   und Sheet darunter in den Bildschirm; im Querformat nebeneinander (21.7 Perlen breit, 16.5 hoch inkl. Sheet),
//   auf dem Telefon untereinander (13.9 Perlen breit).
//
// Stufen: Ein Spielfeld, das bei --bead nicht in die Bühne passt (z. B. das Hunderterfeld mit 100
//   Perlen), wird NICHT stufenlos eingepasst, sondern höchstens 2 feste Stufen kleiner:
//       Stufe 1 = 0.84 · bead,  Stufe 2 = 0.7 · bead   (STEPS)
//   Erst wenn auch Stufe 2 nicht passt, wird als Notlösung stufenlos verkleinert.
// Ausnahmen: kleine Vorschaubilder (Reise-Stationen, Regel-Kärtchen, Fundstreifen) sind Symbole,
//   keine Spielperlen.
// ============================================================
export const STEPS = [1, 0.84, 0.7];
export const BEAD_MIN = 14, BEAD_MAX = 46;

export function beadFor(vw, vh) {
  const side = vw >= 900 && vw >= vh;
  let b;
  if (side) b = Math.min((vh - 300) / 16.5, (Math.min(vw, 1760) - 150) / 22.6);
  else if (vw < 600) b = Math.min((vw - 40) / 14.6, (vh - 360) / 21.6);
  else b = Math.min((vw - 70) / 22.6, (vh - 330) / 17.5);
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
