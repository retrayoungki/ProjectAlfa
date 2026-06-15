import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchProjectMembers } from '../../services/projectService';

export default function TaskFormModal({ task, project, projects = [], onSubmit, onClose, isGlobal = false }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [division, setDivision] = useState('persiapan');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('todo');
  
  // For global mode: project selection
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setDivision(task.division || 'persiapan');
      setPriority(task.priority || 'medium');
      setAssignedTo(task.assigned_to || task.assignedTo || '');
      setStatus(task.status || 'todo');
      
      const pId = task.project_id || task.projectId || '';
      setSelectedProjectId(pId);
      
      if (task.due_date || task.dueDate) {
        // Format YYYY-MM-DD for date input
        const date = new Date(task.due_date || task.dueDate);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        setDueDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setDueDate('');
      }
    } else {
      setTitle('');
      setDescription('');
      setDivision('persiapan');
      setPriority('medium');
      setAssignedTo('');
      setDueDate('');
      setStatus('todo');
      setSelectedProjectId('');
      setProjectMembers([]);
    }
  }, [task]);

  // Load project members on project select (Global mode)
  useEffect(() => {
    if (isGlobal && selectedProjectId) {
      setLoadingMembers(true);
      fetchProjectMembers(selectedProjectId)
        .then(data => {
          setProjectMembers(data || []);
          setLoadingMembers(false);
        })
        .catch(err => {
          console.error('Failed to load project members in TaskFormModal:', err);
          setProjectMembers([]);
          setLoadingMembers(false);
        });
    } else {
      setProjectMembers([]);
    }
  }, [selectedProjectId, isGlobal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isGlobal && !selectedProjectId) {
      alert('Proyek wajib dipilih!');
      return;
    }
    if (!title.trim()) {
      alert('Judul task wajib diisi!');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      division,
      priority,
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      status
    };

    if (isGlobal) {
      payload.project_id = selectedProjectId;
    }

    onSubmit(payload);
  };

  // Determine which members list to use
  const members = isGlobal ? projectMembers : (project?.members || []);

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
      zIndex: 1000,
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
        maxWidth: 520,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
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
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
            {task ? 'Edit Tugas' : 'Tambah Tugas Baru'}
          </h3>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, overflowY: 'auto', maxHeight: '80vh' }}>
          
          {/* Project selector (Global view only) */}
          {isGlobal && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Proyek *</label>
              <select
                required
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setAssignedTo(''); // Reset assignee when project changes
                }}
                style={{
                  padding: '10px 14px',
                  fontSize: 13.5,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                <option value="">Pilih Proyek...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.project_code || 'PRJ'} • {p.project_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Judul Task */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Judul Task *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Pekerjaan Pengecoran Pondasi..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                padding: '10px 14px',
                fontSize: 13.5,
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
                background: '#fff',
                width: '100%'
              }}
            />
          </div>

          {/* Deskripsi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Deskripsi</label>
            <textarea
              placeholder="Tulis instruksi atau deskripsi detail di sini (opsional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                padding: '10px 14px',
                fontSize: 13.5,
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
                background: '#fff',
                width: '100%',
                height: 80,
                resize: 'none',
                lineHeight: 1.5
              }}
            />
          </div>

          {/* Row 1: Divisi & Prioritas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Divisi Pekerjaan *</label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                style={{
                  padding: '10px 14px',
                  fontSize: 13.5,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="persiapan">Persiapan</option>
                <option value="sipil">Sipil</option>
                <option value="mep">MEP</option>
                <option value="arsitektur">Arsitektur</option>
                <option value="finishing">Finishing</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Prioritas *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  padding: '10px 14px',
                  fontSize: 13.5,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Row 2: Ditugaskan Ke & Tanggal Due */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
                Ditugaskan Ke {loadingMembers && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(Memuat...)</span>}
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={isGlobal && !selectedProjectId}
                style={{
                  padding: '10px 14px',
                  fontSize: 13.5,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  background: isGlobal && !selectedProjectId ? '#f1f5f9' : '#fff',
                  cursor: isGlobal && !selectedProjectId ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">Belum Ditugaskan</option>
                {members.map(m => (
                  <option key={m.userId || m.user?.id} value={m.userId || m.user?.id}>
                    {m.user?.name} ({m.roleInProject?.toUpperCase() || 'TIM'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Tanggal Due</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  padding: '9px 14px',
                  fontSize: 13.5,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  background: '#fff',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Row 3: Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: '10px 14px',
                fontSize: 13.5,
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review / Inspeksi</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 8 }}
            >
              {task ? 'Simpan Perubahan' : 'Simpan Tugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
