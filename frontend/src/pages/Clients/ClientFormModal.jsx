import React, { useState, useEffect } from 'react';
import { X, Building, User, CreditCard } from 'lucide-react';

const CLIENT_TYPES = [
  { value: 'retail', label: 'Retail / Store' },
  { value: 'mall', label: 'Mall / GTC' },
  { value: 'office', label: 'Perkantoran' },
  { value: 'industrial', label: 'Industri / Pabrik' },
  { value: 'government', label: 'Pemerintah' },
  { value: 'other', label: 'Lainnya' }
];

export default function ClientFormModal({ isOpen, client, onClose, onSubmit, isSubmitting }) {
  const [activeTab, setActiveTab] = useState(1);
  const [errors, setErrors] = useState({});

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [shortName, setShortName] = useState('');
  const [clientType, setClientType] = useState('other');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [npwp, setNpwp] = useState('');

  const [picName, setPicName] = useState('');
  const [picPosition, setPicPosition] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [picEmail, setPicEmail] = useState('');
  const [pic2Name, setPic2Name] = useState('');
  const [pic2Phone, setPic2Phone] = useState('');
  const [pic2Email, setPic2Email] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (client) {
      setCompanyName(client.company_name || '');
      setShortName(client.short_name || '');
      setClientType(client.client_type || 'other');
      setCity(client.city || '');
      setProvince(client.province || '');
      setAddress(client.address || '');
      setNpwp(client.npwp || '');

      setPicName(client.pic_name || '');
      setPicPosition(client.pic_position || '');
      setPicPhone(client.pic_phone || '');
      setPicEmail(client.pic_email || '');
      setPic2Name(client.pic_2_name || '');
      setPic2Phone(client.pic_2_phone || '');
      setPic2Email(client.pic_2_email || '');
      setPhone(client.phone || '');
      setEmail(client.email || '');

      setBankName(client.bank_name || '');
      setBankAccount(client.bank_account || '');
      setBankAccountName(client.bank_account_name || '');
      setNotes(client.notes || '');
    } else {
      // Reset
      setCompanyName('');
      setShortName('');
      setClientType('other');
      setCity('');
      setProvince('');
      setAddress('');
      setNpwp('');

      setPicName('');
      setPicPosition('');
      setPicPhone('');
      setPicEmail('');
      setPic2Name('');
      setPic2Phone('');
      setPic2Email('');
      setPhone('');
      setEmail('');

      setBankName('');
      setBankAccount('');
      setBankAccountName('');
      setNotes('');
    }
    setActiveTab(1);
    setErrors({});
  }, [client, isOpen]);

  // NPWP Masking helper (format: XX.XXX.XXX.X-XXX.XXX)
  const handleNpwpChange = (value) => {
    const numbers = value.replace(/[^0-9]/g, '');
    let formatted = '';
    
    for (let i = 0; i < numbers.length; i++) {
      if (i === 2 || i === 5 || i === 8) formatted += '.';
      else if (i === 9) formatted += '-';
      else if (i === 12) formatted += '.';
      formatted += numbers[i];
    }
    setNpwp(formatted.substring(0, 20));
  };

  const validate = () => {
    const errs = {};
    if (!companyName.trim()) errs.companyName = 'Nama Resmi Perusahaan wajib diisi';
    if (!clientType) errs.clientType = 'Tipe Client wajib diisi';
    if (!picName.trim()) errs.picName = 'Nama PIC Utama wajib diisi';
    if (!picPhone.trim()) errs.picPhone = 'Nomor HP PIC Utama wajib diisi';

    if (picEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(picEmail)) {
      errs.picEmail = 'Format Email PIC Utama tidak valid';
    }
    if (pic2Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pic2Email)) {
      errs.pic2Email = 'Format Email PIC Kedua tidak valid';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Format Email Perusahaan tidak valid';
    }

    if (npwp && npwp.replace(/[^0-9]/g, '').length < 15) {
      errs.npwp = 'Format NPWP tidak lengkap (harus 15 digit)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) {
      // Automatically switch to the tab that contains the error
      if (errors.companyName || errors.clientType || errors.npwp) {
        setActiveTab(1);
      } else {
        setActiveTab(2);
      }
      return;
    }

    onSubmit({
      company_name: companyName,
      short_name: shortName,
      client_type: clientType,
      city,
      province,
      address,
      npwp,
      pic_name: picName,
      pic_position: picPosition,
      pic_phone: picPhone,
      pic_email: picEmail || null,
      pic_2_name: pic2Name || null,
      pic_2_phone: pic2Phone || null,
      pic_2_email: pic2Email || null,
      phone,
      email: email || null,
      bank_name: bankName,
      bank_account: bankAccount,
      bank_account_name: bankAccountName,
      notes
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16
      }}
    >
      <div
        className="card"
        style={{
          width: '720px',
          maxWidth: '100%',
          maxHeight: '92vh',
          background: 'var(--surface)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
            {client ? 'Edit Data Client' : 'Tambah Client Baru'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Header / Stepper */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
          {[
            { id: 1, label: '1. Profil Perusahaan', icon: <Building size={14} /> },
            { id: 2, label: '2. Data PIC & Kontak', icon: <User size={14} /> },
            { id: 3, label: '3. Data Bank & Catatan', icon: <CreditCard size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '14px',
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
                color: activeTab === tab.id ? 'var(--blue)' : 'var(--text-subtle)',
                borderBottom: activeTab === tab.id ? '3px solid var(--blue)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* ── BAGIAN 1: INFORMASI PERUSAHAAN ── */}
            {activeTab === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Nama Resmi Perusahaan *
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.companyName ? 'border-red' : ''}`}
                    placeholder="Contoh: PT Tianlala Retail Nusantara"
                    style={{ width: '100%' }}
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                  />
                  {errors.companyName && <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.companyName}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Nama Alias / Singkatan
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Tianlala"
                      style={{ width: '100%' }}
                      value={shortName}
                      onChange={e => setShortName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Tipe Industri Client *
                    </label>
                    <select
                      className="form-input"
                      style={{ width: '100%', height: 38 }}
                      value={clientType}
                      onChange={e => setClientType(e.target.value)}
                    >
                      {CLIENT_TYPES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Kota
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Jakarta Selatan"
                      style={{ width: '100%' }}
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Provinsi
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: DKI Jakarta"
                      style={{ width: '100%' }}
                      value={province}
                      onChange={e => setProvince(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Alamat Lengkap Perusahaan
                  </label>
                  <textarea
                    className="form-input"
                    placeholder="Masukkan alamat lengkap kantor..."
                    style={{ width: '100%', height: 70, resize: 'none' }}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Nomor NPWP Perusahaan
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.npwp ? 'border-red' : ''}`}
                    placeholder="00.000.000.0-000.000"
                    style={{ width: '100%', fontFamily: 'monospace', letterSpacing: '1px' }}
                    value={npwp}
                    onChange={e => handleNpwpChange(e.target.value)}
                  />
                  {errors.npwp && <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.npwp}</span>}
                </div>
              </div>
            )}

            {/* ── BAGIAN 2: DATA PIC & KONTAK ── */}
            {activeTab === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* PIC UTAMA */}
                <h4 style={{ margin: '0 0 4px 0', fontSize: 13.5, fontWeight: 800, color: 'var(--blue)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  PIC Utama (Wajib)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Nama Lengkap PIC *
                    </label>
                    <input
                      type="text"
                      className={`form-input ${errors.picName ? 'border-red' : ''}`}
                      placeholder="Contoh: Budi Santoso"
                      style={{ width: '100%' }}
                      value={picName}
                      onChange={e => setPicName(e.target.value)}
                    />
                    {errors.picName && <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.picName}</span>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Jabatan PIC
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Project Manager"
                      style={{ width: '100%' }}
                      value={picPosition}
                      onChange={e => setPicPosition(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Nomor HP/Telepon PIC *
                    </label>
                    <input
                      type="text"
                      className={`form-input ${errors.picPhone ? 'border-red' : ''}`}
                      placeholder="Contoh: 08123456789"
                      style={{ width: '100%' }}
                      value={picPhone}
                      onChange={e => setPicPhone(e.target.value)}
                    />
                    {errors.picPhone && <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.picPhone}</span>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Email PIC
                    </label>
                    <input
                      type="text"
                      className={`form-input ${errors.picEmail ? 'border-red' : ''}`}
                      placeholder="Contoh: budi@client.com"
                      style={{ width: '100%' }}
                      value={picEmail}
                      onChange={e => setPicEmail(e.target.value)}
                    />
                    {errors.picEmail && <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.picEmail}</span>}
                  </div>
                </div>

                {/* PIC KEDUA */}
                <h4 style={{ margin: '12px 0 4px 0', fontSize: 13.5, fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  PIC Kedua (Opsional)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Nama PIC Kedua
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Masukkan nama PIC kedua"
                      style={{ width: '100%' }}
                      value={pic2Name}
                      onChange={e => setPic2Name(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Nomor HP PIC Kedua
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Masukkan No. HP"
                      style={{ width: '100%' }}
                      value={pic2Phone}
                      onChange={e => setPic2Phone(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Email PIC Kedua
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.pic2Email ? 'border-red' : ''}`}
                    placeholder="email@client2.com"
                    style={{ width: '100%' }}
                    value={pic2Email}
                    onChange={e => setPic2Email(e.target.value)}
                  />
                  {errors.pic2Email && <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.pic2Email}</span>}
                </div>

                {/* KONTAK UMUM KANTOR */}
                <h4 style={{ margin: '12px 0 4px 0', fontSize: 13.5, fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  Kontak Umum Kantor
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Telepon Kantor
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: 021-5550100"
                      style={{ width: '100%' }}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Email Umum Kantor
                    </label>
                    <input
                      type="text"
                      className={`form-input ${errors.email ? 'border-red' : ''}`}
                      placeholder="Contoh: office@company.com"
                      style={{ width: '100%' }}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    {errors.email && <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.email}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* ── BAGIAN 3: DATA BANK & CATATAN ── */}
            {activeTab === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Nama Bank Pembayaran
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Bank Central Asia (BCA)"
                    style={{ width: '100%' }}
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Nomor Rekening Bank
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: 123-456-7890"
                      style={{ width: '100%' }}
                      value={bankAccount}
                      onChange={e => setBankAccount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Nama Pemilik Rekening (A.N.)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: PT Tianlala Retail Nusantara"
                      style={{ width: '100%' }}
                      value={bankAccountName}
                      onChange={e => setBankAccountName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Catatan Internal / Tambahan tentang Client
                  </label>
                  <textarea
                    className="form-input"
                    placeholder="Masukkan catatan negosiasi, syarat pembayaran, atau informasi internal lainnya..."
                    style={{ width: '100%', height: 110, resize: 'none' }}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <div>
              {activeTab > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab(activeTab - 1)}
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  Kembali
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Batal
              </button>
              
              {activeTab < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (activeTab === 1) {
                      if (!companyName.trim() || !clientType) {
                        validate();
                        return;
                      }
                    } else if (activeTab === 2) {
                      if (!picName.trim() || !picPhone.trim()) {
                        validate();
                        return;
                      }
                    }
                    setActiveTab(activeTab + 1);
                  }}
                >
                  Lanjut
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
