/**
 * Period Tracker Component
 * Comprehensive menstrual cycle tracking with calendar, predictions, and logging
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Droplets,
  Moon,
  Sun,
  Heart,
  Trash2,
  ClipboardList,
} from 'lucide-react';
import {
  getCycleData,
  addPeriodLog,
  deletePeriodLog,
  getPredictions,
  getCurrentCyclePhase as getPeriodCyclePhase,
  isPeriodDay,
  isFertileDay,
  isOvulationDay,
  getPeriodLogForDate,
  SYMPTOMS,
  MOODS,
  FLOW_INTENSITIES,
  PeriodLog,
  CycleData,
  CyclePrediction,
  CyclePhase,
} from '@/services/periodTrackerService';
import { saveDailyLog, getCurrentCyclePhase } from '@/services/hormonalHealthService';
import { DailyLog, MoodLevel, SeverityLevel, CyclePhaseName } from '@/types/hormonal';

export const PeriodTracker: React.FC = () => {
  const [cycleData, setCycleData] = useState<CycleData>({ logs: [], averageCycleLength: 28, averagePeriodLength: 5 });
  const [predictions, setPredictions] = useState<CyclePrediction | null>(null);
  const [currentPhase, setCurrentPhase] = useState<CyclePhase | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Daily Log Dialog state
  const [showDailyLogDialog, setShowDailyLogDialog] = useState(false);
  const [dailyLogDate, setDailyLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyLogMood, setDailyLogMood] = useState<MoodLevel>('neutral');
  const [dailyLogEnergy, setDailyLogEnergy] = useState(3);
  const [dailyLogPainLevel, setDailyLogPainLevel] = useState(0);
  const [dailyLogSkinCondition, setDailyLogSkinCondition] = useState<SeverityLevel>('none');
  const [dailyLogBloating, setDailyLogBloating] = useState<SeverityLevel>('none');
  const [dailyLogNotes, setDailyLogNotes] = useState('');
  
  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [flowIntensity, setFlowIntensity] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState('neutral');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = getCycleData();
    setCycleData(data);
    setPredictions(getPredictions());
    setCurrentPhase(getPeriodCyclePhase());
  };

  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    
    const phaseInfo = getCurrentCyclePhase();
    
    const newLog: Omit<DailyLog, 'id' | 'timestamp'> = {
      date: dailyLogDate,
      cycleDay: phaseInfo.cycleDay,
      phase: phaseInfo.phase,
      mood: dailyLogMood,
      energy: dailyLogEnergy,
      anxiety: 3,
      irritability: 3,
      concentration: 3,
      depressiveFeeling: 1,
      painLevel: dailyLogPainLevel,
      painLocations: [],
      skinCondition: dailyLogSkinCondition,
      bloating: dailyLogBloating,
      sleepQuality: 3,
      libido: 3,
      notes: dailyLogNotes,
    };
    
    saveDailyLog(newLog);
    
    // Reset form
    setDailyLogDate(new Date().toISOString().split('T')[0]);
    setDailyLogMood('neutral');
    setDailyLogEnergy(3);
    setDailyLogPainLevel(0);
    setDailyLogSkinCondition('none');
    setDailyLogBloating('none');
    setDailyLogNotes('');
    setShowDailyLogDialog(false);
  };

  const moodEmojis: Record<MoodLevel, string> = {
    great: '😄',
    good: '🙂',
    neutral: '😐',
    bad: '😔',
    terrible: '😢',
  };

  const severityLabels: Record<SeverityLevel, string> = {
    none: 'None',
    mild: 'Mild',
    moderate: 'Moderate',
    severe: 'Severe',
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert('End date must be after start date');
      return;
    }

    addPeriodLog({
      startDate,
      endDate,
      flowIntensity,
      symptoms: selectedSymptoms,
      mood: selectedMood,
      notes,
    });

    // Reset form
    setStartDate('');
    setEndDate('');
    setFlowIntensity('medium');
    setSelectedSymptoms([]);
    setSelectedMood('neutral');
    setNotes('');
    setShowForm(false);
    setSelectedDate(null);
    
    loadData();
  };

  const handleDeleteLog = (id: string) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      deletePeriodLog(id);
      loadData();
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date | null; isPeriod: boolean; isFertile: boolean; isOvulation: boolean; isToday: boolean }> = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, isPeriod: false, isFertile: false, isOvulation: false, isToday: false });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      
      days.push({
        date,
        isPeriod: isPeriodDay(date),
        isFertile: isFertileDay(date),
        isOvulation: isOvulationDay(date),
        isToday: date.getTime() === today.getTime(),
      });
    }

    return days;
  }, [currentMonth, cycleData]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const log = getPeriodLogForDate(date);
    
    if (log) {
      // View existing log
      setStartDate(log.startDate);
      setEndDate(log.endDate);
      setFlowIntensity(log.flowIntensity);
      setSelectedSymptoms(log.symptoms);
      setSelectedMood(log.mood);
      setNotes(log.notes);
    } else {
      // New log starting from selected date
      const dateStr = date.toISOString().split('T')[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
      setFlowIntensity('medium');
      setSelectedSymptoms([]);
      setSelectedMood('neutral');
      setNotes('');
    }
    setShowForm(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'menstrual': return 'Menstrual Phase';
      case 'follicular': return 'Follicular Phase';
      case 'ovulation': return 'Ovulation Phase';
      case 'luteal': return 'Luteal Phase';
      default: return phase;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'menstrual': return 'text-rose-400';
      case 'follicular': return 'text-amber-400';
      case 'ovulation': return 'text-teal-400';
      case 'luteal': return 'text-purple-400';
      default: return 'text-white';
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodObj = MOODS.find(m => m.value === mood);
    return moodObj?.emoji || '😐';
  };

  return (
    <div className="space-y-8">
      {/* Quick Daily Log Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowDailyLogDialog(true)}
          className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl h-11 px-5 shadow-lg shadow-rose-500/20"
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          Quick Daily Log
        </Button>
      </div>

      {/* Current Cycle Info */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            {currentPhase ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 sm:p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                    <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs sm:text-sm">Current Cycle</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                      Day {currentPhase.dayOfCycle}
                    </h2>
                  </div>
                </div>
                <p className={`text-base sm:text-lg ${getPhaseColor(currentPhase.phase)}`}>
                  {getPhaseLabel(currentPhase.phase)}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                </div>
                <div>
                  <p className="text-white/50 text-xs sm:text-sm">No data yet</p>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    Log your first period
                  </h2>
                </div>
              </div>
            )}
          </div>
          
          {predictions && (
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
              <span className="text-white/60 text-sm">Next period:</span>
              <span className="text-white font-medium text-sm sm:text-base">
                {formatDate(predictions.nextPeriodStart)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6">
          <p className="text-white/50 text-xs sm:text-sm mb-1 sm:mb-2">Avg Cycle Length</p>
          <p className="text-xl sm:text-2xl font-bold text-rose-400">
            {cycleData.averageCycleLength} <span className="text-sm sm:text-base font-normal text-white/40">days</span>
          </p>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6">
          <p className="text-white/50 text-xs sm:text-sm mb-1 sm:mb-2">Avg Period Length</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-400">
            {cycleData.averagePeriodLength} <span className="text-sm sm:text-base font-normal text-white/40">days</span>
          </p>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6">
          <p className="text-white/50 text-xs sm:text-sm mb-1 sm:mb-2">Next Period</p>
          <p className="text-base sm:text-lg font-semibold text-white">
            {predictions ? formatDate(predictions.nextPeriodStart) : '--'}
          </p>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6">
          <p className="text-white/50 text-xs sm:text-sm mb-1 sm:mb-2">Current Phase</p>
          <p className={`text-base sm:text-lg font-semibold ${currentPhase ? getPhaseColor(currentPhase.phase) : 'text-white/40'}`}>
            {currentPhase ? getPhaseLabel(currentPhase.phase).replace(' Phase', '') : '--'}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 sm:p-8">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 sm:p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 sm:p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-4 sm:mb-6 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-rose-500/30 border border-rose-500/50" />
            <span className="text-white/60">Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500/30 border border-amber-500/50" />
            <span className="text-white/60">Fertile Window</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-teal-500/30 border border-teal-500/50" />
            <span className="text-white/60">Ovulation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-white" />
            <span className="text-white/60">Today</span>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-white/40 text-xs sm:text-sm py-1 sm:py-2">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((dayInfo, index) => (
            <button
              key={index}
              disabled={!dayInfo.date}
              onClick={() => dayInfo.date && handleDayClick(dayInfo.date)}
              className={`
                aspect-square rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-medium
                transition-all duration-200 relative
                ${!dayInfo.date 
                  ? 'cursor-default' 
                  : 'hover:bg-white/[0.08] cursor-pointer'
                }
                ${dayInfo.isPeriod 
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' 
                  : dayInfo.isOvulation
                    ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300'
                    : dayInfo.isFertile
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                      : 'text-white/70'
                }
                ${dayInfo.isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0f]' : ''}
              `}
            >
              {dayInfo.date?.getDate()}
            </button>
          ))}
        </div>
      </div>

      {/* Log Entry Form */}
      {showForm && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Log Period</h3>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedDate(null);
              }}
              className="p-2 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddLog} className="space-y-6">
            {/* Date Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-12 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-12 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Flow Intensity */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white/80">Flow Intensity</label>
              <div className="flex flex-wrap gap-3">
                {FLOW_INTENSITIES.map(intensity => (
                  <button
                    key={intensity.value}
                    type="button"
                    onClick={() => setFlowIntensity(intensity.value as 'light' | 'medium' | 'heavy')}
                    className={`
                      px-5 py-2.5 rounded-full text-sm font-medium transition-all
                      ${flowIntensity === intensity.value
                        ? 'bg-rose-500/30 border border-rose-500/50 text-rose-300'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white'
                      }
                    `}
                  >
                    {intensity.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white/80">Symptoms</label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map(symptom => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${selectedSymptoms.includes(symptom)
                        ? 'bg-purple-500/30 border border-purple-500/50 text-purple-300'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white'
                      }
                    `}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white/80">Mood</label>
              <div className="flex flex-wrap gap-3">
                {MOODS.map(mood => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setSelectedMood(mood.value)}
                    className={`
                      px-4 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2
                      ${selectedMood === mood.value
                        ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white'
                      }
                    `}
                  >
                    <span className="text-lg">{mood.emoji}</span>
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-rose-500/50 resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12"
              >
                <Plus className="w-4 h-4 mr-2" />
                Save Log
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setSelectedDate(null);
                }}
                className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl h-12 px-6"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Add Button (when form is hidden) */}
      {!showForm && (
        <Button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            setEndDate(today);
            setShowForm(true);
          }}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12 sm:h-14 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Log Period
        </Button>
      )}

      {/* History Section */}
      {cycleData.logs.length > 0 && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 sm:p-8 space-y-5 sm:space-y-6">
          <h3 className="text-xl font-semibold text-white">Period History</h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {cycleData.logs.map(log => {
              const start = new Date(log.startDate);
              const end = new Date(log.endDate);
              const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              
              return (
                <div
                  key={log.id}
                  className="p-5 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/[0.06] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-white font-medium">
                          {formatDate(log.startDate)} — {formatDate(log.endDate)}
                        </span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/60">{duration} days</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Flow Badge */}
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-medium
                          ${log.flowIntensity === 'heavy' 
                            ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                            : log.flowIntensity === 'medium'
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                              : 'bg-teal-500/20 border border-teal-500/40 text-teal-300'
                          }
                        `}>
                          {log.flowIntensity.charAt(0).toUpperCase() + log.flowIntensity.slice(1)} Flow
                        </span>
                        
                        {/* Mood */}
                        <span className="text-lg">{getMoodEmoji(log.mood)}</span>
                        
                        {/* Symptoms preview */}
                        {log.symptoms.length > 0 && (
                          <span className="text-white/40 text-sm">
                            {log.symptoms.slice(0, 3).join(', ')}
                            {log.symptoms.length > 3 && ` +${log.symptoms.length - 3}`}
                          </span>
                        )}
                      </div>
                      
                      {log.notes && (
                        <p className="text-white/40 text-sm">{log.notes}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {cycleData.logs.length === 0 && !showForm && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 sm:p-12 text-center">
          <div className="p-3 sm:p-4 bg-rose-500/10 rounded-2xl w-fit mx-auto mb-5 sm:mb-6">
            <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400/60" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No periods logged yet</h3>
          <p className="text-white/50 mb-5 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
            Start tracking your menstrual cycle to get predictions and insights
          </p>
          <Button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
              setShowForm(true);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 sm:px-6 py-2.5 sm:py-3 h-auto text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log First Period
          </Button>
        </div>
      )}

      {/* Daily Log Dialog */}
      <Dialog open={showDailyLogDialog} onOpenChange={setShowDailyLogDialog}>
        <DialogContent className="bg-[#0f0f14] border border-white/[0.08] text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-rose-400" />
              Quick Daily Log
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Log your daily hormonal health data
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDailyLog} className="space-y-5 mt-4">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Date</label>
              <Input
                type="date"
                value={dailyLogDate}
                onChange={(e) => setDailyLogDate(e.target.value)}
                required
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-11 [color-scheme:dark]"
              />
            </div>

            {/* Mood - 5 emoji buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Mood</label>
              <div className="flex justify-between gap-1">
                {(Object.keys(moodEmojis) as MoodLevel[]).map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setDailyLogMood(mood)}
                    className={`flex-1 py-2.5 rounded-xl text-2xl transition-all ${
                      dailyLogMood === mood
                        ? 'bg-rose-500/20 border border-rose-500/40'
                        : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    {moodEmojis[mood]}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy - 1-5 slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-white/80">Energy Level</label>
                <span className="text-sm text-rose-400">{dailyLogEnergy}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={dailyLogEnergy}
                onChange={(e) => setDailyLogEnergy(parseInt(e.target.value))}
                className="w-full h-2 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            {/* Pain Level - 0-10 slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-white/80">Pain Level</label>
                <span className="text-sm text-rose-400">{dailyLogPainLevel}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={dailyLogPainLevel}
                onChange={(e) => setDailyLogPainLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>No pain</span>
                <span>Severe</span>
              </div>
            </div>

            {/* Skin Condition - radio buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Skin Condition</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(severityLabels) as SeverityLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDailyLogSkinCondition(level)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      dailyLogSkinCondition === level
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
                    }`}
                  >
                    {severityLabels[level]}
                  </button>
                ))}
              </div>
            </div>

            {/* Bloating - radio buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Bloating</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(severityLabels) as SeverityLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDailyLogBloating(level)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      dailyLogBloating === level
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
                    }`}
                  >
                    {severityLabels[level]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Notes</label>
              <Textarea
                value={dailyLogNotes}
                onChange={(e) => setDailyLogNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-rose-500/50 resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11"
              >
                <Plus className="w-4 h-4 mr-2" />
                Save Log
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDailyLogDialog(false)}
                className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl h-11 px-5"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PeriodTracker;
