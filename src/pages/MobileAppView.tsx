import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNavbar } from '../components/pwa/AppNavbar';
import { MobileBottomNav, NavTabId } from '../components/pwa/MobileBottomNav';
import { TodayDashboard } from '../components/pwa/TodayDashboard';
import { QuickScanModal } from '../components/pwa/QuickScanModal';
import { PWAInstallModal } from '../components/pwa/PWAInstallModal';
import { OnboardingWizard, useOnboarding } from '../components/pwa/OnboardingWizard';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Heart, 
  Hand, 
  Mic, 
  Eye, 
  Footprints, 
  Brain, 
  Ear, 
  Droplet, 
  Watch, 
  Phone, 
  ShieldCheck, 
  Download, 
  ArrowRight, 
  ChevronRight,
  FileText,
  Smartphone
} from 'lucide-react';
import { getAllResults } from '../services/healthDataService';

export const MobileAppView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NavTabId>('today');
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const { showOnboarding, completeOnboarding } = useOnboarding();

  const {
    isInstalled,
    isIOS,
    isStandalone,
    promptInstall,
    isModalOpen,
    setIsModalOpen,
  } = usePWAInstall();

  const handleScanComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-teal-500/30 flex flex-col transition-colors duration-200">
      {/* Onboarding wizard for first-time users */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={completeOnboarding}
          onStartScan={() => {
            completeOnboarding();
            setIsScanModalOpen(true);
          }}
        />
      )}

      {/* 1. TOP NAVBAR (Full on Desktop, Clean on Mobile) */}
      <AppNavbar 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab)} 
        onStartScan={() => setIsScanModalOpen(true)}
        onInstallPWA={promptInstall}
      />

      {/* 2. MAIN RESPONSIVE VIEWPORT CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-12">
        {/* TAB 1: TODAY */}
        {activeTab === 'today' && (
          <TodayDashboard 
            key={refreshKey}
            onStartScan={() => setIsScanModalOpen(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onInstallPWA={promptInstall}
            isStandalone={isStandalone}
          />
        )}

        {/* TAB 2: CLINICAL LABS */}
        {activeTab === 'labs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                  Validated Instruments
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                  Specialized Clinical Labs
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Browser-based biometric screening running on-device with zero cloud telemetry.
                </p>
              </div>
            </div>

            {/* Labs Grid: 2 columns on desktop/tablet, 1 column on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cardiovascular Lab */}
              <div
                onClick={() => navigate('/labs/cardiovascular')}
                className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all cursor-pointer group active:scale-[0.99] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-500/30 transition-colors flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Cardiovascular Lab</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Camera PPG, Heart Rate & HRV analysis</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                        PPG Camera Sensor
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        • Arrhythmia & Autonomic Tone
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Motor & Tremor Lab */}
              <div
                onClick={() => navigate('/labs/motor')}
                className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all cursor-pointer group active:scale-[0.99] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-500/30 transition-colors flex items-center justify-center shrink-0">
                    <Hand className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Motor & Tremor Lab</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">MDS-UPDRS finger tapping & Tremor FFT</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                        MDS-UPDRS Finger Tap
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        • Coordination & Tremor FFT
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Voice & Speech Lab */}
              <div
                onClick={() => navigate('/labs/voice')}
                className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all cursor-pointer group active:scale-[0.99] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-500/30 transition-colors flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Voice & Speech Lab</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pitch autocorrelation, Jitter & Shimmer</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                        Acoustic Analysis
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        • Jitter, Shimmer & Dysarthria
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Eye & Cognition Lab */}
              <div
                onClick={() => navigate('/labs/eye')}
                className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all cursor-pointer group active:scale-[0.99] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-500/30 transition-colors flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Eye & Cognition Lab</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Saccadic reaction time & Stroop cognitive tests</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                        Saccadic Protocol
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        • Reaction Latency & Executive Focus
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Gait & Balance Lab */}
              <div
                onClick={() => navigate('/labs/gait')}
                className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all cursor-pointer group active:scale-[0.99] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-500/30 transition-colors flex items-center justify-center shrink-0">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Gait & Mobility Lab</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pose estimation, stride cadence & fall risk index</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                        Pose Kinematics
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        • Musculoskeletal Symmetry & Cadence
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Mental Health & Psychological Lab */}
              <div
                onClick={() => navigate('/labs/mental-health')}
                className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all cursor-pointer group active:scale-[0.99] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-500/30 transition-colors flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Mental Health & Affect Lab</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Validated PHQ-9 & GAD-7 clinical instruments</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                        PHQ-9 / GAD-7
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        • Affective & Depressive Screening
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Vision & Hearing Lab */}
              <div
                onClick={() => navigate('/labs/vision-hearing')}
                className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all cursor-pointer group active:scale-[0.99] flex items-center justify-between shadow-sm md:col-span-2"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-500/30 transition-colors flex items-center justify-center shrink-0">
                    <Ear className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Vision & Hearing Sensory Lab</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tumbling E Snellen visual acuity chart & pure-tone audiometry</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                        Snellen & Audiometry
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        • Visual Acuity & Pure-Tone Threshold
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CHRONIC CARE & WEARABLES */}
        {activeTab === 'care' && (
          <div className="space-y-6">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 uppercase tracking-wider">
                Longitudinal Disease Monitoring
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                Chronic Care & Wearables
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Continuous glucose management, hypertension tracking, and smartwatch telemetry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Diabetes Management Card */}
              <div 
                onClick={() => navigate('/diabetes')}
                className="p-6 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 group transition cursor-pointer active:scale-[0.99] space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex items-center justify-center transition-colors">
                      <Droplet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Diabetes & Insulin Hub</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">IOB bilinear decay & carb calculator</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                    Active Module
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04]">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Latest Glucose</span>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">No readings yet</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Time in Range</span>
                    <div className="text-base font-extrabold text-slate-500 dark:text-slate-400 mt-0.5 font-mono">—</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  <span>Open Full Diabetes Management</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Blood Pressure Tracker */}
              <div 
                onClick={() => navigate('/bp-tracker')}
                className="p-6 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 group transition cursor-pointer active:scale-[0.99] space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex items-center justify-center transition-colors">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Hypertension & BP Log</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">AHA stage classification & trend tracker</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                    AHA Guidelines
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04]">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Recent Reading</span>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">No readings yet</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">7-Day Mean</span>
                    <div className="text-base font-extrabold text-slate-500 dark:text-slate-400 mt-0.5 font-mono">—</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  <span>Open BP Tracker & History</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Wearables & Smartwatch */}
              <div 
                onClick={() => navigate('/smartwatch')}
                className="p-6 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 group transition cursor-pointer active:scale-[0.99] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex items-center justify-center transition-colors">
                    <Watch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Smartwatch & Wearables Integration</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Apple Watch, Google Fit, Galaxy Watch Bluetooth telemetry</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Emergency SOS & Caregiver Alerts */}
              <div 
                onClick={() => navigate('/emergency-contacts')}
                className="p-6 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 group transition cursor-pointer active:scale-[0.99] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 flex items-center justify-center transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Emergency SOS & Caregiver Network</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">One-tap medical dispatch & automated caregiver notifications</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RECORDS & ABDM */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 uppercase tracking-wider">
                Digital Health Infrastructure
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                ABDM Health Records & Passport
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Ayushman Bharat Digital Mission verified records with standard FHIR R4 interoperability.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* ABHA Card (Spans 6 cols on desktop) */}
              <div className="lg:col-span-6 p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Ayushman Bharat (ABHA)</h3>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-mono mt-0.5">91-4820-9912-4412</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    VERIFIED
                  </span>
                </div>

                {/* ABHA Titanium Smart Card Asset */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200/90 dark:border-white/[0.08] shadow-sm group">
                  <img 
                    src="/images/abha-card.jpg" 
                    alt="Ayushman Bharat Health Account Card"
                    className="w-full h-36 sm:h-44 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none flex items-end p-3">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-white/90">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[11px] font-mono font-medium tracking-wider">91-4820-9912-4412</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/80 backdrop-blur-md text-white border border-teal-400/30">
                        ABDM Verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">ABHA Address:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">alex.rivera@abdm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">FHIR R4 Bundle:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Interoperable with Hospital EHR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Consent Management:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Granular HIP / HIU</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => navigate('/ehr')}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-800 dark:text-white text-xs font-semibold border border-slate-200/80 dark:border-white/[0.08] transition text-center"
                  >
                    View FHIR R4 Bundle
                  </button>
                  <button
                    onClick={() => navigate('/doctor-report')}
                    className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition text-center flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>

                {!isStandalone && (
                  <button
                    onClick={promptInstall}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/80 dark:border-white/[0.08] transition flex items-center justify-center gap-2 mt-3"
                  >
                    <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Download PWA App (Offline Access)</span>
                  </button>
                )}
              </div>

              {/* Doctor Report & History (Spans 6 cols on desktop) */}
              <div className="lg:col-span-6 space-y-4">
                <div 
                  onClick={() => navigate('/doctor-report')}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] hover:border-teal-500/40 dark:hover:border-teal-500/30 group transition cursor-pointer active:scale-[0.99] flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex items-center justify-center transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Generate Physician Clinical Brief</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">AI-grounded clinical report for doctors & specialists</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>

                {/* Recent Tests Table */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Recent Verified Biomarkers
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const results = getAllResults();
                      if (results.length === 0) {
                        return (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">No screenings yet</p>
                            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-1">Run your first 60-second scan ⚡</p>
                          </div>
                        );
                      }
                      return results.slice(0, 3).map((r, i) => (
                        <div key={r.id || i} className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-600 dark:text-slate-300">
                              <Heart className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {r.category === 'cardiovascular' ? 'Multi-Modal Checkup' : r.testType || 'Health Test'}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {r.data?.heartRate ? `Pulse ${r.data.heartRate} bpm` : ''}
                                {r.data?.hrv ? ` • HRV ${r.data.hrv} ms` : ''}
                                {!r.data?.heartRate && !r.data?.hrv ? new Date(r.testDate).toLocaleDateString() : ''}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                            {r.score ? `${r.score}/100` : r.riskLevel || '—'}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. MOBILE-ONLY BOTTOM NAVIGATION DOCK (Hidden on md+ screens) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onQuickScanClick={() => setIsScanModalOpen(true)}
      />

      {/* 4. INTERACTIVE 60-SECOND SCAN WIZARD MODAL */}
      <QuickScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanComplete={handleScanComplete}
      />

      {/* 5. PWA INSTALL & DOWNLOAD MODAL */}
      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInstall={promptInstall}
        isIOS={isIOS}
        isInstalled={isInstalled}
      />
    </div>
  );
};
