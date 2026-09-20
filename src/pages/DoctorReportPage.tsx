/**
 * Doctor Report Page
 * Generate and share health reports with your physician
 */

import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { DoctorReport } from '@/components/DoctorReport';
import { Badge } from '@/components/ui/badge';
import { FileText, Share2 } from 'lucide-react';

export default function DoctorReportPage() {
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
                      <FileText className="w-10 h-10 text-teal-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                      Doctor Report
                    </h1>
                    <p className="text-white/50 mt-2 text-lg">
                      Generate and share health reports with your physician
                    </p>
                  </div>
                </div>
                <Badge className="bg-teal-500/15 text-teal-400 border border-teal-500/25 px-4 py-2 text-sm font-medium rounded-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Shareable
                </Badge>
              </div>
            </div>

            {/* Main Content - DoctorReport */}
            <DoctorReport />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
