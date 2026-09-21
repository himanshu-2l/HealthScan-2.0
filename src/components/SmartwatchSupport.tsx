import React, { useState, useEffect } from 'react';
import {
  Watch,
  Heart,
  Footprints,
  Moon,
  Flame,
  Activity,
  Thermometer,
  Wind,
  Dumbbell,
  Brain,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap,
  Smartphone,
} from 'lucide-react';

interface DeviceInfo {
  id: string;
  name: string;
  brand: string;
  icon: string;
  models: string;
  dataTypes: string[];
  connected: boolean;
  lastSync?: string;
  setupSteps: string[];
}

interface ConnectedWearable {
  deviceId: string;
  connectedAt: string;
  lastSync: string;
}

interface DataCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  source: string;
  synced: boolean;
}

const STORAGE_KEY = 'healthscan_connected_wearables';

const SUPPORTED_DEVICES: DeviceInfo[] = [
  {
    id: 'apple-watch',
    name: 'Apple Watch',
    brand: 'Apple',
    icon: '⌚',
    models: 'Series 4+',
    dataTypes: ['Heart Rate', 'ECG', 'Blood Oxygen', 'Steps', 'Sleep', 'Temperature'],
    connected: false,
    setupSteps: [
      'Open the Health app on your iPhone',
      'Tap your profile picture, then tap Apps',
      'Select HealthScan and enable all data sharing',
      'Ensure your Apple Watch is paired and syncing',
    ],
  },
  {
    id: 'google-fit',
    name: 'Google Fit / Wear OS',
    brand: 'Google',
    icon: '🏃',
    models: 'All Wear OS devices',
    dataTypes: ['Heart Rate', 'Steps', 'Calories', 'Sleep', 'Workout Tracking'],
    connected: false,
    setupSteps: [
      'Install Google Fit on your phone and watch',
      'Sign in with your Google account',
      'Go to HealthScan Settings > Connect Google Fit',
      'Authorize data access when prompted',
    ],
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    brand: 'Fitbit',
    icon: '💪',
    models: 'Sense, Versa, Charge',
    dataTypes: ['Heart Rate', 'SpO2', 'Sleep Score', 'Stress Management'],
    connected: false,
    setupSteps: [
      'Open the Fitbit app on your phone',
      'Go to Account > Manage Third-Party Apps',
      'Find HealthScan and tap Connect',
      'Grant access to your health data',
    ],
  },
  {
    id: 'samsung',
    name: 'Samsung Galaxy Watch',
    brand: 'Samsung',
    icon: '⚡',
    models: 'Galaxy Watch 4+',
    dataTypes: ['Heart Rate', 'Blood Pressure', 'Body Composition'],
    connected: false,
    setupSteps: [
      'Open Samsung Health on your phone',
      'Go to Settings > Connected Services',
      'Enable Google Fit sync',
      'Connect HealthScan via Google Fit',
    ],
  },
  {
    id: 'garmin',
    name: 'Garmin',
    brand: 'Garmin',
    icon: '🎯',
    models: 'Venu, Forerunner',
    dataTypes: ['Heart Rate', 'Pulse Ox', 'Body Battery', 'Stress', 'VO2 Max'],
    connected: false,
    setupSteps: [
      'Open Garmin Connect on your phone',
      'Go to Settings > Third-Party Apps',
      'Select HealthScan and authorize',
      'Enable automatic sync',
    ],
  },
];

