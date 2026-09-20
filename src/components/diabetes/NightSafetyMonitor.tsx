/**
 * Night Safety Monitor Component
 * Comprehensive nighttime glucose safety monitoring with predictions and recommendations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Moon,
  Sun,
  BedDouble,
  AlertTriangle,
  Cookie,
  Milk,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingDown,
  User,
  Bell,
  History,
  Sparkles,
} from 'lucide-react';
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
import { format, parseISO } from 'date-fns';
import {
  performNightAssessment,
  getOvernightDropRate,
  getHistoricalNightLows,
  getOvernightStats,
  getLastNightAssessment,
  isNightSafetyCheckDue,
  getRecommendedSnack,
  NightSafetyResult,
  NightLowRecord,
} from '@/services/nightSafetyService';
import { getLatestGlucose } from '@/services/glucosePredictionService';
import { getPatientProfile, EmergencyContact } from '@/services/patientProfileService';

// ============================================
// Types
// ============================================

interface TimelinePoint {
  time: string;
  timeLabel: string;
  glucose: number;
  zone: 'danger' | 'caution' | 'safe' | 'high';
}

// ============================================
// Helper Functions
// ============================================

const getRiskBadgeStyles = (riskLevel: string) => {
  switch (riskLevel) {
    case 'danger':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'caution':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'safe':
    default:
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  }
};

const getGlucoseColor = (value: number): string => {
  if (value < 70) return '#ef4444'; // red
  if (value < 90) return '#f97316'; // orange
  if (value <= 180) return '#22c55e'; // green
  return '#eab308'; // yellow
};

const getSafetyScoreColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
};

const getSafetyScoreBg = (score: number): string => {
  if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
  if (score >= 60) return 'bg-amber-500/20 border-amber-500/30';
  return 'bg-red-500/20 border-red-500/30';
};

// ============================================
// Main Component
// ============================================

export const NightSafetyMonitor: React.FC = () => {
  // State
  const [currentGlucose, setCurrentGlucose] = useState<string>('');
  const [bedtime, setBedtime] = useState<string>('22:00');
  const [assessment, setAssessment] = useState<NightSafetyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedSnack, setHasCheckedSnack] = useState(false);
  const [alertCaregiver, setAlertCaregiver] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [nightLows, setNightLows] = useState<NightLowRecord[]>([]);
  const [overnightStats, setOvernightStats] = useState<{
    dropRate: number;
    lowNightsCount: number;
    totalNights: number;
  } | null>(null);
  const [caregiverName, setCaregiverName] = useState<string>('');
  const [timelineData, setTimelineData] = useState<TimelinePoint[]>([]);
  
  // Check if it's evening time
  const isEvening = useMemo(() => isNightSafetyCheckDue(), []);
  const currentHour = new Date().getHours();
  
  // Initialize with latest glucose
  useEffect(() => {
    const latest = getLatestGlucose();
    if (latest) {
      setCurrentGlucose(String(latest));
    }
    
    // Load historical data
    loadHistoricalData();
    
    // Load caregiver info
    loadCaregiverInfo();
    
    // Check for last assessment
    const lastAssessment = getLastNightAssessment();
    if (lastAssessment) {
      const lastTime = new Date(lastAssessment.timestamp);
      const hoursSince = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);
      
      // If last assessment was within last 4 hours, don't auto-run
      if (hoursSince < 4) {
        // Could pre-populate with last values if desired
      }
    }
  }, []);
  
  const loadHistoricalData = () => {
    const lows = getHistoricalNightLows();
    setNightLows(lows);
    
    const stats = getOvernightStats();
    setOvernightStats({
      dropRate: stats.averageDropRate,
      lowNightsCount: stats.lowNightsCount,
      totalNights: stats.totalNightsAnalyzed,
    });
  };
  
  const loadCaregiverInfo = () => {
    const profile = getPatientProfile();
    if (profile && profile.emergencyContacts && profile.emergencyContacts.length > 0) {
      const primary = profile.emergencyContacts.find((c: EmergencyContact) => c.isPrimary);
      setCaregiverName(primary?.name || profile.emergencyContacts[0].name);
    }
  };
  
  // Generate timeline data from bedtime to 8 AM
  const generateTimelineData = useCallback((result: NightSafetyResult): TimelinePoint[] => {
    const data: TimelinePoint[] = [];
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    
    let currentTime = new Date();
    currentTime.setHours(bedHour, bedMin, 0, 0);
    
    // If bedtime has passed, start from now
    if (currentTime < new Date()) {
      currentTime = new Date();
    }
    
    const endTime = new Date(currentTime);
    endTime.setHours(8, 0, 0, 0);
    if (endTime <= currentTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    // Generate points every hour
    const hours = Math.ceil((endTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
    
    // Simple interpolation for visualization
    const startGlucose = result.currentGlucose;
    const lowestGlucose = result.predictedLowestGlucose;
    const lowestHour = parseInt(result.predictedLowestTime.split(':')[0]) || 3;
    const lowestAmPm = result.predictedLowestTime.includes('AM') ? 'AM' : 'PM';
    
    // Adjust for 12-hour format
    let lowestHour24 = lowestHour;
    if (lowestAmPm === 'AM' && lowestHour === 12) lowestHour24 = 0;
    if (lowestAmPm === 'PM' && lowestHour !== 12) lowestHour24 += 12;
    
    for (let i = 0; i <= hours; i++) {
      const timePoint = new Date(currentTime.getTime() + i * 60 * 60 * 1000);
      const hour = timePoint.getHours();
      const timeLabel = timePoint.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        hour12: true 
      });
      
      // Simple curve interpolation
      let glucose: number;
      const hourProgress = i / hours;
      
      if (hour <= lowestHour24 || (lowestHour24 < bedHour && hour > bedHour)) {
        // Falling phase
        const dropProgress = Math.min(1, hourProgress * 2);
        glucose = startGlucose - (startGlucose - lowestGlucose) * dropProgress;
      } else {
        // Rising phase (dawn phenomenon)
        const riseProgress = Math.min(1, (hour - lowestHour24) / 4);
        glucose = lowestGlucose + (20 * riseProgress); // Assume 20 mg/dL dawn rise
      }
      
      glucose = Math.round(glucose);
      
      // Determine zone
      let zone: TimelinePoint['zone'] = 'safe';
      if (glucose < 70) zone = 'danger';
      else if (glucose < 90) zone = 'caution';
      else if (glucose > 180) zone = 'high';
      
      data.push({
        time: timePoint.toISOString(),
        timeLabel,
        glucose,
        zone,
      });
    }
    
    return data;
  }, [bedtime]);
  
  // Run night safety assessment
  const runAssessment = () => {
    setIsLoading(true);
    
    const glucose = parseFloat(currentGlucose);
    if (isNaN(glucose) || glucose < 40 || glucose > 400) {
      setIsLoading(false);
      return;
    }
    
    // Parse bedtime
    const [hours, minutes] = bedtime.split(':').map(Number);
    const bedtimeDate = new Date();
    bedtimeDate.setHours(hours, minutes, 0, 0);
    
    // If bedtime has passed, use tomorrow
    if (bedtimeDate < new Date()) {
      bedtimeDate.setDate(bedtimeDate.getDate() + 1);
    }
    
    const result = performNightAssessment(glucose, bedtimeDate);
    setAssessment(result);
    
    // Generate timeline
    const timeline = generateTimelineData(result);
    setTimelineData(timeline);
    
    setIsLoading(false);
    setHasCheckedSnack(false);
  };
  
  // Get greeting based on time
  const getGreeting = () => {
    if (currentHour >= 20 || currentHour < 5) {
      return {
        title: 'Good evening!',
        subtitle: "Let's check your sleep safety.",
        icon: <Moon className="w-6 h-6 text-indigo-400" />,
      };
    }
    return {
      title: 'Night Safety Check',
      subtitle: 'Night safety check is typically done after 8 PM, but you can check anytime.',
      icon: <Sun className="w-6 h-6 text-amber-400" />,
    };
  };
  
  const greeting = getGreeting();
  
  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TimelinePoint;
      return (
        <div className="bg-slate-900/95 border border-white/10 rounded-xl p-3 shadow-xl">
          <p className="text-white/60 text-sm mb-1">{data.timeLabel}</p>
          <p className="text-xl font-bold text-white">
            {data.glucose} <span className="text-sm font-normal text-white/50">mg/dL</span>
          </p>
          <Badge 
            className={`mt-2 ${getRiskBadgeStyles(data.zone)} capitalize`}
            variant="outline"
          >
            {data.zone}
          </Badge>
        </div>
      );
    }
    return null;
  };
  
  // Get snack recommendation
  const snackRecommendation = useMemo(() => {
    if (!assessment) return null;
    return getRecommendedSnack(
      assessment.currentGlucose,
      assessment.currentIOB
    );
  }, [assessment]);
  
  return (
    <div className="space-y-6">
      {/* Header with Time-Aware Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            {greeting.icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{greeting.title}</h2>
            <p className="text-sm text-white/50">{greeting.subtitle}</p>
          </div>
        </div>
        
        {/* Overnight Stats Badge */}
        {overnightStats && overnightStats.lowNightsCount > 0 && (
          <Badge 
            className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-3 py-1.5"
            variant="outline"
          >
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            {overnightStats.lowNightsCount} low nights this week
          </Badge>
        )}
      </div>
      
      {/* Evening Check-in Form */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06]">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Glucose Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
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
            
            {/* Bedtime Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-indigo-400" />
                Planned Bedtime
              </label>
              <Input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] rounded-xl text-white h-12"
              />
            </div>
          </div>
          
          {/* Check Button */}
          <Button
            onClick={runAssessment}
            disabled={isLoading || !currentGlucose}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 text-base"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Check My Night Safety
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Assessment Result */}
      {assessment && (
        <>
          {/* Sleep Safety Score Card */}
          <Card className={`${getSafetyScoreBg(assessment.sleepSafetyScore)} backdrop-blur-sm border`}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <p className="text-sm text-white/60 mb-2">Sleep Safety Score</p>
                <div className="relative">
                  {/* Circular Score Indicator */}
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-white/10"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - assessment.sleepSafetyScore / 100)}`}
                      className={getSafetyScoreColor(assessment.sleepSafetyScore)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold ${getSafetyScoreColor(assessment.sleepSafetyScore)}`}>
                      {assessment.sleepSafetyScore}
                    </span>
                    <span className="text-xs text-white/50">/ 100</span>
                  </div>
                </div>
                
                {/* Risk Level Badge */}
                <Badge 
                  className={`mt-4 ${getRiskBadgeStyles(assessment.riskLevel)} capitalize px-4 py-1.5`}
                  variant="outline"
                >
                  {assessment.riskLevel} Risk
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          {/* Predictions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Predicted 3 AM */}
            <Card className="bg-white/[0.04] border-white/[0.06]">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-white/50 mb-1 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  Predicted 3 AM
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: getGlucoseColor(assessment.predicted3AMGlucose) }}
                >
                  {assessment.predicted3AMGlucose}
                </p>
                <span className="text-xs text-white/40">mg/dL</span>
              </CardContent>
            </Card>
            
            {/* Lowest Predicted */}
            <Card className="bg-white/[0.04] border-white/[0.06]">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-white/50 mb-1 flex items-center justify-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Lowest Predicted
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: getGlucoseColor(assessment.predictedLowestGlucose) }}
                >
                  {assessment.predictedLowestGlucose}
                </p>
                <span className="text-xs text-white/40">mg/dL</span>
              </CardContent>
            </Card>
            
            {/* Lowest Time */}
            <Card className="bg-white/[0.04] border-white/[0.06] col-span-2 sm:col-span-1">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-white/50 mb-1">Time of Low</p>
                <p className="text-xl font-bold text-white">
                  {assessment.predictedLowestTime}
                </p>
                <span className="text-xs text-white/40">expected</span>
              </CardContent>
            </Card>
          </div>
          
          {/* Current IOB */}
          <Card className="bg-white/[0.04] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Active Insulin (IOB)</p>
                    <p className="text-xs text-white/50">Insulin still working in your body</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${
                    assessment.currentIOB > 3 ? 'text-red-400' : 
                    assessment.currentIOB > 1.5 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {assessment.currentIOB.toFixed(1)}
                  </p>
                  <span className="text-xs text-white/40">units</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recommendation Section */}
          <Card className={`${getRiskBadgeStyles(assessment.riskLevel)} backdrop-blur-sm border`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  {assessment.riskLevel === 'danger' ? (
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  ) : assessment.riskLevel === 'caution' ? (
                    <Clock className="w-6 h-6 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {assessment.riskLevel === 'safe' ? 'All Clear!' : 'Recommendation'}
                  </h3>
                  <p className="text-white/80 mb-4">{assessment.recommendation}</p>
                  
                  {/* Snack Suggestion */}
                  {assessment.snackSuggestion && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Cookie className="w-4 h-4 text-amber-400" />
                        <Milk className="w-4 h-4 text-white/60" />
                        <span className="text-sm font-medium text-white">Suggested Snack</span>
                      </div>
                      <p className="text-white/70 text-sm mb-3">{assessment.snackSuggestion}</p>
                      
                      {/* Snack Confirmation Button */}
                      {assessment.riskLevel !== 'safe' && (
                        <Button
                          onClick={() => setHasCheckedSnack(true)}
                          variant={hasCheckedSnack ? 'default' : 'outline'}
                          className={`w-full rounded-xl ${
                            hasCheckedSnack 
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                              : 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          {hasCheckedSnack ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Snack Eaten
                            </>
                          ) : (
                            "I've eaten the snack"
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Night Safety Timeline */}
          {timelineData.length > 0 && (
            <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Night Safety Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      {/* Zone Backgrounds */}
                      <ReferenceArea y1={0} y2={70} fill="#ef4444" fillOpacity={0.15} />
                      <ReferenceArea y1={70} y2={90} fill="#f97316" fillOpacity={0.1} />
                      <ReferenceArea y1={90} y2={180} fill="#22c55e" fillOpacity={0.05} />
                      <ReferenceArea y1={180} y2={300} fill="#eab308" fillOpacity={0.1} />
                      
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      
                      <XAxis
                        dataKey="timeLabel"
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                        tickMargin={8}
                      />
                      
                      <YAxis
                        domain={[40, 250]}
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                        tickFormatter={(value) => `${value}`}
                      />
                      
                      <Tooltip content={<CustomTooltip />} />
                      
                      {/* Threshold Lines */}
                      <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <ReferenceLine y={90} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <ReferenceLine y={180} stroke="#eab308" strokeDasharray="3 3" strokeOpacity={0.5} />
                      
                      {/* Prediction Line */}
                      <Line
                        type="monotone"
                        dataKey="glucose"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-500/30" />
                    <span className="text-white/60">Danger (&lt;70)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-orange-500/20" />
                    <span className="text-white/60">Caution (70-90)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-500/10" />
                    <span className="text-white/60">Safe (90-180)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-yellow-500/20" />
                    <span className="text-white/60">High (&gt;180)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Caregiver Alert Toggle */}
          <Card className="bg-white/[0.04] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/10 rounded-lg">
                    <Bell className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Alert Caregiver</p>
                    <p className="text-xs text-white/50">
                      {caregiverName 
                        ? `Notify ${caregiverName} if danger detected` 
                        : 'Notify emergency contact if danger detected'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={alertCaregiver}
                  onCheckedChange={setAlertCaregiver}
                  className="data-[state=checked]:bg-rose-500"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Historical Night Safety */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06]">
        <CardHeader className="pb-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full"
          >
            <CardTitle className="text-base font-medium text-white flex items-center gap-2">
              <History className="w-4 h-4 text-white/60" />
              Historical Night Safety
            </CardTitle>
            {showHistory ? (
              <ChevronUp className="w-5 h-5 text-white/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/60" />
            )}
          </button>
        </CardHeader>
        
        {showHistory && (
          <CardContent className="space-y-4">
            {/* Weekly Summary */}
            {overnightStats && (
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <h4 className="text-sm font-medium text-white mb-3">Past Week Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {overnightStats.lowNightsCount}
                    </p>
                    <p className="text-xs text-white/50">Low nights this week</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${
                      overnightStats.dropRate < -20 ? 'text-red-400' : 
                      overnightStats.dropRate < -10 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {overnightStats.dropRate > 0 ? '+' : ''}{overnightStats.dropRate}
                    </p>
                    <p className="text-xs text-white/50">Avg drop rate (mg/dL/hr)</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Recent Night Lows List */}
            {nightLows.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Recent Night Lows</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nightLows.slice(0, 7).map((low, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${
                          low.severity === 'severe' ? 'bg-red-500/20' :
                          low.severity === 'moderate' ? 'bg-orange-500/20' : 'bg-amber-500/20'
                        }`}>
                          <TrendingDown className={`w-4 h-4 ${
                            low.severity === 'severe' ? 'text-red-400' :
                            low.severity === 'moderate' ? 'text-orange-400' : 'text-amber-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm text-white">
                            {format(parseISO(low.date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-white/50">
                            at {format(parseISO(low.timeOfLow), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          low.severity === 'severe' ? 'text-red-400' :
                          low.severity === 'moderate' ? 'text-orange-400' : 'text-amber-400'
                        }`}>
                          {low.lowestGlucose}
                        </p>
                        <span className="text-xs text-white/40">mg/dL</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400/60 mx-auto mb-2" />
                <p className="text-sm text-white/60">No night lows recorded in the last 30 days</p>
                <p className="text-xs text-white/40">Great job keeping your nights safe!</p>
              </div>
            )}
          </CardContent>
        )}
        
        {!showHistory && overnightStats && (
          <CardContent className="pt-0">
            <p className="text-sm text-white/60">
              You've had <span className="text-white font-medium">{overnightStats.lowNightsCount} low nights</span> this week
              {overnightStats.lowNightsCount === 0 && ' - keep up the good work!'}
            </p>
          </CardContent>
        )}
      </Card>
      
      {/* Empty State */}
      {!assessment && !isLoading && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] p-8 text-center">
          <div className="p-4 bg-indigo-500/10 rounded-2xl w-fit mx-auto mb-4">
            <Moon className="w-10 h-10 text-indigo-400/60" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Ready for Bed?</h3>
          <p className="text-sm text-white/50 max-w-md mx-auto">
            Enter your current glucose and planned bedtime to get a personalized 
            night safety assessment with predictions and recommendations.
          </p>
        </Card>
      )}
    </div>
  );
};

export default NightSafetyMonitor;
