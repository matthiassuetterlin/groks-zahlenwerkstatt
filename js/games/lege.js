// Lege die Zahl: zweistellige Zahl mit Zehnern, Fünfern und Einern legen – möglichst mit wenigen Griffen.
// Auch unkonventionell gelegt zählt (2 Zehner + 13 Einer = 33) – Aufräumen geht mit dem Besen.
// Modi: Stufe 4 Seguin-Brett („zehn und drei“), Stufe 5 Zahlenhaus, Stufe 6 Aufräumen (wie viel ist das?).
import { h, fresh, rand, numberWord, swapDigits, options } from '../util.js?v=8';
import { createBuilder } from '../builder.js?v=8';
import { speakCards } from '../blocks.js?v=8';
import { choices, choiceSlot, setShown } from '../fx.js?v=8';
import { ICON_CLEAR, ICON_CHECK, ICON_HAND, ICON_TIDY, ICON_SWAP } from '../icons.js?v=8';
import { playTeen } from './teen.js?v=8';
import { playHaus } from './haus.js?v=8';

const STAR = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" fill="currentColor"/></svg>';

export function playLege(stage, ctx) {
  const { level } = ctx;
  if (level.mode === 'teen') return playTeen(stage, ctx);
  if (level.mode === 'house') return playHaus(stage, ctx);
  if (level.mode === 'tidy') return playTidy(stage, ctx);
  return playBuild(stage, ctx);
}

function playBuild(stage, { level, grok, onSolved, rail, actions }) {
  const [lo, hi] = level.range;
  const n = fresh(() => {
    let x;
    do { x = lo + Math.floor(Math.random() * (hi - lo + 1)); } while (x % 10 === 0);
    return x;
  });
  const tens = Math.floor(n / 10), units = n % 10;
  const ideal = tens + Math.floor(units / 5) + (units % 5);
  const useWord = level.word;

  const grabsEl = h('b', {}, '0');
  const idealChip = h('span', { class: 'meta-chip meta-chip--ideal', hidden: true, title: 'geht mit', 'aria-label': `geht mit ${ideal} Griffen` }, h('span', { html: STAR, style: { display: 'inline-flex', width: '1.05em' } }), h('b', {}, String(ideal)));
  const target = h('div', { class: 'task' },
    useWord ? h('span', { class: 'task-word' }, numberWord(n)) : h('span', { class: 'task-num' }, String(n)),
    h('span', { class: 'meta-chip', title: 'Griffe', 'aria-label': 'Griffe' }, h('span', { html: ICON_HAND, style: { display: 'inline-flex', width: '1.1em' } }), grabsEl),
    idealChip,
  );
  const matHost = h('div', { class: 'bmat-host' });
  stage.append(target, matHost);
  const clear = h('button', { class: 'btn btn--soft btn-icon', type: 'button', 'aria-label': 'Leeren', title: 'Leeren', html: ICON_CLEAR });
  const tidyBtn = h('button', { class: 'btn btn--soft btn-icon btn-tidy', type: 'button', disabled: true, 'aria-label': 'Aufräumen', title: 'Aufräumen', html: ICON_TIDY });
  const swapBtn = h('button', { class: 'btn btn--soft btn-icon btn-swap is-pulse is-off', type: 'button', disabled: true, 'aria-label': 'Tauschen', title: 'Tauschen', html: ICON_SWAP });
  const check = h('button', { class: 'btn btn--go btn-check', type: 'button', disabled: true, 'aria-label': 'Fertig', title: 'Fertig', html: ICON_CHECK });
  actions.append(clear, tidyBtn, swapBtn, check);

  grok.say(useWord ? `Leg <b>${numberWord(n)}</b>!` : `Leg <b>${n}</b>!`);
  grok.setHints([
    useWord ? `„${numberWord(n)}“: ${tens * 10} und ${units}.` : `Zuerst die Zehner: ${tens}.`,
    `Einer: ${units}. ${units >= 5 ? 'Nimm einen Fünfer!' : ''}`,
    'Jeder Weg zählt – wenige Griffe sind schlau.',
  ]);

  let done = false;
  const b = createBuilder({
    matHost, pickerHost: rail, pieces: [10, 5, 1],
    allowHundred: false, maxValue: 99, maxUnits: 30, slots: 'auto',
    onChange: (st) => {
      grabsEl.textContent = String(st.grabs);
      tidyBtn.disabled = done || !b?.tidyNeeded;
      check.disabled = done || st.value !== n;
      const sw = swapDigits(n);
      setShown(swapBtn, !(done || st.value !== sw || sw === n));
      if (done) return;
      if (st.value === n) grok.say(st.units >= 10 ? 'Geht auch! Fertig? Tipp ✓' : 'Fertig? Tipp ✓', { mood: 'happy' });
      else if (st.value === sw) grok.say(`Das ist ${st.value} – vertauscht? Tipp ⇄`, { mood: 'think' });
    },
    onLimit: (why) => { if (why === 'units') grok.say('Voll! Erst <b>Zehner machen</b>.', { mood: 'think' }); },
    onHint: (k) => {
      if (k === 'ones-to-tens') grok.say('Noch keine 10.', { mood: 'think' });
      if (k === 'take-frame') grok.say('Fass das volle Feld am Rand an.', { mood: 'think' });
    },
  });
  const stopHint = b.hint('drag10', 'lege');
  clear.addEventListener('click', () => { b.set({}); b.resetGrabs(); grabsEl.textContent = '0'; check.disabled = true; });
  tidyBtn.addEventListener('click', () => b.tidy());
  swapBtn.addEventListener('click', () => {
    // Zahlendreher: Zehner und Einer tauschen die Plätze
    const v = b.value();
    b.set({ tens: v % 10, units: Math.floor(v / 10) });
    grok.say(`Getauscht: <b>${b.value()}</b>!`, { mood: 'happy' });
  });
  check.addEventListener('click', () => {
    if (b.value() !== n || done) return;
    done = true;
    const g = b.state.grabs;
    const messy = b.state.units >= 10;
    idealChip.hidden = false;
    idealChip.classList.toggle('is-met', g <= ideal);
    target.append(speakCards(n, { cls: 'speak--small' }));
    grok.cheer(messy
      ? `Geht auch! Aufgeräumt: ${tens} Zehner, ${units} Einer.`
      : g <= ideal ? `Genau – mit nur ${g} Griffen!` : `Genau! Geht auch mit ${ideal} Griffen.`);
    check.disabled = true; tidyBtn.disabled = true; setShown(swapBtn, false);
    if (messy) setTimeout(() => b.tidy(), 500);
    setTimeout(() => onSolved(), messy ? 2200 : 1300);
  });
  return () => { stopHint(); b.destroy(); };
}

