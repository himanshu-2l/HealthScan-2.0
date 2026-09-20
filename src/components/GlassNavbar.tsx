import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Brain,
  MessageCircle,
  HelpCircle,
  Settings,
  Menu,
  X,
  Home,
  Cpu,
  Palette,
  Info,
  Hospital,
  Activity,
  FileText,
  Heart,
  User,
  Droplet,
  ChevronDown,
  LogOut,
  LogIn,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Stethoscope,
  Calendar,
  Mic,
  Syringe,
  Phone,
  Watch,
  HeartPulse
} from 'lucide-react';
import { ChatBot } from './ChatBot';
import { FAQModal } from './FAQModal';
import { SettingsModal } from './SettingsModal';
import { ThemeSelector } from './ThemeSelector';
import { useTheme } from '@/contexts/ThemeContext';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface GlassNavbarProps {
  showBack?: boolean;
  onBackClick?: () => void;
}

// Breadcrumb label mapping for better display names
const routeLabels: Record<string, string> = {
  '': 'Home',
  'dashboard': 'Dashboard',
  'labs': 'Labs',
  'motor': 'Motor Lab',
  'voice': 'Voice Lab',
  'eye': 'Eye Lab',
  'cardiovascular': 'Cardiovascular Lab',
  'mental-health': 'Mental Health Lab',
  'vision-hearing': 'Vision & Hearing Lab',
  'gait': 'Gait Lab',
  'respiratory': 'Respiratory Lab',
  'skin-dermal': 'Skin & Dermal Lab',
  'nutritional': 'Nutritional Lab',
  'report': 'Reports',
  'bp-tracker': 'BP Tracker',
  'diabetes': 'Diabetes Management',
  'ehr': 'EHR',
  'profile': 'Profile',
  'about': 'About',
  'hardware-integration': 'Hardware',
  'login': 'Login',
  'health-predictions': 'Health Predictions',
  'recommendations': 'Recommendations',
  'symptom-checker': 'Symptom Checker',
  'period-tracker': 'Hormonal Health',
  'voice-entry': 'Voice Entry',
  'doctor-report': 'Doctor Report',
  'vaccinations': 'Vaccinations',
  'emergency-contacts': 'Emergency Contacts',
  'smartwatch': 'Smartwatch',
};

