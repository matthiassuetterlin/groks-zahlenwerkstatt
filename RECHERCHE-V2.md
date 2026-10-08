# Recherche V2: Didaktische Vertiefung für Grok's Zahlenwerkstatt

**Stand:** 8. Oktober 2026 · Ergänzung zu `docs/KONZEPT.md`  
**Zielgruppe der App:** Tochter (~2. Klasse), die noch oft einzeln zählt; Partnerin unterrichtet an einer Montessori-Schule  
**Zahlenraum:** bis 100 · keine Sprachausgabe · keine strengen Montessori-Farben · so wenig Text wie möglich · Grok mit Tipps  
**Status dieses Dokuments:** Forschungs- und Redesign-Vorschlag. **Kein Code, kein Commit** – parallel arbeitet jemand anderes am Repo.

Kurzfassung der empfohlenen Änderungen: `RECHERCHE-V2-KURZ.md`.

---

## 0. Was die aktuelle App schon kann (Ist-Stand)

Aus Code und Konzept (`docs/KONZEPT.md`, `js/builder.js`, `js/games/*`):

| Baustein | Ist | Didaktische Lücke |
|----------|-----|-------------------|
| **Werkstatt** | Zehner / Fünfer / Einer legen; „Zehner machen“; Hammer zum Aufbrechen; optional Hunderter; Zahlenkarten-Stack; Lege-Ziel | Keine farbigen Perlenstangen 1–9; keine „Bank“ mit klarer Tausch-Geste; keine unkonventionellen Zerlegungen (z. B. 14 Einer = 1Z+4E); keine Stellentafel; Fünfer landen als Einer – gut, aber die Zerlegung *vor* dem Griff ist noch zu schwach thematisiert |
| **Schnelles Sehen** | Blitz + Multiple Choice | Keine Frage „Wie hast du gesehen?“; Zeiten relativ lang (1,8–2,4 s); keine Fingerbilder / 5+Struktur-Varianten |
| **Verliebte Zahlen** | Partner zu 10 / nächster Zehner / 100; visuelle Passung | Noch kein echtes Schlangenspiel (Suche nach Zehn in einer bunten Schlange); keine schwarzen Reststangen; keine Kontrolle durch „Partnerstangen sortieren“ |
| **Zerlege-Zauber** | Kette teilen; Zahlenhaus | Keine systematische „Immer-x“-Suche aller Zerlegungen; keine Automatisierungsgruppen à la Gaidoschik; Haus mischt Stellenwert mit Teil-Ganzes |
| **Lege die Zahl** | Builder + Griffzähler | Ideal-Griff-Zähler ist gut (Ladel/Kortenkamp), aber noch keine Teen-/Ten-Board-Logik; keine unkonventionellen Darstellungen |
| **Bündeln** | Nur Bundle/Split am Builder | Keine „Bank“-Metapher; kein „Bring mir …“; kein Wechsel mit Überzähligen |
| **Plus mit Struktur** | Dazuliegen + Ergebnis wählen | Nur ein Zehnerübergangs-Modus; keine Verdoppeln/Nachbar/Analogie; kein Rechenstrich; am Ende wird zum Zählen der Stangen eingeladen („Zähl die Stangen…“) – kontraproduktiv |

Fortschritt: `store.js` merkt nur „Stufe geschafft“ (Zählimpuls). Kein Lernpfad, kein Unlock, keine Strategiegruppen.

---

## 1. Montessori: Warum das Mathe so gut greift – und was davon digital trägt

### 1.1 Sensorische Wurzeln und Sequenz

Montessori führt Mathematik **vom Konkreten zum Abstrakten** und isoliert jeweils **eine** Schwierigkeit (*isolation of difficulty*). Die sensorische Vorbereitung (Rote Stäbe / Long Rods) trainiert Längenunterschiede und die Treppe; die **Zahlenstäbe (Number Rods)** machen dieselbe Länge *zählbar* durch abwechselnde Segmente und verbinden Kardinalität mit der Einheit. Danach kommen lose Mengen: **Spindelkästen** (auch Null als leeres Fach), **Karten und Plättchen** (1:1-Zuordnung, gerade/ungerade), parallel dazu **Sandpapierziffern** und die **Drei-Perioden-Lektion** (1. „Das ist …“, 2. „Zeig mir …“, 3. „Was ist das?“).

