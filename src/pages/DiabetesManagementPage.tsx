/**
 * Diabetes Management Page
 * Comprehensive tools for monitoring and managing diabetes
 * Redesigned with 9 tabs, top summary strip, and floating emergency button
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Droplet,
  Shield,
  UtensilsCrossed,
  Pill,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Bell,
  Sparkles,
  Calculator,
  Moon,
  Target,
  Users,
  Syringe,
  Brain,
  Heart,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  Share2,
} from 'lucide-react';

// Import all diabetes components
import { GlucoseTracker } from '@/components/GlucoseTracker';
import { DiabeticRiskCalculator } from '@/components/DiabeticRiskCalculator';
import { MealPlanner } from '@/components/MealPlanner';
import { InsulinReminder } from '@/components/InsulinReminder';
import { EarlyWarningAlerts } from '@/components/EarlyWarningAlerts';

// Import new diabetes components
import { IOBCalculator } from '@/components/diabetes/IOBCalculator';
import { SmartDoseRecommendation } from '@/components/diabetes/SmartDoseRecommendation';
import { NightSafetyMonitor } from '@/components/diabetes/NightSafetyMonitor';
import { GlucosePredictionChart } from '@/components/diabetes/GlucosePredictionChart';
import { PatternAnalysis } from '@/components/diabetes/PatternAnalysis';
import { EmergencyHypoAlert, EmergencyButton } from '@/components/diabetes/EmergencyHypoAlert';
import { HbA1cEstimator } from '@/components/diabetes/HbA1cEstimator';
import { CaregiverView } from '@/components/diabetes/CaregiverView';

// Import services
import { calculateIOB, getInsulinDoses } from '@/services/iobService';
import { getAllGlucoseReadings, estimateHbA1c, GlucoseReading } from '@/services/glucoseService';
import { getLatestGlucose, getTrendRateFromReadings } from '@/services/glucosePredictionService';

// Tab definitions with icons
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'dose', label: 'Dose Calculator', icon: Calculator },
  { id: 'predictions', label: 'Predictions', icon: Brain },
  { id: 'meal', label: 'Meal Plan', icon: UtensilsCrossed },
  { id: 'night', label: 'Night Safety', icon: Moon },
  { id: 'meds', label: 'Medications', icon: Pill },
  { id: 'risk', label: 'Risk & Alerts', icon: AlertTriangle },
  { id: 'hba1c', label: 'HbA1c', icon: Target },
  { id: 'caregiver', label: 'Caregiver', icon: Users },
];

// Summary data interface
interface SummaryData {
  currentIOB: number;
  latestGlucose: number | null;
  glucoseTrend: 'rising' | 'falling' | 'stable';
  estimatedHbA1c: number | null;
}

export default function DiabetesManagementPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    currentIOB: 0,
    latestGlucose: null,
    glucoseTrend: 'stable',
    estimatedHbA1c: null,
  });

  // Load summary data
  const loadSummaryData = useCallback(() => {
    // Get IOB
    const doses = getInsulinDoses();
    const iob = calculateIOB(doses);

    // Get latest glucose
    const readings = getAllGlucoseReadings();
    let latestGlucose: number | null = null;
    if (readings.length > 0) {
      const latest = readings[0];
      latestGlucose = latest.fasting || latest.postMeal || null;
    }

    // Get glucose trend
    const trendRate = getTrendRateFromReadings();
    let glucoseTrend: 'rising' | 'falling' | 'stable' = 'stable';
    if (trendRate !== undefined) {
      if (trendRate > 5) glucoseTrend = 'rising';
      else if (trendRate < -5) glucoseTrend = 'falling';
    }

    // Get HbA1c estimate
    const hba1cEstimate = estimateHbA1c();

    setSummaryData({
      currentIOB: Math.round(iob * 10) / 10,
      latestGlucose,
      glucoseTrend,
      estimatedHbA1c: hba1cEstimate.value > 0 ? hba1cEstimate.value : null,
    });
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    loadSummaryData();
    const interval = setInterval(loadSummaryData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [loadSummaryData]);

  // Get glucose color
  const getGlucoseColor = (glucose: number | null): string => {
    if (glucose === null) return 'text-slate-400 dark:text-white/40';
    if (glucose < 70) return 'text-rose-600 dark:text-rose-400';
    if (glucose < 90) return 'text-amber-600 dark:text-amber-400';
    if (glucose <= 180) return 'text-emerald-600 dark:text-emerald-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  // Get IOB color
  const getIOBColor = (iob: number): string => {
    if (iob < 2) return 'text-emerald-600 dark:text-emerald-400';
    if (iob <= 5) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  // Get HbA1c color
  const getHbA1cColor = (hba1c: number | null): string => {
    if (hba1c === null) return 'text-slate-400 dark:text-white/40';
    if (hba1c < 5.7) return 'text-emerald-600 dark:text-emerald-400';
    if (hba1c < 6.5) return 'text-teal-600 dark:text-teal-400';
    if (hba1c < 7.0) return 'text-blue-600 dark:text-blue-400';
    if (hba1c < 8.0) return 'text-amber-600 dark:text-amber-400';
    if (hba1c < 10.0) return 'text-orange-600 dark:text-orange-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab summaryData={summaryData} onTriggerEmergency={() => setShowEmergencyAlert(true)} />;
      case 'dose':
        return (
          <div className="space-y-6">
            <SmartDoseRecommendation onDoseLogged={loadSummaryData} />
            <IOBCalculator />
          </div>
        );
      case 'predictions':
        return (
          <div className="space-y-6">
            <GlucosePredictionChart />
            <PatternAnalysis />
          </div>
        );
      case 'meal':
        return <MealPlanner />;
      case 'night':
        return <NightSafetyMonitor />;
      case 'meds':
        return <InsulinReminder />;
      case 'risk':
        return (
          <div className="space-y-6">
            <DiabeticRiskCalculator />
            <EarlyWarningAlerts />
            <EmergencyHypoAlert isActive={showEmergencyAlert} onDismiss={() => setShowEmergencyAlert(false)} />
          </div>
        );
      case 'hba1c':
        return <HbA1cEstimator />;
      case 'caregiver':
        return <CaregiverTab />;
      default:
        return <DashboardTab summaryData={summaryData} onTriggerEmergency={() => setShowEmergencyAlert(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <GlassNavbar />

      <main className="container mx-auto px-3 sm:px-4 lg:px-8 pt-24 pb-20 flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Metabolic & Diabetes Management
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-lg">
                  Clinical tools for glycemic monitoring, insulin dosing, and nocturnal hypoglycemia prevention
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/30">
                <Sparkles className="w-3.5 h-3.5" />
                Adaptive AI Engine
              </span>
            </div>
          </div>

          {/* Top Summary Strip - Always Visible, Horizontal Scroll on Mobile */}
          <div className="overflow-x-auto scrollbar-hide -mx-3 sm:mx-0">
            <div className="flex gap-3 px-3 sm:px-0 min-w-max sm:min-w-0 sm:grid sm:grid-cols-4">
              {/* Current IOB */}
              <div className="flex-shrink-0 w-[160px] sm:w-auto bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Syringe className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Active Insulin (IOB)</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black ${getIOBColor(summaryData.currentIOB)}`}>
                    {summaryData.currentIOB.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">units</span>
                </div>
              </div>

              {/* Latest Glucose */}
              <div className="flex-shrink-0 w-[160px] sm:w-auto bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Latest Glucose</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black ${getGlucoseColor(summaryData.latestGlucose)}`}>
                    {summaryData.latestGlucose ?? '--'}
                  </span>
                  {summaryData.latestGlucose && (
                    <span className="text-xs text-slate-500 font-medium">mg/dL</span>
                  )}
                </div>
              </div>

              {/* Predicted Trend */}
              <div className="flex-shrink-0 w-[160px] sm:w-auto bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-lg">
                    {summaryData.glucoseTrend === 'rising' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : summaryData.glucoseTrend === 'falling' ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Glycemic Trend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-2xl font-black ${
                    summaryData.glucoseTrend === 'rising' 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : summaryData.glucoseTrend === 'falling' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {summaryData.glucoseTrend === 'rising' && <ArrowUp className="w-5 h-5 inline" />}
                    {summaryData.glucoseTrend === 'falling' && <ArrowDown className="w-5 h-5 inline" />}
                    {summaryData.glucoseTrend === 'stable' && '→'}
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 capitalize">{summaryData.glucoseTrend}</span>
                </div>
              </div>

              {/* Estimated HbA1c */}
              <div className="flex-shrink-0 w-[160px] sm:w-auto bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-lg">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Estimated HbA1c</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black ${getHbA1cColor(summaryData.estimatedHbA1c)}`}>
                    {summaryData.estimatedHbA1c?.toFixed(1) ?? '--'}
                  </span>
                  {summaryData.estimatedHbA1c && (
                    <span className="text-xs text-slate-500 font-medium">%</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation - Horizontal Scrollable */}
          <div className="overflow-x-auto scrollbar-hide -mx-3 sm:mx-0">
            <div className="flex gap-2 px-3 sm:px-0 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap min-w-fit ${
                    activeTab === tab.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Floating Emergency Button */}
      <EmergencyButton onClick={() => setShowEmergencyAlert(true)} />

      {/* Emergency Alert Overlay */}
      {showEmergencyAlert && (
        <EmergencyHypoAlert 
          isActive={showEmergencyAlert} 
          onDismiss={() => setShowEmergencyAlert(false)} 
        />
      )}

      <SiteFooter />
    </div>
  );
}

// ============================================
// Dashboard Tab Component
// ============================================

interface DashboardTabProps {
  summaryData: SummaryData;
  onTriggerEmergency: () => void;
}

function DashboardTab({ summaryData, onTriggerEmergency }: DashboardTabProps) {
  const hba1cEstimate = useMemo(() => estimateHbA1c(), []);
  
  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* IOB Summary */}
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Insulin</span>
              <Syringe className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {summaryData.currentIOB.toFixed(1)}
              <span className="text-xs font-normal text-slate-500 ml-1">units</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              {summaryData.currentIOB < 2 
                ? 'Low IOB - Safe to dose' 
                : summaryData.currentIOB <= 5 
                  ? 'Moderate - Monitor closely' 
                  : 'High - Stacking risk'}
            </p>
          </CardContent>
        </Card>

        {/* Latest Glucose */}
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Latest Glucose</span>
              <Droplet className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {summaryData.latestGlucose ?? '--'}
              {summaryData.latestGlucose && (
                <span className="text-xs font-normal text-slate-500 ml-1">mg/dL</span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              {summaryData.latestGlucose === null 
                ? 'No recent readings' 
                : summaryData.latestGlucose < 70 
                  ? 'Low - Take action' 
                  : summaryData.latestGlucose <= 180 
                    ? 'In target range' 
                    : 'Above target'}
            </p>
          </CardContent>
        </Card>

        {/* Estimated HbA1c */}
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Est. HbA1c</span>
              <Target className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {hba1cEstimate.value > 0 ? hba1cEstimate.value.toFixed(1) : '--'}
              {hba1cEstimate.value > 0 && (
                <span className="text-xs font-normal text-slate-500 ml-1">%</span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              {hba1cEstimate.value > 0 
                ? `${hba1cEstimate.readingsCount} readings used` 
                : 'Log readings to estimate'}
            </p>
          </CardContent>
        </Card>

        {/* Emergency Action */}
        <Card className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Hypoglycemia SOS</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <button
              onClick={onTriggerEmergency}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              Trigger SOS Alert
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
              Emergency assistance protocol
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Glucose Prediction Chart - Compact */}
      <GlucosePredictionChart />

      {/* HbA1c Estimator - Compact */}
      <HbA1cEstimator />
    </div>
  );
}

// ============================================
// Caregiver Tab Component
// ============================================

function CaregiverTab() {
  const [caregiverLink, setCaregiverLink] = useState('');

  useEffect(() => {
    // Generate a shareable link for caregivers
    // In a real app, this would be a unique patient ID from the backend
    const patientId = 'patient-' + Date.now().toString(36);
    const baseUrl = window.location.origin;
    setCaregiverLink(`${baseUrl}/caregiver/${patientId}`);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(caregiverLink);
  };

  return (
    <div className="space-y-6">
      {/* Caregiver Setup Section */}
      <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Share Telemetry with Caregivers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5 sm:p-6 pt-2">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Share this link with family members or caregivers so they can monitor your glucose levels remotely in real time.
            They will have read-only access to your biometric readings.
          </p>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={caregiverLink}
              readOnly
              className="flex-1 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate"
            />
            <button
              onClick={copyLink}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm"
            >
              Copy Link
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Caregivers can only view telemetry, not modify clinical data</span>
          </div>
        </CardContent>
      </Card>

      {/* Caregiver View */}
      <CaregiverView />
    </div>
  );
}
