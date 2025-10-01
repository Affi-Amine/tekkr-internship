export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chatId: string;
  projectPlan?: ProjectPlan;
}

export interface Chat {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreateChatRequest {
  name?: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface ChatResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface MessageResponse {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  chatId: string;
  projectPlan?: ProjectPlan;
}

export interface ProjectPlan {
  workstreams: WorkStream[];
}

export interface WorkStream {
  title: string;
  description: string;
  deliverables: Deliverable[];
}

export interface Deliverable {
  title: string;
  description: string;
}

export interface LLMProvider {
  name: 'anthropic' | 'openai' | 'gemini';
  apiKey: string;
  model: string;
}