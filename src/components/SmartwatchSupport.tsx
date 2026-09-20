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
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl">
            <Watch className="w-8 h-8 text-teal-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Smartwatch & Wearables
            </h1>
            <p className="text-white/60 mt-1">
              Connect your devices to sync health data
            </p>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-full px-4 py-2">
            <span className="text-teal-400 font-semibold">{connectedCount}</span>
            <span className="text-white/60 ml-1">connected</span>
          </div>
        </div>
      </div>

      {/* Data Sync Status Section */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-teal-400" />
          Data Sync Status
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
                className="text-white/[0.06]"
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
                className="text-teal-400 transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{Math.round(syncProgress)}%</span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Devices Connected</span>
              <span className="text-white font-medium">{connectedCount} / {SUPPORTED_DEVICES.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Last Sync</span>
              <span className="text-white font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/40" />
                {lastSyncTime ? formatTime(lastSyncTime) : 'Never'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Data Categories Active</span>
              <span className="text-white font-medium">
                {dataCategories.filter(c => c.synced).length} / {dataCategories.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Devices Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Supported Devices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{device.icon}</span>
                  <div>
                    <h3 className="text-white font-semibold">{device.name}</h3>
                    <p className="text-white/40 text-sm">{device.models}</p>
                  </div>
                </div>
                {device.connected ? (
                  <button
                    onClick={() => handleDisconnect(device.id)}
                    className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded-full text-sm font-medium border border-teal-500/30 hover:bg-teal-500/30 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(device.id)}
                    className="px-4 py-2 bg-white/[0.04] text-white/60 rounded-full text-sm font-medium border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Data Types Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {device.dataTypes.map((dataType) => (
                  <span
                    key={dataType}
                    className="px-3 py-1 bg-white/[0.04] text-white/60 rounded-full text-xs border border-white/[0.06]"
                  >
                    {dataType}
                  </span>
                ))}
              </div>

              {device.connected && device.lastSync && (
                <div className="text-sm text-white/40 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Last synced: {formatTime(device.lastSync)}
                </div>
              )}

              {/* Setup Instructions Accordion */}
              <button
                onClick={() => setExpandedDevice(expandedDevice === device.id ? null : device.id)}
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                {expandedDevice === device.id ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Setup Instructions
              </button>

              {expandedDevice === device.id && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <ol className="space-y-2">
                    {device.setupSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-white/60">
                        <span className="flex-shrink-0 w-6 h-6 bg-white/[0.06] rounded-full flex items-center justify-center text-white/40 text-xs">
                          {index + 1}
                        </span>
                        {step}
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
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Health Data Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {dataCategories.map((category) => (
            <div
              key={category.id}
              className={`bg-white/[0.04] backdrop-blur-sm border rounded-2xl p-4 text-center ${
                category.synced 
                  ? 'border-teal-500/30' 
                  : 'border-white/[0.06]'
              }`}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                category.synced 
                  ? 'bg-teal-500/10' 
                  : 'bg-white/[0.04]'
              }`}>
                {category.icon}
              </div>
              <h3 className="text-white font-medium text-sm mb-1">{category.name}</h3>
              <p className="text-white/40 text-xs">{category.source}</p>
              {category.synced && (
                <div className="mt-2 flex items-center justify-center gap-1 text-teal-400 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-6 h-6 text-white/40" />
          <h2 className="text-lg font-semibold text-white">Need Help?</h2>
        </div>
        <p className="text-white/60 text-sm mb-4">
          Having trouble connecting your device? Make sure your wearable is paired with your phone 
          and the companion app is up to date. Most devices sync data through Google Fit or their 
          native health apps.
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="px-4 py-2 bg-white/[0.04] text-white/60 rounded-full text-sm border border-white/[0.06]">
            Troubleshooting Guide
          </span>
          <span className="px-4 py-2 bg-white/[0.04] text-white/60 rounded-full text-sm border border-white/[0.06]">
            Contact Support
          </span>
        </div>
      </div>
    </div>
  );
};

