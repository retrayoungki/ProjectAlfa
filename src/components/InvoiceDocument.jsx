import React from 'react'

const InvoiceDocument = ({ invoice, projectData }) => {
  if (!invoice) return null

  const formatCurrency = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`

  return (
    <div className="bg-white p-12 w-[210mm] min-h-[297mm] mx-auto shadow-2xl print:shadow-none print:p-0 font-sans text-slate-800 border-t-[12px] border-[#00355f] flex flex-col box-border">
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
              <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider border border-[#00355f]">Description</th>
              <th className="px-4 py-2 text-center text-[11px] font-bold uppercase tracking-wider border border-[#00355f] w-24">Qty / Hr</th>
              <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-wider border border-[#00355f] w-40">Unit Price / Rate</th>
              <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-wider border border-[#00355f] w-40">Total</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {/* Progress Section */}
            <tr className="bg-slate-50">
              <td colSpan="4" className="px-4 py-2 font-bold text-slate-400 border border-slate-200 italic">Progress Billing</td>
            </tr>
            <tr>
              <td className="px-4 py-4 border border-slate-200">
                <p className="font-bold">Progress Claim #{invoice.stage === 30 ? '1' : invoice.stage === 50 ? '2' : invoice.stage === 75 ? '3' : '4'}</p>
                <p className="text-xs text-slate-500 mt-1">Completion progress reaching {invoice.stage}% of contract value.</p>
              </td>
              <td className="px-4 py-4 text-center border border-slate-200 font-medium">1.00</td>
              <td className="px-4 py-4 text-right border border-slate-200 font-medium">{formatCurrency(invoice.amount)}</td>
              <td className="px-4 py-4 text-right border border-slate-200 font-bold">{formatCurrency(invoice.amount)}</td>
            </tr>
            {/* Placeholder Rows to match design */}
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i} className="h-10">
                <td className="px-4 py-2 border border-slate-200"></td>
                <td className="px-4 py-2 border border-slate-200"></td>
                <td className="px-4 py-2 border border-slate-200"></td>
                <td className="px-4 py-2 border border-slate-200"></td>
              </tr>
            ))}
            <tr className="bg-slate-50">
              <td colSpan="4" className="px-4 py-2 font-bold text-slate-400 border border-slate-200 italic">Other</td>
            </tr>
            <tr className="h-10">
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
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                <span>Discount</span>
                <span>Rp 0</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                <span>Tax Rate</span>
                <span>0.00%</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                <span>Total Tax</span>
                <span>Rp 0</span>
              </div>
              <div className="flex justify-between items-center mt-6">
                <span className="text-sm font-black text-[#00355f] uppercase tracking-widest">Balance Due</span>
                <div className="bg-blue-50 px-6 py-3 rounded text-xl font-black text-slate-900 shadow-inner">
                  {formatCurrency(invoice.amount)}
                </div>
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
