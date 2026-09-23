import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  Settings, 
  User, 
  ChevronDown, 
  Phone, 
  FileText, 
  LogOut, 
  LogIn,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsModal } from '../SettingsModal';
import { NAV_CATEGORIES } from '@/config/navRoutes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const { currentUser, logout, loginAsDemo } = useAuth();
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const displayName = currentUser?.displayName || 'Alex Rivera';
  const emailOrAbha = currentUser?.email || 'alex.rivera@abdm';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('') || 'AR';

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
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070A11]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] pt-[env(safe-area-inset-top,0px)] transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          
          {/* Left: Back Button & Quick Title */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              aria-label={backLabel}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition active:scale-[0.98] shrink-0 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{backLabel}</span>
            </button>

            {/* Quick Navigation Dropdown ("Jump To...") */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/70 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/[0.06] text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                  aria-label="Quick Jump to other health modules"
                >
                  <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Modules</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-72 p-2 bg-white/95 dark:bg-[#0D1321]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xl max-h-[75vh] overflow-y-auto"
              >
                {NAV_CATEGORIES.map((cat) => (
                  <div key={cat.title} className="mb-2 last:mb-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
                      {cat.title}
                    </div>
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem
                          key={item.href}
                          onClick={() => navigate(item.href)}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                        >
                          <Icon className={`w-3.5 h-3.5 ${item.color || 'text-teal-600 dark:text-teal-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center: Title / Category */}
          {title ? (
            <div className="hidden md:flex flex-col items-center text-center">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">{title}</span>
              {category && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{category}</span>
              )}
            </div>
          ) : (
            category && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                {category}
              </span>
            )
          )}

          {/* Right Section: Actions, Settings, Theme, Profile & Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            {actions}

            {/* Settings Trigger */}
            <button
              onClick={() => setShowSettingsModal(true)}
              aria-label="Settings"
              title="Settings & Biometrics Configuration"
              className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center border border-slate-200 dark:border-white/[0.08] bg-slate-100/80 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 transition-colors active:scale-[0.98]"
            >
              <Settings className="w-4 h-4" />
            </button>

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

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-teal-500/40 transition-all focus:outline-none"
                  aria-label="User profile options"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 p-0.5 shadow-sm">
                    <div className="w-full h-full rounded-full bg-teal-50 dark:bg-[#0E1422] flex items-center justify-center font-bold text-teal-700 dark:text-teal-300 text-[11px]">
                      {initials}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-60 p-2 bg-white/95 dark:bg-[#0D1321]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xl"
              >
                <div className="p-2 mb-1 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{emailOrAbha}</div>
                </div>

                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>My Health Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate('/emergency-contacts')}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-rose-500" />
                  <span>Emergency Health ID</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Settings & Sync</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 border-slate-200/80 dark:border-white/[0.08]" />

                {currentUser ? (
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => loginAsDemo()}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-600 dark:text-teal-400 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Load Demo Patient</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
};

export default SubPageHeader;
