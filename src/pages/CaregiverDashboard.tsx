/**
 * Caregiver Dashboard Page
 * Standalone page wrapper for the CaregiverView component
 * Mobile responsive, no main navbar for caregivers
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CaregiverView } from '@/components/diabetes/CaregiverView';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Heart, Shield } from 'lucide-react';

export default function CaregiverDashboard() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState<string>('');

  // Load patient name from localStorage
  useEffect(() => {
    try {
      // Try to get user profile from localStorage
      const profileData = localStorage.getItem('healthscan_user_profile');
      if (profileData) {
        const profile = JSON.parse(profileData);
        if (profile.name) {
          setPatientName(profile.name);
        }
      }

      // Fallback: try patient profile service data
      if (!patientName) {
        const patientProfileData = localStorage.getItem('healthscan_patient_profile');
        if (patientProfileData) {
          const profile = JSON.parse(patientProfileData);
          if (profile.name) {
            setPatientName(profile.name);
          }
        }
      }
    } catch (error) {
      console.error('Error loading patient name:', error);
    }
  }, [patientId]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Simple Header - Standalone, no main navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 dark:bg-teal-500/20 rounded-xl border border-teal-200/80 dark:border-teal-500/30">
                <Shield className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                  HealthScan
                </h1>
                <p className="text-xs md:text-sm font-medium text-teal-600 dark:text-teal-400">
                  Caregiver View
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoHome}
                className="text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <Home className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Patient Name Banner */}
      {patientName && (
        <div className="bg-teal-50/80 dark:bg-teal-500/10 border-b border-teal-200/60 dark:border-teal-500/20">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span className="text-slate-700 dark:text-white/80">
                Monitoring:{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{patientName}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="py-6">
        <CaregiverView patientName={patientName} patientId={patientId} />
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/10 py-6 mt-auto bg-white/40 dark:bg-transparent">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-slate-500 dark:text-white/40 text-sm">
            HealthScan Caregiver Dashboard
          </p>
          <p className="text-slate-400 dark:text-white/30 text-xs mt-2">
            Read-only view • Data refreshes every 5 minutes
          </p>
        </div>
      </footer>
    </div>
  );
}
