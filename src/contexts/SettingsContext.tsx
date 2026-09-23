import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppSettings {
  // Audio Settings
  audioEnabled: boolean;
  microphoneGain: number[];
  noiseReduction: boolean;
  echoCancellation: boolean;
  
  // Video Settings
  videoEnabled: boolean;
  cameraResolution: string;
  frameRate: string;
  
  // Analysis Settings
  realTimeAnalysis: boolean;
  autoSave: boolean;
  analysisDepth: string;
  
  // Privacy Settings
  dataRetention: string;
  anonymousUsage: boolean;
  
  // Accessibility
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;

  // Wearables & Smartwatch Settings
  smartwatchSyncEnabled: boolean;
  googleFitSyncEnabled: boolean;
  syncFrequency: string;
  syncHeartRate: boolean;
  syncSteps: boolean;
  syncSleep: boolean;
  syncSpO2: boolean;
  syncCalories: boolean;
}

const defaultSettings: AppSettings = {
  // Audio Settings
  audioEnabled: true,
  microphoneGain: [75],
  noiseReduction: true,
  echoCancellation: true,
  
  // Video Settings
  videoEnabled: true,
  cameraResolution: '720p',
  frameRate: '30fps',
  
  // Analysis Settings
  realTimeAnalysis: true,
  autoSave: true,
  analysisDepth: 'standard',
  
  // Privacy Settings
  dataRetention: '30days',
  anonymousUsage: false,
  
  // Accessibility
  highContrast: false,
  largeText: false,
  reducedMotion: false,

  // Wearables & Smartwatch Settings
  smartwatchSyncEnabled: true,
  googleFitSyncEnabled: false,
  syncFrequency: '5min',
  syncHeartRate: true,
  syncSteps: true,
  syncSleep: true,
  syncSpO2: true,
  syncCalories: true
};

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: any) => void;
  resetSettings: () => void;
  exportSettings: () => void;
  importSettings: (settingsData: Partial<AppSettings>) => void;
  isSettingsOpen: boolean;
  activeTab: string;
  openSettings: (tab?: string) => void;
  closeSettings: () => void;
  setActiveTab: (tab: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('audio');

  const openSettings = (tab?: string) => {
    if (tab) {
      setActiveTab(tab);
    }
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('healthscan-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(defaultSettings);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('healthscan-settings', JSON.stringify(settings));
    
    // Apply accessibility settings to document
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    if (settings.largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
    
    if (settings.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [settings]);

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('healthscan-settings');
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `healthscan-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importSettings = (settingsData: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...settingsData }));
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      resetSettings,
      exportSettings,
      importSettings,
      isSettingsOpen,
      activeTab,
      openSettings,
      closeSettings,
      setActiveTab
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
