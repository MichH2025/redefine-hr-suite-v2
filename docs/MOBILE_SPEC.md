# REDEFINE HR Suite – Mobile Redesign Spezifikation

**Version:** 1.0
**Datum:** 06.02.2026
**Ziel:** Responsive Mobile-First-Redesign der bestehenden HR Suite mit Fokus auf iPhone-Nutzung

---

## 1. Überblick

Die bestehende Desktop-SPA (Sidebar-Layout) wird zu einer responsive Mobile-First-App umgebaut. Die Desktop-Version bleibt funktional, aber die primäre Zielplattform ist iPhone (Safari/Chrome). Alle bestehenden Features bleiben erhalten, die Hauptänderung betrifft Layout, Navigation und den neuen Team-Kalender.

### Nicht-Ziele (out of scope)
- Native App / React Native (bleibt Web-App)
- Neue Backend-Features oder DB-Änderungen
- Neue Authentifizierungsmethoden

---

## 2. Design System (unverändert)

### Markenfarben
| Token | Hex | Verwendung |
|-------|-----|------------|
| `brand` | `#A86E3A` | Primärfarbe (Goldbraun) |
| `brand-dark` | `#8F5D30` | Sekundärtext, Hover |
| `brand-darkest` | `#4A311A` | Headlines, Dark-Akzente |
| `brand-light` | `#C1936B` | Helle Variante |
| `brand-soft` | `#F7F3F0` | Hintergrund, Cards |
| `bg-main` | `#FDFBF9` | Haupthintergrund |
| `border` | `#E8DDD4` | Rahmen, Trennlinien |
| `border-light` | `#F0EBE6` | Subtile Trennlinien |

### Zusätzliche Farben (Abwesenheitstypen)
| Typ | Farbe | Hintergrund |
|-----|-------|-------------|
| Urlaub | `#A86E3A` | `#F7F3F0` |
| Homeoffice | `#5B8C5A` | `#F0F5F0` |
| Krankheit | `#C04040` | `#FDF2F2` |
| Sonderurlaub | `#4A7FB5` | `#F0F4FA` |
| Feiertag | `#C07030` | `#FFF8F0` |

### Typografie
- **Font:** `'Titillium Web'` via Google Fonts
- **Weights:** 300, 400, 600, 700
- **Labels/Badges:** uppercase, letter-spacing 1–2.5px, font-size 9–11px
- **Headlines:** 18–22px, font-weight 700
- **Body:** 13–14px, font-weight 400–600

### Icons
- **Bibliothek:** Lucide React
- **Stil:** strokeWidth 1.5 (inaktiv), 2.2 (aktiv)
- **Größen:** 14–20px je nach Kontext

### Komponenten-Stil
- **Border-Radius:** `rounded-sm` (Buttons), 10–14px (Cards), 20px (Chips/Bottom-Sheet)
- **Shadows:** Sparsam, brand-getönt: `rgba(168,110,58,0.08–0.15)`
- **Animationen:** `slideUp` für Bottom-Sheets, `fadeIn` für Panels

---

## 3. Layout-Architektur

### Breakpoint-Strategie
```
Mobile:  < 768px  → Bottom-Tab-Navigation, Full-Width-Content
Desktop: ≥ 768px  → Bestehende Sidebar bleibt erhalten
```

### Mobile Layout
```
┌─────────────────────────┐
│ ░░░ SAFE AREA TOP ░░░░░ │  ← Kamera/Notch/Dynamic Island – KEINE Buttons hier!
│                         │     Hintergrundfarbe: #FDFBF9, padding-top: env(safe-area-inset-top)
│ Header (sticky)         │  ← Brand + Live Sync + Page-Titel, UNTERHALB der Safe Area
│─────────────────────────│
│                         │
│  Content (scrollbar)    │  ← View-spezifischer Inhalt
│                         │
│                         │
│─────────────────────────│
│ Bottom Nav (fixed)      │  ← 4–5 Tabs, Blur-Backdrop
│ ░░ SAFE AREA BOTTOM ░░░ │  ← Home Indicator – padding-bottom: env(safe-area-inset-bottom)
└─────────────────────────┘
```

### Mobile Header (je Seite)
- **WICHTIG:** Der Header-Container bekommt `padding-top: env(safe-area-inset-top, 20px)` damit alle Elemente UNTER der iPhone-Kamera liegen
- Links: **REDEFINE** Brand (18px, uppercase, brand-color)
- Rechts: Live Sync Status (grüner Dot + "Live · Berlin")
- Darunter: Seitenspezifische Controls (Navigation, Filter etc.)
- Alle klickbaren Elemente müssen mindestens 44×44px Touch-Target haben

