import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useConversationStore } from "../../store/conversationStore";
import { useAgentStore } from "../../store/agentStore";
import { MessageBubble } from "./MessageBubble";
import { LoadingDots } from "../ui/LoadingDots";
import { ChatInput } from "./ChatInput";
import { sendMessage, updateMessage } from "../../api/conversation";
import {
  exportConversationMarkdown,
  exportConversationTxt,
} from "../../api/export";
import { useDownload } from "../../hooks/useDownload";
import { AgentSelector } from "./AgentSelector";

export function ChatArea() {
  const { conversationId } = useParams();
  const {
    messages,
    setMessages,
    addMessage,
    isLoading,
    setLoading,
    currentConversation,
  } = useConversationStore();
  const { selectedAgent } = useAgentStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { downloadBlob } = useDownload();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const isAtBottomRef = useRef(true);

  const TOKEN_LIMIT = 131072;
  const [tokenUsage, setTokenUsage] = useState(0);
  const [warningLevel, setWarningLevel] = useState<
    "none" | "warning" | "critical" | "danger"
  >("none");

  useEffect(() => {
    const totalChars = messages.reduce(
      (acc, msg) => acc + (msg.content?.length || 0),
      0,
    );
    const estimatedTokens = Math.ceil(totalChars / 4);
    setTokenUsage(estimatedTokens);

    const usageRatio = estimatedTokens / TOKEN_LIMIT;
    if (usageRatio >= 0.95) {
      setWarningLevel("danger");
    } else if (usageRatio >= 0.85) {
      setWarningLevel("critical");
    } else if (usageRatio >= 0.7) {
      setWarningLevel("warning");
    } else {
      setWarningLevel("none");
    }
  }, [messages]);

  const usagePercentage = ((tokenUsage / TOKEN_LIMIT) * 100).toFixed(1);

  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;

      isAtBottomRef.current = isNearBottom;
      setShowScrollButton(!isNearBottom);
    }
  };

  useEffect(() => {
    isAtBottomRef.current = true;
    setShowScrollButton(false);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 100);
  }, [conversationId]);

  const scrollToBottom = () => {
    isAtBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!conversationId) {
      console.error("No conversation selected");
      return;
    }

    const fileNames = files?.map((f) => `📎 ${f.name}`).join("\n") || "";

    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      role: "USER" as const,
      content: fileNames ? `${content}\n\n${fileNames}` : content,
      createdAt: new Date().toISOString(),
    };

    addMessage(tempUserMessage);
    setLoading(true);
    isAtBottomRef.current = true;

    try {
      const response = await sendMessage(
        conversationId,
        content,
        files,
        selectedAgent?.id,
      );

      const assistantMessage = {
        id: response.id,
        role: "ASSISTANT" as const,
        content: response.content,
        createdAt: response.createdAt,
      };

      addMessage(assistantMessage);
    } catch (error: any) {
      console.error("Error sending message:", error);

      let errorContent =
        "❌ Error communicating with AI. Check if backend is running.";

      if (error?.response?.status === 413) {
        errorContent = "❌ File too large. Maximum limit is 50MB.";
      } else if (error?.response?.status === 400) {
        errorContent = "❌ Send error. Check file format.";
      } else if (error?.message?.includes("Network Error")) {
        errorContent = "❌ Connection error. Check if backend is running.";
      }

      const errorMessage = {
        id: `error-${Date.now()}`,
        role: "ASSISTANT" as const,
        content: errorContent,
        createdAt: new Date().toISOString(),
      };

      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const response = await updateMessage(
        conversationId,
        messageId,
        newContent,
      );

      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex !== -1) {
        const updatedMessages = messages.slice(0, messageIndex + 1);
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          content: newContent,
        };

        updatedMessages.push({
          id: response.id,
          role: "ASSISTANT" as const,
          content: response.content,
          createdAt: response.createdAt,
        });

        setMessages(updatedMessages);
      }
    } catch (error) {
      console.error("Error editing message:", error);
    } finally {
      setLoading(false);
    }
  };

  const warningStyles = {
    none: null,
    warning: {
      border: "border-yellow-500",
      text: "text-yellow-500",
      bg: "bg-yellow-500",
      icon: "⚠",
      label: "Large context",
    },
    critical: {
      border: "border-orange-500",
      text: "text-orange-500",
      bg: "bg-orange-500",
      icon: "⚡",
      label: "Critical context",
    },
    danger: {
      border: "border-red-500",
      text: "text-red-500",
      bg: "bg-red-500",
      icon: "🔴",
      label: "Limit near",
    },
  }[warningLevel];

  const handleExportMarkdown = async () => {
    if (!conversationId) return;
    try {
      const blob = await exportConversationMarkdown(conversationId);
      downloadBlob(blob, `conversation_${conversationId.substring(0, 8)}.md`);
      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting markdown:", error);
    }
  };

  const handleExportTxt = async () => {
    if (!conversationId) return;
    try {
      const blob = await exportConversationTxt(conversationId);
      downloadBlob(blob, `conversation_${conversationId.substring(0, 8)}.txt`);
      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting txt:", error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-terminal-bg h-full overflow-hidden">
      {/* Header FIXO */}
      <div className="shrink-0 border-b border-terminal-border bg-terminal-surface p-2 md:p-4 flex items-center justify-between flex-wrap gap-2">
        <div className="font-mono text-xs md:text-sm text-terminal-text">
          <span className="text-terminal-accent">❯</span> AI Chat
          {currentConversation && (
            <span className="text-terminal-dim ml-2">
              - {currentConversation.title || "New Chat"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <AgentSelector />
          {selectedAgent && (
            <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-[10px]">
              <span>{selectedAgent.icon}</span>
              <span>{selectedAgent.name}</span>
              <span className="text-terminal-dim">• active</span>
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2 py-1 font-mono text-xs border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent transition-colors"
              title="Export conversation"
            >
              📤
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-terminal-surface border border-terminal-border z-50 min-w-[180px]">
                <button
                  onClick={handleExportMarkdown}
                  className="block w-full text-left px-4 py-2 font-mono text-xs text-terminal-text hover:bg-terminal-bg hover:text-terminal-accent"
                >
                  [ Export as Markdown ]
                </button>
                <button
                  onClick={handleExportTxt}
                  className="block w-full text-left px-4 py-2 font-mono text-xs text-terminal-text hover:bg-terminal-bg hover:text-terminal-accent"
                >
                  [ Export as TXT ]
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Token Warning (condicional) - CORRIGIDO */}
      {warningStyles && (
        <div
          className={`shrink-0 mx-4 mt-2 px-3 py-2 border ${warningStyles.border} ${warningStyles.text} font-mono text-xs flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            <span>{warningStyles.icon}</span>
            <span>{warningStyles.label}</span>
          </div>
          <div>
            {tokenUsage.toLocaleString()} / {TOKEN_LIMIT.toLocaleString()}{" "}
            tokens ({usagePercentage}%)
          </div>
        </div>
      )}

      {warningStyles && (
        <div className="shrink-0 mx-4 mt-1 h-1 bg-terminal-border">
          <div
            className={`h-full transition-all ${warningStyles.bg}`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      )}

      {/* Messages - ÁREA COM SCROLL */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-2 md:p-4"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="font-mono text-terminal-accent text-4xl mb-4">
              ❯
            </div>
            <div className="font-mono text-terminal-dim text-sm">
              &lt;ready/&gt;
            </div>
            <div className="font-mono text-terminal-dim text-xs mt-2">
              Type a message below to get started.
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onEdit={handleEditMessage}
              />
            ))}
            {isLoading && (
              <div className="flex items-start mb-4">
                <div className="px-4 py-3 border border-terminal-border bg-terminal-bg">
                  <div className="font-mono text-xs mb-2 text-terminal-accent">
                    ❯ ai@assistant
                  </div>
                  <LoadingDots />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-4 md:right-8 bg-terminal-surface border border-terminal-accent text-terminal-accent p-2 hover:bg-terminal-accent hover:text-terminal-bg transition-colors font-mono z-50"
        >
          ↓
        </button>
      )}

      {/* Input FIXO */}
      <div className="shrink-0">
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>

      {/* Status bar FIXO */}
      <div className="shrink-0 border-t border-terminal-border bg-terminal-surface px-2 md:px-4 py-1 flex items-center justify-between">
        <div className="font-mono text-[10px] text-terminal-dim">
          {conversationId ? (
            <span>
              ID: {conversationId.substring(0, 8)}... | tokens:{" "}
              {tokenUsage.toLocaleString()}
            </span>
          ) : (
            <span>No conversation selected</span>
          )}
        </div>
        <div className="font-mono text-[10px] text-terminal-accent">
          {isLoading ? "● processing" : "○ ready"}
        </div>
      </div>
    </div>
  );
}
