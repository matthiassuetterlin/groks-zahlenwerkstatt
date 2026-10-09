// Perlen-Physik: plastische Perlen (Schattierung per CSS), ruhig wie echte Perlen an einer Schnur.
// Nie verzerrt: keine Stauchung, keine Dehnung, keine Größenänderung während der Bewegung.
// – Ziehen: die gegriffene Perle folgt dem Finger kritisch gedämpft (kein Überschwingen),
//   die anderen folgen ihrer Nachbarin mit etwas mehr Verzögerung und hängen leicht durch.
//   Keine Verzerrung, kein Pumpen: jede Perle behält ihre Größe.
// – Ablegen: alle Perlen gleiten gemeinsam in einem flachen Bogen an ihren Platz und setzen sanft auf.
// Alles läuft über transform: translate3d auf einer festen Ebene. „Bewegung reduzieren“: starr, ohne Flug.

const reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
export const reducedMotion = () => reduceMQ.matches;

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

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // weich anfahren, weich aufsetzen
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const smooth = (rate, dt) => 1 - Math.exp(-rate * dt); // kritisch gedämpfter Folger 1. Ordnung

export class Chain {
  /**
   * @param {string} kind  one | ten | mate | hun
   * @param {{x,y,w}[]} from  Startpositionen (die echten Perlen, die man greift)
   * @param {{size?: number}} opts  Größe beim Ziehen (px) – Standard: Größe der Quelle
   */
  constructor(kind, from, { size = null } = {}) {
    this.kind = kind;
    this.origin = from.map((r) => ({ ...r }));
    const w0 = from[0]?.w || 28;
    this.size0 = w0;
    this.size = size || w0;     // Zielgröße beim Ziehen (Matte); gleich der Quelle = keine Änderung
    this.cur = w0;
    this.t0 = performance.now();
    this.used = false;
    this.running = false;
    this.held = 0;
    this.off = { x: 0, y: 0 };
    // Form der Kette merken (relativ zur ersten Perle, in Perlen-Einheiten)
    this.rest = from.map((r) => ({ x: (r.x - from[0].x) / w0, y: (r.y - from[0].y) / w0 }));
    this.tx = from[0]?.x ?? 0;
    this.ty = from[0]?.y ?? 0;
    const L = fxLayer();
    this.beads = from.map((r) => {
      const el = document.createElement('span');
      el.className = `fx-bead bead bead--${kind}`;
      L.append(el);
      const b = { el, x: r.x, y: r.y, w: -1 };
      this._paint(b);
      return b;
    });
    this.order = this.beads.map((_, i) => i);
    this._tick = this._tick.bind(this);
  }

  get count() { return this.beads.length; }

  _paint(b, w = this.cur) {
    if (b.w !== w) {
      b.w = w;
      b.el.style.width = b.el.style.height = w.toFixed(2) + 'px';
      b.el.style.setProperty('--b', w.toFixed(2) + 'px');
    }
    b.el.style.transform = `translate3d(${(b.x - w / 2).toFixed(2)}px, ${(b.y - w / 2).toFixed(2)}px, 0)`;
  }

  setKind(kind) {
    this.kind = kind;
    this.beads.forEach((b) => { b.el.className = `fx-bead bead bead--${kind}`; });
  }

  /** Wo wurde gegriffen? Die nächste Perle wird „gehalten“, die anderen hängen an ihr. */
  grab(x, y) {
    let best = 0, bd = Infinity;
    this.beads.forEach((b, i) => { const d = Math.hypot(b.x - x, b.y - y); if (d < bd) { bd = d; best = i; } });
    this.held = best;
    const hb = this.beads[best];
    const max = this.cur * 0.5;
    let ox = hb.x - x, oy = hb.y - y;
    const len = Math.hypot(ox, oy);
    if (len > max) { ox *= max / len; oy *= max / len; }
    this.off = { x: ox, y: oy };
    // Reihenfolge: von der gehaltenen Perle nach außen
    this.order = this.beads.map((_, i) => i).sort((a, b) => Math.abs(a - best) - Math.abs(b - best));
  }

