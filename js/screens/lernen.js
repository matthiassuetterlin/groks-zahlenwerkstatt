import { h, fitAll } from '../util.js?v=2';
import { GAMES } from '../games/index.js?v=2';
import { levelDone } from '../store.js?v=2';

export function renderLernen(app) {
  const grid = h('div', { class: 'game-grid' });
  GAMES.forEach((g, gi) => {
    const levels = h('div', { class: 'levels' });
    const nextOpen = g.levels.findIndex((_, i) => !levelDone(g.id, i + 1));
    g.levels.forEach((lv, i) => {
      const done = levelDone(g.id, i + 1);
      levels.append(h('a', {
        class: 'level' + (done ? ' is-done' : '') + (i === nextOpen ? ' is-next' : ''),
        href: `#/spiel/${g.id}/${i + 1}`,
        'aria-label': `${g.title}, Stufe ${i + 1}: ${lv.label}${done ? ', geschafft' : ''}`,
      }, h('span', { class: 'level-num' }, done ? '✓' : String(i + 1)), h('span', { class: 'level-label' }, lv.label)));
    });
    grid.append(h('article', { class: 'game-card', style: { '--d': gi * 50 + 'ms' } },
      h('div', { class: 'game-card-vis' }, g.icon()),
      h('h2', {}, g.title),
      h('p', {}, g.short),
      levels,
    ));
  });
  app.append(h('section', { class: 'lernen' },
    h('header', { class: 'page-head' }, h('h1', {}, 'Lernen'), h('p', {}, 'Wähle ein Spiel. Jedes hat drei Stufen.')),
    grid,
  ));
  return fitAll([...grid.querySelectorAll('.game-card-vis')], 12);
}
