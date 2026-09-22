import React, { useState } from 'react';

import {
  Brain,
  Eye,
  Heart,
  Wind,
  Apple,
  Bone,
  Fingerprint,
  SmilePlus,
  Activity,
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Check,
  Clock,
  Thermometer,
  ChevronRight,
  ShieldAlert,
  Stethoscope,
  Pill,
  Phone
} from 'lucide-react';
import { VoiceInputButton } from './ui/VoiceInputButton';

// Types
interface BodyArea {
  id: string;
  name: string;
  icon: React.ElementType;
  commonSymptoms: string[];
}

interface AnalysisResult {
  possibleConditions: {
    name: string;
    likelihood: 'High' | 'Medium' | 'Low';
    description: string;
  }[];
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Urgent';
  whenToSeeDoctor: string[];
  selfCareTips: string[];
}

// Body areas configuration
const bodyAreas: BodyArea[] = [
  { id: 'head', name: 'Head & Brain', icon: Brain, commonSymptoms: ['Headache', 'Migraine', 'Dizziness', 'Memory issues', 'Confusion'] },
  { id: 'eyes', name: 'Eyes & Ears', icon: Eye, commonSymptoms: ['Blurred vision', 'Eye pain', 'Ringing ears', 'Hearing loss', 'Ear pain'] },
  { id: 'chest', name: 'Chest & Heart', icon: Heart, commonSymptoms: ['Chest pain', 'Palpitations', 'Irregular heartbeat', 'Chest tightness'] },
  { id: 'lungs', name: 'Lungs & Breathing', icon: Wind, commonSymptoms: ['Shortness of breath', 'Cough', 'Wheezing', 'Difficulty breathing'] },
  { id: 'abdomen', name: 'Abdomen & Digestive', icon: Apple, commonSymptoms: ['Stomach pain', 'Nausea', 'Bloating', 'Diarrhea', 'Constipation'] },
  { id: 'muscles', name: 'Muscles & Joints', icon: Bone, commonSymptoms: ['Joint pain', 'Muscle aches', 'Stiffness', 'Swelling', 'Weakness'] },
  { id: 'skin', name: 'Skin', icon: Fingerprint, commonSymptoms: ['Rash', 'Itching', 'Redness', 'Swelling', 'Dryness'] },
  { id: 'mental', name: 'Mental & Emotional', icon: SmilePlus, commonSymptoms: ['Anxiety', 'Depression', 'Stress', 'Sleep issues', 'Mood changes'] },
  { id: 'general', name: 'General / Other', icon: Activity, commonSymptoms: ['Fever', 'Fatigue', 'Weight changes', 'Night sweats', 'Loss of appetite'] },
];

const commonSymptomChips = ['Headache', 'Fever', 'Fatigue', 'Nausea', 'Pain', 'Dizziness', 'Cough', 'Weakness', 'Chills', 'Sweating'];

const durations = [
  { id: 'today', label: 'Today', value: 'started today' },
  { id: 'few-days', label: 'Few days', value: 'a few days' },
  { id: '1-week', label: '1 week', value: 'about a week' },
  { id: '2-weeks', label: '2+ weeks', value: 'more than 2 weeks' },
];

const severityLevels = ['Mild', 'Moderate', 'Severe'] as const;

