import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchProjectFinance, 
  createProjectTermin, 
  updateProjectTermin, 
  deleteProjectTermin, 
  recordRetensiCair 
} from '../../services/projectService';
import { 
  Plus, Trash2, Edit2, Coins, TrendingUp, TrendingDown, 
  Info, Calendar, DollarSign, AlertTriangle, CheckCircle 
} from 'lucide-react';
import TerminFormModal from './TerminFormModal';
import RetensiModal from './RetensiModal';

export default function FinanceTab({ projectId, project, loadProjectData }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [financeData, setFinanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocalLoading, setIsLocalLoading] = useState(true); // 3-second skeleton simulation
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modals state
  const [isTerminModalOpen, setIsTerminModalOpen] = useState(false);
  const [selectedTermin, setSelectedTermin] = useState(null);
  const [isRetensiModalOpen, setIsRetensiModalOpen] = useState(false);

  // Determine user permissions for finance data
  const isFinanceUser = project.members?.some(
    m => m.userId === currentUser?.id && ['pm', 'finance'].includes(m.roleInProject)
  );
  const canManage = currentUser?.role === 'ADMIN' || project.assignedPm === currentUser?.id || isFinanceUser;

  const loadFinanceData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await fetchProjectFinance(projectId);
      setFinanceData(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat rincian keuangan proyek');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadFinanceData();
    }
  }, [projectId]);

  // Handle the 3-second initial skeleton requirement
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLocalLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Formaters
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

  // Callback handlers
  const handleTerminSubmit = async (terminData) => {
    if (selectedTermin) {
      // Edit
      await updateProjectTermin(projectId, selectedTermin.id, terminData);
    } else {
      // Add
      await createProjectTermin(projectId, terminData);
    }
    loadFinanceData();
    loadProjectData(); // Refresh parent sidebar stats
  };

  const handleStatusTransition = async (termin, nextStatus) => {
    try {
      const payload = { status: nextStatus };
      if (nextStatus === 'approved') payload.approved_date = new Date().toISOString().split('T')[0];
      if (nextStatus === 'paid') payload.paid_date = new Date().toISOString().split('T')[0];
      
      await updateProjectTermin(projectId, termin.id, payload);
      loadFinanceData();
      loadProjectData();
    } catch (err) {
      alert(err.message || 'Gagal mengganti status termin');
    }
  };

  const handleDeleteTermin = async (terminId) => {
    if (confirm('Hapus termin ini?')) {
      try {
        await deleteProjectTermin(projectId, terminId);
        loadFinanceData();
        loadProjectData();
      } catch (err) {
        alert(err.message || 'Gagal menghapus termin');
      }
    }
  };

  const handleRetensiCairSubmit = async (amount, date) => {
    await recordRetensiCair(projectId, { amount, date });
    loadFinanceData();
    loadProjectData();
  };

  // SKELETON RENDER (3 seconds shimmer)
  if (isLocalLoading || isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 1 skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="card card-pad skeleton" style={{ height: 100 }} />
          ))}
        </div>
        <div className="card card-pad skeleton" style={{ height: 50 }} />
        {/* Section 2 skeleton */}
        <div className="card card-pad skeleton" style={{ height: 200 }} />
        {/* Section 3 & 4 skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card card-pad skeleton" style={{ height: 160 }} />
          <div className="card card-pad skeleton" style={{ height: 160 }} />
        </div>
      </div>
    );
  }

  if (errorMsg || !financeData) {
    return (
      <div className="card card-pad" style={{ padding: '40px 20px', textAlign: 'center', border: '1px solid var(--border)' }}>
        <AlertTriangle size={36} color="var(--red)" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Gagal Memuat Data Keuangan</h4>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{errorMsg}</p>
      </div>
    );
  }

  const { summary, termins, pajak } = financeData;

  // Calculate budget threshold indicators
  const pctUsed = summary.pct_budget_used || 0;
  let budgetColor = 'var(--emerald)';
  let budgetLabel = 'Aman';
  let budgetFillClass = 'progress-green';
  
  if (pctUsed > 95) {
    budgetColor = 'var(--red)';
    budgetLabel = 'Over Budget';
    budgetFillClass = 'progress-red';
  } else if (pctUsed >= 80) {
    budgetColor = 'var(--amber)';
    budgetLabel = 'Mendekati Batas';
    budgetFillClass = 'progress-amber';
  }

  // Calculate retention timeline (contractEndDate + 6 months)
  const getRetentionReleaseEstimate = () => {
    if (!project.contractEndDate) return '-';
    const date = new Date(project.contractEndDate);
    date.setMonth(date.getMonth() + 6);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calculate totals of termins
  const totalNilaiTermin = termins.reduce((sum, t) => sum + t.nilaiTermin, 0);
  const totalRetensiAmount = termins.reduce((sum, t) => sum + (t.retensiAmount || 0), 0);
  const totalNettoCair = termins.reduce((sum, t) => sum + (t.nettoCair || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* ── SECTION 1: RINGKASAN KEUANGAN (4 Kartu) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* Nilai Kontrak */}
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--blue)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-subtle)' }}>NILAI KONTRAK</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue)' }}>{formatRupiah(summary.nilai_kontrak)}</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Nilai kesepakatan SPK</span>
        </div>

        {/* Budget RAB */}
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--navy)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-subtle)' }}>BUDGET RAB</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{formatRupiah(summary.budget_rab)}</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Rencana Anggaran Biaya</span>
        </div>

        {/* Total Tertagih */}
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--emerald)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-subtle)' }}>TOTAL TERTAGIH</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--emerald)' }}>{formatRupiah(summary.total_tertagih)}</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Termin paid & approved</span>
        </div>

        {/* Realisasi Biaya */}
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--amber)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-subtle)' }}>REALISASI BIAYA</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--amber)' }}>{formatRupiah(summary.budget_used)}</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Biaya aktual yang terpakai</span>
        </div>
      </div>

      {/* RAB Usage Progress Bar */}
      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="flex-between" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>
          <span>Penggunaan Budget RAB</span>
          <span style={{ color: budgetColor, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {budgetLabel !== 'Aman' && <AlertTriangle size={14} />} {Math.round(pctUsed)}% ({budgetLabel})
          </span>
        </div>
        <div className="progress-bar" style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          <div className={`progress-fill ${budgetFillClass}`} style={{ height: '100%', width: `${Math.min(pctUsed, 100)}%`, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-subtle)' }}>
          <span>{formatRupiah(summary.budget_used)} terpakai dari {formatRupiah(summary.budget_rab)}</span>
          <span>Sisa Anggaran: <strong>{formatRupiah(summary.sisa_anggaran)}</strong></span>
        </div>
      </div>

      {/* ── SECTION 2: TABEL PENAGIHAN TERMIN ── */}
      <div className="card card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h4 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Termin Penagihan Proyek</h4>
            <p className="text-xs text-muted" style={{ margin: '2px 0 0 0' }}>Manajemen pengajuan termin invoice konstruksi ke owner client.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => navigate(`/finance?project_id=${projectId}&status=outstanding`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              Lihat Semua di Finance
            </button>
            {canManage && (
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => {
                  setSelectedTermin(null);
                  setIsTerminModalOpen(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
              >
                <Plus size={14} /> Tambah Termin
              </button>
            )}
          </div>
        </div>

        {termins.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', padding: '24px 0' }}>
            Belum ada termin penagihan yang diajukan.
          </p>
        ) : (
          <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>TERMIN</th>
                  <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>NILAI TERMIN</th>
                  <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>RETENSI (5%)</th>
                  <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>NETTO CAIR</th>
                  <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>TGL PENGAJUAN</th>
                  <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>TGL BAYAR</th>
                  <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>STATUS</th>
                  {canManage && <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {termins.map((t) => {
                  let badgeBg = 'var(--bg)';
                  let badgeColor = 'var(--text-muted)';
                  let badgeText = 'Draft';

                  if (t.status === 'submitted') {
                    badgeBg = '#FEF3C7';
                    badgeColor = '#D97706';
                    badgeText = 'Diajukan';
                  } else if (t.status === 'approved') {
                    badgeBg = '#DBEAFE';
                    badgeColor = '#2563EB';
                    badgeText = 'Disetujui Owner';
                  } else if (t.status === 'paid') {
                    badgeBg = '#ECFDF5';
                    badgeColor = '#059669';
                    badgeText = 'Dibayar';
                  }

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      {/* Name / Label */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontWeight: 600, color: 'var(--navy)' }}>
                        <span style={{ display: 'block', fontSize: 13 }}>{t.terminLabel}</span>
                        {t.percentage && (
                          <span style={{ fontSize: 10.5, color: 'var(--text-subtle)', fontWeight: 500 }}>
                            {t.percentage}% dari kontrak
                          </span>
                        )}
                      </td>
                      
                      {/* Nilai Termin */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: 13, fontWeight: 600 }}>
                        {formatRupiah(t.nilaiTermin)}
                      </td>

                      {/* Retensi */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: 13, color: 'var(--red)' }}>
                        {t.retensiAmount > 0 ? `-${formatRupiah(t.retensiAmount)}` : 'Rp. 0'}
                        {t.retensiPct > 0 && <span style={{ fontSize: 10, color: 'var(--text-subtle)', marginLeft: 4 }}>({t.retensiPct}%)</span>}
                      </td>

                      {/* Netto Cair */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: 13, fontWeight: 700, color: '#059669' }}>
                        {formatRupiah(t.nettoCair)}
                      </td>

                      {/* Submitted Date */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: 12.5, color: 'var(--text-muted)' }}>
                        {formatDateIndo(t.submittedDate)}
                      </td>

                      {/* Paid Date */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: 12.5, color: 'var(--text-muted)' }}>
                        {formatDateIndo(t.paidDate)}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <span 
                          className="badge" 
                          style={{ 
                            background: badgeBg, 
                            color: badgeColor, 
                            fontSize: 10.5, 
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4
                          }}
                        >
                          {badgeText}
                        </span>
                      </td>

                      {/* Aksi */}
                      {canManage && (
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            {t.status === 'draft' && (
                              <button 
                                className="btn btn-secondary btn-sm" 
                                style={{ padding: '3px 8px', fontSize: 10.5 }}
                                onClick={() => handleStatusTransition(t, 'submitted')}
                              >
                                Ajukan
                              </button>
                            )}
                            {t.status === 'submitted' && (
                              <button 
                                className="btn btn-secondary btn-sm" 
                                style={{ padding: '3px 8px', fontSize: 10.5, color: 'var(--blue)', borderColor: '#93C5FD' }}
                                onClick={() => handleStatusTransition(t, 'approved')}
                              >
                                Approve
                              </button>
                            )}
                            {t.status === 'approved' && (
                              <button 
                                className="btn btn-secondary btn-sm" 
                                style={{ padding: '3px 8px', fontSize: 10.5, color: '#059669', borderColor: '#A7F3D0' }}
                                onClick={() => handleStatusTransition(t, 'paid')}
                              >
                                Tandai Paid
                              </button>
                            )}
                            
                            {/* Edit Action for draft/submitted only */}
                            {['draft', 'submitted'].includes(t.status) && (
                              <button 
                                className="btn-ghost" 
                                style={{ padding: 4, display: 'inline-flex', color: 'var(--text-muted)' }}
                                onClick={() => {
                                  setSelectedTermin(t);
                                  setIsTerminModalOpen(true);
                                }}
                                title="Edit Termin"
                              >
                                <Edit2 size={13} />
                              </button>
                            )}

                            {/* Delete Action (Draft only) */}
                            {t.status === 'draft' && (
                              <button 
                                className="btn-ghost" 
                                style={{ padding: 4, display: 'inline-flex', color: 'var(--red)' }}
                                onClick={() => handleDeleteTermin(t.id)}
                                title="Hapus Termin"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr style={{ background: '#F8FAFC', fontWeight: 700 }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--navy)' }}>TOTAL</td>
                  <td style={{ padding: '12px 14px', fontSize: 13 }}>{formatRupiah(totalNilaiTermin)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--red)' }}>-{formatRupiah(totalRetensiAmount)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#059669' }}>{formatRupiah(totalNettoCair)}</td>
                  <td colSpan={canManage ? 4 : 3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 3: TRACKING RETENSI (3 Kotak) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--amber)' }}>
            <Coins size={16} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>RETENSI DITAHAN</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>
            {formatRupiah(summary.retensi_total)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>5% dipotong dari setiap termin kecuali FHO</span>
        </div>

        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669' }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>RETENSI SUDAH CAIR</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>
            {formatRupiah(summary.retensi_cair)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Cair setelah BAST 2 / FHO (Serah Terima Akhir)</span>
        </div>

        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Calendar size={16} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>ESTIMASI CAIR RETENSI</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>
            {getRetentionReleaseEstimate()}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>6 bulan setelah PHO (Masa Pemeliharaan)</span>
        </div>
      </div>

      {/* Button Catat Retensi Cair */}
      {canManage && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: -4 }}>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setIsRetensiModalOpen(true)}
          >
            <Coins size={14} /> Catat Retensi Cair
          </button>
        </div>
      )}

      {/* ── SECTION 4: ESTIMASI PAJAK KONSTRUKSI (2x2 Grid) ── */}
      <div className="card card-pad">
        <h4 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--navy)', marginBottom: 14 }}>
          Estimasi Pajak Konstruksi
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
            <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)' }}>PPH PASAL 4 AYAT 2 (FINAL)</span>
            <span style={{ fontSize: 14, fontWeight: 700, display: 'block', margin: '4px 0', color: 'var(--navy)' }}>
              {formatRupiah(pajak.pph_final)}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>3,5% × nilai kontrak (tarif swasta)</span>
          </div>

          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
            <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)' }}>PPN 11%</span>
            <span style={{ fontSize: 14, fontWeight: 700, display: 'block', margin: '4px 0', color: 'var(--navy)' }}>
              {formatRupiah(pajak.ppn)}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>11% × nilai kontrak (bila PKP)</span>
          </div>

          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
            <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)' }}>PPH 23 SUBKONTRAKTOR</span>
            <span style={{ fontSize: 14, fontWeight: 700, display: 'block', margin: '4px 0', color: 'var(--navy)' }}>
              {formatRupiah(pajak.pph23_subkon)}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Estimasi 2% dari 20% nilai kontrak</span>
          </div>

          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 12 }}>
            <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#C53030' }}>TOTAL ESTIMASI PAJAK</span>
            <span style={{ fontSize: 14, fontWeight: 700, display: 'block', margin: '4px 0', color: '#9B2C2C' }}>
              {formatRupiah(pajak.total_pajak)}
            </span>
            <span style={{ fontSize: 10, color: '#E53E3E' }}>Total gabungan ketiga jenis pajak</span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, margin: '12px 0 0 0' }}>
          <Info size={14} /> <em>Estimasi pajak di atas bersifat indikatif. Tarif PPh Final tergantung kualifikasi kontraktor. Konsultasikan dengan konsultan pajak untuk angka pasti.</em>
        </p>
      </div>

      {/* ── SECTION 5: CASH FLOW RINGKAS ── */}
      <div 
        style={{ 
          background: 'var(--bg)', 
          border: '1px solid var(--border)', 
          borderRadius: 12, 
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Ringkasan Arus Kas (Cash Flow)</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
          <div className="flex-between">
            <span className="text-muted">Total Kas Masuk (Paid Termin + Retensi Cair)</span>
            <span style={{ fontWeight: 700, color: '#059669' }}>
              +{formatRupiah(summary.cash_in)}
            </span>
          </div>
          <div className="flex-between">
            <span className="text-muted">Total Realisasi Biaya Keluar (Budget Used)</span>
            <span style={{ fontWeight: 700, color: 'var(--red)' }}>
              -{formatRupiah(summary.cash_out)}
            </span>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <div className="flex-between" style={{ fontSize: 14, fontWeight: 800 }}>
            <span className="text-navy">Posisi Cash Flow</span>
            <span style={{ color: summary.posisi_cashflow >= 0 ? '#059669' : 'var(--red)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {summary.posisi_cashflow >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {summary.posisi_cashflow >= 0 ? '+' : ''}
              {formatRupiah(summary.posisi_cashflow)}
            </span>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      <TerminFormModal 
        isOpen={isTerminModalOpen}
        onClose={() => {
          setIsTerminModalOpen(false);
          setSelectedTermin(null);
        }}
        onSubmit={handleTerminSubmit}
        termin={selectedTermin}
      />

      <RetensiModal 
        isOpen={isRetensiModalOpen}
        onClose={() => setIsRetensiModalOpen(false)}
        onConfirm={handleRetensiCairSubmit}
        currentRetensiCair={summary.retensi_cair}
        totalRetensi={summary.retensi_total}
      />
    </div>
  );
}
