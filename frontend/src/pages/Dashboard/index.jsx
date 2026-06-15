import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  FolderKanban, Activity, AlertTriangle, DollarSign,
  ArrowRight, Clock, Plus
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDashboardSummary, createProject } from '../../services/dashboardService'
import { fetchFinanceSummary } from '../../services/financeService'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/modules/dashboard/StatCard'

const revenueData = [
  { month: 'Jan', revenue: 42000, target: 50000 },
  { month: 'Feb', revenue: 58000, target: 50000 },
  { month: 'Mar', revenue: 51000, target: 52000 },
  { month: 'Apr', revenue: 67000, target: 55000 },
  { month: 'May', revenue: 72000, target: 58000 },
  { month: 'Jun', revenue: 65000, target: 60000 },
  { month: 'Jul', revenue: 88000, target: 62000 },
  { month: 'Aug', revenue: 79000, target: 65000 },
]

const statusData = [
  { name: 'On Track', value: 14, color: '#10B981' },
  { name: 'At Risk',  value: 5,  color: '#F59E0B' },
  { name: 'Overdue',  value: 3,  color: '#EF4444' },
  { name: 'Complete', value: 18, color: '#3A7BFF' },
]

const activity = [
  { text: 'Invoice #1042 marked as Paid',             time: '2 min ago',  type: 'success' },
  { text: 'New task added to Tax Filing Q3',          time: '18 min ago', type: 'info' },
  { text: 'Meridian Corp approved proposal',          time: '1 hr ago',   type: 'success' },
  { text: 'Deadline overdue: Audit Report',           time: '3 hr ago',   type: 'error' },
  { text: 'Siti assigned to Project Delta',           time: '5 hr ago',   type: 'info' },
]

