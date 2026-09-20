/**
 * MoodTracker Component
 * Hormonal mood and mental health tracker with PMDD/PMS pattern detection
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  BarChart,
  Bar,
} from 'recharts';
import {
  Heart,
  Brain,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  MoodLevel,
  CyclePhaseName,
  MoodPatternAnalysis,
  CyclePhaseInfo,
  DailyLog,
} from '@/types/hormonal';
import {
  getCurrentCyclePhase,
  saveDailyLog,
  analyzeMoodPatterns,
  generateMoodReport,
  getDailyLogs,
} from '@/services/hormonalHealthService';
import { format, subDays, parseISO } from 'date-fns';

// Mood emoji mapping
const moodEmojis: { level: MoodLevel; emoji: string; label: string; value: number }[] = [
  { level: 'great', emoji: '😄', label: 'Great', value: 5 },
  { level: 'good', emoji: '😊', label: 'Good', value: 4 },
  { level: 'neutral', emoji: '😐', label: 'Neutral', value: 3 },
  { level: 'bad', emoji: '😔', label: 'Bad', value: 2 },
  { level: 'terrible', emoji: '😢', label: 'Terrible', value: 1 },
];

// Phase colors
const phaseColors: Record<CyclePhaseName, { bg: string; text: string; border: string; fill: string }> = {
  menstrual: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30', fill: 'rgba(244, 63, 94, 0.15)' },
  follicular: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', fill: 'rgba(245, 158, 11, 0.15)' },
  ovulation: { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30', fill: 'rgba(20, 184, 166, 0.15)' },
  luteal: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30', fill: 'rgba(168, 85, 247, 0.15)' },
};

// Anxiety/Irritability color scale
const getScaleColor = (value: number): string => {
  if (value <= 1) return 'text-emerald-400';
  if (value === 2) return 'text-green-400';
  if (value === 3) return 'text-yellow-400';
  if (value === 4) return 'text-orange-400';
  return 'text-red-400';
};

const getScaleBg = (value: number): string => {
  if (value <= 1) return 'bg-emerald-500/20 border-emerald-500/30';
  if (value === 2) return 'bg-green-500/20 border-green-500/30';
  if (value === 3) return 'bg-yellow-500/20 border-yellow-500/30';
  if (value === 4) return 'bg-orange-500/20 border-orange-500/30';
  return 'bg-red-500/20 border-red-500/30';
};

const MoodTracker: React.FC = () => {
  const [phaseInfo, setPhaseInfo] = useState<CyclePhaseInfo | null>(null);
  const [moodAnalysis, setMoodAnalysis] = useState<MoodPatternAnalysis | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  
  // Form state
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [energy, setEnergy] = useState<number>(3);
  const [anxiety, setAnxiety] = useState<number>(1);
  const [irritability, setIrritability] = useState<number>(1);
  const [concentration, setConcentration] = useState<number>(3);
  const [depressiveFeeling, setDepressiveFeeling] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Report dialog
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Timeline scroll
  const [timelineOffset, setTimelineOffset] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const phase = getCurrentCyclePhase();
    setPhaseInfo(phase);
    setDailyLogs(getDailyLogs());
    setMoodAnalysis(analyzeMoodPatterns());
  };

  const handleSaveMood = async () => {
    if (!selectedMood || !phaseInfo) return;
    
    setIsSaving(true);
    const today = new Date().toISOString().split('T')[0];
    
    saveDailyLog({
      date: today,
      cycleDay: phaseInfo.cycleDay,
      phase: phaseInfo.phase,
      mood: selectedMood,
      energy,
      anxiety,
      irritability,
      concentration,
      depressiveFeeling,
      painLevel: 0,
      painLocations: [],
      skinCondition: 'none',
      bloating: 'none',
      sleepQuality: 3,
      libido: 3,
      notes: '',
    });
    
    // Refresh data
    loadData();
    
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    
    // Reset form partially
    setSelectedMood(null);
    setEnergy(3);
    setAnxiety(1);
    setIrritability(1);
    setConcentration(3);
    setDepressiveFeeling(1);
  };

  const handleGenerateReport = () => {
    const report = generateMoodReport();
    setReportContent(report);
    setShowReportDialog(true);
  };

  const handleCopyReport = async () => {
    await navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get last 30 days of mood entries for timeline
  const moodTimeline = useMemo(() => {
    const logs = dailyLogs.slice(0, 30);
    return logs.map(log => ({
      ...log,
      moodEmoji: moodEmojis.find(m => m.level === log.mood)?.emoji || '😐',
      dateFormatted: format(parseISO(log.date), 'MMM d'),
    }));
  }, [dailyLogs]);

  // Chart data with phase backgrounds
  const chartData = useMemo(() => {
    if (!moodAnalysis || !moodAnalysis.chartData.length) return [];
    return moodAnalysis.chartData;
  }, [moodAnalysis]);

  // Average mood by phase for bar chart
  const avgMoodByPhaseData = useMemo(() => {
    if (!moodAnalysis) return [];
    return [
      { phase: 'Menstrual', avg: moodAnalysis.averageMoodByPhase.menstrual, color: '#f43f5e' },
      { phase: 'Follicular', avg: moodAnalysis.averageMoodByPhase.follicular, color: '#f59e0b' },
      { phase: 'Ovulation', avg: moodAnalysis.averageMoodByPhase.ovulation, color: '#14b8a6' },
      { phase: 'Luteal', avg: moodAnalysis.averageMoodByPhase.luteal, color: '#a855f7' },
    ].filter(d => d.avg > 0);
  }, [moodAnalysis]);

  // Get unique phases in chart data for reference areas
  const phaseReferenceAreas = useMemo(() => {
    if (!chartData.length) return [];
    
    const areas: { phase: CyclePhaseName; start: number; end: number }[] = [];
    let currentPhase = chartData[0].phase;
    let start = chartData[0].cycleDay;
    
    chartData.forEach((d, i) => {
      if (d.phase !== currentPhase || i === chartData.length - 1) {
        areas.push({
          phase: currentPhase,
          start,
          end: i === chartData.length - 1 ? d.cycleDay : chartData[i - 1].cycleDay,
        });
        currentPhase = d.phase;
        start = d.cycleDay;
      }
    });
    
    return areas;
  }, [chartData]);

  const getPhaseColor = (phase: CyclePhaseName): string => phaseColors[phase].fill;

  const getPatternBadge = () => {
    if (!moodAnalysis) return null;
    
    switch (moodAnalysis.patternType) {
      case 'cyclical':
        return <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">Cyclical Pattern</Badge>;
      case 'persistent':
        return <Badge className="bg-red-500/20 text-red-300 border border-red-500/30">Persistent Pattern</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-300 border border-gray-500/30">Insufficient Data</Badge>;
    }
  };

  const getPMDDLikelihoodBadge = () => {
    if (!moodAnalysis) return null;
    
    switch (moodAnalysis.pmddLikelihood) {
      case 'high':
        return <Badge className="bg-red-500/20 text-red-300 border border-red-500/30">High PMDD Likelihood</Badge>;
      case 'moderate':
        return <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">Moderate PMDD Likelihood</Badge>;
      default:
        return <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Low PMDD Likelihood</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Crisis Helpline Notice */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <p className="text-red-200/80 text-sm">
          If you are experiencing suicidal thoughts, please contact a crisis helpline immediately.{' '}
          <span className="font-semibold">KIRAN Mental Health Helpline: 1800-599-0019</span>
        </p>
      </div>

      {/* Quick Daily Log */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            Quick Daily Mood Log
          </CardTitle>
          <p className="text-white/50 text-sm">Takes ~10 seconds to fill</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">How are you feeling today?</label>
            <div className="flex gap-2">
              {moodEmojis.map((mood) => (
                <button
                  key={mood.level}
                  onClick={() => setSelectedMood(mood.level)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                    ${selectedMood === mood.level
                      ? `${phaseColors[phaseInfo?.phase || 'follicular'].bg} ${phaseColors[phaseInfo?.phase || 'follicular'].border} border scale-110`
                      : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'
                    }
                  `}
                  title={mood.label}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className={`text-xs ${selectedMood === mood.level ? 'text-white' : 'text-white/50'}`}>
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Energy Level</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergy(level)}
                  className="p-2 rounded-lg transition-all hover:bg-white/[0.08]"
                >
                  <Zap
                    className={`w-6 h-6 transition-all ${
                      level <= energy ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-white/60 text-sm self-center">{energy}/5</span>
            </div>
          </div>

          {/* Anxiety Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Anxiety Level</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setAnxiety(level)}
                  className={`
                    w-10 h-10 rounded-lg font-medium transition-all
                    ${anxiety === level
                      ? getScaleBg(level) + ' border'
                      : 'bg-white/[0.04] border border-white/[0.06] text-white/60 hover:bg-white/[0.08]'
                    }
                    ${anxiety === level ? getScaleColor(level) : ''}
                  `}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Irritability Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Irritability Level</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setIrritability(level)}
                  className={`
                    w-10 h-10 rounded-lg font-medium transition-all
                    ${irritability === level
                      ? getScaleBg(level) + ' border'
                      : 'bg-white/[0.04] border border-white/[0.06] text-white/60 hover:bg-white/[0.08]'
                    }
                    ${irritability === level ? getScaleColor(level) : ''}
                  `}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Concentration Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Concentration</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setConcentration(level)}
                  className={`
                    w-10 h-10 rounded-lg font-medium transition-all flex items-center justify-center gap-0.5
                    ${concentration === level
                      ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                      : 'bg-white/[0.04] border border-white/[0.06] text-white/60 hover:bg-white/[0.08]'
                    }
                  `}
                >
                  <Brain className="w-4 h-4" />
                </button>
              ))}
              <span className="ml-2 text-white/60 text-sm self-center">{concentration}/5</span>
            </div>
          </div>

          {/* Depressive Feeling */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Depressive Feeling</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setDepressiveFeeling(level)}
                  className={`
                    w-10 h-10 rounded-lg font-medium transition-all
                    ${depressiveFeeling === level
                      ? getScaleBg(level) + ' border'
                      : 'bg-white/[0.04] border border-white/[0.06] text-white/60 hover:bg-white/[0.08]'
                    }
                    ${depressiveFeeling === level ? getScaleColor(level) : ''}
                  `}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSaveMood}
              disabled={!selectedMood || isSaving}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Today\'s Log'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mood History Timeline */}
      {moodTimeline.length > 0 && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" />
              Mood History (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-3 pb-4">
                  {moodTimeline.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex flex-col items-center gap-1 p-2 min-w-[60px] rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <div className={`w-3 h-3 rounded-full ${phaseColors[entry.phase].bg}`} />
                      <span className="text-xl">{entry.moodEmoji}</span>
                      <span className="text-xs text-white/50">{entry.dateFormatted}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cycle-Mapped Mood Chart */}
      {chartData.length > 0 && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Mood Patterns Across Your Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="cycleDay"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    label={{ value: 'Cycle Day', position: 'bottom', fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[1, 5]}
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  
                  {/* Phase background areas */}
                  {phaseReferenceAreas.map((area, index) => (
                    <ReferenceArea
                      key={index}
                      x1={area.start}
                      x2={area.end}
                      fill={getPhaseColor(area.phase)}
                      fillOpacity={0.3}
                    />
                  ))}
                  
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ fill: '#f43f5e', strokeWidth: 0, r: 3 }}
                    name="Mood"
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', strokeWidth: 0, r: 3 }}
                    name="Energy"
                  />
                  <Line
                    type="monotone"
                    dataKey="anxiety"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={{ fill: '#14b8a6', strokeWidth: 0, r: 3 }}
                    name="Anxiety"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-white/60 text-sm">Mood</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-white/60 text-sm">Energy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-white/60 text-sm">Anxiety</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-500/30" />
                <span className="text-white/40 text-xs">Menstrual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500/30" />
                <span className="text-white/40 text-xs">Follicular</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-teal-500/30" />
                <span className="text-white/40 text-xs">Ovulation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500/30" />
                <span className="text-white/40 text-xs">Luteal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern Analysis Card */}
      {moodAnalysis && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Pattern Analysis
              </span>
              <div className="flex gap-2">
                {getPatternBadge()}
                {getPMDDLikelihoodBadge()}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {moodAnalysis.patternType === 'insufficient_data' ? (
              <div className="text-center py-8">
                <div className="p-3 bg-white/[0.04] rounded-xl w-fit mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white/30" />
                </div>
                <p className="text-white/50">{moodAnalysis.description}</p>
              </div>
            ) : (
              <>
                {/* Description */}
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                  {moodAnalysis.patternType === 'cyclical' && moodAnalysis.lutealPhaseMoodDrop ? (
                    <p className="text-white/80 text-sm leading-relaxed">
                      Your mood patterns suggest possible <span className="text-amber-300 font-medium">PMS/PMDD</span>. 
                      Your low moods concentrate in the luteal phase and improve after menstruation begins.
                    </p>
                  ) : moodAnalysis.patternType === 'persistent' ? (
                    <p className="text-white/80 text-sm leading-relaxed">
                      Your mood patterns appear consistent throughout your cycle. 
                      Consider discussing with a <span className="text-teal-300 font-medium">mental health professional</span> if 
                      you're experiencing persistent low mood.
                    </p>
                  ) : (
                    <p className="text-white/80 text-sm leading-relaxed">{moodAnalysis.description}</p>
                  )}
                </div>

                {/* Average Mood by Phase Chart */}
                {avgMoodByPhaseData.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white/60 mb-3">Average Mood by Phase</h4>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={avgMoodByPhaseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis
                            dataKey="phase"
                            stroke="rgba(255,255,255,0.3)"
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                          />
                          <YAxis
                            domain={[0, 5]}
                            stroke="rgba(255,255,255,0.3)"
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="avg" fill="#a855f7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/[0.02] rounded-xl">
                    <p className="text-white/50 text-xs mb-1">Cycles Analyzed</p>
                    <p className="text-2xl font-bold text-white">{moodAnalysis.cyclesAnalyzed}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl">
                    <p className="text-white/50 text-xs mb-1">Luteal Phase Mood Drop</p>
                    <p className={`text-2xl font-bold ${moodAnalysis.lutealPhaseMoodDrop ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {moodAnalysis.lutealPhaseMoodDrop ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate Doctor Report */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] rounded-2xl">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-white font-medium flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Generate Doctor Report
              </h3>
              <p className="text-white/50 text-sm mt-1">
                Create a summary of your mood patterns to share with your healthcare provider
              </p>
            </div>
            <Button
              onClick={handleGenerateReport}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="bg-[#0a0a0f] border-white/[0.06] max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Mood Pattern Report
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Copy this report to share with your healthcare provider
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="mt-4 max-h-[50vh]">
            <pre className="text-white/80 text-sm whitespace-pre-wrap bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] font-mono">
              {reportContent}
            </pre>
          </ScrollArea>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleCopyReport}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowReportDialog(false)}
              variant="outline"
              className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MoodTracker;
