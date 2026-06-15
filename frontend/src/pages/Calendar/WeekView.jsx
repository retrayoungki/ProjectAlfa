import React from 'react';
import dayjs from 'dayjs';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 to 20

const CHIP_STYLES = {
  deadline: { bg: '#FCEBEB', text: '#A32D2D', borderLeft: '2px solid #E24B4A', prefix: '⚑ ' },
  milestone: { bg: '#EAF3DE', text: '#3B6D11', borderLeft: '2px solid #10B981', prefix: '✓ ' },
  task: { bg: '#E6F1FB', text: '#185FA5', borderLeft: '2px solid #3B82F6', prefix: '' },
  termin: { bg: '#FAEEDA', text: '#854F0B', borderLeft: '2px solid #F59E0B', prefix: '' },
  meeting: { bg: '#EEEDFE', text: '#534AB7', borderLeft: '2px solid #8B5CF6', prefix: '• ' }
};

export default function WeekView({ activeDate, events = [], hiddenTypes = {}, onEventClick, onDateClick }) {
  const activeDayjs = dayjs(activeDate);
  const dayOfWeek = activeDayjs.day(); // 0 is Sun, 1 is Mon
  
  // Find Monday of the week
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = activeDayjs.subtract(diff, 'day');

  // Generate 7 days of the week
  const weekDaysDates = [];
  for (let i = 0; i < 7; i++) {
    weekDaysDates.push(monday.add(i, 'day'));
  }

  // Filter visible events
  const getVisibleEvents = () => {
    return events.filter(e => !hiddenTypes[e.type]);
  };

  const visibleEvents = getVisibleEvents();

  // Helper to parse hour from eventTime e.g., "14:30" or "09:00:00" -> 14
  const getEventHour = (timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 600, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      {/* Grid Header: Time label + 7 days */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid var(--border)', background: '#f8fafc', textAlign: 'center' }}>
        <div style={{ padding: '12px 6px', borderRight: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          WAKTU
        </div>
        {weekDaysDates.map((date, idx) => {
          const isToday = date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
          return (
            <div 
              key={idx} 
              onClick={() => onDateClick(date.format('YYYY-MM-DD'))}
              style={{ 
                padding: '8px 4px', 
                borderRight: idx < 6 ? '1px solid var(--border)' : 'none',
                background: isToday ? '#EFF6FF' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>
                {WEEKDAYS[idx]}
              </div>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 800, 
                color: isToday ? 'var(--blue)' : 'var(--navy)',
                marginTop: 2
              }}>
                {date.date()}
              </div>
            </div>
          );
        })}
      </div>

      {/* All Day Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '2px solid var(--border)', background: '#fafafb' }}>
        <div style={{ padding: '8px 6px', borderRight: '1px solid var(--border)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ALL-DAY
        </div>
        {weekDaysDates.map((date, dayIdx) => {
          const dateStr = date.format('YYYY-MM-DD');
          // Find all-day events (no time, or time outside 7:00-20:00 range)
          const allDayEvents = visibleEvents.filter(e => {
            if (e.date !== dateStr) return false;
            const hour = getEventHour(e.meta?.event_time);
            return hour === null || hour < 7 || hour > 20;
          });

          return (
            <div 
              key={dayIdx} 
              onClick={() => onDateClick(dateStr)}
              style={{ 
                padding: '4px', 
                borderRight: dayIdx < 6 ? '1px solid var(--border)' : 'none', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 4, 
                minHeight: 40,
                background: dateStr === dayjs().format('YYYY-MM-DD') ? '#EFF6FF10' : 'transparent'
              }}
            >
              {allDayEvents.map((e, idx) => {
                const style = CHIP_STYLES[e.type] || CHIP_STYLES.meeting;
                return (
                  <div
                    key={idx}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEventClick(e);
                    }}
                    style={{
                      background: style.bg,
                      color: style.text,
                      borderLeft: style.borderLeft,
                      borderRadius: 3,
                      padding: '2px 4px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={e.title}
                  >
                    {style.prefix}{e.title}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Hourly Grid Rows */}
      <div style={{ overflowY: 'auto', maxHeight: 500 }}>
        {HOURS.map((hour, hrIdx) => {
          const hourStr = `${String(hour).padStart(2, '0')}:00`;
          return (
            <div 
              key={hrIdx} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '80px repeat(7, 1fr)', 
                borderBottom: hrIdx < HOURS.length - 1 ? '1px solid #f1f5f9' : 'none' 
              }}
            >
              {/* Time Column */}
              <div style={{ 
                padding: '12px 6px', 
                borderRight: '1px solid var(--border)', 
                fontSize: 11, 
                fontWeight: 700, 
                color: 'var(--text-muted)', 
                textAlign: 'center',
                background: '#fafafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {hourStr}
              </div>

              {/* Day Cells */}
              {weekDaysDates.map((date, dayIdx) => {
                const dateStr = date.format('YYYY-MM-DD');
                // Filter events for this day and this hour
                const hourEvents = visibleEvents.filter(e => {
                  if (e.date !== dateStr) return false;
                  const eventHr = getEventHour(e.meta?.event_time);
                  return eventHr === hour;
                });

                return (
                  <div 
                    key={dayIdx} 
                    onClick={() => onDateClick(dateStr)}
                    style={{ 
                      padding: 4, 
                      borderRight: dayIdx < 6 ? '1px solid #f1f5f9' : 'none', 
                      minHeight: 44,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      background: dateStr === dayjs().format('YYYY-MM-DD') ? '#EFF6FF20' : 'transparent',
                      hover: { background: '#f8fafc' }
                    }}
                  >
                    {hourEvents.map((e, idx) => {
                      const style = CHIP_STYLES[e.type] || CHIP_STYLES.meeting;
                      const timeSnippet = e.meta?.event_time ? ` (${e.meta.event_time.substring(0, 5)})` : '';
                      return (
                        <div
                          key={idx}
                          onClick={(event) => {
                            event.stopPropagation();
                            onEventClick(e);
                          }}
                          style={{
                            background: style.bg,
                            color: style.text,
                            borderLeft: style.borderLeft,
                            borderRadius: 3,
                            padding: '2px 4px',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={`${e.title}${timeSnippet}`}
                        >
                          {style.prefix}{e.title}{timeSnippet}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
