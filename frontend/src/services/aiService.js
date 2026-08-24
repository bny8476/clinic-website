import { axiosPrivate, axiosPublic } from '../api/axios';

export const sendAiChatMessage = async ({ message, conversationId }) => {
  try {
    const response = await axiosPrivate.post('/ai/chat', { message, conversationId });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Fallback for unauthenticated users
      const publicResponse = await axiosPublic.post('/ai/chat', { message, conversationId });
      return publicResponse.data;
    }
    throw error;
  }
};

export const getAiConversations = async () => {
  try {
    const response = await axiosPrivate.get('/ai/conversations');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    return [];
  }
};

export const getAiConversationMessages = async (conversationId) => {
  if (!conversationId) return [];
  try {
    const response = await axiosPrivate.get(`/ai/conversations/${conversationId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    return [];
  }
};

export const deleteAiConversation = async (conversationId) => {
  if (!conversationId) return;
  const response = await axiosPrivate.delete(`/ai/conversations/${conversationId}`);
  return response.data;
};

export const clearAiConversationMessages = async (conversationId) => {
  if (!conversationId) return;
  const response = await axiosPrivate.delete(`/ai/conversations/${conversationId}/messages`);
  return response.data;
};
