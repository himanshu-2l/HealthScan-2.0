import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export interface SubPageHeaderProps {
  title?: string;
  category?: string;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export const SubPageHeader: React.FC<SubPageHeaderProps> = ({
  title,
  category,
  backTo,
  backLabel = 'Back',
  actions,
}) => {
  const navigate = useNavigate();
  const { mode, toggleMode } = useTheme();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070A11]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] pt-[env(safe-area-inset-top,0px)] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Back Button */}
        <button
          onClick={handleBack}
          aria-label={backLabel}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition active:scale-[0.98] shrink-0 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </button>

        {/* Center / Title if provided */}
        {title && (
          <div className="hidden md:flex flex-col items-center text-center">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">{title}</span>
            {category && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{category}</span>
            )}
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2 ml-auto">
          {category && !title && (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              {category}
            </span>
          )}

          {actions}

          {/* Theme Toggle */}
          <button
            onClick={toggleMode}
            aria-label={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/[0.08] bg-slate-100/80 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 transition-colors active:scale-[0.98]"
          >
            {mode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* HS Brand Pill */}
          <div
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-[10px] cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-transform"
            title="HealthScan Home"
          >
            HS
          </div>
        </div>
      </div>
    </header>
  );
};

export default SubPageHeader;
