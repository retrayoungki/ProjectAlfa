import React, { useState } from 'react';
import { Clock, CheckCircle, FileText, Trash2, AlertCircle } from 'lucide-react';
import { 
  useTimesheetsQuery, 
  useCreateTimesheetMutation, 
  useUpdateTimesheetStatusMutation, 
  useConvertTimesheetToInvoiceMutation, 
  useDeleteTimesheetMutation 
} from '../../hooks/useTimesheet';
import { useProjectsQuery } from '../../hooks/useProjects';
import { useTeamQuery } from '../../hooks/useTeam';

export default function Timesheet() {
  const [tab, setTab] = useState('LOG'); // LOG, APPROVALS, BILLING

  const { data: timesheets = [], isLoading } = useTimesheetsQuery();
  const { data: projects = [] } = useProjectsQuery();
  const { data: users = [] } = useTeamQuery();

  const createTimesheet = useCreateTimesheetMutation();
  const updateStatus = useUpdateTimesheetStatusMutation();
  const convertInvoice = useConvertTimesheetToInvoiceMutation();
  const deleteTimesheet = useDeleteTimesheetMutation();

  const [form, setForm] = useState({ 
    userId: '',
    projectId: '', 
    taskId: '', 
    hours: '', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [hourlyRate, setHourlyRate] = useState(150);

  const pending = timesheets.filter(t => t.status === 'PENDING');
  const approved = timesheets.filter(t => t.status === 'APPROVED');
  const myLogs = timesheets.filter(t => form.userId ? t.userId === form.userId : false);

  // Derive tasks from selected project
  const selectedProject = projects.find(p => p.id === form.projectId);
  const projectTasks = selectedProject?.tasks || [];

  const handleLog = (e) => {
    e.preventDefault();
    if (!form.userId) return alert('Select an Employee');
    if (!form.projectId) return alert('Select a project');
    createTimesheet.mutate({
      userId: form.userId,
      projectId: form.projectId,
      taskId: form.taskId || null,
      hours: Number(form.hours),
      date: form.date
    }, {
      onSuccess: () => setForm({ ...form, hours: '' })
    });
  };

  const handleConvert = (projectId) => {
    const ids = approved.filter(t => t.projectId === projectId).map(t => t.id);
    if (!ids.length) return alert('No approved timesheets for this project.');
    if (!hourlyRate || hourlyRate <= 0) return alert('Please enter a valid hourly rate.');

    convertInvoice.mutate({ timesheetIds: ids, hourlyRate: Number(hourlyRate), projectId }, {
      onSuccess: () => alert('Successfully converted to an Invoice in the Project Finance tab!')
    });
  };

  const approvedByProject = projects.map(p => {
    const projectTimesheets = approved.filter(t => t.projectId === p.id);
    const totalHours = projectTimesheets.reduce((sum, t) => sum + t.hours, 0);
    return { project: p, totalHours, count: projectTimesheets.length };
  }).filter(p => p.totalHours > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Timesheet Management</h1>
          <p className="page-subtitle">Track hours, manage approvals, and execute billing workflows</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', marginBottom: 24, paddingBottom: 10 }}>
        <button className={`btn btn-sm ${tab === 'LOG' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('LOG')}>
          <Clock size={14} /> Log Hours
        </button>
        <button className={`btn btn-sm ${tab === 'APPROVALS' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('APPROVALS')}>
          <CheckCircle size={14} /> Pending Approvals ({pending.length})
        </button>
        <button className={`btn btn-sm ${tab === 'BILLING' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('BILLING')}>
          <FileText size={14} /> Invoice Billing
        </button>
      </div>

      {isLoading && <p className="text-muted text-center" style={{padding: 40}}>Loading timesheets...</p>}

      {!isLoading && tab === 'LOG' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          {/* LOG ENTRY FORM */}
          <div className="card card-pad" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>New Timesheet Entry</h3>
            <form onSubmit={handleLog} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Employee *</label>
                <select className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} required>
                  <option value="">-- Select Employee --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Project *</label>
                <select className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value, taskId: ''})} required>
                  <option value="">-- Select Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Task</label>
                <select className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={form.taskId} onChange={e => setForm({...form, taskId: e.target.value})} disabled={!projectTasks.length}>
                  <option value="">-- No Task / General --</option>
                  {projectTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Date *</label>
                  <input type="date" className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Hours *</label>
                  <input type="number" step="0.5" min="0.5" max="24" className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 10, justifyContent: 'center' }} disabled={createTimesheet.isPending}>
                Submit Timesheet
              </button>
            </form>
          </div>

          {/* MY LOGS */}
          <div className="card card-pad">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>My Recent Entries</h3>
            {myLogs.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13 }}>You haven't logged any hours yet.</p>
            ) : (
              <div className="table-wrap">
                <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>DATE</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>PROJECT / TASK</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>HOURS</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>STATUS</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLogs.slice(0, 15).map(log => (
                      <tr key={log.id}>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{new Date(log.date).toLocaleDateString()}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 600 }}>{log.project?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.task?.title || 'General'}</div>
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{log.hours}h</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                          <span className={`badge ${log.status === 'APPROVED' ? 'badge-green' : log.status === 'INVOICED' ? 'badge-blue' : log.status === 'REJECTED' ? 'badge-red' : 'badge-amber'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                          {log.status === 'PENDING' && (
                            <button onClick={() => deleteTimesheet.mutate(log.id)} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
                              <Trash2 size={13} color="var(--red)" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && tab === 'APPROVALS' && (
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Timesheets Pending Approval</h3>
          {pending.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} style={{ margin: '0 auto 10px', color: 'var(--green)' }} />
              <p>All caught up! No timesheets pending approval.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>USER</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>DATE</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>PROJECT / TASK</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>HOURS</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(log => {
                    const employee = users.find(u => u.id === log.userId);
                    return (
                      <tr key={log.id}>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{employee ? employee.name : log.userId}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{new Date(log.date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600 }}>{log.project?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.task?.title || 'General'}</div>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--blue)' }}>{log.hours}h</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                        <button onClick={() => updateStatus.mutate({ id: log.id, status: 'APPROVED' })} className="btn btn-sm" style={{ padding: '4px 8px', background: '#E0FCE8', color: '#10B981', border: '1px solid #10B981', marginRight: 8 }}>
                          Approve
                        </button>
                        <button onClick={() => updateStatus.mutate({ id: log.id, status: 'REJECTED' })} className="btn btn-sm" style={{ padding: '4px 8px', background: '#FFEBEB', color: '#EF4444', border: '1px solid #EF4444' }}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!isLoading && tab === 'BILLING' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <div className="card card-pad" style={{ background: '#F8FAFC', border: '1px dashed var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={20} color="var(--blue)" />
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Billing Configuration</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Set the default hourly rate used when converting approved timesheets into formal project invoices.</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Rate (Rp./hr):</span>
                <input type="number" className="form-input" style={{ width: 100, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)' }} value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Billable Approved Time (Ready for Invoicing)</h3>
            {approvedByProject.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13, textAlign: 'center', padding: 30 }}>No approved timesheets available for billing.</p>
            ) : (
              <div className="table-wrap">
                <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>PROJECT</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>APPROVED ENTRIES</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>TOTAL BILLABLE HOURS</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>INVOICE ESTIMATE</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedByProject.map(({ project, totalHours, count }) => (
                      <tr key={project.id}>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{project.name}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{count} timesheets</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>{totalHours}h</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--green)' }}>
                          Rp. {(totalHours * hourlyRate).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                          <button onClick={() => handleConvert(project.id)} className="btn btn-primary btn-sm" disabled={convertInvoice.isPending}>
                            <FileText size={13} style={{ marginRight: 6 }} /> Convert to Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
