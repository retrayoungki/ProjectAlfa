import React from 'react';
import { Calendar, MoreHorizontal, Trash2 } from 'lucide-react';
import { Task } from '../../../services/taskService';

interface TaskCardProps {
  task: Task;
  onDragStart: (task: Task, col: string) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_CLS: Record<string, string> = { 
  HIGH: 'priority-high', 
  MEDIUM: 'priority-medium', 
  LOW: 'priority-low' 
};

export default function TaskCard({ task, onDragStart, onDelete }: TaskCardProps) {
  // Extract initials from assigneeId (e.g. "AK")
  const assigneeInitials = task.assigneeId ? task.assigneeId.substring(0, 2).toUpperCase() : '??';
  
  // Choose an avatar color deterministically based on initials
  const colors = ['avatar-blue', 'avatar-green', 'avatar-amber', 'avatar-purple', 'avatar-teal', 'avatar-red'];
  const colorIndex = task.assigneeId ? task.assigneeId.charCodeAt(0) % colors.length : 0;
  const avatarCls = colors[colorIndex];

  // Format date
  const dateObj = new Date(task.deadline);
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      className="task-card"
      draggable
      onDragStart={() => onDragStart(task, task.status)}
      style={{ cursor: 'grab', position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 7 }}>
        <span className="badge badge-gray" style={{ padding: '2px 7px', fontSize: 10 }}>
          {task.project?.name || 'No Project'}
        </span>
        <button 
          onClick={() => onDelete(task.id)}
          className="btn btn-ghost" 
          style={{ padding: 2, height: 'auto', color: 'var(--text-subtle)' }}
          title="Delete Task"
        >
          <Trash2 size={13} />
        </button>
      </div>
      
      <p className="task-title" style={{ marginBottom: 4 }}>{task.title}</p>
      
      {task.description && (
        <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 9, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}

      <div className="task-meta" style={{ marginTop: task.description ? 0 : 8 }}>
        <div className={`avatar ${avatarCls}`} style={{ width: 23, height: 23, fontSize: 9 }}>
          {assigneeInitials}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div className={`priority-dot ${PRIORITY_CLS[task.priority] || 'priority-medium'}`} title={`Priority: ${task.priority}`} />
          <Calendar size={10} color="var(--text-subtle)" />
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
