import React, { useState, useEffect } from 'react'
import AddProjectModal from '../components/AddProjectModal'
import { ROLES, getPermissionLabel, getRoleBadgeStyle } from '../utils/rbac'

const PRIVILEGED_ROLES = [ROLES.DIRECTOR, ROLES.SENIOR_PM]

const Settings = ({ projects, setProjects, workers, setWorkers, currentUser, systemUsers, setSystemUsers }) => {
  const [activeSubTab, setActiveSubTab] = useState('projects')
  
  // Project Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentEditProject, setCurrentEditProject] = useState(null)
  const [isAddMode, setIsAddMode] = useState(false)

  // State for Form Inputs
  const [formData, setFormData] = useState({
    name: '',
    role: 'Director',
    empId: '',
    skills: '',
    contact: '',
    status: 'ON SITE',
    hasLoginAccess: false,
    username: '',
    password: ''
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const [userFormData, setUserFormData] = useState({ id: null, username: '', email: '', password: '', role: 'Project Manager', status: 'Active' });

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userFormData.username || !userFormData.password) {
      alert('Username and Password are required');
      return;
    }
    
    if (userFormData.id) {
      setSystemUsers(systemUsers.map(u => u.id === userFormData.id ? userFormData : u));
    } else {
      setSystemUsers([{ ...userFormData, id: 'usr-' + Date.now() }, ...systemUsers]);
    }
    
    setUserFormData({ id: null, username: '', email: '', password: '', role: 'Project Manager', status: 'Active' });
    alert('User account saved successfully!');
  };

  const handleEditUser = (user) => {
    setUserFormData(user);
  };

  const handleEditWorker = (worker) => {
    if (!worker) return;
    const linkedUser = systemUsers?.find(u => u.workerId === worker.id);
    setFormData({
      id: worker.id,
      name: worker.name || '',
      role: worker.role || 'Director',
      empId: worker.id || '',
      skills: worker.skills || '',
      contact: worker.contact || '',
      status: worker.status || 'ON SITE',
      hasLoginAccess: !!linkedUser,
      username: linkedUser?.username || '',
      password: linkedUser?.password || ''
    });
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteWorker = (id) => {
    if (!id) return;
    
    // Prevent deleting the active user
    if (currentUser && (currentUser.id === id || currentUser.workerId === id)) {
      alert("Cannot delete the active user. Please switch to another account first.");
      return;
    }

    setWorkers(prev => prev.filter(w => w.id !== id));
    setSystemUsers(prev => prev.filter(u => u.workerId !== id));
    alert("Worker deleted successfully.");
  };

  const handleDeleteUser = (id) => {
    if(window.confirm('Are you sure you want to delete this user?')) {
      setSystemUsers(systemUsers.filter(u => u.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.empId) {
      alert('Please fill in Name and Employee ID')
      return
    }

    const initials = formData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    const workerData = {
      id: formData.empId,
      name: formData.name,
      role: formData.role,
      contact: formData.contact,
      status: formData.status,
      initials: initials
    }

    // Check if updating existing worker
    const isEdit = !!formData.id;
    
    if (isEdit) {
      // Check if they are trying to change the ID to one that already exists
      if (formData.id !== formData.empId && workers.some(w => w.id === formData.empId)) {
        alert('Employee ID already exists. Please choose a different ID.');
        return;
      }
      setWorkers(workers.map(w => w.id === formData.id ? workerData : w));
    } else {
      if (workers.some(w => w.id === formData.empId)) {
        alert('Employee ID already exists. Please choose a different ID.');
        return;
      }
      setWorkers([workerData, ...workers]);
    }
    
    // Sync with System Users if login access is granted
    if (formData.hasLoginAccess) {
      const existingUser = systemUsers.find(u => u.workerId === (isEdit ? formData.id : formData.empId));
      const userData = {
        id: existingUser?.id || 'usr-' + Date.now(),
        workerId: formData.empId,
        username: formData.username || formData.name.toLowerCase().replace(/\s/g, ''),
        email: formData.contact ? `${formData.name.toLowerCase().replace(/\s/g, '')}@projectalfa.com` : '',
        password: formData.password || 'password123',
        role: formData.role,
        status: 'Active'
      };
      
      if (existingUser) {
        setSystemUsers(systemUsers.map(u => u.workerId === formData.id ? userData : u));
      } else {
        setSystemUsers([userData, ...systemUsers]);
      }
    } else {
      // Remove access if toggle is off
      setSystemUsers(systemUsers.filter(u => u.workerId !== (isEdit ? formData.id : formData.empId)));
    }
    
    // Reset Form
    setFormData({
      id: null,
      name: '',
      role: 'Director',
      empId: '',
      skills: '',
      contact: '',
      status: 'ON SITE',
      hasLoginAccess: false,
      username: '',
      password: ''
    })
    
    alert(isEdit ? 'Worker updated successfully!' : 'Worker registered successfully!')
  }

  const handleDeleteProject = (id) => {
    if (window.confirm('Are you sure you want to delete this project? This will remove it from all dashboards and schedules.')) {
      setProjects(projects.filter(p => p.id !== id))
    }
  }

  const handleAddClick = () => {
    setCurrentEditProject(null)
    setIsAddMode(true)
    setIsEditModalOpen(true)
  }

  const handleEditClick = (project) => {
    setCurrentEditProject(project)
    setIsAddMode(false)
    setIsEditModalOpen(true)
  }

  const handleProjectAdded = (newProject) => {
    if (!newProject) return;
    const projectFormatted = {
      id: projects && projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
      name: newProject.projectName,
      code: newProject.code || '',
      status: 'On Track',
      progress: 0,
      budget: newProject.budget || '0',
      client: newProject.clientId,
      projectType: newProject.projectType || 'Construction',
      billingType: newProject.billingType || 'Fixed',
      projectManager: newProject.projectManagerId || 'Unassigned',
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      icon: 'apartment',
      color: 'blue',
      milestones: newProject.milestones || []
    }
    setProjects(prev => [projectFormatted, ...(prev || [])]);
    setIsEditModalOpen(false);
  }

  const handleProjectUpdated = (updatedData) => {
    setProjects(projects.map(p => {
      if (p.id === updatedData.id) {
        return {
          ...p,
          name: updatedData.projectName,
          code: updatedData.code || p.code || '',
          client: updatedData.clientId,
          projectType: updatedData.projectType,
          address: updatedData.address || '',
          startDate: updatedData.startDate,
          endDate: updatedData.endDate,
          budget: updatedData.budget,
          billingType: updatedData.billingType,
          projectManager: updatedData.projectManagerId,
          milestones: updatedData.milestones || []
        }
      }
      return p
    }))
  }

  return (
    <div className="p-lg max-w-[1440px] mx-auto space-y-lg">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-4xl font-black text-primary mb-1 tracking-tight">Settings & Management</h2>
          <p className="text-slate-700 font-body-lg">Configure project resources, team roles, and system preferences.</p>
        </div>
      </div>

      <div className="flex gap-8 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveSubTab('general')}
          className={`pb-4 text-sm font-bold transition-all ${activeSubTab === 'general' ? 'text-[#8A4A00] border-b-2 border-[#8A4A00] font-black' : 'text-slate-700 hover:text-slate-900 font-bold'}`}
        >
          General Configuration
        </button>
        <button 
          onClick={() => setActiveSubTab('projects')}
          className={`pb-4 text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'projects' ? 'text-[#8A4A00] border-b-2 border-[#8A4A00] font-black' : 'text-slate-700 hover:text-slate-900 font-bold'}`}
        >
          <span className="material-symbols-outlined text-[18px]">apartment</span>
          Project Management
        </button>
        <button 
          onClick={() => setActiveSubTab('manpower')}
          className={`pb-4 text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'manpower' ? 'text-[#8A4A00] border-b-2 border-[#8A4A00] font-black' : 'text-slate-700 hover:text-slate-900 font-bold'}`}
        >
          <span className="material-symbols-outlined text-[18px]">groups</span>
          User Management
        </button>
        <button 
          onClick={() => setActiveSubTab('security')}
          className={`pb-4 text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'security' ? 'text-[#8A4A00] border-b-2 border-[#8A4A00] font-black' : 'text-slate-700 hover:text-slate-900 font-bold'}`}
        >
          <span className="material-symbols-outlined text-[18px]">security</span>
          Access Control
        </button>
      </div>

      {activeSubTab === 'projects' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="px-lg py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="font-headline-md text-primary">Active Projects Registry</h3>
            {PRIVILEGED_ROLES.includes(currentUser?.role) && (
              <button 
                onClick={handleAddClick}
                className="px-4 py-2 bg-primary text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 rounded hover:brightness-110 active:translate-y-px transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add New Project
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Project Name</th>
                  <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Budget</th>
                  <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded bg-${project.color}-100 flex items-center justify-center text-${project.color}-700`}>
                          <span className="material-symbols-outlined text-[18px]">{project.icon || 'apartment'}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{project.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold tracking-widest">{project.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        project.status === 'On Track' ? 'bg-green-50 text-green-700' : 
                        project.status === 'Delayed' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-lg py-4 text-sm font-bold text-slate-700">
                      Rp {Number(project.budget).toLocaleString('id-ID')}
                    </td>
                    <td className="px-lg py-4 text-right">
                      {PRIVILEGED_ROLES.includes(currentUser?.role) ? (
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => handleEditClick(project)} className="text-slate-400 hover:text-primary transition-colors" title="Edit Project">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteProject(project.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete Project">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 text-slate-300" title="Hanya Director / Senior Project Manager yang dapat mengedit">
                          <span className="material-symbols-outlined text-[16px]">lock</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">No Access</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400 font-medium">No active projects found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'manpower' && (
        <div className="grid grid-cols-12 gap-lg">
          {/* User Input Form */}
          <div className="col-span-12 lg:col-span-4 space-y-lg">
            <div className="bg-white p-lg rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-headline-md text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{!!formData.id ? 'edit_square' : 'person_add'}</span>
                {!!formData.id ? 'Edit Worker' : 'Add New Worker'}
              </h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" 
                    placeholder="e.g. Robert Wilson" 
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Role / Position</label>
                    <select 
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium appearance-none"
                    >
                      <option>{ROLES.DIRECTOR}</option>
                      <option>{ROLES.SENIOR_PM}</option>
                      <option>{ROLES.PROJECT_MANAGER}</option>
                      <option>{ROLES.ADMIN}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Employee ID</label>
                    <input 
                      type="text" 
                      name="empId"
                      value={formData.empId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium disabled:opacity-50 disabled:bg-slate-100" 
                      placeholder="P-1024" 
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Skills / Certifications</label>
                  <input 
                    type="text" 
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" 
                    placeholder="e.g. Scaffolding, First Aid" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contact Number</label>
                  <input 
                    type="tel" 
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" 
                    placeholder="+62 812-3456-7890" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium appearance-none"
                  >
                    <option>ON SITE</option>
                    <option>OFF SITE</option>
                    <option>HYBRID</option>
                  </select>
                </div>

                {/* Login Access Toggle */}
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        name="hasLoginAccess"
                        checked={formData.hasLoginAccess}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                    </div>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider group-hover:text-primary transition-colors">Give Login Access</span>
                  </label>
                </div>

                {formData.hasLoginAccess && (
                  <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Login Username</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">alternate_email</span>
                        <input 
                          type="text" 
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-4 py-2 bg-primary/5 border border-primary/20 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm" 
                          placeholder="e.g. robert.wilson" 
                          required={formData.hasLoginAccess}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Login Password</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">lock</span>
                        <input 
                          type="password" 
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-4 py-2 bg-primary/5 border border-primary/20 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm" 
                          placeholder="••••••••" 
                          required={formData.hasLoginAccess}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full py-3 bg-primary text-white font-black rounded shadow-md hover:brightness-110 active:translate-y-px transition-all mt-4 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">save</span>
                  {!!formData.id ? 'Update' : 'Register'} Worker
                </button>
                {!!formData.id && (
                  <button 
                    type="button" 
                    onClick={() => setFormData({ id: null, name: '', role: 'Director', empId: '', skills: '', contact: '', status: 'ON SITE', hasLoginAccess: false, username: '', password: '' })}
                    className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded hover:bg-slate-200 transition-all mt-2"
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-lg rounded-lg">
              <h4 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">info</span>
                Quick Tip
              </h4>
              <p className="text-blue-700 text-xs leading-relaxed">
                Assigning correct roles ensures proper resource allocation in the <b>Schedule</b> and <b>Budget</b> modules.
              </p>
            </div>
          </div>

          {/* User List Table */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="px-lg py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-headline-md text-primary">Team Directory</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input type="text" className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary outline-none w-48" placeholder="Search team..." />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Worker Info</th>
                    <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-lg py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary font-black text-xs">
                            {worker.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-slate-900 text-sm">{worker.name}</p>
                              {systemUsers.some(u => u.workerId === worker.id) && (
                                <span className="material-symbols-outlined text-primary text-[14px]" title="Has Login Access">verified_user</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-bold">ID: {worker.id} • {worker.contact}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-4">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{worker.role}</span>
                      </td>
                      <td className="px-lg py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          worker.status === 'ON SITE' 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : worker.status === 'OFF SITE'
                              ? 'bg-orange-50 text-orange-700 border-orange-100'
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            worker.status === 'ON SITE' 
                              ? 'bg-green-500' 
                              : worker.status === 'OFF SITE'
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                          }`}></span>
                          {worker.status}
                        </span>
                      </td>
                      <td className="px-lg py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditWorker(worker);
                            }}
                            className="text-slate-400 hover:text-primary transition-colors p-2"
                            title="Edit Worker"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteWorker(worker.id);
                            }}
                            className="p-2 -m-2 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                            title="Delete Worker"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-lg bg-slate-50 border-t border-slate-200">
              <button className="w-full py-2.5 border-2 border-dashed border-slate-300 text-slate-500 font-bold text-xs rounded hover:bg-white hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">group_add</span>
                Bulk Import from Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab !== 'manpower' && activeSubTab !== 'projects' && activeSubTab !== 'security' && (
        <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest">Section Under Development</p>
        </div>
      )}

      {activeSubTab === 'security' && (
        <div className="grid grid-cols-12 gap-lg">
          <div className="col-span-12 lg:col-span-4 space-y-lg">
            <div className="bg-white p-lg rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-headline-md text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                {userFormData.id ? 'Edit User Account' : 'Add User Account'}
              </h3>
              <form className="space-y-4" onSubmit={handleUserSubmit}>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Username</label>
                  <input type="text" name="username" value={userFormData.username} onChange={handleUserInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded outline-none font-medium" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                  <input type="email" name="email" value={userFormData.email} onChange={handleUserInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                  <input type="text" name="password" value={userFormData.password} onChange={handleUserInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded outline-none font-medium" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
                    <select name="role" value={userFormData.role} onChange={handleUserInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded outline-none font-medium appearance-none">
                      <option>{ROLES.DIRECTOR}</option>
                      <option>{ROLES.SENIOR_PM}</option>
                      <option>{ROLES.PROJECT_MANAGER}</option>
                      <option>{ROLES.ADMIN}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                    <select name="status" value={userFormData.status} onChange={handleUserInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded outline-none font-medium appearance-none">
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {userFormData.id && (
                    <button type="button" onClick={() => setUserFormData({ id: null, username: '', email: '', password: '', role: 'Project Manager', status: 'Active' })} className="w-full py-3 bg-slate-100 text-slate-600 font-black rounded shadow-sm hover:bg-slate-200 transition-all flex items-center justify-center">
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="w-full py-3 bg-primary text-white font-black rounded shadow-md hover:brightness-110 active:translate-y-px transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">save</span>
                    {userFormData.id ? 'Update' : 'Create'} User
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="px-lg py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-headline-md text-primary">System Access List</h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Account</th>
                    <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Role & Permission</th>
                    <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="px-lg py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {systemUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-lg py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs">
                            {user.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{user.username}</p>
                            <p className="text-[11px] text-slate-500 font-bold">{user.email || 'No email provided'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{user.role}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(user.role)}`}>
                            {getPermissionLabel(user.role)}
                          </span>
                        </div>
                      </td>
                      <td className="px-lg py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          user.status === 'Active' 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-lg py-4 text-right">
                        <button onClick={() => handleEditUser(user)} className="text-slate-400 hover:text-primary transition-colors mr-3" title="Edit"><span className="material-symbols-outlined text-lg">edit</span></button>
                        <button onClick={() => handleDeleteUser(user.id)} className="text-slate-400 hover:text-error transition-colors" title="Delete"><span className="material-symbols-outlined text-lg">delete</span></button>
                      </td>
                    </tr>
                  ))}
                  {systemUsers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-slate-400 font-medium">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Project Modal */}
      <AddProjectModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        initialData={currentEditProject}
        onProjectAdded={handleProjectAdded}
        onProjectUpdated={handleProjectUpdated}
        workers={workers}
      />
    </div>
  )
}

export default Settings
