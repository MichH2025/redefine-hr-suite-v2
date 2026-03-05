# Briefing 03: Dokumentenablage - Komplette Überarbeitung

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
| Icons | Lucide Icons (FileText, Upload, Folder, Calendar, File, FilePlus) |
| Framework | Tailwind CSS |

---

## Anforderungen

### Dokumententypen

| Typ | Sortierung | Beschreibung |
|-----|------------|--------------|
| Verdienstabrechnung | Nach Monat | Jan 2025, Feb 2025, etc. |
| Jahressteuermeldung | Nach Jahr | 2024, 2025, etc. |
| Arbeitsvertrag | Ohne Datum | Einmalig pro Mitarbeiter |
| Nachtrag | Nach Datum | Vertragsänderungen, Zusatzvereinbarungen |
| Krankmeldung | Nach Datum | Verknüpft mit Abwesenheit (Krankheit) |
| Sonstiges | Nach Datum | Fallback für andere Dokumente |

### UI-Struktur: Mitarbeiter-Ansicht

1. **Tabs** für jeden Dokumententyp (horizontal)
2. Innerhalb jedes Tabs: Sortierung nach Monat/Jahr (neueste zuerst)
3. Upload-Button pro Kategorie
4. Bei Krankmeldung: Option zur Verknüpfung mit Abwesenheitseintrag

### UI-Struktur: Admin-Ansicht (CEO)

1. **Dropdown**: Mitarbeiter auswählen (oder "Alle")
2. Gleiche Tab-Struktur wie Mitarbeiter-Ansicht
3. Kann Dokumente für jeden Mitarbeiter hochladen
4. Übersicht aller Dokumente aller Mitarbeiter

### Krankmeldung-Workflow

1. Mitarbeiter erstellt Abwesenheit mit Typ "Krankheit"
2. System zeigt Hinweis: "Bitte laden Sie Ihre Krankmeldung hoch"
3. Link führt direkt zu Dokumentenablage → Tab "Krankmeldungen"
4. Beim Upload: Dropdown zur Auswahl der zugehörigen Abwesenheit
5. Dokument wird mit `absence_id` verknüpft

---

## Datenbank-Änderungen

### 1. Dokumententyp-Spalte ändern

```sql
-- Alte Spalte entfernen (falls vorhanden)
ALTER TABLE documents 
DROP COLUMN IF EXISTS type;

-- Neue Spalte mit korrekten Typen
ALTER TABLE documents 
ADD COLUMN document_type VARCHAR(50) NOT NULL DEFAULT 'Sonstiges';

-- Check Constraint für erlaubte Werte
ALTER TABLE documents
ADD CONSTRAINT valid_document_type 
CHECK (document_type IN (
  'Verdienstabrechnung', 
  'Jahressteuermeldung', 
  'Arbeitsvertrag', 
  'Nachtrag', 
  'Krankmeldung', 
  'Sonstiges'
));
```

### 2. Referenz-Spalten für Sortierung

```sql
-- Monat-Referenz für Verdienstabrechnungen (z.B. 2025-03-01 für März 2025)
ALTER TABLE documents 
ADD COLUMN reference_month DATE;

-- Jahr-Referenz für Jahressteuermeldungen (z.B. 2024)
ALTER TABLE documents 
ADD COLUMN reference_year INT;
```

### 3. Verknüpfung mit Krankmeldung

```sql
-- Foreign Key zu absences für Krankmeldungen
ALTER TABLE documents 
ADD COLUMN absence_id UUID REFERENCES absences(id) ON DELETE SET NULL;
```

### 4. Komplettes SQL (zusammengefasst)

```sql
-- Führe diese Befehle im Supabase SQL Editor aus:

-- 1. Alte type-Spalte entfernen falls vorhanden
ALTER TABLE documents DROP COLUMN IF EXISTS type;

-- 2. Neue Spalten hinzufügen
ALTER TABLE documents 
ADD COLUMN document_type VARCHAR(50) NOT NULL DEFAULT 'Sonstiges',
ADD COLUMN reference_month DATE,
ADD COLUMN reference_year INT,
ADD COLUMN absence_id UUID REFERENCES absences(id) ON DELETE SET NULL;

-- 3. Check Constraint
ALTER TABLE documents
ADD CONSTRAINT valid_document_type 
CHECK (document_type IN (
  'Verdienstabrechnung', 
  'Jahressteuermeldung', 
  'Arbeitsvertrag', 
  'Nachtrag', 
  'Krankmeldung', 
  'Sonstiges'
));

-- 4. Index für schnellere Abfragen
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_user_type ON documents(user_id, document_type);
```

---

## Types.ts anpassen

