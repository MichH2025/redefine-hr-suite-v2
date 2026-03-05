
# REDEFINE HR Management Suite

Interne HR-Anwendung der REDEFINE Asset Management GmbH.

**Live:** https://redefine-hr-suite-v2.vercel.app

## Features

- Rollenbasierte Authentifizierung (CEO, Teamleiter, Mitarbeiter)
- Dashboard mit Abwesenheitsfilter und Mitarbeitersuche
- Abwesenheitsmanagement mit 2-stufiger Freigabe
- Team-Kalender mit Monats- und Wochenansicht (Gantt-Chart)
- Manuelle Zeiterfassung (Beginn/Ende/Pause) mit CSV-Export
- Dokumentenarchiv fur Lohnabrechnungen, Vertrage etc.
- Responsive Design mit iPhone-optimiertem Mobile-Layout

## Tech-Stack

- **Frontend:** React 19, TypeScript 5.8, Tailwind CSS, Vite 6
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Hosting:** Vercel
- **Icons:** Lucide React

## Lokale Einrichtung

```bash
# 1. Abhangigkeiten installieren
npm install

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env.local
# VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY eintragen

# 3. Entwicklungsserver starten
npm run dev
```

## Deployment

```bash
# Production Build
npm run build

# Deploy zu Vercel
npx vercel deploy --prod --yes
```

Alle Daten liegen in Supabase (Cloud) und bleiben bei jedem Deployment erhalten.

## Dokumentation

- [PROJEKTDOKUMENTATION.md](PROJEKTDOKUMENTATION.md) - Vollstandige technische Dokumentation
- [docs/MOBILE_SPEC.md](docs/MOBILE_SPEC.md) - Mobile Redesign Spezifikation
