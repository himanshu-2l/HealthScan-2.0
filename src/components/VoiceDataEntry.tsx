import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Check, 
  X, 
  AlertCircle, 
  Edit2, 
  Trash2,
  Activity,
  Droplets,
  Heart,
  Thermometer,
  Scale,
  Wind,
  History,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useVoiceInput, VoicePattern } from '../hooks/useVoiceInput';

// Interfaces
interface ParsedReading {
  type: ReadingType;
  value: number | { systolic: number; diastolic: number };
  unit: string;
  rawTranscript: string;
}

interface BPReading {
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: string;
}

interface GlucoseReading {
  value: number;
  mealContext?: string;
  timestamp: string;
}

interface HealthReading {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface VoiceEntry {
  id: string;
  type: ReadingType;
  value: string;
  timestamp: string;
}

type ReadingType = 'blood_pressure' | 'glucose' | 'heart_rate' | 'temperature' | 'weight' | 'spo2';

type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

// Reading type configurations
const READING_TYPES: { type: ReadingType; label: string; icon: React.ElementType; unit: string }[] = [
  { type: 'blood_pressure', label: 'Blood Pressure', icon: Activity, unit: 'mmHg' },
  { type: 'glucose', label: 'Blood Glucose', icon: Droplets, unit: 'mg/dL' },
  { type: 'heart_rate', label: 'Heart Rate', icon: Heart, unit: 'bpm' },
  { type: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°F' },
  { type: 'weight', label: 'Weight', icon: Scale, unit: 'kg' },
  { type: 'spo2', label: 'SpO2', icon: Wind, unit: '%' },
];

// Voice patterns for the useVoiceInput hook
const VOICE_PATTERNS: VoicePattern[] = [
  {
    name: 'blood_pressure',
    pattern: /blood\s*pressure\s*(?:is\s*)?(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})|bp\s*(?:is\s*)?(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})|(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})\s*(?:blood\s*pressure|bp)?/i,
    extract: (match) => {
      const systolic = parseInt(match[1] || match[3] || match[5]);
      const diastolic = parseInt(match[2] || match[4] || match[6]);
      return { value: { systolic, diastolic }, unit: 'mmHg' };
    },
  },
  {
    name: 'glucose',
    pattern: /(?:blood\s*)?(?:glucose|sugar)\s*(?:is\s*|level\s*)?(\d{2,3})|(\d{2,3})\s*(?:blood\s*)?(?:glucose|sugar)/i,
    extract: (match) => ({ value: parseInt(match[1] || match[2]), unit: 'mg/dL' }),
  },
  {
    name: 'heart_rate',
    pattern: /(?:heart\s*rate|pulse|hr)\s*(?:is\s*)?(\d{2,3})\s*(?:bpm)?|(\d{2,3})\s*(?:bpm|beats?\s*per\s*minute)/i,
    extract: (match) => ({ value: parseInt(match[1] || match[2]), unit: 'bpm' }),
  },
  {
    name: 'temperature',
    pattern: /(?:body\s*)?temp(?:erature)?\s*(?:is\s*)?(\d{2,3}(?:\.\d)?)\s*(?:degrees?|°|f|fahrenheit|c|celsius)?|(\d{2,3}(?:\.\d)?)\s*(?:degrees?|°)\s*(?:f|fahrenheit|c|celsius)?/i,
    extract: (match) => ({ value: parseFloat(match[1] || match[2]), unit: '°F' }),
  },
  {
    name: 'weight',
    pattern: /weight\s*(?:is\s*)?(\d{2,3}(?:\.\d)?)\s*(?:kg|kilograms?|lbs?|pounds?)?|(\d{2,3}(?:\.\d)?)\s*(?:kg|kilograms?|lbs?|pounds?)/i,
    extract: (match) => ({ value: parseFloat(match[1] || match[2]), unit: 'kg' }),
  },
  {
    name: 'spo2',
    pattern: /(?:spo2|oxygen\s*(?:saturation)?|o2\s*(?:level)?)\s*(?:is\s*)?(\d{2,3})\s*(?:%|percent)?|(\d{2,3})\s*(?:%|percent)\s*(?:oxygen|spo2|o2)/i,
    extract: (match) => ({ value: parseInt(match[1] || match[2]), unit: '%' }),
  },
];

