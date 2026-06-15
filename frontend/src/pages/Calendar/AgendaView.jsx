import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Calendar, ChevronDown } from 'lucide-react';

const TYPE_LABELS = {
  deadline: '⚑ Deadline',
  milestone: '✓ Milestone',
  task: 'Task Due',
  termin: 'Termin',
  meeting: 'Meeting'
};

const CHIP_COLORS = {
  deadline: { bg: '#FCEBEB', text: '#A32D2D', borderLeft: '3px solid #E24B4A' },
  milestone: { bg: '#EAF3DE', text: '#3B6D11', borderLeft: '3px solid #10B981' },
  task: { bg: '#E6F1FB', text: '#185FA5', borderLeft: '3px solid #3B82F6' },
  termin: { bg: '#FAEEDA', text: '#854F0B', borderLeft: '3px solid #F59E0B' },
  meeting: { bg: '#EEEDFE', text: '#534AB7', borderLeft: '3px solid #8B5CF6' }
};

export default function AgendaView({ activeDate, events = [], hiddenTypes = {}, onEventClick }) {
  const [daysToShow, setDaysToShow] = useState(30);

  const startRange = dayjs(activeDate).startOf('day');
  const endRange = startRange.add(daysToShow, 'day');

  // Filter visible events and group them by date within the daysToShow window
  const grouped = {};
  const visibleEvents = events.filter(e => !hiddenTypes[e.type]);

  visibleEvents.forEach(e => {
    const eDate = dayjs(e.date).startOf('day');
    if ((eDate.isAfter(startRange) || eDate.isSame(startRange)) && eDate.isBefore(endRange)) {
      const dateKey = e.date; // YYYY-MM-DD
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(e);
    }
  });

  // Sort dates
  const sortedDates = Object.keys(grouped).sort();

  const formatDateHeader = (dateStr) => {
    const date = dayjs(dateStr);
    const dayName = date.format('dddd'); // dddd in id locale e.g. "Rabu"
    const formatted = date.format('D MMM YYYY');
    return `${formatted} — ${dayName}`;
  };

  const hasEvents = sortedDates.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!hasEvents ? (
        <div style={{ 
          background: '#ffffff', 
          border: '1px dashed var(--border)', 
          borderRadius: 12, 
          padding: '40px 20px', 
          textAlign: 'center', 
          color: 'var(--text-muted)' 
        }}>
          <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Tidak ada agenda untuk {daysToShow} hari ke depan.</p>
          <button 
            onClick={() => setDaysToShow(prev => prev + 30)}
            style={{
              marginTop: 12,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: '#fff',
              cursor: 'pointer',
              color: 'var(--blue)'
            }}
          >
            Cari 30 Hari Lagi
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sortedDates.map(dateKey => (
            <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Group Date Header */}
              <div style={{ 
                fontSize: 12.5, 
                fontWeight: 800, 
                color: 'var(--navy)', 
                background: '#f1f5f9', 
                padding: '6px 12px', 
                borderRadius: 6,
                alignSelf: 'flex-start'
              }}>
                {formatDateHeader(dateKey)}
              </div>

              {/* Day Events List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8 }}>
                {grouped[dateKey].map((e, idx) => {
                  const style = CHIP_COLORS[e.type] || CHIP_COLORS.meeting;
                  const typeLabel = TYPE_LABELS[e.type] || 'Event';
                  const timeStr = e.meta?.event_time ? ` @ ${e.meta.event_time.substring(0, 5)}` : '';
                  const projectSnippet = e.project_name ? ` — Proyek: ${e.project_name} (${e.project_code})` : '';

                  return (
                    <div
                      key={idx}
                      onClick={() => onEventClick(e)}
                      style={{
                        background: style.bg,
                        color: style.text,
                        borderLeft: style.borderLeft,
                        borderRadius: 8,
                        padding: '10px 14px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        hover: {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10.5, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.02em' }}>
                            [{typeLabel}]
                          </span>
                          <span>{e.title}</span>
                          {timeStr && <span style={{ opacity: 0.8, fontWeight: 'normal' }}>{timeStr}</span>}
                        </div>
                        {projectSnippet && (
                          <div style={{ fontSize: 11, fontWeight: 'normal', opacity: 0.8 }}>
                            {projectSnippet.replace(' — ', '')}
                          </div>
                        )}
                      </div>
                      
                      {/* Priority or other extra badge if task */}
                      {e.type === 'task' && e.meta?.priority && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: `${style.text}15`,
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          {e.meta.priority}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          <button
            onClick={() => setDaysToShow(prev => prev + 30)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: '#ffffff',
              color: 'var(--blue)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 10,
              transition: 'background 0.15s'
            }}
          >
            Muat Lebih Banyak (Tampilkan {daysToShow + 30} Hari Ke Depan) <ChevronDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
