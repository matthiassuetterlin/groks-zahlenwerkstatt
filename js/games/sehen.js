// Schnelles Sehen: kurz aufblitzen (≈1 s), dann aus dem Kopf nachlegen – mit dem Fünfer-Griff.
// Danach: „Wie hast du's gesehen?“ als Symbol-Chips. Bei einem Fehler leuchtet die Struktur auf.
import { h, fresh, numberWord, fitStage } from '../util.js?v=8';
import { quantity, speakCards } from '../blocks.js?v=8';
import { createBuilder } from '../builder.js?v=8';
import { burst, setShown } from '../fx.js?v=8';
import { ICON_EYE, ICON_CHECK, ICON_CLEAR, ICON_SEEN_FIVE, ICON_SEEN_BAR, ICON_SEEN_DOUBLE, ICON_SEEN_GAP } from '../icons.js?v=8';

// Strategie-Chips: was hat das Kind „gesehen“? Jede Antwort ist richtig – es geht ums Bewusstmachen.
const SEEN = {
  five: { icon: ICON_SEEN_FIVE, label: 'Volle Fünf', group: 'kraft5', say: (n) => `Fünf und ${n % 5} – ohne Zählen!` },
  bar: { icon: ICON_SEEN_BAR, label: 'Stangen', group: 'place', say: (n) => `${Math.floor(n / 10)} Stangen – zack!` },
  double: { icon: ICON_SEEN_DOUBLE, label: 'Doppel', group: 'doubles', say: () => 'Zwei gleiche Reihen – schlau!' },
  gap: { icon: ICON_SEEN_GAP, label: 'Lücke bis 10', group: 'bonds10', say: (n) => `${10 - (n % 10)} fehlen bis zur 10 – stark!` },
};

function chipsFor(n) {
  const u = n % 10;
  const out = [];
  if (n >= 10) out.push('bar');
  if (u >= 5) out.push('five');
  if (u >= 2 && u <= 8) out.push('double');
  if (u >= 6) out.push('gap');
  if (!out.includes('five')) out.push('five');
  return out.slice(0, 4);
}

export function playSehen(stage, { level, grok, onSolved, rail, actions }) {
  const n = fresh(level.gen);
  const showMs = level.showMs || 1000;
  const pieces = level.pieces || [10, 5, 1];
  const board = h('div', { class: 'sehen-board' }, quantity(n));
  const bar = h('span', { class: 'peek-bar' }, h('i', { style: { '--ms': showMs + 'ms' } }));
  const prompt = h('div', { class: 'task' }, h('span', { class: 'peek', 'aria-label': 'Schau genau' }, h('span', { html: ICON_EYE, style: { display: 'inline-flex' } }), bar));
  stage.append(prompt);
  const fs = fitStage(stage, board, { max: n > 20 ? 1.6 : 2.4 });
  const matHost = h('div', { class: 'bmat-host', hidden: true });
  stage.append(matHost);

  grok.say('Schau – nicht zählen!');
  grok.setHints(['Erst schauen, dann legen.', 'Eine Fünf und …?', 'Schau auf die Fünfer und Stangen.']);

  let b = null, stopHint = () => {}, timers = [], wrong = 0, done = false;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clear = h('button', { class: 'btn btn--soft btn-icon', type: 'button', 'aria-label': 'Leeren', title: 'Leeren', html: ICON_CLEAR });
  const check = h('button', { class: 'btn btn--go btn-check', type: 'button', disabled: true, 'aria-label': 'Fertig', title: 'Fertig', html: ICON_CHECK });

  // Knöpfe stehen von Anfang an (unsichtbar) in der Leiste – beim Nachlegen verschiebt sich nichts
  setShown(clear, false); setShown(check, false);
  actions.append(clear, check);
  function relay() {
    fs.box.hidden = true;
    matHost.hidden = false;
    setShown(clear, true); setShown(check, true); check.disabled = true;
    prompt.replaceChildren(h('span', { class: 'task-q', 'aria-label': 'Leg es nach' }, h('span', { html: ICON_EYE, style: { display: 'inline-flex', width: '1.2em', opacity: '.55' } }), '?'));
    b = createBuilder({
      matHost, pickerHost: rail, pieces,
      allowHundred: false, maxValue: 99, maxUnits: n <= 10 ? 10 : 20, slots: n <= 10 ? 1 : 'auto',
      onChange: (st) => { check.disabled = st.value === 0 || done; },
      onLimit: (why) => { if (why === 'units') grok.say('Voll! Nimm eine Stange.', { mood: 'think' }); },
    });
    grok.say('Leg es nach!');
    stopHint = b.hint(pieces.includes(5) && n < 10 ? 'drag5' : n >= 10 ? 'drag10' : 'drag1', 'sehen-legen');
  }

  // Fehler: das Original kommt kurz zurück – Fünfer und Stangen leuchten.
  function showStructure() {
    matHost.hidden = true;
    fs.box.hidden = false;
    board.classList.add('show-struct');
    fs.refit();
    later(() => {
      board.classList.remove('show-struct');
      fs.box.hidden = true;
      matHost.hidden = false;
      b?.fit?.();
      check.disabled = false;
    }, 1900);
  }

  function solved() {
    done = true;
    check.disabled = true;
    clear.disabled = true;
    b.picker?.classList.add('is-gone');
    prompt.replaceChildren(speakCards(n, { cls: 'speak--task' }));
    grok.cheer(`Genau, ${numberWord(n)}!`);
    burst(check, 10);
    // „Wie hast du's gesehen?“
    later(() => {
      const ask = h('div', { class: 'seen-ask', role: 'group', 'aria-label': "Wie hast du's gesehen?" },
        h('span', { class: 'seen-q', 'aria-hidden': 'true', html: ICON_EYE }));
      for (const k of chipsFor(n)) {
        const c = SEEN[k];
        const btn = h('button', { class: 'seen-chip', type: 'button', title: c.label, 'aria-label': c.label, dataset: { seen: k }, html: c.icon });
        btn.addEventListener('click', () => {
          if (ask.classList.contains('is-picked')) return;
          ask.classList.add('is-picked');
          btn.classList.add('is-picked');
          grok.cheer(c.say(n));
          later(() => onSolved([c.group]), 1100);
        });
        ask.append(btn);
      }
      rail.prepend(ask);
      grok.say("Wie hast du's gesehen?");
    }, 900);
  }

  clear.addEventListener('click', () => { b?.set({}); });
  check.addEventListener('click', () => {
    if (!b || done) return;
    if (b.value() === n) { solved(); return; }
    wrong++;
    check.disabled = true;
    grok.say(wrong > 1 ? `Schau: ${Math.floor(n / 10) ? Math.floor(n / 10) + ' Stangen, ' : ''}${n % 10} Einer.` : 'Schau nochmal – die Fünf leuchtet.', { mood: 'think' });
    showStructure();
  });

  later(relay, showMs);
  return () => { timers.forEach(clearTimeout); stopHint(); b?.destroy(); fs.destroy(); };
}
