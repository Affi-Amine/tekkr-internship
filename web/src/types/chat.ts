export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  projectPlan?: ProjectPlan;
}

export interface Chat {
  id: string;
  name: string;
  createdAt: Date;
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