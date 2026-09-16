import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechOptions {
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice | null;
  onStart?: () => void;
  onEnd?: () => void;
}

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis?.getVoices() || [];
      setVoices(availableVoices);
    };

    loadVoices();
    
    // Chrome loads voices async
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    // Priority order for best voices
    const priorityList = [
      'Google US English',
      'Google UK English Female',
      'Google UK English Male',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Samantha',
      'Alex',
      'en-US',
      'en-GB',
      'en',
    ];

    for (const priority of priorityList) {
      const voice = voices.find(v => 
        v.name.includes(priority) || v.lang === priority
      );
      if (voice) return voice;
    }

    // Fallback: any English voice
    return voices.find(v => v.lang.startsWith('en')) || null;
  }, [voices]);

  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ' Code block omitted. ')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove bold
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      // Remove italic
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove headers
      .replace(/^#+\s+/gm, '')
      // Remove list markers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove special characters
      .replace(/[|>]/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speak = useCallback((text: string, options?: SpeechOptions) => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    const cleanText = cleanTextForSpeech(text);
    
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = options?.rate || 1;
    utterance.pitch = options?.pitch || 1;
    
    // Use best available voice
    const voice = options?.voice || getBestVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      options?.onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
      options?.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [getBestVoice]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, []);

  const pause = useCallback(() => {
    window.speechSynthesis?.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis?.resume();
    setIsPaused(false);
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    voices,
  };
}