import React, { useState, useEffect } from 'react';

const INITIAL_STATE = {
  code: '',
  category: '',
  description: '',
  unit: 'Ls',
  unitPrice: 0,
  status: 'Active',
  notes: '',
  materials: [],
  labor: [],
  equipment: []
};

const UNITS = ['m3', 'm2', 'm', 'kg', 'titik', 'Ls', 'Set', 'Unit', 'OH', 'Day', 'Hour', 'buah', 'pcs'];

const AHSPFormModal = ({ isOpen, onClose, initialData, onSave, isPrivileged }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('info'); // info, materials, labor, equipment
  const isEditMode = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          materials: initialData.materials || [],
          labor: initialData.labor || [],
          equipment: initialData.equipment || [],
        });
      } else {
        setFormData(INITIAL_STATE);
      }
      setActiveTab('info');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubItemChange = (category, index, field, value) => {
    const list = [...formData[category]];
    if (field === 'qty' || field === 'price') {
      list[index][field] = Number(value) || 0;
    } else {
      list[index][field] = value;
    }
    setFormData(prev => ({ ...prev, [category]: list }));
  };

  const addSubItem = (category) => {
    setFormData(prev => ({
      ...prev,
      [category]: [...prev[category], { name: '', qty: 0, unit: 'Ls', price: 0 }]
    }));
  };

  const removeSubItem = (category, index) => {
    setFormData(prev => {
      const list = [...prev[category]];
      list.splice(index, 1);
      return { ...prev, [category]: list };
    });
  };

  const calculateSubtotal = (items) => items.reduce((sum, item) => sum + (item.qty * item.price), 0);

  const matTotal = calculateSubtotal(formData.materials);
  const labTotal = calculateSubtotal(formData.labor);
  const eqpTotal = calculateSubtotal(formData.equipment);
  const grandTotal = matTotal + labTotal + eqpTotal;

  // Sync auto-calculated total if we have breakdowns, else use manual price
  const displayUnitPrice = (formData.materials.length > 0 || formData.labor.length > 0 || formData.equipment.length > 0) 
    ? grandTotal 
    : formData.unitPrice;

  const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.description) {
      alert('Code and Description are required.');
      return;
    }
    if (displayUnitPrice < 0) {
      alert('Unit price cannot be negative.');
      return;
    }
    onSave({
      ...formData,
      unitPrice: displayUnitPrice
    });
  };

  const renderBreakdownTable = (category, items) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-sm text-slate-800 capitalize">{category} Breakdown</h4>
        <div className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded">
          Subtotal: <span className="text-primary">{formatCurrency(calculateSubtotal(items))}</span>
        </div>
      </div>
      
      <div className="border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase">Item Name</th>
              <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase w-20">Unit</th>
              <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase w-24 text-right">Coeff / Qty</th>
              <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase w-32 text-right">Price (Rp)</th>
              <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase w-32 text-right">Total</th>
              <th className="px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                <td className="p-0 border-r border-slate-100">
                  <input 
                    type="text" value={item.name} placeholder="Item name..."
                    onChange={(e) => handleSubItemChange(category, idx, 'name', e.target.value)}
                    disabled={!isPrivileged}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-transparent focus:bg-blue-50 focus:outline-none disabled:bg-slate-50"
                  />
                </td>
                <td className="p-0 border-r border-slate-100">
                  <select
                    value={item.unit}
                    onChange={(e) => handleSubItemChange(category, idx, 'unit', e.target.value)}
                    disabled={!isPrivileged}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-600 bg-transparent focus:bg-blue-50 focus:outline-none disabled:bg-slate-50"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
                <td className="p-0 border-r border-slate-100">
                  <input 
                    type="number" step="any" value={item.qty}
                    onChange={(e) => handleSubItemChange(category, idx, 'qty', e.target.value)}
                    disabled={!isPrivileged}
                    className="w-full px-3 py-2 text-xs font-bold text-right text-primary bg-transparent focus:bg-blue-50 focus:outline-none disabled:bg-slate-50"
                  />
                </td>
                <td className="p-0 border-r border-slate-100">
                  <input 
                    type="number" step="any" value={item.price}
                    onChange={(e) => handleSubItemChange(category, idx, 'price', e.target.value)}
                    disabled={!isPrivileged}
                    className="w-full px-3 py-2 text-xs font-bold text-right text-slate-700 bg-transparent focus:bg-blue-50 focus:outline-none disabled:bg-slate-50"
                  />
                </td>
                <td className="px-3 py-2 text-xs font-bold text-right text-slate-800 bg-slate-50">
                  {formatCurrency(item.qty * item.price)}
                </td>
                <td className="px-2 py-2 text-center">
                  {isPrivileged && (
                    <button 
                      type="button" 
                      onClick={() => removeSubItem(category, idx)}
                      className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="6" className="px-3 py-6 text-center text-xs text-slate-400 italic">
                  No items added. Click below to add.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {isPrivileged && (
        <button 
          type="button" 
          onClick={() => addSubItem(category)}
          className="w-full py-2 border border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary hover:bg-blue-50 text-xs font-bold rounded transition-colors flex justify-center items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">add</span> Add {category} Item
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-primary">{isEditMode ? 'Edit AHSP Item' : 'New AHSP Item'}</h2>
            <p className="text-xs text-slate-500 font-medium">{isEditMode ? `Editing code: ${formData.code}` : 'Add a new master library item'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 shrink-0 bg-white">
          {[
            { id: 'info', label: 'Basic Info', icon: 'info' },
            { id: 'materials', label: 'Materials', icon: 'category' },
            { id: 'labor', label: 'Labor', icon: 'engineering' },
            { id: 'equipment', label: 'Equipment', icon: 'precision_manufacturing' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
              {(tab.id === 'materials' || tab.id === 'labor' || tab.id === 'equipment') && formData[tab.id].length > 0 && (
                <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">{formData[tab.id].length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">AHSP Code *</label>
                  <input 
                    type="text" value={formData.code} onChange={e => handleChange('code', e.target.value)} required disabled={!isPrivileged}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm disabled:bg-slate-100"
                    placeholder="e.g. A.2.2.1.4"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                  <input 
                    type="text" value={formData.category} onChange={e => handleChange('category', e.target.value)} disabled={!isPrivileged}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm disabled:bg-slate-100"
                    placeholder="e.g. Pekerjaan Tanah"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description *</label>
                <textarea 
                  rows="2" value={formData.description} onChange={e => handleChange('description', e.target.value)} required disabled={!isPrivileged}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm disabled:bg-slate-100"
                  placeholder="e.g. Penggalian 1 m3 tanah biasa sedalam 1 m"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Unit</label>
                  <select 
                    value={formData.unit} onChange={e => handleChange('unit', e.target.value)} disabled={!isPrivileged}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm disabled:bg-slate-100"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select 
                    value={formData.status} onChange={e => handleChange('status', e.target.value)} disabled={!isPrivileged}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm disabled:bg-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Manual Unit Price</label>
                  <input 
                    type="number" step="any" value={formData.unitPrice} onChange={e => handleChange('unitPrice', e.target.value)} disabled={!isPrivileged || grandTotal > 0}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  {grandTotal > 0 && <p className="text-[9px] text-slate-400 mt-1 leading-tight">Price is auto-calculated from breakdowns.</p>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes</label>
                <input 
                  type="text" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} disabled={!isPrivileged}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm disabled:bg-slate-100"
                />
              </div>
            </div>
          )}

          {activeTab === 'materials' && renderBreakdownTable('materials', formData.materials)}
          {activeTab === 'labor' && renderBreakdownTable('labor', formData.labor)}
          {activeTab === 'equipment' && renderBreakdownTable('equipment', formData.equipment)}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calculated Unit Price</p>
            <p className="text-xl font-black text-primary tabular-nums">{formatCurrency(displayUnitPrice)}</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded transition-colors">
              Cancel
            </button>
            {isPrivileged && (
              <button onClick={handleSubmit} className="px-6 py-2 bg-primary text-white font-bold text-sm rounded shadow hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isEditMode ? 'Update AHSP' : 'Save AHSP'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AHSPFormModal;