const deadlines = [
  { project: 'Tax Filing Q3',     task: 'Submit returns',    date: 'May 18', status: 'overdue' },
  { project: 'Meridian Audit',    task: 'Final review',      date: 'May 20', status: 'urgent' },
  { project: 'ERP Implementation',task: 'Module testing',    date: 'May 24', status: 'normal' },
  { project: 'Client Onboarding', task: 'Document upload',   date: 'May 28', status: 'normal' },
]

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow)', fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: Rp. {p.value.toLocaleString('id-ID')}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [activeIdx, setActiveIdx] = useState(null)
  const queryClient = useQueryClient()

  // Modal and Form States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [revenue, setRevenue] = useState(0)

  const isSuperAdmin = currentUser?.role === 'ADMIN';
  const isPM = ['PROJECT_MANAGER', 'SENIOR_PROJECT_MANAGER'].includes(currentUser?.role);
  const isFinanceUser = currentUser?.role === 'FINANCE' || currentUser?.role === 'finance' || currentUser?.department === 'FINANCE' || currentUser?.department === 'finance';
  const isPermitted = isSuperAdmin || isPM || isFinanceUser;
  
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: fetchDashboardSummary,
  })

  const { data: financeSummary, isLoading: isFinanceLoading } = useQuery({
    queryKey: ['financeSummaryDashboard'],
    queryFn: () => fetchFinanceSummary(),
    enabled: !!isPermitted,
  })

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] })
      setIsModalOpen(false)
      setName('')
      setStatus('ACTIVE')
      setRevenue(0)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate({ name, status, revenue: Number(revenue) })
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, Alex.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} /> New Project
        </button>
      </div>

      {/* KPI */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div className="kpi-card" key={i} style={{ minHeight: 102, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ height: 16, width: '60%', background: 'var(--border)', borderRadius: 4, marginBottom: 8, opacity: 0.5 }} />
              <div style={{ height: 28, width: '40%', background: 'var(--border)', borderRadius: 4, opacity: 0.5 }} />
            </div>
          ))
        ) : error ? (
          <div className="card card-pad" style={{ gridColumn: 'span 4', textAlign: 'center', color: '#EF4444' }}>
            Failed to load live summary data.
          </div>
        ) : (
          <>
            <StatCard
              label="Total Projects"
              value={summary.totalProjects}
              change="+4 this month"
              up={true}
              icon={FolderKanban}
              iconColor="#3A7BFF"
              iconBg="var(--blue-light)"
            />
            <StatCard
              label="Active Projects"
              value={summary.activeProjects}
              change="+2 since last week"
              up={true}
              icon={Activity}
              iconColor="#10B981"
              iconBg="var(--emerald-light)"
            />
            <StatCard
              label="Overdue Tasks"
              value={summary.overdueTasks}
              change="+3 since last week"
              up={false}
              icon={AlertTriangle}
              iconColor="#EF4444"
              iconBg="#FEE2E2"
            />
            <StatCard
              label="Monthly Revenue"
              value={`Rp. ${summary.monthlyRevenue.toLocaleString('id-ID')}`}
              change="+21% vs last month"
              up={true}
              icon={DollarSign}
              iconColor="#8B5CF6"
              iconBg="#EDE9FE"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card card-pad">
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <div className="section-title" style={{ margin: 0 }}>Revenue Trend</div>
            <select className="select-field" style={{ width: 'auto', height: 28, fontSize: 11 }}>
              <option>This Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `Rp. ${v.toLocaleString('id-ID')}`} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3A7BFF" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="target"  name="Target"  stroke="#10B981" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-pad">
          <div className="section-title">Project Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value"
                  onMouseEnter={(_, i) => setActiveIdx(i)} onMouseLeave={() => setActiveIdx(null)}>
                  {statusData.map((e, i) => (
                    <Cell key={i} fill={e.color} opacity={activeIdx === null || activeIdx === i ? 1 : 0.45} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [v + ' projects']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {statusData.map((s, i) => (
                <div key={i} className="legend-item" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div className="legend-dot" style={{ background: s.color }} />
                    <span>{s.name}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{s.value}</span>
                </div>
              ))}
              <div className="divider" style={{ margin: '4px 0' }} />
              <div className="legend-item" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>40</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity + Deadlines */}
      <div className="grid-2">
        <div className="card card-pad">
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ margin: 0 }}>Recent Activity</div>
            <button className="btn btn-ghost btn-sm" style={{ gap: 3 }}>All <ArrowRight size={12} /></button>
          </div>
          {activity.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-dot" style={{ background: a.type === 'success' ? '#10B981' : a.type === 'error' ? '#EF4444' : '#3A7BFF' }} />
              <div>
                <p style={{ fontSize: 13 }}>{a.text}</p>
                <p className="text-xs text-subtle" style={{ marginTop: 2 }}>{a.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card card-pad">
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ margin: 0 }}>
              {isPermitted ? 'Finance Alerts' : 'Upcoming Deadlines'}
            </div>
            {isPermitted ? (
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ gap: 3 }}
                onClick={() => navigate('/finance')}
              >
                Keuangan <ArrowRight size={12} />
              </button>
            ) : (
              <button className="btn btn-ghost btn-sm" style={{ gap: 3 }}>All <ArrowRight size={12} /></button>
            )}
          </div>
          {isPermitted ? (
            isFinanceLoading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Memuat alert keuangan...
              </div>
            ) : !financeSummary?.alerts || financeSummary.alerts.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
                Semua posisi keuangan proyek aman.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {financeSummary.alerts.map((alert, i) => {
                  const isCritical = alert.severity === 'critical';
                  const alertColor = isCritical ? '#EF4444' : '#F59E0B';
                  const badgeClass = isCritical ? 'badge-red' : 'badge-amber';
                  const badgeText = alert.type === 'overdue' ? 'Overdue' : alert.type === 'retensi_ready' ? 'Retensi Cair' : 'Over Budget';
                  
                  return (
                    <div 
                      key={i} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        padding: '10px 0', 
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/finance?project_id=${alert.project_id}`)}
                    >
                      <AlertTriangle size={15} color={alertColor} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }} className="truncate">
                          {alert.project_name}
                        </p>
                        <p className="text-xs text-muted truncate" style={{ marginTop: 2 }}>
                          {alert.message}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        <span className={`badge ${badgeClass}`} style={{ padding: '2px 8px', fontSize: 9.5, fontWeight: 700 }}>
                          {badgeText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            deadlines.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <Clock size={13} color={d.status === 'overdue' ? '#EF4444' : d.status === 'urgent' ? '#F59E0B' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{d.project}</p>
                  <p className="text-xs text-muted truncate">{d.task}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: d.status === 'overdue' ? '#EF4444' : d.status === 'urgent' ? '#F59E0B' : 'var(--text-muted)' }}>{d.date}</span>
                  <span className={`badge ${d.status === 'overdue' ? 'badge-red' : d.status === 'urgent' ? 'badge-amber' : 'badge-gray'}`} style={{ padding: '1px 7px', fontSize: 10 }}>
                    {d.status === 'overdue' ? 'Overdue' : d.status === 'urgent' ? 'Urgent' : 'Normal'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
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
          <div className="card" style={{ width: 420, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', background: 'var(--surface)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Create New Project</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>Project Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter project name..."
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>Status</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none'
                  }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="AT_RISK">At Risk</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>Revenue (Rp.)</label>
                <input 
                  type="text" 
                  value={revenue === 0 ? '' : revenue.toLocaleString('id-ID')} 
                  onChange={e => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    setRevenue(rawValue ? Number(rawValue) : 0);
                  }}
                  placeholder="0"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 13 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: 13 }}
                >
                  {mutation.isPending ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
