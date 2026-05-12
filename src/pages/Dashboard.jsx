import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddProjectModal from '../components/AddProjectModal'
import { getAllPRs, STATUS_STYLES } from '../utils/prService'
import { canApprove, canViewAll } from '../utils/rbac'

const Dashboard = ({ projects, setProjects, workers, currentUser }) => {
  const navigate = useNavigate()
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [purchaseRequests, setPurchaseRequests] = useState([])

  const isPrivileged = ['Director', 'Senior Project Manager'].includes(currentUser?.role)

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

    const sorted = [...all].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    setPurchaseRequests(sorted)
  }

  useEffect(() => {
    loadPRs()
    const interval = setInterval(loadPRs, 5000)
    return () => clearInterval(interval)
  }, [])

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

  const pendingCount = purchaseRequests.filter(pr =>
    pr.status === 'Pending Approval' || pr.status === 'Approved (SPM)'
  ).length

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
        {/* Total Projects Card */}
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-primary-container/10 rounded-full mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">apartment</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Total Active Projects</p>
          <h3 className="font-headline-xl font-black text-primary tabular-nums leading-none">{projects.length}</h3>
          <span className="mt-4 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">+2 this month</span>
        </div>

        {/* Budget Utilization Card */}
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-secondary/10 rounded-full mb-4">
            <span className="material-symbols-outlined text-secondary text-3xl">account_balance_wallet</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Budget Utilization</p>
          <h3 className="font-headline-xl font-black text-primary tabular-nums leading-none">68.4%</h3>
          <div className="w-full max-w-[120px] bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
            <div className="bg-secondary h-full" style={{ width: '68.4%' }}></div>
          </div>
          <span className="mt-3 text-[10px] font-bold text-secondary bg-secondary-fixed px-2 py-0.5 rounded-full uppercase">On Budget</span>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-tertiary-container/10 rounded-full mb-4">
            <span className="material-symbols-outlined text-tertiary text-3xl">trending_up</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Overall Progress</p>
          <h3 className="font-headline-xl font-black text-primary tabular-nums leading-none">72%</h3>
          <div className="w-full max-w-[120px] bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
            <div className="bg-primary h-full" style={{ width: '72%' }}></div>
          </div>
          <span className="mt-3 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">+4.2% Week</span>
        </div>

        {/* PR Pending Card */}
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-amber-50 rounded-full mb-4">
            <span className="material-symbols-outlined text-amber-500 text-3xl">receipt_long</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Purchase Requests</p>
          <h3 className="font-headline-xl font-black text-primary tabular-nums leading-none">{purchaseRequests.length}</h3>
          {pendingCount > 0 && (
            <span className="mt-4 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full animate-pulse">{pendingCount} awaiting</span>
          )}
        </div>
      </div>

      {/* Project Table + Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-lg">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="px-lg py-md border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-headline-md text-primary">Current Projects</h4>
            <button className="text-sm font-label-bold text-primary-container hover:underline">View All Projects</button>
          </div>
          <div className="overflow-x-auto">
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
          <div className="p-lg space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            {projects.flatMap(p => 
              (p.milestones || []).map(m => ({ ...m, projectName: p.name }))
            ).sort((a, b) => new Date(a.date) - new Date(b.date))
             .slice(0, 5)
             .map((milestone, idx, arr) => (
              <div key={idx} className={`relative pl-8 ${idx === arr.length - 1 ? 'pb-4' : ''}`}>
                {idx !== arr.length - 1 && <div className="absolute left-[3px] top-0 bottom-[-24px] w-[2px] bg-slate-100"></div>}
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-primary-container/20"></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{milestone.date.split('-').reverse().join('/')}</p>
                  <h5 className="text-sm font-bold text-slate-900 mb-1">{milestone.name}</h5>
                  <p className="text-xs text-outline mb-2">{milestone.projectName}</p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded">{milestone.type || 'General'}</span>
                </div>
              </div>
            ))}
            {projects.flatMap(p => p.milestones || []).length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">event_busy</span>
                <p className="text-sm font-bold text-slate-500">No upcoming milestones</p>
                <p className="text-xs text-slate-400 mt-1">Add milestones when creating or editing projects.</p>
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
                        <span className="text-xs font-black text-primary">{pr.refNo}</span>
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

      {/* Site Map Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="md:col-span-2 relative h-64 bg-slate-200 rounded-lg overflow-hidden border border-slate-200 group">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCvl1I8AmfOqxTa9SG3KhI0TqUuNk7orexmYBWsOHdYGbgKK5j9YDr7CFm_p2MhvkNhXZH5Xzy6NQSt2ZBXJ_D1MiqZuoITsIkFOdX7FUEk1ZxLQtcSrsuBiLCnkIAAQzQsBjA6cXhs8LRAAQTUlt6SAmA3qlSh0M1X2cPX546jQqyx-eZL0ET08chqb5B8dSOND4G0oWp36dny2kjVjopoM-_sr1KbHmq4j8baEjC1XA5oioPuQk5gezujAd46D8EnhvHlIbyLoRw')" }}></div>
          <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors"></div>
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded shadow-lg">
            <p className="text-xs font-black text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              LIVE SITE MAP: DOWNTOWN DISTRICT
            </p>
          </div>
          <button className="absolute bottom-4 right-4 bg-primary text-white p-2 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all">
            <span className="material-symbols-outlined">open_in_full</span>
          </button>
        </div>
        <div className="bg-tertiary p-lg rounded-lg shadow-sm text-white flex flex-col justify-between">
          <div>
            <h4 className="font-headline-md mb-2">Weather Alert</h4>
            <p className="text-blue-100 text-sm mb-4">High winds expected tomorrow (24/10) at Riverside Heights. Crane operations may be suspended.</p>
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-blue-200">Temp</span>
                <span className="text-lg font-bold">14°C</span>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-blue-200">Wind</span>
                <span className="text-lg font-bold">32 km/h</span>
              </div>
            </div>
          </div>
          <button className="mt-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-sm font-bold transition-colors">
            Safety Protocols
          </button>
        </div>
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
