import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import type { Message } from '../../../types';

describe('MessageBubble', () => {
  const userMessage: Message = {
    id: '1',
    role: 'USER',
    content: 'Hello, how are you?',
    createdAt: new Date().toISOString(),
  };

  const aiMessage: Message = {
    id: '2',
    role: 'ASSISTANT',
    content: 'I am doing well, thank you!',
    createdAt: new Date().toISOString(),
    tokenCount: 150,
  };

  it('renders user message correctly', () => {
    render(<MessageBubble message={userMessage} />);
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('❯ user@local')).toBeInTheDocument();
  });

  it('renders AI message correctly', () => {
    render(<MessageBubble message={aiMessage} />);
    
    expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument();
    expect(screen.getByText('❯ ai@assistant')).toBeInTheDocument();
  });

  it('shows token count for AI messages', () => {
    render(<MessageBubble message={aiMessage} />);
    
    expect(screen.getByText('[150 tokens]')).toBeInTheDocument();
  });

  it('shows edit button for user messages when onEdit provided', () => {
    const onEdit = vi.fn();
    render(<MessageBubble message={userMessage} onEdit={onEdit} />);
    
    expect(screen.getByText('[editar]')).toBeInTheDocument(); // ← MUDOU
  });

  it('does not show edit button for AI messages', () => {
    const onEdit = vi.fn();
    render(<MessageBubble message={aiMessage} onEdit={onEdit} />);
    
    expect(screen.queryByText('[editar]')).not.toBeInTheDocument();
  });

  it('enters edit mode when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<MessageBubble message={userMessage} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('[editar]')); // ← MUDOU
    
    expect(screen.getByDisplayValue('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('[salvar]')).toBeInTheDocument();
    expect(screen.getByText('[cancelar]')).toBeInTheDocument();
  });

  it('calls onEdit with new content when save clicked', () => {
    const onEdit = vi.fn();
    render(<MessageBubble message={userMessage} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('[editar]')); // ← MUDOU
    
    const textarea = screen.getByDisplayValue('Hello, how are you?');
    fireEvent.change(textarea, { target: { value: 'Edited message' } });
    fireEvent.click(screen.getByText('[salvar]'));
    
    expect(onEdit).toHaveBeenCalledWith('1', 'Edited message');
  });

  it('cancels edit when cancel button clicked', () => {
    const onEdit = vi.fn();
    render(<MessageBubble message={userMessage} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('[editar]')); // ← MUDOU
    fireEvent.click(screen.getByText('[cancelar]'));
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.queryByText('[salvar]')).not.toBeInTheDocument();
  });
});