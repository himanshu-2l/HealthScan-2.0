import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import SymptomChecker from '../components/SymptomChecker';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Sparkles, AlertCircle } from 'lucide-react';

export default function SymptomCheckerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <GlassNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 overflow-x-hidden">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-teal-500/10 dark:bg-teal-500/20 rounded-2xl border border-teal-500/20 text-teal-600 dark:text-teal-400">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    AI Symptom Assessment
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                    Describe your physical sensations for guided triage and clinical recommendations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/30 px-3 py-1.5 text-xs font-semibold rounded-full">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Clinical AI
                </Badge>
                <Badge className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/30 px-3 py-1.5 text-xs font-semibold rounded-full">
                  <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                  Preliminary Triage
                </Badge>
              </div>
            </div>

            {/* Main Content - SymptomChecker */}
            <SymptomChecker />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
