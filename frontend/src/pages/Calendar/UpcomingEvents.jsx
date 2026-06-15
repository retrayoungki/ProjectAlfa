import React from 'react';
import dayjs from 'dayjs';

const TYPE_COLORS = {
  deadline: '#E24B4A',
  milestone: '#10B981',
  task: '#3B82F6',
  termin: '#F59E0B',
  meeting: '#8B5CF6'
};

export default function UpcomingEvents({ events = [], onEventClick }) {
  const getMonthNameId = (dateStr) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const date = new Date(dateStr);
    return months[date.getMonth()];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {events.length === 0 ? (
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
          Tidak ada event mendatang.
        </div>
      ) : (
        events.map((e, idx) => {
          const dateObj = new Date(e.date);
          const dayNum = dateObj.getDate();
          const monthStr = getMonthNameId(e.date);
          const dotColor = TYPE_COLORS[e.type] || '#8B5CF6';

          return (
            <div
              key={idx}
              onClick={() => onEventClick(e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 10px',
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                hover: {
                  background: '#f1f5f9',
                  borderColor: '#cbd5e1'
                }
              }}
            >
              {/* Date Box */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 6,
                minWidth: 44,
                height: 44,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1.1
              }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>{dayNum}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{monthStr}</span>
              </div>

              {/* Title & Project */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div 
                  style={{ 
                    fontSize: 12, 
                    fontWeight: 700, 
                    color: 'var(--navy)', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    marginBottom: 2
                  }}
                  title={e.title}
                >
                  {e.title}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.project_name || 'Personal / General'}
                </div>
              </div>

              {/* Dot color Indicator */}
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: dotColor,
                flexShrink: 0
              }} />
            </div>
          );
        })
      )}
    </div>
  );
}
