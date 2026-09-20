import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Battery,
  Wifi,
  Bluetooth,
  Download,
  AlertTriangle,
  Heart,
  Thermometer,
  Gauge,
  Power,
  WifiOff,
  BluetoothOff,
  CheckCircle,
  XCircle,
  FileText,
  BarChart3,
  TrendingUp,
  Clock
} from 'lucide-react';

// Types for sensor data
interface SensorData {
  timestamp: number;
  value: number;
}

interface DeviceStatus {
  isConnected: boolean;
  batteryLevel: number;
  powerConsumption: number;
  wifiStrength: number;
  bluetoothConnected: boolean;
  sensors: {
    ecg: boolean;
    temperature: boolean;
  };
}

interface AlertData {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
  sensor: string;
}

export const HardwareDataDisplay: React.FC = () => {
  // State for real-time data
  const [ecgData, setEcgData] = useState<SensorData[]>([]);
  const [tempData, setTempData] = useState<SensorData[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    isConnected: false,
    batteryLevel: 0,
    powerConsumption: 0,
    wifiStrength: 0,
    bluetoothConnected: false,
    sensors: {
      ecg: false,
      temperature: false
    }
  });
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSimulatingConnection, setIsSimulatingConnection] = useState(false);
  const [showConnectionSuccess, setShowConnectionSuccess] = useState(false);
  const [isWaitingForTemperature, setIsWaitingForTemperature] = useState(false);

  // Canvas refs for real-time charts
  const ecgCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const temperatureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tempIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate fake random temperature data
  const generateFakeTemperature = useCallback((): number => {
    const baseTemp = 36.5; // Base temperature in Celsius
    const variation = (Math.random() - 0.5) * 0.8; // Random variation between -0.4 and +0.4
    const timeVariation = Math.sin(Date.now() / 60000) * 0.3; // Slow sine wave for natural variation
    const temperatureCelsius = baseTemp + variation + timeVariation;
    // Ensure temperature stays within normal human range
    return Math.max(36.0, Math.min(37.5, temperatureCelsius));
  }, []);

  // Simulate real-time data generation - but only for connected sensors
  useEffect(() => {
    // Only generate data if device is connected
    if (!deviceStatus.isConnected) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();

      // Simulate Heart Rate Sensor AD8232 data (heart rate pattern)
      if (deviceStatus.sensors.ecg) {
        const ecgValue = Math.sin(now / 100) * 50 + Math.random() * 10 + 60;
        setEcgData(prev => [...prev.slice(-100), { timestamp: now, value: ecgValue }]);

        // Generate alerts for abnormal readings
        if (ecgValue > 120 && Math.random() < 0.1) {
          const newAlert: AlertData = {
            id: `alert-${now}`,
            type: 'warning',
            message: 'High heart rate detected',
            timestamp: now,
            sensor: 'Heart Rate Sensor AD8232'
          };
          setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
        }
      }

      // Temperature is handled separately with 30-second intervals
      // Don't generate temperature here anymore

      // Randomly update device status
      if (Math.random() < 0.1) {
        setDeviceStatus(prev => ({
          ...prev,
          batteryLevel: Math.max(0, prev.batteryLevel - 0.1),
          powerConsumption: 12 + Math.random() * 8,
          wifiStrength: 70 + Math.random() * 30
        }));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [deviceStatus.isConnected, deviceStatus.sensors]);

  // Temperature data generation with 30-second intervals
  useEffect(() => {
    if (deviceStatus.isConnected && deviceStatus.sensors.temperature && !isWaitingForTemperature) {
      // Generate initial temperature
      const generateTemp = () => {
        const tempValue = generateFakeTemperature();
        const now = Date.now();
        setTempData(prev => [...prev.slice(-100), { timestamp: now, value: tempValue }]);
      };

      // Generate immediately
      generateTemp();

      // Set up interval for every 30 seconds
      if (!tempIntervalRef.current) {
        tempIntervalRef.current = setInterval(() => {
          generateTemp();
        }, 30000); // 30 seconds
      }
    } else {
      // Clear interval when disconnected or waiting
      if (tempIntervalRef.current) {
        clearInterval(tempIntervalRef.current);
        tempIntervalRef.current = null;
      }
    }

    return () => {
      if (tempIntervalRef.current) {
        clearInterval(tempIntervalRef.current);
        tempIntervalRef.current = null;
      }
    };
  }, [deviceStatus.isConnected, deviceStatus.sensors.temperature, isWaitingForTemperature, generateFakeTemperature]);

  // Draw real-time charts
  useEffect(() => {
    drawChart(ecgCanvasRef.current, ecgData, '#8b5cf6', 'Heart Rate Sensor AD8232');
  }, [ecgData]);

  useEffect(() => {
    drawChart(tempCanvasRef.current, tempData, '#f59e0b', 'Temperature');
  }, [tempData]);

  const drawChart = (canvas: HTMLCanvasElement | null, data: SensorData[], color: string, label: string) => {
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw data line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.value - Math.min(...data.map(d => d.value))) /
        (Math.max(...data.map(d => d.value)) - Math.min(...data.map(d => d.value)))) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  const exportData = (format: 'json' | 'csv' | 'pdf') => {
    const data = {
      ecg: ecgData,
      temperature: tempData,
      timestamp: new Date().toISOString()
    };

    let content: string;
    let fileName: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        fileName = `healthscan-data-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        const csvHeader = 'Timestamp,Heart_Rate_Sensor_AD8232,Temperature\n';
        const csvRows = ecgData.map((_, index) => {
          return [
            ecgData[index]?.timestamp || '',
            ecgData[index]?.value || '',
            tempData[index]?.value || ''
          ].join(',');
        }).join('\n');
        content = csvHeader + csvRows;
        fileName = `healthscan-data-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      case 'pdf':
        // For PDF, we'll create a simple text representation
        content = `Health Scan Hardware Data Report\n\nGenerated: ${new Date().toISOString()}\n\nHeart Rate Sensor AD8232 Data Points: ${ecgData.length}\nTemperature Data Points: ${tempData.length}`;
        fileName = `healthscan-report-${Date.now()}.txt`;
        mimeType = 'text/plain';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (isOnline: boolean) => isOnline ? 'text-green-400' : 'text-red-400';
  const getStatusIcon = (isOnline: boolean) => isOnline ? CheckCircle : XCircle;

  // Secret button handler - simulate sensor connection
  const handleSecretConnect = useCallback(() => {
    if (!deviceStatus.isConnected) {
      setIsSimulatingConnection(true);
      setShowConnectionSuccess(false);
      setIsWaitingForTemperature(false);

      // Clear any existing timeouts
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (temperatureTimeoutRef.current) {
        clearTimeout(temperatureTimeoutRef.current);
      }

      // After 4 seconds, show "Sensor successfully connected!" message
      connectionTimeoutRef.current = setTimeout(() => {
        setIsSimulatingConnection(false);
        setShowConnectionSuccess(true);

        // Update device status to connected
        setDeviceStatus(prev => ({
          ...prev,
          isConnected: true,
          batteryLevel: 85,
          powerConsumption: 15,
          wifiStrength: 85,
          bluetoothConnected: true,
          sensors: {
            ecg: true,
            temperature: false // Will be enabled after 30 seconds
          }
        }));

        setIsWaitingForTemperature(true);

        // After another 30 seconds (total 34 seconds), enable temperature sensor
        temperatureTimeoutRef.current = setTimeout(() => {
          setIsWaitingForTemperature(false);
          setShowConnectionSuccess(false);

          // Enable temperature sensor
          setDeviceStatus(prev => ({
            ...prev,
            sensors: {
              ...prev.sensors,
              temperature: true
            }
          }));
        }, 30000); // Wait 30 seconds after connection success
      }, 4000); // Wait 4 seconds before showing success message
    }
  }, [deviceStatus.isConnected]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (temperatureTimeoutRef.current) {
        clearTimeout(temperatureTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-8 pb-12">
      {/* Header */}
      <div className="text-center space-y-4 glass-panel p-6 border-l-4 border-indigo-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity className="w-32 h-32 text-indigo-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-indigo-400" />
            <h1 className="text-4xl font-bold text-foreground">Hardware Integration</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Real-time neurological sensor data monitoring from Health Scan waistband device
          </p>
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/20 mt-2">Live Data Streaming</Badge>
        </div>
      </div>

      {/* Development Status Banner */}
      <Alert className="border-yellow-500/50 bg-yellow-500/10 border-l-4 text-yellow-200">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <AlertDescription className="text-yellow-100/80">
          <div className="space-y-2">
            <p className="font-semibold text-yellow-100">Hardware Integration Interface</p>
            <p className="text-sm">
              This hardware integration interface displays real-time sensor data from the Health Scan waistband device.
              Connect your device to view live sensor readings.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Device Connection Status */}
      <Card className={`glass-panel border-l-4 ${deviceStatus.isConnected ? 'border-green-500' : 'border-red-500'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${deviceStatus.isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {deviceStatus.isConnected ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            {deviceStatus.isConnected ? 'Device Connected' : 'Device Not Connected'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {deviceStatus.isConnected
              ? 'Health Scan waistband device is connected and streaming sensor data.'
              : 'Health Scan waistband device is not currently connected. Please connect your device to view real-time sensor data.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {deviceStatus.isConnected ? (
              <>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 cursor-pointer border-green-500/50 text-green-400 bg-green-500/10 hover:bg-green-500/20"
                  disabled
                >
                  <CheckCircle className="w-4 h-4" />
                  Connected
                </Button>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/20">Online</Badge>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 cursor-pointer border-indigo-500/50 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
                  onClick={handleSecretConnect}
                  title="Click to connect sensor"
                >
                  <Power className="w-4 h-4" />
                  Connect Device
                </Button>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/20">Offline</Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status Messages */}
      {(isSimulatingConnection || showConnectionSuccess || isWaitingForTemperature) && (
        <Alert className={`border-l-4 backdrop-blur-xl ${isSimulatingConnection ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200' :
          showConnectionSuccess ? 'border-green-500/50 bg-green-500/10 text-green-200' :
            'border-blue-500/50 bg-blue-500/10 text-blue-200'
          }`}>
          <Activity className={`h-5 w-5 ${isSimulatingConnection ? 'text-yellow-500 animate-spin' :
            showConnectionSuccess ? 'text-green-500' :
              'text-blue-500 animate-spin'
            }`} />
          <AlertDescription>
            {isSimulatingConnection ? (
              <span className="font-medium">Connecting to sensor...</span>
            ) : showConnectionSuccess ? (
              <div>
                <div className="font-semibold mb-1">Sensor successfully connected!</div>
                <div className="text-sm opacity-90">Initializing temperature reading...</div>
              </div>
            ) : (
              <div>
                <div className="font-semibold mb-1">Sensor successfully connected!</div>
                <div className="text-sm opacity-90">Waiting for temperature data...</div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Recording Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-panel p-4 border-l-4 border-purple-500">
        <div>
          <h2 className="text-xl font-bold text-foreground">Data Recording</h2>
          <p className="text-muted-foreground">Start recording sensor data for analysis</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsRecording(!isRecording)}
            className={`flex items-center gap-2 ${isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            disabled={!deviceStatus.isConnected}
          >
            {isRecording ? <XCircle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </div>
      </div>

      {/* Device Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Battery Status */}
        <Card className={`glass-panel border-l-4 shadow-lg ${deviceStatus.isConnected ? 'border-blue-500' : 'border-gray-600'} ${deviceStatus.isConnected ? '' : 'opacity-60'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <Battery className={`w-4 h-4 ${deviceStatus.isConnected ? 'text-blue-400' : 'text-gray-500'}`} />
              Battery Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-3xl font-bold ${deviceStatus.isConnected ? 'text-blue-400' : 'text-muted-foreground'}`}>
                  {deviceStatus.isConnected ? `${Math.round(deviceStatus.batteryLevel)}%` : '--'}
                </span>
                <Badge className={deviceStatus.isConnected ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-gray-500/20 text-gray-400 border-gray-500/20'}>
                  {deviceStatus.isConnected ? 'Active' : 'No Device'}
                </Badge>
              </div>
              <Progress value={deviceStatus.isConnected ? deviceStatus.batteryLevel : 0} className="h-2 bg-white/10" />
              <p className={`text-xs font-medium ${deviceStatus.isConnected ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                Power: {deviceStatus.isConnected ? `${deviceStatus.powerConsumption.toFixed(1)} W` : '-- W'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card className={`glass-panel border-l-4 shadow-lg ${deviceStatus.isConnected ? 'border-green-500' : 'border-gray-600'} ${deviceStatus.isConnected ? '' : 'opacity-60'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground flex items-center gap-2 text-sm font-semibold">
              {deviceStatus.isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-500" />
              )}
              Connectivity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                <span className={`text-sm font-medium ${deviceStatus.isConnected ? 'text-foreground' : 'text-muted-foreground'}`}>WiFi</span>
                <div className="flex items-center gap-2">
                  {deviceStatus.isConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-400">{Math.round(deviceStatus.wifiStrength)}%</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-muted-foreground">--</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                <span className={`text-sm font-medium ${deviceStatus.isConnected ? 'text-foreground' : 'text-muted-foreground'}`}>Bluetooth</span>
                <div className="flex items-center gap-2">
                  {deviceStatus.bluetoothConnected ? (
                    <>
                      <Bluetooth className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <BluetoothOff className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-muted-foreground">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sensor Status */}
        <Card className={`glass-panel border-l-4 shadow-lg ${deviceStatus.isConnected ? 'border-purple-500' : 'border-gray-600'} ${deviceStatus.isConnected ? '' : 'opacity-60'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <Gauge className={`w-4 h-4 ${deviceStatus.isConnected ? 'text-purple-400' : 'text-gray-500'}`} />
              Sensors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(deviceStatus.sensors).map(([sensor, status]) => {
                const StatusIcon = getStatusIcon(status);
                return (
                  <div key={sensor} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                    <StatusIcon className={`w-4 h-4 ${status ? 'text-green-400' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium capitalize ${status ? 'text-foreground' : 'text-muted-foreground'}`}>{sensor}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card className={`glass-panel border-l-4 border-orange-500 shadow-lg ${!deviceStatus.isConnected ? 'opacity-60' : ''}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <Download className="w-4 h-4 text-orange-400" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportData('json')}
                className="w-full text-xs border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground bg-transparent"
                disabled={!deviceStatus.isConnected}
              >
                <FileText className="w-3 h-3 mr-1" />
                JSON
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportData('csv')}
                className="w-full text-xs border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground bg-transparent"
                disabled={!deviceStatus.isConnected}
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Active Alerts
          </h3>
          {alerts.map((alert) => (
            <Alert key={alert.id} className={`border-l-4 backdrop-blur-xl ${alert.type === 'error' ? 'border-red-500/50 bg-red-500/10 text-red-200' :
              alert.type === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200' :
                'border-blue-500/50 bg-blue-500/10 text-blue-200'
              }`}>
              <AlertTriangle className={`h-4 w-4 ${alert.type === 'error' ? 'text-red-500' :
                alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="opacity-100">{alert.sensor}:</strong> {alert.message}
                  </div>
                  <span className="text-xs opacity-70 font-medium">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Real-time Charts */}
      <Tabs defaultValue="ecg" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
          <TabsTrigger value="ecg" className="flex items-center gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white text-muted-foreground hover:text-foreground">
            <Heart className="w-4 h-4" />
            Heart Rate Sensor AD8232
          </TabsTrigger>
          <TabsTrigger value="temp" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white text-muted-foreground hover:text-foreground">
            <Thermometer className="w-4 h-4" />
            Temperature
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ecg">
          <Card className="glass-panel border-l-4 border-red-500">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Heart Rate Sensor AD8232 - Single-lead heart rate monitoring
              </CardTitle>
              <CardDescription className="text-muted-foreground">Real-time heart electrical activity monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="text-sm font-medium text-foreground">
                    Current BPM: <span className="text-red-400 font-bold text-lg">
                      {ecgData.length > 0 ? Math.round(ecgData[ecgData.length - 1].value) : '--'}
                    </span>
                  </div>
                  <Badge className={ecgData.length > 0 && ecgData[ecgData.length - 1].value > 100 ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}>
                    {ecgData.length > 0 && ecgData[ecgData.length - 1].value > 100 ? 'Elevated' : 'Normal'}
                  </Badge>
                </div>
                <div className="bg-black/40 rounded-lg border border-white/10 p-4">
                  <canvas
                    ref={ecgCanvasRef}
                    width={800}
                    height={200}
                    className="w-full h-48 bg-transparent rounded border border-white/5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temp">
          <Card className="glass-panel border-l-4 border-orange-500">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-orange-500" />
                Temperature Monitoring
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Real-time body temperature tracking via IoT sensor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="text-sm font-medium text-foreground">
                    Current Temp: <span className="text-orange-400 font-bold text-lg">
                      {tempData.length > 0 ? `${tempData[tempData.length - 1].value.toFixed(1)}°C` :
                        isWaitingForTemperature ? 'Initializing...' : '--'}
                    </span>
                  </div>
                  <Badge className={tempData.length > 0 ? "bg-green-500/20 text-green-300" : isWaitingForTemperature ? "bg-yellow-500/20 text-yellow-300" : "bg-gray-500/20 text-gray-300"}>
                    {tempData.length > 0 ? 'Normal' : isWaitingForTemperature ? 'Waiting...' : 'No Data'}
                  </Badge>
                </div>
                <div className="bg-black/40 rounded-lg border border-white/10 p-4">
                  <canvas
                    ref={tempCanvasRef}
                    width={800}
                    height={200}
                    className="w-full h-48 bg-transparent rounded border border-white/5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Historical Data Section */}
      <Card className="glass-panel border-l-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Historical Data & Trends
          </CardTitle>
          <CardDescription className="text-muted-foreground">Data analysis and historical comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-5 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-sm font-medium text-muted-foreground mb-1">Session Duration</div>
              <div className="text-2xl font-bold text-blue-400">
                --:--
              </div>
            </div>
            <div className="text-center p-5 bg-green-500/10 rounded-lg border border-green-500/20">
              <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-sm font-medium text-muted-foreground mb-1">Data Points</div>
              <div className="text-2xl font-bold text-green-400">
                {ecgData.length + tempData.length}
              </div>
            </div>
            <div className="text-center p-5 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Activity className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <div className="text-sm font-medium text-muted-foreground mb-1">Data Rate</div>
              <div className="text-2xl font-bold text-purple-400">-- Hz</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HardwareDataDisplay;
