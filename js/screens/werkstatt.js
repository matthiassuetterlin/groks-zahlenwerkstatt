// Werkstatt: frei bauen. Gleicher Rahmen wie die Spiele – Bühne mit Anzeige + Matte, Leiste mit Auswahl, Knöpfen, Grok.
import { h, numberWord, pick } from '../util.js?v=4';
import { digits, numberCards } from '../blocks.js?v=4';
import { createBuilder } from '../builder.js?v=4';
import { createGrok } from '../grok.js?v=4';
import { getSetting, setSetting } from '../store.js?v=4';
import { burst } from '../fx.js?v=4';
import { playShell } from './shell.js?v=4';
import { ICON_TARGET, ICON_AUTO, ICON_CLEAR, ICON_BAR, ICON_BEAD, ICON_PLATE } from '../icons.js?v=4';

const chip = (cls, icon, n) => h('span', { class: `ro-chip ro-chip--${cls}` }, h('span', { html: icon, style: { display: 'inline-flex' } }), String(n));

function randomTarget() {
  const t = Math.floor(Math.random() * 10);
  const u = Math.floor(Math.random() * 10);
  return t * 10 + u || 7;
}

export function renderWerkstatt(app) {
  let target = getSetting('werkstattTarget', null);
  let auto = !!getSetting('autoBundle', false);

  const ui = playShell(app, { title: 'Werkstatt', back: '#/', backLabel: 'Start', cls: 'play--werkstatt' });
  const numEl = h('div', { class: 'ro-num' });
  const wordEl = h('div', { class: 'ro-word' });
  const placeEl = h('div', { class: 'ro-place' });
  const cardsHost = h('div', { class: 'ro-cards' });
  const readout = h('div', { class: 'readout' }, numEl, h('div', { class: 'ro-text' }, wordEl, placeEl), cardsHost);
  const matHost = h('div', { class: 'bmat-host' });
  ui.stage.append(readout, matHost);

  const targetBtn = h('button', { class: 'btn btn--soft btn-icon', type: 'button', 'aria-label': 'Zahl zum Nachlegen', title: 'Zahl zum Nachlegen', html: ICON_TARGET });
  const autoBtn = h('button', { class: 'btn btn--soft btn-icon', type: 'button', 'aria-pressed': 'false', 'aria-label': 'Automatisch bündeln', title: 'Automatisch bündeln', html: ICON_AUTO });
  const clearBtn = h('button', { class: 'btn btn--soft btn-icon', type: 'button', 'aria-label': 'Matte leeren', title: 'Matte leeren', html: ICON_CLEAR });
  ui.actions.append(targetBtn, autoBtn, clearBtn);

  const grok = createGrok(ui.grokSlot, {
    greeting: 'Zieh Perlen auf die Matte!',
  });
  grok.setHints([
    'Eine Stange = 10. Fünf und fünf.',
    '10 Einer? Drück <b>Zehner machen</b>!',
    'Hammer: aus 1 Zehner werden 10 Einer.',
    'Fünfer sind schneller als Einer.',
  ]);

  let solving = false;

  function update() {
    const { tens, units, hundred, value } = b.state;
    const goal = target != null;
    readout.classList.toggle('is-goal', goal);
    numEl.replaceChildren();
    if (goal) numEl.append(h('span', { class: 'ro-goal', html: ICON_TARGET, 'aria-label': 'Lege' }));
    numEl.append(digits(goal ? target : value, 'big'));
    wordEl.textContent = numberWord(goal ? target : value);
    placeEl.replaceChildren();
    const chips = h('span', { class: 'ro-chips' });
    if (hundred) chips.append(chip('hun', ICON_PLATE, 1));
    else {
      if (tens || !units) chips.append(chip('ten', ICON_BAR, tens));
      if (units || !tens) chips.append(chip('one', ICON_BEAD, units));
    }
    if (goal) placeEl.append(h('span', { class: 'ro-now' }, '= ' + value), chips);
    else placeEl.append(chips);
    cardsHost.replaceChildren();
    if (!goal && !hundred && tens > 0) {
      const cards = numberCards(tens, units);
      cardsHost.append(cards);
      const stack = () => {
        if (cards.classList.contains('no-stack')) {
          grok.say(`${units} Einer? Erst <b>Zehner machen</b>!`, { mood: 'think' });
          return;
        }
        cards.classList.toggle('stacked');
        grok.say(cards.classList.contains('stacked')
          ? `Die Null versteckt sich: <b>${value}</b>.`
          : `${tens * 10} und ${units}.`);
      };
      cards.addEventListener('click', stack);
      cards.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stack(); } });
    }
    if (goal && value === target && !solving) {
      solving = true;
      burst(numEl, 12);
      grok.cheer(units >= 10
        ? `${target}! Jetzt noch <b>Zehner machen</b>.`
        : `Genau! ${tens} Zehner, ${units} Einer.`);
      setTimeout(() => {
        solving = false;
        if (target == null) return;
        target = randomTarget();
        setSetting('werkstattTarget', target);
        updateButtons();
        b.set({});
        update();
        grok.say(`Jetzt <b>${target}</b>!`);
      }, 2600);
    }
  }

  const b = createBuilder({
    matHost, pickerHost: ui.tools, pieces: [10, 5, 1],
    allowHundred: true, maxValue: 100, maxUnits: 30, autoBundle: auto, slots: 10,
    onChange: update,
    onLimit: (why) => {
      if (why === 'max') grok.say('Bis 100 – mehr passt nicht.', { mood: 'think' });
      if (why === 'units') grok.say('Voll! Erst <b>Zehner machen</b>.', { mood: 'think' });
      if (why === 'tens') grok.say('10 Zehner = 1 Hunderter!', { mood: 'think' });
    },
    onHint: (kind) => {
      if (kind === 'ones-to-tens') grok.say('Noch keine 10. Mach das Feld voll!', { mood: 'think' });
      if (kind === 'hundred-to-units') grok.say('Erst den Hunderter aufbrechen.', { mood: 'think' });
    },
  });

  function updateButtons() {
    targetBtn.classList.toggle('is-on', target != null);
    targetBtn.setAttribute('aria-pressed', String(target != null));
    autoBtn.classList.toggle('is-on', auto);
    autoBtn.setAttribute('aria-pressed', String(auto));
  }

  targetBtn.addEventListener('click', () => {
    if (target == null) {
      target = randomTarget();
      setSetting('werkstattTarget', target);
      b.set({});
      grok.say(`Leg <b>${target}</b>!`);
    } else {
      target = null;
      setSetting('werkstattTarget', null);
      grok.say('Frei bauen!');
    }
    updateButtons();
    update();
  });

  autoBtn.addEventListener('click', () => {
    auto = !auto;
    setSetting('autoBundle', auto);
    updateButtons();
    b.setOption('autoBundle', auto);
    grok.say(auto ? 'Zauber an: 10 Einer werden von allein ein Zehner.' : 'Zauber aus: du machst die Zehner.');
  });

  clearBtn.addEventListener('click', () => {
    b.set({});
    update();
    grok.say(pick(['Leer!', 'Neu anfangen!']));
  });

  updateButtons();
  update();
  if (target != null) grok.say(`Leg <b>${target}</b>!`);
  const stopHint = b.hint('drag10', 'werkstatt');

  return () => { stopHint(); b.destroy(); grok.destroy(); ui.destroy(); };
}