export default function SymptomChecker() {
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedArea, setSelectedArea] = useState<BodyArea | null>(null);
  const [symptomDescription, setSymptomDescription] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState<typeof severityLevels[number]>('Moderate');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handlers
  const handleAreaSelect = (area: BodyArea) => {
    setSelectedArea(area);
    setSelectedSymptoms([]);
    setCurrentStep(2);
  };

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 4) {
        setAnalysisResult(null);
        setError(null);
      }
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedArea(null);
    setSymptomDescription('');
    setSelectedSymptoms([]);
    setDuration('');
    setSeverity('Moderate');
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedArea || (!symptomDescription && selectedSymptoms.length === 0)) {
      setError('Please describe your symptoms or select at least one symptom.');
      return;
    }

    setCurrentStep(3);
    setIsAnalyzing(true);
    setError(null);

    try {
      const allSymptoms = [
        ...selectedSymptoms,
        ...(symptomDescription ? [symptomDescription] : [])
      ].join(', ');

      const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'symptom-check',
          payload: {
            bodyArea: selectedArea.name,
            symptoms: allSymptoms,
            duration: duration || 'Not specified',
            severity,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to analyze symptoms');
      }

      const data = await response.json();
      const parsed: AnalysisResult = data.result;
      setAnalysisResult(parsed);
      setCurrentStep(4);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze symptoms. Please try again.');
      setCurrentStep(2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30';
      case 'Moderate': return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30';
      case 'High': return 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/30';
      case 'Urgent': return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10';
    }
  };

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'High': return 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/30';
      case 'Medium': return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30';
      case 'Low': return 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10';
      default: return 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10';
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step === currentStep
                ? 'bg-teal-600 text-white shadow-sm ring-4 ring-teal-500/20 scale-105'
                : step < currentStep
                ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/30'
                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-white/30 border border-slate-200 dark:border-white/5'
            }`}
          >
            {step < currentStep ? <Check className="w-4 h-4" /> : step}
          </div>
          {step < 4 && (
            <div
              className={`w-8 sm:w-12 h-0.5 transition-all duration-300 ${
                step < currentStep ? 'bg-teal-500' : 'bg-slate-200 dark:bg-white/[0.06]'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Render Step 1: Body Area Selection
  const renderBodyAreaSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Select Anatomical Region</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Choose the primary area where you are experiencing symptoms</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {bodyAreas.map((area) => {
          const Icon = area.icon;
          return (
            <button
              key={area.id}
              onClick={() => handleAreaSelect(area)}
              className="group bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 text-left hover:border-teal-400/50 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/30 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-900 dark:text-white font-bold text-sm sm:text-base mb-1">{area.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed">
                    {area.commonSymptoms.slice(0, 3).join(', ')}...
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all mt-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render Step 2: Symptom Description
  const renderSymptomDescription = () => (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Detail Physical Sensations</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Selected region: <span className="font-semibold text-teal-600 dark:text-teal-400">{selectedArea?.name}</span>
        </p>
      </div>

      {/* Common symptoms for selected area */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6 space-y-3">
        <h3 className="text-slate-900 dark:text-white font-bold text-sm">Common indications in this region</h3>
        <div className="flex flex-wrap gap-2">
          {selectedArea?.commonSymptoms.map((symptom) => (
            <button
              key={symptom}
              onClick={() => handleSymptomToggle(symptom)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                selectedSymptoms.includes(symptom)
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5'
              }`}
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>

      {/* Quick symptom chips */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6 space-y-3">
        <h3 className="text-slate-900 dark:text-white font-bold text-sm">General Constitutional Symptoms</h3>
        <div className="flex flex-wrap gap-2">
          {commonSymptomChips.map((symptom) => (
            <button
              key={symptom}
              onClick={() => handleSymptomToggle(symptom)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                selectedSymptoms.includes(symptom)
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5'
              }`}
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>

      {/* Description textarea */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6 space-y-3">
        <h3 className="text-slate-900 dark:text-white font-bold text-sm">Clinical Narrative (Optional)</h3>
        <div className="flex items-start gap-3">
          <textarea
            value={symptomDescription}
            onChange={(e) => setSymptomDescription(e.target.value)}
            placeholder="Describe your symptoms in more detail... When did they start? What makes them better or worse?"
            className="flex-1 h-28 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 text-sm resize-none focus:outline-none focus:border-teal-500 transition-colors"
          />
          <VoiceInputButton
            onTranscript={(text) => setSymptomDescription(text)}
            placeholder="Speak narrative"
            size="md"
          />
        </div>
      </div>

      {/* Duration */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-slate-900 dark:text-white font-bold text-sm">Onset & Duration</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {durations.map((d) => (
            <button
              key={d.id}
              onClick={() => setDuration(d.value)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                duration === d.value
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-slate-900 dark:text-white font-bold text-sm">Severity Intensity</h3>
        </div>
        <div className="flex gap-2.5">
          {severityLevels.map((level) => (
            <button
              key={level}
              onClick={() => setSeverity(level)}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                severity === level
                  ? level === 'Mild'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : level === 'Moderate'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <p className="text-rose-700 dark:text-rose-300 text-xs sm:text-sm">{error}</p>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!selectedSymptoms.length && !symptomDescription}
        className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
      >
        <Stethoscope className="w-4 h-4" />
        Analyze Symptoms with AI
      </button>
    </div>
  );

  // Render Step 3: Loading/Analyzing
  const renderAnalyzing = () => (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center border border-teal-200 dark:border-teal-800/40">
          <Loader2 className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Synthesizing Clinical Profile</h2>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Evaluating symptom interactions against clinical databases...</p>
      </div>
    </div>
  );

  // Render Step 4: Results
  const renderResults = () => {
    if (!analysisResult) return null;

    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Clinical Assessment Summary</h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Preliminary triage synthesis based on your reported symptoms</p>
        </div>

        {/* Risk Level */}
        <div className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${getRiskLevelColor(analysisResult.riskLevel)}`}>
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/40 dark:bg-white/10">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Calculated Risk Level</p>
              <p className="text-xl font-black">{analysisResult.riskLevel} Priority</p>
            </div>
          </div>
        </div>

        {/* Possible Conditions */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Differential Considerations
          </h3>
          <div className="grid gap-3">
            {analysisResult.possibleConditions.map((condition, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">{condition.name}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLikelihoodColor(condition.likelihood)}`}>
                    {condition.likelihood} Likelihood
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">{condition.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* When to See a Doctor */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            When to Seek In-Person Medical Attention
          </h3>
          <ul className="space-y-2">
            {analysisResult.whenToSeeDoctor.map((reason, index) => (
              <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Self-Care Tips */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Supportive Care Strategies
          </h3>
          <ul className="space-y-2">
            {analysisResult.selfCareTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Start Over Button */}
        <button
          onClick={handleReset}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Check Other Symptoms
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Medical Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-amber-900 dark:text-amber-300 font-bold text-sm mb-0.5">Clinical Disclaimer</h3>
            <p className="text-amber-800/90 dark:text-amber-200/70 text-xs leading-relaxed">
              This triage algorithm provides informational guidance only and does not constitute a formal diagnosis.
              If you are experiencing severe symptoms like chest pressure or difficulty breathing, call local emergency services immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Navigation */}
      {currentStep > 1 && currentStep < 4 && (
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to previous step
        </button>
      )}

      {/* Content based on current step */}
      {currentStep === 1 && renderBodyAreaSelection()}
      {currentStep === 2 && renderSymptomDescription()}
      {currentStep === 3 && renderAnalyzing()}
      {currentStep === 4 && renderResults()}
    </div>
  );
}
