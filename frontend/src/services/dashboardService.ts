export interface DashboardSummary {
  totalProjects: number;
  activeProjects: number;
  overdueTasks: number;
  monthlyRevenue: number;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch('/api/dashboard/summary');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard summary');
  }
  return response.json();
}

export async function createProject(project: { name: string; status: string; revenue: number }): Promise<any> {
  const response = await fetch('/api/dashboard/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
  });
  if (!response.ok) {
    throw new Error('Failed to create project');
  }
  return response.json();
}
