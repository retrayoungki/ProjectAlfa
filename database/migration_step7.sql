-- Migration Step 7: Halaman Manajemen Client (Menu Clients)

-- Tabel clients (owner/pemberi kerja)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  client_type VARCHAR(30) DEFAULT 'other', -- retail | mall | office | industrial | government | other
  pic_name VARCHAR(100),
  pic_position VARCHAR(100),
  pic_phone VARCHAR(20),
  pic_email VARCHAR(100),
  pic_2_name VARCHAR(100),
  pic_2_phone VARCHAR(20),
  pic_2_email VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  npwp VARCHAR(30),
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  bank_account_name VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backwards compatibility fields mapping
ALTER TABLE clients ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company VARCHAR(255);
