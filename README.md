
# REDEFINE HR Management Suite

Interne HR-Anwendung der REDEFINE Asset Management GmbH.

## Lokale Einrichtung (VSCode)

1. **Ordner öffnen**: Öffne diesen Ordner in VSCode.
2. **Umgebungsvariablen**:
   - Erstelle eine Datei namens `.env.local` (basiert auf `.env.example`).
   - Trage dort deine Supabase URL und den Anon Key ein.
3. **Starten**: 
   - Nutze die VSCode Extension **"Live Server"**, um die `index.html` zu starten.
   - Alternativ: Installiere Node.js und nutze `npx vite`, falls du ein Build-Tool bevorzugst.

## GitHub Upload & Deployment

1. **Git initialisieren**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. **GitHub Repo**: Erstelle ein privates Repo auf GitHub und verknüpfe es:
   ```bash
   git remote add origin https://github.com/DEIN_NAME/redefine-hr.git
   git push -u origin main
   ```
3. **Vercel**: Verbinde dein GitHub Konto mit Vercel und importiere das Repo. Füge die `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` in den Vercel Project Settings unter "Environment Variables" hinzu.

## Features
- Rollenbasierte Authentifizierung (CEO, Teamleiter, Mitarbeiter)
- Abwesenheitsmanagement mit 2-stufiger Freigabe
- Zeiterfassung mit CSV-Export
- Dokumentenarchiv für Lohnabrechnungen
