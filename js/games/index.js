import { h } from '../util.js?v=2';
import { frame, quantity, stick, rod } from '../blocks.js?v=2';
import { playSehen } from './sehen.js?v=2';
import { playFreunde } from './freunde.js?v=2';
import { playZerlege } from './zerlege.js?v=2';
import { playLege } from './lege.js?v=2';
import { playBuendeln } from './buendeln.js?v=2';
import { playPlus } from './plus.js?v=2';

export const GAMES = [
  {
    id: 'sehen',
    title: 'Schnelles Sehen',
    short: 'Kurz hinschauen – und die Zahl erkennen.',
    icon: () => h('div', { class: 'icon-stack' }, frame(7)),
    levels: [
      { label: 'bis 10', rounds: 5, showMs: 1800, gen: () => 4 + Math.floor(Math.random() * 7) },
      { label: 'bis 20', rounds: 5, showMs: 2000, gen: () => 11 + Math.floor(Math.random() * 10) },
      { label: 'bis 100', rounds: 5, showMs: 2400, gen: () => {
        const t = 1 + Math.floor(Math.random() * 7);
        const u = Math.floor(Math.random() * 10);
        return t * 10 + u || 10;
      }},
    ],
    play: playSehen,
  },
  {
    id: 'freunde',
    title: 'Zehnerfreunde',
    short: 'Was fehlt bis zum Zehner? Das passende Stück hineinziehen.',
    icon: () => h('div', { class: 'icon-stack' }, frame(7, { extra: 3 })),
    levels: [
      { label: 'Freunde zu 10', rounds: 5, mode: 'ten' },
      { label: 'Zum nächsten Zehner', rounds: 5, mode: 'next' },
      { label: 'Freunde zu 100', rounds: 5, mode: 'hundred' },
    ],
    play: playFreunde,
  },
  {
    id: 'zerlege',
    title: 'Zerlege-Zauber',
    short: 'Zahlen in Teile zaubern – Teil und Ganzes verstehen.',
    icon: () => h('div', { class: 'icon-stack' }, stick(8, 'one')),
    levels: [
      { label: 'bis 10', rounds: 4, mode: 'chain', min: 6, max: 10 },
      { label: 'bis 20', rounds: 4, mode: 'chain', min: 11, max: 18 },
      { label: 'Zahlenhaus', rounds: 4, mode: 'house' },
    ],
    play: playZerlege,
  },
  {
    id: 'lege',
    title: 'Lege die Zahl',
    short: 'Baue zweistellige Zahlen mit Zehnern und Einern.',
    icon: () => h('div', { class: 'icon-stack' }, quantity(32)),
    levels: [
      { label: 'Zehner + Einer', rounds: 4, range: [21, 49] },
      { label: 'bis 79', rounds: 4, range: [31, 79] },
      { label: 'Zahlwörter', rounds: 4, range: [21, 99], word: true },
    ],
    play: playLege,
  },
  {
    id: 'buendeln',
    title: 'Bündeln',
    short: 'Tausche 10 Einer gegen einen Zehner – und zurück.',
    icon: () => h('div', { class: 'icon-stack' }, frame(10), h('span', { class: 'icon-arrow' }, '→'), rod('ten')),
    levels: [
      { label: 'Einer → Zehner', rounds: 4, mode: 'to-tens' },
      { label: 'Zehner → Einer', rounds: 4, mode: 'to-units' },
      { label: 'Gemischt', rounds: 5, mode: 'mix' },
    ],
    play: playBuendeln,
  },
  {
    id: 'plus',
    title: 'Plus mit Struktur',
    short: 'Addiere mit Stangen – über den Zehner hinaus.',
    icon: () => h('div', { class: 'icon-stack' }, frame(8, { extra: 2 })),
    levels: [
      { label: 'bis 20', rounds: 4, kind: 'small' },
      { label: 'Zehnerübergang', rounds: 4, kind: 'bridge' },
      { label: 'große Zahlen', rounds: 4, kind: 'big' },
    ],
    play: playPlus,
  },
];

export const gameById = (id) => GAMES.find((g) => g.id === id);