```typescript
export type DocumentType = 
  | 'Verdienstabrechnung'
  | 'Jahressteuermeldung'
  | 'Arbeitsvertrag'
  | 'Nachtrag'
  | 'Krankmeldung'
  | 'Sonstiges';

export interface Document {
  id: string;
  userId: string;
  name: string;
  documentType: DocumentType;
  referenceMonth?: string;  // ISO Date string
  referenceYear?: number;
  absenceId?: string;       // Verknüpfung mit Krankmeldung
  uploadDate: string;
  url: string;
}
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `types.ts` | DocumentType, Document Interface anpassen |
| `views/Documents.tsx` | Komplett neu strukturieren mit Tabs |
| `views/AbsenceManagement.tsx` | Hinweis bei Krankheit + Link zu Dokumenten |

---

## UI-Mockup: Mitarbeiter-Ansicht

```
┌─────────────────────────────────────────────────────────────────┐
│ MEINE DOKUMENTE                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [Verdienstabrechnungen] [Steuermeldungen] [Verträge]           │
│ [Krankmeldungen] [Sonstiges]                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Tab: Verdienstabrechnungen                    [+ Hochladen]     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ 📄 März 2026                                             │    │
│ │    Verdienstabrechnung_2026_03.pdf         [⬇️ Download] │    │
│ ├─────────────────────────────────────────────────────────┤    │
│ │ 📄 Februar 2026                                          │    │
│ │    Verdienstabrechnung_2026_02.pdf         [⬇️ Download] │    │
│ ├─────────────────────────────────────────────────────────┤    │
│ │ 📄 Januar 2026                                           │    │
│ │    Verdienstabrechnung_2026_01.pdf         [⬇️ Download] │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## UI-Mockup: Admin-Ansicht (CEO)

```
┌─────────────────────────────────────────────────────────────────┐
│ DOKUMENTENVERWALTUNG                                            │
├─────────────────────────────────────────────────────────────────┤
│ Mitarbeiter: [▼ Fabian Kempchen        ]    [+ Hochladen]      │
├─────────────────────────────────────────────────────────────────┤
│ [Verdienstabrechnungen] [Steuermeldungen] [Verträge]           │
│ [Krankmeldungen] [Sonstiges]                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Tab: Verdienstabrechnungen                                      │
│ ... (gleiche Struktur wie Mitarbeiter-Ansicht)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## UI-Mockup: Upload-Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│ DOKUMENT HOCHLADEN                                    [X]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Dokumententyp:  [▼ Verdienstabrechnung    ]                    │
│                                                                 │
│ Monat:          [▼ März 2026              ]  (bei Verdienst.)  │
│                                                                 │
│ Jahr:           [▼ 2025                   ]  (bei Steuermeld.) │
│                                                                 │
│ Verknüpfte Abwesenheit: [▼ Keine          ]  (bei Krankmeld.) │
│                                                                 │
│ Datei:          [📎 Datei auswählen...]                        │
│                 Verdienstabrechnung_2026_03.pdf                 │
│                                                                 │
│                              [Abbrechen]  [Hochladen]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sicherheit (RLS)

```sql
-- User sieht nur eigene Dokumente
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

-- CEO sieht alle Dokumente
CREATE POLICY "CEO can view all documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'CEO'
    )
  );

-- User kann eigene Dokumente hochladen
CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CEO kann für alle hochladen
CREATE POLICY "CEO can insert any documents" ON documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'CEO'
    )
  );

-- User kann eigene Dokumente löschen
CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- CEO kann alle löschen
CREATE POLICY "CEO can delete any documents" ON documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'CEO'
    )
  );
```

---

## Storage-Bucket Struktur

Empfohlene Ordnerstruktur im `documents` Bucket:

```
documents/
├── {user_id}/
│   ├── verdienstabrechnungen/
│   │   ├── 2026-03_Verdienstabrechnung.pdf
│   │   └── 2026-02_Verdienstabrechnung.pdf
│   ├── steuermeldungen/
│   │   └── 2025_Jahressteuermeldung.pdf
│   ├── vertraege/
│   │   ├── Arbeitsvertrag.pdf
│   │   └── Nachtrag_2025-06.pdf
│   ├── krankmeldungen/
│   │   └── 2026-03-01_Krankmeldung.pdf
│   └── sonstiges/
│       └── Bescheinigung.pdf
```

---

## Security Checklist vor Deployment

```
□ Datenbank-Migration ausgeführt (neue Spalten)?
□ Check Constraint für document_type aktiv?
□ Types.ts aktualisiert (DocumentType, Document)?
□ RLS-Policy: User sieht nur eigene Dokumente?
□ RLS-Policy: CEO sieht alle Dokumente?
□ RLS-Policy: CEO kann für alle hochladen?
□ Storage-Policies aktualisiert?
□ Signed-URLs max 1 Stunde gültig?
□ Console.logs entfernt?
```

---

## Geschätzter Aufwand

~3-4 Stunden

---

## Abnahmekriterien

- [ ] 6 Dokumententypen verfügbar (Dropdown beim Upload)
- [ ] Tabs für jeden Dokumententyp
- [ ] Verdienstabrechnungen nach Monat sortiert
- [ ] Jahressteuermeldungen nach Jahr sortiert
- [ ] Krankmeldung kann mit Abwesenheit verknüpft werden
- [ ] Bei Krankheits-Abwesenheit erscheint Hinweis zum Hochladen
- [ ] Admin (CEO) kann Mitarbeiter auswählen
- [ ] Admin (CEO) kann für jeden Mitarbeiter hochladen
- [ ] User sieht nur eigene Dokumente
- [ ] Design entspricht Corporate Design
