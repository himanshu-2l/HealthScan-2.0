/**
 * Smart Dose Recommendation Component
 * 3-step input flow for calculating insulin doses
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Utensils,
  Droplet,
  Calculator,
  AlertTriangle,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  RotateCcw,
  Mic,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import {
  calculateRecommendedDose,
  getCommonMealCarbs,
} from '@/services/doseRecommendationService';
import {
  logInsulinDose,
  checkStackingRisk,
} from '@/services/iobService';
import { DoseRecommendation, StackingWarning } from '@/types/health';

interface MealOption {
  name: string;
  carbs: number;
  nameHindi?: string;
}

interface SmartDoseRecommendationProps {
  className?: string;
  initialGlucose?: number;
  onDoseLogged?: () => void;
}

type Step = 1 | 2 | 3;

export const SmartDoseRecommendation: React.FC<SmartDoseRecommendationProps> = ({
  className,
  initialGlucose,
  onDoseLogged,
}) => {
  // Step state
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Input states
  const [glucose, setGlucose] = useState<string>(initialGlucose?.toString() || '');
  const [selectedMeals, setSelectedMeals] = useState<MealOption[]>([]);
  const [customCarbs, setCustomCarbs] = useState<string>('');

  // Result states
  const [recommendation, setRecommendation] = useState<DoseRecommendation | null>(null);
  const [stackingWarning, setStackingWarning] = useState<StackingWarning | null>(null);
  const [doseLogged, setDoseLogged] = useState(false);

  // Get common meals
  const commonMeals = useMemo(() => getCommonMealCarbs(), []);

  // Calculate total carbs
  const totalCarbs = useMemo(() => {
    const mealCarbs = selectedMeals.reduce((sum, meal) => sum + meal.carbs, 0);
    const custom = parseInt(customCarbs) || 0;
    return mealCarbs + custom;
  }, [selectedMeals, customCarbs]);

  // Voice input patterns for glucose
  const glucosePatterns = useMemo(() => [
    {
      name: 'glucose',
      pattern: /(\d{2,3})\s*(?:mg|mg\/dl|blood sugar|glucose)?/i,
      extract: (match: RegExpMatchArray) => ({ value: parseInt(match[1]), unit: 'mg/dL' }),
    },
  ], []);

  // Handle glucose voice input
  const handleGlucoseVoiceInput = useCallback((transcript: string) => {
    // Extract numbers from transcript
    const match = transcript.match(/(\d{2,3})/);
    if (match) {
      const value = parseInt(match[1]);
      if (value >= 40 && value <= 600) {
        setGlucose(value.toString());
      }
    }
  }, []);

  // Handle meal selection
  const toggleMeal = useCallback((meal: MealOption) => {
    setSelectedMeals(prev => {
      const exists = prev.find(m => m.name === meal.name);
      if (exists) {
        return prev.filter(m => m.name !== meal.name);
      }
      return [...prev, meal];
    });
  }, []);

  // Calculate recommendation
  const calculateDose = useCallback(() => {
    const glucoseValue = parseInt(glucose);
    if (isNaN(glucoseValue) || glucoseValue < 40 || glucoseValue > 600) {
      return;
    }

    const rec = calculateRecommendedDose(glucoseValue, totalCarbs);
    const stacking = checkStackingRisk(rec.finalDose, glucoseValue);

    setRecommendation(rec);
    setStackingWarning(stacking);
    setCurrentStep(3);
  }, [glucose, totalCarbs]);

  // Log dose
  const handleLogDose = useCallback(() => {
    if (!recommendation || recommendation.finalDose <= 0) return;

    logInsulinDose({
      units: recommendation.finalDose,
      type: 'rapid',
      insulinName: 'Rapid-acting',
      timestamp: new Date().toISOString(),
      notes: `Meal: ${totalCarbs}g carbs, Glucose: ${glucose} mg/dL`,
    });

    setDoseLogged(true);
    onDoseLogged?.();

    // Reset after 3 seconds
    setTimeout(() => {
      resetForm();
    }, 3000);
  }, [recommendation, totalCarbs, glucose, onDoseLogged]);

  // Reset form
  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setGlucose('');
    setSelectedMeals([]);
    setCustomCarbs('');
    setRecommendation(null);
    setStackingWarning(null);
    setDoseLogged(false);
  }, []);

  // Get step color
  const getStepColor = (step: Step) => {
    if (currentStep === step) return 'bg-primary text-primary-foreground';
    if (currentStep > step) return 'bg-emerald-500 text-white';
    return 'bg-muted text-muted-foreground';
  };

  // Get result card color based on risk
  const getResultColor = () => {
    if (!stackingWarning) return 'border-emerald-500/30 bg-emerald-500/5';
    if (stackingWarning.isAtRisk) return 'border-red-500/30 bg-red-500/5';
    if (stackingWarning.currentIOB > 0) return 'border-amber-500/30 bg-amber-500/5';
    return 'border-emerald-500/30 bg-emerald-500/5';
  };

  // Quick glucose presets
  const glucosePresets = [80, 120, 160, 200, 250];

  return (
    <Card className={cn('glass-card overflow-hidden', className)}>
      {/* Header with step indicators */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calculator className="w-5 h-5 text-primary" />
            Smart Dose Calculator
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetForm}
            className="h-8 px-2 text-muted-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                  getStepColor(step as Step)
                )}
              >
                {currentStep > step ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step
                )}
              </div>
              {index < 2 && (
                <div
                  className={cn(
                    'w-12 h-0.5 transition-all duration-300',
                    currentStep > step ? 'bg-emerald-500' : 'bg-muted'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <CardDescription className="text-center mt-2">
          {currentStep === 1 && 'Step 1: Enter your current blood sugar'}
          {currentStep === 2 && 'Step 2: Select what you are planning to eat'}
          {currentStep === 3 && 'Step 3: Review your recommended dose'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Glucose Input */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">What is your current blood sugar?</h3>
              <p className="text-sm text-muted-foreground">Enter your glucose reading in mg/dL</p>
            </div>

            {/* Glucose input with voice */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="e.g., 120"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  className="text-center text-2xl h-16 glass-input"
                  min={40}
                  max={600}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  mg/dL
                </span>
              </div>
              <VoiceInputButton
                onTranscript={handleGlucoseVoiceInput}
                patterns={glucosePatterns}
                placeholder="Say glucose"
                size="lg"
              />
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-5 gap-2">
              {glucosePresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setGlucose(preset.toString())}
                  className={cn(
                    'py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                    glucose === preset.toString()
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/5 hover:bg-white/10 text-foreground'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Glucose indicator */}
            {glucose && (
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className={cn(
                    'px-4 py-2 text-base',
                    parseInt(glucose) < 70 && 'border-red-500/50 bg-red-500/10 text-red-400',
                    parseInt(glucose) >= 70 && parseInt(glucose) <= 140 && 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
                    parseInt(glucose) > 140 && parseInt(glucose) <= 180 && 'border-amber-500/50 bg-amber-500/10 text-amber-400',
                    parseInt(glucose) > 180 && 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                  )}
                >
                  {parseInt(glucose) < 70 && 'Low'}
                  {parseInt(glucose) >= 70 && parseInt(glucose) <= 140 && 'In Range'}
                  {parseInt(glucose) > 140 && parseInt(glucose) <= 180 && 'Elevated'}
                  {parseInt(glucose) > 180 && 'High'}
                </Badge>
              </div>
            )}

            {/* Navigation */}
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!glucose || parseInt(glucose) < 40 || parseInt(glucose) > 600}
              className="w-full h-12"
            >
              Next: Add Meal
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Meal Selection */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2 flex items-center justify-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                What are you planning to eat?
              </h3>
              <p className="text-sm text-muted-foreground">Select all items you will consume</p>
            </div>

            {/* Total carbs display */}
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">Total Carbs</div>
              <div className="text-3xl font-bold text-primary">{totalCarbs}g</div>
            </div>

            {/* Custom carb input */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Custom carbs (g)"
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(e.target.value)}
                  className="glass-input"
                />
              </div>
              <span className="text-muted-foreground text-sm">grams</span>
            </div>

            {/* Meal grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
              {commonMeals.map((meal) => {
                const isSelected = selectedMeals.some(m => m.name === meal.name);
                return (
                  <button
                    key={meal.name}
                    onClick={() => toggleMeal(meal)}
                    className={cn(
                      'p-3 rounded-lg text-left transition-all duration-200 border',
                      isSelected
                        ? 'bg-primary/20 border-primary/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    )}
                  >
                    <div className="font-medium text-sm leading-tight">{meal.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {meal.nameHindi && <span className="block">{meal.nameHindi}</span>}
                      <span className="text-primary font-medium">{meal.carbs}g carbs</span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary absolute top-2 right-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected meals chips */}
            {selectedMeals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedMeals.map((meal) => (
                  <Badge
                    key={meal.name}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => toggleMeal(meal)}
                  >
                    {meal.name}
                    <Minus className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1 h-12"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={calculateDose}
                className="flex-1 h-12"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 3 && recommendation && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Main dose display */}
            <div className={cn('rounded-2xl p-6 border-2 text-center', getResultColor())}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Droplet className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Recommended Dose</span>
              </div>
              <div className="text-6xl font-bold text-foreground mb-2">
                {recommendation.finalDose.toFixed(1)}
              </div>
              <div className="text-lg text-muted-foreground">units</div>
            </div>

            {/* Breakdown */}
            <div className="glass-panel rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Calculation Breakdown</h4>

              <div className="flex justify-between items-center">
                <span className="text-sm">Meal dose ({totalCarbs}g ÷ ICR)</span>
                <span className="font-medium text-emerald-400">+{recommendation.mealDose.toFixed(1)}u</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Correction dose</span>
                <span className={cn(
                  'font-medium',
                  recommendation.correctionDose > 0 ? 'text-amber-400' : 'text-muted-foreground'
                )}>
                  {recommendation.correctionDose > 0 ? `+${recommendation.correctionDose.toFixed(1)}u` : '0u'}
                </span>
              </div>

              {recommendation.currentIOB > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active insulin (IOB)</span>
                  <span className="font-medium text-red-400">-{recommendation.currentIOB.toFixed(1)}u</span>
                </div>
              )}

              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Final dose</span>
                  <span className="font-bold text-xl text-primary">{recommendation.finalDose.toFixed(1)}u</span>
                </div>
              </div>
            </div>

            {/* Explanation card */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <p className="text-sm leading-relaxed">{recommendation.explanation}</p>
            </div>

            {/* Stacking warning */}
            {stackingWarning && stackingWarning.isAtRisk && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-400 mb-1">Stacking Warning</h4>
                  <p className="text-sm text-red-300/80">{stackingWarning.warningMessage}</p>
                </div>
              </div>
            )}

            {/* Safe max dose info */}
            {stackingWarning && stackingWarning.safeMaxDose > 0 && stackingWarning.safeMaxDose < recommendation.finalDose && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p className="text-sm text-amber-300">
                  Safe maximum additional dose: <strong>{stackingWarning.safeMaxDose.toFixed(1)} units</strong>
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleLogDose}
                disabled={doseLogged || recommendation.finalDose <= 0}
                className={cn(
                  'w-full h-14 text-lg font-medium transition-all duration-300',
                  doseLogged && 'bg-emerald-500 hover:bg-emerald-500'
                )}
              >
                {doseLogged ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Dose Logged!
                  </>
                ) : (
                  <>
                    <Droplet className="w-5 h-5 mr-2" />
                    Log {recommendation.finalDose.toFixed(1)} Units
                  </>
                )}
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 h-12"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Adjust Meal
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 h-12"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Calculation
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartDoseRecommendation;
