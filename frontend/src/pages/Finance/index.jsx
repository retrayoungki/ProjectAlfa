import { useState, useMemo } from 'react'
import { Plus, Download, TrendingUp, TrendingDown, DollarSign, CreditCard, Receipt, Search, Filter } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useInvoicesQuery } from '../../hooks/useFinance'
import InvoiceModal from '../../components/modules/finance/InvoiceModal'
import InvoicePreview from '../../components/modules/finance/InvoicePreview'

const chartData = [
  { month:'Jan',income:42000,expenses:28000 }, { month:'Feb',income:58000,expenses:32000 },
  { month:'Mar',income:51000,expenses:29000 }, { month:'Apr',income:67000,expenses:41000 },
  { month:'May',income:72000,expenses:38000 }, { month:'Jun',income:65000,expenses:35000 },
]

// Mock data for charts and expenses remains until backend expansion
const STATUS_CLS = { 
  PAID: 'badge-green', 
  PENDING: 'badge-amber', 
  OVERDUE: 'badge-red',
  DRAFT: 'badge-gray',
  SENT: 'badge-blue',
  CANCELLED: 'badge-navy'
}

const EXPENSES = [
  { desc:'Cloud Hosting – AWS',    category:'Infrastructure', amount:2400, date:'May 12', project:'ERP Implementation' },
  { desc:'Legal Consultation',     category:'Professional',   amount:5000, date:'May 10', project:'Annual Audit' },
  { desc:'Team Travel',            category:'Travel',         amount:1800, date:'May 8',  project:'Meridian Corp' },
  { desc:'Software Licenses',      category:'Tools',          amount:3200, date:'May 5',  project:'GST Compliance' },
  { desc:'Office Supplies',        category:'Admin',          amount:450,  date:'May 1',  project:'General' },
]


const BUDGETS = [
  { name:'Tax Filing Q3',    budget:45000,  actual:38200 },
  { name:'ERP Implementation',budget:120000,actual:58400 },
  { name:'Annual Audit',     budget:35000,  actual:33100 },
  { name:'Payroll Restructure',budget:18000,actual:12400 },
]

