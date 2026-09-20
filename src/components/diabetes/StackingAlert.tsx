/**
 * Stacking Alert Component
 * Warning modal/overlay that prevents dangerous insulin stacking
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertTriangle,
  Shield,
  ArrowDown,
  ArrowUp,
  Check,
  X,
  Clock,
  Droplet,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkStackingRisk } from '@/services/iobService';
import type { StackingWarning } from '@/types/health';

interface StackingAlertProps {
  newDose: number;
  currentGlucose: number;
  onProceed: (adjustedDose: number) => void;
  onCancel: () => void;
  isOpen: boolean;
}

type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical';

export const StackingAlert: React.FC<StackingAlertProps> = ({
  newDose,
  currentGlucose,
  onProceed,
  onCancel,
  isOpen,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [stackingData, setStackingData] = useState<StackingWarning | null>(null);
  const [isPulsing, setIsPulsing] = useState(true);

  // Calculate stacking risk when props change
  useEffect(() => {
    if (isOpen) {
      const data = checkStackingRisk(newDose, currentGlucose);
      setStackingData(data);
      setShowConfirmDialog(false);
      setIsPulsing(true);

      // Stop pulsing after 3 seconds
      const timer = setTimeout(() => setIsPulsing(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, newDose, currentGlucose]);

  // Determine severity level
  const severity = useMemo((): SeverityLevel => {
    if (!stackingData) return 'low';

    const { currentIOB, predictedGlucoseIn2Hours, safeMaxDose } = stackingData;

    if (predictedGlucoseIn2Hours < 70 || currentIOB > 5) return 'critical';
    if (predictedGlucoseIn2Hours < 90 || currentIOB > 3 || (safeMaxDose <= 0 && newDose > 0)) return 'high';
    if (predictedGlucoseIn2Hours < 110 || currentIOB > 1.5) return 'moderate';
    return 'low';
  }, [stackingData, newDose]);

  // Get predicted glucose if user takes full dose
  const predictedWithFullDose = useMemo(() => {
    if (!stackingData) return currentGlucose;
    // Rough estimate: each unit drops glucose by ~50mg/dL (correction factor)
    const additionalDrop = (newDose + stackingData.currentIOB) * 50;
    return Math.max(40, currentGlucose - additionalDrop);
  }, [stackingData, newDose, currentGlucose]);

  // Safe recommended dose
  const safeDose = useMemo(() => {
    if (!stackingData) return Math.max(0, newDose);
    return stackingData.safeMaxDose;
  }, [stackingData, newDose]);

  // Get severity colors
  const getSeverityColors = () => {
    switch (severity) {
      case 'critical':
        return {
          header: 'from-red-600 to-red-500',
          border: 'border-red-500/50',
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
      case 'high':
        return {
          header: 'from-orange-600 to-amber-500',
          border: 'border-orange-500/50',
          bg: 'bg-orange-500/10',
          text: 'text-orange-400',
          badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        };
      case 'moderate':
        return {
          header: 'from-amber-500 to-yellow-500',
          border: 'border-amber-500/50',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        };
      default:
        return {
          header: 'from-emerald-500 to-green-500',
          border: 'border-emerald-500/50',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        };
    }
  };

  // Get prediction color based on glucose value
  const getPredictionColor = (glucose: number) => {
    if (glucose < 70) return 'text-red-400';
    if (glucose < 90) return 'text-orange-400';
    if (glucose <= 180) return 'text-emerald-400';
    return 'text-amber-400';
  };

  // Format time since last dose
  const formatTimeSince = (minutes: number): string => {
    if (minutes === Infinity) return 'No recent doses';
    if (minutes < 60) return `${Math.round(minutes)} minutes ago`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
  };

  // Get IOB percentage for visual bar
  const getIOBPercentage = (): number => {
    if (!stackingData) return 0;
    // Assume max IOB of 10 units for visualization
    return Math.min(100, (stackingData.currentIOB / 10) * 100);
  };

  if (!isOpen || !stackingData) return null;

  const colors = getSeverityColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <Card className={cn(
        'relative w-full max-w-lg glass-card overflow-hidden z-10',
        'border-2 animate-in zoom-in-95 fade-in duration-200',
        colors.border
      )}>
        {/* Warning Header */}
        <div className={cn(
          'bg-gradient-to-r p-4 flex items-center gap-3',
          colors.header
        )}>
          <div className={cn(
            'p-2 bg-white/20 rounded-full',
            isPulsing && 'animate-pulse'
          )}>
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">
              Insulin Stacking Warning
            </h2>
            <p className="text-sm text-white/80">
              {severity === 'critical' && 'Critical: High risk of hypoglycemia'}
              {severity === 'high' && 'Warning: Significant stacking risk'}
              {severity === 'moderate' && 'Caution: Active insulin detected'}
              {severity === 'low' && 'Note: Moderate IOB present'}
            </p>
          </div>
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold border',
            colors.badge
          )}>
            {severity.toUpperCase()}
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Current Status Display */}
          <div className={cn('rounded-xl p-4 border', colors.bg, colors.border)}>
            <div className="flex items-center gap-2 mb-3">
              <Droplet className={cn('w-5 h-5', colors.text)} />
              <span className="font-medium text-white/90">Current Status</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Active Insulin */}
              <div>
                <div className="text-sm text-white/50 mb-1">Active Insulin (IOB)</div>
                <div className={cn('text-2xl font-bold', colors.text)}>
                  {stackingData.currentIOB.toFixed(1)} units
                </div>
              </div>

              {/* Time since last dose */}
              <div>
                <div className="text-sm text-white/50 mb-1">Last Dose</div>
                <div className="flex items-center gap-1.5 text-white/90">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatTimeSince(stackingData.timeSinceLastDose)}
                  </span>
                </div>
              </div>
            </div>

            {/* IOB Visual Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/50">IOB Level</span>
                <span className="text-white/50">Safe zone: &lt;2 units</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    stackingData.currentIOB < 2 ? 'bg-emerald-500' :
                    stackingData.currentIOB <= 5 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${getIOBPercentage()}%` }}
                />
              </div>
            </div>
          </div>

          {/* Prediction Section */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-white/90">Glucose Prediction</span>
            </div>

            <div className="bg-white/[0.03] rounded-lg p-3 text-center">
              <div className="text-sm text-white/50 mb-2">
                Without additional insulin, predicted in 2 hours:
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl text-white/60">{currentGlucose}</span>
                <ArrowDown className={cn(
                  'w-5 h-5',
                  stackingData.predictedGlucoseIn2Hours < currentGlucose
                    ? 'text-blue-400' : 'text-white/30'
                )} />
                <span className={cn(
                  'text-3xl font-bold',
                  getPredictionColor(stackingData.predictedGlucoseIn2Hours)
                )}>
                  {stackingData.predictedGlucoseIn2Hours}
                </span>
                <span className="text-white/50">mg/dL</span>
              </div>
              <div className={cn(
                'text-xs mt-2',
                getPredictionColor(stackingData.predictedGlucoseIn2Hours)
              )}>
                {stackingData.predictedGlucoseIn2Hours < 70 && '⚠️ Danger: Predicted hypoglycemia'}
                {stackingData.predictedGlucoseIn2Hours >= 70 && stackingData.predictedGlucoseIn2Hours < 90 && '⚡ Caution: Low range'}
                {stackingData.predictedGlucoseIn2Hours >= 90 && stackingData.predictedGlucoseIn2Hours <= 180 && '✓ In target range'}
                {stackingData.predictedGlucoseIn2Hours > 180 && '↑ Above target'}
              </div>
            </div>
          </div>

          {/* Dose Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Requested Dose */}
            <div className={cn(
              'rounded-xl p-4 border-2 text-center',
              newDose > safeDose && safeDose >= 0
                ? 'border-red-500/50 bg-red-500/10'
                : 'border-white/10 bg-white/[0.02]'
            )}>
              <div className="text-xs text-white/50 mb-1">Requested Dose</div>
              <div className={cn(
                'text-3xl font-bold',
                newDose > safeDose && safeDose >= 0 ? 'text-red-400' : 'text-white'
              )}>
                {newDose.toFixed(1)}
              </div>
              <div className="text-sm text-white/50">units</div>
              {newDose > safeDose && safeDose >= 0 && (
                <div className="mt-2 flex items-center justify-center gap-1 text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-xs">Dangerous</span>
                </div>
              )}
            </div>

            {/* Safe Dose */}
            <div className="border-2 border-emerald-500/50 bg-emerald-500/10 rounded-xl p-4 text-center">
              <div className="text-xs text-white/50 mb-1">Safe Recommended</div>
              <div className="text-3xl font-bold text-emerald-400">
                {safeDose.toFixed(1)}
              </div>
              <div className="text-sm text-white/50">units</div>
              {safeDose > 0 && (
                <div className="mt-2 flex items-center justify-center gap-1 text-emerald-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-xs">Safe</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning text if dose is dangerous */}
          {newDose > safeDose && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300/90">
                Taking <strong>{newDose.toFixed(1)} units</strong> could cause your blood sugar
                to drop to <strong>{predictedWithFullDose} mg/dL</strong> which is
                {predictedWithFullDose < 70 ? ' dangerously low!' : ' below your target range.'}
              </p>
            </div>
          )}

          {/* Warning message from service */}
          {stackingData.warningMessage && (
            <p className="text-sm text-white/60 italic text-center">
              "{stackingData.warningMessage}"
            </p>
          )}

          {/* Action Buttons */}
          {!showConfirmDialog ? (
            <div className="space-y-3">
              {/* Primary: Take Safe Dose */}
              <Button
                onClick={() => onProceed(safeDose)}
                className={cn(
                  'w-full h-14 text-lg font-medium',
                  'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
              >
                <Check className="w-5 h-5 mr-2" />
                Take Safe Dose ({safeDose.toFixed(1)} units)
              </Button>

              {/* Secondary: Take Requested Dose Anyway */}
              {newDose > safeDose && safeDose >= 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(true)}
                  className={cn(
                    'w-full h-12',
                    'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300'
                  )}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Take Requested Dose Anyway ({newDose.toFixed(1)} units)
                </Button>
              )}

              {/* Cancel */}
              <Button
                variant="ghost"
                onClick={onCancel}
                className="w-full h-11 text-white/60 hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          ) : (
            /* Confirmation Dialog */
            <div className="space-y-4">
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 text-center">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Are you sure?</h3>
                <p className="text-sm text-red-300/90">
                  This may cause your blood sugar to drop to{' '}
                  <strong className="text-red-400">{predictedWithFullDose} mg/dL</strong>
                  {predictedWithFullDose < 70 && (
                    <span className="block mt-1">
                      This is dangerously low and may require immediate treatment.
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => onProceed(newDose)}
                  className={cn(
                    'h-12',
                    'bg-red-600 hover:bg-red-700 text-white'
                  )}
                >
                  I understand the risk
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="h-12 border-white/20 text-white hover:bg-white/5"
                >
                  Go back
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StackingAlert;
