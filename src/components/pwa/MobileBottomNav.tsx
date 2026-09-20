import React from 'react';
import { 
  Home, 
  Zap, 
  FlaskConical, 
  Droplet, 
  FileText
} from 'lucide-react';

export type NavTabId = 'today' | 'scan' | 'labs' | 'care' | 'records';

interface MobileBottomNavProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  onQuickScanClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onQuickScanClick,
}) => {
  return (
    <nav role="tablist" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A0E18]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/[0.08] px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-lg dark:shadow-2xl transition-colors duration-200">
      {/* 1. Today Tab */}
      <button
        onClick={() => onTabChange('today')}
        className={`flex flex-col items-center gap-1 transition-all duration-150 active:scale-95 py-1 px-3 rounded-xl ${
          activeTab === 'today' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Home className={`w-5 h-5 transition-transform ${activeTab === 'today' ? 'scale-110' : ''}`} />
          {activeTab === 'today' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-600 dark:bg-teal-400" />
          )}
        </div>
        <span className="text-[10px] tracking-tight">Today</span>
      </button>

      {/* 2. Labs Tab */}
      <button
        onClick={() => onTabChange('labs')}
        className={`flex flex-col items-center gap-1 transition-all duration-150 active:scale-95 py-1 px-3 rounded-xl ${
          activeTab === 'labs' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <FlaskConical className={`w-5 h-5 transition-transform ${activeTab === 'labs' ? 'scale-110' : ''}`} />
          {activeTab === 'labs' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-600 dark:bg-teal-400" />
          )}
        </div>
        <span className="text-[10px] tracking-tight">Labs</span>
      </button>

      {/* 3. Center Hero: Quick 60s Scan Button */}
      <div className="-mt-6 relative">
        <button
          onClick={onQuickScanClick}
          aria-label="Start 60-Second Scan"
          className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-600/30 transition-all duration-200 hover:scale-105 active:scale-95 border-4 border-slate-50 dark:border-[#070A11]"
        >
          <Zap className="w-6 h-6 fill-white stroke-white" />
          {/* Radiating ping ring */}
          <span className="absolute inset-0 rounded-full bg-teal-400/20 animate-pulse pointer-events-none" />
        </button>
        <span className="block text-center text-[10px] font-semibold text-teal-600 dark:text-teal-400 mt-1 tracking-tight">
          Scan
        </span>
      </div>

      {/* 4. Chronic Care Tab */}
      <button
        onClick={() => onTabChange('care')}
        className={`flex flex-col items-center gap-1 transition-all duration-150 active:scale-95 py-1 px-3 rounded-xl ${
          activeTab === 'care' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Droplet className={`w-5 h-5 transition-transform ${activeTab === 'care' ? 'scale-110' : ''}`} />
          {activeTab === 'care' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-600 dark:bg-teal-400" />
          )}
        </div>
        <span className="text-[10px] tracking-tight">Care</span>
      </button>

      {/* 5. Health Records Tab */}
      <button
        onClick={() => onTabChange('records')}
        className={`flex flex-col items-center gap-1 transition-all duration-150 active:scale-95 py-1 px-3 rounded-xl ${
          activeTab === 'records' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <FileText className={`w-5 h-5 transition-transform ${activeTab === 'records' ? 'scale-110' : ''}`} />
          {activeTab === 'records' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-600 dark:bg-teal-400" />
          )}
        </div>
        <span className="text-[10px] tracking-tight">Records</span>
      </button>
    </nav>
  );
};
