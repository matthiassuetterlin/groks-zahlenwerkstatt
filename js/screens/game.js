import { h, pick, PRAISE } from '../util.js?v=4';
import { gameById } from '../games/index.js?v=4';
import { createGrok } from '../grok.js?v=4';
import { markLevel } from '../store.js?v=4';
import { burst } from '../fx.js?v=4';
import { playShell } from './shell.js?v=4';

export function renderGame(app, id, levelNum) {
  const game = gameById(id);
  if (!game) { location.hash = '#/lernen'; return () => {}; }
  const level = game.levels[levelNum - 1] || game.levels[0];
  const lv = levelNum;

  const ui = playShell(app, { title: game.title, badge: `Stufe ${lv} · ${level.label}`, cls: `play--${game.id}` });
  const { stage, tools, actions, progress } = ui;
  const grok = createGrok(ui.grokSlot, { greeting: null });
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

  function clear() {
    stage.replaceChildren();
    tools.replaceChildren();
    actions.replaceChildren();
  }

  function next() {
    if (!alive) return;
    endCleanup?.();
    endCleanup = null;
    if (round >= level.rounds) return finish();
    paintProgress();
    clear();
    endCleanup = game.play(stage, {
      level, round, grok, rail: tools, actions,
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
    clear();
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
  return () => { alive = false; endCleanup?.(); grok.destroy(); ui.destroy(); };
}
