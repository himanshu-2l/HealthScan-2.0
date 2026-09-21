import { Syringe, Shield } from 'lucide-react';
import VaccinationRecords from '../components/VaccinationRecords';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { Badge } from '@/components/ui/badge';

export default function VaccinationPage() {
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
                    <div className="p-5 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                      <Syringe className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Vaccination Records
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                      Track and manage your immunization history
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/30 px-4 py-2 text-sm font-medium rounded-full shadow-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Immunization Tracker
                </Badge>
              </div>
            </div>

            {/* Main Content */}
            <VaccinationRecords />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