  /** Ziel der gehaltenen Perle (Finger/Maus). */
  follow(x, y) {
    this.tx = x + this.off.x; this.ty = y + this.off.y;
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame(this._tick);
    }
  }

  _tick(t) {
    if (!this.running) return;
    const dt = Math.min(0.05, Math.max(0.001, (t - this.last) / 1000));
    this.last = t;
    // Größe: nur wenn Quelle und Ziel verschieden sind, einmal weich angleichen (kein Pumpen)
    if (this.cur !== this.size) {
      const k = Math.min(1, (t - this.t0) / 260);
      this.cur = this.size0 + (this.size - this.size0) * easeOut(k);
      if (k >= 1) this.cur = this.size;
    }
    const s = this.cur;
    const rigid = reducedMotion();
    const h = this.held;
    for (const i of this.order) {
      const b = this.beads[i];
      if (i === h) {
        if (rigid) { b.x = this.tx; b.y = this.ty; }
        else { const a = smooth(30, dt); b.x += (this.tx - b.x) * a; b.y += (this.ty - b.y) * a; }
      } else {
        const j = i < h ? i + 1 : i - 1;   // Nachbarin Richtung gehaltene Perle
        const nb = this.beads[j];
        const d = Math.abs(i - h);
        const sag = rigid ? 0 : s * 0.014 * d; // leichtes Durchhängen wie an einer Schnur
        const tx = nb.x + (this.rest[i].x - this.rest[j].x) * s;
        const ty = nb.y + (this.rest[i].y - this.rest[j].y) * s + sag;
        if (rigid) { b.x = tx; b.y = ty; }
        else {
          const a = smooth(Math.max(10, 26 * Math.pow(0.88, d)), dt);
          b.x += (tx - b.x) * a; b.y += (ty - b.y) * a;
          // nie zu weit auseinander oder übereinander: sanfte Begrenzung
          const ex = b.x - tx, ey = b.y - ty, e = Math.hypot(ex, ey), lim = s * 0.42;
          if (e > lim) { b.x = tx + ex * lim / e; b.y = ty + ey * lim / e; }
        }
      }
      this._paint(b, s);
    }
    this.raf = requestAnimationFrame(this._tick);
  }

  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  /**
   * Ablegen: alle Perlen gleiten zusammen in einem flachen Bogen an ihr Ziel und setzen sanft auf.
   * targets: {x,y,w}[] · keep: Perlen danach behalten (für mehrstufige Bewegungen)
   */
  land(targets, { stagger = 14, duration = null, fade = false, keep = false, lift = null, ease = 'inout',
    kindTo = null, kindAt = 0.45, onBead = null, onDone = null } = {}) {
    this.used = true;
    this.stop();
    const n = this.beads.length;
    if (!n) { onDone?.(); return; }
    const plan = this.beads.map((b, i) => {
      const to = targets[i] || targets[targets.length - 1] || { x: b.x, y: b.y + 40, w: b.w };
      return { b, x0: b.x, y0: b.y, w0: b.w > 0 ? b.w : this.cur, x1: to.x, y1: to.y, w1: fade ? this.cur : (to.w || this.cur), done: false };   // Wegräumen: gleiche Größe, nur ausblenden
    });
    const avg = plan.reduce((s, p) => s + Math.hypot(p.x1 - p.x0, p.y1 - p.y0), 0) / n;
    const D = duration ?? Math.max(340, Math.min(620, 300 + avg * 0.42));
    const H = lift ?? Math.min(34, avg * 0.14);
    const order = this.order.slice().sort((a, b) => a - b);
    const finishAll = () => {
      if (!keep) this.beads.forEach((b) => b.el.remove());
      else this.cur = plan[0].w1;
      onDone?.();
    };
    if (reducedMotion()) {
      plan.forEach((p, i) => { p.b.x = p.x1; p.b.y = p.y1; this._paint(p.b, p.w1); onBead?.(i); });
      if (kindTo) this.setKind(kindTo);
      finishAll();
      return;
    }
    const start = performance.now();
    let left = n, kindDone = !kindTo;
    const step = (t) => {
      if (!kindDone && t - start > D * kindAt) { kindDone = true; this.setKind(kindTo); }
      order.forEach((i, k) => {
        const p = plan[i];
        if (p.done) return;
        const raw = Math.min(1, Math.max(0, (t - start - k * stagger) / D));
        const e = ease === 'out' ? easeOut(raw) : easeInOut(raw);
        p.b.x = p.x0 + (p.x1 - p.x0) * e;
        p.b.y = p.y0 + (p.y1 - p.y0) * e - H * Math.sin(Math.PI * e);
        const w = p.w0 + (p.w1 - p.w0) * e;
        this._paint(p.b, w);
        if (fade) p.b.el.style.opacity = String(1 - Math.max(0, (raw - 0.55) / 0.45));
        if (raw >= 1) { p.done = true; onBead?.(i); left--; }
      });
      if (left > 0) this.raf = requestAnimationFrame(step);
      else finishAll();
    };
    this.raf = requestAnimationFrame(step);
  }

  /** Sofort entfernen (ohne Flug). */
  dispose() { this.used = true; this.stop(); this.beads.forEach((b) => b.el.remove()); }

  /** Zurück an den Ursprung (z. B. wenn das Ablegen nicht passt). */
  back(onDone) { this.land(this.origin, { onDone }); }

  /** Sanft zu einem Punkt gleiten und verblassen (Wegräumen). */
  vanish(to, onDone) {
    // Perlen bleiben gleich groß und laufen in ihrer Form zum Ziel, während sie ausblenden – kein Schrumpfen
    const c = this.beads.reduce((a, b) => ({ x: a.x + b.x / this.beads.length, y: a.y + b.y / this.beads.length }), { x: 0, y: 0 });
    const t = to || { x: c.x, y: c.y + 50 };
    this.land(this.beads.map((b) => ({ x: t.x + (b.x - c.x) * 0.5, y: t.y + (b.y - c.y) * 0.5, w: this.cur })), { fade: true, duration: 420, onDone });
  }
}
