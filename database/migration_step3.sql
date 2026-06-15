-- Migration script to create tables supporting Step 3: Tab Finance (Termins, Project Alterations)
-- Target DB: PostgreSQL

-- 1. Create project_termins table
CREATE TABLE IF NOT EXISTS project_termins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  termin_number INT NOT NULL,
  termin_label VARCHAR(100),
    -- contoh: "Termin 1 — 30%", "Termin PHO", "Termin FHO"
  percentage DECIMAL(5,2),
    -- persentase dari nilai kontrak, contoh: 30.00
  nilai_termin BIGINT NOT NULL DEFAULT 0,
    -- nilai tagihan sebelum retensi
  retensi_pct DECIMAL(4,2) DEFAULT 5.00,
    -- % retensi, default 5%
  retensi_amount BIGINT DEFAULT 0,
    -- nilai retensi yang ditahan (hitung otomatis)
  netto_cair BIGINT DEFAULT 0,
    -- nilai_termin - retensi_amount
  submitted_date DATE,
  approved_date DATE,
  paid_date DATE,
  status VARCHAR(20) DEFAULT 'draft',
    -- nilai: draft | submitted | approved | paid
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, termin_number)
);

-- 2. Alter projects table to add progress and retention tracking columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_plan DECIMAL(5,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_actual DECIMAL(5,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS retensi_total BIGINT DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS retensi_cair BIGINT DEFAULT 0;

-- 3. Seed dummy data for PRJ-2026-001 (Pembangunan Kantor Pusat Meridian - p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d)
-- Contract Value: 7.500.000.000
-- Termin 1: 30% = 2,250,000,000 | 5% Retensi = 112,500,000 | Netto = 2,137,500,000 | paid
-- Termin 2: 30% = 2,250,000,000 | 5% Retensi = 112,500,000 | Netto = 2,137,500,000 | paid
-- Termin 3: 20% = 1,500,000,000 | 5% Retensi = 75,000,000   | Netto = 1,425,000,000 | approved
-- Termin 4: 15% = 1,125,000,000 | 5% Retensi = 56,250,000   | Netto = 1,068,750,000 | submitted
-- Termin 5: 5%  = 375,000,000   | 0% Retensi = 0            | Netto = 375,000,000   | draft (FHO)
INSERT INTO project_termins (
  id, project_id, termin_number, termin_label, percentage, nilai_termin,
  retensi_pct, retensi_amount, netto_cair, submitted_date, approved_date, paid_date, status, notes
) VALUES
  (
    't1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 1, 'Termin 1 — Uang Muka 30%', 30.00, 2250000000,
    5.00, 112500000, 2137500000, '2026-02-15', '2026-02-18', '2026-02-25', 'paid', 'Pembayaran termin pertama uang muka'
  ),
  (
    't2b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 2, 'Termin 2 — Progress 30%', 30.00, 2250000000,
    5.00, 112500000, 2137500000, '2026-04-10', '2026-04-12', '2026-04-20', 'paid', 'Penagihan termin kedua progres lapangan'
  ),
  (
    't3b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 3, 'Termin 3 — Progress 20%', 20.00, 1500000000,
    5.00, 75000000, 1425000000, '2026-06-01', '2026-06-05', NULL, 'approved', 'Persetujuan termin ketiga oleh manajemen client'
  ),
  (
    't4b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 4, 'Termin 4 — Progress 15%', 15.00, 1125000000,
    5.00, 56250000, 1068750000, '2026-06-10', NULL, NULL, 'submitted', 'Dokumen tagihan termin keempat diajukan ke client'
  ),
  (
    't5b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 5, 'Termin 5 — Retensi BAST 2 / FHO 5%', 5.00, 375000000,
    0.00, 0, 375000000, NULL, NULL, NULL, 'draft', 'Draft termin kelima pengembalian retensi'
  )
ON CONFLICT (id) DO NOTHING;

-- Update retensi_total in projects (112.5M + 112.5M + 75M + 56.25M = 356,250,000)
UPDATE projects 
SET retensi_total = 356250000, retensi_cair = 0 
WHERE id = 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d';
