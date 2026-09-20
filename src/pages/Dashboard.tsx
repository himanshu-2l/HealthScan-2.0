/**
 * Dashboard Page
 * Main health dashboard with modern glassmorphism design inspired by Reclaim AI / Resend
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { GoogleFitIntegration } from '@/components/GoogleFitIntegration';
import { CardSkeleton, ChartSkeleton, ListSkeleton } from '@/components/LoadingState';
import {
  Activity,
  Heart,
  Droplet,
  TestTube,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  User,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Mic,
  Stethoscope,
  Phone,
  HeartPulse,
  Zap,
  Smile,
} from 'lucide-react';
import { HealthScore, HealthTestResult } from '../types/health';
import { calculateHealthScore } from '../services/healthScoreService';
import { getRecentResults, getAllResults } from '../services/healthDataService';
import { getAllBPReadings, getBPCategory, calculateBPStats, BPReading } from '../services/bpService';
import { getCurrentCyclePhase, getDailyBriefing } from '../services/hormonalHealthService';
import { CyclePhaseInfo, DailyBriefing } from '../types/hormonal';

// Glass card base styles
const glassCardStyles = "bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl";

export default function Dashboard() {
  const navigate = useNavigate();
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [recentResults, setRecentResults] = useState<HealthTestResult[]>([]);
  const [bpReadings, setBpReadings] = useState<BPReading[]>([]);
  const [cyclePhase, setCyclePhase] = useState<CyclePhaseInfo | null>(null);
  const [dailyBriefing, setDailyBriefing] = useState<DailyBriefing | null>(null);
  const [hasPeriodData, setHasPeriodData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('7days');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    try {
      const score = calculateHealthScore();
      setHealthScore(score);

      const recent = getRecentResults(6);
      setRecentResults(recent);

      const bp = getAllBPReadings();
      setBpReadings(bp);

      // Load hormonal health data
      try {
        const phase = getCurrentCyclePhase();
        const briefing = getDailyBriefing();
        setCyclePhase(phase);
        setDailyBriefing(briefing);
        setHasPeriodData(true);
      } catch (error) {
        // No period data yet
        setHasPeriodData(false);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const allResults = getAllResults();
  const hasAnyData = allResults.length > 0 || bpReadings.length > 0;
  const completedTests = allResults.length;

  // Get latest BP reading and status
  const latestBP = bpReadings[0];
  const bpStatus = latestBP ? getBPCategory(latestBP.systolic, latestBP.diastolic) : null;

  // Format current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-white/40" />;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 65) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 65) return 'bg-yellow-500/20 border-yellow-500/30';
    if (score >= 50) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getBPStatusColor = (severity?: string): string => {
    switch (severity) {
      case 'normal': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'elevated': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high-stage1': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'high-stage2':
      case 'crisis': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'menstrual': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'follicular': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'ovulation': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case 'luteal': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  const getPhaseLabel = (phase: string): string => {
    switch (phase) {
      case 'menstrual': return 'Menstrual';
      case 'follicular': return 'Follicular';
      case 'ovulation': return 'Ovulation';
      case 'luteal': return 'Luteal';
      default: return 'Unknown';
    }
  };

  const getEnergyLabel = (level: number): string => {
    const labels: Record<number, string> = {
      1: 'Very Low',
      2: 'Low',
      3: 'Moderate',
      4: 'High',
      5: 'Very High',
    };
    return labels[level] || 'Moderate';
  };

  const getMoodLabel = (level: number): string => {
    const labels: Record<number, string> = {
      1: 'Very Low',
      2: 'Low',
      3: 'Neutral',
      4: 'Good',
      5: 'Great',
    };
    return labels[level] || 'Neutral';
  };

  const calculateDaysUntilNextPeriod = (): number => {
    if (!cyclePhase) return 0;
    const { cycleDay, totalCycleDays } = cyclePhase;
    return totalCycleDays - cycleDay + 1;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getTestTypeLabel = (testType: string): string => {
    const labels: Record<string, string> = {
      'digit-span': 'Digit Span',
      'word-list-recall': 'Word List Recall',
      'alzheimers': "Alzheimer's Assessment",
      'parkinsons': "Parkinson's Assessment",
      'epilepsy': 'Epilepsy Assessment',
      'cognitive': 'Cognitive Assessment',
      'voice': 'Voice Analysis',
      'eye': 'Eye Test',
      'motor': 'Motor Test',
      'cardiovascular-test': 'Cardiovascular Test',
      'mental-health-assessment': 'Mental Health Assessment',
      'vision-test': 'Vision Test',
      'hearing-test': 'Hearing Test',
      'lifestyle-survey': 'Lifestyle Survey',
    };
    return labels[testType] || testType;
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <GlassNavbar />
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 pt-24 pb-8 flex-1 overflow-x-hidden">
          {/* Header skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-white/10 rounded w-48 mb-2" />
            <div className="h-4 bg-white/5 rounded w-64" />
          </div>

          {/* Stat cards skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>

          {/* Chart skeleton */}
          <ChartSkeleton className="mb-6" />

          {/* Bottom section skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ListSkeleton rows={4} />
            <CardSkeleton />
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  // Empty State for First-Time Users
  if (!hasAnyData) {
    return (
      <div className="min-h-screen flex flex-col">
        <GlassNavbar />
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 pt-24 pb-8 flex-1 flex items-center justify-center overflow-x-hidden">
          <div className={`${glassCardStyles} p-12 max-w-lg text-center`}>
            {/* Icon composition */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-cyan-400" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <Heart className="w-4 h-4 text-green-400" />
              </div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Start Your Health Journey
            </h2>
            <p className="text-white/60 mb-8 leading-relaxed">
              Take your first lab test or record a health reading to get started with personalized health insights and tracking.
            </p>

            <Link to="/labs">
              <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-3 rounded-lg font-medium">
                <TestTube className="w-5 h-5 mr-2" />
                Take Your First Test
              </Button>
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen flex flex-col">
      <GlassNavbar />

      <div className="container mx-auto px-3 sm:px-4 lg:px-8 pt-24 pb-8 flex-1 overflow-x-hidden">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
              <p className="text-white/60 flex items-center gap-2">
                <span>Welcome back</span>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {currentDate}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Top Row — 5 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {/* Health Score Card */}
          <div className={`${glassCardStyles} p-4 sm:p-6`}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`p-2 sm:p-2.5 rounded-lg ${healthScore ? getScoreBgColor(healthScore.overall) : 'bg-white/10'} border`}>
                <Activity className={`w-4 h-4 sm:w-5 sm:h-5 ${healthScore ? getScoreColor(healthScore.overall) : 'text-white/40'}`} />
              </div>
              {healthScore && getTrendIcon(healthScore.trend)}
            </div>
            {healthScore ? (
              <>
                <div className={`text-2xl sm:text-3xl font-bold mb-1 ${getScoreColor(healthScore.overall)}`}>
                  {healthScore.overall}
                </div>
                <p className="text-xs sm:text-sm text-white/60">Health Score</p>
                <Badge variant="outline" className={`mt-2 text-xs ${getScoreBgColor(healthScore.overall)}`}>
                  {healthScore.riskLevel.toUpperCase()} RISK
                </Badge>
              </>
            ) : (
              <div className="text-white/40">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mb-2" />
                <p className="text-xs sm:text-sm">No data yet</p>
              </div>
            )}
          </div>

          {/* Blood Pressure Card */}
          <div className={`${glassCardStyles} p-4 sm:p-6`}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`p-2 sm:p-2.5 rounded-lg ${bpStatus ? getBPStatusColor(bpStatus.severity).split(' ')[0] : 'bg-red-500/20'} border border-red-500/30`}>
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              </div>
            </div>
            {latestBP ? (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {latestBP.systolic}<span className="text-white/40">/</span>{latestBP.diastolic}
                </div>
                <p className="text-xs sm:text-sm text-white/60">Blood Pressure</p>
                <Badge variant="outline" className={`mt-2 text-xs ${getBPStatusColor(bpStatus?.severity)}`}>
                  {bpStatus?.category || 'Unknown'}
                </Badge>
              </>
            ) : (
              <div className="text-white/40">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mb-2" />
                <p className="text-xs sm:text-sm">No data yet</p>
              </div>
            )}
          </div>

          {/* Glucose Level Card */}
          <div className={`${glassCardStyles} p-4 sm:p-6`}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <Droplet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
            </div>
            <div className="text-white/40">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mb-2" />
              <p className="text-xs sm:text-sm">No data yet</p>
              <p className="text-xs text-white/30 mt-1">Glucose Level</p>
            </div>
          </div>

          {/* Lab Tests Card */}
          <div className={`${glassCardStyles} p-4 sm:p-6`}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                <TestTube className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{completedTests}</div>
            <p className="text-xs sm:text-sm text-white/60">Lab Tests</p>
            <p className="text-xs text-white/40 mt-2">{completedTests} completed</p>
          </div>

          {/* Hormonal Health Card */}
          <div className={`${glassCardStyles} p-4 sm:p-6`}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`p-2 sm:p-2.5 rounded-lg ${cyclePhase ? getPhaseColor(cyclePhase.phase).split(' ')[0] : 'bg-pink-500/20'} border ${cyclePhase ? getPhaseColor(cyclePhase.phase).split(' ')[2] : 'border-pink-500/30'}`}>
                <HeartPulse className={`w-4 h-4 sm:w-5 sm:h-5 ${cyclePhase ? getPhaseColor(cyclePhase.phase).split(' ')[1] : 'text-pink-400'}`} />
              </div>
            </div>
            {hasPeriodData && cyclePhase ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-lg sm:text-xl font-bold ${getPhaseColor(cyclePhase.phase).split(' ')[1]}`}>
                    {getPhaseLabel(cyclePhase.phase)}
                  </span>
                  <Badge variant="outline" className={`text-xs ${getPhaseColor(cyclePhase.phase)}`}>
                    Day {cyclePhase.cycleDay}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-white/60 mb-2">
                  Next period in ~{calculateDaysUntilNextPeriod()} days
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs text-white/70">{getEnergyLabel(dailyBriefing?.predictedEnergy || 3)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-white/70">{getMoodLabel(dailyBriefing?.predictedMood || 3)}</span>
                  </div>
                </div>
                <Link to="/period-tracker" className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 mt-3">
                  View Hormonal Health <ChevronRight className="w-3 h-3" />
                </Link>
              </>
            ) : (
              <>
                <div className="text-white/40">
                  <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 mb-2" />
                  <p className="text-xs sm:text-sm">Start tracking your cycle</p>
                </div>
                <Link to="/period-tracker" className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 mt-3">
                  Begin Tracking <ChevronRight className="w-3 h-3" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Smartwatch & Wearables Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Smartwatch & Wearables</h2>
          <div className={`${glassCardStyles} p-6`}>
            <GoogleFitIntegration />
          </div>
        </div>

        {/* Middle Section — Chart Area */}
        <div className={`${glassCardStyles} p-6 mb-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Health Metrics Overview
            </h2>
            <div className="flex items-center gap-2 text-sm">
              {(['7days', '30days', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    timeRange === range
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {range === '7days' ? '7 days' : range === '30days' ? '30 days' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {recentResults.length > 0 || bpReadings.length > 0 ? (
            <div className="h-48 flex items-center justify-center border border-white/5 rounded-lg bg-white/[0.02]">
              {/* Chart placeholder - in real implementation, use Recharts here */}
              <div className="text-center text-white/40">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chart visualization</p>
                <p className="text-xs opacity-60">Data from {recentResults.length + bpReadings.length} records</p>
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center border border-white/5 rounded-lg bg-white/[0.02]">
              <Activity className="w-12 h-12 text-white/20 mb-3" />
              <p className="text-white/60 font-medium">Start tracking to see your trends</p>
              <p className="text-white/40 text-sm mt-1">Take tests and record readings to visualize your health data</p>
            </div>
          )}
        </div>

        {/* Bottom Section — Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Recent Activity / Timeline */}
          <div className={`${glassCardStyles} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Recent Activity
              </h2>
              <Link to="/labs" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {recentResults.length > 0 ? (
              <div className="space-y-3">
                {recentResults.slice(0, 5).map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                      <TestTube className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {getTestTypeLabel(result.testType)}
                      </p>
                      <p className="text-xs text-white/40">{formatDate(result.testDate)}</p>
                    </div>
                    {result.scorePercentage !== undefined && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{Math.round(result.scorePercentage)}%</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 mx-auto text-white/20 mb-3" />
                <p className="text-white/60 text-sm">No recent activity</p>
                <p className="text-white/40 text-xs mt-1">Complete a test to see your activity here</p>
              </div>
            )}
          </div>

          {/* Right: Quick Actions */}
          <div className={`${glassCardStyles} p-6`}>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Quick Actions
            </h2>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Link to="/labs">
                <div className="p-3 sm:p-4 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-cyan-500/30 transition-all cursor-pointer group">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <TestTube className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white">Take a Lab Test</p>
                  <p className="text-[10px] sm:text-xs text-white/40 mt-1">Start assessment</p>
                </div>
              </Link>

              <Link to="/bp-tracker">
                <div className="p-3 sm:p-4 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-red-500/30 transition-all cursor-pointer group">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white">Record BP</p>
                  <p className="text-[10px] sm:text-xs text-white/40 mt-1">Blood pressure</p>
                </div>
              </Link>

              <Link to="/report">
                <div className="p-3 sm:p-4 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-purple-500/30 transition-all cursor-pointer group">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white">View Reports</p>
                  <p className="text-[10px] sm:text-xs text-white/40 mt-1">Health summaries</p>
                </div>
              </Link>

              <Link to="/patient-profile">
                <div className="p-3 sm:p-4 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-green-500/30 transition-all cursor-pointer group">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white">Patient Profile</p>
                  <p className="text-[10px] sm:text-xs text-white/40 mt-1">Your information</p>
                </div>
              </Link>

              <div 
                onClick={() => navigate('/voice-entry')}
                className="p-3 sm:p-4 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-blue-500/30 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-white">Voice Entry</p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-1">Speak your data</p>
              </div>

              <div 
                onClick={() => navigate('/symptom-checker')}
                className="p-3 sm:p-4 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-teal-500/30 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-white">Symptom Check</p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-1">AI assessment</p>
              </div>

              <div 
                onClick={() => navigate('/emergency-contacts')}
                className="p-3 sm:p-4 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-rose-500/30 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-white">Emergency</p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-1">Quick contacts</p>
              </div>

              <div 
                onClick={() => navigate('/health-predictions')}
                className="p-3 sm:p-4 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-amber-500/30 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-white">Health Predictions</p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-1">AI insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
