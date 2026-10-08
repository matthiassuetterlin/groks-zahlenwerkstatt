// Die Arbeitsmatte: links Zehner (ein Hunderterfeld aus Stangen), rechts Einer in Zehnerfeldern.
// Alles liegt immer geordnet – keine Haufen, die zum Abzählen verleiten.
import { h, clamp } from './util.js?v=2';
import { rod, stick, bead } from './blocks.js?v=2';
import { draggable, addDropZone } from './drag.js?v=2';

const W_UNITS = 18.1;  // Breite der Matte in Perlen-Einheiten (siehe CSS): Zehner 11.3 + Einer 6.8
const W_FIXED = 104;   // Polster, Abstände, Rahmen in px

export function createMat(host, options = {}) {
  const o = {
    tens: 0, units: 0, hundred: false,
    allowHundred: false, maxValue: 100, maxUnits: 30, slots: 10,
    interactive: true, allowRemove: true, allowAdd: true, autoBundle: false,
    fixedB: null, minB: 14, maxB: 34,
    onChange: () => {}, onLimit: () => {}, onHint: () => {},
    ...options,
  };
  const st = { tens: o.tens, units: o.units, hundred: o.hundred, grabs: 0 };
  const cleanups = [];
  let busy = false;

  // ---------- DOM ----------
  const tensCount = h('span', { class: 'zone-count' });
  const tensName = h('span', { class: 'zone-name' }, 'Zehner');
  const hundBtn = h('button', { class: 'pill pill--hun hund-btn', type: 'button' }, '10 Zehner → 1 Hunderter');
  const tensField = h('div', { class: 'tens-field' });
  const slots = [];
  for (let i = 0; i < 10; i++) { const s = h('div', { class: 'rod-slot' }); slots.push(s); tensField.append(s); }
  const zoneTens = h('div', { class: 'zone zone-tens', dataset: { zone: 'tens' } },
    h('div', { class: 'zone-head' }, tensName, tensCount, hundBtn), tensField);

  const unitsCount = h('span', { class: 'zone-count' });
  const framesEl = h('div', { class: 'frames' });
  const zoneUnits = h('div', { class: 'zone zone-units', dataset: { zone: 'units' } },
    h('div', { class: 'zone-head' }, h('span', { class: 'zone-name' }, 'Einer'), unitsCount), framesEl);

  const root = h('div', { class: 'mat' + (o.interactive ? ' is-interactive' : '') }, zoneTens, zoneUnits);
  host.append(root);
  const frames = []; // {el, cells:[], btn}

  // ---------- Größe ----------
  function fit() {
    if (o.fixedB) { root.style.setProperty('--b', o.fixedB + 'px'); return; }
    const r = host.getBoundingClientRect();
    if (!r.width) return;
    const bw = (r.width - W_FIXED) / W_UNITS;
    root.style.setProperty('--b', Math.floor(clamp(bw, o.minB, o.maxB)) + 'px');
  }
  const ro = new ResizeObserver(fit);
  ro.observe(host);
  cleanups.push(() => ro.disconnect());
  fit();

  // ---------- Darstellung ----------
  const value = () => (st.hundred ? 100 : 0) + st.tens * 10 + st.units;

  function popIn(el, i = 0) {
    el.style.setProperty('--i', i);
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  function render(fx = {}) {
    // Zehner
    const shown = st.hundred ? 10 : st.tens;
    slots.forEach((slot, i) => {
      let r = slot.firstElementChild;
      if (i < shown) {
        if (!r) {
          r = rod('ten');
          slot.append(r);
          if (o.interactive) makeRodDraggable(r);
          if (fx.newRod) { popIn(r); r.classList.add('flash'); setTimeout(() => r.classList.remove('flash'), 900); }
        }
      } else if (r) r.remove();
    });
    // In Spielen mit wenigen Zehnern nur 5 Plätze zeigen (spart Höhe), ab 5 Zehnern alle 10.
    const visible = o.slots === 'auto' ? (shown >= 5 ? 10 : 5) : 10;
    slots.forEach((slot, i) => { slot.hidden = i >= visible; });
    zoneTens.classList.toggle('is-hundred', st.hundred);
    tensName.textContent = st.hundred ? 'Hunderter' : 'Zehner';
    tensCount.textContent = st.hundred ? '1' : String(st.tens);
    hundBtn.hidden = !(o.interactive && o.allowHundred && !st.hundred && st.tens === 10);

    // Einer
    // Ein leeres Feld für Nachschub nur zeigen, wenn man auch etwas hinzulegen kann.
    const need = clamp(Math.ceil((st.units + (o.allowAdd ? 1 : 0)) / 10), 1, Math.ceil(o.maxUnits / 10));
    while (frames.length < need) addFrame();
    while (frames.length > need) frames.pop().wrap.remove();
    frames.forEach((f, fi) => {
      const inFrame = clamp(st.units - fi * 10, 0, 10);
      f.cells.forEach((c, ci) => {
        const on = ci < inFrame;
        if (on && !c.classList.contains('on')) {
          c.classList.add('on', 'on--one');
          if (fx.unitsFrom != null) popIn(c, Math.max(0, fi * 10 + ci - fx.unitsFrom));
        } else if (!on && c.classList.contains('on')) c.classList.remove('on', 'on--one', 'pop');
      });
      const full = inFrame === 10;
      f.el.classList.toggle('full', full);
      f.btn.hidden = !(full && o.interactive && !st.hundred && st.tens < 10);
    });
    unitsCount.textContent = String(st.units);
  }

  function addFrame() {
    const fi = frames.length;
    const wrap = h('div', { class: 'frame-wrap' });
    const el = h('div', { class: 'frame' });
    const cells = [];
    for (let i = 0; i < 10; i++) { const c = h('span', { class: 'cell', dataset: { i: fi * 10 + i } }); cells.push(c); el.append(c); }
    const btn = h('button', { class: 'pill pill--ten bundle-btn', type: 'button', hidden: true, 'aria-label': '10 Einer zu 1 Zehner bündeln' }, '← 1 Zehner');
    wrap.append(el, btn);
    framesEl.append(wrap);
    const f = { el, wrap, cells, btn };
    frames.push(f);
    if (o.interactive) {
      cleanups.push(draggable(btn, {
        payload: () => ({ src: 'mat', kind: 'frame', frame: frames.indexOf(f) }),
        ghost: () => wrapGhost(stick(10, 'one')),
        onTap: () => bundle(frames.indexOf(f)),
      }));
      cleanups.push(draggable(el, {
        payload: (e) => onesPayload(e),
        ghost: (p) => wrapGhost(stick(p.amount, 'one')),
        onStart: (p) => p.cells.forEach((i) => cellAt(i)?.classList.add('lifted')),
        onEnd: (p) => p.cells.forEach((i) => cellAt(i)?.classList.remove('lifted')),
        onDropOutside: (p) => removeOnes(p.amount),
      }));
    }
  }

  const cellAt = (i) => frames[Math.floor(i / 10)]?.cells[i % 10];

  // Greift man eine Perle, nimmt man sie und alle rechts davon in derselben Fünferreihe (wie am Rechenrahmen).
  function onesPayload(e) {
    const cell = e.target.closest('.cell');
    if (!cell || !cell.classList.contains('on') || busy) return null;
    const i = +cell.dataset.i;
    const rowStart = Math.floor(i / 5) * 5;
    const inRow = clamp(st.units - rowStart, 0, 5);
    const col = i - rowStart;
    if (col >= inRow) return null;
    const amount = inRow - col;
    const cells = [];
    for (let k = i; k < rowStart + inRow; k++) cells.push(k);
    return { src: 'mat', kind: 'ones', amount, cells };
  }

  function makeRodDraggable(r) {
    cleanups.push(draggable(r, {
      payload: () => (busy ? null : st.hundred ? { src: 'mat', kind: 'hundred' } : { src: 'mat', kind: 'ten' }),
      ghost: (p) => (p.kind === 'hundred' ? wrapGhost(plateGhost()) : null),
      onStart: (p) => (p.kind === 'hundred' ? zoneTens.classList.add('lifted-all') : r.classList.add('lifted')),
      onEnd: () => { r.classList.remove('lifted'); zoneTens.classList.remove('lifted-all'); },
      onDropOutside: (p) => (p.kind === 'hundred' ? removeHundred() : removeTen()),
    }));
  }

  function wrapGhost(child) {
    const g = h('div', { class: 'ghost-wrap' }, child);
    g.style.setProperty('--b', getComputedStyle(root).getPropertyValue('--b'));
    return g;
  }
  function plateGhost() {
    const p = h('div', { class: 'plate-ghost' });
    for (let i = 0; i < 10; i++) p.append(rod('hun'));
    return p;
  }

  // ---------- Ablegen ----------
  if (o.interactive) {
    const accepts = (p) => p.src === 'tray' || p.src === 'mat';
    cleanups.push(addDropZone(zoneTens, { accepts, onDrop: (p) => dropOn('tens', p) }));
    cleanups.push(addDropZone(zoneUnits, { accepts, onDrop: (p) => dropOn('units', p) }));
    hundBtn.addEventListener('click', bundleHundred);
  }

  function dropOn(zone, p) {
    if (p.src === 'tray') return add(p.amount);
    if (p.kind === 'ten' && zone === 'units') return unbundle();
    if (p.kind === 'hundred' && zone === 'tens') return false;
    if (p.kind === 'hundred' && zone === 'units') { o.onHint('hundred-to-units'); return false; }
    if (p.kind === 'frame' && zone === 'tens') return bundle(p.frame);
    if (p.kind === 'ones' && zone === 'tens') { o.onHint('ones-to-tens'); return false; }
    return false;
  }

  // ---------- Aktionen ----------
  function emit(type, amount) {
    o.onChange({ ...st, value: value() }, { type, amount });
    if (o.autoBundle && st.units >= 10 && st.tens < 10 && !st.hundred) setTimeout(() => bundle(0), 650);
  }

  function add(amount) {
    if (!o.allowAdd || busy) return false;
    if (value() + amount > o.maxValue) { o.onLimit('max'); return false; }
    if (amount === 10) {
      if (st.hundred || st.tens >= 10) { o.onLimit('tens'); return false; }
      st.tens++; st.grabs++;
      render({ newRod: true });
    } else {
      if (st.units + amount > o.maxUnits) { o.onLimit('units'); return false; }
      const from = st.units;
      st.units += amount; st.grabs++;
      render({ unitsFrom: from });
    }
    emit('add', amount);
    return true;
  }

  function removeTen() {
    if (!o.allowRemove || st.tens < 1) return false;
    st.tens--; render(); emit('remove', 10); return true;
  }
  function removeHundred() {
    if (!o.allowRemove || !st.hundred) return false;
    st.hundred = false; render(); emit('remove', 100); return true;
  }
  function removeOnes(n) {
    if (!o.allowRemove || n > st.units) return false;
    st.units -= n; render(); emit('remove', n); return true;
  }

  function bundle(fi = 0) {
    if (busy || st.units < 10 || st.tens >= 10 || st.hundred) return false;
    const f = frames[clamp(fi, 0, frames.length - 1)];
    if (!f || !f.el.classList.contains('full')) return false;
    busy = true;
    f.wrap.classList.add('bundling');
    f.el.classList.add('bundling');
    setTimeout(() => {
      f.wrap.classList.remove('bundling');
      f.el.classList.remove('bundling');
      st.units -= 10; st.tens++;
      busy = false;
      render({ newRod: true });
      emit('bundle', 10);
    }, 420);
    return true;
  }

  function unbundle() {
    if (busy || st.tens < 1) return false;
    if (st.units + 10 > o.maxUnits) { o.onLimit('units'); return false; }
    const from = st.units;
    st.tens--; st.units += 10;
    render({ unitsFrom: from });
    emit('unbundle', 10);
    return true;
  }

  function bundleHundred() {
    if (st.tens !== 10 || st.units !== 0) return;
    st.tens = 0; st.hundred = true;
    zoneTens.classList.add('flash-zone');
    setTimeout(() => zoneTens.classList.remove('flash-zone'), 900);
    render(); emit('bundle100', 100);
  }

  render();

  return {
    el: root,
    get state() { return { ...st, value: value() }; },
    value,
    add, bundle, unbundle, bundleHundred,
    set(next = {}) {
      Object.assign(st, { tens: 0, units: 0, hundred: false }, next);
      render({ unitsFrom: 0, newRod: false });
    },
    resetGrabs() { st.grabs = 0; },
    setOption(k, v) { o[k] = v; render(); if (k === 'autoBundle' && v) emit('noop', 0); },
    fit,
    destroy() { cleanups.forEach((f) => f()); root.remove(); },
  };
}

/** Die Kiste mit Material zum Herausziehen (Zehner, Fünfer, Einer). */
export function createTray(host, { pieces = [10, 5, 1], onTap = () => {} } = {}) {
  const names = { 10: 'Zehner', 5: 'Fünfer', 1: 'Einer' };
  const el = h('div', { class: 'tray' });
  const hint = h('div', { class: 'tray-trash' }, 'Hierher = wegräumen');
  const cleanups = [];
  for (const n of pieces) {
    const vis = n === 10 ? rod('ten') : n === 1 ? h('div', { class: 'stick stick--one' }, bead('one')) : stick(n, 'one');
    const piece = h('button', { class: `piece piece--${n}`, type: 'button', 'aria-label': names[n] }, h('div', { class: 'piece-vis' }, vis), h('span', { class: 'piece-name' }, names[n]));
    cleanups.push(draggable(piece, {
      payload: { src: 'tray', amount: n },
      ghost: () => { const g = h('div', { class: 'ghost-wrap' }, vis.cloneNode(true)); g.style.setProperty('--b', getComputedStyle(piece).getPropertyValue('--b')); return g; },
      onTap: () => onTap(n),
    }));
    el.append(piece);
  }
  el.append(hint);
  host.append(el);
  // Etwas von der Matte hierher (oder irgendwo neben die Matte) ziehen = wegräumen.
  const ds = (e) => { if (e.detail?.src === 'mat') el.classList.add('trash-mode'); };
  const de = () => el.classList.remove('trash-mode');
  window.addEventListener('gzw:dragstart', ds);
  window.addEventListener('gzw:dragend', de);
  cleanups.push(() => { window.removeEventListener('gzw:dragstart', ds); window.removeEventListener('gzw:dragend', de); });
  return { el, destroy() { cleanups.forEach((f) => f()); el.remove(); } };
}
