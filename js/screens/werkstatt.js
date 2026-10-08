import { h, numberWord, pick } from '../util.js';
import { digits, numberCards } from '../blocks.js';
import { createMat, createTray } from '../mat.js';
import { createGrok } from '../grok.js';
import { getSetting, setSetting } from '../store.js';
import { burst } from '../fx.js';

function randomTarget() {
  const t = Math.floor(Math.random() * 10); // 0–9 Zehner
  const u = Math.floor(Math.random() * 10);
  const n = t * 10 + u || 1; // nie 0
  return n === 100 ? 99 : n;
}

export function renderWerkstatt(app) {
  let target = getSetting('werkstattTarget', null);
  let auto = !!getSetting('autoBundle', false);

  const readEl = h('div', { class: 'readout-main' }, digits(0));
  const wordEl = h('div', { class: 'readout-word' }, numberWord(0));
  const placeEl = h('div', { class: 'readout-place' });
  const cardsHost = h('div', { class: 'readout-cards' });
  const status = h('div', { class: 'status' });
  const matHost = h('div', { class: 'mat-host' });
  const trayHost = h('div', { class: 'tray-host' });
  const grokSlot = h('div', { class: 'head-grok' });
  const targetBtn = h('button', { class: 'btn btn--ghost', type: 'button' }, 'Lege-Ziel');
  const autoBtn = h('button', { class: 'btn btn--ghost', type: 'button' }, 'Auto-Bündeln: aus');
  const clearBtn = h('button', { class: 'btn btn--ghost', type: 'button' }, 'Leeren');

  const page = h('section', { class: 'werkstatt' },
    h('header', { class: 'page-head page-head--werkstatt' },
      h('div', { class: 'page-title' }, h('h1', {}, 'Werkstatt'), h('p', {}, 'Zieh Zehner und Einer auf die Matte.')),
      grokSlot,
    ),
    h('div', { class: 'werkstatt-grid' },
      matHost,
      h('aside', { class: 'side' },
        trayHost,
        h('div', { class: 'readout' }, readEl, wordEl, placeEl, cardsHost, status),
        h('div', { class: 'side-actions' }, targetBtn, autoBtn, clearBtn),
      ),
    ),
  );
  app.append(page);

  const grok = createGrok(grokSlot, {
    layout: 'row',
    greeting: 'Zieh einen <b>Zehner</b> oder einen <b>Fünfer</b> auf die Matte. Antippe mich, wenn du einen Tipp brauchst.',
  });
  grok.setHints([
    'Eine Zehnerstange hat 10 Perlen – 5 und nochmal 5.',
    'Zieh 10 Einer nach links: sie werden zu einem Zehner.',
    'Zieh einen Zehner nach rechts: er zerfällt in 10 Einer.',
    'Mit Fünfern baust du schneller – und siehst die Struktur besser.',
  ]);

  let mat, tray;
  let solving = false;

  function update() {
    const { tens, units, hundred, value } = mat.state;
    const goal = target != null;
    readEl.replaceChildren();
    if (goal) readEl.append(h('span', { class: 'readout-label' }, 'Lege'));
    readEl.append(digits(goal ? target : value, 'big'));
    wordEl.textContent = numberWord(goal ? target : value);
    placeEl.replaceChildren();
    if (goal) placeEl.append(h('span', { class: 'readout-sub' }, 'Auf der Matte:'));
    if (hundred) placeEl.append(h('span', { class: 'pill pill--hun' }, '1 Hunderter'));
    else {
      if (tens) placeEl.append(h('span', { class: 'pill pill--ten' }, `${tens} Zehner`));
      if (units || !tens) placeEl.append(h('span', { class: 'pill pill--one' }, `${units} Einer`));
    }
    cardsHost.replaceChildren();
    if (!goal && !hundred && value > 0 && tens > 0) {
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
    page.classList.toggle('is-goal', goal);
    if (goal && value === target && !solving) {
      solving = true;
      status.className = 'status is-ok';
      status.textContent = 'Geschafft!';
      burst(readEl, 12);
      grok.cheer(units >= 10
        ? `Richtig, ${target}! Und wenn du 10 Einer bündelst, ist es noch ordentlicher.`
        : `Genau! ${target} = ${tens} Zehner und ${units} Einer.`);
      setTimeout(() => {
        solving = false;
        if (target == null) return;
        target = randomTarget();
        setSetting('werkstattTarget', target);
        updateTargetUI();
        status.className = 'status';
        status.textContent = '';
        mat.set({});
        update();
        grok.say(`Neue Zahl: Lege <b>${target}</b>.`);
      }, 2600);
    } else if (!solving) {
      status.className = 'status';
      status.textContent = '';
    }
  }

  function onHint(kind) {
    if (kind === 'ones-to-tens') grok.say('Die Einer sind noch keine Zehn. Fülle erst ein ganzes Feld, dann wird daraus ein Zehner.', { mood: 'think' });
    if (kind === 'hundred-to-units') grok.say('Ein Hunderter ist groß! Erst in 10 Zehner aufbrechen, dann kannst du Einer nehmen.', { mood: 'think' });
  }

  function remount() {
    mat?.destroy();
    tray?.destroy();
    matHost.replaceChildren();
    trayHost.replaceChildren();
    mat = createMat(matHost, {
      allowHundred: true, maxValue: 100, maxUnits: 30, autoBundle: auto, maxB: 34,
      onChange: update,
      onLimit: (why) => {
        if (why === 'max') grok.say('Mehr als 100 geht hier nicht.', { mood: 'think' });
        if (why === 'units') grok.say('Erst bündeln – dann ist wieder Platz für Einer.', { mood: 'think' });
        if (why === 'tens') grok.say('Zehn Zehner werden zu einem Hunderter.', { mood: 'think' });
      },
      onHint,
    });
    tray = createTray(trayHost, { onTap: (n) => mat.add(n) });
    update();
  }

  function updateTargetUI() {
    if (target == null) {
      targetBtn.textContent = 'Lege-Ziel';
      targetBtn.classList.remove('is-on');
      document.body.classList.remove('has-target');
    } else {
      targetBtn.textContent = `Ziel: ${target} · aus`;
      targetBtn.classList.add('is-on');
      document.body.classList.add('has-target');
    }
  }

  targetBtn.addEventListener('click', () => {
    if (target == null) {
      target = randomTarget();
      setSetting('werkstattTarget', target);
      updateTargetUI();
      mat.set({});
      update();
      grok.say(`Lege die Zahl <b>${target}</b>. Wie viele Zehner brauchst du?`);
    } else {
      target = null;
      setSetting('werkstattTarget', null);
      updateTargetUI();
      update();
      grok.say('Frei bauen – ohne Ziel.');
    }
  });

  autoBtn.addEventListener('click', () => {
    auto = !auto;
    setSetting('autoBundle', auto);
    autoBtn.textContent = `Auto-Bündeln: ${auto ? 'an' : 'aus'}`;
    autoBtn.classList.toggle('is-on', auto);
    mat.setOption('autoBundle', auto);
    grok.say(auto
      ? 'Wenn 10 Einer voll sind, werden sie von allein zu einem Zehner.'
      : 'Jetzt bündelst du selbst: volle Felder nach links ziehen oder antippen.');
  });

  clearBtn.addEventListener('click', () => {
    mat.set({});
    update();
    grok.say(pick(['Frisch und leer.', 'Neu anfangen!', 'Die Matte ist leer.']));
  });

  remount();
  autoBtn.textContent = `Auto-Bündeln: ${auto ? 'an' : 'aus'}`;
  autoBtn.classList.toggle('is-on', auto);
  updateTargetUI();
  if (target != null) grok.say(`Lege die Zahl <b>${target}</b>.`);

  return () => { mat?.destroy(); tray?.destroy(); grok.destroy(); document.body.classList.remove('has-target'); };
}
