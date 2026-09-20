import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import SymptomChecker from '../components/SymptomChecker';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Sparkles, AlertCircle } from 'lucide-react';

export default function SymptomCheckerPage() {
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
                    <div className="p-5 bg-gradient-to-br from-teal-500/20 to-cyan-600/20 rounded-2xl border border-teal-500/20 shadow-lg shadow-teal-500/10">
                      <Stethoscope className="w-10 h-10 text-teal-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                      AI Symptom Checker
                    </h1>
                    <p className="text-white/50 mt-2 text-lg">
                      Describe your symptoms and get AI-powered insights
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="bg-teal-500/15 text-teal-400 border border-teal-500/25 px-4 py-2 text-sm font-medium rounded-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Powered
                  </Badge>
                  <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/25 px-4 py-2 text-sm font-medium rounded-full">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Not a Diagnosis
                  </Badge>
                </div>
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
