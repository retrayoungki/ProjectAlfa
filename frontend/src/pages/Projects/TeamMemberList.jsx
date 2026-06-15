import React, { useState } from 'react';
import { UserPlus, Trash2, Mail, Calendar } from 'lucide-react';
import AddMemberModal from './AddMemberModal';

const ROLE_DETAILS = {
  pm: { label: 'Project Manager (PM)', class: 'avatar-blue', badgeBg: '#EEF4FF', badgeColor: 'var(--blue)' },
  site_manager: { label: 'Site Manager', class: 'avatar-green', badgeBg: '#ECFDF5', badgeColor: '#059669' },
  finance: { label: 'Finance', class: 'avatar-amber', badgeBg: '#FEF3C7', badgeColor: '#D97706' },
  drafter: { label: 'Drafter', class: 'avatar-purple', badgeBg: '#F3E8FF', badgeColor: '#7C3AED' },
  mandor: { label: 'Mandor / Pelaksana', class: 'avatar-red', badgeBg: '#FEE2E2', badgeColor: '#DC2626' },
  subkon: { label: 'Subkontraktor', class: 'avatar-teal', badgeBg: '#E0F2F1', badgeColor: '#00796B' },
  other: { label: 'Lainnya', class: 'avatar-teal', badgeBg: 'var(--bg)', badgeColor: 'var(--text-muted)' }
};

export default function TeamMemberList({ members, projectId, canManage, onAddMember, onRemoveMember }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getInitials = (name) => {
    return (name || '').split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const existingUserIds = members.map(m => m.userId);

  return (
    <div>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
            Tim & Pelaksana Proyek
          </h3>
          <p className="text-xs text-muted" style={{ margin: '4px 0 0 0' }}>
            Daftar personil yang ditugaskan ke proyek konstruksi ini.
          </p>
        </div>
        {canManage && (
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <UserPlus size={14} /> Tambah Anggota
          </button>
        )}
      </div>

      {/* Member Table */}
      {members.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', padding: '30px 0' }}>
          Belum ada anggota tim yang ditugaskan untuk proyek ini.
        </p>
      ) : (
        <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>ANGGOTA TIM</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>ROLE PROYEK</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>TANGGAL BERGABUNG</th>
                {canManage && <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>AKSI</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const u = member.user || {};
                const name = u.name || 'Unknown User';
                const email = u.email || '-';
                const roleKey = (member.roleInProject || 'other').toLowerCase();
                const roleConfig = ROLE_DETAILS[roleKey] || ROLE_DETAILS.other;

                return (
                  <tr key={member.id || member.userId} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    {/* User Profile Card Column */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div 
                          className={`avatar ${roleConfig.class}`} 
                          style={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'white',
                            flexShrink: 0
                          }}
                        >
                          {getInitials(name)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--navy)' }}>{name}</span>
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Mail size={11} /> {email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role Column */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <span 
                        className="badge" 
                        style={{ 
                          background: roleConfig.badgeBg, 
                          color: roleConfig.badgeColor,
                          padding: '3px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 4
                        }}
                      >
                        {roleConfig.label}
                      </span>
                    </td>

                    {/* Joined Date Column */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 13, color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} /> {formatDateIndo(member.joinedAt)}
                      </span>
                    </td>

                    {/* Action Column */}
                    {canManage && (
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => {
                            if (confirm(`Hapus ${name} dari tim proyek ini?`)) {
                              onRemoveMember(member.userId);
                            }
                          }}
                          style={{ 
                            color: 'var(--red)', 
                            padding: 6, 
                            borderRadius: 6, 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}
                          title="Hapus Anggota"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Popup Modal */}
      <AddMemberModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={onAddMember}
        existingUserIds={existingUserIds}
      />
    </div>
  );
}
