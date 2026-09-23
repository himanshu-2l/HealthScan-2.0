import React from 'react';
import { Link } from 'react-router-dom';
import { SubPageHeader } from '@/components/pwa/SubPageHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Shield, Cpu, Lightbulb, Smartphone, Heart, Activity, Zap, Target, Users, Stethoscope, ArrowRight } from 'lucide-react';

const Purpose = () => {

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <SubPageHeader backLabel="Back to App" backTo="/" category="Mission & Vision" />
      <main className="container mx-auto px-3 sm:px-4 py-8 pb-24 md:pb-12 flex-1 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-panel border-l-4 border-blue-500">
            <CardHeader className="text-center pb-8 bg-transparent">
              <Lightbulb className="w-16 h-16 mx-auto mb-6 text-blue-500" />
              <CardTitle className="text-4xl font-bold text-foreground">
                The Purpose of Health Scan
              </CardTitle>
              <p className="text-xl text-muted-foreground mt-4">
                Revolutionizing Neurological Screening Through Advanced Hardware & AI Integration
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">ABDM Integrated</Badge>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/20">Government Approved</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-lg text-muted-foreground space-y-6 bg-transparent">
              <p>
                Health Scan represents the evolution from concept to reality—combining our innovative web-based AI platform with the revolutionary <strong className="text-foreground">HealthScan hardware device</strong>. What began as leveraging existing technology has transformed into creating purpose-built, medical-grade hardware for comprehensive health screening.
              </p>
              <p>
                Our mission has expanded to bridge the gap between accessible healthcare and professional-grade diagnostics. The HealthScan device integrates multiple medical sensors with our AI-powered web platform, enabling early detection of neurological conditions like Parkinson's disease, Alzheimer's disease, and epilepsy in primary healthcare settings.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-center">
                <div className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Smartphone className="w-10 h-10 text-blue-500" />
                  <h3 className="font-bold text-foreground">HealthScan Device</h3>
                  <p className="text-sm text-muted-foreground">Professional-grade wearable with 6+ medical sensors and Raspberry Pi Zero processing.</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <Heart className="w-10 h-10 text-green-500" />
                  <h3 className="font-bold text-foreground">Medical-Grade Sensors</h3>
                  <p className="text-sm text-muted-foreground">Heart Rate Sensor AD8232, EMG, motion tracking, temperature, pulse oximetry, and voice analysis capabilities.</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <Brain className="w-10 h-10 text-orange-500" />
                  <h3 className="font-bold text-foreground">AI-Powered Analysis</h3>
                  <p className="text-sm text-muted-foreground">Real-time neurological screening using advanced machine learning algorithms.</p>
                </div>
              </div>

              {/* New Hardware Features Section */}
              <div className="bg-white/5 rounded-lg p-6 mt-8 border-l-4 border-blue-500">
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Revolutionary Hardware Integration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 bg-white/5 p-4 rounded-lg shadow-sm border border-white/10">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <span className="text-foreground font-semibold">Comprehensive Monitoring</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-8">
                      Simultaneous tracking of cardiac rhythm, muscle activity, tremor patterns, and vocal biomarkers for holistic neurological assessment.
                    </p>
                  </div>
                  <div className="space-y-3 bg-white/5 p-4 rounded-lg shadow-sm border border-white/10">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="text-foreground font-semibold">8-10 Hour Battery Life</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-8">
                      Extended continuous operation with USB-C fast charging and intelligent power management for all-day monitoring.
                    </p>
                  </div>
                  <div className="space-y-3 bg-white/5 p-4 rounded-lg shadow-sm border border-white/10">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-green-500" />
                      <span className="text-foreground font-semibold">Early Detection Focus</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-8">
                      Specialized algorithms for identifying early-stage Parkinson's, Alzheimer's, and epilepsy indicators through sensor fusion.
                    </p>
                  </div>
                  <div className="space-y-3 bg-white/5 p-4 rounded-lg shadow-sm border border-white/10">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-cyan-500" />
                      <span className="text-foreground font-semibold">Primary Care Integration</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-8">
                      Designed for seamless integration into primary healthcare workflows with secure data transmission and reporting.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-4 mt-8">
                <p className="text-center text-muted-foreground">
                  <strong className="text-blue-400">Important:</strong> The HealthScan device is currently in development as a proof-of-concept for advanced neurological screening.
                  It represents our vision for the future of accessible, technology-driven healthcare solutions that empower both patients and healthcare providers.
                </p>
              </div>

              <div className="text-center mt-8">
                <p className="text-white/70 mb-4">
                  Experience our current web-based screening capabilities while we develop the full hardware solution.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/labs">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25">
                      Try Web Labs
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/device-model">
                    <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
                      View Device Specs
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Purpose;
