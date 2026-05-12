import React, { useState, useEffect } from 'react'
import { getAllInvoices, submitInvoice, getNextInvoiceStage } from '../utils/invoiceService'
import InvoiceDocument from '../components/InvoiceDocument'

const Invoice = ({ projects = [], currentUser }) => {
  const [invoices, setInvoices] = useState([])
  const [view, setView] = useState('list') // 'list' or 'create'
  const [viewingInvoice, setViewingInvoice] = useState(null)
  
  // Creation States
  const [selectedProject, setSelectedProject] = useState('')
  const [nextStage, setNextStage] = useState(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    setInvoices(getAllInvoices())
  }, [])

  useEffect(() => {
    if (selectedProject) {
      setNextStage(getNextInvoiceStage(selectedProject))
    } else {
      setNextStage(null)
    }
  }, [selectedProject])

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    setAmount(rawValue)
  }

  const formatDisplayAmount = (val) => {
    if (!val) return ''
    return Number(val).toLocaleString('id-ID')
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!selectedProject || !nextStage || !amount) return

    const newInv = {
      project: selectedProject,
      stage: nextStage,
      amount: parseFloat(amount),
      date,
      status: 'Issued'
    }

    submitInvoice(newInv)
    setInvoices(getAllInvoices())
    setView('list')
    setSelectedProject('')
    setAmount('')
    setNextStage(null)
  }

  const formatCurrency = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`

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
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm font-black">analytics</span>
                  </div>
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Billing Progress Stage</label>
                </div>
                {selectedProject && (
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                    Next Required Stage: <span className="bg-primary text-white px-3 py-1 rounded-full ml-1">{nextStage || 'COMPLETED'}%</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 gap-6">
                {[30, 50, 75, 100].map(s => {
                  const isNext = nextStage === s;
                  const isPast = selectedProject && nextStage !== null && s < nextStage;
                  const isFuture = selectedProject && (nextStage === null || s > nextStage);
                  
                  return (
                    <div 
                      key={s}
                      className={`relative flex flex-col p-8 rounded-3xl border-2 transition-all duration-300 ${
                        isNext 
                          ? 'bg-white border-primary shadow-2xl shadow-primary/20 -translate-y-2' 
                          : isPast
                            ? 'bg-green-50 border-green-100 opacity-60'
                            : 'bg-slate-50 border-slate-100 opacity-40 grayscale'
                      }`}
                    >
                      {isNext && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
                          Next Claim
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-6">
                        <span className={`text-2xl font-black ${isNext ? 'text-primary' : isPast ? 'text-green-600' : 'text-slate-400'}`}>{s}%</span>
                        <span className="material-symbols-outlined text-slate-300">
                          {isPast ? 'check_circle' : isNext ? 'pending' : 'lock'}
                        </span>
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isNext ? 'text-slate-900' : 'text-slate-400'}`}>
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
                  disabled={!nextStage}
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
                    Claim Stage: {nextStage}%
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
                disabled={!nextStage}
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
          onClick={() => setView('create')}
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Invoices</p>
            <p className="text-2xl font-black text-slate-900">{invoices.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">payments</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billed Amount</p>
            <p className="text-2xl font-black text-slate-900">
              {formatCurrency(invoices.reduce((acc, inv) => acc + inv.amount, 0))}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Projects</p>
            <p className="text-2xl font-black text-slate-900">
              {new Set(invoices.map(i => i.project)).size}
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
                    <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-200">{inv.status}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setViewingInvoice(inv)}
                      className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-125 transition-all shadow-md"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      View
                    </button>
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
