export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  projectId: string;
}

export interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id?: string;
  invoiceNumber?: string;
  clientId?: string;
  client?: any;
  projectId?: string;
  scopeOfWork?: string;
  date?: string | Date;
  dueDate?: string | Date;
  currency?: string;
  paymentTerms?: string;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  totalAmount: number;
  status?: string;
  attachmentUrl?: string;
  items?: InvoiceItem[];
}

function getHeaders() {
  const token = localStorage.getItem('proman_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// EXPENSES
export async function fetchExpenses(): Promise<Expense[]> {
  const response = await fetch('/api/finance/expenses', {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch expenses');
  return response.json();
}

export async function createExpense(data: Partial<Expense>): Promise<Expense> {
  const response = await fetch('/api/finance/expenses', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create expense');
  return response.json();
}

export async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`/api/finance/expenses/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete expense');
}

// INVOICES
export async function fetchInvoices(): Promise<Invoice[]> {
  const response = await fetch('/api/finance/invoices', {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch invoices');
  return response.json();
}

export async function createInvoice(data: Partial<Invoice>): Promise<Invoice> {
  const response = await fetch('/api/finance/invoices', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create invoice');
  return response.json();
}

export async function updateInvoice(data: Partial<Invoice> & { id: string }): Promise<Invoice> {
  const { id, ...rest } = data;
  const response = await fetch(`/api/finance/invoices/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(rest),
  });
  if (!response.ok) throw new Error('Failed to update invoice');
  return response.json();
}

export async function deleteInvoice(id: string): Promise<void> {
  const response = await fetch(`/api/finance/invoices/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete invoice');
}

// AGGREGATED FINANCE REPORT SERVICES
export async function fetchFinanceSummary(period?: string): Promise<any> {
  const url = period ? `/api/finance/summary?period=${period}` : '/api/finance/summary';
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch finance summary');
  return response.json();
}

export async function fetchFinanceTermins(params?: {
  status?: string;
  project_id?: string;
  client_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.project_id) query.append('project_id', params.project_id);
  if (params?.client_id) query.append('client_id', params.client_id);
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));

  const response = await fetch(`/api/finance/termins?${query.toString()}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch termins');
  return response.json();
}

export async function fetchFinanceOutstanding(): Promise<any[]> {
  const response = await fetch('/api/finance/outstanding', {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch outstanding termins');
  return response.json();
}

export async function fetchFinanceRetensi(): Promise<any[]> {
  const response = await fetch('/api/finance/retensi', {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch retensi list');
  return response.json();
}

export async function fetchFinanceCashflow(year?: number): Promise<any[]> {
  const url = year ? `/api/finance/cashflow?year=${year}` : '/api/finance/cashflow';
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch cashflow data');
  return response.json();
}

export async function fetchFinancePajak(): Promise<any> {
  const response = await fetch('/api/finance/pajak', {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch tax calculations');
  return response.json();
}

export async function updateFinanceTerminStatus(
  terminId: string,
  status: string,
  paidDate?: string
): Promise<any> {
  const response = await fetch(`/api/finance/termins/${terminId}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status, paid_date: paidDate }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update termin status');
  }
  return response.json();
}

