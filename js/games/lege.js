// Lege die Zahl: zweistellige Zahl mit Zehnern, Fünfern und Einern legen – möglichst mit wenigen Griffen.
import { h, fresh, numberWord, swapDigits } from '../util.js?v=2';
import { createMat, createTray } from '../mat.js?v=2';

export function playLege(stage, { level, grok, onSolved, rail }) {
  const [lo, hi] = level.range;
  const n = fresh(() => {
    let x;
    do { x = lo + Math.floor(Math.random() * (hi - lo + 1)); } while (x % 10 === 0);
    return x;
  });
  const tens = Math.floor(n / 10), units = n % 10;
  const ideal = tens + Math.floor(units / 5) + (units % 5);
  const useWord = level.word;

  const matHost = h('div', { class: 'mat-host mat-host--game' });
  const trayHost = h('div', { class: 'tray-host' });
  const grabsEl = h('b', {}, '0');
  const target = h('div', { class: 'lege-target' },
    h('span', { class: 'lege-label' }, 'Lege'),
    useWord ? h('span', { class: 'lege-word big' }, numberWord(n)) : h('span', { class: 'lege-num' }, String(n)),
  );
  const check = h('button', { class: 'btn btn--primary', type: 'button', disabled: true }, 'Fertig');
  const clear = h('button', { class: 'btn btn--ghost', type: 'button' }, 'Leeren');
  stage.append(h('div', { class: 'lege' }, target, matHost));
  rail.append(trayHost, h('p', { class: 'grabs-line' }, 'Griffe: ', grabsEl), h('div', { class: 'rail-actions' }, clear, check));

  grok.say(useWord
    ? `Lege <b>${numberWord(n)}</b>. Achtung: Beim Sprechen kommen die Einer zuerst!`
    : `Lege <b>${n}</b>. Wie viele Zehner, wie viele Einer?`);
  grok.setHints([
    useWord ? `„${numberWord(n)}“: Die Zehner hörst du am Ende.` : `Die erste Ziffer sagt die Zehner: ${tens}.`,
    `Die Einer: ${units}. ${units >= 5 ? 'Ein Fünfer hilft!' : ''}`,
    `Am schnellsten geht es mit ${ideal} Griffen.`,
  ]);

  const mat = createMat(matHost, {
    allowHundred: false, maxValue: 99, maxUnits: 20, slots: 'auto',
    onChange: (st) => {
      grabsEl.textContent = String(st.grabs);
      check.disabled = st.value !== n;
      if (st.value === n) grok.say('Sieht gut aus – tippe „Fertig“.');
      else if (st.value === swapDigits(n)) grok.say(`Das ist ${st.value} – Zehner und Einer sind vertauscht!`, { mood: 'think' });
    },
  });
  const tray = createTray(trayHost, { pieces: [10, 5, 1], onTap: (a) => mat.add(a) });
  clear.addEventListener('click', () => { mat.set({}); check.disabled = true; });
  check.addEventListener('click', () => {
    if (mat.value() !== n) return;
    const g = mat.state.grabs;
    grok.cheer(g <= ideal
      ? `Genau! ${tens} Zehner und ${units} Einer – mit nur ${g} Griffen.`
      : `Genau! ${tens} Zehner und ${units} Einer.`);
    setTimeout(onSolved, 900);
  });
  return () => { mat.destroy(); tray.destroy(); };
}
