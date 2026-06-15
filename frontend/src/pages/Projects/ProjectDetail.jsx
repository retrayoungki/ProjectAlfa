import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building, Calendar, Clock, ArrowLeft, Edit, Trash2, Users, Layers, 
  FileText, DollarSign, Activity, AlertTriangle, ChevronRight, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchProjectDetail, updateProjectMilestone, deleteProjectMember, addProjectMember, fetchProjectFinance } from '../../services/projectService';
import MilestoneList from './MilestoneList';
import TeamMemberList from './TeamMemberList';
import ActivityLog from './ActivityLog';
import FinanceTab from './FinanceTab';
import ProgressTab from './ProgressTab';
import TasksDocumentsTab from './TasksDocumentsTab';
import { CheckSquare } from 'lucide-react';

const BORDER_COLORS = {
  preparation: '#F59E0B',
  execution: '#3B82F6',
  testing: '#8B5CF6',
  handover: '#10B981',
  maintenance: '#6B7280',
  completed: '#065F46',
  on_hold: '#EF4444'
};

const STATUS_BADGES = {
  preparation: { bg: '#FEF3C7', color: '#D97706', label: 'Preparation' },
  execution: { bg: '#DBEAFE', color: '#2563EB', label: 'Execution' },
  testing: { bg: '#F3E8FF', color: '#7C3AED', label: 'Testing' },
  handover: { bg: '#D1FAE5', color: '#059669', label: 'Handover' },
  maintenance: { bg: '#F3F4F6', color: '#4B5563', label: 'Maintenance' },
  completed: { bg: '#D1FAE5', color: '#065F46', label: 'Completed' },
  on_hold: { bg: '#FEE2E2', color: '#DC2626', label: 'On Hold' }
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [project, setProject] = useState(null);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');

  // Load detailed project data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await fetchProjectDetail(id);
      setProject(data);
      
      try {
        const finData = await fetchProjectFinance(id);
        setFinanceSummary(finData);
      } catch (finErr) {
        console.error('Failed to load finance summary:', finErr);
      }
    } catch (error) {
      console.error('Error loading project detail:', error);
      setErrorMsg(error.message || 'Gagal memuat detail proyek');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32, border: '4px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p>Memuat detail proyek...</p>
      </div>
    );
  }

  if (errorMsg || !project) {
    return (
      <div className="card card-pad" style={{ padding: '60px 20px', textAlign: 'center', border: '1px solid var(--border)' }}>
        <AlertTriangle size={40} color="var(--red)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>Proyek tidak ditemukan</h3>
        <p className="text-xs text-muted" style={{ marginTop: 8, marginBottom: 20 }}>
          {errorMsg === 'Project not found' ? 'Proyek yang Anda cari tidak ditemukan atau telah dihapus.' : errorMsg}
        </p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={14} /> Kembali ke daftar proyek
        </button>
      </div>
    );
  }

  // Permissions Check: user is Super Admin or the PM of this project
  const canEdit = currentUser?.role === 'ADMIN' || project.assignedPm === currentUser?.id;

  const status = (project.status || 'preparation').toLowerCase();
  const accentColor = BORDER_COLORS[status] || '#6B7280';
  const badgeInfo = STATUS_BADGES[status] || { bg: '#F3F4F6', color: '#4B5563', label: project.status };

  // Initials for avatar
  const initials = (project.projectName || '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'PR';

  // Formatting helpers
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

  const getQueryDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Sisa Hari Stats styling
  const sisaHari = project.stats?.sisa_hari;
  const isOverdue = sisaHari !== null && sisaHari !== undefined && sisaHari < 0;
  let sisaHariColor = 'var(--text)';
  if (sisaHari !== null && sisaHari !== undefined) {
    if (sisaHari < 0) sisaHariColor = '#7F1D1D'; // merah gelap
    else if (sisaHari <= 7) sisaHariColor = '#DC2626'; // merah
    else if (sisaHari <= 30) sisaHariColor = '#D97706'; // amber
  }

  // Progress Plan & Actual
  const progressPlan = project.progressPlan || 0.0;
  const progressActual = project.progressActual || 0.0;
  const deviasi = project.stats?.deviasi_progress || 0.0;

  // Financial calculations
  const contractVal = financeSummary?.summary?.nilai_kontrak !== undefined 
    ? financeSummary.summary.nilai_kontrak 
    : (project.contractValue || 0);
  const budgetVal = financeSummary?.summary?.budget_rab !== undefined 
    ? financeSummary.summary.budget_rab 
    : (project.budget || 0);
  const budgetUsedVal = financeSummary?.summary?.budget_used !== undefined 
    ? financeSummary.summary.budget_used 
    : (project.budgetUsed || 0);
  const sisaAnggaran = budgetVal - budgetUsedVal;
  const budgetUsagePct = budgetVal > 0 ? (budgetUsedVal / budgetVal) * 100 : 0;
  
  let budgetBarColor = '#10B981'; // green
  if (budgetUsagePct > 95) budgetBarColor = '#EF4444'; // red
  else if (budgetUsagePct >= 80) budgetBarColor = '#F59E0B'; // amber

  // Timeline duration between SPK and Deadline
  const getDurationDays = () => {
    if (!project.contractStartDate || !project.contractEndDate) return '-';
    const start = new Date(project.contractStartDate);
    const end = new Date(project.contractEndDate);
    const diff = end.getTime() - start.getTime();
    return `${Math.ceil(diff / (1000 * 60 * 60 * 24))} Hari`;
  };

  // Milestone change callback
  const handleMilestoneStatusChange = async (milestoneId, newStatus) => {
    try {
      await updateProjectMilestone(project.id, milestoneId, newStatus);
      loadData(); // reload project details
    } catch (err) {
      alert(err.message || 'Gagal merubah status milestone');
    }
  };

  // Team members callbacks
  const handleAddMember = async (userId, roleInProject) => {
    try {
      await addProjectMember(project.id, { user_id: userId, role_in_project: roleInProject });
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan anggota tim');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await deleteProjectMember(project.id, userId);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus anggota tim');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── 1. BREADCRUMB ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-subtle)' }}>
        <Link to="/projects" style={{ textDecoration: 'none', color: 'var(--text-subtle)', fontWeight: 600 }}>Projects</Link>
        <ChevronRight size={14} />
        <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{project.projectName}</span>
      </nav>

      {/* ── 2. HEADER PROYEK ── */}
      <div 
        className="card" 
        style={{ 
          borderLeft: `4px solid ${accentColor}`, 
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
                width: 46,
                height: 46,
                borderRadius: 10,
                background: `${accentColor}18`,
                color: accentColor,
                fontWeight: 800,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                  {project.projectName}
                </h1>
                <span
                  className="badge"
                  style={{
                    background: badgeInfo.bg,
                    color: badgeInfo.color,
                    padding: '3px 10px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    borderRadius: 4
                  }}
                >
                  {badgeInfo.label}
                </span>
              </div>
              <p className="text-xs text-muted" style={{ margin: '4px 0 0 0', fontSize: 12.5, color: 'var(--text-subtle)' }}>
                <strong>{project.projectCode}</strong> &middot; {project.location || 'Lokasi belum ditentukan'}
              </p>
            </div>
          </div>

          {/* Edit/Delete Actions (Only PM or Admin) */}
          {canEdit && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => alert('Edit modal placeholder')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit size={14} /> Edit
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ color: '#DC2626', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => {
                  if (confirm('Hapus proyek ini secara permanen?')) {
                    alert('Hapus proyek placeholder');
                  }
                }}
              >
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          )}
        </div>

        <div className="divider" style={{ margin: '20px 0', borderTop: '1px solid var(--border)' }} />

        {/* 4 Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div>
            <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5, fontWeight: 600 }}>NILAI KONTRAK</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue)', marginTop: 4, display: 'block' }}>
              {formatRupiah(contractVal)}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5, fontWeight: 600 }}>BUDGET RAB</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginTop: 4, display: 'block' }}>
              {formatRupiah(budgetVal)}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5, fontWeight: 600 }}>SISA HARI</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: sisaHariColor, marginTop: 4, display: 'block' }}>
              {sisaHari !== null && sisaHari !== undefined ? (
                sisaHari < 0 ? `Terlambat ${Math.abs(sisaHari)} Hari` : `${sisaHari} Hari`
              ) : '-'}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5, fontWeight: 600 }}>PROGRESS FISIK</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue)', marginTop: 4, display: 'block' }}>
              {progressActual}%
            </span>
          </div>
          <div>
            <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5, fontWeight: 600 }}>TASKS</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue)', marginTop: 4, display: 'block' }}>
              {project.completedTasks || 0}/{project.totalTasks || 0} Selesai
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. BODY LAYOUT (2 Columns) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* LEFT COLUMN: Tabs and Tab Contents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Tabs Navigation */}
          <div className="tabs" style={{ display: 'flex', gap: 2, borderBottom: '2px solid var(--border)', background: 'var(--bg)', paddingBottom: 0 }}>
            {['Overview', 'Tasks & Dokumen', 'Finance', 'Progress', 'Tim'].map(t => (
              <button
                key={t}
                className={`tab-btn ${activeTab === t ? 'active' : ''}`}
                style={{
                  border: 'none',
                  padding: '12px 18px',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === t ? 'transparent' : 'transparent',
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
            
            {/* ── TAB OVERVIEW ── */}
            {activeTab === 'Overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Section 1: Informasi Proyek */}
                <div className="card card-pad">
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>
                    Informasi Proyek
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10, fontWeight: 600 }}>CLIENT</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', cursor: 'pointer', marginTop: 4, display: 'block' }}>
                        {project.clientName || 'Internal'}
                      </span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10, fontWeight: 600 }}>LOKASI PROYEK</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block' }}>
                        {project.location || '-'}
                      </span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10, fontWeight: 600 }}>JENIS PROYEK</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize', marginTop: 4, display: 'block' }}>
                        {project.projectType || '-'}
                      </span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10, fontWeight: 600 }}>PROJECT MANAGER (PM)</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block' }}>
                        {project.assignedUser?.name || 'Belum ditugaskan'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Jadwal Kontrak */}
                <div className="card card-pad">
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>
                    Jadwal Kontrak
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5 }}>Tanggal SPK / Mulai Kontrak</span>
                      <span style={{ fontSize: 13, fontWeight: 700, marginTop: 4, display: 'block' }}>
                        {project.contractStartDate ? (
                          <Link 
                            to={`/calendar?date=${getQueryDate(project.contractStartDate)}`}
                            style={{ 
                              color: 'var(--blue)', 
                              textDecoration: 'none', 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                            title="Lihat di Kalender"
                          >
                            <Calendar size={13} />
                            {formatDateIndo(project.contractStartDate)}
                          </Link>
                        ) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5 }}>Tanggal Mulai Aktual di Lapangan</span>
                      <span style={{ fontSize: 13, fontWeight: 700, marginTop: 4, display: 'block' }}>
                        {project.actualStartDate ? (
                          <Link 
                            to={`/calendar?date=${getQueryDate(project.actualStartDate)}`}
                            style={{ 
                              color: 'var(--blue)', 
                              textDecoration: 'none', 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                            title="Lihat di Kalender"
                          >
                            <Calendar size={13} />
                            {formatDateIndo(project.actualStartDate)}
                          </Link>
                        ) : 'Belum mulai di lapangan'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5 }}>Deadline Kontrak</span>
                      <span style={{ fontSize: 13, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {project.contractEndDate ? (
                          <Link 
                            to={`/calendar?date=${getQueryDate(project.contractEndDate)}`}
                            style={{ 
                              color: isOverdue ? '#DC2626' : 'var(--blue)', 
                              textDecoration: 'none', 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                            title="Lihat di Kalender"
                          >
                            <Calendar size={13} />
                            {formatDateIndo(project.contractEndDate)}
                          </Link>
                        ) : '-'}
                        {sisaHari !== null && sisaHari !== undefined && (
                          <span 
                            className="badge" 
                            style={{ 
                              background: sisaHari < 0 ? '#FEE2E2' : '#FEF3C7', 
                              color: sisaHari < 0 ? '#DC2626' : '#D97706',
                              padding: '1px 6px',
                              fontSize: 9.5,
                              borderRadius: 4
                            }}
                          >
                            {sisaHari < 0 ? `Terlambat ${Math.abs(sisaHari)} Hari` : `${sisaHari} Hari Lagi`}
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted" style={{ display: 'block', fontSize: 10.5 }}>Total Durasi Kontrak</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 4, display: 'block' }}>
                        {getDurationDays()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Scope & Deskripsi Pekerjaan */}
                <div className="card card-pad">
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
                    Scope & Deskripsi Pekerjaan
                  </h3>
                  <textarea
                    readOnly
                    className="form-input"
                    placeholder="Belum ada deskripsi pekerjaan."
                    style={{
                      width: '100%',
                      height: 100,
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: project.description ? 'var(--text)' : 'var(--text-subtle)',
                      resize: 'none'
                    }}
                    value={project.description || ''}
                  />
                </div>

                {/* Section 4: Milestone Proyek */}
                <div className="card card-pad">
                  <MilestoneList 
                    milestones={project.milestones || []} 
                    projectId={project.id}
                    canEdit={canEdit}
                    onStatusChange={handleMilestoneStatusChange}
                  />
                </div>
              </div>
            )}

            {/* ── TAB TIM ── */}
            {activeTab === 'Tim' && (
              <div className="card card-pad">
                <TeamMemberList 
                  members={project.members || []} 
                  projectId={project.id}
                  canManage={canEdit}
                  onAddMember={handleAddMember}
                  onRemoveMember={handleRemoveMember}
                />
              </div>
            )}

            {/* ── TAB FINANCE ── */}
            {activeTab === 'Finance' && (
              <FinanceTab 
                projectId={project.id}
                project={project}
                loadProjectData={loadData}
              />
            )}

            {/* ── TAB PROGRESS ── */}
            {activeTab === 'Progress' && (
              <ProgressTab 
                projectId={project.id} 
                loadProjectDetailData={loadData}
              />
            )}

            {/* ── TAB TASKS & DOKUMEN ── */}
            {activeTab === 'Tasks & Dokumen' && (
              <TasksDocumentsTab 
                projectId={project.id}
                project={project}
                loadProjectDetailData={loadData}
              />
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (3 Cards) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Card 1: Progress Fisik */}
          <div className="card card-pad">
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="var(--blue)" /> Progress Fisik
            </h3>
            
            {/* Rencana */}
            <div style={{ marginBottom: 12 }}>
              <div className="flex-between" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Rencana (Time Schedule)</span>
                <span>{progressPlan}%</span>
              </div>
              <div className="progress-bar" style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div className="progress-fill" style={{ height: '100%', width: `${progressPlan}%`, background: '#93C5FD', borderRadius: 4 }} />
              </div>
            </div>

            {/* Aktual */}
            <div style={{ marginBottom: 12 }}>
              <div className="flex-between" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Realisasi Aktual Lapangan</span>
                <span>{progressActual}%</span>
              </div>
              <div className="progress-bar" style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div className="progress-fill" style={{ height: '100%', width: `${progressActual}%`, background: 'var(--blue)', borderRadius: 4 }} />
              </div>
            </div>

            {/* Deviasi */}
            <div 
              style={{ 
                marginTop: 16, 
                padding: '8px 12px', 
                borderRadius: 6, 
                background: deviasi >= 0 ? '#E6F4EA' : '#FCE8E6', 
                color: deviasi >= 0 ? '#137333' : '#C5221F',
                fontSize: 12.5,
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Deviasi Progres:</span>
              <span>{deviasi >= 0 ? `+${deviasi.toFixed(1)}` : deviasi.toFixed(1)}%</span>
            </div>

            {/* SPI Indicator */}
            {progressPlan > 0 && (
              <div 
                style={{ 
                  marginTop: 12, 
                  fontSize: 12, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  color: 'var(--text-subtle)',
                  padding: '0 4px'
                }}
              >
                <span>Indeks Jadwal (SPI):</span>
                <span style={{ 
                  fontWeight: 700, 
                  color: (progressActual / progressPlan) >= 1.0 ? '#137333' : ((progressActual / progressPlan) < 0.90 ? '#C5221F' : '#D97706') 
                }}>
                  {(progressActual / progressPlan).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Card 2: Ringkasan Keuangan */}
          <div className="card card-pad">
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={16} color="var(--blue)" /> Ringkasan Keuangan
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div className="flex-between" style={{ paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">Nilai Kontrak</span>
                <span style={{ fontWeight: 700 }}>{formatRupiah(contractVal)}</span>
              </div>
              <div className="flex-between" style={{ paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">Budget RAB</span>
                <span style={{ fontWeight: 700 }}>{formatRupiah(budgetVal)}</span>
              </div>
              <div className="flex-between" style={{ paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">Realisasi Biaya</span>
                <span style={{ fontWeight: 700 }}>{formatRupiah(budgetUsedVal)}</span>
              </div>
              <div className="flex-between" style={{ paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">Sisa Anggaran</span>
                <span style={{ fontWeight: 700, color: sisaAnggaran < 0 ? '#DC2626' : 'var(--text)' }}>
                  {formatRupiah(sisaAnggaran)}
                </span>
              </div>
              <div className="flex-between" style={{ paddingBottom: 6 }}>
                <span className="text-muted">Termin Pending</span>
                <span style={{ fontWeight: 700, color: 'var(--blue)' }}>
                  {financeSummary?.termins?.filter(t => ['submitted', 'approved'].includes(t.status)).length || 0} buah
                </span>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="flex-between" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Penggunaan Anggaran</span>
                <span>{Math.round(budgetUsagePct)}%</span>
              </div>
              <div className="progress-bar" style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div className="progress-fill" style={{ height: '100%', width: `${Math.min(budgetUsagePct, 100)}%`, background: budgetBarColor, borderRadius: 4 }} />
              </div>
            </div>
          </div>

          {/* Card 3: Aktivitas Terbaru */}
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', maxHeight: '380px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="var(--blue)" /> Aktivitas Terbaru
            </h3>
            <ActivityLog logs={project.activityLogs || []} />
          </div>

        </div>

      </div>
    </div>
  );
}
