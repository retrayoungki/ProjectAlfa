export interface Client {
  id: string;
  company_name: string;
  short_name?: string;
  client_type?: string;
  pic_name?: string;
  pic_position?: string;
  pic_phone?: string;
  pic_email?: string;
  pic_2_name?: string;
  pic_2_phone?: string;
  pic_2_email?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  npwp?: string;
  bank_name?: string;
  bank_account?: string;
  bank_account_name?: string;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;

  // Backwards compatibility legacy fields
  name?: string;
  company?: string;

  // Computed properties returned by API
  total_projects?: number;
  active_projects?: number;
  completed_projects?: number;
  total_contract_value?: number;
  total_paid?: number;
  outstanding?: number;
}

export interface ClientSummary {
  total_clients: number;
  active_clients: number;
  total_contract_value: number;
  total_completed_projects: number;
}

export interface ClientsResponse {
  clients: Client[];
  summary: ClientSummary;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ClientDetailResponse extends Client {
  projects: {
    id: string;
    project_code: string;
    project_name: string;
    status: string;
    contract_value: number;
    contract_end_date: string;
  }[];
  finance_summary: {
    total_contract_value: number;
    total_paid: number;
    outstanding: number;
    termin_pending: number;
  };
}

export interface ClientOption {
  id: string;
  company_name: string;
  short_name?: string;
  // Compatibility fields
  company: string;
  name: string;
}

// Fetch clients with query parameters
export async function fetchClients(params?: {
  search?: string;
  client_type?: string;
  is_active?: string;
  page?: number;
  limit?: number;
}): Promise<ClientsResponse> {
  const query = new URLSearchParams();
  if (params) {
    if (params.search) query.append('search', params.search);
    if (params.client_type) query.append('client_type', params.client_type);
    if (params.is_active) query.append('is_active', params.is_active);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
  }
  const response = await fetch(`/api/clients?${query.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json();
}

// Fetch single client details
export async function fetchClientDetail(id: string): Promise<ClientDetailResponse> {
  const response = await fetch(`/api/clients/${id}`);
  if (!response.ok) throw new Error('Failed to fetch client detail');
  return response.json();
}

// Fetch client options for dropdowns (active only)
export async function fetchClientOptions(): Promise<ClientOption[]> {
  const response = await fetch('/api/clients/options');
  if (!response.ok) throw new Error('Failed to fetch client options');
  return response.json();
}

// Fetch client projects
export async function fetchClientProjects(id: string): Promise<any[]> {
  const response = await fetch(`/api/clients/${id}/projects`);
  if (!response.ok) throw new Error('Failed to fetch client projects');
  return response.json();
}

// Create client
export async function createClient(data: Partial<Client>): Promise<Client> {
  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create client');
  }
  return response.json();
}

// Update client
export async function updateClient(data: Partial<Client> & { id: string }): Promise<Client> {
  const { id, ...rest } = data;
  const response = await fetch(`/api/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rest),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update client');
  }
  return response.json();
}

// Delete / Deactivate client (soft delete)
export async function deleteClient(id: string): Promise<void> {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to delete client');
  }
}
