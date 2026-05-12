import React, { useState, useMemo, useRef } from 'react';
import { useAHSP } from '../hooks/useAHSP';
import { canEditAHSP } from '../utils/rbac';
import { exportToExcel, printAHSPReport, parseExcelImport } from '../utils/ahspExport';
import AHSPFormModal from '../components/AHSPFormModal';

const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const Toast = ({ toast }) => {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-lg shadow-xl font-bold text-sm transition-all animate-in slide-in-from-bottom-4 duration-300 ${isSuccess ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      <span className="material-symbols-outlined text-[18px]">{isSuccess ? 'check_circle' : 'error'}</span>
      {toast.message}
    </div>
  );
};

const AHSPLibrary = ({ currentUser }) => {
  const { items, loading, error, toast, handleAdd, handleUpdate, handleDelete, handleImport } = useAHSP(currentUser);
  const isPrivileged = canEditAHSP(currentUser?.role);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const fileInputRef = useRef(null);

  const categories = useMemo(() => ['All', ...new Set(items.map(i => i.category).filter(Boolean))], [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, searchTerm, categoryFilter]);

  const handleSave = async (data) => {
    let success = false;
    if (editItem) {
      success = await handleUpdate(editItem.id, data);
    } else {
      success = await handleAdd(data);
    }
    if (success) setFormModalOpen(false);
  };

  const openAdd = () => {
    setEditItem(null);
    setFormModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormModalOpen(true);
  };

  const handleDuplicate = async (item) => {
    if (!isPrivileged) return;
    const { id, code, ...rest } = item;
    const newCode = `${code}-COPY-${Math.floor(Math.random() * 1000)}`;
    await handleAdd({ ...rest, code: newCode, description: `${rest.description} (Copy)` });
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsedData = await parseExcelImport(file);
      if (parsedData.length > 0) {
        if (window.confirm(`Found ${parsedData.length} valid items to import. Proceed?`)) {
          await handleImport(parsedData);
        }
      } else {
        alert("No valid items found in the Excel file. Ensure columns match the required format.");
      }
    } catch (err) {
      alert(err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">refresh</span>
          <p className="mt-2 text-sm font-bold text-slate-400">Loading AHSP Library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-red-400">cloud_off</span>
          <p className="mt-3 font-bold text-slate-600">Failed to load AHSP Library</p>
          <p className="text-sm text-slate-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      <Toast toast={toast} />

      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white shrink-0 z-10 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-primary mb-1 tracking-tight">AHSP Master Library</h2>
            <p className="text-sm font-medium text-slate-500">Manage Analisa Harga Satuan Pekerjaan across all projects.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".xlsx, .xls" className="hidden" />
            
            {isPrivileged && (
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2 text-sm transition-colors">
                <span className="material-symbols-outlined text-[18px]">upload_file</span> Import Excel
              </button>
            )}
            
            <div className="relative group">
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2 text-sm transition-colors">
                <span className="material-symbols-outlined text-[18px]">download</span> Export
              </button>
              <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <button onClick={() => exportToExcel(filteredItems)} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Export to Excel</button>
                <button onClick={() => printAHSPReport(filteredItems, currentUser?.name)} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Print / PDF</button>
              </div>
            </div>

            {isPrivileged && (
              <button onClick={openAdd} className="px-4 py-2 bg-primary text-white font-bold rounded shadow-sm hover:brightness-110 flex items-center gap-2 text-sm transition-all active:scale-95 ml-2">
                <span className="material-symbols-outlined text-[18px]">add</span> Add Item
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mt-6">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Search code or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-48 px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold text-slate-600"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6 relative">
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden min-h-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 w-32">Code</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 w-48">Category</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-r border-slate-200">Description</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 w-24 text-center">Unit</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 w-36 text-right">Price (Rp)</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 w-24 text-center">Status</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 border-r border-slate-100 text-xs font-bold text-slate-700">{item.code}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-xs font-medium text-slate-500">{item.category || 'General'}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-sm font-medium text-slate-800 line-clamp-2" title={item.description}>{item.description}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-xs font-bold text-slate-500 text-center">{item.unit}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-sm font-black text-primary text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title={isPrivileged ? "Edit" : "View Details"}>
                        <span className="material-symbols-outlined text-[18px]">{isPrivileged ? 'edit' : 'visibility'}</span>
                      </button>
                      {isPrivileged && (
                        <>
                          <button onClick={() => handleDuplicate(item)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors" title="Duplicate">
                            <span className="material-symbols-outlined text-[18px]">content_copy</span>
                          </button>
                          <button onClick={() => { if (window.confirm(`Delete ${item.code}?`)) handleDelete(item.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">search_off</span>
                    <p className="font-bold text-sm">No AHSP items found</p>
                    <p className="text-xs">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AHSPFormModal 
        isOpen={formModalOpen} 
        onClose={() => setFormModalOpen(false)} 
        initialData={editItem} 
        onSave={handleSave} 
        isPrivileged={isPrivileged}
      />
    </div>
  );
};

export default AHSPLibrary;
