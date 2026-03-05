-- RLS Policies für UPDATE und DELETE auf time_entries
-- Mitarbeiter können nur eigene Einträge bearbeiten/löschen

CREATE POLICY "Users can update own time entries" ON time_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries" ON time_entries
  FOR DELETE USING (auth.uid() = user_id);
