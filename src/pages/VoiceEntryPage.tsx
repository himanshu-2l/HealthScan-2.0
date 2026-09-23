/**
 * Voice Entry Page
 * Speak to record health readings hands-free
 */

import { SubPageHeader } from '@/components/pwa/SubPageHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { VoiceDataEntry } from '@/components/VoiceDataEntry';
import { Badge } from '@/components/ui/badge';
import { Mic, Wand2 } from 'lucide-react';

export default function VoiceEntryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <SubPageHeader backLabel="Back to Today" backTo="/app?tab=today" category="Speech to Vitals" />

      <main className="flex-1 py-6 pb-24 md:pb-12">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Page Header */}
            <div className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="p-5 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/10">
                      <Mic className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Voice Entry
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                      Speak to record your health readings
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/30 px-4 py-2 text-sm font-medium rounded-full shadow-sm">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Hands-free
                </Badge>
              </div>
            </div>

            {/* Main Content - VoiceDataEntry */}
            <VoiceDataEntry />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
