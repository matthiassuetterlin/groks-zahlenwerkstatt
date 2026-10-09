// Der Baukasten – eine Komponente für Werkstatt, „Lege die Zahl“, „Plus mit Struktur“ und „Bündeln“.
// Matte: links Zehner (10 Stangen-Plätze mit sichtbaren Mulden), rechts Einer in Zehnerfeldern (2 × 5 Mulden).
// Bündeln: großer Knopf „Zehner machen“ über den Einern. Aufbrechen: Hammer an jeder Zehnerstange.
// Auswahl: große Karten für Zehner, Fünfer, Einer. Alles fliegt als einzelne Perlen – nie als Päckchen,
// und jede Perle behält beim Ziehen die Größe, die sie auf der Matte hat.
import { h, clamp } from './util.js?v=6';
import { bead } from './blocks.js?v=6';
import { draggable, addDropZone } from './drag.js?v=6';
import { Chain, centers, reducedMotion } from './beadfx.js?v=6';
import { burst } from './fx.js?v=6';
import { handHint } from './hint.js?v=6';
import { bead as beadToken, STEPS } from './sizing.js?v=6';
import { ICON_BUNDLE, ICON_HAMMER, ICON_HUNDRED, ICON_BAR, ICON_BEAD, ICON_PLATE } from './icons.js?v=6';

const NAMES = { 10: 'Zehner', 5: 'Fünfer', 1: 'Einer' };
const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
const ico = (markup, cls = 'btn-ico') => h('span', { class: cls, html: markup });

