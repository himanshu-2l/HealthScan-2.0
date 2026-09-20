/**
 * Pain Tracker Component
 * Comprehensive period pain and endometriosis risk tracker
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  savePainEntry,
  getPainEntries,
  deletePainEntry,
  analyzeEndometriosisRisk,
  generatePainReport,
  getCurrentCyclePhase,
} from '@/services/hormonalHealthService';
import {
  PainEntry,
  EndometriosisFlag,
  CyclePhaseName,
} from '@/types/hormonal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Plus,
  Trash2,
  FileText,
  Copy,
  CheckCircle,
  X,
  Clock,
  MapPin,
  Pill,
  Activity,
  AlertCircle,
  Thermometer,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// Pain location options
const PAIN_LOCATIONS = [
  { id: 'lower-abdomen', label: 'Lower abdomen' },
  { id: 'lower-back', label: 'Lower back' },
  { id: 'legs', label: 'Legs' },
  { id: 'pelvic', label: 'Pelvic area' },
];

// Radiation options
const RADIATION_OPTIONS = [
  { id: 'legs', label: 'Radiates to legs' },
  { id: 'back', label: 'Radiates to back' },
];

// Get color for pain level
const getPainLevelColor = (level: number): string => {
  if (level <= 3) return '#10b981'; // green
  if (level <= 6) return '#f59e0b'; // yellow
  if (level <= 8) return '#f97316'; // orange
  return '#ef4444'; // red
};

const getPainLevelLabel = (level: number): string => {
  if (level <= 3) return 'Mild';
  if (level <= 6) return 'Moderate';
  if (level <= 8) return 'Severe';
  return 'Extreme';
};

// Get severity color for endometriosis flags
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'high':
    case 'critical':
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'moderate':
      return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    default:
      return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
  }
};

// Get phase color for chart
const getPhaseColor = (phase: CyclePhaseName): string => {
  switch (phase) {
    case 'menstrual':
      return '#ef4444';
    case 'follicular':
      return '#3b82f6';
    case 'ovulation':
      return '#10b981';
    case 'luteal':
      return '#f59e0b';
    default:
      return '#9ca3af';
  }
};

const PainTracker: React.FC = () => {
  const [painEntries, setPainEntries] = useState<PainEntry[]>([]);
  const [endometriosisFlags, setEndometriosisFlags] = useState<EndometriosisFlag[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<CyclePhaseName>('menstrual');

  // Form state
  const [painLevel, setPainLevel] = useState<number>(5);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRadiations, setSelectedRadiations] = useState<string[]>([]);
  const [duringBowelMovement, setDuringBowelMovement] = useState(false);
  const [duringUrination, setDuringUrination] = useState(false);
  const [preventsActivities, setPreventsActivities] = useState(false);
  const [durationHours, setDurationHours] = useState<string>('');
  const [medicationTaken, setMedicationTaken] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const entries = getPainEntries();
    setPainEntries(entries);
    
    const flags = analyzeEndometriosisRisk();
    setEndometriosisFlags(flags);
    
    const phaseInfo = getCurrentCyclePhase();
    setCurrentPhase(phaseInfo.phase);
  };

  // Calculate consecutive painkiller days
  const consecutivePainkillerDays = useMemo(() => {
    if (painEntries.length === 0) return 0;
    
    const sorted = [...painEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let consecutiveDays = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const entry of sorted) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor(
        (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (dayDiff === consecutiveDays && entry.medicationTaken.length > 0) {
        consecutiveDays++;
        currentDate = entryDate;
      } else if (dayDiff > consecutiveDays) {
        break;
      }
    }
    
    return consecutiveDays;
  }, [painEntries]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const sortedEntries = [...painEntries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 entries
    
    return sortedEntries.map(entry => ({
      date: format(parseISO(entry.date), 'MMM dd'),
      painLevel: entry.painLevel,
      phase: entry.cycleDay <= 5 ? 'menstrual' : 
             entry.cycleDay <= 13 ? 'follicular' :
             entry.cycleDay <= 16 ? 'ovulation' : 'luteal',
      fullDate: entry.date,
    }));
  }, [painEntries]);

  const handleLocationToggle = (locationId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleRadiationToggle = (radiationId: string) => {
    setSelectedRadiations(prev =>
      prev.includes(radiationId)
        ? prev.filter(id => id !== radiationId)
        : [...prev, radiationId]
    );
  };

  const handleSaveEntry = () => {
    const phaseInfo = getCurrentCyclePhase();
    
    const newEntry = savePainEntry({
      date: new Date().toISOString().split('T')[0],
      cycleDay: phaseInfo.cycleDay,
      painLevel,
      locations: selectedLocations.map(id => 
        PAIN_LOCATIONS.find(l => l.id === id)?.label || id
      ),
      radiatesTo: selectedRadiations.map(id => 
        RADIATION_OPTIONS.find(r => r.id === id)?.label || id
      ),
      duringBowelMovement,
      duringUrination,
      durationHours: parseFloat(durationHours) || 0,
      medicationTaken: medicationTaken.split(',').map(m => m.trim()).filter(Boolean),
      preventsActivities,
      notes,
    });

    // Reset form
    setPainLevel(5);
    setSelectedLocations([]);
    setSelectedRadiations([]);
    setDuringBowelMovement(false);
    setDuringUrination(false);
    setPreventsActivities(false);
    setDurationHours('');
    setMedicationTaken('');
    setNotes('');
    setShowAddDialog(false);
    
    // Reload data
    loadData();
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this pain entry?')) {
      if (deletePainEntry(id)) {
        loadData();
      }
    }
  };

  const handleGenerateReport = () => {
    const report = generatePainReport();
    setReportContent(report);
    setReportDialogOpen(true);
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canSave = selectedLocations.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">Pain Tracker</h2>
            <p className="text-xs sm:text-sm text-white/50">Period pain & endometriosis risk monitoring</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2.5 h-auto text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Pain
          </Button>
          <Button
            onClick={handleGenerateReport}
            variant="outline"
            className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl px-4 py-2.5 h-auto text-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Report
          </Button>
        </div>
      </div>

      {/* Painkiller Alert */}
      {consecutivePainkillerDays > 3 && (
        <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-red-500/20">
              <Pill className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-red-300 font-semibold mb-1">Pain Medication Alert</h3>
              <p className="text-red-200/70 text-sm">
                You've taken pain medication for {consecutivePainkillerDays} consecutive days this cycle. 
                This pattern may indicate a condition requiring medical attention. Consider consulting 
                a healthcare provider.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Endometriosis Red Flags */}
      {endometriosisFlags.length > 0 && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Endometriosis Risk Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {endometriosisFlags.map((flag, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${getSeverityColor(flag.severity)}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{flag.flagType}</span>
                  </div>
                  <Badge variant="outline" className={`capitalize ${getSeverityColor(flag.severity)}`}>
                    {flag.severity}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm opacity-90">{flag.recommendation}</p>
                  {flag.evidencePoints.length > 0 && (
                    <div className="text-xs opacity-70">
                      <span className="font-medium">Evidence:</span>
                      <ul className="mt-1 space-y-1">
                        {flag.evidencePoints.slice(0, 3).map((point, pidx) => (
                          <li key={pidx}>
                            {format(parseISO(point.date), 'MMM dd')}: {point.detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pain Trend Chart */}
      {chartData.length > 0 && (
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Pain Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 10, 15, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`Pain Level: ${value}/10`, '']}
                  />
                  <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="3 3" label="Severe" />
                  <Line
                    type="monotone"
                    dataKey="painLevel"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ fill: '#f43f5e', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                Menstrual
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Follicular
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                Ovulation
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                Luteal
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pain History */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Pain History</CardTitle>
        </CardHeader>
        <CardContent>
          {painEntries.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No pain entries yet</p>
              <p className="text-white/30 text-sm mt-1">Log your first pain entry to start tracking</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {painEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/[0.06] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="text-2xl font-bold"
                          style={{ color: getPainLevelColor(entry.painLevel) }}
                        >
                          {entry.painLevel}
                        </span>
                        <span className="text-xs text-white/50">/ 10</span>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getPainLevelColor(entry.painLevel),
                            color: getPainLevelColor(entry.painLevel),
                          }}
                        >
                          {getPainLevelLabel(entry.painLevel)}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/60 mb-2">
                        {format(parseISO(entry.date), 'MMM dd, yyyy')} • Cycle Day {entry.cycleDay}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {entry.locations.map((loc, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-white/[0.06] rounded-full text-white/70"
                          >
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {loc}
                          </span>
                        ))}
                      </div>
                      {entry.medicationTaken.length > 0 && (
                        <p className="text-xs text-white/50">
                          <Pill className="w-3 h-3 inline mr-1" />
                          {entry.medicationTaken.join(', ')}
                        </p>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-white/40 mt-2">{entry.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Pain Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              Log Pain Entry
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            {/* Pain Level Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Pain Level</Label>
                <div className="flex items-center gap-2">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: getPainLevelColor(painLevel) }}
                  >
                    {painLevel}
                  </span>
                  <span className="text-sm text-white/50">/ 10</span>
                </div>
              </div>
              <Slider
                value={[painLevel]}
                onValueChange={(value) => setPainLevel(value[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Severe</span>
                <span>Extreme</span>
              </div>
            </div>

            {/* Pain Locations */}
            <div className="space-y-3">
              <Label className="text-white flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Pain Location
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {PAIN_LOCATIONS.map((location) => (
                  <label
                    key={location.id}
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedLocations.includes(location.id)
                        ? 'bg-rose-500/20 border-rose-500/30'
                        : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    <Checkbox
                      checked={selectedLocations.includes(location.id)}
                      onCheckedChange={() => handleLocationToggle(location.id)}
                    />
                    <span className="text-sm text-white/80">{location.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Radiation Checkboxes */}
            <div className="space-y-3">
              <Label className="text-white">Additional Symptoms</Label>
              <div className="space-y-2">
                {RADIATION_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRadiations.includes(option.id)
                        ? 'bg-rose-500/20 border-rose-500/30'
                        : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    <Checkbox
                      checked={selectedRadiations.includes(option.id)}
                      onCheckedChange={() => handleRadiationToggle(option.id)}
                    />
                    <span className="text-sm text-white/80">{option.label}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 p-3 rounded-xl border bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] cursor-pointer">
                  <Checkbox
                    checked={duringBowelMovement}
                    onCheckedChange={(checked) => setDuringBowelMovement(checked as boolean)}
                  />
                  <span className="text-sm text-white/80">Pain during bowel movements</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl border bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] cursor-pointer">
                  <Checkbox
                    checked={duringUrination}
                    onCheckedChange={(checked) => setDuringUrination(checked as boolean)}
                  />
                  <span className="text-sm text-white/80">Pain during urination</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl border bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] cursor-pointer">
                  <Checkbox
                    checked={preventsActivities}
                    onCheckedChange={(checked) => setPreventsActivities(checked as boolean)}
                  />
                  <span className="text-sm text-white/80">Prevents daily activities</span>
                </label>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration (hours)
              </Label>
              <Input
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="e.g., 4"
                min="0"
                step="0.5"
                className="bg-white/[0.04] border-white/[0.08] rounded-xl text-white placeholder:text-white/30 h-12"
              />
            </div>

            {/* Medication */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Medication Taken
              </Label>
              <Input
                type="text"
                value={medicationTaken}
                onChange={(e) => setMedicationTaken(e.target.value)}
                placeholder="e.g., Ibuprofen, Paracetamol (comma-separated)"
                className="bg-white/[0.04] border-white/[0.08] rounded-xl text-white placeholder:text-white/30 h-12"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-white">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details..."
                className="bg-white/[0.04] border-white/[0.08] rounded-xl text-white placeholder:text-white/30 min-h-[100px]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSaveEntry}
                disabled={!canSave}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12 disabled:opacity-50"
              >
                Save Entry
              </Button>
              <Button
                onClick={() => setShowAddDialog(false)}
                variant="outline"
                className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl h-12 px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-400" />
              Pelvic Pain Assessment Report
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="bg-black/30 rounded-xl p-4 max-h-[50vh] overflow-y-auto">
              <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono">
                {reportContent}
              </pre>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCopyReport}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <Button
                onClick={() => setReportDialogOpen(false)}
                variant="outline"
                className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PainTracker;
