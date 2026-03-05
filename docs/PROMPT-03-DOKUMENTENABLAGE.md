# Claude Code Prompt - Briefing 03: Dokumentenablage

Lies die folgenden Dateien im Projektordner:
1. `PROJEKT-ZUSAMMENFASSUNG.md`
2. `BRIEFING-03-DOKUMENTENABLAGE.md`

## Aufgabe

Setze das Briefing 03 um: Überarbeite die Dokumentenablage komplett mit neuen Dokumententypen, Sortierung und Admin-Funktionen.

## Schritte

### Teil A: Datenbank-Änderungen

1. Zeige mir das komplette SQL für:
   - Neue Spalte `document_type` mit CHECK Constraint
   - Neue Spalte `reference_month` (DATE)
   - Neue Spalte `reference_year` (INT)
   - Neue Spalte `absence_id` (FK zu absences)
   - Index für schnellere Abfragen
2. **WARTE auf meine Bestätigung bevor du das SQL ausführst!**

### Teil B: Types anpassen

1. Erstelle `DocumentType` Type in `types.ts`
2. Aktualisiere das `Document` Interface

### Teil C: UI komplett neu strukturieren

1. **Tabs** für jeden Dokumententyp:
   - Verdienstabrechnungen
   - Jahressteuermeldungen
   - Arbeitsverträge & Nachträge
   - Krankmeldungen
   - Sonstiges

2. **Mitarbeiter-Ansicht**:
   - Tabs für Dokumententypen
   - Sortierung nach Monat/Jahr innerhalb der Tabs
   - Upload-Button pro Kategorie

3. **Admin-Ansicht (CEO)**:
   - Dropdown zur Mitarbeiter-Auswahl
   - Kann für jeden Mitarbeiter Dokumente hochladen
   - Sieht alle Dokumente aller Mitarbeiter

4. **Upload-Dialog**:
   - Dropdown für Dokumententyp
   - Monatsauswahl (bei Verdienstabrechnungen)
   - Jahresauswahl (bei Steuermeldungen)
   - Verknüpfung mit Abwesenheit (bei Krankmeldungen)

### Teil D: Krankmeldung-Workflow

1. Bei Abwesenheit Typ "Krankheit" → Hinweis anzeigen: "Bitte Krankmeldung hochladen"
2. Link führt zu Dokumentenablage → Tab Krankmeldungen
3. Beim Upload kann Abwesenheit verknüpft werden

### Teil E: RLS-Policies

1. Zeige mir die SQL-Befehle für RLS-Policies:
   - User sieht nur eigene Dokumente
   - CEO sieht alle Dokumente
   - CEO kann für alle hochladen
2. **WARTE auf meine Bestätigung bevor du das SQL ausführst!**

## Wichtig

- Halte dich an das Corporate Design (siehe PROJEKT-ZUSAMMENFASSUNG.md)
- Signed-URLs auf maximal 1 Stunde Gültigkeit setzen
- **Zeige mir ALLE SQL-Befehle bevor du sie ausführst**
- Prüfe die Security Checklist am Ende

## Reihenfolge

1. Erst Datenbank-Änderungen (mit meiner Bestätigung)
2. Dann Types anpassen
3. Dann UI komplett neu bauen
4. Dann RLS-Policies (mit meiner Bestätigung)
5. Dann testen

## Nach Fertigstellung

Führe die Security Checklist aus BRIEFING-03-DOKUMENTENABLAGE.md durch und bestätige jeden Punkt.
