/**
 * SaveRevisionModal
 * Prompts user to confirm + add notes before saving a cost estimation revision.
 */
import React, { useState } from 'react';

const SaveRevisionModal = ({ isOpen, onClose, onSave, currentRevision, isSaving }) => {
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const nextRev = (currentRevision || 0) + 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(notes);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-primary">Save Revision</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              This will create <span className="text-primary">Rev {nextRev}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Revision info */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-600 text-3xl">history</span>
            <div>
              <p className="font-black text-blue-900 text-sm">Rev {nextRev} Snapshot</p>
              <p className="text-[11px] text-blue-600">
                Seluruh data WBS, quantity, harga, dan parameter (OH/Profit/PPN) akan disimpan.
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Revision Notes (optional)
            </label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Updated structural quantities after site survey..."
            />
          </div>

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
              disabled={isSaving}
              className="flex-1 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded shadow-md hover:brightness-110 active:translate-y-px transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSaving ? (
                <><span className="material-symbols-outlined text-sm animate-spin">sync</span> Saving...</>
              ) : (
                <><span className="material-symbols-outlined text-sm">save</span> Save Rev {nextRev}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveRevisionModal;
