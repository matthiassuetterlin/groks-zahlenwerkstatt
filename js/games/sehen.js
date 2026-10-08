import { h, options, swapDigits, fresh, numberWord, fitStage } from '../util.js?v=3';
import { quantity } from '../blocks.js?v=3';
import { choices } from '../fx.js?v=3';

export function playSehen(stage, { level, grok, onSolved, rail }) {
  const n = fresh(level.gen);
  const showMs = level.showMs || 2000;
  const board = h('div', { class: 'sehen-board' }, quantity(n));
  const prompt = h('div', { class: 'task' }, h('span', { class: 'task-text' }, 'Schau genau …'));
  stage.append(prompt);
  const fs = fitStage(stage, board, { max: n > 20 ? 1.6 : 2.4 });
  const choicesHost = h('div', { class: 'rail-choices' }, h('p', { class: 'choices-q' }, 'Gleich verschwindet es …'));
  rail.append(choicesHost);

  grok.say('Schau kurz hin – <b>nicht</b> einzeln zählen. Fünfer und Zehner helfen.');
  grok.setHints([
    'Wie viele volle Zehnerstangen siehst du?',
    'Die Einer: eine volle Fünf und …?',
    'Zählen dauert zu lange – schau auf die Fünfer.',
  ]);

  const t = setTimeout(() => {
    board.classList.add('is-hidden');
    prompt.firstChild.textContent = 'Welche Zahl war das?';
    const opts = options(n, [n - 1, n + 1, n - 10, n + 10, swapDigits(n), n - 5, n + 5].filter((x) => x != null), { min: 1, max: 100, count: 3 });
    choicesHost.replaceChildren(h('p', { class: 'choices-q' }, 'Wie viele?'), choices(opts, (v) => {
      if (v === n) {
        board.classList.remove('is-hidden');
        prompt.firstChild.textContent = `Ja – ${n}!`;
        grok.cheer(`Genau, ${numberWord(n)}!`);
        setTimeout(onSolved, 700);
        return true;
      }
      grok.say('Noch einmal anschauen.', { mood: 'think' });
      board.classList.remove('is-hidden');
      setTimeout(() => board.classList.add('is-hidden'), 1400);
      return false;
    }));
  }, showMs);

  return () => { clearTimeout(t); fs.destroy(); };
}
