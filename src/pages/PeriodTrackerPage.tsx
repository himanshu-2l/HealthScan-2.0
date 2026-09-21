/**
 * Hormonal Health Intelligence Hub
 * Comprehensive women's health dashboard with cycle tracking, PCOS screening,
 * mood tracking, pain analysis, skin prediction, and diabetes integration
 */

import React, { Suspense, lazy, useState } from 'react';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar, Brain, Heart, Search, Sparkles, Droplet, HeartPulse } from 'lucide-react';
import PeriodTracker from '@/components/PeriodTracker';

// Lazy load the new components for performance
const CyclePhaseIntelligence = lazy(() => import('@/components/hormonal/CyclePhaseIntelligence'));
const MoodTracker = lazy(() => import('@/components/hormonal/MoodTracker'));
const PainTracker = lazy(() => import('@/components/hormonal/PainTracker'));
const PCOSRiskDetector = lazy(() => import('@/components/hormonal/PCOSRiskDetector'));
const SkinPredictor = lazy(() => import('@/components/hormonal/SkinPredictor'));
const DiabetesCycleIntegration = lazy(() => import('@/components/hormonal/DiabetesCycleIntegration'));

// Loading fallback component
const TabLoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
      <p className="text-white/50 text-sm">Loading...</p>
    </div>
  </div>
);

// Tab definitions with icons
const tabs = [
  { id: 'cycle-intelligence', label: 'Cycle Intelligence', shortLabel: 'Cycle', icon: Activity },
  { id: 'period-log', label: 'Period Log', shortLabel: 'Period', icon: Calendar },
  { id: 'mood-mental', label: 'Mood & Mental Health', shortLabel: 'Mood', icon: Brain },
  { id: 'pain-tracker', label: 'Pain Tracker', shortLabel: 'Pain', icon: Heart },
  { id: 'pcos-screening', label: 'PCOS Screening', shortLabel: 'PCOS', icon: Search },
  { id: 'skin-acne', label: 'Skin & Acne', shortLabel: 'Skin', icon: Sparkles },
  { id: 'diabetes-cycle', label: 'Diabetes & Cycle', shortLabel: 'Diabetes', icon: Droplet },
];

export default function PeriodTrackerPage() {
  const [activeTab, setActiveTab] = useState('cycle-intelligence');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <GlassNavbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-3 sm:px-4 overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="p-5 bg-gradient-to-br from-rose-500/20 to-pink-600/20 rounded-2xl border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <HeartPulse className="w-10 h-10 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Hormonal Health Intelligence
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                    Your cycle is your fifth vital sign. Understand your body's hormonal rhythm.
                  </p>
                </div>
              </div>
              <Badge className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/30 px-4 py-2 text-sm font-medium rounded-full shadow-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered
              </Badge>
            </div>

            {/* Tab Navigation - Horizontal Scrollable */}
            <div className="overflow-x-auto scrollbar-hide -mx-3 sm:mx-0">
              <div className="flex gap-3 px-3 sm:px-0 min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-fit shadow-sm ${
                      activeTab === tab.id
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                        : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-white/60 border border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white/80'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
              {activeTab === 'cycle-intelligence' && (
                <Suspense fallback={<TabLoadingFallback />}>
                  <CyclePhaseIntelligence />
                </Suspense>
              )}
              {activeTab === 'period-log' && <PeriodTracker />}
              {activeTab === 'mood-mental' && (
                <Suspense fallback={<TabLoadingFallback />}>
                  <MoodTracker />
                </Suspense>
              )}
              {activeTab === 'pain-tracker' && (
                <Suspense fallback={<TabLoadingFallback />}>
                  <PainTracker />
                </Suspense>
              )}
              {activeTab === 'pcos-screening' && (
                <Suspense fallback={<TabLoadingFallback />}>
                  <PCOSRiskDetector />
                </Suspense>
              )}
              {activeTab === 'skin-acne' && (
                <Suspense fallback={<TabLoadingFallback />}>
                  <SkinPredictor />
                </Suspense>
              )}
              {activeTab === 'diabetes-cycle' && (
                <Suspense fallback={<TabLoadingFallback />}>
                  <DiabetesCycleIntegration />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
