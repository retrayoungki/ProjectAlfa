import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Clock, Calendar } from 'lucide-react';

export default function MilestoneList({ milestones, projectId, canEdit, onStatusChange }) {
  const sortedMilestones = [...milestones].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getQueryDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'done':
        return {
          icon: <CheckCircle2 size={20} style={{ color: '#10B981', fill: '#E6F4EA' }} />,
          label: 'Selesai',
          badgeStyle: { background: '#ECFDF5', color: '#059669' },
          textStyle: { color: 'var(--text-muted)', textDecoration: 'line-through' }
        };
      case 'in_progress':
        return {
          icon: (
            <Loader2 
              size={20} 
              style={{ 
                color: 'var(--blue)', 
                animation: 'spin-fast 2s linear infinite' 
              }} 
            />
          ),
          label: 'Dalam Proses',
          badgeStyle: { background: '#EEF4FF', color: 'var(--blue)' },
          textStyle: { color: 'var(--navy)', fontWeight: 700 }
        };
      case 'pending':
      default:
        return {
          icon: <Clock size={20} style={{ color: '#94A3B8' }} />,
          label: 'Belum Mulai',
          badgeStyle: { background: 'var(--bg)', color: 'var(--text-muted)' },
          textStyle: { color: 'var(--text)' }
        };
    }
  };

  const handleIconClick = (milestone) => {
    if (!canEdit) return;
    const cycle = {
      pending: 'in_progress',
      in_progress: 'done',
      done: 'pending'
    };
    const nextStatus = cycle[milestone.status] || 'pending';
    onStatusChange(milestone.id, nextStatus);
  };

  return (
    <div>
      <style>{`
        @keyframes spin-fast {
          to { transform: rotate(360deg); }
        }
        .milestone-container:hover .milestone-interactive-icon {
          transform: scale(1.15);
          box-shadow: 0 0 8px rgba(58, 123, 255, 0.25);
          border-radius: 50%;
        }
      `}</style>
      
      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 18 }}>
        Milestone & Jadwal Rencana
      </h3>

      {sortedMilestones.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', padding: '20px 0' }}>
          Belum ada milestone yang terdaftar untuk proyek ini.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {sortedMilestones.map((ms, index) => {
            const { icon, label, badgeStyle, textStyle } = getStatusDetails(ms.status);
            const isLast = index === sortedMilestones.length - 1;

            return (
              <div key={ms.id || index} className="milestone-item" style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: 'none' }}>
                {/* Vertical Line and Dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                  <div
                    onClick={() => handleIconClick(ms)}
                    className={canEdit ? 'milestone-container' : ''}
                    style={{
                      cursor: canEdit ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      zIndex: 2,
                      transition: 'transform 0.2s ease'
                    }}
                    title={canEdit ? `Ubah status (Saat ini: ${label})` : label}
                  >
                    <div className="milestone-interactive-icon" style={{ display: 'flex', transition: 'all 0.2s ease' }}>
                      {icon}
                    </div>
                  </div>
                  {!isLast && (
                    <div
                      style={{
                        width: 2,
                        flexGrow: 1,
                        background: ms.status === 'done' ? '#10B981' : 'var(--border)',
                        marginTop: 4,
                        minHeight: 30,
                        zIndex: 1
                      }}
                    />
                  )}
                </div>

                {/* Milestone Details */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14.5, ...textStyle }}>
                      {ms.milestoneName}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span
                        className="badge"
                        style={{
                          ...badgeStyle,
                          padding: '2px 8px',
                          fontSize: 10,
                          fontWeight: 700,
                          borderRadius: 4
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} /> Target:{' '}
                      {ms.targetDate ? (
                        <Link
                          to={`/calendar?date=${getQueryDate(ms.targetDate)}`}
                          style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}
                          title="Lihat di Kalender"
                        >
                          {formatDateIndo(ms.targetDate)}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </span>
                    {ms.actualDate && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600 }}>
                        &bull; Riil Selesai: {formatDateIndo(ms.actualDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