export const VoiceDataEntry: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [parsedReading, setParsedReading] = useState<ParsedReading | null>(null);
  const [selectedType, setSelectedType] = useState<ReadingType | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [history, setHistory] = useState<VoiceEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Use the voice input hook
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening: hookStartListening,
    stopListening: hookStopListening,
    parsedResult,
    error,
  } = useVoiceInput({
    continuous: true,
    restartOnSilence: true,
    patterns: VOICE_PATTERNS,
  });

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('healthscan_voice_entries');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse voice history:', e);
      }
    }
  }, []);

  // Sync hook state with component state
  useEffect(() => {
    if (isListening) {
      setVoiceState('listening');
      setErrorMessage('');
    }
  }, [isListening]);

  // Handle parsed results from the hook
  useEffect(() => {
    if (parsedResult && voiceState !== 'processing' && voiceState !== 'success') {
      const readingType = parsedResult.patternName as ReadingType;
      const typeConfig = READING_TYPES.find(rt => rt.type === readingType);
      
      setParsedReading({
        type: readingType,
        value: parsedResult.value as number | { systolic: number; diastolic: number },
        unit: parsedResult.unit || typeConfig?.unit || '',
        rawTranscript: parsedResult.rawTranscript,
      });
      setVoiceState('processing');
      hookStopListening();
    }
  }, [parsedResult, voiceState, hookStopListening]);

  // Handle errors from the hook
  useEffect(() => {
    if (error) {
      setVoiceState('error');
      setErrorMessage(error);
    }
  }, [error]);

  // Start listening - delegates to hook
  const startListening = useCallback(() => {
    setParsedReading(null);
    setErrorMessage('');
    hookStartListening();
  }, [hookStartListening]);

  // Stop listening - delegates to hook
  const stopListening = useCallback(() => {
    hookStopListening();
  }, [hookStopListening]);

  // Format value for display
  const formatValue = (reading: ParsedReading): string => {
    if (reading.type === 'blood_pressure' && typeof reading.value === 'object') {
      return `${reading.value.systolic}/${reading.value.diastolic}`;
    }
    return String(reading.value);
  };

  // Save reading to localStorage
  const saveReading = useCallback((reading: ParsedReading) => {
    const timestamp = new Date().toISOString();
    
    if (reading.type === 'blood_pressure' && typeof reading.value === 'object') {
      const bpReadings: BPReading[] = JSON.parse(localStorage.getItem('healthscan_bp_readings') || '[]');
      bpReadings.unshift({
        systolic: reading.value.systolic,
        diastolic: reading.value.diastolic,
        timestamp,
      });
      localStorage.setItem('healthscan_bp_readings', JSON.stringify(bpReadings.slice(0, 100)));
    } else if (reading.type === 'glucose') {
      const glucoseReadings: GlucoseReading[] = JSON.parse(localStorage.getItem('healthscan_glucose_readings') || '[]');
      glucoseReadings.unshift({
        value: reading.value as number,
        timestamp,
      });
      localStorage.setItem('healthscan_glucose_readings', JSON.stringify(glucoseReadings.slice(0, 100)));
    } else {
      const healthReadings: HealthReading[] = JSON.parse(localStorage.getItem('healthscan_health_readings') || '[]');
      healthReadings.unshift({
        type: reading.type,
        value: reading.value as number,
        unit: reading.unit,
        timestamp,
      });
      localStorage.setItem('healthscan_health_readings', JSON.stringify(healthReadings.slice(0, 100)));
    }

    // Update voice entry history
    const newEntry: VoiceEntry = {
      id: Date.now().toString(),
      type: reading.type,
      value: formatValue(reading) + ' ' + reading.unit,
      timestamp,
    };
    
    const updatedHistory = [newEntry, ...history].slice(0, 5);
    setHistory(updatedHistory);
    localStorage.setItem('healthscan_voice_entries', JSON.stringify(updatedHistory));

    setVoiceState('success');
    setTimeout(() => {
      setVoiceState('idle');
      setParsedReading(null);
      setSelectedType(null);
      setManualValue('');
    }, 2000);
  }, [history]);

  // Confirm parsed reading
  const confirmReading = useCallback(() => {
    if (parsedReading) {
      saveReading(parsedReading);
    }
  }, [parsedReading, saveReading]);

  // Cancel and reset
  const cancelReading = useCallback(() => {
    setVoiceState('idle');
    setParsedReading(null);
    setSelectedType(null);
    setManualValue('');
    setErrorMessage('');
  }, []);

  // Manual entry submit
  const submitManualEntry = useCallback(() => {
    if (!selectedType || !manualValue) return;

    let value: ParsedReading['value'];
    const typeConfig = READING_TYPES.find(rt => rt.type === selectedType);

    if (selectedType === 'blood_pressure') {
      const parts = manualValue.split(/[\/,]/).map(p => parseInt(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        value = { systolic: parts[0], diastolic: parts[1] };
      } else {
        setErrorMessage('Please enter BP as systolic/diastolic (e.g., 120/80)');
        return;
      }
    } else {
      const numValue = parseFloat(manualValue);
      if (isNaN(numValue)) {
        setErrorMessage('Please enter a valid number');
        return;
      }
      value = numValue;
    }

    const reading: ParsedReading = {
      type: selectedType,
      value,
      unit: typeConfig?.unit || '',
      rawTranscript: 'Manual entry',
    };

    saveReading(reading);
  }, [selectedType, manualValue, saveReading]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Get reading type label
  const getTypeLabel = (type: ReadingType): string => {
    return READING_TYPES.find(rt => rt.type === type)?.label || type;
  };

  // Get reading type icon
  const getTypeIcon = (type: ReadingType): React.ElementType => {
    return READING_TYPES.find(rt => rt.type === type)?.icon || Activity;
  };

  // Browser not supported fallback
  if (!isSupported) {
    return (
      <div className="p-6 space-y-6">
        <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <MicOff className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Voice Entry Not Supported</h3>
            <p className="text-white/60 max-w-md">
              Your browser doesn't support the Web Speech API. Please use Chrome, Edge, or Safari for voice entry features.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <Mic className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Voice Entry</h2>
            <p className="text-white/40 text-sm">Speak your health readings naturally</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
          voiceState === 'listening' 
            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
            : voiceState === 'processing'
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : voiceState === 'success'
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : voiceState === 'error'
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-white/[0.08] text-white/60 border border-white/[0.1]'
        }`}>
          {voiceState === 'listening' ? 'Listening...' : 
           voiceState === 'processing' ? 'Processing' :
           voiceState === 'success' ? 'Saved!' :
           voiceState === 'error' ? 'Error' : 'Ready'}
        </div>
      </div>

      {/* Main Voice Input Card */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Microphone Button */}
          <div className="relative">
            {voiceState === 'listening' && (
              <>
                <div className="absolute inset-0 rounded-full bg-teal-500/30 animate-ping" />
                <div className="absolute -inset-4 rounded-full bg-teal-500/10 animate-pulse" />
              </>
            )}
            <button
              onClick={voiceState === 'listening' ? stopListening : startListening}
              disabled={voiceState === 'processing' || voiceState === 'success'}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                voiceState === 'listening'
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                  : voiceState === 'success'
                  ? 'bg-emerald-500 text-white'
                  : voiceState === 'error'
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/[0.08] text-white/80 hover:bg-white/[0.12] hover:text-white'
              }`}
            >
              {voiceState === 'success' ? (
                <Check className="w-10 h-10" />
              ) : voiceState === 'listening' ? (
                <Mic className="w-10 h-10 animate-pulse" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
          </div>

          {/* Instructions or Transcript */}
          <div className="text-center min-h-[60px] w-full max-w-md">
            {voiceState === 'idle' && !errorMessage && (
              <p className="text-white/60">
                Tap the microphone and say something like:<br />
                <span className="text-white/40 text-sm">"My blood pressure is 120 over 80"</span>
              </p>
            )}
            {voiceState === 'listening' && (
              <div className="space-y-2">
                <p className="text-teal-400 font-medium">Listening...</p>
                {(transcript || interimTranscript) && (
                  <p className="text-white/80 bg-white/[0.04] rounded-lg px-4 py-2">
                    {transcript} <span className="text-white/40">{interimTranscript}</span>
                  </p>
                )}
              </div>
            )}
            {voiceState === 'success' && (
              <p className="text-emerald-400 font-medium">Reading saved successfully!</p>
            )}
            {errorMessage && (
              <div className="flex items-center justify-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Parsed Reading Preview */}
      {parsedReading && voiceState === 'processing' && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border border-teal-500/20 rounded-2xl p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Activity className="w-4 h-4" />
              <span>Detected Reading</span>
            </div>
            
            <div className="flex items-center gap-4">
              {(() => {
                const Icon = getTypeIcon(parsedReading.type);
                return (
                  <div className="w-14 h-14 rounded-xl bg-teal-500/20 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-teal-400" />
                  </div>
                );
              })()}
              <div className="flex-1">
                <p className="text-white/60 text-sm">{getTypeLabel(parsedReading.type)}</p>
                <p className="text-3xl font-bold text-white">
                  {formatValue(parsedReading)} <span className="text-lg text-white/60">{parsedReading.unit}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={confirmReading}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm
              </Button>
              <Button
                onClick={() => setVoiceState('idle')}
                variant="outline"
                className="bg-white/[0.04] border-white/[0.1] text-white hover:bg-white/[0.08]"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={cancelReading}
                variant="outline"
                className="bg-white/[0.04] border-white/[0.1] text-white/60 hover:bg-white/[0.08] hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Entry Pills */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
        <p className="text-white/60 text-sm mb-4">Quick Entry</p>
        <div className="flex flex-wrap gap-2">
          {READING_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(selectedType === type ? null : type);
                setManualValue('');
                setErrorMessage('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                selectedType === type
                  ? 'bg-white/[0.12] text-white border border-white/[0.15]'
                  : 'bg-white/[0.04] text-white/60 border border-transparent hover:bg-white/[0.08] hover:text-white/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>

        {/* Manual Entry Input */}
        {selectedType && (
          <div className="mt-4 space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder={selectedType === 'blood_pressure' ? '120/80' : 'Enter value'}
                className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-teal-500/50"
              />
              <Button
                onClick={submitManualEntry}
                disabled={!manualValue}
                className="bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50"
              >
                Save
              </Button>
            </div>
            <p className="text-white/40 text-xs">
              {selectedType === 'blood_pressure' 
                ? 'Enter as systolic/diastolic (e.g., 120/80)'
                : `Enter ${getTypeLabel(selectedType)} value in ${READING_TYPES.find(rt => rt.type === selectedType)?.unit}`
              }
            </p>
          </div>
        )}
      </Card>

      {/* History Section */}
      {history.length > 0 && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-white/60" />
            <p className="text-white/60 text-sm">Recent Voice Entries</p>
          </div>
          <div className="space-y-3">
            {history.map((entry) => {
              const Icon = getTypeIcon(entry.type);
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{entry.value}</p>
                    <p className="text-white/40 text-sm">{getTypeLabel(entry.type)}</p>
                  </div>
                  <p className="text-white/40 text-sm">{formatTimestamp(entry.timestamp)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Error State Retry */}
      {voiceState === 'error' && (
        <div className="flex justify-center">
          <Button
            onClick={startListening}
            variant="outline"
            className="bg-white/[0.04] border-white/[0.1] text-white hover:bg-white/[0.08]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
