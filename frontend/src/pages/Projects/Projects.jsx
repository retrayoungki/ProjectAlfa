import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, HelpCircle } from 'lucide-react';
import { useProjectsQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation } from '../../hooks/useProjects';
import ProjectCard from './ProjectCard';
import ProjectFormModal from './ProjectFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function Projects() {
  const { search: searchParams } = useLocation();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const limit = 6; // Grid 3 columns looks best with multiples of 3

  // Modal States
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formType, setFormType] = useState('create'); // 'create' | 'edit'
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Keyboard shortcut Ctrl+K / ⌘K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('project-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Deep-link check to auto-open create project form
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.get('create') === 'true') {
      setFormType('create');
      const clientId = params.get('client_id');
      if (clientId) {
        setSelectedProject({ clientId });
      } else {
        setSelectedProject(null);
      }
      setFormModalOpen(true);
    }
  }, [searchParams]);

  // Fetch all projects for stats calculation (independent of filters/pages)
  const { data: statsData } = useProjectsQuery({ limit: 1000 });

  // Fetch paginated and filtered projects for the grid
  const { data: paginatedData, isLoading, isError, error } = useProjectsQuery({
    status: statusFilter,
    search: debouncedSearch,
    page,
    limit
  });

  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();

  // Stats Calculations
  const stats = React.useMemo(() => {
    const projects = statsData?.data || [];
    const total = projects.length;
    
    // Ongoing is status = execution
    const ongoing = projects.filter(p => p.status === 'execution').length;
    
    // Deadline <= 14 days
    const today = new Date();
    const nearDeadline = projects.filter(p => {
      if (!p.contractEndDate || p.status === 'completed' || p.status === 'handover') return false;
      const end = new Date(p.contractEndDate);
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 14;
    }).length;

    // Over budget: budget_used > budget * 0.95
    const overBudget = projects.filter(p => {
      const b = p.budget || 0;
      const bu = p.budgetUsed || 0;
      return b > 0 && bu > b * 0.95;
    }).length;

    return { total, ongoing, nearDeadline, overBudget };
  }, [statsData]);

  // Handlers
  const handleOpenCreate = () => {
    setFormType('create');
    setSelectedProject(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (project) => {
    setFormType('edit');
    setSelectedProject(project);
    setFormModalOpen(true);
  };

  const handleOpenDelete = (project) => {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (formType === 'create') {
      await createMutation.mutateAsync(formData);
    } else {
      await updateMutation.mutateAsync({ id: selectedProject.id, ...formData });
    }
    setFormModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete?.id) {
      await deleteMutation.mutateAsync(projectToDelete.id);
    }
    setDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  const handleStatusTabClick = (tab) => {
    setStatusFilter(tab);
    setPage(1);
  };

  // Pagination bounds
  const projectsList = paginatedData?.data || [];
  const totalItems = paginatedData?.total || 0;
  const totalPages = paginatedData?.totalPages || 1;
  const showingFrom = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, totalItems);

  return (
    <div className="projects-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── HEADER ── */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
            Projects
          </h1>
          <p className="page-subtitle" style={{ fontSize: 14, color: 'var(--text-subtle)', marginTop: 4 }}>
            {stats.total} total &middot; {stats.ongoing} ongoing
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Create
        </button>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Total Proyek (hitam) */}
        <div className="card card-pad" style={{ borderLeft: '4px solid #0f172a', background: 'var(--surface)' }}>
          <span className="text-xs text-muted" style={{ display: 'block', fontWeight: 600, letterSpacing: '0.05em' }}>TOTAL PROJECTS</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4, display: 'block' }}>{stats.total}</span>
        </div>

        {/* Sedang Berjalan (biru) */}
        <div className="card card-pad" style={{ borderLeft: '4px solid #3b82f6', background: 'var(--surface)' }}>
          <span className="text-xs text-muted" style={{ display: 'block', fontWeight: 600, letterSpacing: '0.05em' }}>ACTIVE/ONGOING</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6', marginTop: 4, display: 'block' }}>{stats.ongoing}</span>
        </div>

        {/* Deadline dekat (kuning) */}
        <div className="card card-pad" style={{ borderLeft: '4px solid #f59e0b', background: 'var(--surface)' }}>
          <span className="text-xs text-muted" style={{ display: 'block', fontWeight: 600, letterSpacing: '0.05em' }}>DEADLINE ≤ 14 DAYS</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4, display: 'block' }}>{stats.nearDeadline}</span>
        </div>

        {/* Over budget (merah) */}
        <div className="card card-pad" style={{ borderLeft: '4px solid #ef4444', background: 'var(--surface)' }}>
          <span className="text-xs text-muted" style={{ display: 'block', fontWeight: 600, letterSpacing: '0.05em' }}>OVER BUDGET (&gt;95%)</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginTop: 4, display: 'block' }}>{stats.overBudget}</span>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--text-subtle)' }}>
            <Search size={16} />
          </span>
          <input
            id="project-search-input"
            type="text"
            className="form-input"
            placeholder="Search projects... (⌘K)"
            style={{ width: '100%', paddingLeft: 36, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="tabs" style={{ display: 'flex', gap: 4, background: 'var(--bg)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
          {['All', 'Preparation', 'Execution', 'Handover', 'Completed'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
              style={{
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: statusFilter === tab ? 'var(--surface)' : 'transparent',
                color: statusFilter === tab ? 'var(--navy)' : 'var(--text-muted)',
                boxShadow: statusFilter === tab ? 'var(--shadow-sm)' : 'none'
              }}
              onClick={() => handleStatusTabClick(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID OF CARDS ── */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card card-pad" style={{ height: 260, opacity: 0.5 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--border)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 16, width: '70%', background: 'var(--border)', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 12, width: '40%', background: 'var(--border)', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ height: 12, width: '90%', background: 'var(--border)', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ height: 12, width: '60%', background: 'var(--border)', borderRadius: 4, marginBottom: 20 }} />
              <div style={{ height: 8, width: '100%', background: 'var(--border)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--red)', border: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 600 }}>Error loading projects</p>
          <p className="text-xs text-muted" style={{ marginTop: 4 }}>{error?.message || 'Please check if your backend server is running.'}</p>
        </div>
      ) : totalItems === 0 ? (
        <div className="card card-pad" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-subtle)' }}>
          <HelpCircle size={40} style={{ margin: '0 auto 12px', strokeWidth: 1.5 }} />
          <p style={{ fontWeight: 600, fontSize: 16 }}>No projects found</p>
          <p className="text-xs text-muted" style={{ marginTop: 4 }}>Try adjusting your search query or status filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {projectsList.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* ── PAGINATION ── */}
      {totalItems > 0 && (
        <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>
            Showing <strong>{showingFrom}–{showingTo}</strong> of <strong>{totalItems}</strong> projects
          </span>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ minWidth: 32 }}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {formModalOpen && (
        <ProjectFormModal
          isOpen={formModalOpen}
          type={formType}
          project={selectedProject}
          onClose={() => setFormModalOpen(false)}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* ── DELETE CONFIRMATION ── */}
      {deleteModalOpen && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          project={projectToDelete}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
