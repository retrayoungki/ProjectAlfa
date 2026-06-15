import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building, Plus, Search, Grid, List, Mail, Phone, User, 
  MapPin, CheckCircle, Clock, DollarSign, ChevronRight, Edit, Trash2
} from 'lucide-react';
import { 
  useClientsQuery, 
  useCreateClientMutation, 
  useUpdateClientMutation, 
  useDeleteClientMutation 
} from '../hooks/useClients';
import ClientFormModal from './Clients/ClientFormModal';
import DeleteClientModal from './Clients/DeleteClientModal';

// Tipe client avatar color mapping
const getTypeColors = (type) => {
  switch (type?.toLowerCase()) {
    case 'retail':
      return { bg: '#E6F1FB', text: '#185FA5', label: 'Retail / Store' };
    case 'mall':
      return { bg: '#FAEEDA', text: '#854F0B', label: 'Mall / GTC' };
    case 'office':
      return { bg: '#EAF3DE', text: '#3B6D11', label: 'Perkantoran' };
    case 'industrial':
      return { bg: '#EEEDFE', text: '#534AB7', label: 'Industri / Pabrik' };
    case 'government':
      return { bg: '#E1F5EE', text: '#0F6E56', label: 'Pemerintah' };
    case 'other':
    default:
      return { bg: '#F3F4F6', text: '#4B5563', label: 'Lainnya' };
  }
};