export const SmartwatchSupport: React.FC = () => {
  const [devices, setDevices] = useState<DeviceInfo[]>(SUPPORTED_DEVICES);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [connectedWearables, setConnectedWearables] = useState<ConnectedWearable[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    // Load connected wearables from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: ConnectedWearable[] = JSON.parse(stored);
        setConnectedWearables(parsed);
        
        // Update devices with connection status
        setDevices(prev => prev.map(device => ({
          ...device,
          connected: parsed.some(w => w.deviceId === device.id),
          lastSync: parsed.find(w => w.deviceId === device.id)?.lastSync,
        })));

        // Calculate sync progress based on connected devices
        const progress = Math.min((parsed.length / SUPPORTED_DEVICES.length) * 100, 100);
        setSyncProgress(progress);

        // Get latest sync time
        if (parsed.length > 0) {
          const latestSync = parsed.reduce((latest, w) => 
            new Date(w.lastSync) > new Date(latest.lastSync) ? w : latest
          );
          setLastSyncTime(latestSync.lastSync);
        }
      } catch (e) {
        console.error('Failed to parse connected wearables:', e);
      }
    }
  }, []);

  const handleConnect = (deviceId: string) => {
    const now = new Date().toISOString();
    const newWearable: ConnectedWearable = {
      deviceId,
      connectedAt: now,
      lastSync: now,
    };

    const updated = [...connectedWearables, newWearable];
    setConnectedWearables(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, connected: true, lastSync: now }
        : device
    ));

    setSyncProgress(Math.min((updated.length / SUPPORTED_DEVICES.length) * 100, 100));
    setLastSyncTime(now);
  };

  const handleDisconnect = (deviceId: string) => {
    const updated = connectedWearables.filter(w => w.deviceId !== deviceId);
    setConnectedWearables(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, connected: false, lastSync: undefined }
        : device
    ));

    setSyncProgress(Math.min((updated.length / SUPPORTED_DEVICES.length) * 100, 100));
  };

  const connectedCount = devices.filter(d => d.connected).length;

  const dataCategories: DataCategory[] = [
    { id: 'heart-rate', name: 'Heart Rate', icon: <Heart className="w-5 h-5 text-red-400" />, source: 'All devices', synced: connectedCount > 0 },
    { id: 'steps', name: 'Steps', icon: <Footprints className="w-5 h-5 text-green-400" />, source: 'All devices', synced: connectedCount > 0 },
    { id: 'sleep', name: 'Sleep', icon: <Moon className="w-5 h-5 text-purple-400" />, source: 'All devices', synced: connectedCount > 0 },
    { id: 'spo2', name: 'SpO2', icon: <Wind className="w-5 h-5 text-blue-400" />, source: 'Fitbit, Apple, Garmin', synced: devices.some(d => ['fitbit', 'apple-watch', 'garmin'].includes(d.id) && d.connected) },
    { id: 'blood-pressure', name: 'Blood Pressure', icon: <Activity className="w-5 h-5 text-pink-400" />, source: 'Samsung (select models)', synced: devices.find(d => d.id === 'samsung')?.connected || false },
    { id: 'ecg', name: 'ECG', icon: <Zap className="w-5 h-5 text-yellow-400" />, source: 'Apple Watch', synced: devices.find(d => d.id === 'apple-watch')?.connected || false },
    { id: 'temperature', name: 'Temperature', icon: <Thermometer className="w-5 h-5 text-orange-400" />, source: 'Apple Watch', synced: devices.find(d => d.id === 'apple-watch')?.connected || false },
    { id: 'calories', name: 'Calories', icon: <Flame className="w-5 h-5 text-amber-400" />, source: 'All devices', synced: connectedCount > 0 },
    { id: 'workouts', name: 'Workouts', icon: <Dumbbell className="w-5 h-5 text-cyan-400" />, source: 'All devices', synced: connectedCount > 0 },
    { id: 'stress', name: 'Stress', icon: <Brain className="w-5 h-5 text-indigo-400" />, source: 'Fitbit, Garmin', synced: devices.some(d => ['fitbit', 'garmin'].includes(d.id) && d.connected) },
  ];

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-8">
      {/* Telemetry Status Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Continuous Health Telemetry</span>
        </div>
        <div className="bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 rounded-full px-3.5 py-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <span className="text-teal-600 dark:text-teal-400 font-bold">{connectedCount}</span> of {SUPPORTED_DEVICES.length} connected
        </div>
      </div>

      {/* Data Sync Status Section */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Data Synchronization Status
        </h2>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Circular Progress */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-200 dark:text-white/10"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * syncProgress) / 100}
                className="text-teal-600 dark:text-teal-400 transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{Math.round(syncProgress)}%</span>
            </div>
          </div>

          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Devices Connected</span>
              <span className="text-slate-900 dark:text-white font-semibold">{connectedCount} / {SUPPORTED_DEVICES.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Last Sync</span>
              <span className="text-slate-900 dark:text-white font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                {lastSyncTime ? formatTime(lastSyncTime) : 'Never'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Data Categories Active</span>
              <span className="text-slate-900 dark:text-white font-semibold">
                {dataCategories.filter(c => c.synced).length} / {dataCategories.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Devices Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Supported Devices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl select-none">{device.icon}</span>
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-semibold text-base">{device.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{device.models}</p>
                  </div>
                </div>
                {device.connected ? (
                  <button
                    onClick={() => handleDisconnect(device.id)}
                    className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs sm:text-sm font-medium border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(device.id)}
                    className="px-4 py-1.5 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 rounded-full text-xs sm:text-sm font-medium border border-slate-200/80 dark:border-white/10 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 hover:border-teal-200 dark:hover:border-teal-800/50 transition-colors shadow-xs"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Data Types Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {device.dataTypes.map((dataType) => (
                  <span
                    key={dataType}
                    className="px-2.5 py-0.5 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 rounded-full text-xs border border-slate-200/70 dark:border-white/10"
                  >
                    {dataType}
                  </span>
                ))}
              </div>

              {device.connected && device.lastSync && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Last synced: {formatTime(device.lastSync)}
                </div>
              )}

              {/* Setup Instructions Accordion */}
              <button
                onClick={() => setExpandedDevice(expandedDevice === device.id ? null : device.id)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {expandedDevice === device.id ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Setup Instructions
              </button>

              {expandedDevice === device.id && (
                <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10">
                  <ol className="space-y-2">
                    {device.setupSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex-shrink-0 w-5 h-5 bg-slate-100 dark:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Health Data Categories */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Health Data Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {dataCategories.map((category) => (
            <div
              key={category.id}
              className={`bg-white dark:bg-slate-900/60 backdrop-blur-sm border rounded-2xl p-4 text-center shadow-xs transition-all ${
                category.synced 
                  ? 'border-teal-500/40 dark:border-teal-500/30' 
                  : 'border-slate-200/80 dark:border-white/10'
              }`}
            >
              <div className={`w-11 h-11 mx-auto mb-2.5 rounded-xl flex items-center justify-center ${
                category.synced 
                  ? 'bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40' 
                  : 'bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5'
              }`}>
                {category.icon}
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-0.5">{category.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{category.source}</p>
              {category.synced && (
                <div className="mt-2 inline-flex items-center justify-center gap-1 text-teal-600 dark:text-teal-400 text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <Smartphone className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Need Setup Help?</h2>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
          Having trouble connecting your device? Make sure your wearable is paired with your phone 
          and the companion app is running. Most devices sync continuously through Apple Health, Google Fit, 
          or their native companion services.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <span className="px-3.5 py-1.5 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 rounded-full text-xs sm:text-sm font-medium border border-slate-200/80 dark:border-white/10">
            Troubleshooting Guide
          </span>
          <span className="px-3.5 py-1.5 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 rounded-full text-xs sm:text-sm font-medium border border-slate-200/80 dark:border-white/10">
            Supported Firmware Specs
          </span>
        </div>
      </div>
    </div>
  );
};

