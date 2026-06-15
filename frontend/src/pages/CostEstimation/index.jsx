import React, { useState } from 'react';
import {
  Calculator, FolderOpen, FileDown, History, Save, Plus, Trash2,
  Edit3, Check, X, TrendingUp, DollarSign, Receipt, Layers, AlertCircle,
  MoreVertical, ChevronRight,
} from 'lucide-react';
import { useCostEstimation } from './useCostEstimation';
import WorkItemModal from './WorkItemModal';
import HistoryModal  from './HistoryModal';
import { useProjectsQuery } from '../../hooks/useProjects';

/* ─── tiny helpers ──────────────────────────────────────────── */
const rp = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const STATUS_CLS = {
  Draft: 'badge-gray', Saved: 'badge-green',
  Approved: 'badge-blue', Revision: 'badge-amber',
};

const TOAST_DURATION = 2500;

/* ─── Toast ─────────────────────────────────────────────────── */
function Toast({ msg, onDone }) {
  React.useEffect(() => { const t = setTimeout(onDone, TOAST_DURATION); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, background: 'var(--navy)', color: '#fff',
      padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, zIndex: 2000,
      boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeInUp .25s ease',
    }}>
      <Check size={15} color="#10B981" /> {msg}
    </div>
  );
}

/* ─── Inline editable scope name ───────────────────────────── */
function EditableName({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  if (!editing) return (
    <span onDoubleClick={() => { setDraft(value); setEditing(true); }} style={{ cursor: 'text' }} title="Double-click to rename">
      {value}
    </span>
  );
  return (
    <input
      autoFocus style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--blue)', outline: 'none', fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', width: '100%' }}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { onSave(draft); setEditing(false); }}
      onKeyDown={e => { if (e.key === 'Enter') { onSave(draft); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function CostEstimation() {
  const {
    scopes, activeScope, activeScopeId, setActiveScopeId,
    addScope, deleteScope, renameScope,
    addItem, updateItem, deleteItem,
    profitRate, setProfitRate,
    vatRate,    setVatRate,
    revisionStatus, revisionHistory, saveRevision,
    calculations, getScopeSubtotal,
  } = useCostEstimation();

  const { data: projects = [] } = useProjectsQuery();

  const [selectedProject, setSelectedProject] = useState('');
  const [modalItem, setModalItem]   = useState(null);   // null | item object
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast]           = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, id, label }

  const notify = (msg) => setToast(msg);

  /* handlers */
  const handleAddItem = () => {
    const newId = addItem(activeScopeId);
    // open modal for the brand-new empty item
    const empty = { id: newId, description: '', qty: 1, unit: 'm²', materialCost: 0, laborCost: 0, equipmentCost: 0, materials: [], labors: [], equipments: [], notes: '' };
    setModalItem(empty);
  };

  const handleSaveItem = (item) => {
    updateItem(activeScopeId, item.id, item);
    setModalItem(null);
    notify('Work item saved!');
  };

  const handleDeleteScope = (scopeId, name) => {
    setConfirmDelete({ type: 'scope', id: scopeId, label: name });
  };

  const handleDeleteItem = (itemId, desc) => {
    setConfirmDelete({ type: 'item', id: itemId, label: desc });
  };

  const confirmAction = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'scope') deleteScope(confirmDelete.id);
    if (confirmDelete.type === 'item')  deleteItem(activeScopeId, confirmDelete.id);
    setConfirmDelete(null);
    notify('Deleted successfully.');
  };

  const handleSaveRevision = () => {
    saveRevision();
    notify('Revision saved!');
  };

  /* ─── Derived ─────────────────────────────────────────────── */
  const { totalCost, profitAmt, vatAmt, nettTotal } = calculations;

  // Project Budget Integration
  const activeProject = projects.find(p => p.id === selectedProject);
  const projectBudget = activeProject?.budget || 0;
  const isOverBudget = projectBudget > 0 && nettTotal > projectBudget;

  /* ─── Styles ──────────────────────────────────────────────── */
  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' };
  const rateInp   = { width: 56, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'center', outline: 'none' };
  const thStyle   = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--bg)', whiteSpace: 'nowrap' };
  const tdStyle   = { padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 13, verticalAlign: 'middle' };

  /* ─── Render ──────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Calculator size={20} color="var(--blue)" />
            <h1 className="page-title" style={{ margin: 0 }}>Cost Estimation Engine</h1>
            <span className={`badge ${STATUS_CLS[revisionStatus] || 'badge-gray'}`}>{revisionStatus}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpen size={14} color="var(--text-muted)" />
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              style={{ fontSize: 13, color: 'var(--text)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', outline: 'none' }}
            >
              <option value="">— Select Project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => notify('AHSP templates loaded!')} title="Load AHSP Price Database">
            <Layers size={14} /> Load AHSP
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => notify('Import feature coming soon')} title="Import from Excel / BOQ">
            <FileDown size={14} /> Import Excel
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => notify('PDF export coming soon')} title="Export to PDF">
            <FileDown size={14} /> Export PDF
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowHistory(true)}>
            <History size={14} /> History
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSaveRevision}>
            <Save size={14} /> Save Revision
          </button>
        </div>
      </div>

      {/* ── SUMMARY CARDS ─────────────────────────────────────── */}
      <div className="kpi-grid">
        {/* Total Cost */}
        <div className="kpi-card">
          <div className="kpi-header">
            <div>
              <div className="kpi-label">Total Direct Cost</div>
              <div className="kpi-value" style={{ fontSize: 18, marginTop: 4 }}>{rp(totalCost)}</div>
            </div>
            <div className="kpi-icon" style={{ background: 'var(--blue-light)' }}><DollarSign size={18} color="var(--blue)" /></div>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{scopes.length} scopes · {scopes.reduce((a, s) => a + s.items.length, 0)} items</div>
        </div>

        {/* Profit Margin */}
        <div className="kpi-card">
          <div className="kpi-header">
            <div>
              <div className="kpi-label">Profit Margin</div>
              <div className="kpi-value" style={{ fontSize: 18, marginTop: 4 }}>{rp(profitAmt)}</div>
            </div>
            <div className="kpi-icon" style={{ background: 'var(--emerald-light)' }}><TrendingUp size={18} color="var(--emerald)" /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <input type="number" min="0" max="100" style={rateInp} value={profitRate} onChange={e => setProfitRate(Number(e.target.value))} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>% of total cost</span>
          </div>
        </div>

        {/* VAT / PPN */}
        <div className="kpi-card">
          <div className="kpi-header">
            <div>
              <div className="kpi-label">VAT / PPN</div>
              <div className="kpi-value" style={{ fontSize: 18, marginTop: 4 }}>{rp(vatAmt)}</div>
            </div>
            <div className="kpi-icon" style={{ background: '#FEF3C7' }}><Receipt size={18} color="var(--amber)" /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <input type="number" min="0" max="100" style={rateInp} value={vatRate} onChange={e => setVatRate(Number(e.target.value))} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>% (after profit)</span>
          </div>
        </div>

        {/* Nett Total */}
        <div className="kpi-card" style={{ background: isOverBudget ? '#7F1D1D' : 'var(--navy)', borderColor: isOverBudget ? '#EF4444' : 'transparent', transition: 'all .3s' }}>
          <div className="kpi-header">
            <div>
              <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Grand Total (Nett) {isOverBudget && <span style={{ color: '#FCA5A5', marginLeft: 8, fontSize: 11, fontWeight: 700 }}>⚠️ OVER BUDGET</span>}
              </div>
              <div className="kpi-value" style={{ fontSize: 18, marginTop: 4, color: isOverBudget ? '#FECACA' : '#fff' }}>{rp(nettTotal)}</div>
            </div>
            <div className="kpi-icon" style={{ background: isOverBudget ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)' }}>
              {isOverBudget ? <AlertCircle size={18} color="#FCA5A5" /> : <Calculator size={18} color="white" />}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: isOverBudget ? 'rgba(254,202,202,0.8)' : 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            {projectBudget > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Budget: {rp(projectBudget)}</span>
                <span>{((nettTotal / projectBudget) * 100).toFixed(1)}% used</span>
              </div>
            ) : (
              `Including ${vatRate}% PPN + ${profitRate}% margin`
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT: WBS + TABLE ─────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0, alignItems: 'flex-start' }}>

        {/* LEFT: Work Breakdown Structure */}
        <div style={{ ...cardStyle, width: 240, flexShrink: 0, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Work Breakdown</span>
            <button onClick={addScope} className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }}>
              <Plus size={12} /> Scope
            </button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 400px)', padding: '16px' }}>
            {scopes.map(scope => {
              const subtotal = getScopeSubtotal(scope);
              const isActive = scope.id === activeScopeId;
              return (
                <div
                  key={scope.id}
                  onClick={() => setActiveScopeId(scope.id)}
                  style={{
                    padding: '14px 16px', cursor: 'pointer',
                    background: isActive ? '#925407' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#334155',
                    marginBottom: 8,
                    borderRadius: 4,
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{scope.code}</span>
                        <EditableName value={scope.name} onSave={name => renameScope(scope.id, name)} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'rgba(255,255,255,0.8)' : '#94A3B8', marginTop: 8 }}>
                        {rp(subtotal)}
                      </div>
                    </div>
                    <div style={{
                      background: isActive ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                      color: isActive ? '#FFF' : '#475569',
                      fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      marginLeft: 12,
                    }}>
                      {scope.items.length}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Estimation Detail Table */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeScope ? (
            <>
              {/* Scope Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{activeScope.code} — {activeScope.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {activeScope.items.length} items · Scope Subtotal: <strong>{rp(getScopeSubtotal(activeScope))}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => handleDeleteScope(activeScope.id, activeScope.name)} 
                    className="btn btn-secondary btn-sm" 
                    style={{ color: 'var(--red)' }}
                    title="Delete this scope"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button onClick={handleAddItem} className="btn btn-primary btn-sm">
                    <Plus size={14} /> Add Work Item
                  </button>
                </div>
              </div>

              {/* Table */}
              <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <div className="table-wrap">
                  <table style={{ minWidth: 820 }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>No</th>
                        <th style={thStyle}>Description</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Qty</th>
                        <th style={thStyle}>Unit</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Material</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Labor</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Equipment</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Unit Price</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                        <th style={thStyle}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeScope.items.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                            <Plus size={28} style={{ opacity: 0.2, display: 'block', margin: '0 auto 8px' }} />
                            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 500 }}>No work items yet</p>
                            <p style={{ margin: 0, fontSize: 12 }}>Click "+ Add Work Item" to start building your estimation.</p>
                          </td>
                        </tr>
                      ) : (
                        activeScope.items.map((item, idx) => {
                          const unitPrice = item.materialCost + item.laborCost + item.equipmentCost;
                          const lineTotal = unitPrice * item.qty;
                          return (
                            <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setModalItem(item)}>
                              <td style={{ ...tdStyle, color: 'var(--text-muted)', fontWeight: 600 }}>{String(idx + 1).padStart(2, '0')}</td>
                              <td style={tdStyle}>
                                <div style={{ fontWeight: 500 }}>{item.description || <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>Untitled item</span>}</div>
                                {item.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.notes}</div>}
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>{item.qty}</td>
                              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{item.unit}</td>
                              <td style={{ ...tdStyle, textAlign: 'right' }}>{rp(item.materialCost)}</td>
                              <td style={{ ...tdStyle, textAlign: 'right' }}>{rp(item.laborCost)}</td>
                              <td style={{ ...tdStyle, textAlign: 'right' }}>{rp(item.equipmentCost)}</td>
                              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{rp(unitPrice)}</td>
                              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{rp(lineTotal)}</td>
                              <td style={{ ...tdStyle }}>
                                <button
                                  onClick={e => { e.stopPropagation(); handleDeleteItem(item.id, item.description); }}
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: 'var(--red)', padding: 4 }}
                                ><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {activeScope.items.length > 0 && (
                      <tfoot>
                        <tr style={{ background: 'var(--bg)' }}>
                          <td colSpan={8} style={{ ...tdStyle, fontWeight: 700, textAlign: 'right', borderTop: '2px solid var(--border)' }}>
                            Scope Subtotal
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 800, fontSize: 14, textAlign: 'right', borderTop: '2px solid var(--border)', color: 'var(--blue)' }}>
                            {rp(getScopeSubtotal(activeScope))}
                          </td>
                          <td style={{ borderTop: '2px solid var(--border)' }}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
              <AlertCircle size={32} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select or create a scope to begin estimating.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────── */}
      {modalItem && (
        <WorkItemModal
          item={modalItem}
          onSave={handleSaveItem}
          onClose={() => setModalItem(null)}
        />
      )}

      {showHistory && (
        <HistoryModal history={revisionHistory} onClose={() => setShowHistory(false)} />
      )}

      {/* ── CONFIRM DELETE ──────────────────────────────────────── */}
      {confirmDelete && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, backdropFilter: 'blur(2px)' }} onClick={() => setConfirmDelete(null)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', borderRadius: 14, padding: '28px 32px', zIndex: 1101, maxWidth: 380, width: '90%', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
            <AlertCircle size={36} color="var(--red)" style={{ margin: '0 auto 14px', display: 'block' }} />
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Delete {confirmDelete.type === 'scope' ? 'Scope' : 'Item'}?</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              "<strong>{confirmDelete.label || 'Untitled'}</strong>" will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={confirmAction} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </>
      )}

      {/* ── TOAST ───────────────────────────────────────────────── */}
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}

    </div>
  );
}
