import { useState, useCallback, useEffect } from 'react';

export function useFocusMode() {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => !prev);
  }, []);

  useEffect(() => {
    if (isFocusMode) {
      // Esconder header e sidebar
      setShowHeader(false);
      setShowSidebar(false);
      
      // Adicionar classe para fullscreen
      document.documentElement.classList.add('focus-mode');
      
      // Escutar tecla Escape para sair
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFocusMode(false);
        }
      };
      window.addEventListener('keydown', handleEscape);
      
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      setShowHeader(true);
      setShowSidebar(true);
      document.documentElement.classList.remove('focus-mode');
    }
  }, [isFocusMode]);

  return {
    isFocusMode,
    showHeader,
    showSidebar,
    toggleFocusMode,
  };
}