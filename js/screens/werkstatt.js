// Werkstatt: frei bauen. Gleicher Rahmen wie die Spiele – Bühne mit Anzeige + Matte, Leiste mit Auswahl, Knöpfen, Grok.
import { h, numberWord, pick } from '../util.js?v=3';
import { digits, numberCards } from '../blocks.js?v=3';
import { createBuilder } from '../builder.js?v=3';
import { createGrok } from '../grok.js?v=3';
import { getSetting, setSetting } from '../store.js?v=3';
import { burst } from '../fx.js?v=3';
import { playShell } from './shell.js?v=3';

function randomTarget() {
  const t = Math.floor(Math.random() * 10);
  const u = Math.floor(Math.random() * 10);
  return t * 10 + u || 7;
}

export function renderWerkstatt(app) {
  let target = getSetting('werkstattTarget', null);
  let auto = !!getSetting('autoBundle', false);

  const ui = playShell(app, { title: 'Werkstatt', badge: 'Frei bauen', back: '#/', backLabel: 'Start', cls: 'play--werkstatt' });
  const numEl = h('div', { class: 'ro-num' });
  const wordEl = h('div', { class: 'ro-word' });
  const placeEl = h('div', { class: 'ro-place' });
  const cardsHost = h('div', { class: 'ro-cards' });
  const readout = h('div', { class: 'readout' }, numEl, h('div', { class: 'ro-text' }, wordEl, placeEl), cardsHost);
  const matHost = h('div', { class: 'bmat-host' });
  ui.stage.append(readout, matHost);

  const targetBtn = h('button', { class: 'btn btn--soft', type: 'button' }, 'Lege-Ziel');
  const autoBtn = h('button', { class: 'btn btn--soft', type: 'button', 'aria-pressed': 'false' }, 'Auto-Bündeln');
  const clearBtn = h('button', { class: 'btn btn--soft', type: 'button' }, 'Leeren');
  ui.actions.append(targetBtn, autoBtn, clearBtn);

  const grok = createGrok(ui.grokSlot, {
    greeting: 'Zieh einen <b>Zehner</b> oder <b>Fünfer</b> auf die Matte. Tipp mich an für einen Tipp.',
  });
  grok.setHints([
    'Eine Zehnerstange hat 10 Perlen – 5 und nochmal 5.',
    'Zieh 10 Einer nach links: sie werden zu einem Zehner.',
    'Zieh einen Zehner nach rechts: er zerfällt in 10 Einer.',
    'Mit Fünfern baust du schneller – und siehst die Struktur besser.',
  ]);

  let solving = false;

  function update() {
    const { tens, units, hundred, value } = b.state;
    const goal = target != null;
    readout.classList.toggle('is-goal', goal);
    numEl.replaceChildren();
    if (goal) numEl.append(h('span', { class: 'ro-label' }, 'Lege'));
    numEl.append(digits(goal ? target : value, 'big'));
    wordEl.textContent = numberWord(goal ? target : value);
    placeEl.replaceChildren();
    if (goal) placeEl.append(h('span', { class: 'ro-sub' }, `Auf der Matte: ${value}`));
    if (hundred) placeEl.append(h('span', { class: 'pill pill--hun' }, '1 Hunderter'));
    else {
      if (tens) placeEl.append(h('span', { class: 'pill pill--ten' }, `${tens} Zehner`));
      if (units || !tens) placeEl.append(h('span', { class: 'pill pill--one' }, `${units} Einer`));
    }
    cardsHost.replaceChildren();
    if (!goal && !hundred && tens > 0) {
      const cards = numberCards(tens, units);
      cardsHost.append(cards);
      const stack = () => {
        if (cards.classList.contains('no-stack')) {
          grok.say(`${units} Einer? Da steckt ein Zehner drin – bündeln!`, { mood: 'think' });
          return;
        }
        cards.classList.toggle('stacked');
        grok.say(cards.classList.contains('stacked')
          ? `Die Null versteckt sich. Es bleibt <b>${value}</b>.`
          : `${tens * 10} und ${units} – tippe, um zu stapeln.`);
      };
      cards.addEventListener('click', stack);
      cards.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stack(); } });
    }
    if (goal && value === target && !solving) {
      solving = true;
      burst(numEl, 12);
      grok.cheer(units >= 10
        ? `Richtig, ${target}! Bündle 10 Einer – dann ist es noch ordentlicher.`
        : `Genau! ${target} = ${tens} Zehner und ${units} Einer.`);
      setTimeout(() => {
        solving = false;
        if (target == null) return;
        target = randomTarget();
        setSetting('werkstattTarget', target);
        updateButtons();
        b.set({});
        update();
        grok.say(`Neue Zahl: Lege <b>${target}</b>.`);
      }, 2600);
    }
  }

  const b = createBuilder({
    matHost, pickerHost: ui.tools, pieces: [10, 5, 1],
    allowHundred: true, maxValue: 100, maxUnits: 30, autoBundle: auto, slots: 10,
    onChange: update,
    onLimit: (why) => {
      if (why === 'max') grok.say('Mehr als 100 geht hier nicht.', { mood: 'think' });
      if (why === 'units') grok.say('Erst bündeln – dann ist wieder Platz für Einer.', { mood: 'think' });
      if (why === 'tens') grok.say('Zehn Zehner werden zu einem Hunderter.', { mood: 'think' });
    },
    onHint: (kind) => {
      if (kind === 'ones-to-tens') grok.say('Das sind noch keine 10. Mach ein Feld voll – dann wird ein Zehner daraus.', { mood: 'think' });
      if (kind === 'hundred-to-units') grok.say('Erst den Hunderter in 10 Zehner tauschen.', { mood: 'think' });
    },
  });

  function updateButtons() {
    targetBtn.textContent = target == null ? 'Lege-Ziel' : 'Ziel aus';
    targetBtn.classList.toggle('is-on', target != null);
    autoBtn.classList.toggle('is-on', auto);
    autoBtn.setAttribute('aria-pressed', String(auto));
  }

  targetBtn.addEventListener('click', () => {
    if (target == null) {
      target = randomTarget();
      setSetting('werkstattTarget', target);
      b.set({});
      grok.say(`Lege die Zahl <b>${target}</b>. Wie viele Zehner brauchst du?`);
    } else {
      target = null;
      setSetting('werkstattTarget', null);
      grok.say('Frei bauen – ohne Ziel.');
    }
    updateButtons();
    update();
  });

  autoBtn.addEventListener('click', () => {
    auto = !auto;
    setSetting('autoBundle', auto);
    updateButtons();
    b.setOption('autoBundle', auto);
    grok.say(auto
      ? 'Auto-Bündeln ist an: 10 Einer werden von allein zu einem Zehner.'
      : 'Jetzt bündelst du selbst: volles Feld nach links ziehen oder den Knopf antippen.');
  });

  clearBtn.addEventListener('click', () => {
    b.set({});
    update();
    grok.say(pick(['Frisch und leer.', 'Neu anfangen!', 'Die Matte ist leer.']));
  });

  updateButtons();
  update();
  if (target != null) grok.say(`Lege die Zahl <b>${target}</b>.`);

  return () => { b.destroy(); grok.destroy(); ui.destroy(); };
}
