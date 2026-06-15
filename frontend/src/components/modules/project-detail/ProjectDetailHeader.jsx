import { Edit, Upload, Download, MapPin, Calendar, Clock, Users, TrendingUp, DollarSign, Plus } from 'lucide-react'

const STATUS_COLORS = {
  PREPARATION: { bar: '#F59E0B', badge: 'badge-amber', label: 'Preparation' },
  DESIGN_RAB:  { bar: '#8B5CF6', badge: 'badge-blue',  label: 'Design - RAB' },
  EXECUTION:   { bar: '#3A7BFF', badge: 'badge-blue',  label: 'Execution' },
  HAND_OVER:   { bar: '#10B981', badge: 'badge-green', label: 'Hand Over' },
}

function Avatar({ name, size = 32, index = 0 }) {
  const palettes = [
    { bg: '#E0ECFF', color: '#2563EB' },
    { bg: '#EDE9FE', color: '#7C3AED' },
    { bg: '#D1FAE5', color: '#059669' },
    { bg: '#FEF3C7', color: '#D97706' },
    { bg: '#FFE4E6', color: '#E11D48' },
  ]
  const p = palettes[index % palettes.length]
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: p.bg, color: p.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700,
      border: '2px solid var(--surface)', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function StatPill({ label, value, sub, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: color || 'var(--text)' }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  )
}

export default function ProjectDetailHeader({ project, clientName }) {
  if (!project) return null

  const statusCfg = STATUS_COLORS[project.status] || STATUS_COLORS.PREPARATION

  const taskCount      = project.tasks?.length || 0
  const completedTasks = project.tasks?.filter(t => t.status === 'DONE').length || 0
  const progressPct    = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0

  const invoices    = project.invoices || []
  const expenses    = project.expenses || []
  const totalSpent  = expenses.reduce((s, e) => s + e.amount, 0)
  const totalPaid   = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0)
  const remaining   = project.budget - totalSpent
  const budgetUsedPct = project.budget > 0 ? Math.round((totalSpent / project.budget) * 100) : 0

  const startDate  = new Date(project.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const endDate    = new Date(project.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const durationDays = Math.round((new Date(project.endDate) - new Date(project.startDate)) / (1000 * 3600 * 24))

  const teamList = project.teamMembers
    ? project.teamMembers.split(',').map(m => {
        const trimmed = m.trim()
        const match = trimmed.match(/(.*?)\s*\((.*?)\)/)
        return match ? { name: match[1].trim(), role: match[2] } : { name: trimmed, role: 'Member' }
      })
    : []

  const projectCode = `PRJ-${project.id?.slice(0, 6).toUpperCase() || '000000'}`

  return (
    <div className="card" style={{
      borderRadius: 16,
      marginBottom: 20,
      overflow: 'hidden',
      border: '1px solid var(--border)',
    }}>
      {/* Coloured accent top bar */}
      <div style={{ height: 4, background: statusCfg.bar }} />

      <div style={{ padding: '20px 24px' }}>
        {/* Row 1: Title + Actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 5 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{project.name}</h1>
              <span className={`badge ${statusCfg.badge}`} style={{ fontSize: 11, padding: '3px 10px' }}>
                {statusCfg.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>
                {projectCode}
              </span>
              {clientName && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={11} /> {clientName}
                </span>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} /> Project Site
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" style={{ gap: 5, fontSize: 12 }}>
              <Download size={13} /> Export
            </button>
            <button className="btn btn-ghost btn-sm" style={{ gap: 5, fontSize: 12 }}>
              <Upload size={13} /> Upload Doc
            </button>
            <button className="btn btn-secondary btn-sm" style={{ gap: 5, fontSize: 12 }}>
              <Plus size={13} /> Add Scope
            </button>
            <button className="btn btn-primary btn-sm" style={{ gap: 5, fontSize: 12 }}>
              <Edit size={13} /> Edit Project
            </button>
          </div>
        </div>

        {/* Row 2: Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 16,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          marginBottom: 18,
        }}>
          <StatPill
            label="Start Date"
            value={startDate}
            sub={<span style={{display:'flex',alignItems:'center',gap:3}}><Calendar size={10} /> {durationDays} days</span>}
          />
          <StatPill label="End Date"    value={endDate} />
          <StatPill label="Task Progress" value={`${progressPct}%`} sub={`${completedTasks}/${taskCount} tasks`} color="var(--blue)" />
          <StatPill label="Contract Budget" value={`Rp ${(project.budget / 1e6).toFixed(0)}M`} sub={`Rp ${project.budget.toLocaleString('id-ID')}`} />
          <StatPill label="Spent" value={`Rp ${(totalSpent / 1e6).toFixed(1)}M`} sub={`${budgetUsedPct}% of budget`} color={budgetUsedPct > 90 ? '#EF4444' : budgetUsedPct > 70 ? '#F59E0B' : '#10B981'} />
          <StatPill label="Remaining" value={`Rp ${(Math.max(remaining, 0) / 1e6).toFixed(1)}M`} color={remaining < 0 ? '#EF4444' : 'var(--text)'} />
          <StatPill label="Revenue (Paid)" value={`Rp ${(totalPaid / 1e6).toFixed(1)}M`} color="#10B981" />
        </div>

        {/* Row 3: Progress Bars + Team */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'end' }}>
          {/* Progress Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Task Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)' }}>TASK COMPLETION</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--blue)' }}>{progressPct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--blue)', borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>
            {/* Budget Used */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)' }}>BUDGET UTILIZATION</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: budgetUsedPct > 90 ? '#EF4444' : budgetUsedPct > 70 ? '#F59E0B' : '#10B981' }}>
                  {budgetUsedPct}%
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(budgetUsedPct, 100)}%`,
                  background: budgetUsedPct > 90 ? '#EF4444' : budgetUsedPct > 70 ? '#F59E0B' : '#10B981',
                  borderRadius: 99, transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          </div>

          {/* Team Avatars */}
          {teamList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                Team ({teamList.length})
              </span>
              <div style={{ display: 'flex' }}>
                {teamList.slice(0, 5).map((m, i) => (
                  <div key={i} title={`${m.name} – ${m.role}`} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                    <Avatar name={m.name} size={28} index={i} />
                  </div>
                ))}
                {teamList.length > 5 && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--border)', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, marginLeft: -8,
                    border: '2px solid var(--surface)',
                  }}>
                    +{teamList.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
