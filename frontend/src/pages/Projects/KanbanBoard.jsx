import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlertCircle, Edit, Trash2, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'in_progress', title: 'In Progress', color: '#F59E0B', bg: '#FFFBEB' }, // Light amber bg
  { id: 'review', title: 'Review / Inspeksi', color: '#8B5CF6', bg: '#F3E8FF' },
  { id: 'done', title: 'Done', color: '#10B981', bg: '#ECFDF5' }
];

const PRIORITY_COLORS = {
  high: '#E24B4A',
  medium: '#F59E0B',
  low: '#10B981'
};

const PRIORITY_LEFT_BORDERS = {
  high: '4px solid #E24B4A',
  medium: '4px solid #F59E0B',
  low: '4px solid #10B981'
};

const DIVISION_TAGS = {
  persiapan: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Persiapan' },
  sipil: { bg: '#FEF3C7', color: '#B45309', label: 'Sipil' },
  mep: { bg: '#F3E8FF', color: '#6D28D9', label: 'MEP' },
  arsitektur: { bg: '#ECFDF5', color: '#047857', label: 'Arsitektur' },
  finishing: { bg: '#FDF2F8', color: '#BE185D', label: 'Finishing' },
  other: { bg: '#F3F4F6', color: '#4B5563', label: 'Lainnya' }
};

