import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, RotateCcw, Edit, Trash2, Calendar, 
  AlertCircle, Grid, List, ChevronRight, User, Folder, Tag, MoreHorizontal
} from 'lucide-react';
import { 
  fetchGlobalTasks, 
  fetchMyTasks, 
  fetchFilterOptions, 
  createGlobalTask, 
  updateGlobalTask, 
  updateGlobalTaskStatus, 
  deleteGlobalTask 
} from '../services/taskService';
import KanbanBoard from './Projects/KanbanBoard';
import TaskFormModal from './Projects/TaskFormModal';
import TaskDetailModal from './Projects/TaskDetailModal';
import DeleteTaskModal from './Projects/DeleteTaskModal';

const PRIORITY_COLORS = {
  high: '#E24B4A',
  medium: '#F59E0B',
  low: '#10B981'
};

const DIVISION_LABELS = {
  persiapan: 'Persiapan',
  sipil: 'Sipil',
  mep: 'MEP',
  arsitektur: 'Arsitektur',
  finishing: 'Finishing',
  other: 'Lainnya'
};

export default function TasksPage() {
  const navigate = useNavigate();

  // Tasks and filters states
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({ total: 0, todo: 0, in_progress: 0, review: 0, done: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter options (populated from API)
  const [filterOptions, setFilterOptions] = useState({ projects: [], users: [], divisions: [] });

  // Current filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [division, setDivision] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [isMyTasks, setIsMyTasks] = useState(false);

  // View settings
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [groupBy, setGroupBy] = useState('none'); // 'none' | 'project' | 'assignee' | 'division'

  // Pagination for List View
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [activeFormTask, setActiveFormTask] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [activeDetailTask, setActiveDetailTask] = useState(null);
  const [activeDeleteTask, setActiveDeleteTask] = useState(null);

  // Quick Status dropdown state in list view
  const [inlineStatusTaskId, setInlineStatusTaskId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load filter options once on mount
  useEffect(() => {
    fetchFilterOptions()
      .then(opts => {
        setFilterOptions(opts);
      })
      .catch(err => {
        console.error('Failed to load filter options:', err);
      });
  }, []);

  // Fetch tasks
  const loadTasks = useCallback(() => {
    setLoading(true);
    setError(null);

    const limit = viewMode === 'list' ? 20 : 200; // Kanban board needs all tasks, list is paginated
    const params = {
      project_id: projectId || undefined,
      status: status || undefined,
      priority: priority || undefined,
      division: division || undefined,
      assigned_to: assignedTo || undefined,
      overdue: overdueOnly ? 'true' : undefined,
      search: debouncedSearch || undefined,
      page: viewMode === 'list' ? currentPage : 1,
      limit
    };

    const fetchMethod = isMyTasks ? fetchMyTasks : fetchGlobalTasks;

    fetchMethod(params)
      .then(res => {
        setTasks(res.tasks || []);
        setSummary(res.summary || { total: 0, todo: 0, in_progress: 0, review: 0, done: 0, overdue: 0 });
        if (viewMode === 'list') {
          // Calculate pages assuming 20 per page
          const totalTasksCount = res.summary?.total || 0;
          setTotalPages(Math.max(1, Math.ceil(totalTasksCount / limit)));
        }
      })
      .catch(err => {
        console.error('Error fetching tasks:', err);
        setError(err.message || 'Gagal memuat daftar tugas.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId, status, priority, division, assignedTo, overdueOnly, debouncedSearch, isMyTasks, viewMode, currentPage]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handle pagination changes
  useEffect(() => {
    setCurrentPage(1);
  }, [projectId, status, priority, division, assignedTo, overdueOnly, debouncedSearch, isMyTasks, viewMode]);

  // Check if any filter is active
  const hasActiveFilters = 
    projectId !== '' || 
    status !== '' || 
    priority !== '' || 
    division !== '' || 
    assignedTo !== '' || 
    overdueOnly || 
    debouncedSearch !== '' ||
    isMyTasks;

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setProjectId('');
    setStatus('');
    setPriority('');
    setDivision('');
    setAssignedTo('');
    setOverdueOnly(false);
    setIsMyTasks(false);
    setCurrentPage(1);
  };

  // Task mutations
  const handleCreateOrUpdateTask = async (payload) => {
    try {
      if (activeFormTask) {
        // Edit Mode
        await updateGlobalTask(activeFormTask.id, payload);
      } else {
        // Create Mode
        await createGlobalTask(payload);
      }
      setFormOpen(false);
      setActiveFormTask(null);
      loadTasks();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan tugas.');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await updateGlobalTaskStatus(taskId, newStatus);
      // Refresh list
      loadTasks();
      
      // Update inline detail modal if it's currently open
      if (activeDetailTask && activeDetailTask.id === taskId) {
        setActiveDetailTask(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      alert(err.message || 'Gagal mengubah status tugas.');
    }
  };

  const handleDeleteConfirm = async (taskId) => {
    try {
      await deleteGlobalTask(taskId);
      setActiveDeleteTask(null);
      setActiveDetailTask(null); // Close detail modal if open
      loadTasks();
    } catch (err) {
      alert(err.message || 'Gagal menghapus tugas.');
    }
  };

  // Grouping list view tasks
  const getGroupedTasks = () => {
    if (groupBy === 'none') return { 'Daftar Tugas': tasks };

    const groups = {};
    tasks.forEach(t => {
      let key = 'Lainnya';
      if (groupBy === 'project') {
        key = `${t.project_code || 'PRJ'} • ${t.project_name || 'Tidak Ada Proyek'}`;
      } else if (groupBy === 'assignee') {
        key = t.assigned_name || 'Belum Ditugaskan';
      } else if (groupBy === 'division') {
        key = DIVISION_LABELS[t.division?.toLowerCase()] || t.division || 'Lainnya';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  };

  // Inline status selector renderer (List view)
  const renderInlineStatusSelector = (task) => {
    const isOpen = inlineStatusTaskId === task.id;

    const STATUS_OPTIONS = [
      { id: 'todo', title: 'To Do', color: '#3B82F6', bg: '#EFF6FF' },
      { id: 'in_progress', title: 'In Progress', color: '#F59E0B', bg: '#FFFBEB' },
      { id: 'review', title: 'Review', color: '#8B5CF6', bg: '#F3E8FF' },
      { id: 'done', title: 'Done', color: '#10B981', bg: '#ECFDF5' }
    ];

    const currentStatusObj = STATUS_OPTIONS.find(s => s.id === task.status?.toLowerCase()) || STATUS_OPTIONS[0];

    if (!isOpen) {
      return (
        <span
          onClick={(e) => {
            e.stopPropagation();
            setInlineStatusTaskId(task.id);
          }}
          style={{
            background: currentStatusObj.bg,
            color: currentStatusObj.color,
            border: `1px solid ${currentStatusObj.color}40`,
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
          title="Klik untuk ganti status cepat"
        >
          {currentStatusObj.title}
        </span>
      );
    }

    return (
      <select
        value={task.status?.toLowerCase() || 'todo'}
        onClick={e => e.stopPropagation()}
        onChange={(e) => {
          handleUpdateStatus(task.id, e.target.value);
          setInlineStatusTaskId(null);
        }}
        onBlur={() => setInlineStatusTaskId(null)}
        autoFocus
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          borderRadius: 6,
          padding: '2px 6px',
          border: '1px solid var(--border)',
          outline: 'none',
          cursor: 'pointer',
          background: '#fff',
          color: 'var(--navy)'
        }}
      >
        {STATUS_OPTIONS.map(s => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>
    );
  };

  const groupedData = getGroupedTasks();

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px 0' }}>
            Tasks
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Semua task lintas proyek · <strong>{summary.total}</strong> total
          </p>
        </div>
        <button 
          onClick={() => {
            setActiveFormTask(null);
            setFormOpen(true);
          }}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13.5,
            fontWeight: 700,
            background: 'var(--blue)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(59, 130, 246, 0.15)'
          }}
        >
          <Plus size={16} /> Tambah Task
        </button>
      </div>

      {/* KPI Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { title: 'Total Tasks', value: summary.total, color: 'var(--navy)', bg: '#f8fafc', border: '1px solid var(--border)' },
          { title: 'To Do', value: summary.todo, color: '#3B82F6', bg: '#EFF6FF', border: '1px solid #BFDBFE' },
          { title: 'In Progress', value: summary.in_progress, color: '#F59E0B', bg: '#FFFBEB', border: '1px solid #FDE68A' },
          { title: 'Done / Selesai', value: summary.done, color: '#10B981', bg: '#ECFDF5', border: '1px solid #A7F3D0' },
          { title: 'Overdue', value: summary.overdue, color: '#E24B4A', bg: '#FEF2F2', border: '1px solid #FCA5A5' }
        ].map((card, i) => (
          <div 
            key={i} 
            style={{ 
              background: card.bg, 
              border: card.border, 
              borderRadius: 12, 
              padding: 16,
              boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>
              {card.title}
            </span>
            <span style={{ fontSize: 24, fontWeight: 800, color: card.color }}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Toolbar Filter */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        {/* Row 1: Search and filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative', flexGrow: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Cari task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
                fontSize: 13,
                background: '#f8fafc'
              }}
            />
          </div>

          {/* Project filter */}
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              outline: 'none',
              fontSize: 13,
              background: '#fff',
              cursor: 'pointer',
              minWidth: 140
            }}
          >
            <option value="">Semua Proyek</option>
            {filterOptions.projects.map(p => (
              <option key={p.id} value={p.id}>{p.project_code || 'PRJ'} • {p.project_name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              outline: 'none',
              fontSize: 13,
              background: '#fff',
              cursor: 'pointer',
              minWidth: 120
            }}
          >
            <option value="">Semua Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review / Inspeksi</option>
            <option value="done">Done</option>
          </select>

          {/* Priority filter */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              outline: 'none',
              fontSize: 13,
              background: '#fff',
              cursor: 'pointer',
              minWidth: 120
            }}
          >
            <option value="">Semua Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Division filter */}
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              outline: 'none',
              fontSize: 13,
              background: '#fff',
              cursor: 'pointer',
              minWidth: 120
            }}
          >
            <option value="">Semua Divisi</option>
            {filterOptions.divisions.map(d => (
              <option key={d} value={d}>{DIVISION_LABELS[d] || d}</option>
            ))}
          </select>

          {/* Assignee filter */}
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              outline: 'none',
              fontSize: 13,
              background: '#fff',
              cursor: 'pointer',
              minWidth: 140
            }}
          >
            <option value="">Semua Assignee</option>
            {filterOptions.users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Kanban / List Toggle */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'kanban' ? '#fff' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--navy)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Grid size={14} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'list' ? '#fff' : 'transparent',
                color: viewMode === 'list' ? 'var(--navy)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <List size={14} /> List
            </button>
          </div>
        </div>

        {/* Row 2: Switches and Reset */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 12, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Task Saya toggle */}
            <button
              onClick={() => setIsMyTasks(!isMyTasks)}
              style={{
                padding: '6px 12px',
                fontSize: 12.5,
                fontWeight: 700,
                borderRadius: 6,
                border: '1px solid',
                borderColor: isMyTasks ? 'var(--blue)' : 'var(--border)',
                background: isMyTasks ? '#EFF6FF' : '#fff',
                color: isMyTasks ? 'var(--blue)' : 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s'
              }}
            >
              <User size={13} />
              {isMyTasks ? 'Task Saya Aktif' : 'Tampilkan Task Saya'}
            </button>

            {/* Overdue filter checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                style={{ width: 14, height: 14, cursor: 'pointer' }}
              />
              Tampilkan Overdue Saja
            </label>

            {/* Group By Selector (List view only) */}
            {viewMode === 'list' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Group by:</span>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    outline: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#fff',
                    cursor: 'pointer',
                    color: 'var(--navy)'
                  }}
                >
                  <option value="none">Tidak dikelompokkan</option>
                  <option value="project">Proyek</option>
                  <option value="assignee">Assignee</option>
                  <option value="division">Divisi</option>
                </select>
              </div>
            )}
          </div>

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #FCA5A5',
                background: '#FFF5F5',
                color: '#E24B4A',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} /> Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main content display */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{
            width: 30,
            height: 30,
            border: '3px solid rgba(0,0,0,0.05)',
            borderTopColor: 'var(--blue)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px'
          }} />
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
          <div>Memuat data tugas...</div>
        </div>
      ) : error ? (
        <div style={{
          padding: 24,
          background: '#FFF5F5',
          border: '1px solid #FCA5A5',
          borderRadius: 8,
          textAlign: 'center',
          color: '#E24B4A',
          fontSize: 13.5,
          fontWeight: 600
        }}>
          {error}
        </div>
      ) : tasks.length === 0 ? (
        // EMPTY STATE
        <div style={{
          background: '#ffffff',
          border: '1px dashed var(--border)',
          borderRadius: 12,
          padding: '48px 24px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            margin: '0 auto 16px'
          }}>
            <Search size={24} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px 0' }}>
            Tidak ada task ditemukan
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
            Coba ubah filter pencarian atau buat task baru di sistem.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            {hasActiveFilters && (
              <button 
                onClick={handleResetFilters}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                Reset Filter
              </button>
            )}
            <button 
              onClick={() => {
                setActiveFormTask(null);
                setFormOpen(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                background: 'var(--blue)',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              + Tambah Task
            </button>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        // KANBAN VIEW
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleUpdateStatus}
          onEdit={(task) => {
            setActiveFormTask(task);
            setFormOpen(true);
          }}
          onDelete={(id) => {
            const taskToDelete = tasks.find(t => t.id === id);
            if (taskToDelete) setActiveDeleteTask(taskToDelete);
          }}
          isGlobal={true}
          onCardClick={(task) => {
            setActiveDetailTask(task);
          }}
        />
      ) : (
        // LIST VIEW (Alternatif)
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 16px', width: 20 }}>·</th>
                <th style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>Judul Task</th>
                <th style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>Proyek</th>
                <th style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>Divisi</th>
                <th style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>Priority</th>
                <th style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>Assignee</th>
                <th style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>Due Date</th>
                <th style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>Status</th>
                <th style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedData).map(([groupName, groupTasks]) => (
                <React.Fragment key={groupName}>
                  {/* Group Header */}
                  {groupBy !== 'none' && (
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid var(--border)' }}>
                      <td colSpan={9} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
                        {groupName} ({groupTasks.length} task)
                      </td>
                    </tr>
                  )}
                  
                  {/* Rows */}
                  {groupTasks.map(task => {
                    const overdue = task.is_overdue;
                    const isDone = task.status === 'done';
                    const prioColor = PRIORITY_COLORS[task.priority?.toLowerCase()] || PRIORITY_COLORS.medium;
                    
                    const formatListDate = (dateStr) => {
                      if (!dateStr) return '-';
                      const date = new Date(dateStr);
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
                    };

                    return (
                      <tr 
                        key={task.id} 
                        onClick={() => setActiveDetailTask(task)}
                        style={{ 
                          borderBottom: '1px solid var(--border)', 
                          background: overdue ? '#FFF5F5' : '#ffffff', 
                          opacity: isDone ? 0.6 : 1,
                          cursor: 'pointer',
                          hover: { background: '#f8fafc' }
                        }}
                      >
                        {/* Dot priority */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                          <span style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: prioColor }} />
                        </td>
                        
                        {/* Judul Task */}
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--navy)', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {task.title}
                        </td>
                        
                        {/* Proyek */}
                        <td 
                          style={{ padding: '12px 16px', fontSize: 12.5 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${task.project_id}`);
                          }}
                        >
                          <span style={{ color: 'var(--blue)', textDecoration: 'underline', fontWeight: 600 }}>
                            {task.project_code || 'PRJ'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                            {task.project_name}
                          </span>
                        </td>
                        
                        {/* Divisi */}
                        <td style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--text)' }}>
                          {DIVISION_LABELS[task.division?.toLowerCase()] || task.division || 'Lainnya'}
                        </td>
                        
                        {/* Priority Label */}
                        <td style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                          {task.priority}
                        </td>
                        
                        {/* Assignee */}
                        <td style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--text)' }}>
                          {task.assigned_name || 'Unassigned'}
                        </td>
                        
                        {/* Due Date */}
                        <td style={{ padding: '12px 16px', fontSize: 12.5 }}>
                          {overdue ? (
                            <span style={{ color: '#EF4444', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <AlertCircle size={12} />
                              {formatListDate(task.due_date)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text)' }}>
                              {task.due_date ? formatListDate(task.due_date) : '-'}
                            </span>
                          )}
                        </td>
                        
                        {/* Inline Status Dropdown */}
                        <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                          {renderInlineStatusSelector(task)}
                        </td>
                        
                        {/* Action buttons */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setActiveFormTask(task);
                                setFormOpen(true);
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Edit"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => {
                                setActiveDeleteTask(task);
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderTop: '1px solid var(--border)', background: '#f8fafc' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                Sebelumnya
              </button>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Form Modal */}
      {formOpen && (
        <TaskFormModal
          task={activeFormTask}
          isGlobal={true}
          projects={filterOptions.projects}
          onSubmit={handleCreateOrUpdateTask}
          onClose={() => {
            setFormOpen(false);
            setActiveFormTask(null);
          }}
        />
      )}

      {/* Task Detail Modal */}
      {activeDetailTask && (
        <TaskDetailModal
          task={activeDetailTask}
          onClose={() => setActiveDetailTask(null)}
          onEdit={(task) => {
            setActiveFormTask(task);
            setFormOpen(true);
          }}
          onDelete={(id) => {
            const taskToDelete = tasks.find(t => t.id === id);
            if (taskToDelete) {
              setActiveDeleteTask(taskToDelete);
            }
          }}
          onStatusChange={handleUpdateStatus}
        />
      )}

      {/* Delete Confirmation Modal */}
      {activeDeleteTask && (
        <DeleteTaskModal
          task={activeDeleteTask}
          onConfirm={handleDeleteConfirm}
          onClose={() => setActiveDeleteTask(null)}
        />
      )}
    </div>
  );
}
