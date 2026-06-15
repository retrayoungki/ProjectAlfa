import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  Clock, Briefcase, Info, AlertTriangle, RefreshCw
} from 'lucide-react';
import { fetchProjects } from '../services/projectService';
import { 
  fetchCalendarEvents, 
  fetchUpcomingEvents, 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent 
} from '../services/calendarService';

import MonthView from './Calendar/MonthView';
import WeekView from './Calendar/WeekView';
import AgendaView from './Calendar/AgendaView';
import UpcomingEvents from './Calendar/UpcomingEvents';
import MiniCalendar from './Calendar/MiniCalendar';
import EventDetailModal from './Calendar/EventDetailModal';
import AddEventModal from './Calendar/AddEventModal';
import DayDetailPanel from './Calendar/DayDetailPanel';

dayjs.locale('id');

const LEGEND_ITEMS = [
  { type: 'deadline', label: 'Deadline Proyek', color: '#E24B4A', prefix: '⚑' },
  { type: 'milestone', label: 'Milestone', color: '#10B981', prefix: '✓' },
  { type: 'task', label: 'Task / Pekerjaan', color: '#3B82F6', prefix: '•' },
  { type: 'meeting', label: 'Meeting / Rapat', color: '#8B5CF6', prefix: '•' },
  { type: 'termin', label: 'Penagihan Termin', color: '#F59E0B', prefix: '•' }
];

