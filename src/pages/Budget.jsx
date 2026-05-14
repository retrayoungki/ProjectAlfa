import React, { useState, useEffect } from 'react'
import { getAllPRs, STATUS_STYLES } from '../utils/prService'
import { canViewAll } from '../utils/rbac'

const Budget = ({ projects = [], currentUser }) => {
  const [purchaseRequests, setPurchaseRequests] = useState([])
  
  const loadData = () => {
    let all = getAllPRs()
    if (currentUser && !canViewAll(currentUser.role)) {
      all = all.filter(pr => 
        pr.submittedBy === currentUser.name || 
        pr.submittedBy === currentUser.username ||
        pr.requestedBy === currentUser.name
      )
    }
    setPurchaseRequests(all)
  }

  useEffect(() => {
    loadData()
  }, [projects, currentUser])

  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0)
  const spentPRs = purchaseRequests.filter(pr => pr.status === 'Fully Approved' || pr.status === 'Paid')
  const totalSpent = spentPRs.reduce((acc, pr) => acc + (pr.total || 0), 0)
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const formatCurrency = (v) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(v).replace('Rp', 'Rp ')

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getMonthlyData = () => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      months.push(d.toLocaleString('default', { month: 'short' }).toUpperCase())
    }
    const data = months.map(m => {
      const spent = spentPRs.filter(pr => new Date(pr.submittedAt).toLocaleString('default', { month: 'short' }).toUpperCase() === m).reduce((acc, pr) => acc + (pr.total || 0), 0)
      return { month: m, spent }
    })
    const maxSpent = Math.max(...data.map(d => d.spent), 1)
    return data.map(d => ({ ...d, height: (d.spent / maxSpent) * 100 }))
  }

  const monthlyStats = getMonthlyData()

  return (
    <main className="flex-1 p-6 lg:p-gutter max-w-[1440px] mx-auto w-full">
      <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-primary mb-1 tracking-tight">Financial Oversight</h2>
          <p className="font-body-lg font-bold text-slate-700">Real-time budget analysis and expense tracking.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-label-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export CSV</span>
          </button>
          <button className="px-4 py-2 bg-primary text-white font-label-bold rounded shadow-sm hover:opacity-90 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">receipt_long</span>
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-lg">
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-primary/10 rounded-full mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">account_balance_wallet</span>
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">Total Project Budget</p>
          <h3 className="text-2xl font-black text-primary leading-none">{formatCurrency(totalBudget)}</h3>
        </div>

        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-secondary/10 rounded-full mb-4">
            <span className="material-symbols-outlined text-secondary text-3xl">payments</span>
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">Total Spent</p>
          <h3 className="text-2xl font-black text-primary leading-none">{formatCurrency(totalSpent)}</h3>
        </div>

        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-blue-50 rounded-full mb-4">
            <span className="material-symbols-outlined text-blue-600 text-3xl">analytics</span>
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">Budget Used</p>
          <h3 className="text-2xl font-black text-primary leading-none">{spentPercentage.toFixed(1)}%</h3>
        </div>

        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-amber-50 rounded-full mb-4">
            <span className="material-symbols-outlined text-amber-500 text-3xl">receipt_long</span>
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">Transactions</p>
          <h3 className="text-2xl font-black text-primary leading-none">{purchaseRequests.length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-lg">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="px-lg py-md border-b border-slate-200">
            <h4 className="font-headline-md text-primary">Monthly Spending History</h4>
          </div>
          <div className="p-lg">
            <div className="relative h-[200px] w-full flex items-end justify-between px-4">
              {monthlyStats.map((d, i) => (
                <div key={i} className="relative w-12 bg-slate-100 rounded-t h-full group">
                  <div className="absolute bottom-0 w-full bg-primary rounded-t transition-all duration-700" style={{ height: `${d.height}%` }}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      {formatCurrency(d.spent)}
                    </div>
                  </div>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
          <div className="px-lg py-md border-b border-slate-200">
            <h4 className="font-headline-md text-primary">Budget Status</h4>
          </div>
          <div className="p-lg flex flex-col justify-center flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Utilization Rate</span>
              <span className="text-xs font-black text-primary">{spentPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
              <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${Math.min(spentPercentage, 100)}%` }}></div>
            </div>
            <p className="mt-4 text-[11px] text-slate-500 italic text-center">
              Current spending is within projected quarterly limits.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-lg py-md border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-headline-md text-primary">Recent Transactions</h4>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latest 15 records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Ref ID</th>
                <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Vendor / Detail</th>
                <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...purchaseRequests].sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 15).map((pr) => {
                const style = STATUS_STYLES[pr.status] || 'bg-slate-100 text-slate-500 border-slate-200'
                return (
                  <tr key={pr.refNo} className="zebra-stripe hover:bg-slate-50 transition-colors">
                    <td className="px-lg py-4 font-black text-xs text-primary">{pr.refNo}</td>
                    <td className="px-lg py-4">
                      <div className="font-bold text-slate-900">{pr.vendor || 'General Purchase'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{pr.scopeOfWork || 'General'}</div>
                    </td>
                    <td className="px-lg py-4 text-right font-black text-slate-900 tabular-nums">{formatCurrency(pr.total)}</td>
                    <td className="px-lg py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${style}`}>
                        {pr.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {purchaseRequests.length === 0 && <div className="py-20 text-center text-slate-400 font-bold">No transactions found</div>}
        </div>
      </div>
    </main>
  )
}

export default Budget
