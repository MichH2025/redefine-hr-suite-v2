-- ============================================================
-- REDEFINE HR Suite – Row-Level Security (RLS) Migration
-- ============================================================
-- Datum: 2026-02-09
-- Beschreibung: Aktiviert RLS auf allen Tabellen und erstellt
--               Policies für rollenbasierte Zugriffskontrolle.
--
-- Rollen: CEO, TEAM_LEAD, EMPLOYEE
-- Tabellen: profiles, absences, time_entries, documents
-- Storage: documents Bucket
--
-- WICHTIG: Dieses Script im Supabase SQL Editor ausführen.
-- ============================================================


-- ============================================================
-- SCHRITT 1: Helper-Funktion get_my_role()
-- ============================================================
-- SECURITY DEFINER: Umgeht RLS auf profiles (verhindert Rekursion)
-- STABLE: Ergebnis wird pro Query gecacht (Performance)
-- Gibt NULL zurück wenn kein Profil existiert (= kein Zugriff)

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;


-- ============================================================
-- SCHRITT 2: RLS auf allen Tabellen aktivieren
-- ============================================================
-- Nach Aktivierung: Alles ist gesperrt bis Policies es erlauben.
-- Der service_role Key und postgres-User umgehen RLS automatisch.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SCHRITT 3: profiles Policies
-- ============================================================

-- SELECT: Alle authentifizierten User dürfen alle Profile lesen.
-- Begründung: TeamCalendar braucht alle Namen, Dashboard zeigt
-- Mitarbeiternamen bei Abwesenheiten, App.tsx lädt alle Profile
-- für CEO/TEAM_LEAD.
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Keine Policy = Gesperrt.
-- Profile werden nur durch Auth-Trigger oder service_role erstellt.

-- UPDATE: Keine Policy = Gesperrt.
-- Verhindert dass ein User seine eigene Rolle ändert (Rollen-Eskalation).
-- Wenn Profiländerungen nötig werden: SECURITY DEFINER Funktion nutzen.

-- DELETE: Keine Policy = Gesperrt.


-- ============================================================
-- SCHRITT 4: absences Policies
-- ============================================================

-- SELECT: Mehrstufige Sichtbarkeit
-- 1. Eigene Anträge: immer sichtbar (AbsenceManagement.tsx)
-- 2. Freigegebene Anträge: für alle sichtbar (Dashboard, TeamCalendar)
-- 3. CEO/TEAM_LEAD: sehen alles (AdminReview)
CREATE POLICY "absences_select"
  ON public.absences
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR status = 'Freigegeben'
    OR get_my_role() IN ('CEO', 'TEAM_LEAD')
  );

-- INSERT: Nur eigene Anträge mit korrektem Initialstatus
-- Verhindert:
--   - Anträge für andere User erstellen
--   - EMPLOYEE sich selbst freigeben ('Freigegeben')
--   - TEAM_LEAD als 'Wartet auf Teamleiter' einstellen (Workflow-Umgehung)
CREATE POLICY "absences_insert_own"
  ON public.absences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (get_my_role() = 'CEO' AND status = 'Freigegeben')
      OR (get_my_role() = 'TEAM_LEAD' AND status = 'Wartet auf CEO')
      OR (get_my_role() = 'EMPLOYEE' AND status = 'Wartet auf Teamleiter')
    )
  );

-- UPDATE: Rollenbasierte Status-Übergänge
-- USING  = welche Zeilen darf man anfassen (vor dem Update)
-- WITH CHECK = welche Werte darf man setzen (nach dem Update)
--
-- TEAM_LEAD:
--   USING: nur Zeilen mit status = 'Wartet auf Teamleiter'
--   WITH CHECK: nur → 'Wartet auf CEO' oder 'Abgelehnt'
--
-- CEO:
--   USING: alle Zeilen (kann auch 'Wartet auf Teamleiter' direkt freigeben)
--   WITH CHECK: nur → 'Freigegeben' oder 'Abgelehnt'
--
-- EMPLOYEE: gesperrt (ELSE false)
CREATE POLICY "absences_update_status"
  ON public.absences
  FOR UPDATE
  TO authenticated
  USING (
    CASE get_my_role()
      WHEN 'CEO' THEN true
      WHEN 'TEAM_LEAD' THEN status = 'Wartet auf Teamleiter'
      ELSE false
    END
  )
  WITH CHECK (
    CASE get_my_role()
      WHEN 'CEO' THEN status IN ('Freigegeben', 'Abgelehnt')
      WHEN 'TEAM_LEAD' THEN status IN ('Wartet auf CEO', 'Abgelehnt')
      ELSE false
    END
  );

-- DELETE: Keine Policy = Gesperrt.


-- ============================================================
-- SCHRITT 5: time_entries Policies
-- ============================================================

-- SELECT: Nur eigene Zeiteinträge
CREATE POLICY "time_entries_select_own"
  ON public.time_entries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Nur eigene Zeiteinträge erstellen
CREATE POLICY "time_entries_insert_own"
  ON public.time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Nur eigene Zeiteinträge korrigieren
CREATE POLICY "time_entries_update_own"
  ON public.time_entries
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Keine Policy = Gesperrt.


-- ============================================================
-- SCHRITT 6: documents Policies
-- ============================================================

-- SELECT: Eigene Dokumente ODER CEO sieht alle
CREATE POLICY "documents_select"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR get_my_role() = 'CEO'
  );

-- INSERT: Eigene Dokumente ODER CEO kann für alle hochladen
CREATE POLICY "documents_insert"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR get_my_role() = 'CEO'
  );

-- UPDATE/DELETE: Keine Policy = Gesperrt.


-- ============================================================
-- SCHRITT 7: Storage Policies (Bucket "documents")
-- ============================================================
-- Dateipfad-Konvention: {userId}/{timestamp}_{filename}
-- (storage.foldername(name))[1] extrahiert den userId-Ordner

-- SELECT (Download): Eigener Ordner ODER CEO
CREATE POLICY "storage_documents_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR get_my_role() = 'CEO'
    )
  );

-- INSERT (Upload): Eigener Ordner ODER CEO
CREATE POLICY "storage_documents_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR get_my_role() = 'CEO'
    )
  );

-- UPDATE (Überschreiben): Eigener Ordner ODER CEO
CREATE POLICY "storage_documents_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR get_my_role() = 'CEO'
    )
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR get_my_role() = 'CEO'
    )
  );

-- DELETE: Keine Policy = Gesperrt.


-- ============================================================
-- FERTIG: Zusammenfassung
-- ============================================================
--
-- profiles:     SELECT=alle auth, INSERT/UPDATE/DELETE=gesperrt
-- absences:     SELECT=eigene+freigegebene+Manager, INSERT=eigene+korrekter Status,
--               UPDATE=Manager mit Workflow-Regeln, DELETE=gesperrt
-- time_entries:  SELECT/INSERT/UPDATE=nur eigene, DELETE=gesperrt
-- documents:    SELECT/INSERT=eigene+CEO, UPDATE/DELETE=gesperrt
-- storage:      SELECT/INSERT/UPDATE=eigener Ordner+CEO, DELETE=gesperrt
--
-- Helper: get_my_role() → CEO/TEAM_LEAD/EMPLOYEE/NULL
