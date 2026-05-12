import React from 'react'
import { useNavigate } from 'react-router-dom'

const Forms = () => {
  const navigate = useNavigate()

  return (
    <div className="p-lg max-w-[1440px] mx-auto space-y-lg">
      <div className="mb-6">
        <h2 className="text-4xl font-black text-primary mb-1 tracking-tight">Project Forms & Requests</h2>
        <p className="text-slate-700 font-bold font-body-lg">Access and submit various project-related documents and digital forms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
        {/* Purchase Request Card */}
        <div 
          onClick={() => navigate('/forms/purchase-request')}
          className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer overflow-hidden flex flex-col"
        >
          <div className="p-6 flex-1 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-50 text-primary rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors mx-auto">
              <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            </div>
            <h3 className="font-headline-md text-slate-900 mb-2">Purchase Request</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Submit a request for materials, equipment, or services needed for the project site.
            </p>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-primary/5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Form PR-01</span>
            <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
          </div>
        </div>

        {/* Cash Request Card */}
        <div 
          onClick={() => navigate('/forms/cash-request')}
          className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer overflow-hidden flex flex-col"
        >
          <div className="p-6 flex-1 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors mx-auto">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <h3 className="font-headline-md text-slate-900 mb-2">Cash Request</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Request for cash payments, consultants, or non-material project expenses.
            </p>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-amber-500/5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Form CSH-01</span>
            <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all">arrow_forward</span>
          </div>
        </div>

        {/* Placeholder for other forms */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center opacity-60">
          <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">add_circle</span>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">More Forms Coming Soon</p>
        </div>
      </div>
    </div>
  )
}

export default Forms
