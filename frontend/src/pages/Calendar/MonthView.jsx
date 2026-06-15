import React from 'react';
import dayjs from 'dayjs';

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const CHIP_STYLES = {
  deadline: { bg: '#FCEBEB', text: '#A32D2D', borderLeft: '2px solid #E24B4A', prefix: '⚑ ' },
  milestone: { bg: '#EAF3DE', text: '#3B6D11', borderLeft: '2px solid #10B981', prefix: '✓ ' },
  task: { bg: '#E6F1FB', text: '#185FA5', borderLeft: '2px solid #3B82F6', prefix: '' },
  termin: { bg: '#FAEEDA', text: '#854F0B', borderLeft: '2px solid #F59E0B', prefix: '' },
  meeting: { bg: '#EEEDFE', text: '#534AB7', borderLeft: '2px solid #8B5CF6', prefix: '• ' }
};

export default function MonthView({ currentMonth, events = [], hiddenTypes = {}, onDateClick, onEventClick }) {
  const startOfMonth = dayjs(currentMonth).startOf('month');
  const dayOfWeek = startOfMonth.day(); // 0 (Sunday) to 6 (Saturday)
  
  // startOfGrid should be the Sunday on or before the 1st of the month
  const startOfGrid = startOfMonth.subtract(dayOfWeek, 'day');

  // Generate 42 cells (6 rows x 7 days)
  const cells = [];
  let dayCursor = startOfGrid;
  for (let i = 0; i < 42; i++) {
    cells.push(dayCursor);
    dayCursor = dayCursor.add(1, 'day');
  }

  const todayStr = dayjs().format('YYYY-MM-DD');
  const activeMonthStr = startOfMonth.format('YYYY-MM');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Week Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', borderBottom: '1px solid var(--border)', background: '#f8fafc', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
        {WEEKDAYS.map((day, i) => (
          <div key={i} style={{ padding: '10px 0', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>
            {day}
          </div>
        ))}
      </div>

      {/* Grid Cells */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gridTemplateRows: 'repeat(6, minmax(100px, 1fr))', 
        background: 'var(--border)', 
        gap: '1px',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}>
        {cells.map((cellDate, index) => {
          const dateStr = cellDate.format('YYYY-MM-DD');
          const isCurrentMonth = cellDate.format('YYYY-MM') === activeMonthStr;
          const isToday = dateStr === todayStr;

          // Filter events for this day and type-visibility
          const dayEvents = events.filter(e => {
            const matchDate = e.date === dateStr;
            const isVisible = !hiddenTypes[e.type];
            return matchDate && isVisible;
          });

          const displayEvents = dayEvents.slice(0, 3);
          const remainingCount = dayEvents.length - 3;

          return (
            <div 
              key={index} 
              onClick={() => onDateClick(dateStr)}
              style={{
                background: '#ffffff',
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'background 0.15s',
                hover: { background: '#f8fafc' },
                minHeight: 100
              }}
            >
              {/* Date Number */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                {isToday ? (
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--blue)',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {cellDate.date()}
                  </span>
                ) : (
                  <span style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: isCurrentMonth ? 'var(--navy)' : 'var(--text-muted)',
                    marginLeft: 4
                  }}>
                    {cellDate.date()}
                  </span>
                )}
              </div>

              {/* Event Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflow: 'hidden' }}>
                {displayEvents.map((e, idx) => {
                  const style = CHIP_STYLES[e.type] || CHIP_STYLES.meeting;
                  const prefix = style.prefix;
                  
                  // Truncate at 20 chars
                  const truncatedTitle = e.title.length > 20 
                    ? e.title.substring(0, 18) + '...' 
                    : e.title;

                  return (
                    <div
                      key={idx}
                      onClick={(event) => {
                        event.stopPropagation(); // Prevent opening DayDetailPanel
                        onEventClick(e);
                      }}
                      style={{
                        background: style.bg,
                        color: style.text,
                        borderLeft: style.borderLeft,
                        borderRadius: 3,
                        padding: '2px 4px',
                        fontSize: 10.5,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        transition: 'opacity 0.15s'
                      }}
                      title={e.title}
                    >
                      {prefix}{truncatedTitle}
                    </div>
                  );
                })}

                {/* More events count indicator */}
                {remainingCount > 0 && (
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: 'var(--blue)',
                    marginTop: 2,
                    marginLeft: 4
                  }}>
                    + {remainingCount} lagi
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
