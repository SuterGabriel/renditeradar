# Offene Punkte

Was fehlt, was bewusst weggelassen wurde und was beim Abschluss eines Meilensteins geprüft wurde. Neueste Einträge oben.

## Bewusst nicht im Umfang

- **Auth, Stripe, Cron, Benachrichtigungen.** Durch andere Projekte belegt, hier weggelassen, damit der Umfang in einen Abend passt.
- **Scraping realer Portale.** Rechtlich heikel und für die Demonstration der Pipeline nicht nötig. Die Daten werden generiert, siehe README unter Datenherkunft.
- **Dunkelmodus.** Nicht im Mockup, nicht in der Umsetzung.

## Meilensteine

### M0 Fundament, 2026-09-08

Angelegt: Projektstruktur, Lizenz, `.gitignore`, `.env.example`, MCP-Konfiguration mit Platzhaltern, Skills unter `.claude/skills/`, Mockups unter `docs/mockups/`.

Zwischenfall: Zwei Claude-Sitzungen haben gleichzeitig im Repo geschrieben. Dabei fehlte kurz ein Ignore-Eintrag, und 236 Dateien der Tailwind-Dokumentation gerieten in einen gepushten Commit. Die Historie wurde vor dem ersten Klon neu geschrieben, die Regel "nur benannte Dateien stagen" steht seither im Skill `commit`.

Offen nach M0:

- Supabase-Projekt ist noch nicht verbunden. Die Pipeline in M1 braucht die Verbindungsdaten in `.env`.
- Die Hersteller-Skills unter `.claude/skills/` sind Kopien vom Installationszeitpunkt. Sie werden nicht automatisch aktualisiert.
