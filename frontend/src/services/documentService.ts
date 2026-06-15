export interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  category: string;
  uploadedAt: string;
  projectId: string;
}

export async function uploadDocument(data: { projectId: string; category: string; file: File }): Promise<Document> {
  const formData = new FormData();
  formData.append('projectId', data.projectId);
  formData.append('category', data.category);
  formData.append('file', data.file);

  const response = await fetch('/api/documents', {
    method: 'POST',
    body: formData, // Do not set Content-Type header, let the browser set it with the boundary
  });
  
  if (!response.ok) throw new Error('Failed to upload document');
  return response.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`/api/documents/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) throw new Error('Failed to delete document');
}
