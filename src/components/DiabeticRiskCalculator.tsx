/**
 * Diabetic Risk Score Calculator Component
 * AI-powered risk assessment with heatmap visualization
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VoiceInputButton } from './ui/VoiceInputButton';
import { VoicePattern } from '../hooks/useVoiceInput';
import {
  Shield,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Scale,
  HeartPulse,
  Sparkles,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import {
  calculateDiabeticRisk,
  generateRiskHeatmap,
  RiskFactors,
  RiskAssessment,
  RiskHeatmapData,
} from '@/services/diabeticRiskService';
import { format } from 'date-fns';

export const DiabeticRiskCalculator: React.FC = () => {
  const [age, setAge] = useState<string>('');
  const [familyHistory, setFamilyHistory] = useState<'none' | 'parent' | 'sibling' | 'both'>('none');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very-active'>('moderate');
  const [mealHabits, setMealHabits] = useState<'regular' | 'irregular' | 'frequent-snacking' | 'skipping-meals'>('regular');
  const [systolicBP, setSystolicBP] = useState<string>('');
  const [diastolicBP, setDiastolicBP] = useState<string>('');
  const [fastingGlucose, setFastingGlucose] = useState<string>('');
  const [postMealGlucose, setPostMealGlucose] = useState<string>('');
  const [hba1c, setHba1c] = useState<string>('');

  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [heatmap, setHeatmap] = useState<RiskHeatmapData[]>([]);

  // Voice patterns for health metrics
  const healthVoicePatterns: VoicePattern[] = [
    {
      name: 'age',
      pattern: /(?:age|years\s*old)\s*(?:is\s*)?(\d{1,3})/i,
      extract: (m) => ({ value: m[1], unit: 'years' })
    },
    {
      name: 'weight',
      pattern: /(?:weight|weigh)\s*(?:is\s*)?(\d{2,3})/i,
      extract: (m) => ({ value: m[1], unit: 'kg' })
    },
    {
      name: 'height',
      pattern: /(?:height|tall)\s*(?:is\s*)?(\d{3})/i,
      extract: (m) => ({ value: m[1], unit: 'cm' })
    },
    {
      name: 'systolicBP',
      pattern: /(?:systolic|bp|blood\s*pressure)\s*(?:is\s*)?(\d{2,3})/i,
      extract: (m) => ({ value: m[1], unit: 'mmHg' })
    },
    {
      name: 'diastolicBP',
      pattern: /(?:diastolic)\s*(?:is\s*)?(\d{2,3})/i,
      extract: (m) => ({ value: m[1], unit: 'mmHg' })
    },
    {
      name: 'fastingGlucose',
      pattern: /(?:fasting|glucose|sugar)\s*(?:is\s*)?(\d{2,3})/i,
      extract: (m) => ({ value: m[1], unit: 'mg/dL' })
    },
    {
      name: 'hba1c',
      pattern: /(?:hba1c|a1c)\s*(?:is\s*)?(\d{1,2}(?:\.\d)?)/i,
      extract: (m) => ({ value: m[1], unit: '%' })
    }
  ];

  const calculateBMI = (): number => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    if (!weightNum || !heightNum || heightNum === 0) return 0;
    return weightNum / ((heightNum / 100) ** 2);
  };

  const handleCalculate = () => {
    const bmi = calculateBMI();
    if (!age || bmi === 0) {
      alert('Please enter age, weight, and height');
      return;
    }

    const factors: RiskFactors = {
      age: parseFloat(age),
      familyHistory,
      bmi,
      activityLevel,
      mealHabits,
      systolicBP: systolicBP ? parseFloat(systolicBP) : undefined,
      diastolicBP: diastolicBP ? parseFloat(diastolicBP) : undefined,
      fastingGlucose: fastingGlucose ? parseFloat(fastingGlucose) : undefined,
      postMealGlucose: postMealGlucose ? parseFloat(postMealGlucose) : undefined,
      hba1c: hba1c ? parseFloat(hba1c) : undefined,
    };

    const result = calculateDiabeticRisk(factors);
    setAssessment(result);

    const heatmapData = generateRiskHeatmap(result, 7);
    setHeatmap(heatmapData);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very-high': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'moderate': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  const getRiskBorder = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very-high': return 'border-red-500/30';
      case 'high': return 'border-orange-500/30';
      case 'moderate': return 'border-amber-500/30';
      default: return 'border-emerald-500/30';
    }
  };

  const getRiskTextColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very-high': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'moderate': return 'text-amber-400';
      default: return 'text-emerald-400';
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very-high': return 'Very High';
      case 'high': return 'High';
      case 'moderate': return 'Moderate';
      default: return 'Low';
    }
  };

  const bmi = calculateBMI();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <Shield className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">AI Diabetic Risk Calculator</h2>
          <p className="text-sm text-white/50">Assess your diabetes risk with AI-powered analysis</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-6">
        {/* Voice Input */}
        <div className="flex items-center justify-center gap-4 pb-6 border-b border-white/[0.06]">
          <span className="text-white/50 text-sm">Say your health metrics:</span>
          <VoiceInputButton
            patterns={healthVoicePatterns}
            onParsedResult={(result) => {
              switch (result.patternName) {
                case 'age':
                  setAge(String(result.value));
                  break;
                case 'weight':
                  setWeight(String(result.value));
                  break;
                case 'height':
                  setHeight(String(result.value));
                  break;
                case 'systolicBP':
                  setSystolicBP(String(result.value));
                  break;
                case 'diastolicBP':
                  setDiastolicBP(String(result.value));
                  break;
                case 'fastingGlucose':
                  setFastingGlucose(String(result.value));
                  break;
                case 'hba1c':
                  setHba1c(String(result.value));
                  break;
              }
            }}
            onTranscript={(text) => {
              // Fallback: extract numbers
              const numbers = text.match(/\d{1,3}(?:\.\d)?/g);
              if (numbers && numbers.length > 0) {
                if (text.toLowerCase().includes('age')) setAge(numbers[0]);
                else if (text.toLowerCase().includes('weight')) setWeight(numbers[0]);
                else if (text.toLowerCase().includes('height')) setHeight(numbers[0]);
                else if (text.toLowerCase().includes('systolic')) setSystolicBP(numbers[0]);
                else if (text.toLowerCase().includes('diastolic')) setDiastolicBP(numbers[0]);
                else if (text.toLowerCase().includes('glucose') || text.toLowerCase().includes('fasting')) setFastingGlucose(numbers[0]);
                else if (text.toLowerCase().includes('hba1c') || text.toLowerCase().includes('a1c')) setHba1c(numbers[0]);
              }
            }}
            placeholder="Say 'age 35'"
            size="md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Age *</label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="35"
              min="18"
              max="100"
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-emerald-500/50 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Family History *</label>
            <Select value={familyHistory} onValueChange={(v: any) => setFamilyHistory(v)}>
              <SelectTrigger className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="both">Both Parents/Siblings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Weight (kg) *</label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70"
              min="30"
              max="200"
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-emerald-500/50 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Height (cm) *</label>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="170"
              min="100"
              max="250"
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-emerald-500/50 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Activity Level *</label>
            <Select value={activityLevel} onValueChange={(v: any) => setActivityLevel(v)}>
              <SelectTrigger className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary</SelectItem>
                <SelectItem value="light">Light Activity</SelectItem>
                <SelectItem value="moderate">Moderate Activity</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="very-active">Very Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Meal Habits *</label>
            <Select value={mealHabits} onValueChange={(v: any) => setMealHabits(v)}>
              <SelectTrigger className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="irregular">Irregular</SelectItem>
                <SelectItem value="frequent-snacking">Frequent Snacking</SelectItem>
                <SelectItem value="skipping-meals">Skipping Meals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Optional Fields */}
        <div className="pt-4 border-t border-white/[0.06]">
          <p className="text-sm text-white/50 mb-4">Optional measurements for more accurate assessment</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Systolic BP (mmHg)</label>
              <Input
                type="number"
                value={systolicBP}
                onChange={(e) => setSystolicBP(e.target.value)}
                placeholder="120"
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-emerald-500/50 h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Diastolic BP (mmHg)</label>
              <Input
                type="number"
                value={diastolicBP}
                onChange={(e) => setDiastolicBP(e.target.value)}
                placeholder="80"
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-emerald-500/50 h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Fasting Glucose (mg/dL)</label>
              <Input
                type="number"
                value={fastingGlucose}
                onChange={(e) => setFastingGlucose(e.target.value)}
                placeholder="100"
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-emerald-500/50 h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Post-Meal Glucose (mg/dL)</label>
              <Input
                type="number"
                value={postMealGlucose}
                onChange={(e) => setPostMealGlucose(e.target.value)}
                placeholder="140"
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-emerald-500/50 h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">HbA1c (%)</label>
              <Input
                type="number"
                value={hba1c}
                onChange={(e) => setHba1c(e.target.value)}
                placeholder="5.7"
                step="0.1"
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-emerald-500/50 h-12"
              />
            </div>
          </div>
        </div>

        {/* BMI Display */}
        {bmi > 0 && (
          <div className="flex items-center gap-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <div className="p-2.5 bg-blue-500/10 rounded-lg">
              <Scale className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-sm text-white/60">Calculated BMI</span>
              <p className="text-2xl font-bold text-blue-400">{bmi.toFixed(1)}</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleCalculate}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 text-base"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Calculate Risk Score
        </Button>
      </div>

      {/* Risk Assessment Results */}
      {assessment && (
        <div className="space-y-6">
          {/* Risk Score Card */}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-medium text-white">Risk Assessment Results</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Main Score Display */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getRiskColor(assessment.riskCategory)}/20 border-4 ${getRiskBorder(assessment.riskCategory)}`}>
                      <span className="text-3xl font-bold text-white">{assessment.riskScore}</span>
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-white/40 bg-[#0a0a0f] px-2">/100</span>
                  </div>
                  <div>
                    <p className="text-sm text-white/50 mb-1">Risk Level</p>
                    <p className={`text-2xl font-bold ${getRiskTextColor(assessment.riskCategory)}`}>
                      {getRiskLabel(assessment.riskCategory)} Risk
                    </p>
                  </div>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
                  <p className="text-sm text-white/50 mb-1">Probability of Developing Diabetes</p>
                  <p className="text-4xl font-bold text-white">{assessment.riskPercentage}%</p>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="pt-6 border-t border-white/[0.06]">
                <h4 className="text-sm font-medium text-white/60 mb-4">Contributing Factors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assessment.factors.slice(0, 6).map((factor, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]"
                    >
                      <span className="text-sm text-white/80">{factor.factor}</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        factor.severity === 'high'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                          : factor.severity === 'moderate'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        +{factor.contribution} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations & Next Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recommendations */}
            <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="w-5 h-5 text-blue-400" />
                <h4 className="font-medium text-white">Recommendations</h4>
              </div>
              <ul className="space-y-3">
                {assessment.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-white/70">
                    <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h4 className="font-medium text-white">Next Steps</h4>
              </div>
              <ul className="space-y-3">
                {assessment.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-white/70">
                    <ArrowRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk Heatmap */}
          {heatmap.length > 0 && (
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
              <h4 className="text-lg font-medium text-white mb-6">7-Day Risk Heatmap</h4>
              <div className="grid grid-cols-7 gap-3">
                {heatmap.map((day, idx) => (
                  <div
                    key={idx}
                    className={`${getRiskColor(day.riskLevel)} rounded-xl p-4 text-center transition-transform hover:scale-105`}
                  >
                    <p className="text-xs font-medium text-white/80 mb-1">
                      {format(new Date(day.date), 'EEE')}
                    </p>
                    <p className="text-2xl font-bold text-white">{day.riskScore}</p>
                    <p className="text-xs text-white/70 mt-1">
                      {getRiskLabel(day.riskLevel)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiabeticRiskCalculator;
