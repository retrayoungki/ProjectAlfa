/**
 * AddItemModal (upgraded)
 * Supports both Add and Edit modes, plus AHSP quick-fill integration.
 */
import React, { useState, useEffect } from 'react';
import AHSPSelectionModal from './AHSPSelectionModal';

const UNITS = ['m3', 'm2', 'm', 'kg', 'titik', 'Ls', 'Set', 'Unit', 'OH', 'Day', 'buah', 'pcs'];

const AddItemModal = ({ isOpen, onClose, onAdd, onUpdate, categoryName, initialData }) => {
  const isEditMode = !!initialData;
  const [isAHSPOpen, setIsAHSPOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '', description: '', quantity: '', unit: 'm3', unitPrice: '', ahspRef: '', notes: '',
  });

  // Pre-fill when editing
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        code: initialData.code || '',
        description: initialData.description || '',
        quantity: initialData.quantity?.toString() || '',
        unit: initialData.unit || 'm3',
        unitPrice: initialData.unitPrice?.toString() || '',
        ahspRef: initialData.ahspRef || '',
        notes: initialData.notes || '',
      });
    } else if (isOpen && !initialData) {
      setFormData({ code: '', description: '', quantity: '', unit: 'm3', unitPrice: '', ahspRef: '', notes: '' });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleAHSPSelect = (ahspItem) => {
    setFormData(prev => ({
      ...prev,
      description: ahspItem.description,
      unit: ahspItem.unit,
      unitPrice: ahspItem.price.toString(),
      ahspRef: ahspItem.code,
    }));
  };

  const subtotal = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitPrice) || 0);
  const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description || !formData.quantity || !formData.unitPrice) {
      alert('Isi semua field wajib: Description, Quantity, dan Unit Price.');
      return;
    }
    if (parseFloat(formData.quantity) < 0 || parseFloat(formData.unitPrice) < 0) {
      alert('Quantity dan Unit Price tidak boleh negatif.');
      return;
    }

    const payload = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
    };

    if (isEditMode) {
      onUpdate({ ...initialData, ...payload });
    } else {
      onAdd(payload);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-primary">{isEditMode ? 'Edit Work Item' : 'Add New Work Item'}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{categoryName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAHSPOpen(true)}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-black rounded hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                title="Load from AHSP Library"
              >
                <span className="material-symbols-outlined text-[14px]">post_add</span>
                Load AHSP
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* AHSP Ref badge */}
            {formData.ahspRef && (
              <div className="flex items-center gap-2 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded">
                <span className="material-symbols-outlined text-[14px]">link</span>
                AHSP: {formData.ahspRef}
                <button type="button" onClick={() => handleChange('ahspRef', '')} className="ml-auto text-blue-400 hover:text-red-500">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            )}

            {/* Code + Description */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="e.g. 1.1.1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Work item description..."
                  required
                />
              </div>
            </div>

            {/* Qty + Unit + Unit Price */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Quantity *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Unit *</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Unit Price (Rp) *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                  value={formData.unitPrice}
                  onChange={(e) => handleChange('unitPrice', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes (optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional info..."
              />
            </div>

            {/* Realtime subtotal preview */}
            {subtotal > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded px-4 py-2 flex items-center justify-between">
                <span className="text-[11px] font-black text-blue-700 uppercase tracking-widest">Item Subtotal</span>
                <span className="font-black text-blue-900 text-sm tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded shadow-md hover:brightness-110 active:translate-y-px transition-all"
              >
                {isEditMode ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AHSP Sub-modal */}
      <AHSPSelectionModal
        isOpen={isAHSPOpen}
        onClose={() => setIsAHSPOpen(false)}
        onSelect={handleAHSPSelect}
      />
    </>
  );
};

export default AddItemModal;
