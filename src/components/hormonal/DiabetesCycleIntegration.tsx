/**
 * Diabetes-Cycle Integration Component
 * Overlays menstrual cycle data with glucose readings to reveal hormonal impacts on blood sugar
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  getGlucoseCycleCorrelation,
  getGlucosePhaseAlert,
  getCurrentCyclePhase,
} from '@/services/hormonalHealthService';
import { getAllGlucoseReadings } from '@/services/glucoseService';
import { getCycleData } from '@/services/periodTrackerService';
import { CycleGlucoseCorrelation, CyclePhaseName } from '@/types/hormonal';

interface PhaseData {
  phase: CyclePhaseName;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  avgFasting: number;
  avgPostMeal: number;
  deviation: number;
  insulinResistanceRisk: 'normal' | 'elevated' | 'high';
  explanation: string;
  tip: string;
}

const DiabetesCycleIntegration: React.FC = () => {
  const navigate = useNavigate();
  const [correlationData, setCorrelationData] = useState<CycleGlucoseCorrelation[]>([]);
  const [hasGlucoseData, setHasGlucoseData] = useState(false);
  const [hasPeriodData, setHasPeriodData] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<CyclePhaseName>('follicular');
  const [cycleLength, setCycleLength] = useState(28);
  const [phaseAlert, setPhaseAlert] = useState<{ daysUntil: number; message: string } | null>(null);

  useEffect(() => {
    // Check for glucose data
    const glucoseReadings = getAllGlucoseReadings();
    setHasGlucoseData(glucoseReadings.length > 0);

    // Check for period data
    const cycleData = getCycleData();
    setHasPeriodData(cycleData.logs.length > 0);
    setCycleLength(cycleData.averageCycleLength || 28);

    // Get current phase info
    const phaseInfo = getCurrentCyclePhase();
    if (phaseInfo) {
      setCurrentPhase(phaseInfo.phase);
    }

    // Get phase alert
    const alert = getGlucosePhaseAlert();
    setPhaseAlert(alert);

    // Get correlation data if both data sources exist
    if (glucoseReadings.length > 0 && cycleData.logs.length > 0) {
      const correlations = getGlucoseCycleCorrelation();
      setCorrelationData(correlations);
    }
  }, []);

  // Calculate phase summaries
  const phaseSummaries: PhaseData[] = useMemo(() => {
    if (correlationData.length === 0) return [];

    const phases: CyclePhaseName[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];
    const phaseNames: Record<CyclePhaseName, string> = {
      menstrual: 'Menstrual',
      follicular: 'Follicular',
      ovulation: 'Ovulation',
      luteal: 'Luteal',
    };
    const phaseColors: Record<CyclePhaseName, { color: string; bgColor: string; borderColor: string }> = {
      menstrual: { color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20' },
      follicular: { color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
      ovulation: { color: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/20' },
      luteal: { color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
    };
    const phaseExplanations: Record<CyclePhaseName, string> = {
      menstrual: 'Low estrogen and progesterone. Insulin sensitivity typically normalizes.',
      follicular: 'Rising estrogen improves insulin sensitivity and glucose uptake.',
      ovulation: 'Hormone fluctuations may cause brief glucose instability.',
      luteal: 'Progesterone rises, increasing insulin resistance and blood sugar levels.',
    };
    const phaseTips: Record<CyclePhaseName, string> = {
      menstrual: 'Glucose tends to normalize. Good time for baseline readings.',
      follicular: 'Rising estrogen improves insulin sensitivity. You may need less insulin.',
      ovulation: 'Brief glucose fluctuation possible. Monitor around ovulation day.',
      luteal: 'Progesterone rise increases insulin resistance. Expect 20-40 mg/dL higher readings. Monitor more frequently, consider discussing temporary dose adjustment.',
    };

    // Calculate overall averages
    const allFasting = correlationData
      .filter(d => d.avgGlucoseFasting > 0)
      .map(d => d.avgGlucoseFasting);
    const allPostMeal = correlationData
      .filter(d => d.avgGlucosePostMeal > 0)
      .map(d => d.avgGlucosePostMeal);
    const overallAvgFasting = allFasting.length > 0
      ? allFasting.reduce((a, b) => a + b, 0) / allFasting.length
      : 0;
    const overallAvgPostMeal = allPostMeal.length > 0
      ? allPostMeal.reduce((a, b) => a + b, 0) / allPostMeal.length
      : 0;

    return phases.map(phase => {
      const phaseData = correlationData.filter(d => d.phase === phase);
      const fastingValues = phaseData
        .filter(d => d.avgGlucoseFasting > 0)
        .map(d => d.avgGlucoseFasting);
      const postMealValues = phaseData
        .filter(d => d.avgGlucosePostMeal > 0)
        .map(d => d.avgGlucosePostMeal);

      const avgFasting = fastingValues.length > 0
        ? Math.round(fastingValues.reduce((a, b) => a + b, 0) / fastingValues.length)
        : 0;
      const avgPostMeal = postMealValues.length > 0
        ? Math.round(postMealValues.reduce((a, b) => a + b, 0) / postMealValues.length)
        : 0;

      const fastingDeviation = avgFasting > 0 ? avgFasting - overallAvgFasting : 0;
      const postMealDeviation = avgPostMeal > 0 ? avgPostMeal - overallAvgPostMeal : 0;
      const avgDeviation = (fastingDeviation + postMealDeviation) / 2;

      // Determine insulin resistance risk
      let insulinResistanceRisk: 'normal' | 'elevated' | 'high' = 'normal';
      if (phase === 'luteal') {
        if (avgFasting > 126 || avgPostMeal > 200) {
          insulinResistanceRisk = 'high';
        } else if (avgFasting > 110 || avgPostMeal > 160) {
          insulinResistanceRisk = 'elevated';
        }
      }

      return {
        phase,
        name: phaseNames[phase],
        ...phaseColors[phase],
        avgFasting,
        avgPostMeal,
        deviation: Math.round(avgDeviation * 10) / 10,
        insulinResistanceRisk,
        explanation: phaseExplanations[phase],
        tip: phaseTips[phase],
      };
    });
  }, [correlationData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (correlationData.length === 0) return [];

    // Group data by phase for visualization
    const grouped = correlationData.reduce((acc, item) => {
      const key = `${item.phase}-${Math.floor((item.cycleDay - 1) / 3) * 3 + 1}`;
      if (!acc[key]) {
        acc[key] = {
          cycleDay: item.cycleDay,
          phase: item.phase,
          fastingValues: [],
          postMealValues: [],
        };
      }
      acc[key].fastingValues.push(item.avgGlucoseFasting);
      acc[key].postMealValues.push(item.avgGlucosePostMeal);
      return acc;
    }, {} as Record<string, { cycleDay: number; phase: CyclePhaseName; fastingValues: number[]; postMealValues: number[] }>);

    return Object.values(grouped).map(group => ({
      cycleDay: group.cycleDay,
      phase: group.phase,
      avgFasting: group.fastingValues.length > 0
        ? Math.round(group.fastingValues.reduce((a, b) => a + b, 0) / group.fastingValues.length)
        : 0,
      avgPostMeal: group.postMealValues.length > 0
        ? Math.round(group.postMealValues.reduce((a, b) => a + b, 0) / group.postMealValues.length)
        : 0,
    })).sort((a, b) => a.cycleDay - b.cycleDay);
  }, [correlationData]);

  // Calculate phase boundaries for reference areas
  const phaseBoundaries = useMemo(() => {
    const periodLength = 5;
    const ovulationDay = cycleLength - 14;
    return {
      menstrual: { start: 1, end: periodLength },
      follicular: { start: periodLength + 1, end: ovulationDay - 2 },
      ovulation: { start: ovulationDay - 1, end: ovulationDay + 1 },
      luteal: { start: ovulationDay + 2, end: cycleLength },
    };
  }, [cycleLength]);

  // Empty state - no period data
  if (!hasPeriodData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">Cycle-Glucose Integration</h2>
            <p className="text-xs sm:text-sm text-white/50">Track how your cycle affects blood sugar</p>
          </div>
        </div>

        <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06]">
          <CardContent className="p-8 text-center">
            <div className="p-4 bg-amber-500/10 rounded-2xl w-fit mx-auto mb-6">
              <Calendar className="w-12 h-12 text-amber-400/60" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Log Your Period Data First</h3>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              Log your period data first to see cycle-glucose correlations and understand how your menstrual cycle affects your blood sugar levels.
            </p>
            <Button
              onClick={() => navigate('/period-tracker')}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3 h-auto"
            >
              Go to Period Tracker
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state - no glucose data
  if (!hasGlucoseData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Droplets className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">Cycle-Glucose Integration</h2>
            <p className="text-xs sm:text-sm text-white/50">Track how your cycle affects blood sugar</p>
          </div>
        </div>

        <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06]">
          <CardContent className="p-8 text-center">
            <div className="p-4 bg-emerald-500/10 rounded-2xl w-fit mx-auto mb-6">
              <Droplets className="w-12 h-12 text-emerald-400/60" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Glucose Data Found</h3>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              Start tracking your blood sugar in the Diabetes Management section to see how your cycle affects your glucose levels.
            </p>
            <Button
              onClick={() => navigate('/diabetes')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-3 h-auto"
            >
              Go to Diabetes Management
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">Cycle-Glucose Integration</h2>
            <p className="text-xs sm:text-sm text-white/50">How your menstrual cycle affects blood sugar</p>
          </div>
        </div>
      </div>

      {/* Phase Alert Card */}
      {phaseAlert ? (
        <Card className="bg-amber-500/10 border-amber-500/20 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-500/20 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-amber-200 mb-1">
                  {phaseAlert.daysUntil === 0
                    ? 'Currently in High Glucose Risk Phase'
                    : `Glucose Alert: ${phaseAlert.daysUntil} day${phaseAlert.daysUntil === 1 ? '' : 's'} until late luteal phase`}
                </h3>
                <p className="text-sm text-amber-100/70">
                  {phaseAlert.daysUntil === 0
                    ? 'You are currently in the late luteal phase when insulin resistance may be elevated. Based on your last cycles, your blood sugar typically runs higher during this phase. Monitor more frequently and discuss temporary dose adjustments with your doctor.'
                    : phaseAlert.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-emerald-500/10 border-emerald-500/20 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-500/20 rounded-xl shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-emerald-200 mb-1">
                  All Clear - Current Phase: {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
                </h3>
                <p className="text-sm text-emerald-100/70">
                  No glucose impact predicted soon. Your current cycle phase typically has stable insulin sensitivity. Continue your regular monitoring routine.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Glucose-Cycle Overlay Chart */}
      {chartData.length > 0 && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Glucose Levels Across Your Cycle
            </CardTitle>
            <CardDescription className="text-white/50">
              Average fasting and post-meal glucose by cycle day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="cycleDay"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    label={{ value: 'Cycle Day', position: 'insideBottom', offset: -10, fill: 'rgba(255,255,255,0.5)' }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    label={{ value: 'Glucose (mg/dL)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 10, 15, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      color: '#fff',
                    }}
                  />
                  <Legend />

                  {/* Phase background areas */}
                  <ReferenceArea
                    x1={phaseBoundaries.menstrual.start}
                    x2={phaseBoundaries.menstrual.end}
                    fill="#f43f55"
                    fillOpacity={0.08}
                  />
                  <ReferenceArea
                    x1={phaseBoundaries.follicular.start}
                    x2={phaseBoundaries.follicular.end}
                    fill="#f59e0b"
                    fillOpacity={0.08}
                  />
                  <ReferenceArea
                    x1={phaseBoundaries.ovulation.start}
                    x2={phaseBoundaries.ovulation.end}
                    fill="#14b8a6"
                    fillOpacity={0.08}
                  />
                  <ReferenceArea
                    x1={phaseBoundaries.luteal.start}
                    x2={phaseBoundaries.luteal.end}
                    fill="#a855f7"
                    fillOpacity={0.08}
                  />

                  {/* Normal glucose range reference */}
                  <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Normal Fasting Max', fill: '#10b981', fontSize: 10 }} />
                  <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Normal Fasting Min', fill: '#10b981', fontSize: 10 }} />

                  {/* Data */}
                  <Bar
                    dataKey="avgFasting"
                    name="Avg Fasting Glucose"
                    fill="#3b82f6"
                    fillOpacity={0.7}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgPostMeal"
                    name="Avg Post-Meal Glucose"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#f59e0b' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Phase Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-500/30" />
                <span className="text-xs text-white/60">Menstrual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500/30" />
                <span className="text-xs text-white/60">Follicular</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-teal-500/30" />
                <span className="text-xs text-white/60">Ovulation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500/30" />
                <span className="text-xs text-white/60">Luteal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase Impact Summary */}
      {phaseSummaries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {phaseSummaries.map((phase) => (
            <Card
              key={phase.phase}
              className={`${phase.bgColor} ${phase.borderColor} backdrop-blur-sm border`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-base font-semibold ${phase.color}`}>
                    {phase.name}
                  </CardTitle>
                  {phase.insulinResistanceRisk !== 'normal' && (
                    <Badge
                      variant={phase.insulinResistanceRisk === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {phase.insulinResistanceRisk === 'high' ? 'High Risk' : 'Elevated'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fasting Glucose */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Avg Fasting</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">
                      {phase.avgFasting > 0 ? phase.avgFasting : '--'}
                    </span>
                    {phase.avgFasting > 0 && <span className="text-xs text-white/40">mg/dL</span>}
                  </div>
                </div>

                {/* Post-Meal Glucose */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Avg Post-Meal</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">
                      {phase.avgPostMeal > 0 ? phase.avgPostMeal : '--'}
                    </span>
                    {phase.avgPostMeal > 0 && <span className="text-xs text-white/40">mg/dL</span>}
                  </div>
                </div>

                {/* Deviation */}
                {phase.deviation !== 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <span className="text-sm text-white/60">vs Overall Avg</span>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      phase.deviation > 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {phase.deviation > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {phase.deviation > 0 ? '+' : ''}{phase.deviation} mg/dL
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <p className="text-xs text-white/50 pt-2">{phase.explanation}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Phase-Specific Diabetes Tips */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Phase-Specific Diabetes Tips
          </CardTitle>
          <CardDescription className="text-white/50">
            Practical guidance for managing blood sugar throughout your cycle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phaseSummaries.map((phase) => (
              <div
                key={phase.phase}
                className={`p-4 rounded-xl ${phase.bgColor} ${phase.borderColor} border`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${phase.color.replace('text-', 'bg-')}`} />
                  <h4 className={`font-medium ${phase.color}`}>{phase.name} Phase</h4>
                </div>
                <p className="text-sm text-white/70">{phase.tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medical Disclaimer */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-100/70">
          <strong className="text-blue-200">Medical Disclaimer:</strong> Blood sugar variations across your cycle are normal. 
          Always consult your healthcare provider before adjusting insulin doses or diabetes medication. 
          This tool is for informational purposes only and does not replace professional medical advice.
        </p>
      </div>
    </div>
  );
};

export default DiabetesCycleIntegration;
