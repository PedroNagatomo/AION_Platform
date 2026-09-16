import api from "../utils/api";
import type { Conversation, Message, MessageResponse } from "../types";

export async function getConversations(): Promise<Conversation[]> {
  const response = await api.get<Conversation[]>("/conversations");
  return response.data;
}

export async function createConversation(
  title?: string,
): Promise<Conversation> {
  const response = await api.post<Conversation>("/conversations", null, {
    params: title ? { title } : undefined,
  });
  return response.data;
}

export async function togglePin(conversationId: string): Promise<Conversation> {
  const response = await api.post<Conversation>(
    `/conversations/${conversationId}/pin`,
  );
  return response.data;
}

export async function getMessages(
  conversationId: string,
): Promise<MessageResponse[]> {
  const response = await api.get<MessageResponse[]>(
    `/conversations/${conversationId}/messages`,
  );
  return response.data;
}

export async function sendMessage(
  conversationId: string,
  content: string,
  files?: File[],
  agentId?: string,
): Promise<MessageResponse> {
  const formData = new FormData();
  formData.append("content", content || "");

  if (agentId) {
    formData.append("agentId", agentId);
  }

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const response = await api.post<MessageResponse>(
    `/conversations/${conversationId}/messages`,
    formData,
  );

  return response.data;
}

export async function updateMessage(
  conversationId: string,
  messageId: string,
  content: string,
): Promise<MessageResponse> {
  const response = await api.put<MessageResponse>(
    `/conversations/${conversationId}/messages/${messageId}`,
    { content },
  );
  return response.data;
}

export async function endConversation(conversationId: string): Promise<void> {
  await api.post(`/conversations/${conversationId}/end`);
}

// NOVAS FUNÇÕES
export async function updateConversationTitle(
  conversationId: string,
  title: string,
): Promise<Conversation> {
  const response = await api.put<Conversation>(
    `/conversations/${conversationId}/title`,
    { title },
  );
  return response.data;
}

export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  await api.delete(`/conversations/${conversationId}`);
}

export async function deleteAllConversations(): Promise<void> {
  await api.delete("/conversations");
}
