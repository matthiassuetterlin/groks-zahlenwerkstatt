import { h, options, swapDigits, fresh, numberWord, fitStage } from '../util.js?v=5';
import { quantity } from '../blocks.js?v=5';
import { choices } from '../fx.js?v=5';
import { ICON_EYE } from '../icons.js?v=5';

export function playSehen(stage, { level, grok, onSolved, rail }) {
  const n = fresh(level.gen);
  const showMs = level.showMs || 2000;
  const board = h('div', { class: 'sehen-board' }, quantity(n));
  const bar = h('span', { class: 'peek-bar' }, h('i', { style: { '--ms': showMs + 'ms' } }));
  const prompt = h('div', { class: 'task' }, h('span', { class: 'peek', 'aria-label': 'Schau genau' }, h('span', { html: ICON_EYE, style: { display: 'inline-flex' } }), bar));
  stage.append(prompt);
  const fs = fitStage(stage, board, { max: n > 20 ? 1.6 : 2.4 });
  const choicesHost = h('div', { class: 'rail-choices' });
  rail.append(choicesHost);

  grok.say('Schau – nicht zählen!');
  grok.setHints([
    'Wie viele Stangen?',
    'Eine Fünf und …?',
    'Schau auf die Fünfer.',
  ]);

  const t = setTimeout(() => {
    board.classList.add('is-hidden');
    prompt.replaceChildren(h('span', { class: 'task-q' }, '?'));
    const opts = options(n, [n - 1, n + 1, n - 10, n + 10, swapDigits(n), n - 5, n + 5].filter((x) => x != null), { min: 1, max: 100, count: 3 });
    choicesHost.replaceChildren(choices(opts, (v) => {
      if (v === n) {
        board.classList.remove('is-hidden');
        prompt.replaceChildren(h('span', { class: 'task-num' }, String(n)));
        grok.cheer(`Genau, ${numberWord(n)}!`);
        setTimeout(onSolved, 700);
        return true;
      }
      grok.say('Schau nochmal.', { mood: 'think' });
      board.classList.remove('is-hidden');
      setTimeout(() => board.classList.add('is-hidden'), 1400);
      return false;
    }));
  }, showMs);

  return () => { clearTimeout(t); fs.destroy(); };
}
