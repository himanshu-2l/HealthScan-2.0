import React, { useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { 
  Heart, Hand, Footprints, Eye, Mic, Brain, Ear, Wind, Scan, Apple, 
  Lock, ArrowRight, FlaskConical, Clock, CheckCircle2, Pill
} from 'lucide-react';
import { getRecentResults } from '@/services/healthDataService';
import type { LucideIcon } from 'lucide-react';

interface LabCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  status: 'available' | 'coming-soon';
  path: string;
  image?: string;
}

const labCategories: LabCategory[] = [
  { id: 'cardiovascular', name: 'Cardiovascular Lab', description: 'Heart rate, HRV analysis, and cardiac health', icon: Heart, color: 'red', status: 'available', path: 'cardiovascular', image: '/images/ppg-scan.jpg' },
  { id: 'medicine-lens', name: 'Medicine Lens', description: 'Packaging OCR, Indian salt resolution, and deterministic safety', icon: Pill, color: 'indigo', status: 'available', path: 'medicine-lens' },
  { id: 'motor', name: 'Motor Lab', description: 'Tremor detection and motor function analysis', icon: Hand, color: 'blue', status: 'available', path: 'motor', image: '/images/motor-scan.jpg' },
  { id: 'gait', name: 'Gait Lab', description: 'Walking pattern and balance analysis', icon: Footprints, color: 'cyan', status: 'available', path: 'gait' },
  { id: 'eye', name: 'Eye Lab', description: 'Pupil response and eye tracking tests', icon: Eye, color: 'green', status: 'available', path: 'eye' },
  { id: 'voice', name: 'Voice Lab', description: 'Voice pattern and speech analysis', icon: Mic, color: 'purple', status: 'available', path: 'voice', image: '/images/voice-scan.jpg' },
  { id: 'mental-health', name: 'Mental Health Lab', description: 'Cognitive and psychological assessments', icon: Brain, color: 'pink', status: 'available', path: 'mental-health' },
  { id: 'vision-hearing', name: 'Vision & Hearing Lab', description: 'Visual acuity and hearing tests', icon: Ear, color: 'amber', status: 'available', path: 'vision-hearing' },
  { id: 'respiratory', name: 'Respiratory Lab', description: 'Breathing patterns and lung capacity', icon: Wind, color: 'teal', status: 'coming-soon', path: 'respiratory' },
  { id: 'skin-dermal', name: 'Skin & Dermal Lab', description: 'Skin analysis and dermatological screening', icon: Scan, color: 'orange', status: 'coming-soon', path: 'skin-dermal' },
  { id: 'nutritional', name: 'Nutritional Lab', description: 'Dietary analysis and nutritional assessment', icon: Apple, color: 'lime', status: 'coming-soon', path: 'nutritional' },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  teal: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  lime: { bg: 'bg-lime-500/20', text: 'text-lime-400', border: 'border-lime-500/30' },
};

