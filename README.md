# Grok's Zahlenwerkstatt

Eine kleine Mathe-Werkstatt für Kinder der 2. Klasse – im Browser, auf dem iPad und am Computer.

**Ziel:** Zahlen bis 100 **in Fünfern und Zehnern sehen**, statt einzeln abzuzählen. Inspiriert vom Montessori-Material (goldene Perlen, Zahlenkarten) und der deutschen Grundschuldidaktik („Kraft der Fünf“, Zehnerbündelung).

## Was steckt drin?

- **Werkstatt** – frei bauen mit Zehnerstangen, Fünfern und Einern; Knopf „Zehner machen“ (bündeln) und Hammer an jeder Stange (aufbrechen); werterhaltend ziehen (Stange auf Einer = 10 Einer, volle Zehnerreihe auf Zehner = Stange); Bank-Wechsel (unordentlich starten, tauschen bis es ordentlich ist); Zahlen bis 100 legen; optionales Lege-Ziel
- **Lernen** – Lernpfad in 4 Phasen (A Sehen & Zerlegen bis 10 · B Zehn & Bündeln bis 20 · C Stellenwert bis 100 · D Strategien). Er empfiehlt nur, nichts ist gesperrt. Zehn Spiele: Schnelles Sehen (Blitz + nachlegen + „Wie hast du's gesehen?“), Verliebte Zahlen, Zerlege-Zauber (alle Zerlegungen, Schüttelbox, Blitz-Gruppen), Doppel & Nachbar, Lege die Zahl (Griffe, Aufräumen, Seguin-Tafel, Zahlenhaus), Bündeln (inkl. Bank-Wechsel), Schlangen-Zehner (Montessori-Schlangenspiel), Plus mit Struktur (Zehnerstopp, Doppel ±1, Kraft der Fünf, Analogie), Hunderterfeld mit Abdeckwinkel, Rechenstrich mit Sprung-Chips
- **Eltern** – ruhiger Überblick: Phasen, gesehen/gelöst/sicher, Strategie-Gruppen (keine Punkte, kein Ranking)
- **Hintergrund** – Recherche: `RECHERCHE-V2.md` (ausführlich) und `RECHERCHE-V2-KURZ.md`
- **Grok** – Begleitfigur: läuft ruhig zur Aufgabe, zum Knopf oder zur Fehlerstelle, spricht dort kurz und geht zurück; verdeckt nichts Bedienbares, lässt Berührungen durch; Antippen = Tipp (bei „Bewegung reduzieren“ ohne Laufen)
- **Perlen** – glänzende 3D-„Jelly“-Perlen in eingelassenen Ton-Rillen und -Mulden (Licht von links oben); beim Ziehen hängen sie wie an einer Schnur aneinander, ohne Verzerrung, und gleiten ruhig in den nächsten freien Platz. Großzügige Ablage für Finger (Zone + Rand, Kettenmitte zählt).
- **Eine Perlengröße** – `js/sizing.js`: ein Wert `--bead` pro Fenstergröße für Werkstatt, Auswahl, Ziehen und alle Spiele; Viele-Perlen-Felder höchstens 2 Stufen kleiner (0,84 / 0,7)
- **Bild statt Text** – Symbole, gestrichelte Ziele, sichtbare Mulden, Geister-Hand beim ersten Mal, kurze Grok-Sätze
- **Einstellungen** (unten rechts) – 4 Themen-Welten: Nacht und Tiefsee (dunkel), Salbei und Rosé (helle Ton-Welten, nie reinweiß, mit sanftem Verlauf); Sonne/Mond wechselt zwischen dem zuletzt gewählten hellen und dunklen Thema. 3 Schriften (Figtree, Outfit, DM Sans – einstöckiges a, OFL, selbst gehostet), Überschriften in Bricolage Grotesque; 3 Größen (Kompakt, Groß, Riesig). Standard: Nacht + Figtree + Groß. Ältere gespeicherte Einstellungen werden automatisch übernommen.
- Touch-first (iPad), kein Login, kein Tracking, Fortschritt nur lokal

## Lokal starten

Beliebigen lokalen Webserver im Projektordner starten, z. B.:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen.

## Technik

Statische Site: HTML, CSS, Vanilla-JS (ES-Module), kein Build-Schritt. Konzept: `docs/KONZEPT.md`.

Nach Änderungen die Cache-Version erhöhen: `python3 tools/set-version.py <n>`.

Schriften: `fonts/` (SIL Open Font License, siehe `fonts/OFL-*.txt`).
