import { useState } from 'react'
import { Upload, Search, Grid, List, Download } from 'lucide-react'

const FILES = [
  { name:'Tax Returns Q3 2024.pdf',  size:'2.4 MB', type:'pdf', date:'May 12', icon:'📄' },
  { name:'ERP Architecture.docx',    size:'890 KB', type:'doc', date:'May 10', icon:'📝' },
  { name:'Audit Workpapers.xlsx',    size:'5.1 MB', type:'xls', date:'May 9',  icon:'📊' },
  { name:'Client Proposal.pdf',      size:'1.2 MB', type:'pdf', date:'May 8',  icon:'📄' },
  { name:'Financial Model.xlsx',     size:'3.8 MB', type:'xls', date:'May 7',  icon:'📊' },
  { name:'Engagement Letter.docx',   size:'340 KB', type:'doc', date:'May 5',  icon:'📝' },
  { name:'Project Charter.pdf',      size:'670 KB', type:'pdf', date:'May 3',  icon:'📄' },
  { name:'GST Compliance Report.pdf',size:'1.8 MB', type:'pdf', date:'May 1',  icon:'📄' },
  { name:'Team Org Chart.png',       size:'420 KB', type:'img', date:'Apr 28', icon:'🖼️' },
  { name:'Budget Tracker.xlsx',      size:'2.1 MB', type:'xls', date:'Apr 25', icon:'📊' },
  { name:'Meeting Notes.docx',       size:'120 KB', type:'doc', date:'Apr 22', icon:'📝' },
  { name:'Risk Register.pdf',        size:'780 KB', type:'pdf', date:'Apr 20', icon:'📄' },
]

const TYPE_BADGE = { pdf:'badge-red', doc:'badge-blue', xls:'badge-green', img:'badge-amber' }
const TYPE_LABEL = { pdf:'PDF', doc:'DOC', xls:'XLS', img:'IMG' }

export default function Documents() {
  const [view, setView] = useState('grid')
  const [search, setSearch] = useState('')
  const [dragging, setDragging] = useState(false)
  const [filter, setFilter] = useState('All')

  const filtered = FILES.filter(f =>
    (filter === 'All' || f.type === filter) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">{FILES.length} files stored</p>
        </div>
        <button className="btn btn-primary btn-sm"><Upload size={13} /> Upload</button>
      </div>

      {/* Drop zone */}
      <div
        className="drop-zone"
        style={{ marginBottom: 16, background: dragging ? 'var(--blue-light)' : '', borderColor: dragging ? 'var(--blue)' : '' }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false) }}
      >
        <Upload size={24} color={dragging ? 'var(--blue)' : 'var(--text-subtle)'} style={{ margin: '0 auto 8px', display: 'block' }} />
        <p style={{ fontWeight: 600, fontSize: 13.5, color: dragging ? 'var(--blue)' : 'var(--text-muted)' }}>
          Drag & drop files here
        </p>
        <p className="text-xs text-subtle" style={{ marginTop: 3 }}>or click Upload · Max 50MB</p>
      </div>

      {/* Toolbar */}
      <div className="filter-bar">
        <div className="search-input">
          <Search size={13} color="var(--text-subtle)" />
          <input placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {['All','pdf','doc','xls','img'].map(t => (
            <button key={t} className={`btn btn-sm ${filter===t?'btn-primary':'btn-secondary'}`} onClick={() => setFilter(t)}>
              {t === 'All' ? 'All' : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          <button className="icon-btn" onClick={() => setView('grid')} style={{ background: view==='grid'?'var(--blue-light)':'', borderColor: view==='grid'?'var(--blue)':'' }}>
            <Grid size={14} />
          </button>
          <button className="icon-btn" onClick={() => setView('list')} style={{ background: view==='list'?'var(--blue-light)':'', borderColor: view==='list'?'var(--blue)':'' }}>
            <List size={14} />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="file-grid">
          {filtered.map((f, i) => (
            <div key={i} className="file-card">
              <div className="file-icon">{f.icon}</div>
              <p className="file-name">{f.name}</p>
              <p className="file-size">{f.size}</p>
              <div style={{ marginTop: 6 }}>
                <span className={`badge ${TYPE_BADGE[f.type]}`} style={{ padding: '2px 7px', fontSize: 10 }}>{TYPE_LABEL[f.type]}</span>
              </div>
              <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: 7, justifyContent: 'center', fontSize: 11.5 }}>
                <Download size={11} /> Download
              </button>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Mobile list */}
          <div className="mobile-cards">
            {filtered.map((f, i) => (
              <div key={i} className="card card-pad" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{f.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{f.name}</p>
                  <p className="text-xs text-subtle">{f.size} · {f.date}</p>
                </div>
                <button className="btn btn-ghost btn-sm"><Download size={13} /></button>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="desktop-table">
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>NAME</th><th>TYPE</th><th>SIZE</th><th>DATE</th><th></th></tr></thead>
                  <tbody>
                    {filtered.map((f, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{f.icon}</span>
                            <span style={{ fontWeight: 500 }}>{f.name}</span>
                          </div>
                        </td>
                        <td><span className={`badge ${TYPE_BADGE[f.type]}`}>{TYPE_LABEL[f.type]}</span></td>
                        <td className="text-muted">{f.size}</td>
                        <td className="text-muted">{f.date}</td>
                        <td><button className="btn btn-ghost btn-sm"><Download size={12} /></button></td>
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
    </div>
  )
}
