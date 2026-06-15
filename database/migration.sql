-- Migration script to create the projects table and populate it with dummy data.
-- Target DB: PostgreSQL

-- 1. Create the projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(20) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'preparation',
  contract_value BIGINT DEFAULT 0,
  budget BIGINT DEFAULT 0,
  budget_used BIGINT DEFAULT 0,
  contract_start_date DATE,
  contract_end_date DATE,
  actual_start_date DATE,
  location VARCHAR(255),
  project_type VARCHAR(30),
  assigned_pm UUID REFERENCES users(id) ON DELETE SET NULL,
  total_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 2. Insert dummy clients if not exist (using fixed UUIDs for references)
INSERT INTO clients (id, name, company, email, phone, created_at)
VALUES 
  ('c1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'David Lim', 'Meridian Corp', 'david@meridian.com', '555-0100', NOW()),
  ('c2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Sarah Chen', 'TechNova Ltd', 'sarah@technova.com', '555-0200', NOW()),
  ('c3b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Raj Patel', 'BlueStar Group', 'raj@bluestar.com', '555-0300', NOW()),
  ('c4b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Dewi Lestari', 'Tianlala Group', 'dewi@tianlala.com', '555-0400', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Insert dummy users (PMs) if not exist
INSERT INTO users (id, name, email, role, department, created_at)
VALUES 
  ('u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Alex Kumar', 'alex@proman.com', 'PROJECT_MANAGER', 'MANAGEMENT', NOW()),
  ('u2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Sarah Jenkins', 'sarah@proman.com', 'SENIOR_PROJECT_MANAGER', 'ENGINEERING', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Insert 10 dummy projects with various statuses and clients
INSERT INTO projects (
  id, project_code, project_name, client_id, client_name, status, 
  contract_value, budget, budget_used, contract_start_date, contract_end_date, 
  actual_start_date, location, project_type, assigned_pm, total_tasks, completed_tasks
) VALUES
  (
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'PRJ-2026-001', 'Pembangunan Kantor Pusat Meridian', 
    'c1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Meridian Corp', 'execution', 
    7500000000, 6000000000, 4200000000, '2026-01-15', '2026-10-15', '2026-01-20', 
    'Sudirman, Jakarta Pusat', 'office', 'u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 15, 8
  ),
  (
    'p2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'PRJ-2026-002', 'Fit-out Cafe Tianlala Grand Indonesia', 
    'c4b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Tianlala Group', 'execution', 
    1200000000, 950000000, 910000000, '2026-03-01', '2026-06-30', '2026-03-05', 
    'Thamrin, Jakarta Pusat', 'store', 'u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 8, 7
  ),
  (
    'p3b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'PRJ-2026-003', 'Renovasi Lobby Hotel BlueStar', 
    'c3b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'BlueStar Group', 'preparation', 
    2500000000, 2000000000, 0, '2026-07-01', '2026-12-31', NULL, 
    'Seminyak, Bali', 'renovation', 'u2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 5, 0
  ),
  (
    'p4b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'PRJ-2026-004', 'Sistem MEP TechNova R&D Center', 
    'c2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'TechNova Ltd', 'handover', 
    4800000000, 3800000000, 3750000000, '2025-08-01', '2026-05-30', '2025-08-10', 
    'BSD City, Tangerang Selatan', 'office', 'u2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 24, 24
  ),
  (
    'p5b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'PRJ-2026-005', 'Gerai Baru Tianlala Mall Kelapa Gading', 
    'c4b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Tianlala Group', 'preparation', 
    950000000, 800000000, 50000000, '2026-06-15', '2026-09-15', NULL, 
    'Kelapa Gading, Jakarta Utara', 'store', 'u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 10, 1
  ),
  (
    'p6b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'PRJ-2026-006', 'Gudang Logistik BlueStar Karawang', 
    'c3b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'BlueStar Group', 'execution', 
    8500000000, 7000000000, 4800000000, '2026-02-01', '2026-11-30', '2026-02-15', 
    'KIIC, Karawang', 'other', 'u2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 30, 12
  ),
  (
    'p7b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'PRJ-2026-007', 'Studi Kelayakan TechNova Tower', 
    'c2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'TechNova Ltd', 'completed', 
    500000000, 400000000, 400000000, '2025-11-01', '2026-03-31', '2025-11-05', 
    'Mega Kuningan, Jakarta Selatan', 'office', 'u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 6, 6
  ),
  (
    'p8b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'PRJ-2026-008', 'Showroom Mobil Meridian Pluit', 
    'c1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Meridian Corp', 'handover', 
    3200000000, 2600000000, 2550000000, '2025-09-15', '2026-05-15', '2025-09-20', 
    'Pluit, Jakarta Utara', 'store', 'u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 18, 18
  ),
  (
    'p9b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'PRJ-2026-009', 'Stasiun Pengisian Listrik TechNova', 
    'c2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'TechNova Ltd', 'on_hold', 
    1500000000, 1200000000, 600000000, '2025-12-01', '2026-08-30', '2025-12-10', 
    'Cikarang, Bekasi', 'other', 'u2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 12, 4
  ),
  (
    'p108a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'PRJ-2026-010', 'Renovasi Kantor Cabang BlueStar Surabaya', 
    'c3b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'BlueStar Group', 'execution', 
    1800000000, 1400000000, 1380000000, '2026-02-10', '2026-07-10', '2026-02-15', 
    'Darmo, Surabaya', 'renovation', 'u1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 14, 11
  )
ON CONFLICT (id) DO NOTHING;