export function createBuilder({ matHost, pickerHost = null, pieces = [10, 5, 1], ...options }) {
  const o = {
    tens: 0, units: 0, hundred: false,
    allowHundred: false, maxValue: 100, maxUnits: 30, slots: 10,
    allowAdd: true, allowRemove: true, allowSplit: true, autoBundle: false, gapTo: 0,
    minB: 12, maxB: 60,
    onChange: () => {}, onLimit: () => {}, onHint: () => {},
    ...options,
  };
  const st = { tens: o.tens, units: o.units, hundred: o.hundred, grabs: 0 };
  const cleanups = [];
  let autoTimer = null;
  let alive = true;

  // ---------- Matte: Zehner ----------
  const tensIco = ico(ICON_BAR, 'zone-ico');
  const tensCount = h('span', { class: 'zone-count' });
  const hundIco = ico(ICON_HUNDRED);
  const hundTxt = h('span', { class: 'act-txt' }, 'Hunderter machen');
  const hundBtn = h('button', { class: 'act-btn act-btn--hun', type: 'button', hidden: true }, hundIco, hundTxt);
  const tensField = h('div', { class: 'tens-field' });
  const slots = range(0, 10).map((i) => {
    const wells = h('span', { class: 'wells', 'aria-hidden': 'true' });
    for (let k = 0; k < 10; k++) wells.append(h('span', { class: 'well' }));
    const track = h('div', { class: 'slot-track' }, wells);
    const split = h('button', { class: 'split-btn', type: 'button', 'aria-label': 'Zehner aufbrechen: 10 Einer', title: 'Aufbrechen', html: ICON_HAMMER });
    split.addEventListener('click', () => splitRod(i));
    const el = h('div', { class: 'rod-slot' }, track, split);
    tensField.append(el);
    return { el, track, split };
  });
  const zoneTens = h('div', { class: 'zone zone-tens' },
    h('div', { class: 'zone-head' }, h('span', { class: 'zone-tag', 'aria-label': 'Zehner' }, tensIco, tensCount), hundBtn), tensField);

  // ---------- Matte: Einer ----------
  const unitsCount = h('span', { class: 'zone-count' });
  const framesEl = h('div', { class: 'frames' });
  const bundleBtn = h('button', { class: 'act-btn act-btn--ten bundle-btn', type: 'button', hidden: true, 'aria-label': '10 Einer zu 1 Zehner machen' },
    ico(ICON_BUNDLE), h('span', { class: 'act-txt' }, 'Zehner machen'));
  const zoneUnits = h('div', { class: 'zone zone-units' },
    h('div', { class: 'zone-head' }, h('span', { class: 'zone-tag', 'aria-label': 'Einer' }, ico(ICON_BEAD, 'zone-ico'), unitsCount), bundleBtn), framesEl);
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
  const rodAt = (i) => slots[i]?.track.querySelector('.rod');

  // ---------- Größe: EINE Perlengröße (sizing.js) – Matte nebeneinander oder untereinander ----------
  // Passt die Matte bei --bead nicht, wird sie höchstens 2 feste Stufen kleiner (0.84, 0.7); erst dann stufenlos.
  function fits(mode, b, W, H) {
    root.dataset.mode = mode;
    root.style.setProperty('--b', b + 'px');
    return root.offsetWidth <= W && root.offsetHeight <= H;
  }
  function fit() {
    const W = matHost.clientWidth - 12, H = matHost.clientHeight - 12; // Luft für Schatten und Hover-Ring
    if (!W || !H) return;
    const base = beadToken();
    let best = null;
    for (const k of STEPS) {
      const b = Math.round(base * k);
      for (const mode of ['row', 'col']) if (fits(mode, b, W, H)) { best = { mode, b, step: STEPS.indexOf(k) }; break; }
      if (best) break;
    }
    if (!best) {
      // Notlösung (sehr kleine Fenster): größte Perlengröße unter Stufe 2 suchen
      for (const mode of ['row', 'col']) {
        let lo = o.minB, hi = Math.round(base * STEPS[STEPS.length - 1]);
        if (!fits(mode, lo, W, H)) continue;
        while (hi - lo > 0.75) { const mid = (lo + hi) / 2; if (fits(mode, mid, W, H)) lo = mid; else hi = mid; }
        if (!best || lo > best.b + 0.5) best = { mode, b: Math.floor(lo), step: 'free' };
      }
    }
    if (!best) best = { mode: W > H ? 'row' : 'col', b: o.minB, step: 'free' };
    root.dataset.mode = best.mode;
    root.dataset.step = String(best.step);
    root.style.setProperty('--b', best.b + 'px');
    root.classList.add('is-fitted');
    picker?.fit();
  }
  const ro = new ResizeObserver(() => fit());
  ro.observe(matHost);
  const onSettings = () => fit();
  window.addEventListener('gzw:settings', onSettings);
  cleanups.push(() => { ro.disconnect(); window.removeEventListener('gzw:settings', onSettings); });

  // ---------- Darstellung ----------
  let structure = '';
  let bundleHinted = false;
  function render() {
    const shown = st.hundred ? 10 : st.tens;
    slots.forEach((s, i) => {
      const r = s.track.querySelector('.rod');
      if (i < shown) { if (!r) s.track.append(makeRod()); }
      else if (r) r.remove();
      s.el.classList.toggle('has-rod', i < shown);
    });
    // Stabiles Layout: die Zahl der Plätze steht von Anfang an fest (nichts springt, wenn Perlen dazukommen)
    const fixed = o.slots === 'auto' ? (o.maxValue <= 50 ? 5 : 10) : typeof o.slots === 'number' ? o.slots : 10;
    const visible = clamp(Math.max(fixed, shown), 1, 10);
    slots.forEach((s, i) => { s.el.hidden = i >= visible; });
    zoneTens.classList.toggle('is-hundred', st.hundred);
    root.classList.toggle('no-split', !o.allowSplit || st.hundred);
    tensIco.innerHTML = st.hundred ? ICON_PLATE : ICON_BAR;
    tensCount.textContent = st.hundred ? '1' : String(st.tens);
    const canHund = o.allowHundred && ((!st.hundred && st.tens === 10 && st.units === 0) || st.hundred);
    setOff(hundBtn, !canHund);
    hundIco.innerHTML = st.hundred ? ICON_HAMMER : ICON_HUNDRED;
    hundTxt.textContent = st.hundred ? 'Aufbrechen' : 'Hunderter machen';
    hundBtn.setAttribute('aria-label', st.hundred ? '1 Hunderter zu 10 Zehnern aufbrechen' : '10 Zehner zu 1 Hunderter machen');

    // alle Zehnerfelder sind von Anfang an da (fester Platz statt nachwachsender Felder)
    const need = Math.max(1, Math.ceil(o.maxUnits / 10), Math.ceil(st.units / 10));
    while (frames.length < need) addFrame();
    while (frames.length > need) frames.pop().wrap.remove();
    frames.forEach((f, fi) => {
      const inFrame = clamp(st.units - fi * 10, 0, 10);
      f.cells.forEach((c, ci) => {
        const on = ci < inFrame;
        if (on) c.classList.add('on', 'on--one');
        else c.classList.remove('on', 'on--one', 'incoming', 'lifted');
        // Zehnerstopp: die Lücke bis zur nächsten 10 leuchtet zart
        const idx = fi * 10 + ci;
        c.classList.toggle('gap', !on && idx < o.gapTo);
      });
      f.el.classList.toggle('full', inFrame === 10);
    });
    const canBundle = st.units >= 10 && !st.hundred && st.tens < 10 && !o.autoBundle && o.allowBundle !== false;
    setOff(bundleBtn, !canBundle);
    if (canBundle && !bundleHinted) { bundleHinted = true; cleanups.push(handHint('bundle', () => bundleBtn, null, { delay: 700 })); }
    unitsCount.textContent = String(st.units);
    const s = `${visible}|${frames.length}`;
    if (s !== structure) { structure = s; fit(); }
  }

  // Knöpfe, die erst später gebraucht werden, haben ihren Platz schon: unsichtbar statt weg (kein Springen)
  function setOff(btn, off) {
    btn.hidden = false;
    btn.classList.toggle('is-off', off);
    btn.disabled = off;
    btn.setAttribute('aria-hidden', String(off));
    if (off) btn.tabIndex = -1; else btn.removeAttribute('tabindex');
  }

  const slotIndexOf = (r) => slots.findIndex((s) => s.track.contains(r));

  function makeRod() {
    const r = h('div', { class: 'rod rod--ten' });
    for (let i = 0; i < 10; i++) r.append(bead('ten'));
    cleanups.push(draggable(r, {
      payload: () => (st.hundred ? { src: 'mat', kind: 'hundred' } : { src: 'mat', kind: 'ten', rod: r, idx: slotIndexOf(r) }),
      chain: (p) => (p.kind === 'ten' ? new Chain('ten', centers(r.children), { size: bPx() }) : null),
      ghost: (p) => (p.kind === 'hundred' ? plateGhost() : null),
      onStart: (p) => (p.kind === 'hundred' ? zoneTens.classList.add('lifted-all') : r.classList.add('lifted')),
      onEnd: () => { r.classList.remove('lifted'); zoneTens.classList.remove('lifted-all'); },
      onDropOutside: (p, pt, chain) => (p.kind === 'hundred' ? removeHundred() : removeTen(chain, p.idx)),
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
      payload: (e) => framePayload(e, fi) || onesPayload(e),
      chain: (p) => new Chain('one', centers(p.cells.map(cellAt)), { size: bPx() }),
      onStart: (p) => p.cells.forEach((i) => cellAt(i)?.classList.add('lifted')),
      onEnd: (p) => p.cells.forEach((i) => cellAt(i)?.classList.remove('lifted')),
      onDropOutside: (p, pt, chain) => removeOnes(p.amount, chain),
    }));
  }

  // Werterhaltend: Ein volles Zehnerfeld am Rand greifen = das ganze Feld (wird bei den Zehnern zur Stange).
  function framePayload(e, fi) {
    if (e.target.closest('.cell')) return null;
    const f = frames[fi];
    if (!f || !f.el.classList.contains('full')) return null;
    const cells = range(fi * 10, fi * 10 + 10);
    return { src: 'mat', kind: 'frame', frame: fi, amount: 10, cells };
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
    if (p.kind === 'ten' && zone === 'units') return unbundle(chain, p.idx);
    if (p.kind === 'hundred' && zone === 'units') { o.onHint('hundred-to-units'); return false; }
    if (p.kind === 'frame' && zone === 'tens') return bundle(p.frame, chain);
    if (p.kind === 'ones' && zone === 'tens') { o.onHint(st.units >= 10 ? 'take-frame' : 'ones-to-tens'); return false; }
    return false;
  }

  // ---------- Perlen landen lassen ----------
  function landInto(chain, targets, { kindTo = null, rod = null, after = null, duration = null } = {}) {
    targets.forEach((t) => t.classList.add('incoming'));
    rod?.classList.add('incoming');
    const done = () => { targets.forEach((t) => t.classList.remove('incoming')); rod?.classList.remove('incoming'); after?.(); };
    if (!chain) { targets.forEach((t, i) => popIn(t, i)); done(); return; }
    chain.land(centers(targets), {
      kindTo, duration,
      onBead: (i) => targets[i]?.classList.remove('incoming'),
      onDone: done,
    });
  }
  function popIn(el, i) {
    el.style.setProperty('--i', i);
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }
  // Nach dem Entfernen einer Stange rücken die darunter ruhig nach oben.
  function shiftUpFrom(i) {
    if (i == null || i < 0 || reducedMotion()) return;
    for (let j = i; j < st.tens; j++) {
      const r = rodAt(j), next = slots[j + 1];
      if (!r || !next || next.el.hidden) continue;
      const dy = next.el.offsetTop - slots[j].el.offsetTop;
      r.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.45,0,.25,1)' });
    }
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
    let targets, rod = null;
    if (n === 10) {
      st.tens++; st.grabs++;
      render();
      rod = rodAt(st.tens - 1);
      targets = [...rod.children];
    } else {
      const from = st.units;
      st.units += n; st.grabs++;
      render();
      targets = range(from, from + n).map(cellAt);
    }
    landInto(chain, targets, { rod, after: maybeAuto });
    emit('add', n);
    return true;
  }

  function removeTo(chain, n) {
    if (!chain) return;
    const card = picker?.cardFor(n);
    chain.vanish(card ? centers([card.vis])[0] : null);
  }
  function removeTen(chain, idx = st.tens - 1) {
    if (!o.allowRemove || st.tens < 1) return false;
    st.tens--; render(); shiftUpFrom(idx); removeTo(chain, 10); emit('remove', 10); return true;
  }
  function removeHundred() {
    if (!o.allowRemove || !st.hundred) return false;
    st.hundred = false; render(); emit('remove', 100); return true;
  }
  function removeOnes(n, chain) {
    if (!o.allowRemove || n > st.units) return false;
    st.units -= n; render(); removeTo(chain, 1); emit('remove', n); return true;
  }

  // 10 Einer → 1 Zehner. Per Knopf: die Perlen sammeln sich erst zu einer Stange, dann gleitet sie zu den Zehnern.
  function bundle(fi = 0, chain = null) {
    if (fi < 0 || st.units < 10 || st.tens >= 10 || st.hundred) return false;
    fi = clamp(fi, 0, frames.length - 1);
    const f = frames[fi];
    if (!f || !f.el.classList.contains('full')) return false;
    const gather = !chain;
    const b = bPx();
    if (!chain) chain = new Chain('one', centers(f.cells), { size: b });
    let formation = null;
    if (gather && !reducedMotion()) {
      const r = f.el.getBoundingClientRect();
      const step = b * 1.08, width = 9 * step + b * 0.22;
      const x0 = clamp(r.left + r.width / 2 - width / 2, b * 0.7, innerWidth - width - b * 0.7);
      const y = r.top + r.height / 2;
      formation = range(0, 10).map((i) => ({ x: x0 + i * step + (i >= 5 ? b * 0.22 : 0), y, w: b }));
    }
    // Einer aus späteren Feldern rücken nach – auch sie gleiten sichtbar.
    const moveFrom = range((fi + 1) * 10, st.units);
    const moveChain = moveFrom.length ? new Chain('one', centers(moveFrom.map(cellAt)), { size: b }) : null;
    st.units -= 10; st.tens++;
    render();
    const rod = rodAt(st.tens - 1);
    const targets = [...rod.children];
    if (formation) {
      targets.forEach((t) => t.classList.add('incoming'));
      rod.classList.add('incoming');
      chain.land(formation, {
        keep: true, duration: 750, stagger: 12, lift: b * 0.3,
        onDone: () => {
          chain.setKind('ten');
          setTimeout(() => landInto(chain, targets, { rod, after: maybeAuto, duration: 1000 }), 280);
        },
      });
    } else {
      landInto(chain, targets, { kindTo: 'ten', rod, after: maybeAuto });
    }
    if (moveChain) {
      const moveTargets = moveFrom.map((i) => cellAt(i - 10));
      moveTargets.forEach((t) => t.classList.add('incoming'));
      // Beim Sammeln erst Platz machen lassen, dann rücken die übrigen Einer nach.
      setTimeout(() => landInto(moveChain, moveTargets, { duration: formation ? 900 : null }), formation ? 800 : 0);
    }
    emit('bundle', 10);
    return true;
  }

  // 1 Zehner → 10 Einer (Ziehen nach rechts)
  function unbundle(chain = null, idx = st.tens - 1) {
    if (st.tens < 1 || st.hundred) return false;
    if (st.units + 10 > o.maxUnits) { o.onLimit('units'); return false; }
    if (!chain) return splitRod(idx);
    const from = st.units;
    st.tens--; st.units += 10;
    render(); shiftUpFrom(idx);
    landInto(chain, range(from, from + 10).map(cellAt), { kindTo: 'one', after: maybeAuto });
    emit('unbundle', 10);
    return true;
  }

  // Hammer: „Bäm!“ – die Stange springt in 10 Einer auseinander, die zu den Einern fliegen.
  function splitRod(i = st.tens - 1) {
    if (!o.allowSplit || st.hundred || i < 0 || i >= st.tens) return false;
    if (st.units + 10 > o.maxUnits) { o.onLimit('units'); return false; }
    const rod = rodAt(i);
    const b = bPx();
    const chain = new Chain('ten', centers(rod.children), { size: b });
    burst(rod, 12, { dist: b * 1.6 });
    const from = st.units;
    st.tens--; st.units += 10;
    render(); shiftUpFrom(i);
    const targets = range(from, from + 10).map(cellAt);
    targets.forEach((t) => t.classList.add('incoming'));
    chain.setKind('one');
    const scatter = chain.beads.map((bd, k) => ({
      x: bd.x + (Math.random() - 0.5) * b * 0.8,
      y: bd.y + (k % 2 ? 1 : -1) * b * (0.45 + Math.random() * 0.45),
      w: b,
    }));
    chain.land(scatter, {
      keep: true, duration: 260, stagger: 0, lift: 0, ease: 'out',
      onDone: () => setTimeout(() => landInto(chain, targets, { after: maybeAuto, duration: 950 }), 140),
    });
    emit('unbundle', 10);
    return true;
  }

  // Aufräumen: alle vollen Zehnerfelder nacheinander zu Stangen (werterhaltend, ruhig).
  let tidyTimer = null;
  function tidy(done = null) {
    clearTimeout(tidyTimer);
    const step = () => {
      if (!alive) return;
      if (st.units < 10 || st.tens >= 10 || st.hundred) { done?.(); return; }
      const fi = firstFull();
      const f = frames[fi];
      bundle(fi, reducedMotion() ? null : new Chain('one', centers(f.cells), { size: bPx() }));
      tidyTimer = setTimeout(step, reducedMotion() ? 0 : 750);
    };
    step();
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
    burst(tensField, 14);
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
      const card = h('button', { class: `pick pick--${n}`, type: 'button', 'aria-label': `${NAMES[n]} hinlegen`, title: NAMES[n] },
        vis, h('span', { class: 'pick-num' }, String(n)));
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
    const trash = h('div', { class: 'picker-trash', 'aria-hidden': 'true' }, h('span', { class: 'trash-ico', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/></svg>' }));
    el.append(trash);
    host.append(el);
    // Perlen der Karten haben die globale Perlengröße (--bead) – genau wie die Matte bei Stufe 0 und die
    // gezogene Kette. Bewusst NICHT an die Stufe der Matte gekoppelt: sonst schaukeln sich Leiste und Matte auf.
    const fitPicker = () => { el.style.setProperty('--pb', beadToken() + 'px'); };
    const pro = new ResizeObserver(fitPicker);
    pro.observe(el);
    window.addEventListener('gzw:settings', fitPicker);
    cleanups.push(() => window.removeEventListener('gzw:settings', fitPicker));
    const ds = (e) => { if (e.detail?.src === 'mat' && o.allowRemove) el.classList.add('trash-mode'); };
    const de = () => el.classList.remove('trash-mode');
    window.addEventListener('gzw:dragstart', ds);
    window.addEventListener('gzw:dragend', de);
    cleanups.push(() => { pro.disconnect(); window.removeEventListener('gzw:dragstart', ds); window.removeEventListener('gzw:dragend', de); el.remove(); });
    return { el, fit: fitPicker, cardFor: (n) => cards[n] || cards[1] || null, card: (n) => cards[n]?.card || null };
  }

  render();
  fit();

  return {
    el: root,
    picker: picker?.el || null,
    get state() { return { ...st, value: value() }; },
    value,
    add: (n) => { const c = picker?.cardFor(n); return add(n, c && canAdd(n) ? new Chain(n === 10 ? 'ten' : 'one', centers(c.vis.children), { size: bPx() }) : null); },
    bundle, unbundle, splitRod, bundleHundred, tidy,
    get tidyNeeded() { return st.units >= 10 && !st.hundred && st.tens < 10; },
    set(next = {}) {
      Object.assign(st, { tens: 0, units: 0, hundred: false }, next);
      render();
      root.querySelectorAll('.cell.on, .rod').forEach((el, i) => popIn(el, Math.min(i, 12)));
      emit('set', 0);
    },
    resetGrabs() { st.grabs = 0; },
    setOption(k, v) { o[k] = v; render(); if (k === 'autoBundle') maybeAuto(); },
    /** Geister-Hand zeigen: 'drag10' | 'drag5' | 'drag1' (Karte → Matte), 'split' (Hammer) */
    hint(kind, key = kind) {
      if (kind.startsWith('drag')) {
        const n = +kind.slice(4);
        return handHint(key, () => picker?.card(n), () => (n === 10 ? zoneTens : zoneUnits), { carry: () => picker?.card(n)?.querySelector('.pick-vis') });
      }
      if (kind === 'frame') return handHint(key, () => frames[firstFull()]?.el, () => zoneTens);
      if (kind === 'split') return handHint(key, () => slots.find((s) => s.el.classList.contains('has-rod'))?.split, null);
      return () => {};
    },
    zones: { tens: zoneTens, units: zoneUnits },
    buttons: { bundle: bundleBtn, hundred: hundBtn },
    fit,
    destroy() { alive = false; clearTimeout(autoTimer); clearTimeout(tidyTimer); cleanups.forEach((f) => f()); root.remove(); },
  };
}
