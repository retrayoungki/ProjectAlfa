import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, project, onClose, onConfirm, isDeleting }) {
  if (!isOpen || !project) return null;

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
          width: '450px',
          maxWidth: '100%',
          background: 'var(--surface)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          className="flex-between"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={20} color="#DC2626" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#DC2626', margin: 0 }}>
              Hapus Proyek
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-subtle)',
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
            Hapus proyek <strong>{project.projectName || project.name}</strong>? Semua tasks dan dokumen terkait akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            background: 'var(--bg)'
          }}
        >
          <button
            className="btn btn-secondary btn-sm"
            disabled={isDeleting}
            onClick={onClose}
          >
            Batal
          </button>
          <button
            className="btn btn-danger btn-sm"
            style={{
              background: '#DC2626',
              borderColor: '#DC2626',
              color: '#fff',
              fontWeight: 600
            }}
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}
