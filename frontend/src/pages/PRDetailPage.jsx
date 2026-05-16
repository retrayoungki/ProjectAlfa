import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { canApprove, getApprovalLevel, canViewAll } from '../utils/rbac'
import { getAllPRs, applyApproval, applyPayment, computeStatus, STATUS_STYLES } from '../utils/prService'

const PRDetailPage = ({ currentUser, systemUsers = [] }) => {
  const navigate = useNavigate()
  const { prId } = useParams()
  const [pr, setPr] = useState(null)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)
  const [paymentImage, setPaymentImage] = useState(null)
  const [selectedPriority, setSelectedPriority] = useState('Reguler')

  const loadPR = () => {
    let all = getAllPRs()
    
    // Filter if user is not privileged to see all
    if (currentUser && !canViewAll(currentUser.role)) {
      all = all.filter(p => 
        p.submittedBy === currentUser.name || 
        p.submittedBy === currentUser.username ||
        p.requestedBy === currentUser.name
      )
    }

    const found = all.find(p => p.refNo === prId || p.id === prId)
    setPr(found || null)
  }

  useEffect(() => { 
    loadPR() 
  }, [prId])

  useEffect(() => {
    if (pr && pr.priorityStatus) {
      setSelectedPriority(pr.priorityStatus)
    }
  }, [pr])

  const userRole    = currentUser?.role
  const approverLevel = getApprovalLevel(userRole)
  const userCanApprove = canApprove(userRole)
  const isAdmin = userRole === 'Admin'

  // Check if this user's level is already used
  const alreadyActed = () => {
    if (!pr) return false
    if (approverLevel === 1) return !!pr.approval1
    if (approverLevel === 2) return !!pr.approval2
    return false
  }

  // Can only act if PR is still pending relevant stage
  const canAct = userCanApprove && !alreadyActed() && pr?.status !== 'Fully Approved' && pr?.status !== 'Rejected' && pr?.status !== 'Paid'
  
  // Admin can pay only when Fully Approved and not yet paid
  const canPay = isAdmin && pr?.approval2?.decision === 'Approved' && !pr?.payment?.paidAt

  const handleDecision = (decision) => {
    if (!currentUser || !pr) return
    setActionLoading(decision)
    setTimeout(() => {
      const updated = applyApproval(pr.refNo, currentUser, decision, comment, systemUsers, selectedPriority)
      if (updated) {
        setPr({ ...updated })
        setToast({ type: decision === 'Approved' ? 'success' : decision === 'Rejected' ? 'error' : 'info', message: `PR ${decision} berhasil.` })
        setComment('')
      }
      setActionLoading(null)
    }, 700)
  }

  const handlePayment = () => {
    if (!currentUser || !pr) return
    setActionLoading('paying')
    setTimeout(() => {
      const updated = applyPayment(pr.refNo, currentUser, comment, paymentImage)
      if (updated) {
        setPr({ ...updated })
        setToast({ type: 'success', message: 'Payment berhasil dicatat. PR sekarang berstatus PAID.' })
        setComment('')
        setPaymentImage(null)
      } else {
        setToast({ type: 'error', message: 'Gagal mencatat payment.' })
      }
      setActionLoading(null)
    }, 700)
  }

  const handlePaymentImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPaymentImage(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const formatCurrency = (v) =>
    `Rp ${Number(v || 0).toLocaleString('id-ID')}`

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const statusStyle = pr ? (STATUS_STYLES[pr.status] || 'bg-slate-100 text-slate-500 border-slate-200') : ''

  if (!pr) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <span className="material-symbols-outlined text-slate-300 text-6xl">receipt_long</span>
      <p className="font-black text-slate-400 text-lg">PR tidak ditemukan</p>
      <button onClick={() => navigate(-1)} className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
        <span className="material-symbols-outlined text-lg">arrow_back</span> Kembali
      </button>
    </div>
  )

  return (
    <div className={`p-lg max-w-[1200px] mx-auto space-y-6 pr-print-root${pr.payment?.paidAt ? ' is-paid' : ''}`}>
      {/* PAID Watermark — print only */}
      {pr.payment?.paidAt && (
        <style>{`
          @media print {
            .pr-print-root::before {
              content: 'PAID';
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 160px;
              font-weight: 900;
              color: rgba(16, 185, 129, 0.3);
              letter-spacing: 0.1em;
              pointer-events: none;
              z-index: 9999;
              font-family: Arial, sans-serif;
            }
          }
        `}</style>
      )}
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-bold animate-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
          toast.type === 'error'   ? 'bg-red-50 border-red-200 text-red-700' :
                                     'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <span className="material-symbols-outlined">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'cancel' : 'info'}
          </span>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-500 hover:text-secondary-container font-bold transition-colors text-sm">
          <span className="material-symbols-outlined">arrow_back</span>
          Kembali
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">receipt_long</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-primary tracking-tight">{pr.refNo}</h1>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{pr.type === 'Cash Request' ? 'Cash Request Detail' : 'Purchase Request Detail'}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${statusStyle}`}>
          {pr.status}
        </span>
        {pr.priorityStatus === 'Priority' && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-600 border border-red-200 animate-pulse">
            <span className="material-symbols-outlined text-[14px]">priority_high</span>
            PRIORITY
          </span>
        )}
      </div>

      {/* PR Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Informasi PR</h3>
          <p className="text-xs text-slate-400 font-bold">{formatDate(pr.submittedAt)}</p>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 text-sm">
          {[
            ['Vendor',        pr.vendor || '—'],
            ['Project',       pr.project || '—'],
            ['Type',          pr.prType || 'Made to order'],
            ['Alamat',        pr.address || '—'],
            ['Telepon',       pr.telephone || '—'],
            ['Scope of Work', pr.scopeOfWork === 'Others' ? (pr.scopeOfWorkOther || 'Others') : (pr.scopeOfWork || '—')],
            ['Diajukan Oleh', pr.submittedBy || pr.requestedBy || '—'],
            ['Bank',          pr.bankName || '—'],
            ['No. Rekening',  pr.accountNo || '—'],
            ['Atas Nama',     pr.accountHolder || '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
              <p className="font-bold text-slate-900">{val}</p>
            </div>
          ))}
        </div>

        {/* Items List */}
        <div className="border-t border-slate-200">
          {(pr.items && pr.items.length > 0 ? pr.items : [{
            id: 'legacy-item',
            description: pr.description || '',
            descriptionImage: pr.descriptionImage || null,
            quantity: pr.quantity || 0,
            unitPrice: pr.unitPrice || 0
          }]).map((item, idx) => (
            <div key={item.id} className={`flex flex-col md:flex-row gap-6 p-6 ${idx !== 0 ? 'border-t border-slate-100' : ''}`}>
              <div className="w-12 h-12 bg-slate-100 text-slate-400 font-black rounded-xl flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deskripsi Item</p>
                  <p className="font-bold text-slate-700 italic">{item.description || 'Tanpa deskripsi'}</p>
                </div>
                {item.descriptionImage && (
                  <img src={item.descriptionImage} alt="attachment" className="max-w-xs rounded-xl border border-slate-200 shadow-sm" />
                )}
              </div>
              <div className="w-full md:w-48 bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col justify-center">
                <div className="mb-2">
                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-0.5">
                    {pr.type === 'Cash Request' ? 'Cash Price' : 'Qty × Harga Satuan'}
                  </p>
                  <p className="font-bold text-slate-700">
                    {pr.type === 'Cash Request' 
                      ? formatCurrency(item.cashPrice) 
                      : `${item.quantity} ${item.unit || ''} × ${formatCurrency(item.unitPrice)}`
                    }
                  </p>
                </div>
                <div className="pt-2 border-t border-primary/10">
                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-0.5">Subtotal</p>
                  <p className="text-lg font-black text-primary">
                    {formatCurrency(pr.type === 'Cash Request' ? item.cashPrice : item.quantity * item.unitPrice)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Grand Total Row */}
        <div className="bg-primary/5 px-6 py-4 border-t border-primary/10 flex items-center justify-between">
          <p className="text-xs font-black text-primary/60 uppercase tracking-widest">Grand Total</p>
          <p className="text-2xl font-black text-primary">{formatCurrency(pr.total)}</p>
        </div>
      </div>

      {/* Approval Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Timeline Approval</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Step 1 — Senior PM */}
          <ApprovalStep
            level={1}
            label="Approval 1 — Senior Project Manager"
            entry={pr.approval1}
            isPending={!pr.approval1}
          />
          {/* Step 2 — Director */}
          <ApprovalStep
            level={2}
            label="Approval 2 — Director (Final)"
            entry={pr.approval2}
            isPending={!pr.approval2}
            locked={!pr.approval1}
          />
          {/* Step 3 — Payment (Admin only) */}
          <PaymentStep
            payment={pr.payment}
            pr={pr}
            locked={pr.approval2?.decision !== 'Approved'}
          />
        </div>
      </div>

      {/* Payment Action Panel — Admin only, shown when Fully Approved */}
      {isAdmin && (
        <div className={`bg-white border-2 rounded-2xl shadow-sm overflow-hidden ${
          canPay ? 'border-emerald-300' : 'border-slate-200 opacity-70'
        }`}>
          <div className={`px-6 py-4 border-b flex items-center gap-3 ${
            canPay ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`material-symbols-outlined ${
              pr.payment?.paidAt ? 'text-emerald-600' : canPay ? 'text-emerald-500' : 'text-slate-400'
            }`}>
              {pr.payment?.paidAt ? 'check_circle' : canPay ? 'payments' : 'lock'}
            </span>
            <div>
              <h3 className={`font-black text-sm ${
                pr.payment?.paidAt ? 'text-emerald-700' : canPay ? 'text-emerald-700' : 'text-slate-500'
              }`}>
                {pr.payment?.paidAt
                  ? `Payment telah dicatat oleh ${pr.payment.by}`
                  : canPay
                  ? 'Konfirmasi Payment — Admin'
                  : 'Menunggu Final Approval sebelum Payment'}
              </h3>
              {pr.payment?.paidAt && (
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  {new Date(pr.payment.paidAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {canPay && (
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  Hanya <span className="font-black text-slate-600">Admin</span> yang dapat mengkonfirmasi payment ini
                </p>
              )}
            </div>
          </div>

          {canPay && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Catatan Payment (opsional)</label>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Contoh: Transfer via BCA, No. Ref 12345..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bukti Transfer (JPG/PNG)</label>
                  <div className="relative group h-[78px]">
                    {paymentImage ? (
                      <div className="relative h-full w-full rounded-xl overflow-hidden border border-emerald-200 shadow-sm">
                        <img src={paymentImage} className="w-full h-full object-cover" alt="Proof" />
                        <button onClick={() => setPaymentImage(null)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-full w-full border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-all">
                        <span className="material-symbols-outlined text-slate-400">add_photo_alternate</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attach Proof</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handlePaymentImageUpload} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handlePayment}
                disabled={!!actionLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all shadow-sm disabled:opacity-60 uppercase tracking-widest text-xs"
              >
                {actionLoading === 'paying'
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-lg">payments</span>
                }
                Confirm Payment
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Panel — only for approvers who can still act */}
      {userCanApprove && (
        <div className={`bg-white border-2 rounded-2xl shadow-sm overflow-hidden ${
          canAct ? 'border-primary/30' : 'border-slate-200 opacity-70'
        }`}>
          <div className={`px-6 py-4 border-b flex items-center gap-3 ${canAct ? 'bg-primary/5 border-primary/10' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`material-symbols-outlined ${canAct ? 'text-primary' : 'text-slate-400'}`}>
              {canAct ? 'how_to_vote' : 'lock'}
            </span>
            <div>
              <h3 className={`font-black text-sm ${canAct ? 'text-primary' : 'text-slate-500'}`}>
                {canAct
                  ? `Berikan Keputusan — Approval ${approverLevel}`
                  : alreadyActed()
                  ? `Kamu sudah memberikan keputusan (Approval ${approverLevel})`
                  : 'Approval tidak tersedia'}
              </h3>
              {canAct && (
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  Keputusan kamu sebagai <span className="font-black text-slate-600">{userRole}</span> akan direkam ke timeline
                </p>
              )}
            </div>
          </div>

          {canAct && (
            <div className="p-6 space-y-6">
              {/* Priority Selector for Level 1 (Senior PM) */}
              {approverLevel === 1 && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal Urgensi Pembayaran</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedPriority('Priority')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-widest ${
                        selectedPriority === 'Priority'
                          ? 'bg-red-50 border-red-500 text-red-600 shadow-md'
                          : 'bg-white border-slate-100 text-slate-400 grayscale opacity-60 hover:opacity-100'
                      }`}
                    >
                      <span className="material-symbols-outlined">priority_high</span>
                      Priority (Red)
                    </button>
                    <button
                      onClick={() => setSelectedPriority('Reguler')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-widest ${
                        selectedPriority === 'Reguler'
                          ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-md'
                          : 'bg-white border-slate-100 text-slate-400 grayscale opacity-60 hover:opacity-100'
                      }`}
                    >
                      <span className="material-symbols-outlined">check</span>
                      Reguler (Blue)
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">"Status Priority akan membuat PR ini berada di urutan teratas pada dashboard Director/Admin."</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Komentar / Catatan (opsional)</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tambahkan catatan untuk keputusan ini..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDecision('Approved')}
                  disabled={!!actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl transition-all shadow-sm disabled:opacity-60 uppercase tracking-widest text-xs"
                >
                  {actionLoading === 'Approved'
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-lg">check_circle</span>
                  }
                  Approved
                </button>
                <button
                  onClick={() => handleDecision('Pending')}
                  disabled={!!actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-400 hover:bg-amber-500 text-white font-black rounded-xl transition-all shadow-sm disabled:opacity-60 uppercase tracking-widest text-xs"
                >
                  {actionLoading === 'Pending'
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-lg">pause_circle</span>
                  }
                  Pending
                </button>
                <button
                  onClick={() => handleDecision('Rejected')}
                  disabled={!!actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-all shadow-sm disabled:opacity-60 uppercase tracking-widest text-xs"
                >
                  {actionLoading === 'Rejected'
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-lg">cancel</span>
                  }
                  Rejected
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View-only message for non-approvers */}
      {!userCanApprove && !isAdmin && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
          <span className="material-symbols-outlined text-slate-400 text-2xl">info</span>
          <div>
            <p className="font-black text-slate-600 text-sm">View Only</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Sebagai <span className="font-bold">{userRole}</span>, kamu hanya dapat melihat detail dan status PR ini.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Approval Step Component ──────────────────────────────────────────────────

const ApprovalStep = ({ level, label, entry, isPending, locked }) => {
  const decisionColor = !entry ? 'text-slate-400' :
    entry.decision === 'Approved' ? 'text-green-600' :
    entry.decision === 'Rejected' ? 'text-red-500' : 'text-amber-500'

  const stepBg = !entry ? (locked ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200') :
    entry.decision === 'Approved' ? 'bg-green-50 border-green-200' :
    entry.decision === 'Rejected' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'

  const icon = !entry ? (locked ? 'lock' : 'schedule') :
    entry.decision === 'Approved' ? 'check_circle' :
    entry.decision === 'Rejected' ? 'cancel' : 'pause_circle'

  const iconColor = !entry ? (locked ? 'text-slate-300' : 'text-amber-400') :
    entry.decision === 'Approved' ? 'text-green-500' :
    entry.decision === 'Rejected' ? 'text-red-500' : 'text-amber-500'

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border ${stepBg}`}>
      <span className={`material-symbols-outlined text-2xl mt-0.5 ${iconColor}`}>{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{label}</p>
          {entry && (
            <span className={`text-xs font-black ${decisionColor}`}>{entry.decision}</span>
          )}
        </div>
        {entry ? (
          <div className="mt-1.5 space-y-1">
            <p className="text-xs font-bold text-slate-600">
              {entry.by} · <span className="text-slate-400 font-medium">{new Date(entry.at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </p>
            {entry.comment && (
              <p className="text-xs text-slate-500 italic border-l-2 border-slate-300 pl-2">"{entry.comment}"</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {locked ? 'Menunggu Approval 1 terlebih dahulu' : 'Menunggu keputusan...'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Payment Step Component ──────────────────────────────────────────────

const PaymentStep = ({ payment, pr, locked }) => {
  const stepBg = payment?.paidAt
    ? 'bg-emerald-50 border-emerald-200'
    : locked
    ? 'bg-slate-50 border-slate-200'
    : 'bg-amber-50 border-amber-200'

  const icon = payment?.paidAt ? 'payments' : locked ? 'lock' : 'schedule'
  const iconColor = payment?.paidAt ? 'text-emerald-500' : locked ? 'text-slate-300' : 'text-amber-400'

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border ${stepBg}`}>
      <span className={`material-symbols-outlined text-2xl mt-0.5 ${iconColor}`}>{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Payment — Admin</p>
          {payment?.paidAt && (
            <span className="text-xs font-black text-emerald-600">Paid</span>
          )}
        </div>
        {payment?.paidAt ? (
          <div className="mt-1.5 space-y-1">
            <p className="text-xs font-bold text-slate-600">
              {payment.by} · <span className="text-slate-400 font-medium">{new Date(payment.paidAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </p>
            {payment.notes && (
              <p className="text-xs text-slate-500 italic border-l-2 border-emerald-300 pl-2">"{payment.notes}"</p>
            )}
            {payment.proofImage && (
              <div className="mt-4 no-print space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bukti Transfer:</p>
                <div className="relative inline-block group">
                  <img src={payment.proofImage} alt="Transfer Proof" className="max-w-xs rounded-xl border border-slate-200 shadow-lg" />
                  <a 
                    href={payment.proofImage} 
                    download={`Bukti_Transfer_${pr.refNo}.jpg`}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 w-8 h-8 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                    title="Download Bukti Transfer"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {locked ? 'Menunggu Final Approval terlebih dahulu' : 'Menunggu konfirmasi payment oleh Admin...'}
          </p>
        )}
      </div>
    </div>
  )
}

export default PRDetailPage
