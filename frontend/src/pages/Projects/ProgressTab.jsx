import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, AlertTriangle, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, Edit2, Trash2, FileText, 
  Printer, Plus, Eye, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchProjectProgress, 
  createWeeklyReport, 
  updateWeeklyReport, 
  deleteWeeklyReport,
  createProjectDivision,
  updateProjectDivision,
  fetchWeeklyReportDetail
} from '../../services/projectService';
import SCurveChart from './SCurveChart';
import DivisionProgressTable from './DivisionProgressTable';
import WeeklyProgressModal from './WeeklyProgressModal';
import WeeklyReportDetailModal from './WeeklyReportDetailModal';

export default function ProgressTab({ projectId, loadProjectDetailData }) {
  const { user: currentUser } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null); // for editing
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailReport, setDetailReport] = useState(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Check write access: ADMIN, PM (project assignedPm), or member pm/site_manager
  const canWrite = currentUser?.role === 'ADMIN' || 
    progressData?.project?.assignedPm === currentUser?.id ||
    progressData?.history?.some(h => h.reportedBy === currentUser?.id); // fallback check

  const loadProgress = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await fetchProjectProgress(projectId);
      setProgressData(data);
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setErrorMsg(err.message || 'Gagal memuat data progres');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProgress();
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32, border: '4px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p>Memuat analisis progres...</p>
      </div>
    );
  }

  if (errorMsg || !progressData) {
    return (
      <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid var(--border)' }}>
        <AlertTriangle size={36} color="var(--red)" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ color: 'var(--navy)', fontSize: 15, fontWeight: 700 }}>Gagal Memuat Progres</h4>
        <p className="text-xs text-muted" style={{ marginTop: 6, marginBottom: 16 }}>{errorMsg}</p>
        <button className="btn btn-secondary btn-sm" onClick={loadProgress}>Coba Lagi</button>
      </div>
    );
  }

  const { project, kpi, scurve, divisions, history } = progressData;

  const formatPercent = (val) => (val || 0).toFixed(2) + '%';
  
  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleOpenCreateReport = () => {
    setSelectedReport(null);
    setIsReportModalOpen(true);
  };

  const handleOpenEditReport = async (reportId) => {
    try {
      const detailed = await fetchWeeklyReportDetail(projectId, reportId);
      setSelectedReport(detailed);
      setIsReportModalOpen(true);
    } catch (err) {
      alert(err.message || 'Gagal memuat detail laporan mingguan');
    }
  };

  const handleOpenDetailReport = async (reportId) => {
    try {
      const detailed = await fetchWeeklyReportDetail(projectId, reportId);
      setDetailReport(detailed);
      setIsDetailModalOpen(true);
    } catch (err) {
      alert(err.message || 'Gagal memuat rincian laporan mingguan');
    }
  };

  const handleReportSubmit = async (formData) => {
    try {
      if (selectedReport) {
        await updateWeeklyReport(projectId, selectedReport.id, formData);
        alert('Laporan mingguan berhasil diperbarui!');
      } else {
        await createWeeklyReport(projectId, formData);
        alert('Laporan mingguan berhasil ditambahkan!');
      }
      setIsReportModalOpen(false);
      loadProgress();
      if (loadProjectDetailData) loadProjectDetailData(); // Sync parent details (sidebar etc)
    } catch (err) {
      alert(err.message || 'Gagal menyimpan laporan mingguan');
    }
  };

  const handleDeleteReport = async (reportId, weekNum) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Laporan Mingguan ke-${weekNum}? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await deleteWeeklyReport(projectId, reportId);
        alert('Laporan mingguan berhasil dihapus!');
        loadProgress();
        if (loadProjectDetailData) loadProjectDetailData();
      } catch (err) {
        alert(err.message || 'Gagal menghapus laporan mingguan');
      }
    }
  };

  const handleAddDivision = async (divData) => {
    const nextSort = divisions.length + 1;
    await createProjectDivision(projectId, { ...divData, sortOrder: nextSort });
    loadProgress();
  };

  const handleUpdateDivision = async (divId, divData) => {
    await updateProjectDivision(projectId, divId, divData);
    loadProgress();
  };

  // Determine latest week number
  const nextWeekNumber = history.length > 0 ? Math.max(...history.map(h => h.weekNumber)) + 1 : 1;
  const latestWeekRecord = history.length > 0 ? history[history.length - 1] : null;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Advanced narratives
  const getSpiNarrative = () => {
    const val = kpi.spi;
    if (val >= 1.0) {
      return `Proyek berjalan sesuai atau lebih cepat dari rencana jadwal awal (SPI = ${val.toFixed(2)}).`;
    } else if (val >= 0.90) {
      return `Proyek mengalami keterlambatan ringan dari jadwal rencana (SPI = ${val.toFixed(2)}). Diperlukan monitoring berkala.`;
    } else {
      return `Proyek berada dalam status KRITIS karena keterlambatan yang signifikan dari jadwal rencana (SPI = ${val.toFixed(2)}). Diperlukan tindakan percepatan segera.`;
    }
  };

  const getDeviasiNarrative = () => {
    const dev = kpi.deviasiTotal;
    if (dev >= 0) {
      return `Deviasi progres kumulatif bernilai positif (+${dev.toFixed(2)}%), menunjukkan capaian pekerjaan aktual di lapangan mendahului target waktu rencana.`;
    } else {
      return `Deviasi progres kumulatif bernilai negatif (${dev.toFixed(2)}%), menandakan akumulasi pekerjaan di lapangan mengalami keterlambatan dibanding rencana awal.`;
    }
  };

  const getEacNarrative = () => {
    if (!kpi.eacFinishDate) {
      return 'Estimasi tanggal selesai proyek (EAC) belum dapat diproyeksikan karena belum ada laporan progres aktual yang tercatat.';
    }
    const eacDate = new Date(kpi.eacFinishDate);
    const contractEnd = project.contractEndDate ? new Date(project.contractEndDate) : null;
    const dateFormatted = formatDateIndo(kpi.eacFinishDate);

    if (contractEnd) {
      const diffMs = eacDate.getTime() - contractEnd.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return `Dengan rata-rata kecepatan pekerjaan harian aktual, proyek diestimasikan selesai pada ${dateFormatted}, mengalami potensi keterlambatan sekitar ${diffDays} hari kalender dari deadline kontrak.`;
      } else {
        return `Dengan rata-rata kecepatan pekerjaan harian aktual, proyek diestimasikan selesai pada ${dateFormatted}, yang berarti selesai tepat waktu atau ${Math.abs(diffDays)} hari lebih cepat dari deadline kontrak.`;
      }
    }
    return `Berdasarkan produktivitas harian aktual, proyek diestimasikan selesai pada ${dateFormatted}.`;
  };

  const visibleHistory = isHistoryExpanded ? history : [...history].reverse().slice(0, 5);

  return (
    <div className="print-area" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Print styles inserted directly inside component */}
      <style>{`
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
            font-size: 11px !important;
          }
          nav, .no-print, .tabs, header, .sidebar, button {
            display: none !important;
          }
          .card {
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 12px !important;
            margin-bottom: 15px !important;
            page-break-inside: avoid;
          }
          .print-area {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          table {
            font-size: 10px !important;
          }
          th, td {
            padding: 6px 10px !important;
          }
        }
      `}</style>

      {/* ── SECTION 1: ACTION BUTTONS (NO-PRINT) ── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button 
          type="button" 
          className="btn btn-secondary btn-sm" 
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={handlePrint}
        >
          <Printer size={14} /> Cetak Laporan (PDF)
        </button>
        {canWrite && (
          <button 
            type="button" 
            className="btn btn-primary btn-sm" 
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={handleOpenCreateReport}
          >
            <Plus size={14} /> Lapor Progres Mingguan
          </button>
        )}
      </div>

      {/* ── SECTION 2: 4 KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Card 1: Progres Rencana */}
        <div className="card card-pad" style={{ borderLeft: '4px solid #93C5FD' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>PROGRES RENCANA</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>{formatPercent(kpi.progressPlan)}</span>
          </div>
          <span className="text-muted" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>Target Time Schedule</span>
        </div>

        {/* Card 2: Progres Aktual */}
        <div className="card card-pad" style={{ borderLeft: `4px solid ${kpi.deviasiTotal >= 0 ? '#10B981' : '#EF4444'}` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>PROGRES AKTUAL</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: kpi.deviasiTotal >= 0 ? '#10B981' : '#EF4444' }}>
              {formatPercent(kpi.progressActual)}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: kpi.deviasiTotal >= 0 ? '#137333' : '#C5221F' }}>
              ({kpi.deviasiTotal >= 0 ? `+${kpi.deviasiTotal.toFixed(2)}` : kpi.deviasiTotal.toFixed(2)}%)
            </span>
          </div>
          <span className="text-muted" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>Capaian Aktual Lapangan</span>
        </div>

        {/* Card 3: SPI */}
        <div className="card card-pad" style={{ borderLeft: `4px solid ${kpi.spiStatus === 'ontrack' ? '#10B981' : (kpi.spiStatus === 'critical' ? '#EF4444' : '#F59E0B')}` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SPI INDEX</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>{kpi.spi.toFixed(2)}</span>
            <span 
              className="badge" 
              style={{ 
                fontSize: 9.5, 
                fontWeight: 700, 
                padding: '2px 6px', 
                borderRadius: 4,
                background: kpi.spiStatus === 'ontrack' ? '#E6F4EA' : (kpi.spiStatus === 'critical' ? '#FCE8E6' : '#FEF3C7'),
                color: kpi.spiStatus === 'ontrack' ? '#137333' : (kpi.spiStatus === 'critical' ? '#C5221F' : '#D97706')
              }}
            >
              {kpi.spiStatus === 'ontrack' ? 'Sesuai/Cepat' : (kpi.spiStatus === 'critical' ? 'Kritis' : 'Lambat')}
            </span>
          </div>
          <span className="text-muted" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>Rasio Kinerja Jadwal</span>
        </div>

        {/* Card 4: Sisa Hari */}
        <div className="card card-pad" style={{ borderLeft: '4px solid #8B5CF6' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SISA WAKTU</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: kpi.remainingDays <= 14 ? '#EF4444' : 'var(--navy)' }}>
              {kpi.remainingDays} Hari
            </span>
          </div>
          <span className="text-muted" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>Dari total deadline kontrak</span>
        </div>
      </div>

      {/* ── SECTION 3: S-CURVE CHART ── */}
      <div className="card card-pad">
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>
          Kurva-S Progres Konstruksi (Rencana vs Aktual)
        </h3>
        <SCurveChart data={scurve} />
      </div>

      {/* ── SECTION 4: DIVISION TABLE ── */}
      <div className="card card-pad">
        <DivisionProgressTable 
          divisions={divisions}
          canManage={canWrite}
          onAddDivision={handleAddDivision}
          onUpdateDivision={handleUpdateDivision}
        />
      </div>

      {/* ── SECTION 5: ADVANCED PM INDICATORS ── */}
      <div className="card card-pad">
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>
          Analisis Kinerja Progres Konstruksi (PM Indicators)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Column Left: Schedule Efficiency */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ padding: 8, borderRadius: 8, background: '#F0F9FF', color: 'var(--blue)', marginTop: 2 }}>
                <CheckCircle2 size={16} />
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', display: 'block' }}>Analisis Efisiensi Jadwal (SPI)</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--text-subtle)' }}>
                  {getSpiNarrative()}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ padding: 8, borderRadius: 8, background: kpi.deviasiTotal >= 0 ? '#E6F4EA' : '#FCE8E6', color: kpi.deviasiTotal >= 0 ? '#137333' : '#C5221F', marginTop: 2 }}>
                {kpi.deviasiTotal >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', display: 'block' }}>Penyimpangan Progres (Deviasi)</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--text-subtle)' }}>
                  {getDeviasiNarrative()}
                </p>
              </div>
            </div>
          </div>

          {/* Column Right: EAC & Trends */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ padding: 8, borderRadius: 8, background: '#F5F3FF', color: '#8B5CF6', marginTop: 2 }}>
                <Calendar size={16} />
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', display: 'block' }}>Proyeksi Selesai (EAC Finish Date)</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--text-subtle)' }}>
                  {getEacNarrative()}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ padding: 8, borderRadius: 8, background: kpi.weeklyTrend >= 0 ? '#E6F4EA' : '#FCE8E6', color: kpi.weeklyTrend >= 0 ? '#137333' : '#C5221F', marginTop: 2 }}>
                {kpi.weeklyTrend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', display: 'block' }}>Tren Kemajuan Mingguan Lapangan</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--text-subtle)' }}>
                  Kemajuan progres aktual lapangan bertambah sebesar <strong style={{ color: kpi.weeklyTrend >= 0 ? '#137333' : '#C5221F' }}>{kpi.weeklyTrend >= 0 ? `+${kpi.weeklyTrend.toFixed(2)}` : kpi.weeklyTrend.toFixed(2)}%</strong> dalam laporan minggu terakhir dibandingkan dengan minggu sebelumnya.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 6: WEEKLY REPORT HISTORY ── */}
      <div className="card card-pad">
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>
          Riwayat Laporan Mingguan Lapangan
        </h3>
        
        {history.length === 0 ? (
          <p style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 12.5, margin: 0 }}>
            Belum ada laporan mingguan yang diunggah untuk proyek ini.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visibleHistory.map((h) => {
                const isLatest = latestWeekRecord?.id === h.id;
                return (
                  <div 
                    key={h.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: 14, 
                      border: '1px solid var(--border)', 
                      borderRadius: 8, 
                      background: isLatest ? '#F8FAFC' : 'var(--surface)' 
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 13, color: 'var(--navy)' }}>
                          {h.weekLabel || `Minggu ${h.weekNumber}`}
                        </strong>
                        {isLatest && (
                          <span style={{ fontSize: 9.5, background: '#DBEAFE', color: '#2563EB', fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                            Minggu Terkini
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted" style={{ fontSize: 11.5 }}>
                        Periode: {formatDateIndo(h.periodStart)} - {formatDateIndo(h.periodEnd)} &middot; Dilaporkan oleh PM/Site Manager
                      </span>
                      {h.notes && (
                        <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                          "{h.notes.length > 80 ? h.notes.substring(0, 80) + '...' : h.notes}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-xs" 
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px' }}
                        onClick={() => handleOpenDetailReport(h.id)}
                      >
                        <Eye size={12} /> Detail
                      </button>
                      {canWrite && (
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-xs" 
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px' }}
                          onClick={() => handleOpenEditReport(h.id)}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      )}
                      {canWrite && isLatest && (
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-xs" 
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', color: '#DC2626', borderColor: '#FCA5A5' }}
                          onClick={() => handleDeleteReport(h.id, h.weekNumber)}
                        >
                          <Trash2 size={12} /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {history.length > 5 && (
              <button 
                type="button"
                className="btn btn-secondary btn-sm no-print"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              >
                {isHistoryExpanded ? (
                  <>Sembunyikan Laporan Lama <ChevronUp size={14} /></>
                ) : (
                  <>Lihat Semua Laporan ({history.length} minggu) <ChevronDown size={14} /></>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <WeeklyProgressModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        divisions={divisions}
        weeklyReport={selectedReport}
        nextWeekNumber={nextWeekNumber}
      />

      <WeeklyReportDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        report={detailReport}
      />
    </div>
  );
}
