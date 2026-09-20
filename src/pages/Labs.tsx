import React, { useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { 
  Heart, Hand, Footprints, Eye, Mic, Brain, Ear, Wind, Scan, Apple, 
  Lock, ArrowRight, FlaskConical, Clock, CheckCircle2
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
}

const labCategories: LabCategory[] = [
  { id: 'cardiovascular', name: 'Cardiovascular Lab', description: 'Heart rate, HRV analysis, and cardiac health', icon: Heart, color: 'red', status: 'available', path: 'cardiovascular' },
  { id: 'motor', name: 'Motor Lab', description: 'Tremor detection and motor function analysis', icon: Hand, color: 'blue', status: 'available', path: 'motor' },
  { id: 'gait', name: 'Gait Lab', description: 'Walking pattern and balance analysis', icon: Footprints, color: 'cyan', status: 'available', path: 'gait' },
  { id: 'eye', name: 'Eye Lab', description: 'Pupil response and eye tracking tests', icon: Eye, color: 'green', status: 'available', path: 'eye' },
  { id: 'voice', name: 'Voice Lab', description: 'Voice pattern and speech analysis', icon: Mic, color: 'purple', status: 'available', path: 'voice' },
  { id: 'mental-health', name: 'Mental Health Lab', description: 'Cognitive and psychological assessments', icon: Brain, color: 'pink', status: 'available', path: 'mental-health' },
  { id: 'vision-hearing', name: 'Vision & Hearing Lab', description: 'Visual acuity and hearing tests', icon: Ear, color: 'amber', status: 'available', path: 'vision-hearing' },
  { id: 'respiratory', name: 'Respiratory Lab', description: 'Breathing patterns and lung capacity', icon: Wind, color: 'teal', status: 'coming-soon', path: 'respiratory' },
  { id: 'skin-dermal', name: 'Skin & Dermal Lab', description: 'Skin analysis and dermatological screening', icon: Scan, color: 'orange', status: 'coming-soon', path: 'skin-dermal' },
  { id: 'nutritional', name: 'Nutritional Lab', description: 'Dietary analysis and nutritional assessment', icon: Apple, color: 'lime', status: 'coming-soon', path: 'nutritional' },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
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
        p-4 sm:p-5 rounded-xl transition-all duration-300
        ${isAvailable ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}
        ${isAvailable ? 'hover:scale-[1.02] hover:border-white/20' : ''}
      `}
    >
      {/* Icon Section */}
      <div className="mb-3 sm:mb-4">
        <div className={`
          w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center
          ${colors.bg} ${colors.border} border
        `}>
          <IconComponent className={`w-6 h-6 sm:w-7 sm:h-7 ${colors.text}`} />
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-white">{lab.name}</h3>
          {isAvailable ? (
            <span className="status-badge-good text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Available
            </span>
          ) : (
            <span className="bg-white/10 text-white/50 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Coming Soon
            </span>
          )}
        </div>
        
        <p className="text-white/60 text-sm leading-relaxed">
          {lab.description}
        </p>
      </div>

      {/* Footer */}
      {isAvailable && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-end text-sm text-white/50 group-hover:text-white/80 transition-colors">
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
      <div className="min-h-screen flex flex-col">
        <GlassNavbar showBack />
        <main className="container mx-auto px-3 sm:px-4 py-8 pt-24 overflow-x-hidden">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <GlassNavbar />
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-8 pt-24 flex-1 overflow-x-hidden">
        {/* Page Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-cyan-500/20 border border-cyan-500/30">
              <FlaskConical className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Health Labs
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-6">
            Comprehensive health assessments powered by AI and computer vision
          </p>
          
          {/* Progress Indicator */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm text-white/60 mb-2">
              <span>{completedCount} of {totalAvailable} labs completed</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lab Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-12">
          {labCategories.map((lab, index) => (
            <LabCard key={lab.id} lab={lab} index={index} />
          ))}
        </div>

        {/* Recent Results Section */}
        {recentResults.length > 0 && (
          <div className="glass-card p-4 sm:p-6 rounded-xl animate-fade-in-up animate-stagger-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-white/60" />
              <h2 className="text-xl font-semibold text-white">Recent Results</h2>
            </div>
            <div className="space-y-3">
              {recentResults.slice(0, 5).map((result, idx) => (
                <div 
                  key={result.id || idx} 
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-2 h-2 rounded-full
                      ${result.riskLevel === 'low' ? 'bg-green-500' : 
                        result.riskLevel === 'medium' ? 'bg-amber-500' : 
                        result.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-500'}
                    `} />
                    <div>
                      <p className="text-white text-sm font-medium capitalize">
                        {result.testType?.replace(/-/g, ' ') || 'Health Test'}
                      </p>
                      <p className="text-white/40 text-xs">
                        {new Date(result.testDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm">
                      {result.scorePercentage ? `${Math.round(result.scorePercentage)}%` : '--'}
                    </p>
                    <p className={`text-xs capitalize ${
                      result.riskLevel === 'low' ? 'text-green-400' : 
                      result.riskLevel === 'medium' ? 'text-amber-400' : 
                      result.riskLevel === 'high' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {result.riskLevel || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <Link 
              to="/report" 
              className="mt-4 inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
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
