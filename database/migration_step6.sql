-- Step 6 Migration: Create calendar_events table and seed dummy data

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(20) DEFAULT 'meeting', -- meeting | site_visit | inspection | other
  event_date DATE NOT NULL,
  event_time TIME,
  end_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert dummy data using subqueries for project and user references
-- 1. Rapat Koordinasi Mingguan (tiap Rabu in June 2026)
INSERT INTO calendar_events (project_id, title, description, event_type, event_date, event_time, created_by)
VALUES (
  (SELECT id FROM projects WHERE project_code = 'PRJ-2026-001' LIMIT 1),
  'Rapat Koordinasi Mingguan',
  'Rapat progress mingguan tim lapangan ProMan.',
  'meeting',
  '2026-06-10',
  '09:00:00',
  (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1)
);

INSERT INTO calendar_events (project_id, title, description, event_type, event_date, event_time, created_by)
VALUES (
  (SELECT id FROM projects WHERE project_code = 'PRJ-2026-001' LIMIT 1),
  'Rapat Koordinasi Mingguan',
  'Rapat progress mingguan tim lapangan ProMan.',
  'meeting',
  '2026-06-17',
  '09:00:00',
  (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1)
);

INSERT INTO calendar_events (project_id, title, description, event_type, event_date, event_time, created_by)
VALUES (
  (SELECT id FROM projects WHERE project_code = 'PRJ-2026-001' LIMIT 1),
  'Rapat Koordinasi Mingguan',
  'Rapat progress mingguan tim lapangan ProMan.',
  'meeting',
  '2026-06-24',
  '09:00:00',
  (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1)
);

-- 2. Site Visit Owner Tianlala (site_visit, 17 Jun)
INSERT INTO calendar_events (project_id, title, description, event_type, event_date, event_time, created_by)
VALUES (
  (SELECT id FROM projects WHERE project_code = 'PRJ-2026-002' LIMIT 1),
  'Site Visit Owner Tianlala',
  'Kunjungan lapangan owner Tianlala Group ke Grand Indonesia.',
  'site_visit',
  '2026-06-17',
  '14:00:00',
  (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1)
);

-- 3. Inspeksi Akhir MEP (inspection, 18 Jun)
INSERT INTO calendar_events (project_id, title, description, event_type, event_date, event_time, created_by)
VALUES (
  (SELECT id FROM projects WHERE project_code = 'PRJ-2026-001' LIMIT 1),
  'Inspeksi Akhir MEP',
  'Inspeksi kelaikan MEP di gedung kantor pusat Meridian.',
  'inspection',
  '2026-06-18',
  '10:30:00',
  (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1)
);

-- 4. Rapat Evaluasi Q2 (meeting, 23 Jun)
INSERT INTO calendar_events (project_id, title, description, event_type, event_date, event_time, created_by)
VALUES (
  (SELECT id FROM projects WHERE project_code = 'PRJ-2026-001' LIMIT 1),
  'Rapat Evaluasi Q2',
  'Rapat komite manajemen evaluasi tengah tahun.',
  'meeting',
  '2026-06-23',
  '13:00:00',
  (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1)
);

-- 5. Serah Terima Dokumen (other, 30 Jun)
INSERT INTO calendar_events (project_id, title, description, event_type, event_date, event_time, created_by)
VALUES (
  (SELECT id FROM projects WHERE project_code = 'PRJ-2026-002' LIMIT 1),
  'Serah Terima Dokumen',
  'Serah terima gambar as-built dan dokumen penunjang lainnya.',
  'other',
  '2026-06-30',
  '11:00:00',
  (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1)
);
