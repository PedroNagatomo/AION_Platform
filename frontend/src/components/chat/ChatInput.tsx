import {
  type FormEvent,
  useState,
  type KeyboardEvent,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useSpeechToText } from "../../hooks/useSpeechToText";

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { start, stop, isListening, interimText, isSupported } =
    useSpeechToText();
  const [speechLanguage, setSpeechLanguage] = useState<"pt-BR" | "en-US">(
    "pt-BR",
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedFiles.length > 0) && !isLoading) {
      onSend(input.trim(), selectedFiles);
      setInput("");
      setSelectedFiles([]);
      if (isListening) stop();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addFiles = (files: File[]) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        alert(`File ${file.name} exceeds the 50MB limit`);
        return false;
      }
      return true;
    });
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleToggleMic = () => {
    if (isListening) {
      stop();
    } else {
      start({
        language: speechLanguage,
        onResult: (finalText) => {
          setInput((prev) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? `${trimmedPrev} ${finalText}` : finalText;
          });
        },
      });
    }
  };

  return (
    <div
      className={`border-t border-terminal-border bg-terminal-surface p-2 md:p-4 transition-colors relative ${
        isDragOver
          ? "border-terminal-accent bg-terminal-accent bg-opacity-10"
          : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop overlay */}
      {isDragOver && (
        <div className="fixed inset-0 flex items-center justify-center bg-terminal-bg bg-opacity-80 z-50 pointer-events-none">
          <div className="font-mono text-terminal-accent text-base md:text-lg border-2 border-dashed border-terminal-accent px-6 md:px-8 py-4">
            Drop files here
          </div>
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1 md:gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-1 md:gap-2 bg-terminal-bg border border-terminal-border px-2 md:px-3 py-1 group max-w-full"
            >
              <span className="text-terminal-accent text-xs md:text-sm">
                {file.type.startsWith("image/") ? "🖼" : "📎"}
              </span>
              <span className="font-mono text-[10px] md:text-xs text-terminal-text truncate max-w-[100px] md:max-w-[200px]">
                {file.name}
              </span>
              <span className="font-mono text-[10px] md:text-xs text-terminal-dim hide-mobile">
                ({formatFileSize(file.size)})
              </span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="text-terminal-dim hover:text-red-500 font-mono text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="mb-2 flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-terminal-bg border border-red-500">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
          <span className="font-mono text-[10px] md:text-xs text-red-500 truncate">
            {interimText ||
              (speechLanguage === "pt-BR"
                ? "Ouvindo... Fale agora..."
                : "Listening... Speak now...")}
          </span>
        </div>
      )}

      {/* FORM - Mobile: empilhado | Desktop: linha */}
      <form 
        onSubmit={handleSubmit} 
        className="flex flex-col md:flex-row md:items-end gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,text/*,application/pdf,application/json,application/xml,application/javascript,application/x-yaml,application/sql,application/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />

        {/* Botões - Mobile: linha | Desktop: coluna ao lado */}
        <div className="flex gap-1 md:gap-2 order-2 md:order-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none px-2 md:px-3 py-2 md:py-3 bg-terminal-surface border border-terminal-border text-terminal-dim font-mono text-xs md:text-sm hover:border-terminal-accent hover:text-terminal-accent transition-colors min-h-[40px] md:min-h-0"
            title="Attach file (or drag & drop)"
          >
            📎
          </button>

          {isSupported && (
            <button
              type="button"
              onClick={handleToggleMic}
              className={`flex-1 md:flex-none px-2 md:px-3 py-2 md:py-3 border font-mono text-xs md:text-sm transition-colors min-h-[40px] md:min-h-0 ${
                isListening
                  ? "bg-red-500 text-terminal-bg border-red-500 animate-pulse"
                  : "bg-terminal-surface border-terminal-border text-terminal-dim hover:border-terminal-accent hover:text-terminal-accent"
              }`}
              title={isListening ? "Stop" : "Dictate"}
            >
              🎤
            </button>
          )}

          {isSupported && (
            <button
              type="button"
              onClick={() =>
                setSpeechLanguage(speechLanguage === "pt-BR" ? "en-US" : "pt-BR")
              }
              className="flex-1 md:flex-none px-1 md:px-2 py-2 md:py-3 bg-terminal-surface border border-terminal-border text-terminal-dim font-mono text-[10px] md:text-xs hover:border-terminal-accent hover:text-terminal-accent transition-colors min-h-[40px] md:min-h-0"
              title={speechLanguage === "pt-BR" ? "Portuguese" : "English"}
            >
              {speechLanguage === "pt-BR" ? "🇧🇷" : "🇺🇸"}
            </button>
          )}
        </div>

        {/* Textarea */}
        <div className="flex-1 relative order-1 md:order-2">
          <div className="absolute left-2 md:left-3 top-2 md:top-3 font-mono text-terminal-accent text-xs md:text-sm">
            ❯
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              speechLanguage === "pt-BR"
                ? "Digite ou solte arquivos aqui..."
                : "Type or drop files here..."
            }
            disabled={isLoading}
            rows={2}
            className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm pl-7 md:pl-8 pr-2 md:pr-3 py-2 md:py-3 resize-none focus:outline-none focus:border-terminal-accent transition-colors placeholder:text-terminal-dim disabled:opacity-50 min-h-[60px] md:min-h-0"
          />
        </div>

        {/* Botão Enviar - Mobile: full width | Desktop: ao lado */}
        <button
          type="submit"
          disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
          className="order-3 px-4 md:px-6 py-2 md:py-3 bg-terminal-surface border border-terminal-accent text-terminal-accent font-mono text-xs md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors disabled:opacity-50 disabled:hover:bg-terminal-surface disabled:hover:text-terminal-accent min-h-[40px] md:min-h-0"
        >
          {isLoading ? "[...]" : "[ Send ]"}
        </button>
      </form>

      {/* Dica - esconder no mobile */}
      <div className="mt-2 font-mono text-[10px] text-terminal-dim hide-mobile">
        Enter to send | Shift+Enter for new line | 📎 attach | 🎤 dictate | Drop
        files anywhere
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}