export default function KanbanBoard({ tasks, onStatusChange, onEdit, onDelete, projectId, isGlobal = false, onCardClick }) {
  const navigate = useNavigate();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showAllDone, setShowAllDone] = useState(false);

  // Group tasks by status
  const tasksByStatus = {
    todo: [],
    in_progress: [],
    review: [],
    done: []
  };

  tasks.forEach(t => {
    const status = t.status || 'todo';
    const statusKey = status.toLowerCase();
    if (tasksByStatus[statusKey]) {
      tasksByStatus[statusKey].push(t);
    } else {
      tasksByStatus.todo.push(t);
    }
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const dDate = new Date(dateStr);
    dDate.setHours(0,0,0,0);
    
    let formatted = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    
    // If overdue, show relative time
    if (dDate < today) {
      const diffTime = Math.abs(today - dDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      formatted += ` (${diffDays} hari lalu)`;
    }
    return formatted;
  };

  const getAssigneeInitials = (name) => {
    if (!name) return '?';
    return name.split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const isOverdue = (task) => {
    if (task.status === 'done' || !task.due_date && !task.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date || task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(250px, 1fr))', gap: 16, overflowX: 'auto', paddingBottom: 10 }}>
      {COLUMNS.map(col => {
        const colTasks = tasksByStatus[col.id] || [];
        
        // Handle done column collapse limit (max 5)
        const isDoneCol = col.id === 'done';
        const displayTasks = isDoneCol && !showAllDone 
          ? colTasks.slice(0, 5) 
          : colTasks;

        const hasMoreDone = isDoneCol && colTasks.length > 5;

        return (
          <div 
            key={col.id} 
            style={{ 
              background: '#f8fafc', 
              borderRadius: 12, 
              border: '1px solid var(--border)', 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: 480, 
              maxHeight: 750 
            }}
          >
            {/* Column Header */}
            <div 
              style={{ 
                padding: '14px 16px', 
                borderBottom: '1px solid var(--border)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <h4 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>{col.title}</h4>
              </div>
              <span 
                style={{ 
                  background: col.bg, 
                  color: col.color, 
                  padding: '2px 8px', 
                  fontSize: 11, 
                  fontWeight: 700, 
                  borderRadius: 20 
                }}
              >
                {colTasks.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>
              {displayTasks.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 11.5, fontStyle: 'italic', border: '1px dashed var(--border)', borderRadius: 8, background: '#fff' }}>
                  Tidak ada task
                </div>
              ) : (
                displayTasks.map(task => {
                  const divTag = DIVISION_TAGS[task.division?.toLowerCase()] || DIVISION_TAGS.other;
                  const leftBorder = PRIORITY_LEFT_BORDERS[task.priority?.toLowerCase()] || PRIORITY_LEFT_BORDERS.medium;
                  const overdue = isOverdue(task);
                  const isDone = task.status?.toLowerCase() === 'done';

                  return (
                    <div 
                      key={task.id} 
                      className="card"
                      onClick={() => onCardClick && onCardClick(task)}
                      style={{ 
                        background: overdue ? '#FFF5F5' : '#ffffff', 
                        border: '1px solid var(--border)', 
                        borderLeft: leftBorder,
                        borderRadius: 10, 
                        padding: 14, 
                        position: 'relative',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        opacity: isDone ? 0.55 : 1,
                        transition: 'all 0.2s',
                        cursor: onCardClick ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Project Chip (Global View only) */}
                      {isGlobal && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${task.project_id || task.projectId}`);
                          }}
                          style={{
                            background: '#E0F2FE',
                            color: '#0369A1',
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            marginBottom: '8px',
                            alignSelf: 'flex-start',
                            display: 'inline-block',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={`Lihat Proyek: ${task.project_name || 'Detail'}`}
                        >
                          {task.project_code || 'PRJ'} • {task.project_name}
                        </button>
                      )}

                      {/* Top Bar: Priority label & Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 750, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Edit & Delete Action icons */}
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(task);
                            }}
                            style={{ background: 'transparent', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="Edit Task"
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(task.id);
                            }}
                            style={{ background: 'transparent', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="Hapus Task"
                          >
                            <Trash2 size={12} style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      </div>

                      {/* Overdue Badge */}
                      {overdue && (
                        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 4, background: '#FEF2F2', color: '#EF4444', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, marginBottom: 8 }}>
                          <AlertCircle size={10} />
                          Overdue
                        </div>
                      )}

                      {/* Title */}
                      <h5 
                        style={{ 
                          fontSize: 13, 
                          fontWeight: 700, 
                          color: 'var(--navy)', 
                          margin: '0 0 8px 0',
                          lineHeight: 1.4,
                          textDecoration: isDone ? 'line-through' : 'none'
                        }}
                      >
                        {task.title}
                      </h5>

                      {/* Description snippet */}
                      {task.description && (
                        <p style={{ fontSize: 11.5, color: 'var(--text-subtle)', margin: '0 0 12px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                          {task.description}
                        </p>
                      )}

                      {/* Division Tag */}
                      <div style={{ marginBottom: 12 }}>
                        <span 
                          style={{ 
                            display: 'inline-block', 
                            background: divTag.bg, 
                            color: divTag.color, 
                            padding: '2px 8px', 
                            fontSize: 10, 
                            fontWeight: 700, 
                            borderRadius: 4
                          }}
                        >
                          {divTag.label}
                        </span>
                      </div>

                      <div style={{ borderTop: '1px solid #f1f5f9', margin: '8px 0' }} />

                      {/* Card Footer: Assignee & Date */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div 
                            style={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '50%', 
                              background: '#3B82F618', 
                              color: '#3B82F6', 
                              fontSize: 10, 
                              fontWeight: 700, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}
                            title={`Ditugaskan ke: ${task.assigned_name || task.assignedName || 'Belum ditugaskan'}`}
                          >
                            {getAssigneeInitials(task.assigned_name || task.assignedName)}
                          </div>
                          <span style={{ fontSize: 11.5, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
                            {task.assigned_name || task.assignedName || 'Unassigned'}
                          </span>
                        </div>

                        {(task.due_date || task.dueDate) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: overdue ? '#EF4444' : 'var(--text-muted)', fontSize: 11 }}>
                            <Calendar size={11} />
                            <span style={{ fontWeight: overdue ? '700' : 'normal' }}>
                              {formatDate(task.due_date || task.dueDate)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick Shift Button */}
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            padding: '3px 8px',
                            fontSize: 10.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--navy)'
                          }}
                        >
                          Pindahkan ke... <ArrowRight size={10} />
                        </button>

                        {activeMenuId === task.id && (
                          <div 
                            style={{ 
                              position: 'absolute', 
                              bottom: '100%', 
                              right: 0, 
                              background: '#fff', 
                              border: '1px solid var(--border)', 
                              borderRadius: 6, 
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
                              zIndex: 10, 
                              display: 'flex', 
                              flexDirection: 'column', 
                              padding: 4, 
                              minWidth: 130 
                            }}
                          >
                            {COLUMNS.filter(c => c.id !== task.status?.toLowerCase()).map(c => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  onStatusChange(task.id, c.id);
                                  setActiveMenuId(null);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  padding: '6px 8px',
                                  fontSize: 11.5,
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  borderRadius: 4,
                                  color: 'var(--text)',
                                  hover: { background: '#f8fafc' }
                                }}
                              >
                                {c.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Done column collapse/expand trigger */}
              {hasMoreDone && (
                <button
                  onClick={() => setShowAllDone(!showAllDone)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: '#ffffff',
                    color: 'var(--blue)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 4,
                    width: '100%'
                  }}
                >
                  {showAllDone ? (
                    <>
                      Sembunyikan <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      Lihat {colTasks.length - 5} lainnya <ChevronDown size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
