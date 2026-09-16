import { useState } from 'react';
import type { Message } from '../../types';
import { formatTimestamp } from '../../utils/format';
import { MarkdownContent } from './MarkdownContent';

interface MessageBubbleProps {
  message: Message;
  onEdit?: (messageId: string, newContent: string) => void;
}

export function MessageBubble({ message, onEdit }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isUser = message.role === 'USER';
  
  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };
  
  return (
    <div className={`flex flex-col mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'order-1' : ''}`}>
        <div className={`px-4 py-3 border ${
          isUser 
            ? 'bg-terminal-surface border-terminal-accent' 
            : 'bg-terminal-bg border-terminal-border'
        }`}>
          <div className="font-mono text-xs mb-2 flex items-center gap-2">
            {isUser ? (
              <span className="text-terminal-accent">❯ user@local</span>
            ) : (
              <span className="text-terminal-accent">❯ ai@assistant</span>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-terminal-bg border border-terminal-accent text-terminal-text font-mono text-sm p-2 focus:outline-none"
                rows={4}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-terminal-accent text-terminal-bg font-mono text-xs"
                >
                  [salvar]
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="px-3 py-1 border border-terminal-border text-terminal-dim font-mono text-xs"
                >
                  [cancelar]
                </button>
              </div>
            </div>
          ) : isUser ? (
            <div className="font-mono text-sm text-terminal-text whitespace-pre-wrap">
              {message.content}
            </div>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>
        
        <div className="font-mono text-[10px] text-terminal-dim mt-1 flex items-center gap-2">
          <span>{formatTimestamp(message.createdAt)}</span>
          {isUser && onEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-terminal-dim hover:text-terminal-accent"
              title="Editar mensagem"
            >
              [editar]
            </button>
          )}
          {message.tokenCount && (
            <span className="text-terminal-accent">
              [{message.tokenCount} tokens]
            </span>
          )}
        </div>
      </div>
    </div>
  );
}