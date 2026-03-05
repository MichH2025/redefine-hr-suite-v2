-- RLS Policies für geplante Abwesenheiten

-- Geplante Urlaube: Nur eigene bearbeiten (nur Status "Geplant")
CREATE POLICY "Users can update own planned absences" ON absences
  FOR UPDATE USING (
    auth.uid() = user_id
    AND status = 'Geplant'
  );

-- Geplante Urlaube: Nur eigene löschen (nur Status "Geplant")
CREATE POLICY "Users can delete own planned absences" ON absences
  FOR DELETE USING (
    auth.uid() = user_id
    AND status = 'Geplant'
  );
