// Plus mit Struktur: Zur ersten Zahl die zweite dazulegen – mit Fünfern und Zehnern, nicht Schritt für Schritt.
// Die Felder zeigen den Zehnerübergang: erst die 10 voll machen, dann der Rest.
import { h, fresh, rand, numberWord, options } from '../util.js?v=3';
import { createBuilder } from '../builder.js?v=3';
import { choices } from '../fx.js?v=3';

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
    h('span', { class: 'task-meta' }, 'dazugelegt ', addChip),
  );
  const matHost = h('div', { class: 'bmat-host' });
  stage.append(task, matHost);
  const choicesHost = h('div', { class: 'rail-choices' });

  grok.say(level.kind === 'big'
    ? `Hier liegen ${a}. Leg <b>${b}</b> dazu – erst die Zehner, dann die Einer.`
    : `Hier liegen ${a}. Leg <b>${b}</b> dazu. Mach zuerst die Zehn voll!`);
  grok.setHints([
    level.kind === 'big' ? `${b} sind ${Math.floor(b / 10)} Zehner und ${b % 10} Einer.` : `Bis zum vollen Zehner fehlen ${toTen}.`,
    level.kind === 'big' ? 'Wenn 10 Einer voll sind: bündeln!' : `${b} = ${toTen} + ${b - toTen}.`,
    'Mit einem Fünfer geht es schneller als mit fünf Einern.',
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
        grok.say('Zehn voll! Jetzt nur noch der Rest.', { mood: 'happy' });
      }
      if (added > b) grok.say('Ups, zu viel. Zieh etwas von der Matte weg.', { mood: 'think' });
      if (added === b && !asked) {
        asked = true;
        grok.say(`${b} sind dazugelegt. Wie viele sind es jetzt zusammen?`);
        const opts = options(sum, [sum - 10, sum + 10, sum - 1, sum + 1], { min: 1, max: 99, count: 3 });
        row = choices(opts, (v) => {
          if (v === sum) {
            box.textContent = String(sum);
            box.classList.add('is-filled');
            grok.cheer(`Richtig! ${a} + ${b} = ${sum}. ${numberWord(sum)}!`);
            setTimeout(onSolved, 900);
            return true;
          }
          grok.say('Schau auf die Matte: Wie viele Zehner, wie viele Einer?', { mood: 'think' });
          return false;
        });
        choicesHost.replaceChildren(h('p', { class: 'choices-q' }, 'Zusammen?'), row);
        rail.append(choicesHost);
      } else if (added !== b && asked && !row?.classList.contains('is-solved')) {
        asked = false;
        choicesHost.remove();
      }
    },
    onLimit: (why) => { if (why === 'units') grok.say('Erst bündeln – dann ist wieder Platz.', { mood: 'think' }); },
    onHint: (k) => { if (k === 'ones-to-tens') grok.say('Erst 10 Einer – dann wird daraus ein Zehner.', { mood: 'think' }); },
  });
  return () => bld.destroy();
}
