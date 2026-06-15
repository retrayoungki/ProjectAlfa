export interface Timesheet {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  project_id: string | null;
  project_name: string;
  project_code: string | null;
  work_date: string;
  hours_regular: number;
  hours_overtime: number;
  hours_total: number;
  work_type: string;
  description: string;
  status: string;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
}

export interface WeeklySummaryMember {
  user_id: string;
  user_name: string;
  user_role: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
  week_total: number;
  week_regular: number;
  week_overtime: number;
  status_summary: 'approved' | 'pending' | 'partial' | 'missing' | 'rejected';
}

export interface TimesheetResponse {
  entries: Timesheet[];
  weekly_summary: {
    per_member: WeeklySummaryMember[];
    per_day_total: { mon: number; tue: number; wed: number; thu: number; fri: number; sat: number; sun: number };
    grand_total_hours: number;
    grand_overtime_hours: number;
    period_label: string;
  } | null;
  kpi: {
    total_hours_this_week: number;
    avg_hours_per_person: number;
    total_overtime: number;
    pending_count: number;
    missing_count: number;
  };
  hours_per_project: { project_id: string | null; project_name: string; total_hours: number }[];
}

function getHeaders() {
  const token = localStorage.getItem('proman_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function fetchTimesheets(params?: {
  week?: string;
  month?: string;
  user_id?: string;
  project_id?: string;
  status?: string;
}): Promise<TimesheetResponse> {
  const url = new URL('/api/timesheet', window.location.origin);
  if (params?.week) url.searchParams.append('week', params.week);
  if (params?.month) url.searchParams.append('month', params.month);
  if (params?.user_id) url.searchParams.append('user_id', params.user_id);
  if (params?.project_id) url.searchParams.append('project_id', params.project_id);
  if (params?.status) url.searchParams.append('status', params.status);

  const response = await fetch(url.toString(), { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch timesheets');
  return response.json();
}

export async function fetchTimesheetLog(
  date: string,
  params?: { user_id?: string; project_id?: string }
): Promise<Timesheet[]> {
  const url = new URL('/api/timesheet/log', window.location.origin);
  url.searchParams.append('date', date);
  if (params?.user_id) url.searchParams.append('user_id', params.user_id);
  if (params?.project_id) url.searchParams.append('project_id', params.project_id);

  const response = await fetch(url.toString(), { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch timesheet daily log');
  return response.json();
}

export async function createTimesheet(data: {
  project_id?: string | null;
  work_date: string;
  hours_regular: number;
  hours_overtime?: number;
  work_type: string;
  description: string;
}): Promise<Timesheet> {
  const response = await fetch('/api/timesheet', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create timesheet');
  }
  return response.json();
}

export async function updateTimesheet(
  id: string,
  data: {
    project_id?: string | null;
    work_date?: string;
    hours_regular?: number;
    hours_overtime?: number;
    work_type?: string;
    description?: string;
  }
): Promise<Timesheet> {
  const response = await fetch(`/api/timesheet/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update timesheet');
  }
  return response.json();
}

export async function deleteTimesheet(id: string): Promise<void> {
  const response = await fetch(`/api/timesheet/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete timesheet');
  }
}

export async function approveTimesheet(id: string): Promise<Timesheet> {
  const response = await fetch(`/api/timesheet/${id}/approve`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error('Failed to approve timesheet');
  return response.json();
}

export async function rejectTimesheet(id: string, rejectionReason: string): Promise<Timesheet> {
  const response = await fetch(`/api/timesheet/${id}/reject`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reject timesheet');
  }
  return response.json();
}

export async function approveBulkTimesheets(ids: string[]): Promise<{ approved_count: number; failed_ids: string[] }> {
  const response = await fetch('/api/timesheet/approve-bulk', {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error('Failed bulk approvals');
  return response.json();
}

export async function fetchPendingTimesheets(): Promise<Timesheet[]> {
  const response = await fetch('/api/timesheet/pending', {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch pending timesheets');
  return response.json();
}

export async function fetchTimesheetExport(params: {
  start_date: string;
  end_date: string;
  user_id?: string;
  project_id?: string;
}): Promise<any[]> {
  const url = new URL('/api/timesheet/export', window.location.origin);
  url.searchParams.append('start_date', params.start_date);
  url.searchParams.append('end_date', params.end_date);
  if (params.user_id) url.searchParams.append('user_id', params.user_id);
  if (params.project_id) url.searchParams.append('project_id', params.project_id);

  const response = await fetch(url.toString(), { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to export timesheets');
  return response.json();
}
