import { apiClient } from './client';

export interface Chat {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  chatId: string;
  projectPlan?: ProjectPlan;
}

export interface CreateChatRequest {
  name?: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface ProjectPlan {
  workstreams: Workstream[];
}

export interface Workstream {
  title: string;
  description: string;
  deliverables: Deliverable[];
}

export interface Deliverable {
  title: string;
  description: string;
}

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
  projectPlan?: ProjectPlan;
}

export const chatApi = {
  // Get all chats for the user
  getChats: async (): Promise<{ chats: Chat[] }> => {
    const response = await apiClient.get('/chats');
    return response.data;
  },

  // Create a new chat
  createChat: async (data: CreateChatRequest): Promise<Chat> => {
    const response = await apiClient.post('/chats', data);
    return response.data;
  },

  // Get a specific chat
  getChat: async (chatId: string): Promise<Chat> => {
    const response = await apiClient.get(`/chats/${chatId}`);
    return response.data;
  },

  // Delete a chat
  deleteChat: async (chatId: string): Promise<void> => {
    await apiClient.delete(`/chats/${chatId}`);
  },

  // Get messages for a chat
  getMessages: async (chatId: string): Promise<{ messages: Message[] }> => {
    const response = await apiClient.get(`/chats/${chatId}/messages`);
    return response.data;
  },

  // Send a message and get AI response
  sendMessage: async (chatId: string, data: SendMessageRequest): Promise<SendMessageResponse> => {
    const response = await apiClient.post(`/chats/${chatId}/messages`, data);
    return response.data;
  },
};