import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Clock, Briefcase, Info, AlertTriangle, ExternalLink } from 'lucide-react';

const TYPE_COLORS = {
  deadline: { bg: '#FEF2F2', text: '#EF4444', label: 'Deadline Kontrak' },
  milestone: { bg: '#EAF3DE', text: '#3B6D11', label: 'Milestone Proyek' },
  task: { bg: '#E6F1FB', text: '#185FA5', label: 'Tugas Pekerjaan' },
  termin: { bg: '#FAEEDA', text: '#854F0B', label: 'Jadwal Termin' },
  meeting: { bg: '#EEEDFE', text: '#534AB7', label: 'Rapat / Kegiatan' }
};

export default function EventDetailModal({ event, onClose, onEdit, onDelete }) {
  const navigate = useNavigate();
  if (!event) return null;

  const typeConfig = TYPE_COLORS[event.type] || TYPE_COLORS.meeting;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const isManualEvent = event.type === 'meeting';

  // Navigate to corresponding project tabs
  const handleNavigateToSource = () => {
    const pId = event.project_id;
    if (!pId) return;

    if (event.type === 'task') {
      navigate(`/projects/${pId}?tab=tasks`);
    } else if (event.type === 'termin') {
      navigate(`/projects/${pId}?tab=finance`);
    } else if (event.type === 'milestone') {
      navigate(`/projects/${pId}`); // milestones tab in detail
    } else {
      navigate(`/projects/${pId}`);
    }
    onClose();
  };

  const renderMetaInfo = () => {
    const m = event.meta || {};
    switch (event.type) {
      case 'deadline':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>
              <strong>Status Proyek:</strong> <span style={{ textTransform: 'capitalize' }}>{m.status || 'Aktif'}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>
              <strong>Sisa Waktu Kontrak:</strong> {(() => {
                const end = new Date(m.contract_end_date);
                const diffTime = end - new Date();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays > 0 ? `${diffDays} hari lagi` : `Sudah lewat ${Math.abs(diffDays)} hari`;
              })()}
            </div>
          </div>
        );
      case 'milestone':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>
              <strong>Nama Milestone:</strong> {m.milestone_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <strong>Status:</strong> 
              <span style={{ 
                fontSize: 11, 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                background: m.status === 'done' ? '#ECFDF5' : '#FFFBEB',
                color: m.status === 'done' ? '#10B981' : '#F59E0B',
                padding: '2px 8px',
                borderRadius: 20
              }}>
                {m.status || 'Pending'}
              </span>
            </div>
          </div>
        );
      case 'task':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ fontSize: 13 }}>
              <strong>Assignee:</strong> {m.assigned_name || 'Belum ditugaskan'}
            </div>
            <div style={{ fontSize: 13 }}>
              <strong>Prioritas:</strong> <span style={{ textTransform: 'capitalize' }}>{m.priority || 'Medium'}</span>
            </div>
            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong>Status:</strong> 
              <span style={{ 
                fontSize: 11, 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                background: m.status === 'done' ? '#ECFDF5' : '#EFF6FF',
                color: m.status === 'done' ? '#10B981' : '#3B82F6',
                padding: '2px 8px',
                borderRadius: 20
              }}>
                {m.status || 'Todo'}
              </span>
            </div>
            {m.is_overdue && (
              <div style={{ color: '#EF4444', fontWeight: 700, fontSize: 12.5, gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={14} /> Tugas ini Overdue!
              </div>
            )}
          </div>
        );
      case 'termin':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13 }}>
              <strong>Label Termin:</strong> {m.termin_label}
            </div>
            <div style={{ fontSize: 13 }}>
              <strong>Nilai Termin:</strong> Rp {m.nilai_termin?.toLocaleString('id-ID') || '0'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <strong>Status Pembayaran:</strong> 
              <span style={{ 
                fontSize: 11, 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                background: m.status === 'paid' ? '#ECFDF5' : '#FFFBEB',
                color: m.status === 'paid' ? '#10B981' : '#F59E0B',
                padding: '2px 8px',
                borderRadius: 20
              }}>
                {m.status || 'Submitted'}
              </span>
            </div>
          </div>
        );
      default: // meeting / manual events
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13 }}>
              <strong>Jenis Kegiatan:</strong> <span style={{ textTransform: 'capitalize' }}>{m.event_type || 'Rapat'}</span>
            </div>
            {m.event_time && (
              <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                <strong>Waktu:</strong> {m.event_time.substring(0, 5)} WIB
              </div>
            )}
          </div>
        );
    }
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
      zIndex: 1060,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        width: '100%',
        maxWidth: 500,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            background: typeConfig.bg,
            color: typeConfig.text,
            fontSize: '11px',
            fontWeight: '800',
            padding: '4px 10px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {typeConfig.label}
          </span>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Title */}
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: 0, lineHeight: 1.4 }}>
            {event.title}
          </h2>

          {/* Timing details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
              <strong>Tanggal:</strong> {formatDate(event.date)}
              {event.end_date && ` s/d ${formatDate(event.end_date)}`}
            </div>
            {event.meta?.event_time && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                <strong>Waktu:</strong> {event.meta.event_time.substring(0, 5)} WIB
              </div>
            )}
          </div>

          {/* Project relation */}
          {event.project_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <Briefcase size={15} style={{ color: 'var(--text-muted)' }} />
              <strong>Proyek Terkait:</strong>
              <button 
                onClick={() => {
                  navigate(`/projects/${event.project_id}`);
                  onClose();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--blue)',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {event.project_name} ({event.project_code})
              </button>
            </div>
          )}

          <div style={{ borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />

          {/* Meta Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Informasi Tambahan</span>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
              {renderMetaInfo()}
            </div>
          </div>

          {/* Description */}
          {((event.meta?.description) || (event.description)) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deskripsi / Catatan</span>
              <p style={{
                fontSize: 13,
                color: 'var(--text)',
                margin: 0,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {event.meta?.description || event.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '18px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          {isManualEvent ? (
            <>
              <button
                onClick={() => {
                  onEdit(event);
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: '#fff',
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete(event.id);
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 8,
                  border: 'none',
                  background: '#EF4444',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Hapus
              </button>
            </>
          ) : (
            event.project_id && (
              <button
                onClick={handleNavigateToSource}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 750,
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--blue)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Lihat Detail <ExternalLink size={14} />
              </button>
            )
          )}
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
