import { h } from '../util.js?v=6';
import { resetProgress, doneCount, levelState, groupCount } from '../store.js?v=6';
import { PHASES, GROUPS, GROUP_GOAL, nextStep, currentPhase, phaseProgress } from '../path.js?v=6';
import { gameById } from '../games/index.js?v=6';

const MARK = ['○', '◔', '●', '●'];
const MARK_NAME = ['neu', 'angefangen', 'gelöst', 'sicher'];

// Ruhige Fortschrittsübersicht: Phase, Schritte (neu · angefangen · gelöst · sicher), Strategiegruppen.
function progressView() {
  const nx = nextStep();
  const cur = currentPhase();
  const nxGame = nx && gameById(nx.game);
  const wrap = h('div', { class: 'parent-progress' });
  wrap.append(h('p', { class: 'pp-now' },
    h('b', {}, `Phase ${cur.id} – ${cur.title}`), ` (${cur.sub}). ${cur.tip}`,
    nxGame ? h('span', { class: 'pp-tip' }, ` Tipp für heute: „${nxGame.title}“, Stufe ${nx.level} (${nxGame.levels[nx.level - 1].label}).`) : ' Alles gelöst – jetzt frei wählen und wiederholen.',
  ));
  const grid = h('div', { class: 'pp-phases' });
  for (const p of PHASES) {
    const pr = phaseProgress(p);
    const ul = h('ul', { class: 'pp-steps' });
    for (const [g, l] of p.steps) {
      const game = gameById(g);
      if (!game) continue;
      const st = levelState(g, l);
      ul.append(h('li', { class: `pp-step s${st}` + (nx && nx.game === g && nx.level === l ? ' is-next' : '') },
        h('span', { class: 'pp-mark', 'aria-label': MARK_NAME[st] }, MARK[st] + (st === 3 ? '●' : '')),
        h('span', {}, `${game.title} · ${game.levels[l - 1].label}`)));
    }
    grid.append(h('div', { class: 'pp-phase' + (p.id === cur.id ? ' is-current' : '') },
      h('div', { class: 'pp-head' }, h('b', {}, `${p.id} · ${p.title}`), h('span', { class: 'muted' }, `${pr.solved}/${pr.total}`)),
      ul));
  }
  wrap.append(grid);
  const groups = h('ul', { class: 'pp-groups' });
  for (const g of GROUPS) {
    const n = groupCount(g.id);
    groups.append(h('li', { class: n >= GROUP_GOAL ? 'is-ok' : n ? 'is-some' : '' },
      h('span', { class: 'pp-check', 'aria-hidden': 'true' }, n >= GROUP_GOAL ? '✓' : n ? '·' : ''),
      h('span', {}, h('b', {}, g.name), h('span', { class: 'muted' }, ` ${g.short} · ${n} Runden`))));
  }
  wrap.append(h('h3', {}, 'Strategien'), groups);
  wrap.append(h('p', { class: 'muted small' }, '○ neu · ◔ angefangen · ● gelöst · ●● sicher (zweimal geschafft). Der Pfad empfiehlt nur eine Reihenfolge – alle Spiele und die Werkstatt bleiben offen.'));
  return wrap;
}

