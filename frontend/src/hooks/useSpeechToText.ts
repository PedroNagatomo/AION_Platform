import { useState, useCallback, useRef } from 'react';

interface SpeechToTextOptions {
  language?: string;
  onResult?: (finalText: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  const isSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };

  const start = useCallback((options?: SpeechToTextOptions) => {
    if (!isSupported()) {
      options?.onError?.('Speech recognition not supported in this browser');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = options?.language || 'en-US';
    recognition.continuous = false; // FALSE - stops after first utterance
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = '';

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript);
      }

      if (finalTranscript) {
        finalTranscriptRef.current = finalTranscript.trim();
        // Send result immediately
        options?.onResult?.(finalTranscriptRef.current);
      }
    };

    recognition.onerror = (event: any) => {
      console.log('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimText('');
      
      if (event.error === 'not-allowed') {
        options?.onError?.('Microphone access denied');
      } else if (event.error === 'no-speech') {
        options?.onError?.('No speech detected. Try again.');
      } else if (event.error !== 'aborted') {
        options?.onError?.(event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      
      // If we have a final transcript, send it
      if (finalTranscriptRef.current) {
        options?.onResult?.(finalTranscriptRef.current);
      }
      
      options?.onEnd?.();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  return {
    start,
    stop,
    isListening,
    interimText,
    isSupported: isSupported(),
  };
}