import axios from 'axios';

const API_URL = 'http://localhost:5000/api/materials';

export const materialService = {
  getMaterials: async (projectId?: string) => {
    const url = projectId ? `${API_URL}?projectId=${projectId}` : API_URL;
    const response = await axios.get(url);
    return response.data;
  },

  getMaterialById: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  createMaterial: async (data: any) => {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  updateMaterial: async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  deleteMaterial: async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },

  getMaterialHistory: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}/history`);
    return response.data;
  }
};