const LabCard: React.FC<{ lab: LabCategory; index: number }> = ({ lab, index }) => {
  const navigate = useNavigate();
  const IconComponent = lab.icon;
  const colors = colorMap[lab.color] || colorMap.blue;
  const isAvailable = lab.status === 'available';
  
  const staggerClass = `animate-stagger-${(index % 4) + 1}`;
  
  const handleClick = () => {
    if (isAvailable) {
      navigate(`/labs/${lab.path}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        glass-card glass-card-hover animate-fade-in-up ${staggerClass}
        p-4 sm:p-5 rounded-2xl transition-all duration-300 flex flex-col justify-between
        ${isAvailable ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}
        ${isAvailable ? 'hover:scale-[1.02] hover:border-teal-500/40 dark:hover:border-white/20' : ''}
      `}
    >
      <div>
        {/* Visual Banner or Icon Header */}
        {lab.image ? (
          <div className="relative mb-3.5 h-32 rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-sm group">
            <img 
              src={lab.image} 
              alt={lab.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
              <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.border} border shadow-sm backdrop-blur-sm`}>
                <IconComponent className={`w-4 h-4 ${colors.text}`} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-3 sm:mb-4">
            <div className={`
              w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center
              ${colors.bg} ${colors.border} border shadow-sm
            `}>
              <IconComponent className={`w-6 h-6 sm:w-7 sm:h-7 ${colors.text}`} />
            </div>
          </div>
        )}

      {/* Content Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{lab.name}</h3>
          {isAvailable ? (
            <span className="status-badge-good text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Available
            </span>
          ) : (
            <span className="bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/50 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
              <Lock className="w-3 h-3" />
              Coming Soon
            </span>
          )}
        </div>
        
        <p className="text-slate-600 dark:text-white/60 text-sm leading-relaxed">
          {lab.description}
        </p>
      </div>
      </div>

      {/* Footer */}
      {isAvailable && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-end text-sm font-medium text-slate-500 dark:text-white/50 group-hover:text-teal-600 dark:group-hover:text-white/80 transition-colors">
            <span className="mr-1">Enter Lab</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};

const LabsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLabDetail = location.pathname.split('/').length > 2;

  // Get recent results for the summary section
  const recentResults = useMemo(() => getRecentResults(5), []);

  // Calculate progress
  const availableLabs = labCategories.filter(l => l.status === 'available');
  const completedLabIds = useMemo(() => {
    const uniqueCategories = new Set<string>();
    recentResults.forEach(result => {
      // Map test categories to lab IDs
      if (result.category === 'cardiovascular') uniqueCategories.add('cardiovascular');
      if (result.category === 'neurological') uniqueCategories.add('mental-health');
      if (result.testType?.includes('motor') || result.testType?.includes('tremor')) uniqueCategories.add('motor');
      if (result.testType?.includes('gait')) uniqueCategories.add('gait');
      if (result.testType?.includes('eye') || result.testType?.includes('vision')) uniqueCategories.add('eye');
      if (result.testType?.includes('voice') || result.testType?.includes('speech')) uniqueCategories.add('voice');
      if (result.testType?.includes('hearing')) uniqueCategories.add('vision-hearing');
    });
    return uniqueCategories;
  }, [recentResults]);
  
  const completedCount = completedLabIds.size;
  const totalAvailable = availableLabs.length;
  const progressPercent = totalAvailable > 0 ? (completedCount / totalAvailable) * 100 : 0;

  // Lab detail view - render only the outlet
  if (isLabDetail) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        {/* Clean Back Navigation */}
        <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070A11]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] transition-colors">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
            <button
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate('/labs');
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] text-sm font-semibold text-slate-700 dark:text-slate-200 transition active:scale-[0.98]"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back</span>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-[10px]">
                HS
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <GlassNavbar />
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-8 pt-24 flex-1 overflow-x-hidden">
        {/* Page Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400">
              <FlaskConical className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Health Labs
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-white/60 max-w-2xl mx-auto mb-6">
            Comprehensive health assessments powered by AI and computer vision
          </p>
          
          {/* Progress Indicator */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-white/60 mb-2">
              <span>{completedCount} of {totalAvailable} labs completed</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lab Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {labCategories.map((lab, index) => (
            <LabCard key={lab.id} lab={lab} index={index} />
          ))}
        </div>

        {/* Recent Results Section */}
        {recentResults.length > 0 && (
          <div className="glass-card p-5 sm:p-6 rounded-3xl animate-fade-in-up animate-stagger-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-500 dark:text-white/60" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Results</h2>
            </div>
            <div className="space-y-3">
              {recentResults.slice(0, 5).map((result, idx) => (
                <div 
                  key={result.id || idx} 
                  className="flex items-center justify-between py-2.5 border-b border-slate-200 dark:border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-2.5 h-2.5 rounded-full
                      ${result.riskLevel === 'low' ? 'bg-emerald-500' : 
                        result.riskLevel === 'medium' ? 'bg-amber-500' : 
                        result.riskLevel === 'high' ? 'bg-orange-500' : 'bg-rose-500'}
                    `} />
                    <div>
                      <p className="text-slate-900 dark:text-white text-sm font-semibold capitalize">
                        {result.testType?.replace(/-/g, ' ') || 'Health Test'}
                      </p>
                      <p className="text-slate-500 dark:text-white/40 text-xs">
                        {new Date(result.testDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-700 dark:text-white/80 text-sm font-bold">
                      {result.scorePercentage ? `${Math.round(result.scorePercentage)}%` : '--'}
                    </p>
                    <p className={`text-xs capitalize font-semibold ${
                      result.riskLevel === 'low' ? 'text-emerald-600 dark:text-emerald-400' : 
                      result.riskLevel === 'medium' ? 'text-amber-600 dark:text-amber-400' : 
                      result.riskLevel === 'high' ? 'text-orange-600 dark:text-orange-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {result.riskLevel || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <Link 
              to="/report" 
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              View all reports
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default LabsPage;
