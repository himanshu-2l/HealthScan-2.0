import React from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const LabsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const segments = location.pathname.split('/').filter(Boolean);
  const isLabDetail = segments.length > 1;

  // Lab detail view - render header with canonical Back navigation + outlet
  if (isLabDetail) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        {/* Clean Back Navigation */}
        <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070A11]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] pt-[env(safe-area-inset-top,0px)] transition-colors">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
            <button
              onClick={() => {
                navigate('/app?tab=labs');
              }}
              aria-label="Back to Clinical Labs"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] text-sm font-semibold text-slate-700 dark:text-slate-200 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Labs</span>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-[10px]">
                HS
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-6 pb-24 md:pb-12 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    );
  }

  // When accessed at /labs directly, resolve to the canonical modern Labs experience
  return <Navigate to="/app?tab=labs" replace />;
};

export default LabsPage;
