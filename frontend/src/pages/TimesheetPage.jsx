import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, FileText, Trash2, Edit2, AlertCircle, Plus, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, Search, Filter, Download, ArrowRight, User, X, Check, AlertTriangle
} from 'lucide-react';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import * as XLSX from 'xlsx';

import { useAuth } from '../context/AuthContext';
import { useProjectsQuery } from '../hooks/useProjects';
import { useTeamQuery } from '../hooks/useTeam';
import { 
  useTimesheetsQuery, 
  useCreateTimesheetMutation, 
  useUpdateTimesheetMutation, 
  useDeleteTimesheetMutation, 
  useApproveTimesheetMutation, 
  useRejectTimesheetMutation, 
  useApproveBulkTimesheetsMutation,
  usePendingTimesheetsQuery
} from '../hooks/useTimesheet';
import { fetchTimesheetExport } from '../services/timesheetService';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

export default function TimesheetPage({ myTimesheetOnly = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication & roles check
  const isPMOrAdmin = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER' || user?.role === 'SENIOR_PROJECT_MANAGER';
  const showAllLogs = isPMOrAdmin && !myTimesheetOnly && !location.pathname.endsWith('/me');

  // Filter States
  const [viewMode, setViewMode] = useState('WEEKLY'); // WEEKLY, MONTHLY, LOG
  const [selectedWeek, setSelectedWeek] = useState(dayjs()); // dayjs object
  const [selectedMonth, setSelectedMonth] = useState(dayjs()); // dayjs object
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState(showAllLogs ? '' : user?.id || '');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch Master Data
  const { data: projectsPayload } = useProjectsQuery();
  const projects = projectsPayload?.data || [];
  const { data: team = [] } = useTeamQuery();
  
  // Calculate API Params
  const queryParams = {
    user_id: showAllLogs ? memberFilter : user?.id,
    project_id: projectFilter,
    status: statusFilter
  };

  if (viewMode === 'WEEKLY') {
    queryParams.week = `${selectedWeek.isoWeekYear()}-W${String(selectedWeek.isoWeek()).padStart(2, '0')}`;
  } else if (viewMode === 'MONTHLY') {
    queryParams.month = selectedMonth.format('YYYY-MM');
  }

  // Fetch Timesheets Query
  const { data: timesheetPayload, isLoading, refetch } = useTimesheetsQuery(queryParams);
  const { data: pendingApprovals = [] } = usePendingTimesheetsQuery();

  // Mutation Hooks
  const createMutation = useCreateTimesheetMutation();
  const updateMutation = useUpdateTimesheetMutation();
  const deleteMutation = useDeleteTimesheetMutation();
  const approveMutation = useApproveTimesheetMutation();
  const rejectMutation = useRejectTimesheetMutation();
  const approveBulkMutation = useApproveBulkTimesheetsMutation();

  // Modal / Panel States
  const [dayDetailCell, setDayDetailCell] = useState(null); // { user_id, user_name, date: string }
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedEntryForAction, setSelectedEntryForAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    work_date: dayjs().format('YYYY-MM-DD'),
    project_id: '',
    description: '',
    hours_regular: 8,
    hours_overtime: 0,
    work_type: 'regular'
  });

  // Export Modal state
  const [exportParams, setExportParams] = useState({
    preset: 'this_week',
    start_date: dayjs().startOf('isoWeek').format('YYYY-MM-DD'),
    end_date: dayjs().endOf('isoWeek').format('YYYY-MM-DD'),
    user_id: '',
    project_id: ''
  });

  // Calculate live total logged hours for the selected form date
  const [liveHoursLogged, setLiveHoursLogged] = useState(0);

  useEffect(() => {
    if (formData.work_date && user?.id) {
      // Find matches in current logs
      const dayStart = dayjs(formData.work_date).startOf('day');
      const matches = (timesheetPayload?.entries || []).filter(e => 
        e.user_id === user.id && dayjs(e.work_date).isSame(dayStart, 'day')
      );
      const sum = matches.reduce((acc, curr) => acc + curr.hours_regular + curr.hours_overtime, 0);
      setLiveHoursLogged(sum);
    }
  }, [formData.work_date, timesheetPayload, user]);

  // Handle Export date presets
  const handleExportPresetChange = (preset) => {
    let start = dayjs();
    let end = dayjs();
    if (preset === 'this_week') {
      start = dayjs().startOf('isoWeek');
      end = dayjs().endOf('isoWeek');
    } else if (preset === 'this_month') {
      start = dayjs().startOf('month');
      end = dayjs().endOf('month');
    } else if (preset === 'last_month') {
      start = dayjs().subtract(1, 'month').startOf('month');
      end = dayjs().subtract(1, 'month').endOf('month');
    }
    setExportParams({
      ...exportParams,
      preset,
      start_date: start.format('YYYY-MM-DD'),
      end_date: end.format('YYYY-MM-DD')
    });
  };

  const executeExport = async () => {
    try {
      const data = await fetchTimesheetExport({
        start_date: exportParams.start_date,
        end_date: exportParams.end_date,
        user_id: exportParams.user_id,
        project_id: exportParams.project_id
      });

      if (!data.length) {
        alert('Tidak ada entri timesheet ditemukan untuk filter tersebut.');
        return;
      }

      const wb = XLSX.utils.book_new();

      // Sheet 1: Rekap per Anggota (nama, total jam, per proyek)
      const membersMap = {};
      data.forEach(d => {
        const name = d.user_name;
        if (!membersMap[name]) {
          membersMap[name] = { 
            'Nama Anggota': name, 
            'Jabatan / Role': d.user_role, 
            'Total Jam Normal': 0,
            'Total Jam Lembur': 0,
            'Total Seluruh Jam': 0 
          };
        }
        membersMap[name]['Total Jam Normal'] += d.hours_regular;
        membersMap[name]['Total Jam Lembur'] += d.hours_overtime;
        membersMap[name]['Total Seluruh Jam'] += d.hours_total;

        const projKey = `Proyek: ${d.project_name || 'Internal'}`;
        if (!membersMap[name][projKey]) {
          membersMap[name][projKey] = 0;
        }
        membersMap[name][projKey] += d.hours_total;
      });
      const ws1 = XLSX.utils.json_to_sheet(Object.values(membersMap));
      XLSX.utils.book_append_sheet(wb, ws1, 'Rekap per Anggota');

      // Sheet 2: Detail Harian
      const ws2 = XLSX.utils.json_to_sheet(data.map(d => ({
        Tanggal: d.work_date,
        Nama: d.user_name,
        Role: d.user_role,
        Proyek: d.project_name || 'Kegiatan Internal',
        Kode: d.project_code || '',
        'Jam Regular': d.hours_regular,
        'Jam Lembur': d.hours_overtime,
        'Total Jam': d.hours_total,
        'Tipe Kerja': d.work_type,
        Deskripsi: d.description,
        Status: d.status
      })));
      XLSX.utils.book_append_sheet(wb, ws2, 'Detail Harian');

      // Sheet 3: Rekap per Proyek (proyek, total jam, per anggota)
      const projectsMap = {};
      data.forEach(d => {
        const proj = d.project_name || 'Kegiatan Internal';
        if (!projectsMap[proj]) {
          projectsMap[proj] = { 
            Proyek: proj, 
            'Kode Proyek': d.project_code || '', 
            'Total Jam Kerja': 0 
          };
        }
        projectsMap[proj]['Total Jam Kerja'] += d.hours_total;

        const memberKey = `Anggota: ${d.user_name}`;
        if (!projectsMap[proj][memberKey]) {
          projectsMap[proj][memberKey] = 0;
        }
        projectsMap[proj][memberKey] += d.hours_total;
      });
      const ws3 = XLSX.utils.json_to_sheet(Object.values(projectsMap));
      XLSX.utils.book_append_sheet(wb, ws3, 'Rekap per Proyek');

      XLSX.writeFile(wb, `Timesheet_Export_${exportParams.start_date}_to_${exportParams.end_date}.xlsx`);
      setIsExportModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor data: ' + err.message);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate({
      project_id: formData.project_id || null,
      work_date: formData.work_date,
      hours_regular: Number(formData.hours_regular),
      hours_overtime: Number(formData.hours_overtime),
      work_type: formData.work_type,
      description: formData.description
    }, {
      onSuccess: () => {
        setIsInputModalOpen(false);
        setFormData({
          work_date: dayjs().format('YYYY-MM-DD'),
          project_id: '',
          description: '',
          hours_regular: 8,
          hours_overtime: 0,
          work_type: 'regular'
        });
      },
      onError: (err) => {
        alert(err.message);
      }
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    updateMutation.mutate({
      id: editingEntry.id,
      data: {
        project_id: formData.project_id || null,
        work_date: formData.work_date,
        hours_regular: Number(formData.hours_regular),
        hours_overtime: Number(formData.hours_overtime),
        work_type: formData.work_type,
        description: formData.description
      }
    }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setEditingEntry(null);
      },
      onError: (err) => {
        alert(err.message);
      }
    });
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus entri timesheet ini?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          if (dayDetailCell) {
            // refresh panel cell logs
            setDayDetailCell({ ...dayDetailCell });
          }
        },
        onError: (err) => alert(err.message)
      });
    }
  };

  const handleApprove = (entry) => {
    setSelectedEntryForAction(entry);
    setIsApproveConfirmOpen(true);
  };

  const confirmApprove = () => {
    if (!selectedEntryForAction) return;
    approveMutation.mutate(selectedEntryForAction.id, {
      onSuccess: () => {
        setIsApproveConfirmOpen(false);
        setSelectedEntryForAction(null);
        if (dayDetailCell) setDayDetailCell({ ...dayDetailCell });
      },
      onError: (err) => alert(err.message)
    });
  };

  const handleReject = (entry) => {
    setSelectedEntryForAction(entry);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const confirmReject = (e) => {
    e.preventDefault();
    if (!selectedEntryForAction || !rejectionReason.trim()) return;
    rejectMutation.mutate({
      id: selectedEntryForAction.id,
      rejectionReason: rejectionReason
    }, {
      onSuccess: () => {
        setIsRejectModalOpen(false);
        setSelectedEntryForAction(null);
        if (dayDetailCell) setDayDetailCell({ ...dayDetailCell });
      },
      onError: (err) => alert(err.message)
    });
  };

  const handleBulkApprove = (userId) => {
    // Find all pending entries for this user in this week
    const userWeekPending = (timesheetPayload?.entries || []).filter(e => 
      e.user_id === userId && e.status.toLowerCase() === 'pending'
    );
    if (!userWeekPending.length) {
      alert('Tidak ada entri pending untuk disetujui.');
      return;
    }
    const ids = userWeekPending.map(e => e.id);
    if (confirm(`Setujui seluruh ${ids.length} entri pending milik karyawan ini?`)) {
      approveBulkMutation.mutate(ids, {
        onSuccess: () => alert('Berhasil menyetujui seluruh entri pending!'),
        onError: (err) => alert(err.message)
      });
    }
  };

  // Helper arrays for dates in weekly view
  const getDaysOfWeekDates = (weekDayjs) => {
    const dates = [];
    const monday = weekDayjs.startOf('isoWeek');
    for (let i = 0; i < 7; i++) {
      dates.push(monday.add(i, 'day'));
    }
    return dates;
  };

  const weekDates = getDaysOfWeekDates(selectedWeek);

  // Grouped entries for Log Harian
  const groupedLogEntries = () => {
    const sorted = [...(timesheetPayload?.entries || [])].sort((a, b) => 
      new Date(b.work_date) - new Date(a.work_date)
    );
    
    // Perform Frontend search filter if query is set
    const query = searchQuery.toLowerCase().trim();
    const filtered = sorted.filter(e => {
      if (!query) return true;
      return (
        e.user_name.toLowerCase().includes(query) || 
        e.project_name.toLowerCase().includes(query) || 
        (e.description && e.description.toLowerCase().includes(query))
      );
    });

    const groups = {};
    filtered.forEach(e => {
      const dateStr = dayjs(e.work_date).format('dddd, D MMMM YYYY');
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(e);
    });
    return groups;
  };

  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setFormData({
      work_date: dayjs(entry.work_date).format('YYYY-MM-DD'),
      project_id: entry.project_id || '',
      description: entry.description,
      hours_regular: entry.hours_regular,
      hours_overtime: entry.hours_overtime,
      work_type: entry.work_type
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAddFromDetail = (userId, dateStr) => {
    setFormData({
      work_date: dateStr,
      project_id: '',
      description: '',
      hours_regular: 8,
      hours_overtime: 0,
      work_type: 'regular'
    });
    setIsInputModalOpen(true);
  };

  return (
    <div className="timesheet-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── HEADER ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Timesheet</h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Pencatatan jam kerja harian tim · <span style={{ fontWeight: 600, color: 'var(--blue)' }}>{timesheetPayload?.weekly_summary?.period_label || timesheetPayload?.period_label || selectedWeek.format('D MMMM YYYY')}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => setIsExportModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={15} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => {
            setFormData({
              work_date: dayjs().format('YYYY-MM-DD'),
              project_id: '',
              description: '',
              hours_regular: 8,
              hours_overtime: 0,
              work_type: 'regular'
            });
            setIsInputModalOpen(true);
          }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Input Jam Kerja
          </button>
        </div>
      </div>

      {/* ── KPI BAR (5 cards) ── */}
      <div className="kpi-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--blue)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL JAM MINGGU INI</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)', marginTop: 4 }}>
            {isLoading ? '...' : timesheetPayload?.kpi?.total_hours_this_week || 0}h
          </div>
        </div>
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--green)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>RATA-RATA PER ORANG</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
            {isLoading ? '...' : timesheetPayload?.kpi?.avg_hours_per_person || 0}h
          </div>
        </div>
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--amber)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>JAM LEMBUR</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--amber)', marginTop: 4 }}>
            {isLoading ? '...' : timesheetPayload?.kpi?.total_overtime || 0}h
          </div>
        </div>
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--amber)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>MENUNGGU APPROVAL</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--amber)', marginTop: 4 }}>
            {isLoading ? '...' : timesheetPayload?.kpi?.pending_count || 0}
          </div>
        </div>
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--red)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>BELUM INPUT MINGGU INI</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)', marginTop: 4 }}>
            {isLoading ? '...' : timesheetPayload?.kpi?.missing_count || 0}
          </div>
        </div>
      </div>

      {/* ── TOOLBAR FILTER ── */}
      <div className="card card-pad" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 300 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Cari nama atau proyek..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input" 
              style={{ width: '100%', paddingLeft: 36 }}
            />
          </div>

          <select className="form-input" style={{ width: 160 }} value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
            <option value="">Semua Proyek</option>
            <option value="internal">Kegiatan Internal</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
          </select>

          {showAllLogs && (
            <select className="form-input" style={{ width: 160 }} value={memberFilter} onChange={e => setMemberFilter(e.target.value)}>
              <option value="">Semua Anggota</option>
              {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}

          <select className="form-input" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="btn-group" style={{ display: 'flex', background: 'var(--bg-light)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
          <button 
            className={`btn btn-sm ${viewMode === 'WEEKLY' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ borderRadius: 6, padding: '4px 12px', fontSize: 12 }} 
            onClick={() => setViewMode('WEEKLY')}
          >
            Mingguan
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'MONTHLY' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ borderRadius: 6, padding: '4px 12px', fontSize: 12 }} 
            onClick={() => setViewMode('MONTHLY')}
          >
            Bulanan
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'LOG' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ borderRadius: 6, padding: '4px 12px', fontSize: 12 }} 
            onClick={() => setViewMode('LOG')}
          >
            Log Harian
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'MONTHLY' ? '1fr' : '3fr 1fr', gap: 20 }}>
        {/* Left Side: Main Tables / Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* ── VIEW: MINGGUAN ── */}
          {viewMode === 'WEEKLY' && (
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Navigation Week */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setSelectedWeek(selectedWeek.subtract(1, 'week'))}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontWeight: 700, fontSize: 14, minWidth: 200, textAlign: 'center' }}>
                    {timesheetPayload?.weekly_summary?.period_label || selectedWeek.format('D MMM') + ' – ' + selectedWeek.endOf('isoWeek').format('D MMM YYYY')}
                  </span>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setSelectedWeek(selectedWeek.add(1, 'week'))}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedWeek(dayjs())}>
                  Minggu Ini
                </button>
              </div>

              {/* Weekly Grid Table */}
              <div className="table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 10px', minWidth: 150 }}>Anggota</th>
                      {weekDates.map((d, index) => {
                        const isToday = d.isSame(dayjs(), 'day');
                        const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
                        return (
                          <th key={index} style={{ textAlign: 'center', padding: '10px 6px', width: 60 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{dayNames[index]}</div>
                            <div style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              width: 24, 
                              height: 24, 
                              borderRadius: '50%',
                              backgroundColor: isToday ? 'var(--blue)' : 'transparent',
                              color: isToday ? 'white' : 'inherit',
                              fontWeight: 700,
                              marginTop: 2
                            }}>
                              {d.date()}
                            </div>
                          </th>
                        );
                      })}
                      <th style={{ textAlign: 'center', padding: '12px 10px', width: 65 }}>Total</th>
                      <th style={{ textAlign: 'center', padding: '12px 10px', width: 100 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                          Memuat rekap mingguan...
                        </td>
                      </tr>
                    ) : timesheetPayload?.weekly_summary?.per_member?.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                          Tidak ada anggota tim ditemukan.
                        </td>
                      </tr>
                    ) : (
                      timesheetPayload?.weekly_summary?.per_member?.map(row => {
                        const dayVals = [row.mon, row.tue, row.wed, row.thu, row.fri, row.sat, row.sun];
                        return (
                          <tr key={row.user_id} style={{ borderBottom: '1px solid var(--border)', height: 48 }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                              <div>{row.user_name}</div>
                              <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>{row.user_role}</div>
                            </td>
                            {dayVals.map((val, idx) => {
                              const d = weekDates[idx];
                              const isWeekend = d.day() === 0 || d.day() === 6;
                              let valColor = 'var(--text-muted)';
                              let fontWeight = '400';
                              if (val > 0) {
                                valColor = val > 8 ? 'var(--amber)' : 'var(--blue)';
                                fontWeight = '700';
                              }
                              return (
                                <td 
                                  key={idx} 
                                  onClick={() => setDayDetailCell({
                                    user_id: row.user_id,
                                    user_name: row.user_name,
                                    date: d.format('YYYY-MM-DD')
                                  })}
                                  style={{ 
                                    textAlign: 'center', 
                                    padding: '8px 6px', 
                                    cursor: 'pointer',
                                    backgroundColor: isWeekend && val === 0 ? 'var(--bg-light)' : 'transparent',
                                    color: valColor,
                                    fontWeight: fontWeight,
                                    border: '1px solid var(--border)'
                                  }}
                                  title="Klik untuk detail"
                                >
                                  {val > 0 ? `${val}h` : '—'}
                                </td>
                              );
                            })}
                            
                            {/* Total Column */}
                            <td style={{ 
                              textAlign: 'center', 
                              padding: '8px 10px', 
                              fontWeight: row.week_total >= 50 ? '800' : '600',
                              color: row.week_total >= 50 ? 'var(--amber)' : 'var(--blue)' 
                            }}>
                              {row.week_total}h
                            </td>

                            {/* Status Column */}
                            <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                              <span className={`badge ${
                                row.status_summary === 'approved' ? 'badge-green' :
                                row.status_summary === 'pending' ? 'badge-amber' :
                                row.status_summary === 'rejected' ? 'badge-red' :
                                row.status_summary === 'partial' ? 'badge-blue' : 'badge-red'
                              }`} style={{ fontSize: 11, padding: '3px 8px' }}>
                                {row.status_summary === 'approved' ? 'Approved' :
                                 row.status_summary === 'pending' ? 'Pending' :
                                 row.status_summary === 'rejected' ? 'Ada Ditolak' :
                                 row.status_summary === 'partial' ? 'Partial' : 'Belum Input'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                    
                    {/* Bottom TOTAL row */}
                    {!isLoading && timesheetPayload?.weekly_summary && (
                      <tr style={{ backgroundColor: 'var(--bg-light)', fontWeight: 800, borderTop: '2px solid var(--border)' }}>
                        <td style={{ padding: '12px 10px' }}>TOTAL</td>
                        <td style={{ textAlign: 'center', padding: '12px 6px', color: 'var(--blue)' }}>{timesheetPayload.weekly_summary.per_day_total.mon}h</td>
                        <td style={{ textAlign: 'center', padding: '12px 6px', color: 'var(--blue)' }}>{timesheetPayload.weekly_summary.per_day_total.tue}h</td>
                        <td style={{ textAlign: 'center', padding: '12px 6px', color: 'var(--blue)' }}>{timesheetPayload.weekly_summary.per_day_total.wed}h</td>
                        <td style={{ textAlign: 'center', padding: '12px 6px', color: 'var(--blue)' }}>{timesheetPayload.weekly_summary.per_day_total.thu}h</td>
                        <td style={{ textAlign: 'center', padding: '12px 6px', color: 'var(--blue)' }}>{timesheetPayload.weekly_summary.per_day_total.fri}h</td>
                        <td style={{ textAlign: 'center', padding: '12px 6px', color: 'var(--blue)' }}>{timesheetPayload.weekly_summary.per_day_total.sat}h</td>
                        <td style={{ textAlign: 'center', padding: '12px 6px', color: 'var(--blue)' }}>{timesheetPayload.weekly_summary.per_day_total.sun}h</td>
                        <td style={{ textAlign: 'center', padding: '12px 10px', color: 'var(--blue)' }}>{timesheetPayload.weekly_summary.grand_total_hours}h</td>
                        <td style={{ padding: '12px 10px' }}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── VIEW: BULANAN ── */}
          {viewMode === 'MONTHLY' && (
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Navigation Month */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setSelectedMonth(selectedMonth.subtract(1, 'month'))}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontWeight: 700, fontSize: 14, minWidth: 200, textAlign: 'center' }}>
                    {selectedMonth.format('MMMM YYYY')}
                  </span>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setSelectedMonth(selectedMonth.add(1, 'month'))}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMonth(dayjs())}>
                  Bulan Ini
                </button>
              </div>

              {/* Monthly Calendar Grid Table */}
              <div className="table-wrap" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--bg-light)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 8px', minWidth: 140 }}>Anggota</th>
                      {Array.from({ length: selectedMonth.daysInMonth() }).map((_, idx) => (
                        <th key={idx} style={{ textAlign: 'center', padding: '6px 2px', width: 28 }}>
                          {idx + 1}
                        </th>
                      ))}
                      <th style={{ textAlign: 'center', padding: '10px 8px', width: 60 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={selectedMonth.daysInMonth() + 2} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                          Memuat rekap bulanan...
                        </td>
                      </tr>
                    ) : timesheetPayload?.entries?.length === 0 ? (
                      <tr>
                        <td colSpan={selectedMonth.daysInMonth() + 2} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                          Tidak ada entri timesheet bulan ini.
                        </td>
                      </tr>
                    ) : (
                      // Aggregate entries by user
                      team.filter(tUser => showAllLogs ? (memberFilter ? tUser.id === memberFilter : true) : tUser.id === user.id).map(tUser => {
                        const userLogs = (timesheetPayload?.entries || []).filter(e => e.user_id === tUser.id);
                        const daysInMonth = selectedMonth.daysInMonth();
                        const dailySum = Array(daysInMonth).fill(0);
                        
                        userLogs.forEach(e => {
                          const dateObj = dayjs(e.work_date);
                          if (dateObj.isSame(selectedMonth, 'month')) {
                            const dateIndex = dateObj.date() - 1;
                            if (dateIndex >= 0 && dateIndex < daysInMonth) {
                              dailySum[dateIndex] += e.hours_total;
                            }
                          }
                        });

                        const userMonthTotal = dailySum.reduce((sum, h) => sum + h, 0);

                        return (
                          <tr key={tUser.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 8px', fontWeight: 600 }}>{tUser.name}</td>
                            {dailySum.map((h, dayIdx) => {
                              // Color code cell
                              // >8h -> amber, =8h -> light green, 1-7 -> light blue, 0 -> empty/gray
                              let bg = 'transparent';
                              let color = 'var(--text-muted)';
                              let fw = '400';
                              if (h > 8) {
                                bg = '#FEF3C7'; // light amber
                                color = '#B45309'; // dark amber
                                fw = '700';
                              } else if (h === 8) {
                                bg = '#D1FAE5'; // light green
                                color = '#065F46'; // dark green
                                fw = '600';
                              } else if (h > 0) {
                                bg = '#DBEAFE'; // light blue
                                color = '#1E40AF'; // dark blue
                                fw = '600';
                              }
                              return (
                                <td 
                                  key={dayIdx} 
                                  onClick={() => setDayDetailCell({
                                    user_id: tUser.id,
                                    user_name: tUser.name,
                                    date: selectedMonth.date(dayIdx + 1).format('YYYY-MM-DD')
                                  })}
                                  style={{ 
                                    textAlign: 'center', 
                                    padding: '6px 1px', 
                                    backgroundColor: bg,
                                    color: color,
                                    fontWeight: fw,
                                    cursor: 'pointer',
                                    border: '1px solid var(--border)'
                                  }}
                                  title={`Tanggal ${dayIdx + 1}: ${h}h`}
                                >
                                  {h > 0 ? h : '—'}
                                </td>
                              );
                            })}
                            <td style={{ textAlign: 'center', padding: '8px 8px', fontWeight: 700, color: 'var(--blue)', border: '1px solid var(--border)' }}>
                              {userMonthTotal}h
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── VIEW: LOG HARIAN ── */}
          {viewMode === 'LOG' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {isLoading ? (
                <div className="card card-pad" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Memuat log timesheet...
                </div>
              ) : Object.keys(groupedLogEntries()).length === 0 ? (
                <div className="card card-pad" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Tidak ada log timesheet ditemukan.
                </div>
              ) : (
                Object.entries(groupedLogEntries()).map(([dateGroup, logs]) => (
                  <div key={dateGroup} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                      <CalendarIcon size={14} />
                      {dateGroup}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {logs.map(log => {
                        const initials = log.user_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        const isOwn = log.user_id === user?.id;
                        const isPending = log.status.toLowerCase() === 'pending';
                        return (
                          <div 
                            key={log.id} 
                            className="card card-pad timesheet-log-card"
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              transition: 'box-shadow 0.2s',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                width: 36, 
                                height: 36, 
                                borderRadius: '50%', 
                                backgroundColor: 'var(--bg-light)', 
                                border: '1px solid var(--border)',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: 13,
                                fontWeight: 700,
                                color: 'var(--text-muted)'
                              }}>
                                {initials}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{log.user_name}</span>
                                  {log.project_code && (
                                    <span 
                                      onClick={() => navigate(`/projects/${log.project_id}`)}
                                      style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                      {log.project_name} ({log.project_code})
                                    </span>
                                  )}
                                  {!log.project_code && (
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                                      Internal Activity
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {log.description}
                                </div>
                                {log.status.toLowerCase() === 'rejected' && log.rejection_reason && (
                                  <div style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertTriangle size={12} />
                                    Ditolak: "{log.rejection_reason}"
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--blue)' }}>{log.hours_total}h</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reg: {log.hours_regular}h | Ovt: {log.hours_overtime}h</div>
                              </div>
                              
                              <span className={`badge ${
                                log.work_type === 'overtime' ? 'badge-amber' : 
                                log.work_type === 'lapangan' ? 'badge-green' : 
                                log.work_type === 'wfh' ? 'badge-blue' : 'badge-ghost'
                              }`} style={{ fontSize: 10.5 }}>
                                {log.work_type === 'regular' ? 'Regular' :
                                 log.work_type === 'overtime' ? 'Lembur' :
                                 log.work_type === 'lapangan' ? 'Lapangan' :
                                 log.work_type === 'wfh' ? 'WFH' : 'Training'}
                              </span>

                              <span className={`badge ${
                                log.status.toLowerCase() === 'approved' ? 'badge-green' :
                                log.status.toLowerCase() === 'rejected' ? 'badge-red' : 'badge-amber'
                              }`} style={{ fontSize: 10.5 }}>
                                {log.status.toUpperCase()}
                              </span>

                              {/* Hover actions */}
                              <div className="hover-actions-panel" style={{ display: 'flex', gap: 4 }}>
                                {isOwn && isPending && (
                                  <>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEditModal(log)} style={{ padding: 4 }} title="Ubah entri">
                                      <Edit2 size={13} color="var(--blue)" />
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(log.id)} style={{ padding: 4 }} title="Hapus entri">
                                      <Trash2 size={13} color="var(--red)" />
                                    </button>
                                  </>
                                )}
                                {isPMOrAdmin && isPending && (
                                  <>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleApprove(log)} style={{ padding: 4 }} title="Approve">
                                      <CheckCircle size={14} color="var(--green)" />
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleReject(log)} style={{ padding: 4 }} title="Reject">
                                      <X size={14} color="var(--red)" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* ── Right Side: SIDEBAR (Only Weekly and Log Harian views) ── */}
        {viewMode !== 'MONTHLY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Card 1 — Rekap Minggu Ini */}
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                Rekap Minggu Ini
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Jam Kerja Regular:</span>
                  <span style={{ fontWeight: 600 }}>
                    {isLoading ? '...' : (timesheetPayload?.weekly_summary?.per_member || []).reduce((acc, m) => acc + m.week_regular, 0)}h
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Jam Lembur (Ovt):</span>
                  <span style={{ fontWeight: 600, color: 'var(--amber)' }}>
                    {isLoading ? '...' : (timesheetPayload?.weekly_summary?.per_member || []).reduce((acc, m) => acc + m.week_overtime, 0)}h
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Realisasi Jam Lapangan:</span>
                  <span style={{ fontWeight: 600, color: 'var(--green)' }}>
                    {isLoading ? '...' : (timesheetPayload?.entries || []).filter(e => e.work_type === 'lapangan').reduce((acc, e) => acc + e.hours_total, 0)}h
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Realisasi Jam Kantor:</span>
                  <span style={{ fontWeight: 600 }}>
                    {isLoading ? '...' : (timesheetPayload?.entries || []).filter(e => e.work_type === 'regular').reduce((acc, e) => acc + e.hours_total, 0)}h
                  </span>
                </div>
                
                <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                
                {/* Realisasi vs Target */}
                {(() => {
                  const activeMembersCount = showAllLogs ? team.length : 1;
                  const targetHours = activeMembersCount * 5 * 8; // members * 5 days * 8h
                  const actualHours = timesheetPayload?.weekly_summary?.grand_total_hours || 0;
                  const progressPct = targetHours > 0 ? Math.min(100, Math.round((actualHours / targetHours) * 100)) : 0;
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Target Jam Kerja ({activeMembersCount} org):</span>
                        <span style={{ fontWeight: 700 }}>{actualHours} / {targetHours}h</span>
                      </div>
                      <div style={{ width: '100%', height: 8, backgroundColor: 'var(--bg-light)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: progressPct >= 100 ? 'var(--green)' : 'var(--blue)', transition: 'width 0.3s' }}></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Card 2 — Jam per Proyek */}
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                Jam per Proyek
              </h3>
              {isLoading ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Memuat...</div>
              ) : (timesheetPayload?.hours_per_project || []).length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Tidak ada jam kerja tercatat.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(timesheetPayload?.hours_per_project || []).map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140 }} title={p.project_name}>
                        {p.project_name}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{p.total_hours}h</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 3 — Perlu Approval (Only visible to PM & Admin) */}
            {isPMOrAdmin && (
              <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  Perlu Approval
                </h3>
                {pendingApprovals.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 10 }}>
                    Semua timesheet bersih!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Unique users in pending list */}
                    {Array.from(new Set(pendingApprovals.map(a => a.user_id))).map(userId => {
                      const userPending = pendingApprovals.filter(a => a.user_id === userId);
                      const totalPendingHours = userPending.reduce((acc, curr) => acc + curr.hours_total, 0);
                      const userName = userPending[0]?.user_name || 'Karyawan';
                      const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                      return (
                        <div key={userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <div style={{ 
                              width: 28, 
                              height: 28, 
                              borderRadius: '50%', 
                              backgroundColor: 'var(--bg-light)', 
                              border: '1px solid var(--border)',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: 'var(--text-muted)'
                            }}>
                              {initials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 12, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{userName}</div>
                              <div style={{ fontSize: 10.5, color: 'var(--amber)', fontWeight: 600 }}>{totalPendingHours}h pending</div>
                            </div>
                          </div>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => handleBulkApprove(userId)}
                            style={{ 
                              fontSize: 10.5, 
                              padding: '2px 8px', 
                              color: 'var(--green)', 
                              border: '1px solid var(--green)', 
                              backgroundColor: '#E0FCE8',
                              borderRadius: 4
                            }}
                          >
                            Approve
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: INPUT TIMESHEET ── */}
      {isInputModalOpen && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div className="card card-pad" style={{ width: '100%', maxWidth: 450, background: 'var(--bg-card)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Input Jam Kerja</h3>
              <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setIsInputModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tanggal *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={formData.work_date}
                  onChange={e => setFormData({ ...formData, work_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Proyek *</label>
                <select 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={formData.project_id}
                  onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                  required
                >
                  <option value="">-- Kegiatan Internal (Rapat Kantor, Admin, dll) --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.projectName} ({p.projectCode})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Jam Regular *</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0" 
                    max="16" 
                    className="form-input"
                    style={{ width: '100%' }}
                    value={formData.hours_regular}
                    onChange={e => setFormData({ ...formData, hours_regular: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Jam Lembur</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0" 
                    max="8" 
                    className="form-input"
                    style={{ width: '100%' }}
                    value={formData.hours_overtime}
                    onChange={e => setFormData({ ...formData, hours_overtime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tipe Kerja *</label>
                <select 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={formData.work_type}
                  onChange={e => setFormData({ ...formData, work_type: e.target.value })}
                  required
                >
                  <option value="regular">Regular — Kantor/Normal</option>
                  <option value="lapangan">Lapangan — Site Proyek</option>
                  <option value="overtime">Lembur — Di luar jam normal</option>
                  <option value="wfh">WFH — Work From Home</option>
                  <option value="training">Training — Pelatihan/Workshop</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Deskripsi Pekerjaan * (Min 10 Karakter)</label>
                <textarea 
                  rows="3" 
                  className="form-input" 
                  style={{ width: '100%', resize: 'none' }}
                  placeholder="Contoh: Supervisi pekerjaan plesteran zona B, koordinasi dengan mandor terkait material keramik..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              {/* Real-time preview */}
              <div style={{ background: 'var(--bg-light)', padding: 10, borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="var(--blue)" />
                <div>
                  Total jam input: <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{Number(formData.hours_regular) + Number(formData.hours_overtime)} jam</span>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                    (Sudah ada {liveHoursLogged} jam tercatat di hari yang sama)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsInputModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT TIMESHEET ── */}
      {isEditModalOpen && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div className="card card-pad" style={{ width: '100%', maxWidth: 450, background: 'var(--bg-card)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Ubah Entri Timesheet</h3>
              <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tanggal *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={formData.work_date}
                  onChange={e => setFormData({ ...formData, work_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Proyek *</label>
                <select 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={formData.project_id}
                  onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                  required
                >
                  <option value="">-- Kegiatan Internal (Rapat Kantor, Admin, dll) --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.projectName} ({p.projectCode})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Jam Regular *</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0" 
                    max="16" 
                    className="form-input"
                    style={{ width: '100%' }}
                    value={formData.hours_regular}
                    onChange={e => setFormData({ ...formData, hours_regular: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Jam Lembur</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0" 
                    max="8" 
                    className="form-input"
                    style={{ width: '100%' }}
                    value={formData.hours_overtime}
                    onChange={e => setFormData({ ...formData, hours_overtime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tipe Kerja *</label>
                <select 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={formData.work_type}
                  onChange={e => setFormData({ ...formData, work_type: e.target.value })}
                  required
                >
                  <option value="regular">Regular — Kantor/Normal</option>
                  <option value="lapangan">Lapangan — Site Proyek</option>
                  <option value="overtime">Lembur — Di luar jam normal</option>
                  <option value="wfh">WFH — Work From Home</option>
                  <option value="training">Training — Pelatihan/Workshop</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Deskripsi Pekerjaan *</label>
                <textarea 
                  rows="3" 
                  className="form-input" 
                  style={{ width: '100%', resize: 'none' }}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ background: '#FFEBEB', padding: 10, borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)' }}>
                <AlertCircle size={16} />
                <div>
                  Mengubah entri akan mereset status ke <span style={{ fontWeight: 700 }}>Pending</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsEditModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: APPROVE CONFIRM ── */}
      {isApproveConfirmOpen && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div className="card card-pad" style={{ width: '100%', maxWidth: 400, background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Persetujuan Timesheet</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Apakah Anda yakin ingin menyetujui entri jam kerja berikut?
            </p>
            {selectedEntryForAction && (
              <div style={{ background: 'var(--bg-light)', padding: 12, borderRadius: 6, fontSize: 12.5, marginBottom: 20 }}>
                <div style={{ fontWeight: 700 }}>{selectedEntryForAction.user_name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 2 }}>{selectedEntryForAction.project_name}</div>
                <div style={{ fontWeight: 600, color: 'var(--blue)', marginTop: 4 }}>Total: {selectedEntryForAction.hours_total} jam</div>
                <div style={{ marginTop: 6, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                  "{selectedEntryForAction.description}"
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setIsApproveConfirmOpen(false)}>Batal</button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--green)', borderColor: 'var(--green)' }} onClick={confirmApprove}>
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REJECT ── */}
      {isRejectModalOpen && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <form onSubmit={confirmReject} className="card card-pad" style={{ width: '100%', maxWidth: 400, background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--red)' }}>Tolak Timesheet</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Alasan Penolakan *</label>
              <textarea 
                rows="3" 
                className="form-input" 
                style={{ width: '100%', resize: 'none' }}
                placeholder="Contoh: Jam tidak sesuai, deskripsi terlalu singkat..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setIsRejectModalOpen(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--red)', borderColor: 'var(--red)' }}>
                Tolak
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: EXPORT ── */}
      {isExportModalOpen && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div className="card card-pad" style={{ width: '100%', maxWidth: 450, background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Export Timesheet</h3>
              <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setIsExportModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Preset Periode</label>
                <select 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={exportParams.preset}
                  onChange={e => handleExportPresetChange(e.target.value)}
                >
                  <option value="this_week">Minggu Ini</option>
                  <option value="this_month">Bulan Ini</option>
                  <option value="last_month">Bulan Lalu</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Mulai Tanggal</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ width: '100%' }}
                    value={exportParams.start_date}
                    onChange={e => setExportParams({ ...exportParams, start_date: e.target.value, preset: 'custom' })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Hingga Tanggal</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ width: '100%' }}
                    value={exportParams.end_date}
                    onChange={e => setExportParams({ ...exportParams, end_date: e.target.value, preset: 'custom' })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Filter Anggota</label>
                <select 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={exportParams.user_id}
                  onChange={e => setExportParams({ ...exportParams, user_id: e.target.value })}
                >
                  <option value="">Semua Anggota</option>
                  {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Filter Proyek</label>
                <select 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={exportParams.project_id}
                  onChange={e => setExportParams({ ...exportParams, project_id: e.target.value })}
                >
                  <option value="">Semua Proyek</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Format Dokumen</label>
                <select className="form-input" style={{ width: '100%' }}>
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="pdf">PDF Document</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button className="btn btn-ghost" onClick={() => setIsExportModalOpen(false)}>Batal</button>
                <button className="btn btn-primary" onClick={executeExport}>
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER: DETAIL HARI PER ANGGOTA ── */}
      {dayDetailCell && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)',
          display: 'flex', justifyContent: 'flex-end', zIndex: 999 
        }}>
          {/* Slides in from right */}
          <div className="card" style={{ 
            width: '100%', maxWidth: 450, height: '100vh', borderRadius: 0, 
            background: 'var(--bg-card)', boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex', flexDirection: 'column', padding: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800 }}>{dayDetailCell.user_name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {dayjs(dayDetailCell.date).format('dddd, D MMMM YYYY')}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setDayDetailCell(null)}>
                <X size={20} />
              </button>
            </div>

            {/* List entries for this user on this day */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(() => {
                const cellLogs = (timesheetPayload?.entries || []).filter(e => 
                  e.user_id === dayDetailCell.user_id && 
                  dayjs(e.work_date).isSame(dayjs(dayDetailCell.date), 'day')
                );

                if (cellLogs.length === 0) {
                  return (
                    <div style={{ color: 'var(--text-muted)', fontSize: 12.5, textAlign: 'center', marginTop: 40 }}>
                      Tidak ada entri jam kerja untuk hari ini.
                    </div>
                  );
                }

                return cellLogs.map(log => {
                  const isOwn = log.user_id === user?.id;
                  const isPending = log.status.toLowerCase() === 'pending';
                  return (
                    <div key={log.id} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{log.project_name}</div>
                          {log.project_code && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Kode: {log.project_code}</div>}
                        </div>
                        <span className={`badge ${
                          log.status.toLowerCase() === 'approved' ? 'badge-green' :
                          log.status.toLowerCase() === 'rejected' ? 'badge-red' : 'badge-amber'
                        }`} style={{ fontSize: 10 }}>
                          {log.status}
                        </span>
                      </div>

                      <div style={{ fontSize: 12.5, color: 'var(--text)' }}>
                        {log.description}
                      </div>

                      {log.status.toLowerCase() === 'rejected' && log.rejection_reason && (
                        <div style={{ fontSize: 11, color: 'var(--red)', background: '#FFEBEB', padding: '4px 8px', borderRadius: 4 }}>
                          Alasan Ditolak: "{log.rejection_reason}"
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: 11.5 }}>
                        <div>
                          Tipe: <span style={{ fontWeight: 600 }}>{log.work_type}</span> | 
                          Total: <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{log.hours_total} jam</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 4 }}>
                          {isOwn && isPending && (
                            <>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEditModal(log)} style={{ padding: 4 }}>
                                <Edit2 size={12} color="var(--blue)" />
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(log.id)} style={{ padding: 4 }}>
                                <Trash2 size={12} color="var(--red)" />
                              </button>
                            </>
                          )}
                          {isPMOrAdmin && isPending && (
                            <>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleApprove(log)} style={{ padding: 4 }}>
                                <CheckCircle size={13} color="var(--green)" />
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleReject(log)} style={{ padding: 4 }}>
                                <X size={13} color="var(--red)" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Panel Footer */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13.5 }}>
                <span>Total Jam Hari Ini:</span>
                <span style={{ color: 'var(--blue)' }}>
                  {(() => {
                    const cellLogs = (timesheetPayload?.entries || []).filter(e => 
                      e.user_id === dayDetailCell.user_id && 
                      dayjs(e.work_date).isSame(dayjs(dayDetailCell.date), 'day')
                    );
                    return cellLogs.reduce((sum, e) => sum + e.hours_total, 0);
                  })()} jam
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: 10 }}>
                {dayDetailCell.user_id === user?.id && (
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => handleOpenAddFromDetail(dayDetailCell.user_id, dayDetailCell.date)}
                  >
                    + Tambah Entri Hari Ini
                  </button>
                )}
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDayDetailCell(null)}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
