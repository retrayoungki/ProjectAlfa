import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';

export default function RetensModal({ isOpen, onClose, onConfirm, project }) {
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      // Default to remaining retensi: total - cair
      const sisa = Math.max(0, (project.retensi_total || 0) - (project.retensi_cair || 0));
      setAmount(sisa);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const handleAmountChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const numVal = parseInt(rawVal, 10) || 0;
    setAmount(numVal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount < 0) {
      alert('Jumlah retensi cair tidak boleh negatif.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onConfirm(project.project_id, amount, date);
      onClose();
    } catch (err) {
      alert(err.message || 'Gagal mencatat retensi cair');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        @keyframes spin-fast {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div 
        className="card modal-card" 
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--surface)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-md)',
          padding: 24,
          position: 'relative',
          margin: 16
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color="#059669" />
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
              Catat Pencairan Retensi
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

        {/* Modal Info */}
        <div 
          style={{ 
            fontSize: 12.5, 
            background: 'var(--bg)', 
            color: 'var(--text)', 
            padding: 12, 
            borderRadius: 8, 
            border: '1px solid var(--border)',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div>Proyek: <strong>{project.project_name}</strong></div>
          <div>Client: <strong>{project.client_name}</strong></div>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
            <span>Total Retensi:</span>
            <strong>{formatRupiah(project.retensi_total)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-subtle)' }}>
            <span>Sudah Cair:</span>
            <span>{formatRupiah(project.retensi_cair)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309', fontWeight: 600 }}>
            <span>Sisa Retensi:</span>
            <span>{formatRupiah(project.retensi_sisa)}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Amount input */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              JUMLAH PENCAIRAN RETENSI (RP)*
            </label>
            <input
              type="text"
              className="input-field"
              value={amount ? new Intl.NumberFormat('id-ID').format(amount) : ''}
              onChange={handleAmountChange}
              placeholder="Contoh: 112.500.000"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)'
              }}
            />
          </div>

          {/* Date input */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              TANGGAL CAIR*
            </label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)'
              }}
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
              style={{ background: '#059669', borderColor: '#059669', color: 'white' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin-fast 1s linear infinite', marginRight: 4 }} />
                  Menyimpan...
                </>
              ) : (
                <>Simpan Pencairan</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
