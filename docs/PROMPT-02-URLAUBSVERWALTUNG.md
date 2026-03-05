# Claude Code Prompt - Briefing 02: Urlaubsverwaltung

Lies die folgenden Dateien im Projektordner:
1. `PROJEKT-ZUSAMMENFASSUNG.md`
2. `BRIEFING-02-URLAUBSVERWALTUNG.md`

## Aufgabe

Setze das Briefing 02 um: Erweitere die Urlaubsverwaltung mit einer detaillierten Übersicht und einer Planungsfunktion.

## Schritte

### Teil A: Datenbank-Änderungen

1. Zeige mir das SQL für die neue Spalte `vacation_days_previous_year` in der `profiles` Tabelle
2. Warte auf meine Bestätigung bevor du es ausführst

### Teil B: Types anpassen

1. Füge `PLANNED = 'Geplant'` zum `AbsenceStatus` Enum in `types.ts` hinzu

### Teil C: Urlaubsübersicht

1. Erstelle eine Übersichtskarte die zeigt:
   - Jahresurlaub (Basis)
   - Resturlaub Vorjahr
   - Gesamtanspruch
   - Genommen/Genehmigt
   - Noch verfügbar
2. Platziere sie auf dem Dashboard oder der Abwesenheits-Seite

### Teil D: Planungsfunktion

1. Neuer Button "Urlaub planen" (neben "Antrag stellen")
2. Geplanter Urlaub bekommt Status "Geplant"
3. Geplanter Urlaub ist nur für den User selbst sichtbar
4. Geplanter Urlaub kann bearbeitet und gelöscht werden
5. Button "Antrag einreichen" ändert Status auf "Wartet auf Teamleiter"

### Teil E: RLS-Policies

1. Zeige mir die SQL-Befehle für RLS-Policies (geplante Urlaube nur für eigenen User sichtbar)
2. Warte auf meine Bestätigung bevor du sie ausführst

## Wichtig

- Halte dich an das Corporate Design (siehe PROJEKT-ZUSAMMENFASSUNG.md)
- Geplanter Urlaub im Kalender anders darstellen (z.B. gestrichelt oder grau)
- Zeige mir alle SQL-Befehle bevor du sie ausführst
- Prüfe die Security Checklist am Ende

## Nach Fertigstellung

Führe die Security Checklist aus BRIEFING-02-URLAUBSVERWALTUNG.md durch und bestätige jeden Punkt.
