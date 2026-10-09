import { h, pick, PRAISE } from '../util.js?v=8';
import { gameById } from '../games/index.js?v=8';
import { createGrok } from '../grok.js?v=8';
import { markLevel, markSeen, markRound } from '../store.js?v=8';
import { nextStep } from '../path.js?v=8';
import { burst, glow } from '../fx.js?v=8';
import { playShell } from './shell.js?v=8';
import { gemTotal, gemsFor } from '../gems.js?v=8';
import { ICON_GEM, ICON_MAP, ICON_AGAIN, ICON_PLAY } from '../icons.js?v=8';
import { reducedMotion } from '../beadfx.js?v=8';

export function renderGame(app, id, levelNum) {
  const game = gameById(id);
  if (!game) { location.hash = '#/'; return () => {}; }
  const level = game.levels[levelNum - 1] || game.levels[0];
  const lv = levelNum;

  const ui = playShell(app, { title: game.title, badge: `Stufe ${lv} · ${level.label}`, cls: `play--${game.id} play--${game.id}-${levelNum}` + (level.mode ? ` mode--${level.mode}` : '') });
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
    const before = gemsFor(game.id, lv);
    markLevel(game.id, lv);
    const earned = gemsFor(game.id, lv) - before;
    round = -1;
    paintProgress();
    clear();
    ui.card.classList.add('is-done');
    // Empfehlung aus dem Lernpfad (nichts ist gesperrt)
    const nx = nextStep({ game: game.id, level: lv });
    const nxGame = nx && gameById(nx.game);
    const gem = h('span', { class: 'done-gem', html: ICON_GEM });
    const done = h('div', { class: 'done' },
      gem,
      h('div', { class: 'done-n' }, String(score), h('small', {}, `/${level.rounds}`)),
      h('h2', {}, pick(PRAISE)),
      h('div', { class: 'done-actions' },
        h('a', { class: 'btn done-pill', href: '#/', 'aria-label': 'Zur Reise', html: ICON_MAP }),
        h('a', { class: 'btn done-pill', href: `#/spiel/${game.id}/${levelNum}`, 'aria-label': 'Nochmal', html: ICON_AGAIN, onClick: (e) => { e.preventDefault(); window.dispatchEvent(new HashChangeEvent('hashchange')); } }),
        nxGame
          ? h('a', { class: 'btn btn--primary done-next', href: `#/spiel/${nx.game}/${nx.level}`, 'aria-label': `Als Nächstes: ${nxGame.title}, Stufe ${nx.level}` },
            h('span', { class: 'done-next-vis' }, nxGame.icon()), h('span', {}, nxGame.title), h('span', { html: ICON_PLAY }))
          : null,
      ),
    );
    stage.append(done);
    requestAnimationFrame(() => {
      const v = done.querySelector('.done-next-vis');
      const c = v?.firstElementChild;
      if (c) c.style.transform = `scale(${Math.min(1, (v.clientWidth - 8) / c.offsetWidth, (v.clientHeight - 8) / c.offsetHeight).toFixed(3)})`;
    });
    // Neuer Edelstein: fliegt vom großen Stein in den Zähler oben
    setTimeout(() => {
      if (!alive) return;
      burst(gem, 14);
      if (earned <= 0 || reducedMotion()) { ui.setGems(gemTotal()); return; }
      const r0 = gem.getBoundingClientRect(), r1 = ui.gems.getBoundingClientRect();
      const fly = h('span', { class: 'gem-fly', html: ICON_GEM });
      document.body.append(fly);
      const a = fly.animate([
        { transform: `translate(${r0.left + r0.width / 2 - 14}px, ${r0.top + r0.height / 2 - 14}px) scale(2.2)`, opacity: 0 },
        { transform: `translate(${r0.left + r0.width / 2 - 14}px, ${r0.top + r0.height / 2 - 34}px) scale(1.6)`, opacity: 1, offset: .2 },
        { transform: `translate(${r1.left + 12}px, ${r1.top + r1.height / 2 - 14}px) scale(.8)`, opacity: 1 },
      ], { duration: 1100, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'both' });
      a.onfinish = () => { fly.remove(); ui.setGems(gemTotal()); ui.gems.classList.remove('is-bump'); void ui.gems.offsetWidth; ui.gems.classList.add('is-bump'); };
      setTimeout(() => fly.remove(), 1600);
    }, 900);
    grok.cheer(pick(['Das hast du super gemacht!', 'Ich bin stolz auf dich!', 'Ein neuer Edelstein!']));
  }

  next();
  return () => { alive = false; endCleanup?.(); grok.destroy(); ui.destroy(); };
}
