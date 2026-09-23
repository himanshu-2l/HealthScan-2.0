/**
 * Emergency Hypoglycemia Alert Component
 * Critical safety component for dangerously low blood sugar events
 * Full-screen overlay with step-by-step treatment instructions
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Phone,
  Clock,
  Heart,
  X,
  CheckCircle2,
  User,
} from 'lucide-react';

// Emergency contact interface matching EmergencyContacts.tsx
interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  notes?: string;
}

interface EmergencyHypoAlertProps {
  currentGlucose?: number;
  predictedGlucose?: number;
  isActive?: boolean; // Force show the alert
  onDismiss?: () => void;
  onEmergencyTriggered?: () => void;
}

// Audio alert function using Web Audio API
export function playAlertSound(): void {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContext) return;

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // 800Hz beep
    oscillator.type = 'sine';

    // Create 3 short beeps
    const now = audioContext.currentTime;
    const beepDuration = 0.15;
    const gapDuration = 0.1;

    for (let i = 0; i < 3; i++) {
      const startTime = now + i * (beepDuration + gapDuration);
      gainNode.gain.setValueAtTime(0.5, startTime);
      gainNode.gain.setValueAtTime(0, startTime + beepDuration);
    }

    oscillator.start(now);
    oscillator.stop(now + 3 * (beepDuration + gapDuration));

    // Cleanup after sound finishes
    setTimeout(() => {
      audioContext.close();
    }, 1000);
  } catch (error) {
    console.error('Error playing alert sound:', error);
  }
}

// Format time remaining for display
function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Load emergency contacts from localStorage
function loadEmergencyContacts(): EmergencyContact[] {
  try {
    const data = localStorage.getItem('healthscan_emergency_contacts');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export const EmergencyHypoAlert: React.FC<EmergencyHypoAlertProps> = ({
  currentGlucose,
  predictedGlucose,
  isActive = false,
  onDismiss,
  onEmergencyTriggered,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfirmDismiss, setShowConfirmDismiss] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds
  const [carbsAcknowledged, setCarbsAcknowledged] = useState(false);
  const [caregivers, setCaregivers] = useState<EmergencyContact[]>([]);
  const [alertSent, setAlertSent] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if alert should be shown (< 70 mg/dL)
  const shouldShowAlert = useCallback(() => {
    if (isActive) return true;
    if (currentGlucose !== undefined && currentGlucose !== null && currentGlucose < 70) return true;
    if (predictedGlucose !== undefined && predictedGlucose !== null && predictedGlucose < 70) return true;
    return false;
  }, [currentGlucose, predictedGlucose, isActive]);

  // Load caregivers and show alert when triggered
  useEffect(() => {
    if (shouldShowAlert()) {
      setIsVisible(true);
      setCaregivers(loadEmergencyContacts());
      playAlertSound();
      
      // Simulate sending alert to caregivers
      setTimeout(() => {
        setAlertSent(true);
      }, 2000);

      if (onEmergencyTriggered) {
        onEmergencyTriggered();
      }
    }
  }, [shouldShowAlert, onEmergencyTriggered]);

  // Timer countdown effect
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timeRemaining]);

  const handleAcknowledgeCarbs = () => {
    setCarbsAcknowledged(true);
    setTimerActive(true);
    setTimeRemaining(15 * 60);
  };

  const handleDismiss = () => {
    if (!showConfirmDismiss) {
      setShowConfirmDismiss(true);
      return;
    }
    setIsVisible(false);
    setShowConfirmDismiss(false);
    setTimerActive(false);
    setCarbsAcknowledged(false);
    setTimeRemaining(15 * 60);
    if (onDismiss) {
      onDismiss();
    }
  };

  const cancelDismiss = () => {
    setShowConfirmDismiss(false);
  };

  if (!isVisible) {
    return null;
  }

  const primaryCaregiver = caregivers.find((c) => c.isPrimary);
  const otherCaregivers = caregivers.filter((c) => !c.isPrimary);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-red-900 to-red-700 flex flex-col overflow-y-auto">
      {/* Pulsing Warning Icon */}
      <div className="flex-shrink-0 pt-8 pb-4 px-4 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-400/30"></div>
          <div className="relative p-6 bg-red-500/20 rounded-full border-2 border-red-400/50 animate-pulse">
            <AlertTriangle className="w-16 h-16 text-white" />
          </div>
        </div>
      </div>

      {/* Main Alert Content */}
      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-2 leading-tight">
          DANGEROUSLY LOW
          <br />
          BLOOD SUGAR
        </h1>

        {/* Current Reading */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 text-center border border-white/20">
          <div className="text-white/70 text-sm mb-1">Current Blood Glucose</div>
          <div className="text-6xl sm:text-7xl font-bold text-white mb-1">
            {currentGlucose ?? predictedGlucose ?? '??'}
          </div>
          <div className="text-white/60 text-lg">mg/dL</div>
          {(currentGlucose !== undefined && currentGlucose < 70) ||
          (predictedGlucose !== undefined && predictedGlucose < 70) ? (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-500/30 rounded-full border border-red-400/40">
              <AlertTriangle className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                {((currentGlucose !== undefined && currentGlucose < 54) ||
                  (predictedGlucose !== undefined && predictedGlucose < 54))
                  ? 'SEVERE HYPOGLYCEMIA (<54 mg/dL)'
                  : 'HYPOGLYCEMIA ALERT (<70 mg/dL)'}
              </span>
            </div>
          ) : null}
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 mb-6">
          {/* Step 1 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white text-red-700 rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-lg mb-3">
                  Eat 15 grams of fast-acting carbohydrates NOW
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-white text-sm">4 glucose tablets</span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-white text-sm">150ml fruit juice</span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-white text-sm">3 tsp sugar in water</span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-white text-sm">1 tbsp honey</span>
                  </div>
                </div>

                {!carbsAcknowledged ? (
                  <Button
                    onClick={handleAcknowledgeCarbs}
                    className="w-full mt-4 bg-white hover:bg-white/90 text-red-700 font-bold py-4 h-auto rounded-xl text-lg"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    I&apos;ve eaten the carbs
                  </Button>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Carbs consumed - timer started</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white text-red-700 rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-lg">Wait 15 minutes</p>
                
                {carbsAcknowledged && timerActive && (
                  <div className="mt-3 bg-black/20 rounded-xl p-4 text-center">
                    <Clock className="w-8 h-8 text-white mx-auto mb-2" />
                    <div className="text-5xl font-bold text-white font-mono">
                      {formatTimeRemaining(timeRemaining)}
                    </div>
                    <p className="text-white/60 text-sm mt-1">until recheck</p>
                  </div>
                )}

                {carbsAcknowledged && !timerActive && timeRemaining === 0 && (
                  <div className="mt-3 bg-emerald-500/30 rounded-xl p-4 text-center border border-emerald-400/40">
                    <Clock className="w-8 h-8 text-white mx-auto mb-2" />
                    <p className="text-white font-bold text-lg">Time to recheck your blood sugar!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white text-red-700 rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <p className="text-white font-bold text-lg pt-1">Recheck your blood sugar</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white text-red-700 rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <p className="text-white font-bold text-lg pt-1">
                If still below 70, repeat Step 1
              </p>
            </div>
          </div>
        </div>

        {/* Caregiver Auto-Alert Section */}
        {caregivers.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">Emergency Contacts Notified</span>
            </div>

            {alertSent ? (
              <div className="space-y-2">
                {primaryCaregiver && (
                  <div className="flex items-center gap-3 bg-emerald-500/20 rounded-lg p-3 border border-emerald-400/30">
                    <User className="w-5 h-5 text-emerald-300" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{primaryCaregiver.name}</p>
                      <p className="text-white/60 text-sm">{primaryCaregiver.relationship} (Primary)</p>
                    </div>
                    <span className="text-emerald-300 text-sm font-medium">Alerted</span>
                  </div>
                )}
                {otherCaregivers.slice(0, 2).map((caregiver) => (
                  <div
                    key={caregiver.id}
                    className="flex items-center gap-3 bg-white/5 rounded-lg p-3"
                  >
                    <User className="w-5 h-5 text-white/60" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{caregiver.name}</p>
                      <p className="text-white/60 text-sm">{caregiver.relationship}</p>
                    </div>
                    <span className="text-white/60 text-sm">Alerted</span>
                  </div>
                ))}

                <div className="mt-3 p-3 bg-black/20 rounded-lg">
                  <p className="text-white/80 text-sm">
                    <span className="font-semibold">Alert sent:</span> Glucose{' '}
                    {currentGlucose ?? predictedGlucose} mg/dL at{' '}
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    Patient status: Severe hypoglycemia detected
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white/60">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending alerts...</span>
              </div>
            )}
          </div>
        )}

        {/* Emergency Call Button */}
        <a
          href="tel:102"
          className="flex items-center justify-center gap-3 w-full bg-white text-red-700 font-bold py-4 h-auto rounded-xl text-lg mb-4 hover:bg-white/90 transition-colors"
        >
          <Phone className="w-6 h-6" />
          Call Ambulance (102)
        </a>

        {/* Dismiss Section */}
        {!showConfirmDismiss ? (
          <button
            onClick={handleDismiss}
            className="w-full py-4 text-white/60 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Dismiss Alert
          </button>
        ) : (
          <div className="bg-red-950/50 rounded-xl p-4 border border-red-400/30">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-bold text-lg">Are you sure?</p>
                <p className="text-white/70 text-sm">
                  Your blood sugar is dangerously low. Only dismiss if you have treated it and feel better.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={cancelDismiss}
                variant="outline"
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20 h-12"
              >
                Keep Alert Open
              </Button>
              <Button
                onClick={handleDismiss}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white h-12"
              >
                Yes, Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Emergency Button Component - Floating button for non-overlay use
interface EmergencyButtonProps {
  onClick?: () => void;
  className?: string;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  onClick,
  className = '',
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    playAlertSound();
    if (onClick) {
      onClick();
    }
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Emergency Hypoglycemia SOS Button"
      className={`
        fixed bottom-20 sm:bottom-24 md:bottom-6 right-4 sm:right-6 z-40 md:z-50 mb-[env(safe-area-inset-bottom,0px)]
        flex items-center gap-2
        px-4 sm:px-6 py-3 sm:py-4
        bg-gradient-to-r from-red-600 to-red-500
        hover:from-red-500 hover:to-red-400
        text-white font-bold
        rounded-full
        shadow-2xl shadow-red-600/40
        border-2 border-red-400/50
        transition-all duration-200
        ${isPressed ? 'scale-95' : 'hover:scale-105'}
        ${className}
      `}
    >
      <div className="relative">
        <Heart className="w-5 h-5 fill-current" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
      </div>
      <span className="hidden sm:inline">Emergency</span>
      <span className="sm:hidden">SOS</span>
    </button>
  );
};

export default EmergencyHypoAlert;