export const GlassNavbar: React.FC<GlassNavbarProps> = ({ showBack, onBackClick }) => {
  const { currentUser, logout } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { colors } = useTheme();

  const publicItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Hardware', href: '/hardware-integration', icon: Cpu },
    { label: 'About', href: '/about', icon: Info },
  ];

  const protectedItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Activity },
    { label: 'Labs', href: '/labs', icon: Cpu },
    { label: 'Reports', href: '/report', icon: FileText },
    { label: 'BP Tracker', href: '/bp-tracker', icon: Heart },
  ];

  const navCategories = [
    {
      label: 'Health Tracking',
      items: [
        { label: 'Diabetes', href: '/diabetes', icon: Droplet },
        { label: 'Hormonal Health', href: '/period-tracker', icon: HeartPulse },
        { label: 'Vaccinations', href: '/vaccinations', icon: Syringe },
      ]
    },
    {
      label: 'AI & Insights',
      items: [
        { label: 'Health Predictions', href: '/health-predictions', icon: TrendingUp },
        { label: 'Recommendations', href: '/recommendations', icon: Sparkles },
        { label: 'Symptom Checker', href: '/symptom-checker', icon: Stethoscope },
      ]
    },
    {
      label: 'Tools',
      items: [
        { label: 'Voice Entry', href: '/voice-entry', icon: Mic },
        { label: 'Doctor Report', href: '/doctor-report', icon: FileText },
        { label: 'EHR', href: '/ehr', icon: Hospital },
      ]
    },
    {
      label: 'Safety & Devices',
      items: [
        { label: 'Emergency Contacts', href: '/emergency-contacts', icon: Phone },
        { label: 'Smartwatch', href: '/smartwatch', icon: Watch },
      ]
    }
  ];

  // Combine items based on auth state
  const visibleNavItems = currentUser
    ? [...publicItems.slice(0, 1), ...protectedItems]
    : publicItems;

  const visibleNavCategories = currentUser ? navCategories : [];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Generate breadcrumbs from current path
  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length <= 1) return []; // Don't show breadcrumbs for top-level routes
    
    return pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      const isLast = index === pathSegments.length - 1;
      return { path, label, isLast };
    });
  }, [location.pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!currentUser?.displayName) return null;
    const names = currentUser.displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  };

  return (
    <>
      <nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 hover:opacity-90 transition-opacity duration-200 group"
              aria-label="Health Scan Home"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-20 group-hover:opacity-30 transition-opacity duration-200"></div>
                <Brain className="w-8 h-8 text-primary relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground leading-tight">
                  Health Scan
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">ABDM Integrated</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1" role="menubar">
              {visibleNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    role="menuitem"
                    aria-label={`Navigate to ${item.label}`}
                    aria-current={active ? 'page' : undefined}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent
                      ${active
                        ? 'text-white bg-white/10 border-b-2 border-purple-400'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <item.icon className={`w-4 h-4 transition-colors duration-200 ${active ? 'text-purple-400' : ''}`} />
                    <span>{item.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-purple-400 rounded-full"></span>
                    )}
                  </Link>
                );
              })}

              {/* More Menu - Only show if there are categories */}
              {visibleNavCategories.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      aria-label="More navigation options"
                      aria-haspopup="true"
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        text-white/70 hover:text-white hover:bg-white/5
                        focus:outline-none focus:ring-2 focus:ring-primary/50
                      `}
                    >
                      <span>More</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56 bg-black/90 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-1"
                  >
                    {visibleNavCategories.map((category, categoryIndex) => (
                      <div key={category.label}>
                        {categoryIndex > 0 && (
                          <div className="border-b border-white/[0.06] my-1" />
                        )}
                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/30 font-medium">
                          {category.label}
                        </div>
                        {category.items.map((item) => {
                          const active = isActive(item.href);
                          return (
                            <DropdownMenuItem 
                              key={item.label} 
                              asChild 
                              className={`focus:bg-white/10 focus:text-primary cursor-pointer transition-colors duration-200 rounded-lg mx-1 ${active ? 'text-primary bg-white/5' : 'text-white/60 hover:text-white'}`}
                            >
                              <Link
                                to={item.href}
                                className="flex items-center gap-2 px-2 py-2"
                                aria-label={`Navigate to ${item.label}`}
                                aria-current={active ? 'page' : undefined}
                              >
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">

              {!currentUser ? (
                <div className="hidden lg:block mr-2">
                  <Link to="/login" aria-label="Sign in to your account">
                    <Button variant="default" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all duration-200">
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="hidden lg:block mr-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="relative h-10 w-10 rounded-full transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                        aria-label="User menu"
                        aria-haspopup="true"
                      >
                        <Avatar className="h-9 w-9 border-2 border-white/20 hover:border-purple-400/50 transition-colors duration-200">
                          <AvatarImage src={currentUser.photoURL || ''} alt={currentUser.displayName || 'User avatar'} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                            {getUserInitials() || <User className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 glass-panel border-white/10 bg-black/90 backdrop-blur-xl">
                      <div className="flex items-center gap-3 p-3">
                        <Avatar className="h-10 w-10 border border-white/20">
                          <AvatarImage src={currentUser.photoURL || ''} alt={currentUser.displayName || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                            {getUserInitials() || <User className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-0.5 overflow-hidden">
                          <p className="text-sm font-medium text-white leading-none truncate">{currentUser.displayName}</p>
                          <p className="text-xs leading-none text-white/60 truncate">{currentUser.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-primary cursor-pointer transition-colors duration-200">
                        <Link to="/profile" className="flex items-center" aria-label="View profile">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setIsSettingsOpen(true)} 
                        className="focus:bg-white/10 focus:text-primary cursor-pointer transition-colors duration-200"
                        aria-label="Open settings"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem 
                        onClick={() => logout()} 
                        className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer transition-colors duration-200"
                        aria-label="Sign out"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {/* Quick Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-white/10 text-muted-foreground hover:text-primary rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    aria-label="Quick settings menu"
                    aria-haspopup="true"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 glass-panel border-white/10 bg-black/80 backdrop-blur-xl">
                  <DropdownMenuItem onClick={() => setIsChatOpen(true)} className="focus:bg-white/10 focus:text-primary cursor-pointer text-gray-300 transition-colors duration-200">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    <span>Chat Assistant</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsFAQOpen(true)} className="focus:bg-white/10 focus:text-primary cursor-pointer text-gray-300 transition-colors duration-200">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    <span>FAQ</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={() => setIsThemeSelectorOpen(true)} className="focus:bg-white/10 focus:text-primary cursor-pointer text-gray-300 transition-colors duration-200">
                    <Palette className="w-4 h-4 mr-2" />
                    <span>Theme</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="focus:bg-white/10 focus:text-primary cursor-pointer text-gray-300 transition-colors duration-200">
                    <Settings className="w-4 h-4 mr-2" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle - Animated hamburger */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden hover:bg-white/10 text-muted-foreground hover:text-primary rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <div className="relative w-5 h-5">
                  <span 
                    className={`absolute left-0 w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                      isMobileMenuOpen ? 'top-2.5 rotate-45' : 'top-1'
                    }`}
                  />
                  <span 
                    className={`absolute left-0 top-2.5 w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                      isMobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                    }`}
                  />
                  <span 
                    className={`absolute left-0 w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                      isMobileMenuOpen ? 'top-2.5 -rotate-45' : 'top-4'
                    }`}
                  />
                </div>
              </Button>
            </div>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav 
              className="hidden sm:flex items-center gap-1 pb-2 -mt-1 text-xs"
              aria-label="Breadcrumb"
            >
              <Link 
                to="/" 
                className="text-white/50 hover:text-white/70 transition-colors duration-200"
                aria-label="Go to home"
              >
                <Home className="w-3 h-3" />
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  <ChevronRight className="w-3 h-3 text-white/30" aria-hidden="true" />
                  {crumb.isLast ? (
                    <span className="text-white font-medium" aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link 
                      to={crumb.path} 
                      className="text-white/50 hover:text-white/70 transition-colors duration-200"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`fixed top-16 left-0 right-0 z-40 lg:hidden transform transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
        role="menu"
        aria-label="Mobile navigation"
      >
        <div className="border-t border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="py-3 space-y-1 px-4">
            {/* User info section for mobile */}
            {currentUser && (
              <>
                <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-white/5">
                  <Avatar className="h-10 w-10 border-2 border-purple-400/50">
                    <AvatarImage src={currentUser.photoURL || ''} alt={currentUser.displayName || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                      {getUserInitials() || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-white truncate">{currentUser.displayName}</span>
                    <span className="text-xs text-white/60 truncate">{currentUser.email}</span>
                  </div>
                </div>
                <div className="border-t border-white/10 my-2"></div>
              </>
            )}

            {visibleNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  role="menuitem"
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary/50
                    ${active
                      ? 'text-white bg-white/10 border-l-2 border-purple-400'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={`w-5 h-5 transition-colors duration-200 ${active ? 'text-purple-400' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {/* Categorized navigation items for mobile */}
            {visibleNavCategories.map((category, categoryIndex) => (
              <div key={category.label}>
                <div className="border-t border-white/[0.06] my-2"></div>
                <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-white/30 font-medium">
                  {category.label}
                </div>
                {category.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      role="menuitem"
                      aria-label={`Navigate to ${item.label}`}
                      aria-current={active ? 'page' : undefined}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-primary/50
                        ${active
                          ? 'text-white bg-white/10 border-l-2 border-purple-400'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                        }
                      `}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className={`w-5 h-5 transition-colors duration-200 ${active ? 'text-purple-400' : ''}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
            <div className="border-t border-white/10 my-2"></div>
            <button
              onClick={() => {
                setIsChatOpen(true);
                setIsMobileMenuOpen(false);
              }}
              role="menuitem"
              aria-label="Open chat assistant"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat Assistant</span>
            </button>
            <button
              onClick={() => {
                setIsFAQOpen(true);
                setIsMobileMenuOpen(false);
              }}
              role="menuitem"
              aria-label="Open FAQ"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <HelpCircle className="w-5 h-5" />
              <span>FAQ</span>
            </button>
            <button
              onClick={() => {
                setIsThemeSelectorOpen(true);
                setIsMobileMenuOpen(false);
              }}
              role="menuitem"
              aria-label="Open theme selector"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <Palette className="w-5 h-5" />
              <span>Theme</span>
            </button>
            <button
              onClick={() => {
                setIsSettingsOpen(true);
                setIsMobileMenuOpen(false);
              }}
              role="menuitem"
              aria-label="Open settings"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>

            {/* Auth actions for mobile */}
            <div className="border-t border-white/10 my-2"></div>
            {!currentUser ? (
              <Link
                to="/login"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
                role="menuitem"
                aria-label="Sign in"
              >
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/profile"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                  role="menuitem"
                  aria-label="View profile"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  role="menuitem"
                  aria-label="Sign out"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <FAQModal isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ThemeSelector isOpen={isThemeSelectorOpen} onClose={() => setIsThemeSelectorOpen(false)} />
    </>
  );
};
