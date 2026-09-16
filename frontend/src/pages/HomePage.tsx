import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { useConversationStore } from '../store/conversationStore';
import { getConversations, createConversation } from '../api/conversation';

export function HomePage() {
  const navigate = useNavigate();
  const { setConversations, setCurrentConversation } = useConversationStore();

  useEffect(() => {
    loadOrCreateConversation();
  }, []);

  const loadOrCreateConversation = async () => {
    try {
      // Tentar carregar conversas existentes
      const conversations = await getConversations();
      
      if (conversations.length > 0) {
        // Usar a conversa mais recente
        setConversations(conversations);
        setCurrentConversation(conversations[0]);
        navigate(`/chat/${conversations[0].id}`);
      } else {
        // Criar nova conversa
        const newConversation = await createConversation();
        setConversations([newConversation]);
        setCurrentConversation(newConversation);
        navigate(`/chat/${newConversation.id}`);
      }
    } catch (error) {
      console.error('Erro ao carregar/criar conversa:', error);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center bg-terminal-bg">
        <div className="font-mono text-terminal-dim">
          &lt;inicializando.../&gt;
        </div>
      </div>
    </div>
  );
}