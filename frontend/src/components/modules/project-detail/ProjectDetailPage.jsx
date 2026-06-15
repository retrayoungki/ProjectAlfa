import { useState } from 'react'
import {
  LayoutDashboard, Layers, CheckSquare, Activity, Package,
  DollarSign, FileText, ShieldCheck, AlertTriangle, BarChart2,
  ArrowLeft
} from 'lucide-react'
import { useProjectByIdQuery } from '../../../hooks/useProjects'
import { useClientsQuery } from '../../../hooks/useClients'
import ProjectDetailHeader from './ProjectDetailHeader'
import OverviewSection from './sections/OverviewSection'
import ScopeOfWorkSection from './sections/ScopeOfWorkSection'
import TasksSection from './sections/TasksSection'
import WorkUpdatesSection from './sections/WorkUpdatesSection'
import MaterialsSection from './sections/MaterialsSection'
import FinancialSection from './sections/FinancialSection'
import DocumentsSection from './sections/DocumentsSection'
import QCSafetySection from './sections/QCSafetySection'
import RisksSection from './sections/RisksSection'
import AnalyticsSection from './sections/AnalyticsSection'

const TABS = [
  { id: 'overview',   label: 'Overview',      Icon: LayoutDashboard },
  { id: 'scope',      label: 'Scope of Work', Icon: Layers },
  { id: 'tasks',      label: 'Tasks',         Icon: CheckSquare },
  { id: 'updates',    label: 'Work Updates',  Icon: Activity },
  { id: 'materials',  label: 'Materials',     Icon: Package },
  { id: 'financial',  label: 'Financial',     Icon: DollarSign },
  { id: 'documents',  label: 'Documents',     Icon: FileText },
  { id: 'qc',         label: 'QC & Safety',   Icon: ShieldCheck },
  { id: 'risks',      label: 'Risks & Issues',Icon: AlertTriangle },
  { id: 'analytics',  label: 'Analytics',     Icon: BarChart2 },
]

export default function ProjectDetailPage({ projectId, onBack }) {
  const [activeTab, setActiveTab] = useState('overview')
  const { data: project, isLoading, error } = useProjectByIdQuery(projectId)
  const { data: clients = [] } = useClientsQuery()

  if (isLoading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' }}>
          <div style={{ height: 120, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', opacity: 0.6 }} />
          <div style={{ height: 44, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', opacity: 0.4 }} />
          <div style={{ height: 300, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', opacity: 0.3 }} />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="card card-pad" style={{ textAlign: 'center', padding: '48px 20px' }}>
        <AlertTriangle size={32} color="#EF4444" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: '#EF4444' }}>Failed to load project.</p>
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginTop: 12 }}>
          <ArrowLeft size={14} /> Back to Projects
        </button>
      </div>
    )
  }

  const clientName = clients.find(c => c.id === project.clientId)?.company || project.clientId || 'Internal Project'

  return (
    <div>
      {/* Back Button */}
      <div style={{ marginBottom: 16 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', padding: '6px 10px' }}
        >
          <ArrowLeft size={14} /> Back to Projects
        </button>
      </div>

      {/* Summary Header */}
      <ProjectDetailHeader project={project} clientName={clientName} />

      {/* Sticky Tab Navigation */}
      <div className="pd-tab-nav">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`pd-tab-btn${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Section Content Area */}
      <div style={{ paddingTop: 24 }}>
        {activeTab === 'overview'   && <OverviewSection   project={project} clientName={clientName} />}
        {activeTab === 'scope'      && <ScopeOfWorkSection project={project} />}
        {activeTab === 'tasks'      && <TasksSection       project={project} />}
        {activeTab === 'updates'    && <WorkUpdatesSection project={project} />}
        {activeTab === 'materials'  && <MaterialsSection   project={project} />}
        {activeTab === 'financial'  && <FinancialSection   project={project} />}
        {activeTab === 'documents'  && <DocumentsSection   project={project} />}
        {activeTab === 'qc'         && <QCSafetySection    project={project} />}
        {activeTab === 'risks'      && <RisksSection       project={project} />}
        {activeTab === 'analytics'  && <AnalyticsSection   project={project} />}
      </div>

      <style>{`
        .pd-tab-nav {
          display: flex;
          gap: 2px;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          padding-bottom: 0;
          scrollbar-width: none;
          position: sticky;
          top: 0;
          background: var(--bg);
          z-index: 20;
          padding-top: 4px;
          margin: 0 -2px;
        }
        .pd-tab-nav::-webkit-scrollbar { display: none; }
        .pd-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          padding: 9px 14px;
          border: none;
          background: none;
          color: var(--text-muted);
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.18s ease;
          border-radius: 6px 6px 0 0;
        }
        .pd-tab-btn:hover:not(.active) {
          color: var(--text);
          background: var(--surface);
        }
        .pd-tab-btn.active {
          color: var(--blue);
          border-bottom-color: var(--blue);
          font-weight: 600;
          background: var(--surface);
        }
        @media (max-width: 768px) {
          .pd-tab-btn span { display: none; }
          .pd-tab-btn { padding: 10px 12px; }
        }
      `}</style>
    </div>
  )
}
