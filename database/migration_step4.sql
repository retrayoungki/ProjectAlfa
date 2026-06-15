-- Migration script to create tables supporting Step 4: Tab Progress (Divisions, Weekly Progress, Details)
-- Target DB: PostgreSQL

-- 1. Create project_divisions table
CREATE TABLE IF NOT EXISTS project_divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  division_name VARCHAR(100) NOT NULL,
  bobot DECIMAL(5,2) NOT NULL DEFAULT 0,
    -- bobot persentase dari total pekerjaan, total semua divisi = 100%
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create project_weekly_progress table
CREATE TABLE IF NOT EXISTS project_weekly_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  week_label VARCHAR(50),
    -- contoh: "Minggu 20"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, week_number)
);

-- 3. Create project_progress_details table
CREATE TABLE IF NOT EXISTS project_progress_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_progress_id UUID NOT NULL REFERENCES project_weekly_progress(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES project_divisions(id) ON DELETE CASCADE,
  progress_plan DECIMAL(5,2) DEFAULT 0,
    -- % rencana untuk divisi ini di minggu ini
  progress_actual DECIMAL(5,2) DEFAULT 0,
    -- % aktual untuk divisi ini di minggu ini
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Alter projects table to add scurve_data summary
ALTER TABLE projects ADD COLUMN IF NOT EXISTS scurve_data JSONB DEFAULT '[]';

-- 5. Seed dummy data for PRJ-2026-001 (p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d)
-- Insert 8 divisions
INSERT INTO project_divisions (id, project_id, division_name, bobot, sort_order)
VALUES
  ('d1b8a9d2-e3a4-4f5b-8c6d-000000000001', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Persiapan & Mobilisasi', 3.00, 1),
  ('d1b8a9d2-e3a4-4f5b-8c6d-000000000002', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Pekerjaan Tanah & Fondasi', 8.00, 2),
  ('d1b8a9d2-e3a4-4f5b-8c6d-000000000003', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Struktur Beton & Baja', 20.00, 3),
  ('d1b8a9d2-e3a4-4f5b-8c6d-000000000004', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Pasangan, Plesteran & Acian', 12.00, 4),
  ('d1b8a9d2-e3a4-4f5b-8c6d-000000000005', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'MEP Rough-in', 25.00, 5),
  ('d1b8a9d2-e3a4-4f5b-8c6d-000000000006', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Arsitektur & Finishing', 22.00, 6),
  ('d1b8a9d2-e3a4-4f5b-8c6d-000000000007', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'MEP Final & Commissioning', 7.00, 7),
  ('d1b8a9d2-e3a4-4f5b-8c6d-000000000008', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Perapihan & BAST', 3.00, 8)
ON CONFLICT (id) DO NOTHING;

-- Seed week 20 reports on PostgreSQL (detailed seeding is left to seeds.js for local dev SQLite)
UPDATE projects
SET 
  progress_plan = 58.00,
  progress_actual = 46.00,
  scurve_data = '[
    {"week": 1, "week_label": "Minggu 1", "plan": 2.0, "actual": 1.5},
    {"week": 2, "week_label": "Minggu 2", "plan": 4.0, "actual": 3.0},
    {"week": 3, "week_label": "Minggu 3", "plan": 7.0, "actual": 5.0},
    {"week": 4, "week_label": "Minggu 4", "plan": 10.0, "actual": 7.5},
    {"week": 5, "week_label": "Minggu 5", "plan": 13.0, "actual": 10.0},
    {"week": 6, "week_label": "Minggu 6", "plan": 16.0, "actual": 12.0},
    {"week": 7, "week_label": "Minggu 7", "plan": 19.5, "actual": 14.5},
    {"week": 8, "week_label": "Minggu 8", "plan": 23.0, "actual": 17.0},
    {"week": 9, "week_label": "Minggu 9", "plan": 26.5, "actual": 20.0},
    {"week": 10, "week_label": "Minggu 10", "plan": 30.0, "actual": 23.0},
    {"week": 11, "week_label": "Minggu 11", "plan": 33.5, "actual": 25.5},
    {"week": 12, "week_label": "Minggu 12", "plan": 37.0, "actual": 28.0},
    {"week": 13, "week_label": "Minggu 13", "plan": 40.5, "actual": 31.0},
    {"week": 14, "week_label": "Minggu 14", "plan": 44.0, "actual": 33.5},
    {"week": 15, "week_label": "Minggu 15", "plan": 47.0, "actual": 36.0},
    {"week": 16, "week_label": "Minggu 16", "plan": 50.0, "actual": 38.5},
    {"week": 17, "week_label": "Minggu 17", "plan": 52.5, "actual": 40.5},
    {"week": 18, "week_label": "Minggu 18", "plan": 54.5, "actual": 42.5},
    {"week": 19, "week_label": "Minggu 19", "plan": 56.5, "actual": 44.5},
    {"week": 20, "week_label": "Minggu 20", "plan": 58.0, "actual": 46.0}
  ]'
WHERE id = 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d';