### Bottom Navigation
```
┌──────┬──────┬──────┬──────┬──────┐
│ 📊   │ 📅   │ 👥   │ ⏱   │ 📄   │
│Dash  │Abw.  │Kalen.│Zeit  │Doku  │
└──────┴──────┴──────┴──────┴──────┘
```
- **Stil:** `backdrop-filter: blur(20px)`, semi-transparenter Hintergrund
- **Aktiver Tab:** Brand-Farbe, strokeWidth 2.2
- **Inaktiv:** `#B8A090`, strokeWidth 1.5
- **Safe Area:** `padding-bottom: env(safe-area-inset-bottom, 8px)`
- Admin/Freigaben: Nur sichtbar für CEO und Team Lead (5. Tab oder in Dashboard integriert)

### Desktop Layout (≥ 768px)
- Bestehende Sidebar bleibt funktional
- Bottom Nav wird ausgeblendet
- Content-Bereich nutzt max-width je nach View

---

## 4. Responsive Layout-Komponente

### Neue Datei: `components/MobileLayout.tsx`
Wrapper-Komponente die erkennt ob Mobile oder Desktop und entsprechend rendert:

```typescript
interface MobileLayoutProps {
  children: React.ReactNode;
  user: UserProfile;
  onLogout: () => void;
}
```

**Logik:**
- `useMediaQuery('(max-width: 767px)')` → Mobile
- Mobile: Rendert Header + `{children}` + BottomNav
- Desktop: Rendert bestehende `Layout.tsx` Sidebar

### Routing-Erweiterung
Neue Route für den Team-Kalender:
| Pfad | Komponente | Zugriff |
|------|------------|---------|
| `/calendar` | TeamCalendar | Alle authentifizierten Benutzer |

---

## 5. Team-Kalender (Neue View)

### Neue Datei: `views/TeamCalendar.tsx`

Der Team-Kalender ist die zentrale Neuerung. Er zeigt alle genehmigten Abwesenheiten des Teams in zwei Ansichten.

### 5.1 Monatsansicht

**Header-Controls:**
- Monatsnavigation (← Monat →)
- Toggle: Monat / Woche
- Filter-Button (mit Badge für aktive Filter)
- Heute-Button

