/**
 * Emergency Contacts Page
 * Dedicated full-page view for managing emergency contacts and medical ID
 */

import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { EmergencyContacts } from '@/components/EmergencyContacts';
import { Badge } from '@/components/ui/badge';
import { Phone, Shield } from 'lucide-react';

export default function EmergencyContactsPage() {
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
                    <div className="p-5 bg-gradient-to-br from-rose-500/20 to-red-600/20 rounded-2xl border border-rose-500/20 shadow-lg shadow-rose-500/10">
                      <Phone className="w-10 h-10 text-rose-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                      Emergency Contacts
                    </h1>
                    <p className="text-white/50 mt-2 text-lg">
                      Manage emergency contacts and medical ID
                    </p>
                  </div>
                </div>
                <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/25 px-4 py-2 text-sm font-medium rounded-full">
                  <Shield className="w-4 h-4 mr-2" />
                  SOS Ready
                </Badge>
              </div>
            </div>

            {/* Main Content - EmergencyContacts */}
            <EmergencyContacts />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
