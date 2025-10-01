import { Chat, CreateChatRequest, SendMessageRequest, Message } from '../types/chat';

const API_BASE_URL = 'http://localhost:8000';

// Get current user from localStorage or default to 'richard'
const getCurrentUser = () => {
  return localStorage.getItem('currentUser') || 'richard';
};

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getCurrentUser(),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Chat API functions
export const chatApi = {
  // Get all chats
  getChats: async (): Promise<Chat[]> => {
    const response = await apiRequest<{ chats: any[] }>('/chats');
    return response.chats.map(chat => ({
      id: chat.id,
      name: chat.name,
      createdAt: new Date(chat.createdAt),
      messages: [] // Messages are loaded separately
    }));
  },

  // Get specific chat
  getChat: async (chatId: string): Promise<Chat> => {
    const response = await apiRequest<any>(`/chats/${chatId}`);
    return {
      id: response.id,
      name: response.name,
      createdAt: new Date(response.createdAt)
    };
  },

  // Create new chat
  createChat: async (data: CreateChatRequest = {}): Promise<Chat> => {
    const response = await apiRequest<any>('/chats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      id: response.id,
      name: response.name,
      createdAt: new Date(response.createdAt)
    };
  },

  // Get messages for a chat
  getMessages: async (chatId: string): Promise<Message[]> => {
    const response = await apiRequest<{ messages: any[] }>(`/chats/${chatId}/messages`);
    return response.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      projectPlan: msg.projectPlan
    }));
  },

  // Send message to chat
  sendMessage: (chatId: string, data: SendMessageRequest): Promise<Message[]> => {
    return apiRequest<Message[]>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Delete chat (if implemented)
  deleteChat: (chatId: string): Promise<void> => {
    return apiRequest<void>(`/chats/${chatId}`, {
      method: 'DELETE',
    });
  },
};

// Utility function to set current user
export const setCurrentUser = (userId: string) => {
  localStorage.setItem('currentUser', userId);
};

// Utility function to get current user
export const getCurrentUserName = () => {
  return getCurrentUser();
};