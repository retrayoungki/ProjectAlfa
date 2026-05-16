import React, { useState, useEffect } from 'react'
import { getAllPRs, STATUS_STYLES } from '../utils/prService'
import { canViewAll } from '../utils/rbac'
import { loadEstimation } from '../services/costEstimationService'

const Budget = ({ projects = [], currentUser }) => {
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '')
  const [scopeBudgets, setScopeBudgets] = useState({})
  const [loadingBudgets, setLoadingBudgets] = useState(false)
  
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

  useEffect(() => {
    if (!selectedProjectId) return
    
    setLoadingBudgets(true)
    loadEstimation(selectedProjectId).then(data => {
      const budgetMap = {}
      const profitRate = (data.params?.profit || 30) / 100
      
      data.sections.forEach(section => {
        const items = data.items.filter(i => i.sectionId === section.id)
        const baseTotal = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0)
        budgetMap[section.category] = (budgetMap[section.category] || 0) + (baseTotal * (1 - profitRate))
      })
      setScopeBudgets(budgetMap)
      setLoadingBudgets(false)
    }).catch(() => {
      setScopeBudgets({})
      setLoadingBudgets(false)
    })
  }, [selectedProjectId])

  const currentProject = projects.find(p => String(p.id) === String(selectedProjectId))
  const filteredPRs = purchaseRequests.filter(pr => !selectedProjectId || pr.project === currentProject?.name)
  
  const totalBudget = currentProject ? (Number(currentProject.budget) || 0) : projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0)
  const spentPRs = filteredPRs.filter(pr => pr.status === 'Fully Approved' || pr.status === 'Paid')
  const totalSpent = spentPRs.reduce((acc, pr) => acc + (pr.total || 0), 0)
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const getScopeBreakdown = () => {
    const scopes = ['Ceiling', 'Wall', 'Flooring', 'Electrical', 'Plumbing', 'Finishing', 'Furniture', 'Signage', 'Others']
    return scopes.map(scope => {
      const budget = scopeBudgets[scope] || 0
      const actual = spentPRs.filter(pr => pr.scopeOfWork === scope).reduce((sum, pr) => sum + (pr.total || 0), 0)
      return { scope, budget, actual }
    }).filter(s => s.budget > 0 || s.actual > 0)
  }

  const scopeBreakdown = getScopeBreakdown()

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
    <>
      <style type="text/css" media="print">
        {`@page { size: landscape; margin: 10mm; }`}
      </style>

      {/* ── SCREEN VIEW ── */}
      <main className="flex-1 p-6 lg:p-gutter max-w-[1440px] mx-auto w-full print:hidden">
        <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-primary mb-1 tracking-tight">Financial Oversight</h2>
          <div className="flex items-center gap-3">
            <select 
              value={selectedProjectId} 
              onChange={e => setSelectedProjectId(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none border-b-2 border-primary/20 focus:border-primary transition-colors cursor-pointer pr-4"
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 print:hidden">
          <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-label-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>Export to PDF</span>
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

      {/* Structure Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-lg">
        <div className="px-lg py-md border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-headline-md text-primary uppercase tracking-widest text-xs font-black">Budget vs Actual by Structure</h4>
          {loadingBudgets && <span className="text-[10px] text-slate-400 animate-pulse font-bold">Syncing cost engine...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-lg py-3">Structure / Scope</th>
                <th className="px-lg py-3 text-right">Budget Allocation</th>
                <th className="px-lg py-3 text-right">Actual Spending</th>
                <th className="px-lg py-3 text-right">Variance</th>
                <th className="px-lg py-3 w-48 text-center">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scopeBreakdown.map((item) => {
                const variance = item.budget - item.actual
                const utilization = item.budget > 0 ? (item.actual / item.budget) * 100 : 0
                return (
                  <tr key={item.scope} className="hover:bg-slate-50 transition-colors">
                    <td className="px-lg py-4 font-black text-slate-900">{item.scope}</td>
                    <td className="px-lg py-4 text-right font-bold text-slate-600">{formatCurrency(item.budget)}</td>
                    <td className="px-lg py-4 text-right font-black text-primary">{formatCurrency(item.actual)}</td>
                    <td className={`px-lg py-4 text-right font-bold ${variance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {variance < 0 ? '-' : '+'} {formatCurrency(Math.abs(variance))}
                    </td>
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-3 justify-center">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden max-w-[100px]">
                          <div 
                            className={`h-full transition-all duration-1000 ${utilization > 100 ? 'bg-red-500' : 'bg-primary'}`} 
                            style={{ width: `${Math.min(utilization, 100)}%` }} 
                          />
                        </div>
                        <span className={`text-[10px] font-black w-10 text-right ${utilization > 100 ? 'text-red-600' : 'text-slate-500'}`}>
                          {utilization.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {scopeBreakdown.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold italic text-sm">
                    {loadingBudgets ? 'Loading structure data...' : 'No budget allocation found for this project.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

      {/* ── PRINT VIEW ── */}
      <div className="hidden print:block w-full bg-white text-black p-4">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-widest uppercase">PROMAN</h1>
              <h2 className="text-xs text-slate-500 uppercase tracking-widest mt-1">FINANCIAL OVERSIGHT — BUDGET VS ACTUAL</h2>
            </div>
            <div className="text-right text-[10px] text-slate-600 font-medium">
              <p>Project: <span className="font-bold text-slate-900">{currentProject?.name || 'All Projects'}</span></p>
              <p>Code: <span className="font-bold text-slate-900">{currentProject?.code || 'N/A'}</span></p>
              <p>Printed: <span className="font-bold text-slate-900">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
              <p>By: <span className="font-bold text-slate-900">{currentUser?.name || 'System'}</span></p>
            </div>
          </div>
          <div className="border-t border-b border-slate-900 mt-4 py-2 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
            <div>Project Name: <span className="text-slate-900">{currentProject?.name || 'All Projects'}</span></div>
            <div>Project Code: <span className="text-slate-900">{currentProject?.code || 'N/A'}</span></div>
            <div>Status: <span className="text-slate-900">{currentProject?.status || 'N/A'}</span></div>
            <div>Print Date: <span className="text-slate-900">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
              <th className="py-2 px-3 w-12">No.</th>
              <th className="py-2 px-3">Description / Work Item</th>
              <th className="py-2 px-3 text-right">Budget Allocation</th>
              <th className="py-2 px-3 text-right">Actual Spending</th>
              <th className="py-2 px-3 text-right">Variance</th>
              <th className="py-2 px-3 text-center w-24">Utilization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {scopeBreakdown.map((item, idx) => {
              const variance = item.budget - item.actual;
              const utilization = item.budget > 0 ? (item.actual / item.budget) * 100 : 0;
              return (
                <tr key={item.scope}>
                  <td className="py-2 px-3 text-[10px] font-bold text-slate-500">{idx + 1}.0</td>
                  <td className="py-2 px-3 text-xs font-black text-slate-900">{item.scope}</td>
                  <td className="py-2 px-3 text-xs text-right font-medium text-slate-700">{formatCurrency(item.budget)}</td>
                  <td className="py-2 px-3 text-xs text-right font-black text-slate-900">{formatCurrency(item.actual)}</td>
                  <td className="py-2 px-3 text-xs text-right font-bold text-slate-600">{formatCurrency(variance)}</td>
                  <td className="py-2 px-3 text-[10px] text-center font-black text-slate-700">{utilization.toFixed(1)}%</td>
                </tr>
              )
            })}
            {scopeBreakdown.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-bold text-xs italic">
                  No budget allocation found for this project.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900 bg-slate-50">
              <td colSpan="2" className="py-3 px-3 text-right text-xs font-black uppercase tracking-widest text-slate-700">Total Project Budget & Spending</td>
              <td className="py-3 px-3 text-right text-xs font-black text-slate-900">{formatCurrency(totalBudget)}</td>
              <td className="py-3 px-3 text-right text-xs font-black text-slate-900">{formatCurrency(totalSpent)}</td>
              <td className="py-3 px-3 text-right text-xs font-black text-slate-900">{formatCurrency(totalBudget - totalSpent)}</td>
              <td className="py-3 px-3 text-center text-[10px] font-black text-slate-900">{spentPercentage.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
        
        <div className="mt-8 pt-8 border-t border-slate-200 flex justify-end">
          <div className="text-right text-[10px]">
            <p className="font-bold text-slate-500 uppercase tracking-widest mb-1">Generated by PROMAN Financial Oversight Module</p>
            <p className="text-slate-400">Page 1 of 1</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Budget
