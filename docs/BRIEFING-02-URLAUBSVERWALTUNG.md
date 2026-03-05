# Briefing 02: Urlaubsverwaltung - Übersicht & Planung

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
| Icons | Lucide Icons (Calendar, PlaneTakeoff, Clock) |
| Framework | Tailwind CSS |

---

## Anforderungen

### Teil A: Urlaubsübersicht anzeigen

Neue Übersichtskarte auf Dashboard oder Abwesenheits-Seite:

| Zeile | Beschreibung | Beispiel |
|-------|--------------|----------|
| Jahresurlaub | Basis-Anspruch | 30 Tage |
| Resturlaub Vorjahr | Übertrag aus Vorjahr | 5 Tage |
| **Gesamtanspruch** | Summe | **35 Tage** |
| Genommen/Genehmigt | Bereits verbraucht | 7 Tage |
| **Noch verfügbar** | Rest | **28 Tage** |

### Teil B: Urlaubsplanung (neu)

1. Mitarbeiter kann Urlaub zunächst **planen** (neuer Status: "Geplant")
2. Geplanter Urlaub wird im Kalender angezeigt (andere Farbe: gestrichelt oder grau)
3. Geplanter Urlaub kann jederzeit **bearbeitet** oder **gelöscht** werden
4. Button **"Antrag einreichen"** wandelt geplanten Urlaub in echten Antrag um
5. Erst dann startet der zweistufige Freigabeprozess (TEAM_LEAD → CEO)

### Workflow

```
[Urlaub planen] → Status: "Geplant" (nur für User sichtbar)
       ↓
[Antrag einreichen] → Status: "Wartet auf Teamleiter"
       ↓
[Teamleiter genehmigt] → Status: "Wartet auf CEO"
       ↓
[CEO genehmigt] → Status: "Freigegeben"
```

---

## Datenbank-Änderungen

### 1. Neue Spalte für Resturlaub Vorjahr

```sql
ALTER TABLE profiles 
ADD COLUMN vacation_days_previous_year INT DEFAULT 0;
```

### 2. Types.ts anpassen

Neuer Status in `AbsenceStatus` Enum:

```typescript
export enum AbsenceStatus {
  PLANNED = 'Geplant',                    // NEU
  PENDING_TEAM_LEAD = 'Wartet auf Teamleiter',
  PENDING_CEO = 'Wartet auf CEO',
  APPROVED = 'Freigegeben',
  REJECTED = 'Abgelehnt'
}
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `types.ts` | AbsenceStatus.PLANNED hinzufügen |
| `views/AbsenceManagement.tsx` | Planungsfunktion, Übersicht, "Antrag einreichen" Button |
| `views/Dashboard.tsx` | Urlaubsübersicht-Karte mit allen Werten |

---

## UI-Mockup: Urlaubsübersicht

```
┌─────────────────────────────────────────┐
│ MEIN URLAUBSKONTO 2026                  │
├─────────────────────────────────────────┤
│ Jahresurlaub           30 Tage          │
│ Resturlaub 2025       + 5 Tage          │
│ ─────────────────────────────────       │
│ Gesamtanspruch         35 Tage          │
│                                         │
│ Genommen/Genehmigt    - 7 Tage          │
│ ─────────────────────────────────       │
│ Noch verfügbar         28 Tage          │
│ █████████████████████░░░░░░░ 80%        │
└─────────────────────────────────────────┘
```

## UI-Mockup: Planungsfunktion

```
┌─────────────────────────────────────────────────────────────────┐
│ MEINE ABWESENHEITEN                                             │
├─────────────────────────────────────────────────────────────────┤
│ [+ Urlaub planen]  [+ Antrag stellen]                          │
├──────────┬───────────┬───────────┬──────────┬──────────────────┤
│ Zeitraum │ Tage      │ Status    │ Aktionen │                  │
├──────────┼───────────┼───────────┼──────────┼──────────────────┤
│ 15.04-22.04│ 5 Tage  │ 📝 Geplant│ [Einreichen] [✏️] [🗑️]    │
│ 01.07-15.07│ 10 Tage │ ✅ Freigegeben │ -                      │
└──────────┴───────────┴───────────┴──────────┴──────────────────┘
```

---

## Sicherheit (RLS)

```sql
-- Geplante Urlaube: Nur eigene sehen
CREATE POLICY "Users see own planned absences" ON absences
  FOR SELECT USING (
    auth.uid() = user_id 
    OR status != 'Geplant'  -- Geplante nur für sich selbst
  );

-- Geplante Urlaube: Nur eigene bearbeiten/löschen
CREATE POLICY "Users can update own planned absences" ON absences
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND status = 'Geplant'
  );

CREATE POLICY "Users can delete own planned absences" ON absences
  FOR DELETE USING (
    auth.uid() = user_id 
    AND status = 'Geplant'
  );
```

---

## Security Checklist vor Deployment

```
□ Neue Spalte vacation_days_previous_year angelegt?
□ AbsenceStatus.PLANNED in types.ts hinzugefügt?
□ RLS-Policy: Geplante Urlaube nur für eigenen User sichtbar?
□ RLS-Policy: Nur geplante Urlaube bearbeitbar/löschbar?
□ Eingereichte Anträge können nicht mehr gelöscht werden?
□ Console.logs entfernt?
```

---

## Geschätzter Aufwand

~2-3 Stunden

---

## Abnahmekriterien

- [ ] Urlaubsübersicht zeigt alle 5 Werte korrekt an
- [ ] Resturlaub Vorjahr kann im Profil gepflegt werden (Admin)
- [ ] Mitarbeiter kann Urlaub planen (Status "Geplant")
- [ ] Geplanter Urlaub ist nur für den Mitarbeiter selbst sichtbar
- [ ] Geplanter Urlaub kann bearbeitet und gelöscht werden
- [ ] "Antrag einreichen" ändert Status auf "Wartet auf Teamleiter"
- [ ] Nach Einreichung kann nicht mehr gelöscht werden
- [ ] Design entspricht Corporate Design
