import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTeamQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '../../hooks/useTeam';
import ProjectModal from '../../components/modules/projects/ProjectModal';
import { Plus, Trash2, Edit2, Mail, Briefcase, Building } from 'lucide-react';

export default function Team() {
  const { data: users = [], isLoading } = useTeamQuery();
  const createUser = useCreateUserMutation();
  const updateUser = useUpdateUserMutation();
  const deleteUser = useDeleteUserMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [form, setForm] = useState({ name: '', email: '', role: 'PROJECT_MANAGER', department: 'MANAGEMENT', password: '' });

  const handleOpenCreate = () => {
    setForm({ name: '', email: '', role: 'PROJECT_MANAGER', department: 'MANAGEMENT', password: '' });
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setForm({ name: user.name, email: user.email, role: user.role, department: user.department, password: '' });
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateUser.mutate(
        { id: editingUser.id, ...form }, 
        { 
          onSuccess: () => setModalOpen(false),
          onError: (err) => alert("Failed to update: " + err.message)
        }
      );
    } else {
      createUser.mutate(form, { 
        onSuccess: () => setModalOpen(false),
        onError: (err) => alert(err.message)
      });
    }
  };

  const ROLE_LABELS = {
    DIRECTOR: 'Director',
    SENIOR_PROJECT_MANAGER: 'Senior Project Manager',
    PROJECT_MANAGER: 'Project Manager',
    ADMIN: 'Admin'
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'DIRECTOR': return 'badge-red';
      case 'SENIOR_PROJECT_MANAGER': return 'badge-amber';
      case 'PROJECT_MANAGER': return 'badge-blue';
      case 'ADMIN': return 'badge-green';
      default: return 'badge-gray';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'US';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n ? n[0] : '')
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'US';
  };

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading team members...</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Team Directory</h1>
          <p className="page-subtitle">Manage employee access, roles, and internal organizational structure</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {users.map(user => (
          <div key={user.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link to={`/team/${user.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--blue)', color: 'white', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700,
                  cursor: 'pointer'
                }}>
                  {getInitials(user.name)}
                </div>
              </Link>
              <div style={{ flex: 1 }}>
                <Link to={`/team/${user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2, cursor: 'pointer' }}>{user.name}</h3>
                </Link>
                <span className={`badge ${getRoleBadgeClass(user.role)}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => handleOpenEdit(user)} className="btn btn-ghost btn-sm" style={{ padding: 6 }}>
                  <Edit2 size={14} color="var(--text-muted)" />
                </button>
                <button onClick={() => { if (window.confirm('Delete this user?')) deleteUser.mutate(user.id); }} className="btn btn-ghost btn-sm" style={{ padding: 6 }}>
                  <Trash2 size={14} color="var(--red)" />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} /> {user.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building size={14} /> {user.department}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={14} /> Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? "Edit Team Member" : "Add New Member"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Full Name *</label>
            <input required className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Email Address *</label>
            <input type="email" required className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Password {editingUser ? '(Leave blank to keep current)' : '*'}</label>
            <input type="password" required={!editingUser} className="form-input" placeholder={editingUser ? "Leave blank to keep current password" : "Enter a secure password"} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Role</label>
              <select className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="DIRECTOR">Director</option>
                <option value="SENIOR_PROJECT_MANAGER">Senior Project Manager</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Department</label>
              <select className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                <option value="MANAGEMENT">Management</option>
                <option value="ENGINEERING">Engineering</option>
                <option value="DESIGN">Design</option>
                <option value="PRODUCT">Product</option>
                <option value="HR">Human Resources</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={createUser.isPending || updateUser.isPending}>Save Member</button>
          </div>
        </form>
      </ProjectModal>
    </div>
  );
}
