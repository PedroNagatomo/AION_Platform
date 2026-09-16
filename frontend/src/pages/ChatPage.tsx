import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { ChatArea } from "../components/chat/ChatArea";
import { useConversationStore } from "../store/conversationStore";
import { useFocusMode } from "../hooks/useFocusMode";
import { getMessages, getConversations } from "../api/conversation";
import type { Message } from "../types";

export function ChatPage() {
  const { conversationId } = useParams();
  const { isFocusMode, toggleFocusMode } = useFocusMode();
  const { setMessages, setLoading, setCurrentConversation, setConversations } =
    useConversationStore();

  useEffect(() => {
    if (conversationId) {
      loadConversationData(conversationId);
    }
  }, [conversationId]);

  const loadConversationData = async (convId: string) => {
    setLoading(true);
    try {
      const conversations = await getConversations();
      setConversations(conversations);

      const currentConv = conversations.find((c) => c.id === convId);
      if (currentConv) setCurrentConversation(currentConv);

      // Buscar as mensagens do backend
      const messagesData = await getMessages(convId);

      // ✅ CORREÇÃO: converter MessageResponse[] para Message[]
      const messages: Message[] = messagesData.map((m) => ({
        id: m.id,
        role: m.role as Message["role"],
        content: m.content,
        createdAt: m.createdAt,
        tokenCount: m.tokenCount,
      }));

      setMessages(messages);
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {!isFocusMode && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <button
          onClick={toggleFocusMode}
          className="absolute top-4 right-4 z-50 px-2 py-1 font-mono text-xs border terminal-btn hide-mobile"
          title={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
        >
          {isFocusMode ? "⊡" : "⛶"}
        </button>
        <ChatArea />
      </div>
    </div>
  );
}
