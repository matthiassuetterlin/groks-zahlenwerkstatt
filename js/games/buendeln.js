import { h, rand } from '../util.js?v=3';
import { createBuilder } from '../builder.js?v=3';

function makeTask(mode) {
  if (mode === 'mix') return makeTask(Math.random() < 0.5 ? 'to-tens' : 'to-units');
  if (mode === 'to-tens') {
    const tens = rand(0, 3);
    const units = [10, 15, 20][rand(0, 2)];
    const goalT = tens + Math.floor(units / 10);
    const goalU = units % 10;
    return {
      mode: 'to-tens',
      start: { tens, units },
      ok: (s) => s.tens === goalT && s.units === goalU,
      say: `Du hast ${units} Einer${tens ? ` und ${tens} Zehner` : ''}. Bündele, bis die Stücke so groß wie möglich sind.`,
      short: 'Bündeln!',
      hints: [
        'Ein volles Einer-Feld nach links ziehen – oder den Knopf antippen.',
        '10 Einer = 1 Zehner.',
        `Ziel: ${goalT} Zehner und ${goalU} Einer.`,
      ],
      cheer: 'Sauber gebündelt!',
    };
  }
  const tens = rand(2, 4);
  const need = rand(3, 8);
  return {
    mode: 'to-units',
    start: { tens, units: 0 },
    ok: (s) => s.units >= need && s.tens === tens - 1,
    say: `Du brauchst ${need} Einer. Brich einen Zehner auf.`,
    short: `${need} Einer gebraucht`,
    hints: [
      'Zieh einen Zehner nach rechts – er zerfällt in 10 Einer.',
      `Du brauchst mindestens ${need} Einer.`,
      'Ein Zehner = 10 Einer.',
    ],
    cheer: 'Jetzt hast du Einer zum Weiterrechnen!',
  };
}

export function playBuendeln(stage, { level, grok, onSolved, rail, actions }) {
  const task = makeTask(level.mode);
  const matHost = h('div', { class: 'bmat-host' });
  stage.append(h('div', { class: 'task' }, h('span', { class: 'task-text' }, task.say)), matHost);
  const check = h('button', { class: 'btn btn--primary', type: 'button', disabled: true }, 'Fertig');
  rail.append(h('div', { class: 'rule-card' },
    h('span', { class: 'rule-big' }, task.mode === 'to-tens' ? '10 Einer' : '1 Zehner'),
    h('span', { class: 'rule-arrow' }, '→'),
    h('span', { class: 'rule-big' }, task.mode === 'to-tens' ? '1 Zehner' : '10 Einer'),
  ));
  actions.append(check);

  grok.say(task.say);
  grok.setHints(task.hints);

  const b = createBuilder({
    matHost, pickerHost: null,
    tens: task.start.tens, units: task.start.units,
    allowHundred: false, maxValue: 100, maxUnits: 30,
    allowAdd: false, allowRemove: false, slots: 'auto',
    onChange: (st) => {
      const ok = task.ok(st);
      check.disabled = !ok;
      if (ok) grok.say('Gut – tippe „Fertig“.');
    },
    onHint: (k) => { if (k === 'ones-to-tens') grok.say('Nimm ein ganzes volles Feld – den Knopf daneben ziehen oder antippen.', { mood: 'think' }); },
  });

  check.addEventListener('click', () => {
    if (check.disabled) return;
    check.disabled = true;
    grok.cheer(task.cheer);
    setTimeout(onSolved, 700);
  });
  return () => b.destroy();
}
