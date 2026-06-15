import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, CheckCircle } from 'lucide-react';

export default function TerminStatusModal({ isOpen, onClose, onConfirm, termin, targetStatus }) {
  const [dateField, setDateField] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set default date to today in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      setDateField(today);
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen || !termin) return null;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleConfirmClick = (e) => {
    e.preventDefault();
    onConfirm(termin.id, targetStatus, dateField, notes);
  };

  const renderContent = () => {
    switch (targetStatus) {
      case 'submitted':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin mengajukan <strong>{termin.termin_label || `Termin ${termin.termin_number}`}</strong> untuk proyek <strong>{termin.project_name}</strong>?
            </p>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-subtle)' }}>Nilai Termin:</span>
                <span style={{ fontWeight: 600 }}>{formatRupiah(termin.nilai_termin)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: 'var(--text-subtle)' }}>Netto Cair:</span>
                <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{formatRupiah(termin.netto_cair)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
                Batal
              </button>
              <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleConfirmClick}>
                Ajukan Sekarang
              </button>
            </div>
          </div>
        );

      case 'approved':
        return (
          <form onSubmit={handleConfirmClick} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>
              Persetujuan untuk <strong>{termin.termin_label || `Termin ${termin.termin_number}`}</strong> — <strong>{termin.project_name}</strong>.
            </p>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-subtle)' }}>Nilai Termin:</span>
                <span style={{ fontWeight: 600 }}>{formatRupiah(termin.nilai_termin)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: 'var(--text-subtle)' }}>Netto Cair:</span>
                <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{formatRupiah(termin.netto_cair)}</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                Tanggal Approval *
              </label>
              <input
                type="date"
                required
                className="form-input"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                value={dateField}
                onChange={e => setDateField(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Approve
              </button>
            </div>
          </form>
        );

      case 'paid':
        return (
          <form onSubmit={handleConfirmClick} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#ECFDF5', borderRadius: 8, padding: 12, border: '1px solid #A7F3D0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#047857' }}>KONFIRMASI PENERIMAAN DANA</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#065F46' }}>
                Netto yang diterima: {formatRupiah(termin.netto_cair)}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                Tanggal Bayar (Kas Masuk) *
              </label>
              <input
                type="date"
                required
                className="form-input"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                value={dateField}
                onChange={e => setDateField(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                Catatan Pembayaran (Opsional)
              </label>
              <textarea
                placeholder="Misal: Diterima via Bank Mandiri No. Ref..."
                className="form-input"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', minHeight: 60, resize: 'vertical' }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#10B981', borderColor: '#10B981' }}>
                Konfirmasi Pembayaran
              </button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    if (targetStatus === 'submitted') return 'Ajukan Termin';
    if (targetStatus === 'approved') return 'Approve Termin';
    if (targetStatus === 'paid') return 'Tandai Paid';
    return 'Update Status Termin';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{ width: 440, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: 'var(--navy)' }}>{getTitle()}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
}
