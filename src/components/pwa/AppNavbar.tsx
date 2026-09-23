import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  FlaskConical, 
  Droplet, 
  FileText, 
  Home,
  Download,
  Sun,
  Moon,
  QrCode,
  ChevronDown,
  Settings,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  ShieldCheck,
  Phone,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { NavTabId } from './MobileBottomNav';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeModal } from './QRCodeModal';
import { SettingsModal } from '../SettingsModal';
import { NAV_CATEGORIES } from '../../config/navRoutes';
import { HealthScanLogo } from '../HealthScanLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppNavbarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  onStartScan: () => void;
  onInstallPWA?: () => void;
  isInstalled?: boolean;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  activeTab,
  onTabChange,
  onStartScan,
  onInstallPWA,
  isInstalled = false,
}) => {
  const navigate = useNavigate();
  const { mode, toggleMode } = useTheme();
  const { currentUser, logout, loginAsDemo } = useAuth();
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const displayName = currentUser?.displayName || 'Alex Rivera';
  const emailOrAbha = currentUser?.email || 'alex.rivera@abdm';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('') || 'AR';

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#090D17]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] pt-[env(safe-area-inset-top,0px)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Brand / Logo */}
          <div 
            onClick={() => onTabChange('today')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
            title="HealthScan Home"
          >
            <HealthScanLogo size="sm" showText={false} glow={true} className="transition-transform active:scale-95" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">HealthScan</span>
                <span className="hidden xl:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                  Clinical AI Suite
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">Sensors & CGM Synced</span>
                <span className="sm:hidden">Synced</span>
              </div>
            </div>
          </div>

          {/* Center: Desktop Navigation Tabs & Mega Menu */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] transition-colors shrink-0">
            <button
              onClick={() => onTabChange('today')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                activeTab === 'records'
                  ? 'bg-white dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-slate-200/80 dark:border-teal-500/30 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Health Records</span>
            </button>

            {/* Desktop "More ▾" Mega Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors focus:outline-none"
                  aria-label="More HealthScan features"
                >
                  <span>More</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                sideOffset={12}
                className="w-[680px] p-4 bg-white/95 dark:bg-[#0D1321]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl"
              >
                <div className="grid grid-cols-2 gap-4">
                  {NAV_CATEGORIES.map((category) => (
                    <div key={category.title} className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
                        {category.title}
                      </div>
                      <div className="space-y-0.5">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.href}
                              onClick={() => handleNavigate(item.href)}
                              className="group flex items-start gap-3 p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
                            >
                              <div className={`p-2 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06] ${item.color || 'text-teal-600 dark:text-teal-400'} group-hover:scale-105 transition-transform shrink-0`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                                    {item.label}
                                  </span>
                                  {item.badge && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>On-Device Signal Processing • ABDM / FHIR Compliant</span>
                  </div>
                  <button
                    onClick={() => handleNavigate('/profile')}
                    className="font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Patient Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right: Quick Action, Settings, Theme & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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

            {/* Settings Modal Launcher Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              title="Settings & Biometrics Configuration"
              aria-label="Settings"
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-200 transition-all active:scale-95"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Test on Phone (Live Cloud Tunnel QR Code) */}
            <button
              onClick={() => setShowQRModal(true)}
              title="Scan QR Code to open HealthScan live on your phone"
              className="flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto px-0 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all active:scale-[0.98]"
            >
              <QrCode className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="hidden md:inline">Test on Phone</span>
            </button>

            {/* Download / Install PWA App Button (Hidden if already installed) */}
            {!isInstalled && onInstallPWA && (
              <button
                onClick={onInstallPWA}
                title="Download & Install HealthScan PWA"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 dark:bg-teal-500/15 dark:hover:bg-teal-500/25 border border-teal-500/30 text-xs font-semibold text-teal-700 dark:text-teal-300 transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden text-[11px]">Install</span>
              </button>
            )}

            {/* Quick 60s Scan CTA Button - desktop and tablet */}
            <button
              onClick={onStartScan}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 fill-white stroke-white" />
              <span>60s Scan</span>
            </button>

            {/* Interactive User Profile Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all focus:outline-none pl-1 sm:pl-1.5"
                  aria-label="User account menu"
                >
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 p-0.5 shadow-sm">
                      <div className="w-full h-full rounded-full bg-teal-50 dark:bg-[#0E1422] flex items-center justify-center font-bold text-teal-700 dark:text-teal-300 text-xs">
                        {initials}
                      </div>
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#090D17]" />
                  </div>
                  <div className="hidden 2xl:block text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                      <span>{displayName}</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">ABHA Synced</div>
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64 p-2 bg-white/95 dark:bg-[#0D1321]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xl"
              >
                {/* User Info Header */}
                <div className="p-2.5 mb-1 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05]">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{displayName}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{emailOrAbha}</div>
                  <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified ABHA Patient</span>
                  </div>
                </div>

                <DropdownMenuItem
                  onClick={() => handleNavigate('/profile')}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                >
                  <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>My Health Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleNavigate('/emergency-contacts')}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                >
                  <Phone className="w-4 h-4 text-rose-500" />
                  <span>Emergency Health ID</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleNavigate('/doctor-report')}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Physician Report Brief</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                >
                  <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Settings & Preferences</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 border-slate-200/80 dark:border-white/[0.08]" />

                {currentUser ? (
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => loginAsDemo()}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-teal-600 dark:text-teal-400 cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950/20"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Load Demo Patient</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation menu"
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-200 transition-all active:scale-95"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop blur */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-full max-w-sm h-full bg-white dark:bg-[#0B101D] text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col z-10 overflow-hidden animate-slide-up sm:animate-none">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-xs flex items-center justify-center">
                  HS
                </div>
                <span className="font-bold text-sm tracking-tight">HealthScan Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Profile Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20 flex items-center justify-between gap-3">
                <div 
                  onClick={() => handleNavigate('/profile')}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 p-0.5 shrink-0">
                    <div className="w-full h-full rounded-full bg-white dark:bg-[#0E1422] flex items-center justify-center font-bold text-teal-700 dark:text-teal-300 text-xs">
                      {initials}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{emailOrAbha}</div>
                    <span className="text-[9px] font-semibold text-teal-600 dark:text-teal-400">View Patient Profile →</span>
                  </div>
                </div>
                {currentUser && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    title="Sign Out"
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Scan CTA */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onStartScan();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all"
              >
                <Zap className="w-4 h-4 fill-white stroke-white" />
                <span>Start 60-Second Full Scan</span>
              </button>

              {/* Install PWA Mobile Action (Hidden if already installed) */}
              {!isInstalled && onInstallPWA && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onInstallPWA();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/25 text-left active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Install HealthScan App</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Add to Home Screen • Offline & Fast</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-600 text-white shrink-0">Install</span>
                </button>
              )}

              {/* Navigation Categories */}
              {NAV_CATEGORIES.map((category) => (
                <div key={category.title} className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    {category.title}
                  </div>
                  <div className="space-y-1">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.href}
                          onClick={() => handleNavigate(item.href)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer transition-colors active:scale-[0.99]"
                        >
                          <div className={`p-2 rounded-lg bg-slate-100 dark:bg-white/[0.05] ${item.color || 'text-teal-600 dark:text-teal-400'} shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {item.label}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSettingsModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowQRModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>QR Tunnel</span>
              </button>

              <button
                onClick={toggleMode}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200"
                aria-label="Toggle theme"
              >
                {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Live Testing Modal */}
      <QRCodeModal 
        isOpen={showQRModal} 
        onClose={() => setShowQRModal(false)} 
      />

      {/* Biometric & Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
};

export default AppNavbar;
