import React from 'react';

interface HealthScanLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  glow?: boolean;
}

const sizeMap = {
  xs: { box: 'w-6 h-6', icon: 24, fontTitle: 'text-xs', fontSub: 'text-[8px]' },
  sm: { box: 'w-9 h-9', icon: 36, fontTitle: 'text-sm font-bold', fontSub: 'text-[9px]' },
  md: { box: 'w-11 h-11', icon: 44, fontTitle: 'text-base font-bold', fontSub: 'text-[10px]' },
  lg: { box: 'w-14 h-14', icon: 56, fontTitle: 'text-xl font-extrabold', fontSub: 'text-xs' },
  xl: { box: 'w-20 h-20', icon: 80, fontTitle: 'text-2xl font-black', fontSub: 'text-xs tracking-wider' }
};

export const HealthScanLogo: React.FC<HealthScanLogoProps> = ({
  size = 'md',
  showText = false,
  subtitle = 'Clinical AI Suite',
  className = '',
  glow = true
}) => {
  const config = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon Mark */}
      <div className={`relative ${config.box} shrink-0`}>
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/25 to-emerald-400/20 rounded-2xl blur-md -z-10 transition-opacity" />
        )}
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hsLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="35%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <filter id="hsGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Squircle Base Container */}
          <rect width="64" height="64" rx="16" fill="#070A11" />
          <rect
            width="61"
            height="61"
            x="1.5"
            y="1.5"
            rx="14.5"
            stroke="url(#hsLogoGrad)"
            strokeWidth="1.2"
            strokeOpacity="0.45"
          />

          {/* Architectural "H" Biometric Pillars */}
          <rect x="15" y="14" width="6.5" height="36" rx="3.25" fill="url(#hsLogoGrad)" />
          <rect x="42.5" y="14" width="6.5" height="36" rx="3.25" fill="url(#hsLogoGrad)" />

          {/* Central Dynamic Cardiac Pulse Wave */}
          <path
            d="M 21.5 32 L 26.5 32 L 29 24 L 32.5 14 L 36 46 L 39 32 L 42.5 32"
            stroke="url(#hsLogoGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#hsGlowFilter)"
          />

          {/* Optical Pulse Beacon Nodes */}
          <circle cx="32.5" cy="14" r="2.5" fill="#38BDF8" />
          <circle cx="36" cy="46" r="1.8" fill="#34D399" />
        </svg>
      </div>

      {/* Optional Wordmark */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`${config.fontTitle} tracking-tight text-slate-900 dark:text-white`}>
              Health<span className="text-teal-600 dark:text-teal-400">Scan</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          {subtitle && (
            <span className={`${config.fontSub} text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthScanLogo;
