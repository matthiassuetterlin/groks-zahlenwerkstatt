# Grok's Zahlenwerkstatt

Eine kleine Mathe-Werkstatt für Kinder der 2. Klasse – im Browser, auf dem iPad und am Computer.

**Ziel:** Zahlen bis 100 **in Fünfern und Zehnern sehen**, statt einzeln abzuzählen. Inspiriert vom Montessori-Material (goldene Perlen, Zahlenkarten) und der deutschen Grundschuldidaktik („Kraft der Fünf“, Zehnerbündelung).

## Was steckt drin?

- **Werkstatt** – frei bauen mit Zehnerstangen, Fünfern und Einern; bündeln und entbündeln; Zahlen bis 100 legen; optionales Lege-Ziel
- **Lernen** – sechs Spiele mit je drei Stufen: Schnelles Sehen, Verliebte Zahlen, Zerlege-Zauber, Lege die Zahl, Bündeln, Plus mit Struktur
- **Grok** – Begleitfigur mit Tipps auf Antippen
- **Perlen-Physik** – Perlen hängen beim Ziehen wie eine magnetische Kette aneinander und landen mit kleinem Hüpfer (bei „Bewegung reduzieren“ ohne Animation)
- **Einstellungen** (unten rechts) – 3 Farbwelten (Leinen, Salbei, Nacht), 3 Schriften (Nunito, Andika, Atkinson Hyperlegible – alle OFL, selbst gehostet), 3 Größen
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
