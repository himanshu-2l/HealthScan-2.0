import React, { useState } from 'react';
import { 
  Zap, 
  FlaskConical, 
  Droplet, 
  FileText, 
  Home,
  Download,
  Sun,
  Moon,
  QrCode
} from 'lucide-react';
import { NavTabId } from './MobileBottomNav';
import { useTheme } from '../../contexts/ThemeContext';
import { QRCodeModal } from './QRCodeModal';

interface AppNavbarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  onStartScan: () => void;
  onInstallPWA?: () => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  activeTab,
  onTabChange,
  onStartScan,
  onInstallPWA,
}) => {
  const { mode, toggleMode } = useTheme();
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#090D17]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white font-black text-sm shadow-sm">
            HS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">HealthScan</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                Clinical AI Suite
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sensors & CGM Synced</span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs (Hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] transition-colors">
          <button
            onClick={() => onTabChange('today')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 ${
              activeTab === 'today'
                ? 'bg-white dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-slate-200/80 dark:border-teal-500/30 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          <button
            onClick={() => onTabChange('labs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 ${
              activeTab === 'labs'
                ? 'bg-white dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-slate-200/80 dark:border-teal-500/30 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Clinical Labs</span>
          </button>

          <button
            onClick={() => onTabChange('care')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 ${
              activeTab === 'care'
                ? 'bg-white dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-slate-200/80 dark:border-teal-500/30 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>Chronic Care</span>
          </button>

          <button
            onClick={() => onTabChange('records')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 ${
              activeTab === 'records'
                ? 'bg-white dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-slate-200/80 dark:border-teal-500/30 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Health Records</span>
          </button>
        </nav>

        {/* Right: Quick Action & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleMode}
            title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle color theme"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-200 transition-all active:scale-95"
          >
            {mode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Test on Phone (Judge Live QR Code) */}
          <button
            onClick={() => setShowQRModal(true)}
            title="Scan QR Code to open HealthScan live on your phone"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all active:scale-[0.98]"
          >
            <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Test on Phone</span>
            <span className="sm:hidden text-[11px]">Test</span>
          </button>

          {/* Download / Install PWA App Button */}
          {onInstallPWA && (
            <button
              onClick={onInstallPWA}
              title="Download & Install HealthScan PWA"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-teal-700 dark:text-teal-300 transition-all active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="hidden sm:inline">Download App</span>
              <span className="sm:hidden text-[11px]">App</span>
            </button>
          )}

          {/* Quick 60s Scan CTA Button */}
          <button
            onClick={onStartScan}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-white stroke-white" />
            <span className="hidden sm:inline">60-Second Scan</span>
            <span className="sm:hidden">Scan</span>
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-slate-200 dark:sm:border-white/[0.08]">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 p-0.5 shadow-sm">
                <div className="w-full h-full rounded-full bg-teal-50 dark:bg-[#0E1422] flex items-center justify-center font-bold text-teal-700 dark:text-teal-300 text-xs">
                  AR
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#090D17]" />
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Alex Rivera</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">ABHA: alex.rivera@abdm</div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Live Testing Modal */}
      <QRCodeModal 
        isOpen={showQRModal} 
        onClose={() => setShowQRModal(false)} 
      />
    </header>
  );
};
