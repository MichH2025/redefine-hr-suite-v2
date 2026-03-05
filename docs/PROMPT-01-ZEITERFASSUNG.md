# Claude Code Prompt - Briefing 01: Zeiterfassung

Lies die folgenden Dateien im Projektordner:
1. `PROJEKT-ZUSAMMENFASSUNG.md`
2. `BRIEFING-01-ZEITERFASSUNG.md`

## Aufgabe

Setze das Briefing 01 um: Erweitere die Zeiterfassung, sodass Mitarbeiter ihre eigenen Zeiteinträge nachträglich bearbeiten und löschen können.

## Schritte

1. **Analyse**: Lies zuerst `views/TimeTracking.tsx` und verstehe die aktuelle Struktur
2. **UI erweitern**: Füge eine "Aktionen"-Spalte mit Edit- und Delete-Icons hinzu
3. **Edit-Modal**: Erstelle ein Modal zum Bearbeiten (Datum, Startzeit, Endzeit)
4. **Delete-Dialog**: Erstelle einen Bestätigungsdialog vor dem Löschen
5. **Supabase-Funktionen**: Implementiere UPDATE und DELETE Funktionen
6. **RLS prüfen**: Zeige mir die SQL-Befehle für RLS-Policies bevor du sie ausführst
7. **Testen**: Stelle sicher, dass nur eigene Einträge bearbeitbar sind

## Wichtig

- Halte dich an das Corporate Design (siehe PROJEKT-ZUSAMMENFASSUNG.md)
- Verwende Lucide Icons (Pencil, Trash2)
- Zeige mir Datenbank-Änderungen (SQL) bevor du sie ausführst
- Prüfe die Security Checklist am Ende

## Nach Fertigstellung

Führe die Security Checklist aus BRIEFING-01-ZEITERFASSUNG.md durch und bestätige jeden Punkt.
