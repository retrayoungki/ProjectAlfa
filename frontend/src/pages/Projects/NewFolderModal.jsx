import React, { useState } from 'react';
import { X, Folder } from 'lucide-react';

const COLORS = [
  { id: 'blue', primary: '#3B82F6', label: 'Blue' },
  { id: 'amber', primary: '#F59E0B', label: 'Amber' },
  { id: 'green', primary: '#10B981', label: 'Green' },
  { id: 'purple', primary: '#8B5CF6', label: 'Purple' },
  { id: 'red', primary: '#EF4444', label: 'Red' },
  { id: 'gray', primary: '#6B7280', label: 'Gray' }
];

export default function NewFolderModal({ onSubmit, onClose }) {
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('blue');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!folderName.trim()) {
      alert('Nama folder wajib diisi!');
      return;
    }
    onSubmit({
      folder_name: folderName.trim(),
      folder_color: folderColor
    });
  };

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
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: 24
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Buat Folder Baru</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Folder Name Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Nama Folder *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Laporan Keuangan..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              style={{
                padding: '10px 14px',
                fontSize: 13.5,
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
                background: '#fff',
                width: '100%'
              }}
            />
          </div>

          {/* Color Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Warna Folder</label>
            
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 4 }}>
              {COLORS.map(c => {
                const isSelected = folderColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFolderColor(c.id)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: c.primary,
                      border: isSelected ? '3px solid #000' : '2px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: isSelected ? '0 0 0 2px rgba(255,255,255,1)' : 'none',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.1s ease-out'
                    }}
                    title={c.label}
                  >
                    <Folder size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}
            >
              Batal
            </button>
            <button
              type="submit"
              style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 8 }}
            >
              Buat Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
