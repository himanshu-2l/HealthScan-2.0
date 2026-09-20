import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const allSymptoms = [
        ...selectedSymptoms,
        ...(symptomDescription ? [symptomDescription] : [])
      ].join(', ');

      const prompt = `You are a medical information assistant. Based on the following symptoms, provide a structured analysis. This is NOT a diagnosis - only general health information.

Body Area: ${selectedArea.name}
Symptoms: ${allSymptoms}
Duration: ${duration || 'Not specified'}
Severity: ${severity}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "possibleConditions": [
    {
      "name": "Condition name",
      "likelihood": "High" | "Medium" | "Low",
      "description": "Brief description of the condition"
    }
  ],
  "riskLevel": "Low" | "Moderate" | "High" | "Urgent",
  "whenToSeeDoctor": ["Reason 1", "Reason 2"],
  "selfCareTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Provide 2-4 possible conditions, 2-4 reasons to see a doctor, and 3-5 self-care tips. Be informative but always recommend consulting a healthcare professional.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean the response - remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      const parsed: AnalysisResult = JSON.parse(cleanedText);
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
      case 'Low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Moderate': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'High': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Urgent': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-white/60 bg-white/5 border-white/10';
    }
  };

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'High': return 'bg-teal-400/20 text-teal-300 border-teal-400/30';
      case 'Medium': return 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30';
      case 'Low': return 'bg-white/10 text-white/60 border-white/20';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              step === currentStep
                ? 'bg-teal-500 text-white scale-110'
                : step < currentStep
                ? 'bg-teal-500/30 text-teal-300'
                : 'bg-white/[0.06] text-white/40'
            }`}
          >
            {step < currentStep ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < 4 && (
            <div
              className={`w-12 h-0.5 transition-all duration-300 ${
                step < currentStep ? 'bg-teal-500/50' : 'bg-white/[0.06]'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Render Step 1: Body Area Selection
  const renderBodyAreaSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">Select Body Area</h2>
        <p className="text-white/60">Choose the area where you're experiencing symptoms</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bodyAreas.map((area) => {
          const Icon = area.icon;
          return (
            <button
              key={area.id}
              onClick={() => handleAreaSelect(area)}
              className="group bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 text-left hover:bg-white/[0.08] hover:border-teal-500/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">{area.name}</h3>
                  <p className="text-white/40 text-sm line-clamp-2">
                    {area.commonSymptoms.slice(0, 3).join(', ')}...
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-teal-400 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render Step 2: Symptom Description
  const renderSymptomDescription = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">Describe Your Symptoms</h2>
        <p className="text-white/60">
          Selected area: <span className="text-teal-400">{selectedArea?.name}</span>
        </p>
      </div>

      {/* Common symptoms for selected area */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <h3 className="text-white font-medium">Common symptoms in this area</h3>
        <div className="flex flex-wrap gap-2">
          {selectedArea?.commonSymptoms.map((symptom) => (
            <button
              key={symptom}
              onClick={() => handleSymptomToggle(symptom)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedSymptoms.includes(symptom)
                  ? 'bg-teal-500 text-white'
                  : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white'
              }`}
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>

      {/* Quick symptom chips */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <h3 className="text-white font-medium">Quick select common symptoms</h3>
        <div className="flex flex-wrap gap-2">
          {commonSymptomChips.map((symptom) => (
            <button
              key={symptom}
              onClick={() => handleSymptomToggle(symptom)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedSymptoms.includes(symptom)
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white'
              }`}
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>

      {/* Description textarea */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <h3 className="text-white font-medium">Describe in detail (optional)</h3>
        <div className="flex items-start gap-3">
          <textarea
            value={symptomDescription}
            onChange={(e) => setSymptomDescription(e.target.value)}
            placeholder="Describe your symptoms in more detail... When did they start? What makes them better or worse?"
            className="flex-1 h-32 bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-white placeholder-white/30 resize-none focus:outline-none focus:border-teal-500/50 transition-colors"
          />
          <VoiceInputButton
            onTranscript={(text) => setSymptomDescription(text)}
            placeholder="Describe symptoms"
            size="md"
          />
        </div>
      </div>

      {/* Duration */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-400" />
          <h3 className="text-white font-medium">Duration</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {durations.map((d) => (
            <button
              key={d.id}
              onClick={() => setDuration(d.value)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                duration === d.value
                  ? 'bg-teal-500 text-white'
                  : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-teal-400" />
          <h3 className="text-white font-medium">Severity</h3>
        </div>
        <div className="flex gap-3">
          {severityLevels.map((level) => (
            <button
              key={level}
              onClick={() => setSeverity(level)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                severity === level
                  ? level === 'Mild'
                    ? 'bg-green-500 text-white'
                    : level === 'Moderate'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                  : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!selectedSymptoms.length && !symptomDescription}
        className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-400 hover:to-cyan-400 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Stethoscope className="w-5 h-5" />
        Analyze Symptoms
      </button>
    </div>
  );

  // Render Step 3: Loading/Analyzing
  const renderAnalyzing = () => (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-teal-500/10 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-teal-500/30 animate-ping" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">Analyzing Symptoms</h2>
        <p className="text-white/60">Our AI is reviewing your symptoms...</p>
      </div>
    </div>
  );

  // Render Step 4: Results
  const renderResults = () => {
    if (!analysisResult) return null;

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-2">Analysis Results</h2>
          <p className="text-white/60">Based on your reported symptoms</p>
        </div>

        {/* Risk Level */}
        <div className={`bg-white/[0.04] backdrop-blur-sm border rounded-2xl p-6 ${getRiskLevelColor(analysisResult.riskLevel)}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${getRiskLevelColor(analysisResult.riskLevel)}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Overall Risk Level</p>
              <p className="text-xl font-semibold">{analysisResult.riskLevel}</p>
            </div>
          </div>
        </div>

        {/* Possible Conditions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-400" />
            Possible Conditions
          </h3>
          <div className="grid gap-4">
            {analysisResult.possibleConditions.map((condition, index) => (
              <div
                key={index}
                className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="text-white font-medium">{condition.name}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getLikelihoodColor(condition.likelihood)}`}>
                    {condition.likelihood} likelihood
                  </span>
                </div>
                <p className="text-white/60 text-sm">{condition.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* When to See a Doctor */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Phone className="w-5 h-5 text-teal-400" />
            When to See a Doctor
          </h3>
          <ul className="space-y-3">
            {analysisResult.whenToSeeDoctor.map((reason, index) => (
              <li key={index} className="flex items-start gap-3 text-white/60">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Self-Care Tips */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-400" />
            Self-Care Tips
          </h3>
          <ul className="space-y-3">
            {analysisResult.selfCareTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3 text-white/60">
                <Check className="w-5 h-5 text-teal-400 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Start Over Button */}
        <button
          onClick={handleReset}
          className="w-full py-4 bg-white/[0.06] text-white font-semibold rounded-xl hover:bg-white/[0.1] transition-all duration-300 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Check New Symptoms
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Medical Disclaimer */}
      <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-xl bg-amber-500/20">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-amber-300 font-semibold mb-1">Medical Disclaimer</h3>
            <p className="text-amber-200/70 text-sm">
              This is not a medical diagnosis. The information provided is for educational purposes only.
              Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.
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
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
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
