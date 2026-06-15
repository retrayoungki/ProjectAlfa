import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Edit2, Trash2, Eye, Calendar } from 'lucide-react';

const BORDER_COLORS = {
  preparation: '#F59E0B',
  execution: '#3B82F6',
  testing: '#8B5CF6',
  handover: '#10B981',
  maintenance: '#6B7280',
  completed: '#065F46',
  on_hold: '#EF4444'
};

const STATUS_BADGES = {
  preparation: { bg: '#FEF3C7', color: '#D97706', label: 'Preparation' },
  execution: { bg: '#DBEAFE', color: '#2563EB', label: 'Execution' },
  testing: { bg: '#F3E8FF', color: '#7C3AED', label: 'Testing' },
  handover: { bg: '#D1FAE5', color: '#059669', label: 'Handover' },
  maintenance: { bg: '#F3F4F6', color: '#4B5563', label: 'Maintenance' },
  completed: { bg: '#D1FAE5', color: '#065F46', label: 'Completed' },
  on_hold: { bg: '#FEE2E2', color: '#DC2626', label: 'On Hold' }
};

export default function ProjectCard({ project, onEdit, onDelete }) {
  const navigate = useNavigate();
  const status = (project.status || 'preparation').toLowerCase();
  const borderLeftColor = BORDER_COLORS[status] || '#6B7280';
  const badgeInfo = STATUS_BADGES[status] || { bg: '#F3F4F6', color: '#4B5563', label: project.status };

  // Initials for avatar
  const initials = React.useMemo(() => {
    const name = project.projectName || '';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'PR';
  }, [project.projectName]);

  // Format currency
  const formatRupiah = (val) => {
    if (val === undefined || val === null) return 'Rp. 0';
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Format date to Indonesian format e.g. "19 Jun 2026"
  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Sisa hari & Deadline state
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = project.contractEndDate ? new Date(project.contractEndDate) : null;
  if (deadline) deadline.setHours(0, 0, 0, 0);

  const diffDays = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isOverdue = diffDays !== null && diffDays < 0;

  // Badge checks
  const isDeadlineNear = diffDays !== null && diffDays >= 0 && diffDays <= 14 && status !== 'completed' && status !== 'handover';
  const isOverBudget = project.budget > 0 && (project.budgetUsed || 0) > project.budget * 0.95;

  // Task progress calculation
  const totalTasks = project.totalTasks || 0;
  const completedTasks = project.completedTasks || 0;
  const taskProgressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div
      className="card"
      style={{
        borderLeft: `3px solid ${borderLeftColor}`,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'var(--surface)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        padding: '16px 20px',
        gap: 12
      }}
    >
      {/* ── TOP SECTION ── */}
      <div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          {/* Project Avatar */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              background: `${borderLeftColor}20`,
              color: borderLeftColor,
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {initials}
          </div>

          {/* Project Title and Code */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <span className="text-xs text-muted" style={{ fontSize: 10, fontWeight: 700 }}>
                {project.projectCode}
              </span>
              <span
                className="badge"
                style={{
                  background: badgeInfo.bg,
                  color: badgeInfo.color,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 4
                }}
              >
                {badgeInfo.label}
              </span>
            </div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--navy)',
                margin: '2px 0 0 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={project.projectName}
            >
              {project.projectName}
            </h3>
          </div>
        </div>

        {/* Badges bar */}
        {(isDeadlineNear || isOverBudget) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {isDeadlineNear && (
              <span
                className="badge"
                style={{
                  background: '#FEF3C7',
                  color: '#D97706',
                  padding: '2px 8px',
                  fontSize: 9.5,
                  fontWeight: 700,
                  borderRadius: 4,
                  border: '1px solid #FCD34D'
                }}
              >
                Deadline Dekat
              </span>
            )}
            {isOverBudget && (
              <span
                className="badge"
                style={{
                  background: '#FEE2E2',
                  color: '#DC2626',
                  padding: '2px 8px',
                  fontSize: 9.5,
                  fontWeight: 700,
                  borderRadius: 4,
                  border: '1px solid #FCA5A5'
                }}
              >
                Over Budget
              </span>
            )}
          </div>
        )}

        {/* Client Name */}
        <p
          className="text-xs text-muted"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            margin: '0 0 12px 0',
            fontSize: 12,
            color: 'var(--text-subtle)'
          }}
        >
          <Building size={14} style={{ flexShrink: 0 }} />
          <span>
            {project.clientId ? (
              <Link 
                to={`/clients/${project.clientId}`} 
                style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}
                className="hover-underline"
              >
                {project.clientName || 'No Client'}
              </Link>
            ) : (
              project.clientName || 'No Client'
            )}
          </span>
        </p>

        {/* Info Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 10,
            background: 'var(--bg)',
            borderRadius: 8,
            padding: 10,
            border: '1px solid var(--border)',
            marginBottom: 12
          }}
        >
          {/* Budget */}
          <div>
            <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10, fontWeight: 600 }}>BUDGET RAB</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>
              {formatRupiah(project.budget)}
            </span>
          </div>

          {/* Deadline */}
          <div>
            <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10, fontWeight: 600 }}>DEADLINE</span>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: isOverdue ? '#DC2626' : 'var(--text)'
              }}
            >
              {formatDateIndo(project.contractEndDate)}
              {isOverdue && (
                <span
                  style={{
                    marginLeft: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#DC2626'
                  }}
                >
                  (Lewat)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Task progress */}
        <div style={{ marginBottom: 4 }}>
          <div className="flex-between" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Tasks {completedTasks}/{totalTasks}</span>
            <span>{taskProgressPct}%</span>
          </div>
          <div className="progress-bar" style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              className="progress-fill"
              style={{
                height: '100%',
                width: `${taskProgressPct}%`,
                background: 'var(--blue)',
                borderRadius: 4
              }}
            />
          </div>
        </div>
      </div>

      {/* ── ACTIONS SECTION ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
          marginTop: 4
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', fontSize: 11.5 }}
            onClick={() => {
              navigate(`/projects/${project.id}`);
            }}
          >
            <Eye size={13} /> Detail
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', fontSize: 11.5 }}
            onClick={() => {
              navigate(`/calendar?project_id=${project.id}`);
            }}
            title="Lihat jadwal proyek di kalender"
          >
            <Calendar size={13} style={{ color: '#2563EB' }} /> Kalender
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', fontSize: 11.5 }}
            onClick={() => onEdit(project)}
          >
            <Edit2 size={13} /> Edit
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              fontSize: 11.5,
              color: '#DC2626',
              borderColor: '#FCA5A5'
            }}
            onClick={() => onDelete(project)}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
