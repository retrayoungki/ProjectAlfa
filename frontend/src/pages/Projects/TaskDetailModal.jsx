import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, AlertCircle, Tag, Shield, Clock, CheckCircle } from 'lucide-react';

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

const STATUS_OPTIONS = [
  { id: 'todo', title: 'To Do', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'in_progress', title: 'In Progress', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'review', title: 'Review / Inspeksi', color: '#8B5CF6', bg: '#F3E8FF' },
  { id: 'done', title: 'Done', color: '#10B981', bg: '#ECFDF5' }
];

export default function TaskDetailModal({ task, onClose, onEdit, onDelete, onStatusChange }) {
  const navigate = useNavigate();
  if (!task) return null;

  const getAssigneeInitials = (name) => {
    if (!name) return '?';
    return name.split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const isOverdue = () => {
    if (task.status === 'done' || !task.due_date && !task.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date || task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const dDate = new Date(dateStr);
    dDate.setHours(0,0,0,0);

    let formatted = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    if (dDate < today && task.status !== 'done') {
      const diffTime = Math.abs(today - dDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      formatted += ` (${diffDays} hari lalu)`;
    }
    return formatted;
  };

  const overdue = isOverdue();
  const currentStatusObj = STATUS_OPTIONS.find(s => s.id === task.status?.toLowerCase()) || STATUS_OPTIONS[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        width: '100%',
        maxWidth: 580,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Detail Tugas
          </h3>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Project Chip */}
          <button
            onClick={() => {
              navigate(`/projects/${task.project_id || task.projectId}`);
              onClose();
            }}
            style={{
              background: '#EFF6FF',
              color: '#1D4ED8',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #BFDBFE',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              transition: 'background 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Ke halaman detail proyek"
          >
            <Shield size={12} />
            {task.project_code || 'PRJ'} • {task.project_name || 'Lihat Proyek'}
          </button>

          {/* Title */}
          <h2 style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--navy)',
            margin: 0,
            lineHeight: 1.4,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            opacity: task.status === 'done' ? 0.7 : 1
          }}>
            {task.title}
          </h2>

          {/* Key details grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            background: '#f8fafc',
            borderRadius: 10,
            padding: 16,
            border: '1px solid var(--border)'
          }}>
            {/* Status Change Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
              <select
                value={task.status?.toLowerCase() || 'todo'}
                onChange={(e) => onStatusChange(task.id, e.target.value)}
                style={{
                  background: currentStatusObj.bg,
                  color: currentStatusObj.color,
                  border: `1px solid ${currentStatusObj.color}40`,
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                  width: 'fit-content'
                }}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.id} value={s.id} style={{ background: '#fff', color: 'var(--navy)', fontWeight: 'bold' }}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prioritas</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: PRIORITY_COLORS[task.priority?.toLowerCase()] || PRIORITY_COLORS.medium
                }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', textTransform: 'capitalize' }}>
                  {task.priority || 'Medium'}
                </span>
              </div>
            </div>

            {/* Division */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Divisi Pekerjaan</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Tag size={13} style={{ color: 'var(--blue)' }} />
                {DIVISION_LABELS[task.division?.toLowerCase()] || task.division || 'Lainnya'}
              </span>
            </div>

            {/* Due Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tanggal Due</span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 4,
                color: overdue ? '#EF4444' : 'var(--navy)',
                fontWeight: overdue ? '700' : 'normal'
              }}>
                {overdue ? <AlertCircle size={14} /> : <Calendar size={14} />}
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {task.due_date || task.dueDate ? formatDate(task.due_date || task.dueDate) : 'Tidak ada'}
                </span>
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ditugaskan Ke</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#3B82F618',
                color: '#3B82F6',
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getAssigneeInitials(task.assigned_name || task.assignedName)}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 705, color: 'var(--navy)' }}>
                  {task.assigned_name || task.assignedName || 'Belum ditugaskan'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  ID: {task.assigned_to || task.assignedTo || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deskripsi Pekerjaan</span>
            <p style={{
              fontSize: 13.5,
              color: 'var(--text)',
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 14,
              lineHeight: 1.6,
              margin: 0,
              whiteSpace: 'pre-wrap',
              minHeight: 60
            }}>
              {task.description || 'Tidak ada deskripsi detail untuk tugas ini.'}
            </p>
          </div>

          {/* Date Created and Completed */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: 11.5,
            color: 'var(--text-muted)',
            borderTop: '1px solid #f1f5f9',
            paddingTop: 16
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              Dibuat: {formatDate(task.created_at || task.createdAt)}
            </span>
            {(task.completed_date || task.completedDate) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981' }}>
                <CheckCircle size={12} />
                Selesai: {formatDate(task.completed_date || task.completedDate)}
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '18px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          <button
            onClick={() => {
              onEdit(task);
            }}
            style={{
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: '#fff',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            Edit
          </button>
          <button
            onClick={() => {
              onDelete(task.id);
            }}
            style={{
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              border: 'none',
              background: '#EF4444',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Hapus
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
