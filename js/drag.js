// Ziehen mit Finger und Maus über Pointer Events.
// Zwei Arten: ein „Geist“ (Kopie des Elements) oder eine magnetische Perlenkette (Chain).
// Ein Ziehen beginnt erst nach ein paar Pixeln Bewegung – sonst gilt es als Tippen.

const zones = new Set();
let active = null;

export function addDropZone(el, { accepts = () => true, onDrop }) {
  const z = { el, accepts, onDrop };
  zones.add(z);
  return () => zones.delete(z);
}

export const isDragging = () => !!(active && active.moved);

export function draggable(el, opts) {
  el.classList.add('draggable');
  const down = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (active) return;
    const payload = typeof opts.payload === 'function' ? opts.payload(e) : opts.payload;
    if (!payload) return;
    e.preventDefault();
    start(e, el, payload, opts);
  };
  el.addEventListener('pointerdown', down);
  return () => el.removeEventListener('pointerdown', down);
}

function start(e, el, payload, opts) {
  const s = {
    id: e.pointerId, x0: e.clientX, y0: e.clientY, el, payload, opts, touch: e.pointerType !== 'mouse',
    ghost: null, chain: null, hover: null, moved: false, origin: null, offX: 0, offY: 0, k: 1,
  };
  active = s;

  const move = (ev) => {
    if (ev.pointerId !== s.id) return;
    ev.preventDefault();
    if (!s.moved && Math.hypot(ev.clientX - s.x0, ev.clientY - s.y0) > 7) {
      s.moved = true;
      if (opts.chain) s.chain = opts.chain(payload);
      if (!s.chain) makeGhost(s, ev);
      opts.onStart?.(payload);
      window.dispatchEvent(new CustomEvent('gzw:dragstart', { detail: payload }));
    }
    if (s.moved) {
      if (s.chain) s.chain.follow(ev.clientX, ev.clientY - (s.touch ? 34 : 0));
      else place(s, ev.clientX, ev.clientY);
      setHover(s, findZone(payload, ev.clientX, ev.clientY));
    }
  };

  const end = (ev) => {
    if (ev.pointerId !== s.id) return;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
    active = null;
    if (!s.moved) {
      if (ev.type === 'pointerup') opts.onTap?.(payload, ev);
      return;
    }
    const zone = s.hover;
    setHover(s, null);
    let ok = false;
    if (ev.type === 'pointerup') {
      const pt = { x: ev.clientX, y: ev.clientY };
      try {
        ok = zone ? zone.onDrop(payload, pt, s.chain) === true : opts.onDropOutside?.(payload, pt, s.chain) === true;
      } catch (err) { console.error(err); ok = false; }
    }
    window.dispatchEvent(new CustomEvent('gzw:dragend', { detail: payload }));
    if (s.chain) {
      if (!ok) s.chain.back(() => opts.onEnd?.(payload, false));
      else {
        if (!s.chain.used) s.chain.vanish(null);
        opts.onEnd?.(payload, true);
      }
      return;
    }
    finish(s, ok);
    opts.onEnd?.(payload, ok);
  };

  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
}

function makeGhost(s, ev) {
  const r = s.el.getBoundingClientRect();
  let g;
  const custom = s.opts.ghost ? s.opts.ghost(s.payload) : null;
  if (custom) {
    g = custom;
    document.body.append(g);
    g.classList.add('ghost');
    const gr = g.getBoundingClientRect();
    s.offX = gr.width / 2;
    s.offY = gr.height / 2 + (s.touch ? 24 : 0);
    s.origin = { x: r.left + r.width / 2 - gr.width / 2, y: r.top + r.height / 2 - gr.height / 2 };
  } else {
    // Kopie in natürlicher Größe; falls das Original skaliert dargestellt wird, Faktor übernehmen.
    g = s.el.cloneNode(true);
    g.classList.add('ghost');
    const natW = s.el.offsetWidth || r.width;
    s.k = natW ? r.width / natW : 1;
    g.style.width = natW + 'px';
    g.style.height = (s.el.offsetHeight || r.height) + 'px';
    g.style.transformOrigin = '0 0';
    document.body.append(g);
    s.offX = s.x0 - r.left;
    s.offY = s.y0 - r.top;
    s.origin = { x: r.left, y: r.top };
  }
  s.ghost = g;
  place(s, ev.clientX, ev.clientY);
}

function place(s, x, y) {
  s.ghost.style.transform = `translate(${x - s.offX}px, ${y - s.offY}px) scale(${(s.k * 1.06).toFixed(3)})`;
}

function finish(s, ok) {
  const g = s.ghost;
  if (!g) return;
  g.classList.add(ok ? 'ghost-drop' : 'ghost-return');
  if (!ok) g.style.transform = `translate(${s.origin.x}px, ${s.origin.y}px) scale(${s.k})`;
  setTimeout(() => g.remove(), ok ? 160 : 300);
}

function findZone(payload, x, y) {
  let best = null, bestArea = Infinity;
  for (const z of zones) {
    if (!z.el.isConnected || !z.accepts(payload)) continue;
    const r = z.el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      const area = r.width * r.height;
      if (area < bestArea) { best = z; bestArea = area; }
    }
  }
  return best;
}

function setHover(s, z) {
  if (s.hover === z) return;
  s.hover?.el.classList.remove('drop-hover');
  s.hover = z;
  z?.el.classList.add('drop-hover');
}
