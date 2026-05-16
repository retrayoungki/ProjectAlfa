import React, { useState, useEffect } from 'react'
import { getAllInvoices, submitInvoice, updateInvoiceStatus, deleteInvoice } from '../utils/invoiceService'
import { canViewAll } from '../utils/rbac'
import InvoiceDocument from '../components/InvoiceDocument'
import { loadEstimation } from '../services/costEstimationService'

const Invoice = ({ projects = [], currentUser }) => {
  const isAuthorized = canViewAll(currentUser?.role)
  const [invoices, setInvoices] = useState([])
  const [view, setView] = useState('list') // 'list' or 'create'
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [editingId, setEditingId] = useState(null)
  
  // Creation States
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedStage, setSelectedStage] = useState(30)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  // Billing Items Table
  const [items, setItems] = useState([
    { id: `item-${Date.now()}`, scope: '', detail: '', unit: '', price: 0 }
  ])

  // Cost Estimation Data (loaded from Firestore when project is selected)
  const [costData, setCostData] = useState({ sections: [], items: [] })
  const [loadingCost, setLoadingCost] = useState(false)

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleItemBatchChange = (id, updates) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const addItem = () => {
    setItems([...items, { id: `item-${Date.now()}`, scope: '', detail: '', unit: '', price: 0 }])
  }

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  useEffect(() => {
    setInvoices(getAllInvoices())
  }, [])

  useEffect(() => {
    if (selectedProject) {
      if (!editingId) setSelectedStage(30)

      // Load cost estimation data for the selected project
      const proj = projects.find(p => p.name === selectedProject)
      if (proj) {
        setLoadingCost(true)
        loadEstimation(proj.id).then(data => {
          if (data && !data.isNew) {
            setCostData({ sections: data.sections || [], items: data.items || [] })
          } else {
            setCostData({ sections: [], items: [] })
          }
        }).catch(() => {
          setCostData({ sections: [], items: [] })
        }).finally(() => setLoadingCost(false))
      }
    } else {
      setCostData({ sections: [], items: [] })
    }
  }, [selectedProject])

  // Build scope options from cost estimation data
  const scopeOptions = costData.sections.map(sec => {
    const sectionItems = costData.items.filter(i => i.sectionId === sec.id)
    const totalPrice = sectionItems.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0)
    const firstItem = sectionItems[0]
    return {
      id: sec.id,
      label: sec.category,
      detail: firstItem?.description || sec.category,
      unit: firstItem?.unit || 'Ls',
      quantity: firstItem?.quantity || 1,
      price: totalPrice
    }
  })

  useEffect(() => {
    const total = items.reduce((acc, item) => acc + (Number(item.quantity || 1) * Number(item.price || 0)), 0)
    setAmount(total.toString())
  }, [items])


  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    setAmount(rawValue)
  }

  const formatDisplayAmount = (val) => {
    if (!val) return ''
    return Number(val).toLocaleString('id-ID')
  }
  const handleEdit = (inv) => {
    setEditingId(inv.id)
    setSelectedProject(inv.project)
    setDate(inv.date)
    setItems(inv.items || [{ id: `item-${Date.now()}`, scope: '', detail: '', unit: '', price: 0 }])
    setAmount(inv.amount.toString())
    setSelectedStage(inv.stage || 30)
    setView('create')
  }

  const handleDelete = (id) => {
    if (window.confirm('Hapus invoice ini secara permanen?')) {
      deleteInvoice(id)
      setInvoices(getAllInvoices())
    }
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!selectedProject || !selectedStage || !amount) return


    const newInv = {
      project: selectedProject,
      stage: selectedStage,
      amount: parseFloat(amount),
      date,
      status: 'Issued',
      items
    }

    if (editingId) {
      const invs = getAllInvoices()
      const idx = invs.findIndex(i => i.id === editingId)
      if (idx !== -1) {
        invs[idx] = { ...invs[idx], ...newInv }
        localStorage.setItem('alfa_invoices', JSON.stringify(invs))
      }
    } else {
      submitInvoice(newInv)
    }

    setInvoices(getAllInvoices())
    setView('list')
    setEditingId(null)
    setSelectedProject('')
    setAmount('')
    setSelectedStage(30)
    setItems([{ id: `item-${Date.now()}`, scope: '', detail: '', unit: '', price: 0 }])
  }

  const formatCurrency = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`

  const PAYMENT_STAGES = ['Issued', '30% Paid', '50% Paid', '75% Paid', 'Lunas']

  const handleUpdateStatus = (invId, newStatus) => {
    if (updateInvoiceStatus(invId, newStatus)) {
      setInvoices(getAllInvoices())
    }
  }

  const totalProjectValue = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0)
  const totalPaid = invoices.reduce((acc, i) => {
    if (i.status === '30% Paid') return acc + (i.amount * 0.3)
    if (i.status === '50% Paid') return acc + (i.amount * 0.5)
    if (i.status === '75% Paid') return acc + (i.amount * 0.75)
    if (i.status === 'Lunas') return acc + i.amount
    return acc
  }, 0)



  // ── CREATE VIEW (Document Style) ──
  if (view === 'create') {
    return (
      <div className="p-lg max-w-[1100px] mx-auto animate-in fade-in duration-300">
        {/* Breadcrumbs / Action Bar */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Invoice List
          </button>
        </div>

        {/* Document Header Section */}
        <div className="bg-white shadow-2xl border border-slate-200 rounded-2xl overflow-hidden mb-12">
          <div className="bg-slate-900 px-10 py-12 flex justify-between items-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <span className="material-symbols-outlined text-[160px]">receipt_long</span>
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Issue New Invoice</h2>
              <p className="text-slate-400 font-bold text-sm mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Official Progress Billing Claim System
              </p>
            </div>
            <div className="relative z-10 text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Standard Reference</p>
              <p className="text-lg font-black tracking-widest">INV/{new Date().getFullYear()}/---</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="p-10 lg:p-16 space-y-16">
            {/* Project Selection Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm font-black">corporate_fare</span>
                  </div>
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Target Project</label>
                </div>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:border-primary focus:bg-white transition-all appearance-none cursor-pointer shadow-sm"
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  required
                >
                  <option value="">Select a project to bill...</option>
                  {projects.map(p => <option key={p.id} value={p.name}>{p.name} — {p.client}</option>)}
                </select>
                {selectedProject && (
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 animate-in slide-in-from-top-2">
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Client Info</p>
                    <p className="text-xs font-bold text-slate-700">{projects.find(p => p.name === selectedProject)?.client}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm font-black">event</span>
                  </div>
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Billing Date</label>
                </div>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:border-primary focus:bg-white transition-all shadow-sm"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Progress Visualization Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm font-black">analytics</span>
                  </div>
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Billing Progress Stage</label>
                </div>
                {selectedProject && (
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                    Selected Stage: <span className="bg-primary text-white px-3 py-1 rounded-full ml-1">{selectedStage}%</span>
                  </p>
                )}

              <div className="grid grid-cols-4 gap-6">
                {[30, 50, 75, 100].map(s => {
                  const isSelected = selectedStage === s;
                  
                  return (
                    <div 
                      key={s}
                      onClick={() => setSelectedStage(s)}
                      className={`relative flex flex-col p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? 'bg-white border-primary shadow-2xl shadow-primary/20 -translate-y-2' 
                          : 'bg-slate-50 border-slate-100 hover:border-primary/30 hover:bg-white/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg animate-in fade-in zoom-in duration-300">
                          Selected
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-6">
                        <span className={`text-2xl font-black ${isSelected ? 'text-primary' : 'text-slate-400'}`}>{s}%</span>
                        <span className={`material-symbols-outlined ${isSelected ? 'text-primary' : 'text-slate-300'}`}>
                          {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                        {s === 100 ? 'Final Retention' : 'Progress Payment'}
                      </p>
                    </div>
                  );
                })}
              </div>

              {!selectedProject && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center justify-center gap-4 animate-pulse">
                  <span className="material-symbols-outlined text-slate-300 text-3xl">ads_click</span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Please select a project above to unlock billing stages</p>
                </div>
              )}
            </div>

            {/* Billing Items Table Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-[32px] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">No</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 text-center">Quantity</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-44 text-right">Price (Rp)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-44 text-right">Total (Rp)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-white transition-colors">
                      <td className="px-6 py-4 text-center text-xs font-black text-slate-400">{index + 1}</td>
                      <td className="px-6 py-4">
                        <select 
                          className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-900 cursor-pointer appearance-none hover:text-primary transition-colors"
                          value={item.scope}
                          onChange={e => {
                            const selectedScope = e.target.value
                            const matched = scopeOptions.find(s => s.label === selectedScope)
                            if (matched) {
                              handleItemBatchChange(item.id, {
                                scope: selectedScope,
                                detail: matched.detail,
                                unit: matched.unit,
                                quantity: matched.quantity,
                                price: matched.price
                              })
                            } else {
                              handleItemChange(item.id, 'scope', selectedScope)
                            }
                          }}
                        >
                          <option value="">Select Item...</option>
                          {scopeOptions.length > 0 ? (
                            scopeOptions.map(opt => (
                              <option key={opt.id} value={opt.label}>{opt.label}</option>
                            ))
                          ) : (
                            <option disabled>No cost data available</option>
                          )}
                        </select>
                        {loadingCost && <span className="text-[9px] text-slate-400 italic">Loading...</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <input 
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-16 bg-transparent border-none outline-none text-sm font-bold text-primary text-right tabular-nums placeholder:text-slate-300"
                            value={item.quantity || ''}
                            onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                          <span className="text-[10px] font-bold text-slate-400">{item.unit || 'Ls'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="text"
                          placeholder="0"
                          className="w-full bg-transparent border-none outline-none text-sm font-black text-slate-900 text-right tabular-nums placeholder:text-slate-300"
                          value={item.price ? Number(item.price).toLocaleString('id-ID') : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '')
                            handleItemChange(item.id, 'price', raw === '' ? 0 : parseFloat(raw))
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-800 tabular-nums bg-slate-50/50">
                        {`Rp ${(Number(item.quantity || 1) * Number(item.price || 0)).toLocaleString('id-ID')}`}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {items.length > 1 && (
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="6" className="px-6 py-4">
                      <button 
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:brightness-90 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Add Line Item
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Billing Amount Section (The "Card") */}
            <div className="bg-[#f8f9ff] border-2 border-slate-100 rounded-[40px] p-12 flex flex-col items-center text-center space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Gross Billing Amount</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Enter total value of progress claim work completed</p>
              </div>

              <div className="w-full max-w-xl relative">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-300 tracking-tighter">Rp</div>
                <input 
                  type="text"
                  className="w-full bg-white border-4 border-slate-100 rounded-[32px] pl-24 pr-12 py-10 text-6xl font-black outline-none focus:border-primary transition-all text-slate-900 shadow-inner tracking-tighter tabular-nums placeholder:text-slate-100"
                  placeholder="0"
                  value={formatDisplayAmount(amount)}
                  onChange={handleAmountChange}
                  required
                />
              </div>

              {selectedProject && (
                <div className="flex items-center gap-6 text-slate-400 font-bold text-sm">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">assignment</span>
                    {selectedProject}
                  </span>
                  <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">flag</span>
                    Claim Stage: {selectedStage}%
                  </span>
                </div>
              )}
            </div>

            {/* Footer Submission Actions */}
            <div className="pt-12 flex justify-end items-center gap-8 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setView('list')}
                className="text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest transition-colors px-6 py-4"
              >
                Cancel and Discard
              </button>
              <button 
                type="submit"
                className="bg-primary text-white px-12 py-6 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:brightness-110 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-4 disabled:opacity-20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
              >
                <span className="material-symbols-outlined">send_and_archive</span>
                Finalize and Issue Invoice
              </button>
            </div>
          </form>
        </div>

        {/* System Footnote */}
        <div className="flex flex-col items-center gap-4 mb-20">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] max-w-sm text-center leading-relaxed">
            All invoices generated are immutable once finalized. Please ensure project progress data is verified before issuance.
          </p>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ──
  return (
    <div className="p-8 space-y-8 max-w-[1440px] mx-auto w-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Invoice Management</h1>
          <p className="text-slate-500 font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">fact_check</span>
            Official project billing tracking and document issuance portal.
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null)
            setSelectedProject('')
            setAmount('')
            setItems([{ id: `item-${Date.now()}`, scope: '', detail: '', unit: '', price: 0 }])
            setView('create')
          }}
          className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:brightness-110 hover:-translate-y-1 active:translate-y-0 transition-all group"
        >
          <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform duration-300">add</span>
          Create New Invoice
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">receipt</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoices Issued</p>
            <p className="text-2xl font-black text-slate-900">{invoices.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Project Value</p>
            <p className="text-2xl font-black text-slate-900">
              {formatCurrency(totalProjectValue)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">verified</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payments Received</p>
            <p className="text-2xl font-black text-slate-900">
              {formatCurrency(totalPaid)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project & Client</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Stage</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Date</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    <span className="material-symbols-outlined text-6xl">inventory_2</span>
                    <p className="italic font-bold text-sm">No billing records found in the archive.</p>
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 group-hover:text-primary transition-colors">{inv.project}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {projects.find(p => p.name === inv.project)?.client || 'Standard Client'}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest">{inv.stage}%</span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-700 tracking-tight">{formatCurrency(inv.amount)}</td>
                  <td className="px-8 py-6 text-center text-slate-500 font-bold text-xs">{inv.date}</td>
                  <td className="px-8 py-6 text-center">
                    {isAuthorized ? (
                      <select 
                        onChange={(e) => handleUpdateStatus(inv.id, e.target.value)}
                        value={inv.status}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border outline-none cursor-pointer transition-all ${
                          inv.status === 'Lunas' 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        {PAYMENT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        inv.status === 'Lunas' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setViewingInvoice(inv)}
                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-125 transition-all shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View
                      </button>

                      {isAuthorized && (
                        <>
                          <button 
                            onClick={() => handleEdit(inv)}
                            className="p-2 ml-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                            title="Edit Invoice"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(inv.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Invoice"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Document Modal (Unchanged) */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-8 overflow-y-auto">
          <div className="relative w-full max-w-4xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setViewingInvoice(null)}
              className="fixed top-8 right-8 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 transition-all hover:rotate-90 print:hidden"
            >
              <span className="material-symbols-outlined text-4xl">close</span>
            </button>
            <div className="shadow-2xl">
              <InvoiceDocument 
                invoice={viewingInvoice} 
                projectData={projects.find(p => p.name === viewingInvoice.project)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Invoice
