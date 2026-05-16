import React, { useState, useEffect, useMemo } from 'react';
import { getAllPRs, getNotificationsForUser } from '../utils/prService';
import { getAllInvoices } from '../utils/invoiceService';
import { printProjectPerformanceReport } from '../utils/pdfExport';
import { ROLES } from '../utils/rbac';

const Reports = ({ projects = [], setProjects, currentUser }) => {
  const [activeTab, setActiveTab] = useState('Executive Summary');
  const [selectedPerfProjectId, setSelectedPerfProjectId] = useState(projects[0]?.id || null);
  const [selectedSummaryProjectId, setSelectedSummaryProjectId] = useState('all');
  const [expandedProject, setExpandedProject] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const activePerfProject = projects.find(p => p.id === selectedPerfProjectId) || projects[0];

  const handleWeeklyProgressChange = (projectId, categoryIndex, weekIndex, newValue) => {
    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        const breakdown = [...(p.performanceBreakdown || [])];
        if (breakdown[categoryIndex]) {
          const wp = [...(breakdown[categoryIndex].weeklyProgress || [0, 0, 0, 0, 0])];
          wp[weekIndex] = Number(newValue);
          breakdown[categoryIndex] = { ...breakdown[categoryIndex], weeklyProgress: wp };
          
          // Calculate overall progress
          const totalBudget = breakdown.reduce((sum, item) => sum + (item.price || 0), 0);
          const totalActual = breakdown.reduce((sum, item) => {
            const itemTotalProg = (item.weeklyProgress || [0, 0, 0, 0, 0]).reduce((s, v) => s + v, 0);
            return sum + ((item.price || 0) * itemTotalProg / 100);
          }, 0);
          const overallProgress = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

          return { ...p, performanceBreakdown: breakdown, progress: Number(overallProgress.toFixed(2)) };
        }
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  const handlePriceChange = (projectId, categoryIndex, newPrice) => {
    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        const breakdown = [...(p.performanceBreakdown || [])];
        if (breakdown[categoryIndex]) {
          breakdown[categoryIndex] = { ...breakdown[categoryIndex], price: Number(newPrice) };
        }
        return { ...p, performanceBreakdown: breakdown };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  // Initialize breakdown if missing
  React.useEffect(() => {
    if (activePerfProject && !activePerfProject.performanceBreakdown) {
      const defaultBreakdown = [
        { category: 'Preliminaris', quantity: '1 Lot', price: 1500000, weeklyProgress: [0, 0, 0, 0, 0] },
        { category: 'Ceiling', quantity: '1 Lot', price: 1500000, weeklyProgress: [0, 0, 0, 0, 0] },
        { category: 'Wall / partition', quantity: '1 Lot', price: 1500000, weeklyProgress: [0, 0, 0, 0, 0] },
        { category: 'MEP', quantity: '1 Lot', price: 1500000, weeklyProgress: [0, 0, 0, 0, 0] },
        { category: 'Floor', quantity: '1 Lot', price: 1500000, weeklyProgress: [0, 0, 0, 0, 0] },
        { category: 'Finishing', quantity: '1 Lot', price: 1500000, weeklyProgress: [0, 0, 0, 0, 0] },
        { category: 'Furniture', quantity: '1 Lot', price: 1500000, weeklyProgress: [0, 0, 0, 0, 0] },
        { category: 'Signage', quantity: '1 Lot', price: 1500000, weeklyProgress: [0, 0, 0, 0, 0] },
        { category: 'Other', quantity: '1 Lot', price: 1500000, weeklyProgress: [0, 0, 0, 0, 0] },
      ];
      const updatedProjects = projects.map(p => {
        if (p.id === activePerfProject?.id) return { ...p, performanceBreakdown: defaultBreakdown };
        return p;
      });
      setProjects(updatedProjects);
    }
  }, [selectedPerfProjectId]);

  const [prs, setPrs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    setPrs(getAllPRs());
    setInvoices(getAllInvoices());
    if (currentUser) {
      const userNotifs = getNotificationsForUser(currentUser.id, []); // Pass empty systemUsers for now
      setActivities(userNotifs.slice(0, 5).map(n => ({
        text: `${n.type === 'pr_submitted' ? 'New PR' : n.type === 'pr_paid' ? 'PR Paid' : 'Status Update'} for ${n.project}`,
        time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        icon: n.type === 'pr_paid' ? 'check_circle' : 'info',
        color: n.type === 'pr_paid' ? 'text-green-500' : 'text-blue-500'
      })));
    }
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'Admin';
  const isPIC = currentUser?.role === ROLES.PROJECT_MANAGER;


  const handleEdit = (project) => {
    setEditingId(project.id);
    setEditData({
      planProgress: project.planProgress || 0,
      performanceRemark: project.performanceRemark || ''
    });
  };

  const handleSave = (projectId) => {
    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          planProgress: Number(editData.planProgress),
          performanceRemark: editData.performanceRemark
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    setEditingId(null);
  };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'On Track': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Delayed': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const parseAmount = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(val.toString().replace(/[^0-9.-]+/g, "")) || 0;
  };

  // Aggregated or Filtered KPIs for Summary
  const filteredProjects = selectedSummaryProjectId === 'all' 
    ? projects 
    : projects.filter(p => p.id === Number(selectedSummaryProjectId));

  const totalProjectsCount = filteredProjects.length;
  const totalBudgetVal = filteredProjects.reduce((acc, p) => acc + parseAmount(p.budget), 0);
  const totalSpendingVal = prs
    .filter(p => (p.status === 'Paid' || p.status === 'Fully Approved') && 
                (selectedSummaryProjectId === 'all' || p.project === projects.find(proj => proj.id === Number(selectedSummaryProjectId))?.name))
    .reduce((acc, p) => acc + (p.total || 0), 0);

  // Aggregate totals for other tabs
  const totalBudgetAggregate = projects.reduce((acc, p) => acc + parseAmount(p.budget), 0);
  const totalSpendingAggregate = prs.filter(p => p.status === 'Paid' || p.status === 'Fully Approved').reduce((acc, p) => acc + (p.total || 0), 0);

  const calculatePhysicalProgress = (project) => {
    const breakdown = project.performanceBreakdown || [];
    const totalBudget = breakdown.reduce((sum, item) => sum + (item.price || 0), 0);
    if (totalBudget === 0) return 0;
    const totalActual = breakdown.reduce((sum, item) => {
      const itemTotalProg = (item.weeklyProgress || [0, 0, 0, 0, 0]).reduce((s, v) => s + v, 0);
      return sum + ((item.price || 0) * itemTotalProg / 100);
    }, 0);
    return (totalActual / totalBudget) * 100;
  };

  const avgProgressVal = totalProjectsCount > 0 
    ? (filteredProjects.reduce((acc, p) => acc + calculatePhysicalProgress(p), 0) / totalProjectsCount) 
    : 0;

  const spendingPercentage = totalBudgetVal > 0 ? (totalSpendingVal / totalBudgetVal) * 100 : 0;
  
  const delayedScopeCount = filteredProjects.reduce((sum, p) => {
    const breakdown = p.performanceBreakdown || [];
    return sum + breakdown.filter(item => {
      const wp = item.weeklyProgress || [0, 0, 0, 0, 0];
      return wp.reduce((s, v) => s + v, 0) === 0;
    }).length;
  }, 0);

  const kpis = [
    { label: 'Total Projects', value: totalProjectsCount.toString(), icon: 'corporate_fare', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Budget', value: `Rp ${totalBudgetVal.toLocaleString('id-ID')}`, icon: 'account_balance_wallet', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Spending Percentage', value: `${spendingPercentage.toFixed(2)}%`, icon: 'analytics', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Spending', value: `Rp ${totalSpendingVal.toLocaleString('id-ID')}`, icon: 'payments', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Overall Progress', value: `${avgProgressVal.toFixed(2)}%`, icon: 'donut_large', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Delayed Scope of Work', value: delayedScopeCount.toString(), icon: 'format_list_bulleted_add', color: 'text-red-600', bg: 'bg-red-50' }
  ];

  const financialKpis = [
    { label: 'Total Budget', value: `Rp ${totalBudgetAggregate.toLocaleString('id-ID')}`, icon: 'account_balance_wallet', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Expense', value: `Rp ${totalSpendingAggregate.toLocaleString('id-ID')}`, icon: 'payments', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Profit Margin', value: 'Estimating...', icon: 'trending_up', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Requests', value: `Rp ${prs.filter(p => p.status.includes('Pending')).reduce((s, p) => s + (p.total || 0), 0).toLocaleString('id-ID')}`, icon: 'pending_actions', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved PRs', value: prs.filter(p => p.status === 'Fully Approved' || p.status === 'Paid').length.toString(), icon: 'receipt_long', color: 'text-indigo-600', bg: 'bg-indigo-50' }
  ];

  // Budget vs Actual Data
  const budgetVsActualData = projects
    .filter(p => selectedSummaryProjectId === 'all' || p.id === Number(selectedSummaryProjectId))
    .slice(0, 5)
    .map(p => {
      const spending = prs.filter(pr => pr.project === p.name && (pr.status === 'Paid' || pr.status === 'Fully Approved'))
                         .reduce((s, pr) => s + (pr.total || 0), 0);
      const budget = parseAmount(p.budget);
      const variance = budget - spending;
      const spendingPct = budget > 0 ? (spending / budget) * 100 : 0;
      const physicalPct = calculatePhysicalProgress(p);

      return {
        category: p.name,
        budget: `Rp ${(budget / 1000000).toFixed(1)}M`,
        actual: `Rp ${(spending / 1000000).toFixed(1)}M`,
        budgetRaw: budget,
        actualRaw: spending,
        spendingPct,
        physicalPct,
        variance: variance >= 0 ? `+ Rp ${(variance / 1000000).toFixed(1)}M` : `- Rp ${(Math.abs(variance) / 1000000).toFixed(1)}M`,
        status: variance >= 0 ? 'Good' : 'Over Budget'
      };
    });

  // Invoice Table Data
  const recentInvoices = invoices.slice(0, 4).map(inv => ({
    id: inv.id,
    client: inv.client || 'Unknown',
    amount: `Rp ${(inv.amount || 0).toLocaleString('id-ID')}`,
    dueDate: inv.dueDate || '—',
    status: inv.status || 'Pending'
  }));

  const getInvoiceBadge = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Schedule KPIs
  const scheduleKpis = [
    { label: 'On-Time Rate', value: '88%', icon: 'task_alt', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Delayed Tasks', value: '14', icon: 'pending', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Upcoming Milestones', value: '8', icon: 'flag', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg Delay Days', value: '3.5', icon: 'history', color: 'text-red-600', bg: 'bg-red-50' }
  ];

  // Milestone Tracking Data
  const milestoneData = projects.flatMap(p => (p.milestones || []).map(m => ({
    name: m.label,
    dueDate: m.date,
    team: p.name,
    status: m.completed ? 'Completed' : 'Pending'
  }))).slice(0, 4);

  const statusDistribution = projects.reduce((acc, p) => {
    const status = p.status || 'On Track';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const monthlyCashFlow = prs.reduce((acc, pr) => {
    if (pr.status === 'Paid' || pr.status === 'Fully Approved') {
      const month = new Date(pr.submittedAt).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + (pr.total || 0);
    }
    return acc;
  }, {});

  // Upcoming Tasks
  const upcomingTasksData = [
    { task: 'Begin interior framing for Level 2', date: 'Tomorrow', icon: 'construction', color: 'text-blue-500', bg: 'bg-blue-50' },
    { task: 'Safety inspection by third-party', date: 'In 3 days', icon: 'health_and_safety', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { task: 'Client site walkthrough', date: 'Next Week', icon: 'groups', color: 'text-purple-500', bg: 'bg-purple-50' }
  ];

  // Export History Data
  const exportHistoryData = [
    { name: 'Tokyo_Riverside_Financial_Q1.pdf', generatedBy: 'Admin', date: '2026-05-14 10:30 AM', format: 'PDF', icon: 'picture_as_pdf', color: 'text-red-500' },
    { name: 'Meruya_Schedule_Master.xlsx', generatedBy: 'Sarah Dorsey', date: '2026-05-12 14:15 PM', format: 'Excel', icon: 'table_view', color: 'text-emerald-500' },
    { name: 'Executive_Summary_April.pdf', generatedBy: 'Admin', date: '2026-05-01 09:00 AM', format: 'PDF', icon: 'picture_as_pdf', color: 'text-red-500' },
    { name: 'All_Projects_Performance_Report.pdf', generatedBy: 'Admin', date: '2026-04-28 16:45 PM', format: 'PDF', icon: 'picture_as_pdf', color: 'text-red-500' }
  ];

  const delayedTasksData = [
    { name: 'Structural steel procurement', delay: '5 Days', assignedTo: 'Budi Santoso' },
    { name: 'Main lobby glass installation', delay: '12 Days', assignedTo: 'Andi Pratama' },
    { name: 'HVAC system testing', delay: '3 Days', assignedTo: 'Siti Aminah' }
  ];

  const getMilestoneBadge = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pending': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const tabs = [
    'Executive Summary',
    'Weekly Progress Report',
    'Financial Report',
    'Schedule Report',
    'Export Center'
  ];



  const upcomingAlerts = projects.filter(p => p.progress < 20).map(p => ({
    text: `Low progress alert for project ${p.name}`,
    type: 'Warning',
    icon: 'trending_up',
    color: 'text-orange-500',
    bg: 'bg-orange-50'
  })).slice(0, 3);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-[#00355f] tracking-tight mb-2">Reports Center</h1>
        <p className="text-slate-500 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[#BF6604] text-lg">insights</span>
          Project analytics and operational insights
        </p>
      </div>

      {/* Top Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex overflow-x-auto mb-8 gap-2 hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-[#00355f] text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-[#00355f]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Executive Summary' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Executive Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest">Executive Summary Filter</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Filter KPIs by specific project or view portfolio total</p>
            </div>
            <div className="flex flex-col gap-1 w-full sm:w-80">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Scope</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 text-[#00355f] text-sm rounded-xl font-bold px-4 py-2.5 focus:outline-none focus:border-[#00355f] shadow-sm transition-all"
                value={selectedSummaryProjectId}
                onChange={(e) => setSelectedSummaryProjectId(e.target.value)}
              >
                <option value="all">All Projects (Portfolio Total)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.code ? `${p.code} - ` : ''}{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {kpis.map((kpi, index) => (
              <div key={index} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined">{kpi.icon}</span>
                </div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</h3>
                <p className="text-2xl font-black text-[#00355f]">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Budget vs Spending */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col min-h-[400px]">
              <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest mb-6">Budget vs Spending</h3>
              <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col p-6">
                <div className="flex-1 flex items-end gap-2 pb-2">
                  {budgetVsActualData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-1.5 h-32 relative pt-8">
                        <div className="flex flex-col items-center flex-1 h-full justify-end">
                          <span className="text-[9px] font-black text-blue-600 mb-1">{(d.budgetRaw / 1000000).toFixed(1)}M</span>
                          <div className="w-full bg-blue-400 rounded-t-md transition-all hover:brightness-90" style={{ height: '100%' }}></div>
                        </div>
                        <div className="flex flex-col items-center flex-1 h-full justify-end">
                          <span className="text-[9px] font-black text-orange-600 mb-1">{(d.actualRaw / 1000000).toFixed(1)}M</span>
                          <div className="w-full bg-orange-400 rounded-t-md transition-all hover:brightness-90" style={{ height: `${d.budgetRaw > 0 ? Math.min(100, (d.actualRaw / d.budgetRaw) * 100) : 0}%` }}></div>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase truncate w-full text-center mt-2">{d.category}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Spending</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chart 2: Spending vs Progress */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col min-h-[400px]">
              <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest mb-6">Spending vs Progress (%)</h3>
              <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col p-6">
                <div className="flex-1 flex items-end gap-2 pb-2">
                  {budgetVsActualData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-1.5 h-32 relative pt-8">
                        <div className="flex flex-col items-center flex-1 h-full justify-end">
                          <span className="text-[9px] font-black text-purple-600 mb-1">{d.spendingPct.toFixed(2)}%</span>
                          <div className="w-full bg-purple-400 rounded-t-md transition-all hover:brightness-90" style={{ height: `${d.spendingPct}%` }}></div>
                        </div>
                        <div className="flex flex-col items-center flex-1 h-full justify-end">
                          <span className="text-[9px] font-black text-emerald-600 mb-1">{d.physicalPct.toFixed(2)}%</span>
                          <div className="w-full bg-emerald-400 rounded-t-md transition-all hover:brightness-90" style={{ height: `${d.physicalPct}%` }}></div>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase truncate w-full text-center mt-2">{d.category}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-sm"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Spending %</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Physical Progress</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col min-h-[300px]">
              <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col p-6 justify-end">
                <div className="flex-1 flex items-end gap-3 px-2 pb-2">
                  {Object.entries(monthlyCashFlow).slice(-6).map(([month, total], i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-emerald-400/30 border border-emerald-400/50 rounded-t-lg transition-all hover:bg-emerald-400/50" style={{ height: `${Math.min(100, (total / 1000000000) * 100)}%`, minHeight: '10%' }}></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest mb-6 flex items-center justify-between">
                Recent Activities
                <button className="text-[10px] text-[#BF6604] hover:underline">VIEW ALL</button>
              </h3>
              <div className="space-y-6">
                {activities.length > 0 ? activities.map((act, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="mt-0.5">
                      <span className={`material-symbols-outlined ${act.color} text-xl`}>{act.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{act.text}</p>
                      <p className={`text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ${act.time}`}>{act.time}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400 italic">No recent activities found.</p>
                )}
              </div>
            </div>

            {/* Upcoming Alerts */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest mb-6 flex items-center justify-between">
                Upcoming Alerts
                <button className="text-[10px] text-[#BF6604] hover:underline">MANAGE</button>
              </h3>
              <div className="space-y-4">
                {upcomingAlerts.map((alert, i) => (
                  <div key={i} className={`p-4 rounded-2xl border border-white/50 ${alert.bg} flex items-start gap-4`}>
                    <span className={`material-symbols-outlined ${alert.color}`}>{alert.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{alert.text}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${alert.color}`}>{alert.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Weekly Progress Report Tab */}
      {activeTab === 'Weekly Progress Report' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-4 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
              <div>
                <h3 className="text-2xl font-black text-[#00355f] tracking-tight">Weekly Progress Report</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed progress analysis per work category</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex flex-col gap-1 w-full sm:w-64">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Project</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 text-[#00355f] text-sm rounded-xl font-bold px-4 py-2.5 focus:outline-none focus:border-[#00355f] shadow-sm transition-all"
                    value={selectedPerfProjectId || ''}
                    onChange={(e) => setSelectedPerfProjectId(Number(e.target.value))}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code ? `${p.code} - ` : ''}{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 self-end">
                  <button className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">filter_list</span>
                    FILTER
                  </button>
                  <button 
                    onClick={() => printProjectPerformanceReport({
                      project: activePerfProject,
                      breakdown: activePerfProject.performanceBreakdown || [],
                      createdBy: currentUser?.name || 'User'
                    })}
                    className="px-4 py-2.5 bg-[#00355f] text-white rounded-xl font-bold text-xs hover:bg-[#004a85] transition-colors flex items-center gap-2 shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    PRINT REPORT
                  </button>
                </div>
              </div>
            </div>

            {activePerfProject ? (
              <div className="overflow-x-auto rounded-xl md:rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-[#00355f] text-white">
                      <th rowSpan="2" className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-center w-12 border border-[#004a85]">No</th>
                      <th rowSpan="2" className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border border-[#004a85]">Item Description</th>
                      <th rowSpan="2" className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-center w-16 border border-[#004a85]">Qty</th>
                      <th rowSpan="2" className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-right w-28 border border-[#004a85]">Price</th>
                      <th rowSpan="2" className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-center w-16 border border-[#004a85]">Bobot</th>
                      <th colSpan="2" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center border border-[#004a85]">Week 1</th>
                      <th colSpan="2" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center border border-[#004a85]">Week 2</th>
                      <th colSpan="2" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center border border-[#004a85]">Week 3</th>
                      <th colSpan="2" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center border border-[#004a85]">Week 4</th>
                      <th colSpan="2" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center border border-[#004a85]">Week 5</th>
                      <th colSpan="2" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center border border-[#004a85] bg-[#004a85]">Total Progres</th>
                      <th rowSpan="2" className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-center w-16 border border-[#004a85]">Total Bobot</th>
                    </tr>
                    <tr className="bg-[#004a85] text-white">
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Bobot</th>
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Nilai</th>
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Bobot</th>
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Nilai</th>
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Bobot</th>
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Nilai</th>
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Bobot</th>
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Nilai</th>
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Bobot</th>
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Nilai</th>
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Bobot</th>
                      <th className="px-2 py-2 text-[8px] font-black text-center border border-[#005ba4]">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(() => {
                      const breakdown = activePerfProject.performanceBreakdown || [];
                      const grandTotalPrice = breakdown.reduce((s, i) => s + (i.price || 0), 0);
                      let totalWeekNilai = [0, 0, 0, 0, 0];
                      let totalGlobalNilai = 0;
                      let totalGlobalBobot = 0;

                      return (
                        <>
                          {breakdown.map((item, index) => {
                            const itemBobot = grandTotalPrice > 0 ? (item.price / grandTotalPrice) * 100 : 0;
                            const wp = item.weeklyProgress || [0, 0, 0, 0, 0];
                            const totalProgBobot = wp.reduce((s, v) => s + v, 0);
                            const totalProgNilai = (totalProgBobot / 100) * item.price;
                            const finalBobot = (totalProgBobot / 100) * (itemBobot / 100) * 100;
                            
                            totalGlobalNilai += totalProgNilai;
                            totalGlobalBobot += finalBobot;

                            return (
                              <tr key={index} className="hover:bg-slate-50/80 transition-colors group text-[11px]">
                                <td className="px-3 py-3 text-center font-black text-slate-400 border border-slate-100">{index + 1}</td>
                                <td className="px-4 py-3 border border-slate-100">
                                  <span className="font-bold text-slate-700">{item.category}</span>
                                </td>
                                <td className="px-3 py-3 text-center border border-slate-100">
                                  <span className="text-slate-500">{item.quantity}</span>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-600 tabular-nums border border-slate-100">
                                  {new Intl.NumberFormat('id-ID').format(item.price || 0)}
                                </td>
                                <td className="px-3 py-3 text-center font-black text-[#00355f] border border-slate-100">
                                  {itemBobot.toFixed(2)}%
                                </td>
                                {wp.map((val, wIdx) => {
                                  const weekNilai = (val / 100) * item.price;
                                  totalWeekNilai[wIdx] += weekNilai;
                                  return (
                                    <React.Fragment key={wIdx}>
                                      <td className="px-2 py-3 text-center border border-slate-100">
                                        <input 
                                          type="number" 
                                          step="0.01"
                                          className={`w-14 bg-white border border-slate-200 rounded px-1 py-1 text-[10px] font-black text-center focus:border-[#00355f] outline-none shadow-inner ${!isPIC ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                                          value={val}
                                          onChange={(e) => isPIC && handleWeeklyProgressChange(activePerfProject.id, index, wIdx, e.target.value)}
                                          disabled={!isPIC}
                                          min="0" max="100"
                                        />
                                      </td>
                                      <td className="px-2 py-3 text-right text-slate-500 tabular-nums border border-slate-100">
                                        {weekNilai > 0 ? new Intl.NumberFormat('id-ID').format(weekNilai) : '-'}
                                      </td>
                                    </React.Fragment>
                                  );
                                })}
                                <td className="px-2 py-3 text-center font-black text-blue-600 bg-blue-50/50 border border-slate-100">
                                  {totalProgBobot.toFixed(2)}%
                                </td>
                                <td className="px-2 py-3 text-right font-black text-blue-600 bg-blue-50/50 border border-slate-100 tabular-nums">
                                  {totalProgNilai > 0 ? new Intl.NumberFormat('id-ID').format(totalProgNilai) : '-'}
                                </td>
                                <td className="px-3 py-3 text-center font-black text-orange-600 bg-orange-50/50 border border-slate-100">
                                  {finalBobot.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-50 font-black text-[#00355f] text-xs">
                            <td colSpan="3" className="px-4 py-4 text-right uppercase tracking-widest border border-slate-200">Total:</td>
                            <td className="px-4 py-4 text-right tabular-nums border border-slate-200">
                              {new Intl.NumberFormat('id-ID').format(grandTotalPrice)}
                            </td>
                            <td className="px-3 py-4 text-center border border-slate-200">100.00%</td>
                            {totalWeekNilai.map((totalW, wIdx) => (
                              <React.Fragment key={wIdx}>
                                <td className="border border-slate-200"></td>
                                <td className="px-2 py-4 text-right tabular-nums border border-slate-200">
                                  {totalW > 0 ? new Intl.NumberFormat('id-ID').format(totalW) : '-'}
                                </td>
                              </React.Fragment>
                            ))}
                            <td className="border border-slate-200"></td>
                            <td className="px-2 py-4 text-right tabular-nums border border-slate-200">
                              {new Intl.NumberFormat('id-ID').format(totalGlobalNilai)}
                            </td>
                            <td className="px-3 py-4 text-center text-red-600 text-sm border border-slate-200">
                              {totalGlobalBobot.toFixed(2)}%
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">folder_open</span>
                <p className="text-lg font-black text-slate-400 tracking-tight">No project selected</p>
                <p className="text-sm text-slate-300">Please select a project to view its performance tracking.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Financial Report Tab */}
      {activeTab === 'Financial Report' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {financialKpis.map((kpi, index) => (
              <div key={index} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined">{kpi.icon}</span>
                </div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</h3>
                <p className="text-2xl font-black text-[#00355f]">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Monthly Cash Flow Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col min-h-[350px]">
              <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest mb-6">Monthly Cash Flow</h3>
              <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-2 text-slate-300">waterfall_chart</span>
                <p className="font-bold text-sm uppercase tracking-widest">Chart Placeholder</p>
                <p className="text-xs italic mt-1">Bar/Line Chart goes here</p>
              </div>
            </div>

            {/* Expense Breakdown Chart */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col min-h-[350px]">
              <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest mb-6">Expense Breakdown</h3>
              <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-2 text-slate-300">donut_small</span>
                <p className="font-bold text-sm uppercase tracking-widest">Chart Placeholder</p>
                <p className="text-xs italic mt-1">Donut/Pie Chart goes here</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Budget vs Actual Table */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest mb-6">Budget vs Actual</h3>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actual</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {budgetVsActualData.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-700">{item.category}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.budget}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.actual}</td>
                        <td className={`px-4 py-3 text-sm font-bold ${item.status === 'Over Budget' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {item.variance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest">Recent Invoices</h3>
                <button className="text-[10px] font-black text-[#BF6604] hover:underline uppercase tracking-widest">View All</button>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentInvoices.map((inv, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-[#00355f]">{inv.id}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{inv.client}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">{inv.amount}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{inv.dueDate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase tracking-widest ${getInvoiceBadge(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Report Tab */}
      {activeTab === 'Schedule Report' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Schedule KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {scheduleKpis.map((kpi, index) => (
              <div key={index} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-6">
                <div className={`w-14 h-14 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center shrink-0`}>
                  <span className="material-symbols-outlined text-2xl">{kpi.icon}</span>
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</h3>
                  <p className="text-3xl font-black text-[#00355f]">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gantt Chart / Timeline Section */}
          <div className="bg-white rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm flex flex-col min-h-[300px]">
            <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest mb-6">Master Project Timeline</h3>
            <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 relative overflow-hidden p-6">
              <span className="material-symbols-outlined text-5xl mb-2 text-slate-300">view_timeline</span>
              <p className="font-bold text-sm uppercase tracking-widest">Gantt Chart Placeholder</p>
              <p className="text-xs italic mt-1 text-center max-w-md">Visual representation of project schedules, dependencies, and critical paths will be rendered here.</p>
              
              {/* Decorative timeline elements */}
              <div className="absolute top-8 left-10 right-10 flex flex-col gap-4 opacity-20 pointer-events-none">
                <div className="h-4 bg-blue-400 rounded-full w-1/3 ml-10"></div>
                <div className="h-4 bg-orange-400 rounded-full w-1/2 ml-32"></div>
                <div className="h-4 bg-emerald-400 rounded-full w-1/4 ml-64"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="space-y-8 flex flex-col">
              {/* Milestone Tracking Table */}
              <div className="bg-white rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm overflow-hidden flex-1">
                <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest mb-6">Milestone Tracking</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Milestone</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {milestoneData.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 font-bold text-slate-700">{item.name}</td>
                          <td className="px-4 py-4 text-xs text-slate-500">{item.dueDate}</td>
                          <td className="px-4 py-4 text-xs font-medium text-slate-600">{item.team}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase tracking-widest ${getMilestoneBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delayed Tasks Table */}
              <div className="bg-white rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm overflow-hidden flex-1">
                <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">warning</span>
                  Delayed Tasks
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Name</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Delay</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {delayedTasksData.map((item, i) => (
                        <tr key={i} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-4 py-4 font-bold text-slate-700 text-sm">{item.name}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-black text-xs">
                              {item.delay}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-slate-600">{item.assignedTo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Upcoming Tasks List */}
            <div className="bg-white rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest">Upcoming Tasks</h3>
                <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-[#00355f] hover:text-white flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
              <div className="flex-1 space-y-4">
                {upcomingTasksData.map((item, i) => (
                  <div key={i} className="p-4 border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all flex gap-4 items-center group cursor-pointer">
                    <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-700 text-sm">{item.task}</h4>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">{item.date}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500 transition-colors">chevron_right</span>
                  </div>
                ))}

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:text-[#00355f] hover:border-[#00355f] uppercase tracking-widest transition-all">
                    View Full Schedule
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Export Center Tab */}
      {activeTab === 'Export Center' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Configuration Section */}
              <div className="bg-white rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest mb-6">Report Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Project</label>
                    <select className="border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00355f] text-slate-700 bg-slate-50 w-full">
                      <option>All Projects (Portfolio Level)</option>
                      <option>Tokyo Riverside Apartment</option>
                      <option>Meruya Residence</option>
                      <option>Senayan Commercial Tower</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range</label>
                    <div className="flex items-center gap-2">
                      <input type="date" className="border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00355f] text-slate-700 bg-slate-50 w-full" />
                      <span className="text-slate-400">-</span>
                      <input type="date" className="border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00355f] text-slate-700 bg-slate-50 w-full" />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Include Report Modules</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" className="w-5 h-5 rounded text-[#00355f] focus:ring-[#00355f]" defaultChecked />
                      <span className="text-sm font-bold text-slate-700">Executive Summary</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" className="w-5 h-5 rounded text-[#00355f] focus:ring-[#00355f]" defaultChecked />
                      <span className="text-sm font-bold text-slate-700">Financial Report</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" className="w-5 h-5 rounded text-[#00355f] focus:ring-[#00355f]" defaultChecked />
                      <span className="text-sm font-bold text-slate-700">Schedule Report</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" className="w-5 h-5 rounded text-[#00355f] focus:ring-[#00355f]" defaultChecked />
                      <span className="text-sm font-bold text-slate-700">Project Performance</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Export History Table */}
              <div className="bg-white rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm overflow-hidden flex-1">
                <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest mb-6">Recent Export History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">File Name</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Generated By</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Format</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {exportHistoryData.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                              <span className="font-bold text-[#00355f] text-sm underline decoration-slate-200 underline-offset-4 hover:decoration-[#00355f]">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-slate-600">{item.generatedBy}</td>
                          <td className="px-4 py-4 text-xs text-slate-500">{item.date}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded font-black text-[10px] uppercase tracking-widest border border-slate-200">
                              {item.format}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Export Actions Sidebar */}
            <div className="flex flex-col gap-6">
              <h3 className="text-sm font-black text-[#00355f] uppercase tracking-widest pt-2">Export Options</h3>
              
              <button className="bg-white p-6 rounded-3xl border-2 border-red-100 hover:border-red-500 hover:shadow-md transition-all group text-left flex items-start gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                </div>
                <div>
                  <h4 className="font-black text-[#00355f] mb-1">Export PDF Report</h4>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">Generate a formatted, print-ready document containing charts and tables.</p>
                </div>
              </button>

              <button className="bg-white p-6 rounded-3xl border-2 border-emerald-100 hover:border-emerald-500 hover:shadow-md transition-all group text-left flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <span className="material-symbols-outlined">table_view</span>
                </div>
                <div>
                  <h4 className="font-black text-[#00355f] mb-1">Export Excel Report</h4>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">Download raw data grids and sheets for external analysis and accounting.</p>
                </div>
              </button>

              <button className="bg-[#00355f] text-white p-6 rounded-3xl hover:brightness-110 hover:shadow-lg transition-all group text-left flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <span className="material-symbols-outlined">print</span>
                </div>
                <div>
                  <h4 className="font-black mb-1">Print Report</h4>
                  <p className="text-xs text-blue-100 leading-relaxed">Send the configured report directly to your system's printer interface.</p>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
