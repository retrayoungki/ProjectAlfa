import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Building, Edit, Plus, FileText, Phone, Mail, 
  MapPin, User, ArrowLeft, Download, Upload, CreditCard, ShieldCheck, CheckCircle
} from 'lucide-react';
import { useClientDetailQuery, useUpdateClientMutation } from '../hooks/useClients';
import ClientFormModal from './Clients/ClientFormModal';

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

// Formatting helper
const formatRupiah = (val) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(val || 0);
};

const formatDateIndo = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [formModalOpen, setFormModalOpen] = useState(false);

  // Filters for Project Tab
  const [projFilter, setProjFilter] = useState('all'); // all | active | completed

  // Queries
  const { data: client, isLoading, error, refetch } = useClientDetailQuery(id);
  const updateMutation = useUpdateClientMutation();

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32, border: '4px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p>Memuat detail client...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="card card-pad" style={{ padding: '60px 20px', textAlign: 'center', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>Client tidak ditemukan</h3>
        <p className="text-xs text-muted" style={{ marginTop: 8, marginBottom: 20 }}>
          Data client yang Anda cari tidak ditemukan atau telah dinonaktifkan.
        </p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/clients')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={14} /> Kembali ke daftar
        </button>
      </div>
    );
  }

  const colors = getTypeColors(client.client_type);
  const projects = client.projects || [];
  const finance = client.finance_summary || {
    total_contract_value: 0,
    total_paid: 0,
    outstanding: 0,
    termin_pending: 0
  };

  // Stepper submit update
  const handleFormSubmit = async (formData) => {
    try {
      await updateMutation.mutateAsync({ id: client.id, ...formData });
      setFormModalOpen(false);
      refetch();
    } catch (err) {
      alert(err.message || 'Gagal mengubah profil client');
    }
  };

  // Project Tab Filtering
  const filteredProjects = projects.filter(p => {
    const isActive = ['preparation', 'execution', 'testing'].includes(p.status.toLowerCase());
    const isCompleted = p.status.toLowerCase() === 'completed';
    if (projFilter === 'active') return isActive;
    if (projFilter === 'completed') return isCompleted;
    return true; // 'all'
  });

  // Calculate Retensi & project finance calculations dynamically
  // Since retensi is stored in project itself, let's sum retensi total - retensi cair
  let totalRetensiOutstanding = 0;
  let allPaymentsHistory = [];
  let projectRekap = [];

  // Wait, let's simulate the retensi amount and termin payments dynamically
  // If the backend doesn't aggregate them in detail API, we can fetch project list or calculate
  // Let's see: on GET /api/clients/:id, we returned the detailed client.
  // Wait, does the client details endpoint fetch termins?
  // Let's check: Yes! `clientController.js` includes project termins:
  // `projects: { include: { termins: true } }`
  // So `client.projects` actually contains the termins arrays!
  // Let's compute them dynamically inside the frontend!
  
  projects.forEach(p => {
    // Retensi
    const rTotal = p.retensiTotal || 0;
    const rCair = p.retensiCair || 0;
    totalRetensiOutstanding += (rTotal - rCair);

    // Payments history
    const termins = p.termins || [];
    termins.forEach(t => {
      allPaymentsHistory.push({
        project_name: p.projectName,
        project_id: p.id,
        termin_label: t.terminLabel || `Termin ${t.terminNumber}`,
        netto_cair: t.nettoCair || 0,
        status: t.status,
        paid_date: t.paidDate
      });
    });

    // Project Rekap
    const pPaid = termins.filter(t => t.status === 'paid').reduce((sum, t) => sum + (t.nettoCair || 0), 0);
    const pContract = p.contractValue || 0;
    const pOutstanding = pContract - pPaid;
    const pPct = pContract > 0 ? (pPaid / pContract) * 100 : 0;

    projectRekap.push({
      project_id: p.id,
      project_name: p.projectName,
      contract_value: pContract,
      paid: pPaid,
      outstanding: pOutstanding,
      pct: pPct
    });
  });

  // Sort payment history: paid first, then submitted/approved, by paidDate DESC
  allPaymentsHistory.sort((a, b) => {
    if (a.paid_date && b.paid_date) {
      return new Date(b.paid_date) - new Date(a.paid_date);
    }
    if (a.paid_date) return -1;
    if (b.paid_date) return 1;
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── 1. BREADCRUMB ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-subtle)' }}>
        <Link to="/clients" style={{ textDecoration: 'none', color: 'var(--text-subtle)', fontWeight: 600 }}>Clients</Link>
        <ChevronRight size={14} />
        <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{client.company_name}</span>
      </nav>

      {/* ── 2. HEADER CLIENT ── */}
      <div 
        className="card" 
        style={{ 
          borderLeft: `4px solid ${colors.text}`, 
          borderRadius: 14, 
          boxShadow: 'var(--shadow)',
          background: 'var(--surface)',
          padding: '24px 28px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          {/* Avatar and name */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 10,
                background: colors.bg,
                color: colors.text,
                fontWeight: 800,
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {colors.label.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                  {client.company_name}
                </h1>
                <span
                  className="badge"
                  style={{
                    background: colors.bg,
                    color: colors.text,
                    padding: '3px 10px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    borderRadius: 4
                  }}
                >
                  {colors.label}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-subtle)' }}>
                <strong>{client.short_name || '-'}</strong> &middot; {client.city || '-'}, {client.province || '-'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setFormModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Edit size={14} /> Edit
            </button>
            <Link 
              to={`/projects?create=true&client_id=${client.id}`}
              className="btn btn-primary btn-sm" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <Plus size={14} /> Proyek Baru
            </Link>
          </div>
        </div>

        <div className="divider" style={{ margin: '20px 0', borderTop: '1px solid var(--border)' }} />

        {/* Quick info: X proyek & Y contract value */}
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5, fontWeight: 600 }}>TOTAL PROYEK</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--blue)', marginTop: 4, display: 'block' }}>
              {projects.length} Proyek
            </span>
          </div>
          <div>
            <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5, fontWeight: 600 }}>NILAI KONTRAK TERKUMPUL</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginTop: 4, display: 'block' }}>
              {formatRupiah(finance.total_contract_value)}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5, fontWeight: 600 }}>OUTSTANDING TAGIHAN</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: finance.outstanding > 0 ? '#854F0B' : '#137333', marginTop: 4, display: 'block' }}>
              {finance.outstanding > 0 ? formatRupiah(finance.outstanding) : 'Lunas'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. BODY LAYOUT (Tabs and Tab Contents) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Tabs Navigation */}
        <div className="tabs" style={{ display: 'flex', gap: 2, borderBottom: '2px solid var(--border)', background: 'var(--bg)', paddingBottom: 0 }}>
          {['Overview', 'Proyek', 'Keuangan', 'Kontak & Dokumen'].map(t => (
            <button
              key={t}
              className={`tab-btn ${activeTab === t ? 'active' : ''}`}
              style={{
                border: 'none',
                padding: '12px 18px',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                background: 'transparent',
                color: activeTab === t ? 'var(--navy)' : 'var(--text-muted)',
                borderBottom: activeTab === t ? '3px solid var(--blue)' : '3px solid transparent',
                marginBottom: -2
              }}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="tab-content">
          
          {/* ── TAB 1: OVERVIEW ── */}
          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, alignItems: 'start' }}>
              {/* Left Column (Info & Stats) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Section 1: Informasi Perusahaan */}
                <div className="card card-pad">
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>
                    Informasi Perusahaan
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)' }}>Nama Resmi Perusahaan</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block' }}>{client.company_name}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)' }}>Tipe Client</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block', textTransform: 'capitalize' }}>{colors.label}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)' }}>PIC Utama / Jabatan</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block' }}>{client.pic_name} {client.pic_position ? `(${client.pic_position})` : ''}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)' }}>Email PIC Utama</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block' }}>{client.pic_email || '-'}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)' }}>No. Telepon PIC Utama</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block' }}>{client.pic_phone || '-'}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)' }}>NPWP Perusahaan</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block', fontFamily: 'monospace' }}>{client.npwp || '-'}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)' }}>Alamat Perusahaan</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block', lineHeight: 1.5 }}>{client.address || '-'}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)' }}>Kota</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block' }}>{client.city || '-'}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)' }}>Provinsi</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block' }}>{client.province || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Ringkasan Status Proyek (4 stat box) */}
                <div className="card card-pad">
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>
                    Status Proyek
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { label: 'TOTAL', count: projects.length, color: 'var(--navy)' },
                      { label: 'BERJALAN', count: projects.filter(p => ['preparation', 'execution', 'testing'].includes(p.status.toLowerCase())).length, color: '#2563EB' },
                      { label: 'SELESAI', count: projects.filter(p => p.status.toLowerCase() === 'completed').length, color: '#059669' },
                      { label: 'DITUNDA', count: projects.filter(p => p.status.toLowerCase() === 'on_hold').length, color: '#DC2626' }
                    ].map((st, idx) => (
                      <div key={idx} style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid var(--border)' }}>
                        <span style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: 'var(--text-subtle)' }}>{st.label}</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: st.color, marginTop: 4, display: 'block' }}>{st.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (Project History List) */}
              <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                  Riwayat Proyek
                </h3>
                {projects.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', padding: '20px 0' }}>Belum ada riwayat proyek.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {projects.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>{p.project_code}</span>
                          <Link to={`/projects/${p.id}`} style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }} className="hover-underline">
                            {p.project_name}
                          </Link>
                          <span style={{ display: 'block', marginTop: 4 }}>
                            <span 
                              className="badge" 
                              style={{ 
                                padding: '1px 6px', 
                                fontSize: 9.5, 
                                background: p.status === 'completed' ? '#D1FAE5' : '#DBEAFE',
                                color: p.status === 'completed' ? '#065F46' : '#2563EB',
                                borderRadius: 4,
                                textTransform: 'capitalize'
                              }}
                            >
                              {p.status}
                            </span>
                          </span>
                        </div>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--blue)' }}>
                          {formatRupiah(p.contract_value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: PROYEK ── */}
          {activeTab === 'Proyek' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0', boxShadow: 'none' }}>
              <div style={{ display: 'flex', gap: 8, padding: '0 20px', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                {[
                  { value: 'all', label: 'Semua Status' },
                  { value: 'active', label: 'Aktif' },
                  { value: 'completed', label: 'Selesai' }
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setProjFilter(f.value)}
                    style={{
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: projFilter === f.value ? 'var(--blue)' : 'var(--bg)',
                      color: projFilter === f.value ? 'white' : 'var(--text-muted)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredProjects.length === 0 ? (
                <p style={{ fontSize: 13.5, color: 'var(--text-subtle)', padding: 30, textAlign: 'center' }}>
                  Tidak ada proyek dengan status filter ini.
                </p>
              ) : (
                <div className="table-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 700 }}>KODE</th>
                        <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 700 }}>NAMA PROYEK</th>
                        <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 700 }}>STATUS</th>
                        <th style={{ textAlign: 'right', padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 700 }}>BUDGET</th>
                        <th style={{ textAlign: 'right', padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 700 }}>REALISASI</th>
                        <th style={{ textAlign: 'center', padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 700 }}>% BUDGET</th>
                        <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 700 }}>DEADLINE</th>
                        <th style={{ textAlign: 'right', padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 700 }}>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map(p => {
                        const bgValue = p.budget || 0;
                        const usdValue = p.budgetUsed || 0;
                        const pct = bgValue > 0 ? (usdValue / bgValue) * 100 : 0;
                        let pctColor = 'var(--text)';
                        if (pct > 95) pctColor = '#DC2626';
                        else if (pct >= 80) pctColor = '#D97706';

                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-subtle)' }}>{p.project_code}</td>
                            <td style={{ padding: '14px 20px' }}>
                              <Link to={`/projects/${p.id}`} style={{ fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }} className="hover-underline">
                                {p.project_name}
                              </Link>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span 
                                className="badge"
                                style={{
                                  padding: '2px 8px',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  borderRadius: 4,
                                  background: p.status === 'completed' ? '#D1FAE5' : '#DBEAFE',
                                  color: p.status === 'completed' ? '#065F46' : '#2563EB',
                                  textTransform: 'capitalize'
                                }}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600 }}>{formatRupiah(bgValue)}</td>
                            <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600 }}>{formatRupiah(usdValue)}</td>
                            <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, color: pctColor }}>{pct.toFixed(1)}%</td>
                            <td style={{ padding: '14px 20px', color: 'var(--text-subtle)' }}>{formatDateIndo(p.contract_end_date)}</td>
                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/projects/${p.id}`)}>
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: KEUANGAN ── */}
          {activeTab === 'Keuangan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -4 }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => navigate(`/finance?client_id=${id}`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
                >
                  Lihat di Finance
                </button>
              </div>
              {/* Section 1: Ringkasan Keuangan (4 Stat Boxes) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  { label: 'TOTAL KONTRAK', value: formatRupiah(finance.total_contract_value), bg: 'var(--surface)', borderLeft: '4px solid var(--blue)' },
                  { label: 'SUDAH DIBAYAR (PAID)', value: formatRupiah(finance.total_paid), bg: 'var(--surface)', borderLeft: '4px solid #10B981' },
                  { label: 'OUTSTANDING (SISA)', value: formatRupiah(finance.outstanding), bg: 'var(--surface)', borderLeft: '4px solid #F59E0B' },
                  { label: 'RETENSI DITAHAN', value: formatRupiah(totalRetensiOutstanding), bg: 'var(--surface)', borderLeft: '4px solid #6B7280' }
                ].map((stat, idx) => (
                  <div key={idx} className="card card-pad" style={{ background: stat.bg, borderLeft: stat.borderLeft, boxShadow: 'var(--shadow-sm)' }}>
                    <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10, fontWeight: 700 }}>{stat.label}</span>
                    <span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--navy)', marginTop: 6, display: 'block' }}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Section 2: Tabel Riwayat Pembayaran */}
              <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                  Riwayat Pembayaran Termin (Gabungan)
                </h3>
                {allPaymentsHistory.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', padding: '20px 0' }}>Belum ada transaksi pembayaran.</p>
                ) : (
                  <div className="table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                          <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted)' }}>PROYEK</th>
                          <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted)' }}>TERMIN</th>
                          <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--text-muted)' }}>NILAI BERSIH (NETTO)</th>
                          <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--text-muted)' }}>STATUS</th>
                          <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted)' }}>TGL BAYAR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPaymentsHistory.map((pmt, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <Link to={`/projects/${pmt.project_id}`} style={{ fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }} className="hover-underline">
                                {pmt.project_name}
                              </Link>
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>{pmt.termin_label}</td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--blue)' }}>{formatRupiah(pmt.netto_cair)}</td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span 
                                className="badge"
                                style={{
                                  padding: '1px 6px',
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  borderRadius: 4,
                                  background: pmt.status === 'paid' ? '#D1FAE5' : (pmt.status === 'draft' ? '#F3F4F6' : '#FEF3C7'),
                                  color: pmt.status === 'paid' ? '#065F46' : (pmt.status === 'draft' ? '#4B5563' : '#D97706')
                                }}
                              >
                                {pmt.status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-subtle)' }}>
                              {pmt.paid_date ? formatDateIndo(pmt.paid_date) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 3: Rekap Per Proyek */}
              <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                  Rekap Keuangan per Proyek
                </h3>
                <div className="table-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                        <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted)' }}>NAMA PROYEK</th>
                        <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--text-muted)' }}>NILAI KONTRAK</th>
                        <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--text-muted)' }}>DIBAYAR</th>
                        <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--text-muted)' }}>OUTSTANDING</th>
                        <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--text-muted)' }}>% LUNAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectRekap.map((pr, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <Link to={`/projects/${pr.project_id}`} style={{ fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }} className="hover-underline">
                              {pr.project_name}
                            </Link>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>{formatRupiah(pr.contract_value)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#137333' }}>{formatRupiah(pr.paid)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: pr.outstanding > 0 ? '#854F0B' : '#137333' }}>
                            {pr.outstanding > 0 ? formatRupiah(pr.outstanding) : 'Lunas'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: pr.pct >= 100 ? '#137333' : 'var(--blue)' }}>
                            {pr.pct.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: KONTAK & DOKUMEN ── */}
          {activeTab === 'Kontak & Dokumen' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>
              {/* Left Column (Contacts Info) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Kontak PIC Utama & Kedua */}
                <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="flex-between">
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Data Kontak Lengkap</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => setFormModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Edit size={12} /> Edit Kontak
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* PIC 1 */}
                    <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', display: 'block', marginBottom: 6 }}>PIC UTAMA</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                        <span style={{ fontWeight: 700 }}>{client.pic_name} {client.pic_position ? `(${client.pic_position})` : ''}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-subtle)' }}><Phone size={12} /> {client.pic_phone}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-subtle)' }}><Mail size={12} /> {client.pic_email || '-'}</span>
                      </div>
                    </div>

                    {/* PIC 2 */}
                    {client.pic_2_name && (
                      <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>PIC KEDUA (OPSIONAL)</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                          <span style={{ fontWeight: 700 }}>{client.pic_2_name}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-subtle)' }}><Phone size={12} /> {client.pic_2_phone || '-'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-subtle)' }}><Mail size={12} /> {client.pic_2_email || '-'}</span>
                        </div>
                      </div>
                    )}

                    {/* Kantor */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TELEPON KANTOR</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{client.phone || '-'}</span>
                      </div>
                      <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>EMAIL PERUSAHAAN</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{client.email || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rekening Bank */}
                <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={18} color="var(--blue)" /> Informasi Rekening Bank
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
                    <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>BANK</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{client.bank_name || '-'}</span>
                    </div>
                    <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>NOMOR REKENING</span>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{client.bank_account || '-'}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2', background: 'var(--bg)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>NAMA PEMILIK REKENING (A.N.)</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{client.bank_account_name || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Documents List) */}
              <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="flex-between">
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Dokumen Client</h3>
                  <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => alert('Fungsi upload dokumen placeholder')}>
                    <Upload size={12} /> Upload
                  </button>
                </div>
                
                {/* Mock documents directory */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { name: 'MOU & Perjanjian Kerjasama Utama.pdf', size: '2.4 MB', date: '12 Jan 2026', tag: 'MOU' },
                    { name: 'Non-Disclosure Agreement (NDA).pdf', size: '1.1 MB', date: '15 Jan 2026', tag: 'NDA' },
                    { name: 'Copy Kartu NPWP Perusahaan.pdf', size: '480 KB', date: '15 Jan 2026', tag: 'NPWP' },
                    { name: 'Profil Perusahaan (Company Profile).pdf', size: '5.8 MB', date: '20 Jan 2026', tag: 'Profil' }
                  ].map((doc, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: 12, 
                        borderRadius: 8, 
                        background: 'var(--bg)', 
                        border: '1px solid var(--border)' 
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', overflow: 'hidden' }}>
                        <FileText size={20} color="var(--blue)" style={{ flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden' }}>
                          <span 
                            style={{ 
                              fontSize: 12.5, 
                              fontWeight: 700, 
                              color: 'var(--navy)', 
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {doc.name}
                          </span>
                          <span style={{ fontSize: 10.5, color: 'var(--text-subtle)' }}>{doc.size} &bull; {doc.date}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => alert(`Mengunduh dokumen: ${doc.name}`)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--blue)', padding: 4 }}
                        title="Download Dokumen"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Client Form Modal Container */}
      <ClientFormModal 
        isOpen={formModalOpen}
        client={client}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
