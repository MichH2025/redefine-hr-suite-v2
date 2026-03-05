-- Neue Spalte für Resturlaub Vorjahr
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS vacation_days_previous_year INT DEFAULT 0;

-- Neuen Enum-Wert 'Geplant' zum absence_status Typ hinzufügen
ALTER TYPE absence_status ADD VALUE IF NOT EXISTS 'Geplant' BEFORE 'Wartet auf Teamleiter';
