/**
 * Smart Blood Glucose Log + Prediction Component
 * AI-based glucose trend predictor with explainable insights
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VoiceInputButton } from './ui/VoiceInputButton';
import type { VoicePattern } from '../hooks/useVoiceInput';
import {
  Droplet,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Brain,
  X,
  Lightbulb,
  Activity,
  Target,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  saveGlucoseReading,
  getAllGlucoseReadings,
  getGlucoseReadingsForPeriod,
  calculateGlucoseStats,
  getGlucoseCategory,
  predictGlucoseTrend,
  generateGlucoseInsights,
  deleteGlucoseReading,
  GlucoseReading,
  GlucosePrediction,
  GlucoseInsight,
  GlucoseStats,
} from '@/services/glucoseService';
import { format, parseISO } from 'date-fns';

export const GlucoseTracker: React.FC = () => {
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [fasting, setFasting] = useState<string>('');
  const [postMeal, setPostMeal] = useState<string>('');
  const [hba1c, setHba1c] = useState<string>('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [stats, setStats] = useState<GlucoseStats | null>(null);
  const [predictions, setPredictions] = useState<GlucosePrediction[]>([]);
  const [insights, setInsights] = useState<GlucoseInsight[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Voice patterns for glucose readings
  const glucoseVoicePatterns: VoicePattern[] = [
    {
      name: 'fasting',
      pattern: /(?:fasting|glucose|sugar)\s*(?:is\s*)?(\d{2,3})/i,
      extract: (m) => ({ value: parseInt(m[1]), unit: 'mg/dL' })
    },
    {
      name: 'postMeal',
      pattern: /(?:post.?meal|after\s*meal)\s*(?:is\s*)?(\d{2,3})/i,
      extract: (m) => ({ value: parseInt(m[1]), unit: 'mg/dL' })
    },
    {
      name: 'hba1c',
      pattern: /(?:hba1c|a1c)\s*(?:is\s*)?(\d{1,2}(?:\.\d)?)/i,
      extract: (m) => ({ value: parseFloat(m[1]), unit: '%' })
    }
  ];

  useEffect(() => {
    loadReadings();
  }, []);

  useEffect(() => {
    if (readings.length > 0) {
      const periodReadings = getGlucoseReadingsForPeriod(selectedPeriod);
      const periodStats = calculateGlucoseStats(periodReadings);
      setStats(periodStats);

      // Generate predictions
      const preds = predictGlucoseTrend(readings);
      setPredictions(preds);

      // Generate insights
      const ins = generateGlucoseInsights(readings, preds);
      setInsights(ins);
    } else {
      setStats(null);
      setPredictions([]);
      setInsights([]);
    }
  }, [readings, selectedPeriod]);

  const loadReadings = () => {
    const allReadings = getAllGlucoseReadings();
    setReadings(allReadings);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fastingNum = fasting ? parseFloat(fasting) : undefined;
    const postMealNum = postMeal ? parseFloat(postMeal) : undefined;
    const hba1cNum = hba1c ? parseFloat(hba1c) : undefined;

    if (!fastingNum && !postMealNum && !hba1cNum) {
      alert('Please enter at least one value (Fasting, Post-Meal, or HbA1c)');
      return;
    }

    if (fastingNum && (fastingNum < 50 || fastingNum > 500)) {
      alert('Please enter valid fasting glucose (50-500 mg/dL)');
      return;
    }

    if (postMealNum && (postMealNum < 50 || postMealNum > 500)) {
      alert('Please enter valid post-meal glucose (50-500 mg/dL)');
      return;
    }

    if (hba1cNum && (hba1cNum < 3 || hba1cNum > 15)) {
      alert('Please enter valid HbA1c (3-15%)');
      return;
    }

    try {
      const newReading = saveGlucoseReading({
        fasting: fastingNum,
        postMeal: postMealNum,
        hba1c: hba1cNum,
        mealType,
        timestamp: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });

      setReadings([newReading, ...readings]);
      setFasting('');
      setPostMeal('');
      setHba1c('');
      setMealType(undefined);
      setNotes('');
      setShowForm(false);
    } catch (error) {
      console.error('Error saving glucose reading:', error);
      alert('Failed to save glucose reading');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this reading?')) {
      if (deleteGlucoseReading(id)) {
        setReadings(readings.filter(r => r.id !== id));
      }
    }
  };

  const prepareChartData = () => {
    const periodReadings = getGlucoseReadingsForPeriod(selectedPeriod);
    const chartData: Array<{
      date: string;
      fasting: number | null;
      postMeal: number | null;
      predictedFasting: number | null;
      predictedPostMeal: number | null;
    }> = [];

    // Add historical data
    periodReadings.forEach(reading => {
      const dateKey = format(parseISO(reading.date), 'MMM dd');
      chartData.push({
        date: dateKey,
        fasting: reading.fasting || null,
        postMeal: reading.postMeal || null,
        predictedFasting: null,
        predictedPostMeal: null,
      });
    });

    // Add predictions
    predictions.forEach(pred => {
      const dateKey = format(parseISO(pred.date), 'MMM dd');
      chartData.push({
        date: dateKey,
        fasting: null,
        postMeal: null,
        predictedFasting: pred.predictedFasting,
        predictedPostMeal: pred.predictedPostMeal,
      });
    });

    // Sort by date
    return chartData.sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const chartData = prepareChartData();
  const lastReading = readings[0];
  const lastCategory = lastReading
    ? getGlucoseCategory(lastReading.fasting, lastReading.postMeal, lastReading.hba1c)
    : null;

  const getCategoryColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'diabetic':
        return 'text-red-400';
      case 'prediabetic':
        return 'text-amber-400';
      default:
        return 'text-emerald-400';
    }
  };

  const getCategoryBg = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'diabetic':
        return 'bg-red-500/20 border-red-500/30';
      case 'prediabetic':
        return 'bg-amber-500/20 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Droplet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">AI Glucose Tracker</h2>
            <p className="text-xs sm:text-sm text-white/50">Track levels with 7-day AI predictions</p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 h-auto text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Reading
        </Button>
      </div>

      {/* Entry Form */}
      {showForm && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Add Glucose Reading</h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Voice Input Section */}
            <div className="flex items-center justify-center gap-4 pb-4 border-b border-white/[0.06]">
              <span className="text-white/50 text-sm">Say your glucose reading:</span>
              <VoiceInputButton
                patterns={glucoseVoicePatterns}
                onParsedResult={(result) => {
                  if (result.patternName === 'fasting') {
                    setFasting(String(result.value));
                  } else if (result.patternName === 'postMeal') {
                    setPostMeal(String(result.value));
                  } else if (result.patternName === 'hba1c') {
                    setHba1c(String(result.value));
                  }
                }}
                onTranscript={(text) => {
                  // Fallback: try to parse numbers from free-form text
                  const fastingMatch = text.match(/(?:fasting|glucose)\s*(?:is\s*)?(\d{2,3})/i);
                  const postMealMatch = text.match(/(?:post|after)\s*(?:meal)?\s*(?:is\s*)?(\d{2,3})/i);
                  const hba1cMatch = text.match(/(?:a1c|hba1c)\s*(?:is\s*)?(\d{1,2}(?:\.\d)?)/i);
                  
                  if (fastingMatch) setFasting(fastingMatch[1]);
                  if (postMealMatch) setPostMeal(postMealMatch[1]);
                  if (hba1cMatch) setHba1c(hba1cMatch[1]);
                }}
                placeholder="Say 'fasting 120' or 'HbA1c 6.5'"
                size="md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Fasting Glucose (mg/dL)</label>
                <Input
                  type="number"
                  value={fasting}
                  onChange={(e) => setFasting(e.target.value)}
                  placeholder="100"
                  min="50"
                  max="500"
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-emerald-500/50 h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Post-Meal Glucose (mg/dL)</label>
                <Input
                  type="number"
                  value={postMeal}
                  onChange={(e) => setPostMeal(e.target.value)}
                  placeholder="140"
                  min="50"
                  max="500"
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
                  min="3"
                  max="15"
                  step="0.1"
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-emerald-500/50 h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Meal Type (Optional)</label>
                <Select value={mealType || ''} onValueChange={(v) => setMealType(v as any)}>
                  <SelectTrigger className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-12">
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Notes (Optional)</label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., After exercise, before meal"
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-emerald-500/50 h-12"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12">
                Save Reading
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl h-12 px-6"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Current Reading Display + Reference */}
      {lastReading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Reading */}
          <div className="lg:col-span-2 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
              <Clock className="w-4 h-4" />
              Latest Reading • {format(parseISO(lastReading.timestamp), 'MMM dd, yyyy HH:mm')}
            </div>
            <div className="flex flex-wrap items-end gap-8">
              {lastReading.fasting && (
                <div>
                  <span className="text-sm text-white/50 block mb-1">Fasting</span>
                  <span className={`text-4xl font-bold ${getCategoryColor(lastCategory?.severity || '')}`}>
                    {lastReading.fasting}
                  </span>
                  <span className="text-lg text-white/40 ml-1">mg/dL</span>
                </div>
              )}
              {lastReading.postMeal && (
                <div>
                  <span className="text-sm text-white/50 block mb-1">Post-Meal</span>
                  <span className={`text-4xl font-bold ${getCategoryColor(lastCategory?.severity || '')}`}>
                    {lastReading.postMeal}
                  </span>
                  <span className="text-lg text-white/40 ml-1">mg/dL</span>
                </div>
              )}
              {lastReading.hba1c && (
                <div>
                  <span className="text-sm text-white/50 block mb-1">HbA1c</span>
                  <span className={`text-4xl font-bold ${getCategoryColor(lastCategory?.severity || '')}`}>
                    {lastReading.hba1c}
                  </span>
                  <span className="text-lg text-white/40 ml-1">%</span>
                </div>
              )}
              <div className="ml-auto">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getCategoryBg(lastCategory?.severity || '')}`}>
                  {lastCategory?.category || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Glucose Range Reference */}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
              <Target className="w-4 h-4" />
              Glucose Reference
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Low</span>
                <span className="text-sm font-medium text-blue-400">&lt; 70 mg/dL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Normal</span>
                <span className="text-sm font-medium text-emerald-400">70-99 mg/dL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Pre-Diabetic</span>
                <span className="text-sm font-medium text-amber-400">100-125 mg/dL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Diabetic</span>
                <span className="text-sm font-medium text-red-400">&ge; 126 mg/dL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      {stats && stats.readingCount > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.averageFasting > 0 && (
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5">
              <span className="text-xs sm:text-sm text-white/50 block mb-1 sm:mb-2">Avg Fasting</span>
              <span className="text-xl sm:text-2xl font-bold text-blue-400">{stats.averageFasting}</span>
              <span className="text-xs sm:text-sm text-white/40 ml-1">mg/dL</span>
            </div>
          )}
          {stats.averagePostMeal > 0 && (
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5">
              <span className="text-xs sm:text-sm text-white/50 block mb-1 sm:mb-2">Avg Post-Meal</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-400">{stats.averagePostMeal}</span>
              <span className="text-xs sm:text-sm text-white/40 ml-1">mg/dL</span>
            </div>
          )}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5">
            <span className="text-xs sm:text-sm text-white/50 block mb-1 sm:mb-2">Total</span>
            <span className="text-xl sm:text-2xl font-bold text-purple-400">{stats.readingCount}</span>
          </div>
          {stats.hba1c && (
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5">
              <span className="text-xs sm:text-sm text-white/50 block mb-1 sm:mb-2">HbA1c</span>
              <span className="text-xl sm:text-2xl font-bold text-orange-400">{stats.hba1c}</span>
              <span className="text-xs sm:text-sm text-white/40 ml-1">%</span>
            </div>
          )}
        </div>
      )}

      {/* AI Predictions Chart */}
      {predictions.length > 0 && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">AI 7-Day Prediction</h3>
              <p className="text-sm text-white/50">Based on your glucose patterns</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              />
              <YAxis
                domain={[0, 300]}
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
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
              <Area
                type="monotone"
                dataKey="fasting"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
                name="Fasting (Actual)"
              />
              <Area
                type="monotone"
                dataKey="postMeal"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
                name="Post-Meal (Actual)"
              />
              <Line
                type="monotone"
                dataKey="predictedFasting"
                stroke="#a855f7"
                strokeDasharray="5 5"
                strokeWidth={2}
                name="Fasting (Predicted)"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="predictedPostMeal"
                stroke="#f59e0b"
                strokeDasharray="5 5"
                strokeWidth={2}
                name="Post-Meal (Predicted)"
                dot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Risk Periods */}
          {predictions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length > 0 && (
            <div className="pt-4 border-t border-white/[0.06]">
              <span className="text-sm text-white/60 block mb-3">Predicted Risk Periods</span>
              <div className="flex flex-wrap gap-2">
                {predictions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').map((pred, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      pred.riskLevel === 'critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {format(parseISO(pred.date), 'MMM dd')}: {pred.riskLevel === 'critical' ? 'Critical' : 'High'} Risk
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">AI Insights & Recommendations</h3>
              <p className="text-sm text-white/50">Personalized guidance based on your data</p>
            </div>
          </div>
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-5 border ${
                  insight.severity === 'high'
                    ? 'bg-red-500/10 border-red-500/20'
                    : insight.severity === 'moderate'
                      ? 'bg-amber-500/10 border-amber-500/20'
                      : 'bg-blue-500/10 border-blue-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    insight.severity === 'high'
                      ? 'text-red-400'
                      : insight.severity === 'moderate'
                        ? 'text-amber-400'
                        : 'text-blue-400'
                  }`} />
                  <div className="flex-1 space-y-3">
                    <p className="font-medium text-white">{insight.message}</p>
                    <div>
                      <span className="text-sm text-white/60">Top reasons:</span>
                      <ul className="mt-2 space-y-1">
                        {insight.reasons.map((reason, rIdx) => (
                          <li key={rIdx} className="text-sm text-white/50 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-white/40" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-3 border-t border-white/[0.06]">
                      <span className="text-sm font-medium text-emerald-400">💡 {insight.recommendation}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Readings */}
      {readings.length > 0 && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-medium text-white">Recent Readings</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {readings.slice(0, 10).map((reading) => {
              const category = getGlucoseCategory(reading.fasting, reading.postMeal, reading.hba1c);
              return (
                <div
                  key={reading.id}
                  className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/[0.06] transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-2">
                      {reading.fasting && (
                        <span className="text-white font-medium">
                          F: <span className="text-blue-400">{reading.fasting}</span>
                        </span>
                      )}
                      {reading.postMeal && (
                        <span className="text-white font-medium">
                          PM: <span className="text-emerald-400">{reading.postMeal}</span>
                        </span>
                      )}
                      {reading.hba1c && (
                        <span className="text-white font-medium">
                          HbA1c: <span className="text-orange-400">{reading.hba1c}%</span>
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryBg(category.severity)}`}>
                        {category.category}
                      </span>
                    </div>
                    <div className="text-sm text-white/40">
                      {format(parseISO(reading.timestamp), 'MMM dd, yyyy HH:mm')}
                      {reading.mealType && <span className="mx-2">•</span>}
                      {reading.mealType && <span className="capitalize">{reading.mealType}</span>}
                      {reading.notes && <span className="mx-2">•</span>}
                      {reading.notes && <span>{reading.notes}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(reading.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors ml-4"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {readings.length === 0 && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-12 text-center">
          <div className="p-4 bg-emerald-500/10 rounded-2xl w-fit mx-auto mb-6">
            <Droplet className="w-12 h-12 text-emerald-400/60" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No glucose readings yet</h3>
          <p className="text-white/50 mb-6 max-w-md mx-auto">
            Start tracking your blood glucose to get AI-powered predictions and personalized insights
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-3 h-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Reading
          </Button>
        </div>
      )}
    </div>
  );
};

export default GlucoseTracker;
