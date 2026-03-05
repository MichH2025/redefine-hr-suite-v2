# REDEFINE HR Management Suite - Projektdokumentation

**Projekt:** REDEFINE HR Management Suite
**Version:** 1.0.0
**Organisation:** REDEFINE Asset Management GmbH
**Sprache:** Deutsch (de-DE)
**Status:** Produktiv
**Live-URL:** https://redefine-hr-suite-v2.vercel.app

---

## Inhaltsverzeichnis

1. [Projektbeschreibung](#1-projektbeschreibung)
2. [Technologie-Stack](#2-technologie-stack)
3. [Projektstruktur](#3-projektstruktur)
4. [Architektur](#4-architektur)
5. [Features & Module](#5-features--module)
6. [Responsive Design & Mobile](#6-responsive-design--mobile)
7. [Datenmodell](#7-datenmodell)
8. [Authentifizierung & Zugriffskontrolle](#8-authentifizierung--zugriffskontrolle)
9. [Konfiguration](#9-konfiguration)
10. [Styling & Design-System](#10-styling--design-system)
11. [Installation & Entwicklung](#11-installation--entwicklung)
12. [Build & Deployment](#12-build--deployment)
13. [Sicherheit](#13-sicherheit)
14. [Testing](#14-testing)
15. [Erweiterungsmoglichkeiten](#15-erweiterungsmoglichkeiten)

---

## 1. Projektbeschreibung

Die REDEFINE HR Management Suite ist eine webbasierte Single-Page-Application (SPA) fur die interne Personalverwaltung der REDEFINE Asset Management GmbH. Die Anwendung ermoglicht die Verwaltung von Abwesenheiten, Zeiterfassung, Dokumentenarchivierung und bietet ein rollenbasiertes Genehmigungssystem.

Die App ist vollstandig responsive und fur iPhone-Nutzung (Safari/Chrome) optimiert.

### Kernfunktionen

- **Rollenbasierte Authentifizierung** mit drei Benutzerrollen (CEO, Team Lead, Employee)
- **Abwesenheitsmanagement** mit zweistufigem Genehmigungsworkflow
- **Manuelle Zeiterfassung** mit Beginn/Ende/Pause und CSV-Export
- **Team-Kalender** mit Monats- und Wochenansicht (Gantt-Chart)
- **Dashboard** mit Abwesenheitsfilter und Mitarbeitersuche
- **Dokumentenarchiv** fur Lohnabrechnungen, Vertrage und sonstige Dokumente
- **Admin-Panel** fur Genehmigungen und Teamubersicht
- **Responsive Design** mit dediziertem Mobile-Layout (Bottom-Tab-Navigation)

---

## 2. Technologie-Stack

### Frontend

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| React | 19.2.3 | UI-Framework |
| TypeScript | 5.8.2 | Typsichere Entwicklung |
| React Router | 7.11.0 | Client-seitiges Routing (HashRouter) |
| Vite | 6.2.0 | Build-Tool & Dev-Server |
| Tailwind CSS | CDN | Styling-Framework |
| Lucide React | 0.562.0 | Icon-Bibliothek |

### Backend & Daten

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| Supabase | JS SDK 2.90.1 | Backend-as-a-Service |
| PostgreSQL | (via Supabase) | Datenbank |
| Supabase Auth | - | Authentifizierung |
| Supabase Storage | - | Dateispeicherung |

### Hosting & Deployment

| Technologie | Verwendung |
|-------------|------------|
| Vercel | Hosting & CD-Pipeline |
| npm | Paketmanager |
| ES Modules | Modulsystem |

---

## 3. Projektstruktur

```
redefine-hr-suite-v2/
|
|-- App.tsx                          # Haupt-Anwendungskomponente (Routing, Auth)
|-- index.tsx                        # React DOM Entry-Point
|-- index.html                       # HTML-Template (Tailwind, Fonts, Meta-Tags)
|-- types.ts                         # TypeScript Typdefinitionen & Enums
|-- constants.tsx                     # Konstanten (Farben, Icons)
|-- metadata.json                    # App-Metadaten
|
|-- package.json                     # Abhangigkeiten & Build-Skripte
|-- tsconfig.json                    # TypeScript-Konfiguration
|-- vite.config.ts                   # Vite Build-Konfiguration
|-- .env.example                     # Umgebungsvariablen-Vorlage
|-- .gitignore                       # Git-Ausschlussregeln
|-- README.md                        # Einrichtung & Deployment
|-- PROJEKTDOKUMENTATION.md          # Diese Datei
|
|-- components/
|   |-- Layout.tsx                   # Desktop Sidebar-Layout & Navigation
|   |-- MobileLayout.tsx             # Mobile Layout mit Bottom-Tab-Navigation
|   +-- ResponsiveShell.tsx          # Responsive Wrapper (Mobile vs. Desktop)
|
|-- hooks/
|   +-- useMediaQuery.ts             # Responsive Media-Query Hook
|
|-- services/
|   |-- supabaseClient.ts           # Supabase-Client Initialisierung
|   |-- holidayService.ts           # Feiertags- & Arbeitstageberechnung (Berlin)
|   +-- reportService.ts            # CSV-Export-Funktionalitat
|
|-- views/
|   |-- Dashboard.tsx                # Dashboard mit Filter & Mitarbeitersuche
|   |-- AbsenceManagement.tsx        # Abwesenheitsverwaltung
|   |-- TimeTracking.tsx             # Manuelle Zeiterfassung
|   |-- TeamCalendar.tsx             # Team-Kalender (Monats- & Wochenansicht)
|   |-- Documents.tsx                # Dokumentenarchiv
|   +-- AdminReview.tsx              # Genehmigungs-Interface
|
|-- supabase/
|   +-- migrations/
|       +-- 001_enable_rls.sql       # Row-Level Security Policies
|
+-- docs/
    |-- MOBILE_SPEC.md               # Mobile Redesign Spezifikation
    +-- prototypes/
        +-- team-calendar.jsx        # UI-Prototyp Team-Kalender
```

---

## 4. Architektur

### Architekturmuster

Die Anwendung folgt einer **komponentenbasierten Architektur** mit klarer Trennung:

- **Views** (Seiten): Zustandsverwaltung und Datenanfragen pro Seite
- **Components** (Wiederverwendbar): Layout und UI-Elemente
- **Services** (Geschaftslogik): Datenbankzugriff, Berechnungen, Exporte
- **Hooks** (Wiederverwendbare Logik): Media Queries, etc.

### Responsive Shell Pattern

Die App verwendet ein `ResponsiveShell`-Pattern, das basierend auf der Bildschirmbreite automatisch das passende Layout rendert:

```
ResponsiveShell.tsx
  |
  |-- < 768px:  MobileLayout.tsx   (Bottom-Tab-Navigation, Safe Areas)
  +-- >= 768px: Layout.tsx         (Desktop Sidebar-Navigation)
```

Die Erkennung erfolgt uber den `useMediaQuery('(max-width: 767px)')` Hook.

### State Management

```
App.tsx (Root State)
  |-- session              Supabase Auth Session
  |-- currentUser          Angemeldetes Benutzerprofil
  |-- allUsers             Alle Teammitglieder (nur CEO/Team Lead)
  |-- loading              Auth-Initialisierungsstatus
  |
  |---> ResponsiveShell    Empfangt: user, onLogout
  |       |---> MobileLayout.tsx  ODER  Layout.tsx
  |
  |---> Dashboard.tsx      Empfangt: user
  |---> AbsenceManagement  Empfangt: user
  |---> TimeTracking       Empfangt: user
  |---> TeamCalendar       Empfangt: user
  |---> Documents          Empfangt: user, allUsers
  +---> AdminReview        Empfangt: user
```

- State wird mit React Hooks (`useState`, `useEffect`, `useMemo`) verwaltet
- Supabase Auth State Listener fur Echtzeit-Sitzungsverwaltung
- Top-Down-Datenfluss von `App.tsx` zu den Kindkomponenten

### Routing

- **React Router v7** mit `HashRouter` (kein serverseitiges Routing erforderlich)
- Geschutzte Routen basierend auf Benutzerrolle
- Navigation uber Sidebar (Desktop) oder Bottom-Tab-Navigation (Mobile)

| Pfad | Komponente | Zugriff |
|------|------------|---------|
| `/` | Dashboard | Alle authentifizierten Benutzer |
| `/absences` | AbsenceManagement | Alle authentifizierten Benutzer |
| `/calendar` | TeamCalendar | Alle authentifizierten Benutzer |
| `/time` | TimeTracking | Alle authentifizierten Benutzer |
| `/documents` | Documents | Alle authentifizierten Benutzer |
| `/admin` | AdminReview | Nur CEO und Team Lead |

---

## 5. Features & Module

### 5.1 Dashboard

**Datei:** `views/Dashboard.tsx`

- Anzeige der verbleibenden Urlaubstage (30 Tage Jahresbudget) mit Fortschrittsbalken
- Team-Prasenzstatus: Anwesenheitszahlung fur den aktuellen Tag
- Rollenanzeige des aktuellen Benutzers
- **Abwesenheitsfilter:** Filter-Chips nach Typ (Urlaub, Homeoffice, Krankheit, Sonderurlaub) mit Zahler-Badges
- **Mitarbeitersuche:** Textfeld zur Filterung nach Mitarbeiternamen (case-insensitive)
- Filter und Suche kombinierbar (via `useMemo`)
- Tabelle (Desktop) / Karten-Layout (Mobile) fur Teamabwesenheiten
- Kontextabhangige Leerzustandsmeldungen

### 5.2 Abwesenheitsmanagement

**Datei:** `views/AbsenceManagement.tsx`

#### Abwesenheitstypen

| Typ | Beschreibung |
|-----|--------------|
| Urlaub | Regularer Jahresurlaub |
| Sonderurlaub | Sonderurlaub bei besonderen Anlassen |
| Homeoffice | Arbeit von zu Hause |
| Krankheit | Krankheitsbedingter Ausfall |

#### Zweistufiger Genehmigungsworkflow

```
Antrag erstellt
    |
    v
PENDING_TEAM_LEAD ---> Team Lead pruft
    |                       |
    |                   REJECTED (Ende)
    v
PENDING_CEO ---------> CEO pruft
    |                       |
    |                   REJECTED (Ende)
    v
APPROVED (Ende)
```

**Sonderregeln:**
- CEO-Antrage werden automatisch genehmigt
- Team-Lead-Antrage gehen direkt zur CEO-Genehmigung
- Mitarbeiter-Antrage durchlaufen beide Stufen

#### Funktionen
- Dynamische Arbeitstageberechnung (exklusive Wochenenden und Berliner Feiertage)
- Echtzeit-Vorschau der beantragten Tage
- Statusfarbcodierung (Grun=Genehmigt, Rot=Abgelehnt, Orange=Wartet auf CEO, Blau=Wartet auf TL)
- Modales Formular (Mobile: Bottom-Sheet mit abgerundeten Ecken)

### 5.3 Zeiterfassung

**Datei:** `views/TimeTracking.tsx`

- **Manuelle Zeiteingabe** mit Datum, Startzeit, Endzeit und Pausenminuten
- Automatische Netto-Dauerberechnung: `(Ende - Start - Pause) / 60` Stunden
- Validierung: Ende muss nach Start liegen, Nettozeit muss positiv sein
- Formular wird nach erfolgreichem Speichern zuruckgesetzt
- Verlaufstabelle der letzten 20 Eintrage (Desktop: Tabelle, Mobile: Karten)
- CSV-Export mit deutschem Datumsformat
- Datenfelder: Datum, Startzeit, Endzeit, Dauer (Stunden)

### 5.4 Team-Kalender

**Datei:** `views/TeamCalendar.tsx`

#### Monatsansicht
- Kalender-Grid mit 7 Spalten (Mo-So), Montag als erste Spalte
- Jede Zelle zeigt Tageszahl + Anzahl abwesender Mitarbeiter
- Farbcodierung: grau (1 abwesend), goldbraun (2-3), rot (4+)
- Wochenenden: reduzierte Opazitat
- Feiertage: orange Markierung
- Heute: hervorgehobener Hintergrund
- Tap auf Tag offnet Detail-Bottom-Sheet mit allen Abwesenheiten
- Monatsstatistiken: Arbeitstage, Abwesenheits-Tage, betroffene MA
- Feiertagsliste des Monats

#### Wochenansicht (Gantt-Chart)
- X-Achse: KW + 7 Tagesspalten (Mo-So)
- Y-Achse: Abwesende Mitarbeiter der Woche
- Farbige Balken pro Abwesenheitstyp, durchgehend verbunden
- Typ-spezifische Farben (Urlaub=Braun, Homeoffice=Grun, Krankheit=Rot, Sonderurlaub=Blau)

#### Mitarbeiter-Filter
- Chip-Buttons pro Mitarbeiter
- Aktiv/Inaktiv-Toggle mit visueller Hervorhebung
- "Alle zeigen" Reset-Button
- Legende fur Abwesenheitstypen

#### Datenanbindung
- Ladt genehmigte Abwesenheiten aus Supabase mit Profil-Join
- Berliner Feiertagsberechnung via `holidayService.ts`

### 5.5 Dokumentenarchiv

**Datei:** `views/Documents.tsx`

#### Dokumenttypen

| Typ | Automatische Erkennung |
|-----|------------------------|
| Lohnabrechnung | Dateiname enthalt "lohn" |
| Vertrag | Dateiname enthalt "vertrag" |
| Sonstiges | Alle anderen Dateien |

#### Unterstutzte Dateiformate
PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG

#### Zugriffskontrolle
- **Mitarbeiter:** Sehen nur eigene Dokumente
- **CEO:** Sieht Dokumente aller Benutzer, kann fur beliebige MA hochladen
- Upload in Supabase Storage mit eindeutigem Pfad: `{userId}/{timestamp}_{filename}`
- Downloads uber signierte URLs (1 Jahr Gultigkeit)

### 5.6 Admin-Panel (Genehmigungen)

**Datei:** `views/AdminReview.tsx`

- Zuganglich nur fur CEO und Team Lead
- Anzeige aller ausstehenden Antrage
- Genehmigen/Ablehnen mit einem Klick
- Statusfluss-Durchsetzung (Team Lead -> CEO)
- Zahler fur offene Antrage

---

## 6. Responsive Design & Mobile

### Breakpoint-Strategie

```
Mobile:  < 768px  → MobileLayout (Bottom-Tab-Navigation, Safe Areas)
Desktop: >= 768px → Layout (Sidebar-Navigation)
```

### Mobile Layout (`components/MobileLayout.tsx`)

```
+--------------------------+
| ░░ SAFE AREA TOP ░░░░░░ |  ← Notch/Dynamic Island, keine Buttons
| Header (sticky)          |  ← Brand + Live-Status, UNTER Safe Area
|--------------------------|
|                          |
|  Content (scrollbar)     |  ← View-spezifischer Inhalt
|                          |
|--------------------------|
| Bottom Nav (fixed)       |  ← 5 Tabs mit Blur-Backdrop
| ░░ SAFE AREA BOTTOM ░░░ |  ← Home Indicator Padding
+--------------------------+
```

- **Sticky Header** mit `paddingTop: env(safe-area-inset-top)` und Backdrop-Blur
- **Bottom Navigation** mit 5 Tabs: Dashboard, Abwesenheiten, Kalender, Zeit, Dokumente
- Admin-Tab nur fur CEO/Team Lead sichtbar
- Aktiver Tab: Brand-Farbe, fetter Stroke
- Inaktiv: Gedampfte Farbe, dunner Stroke

### iPhone-Kompatibilitat

| Feature | Implementierung |
|---------|-----------------|
| Viewport | `width=device-width, initial-scale=1, viewport-fit=cover` |
| Safe Area Top | `paddingTop: env(safe-area-inset-top, 20px)` im Header |
| Safe Area Bottom | `paddingBottom: env(safe-area-inset-bottom, 8px)` in Bottom Nav |
| Touch Targets | Minimum 44x44px fur alle interaktiven Elemente |
| Status Bar | `apple-mobile-web-app-status-bar-style: default` |
| Theme Color | `#FDFBF9` (Haupthintergrund) |
| Scrollbar | Versteckt auf Mobile, Brand-gestylt auf Desktop |
| Horizontal Scroll | `overflow-x: hidden` auf `html` und `body` |
| Tap Highlight | `webkit-tap-highlight-color: transparent` |

### Responsive Patterns in Views

Alle Views verwenden Tailwind `md:` Breakpoint fur Desktop-Overrides:

| Pattern | Mobile (< 768px) | Desktop (>= 768px) |
|---------|-------------------|---------------------|
| Tabellen | Karten-Layout (`md:hidden` / `hidden md:block`) | Standard-Tabelle |
| Modals | Bottom-Sheet (`items-end`, `rounded-t-2xl`) | Zentriertes Modal |
| Headers | Vertikal gestapelt, volle Breite | Horizontal, kompakt |
| Buttons | Volle Breite, grossere Touch-Targets | Standard-Grosse |
| Formulare | Einspaltiges Layout | Mehrspaltige Grid-Layouts |

### Detaillierte Spezifikation

Die vollstandige Mobile-Redesign-Spezifikation befindet sich in `docs/MOBILE_SPEC.md`.

---

## 7. Datenmodell

### Datenbanktabellen (Supabase/PostgreSQL)

#### profiles

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primarschlussel (aus Auth) |
| full_name | TEXT | Vollstandiger Name |
| email | TEXT | E-Mail-Adresse |
| role | ENUM | EMPLOYEE, TEAM_LEAD, CEO |
| remaining_vacation_days | INTEGER | Verbleibende Urlaubstage (Standard: 30) |

#### absences

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primarschlussel |
| user_id | UUID | Fremdschlussel -> profiles.id |
| type | TEXT | Urlaub, Sonderurlaub, Homeoffice, Krankheit |
| start_date | DATE | Startdatum |
| end_date | DATE | Enddatum |
| status | TEXT | Wartet auf Teamleiter, Wartet auf CEO, Freigegeben, Abgelehnt |
| days | INTEGER | Berechnete Arbeitstage |
| created_at | TIMESTAMP | Erstellungszeitpunkt |

#### time_entries

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primarschlussel |
| user_id | UUID | Fremdschlussel -> profiles.id |
| date | DATE | Arbeitsdatum |
| start_time | TEXT | Startzeit (HH:MM) |
| end_time | TEXT | Endzeit (HH:MM) |
| duration | DECIMAL | Netto-Dauer in Stunden |

#### documents

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primarschlussel |
| user_id | UUID | Fremdschlussel -> profiles.id |
| name | TEXT | Originaler Dateiname |
| type | TEXT | Lohnabrechnung, Vertrag, Sonstiges |
| upload_date | DATE | Upload-Datum |
| url | TEXT | Signierte Supabase Storage URL |

### TypeScript-Typdefinitionen

Die vollstandigen Typdefinitionen befinden sich in `types.ts`:

```typescript
enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  TEAM_LEAD = 'TEAM_LEAD',
  CEO = 'CEO'
}

enum AbsenceType {
  VACATION = 'Urlaub',
  SPECIAL_LEAVE = 'Sonderurlaub',
  HOME_OFFICE = 'Homeoffice',
  SICK_LEAVE = 'Krankheit'
}

enum AbsenceStatus {
  PENDING_TEAM_LEAD = 'Wartet auf Teamleiter',
  PENDING_CEO = 'Wartet auf CEO',
  APPROVED = 'Freigegeben',
  REJECTED = 'Abgelehnt'
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  remainingVacationDays: number;
}

interface AbsenceRequest {
  id: string;
  userId: string;
  userName: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  status: AbsenceStatus;
  createdAt: string;
  days: number;
}

interface TimeEntry {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in Stunden
}

interface Document {
  id: string;
  userId: string;
  name: string;
  type: 'Lohnabrechnung' | 'Vertrag' | 'Sonstiges';
  uploadDate: string;
  url: string;
}
```

---

## 8. Authentifizierung & Zugriffskontrolle

### Authentifizierungsmethode

- **Typ:** E-Mail + Passwort uber Supabase Auth
- **Sitzungsverwaltung:** Browser-Session uber Supabase SDK

### Authentifizierungsablauf

1. Benutzer gibt E-Mail und Passwort auf der Login-Seite ein
2. `signInWithPassword()` wird aufgerufen
3. Echtzeit-Auth-State-Listener lost Profil-Abruf aus
4. Benutzerobjekt wird im React State gespeichert
5. Geschutzte Routen werden basierend auf der Rolle gerendert

### Rollenbasierte Zugriffskontrolle (RBAC)

| Funktion | Employee | Team Lead | CEO |
|----------|----------|-----------|-----|
| Dashboard | Ja | Ja | Ja |
| Eigene Abwesenheiten | Ja | Ja | Ja |
| Team-Kalender | Ja | Ja | Ja |
| Zeiterfassung | Ja | Ja | Ja |
| Eigene Dokumente | Ja | Ja | Ja |
| Alle Dokumente sehen | Nein | Nein | Ja |
| Dokumente hochladen (fur andere) | Nein | Nein | Ja |
| Admin-Panel | Nein | Ja | Ja |
| Team-Lead-Genehmigung | Nein | Ja | Nein |
| CEO-Genehmigung | Nein | Nein | Ja |

### Sitzungspersistenz

- Supabase verwaltet Session-Cookies
- Auth-Prufung bei App-Initialisierung
- Automatische Re-Authentifizierung bei Seitenaktualisierung
- Profil-Retry-Logik mit 1,5 Sekunden Verzogerung

---

## 9. Konfiguration

### Umgebungsvariablen

| Variable | Erforderlich | Beschreibung |
|----------|-------------|--------------|
| `VITE_SUPABASE_URL` | Ja | Supabase-Projekt-URL |
| `VITE_SUPABASE_ANON_KEY` | Ja | Supabase Anonymous Key |
| `GEMINI_API_KEY` | Nein | Fur zukunftige KI-Features |

### Konfigurationsdateien

| Datei | Zweck |
|-------|-------|
| `package.json` | Abhangigkeiten und Build-Skripte |
| `vite.config.ts` | Vite Build-Konfiguration (Port 3000, Pfad-Aliase, Env-Vars) |
| `tsconfig.json` | TypeScript-Compiler-Optionen (ES2022, `@`-Alias) |
| `index.html` | HTML-Template mit Tailwind CDN, Google Fonts, Meta-Tags, Safe Areas |
| `.env.example` | Vorlage fur Supabase-Zugangsdaten |
| `.gitignore` | Ausschluss von node_modules, .env, dist, .vercel |

### Build-Skripte

```bash
npm run dev       # Startet Vite Dev-Server (localhost:3000)
npm run build     # Erstellt Production-Bundle in /dist
npm run preview   # Vorschau des Production-Builds
```

---

## 10. Styling & Design-System

### Markenfarben

| Farbe | Hex-Code | CSS-Token | Verwendung |
|-------|----------|-----------|------------|
| Brand | `#A86E3A` | `brand` | Primarfarbe (Goldbraun) |
| Brand Dark | `#8F5D30` | `brand-dark` | Hover, Sekundar |
| Brand Darkest | `#4A311A` | `brand-darkest` | Headlines, Dark-Akzente |
| Brand Light | `#C1936B` | `brand-light` | Helle Variante |
| Brand Soft | `#F7F3F0` | `brand-soft` | Hintergrund, Cards |
| Background | `#FDFBF9` | - | Haupthintergrund |
| Border | `#E8DDD4` | - | Rahmen, Trennlinien |

### Abwesenheitstyp-Farben

| Typ | Farbe | Hintergrund |
|-----|-------|-------------|
| Urlaub | `#A86E3A` | `#F7F3F0` |
| Homeoffice | `#5B8C5A` | `#F0F5F0` |
| Krankheit | `#C04040` | `#FDF2F2` |
| Sonderurlaub | `#4A7FB5` | `#F0F4FA` |
| Feiertag | `#C07030` | `#FFF8F0` |

### Typografie

- **Schriftart:** Titillium Web (Google Fonts)
- **Schriftstarken:** 300 (Light), 400 (Regular), 600 (SemiBold), 700 (Bold)
- **Labels/Badges:** uppercase, letter-spacing 1-2.5px, font-size 9-11px
- **Headlines:** 18-22px, font-weight 700
- **Body:** 13-14px, font-weight 400-600

### Benutzerdefinierte CSS-Klassen

| Klasse | Beschreibung |
|--------|--------------|
| `.premium-shadow` | Box-Shadow mit Markenfarbe `rgba(168, 110, 58, 0.15)` |
| `.animate-fadeIn` | Einblendungsanimation (Opacity + TranslateY) |
| Scrollbar (Desktop) | 6px Breite, Brand-Farbe auf Brand-Soft Track |
| Scrollbar (Mobile) | Vollstandig versteckt |

### Icon-System

Verwendete Lucide React Icons (definiert in `constants.tsx`):
`LayoutDashboard`, `Calendar`, `Clock`, `FileText`, `ShieldCheck`, `LogOut`, `User`, `ChevronRight`, `Plus`, `CheckCircle2`, `XCircle`, `Download`, `Timer`, `X`, `Users`

---

## 11. Installation & Entwicklung

### Voraussetzungen

- Node.js (aktuelle LTS-Version empfohlen)
- npm (wird mit Node.js installiert)
- Supabase-Projekt mit eingerichteten Tabellen

### Lokale Einrichtung

```bash
# 1. Repository klonen
git clone <repository-url>
cd redefine-hr-suite-v2

# 2. Abhangigkeiten installieren
npm install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env.local
# .env.local bearbeiten und Supabase-Zugangsdaten eintragen:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# 4. Entwicklungsserver starten
npm run dev
# Verfugbar unter http://localhost:3000
```

### Supabase-Einrichtung

1. Neues Supabase-Projekt erstellen unter [supabase.com](https://supabase.com)
2. Folgende Tabellen anlegen: `profiles`, `absences`, `time_entries`, `documents`
3. Row-Level Security (RLS) Policies konfigurieren
4. Storage Bucket `documents` erstellen
5. Projekt-URL und Anon Key in `.env.local` eintragen

### Bekannte Hinweise

- `services/supabaseClient.ts` zeigt TypeScript-Fehler zu `import.meta.env` – diese sind harmlos und treten nur auf, weil die Vite-Typdeklarationen fehlen. Der Build funktioniert trotzdem korrekt.

---

## 12. Build & Deployment

### Production Build

```bash
npm run build
# Erstellt optimiertes Bundle im /dist Verzeichnis
# Output: ~480 KB JS (138 KB gzip)
```

### Aktuelle Deployment-Konfiguration

**Plattform:** Vercel
**Projekt:** `redefine-hr-suite-v2`
**Live-URL:** https://redefine-hr-suite-v2.vercel.app
**Account:** `michaels-projects-3574b4e2`

#### Deployment-Prozess

```bash
# Deployment via Vercel CLI (bereits eingerichtet)
npx vercel deploy --prod --yes

# Alternativ: Vercel baut automatisch bei Push auf main-Branch
```

Vercel liest die Umgebungsvariablen (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) aus den Vercel Project Settings und injiziert sie zur Build-Zeit.

#### Wichtig: Daten bei Deployment

Alle Daten (Abwesenheiten, Zeiteintrge, Dokumente, Benutzerprofile) liegen in Supabase (Cloud). Ein Frontend-Deployment aktualisiert **nur** die Benutzeroberflache – die Datenbank wird nicht beruhrt. Alle Daten bleiben bei jedem Deployment vollstandig erhalten.

### Alternative Deployment-Optionen

#### Statischer Host (Netlify, GitHub Pages)

- `/dist`-Ordner deployen
- HashRouter ist bereits konfiguriert (kein Server-Routing notig)
- Umgebungsvariablen in der Build-Umgebung setzen

#### Docker

```dockerfile
FROM node:lts-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
# /app/dist mit nginx oder ahnlichem ausliefern
```

### Deployment-Checkliste

- [x] Supabase-Projekt mit Tabellen erstellt
- [x] Umgebungsvariablen konfiguriert
- [x] Vercel-Projekt verknupft
- [x] Production-Deployment erfolgreich
- [x] SSL/HTTPS verifiziert (via Vercel)
- [x] Benutzerkonten mit korrekten Rollen erstellt
- [x] Document Storage Bucket konfiguriert
- [x] RLS-Policies implementieren (siehe `supabase/migrations/001_enable_rls.sql`)
- [ ] Custom Domain konfigurieren (optional)
- [ ] Backup-Strategie definieren

---

## 13. Sicherheit

### Implementierte Sicherheitsmassnahmen

- E-Mail/Passwort-Authentifizierung uber Supabase
- Rollenbasierte Zugriffskontrolle (RBAC)
- **Row-Level Security (RLS)** auf allen Tabellen und Storage (`supabase/migrations/001_enable_rls.sql`)
  - Helper-Funktion `get_my_role()` (SECURITY DEFINER)
  - profiles: Alle authentifizierten User lesen, kein Update/Insert/Delete vom Client
  - absences: Eigene + freigegebene sichtbar, Manager sehen alles, Workflow-Enforcement bei UPDATE
  - time_entries: Nur eigene Eintrage
  - documents: Eigene + CEO sieht alle
  - Storage: Ordnerbasierte Zugriffskontrolle + CEO-Override
- Signierte URLs fur Dokument-Downloads (1 Jahr Gultigkeit)
- Umgebungsvariablen fur sensible Konfiguration (.env.local, nicht in Git)
- HTTPS uber Vercel und Supabase

### Empfehlungen fur Verbesserungen

1. **Rate Limiting:** Anfragebegrenzung uber Supabase Edge Functions
2. **Session Timeout:** Explizite Sitzungszeitbegrenzung einfuhren (aktuell: 1 Woche via Supabase)
3. **Serverseitige Validierung:** Datei-Uploads serverseitig validieren (Typ, Grosse)
4. **Audit-Trail:** Aktivitatsprotokollierung fur Nachvollziehbarkeit
5. **Abhangigkeits-Updates:** Regelmassige Sicherheitsupdates der npm-Pakete
6. **Multi-Factor Authentication (MFA):** TOTP uber Supabase Auth aktivieren
7. **Content Security Policy (CSP):** HTTP-Header uber vercel.json setzen
8. **SRI-Hashes:** Integrity-Attribute fur CDN-Skripte (Tailwind, esm.sh)

---

## 14. Testing

### Aktueller Status

Derzeit ist keine Testinfrastruktur konfiguriert.

### Empfohlener Testing-Stack

| Typ | Werkzeug | Beschreibung |
|-----|----------|--------------|
| Unit Tests | Vitest | Schnelle Unit-Tests fur Logik und Services |
| Komponententests | React Testing Library | Testen von React-Komponenten |
| E2E Tests | Playwright | End-to-End Tests im Browser |

### Empfohlene Testabdeckung

- Feiertags- und Arbeitstageberechnung (`holidayService.ts`)
- Authentifizierungsablauf (Login/Logout)
- Genehmigungsworkflow-Statusubergange
- Datumsbereichsvalidierung
- Zeiterfassungs-Dauerberechnung (Netto = Ende - Start - Pause)
- CSV-Export-Formatierung
- Dokumenten-Upload/Download
- Rollenbasierte Zugriffskontrolle
- Responsive Layout-Wechsel (Mobile/Desktop)

---

## 15. Erweiterungsmoglichkeiten

| Feature | Beschreibung | Prioritat |
|---------|--------------|-----------|
| RLS-Policies | Serverseitige Zugriffskontrolle in Supabase | Hoch |
| Push-Benachrichtigungen | Alerts bei Antragsgenehmigungen via Service Worker | Mittel |
| Custom Domain | Eigene Domain statt vercel.app | Mittel |
| Erweiterte Berichte | Analytics-Dashboard mit Monats-/Jahresstatistiken | Mittel |
| KI-Integration | Gemini API ist vorbereitet (`GEMINI_API_KEY` in vite.config.ts) | Niedrig |
| Team-Chat | Integriertes Nachrichtensystem | Niedrig |
| Ausgabenverwaltung | Spesenerfassung und -erstattung | Niedrig |
| Integrationen | Slack, Microsoft Teams Webhooks | Niedrig |
| Massenoperationen | Batch-Uploads, Sammelgenehmigungen | Niedrig |
| Offline-Modus | Service Worker fur Offline-Fahigkeit | Niedrig |

---

## Fehlerbehandlung

### Muster

```typescript
// Standard-Pattern fur Supabase-Anfragen
const { data, error } = await supabase.from('table').select('*');
if (data) {
  // Daten verarbeiten und State aktualisieren
}

// Mit expliziter Fehlerbehandlung (z.B. bei Uploads)
try {
  const { data, error } = await supabase.storage.from('documents').upload(path, file);
  if (error) throw error;
  // Erfolgsfall
} catch (error: any) {
  alert("Fehler: " + error.message);
}
```

### Ladezustande

- `loading`-Boolean im State jeder View
- Ladeanzeige wahrend Datenabruf (uppercase, tracking-widest Text)
- Deaktivierte Buttons wahrend Formularubermittlung (`saving` State)
- Kontextabhangige Leerzustandsmeldungen (z.B. "Keine Urlaub-Eintrage vorhanden")

---

*Letzte Aktualisierung: 06. Februar 2026*
