export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  projectId: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'PAID' | 'SENT' | 'OVERDUE';
  dueDate: string;
  projectId: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  fileSize: string;
  uploadedAt: string;
  projectId: string;
}

export interface Project {
  id?: string;
  projectCode?: string;
  projectName: string;
  name?: string; // fallback for backward compatibility
  clientId: string | null;
  clientName?: string | null;
  status: string; // preparation | execution | testing | handover | maintenance | completed | on_hold
  contractValue?: number;
  budget?: number;
  budgetUsed?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  actualStartDate?: string | null;
  location?: string | null;
  projectType?: string | null;
  assignedPm?: string | null;
  totalTasks?: number;
  completedTasks?: number;
  createdAt?: string;
  updatedAt?: string;
  tasks?: any[];
  expenses?: Expense[];
  invoices?: Invoice[];
  documents?: Document[];
}

export interface ProjectsResponse {
  data: Project[];
  total: number;
  page: number;
  totalPages: number;
}

function getHeaders() {
  const token = localStorage.getItem('proman_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function fetchProjects(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProjectsResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));

  const response = await fetch(`/api/projects?${query.toString()}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch projects');
  }
  return response.json();
}

export async function fetchProjectById(id: string): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch project details');
  }
  return response.json();
}

export async function createProject(project: Omit<Project, 'id' | 'projectCode'>): Promise<Project> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(project),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create project');
  }
  return response.json();
}

export async function updateProject({ id, ...project }: Project): Promise<Project> {
  if (!id) throw new Error('Project ID is required for updates');
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(project),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update project');
  }
  return response.json();
}

export async function deleteProject(id: string): Promise<{ message: string }> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete project');
  }
  return response.json();
}

export async function fetchProjectDetail(id: string): Promise<any> {
  const response = await fetch(`/api/projects/${id}/detail`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch project details');
  }
  return response.json();
}

export async function fetchProjectMembers(id: string): Promise<any[]> {
  const response = await fetch(`/api/projects/${id}/members`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch project members');
  }
  return response.json();
}

export async function addProjectMember(id: string, data: { user_id: string; role_in_project: string }): Promise<any> {
  const response = await fetch(`/api/projects/${id}/members`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add project member');
  }
  return response.json();
}

export async function deleteProjectMember(id: string, userId: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}/members/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to remove project member');
  }
}

export async function fetchProjectMilestones(id: string): Promise<any[]> {
  const response = await fetch(`/api/projects/${id}/milestones`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch project milestones');
  }
  return response.json();
}

export async function addProjectMilestone(id: string, data: { milestone_name: string; target_date?: string; sort_order?: number }): Promise<any> {
  const response = await fetch(`/api/projects/${id}/milestones`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add project milestone');
  }
  return response.json();
}

export async function updateProjectMilestone(id: string, milestoneId: string, status: string): Promise<any> {
  const response = await fetch(`/api/projects/${id}/milestones/${milestoneId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update project milestone');
  }
  return response.json();
}

export async function fetchProjectFinance(id: string): Promise<any> {
  const response = await fetch(`/api/projects/${id}/finance`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch project finance summary');
  }
  return response.json();
}

export async function createProjectTermin(id: string, data: any): Promise<any> {
  const response = await fetch(`/api/projects/${id}/termins`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create project termin');
  }
  return response.json();
}

export async function updateProjectTermin(id: string, terminId: string, data: any): Promise<any> {
  const response = await fetch(`/api/projects/${id}/termins/${terminId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update project termin');
  }
  return response.json();
}

export async function deleteProjectTermin(id: string, terminId: string): Promise<any> {
  const response = await fetch(`/api/projects/${id}/termins/${terminId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete project termin');
  }
  return response.json();
}

export async function recordRetensiCair(id: string, data: { amount: number; date: string }): Promise<any> {
  const response = await fetch(`/api/projects/${id}/retensi-cair`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to record retensi cair');
  }
  return response.json();
}

export async function fetchProjectProgress(id: string): Promise<any> {
  const response = await fetch(`/api/projects/${id}/progress`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch project progress summary');
  }
  return response.json();
}

export async function fetchWeeklyReportDetail(id: string, weekId: string): Promise<any> {
  const response = await fetch(`/api/projects/${id}/weekly-progress/${weekId}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch weekly progress details');
  }
  return response.json();
}

export async function createWeeklyReport(id: string, data: any): Promise<any> {
  const response = await fetch(`/api/projects/${id}/weekly-progress`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create weekly report');
  }
  return response.json();
}

export async function updateWeeklyReport(id: string, weekId: string, data: any): Promise<any> {
  const response = await fetch(`/api/projects/${id}/weekly-progress/${weekId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update weekly report');
  }
  return response.json();
}

export async function deleteWeeklyReport(id: string, weekId: string): Promise<any> {
  const response = await fetch(`/api/projects/${id}/weekly-progress/${weekId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete weekly report');
  }
  return response.json();
}

export async function fetchProjectDivisions(id: string): Promise<any[]> {
  const response = await fetch(`/api/projects/${id}/divisions`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch project divisions');
  }
  return response.json();
}

export async function createProjectDivision(id: string, data: any): Promise<any> {
  const response = await fetch(`/api/projects/${id}/divisions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create project division');
  }
  return response.json();
}

export async function updateProjectDivision(id: string, divisionId: string, data: any): Promise<any> {
  const response = await fetch(`/api/projects/${id}/divisions/${divisionId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update project division');
  }
  return response.json();
}

// === Project Tasks Services ===
export async function fetchProjectTasks(projectId: string, params?: { status?: string; division?: string; search?: string }): Promise<any> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.division) query.append('division', params.division);
  if (params?.search) query.append('search', params.search);

  const response = await fetch(`/api/projects/${projectId}/tasks?${query.toString()}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch project tasks');
  }
  return response.json();
}

export async function createProjectTask(projectId: string, data: any): Promise<any> {
  const response = await fetch(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create project task');
  }
  return response.json();
}

export async function updateProjectTask(projectId: string, taskId: string, data: any): Promise<any> {
  const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update project task');
  }
  return response.json();
}

export async function deleteProjectTask(projectId: string, taskId: string): Promise<any> {
  const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete project task');
  }
  return response.json();
}

export async function updateProjectTaskStatus(projectId: string, taskId: string, status: string): Promise<any> {
  const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/status`, {
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

// === Project Folders & Documents Services ===
export async function fetchProjectDocuments(projectId: string, params?: { folder_id?: string; file_type?: string; search?: string }): Promise<any> {
  const query = new URLSearchParams();
  if (params?.folder_id) query.append('folder_id', params.folder_id);
  if (params?.file_type) query.append('file_type', params.file_type);
  if (params?.search) query.append('search', params.search);

  const response = await fetch(`/api/projects/${projectId}/documents?${query.toString()}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch project documents');
  }
  return response.json();
}

export async function uploadProjectDocument(projectId: string, formData: FormData): Promise<any> {
  const token = localStorage.getItem('proman_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/projects/${projectId}/documents/upload`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload document');
  }
  return response.json();
}

export async function deleteProjectDocument(projectId: string, docId: string): Promise<any> {
  const response = await fetch(`/api/projects/${projectId}/documents/${docId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete document');
  }
  return response.json();
}

export async function fetchProjectFolders(projectId: string): Promise<any[]> {
  const response = await fetch(`/api/projects/${projectId}/folders`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch folders');
  }
  return response.json();
}

export async function createProjectFolder(projectId: string, data: { folder_name: string; folder_color: string }): Promise<any> {
  const response = await fetch(`/api/projects/${projectId}/folders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create folder');
  }
  return response.json();
}

export async function deleteProjectFolder(projectId: string, folderId: string): Promise<any> {
  const response = await fetch(`/api/projects/${projectId}/folders/${folderId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete folder');
  }
  return response.json();
}
