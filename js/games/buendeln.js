// Bündeln: 10 Einer → 1 Zehner („Zehner machen“) und 1 Zehner → 10 Einer (Hammer).
// Ohne Text: Bild-Regel in der Leiste, das Spiel erkennt selbst, wann die Aufgabe gelöst ist.
import { h, rand } from '../util.js?v=4';
import { createBuilder } from '../builder.js?v=4';
import { ICON_BUNDLE, ICON_HAMMER, ICON_BAR, ICON_BEAD } from '../icons.js?v=4';

function makeTask(mode) {
  if (mode === 'mix') return makeTask(Math.random() < 0.5 ? 'to-tens' : 'to-units');
  if (mode === 'to-tens') {
    const tens = rand(0, 3);
    const units = [10, 15, 20][rand(0, 2)];
    const goalT = tens + Math.floor(units / 10);
    const goalU = units % 10;
    return {
      mode: 'to-tens', start: { tens, units },
      ok: (s) => s.tens === goalT && s.units === goalU,
      say: 'Mach Zehner!',
      hints: ['Drück <b>Zehner machen</b>.', '10 Einer = 1 Zehner.', `Am Ende: ${goalT} Zehner, ${goalU} Einer.`],
      cheer: 'Super gebündelt!',
    };
  }
  const tens = rand(2, 4);
  const need = rand(3, 8);
  return {
    mode: 'to-units', need, start: { tens, units: 0 },
    ok: (s) => s.units >= need && s.tens === tens - 1,
    say: `Du brauchst <b>${need}</b> Einer. Hau einen Zehner auf!`,
    hints: ['Tipp auf den Hammer.', 'Ein Zehner = 10 Einer.', `Du brauchst ${need}.`],
    cheer: 'Bäm! Jetzt hast du Einer.',
  };
}

export function playBuendeln(stage, { level, grok, onSolved, rail }) {
  const task = makeTask(level.mode);
  const matHost = h('div', { class: 'bmat-host' });
  const taskEl = task.mode === 'to-tens'
    ? h('div', { class: 'task', hidden: true })
    : h('div', { class: 'task' }, h('span', { class: 'need', 'aria-label': `${task.need} Einer` }, String(task.need), h('span', { html: ICON_BEAD, style: { display: 'inline-flex' } })));
  stage.append(taskEl, matHost);
  const ones = h('span', { class: 'rule-ones', 'aria-hidden': 'true' });
  for (let i = 0; i < 10; i++) ones.append(h('i'));
  const bar = h('span', { html: ICON_BAR, style: { display: 'inline-flex' } });
  rail.append(task.mode === 'to-tens'
    ? h('div', { class: 'rule-card', 'aria-label': '10 Einer werden 1 Zehner' }, ones, h('span', { class: 'rule-arrow' }, '→'), bar)
    : h('div', { class: 'rule-card', 'aria-label': '1 Zehner wird 10 Einer' }, bar, h('span', { html: ICON_HAMMER, style: { display: 'inline-flex' } }), ones));

  grok.say(task.say);
  grok.setHints(task.hints);

  let done = false;
  const b = createBuilder({
    matHost, pickerHost: null,
    tens: task.start.tens, units: task.start.units,
    allowHundred: false, maxValue: 100, maxUnits: 30,
    allowAdd: false, allowRemove: false, slots: 'auto',
    onChange: (st) => {
      if (done || !task.ok(st)) return;
      done = true;
      setTimeout(() => { grok.cheer(task.cheer); setTimeout(onSolved, 900); }, 700);
    },
    onLimit: (why) => { if (why === 'units') grok.say('Kein Platz mehr für Einer.', { mood: 'think' }); },
    onHint: (k) => { if (k === 'ones-to-tens') grok.say('Noch keine 10.', { mood: 'think' }); },
  });
  let stopHint = () => {};
  if (task.mode === 'to-units') {
    b.el.classList.add('hint-split');
    stopHint = b.hint('split', 'split');
  }
  return () => { stopHint(); b.destroy(); };
}
