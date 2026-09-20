/**
 * Insulin on Board (IOB) Calculator Component
 * Tracks active insulin, displays decay curves, and manages insulin doses
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VoiceInputButton } from '../ui/VoiceInputButton';
import type { VoicePattern, ParsedResult } from '../../hooks/useVoiceInput';
import {
  Syringe,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
  Trash2,
  Settings,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  calculateIOB,
  getIOBTimeline,
  logInsulinDose,
  getInsulinDoses,
  getActiveDoses,
  deleteInsulinDose,
  getPatientSettings,
  savePatientSettings,
  calculateSingleDoseIOB,
} from '@/services/iobService';
import type { InsulinDose, PatientSettings, IOBPoint } from '@/types/health';

const RAPID_INSULINS = ['Novorapid', 'Humalog', 'Apidra'];
const LONG_INSULINS = ['Lantus', 'Levemir', 'Tresiba'];

export const IOBCalculator: React.FC = () => {
  const [doses, setDoses] = useState<InsulinDose[]>([]);
  const [activeDoses, setActiveDoses] = useState<InsulinDose[]>([]);
  const [currentIOB, setCurrentIOB] = useState<number>(0);
  const [iobTimeline, setIobTimeline] = useState<IOBPoint[]>([]);
  const [settings, setSettings] = useState<PatientSettings>(getPatientSettings());
  
  // Form state
  const [units, setUnits] = useState<string>('');
  const [insulinType, setInsulinType] = useState<'rapid' | 'long'>('rapid');
  const [insulinName, setInsulinName] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Settings form state
  const [settingsForm, setSettingsForm] = useState<PatientSettings>(settings);

  // Voice pattern for insulin logging: "X units of [insulin name]"
  const insulinVoicePatterns: VoicePattern[] = useMemo(() => [
    {
      name: 'insulinDose',
      pattern: /(\d+(?:\.\d)?)\s*(?:units?|u)?\s*(?:of)?\s*(novorapid|humalog|apidra|lantus|levemir|tresiba)/i,
      extract: (m) => ({ 
        value: parseFloat(m[1]), 
        unit: 'units'
      })
    },
    {
      name: 'insulinDoseAlt',
      pattern: /(?:took|injected|gave)\s*(\d+(?:\.\d)?)\s*(?:units?|u)?\s*(?:of)?\s*(novorapid|humalog|apidra|lantus|levemir|tresiba)/i,
      extract: (m) => ({ 
        value: parseFloat(m[1]), 
        unit: 'units'
      })
    }
  ], []);

  // Load data and calculate IOB
  const refreshData = useCallback(() => {
    const allDoses = getInsulinDoses();
    const active = getActiveDoses();
    const iob = calculateIOB(allDoses);
    const timeline = getIOBTimeline(allDoses, 4);
    
    setDoses(allDoses);
    setActiveDoses(active);
    setCurrentIOB(iob);
    setIobTimeline(timeline);
  }, []);

  // Initial load and auto-refresh every 30 seconds
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Update insulin name when type changes
  useEffect(() => {
    if (insulinType === 'rapid') {
      setInsulinName(RAPID_INSULINS[0]);
    } else {
      setInsulinName(LONG_INSULINS[0]);
    }
  }, [insulinType]);

  // Get IOB color based on value
  const getIOBColor = (iob: number): string => {
    if (iob < 2) return 'text-emerald-400';
    if (iob <= 5) return 'text-amber-400';
    return 'text-red-400';
  };

  const getIOBBgColor = (iob: number): string => {
    if (iob < 2) return 'bg-emerald-500/20 border-emerald-500/30';
    if (iob <= 5) return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  // Handle voice input for insulin
  const handleVoiceResult = (result: ParsedResult) => {
    if (typeof result.value === 'number') {
      setUnits(String(result.value));
    }
    // Parse insulin name from transcript
    const transcript = result.rawTranscript.toLowerCase();
    const insulinMatch = transcript.match(/(novorapid|humalog|apidra|lantus|levemir|tresiba)/i);
    if (insulinMatch) {
      const name = insulinMatch[1].charAt(0).toUpperCase() + insulinMatch[1].slice(1).toLowerCase();
      if (RAPID_INSULINS.includes(name)) {
        setInsulinType('rapid');
        setInsulinName(name);
      } else if (LONG_INSULINS.includes(name)) {
        setInsulinType('long');
        setInsulinName(name);
      }
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const unitsNum = parseFloat(units);
    if (!unitsNum || unitsNum <= 0 || unitsNum > 50) {
      alert('Please enter valid units (0.5-50)');
      return;
    }
    if (!insulinName) {
      alert('Please select an insulin name');
      return;
    }

    try {
      logInsulinDose({
        units: unitsNum,
        type: insulinType,
        insulinName,
        timestamp: new Date().toISOString(),
      });
      
      setUnits('');
      setShowForm(false);
      refreshData();
    } catch (error) {
      console.error('Error logging insulin dose:', error);
      alert('Failed to log insulin dose');
    }
  };

  // Handle dose deletion
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this dose?')) {
      deleteInsulinDose(id);
      refreshData();
    }
  };

  // Handle settings save
  const handleSaveSettings = () => {
    savePatientSettings(settingsForm);
    setSettings(settingsForm);
    setShowSettings(false);
    refreshData();
  };

  // Calculate remaining IOB and time for a dose
  const getDoseStatus = (dose: InsulinDose) => {
    const remainingIOB = calculateSingleDoseIOB(dose, new Date(), settings);
    const doseTime = new Date(dose.timestamp).getTime();
    const durationMinutes = dose.type === 'rapid' 
      ? settings.rapidInsulinDuration * 60 
      : settings.longInsulinDuration * 60;
    const elapsedMinutes = (Date.now() - doseTime) / (1000 * 60);
    const remainingMinutes = Math.max(0, durationMinutes - elapsedMinutes);
    
    return {
      remainingIOB: Math.round(remainingIOB * 100) / 100,
      remainingMinutes: Math.round(remainingMinutes),
      percentAbsorbed: Math.min(100, Math.round((elapsedMinutes / durationMinutes) * 100)),
    };
  };

  // Format time remaining
  const formatTimeRemaining = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    return iobTimeline.map(point => ({
      time: format(parseISO(point.time), 'HH:mm'),
      iob: point.iob,
    }));
  }, [iobTimeline]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Syringe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">IOB Calculator</h2>
            <p className="text-xs text-white/50">Insulin on Board tracking</p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 h-auto text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Insulin
        </Button>
      </div>

      {/* Real-time IOB Display */}
      <Card className={`${getIOBBgColor(currentIOB)} backdrop-blur-sm border`}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-white/60 mb-1">Active Insulin (IOB)</p>
              <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                <span className={`text-5xl sm:text-6xl font-bold ${getIOBColor(currentIOB)}`}>
                  {currentIOB.toFixed(1)}
                </span>
                <span className="text-xl text-white/60">units</span>
              </div>
              <p className="text-sm text-white/50 mt-2">
                insulin still active in your body
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl">
              <Activity className="w-5 h-5 text-white/70" />
              <span className="text-sm text-white/70">
                Updates every 30s
              </span>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              {currentIOB < 2 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Low IOB - Safe to dose</span>
                </>
              ) : currentIOB <= 5 ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 font-medium">Moderate IOB - Consider current insulin</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">High IOB - Stacking risk!</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IOB Decay Chart */}
      {chartData.length > 0 && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              IOB Projection (Next 4 Hours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="iobGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="time"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    interval={3}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 10, 15, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} units`, 'IOB']}
                  />
                  <ReferenceLine y={2} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Safe (2u)', fill: '#10b981', fontSize: 10 }} />
                  <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'High (5u)', fill: '#ef4444', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="iob"
                    stroke="#3b82f6"
                    fill="url(#iobGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Insulin Logging Form */}
      {showForm && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-white">Log Insulin Dose</CardTitle>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white transition-colors"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Voice Input */}
              <div className="flex items-center justify-center gap-4 pb-4 border-b border-white/[0.06]">
                <span className="text-white/50 text-sm">Say your dose:</span>
                <VoiceInputButton
                  patterns={insulinVoicePatterns}
                  onParsedResult={handleVoiceResult}
                  onTranscript={(text) => {
                    // Fallback parsing
                    const match = text.match(/(\d+(?:\.\d)?)\s*(?:units?|u)?\s*(?:of)?\s*(novorapid|humalog|apidra|lantus|levemir|tresiba)/i);
                    if (match) {
                      setUnits(match[1]);
                      const name = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
                      if (RAPID_INSULINS.includes(name)) {
                        setInsulinType('rapid');
                      } else if (LONG_INSULINS.includes(name)) {
                        setInsulinType('long');
                      }
                      setInsulinName(name);
                    }
                  }}
                  placeholder="Say '3 units of Novorapid'"
                  size="md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Units Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Units</label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    placeholder="3.0"
                    className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-blue-500/50 h-11"
                  />
                </div>

                {/* Insulin Type Toggle */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Type</label>
                  <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setInsulinType('rapid')}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                        insulinType === 'rapid'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08]'
                      }`}
                    >
                      Rapid
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsulinType('long')}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                        insulinType === 'long'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08]'
                      }`}
                    >
                      Long-acting
                    </button>
                  </div>
                </div>
              </div>

              {/* Insulin Name Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Insulin Name</label>
                <Select value={insulinName} onValueChange={setInsulinName}>
                  <SelectTrigger className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-11">
                    <SelectValue placeholder="Select insulin" />
                  </SelectTrigger>
                  <SelectContent>
                    {(insulinType === 'rapid' ? RAPID_INSULINS : LONG_INSULINS).map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11"
              >
                <Syringe className="w-4 h-4 mr-2" />
                Log Dose
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Doses List */}
      {activeDoses.length > 0 && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Active Doses ({activeDoses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activeDoses.map((dose) => {
                const status = getDoseStatus(dose);
                return (
                  <div
                    key={dose.id}
                    className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/[0.06] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-white">{dose.insulinName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          dose.type === 'rapid' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {dose.type === 'rapid' ? 'Rapid' : 'Long-acting'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="text-white/60">
                          <span className="text-white font-medium">{dose.units} units</span> logged
                        </span>
                        <span className="text-white/40">
                          {format(parseISO(dose.timestamp), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-white/50">{status.percentAbsorbed}% absorbed</span>
                          <span className="text-blue-400 font-medium">{status.remainingIOB.toFixed(1)}u remaining</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                            style={{ width: `${status.percentAbsorbed}%` }}
                          />
                        </div>
                        <p className="text-xs text-white/40 mt-1">
                          {status.remainingMinutes > 0 
                            ? `${formatTimeRemaining(status.remainingMinutes)} until fully absorbed`
                            : 'Almost fully absorbed'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(dose.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors ml-3 flex-shrink-0"
                      title="Delete dose"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Settings Section */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06]">
        <CardHeader className="pb-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center justify-between w-full"
          >
            <CardTitle className="text-base font-medium text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-white/60" />
              Patient Settings
            </CardTitle>
            {showSettings ? (
              <ChevronUp className="w-5 h-5 text-white/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/60" />
            )}
          </button>
        </CardHeader>
        {showSettings && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-white/60">Insulin:Carb Ratio (1:X)</label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  max="50"
                  value={settingsForm.insulinToCarbRatio}
                  onChange={(e) => setSettingsForm({ ...settingsForm, insulinToCarbRatio: parseFloat(e.target.value) || 10 })}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60">Correction Factor (mg/dL per unit)</label>
                <Input
                  type="number"
                  step="1"
                  min="10"
                  max="100"
                  value={settingsForm.correctionFactor}
                  onChange={(e) => setSettingsForm({ ...settingsForm, correctionFactor: parseFloat(e.target.value) || 50 })}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60">Target Glucose (mg/dL)</label>
                <Input
                  type="number"
                  step="5"
                  min="70"
                  max="180"
                  value={settingsForm.targetGlucose}
                  onChange={(e) => setSettingsForm({ ...settingsForm, targetGlucose: parseFloat(e.target.value) || 120 })}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60">Rapid Insulin Duration (hours)</label>
                <Input
                  type="number"
                  step="0.5"
                  min="2"
                  max="8"
                  value={settingsForm.rapidInsulinDuration}
                  onChange={(e) => setSettingsForm({ ...settingsForm, rapidInsulinDuration: parseFloat(e.target.value) || 4 })}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-10 text-sm"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveSettings}
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10"
            >
              Save Settings
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Empty State */}
      {activeDoses.length === 0 && !showForm && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 text-center">
          <div className="p-4 bg-blue-500/10 rounded-2xl w-fit mx-auto mb-4">
            <Syringe className="w-10 h-10 text-blue-400/60" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No active insulin</h3>
          <p className="text-white/50 mb-4 text-sm">
            Log your insulin doses to track active insulin on board
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 h-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log First Dose
          </Button>
        </div>
      )}
    </div>
  );
};

export default IOBCalculator;
