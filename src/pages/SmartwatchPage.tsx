/**
 * Smartwatch Page
 * Connect and manage wearable devices
 */

import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { SmartwatchSupport } from '@/components/SmartwatchSupport';
import { Badge } from '@/components/ui/badge';
import { Watch, RefreshCw } from 'lucide-react';

export default function SmartwatchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <GlassNavbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
                    <Watch className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Smartwatch & Wearables
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1.5 text-base sm:text-lg">
                      Connect and sync continuous telemetry from your health devices
                    </p>
                  </div>
                </div>
                <Badge className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 px-4 py-2 text-sm font-medium rounded-full shadow-xs">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Auto-Sync Active
                </Badge>
              </div>
            </div>

            {/* Main Content - SmartwatchSupport */}
            <SmartwatchSupport />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
