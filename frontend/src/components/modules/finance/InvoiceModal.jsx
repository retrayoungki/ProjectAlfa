import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useClientsQuery } from '../../../hooks/useClients';
import { useProjectsQuery } from '../../../hooks/useProjects';
import { useCreateInvoiceMutation } from '../../../hooks/useFinance';

export default function InvoiceModal({ onClose }) {
  const { data: clients } = useClientsQuery();
  const { data: projects } = useProjectsQuery();
  const createInvoice = useCreateInvoiceMutation();

  const [formData, setFormData] = useState({
    invoiceNumber: '', // Auto-generated on backend if left blank
    clientId: '',
    projectId: '',
    scopeOfWork: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 days
    currency: 'IDR',
    paymentTerms: 'NET 14',
    taxRate: 11, // Standard PPN 11%
    discount: 0,
    status: 'DRAFT',
  });

  const [items, setItems] = useState([
    { description: '', qty: 1, unitPrice: 0, total: 0 }
  ]);

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const taxAmount = (subtotal * formData.taxRate) / 100;
  const totalAmount = subtotal + taxAmount - formData.discount;

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const val = field === 'description' ? value : Number(value.replace(/\D/g, ''));
    
    newItems[index][field] = val;
    
    // Auto-calculate row total
    if (field === 'qty' || field === 'unitPrice') {
      newItems[index].total = newItems[index].qty * newItems[index].unitPrice;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', qty: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e, targetStatus) => {
    e.preventDefault();
    createInvoice.mutate({
      ...formData,
      subtotal,
      taxAmount,
      totalAmount,
      status: targetStatus,
      items
    }, {
      onSuccess: () => {
        // Success Toast could be added here
        onClose();
      }
    });
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={onClose} />
      
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'var(--surface)', width: '90%', maxWidth: '850px', maxHeight: '90vh',
        borderRadius: 16, zIndex: 1001, display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
      }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Create New Invoice</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Generate a professional invoice for your client</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 4 }}><X size={20} /></button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 30 }}>
            {/* Basic Info */}
            <div>
              <label style={labelStyle}>Client *</label>
              <select style={inputStyle} value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} required>
                <option value="">Select Client...</option>
                {clients?.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Project *</label>
              <select style={inputStyle} value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} required>
                <option value="">Select Project...</option>
                {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Invoice Date</label>
              <input type="date" style={inputStyle} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" style={inputStyle} value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} required />
            </div>
          </div>

          {/* Billing Details */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Billing Details</h3>
            
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 3, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Description</div>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>Qty</div>
              <div style={{ flex: 2, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Unit Price</div>
              <div style={{ flex: 2, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Total</div>
              <div style={{ width: 30 }}></div>
            </div>

            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                <input 
                  type="text" placeholder="Item description" style={{ ...inputStyle, flex: 3 }}
                  value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} required 
                />
                <input 
                  type="number" style={{ ...inputStyle, flex: 1, textAlign: 'center' }} min="1"
                  value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} required 
                />
                <input 
                  type="text" placeholder="0" style={{ ...inputStyle, flex: 2, textAlign: 'right' }}
                  value={item.unitPrice === 0 ? '' : item.unitPrice.toLocaleString('id-ID')} 
                  onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} required 
                />
                <div style={{ flex: 2, textAlign: 'right', fontWeight: 600, fontSize: 13, background: 'var(--bg)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                  Rp. {item.total.toLocaleString('id-ID')}
                </div>
                <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="btn btn-ghost" style={{ padding: 4, color: items.length === 1 ? 'var(--border)' : 'var(--red)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            <button type="button" onClick={addItem} className="btn btn-secondary btn-sm mt-4">
              <Plus size={14} /> Add Line Item
            </button>
          </div>

          {/* Totals Box */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <div style={{ width: '300px', background: 'var(--bg)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={calcRowStyle}><span>Subtotal</span> <span>Rp. {subtotal.toLocaleString('id-ID')}</span></div>
              <div style={calcRowStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Tax (%) 
                  <input type="number" style={{ ...inputStyle, width: 60, padding: '2px 6px', height: 26 }} value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})} />
                </span> 
                <span>Rp. {taxAmount.toLocaleString('id-ID')}</span>
              </div>
              <div style={calcRowStyle}>
                <span>Discount (Rp.)</span> 
                <input type="text" style={{ ...inputStyle, width: 100, padding: '2px 6px', height: 26, textAlign: 'right' }} value={formData.discount === 0 ? '' : formData.discount.toLocaleString('id-ID')} onChange={e => setFormData({...formData, discount: Number(e.target.value.replace(/\D/g, ''))})} />
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
              <div style={{ ...calcRowStyle, fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
                <span>Grand Total</span> <span>Rp. {totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg)', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="button" onClick={(e) => handleSubmit(e, 'DRAFT')} disabled={createInvoice.isPending} className="btn btn-secondary">Save as Draft</button>
          <button type="button" onClick={(e) => handleSubmit(e, 'SENT')} disabled={createInvoice.isPending} className="btn btn-primary" style={{ padding: '8px 24px' }}>
            {createInvoice.isPending ? 'Sending...' : 'Send Invoice'}
          </button>
        </div>

      </div>
    </>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, outline: 'none' };
const calcRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 };
