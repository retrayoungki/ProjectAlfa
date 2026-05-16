import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { submitPR, getAllPRs, getProjectSpending, deletePR, getSortedPRs } from '../utils/prService'
import { canViewAll } from '../utils/rbac'
import { getProjectFinancialStatus } from '../utils/invoiceService'
import { loadEstimation } from '../services/costEstimationService'

const SCOPE_OPTIONS = [
  'Ceiling', 'Wall', 'Flooring', 'Electrical', 'Plumbing', 
  'Finishing', 'Furniture', 'Signage', 'Others'
]

const PurchaseRequest = ({ projects = [], workers = [], currentUser, systemUsers = [] }) => {
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
    { id: `item-${Date.now()}`, description: '', descriptionImage: null, quantity: 1, unit: 'Lot', unitPrice: 0 }
  ])
  const [bankName, setBankName] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [requestedBy, setRequestedBy] = useState('')
  const [status, setStatus] = useState('Draft')
  const [submitStatus, setSubmitStatus] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [history, setHistory] = useState([])
  const [viewHistory, setViewHistory] = useState(false)
  
  // Budget Ceiling State
  const [budgetStatus, setBudgetStatus] = useState({ totalReceived: 0, allowedScopes: [], hasPayments: false })
  const [currentSpent, setCurrentSpent] = useState(0)
  const [plannedLimit, setPlannedLimit] = useState(0)
  const [scopeSpent, setScopeSpent] = useState(0)

  useEffect(() => {
    if (project) {
      setBudgetStatus(getProjectFinancialStatus(project))
      setCurrentSpent(getProjectSpending(project))
      
      // Fetch planned limit from Cost Engine
      const pObj = projects.find(p => p.name === project)
      if (pObj && scopeOfWork) {
        loadEstimation(pObj.id).then(data => {
          const section = data.sections.find(s => {
            const cat = s.category.toLowerCase()
            const scope = scopeOfWork.toLowerCase()
            return cat.includes(scope) || scope.includes(cat) || 
                   (scope === 'electrical' && cat === 'mep') ||
                   (scope === 'plumbing' && cat === 'mep')
          })
          if (section) {
            const items = data.items.filter(i => i.sectionId === section.id)
            const baseTotal = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0)
            // Apply 30% reduction as requested (Contoh 1.5M - 30% = 1.05M)
            const profitRate = (data.params?.profit || 30) / 100
            setPlannedLimit(baseTotal * (1 - profitRate))
          } else {
            setPlannedLimit(0)
          }
        }).catch(() => setPlannedLimit(0))
      } else {
        setPlannedLimit(0)
      }

      // Calculate scope-specific spending (using all PRs to ensure budget accuracy)
      if (scopeOfWork) {
        const allPRs = getAllPRs()
        const spent = allPRs
          .filter(pr => pr.project === project && pr.scopeOfWork === scopeOfWork && pr.status !== 'Rejected')
          .reduce((sum, pr) => sum + (pr.total || 0), 0)
        setScopeSpent(spent)
      } else {
        setScopeSpent(0)
      }
    }
  }, [project, scopeOfWork, projects, history])

  useEffect(() => {
    let all = getAllPRs().filter(p => !p.type || p.type === 'Purchase Request')

    if (currentUser && !canViewAll(currentUser.role)) {
      all = all.filter(pr => 
        pr.submittedBy === currentUser.name || 
        pr.submittedBy === currentUser.username ||
        pr.requestedBy === currentUser.name
      )
    }

    const sorted = getSortedPRs(all)
    setHistory(sorted)

    if (urlRefNo) {
      const existing = all.find(pr => pr.refNo === urlRefNo)
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

    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const random = Math.floor(1000 + Math.random() * 9000)
    setRefNo(`PR.${month}FRW.${random}`)
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
    setItems([...items, { id: `item-${Date.now()}`, description: '', descriptionImage: null, quantity: 1, unit: 'Lot', unitPrice: 0 }])
  }

  const removeItem = (id) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id))
  }

  const isAuthorized = canViewAll(currentUser?.role)

  const handleDelete = (ref) => {
    if (window.confirm(`Hapus PR ${ref} secara permanen?`)) {
      deletePR(ref)
      setHistory(getAllPRs().filter(p => !p.type || p.type === 'Purchase Request'))
      if (urlRefNo === ref) navigate('/forms/purchase-request')
    }
  }

  const handleSubmit = () => {
    if (!vendor || !project || !scopeOfWork) {
      setSubmitError('Harap lengkapi Vendor, Project, dan Scope of Work sebelum melanjutkan.')
      setSubmitStatus('error')
      return
    }

    const { totalReceived, allowedScopes, hasPayments } = getProjectFinancialStatus(project)
    const totalSpent = getProjectSpending(project)
    const newTotal = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0)

    if (!hasPayments) {
      setSubmitError('Project belum memiliki pembayaran masuk. PR tidak dapat disubmit.')
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
      setSubmitError(`Batas pengajuan terlampaui. Sisa plafon: Rp ${remaining.toLocaleString('id-ID')}. Total PR ini: Rp ${newTotal.toLocaleString('id-ID')}`)
      setSubmitStatus('error')
      return
    }

    // New validation: Enforce Planned Scope Limit
    if (plannedLimit > 0) {
      // Calculate how much has been spent on this SPECIFIC scope (global check)
      const allPRs = getAllPRs()
      const scopeSpentGlobal = allPRs
        .filter(pr => pr.project === project && pr.scopeOfWork === scopeOfWork && pr.status !== 'Rejected')
        .reduce((sum, pr) => sum + (pr.total || 0), 0)
      
      if (scopeSpentGlobal + newTotal > plannedLimit) {
        const remainingScope = plannedLimit - scopeSpentGlobal
        setSubmitError(`Pengajuan melebihi budget terencana untuk scope "${scopeOfWork}". Batas Budget (-30%): Rp ${plannedLimit.toLocaleString('id-ID')}. Sudah terpakai: Rp ${scopeSpentGlobal.toLocaleString('id-ID')}. Sisa: Rp ${remainingScope.toLocaleString('id-ID')}.`)
        setSubmitStatus('error')
        return
      }
    }

    const prData = {
      id: refNo,
      refNo,
      type: 'Purchase Request',
      date: currentDate,
      vendor, address, telephone, project,
      scopeOfWork,
      scopeOfWorkOther: scopeOfWork === 'Others' ? scopeOfWorkOther : '',
      items,
      total: newTotal,
      bankName, accountNo, accountHolder,
      requestedBy,
      status: 'Pending Approval',
      approval1: null,
      approval2: null,
    }
    submitPR(prData, currentUser, systemUsers)
    setStatus('Pending Approval')
    setSubmitStatus('success')
    setHistory(getSortedPRs(getAllPRs().filter(p => !p.type || p.type === 'Purchase Request')))
  }

  return (
    <div className="p-lg max-w-[1200px] mx-auto">
      <style>{`
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="flex justify-between items-center mb-8 no-print">
        <button onClick={() => navigate('/forms')} className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors">
          <span className="material-symbols-outlined">arrow_back</span> Back to Forms
        </button>
        <div className="flex gap-3">
          <button onClick={() => setViewHistory(!viewHistory)} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2">
            <span className="material-symbols-outlined">history</span> History
          </button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-primary text-white font-bold rounded shadow-sm hover:brightness-110 flex items-center gap-2">
            <span className="material-symbols-outlined">print</span> Print
          </button>
        </div>
      </div>

      {viewHistory && (
        <div className="no-print mb-8 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-black text-sm uppercase tracking-widest">Submitted PRs</h3>
            <button onClick={() => setViewHistory(false)} className="text-slate-400">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y">
            {history.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No history found</p>
            ) : (
              history.map(pr => (
                <div key={pr.refNo} onClick={() => { navigate(`/forms/purchase-request/${pr.refNo}`); setViewHistory(false); }} className="px-6 py-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900">{pr.refNo}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-500 font-medium">{pr.vendor} &bull; {pr.project}</p>
                      {pr.priorityStatus === 'Priority' && pr.status !== 'Paid' && (
                        <span className="text-[8px] font-black text-red-500 bg-red-50 px-1 rounded uppercase tracking-widest">Priority</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${pr.status === 'Fully Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {pr.status}
                    </span>
                    {isAuthorized && (
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(pr.refNo); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all">
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
        {isAuthorized && status !== 'Draft' && (
          <div className="absolute top-4 right-12 no-print">
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full">
              <span className="material-symbols-outlined text-sm">edit_note</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Power User Edit Mode</span>
            </div>
          </div>
        )}

        {status !== 'Draft' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] pointer-events-none z-10 opacity-[0.05] print:opacity-[0.05] whitespace-nowrap">
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

        <div className="text-center mb-12">
          <h1 className="text-3xl font-black tracking-[0.2em] border-b-4 border-slate-900 inline-block pb-2 uppercase">Purchase Request</h1>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-8 text-sm">
          <div className="space-y-1">
            <div className="flex"><span className="w-32 font-black uppercase">Vendor</span><span className="mr-2">:</span>
              <input className="flex-1 border-b border-transparent hover:border-slate-300 outline-none bg-transparent font-bold" value={vendor} onChange={e => (status === 'Draft' || isAuthorized) && setVendor(e.target.value)} readOnly={status !== 'Draft' && !isAuthorized} />
            </div>
            <div className="flex"><span className="w-32 font-black uppercase">Address</span><span className="mr-2">:</span>
              <input className="flex-1 border-b border-transparent hover:border-slate-300 outline-none bg-transparent font-bold" value={address} onChange={e => (status === 'Draft' || isAuthorized) && setAddress(e.target.value)} readOnly={status !== 'Draft' && !isAuthorized} />
            </div>
            <div className="flex"><span className="w-32 font-black uppercase">Telephone</span><span className="mr-2">:</span>
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
              <span className="w-32 font-black uppercase whitespace-nowrap">Scope Of Work</span><span className="mr-2">:</span>
              <div className="flex-1 flex flex-col gap-1">
                <select className={`w-full border-b border-transparent hover:border-slate-300 outline-none bg-transparent font-bold uppercase ${(status !== 'Draft' && !isAuthorized) ? 'cursor-default' : 'cursor-pointer'}`} value={scopeOfWork} onChange={(e) => (status === 'Draft' || isAuthorized) && setScopeOfWork(e.target.value)} disabled={status !== 'Draft' && !isAuthorized}>
                  <option value="">...</option>
                  {SCOPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {scopeOfWork === 'Others' && (
                  <input className="w-full border-b border-slate-200 outline-none bg-transparent text-xs font-bold italic" value={scopeOfWorkOther} onChange={(e) => (status === 'Draft' || isAuthorized) && setScopeOfWorkOther(e.target.value)} readOnly={status !== 'Draft' && !isAuthorized} />
                )}
              </div>
            </div>
          </div>
        </div>

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
                    Rp {(plannedLimit > 0 ? (plannedLimit - scopeSpent) : budgetStatus.totalReceived - currentSpent).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{plannedLimit > 0 ? `Sisa Budget ${scopeOfWork} (-30%)` : 'Remaining Limit'}</span>
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

        <table className="w-full border-2 border-slate-900 border-collapse mb-8 text-sm">
          <thead>
            <tr className="bg-slate-200 border-b-2 border-slate-900 font-black uppercase text-center">
              <th className="border-r-2 border-slate-900 px-2 py-3 w-16">No</th>
              <th className="border-r-2 border-slate-900 px-4 py-3">Description</th>
              <th className="border-r-2 border-slate-900 px-2 py-3 w-20">Qty</th>
              <th className="border-r-2 border-slate-900 px-2 py-3 w-24">Unit</th>
              <th className="border-r-2 border-slate-900 px-4 py-3 w-48">Price</th>
              <th className="px-4 py-3 w-48">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b-2 border-slate-900 last:border-b-0">
                <td className="border-r-2 border-slate-900 px-2 py-8 text-center align-top relative group">
                  {index + 1}
                  {(status === 'Draft' || isAuthorized) && items.length > 1 && (
                    <button onClick={() => removeItem(item.id)} className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 no-print transition-all shadow-lg"><span className="material-symbols-outlined text-[14px]">remove</span></button>
                  )}
                </td>
                <td className="border-r-2 border-slate-900 px-6 py-6 align-top">
                  <textarea className="w-full border-none outline-none bg-transparent italic font-medium" rows={2} value={item.description} onChange={e => (status === 'Draft' || isAuthorized) && handleItemChange(item.id, 'description', e.target.value)} readOnly={status !== 'Draft' && !isAuthorized} placeholder="Description..." />
                  {item.descriptionImage && <img src={item.descriptionImage} className="mt-4 max-w-xs rounded border shadow-sm" alt="attachment" />}
                  {(status === 'Draft' || isAuthorized) && !item.descriptionImage && (
                    <label className="mt-2 inline-block cursor-pointer px-3 py-1 bg-slate-100 rounded text-[10px] font-black uppercase tracking-widest no-print hover:bg-slate-200 transition-colors">
                      Attach Image <input type="file" className="hidden" onChange={e => handleImageUpload(item.id, e)} />
                    </label>
                  )}
                </td>
                <td className="border-r-2 border-slate-900 px-2 py-8 text-center align-top">
                  <input type="number" className="w-full text-center outline-none bg-transparent font-medium" value={item.quantity} onChange={e => (status === 'Draft' || isAuthorized) && handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} readOnly={status !== 'Draft' && !isAuthorized} />
                </td>
                <td className="border-r-2 border-slate-900 px-2 py-8 text-center align-top">
                  <input className="w-full text-center outline-none bg-transparent font-medium uppercase text-xs" value={item.unit} onChange={e => (status === 'Draft' || isAuthorized) && handleItemChange(item.id, 'unit', e.target.value)} readOnly={status !== 'Draft' && !isAuthorized} />
                </td>
                <td className="border-r-2 border-slate-900 px-4 py-8 text-center align-top">
                  <div className="flex items-center justify-between font-medium">
                    <span>Rp</span>
                    <input className="w-full text-right outline-none bg-transparent" value={item.unitPrice?.toLocaleString('id-ID') || ''} onChange={e => {
                      const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
                      handleItemChange(item.id, 'unitPrice', parseInt(raw) || 0)
                    }} readOnly={status !== 'Draft' && !isAuthorized} />
                  </div>
                </td>
                <td className="px-4 py-8 text-center align-top font-bold">
                  <div className="flex items-center justify-between"><span>Rp</span><span>{(item.unitPrice * item.quantity).toLocaleString('id-ID')}</span></div>
                </td>
              </tr>
            ))}
            {(status === 'Draft' || isAuthorized) && (
              <tr className="h-16 no-print">
                <td className="border-r-2 border-slate-900"></td>
                <td className="border-r-2 border-slate-900 text-center"><button onClick={addItem} className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-4 py-2 rounded hover:bg-slate-200 transition-colors">+ Add Line</button></td>
                <td colSpan={4}></td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 border-t-2 border-slate-900 font-black">
              <td colSpan={4} className="border-r-2 border-slate-900"></td>
              <td className="border-r-2 border-slate-900 px-4 py-3 text-right uppercase tracking-widest">Total:</td>
              <td className="px-4 py-3 text-center flex justify-between"><span>Rp</span><span>{items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0).toLocaleString('id-ID')}</span></td>
            </tr>
          </tfoot>
        </table>

        <div className="grid grid-cols-2 mt-12 text-sm">
          <div className="space-y-1">
            <p className="font-bold border-b border-slate-900 inline-block mb-2 uppercase">Requested By:</p>
            <input className="block w-full border-b border-transparent outline-none bg-transparent font-black uppercase text-xl mt-4" value={requestedBy} onChange={e => (status === 'Draft' || isAuthorized) && setRequestedBy(e.target.value)} readOnly={status !== 'Draft' && !isAuthorized} />
          </div>
          <div className="text-center pt-12 flex flex-col items-center">
            <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
            <p className="font-black uppercase tracking-[0.2em] text-[10px]">Authorized Signature</p>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t opacity-60 italic text-[10px] text-center uppercase tracking-[0.2em]">
          Electronic Document — Generated by PROMAN CMS
        </div>
      </div>

      {(status === 'Draft' || (isAuthorized && status !== 'Draft')) && (
        <div className="no-print mt-8 bg-white border border-slate-200 rounded-2xl p-6 flex justify-end gap-3 shadow-xl">
          <button onClick={() => navigate('/forms')} className="px-6 py-2.5 border rounded-lg font-bold text-xs uppercase tracking-widest">Cancel</button>
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
            <h3 className="font-black text-xl">PR Berhasil Dikirim!</h3>
            <p className="text-sm text-slate-500 font-medium">Purchase Request <span className="font-black text-primary">{refNo}</span> telah dikirim untuk approval.</p>
            <button onClick={() => navigate('/forms')} className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-black text-xs uppercase tracking-widest">Kembali ke Forms</button>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center flex flex-col items-center gap-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-xl text-slate-900">Submission Blocked</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{submitError}</p>
            </div>
            <button 
              onClick={() => { setSubmitStatus(null); setSubmitError(''); }} 
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Understand and Fix
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseRequest
