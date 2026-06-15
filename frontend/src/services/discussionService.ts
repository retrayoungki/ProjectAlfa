import axios from 'axios';

const API_URL = 'http://localhost:5000/api/discussions';

export const discussionService = {
  getChannels: async (projectId: string) => {
    const response = await axios.get(`${API_URL}/channels?projectId=${projectId}`);
    return response.data;
  },
  createChannel: async (data: any) => {
    const response = await axios.post(`${API_URL}/channels`, data);
    return response.data;
  },
  getMessages: async (channelId: string) => {
    const response = await axios.get(`${API_URL}/channels/${channelId}/messages`);
    return response.data;
  },
  createMessage: async (channelId: string, data: any) => {
    const response = await axios.post(`${API_URL}/channels/${channelId}/messages`, data);
    return response.data;
  },
  getPinnedMessages: async (projectId: string) => {
    const response = await axios.get(`${API_URL}/pinned?projectId=${projectId}`);
    return response.data;
  },
  togglePin: async (messageId: string, isPinned: boolean) => {
    const response = await axios.put(`${API_URL}/messages/${messageId}/pin`, { isPinned });
    return response.data;
  }
};
