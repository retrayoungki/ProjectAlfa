-- Migration script to create tables supporting Step 5: Tasks & Documents Tab
-- Target DB: PostgreSQL

-- 1. Create project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  division VARCHAR(50), -- persiapan | sipil | mep | arsitektur | finishing | other
  status VARCHAR(20) DEFAULT 'todo', -- todo | in_progress | review | done
  priority VARCHAR(10) DEFAULT 'medium', -- high | medium | low
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_name VARCHAR(100),
  due_date DATE,
  completed_date DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create project_folders table
CREATE TABLE IF NOT EXISTS project_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  folder_name VARCHAR(100) NOT NULL,
  folder_color VARCHAR(20) DEFAULT 'blue', -- blue | amber | green | purple | red | gray
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES project_folders(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(20), -- pdf | xlsx | docx | dwg | jpg | png | other
  file_size_kb INT DEFAULT 0,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_name VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Alter projects table to add tasks summary columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_tasks INT DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_tasks INT DEFAULT 0;

-- 5. Seed dummy folders for PRJ-2026-001 (p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d)
INSERT INTO project_folders (id, project_id, folder_name, folder_color, sort_order)
VALUES
  ('f1b8a9d2-e3a4-4f5b-8c6d-000000000001', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Kontrak & SPK', 'amber', 1),
  ('f1b8a9d2-e3a4-4f5b-8c6d-000000000002', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Gambar Kerja / Shop Drawing', 'blue', 2),
  ('f1b8a9d2-e3a4-4f5b-8c6d-000000000003', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Laporan Kemajuan Pekerjaan', 'green', 3),
  ('f1b8a9d2-e3a4-4f5b-8c6d-000000000004', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Dokumen Penagihan', 'purple', 4),
  ('f1b8a9d2-e3a4-4f5b-8c6d-000000000005', 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 'Dokumentasi Foto Lapangan', 'amber', 5)
ON CONFLICT (id) DO NOTHING;

-- 6. Seed dummy documents for PRJ-2026-001
INSERT INTO project_documents (id, project_id, folder_id, file_name, file_type, file_size_kb, file_url, uploaded_by, uploaded_name, description)
VALUES
  (
    'd1b8a9d2-e3a4-4f5b-8c6d-000000000101', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'f1b8a9d2-e3a4-4f5b-8c6d-000000000001', 
    'SPK_Pembangunan_Meridian_Signed.pdf', 
    'pdf', 
    4500, 
    '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/SPK_Pembangunan_Meridian_Signed.pdf', 
    (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1), 
    'Alex Kumar', 
    'Surat Perjanjian Kerja konstruksi ditandatangani kedua pihak.'
  ),
  (
    'd1b8a9d2-e3a4-4f5b-8c6d-000000000102', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'f1b8a9d2-e3a4-4f5b-8c6d-000000000001', 
    'Addendum_01_Penyesuaian_Jadwal.pdf', 
    'pdf', 
    1200, 
    '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Addendum_01_Penyesuaian_Jadwal.pdf', 
    (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1), 
    'Alex Kumar', 
    'Addendum waktu pelaksanaan konstruksi.'
  ),
  (
    'd1b8a9d2-e3a4-4f5b-8c6d-000000000103', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'f1b8a9d2-e3a4-4f5b-8c6d-000000000002', 
    'Shop_Drawing_Arsitektur_Rev2.dwg', 
    'dwg', 
    15400, 
    '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Shop_Drawing_Arsitektur_Rev2.dwg', 
    (SELECT id FROM users WHERE email = 'sarah@proman.com' LIMIT 1), 
    'Sarah Jenkins', 
    'Gambar kerja arsitektur revisi ke-2 untuk layout interior.'
  ),
  (
    'd1b8a9d2-e3a4-4f5b-8c6d-000000000104', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'f1b8a9d2-e3a4-4f5b-8c6d-000000000002', 
    'Layout_Plan_MEP_Piping.pdf', 
    'pdf', 
    3200, 
    '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Layout_Plan_MEP_Piping.pdf', 
    (SELECT id FROM users WHERE email = 'sarah@proman.com' LIMIT 1), 
    'Sarah Jenkins', 
    'Gambar jalur pipa instalasi MEP (Plumbing & Air).'
  ),
  (
    'd1b8a9d2-e3a4-4f5b-8c6d-000000000105', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'f1b8a9d2-e3a4-4f5b-8c6d-000000000003', 
    'Laporan_Mingguan_Week_20.xlsx', 
    'xlsx', 
    850, 
    '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Laporan_Mingguan_Week_20.xlsx', 
    (SELECT id FROM users WHERE email = 'sarah@proman.com' LIMIT 1), 
    'Sarah Jenkins', 
    'Laporan realisasi kemajuan mingguan (Minggu 20).'
  ),
  (
    'd1b8a9d2-e3a4-4f5b-8c6d-000000000106', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'f1b8a9d2-e3a4-4f5b-8c6d-000000000003', 
    'Laporan_Bulanan_Mei_2026.pdf', 
    'pdf', 
    5400, 
    '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Laporan_Bulanan_Mei_2026.pdf', 
    (SELECT id FROM users WHERE email = 'sarah@proman.com' LIMIT 1), 
    'Sarah Jenkins', 
    'Laporan komparasi progress plan vs actual bulan Mei.'
  ),
  (
    'd1b8a9d2-e3a4-4f5b-8c6d-000000000107', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'f1b8a9d2-e3a4-4f5b-8c6d-000000000004', 
    'Invoice_Termin_3_Approved.pdf', 
    'pdf', 
    750, 
    '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Invoice_Termin_3_Approved.pdf', 
    (SELECT id FROM users WHERE email = 'emma@proman.com' LIMIT 1), 
    'Emma Vance', 
    'Dokumen persetujuan penagihan termin 3.'
  ),
  (
    'd1b8a9d2-e3a4-4f5b-8c6d-000000000108', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'f1b8a9d2-e3a4-4f5b-8c6d-000000000004', 
    'Berita_Acara_Prestasi_Pekerjaan_80pct.pdf', 
    'pdf', 
    1800, 
    '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Berita_Acara_Prestasi_Pekerjaan_80pct.pdf', 
    (SELECT id FROM users WHERE email = 'emma@proman.com' LIMIT 1), 
    'Emma Vance', 
    'BAPP yang sudah ditandatangani oleh Pengawas Lapangan.'
  ),
  (
    'd1b8a9d2-e3a4-4f5b-8c6d-000000000109', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'f1b8a9d2-e3a4-4f5b-8c6d-000000000005', 
    'Foto_Progress_Kolom_Utama.jpg', 
    'jpg', 
    2300, 
    '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Foto_Progress_Kolom_Utama.jpg', 
    (SELECT id FROM users WHERE email = 'sarah@proman.com' LIMIT 1), 
    'Sarah Jenkins', 
    'Dokumentasi pekerjaan pembesian kolom.'
  ),
  (
    'd1b8a9d2-e3a4-4f5b-8c6d-000000000110', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'f1b8a9d2-e3a4-4f5b-8c6d-000000000005', 
    'Foto_Inspeksi_MEP_Langit_Langit.png', 
    'png', 
    3100, 
    '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Foto_Inspeksi_MEP_Langit_Langit.png', 
    (SELECT id FROM users WHERE email = 'sarah@proman.com' LIMIT 1), 
    'Sarah Jenkins', 
    'Foto detail instalasi kabel tray.'
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Seed dummy tasks for PRJ-2026-001 (14 tasks: 5 done, 4 in_progress, 2 review, 3 todo)
INSERT INTO project_tasks (id, project_id, title, description, division, status, priority, assigned_to, assigned_name, due_date, completed_date, sort_order)
VALUES
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000201', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Pengukuran Ulang Area Proyek (Site Survey)', 
    'Melakukan pengukuran ulang batas area lahan untuk presisi struktur konstruksi.', 
    'persiapan', 
    'done', 
    'high', 
    (SELECT id FROM users WHERE email = 'sarah@proman.com' LIMIT 1), 
    'Sarah Jenkins', 
    CURRENT_DATE - INTERVAL '100 days', 
    CURRENT_DATE - INTERVAL '102 days', 
    1
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000202', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Mobilisasi Alat Berat & Konstruksi Direksikeet', 
    'Mendatangkan excavator dan membangun kantor sementara lapangan.', 
    'persiapan', 
    'done', 
    'high', 
    (SELECT id FROM users WHERE email = 'sarah@proman.com' LIMIT 1), 
    'Sarah Jenkins', 
    CURRENT_DATE - INTERVAL '90 days', 
    CURRENT_DATE - INTERVAL '90 days', 
    2
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000203', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Galian Tanah Pondasi Footplat & Lajur', 
    'Pekerjaan galian tanah sedalam 1.5 meter untuk struktur pondasi.', 
    'sipil', 
    'done', 
    'high', 
    (SELECT id FROM users WHERE email = 'marcus@proman.com' LIMIT 1), 
    'Marcus Thorne', 
    CURRENT_DATE - INTERVAL '70 days', 
    CURRENT_DATE - INTERVAL '72 days', 
    3
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000204', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Pengecoran Pondasi & Kolom Struktur Utama', 
    'Pengecoran beton ready mix K-350 untuk pondasi tapak dan kolom struktur utama.', 
    'sipil', 
    'done', 
    'high', 
    (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1), 
    'Alex Kumar', 
    CURRENT_DATE - INTERVAL '50 days', 
    CURRENT_DATE - INTERVAL '48 days', 
    4
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000205', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Pekerjaan Pasangan Dinding Bata Ringan', 
    'Pemasangan bata ringan keliling luar dan sekat antar ruangan lantai 1.', 
    'sipil', 
    'done', 
    'medium', 
    (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1), 
    'Alex Kumar', 
    CURRENT_DATE - INTERVAL '30 days', 
    CURRENT_DATE - INTERVAL '30 days', 
    5
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000206', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Plasteran & Acian Dinding Area Belakang', 
    'Melakukan plasteran semen mortar dan acian halus pada dinding bata ringan.', 
    'sipil', 
    'in_progress', 
    'medium', 
    (SELECT id FROM users WHERE email = 'marcus@proman.com' LIMIT 1), 
    'Marcus Thorne', 
    CURRENT_DATE + INTERVAL '5 days', 
    NULL, 
    6
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000207', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Instalasi Pipa Conduit Kabel Power Utama', 
    'Penarikan pipa pelindung kabel listrik utama di area langit-langit.', 
    'mep', 
    'in_progress', 
    'high', 
    (SELECT id FROM users WHERE email = 'sarah@proman.com' LIMIT 1), 
    'Sarah Jenkins', 
    CURRENT_DATE + INTERVAL '10 days', 
    NULL, 
    7
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000208', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Pemasangan Ducting AC Cassette & Exhaust', 
    'Instalasi ducting pendingin ruangan dan exhaust fan untuk sirkulasi udara.', 
    'mep', 
    'in_progress', 
    'medium', 
    (SELECT id FROM users WHERE email = 'marcus@proman.com' LIMIT 1), 
    'Marcus Thorne', 
    CURRENT_DATE + INTERVAL '15 days', 
    NULL, 
    8
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000209', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Pemasangan Panel Listrik & Sub-Panel', 
    'Perakitan box panel MDP dan SDP beserta komponen MCB utama.', 
    'mep', 
    'review', 
    'high', 
    (SELECT id FROM users WHERE email = 'sarah@proman.com' LIMIT 1), 
    'Sarah Jenkins', 
    CURRENT_DATE - INTERVAL '2 days', -- Overdue
    NULL, 
    9
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000210', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Instalasi Jalur Fire Alarm & Sprinkler', 
    'Memasang pipa besi sprinkler merah dan sensor panas/asap kebakaran.', 
    'mep', 
    'todo', 
    'medium', 
    (SELECT id FROM users WHERE email = 'marcus@proman.com' LIMIT 1), 
    'Marcus Thorne', 
    CURRENT_DATE + INTERVAL '25 days', 
    NULL, 
    10
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000211', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Pemasangan Rangka Hollow Plafon Gypsum', 
    'Pemasangan besi hollow 2x4 dan 4x4 untuk dudukan papan plafon gypsum.', 
    'arsitektur', 
    'in_progress', 
    'medium', 
    (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1), 
    'Alex Kumar', 
    CURRENT_DATE + INTERVAL '12 days', 
    NULL, 
    11
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000212', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Pemasangan Keramik Homogenous Tile 60x60', 
    'Pemasangan keramik HT 60x60 di area showroom utama dengan adukan semen instan.', 
    'arsitektur', 
    'review', 
    'high', 
    (SELECT id FROM users WHERE email = 'alex@proman.com' LIMIT 1), 
    'Alex Kumar', 
    CURRENT_DATE - INTERVAL '5 days', -- Overdue
    NULL, 
    12
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000213', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Pemasangan Pintu Kaca & Partisi Aluminium', 
    'Pemasangan kusen aluminium dan kaca tempered 12mm pintu utama.', 
    'arsitektur', 
    'todo', 
    'low', 
    (SELECT id FROM users WHERE email = 'marcus@proman.com' LIMIT 1), 
    'Marcus Thorne', 
    CURRENT_DATE + INTERVAL '30 days', 
    NULL, 
    13
  ),
  (
    't1b8a9d2-e3a4-4f5b-8c6d-000000000214', 
    'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d', 
    'Pengecatan Dinding Cat Interior (Base Coat)', 
    'Aplikasi cat dasar sealer alkali resisting untuk menahan kelembaban dinding.', 
    'finishing', 
    'todo', 
    'low', 
    (SELECT id FROM users WHERE email = 'sarah@proman.com' LIMIT 1), 
    'Sarah Jenkins', 
    CURRENT_DATE + INTERVAL '40 days', 
    NULL, 
    14
  )
ON CONFLICT (id) DO NOTHING;

-- 8. Update stats counts in projects table
UPDATE projects
SET 
  total_tasks = 14,
  completed_tasks = 5
WHERE id = 'p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d';
