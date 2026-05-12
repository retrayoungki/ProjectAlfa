/**
 * AddCategoryModal
 * Simple modal for adding a new WBS category/section.
 */
import React, { useState } from 'react';

const SUGGESTED_CATEGORIES = [
  'Preparation', 'Structural', 'Architectural',
  'MEP (Mechanical, Electrical, Plumbing)',
  'Finishing', 'Landscaping', 'External Works',
  'Provisional Sum', 'Preliminaries',
];

const AddCategoryModal = ({ isOpen, onClose, onAdd, existingCategories = [] }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const suggestions = SUGGESTED_CATEGORIES.filter(
    s => !existingCategories.includes(s) && s.toLowerCase().includes(name.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
    onClose();
  };

  const handleSelect = (cat) => {
    setName(cat);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-primary">Add WBS Category</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Work Breakdown Structure</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              autoFocus
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
              placeholder="e.g. Finishing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && name.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 5).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelect(s)}
                    className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded hover:bg-primary hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && name.length === 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Common Categories</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 6).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelect(s)}
                    className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded hover:bg-primary hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              Add Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
