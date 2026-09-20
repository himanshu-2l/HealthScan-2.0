/**
 * Smart BP Tracker Component
 * Manual BP entry, visual trend graphs, automatic alerts, and analysis reports
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VoiceInputButton } from './ui/VoiceInputButton';
import { VoicePattern } from '../hooks/useVoiceInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Heart,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Calendar,
  BarChart3,
  FileText,
  X,
  Download,
  FileDown,
  Printer,
  Target,
  MessageCircle,
  Award,
  Lightbulb,
  Minus,
  Zap,
  Clock,
  ChevronRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  saveBPReading,
  getAllBPReadings,
  getBPReadingsForPeriod,
  calculateBPStats,
  getBPCategory,
  detectBPAlerts,
  deleteBPReading,
  BPReading,
  BPAlert,
  BPStats,
  getBPReadingsByDateRange,
} from '@/services/bpService';
import { format, parseISO, subDays } from 'date-fns';
import { BPChatBot } from './BPChatBot';

// Custom tooltip component with glass styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
        <p className="text-white/70 text-sm font-medium mb-3">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: <span className="font-bold">{entry.value} mmHg</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const BPTracker: React.FC = () => {
  const [readings, setReadings] = useState<BPReading[]>([]);
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [pulse, setPulse] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [alerts, setAlerts] = useState<BPAlert[]>([]);
  const [stats, setStats] = useState<BPStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [bpGoal, setBPGoal] = useState<{ systolic: number; diastolic: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Voice patterns for BP readings
  const bpVoicePatterns: VoicePattern[] = [
    {
      name: 'bp',
      pattern: /(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})(?:\s*(?:pulse|heart\s*rate)?\s*(\d{2,3}))?/i,
      extract: (m) => ({ value: `${m[1]}/${m[2]}${m[3] ? '/' + m[3] : ''}`, unit: 'mmHg' })
    }
  ];

  useEffect(() => {
    loadReadings();
    const savedGoal = localStorage.getItem('bp_goal');
    if (savedGoal) {
      try {
        setBPGoal(JSON.parse(savedGoal));
      } catch (e) {
        console.error('Error loading BP goal:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (readings.length > 0) {
      const periodReadings = getBPReadingsForPeriod(selectedPeriod);
      const periodStats = calculateBPStats(periodReadings);
      setStats(periodStats);
      const detectedAlerts = detectBPAlerts(readings);
      setAlerts(detectedAlerts);
    } else {
      setStats(null);
      setAlerts([]);
    }
  }, [readings, selectedPeriod]);



  const loadReadings = () => {
    const allReadings = getAllBPReadings();
    setReadings(allReadings);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const systolicNum = parseInt(systolic);
    const diastolicNum = parseInt(diastolic);
    const pulseNum = pulse ? parseInt(pulse) : undefined;

    if (!systolic || isNaN(systolicNum)) {
      newErrors.systolic = 'Please enter systolic value';
    } else if (systolicNum < 50 || systolicNum > 250) {
      newErrors.systolic = 'Systolic must be between 50-250 mmHg';
    }

    if (!diastolic || isNaN(diastolicNum)) {
      newErrors.diastolic = 'Please enter diastolic value';
    } else if (diastolicNum < 30 || diastolicNum > 150) {
      newErrors.diastolic = 'Diastolic must be between 30-150 mmHg';
    }

    if (pulse && pulseNum !== undefined) {
      if (pulseNum < 30 || pulseNum > 200) {
        newErrors.pulse = 'Pulse must be between 30-200 bpm';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const errorCount = Object.keys(errors).length;
      toast.error('Validation Error', {
        description: `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} before saving`
      });
      return;
    }

    const systolicNum = parseInt(systolic);
    const diastolicNum = parseInt(diastolic);
    const pulseNum = pulse ? parseInt(pulse) : undefined;

    try {
      const newReading = saveBPReading({
        systolic: systolicNum,
        diastolic: diastolicNum,
        pulse: pulseNum,
        timestamp: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });

      setReadings([newReading, ...readings]);
      setSystolic('');
      setDiastolic('');
      setPulse('');
      setNotes('');
      setErrors({});
      setShowForm(false);
      
      toast.success('Reading saved successfully', {
        description: `${systolicNum}/${diastolicNum} mmHg recorded`
      });
    } catch (error) {
      console.error('Error saving BP reading:', error);
      toast.error('Failed to save reading', {
        description: 'Please try again'
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this reading?')) {
      if (deleteBPReading(id)) {
        setReadings(readings.filter(r => r.id !== id));
        toast.success('Reading deleted');
      }
    }
  };

  const sevenDayStats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const last7Days = readings.filter(r => new Date(r.timestamp) >= sevenDaysAgo);
    return calculateBPStats(last7Days);
  }, [readings]);

  const trend = useMemo(() => {
    if (readings.length < 2) return 'stable';
    
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);
    
    const last7Days = readings.filter(r => {
      const date = new Date(r.timestamp);
      return date >= sevenDaysAgo;
    });
    
    const prior7Days = readings.filter(r => {
      const date = new Date(r.timestamp);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    });
    
    if (last7Days.length === 0 || prior7Days.length === 0) return 'stable';
    
    const recentStats = calculateBPStats(last7Days);
    const priorStats = calculateBPStats(prior7Days);
    
    const systolicDiff = recentStats.averageSystolic - priorStats.averageSystolic;
    const diastolicDiff = recentStats.averageDiastolic - priorStats.averageDiastolic;
    
    if (systolicDiff < -3 && diastolicDiff < -3) return 'improving';
    if (systolicDiff > 3 && diastolicDiff > 3) return 'worsening';
    
    return 'stable';
  }, [readings]);

  const getStatusConfig = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) {
      return { label: 'Normal', bgColor: 'bg-emerald-500/15', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30', dotColor: 'bg-emerald-500' };
    } else if (systolic >= 120 && systolic <= 139 && diastolic >= 80 && diastolic <= 89) {
      return { label: 'Elevated', bgColor: 'bg-amber-500/15', textColor: 'text-amber-400', borderColor: 'border-amber-500/30', dotColor: 'bg-amber-500' };
    } else {
      return { label: 'High', bgColor: 'bg-red-500/15', textColor: 'text-red-400', borderColor: 'border-red-500/30', dotColor: 'bg-red-500' };
    }
  };

  // Export functions
  const exportToJSON = () => {
    const dataStr = JSON.stringify(readings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bp-readings-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Systolic (mmHg)', 'Diastolic (mmHg)', 'Pulse (bpm)', 'Category', 'Notes'];
    const rows = readings.map(reading => {
      const date = parseISO(reading.timestamp);
      const category = getBPCategory(reading.systolic, reading.diastolic);
      return [
        format(date, 'yyyy-MM-dd'),
        format(date, 'HH:mm'),
        reading.systolic.toString(),
        reading.diastolic.toString(),
        reading.pulse?.toString() || '',
        category.category,
        reading.notes || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bp-readings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Blood Pressure Report', 14, 20);
      doc.setFontSize(12);
      const dateRange = readings.length > 0
        ? `${format(parseISO(readings[readings.length - 1].timestamp), 'MMM dd, yyyy')} - ${format(parseISO(readings[0].timestamp), 'MMM dd, yyyy')}`
        : 'No readings';
      doc.text(`Period: ${dateRange}`, 14, 30);

      if (stats && stats.readingCount > 0) {
        doc.setFontSize(11);
        doc.text(`Total Readings: ${stats.readingCount}`, 14, 40);
        doc.text(`Average BP: ${stats.averageSystolic}/${stats.averageDiastolic} mmHg`, 14, 46);
        doc.text(`Range: Systolic ${stats.minSystolic}-${stats.maxSystolic} | Diastolic ${stats.minDiastolic}-${stats.maxDiastolic}`, 14, 52);
      }

      const tableData = readings.map(reading => {
        const date = parseISO(reading.timestamp);
        const category = getBPCategory(reading.systolic, reading.diastolic);
        return [
          format(date, 'MMM dd, yyyy'),
          format(date, 'HH:mm'),
          reading.systolic.toString(),
          reading.diastolic.toString(),
          reading.pulse?.toString() || 'N/A',
          category.category,
          reading.notes || ''
        ];
      });

      autoTable(doc, {
        head: [['Date', 'Time', 'Systolic', 'Diastolic', 'Pulse', 'Category', 'Notes']],
        body: tableData,
        startY: readings.length > 0 && stats ? 58 : 40,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [239, 68, 68] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      doc.save(`bp-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      setExportMenuOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', {
        description: 'Please try CSV or JSON export instead.'
      });
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateRange = readings.length > 0
      ? `${format(parseISO(readings[readings.length - 1].timestamp), 'MMM dd, yyyy')} - ${format(parseISO(readings[0].timestamp), 'MMM dd, yyyy')}`
      : 'No readings';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>BP Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #dc2626; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #dc2626; color: white; }
            tr:nth-child(even) { background-color: #f5f5f5; }
            .summary { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #dc2626; }
          </style>
        </head>
        <body>
          <h1>Blood Pressure Report</h1>
          <div class="summary">
            <p><strong>Period:</strong> ${dateRange}</p>
            ${stats && stats.readingCount > 0 ? `
              <p><strong>Total Readings:</strong> ${stats.readingCount}</p>
              <p><strong>Average BP:</strong> ${stats.averageSystolic}/${stats.averageDiastolic} mmHg</p>
              <p><strong>Range:</strong> Systolic ${stats.minSystolic}-${stats.maxSystolic} | Diastolic ${stats.minDiastolic}-${stats.maxDiastolic}</p>
            ` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Systolic</th>
                <th>Diastolic</th>
                <th>Pulse</th>
                <th>Category</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${readings.map(reading => {
      const date = parseISO(reading.timestamp);
      const category = getBPCategory(reading.systolic, reading.diastolic);
      return `
                  <tr>
                    <td>${format(date, 'MMM dd, yyyy')}</td>
                    <td>${format(date, 'HH:mm')}</td>
                    <td>${reading.systolic}</td>
                    <td>${reading.diastolic}</td>
                    <td>${reading.pulse || 'N/A'}</td>
                    <td>${category.category}</td>
                    <td>${reading.notes || ''}</td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    setExportMenuOpen(false);
  };

  const prepareChartData = () => {
    const periodReadings = getBPReadingsForPeriod(selectedPeriod);

    if (selectedPeriod === 'daily') {
      return periodReadings
        .map(reading => {
          const date = parseISO(reading.timestamp);
          return {
            date: format(date, 'HH:mm'),
            fullDate: reading.timestamp,
            systolic: reading.systolic,
            diastolic: reading.diastolic,
            readings: 1,
          };
        })
        .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
    }

    const groupedByDate: Record<string, BPReading[]> = {};

    periodReadings.forEach(reading => {
      const dateKey = reading.date;
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(reading);
    });

    return Object.entries(groupedByDate)
      .map(([date, dayReadings]) => {
        const avgSystolic = Math.round(
          dayReadings.reduce((sum, r) => sum + r.systolic, 0) / dayReadings.length
        );
        const avgDiastolic = Math.round(
          dayReadings.reduce((sum, r) => sum + r.diastolic, 0) / dayReadings.length
        );

        return {
          date: format(parseISO(date), 'MMM dd'),
          fullDate: date,
          systolic: avgSystolic,
          diastolic: avgDiastolic,
          readings: dayReadings.length,
        };
      })
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  };

  const getAnalysisReport = () => {
    if (!stats || readings.length === 0) {
      return null;
    }

    const periodReadings = getBPReadingsForPeriod(selectedPeriod);
    const recentCategory = stats.lastReading
      ? getBPCategory(stats.lastReading.systolic, stats.lastReading.diastolic)
      : null;

    const trends = {
      systolicTrend: stats.lastReading && periodReadings.length > 1
        ? stats.lastReading.systolic - periodReadings[periodReadings.length - 1].systolic
        : 0,
      diastolicTrend: stats.lastReading && periodReadings.length > 1
        ? stats.lastReading.diastolic - periodReadings[periodReadings.length - 1].diastolic
        : 0,
    };

    return {
      period: selectedPeriod,
      totalReadings: periodReadings.length,
      averageBP: `${stats.averageSystolic}/${stats.averageDiastolic} mmHg`,
      range: `Systolic: ${stats.minSystolic}-${stats.maxSystolic} mmHg | Diastolic: ${stats.minDiastolic}-${stats.maxDiastolic} mmHg`,
      currentCategory: recentCategory?.category || 'Unknown',
      trends,
      alerts: alerts.length,
      recommendations: generateRecommendations(stats, recentCategory, trends),
    };
  };

  const generateRecommendations = (
    stats: BPStats,
    category: ReturnType<typeof getBPCategory> | null,
    trends: { systolicTrend: number; diastolicTrend: number }
  ): string[] => {
    const recommendations: string[] = [];

    if (!category) return recommendations;

    if (category.severity === 'crisis' || category.severity === 'high-stage2') {
      recommendations.push('⚠️ Seek immediate medical attention - High BP detected');
      recommendations.push('💊 Consult with your healthcare provider about medication');
    } else if (category.severity === 'high-stage1') {
      recommendations.push('📋 Monitor BP regularly and maintain a log');
      recommendations.push('🏃 Consider lifestyle changes: exercise, diet, stress management');
      recommendations.push('👨‍⚕️ Schedule a consultation with your doctor');
    } else if (category.severity === 'elevated') {
      recommendations.push('📊 Continue monitoring your BP regularly');
      recommendations.push('🥗 Focus on healthy diet and regular exercise');
      recommendations.push('😌 Practice stress reduction techniques');
    }

    if (trends.systolicTrend > 5 || trends.diastolicTrend > 5) {
      recommendations.push('📈 Rising trend detected - increase monitoring frequency');
    }

    if (stats.averageSystolic >= 120 && stats.averageDiastolic >= 80) {
      recommendations.push('⏰ Take readings at consistent times (morning/evening)');
    }

    return recommendations;
  };

  const chartData = prepareChartData();
  const analysisReport = getAnalysisReport();
  const lastReading = readings[0];
  const lastCategory = lastReading ? getBPCategory(lastReading.systolic, lastReading.diastolic) : null;

  return (
    <div className="space-y-8">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.slice(0, 3).map((alert, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 p-5 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                alert.severity === 'danger'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div className={`p-2 rounded-xl ${alert.severity === 'danger' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                <AlertTriangle className={`w-5 h-5 ${alert.severity === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <h4 className={`font-semibold ${alert.severity === 'danger' ? 'text-red-400' : 'text-amber-400'}`}>
                  {alert.type === 'critical' ? 'Critical Alert' : 'Warning'}
                </h4>
                <p className="text-white/70 text-sm mt-1">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hero Stats Section - Current BP Prominent Display */}
      {readings.length > 0 && lastReading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Current BP - Hero Card */}
          <div className="lg:col-span-1 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <span className="text-white/50 text-xs sm:text-sm font-medium uppercase tracking-wider">Current Reading</span>
                {(() => {
                  const status = getStatusConfig(lastReading.systolic, lastReading.diastolic);
                  return (
                    <Badge className={`${status.bgColor} ${status.textColor} ${status.borderColor} border px-2 sm:px-3 py-1 rounded-full text-xs font-medium`}>
                      <span className={`w-2 h-2 rounded-full ${status.dotColor} mr-1 sm:mr-2`} />
                      {status.label}
                    </Badge>
                  );
                })()}
              </div>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
                  {lastReading.systolic}
                </span>
                <span className="text-2xl sm:text-4xl text-white/40 font-light">/</span>
                <span className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
                  {lastReading.diastolic}
                </span>
              </div>
              <p className="text-white/40 mt-2 text-sm">mmHg</p>
              {lastReading.pulse && (
                <div className="flex items-center gap-2 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/[0.06]">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span className="text-white/70">{lastReading.pulse}</span>
                  <span className="text-white/40 text-sm">bpm</span>
                </div>
              )}
              <p className="text-white/30 text-xs mt-3 sm:mt-4">
                <Clock className="w-3 h-3 inline mr-1" />
                {format(parseISO(lastReading.timestamp), 'MMM dd, yyyy • HH:mm')}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-6">
            {/* 7-Day Average */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6 hover:bg-white/[0.06] transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <span className="text-white/50 text-xs sm:text-sm font-medium">7-Day Avg</span>
                <div className="p-1.5 sm:p-2 bg-teal-500/15 rounded-lg sm:rounded-xl">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-bold text-white">
                {sevenDayStats.readingCount > 0 
                  ? `${sevenDayStats.averageSystolic}/${sevenDayStats.averageDiastolic}`
                  : '--/--'}
              </div>
              <p className="text-white/40 text-xs sm:text-sm mt-1">mmHg</p>
              <p className="text-white/30 text-xs mt-2 sm:mt-4">
                {sevenDayStats.readingCount} reading{sevenDayStats.readingCount !== 1 ? 's' : ''} this week
              </p>
            </div>

            {/* Trend */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6 hover:bg-white/[0.06] transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <span className="text-white/50 text-xs sm:text-sm font-medium">Weekly Trend</span>
                <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${
                  trend === 'improving' ? 'bg-emerald-500/15' : 
                  trend === 'worsening' ? 'bg-red-500/15' : 'bg-amber-500/15'
                }`}>
                  {trend === 'improving' && <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
                  {trend === 'worsening' && <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />}
                  {trend === 'stable' && <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />}
                </div>
              </div>
              <div className={`text-lg sm:text-3xl font-bold ${
                trend === 'improving' ? 'text-emerald-400' : 
                trend === 'worsening' ? 'text-red-400' : 'text-amber-400'
              }`}>
                {trend === 'improving' ? 'Improving' : trend === 'worsening' ? 'Worsening' : 'Stable'}
              </div>
              <p className="text-white/40 text-xs sm:text-sm mt-1">vs. prior 7 days</p>
            </div>

            {/* Total Readings */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6 hover:bg-white/[0.06] transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <span className="text-white/50 text-xs sm:text-sm font-medium">Total</span>
                <div className="p-1.5 sm:p-2 bg-violet-500/15 rounded-lg sm:rounded-xl">
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-bold text-white">{readings.length}</div>
              <p className="text-white/40 text-xs sm:text-sm mt-1">recordings</p>
            </div>

            {/* BP Range */}
            {stats && stats.readingCount > 0 && (
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6 hover:bg-white/[0.06] transition-all duration-300">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <span className="text-white/50 text-xs sm:text-sm font-medium">BP Range</span>
                  <div className="p-1.5 sm:p-2 bg-blue-500/15 rounded-lg sm:rounded-xl">
                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold text-white">
                  {stats.minSystolic}-{stats.maxSystolic}
                </div>
                <p className="text-white/40 text-xs sm:text-sm mt-1">
                  / {stats.minDiastolic}-{stats.maxDiastolic} mmHg
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Heart className="w-5 h-5 text-rose-400" />
          <span className="text-white font-medium text-sm sm:text-base">Blood Pressure Log</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {readings.length > 0 && (
            <>
              <Button
                onClick={() => setShowChat(true)}
                variant="ghost"
                className="bg-white/[0.04] hover:bg-white/[0.08] text-violet-400 border border-violet-500/20 rounded-xl px-4 py-2 h-auto"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                AI Analysis
              </Button>
              <DropdownMenu open={exportMenuOpen} onOpenChange={setExportMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border border-white/[0.08] rounded-xl px-4 py-2 h-auto"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#1a1a2e] border-white/10">
                  <DropdownMenuItem onClick={exportToPDF} className="text-white/80 hover:text-white hover:bg-white/[0.06] cursor-pointer">
                    <FileDown className="w-4 h-4 text-red-400 mr-3" /> Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToCSV} className="text-white/80 hover:text-white hover:bg-white/[0.06] cursor-pointer">
                    <FileDown className="w-4 h-4 text-emerald-400 mr-3" /> Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToJSON} className="text-white/80 hover:text-white hover:bg-white/[0.06] cursor-pointer">
                    <FileDown className="w-4 h-4 text-blue-400 mr-3" /> Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={printReport} className="text-white/80 hover:text-white hover:bg-white/[0.06] cursor-pointer">
                    <Printer className="w-4 h-4 text-violet-400 mr-3" /> Print Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl px-6 py-2 h-auto font-medium shadow-lg shadow-rose-600/20 transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Reading
          </Button>
        </div>
      </div>

      {/* Entry Form */}
      {showForm && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-rose-500/20 rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/15 rounded-xl">
                <Plus className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Record New Reading</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowForm(false)}
              className="text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl h-10 w-10"
              aria-label="Close form"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Voice Input Section */}
            <div className="flex items-center justify-center gap-4 pb-4 border-b border-white/[0.06]">
              <span className="text-white/50 text-sm">Say your BP reading:</span>
              <VoiceInputButton
                patterns={bpVoicePatterns}
                onParsedResult={(result) => {
                  if (result.patternName === 'bp') {
                    const parts = String(result.value).split('/');
                    if (parts[0]) setSystolic(parts[0]);
                    if (parts[1]) setDiastolic(parts[1]);
                    if (parts[2]) setPulse(parts[2]);
                  }
                }}
                onTranscript={(text) => {
                  // Fallback: try to parse numbers from free-form text
                  const numbers = text.match(/\d{2,3}/g);
                  if (numbers && numbers.length >= 2) {
                    setSystolic(numbers[0]);
                    setDiastolic(numbers[1]);
                    if (numbers.length >= 3) setPulse(numbers[2]);
                  }
                }}
                placeholder="Say '120 over 80'"
                size="md"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="systolic-input" className="text-sm font-medium text-white/70 block">
                  Systolic (mmHg) <span className="text-rose-400">*</span>
                </label>
                <Input
                  id="systolic-input"
                  type="number"
                  value={systolic}
                  onChange={(e) => { setSystolic(e.target.value); clearError('systolic'); }}
                  placeholder="120"
                  min="50"
                  max="250"
                  className={`bg-white/[0.04] border ${errors.systolic ? 'border-red-500' : 'border-white/[0.08]'} rounded-xl text-white placeholder:text-white/30 focus:border-teal-500/50 focus:ring-teal-500/20 h-12 text-lg`}
                />
                {errors.systolic && <p className="text-red-400 text-xs mt-1">{errors.systolic}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="diastolic-input" className="text-sm font-medium text-white/70 block">
                  Diastolic (mmHg) <span className="text-rose-400">*</span>
                </label>
                <Input
                  id="diastolic-input"
                  type="number"
                  value={diastolic}
                  onChange={(e) => { setDiastolic(e.target.value); clearError('diastolic'); }}
                  placeholder="80"
                  min="30"
                  max="150"
                  className={`bg-white/[0.04] border ${errors.diastolic ? 'border-red-500' : 'border-white/[0.08]'} rounded-xl text-white placeholder:text-white/30 focus:border-teal-500/50 focus:ring-teal-500/20 h-12 text-lg`}
                />
                {errors.diastolic && <p className="text-red-400 text-xs mt-1">{errors.diastolic}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="pulse-input" className="text-sm font-medium text-white/70 block">
                  Pulse (bpm) <span className="text-white/30">- Optional</span>
                </label>
                <Input
                  id="pulse-input"
                  type="number"
                  value={pulse}
                  onChange={(e) => { setPulse(e.target.value); clearError('pulse'); }}
                  placeholder="72"
                  min="30"
                  max="200"
                  className={`bg-white/[0.04] border ${errors.pulse ? 'border-red-500' : 'border-white/[0.08]'} rounded-xl text-white placeholder:text-white/30 focus:border-teal-500/50 focus:ring-teal-500/20 h-12 text-lg`}
                />
                {errors.pulse && <p className="text-red-400 text-xs mt-1">{errors.pulse}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="notes-input" className="text-sm font-medium text-white/70 block">
                  Notes <span className="text-white/30">- Optional</span>
                </label>
                <Input
                  id="notes-input"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Morning reading, after exercise"
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-teal-500/50 focus:ring-teal-500/20 h-12"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl h-12 font-medium shadow-lg shadow-rose-600/20">
                <Zap className="w-4 h-4 mr-2" />
                Save Reading
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border-white/[0.08] rounded-xl h-12 px-8"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* BP Goal Section */}
      {readings.length > 0 && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/15 rounded-xl">
                <Target className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">BP Goals & Progress</h3>
            </div>
            {!bpGoal && (
              <Button
                onClick={() => {
                  const goal = prompt('Set your BP goal (format: systolic/diastolic, e.g., 120/80):');
                  if (goal) {
                    const [sys, dia] = goal.split('/').map(Number);
                    if (!isNaN(sys) && !isNaN(dia)) {
                      const newGoal = { systolic: sys, diastolic: dia };
                      setBPGoal(newGoal);
                      localStorage.setItem('bp_goal', JSON.stringify(newGoal));
                    }
                  }
                }}
                variant="ghost"
                className="bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 rounded-xl px-4 py-2 h-auto text-sm"
              >
                Set Goal
              </Button>
            )}
          </div>
          <div className="p-8">
            {bpGoal ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div>
                    <p className="text-white/50 text-sm mb-1">Target Goal</p>
                    <p className="text-3xl font-bold text-violet-400">{bpGoal.systolic}/{bpGoal.diastolic} <span className="text-lg text-white/40">mmHg</span></p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setBPGoal(null); localStorage.removeItem('bp_goal'); }}
                    className="text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl"
                    aria-label="Remove BP goal"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {stats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/50 text-sm">Systolic Progress</span>
                        {stats.averageSystolic <= bpGoal.systolic ? (
                          <Award className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <span className="text-sm font-medium text-white/60">
                            {Math.round(((stats.averageSystolic - bpGoal.systolic) / bpGoal.systolic) * 100)}% above
                          </span>
                        )}
                      </div>
                      <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            stats.averageSystolic <= bpGoal.systolic ? 'bg-emerald-500' :
                            stats.averageSystolic <= bpGoal.systolic + 10 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, (bpGoal.systolic / stats.averageSystolic) * 100)}%` }}
                        />
                      </div>
                      <p className="text-white/40 text-xs mt-3">Current: {stats.averageSystolic} | Goal: {bpGoal.systolic}</p>
                    </div>
                    <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/50 text-sm">Diastolic Progress</span>
                        {stats.averageDiastolic <= bpGoal.diastolic ? (
                          <Award className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <span className="text-sm font-medium text-white/60">
                            {Math.round(((stats.averageDiastolic - bpGoal.diastolic) / bpGoal.diastolic) * 100)}% above
                          </span>
                        )}
                      </div>
                      <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            stats.averageDiastolic <= bpGoal.diastolic ? 'bg-emerald-500' :
                            stats.averageDiastolic <= bpGoal.diastolic + 5 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, (bpGoal.diastolic / stats.averageDiastolic) * 100)}%` }}
                        />
                      </div>
                      <p className="text-white/40 text-xs mt-3">Current: {stats.averageDiastolic} | Goal: {bpGoal.diastolic}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-violet-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-violet-400" />
                </div>
                <p className="text-white/50 mb-4">Set a BP goal to track your progress</p>
                <Button
                  onClick={() => {
                    const goal = prompt('Set your BP goal (format: systolic/diastolic, e.g., 120/80):');
                    if (goal) {
                      const [sys, dia] = goal.split('/').map(Number);
                      if (!isNaN(sys) && !isNaN(dia)) {
                        const newGoal = { systolic: sys, diastolic: dia };
                        setBPGoal(newGoal);
                        localStorage.setItem('bp_goal', JSON.stringify(newGoal));
                      }
                    }
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 py-3 h-auto"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Set BP Goal
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts Section */}
      {readings.length > 0 && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/[0.06]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/15 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">BP Trends</h3>
              </div>
              <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as typeof selectedPeriod)} className="w-auto">
                <TabsList className="bg-white/[0.04] border border-white/[0.06] rounded-full p-1 h-auto">
                  <TabsTrigger
                    value="daily"
                    className="data-[state=active]:bg-white/[0.12] data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/[0.15] rounded-full px-5 py-2 text-sm font-medium text-white/50 transition-all"
                  >
                    Daily
                  </TabsTrigger>
                  <TabsTrigger
                    value="weekly"
                    className="data-[state=active]:bg-white/[0.12] data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/[0.15] rounded-full px-5 py-2 text-sm font-medium text-white/50 transition-all"
                  >
                    Weekly
                  </TabsTrigger>
                  <TabsTrigger
                    value="monthly"
                    className="data-[state=active]:bg-white/[0.12] data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/[0.15] rounded-full px-5 py-2 text-sm font-medium text-white/50 transition-all"
                  >
                    Monthly
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="p-8">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 200]} stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    name="Systolic"
                    dot={{ r: 5, fill: '#f43f5e', strokeWidth: 2, stroke: '#0a0a0f' }}
                    activeDot={{ r: 8, fill: '#f43f5e', strokeWidth: 3, stroke: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    name="Diastolic"
                    dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#0a0a0f' }}
                    activeDot={{ r: 8, fill: '#8b5cf6', strokeWidth: 3, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-white/30" />
                </div>
                <p className="text-white font-medium">No readings for {selectedPeriod} period</p>
                <p className="text-white/40 text-sm mt-1">Add readings to see trends</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Tips Section */}
      {readings.length > 0 && stats && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 bg-amber-500/15 rounded-xl">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Personalized Tips</h3>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(() => {
                const tips: { icon: string; text: string }[] = [];
                const avgCategory = getBPCategory(stats.averageSystolic, stats.averageDiastolic);

                if (avgCategory.severity === 'high-stage1' || avgCategory.severity === 'high-stage2') {
                  tips.push({ icon: '💊', text: 'Consult with your healthcare provider about BP management' });
                  tips.push({ icon: '🧂', text: 'Reduce sodium intake - aim for less than 2,300mg per day' });
                  tips.push({ icon: '🏃', text: 'Engage in regular physical activity - 30 minutes most days' });
                  tips.push({ icon: '😌', text: 'Practice stress management techniques like meditation' });
                } else if (avgCategory.severity === 'elevated') {
                  tips.push({ icon: '📊', text: 'Continue monitoring your BP regularly' });
                  tips.push({ icon: '🥗', text: 'Focus on a heart-healthy diet rich in fruits and vegetables' });
                  tips.push({ icon: '⚖️', text: 'Maintain a healthy weight' });
                  tips.push({ icon: '🚭', text: 'Avoid smoking and limit alcohol consumption' });
                } else {
                  tips.push({ icon: '✅', text: 'Great job maintaining healthy BP levels!' });
                  tips.push({ icon: '📋', text: 'Continue regular monitoring to maintain this level' });
                  tips.push({ icon: '🏋️', text: 'Keep up with regular exercise and healthy eating' });
                }

                if (readings.length < 7) {
                  tips.push({ icon: '📈', text: 'Track more readings for better insights into your BP patterns' });
                }

                return tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.04] transition-colors">
                    <span className="text-2xl">{tip.icon}</span>
                    <span className="text-white/70 text-sm leading-relaxed">{tip.text}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Report */}
      {analysisReport && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 bg-cyan-500/15 rounded-xl">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Analysis Report</h3>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
              <div>
                <p className="text-white/40 text-sm mb-1">Period</p>
                <p className="text-white font-semibold capitalize">{analysisReport.period}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Readings</p>
                <p className="text-white font-semibold">{analysisReport.totalReadings}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Average BP</p>
                <p className="text-white font-semibold">{analysisReport.averageBP}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Status</p>
                <p className="text-white font-semibold">{analysisReport.currentCategory}</p>
              </div>
            </div>
            <div className="p-5 bg-white/[0.02] border border-white/[0.04] rounded-xl mb-6">
              <p className="text-white/40 text-sm mb-2">BP Range</p>
              <p className="text-white/80">{analysisReport.range}</p>
            </div>
            {analysisReport.recommendations.length > 0 && (
              <div>
                <p className="text-white/60 text-sm font-medium mb-4">Recommendations</p>
                <div className="space-y-3">
                  {analysisReport.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-white/70 text-sm">
                      <ChevronRight className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reading History */}
      {readings.length > 0 && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/[0.06] rounded-xl">
                <Clock className="w-5 h-5 text-white/60" />
              </div>
              <h3 className="text-lg font-semibold text-white">Reading History</h3>
            </div>
            <Badge className="bg-white/[0.06] text-white/60 border-white/[0.08] rounded-full px-3 py-1">
              {readings.length} total
            </Badge>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto">
            {readings.slice(0, 15).map((reading) => {
              const status = getStatusConfig(reading.systolic, reading.diastolic);
              return (
                <div
                  key={reading.id}
                  className="px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/[0.02] transition-colors group gap-3 sm:gap-0"
                >
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    <div className="text-xs sm:text-sm text-white/40 min-w-[100px] sm:min-w-[130px]">
                      {format(parseISO(reading.timestamp), 'MMM dd, yyyy')}
                      <span className="text-white/25 ml-1 sm:ml-2">{format(parseISO(reading.timestamp), 'HH:mm')}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-bold text-white">{reading.systolic}</span>
                      <span className="text-white/30 text-base sm:text-lg">/</span>
                      <span className="text-xl sm:text-2xl font-bold text-white">{reading.diastolic}</span>
                      <span className="text-white/40 text-xs sm:text-sm ml-1">mmHg</span>
                    </div>
                    {reading.pulse && (
                      <div className="flex items-center gap-1.5 text-white/40">
                        <Activity className="w-3.5 h-3.5" />
                        <span className="text-xs sm:text-sm">{reading.pulse} bpm</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Badge className={`${status.bgColor} ${status.textColor} ${status.borderColor} border rounded-full px-2 sm:px-3 py-1 text-xs`}>
                      {status.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(reading.id)}
                      className="text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl h-9 w-9 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                      aria-label={`Delete reading ${reading.systolic}/${reading.diastolic}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {readings.length === 0 && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-16 text-center">
          <div className="w-24 h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-rose-400/60" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No Readings Yet</h3>
          <p className="text-white/50 max-w-md mx-auto mb-8 leading-relaxed">
            Record your first blood pressure reading to start tracking your heart health and receive personalized insights.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl px-8 py-4 h-auto font-medium shadow-lg shadow-rose-600/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add First Reading
          </Button>
        </div>
      )}

      {/* BP Analysis Chat */}
      <BPChatBot
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        readings={readings}
        stats={stats}
      />
    </div>
  );
};

export default BPTracker;
