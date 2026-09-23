/**
 * Doctor Report Page
 * Generate and share health reports with your physician
 */

import React from 'react';
import { MobileBottomNav } from '@/components/pwa/MobileBottomNav';
import { DoctorReport } from '@/components/DoctorReport';
import { Badge } from '@/components/ui/badge';
import { FileText, Share2 } from 'lucide-react';
import { SubPageHeader } from '@/components/pwa/SubPageHeader';

export default function DoctorReportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <SubPageHeader backLabel="Back to Records" backTo="/app?tab=records" category="Clinical Report Brief" />

      <main className="flex-1 py-6 pb-24 md:pb-12">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 overflow-x-hidden">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-teal-500/10 dark:bg-teal-500/20 rounded-2xl border border-teal-500/20 text-teal-600 dark:text-teal-400">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Physician Health Report
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                    Export and share consolidated clinical metrics with your doctor
                  </p>
                </div>
              </div>
              <Badge className="bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/30 px-3 py-1.5 text-xs font-semibold rounded-full">
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Clinical Export
              </Badge>
            </div>

            {/* Main Content - DoctorReport */}
            <DoctorReport />
          </div>
        </div>
      </main>

      {/* Modern PWA Mobile Navigation Dock */}
      <MobileBottomNav
        activeTab="records"
        onTabChange={(tab) => navigate(tab === 'today' ? '/app' : `/app?tab=${tab}`)}
        onQuickScanClick={() => navigate('/app')}
      />
    </div>
  );
}
