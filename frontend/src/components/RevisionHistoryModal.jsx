/**
 * RevisionHistoryModal
 * Lists all revision snapshots for a project with restore functionality.
 */
import React from 'react';

const RevisionHistoryModal = ({ isOpen, onClose, revisions = [], onRestore, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="font-bold text-primary">Revision History</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {revisions.length} saved revision{revisions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">sync</span>
            </div>
          ) : revisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <span className="material-symbols-outlined text-5xl text-slate-200">history</span>
              <p className="text-sm font-black text-slate-400">No revisions saved yet</p>
              <p className="text-xs text-slate-300">Click "Save Revision" to create the first snapshot.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Revision</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Saved By</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revisions.map((rev, idx) => (
                  <tr key={rev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${idx === 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {rev.label}
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded">LATEST</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">
                      {rev.notes || <span className="text-slate-300 italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{rev.createdBy || '—'}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{rev.createdAt}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Restore ${rev.label}? Data saat ini akan diganti dengan snapshot ini.`)) {
                            onRestore(rev.id);
                            onClose();
                          }
                        }}
                        className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-black rounded hover:bg-primary hover:text-white hover:border-primary transition-all"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-bold italic shrink-0">
          * Restoring a revision only changes your view. Save a new revision to confirm.
        </div>
      </div>
    </div>
  );
};

export default RevisionHistoryModal;
