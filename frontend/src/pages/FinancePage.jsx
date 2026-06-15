import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  fetchFinanceSummary, 
  fetchFinanceTermins, 
  fetchFinanceOutstanding, 
  fetchFinanceRetensi, 
  fetchFinanceCashflow, 
  fetchFinancePajak,
  updateFinanceTerminStatus
} from '../services/financeService';
import { fetchProjects, createProjectTermin, recordRetensiCair } from '../services/projectService';
import { 
  DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle, 
  Search, Filter, ChevronRight, Download, Plus, AlertCircle, Calendar, Coins, Percent, FileText, X
} from 'lucide-react';

// Import child components
import TerminStatusModal from '../components/modules/finance/TerminStatusModal';
import RetensModal from '../components/modules/finance/RetensModal';
import ExportFinanceModal from '../components/modules/finance/ExportFinanceModal';
import CashFlowChart from '../components/modules/finance/CashFlowChart';
import OutstandingAccordion from '../components/modules/finance/OutstandingAccordion';

export default function FinancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  // Query Params handling
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const paramProjectId = queryParams.get('project_id');
  const paramClientId = queryParams.get('client_id');
  const paramStatus = queryParams.get('status');

  // Page States
  const [activeTab, setActiveTab] = useState('tagihan');
  const [period, setPeriod] = useState('2026-06');
  const [cashflowYear, setCashflowYear] = useState(2026);
  const [isLoading, setIsLoading] = useState(true);

  // Filters for Semua Tagihan Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterClient, setFilterClient] = useState('ALL');
  const [filterProject, setFilterProject] = useState('ALL');

  // Loaded Data States
  const [summaryData, setSummaryData] = useState(null);
  const [terminsData, setTerminsData] = useState(null);
  const [outstandingData, setOutstandingData] = useState([]);
  const [retensiData, setRetensiData] = useState([]);
  const [cashflowData, setCashflowData] = useState([]);
  const [pajakData, setPajakData] = useState(null);
  
  // Auxiliary lists for filters
  const [projectsList, setProjectsList] = useState([]);
  const [clientsList, setClientsList] = useState([]);

  // Modals States
  const [selectedTermin, setSelectedTermin] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedRetensiProject, setSelectedRetensiProject] = useState(null);
  const [isRetensModalOpen, setIsRetensModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCreateTerminOpen, setIsCreateTerminOpen] = useState(false);

  // Create Termin Form States
  const [newTerminProjectId, setNewTerminProjectId] = useState('');
  const [newTerminNum, setNewTerminNum] = useState(1);
  const [newTerminLabel, setNewTerminLabel] = useState('');
  const [newTerminPct, setNewTerminPct] = useState('');
  const [newTerminVal, setNewTerminVal] = useState('');
  const [newTerminRetPct, setNewTerminRetPct] = useState('5.0');
  const [newTerminNotes, setNewTerminNotes] = useState('');
  const [newTerminSubDate, setNewTerminSubDate] = useState('');

  // Check role access
  const isSuperAdmin = currentUser?.role === 'ADMIN';
  const isPM = ['PROJECT_MANAGER', 'SENIOR_PROJECT_MANAGER'].includes(currentUser?.role);
  const isFinanceUser = currentUser?.role === 'FINANCE' || currentUser?.role === 'finance' || currentUser?.department === 'FINANCE' || currentUser?.department === 'finance';
  const canAccess = isSuperAdmin || isPM || isFinanceUser;
  const canManage = isSuperAdmin || isFinanceUser;

  // Handle direct redirections with queries
  useEffect(() => {
    if (paramStatus === 'outstanding') {
      setActiveTab('outstanding');
    }
  }, [paramStatus]);

  // Load baseline filters list (projects and clients)
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetchProjects({ limit: 100 });
        if (res && res.data) {
          setProjectsList(res.data);
          
          // Unique clients list mapping
          const clientsMap = {};
          res.data.forEach(p => {
            if (p.clientId && p.clientName) {
              clientsMap[p.clientId] = p.clientName;
            } else if (p.client?.id && p.client?.companyName) {
              clientsMap[p.client.id] = p.client.companyName;
            }
          });
          setClientsList(Object.entries(clientsMap).map(([id, name]) => ({ id, name })));
        }
      } catch (err) {
        console.error('Failed to load filter items:', err);
      }
    };
    fetchFilters();
  }, []);

  // Main fetch function triggered on filters / period changes
  const loadFinanceData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch summary (triggers alerts)
      const summary = await fetchFinanceSummary(period);
      setSummaryData(summary);

      // Fetch all tab details
      const termins = await fetchFinanceTermins({
        project_id: filterProject !== 'ALL' ? filterProject : (paramProjectId || undefined),
        client_id: filterClient !== 'ALL' ? filterClient : (paramClientId || undefined),
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        search: searchQuery || undefined,
        limit: 100
      });
      setTerminsData(termins);

      const outstanding = await fetchFinanceOutstanding();
      setOutstandingData(outstanding);

      const retensi = await fetchFinanceRetensi();
      setRetensiData(retensi);

      const cashflow = await fetchFinanceCashflow(cashflowYear);
      setCashflowData(cashflow);

      const pajak = await fetchFinancePajak();
      setPajakData(pajak);

    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      loadFinanceData();
    }
  }, [period, cashflowYear, filterProject, filterClient, filterStatus, searchQuery, canAccess]);

  if (!canAccess) {
    return (
      <div className="card card-pad" style={{ padding: '60px 20px', textAlign: 'center', border: '1px solid var(--border)' }}>
        <AlertTriangle size={36} color="var(--red)" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>Akses Ditolak</h4>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Anda tidak memiliki izin yang cukup untuk melihat dashboard keuangan.
        </p>
      </div>
    );
  }

  // Formatting helper functions
  const formatRupiah = (val, compact = false) => {
    if (compact) {
      if (val < 1000000) return `Rp ${val.toLocaleString('id-ID')}`;
      if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1).replace('.', ',')} M`;
      return `Rp ${(val / 1000000).toFixed(1).replace('.', ',')} Jt`;
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Callback to execute status transitions
  const handleConfirmStatusUpdate = async (terminId, status, date, notes) => {
    try {
      await updateFinanceTerminStatus(terminId, status, date);
      setIsStatusModalOpen(false);
      loadFinanceData();
    } catch (err) {
      alert(err.message || 'Gagal merubah status termin');
    }
  };

  // Callback to execute retention payments
  const handleConfirmRetensCair = async (projectId, amount, date) => {
    try {
      await recordRetensiCair(projectId, { amount, date });
      setIsRetensModalOpen(false);
      loadFinanceData();
    } catch (err) {
      alert(err.message || 'Gagal mencatat pencairan retensi');
    }
  };

  // Open status modal helper
  const triggerStatusModal = (termin, status) => {
    setSelectedTermin(termin);
    setTargetStatus(status);
    setIsStatusModalOpen(true);
  };

  // Open retention modal helper
  const triggerRetensiModal = (item) => {
    setSelectedRetensiProject(item);
    setIsRetensModalOpen(true);
  };

  // Shortcut termin submit handler
  const handleCreateTermin = async (e) => {
    e.preventDefault();
    if (!newTerminProjectId || !newTerminVal || !newTerminNum) {
      alert('Pilihlah proyek, nomor termin, dan nilai termin terlebih dahulu.');
      return;
    }
    try {
      const payload = {
        termin_number: parseInt(newTerminNum, 10),
        termin_label: newTerminLabel || `Termin ${newTerminNum}`,
        percentage: parseFloat(newTerminPct) || null,
        nilai_termin: parseFloat(newTerminVal),
        retensi_pct: parseFloat(newTerminRetPct) || 5.0,
        submitted_date: newTerminSubDate ? newTerminSubDate : undefined,
        notes: newTerminNotes || undefined
      };
      await createProjectTermin(newTerminProjectId, payload);
      setIsCreateTerminOpen(false);
      loadFinanceData();
      
      // Clean form fields
      setNewTerminProjectId('');
      setNewTerminNum(1);
      setNewTerminLabel('');
      setNewTerminPct('');
      setNewTerminVal('');
      setNewTerminRetPct('5.0');
      setNewTerminNotes('');
      setNewTerminSubDate('');
    } catch (err) {
      alert(err.message || 'Gagal membuat termin');
    }
  };

  // Calculation for sidebar widgets
  const cashInYTD = cashflowData.reduce((sum, c) => sum + c.kas_masuk, 0);
  const cashOutYTD = cashflowData.reduce((sum, c) => sum + c.kas_keluar, 0);
  const netCashflowYTD = cashInYTD - cashOutYTD;
  const cashflowPct = cashInYTD > 0 ? (cashOutYTD / cashInYTD) * 100 : 0;

  // Next estimate release retensi label
  const upcomingReleaseLabel = () => {
    if (retensiData.length === 0) return '-';
    const activeRetensi = retensiData.filter(r => r.retensi_sisa > 0 && r.estimasi_cair_date);
    if (activeRetensi.length === 0) return 'Tidak ada estimasi terdekat';
    
    // Sort by earliest date
    activeRetensi.sort((a, b) => new Date(a.estimasi_cair_date) - new Date(b.estimasi_cair_date));
    const nextDate = new Date(activeRetensi[0].estimasi_cair_date);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[nextDate.getMonth()]} ${nextDate.getFullYear()}`;
  };

  return (
    <div>
      {/* ── HEADER FINANCE ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Finance</h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: 'var(--text-subtle)' }}>
            Rekap keuangan lintas semua proyek &middot; <strong>{summaryData?.summary?.period_label || 'Bulan Berjalan'}</strong>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Period Selector Dropdown */}
          <select 
            className="select-field" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13, borderRadius: 8, border: '1px solid var(--border)' }}
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            <option value="2026-06">Juni 2026</option>
            <option value="2026-05">Mei 2026</option>
            <option value="2026-Q2">Q2 2026</option>
            <option value="2026">Tahun 2026</option>
          </select>

          {/* Export Button */}
          <button 
            className="btn btn-secondary" 
            style={{ borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}
            onClick={() => setIsExportModalOpen(true)}
          >
            <Download size={14} /> Export
          </button>

          {/* Buat Tagihan Shortcut Button */}
          {canManage && (
            <button 
              className="btn btn-primary" 
              style={{ borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}
              onClick={() => setIsCreateTerminOpen(true)}
            >
              <Plus size={14} /> Buat Tagihan
            </button>
          )}
        </div>
      </div>

      {/* ── KPI BAR (4 Cards) ── */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* Card 1: Nilai Kontrak */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--blue)', background: 'var(--surface)', padding: 16 }}>
          <div className="kpi-label" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-subtle)' }}>TOTAL NILAI KONTRAK</div>
          <div className="kpi-value" style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)', marginTop: 6 }}>
            {formatRupiah(summaryData?.summary?.total_contract_value, true)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Dari {projectsList.length} proyek aktif & selesai
          </div>
        </div>

        {/* Card 2: Sudah Dibayar */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--emerald)', background: 'var(--surface)', padding: 16 }}>
          <div className="kpi-label" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-subtle)' }}>TOTAL SUDAH DIBAYAR</div>
          <div className="kpi-value" style={{ fontSize: 22, fontWeight: 800, color: 'var(--emerald)', marginTop: 6 }}>
            {formatRupiah(summaryData?.summary?.total_paid, true)}
          </div>
          <div style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <TrendingUp size={12} /> Kas Masuk di periode ini
          </div>
        </div>

        {/* Card 3: Outstanding */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--amber)', background: 'var(--surface)', padding: 16 }}>
          <div className="kpi-label" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-subtle)' }}>OUTSTANDING TAGIHAN</div>
          <div className="kpi-value" style={{ fontSize: 22, fontWeight: 800, color: 'var(--amber)', marginTop: 6 }}>
            {formatRupiah(summaryData?.summary?.total_outstanding, true)}
          </div>
          <div style={{ fontSize: 11, color: (summaryData?.alerts?.filter(a => a.type === 'overdue') || []).length > 0 ? 'var(--red)' : 'var(--text-muted)', marginTop: 4, fontWeight: (summaryData?.alerts?.filter(a => a.type === 'overdue') || []).length > 0 ? 700 : 500 }}>
            {(summaryData?.alerts?.filter(a => a.type === 'overdue') || []).length} termin jatuh tempo
          </div>
        </div>

        {/* Card 4: Retensi */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #6B7280', background: 'var(--surface)', padding: 16 }}>
          <div className="kpi-label" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-subtle)' }}>RETENSI DITAHAN</div>
          <div className="kpi-value" style={{ fontSize: 22, fontWeight: 800, color: '#4b5563', marginTop: 6 }}>
            {formatRupiah((summaryData?.summary?.total_retensi || 0) - (summaryData?.summary?.total_retensi_cair || 0), true)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Estimasi cair terdekat: {upcomingReleaseLabel()}
          </div>
        </div>
      </div>

      {/* ── LAYOUT GRID: MAIN PANELS + SIDEBAR WIDGETS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 20, alignItems: 'start' }}>
        
        {/* LEFT COMPONENT: TAB VIEW */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tab navigation */}
          <div className="tabs" style={{ display: 'flex', gap: 2, borderBottom: '2px solid var(--border)', background: 'var(--bg)', paddingBottom: 0 }}>
            {[
              { id: 'tagihan', label: 'Semua Tagihan' },
              { id: 'outstanding', label: 'Outstanding' },
              { id: 'retensi', label: 'Retensi' },
              { id: 'cashflow', label: 'Cash Flow' },
              { id: 'pajak', label: 'Pajak' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                style={{
                  border: 'none',
                  padding: '12px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: activeTab === tab.id ? 'var(--navy)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab.id ? '3px solid var(--blue)' : '3px solid transparent',
                  marginBottom: -2
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENTS */}
          <div className="tab-panel">
            
            {/* 1. TAB Semua Tagihan */}
            {activeTab === 'tagihan' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Filter Toolbar */}
                <div className="filter-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div className="search-input" style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', background: 'var(--bg)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <Search size={14} className="text-muted" style={{ marginRight: 8 }} />
                    <input 
                      type="text" 
                      placeholder="Cari proyek atau client..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13, color: 'var(--text)' }}
                    />
                  </div>

                  {/* Client Filter */}
                  <select 
                    className="select-field" 
                    style={{ width: 140, padding: '7px 12px', fontSize: 12.5, borderRadius: 8 }}
                    value={filterClient}
                    onChange={e => setFilterClient(e.target.value)}
                  >
                    <option value="ALL">Semua Client</option>
                    {clientsList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>

                  {/* Project Filter */}
                  <select 
                    className="select-field" 
                    style={{ width: 140, padding: '7px 12px', fontSize: 12.5, borderRadius: 8 }}
                    value={filterProject}
                    onChange={e => setFilterProject(e.target.value)}
                  >
                    <option value="ALL">Semua Proyek</option>
                    {projectsList.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                  </select>

                  {/* Status Filter */}
                  <select 
                    className="select-field" 
                    style={{ width: 120, padding: '7px 12px', fontSize: 12.5, borderRadius: 8 }}
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Diajukan</option>
                    <option value="APPROVED">Disetujui</option>
                    <option value="PAID">Dibayar</option>
                  </select>
                </div>

                {/* Table tagihan */}
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Memuat data tagihan...</div>
                ) : !terminsData || terminsData.termins.length === 0 ? (
                  <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13.5 }}>
                    Tidak ada data termin ditemukan untuk filter ini.
                  </div>
                ) : (
                  <div className="card">
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>PROYEK</th>
                            <th>CLIENT</th>
                            <th>TERMIN</th>
                            <th>NILAI TERMIN</th>
                            <th>RETENSI</th>
                            <th>NETTO CAIR</th>
                            <th>TGL DIAJUKAN</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'right' }}>AKSI</th>
                          </tr>
                        </thead>
                        <tbody>
                          {terminsData.termins.map((t) => {
                            let badgeBg = 'var(--bg)';
                            let badgeColor = 'var(--text-muted)';
                            let badgeText = 'Draft';

                            if (t.status === 'submitted') {
                              badgeBg = '#FEF3C7';
                              badgeColor = '#D97706';
                              badgeText = 'DIAJUKAN';
                            } else if (t.status === 'approved') {
                              badgeBg = '#DBEAFE';
                              badgeColor = '#2563EB';
                              badgeText = 'DISETUJUI';
                            } else if (t.status === 'paid') {
                              badgeBg = '#ECFDF5';
                              badgeColor = '#059669';
                              badgeText = 'DIBAYAR';
                            }

                            return (
                              <tr key={t.id}>
                                <td>
                                  <Link to={`/projects/${t.project_id}`} style={{ fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }} className="hover-underline">
                                    {t.project_name}
                                  </Link>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.project_code}</div>
                                </td>
                                <td>{t.client_name}</td>
                                <td style={{ fontWeight: 600 }}>{t.termin_label}</td>
                                <td style={{ fontWeight: 600 }}>{formatRupiah(t.nilai_termin)}</td>
                                <td style={{ color: 'var(--red)' }}>
                                  {t.retensi_amount > 0 ? `-${formatRupiah(t.retensi_amount)}` : 'Rp 0'}
                                </td>
                                <td style={{ fontWeight: 700, color: '#059669' }}>{formatRupiah(t.netto_cair)}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{t.submitted_date ? formatDate(t.submitted_date) : '-'}</td>
                                <td>
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
                                    <span className="badge" style={{ background: badgeBg, color: badgeColor, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                                      {badgeText}
                                    </span>
                                    {t.is_overdue && (
                                      <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 9 }}>
                                        <AlertCircle size={8} /> Jatuh Tempo
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: 6 }}>
                                    {t.status === 'draft' && canManage && (
                                      <button className="btn btn-secondary btn-sm" style={{ padding: '3px 6px', fontSize: 10.5 }} onClick={() => triggerStatusModal(t, 'submitted')}>
                                        Ajukan
                                      </button>
                                    )}
                                    {t.status === 'submitted' && canManage && (
                                      <button className="btn btn-secondary btn-sm" style={{ padding: '3px 6px', fontSize: 10.5, color: 'var(--blue)', borderColor: '#93C5FD' }} onClick={() => triggerStatusModal(t, 'approved')}>
                                        Approve
                                      </button>
                                    )}
                                    {t.status === 'approved' && canManage && (
                                      <button className="btn btn-secondary btn-sm" style={{ padding: '3px 6px', fontSize: 10.5, color: '#059669', borderColor: '#A7F3D0' }} onClick={() => triggerStatusModal(t, 'paid')}>
                                        Tandai Paid
                                      </button>
                                    )}
                                    {t.is_overdue && !['paid'].includes(t.status) && (
                                      <button className="btn btn-secondary btn-sm" style={{ padding: '3px 6px', fontSize: 10.5, color: 'var(--red)', borderColor: '#FCA5A5' }} onClick={() => alert(`Harap hubungi client ${t.client_name} untuk penagihan ${t.termin_label}`)}>
                                        Follow Up
                                      </button>
                                    )}
                                    {t.status === 'paid' && <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          
                          {/* Totals Row */}
                          <tr style={{ background: '#F8FAFC', fontWeight: 700 }}>
                            <td colSpan={3} style={{ color: 'var(--navy)' }}>TOTAL</td>
                            <td style={{ color: 'var(--blue)' }}>{formatRupiah(terminsData.totals.total_nilai)}</td>
                            <td style={{ color: 'var(--red)' }}>-{formatRupiah(terminsData.totals.total_retensi)}</td>
                            <td style={{ color: '#059669' }}>{formatRupiah(terminsData.totals.total_netto)}</td>
                            <td colSpan={3}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Summary badge totals */}
                    <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-muted)', background: 'var(--surface)' }}>
                      <strong>{terminsData.totals.count_by_status.draft || 0}</strong> Draft &middot; <strong>{terminsData.totals.count_by_status.submitted || 0}</strong> Diajukan &middot; <strong>{terminsData.totals.count_by_status.approved || 0}</strong> Disetujui &middot; <strong>{terminsData.totals.count_by_status.paid || 0}</strong> Dibayar
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. TAB Outstanding */}
            {activeTab === 'outstanding' && (
              <OutstandingAccordion 
                data={outstandingData} 
                onActionClick={triggerStatusModal} 
                canManage={canManage}
              />
            )}

            {/* 3. TAB Retensi */}
            {activeTab === 'retensi' && (
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Proyek</th>
                        <th>Client</th>
                        <th>Total Retensi</th>
                        <th>Sudah Cair</th>
                        <th>Sisa Retensi</th>
                        <th>Deadline Kontrak</th>
                        <th>Estimasi Cair</th>
                        <th>Status</th>
                        {canManage && <th style={{ textAlign: 'right' }}>Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {retensiData.length === 0 ? (
                        <tr><td colSpan="9" style={{ textAlign: 'center', padding: 20 }}>Tidak ada data retensi proyek.</td></tr>
                      ) : (
                        retensiData.map((r, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{r.project_name}</td>
                            <td>{r.client_name}</td>
                            <td>{formatRupiah(r.retensi_total)}</td>
                            <td style={{ color: '#059669' }}>{formatRupiah(r.retensi_cair)}</td>
                            <td style={{ fontWeight: 700, color: r.retensi_sisa > 0 ? 'var(--amber)' : 'var(--text-subtle)' }}>
                              {formatRupiah(r.retensi_sisa)}
                            </td>
                            <td>{r.contract_end_date ? formatDate(r.contract_end_date) : '-'}</td>
                            <td>{r.estimasi_cair_date ? formatDate(r.estimasi_cair_date) : '-'}</td>
                            <td>
                              {r.status_retensi === 'siap_cair' && <span className="badge badge-emerald">Siap Cair</span>}
                              {r.status_retensi === 'sudah_cair' && <span className="badge badge-green">Lunas</span>}
                              {r.status_retensi === 'belum_cair' && <span className="badge badge-gray">Belum Cair</span>}
                            </td>
                            {canManage && (
                              <td style={{ textAlign: 'right' }}>
                                {r.status_retensi === 'siap_cair' ? (
                                  <button 
                                    className="btn btn-secondary btn-sm" 
                                    style={{ padding: '3px 8px', fontSize: 10.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    onClick={() => triggerRetensiModal(r)}
                                  >
                                    <Coins size={12} /> Catat Pencairan
                                  </button>
                                ) : '—'}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. TAB Cash Flow */}
            {activeTab === 'cashflow' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Year Select Chart */}
                <div className="card card-pad">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Arus Kas Bulanan (Tahun {cashflowYear})</h4>
                    <select 
                      className="select-field" 
                      style={{ width: 'auto', padding: '4px 8px', fontSize: 12, borderRadius: 6 }}
                      value={cashflowYear}
                      onChange={e => setCashflowYear(parseInt(e.target.value))}
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                  <CashFlowChart data={cashflowData} year={cashflowYear} />
                </div>

                {/* Cash flow breakdown table */}
                <div className="card">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Bulan</th>
                          <th>Kas Masuk (Paid Termin)</th>
                          <th>Kas Keluar (Realisasi Biaya)</th>
                          <th>Net Cash Flow</th>
                          <th>Kumulatif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let cumulative = 0;
                          return cashflowData.map((c, idx) => {
                            cumulative += c.net_cashflow;
                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600 }}>{c.month_label}</td>
                                <td style={{ color: '#059669', fontWeight: 600 }}>+{formatRupiah(c.kas_masuk)}</td>
                                <td style={{ color: 'var(--red)' }}>-{formatRupiah(c.kas_keluar)}</td>
                                <td style={{ fontWeight: 700, color: c.net_cashflow >= 0 ? '#059669' : 'var(--red)' }}>
                                  {c.net_cashflow >= 0 ? '+' : '−'} {formatRupiah(Math.abs(c.net_cashflow))}
                                </td>
                                <td style={{ fontWeight: 700 }}>{formatRupiah(cumulative)}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 5. TAB Pajak */}
            {activeTab === 'pajak' && pajakData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card card-pad" style={{ background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-subtle)' }}>
                  Estimasi pajak konstruksi berdasarkan nilai kontrak. Angka ini bersifat indikatif — konsultasikan dengan konsultan pajak untuk perhitungan resmi.
                </div>

                {/* Pajak table */}
                <div className="card">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Proyek</th>
                          <th>Client</th>
                          <th>Nilai Kontrak</th>
                          <th>PPh Final (3,5%)</th>
                          <th>PPN (11%)</th>
                          <th>PPh 23 Subkon</th>
                          <th>Total Pajak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pajakData.per_project.map((p, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{p.project_name}</td>
                            <td>{p.client_name}</td>
                            <td style={{ fontWeight: 600 }}>{formatRupiah(p.nilai_kontrak)}</td>
                            <td>{formatRupiah(p.pph_final)}</td>
                            <td>{formatRupiah(p.ppn)}</td>
                            <td>{formatRupiah(p.pph23_subkon)}</td>
                            <td style={{ fontWeight: 700 }}>{formatRupiah(p.total_pajak)}</td>
                          </tr>
                        ))}
                        {/* Summary tax row */}
                        <tr style={{ background: '#E2E8F0', fontWeight: 800 }}>
                          <td colSpan={2}>TOTAL</td>
                          <td>{formatRupiah(pajakData.per_project.reduce((s, p) => s + p.nilai_kontrak, 0))}</td>
                          <td>{formatRupiah(pajakData.totals.total_pph_final)}</td>
                          <td>{formatRupiah(pajakData.totals.total_ppn)}</td>
                          <td>{formatRupiah(pajakData.totals.total_pph23)}</td>
                          <td>{formatRupiah(pajakData.totals.grand_total_pajak)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tax summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Total PPh Final', val: pajakData.totals.total_pph_final, color: 'var(--navy)' },
                    { label: 'Total PPN', val: pajakData.totals.total_ppn, color: 'var(--blue)' },
                    { label: 'Total PPh 23 Subkon', val: pajakData.totals.total_pph23, color: 'var(--text-subtle)' },
                    { label: 'Grand Total Pajak', val: pajakData.totals.grand_total_pajak, color: 'var(--red)', bg: '#FEE2E2', border: '1px solid #FCA5A5' }
                  ].map((tc, idx) => (
                    <div key={idx} style={{ background: tc.bg || 'var(--surface)', border: tc.border || '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                      <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)' }}>{tc.label.toUpperCase()}</span>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: tc.color, marginTop: 4, display: 'block' }}>{formatRupiah(tc.val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COMPONENT: SIDEBAR WIDGETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Card 1: Posisi Cash Flow */}
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Arus Kas YTD ({cashflowYear})</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div className="flex-between">
                <span className="text-muted">Kas Masuk</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>+{formatRupiah(cashInYTD)}</span>
              </div>
              <div className="flex-between">
                <span className="text-muted">Biaya Keluar</span>
                <span style={{ fontWeight: 700, color: 'var(--red)' }}>−{formatRupiah(cashOutYTD)}</span>
              </div>
              <div className="divider" style={{ margin: '4px 0', borderTop: '1px solid var(--border)' }} />
              <div className="flex-between" style={{ fontSize: 13, fontWeight: 800 }}>
                <span>Posisi Cash Flow</span>
                <span style={{ color: netCashflowYTD >= 0 ? '#059669' : 'var(--red)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {netCashflowYTD >= 0 ? '+' : ''}{formatRupiah(netCashflowYTD)}
                </span>
              </div>
              
              {/* Progress bar % */}
              <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-subtle)', marginBottom: 4 }}>
                  <span>Rasio Pengeluaran vs Kas Masuk</span>
                  <span>{cashflowPct.toFixed(0)}%</span>
                </div>
                <div className="progress-bar" style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      height: '100%', 
                      width: `${Math.min(cashflowPct, 100)}%`, 
                      background: cashflowPct > 90 ? 'var(--red)' : (cashflowPct > 70 ? 'var(--amber)' : '#3A7BFF'),
                      borderRadius: 3 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Outstanding per Client */}
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Outstanding Per Client</h4>
            
            {outstandingData.length === 0 ? (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>Tidak ada outstanding.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {outstandingData.slice(0, 5).map((client, idx) => {
                  const maxOutstanding = outstandingData[0]?.total_outstanding || 1;
                  const pctWidth = (client.total_outstanding / maxOutstanding) * 100;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span className="truncate" style={{ fontWeight: 600, maxWidth: 160 }}>{client.client_name}</span>
                        <span style={{ fontWeight: 700, color: 'var(--amber)', fontSize: 11.5 }}>{formatRupiah(client.total_outstanding, true)}</span>
                      </div>
                      <div className="progress-bar" style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                        <div className="progress-fill" style={{ height: '100%', width: `${pctWidth}%`, background: '#F59E0B', borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 3: Alert Perlu Perhatian */}
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Alert Perhatian</h4>
            
            {(!summaryData?.alerts || summaryData.alerts.length === 0) ? (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>Semua berjalan lancar. Tidak ada alert.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {summaryData.alerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate(`/projects/${alert.project_id}`)}
                    style={{ 
                      background: alert.severity === 'critical' ? '#FEE2E2' : '#FEF3C7', 
                      border: alert.severity === 'critical' ? '1px solid #FCA5A5' : '1px solid #FDE68A',
                      borderRadius: 8, 
                      padding: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start'
                    }}
                  >
                    <AlertTriangle size={15} color={alert.severity === 'critical' ? '#EF4444' : '#D97706'} style={{ flexShrink: 0, marginTop: 1.5 }} />
                    <div style={{ fontSize: 11.5 }}>
                      <div style={{ fontWeight: 700, color: alert.severity === 'critical' ? '#991B1B' : '#92400E' }}>
                        {alert.type.toUpperCase().replace('_', ' ')}
                      </div>
                      <div style={{ color: alert.severity === 'critical' ? '#7F1D1D' : '#78350F', marginTop: 2, lineHeight: 1.4 }}>
                        {alert.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── MODALS CONTAINER ── */}
      {/* 1. Status Update Modal */}
      <TerminStatusModal 
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedTermin(null);
        }}
        onConfirm={handleConfirmStatusUpdate}
        termin={selectedTermin}
        targetStatus={targetStatus}
      />

      {/* 2. Retention Release Modal */}
      <RetensModal 
        isOpen={isRetensModalOpen}
        onClose={() => {
          setIsRetensModalOpen(false);
          setSelectedRetensiProject(null);
        }}
        onConfirm={handleConfirmRetensCair}
        project={selectedRetensiProject}
      />

      {/* 3. Data Export Options Modal */}
      <ExportFinanceModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={{
          termins: terminsData?.termins || [],
          outstanding: outstandingData,
          retensi: retensiData,
          cashflow: cashflowData,
          pajak: pajakData,
          summary: summaryData?.summary
        }}
        periodLabel={summaryData?.summary?.period_label}
      />

      {/* 4. Buat Tagihan (Create Project Termin) Shortcut Modal */}
      {isCreateTerminOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: 440, padding: 24, maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>Buat Tagihan Baru</h3>
              <button onClick={() => setIsCreateTerminOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTermin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>PROYEK *</label>
                <select 
                  required
                  className="select-field" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6 }}
                  value={newTerminProjectId}
                  onChange={e => setNewTerminProjectId(e.target.value)}
                >
                  <option value="">-- Pilih Proyek --</option>
                  {projectsList.map(p => <option key={p.id} value={p.id}>{p.projectName} ({p.projectCode})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>NO. TERMIN *</label>
                  <input 
                    type="number" 
                    required 
                    min={1}
                    className="form-input" 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}
                    value={newTerminNum}
                    onChange={e => setNewTerminNum(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>LABEL TERMIN *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Contoh: Termin 1 — Uang Muka 30%"
                    className="form-input" 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}
                    value={newTerminLabel}
                    onChange={e => setNewTerminLabel(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>PERSENTASE (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Contoh: 30"
                    className="form-input" 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}
                    value={newTerminPct}
                    onChange={e => setNewTerminPct(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>POTONGAN RETENSI (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="form-input" 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}
                    value={newTerminRetPct}
                    onChange={e => setNewTerminRetPct(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>NILAI TERMIN (RP) *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Contoh: 2250000000"
                  className="form-input" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}
                  value={newTerminVal ? new Intl.NumberFormat('id-ID').format(newTerminVal.replace(/\D/g, '')) : ''}
                  onChange={e => setNewTerminVal(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>TANGGAL PENGAJUAN</label>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}
                  value={newTerminSubDate}
                  onChange={e => setNewTerminSubDate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>CATATAN / KETERANGAN</label>
                <textarea 
                  placeholder="Masukkan keterangan termin..."
                  className="form-input" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', minHeight: 60, resize: 'vertical' }}
                  value={newTerminNotes}
                  onChange={e => setNewTerminNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsCreateTerminOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Simpan Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
