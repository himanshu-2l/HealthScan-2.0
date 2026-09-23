/**
 * Recommendations Page
 * AI-generated health and lifestyle recommendations
 */

import { SubPageHeader } from '@/components/pwa/SubPageHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { PersonalizedRecommendations } from '@/components/PersonalizedRecommendations';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export default function RecommendationsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <SubPageHeader backLabel="Back to Today" backTo="/app?tab=today" category="Lifestyle Plan" />

      <main className="flex-1 py-6 pb-24 md:pb-12">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Page Header */}
            <div className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="p-5 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                      <Sparkles className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Personalized Recommendations
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                      AI-generated health and lifestyle recommendations
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/30 px-4 py-2 text-sm font-medium rounded-full shadow-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Personalized
                </Badge>
              </div>
            </div>

            {/* Main Content - PersonalizedRecommendations */}
            <PersonalizedRecommendations />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
