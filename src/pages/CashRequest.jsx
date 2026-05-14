import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { submitPR, getAllPRs, getProjectSpending, deletePR } from '../utils/prService'
import { canViewAll } from '../utils/rbac'
import { getProjectFinancialStatus } from '../utils/invoiceService'

const SCOPE_OPTIONS = [
  'Ceiling', 'Wall', 'Flooring', 'Electrical', 'Plumbing', 
  'Finishing', 'Furniture', 'Signage', 'Others'
]

const CashRequest = ({ projects = [], workers = [], currentUser, systemUsers = [] }) => {
  const navigate = useNavigate()
  const { refNo: urlRefNo } = useParams()
  const { hash } = useLocation()
  const [refNo, setRefNo] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [vendor, setVendor] = useState('')
  const [address, setAddress] = useState('')
  const [telephone, setTelephone] = useState('')
  const [project, setProject] = useState('')
  const [scopeOfWork, setScopeOfWork] = useState('')
  const [scopeOfWorkOther, setScopeOfWorkOther] = useState('')
  const [items, setItems] = useState([
    { id: `item-${Date.now()}`, description: '', descriptionImage: null, cashPrice: 0 }
  ])
  const [bankName, setBankName] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [requestedBy, setRequestedBy] = useState('')
  const [status, setStatus] = useState('Draft')
  
  // Budget Ceiling State
  const [budgetStatus, setBudgetStatus] = useState({ totalReceived: 0, allowedScopes: [], hasPayments: false })
  const [currentSpent, setCurrentSpent] = useState(0)

  useEffect(() => {
    if (project) {
      setBudgetStatus(getProjectFinancialStatus(project))
      setCurrentSpent(getProjectSpending(project))
    }
  }, [project])
  const [submitStatus, setSubmitStatus] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [history, setHistory] = useState([])
  const [viewHistory, setViewHistory] = useState(false)

  useEffect(() => {
    let all = getAllPRs().filter(p => p.type === 'Cash Request')

    // Filter if user is not privileged to see all
    if (currentUser && !canViewAll(currentUser.role)) {
      all = all.filter(pr => 
        pr.submittedBy === currentUser.name || 
        pr.submittedBy === currentUser.username ||
        pr.requestedBy === currentUser.name
      )
    }

    setHistory(all)

    if (urlRefNo) {
      const existing = getAllPRs().find(pr => pr.refNo === urlRefNo)
      if (existing) {
        setRefNo(existing.refNo)
        setCurrentDate(existing.date)
        setVendor(existing.vendor)
        setAddress(existing.address)
        setTelephone(existing.telephone)
        setProject(existing.project)
        setScopeOfWork(existing.scopeOfWork || '')
        setScopeOfWorkOther(existing.scopeOfWorkOther || '')
        setItems(existing.items || [])
        setBankName(existing.bankName || '')
        setAccountNo(existing.accountNo || '')
        setAccountHolder(existing.accountHolder || '')
        setRequestedBy(existing.requestedBy || existing.submittedBy || '')
        setStatus(existing.status)
        return
      }
    }

    // New CR — auto-fill requestedBy from currentUser
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const random = Math.floor(1000 + Math.random() * 9000)
    setRefNo(`CSH.${month}FRW.${random}`)
    setRequestedBy(currentUser?.name || currentUser?.username || '')
    setStatus('Draft')
  }, [urlRefNo, currentUser])

  useEffect(() => {
    if (hash === '#print' && status !== 'Draft') {
      setTimeout(() => window.print(), 500)
    }
  }, [hash, status])

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleImageUpload = (id, e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => handleItemChange(id, 'descriptionImage', reader.result)
      reader.readAsDataURL(file)
    }
  }

  const addItem = () => {
    setItems([...items, { id: `item-${Date.now()}`, description: '', descriptionImage: null, cashPrice: 0 }])
  }

  const removeItem = (id) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id))
  }

  const isAuthorized = canViewAll(currentUser?.role)

  const handleDelete = (ref) => {
    if (window.confirm(`Hapus Cash Request ${ref} secara permanen?`)) {
      deletePR(ref)
      setHistory(getAllPRs().filter(p => p.type === 'Cash Request'))
      if (urlRefNo === ref) navigate('/forms/cash-request')
    }
  }

  const handleSubmit = () => {
    if (!vendor || !project) {
      setSubmitError('Vendor dan Project harus diisi.')
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus(null), 4000)
      return
    }

    // --- Validation Logic ---
    const { totalReceived, allowedScopes, hasPayments } = getProjectFinancialStatus(project)
    const totalSpent = getProjectSpending(project)
    const newTotal = items.reduce((acc, item) => acc + (item.cashPrice || 0), 0)

    if (!hasPayments) {
      setSubmitError('Project belum memiliki pembayaran masuk. Cash Request tidak dapat disubmit.')
      setSubmitStatus('error')
      return
    }

    if (!allowedScopes.includes(scopeOfWork) && scopeOfWork !== 'Others') {
      setSubmitError(`Scope "${scopeOfWork}" belum memiliki pembayaran masuk. Silakan sesuaikan scope atau tunggu pembayaran invoice terkait.`)
      setSubmitStatus('error')
      return
    }

    if (totalSpent + newTotal > totalReceived) {
      const remaining = totalReceived - totalSpent
      setSubmitError(`Batas pengajuan terlampaui. Sisa plafon: Rp ${remaining.toLocaleString('id-ID')}. Total CSH ini: Rp ${newTotal.toLocaleString('id-ID')}`)
      setSubmitStatus('error')
      return
    }
    // ------------------------

    const crData = {
      id: refNo,
      refNo,
      type: 'Cash Request',
      date: currentDate,
      vendor, address, telephone, project,
      scopeOfWork,
      scopeOfWorkOther: scopeOfWork === 'Others' ? scopeOfWorkOther : '',
      items,
      total: items.reduce((acc, item) => acc + (item.cashPrice || 0), 0),
      bankName, accountNo, accountHolder,
      requestedBy,
      status: 'Pending Approval',
      approval1: null,
      approval2: null,
    }
    submitPR(crData, currentUser, systemUsers)
    setStatus('Pending Approval')
    setSubmitStatus('success')
    setHistory(getAllPRs().filter(p => p.type === 'Cash Request').sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
  }

  return (
    <div className="p-lg max-w-[1200px] mx-auto">
      <style>{`
        @media print {
          .desc-img-container { border: none !important; padding: 0 !important; display: block !important; }
          .desc-img-container img { width: 100% !important; height: auto !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-8 no-print">
        <button onClick={() => navigate('/forms')} className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Forms
        </button>
        <div className="flex gap-3">
          <button onClick={() => setViewHistory(!viewHistory)} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2">
            <span className="material-symbols-outlined">history</span>
            CSH History
          </button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-primary text-white font-bold rounded shadow-sm hover:brightness-110 flex items-center gap-2">
            <span className="material-symbols-outlined">print</span>
            Print PDF
          </button>
        </div>
      </div>

      {/* History Panel */}
      {viewHistory && (
        <div className="no-print mb-8 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Cash Request History</h3>
            <button onClick={() => setViewHistory(false)} className="text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {history.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No history found</p>
            ) : (
              history.map(cr => (
                <div key={cr.refNo} onClick={() => { navigate(`/forms/cash-request/${cr.refNo}`); setViewHistory(false); }} className="px-6 py-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{cr.refNo}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{cr.vendor} &bull; {cr.project}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${cr.status === 'Fully Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {cr.status}
                    </span>
                    {isAuthorized && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(cr.refNo); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className={`bg-white shadow-2xl border border-slate-200 p-12 min-h-[1200px] text-slate-900 relative print:shadow-none print:border-none print:p-0 ${isAuthorized ? 'edit-mode' : ''}`}>
        
        {/* Admin Edit Badge */}
        {isAuthorized && status !== 'Draft' && (
          <div className="absolute top-4 right-12 no-print">
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full">
              <span className="material-symbols-outlined text-sm">edit_note</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Power User Edit Mode</span>
            </div>
          </div>
        )}
        
        {/* Status Watermark */}
        {status !== 'Draft' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] pointer-events-none z-10 opacity-30 print:opacity-30 whitespace-nowrap">
            <div className={`border-[20px] rounded-[40px] px-24 py-12 ${
              status === 'Paid' ? 'border-emerald-500 text-emerald-500' :
              status.includes('Approved') ? 'border-green-600 text-green-600' :
              status.includes('Reject') ? 'border-red-600 text-red-600' :
              'border-amber-500 text-amber-500'
            }`}>
              <span className="text-[120px] font-black uppercase tracking-[0.3em]">
                {status === 'Paid' ? 'PAID' : status.includes('Approved') ? 'APPROVED' : status.includes('Reject') ? 'REJECTED' : 'PENDING'}
              </span>
            </div>
          </div>
        )}

        <div className="text-center mb-12 relative">
          <h1 className="text-3xl font-black tracking-[0.2em] border-b-4 border-slate-900 inline-block pb-2 uppercase">Cash Request</h1>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-8 text-sm">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 font-black uppercase">Vendor</span><span className="mr-2">:</span>
              <input className="flex-1 border-b border-transparent hover:border-slate-300 outline-none bg-transparent font-bold" value={vendor} onChange={e => (status === 'Draft' || isAuthorized) && setVendor(e.target.value)} readOnly={status !== 'Draft' && !isAuthorized} />
            </div>
            <div className="flex">
              <span className="w-32 font-black uppercase">Address</span><span className="mr-2">:</span>
              <input className="flex-1 border-b border-transparent hover:border-slate-300 outline-none bg-transparent font-bold" value={address} onChange={e => (status === 'Draft' || isAuthorized) && setAddress(e.target.value)} readOnly={status !== 'Draft' && !isAuthorized} />
            </div>
            <div className="flex">
              <span className="w-32 font-black uppercase">Telephone</span><span className="mr-2">:</span>
              <input className="flex-1 border-b border-transparent hover:border-slate-300 outline-none bg-transparent font-bold" value={telephone} onChange={e => (status === 'Draft' || isAuthorized) && setTelephone(e.target.value)} readOnly={status !== 'Draft' && !isAuthorized} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex"><span className="w-32 font-black uppercase">Date</span><span className="mr-2">:</span><span className="font-bold">{currentDate}</span></div>
            <div className="flex"><span className="w-32 font-black uppercase">Reff</span><span className="mr-2">:</span><span className="font-bold">{refNo}</span></div>
            <div className="flex">
              <span className="w-32 font-black uppercase">Project</span><span className="mr-2">:</span>
              <select className="flex-1 border-b border-transparent outline-none bg-transparent font-bold uppercase" value={project} onChange={e => (status === 'Draft' || isAuthorized) && setProject(e.target.value)} disabled={status !== 'Draft' && !isAuthorized}>
                <option value="">...</option>
                {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex">
              <span className="w-32 font-black uppercase whitespace-nowrap">Scope Of Work</span>
              <span className="mr-2">:</span>
              <div className="flex-1 flex flex-col gap-1">
                <select
                  className={`w-full border-b border-transparent hover:border-slate-300 outline-none bg-transparent font-bold uppercase ${(status !== 'Draft' && !isAuthorized) ? 'cursor-default' : 'cursor-pointer'}`}
                  value={scopeOfWork}
                  onChange={(e) => (status === 'Draft' || isAuthorized) && setScopeOfWork(e.target.value)}
                  disabled={status !== 'Draft' && !isAuthorized}
                >
                  <option value="">...</option>
                  {SCOPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {scopeOfWork === 'Others' && (
                  <input
                    className="w-full border-b border-slate-200 focus:border-primary outline-none bg-transparent text-xs font-bold italic"
                    placeholder="Sebutkan scope lainnya..."
                    value={scopeOfWorkOther}
                    onChange={(e) => (status === 'Draft' || isAuthorized) && setScopeOfWorkOther(e.target.value)}
                    readOnly={status !== 'Draft' && !isAuthorized}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Status Banner */}
        {project && (
          <div className={`mb-8 p-6 rounded-2xl border flex items-center justify-between no-print ${budgetStatus.hasPayments ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${budgetStatus.hasPayments ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Project Limit Status</h4>
                <div className="flex items-baseline gap-2">
                  <span className={`text-lg font-black ${budgetStatus.hasPayments ? 'text-emerald-700' : 'text-slate-400'}`}>
                    Rp {(budgetStatus.totalReceived - currentSpent).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining Limit</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 text-right">Allowed Scopes</p>
              <div className="flex flex-wrap gap-2 justify-end">
                {budgetStatus.allowedScopes.length > 0 ? (
                  budgetStatus.allowedScopes.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-white border border-emerald-200 text-emerald-600 rounded-full text-[9px] font-black uppercase">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 italic">No paid scopes yet</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <table className="w-full border-2 border-slate-900 border-collapse mb-8 text-sm">
          <thead>
            <tr className="bg-slate-200 border-b-2 border-slate-900">
              <th className="border-r-2 border-slate-900 px-2 py-3 w-16 text-center uppercase font-black">No</th>
              <th className="border-r-2 border-slate-900 px-4 py-3 text-center uppercase font-black">Description</th>
              <th className="border-r-2 border-slate-900 px-4 py-3 w-48 text-center uppercase font-black">Cash Price</th>
              <th className="px-4 py-3 w-48 text-center uppercase font-black">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b-2 border-slate-900 last:border-b-0">
                <td className="border-r-2 border-slate-900 px-2 py-8 text-center align-top font-medium relative group">
                  {index + 1}
                  {(status === 'Draft' || isAuthorized) && items.length > 1 && (
                    <button onClick={() => removeItem(item.id)} className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 no-print"><span className="material-symbols-outlined text-[14px]">remove</span></button>
                  )}
                </td>
                <td className="border-r-2 border-slate-900 px-6 py-6 align-top">
                  <textarea className="w-full border-none outline-none bg-transparent italic font-medium" rows={2} value={item.description} onChange={e => (status === 'Draft' || isAuthorized) && handleItemChange(item.id, 'description', e.target.value)} readOnly={status !== 'Draft' && !isAuthorized} placeholder="Payment for service..." />
                  {item.descriptionImage && <img src={item.descriptionImage} className="mt-4 max-w-xs rounded border" alt="attachment" />}
                  {(status === 'Draft' || isAuthorized) && !item.descriptionImage && (
                    <label className="mt-2 inline-block cursor-pointer px-3 py-1 bg-slate-100 rounded text-[10px] font-black uppercase tracking-widest no-print">
                      Attach Image <input type="file" className="hidden" onChange={e => handleImageUpload(item.id, e)} />
                    </label>
                  )}
                </td>
                <td className="border-r-2 border-slate-900 px-4 py-8 text-center align-top">
                  <div className="flex items-center justify-between font-medium">
                    <span>Rp</span>
                    <input className="w-full text-right outline-none bg-transparent" value={item.cashPrice?.toLocaleString('id-ID') || ''} onChange={e => {
                      const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
                      handleItemChange(item.id, 'cashPrice', parseInt(raw) || 0)
                    }} readOnly={status !== 'Draft' && !isAuthorized} />
                  </div>
                </td>
                <td className="px-4 py-8 text-center align-top font-bold">
                  <div className="flex items-center justify-between"><span>Rp</span><span>{item.cashPrice?.toLocaleString('id-ID')}</span></div>
                </td>
              </tr>
            ))}
            {(status === 'Draft' || isAuthorized) && (
              <tr className="h-16 no-print">
                <td className="border-r-2 border-slate-900"></td>
                <td className="border-r-2 border-slate-900 text-center"><button onClick={addItem} className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-4 py-2 rounded">+ Add Line</button></td>
                <td className="border-r-2 border-slate-900"></td>
                <td></td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 border-t-2 border-slate-900 font-black">
              <td colSpan={2} className="border-r-2 border-slate-900"></td>
              <td className="border-r-2 border-slate-900 px-4 py-3 text-right uppercase tracking-widest">Total:</td>
              <td className="px-4 py-3 text-center flex justify-between"><span>Rp</span><span>{items.reduce((acc, it) => acc + (it.cashPrice || 0), 0).toLocaleString('id-ID')}</span></td>
            </tr>
          </tfoot>
        </table>

        {/* Payment & Footer */}
        <div className="grid grid-cols-2 mt-12 text-sm">
          <div className="space-y-1">
            <p className="font-bold border-b border-slate-900 inline-block mb-2">Payment transfer to:</p>
            <input className="block w-full border-b border-transparent outline-none bg-transparent font-medium" placeholder="BANK NAME" value={bankName} onChange={e => setBankName(e.target.value)} readOnly={status !== 'Draft'} />
            <input className="block w-full border-b border-transparent outline-none bg-transparent font-medium" placeholder="Account No" value={accountNo} onChange={e => setAccountNo(e.target.value)} readOnly={status !== 'Draft'} />
            <input className="block w-full border-b border-transparent outline-none bg-transparent font-medium uppercase" placeholder="a/n Account Holder" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} readOnly={status !== 'Draft'} />
          </div>
          <div className="text-center pt-12">
            <p className="font-black uppercase mb-16 tracking-widest">Requested By:</p>
            <input className="block w-full border-b-2 border-slate-900 outline-none bg-transparent font-black text-center uppercase" value={requestedBy} onChange={e => setRequestedBy(e.target.value)} readOnly={status !== 'Draft'} />
          </div>
        </div>

        <div className="mt-20 pt-8 border-t opacity-60 italic text-[10px] text-center uppercase tracking-[0.2em]">
          This document is electronically generated and managed by PROMAN Construction Management System
        </div>
      </div>

      {(status === 'Draft' || (isAuthorized && status !== 'Draft')) && (
        <div className="no-print mt-8 bg-white border border-slate-200 rounded-2xl p-6 flex justify-end gap-3 shadow-xl">
          <button onClick={() => navigate('/forms')} className="px-6 py-2.5 border rounded-lg font-bold text-xs uppercase tracking-widest transition-all">Cancel</button>
          <button onClick={handleSubmit} className="px-8 py-2.5 bg-primary text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">{status === 'Draft' ? 'send' : 'update'}</span> 
            {status === 'Draft' ? 'Submit for Approval' : 'Re-submit for Approval'}
          </button>
        </div>
      )}

      {submitStatus === 'success' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
            <h3 className="font-black text-xl">CSH Berhasil Dikirim!</h3>
            <p className="text-sm text-slate-500 font-medium">Cash Request <span className="font-black text-primary">{refNo}</span> telah dikirim untuk approval.</p>
            <button onClick={() => navigate('/forms')} className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-black text-xs uppercase tracking-widest">Kembali ke Forms</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CashRequest
