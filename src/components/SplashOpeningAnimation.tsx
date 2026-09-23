import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashOpeningAnimationProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

export const SplashOpeningAnimation: React.FC<SplashOpeningAnimationProps> = ({
  onComplete,
  minDurationMs = 1900
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    // Only show once per browser session
    try {
      return !sessionStorage.getItem('healthscan_splash_seen');
    } catch {
      return true;
    }
  });

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Clinical Neural Models...');

  useEffect(() => {
    if (!isVisible) {
      onComplete?.();
      return;
    }

    // Step-by-step telemetry status transitions
    const t1 = setTimeout(() => {
      setProgress(42);
      setStatusText('Calibrating Optical Camera Sensors...');
    }, 550);

    const t2 = setTimeout(() => {
      setProgress(84);
      setStatusText('Verifying On-Device Biometric Engine...');
    }, 1100);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('System Ready • Clinical Suite Active');
    }, 1500);

    const tEnd = setTimeout(() => {
      dismissSplash();
    }, minDurationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tEnd);
    };
  }, [isVisible, minDurationMs]);

  const dismissSplash = () => {
    try {
      sessionStorage.setItem('healthscan_splash_seen', 'true');
    } catch {
      // Ignore storage errors
    }
    setIsVisible(false);
    onComplete?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="healthscan-splash"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.04, 
            filter: 'blur(10px)',
            transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } 
          }}
          onClick={dismissSplash}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#070A11] text-white select-none cursor-pointer overflow-hidden"
          title="Click to skip"
        >
          {/* Ambient Radial Neon Core */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-teal-500/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none animate-pulse" />

          {/* Subtly Animated Background Grid */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #2DD4BF 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }}
          />

          <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
            {/* Logo Squircle with Biometric Scan Beam */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 mb-6"
            >
              {/* Outer Pulsing Aura */}
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 to-emerald-500 rounded-3xl blur-xl opacity-30 animate-pulse" />

              {/* The SVG Emblem */}
              <div className="relative w-full h-full rounded-3xl bg-[#0B101C] p-3 border border-teal-500/30 shadow-2xl shadow-teal-500/20 flex items-center justify-center overflow-hidden">
                {/* Vertical Laser Scan Line Sweep */}
                <motion.div
                  initial={{ top: '-10%' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38BDF8] z-20 pointer-events-none"
                />

                <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
                  <defs>
                    <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="35%" stopColor="#2DD4BF" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>

                  {/* Left & Right Vertical Pillars */}
                  <rect x="14" y="12" width="7" height="40" rx="3.5" fill="url(#splashGrad)" />
                  <rect x="43" y="12" width="7" height="40" rx="3.5" fill="url(#splashGrad)" />

                  {/* Dynamic Heartbeat Line with Draw-in Stroke Animation */}
                  <motion.path
                    d="M 21 32 L 26.5 32 L 29 23 L 32.5 12 L 36 50 L 39.5 32 L 43 32"
                    stroke="url(#splashGrad)"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.1, ease: 'easeInOut' }}
                  />

                  {/* Pulse Beacon Nodes */}
                  <circle cx="32.5" cy="12" r="3" fill="#38BDF8" />
                  <circle cx="36" cy="50" r="2.2" fill="#10B981" />
                </svg>
              </div>
            </motion.div>

            {/* Brand Title with Sleek Letter Spacing */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="space-y-1 mb-6"
            >
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                Health<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Scan</span>
              </h1>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Clinical AI Suite
              </p>
            </motion.div>

            {/* High-Tech Progress Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="w-56 sm:w-64 space-y-2.5"
            >
              <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden border border-white/5 p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="truncate pr-2">{statusText}</span>
                <span className="text-teal-400 font-semibold">{progress}%</span>
              </div>
            </motion.div>

            {/* Tap to skip hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mt-8 text-[10px] text-slate-500 tracking-wider uppercase font-medium"
            >
              Tap anywhere to skip
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashOpeningAnimation;
