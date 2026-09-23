import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Heart,
  Footprints,
  Flame,
  Moon,
  TrendingUp,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Watch,
  BedDouble,
  Apple,
  Dumbbell,
  Scale,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '@/utils/authUtils';

// Using relative URLs - Vite proxy handles routing to backend

interface FitnessData {
  heartRate: Array<{ timestamp: Date; bpm: number; source: string }>;
  steps: Array<{ date: Date; steps: number; source: string }>;
  calories: Array<{ date: Date; calories: number; source: string }>;
  sleep: Array<{ date: Date; durationHours: string; sleepType: string; source: string }>;
  summary: {
    avgHeartRate: number;
    totalSteps: number;
    avgSteps: number;
    totalCalories: number;
    avgCalories: number;
    avgSleepHours: string;
    period: string;
  };
}

interface GoogleFitIntegrationProps {
  onViewAllWearables?: () => void;
}

export const GoogleFitIntegration: React.FC<GoogleFitIntegrationProps> = ({ onViewAllWearables }) => {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fitnessData, setFitnessData] = useState<FitnessData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [heartRateData, setHeartRateData] = useState<Array<{ timestamp: Date; bpm: number; source: string }> | null>(null);
  const [latestHeartRate, setLatestHeartRate] = useState<number | null>(null);

  const syncToConnectedWearables = (isConnected: boolean) => {
    const STORAGE_KEY = 'healthscan_connected_wearables';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: Array<{ deviceId: string; connectedAt: string; lastSync: string }> = stored ? JSON.parse(stored) : [];
      if (isConnected) {
        const now = new Date().toISOString();
        const existingIdx = list.findIndex(w => w.deviceId === 'google-fit');
        if (existingIdx >= 0) {
          list[existingIdx].lastSync = now;
        } else {
          list.push({ deviceId: 'google-fit', connectedAt: now, lastSync: now });
        }
      } else {
        list = list.filter(w => w.deviceId !== 'google-fit');
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('wearable-status-change'));
    } catch (err) {
      console.error('Failed to sync wearable status to storage:', err);
    }
  };

  const generateRealisticFitnessData = (baseBpm = 74): FitnessData => {
    const now = Date.now();
    const heartRate = Array.from({ length: 15 }, (_, i) => ({
      timestamp: new Date(now - i * 4 * 60000),
      bpm: Math.round(baseBpm + Math.sin(i * 0.7) * 5 + (Math.random() * 4 - 2)),
      source: 'raw:com.google.heart_rate.bpm:WearOS'
    }));

    return {
      heartRate,
      steps: [
        { date: new Date(), steps: 8432, source: 'WearOS Sensor' }
      ],
      calories: [
        { date: new Date(), calories: 542, source: 'WearOS Sensor' }
      ],
      sleep: [
        { date: new Date(), durationHours: '7.5', sleepType: 'Deep/REM Restorative', source: 'WearOS Sleep Algorithm' }
      ],
      summary: {
        avgHeartRate: baseBpm,
        totalSteps: 8432,
        avgSteps: 8432,
        totalCalories: 542,
        avgCalories: 542,
        avgSleepHours: '7.5',
        period: '24 hours'
      }
    };
  };

  useEffect(() => {
    // Check for Google Fit connection success from redirect
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('google_fit') === 'connected') {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        checkConnectionStatus();
      }, 500);
    } else {
      checkConnectionStatus();
    }
  }, []);

  // Live heart rate micro-fluctuations in demo mode for realistic continuous telemetry
  useEffect(() => {
    if (!connected || !isDemoMode) return;
    const interval = setInterval(() => {
      setLatestHeartRate(prev => {
        const base = 74;
        const delta = Math.round((Math.random() * 6 - 3));
        const newBpm = Math.min(92, Math.max(65, (prev || base) + delta));
        setHeartRateData(prevData => {
          if (!prevData) return prevData;
          const newEntry = {
            timestamp: new Date(),
            bpm: newBpm,
            source: 'raw:com.google.heart_rate.bpm:WearOS'
          };
          return [newEntry, ...prevData.slice(0, 14)];
        });
        return newBpm;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [connected, isDemoMode]);

  const checkConnectionStatus = async () => {
    // Check if demo/simulated mode was previously connected
    const isDemo = localStorage.getItem('healthscan_google_fit_demo') === 'true';
    if (isDemo) {
      setIsDemoMode(true);
      setConnected(true);
      const mock = generateRealisticFitnessData();
      setFitnessData(mock);
      setHeartRateData(mock.heartRate);
      setLatestHeartRate(mock.heartRate[0].bpm);
      syncToConnectedWearables(true);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/google-fit/status', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        setConnected(false);
        return;
      }

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : { connected: false };
      } catch (parseError) {
        setError('Could not read Google Fit connection status. Please try reconnecting.');
        setConnected(false);
        return;
      }

      const isConnected = Boolean(data.connected);
      setConnected(isConnected);

      if (isConnected) {
        syncToConnectedWearables(true);
        fetchFitnessData();
        fetchHeartRateData();
      }
    } catch (err) {
      console.warn('Google Fit status check unavailable:', err);
      setConnected(false);
    }
  };

  const handleConnectSimulated = () => {
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    setTimeout(() => {
      const mock = generateRealisticFitnessData(74);
      setFitnessData(mock);
      setHeartRateData(mock.heartRate);
      setLatestHeartRate(mock.heartRate[0].bpm);
      setConnected(true);
      setIsDemoMode(true);
      localStorage.setItem('healthscan_google_fit_demo', 'true');
      localStorage.setItem('healthscan_google_fit_connected', 'true');
      syncToConnectedWearables(true);
      setLoading(false);
    }, 400);
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch('/api/google-fit/auth', {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('Google Fit auth failed with status:', response.status);
        setNotConfigured(true);
        setError('Google Cloud OAuth credentials are not set on server. You can use Instant Smartwatch Sync below to test full telemetry without GCP keys.');
        return;
      }

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.warn('Failed to parse Google Fit auth response:', parseError);
        setNotConfigured(true);
        setError('Google Cloud OAuth credentials are not set on server. You can use Instant Smartwatch Sync below to test full telemetry without GCP keys.');
        return;
      }

      if (data.configured === false || data.error) {
        setNotConfigured(true);
        setError(data.message || 'Google OAuth credentials not configured. Use Instant Smartwatch Sync to test.');
        return;
      }

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setNotConfigured(true);
        setError('Failed to obtain Google OAuth URL. You can use Instant Smartwatch Sync below.');
      }
    } catch (err) {
      console.warn('Google Fit connection unavailable:', err);
      setNotConfigured(true);
      setError('Google Cloud OAuth API endpoint is unavailable. You can use Instant Smartwatch Sync below to preview live telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      try {
        await fetch('/api/google-fit/disconnect', {
          method: 'POST',
          headers,
          credentials: 'include',
        });
      } catch (fetchErr) {
        console.warn('Disconnect API call failed, continuing with local cleanup:', fetchErr);
      }

      localStorage.removeItem('healthscan_google_fit_demo');
      localStorage.removeItem('healthscan_google_fit_connected');
      syncToConnectedWearables(false);

      setConnected(false);
      setIsDemoMode(false);
      setFitnessData(null);
      setHeartRateData(null);
      setLatestHeartRate(null);
      setError(null);
      setNotConfigured(false);
    } catch (err) {
      console.warn('Failed to disconnect Google Fit:', err);
      setConnected(false);
      setIsDemoMode(false);
      setFitnessData(null);
      setHeartRateData(null);
      setLatestHeartRate(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchFitnessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch('/api/google-fit/data', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      // Handle non-OK responses gracefully
      if (!response.ok) {
        console.warn('Google Fit data fetch failed with status:', response.status);
        if (response.status === 401) {
          setConnected(false);
        }
        return;
      }

      // Try to parse JSON, handle empty or invalid responses
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        console.warn('Failed to parse Google Fit data response:', parseError);
        return;
      }

      if (data && !data.error) {
        setFitnessData(data);
      }
    } catch (err) {
      console.warn('Failed to fetch fitness data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeartRateData = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/google-fit/data/heart-rate', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      // Handle non-OK responses gracefully
      if (!response.ok) {
        console.warn('Heart rate data fetch failed with status:', response.status);
        return;
      }

      // Try to parse JSON, handle empty or invalid responses
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        console.warn('Failed to parse heart rate data response:', parseError);
        return;
      }

      // API returns array of { timestamp, bpm, source }
      if (Array.isArray(data) && data.length > 0) {
        // Sort by timestamp (most recent first)
        const sortedData = data.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setHeartRateData(sortedData);
        setLatestHeartRate(Math.round(sortedData[0].bpm));
      }
    } catch (err) {
      console.warn('Failed to fetch heart rate data:', err);
    }
  };

  return (
    <Card className="glass-panel border-0">
      <CardHeader className="border-b border-white/5 bg-blue-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Watch className="h-6 w-6 text-blue-500" />
            <div>
              <CardTitle className="text-foreground">Connect Smartwatch</CardTitle>
              <CardDescription className="text-muted-foreground">
                Connect your Noise watch via Google Fit to track health metrics
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={connected ? 'default' : 'secondary'}
            className={
              connected
                ? isDemoMode
                  ? 'bg-teal-600 text-white border-0'
                  : 'bg-green-600 text-white border-0'
                : 'bg-secondary text-secondary-foreground'
            }
          >
            {connected ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                {isDemoMode ? 'Simulated Sync Active' : 'Connected to Google Fit'}
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                Not Connected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Connection Flow Diagram */}
        <div className="flex items-center justify-center gap-3 text-sm py-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Watch className="h-5 w-5 text-blue-500" />
            <span className="text-foreground font-medium">Noise / Wear OS</span>
          </div>
          <span className="text-muted-foreground font-bold text-lg">→</span>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            <span className="text-foreground font-medium">Companion App</span>
          </div>
          <span className="text-muted-foreground font-bold text-lg">→</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <span className="text-foreground font-medium">Google Fit</span>
          </div>
          <span className="text-muted-foreground font-bold text-lg">→</span>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="text-foreground font-medium">HealthScan</span>
          </div>
        </div>

        <p className="text-sm text-center text-muted-foreground font-medium">
          {connected
            ? 'Continuous biometric stream is actively synchronizing with HealthScan.'
            : 'Connect your wearable via Google Fit or launch Instant Smartwatch Simulation'}
        </p>

        {/* Connection Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {!connected ? (
            <>
              <Button
                onClick={handleConnect}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 border-0 shadow-lg shadow-blue-900/20 w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-4 w-4" />
                    Connect Google Fit (OAuth)
                  </>
                )}
              </Button>
              <Button
                onClick={handleConnectSimulated}
                disabled={loading}
                variant="outline"
                className="border-teal-500/40 text-teal-600 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 w-full sm:w-auto"
              >
                <Sparkles className="mr-2 h-4 w-4 text-teal-500" />
                Instant Demo / Smartwatch Sync
              </Button>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={() => {
                  if (isDemoMode) {
                    const mock = generateRealisticFitnessData();
                    setFitnessData(mock);
                    setHeartRateData(mock.heartRate);
                    setLatestHeartRate(mock.heartRate[0].bpm);
                  } else {
                    fetchFitnessData();
                    fetchHeartRateData();
                  }
                }}
                disabled={loading}
                variant="outline"
                className="border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh Telemetry
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={loading}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>

        {/* Error / Fallback Notice */}
        {error && (
          <Alert variant={notConfigured ? 'default' : 'destructive'} className={notConfigured ? 'bg-amber-950/30 border-amber-500/30 text-amber-200' : 'bg-red-900/20 border-red-900/50 text-red-200'}>
            <XCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="space-y-2 text-sm">
              <div>
                <strong className="text-amber-300 font-semibold">Integration Notice:</strong> {error}
              </div>
              {notConfigured && !connected && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={handleConnectSimulated}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs border-0 font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Activate Instant Simulated Smartwatch Sync
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Fitness Data Display */}
        {connected && fitnessData && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-lg font-semibold text-foreground">What we'll sync:</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Heart Rate Card */}
              <Card className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Heart className="h-8 w-8 text-red-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {fitnessData.summary.avgHeartRate}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">avg BPM</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-foreground font-medium">Heart Rate</p>
                </CardContent>
              </Card>

              {/* Steps Card */}
              <Card className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Footprints className="h-8 w-8 text-green-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {fitnessData.summary.totalSteps.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">total steps</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-foreground font-medium">Steps</p>
                </CardContent>
              </Card>

              {/* Calories Card */}
              <Card className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Flame className="h-8 w-8 text-orange-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {fitnessData.summary.totalCalories.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">kcal</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-foreground font-medium">Calories</p>
                </CardContent>
              </Card>

              {/* Sleep Card */}
              <Card className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Moon className="h-8 w-8 text-purple-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {fitnessData.summary.avgSleepHours}h
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">avg per night</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-foreground font-medium">Sleep</p>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-center text-muted-foreground font-medium">
              Data from last {fitnessData.summary.period}
            </p>

            {/* Detailed Heart Rate Data */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" aria-hidden="true" />
                  Heart Rate Data from Smartwatch
                </h4>
                <Button
                  onClick={fetchHeartRateData}
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 min-h-[44px]"
                  aria-label="Refresh heart rate data"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Refresh HR
                </Button>
              </div>
              {heartRateData && heartRateData.length > 0 ? (
                <>
                  {latestHeartRate && (
                    <div className="mb-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground font-medium mb-1">Latest Reading</div>
                          <div className="text-3xl font-bold text-red-500">
                            {latestHeartRate} <span className="text-lg text-foreground">BPM</span>
                          </div>
                        </div>
                        <Heart className="h-12 w-12 text-red-500/50" />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {heartRateData.slice(0, 12).map((reading, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-foreground">
                              {Math.round(reading.bpm)} BPM
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(reading.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <Heart className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Source: {reading.source.split(':').pop() || 'Unknown'}
                        </div>
                      </div>
                    ))}
                  </div>
                  {heartRateData.length > 12 && (
                    <p className="text-xs text-center text-muted-foreground font-medium mt-2">
                      Showing latest 12 readings of {heartRateData.length} total
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="font-medium text-foreground">No heart rate data available</p>
                  <p className="text-xs mt-1 text-muted-foreground">Make sure your smartwatch is synced with Google Fit</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expanded Data Categories Section */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-lg font-semibold text-foreground mb-4">Expanded Data Categories</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Google Fit can sync additional health data from your connected devices:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
              <BedDouble className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-foreground">Sleep Analysis</p>
                <p className="text-xs text-muted-foreground">Stages & quality</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
              <Apple className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-foreground">Nutrition</p>
                <p className="text-xs text-muted-foreground">Meals & hydration</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
              <Scale className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-foreground">Body Measurements</p>
                <p className="text-xs text-muted-foreground">Weight & composition</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
              <Dumbbell className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm font-medium text-foreground">Workout Sessions</p>
                <p className="text-xs text-muted-foreground">All activity types</p>
              </div>
            </div>
          </div>

          {/* View All Wearables Button */}
          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => {
                if (onViewAllWearables) {
                  onViewAllWearables();
                } else {
                  navigate('/smartwatch');
                }
              }}
              variant="outline"
              className="border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View All Wearables
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

