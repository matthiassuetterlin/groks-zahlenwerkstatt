// Teile die Zehn: Ein Messer teilt die Zehnerstange. Links sollen n Perlen sein – wie viele bleiben rechts?
// Geste: Messer ziehen oder auf eine Lücke tippen. Sichtbar dazu: Pfeile und „Teilen“ unten im Sheet.
import { h, fresh, rand, numberWord, fitStage } from '../util.js?v=8';
import { bead } from '../blocks.js?v=8';
import { wiggle, burst } from '../fx.js?v=8';
import { handHint } from '../hint.js?v=8';

export function playTeile(stage, { grok, onSolved, rail, actions }) {
  const cleanups = [];
  const n = fresh(() => rand(1, 9));
  let cut = n < 5 ? 8 : 2;
  let solved = false;

  const box = h('span', { class: 'box' }, '?');
  stage.append(h('div', { class: 'task' }, h('span', { class: 'task-num task-num--eq' }, `${n} + `, box, ' = 10')));

  const beads = Array.from({ length: 10 }, () => bead('one'));
  const rodEl = h('div', { class: 'cut-rod groove' }, beads);
  const knife = h('div', { class: 'cut-knife', role: 'slider', tabindex: '0', 'aria-label': 'Messer', 'aria-valuemin': '0', 'aria-valuemax': '10' }, h('i'));
  const lblL = h('span', { class: 'cut-lbl cut-lbl--l' });
  const lblR = h('span', { class: 'cut-lbl cut-lbl--r' });
  const track = h('div', { class: 'cut-track' }, rodEl, knife, lblL, lblR);
  const vis = h('div', { class: 'cut-vis' }, track);
  const fs = fitStage(stage, vis, { max: 1.6 });

  const gapX = (k) => {
    const tr = track.getBoundingClientRect();
    const r = (i) => beads[i].getBoundingClientRect();
    if (k <= 0) return r(0).left - tr.left - 6;
    if (k >= 10) return r(9).right - tr.left + 6;
    return (r(k - 1).right + r(k).left) / 2 - tr.left;
  };
  const nearest = (x) => { let best = 0, bd = 1e9; for (let k = 0; k <= 10; k++) { const d = Math.abs(gapX(k) - x); if (d < bd) { bd = d; best = k; } } return best; };
  const scale = () => track.getBoundingClientRect().width / (track.offsetWidth || 1) || 1;

  function paint() {
    beads.forEach((b, i) => { b.classList.toggle('bead--mate', i >= cut); b.classList.toggle('bead--one', i < cut); });
    const s = scale();
    knife.style.transform = `translateX(${(gapX(cut) / s).toFixed(1)}px)`;
    knife.setAttribute('aria-valuenow', String(cut));
    lblL.textContent = cut > 0 ? String(cut) : '';
    lblR.textContent = cut < 10 ? String(10 - cut) : '';
    lblL.style.transform = `translateX(${(((gapX(0) + gapX(cut)) / 2) / s).toFixed(1)}px)`;
    lblR.style.transform = `translateX(${(((gapX(cut) + gapX(10)) / 2) / s).toFixed(1)}px)`;
    left.disabled = solved || cut <= 0; right.disabled = solved || cut >= 10;
  }
  const setCut = (k) => { if (solved) return; cut = Math.max(0, Math.min(10, k)); paint(); };

  function check() {
    if (solved) return;
    if (cut !== n) {
      wiggle(track);
      grok.say(cut < n ? `Links sollen <b>${n}</b> sein – noch mehr.` : `Links sollen <b>${n}</b> sein – weniger.`, { mood: 'think' });
      return;
    }
    solved = true;
    track.classList.add('is-good');
    box.textContent = String(10 - n); box.classList.add('is-filled');
    burst(rodEl, 10);
    go.disabled = true; paint();
    grok.cheer(`${numberWord(n)} und ${numberWord(10 - n)} sind zehn!`);
    setTimeout(onSolved, 1400);
  }

  // Geste: Messer ziehen
  knife.addEventListener('pointerdown', (e) => {
    if (solved) return;
    e.preventDefault(); knife.setPointerCapture(e.pointerId); knife.classList.add('drag');
    const move = (ev) => { const x = ev.clientX - track.getBoundingClientRect().left; const k = nearest(x); if (k !== cut) setCut(k); };
    const up = () => { knife.classList.remove('drag'); knife.removeEventListener('pointermove', move); knife.removeEventListener('pointerup', up); knife.removeEventListener('pointercancel', up); check(); };
    knife.addEventListener('pointermove', move); knife.addEventListener('pointerup', up); knife.addEventListener('pointercancel', up);
  });
  knife.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { setCut(cut - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setCut(cut + 1); e.preventDefault(); }
    if (e.key === 'Enter' || e.key === ' ') { check(); e.preventDefault(); }
  });
  // Kurzweg: auf eine Lücke tippen
  rodEl.addEventListener('click', (e) => { if (solved) return; setCut(nearest(e.clientX - track.getBoundingClientRect().left)); check(); });

  // Sichtbare Bedienung im Sheet
  const arrow = (d) => h('button', { class: 'glass-btn cut-step', type: 'button', 'aria-label': d < 0 ? 'Messer nach links' : 'Messer nach rechts', html: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`, onclick: () => setCut(cut + d) });
  const left = arrow(-1), right = arrow(1);
  const go = h('button', { class: 'cut-go', type: 'button', onclick: check, html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v16M6 12h12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><span>Teilen</span>' });
  rail.append(h('div', { class: 'cut-ctrl' }, left, go, right));

  grok.say(`Teile die Zehn: links <b>${n}</b>.`);
  grok.setHints([`Schieb das Messer, bis links ${n} sind.`, 'Die Lücke in der Mitte ist die Fünf.', `${n} und wie viel sind 10?`]);

  const ro = new ResizeObserver(() => paint());
  ro.observe(track);
  requestAnimationFrame(paint);
  cleanups.push(() => ro.disconnect());
  cleanups.push(handHint('cut', () => knife.querySelector('i'), () => beads[n - 1] && beads[Math.min(n, 9)]));
  return () => { fs.destroy(); cleanups.forEach((f) => f()); };
}
