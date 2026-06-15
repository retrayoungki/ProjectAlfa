import React from 'react';
import { Calendar, AlertCircle, Edit, Trash2 } from 'lucide-react';

const PRIORITY_BADGES = {
  high: { bg: '#FEF2F2', color: '#EF4444', label: 'High' },
  medium: { bg: '#FFFBEB', color: '#F59E0B', label: 'Medium' },
  low: { bg: '#ECFDF5', color: '#10B981', label: 'Low' }
};

const DIVISION_LABELS = {
  persiapan: 'Persiapan',
  sipil: 'Sipil',
  mep: 'MEP',
  arsitektur: 'Arsitektur',
  finishing: 'Finishing',
  other: 'Lainnya'
};

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' }
];

export default function TaskListView({ tasks, onStatusChange, onEdit, onDelete }) {
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const isOverdue = (task) => {
    if (task.status === 'done' || !task.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <div className="card" style={{ overflowX: 'auto', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
            <th style={{ padding: '12px 16px', width: 40 }}></th>
            <th style={{ padding: '12px 16px' }}>Judul Task</th>
            <th style={{ padding: '12px 16px' }}>Divisi</th>
            <th style={{ padding: '12px 16px' }}>Priority</th>
            <th style={{ padding: '12px 16px' }}>Assignee</th>
            <th style={{ padding: '12px 16px' }}>Due Date</th>
            <th style={{ padding: '12px 16px' }}>Status</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', width: 100 }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ padding: 30, textAlign: 'center', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                Tidak ada task yang ditemukan.
              </td>
            </tr>
          ) : (
            tasks.map(task => {
              const prioBadge = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;
              const overdue = isOverdue(task);
              const isDone = task.status === 'done';

              return (
                <tr 
                  key={task.id} 
                  style={{ 
                    borderBottom: '1px solid var(--border)', 
                    background: isDone ? '#f8fafc' : 'transparent',
                    opacity: isDone ? 0.75 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Checklist Checkbox */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => onStatusChange(task.id, isDone ? 'todo' : 'done')}
                      style={{ 
                        width: 16, 
                        height: 16, 
                        cursor: 'pointer',
                        accentColor: 'var(--blue)'
                      }}
                    />
                  </td>

                  {/* Task Title */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span 
                        style={{ 
                          fontWeight: 600, 
                          color: 'var(--navy)',
                          textDecoration: isDone ? 'line-through' : 'none'
                        }}
                      >
                        {task.title}
                      </span>
                      {task.description && (
                        <span style={{ fontSize: 11.5, color: 'var(--text-subtle)', display: 'block', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Division */}
                  <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: 'var(--text)' }}>
                    {DIVISION_LABELS[task.division] || task.division || '-'}
                  </td>

                  {/* Priority Badge */}
                  <td style={{ padding: '12px 16px' }}>
                    <span 
                      style={{ 
                        background: prioBadge.bg, 
                        color: prioBadge.color, 
                        padding: '3px 8px', 
                        borderRadius: 4, 
                        fontSize: 10.5, 
                        fontWeight: 700 
                      }}
                    >
                      {prioBadge.label}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td style={{ padding: '12px 16px', color: 'var(--text)' }}>
                    {task.assignedName || <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>Belum ditugaskan</span>}
                  </td>

                  {/* Due Date */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: overdue ? '#EF4444' : 'var(--text)' }}>
                      <Calendar size={13} />
                      <span>{formatDate(task.dueDate)}</span>
                      {overdue && (
                        <span 
                          style={{ 
                            background: '#FEF2F2', 
                            color: '#EF4444', 
                            padding: '1px 4px', 
                            borderRadius: 4, 
                            fontSize: 9.5, 
                            fontWeight: 700 
                          }}
                        >
                          Overdue
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Inline Status Select */}
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: '#fff',
                        outline: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: 'var(--navy)'
                      }}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Actions (Edit / Delete) */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                      <button 
                        onClick={() => onEdit(task)}
                        style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                        title="Edit Task"
                      >
                        <Edit size={14} style={{ color: 'var(--blue)' }} />
                      </button>
                      <button 
                        onClick={() => onDelete(task.id)}
                        style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                        title="Hapus Task"
                      >
                        <Trash2 size={14} style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
