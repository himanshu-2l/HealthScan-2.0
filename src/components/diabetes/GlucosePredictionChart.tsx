/**
 * Glucose Prediction Chart Component
 * Interactive prediction visualization with confidence bands and alerts
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Sun,
  Moon,
  Activity,
  Brain,
  Clock,
  Utensils,
  Zap,
} from 'lucide-react';
import {
  predictGlucose,
  detectDawnPhenomenon,
  getTrendRateFromReadings,
  getLatestGlucose,
  PredictionPoint,
  PredictionAlert,
  PredictionResult,
} from '@/services/glucosePredictionService';
import { format, parseISO } from 'date-fns';

// ============================================
// Types
// ============================================

type TrendDirection = 'rising' | 'falling' | 'stable';
type CarbType = 'fast' | 'medium' | 'slow';
type HorizonHours = 1 | 2 | 4;

interface ChartDataPoint {
  time: string;
  timeLabel: string;
  predicted: number;
  confidenceLow: number;
  confidenceHigh: number;
  zone: string;
  isCurrent?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const getZoneColor = (zone: string): string => {
  switch (zone) {
    case 'danger_low':
      return '#ef4444'; // red-500
    case 'low':
      return '#f97316'; // orange-500
    case 'normal':
      return '#22c55e'; // green-500
    case 'elevated':
      return '#eab308'; // yellow-500
    case 'high':
      return '#dc2626'; // red-600
    default:
      return '#6b7280';
  }
};

const getZoneBgColor = (zone: string): string => {
  switch (zone) {
    case 'danger_low':
      return 'bg-red-500/20 border-red-500/30';
    case 'low':
      return 'bg-orange-500/20 border-orange-500/30';
    case 'normal':
      return 'bg-emerald-500/20 border-emerald-500/30';
    case 'elevated':
      return 'bg-yellow-500/20 border-yellow-500/30';
    case 'high':
      return 'bg-red-600/20 border-red-600/30';
    default:
      return 'bg-gray-500/20 border-gray-500/30';
  }
};

const getAlertIcon = (type: PredictionAlert['type']) => {
  switch (type) {
    case 'hypo_risk':
      return <TrendingDown className="w-5 h-5 text-red-400" />;
    case 'hyper_risk':
      return <TrendingUp className="w-5 h-5 text-yellow-400" />;
    case 'dawn_phenomenon':
      return <Sun className="w-5 h-5 text-orange-400" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
  }
};

const getAlertColor = (type: PredictionAlert['type']): string => {
  switch (type) {
    case 'hypo_risk':
      return 'bg-red-500/10 border-red-500/20';
    case 'hyper_risk':
      return 'bg-yellow-500/10 border-yellow-500/20';
    case 'dawn_phenomenon':
      return 'bg-orange-500/10 border-orange-500/20';
    default:
      return 'bg-amber-500/10 border-amber-500/20';
  }
};

// ============================================
// Main Component
// ============================================

export const GlucosePredictionChart: React.FC = () => {
  // Input state
  const [currentGlucose, setCurrentGlucose] = useState<string>('');
  const [trendDirection, setTrendDirection] = useState<TrendDirection>('stable');
  const [trendRate, setTrendRate] = useState<string>('');
  const [hasRecentMeal, setHasRecentMeal] = useState(false);
  const [mealCarbs, setMealCarbs] = useState<string>('');
  const [carbType, setCarbType] = useState<CarbType>('medium');
  
  // UI state
  const [horizon, setHorizon] = useState<HorizonHours>(4);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [dawnDetected, setDawnDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with latest readings
  useEffect(() => {
    const latest = getLatestGlucose();
    if (latest) {
      setCurrentGlucose(String(latest));
    }
    
    const autoTrend = getTrendRateFromReadings();
    if (autoTrend !== undefined) {
      setTrendRate(Math.abs(autoTrend).toFixed(1));
      setTrendDirection(autoTrend > 5 ? 'rising' : autoTrend < -5 ? 'falling' : 'stable');
    }
    
    setDawnDetected(detectDawnPhenomenon());
  }, []);

  // Generate prediction
  const generatePrediction = () => {
    setIsLoading(true);
    
    const glucose = parseFloat(currentGlucose);
    if (isNaN(glucose) || glucose < 40 || glucose > 400) {
      setIsLoading(false);
      return;
    }

    const input = {
      currentGlucose: glucose,
      trendDirection,
      trendRate: trendRate ? parseFloat(trendRate) : undefined,
      recentMealCarbs: hasRecentMeal && mealCarbs ? parseFloat(mealCarbs) : undefined,
      mealTime: hasRecentMeal ? new Date().toISOString() : undefined,
      carbType: hasRecentMeal ? carbType : undefined,
    };

    const result = predictGlucose(input, horizon);
    setPrediction(result);
    setIsLoading(false);
  };

  // Auto-generate on mount if we have glucose value
  useEffect(() => {
    if (currentGlucose && !prediction) {
      generatePrediction();
    }
  }, [currentGlucose]);

  // Prepare chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!prediction) return [];

    return prediction.points.map((point, index) => ({
      time: point.time,
      timeLabel: format(parseISO(point.time), 'HH:mm'),
      predicted: point.predictedGlucose,
      confidenceLow: point.confidenceLow,
      confidenceHigh: point.confidenceHigh,
      zone: point.zone,
      isCurrent: index === 0,
    }));
  }, [prediction]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-slate-900/95 border border-white/10 rounded-xl p-4 shadow-xl">
          <p className="text-white/60 text-sm mb-2">{label}</p>
          <p className="text-2xl font-bold text-white mb-1">
            {data.predicted} <span className="text-sm font-normal text-white/50">mg/dL</span>
          </p>
          <p className="text-sm text-white/50">
            Range: {data.confidenceLow} - {data.confidenceHigh}
          </p>
          <Badge 
            className={`mt-2 ${getZoneBgColor(data.zone)} text-white capitalize`}
            variant="outline"
          >
            {data.zone.replace('_', ' ')}
          </Badge>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Glucose Prediction</h2>
            <p className="text-sm text-white/50">AI-powered glucose forecasting</p>
          </div>
        </div>
        
        {/* Dawn Phenomenon Badge */}
        {dawnDetected && (
          <Badge 
            className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-3 py-1.5"
            variant="outline"
          >
            <Sun className="w-4 h-4 mr-1.5" />
            Dawn phenomenon detected
          </Badge>
        )}
      </div>

      {/* Input Panel */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06]">
        <CardContent className="p-6 space-y-6">
          {/* Current Glucose & Trend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Current Glucose */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Current Glucose (mg/dL)
              </label>
              <Input
                type="number"
                value={currentGlucose}
                onChange={(e) => setCurrentGlucose(e.target.value)}
                placeholder="120"
                min="40"
                max="400"
                className="bg-white/[0.04] border-white/[0.08] rounded-xl text-white h-12 text-lg"
              />
            </div>

            {/* Trend Direction */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Trend Direction</label>
              <div className="flex gap-2">
                {(['falling', 'stable', 'rising'] as TrendDirection[]).map((trend) => (
                  <Button
                    key={trend}
                    type="button"
                    onClick={() => setTrendDirection(trend)}
                    variant={trendDirection === trend ? 'default' : 'outline'}
                    className={`flex-1 h-12 rounded-xl ${
                      trendDirection === trend
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]'
                    }`}
                  >
                    {trend === 'rising' && <TrendingUp className="w-4 h-4 mr-1.5" />}
                    {trend === 'falling' && <TrendingDown className="w-4 h-4 mr-1.5" />}
                    {trend === 'stable' && <Minus className="w-4 h-4 mr-1.5" />}
                    <span className="capitalize">{trend}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Trend Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">
                Rate (mg/dL/hr) <span className="text-white/40">optional</span>
              </label>
              <Input
                type="number"
                value={trendRate}
                onChange={(e) => setTrendRate(e.target.value)}
                placeholder="e.g., 15"
                className="bg-white/[0.04] border-white/[0.08] rounded-xl text-white h-12"
              />
            </div>
          </div>

          {/* Recent Meal Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Utensils className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Recent Meal</p>
                <p className="text-xs text-white/50">Include carb absorption in prediction</p>
              </div>
            </div>
            <Switch
              checked={hasRecentMeal}
              onCheckedChange={setHasRecentMeal}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>

          {/* Meal Details (conditional) */}
          {hasRecentMeal && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Carbs (grams)</label>
                <Input
                  type="number"
                  value={mealCarbs}
                  onChange={(e) => setMealCarbs(e.target.value)}
                  placeholder="e.g., 45"
                  className="bg-white/[0.04] border-white/[0.08] rounded-xl text-white h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Carb Type</label>
                <div className="flex gap-2">
                  {(['fast', 'medium', 'slow'] as CarbType[]).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      onClick={() => setCarbType(type)}
                      variant={carbType === type ? 'default' : 'outline'}
                      className={`flex-1 h-12 rounded-xl ${
                        carbType === type
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]'
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 mr-1.5 ${type === 'fast' ? 'fill-current' : ''}`} />
                      <span className="capitalize text-sm">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Update Button */}
          <Button
            onClick={generatePrediction}
            disabled={isLoading || !currentGlucose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 text-base"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Update Prediction
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Horizon Selector */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-white/50 mr-2">Prediction Horizon:</span>
        {[1, 2, 4].map((h) => (
          <Button
            key={h}
            onClick={() => {
              setHorizon(h as HorizonHours);
              if (prediction) {
                setTimeout(generatePrediction, 0);
              }
            }}
            variant={horizon === h ? 'default' : 'outline'}
            size="sm"
            className={`rounded-lg ${
              horizon === h
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]'
            }`}
          >
            {h}hr
          </Button>
        ))}
      </div>

      {/* Chart */}
      {prediction && chartData.length > 0 && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Predicted Glucose Trajectory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  {/* Zone Backgrounds */}
                  <ReferenceArea y1={0} y2={70} fill="#ef4444" fillOpacity={0.1} />
                  <ReferenceArea y1={70} y2={180} fill="#22c55e" fillOpacity={0.05} />
                  <ReferenceArea y1={180} y2={300} fill="#eab308" fillOpacity={0.1} />

                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  
                  <XAxis
                    dataKey="timeLabel"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickMargin={8}
                  />
                  
                  <YAxis
                    domain={[40, 250]}
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickFormatter={(value) => `${value}`}
                  />
                  
                  <Tooltip content={<CustomTooltip />} />

                  {/* Current Time Marker */}
                  <ReferenceLine x={chartData[0]?.timeLabel} stroke="#a855f7" strokeDasharray="5 5" />

                  {/* Confidence Band */}
                  <Area
                    type="monotone"
                    dataKey="confidenceHigh"
                    stroke="none"
                    fill="#a855f7"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="confidenceLow"
                    stroke="none"
                    fill="#0f172a"
                    fillOpacity={1}
                  />

                  {/* Prediction Line */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props;
                      if (payload.isCurrent) {
                        return (
                          <circle key={index} cx={cx} cy={cy} r={6} fill="#a855f7" stroke="#fff" strokeWidth={2} />
                        );
                      }
                      return null;
                    }}
                    activeDot={{ r: 6, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
                  />

                  {/* Threshold Lines */}
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                  <ReferenceLine y={180} stroke="#eab308" strokeDasharray="3 3" strokeOpacity={0.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-white/60">Predicted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500/30" />
                <span className="text-white/60">Confidence</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500/20" />
                <span className="text-white/60">Low (&lt;70)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-500/10" />
                <span className="text-white/60">Target (70-180)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-yellow-500/20" />
                <span className="text-white/60">High (&gt;180)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      {prediction && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white/[0.04] border-white/[0.06]">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-white/50 mb-1">Lowest Predicted</p>
              <p className={`text-2xl font-bold ${prediction.lowestPredicted < 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                {prediction.lowestPredicted}
              </p>
              <span className="text-xs text-white/40">mg/dL</span>
            </CardContent>
          </Card>
          
          <Card className="bg-white/[0.04] border-white/[0.06]">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-white/50 mb-1">Highest Predicted</p>
              <p className={`text-2xl font-bold ${prediction.highestPredicted > 180 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {prediction.highestPredicted}
              </p>
              <span className="text-xs text-white/40">mg/dL</span>
            </CardContent>
          </Card>
          
          <Card className="bg-white/[0.04] border-white/[0.06]">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-white/50 mb-1">Time to Low</p>
              <p className={`text-2xl font-bold ${prediction.timeToLow ? 'text-red-400' : 'text-white/30'}`}>
                {prediction.timeToLow ? `${Math.round(prediction.timeToLow)}m` : '--'}
              </p>
              <span className="text-xs text-white/40">minutes</span>
            </CardContent>
          </Card>
          
          <Card className="bg-white/[0.04] border-white/[0.06]">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-white/50 mb-1">Time to High</p>
              <p className={`text-2xl font-bold ${prediction.timeToHigh ? 'text-yellow-400' : 'text-white/30'}`}>
                {prediction.timeToHigh ? `${Math.round(prediction.timeToHigh)}m` : '--'}
              </p>
              <span className="text-xs text-white/40">minutes</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Section */}
      {prediction && prediction.alerts.length > 0 && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Prediction Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prediction.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white capitalize">
                        {alert.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-white/40">
                        {format(parseISO(alert.triggerTime), 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 mb-2">{alert.message}</p>
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                      <span className="text-xs font-medium text-emerald-400">Action:</span>
                      <span className="text-xs text-white/70">{alert.actionRequired}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${
                      alert.predictedValue < 70 ? 'text-red-400' : 
                      alert.predictedValue > 180 ? 'text-yellow-400' : 'text-white'
                    }`}>
                      {alert.predictedValue}
                    </span>
                    <span className="text-xs text-white/40 block">mg/dL</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dawn Phenomenon Info */}
      {dawnDetected && (
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Sun className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Dawn Phenomenon Detected</h4>
                <p className="text-sm text-white/60">
                  Your glucose tends to rise naturally between 4-8 AM due to hormonal changes. 
                  This is a normal physiological response, but may require basal insulin adjustment 
                  if it causes consistent highs. Discuss with your healthcare provider.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!prediction && !isLoading && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] p-12 text-center">
          <div className="p-4 bg-purple-500/10 rounded-2xl w-fit mx-auto mb-4">
            <Brain className="w-8 h-8 text-purple-400/60" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Ready to Predict</h3>
          <p className="text-sm text-white/50 max-w-md mx-auto">
            Enter your current glucose and click "Update Prediction" to see your 
            personalized glucose forecast for the next {horizon} hours.
          </p>
        </Card>
      )}
    </div>
  );
};

export default GlucosePredictionChart;
