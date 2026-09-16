import { useState, useEffect } from 'react';
import { useConversationStore } from '../store/conversationStore';

const TOKEN_LIMIT = 131072; // Contexto do gpt-oss-20b
const WARNING_THRESHOLD_1 = 0.7; // 70% do limite
const WARNING_THRESHOLD_2 = 0.85; // 85% do limite
const WARNING_THRESHOLD_3 = 0.95; // 95% do limite

export function useTokenMonitor() {
  const { messages } = useConversationStore();
  const [tokenUsage, setTokenUsage] = useState(0);
  const [warningLevel, setWarningLevel] = useState<'none' | 'warning' | 'critical' | 'danger'>('none');

  useEffect(() => {
    // Estimar tokens (aproximadamente 4 caracteres = 1 token)
    const totalChars = messages.reduce((acc, msg) => acc + msg.content.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);
    
    setTokenUsage(estimatedTokens);
    
    const usageRatio = estimatedTokens / TOKEN_LIMIT;
    
    if (usageRatio >= WARNING_THRESHOLD_3) {
      setWarningLevel('danger');
    } else if (usageRatio >= WARNING_THRESHOLD_2) {
      setWarningLevel('critical');
    } else if (usageRatio >= WARNING_THRESHOLD_1) {
      setWarningLevel('warning');
    } else {
      setWarningLevel('none');
    }
  }, [messages]);

  return {
    tokenUsage,
    tokenLimit: TOKEN_LIMIT,
    usagePercentage: ((tokenUsage / TOKEN_LIMIT) * 100).toFixed(1),
    warningLevel,
  };
}