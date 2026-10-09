// v8 „Studio“: gemeinsamer Rahmen für alle Aktivitäten (Werkstatt und Spiele).
// Eine Glasfläche über dem ganzen Bildschirm:
//   oben   – schmale Kopfzeile: Zurück · Fortschritt (Segmente) · Edelsteine · Grok (Heimplatz)
//   Mitte  – Bühne: Held-Zahl (Aufgabe) und fokussiertes Spielfeld auf einer Glasplatte
//   unten  – Bottom-Sheet: Teile/Antworten (tools) und Knöpfe (actions); Griff klappt Extras auf
import { h } from '../util.js?v=8';
import { gemTotal } from '../gems.js?v=8';
import { ICON_GEM, ICON_BACK, ICON_GEAR } from '../icons.js?v=8';

export function playShell(app, { title, badge = null, back = '#/', backLabel = 'Reise', cls = '' }) {
  const stage = h('div', { class: 'stage' });
  const tools = h('div', { class: 'rail-tools' });
  const actions = h('div', { class: 'rail-actions' });
  const extras = h('div', { class: 'rail-extras' });
  const grokSlot = h('div', { class: 'rail-grok' });
  const progress = h('div', { class: 'progress', 'aria-label': 'Fortschritt' });
  const gemCount = h('span', { class: 'gem-n' }, String(gemTotal()));
  const gems = h('div', { class: 'hud-gems', 'aria-label': 'Edelsteine' }, h('span', { class: 'gem-ico', html: ICON_GEM }), gemCount);
  const head = h('header', { class: 'play-head' },
    h('a', { class: 'back', href: back, 'aria-label': `Zurück: ${backLabel}` }, h('span', { class: 'back-ico', html: ICON_BACK })),
    h('div', { class: 'play-title' }, h('h1', {}, title), badge ? h('span', { class: 'badge' }, badge) : null),
    progress,
    h('div', { class: 'hud-right' }, gems, grokSlot),
  );
  const grab = h('button', { class: 'sheet-grab', type: 'button', 'aria-label': 'Mehr Werkzeuge', 'aria-expanded': 'false' }, h('i'));
  // Sichtbarer Knopf für die Extras (der Griff allein wäre für Kinder nicht zu entdecken)
  const more = h('button', { class: 'btn btn--soft btn-icon sheet-more', type: 'button', 'aria-label': 'Werkzeuge', 'aria-expanded': 'false', html: ICON_GEAR, hidden: true });
  const rail = h('aside', { class: 'rail sheet' }, grab, h('div', { class: 'sheet-row' }, tools, actions, more), extras);
  const card = h('div', { class: 'play-card' }, head, stage, rail);
  const section = h('section', { class: `play ${cls}` }, card);
  app.append(section);

  // Griff: Extras (selten gebrauchte Werkzeuge) auf- und zuklappen. Ohne Extras ist der Griff nur Zierde.
  const syncGrab = () => { const has = extras.childElementCount > 0; rail.classList.toggle('has-extras', has); more.hidden = !has; };
  const toggle = (open = !rail.classList.contains('is-open')) => {
    if (!extras.childElementCount) return;
    rail.classList.toggle('is-open', open);
    grab.setAttribute('aria-expanded', String(open));
    more.setAttribute('aria-expanded', String(open));
    more.classList.toggle('is-on', open);
  };
  grab.addEventListener('click', () => toggle());
  more.addEventListener('click', () => toggle());
  extras.addEventListener('click', (e) => { if (e.target.closest('button')) setTimeout(() => toggle(false), 250); });
  const mo = new MutationObserver(syncGrab);
  mo.observe(extras, { childList: true });
  // Leeres Sheet (Spiele ohne Ablage/Knöpfe): ausblenden, damit die Bühne den Platz bekommt
  const syncEmpty = () => rail.classList.toggle('is-empty', !tools.childElementCount && !actions.childElementCount && !extras.childElementCount);
  const mo2 = new MutationObserver(syncEmpty);
  [tools, actions, extras].forEach((el) => mo2.observe(el, { childList: true }));
  syncEmpty();

  const setGems = (n) => { gemCount.textContent = String(n); };
  const destroy = () => { mo.disconnect(); mo2.disconnect(); };
  return { section, head, card, stage, tools, actions, extras, grokSlot, progress, gems, setGems, rail, destroy };
}
