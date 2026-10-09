import { h, fitAll } from '../util.js?v=7';
import { createGrok } from '../grok.js?v=7';
import { quantity, field20 } from '../blocks.js?v=7';
import { GAMES } from '../games/index.js?v=7';

export function renderHome(app) {
  const grokSlot = h('div', { class: 'hero-grok' });
  const page = h('section', { class: 'home' },
    h('div', { class: 'hero' },
      grokSlot,
      h('div', { class: 'hero-text' },
        h('h1', { class: 'hero-title' }, 'Grok’s', h('br'), 'Zahlenwerkstatt'),
        h('p', { class: 'hero-sub' }, 'Zehner, Fünfer, Einer – ', h('b', {}, 'sehen statt zählen'), '.'),
      ),
    ),
    h('div', { class: 'home-cards' },
      h('a', { class: 'home-card home-card--werkstatt', href: '#/werkstatt' },
        h('div', { class: 'home-card-vis' }, quantity(34)),
        h('div', { class: 'home-card-text' }, h('h2', {}, 'Werkstatt'), h('p', {}, 'Frei bauen.')),
        h('span', { class: 'home-card-go', 'aria-hidden': 'true' }, '→'),
      ),
      h('a', { class: 'home-card home-card--lernen', href: '#/lernen' },
        h('div', { class: 'home-card-vis' }, h('div', { class: 'home-lernen-vis' }, field20(13), h('div', { class: 'mini-choices' }, h('span', {}, '12'), h('span', { class: 'on' }, '13'), h('span', {}, '31')))),
        h('div', { class: 'home-card-text' }, h('h2', {}, 'Lernen'), h('p', {}, `${GAMES.length} Spiele · 4 Phasen · bis 100`)),
        h('span', { class: 'home-card-go', 'aria-hidden': 'true' }, '→'),
      ),
    ),
    h('a', { class: 'home-parents', href: '#/eltern' }, 'Für Eltern: Wie die Werkstatt hilft'),
  );
  app.append(page);
  const unfit = fitAll([...page.querySelectorAll('.home-card-vis')], 14);
  const grok = createGrok(grokSlot, { layout: 'hero', greeting: 'Hallo! Ich bin <b>Grok</b>. Wir bauen Zahlen!' });
  grok.setHints([
    '<b>Werkstatt</b>: frei bauen.',
    '<b>Lernen</b>: kleine Spiele.',
    'Fünf Perlen sieht man sofort!',
  ]);
  return () => { unfit(); grok.destroy(); };
}
