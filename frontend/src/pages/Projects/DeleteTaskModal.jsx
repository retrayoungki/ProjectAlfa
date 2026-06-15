import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteTaskModal({ task, onConfirm, onClose }) {
  if (!task) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 12,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        padding: 24,
        position: 'relative'
      }}>
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
            color: 'var(--text-muted)'
          }}
        >
          <X size={18} />
        </button>

        {/* Warning Icon */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#FEF2F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#EF4444',
          marginBottom: 16
        }}>
          <AlertTriangle size={24} />
        </div>

        {/* Title & Description */}
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px 0' }}>
          Hapus Task?
        </h3>
        <p style={{ fontSize: 13.5, color: 'var(--text)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Hapus task <strong>"{task.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(task.id)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: '#E24B4A',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
