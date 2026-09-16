import { useJarvis } from '../../hooks/useJarvis';
import { useNavigate } from 'react-router-dom';

export function JarvisAssistant() {
  const navigate = useNavigate();
  const {
    isListening,
    isSpeaking,
    interimText,
    language,
    lastCommand,
    lastResponse,
    startListening,
    stopListening,
    stopSpeaking,
    processVoiceCommand,
    toggleLanguage,
    isSupported,
  } = useJarvis();

  const handleCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Navigation commands (still handled locally for speed)
    const navigationCommands: Record<string, { path: string; responsePt: string; responseEn: string }> = {
      'dashboard': { path: '/dashboard', responsePt: 'Abrindo dashboard', responseEn: 'Opening dashboard' },
      'chat': { path: '/chat', responsePt: 'Abrindo chat', responseEn: 'Opening chat' },
      'conversa': { path: '/chat', responsePt: 'Abrindo chat', responseEn: 'Opening chat' },
      'notas': { path: '/notes', responsePt: 'Abrindo notas', responseEn: 'Opening notes' },
      'notes': { path: '/notes', responsePt: 'Abrindo notas', responseEn: 'Opening notes' },
      'planilha': { path: '/spreadsheets', responsePt: 'Abrindo planilhas', responseEn: 'Opening spreadsheets' },
      'spreadsheet': { path: '/spreadsheets', responsePt: 'Abrindo planilhas', responseEn: 'Opening spreadsheets' },
      'gráfico': { path: '/charts', responsePt: 'Abrindo gráficos', responseEn: 'Opening charts' },
      'chart': { path: '/charts', responsePt: 'Abrindo gráficos', responseEn: 'Opening charts' },
      'calendário': { path: '/calendar', responsePt: 'Abrindo calendário', responseEn: 'Opening calendar' },
      'calendar': { path: '/calendar', responsePt: 'Abrindo calendário', responseEn: 'Opening calendar' },
      'contato': { path: '/contacts', responsePt: 'Abrindo contatos', responseEn: 'Opening contacts' },
      'contact': { path: '/contacts', responsePt: 'Abrindo contatos', responseEn: 'Opening contacts' },
      'configuração': { path: '/settings', responsePt: 'Abrindo configurações', responseEn: 'Opening settings' },
      'settings': { path: '/settings', responsePt: 'Abrindo configurações', responseEn: 'Opening settings' },
    };
    
    // Check navigation commands first
    for (const [key, value] of Object.entries(navigationCommands)) {
      if (lowerCommand.includes(key)) {
        navigate(value.path);
        await processVoiceCommand(value.responsePt);
        return;
      }
    }
    
    // For everything else, use AI
    await processVoiceCommand(command);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
      {/* Status display */}
      {(isListening || isSpeaking) && (
        <div className="bg-terminal-surface border border-terminal-accent px-4 py-2 font-mono text-xs text-terminal-accent max-w-[300px]">
          {isListening && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
              <span className="truncate">{interimText || (language === 'pt-BR' ? 'Ouvindo...' : 'Listening...')}</span>
            </span>
          )}
          {isSpeaking && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-terminal-accent rounded-full animate-pulse shrink-0" />
              <span>{language === 'pt-BR' ? 'Falando...' : 'Speaking...'}</span>
            </span>
          )}
        </div>
      )}
      
      {/* Last command and response */}
      {lastCommand && !isListening && !isSpeaking && (
        <div className="bg-terminal-bg border border-terminal-border px-3 py-2 font-mono text-[10px] text-terminal-dim max-w-[250px] space-y-1">
          <div className="truncate">❯ {lastCommand}</div>
          {lastResponse && (
            <div className="text-terminal-accent truncate">↳ {lastResponse}</div>
          )}
        </div>
      )}

      {/* Main JARVIS button */}
      <button
        onClick={() => {
          if (isListening) {
            stopListening();
          } else if (isSpeaking) {
            stopSpeaking();
          } else {
            startListening(handleCommand);
          }
        }}
        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl transition-all ${
          isListening || isSpeaking
            ? 'bg-terminal-accent text-terminal-bg border-terminal-accent animate-pulse'
            : 'bg-terminal-surface text-terminal-accent border-terminal-accent hover:bg-terminal-accent hover:text-terminal-bg'
        }`}
        title={isListening ? 'Stop' : isSpeaking ? 'Stop speaking' : 'JARVIS'}
      >
        {isListening ? '🎤' : isSpeaking ? '🔊' : '🤖'}
      </button>

      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="w-8 h-8 rounded-full bg-terminal-surface border border-terminal-border text-sm hover:border-terminal-accent transition-colors"
        title={language === 'pt-BR' ? 'Portuguese' : 'English'}
      >
        {language === 'pt-BR' ? '🇧🇷' : '🇺🇸'}
      </button>
    </div>
  );
}