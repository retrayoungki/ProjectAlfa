import React, { useState, useEffect, useMemo } from 'react';
import { 
  getAllWorkUpdates, 
  saveWorkUpdate, 
  deleteWorkUpdate, 
  getWorkUpdatesByRole,
  addWorkUpdateComment,
  markCommentsAsRead
} from '../utils/workUpdateService';
import { canManageWorkUpdates } from '../utils/rbac';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Pending', 'Completed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

const WorkUpdates = ({ projects, currentUser }) => {
  const [updates, setUpdates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [currentUpdate, setCurrentUpdate] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterEmployee, setFilterEmployee] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    projectName: '',
    taskTitle: '',
    description: '',
    progress: 0,
    status: 'Not Started',
    startDate: '',
    endDate: '',
    notes: '',
    priority: 'Medium',
    department: currentUser?.department || 'General'
  });

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const loadUpdates = () => {
    const data = getWorkUpdatesByRole(currentUser, projects);
    // Sort by latest updated
    data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    setUpdates(data);
  };

  useEffect(() => {
    loadUpdates();
  }, [currentUser, projects]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (update = null) => {
    if (update) {
      setFormData(update);
      setCurrentUpdate(update);
    } else {
      setFormData({
        projectName: projects[0]?.name || '',
        taskTitle: '',
        description: '',
        progress: 0,
        status: 'Not Started',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        notes: '',
        priority: 'Medium',
        department: currentUser?.department || 'General'
      });
      setCurrentUpdate(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      userName: currentUser.name || currentUser.username,
      userId: currentUser.id,
      progress: Number(formData.progress)
    };
    
    saveWorkUpdate(payload);
    loadUpdates();
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this work update?')) {
      deleteWorkUpdate(id);
      loadUpdates();
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    addWorkUpdateComment(currentUpdate.id, currentUser, commentText, replyingTo);
    setCommentText('');
    setReplyingTo(null);
    loadUpdates();
    
    // Update local state to reflect new comment immediately in modal
    const updatedRecord = getWorkUpdatesByRole(currentUser, projects).find(u => u.id === currentUpdate.id);
    setCurrentUpdate(updatedRecord);
  };

  // Filter Logic
  const filteredUpdates = useMemo(() => {
    return updates.filter(u => {
      const matchSearch = u.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchProject = filterProject === 'All' || u.projectName === filterProject;
      const matchStatus = filterStatus === 'All' || u.status === filterStatus;
      const matchEmployee = filterEmployee === 'All' || u.userName === filterEmployee;
      const matchDate = !filterDate || u.updatedAt.startsWith(filterDate) || u.startDate === filterDate;
      
      return matchSearch && matchProject && matchStatus && matchEmployee && matchDate;
    });
  }, [updates, searchTerm, filterProject, filterStatus, filterEmployee, filterDate]);

  // Unique employees for filter dropdown
  const uniqueEmployees = [...new Set(updates.map(u => u.userName))];

  // Summary Metrics
  const totalActive = filteredUpdates.filter(u => u.status === 'In Progress').length;
  const totalCompleted = filteredUpdates.filter(u => u.status === 'Completed').length;
  const totalPending = filteredUpdates.filter(u => u.status === 'Pending').length;
  const avgProgress = filteredUpdates.length > 0 
    ? Math.round(filteredUpdates.reduce((acc, u) => acc + (Number(u.progress) || 0), 0) / filteredUpdates.length)
    : 0;

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-orange-600 bg-orange-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const isPrivileged = ['Director', 'Senior Project Manager'].includes(currentUser?.role);
  const canManage = canManageWorkUpdates(currentUser?.role);

  const hasUnreadComments = (update) => {
    if (!update.comments) return false;
    return update.comments.some(c => c.userName !== (currentUser.name || currentUser.username) && (!c.readBy || !c.readBy.includes(currentUser.id)));
  };

  return (
    <main className="flex-1 p-6 lg:p-gutter max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-primary mb-1 tracking-tight">Work Updates</h2>
          <p className="font-body-lg font-bold text-slate-700">Collaborative daily progress tracking and team reporting.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-primary text-white font-label-bold flex items-center gap-2 rounded hover:brightness-110 active:translate-y-px transition-all shadow-md border-b-2 border-primary-container"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Update
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-lg">
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-blue-50 rounded-full mb-4">
            <span className="material-symbols-outlined text-blue-600 text-3xl">trending_up</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Total Active Tasks</p>
          <h3 className="font-headline-xl font-black text-primary tabular-nums leading-none">{totalActive}</h3>
        </div>
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-emerald-50 rounded-full mb-4">
            <span className="material-symbols-outlined text-emerald-600 text-3xl">task_alt</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Completed Tasks</p>
          <h3 className="font-headline-xl font-black text-primary tabular-nums leading-none">{totalCompleted}</h3>
        </div>
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-amber-50 rounded-full mb-4">
            <span className="material-symbols-outlined text-amber-500 text-3xl">pending_actions</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Pending Tasks</p>
          <h3 className="font-headline-xl font-black text-primary tabular-nums leading-none">{totalPending}</h3>
        </div>
        <div className="bg-white p-lg border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-purple-50 rounded-full mb-4">
            <span className="material-symbols-outlined text-purple-600 text-3xl">donut_large</span>
          </div>
          <p className="text-outline font-label-bold font-bold uppercase text-[10px] tracking-widest mb-1">Average Progress</p>
          <h3 className="font-headline-xl font-black text-primary tabular-nums leading-none">{avgProgress}%</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm mb-lg flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded bg-slate-50 text-sm focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="px-4 py-2 border border-slate-200 rounded bg-slate-50 text-sm outline-none">
          <option value="All">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        {(isPrivileged || canManage) && (
          <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="px-4 py-2 border border-slate-200 rounded bg-slate-50 text-sm outline-none">
            <option value="All">All Employees</option>
            {uniqueEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
          </select>
        )}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-slate-200 rounded bg-slate-50 text-sm outline-none">
          <option value="All">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input 
          type="date" 
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded bg-slate-50 text-sm outline-none text-slate-600"
        />
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Task Info</th>
                <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider min-w-[150px]">Progress</th>
                <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider">Last Update</th>
                <th className="px-lg py-3 font-label-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUpdates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">assignment_turned_in</span>
                    <p className="font-bold">No work updates found.</p>
                  </td>
                </tr>
              ) : (
                filteredUpdates.map((update) => (
                  <tr key={update.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-lg py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{update.taskTitle}</span>
                        <span className="text-xs text-slate-500 mt-1">{update.projectName}</span>
                        <span className={`inline-block mt-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded w-max ${getPriorityBadge(update.priority)}`}>
                          {update.priority} Priority
                        </span>
                      </div>
                    </td>
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600">
                          {update.userName?.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{update.userName}</span>
                      </div>
                    </td>
                    <td className="px-lg py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(update.status)}`}>
                        {update.status}
                      </span>
                    </td>
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${update.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                            style={{ width: `${update.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold tabular-nums text-slate-600 w-8">{update.progress}%</span>
                      </div>
                    </td>
                    <td className="px-lg py-4">
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(update.updatedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-lg py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="relative">
                          <button 
                            onClick={() => {
                              setCurrentUpdate(update);
                              setIsCommentModalOpen(true);
                              if (hasUnreadComments(update)) {
                                markCommentsAsRead(update.id, currentUser.id);
                                loadUpdates();
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                            title="Comments"
                          >
                            <span className="material-symbols-outlined text-[18px]">{update.comments?.length > 0 ? 'forum' : 'chat_bubble_outline'}</span>
                          </button>
                          {hasUnreadComments(update) && (
                            <span className="absolute top-1 right-1 text-red-500 font-black text-[14px] leading-none select-none pointer-events-none">*</span>
                          )}
                        </div>
                        {(update.userId === currentUser.id || isPrivileged) && (
                          <>
                            <button onClick={() => handleOpenModal(update)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded" title="Edit">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button onClick={() => handleDelete(update.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <h3 className="font-headline-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">edit_document</span>
                {currentUpdate ? 'Edit Work Update' : 'New Work Update'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="updateForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project</label>
                    <select 
                      name="projectName" 
                      value={formData.projectName} 
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-slate-50"
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Task Title</label>
                    <input 
                      type="text" 
                      name="taskTitle"
                      value={formData.taskTitle}
                      onChange={handleInputChange}
                      placeholder="e.g. Foundation Pouring"
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-slate-50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Work Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the work done..."
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-slate-50 min-h-[80px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Progress ({formData.progress}%)</label>
                    <input 
                      type="range" 
                      name="progress"
                      min="0" max="100"
                      value={formData.progress}
                      onChange={handleInputChange}
                      className="w-full mt-2 accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                    <select 
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-slate-50"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Priority</label>
                    <select 
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-slate-50"
                    >
                      {PRIORITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                    <input 
                      type="date" 
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-slate-50 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">End Date (Expected)</label>
                    <input 
                      type="date" 
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-slate-50 text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes / Obstacles</label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any issues blocking progress?"
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-amber-50/30 min-h-[60px]"
                  />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded font-bold text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="updateForm"
                className="px-6 py-2 bg-primary text-white rounded font-bold text-sm hover:brightness-110 shadow-sm"
              >
                {currentUpdate ? 'Save Changes' : 'Submit Progress'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS MODAL */}
      {isCommentModalOpen && currentUpdate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-headline-md text-primary">Comments & Approvals</h3>
              <button onClick={() => setIsCommentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-50 space-y-4">
              {currentUpdate.comments?.length > 0 ? (
                currentUpdate.comments.map(c => (
                  <div key={c.id} className="bg-white p-3 rounded shadow-sm border border-slate-100 group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-primary">{c.userName}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setReplyingTo(c)} 
                          className="text-[9px] text-blue-600 font-bold uppercase tracking-widest hover:underline"
                        >
                          Reply
                        </button>
                        <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                    {c.replyTo && (
                      <div className="mb-2 pl-2 border-l-2 border-blue-200 bg-blue-50/50 p-1.5 rounded-r">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Replying to {c.replyTo.userName}</span>
                        <span className="text-[10px] text-slate-600 italic line-clamp-1">{c.replyTo.text}</span>
                      </div>
                    )}
                    <p className="text-sm text-slate-700">{c.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-slate-400 italic py-4">No comments yet.</p>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl flex flex-col gap-2">
              {replyingTo && (
                <div className="flex items-center justify-between bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded border border-blue-100">
                  <div className="flex-1 overflow-hidden pr-2">
                    <span className="font-bold block text-[10px] uppercase tracking-widest mb-0.5 text-blue-600">Replying to {replyingTo.userName}</span>
                    <span className="opacity-80 truncate block">{replyingTo.text}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="hover:text-blue-900 flex-shrink-0 bg-blue-100 hover:bg-blue-200 p-1 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-[14px] block">close</span>
                  </button>
                </div>
              )}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment or feedback..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-primary"
                />
                <button type="submit" disabled={!commentText.trim()} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold disabled:opacity-50">
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default WorkUpdates;
