/**
 * Doctor Report Page
 * Generate and share health reports with your physician
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileBottomNav } from '@/components/pwa/MobileBottomNav';
import { DoctorReport } from '@/components/DoctorReport';
import { Badge } from '@/components/ui/badge';
import { FileText, Share2, ArrowLeft } from 'lucide-react';

export default function DoctorReportPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Canonical Modern Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070A11]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] pt-[env(safe-area-inset-top,0px)] transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/app?tab=records')}
            aria-label="Back to Health Records"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] text-sm font-semibold text-slate-700 dark:text-slate-200 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Records</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">Clinical Report Brief</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-[10px]">
              HS
            </div>
          </div>
        </div>
      </header>

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
