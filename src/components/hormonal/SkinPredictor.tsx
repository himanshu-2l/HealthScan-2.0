/**
 * SkinPredictor Component
 * Hormonal skin and acne predictor with proactive skincare recommendations
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Sparkles,
  Calendar,
  AlertCircle,
  Droplets,
  Flower2,
  Sun,
  Moon,
  Leaf,
  Check,
  Save,
  ChevronRight,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  SeverityLevel,
  CyclePhaseName,
  SkinPrediction,
  CyclePhaseInfo,
  DailyLog,
  PhaseRecommendation,
} from '@/types/hormonal';
import {
  getCurrentCyclePhase,
  saveDailyLog,
  predictSkinCondition,
  getPhaseRecommendations,
  getDailyLogs,
} from '@/services/hormonalHealthService';
import { getCycleData } from '@/services/periodTrackerService';
import { format, addDays, parseISO } from 'date-fns';

// Phase colors
const phaseColors: Record<CyclePhaseName, { bg: string; text: string; border: string }> = {
  menstrual: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
  follicular: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  ovulation: { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30' },
  luteal: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
};

// Skin risk level colors
const skinRiskColors: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  clear: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', hex: '#10b981' },
  watch: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30', hex: '#eab308' },
  likely: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30', hex: '#f97316' },
  peak: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', hex: '#ef4444' },
};

// Acne locations
const acneLocations = [
  { id: 'jawline', label: 'Jawline' },
  { id: 'chin', label: 'Chin' },
  { id: 'forehead', label: 'Forehead' },
  { id: 'cheeks', label: 'Cheeks' },
  { id: 'nose', label: 'Nose' },
  { id: 'back', label: 'Back' },
];

// Acne types
const acneTypes = [
  { id: 'cystic', label: 'Cystic' },
  { id: 'whitehead', label: 'Whitehead' },
  { id: 'blackhead', label: 'Blackhead' },
  { id: 'hormonal', label: 'Hormonal' },
];

// Phase skincare routines
const phaseSkincareRoutines: Record<CyclePhaseName, {
  icon: React.ReactNode;
  title: string;
  description: string;
  tips: string[];
  ingredients: string[];
}> = {
  menstrual: {
    icon: <Droplets className="w-5 h-5 text-rose-400" />,
    title: 'Menstrual Phase',
    description: 'Gentle, hydrating care when skin is most sensitive',
    tips: [
      'Use a gentle, non-foaming cleanser to avoid stripping natural oils',
      'Apply hyaluronic acid serum while skin is damp to lock in moisture',
      'Use a rich, nourishing moisturizer with ceramides',
      'Avoid harsh actives like retinoids or strong AHAs',
      'Apply cooling gel masks to soothe any inflammation',
    ],
    ingredients: [
      'Hyaluronic Acid - Deep hydration',
      'Centella Asiatica - Calming repair',
      'Ceramides - Barrier support',
      'Aloe Vera - Soothing relief',
      'Squalane - Lightweight moisture',
    ],
  },
  follicular: {
    icon: <Flower2 className="w-5 h-5 text-amber-400" />,
    title: 'Follicular Phase',
    description: 'Light moisturizing, ideal time to introduce actives',
    tips: [
      'Your skin is more resilient now - introduce new products',
      'Incorporate vitamin C serum for brightening',
      'Use gentle exfoliation (AHAs/BHAs) 1-2x per week',
      'Lightweight moisturizers work well this phase',
      'Focus on prevention and skin strengthening',
    ],
    ingredients: [
      'Vitamin C - Brightening antioxidant',
      'Niacinamide - Pore refining',
      'Lactic Acid - Gentle exfoliation',
      'Peptides - Collagen support',
      'Green Tea Extract - Antioxidant protection',
    ],
  },
  ovulation: {
    icon: <Sun className="w-5 h-5 text-teal-400" />,
    title: 'Ovulation Phase',
    description: 'Oil control and breakout prevention focus',
    tips: [
      'Use salicylic acid cleanser to control oil production',
      'Apply niacinamide to regulate sebum',
      'Avoid heavy, occlusive products',
      'Use clay masks 1-2x per week for deep cleaning',
      'Keep spot treatments handy for emerging breakouts',
    ],
    ingredients: [
      'Salicylic Acid - Oil control & clearing',
      'Niacinamide - Sebum regulation',
      'Tea Tree Oil - Antimicrobial spot treatment',
      'Kaolin Clay - Oil absorption',
      'Zinc PCA - Anti-inflammatory',
    ],
  },
  luteal: {
    icon: <Moon className="w-5 h-5 text-purple-400" />,
    title: 'Luteal Phase',
    description: 'Anti-inflammatory care before hormonal changes',
    tips: [
      'Focus on anti-inflammatory ingredients',
      'Use niacinamide to prevent hormonal acne',
      'Gentle cleansing - avoid over-stripping',
      'Apply soothing masks to reduce inflammation',
      'Stay consistent with your routine - no new products',
    ],
    ingredients: [
      'Niacinamide - Anti-inflammatory',
      'Azelaic Acid - Hormonal acne fighter',
      'Benzoyl Peroxide - Acne treatment',
      'Centella Asiatica - Healing support',
      'Aloe Vera - Soothing relief',
    ],
  },
};

const SkinPredictor: React.FC = () => {
  const [phaseInfo, setPhaseInfo] = useState<CyclePhaseInfo | null>(null);
  const [skinPrediction, setSkinPrediction] = useState<SkinPrediction | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [cycleLength, setCycleLength] = useState(28);
  
  // Skin log form
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [severity, setSeverity] = useState<SeverityLevel>('none');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const phase = getCurrentCyclePhase();
    setPhaseInfo(phase);
    setSkinPrediction(predictSkinCondition());
    setDailyLogs(getDailyLogs());
    const cycleData = getCycleData();
    setCycleLength(cycleData.averageCycleLength || 28);
  };

  const toggleLocation = (locationId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(l => l !== locationId)
        : [...prev, locationId]
    );
  };

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const handleSaveSkinLog = () => {
    if (!phaseInfo) return;
    
    setIsSaving(true);
    const today = new Date().toISOString().split('T')[0];
    
    saveDailyLog({
      date: today,
      cycleDay: phaseInfo.cycleDay,
      phase: phaseInfo.phase,
      mood: 'neutral',
      energy: 3,
      anxiety: 1,
      irritability: 1,
      concentration: 3,
      depressiveFeeling: 1,
      painLevel: 0,
      painLocations: [],
      skinCondition: severity,
      bloating: 'none',
      sleepQuality: 3,
      libido: 3,
      notes: notes || `Skin: ${selectedLocations.join(', ')} - ${selectedTypes.join(', ')}`,
    });
    
    loadData();
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    
    // Reset form
    setSelectedLocations([]);
    setSeverity('none');
    setSelectedTypes([]);
    setNotes('');
  };

  // 7-day skin forecast
  const skinForecast = useMemo(() => {
    if (!phaseInfo || !skinPrediction) return [];
    
    const forecast = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      const forecastCycleDay = ((phaseInfo.cycleDay + i - 1) % cycleLength) + 1;
      
      // Determine risk level
      let riskLevel: 'clear' | 'watch' | 'likely' | 'peak';
      if (forecastCycleDay >= skinPrediction.breakoutWindowStart && forecastCycleDay <= skinPrediction.breakoutWindowEnd) {
        riskLevel = forecastCycleDay === skinPrediction.breakoutWindowStart + 1 ? 'peak' : 'likely';
      } else if (forecastCycleDay >= cycleLength - 7) {
        riskLevel = 'watch';
      } else if (forecastCycleDay <= 5) {
        riskLevel = 'clear';
      } else {
        riskLevel = 'watch';
      }
      
      forecast.push({
        date,
        dateFormatted: format(date, 'EEE, MMM d'),
        cycleDay: forecastCycleDay,
        riskLevel,
      });
    }
    return forecast;
  }, [phaseInfo, skinPrediction, cycleLength]);

  // Skin severity by phase for chart
  const skinByPhaseData = useMemo(() => {
    const phaseSeverity: Record<CyclePhaseName, { total: number; count: number }> = {
      menstrual: { total: 0, count: 0 },
      follicular: { total: 0, count: 0 },
      ovulation: { total: 0, count: 0 },
      luteal: { total: 0, count: 0 },
    };
    
    const severityScores: Record<SeverityLevel, number> = {
      none: 0,
      mild: 1,
      moderate: 2,
      severe: 3,
    };
    
    dailyLogs.forEach(log => {
      if (log.skinCondition && log.skinCondition !== 'none') {
        phaseSeverity[log.phase].total += severityScores[log.skinCondition];
        phaseSeverity[log.phase].count++;
      }
    });
    
    return [
      { phase: 'Menstrual', avg: phaseSeverity.menstrual.count > 0 ? phaseSeverity.menstrual.total / phaseSeverity.menstrual.count : 0, color: '#f43f5e' },
      { phase: 'Follicular', avg: phaseSeverity.follicular.count > 0 ? phaseSeverity.follicular.total / phaseSeverity.follicular.count : 0, color: '#f59e0b' },
      { phase: 'Ovulation', avg: phaseSeverity.ovulation.count > 0 ? phaseSeverity.ovulation.total / phaseSeverity.ovulation.count : 0, color: '#14b8a6' },
      { phase: 'Luteal', avg: phaseSeverity.luteal.count > 0 ? phaseSeverity.luteal.total / phaseSeverity.luteal.count : 0, color: '#a855f7' },
    ];
  }, [dailyLogs]);

  // Calculate days until breakout window
  const daysUntilBreakout = skinPrediction?.daysUntilBreakout ?? 0;

  return (
    <div className="space-y-6">
      {/* Breakout Forecast Card */}
      {skinPrediction && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <CardTitle className="text-white text-lg font-medium flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                  Breakout Forecast
                </CardTitle>
                <p className="text-white/50 text-sm">
                  Based on your current cycle day {skinPrediction.currentDay}
                </p>
              </div>
              <Badge className={`${skinRiskColors[daysUntilBreakout === 0 ? 'peak' : daysUntilBreakout <= 3 ? 'likely' : daysUntilBreakout <= 7 ? 'watch' : 'clear'].bg} ${skinRiskColors[daysUntilBreakout === 0 ? 'peak' : daysUntilBreakout <= 3 ? 'likely' : daysUntilBreakout <= 7 ? 'watch' : 'clear'].text} ${skinRiskColors[daysUntilBreakout === 0 ? 'peak' : daysUntilBreakout <= 3 ? 'likely' : daysUntilBreakout <= 7 ? 'watch' : 'clear'].border} border`}>
                {skinPrediction.predictedSeverity === 'none' ? 'Clear' : skinPrediction.predictedSeverity === 'mild' ? 'Mild Risk' : 'Moderate Risk'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Current Status */}
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <p className="text-white/50 text-xs mb-1">Current Status</p>
                <p className="text-xl font-semibold text-white">
                  {daysUntilBreakout === 0 ? (
                    <span className="text-red-400">In Breakout Window</span>
                  ) : daysUntilBreakout < 0 ? (
                    'Skin Clearing'
                  ) : (
                    `${daysUntilBreakout} days until breakout window`
                  )}
                </p>
              </div>
              
              {/* Breakout Window */}
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <p className="text-white/50 text-xs mb-1">Breakout Window</p>
                <p className="text-lg font-medium text-white">
                  Day {skinPrediction.breakoutWindowStart} - {skinPrediction.breakoutWindowEnd}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  Post-ovulation hormonal shift
                </p>
              </div>

              {/* Severity */}
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <p className="text-white/50 text-xs mb-1">Predicted Severity</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    skinPrediction.predictedSeverity === 'none' ? 'bg-emerald-500' :
                    skinPrediction.predictedSeverity === 'mild' ? 'bg-yellow-500' :
                    skinPrediction.predictedSeverity === 'moderate' ? 'bg-orange-500' :
                    'bg-red-500'
                  }`} />
                  <p className="text-lg font-medium text-white capitalize">
                    {skinPrediction.predictedSeverity === 'none' ? 'Clear Skin' : skinPrediction.predictedSeverity}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="mb-4">
              <p className="text-white/50 text-xs mb-2">Cycle Timeline</p>
              <div className="relative h-8 bg-white/[0.02] rounded-full overflow-hidden">
                {/* Phase segments */}
                <div className="absolute inset-0 flex">
                  <div className="h-full bg-rose-500/20" style={{ width: '18%' }} />
                  <div className="h-full bg-amber-500/20" style={{ width: '32%' }} />
                  <div className="h-full bg-teal-500/20" style={{ width: '11%' }} />
                  <div className="h-full bg-purple-500/20" style={{ width: '39%' }} />
                </div>
                
                {/* Breakout window highlight */}
                <div
                  className="absolute h-full bg-red-500/40"
                  style={{
                    left: `${((skinPrediction.breakoutWindowStart - 1) / cycleLength) * 100}%`,
                    width: `${((skinPrediction.breakoutWindowEnd - skinPrediction.breakoutWindowStart + 1) / cycleLength) * 100}%`,
                  }}
                />
                
                {/* Current day marker */}
                <div
                  className="absolute w-1 h-full bg-white shadow-lg shadow-white/50"
                  style={{ left: `${((skinPrediction.currentDay - 1) / cycleLength) * 100}%` }}
                />
              </div>
              
              {/* Legend */}
              <div className="flex justify-between mt-2 text-xs text-white/40">
                <span>Day 1</span>
                <span>Day {cycleLength}</span>
              </div>
            </div>

            {/* Proactive Steps */}
            <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-xl">
              <p className="text-teal-300 text-sm font-medium mb-2">Proactive Steps</p>
              <ul className="space-y-1">
                {skinPrediction.proactiveSteps.slice(0, 3).map((step, i) => (
                  <li key={i} className="text-white/60 text-sm flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* 7-Day Skin Forecast */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            7-Day Skin Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {skinForecast.map((day, index) => (
              <div
                key={index}
                className={`
                  flex-shrink-0 w-24 p-3 rounded-xl border transition-all
                  ${skinRiskColors[day.riskLevel].bg} ${skinRiskColors[day.riskLevel].border}
                  ${index === 0 ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0f]' : ''}
                `}
              >
                <p className="text-white/50 text-xs">{day.dateFormatted}</p>
                <p className="text-white/40 text-xs mt-0.5">Day {day.cycleDay}</p>
                <div className={`mt-2 text-sm font-medium ${skinRiskColors[day.riskLevel].text} capitalize`}>
                  {day.riskLevel === 'clear' ? 'Clear' :
                   day.riskLevel === 'watch' ? 'Watch' :
                   day.riskLevel === 'likely' ? 'Breakout Likely' : 'Peak Breakout'}
                </div>
                <div className="mt-2">
                  <div className={`w-full h-1 rounded-full ${
                    day.riskLevel === 'clear' ? 'bg-emerald-500' :
                    day.riskLevel === 'watch' ? 'bg-yellow-500' :
                    day.riskLevel === 'likely' ? 'bg-orange-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Phase Skincare Routine */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-400" />
            Phase Skincare Routine
          </CardTitle>
          <p className="text-white/50 text-sm">Tailored recommendations for each phase of your cycle</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={phaseInfo?.phase || 'menstrual'} className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-auto bg-white/[0.02] p-1 rounded-xl">
              {(['menstrual', 'follicular', 'ovulation', 'luteal'] as CyclePhaseName[]).map((phase) => (
                <TabsTrigger
                  key={phase}
                  value={phase}
                  className={`
                    data-[state=active]:${phaseColors[phase].bg}
                    data-[state=active]:${phaseColors[phase].text}
                    rounded-lg py-2 px-3 text-sm capitalize
                    transition-all
                  `}
                >
                  {phase}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {(['menstrual', 'follicular', 'ovulation', 'luteal'] as CyclePhaseName[]).map((phase) => (
              <TabsContent key={phase} value={phase} className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${phaseColors[phase].bg}`}>
                      {phaseSkincareRoutines[phase].icon}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{phaseSkincareRoutines[phase].title}</h3>
                      <p className="text-white/50 text-sm">{phaseSkincareRoutines[phase].description}</p>
                    </div>
                  </div>
                  
                  {/* Tips */}
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <h4 className="text-white/60 text-sm font-medium mb-3">Skincare Tips</h4>
                    <ul className="space-y-2">
                      {phaseSkincareRoutines[phase].tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                          <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Recommended Ingredients */}
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <h4 className="text-white/60 text-sm font-medium mb-3">Recommended Ingredients</h4>
                    <div className="flex flex-wrap gap-2">
                      {phaseSkincareRoutines[phase].ingredients.map((ingredient, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className={`${phaseColors[phase].bg} ${phaseColors[phase].text} ${phaseColors[phase].border} border text-xs`}
                        >
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Skin Log */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            Log Today's Skin Condition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Acne Locations */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/80">Acne Locations</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {acneLocations.map((location) => (
                <label
                  key={location.id}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all
                    ${selectedLocations.includes(location.id)
                      ? 'bg-rose-500/20 border border-rose-500/30'
                      : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05]'
                    }
                  `}
                >
                  <Checkbox
                    checked={selectedLocations.includes(location.id)}
                    onCheckedChange={() => toggleLocation(location.id)}
                    className="border-white/30 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                  />
                  <span className={`text-sm ${selectedLocations.includes(location.id) ? 'text-white' : 'text-white/60'}`}>
                    {location.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/80">Severity</label>
            <RadioGroup
              value={severity}
              onValueChange={(v) => setSeverity(v as SeverityLevel)}
              className="flex flex-wrap gap-2"
            >
              {(['none', 'mild', 'moderate', 'severe'] as SeverityLevel[]).map((level) => (
                <label
                  key={level}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all
                    ${severity === level
                      ? level === 'none' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' :
                        level === 'mild' ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300' :
                        level === 'moderate' ? 'bg-orange-500/20 border border-orange-500/30 text-orange-300' :
                        'bg-red-500/20 border border-red-500/30 text-red-300'
                      : 'bg-white/[0.02] border border-white/[0.06] text-white/60 hover:bg-white/[0.05]'
                    }
                  `}
                >
                  <RadioGroupItem value={level} className="sr-only" />
                  <span className="text-sm capitalize">{level}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Acne Types */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/80">Acne Type</label>
            <div className="flex flex-wrap gap-2">
              {acneTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  className={`
                    px-4 py-2 rounded-lg text-sm transition-all
                    ${selectedTypes.includes(type.id)
                      ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                      : 'bg-white/[0.02] border border-white/[0.06] text-white/60 hover:bg-white/[0.05]'
                    }
                  `}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about your skin..."
              rows={2}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-rose-500/50 resize-none"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveSkinLog}
            disabled={isSaving}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12"
          >
            {isSaving ? (
              'Saving...'
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Skin Log
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Skin vs Cycle Correlation */}
      {skinByPhaseData.some(d => d.avg > 0) && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Skin Severity by Cycle Phase
            </CardTitle>
            <p className="text-white/50 text-sm">See how your skin correlates with hormonal changes</p>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skinByPhaseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="phase"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 3]}
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    label={{ value: 'Avg Severity', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [value.toFixed(2), 'Avg Severity']}
                  />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {skinByPhaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-500" />
                <span className="text-white/60 text-sm">Menstrual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-white/60 text-sm">Follicular</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-teal-500" />
                <span className="text-white/60 text-sm">Ovulation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span className="text-white/60 text-sm">Luteal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for No Data */}
      {skinByPhaseData.every(d => d.avg === 0) && dailyLogs.length > 0 && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="p-3 bg-indigo-500/10 rounded-xl w-fit mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-indigo-400/60" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Log More Skin Data</h3>
              <p className="text-white/50 text-sm max-w-md mx-auto">
                Log your skin condition regularly to see how it correlates with your cycle phases. 
                After a few entries, you'll see a chart showing the hormonal connection.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SkinPredictor;
