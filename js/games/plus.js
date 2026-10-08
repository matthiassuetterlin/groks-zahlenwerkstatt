// Plus mit Struktur: Zur ersten Zahl die zweite dazulegen – mit Fünfern und Zehnern, nicht Schritt für Schritt.
// Die Felder zeigen den Zehnerübergang: erst die 10 voll machen, dann der Rest.
import { h, fresh, rand, numberWord, options } from '../util.js?v=5';
import { createBuilder } from '../builder.js?v=5';
import { choices } from '../fx.js?v=5';
import { ICON_HAND } from '../icons.js?v=5';

function makeSum(kind) {
  if (kind === 'small') return { a: fresh(() => rand(6, 9)), b: fresh(() => rand(3, 8)) };
  if (kind === 'bridge') {
    const a = fresh(() => rand(15, 48));
    return { a, b: Math.min(9, 10 - (a % 10) + rand(1, 5)) };
  }
  const a = fresh(() => rand(21, 64));
  let b = fresh(() => rand(12, 35));
  if (a + b > 99) b = 99 - a;
  return { a, b };
}

export function playPlus(stage, { level, grok, onSolved, rail }) {
  let { a, b } = makeSum(level.kind);
  if (a % 10 + b <= 10 && level.kind !== 'big') b = 10 - (a % 10) + rand(1, 3); // immer über den Zehner
  const sum = a + b;
  const toTen = 10 - (a % 10);
  const pieces = level.kind === 'big' ? [10, 5, 1] : [5, 1];

  const addChip = h('span', { class: 'add-chip' }, '+0');
  const box = h('span', { class: 'box' }, '?');
  const task = h('div', { class: 'task' },
    h('span', { class: 'task-num task-num--eq' }, `${a} + ${b} = `, box),
    h('span', { class: 'meta-chip', title: 'dazugelegt', 'aria-label': 'dazugelegt' }, h('span', { html: ICON_HAND, style: { display: 'inline-flex', width: '1.1em' } }), addChip),
  );
  const matHost = h('div', { class: 'bmat-host' });
  stage.append(task, matHost);
  const choicesHost = h('div', { class: 'rail-choices' });

  grok.say(level.kind === 'big' ? `Leg <b>${b}</b> dazu!` : `Leg <b>${b}</b> dazu. Erst die Zehn voll!`);
  grok.setHints([
    level.kind === 'big' ? `${b} = ${Math.floor(b / 10)} Zehner, ${b % 10} Einer.` : `Bis zur 10 fehlen ${toTen}.`,
    level.kind === 'big' ? '10 Einer? <b>Zehner machen</b>!' : `${b} = ${toTen} + ${b - toTen}.`,
    'Ein Fünfer ist schneller als 5 Einer.',
  ]);

  let asked = false;
  let tenNoted = false;
  let row = null;

  const bld = createBuilder({
    matHost, pickerHost: rail, pieces,
    tens: Math.floor(a / 10), units: a % 10,
    allowHundred: false, maxValue: 99, maxUnits: 30, slots: 'auto',
    onChange: (st, info) => {
      const added = st.value - a;
      addChip.textContent = (added >= 0 ? '+' : '') + added;
      addChip.classList.toggle('is-ok', added === b);
      if (!tenNoted && info.type === 'add' && st.units >= 10 && level.kind !== 'big') {
        tenNoted = true;
        grok.say('Zehn voll! Jetzt der Rest.', { mood: 'happy' });
      }
      if (added > b) grok.say('Zu viel! Zieh etwas weg.', { mood: 'think' });
      if (added === b && !asked) {
        asked = true;
        grok.say('Wie viele zusammen?');
        const opts = options(sum, [sum - 10, sum + 10, sum - 1, sum + 1], { min: 1, max: 99, count: 3 });
        row = choices(opts, (v) => {
          if (v === sum) {
            box.textContent = String(sum);
            box.classList.add('is-filled');
            grok.cheer(`${a} + ${b} = ${sum}. ${numberWord(sum)}!`);
            setTimeout(onSolved, 900);
            return true;
          }
          grok.say('Zähl die Stangen, dann die Einer.', { mood: 'think' });
          return false;
        });
        choicesHost.replaceChildren(row);
        rail.append(choicesHost);
      } else if (added !== b && asked && !row?.classList.contains('is-solved')) {
        asked = false;
        choicesHost.remove();
      }
    },
    onLimit: (why) => { if (why === 'units') grok.say('Voll! Erst <b>Zehner machen</b>.', { mood: 'think' }); },
    onHint: (k) => { if (k === 'ones-to-tens') grok.say('Noch keine 10.', { mood: 'think' }); },
  });
  const stopHint = bld.hint('drag5', 'plus');
  return () => { stopHint(); bld.destroy(); };
}
