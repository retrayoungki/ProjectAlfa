import React from 'react';
import dayjs from 'dayjs';
import { X, Calendar, Plus, Clock, Briefcase, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { id: 'deadline', label: 'Deadline Kontrak', icon: '🔴', color: '#E24B4A' },
  { id: 'milestone', label: 'Milestones', icon: '🟢', color: '#10B981' },
  { id: 'task', label: 'Tasks', icon: '🔵', color: '#3B82F6' },
  { id: 'meeting', label: 'Meetings / Kegiatan', icon: '🟣', color: '#8B5CF6' },
  { id: 'termin', label: 'Termin Penagihan', icon: '🟡', color: '#F59E0B' }
];

export default function DayDetailPanel({ dateStr, events = [], onClose, onAddEvent, onEventClick }) {
  if (!dateStr) return null;

  const date = dayjs(dateStr);
  const formattedHeader = date.format('dddd, D MMMM YYYY');

  // Filter events for this specific date
  const dayEvents = events.filter(e => e.date === dateStr);

  // Group events by category
  const grouped = {
    deadline: [],
    milestone: [],
    task: [],
    meeting: [],
    termin: []
  };

  dayEvents.forEach(e => {
    if (grouped[e.type]) {
      grouped[e.type].push(e);
    } else {
      grouped.meeting.push(e); // Fallback
    }
  });

  const hasEvents = dayEvents.length > 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.3)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1040,
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
        maxWidth: 520,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '80vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} style={{ color: 'var(--blue)' }} />
            <h3 style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
              {formattedHeader}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!hasEvents ? (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
              Tidak ada agenda dijadwalkan untuk hari ini.
            </div>
          ) : (
            CATEGORIES.map(cat => {
              const catEvents = grouped[cat.id] || [];
              if (catEvents.length === 0) return null;

              return (
                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: cat.color, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span style={{ fontSize: 10, background: `${cat.color}15`, padding: '1px 6px', borderRadius: 10 }}>
                      {catEvents.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12 }}>
                    {catEvents.map((e, idx) => (
                      <div
                        key={idx}
                        onClick={() => onEventClick(e)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.15s',
                          hover: { background: '#f1f5f9' }
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {e.title}
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                            {e.meta?.event_time && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={11} /> {e.meta.event_time.substring(0, 5)}
                              </span>
                            )}
                            {e.project_name && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Briefcase size={11} /> {e.project_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginLeft: 8 }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '18px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={() => onAddEvent(dateStr)}
            style={{
              padding: '8px 14px',
              fontSize: 12.5,
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
            <Plus size={14} /> Tambah Event
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px',
              fontSize: 12.5,
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
