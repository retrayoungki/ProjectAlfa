import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';

export default function RetensiModal({ isOpen, onClose, onConfirm, currentRetensiCair = 0, totalRetensi = 0 }) {
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(currentRetensiCair);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, currentRetensiCair]);

  if (!isOpen) return null;

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
      await onConfirm(amount, date);
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
              Catat Retensi Cair
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
            fontSize: 12, 
            background: '#ECFDF5', 
            color: '#047857', 
            padding: 10, 
            borderRadius: 8, 
            border: '1px solid #D1FAE5',
            marginBottom: 16
          }}
        >
          <span>Retensi ditahan saat ini: <strong>{formatRupiah(totalRetensi)}</strong></span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Amount input */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              JUMLAH RETENSI CAIR (RP)*
            </label>
            <input
              type="text"
              className="input-field"
              value={amount ? new Intl.NumberFormat('id-ID').format(amount) : ''}
              onChange={handleAmountChange}
              placeholder="Contoh: 112.500.000"
              required
            />
          </div>

          {/* Date input */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              TANGGAL PENCAIRAN*
            </label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
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
              style={{ background: '#059669', color: 'white' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" style={{ animation: 'spin-fast 1s linear infinite' }} />
                  Menyimpan...
                </>
              ) : (
                <>Simpan</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
