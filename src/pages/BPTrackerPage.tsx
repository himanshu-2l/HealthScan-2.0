/**
 * BP Tracker Page
 * Dedicated full-page view for Blood Pressure tracking
 */

import React from 'react';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { BPTracker } from '@/components/BPTracker';
import { Badge } from '@/components/ui/badge';
import { Heart, Activity, Sparkles } from 'lucide-react';

export default function BPTrackerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <GlassNavbar />

      <main className="flex-1 pt-24 pb-16">
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

      <SiteFooter />
    </div>
  );
}
