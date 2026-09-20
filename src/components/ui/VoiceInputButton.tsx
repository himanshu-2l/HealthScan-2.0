import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceInput, VoicePattern, ParsedResult } from '@/hooks/useVoiceInput';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  patterns?: VoicePattern[];
  onParsedResult?: (result: ParsedResult) => void;
  className?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizes = {
  sm: 14,
  md: 18,
  lg: 22,
};

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  patterns,
  onParsedResult,
  className,
  placeholder = 'Click to speak',
  size = 'md',
  disabled = false,
}) => {
  const [showError, setShowError] = useState(false);
  // Track last delivered transcript to prevent duplicate callbacks
  const lastDeliveredTranscriptRef = useRef<string>('');
  
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    parsedResult,
    error,
  } = useVoiceInput({
    continuous: true,
    restartOnSilence: true,
    patterns,
  });

  // Handle transcript changes - deliver in real-time as speech is finalized
  useEffect(() => {
    if (transcript && transcript !== lastDeliveredTranscriptRef.current) {
      // Only call onTranscript if this is a new transcript we haven't delivered
      lastDeliveredTranscriptRef.current = transcript;
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  // Handle parsed results
  useEffect(() => {
    if (parsedResult && onParsedResult) {
      onParsedResult(parsedResult);
    }
  }, [parsedResult, onParsedResult]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleClick = () => {
    if (!isSupported || disabled) return;
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const isDisabled = !isSupported || disabled;
  const tooltipText = !isSupported 
    ? 'Voice input not supported' 
    : showError 
      ? error 
      : isListening 
        ? interimTranscript || 'Listening...' 
        : placeholder;

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Tooltip / Transcript Badge */}
      <div
        className={cn(
          'absolute bottom-full mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap',
          'transition-all duration-300 pointer-events-none z-50',
          'glass-panel-light text-white/90',
          isListening && interimTranscript ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
          showError && 'bg-destructive/20 text-destructive border-destructive/30'
        )}
      >
        {tooltipText}
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/10" />
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        title={!isSupported ? 'Voice input not supported' : placeholder}
        className={cn(
          'relative rounded-full flex items-center justify-center',
          'transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          sizeClasses[size],
          className,
          // Glass morphism base styles
          'bg-white/[0.08] backdrop-blur-xl border border-white/[0.10]',
          // Hover states (only when not listening and not disabled)
          !isListening && !isDisabled && 'hover:bg-white/[0.15] hover:border-white/[0.20] hover:scale-105',
          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed bg-white/[0.03]',
          // Listening state - pulsing red/primary ring
          isListening && [
            'bg-destructive/20 border-destructive/40',
            'animate-pulse-ring',
          ],
        )}
        style={{
          animation: isListening ? 'pulse-ring 1.5s ease-in-out infinite' : undefined,
        }}
      >
        {/* Pulsing ring effect when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
            <span 
              className="absolute inset-[-4px] rounded-full border-2 border-destructive/30"
              style={{ animation: 'pulse-ring 1.5s ease-in-out infinite' }}
            />
          </>
        )}
        
        {/* Icon */}
        <span className={cn(
          'relative z-10 transition-transform duration-300',
          isListening && 'scale-110'
        )}>
          {isListening ? (
            <MicOff 
              size={iconSizes[size]} 
              className="text-destructive" 
            />
          ) : (
            <Mic 
              size={iconSizes[size]} 
              className={cn(
                'text-white/70',
                !isDisabled && 'group-hover:text-white'
              )} 
            />
          )}
        </span>
      </button>

      {/* Inline styles for keyframe animation */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default VoiceInputButton;
