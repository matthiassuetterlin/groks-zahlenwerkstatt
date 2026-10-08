import { h } from '../util.js';
import { resetProgress, doneCount } from '../store.js';

export function renderEltern(app) {
  const status = h('span', { class: 'muted' }, `${doneCount()} Stufen geschafft.`);
  const resetBtn = h('button', { class: 'btn', type: 'button' }, 'Fortschritt zurücksetzen');
  resetBtn.addEventListener('click', () => {
    if (confirm('Fortschritt wirklich löschen?')) { resetProgress(); status.textContent = 'Zurückgesetzt.'; }
  });
  app.append(h('section', { class: 'prose' },
    h('h1', {}, 'Für Eltern'),
    h('p', { class: 'lead' }, 'Die Werkstatt hilft Kindern, sich vom Abzählen zu lösen: Mengen werden immer in Fünfer- und Zehner-Strukturen gezeigt, und man legt ganze Stangen statt einzelner Plättchen.'),
    h('h2', {}, 'Die Ideen dahinter'),
    h('ul', {},
      h('li', {}, h('b', {}, 'Kraft der Fünf: '), 'Eine volle Reihe hat 5. „7“ ist „eine volle Fünf und 2“ – das sieht man, ohne zu zählen.'),
      h('li', {}, h('b', {}, 'Bündeln: '), '10 Einer werden zu einer Zehnerstange, eine Stange zerfällt wieder in 10 Einer (wie das goldene Perlenmaterial bei Montessori).'),
      h('li', {}, h('b', {}, 'Stellenwert: '), 'Die Zehnerseite ist ein Hunderterfeld aus Stangen. Zahlenkarten (60 + 3 → 63) zeigen, wo die Null „verschwindet“.'),
      h('li', {}, h('b', {}, 'Selbstkontrolle: '), 'Falsche Antworten werden nicht bestraft. Das Material zeigt, ob es passt – und Grok gibt auf Antippen einen Tipp.'),
      h('li', {}, h('b', {}, 'Kurz schauen: '), 'Bei „Schnelles Sehen“ verschwindet die Menge nach kurzer Zeit – Zählen lohnt sich nicht, Strukturen schon.'),
    ),
    h('h2', {}, 'Farben'),
    h('p', {}, 'Einer sind honiggelb, Zehner petrol, der Hunderter terrakotta. Lila Perlen sind „Freunde“, die etwas ergänzen. Bewusst eigene, ruhige Farben statt des strengen Montessori-Codes.'),
    h('h2', {}, 'Zuhause'),
    h('p', {}, 'Fragen Sie öfter: „Wie siehst du die 8?“ – und legen Sie Dinge in Fünfer-Gruppen. Die Website ergänzt echtes Material, sie ersetzt es nicht.'),
    h('h2', {}, 'Daten'),
    h('p', {}, 'Kein Login, kein Tracking. Der Fortschritt bleibt nur auf diesem Gerät gespeichert. ', status),
    resetBtn,
  ));
  return () => {};
}
