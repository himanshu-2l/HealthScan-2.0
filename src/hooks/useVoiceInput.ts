import { useState, useRef, useCallback, useEffect } from 'react';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface VoicePattern {
  name: string;
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => { value: string | number | Record<string, any>; unit?: string };
}

export interface UseVoiceInputOptions {
  continuous?: boolean;
  restartOnSilence?: boolean;
  language?: string;
  patterns?: VoicePattern[];
  onResult?: (transcript: string, parsed?: ParsedResult) => void;
  onError?: (error: string) => void;
}

export interface ParsedResult {
  patternName: string;
  value: string | number | Record<string, any>;
  unit?: string;
  rawTranscript: string;
}

export interface UseVoiceInputReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  parsedResult: ParsedResult | null;
  error: string | null;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    continuous = true,
    restartOnSilence = true,
    language = 'en-US',
    patterns = [],
    onResult,
    onError,
  } = options;

  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const intentionalStopRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDeliveredTranscriptRef = useRef<string>('');
  const sessionTranscriptRef = useRef<string>('');

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Parse transcript against patterns
  const parseTranscript = useCallback((text: string): ParsedResult | null => {
    if (!patterns.length || !text.trim()) return null;

    for (const { name, pattern, extract } of patterns) {
      const match = text.match(pattern);
      if (match) {
        const extracted = extract(match);
        return {
          patternName: name,
          value: extracted.value,
          unit: extracted.unit,
          rawTranscript: text,
        };
      }
    }
    return null;
  }, [patterns]);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      sessionTranscriptRef.current = '';
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        const newSessionTranscript = sessionTranscriptRef.current
          ? `${sessionTranscriptRef.current} ${final}`
          : final;
        sessionTranscriptRef.current = newSessionTranscript;

        const newTranscript = transcript ? `${transcript} ${final}` : final;
        setTranscript(newTranscript);

        if (newSessionTranscript !== lastDeliveredTranscriptRef.current) {
          const parsed = parseTranscript(newSessionTranscript);
          if (parsed) {
            setParsedResult(parsed);
            onResult?.(newSessionTranscript, parsed);
          } else {
            onResult?.(newSessionTranscript);
          }
          lastDeliveredTranscriptRef.current = newSessionTranscript;
        }
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorType = event.error;
      let errorMessage = '';

      switch (errorType) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please enable microphone permissions.';
          setIsListening(false);
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          setIsListening(false);
          break;
        case 'aborted':
          errorMessage = '';
          break;
        default:
          errorMessage = `Voice recognition error: ${errorType}`;
          setIsListening(false);
      }

      if (errorMessage) {
        setError(errorMessage);
        onError?.(errorMessage);
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      if (intentionalStopRef.current) {
        intentionalStopRef.current = false;
        return;
      }

      const sessionTranscript = sessionTranscriptRef.current;
      const trimmedTranscript = sessionTranscript.trim();

      if (trimmedTranscript && trimmedTranscript !== lastDeliveredTranscriptRef.current) {
        const parsed = parseTranscript(trimmedTranscript);
        if (parsed && !parsedResult) {
          setParsedResult(parsed);
          onResult?.(trimmedTranscript, parsed);
          lastDeliveredTranscriptRef.current = trimmedTranscript;
        }
      }

      if (continuous && restartOnSilence && !intentionalStopRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (!intentionalStopRef.current) {
            sessionTranscriptRef.current = '';
            try {
              recognition.start();
            } catch (e) {
              console.error('Failed to restart speech recognition:', e);
            }
          }
        }, 150);
      }
    };

    return recognition;
  }, [continuous, language, parseTranscript, onResult, onError, restartOnSilence, transcript, parsedResult]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) return;

    intentionalStopRef.current = false;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    sessionTranscriptRef.current = '';
    lastDeliveredTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  }, [isSupported, initRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    intentionalStopRef.current = true;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Failed to stop speech recognition:', e);
      }
    }

    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    parsedResult,
    error,
  };
}

export default useVoiceInput;
