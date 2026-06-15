import React, { useState } from 'react';
import { useTeamQuery } from '../../hooks/useTeam';
import { X, UserPlus, Loader2 } from 'lucide-react';

export default function AddMemberModal({ isOpen, onClose, onAdd, existingUserIds }) {
  const { data: systemUsers, isLoading, isError } = useTeamQuery();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [roleInProject, setRoleInProject] = useState('site_manager');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter out users who are already members of this project
  const availableUsers = systemUsers
    ? systemUsers.filter(user => !existingUserIds.includes(user.id))
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert('Silakan pilih anggota tim terlebih dahulu.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onAdd(selectedUserId, roleInProject);
      setSelectedUserId('');
      setRoleInProject('site_manager');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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
          maxWidth: 440,
          background: 'var(--surface)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-md)',
          padding: 24,
          position: 'relative',
          margin: 16
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={18} color="var(--blue)" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
              Tambah Anggota Tim
            </h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-subtle)', 
              cursor: 'pointer',
              display: 'flex',
              padding: 4,
              borderRadius: 6
            }}
            className="btn-ghost"
          >
            <X size={18} />
          </button>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-subtle)' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--blue)', animation: 'spin-fast 1s linear infinite' }} />
            <p style={{ fontSize: 13 }}>Memuat daftar user...</p>
          </div>
        ) : isError ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
            Gagal mengambil daftar user dari sistem.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* User Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                PILIH ANGGOTA
              </label>
              {availableUsers.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', background: 'var(--bg)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  Semua user sistem sudah tergabung dalam proyek ini.
                </div>
              ) : (
                <select
                  className="input-field"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{ width: '100%', height: 40, borderRadius: 8 }}
                  required
                >
                  <option value="">-- Pilih User --</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Role Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                ROLE DALAM PROYEK
              </label>
              <select
                className="input-field"
                value={roleInProject}
                onChange={(e) => setRoleInProject(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              >
                <option value="pm">Project Manager (PM)</option>
                <option value="site_manager">Site Manager</option>
                <option value="finance">Finance</option>
                <option value="drafter">Drafter</option>
                <option value="mandor">Mandor</option>
                <option value="subkon">Subkontraktor</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={isSubmitting}
                style={{ borderRadius: 8 }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitting || !selectedUserId}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin-fast 1s linear infinite' }} />
                    Menyimpan...
                  </>
                ) : (
                  <>Tambah</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