export default function CalendarPage() {
  const [searchParams] = useSearchParams();

  // Navigation and view state
  const [activeDate, setActiveDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState('');
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day' | 'agenda'
  const [hiddenTypes, setHiddenTypes] = useState({});

  // Data states
  const [events, setEvents] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  // Modals / Panels
  const [dayDetailDate, setDayDetailDate] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [formEvent, setFormEvent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  // Responsive default
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode('agenda');
    }
  }, []);

  // Parse search params on load or change
  useEffect(() => {
    const pId = searchParams.get('project_id');
    if (pId) setSelectedProjectId(pId);
    
    const dStr = searchParams.get('date');
    if (dStr && dayjs(dStr).isValid()) {
      setActiveDate(dayjs(dStr));
    }
  }, [searchParams]);

  // Load projects list for filter dropdown
  useEffect(() => {
    fetchProjects({ limit: 100 })
      .then(res => {
        setProjects(res.data || []);
      })
      .catch(err => console.error('Failed to load projects list in Calendar:', err));
  }, []);

  // Sync Month string with activeDate
  useEffect(() => {
    const monthStr = activeDate.format('YYYY-MM');
    if (monthStr !== currentMonth) {
      setCurrentMonth(monthStr);
    }
  }, [activeDate, currentMonth]);

  // Fetch calendar events when month or project filter changes (CACHE RULE)
  const loadEvents = useCallback((monthVal) => {
    if (!monthVal) return;
    setLoading(true);
    fetchCalendarEvents({
      month: monthVal,
      project_id: selectedProjectId || undefined
    })
      .then(data => {
        setEvents(data || []);
      })
      .catch(err => console.error('Failed to load calendar events:', err))
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  useEffect(() => {
    if (currentMonth) {
      loadEvents(currentMonth);
    }
  }, [currentMonth, loadEvents]);

  // Fetch upcoming events
  const loadUpcoming = useCallback(() => {
    setUpcomingLoading(true);
    fetchUpcomingEvents({
      project_id: selectedProjectId || undefined
    })
      .then(data => {
        setUpcoming(data || []);
      })
      .catch(err => console.error('Failed to load upcoming events:', err))
      .finally(() => setUpcomingLoading(false));
  }, [selectedProjectId]);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  // Toolbar action helpers
  const handleToday = () => {
    setActiveDate(dayjs());
  };

  const handlePrev = () => {
    if (viewMode === 'month' || viewMode === 'agenda') {
      setActiveDate(prev => prev.subtract(1, 'month'));
    } else if (viewMode === 'week') {
      setActiveDate(prev => prev.subtract(1, 'week'));
    } else if (viewMode === 'day') {
      setActiveDate(prev => prev.subtract(1, 'day'));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month' || viewMode === 'agenda') {
      setActiveDate(prev => prev.add(1, 'month'));
    } else if (viewMode === 'week') {
      setActiveDate(prev => prev.add(1, 'week'));
    } else if (viewMode === 'day') {
      setActiveDate(prev => prev.add(1, 'day'));
    }
  };

  const getToolbarTitle = () => {
    if (viewMode === 'month' || viewMode === 'agenda') {
      return activeDate.format('MMMM YYYY');
    } else if (viewMode === 'week') {
      const startOfWeek = activeDate.subtract(activeDate.day() === 0 ? 6 : activeDate.day() - 1, 'day');
      const endOfWeek = startOfWeek.add(6, 'day');
      if (startOfWeek.month() === endOfWeek.month()) {
        return `${startOfWeek.format('D')} - ${endOfWeek.format('D MMMM YYYY')}`;
      }
      return `${startOfWeek.format('D MMM')} - ${endOfWeek.format('D MMM YYYY')}`;
    } else {
      return activeDate.format('dddd, D MMMM YYYY');
    }
  };

  // Toggles Legend / Colors hide/show
  const toggleLegendType = (type) => {
    setHiddenTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Event Mutations (CRUD manual events)
  const handleSaveEvent = async (payload) => {
    try {
      if (formEvent) {
        // Edit Mode
        await updateCalendarEvent(formEvent.id, payload);
      } else {
        // Create Mode
        await createCalendarEvent(payload);
      }
      setFormOpen(false);
      setFormEvent(null);
      
      // Reload month & upcoming data
      loadEvents(currentMonth);
      loadUpcoming();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan event.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Hapus event manual ini?')) {
      try {
        await deleteCalendarEvent(eventId);
        setDetailEvent(null);
        
        // Reload month & upcoming data
        loadEvents(currentMonth);
        loadUpcoming();
      } catch (err) {
        alert(err.message || 'Gagal menghapus event.');
      }
    }
  };

  // Render Day View inline using WeekView styling with single column
  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7);
    const dateStr = activeDate.format('YYYY-MM-DD');
    const isToday = dateStr === dayjs().format('YYYY-MM-DD');

    const visibleEvents = events.filter(e => !hiddenTypes[e.type]);

    const getEventHour = (timeStr) => {
      if (!timeStr) return null;
      return parseInt(timeStr.split(':')[0], 10);
    };

    // Filter day events
    const dayEvents = visibleEvents.filter(e => e.date === dateStr);
    const allDayEvents = dayEvents.filter(e => {
      const hr = getEventHour(e.meta?.event_time);
      return hr === null || hr < 7 || hr > 20;
    });

    const CHIP_STYLES = {
      deadline: { bg: '#FCEBEB', text: '#A32D2D', borderLeft: '3px solid #E24B4A', prefix: '⚑ ' },
      milestone: { bg: '#EAF3DE', text: '#3B6D11', borderLeft: '3px solid #10B981', prefix: '✓ ' },
      task: { bg: '#E6F1FB', text: '#185FA5', borderLeft: '3px solid #3B82F6', prefix: '' },
      termin: { bg: '#FAEEDA', text: '#854F0B', borderLeft: '3px solid #F59E0B', prefix: '' },
      meeting: { bg: '#EEEDFE', text: '#534AB7', borderLeft: '3px solid #8B5CF6', prefix: '• ' }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        {/* Day Header */}
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>
            {activeDate.format('dddd, D MMMM YYYY')}
          </span>
          {isToday && (
            <span style={{ background: '#EFF6FF', color: 'var(--blue)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
              Hari Ini
            </span>
          )}
        </div>

        {/* All Day Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', borderBottom: '2px solid var(--border)', background: '#fafafb' }}>
          <div style={{ padding: 10, borderRight: '1px solid var(--border)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>
            ALL-DAY
          </div>
          <div style={{ padding: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allDayEvents.length === 0 ? (
              <span style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontStyle: 'italic' }}>Tidak ada all-day event</span>
            ) : (
              allDayEvents.map((e, idx) => {
                const style = CHIP_STYLES[e.type] || CHIP_STYLES.meeting;
                return (
                  <div
                    key={idx}
                    onClick={() => setDetailEvent(e)}
                    style={{
                      background: style.bg,
                      color: style.text,
                      borderLeft: style.borderLeft,
                      borderRadius: 4,
                      padding: '3px 8px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {style.prefix}{e.title}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Hourly Slot Lists */}
        <div style={{ overflowY: 'auto', maxHeight: 450 }}>
          {hours.map((hour, idx) => {
            const hourStr = `${String(hour).padStart(2, '0')}:00`;
            const hrEvents = dayEvents.filter(e => getEventHour(e.meta?.event_time) === hour);

            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', borderBottom: idx < hours.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ padding: '12px 6px', borderRight: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', background: '#fafafb' }}>
                  {hourStr}
                </div>
                <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 4, minHeight: 44 }}>
                  {hrEvents.map((e, evIdx) => {
                    const style = CHIP_STYLES[e.type] || CHIP_STYLES.meeting;
                    const timeStr = e.meta?.event_time ? ` (${e.meta.event_time.substring(0, 5)})` : '';
                    return (
                      <div
                        key={evIdx}
                        onClick={() => setDetailEvent(e)}
                        style={{
                          background: style.bg,
                          color: style.text,
                          borderLeft: style.borderLeft,
                          borderRadius: 4,
                          padding: '4px 8px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-block',
                          width: 'fit-content',
                          maxWidth: '100%',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {style.prefix}{e.title}{timeStr}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 24, paddingBottom: 40, flexWrap: 'wrap-reverse' }}>
      
      {/* 1. Main Calendar Area (Kiri Lebar) */}
      <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Calendar Header with Navigation & Filters */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          
          {/* Row 1: Header Titles & Quick actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px 0' }}>
                Calendar
              </h1>
              <p className="page-subtitle" style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Jadwal proyek, deadline kontrak, termin & milestone
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={handleToday}
                style={{
                  padding: '8px 14px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: '#fff',
                  cursor: 'pointer',
                  color: 'var(--navy)'
                }}
              >
                Hari Ini
              </button>
              <button
                onClick={() => {
                  setFormEvent(null);
                  setFormOpen(true);
                }}
                style={{
                  padding: '8px 14px',
                  fontSize: 12.5,
                  fontWeight: 750,
                  background: 'var(--blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.15)'
                }}
              >
                + Tambah Event
              </button>
            </div>
          </div>

          {/* Row 2: Toolbar navigation & filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            
            {/* Navigasi Bulan / Hari */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button 
                  onClick={handlePrev}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text)'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={handleNext}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text)'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0, minWidth: 140 }}>
                {getToolbarTitle()}
              </h2>
            </div>

            {/* Filter Proyek */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: '#fff',
                  cursor: 'pointer',
                  minWidth: 150
                }}
              >
                <option value="">Semua Proyek</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.projectCode || 'PRJ'} • {p.projectName}</option>
                ))}
              </select>

              {/* View Toggle */}
              <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
                {[
                  { id: 'day', label: 'Hari' },
                  { id: 'week', label: 'Minggu' },
                  { id: 'month', label: 'Bulan' },
                  { id: 'agenda', label: 'Agenda' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 4,
                      border: 'none',
                      background: viewMode === v.id ? '#fff' : 'transparent',
                      color: viewMode === v.id ? 'var(--navy)' : 'var(--text-muted)',
                      fontSize: 11.5,
                      fontWeight: 750,
                      cursor: 'pointer',
                      boxShadow: viewMode === v.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* View Grid Contents */}
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', background: '#fff', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid rgba(0,0,0,0.05)',
              borderTopColor: 'var(--blue)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Memuat agenda...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flex: 1 }}>
            {viewMode === 'month' && (
              <MonthView
                currentMonth={activeDate}
                events={events}
                hiddenTypes={hiddenTypes}
                onDateClick={(dateStr) => setDayDetailDate(dateStr)}
                onEventClick={(e) => setDetailEvent(e)}
              />
            )}
            {viewMode === 'week' && (
              <WeekView
                activeDate={activeDate}
                events={events}
                hiddenTypes={hiddenTypes}
                onEventClick={(e) => setDetailEvent(e)}
                onDateClick={(dateStr) => setDayDetailDate(dateStr)}
              />
            )}
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'agenda' && (
              <AgendaView
                activeDate={activeDate}
                events={events}
                hiddenTypes={hiddenTypes}
                onEventClick={(e) => setDetailEvent(e)}
              />
            )}
          </div>
        )}

      </div>

      {/* 2. Sidebar Kanan (250px) */}
      <div style={{ width: 250, display: 'flex', flexDirection: 'column', gap: 20, flexShrink: 0 }}>
        
        {/* Widget 1: Mini Calendar */}
        <MiniCalendar
          mainMonth={activeDate}
          events={events}
          onDateSelect={(dateStr) => {
            setActiveDate(dayjs(dateStr));
            setDayDetailDate(dateStr); // Show day detail panel on click
          }}
        />

        {/* Widget 2: Legend / Color Filter */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
          <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Filter Tipe
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LEGEND_ITEMS.map((item, idx) => {
              const isHidden = hiddenTypes[item.type];
              return (
                <div
                  key={idx}
                  onClick={() => toggleLegendType(item.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    opacity: isHidden ? 0.45 : 1,
                    transition: 'opacity 0.15s',
                    padding: '2px 4px',
                    borderRadius: 4,
                    hover: { background: '#f8fafc' }
                  }}
                >
                  <span style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 8.5,
                    fontWeight: 800
                  }}>
                    {item.prefix === '•' ? '' : item.prefix}
                  </span>
                  <span style={{ color: 'var(--navy)', textDecoration: isHidden ? 'line-through' : 'none' }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Widget 3: Upcoming Events Panel */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Mendatang
            </h4>
            {upcomingLoading && (
              <RefreshCw size={11} className="spin-animate" style={{ color: 'var(--text-muted)' }} />
            )}
          </div>
          
          <UpcomingEvents
            events={upcoming}
            onEventClick={(e) => setDetailEvent(e)}
          />
        </div>

      </div>

      {/* Day Detail Panel */}
      {dayDetailDate && (
        <DayDetailPanel
          dateStr={dayDetailDate}
          events={events}
          onClose={() => setDayDetailDate(null)}
          onAddEvent={(dateStr) => {
            setDayDetailDate(null);
            setFormEvent(null);
            setFormOpen(true);
            
            // Set date inside form event context
            // Since activeDate is just dayjs, we update activeDate so the form defaults to this date
            setActiveDate(dayjs(dateStr));
          }}
          onEventClick={(e) => {
            setDetailEvent(e);
            setDayDetailDate(null);
          }}
        />
      )}

      {/* Event Detail Modal */}
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={(e) => {
            setFormEvent(e);
            setDetailEvent(null);
            setFormOpen(true);
          }}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Add / Edit Event Manual Modal */}
      {formOpen && (
        <AddEventModal
          event={formEvent}
          projects={projects}
          onClose={() => {
            setFormOpen(false);
            setFormEvent(null);
          }}
          onSubmit={handleSaveEvent}
        />
      )}
    </div>
  );
}
