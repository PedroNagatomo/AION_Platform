export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  name?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  pinned?: boolean;
}

export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
  tokenCount?: number;
}

export interface MessageResponse {
  tokenCount: any;
  id: string;
  role: string;
  content: string;
  createdAt: string;

}