export function renderEltern(app) {
  const status = h('span', { class: 'muted' }, `${doneCount()} Stufen geschafft.`);
  const resetBtn = h('button', { class: 'btn', type: 'button' }, 'Fortschritt zurücksetzen');
  resetBtn.addEventListener('click', () => {
    if (confirm('Fortschritt wirklich löschen?')) { resetProgress(); status.textContent = 'Zurückgesetzt.'; }
  });
  app.append(h('section', { class: 'prose' },
    h('h1', {}, 'Für Eltern'),
    h('p', { class: 'lead' }, 'Die Werkstatt hilft Kindern, sich vom Abzählen zu lösen: Mengen werden immer in Fünfer- und Zehner-Strukturen gezeigt, und man legt ganze Stangen statt einzelner Plättchen.'),
    h('h2', {}, 'Lernpfad'),
    progressView(),
    h('h2', {}, 'Die Ideen dahinter'),
    h('ul', {},
      h('li', {}, h('b', {}, 'Kraft der Fünf: '), 'Eine volle Reihe hat 5. „7“ ist „eine volle Fünf und 2“ – das sieht man, ohne zu zählen.'),
      h('li', {}, h('b', {}, 'Bündeln: '), '10 Einer werden zu einer Zehnerstange („Zehner machen“), eine Stange zerfällt mit dem Hammer wieder in 10 Einer (wie das goldene Perlenmaterial bei Montessori).'),
      h('li', {}, h('b', {}, 'Stellenwert: '), 'Die Zehnerseite ist ein Hunderterfeld aus Stangen. Zahlenkarten (60 + 3 → 63) zeigen, wo die Null „verschwindet“.'),
      h('li', {}, h('b', {}, 'Selbstkontrolle: '), 'Falsche Antworten werden nicht bestraft. Das Material zeigt, ob es passt – und Grok gibt auf Antippen einen Tipp.'),
      h('li', {}, h('b', {}, 'Verliebte Zahlen: '), 'Zahlenpaare, die zusammen 10 ergeben (7 und 3, 6 und 4 …). Sie sind der Schlüssel zum Zehnerübergang.'),
      h('li', {}, h('b', {}, 'Kurz schauen: '), 'Bei „Schnelles Sehen“ verschwindet die Menge nach etwa einer Sekunde – Zählen lohnt sich nicht, Strukturen schon. Danach legt Ihr Kind die Menge mit Fünfern nach und zeigt, wie es sie gesehen hat.'),
      h('li', {}, h('b', {}, 'Schlangen-Zehner: '), 'Nach dem Montessori-Schlangenspiel: bunte Stangen werden in eine goldene Zehner-Schablone gelegt – nach Länge, nicht durch Abzählen. Am Ende kontrolliert sich die Schlange selbst.'),
      h('li', {}, h('b', {}, 'Bank-Wechsel: '), 'Unaufgeräumte Mengen werden getauscht, bis die Matte aufgeräumt ist. Eine Stange, die man zu den Einern zieht, zerfällt in 10 Einer; ein volles Feld wird bei den Zehnern zur Stange.'),
      h('li', {}, h('b', {}, '„Zwanzig und drei“: '), 'Zuerst erscheinen die Karten 20 + 3, dann das Wort „dreiundzwanzig“ – gegen Zahlendreher der deutschen Sprechweise.'),
      h('li', {}, h('b', {}, 'Ableiten statt auswendig: '), 'Doppel und Nachbar (6 + 6 → 6 + 7), Kraft der Fünf (6 + 7 = 5 + 5 + 1 + 2), Analogie (3 + 4 → 33 + 4) und der Rechenstrich mit großen Sprüngen.'),
    ),
    h('h2', {}, 'Farben'),
    h('p', {}, 'Einer sind honiggelb, Zehner petrol, der Hunderter terrakotta. Rosa Perlen gehören zu den „verliebten Zahlen“: Sie ergänzen eine Zahl zur 10, zum nächsten Zehner oder zur 100. Bewusst eigene, ruhige Farben statt des strengen Montessori-Codes.'),
    h('h2', {}, 'Einstellungen'),
    h('p', {}, 'Unten rechts lassen sich Farbwelt (Nacht, Tiefsee, Sand, Nebel; Sonne/Mond wechselt schnell zwischen hell und dunkel), Schrift (Figtree, Outfit, DM Sans – alle mit einstöckigem a) und Größe (Kompakt, Groß, Riesig) einstellen. Standard ist Nacht, Figtree, Groß. Die Wahl bleibt auf diesem Gerät gespeichert.'),
    h('h2', {}, 'Ohne viel Text'),
    h('p', {}, 'Die Oberfläche erklärt sich über Bilder: Sind 10 Einer da, erscheint über dem Einerfeld der Knopf „Zehner machen“; an jeder Zehnerstange bricht ein Hammer sie in 10 Einer auf. Beim ersten Mal zeigt eine blasse Hand, was zu tun ist.'),
    h('h2', {}, 'Zuhause'),
    h('p', {}, 'Fragen Sie öfter: „Wie siehst du die 8?“ – und legen Sie Dinge in Fünfer-Gruppen. Die Website ergänzt echtes Material, sie ersetzt es nicht.'),
    h('h2', {}, 'Daten'),
    h('p', {}, 'Kein Login, kein Tracking. Der Fortschritt bleibt nur auf diesem Gerät gespeichert. ', status),
    resetBtn,
  ));
  return () => {};
}
