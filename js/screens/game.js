import { h, pick, PRAISE } from '../util.js';
import { gameById } from '../games/index.js';
import { createGrok } from '../grok.js';
import { markLevel } from '../store.js';
import { burst } from '../fx.js';

export function renderGame(app, id, levelNum) {
  const game = gameById(id);
  if (!game) { location.hash = '#/lernen'; return () => {}; }
  const level = game.levels[levelNum - 1] || game.levels[0];
  const lv = levelNum;

  const stage = h('div', { class: 'stage' });
  const progress = h('div', { class: 'progress' });
  const grokSlot = h('div', { class: 'side-grok' });
  const back = h('a', { class: 'back', href: '#/lernen' }, '← Lernen');

  app.append(h('section', { class: 'play' },
    h('header', { class: 'play-head' },
      back,
      h('div', { class: 'play-title' }, h('h1', {}, game.title), h('span', { class: 'badge' }, `Stufe ${lv} · ${level.label}`)),
      progress,
    ),
    h('div', { class: 'play-body' }, stage, grokSlot),
  ));

  const grok = createGrok(grokSlot, { greeting: null });
  let round = 0;
  let score = 0;
  let alive = true;
  let endCleanup = null;

  function paintProgress() {
    progress.replaceChildren();
    for (let i = 0; i < level.rounds; i++) {
      progress.append(h('span', { class: 'dot' + (i < score ? ' is-on' : '') + (i === round ? ' is-now' : '') }));
    }
  }

  function next() {
    if (!alive) return;
    endCleanup?.();
    endCleanup = null;
    if (round >= level.rounds) return finish();
    paintProgress();
    stage.replaceChildren();
    endCleanup = game.play(stage, {
      level, round, grok,
      onSolved: () => {
        if (!alive) return;
        score++;
        paintProgress();
        round++;
        setTimeout(next, 900);
      },
    });
  }

  function finish() {
    markLevel(game.id, lv);
    round = -1;
    paintProgress();
    stage.replaceChildren();
    const done = h('div', { class: 'done' },
      h('h2', {}, pick(PRAISE)),
      h('p', {}, `Stufe ${lv} geschafft – ${score} von ${level.rounds}.`),
      h('div', { class: 'done-actions' },
        h('a', { class: 'btn btn--primary', href: '#/lernen' }, 'Zu den Spielen'),
        levelNum < game.levels.length
          ? h('a', { class: 'btn', href: `#/spiel/${game.id}/${levelNum + 1}` }, 'Nächste Stufe')
          : h('a', { class: 'btn', href: `#/spiel/${game.id}/1` }, 'Nochmal'),
      ),
    );
    stage.append(done);
    burst(done, 16);
    grok.cheer(pick(['Das hast du super gemacht!', 'Ich bin stolz auf dich!', 'Weiter so!']));
  }

  next();
  return () => { alive = false; endCleanup?.(); grok.destroy(); };
}
