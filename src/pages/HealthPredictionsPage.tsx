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
                    <div className="p-5 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/10">
                      <TrendingUp className="w-10 h-10 text-amber-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                      Health Predictions
                    </h1>
                    <p className="text-white/50 mt-2 text-lg">
                      AI-powered health trend analysis and risk predictions
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/25 px-4 py-2 text-sm font-medium rounded-full">
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
