import React from 'react';
import { Edit, Trash2, ExternalLink, Calendar, DollarSign, CheckSquare, Building2 } from 'lucide-react';
import { Project } from '../../../services/projectService';

interface Client {
  id: string;
  name: string;
  company: string;
}

interface ProjectTableProps {
  projects: Project[];
  clients?: Client[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onViewDetail: (project: Project) => void;
}

const STATUS_BADGE_CLASSES: Record<Project['status'], string> = {
  PREPARATION: 'badge-amber',
  DESIGN_RAB:  'badge-blue',
  EXECUTION:   'badge-blue',
  HAND_OVER:   'badge-green',
};

const STATUS_LABELS: Record<Project['status'], string> = {
  PREPARATION: 'Preparation',
  DESIGN_RAB:  'Design - RAB',
  EXECUTION:   'Execution',
  HAND_OVER:   'Hand Over',
};

// Accent colours per status (top bar + avatar bg)
const STATUS_ACCENT: Record<Project['status'], { bar: string; avatarBg: string; avatarColor: string }> = {
  PREPARATION: { bar: '#F59E0B', avatarBg: '#FEF3C7', avatarColor: '#D97706' },
  DESIGN_RAB:  { bar: '#8B5CF6', avatarBg: '#EDE9FE', avatarColor: '#7C3AED' },
  EXECUTION:   { bar: '#3A7BFF', avatarBg: '#E0ECFF', avatarColor: '#2563EB' },
  HAND_OVER:   { bar: '#10B981', avatarBg: '#D1FAE5', avatarColor: '#059669' },
};

function getInitials(name: string) {
  if (!name) return 'PR';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w ? w[0] : ''))
    .join('')
    .toUpperCase() || 'PR';
}

export default function ProjectTable({ projects, clients = [], onEdit, onDelete, onViewDetail }: ProjectTableProps) {
  const clientMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => { map[c.id] = c.company || c.name; });
    return map;
  }, [clients]);
  if (projects.length === 0) {
    return (
      <div
        className="card card-pad"
        style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-muted)' }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <CheckSquare size={24} color="var(--text-subtle)" />
        </div>
        <p style={{ fontSize: 15, fontWeight: 600 }}>No projects found.</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Create a new project to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="project-card-grid">
        {projects.map((p) => {
          const accent       = STATUS_ACCENT[p.status];
          const taskCount    = p.tasks?.length || 0;
          const completedTasks = p.tasks?.filter((t: any) => t.status === 'DONE').length || 0;
          const progressPct  = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
          const formattedBudget = `Rp. ${p.budget.toLocaleString('id-ID')}`;
          const clientName = p.clientId ? (clientMap[p.clientId] || 'Unknown Client') : 'No Client';
          const startDate = new Date(p.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          const endDate   = new Date(p.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

          return (
            <div key={p.id} className="project-card">
              {/* Coloured top accent bar */}
              <div
                className="project-card-accent"
                style={{ background: accent.bar }}
              />

              {/* Card body */}
              <div className="project-card-body">
                {/* Header row: avatar + name + status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: accent.avatarBg,
                      color: accent.avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 14,
                      flexShrink: 0,
                      letterSpacing: 0.5,
                    }}
                  >
                    {getInitials(p.name)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: 14.5,
                        color: 'var(--text)',
                        marginBottom: 3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.name}
                    </p>
                    <span className={`badge ${STATUS_BADGE_CLASSES[p.status]}`} style={{ fontSize: 10.5 }}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </div>
                </div>

                {/* Client */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 14,
                    color: 'var(--text-muted)',
                  }}
                >
                  <Building2 size={12} />
                  <span style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {clientName}
                  </span>
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div className="project-card-stat">
                    <DollarSign size={12} color={accent.avatarColor} />
                    <div>
                      <p className="project-card-stat-label">Budget</p>
                      <p className="project-card-stat-value">{formattedBudget}</p>
                    </div>
                  </div>
                  <div className="project-card-stat">
                    <Calendar size={12} color={accent.avatarColor} />
                    <div>
                      <p className="project-card-stat-label">Deadline</p>
                      <p className="project-card-stat-value">{endDate}</p>
                    </div>
                  </div>
                </div>

                {/* Task progress */}
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckSquare size={11} /> Tasks
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: accent.avatarColor }}>
                      {completedTasks}/{taskCount}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 99,
                      background: 'var(--border)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPct}%`,
                        background: accent.bar,
                        borderRadius: 99,
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    borderTop: '1px solid var(--border)',
                    paddingTop: 12,
                  }}
                >
                  <button
                    className="btn btn-ghost btn-sm project-card-btn"
                    onClick={() => onViewDetail(p)}
                    style={{ flex: 1, justifyContent: 'center', gap: 5, fontSize: 12 }}
                  >
                    <ExternalLink size={12} /> Detail
                  </button>
                  <button
                    className="btn btn-ghost btn-sm project-card-btn"
                    onClick={() => onEdit(p)}
                    style={{ flex: 1, justifyContent: 'center', gap: 5, fontSize: 12, color: '#3A7BFF' }}
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm project-card-btn"
                    onClick={() => p.id && onDelete(p.id)}
                    style={{ flex: 1, justifyContent: 'center', gap: 5, fontSize: 12, color: '#EF4444' }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .project-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .project-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
        }

        .project-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.10);
        }

        .project-card-accent {
          height: 4px;
          width: 100%;
          flex-shrink: 0;
        }

        .project-card-body {
          padding: 18px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .project-card-stat {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 10px;
        }

        .project-card-stat-label {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 500;
          margin-bottom: 2px;
        }

        .project-card-stat-value {
          font-size: 12px;
          font-weight: 700;
          color: var(--text);
        }

        .project-card-btn {
          border-radius: 8px;
          transition: background 0.15s ease;
        }

        @media (max-width: 480px) {
          .project-card-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
