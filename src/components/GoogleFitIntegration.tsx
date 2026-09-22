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
} from 'lucide-react';
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
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fitnessData, setFitnessData] = useState<FitnessData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [heartRateData, setHeartRateData] = useState<Array<{ timestamp: Date; bpm: number; source: string }> | null>(null);
  const [latestHeartRate, setLatestHeartRate] = useState<number | null>(null);

  useEffect(() => {
    // Check for Google Fit connection success from redirect
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('google_fit') === 'connected') {
      // Clear the query parameter without exposing tokens in URL history
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh connection status and fetch data
      setTimeout(() => {
        checkConnectionStatus();
      }, 500);
    } else {
      checkConnectionStatus();
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/google-fit/status', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      // Handle non-OK responses gracefully
      if (!response.ok) {
        console.warn('Google Fit status check failed with status:', response.status);
        setConnected(false);
        return;
      }

      // Try to parse JSON, handle empty or invalid responses
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : { connected: false };
      } catch (parseError) {
        console.warn('Failed to parse Google Fit status response:', parseError);
        setError('Could not read Google Fit connection status. Please try reconnecting.');
        setConnected(false);
        return;
      }

      const isConnected = Boolean(data.connected);
      setConnected(isConnected);

      if (isConnected) {
        fetchFitnessData();
        fetchHeartRateData();
      }
    } catch (err) {
      console.warn('Google Fit status check unavailable:', err);
      setConnected(false);
    }
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

      // Handle non-OK responses gracefully
      if (!response.ok) {
        console.warn('Google Fit auth failed with status:', response.status);
        setNotConfigured(true);
        setError('Google Fit is not available. Please try again later.');
        return;
      }

      // Try to parse JSON, handle empty or invalid responses
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.warn('Failed to parse Google Fit auth response:', parseError);
        setNotConfigured(true);
        setError('Google Fit is not available. Please try again later.');
        return;
      }

      // Check if server indicates not configured
      if (data.configured === false || data.error) {
        setNotConfigured(true);
        setError(data.message || 'Google Fit is not configured on this server.');
        return;
      }

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError('Failed to get authentication URL');
      }
    } catch (err) {
      console.warn('Google Fit connection unavailable:', err);
      setNotConfigured(true);
      setError('Google Fit is not available. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      // Try to call disconnect endpoint, but don't fail if it errors
      try {
        await fetch('/api/google-fit/disconnect', {
          method: 'POST',
          headers,
          credentials: 'include',
        });
      } catch (fetchErr) {
        console.warn('Disconnect API call failed, continuing with local cleanup:', fetchErr);
      }

      // Clean up local state
      setConnected(false);
      setFitnessData(null);
      setHeartRateData(null);
      setLatestHeartRate(null);
      setError(null);
      setNotConfigured(false);
    } catch (err) {
      console.warn('Failed to disconnect Google Fit:', err);
      setConnected(false);
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
            className={connected ? 'bg-green-600 text-white border-0' : 'bg-secondary text-secondary-foreground'}
          >
            {connected ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Connected
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
            <span className="text-foreground font-medium">Noise Watch</span>
          </div>
          <span className="text-muted-foreground font-bold text-lg">→</span>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            <span className="text-foreground font-medium">NoiseFit</span>
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
          Your fitness data will be synced automatically
        </p>

        {/* Connection Button */}
        <div className="flex justify-center">
          {!connected ? (
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 border-0 shadow-lg shadow-blue-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Connect Google Fit
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  fetchFitnessData();
                  fetchHeartRateData();
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
                Refresh Data
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

        {/* Error Message */}
        {error && (
          <Alert variant={notConfigured ? 'default' : 'destructive'} className={notConfigured ? 'bg-yellow-900/20 border-yellow-900/50 text-yellow-200' : 'bg-red-900/20 border-red-900/50 text-red-200'}>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {notConfigured ? (
                <>
                  <strong>Google Fit Integration Not Available</strong>
                  <br />
                  {error}
                </>
              ) : (
                error
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
                  console.log('Navigate to Smartwatch Support page');
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

