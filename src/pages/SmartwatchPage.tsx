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
                    <div className="p-5 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10">
                      <Watch className="w-10 h-10 text-purple-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                      Smartwatch & Wearables
                    </h1>
                    <p className="text-white/50 mt-2 text-lg">
                      Connect and manage your wearable devices
                    </p>
                  </div>
                </div>
                <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/25 px-4 py-2 text-sm font-medium rounded-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync
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
