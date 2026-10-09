// Ruhige Perlen-Bewegung zwischen echten Elementen: Perlen gleiten von A nach B (konstante Größe, flacher Bogen).
import { Chain, centers, reducedMotion } from './beadfx.js?v=7';

/**
 * fromEls → toEls. Die Zielelemente werden erst sichtbar, wenn ihre Perle angekommen ist.
 * kind: Perlenart (one, ten, mate, gold, grey, s1…s9) · kindTo: Farbe wechselt unterwegs
 */
export function glide(fromEls, toEls, kind, { kindTo = null, duration = null, hideFrom = true, onDone = null, stagger = 14 } = {}) {
  const from = [...fromEls], to = [...toEls];
  if (!from.length || reducedMotion()) { onDone?.(); return null; }
  const ch = new Chain(kind, centers(from));
  if (hideFrom) from.forEach((e) => { e.style.visibility = 'hidden'; });
  to.forEach((e) => { e.style.visibility = 'hidden'; });
  ch.land(centers(to), {
    duration, kindTo, stagger,
    onBead: (i) => { if (to[i]) to[i].style.visibility = ''; },
    onDone: () => { to.forEach((e) => { e.style.visibility = ''; }); onDone?.(); },
  });
  return ch;
}

/** FLIP: Element bewegt sich ruhig von seiner alten an seine neue Stelle (nach einer DOM-Änderung). */
export function flip(el, change, { duration = 420 } = {}) {
  const r0 = el.getBoundingClientRect();
  change();
  if (reducedMotion()) return;
  const r1 = el.getBoundingClientRect();
  const k = el.offsetWidth ? r1.width / el.offsetWidth : 1; // skalierte Bühne ausgleichen
  const dx = (r0.left - r1.left) / k, dy = (r0.top - r1.top) / k;
  if (!dx && !dy) return;
  el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration, easing: 'cubic-bezier(.45,0,.25,1)' });
}
