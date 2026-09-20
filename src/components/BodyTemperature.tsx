/**
 * Body Temperature Component
 * Displays real-time body temperature from IoT sensor
 * Supports Celsius and Fahrenheit conversion
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Thermometer, Activity, Wifi, WifiOff, Power } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TemperatureData {
  temperature: number;
  unit: string;
  timestamp: string;
  sensorId: string;
  status: string;
}

type TemperatureUnit = 'celsius' | 'fahrenheit';

export const BodyTemperature: React.FC = () => {
  const [temperatureData, setTemperatureData] = useState<TemperatureData | null>(null);
  const [unit, setUnit] = useState<TemperatureUnit>('celsius');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Start as false - no initial fetch
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isSimulatingConnection, setIsSimulatingConnection] = useState(false);
  const [showConnectionSuccess, setShowConnectionSuccess] = useState(false);
  const [isWaitingForTemperature, setIsWaitingForTemperature] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const temperatureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert Celsius to Fahrenheit
  const celsiusToFahrenheit = (celsius: number): number => {
    return (celsius * 9 / 5) + 32;
  };

  // Get temperature in the selected unit
  const getDisplayTemperature = (): number => {
    if (!temperatureData) return 0;
    return unit === 'fahrenheit'
      ? celsiusToFahrenheit(temperatureData.temperature)
      : temperatureData.temperature;
  };

  // Get temperature status
  const getTemperatureStatus = (tempCelsius: number): { status: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    if (tempCelsius < 36.1) {
      return { status: 'Low', variant: 'secondary' };
    } else if (tempCelsius > 37.2) {
      return { status: 'Elevated', variant: 'destructive' };
    } else {
      return { status: 'Normal', variant: 'default' };
    }
  };

  // Generate fake random temperature data
  const generateFakeTemperature = useCallback((): number => {
    const baseTemp = 36.5; // Base temperature in Celsius
    const variation = (Math.random() - 0.5) * 0.8; // Random variation between -0.4 and +0.4
    const timeVariation = Math.sin(Date.now() / 60000) * 0.3; // Slow sine wave for natural variation
    const temperatureCelsius = baseTemp + variation + timeVariation;
    // Ensure temperature stays within normal human range
    return Math.max(36.0, Math.min(37.5, temperatureCelsius));
  }, []);

  // Secret button handler - simulate sensor connection
  const handleSecretConnect = useCallback(() => {
    console.log('Secret connect button clicked, isConnected:', isConnected);
    if (!isConnected) {
      console.log('Starting connection process...');
      setIsLoading(true);
      setIsSimulatingConnection(true);
      setShowConnectionSuccess(false);
      setIsWaitingForTemperature(false);
      setError(null);

      // Clear any existing timeouts
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (temperatureTimeoutRef.current) {
        clearTimeout(temperatureTimeoutRef.current);
      }

      // After 4 seconds, show "Sensor successfully connected!" message
      connectionTimeoutRef.current = setTimeout(() => {
        console.log('4 second timeout fired - showing connection success');
        setIsSimulatingConnection(false);
        setShowConnectionSuccess(true);
        setIsConnected(true); // Mark as connected but don't show temperature yet
        setIsWaitingForTemperature(true);

        console.log('Setting up 30 second timeout for temperature data...');
        // After another 30 seconds (total 34 seconds), generate and show fake random temperature data
        temperatureTimeoutRef.current = setTimeout(() => {
          console.log('Temperature timeout fired - generating fake data');

          // Generate fake random temperature data using the helper function FIRST
          const tempValue = generateFakeTemperature();
          const simulatedData: TemperatureData = {
            temperature: parseFloat(tempValue.toFixed(2)),
            unit: 'celsius',
            timestamp: new Date().toISOString(),
            sensorId: 'IOT-TEMP-001',
            status: 'active'
          };

          console.log('Generated temperature data:', simulatedData);

          setTemperatureData(simulatedData);
          setLastUpdate(new Date());

          setIsWaitingForTemperature(false);
          setShowConnectionSuccess(false);
          setIsLoading(false);

          console.log('Temperature data set, flags updated');


          if (!intervalRef.current) {
            console.log('Starting polling interval');
            intervalRef.current = setInterval(() => {

              const newTempValue = generateFakeTemperature();
              const newSimulatedData: TemperatureData = {
                temperature: parseFloat(newTempValue.toFixed(2)),
                unit: 'celsius',
                timestamp: new Date().toISOString(),
                sensorId: 'IOT-TEMP-001',
                status: 'active'
              };

              console.log('Polling update - new temperature:', newSimulatedData.temperature);
              setTemperatureData(newSimulatedData);
              setLastUpdate(new Date());
            }, 30000); // 30 seconds
          }
        }, 30000); // Wait 30 seconds after connection success
      }, 4000); // Wait 4 seconds before showing success message
    }
  }, [isConnected, generateFakeTemperature]);

  // Component starts disconnected - no initial fetch needed
  // Temperature data will only be generated when secret button is clicked

  // Set up polling every 30 seconds when connected and temperature data is available
  // This useEffect is mainly for cleanup - the actual polling is set up in handleSecretConnect
  useEffect(() => {
    if (!isConnected || !temperatureData || isWaitingForTemperature) {
      // Clear interval when disconnected or waiting
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Only clean up intervals here, NOT timeouts (they're managed in handleSecretConnect)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isConnected, temperatureData, isWaitingForTemperature]);

  // Cleanup timeouts only on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (temperatureTimeoutRef.current) {
        clearTimeout(temperatureTimeoutRef.current);
      }
    };
  }, []); // Empty deps - only cleanup on unmount

  const displayTemp = getDisplayTemperature();
  const tempStatus = temperatureData ? getTemperatureStatus(temperatureData.temperature) : { status: 'Unknown', variant: 'outline' as const };
  const unitSymbol = unit === 'celsius' ? '°C' : '°F';

  // Debug logging
  useEffect(() => {
    console.log('BodyTemperature render state:', {
      isConnected,
      isLoading,
      isSimulatingConnection,
      showConnectionSuccess,
      isWaitingForTemperature,
      hasTemperatureData: !!temperatureData,
      temperature: temperatureData?.temperature
    });
  }, [isConnected, isLoading, isSimulatingConnection, showConnectionSuccess, isWaitingForTemperature, temperatureData]);

  return (
    <Card className="glass-panel border-0 hover:border-white/20 transition-all duration-300">
      <CardHeader className="border-b border-white/5 bg-red-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-red-500" />
            <CardTitle className="text-foreground">
              Body Temperature
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {(isConnected || showConnectionSuccess || isWaitingForTemperature) ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white border-0">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                className="cursor-pointer hover:bg-red-700 transition-colors relative group border-0"
                onClick={handleSecretConnect}
                title="Click to connect sensor"
              >
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
                {/* Secret button indicator - invisible but clickable */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Power className="w-3 h-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </span>
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-muted-foreground">
          Real-time monitoring via IoT sensor
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {(isLoading || isSimulatingConnection || showConnectionSuccess || isWaitingForTemperature) && !temperatureData ? (
          <div className="flex flex-col items-center justify-center py-8">
            {isSimulatingConnection ? (
              <>
                <Activity className="w-8 h-8 animate-spin text-red-500" />
                <span className="ml-2 text-muted-foreground mt-2">
                  Connecting to sensor...
                </span>
              </>
            ) : showConnectionSuccess ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 animate-pulse">
                  <Wifi className="w-8 h-8 text-green-500" />
                </div>
                <div className="text-lg font-semibold text-green-500 animate-pulse mb-2">
                  Sensor successfully connected!
                </div>
                <div className="text-sm text-muted-foreground">
                  Initializing temperature reading...
                </div>
              </>
            ) : isWaitingForTemperature ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Wifi className="w-8 h-8 text-green-500" />
                </div>
                <div className="text-lg font-semibold text-green-500 mb-2">
                  Sensor successfully connected!
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin text-green-500" />
                  Waiting for temperature data...
                </div>
              </>
            ) : (
              <>
                <Activity className="w-8 h-8 animate-spin text-red-500" />
                <span className="ml-2 text-muted-foreground mt-2">
                  Connecting to sensor...
                </span>
              </>
            )}
          </div>
        ) : temperatureData ? (
          <div className="space-y-6">
            {/* Temperature Display */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Thermometer className="w-12 h-12 text-red-500" />
                <div>
                  <div className="text-5xl font-bold text-foreground drop-shadow-md">
                    {displayTemp.toFixed(1)}
                    <span className="text-3xl text-muted-foreground ml-1">{unitSymbol}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {temperatureData.temperature.toFixed(1)}°C
                    {unit === 'fahrenheit' && ` (${displayTemp.toFixed(1)}°F)`}
                  </div>
                </div>
              </div>
              <Badge variant={tempStatus.variant} className="mt-2">
                {tempStatus.status}
              </Badge>
            </div>

            {/* Unit Toggle */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant={unit === 'celsius' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUnit('celsius')}
                className={`${unit === 'celsius' ? 'bg-primary hover:bg-primary/90' : 'border-white/10 text-muted-foreground hover:bg-white/5'}`}
              >
                Celsius (°C)
              </Button>
              <Button
                variant={unit === 'fahrenheit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUnit('fahrenheit')}
                className={`${unit === 'fahrenheit' ? 'bg-primary hover:bg-primary/90' : 'border-white/10 text-muted-foreground hover:bg-white/5'}`}
              >
                Fahrenheit (°F)
              </Button>
            </div>

            {/* Sensor Info */}
            <div className="border-t border-white/5 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sensor ID:</span>
                <span className="font-medium text-foreground">{temperatureData.sensorId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="default" className="bg-green-600 text-white border-0">
                  {temperatureData.status}
                </Badge>
              </div>
              {lastUpdate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Update:</span>
                  <span className="font-medium text-foreground">
                    {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {/* Temperature Range Info */}
            <div className="bg-white/5 rounded-lg p-3 text-xs text-muted-foreground border border-white/5">
              <div className="font-semibold mb-1 text-foreground">Normal Range:</div>
              <div className="flex justify-between">
                <span>Celsius: 36.1°C - 37.2°C</span>
                <span>Fahrenheit: 97.0°F - 99.0°F</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="text-muted-foreground">
              No temperature data available
            </div>
            {/* Secret connect button - hidden but clickable area */}
            <div
              className="relative group cursor-pointer"
              onClick={handleSecretConnect}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                >
                  <Power className="w-4 h-4 mr-2" />
                  Connect Sensor
                </Button>
              </div>
              <div className="h-10 w-full"></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BodyTemperature;

