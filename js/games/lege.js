// Lege die Zahl: zweistellige Zahl mit Zehnern, Fünfern und Einern legen – möglichst mit wenigen Griffen.
import { h, fresh, numberWord, swapDigits } from '../util.js?v=4';
import { createBuilder } from '../builder.js?v=4';
import { ICON_CLEAR, ICON_CHECK, ICON_HAND } from '../icons.js?v=4';

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
    useWord ? h('span', { class: 'task-word' }, numberWord(n)) : h('span', { class: 'task-num' }, String(n)),
    h('span', { class: 'meta-chip', title: 'Griffe', 'aria-label': 'Griffe' }, h('span', { html: ICON_HAND, style: { display: 'inline-flex', width: '1.1em' } }), grabsEl),
  );
  const matHost = h('div', { class: 'bmat-host' });
  stage.append(target, matHost);
  const clear = h('button', { class: 'btn btn--soft btn-icon', type: 'button', 'aria-label': 'Leeren', title: 'Leeren', html: ICON_CLEAR });
  const check = h('button', { class: 'btn btn--go', type: 'button', disabled: true, 'aria-label': 'Fertig', title: 'Fertig', html: ICON_CHECK });
  actions.append(clear, check);

  grok.say(useWord ? `Leg <b>${numberWord(n)}</b>!` : `Leg <b>${n}</b>!`);
  grok.setHints([
    useWord ? `„${numberWord(n)}“: die Zehner kommen zuletzt.` : `Zuerst die Zehner: ${tens}.`,
    `Einer: ${units}. ${units >= 5 ? 'Nimm einen Fünfer!' : ''}`,
    `Geht mit ${ideal} Griffen.`,
  ]);

  const b = createBuilder({
    matHost, pickerHost: rail, pieces: [10, 5, 1],
    allowHundred: false, maxValue: 99, maxUnits: 20, slots: 'auto',
    onChange: (st) => {
      grabsEl.textContent = String(st.grabs);
      check.disabled = st.value !== n;
      if (st.value === n) grok.say('Fertig? Tipp ✓', { mood: 'happy' });
      else if (st.value === swapDigits(n)) grok.say(`Das ist ${st.value} – vertauscht!`, { mood: 'think' });
    },
    onLimit: (why) => { if (why === 'units') grok.say('Voll! Erst <b>Zehner machen</b>.', { mood: 'think' }); },
    onHint: (k) => { if (k === 'ones-to-tens') grok.say('Noch keine 10.', { mood: 'think' }); },
  });
  const stopHint = b.hint('drag10', 'lege');
  clear.addEventListener('click', () => { b.set({}); b.resetGrabs(); grabsEl.textContent = '0'; check.disabled = true; });
  check.addEventListener('click', () => {
    if (b.value() !== n) return;
    const g = b.state.grabs;
    grok.cheer(g <= ideal ? `Genau – mit nur ${g} Griffen!` : `Genau! ${tens} Zehner, ${units} Einer.`);
    check.disabled = true;
    setTimeout(onSolved, 900);
  });
  return () => { stopHint(); b.destroy(); };
}