// Compact formatting for large Rupiah values (Milyar / Juta)
const formatCompactRupiah = (val) => {
  if (val === null || val === undefined) return 'Rp 0';
  if (val >= 1000000000) {
    return `Rp ${(val / 1000000000).toFixed(1).replace('.', ',')} M`;
  }
  if (val >= 1000000) {
    return `Rp ${(val / 1000000).toFixed(1).replace('.', ',')} Jt`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(val);
};

// Standard Rupiah format
const formatRupiah = (val) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function ClientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [clientType, setClientType] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid | list

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Queries & Mutations
  const { data, isLoading, error } = useClientsQuery({
    search,
    client_type: clientType === 'all' ? undefined : clientType,
    is_active: 'true' // only show active by default
  });

  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation();
  const deleteMutation = useDeleteClientMutation();

  const clients = data?.clients || [];
  const summary = data?.summary || {
    total_clients: 0,
    active_clients: 0,
    total_contract_value: 0,
    total_completed_projects: 0
  };

  // Avatar Initials
  const getInitials = (name) => {
    return (name || '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CL';
  };

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setSelectedClient(client);
    setFormModalOpen(true);
  };

  const handleOpenDelete = (client) => {
    setSelectedClient(client);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedClient) {
        await updateMutation.mutateAsync({ id: selectedClient.id, ...formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setFormModalOpen(false);
    } catch (err) {
      alert(err.message || 'Gagal menyimpan data client');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;
    try {
      await deleteMutation.mutateAsync(selectedClient.id);
      setDeleteModalOpen(false);
    } catch (err) {
      alert(err.message || 'Gagal menonaktifkan client');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── 1. HEADER PERUSAHAAN ── */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Clients</h1>
          <p className="page-subtitle" style={{ fontSize: 13.5, color: 'var(--text-subtle)', marginTop: 4, margin: 0 }}>
            {summary.total_clients} client terdaftar &middot; {formatCompactRupiah(summary.total_contract_value)} total nilai kontrak
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleOpenCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} /> Tambah Client
        </button>
      </div>

      {/* ── 2. KPI BAR (4 Stat Box) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {[
          { label: 'TOTAL CLIENT', value: summary.total_clients, icon: <Building size={20} color="var(--blue)" />, bg: 'var(--surface)' },
          { label: 'CLIENT AKTIF', value: `${summary.active_clients} Perusahaan`, sub: 'Punya proyek berjalan', icon: <Clock size={20} color="#10B981" />, bg: 'var(--surface)' },
          { label: 'TOTAL NILAI KONTRAK', value: formatCompactRupiah(summary.total_contract_value), icon: <DollarSign size={20} color="var(--blue)" />, bg: 'var(--surface)' },
          { label: 'PROYEK SELESAI', value: `${summary.total_completed_projects} Proyek`, icon: <CheckCircle size={20} color="#10B981" />, bg: 'var(--surface)' }
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className="card" 
            style={{ 
              padding: '18px 24px', 
              background: kpi.bg, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px' }}>{kpi.label}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginTop: 6, display: 'block' }}>{kpi.value}</span>
              {kpi.sub && <span style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'block', marginTop: 2 }}>{kpi.sub}</span>}
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg)' }}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. TOOLBAR FILTERS ── */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', gap: 12, flexGrow: 1, flexWrap: 'wrap' }}>
          {/* Search bar */}
          <div className="search-input" style={{ width: '280px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, color: 'var(--text-subtle)' }} />
            <input 
              placeholder="Cari client, PIC, atau perusahaan..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="form-input" 
              style={{ paddingLeft: 34, width: '100%' }}
            />
          </div>

          {/* Filter dropdown */}
          <select
            className="form-input"
            style={{ height: 38, padding: '0 12px', fontSize: 13 }}
            value={clientType}
            onChange={e => setClientType(e.target.value)}
          >
            <option value="all">Semua Tipe</option>
            <option value="retail">Retail / Store</option>
            <option value="mall">Mall / GTC</option>
            <option value="office">Perkantoran</option>
            <option value="industrial">Industri / Pabrik</option>
            <option value="government">Pemerintah</option>
            <option value="other">Lainnya</option>
          </select>
        </div>

        {/* Toggle View */}
        <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 8, padding: 2, border: '1px solid var(--border)' }}>
          <button 
            type="button" 
            onClick={() => setViewMode('grid')}
            style={{ 
              padding: '6px 12px', 
              border: 'none', 
              background: viewMode === 'grid' ? 'var(--surface)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--navy)' : 'var(--text-subtle)',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Grid size={14} /> Grid
          </button>
          <button 
            type="button" 
            onClick={() => setViewMode('list')}
            style={{ 
              padding: '6px 12px', 
              border: 'none', 
              background: viewMode === 'list' ? 'var(--surface)' : 'transparent',
              color: viewMode === 'list' ? 'var(--navy)' : 'var(--text-subtle)',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <List size={14} /> List
          </button>
        </div>
      </div>

      {/* ── 4. CLIENTS DISPLAY ── */}
      {isLoading ? (
        <div className="card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-subtle)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px', width: 24, height: 24, border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Memuat data client...
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '40px 0', textAlign: 'center', color: 'var(--red)', fontWeight: 600 }}>
          Gagal memuat data client. Pastikan backend server aktif.
        </div>
      ) : clients.length === 0 ? (
        <div className="card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-subtle)' }}>
          Belum ada client yang cocok dengan filter pencarian.
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (3 Columns) */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {clients.map(c => {
            const colors = getTypeColors(c.client_type);
            return (
              <div 
                key={c.id} 
                className="card card-pad" 
                style={{ 
                  boxShadow: 'var(--shadow)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderRadius: 14,
                  gap: 16,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Logo & Company Name */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 10, 
                      background: colors.bg, 
                      color: colors.text, 
                      fontWeight: 800, 
                      fontSize: 16, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getInitials(c.company_name)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <h3 
                      style={{ 
                        fontSize: 15.5, 
                        fontWeight: 800, 
                        color: 'var(--navy)', 
                        margin: 0, 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}
                      title={c.company_name}
                    >
                      {c.company_name}
                    </h3>
                    <span 
                      style={{ 
                        fontSize: 10.5, 
                        fontWeight: 700, 
                        color: colors.text, 
                        background: `${colors.bg}CC`, 
                        padding: '1px 6px', 
                        borderRadius: 4, 
                        marginTop: 4, 
                        display: 'inline-block' 
                      }}
                    >
                      {colors.label}
                    </span>
                  </div>
                </div>

                {/* Grid stats 2x2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 14px', borderRadius: 8, background: 'var(--bg-subtle)' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: 9.5, color: 'var(--text-subtle)', fontWeight: 600 }}>TOTAL PROYEK</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2, display: 'block' }}>{c.total_projects} Proyek</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 9.5, color: 'var(--text-subtle)', fontWeight: 600 }}>PROYEK AKTIF</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#137333', marginTop: 2, display: 'block' }}>{c.active_projects} Aktif</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 9.5, color: 'var(--text-subtle)', fontWeight: 600 }}>NILAI KONTRAK</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2, display: 'block' }}>{formatCompactRupiah(c.total_contract_value)}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 9.5, color: 'var(--text-subtle)', fontWeight: 600 }}>SUDAH DIBAYAR</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#137333', marginTop: 2, display: 'block' }}>{formatCompactRupiah(c.total_paid)}</span>
                  </div>
                </div>

                {/* PIC Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--text-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      <strong>{c.pic_name}</strong> {c.pic_position ? `(${c.pic_position})` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span>{c.pic_phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.pic_email || '-'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4, gap: 8 }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => navigate(`/clients/${c.id}`)}
                    style={{ flex: 1.5, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    Detail <ChevronRight size={13} />
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => handleOpenEdit(c)}
                    style={{ padding: 8 }}
                    title="Edit Profil"
                  >
                    <Edit size={13} />
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => handleOpenDelete(c)}
                    style={{ padding: 8, color: '#DC2626', borderColor: '#FEE2E2' }}
                    title="Nonaktifkan Client"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW (Table Layout) */
        <div className="card" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>NO</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>PERUSAHAAN</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>TIPE</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>PIC UTAMA</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>KOTA</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>PROYEK (AKTIF)</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>NILAI KONTRAK</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>OUTSTANDING</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c, index) => {
                  const colors = getTypeColors(c.client_type);
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row">
                      <td style={{ padding: '14px 16px', color: 'var(--text-subtle)', fontWeight: 600 }}>{index + 1}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link to={`/clients/${c.id}`} style={{ fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }} className="hover-underline">
                          {c.company_name}
                        </Link>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.text, background: colors.bg, padding: '2px 8px', borderRadius: 4 }}>
                          {colors.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{c.pic_name}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="var(--text-muted)" /> {c.city || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700 }}>
                        {c.total_projects} <span style={{ color: '#137333', fontSize: 11.5 }}>({c.active_projects})</span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--blue)' }}>{formatRupiah(c.total_contract_value)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>
                        {c.outstanding === 0 ? (
                          <span style={{ color: '#137333', background: '#E6F4EA', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Lunas</span>
                        ) : (
                          <span style={{ color: '#854F0B', background: '#FEF3D6', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{formatRupiah(c.outstanding)}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-sm" style={{ padding: 6 }} onClick={() => navigate(`/clients/${c.id}`)}>
                            Detail
                          </button>
                          <button className="btn btn-secondary btn-sm" style={{ padding: 6 }} onClick={() => handleOpenEdit(c)}>
                            <Edit size={12} />
                          </button>
                          <button className="btn btn-secondary btn-sm" style={{ padding: 6, color: '#DC2626', borderColor: '#FEE2E2' }} onClick={() => handleOpenDelete(c)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. MODAL CONTAINERS ── */}
      <ClientFormModal 
        isOpen={formModalOpen}
        client={selectedClient}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteClientModal 
        isOpen={deleteModalOpen}
        client={selectedClient}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
