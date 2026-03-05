# REDEFINE HR Suite - Projekt-Zusammenfassung

## Projekt-Übersicht

| Key | Value |
|-----|-------|
| App | REDEFINE HR Management Suite (React/TypeScript/Vite) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Hosting | Vercel |
| Live URL | https://redefine-hr-suite-v2.vercel.app |
| GitHub | MichH2025/redefine-hr-suite-v2 |
| Supabase Projekt-ID | ykdkepnjybawbnknrjkv |
| Supabase URL | https://ykdkepnjybawbnknrjkv.supabase.co |

---

## Corporate Design

| Element | Wert |
|---------|------|
| Primärfarbe | #A86E3A (Goldbraun) |
| Sekundärfarbe | #000000 (Schwarz) |
| Font | Titillium Web |
| Buttons | rounded-sm |
| Icons | Lucide Icons |
| Framework | Tailwind CSS |

---

## User-Rollen

| Rolle | Rechte |
|-------|--------|
| CEO | Alle Rechte, finale Freigabe, alle Dokumente sehen/hochladen |
| TEAM_LEAD | Erste Freigabe, Team-Übersicht |
| EMPLOYEE | Eigene Anträge, eigene Dokumente |

---

## Aktive User

| Name | Email | Rolle |
|------|-------|-------|
| Michael Hülsbusch | huelsbusch@redefine.group | CEO |
| Fabian Kempchen | kempchen@redefine.group | TEAM_LEAD |
| Maxence Gauthier | gauthier@redefine.group | EMPLOYEE |
| Christian Freiberger | freiberger@redefine.group | EMPLOYEE |
| Markus Schön | schoen@redefine.group | EMPLOYEE |
| Benita Kopetzki | kopetzki@redefine.group | EMPLOYEE |
| Josephine Osuoha | osuoha@redefine.group | EMPLOYEE |
| Felix-Sebastian Cordesius | cordesius@redefine.group | EMPLOYEE |
| Christian Rothenburger | rothenburger@redefine.group | EMPLOYEE |
| Jakob Webb | webb@redefine.group | EMPLOYEE |

---

## Datenbank-Tabellen

| Tabelle | Beschreibung |
|---------|--------------|
| profiles | User-Profile (Name, Rolle, Urlaubstage) |
| absences | Abwesenheitsanträge (Urlaub, Krankheit, etc.) |
| time_entries | Zeiterfassung |
| documents | Dokumentenablage |

---

## Freigabe-Workflow

```
Mitarbeiter stellt Antrag
        ↓
Status: "Wartet auf Teamleiter"
        ↓
Teamleiter genehmigt
        ↓
Status: "Wartet auf CEO"
        ↓
CEO genehmigt
        ↓
Status: "Freigegeben"
```

---

## Dev-Workflow

1. Code in VS Code bearbeiten
2. `git add .`
3. `git commit -m "Beschreibung"`
4. `git push origin main`
5. **Security Checklist prüfen**
6. Vercel deployed automatisch

---

## Wichtige Links

| Beschreibung | URL |
|--------------|-----|
| Live App | https://redefine-hr-suite-v2.vercel.app |
| GitHub Repo | https://github.com/MichH2025/redefine-hr-suite-v2 |
| Supabase Dashboard | https://supabase.com/dashboard/project/ykdkepnjybawbnknrjkv |
| Supabase SQL Editor | https://supabase.com/dashboard/project/ykdkepnjybawbnknrjkv/sql/new |
| Supabase Auth/Users | https://supabase.com/dashboard/project/ykdkepnjybawbnknrjkv/auth/users |
| Supabase Storage | https://supabase.com/dashboard/project/ykdkepnjybawbnknrjkv/storage/buckets |
| Vercel Dashboard | https://vercel.com/michaels-projects-3574b4e2/redefine-hr-suite-v2 |

---

## 🔒 OWASP Security Checklist - Vor jedem Deployment

```
□ A01 - Zugriffskontrolle
  - RLS-Policies auf neuen/geänderten Tabellen aktiv?
  - Rollen-Checks serverseitig (nicht nur Frontend)?

□ A02 - Kryptografie
  - Signed-URLs max 1 Stunde gültig?
  - Keine Secrets im Code/Frontend?

□ A03 - Injection
  - User-Input validiert?
  - CSV-Export escaped?

□ A04 - Design
  - Server-seitige Validierung vorhanden?
  - CHECK Constraints auf DB-Ebene?

□ A05 - Konfiguration
  - .env in .gitignore?
  - Console.logs entfernt/reduziert?
  - CSP-Header gesetzt?

□ A07 - Authentifizierung
  - Session-Timeout aktiv?
  - Generische Fehlermeldungen bei Login?

□ A08 - Integrität
  - SRI-Hashes für CDN-Skripte?
  - Git-basiertes Deployment?

□ A09 - Logging
  - Kritische Aktionen im Audit-Log?
  - Error-Tracking aktiv?
```

---

## Offene Sicherheits-Aufgaben

| Priorität | Aufgabe |
|-----------|---------|
| KRITISCH | RLS-Policies auf allen Tabellen aktivieren |
| HOCH | Audit-Log-Tabelle implementieren |
| HOCH | Security Headers in Vercel konfigurieren |
| MITTEL | Signed-URL Gültigkeit auf 1 Stunde reduzieren |
| MITTEL | Session-Timeout nach 30 Min Inaktivität |
| MITTEL | SRI-Hashes für CDN-Skripte |
| NIEDRIG | CSV-Export escapen |
| NIEDRIG | Optimistic Locking bei Genehmigungen |

---

## Briefing-Dateien

| Datei | Beschreibung | Aufwand |
|-------|--------------|---------|
| BRIEFING-01-ZEITERFASSUNG.md | Zeiteinträge bearbeiten/löschen | ~1h |
| BRIEFING-02-URLAUBSVERWALTUNG.md | Übersicht & Planungsfunktion | ~2-3h |
| BRIEFING-03-DOKUMENTENABLAGE.md | Komplette Überarbeitung | ~3-4h |
