import { useState, useCallback, useRef, useEffect } from "react";
import api from "../utils/api";

interface JarvisState {
  isListening: boolean;
  isSpeaking: boolean;
  interimText: string;
  language: "pt-BR" | "en-US";
  lastCommand: string;
  lastResponse: string;
}

export function useJarvis() {
  const [state, setState] = useState<JarvisState>({
    isListening: false,
    isSpeaking: false,
    interimText: "",
    language: "pt-BR",
    lastCommand: "",
    lastResponse: "",
  });

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => {
      setState((prev) => ({ ...prev, isSpeaking: false }));
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopListening();
      stopSpeaking();
    };
  }, []);

  const isSupported = () => {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  };

  const detectLanguage = (text: string): "pt-BR" | "en-US" => {
    const ptWords = [
      "oi",
      "olá",
      "como",
      "você",
      "que",
      "não",
      "sim",
      "obrigado",
      "por",
      "para",
      "uma",
      "isso",
      "qual",
      "quem",
      "onde",
      "quando",
    ];
    const enWords = [
      "hi",
      "hello",
      "how",
      "you",
      "what",
      "no",
      "yes",
      "thanks",
      "for",
      "to",
      "a",
      "this",
      "which",
      "who",
      "where",
      "when",
    ];

    const lowerText = text.toLowerCase();
    let ptScore = 0;
    let enScore = 0;

    for (const word of ptWords) {
      if (lowerText.includes(word)) ptScore++;
    }
    for (const word of enWords) {
      if (lowerText.includes(word)) enScore++;
    }

    return ptScore > enScore ? "pt-BR" : "en-US";
  };

  const startListening = useCallback(
    (onResult?: (text: string) => void) => {
      if (!isSupported()) return;

      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = state.language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      finalTranscriptRef.current = "";

      recognition.onstart = () => {
        setState((prev) => ({ ...prev, isListening: true, interimText: "" }));
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        setState((prev) => ({ ...prev, interimText: interim }));

        if (final.trim()) {
          finalTranscriptRef.current = final.trim();
          const detectedLanguage = detectLanguage(final);
          setState((prev) => ({
            ...prev,
            language: detectedLanguage,
            lastCommand: final.trim(),
          }));
          onResult?.(final.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.log("Recognition error:", event.error);
        setState((prev) => ({ ...prev, isListening: false, interimText: "" }));
      };

      recognition.onend = () => {
        setState((prev) => ({ ...prev, isListening: false, interimText: "" }));
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [state.language],
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setState((prev) => ({ ...prev, isListening: false, interimText: "" }));
  }, []);

  const speak = useCallback(
    async (text: string) => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }

        setState((prev) => ({ ...prev, isSpeaking: true }));

        const response = await api.post(
          "/voice/speak",
          { text, language: state.language },
          { responseType: "blob" },
        );

        const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      } catch (error) {
        console.error("Error speaking:", error);
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = state.language;
        window.speechSynthesis.speak(utterance);
        setState((prev) => ({ ...prev, isSpeaking: false }));
      }
    },
    [state.language],
  );

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    window.speechSynthesis?.cancel();
    setState((prev) => ({ ...prev, isSpeaking: false }));
  }, []);

  /**
   * Processa comando de voz usando IA
   */
  const processVoiceCommand = useCallback(
    async (command: string) => {
      setState((prev) => ({ ...prev, lastCommand: command }));

      try {
        const response = await api.post("/voice-chat/respond", {
          text: command,
          language: state.language,
        });

        const { text, audio } = response.data;
        setState((prev) => ({ ...prev, lastResponse: text }));

        // Reproduzir áudio
        if (audio) {
          const binaryString = atob(audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const audioBlob = new Blob([bytes], { type: "audio/mpeg" });
          const audioUrl = URL.createObjectURL(audioBlob);

          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
            setState((prev) => ({ ...prev, isSpeaking: true }));
          }
        } else {
          // Fallback to browser TTS
          await speak(text);
        }
      } catch (error) {
        console.error("Error processing voice command:", error);
        const fallback =
          state.language === "pt-BR"
            ? "Desculpe, não consegui processar isso."
            : "Sorry, I could not process that.";
        await speak(fallback);
      }
    },
    [state.language, speak],
  );

  const toggleLanguage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      language: prev.language === "pt-BR" ? "en-US" : "pt-BR",
    }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    processVoiceCommand,
    toggleLanguage,
    isSupported: isSupported(),
  };
}
