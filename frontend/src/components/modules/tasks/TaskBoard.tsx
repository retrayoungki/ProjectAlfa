import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Task } from '../../../services/taskService';
import TaskCard from './TaskCard';

const COL_COLORS: Record<string, string> = { 
  'TODO': '#94A3B8', 
  'IN_PROGRESS': '#3A7BFF', 
  'DONE': '#10B981' 
};

const COL_LABELS: Record<string, string> = {
  'TODO': 'To Do',
  'IN_PROGRESS': 'In Progress',
  'DONE': 'Done'
};

interface TaskBoardProps {
  tasks: Task[];
  onUpdateStatus: (id: string, newStatus: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (defaultStatus: string) => void;
}

export default function TaskBoard({ tasks, onUpdateStatus, onDeleteTask, onAddTask }: TaskBoardProps) {
  const [dragging, setDragging] = useState<{ task: Task; col: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const columns = ['TODO', 'IN_PROGRESS', 'DONE'];

  const onDragStart = (task: Task, col: string) => setDragging({ task, col });
  const onDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    setDragOver(col);
  };
  const onDrop = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    if (dragging && dragging.col !== targetCol && targetCol !== '') {
      onUpdateStatus(dragging.task.id, targetCol);
    }
    setDragging(null);
    setDragOver(null);
  };

  // Group tasks
  const groupedTasks: Record<string, Task[]> = {
    'TODO': [],
    'IN_PROGRESS': [],
    'DONE': []
  };
  tasks.forEach(t => {
    if (groupedTasks[t.status]) {
      groupedTasks[t.status].push(t);
    } else {
      groupedTasks['TODO'].push(t); // fallback
    }
  });

  return (
    <>
      {/* Mobile-friendly Tab Summary */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {columns.map(col => (
          <div key={col} className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', flex: '1', minWidth: 100 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: COL_COLORS[col] }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{COL_LABELS[col]}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{groupedTasks[col].length}</span>
          </div>
        ))}
      </div>

      <div className="kanban-board">
        {columns.map(col => (
          <div
            key={col}
            className="kanban-col"
            style={{ 
              borderTop: `3px solid ${COL_COLORS[col]}`, 
              opacity: dragOver === col ? 0.9 : 1,
              background: dragOver === col ? 'var(--bg)' : 'var(--surface)'
            }}
            onDragOver={e => onDragOver(e, col)}
            onDrop={e => onDrop(e, col)}
          >
            <div className="kanban-col-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: COL_COLORS[col] }} />
                <span className="kanban-col-title">{COL_LABELS[col]}</span>
              </div>
              <div className="kanban-col-count">{groupedTasks[col].length}</div>
            </div>

            {groupedTasks[col].map(task => (
              <div key={task.id} style={{ opacity: dragging?.task.id === task.id ? 0.4 : 1 }}>
                <TaskCard 
                  task={task} 
                  onDragStart={onDragStart} 
                  onDelete={onDeleteTask} 
                />
              </div>
            ))}

            <button 
              onClick={() => onAddTask(col)}
              className="btn btn-ghost btn-sm w-full" 
              style={{ marginTop: 4, justifyContent: 'center', border: '1px dashed var(--border)' }}
            >
              <Plus size={12} /> Add card
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
