import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Phone, Building } from 'lucide-react';
import { useClientsQuery, useCreateClientMutation, useUpdateClientMutation, useDeleteClientMutation } from '../../hooks/useClients';
import ProjectModal from '../../components/modules/projects/ProjectModal';

export default function Clients() {
  const { data: clients = [], isLoading, isError } = useClientsQuery();
  const createClient = useCreateClientMutation();
  const updateClient = useUpdateClientMutation();
  const deleteClient = useDeleteClientMutation();

  const [search, setSearch] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, type: 'create', data: null });

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const openModal = (type, data = null) => {
    setModalState({ isOpen: true, type, data });
    if (data) {
      setName(data.name);
      setCompany(data.company);
      setEmail(data.email);
      setPhone(data.phone || '');
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
    }
  };

  const closeModal = () => setModalState({ isOpen: false, type: 'create', data: null });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalState.type === 'create') {
      createClient.mutate({ name, company, email, phone }, { onSuccess: closeModal });
    } else {
      updateClient.mutate({ id: modalState.data.id, name, company, email, phone }, { onSuccess: closeModal });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this client? Associated projects will be kept but their client relation will be unset.')) {
      deleteClient.mutate(id);
    }
  };

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Client Directory</h1>
          <p className="page-subtitle">Manage client profiles and contacts</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => openModal('create')}>
          <Plus size={14} /> Add Client
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input">
          <Search size={13} color="var(--text-subtle)" />
          <input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading clients...</div>
      ) : isError ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--red)' }}>Error loading clients. Please ensure backend is running.</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600 }}>COMPANY / CONTACT</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600 }}>CONTACT DETAILS</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600 }}>PROJECTS</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                          <Building size={16} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{c.company}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.name}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-subtle)' }}>
                          <Mail size={12} /> {c.email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-subtle)' }}>
                          <Phone size={12} /> {c.phone || '-'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge badge-blue">{c.projectCount} Projects</span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => openModal('edit', c)} className="btn btn-ghost btn-sm" style={{ padding: 6 }}>
                        <Edit2 size={14} color="var(--text-subtle)" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="btn btn-ghost btn-sm" style={{ padding: 6, marginLeft: 4 }}>
                        <Trash2 size={14} color="var(--text-subtle)" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No clients found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reusing ProjectModal container for consistency */}
      <ProjectModal 
        isOpen={modalState.isOpen} 
        onClose={closeModal} 
        title={modalState.type === 'create' ? 'Add New Client' : 'Edit Client'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}>Company Name *</label>
            <input className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} value={company} onChange={e => setCompany(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}>Contact Person *</label>
            <input className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}>Email Address *</label>
            <input type="email" className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}>Phone Number</label>
            <input className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={createClient.isPending || updateClient.isPending}>Save Client</button>
          </div>
        </form>
      </ProjectModal>
    </div>
  );
}
