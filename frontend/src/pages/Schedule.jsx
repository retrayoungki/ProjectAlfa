import React, { useState, useEffect } from 'react'
import DateInput from '../components/DateInput'

const Schedule = ({ projects }) => {
  // Define the project start date (e.g., April 1st, 2026)
  const projectStartDate = new Date(2026, 3, 1); // April 2026

  const [selectedProject, setSelectedProject] = useState(null)
  const [sections, setSections] = useState([])
  const [newSectionName, setNewSectionName] = useState('')
  

  const [tasks, setTasks] = useState([])
  const [holidays, setHolidays] = useState([])
  const [holidayInput, setHolidayInput] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)

  // Load data from localStorage when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      const savedTasks = localStorage.getItem(`alfa_tasks_${selectedProject.id}`);
      const savedSections = localStorage.getItem(`alfa_sections_${selectedProject.id}`);
      const savedHolidays = localStorage.getItem(`alfa_holidays_${selectedProject.id}`);
      
      setTasks(savedTasks ? JSON.parse(savedTasks) : []);
      setSections(savedSections ? JSON.parse(savedSections) : []);
      setHolidays(savedHolidays ? JSON.parse(savedHolidays) : []);
    } else {
      // Clear current states if no project selected
      setTasks([]);
      setSections([]);
      setHolidays([]);
    }
  }, [selectedProject]);

  // Save data to localStorage whenever tasks, sections, or holidays change
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem(`alfa_tasks_${selectedProject.id}`, JSON.stringify(tasks));
      localStorage.setItem(`alfa_sections_${selectedProject.id}`, JSON.stringify(sections));
      localStorage.setItem(`alfa_holidays_${selectedProject.id}`, JSON.stringify(holidays));
    }
  }, [tasks, sections, holidays, selectedProject]);

  const addHoliday = () => {
    if (holidayInput && !holidays.includes(holidayInput)) {
      setHolidays([...holidays, holidayInput])
      setHolidayInput('')
    }
  }

  const removeHoliday = (date) => {
    setHolidays(holidays.filter(h => h !== date))
  }

  const [newTask, setNewTask] = useState({
    code: '',
    name: '',
    location: '',
    startDate: '2026-04-01',
    duration: '',
    section: ''
  })

  const handleAddSection = () => {
    const trimmed = newSectionName.trim()
    if (trimmed && !sections.includes(trimmed)) {
      setSections([...sections, trimmed])
      setNewTask(prev => ({ ...prev, section: trimmed }))
      setNewSectionName('')
    }
  }

  const getDayOffset = (dateStr) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const start = new Date(projectStartDate);
    start.setHours(0, 0, 0, 0);
    
    const diffTime = date - start;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  const addTask = () => {
    if (!newTask.name) return;

    const startDay = getDayOffset(newTask.startDate);
    const duration = parseInt(newTask.duration) || 0;

    let updatedTasks = [...tasks];
    
    if (editingTaskId) {
      // Handle Update
      const index = updatedTasks.findIndex(t => t.id === editingTaskId);
      if (index !== -1) {
        const oldTask = updatedTasks[index];
        const updatedItem = {
          ...oldTask,
          ...newTask,
          duration: duration,
          startDay: startDay
        };
        
        // If section changed, we need to move it
        if (oldTask.section !== newTask.section) {
          // Remove from old position
          updatedTasks.splice(index, 1);
          
          // Use the same insertion logic as a new task
          if (newTask.section) {
            const sectionHeader = updatedTasks.find(t => t.type === 'header' && t.name === newTask.section);
            if (!sectionHeader) {
              // Create header if it doesn't exist
              const headerCount = updatedTasks.filter(t => t.type === 'header').length;
              const newHeader = {
                id: 'header-' + newTask.section,
                no: (headerCount + 1).toString(),
                code: '',
                name: newTask.section,
                location: '',
                duration: 0,
                startDay: 0,
                type: 'header'
              };
              updatedTasks.push(newHeader);
            }
            
            // Re-find header after potential creation
            const targetHeader = updatedTasks.find(t => t.type === 'header' && t.name === newTask.section);
            const targetHeaderIndex = updatedTasks.indexOf(targetHeader);
            const itemsInSection = updatedTasks.filter(t => t.type === 'item' && t.section === newTask.section).length;
            updatedTasks.splice(targetHeaderIndex + itemsInSection + 1, 0, updatedItem);
          } else {
            // Move to general items at top
            updatedTasks.unshift(updatedItem);
          }
        } else {
          // Section didn't change, just update in place
          updatedTasks[index] = updatedItem;
        }
      }
      setEditingTaskId(null);
    } else {
      // Handle New Add
      if (newTask.section) {
        const sectionIndex = updatedTasks.findIndex(t => t.type === 'header' && t.name === newTask.section);
        
        if (sectionIndex === -1) {
          const headerCount = updatedTasks.filter(t => t.type === 'header').length;
          updatedTasks.push({
            id: 'header-' + newTask.section,
            no: (headerCount + 1).toString(),
            code: '',
            name: newTask.section,
            location: '',
            duration: 0,
            startDay: 0,
            type: 'header'
          });
        }

        const currentSectionHeader = updatedTasks.find(t => t.type === 'header' && t.name === newTask.section);
        const sectionHeaderIndex = updatedTasks.indexOf(currentSectionHeader);
        const itemsInThisSection = updatedTasks.filter(t => t.type === 'item' && t.section === newTask.section).length;
        
        const item = {
          id: Date.now(),
          ...newTask,
          no: '', // Managed by render loop
          duration: duration,
          startDay: startDay,
          type: 'item'
        }

        updatedTasks.splice(sectionHeaderIndex + itemsInThisSection + 1, 0, item);
      } else {
        // Add as general item at the beginning of the list
        const item = {
          id: Date.now(),
          ...newTask,
          no: '', // Managed by render loop
          duration: duration,
          startDay: startDay,
          type: 'item'
        }
        updatedTasks.unshift(item);
      }
    }

    setTasks([...updatedTasks])
    setNewTask({ code: '', name: '', location: '', startDate: '2026-04-01', duration: '', section: '' })
  }

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setNewTask({
      code: task.code,
      name: task.name,
      location: task.location,
      startDate: task.startDate,
      duration: task.duration.toString(),
      section: task.section || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const cancelEdit = () => {
    setEditingTaskId(null);
    setNewTask({ code: '', name: '', location: '', startDate: '2026-04-01', duration: '', section: '' });
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const handlePrint = () => {
    // Calculate which cells each task occupies
    const getTaskDayMap = (task) => {
      if (task.type === 'header' || !task.startDate || !task.duration) return {};
      const dayMap = {};
      let calendarDays = 0;
      let workingDaysFound = 0;
      const targetDuration = parseInt(task.duration) || 0;
      if (targetDuration === 0) return {};
      while (workingDaysFound < targetDuration && calendarDays < 100) {
        calendarDays++;
        const currentDate = new Date(task.startDate);
        currentDate.setDate(currentDate.getDate() + (calendarDays - 1));
        const dateStr = currentDate.toISOString().split('T')[0];
        const isHoliday = holidays.includes(dateStr);
        const dayIndex = task.startDay - 1 + (calendarDays - 1);
        if (!isHoliday) {
          workingDaysFound++;
          dayMap[dayIndex] = workingDaysFound;
        } else {
          dayMap[dayIndex] = 'holiday';
        }
      }
      return dayMap;
    };

    let headerNum = 0;
    const sectionCounters = {};
    let bodyHTML = '';

    tasks.forEach((task) => {
      if (task.type === 'header') {
        headerNum++;
        sectionCounters[task.name] = 0;
        bodyHTML += `<tr><td colspan="64" style="background:#cbd5e1;font-weight:bold;text-align:left;padding:3px 6px;border:1px solid #64748b;font-size:7px;">${headerNum}. ${task.name}</td></tr>`;
      } else {
        const section = task.section || '';
        if (section) sectionCounters[section] = (sectionCounters[section] || 0) + 1;
        const itemNum = section && sectionCounters[section] ? `${headerNum}.${sectionCounters[section]}` : String(headerNum + 1);
        const dayMap = getTaskDayMap(task);
        let dayCells = '';
        for (let i = 0; i < 60; i++) {
          const d = dayMap[i];
          if (d === 'holiday') {
            dayCells += `<td style="background:#ef4444;color:white;text-align:center;font-size:6px;border:1px solid #94a3b8;">x</td>`;
          } else if (d) {
            dayCells += `<td style="background:#1e3a5f;color:white;text-align:center;font-size:6px;font-weight:bold;border:1px solid #1e3a5f;">${d}</td>`;
          } else {
            dayCells += `<td style="border:1px solid #94a3b8;"></td>`;
          }
        }
        bodyHTML += `<tr>
          <td style="text-align:center;border:1px solid #94a3b8;font-size:7px;">${itemNum}</td>
          <td style="text-align:center;border:1px solid #94a3b8;font-size:7px;">${task.code || ''}</td>
          <td style="text-align:left;padding:2px 4px;border:1px solid #94a3b8;font-size:7px;">${task.name}</td>
          <td style="text-align:center;border:1px solid #94a3b8;font-size:7px;">${task.location || ''}</td>
          ${dayCells}
          <td style="text-align:center;border:1px solid #94a3b8;font-size:7px;font-weight:bold;">${task.duration || 0}</td>
        </tr>`;
      }
    });

    const aprilDays = Array.from({length: 30}, (_, i) =>
      `<th style="width:12px;min-width:12px;max-width:12px;text-align:center;border:1px solid #94a3b8;font-size:6px;padding:1px;background:#f8fafc;">${i+1}</th>`
    ).join('');
    const mayDays = Array.from({length: 30}, (_, i) =>
      `<th style="width:12px;min-width:12px;max-width:12px;text-align:center;border:1px solid #94a3b8;font-size:6px;padding:1px;background:#f8fafc;">${i+1}</th>`
    ).join('');

    const printHTML = `<!DOCTYPE html>
<html><head>
<title>Master Schedule - ${selectedProject?.name || ''}</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .title { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
  .subtitle { font-size: 8px; color: #666; margin-bottom: 6px; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; font-size: 7px; }
  th { background: #e2e8f0; border: 1px solid #64748b; padding: 2px 1px; font-size: 6.5px; }
  td { border: 1px solid #94a3b8; padding: 1px 2px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .col-no { width: 20px; }
  .col-code { width: 38px; }
  .col-name { width: 130px; }
  .col-loc { width: 55px; }
  .col-days { width: 22px; }
  .month-hd { background: #dbeafe !important; font-size: 7px; font-weight: bold; }
</style>
</head><body>
<div class="title">MASTER SCHEDULE &mdash; ${selectedProject?.name || ''}</div>
<div class="subtitle">${selectedProject?.code || ''} &nbsp;|&nbsp; Printed: ${new Date().toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'})}</div>
<table>
  <thead>
    <tr>
      <th class="col-no" rowspan="2">NO.</th>
      <th class="col-code" rowspan="2">CODE</th>
      <th class="col-name" rowspan="2">WORK ITEM / DESCRIPTION</th>
      <th class="col-loc" rowspan="2">LOCATION</th>
      <th class="month-hd" colspan="30">APRIL 2026</th>
      <th class="month-hd" colspan="30">MEI 2026</th>
      <th class="col-days" rowspan="2">DAYS</th>
    </tr>
    <tr>${aprilDays}${mayDays}</tr>
  </thead>
  <tbody>${bodyHTML}</tbody>
</table>
</body></html>`;

    const pw = window.open('', '_blank');
    pw.document.write(printHTML);
    pw.document.close();
    pw.focus();
    setTimeout(() => { pw.print(); }, 600);
  };

  if (!selectedProject) {
    return (
      <div className="p-xl max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center mb-xl">
          <h2 className="text-4xl font-black text-primary mb-2 tracking-tight">Select Project Schedule</h2>
          <p className="text-slate-700 font-bold">Please select a project to manage its timeline and work items.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {projects.map(p => (
            <button 
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className="group relative bg-white border-2 border-slate-100 hover:border-primary p-lg rounded-xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className={`w-16 h-16 rounded-full bg-${p.color}-100 flex items-center justify-center text-${p.color}-600 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-3xl">calendar_month</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-slate-900 group-hover:text-primary">{p.name}</h4>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{p.code}</p>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-primary">arrow_forward</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="p-lg space-y-lg">
      {/* Header with Project Switcher */}
      <div className="flex justify-between items-center mb-gutter">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedProject(null)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-secondary-container transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-4xl font-black text-primary tracking-tight">{selectedProject.name}</h1>
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{selectedProject.code} • MASTER SCHEDULE</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded font-black text-xs uppercase tracking-widest text-slate-600 hover:text-primary transition-all shadow-sm">
            Export PDF
          </button>
        </div>
      </div>

      {/* NEW Input Form Section */}
      <div className="bg-white text-slate-900 p-lg rounded-xl shadow-xl space-y-lg border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-sm">post_add</span>
            </div>
            <h3 className="font-headline-sm text-slate-900">New Schedule Item</h3>
          </div>
          <div className="flex items-center gap-2">
            <input 
              className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs outline-none focus:border-primary placeholder:text-slate-400 text-slate-700 font-bold"
              placeholder="+ Define New Area"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
            />
            <button onClick={handleAddSection} className="p-1.5 bg-primary text-white rounded hover:brightness-110 shadow-sm transition-all">
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Area Kerja (Section)</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2 text-xs font-bold outline-none focus:border-primary appearance-none text-slate-900 cursor-pointer"
              value={newTask.section}
              onChange={(e) => setNewTask({...newTask, section: e.target.value})}
            >
              <option value="" className="text-slate-400">--- Choose Area ---</option>
              {sections.filter(s => s.trim() !== '').map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Item Code</label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2 text-xs font-bold outline-none focus:border-primary uppercase placeholder:text-slate-400 text-slate-900"
              placeholder="..."
              value={newTask.code}
              onChange={(e) => setNewTask({...newTask, code: e.target.value})}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Work Item // Description 产品 / 描述</label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2 text-xs font-bold outline-none focus:border-primary placeholder:text-slate-400 text-slate-900"
              placeholder="Enter work details..."
              value={newTask.name}
              onChange={(e) => setNewTask({...newTask, name: e.target.value})}
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Location</label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2 text-xs font-bold outline-none focus:border-primary placeholder:text-slate-400 text-slate-900"
              placeholder="..."
              value={newTask.location}
              onChange={(e) => setNewTask({...newTask, location: e.target.value})}
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Start Date</label>
            <DateInput 
              className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2 text-xs font-bold outline-none focus:border-primary text-slate-900"
              value={newTask.startDate}
              onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Duration (Days)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  className="w-20 bg-slate-50 border border-slate-200 rounded px-4 py-2 text-sm font-black outline-none focus:border-primary text-center text-slate-900"
                  placeholder="0"
                  value={newTask.duration}
                  onChange={(e) => setNewTask({...newTask, duration: e.target.value})}
                />
                <span className="text-[10px] font-bold text-slate-900">DAYS</span>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Holiday Date</label>
              <div className="flex items-center gap-2">
                <DateInput 
                  className="w-32 bg-slate-50 border border-slate-200 rounded px-4 py-2 text-xs font-bold outline-none focus:border-primary text-slate-900"
                  value={holidayInput}
                  onChange={(e) => setHolidayInput(e.target.value)}
                />
                <button 
                  onClick={addHoliday}
                  className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                  title="Add Holiday"
                >
                  <span className="material-symbols-outlined text-sm">event_busy</span>
                </button>
              </div>
            </div>

            {holidays.length > 0 && (
              <div className="flex flex-col">
                <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Project Holidays</label>
                <div className="flex flex-wrap gap-2 max-w-xs">
                  {holidays.map(h => (
                    <span key={h} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100">
                      {h.split('-').reverse().join('/')}
                      <button onClick={() => removeHoliday(h)} className="hover:text-red-800">
                        <span className="material-symbols-outlined text-[10px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {editingTaskId && (
              <button 
                onClick={cancelEdit}
                className="px-6 py-2 border border-slate-200 text-slate-500 rounded font-bold text-xs hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            )}
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 rounded font-black text-xs uppercase tracking-widest transition-all shadow-sm bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print Table
            </button>
            <button 
              onClick={addTask}
              className={`flex items-center gap-2 px-8 py-2.5 rounded font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-[0px] ${editingTaskId ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-primary text-white hover:brightness-110'}`}
            >
              <span className="material-symbols-outlined text-sm">{editingTaskId ? 'edit_note' : 'add'}</span>
              {editingTaskId ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </div>
      </div>
      {/* Gantt Chart Container - Redesigned for Readability */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-auto max-h-[800px] flex flex-col animate-in fade-in zoom-in duration-700" style={{borderColor: '#94a3b8'}}>
        
        {/* Modern Header Row - NOT STICKY */}
        <div className="flex bg-slate-100 font-bold text-[11px] text-slate-600 uppercase tracking-wider min-w-max" style={{borderBottom: '2px solid #64748b'}}>
          <div className="w-12 flex-shrink-0 flex items-center justify-center py-4 bg-slate-100" style={{borderRight: '2px solid #64748b'}}>NO.</div>
          <div className="w-20 flex-shrink-0 flex items-center justify-center py-4 px-2 text-center bg-slate-100" style={{borderRight: '2px solid #64748b'}}>CODE</div>
          <div className="w-72 flex-shrink-0 flex items-center px-6 py-4 bg-slate-100" style={{borderRight: '2px solid #64748b'}}>WORK ITEM // DESCRIPTION 产品 / 描述</div>
          <div className="w-32 flex-shrink-0 flex items-center px-4 py-4 bg-slate-100" style={{borderRight: '2px solid #64748b'}}>LOCATION</div>
          
          {/* Calendar Area */}
          <div className="flex-1">
            <div className="flex flex-col min-w-[1800px]">
              {/* Month Header */}
              <div className="flex bg-white" style={{borderBottom: '2px solid #64748b'}}>
                <div className="w-[900px] flex-shrink-0 flex items-center justify-center py-2 text-primary font-black text-sm" style={{borderRight: '2px solid #64748b'}}>
                  <span className="material-symbols-outlined text-sm mr-2 text-primary">calendar_today</span>
                  APRIL 2026
                </div>
                <div className="w-[900px] flex-shrink-0 flex items-center justify-center py-2 text-slate-500 font-bold text-sm" style={{borderRight: '2px solid #64748b'}}>
                  <span className="material-symbols-outlined text-sm mr-2">calendar_month</span>
                  MEI 2026
                </div>
              </div>
              {/* Day Header */}
              <div className="flex bg-slate-50">
                {Array.from({ length: 60 }).map((_, i) => {
                  const dayNum = i < 30 ? i + 1 : i - 29;
                  return (
                    <div key={i} className={`h-8 flex-1 min-w-[30px] flex items-center justify-center text-[9px] font-bold ${((i+1)%7===0 || (i+1)%7===6) ? 'bg-slate-200 text-slate-800' : 'text-slate-600'}`} style={{borderRight: '1px solid #64748b', borderBottom: '2px solid #64748b'}}>
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="w-16 flex-shrink-0 flex items-center justify-center py-4 bg-slate-100" style={{borderLeft: '2px solid #64748b'}}>DAYS</div>
        </div>

        {/* Scrollable Data Rows */}
        <div className="flex-1 custom-scrollbar">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-20">inventory_2</span>
              <p className="font-bold text-sm">No items added yet</p>
              <p className="text-xs">Use the form above to start building your schedule</p>
            </div>
          ) : (
            tasks.map((task, index) => {
                // Calculate dynamic numbering
                const headersBefore = tasks.slice(0, index + 1).filter(t => t.type === 'header');
                const currentHeaderNum = headersBefore.length;
                
                const itemsInSectionBefore = tasks.slice(0, index + 1).filter(t => t.type === 'item' && t.section === task.section);
                const currentItemNum = itemsInSectionBefore.length;

                let displayNo = '';
                if (task.type === 'header') {
                  displayNo = currentHeaderNum.toString();
                } else {
                  if (currentHeaderNum === 0) {
                    // Item without a section header before it
                    displayNo = currentItemNum.toString();
                  } else {
                    displayNo = `${currentHeaderNum}.${currentItemNum}`;
                  }
                }

              return (
                <div key={task.id} className={`flex hover:bg-blue-50/30 transition-all duration-200 group/row relative ${task.type === 'header' ? 'bg-slate-200' : ''}`} style={{borderBottom: '1px solid #94a3b8', minWidth: 'max-content'}}>
                  
                  {/* Fixed Data Columns - NOT STICKY */}
                  <div className={`w-12 flex-shrink-0 flex items-center justify-center py-3 text-[10px] font-bold ${task.type === 'header' ? 'bg-slate-200 text-primary' : 'bg-white text-slate-900 group-hover/row:bg-blue-50'}`} style={{borderRight: '1px solid #94a3b8'}}>
                    {displayNo}
                  </div>
                  <div className={`w-20 flex-shrink-0 flex items-center justify-center py-3 text-[10px] font-black uppercase ${task.type === 'header' ? 'bg-slate-200 opacity-0' : 'bg-white text-slate-900 group-hover/row:bg-blue-50'}`} style={{borderRight: '1px solid #94a3b8'}}>
                    {task.code}
                  </div>
                  <div className={`w-72 flex-shrink-0 flex items-center px-6 py-3 text-xs ${task.type === 'header' ? 'bg-slate-200 font-black text-primary uppercase tracking-wider' : 'bg-white font-bold text-slate-900 group-hover/row:bg-blue-50'}`} style={{borderRight: '1px solid #94a3b8'}}>
                    {task.type === 'header' && <span className="material-symbols-outlined text-sm mr-2">folder_open</span>}
                    {task.name}
                  </div>
                  <div className={`w-32 flex-shrink-0 flex items-center px-4 py-3 text-[10px] font-bold italic group/loc ${task.type === 'header' ? 'bg-slate-200' : 'bg-white text-slate-900 group-hover/row:bg-blue-50'}`} style={{borderRight: '1px solid #94a3b8'}}>
                    <span className="flex-1 truncate">{task.location}</span>
                    {task.type !== 'header' && (
                      <div className="flex items-center gap-1 opacity-0 group-hover/loc:opacity-100 group-hover/row:opacity-100 transition-all">
                        <button 
                          onClick={(e) => { e.stopPropagation(); startEdit(task); }}
                          className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Edit Item"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                          className="p-1 bg-red-100 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Delete Item"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gantt Area - must be wide enough to fill the calendar header */}
                  <div className="flex-1 relative" style={{
                    minWidth: '1800px',
                    alignSelf: 'stretch',
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 29px, #94a3b8 29px, #94a3b8 30px)',
                    backgroundSize: '30px 100%'
                  }}>

                    {/* Task Day Cells with Sequential Numbers - Grid Aligned */}
                    {task.type !== 'header' && (
                      <div className="absolute inset-0 grid grid-cols-[repeat(60,1fr)]">
                        <div 
                          className="h-6 mt-1 flex gap-0"
                          style={{ 
                            gridColumnStart: task.startDay, 
                            gridColumnEnd: (() => {
                              // Calculate how many days we need to cover to get 'duration' working days
                              let calendarDays = 0;
                              let workingDaysFound = 0;
                              const targetDuration = parseInt(task.duration) || 0;
                              
                              if (targetDuration === 0) return task.startDay;

                              while (workingDaysFound < targetDuration) {
                                calendarDays++;
                                const currentDate = new Date(task.startDate);
                                currentDate.setDate(currentDate.getDate() + (calendarDays - 1));
                                const dateStr = currentDate.toISOString().split('T')[0];
                                
                                if (!holidays.includes(dateStr)) {
                                  workingDaysFound++;
                                }
                                
                                // Safety break to prevent infinite loops
                                if (calendarDays > 100) break;
                              }
                              return task.startDay + calendarDays;
                            })()
                          }}
                        >
                          {(() => {
                            let workingDaysFound = 0;
                            const targetDuration = parseInt(task.duration) || 0;
                            let calendarDays = 0;
                            const segments = [];

                            if (targetDuration > 0) {
                              while (workingDaysFound < targetDuration) {
                                calendarDays++;
                                const currentDate = new Date(task.startDate);
                                currentDate.setDate(currentDate.getDate() + (calendarDays - 1));
                                const dateStr = currentDate.toISOString().split('T')[0];
                                const isHoliday = holidays.includes(dateStr);

                                if (!isHoliday) {
                                  workingDaysFound++;
                                  segments.push(
                                    <div 
                                      key={calendarDays}
                                      className="flex-1 h-full bg-primary border-r border-primary/30 first:rounded-l-md last:rounded-r-md flex items-center justify-center text-[9px] text-white font-black hover:brightness-125 transition-all"
                                    >
                                      {workingDaysFound}
                                    </div>
                                  );
                                } else {
                                  segments.push(
                                    <div 
                                      key={calendarDays}
                                      className="flex-1 h-full bg-red-500/80 border-r border-red-600/30 first:rounded-l-md last:rounded-r-md flex items-center justify-center text-[9px] text-white font-black"
                                      title="Holiday"
                                    >
                                      <span className="material-symbols-outlined text-[10px]">event_busy</span>
                                    </div>
                                  );
                                }

                                if (calendarDays > 100) break;
                              }
                            }
                            return segments;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Duration Column */}
                  <div className={`w-16 flex-shrink-0 flex items-center justify-center text-[11px] font-black ${task.type === 'header' ? 'bg-slate-200' : 'bg-white text-slate-900 group-hover/row:bg-blue-50'}`} style={{borderLeft: '1px solid #94a3b8', minWidth: '64px'}}>
                    {task.type !== 'header' ? String(task.duration ?? '0') : ''}
                  </div>


                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Footer with Summary */}
        <div className="bg-white border-t border-slate-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Active Schedule</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200"></div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Weekends</span>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Tracked</p>
              <p className="text-lg font-black text-primary leading-none">{tasks.filter(t => t.type === 'item').length}</p>
            </div>
            <div className="h-8 w-px bg-slate-100"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Overall Progress</span>
              <div className="flex items-center gap-4">
                <div className="w-48 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full" style={{ width: '82%' }}></div>
                </div>
                <span className="text-sm font-black text-primary">82%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Schedule
