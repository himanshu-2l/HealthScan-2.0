/**
 * EHR Context - Global state management for EHR integration
 * Manages ABHA authentication, medical history, and EHR settings
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  ABHAProfile,
  PatientMedicalHistory,
  EHRSettings,
} from '@/types/ehr';
import { ehrService } from '@/services/ehrService';

interface EHRContextType {
  // Authentication state
  isAuthenticated: boolean;
  abhaProfile: ABHAProfile | null;
  medicalHistory: PatientMedicalHistory | null;
  
  // Settings
  ehrSettings: EHRSettings;
  updateEHRSettings: (settings: Partial<EHRSettings>) => void;
  
  // Actions
  authenticateWithABHA: (abhaId: string, authMode: 'MOBILE_OTP' | 'AADHAAR_OTP' | 'PASSWORD') => Promise<boolean>;
  fetchMedicalHistory: (abhaId: string) => Promise<void>;
  logout: () => void;
  
  // Loading & Error states
  isLoading: boolean;
  error: string | null;
}

const EHRContext = createContext<EHRContextType | undefined>(undefined);

const defaultEHRSettings: EHRSettings = {
  enabled: false,
  provider: 'ABDM',
  autoUpload: false,
  shareWithDoctors: false,
  longitudinalTracking: true,
  autoReferral: false,
  consentGiven: false,
  linkedDoctors: [],
};

interface EHRProviderProps {
  children: ReactNode;
}

export const EHRProvider: React.FC<EHRProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [abhaProfile, setAbhaProfile] = useState<ABHAProfile | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<PatientMedicalHistory | null>(null);
  const [ehrSettings, setEHRSettings] = useState<EHRSettings>(defaultEHRSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('abhaProfile');
    const savedHistory = localStorage.getItem('medicalHistory');
    const savedSettings = localStorage.getItem('ehrSettings');

    if (savedProfile) {
      try {
        setAbhaProfile(JSON.parse(savedProfile));
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse saved ABHA profile:', e);
      }
    }

    if (savedHistory) {
      try {
        setMedicalHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse saved medical history:', e);
      }
    }

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setEHRSettings({ ...defaultEHRSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse saved EHR settings:', e);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (abhaProfile) {
      localStorage.setItem('abhaProfile', JSON.stringify(abhaProfile));
    } else {
      localStorage.removeItem('abhaProfile');
    }
  }, [abhaProfile]);

  useEffect(() => {
    if (medicalHistory) {
      localStorage.setItem('medicalHistory', JSON.stringify(medicalHistory));
    } else {
      localStorage.removeItem('medicalHistory');
    }
  }, [medicalHistory]);

  useEffect(() => {
    localStorage.setItem('ehrSettings', JSON.stringify(ehrSettings));
  }, [ehrSettings]);

  // Update EHR settings
  const updateEHRSettings = (newSettings: Partial<EHRSettings>) => {
    setEHRSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Authenticate with ABHA
  const authenticateWithABHA = async (
    abhaId: string,
    authMode: 'MOBILE_OTP' | 'AADHAAR_OTP' | 'PASSWORD'
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ehrService.authenticateABHA({ abhaId, authMode });
      
      if (response.success && response.data) {
        setAbhaProfile(response.data.profile);
        setIsAuthenticated(true);
        updateEHRSettings({ abhaId, enabled: true });
        
        // Automatically fetch medical history
        await fetchMedicalHistory(abhaId);
        
        return true;
      } else {
        const errorMsg = response.error?.message || 'Authentication failed';
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch medical history
  const fetchMedicalHistory = async (abhaId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ehrService.fetchMedicalHistory(abhaId);
      
      if (response.success && response.data) {
        setMedicalHistory(response.data);
      } else {
        const errorMsg = response.error?.message || 'Failed to fetch medical history';
        setError(errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch medical history';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setIsAuthenticated(false);
    setAbhaProfile(null);
    setMedicalHistory(null);
    localStorage.removeItem('abhaProfile');
    localStorage.removeItem('medicalHistory');
    updateEHRSettings({ abhaId: undefined, enabled: false });
  };

  const value: EHRContextType = {
    isAuthenticated,
    abhaProfile,
    medicalHistory,
    ehrSettings,
    updateEHRSettings,
    authenticateWithABHA,
    fetchMedicalHistory,
    logout,
    isLoading,
    error,
  };

  return <EHRContext.Provider value={value}>{children}</EHRContext.Provider>;
};

export const useEHR = (): EHRContextType => {
  const context = useContext(EHRContext);
  if (!context) {
    throw new Error('useEHR must be used within an EHRProvider');
  }
  return context;
};

