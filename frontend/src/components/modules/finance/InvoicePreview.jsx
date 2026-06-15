import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchInvoices } from '../../../services/financeService';

const printStyles = `
  @media print {
    @page { size: A4 portrait; margin: 0; }
    
    html, body {
      height: auto !important;
      overflow: visible !important;
      background: white !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }

    #root > :not(.print-only-portal) {
      display: none !important;
    }

    .print-only-portal {
      display: block !important;
      visibility: visible !important;
      width: 100% !important;
      background: white !important;
      position: absolute;
      top: 0;
      left: 0;
    }

    /* Print-specific fonts & spacing */
    .print-container {
      padding: 20mm;
      max-width: 210mm;
      margin: 0 auto;
      font-family: 'Inter', sans-serif;
      color: #1E293B;
      font-size: 12px;
      line-height: 1.5;
    }
  }
`;

export default function InvoicePreview({ invoiceId, onClose }) {
  const { data: invoices } = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices });
  const invoice = invoices?.find(i => i.id === invoiceId);

  // Auto-trigger print when data is ready
  useEffect(() => {
    if (invoice) {
      // Small timeout to ensure DOM is fully rendered in portal
      const timer = setTimeout(() => {
        window.print();
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [invoice, onClose]);

  if (!invoice) return null;

  return createPortal(
    <div className="print-only-portal" style={{ display: 'none' }}>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="print-container">
        
        {/* Header: Company & Invoice Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ width: '40px', height: '40px', background: '#3A7BFF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '20px' }}>P</div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#0B1F3A' }}>ProMan Inc.</h1>
            </div>
            <p style={{ margin: '2px 0', color: '#64748B' }}>123 Enterprise Avenue</p>
            <p style={{ margin: '2px 0', color: '#64748B' }}>Jakarta, Indonesia 10110</p>
            <p style={{ margin: '2px 0', color: '#64748B' }}>finance@proman.com</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>INVOICE</h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px' }}>
              <div style={{ textAlign: 'right', color: '#64748B', fontWeight: 600 }}>
                <p style={{ margin: '4px 0' }}>Invoice No:</p>
                <p style={{ margin: '4px 0' }}>Date:</p>
                <p style={{ margin: '4px 0' }}>Due Date:</p>
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700 }}>
                <p style={{ margin: '4px 0' }}>{invoice.invoiceNumber || invoice.id}</p>
                <p style={{ margin: '4px 0' }}>{new Date(invoice.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p style={{ margin: '4px 0' }}>{new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Bill To</h3>
          <p style={{ fontWeight: 700, fontSize: '16px', margin: '0 0 4px 0' }}>{invoice.client?.company || 'Unknown Client'}</p>
          <p style={{ margin: '0 0 4px 0', color: '#1E293B' }}>{invoice.client?.name}</p>
          <p style={{ margin: '0 0 4px 0', color: '#64748B' }}>{invoice.client?.email}</p>
          <p style={{ margin: '0 0 4px 0', color: '#64748B' }}>{invoice.client?.phone}</p>
          {invoice.scopeOfWork && <p style={{ margin: '15px 0 0 0', fontStyle: 'italic', color: '#64748B' }}>Scope: {invoice.scopeOfWork}</p>}
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: '#64748B' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: '#64748B', width: '80px' }}>Qty</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#64748B', width: '120px' }}>Unit Price</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#64748B', width: '140px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 500 }}>{item.description}</td>
                  <td style={{ padding: '16px 12px', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '16px 12px', textAlign: 'right' }}>Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 600 }}>Rp {item.total.toLocaleString('id-ID')}</td>
                </tr>
              ))
            ) : (
              // Fallback for old mock invoices without items
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '16px 12px', fontWeight: 500 }}>Professional Services rendered for Project</td>
                <td style={{ padding: '16px 12px', textAlign: 'center' }}>1</td>
                <td style={{ padding: '16px 12px', textAlign: 'right' }}>Rp {invoice.subtotal.toLocaleString('id-ID')}</td>
                <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 600 }}>Rp {invoice.subtotal.toLocaleString('id-ID')}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals Box */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '50px' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>Rp {invoice.subtotal.toLocaleString('id-ID')}</span>
            </div>
            {invoice.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Discount</span>
                <span style={{ fontWeight: 600, color: '#EF4444' }}>-Rp {invoice.discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Tax ({invoice.taxRate}%)</span>
              <span style={{ fontWeight: 600 }}>Rp {invoice.taxAmount.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', background: '#F8FAFC', padding: '12px', borderRadius: '8px', marginTop: '10px' }}>
              <span style={{ fontWeight: 800, fontSize: '16px' }}>Grand Total</span>
              <span style={{ fontWeight: 800, fontSize: '18px', color: '#3A7BFF' }}>Rp {invoice.totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Footer info & Signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '50px' }}>
          <div style={{ maxWidth: '300px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>Payment Instructions</h4>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>Bank Mandiri: 123-456-7890</p>
            <p style={{ margin: '0 0 4px 0', color: '#64748B' }}>A/N: ProMan Inc.</p>
            <p style={{ margin: '0', color: '#64748B', fontSize: '11px', marginTop: '10px' }}>Payment is due within {invoice.paymentTerms}. Late payments may be subject to a 2% monthly fee.</p>
          </div>
          
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderBottom: '1px solid #1E293B', height: '60px', marginBottom: '10px' }}></div>
            <p style={{ margin: 0, fontWeight: 700 }}>Authorized Signature</p>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
