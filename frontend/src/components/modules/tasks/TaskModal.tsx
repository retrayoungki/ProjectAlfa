import React, { useState } from 'react';
import ProjectModal from '../projects/ProjectModal';
import { useProjectsQuery } from '../../../hooks/useProjects';
import { useTeamQuery } from '../../../hooks/useTeam';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultStatus?: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export default function TaskModal({ isOpen, onClose, onSubmit, defaultStatus = 'TODO' }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const { data: projects = [] } = useProjectsQuery();
  const { data: users = [] } = useTeamQuery();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !projectId || !deadline) return;
    
    onSubmit({
      title,
      description,
      projectId,
      assigneeId,
      deadline,
      priority,
      status: defaultStatus
    });
    
    // Reset
    setTitle('');
    setDescription('');
    setProjectId('');
    setAssigneeId('');
    setDeadline('');
    setPriority('MEDIUM');
  };

  return (
    <ProjectModal isOpen={isOpen} onClose={onClose} title="Create New Task">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>Task Title *</label>
          <input
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="E.g. Design homepage layout"
            required
            autoFocus
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>Project *</label>
          <select 
            className="form-input" 
            value={projectId} 
            onChange={e => setProjectId(e.target.value)}
            required
          >
            <option value="">Select a project</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>Deadline *</label>
            <input
              type="date"
              className="form-input"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>Priority</label>
            <select className="form-input" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>Assignee</label>
            <select
              className="form-input"
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>Description</label>
          <textarea
            className="form-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Task details..."
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            Create Task
          </button>
        </div>
      </form>
    </ProjectModal>
  );
}
