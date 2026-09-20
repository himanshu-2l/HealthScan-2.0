/**
 * AI Insulin + Medicine Reminder Component
 * Smart reminders with dose guidance
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pill,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Bell,
  Syringe,
  Tablets,
  Package,
  Calendar,
  Activity,
} from 'lucide-react';
import {
  saveMedication,
  getAllMedications,
  deleteMedication,
  getUpcomingReminders,
  markReminderTaken,
  getDoseGuidance,
  checkReminders,
  Medication,
  Reminder,
  DoseGuidance,
  getAdherenceStats,
  AdherenceStats,
} from '@/services/insulinReminderService';
import { format, parseISO } from 'date-fns';
import { getAllGlucoseReadings } from '@/services/glucoseService';

const medicationTypeConfig = {
  insulin: { icon: Syringe, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  oral: { icon: Tablets, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  other: { icon: Package, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
};

export const InsulinReminder: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddMedication, setShowAddMedication] = useState(false);

  // Add medication form
  const [medName, setMedName] = useState('');
  const [medType, setMedType] = useState<'insulin' | 'oral' | 'other'>('oral');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'twice-daily' | 'before-meals' | 'after-meals' | 'as-needed'>('daily');
  const [times, setTimes] = useState<string[]>(['08:00']);

  useEffect(() => {
    loadMedications();
    loadReminders();

    // Check reminders every minute
    const interval = setInterval(() => {
      loadReminders();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadMedications = () => {
    const meds = getAllMedications();
    setMedications(meds);
  };

  const loadReminders = () => {
    const glucoseReadings = getAllGlucoseReadings();
    const currentGlucose = glucoseReadings[0]?.fasting || glucoseReadings[0]?.postMeal;

    const upcoming = getUpcomingReminders(24);
    const checkedReminders = checkReminders(currentGlucose);
    setReminders(checkedReminders.length > 0 ? checkedReminders : upcoming);
  };

  const handleAddMedication = () => {
    if (!medName || !dosage || times.length === 0) {
      alert('Please fill all required fields');
      return;
    }

    const medication: Omit<Medication, 'id'> = {
      name: medName,
      type: medType,
      dosage,
      frequency,
      times,
    };

    saveMedication(medication);
    loadMedications();
    loadReminders();

    // Reset form
    setMedName('');
    setDosage('');
    setTimes(['08:00']);
    setShowAddMedication(false);
  };

  const handleTakeMedication = (reminderId: string) => {
    const glucoseReadings = getAllGlucoseReadings();
    const currentGlucose = glucoseReadings[0]?.fasting || glucoseReadings[0]?.postMeal;

    markReminderTaken(reminderId, currentGlucose);
    loadReminders();
  };

  const getDoseGuidanceForReminder = (reminder: Reminder): DoseGuidance | null => {
    if (!reminder.glucoseLevel) return null;

    return getDoseGuidance(reminder.medicationId, reminder.glucoseLevel);
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'danger':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const getAlertIconColor = (level: string) => {
    switch (level) {
      case 'danger':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Pill className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Medicine & Insulin Reminders</h2>
            <p className="text-sm text-white/50">Smart reminders with AI-powered dose guidance</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddMedication(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3 h-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {/* Add Medication Form */}
      {showAddMedication && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Add Medication</h3>
            <button
              onClick={() => setShowAddMedication(false)}
              className="p-2 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Medication Name *</label>
              <Input
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g., Metformin, Insulin"
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-purple-500/50 h-12"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Type *</label>
                <Select value={medType} onValueChange={(v: any) => setMedType(v)}>
                  <SelectTrigger className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insulin">Insulin</SelectItem>
                    <SelectItem value="oral">Oral Medication</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Dosage *</label>
                <Input
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g., 500mg, 10 units"
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-purple-500/50 h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Frequency *</label>
              <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                <SelectTrigger className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Once Daily</SelectItem>
                  <SelectItem value="twice-daily">Twice Daily</SelectItem>
                  <SelectItem value="before-meals">Before Meals</SelectItem>
                  <SelectItem value="after-meals">After Meals</SelectItem>
                  <SelectItem value="as-needed">As Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Times (HH:mm, comma-separated) *</label>
              <Input
                value={times.join(', ')}
                onChange={(e) => setTimes(e.target.value.split(',').map(t => t.trim()))}
                placeholder="08:00, 20:00"
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-purple-500/50 h-12"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAddMedication}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12"
              >
                Save Medication
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddMedication(false)}
                className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl h-12 px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      {reminders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Upcoming Reminders (Next 24 Hours)</h3>
          </div>
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const medication = medications.find(m => m.id === reminder.medicationId);
              const guidance = getDoseGuidanceForReminder(reminder);

              return (
                <div
                  key={reminder.id}
                  className={`rounded-2xl p-5 border ${getAlertColor(reminder.alertLevel || 'info')}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl bg-white/[0.06] ${getAlertIconColor(reminder.alertLevel || 'info')}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">{medication?.name}</h4>
                          <p className="text-sm text-white/50">
                            Scheduled: {format(parseISO(reminder.scheduledTime), 'HH:mm')}
                          </p>
                        </div>
                        <span className="text-lg font-medium text-white/80">{medication?.dosage}</span>
                      </div>
                      {guidance && (
                        <p className="text-sm font-medium text-white/80">{guidance.message}</p>
                      )}
                      {reminder.recommendation && (
                        <p className="text-sm text-white/50">{reminder.recommendation}</p>
                      )}
                      {guidance && guidance.suggestedDosage && (
                        <p className="text-sm text-white/60">
                          <span className="text-white/40">Suggested:</span> {guidance.suggestedDosage}
                        </p>
                      )}
                      <Button
                        onClick={() => handleTakeMedication(reminder.id)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg mt-2"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Taken
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Medications List */}
      {medications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Your Medications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((medication) => {
              const stats = getAdherenceStats(medication.id, 30);
              const TypeConfig = medicationTypeConfig[medication.type];
              const TypeIcon = TypeConfig.icon;

              return (
                <div
                  key={medication.id}
                  className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl border ${TypeConfig.bg}`}>
                        <TypeIcon className={`w-5 h-5 ${TypeConfig.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{medication.name}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${TypeConfig.bg} ${TypeConfig.color}`}>
                            {medication.type}
                          </span>
                        </div>
                        <p className="text-sm text-white/50 mb-2">
                          {medication.dosage} • {medication.frequency.replace('-', ' ')}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-white/40">
                          <Calendar className="w-4 h-4" />
                          Times: {medication.times.join(', ')}
                        </div>
                        {stats.totalReminders > 0 && (
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${stats.adherenceRate}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/50">
                              {stats.adherenceRate}% ({stats.taken}/{stats.totalReminders})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this medication?')) {
                          deleteMedication(medication.id);
                          loadMedications();
                          loadReminders();
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {medications.length === 0 && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-12 text-center">
          <div className="p-4 bg-purple-500/10 rounded-2xl w-fit mx-auto mb-6">
            <Pill className="w-12 h-12 text-purple-400/60" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No medications added yet</h3>
          <p className="text-white/50 mb-6 max-w-md mx-auto">
            Add your medications to get smart reminders with AI-powered dose guidance based on your glucose levels
          </p>
          <Button
            onClick={() => setShowAddMedication(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3 h-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Medication
          </Button>
        </div>
      )}
    </div>
  );
};

export default InsulinReminder;
