/**
 * Caregiver View Component
 * A simplified, read-only component designed for family members/caregivers
 * NO editing capabilities - read-only access to patient health data
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getAllGlucoseReadings,
  getGlucoseCategory,
  GlucoseReading,
  estimateHbA1c,
} from '@/services/glucoseService';
import {
  calculateIOB,
  getInsulinDoses,
} from '@/services/iobService';
import {
  getRecentAlerts,
  WarningAlert,
} from '@/services/earlyWarningService';
import {
  User,
  Activity,
  Droplet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Phone,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Home,
  RefreshCw,
} from 'lucide-react';

interface CaregiverViewProps {
  patientName?: string;
  patientId?: string;
}

// Helper to format time since last reading
const formatTimeSince = (timestamp: string): string => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

// Helper to format timestamp for display
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export function CaregiverView({ patientName, patientId }: CaregiverViewProps) {
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [iob, setIOB] = useState<number>(0);
  const [alerts, setAlerts] = useState<WarningAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load data
  const loadData = () => {
    setIsLoading(true);
    try {
      // Load glucose readings
      const readings = getAllGlucoseReadings();
      setGlucoseReadings(readings);

      // Load IOB
      const doses = getInsulinDoses();
      const currentIOB = calculateIOB(doses);
      setIOB(currentIOB);

      // Load alerts
      const recentAlerts = getRecentAlerts(7);
      setAlerts(recentAlerts);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading caregiver data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [patientId]);

  // Get latest glucose reading
  const latestReading = useMemo(() => {
    return glucoseReadings.length > 0 ? glucoseReadings[0] : null;
  }, [glucoseReadings]);

  // Get glucose trend (comparing last 2 readings)
  const glucoseTrend = useMemo(() => {
    if (glucoseReadings.length < 2) return 'stable';
    const current = glucoseReadings[0].fasting || glucoseReadings[0].postMeal;
    const previous = glucoseReadings[1].fasting || glucoseReadings[1].postMeal;
    if (!current || !previous) return 'stable';
    
    const diff = current - previous;
    if (diff > 10) return 'rising';
    if (diff < -10) return 'falling';
    return 'stable';
  }, [glucoseReadings]);

  // Calculate time in range (70-180 mg/dL) for last 7 days
  const timeInRange = useMemo(() => {
    if (glucoseReadings.length === 0) return 0;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentReadings = glucoseReadings.filter(
      r => new Date(r.timestamp) >= weekAgo
    );
    
    if (recentReadings.length === 0) return 0;
    
    let inRange = 0;
    let total = 0;
    
    recentReadings.forEach(r => {
      if (r.fasting) {
        total++;
        if (r.fasting >= 70 && r.fasting <= 180) inRange++;
      }
      if (r.postMeal) {
        total++;
        if (r.postMeal >= 70 && r.postMeal <= 180) inRange++;
      }
    });
    
    return total > 0 ? Math.round((inRange / total) * 100) : 0;
  }, [glucoseReadings]);

  // Calculate average glucose (7 days)
  const avgGlucose7Days = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentReadings = glucoseReadings.filter(
      r => new Date(r.timestamp) >= weekAgo
    );
    
    let total = 0;
    let count = 0;
    
    recentReadings.forEach(r => {
      if (r.fasting) {
        total += r.fasting;
        count++;
      }
      if (r.postMeal) {
        total += r.postMeal;
        count++;
      }
    });
    
    return count > 0 ? Math.round(total / count) : 0;
  }, [glucoseReadings]);

  // Get HbA1c estimate
  const hba1cEstimate = useMemo(() => {
    return estimateHbA1c();
  }, [glucoseReadings]);

  // Determine patient status
  const patientStatus = useMemo(() => {
    if (!latestReading) {
      return { status: 'unknown', color: 'gray', label: 'No Data' };
    }
    
    const latestValue = latestReading.fasting || latestReading.postMeal;
    if (!latestValue) {
      return { status: 'unknown', color: 'gray', label: 'No Data' };
    }
    
    // Check for critical alerts
    const hasCriticalAlert = alerts.some(a => a.severity === 'critical');
    if (hasCriticalAlert) {
      return { status: 'danger', color: 'red', label: 'Danger' };
    }
    
    // Check glucose levels
    if (latestValue < 70 || latestValue >= 250) {
      return { status: 'danger', color: 'red', label: 'Danger' };
    }
    
    if (latestValue < 80 || latestValue >= 200) {
      return { status: 'caution', color: 'yellow', label: 'Caution' };
    }
    
    return { status: 'safe', color: 'green', label: 'Safe' };
  }, [latestReading, alerts]);

  // Check if reading is stale (> 4 hours)
  const isReadingStale = useMemo(() => {
    if (!latestReading) return true;
    const now = new Date();
    const lastReadingTime = new Date(latestReading.timestamp);
    const diffHours = (now.getTime() - lastReadingTime.getTime()) / (1000 * 60 * 60);
    return diffHours > 4;
  }, [latestReading]);

  // Get glucose category for display
  const glucoseCategory = useMemo(() => {
    if (!latestReading) return null;
    return getGlucoseCategory(latestReading.fasting, latestReading.postMeal);
  }, [latestReading]);

  // Get primary emergency contact
  const primaryContact = useMemo(() => {
    try {
      const contactsData = localStorage.getItem('healthscan_emergency_contacts');
      if (!contactsData) return null;
      const contacts = JSON.parse(contactsData);
      return contacts.find((c: any) => c.isPrimary) || contacts[0] || null;
    } catch {
      return null;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Patient Status Header */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-full">
                <User className="w-8 h-8 text-teal-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {patientName || 'Patient'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/60 text-sm">Status:</span>
                  <Badge
                    className={`text-base px-4 py-1 ${
                      patientStatus.color === 'green'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : patientStatus.color === 'yellow'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : patientStatus.color === 'red'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}
                  >
                    {patientStatus.label}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Clock className="w-4 h-4" />
                <span>Last updated: {formatTimestamp(lastUpdated.toISOString())}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadData}
                className="mt-2 text-teal-400 hover:text-teal-300 hover:bg-white/5"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Glucose Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Droplet className="w-5 h-5 text-rose-400" />
            Current Glucose
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {latestReading ? (
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="text-5xl md:text-6xl font-bold text-white">
                  {latestReading.fasting || latestReading.postMeal}
                  <span className="text-2xl ml-2 text-white/60">mg/dL</span>
                </div>
                <div className="flex items-center gap-2 pb-2">
                  {glucoseTrend === 'rising' && (
                    <TrendingUp className="w-6 h-6 text-amber-400" />
                  )}
                  {glucoseTrend === 'falling' && (
                    <TrendingDown className="w-6 h-6 text-teal-400" />
                  )}
                  {glucoseTrend === 'stable' && (
                    <Minus className="w-6 h-6 text-white/40" />
                  )}
                  <span className="text-white/60 text-sm capitalize">
                    {glucoseTrend}
                  </span>
                </div>
              </div>

              {glucoseCategory && (
                <Badge
                  className={`text-base px-4 py-2 ${
                    glucoseCategory.color === 'green'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : glucoseCategory.color === 'orange'
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {glucoseCategory.category}
                </Badge>
              )}

              <div className="flex items-center gap-2 text-white/50 text-lg">
                <Clock className="w-5 h-5" />
                <span>Last reading: {formatTimeSince(latestReading.timestamp)}</span>
              </div>

              {isReadingStale && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  <p className="text-amber-200 text-lg">
                    No reading logged for over 4 hours. Consider checking glucose.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Droplet className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 text-xl">No glucose readings available</p>
              <p className="text-white/40 mt-2">Readings will appear here when logged</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Insulin Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Active Insulin (IOB)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="flex items-end gap-4">
            <div className="text-5xl md:text-6xl font-bold text-white">
              {iob.toFixed(1)}
              <span className="text-2xl ml-2 text-white/60">units</span>
            </div>
          </div>
          <p className="text-white/60 text-lg mt-4">
            {iob > 0
              ? `${iob.toFixed(1)} units still active`
              : 'No active insulin on board'}
          </p>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Alert History (Last 7 Days)
          </CardTitle>
          <CardDescription className="text-white/50 text-base">
            Recent alerts and their status
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500/30'
                      : alert.severity === 'high'
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle
                          className={`w-5 h-5 ${
                            alert.severity === 'critical'
                              ? 'text-red-400'
                              : alert.severity === 'high'
                              ? 'text-orange-400'
                              : 'text-yellow-400'
                          }`}
                        />
                        <span className="text-white font-semibold text-lg">
                          {alert.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <Badge
                          className={`text-sm ${
                            alert.severity === 'critical'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : alert.severity === 'high'
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                              : alert.severity === 'moderate'
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-white/80 text-base mb-2">{alert.message}</p>
                      <p className="text-white/50 text-sm">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                    {alert.requiresImmediateAction ? (
                      <XCircle className="w-6 h-6 text-red-400" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-green-400/40 mx-auto mb-4" />
              <p className="text-white/60 text-xl">No alerts in the last 7 days</p>
              <p className="text-white/40 mt-2">All clear!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-white">
            Quick Stats (7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-4xl font-bold text-white mb-2">
                {avgGlucose7Days}
                <span className="text-lg ml-1 text-white/60">mg/dL</span>
              </div>
              <p className="text-white/60 text-base">Average Glucose</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-4xl font-bold text-teal-400 mb-2">
                {timeInRange}%
              </div>
              <p className="text-white/60 text-base">Time in Range</p>
              <p className="text-white/40 text-sm mt-1">(70-180 mg/dL)</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-4xl font-bold text-white mb-2">
                {hba1cEstimate.value > 0 ? hba1cEstimate.value.toFixed(1) : '--'}
                <span className="text-lg ml-1 text-white/60">%</span>
              </div>
              <p className="text-white/60 text-base">Est. HbA1c</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact Button */}
      <Card className="glass-card bg-gradient-to-br from-rose-500/20 to-red-600/10 border-rose-500/30">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Emergency Contact
            </h3>
            {primaryContact ? (
              <a
                href={`tel:${primaryContact.phone}`}
                className="inline-flex items-center justify-center gap-3 w-full md:w-auto px-8 py-5 bg-rose-600 hover:bg-rose-500 text-white text-2xl font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-rose-600/30"
              >
                <Phone className="w-8 h-8" />
                Call {primaryContact.name}
              </a>
            ) : (
              <div className="space-y-4">
                <a
                  href="tel:112"
                  className="inline-flex items-center justify-center gap-3 w-full md:w-auto px-8 py-5 bg-rose-600 hover:bg-rose-500 text-white text-2xl font-bold rounded-2xl transition-all duration-300"
                >
                  <Phone className="w-8 h-8" />
                  Emergency: 112
                </a>
                <p className="text-white/50 text-sm">
                  Add emergency contacts in the main app for quick access
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CaregiverView;
