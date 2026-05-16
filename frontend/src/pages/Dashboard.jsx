import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AddProjectModal from '../components/AddProjectModal'
import { getAllPRs, STATUS_STYLES, getProjectSpending, getSortedPRs } from '../utils/prService'
import { getAllInvoices } from '../utils/invoiceService'
import { canApprove, canViewAll, canViewAllWorkUpdates } from '../utils/rbac'
import { getWorkUpdatesByRole } from '../utils/workUpdateService'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'

// ── Sub-Components ──────────────────────────────────────────────────────────

/**
 * Vertical Bar Chart showing Budget vs Spending for each project.
 */
const FinancialOverviewChart = ({ projects, getProjectSpending, formatCurrency }) => {
  if (!projects || projects.length === 0) {
    return (
      <div className="mb-lg bg-white border border-slate-200 rounded-lg shadow-sm p-lg py-16 text-center opacity-20">
        <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
        <p className="text-xs font-bold uppercase tracking-widest">No projects to display</p>
      </div>
    )
  }

  const chartData = projects.slice(0, 8).map(p => ({
    ...p,
    spent: getProjectSpending(p.name),
    budgetNum: Number(p.budget) || 0
  }))
  
  const maxVal = Math.max(...chartData.map(d => Math.max(d.spent, d.budgetNum)), 1)

  return (
    <div className="mb-lg bg-white border border-slate-200 rounded-lg shadow-sm p-lg">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-1.5 bg-blue-50 rounded">
          <span className="material-symbols-outlined text-blue-500 text-[20px]">leaderboard</span>
        </div>
        <div>
          <h4 className="font-headline-md text-primary uppercase tracking-tight">Project Budget vs Spending</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vertical comparison of contract budget and total approved spending</p>
        </div>
      </div>

      <div className="flex items-end justify-around gap-4 h-64 border-b border-slate-100 pb-2 overflow-x-auto custom-scrollbar">
        {chartData.map(d => {
          const spentHeight = (d.spent / maxVal) * 100
          const budgetHeight = (d.budgetNum / maxVal) * 100
          const spentPercent = d.budgetNum > 0 ? (d.spent / d.budgetNum) * 100 : 0
          
          return (
            <div key={d.id} className="flex flex-col items-center flex-1 min-w-[100px] group">
              <div className="relative w-full h-48 flex items-end justify-center gap-2 mb-3 px-2">
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[9px] p-2 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-10 pointer-events-none shadow-xl border border-slate-700">
                  <p className="font-black border-b border-white/10 pb-1 mb-1 text-blue-300">{d.name}</p>
                  <p>Budget: {formatCurrency(d.budgetNum)}</p>
                  <p>Spent: {formatCurrency(d.spent)} ({spentPercent.toFixed(1)}%)</p>
                </div>

                {/* Budget Bar */}
                <div 
                  className="w-5 bg-[#00355f] rounded-t-sm transition-all duration-500 shadow-sm hover:brightness-110 cursor-help"
                  style={{ height: `${budgetHeight}%` }}
                ></div>
                
                {/* Spent Bar */}
                <div 
                  className="w-5 bg-orange-500 rounded-t-sm transition-all duration-700 delay-100 shadow-sm border border-orange-600 hover:brightness-110 cursor-help"
                  style={{ height: `${spentHeight}%` }}
                ></div>
              </div>
              
              {/* Project Label */}
              <div className="text-center overflow-hidden w-full px-1">
                <p className="text-[10px] font-black text-[#00355f] truncate uppercase tracking-tighter mb-0.5" title={d.name}>
                  {d.name}
                </p>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  <p className="text-[9px] font-bold text-slate-400">
                    {spentPercent.toFixed(0)}% Utilized
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-8 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#00355f] rounded-sm shadow-sm"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contract Budget</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-sm shadow-sm border border-orange-600"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actual Spent (Approved)</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard Component ────────────────────────────────────────────────
const Dashboard = ({ projects, setProjects, workers, currentUser }) => {
  const navigate = useNavigate()
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [invoices, setInvoices] = useState([])

  const isPrivileged = ['Director', 'Senior Project Manager'].includes(currentUser?.role)
  const canSeeWorkAnalytics = canViewAllWorkUpdates(currentUser?.role)
  const [workUpdates, setWorkUpdates] = useState([])

  // Load and refresh PR list
  const loadPRs = () => {
    let all = getAllPRs()
    
    // Filter if user is not privileged to see all
    if (currentUser && !canViewAll(currentUser.role)) {
      all = all.filter(pr => 
        pr.submittedBy === currentUser.name || 
        pr.submittedBy === currentUser.username ||
        pr.requestedBy === currentUser.name
      )
    }

    const sorted = getSortedPRs(all)
    setPurchaseRequests(sorted)
  }

  useEffect(() => {
    loadPRs()
    setInvoices(getAllInvoices())
    if (canSeeWorkAnalytics) {
      setWorkUpdates(getWorkUpdatesByRole(currentUser, projects))
    }
    const interval = setInterval(() => {
      loadPRs()
      if (canSeeWorkAnalytics) setWorkUpdates(getWorkUpdatesByRole(currentUser, projects))
    }, 5000)
    return () => clearInterval(interval)
  }, [currentUser, projects, canSeeWorkAnalytics])

  const handleDeleteProject = (id) => {
    if (window.confirm('Hapus project ini dari semua dashboard?')) {
      setProjects(projects.filter(p => p.id !== id))
    }
  }

  const handleProjectUpdated = (updatedData) => {
    setProjects(projects.map(p => {
      if (p.id === updatedData.id) {
        return {
          ...p,
          name: updatedData.projectName,
          client: updatedData.clientId,
          projectType: updatedData.projectType,
          address: updatedData.address || '',
          startDate: updatedData.startDate,
          endDate: updatedData.endDate,
          budget: updatedData.budget,
          billingType: updatedData.billingType,
          projectManager: updatedData.projectManagerId,
          milestones: updatedData.milestones || []
        }
      }
      return p
    }))
    setEditProject(null)
  }

  const handleProjectAdded = (newProject) => {
    if (!newProject) return;
    const projectFormatted = {
      id: projects && projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
      name: newProject.projectName,
      code: newProject.code || '',
      status: 'On Track',
      progress: 0,
      budget: newProject.budget || '0',
      client: newProject.clientId,
      projectType: newProject.projectType || 'Construction',
      billingType: newProject.billingType || 'Fixed',
      projectManager: newProject.projectManagerId || 'Unassigned',
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      icon: 'apartment',
      color: 'blue',
      milestones: newProject.milestones || []
    }
    setProjects(prev => [projectFormatted, ...(prev || [])]);
    setIsAddProjectOpen(false);
  }

  const handlePRClick = (pr) => {
    navigate(`/pr-detail/${pr.refNo}`)
  }

  const formatCurrency = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`

  const parseAmount = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(val.toString().replace(/[^0-9.-]+/g, "")) || 0;
  };

  const totalActiveProjects = projects.length;
  const totalProjectAmount = projects.reduce((acc, p) => acc + parseAmount(p.budget), 0);
  const totalSpending = purchaseRequests
    .filter(pr => pr.status === 'Paid' || pr.status === 'Fully Approved')
    .reduce((acc, pr) => acc + (pr.total || 0), 0);
  
  const totalPaidByClients = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((acc, inv) => acc + (inv.amount || 0), 0);
  
  const outstandingBalance = totalProjectAmount - totalPaidByClients;

  const pendingCount = purchaseRequests.filter(pr =>
    pr.status === 'Pending Approval' || pr.status === 'Approved (SPM)'
  ).length

  // Robust Milestone Detection: Project Array + Schedule LocalStorage Fallback
  const upcomingMilestones = useMemo(() => {
    const all = [];
    if (!projects || projects.length === 0) return [];

    projects.forEach(p => {
      // 1. Check Project Milestones (Array of Objects)
      const ms = p.milestones || p.milestone;
      if (Array.isArray(ms) && ms.length > 0) {
        ms.forEach(m => {
          all.push({
            name: m.name || m.label || m.title || 'Unnamed Milestone',
            date: m.date || m.dueDate || m.deadline || '',
            type: m.type || 'Project',
            projectName: p.name
          });
        });
      }

      // 2. Fallback: Scan Schedule tasks for THIS project
      try {
        const savedTasks = localStorage.getItem(`alfa_tasks_${p.id}`);
        if (savedTasks) {
          const tasks = JSON.parse(savedTasks);
          // Only pull if there's a reason to (either has "milestone" in name or if we have 0 project milestones)
          const hasProjectMs = Array.isArray(ms) && ms.length > 0;
          
          tasks.forEach(t => {
            const isNamedMilestone = t.name && t.name.toLowerCase().includes('milestone');
            // If it's explicitly named Milestone, or if we have no milestones and it's a major task (duration > 0)
            if (t.type === 'item' && (isNamedMilestone || (!hasProjectMs && t.duration > 0))) {
              all.push({
                name: t.name,
                date: t.startDate,
                type: isNamedMilestone ? 'Schedule Milestone' : 'Schedule Task',
                projectName: p.name
              });
            }
          });
        }
      } catch (e) {
        console.error("Error scanning schedule for dashboard:", e);
      }
    });

    return all.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB;
    }).slice(0, 10); // Show up to 10
  }, [projects]);

  return (
    <main className="flex-1 p-6 lg:p-gutter max-w-[1440px] mx-auto w-full">
      {/* Dashboard Hero Section */}
      <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-primary mb-1 tracking-tight">Portfolio Overview</h2>
          <p className="font-body-lg font-bold text-slate-700">Real-time logistics and performance metrics for active work sites.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddProjectOpen(true)}
            className="px-4 py-2 bg-primary text-white font-label-bold flex items-center gap-2 rounded hover:brightness-110 active:translate-y-px transition-all shadow-md border-b-2 border-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add New Project
          </button>
          <button className="px-4 py-2 bg-white border border-outline-variant text-primary font-label-bold flex items-center gap-2 rounded hover:bg-slate-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Data
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-lg">
        {/* Total Active Projects */}
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-primary-container/10 rounded-full mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">apartment</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Total Active Project</p>
          <h3 className="font-headline-xl font-black text-primary tabular-nums leading-none">{totalActiveProjects}</h3>
          <span className="mt-4 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">+2 this month</span>
        </div>

        {/* Total Project Amount */}
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-emerald-50 rounded-full mb-4">
            <span className="material-symbols-outlined text-emerald-600 text-3xl">payments</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Total Project Amount</p>
          <h3 className="font-headline-lg font-black text-primary tabular-nums leading-none truncate w-full" title={formatCurrency(totalProjectAmount)}>
            {formatCurrency(totalProjectAmount)}
          </h3>
          <span className="mt-4 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Contract Value</span>
        </div>

        {/* Total Spending Project */}
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-orange-50 rounded-full mb-4">
            <span className="material-symbols-outlined text-orange-500 text-3xl">shopping_cart_checkout</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Total Spending Project</p>
          <h3 className="font-headline-lg font-black text-primary tabular-nums leading-none truncate w-full" title={formatCurrency(totalSpending)}>
            {formatCurrency(totalSpending)}
          </h3>
          <span className="mt-4 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Approved Spending</span>
        </div>

        {/* Remaining Revenue */}
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-red-50 rounded-full mb-4">
            <span className="material-symbols-outlined text-red-500 text-3xl">pending_actions</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Remaining Revenue</p>
          <h3 className="font-headline-lg font-black text-red-600 tabular-nums leading-none truncate w-full" title={formatCurrency(outstandingBalance)}>
            {formatCurrency(outstandingBalance)}
          </h3>
          <span className="mt-4 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Unpaid by Clients</span>
        </div>
      </div>

      {/* Project Table + Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-lg">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="px-lg py-md border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-headline-md text-primary">Current Projects</h4>
            <button className="text-sm font-label-bold text-primary-container hover:underline">View All Projects</button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Project Name</th>
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Progress</th>
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider text-right">Budget</th>
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((project) => (
                  <tr key={project.id} className="zebra-stripe hover:bg-slate-50 transition-colors">
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded bg-${project.color}-100 flex items-center justify-center text-${project.color}-700`}>
                          <span className="material-symbols-outlined text-[20px]">{project.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{project.name}</span>
                          {project.code && <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">{project.code}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-${project.color}-50 text-${project.color}-700`}>
                        <span className={`w-1.5 h-1.5 rounded-full bg-${project.color === 'blue' ? 'blue-600' : project.color === 'orange' ? 'orange-500' : 'red-600'} mr-2`}></span>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-lg py-4 min-w-[140px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className={`${project.status === 'Delayed' ? 'hazard-fill' : `bg-${project.color === 'blue' ? 'blue-600' : 'orange-500'}`} h-full`} style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700 tabular-nums">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-lg py-4 text-right font-medium text-slate-900 tabular-nums">
                      Rp {Number(project.budget).toLocaleString('id-ID')}
                    </td>
                    <td className="px-lg py-4 text-right">
                      {isPrivileged ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditProject(project)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit Project">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteProject(project.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Project">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-slate-300" title="Hanya Director / Senior PM yang dapat mengedit">
                          <span className="material-symbols-outlined text-[15px]">lock</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
          <div className="px-lg py-md border-b border-slate-200">
            <h4 className="font-headline-md text-primary">Upcoming Milestones</h4>
          </div>
          <div className="p-lg space-y-6 flex-1 overflow-y-auto custom-scrollbar min-h-[300px]">
            {upcomingMilestones.map((milestone, idx, arr) => (
              <div key={idx} className={`relative pl-8 ${idx === arr.length - 1 ? 'pb-4' : ''}`}>
                {idx !== arr.length - 1 && <div className="absolute left-[3px] top-0 bottom-[-24px] w-[2px] bg-slate-100"></div>}
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-primary-container/20"></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    {milestone.date ? milestone.date.split('-').reverse().join('/') : 'No Date'}
                  </p>
                  <h5 className="text-sm font-bold text-slate-900 mb-1">{milestone.name}</h5>
                  <p className="text-xs text-outline mb-2">{milestone.projectName}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    milestone.type.includes('Schedule') ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {milestone.type}
                  </span>
                </div>
              </div>
            ))}
            {upcomingMilestones.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">event_busy</span>
                <p className="text-sm font-bold text-slate-500">No upcoming milestones</p>
                <p className="text-xs text-slate-400 mt-1">Add milestones in project settings or create tasks in the schedule.</p>
              </div>
            )}
          </div>
          <div className="p-lg bg-slate-50 border-t border-slate-200">
            <button className="w-full text-center text-sm font-bold text-primary hover:text-primary-container flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">event_note</span>
              Full Project Calendar
            </button>
          </div>
        </div>
      </div>

      {/* ── Team Work Progress (Analytics) ─────────────────────────────────── */}
      {canSeeWorkAnalytics && (
        <div className="mb-lg bg-white border border-slate-200 rounded-lg shadow-sm p-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-1.5 bg-purple-50 rounded">
              <span className="material-symbols-outlined text-purple-600 text-[20px]">insights</span>
            </div>
            <div>
              <h4 className="font-headline-md text-primary uppercase tracking-tight">Team Work Progress</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time team productivity and task distribution</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Progress by Employee Chart */}
              <div className="h-64 border border-slate-100 rounded-lg p-4">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Avg Progress by Employee</h5>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={
                    [...new Set(workUpdates.map(u => u.userName))].map(emp => {
                      const empUpdates = workUpdates.filter(u => u.userName === emp);
                      const avg = Math.round(empUpdates.reduce((acc, u) => acc + (Number(u.progress) || 0), 0) / (empUpdates.length || 1));
                      const safeName = emp ? String(emp).split(' ')[0] : 'Unknown';
                      return { name: safeName, progress: avg };
                    })
                  }>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="progress" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Task Status Pie Chart */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="h-48 border border-slate-100 rounded-lg p-4 flex flex-col items-center">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 w-full text-left">Task Status</h5>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Completed', value: workUpdates.filter(u => u.status === 'Completed').length, color: '#10b981' },
                            { name: 'In Progress', value: workUpdates.filter(u => u.status === 'In Progress').length, color: '#3b82f6' },
                            { name: 'Pending', value: workUpdates.filter(u => u.status === 'Pending').length, color: '#f59e0b' },
                            { name: 'Not Started', value: workUpdates.filter(u => u.status === 'Not Started').length, color: '#94a3b8' }
                          ].filter(d => d.value > 0)}
                          cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value"
                        >
                          {
                            [
                              { name: 'Completed', value: workUpdates.filter(u => u.status === 'Completed').length, color: '#10b981' },
                              { name: 'In Progress', value: workUpdates.filter(u => u.status === 'In Progress').length, color: '#3b82f6' },
                              { name: 'Pending', value: workUpdates.filter(u => u.status === 'Pending').length, color: '#f59e0b' },
                              { name: 'Not Started', value: workUpdates.filter(u => u.status === 'Not Started').length, color: '#94a3b8' }
                            ].filter(d => d.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="flex flex-col justify-center space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                      <span className="text-xs font-bold text-slate-600">Total Updates</span>
                      <span className="text-sm font-black text-primary">{workUpdates.length}</span>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-50 p-2 rounded">
                      <span className="text-xs font-bold text-emerald-700">Completed</span>
                      <span className="text-sm font-black text-emerald-700">{workUpdates.filter(u => u.status === 'Completed').length}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Recent Work Updates Feed */}
            <div className="border border-slate-100 rounded-lg flex flex-col h-[424px]">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Recent Feed</h5>
                <button onClick={() => navigate('/work-updates')} className="text-[10px] text-primary hover:underline font-bold">View All</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {workUpdates.length === 0 ? (
                   <p className="text-xs text-slate-400 text-center mt-10">No recent updates.</p>
                ) : (
                  workUpdates.sort((a,b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).slice(0, 5).map(u => (
                    <div key={u.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-blue-700">
                        {(u.userName || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs text-slate-900"><span className="font-bold">{u.userName}</span> updated <span className="font-bold">{u.taskTitle}</span></p>
                        <p className="text-[10px] text-slate-500 mb-1">{u.projectName}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{width: `${u.progress}%`}}></div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-600">{u.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <FinancialOverviewChart 
        projects={projects} 
        getProjectSpending={getProjectSpending} 
        formatCurrency={formatCurrency} 
      />

      {/* ── Purchase Request Status Section ─────────────────────────────────── */}
      <div className="mb-lg bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-lg py-md border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-50 rounded">
              <span className="material-symbols-outlined text-amber-500 text-[20px]">receipt_long</span>
            </div>
            <div>
              <h4 className="font-headline-md text-primary">Purchase Request Status</h4>
              {isPrivileged && pendingCount > 0 && (
                <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">
                  {pendingCount} PR Menunggu Approval Lengkap
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/forms/purchase-request')}
            className="px-4 py-2 bg-primary text-white font-label-bold flex items-center gap-2 rounded hover:brightness-110 active:translate-y-px transition-all shadow-sm text-xs uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Buat PR Baru
          </button>
        </div>

        {purchaseRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <span className="material-symbols-outlined text-slate-200 text-5xl">receipt_long</span>
            <p className="text-sm font-black text-slate-400">Belum ada Purchase Request</p>
            <p className="text-xs text-slate-300 font-medium">Buat PR pertama kamu melalui menu Forms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Ref No</th>
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Diajukan Oleh</th>
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseRequests.slice(0, 10).map((pr) => {
                  const statusStyle = STATUS_STYLES[pr.status] || 'bg-slate-100 text-slate-500 border-slate-200'
                  const isActionable = canApprove(currentUser?.role) &&
                    (pr.status === 'Pending Approval' || pr.status === 'Approved (SPM)')
                  return (
                    <tr
                      key={pr.refNo}
                      onClick={() => handlePRClick(pr)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-lg py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-primary">{pr.refNo}</span>
                          {pr.priorityStatus === 'Priority' && pr.status !== 'Paid' && (
                            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-0.5">Priority</span>
                          )}
                        </div>
                      </td>
                      <td className="px-lg py-3">
                        <span className="text-sm font-bold text-slate-900">{pr.vendor || '—'}</span>
                      </td>
                      <td className="px-lg py-3">
                        <span className="text-xs font-black text-primary">{pr.project || '—'}</span>
                      </td>
                      <td className="px-lg py-3">
                        <span className="text-xs text-slate-500 font-medium">{pr.submittedBy || pr.requestedBy || '—'}</span>
                      </td>
                      <td className="px-lg py-3 text-right">
                        <span className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(pr.total)}</span>
                      </td>
                      <td className="px-lg py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${statusStyle}`}>
                          {pr.status}
                        </span>
                      </td>
                      <td className="px-lg py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/pr-detail/${pr.refNo}`); }}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                              isActionable ? 'bg-primary text-white hover:brightness-110' : 'text-slate-400 hover:text-slate-600 bg-slate-100'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">{isActionable ? 'how_to_vote' : 'open_in_new'}</span>
                            {isActionable ? 'Review' : 'Detail'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/forms/purchase-request/${pr.refNo}#print`); }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-white rounded-full text-[10px] font-black hover:bg-slate-700 transition-all"
                          >
                            <span className="material-symbols-outlined text-[12px]">print</span>
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {purchaseRequests.length > 10 && (
              <div className="px-lg py-3 bg-slate-50 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-400 font-bold">
                  Menampilkan 10 dari {purchaseRequests.length} PR. <button className="text-primary hover:underline" onClick={() => navigate('/forms')}>Lihat semua →</button>
                </p>
              </div>
            )}
          </div>
        )}
      </div>


      <AddProjectModal 
        isOpen={isAddProjectOpen} 
        onClose={() => setIsAddProjectOpen(false)} 
        onProjectAdded={handleProjectAdded}
        workers={workers}
      />

      {editProject && (
        <AddProjectModal
          isOpen={!!editProject}
          onClose={() => setEditProject(null)}
          onProjectAdded={handleProjectUpdated}
          onProjectUpdated={handleProjectUpdated}
          initialData={editProject}
          workers={workers}
        />
      )}
    </main>
  )
}

export default Dashboard
