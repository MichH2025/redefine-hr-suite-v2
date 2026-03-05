# Briefing 01: Zeiterfassung - Bearbeiten & Löschen

## Projekt-Kontext

| Key | Value |
|-----|-------|
| App | REDEFINE HR Management Suite (React/TypeScript/Vite) |
| GitHub | MichH2025/redefine-hr-suite-v2 |
| Supabase Projekt-ID | ykdkepnjybawbnknrjkv |
| Live URL | https://redefine-hr-suite-v2.vercel.app |

## Corporate Design

| Element | Wert |
|---------|------|
| Primärfarbe | #A86E3A (Goldbraun) |
| Sekundärfarbe | #000000 (Schwarz) |
| Font | Titillium Web |
| Buttons | rounded-sm |
| Icons | Lucide Icons (Pencil, Trash2) |
| Framework | Tailwind CSS |

---

## Anforderungen

### Funktional

1. Mitarbeiter können eigene Zeiteinträge nachträglich **bearbeiten**
2. Mitarbeiter können eigene Zeiteinträge **löschen**
3. Bestätigungsdialog vor dem Löschen ("Eintrag wirklich löschen?")
4. Bearbeitungs-Modal mit: Datum, Startzeit, Endzeit
5. Nur eigene Einträge bearbeitbar (nicht die anderer Mitarbeiter)

### UI-Änderungen

- Tabelle in `TimeTracking.tsx`: Neue Spalte "Aktionen" mit Edit- und Delete-Icons
- Modal für Bearbeitung (ähnliches Design wie Neu-Eintrag-Modal)
- Bestätigungs-Dialog für Löschen (z.B. "Möchten Sie diesen Eintrag wirklich löschen?")

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `views/TimeTracking.tsx` | Aktionen-Spalte, Edit-Modal, Delete-Dialog |

---

## Datenbank-Änderungen

Keine Änderungen nötig. Die `time_entries` Tabelle unterstützt bereits UPDATE und DELETE.

---

## Sicherheit (RLS)

Prüfen ob folgende RLS-Policy existiert:

```sql
-- User darf nur eigene time_entries bearbeiten/löschen
CREATE POLICY "Users can update own time entries" ON time_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries" ON time_entries
  FOR DELETE USING (auth.uid() = user_id);
```

---

## UI-Mockup (Konzept)

```
┌─────────────────────────────────────────────────────────────────┐
│ ZEITERFASSUNG                                                   │
├──────────┬───────────┬───────────┬──────────┬──────────────────┤
│ Datum    │ Start     │ Ende      │ Dauer    │ Aktionen         │
├──────────┼───────────┼───────────┼──────────┼──────────────────┤
│ 05.03.26 │ 08:30     │ 17:00     │ 8,5h     │ [✏️] [🗑️]        │
│ 04.03.26 │ 09:00     │ 18:30     │ 9,5h     │ [✏️] [🗑️]        │
└──────────┴───────────┴───────────┴──────────┴──────────────────┘
```

---

## Security Checklist vor Deployment

```
□ RLS-Policy für UPDATE auf time_entries aktiv?
□ RLS-Policy für DELETE auf time_entries aktiv?
□ Nur eigene Einträge im Frontend filterbar?
□ Bestätigungsdialog vor Löschung?
□ Console.logs entfernt?
```

---

## Geschätzter Aufwand

~1 Stunde

---

## Abnahmekriterien

- [ ] Mitarbeiter kann eigenen Zeiteintrag bearbeiten
- [ ] Mitarbeiter kann eigenen Zeiteintrag löschen
- [ ] Bestätigungsdialog erscheint vor Löschung
- [ ] Fremde Einträge können nicht bearbeitet/gelöscht werden
- [ ] Design entspricht Corporate Design
