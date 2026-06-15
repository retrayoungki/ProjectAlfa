import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, AlertCircle, Play, Plus, Search, 
  Filter, Kanban, List, FolderPlus, Upload, Grid
} from 'lucide-react';
import { fetchProjectTasks, createProjectTask, updateProjectTask, deleteProjectTask, updateProjectTaskStatus } from '../../services/projectService';
import KanbanBoard from './KanbanBoard';
import TaskListView from './TaskListView';
import TaskFormModal from './TaskFormModal';
import DocumentManager from './DocumentManager';

export default function TasksDocumentsTab({ projectId, project, loadProjectDetailData }) {
  const [activeSubTab, setActiveSubTab] = useState('Tasks'); // 'Tasks' | 'Dokumen'
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksSummary, setTasksSummary] = useState({ total: 0, todo: 0, in_progress: 0, review: 0, done: 0, overdue: 0 });
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState('');
  
  // Tasks Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  
  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // Load Tasks
  const loadTasks = async () => {
    try {
      setTasksLoading(true);
      setTasksError('');
      const data = await fetchProjectTasks(projectId, {
        status: 'all',
        division: selectedDivision,
        search: searchQuery
      });
      setTasks(data.tasks || []);
      setTasksSummary(data.summary || { total: 0, todo: 0, in_progress: 0, review: 0, done: 0, overdue: 0 });
    } catch (err) {
      console.error('Failed to load project tasks:', err);
      setTasksError(err.message || 'Gagal memuat tugas proyek.');
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && activeSubTab === 'Tasks') {
      loadTasks();
    }
  }, [projectId, activeSubTab, selectedDivision, searchQuery]);

  // Handle task status quick update (from Kanban / List checkbox)
  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await updateProjectTaskStatus(projectId, taskId, newStatus);
      loadTasks();
      loadProjectDetailData(); // refresh quick stats in header
    } catch (err) {
      alert(err.message || 'Gagal mengubah status tugas.');
    }
  };

  // Handle task form submit (create/edit)
  const handleTaskSubmit = async (formData) => {
    try {
      if (taskToEdit) {
        await updateProjectTask(projectId, taskToEdit.id, formData);
      } else {
        await createProjectTask(projectId, formData);
      }
      setIsTaskModalOpen(false);
      setTaskToEdit(null);
      loadTasks();
      loadProjectDetailData(); // refresh header
    } catch (err) {
      alert(err.message || 'Gagal menyimpan tugas.');
    }
  };

  const handleUploadSuccess = () => {
    loadTasks();
    loadProjectDetailData(); // refresh parent project logs & stats
  };

  // Handle task delete
  const handleTaskDelete = async (taskId) => {
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini secara permanen?')) {
      try {
        await deleteProjectTask(projectId, taskId);
        loadTasks();
        loadProjectDetailData();
      } catch (err) {
        alert(err.message || 'Gagal menghapus tugas.');
      }
    }
  };

  const openAddModal = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 8, width: 'fit-content' }}>
        {['Tasks', 'Dokumen'].map((tab) => (
          <button
            key={tab}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: activeSubTab === tab ? 'var(--surface)' : 'transparent',
              color: activeSubTab === tab ? 'var(--navy)' : 'var(--text-muted)',
              boxShadow: activeSubTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
            onClick={() => setActiveSubTab(tab)}
          >
            {tab === 'Tasks' ? 'Tasks' : 'Dokumen'}
          </button>
        ))}
      </div>

      {activeSubTab === 'Tasks' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* KPI Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--blue)', borderRadius: 10, background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Tasks</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', marginTop: 4, display: 'block' }}>{tasksSummary.total}</span>
              </div>
              <div style={{ background: '#eff6ff', padding: 8, borderRadius: 8, color: 'var(--blue)' }}><Grid size={20} /></div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10B981', borderRadius: 10, background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Selesai</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4, display: 'block' }}>{tasksSummary.done}</span>
              </div>
              <div style={{ background: '#ecfdf5', padding: 8, borderRadius: 8, color: '#10B981' }}><CheckCircle size={20} /></div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #F59E0B', borderRadius: 10, background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>In Progress</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B', marginTop: 4, display: 'block' }}>{tasksSummary.in_progress}</span>
              </div>
              <div style={{ background: '#fffbeb', padding: 8, borderRadius: 8, color: '#F59E0B' }}><Clock size={20} /></div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #EF4444', borderRadius: 10, background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Overdue</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#EF4444', marginTop: 4, display: 'block' }}>{tasksSummary.overdue}</span>
              </div>
              <div style={{ background: '#fef2f2', padding: 8, borderRadius: 8, color: '#EF4444' }}><AlertCircle size={20} /></div>
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: 'var(--surface)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 280 }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Search size={16} /></span>
                <input
                  type="text"
                  placeholder="Cari task..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    fontSize: 13,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    outline: 'none',
                    background: 'var(--bg)'
                  }}
                />
              </div>

              {/* Division Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Filter size={15} style={{ color: 'var(--text-muted)' }} />
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 13,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    outline: 'none',
                    background: 'var(--bg)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Semua Divisi</option>
                  <option value="persiapan">Persiapan</option>
                  <option value="sipil">Sipil</option>
                  <option value="mep">MEP</option>
                  <option value="arsitektur">Arsitektur</option>
                  <option value="finishing">Finishing</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
            </div>

            {/* View Mode & Add Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                <button
                  onClick={() => setViewMode('kanban')}
                  style={{
                    padding: '7px 12px',
                    background: viewMode === 'kanban' ? 'var(--bg)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: viewMode === 'kanban' ? 'var(--blue)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Kanban Board"
                >
                  <Grid size={15} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Kanban</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '7px 12px',
                    background: viewMode === 'list' ? 'var(--bg)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: viewMode === 'list' ? 'var(--blue)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="List View"
                >
                  <List size={15} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>List</span>
                </button>
              </div>

              <button
                className="btn btn-primary"
                onClick={openAddModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 6,
                  background: 'var(--blue)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                }}
              >
                <Plus size={16} /> Tambah Task
              </button>
            </div>
          </div>

          {/* Task Board / List */}
          {tasksLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px', width: 28, height: 28, border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p>Memuat daftar tugas...</p>
            </div>
          ) : tasksError ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--red)', background: '#fef2f2', borderRadius: 8, border: '1px solid #fee2e2' }}>
              {tasksError}
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanBoard 
              tasks={tasks} 
              onStatusChange={handleStatusUpdate}
              onEdit={openEditModal}
              onDelete={handleTaskDelete}
              projectId={projectId}
            />
          ) : (
            <TaskListView 
              tasks={tasks}
              onStatusChange={handleStatusUpdate}
              onEdit={openEditModal}
              onDelete={handleTaskDelete}
            />
          )}
        </div>
      ) : (
        <DocumentManager projectId={projectId} loadProjectDetailData={loadProjectDetailData} />
      )}

      {/* Task Creation / Editing Modal */}
      {isTaskModalOpen && (
        <TaskFormModal
          task={taskToEdit}
          project={project}
          onSubmit={handleTaskSubmit}
          onClose={() => setIsTaskModalOpen(false)}
        />
      )}
    </div>
  );
}
