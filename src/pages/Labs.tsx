import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { SubPageHeader } from '@/components/pwa/SubPageHeader';

export const LabsPage: React.FC = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const isLabDetail = segments.length > 1;

  // Lab detail view - render header with canonical Back navigation + outlet
  if (isLabDetail) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        <SubPageHeader backLabel="Back to Labs" backTo="/app?tab=labs" category="Clinical Diagnostics" />
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
