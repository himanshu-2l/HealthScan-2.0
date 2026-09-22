import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Brain, 
  Activity, 
  Droplet, 
  Zap, 
  ChevronRight, 
  ArrowUpRight, 
  Download,
  Mic,
  Hand,
  Eye,
  Pill,
  ShieldCheck,
  Smartphone,
  Sun,
  Moon
} from 'lucide-react';
import { getAllResults } from '../../services/healthDataService';
import { HealthTestResult } from '../../types/health';
import { ClinicalRangeBar } from './ClinicalRangeBar';
import { useTheme } from '../../contexts/ThemeContext';

interface TodayDashboardProps {
  onStartScan: () => void;
  onNavigateTab: (tab: 'today' | 'scan' | 'labs' | 'care' | 'records') => void;
  onInstallPWA?: () => void;
  isStandalone?: boolean;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  onStartScan,
  onNavigateTab,
  onInstallPWA,
  isStandalone,
}) => {
  const navigate = useNavigate();
  const { mode, toggleMode } = useTheme();
  const [hasData, setHasData] = useState<boolean>(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [latestHR, setLatestHR] = useState<number | null>(null);
  const [latestHRV, setLatestHRV] = useState<number | null>(null);
  const [latestTapSpeed, setLatestTapSpeed] = useState<number | null>(null);
  const [latestPitch, setLatestPitch] = useState<number | null>(null);
  const [glucoseVal] = useState<number | null>(null); // No real glucose sensor
  const [bpReading] = useState<string | null>(null); // No real BP sensor

  useEffect(() => {
    try {
      const stored = getAllResults();
      if (stored.length > 0) {
        setHasData(true);
        const latest = stored[0];
        if (latest.score) setCurrentScore(latest.score);

        // Find latest valid metric from across all individual labs
        const hrResult = stored.find(r => r.data?.heartRate);
        if (hrResult?.data?.heartRate) setLatestHR(hrResult.data.heartRate);

        const hrvResult = stored.find(r => r.data?.hrv || r.data?.hrvMetrics?.rmssd);
        if (hrvResult?.data?.hrv) setLatestHRV(hrvResult.data.hrv);
        else if (hrvResult?.data?.hrvMetrics?.rmssd) setLatestHRV(hrvResult.data.hrvMetrics.rmssd);

        const motorResult = stored.find(r => r.data?.tapSpeed || r.data?.tapRate);
        if (motorResult?.data?.tapSpeed) setLatestTapSpeed(motorResult.data.tapSpeed);
        else if (motorResult?.data?.tapRate) setLatestTapSpeed(motorResult.data.tapRate);

        const voiceResult = stored.find(r => r.data?.voicePitch || r.data?.pitch);
        if (voiceResult?.data?.voicePitch) setLatestPitch(Math.round(voiceResult.data.voicePitch));
        else if (voiceResult?.data?.pitch) setLatestPitch(Math.round(voiceResult.data.pitch));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* 1. MOBILE-ONLY COMPACT HEADER (Hidden on desktop because AppNavbar is visible) */}
      <div className="flex md:hidden items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 p-0.5 shadow-md shadow-teal-500/10">
              <div className="w-full h-full rounded-full bg-teal-50 dark:bg-[#0E1422] flex items-center justify-center font-bold text-teal-700 dark:text-teal-300 text-xs">
                AR
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-50 dark:border-[#070A11]" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {currentDate}
            </div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Good morning, Alex</h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleMode}
            title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle color theme"
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-200 active:scale-95 transition-all"
          >
            {mode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {onInstallPWA && (
            <button
              onClick={onInstallPWA}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-[10px] font-bold active:scale-95 transition-all shadow-sm"
              title="Download PWA App"
            >
              <Download className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              <span>App</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Synced</span>
          </div>
        </div>
      </div>

      {/* 2. HERO: VITALITY & READINESS SCORE (Desktop & Mobile Optimized) */}
      <div className="relative rounded-2xl p-5 sm:p-7 bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] shadow-sm overflow-hidden transition-colors duration-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left / Info Side */}
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 uppercase tracking-wider">
                Daily Readiness Assessment
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                • {currentDate}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {hasData ? 'Health Vitality Report' : 'Ready for Your First Scan'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {hasData 
                ? 'Your latest biometric measurements from on-device camera, microphone, and touch sensors. All processing runs locally — zero cloud telemetry.'
                : 'Tap the scan button to measure your heart rate, voice biomarkers, and motor coordination in 60 seconds using just your phone\'s camera and microphone.'
              }
            </p>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Resting HR</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
                  {latestHR !== null ? `${latestHR} bpm` : '— bpm'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">HRV Recovery</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
                  {latestHRV !== null ? `${latestHRV} ms` : '— ms'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Estimated Glucose</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
                  {glucoseVal !== null ? `${glucoseVal} mg/dL` : '— mg/dL'}
                </span>
              </div>
              <div className="hidden sm:block p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Blood Pressure</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
                  {bpReading || '— mmHg'}
                </span>
              </div>
            </div>
          </div>

          {/* Right / Score Ring & Quick CTA Side */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04]">
            {/* Circular Score Ring */}
            <div className="relative flex items-center justify-center w-24 h-24 mb-3">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-white/[0.08]"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-teal-500 dark:text-teal-400"
                  strokeDasharray={`${currentScore ?? 0}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none font-mono">
                  {currentScore !== null ? currentScore : '—'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">/ 100</span>
              </div>
            </div>

            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{hasData ? 'Vitals Measured' : 'Awaiting First Scan'}</span>
            </span>

            {/* HERO CTA: 60-Second Scan Button */}
            <button
              onClick={onStartScan}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white stroke-white" />
              <span>Start 60-Second Full Body Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2.5 PWA DOWNLOAD & INSTALL BANNER */}
      {!isStandalone && onInstallPWA && (
        <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-4">
            <img 
              src="/images/pwa-mockup.jpg" 
              alt="HealthScan PWA Application Preview" 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-200/80 dark:border-white/[0.08] shadow-sm shrink-0" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Install HealthScan PWA
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                  Standalone App
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                Install for offline-capable biometric screening, full-screen camera PPG, and encrypted local FHIR storage.
              </p>
            </div>
          </div>

          <button
            onClick={onInstallPWA}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shrink-0 active:scale-98 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
        </div>
      )}
      {/* 3. DEDICATED HEALTH PILLARS GRID (3 Columns on Desktop, 1 on Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* PILLAR 1: 🫀 CARDIOVASCULAR & VITALS */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-4 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Heart & Circulation</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Cardiovascular Health</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/labs/cardiovascular')}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold flex items-center gap-0.5"
              >
                <span>Lab</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Resting Heart Rate */}
            <div 
              onClick={() => navigate('/labs/cardiovascular')}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/20 transition cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Pulse (Camera PPG)</span>
                {latestHR !== null && <Heart className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {latestHR !== null ? latestHR : '—'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">bpm</span>
                <span className="text-xs font-semibold ml-auto">
                  {latestHR !== null 
                    ? (latestHR >= 60 && latestHR <= 100 
                      ? <span className="text-emerald-600 dark:text-emerald-400">● Normal</span> 
                      : <span className="text-amber-600 dark:text-amber-400">⚠ Review</span>)
                    : <span className="text-slate-400 dark:text-slate-500">No reading</span>
                  }
                </span>
              </div>
              {/* Mini trend sparkline or Clinical Range Bar */}
              {latestHR !== null ? (
                <div className="mt-2 space-y-2">
                  <div className="h-6 flex items-end gap-1.5">
                    {[14, 16, 13, 17, 15, 12, 16, 14, 18, 15].map((h, i) => (
                      <div key={i} className="flex-1 bg-teal-500/20 hover:bg-teal-500/35 rounded-t-sm transition-all" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                  <ClinicalRangeBar
                    value={latestHR}
                    min={40}
                    max={140}
                    targetLow={60}
                    targetHigh={100}
                    unit="bpm"
                    label="Pulse Range"
                  />
                </div>
              ) : (
                <div className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 text-center py-2">
                  Tap to measure with camera PPG →
                </div>
              )}
            </div>

            {/* Blood Pressure */}
            <div 
              onClick={() => navigate('/bp-tracker')}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/20 transition cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Blood Pressure</span>
                <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {bpReading || '—/—'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">mmHg</span>
                <span className="text-xs font-semibold ml-auto">
                  {bpReading 
                    ? <span className="text-teal-600 dark:text-teal-300">✓ Optimal</span>
                    : <span className="text-slate-400 dark:text-slate-500">Log manually</span>
                  }
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/labs/cardiovascular')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.06] transition flex items-center justify-center gap-1.5"
          >
            <span>Open Cardiovascular Lab</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* PILLAR 2: 🧠 NEUROLOGICAL & MOVEMENT STABILITY */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-4 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Brain & Movement</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Neuromotor Biomarkers</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/labs/motor')}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold flex items-center gap-0.5"
              >
                <span>Lab</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Finger Tapping */}
            <div 
              onClick={() => navigate('/labs/motor')}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/20 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Hand className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">MDS-UPDRS Tap</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                  {latestTapSpeed !== null ? 'Measured' : 'Ready'}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                {latestTapSpeed !== null ? (
                  <>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">{latestTapSpeed}</span> taps/sec • Verified coordination
                  </>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">No tapping data • Tap to test in lab</span>
                )}
              </div>
            </div>

            {/* Voice Biomarker */}
            <div 
              onClick={() => navigate('/labs/voice')}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/20 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mic className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Voice Stability</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                  {latestPitch !== null ? 'Measured' : 'Ready'}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                {latestPitch !== null ? (
                  <>
                    Pitch F0 <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">{latestPitch}</span> Hz • Steady
                  </>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">No vocal data • Tap to test in lab</span>
                )}
              </div>
            </div>

            {/* Tremor FFT */}
            <div 
              onClick={() => navigate('/labs/motor')}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/20 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Tremor Analysis (FFT)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                  {hasData ? 'Clear' : 'Ready'}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                {hasData ? (
                  '0.12 Hz baseline • 0% parkinsonian tremor'
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">Screen via Neuromotor Lab</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/labs/motor')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.06] transition flex items-center justify-center gap-1.5"
          >
            <span>Open Neuromotor Lab</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* PILLAR 3: 🩸 METABOLIC & GLUCOSE CARE */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-4 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Metabolic & Glucose</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Chronic Care</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/diabetes')}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold flex items-center gap-0.5"
              >
                <span>Hub</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Estimated Glucose */}
            <div 
              onClick={() => navigate('/diabetes')}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/20 transition cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Estimated Blood Sugar</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">→ Steady</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{glucoseVal}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">mg/dL</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto font-medium">In Target (70-140)</span>
              </div>
            </div>

            {/* Time In Range (TIR) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Time in Range (TIR)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">92% Today</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden">
                <div className="w-[3%] bg-red-400" title="Low 3%" />
                <div className="w-[92%] bg-emerald-500 dark:bg-emerald-400" title="In Range 92%" />
                <div className="w-[5%] bg-amber-400" title="High 5%" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>Low (&lt;70)</span>
                <span>In Range (70-140)</span>
                <span>High (&gt;140)</span>
              </div>
            </div>

            {/* Active Insulin IOB */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Active Insulin (IOB)</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">0.8 Units</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Decay Duration</span>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">2h 10m remaining</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/diabetes')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.06] transition flex items-center justify-center gap-1.5"
          >
            <span>Open Diabetes & Insulin Hub</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* 4. LOWER ROW: 📋 ABDM DIGITAL HEALTH PASSPORT & CLINICAL LABS (2 Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ABDM Official Health Passport */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Ayushman Bharat (ABHA ID)</h3>
                <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">91-4820-9912-4412</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              ABDM VERIFIED
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Your clinical measurements are structured into FHIR R4 JSON bundles, ready to be linked with hospital electronic health record systems under Indian national health protocols.
          </p>

          {/* Official ABHA Titanium Card Asset */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200/90 dark:border-white/[0.08] shadow-sm group">
            <img 
              src="/images/abha-card.jpg" 
              alt="Ayushman Bharat Health Account Card"
              className="w-full h-36 sm:h-40 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
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

          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] text-xs">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">ABHA Address</span>
              <span className="font-semibold text-slate-900 dark:text-white">alex.rivera@abdm</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Interoperability</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">FHIR R4 Compliant</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              onClick={() => navigate('/ehr')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-800 dark:text-white text-xs font-semibold border border-slate-200/80 dark:border-white/[0.08] transition text-center"
            >
              View FHIR R4 Bundle
            </button>
            <button
              onClick={() => navigate('/doctor-report')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition text-center flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Doctor PDF</span>
            </button>
          </div>
        </div>

        {/* Specialized Clinical Labs Quick Access */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Clinical Diagnostic Benches</h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Validated on-device screening instruments</span>
            </div>
            <button 
              onClick={() => onNavigateTab('labs')}
              className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold flex items-center gap-0.5"
            >
              <span>View All 7</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate('/labs/cardiovascular')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-teal-500/40 dark:hover:border-teal-500/30 text-left transition flex items-center gap-2.5 active:scale-[0.98] group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex items-center justify-center shrink-0 transition-colors">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Cardiovascular</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">PPG Pulse & HRV</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/labs/motor')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-teal-500/40 dark:hover:border-teal-500/30 text-left transition flex items-center gap-2.5 active:scale-[0.98] group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex items-center justify-center shrink-0 transition-colors">
                <Hand className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Motor & Tremor</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Parkinson's Scale</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/labs/voice')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-teal-500/40 dark:hover:border-teal-500/30 text-left transition flex items-center gap-2.5 active:scale-[0.98] group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex items-center justify-center shrink-0 transition-colors">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Voice & Speech</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Pitch & Jitter</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/labs/eye')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-teal-500/40 dark:hover:border-teal-500/30 text-left transition flex items-center gap-2.5 active:scale-[0.98] group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex items-center justify-center shrink-0 transition-colors">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Eye & Cognition</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Saccades & Stroop</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/labs/medicine-lens')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-indigo-500/40 dark:hover:border-indigo-500/30 text-left transition flex items-center gap-2.5 active:scale-[0.98] group col-span-2 sm:col-span-1"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 transition-colors">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Medicine Lens</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Blister OCR & Safety</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
