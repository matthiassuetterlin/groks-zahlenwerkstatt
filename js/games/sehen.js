import { h, options, swapDigits, fresh, numberWord } from '../util.js';
import { quantity } from '../blocks.js';
import { choices } from '../fx.js';

export function playSehen(stage, { level, grok, onSolved }) {
  const n = fresh(level.gen);
  const showMs = level.showMs || 2000;
  const board = h('div', { class: 'sehen-board' }, quantity(n));
  board.style.setProperty('--b', n > 20 ? '24px' : n > 10 ? '34px' : '46px');
  const prompt = h('p', { class: 'prompt' }, 'Schau genau …');
  const choicesHost = h('div', {});
  stage.append(h('div', { class: 'sehen' }, prompt, board, choicesHost));

  grok.say('Schau kurz hin – <b>nicht</b> einzeln zählen. Fünfer und Zehner helfen.');
  grok.setHints([
    'Wie viele volle Zehnerstangen siehst du?',
    'Die Einer: eine volle Fünf und …?',
    `Die Zahl heißt ${numberWord(n)} – aber du sollst sie selbst finden!`,
  ]);

  let revealed = false;
  const t = setTimeout(() => {
    board.classList.add('is-hidden');
    prompt.textContent = 'Welche Zahl war das?';
    revealed = true;
    const opts = options(n, [n - 1, n + 1, n - 10, n + 10, swapDigits(n), n - 5, n + 5].filter((x) => x != null), {
      min: 1, max: 100, count: 3,
    });
    choicesHost.append(choices(opts, (v) => {
      if (v === n) {
        board.classList.remove('is-hidden');
        prompt.textContent = `Ja – ${n}!`;
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

  return () => clearTimeout(t);
}
