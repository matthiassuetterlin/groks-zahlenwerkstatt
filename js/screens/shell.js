// Gemeinsamer Rahmen für alle Aktivitäten (Werkstatt und Spiele):
// Kopfzeile + eine Karte mit Bühne (links/oben) und Leiste (rechts/unten) mit Werkzeug, Knöpfen und Grok.
import { h } from '../util.js?v=6';

export function playShell(app, { title, badge = null, back = '#/lernen', backLabel = 'Lernen', cls = '' }) {
  const stage = h('div', { class: 'stage' });
  const tools = h('div', { class: 'rail-tools' });
  const actions = h('div', { class: 'rail-actions' });
  const grokSlot = h('div', { class: 'rail-grok' });
  const progress = h('div', { class: 'progress' });
  const head = h('header', { class: 'play-head' },
    h('a', { class: 'back', href: back, 'aria-label': `Zurück: ${backLabel}` }, h('span', { class: 'back-arrow', 'aria-hidden': 'true' }, '←'), h('span', { class: 'back-label' }, backLabel)),
    h('div', { class: 'play-title' }, h('h1', {}, title), badge ? h('span', { class: 'badge' }, badge) : null),
    progress,
  );
  const rail = h('aside', { class: 'rail' }, tools, actions, grokSlot);
  const card = h('div', { class: 'play-card' }, stage, rail);
  const section = h('section', { class: `play ${cls}` }, head, card);
  app.append(section);

  // Passt in der Seitenleiste nicht alles untereinander (große Schrift, niedriger Bildschirm),
  // schwebt Groks Blase über dem Werkzeug – so muss nie gescrollt werden.
  let raf = 0;
  const checkTight = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (!rail.isConnected) return;
      const side = getComputedStyle(rail).display === 'flex';
      if (!side) { rail.classList.remove('is-tight'); return; }
      rail.classList.remove('is-tight');
      if (rail.scrollHeight > rail.clientHeight + 1) rail.classList.add('is-tight');
    });
  };
  const ro = new ResizeObserver(checkTight);
  [rail, tools, actions, grokSlot].forEach((el) => ro.observe(el));
  window.addEventListener('gzw:settings', checkTight);
  const destroy = () => { ro.disconnect(); window.removeEventListener('gzw:settings', checkTight); };
  return { section, head, card, stage, tools, actions, grokSlot, progress, destroy };
}
