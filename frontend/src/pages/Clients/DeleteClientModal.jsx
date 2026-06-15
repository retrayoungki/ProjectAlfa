import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function DeleteClientModal({ isOpen, client, onClose, onConfirm, isDeleting }) {
  if (!isOpen || !client) return null;

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
          width: '440px',
          maxWidth: '100%',
          background: 'var(--surface)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-subtle)',
            display: 'flex'
          }}
        >
          <X size={18} />
        </button>

        {/* Warning Icon & Title */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginTop: 8 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px 0' }}>
              Nonaktifkan client {client.company_name}?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-subtle)', lineHeight: 1.5, margin: 0 }}>
              Client tidak akan dihapus permanen — hanya dinonaktifkan dan tidak akan muncul di dropdown proyek baru. Riwayat proyek yang sudah ada tetap tersimpan secara historis.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 24,
            borderTop: '1px solid var(--border)',
            paddingTop: 16
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn"
            style={{
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 6,
              fontWeight: 700,
              cursor: isDeleting ? 'not-allowed' : 'pointer'
            }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Menonaktifkan...' : 'Nonaktifkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
