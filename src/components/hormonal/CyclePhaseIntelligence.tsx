/**
 * Cycle Phase Intelligence Component
 * Primary "home" tab of the hormonal health hub
 * Features cycle wheel visualization, daily briefing, 7-day forecast, and hormone charts
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import {
  Utensils,
  Dumbbell,
  Sparkles,
  Moon,
  Zap,
  Heart,
  Brain,
  Activity,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Info,
} from 'lucide-react';
import {
  getDailyBriefing,
  get7DayForecast,
  getPhaseRecommendations,
  estimateHormoneLevels,
  getCurrentCyclePhase,
} from '@/services/hormonalHealthService';
import { getCycleData } from '@/services/periodTrackerService';
import type {
  DailyBriefing,
  ForecastDay,
  PhaseRecommendation,
  CyclePhaseName,
  HormoneLevels,
} from '@/types/hormonal';
import { format, parseISO } from 'date-fns';

// Phase configuration with colors and labels
const PHASE_CONFIG: Record<
  CyclePhaseName,
  { color: string; bgColor: string; label: string; description: string }
> = {
  menstrual: {
    color: '#f43f5e',
    bgColor: 'bg-rose-500/20',
    label: 'Menstrual',
    description: 'Rest & Restore',
  },
  follicular: {
    color: '#f59e0b',
    bgColor: 'bg-amber-500/20',
    label: 'Follicular',
    description: 'Rise & Energize',
  },
  ovulation: {
    color: '#14b8a6',
    bgColor: 'bg-teal-500/20',
    label: 'Ovulation',
    description: 'Peak & Connect',
  },
  luteal: {
    color: '#a855f7',
    bgColor: 'bg-purple-500/20',
    label: 'Luteal',
    description: 'Reflect & Prepare',
  },
};

// Score bar colors
const getScoreColor = (score: number): string => {
  if (score >= 4) return '#10b981';
  if (score >= 3) return '#f59e0b';
  if (score >= 2) return '#f97316';
  return '#ef4444';
};

// Energy level icons mapping
const getEnergyIcon = (level: number) => {
  if (level >= 4) return '⚡';
  if (level >= 3) return '✨';
  if (level >= 2) return '🔸';
  return '💫';
};

// Mood emoji mapping
const getMoodEmoji = (level: number) => {
  if (level >= 4) return '😊';
  if (level >= 3) return '🙂';
  if (level >= 2) return '😐';
  return '😔';
};

const CyclePhaseIntelligence: React.FC = () => {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [recommendations, setRecommendations] = useState<PhaseRecommendation | null>(null);
  const [hasPeriodData, setHasPeriodData] = useState(true);
  const [cycleLength, setCycleLength] = useState(28);
  const [currentCycleDay, setCurrentCycleDay] = useState(1);
  const forecastScrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cycleData = getCycleData();

    if (cycleData.logs.length === 0) {
      setHasPeriodData(false);
      return;
    }

    setHasPeriodData(true);
    setCycleLength(cycleData.averageCycleLength || 28);

    // Load daily briefing
    const dailyBriefing = getDailyBriefing();
    setBriefing(dailyBriefing);
    setCurrentCycleDay(dailyBriefing.cycleDay);

    // Load 7-day forecast
    const forecastData = get7DayForecast();
    setForecast(forecastData);

    // Load phase recommendations
    const phaseRecs = getPhaseRecommendations(dailyBriefing.phase);
    setRecommendations(phaseRecs);
  };

  // Generate hormone chart data for full cycle
  const hormoneChartData = useMemo(() => {
    const data: Array<{
      day: number;
      estrogen: number;
      progesterone: number;
      lh: number;
      testosterone: number;
      phase: CyclePhaseName;
    }> = [];

    for (let day = 1; day <= cycleLength; day++) {
      const hormones = estimateHormoneLevels(day, cycleLength);

      // Determine phase for this day
      let phase: CyclePhaseName;
      const periodLength = 5;
      const ovulationDay = cycleLength - 14;

      if (day <= periodLength) {
        phase = 'menstrual';
      } else if (day <= ovulationDay - 2) {
        phase = 'follicular';
      } else if (day <= ovulationDay + 1) {
        phase = 'ovulation';
      } else {
        phase = 'luteal';
      }

      data.push({
        day,
        estrogen: hormones.estrogen,
        progesterone: hormones.progesterone,
        lh: hormones.lh,
        testosterone: hormones.testosterone,
        phase,
      });
    }

    return data;
  }, [cycleLength]);

  // Cycle wheel SVG calculation
  const cycleWheel = useMemo(() => {
    if (!briefing) return null;

    const size = 250;
    const center = size / 2;
    const radius = 100;
    const strokeWidth = 20;

    // Calculate phase boundaries
    const periodLength = 5;
    const ovulationDay = cycleLength - 14;
    const follicularEnd = ovulationDay - 2;
    const ovulationEnd = ovulationDay + 1;

    // Calculate arc paths for each phase
    const calculateArc = (
      startDay: number,
      endDay: number,
      color: string
    ): { path: string; color: string; startAngle: number; endAngle: number } => {
      const startAngle = ((startDay - 1) / cycleLength) * 360 - 90;
      const endAngle = (endDay / cycleLength) * 360 - 90;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArc = endAngle - startAngle > 180 ? 1 : 0;

      const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

      return { path, color, startAngle, endAngle };
    };

    const arcs = [
      calculateArc(1, periodLength, PHASE_CONFIG.menstrual.color),
      calculateArc(periodLength + 1, follicularEnd, PHASE_CONFIG.follicular.color),
      calculateArc(follicularEnd + 1, ovulationEnd, PHASE_CONFIG.ovulation.color),
      calculateArc(ovulationEnd + 1, cycleLength, PHASE_CONFIG.luteal.color),
    ];

    // Current day marker position
    const currentAngle = ((currentCycleDay - 1) / cycleLength) * 360 - 90;
    const currentRad = (currentAngle * Math.PI) / 180;
    const markerX = center + (radius + 15) * Math.cos(currentRad);
    const markerY = center + (radius + 15) * Math.sin(currentRad);

    return {
      arcs,
      marker: { x: markerX, y: markerY },
      phase: briefing.phase,
      cycleDay: currentCycleDay,
    };
  }, [briefing, cycleLength, currentCycleDay]);

  // Scroll forecast container
  const scrollForecast = (direction: 'left' | 'right') => {
    if (forecastScrollRef.current) {
      const scrollAmount = 160;
      forecastScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Empty state
  if (!hasPeriodData) {
    return (
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 sm:p-12 text-center">
        <div className="p-4 bg-rose-500/10 rounded-2xl w-fit mx-auto mb-6">
          <Calendar className="w-12 h-12 text-rose-400/60" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">
          No Period Data Logged Yet
        </h3>
        <p className="text-white/50 mb-6 max-w-md mx-auto">
          To get personalized cycle intelligence, please log your period in the
          "Period Log" tab first. We'll calculate your cycle phases and provide
          tailored insights.
        </p>
        <p className="text-sm text-white/40">
          💡 Tip: Log at least 2-3 cycles for more accurate predictions
        </p>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400"></div>
      </div>
    );
  }

  const phaseConfig = PHASE_CONFIG[briefing.phase];

  return (
    <div className="space-y-6">
      {/* Top Section: Cycle Wheel + Today's Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cycle Wheel Visualization */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
            <Activity className="w-4 h-4" />
            <span>Cycle Visualization</span>
          </div>

          <div className="flex justify-center">
            <svg width={250} height={250} viewBox="0 0 250 250">
              {/* Phase arcs */}
              {cycleWheel?.arcs.map((arc, idx) => (
                <path
                  key={idx}
                  d={arc.path}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={20}
                  strokeLinecap="round"
                  opacity={arc.color === phaseConfig.color ? 1 : 0.4}
                />
              ))}

              {/* Current day marker */}
              {cycleWheel && (
                <circle
                  cx={cycleWheel.marker.x}
                  cy={cycleWheel.marker.y}
                  r={8}
                  fill={phaseConfig.color}
                  stroke="white"
                  strokeWidth={2}
                  className="animate-pulse"
                />
              )}

              {/* Center text */}
              <text
                x={125}
                y={115}
                textAnchor="middle"
                className="fill-white text-lg font-semibold"
              >
                Day {currentCycleDay}
              </text>
              <text
                x={125}
                y={140}
                textAnchor="middle"
                className="fill-white/60 text-sm"
              >
                of {cycleLength} day cycle
              </text>
            </svg>
          </div>

          {/* Phase Legend */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {(Object.entries(PHASE_CONFIG) as [CyclePhaseName, typeof PHASE_CONFIG.menstrual][]).map(
              ([key, config]) => (
                <div
                  key={key}
                  className={`text-center p-2 rounded-lg ${
                    key === briefing.phase ? 'bg-white/[0.08]' : ''
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-xs text-white/60">{config.label}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Today's Briefing Card */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Info className="w-4 h-4" />
              <span>Today's Briefing</span>
            </div>
            <Badge
              className={`${phaseConfig.bgColor} border`}
              style={{ borderColor: `${phaseConfig.color}40` }}
            >
              <span style={{ color: phaseConfig.color }}>{phaseConfig.label}</span>
            </Badge>
          </div>

          {/* Phase description */}
          <h3 className="text-xl font-semibold text-white mb-2">
            {phaseConfig.description}
          </h3>

          {/* Hormonal summary */}
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            {briefing.hormonalSummary}
          </p>

          {/* Predicted Scores */}
          <div className="space-y-3 mb-6">
            {[
              { label: 'Energy', value: briefing.predictedEnergy, icon: Zap },
              { label: 'Mood', value: briefing.predictedMood, icon: Heart },
              { label: 'Focus', value: briefing.predictedFocus, icon: Brain },
              { label: 'Strength', value: briefing.predictedStrength, icon: Activity },
              { label: 'Libido', value: briefing.predictedLibido, icon: Sparkles },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-white/40" />
                <span className="text-sm text-white/60 w-20">{label}</span>
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(value / 5) * 100}%`,
                      backgroundColor: getScoreColor(value),
                    }}
                  />
                </div>
                <span className="text-sm text-white/80 w-6 text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Expected Symptoms */}
          {briefing.expectedSymptoms.length > 0 && (
            <div>
              <span className="text-sm text-white/50 block mb-2">Expected Symptoms</span>
              <div className="flex flex-wrap gap-1.5">
                {briefing.expectedSymptoms.slice(0, 6).map((symptom, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-white/[0.02] border-white/[0.1] text-white/60 text-xs"
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Calendar className="w-4 h-4" />
            <span>7-Day Forecast</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scrollForecast('left')}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollForecast('right')}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={forecastScrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          style={{ scrollbarWidth: 'thin' }}
        >
          {forecast.map((day, idx) => {
            const dayPhaseConfig = PHASE_CONFIG[day.phase];
            const isToday = idx === 0;
            const dayName = idx === 0 ? 'Today' : format(parseISO(day.date), 'EEE');
            const dateStr = format(parseISO(day.date), 'MMM d');

            return (
              <div
                key={day.date}
                className={`flex-shrink-0 w-32 p-3 rounded-xl border transition-colors ${
                  isToday
                    ? 'bg-white/[0.08] border-white/[0.15]'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <div className="text-center mb-2">
                  <span className="text-xs text-white/50">{dayName}</span>
                  <span className="text-xs text-white/30 mx-1">•</span>
                  <span className="text-xs text-white/40">{dateStr}</span>
                </div>

                <div className="flex justify-center mb-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: dayPhaseConfig.color }}
                  />
                </div>

                <div className="text-center text-xs text-white/40 mb-2">
                  Day {day.cycleDay}
                </div>

                <div className="flex justify-center gap-3 mb-2">
                  <div className="text-center">
                    <span className="text-sm">{getEnergyIcon(day.predictedEnergy)}</span>
                    <span className="text-xs text-white/60 ml-0.5">{day.predictedEnergy}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-sm">{getMoodEmoji(day.predictedMood)}</span>
                    <span className="text-xs text-white/60 ml-0.5">{day.predictedMood}</span>
                  </div>
                </div>

                {day.keyFlags.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {day.keyFlags.slice(0, 2).map((flag, flagIdx) => (
                      <Badge
                        key={flagIdx}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 bg-white/[0.04] border-white/[0.1] text-white/50"
                      >
                        {flag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase-Specific Recommendations */}
      {recommendations && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nutrition */}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Utensils className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="font-medium text-white">Nutrition</h4>
            </div>
            <ul className="space-y-2">
              {recommendations.nutrition.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="text-sm text-white/60 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Exercise */}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Dumbbell className="w-4 h-4 text-blue-400" />
              </div>
              <h4 className="font-medium text-white">Exercise</h4>
            </div>
            <ul className="space-y-2">
              {recommendations.exercise.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="text-sm text-white/60 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Skincare */}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Sparkles className="w-4 h-4 text-pink-400" />
              </div>
              <h4 className="font-medium text-white">Skincare</h4>
            </div>
            <ul className="space-y-2">
              {recommendations.skincare.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="text-sm text-white/60 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Rest */}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Moon className="w-4 h-4 text-indigo-400" />
              </div>
              <h4 className="font-medium text-white">Rest</h4>
            </div>
            <ul className="space-y-2">
              {recommendations.rest.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="text-sm text-white/60 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Hormone Level Chart */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-2 text-white/50 text-sm mb-6">
          <Activity className="w-4 h-4" />
          <span>Estimated Hormone Levels Across Cycle</span>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={hormoneChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="day"
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              interval={4}
            />
            <YAxis
              domain={[0, 100]}
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 10, 15, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
                color: '#fff',
              }}
              formatter={(value: number, name: string) => [
                `${Math.round(value)}%`,
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
              labelFormatter={(label) => `Day ${label}`}
            />
            <ReferenceLine
              x={currentCycleDay}
              stroke={phaseConfig.color}
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: 'You are here',
                position: 'top',
                fill: phaseConfig.color,
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="estrogen"
              stroke="#ec4899"
              fill="#ec4899"
              fillOpacity={0.15}
              name="Estrogen"
            />
            <Area
              type="monotone"
              dataKey="progesterone"
              stroke="#a855f7"
              fill="#a855f7"
              fillOpacity={0.15}
              name="Progesterone"
            />
            <Area
              type="monotone"
              dataKey="lh"
              stroke="#14b8a6"
              fill="#14b8a6"
              fillOpacity={0.15}
              name="LH"
            />
            <Area
              type="monotone"
              dataKey="testosterone"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.15}
              name="Testosterone"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Hormone Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {[
            { name: 'Estrogen', color: '#ec4899' },
            { name: 'Progesterone', color: '#a855f7' },
            { name: 'LH', color: '#14b8a6' },
            { name: 'Testosterone', color: '#f59e0b' },
          ].map(({ name, color }) => (
            <div key={name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-xs text-white/50">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
        <p className="text-xs text-white/40 text-center leading-relaxed">
          ⚠️ These predictions are based on general hormonal patterns and your logged data.
          They are not medical diagnoses. Consult a healthcare provider for medical advice.
        </p>
      </div>
    </div>
  );
};

export default CyclePhaseIntelligence;
