// Lege die Zahl: zweistellige Zahl mit Zehnern, Fünfern und Einern legen – möglichst mit wenigen Griffen.
import { h, fresh, numberWord, swapDigits } from '../util.js?v=3';
import { createBuilder } from '../builder.js?v=3';

export function playLege(stage, { level, grok, onSolved, rail, actions }) {
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
  const target = h('div', { class: 'task' },
    h('span', { class: 'task-label' }, 'Lege'),
    useWord ? h('span', { class: 'task-word' }, numberWord(n)) : h('span', { class: 'task-num' }, String(n)),
    h('span', { class: 'task-meta' }, 'Griffe: ', grabsEl),
  );
  const matHost = h('div', { class: 'bmat-host' });
  stage.append(target, matHost);
  const clear = h('button', { class: 'btn btn--soft', type: 'button' }, 'Leeren');
  const check = h('button', { class: 'btn btn--primary', type: 'button', disabled: true }, 'Fertig');
  actions.append(clear, check);

  grok.say(useWord
    ? `Lege <b>${numberWord(n)}</b>. Achtung: Beim Sprechen kommen die Einer zuerst!`
    : `Lege <b>${n}</b>. Wie viele Zehner, wie viele Einer?`);
  grok.setHints([
    useWord ? `„${numberWord(n)}“: Die Zehner hörst du am Ende.` : `Die erste Ziffer sagt die Zehner: ${tens}.`,
    `Die Einer: ${units}. ${units >= 5 ? 'Ein Fünfer hilft!' : ''}`,
    `Am schnellsten geht es mit ${ideal} Griffen.`,
  ]);

  const b = createBuilder({
    matHost, pickerHost: rail, pieces: [10, 5, 1],
    allowHundred: false, maxValue: 99, maxUnits: 20, slots: 'auto',
    onChange: (st) => {
      grabsEl.textContent = String(st.grabs);
      check.disabled = st.value !== n;
      if (st.value === n) grok.say('Sieht gut aus – tippe „Fertig“.');
      else if (st.value === swapDigits(n)) grok.say(`Das ist ${st.value} – Zehner und Einer sind vertauscht!`, { mood: 'think' });
    },
    onLimit: (why) => { if (why === 'units') grok.say('Kein Platz mehr für Einer – bündeln oder wegräumen.', { mood: 'think' }); },
    onHint: (k) => { if (k === 'ones-to-tens') grok.say('Erst 10 Einer – dann wird daraus ein Zehner.', { mood: 'think' }); },
  });
  clear.addEventListener('click', () => { b.set({}); b.resetGrabs(); grabsEl.textContent = '0'; check.disabled = true; });
  check.addEventListener('click', () => {
    if (b.value() !== n) return;
    const g = b.state.grabs;
    grok.cheer(g <= ideal
      ? `Genau! ${tens} Zehner und ${units} Einer – mit nur ${g} Griffen.`
      : `Genau! ${tens} Zehner und ${units} Einer.`);
    check.disabled = true;
    setTimeout(onSolved, 900);
  });
  return () => b.destroy();
}
