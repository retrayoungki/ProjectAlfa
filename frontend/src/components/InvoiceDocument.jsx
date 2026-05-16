import React from 'react'

const InvoiceDocument = ({ invoice, projectData }) => {
  if (!invoice) return null

  const formatCurrency = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`

  return (
    <div className="bg-white p-12 w-[210mm] min-h-[297mm] mx-auto shadow-2xl print:shadow-none print:p-0 font-sans text-slate-800 border-t-[12px] border-[#00355f] flex flex-col box-border relative">
      {/* Watermark */}
      {invoice.status !== 'Issued' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] pointer-events-none z-10 opacity-[0.05] print:opacity-[0.05] whitespace-nowrap">
          <div className="border-[20px] border-emerald-600 text-emerald-600 rounded-[60px] px-24 py-12 flex flex-col items-center">
            <span className="text-[140px] font-black uppercase tracking-[0.2em]">
              PAID
            </span>
            {invoice.status !== 'Lunas' && (
              <span className="text-[60px] font-black uppercase tracking-[0.1em] -mt-4">
                {invoice.status.replace(' Paid', '')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-5xl font-light text-slate-400 mb-8 uppercase tracking-widest">Invoice</h1>
          <div className="space-y-1 text-sm font-medium">
            <p className="font-bold text-[#00355f]">PROMAN SOLUTIONS</p>
            <p>123 Business Avenue, Suite 500</p>
            <p>Jakarta Selatan, DKI Jakarta 12345</p>
            <p>+62 21 5555 8888</p>
            <p>finance@promansolutions.com</p>
          </div>
        </div>
        <div className="text-right space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-[#00355f] uppercase tracking-widest border-b-2 border-slate-200 pb-1">Date</p>
            <p className="text-sm font-bold pt-1">{invoice.date}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-[#00355f] uppercase tracking-widest border-b-2 border-slate-200 pb-1">Invoice No.</p>
            <p className="text-sm font-bold pt-1">{invoice.id.replace('INV-', 'INV/')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-[#00355f] uppercase tracking-widest border-b-2 border-slate-200 pb-1">Payment Stage</p>
            <p className="text-sm font-bold pt-1">{invoice.stage}% Completion</p>
          </div>
        </div>
      </div>

      {/* Bill To / Site Location Section */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <p className="text-[10px] font-black text-[#00355f] uppercase tracking-widest border-b-2 border-slate-200 pb-1 mb-3">Bill To</p>
          <div className="text-sm space-y-1">
            <p className="font-bold text-slate-900">{projectData?.client || 'Client Name'}</p>
            <p>Finance Department</p>
            <p>Office Address, City</p>
            <p>billing@client.com</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black text-[#00355f] uppercase tracking-widest border-b-2 border-slate-200 pb-1 mb-3">Site / Location</p>
          <div className="text-sm space-y-1 italic text-slate-500">
            <p className="font-bold text-slate-700 not-italic">{invoice.project}</p>
            <p>Project Site Address</p>
            <p>Location Details</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-grow">
        <table className="w-full border-collapse mb-12">
          <thead>
            <tr className="bg-[#00355f] text-white">
              <th className="px-4 py-2 text-center text-[11px] font-bold uppercase tracking-wider border border-[#00355f] w-12">No</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider border border-[#00355f]">Scope of Work</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider border border-[#00355f]">Detail</th>
              <th className="px-4 py-2 text-center text-[11px] font-bold uppercase tracking-wider border border-[#00355f] w-24">Unit</th>
              <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-wider border border-[#00355f] w-40">Price (Rp)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-4 text-center border border-slate-200">{idx + 1}</td>
                  <td className="px-4 py-4 border border-slate-200 font-bold">{item.scope}</td>
                  <td className="px-4 py-4 border border-slate-200 italic text-slate-500">{item.detail}</td>
                  <td className="px-4 py-4 text-center border border-slate-200">{item.unit}</td>
                  <td className="px-4 py-4 text-right border border-slate-200 font-bold">{formatCurrency(item.price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-center border border-slate-200">1</td>
                <td className="px-4 py-4 border border-slate-200 font-bold">{invoice.scopeOfWork || `Progress Claim - Stage ${invoice.stage}%`}</td>
                <td className="px-4 py-4 border border-slate-200 italic text-slate-500">Legacy Billing Data</td>
                <td className="px-4 py-4 text-center border border-slate-200">{invoice.unit || '1.00'}</td>
                <td className="px-4 py-4 text-right border border-slate-200 font-bold">{formatCurrency(invoice.price || invoice.amount)}</td>
              </tr>
            )}
            {/* Placeholder Rows to match design */}
            {(!invoice.items || invoice.items.length < 5) && [1, 2, 3, 4, 5].slice(0, 5 - (invoice.items?.length || 1)).map(i => (
              <tr key={i} className="h-10">
                <td className="px-4 py-2 border border-slate-200"></td>
                <td className="px-4 py-2 border border-slate-200"></td>
                <td className="px-4 py-2 border border-slate-200"></td>
                <td className="px-4 py-2 border border-slate-200"></td>
                <td className="px-4 py-2 border border-slate-200"></td>
              </tr>
            ))}
            <tr className="bg-slate-50">
              <td colSpan="5" className="px-4 py-2 font-bold text-slate-400 border border-slate-200 italic">Other</td>
            </tr>
            <tr className="h-10">
              <td className="px-4 py-2 border border-slate-200"></td>
              <td className="px-4 py-2 border border-slate-200"></td>
              <td className="px-4 py-2 border border-slate-200"></td>
              <td className="px-4 py-2 border border-slate-200"></td>
              <td className="px-4 py-2 border border-slate-200 font-bold text-right">0.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="mt-auto">
        <div className="flex justify-between items-start mb-12">
          <div className="w-1/2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Remarks / Payment Instructions:</p>
            <div className="text-[10px] space-y-1 text-slate-500">
              <p>Please include Invoice No. in payment reference.</p>
              <p>Bank: BCA - Account: 123 456 7890 (PROMAN SOLUTIONS)</p>
              <p>Terms: Due within 14 days of receipt.</p>
            </div>
          </div>
          <div className="w-1/3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                <span>Invoice Amount</span>
                <span>{formatCurrency(invoice.amount)}</span>
              </div>
              
              {/* Payment Status Logic */}
              {invoice.status !== 'Issued' && (
                <div className="flex justify-between items-center mt-6">
                  <span className="text-sm font-black text-[#00355f] uppercase tracking-widest">Amount Paid ({invoice.status.replace(' Paid', '')})</span>
                  <div className="bg-emerald-50 px-6 py-3 rounded text-xl font-black text-emerald-700 shadow-inner">
                    {formatCurrency(
                      invoice.status === '30% Paid' ? invoice.amount * 0.3 :
                      invoice.status === '50% Paid' ? invoice.amount * 0.5 :
                      invoice.status === '75% Paid' ? invoice.amount * 0.75 :
                      invoice.amount
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 pt-2 mt-4">
                <span>Balance Due</span>
                <span>{formatCurrency(
                  invoice.status === '30% Paid' ? invoice.amount * 0.7 :
                  invoice.status === '50% Paid' ? invoice.amount * 0.5 :
                  invoice.status === '75% Paid' ? invoice.amount * 0.25 :
                  invoice.status === 'Lunas' ? 0 :
                  invoice.amount
                )}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Print Button Helper (Hidden on Print) */}
        <div className="flex justify-end gap-4 print:hidden pb-8">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#00355f] text-white px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDocument
