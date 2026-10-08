import { h, svg } from '../util.js?v=6';
import { frame, quantity, stick, rod, sbar, hundredMini, field20 } from '../blocks.js?v=6';
import { playSehen } from './sehen.js?v=6';
import { playVerliebt } from './verliebt.js?v=6';
import { playZerlege } from './zerlege.js?v=6';
import { playLege } from './lege.js?v=6';
import { playBuendeln } from './buendeln.js?v=6';
import { playPlus } from './plus.js?v=6';
import { playSchlange } from './schlange.js?v=6';
import { playDoppel } from './doppel.js?v=6';
import { playHundert } from './hundert.js?v=6';
import { playStrich } from './strich.js?v=6';

const STRICH_ICON = `<svg class="ico-strich" viewBox="0 0 120 50" aria-hidden="true">
  <path d="M6 40h108" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".6"/>
  <path d="M14 40 Q44 4 74 40" fill="none" style="stroke:var(--ten)" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M74 40 Q83 24 92 40" fill="none" style="stroke:var(--one)" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M92 40 Q101 24 110 40" fill="none" style="stroke:var(--one)" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M14 34v12M74 34v12M110 34v12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
</svg>`;

export const GAMES = [
  {
    id: 'sehen',
    title: 'Schnelles Sehen',
    short: 'Kurz hinschauen, nachlegen – und sagen, wie man es gesehen hat.',
    icon: () => h('div', { class: 'icon-stack' }, frame(7)),
    levels: [
      { label: 'bis 10', rounds: 5, showMs: 1000, pieces: [5, 1], gen: () => 4 + Math.floor(Math.random() * 7), groups: ['kraft5'] },
      { label: 'bis 20', rounds: 5, showMs: 1300, pieces: [10, 5, 1], gen: () => 11 + Math.floor(Math.random() * 9), groups: ['kraft5'] },
      { label: 'bis 100', rounds: 5, showMs: 1700, pieces: [10, 5, 1], gen: () => {
        const t = 2 + Math.floor(Math.random() * 6);
        const u = Math.floor(Math.random() * 10);
        return t * 10 + u;
      }, groups: ['place'] },
    ],
    play: playSehen,
  },
  {
    id: 'freunde', // interne ID bleibt (gespeicherter Fortschritt, Links)
    title: 'Verliebte Zahlen',
    short: 'Welche Zahl ist in die andere verliebt? Zusammen sind sie 10.',
    icon: () => h('div', { class: 'icon-stack' }, frame(7, { extra: 3 })),
    levels: [
      { label: 'Verliebt in 10', rounds: 5, mode: 'ten', groups: ['bonds10'] },
      { label: 'Verliebt in den Zehner', rounds: 5, mode: 'next', groups: ['bonds10'] },
      { label: 'Verliebt in 100', rounds: 5, mode: 'hundred', groups: ['bonds10', 'place'] },
    ],
    play: playVerliebt,
  },
  {
    id: 'schlange',
    title: 'Schlangen-Zehner',
    short: 'Bunte Stangen in die goldene Zehner-Schablone legen – Paare werden gold, der Rest grau.',
    icon: () => h('div', { class: 'icon-snake' }, sbar(7), sbar(3), sbar(6), sbar(4)),
    levels: [
      { label: 'Paare', rounds: 3, mode: 'pairs', groups: ['bonds10'] },
      { label: 'mit Rest', rounds: 3, mode: 'rest', groups: ['bonds10', 'tens'] },
      { label: 'als Zahl', rounds: 3, mode: 'number', groups: ['bonds10', 'place'] },
    ],
    play: playSchlange,
  },
  {
    id: 'zerlege',
    title: 'Zerlege-Zauber',
    short: 'Zahlen in Teile zaubern – alle Zerlegungen finden, verdeckte Teile erraten.',
    icon: () => h('div', { class: 'icon-stack' }, stick(8, 'one')),
    levels: [
      { label: 'Alle bis 10', rounds: 3, mode: 'chain', min: 5, max: 10, all: true, groups: ['kraft5'] },
      { label: 'bis 20', rounds: 4, mode: 'chain', min: 11, max: 18, groups: ['tens'] },
      { label: 'Schüttelbox', rounds: 5, mode: 'shake' },
      { label: 'Blitz-Gruppen', rounds: 8, mode: 'groups' },
    ],
    play: playZerlege,
  },
  {
    id: 'doppel',
    title: 'Doppel & Nachbar',
    short: 'Verdoppeln wie im Spiegel – und daraus die Nachbaraufgabe ableiten.',
    icon: () => h('div', { class: 'icon-mirror' }, stick(4, 'one'), h('i', { class: 'mirror-line' }), stick(4, 'one')),
    levels: [
      { label: 'Doppel bis 10', rounds: 5, mode: 'double', min: 1, max: 5, groups: ['doubles'] },
      { label: 'Doppel bis 20', rounds: 5, mode: 'double', min: 6, max: 10, groups: ['doubles'] },
      { label: 'Nachbarn', rounds: 5, mode: 'neighbor', min: 2, max: 9, groups: ['doubles', 'neighbors'] },
    ],
    play: playDoppel,
  },
  {
    id: 'lege',
    title: 'Lege die Zahl',
    short: 'Zahlen mit Zehnern und Einern legen – mit möglichst wenigen Griffen.',
    icon: () => h('div', { class: 'icon-stack' }, quantity(32)),
    levels: [
      { label: 'Zehner + Einer', rounds: 4, range: [21, 49], groups: ['place'] },
      { label: 'bis 79', rounds: 4, range: [31, 79], groups: ['place'] },
      { label: 'Zahlwörter', rounds: 4, range: [21, 99], word: true, groups: ['place'] },
      { label: 'Zehn und …', rounds: 5, mode: 'teen', groups: ['place'] },
      { label: 'Zahlenhaus', rounds: 4, mode: 'house', groups: ['place'] },
      { label: 'Aufräumen', rounds: 4, mode: 'tidy', groups: ['tens', 'place'] },
    ],
    play: playLege,
  },
  {
    id: 'buendeln',
    title: 'Bündeln',
    short: 'Tausche 10 Einer gegen einen Zehner – und zurück. An der Bank wird aufgeräumt.',
    icon: () => h('div', { class: 'icon-stack' }, frame(10), h('span', { class: 'icon-arrow' }, '→'), rod('ten')),
    levels: [
      { label: 'Einer → Zehner', rounds: 4, mode: 'to-tens', groups: ['tens'] },
      { label: 'Zehner → Einer', rounds: 4, mode: 'to-units', groups: ['tens'] },
      { label: 'Bank-Wechsel', rounds: 4, mode: 'bank', groups: ['tens', 'place'] },
    ],
    play: playBuendeln,
  },
  {
    id: 'plus',
    title: 'Plus mit Struktur',
    short: 'Über den Zehner – auf verschiedenen Wegen: Zehnerstopp, Doppel ±1, Kraft der Fünf, Analogie.',
    icon: () => h('div', { class: 'icon-stack' }, frame(8, { extra: 2 })),
    levels: [
      { label: 'bis 20', rounds: 4, kind: 'small', groups: ['bonds10'] },
      { label: 'Zehnerstopp', rounds: 4, kind: 'bridge', groups: ['bonds10'] },
      { label: 'große Zahlen', rounds: 4, kind: 'big', groups: ['place'] },
      { label: 'Doppel ±1', rounds: 4, kind: 'double', groups: ['doubles', 'neighbors'] },
      { label: 'Kraft der Fünf', rounds: 4, kind: 'five', groups: ['kraft5'] },
      { label: 'Analogie', rounds: 4, kind: 'analog', groups: ['place'] },
    ],
    play: playPlus,
  },
  {
    id: 'hundert',
    title: 'Hunderterfeld',
    short: 'Zahlen bis 100 mit dem Abdeckwinkel zeigen und erkennen.',
    icon: () => hundredMini(37),
    levels: [
      { label: 'Zahl zeigen', rounds: 5, mode: 'set', groups: ['place'] },
      { label: 'Zahl erkennen', rounds: 5, mode: 'read', groups: ['place'] },
      { label: 'Blitz', rounds: 5, mode: 'flash', groups: ['place', 'kraft5'] },
    ],
    play: playHundert,
  },
  {
    id: 'strich',
    title: 'Rechenstrich',
    short: 'Rechnen mit großen Sprüngen: +10, +5, +1 – ohne Hüpfen in Einerschritten.',
    icon: () => h('div', { class: 'icon-strich', html: STRICH_ICON }),
    levels: [
      { label: '+10 und +1', rounds: 4, chips: [10, 1], groups: ['place'] },
      { label: 'mit +5', rounds: 4, chips: [10, 5, 1], groups: ['place', 'kraft5'] },
      { label: 'Zehnerstopp', rounds: 4, chips: ['stop', 10, 5, 1], groups: ['place', 'bonds10'] },
    ],
    play: playStrich,
  },
];

export const gameById = (id) => GAMES.find((g) => g.id === id);