export default function Finance() {
  const [tab, setTab] = useState('invoices')
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [previewInvoiceId, setPreviewInvoiceId] = useState(null)
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data: rawInvoices = [], isLoading } = useInvoicesQuery()

  // Filter Logic
  const invoices = useMemo(() => {
    return rawInvoices.filter(inv => {
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchSearch = (inv.invoiceNumber || inv.id).toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (inv.client?.company || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [rawInvoices, searchQuery, statusFilter]);

  const kpis = [
    { label:'Total Revenue',  value:'Rp. 412.000', change:'+18% vs last year',   up:true,  icon:DollarSign, color:'#10B981', bg:'var(--emerald-light)' },
    { label:'Monthly Income', value:'Rp. 72.000',  change:'+21% vs last month',  up:true,  icon:TrendingUp,  color:'#3A7BFF', bg:'var(--blue-light)' },
    { label:'Total Expenses', value:'Rp. 38.000',  change:'+5% vs last month',   up:false, icon:CreditCard,  color:'#EF4444', bg:'#FEE2E2' },
    { label:'Outstanding',    value:'Rp. 41.000',  change:'3 overdue invoices',  up:false, icon:Receipt,     color:'#F59E0B', bg:'#FEF3C7' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance</h1>
          <p className="page-subtitle">Revenue, expenses & invoices</p>
        </div>
        <button onClick={() => setShowInvoiceModal(true)} className="btn btn-primary btn-sm"><Plus size={14} /> New Invoice</button>
      </div>

      {/* KPI */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div className="kpi-card" key={k.label}>
              <div className="kpi-header">
                <div>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value" style={{ marginTop: 4 }}>{k.value}</div>
                </div>
                <div className="kpi-icon" style={{ background: k.bg }}><Icon size={18} color={k.color} /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {k.up ? <TrendingUp size={12} color="#10B981" /> : <TrendingDown size={12} color="#EF4444" />}
                <span className={`kpi-change ${k.up?'up':'down'}`}>{k.change}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Budget + Chart */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card card-pad">
          <div className="section-title">Budget vs Actual</div>
          {BUDGETS.map((p, i) => {
            const pct = Math.round(p.actual / p.budget * 100)
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500 }} className="truncate">{p.name}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
                    {pct}%
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 7 }}>
                  <div className="progress-fill progress-animated"
                    style={{ width: `${pct}%`, '--target-width': `${pct}%`, background: pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#3A7BFF' }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="card card-pad">
          <div className="section-title">Income vs Expenses</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `Rp. ${v.toLocaleString('id-ID')}`} />
              <Tooltip formatter={v => `Rp. ${v.toLocaleString('id-ID')}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" name="Income" fill="#3A7BFF" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#10B981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['invoices','expenses'].map(t => (
          <button key={t} className={`tab-btn${tab===t?' active':''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'invoices' && (
        <>
          <div className="filter-bar" style={{ marginTop: 10 }}>
            <div className="search-input">
              <Search size={14} className="text-muted" />
              <input type="text" placeholder="Search invoices or clients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className="select-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 140 }}>
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          {/* Mobile invoice cards */}
          <div className="mobile-cards">
            {invoices.map(inv => (
              <div key={inv.id} className="card card-pad" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{inv.invoiceNumber || inv.id.slice(0,8)}</span>
                    <span className={`badge ${STATUS_CLS[inv.status] || 'badge-gray'}`}>{inv.status}</span>
                  </div>
                  <p style={{ fontSize: 12.5, fontWeight: 500 }} className="truncate">{inv.client?.company || 'Unknown Client'}</p>
                  <p className="text-xs text-muted">Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>Rp. {inv.totalAmount.toLocaleString('id-ID')}</p>
                  <button onClick={() => setPreviewInvoiceId(inv.id)} className="btn btn-ghost btn-sm" style={{ marginTop: 4 }}><Download size={12} /></button>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="desktop-table">
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>INVOICE</th><th>CLIENT</th><th>AMOUNT</th><th>DATE</th><th>DUE</th><th>STATUS</th><th></th></tr></thead>
                  <tbody>
                    {isLoading ? <tr><td colSpan="7" style={{ textAlign:'center', padding:20 }}>Loading...</td></tr> : 
                     invoices.length === 0 ? <tr><td colSpan="7" style={{ textAlign:'center', padding:20, color:'var(--text-muted)' }}>No invoices found.</td></tr> :
                     invoices.map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600 }}>{inv.invoiceNumber || inv.id.slice(0,8)}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{inv.client?.company || 'Unknown Client'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.client?.name}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>Rp. {inv.totalAmount.toLocaleString('id-ID')}</td>
                        <td className="text-muted">{new Date(inv.date).toLocaleDateString()}</td>
                        <td className="text-muted">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td><span className={`badge ${STATUS_CLS[inv.status] || 'badge-gray'}`}>{inv.status}</span></td>
                        <td><button onClick={() => setPreviewInvoiceId(inv.id)} className="btn btn-ghost btn-sm" title="Print / Download PDF"><Download size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'expenses' && (
        <>
          <div className="mobile-cards">
            {EXPENSES.map((e, i) => (
              <div key={i} className="card card-pad" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{e.desc}</p>
                  <p className="text-xs text-muted">{e.category} · {e.date}</p>
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, flexShrink: 0, marginLeft: 12 }}>Rp. {e.amount.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
          <div className="desktop-table">
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>DESCRIPTION</th><th>CATEGORY</th><th>PROJECT</th><th>DATE</th><th>AMOUNT</th></tr></thead>
                  <tbody>
                    {EXPENSES.map((e, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{e.desc}</td>
                        <td><span className="badge badge-gray">{e.category}</span></td>
                        <td className="text-muted">{e.project}</td>
                        <td className="text-muted">{e.date}</td>
                        <td style={{ fontWeight: 600 }}>Rp. {e.amount.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media(max-width:768px){.desktop-table{display:none}}
        @media(min-width:769px){.mobile-cards{display:none}}
      `}</style>
      
      {showInvoiceModal && <InvoiceModal onClose={() => setShowInvoiceModal(false)} />}
      {previewInvoiceId && <InvoicePreview invoiceId={previewInvoiceId} onClose={() => setPreviewInvoiceId(null)} />}
    </div>
  )
}
