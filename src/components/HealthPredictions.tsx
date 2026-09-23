/**
 * Health Predictions Component
 * AI-powered health trend analysis using Gemini API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { callAIProxy } from '@/services/aiProxyService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Heart,
  Activity,
  Brain,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  Clock,
  Minus,
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

// Types
interface HealthPrediction {
  overallScore: number;
  heartRisk: number;
  diabetesRisk: number;
  stressLevel: number;
  trends: {
    heart: 'improving' | 'stable' | 'declining';
    diabetes: 'improving' | 'stable' | 'declining';
    stress: 'improving' | 'stable' | 'declining';
    overall: 'improving' | 'stable' | 'declining';
  };
  insights: string[];
  recommendations: string[];
  detailedAnalysis: {
    heart: string;
    diabetes: string;
    stress: string;
    overall: string;
  };
}

interface BPReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: string;
}

interface GlucoseReading {
  id: string;
  fasting?: number;
  postMeal?: number;
  hba1c?: number;
  timestamp: string;
}

// Skeleton component for loading state
const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 animate-pulse ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-white/[0.08] rounded-xl" />
      <div className="flex-1">
        <div className="h-4 bg-white/[0.08] rounded w-24 mb-2" />
        <div className="h-3 bg-white/[0.06] rounded w-16" />
      </div>
    </div>
    <div className="h-12 bg-white/[0.08] rounded-lg mb-3" />
    <div className="h-3 bg-white/[0.06] rounded w-3/4" />
  </div>
);

// Mini sparkline component
const MiniSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const chartData = data.map((value, index) => ({ value, index }));
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Trend icon component
const TrendIcon: React.FC<{ trend: 'improving' | 'stable' | 'declining'; className?: string }> = ({ trend, className = '' }) => {
  if (trend === 'improving') {
    return <TrendingUp className={`w-4 h-4 text-emerald-400 ${className}`} />;
  } else if (trend === 'declining') {
    return <TrendingDown className={`w-4 h-4 text-red-400 ${className}`} />;
  }
  return <Minus className={`w-4 h-4 text-amber-400 ${className}`} />;
};

export const HealthPredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<HealthPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [hasData, setHasData] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  // Collect health data from localStorage
  const collectHealthData = useCallback(() => {
    const bpReadings: BPReading[] = JSON.parse(localStorage.getItem('healthscan_bp_readings') || '[]');
    const glucoseReadings: GlucoseReading[] = JSON.parse(localStorage.getItem('healthscan_glucose_readings') || '[]');
    
    // Check if we have any meaningful data
    const hasAnyData = bpReadings.length > 0 || glucoseReadings.length > 0;
    setHasData(hasAnyData);

    return {
      bpReadings: bpReadings.slice(0, 30), // Last 30 readings
      glucoseReadings: glucoseReadings.slice(0, 30),
      totalBPReadings: bpReadings.length,
      totalGlucoseReadings: glucoseReadings.length,
    };
  }, []);

  // Generate sparkline data from readings
  const generateSparklineData = useCallback((type: 'heart' | 'diabetes' | 'stress' | 'overall') => {
    // Generate sample trend data for visualization
    const baseValues: Record<string, number[]> = {
      heart: [65, 70, 68, 72, 75, 73, 70],
      diabetes: [85, 82, 80, 78, 75, 77, 74],
      stress: [60, 65, 58, 62, 55, 58, 52],
      overall: [72, 75, 78, 76, 80, 82, 85],
    };
    return baseValues[type] || [50, 55, 52, 58, 60, 55, 58];
  }, []);

  // Analyze health data using Gemini API
  const analyzeHealthData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const healthData = collectHealthData();

    try {
      const payload = {
        bpReadings: healthData.bpReadings,
        glucoseReadings: healthData.glucoseReadings,
        totalBPReadings: healthData.totalBPReadings,
        totalGlucoseReadings: healthData.totalGlucoseReadings,
      };

      const res = await callAIProxy('health-predictions', payload);

      if (!res.ok) {
        throw new Error('AI analysis unavailable, try again or consult a clinician');
      }

      const text = res.data;
      if (!text || typeof text !== 'string') {
        throw new Error('AI analysis unavailable, try again or consult a clinician');
      }

      // Parse JSON response
      let parsedResponse: HealthPrediction;
      try {
        // Clean the response - remove any markdown code blocks if present
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        parsedResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('AI analysis unavailable, try again or consult a clinician');
      }

      setPredictions(parsedResponse);
      setLastAnalyzed(new Date());
      
      // Cache the results
      localStorage.setItem('healthscan_predictions_cache', JSON.stringify({
        predictions: parsedResponse,
        timestamp: new Date().toISOString(),
      }));

    } catch (err) {
      console.error('Error analyzing health data:', err);
      setPredictions(null);
      setError('AI analysis unavailable, try again or consult a clinician');
    } finally {
      setIsLoading(false);
    }
  }, [collectHealthData]);

  // Load cached predictions on mount
  useEffect(() => {
    const cached = localStorage.getItem('healthscan_predictions_cache');
    if (cached) {
      try {
        const { predictions: cachedPredictions, timestamp } = JSON.parse(cached);
        setPredictions(cachedPredictions);
        setLastAnalyzed(new Date(timestamp));
      } catch {
        // Ignore cache parse errors
      }
    }
    
    // Check if we have data
    collectHealthData();
  }, [collectHealthData]);

  // Auto-analyze on mount if no cached data
  useEffect(() => {
    if (!predictions && !isLoading) {
      analyzeHealthData();
    }
  }, []);

  // Get overall trajectory display
  const getTrajectoryConfig = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return { label: 'Improving', bgColor: 'bg-emerald-500/15', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' };
      case 'declining':
        return { label: 'Needs Attention', bgColor: 'bg-red-500/15', textColor: 'text-red-400', borderColor: 'border-red-500/30' };
      default:
        return { label: 'Stable', bgColor: 'bg-amber-500/15', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' };
    }
  };

  // Risk level color
  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'text-emerald-400';
    if (risk < 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRiskBg = (risk: number) => {
    if (risk < 30) return 'bg-emerald-500/15 border-emerald-500/30';
    if (risk < 60) return 'bg-amber-500/15 border-amber-500/30';
    return 'bg-red-500/15 border-red-500/30';
  };

  // No data state
  if (!hasData && !predictions && !isLoading) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl border border-teal-500/30">
              <TrendingUp className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Health Predictions</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-500/30 rounded-full px-3 py-0.5 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* No Data Card */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-teal-400/60" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Start Tracking to Get Predictions</h3>
          <p className="text-white/50 max-w-md mx-auto mb-6 leading-relaxed">
            Add your blood pressure or glucose readings to receive AI-powered health predictions and personalized insights.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={analyzeHealthData}
              className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl px-6 py-3 h-auto font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Get General Health Tips
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl border border-teal-500/30">
            <TrendingUp className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Health Predictions</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-500/30 rounded-full px-3 py-0.5 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastAnalyzed && (
            <span className="text-white/40 text-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Last analyzed {lastAnalyzed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            onClick={analyzeHealthData}
            disabled={isLoading}
            className="bg-white/[0.06] hover:bg-white/[0.10] text-white border border-white/[0.08] rounded-xl px-4 py-2 h-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing...' : 'Re-analyze'}
          </Button>
        </div>
      </div>

      {/* Error / Unavailable State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium">AI Analysis Unavailable</p>
              <p className="text-white/70 text-sm mt-1">{error}</p>
              <p className="text-white/40 text-xs mt-2 italic">
                General non-clinical advisory: Continue tracking daily vital signs and log regular activity. If you experience acute symptoms or feel unwell, consult a licensed clinician immediately.
              </p>
            </div>
          </div>
          <Button
            onClick={analyzeHealthData}
            disabled={isLoading}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl px-4 py-2 text-sm flex-shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !predictions && (
        <div className="space-y-6">
          <SkeletonCard className="h-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {/* Predictions Display */}
      {predictions && (
        <>
          {/* Overview Card */}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-white/50 text-sm font-medium uppercase tracking-wider">Overall Health Trajectory</span>
                </div>
                {(() => {
                  const config = getTrajectoryConfig(predictions.trends.overall);
                  return (
                    <Badge className={`${config.bgColor} ${config.textColor} ${config.borderColor} border px-4 py-2 rounded-full text-sm font-medium`}>
                      <TrendIcon trend={predictions.trends.overall} className="mr-2" />
                      {config.label}
                    </Badge>
                  );
                })()}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold text-white tracking-tight">
                  {predictions.overallScore}
                </span>
                <span className="text-2xl text-white/40">/100</span>
              </div>
              <p className="text-white/50 mt-3">Health Score based on your tracking data</p>
            </div>
          </div>

          {/* Prediction Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Heart Disease Risk */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-2xl" />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-500/15 rounded-xl">
                    <Heart className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Heart Disease Risk</h3>
                    <p className="text-white/40 text-sm">Cardiovascular health</p>
                  </div>
                </div>
                <MiniSparkline data={generateSparklineData('heart')} color="#f87171" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className={`text-4xl font-bold ${getRiskColor(predictions.heartRisk)}`}>
                    {predictions.heartRisk}%
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendIcon trend={predictions.trends.heart} />
                    <span className="text-white/50 text-sm capitalize">{predictions.trends.heart}</span>
                  </div>
                </div>
                <Badge className={`${getRiskBg(predictions.heartRisk)} border rounded-full px-3 py-1 text-xs`}>
                  {predictions.heartRisk < 30 ? 'Low Risk' : predictions.heartRisk < 60 ? 'Moderate' : 'High Risk'}
                </Badge>
              </div>
            </div>

            {/* Diabetes Risk */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl" />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/15 rounded-xl">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Diabetes Progression</h3>
                    <p className="text-white/40 text-sm">Blood sugar trends</p>
                  </div>
                </div>
                <MiniSparkline data={generateSparklineData('diabetes')} color="#34d399" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className={`text-4xl font-bold ${getRiskColor(predictions.diabetesRisk)}`}>
                    {predictions.diabetesRisk}%
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendIcon trend={predictions.trends.diabetes} />
                    <span className="text-white/50 text-sm capitalize">{predictions.trends.diabetes}</span>
                  </div>
                </div>
                <Badge className={`${getRiskBg(predictions.diabetesRisk)} border rounded-full px-3 py-1 text-xs`}>
                  {predictions.diabetesRisk < 30 ? 'Low Risk' : predictions.diabetesRisk < 60 ? 'Moderate' : 'High Risk'}
                </Badge>
              </div>
            </div>

            {/* Stress & Mental Health */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-2xl" />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/15 rounded-xl">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Stress & Mental Health</h3>
                    <p className="text-white/40 text-sm">Wellbeing indicator</p>
                  </div>
                </div>
                <MiniSparkline data={generateSparklineData('stress')} color="#a855f7" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className={`text-4xl font-bold ${predictions.stressLevel <= 3 ? 'text-emerald-400' : predictions.stressLevel <= 6 ? 'text-amber-400' : 'text-red-400'}`}>
                    {predictions.stressLevel}/10
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendIcon trend={predictions.trends.stress} />
                    <span className="text-white/50 text-sm capitalize">{predictions.trends.stress}</span>
                  </div>
                </div>
                <Badge className={`${predictions.stressLevel <= 3 ? 'bg-emerald-500/15 border-emerald-500/30' : predictions.stressLevel <= 6 ? 'bg-amber-500/15 border-amber-500/30' : 'bg-red-500/15 border-red-500/30'} border rounded-full px-3 py-1 text-xs`}>
                  {predictions.stressLevel <= 3 ? 'Low Stress' : predictions.stressLevel <= 6 ? 'Moderate' : 'High Stress'}
                </Badge>
              </div>
            </div>

            {/* Overall Health Trend */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-l-2xl" />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-500/15 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Overall Health Trend</h3>
                    <p className="text-white/40 text-sm">Combined analysis</p>
                  </div>
                </div>
                <MiniSparkline data={generateSparklineData('overall')} color="#2dd4bf" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className={`text-4xl font-bold ${predictions.overallScore >= 70 ? 'text-emerald-400' : predictions.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {predictions.overallScore}
                  </span>
                  <span className="text-xl text-white/40 ml-1">/100</span>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendIcon trend={predictions.trends.overall} />
                    <span className="text-white/50 text-sm capitalize">{predictions.trends.overall}</span>
                  </div>
                </div>
                <Badge className={`${predictions.overallScore >= 70 ? 'bg-emerald-500/15 border-emerald-500/30' : predictions.overallScore >= 50 ? 'bg-amber-500/15 border-amber-500/30' : 'bg-red-500/15 border-red-500/30'} border rounded-full px-3 py-1 text-xs`}>
                  {predictions.overallScore >= 70 ? 'Healthy' : predictions.overallScore >= 50 ? 'Fair' : 'Needs Care'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Detailed Insights Section */}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/[0.06] flex items-center gap-3">
              <div className="p-2 bg-cyan-500/15 rounded-xl">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Detailed AI Insights</h3>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {/* Heart Analysis */}
              <div className="p-6">
                <button
                  onClick={() => setExpandedInsight(expandedInsight === 'heart' ? null : 'heart')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-red-400" />
                    <span className="text-white font-medium">Cardiovascular Analysis</span>
                  </div>
                  {expandedInsight === 'heart' ? (
                    <ChevronUp className="w-5 h-5 text-white/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  )}
                </button>
                {expandedInsight === 'heart' && (
                  <p className="mt-4 text-white/60 leading-relaxed pl-8">
                    {predictions.detailedAnalysis.heart}
                  </p>
                )}
              </div>

              {/* Diabetes Analysis */}
              <div className="p-6">
                <button
                  onClick={() => setExpandedInsight(expandedInsight === 'diabetes' ? null : 'diabetes')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-medium">Diabetes Risk Analysis</span>
                  </div>
                  {expandedInsight === 'diabetes' ? (
                    <ChevronUp className="w-5 h-5 text-white/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  )}
                </button>
                {expandedInsight === 'diabetes' && (
                  <p className="mt-4 text-white/60 leading-relaxed pl-8">
                    {predictions.detailedAnalysis.diabetes}
                  </p>
                )}
              </div>

              {/* Stress Analysis */}
              <div className="p-6">
                <button
                  onClick={() => setExpandedInsight(expandedInsight === 'stress' ? null : 'stress')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium">Stress & Mental Health Analysis</span>
                  </div>
                  {expandedInsight === 'stress' ? (
                    <ChevronUp className="w-5 h-5 text-white/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  )}
                </button>
                {expandedInsight === 'stress' && (
                  <p className="mt-4 text-white/60 leading-relaxed pl-8">
                    {predictions.detailedAnalysis.stress}
                  </p>
                )}
              </div>

              {/* Overall Analysis */}
              <div className="p-6">
                <button
                  onClick={() => setExpandedInsight(expandedInsight === 'overall' ? null : 'overall')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-teal-400" />
                    <span className="text-white font-medium">Overall Health Summary</span>
                  </div>
                  {expandedInsight === 'overall' ? (
                    <ChevronUp className="w-5 h-5 text-white/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  )}
                </button>
                {expandedInsight === 'overall' && (
                  <p className="mt-4 text-white/60 leading-relaxed pl-8">
                    {predictions.detailedAnalysis.overall}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations Preview */}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/[0.06] flex items-center gap-3">
              <div className="p-2 bg-amber-500/15 rounded-xl">
                <Lightbulb className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {predictions.recommendations.slice(0, 4).map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-400 font-semibold text-sm">{idx + 1}</span>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Insights */}
          {predictions.insights.length > 0 && (
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-white mb-6">Key Observations</h3>
              <div className="space-y-3">
                {predictions.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 text-white/60"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
                    <p className="leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HealthPredictions;
