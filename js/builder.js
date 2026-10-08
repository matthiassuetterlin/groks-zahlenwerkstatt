// Der Baukasten – eine Komponente für Werkstatt, „Lege die Zahl“, „Plus mit Struktur“ und „Bündeln“.
// Matte: links Zehner (Hunderterfeld aus Stangen), rechts Einer in Zehnerfeldern.
// Auswahl: große Karten für Zehner, Fünfer, Einer. Alles fliegt als einzelne Perlen (Kette) – nie als Päckchen.
import { h, clamp } from './util.js?v=3';
import { bead } from './blocks.js?v=3';
import { draggable, addDropZone } from './drag.js?v=3';
import { Chain, centers } from './beadfx.js?v=3';

const NAMES = { 10: 'Zehner', 5: 'Fünfer', 1: 'Einer' };
const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);

export function createBuilder({ matHost, pickerHost = null, pieces = [10, 5, 1], ...options }) {
  const o = {
    tens: 0, units: 0, hundred: false,
    allowHundred: false, maxValue: 100, maxUnits: 30, slots: 10,
    allowAdd: true, allowRemove: true, autoBundle: false,
    minB: 12, maxB: 58,
    onChange: () => {}, onLimit: () => {}, onHint: () => {},
    ...options,
  };
  const st = { tens: o.tens, units: o.units, hundred: o.hundred, grabs: 0 };
  const cleanups = [];
  let autoTimer = null;
  let alive = true;

  // ---------- Matte ----------
  const tensCount = h('span', { class: 'zone-count' });
  const tensName = h('span', { class: 'zone-name' }, 'Zehner');
  const hundBtn = h('button', { class: 'pill pill--hun hund-btn', type: 'button' }, '10 Zehner → 1 Hunderter');
  const tensField = h('div', { class: 'tens-field' });
  const slots = range(0, 10).map(() => { const s = h('div', { class: 'rod-slot' }); tensField.append(s); return s; });
  const zoneTens = h('div', { class: 'zone zone-tens' }, h('div', { class: 'zone-head' }, tensName, hundBtn, tensCount), tensField);

  const unitsCount = h('span', { class: 'zone-count' });
  const framesEl = h('div', { class: 'frames' });
  const bundleBtn = h('button', { class: 'pill pill--ten bundle-btn', type: 'button', hidden: true, 'aria-label': '10 Einer zu 1 Zehner bündeln' }, '← 1 Zehner');
  const zoneUnits = h('div', { class: 'zone zone-units' }, h('div', { class: 'zone-head' }, h('span', { class: 'zone-name' }, 'Einer'), bundleBtn, unitsCount), framesEl);
  const firstFull = () => frames.findIndex((f) => f.el.classList.contains('full'));
  cleanups.push(draggable(bundleBtn, {
    payload: () => (firstFull() < 0 ? null : { src: 'mat', kind: 'frame', frame: firstFull() }),
    chain: (p) => new Chain('one', centers(frames[p.frame].cells), { size: bPx() }),
    onStart: (p) => frames[p.frame]?.cells.forEach((c) => c.classList.add('lifted')),
    onEnd: () => frames.forEach((f) => f.cells.forEach((c) => c.classList.remove('lifted'))),
    onTap: () => bundle(firstFull()),
  }));
  bundleBtn.addEventListener('click', (e) => { if (e.detail === 0) bundle(firstFull()); });

  const root = h('div', { class: 'bmat', dataset: { mode: 'row' } }, zoneTens, zoneUnits);
  matHost.classList.add('bmat-host');
  matHost.append(root);
  const frames = [];

  const bPx = () => parseFloat(root.style.getPropertyValue('--b')) || 28;
  const value = () => (st.hundred ? 100 : 0) + st.tens * 10 + st.units;
  const cellAt = (i) => frames[Math.floor(i / 10)]?.cells[i % 10];
  const rodAt = (i) => slots[i]?.firstElementChild;

  // ---------- Größe: größtmögliche Perlen, Matte nebeneinander oder untereinander ----------
  function fits(mode, b, W, H) {
    root.dataset.mode = mode;
    root.style.setProperty('--b', b + 'px');
    return root.offsetWidth <= W && root.offsetHeight <= H;
  }
  function fit() {
    const W = matHost.clientWidth - 12, H = matHost.clientHeight - 12; // Luft für Schatten und Hover-Ring
    if (!W || !H) return;
    let best = null;
    for (const mode of ['row', 'col']) {
      let lo = o.minB, hi = o.maxB;
      if (!fits(mode, lo, W, H)) continue;
      if (fits(mode, hi, W, H)) lo = hi;
      while (hi - lo > 0.75) { const mid = (lo + hi) / 2; if (fits(mode, mid, W, H)) lo = mid; else hi = mid; }
      if (!best || lo > best.b + 0.5) best = { mode, b: lo };
    }
    if (!best) best = { mode: W > H ? 'row' : 'col', b: o.minB };
    root.dataset.mode = best.mode;
    root.style.setProperty('--b', Math.floor(best.b) + 'px');
    root.classList.add('is-fitted');
  }
  const ro = new ResizeObserver(() => fit());
  ro.observe(matHost);
  const onSettings = () => fit();
  window.addEventListener('gzw:settings', onSettings);
  cleanups.push(() => { ro.disconnect(); window.removeEventListener('gzw:settings', onSettings); });

  // ---------- Darstellung ----------
  let structure = '';
  function render() {
    const shown = st.hundred ? 10 : st.tens;
    slots.forEach((slot, i) => {
      let r = slot.firstElementChild;
      if (i < shown) { if (!r) slot.append(makeRod()); }
      else if (r) r.remove();
    });
    const visible = o.slots === 'auto' ? (shown >= 5 ? 10 : 5) : 10;
    slots.forEach((slot, i) => { slot.hidden = i >= visible; });
    zoneTens.classList.toggle('is-hundred', st.hundred);
    tensName.textContent = st.hundred ? 'Hunderter' : 'Zehner';
    tensCount.textContent = st.hundred ? '100' : String(st.tens);
    const canHund = o.allowHundred && ((!st.hundred && st.tens === 10 && st.units === 0) || st.hundred);
    hundBtn.hidden = !canHund;
    hundBtn.textContent = st.hundred ? '1 Hunderter → 10 Zehner' : '10 Zehner → 1 Hunderter';

    const need = clamp(Math.ceil((st.units + (o.allowAdd ? 1 : 0)) / 10), 1, Math.ceil(o.maxUnits / 10));
    while (frames.length < need) addFrame();
    while (frames.length > need) frames.pop().wrap.remove();
    frames.forEach((f, fi) => {
      const inFrame = clamp(st.units - fi * 10, 0, 10);
      f.cells.forEach((c, ci) => {
        const on = ci < inFrame;
        if (on) c.classList.add('on', 'on--one');
        else c.classList.remove('on', 'on--one', 'incoming', 'lifted');
      });
      f.el.classList.toggle('full', inFrame === 10);
    });
    bundleBtn.hidden = !(st.units >= 10 && !st.hundred && st.tens < 10);
    unitsCount.textContent = String(st.units);
    const s = `${visible}|${frames.length}|${hundBtn.hidden}|${bundleBtn.hidden}`;
    if (s !== structure) { structure = s; fit(); }
  }

  function makeRod() {
    const r = h('div', { class: 'rod rod--ten' });
    for (let i = 0; i < 10; i++) r.append(bead('ten'));
    cleanups.push(draggable(r, {
      payload: () => (st.hundred ? { src: 'mat', kind: 'hundred' } : { src: 'mat', kind: 'ten', rod: r }),
      chain: (p) => (p.kind === 'ten' ? new Chain('ten', centers(r.children), { size: bPx() }) : null),
      ghost: (p) => (p.kind === 'hundred' ? plateGhost() : null),
      onStart: (p) => (p.kind === 'hundred' ? zoneTens.classList.add('lifted-all') : r.classList.add('lifted')),
      onEnd: () => { r.classList.remove('lifted'); zoneTens.classList.remove('lifted-all'); },
      onDropOutside: (p, pt, chain) => (p.kind === 'hundred' ? removeHundred() : removeTen(chain)),
    }));
    return r;
  }

  function addFrame() {
    const fi = frames.length;
    const wrap = h('div', { class: 'frame-wrap' });
    const el = h('div', { class: 'frame' });
    const cells = range(0, 10).map((i) => { const c = h('span', { class: 'cell', dataset: { i: fi * 10 + i } }); el.append(c); return c; });
    wrap.append(el);
    framesEl.append(wrap);
    const f = { el, wrap, cells };
    frames.push(f);
    cleanups.push(draggable(el, {
      payload: (e) => onesPayload(e),
      chain: (p) => new Chain('one', centers(p.cells.map(cellAt)), { size: bPx() }),
      onStart: (p) => p.cells.forEach((i) => cellAt(i)?.classList.add('lifted')),
      onEnd: (p) => p.cells.forEach((i) => cellAt(i)?.classList.remove('lifted')),
      onDropOutside: (p, pt, chain) => removeOnes(p.amount, chain),
    }));
  }

  // Greift man eine Perle, nimmt man sie und alle rechts davon in derselben Fünferreihe (wie am Rechenrahmen).
  function onesPayload(e) {
    const cell = e.target.closest('.cell');
    if (!cell || !cell.classList.contains('on') || cell.classList.contains('incoming')) return null;
    const i = +cell.dataset.i;
    const rowStart = Math.floor(i / 5) * 5;
    const inRow = clamp(st.units - rowStart, 0, 5);
    if (i - rowStart >= inRow) return null;
    return { src: 'mat', kind: 'ones', amount: rowStart + inRow - i, cells: range(i, rowStart + inRow) };
  }

  function plateGhost() {
    const p = h('div', { class: 'plate-ghost' });
    for (let i = 0; i < 10; i++) { const r = h('div', { class: 'rod rod--hun' }); for (let k = 0; k < 10; k++) r.append(bead('hun')); p.append(r); }
    return p;
  }

  // ---------- Ablegen ----------
  const accepts = (p) => p.src === 'tray' || p.src === 'mat';
  cleanups.push(addDropZone(zoneTens, { accepts, onDrop: (p, pt, chain) => dropOn('tens', p, chain) }));
  cleanups.push(addDropZone(zoneUnits, { accepts, onDrop: (p, pt, chain) => dropOn('units', p, chain) }));
  hundBtn.addEventListener('click', () => (st.hundred ? breakHundred() : bundleHundred()));

  function dropOn(zone, p, chain) {
    if (p.src === 'tray') return add(p.amount, chain);
    if (p.kind === 'ten' && zone === 'units') return unbundle(chain);
    if (p.kind === 'hundred' && zone === 'units') { o.onHint('hundred-to-units'); return false; }
    if (p.kind === 'frame' && zone === 'tens') return bundle(p.frame, chain);
    if (p.kind === 'ones' && zone === 'tens') { o.onHint('ones-to-tens'); return false; }
    return false;
  }

  // ---------- Perlen landen lassen ----------
  function landInto(chain, targets, { kindTo = null, after = null } = {}) {
    targets.forEach((t) => t.classList.add('incoming'));
    const done = () => { targets.forEach((t) => t.classList.remove('incoming')); after?.(); };
    if (!chain) { targets.forEach((t, i) => popIn(t, i)); done(); return; }
    chain.land(centers(targets), {
      kindTo,
      onBead: (i) => targets[i]?.classList.remove('incoming'),
      onDone: done,
    });
  }
  function popIn(el, i) {
    el.style.setProperty('--i', i);
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }

  // ---------- Aktionen ----------
  function emit(type, amount) { o.onChange({ ...st, value: value() }, { type, amount }); }

  function maybeAuto() {
    clearTimeout(autoTimer);
    if (!alive || !o.autoBundle) return;
    if (st.units >= 10 && st.tens < 10 && !st.hundred) autoTimer = setTimeout(() => bundle(0), 380);
  }

  function canAdd(n) {
    if (!o.allowAdd) return false;
    if (value() + n > o.maxValue) { o.onLimit('max'); return false; }
    if (n === 10 && (st.hundred || st.tens >= 10)) { o.onLimit('tens'); return false; }
    if (n !== 10 && st.units + n > o.maxUnits) { o.onLimit('units'); return false; }
    return true;
  }

  function add(n, chain = null) {
    if (!canAdd(n)) return false;
    let targets;
    if (n === 10) {
      st.tens++; st.grabs++;
      render();
      targets = [...rodAt(st.tens - 1).children];
    } else {
      const from = st.units;
      st.units += n; st.grabs++;
      render();
      targets = range(from, from + n).map(cellAt);
    }
    landInto(chain, targets, { after: maybeAuto });
    emit('add', n);
    return true;
  }

  function removeTo(chain, n) {
    if (!chain) return;
    const card = picker?.cardFor(n);
    chain.vanish(card ? centers([card.vis])[0] : null);
  }
  function removeTen(chain) {
    if (!o.allowRemove || st.tens < 1) return false;
    st.tens--; render(); removeTo(chain, 10); emit('remove', 10); return true;
  }
  function removeHundred() {
    if (!o.allowRemove || !st.hundred) return false;
    st.hundred = false; render(); emit('remove', 100); return true;
  }
  function removeOnes(n, chain) {
    if (!o.allowRemove || n > st.units) return false;
    st.units -= n; render(); removeTo(chain, 1); emit('remove', n); return true;
  }

  function bundle(fi = 0, chain = null) {
    if (fi < 0 || st.units < 10 || st.tens >= 10 || st.hundred) return false;
    fi = clamp(fi, 0, frames.length - 1);
    const f = frames[fi];
    if (!f || !f.el.classList.contains('full')) return false;
    if (!chain) chain = new Chain('one', centers(f.cells), { size: bPx() });
    // Einer aus späteren Feldern rücken nach – auch sie fliegen sichtbar.
    const moveFrom = range((fi + 1) * 10, st.units);
    const moveChain = moveFrom.length ? new Chain('one', centers(moveFrom.map(cellAt)), { size: bPx() }) : null;
    st.units -= 10; st.tens++;
    render();
    landInto(chain, [...rodAt(st.tens - 1).children], { kindTo: 'ten', after: maybeAuto });
    if (moveChain) landInto(moveChain, moveFrom.map((i) => cellAt(i - 10)));
    emit('bundle', 10);
    return true;
  }

  function unbundle(chain = null) {
    if (st.tens < 1 || st.hundred) return false;
    if (st.units + 10 > o.maxUnits) { o.onLimit('units'); return false; }
    if (!chain) chain = new Chain('ten', centers(rodAt(st.tens - 1).children), { size: bPx() });
    const from = st.units;
    st.tens--; st.units += 10;
    render();
    landInto(chain, range(from, from + 10).map(cellAt), { kindTo: 'one', after: maybeAuto });
    emit('unbundle', 10);
    return true;
  }

  function bundleHundred() {
    if (st.tens !== 10 || st.units !== 0 || st.hundred) return;
    st.tens = 0; st.hundred = true;
    zoneTens.classList.remove('flash-zone'); void zoneTens.offsetWidth; zoneTens.classList.add('flash-zone');
    render(); emit('bundle100', 100);
  }
  function breakHundred() {
    if (!st.hundred) return;
    st.hundred = false; st.tens = 10;
    render(); emit('unbundle100', 100);
  }

  // ---------- Auswahl (Picker) ----------
  let picker = null;
  if (pickerHost) picker = createPicker(pickerHost);

  function createPicker(host) {
    const el = h('div', { class: 'picker', dataset: { count: pieces.length } });
    const cards = {};
    for (const n of pieces) {
      const kind = n === 10 ? 'ten' : 'one';
      const vis = h('span', { class: `pick-vis pick-vis--${n}` });
      const beads = range(0, n).map(() => { const b = bead(kind); vis.append(b); return b; });
      const card = h('button', { class: `pick pick--${n}`, type: 'button', 'aria-label': `${NAMES[n]} hinlegen` },
        vis, h('span', { class: 'pick-label' }, h('span', { class: 'pick-name' }, NAMES[n]), h('span', { class: 'pick-num' }, String(n))));
      const mk = () => new Chain(kind, centers(beads), { size: bPx() });
      const tap = () => { if (canAdd(n)) add(n, mk()); };
      cleanups.push(draggable(card, {
        payload: { src: 'tray', amount: n },
        chain: mk,
        onTap: tap,
      }));
      card.addEventListener('click', (e) => { if (e.detail === 0) tap(); });
      cards[n] = { card, vis };
      el.append(card);
    }
    const trash = h('div', { class: 'picker-trash' }, 'Hierher = wegräumen');
    el.append(trash);
    host.append(el);
    // Perlengröße der Karten an ihre Breite anpassen
    const fitPicker = () => {
      const c10 = cards[10]?.card || el.firstElementChild;
      if (!c10) return;
      let w = c10.clientWidth - 26;
      if (!cards[10] && getComputedStyle(c10).flexDirection === 'row') w -= (c10.querySelector('.pick-label')?.offsetWidth || 70) + 10;
      const per = cards[10] ? 11.4 : 8.2;
      el.style.setProperty('--pb', clamp(Math.floor(w / per), 9, 30) + 'px');
    };
    const pro = new ResizeObserver(fitPicker);
    pro.observe(el);
    window.addEventListener('gzw:settings', fitPicker);
    cleanups.push(() => window.removeEventListener('gzw:settings', fitPicker));
    const ds = (e) => { if (e.detail?.src === 'mat' && o.allowRemove) el.classList.add('trash-mode'); };
    const de = () => el.classList.remove('trash-mode');
    window.addEventListener('gzw:dragstart', ds);
    window.addEventListener('gzw:dragend', de);
    cleanups.push(() => { pro.disconnect(); window.removeEventListener('gzw:dragstart', ds); window.removeEventListener('gzw:dragend', de); el.remove(); });
    return { el, cardFor: (n) => cards[n] || cards[1] || null };
  }

  render();
  fit();

  return {
    el: root,
    picker: picker?.el || null,
    get state() { return { ...st, value: value() }; },
    value,
    add: (n) => { const c = picker?.cardFor(n); return add(n, c && canAdd(n) ? new Chain(n === 10 ? 'ten' : 'one', centers(c.vis.children), { size: bPx() }) : null); },
    bundle, unbundle, bundleHundred,
    set(next = {}) {
      Object.assign(st, { tens: 0, units: 0, hundred: false }, next);
      render();
      root.querySelectorAll('.cell.on, .rod').forEach((el, i) => popIn(el, Math.min(i, 12)));
    },
    resetGrabs() { st.grabs = 0; },
    setOption(k, v) { o[k] = v; render(); if (k === 'autoBundle') maybeAuto(); },
    fit,
    destroy() { alive = false; clearTimeout(autoTimer); cleanups.forEach((f) => f()); root.remove(); },
  };
}
