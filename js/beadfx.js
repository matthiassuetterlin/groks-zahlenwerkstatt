// Perlen-Physik: magnetische Kette beim Ziehen (Federn) und Bogen-Landung mit kleinem Hüpfer.
// Alles läuft über transform (translate3d/scale) auf einer festen Ebene – flüssig mit 60 fps.
// Bei „Bewegung reduzieren“ folgen die Perlen starr und landen ohne Flug.

const reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
export const reducedMotion = () => reduceMQ.matches;

const BASE = 40; // Grundgröße der Effekt-Perlen in px (skaliert per transform)
let layer = null;
function fxLayer() {
  if (!layer || !layer.isConnected) {
    layer = document.createElement('div');
    layer.className = 'fx-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
  }
  return layer;
}

/** Mittelpunkte + Breite von Elementen (Viewport-Koordinaten). */
export function centers(els) {
  return [...els].map((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
  });
}

const tf = (x, y, sx, sy = sx) => `translate3d(${(x - BASE / 2).toFixed(1)}px, ${(y - BASE / 2).toFixed(1)}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;

export class Chain {
  /**
   * @param {string} kind  one | ten | mate | hun
   * @param {{x,y,w}[]} from  Startpositionen (z. B. die echten Perlen, die man greift)
   * @param {{size?: number}} opts  Zielgröße beim Ziehen (px)
   */
  constructor(kind, from, { size = null } = {}) {
    this.kind = kind;
    this.origin = from.map((r) => ({ ...r }));
    this.size = size || (from[0]?.w ?? 28);
    this.size = Math.max(18, Math.min(46, this.size));
    this.used = false;
    this.running = false;
    this.tx = from[0]?.x ?? 0;
    this.ty = from[0]?.y ?? 0;
    this.dir = { x: -1, y: 0 };
    const L = fxLayer();
    this.beads = from.map((r) => {
      const el = document.createElement('span');
      el.className = `fx-bead bead bead--${kind}`;
      L.append(el);
      const b = { el, x: r.x, y: r.y, vx: 0, vy: 0, s: r.w / BASE };
      el.style.transform = tf(b.x, b.y, b.s);
      return b;
    });
    this._tick = this._tick.bind(this);
  }

  get count() { return this.beads.length; }

  /** Ziel der ersten Perle (Finger/Maus). */
  follow(x, y) {
    this.tx = x; this.ty = y;
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame(this._tick);
    }
  }

  _tick(t) {
    if (!this.running) return;
    const dt = Math.min(2.2, (t - this.last) / 16.67);
    this.last = t;
    const sTarget = this.size / BASE;
    const gap = this.size * 1.04;
    const rigid = reducedMotion();
    let prev = null;
    this.beads.forEach((b, i) => {
      let tx, ty;
      if (i === 0) { tx = this.tx; ty = this.ty; }
      else {
        let dx = prev.x - b.x, dy = prev.y - b.y;
        const len = Math.hypot(dx, dy);
        if (len > 0.5) { dx /= len; dy /= len; if (i === 1) this.dir = { x: dx, y: dy }; }
        else { dx = this.dir.x; dy = this.dir.y; }
        tx = prev.x - dx * gap; ty = prev.y - dy * gap;
      }
      if (rigid) {
        b.x = i === 0 ? tx : prev.x - gap; b.y = i === 0 ? ty : prev.y;
        b.vx = b.vy = 0;
      } else {
        const k = i === 0 ? 0.42 : 0.3;   // Federhärte
        const damp = Math.pow(0.68, dt);   // Dämpfung
        b.vx = (b.vx + (tx - b.x) * k * dt) * damp;
        b.vy = (b.vy + (ty - b.y) * k * dt) * damp;
        b.x += b.vx * dt; b.y += b.vy * dt;
      }
      b.s += (sTarget - b.s) * Math.min(1, 0.25 * dt);
      // leichtes Strecken in Bewegungsrichtung – wirkt magnetisch-weich
      const sp = Math.min(0.12, Math.hypot(b.vx, b.vy) / 160);
      b.el.style.transform = tf(b.x, b.y, b.s * (1 + sp), b.s * (1 - sp * 0.6));
      prev = b;
    });
    this.raf = requestAnimationFrame(this._tick);
  }

  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  /**
   * Bogen-Landung: jede Perle fliegt (versetzt) zu ihrem Ziel und hüpft kurz.
   * targets: {x,y,w}[] – fehlt ein Ziel, verschwindet die Perle sanft.
   */
  land(targets, { stagger = 26, duration = 460, fade = false, kindTo = null, onBead = null, onDone = null } = {}) {
    this.used = true;
    this.stop();
    const n = this.beads.length;
    let left = n;
    const finishOne = (i) => {
      onBead?.(i);
      this.beads[i].el.remove();
      if (--left === 0) onDone?.();
    };
    if (!n) { onDone?.(); return; }
    if (reducedMotion()) {
      this.beads.forEach((_, i) => finishOne(i));
      return;
    }
    this.beads.forEach((b, i) => {
      const to = targets[i] || targets[targets.length - 1] || { x: b.x, y: b.y + 40, w: 0 };
      const s0 = b.s, s1 = (to.w || 0.01) / BASE;
      const dist = Math.hypot(to.x - b.x, to.y - b.y);
      const lift = Math.min(140, 26 + dist * 0.32);
      const frames = [];
      const steps = 10;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
        const x = b.x + (to.x - b.x) * e;
        const y = b.y + (to.y - b.y) * e - lift * 4 * t * (1 - t);
        const s = s0 + (s1 - s0) * e;
        frames.push({ transform: tf(x, y, s), opacity: fade ? 1 - 0.9 * t * t : 1, offset: t * 0.74 });
      }
      if (!fade) {
        // kleiner Hüpfer: plattdrücken, hoch, setzen
        frames.push({ transform: tf(to.x, to.y + s1 * BASE * 0.06, s1 * 1.14, s1 * 0.84), offset: 0.82 });
        frames.push({ transform: tf(to.x, to.y - s1 * BASE * 0.16, s1 * 0.96, s1 * 1.05), offset: 0.92 });
        frames.push({ transform: tf(to.x, to.y, s1), offset: 1 });
      } else {
        frames.push({ transform: tf(to.x, to.y, s1 * 0.4), opacity: 0, offset: 1 });
      }
      const anim = b.el.animate(frames, { duration, delay: i * stagger, easing: 'linear', fill: 'forwards' });
      // Farbwechsel mitten im Flug (Einer werden zum Zehner und umgekehrt)
      if (kindTo) setTimeout(() => { b.el.className = `fx-bead bead bead--${kindTo}`; }, i * stagger + duration * 0.38);
      anim.onfinish = () => finishOne(i);
      anim.oncancel = () => finishOne(i);
    });
  }

  /** Sofort entfernen (ohne Flug). */
  dispose() { this.used = true; this.stop(); this.beads.forEach((b) => b.el.remove()); }

  /** Zurück an den Ursprung (z. B. wenn das Ablegen nicht passt). */
  back(onDone) { this.land(this.origin, { stagger: 14, duration: 380, onDone }); }

  /** Sanft zu einem Punkt fliegen und verschwinden (Wegräumen). */
  vanish(to, onDone) {
    const t = to || { x: this.beads[0]?.x ?? 0, y: (this.beads[0]?.y ?? 0) + 60, w: 10 };
    this.land(this.beads.map(() => t), { stagger: 18, duration: 420, fade: true, onDone });
  }
}
