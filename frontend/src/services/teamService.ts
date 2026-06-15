export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  createdAt: string;
}

const API_URL = '/api/team';

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch team members');
  return res.json();
}

export async function createUser(data: Partial<User>): Promise<User> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create user');
  }
  return res.json();
}

export async function updateUser({ id, ...data }: { id: string } & Partial<User>): Promise<User> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete user');
}