Quellen: [Montessori Commons – Numbers 1 to 10](https://montessoricommons.cc/group-1-numbers-1-to-10/), [AMI Glossary](https://montessori-ami.org/resource-library/facts/glossary-montessori-terms), [Three-Period Lesson](https://www.montessoriservices.com/ideas-insights/the-three-period-lesson), [Control of Error (AMI Voices PDF)](https://montessori-ami.org/sites/default/files/downloads/voices/ControlofError.pdf).

**Design-Implikation:** In der App sollte jede neue Aktivität nur *eine* neue Hürde einführen (z. B. erst Partner zu 10, dann Zehnerübergang, dann Stellenwert-Wechsel). Fehlerkontrolle liegt im Material (Passung, Mulden, Partner leuchten), nicht in rotem „Falsch!“.

### 1.2 Dezimalsystem: Goldene Perlen, Bank, Change Game, Zahlenkarten

Zentrale Sequenz (vereinfacht):

1. **Presentation Tray / Hierarchien** – Einerperle, Zehnerstange, Hunderterquadrat, Tausenderwürfel (Maßstab + Gewicht).
2. **„Bring mir …“ / Fetching** – erst eine Kategorie, dann mehrere; Kind holt Menge von der Bank.
3. **Assoziation Menge ↔ Symbol** – große Zahlenkarten; später **Überlagern** der Karten (1000+400+20+3 → 1423, Nullen „verschwinden“).
4. **Bank / Exchange / Change Game** – sobald 10 einer Art da sind: zur Bank und gegen 1 der nächsthöheren tauschen; umgekehrt Entbündeln.
5. **Operationen** mit goldenen Perlen (statisch ohne Wechsel, dynamisch mit Wechsel).

Quellen: [Montessori Album – Association of Beads and Cards](https://www.montessorialbum.com/montessori/index.php/Association_of_Beads_and_Cards), [Change Game](https://reachformontessori.com/change-game/), [Bank Game](https://carrotsareorange.com/montessori-golden-beads-bank-game-lesson/), [Wonderful Montessori – Changing Game](https://www.wonderfulmontessori.com/the-changing-game), [Mathessori Decimals](https://www.mathessori.com/mathessori-lower-elementary/decimals/).

**Was gegen zählendes Rechnen hilft:** Das Kind greift **ganze Hierarchien** (eine Stange = zehn), statt zehnmal einzeln zu tippen. Der **Wechsel** macht „10 von dieser Art = 1 der nächsten“ zur Handlung, nicht zur Merkregel.

**Was *nicht* automatisch hilft:** Empirisch ist Montessori-Material kein Garant gegen zählendes Rechnen. Lautners explorative Studie findet **keine eindeutige Überlegenheit** des Montessori-Materials für Zahlbegriff/Rechenleistung bei lernschwachen Erstklässlern; die Autorin betont, dass Material *und* didaktische Begleitung zählen müssen ([Lautner 2013, LMU](https://edoc.ub.uni-muenchen.de/15372/1/Lautner_Anja.pdf)). Lillard et al. (2017) zeigen in einer Lotterie-Studie Vorteile echter Montessori-Vorschulen für akademische Outcomes – das ist aber das *Gesamtsystem*, nicht eine isolierte Perlen-App ([Frontiers](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2017.01783/full)).

### 1.3 Linear Counting: Seguin-Boards, Hundred Board, Bead Chains

- **Teen Board (Seguin A):** Menge „zehn und eins = elf“, dann Symbol: Kachel über die Null der „10“ schieben.
- **Ten Board (Seguin B):** Zehnerleisten + Einer → 10–99.
- **Hundred Chain:** lineare 100, Pfeile an den Zehnern, Vergleich mit Hunderterquadrat.
- **Hundred Board:** Kacheln 1–100 legen (Muster, Reihen, Spalten).
- **Short / Long Chains:** Skip Counting, Quadrate/Würfel vorbereiten.

Quellen: [Carrots Are Orange – Teen Board](https://carrotsareorange.com/teen-board/), [Just Montessori – Linear Counting](https://justmontessori.com/math-linear-counting/), [Alison's Montessori – Hundred Chain & Board](https://alisonsmontessori.blog/hundred-chain-hundred-board/), [Montessori Album – Short Chains](https://www.montessorialbum.com/montessori/index.php/Short_Chains).

**Für Klasse 2 / ZR 100 besonders relevant:** Teen-/Ten-Logik („zehn und drei“ vor dem deutschen Zahlwort „dreizehn“ / „dreiundzwanzig“) und die Hundertertafel *nach* gesichertem Bündeln – Gaidoschik warnt davor, Hunderterfeld/-tafel und Zahlenstrahl zu früh und zu dicht hintereinander einzuführen ([Kolloquium TU Dortmund 2014](https://wwwold.mathematik.tu-dortmund.de/de/index/veranstaltungen/didakkol/year=2014.html); Aufsatz *Einige Fragen zur Didaktik des Hunderterraums*, JMD 2015).

### 1.4 Short Bead Stair und Snake Game – starke Anti-Zähl-Werkzeuge

Die **farbige Perlentreppe (1–9)** kodiert Mengen als *ganze Stangen*. Das **Addition Snake Game** („Search for Ten“):

1. Bunte Schlange legen.
2. Von links zählen, bis 10; Markierer setzen.
3. Gegen **goldene Zehnerstange** tauschen; Rest mit **schwarz-weißer Stange** parken.
4. Weiterzählen ab dem schwarzen Rest.
5. **Control of error:** Goldene Zehner vertikal; farbige Stangen absteigend daneben; Partner zu 10 zuordnen – wenn alles aufgeht, war die Schlange richtig.

Quellen: [Montessori Album – Addition Snake Game](https://www.montessorialbum.com/montessori/index.php/Addition_Snake_Game), [Wonderful Montessori – Bonds of Ten](https://www.wonderfulmontessori.com/snake-game-bonds-of-ten), [Carrots Are Orange – Snake Game](https://carrotsareorange.com/snake-game/), [Natural Ed – Snake Game](https://naturaled.org/mathematics/the-snake-game-addition/), [Negative Snake / Subtraction](https://montessorimom.com/negative-snake-game-subtraction/).

**Präzise Anti-Zähl-Wirkung:** Man zählt zwar entlang der Schlange, aber das *Ziel* ist das **Finden von Zehnern** und der automatische Tausch – die Einheit der Handlung wird „Zehner suchen“, nicht „Ergebnis durch Weiterzählen“. Die Partnerkontrolle (9+1, 8+2 …) verankert Bonds of Ten ohne Multiple-Choice.

### 1.5 Stamp Game, Bead Frame, Strip Boards, Memorisation

- **Stamp Game:** gleiche „Briefmarken“ 1/10/100/1000 in Stellenwertfarben; dynamische Addition/Subtraktion mit Wechsel – Abstraktionsschritt nach den goldenen Perlen ([Rising Tide](https://www.risingtidemontessori.org/the-decimal-system/stamp-game), [Wonderful Montessori – dynamic addition](https://www.wonderfulmontessori.com/the-stamp-game-dynamic-addition-with-change)).
- **Small Bead Frame:** noch abstrakter, Übergang zur schriftlichen Form.
- **Addition/Subtraction Strip Boards + Control/Finger Charts:** Fakten memorieren *nach* Verständnis; Kind prüft selbst an Kontrolltafeln ([Guidepost – Strip Board](https://www.guidepostmontessori.com/addition-strip-board), [Finger Chart 1](https://www.montessorialbum.com/montessori/index.php/Addition_Finger_Chart_1)).

**Für die App:** Stamp-Game-Logik (gleiche Token, Wert nur durch Spalte) und Snake-Logik haben Priorität vor Strip Boards. Memorisations-Charts erst, wenn Teil-Ganzes und Partner zu 10 sitzen.

### 1.6 Welche Montessori-Materialien greifen zählendes Rechnen besonders an?

| Material | Anti-Zähl-Mechanismus |
|----------|----------------------|
| Short Bead Stair / ganze Stangen | Menge als *ein* Objekt greifen |
| Snake Game | Zehner *suchen* und tauschen; Partnerkontrolle |
| Golden Beads + Exchange | Bündeln als physischer Bank-Tausch |
| Teen/Ten Boards | „Zehn und n“ statt Zählreihe 11,12,… |
| Stamp Game (dynamisch) | Wechsel erzwingen, wenn 10 in einer Spalte |
| Number Rods (frühe Phase) | Länge = Anzahl (sensorisch) – digital schwer zu ersetzen |

**Nicht ideal gegen Zählen (wenn falsch genutzt):** lose Einerperlen ohne Zwang zum Fünfer-/Zehnergriff; Hundertertafel als Abzählhilfe; Zahlenstrahl mit Einermarkierungen zum Hoppeln.

---

## 2. Deutsche Grundschuldidaktik (Ergänzung und Korrektiv)

### 2.1 Ablösung vom zählenden Rechnen (Gaidoschik, MaCo, PIKAS)

Gaidoschiks Längsschnitt (139 Kinder, 1. Schuljahr) zeigt: Hohes Faktenwissen hängt eng mit **Ableiten** zusammen; rein merkendes Auswendiglernen ist selten; viele Kinder rechnen am Jahresende noch vorwiegend zählend – oft weil Unterricht Ableitungen vernachlässigt und den Zehnerübergang nur über „ergänze zur 10“ führt ([PIKAS-Beitrag](https://pikas.dzlm.de/pikasfiles/uploads/upload/Material/Haus_3_-_Umgang_mit_Rechenschwierigkeiten/IM/Informationstexte/Beitrag_Gaidoschik.pdf); Buch *Wie Kinder rechnen lernen*). Quasi-simultane Anzahlerfassung zu Schulbeginn prädiziert späteres nicht-zählendes Rechnen.

**MaCo-Förderbausteine** ([PDF Ablösung](https://maco.dzlm.de/sites/maco/files/material-lul/dzlm_maco_prim_ablzaehlendrechnen_221109.pdf)):

1. **Kardinale Zahlbeziehungen** – Zahlen als Zusammensetzungen; Zerlegungen systematisch („Immer 6“); Automatisierung in Gruppen (mit 1, mit 2, Hälften, Kraft der Fünf).
2. **Anzahlen strukturiert sehen** – Fingerbilder *statisch*; Punktefelder; Blitzblick; „Wie hast du gesehen?“
3. **Zahl- und Aufgabenbeziehungen nutzen** – Kernaufgaben (mit 0/1, doppelt, mit 5, gleich 10); Ableiten (Nachbar, Tausch, Partner, Hilfsaufgabe).

**Wichtig:** Automatisieren von *Strategien und Zerlegungen*, nicht von isolierten Einzelfakten ([Gaidoschik Workshop PDF](https://wwwold.mathematik.tu-dortmund.de/ieem/mathe2000/pdf/Symp20/Workshop%20Gaidoschik%20Homepage.pdf)).

### 2.2 Kraft der Fünf, Zwanzigerfeld, Rechenschiff

Krauthausen: Mengen als 5+… sehen (Fingerbild, Hand). Das Zwanzigerfeld (Wittmann/Mathe 2000) und Rechenschiffe strukturieren 5er/10er. Ladel & Kortenkamp zeigen den digitalen Vorteil: Am realen Feld legt man Plättchen oft *einzeln* (fördert Zählen); digital kann man **Fünferpäckchen mit einem Griff** setzen, die danach einzeln bleiben – die Wahl „1 oder 5?“ erzwingt die Zerlegung *vor* der Handlung ([PDF](https://cermat.org/sites/default/files/LadelKortenkamp-VAGKF-2009a.pdf)). Sie raten bewusst **keine zusätzlichen Zehnerpäckchen** beim frühen Legen, damit 10 flexibel als zwei Fünfer neben- oder untereinander gedacht werden kann.

**Für die App:** Fünfer-Griff behalten; Zehnerstangen *zusätzlich* für Stellenwert (Montessori-Bank) – aber in „Lege schnell“-Modi die Fünfer priorisieren und den kürzesten Weg belohnen (wie jetzt bei Lege die Zahl).

### 2.3 Teil-Ganzes, Kernaufgaben, Ableitungen

Eine Zerlegung 8 = 5+3 speist viele Rechnungen (5+3, 3+5, 8−5, 8−3, …). Strategiegruppen und Nachbaraufgaben („aus 4+4 wird 5+4“) sind zentral (MaCo Baustein 3; Häsel-Weide et al.). Zehnerübergang **nicht nur** schrittweise über 10, sondern auch Verdoppeln±1, Kraft der Fünf (6+7 = 5+5+1+2).

### 2.4 Zahlenstrahl vs. Rechenstrich

- **Zahlenstrahl (skaliert):** Orientierung, Nachbarn, ordinale Position – aber **zum Rechnen gefährlich**, weil er zum Hoppeln in Einerschritten einlädt.
- **Rechenstrich (leerer Zahlenstrahl):** flexible Positionen; Sprünge (+10, +4); Strategie sichtbar machen.

Quelle: [Primakom – Zahlenstrahl / Rechenstrich](https://primakom.dzlm.de/inhalte/zahlen-und-operationen/zahlraumerweiterung/hintergrund) (Knackpunkt: „Beim Rechnen sollte [der Zahlenstrahl] nicht verwendet werden … nur der leere Zahlenstrahl – also der Rechenstrich.“); Mahiko schrittweise Addition ([PDF](https://mahiko.dzlm.de/sites/mahiko/files/uploads/2_schuljahr/HalbschriftlicheAddition/pdf/zr100_halbschriftlicheaddition_u1_schrittweise_220824.pdf)).

### 2.5 Mahiko (Dortmund / DZLM)

Mahiko liefert Eltern-/Förder-Videos und Materialien: Hunderterfeld mit Abdeckwinkel (5er/10er/25er/50er-Strukturen), schrittweises Rechnen, Hilfsaufgabe, stellenweises Rechnen ([mahiko.dzlm.de](https://mahiko.dzlm.de/), [Zahlen am Hunderterfeld PDF](https://mahiko.dzlm.de/sites/mahiko/files/uploads/2_schuljahr/Zahlendarstellen/Pdf/zahlen_darstellen_zr100_zahlen_am_100erfeld_darstellen.pdf)). Expliziter Tipp: Am 100er-Feld **nicht** mühsam ausmalen (verführt zum Zählen), sondern Abdeckwinkel / Durchstreichen.

### 2.6 Stellenwert: Bündelungs- und Positionsprinzip

MaCo Stellenwert ([PDF](https://maco.dzlm.de/sites/maco/files/material-lul/dzlm_maco_prim_stellenwert_220712.pdf)):

- **Bündelungsprinzip:** 10 gleiche Einheiten → nächstgrößere.
- **Positionsprinzip:** dieselbe Ziffer, anderer Wert je nach Stelle.
- Typische Hürden: Zahlendreher (deutsche Inversion „dreiundzwanzig“), Bedeutung der Null, unkonventionelle Zerlegungen (14 Einer ↔ 1Z+4E).
- Arbeitsmittel kritisch prüfen: Dienes/Punktfelder gut für Bündeln/Entbündeln; Hundertertafel *nicht* offensichtlich für Bündeln; Stellentafel braucht Verbindung zu konkretem Material.
- **Nicht** „so schreiben wie man hört“ als Dauerhilfe (Übergeneralisierung).

### 2.7 Lehrplan Baden-Württemberg / Bildungsstandards

**BW Bildungsplan 2016, Mathematik 1/2** ([Zahldarstellungen](https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_M_IK_1-2_01_01), [Rechenoperationen](https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_M_IK_1-2_01_02)):

- Anzahlen simultan/quasi-simultan (Blitzblick, Fingerzahlen); Zahlzerlegungen; Zahlen bis 100 sprechen/lesen/schreiben.
- Dezimales Stellenwertsystem nutzen (Einer, Zehner, Hunderter, Bündeln, Entbündeln).
- Strategische Werkzeuge: zerlegen/zusammensetzen, Analogien, Hilfsaufgaben, Aufgaben verändern, tauschen.
- Sicheres Rechnen bis 20 als Voraussetzung für ZR 100; Grundaufgaben abrufen; Analogien auf ZR 100 übertragen.
- Automatisierung steht **am Ende** des Verstehensprozesses.

**KMK Bildungsstandards Primar Mathematik (2022):** Stellenwert, Bündelung, Darstellungsvernetzung bis weit über 100 hinaus ([KMK PDF](https://www.kmk.org/fileadmin/Dateien/veroeffentlichungen_beschluesse/2022/2022_06_23-Bista-Primarbereich-Mathe.pdf)).

### 2.8 Vier-Phasen-Modell (Wartha & Schulz)

Ablösung vom Material: (1) selbst handeln + versprachlichen, (2) Handlung diktieren *mit* Sicht, (3) diktieren *ohne* Sicht / hinter Schirm, (4) symbolisch / mental. ([SINUS-Handreichung](http://www.sinus-an-grundschulen.de/fileadmin/uploads/Material_aus_SGS/Handreichung_WarthaSchulz.pdf), [PIKAS Vierphasenmodell](https://pikas.dzlm.de/selbststudium/rechenschwierigkeiten/weitere-themen/vierphasenmodell)).

**Digital:** Phase 3 ≈ Blitz / verdeckte Teile / „Stell dir vor“; Phase 4 ≈ reine Zahlwahl nach vorheriger Handlung.

---

## 3. Digitale Manipulative: Forschung und Vorbilder

### 3.1 Moyer-Packenham & Westenskow

Metaanalyse: moderate Effekte virtueller Manipulative; fünf Affordances – u. a. **focused constraint**, **simultaneous linking**, **efficient precision**, Motivation ([ERIC EJ1154970](https://eric.ed.gov/?id=EJ1154970)).

→ App soll *einschränken* (nur 1 oder 5 greifen; Wechsel nur bei 10), Darstellungen koppeln (Perlen ↔ Ziffer ↔ Karte), präzise und schnell reagieren.

### 3.2 Ladel & Kortenkamp / ACAT

- **Kraft der Fünf digital:** Fünfergriff + einzeln weiterbearbeitbar; Entscheidung vor dem Zug ([PDF](https://cermat.org/sites/default/files/LadelKortenkamp-VAGKF-2009a.pdf)).
- **Artifact-Centric Activity Theory:** Artefakt vermittelt zwischen Kind und mathematischem Objekt; Regeln des Artefakts = mathematische Regeln.
- **Interaktive Stellenwerttafel:** Verschieben von Token ist **werterhaltend** – nach unten automatisch entbündeln, nach oben nur bündeln wenn genug Token da sind ([PME-Paper PDF](https://files.eric.ed.gov/fulltext/ED599901.pdf); App-Idee „Stellenwerttafel“).

### 3.3 Multi-Touch, Fingu, TouchCounts

- Ladel/Kortenkamp zu Multi-Touch: Teil-Ganzes speichern (8 bleibt als 5+3 sichtbar); Gruppen zu 5 anbieten ([CADGME PDF](https://cadgme2014.cermat.org/sites/default/files/LadelKortenkamp-AAMTEML-2011a.pdf)).
- **Fingu:** Muster kurz zeigen, Antwort mit *gleichzeitigen* Fingern – trainiert conceptual subitizing + Finger gnosis ([Fingu Paper](https://researchportal.hkr.se/ws/portalfiles/portal/40988658/FULLTEXT01.pdf)).
- **TouchCounts:** offenes Erkunden mit Finger-Taps ([touchcounts.ca](http://www.touchcounts.ca/)).

### 3.4 App-Landschaft und Lücke

Marx et al. (2025): Von 18 geprüften Apps bietet **keine** einen systematischen Weg von handelndem Zerlegen bis abstrakten Zahlentripeln bis 10; meist nur Automatisieren ([IEJME](https://files.eric.ed.gov/fulltext/EJ1462275.pdf)). Das ist die Chance für Grok's Zahlenwerkstatt.

**Gute Vorbilder (Orientierung, keine Kopie):**

| App / Material | Lernen von … |
|----------------|--------------|
| [MLC Number Frames / Number Rack / Number Pieces](https://www.mathlearningcenter.org/apps) | 5-/10-Rahmen, Rechenrahmen 5+5, Base-Ten-Blöcke, ruhiges UI |
| [Rechenfeld](https://rechenfeld.de/) | Strukturfelder digital |
| Kortenkamp Stellenwerttafel | werterhaltendes Verschieben |
| DragonBox Numbers (Nooms) | Mengen als Charaktere zerlegen/zusammensetzen (Spielgefühl) |
| Fingu | Blitz + Fingerantwort |

**Fallstricke:** Einzeltippen erzwingen; Timer-Druck ohne Struktur; Belohnungsexplosion; kein Control of error; Textwände.

---

## 4. Synthese: Designprinzipien für V2

1. **Eine Hürde pro Aktivität** (Montessori isolation).
2. **Control of error im Material** (Passung, Partner, Bank-Tausch), Grok nur als Tippgeber.
3. **Struktur vor Zählreihe:** 5er/10er-Mulden, Blitz, Fünfergriff.
4. **Zerlegung vor dem Zug** (1 oder 5? / Zehnerstange?).
5. **Werterhaltendes Bündeln/Entbündeln** (ACAT).
6. **Teil-Ganzes systematisch** bis alle Tripel, dann Automatisierungsgruppen.
7. **Mehrere Wege über den Zehner** (nicht nur „erst zur 10“).
8. **Rechenstrich statt Hoppel-Zahlenstrahl** für Strategien.
9. **Teen/Ten-Sprache parallel zum deutschen Zahlwort** (Karten 20+3 → 23).
10. **Vier Phasen:** handeln → mit Sicht → ohne Sicht/Blitz → Symbol.
11. **Wenig Text, große Gesten;** Grok-Sprache kurz und tippbar.
12. **Lernpfad mit Unlock,** aber Werkstatt immer frei (Montessori free choice).

---

### 4.1 Prüfliste für jede Aktivität (nach Radatz u. a., zitiert bei Lautner 2013)

Vor dem Bauen jeder Aktivität beantworten:
1. Kann man die Menge **quasi-simultan** erfassen (5er/10er sichtbar)?
2. **Ist zählendes Lösen möglich – und lohnt es sich?** Wenn ja: Zeit begrenzen, verdecken oder den Fünfer- bzw. Zehnergriff erzwingen.
3. Lässt sich die Handlung leicht in **Bild und Symbol** übersetzen (Perlen ↔ Karten ↔ Ziffer)?
4. Unterstützt sie die **Ablösung vom Material** (Phase 3/4: verdeckt, Blitz)?
5. Ist das Material **strukturgleich** von 20 auf 100 erweiterbar?
6. Erlaubt sie **eigene Wege** (mehrere richtige Zerlegungen)?

### 4.2 Bekannte Stolperfallen aus der Forschung

- **Übergeneralisierung des Fünfergriffs:** Kinder legten 6 als 5 + 5 − 1 − 1 − 1 − 1 (Ladel & Kortenkamp). Deshalb immer den **kürzesten Weg sichtbar machen** (Griffzähler + Idealzahl nach der Lösung zeigen), nicht nur „Fünfer benutzen“.
- **Anschauungsmittel sind nicht selbsterklärend** (Primakom, Söbbeke): Kinder deuten Pfeile und Felder anders als gedacht. Deshalb die Geisterhand und die erste Runde jeder Aktivität als „Zeigen“ (1. Periode) gestalten, bevor gefragt wird.
- **Kinder, die schon schnell zählen,** sehen im ZR 20 keinen Grund für Strukturen (Ladel & Kortenkamp). Deshalb gezielt Situationen schaffen, in denen Zählen *sichtbar langsamer* ist (Griffe, Blitz, große Mengen bis 100).

## 5. Redesign bestehender Aktivitäten (priorisiert)

Priorität: **P0** = sofort / größter Hebel gegen Zählen · **P1** = nächste Iteration · **P2** = später.

### 5.1 Werkstatt (P0)

**Didaktisches Ziel:** Freies Erkunden von Bündeln, Entbündeln, Kraft der Fünf, Stellenwert; optionale Aufträge ohne Druck.

**Quellen:** Golden Beads + Bank/Change; Ladel/Kortenkamp; Number Cards Overlay; Mahiko 100er-Struktur.

**Interaktion (wenig Text):**
- Matte: links Zehner-Mulden (5+5 sichtbar), rechts Einer-Felder (2×5).
- Auswahl: große Karten **Zehnerstange | Fünfer | Einer** (Fünfer = 5 einzelne Perlen, die als Gruppe fliegen).
- Bei ≥10 Einer: großer **Tausch-Knopf** (Icon Bank/Pfeil) leuchtet – Tippen oder Ziehen des vollen Feldes auf die Zehner-Zone = „Zehner machen“.
- Hammer an jeder Stange = Entbündeln (Animation: Stange → 10 Einer).
- Zahlenkarten: tippen stapelt (60 unter 3 → 63); optional „auseinander“.
- **Neu – Bank-Modus:** Schublade „Bank“; Kind zieht Überzählige zur Bank und bekommt Stangen zurück (Change Game light).
- **Neu – Auftragskarten (optional):** Icon „Hol 63“, „Mach so wenig Griffe wie möglich“, „Zeig 40 als 3 Zehner + 10 Einer“ (unkonventionell).

**Stufen / Freigabe:** immer offen; Aufträge nach Level-Pfad freischaltbar.

**Control of error:** Mulden voll = sichtbar; Tausch nur bei 10; unkonventionelle Darstellungen werden akzeptiert und können „aufgeräumt“ werden (Standardpartition).

**Anti-Zähl:** Fünfer-/Zehnergriff; Griffzähler bei Aufträgen; kein Einzeltipp-Zwang.

- **Neu – werterhaltendes Ziehen (ACAT, Kortenkamp/Ladel):** Eine Zehnerstange, die man in die Einer-Zone zieht, zerfällt dort automatisch in 10 Einer; ein volles Zehnerfeld, das man in die Zehner-Zone zieht, wird zur Stange. Die Knöpfe „Zehner machen“ und Hammer bleiben als deutlich sichtbare Alternative (Matthias' Wunsch nach eindeutigen Knöpfen). Ein Hinüberziehen ohne genug Einer federt zurück (Control of error).
- **Neu – Ablesen „zwanzig und drei“:** Unter der großen Zahl stehen zuerst die Karten 20 + 3, dann das Wort „dreiundzwanzig“. Gaidoschik fragt ausdrücklich „Warum immer sofort dreiundzwanzig und nicht auch und vor allem zwanzig und drei?“ Das wirkt dem Zahlendreher der deutschen Sprechweise entgegen.

**Änderung vs. Ist:** Bank-Metapher und unkonventionelle Zerlegungen ergänzen; Zahlenkarten prominenter; Hunderter behalten; Auto-Bündeln als Option lassen (Montessori: Kind entscheidet den Wechsel bewusst – Default besser manuell).

### 5.2 Schnelles Sehen (P0)

**Ziel:** Quasi-simultane Anzahlerfassung; mentale Bilder; Sprache der Struktur.

**Quellen:** MaCo/PIKAS Blitzblick; Wartha/Schulz Phase 3–4; Fingerbilder.

**Interaktion:**
1. Kurz strukturierte Menge (Feld / Stangen / Fingerbild-Silhouette).
2. Menge weg → Kind wählt Zahl **oder** legt mit 1/5-Griff nach (besser gegen Raten).
3. Danach **Struktur-Chips** (Icons, kaum Text): „volle 5“, „Zehnerstange“, „Doppel“, „Lücke bis 10“ – Kind tippt, *wie* es gesehen hat (Control: mehrere richtige möglich).
4. Grok: „Wie hast du das gesehen?“ statt nur „Genau!“.

**Stufen:**
1. bis 10, Feld, ~1,0–1,2 s  
2. bis 20, zwei Reihen, ~1,2–1,5 s  
3. bis 100 als Zehnerstangen + Einer, ~1,5–2,0 s  
4. (neu) verdeckt: nur Silhouette / Abdeckwinkel-Look

**Anti-Zähl:** echte Kurzzeit; strukturierte Layouts; Nachbau mit Fünfergriff.

**Optional iPad (P2, Fingu-Idee):** Antwort bis 10 durch gleichzeitiges Auflegen von Fingern (Multi-Touch); am Desktop fällt das weg.

**Änderung vs. Ist:** kürzere Zeiten; „Wie gesehen?“-Schritt; Fingerbild-Variante; Nachlegen statt nur MC. Falsche Antwort: Menge erscheint mit hervorgehobener Struktur (z. B. 5er-Rahmen leuchtet), statt einfach nur erneut aufzublitzen.

### 5.3 Verliebte Zahlen (P0 → Ausbau zur Schlange)

**Ziel:** Bonds of Ten automatisieren (Kern für Zehnerübergang).

**Quellen:** Snake Game; Gaidoschik Automatisierungsgruppe „gleich 10“; Verliebte Zahlen (Schulbegriff).

**Interaktion Stufe A (Ist, schärfen):** Gegebene Menge, Lücken leuchten; passende Stange einpassen; zu kurz/zu lang fliegt zurück.

**Interaktion Stufe B – Mini-Schlange (neu in diesem Spiel oder eigenes Spiel):**
- 3–5 farbige Stangen 1–9 als Schlange.
- Kind tippt Grenze „hier ist zehn“, tauscht gegen goldene Stange, Rest wird „grau/schwarz“.
- Am Ende: Partnerkontrolle (Stangen zu Paaren legen).

**Stufen:** Partner zu 10 → zum nächsten Zehner → zu 100 (Zehnerpartner) → Schlange.

**Anti-Zähl:** Passung statt Ausrechnen; später Zehnersuche.

**Änderung vs. Ist:** Name bleibt „Verliebte Zahlen“; Schlange ergänzen; rosa Partnerfarbe ok, optional an Short-Bead-Farben anlehnen ohne Zwang.

### 5.4 Zerlege-Zauber (P0)

**Ziel:** Teil-Ganzes; systematische Zerlegungen; später Automatisierung.

**Quellen:** MaCo „Immer x“; Marx et al. Part-Whole-Affordances; Gaidoschik Strategiegruppen; Schüttelbox-Idee (ein Teil verdeckt).

**Interaktion:**
- **Enaktiv:** Kette/Perlenreihe teilen (Ist) – behalten.
- **Systematik:** Auftrag „Finde 3 / alle Zerlegungen von 8“; Karten sammeln; Tauschaufgabe zählt einmal.
- **Verdeckt (neu):** Haus oder Schachtel zeigt Ganzes und einen Teil → fehlenden Teil legen/wählen.
- **Automatisierungsmodus (neu):** Karte „5 + ? = 8“ in Gruppe „Kraft der Fünf“; Fortschritt pro Gruppe.

**Zahlenhaus:** auf echte Teil-Ganzes-Zerlegungen im ZR 20 beschränken; Stellenwert-Zerlegungen (40+23) besser nach „Lege die Zahl“ / neuer Stellentafel.

**Anti-Zähl:** strukturierte Reihe mit 5er-Lücke; verdeckte Teile erzwingen Abruf.

**Änderung vs. Ist:** Systematik + verdeckte Variante + Automatisierungsgruppen; Haus-Inhalt trennen.

### 5.5 Lege die Zahl (P0)

**Ziel:** Kardinalität + Stellenwert-Notation; Griffökonomie (Zerlegung vor Handlung).

**Quellen:** Fetching + Association; Teen/Ten Boards; Ladel kürzester Weg.

**Interaktion:**
- Zielzahl als Ziffer **oder** Zahlwort **oder** gestapelte Karten-Vorschau.
- Legen mit 10/5/1; Griffzähler; ✓ wenn Wert stimmt.
- **Neu Teen-Modus:** feste „10“-Leiste, Einer-Kachel über Null schieben, parallel Perlen.
- **Neu:** „Aufräumen“-Button wandelt 14 Einer → 1Z+4E (werterhaltend).
- Feedback bei Zahlendreher (62 statt 26): visuell Zehner/Einer tauschen anbieten.

**Stufen:** Teen 11–19 → Zehner+Einer bis 49 → bis 99 inkl. Zahlwörter → unkonventionell entbündelt vorgeben und aufräumen.

**Anti-Zähl:** Fünfergriff + Idealgriffe; keine Einzelschritt-Zählleiste.

### 5.6 Bündeln (P0 – näher an Change Game)

**Ziel:** Bündelungsprinzip handelnd; Vorbereitung dynamischer Operationen.

**Quellen:** Change/Bank Game; MaCo Stellenwert.

**Interaktion:**
- Start: absichtlich „unaufgeräumte“ Menge (z. B. 23 Einer oder 2Z + 15E).
- Kind muss zur **Bank-Zone** ziehen / Tausch tippen, bis Standardpartition.
- Umgekehrt: Auftrag „Du brauchst 7 Einer“ → Hammer / Entbündeln genau einer Stange.
- Rule-Card behalten (10 Perlen → 1 Stange).

**Stufen:** nur Einer→Zehner → Zehner→Einer → gemischt → (P1) Zehner→Hunderter.

**Anti-Zähl:** Ziel ist Tauschhandlung, nicht Abzählen des Ergebnisses; Self-check wenn Matte „aufgeräumt“ und Ziel-Chips übereinstimmen.

### 5.7 Plus mit Struktur (P0/P1 – stark überarbeiten)

**Ziel:** Addition über strukturierte Mengen und Strategien, **ohne** Einerschritt-Zählen.

**Quellen:** MaCo Strategien; Mahiko schrittweise / Hilfsaufgabe; Strip Board nur als spätere Idee.

**Interaktion neu (Wahl der Strategie als Icon-Leiste):**
1. **Dazuliegen** (Ist, behalten): zweite Menge mit 5/10-Griff dazu; Zehnerstopp visuell (Lücke bis 10 leuchtet).
2. **Verdoppeln ±1** (neu): bei 6+7 Spiegel zeigen.
3. **Analogie** (neu): 3+4 eingeblendet → 33+4 am Zehnerfeld.
4. **Rechenstrich** (neu, P1): Startzahl setzen; Sprünge +10 / +5 / +1 (große Chips), kein 1er-Hopsen-Zwang.

**Verboten im Feedback:** „Zähl die Stangen“ – ersetzen durch „Schau: volle Zehner, dann Einer“ / Struktur-Chips.

**Stufen:** bis 20 ohne Übergang → Übergang mit Zehnerstopp → große Zahlen mit Zehnerstangen → Strategie wählen.

**Control of error:** zu viel/zu wenig Menge; bei Rechenstrich Endpunkt muss zur Zielzahl passen (Grok: „Landest du bei …?“).

---

## 6. Neue Aktivitäten (empfohlen)

### N1 – Schlangen-Zehner (P0) ★

Digitales Snake Game light (siehe 5.3 Stufe B). Stärkstes Montessori-Anti-Zähl-Werkzeug für Partner zu 10. Buildable mit bestehenden Perlen/Stangen.

**Wichtige Anpassung:** Im Original zählt das Kind Perle für Perle bis 10 und setzt dann den Markierer. Digital ersetzen wir das Abzählen durch die **sensorische Wurzel** (Rote Stäbe / Zahlenstäbe: Länge = Anzahl):
- Jede farbige Stange zeigt ihre 5er-Struktur (7 = 5 + 2) und wird als Ganzes gegriffen.
- Das Kind legt eine **goldene Zehner-Schablone** an die Schlange. Wo die Schablone endet, schneidet sie die Schlange: Passt eine Stange genau, wird sie gold. Steht eine Stange über, wird der Rest zur grauen Reststange und rückt nach vorne.
- Stufe 1: Schlange nur aus Partnerpaaren (7|3, 6|4, …). Das Kind sucht die Paare, ein Paar wird gold (= Verliebte Zahlen als Schlange).
- Stufe 2: gemischte Schlange mit Rest; Stufe 3: Ergebnis als Zahl (5 goldene + Rest 3 = 53) mit Zahlenkarten.
- **Control of error am Schluss** (wie im Original): Die bunten Stangen werden neben die goldenen Zehner gelegt. Geht jedes Paar auf, stimmt die Schlange.
- **Variante Minus (P2):** graue „Weg“-Stangen (Negative Snake).

### N2 – Bank-Wechsel / Change (P0)

Eigenständiges Mini-Spiel oder Werkstatt-Auftrag: unaufgeräumte Perlen → Standardpartition über Tausch. Deckt Stellenwert tiefer als aktuelles „Bündeln“.

### N3 – Zehn-und-Board (Teen/Ten) (P1)

Seguin digital: Leiste „10“ / „20“…, Einer-Kachel über Null; parallel Perlen. Bekämpft Zahlendreher und ordinales Weiterzählen in der Teen-Phase.

### N4 – Hunderterfeld mit Abdeckwinkel (P1)

Mahiko-Logik: Feld 10×10 mit 5er-Lücken; Winkel aufziehen; Zahl erkennen/einstellen; Blitz-Variante. **Nicht** als Abzählhilfe für Plus.

### N5 – Rechenstrich-Sprünge (P1)

Leerer Strich; Sprung-Chips 10/5/1; Aufgaben 27+14 als +10+4. Strategiewahl sichtbar.

### N6 – Doppel & Nachbar (P1)

Kernaufgaben verdoppeln; dann ±1 ableiten (Gaidoschik/MaCo). Kurz, high impact für Automatisierung.

### N7 – Stellentafel werterhaltend (P2)

ACAT-Tafel: Token ziehen = automatisch bündeln/entbündeln. Stark, aber UI-Aufwand.

**Priorität neu:** N1 + N2 zuerst; dann N3 + N6; dann N4 + N5; N7 optional.

---

## 7. Lernpfad und leichtes Fortschrittsmodell

### 7.1 Phasen (Unlock)

| Phase | Fokus | Freie Werkstatt | Spiele freischalten |
|-------|--------|-----------------|---------------------|
| **A – Sehen & Zerlegen (ZR 10)** | Kraft der 5, Partner zu 10, Zerlegungen | ja (nur Einer/Fünfer, max 20) | Schnelles Sehen 1; Verliebte 1; Zerlege 1; Doppel light |
| **B – Zehn und Bündeln (ZR 20)** | Teen, Wechsel, Zehnerstopp | Zehnerstangen dazu | Lege Teen; Bündeln 1–2; Plus Übergang; Schlange |
| **C – Stellenwert (ZR 100)** | Zehner+Einer, Karten, Analogien | voll bis 100 + Hunderter | Lege bis 99; Verliebte 100; Hunderterfeld; Plus groß |
| **D – Strategien** | Rechenstrich, Hilfsaufgabe, Nachbar | Aufträge unkonventionell | Rechenstrich; Nachbar; Automatisierungsgruppen |

Montessori-Prinzip: **Werkstatt nie sperren** – nur Aufträge/Spiele steuern die Progression.

### 7.2 Fortschritt (leicht)

Pro Spielstufe:
- `seen` (angefangen), `solved` (Runden ok), `mastered` (z. B. 2× hintereinander oder Zerlegungsgruppe grün).

Zusätzlich **Strategiegruppen** (lokal): `bonds10`, `kraft5`, `doubles`, `neighbors` – Sterne nicht als Gamification-Regen, sondern als ruhige Häkchen in der Elternansicht.

Elternseite: welche Phase, welche Gruppen, kurzer Tipp („Heute: Partner zu 10 mit der Schlange“).

---

## 8. Mapping: Curriculum ↔ App

| BW / KMK Erwartung | App-Baustein |
|--------------------|--------------|
| Quasi-simultan erfassen | Schnelles Sehen + Hunderterfeld-Blitz |
| Zahlzerlegungen | Zerlege-Zauber + Automatisierungsgruppen |
| Stellenwert, Bündeln/Entbündeln | Werkstatt, Bank-Wechsel, Bündeln, Stellentafel |
| Strategische Werkzeuge | Plus mit Struktur (Mehrwege), Rechenstrich, Doppel/Nachbar |
| Analogien ZR 100 | Plus-Analogie-Modus; Lege die Zahl |
| Grundaufgaben abrufen | Verliebte Zahlen, Automatisierungsmodus |

---

## 9. Umsetzungsreihenfolge (buildable Static Site)

1. **Feedback-Texte streichen**, die zum Zählen einladen (Plus).
2. **Schnelles Sehen:** kürzer + „Wie gesehen?“-Icons.
3. **Bank-Wechsel** in Werkstatt/Bündeln.
4. **Schlangen-Zehner** als neues Spiel.
5. **Zerlege:** verdeckte Teile + Systematik „Immer x“.
6. **Lege:** Teen-Board-Modus + Aufräumen.
7. **Plus:** Strategie-Icons (Verdoppeln, Analogie); Zehnerstopp klarer.
8. **Doppel & Nachbar** neu.
9. **Hunderterfeld + Rechenstrich**.
10. Lernpfad-Unlock + Eltern-Phase.

Alles mit Pointer Events / bestehendem `builder.js` / `beadfx.js` machbar; keine Backend-Abhängigkeit.

---

## 10. Offene Fragen an Matthias (und Partnerin)

1. Soll die **Schlange** eigenes Spiel sein oder Ausbaustufe von „Verliebte Zahlen“?
2. Wie montessori-nah die **Farben der Stangen 1–9**? (Aktuell bewusst eigene Palette – Partnerin: klassisch oder weiter soft?)
3. **Teen-Board-Sprache:** lieber „zehn und drei“-Zwischenstep vor dem deutschen Zahlwort – oder zu verwirrend neben der Schule?
4. Darf **Minus** in V2 (Negative Snake / Entbündeln zum Abziehen) oder erst später?
5. Soll der Lernpfad **sperren** oder nur empfehlen (Sterne/„nächstes“)?
6. Elternansicht: nur Text oder auch **kurze Erklärclips** (Mahiko-Stil, ohne Tonpflicht)?
7. iPad-First: Multi-Touch „fünf Finger = Fünfer“ (Fingu-Idee) – Aufwand vs. Nutzen?

---

## 11. Quellenverzeichnis (Auswahl, mit URL)

### Montessori
- AMI Glossary: https://montessori-ami.org/resource-library/facts/glossary-montessori-terms  
- Control of Error (AMI Voices): https://montessori-ami.org/sites/default/files/downloads/voices/ControlofError.pdf  
- Three-Period Lesson: https://www.montessoriservices.com/ideas-insights/the-three-period-lesson  
- Numbers 1–10: https://montessoricommons.cc/group-1-numbers-1-to-10/  
- Association Beads & Cards: https://www.montessorialbum.com/montessori/index.php/Association_of_Beads_and_Cards  
- Change Game: https://reachformontessori.com/change-game/  
- Bank Game: https://carrotsareorange.com/montessori-golden-beads-bank-game-lesson/  
- Snake Game Album: https://www.montessorialbum.com/montessori/index.php/Addition_Snake_Game  
- Snake Bonds of Ten: https://www.wonderfulmontessori.com/snake-game-bonds-of-ten  
- Teen Board: https://carrotsareorange.com/teen-board/  
- Hundred Chain & Board: https://alisonsmontessori.blog/hundred-chain-hundred-board/  
- Stamp Game: https://www.risingtidemontessori.org/the-decimal-system/stamp-game  
- Lillard et al. 2017: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2017.01783/full  
- Lautner 2013: https://edoc.ub.uni-muenchen.de/15372/1/Lautner_Anja.pdf  

### Deutsche Didaktik
- Gaidoschik PIKAS: https://pikas.dzlm.de/pikasfiles/uploads/upload/Material/Haus_3_-_Umgang_mit_Rechenschwierigkeiten/IM/Informationstexte/Beitrag_Gaidoschik.pdf  
- Gaidoschik Automatisieren: https://wwwold.mathematik.tu-dortmund.de/ieem/mathe2000/pdf/Symp20/Workshop%20Gaidoschik%20Homepage.pdf  
- MaCo Ablösung: https://maco.dzlm.de/sites/maco/files/material-lul/dzlm_maco_prim_ablzaehlendrechnen_221109.pdf  
- MaCo Stellenwert: https://maco.dzlm.de/sites/maco/files/material-lul/dzlm_maco_prim_stellenwert_220712.pdf  
- PIKAS-mi Anzahlen: https://pikas-mi.dzlm.de/inhalte/zahlvorstellungen-tragf%C3%A4hige-vorstellungen-aufbauen-zr-bis-100/hintergrund/anzahlen  
- Primakom Zahlenstrahl/Rechenstrich: https://primakom.dzlm.de/inhalte/zahlen-und-operationen/zahlraumerweiterung/hintergrund  
- Wartha/Schulz SINUS: http://www.sinus-an-grundschulen.de/fileadmin/uploads/Material_aus_SGS/Handreichung_WarthaSchulz.pdf  
- Mahiko: https://mahiko.dzlm.de/  
- Mahiko Hunderterfeld: https://mahiko.dzlm.de/sites/mahiko/files/uploads/2_schuljahr/Zahlendarstellen/Pdf/zahlen_darstellen_zr100_zahlen_am_100erfeld_darstellen.pdf  
- Mahiko schrittweise Plus: https://mahiko.dzlm.de/sites/mahiko/files/uploads/2_schuljahr/HalbschriftlicheAddition/pdf/zr100_halbschriftlicheaddition_u1_schrittweise_220824.pdf  
- BW Zahldarstellungen: https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_M_IK_1-2_01_01  
- BW Rechenoperationen: https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GS_M_IK_1-2_01_02  
- KMK BiSta 2022: https://www.kmk.org/fileadmin/Dateien/veroeffentlichungen_beschluesse/2022/2022_06_23-Bista-Primarbereich-Mathe.pdf  
- Gaidoschik Hundertraum-Fragen (Kolloquium): https://wwwold.mathematik.tu-dortmund.de/de/index/veranstaltungen/didakkol/year=2014.html  

### Digital
- Ladel/Kortenkamp Kraft der Fünf: https://cermat.org/sites/default/files/LadelKortenkamp-VAGKF-2009a.pdf  
- Kortenkamp/Ladel Place Value (PME): https://files.eric.ed.gov/fulltext/ED599901.pdf  
- Ladel/Kortenkamp Multi-Touch: https://cadgme2014.cermat.org/sites/default/files/LadelKortenkamp-AAMTEML-2011a.pdf  
- Moyer-Packenham & Westenskow: https://eric.ed.gov/?id=EJ1154970  
- Marx et al. 2025 Part-Whole Apps: https://files.eric.ed.gov/fulltext/EJ1462275.pdf  
- Fingu: https://researchportal.hkr.se/ws/portalfiles/portal/40988658/FULLTEXT01.pdf  
- TouchCounts: http://www.touchcounts.ca/  
- Math Learning Center Apps: https://www.mathlearningcenter.org/apps  
- Rechenfeld: https://rechenfeld.de/  

---

*Ende Recherche V2. Nächster Schritt nach Klärung der offenen Fragen: Umsetzung laut Abschnitt 9, parallel zum gestalterischen Feinschliff (ohne Kreise/Bubbles).*