// Aufräumen: Eine unordentlich gelegte Zahl – erst aufräumen, dann sagen, wie viel es ist.
function playTidy(stage, { grok, onSolved, rail, actions }) {
  const t0 = rand(0, 4), u0 = rand(12, 26);
  const n = t0 * 10 + u0;
  const box = h('span', { class: 'box' }, '?');
  const task = h('div', { class: 'task' }, h('span', { class: 'task-ico', html: ICON_TIDY, 'aria-label': 'Aufräumen' }), h('span', { class: 'task-num' }, box));
  const matHost = h('div', { class: 'bmat-host' });
  stage.append(task, matHost);
  const tidyBtn = h('button', { class: 'btn btn--soft btn-icon btn-tidy is-pulse', type: 'button', 'aria-label': 'Aufräumen', title: 'Aufräumen', html: ICON_TIDY });
  actions.append(tidyBtn);
  const host = choiceSlot(3);
  rail.append(host);
  grok.say('Wie viel ist das? Erst aufräumen!');
  grok.setHints(['10 Einer = 1 Zehner.', 'Zieh ein volles Feld zu den Zehnern.', 'Dann: Zehner, dann Einer.']);
  let asked = false;
  const b = createBuilder({
    matHost, pickerHost: null, tens: t0, units: u0,
    allowHundred: false, maxValue: 99, maxUnits: 30, slots: 'auto', allowAdd: false, allowRemove: false,
    onChange: (st) => {
      if (asked || st.units >= 10) return;
      asked = true;
      tidyBtn.classList.remove('is-pulse');
      tidyBtn.disabled = true;
      grok.say(`Aufgeräumt! ${st.tens} Zehner, ${st.units} Einer. Wie viel?`);
      const sw = swapDigits(n);
      host.replaceChildren(choices(options(n, [sw, n - 10, n + 10, n + 1].filter((x) => x != null), { min: 1, max: 99, count: 3 }), (v) => {
        if (v !== n) { grok.say(v === sw ? 'Vertauscht! Die Zehner stehen vorne.' : `Schau: ${st.tens} Stangen.`, { mood: 'think' }); return false; }
        box.textContent = String(n); box.classList.add('is-filled');
        task.append(speakCards(n, { cls: 'speak--small' }));
        grok.cheer(`${n} – ${numberWord(n)}!`);
        setTimeout(() => onSolved(['tens', 'place']), 1300);
        return true;
      }));
    },
    onHint: (k) => { if (k === 'take-frame') grok.say('Fass das volle Feld am Rand an.', { mood: 'think' }); },
  });
  tidyBtn.addEventListener('click', () => b.tidy());
  const stopHint = b.hint('frame', 'lege-tidy');
  return () => { stopHint(); b.destroy(); };
}
