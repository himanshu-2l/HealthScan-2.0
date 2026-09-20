import { Syringe, Shield } from 'lucide-react';
import VaccinationRecords from '../components/VaccinationRecords';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { Badge } from '@/components/ui/badge';

export default function VaccinationPage() {
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
                    <div className="p-5 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                      <Syringe className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                      Vaccination Records
                    </h1>
                    <p className="text-white/50 mt-2 text-lg">
                      Track and manage your immunization history
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-4 py-2 text-sm font-medium rounded-full">
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
