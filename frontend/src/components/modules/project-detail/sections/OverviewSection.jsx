import { Clock, Calendar, CheckSquare, AlertTriangle, TrendingUp, Users, DollarSign, Activity } from 'lucide-react'

function InfoField({ label, value }) {
  return (
    <div>
      <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 3 }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>{value || '—'}</span>
    </div>
  )
}

function SectionCard({ title, children, action }) {
  return (
    <div className="card card-pad" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function OverviewSection({ project, clientName }) {
  const tasks      = project.tasks || []
  const invoices   = project.invoices || []
  const expenses   = project.expenses || []
  const taskCount  = tasks.length
  const done       = tasks.filter(t => t.status === 'COMPLETED').length
  const overdue    = tasks.filter(t => t.status === 'OVERDUE').length
  const pending    = tasks.filter(t => t.status === 'PENDING').length
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const totalPaid  = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0)
  const remaining  = project.budget - totalSpent
  const budgetPct  = project.budget > 0 ? Math.round((totalSpent / project.budget) * 100) : 0

  const durationDays = Math.round(
    (new Date(project.endDate) - new Date(project.startDate)) / (1000 * 3600 * 24)
  )
  const elapsed = Math.max(0, Math.round(
    (new Date() - new Date(project.startDate)) / (1000 * 3600 * 24)
  ))

  const teamList = project.teamMembers
    ? project.teamMembers.split(',').map(m => {
        const t = m.trim(); const match = t.match(/(.*?)\s*\((.*?)\)/)
        return match ? { name: match[1].trim(), role: match[2] } : { name: t, role: 'Member' }
      })
    : []

  const MILESTONES = [
    { label: 'Project Kickoff',       date: project.startDate, done: true },
    { label: 'Foundation & Permits',  date: new Date(new Date(project.startDate).getTime() + 14 * 864e5).toISOString(), done: elapsed > 14 },
    { label: 'Structure 50% Complete',date: new Date(new Date(project.startDate).getTime() + Math.round(durationDays * 0.4) * 864e5).toISOString(), done: elapsed > durationDays * 0.4 },
    { label: 'Finishing Works',       date: new Date(new Date(project.startDate).getTime() + Math.round(durationDays * 0.75) * 864e5).toISOString(), done: elapsed > durationDays * 0.75 },
    { label: 'Handover & Closeout',   date: project.endDate, done: project.status === 'COMPLETED' },
  ]

  const recentActivity = [
    ...invoices.slice(0, 2).map(i => ({
      type: 'invoice', text: `Invoice created – Rp ${i.amount.toLocaleString('id-ID')}`,
      date: i.date, color: '#3A7BFF',
    })),
    ...expenses.slice(0, 2).map(e => ({
      type: 'expense', text: `Expense logged – ${e.category} – Rp ${e.amount.toLocaleString('id-ID')}`,
      date: e.date, color: '#F59E0B',
    })),
    ...tasks.filter(t => t.status === 'COMPLETED').slice(0, 2).map(t => ({
      type: 'task', text: `Task completed – ${t.title}`,
      date: t.dueDate, color: '#10B981',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)

  const upcomingTasks = tasks
    .filter(t => t.status !== 'COMPLETED' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Row: Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Tasks',   value: taskCount, icon: CheckSquare, color: '#3A7BFF',  bg: '#E0ECFF' },
          { label: 'Completed',     value: done,      icon: CheckSquare, color: '#10B981',  bg: '#D1FAE5' },
          { label: 'Overdue',       value: overdue,   icon: AlertTriangle, color: '#EF4444', bg: '#FEE2E2' },
          { label: 'Pending',       value: pending,   icon: Clock,       color: '#F59E0B',  bg: '#FEF3C7' },
          { label: 'Team Members',  value: teamList.length, icon: Users, color: '#8B5CF6',  bg: '#EDE9FE' },
          { label: 'Days Elapsed',  value: `${elapsed}d`,   icon: Calendar, color: 'var(--text)', bg: 'var(--border)' },
        ].map(s => (
          <div key={s.label} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Project Info */}
          <SectionCard title="Project Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoField label="Project Name"  value={project.name} />
              <InfoField label="Client"        value={clientName} />
              <InfoField label="Status"        value={project.status} />
              <InfoField label="Start Date"    value={new Date(project.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <InfoField label="End Date"      value={new Date(project.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <InfoField label="Duration"      value={`${durationDays} calendar days`} />
            </div>
          </SectionCard>

          {/* Milestones */}
          <SectionCard title="Key Milestones">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {MILESTONES.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingBottom: i < MILESTONES.length - 1 ? 14 : 0 }}>
                  {/* dot + line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: m.done ? '#10B981' : 'var(--border)',
                      border: `2px solid ${m.done ? '#10B981' : 'var(--border)'}`,
                      marginTop: 2,
                    }} />
                    {i < MILESTONES.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: m.done ? '#10B981' : 'var(--border)', minHeight: 22, marginTop: 2 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < MILESTONES.length - 1 ? 0 : 0 }}>
                    <p style={{ fontSize: 13, fontWeight: m.done ? 600 : 500, color: m.done ? 'var(--text)' : 'var(--text-muted)', marginBottom: 2 }}>
                      {m.label}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Upcoming Deadlines */}
          <SectionCard title="Upcoming Deadlines">
            {upcomingTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No upcoming deadlines.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingTasks.map(t => {
                  const isOverdue = t.status === 'OVERDUE'
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 8, background: 'var(--bg)', border: `1px solid ${isOverdue ? '#FEE2E2' : 'var(--border)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={12} color={isOverdue ? '#EF4444' : 'var(--text-muted)'} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: isOverdue ? '#EF4444' : 'var(--text)' }}>{t.title}</span>
                      </div>
                      <span style={{ fontSize: 11.5, color: isOverdue ? '#EF4444' : 'var(--text-muted)', fontWeight: isOverdue ? 700 : 400 }}>
                        {new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Financial Snapshot */}
          <SectionCard title="Financial Snapshot">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Contract Budget', value: `Rp ${project.budget.toLocaleString('id-ID')}`, color: 'var(--text)' },
                { label: 'Total Spent',     value: `Rp ${totalSpent.toLocaleString('id-ID')}`,    color: '#F59E0B' },
                { label: 'Revenue (Paid)',  value: `Rp ${totalPaid.toLocaleString('id-ID')}`,     color: '#10B981' },
                { label: 'Remaining',       value: `Rp ${Math.max(remaining,0).toLocaleString('id-ID')}`, color: remaining < 0 ? '#EF4444' : '#3A7BFF' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{f.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: f.color }}>{f.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>BUDGET USED</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: budgetPct > 90 ? '#EF4444' : '#10B981' }}>{budgetPct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(budgetPct, 100)}%`, background: budgetPct > 90 ? '#EF4444' : budgetPct > 70 ? '#F59E0B' : '#10B981', borderRadius: 99 }} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Team Allocation */}
          <SectionCard title="Team Allocation">
            {teamList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No team assigned.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teamList.map((m, i) => {
                  const palettes = [['#E0ECFF','#2563EB'],['#EDE9FE','#7C3AED'],['#D1FAE5','#059669'],['#FEF3C7','#D97706'],['#FFE4E6','#E11D48']]
                  const [bg, color] = palettes[i % palettes.length]
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {m.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{m.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.role}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* Recent Activity */}
          <SectionCard title="Recent Activity">
            {recentActivity.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No recent activity.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentActivity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.4 }}>{a.text}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {a.date ? new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
