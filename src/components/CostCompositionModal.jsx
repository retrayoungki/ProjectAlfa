import React, { useState, useEffect } from 'react';

// Mock Master Resources (would typically be fetched from API)
const MASTER_MATERIALS = [
  { id: 'M01', name: 'Portland Cement', unit: 'kg', price: 1500 },
  { id: 'M02', name: 'Sand', unit: 'm3', price: 250000 },
  { id: 'M03', name: 'Gravel', unit: 'm3', price: 300000 },
  { id: 'M04', name: 'Steel Rebar', unit: 'kg', price: 12500 },
];

const MASTER_LABOR = [
  { id: 'L01', name: 'Worker', unit: 'OH', price: 120000 },
  { id: 'L02', name: 'Foreman', unit: 'OH', price: 180000 },
  { id: 'L03', name: 'Skilled Builder', unit: 'OH', price: 150000 },
];

const MASTER_EQUIP = [
  { id: 'E01', name: 'Concrete Mixer', unit: 'Day', price: 500000 },
  { id: 'E02', name: 'Excavator', unit: 'Hour', price: 350000 },
];

const CostCompositionModal = ({ isOpen, onClose, wbsItem, onSave, isPrivileged }) => {
  const [composition, setComposition] = useState({ materials: [], labor: [], equipment: [] });

  useEffect(() => {
    if (isOpen && wbsItem) {
      // If the wbsItem already has a composition, load it. Otherwise, populate mock data based on name.
      if (wbsItem.composition) {
        setComposition(wbsItem.composition);
      } else if (wbsItem.description.toLowerCase().includes('concrete')) {
        setComposition({
          materials: [
            { resourceId: 'M01', name: 'Portland Cement', qty: 384, unit: 'kg', price: 1500 },
            { resourceId: 'M02', name: 'Sand', qty: 0.49, unit: 'm3', price: 250000 },
            { resourceId: 'M03', name: 'Gravel', qty: 0.51, unit: 'm3', price: 300000 },
          ],
          labor: [
            { resourceId: 'L01', name: 'Worker', qty: 1.65, unit: 'OH', price: 120000 },
            { resourceId: 'L02', name: 'Foreman', qty: 0.16, unit: 'OH', price: 180000 },
          ],
          equipment: [
            { resourceId: 'E01', name: 'Concrete Mixer', qty: 0.25, unit: 'Day', price: 500000 },
          ]
        });
      } else {
        // Empty composition
        setComposition({ materials: [], labor: [], equipment: [] });
      }
    }
  }, [isOpen, wbsItem]);

  if (!isOpen) return null;

  const handleQtyChange = (category, index, value) => {
    if (!isPrivileged) return;
    const newQty = parseFloat(value) || 0;
    setComposition(prev => {
      const newCategory = [...prev[category]];
      newCategory[index].qty = newQty;
      return { ...prev, [category]: newCategory };
    });
  };

  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  };

  const matTotal = calculateSubtotal(composition.materials);
  const labTotal = calculateSubtotal(composition.labor);
  const eqpTotal = calculateSubtotal(composition.equipment);
  const grandTotal = matTotal + labTotal + eqpTotal;

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const handleApply = () => {
    onSave({
      ...wbsItem,
      unitPrice: grandTotal,
      composition: composition
    });
    onClose();
  };

  const renderTable = (title, items, categoryKey) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          {title}
        </h4>
        <span className="text-xs font-bold text-slate-500">{formatCurrency(calculateSubtotal(items))}</span>
      </div>
      <table className="w-full text-left border-collapse border border-slate-200 rounded overflow-hidden">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase">Resource Name</th>
            <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase text-center w-20">Unit</th>
            <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase text-right w-24">Coefficient</th>
            <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase text-right w-32">Standard Price</th>
            <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase text-right w-32">Total Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-xs font-bold text-slate-800">{item.name}</td>
              <td className="px-3 py-2 text-xs font-medium text-slate-500 text-center">{item.unit}</td>
              <td className="p-0 border-l border-r border-slate-100">
                <input 
                  type="number" step="0.01"
                  value={item.qty}
                  onChange={(e) => handleQtyChange(categoryKey, idx, e.target.value)}
                  disabled={!isPrivileged}
                  className="w-full h-full px-3 py-2 text-right text-xs font-bold text-primary bg-transparent focus:bg-blue-50 focus:outline-none"
                />
              </td>
              <td className="px-3 py-2 text-xs font-medium text-slate-500 text-right">{formatCurrency(item.price)}</td>
              <td className="px-3 py-2 text-xs font-bold text-slate-800 text-right bg-slate-50">{formatCurrency(item.qty * item.price)}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan="5" className="px-3 py-4 text-center text-xs text-slate-400 font-medium italic">No items configured</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-headline-md text-primary">Cost Analysis Composition (AHSP)</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Building Unit Price for: <span className="font-bold text-slate-800">{wbsItem?.description}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {renderTable('Materials', composition.materials, 'materials')}
          {renderTable('Labor', composition.labor, 'labor')}
          {renderTable('Equipment', composition.equipment, 'equipment')}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calculated Unit Price</span>
            <span className="font-headline-md text-primary">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-200 rounded transition-colors">
              Cancel
            </button>
            {isPrivileged && (
              <button onClick={handleApply} className="px-8 py-2 bg-primary text-white rounded font-black text-xs uppercase tracking-widest shadow-md hover:brightness-110 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Apply to Estimate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostCompositionModal;
