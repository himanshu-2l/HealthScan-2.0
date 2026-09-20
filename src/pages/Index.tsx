import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';

import {
  Activity,
  Brain,
  Eye,
  Mic,
  ArrowRight,
  Stethoscope,
  Heart,
  CheckCircle2,
  Ear,
  Footprints,
  User,
  FileText,
  Shield,
  Cpu,
  Sparkles,
  FlaskConical,
  Lock
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Lab {
  id: string;
  title: string;
  description: string;
  targetCondition: string;
  icon: LucideIcon;
  status: 'ready' | 'coming-soon';
  features: string[];
  color: string;
}

const labs: Lab[] = [
  {
    id: 'voice',
    title: 'Voice & Speech Lab',
    description: 'Analyze vocal patterns, pitch stability, and speech characteristics',
    targetCondition: 'Vocal Biomarkers & Laryngitis',
    icon: Mic,
    status: 'ready',
    features: ['Pitch Analysis', 'Jitter Detection', 'Voice Quality'],
    color: 'green'
  },
  {
    id: 'eye',
    title: 'Eye & Cognition Lab',
    description: 'Test reaction times, visual attention, and cognitive processing',
    targetCondition: "Alzheimer's & Cognitive Decline",
    icon: Eye,
    status: 'ready',
    features: ['Saccade Tests', 'Reaction Time', 'Stroop Test'],
    color: 'amber'
  },
  {
    id: 'motor',
    title: 'Motor & Tremor Lab',
    description: 'Measure movement patterns, tremor frequency, and motor control',
    targetCondition: "Parkinson's & Movement Disorders",
    icon: Activity,
    status: 'ready',
    features: ['Finger Tapping', 'Tremor Analysis', 'Movement Speed'],
    color: 'blue'
  },
  {
    id: 'mental-health',
    title: 'Mental Health Lab',
    description: 'PHQ-9 depression and GAD-7 anxiety screening assessments',
    targetCondition: 'Depression & Anxiety',
    icon: Brain,
    status: 'ready',
    features: ['PHQ-9 Screening', 'GAD-7 Screening', 'Mood Tracking'],
    color: 'purple'
  },
  {
    id: 'vision-hearing',
    title: 'Vision & Hearing Lab',
    description: 'Visual acuity, color blindness, and hearing frequency tests',
    targetCondition: 'Sensory Processing Disorders',
    icon: Ear,
    status: 'ready',
    features: ['Visual Acuity', 'Color Blindness', 'Hearing Test'],
    color: 'cyan'
  }
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  teal: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <div className="min-h-screen flex flex-col">
      <GlassNavbar />
      

      <main className="container mx-auto px-3 sm:px-4 py-8 flex-1 pt-24 overflow-x-hidden">
        {/* Tab Navigation - Glass Pills */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="inline-flex p-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <TabsTrigger 
                value="overview" 
                className="px-6 py-2 rounded-full text-sm font-medium transition-all data-[state=active]:bg-white/[0.10] data-[state=active]:text-white text-white/50"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="labs" 
                className="px-6 py-2 rounded-full text-sm font-medium transition-all data-[state=active]:bg-white/[0.10] data-[state=active]:text-white text-white/50"
              >
                Labs
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="px-6 py-2 rounded-full text-sm font-medium transition-all data-[state=active]:bg-white/[0.10] data-[state=active]:text-white text-white/50"
              >
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-12">
            {/* Hero Section */}
            <div className="text-center max-w-4xl mx-auto py-8 animate-fade-in-up">
              {/* Icon Row */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="p-3 rounded-full bg-teal-500/20 border border-teal-500/30">
                  <Stethoscope className="w-8 h-8 text-teal-400" />
                </div>
                <div className="p-3 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                  <Brain className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
                Health <span className="text-teal-400">Scan</span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed">
                Privacy-first browser lab bench for comprehensive health screening.
                All processing happens securely on your device.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                <Link to="/labs">
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-6 text-lg rounded-xl font-semibold shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02]">
                    <FlaskConical className="w-5 h-5 mr-2" />
                    Launch Labs
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/report">
                  <Button variant="outline" className="border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] text-white px-8 py-6 text-lg rounded-xl font-semibold transition-all">
                    <FileText className="w-5 h-5 mr-2" />
                    View Reports
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Section - Minimal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-1">10</div>
                <div className="text-sm text-white/50">Lab Tests</div>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Cpu className="w-5 h-5 text-teal-400" />
                  <span className="text-xl font-bold text-white">AI Powered</span>
                </div>
                <div className="text-sm text-white/50">On-Device Processing</div>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-xl font-bold text-white">ABDM</span>
                </div>
                <div className="text-sm text-white/50">Integrated</div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="py-8">
              <h2 className="text-2xl font-bold text-white text-center mb-8">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Shield, title: 'Privacy-First', description: 'All processing happens locally on your device. Your data never leaves your browser.', color: 'teal' },
                  { icon: Cpu, title: 'AI-Powered Analysis', description: 'Advanced machine learning models for accurate health assessments and insights.', color: 'cyan' },
                  { icon: Sparkles, title: 'Instant Results', description: 'Get detailed health reports and recommendations in seconds after each test.', color: 'purple' },
                ].map((feature, index) => {
                  const colors = colorMap[feature.color] || colorMap.teal;
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.06] transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Featured Lab */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.06] transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
                  <Mic className="w-8 h-8 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Featured: Voice & Speech Lab</h3>
                  <p className="text-white/60 mb-4">
                    Start with our most advanced lab - analyze vocal patterns and speech characteristics using cutting-edge signal processing
                  </p>
                  <Link to="/labs/voice">
                    <Button className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30">
                      Begin Voice Analysis
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="labs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labs.map((lab) => {
                const colors = colorMap[lab.color] || colorMap.teal;
                const Icon = lab.icon;
                const isAvailable = lab.status === 'ready';

                return (
                  <Link to={isAvailable ? `/labs/${lab.id}` : '#'} key={lab.id}>
                    <div className={`
                      bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5
                      transition-all duration-300
                      ${isAvailable ? 'hover:bg-white/[0.08] hover:border-white/[0.10] cursor-pointer hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'}
                    `}>
                      <div className="mb-4">
                        <div className={`w-14 h-14 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                          <Icon className={`w-7 h-7 ${colors.text}`} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-lg font-bold text-white">{lab.title}</h3>
                          {isAvailable ? (
                            <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Ready
                            </span>
                          ) : (
                            <span className="bg-white/10 text-white/50 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Soon
                            </span>
                          )}
                        </div>

                        <p className="text-white/60 text-sm leading-relaxed">{lab.description}</p>

                        <div className="pt-2">
                          <span className="text-xs text-white/40 bg-white/[0.04] px-2 py-1 rounded">
                            Target: {lab.targetCondition}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-2">
                          {lab.features.map((feature) => (
                            <span
                              key={feature}
                              className="text-xs px-2 py-1 rounded bg-white/[0.04] text-white/50 border border-white/[0.06]"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      {isAvailable && (
                        <div className="mt-4 pt-3 border-t border-white/[0.06]">
                          <div className="flex items-center justify-end text-sm text-white/50">
                            <span className="mr-1">Enter Lab</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* View More Labs Card */}
              <Link to="/labs">
                <div className="bg-white/[0.04] backdrop-blur-sm border border-dashed border-white/[0.10] rounded-xl p-5 hover:bg-white/[0.06] transition-colors cursor-pointer h-full flex flex-col items-center justify-center min-h-[280px]">
                  <div className="p-4 rounded-full bg-teal-500/20 border border-teal-500/30 mb-4">
                    <Sparkles className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Discover More Labs</h3>
                  <p className="text-white/50 text-sm text-center mb-4">Explore our full suite of diagnostic tools</p>
                  <Button variant="outline" className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10">
                    View All Labs
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Link>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Main Reports CTA */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-8 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6">
                <Brain className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Clinical Reports</h3>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                AI-generated summaries and clinician-ready reports with comprehensive analysis
              </p>
              <Link to="/report">
                <Button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30">
                  View My Reports
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Digital Health Identity</h4>
                    <p className="text-white/50 text-sm">Manage your clinical profile and biometric data</p>
                  </div>
                </div>
                <Link to="/patient-profile" className="block mt-4">
                  <Button variant="outline" className="w-full border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white">
                    Edit Patient Profile
                  </Button>
                </Link>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                    <Activity className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Clinical Dashboards</h4>
                    <p className="text-white/50 text-sm">Real-time monitoring of vitals</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Link to="/bp-tracker" className="flex-1">
                    <Button variant="outline" className="w-full border-white/[0.08] bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/30 text-white/70 hover:text-red-400 text-sm">
                      BP Tracker
                    </Button>
                  </Link>
                  <Link to="/diabetes" className="flex-1">
                    <Button variant="outline" className="w-full border-white/[0.08] bg-white/[0.02] hover:bg-amber-500/10 hover:border-amber-500/30 text-white/70 hover:text-amber-400 text-sm">
                      Diabetes
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
