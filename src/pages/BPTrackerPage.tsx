/**
 * BP Tracker Page
 * Dedicated full-page view for Blood Pressure tracking
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileBottomNav } from '@/components/pwa/MobileBottomNav';
import { BPTracker } from '@/components/BPTracker';
import { Badge } from '@/components/ui/badge';
import { Heart, Activity, Sparkles, ArrowLeft } from 'lucide-react';

export default function BPTrackerPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Canonical Modern Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070A11]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] pt-[env(safe-area-inset-top,0px)] transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/app?tab=care')}
            aria-label="Back to Chronic Care Hub"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] text-sm font-semibold text-slate-700 dark:text-slate-200 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Care</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">Blood Pressure Monitor</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-[10px]">
              HS
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6 pb-24 md:pb-12">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-rose-500/10 dark:bg-rose-500/20 rounded-2xl border border-rose-500/20 text-rose-600 dark:text-rose-400">
                    <Heart className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      Cardiovascular BP Monitor
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                      Monitor arterial pressure, track longitudinal trends, and maintain heart health
                    </p>
                  </div>
                </div>
                <Badge className="bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/30 px-3 py-1.5 text-xs font-semibold rounded-full">
                  <Activity className="w-3.5 h-3.5 mr-1.5" />
                  ABHA Connected
                </Badge>
              </div>

              {/* BP Ranges Reference - Compact clinical guide */}
              <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    AHA Blood Pressure Diagnostic Reference
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Normal */}
                  <div className="bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-200/60 dark:border-emerald-800/30 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">Normal</span>
                    </div>
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-mono font-medium">&lt;120 / &lt;80 mmHg</span>
                  </div>

                  {/* Elevated */}
                  <div className="bg-amber-50/40 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-800/30 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm">Elevated</span>
                    </div>
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-mono font-medium">120-129 / &lt;80</span>
                  </div>

                  {/* High Stage 1 */}
                  <div className="bg-orange-50/40 dark:bg-orange-950/15 border border-orange-200/60 dark:border-orange-800/30 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <span className="text-orange-800 dark:text-orange-300 font-bold text-xs sm:text-sm">Stage 1 HTN</span>
                    </div>
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-mono font-medium">130-139 / 80-89</span>
                  </div>

                  {/* High Stage 2 */}
                  <div className="bg-rose-50/40 dark:bg-rose-950/15 border border-rose-200/60 dark:border-rose-800/30 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-rose-800 dark:text-rose-300 font-bold text-xs sm:text-sm">Stage 2 HTN</span>
                    </div>
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-mono font-medium">≥140 / ≥90</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - BPTracker */}
            <BPTracker />
          </div>
        </div>
      </main>

      {/* Modern PWA Mobile Navigation Dock */}
      <MobileBottomNav
        activeTab="care"
        onTabChange={(tab) => navigate(tab === 'today' ? '/app' : `/app?tab=${tab}`)}
        onQuickScanClick={() => navigate('/app')}
      />
    </div>
  );
}
