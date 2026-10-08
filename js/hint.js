// Geister-Hinweis: Eine blasse Hand zeigt beim ersten Mal, was zu tun ist (Ziehen oder Tippen).
// Einmal pro Spiel gezeigt (gemerkt im Browser), verschwindet bei der ersten Berührung.
import { getSetting, setSetting } from './store.js?v=5';
import { ICON_HAND } from './icons.js?v=5';
import { reducedMotion } from './beadfx.js?v=5';

let current = null;

export function stopHint() { current?.(); current = null; }

/**
 * @param {string} key  eindeutiger Name
 * @param {() => Element} from  Startelement (wird zum Zeitpunkt des Zeigens gelesen)
 * @param {() => Element|null} to  Ziel (null = Tippen auf „from“)
 */
export function handHint(key, from, to = null, { delay = 900, force = false, carry = null } = {}) {
  const seen = getSetting('hints', {}) || {};
  if (seen[key] && !force) return () => {};
  let hand = null, target = null, anims = [], timer = null, dead = false;
  const stop = () => {
    if (dead) return;
    dead = true;
    clearTimeout(timer);
    anims.forEach((a) => a.cancel());
    hand?.remove();
    target?.classList.remove('hint-target');
    document.removeEventListener('pointerdown', stop, true);
    if (current === stop) current = null;
  };
  timer = setTimeout(() => {
    const a = from(), b = to ? to() : null;
    if (!a || !a.isConnected || (to && (!b || !b.isConnected))) { stop(); return; }
    stopHint();
    current = stop;
    setSetting('hints', { ...(getSetting('hints', {}) || {}), [key]: 1 });
    const ra = a.getBoundingClientRect();
    const p0 = { x: ra.left + ra.width / 2, y: ra.top + ra.height / 2 };
    let p1 = p0;
    if (b) {
      target = b;
      b.classList.add('hint-target');
      const rb = b.getBoundingClientRect();
      p1 = { x: rb.left + rb.width / 2, y: rb.top + rb.height / 2 };
    }
    hand = document.createElement('div');
    hand.className = 'hint-hand';
    hand.innerHTML = ICON_HAND;
    // Beim Ziehen trägt die Hand ein blasses Abbild dessen, was gezogen wird
    const c = b && carry ? carry() : null;
    if (c) { const g = c.cloneNode(true); g.classList.add('hint-carry'); hand.prepend(g); }
    document.body.append(hand);
    // Fingerspitze sitzt oben links im Symbol (ca. 22/48, 4/56)
    const at = (p, s = 1) => `translate(${(p.x - 22).toFixed(1)}px, ${(p.y - 4).toFixed(1)}px) scale(${s})`;
    if (reducedMotion()) {
      hand.style.transform = at(b ? p1 : p0);
      hand.style.opacity = '.85';
      timer = setTimeout(stop, 3500);
      return;
    }
    const frames = b
      ? [
        { transform: at(p0), opacity: 0, offset: 0 },
        { transform: at(p0), opacity: 0.9, offset: 0.12 },
        { transform: at(p0, 0.88), opacity: 0.9, offset: 0.22 },
        { transform: at(p1, 0.88), opacity: 0.9, offset: 0.72, easing: 'ease-in-out' },
        { transform: at(p1), opacity: 0.9, offset: 0.82 },
        { transform: at(p1), opacity: 0, offset: 1 },
      ]
      : [
        { transform: at(p0), opacity: 0, offset: 0 },
        { transform: at(p0), opacity: 0.9, offset: 0.2 },
        { transform: at(p0, 0.86), opacity: 0.9, offset: 0.35 },
        { transform: at(p0), opacity: 0.9, offset: 0.5 },
        { transform: at(p0, 0.86), opacity: 0.9, offset: 0.65 },
        { transform: at(p0), opacity: 0.9, offset: 0.8 },
        { transform: at(p0), opacity: 0, offset: 1 },
      ];
    const anim = hand.animate(frames, { duration: b ? 1900 : 1600, iterations: 2, easing: 'ease-in-out' });
    anims.push(anim);
    anim.onfinish = stop;
  }, delay);
  document.addEventListener('pointerdown', stop, true);
  return stop;
}
