import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Activity, Camera, Mic, ArrowRight, X, Sparkles } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
  onStartScan: () => void;
}

const ONBOARDING_KEY = 'healthscan_onboarded';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem(ONBOARDING_KEY);
  });

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  return { showOnboarding, completeOnboarding };
};

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onStartScan }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Activity className="w-8 h-8" />,
      title: 'Welcome to HealthScan',
      description: 'Your pocket clinical lab. Run a 60-second health scan using just your phone camera and microphone — no hardware needed.',
      features: [
        'Heart rate & HRV via camera PPG',
        'Voice biomarker analysis',
        'Motor skills & tremor detection',
        'Vision & hearing screening',
      ],
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: 'Permissions Needed',
      description: 'HealthScan uses your device sensors for on-device health analysis. All processing happens locally — nothing leaves your phone.',
      features: [
        { icon: <Camera className="w-4 h-4" />, text: 'Camera — for pulse detection (PPG) and eye tracking' },
        { icon: <Mic className="w-4 h-4" />, text: 'Microphone — for voice analysis and hearing tests' },
      ],
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Ready for Your First Scan',
      description: 'Place your fingertip on the camera lens, hold steady for 60 seconds, and get your heart rate, HRV, and more.',
      features: [],
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      onStartScan();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh]">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition"
            aria-label="Skip onboarding"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-8 bg-teal-500'
                    : i < step
                    ? 'w-4 bg-teal-500/40'
                    : 'w-4 bg-slate-200 dark:bg-white/[0.08]'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4">
            {currentStep.icon}
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {currentStep.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Features list */}
        {currentStep.features.length > 0 && (
          <div className="px-6 pb-4">
            <div className="space-y-2.5">
              {currentStep.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04]"
                >
                  {typeof feature === 'string' ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                        {feature.icon}
                      </div>
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{feature.text}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-2 flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-sm transition"
          >
            {isLast ? (
              <>
                <Sparkles className="w-4 h-4" />
                Run First Scan
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
