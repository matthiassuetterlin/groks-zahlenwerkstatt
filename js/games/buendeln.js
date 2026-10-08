import { h, fresh, rand } from '../util.js';
import { createMat, createTray } from '../mat.js';

function makeTask(mode) {
  if (mode === 'mix') return makeTask(Math.random() < 0.5 ? 'to-tens' : 'to-units');
  if (mode === 'to-tens') {
    const tens = rand(0, 3);
    const extra = [10, 15, 20][rand(0, 2)];
    const units = extra;
    const goalT = tens + Math.floor(units / 10);
    const goalU = units % 10;
    return {
      mode: 'to-tens',
      start: { tens, units },
      ok: (s) => s.tens === goalT && s.units === goalU,
      say: `Du hast ${units} Einer${tens ? ` und ${tens} Zehner` : ''}. Bündele, bis die Stücke so groß wie möglich sind.`,
      hints: [
        'Ein volles Einer-Feld nach links ziehen – oder den Pfeil antippen.',
        '10 Einer = 1 Zehner.',
        `Ziel: ${goalT} Zehner und ${goalU} Einer.`,
      ],
      cheer: 'Sauber gebündelt!',
    };
  }
  // to-units: Zehner aufbrechen, um Einer zu bekommen
  const tens = rand(2, 4);
  const need = rand(3, 8);
  return {
    mode: 'to-units',
    start: { tens, units: 0 },
    ok: (s) => s.units >= need && s.tens === tens - 1,
    say: `Du brauchst ${need} Einer. Brich einen Zehner auf.`,
    hints: [
      'Zieh einen Zehner nach rechts – er zerfällt in 10 Einer.',
      `Du brauchst mindestens ${need} Einer.`,
      'Ein Zehner = 10 Einer.',
    ],
    cheer: 'Jetzt hast du Einer zum Weiterrechnen!',
  };
}

export function playBuendeln(stage, { level, grok, onSolved }) {
  const task = makeTask(level.mode);
  const matHost = h('div', { class: 'mat-host mat-host--game' });
  const trayHost = h('div', { class: 'tray-host' });
  const info = h('div', { class: 'binfo' }, h('p', { class: 'prompt' }, task.say));
  const check = h('button', { class: 'btn btn--primary', type: 'button', disabled: true }, 'Fertig');
  stage.append(h('div', { class: 'buendeln' }, info, h('div', { class: 'buendeln-body' }, matHost, h('div', { class: 'buendeln-side' }, trayHost, check))));

  grok.say(task.say);
  grok.setHints(task.hints);

  const mat = createMat(matHost, {
    tens: task.start.tens, units: task.start.units,
    allowHundred: false, maxValue: 100, maxUnits: 30,
    allowAdd: task.mode !== 'to-units',
    onChange: (st) => {
      const ok = task.ok(st);
      check.disabled = !ok;
      if (ok) grok.say('Gut – tippe „Fertig“.');
    },
  });
  const tray = createTray(trayHost, {
    pieces: task.mode === 'to-units' ? [] : [10, 5, 1],
    onTap: (a) => mat.add(a),
  });
  if (task.mode === 'to-units') trayHost.hidden = true;

  check.addEventListener('click', () => {
    if (check.disabled) return;
    grok.cheer(task.cheer);
    setTimeout(onSolved, 700);
  });
  return () => { mat.destroy(); tray.destroy(); };
}
