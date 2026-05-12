import React, { useState, useEffect } from 'react';
import DateInput from './DateInput';

const AddProjectModal = ({ isOpen, onClose, onProjectAdded, initialData, onProjectUpdated, workers }) => {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([
    { id: 1, name: 'Frenchwalk Property' },
    { id: 2, name: 'Global Towers Inc' }
  ]);

  const [formData, setFormData] = useState({
    projectName: '',
    code: '',
    clientId: '',
    projectType: '',
    description: '',
    address: '',
    startDate: '',
    endDate: '',
    budget: '',
    billingType: 'Fixed',
    projectManagerId: '',
    teamMemberIds: [],
    milestones: []
  });

  const [newMilestone, setNewMilestone] = useState({ name: '', date: '', type: 'General' });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        projectName: initialData.name || '',
        code: initialData.code || '',
        clientId: initialData.client || '',
        projectType: initialData.projectType || '',
        description: initialData.description || '',
        address: initialData.address || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        budget: initialData.budget || '',
        billingType: initialData.billingType || 'Fixed',
        projectManagerId: initialData.projectManager || '',
        teamMemberIds: initialData.teamMemberIds || [],
        milestones: initialData.milestones || []
      });
      setStep(1);
    } else if (isOpen && !initialData) {
      // Reset form on open for new project
      setFormData({
        projectName: '',
        code: '',
        clientId: '',
        projectType: '',
        description: '',
        address: '',
        startDate: '',
        endDate: '',
        budget: '',
        billingType: 'Fixed',
        projectManagerId: '',
        teamMemberIds: [],
        milestones: []
      });
      setStep(1);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addMilestone = () => {
    if (!newMilestone.name || !newMilestone.date) return;
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }));
    setNewMilestone({ name: '', date: '', type: 'General' });
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple Validation
    const requiredFields = ['projectName', 'clientId', 'startDate', 'endDate'];
    const missingFields = requiredFields.filter(f => !formData[f]);
    
    if (missingFields.length > 0) {
      alert(`Please fill all required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert('End date cannot be before start date');
      return;
    }

    try {
      if (initialData && onProjectUpdated) {
        onProjectUpdated({ id: initialData.id, ...formData });
        alert('Project updated successfully!');
      } else if (onProjectAdded) {
        onProjectAdded(formData);
        alert('Project created successfully!');
      } else {
        console.warn('No add/update handler provided to AddProjectModal');
      }
      onClose();
      setStep(1); // Reset
    } catch (err) {
      console.error('Error saving project:', err);
      alert('Failed to save project. Please check the console for details.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-lg py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-headline-md text-primary">{initialData ? 'Edit Project' : 'Add New Project'}</h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-100 flex">
          <div className={`h-full bg-primary transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>

        {/* Form Body */}
        <form className="p-lg overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project Name *</label>
                  <input 
                    name="projectName" value={formData.projectName} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm" 
                    placeholder="e.g. Meruya Residence" 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project Code</label>
                  <input 
                    name="code" value={formData.code} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm uppercase" 
                    placeholder="e.g. PRJ-2024-002" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Client *</label>
                  <input 
                    name="clientId" value={formData.clientId} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                    placeholder="Enter client name..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project Type</label>
                  <input 
                    name="projectType" value={formData.projectType} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                    placeholder="e.g. Construction, Consulting..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea 
                  name="description" value={formData.description} onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm" 
                  placeholder="Short project overview..."
                ></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project Address / Location</label>
                <input 
                  name="address" value={formData.address} onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm"
                  placeholder="e.g. Jl. Sudirman No.12, Jakarta Selatan"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Start Date *</label>
                  <DateInput 
                    name="startDate" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded outline-none font-bold text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">End Date *</label>
                  <DateInput 
                    name="endDate" 
                    value={formData.endDate} 
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded outline-none font-bold text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Budget (Rp)</label>
                  <input 
                    type="text" name="budget" 
                    value={formData.budget ? Number(formData.budget.toString().replace(/\D/g, '')).toLocaleString('id-ID') : ''} 
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, budget: rawValue }));
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm" 
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Billing Type</label>
                  <select 
                    name="billingType" value={formData.billingType} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                  >
                    <option>Fixed</option>
                    <option>Hourly</option>
                    <option>Retainer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project Manager</label>
                  <select 
                    name="projectManagerId" value={formData.projectManagerId} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                  >
                    <option value="">Select Manager</option>
                    {workers?.map(w => <option key={w.id} value={w.name}>{w.name} ({w.role})</option>)}
                  </select>
                </div>
              </div>

              {/* Milestones Section */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Milestones</label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none font-bold" 
                      placeholder="Milestone Name" 
                      value={newMilestone.name}
                      onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <DateInput 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none font-bold" 
                      value={newMilestone.date}
                      onChange={(e) => setNewMilestone({...newMilestone, date: e.target.value})}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={addMilestone}
                    className="p-2 bg-primary text-white rounded hover:brightness-110"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                
                {/* Milestones List */}
                <div className="space-y-2">
                  {formData.milestones.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded border border-slate-100">
                      <div>
                        <p className="text-xs font-black text-slate-900">{m.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{m.date.split('-').reverse().join('/')} • {m.type}</p>
                      </div>
                      <button type="button" onClick={() => removeMilestone(idx)} className="text-slate-300 hover:text-red-500">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </form>

        {/* Footer Actions */}
        <div className="px-lg py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button 
            type="button"
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            className="px-6 py-2 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Previous'}
          </button>
          
          {step < 3 ? (
            <button 
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-8 py-2.5 bg-primary text-white rounded font-black text-xs uppercase tracking-widest shadow-md hover:brightness-110 active:translate-y-px transition-all flex items-center gap-2"
            >
              Next Step
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-green-600 text-white rounded font-black text-xs uppercase tracking-widest shadow-md hover:brightness-110 active:translate-y-px transition-all flex items-center gap-2"
            >
              Save Project
              <span className="material-symbols-outlined text-sm">{initialData ? 'save' : 'check'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddProjectModal;
