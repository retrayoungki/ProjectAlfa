import React, { useState } from 'react'
import { useCostEstimation } from '../hooks/useCostEstimation'
import { printCostEstimationReport } from '../utils/pdfExport'
import CostCompositionModal from '../components/CostCompositionModal'
import AddItemModal from '../components/AddItemModal'
import AddCategoryModal from '../components/AddCategoryModal'
import SaveRevisionModal from '../components/SaveRevisionModal'
import RevisionHistoryModal from '../components/RevisionHistoryModal'
import AHSPSelectionModal from '../components/AHSPSelectionModal'

const COST_EDITOR_ROLES = ['Director', 'Senior Project Manager', 'Project Manager']

const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0)

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-lg shadow-xl font-bold text-sm transition-all animate-in slide-in-from-bottom-4 duration-300 ${isSuccess ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      <span className="material-symbols-outlined text-[18px]">{isSuccess ? 'check_circle' : 'error'}</span>
      {toast.message}
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-slate-50 animate-pulse">
    <div className="p-6 border-b bg-white h-40 shrink-0">
      <div className="h-8 bg-slate-200 rounded w-64 mb-4" />
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded" />)}
      </div>
    </div>
    <div className="flex-1 flex">
      <div className="w-72 bg-white border-r p-4 space-y-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded" />)}
      </div>
      <div className="flex-1 p-6">
        <div className="bg-white rounded shadow h-full" />
      </div>
    </div>
  </div>
)

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ onAddCategory, isPrivileged }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-20">
    <span className="material-symbols-outlined text-6xl text-slate-200">calculate</span>
    <p className="text-lg font-black text-slate-400">No Cost Estimation Data</p>
    <p className="text-sm text-slate-300 max-w-xs">This project has no WBS categories yet. Add a category to start building your estimate.</p>
    {isPrivileged && (
      <button onClick={onAddCategory} className="mt-2 px-6 py-2.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded shadow hover:brightness-110 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">add</span>Add First Category
      </button>
    )}
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const CostManagement = ({ projects, currentUser }) => {
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || null)
  
  React.useEffect(() => {
    if (!selectedProject && projects && projects.length > 0) {
      setSelectedProject(projects[0].id)
    }
  }, [projects, selectedProject])

  const currentProject = projects.find(p => p.id === selectedProject) || projects[0]

  const {
    wbsData, params, calculations, currentRevision, revisions,
    loading, error, saveStatus, toast,
    handleParamChange, handleAddSection, handleDeleteSection,
    handleAddItem, handleUpdateItem, handleDeleteItem,
    handleInlineItemChange, handleInlineItemBlur,
    handleSaveRevision, handleRestoreRevision,
  } = useCostEstimation(selectedProject, currentUser)

  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const currentCategory = wbsData.find(c => c.id === (selectedCategoryId || wbsData[0]?.id)) || wbsData[0]

  // Modal states
  const [addItemModal, setAddItemModal] = useState({ open: false, editData: null })
  const [addCatModal, setAddCatModal] = useState(false)
  const [saveRevModal, setSaveRevModal] = useState(false)
  const [revHistModal, setRevHistModal] = useState(false)
  const [ahspModal, setAhspModal] = useState(false)
  const [compositionModal, setCompositionModal] = useState({ open: false, item: null })
  const [isSavingRev, setIsSavingRev] = useState(false)

  const isPrivileged = COST_EDITOR_ROLES.includes(currentUser?.role)
  const { baseCost, overheadCost, profitCost, taxCost, grandTotal } = calculations

  const handleSaveRevSubmit = async (notes) => {
    setIsSavingRev(true)
    try { await handleSaveRevision(notes) } finally { setIsSavingRev(false) }
  }

  if (loading) return <Skeleton />
  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-5xl text-red-400">cloud_off</span>
        <p className="mt-3 font-bold text-slate-600">Firebase connection error</p>
        <p className="text-sm text-slate-400 mt-1">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      <Toast toast={toast} />

      {/* ── Header ── */}
      <div className="p-6 border-b border-slate-200 bg-white shrink-0 z-10 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5">
          <div>
            <h2 className="text-4xl font-black text-primary mb-1 tracking-tight">Cost Estimation Engine</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded font-bold px-3 py-1.5 focus:outline-none focus:border-primary"
                value={selectedProject || ''}
                onChange={(e) => { setSelectedProject(e.target.value); setSelectedCategoryId(null) }}
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.code ? `${p.code} - ` : ''}{p.name}</option>)}
              </select>

              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => setRevHistModal(true)}>
                {currentRevision > 0 ? `Rev ${currentRevision}` : 'Draft'} ▾
              </span>

              <div className="flex items-center gap-1.5">
                {saveStatus === 'saved' && <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded"><span className="material-symbols-outlined text-[14px]">check_circle</span>Saved</span>}
                {saveStatus === 'dirty' && <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded"><span className="material-symbols-outlined text-[14px]">edit_note</span>Unsaved *</span>}
                {saveStatus === 'saving' && <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded"><span className="material-symbols-outlined text-[14px] animate-spin">sync</span>Saving...</span>}
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setAhspModal(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-label-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-base">post_add</span>Load AHSP
            </button>
            <button
              onClick={() => printCostEstimationReport({ project: currentProject, wbsData, calculations, params, currentRevision, createdBy: currentUser?.name })}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-label-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-base">download</span>Export PDF
            </button>
            <button onClick={() => setRevHistModal(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-label-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-base">history</span>History
            </button>
            {isPrivileged && (
              <button onClick={() => setSaveRevModal(true)} className="px-4 py-2 bg-primary text-white font-label-bold rounded shadow-sm hover:opacity-90 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-base">save</span>Save Revision
              </button>
            )}
          </div>
        </div>

        {/* ── Financial Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-50 border border-slate-100 p-3 rounded">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Base Cost</p>
            <p className="font-black text-slate-800 text-sm tabular-nums">{fmt(baseCost)}</p>
          </div>
          {[
            { label: 'Overhead', field: 'overhead', cost: overheadCost },
            { label: 'Profit', field: 'profit', cost: profitCost },
            { label: 'VAT / PPN', field: 'tax', cost: taxCost },
          ].map(({ label, field, cost }) => (
            <div key={field} className="bg-slate-50 border border-slate-100 p-3 rounded">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{label}</p>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0" max="100" step="0.1"
                    className="w-10 text-right text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5"
                    value={params[field]}
                    onChange={(e) => handleParamChange(field, e.target.value)}
                    disabled={!isPrivileged}
                  />
                  <span className="text-[10px] text-slate-500">%</span>
                </div>
              </div>
              <p className="font-bold text-slate-700 text-sm tabular-nums">{fmt(cost)}</p>
            </div>
          ))}
          <div className="bg-blue-50 border border-blue-100 p-3 rounded">
            <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Grand Total</p>
            <p className="font-black text-blue-900 text-base tabular-nums">{fmt(grandTotal)}</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* WBS Sidebar */}
        <div className="w-72 bg-white border-r border-slate-200 overflow-y-auto flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 sticky top-0">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
              Work Breakdown Structure
            </h3>
          </div>
          <div className="flex-1 p-2 space-y-1">
            {wbsData.map((cat, index) => {
              const catTotal = cat.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0)
              const isActive = (selectedCategoryId || wbsData[0]?.id) === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`w-full text-left px-3 py-2.5 rounded text-sm font-bold transition-colors group ${isActive ? 'bg-[#8A4A00] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2">{index + 1}.0 {cat.category}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'}`}>{cat.items.length}</span>
                  </div>
                  {catTotal > 0 && (
                    <div className={`text-[10px] mt-0.5 font-bold tabular-nums ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{fmt(catTotal)}</div>
                  )}
                </button>
              )
            })}
          </div>
          {isPrivileged && (
            <div className="p-4 border-t border-slate-100">
              <button onClick={() => setAddCatModal(true)} className="w-full py-2 border border-dashed border-slate-300 text-slate-500 text-xs font-bold rounded hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span>Add Category
              </button>
            </div>
          )}
        </div>

        {/* Spreadsheet Area */}
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          {wbsData.length === 0 ? (
            <EmptyState onAddCategory={() => setAddCatModal(true)} isPrivileged={isPrivileged} />
          ) : (
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '100%' }}>
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                <div>
                  <h4 className="font-headline-md text-primary">{currentCategory?.category} Details</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{currentCategory?.items?.length || 0} items</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-black text-slate-700 tabular-nums">
                    Subtotal: <span className="text-primary">{fmt(currentCategory?.items?.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0) || 0)}</span>
                  </p>
                  {isPrivileged && currentCategory && (
                    <button
                      onClick={() => { if (window.confirm(`Hapus kategori "${currentCategory.category}"?`)) { handleDeleteSection(currentCategory.id); setSelectedCategoryId(null) } }}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete Category"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[820px]">
                  <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-20 border-r border-slate-200">Code</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Description</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-28 border-r border-slate-200 text-right">Qty</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-20 border-r border-slate-200 text-center">Unit</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-44 border-r border-slate-200 text-right">Unit Price (Rp)</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-14 border-r border-slate-200 text-center" title="AHSP">AHSP</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-44 text-right border-r border-slate-200">Total (Rp)</th>
                      <th className="px-4 py-3 w-16 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">Act</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentCategory?.items?.map((item) => {
                      const qtyInvalid = Number(item.quantity) < 0
                      const priceInvalid = Number(item.unitPrice) < 0
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-4 py-2 border-r border-slate-100 text-xs font-bold text-slate-500">{item.code}</td>
                          <td className="p-0 border-r border-slate-100">
                            <input
                              type="text" value={item.description}
                              onChange={(e) => handleInlineItemChange(item.id, 'description', e.target.value)}
                              onBlur={(e) => handleInlineItemBlur(item.id, 'description', e.target.value)}
                              disabled={!isPrivileged}
                              className="w-full h-full px-4 py-3 text-sm font-medium text-slate-900 bg-transparent focus:bg-blue-50 focus:outline-none disabled:cursor-default"
                            />
                          </td>
                          <td className={`p-0 border-r border-slate-100 ${qtyInvalid ? 'bg-red-50' : ''}`}>
                            <input
                              type="number" value={item.quantity}
                              onChange={(e) => handleInlineItemChange(item.id, 'quantity', e.target.value)}
                              onBlur={(e) => handleInlineItemBlur(item.id, 'quantity', e.target.value)}
                              disabled={!isPrivileged}
                              className={`w-full h-full px-4 py-3 text-right text-sm font-bold tabular-nums ${qtyInvalid ? 'text-red-600' : 'text-primary'} bg-transparent focus:bg-blue-50 focus:outline-none disabled:cursor-default`}
                            />
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100 text-center text-xs font-bold text-slate-500">{item.unit}</td>
                          <td className={`p-0 border-r border-slate-100 ${priceInvalid ? 'bg-red-50' : ''}`}>
                            <input
                              type="number" value={item.unitPrice}
                              onChange={(e) => handleInlineItemChange(item.id, 'unitPrice', e.target.value)}
                              onBlur={(e) => handleInlineItemBlur(item.id, 'unitPrice', e.target.value)}
                              disabled={!isPrivileged}
                              className={`w-full h-full px-4 py-3 text-right text-sm font-bold tabular-nums ${priceInvalid ? 'text-red-600' : 'text-slate-700'} bg-transparent focus:bg-blue-50 focus:outline-none disabled:cursor-default`}
                            />
                          </td>
                          <td className="px-2 py-2 border-r border-slate-100 text-center">
                            <button
                              onClick={() => setCompositionModal({ open: true, item })}
                              className={`w-6 h-6 rounded inline-flex items-center justify-center transition-colors ${item.ahspRef ? 'bg-blue-100 text-blue-600 hover:bg-primary hover:text-white' : 'bg-slate-100 hover:bg-primary hover:text-white text-slate-400'}`}
                              title={item.ahspRef || 'View AHSP'}
                            >
                              <span className="material-symbols-outlined text-[14px]">dataset_linked</span>
                            </button>
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-black text-slate-800 bg-slate-50/50 border-r border-slate-100 tabular-nums">
                            {fmt(Number(item.quantity) * Number(item.unitPrice))}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isPrivileged && (
                                <>
                                  <button
                                    onClick={() => setAddItemModal({ open: true, editData: { ...item, sectionId: currentCategory.id } })}
                                    className="w-6 h-6 rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600 inline-flex items-center justify-center transition-colors"
                                    title="Edit"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">edit</span>
                                  </button>
                                  <button
                                    onClick={() => { if (window.confirm('Hapus item ini?')) handleDeleteItem(item.id) }}
                                    className="w-6 h-6 rounded text-slate-300 hover:bg-red-50 hover:text-red-500 inline-flex items-center justify-center transition-colors"
                                    title="Delete"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}

                    {isPrivileged && currentCategory && (
                      <tr>
                        <td colSpan="8" className="p-0">
                          <button
                            onClick={() => setAddItemModal({ open: true, editData: null })}
                            className="w-full py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-center gap-1 border-t border-dashed border-slate-200"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>Add Work Item
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <AddItemModal
        isOpen={addItemModal.open}
        onClose={() => setAddItemModal({ open: false, editData: null })}
        categoryName={currentCategory?.category}
        initialData={addItemModal.editData}
        onAdd={(data) => handleAddItem(currentCategory.id, data)}
        onUpdate={(data) => handleUpdateItem(data.id, data)}
      />

      <AddCategoryModal
        isOpen={addCatModal}
        onClose={() => setAddCatModal(false)}
        onAdd={handleAddSection}
        existingCategories={wbsData.map(c => c.category)}
      />

      <SaveRevisionModal
        isOpen={saveRevModal}
        onClose={() => setSaveRevModal(false)}
        onSave={handleSaveRevSubmit}
        currentRevision={currentRevision}
        isSaving={isSavingRev}
      />

      <RevisionHistoryModal
        isOpen={revHistModal}
        onClose={() => setRevHistModal(false)}
        revisions={revisions}
        onRestore={handleRestoreRevision}
      />

      <AHSPSelectionModal
        isOpen={ahspModal}
        onClose={() => setAhspModal(false)}
        onSelect={(ahspItem) => {
          if (currentCategory && isPrivileged) {
            handleAddItem(currentCategory.id, {
              description: ahspItem.description,
              unit: ahspItem.unit,
              unitPrice: ahspItem.price,
              quantity: 1,
              ahspRef: ahspItem.code,
              code: ahspItem.code,
            })
          }
        }}
      />

      <CostCompositionModal
        isOpen={compositionModal.open}
        onClose={() => setCompositionModal({ open: false, item: null })}
        wbsItem={compositionModal.item}
        onSave={(updated) => handleUpdateItem(updated.id, updated)}
        isPrivileged={isPrivileged}
      />
    </div>
  )
}

export default CostManagement
