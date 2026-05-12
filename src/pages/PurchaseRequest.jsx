import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { submitPR, getAllPRs } from '../utils/prService'
import { canViewAll } from '../utils/rbac'

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
  const [descriptionImage, setDescriptionImage] = useState(null)
  const [vendor, setVendor] = useState('')
  const [address, setAddress] = useState('')
  const [telephone, setTelephone] = useState('')
  const [project, setProject] = useState('')
  const [scopeOfWork, setScopeOfWork] = useState('')
  const [scopeOfWorkOther, setScopeOfWorkOther] = useState('')
  const [items, setItems] = useState([
    { id: `item-${Date.now()}`, description: '', descriptionImage: null, quantity: 0, unit: '', unitPrice: 0 }
  ])
  const [bankName, setBankName] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [requestedBy, setRequestedBy] = useState('')
  const [approver, setApprover] = useState('')
  const [status, setStatus] = useState('Draft')
  const [submitStatus, setSubmitStatus] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [history, setHistory] = useState([])
  const [viewHistory, setViewHistory] = useState(false)
  const [prType, setPrType] = useState('Made to order')

  useEffect(() => {
    let all = getAllPRs()

    // Filter if user is not privileged to see all
    if (currentUser && !canViewAll(currentUser.role)) {
      all = all.filter(pr => 
        pr.submittedBy === currentUser.name || 
        pr.submittedBy === currentUser.username ||
        pr.requestedBy === currentUser.name
      )
    }

    const sorted = [...all].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
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
        if (existing.items && existing.items.length > 0) {
          setItems(existing.items)
        } else {
          // Backward compatibility for legacy single-item PRs
          setItems([{
            id: 'legacy-item',
            description: existing.description || '',
            descriptionImage: existing.descriptionImage || null,
            quantity: existing.quantity || 0,
            unitPrice: existing.unitPrice || 0
          }])
        }
        setBankName(existing.bankName || '')
        setAccountNo(existing.accountNo || '')
        setAccountHolder(existing.accountHolder || '')
        setRequestedBy(existing.requestedBy || existing.submittedBy || '')
        setPrType(existing.prType || 'Made to order')
        setStatus(existing.status)
        return
      }
    }

    // New PR — auto-fill requestedBy from currentUser
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const random = Math.floor(1000 + Math.random() * 9000)
    setRefNo(`PR.${month}FRW.${random}`)
    setRequestedBy(currentUser?.name || currentUser?.username || '')
    setStatus('Draft')
  }, [urlRefNo, currentUser])

  // Auto-print if navigated via Print action
  useEffect(() => {
    if (hash === '#print' && status !== 'Draft') {
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [hash, status])

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleImageUpload = (id, e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        handleItemChange(id, 'descriptionImage', reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const addItem = () => {
    setItems([...items, { id: `item-${Date.now()}`, description: '', descriptionImage: null, quantity: 0, unit: '', unitPrice: 0 }])
  }

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const handleSubmit = () => {
    if (!vendor || !project) {
      setSubmitError('Vendor dan Project harus diisi.')
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus(null), 4000)
      return
    }
    const prData = {
      id: refNo,
      refNo,
      date: currentDate,
      vendor, address, telephone, project,
      scopeOfWork,
      scopeOfWorkOther: scopeOfWork === 'Others' ? scopeOfWorkOther : '',
      prType,
      items,
      total: items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0),
      bankName, accountNo, accountHolder,
      requestedBy,
    }
    submitPR(prData, currentUser, systemUsers)
    setStatus('Pending Approval')
    setSubmitStatus('success')
    setHistory(getAllPRs().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount).replace('Rp', 'Rp ')
  }

  return (
    <div className="p-lg max-w-[1200px] mx-auto">
      <style>{`
        @media print {
          .desc-img-container {
            border: none !important;
            padding: 0 !important;
            min-height: unset !important;
            display: block !important;
          }
          .desc-img-container img {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-8 no-print action-bar">
        <button 
          onClick={() => navigate('/forms')}
          className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Forms
        </button>
        <div className="flex gap-3">
          {urlRefNo && (
            <button 
              onClick={() => navigate('/forms/purchase-request')}
              className="px-6 py-2 bg-white border border-slate-200 text-primary font-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              New PR
            </button>
          )}
          <button 
            onClick={() => setViewHistory(!viewHistory)}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">history</span>
            PR History
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 py-2 bg-primary text-white font-bold rounded shadow-sm hover:brightness-110 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">print</span>
            Print PDF
          </button>
        </div>
      </div>

      {/* History Panel */}
      {viewHistory && (
        <div className="no-print mb-8 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Submitted Purchase Requests</h3>
            <button onClick={() => setViewHistory(false)} className="text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {history.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No PR history found</p>
            ) : (
              history
                .filter((pr, index, self) => self.findIndex(p => p.refNo === pr.refNo) === index)
                .map(pr => (
                <div 
                  key={pr.refNo} 
                  onClick={() => { navigate(`/forms/purchase-request/${pr.refNo}`); setViewHistory(false); }}
                  className="px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{pr.refNo}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{pr.vendor} &bull; {pr.project}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      pr.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                      pr.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {pr.status}
                    </span>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">arrow_forward</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="bg-white shadow-2xl border border-slate-200 p-12 min-h-[1200px] text-slate-900 relative overflow-hidden print:shadow-none print:border-none print:p-0">
        
        {/* Watermarks */}
        {status !== 'Draft' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] pointer-events-none z-10 opacity-30 print:opacity-30 whitespace-nowrap">
            <div className={`border-[20px] rounded-[40px] px-24 py-12 ${
              status === 'Paid' ? 'border-emerald-500 text-emerald-500' :
              status.includes('Approved') ? 'border-green-600 text-green-600' :
              status.includes('Reject') ? 'border-red-600 text-red-600' :
              'border-amber-500 text-amber-500'
            }`}>
              <span className="text-[90px] md:text-[120px] font-black uppercase tracking-[0.3em]">
                {status === 'Paid' ? 'PAID' : status.includes('Approved') ? 'APPROVED' : status.includes('Reject') ? 'REJECTED' : 'PENDING'}
              </span>
            </div>
          </div>
        )}
        
        {/* Header Title */}
        <div className="text-center mb-12 relative flex flex-col items-center">
          <h1 className="text-3xl font-black tracking-[0.2em] border-b-4 border-slate-900 inline-block pb-2 uppercase">Purchase Request</h1>
          
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type :</span>
            <select
              className={`bg-transparent font-black text-xs uppercase tracking-widest outline-none border-b border-transparent hover:border-slate-300 focus:border-primary transition-colors cursor-pointer ${status !== 'Draft' ? 'pointer-events-none' : ''}`}
              value={prType}
              onChange={(e) => setPrType(e.target.value)}
              disabled={status !== 'Draft'}
            >
              <option value="Made to order">Made to order</option>
              <option value="Cash and carry">Cash and carry</option>
            </select>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-8 text-sm">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 font-black uppercase">Vendor</span>
              <span className="mr-2">:</span>
              <input 
                className={`flex-1 border-b border-transparent hover:border-slate-300 focus:border-primary outline-none bg-transparent font-bold ${status !== 'Draft' ? 'cursor-default' : ''}`} 
                value={vendor}
                onChange={(e) => status === 'Draft' && setVendor(e.target.value)}
                readOnly={status !== 'Draft'}
                placeholder="..."
              />
            </div>
            <div className="flex">
              <span className="w-32 font-black uppercase">Address</span>
              <span className="mr-2">:</span>
              <input 
                className={`flex-1 border-b border-transparent hover:border-slate-300 focus:border-primary outline-none bg-transparent font-bold ${status !== 'Draft' ? 'cursor-default' : ''}`} 
                value={address}
                onChange={(e) => status === 'Draft' && setAddress(e.target.value)}
                readOnly={status !== 'Draft'}
                placeholder="..."
              />
            </div>
            <div className="flex">
              <span className="w-32 font-black uppercase">Telephone</span>
              <span className="mr-2">:</span>
              <input 
                className={`flex-1 border-b border-transparent hover:border-slate-300 focus:border-primary outline-none bg-transparent font-bold ${status !== 'Draft' ? 'cursor-default' : ''}`} 
                value={telephone}
                onChange={(e) => status === 'Draft' && setTelephone(e.target.value)}
                readOnly={status !== 'Draft'}
                placeholder="..."
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 font-black uppercase">Date</span>
              <span className="mr-2">:</span>
              <span className="font-bold">{currentDate}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-black uppercase">Reff</span>
              <span className="mr-2">:</span>
              <span className="font-bold">{refNo}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-black uppercase">Project</span>
              <span className="mr-2">:</span>
              <select
                className={`flex-1 border-b border-transparent hover:border-slate-300 focus:border-primary outline-none bg-transparent font-bold uppercase ${status !== 'Draft' ? 'cursor-default' : 'cursor-pointer'}`}
                value={project}
                onChange={(e) => status === 'Draft' && setProject(e.target.value)}
                disabled={status !== 'Draft'}
              >
                <option value="">...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name} — {p.code}</option>
                ))}
              </select>
            </div>
            <div className="flex">
              <span className="w-32 font-black uppercase whitespace-nowrap">Scope Of Work</span>
              <span className="mr-2">:</span>
              <div className="flex-1 flex flex-col gap-1">
                <select
                  className={`w-full border-b border-transparent hover:border-slate-300 focus:border-primary outline-none bg-transparent font-bold uppercase ${status !== 'Draft' ? 'cursor-default' : 'cursor-pointer'}`}
                  value={scopeOfWork}
                  onChange={(e) => status === 'Draft' && setScopeOfWork(e.target.value)}
                  disabled={status !== 'Draft'}
                >
                  <option value="">...</option>
                  {SCOPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {scopeOfWork === 'Others' && (
                  <input
                    className="w-full border-b border-slate-200 focus:border-primary outline-none bg-transparent text-xs font-bold italic"
                    placeholder="Sebutkan scope lainnya..."
                    value={scopeOfWorkOther}
                    onChange={(e) => status === 'Draft' && setScopeOfWorkOther(e.target.value)}
                    readOnly={status !== 'Draft'}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-2 border-slate-900 border-collapse mb-8 text-sm">
          <thead>
            <tr className="bg-slate-200 border-b-2 border-slate-900">
              <th className="border-r-2 border-slate-900 px-2 py-3 w-16 text-center uppercase font-black">No</th>
              <th className="border-r-2 border-slate-900 px-4 py-3 text-center uppercase font-black">Description</th>
              <th className="border-r-2 border-slate-900 px-2 py-3 w-20 text-center uppercase font-black">Qtty</th>
              <th className="border-r-2 border-slate-900 px-2 py-3 w-20 text-center uppercase font-black">Unit</th>
              <th className="border-r-2 border-slate-900 px-4 py-3 w-44 text-center uppercase font-black">Unit Price</th>
              <th className="px-4 py-3 w-44 text-center uppercase font-black">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="relative group border-b-2 border-slate-900 last:border-b-0">
                <td className="border-r-2 border-slate-900 px-2 py-8 text-center align-top font-medium relative group">
                  {index + 1}
                  {status === 'Draft' && items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity no-print"
                    >
                      <span className="material-symbols-outlined text-[14px]">remove</span>
                    </button>
                  )}
                </td>
                <td className="border-r-2 border-slate-900 px-6 py-6 align-top">
                  <div className="flex flex-col gap-4">
                    <textarea 
                      className="w-full border border-transparent focus:border-primary/30 focus:bg-primary/5 rounded p-2 focus:ring-0 outline-none resize-none font-medium text-slate-700 italic text-left bg-transparent transition-colors"
                      placeholder="Material Electrical Frenchwalk Apartment..."
                      rows={2}
                      value={item.description}
                      onChange={(e) => status === 'Draft' && handleItemChange(item.id, 'description', e.target.value)}
                      readOnly={status !== 'Draft'}
                    ></textarea>

                    {item.descriptionImage ? (
                      <div className="desc-img-container relative group border border-slate-200 rounded p-2 flex flex-col items-center justify-center">
                        <div className="relative w-full">
                          <img src={item.descriptionImage} alt="Attachment" className="w-full h-auto block shadow-sm rounded" />
                          {status === 'Draft' && (
                            <button 
                              onClick={() => handleItemChange(item.id, 'descriptionImage', null)}
                              className="no-print absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      status === 'Draft' && (
                        <div className="text-left no-print">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded text-[10px] font-black uppercase tracking-widest transition-colors">
                            <span className="material-symbols-outlined text-[14px]">add_photo_alternate</span>
                            Attach Image (Optional)
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(item.id, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )
                    )}
                  </div>
                </td>
                <td className="border-r-2 border-slate-900 px-2 py-8 text-center align-top">
                  <input 
                    type="number" 
                    className="w-full text-center border-none focus:ring-0 outline-none bg-transparent font-medium"
                    value={item.quantity}
                    onChange={(e) => status === 'Draft' && handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    readOnly={status !== 'Draft'}
                  />
                </td>
                <td className="border-r-2 border-slate-900 px-2 py-8 text-center align-top">
                  <input 
                    type="text" 
                    className="w-full text-center border-none focus:ring-0 outline-none bg-transparent font-medium uppercase text-xs"
                    placeholder="..."
                    value={item.unit || ''}
                    onChange={(e) => status === 'Draft' && handleItemChange(item.id, 'unit', e.target.value)}
                    readOnly={status !== 'Draft'}
                  />
                </td>
                <td className="border-r-2 border-slate-900 px-4 py-8 text-center align-top">
                  <div className="flex items-center justify-between font-medium tabular-nums">
                    <span>Rp</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      className="w-full text-right border-none focus:ring-0 outline-none bg-transparent font-medium tabular-nums"
                      value={item.unitPrice === 0 ? '' : item.unitPrice.toLocaleString('id-ID')}
                      onChange={(e) => {
                        if (status !== 'Draft') return;
                        const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                        handleItemChange(item.id, 'unitPrice', parseInt(raw) || 0);
                      }}
                      readOnly={status !== 'Draft'}
                      placeholder="0"
                    />
                  </div>
                </td>
                <td className="px-4 py-8 text-center align-top relative group">
                  <div className="flex items-center justify-between font-bold tabular-nums">
                    <span>Rp</span>
                    <span>{(item.unitPrice * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                </td>
              </tr>
            ))}
            {/* Empty space filler */}
            <tr className="h-20">
              <td className="border-r-2 border-slate-900"></td>
              <td className="border-r-2 border-slate-900 relative">
                {status === 'Draft' && (
                  <div className="absolute inset-0 flex items-center justify-center no-print">
                    <button
                      onClick={addItem}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Add Line Item
                    </button>
                  </div>
                )}
              </td>
              <td className="border-r-2 border-slate-900"></td>
              <td className="border-r-2 border-slate-900"></td>
              <td className="border-r-2 border-slate-900"></td>
              <td></td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 border-t-2 border-slate-900 font-black">
              <td colSpan={3} className="border-r-2 border-slate-900"></td>
              <td className="border-r-2 border-slate-900 px-4 py-3 text-right uppercase tracking-widest">Total:</td>
              <td className="px-4 py-3 text-center tabular-nums">
                <div className="flex items-center justify-between">
                  <span>Rp</span>
                  <span>{items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0).toLocaleString('id-ID')}</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer Info */}
        <div className="grid grid-cols-2 mt-12 text-sm">
          <div className="space-y-1">
            <p className="font-bold border-b border-slate-900 inline-block mb-2">Payment transfer to:</p>
            <input 
              className="block w-full border-b border-transparent hover:border-slate-300 focus:border-primary outline-none bg-transparent font-medium" 
              placeholder="BANK NAME" 
              value={bankName}
              onChange={(e) => status === 'Draft' && setBankName(e.target.value)}
              readOnly={status !== 'Draft'}
            />
            <input 
              className="block w-full border-b border-transparent hover:border-slate-300 focus:border-primary outline-none bg-transparent font-medium" 
              placeholder="Account No: XXXX-XXXX-XX" 
              value={accountNo}
              onChange={(e) => status === 'Draft' && setAccountNo(e.target.value)}
              readOnly={status !== 'Draft'}
            />
            <input 
              className="block w-full border-b border-transparent hover:border-slate-300 focus:border-primary outline-none bg-transparent font-medium uppercase" 
              placeholder="a/n Account Holder" 
              value={accountHolder}
              onChange={(e) => status === 'Draft' && setAccountHolder(e.target.value)}
              readOnly={status !== 'Draft'}
            />
          </div>
          <div className="text-center pt-12">
            <p className="font-black uppercase mb-16 tracking-widest">Requested By:</p>
            <input 
              className="block w-full border-b-2 border-slate-900 outline-none bg-transparent font-black text-center uppercase pb-1" 
              placeholder="ENTER NAME HERE" 
              value={requestedBy}
              onChange={(e) => status === 'Draft' && setRequestedBy(e.target.value)}
              readOnly={status !== 'Draft'}
            />
          </div>
        </div>

        {/* System Footer */}
        <div className="mt-20 pt-8 border-t border-slate-100 opacity-60 italic text-[10px] text-slate-700 text-center uppercase tracking-[0.2em] font-light">
          This document is electronically generated and managed by PROMAN Construction Management System
        </div>
      </div>

      {/* ── Submit Panel (no-print) ── */}
      {status === 'Draft' && (
        <div className="no-print mt-8 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow">
            <span className="material-symbols-outlined text-white text-sm">send</span>
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">Submit for Approval</h3>
            <p className="text-[10px] text-slate-500 font-medium">Kirim Purchase Request ini ke approver untuk direview dan disetujui.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Requested By</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2 text-xs font-bold outline-none focus:border-primary text-slate-900"
              placeholder="Nama pemohon..."
              value={requestedBy}
              onChange={e => setRequestedBy(e.target.value)}
            />
          </div>

          {/* Auto-routing info */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-blue-400 text-lg mt-0.5">info</span>
            <div>
              <p className="text-xs font-bold text-blue-700">Notifikasi otomatis akan dikirim ke:</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {systemUsers.filter(u => ['Director', 'Senior Project Manager'].includes(u.role) && u.status === 'Active').map(u => (
                  <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-blue-200 text-blue-700 rounded-full text-[10px] font-black">
                    <span className="material-symbols-outlined text-[12px]">person</span>
                    {u.username} — {u.role}
                  </span>
                ))}
                {systemUsers.filter(u => ['Director', 'Senior Project Manager'].includes(u.role) && u.status === 'Active').length === 0 && (
                  <span className="text-[10px] text-blue-400 font-medium">Tidak ada approver aktif ditemukan</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {submitStatus === 'error' && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <span className="material-symbols-outlined text-red-500 text-lg">error</span>
            <p className="text-xs font-bold text-red-600">{submitError}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate('/forms')}
            className="px-6 py-2.5 border border-slate-200 text-slate-500 rounded-lg font-bold text-xs hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110 hover:-translate-y-0.5 transition-all"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            Submit for Approval
          </button>
        </div>
      </div>
      )}

      {/* ── Success Modal ── */}
      {submitStatus === 'success' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
            </div>
            <h3 className="font-black text-xl text-slate-900">PR Berhasil Dikirim!</h3>
            <p className="text-sm text-slate-500 font-medium">
              Purchase Request <span className="font-black text-primary">{refNo}</span> telah dikirimkan kepada <span className="font-black text-slate-700">{approver}</span> untuk direview dan disetujui.
            </p>
            <div className="bg-slate-50 rounded-xl px-6 py-3 text-xs font-bold text-slate-500 border border-slate-100 mt-1">
              Status: <span className="text-amber-500 font-black">PENDING APPROVAL</span>
            </div>
            <div className="mt-4 w-full">
              <button
                onClick={() => navigate('/forms')}
                className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Kembali ke Forms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseRequest
