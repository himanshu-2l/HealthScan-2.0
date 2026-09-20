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
    <div className="min-h-screen flex flex-col">
      <GlassNavbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Page Header */}
            <div className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="p-5 bg-gradient-to-br from-rose-500/20 to-red-600/20 rounded-2xl border border-rose-500/20 shadow-lg shadow-rose-500/10">
                      <Heart className="w-10 h-10 text-rose-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                      Blood Pressure Tracker
                    </h1>
                    <p className="text-white/50 mt-2 text-lg">
                      Monitor your readings, track trends, and maintain heart health
                    </p>
                  </div>
                </div>
                <Badge className="bg-teal-500/15 text-teal-400 border border-teal-500/25 px-4 py-2 text-sm font-medium rounded-full">
                  <Activity className="w-4 h-4 mr-2" />
                  ABDM Integrated
                </Badge>
              </div>

              {/* BP Ranges Reference - Compact horizontal guide */}
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Sparkles className="w-5 h-5 text-white/40" />
                  <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
                    Blood Pressure Categories
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Normal */}
                  <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" />
                      <span className="text-white font-medium">Normal</span>
                    </div>
                    <span className="text-white/40 text-sm font-mono">&lt;120/80 mmHg</span>
                  </div>

                  {/* Elevated */}
                  <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/30" />
                      <span className="text-white font-medium">Elevated</span>
                    </div>
                    <span className="text-white/40 text-sm font-mono">120-129/&lt;80</span>
                  </div>

                  {/* High Stage 1 */}
                  <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/30" />
                      <span className="text-white font-medium">High Stage 1</span>
                    </div>
                    <span className="text-white/40 text-sm font-mono">130-139/80-89</span>
                  </div>

                  {/* High Stage 2 */}
                  <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
                      <span className="text-white font-medium">High Stage 2</span>
                    </div>
                    <span className="text-white/40 text-sm font-mono">≥140/≥90</span>
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
