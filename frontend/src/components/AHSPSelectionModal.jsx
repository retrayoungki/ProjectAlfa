import React, { useState, useEffect } from 'react';
import { loadAHSPItems } from '../services/ahspService';

const AHSPSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      loadAHSPItems()
        .then(data => setItems(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredData = items.filter(item => 
    item.status === 'Active' && (
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-primary">Load AHSP Master Data</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Select from central library</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
              placeholder="Search active AHSP code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-32">Code</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-32">Category</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center w-20">Unit</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right w-32">Unit Price</th>
                <th className="px-6 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-primary">{item.code}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{item.category || 'General'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 line-clamp-2" title={item.description}>{item.description}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 text-center">{item.unit}</td>
                  <td className="px-6 py-4 text-sm font-tabular-nums font-bold text-slate-900 text-right">
                    Rp {item.unitPrice.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        // The CostEngine expects "price", our DB uses "unitPrice"
                        onSelect({
                          ...item,
                          price: item.unitPrice
                        });
                        onClose();
                      }}
                      className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredData.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">search_off</span>
                    <p className="text-sm font-bold">No active AHSP items found</p>
                    <p className="text-xs">Add items in the AHSP Library first.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-bold flex justify-between">
          <span className="italic">* Only 'Active' status items are shown here.</span>
          <span>Total: {filteredData.length} items</span>
        </div>
      </div>
    </div>
  );
};

export default AHSPSelectionModal;
