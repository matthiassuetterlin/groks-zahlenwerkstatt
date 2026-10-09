// Lernen: alle Spiele, geordnet nach den 4 Phasen des Lernpfads. Der Pfad empfiehlt nur – alles bleibt offen.
import { h, fitAll } from '../util.js?v=8';
import { GAMES, gameById } from '../games/index.js?v=8';
import { levelState } from '../store.js?v=8';
import { PHASES, nextStep, phaseProgress } from '../path.js?v=8';

const STATE_NAME = ['neu', 'angefangen', 'gelöst', 'sicher'];

export function renderLernen(app) {
  const nx = nextStep();
  const nxGame = nx && gameById(nx.game);
  const head = h('header', { class: 'page-head page-head--lernen' }, h('h1', {}, 'Lernen'));
  if (nxGame) {
    const lv = nxGame.levels[nx.level - 1];
    head.append(h('a', { class: 'next-banner', href: `#/spiel/${nx.game}/${nx.level}`, 'aria-label': `Als Nächstes: ${nxGame.title}, Stufe ${nx.level}: ${lv.label}` },
      h('span', { class: 'next-go', 'aria-hidden': 'true' }, '▶'),
      h('span', { class: 'next-vis' }, nxGame.icon()),
      h('span', { class: 'next-text' }, h('b', {}, nxGame.title), h('small', {}, `${nx.level} · ${lv.label}`)),
    ));
  }

  const phasesEl = h('div', { class: 'phases' });
  PHASES.forEach((p, pi) => {
    const prog = phaseProgress(p);
    const list = h('div', { class: 'pg-list' });
    // Spiele in der Reihenfolge ihres ersten Auftretens in dieser Phase
    const byGame = new Map();
    for (const [g, l] of p.steps) { if (!byGame.has(g)) byGame.set(g, []); byGame.get(g).push(l); }
    for (const [gid, lvls] of byGame) {
      const g = gameById(gid);
      if (!g) continue;
      const chips = h('div', { class: 'pg-levels' });
      let firstOpen = null;
      let rowNext = false;
      for (const l of lvls.sort((a, b) => a - b)) {
        const st = levelState(gid, l);
        const isNext = nx && nx.game === gid && nx.level === l;
        if (isNext) rowNext = true;
        if (firstOpen == null && st < 2) firstOpen = l;
        const lv = g.levels[l - 1];
        chips.append(h('a', {
          class: `pg-lv s${st}` + (isNext ? ' is-next' : ''),
          href: `#/spiel/${gid}/${l}`, title: lv.label,
          'aria-label': `${g.title}, Stufe ${l}: ${lv.label} (${STATE_NAME[st]})${isNext ? ', als Nächstes' : ''}`,
        }, h('span', { class: 'pg-lv-n' }, st >= 2 ? '✓' : String(l))));
      }
      const go = `#/spiel/${gid}/${firstOpen ?? lvls[0]}`;
      list.append(h('div', { class: 'pg-row' + (rowNext ? ' has-next' : '') },
        h('a', { class: 'pg-main', href: go, 'aria-label': `${g.title}: ${g.short}` },
          h('span', { class: 'pg-vis' }, g.icon()),
          h('span', { class: 'pg-title' }, g.title)),
        chips,
      ));
    }
    phasesEl.append(h('section', { class: 'phase' + (nx && nx.phase === p.id ? ' is-current' : ''), style: { '--d': pi * 60 + 'ms' }, 'aria-label': `Phase ${p.id}: ${p.title}, ${p.sub}` },
      h('header', { class: 'phase-head' },
        h('span', { class: 'phase-letter' }, p.id),
        h('span', { class: 'phase-name' }, h('b', {}, p.title), h('small', {}, p.sub)),
        h('span', { class: 'phase-bar', title: `${prog.solved} von ${prog.total}`, 'aria-label': `${prog.solved} von ${prog.total} gelöst` }, h('i', { style: { width: (prog.solved / prog.total) * 100 + '%' } })),
      ),
      list,
    ));
  });

  app.append(h('section', { class: 'lernen' }, head, phasesEl));
  return fitAll([...app.querySelectorAll('.pg-vis, .next-vis')], 3, 1);
}

export { GAMES };
