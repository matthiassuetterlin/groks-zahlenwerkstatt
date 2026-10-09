import { h, pick, PRAISE } from '../util.js?v=7';
import { gameById } from '../games/index.js?v=7';
import { createGrok } from '../grok.js?v=7';
import { markLevel, markSeen, markRound } from '../store.js?v=7';
import { nextStep } from '../path.js?v=7';
import { burst, glow } from '../fx.js?v=7';
import { playShell } from './shell.js?v=7';

export function renderGame(app, id, levelNum) {
  const game = gameById(id);
  if (!game) { location.hash = '#/lernen'; return () => {}; }
  const level = game.levels[levelNum - 1] || game.levels[0];
  const lv = levelNum;

  const ui = playShell(app, { title: game.title, badge: `Stufe ${lv} · ${level.label}`, cls: `play--${game.id}` });
  const { stage, tools, actions, progress } = ui;
  const grokReal = createGrok(ui.grokSlot, { greeting: null });
  // In der ersten Runde geht Grok zur Aufgabe und erklärt dort; Fehler zeigt er an der Stelle,
  // an der das Kind gerade gearbeitet hat (s. grok.js). Spiele können mit {at} ein eigenes Ziel nennen.
  let introDone = false;
  const grok = {
    ...grokReal,
    say(text, opts = {}) {
      if (!('at' in opts) && !introDone && round === 0 && (opts.mood || 'talk') === 'talk') {
        introDone = true;
        // kurz warten: das Spiel baut die Aufgabe oft erst nach dem ersten Satz auf
        setTimeout(() => {
          if (!alive) return;
          const task = stage.querySelector('.task, .task-q, .choices-q, .sehen-board, .fit-content');
          grokReal.say(text, { ...opts, at: task || null });
        }, 120);
        return;
      }
      return grokReal.say(text, opts);
    },
    cheer: (text, opts) => grokReal.cheer(text, opts),
  };
  markSeen(game.id, lv);
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
      onSolved: (groups) => {
        if (!alive) return;
        markRound(game.id, lv, Array.isArray(groups) ? groups : (level.groups || []));
        glow(ui.card);
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
    // Empfehlung aus dem Lernpfad (nichts ist gesperrt)
    const nx = nextStep({ game: game.id, level: lv });
    const nxGame = nx && gameById(nx.game);
    const done = h('div', { class: 'done' },
      h('h2', {}, pick(PRAISE)),
      h('p', {}, `Stufe ${lv} geschafft – ${score} von ${level.rounds}.`),
      h('div', { class: 'done-actions' },
        nxGame
          ? h('a', { class: 'btn btn--primary btn-next', href: `#/spiel/${nx.game}/${nx.level}`, 'aria-label': `Als Nächstes: ${nxGame.title}, Stufe ${nx.level}` },
            h('span', { class: 'btn-next-ico', 'aria-hidden': 'true' }, '▶'), `${nxGame.title} ${nx.level}`)
          : null,
        h('a', { class: 'btn' + (nxGame ? '' : ' btn--primary'), href: '#/lernen' }, 'Zu den Spielen'),
        h('a', { class: 'btn', href: `#/spiel/${game.id}/${levelNum}`, onClick: (e) => { e.preventDefault(); window.dispatchEvent(new HashChangeEvent('hashchange')); } }, 'Nochmal'),
      ),
    );
    stage.append(done);
    burst(done, 16);
    grok.cheer(pick(['Das hast du super gemacht!', 'Ich bin stolz auf dich!', 'Weiter so!']));
  }

  next();
  return () => { alive = false; endCleanup?.(); grok.destroy(); ui.destroy(); };
}
