/**
 * Health Predictions Page
 * AI-powered health trend analysis and risk predictions
 */

import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { HealthPredictions } from '@/components/HealthPredictions';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Sparkles } from 'lucide-react';

export default function HealthPredictionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <GlassNavbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Page Header */}
            <div className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="p-5 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/10">
                      <TrendingUp className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Health Predictions
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                      AI-powered health trend analysis and risk predictions
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/30 px-4 py-2 text-sm font-medium rounded-full shadow-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Powered
                </Badge>
              </div>
            </div>

            {/* Main Content - HealthPredictions */}
            <HealthPredictions />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
