# Mockups

Beide Dateien wurden vor dem ersten Code mit Claude Design erstellt, in zwei Stufen.

| Datei | Stufe | Inhalt |
|---|---|---|
| `01-wireframes-mobil.pdf` | Wireframe | Listenseite, Leerzustand, Detailseite. Nur Mobil, Graustufen, keine Gestaltung. Legt Aufbau und Gewichtung fest. |
| `02-ui-mockups.pdf` | UI-Mockup | Dieselben Seiten mit Farbe, Typografie und Desktop-Variante, dazu ein Komponenten-Artboard mit Zuständen, Farbwerten und Schriftgrössen. |

Die Farbwerte und Schriftgrössen aus dem Komponenten-Artboard sind die Grundlage für die Design-Token in `web/app/globals.css`.

## Abweichungen in der Umsetzung

Die Umsetzung folgt dem Mockup, mit drei bewussten Abweichungen. Begründung in `docs/architektur.md`.

1. Der Renditerechner hat je Eingabe Schieberegler und Zahlenfeld, wie im Wireframe. Das Mockup zeigt nur Zahlenfelder.
2. Es gibt keinen Knopf "Filter anwenden". Filter wirken sofort über die URL.
3. Die ganze Objektkarte ist ein Link, nicht nur der Titel.
