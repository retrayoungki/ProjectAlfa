import React, { useState, useEffect } from 'react';
import { X, DollarSign, Loader2 } from 'lucide-react';

export default function TerminFormModal({ isOpen, onClose, onSubmit, termin = null }) {
  const [terminNumber, setTerminNumber] = useState('');
  const [terminLabel, setTerminLabel] = useState('');
  const [percentage, setPercentage] = useState('');
  const [nilaiTermin, setNilaiTermin] = useState(0);
  const [retensiPct, setRetensiPct] = useState(5);
  const [submittedDate, setSubmittedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form if editing an existing termin
  useEffect(() => {
    if (termin) {
      setTerminNumber(termin.terminNumber || '');
      setTerminLabel(termin.terminLabel || '');
      setPercentage(termin.percentage !== null && termin.percentage !== undefined ? termin.percentage : '');
      setNilaiTermin(termin.nilaiTermin || 0);
      setRetensiPct(termin.retensiPct !== null && termin.retensiPct !== undefined ? termin.retensiPct : 5);
      setSubmittedDate(termin.submittedDate ? new Date(termin.submittedDate).toISOString().split('T')[0] : '');
      setNotes(termin.notes || '');
    } else {
      // Clear form for new termin
      setTerminNumber('');
      setTerminLabel('');
      setPercentage('');
      setNilaiTermin(0);
      setRetensiPct(5);
      setSubmittedDate('');
      setNotes('');
    }
  }, [termin, isOpen]);

  if (!isOpen) return null;

  // Real-time calculations
  const retensiAmount = Math.round(nilaiTermin * (retensiPct / 100));
  const nettoCair = nilaiTermin - retensiAmount;

  const handleNilaiChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const numVal = parseInt(rawVal, 10) || 0;
    setNilaiTermin(numVal);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!terminNumber || !nilaiTermin) {
      alert('Nomor termin dan nilai termin wajib diisi.');
      return;
    }
    
    const data = {
      termin_number: parseInt(terminNumber, 10),
      termin_label: terminLabel,
      percentage: percentage !== '' ? parseFloat(percentage) : null,
      nilai_termin: nilaiTermin,
      retensi_pct: parseFloat(retensiPct),
      submitted_date: submittedDate || null,
      notes
    };

    try {
      setIsSubmitting(true);
      await onSubmit(data);
      onClose();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan termin');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper formatting rupiah
  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 31, 58, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-card {
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media(max-width: 480px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div 
        className="card modal-card" 
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--surface)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-md)',
          padding: 24,
          position: 'relative',
          margin: 16,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={18} color="var(--blue)" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
              {termin ? 'Edit Termin Penagihan' : 'Tambah Termin Penagihan'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="btn-ghost"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-subtle)', 
              cursor: 'pointer',
              display: 'flex',
              padding: 4,
              borderRadius: 6
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          <div className="form-grid-2">
            {/* Termin Number */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                NO. TERMIN*
              </label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={terminNumber}
                onChange={(e) => setTerminNumber(e.target.value)}
                placeholder="Contoh: 1"
                disabled={termin !== null} // Cannot change termin number after creation to avoid unique violation
                required
              />
            </div>

            {/* Percentage */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                PERSENTASE (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="input-field"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="Contoh: 30"
              />
            </div>
          </div>

          {/* Label Termin */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              LABEL TERMIN*
            </label>
            <input
              type="text"
              className="input-field"
              value={terminLabel}
              onChange={(e) => setTerminLabel(e.target.value)}
              placeholder="Contoh: Termin 1 — Uang Muka 30%"
              required
            />
          </div>

          {/* Nilai Termin */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              NILAI TERMIN (RP)*
            </label>
            <input
              type="text"
              className="input-field"
              value={nilaiTermin ? new Intl.NumberFormat('id-ID').format(nilaiTermin) : ''}
              onChange={handleNilaiChange}
              placeholder="Contoh: 2.250.000.000"
              required
            />
            {nilaiTermin > 0 && (
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Terbilang: {formatRupiah(nilaiTermin)}
              </span>
            )}
          </div>

          <div className="form-grid-2">
            {/* Retensi Pct */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                RETENSI (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                className="input-field"
                value={retensiPct}
                onChange={(e) => setRetensiPct(e.target.value)}
                placeholder="Contoh: 5"
              />
            </div>

            {/* Submitted Date */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                TANGGAL PENGAJUAN
              </label>
              <input
                type="date"
                className="input-field"
                value={submittedDate}
                onChange={(e) => setSubmittedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Calculations Summary */}
          <div 
            style={{ 
              background: 'var(--bg)', 
              borderRadius: 8, 
              padding: 12, 
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 12.5
            }}
          >
            <div className="flex-between">
              <span className="text-muted">Retensi Ditahan ({retensiPct}%):</span>
              <span style={{ fontWeight: 600, color: 'var(--red)' }}>
                {formatRupiah(retensiAmount)}
              </span>
            </div>
            <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontWeight: 700 }}>
              <span className="text-navy">Netto Penerimaan Cair:</span>
              <span style={{ color: '#059669' }}>
                {formatRupiah(nettoCair)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              CATATAN
            </label>
            <textarea
              className="input-field"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan penagihan..."
              style={{ height: 60, resize: 'none', padding: '8px 12px' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting || !nilaiTermin || !terminNumber}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin-fast 1s linear infinite' }} />
                  Menyimpan...
                </>
              ) : (
                <>{termin ? 'Simpan Perubahan' : 'Tambah Termin'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
