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
    <div className="min-h-screen flex flex-col">
      <GlassNavbar />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-8 pt-24 pb-8 flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Page Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-teal-500/20 rounded-full">
                <FileText className="w-10 h-10 text-teal-400" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Electronic Health Records
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Securely manage and share your health data with ABDM integration
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Badge className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.1] text-teal-400 px-3 py-1.5">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                ABDM Integrated
              </Badge>
              <Badge className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.1] text-emerald-400 px-3 py-1.5">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Government Approved
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
                  className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full ${feature.colorClass} flex items-center justify-center mb-4`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Connection Status Strip */}
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-white font-medium">Connected to ABDM</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Active
                  </Badge>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                  <span className="text-white/60 font-medium">Not connected</span>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    Disconnected
                  </Badge>
                </>
              )}
            </div>
            {!isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/50"
                onClick={() => {
                  // Scroll to EHRIntegration component
                  document.getElementById('ehr-integration')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Connect Now
              </Button>
            )}
          </div>

          {/* Main Content */}
          <div id="ehr-integration" className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              Health Records Management
            </h2>
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6">
              <EHRIntegration />
            </div>
          </div>

        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
};
