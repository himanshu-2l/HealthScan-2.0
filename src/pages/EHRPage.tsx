/**
 * EHR Integration Page
 * Displays EHR integration, medical history, and health data management
 */

import React from 'react';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { EHRIntegration } from '@/components/EHRIntegration';
import { useEHR } from '@/contexts/EHRContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, TrendingUp, Users, FileText, Hospital, Lock, Link as LinkIcon } from 'lucide-react';

export const EHRPage: React.FC = () => {
  const { isAuthenticated } = useEHR();

  const features = [
    {
      icon: Hospital,
      title: "ABDM Integration",
      description: "Connect to India's national health infrastructure seamlessly",
      colorClass: "bg-teal-500/20 text-teal-400"
    },
    {
      icon: Lock,
      title: "Secure Storage",
      description: "Your health data is encrypted and stored securely",
      colorClass: "bg-emerald-500/20 text-emerald-400"
    },
    {
      icon: TrendingUp,
      title: "Track Trends",
      description: "Monitor your health metrics over time with insights",
      colorClass: "bg-cyan-500/20 text-cyan-400"
    },
    {
      icon: Users,
      title: "Share with Doctors",
      description: "Seamlessly share results with healthcare providers",
      colorClass: "bg-sky-500/20 text-sky-400"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <GlassNavbar />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-8 pt-24 pb-12 flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Page Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <div className="p-3.5 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/30 rounded-2xl">
                <FileText className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Electronic Health Records (EHR)
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Securely manage and sync your longitudinal health data via Ayushman Bharat Digital Mission (ABDM)
            </p>
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <Badge className="bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/30 px-3 py-1 font-semibold text-xs rounded-full">
                <Shield className="w-3.5 h-3.5 mr-1" />
                ABDM Compliant
              </Badge>
              <Badge className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/30 px-3 py-1 font-semibold text-xs rounded-full">
                <Shield className="w-3.5 h-3.5 mr-1" />
                ABHA Health ID
              </Badge>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 hover:border-teal-400/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl ${feature.colorClass} flex items-center justify-center mb-3.5`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-slate-900 dark:text-white font-bold text-sm sm:text-base mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Connection Status Strip */}
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-slate-900 dark:text-white font-bold text-sm">Active ABDM Gateway Session</span>
                  <Badge className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/30 text-xs">
                    Connected
                  </Badge>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">ABHA Gateway Standby</span>
                  <Badge className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/30 text-xs">
                    Offline
                  </Badge>
                </>
              )}
            </div>
            {!isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                className="bg-teal-50 dark:bg-teal-950/20 border-teal-200/80 dark:border-teal-800/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100 rounded-xl font-semibold text-xs"
                onClick={() => {
                  document.getElementById('ehr-integration')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                Authenticate ABHA
              </Button>
            )}
          </div>

          {/* Main Content */}
          <div id="ehr-integration" className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Clinical Records & Data Locker
            </h2>
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6">
              <EHRIntegration />
            </div>
          </div>

        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
};
