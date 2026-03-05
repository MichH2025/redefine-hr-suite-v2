-- ============================================================
-- Briefing 03: Dokumentenablage - Schema-Erweiterung
-- ============================================================

-- 1. Alte type-Spalte entfernen (falls vorhanden)
ALTER TABLE documents DROP COLUMN IF EXISTS type;

-- 2. Neue Spalten hinzufügen
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) NOT NULL DEFAULT 'Sonstiges',
ADD COLUMN IF NOT EXISTS reference_month DATE,
ADD COLUMN IF NOT EXISTS reference_year INT,
ADD COLUMN IF NOT EXISTS absence_id UUID REFERENCES absences(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 3. Check Constraint für erlaubte Dokumententypen
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

-- 4. Indices für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_user_type ON documents(user_id, document_type);

-- ============================================================
-- RLS Policies für documents
-- ============================================================

-- Existierende Policies entfernen (falls vorhanden)
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "CEO can view all documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "CEO can insert any documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "CEO can delete any documents" ON documents;

-- RLS aktivieren
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- SELECT: User sieht nur eigene Dokumente
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

-- SELECT: CEO sieht alle Dokumente
CREATE POLICY "CEO can view all documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'CEO'
    )
  );

-- INSERT: User kann eigene Dokumente hochladen
CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- INSERT: CEO kann für alle hochladen
CREATE POLICY "CEO can insert any documents" ON documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'CEO'
    )
  );

-- DELETE: User kann eigene Dokumente löschen
CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- DELETE: CEO kann alle löschen
CREATE POLICY "CEO can delete any documents" ON documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'CEO'
    )
  );
