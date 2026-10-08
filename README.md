# Grok's Zahlenwerkstatt

Eine kleine Mathe-Werkstatt für Kinder der 2. Klasse – im Browser, auf dem iPad und am Computer.

**Ziel:** Zahlen bis 100 **in Fünfern und Zehnern sehen**, statt einzeln abzuzählen. Inspiriert vom Montessori-Material (goldene Perlen, Zahlenkarten) und der deutschen Grundschuldidaktik („Kraft der Fünf“, Zehnerbündelung).

## Was steckt drin?

- **Werkstatt** – frei bauen mit Zehnerstangen, Fünfern und Einern; bündeln und entbündeln; Zahlen bis 100 legen; optionales Lege-Ziel
- **Lernen** – sechs Spiele mit je drei Stufen: Schnelles Sehen, Zehnerfreunde, Zerlege-Zauber, Lege die Zahl, Bündeln, Plus mit Struktur
- **Grok** – Begleitfigur mit Tipps auf Antippen
- Touch-first (iPad), kein Login, kein Tracking, Fortschritt nur lokal

## Lokal starten

Beliebigen lokalen Webserver im Projektordner starten, z. B.:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen.

## Technik

Statische Site: HTML, CSS, Vanilla-JS (ES-Module). Konzept: `docs/KONZEPT.md`.
