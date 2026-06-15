-- Migration script to create tables supporting Step 2: Detail Proyek (Members, Milestones, Activity Logs)
-- Target DB: PostgreSQL

-- 1. Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_in_project VARCHAR(50) NOT NULL,
  joined_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 2. Create project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_name VARCHAR(255) NOT NULL,
  target_date DATE,
  actual_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create project_activity_logs table
CREATE TABLE IF NOT EXISTS project_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(100),
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Seed dummy data for PRJ-2026-001 (Pembangunan Kantor Pusat Meridian - p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d)
-- Insert 5 Milestones (2 done, 1 in_progress, 2 pending)
INSERT INTO project_milestones (id, project_id, milestone_name, target_date, actual_date, status, sort_order, created_at)
VALUES
  ('m1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'M1 Mobilisasi', '2026-01-20', '2026-01-22', 'done', 1, NOW() - INTERVAL '120 days'),
  ('m2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'M2 Pekerjaan Struktur', '2026-04-15', '2026-04-12', 'done', 2, NOW() - INTERVAL '60 days'),
  ('m3b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'M3 Pekerjaan MEP Rough-in', '2026-06-15', NULL, 'in_progress', 3, NOW() - INTERVAL '10 days'),
  ('m4b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'M4 Pekerjaan Finishing', '2026-08-30', NULL, 'pending', 4, NOW()),
  ('m5b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'M5 Serah Terima Akhir / BAST 1', '2026-10-15', NULL, 'pending', 5, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert 5 Members (PM, Site Manager, Finance, Drafter, Mandor)
-- PM: Alex Kumar (u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d)
-- Site Manager: Sarah Jenkins (u2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d)
-- We assume other user IDs exist or use generic UUIDs:
-- Finance: u3b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d
-- Drafter: u4b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d
-- Mandor: u5b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d
INSERT INTO users (id, name, email, role, department, created_at)
VALUES
  ('u3b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Emma Vance', 'emma@proman.com', 'DIRECTOR', 'DESIGN', NOW()),
  ('u4b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Marcus Thorne', 'marcus@proman.com', 'PROJECT_MANAGER', 'MANAGEMENT', NOW()),
  ('u5b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Hadi Wijaya', 'hadi@proman.com', 'DEVELOPER', 'ENGINEERING', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role_in_project, joined_at)
VALUES
  ('mb18a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'pm', '2026-01-15'),
  ('mb28a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'u2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'site_manager', '2026-01-15'),
  ('mb38a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'u3b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'finance', '2026-01-20'),
  ('mb48a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'u4b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'drafter', '2026-01-20'),
  ('mb58a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'u5b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'mandor', '2026-01-22')
ON CONFLICT (id) DO NOTHING;

-- Insert 5 Activity Logs
INSERT INTO project_activity_logs (id, project_id, user_id, user_name, action, created_at)
VALUES
  ('l1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Alex Kumar', 'memulai proyek dan merilis Mobilisasi (M1)', NOW() - INTERVAL '120 days'),
  ('l2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'u2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Sarah Jenkins', 'mengunggah dokumen Shop Drawing struktur kolom', NOW() - INTERVAL '90 days'),
  ('l3b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Alex Kumar', 'mengubah status milestone Pekerjaan Struktur (M2) ke done', NOW() - INTERVAL '62 days'),
  ('l4b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'u4b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Marcus Thorne', 'menambahkan tugas baru: Instalasi kabel tray risers', NOW() - INTERVAL '5 days'),
  ('l5b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Alex Kumar', 'mengubah status milestone Pekerjaan MEP Rough-in (M3) ke in_progress', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;
