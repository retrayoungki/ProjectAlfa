import React from 'react'

const Budget = () => {
  return (
    <div className="p-lg max-w-[1440px] mx-auto space-y-lg">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-primary mb-1 tracking-tight">Financial Oversight</h2>
          <p className="text-slate-700 font-bold font-body-lg">Real-time budget analysis and expense tracking for Site #402-B</p>
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

      {/* Bento Grid - Budget Health & Main Stats */}
      <div className="grid grid-cols-12 gap-lg">
        {/* Main Budget Health Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white p-lg border border-slate-200 rounded shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-primary">Budget Health Over Time</h3>
            <div className="flex gap-2 bg-slate-100 p-1 rounded">
              <button className="px-3 py-1 text-xs font-bold bg-white shadow-sm rounded">6 Months</button>
              <button className="px-3 py-1 text-xs font-bold text-slate-500">Year</button>
              <button className="px-3 py-1 text-xs font-bold text-slate-500">All Time</button>
            </div>
          </div>
          {/* Mock Visualization */}
          <div className="relative h-[240px] w-full flex items-end justify-between px-4">
            <div className="absolute inset-0 border-b border-slate-200 flex flex-col justify-between">
              <div className="border-t border-slate-100 w-full h-px"></div>
              <div className="border-t border-slate-100 w-full h-px"></div>
              <div className="border-t border-slate-100 w-full h-px"></div>
            </div>
            {/* Chart Bars */}
            <div className="relative w-12 bg-slate-100 rounded-t h-[40%] group">
              <div className="absolute bottom-0 w-full bg-primary h-[85%] rounded-t"></div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">JAN</span>
            </div>
            <div className="relative w-12 bg-slate-100 rounded-t h-[55%] group">
              <div className="absolute bottom-0 w-full bg-primary h-[70%] rounded-t"></div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">FEB</span>
            </div>
            <div className="relative w-12 bg-slate-100 rounded-t h-[65%] group">
              <div className="absolute bottom-0 w-full bg-primary h-[90%] rounded-t"></div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">MAR</span>
            </div>
            <div className="relative w-12 bg-slate-100 rounded-t h-[80%] group">
              <div className="absolute bottom-0 w-full bg-secondary-container h-[95%] rounded-t"></div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">APR</span>
            </div>
            <div className="relative w-12 bg-slate-100 rounded-t h-[75%] group">
              <div className="absolute bottom-0 w-full bg-primary h-[60%] rounded-t"></div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">MAY</span>
            </div>
            <div className="relative w-12 bg-slate-100 rounded-t h-[90%] group">
              <div className="absolute bottom-0 w-full bg-primary h-[80%] rounded-t"></div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">JUN</span>
            </div>
          </div>
        </div>

        {/* Snapshot Stats */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
          <div className="flex-1 bg-primary text-white p-lg rounded border-b-4 border-blue-900 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="font-label-bold opacity-80 uppercase tracking-widest mb-2">Total Budget</p>
              <h3 className="font-headline-xl tabular-nums">$2,450,000.00</h3>
              <div className="mt-4 flex items-center gap-2">
                <span className="bg-blue-400/30 px-2 py-0.5 rounded text-[10px] font-bold">+12% vs Initial</span>
              </div>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl opacity-10 rotate-12">account_balance_wallet</span>
          </div>
          <div className="flex-1 bg-white p-lg rounded border border-slate-200 border-b-4 border-slate-300 shadow-sm">
            <p className="font-label-bold text-slate-500 uppercase tracking-widest mb-2">Total Spent</p>
            <h3 className="font-headline-xl text-primary tabular-nums">$1,892,440.00</h3>
            <div className="mt-4 flex items-center gap-2 text-primary font-bold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="text-[12px]">77.2% of total allocation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Materials */}
        <div className="bg-white p-lg border border-slate-200 rounded shadow-sm flex flex-col items-center text-center">
          <div className="flex flex-col items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">conveyor_belt</span>
            <h4 className="font-headline-md">Materials</h4>
            <span className="text-[10px] bg-surface-container text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-widest">ON TRACK</span>
          </div>
          <div className="w-full space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1 uppercase tracking-tighter">
                <span>SPENT: $840K</span>
                <span>BUDGET: $1.2M</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[70%]"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Concrete</p>
                <p className="font-tabular-nums text-sm font-black text-slate-800">$245,000</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Steel</p>
                <p className="font-tabular-nums text-sm font-black text-slate-800">$312,000</p>
              </div>
            </div>
          </div>
        </div>

        {/* Labor */}
        <div className="bg-white p-lg border border-slate-200 rounded shadow-sm flex flex-col items-center text-center">
          <div className="flex flex-col items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-secondary text-3xl">engineering</span>
            <h4 className="font-headline-md">Labor</h4>
            <span className="text-[10px] bg-error-container text-on-error-container px-2 py-0.5 rounded-full font-black uppercase tracking-widest">CRITICAL</span>
          </div>
          <div className="w-full space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1 uppercase tracking-tighter">
                <span>SPENT: $612K</span>
                <span>BUDGET: $650K</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="hazard-orange h-full w-[94%]"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contractors</p>
                <p className="font-tabular-nums text-sm font-black text-slate-800">$480,500</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Overtime</p>
                <p className="font-tabular-nums text-sm font-black text-error">$131,500</p>
              </div>
            </div>
          </div>
        </div>

        {/* Permits & Fees */}
        <div className="bg-white p-lg border border-slate-200 rounded shadow-sm flex flex-col items-center text-center">
          <div className="flex flex-col items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">description</span>
            <h4 className="font-headline-md">Permits</h4>
            <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-full font-black uppercase tracking-widest">STABLE</span>
          </div>
          <div className="w-full space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1 uppercase tracking-tighter">
                <span>SPENT: $140K</span>
                <span>BUDGET: $250K</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[56%]"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Municipal</p>
                <p className="font-tabular-nums text-sm font-black text-slate-800">$92,000</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inspection</p>
                <p className="font-tabular-nums text-sm font-black text-slate-800">$48,000</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="px-lg py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-headline-md text-primary">Recent Transactions</h3>
          <div className="flex gap-2">
            <button className="p-2 border border-slate-200 bg-white rounded text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-lg">filter_list</span>
            </button>
            <button className="p-2 border border-slate-200 bg-white rounded text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-lg">sort</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-200/50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference ID</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor / Detail</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="zebra-stripe hover:bg-surface-container-low transition-colors cursor-pointer">
                <td className="px-6 py-4 font-tabular-nums text-slate-600">TXN-902441</td>
                <td className="px-6 py-4">
                  <div className="font-bold">Holcim Concrete Ltd.</div>
                  <div className="text-[11px] text-slate-400">Foundation Pour - Level 1</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded">MATERIALS</span>
                </td>
                <td className="px-6 py-4 text-right font-tabular-nums font-bold text-primary">-$124,500.00</td>
                <td className="px-6 py-4 text-slate-500 text-sm">Oct 24, 2023</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-xs text-blue-800 font-bold bg-blue-50 px-2 py-1 rounded w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    COMPLETED
                  </span>
                </td>
              </tr>
              {/* More rows... */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Budget
