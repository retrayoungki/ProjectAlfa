import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

export default function MiniCalendar({ mainMonth, events = [], onDateSelect }) {
  const [miniMonth, setMiniMonth] = useState(dayjs(mainMonth));

  // Sync with main calendar month changes
  useEffect(() => {
    setMiniMonth(dayjs(mainMonth));
  }, [mainMonth]);

  const startOfMonth = miniMonth.startOf('month');
  const dayOfWeek = startOfMonth.day();
  const startOfGrid = startOfMonth.subtract(dayOfWeek, 'day');

  // Generate 35 cells (5 rows x 7 days) or 42 cells (6 rows x 7 days) to ensure coverage
  const cells = [];
  let dayCursor = startOfGrid;
  for (let i = 0; i < 35; i++) {
    cells.push(dayCursor);
    dayCursor = dayCursor.add(1, 'day');
  }

  const handlePrevMonth = () => {
    setMiniMonth(prev => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setMiniMonth(prev => prev.add(1, 'month'));
  };

  const todayStr = dayjs().format('YYYY-MM-DD');
  const activeMonthStr = miniMonth.format('YYYY-MM');

  return (
    <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column' }}>
      {/* Header Month Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--navy)' }}>
          {miniMonth.format('MMMM YYYY')}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button 
            onClick={handlePrevMonth}
            style={{ padding: 2, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            onClick={handleNextMonth}
            style={{ padding: 2, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Weekday Titles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 6 }}>
        {WEEKDAYS.map((day, idx) => (
          <span key={idx} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
        {cells.map((cellDate, idx) => {
          const dateStr = cellDate.format('YYYY-MM-DD');
          const isCurrentMonth = cellDate.format('YYYY-MM') === activeMonthStr;
          const isToday = dateStr === todayStr;
          
          // Check if date has events
          const hasEventsOnDay = events.some(e => e.date === dateStr);

          return (
            <div
              key={idx}
              onClick={() => onDateSelect(dateStr)}
              style={{
                padding: '4px 0',
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: isToday ? 'var(--blue)' : 'transparent',
                color: isToday ? '#ffffff' : (isCurrentMonth ? 'var(--navy)' : '#cbd5e1'),
                fontWeight: isToday || isCurrentMonth ? '700' : 'normal',
                fontSize: 11.5,
                transition: 'background 0.15s',
                hover: { background: '#f1f5f9' }
              }}
            >
              <span>{cellDate.date()}</span>
              {hasEventsOnDay && (
                <span style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  backgroundColor: isToday ? '#ffffff' : 'var(--blue)',
                  position: 'absolute',
                  bottom: 2
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
