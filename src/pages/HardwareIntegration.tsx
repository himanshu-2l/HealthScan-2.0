import React from 'react';
import { SubPageHeader } from '@/components/pwa/SubPageHeader';
import { SiteFooter } from '@/components/SiteFooter';
import HardwareDataDisplay from '@/components/HardwareDataDisplay';

const HardwareIntegration: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <SubPageHeader backLabel="Back to App" backTo="/" category="Sensors & Microcontrollers" />

      <div className="py-8 pb-24 md:pb-12 flex-1">
        <HardwareDataDisplay />
      </div>
      <SiteFooter />
    </div>
  );
};

export default HardwareIntegration;
