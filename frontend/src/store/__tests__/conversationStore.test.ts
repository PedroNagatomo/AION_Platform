import { describe, it, expect, beforeEach } from 'vitest';
import { useConversationStore } from '../conversationStore';
import type { Conversation, Message } from '../../types';

describe('conversationStore', () => {
  beforeEach(() => {
    useConversationStore.setState({
      conversations: [],
      currentConversation: null,
      messages: [],
      isLoading: false,
    });
  });

  it('starts with empty state', () => {
    const state = useConversationStore.getState();
    expect(state.conversations).toEqual([]);
    expect(state.messages).toEqual([]);
    expect(state.currentConversation).toBeNull();
  });

  it('addMessage adds message to list', () => {
    const message: Message = {
      id: '1',
      role: 'USER',
      content: 'Hello',
      createdAt: new Date().toISOString(),
    };

    useConversationStore.getState().addMessage(message);
    
    const state = useConversationStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].content).toBe('Hello');
  });

  it('setMessages replaces all messages', () => {
    const messages: Message[] = [
      { id: '1', role: 'USER', content: 'Hi', createdAt: new Date().toISOString() },
      { id: '2', role: 'ASSISTANT', content: 'Hello', createdAt: new Date().toISOString() },
    ];

    useConversationStore.getState().setMessages(messages);
    
    const state = useConversationStore.getState();
    expect(state.messages).toHaveLength(2);
  });

  it('setLoading toggles loading state', () => {
    useConversationStore.getState().setLoading(true);
    expect(useConversationStore.getState().isLoading).toBe(true);
    
    useConversationStore.getState().setLoading(false);
    expect(useConversationStore.getState().isLoading).toBe(false);
  });
});