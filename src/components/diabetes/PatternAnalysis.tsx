/**
 * Pattern Analysis Component
 * Displays weekly glucose summary, detected patterns, and risk heatmap
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { VoiceInputButton } from '../ui/VoiceInputButton';
import { VoicePattern } from '../../hooks/useVoiceInput';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Moon,
  Sunrise,
  Utensils,
  Zap,
  Target,
  BarChart3,
} from 'lucide-react';
import {
  generateWeeklySummary,
  identifyPatterns,
  GlucosePattern,
  WeeklySummary,
  HeatmapData,
  getPatternConfig,
} from '../../services/patternRecognitionService';
import { format, parseISO } from 'date-fns';

type PeriodOption = 7 | 14 | 30 | 90;

interface PatternIconProps {
  type: GlucosePattern['type'];
  className?: string;
}

const PatternIcon: React.FC<PatternIconProps> = ({ type, className = 'w-5 h-5' }) => {
  switch (type) {
    case 'post_meal_high':
      return <Utensils className={className} />;
    case 'overnight_low':
      return <Moon className={className} />;
    case 'dawn_phenomenon':
      return <Sunrise className={className} />;
    case 'exercise_drop':
      return <Activity className={className} />;
    case 'stress_spike':
      return <Zap className={className} />;
    case 'consistent_high':
      return <TrendingUp className={className} />;
    case 'consistent_low':
      return <TrendingDown className={className} />;
    default:
      return <Activity className={className} />;
  }
};

const getSeverityColor = (severity: GlucosePattern['severity']) => {
  switch (severity) {
    case 'mild':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'moderate':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'severe':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
};

const getTrendIcon = (trend: GlucosePattern['trend']) => {
  switch (trend) {
    case 'improving':
      return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    case 'worsening':
      return <TrendingUp className="w-4 h-4 text-red-400" />;
    case 'stable':
    default:
      return <Minus className="w-4 h-4 text-white/40" />;
  }
};

const getRiskColorClass = (riskLevel: HeatmapData['riskLevel']) => {
  switch (riskLevel) {
    case 'low':
      return 'bg-blue-500';
    case 'normal':
      return 'bg-emerald-500';
    case 'elevated':
      return 'bg-amber-500';
    case 'high':
      return 'bg-red-500';
    default:
      return 'bg-white/10';
  }
};

const getPatternTypeColor = (type: GlucosePattern['type']) => {
  switch (type) {
    case 'post_meal_high':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'overnight_low':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'dawn_phenomenon':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'exercise_drop':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'stress_spike':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    case 'consistent_high':
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'consistent_low':
      return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    default:
      return 'text-white/60 bg-white/5 border-white/10';
  }
};

// Voice patterns for glucose readings
const glucoseVoicePatterns: VoicePattern[] = [
  {
    name: 'glucose',
    pattern: /(?:glucose|sugar|blood\s*sugar)\s*(?:is\s*)?(\d{2,3})/i,
    extract: (m) => ({ value: parseInt(m[1]), unit: 'mg/dL' }),
  },
];

export const PatternAnalysis: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(7);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const periods: { value: PeriodOption; label: string }[] = [
    { value: 7, label: '7 Days' },
    { value: 14, label: '14 Days' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
  ];

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = () => {
    setIsLoading(true);
    // Small delay to show loading state
    setTimeout(() => {
      const data = generateWeeklySummary(selectedPeriod);
      setSummary(data);
      setIsLoading(false);
    }, 300);
  };

  // Pie chart data for time in range
  const timeInRangeData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'In Range', value: summary.timeInRange, color: '#10b981' },
      { name: 'Below Range', value: summary.timeBelowRange, color: '#3b82f6' },
      { name: 'Above Range', value: summary.timeAboveRange, color: '#f59e0b' },
    ];
  }, [summary]);

  const handleVoiceResult = (result: { patternName: string; value: number | string }) => {
    if (result.patternName === 'glucose') {
      // Could trigger a refresh or show a toast
      loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-20 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary || summary.totalReadings === 0) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <BarChart3 className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Pattern Analysis</h1>
                <p className="text-white/50 text-sm">Weekly glucose insights & trends</p>
              </div>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            {periods.map((period) => (
              <Button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                variant={selectedPeriod === period.value ? 'default' : 'outline'}
                className={`rounded-lg px-4 py-2 h-auto text-sm transition-all duration-200 ${
                  selectedPeriod === period.value
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-white/[0.04] text-white/60 border-white/[0.08] hover:bg-white/[0.08]'
                }`}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-12 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <Activity className="w-12 h-12 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Glucose Data Available
          </h3>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Start logging your glucose readings to see patterns, trends, and personalized insights.
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-white/50 text-sm">Log a reading with your voice:</span>
            <VoiceInputButton
              patterns={glucoseVoicePatterns}
              onParsedResult={handleVoiceResult}
              onTranscript={setVoiceTranscript}
              placeholder="Say 'glucose 120'"
              size="md"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <BarChart3 className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Pattern Analysis</h1>
              <p className="text-white/50 text-sm">
                {format(parseISO(summary.period.start), 'MMM d')} - {format(parseISO(summary.period.end), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Voice Input */}
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-sm hidden lg:block">Log reading:</span>
            <VoiceInputButton
              patterns={glucoseVoicePatterns}
              onParsedResult={handleVoiceResult}
              onTranscript={setVoiceTranscript}
              placeholder="Say 'glucose 120'"
              size="md"
            />
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1">
            {periods.map((period) => (
              <Button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                variant="ghost"
                className={`rounded-md px-3 py-1.5 h-auto text-sm transition-all duration-200 ${
                  selectedPeriod === period.value
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Glucose */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm font-medium">Average Glucose</span>
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{summary.averageGlucose}</span>
              <span className="text-white/40 text-sm mb-1">mg/dL</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {getTrendIcon(summary.overallTrend)}
              <span className={`text-sm ${
                summary.overallTrend === 'improving' ? 'text-emerald-400' :
                summary.overallTrend === 'worsening' ? 'text-red-400' : 'text-white/40'
              }`}>
                {summary.overallTrend.charAt(0).toUpperCase() + summary.overallTrend.slice(1)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Time in Range */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm font-medium">Time in Range</span>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{summary.timeInRange}%</span>
            </div>
            <div className="text-white/40 text-sm mt-2">
              Target: 70% (70-180 mg/dL)
            </div>
          </CardContent>
        </Card>

        {/* Total Readings */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm font-medium">Total Readings</span>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{summary.totalReadings}</span>
            </div>
            <div className="text-white/40 text-sm mt-2">
              ~{Math.round(summary.totalReadings / selectedPeriod)} per day
            </div>
          </CardContent>
        </Card>

        {/* Patterns Detected */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm font-medium">Patterns Found</span>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{summary.patterns.length}</span>
            </div>
            <div className="text-white/40 text-sm mt-2">
              {summary.patterns.filter(p => p.severity === 'severe').length} severe
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time in Range Chart & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Glucose Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeInRangeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {timeInRangeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-white/60 text-sm">In Range ({summary.timeInRange}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-white/60 text-sm">High ({summary.timeAboveRange}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-white/60 text-sm">Low ({summary.timeBelowRange}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.insights.slice(0, 5).map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <p className="text-white/80 text-sm leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detected Patterns */}
      {summary.patterns.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Detected Patterns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.patterns.map((pattern) => (
              <Card
                key={pattern.id}
                className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl hover:bg-white/[0.06] transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl border ${getPatternTypeColor(pattern.type)}`}>
                      <PatternIcon type={pattern.type} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-medium truncate">
                          {getPatternConfig(pattern.type).label}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border shrink-0 ${getSeverityColor(pattern.severity)}`}>
                          {pattern.severity}
                        </span>
                      </div>
                      <p className="text-white/60 text-sm mb-3">{pattern.description}</p>
                      <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {pattern.timeRange.start}:00 - {pattern.timeRange.end}:00
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {pattern.frequency} times
                        </span>
                        <span className="flex items-center gap-1">
                          {getTrendIcon(pattern.trend)}
                          {pattern.trend}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                        <p className="text-indigo-300/80 text-sm">{pattern.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Risk Heatmap */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            24-Hour Risk Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px]">
              {/* Hour labels */}
              <div className="flex mb-1">
                <div className="w-12" /> {/* Day label spacer */}
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center text-xs text-white/40"
                  >
                    {i % 3 === 0 ? i : ''}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              <div className="space-y-1">
                {summary.riskHeatmap.map((dayData, dayIndex) => (
                  <div key={dayIndex} className="flex items-center">
                    <div className="w-12 text-xs text-white/50 font-medium">
                      {dayData[0]?.day}
                    </div>
                    <div className="flex-1 flex gap-0.5">
                      {dayData.map((cell, hourIndex) => (
                        <div
                          key={hourIndex}
                          className={`flex-1 aspect-square rounded-sm ${
                            cell.readingCount === 0
                              ? 'bg-white/5'
                              : getRiskColorClass(cell.riskLevel)
                          } ${cell.readingCount > 0 ? 'opacity-80 hover:opacity-100' : ''}`}
                          title={
                            cell.readingCount === 0
                              ? `${cell.day} ${cell.hour}:00 - No data`
                              : `${cell.day} ${cell.hour}:00 - Avg: ${cell.avgGlucose} mg/dL (${cell.readingCount} readings)`
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  <span className="text-white/60 text-xs">Low (&lt;70)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500" />
                  <span className="text-white/60 text-xs">Normal (70-180)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500" />
                  <span className="text-white/60 text-xs">Elevated (180-250)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="text-white/60 text-xs">High (&gt;250)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-white/10" />
                  <span className="text-white/60 text-xs">No data</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatternAnalysis;