**Kalender-Grid:**
- 7-Spalten-Grid (Mo–So), Montag = erste Spalte
- Jede Zelle zeigt: Tageszahl + kleine Zahl darunter (= Anzahl abwesender MA)
- Farbcodierung der Zahl: grau (1), goldbraun (2–3), rot (4+)
- Wochenenden: opacity 0.35
- Feiertage: orange Hintergrund + ★-Icon oben rechts, opacity 0.7
- Heute: heller Hintergrund (#FDF5EE), Zahl in brand-color
- **Hinweistext** unter dem Grid: "Die Zahl im Kalender zeigt die Anzahl abwesender Mitarbeiter an diesem Tag"

**Tap auf Tag → Bottom Sheet:**
- Slide-up-Animation von unten
- Overlay dahinter (dismiss by tap)
- Zeigt: Datum + Wochentag, bei Feiertag/Wochenende den Hinweis "kein Arbeitstag"
- Liste aller Abwesenheiten: Avatar, Name, Zeitraum, Arbeitstage, Typ-Icon
- Arbeitstage = nur Werktage exkl. Feiertage

**Monatsstatistiken (unter Grid):**
- 3-Spalten-Grid: Arbeitstage im Monat | Abwesenheits-Arbeitstage | MA betroffen
- Feiertagsliste des Monats (nur Feiertage auf Werktagen)

### 5.2 Wochenansicht (Gantt-Chart)

**Layout:**
```
       │  Mo  │  Di  │  Mi  │  Do  │  Fr  │  Sa  │  So  │
KW 06  │  09  │  10  │  11  │  12  │  13  │  14  │  15  │
───────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
MH     │      │      │ ████ │ ████ │ ████ │      │      │
───────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
WE     │      │      │      │ ▓▓▓▓ │ ▓▓▓▓ │      │      │
```

- **X-Achse (oben):** KW-Nummer + 7 Tagesspalten (Mo–So) mit Datum
- **Y-Achse (links):** Nur Mitarbeiter die in der Woche abwesend sind (Avatar + Nachname, 72px breit)
- **Zellen:** Farbige Balken pro Abwesenheitstag
  - Farbe = Abwesenheitstyp (siehe Farbschema)
  - Durchgehend verbundene Balken bei aufeinanderfolgenden Tagen (gleiche Absence-ID)
  - Abgerundete Enden nur am Anfang/Ende eines Blocks
  - Icon des Typs im ersten Segment
- **Wochenenden/Feiertage:** opacity 0.35
- **Heute:** Hervorgehobenes Datum-Badge (brand-color, weiße Schrift)
- **Leer-Zustand:** "Keine Abwesenheiten in dieser Woche" Card

**Wochen-Summary:**
- Anzahl abwesende MA in KW X
- Aufschlüsselung nach Typ (Icon + Anzahl)
- Legende: Farbige Balken-Muster pro Typ

### 5.3 Mitarbeiter-Filter

**Toggle-Panel** (öffnet unter den Controls):
- Chip-Buttons pro Mitarbeiter: Avatar-Kreis + Nachname
- Aktiv: Farbiger Rand + Check-Icon im Avatar + fetter Text
- Inaktiv: Grauer Rand + Initialen im Avatar
- "Alle zeigen" Button zum Reset
- Badge am Filter-Button zeigt Anzahl aktiver Filter
- **Legende** im Filter-Panel: Icons + Labels aller Abwesenheitstypen + Feiertag

### 5.4 Datenanbindung (Supabase)

```typescript
// Abwesenheiten laden
const { data } = await supabase
  .from('absences')
  .select('*, profiles(full_name, role)')
  .eq('status', 'APPROVED')
  .gte('end_date', startOfView)
  .lte('start_date', endOfView);
```

---

## 6. Berliner Feiertagslogik

### Service: `services/holidayService.ts`

Falls nicht bereits vorhanden, muss der Holiday-Service folgende Funktionen exportieren:

```typescript
export function getEasterSunday(year: number): Date
export function getBerlinHolidays(year: number): Map<string, string>  // date-string → name
export function getHolidayName(date: Date): string | null
export function isNonWorkday(date: Date): boolean  // Weekend OR Feiertag
export function calcWorkDays(start: Date, end: Date): number  // Nur Werktage
```

### Berliner Feiertage (12 gesetzliche)
| Feiertag | Berechnung |
|----------|------------|
| Neujahr | 01.01. |
| Internationaler Frauentag | 08.03. (Berlin-spezifisch!) |
| Karfreitag | Ostern - 2 |
| Ostersonntag | Gauss-Algorithmus |
| Ostermontag | Ostern + 1 |
| Tag der Arbeit | 01.05. |
| Christi Himmelfahrt | Ostern + 39 |
| Pfingstsonntag | Ostern + 49 |
| Pfingstmontag | Ostern + 50 |
| Tag der Deutschen Einheit | 03.10. |
| 1. Weihnachtsfeiertag | 25.12. |
| 2. Weihnachtsfeiertag | 26.12. |

**Wichtig:** Osterberechnung via Gauss/Anonymous-Algorithmus. Ergebnisse pro Jahr cachen.

### Arbeitstage-Berechnung
- Iteriere von start_date bis end_date
- Zähle nur Tage wo `isNonWorkday(date) === false`
- Gilt für: Urlaubstage-Anzeige, Abwesenheits-Dauer, Monatsstatistiken

---

## 7. Anpassung bestehender Views für Mobile

### 7.1 Dashboard (`views/Dashboard.tsx`)
- **Mobile:** Karten-Layout statt Tabelle
- Urlaubsbudget-Card oben (verbleibende Tage / 30)
- Präsenzstatus als kompakte Anzeige
- Team-Kalender wird separate View (nicht mehr in Dashboard eingebettet)
- Quick-Links zu den häufigsten Aktionen

### 7.2 Abwesenheitsmanagement (`views/AbsenceManagement.tsx`)
- **Mobile:** Antragsformular als Full-Screen-Modal oder eigene Seite
- Antragsliste als Cards statt Tabelle
- Status-Badge prominent sichtbar
- Swipe-Gesten für Aktionen (optional, Phase 2)

### 7.3 Zeiterfassung (`views/TimeTracking.tsx`)
- **Mobile:** Timer-Button groß und zentral
- Start/Stop als primäre Aktion
- Verlauf als scrollbare Karten-Liste
- CSV-Export über Share-Sheet (optional)

### 7.4 Dokumente (`views/Documents.tsx`)
- **Mobile:** Dokumentenliste als Cards mit Typ-Icon
- Upload über nativen File-Picker
- Download-Links mit nativer Share-Funktion

### 7.5 Admin/Freigaben (`views/AdminReview.tsx`)
- **Mobile:** Pending-Anträge als swipeable Cards
- Genehmigen/Ablehnen Buttons prominent
- Badge-Counter in der Bottom Nav (für CEO/Team Lead)

---

## 8. Neue Projektstruktur

```
redefine-hr-suite-v2/
├── components/
│   ├── Layout.tsx                    # Desktop Sidebar (bestehend)
│   ├── MobileLayout.tsx              # NEU: Mobile Wrapper + Bottom Nav
│   ├── ResponsiveShell.tsx           # NEU: Entscheidet Mobile vs Desktop
│   └── ui/                           # NEU: Shared UI Components
│       ├── BottomSheet.tsx           # Wiederverwendbares Bottom Sheet
│       ├── FilterChip.tsx            # Filter-Chip-Button
│       └── StatCard.tsx              # Statistik-Karte
├── services/
│   ├── supabaseClient.ts            # (bestehend)
│   ├── holidayService.ts            # (erweitern um exports)
│   └── reportService.ts             # (bestehend)
├── hooks/                             # NEU
│   └── useMediaQuery.ts             # Responsive Hook
├── views/
│   ├── Dashboard.tsx                 # (anpassen)
│   ├── AbsenceManagement.tsx         # (anpassen)
│   ├── TimeTracking.tsx              # (anpassen)
│   ├── Documents.tsx                 # (anpassen)
│   ├── AdminReview.tsx               # (anpassen)
│   └── TeamCalendar.tsx              # NEU: Monats-/Wochenansicht
├── App.tsx                           # (Routing erweitern)
├── types.ts                          # (erweitern)
└── constants.tsx                     # (erweitern)
```

---

## 9. Technische Anforderungen

### Mobile-spezifisch
- `viewport` Meta-Tag: `width=device-width, initial-scale=1, viewport-fit=cover`
- **KRITISCH – iPhone Notch / Dynamic Island:**
  - Oben am iPhone ist die Kamera (Notch bei iPhone 13/14, Dynamic Island bei iPhone 14 Pro/15/16). Dieser Bereich ist NICHT klickbar.
  - Der gesamte Header-Bereich muss `padding-top: env(safe-area-inset-top, 20px)` haben. Das schiebt den Content unter die Kamera.
  - `env(safe-area-inset-top)` liefert auf iPhones mit Notch ca. 47px, mit Dynamic Island ca. 59px.
  - KEIN interaktives Element (Button, Link, Toggle) darf in diesen Bereich ragen.
  - Der Bereich über dem Content kann die Hintergrundfarbe `#FDFBF9` haben, aber keine klickbaren Elemente.
- **Home Indicator unten:**
  - `padding-bottom: env(safe-area-inset-bottom, 20px)` für die Bottom Navigation
  - Auf iPhones ohne Home-Button sind das ca. 34px
- Touch-Targets: Minimum 44×44px für alle interaktiven Elemente (Apple HIG Empfehlung)
- `-webkit-tap-highlight-color: transparent` global
- `overscroll-behavior: none` für Scroll-Container
- Kein Horizontal-Scroll auf der Hauptseite

### Tailwind CSS
- Aktuell via CDN – idealerweise auf Build-Dependency umstellen
- Falls CDN bleibt: Responsive-Klassen `md:` für Desktop-Overrides nutzen

### Performance
- Kalender-Berechnungen mit `useMemo` cachen
- Holiday-Cache pro Jahr (nicht bei jedem Render neu berechnen)
- Lazy Loading für Views (React.lazy + Suspense)

---

## 10. Referenz-Prototyp

Der freigegebene Prototyp befindet sich in `docs/prototypes/team-calendar.jsx`. Er enthält:
- Vollständige Feiertagslogik (Gauss-Algorithmus)
- Monatsansicht mit Abwesenheits-Zahlen und Bottom Sheet
- Gantt-Wochenansicht mit verbundenen Balken
- Mitarbeiter-Filterung mit Chips
- Monatsstatistiken und Feiertagsliste
- Mobile-optimiertes Layout mit Bottom Nav

**Dieser Prototyp ist die verbindliche UI-Referenz.** Die Supabase-Anbindung und TypeScript-Typisierung fehlen noch und müssen bei der Implementierung ergänzt werden.

---

## 11. Akzeptanzkriterien

- [x] App ist auf iPhone 13/14/15/16 (Safari) voll nutzbar
- [x] **Safe Area Top: Kein klickbares Element ragt in den Notch/Dynamic Island Bereich**
- [x] **Safe Area Bottom: Bottom Nav hat genug Abstand zum Home Indicator**
- [x] Bottom Navigation mit allen Views funktional
- [x] Team-Kalender: Monatsansicht mit Abwesenheits-Zahlen und Day-Detail-Sheet
- [x] Team-Kalender: Wochenansicht als Gantt-Chart mit verbundenen Balken
- [x] Mitarbeiter-Filter funktional in beiden Ansichten
- [x] Berliner Feiertage korrekt berechnet und visuell markiert
- [x] Arbeitstage-Berechnung exkludiert Wochenenden UND Feiertage
- [x] Bestehende Desktop-Ansicht bleibt funktional (≥ 768px)
- [x] Alle bestehenden Features (CRUD Absences, Time Tracking, Documents, Admin) weiterhin nutzbar
- [x] Touch-Targets ≥ 44×44px (Apple HIG), Safe Area Insets korrekt
- [x] Kein Horizontal-Scroll auf Mobile

*Alle Kriterien erfullt und deployed am 06.02.2026.*
