export interface GlobalTask {
  id: string;
  title: string;
  description?: string;
  project_id: string;
  project_name: string;
  project_code: string;
  division?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  assigned_to?: string;
  assigned_name?: string;
  due_date?: string;
  completed_date?: string;
  is_overdue: boolean;
  created_at: string;
}

export interface TasksSummary {
  total: number;
  todo: number;
  in_progress: number;
  review: number;
  done: number;
  overdue: number;
}

export interface TasksResponse {
  tasks: GlobalTask[];
  summary: TasksSummary;
}

export interface FilterOptions {
  projects: Array<{ id: string; project_name: string; project_code: string }>;
  users: Array<{ id: string; name: string }>;
  divisions: string[];
}

function getHeaders() {
  const token = localStorage.getItem('proman_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function fetchGlobalTasks(params?: {
  project_id?: string;
  status?: string;
  priority?: string;
  division?: string;
  assigned_to?: string;
  overdue?: boolean | string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<TasksResponse> {
  const query = new URLSearchParams();
  if (params) {
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.division) query.append('division', params.division);
    if (params.assigned_to) query.append('assigned_to', params.assigned_to);
    if (params.overdue !== undefined) query.append('overdue', String(params.overdue));
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
  }

  const response = await fetch(`/api/tasks?${query.toString()}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch global tasks');
  }
  return response.json();
}

export async function fetchMyTasks(params?: {
  project_id?: string;
  status?: string;
  priority?: string;
  division?: string;
  overdue?: boolean | string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<TasksResponse> {
  const query = new URLSearchParams();
  if (params) {
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.division) query.append('division', params.division);
    if (params.overdue !== undefined) query.append('overdue', String(params.overdue));
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
  }

  const response = await fetch(`/api/tasks/my-tasks?${query.toString()}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch my tasks');
  }
  return response.json();
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const response = await fetch('/api/tasks/filter-options', {
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch filter options');
  }
  return response.json();
}

export async function createGlobalTask(data: {
  project_id: string;
  title: string;
  description?: string;
  division: string;
  priority: string;
  assigned_to?: string;
  due_date?: string;
  status?: string;
}): Promise<any> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create task');
  }
  return response.json();
}

export async function updateGlobalTask(id: string, data: {
  project_id?: string;
  title?: string;
  description?: string;
  division?: string;
  priority?: string;
  assigned_to?: string;
  due_date?: string;
  status?: string;
}): Promise<any> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update task');
  }
  return response.json();
}

export async function updateGlobalTaskStatus(id: string, status: string): Promise<any> {
  const response = await fetch(`/api/tasks/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update task status');
  }
  return response.json();
}

export async function deleteGlobalTask(id: string): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete task');
  }
}
