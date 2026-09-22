/**
 * Doctor Report Component
 * A shareable health report generator for physicians
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { callAIProxy } from '@/services/aiProxyService';
import {
  FileText,
  User,
  Heart,
  Droplet,
  Thermometer,
  Activity,
  Pill,
  AlertCircle,
  Copy,
  Download,
  Mail,
  Printer,
  Sparkles,
  Calendar,
  TrendingUp,
  Clock,
  FileDown,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';

// Interfaces
interface MedicalID {
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
}

interface PatientProfile {
  name?: string;
  age?: number;
  gender?: string;
}

interface BPReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: string;
  date: string;
}

interface GlucoseReading {
  id: string;
  fasting?: number;
  postMeal?: number;
  hba1c?: number;
  timestamp: string;
  date: string;
}

interface HealthReading {
  heartRate?: number;
  temperature?: number;
  spO2?: number;
  timestamp?: string;
}

type DateRange = '7days' | '30days' | '90days' | 'all';

export const DoctorReport: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [medicalId, setMedicalId] = useState<MedicalID | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [bpReadings, setBpReadings] = useState<BPReading[]>([]);
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [healthReadings, setHealthReadings] = useState<HealthReading | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string>('');

  // Load data from localStorage
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    try {
      // Load medical ID
      const medicalIdData = localStorage.getItem('healthscan_medical_id');
      if (medicalIdData) {
        setMedicalId(JSON.parse(medicalIdData));
      }

      // Load patient profile
      const profileData = localStorage.getItem('healthscan_patient_profile');
      if (profileData) {
        setPatientProfile(JSON.parse(profileData));
      }

      // Load BP readings
      const bpData = localStorage.getItem('healthscan_bp_readings');
      if (bpData) {
        setBpReadings(JSON.parse(bpData));
      }

      // Load glucose readings
      const glucoseData = localStorage.getItem('healthscan_glucose_readings');
      if (glucoseData) {
        setGlucoseReadings(JSON.parse(glucoseData));
      }

      // Load health readings
      const healthData = localStorage.getItem('healthscan_health_readings');
      if (healthData) {
        setHealthReadings(JSON.parse(healthData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Filter readings by date range
  const getDateRangeInterval = () => {
    const now = new Date();
    switch (dateRange) {
      case '7days':
        return { start: subDays(now, 7), end: now };
      case '30days':
        return { start: subDays(now, 30), end: now };
      case '90days':
        return { start: subDays(now, 90), end: now };
      case 'all':
      default:
        return null;
    }
  };

  const filteredBPReadings = useMemo(() => {
    const interval = getDateRangeInterval();
    if (!interval) return bpReadings;
    return bpReadings.filter(r => {
      const date = parseISO(r.timestamp);
      return isWithinInterval(date, interval);
    });
  }, [bpReadings, dateRange]);

  const filteredGlucoseReadings = useMemo(() => {
    const interval = getDateRangeInterval();
    if (!interval) return glucoseReadings;
    return glucoseReadings.filter(r => {
      const date = parseISO(r.timestamp);
      return isWithinInterval(date, interval);
    });
  }, [glucoseReadings, dateRange]);

  // Calculate statistics
  const bpStats = useMemo(() => {
    if (filteredBPReadings.length === 0) return null;
    const systolicSum = filteredBPReadings.reduce((sum, r) => sum + r.systolic, 0);
    const diastolicSum = filteredBPReadings.reduce((sum, r) => sum + r.diastolic, 0);
    const count = filteredBPReadings.length;
    const latest = filteredBPReadings[0];
    return {
      avgSystolic: Math.round(systolicSum / count),
      avgDiastolic: Math.round(diastolicSum / count),
      latest,
      count,
    };
  }, [filteredBPReadings]);

  const glucoseStats = useMemo(() => {
    if (filteredGlucoseReadings.length === 0) return null;
    const fastingReadings = filteredGlucoseReadings.filter(r => r.fasting);
    const postMealReadings = filteredGlucoseReadings.filter(r => r.postMeal);
    const latest = filteredGlucoseReadings[0];
    return {
      avgFasting: fastingReadings.length > 0
        ? Math.round(fastingReadings.reduce((sum, r) => sum + (r.fasting || 0), 0) / fastingReadings.length)
        : null,
      avgPostMeal: postMealReadings.length > 0
        ? Math.round(postMealReadings.reduce((sum, r) => sum + (r.postMeal || 0), 0) / postMealReadings.length)
        : null,
      latest,
      count: filteredGlucoseReadings.length,
    };
  }, [filteredGlucoseReadings]);

  // Prepare chart data
  const bpChartData = useMemo(() => {
    return filteredBPReadings
      .slice(0, 30)
      .map(r => ({
        date: format(parseISO(r.timestamp), 'MMM dd'),
        systolic: r.systolic,
        diastolic: r.diastolic,
      }))
      .reverse();
  }, [filteredBPReadings]);

  const glucoseChartData = useMemo(() => {
    return filteredGlucoseReadings
      .slice(0, 30)
      .map(r => ({
        date: format(parseISO(r.timestamp), 'MMM dd'),
        fasting: r.fasting || null,
        postMeal: r.postMeal || null,
      }))
      .reverse();
  }, [filteredGlucoseReadings]);

  // Generate AI Summary
  const generateAISummary = async () => {
    setIsGeneratingAI(true);
    setAiError('');

    try {
      const prompt = `As a medical AI assistant, generate a brief clinical summary for a physician based on the following patient health data. Keep it professional and concise (2-3 paragraphs max).

Patient Information:
- Name: ${patientProfile?.name || 'Not provided'}
- Age: ${patientProfile?.age || 'Not provided'}
- Gender: ${patientProfile?.gender || 'Not provided'}
- Blood Type: ${medicalId?.bloodType || 'Not provided'}
- Allergies: ${medicalId?.allergies?.join(', ') || 'None reported'}
- Current Medications: ${medicalId?.medications?.join(', ') || 'None reported'}
- Medical Conditions: ${medicalId?.conditions?.join(', ') || 'None reported'}

Vital Signs (Latest):
- Blood Pressure: ${bpStats?.latest ? `${bpStats.latest.systolic}/${bpStats.latest.diastolic} mmHg` : 'No data'}
- BP Average (30-day): ${bpStats ? `${bpStats.avgSystolic}/${bpStats.avgDiastolic} mmHg` : 'No data'}
- Heart Rate: ${healthReadings?.heartRate ? `${healthReadings.heartRate} bpm` : 'No data'}
- Temperature: ${healthReadings?.temperature ? `${healthReadings.temperature}°F` : 'No data'}
- SpO2: ${healthReadings?.spO2 ? `${healthReadings.spO2}%` : 'No data'}

Blood Glucose (Latest):
- Fasting: ${glucoseStats?.latest?.fasting ? `${glucoseStats.latest.fasting} mg/dL` : 'No data'}
- Post-Meal: ${glucoseStats?.latest?.postMeal ? `${glucoseStats.latest.postMeal} mg/dL` : 'No data'}
- Average Fasting: ${glucoseStats?.avgFasting ? `${glucoseStats.avgFasting} mg/dL` : 'No data'}

Please provide observations, potential concerns, and any recommendations for the physician's review.`;

      const result = await callAIProxy('doctor-report', { prompt });
      setAiSummary(result);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiError('Failed to generate AI summary. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Generate report text
  const generateReportText = () => {
    const lines: string[] = [];
    lines.push('=' .repeat(60));
    lines.push('HEALTHSCAN - PHYSICIAN HEALTH REPORT');
    lines.push('=' .repeat(60));
    lines.push(`Report Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`);
    lines.push(`Date Range: ${dateRange === 'all' ? 'All Time' : `Last ${dateRange.replace('days', ' Days')}`}`);
    lines.push('');

    lines.push('-'.repeat(40));
    lines.push('PATIENT INFORMATION');
    lines.push('-'.repeat(40));
    lines.push(`Name: ${patientProfile?.name || 'Not provided'}`);
    lines.push(`Age: ${patientProfile?.age || 'Not provided'}`);
    lines.push(`Gender: ${patientProfile?.gender || 'Not provided'}`);
    lines.push(`Blood Type: ${medicalId?.bloodType || 'Not provided'}`);
    lines.push(`Allergies: ${medicalId?.allergies?.join(', ') || 'None reported'}`);
    lines.push('');

    lines.push('-'.repeat(40));
    lines.push('VITAL SIGNS');
    lines.push('-'.repeat(40));
    if (bpStats) {
      lines.push(`Latest BP: ${bpStats.latest.systolic}/${bpStats.latest.diastolic} mmHg`);
      lines.push(`Average BP (${dateRange}): ${bpStats.avgSystolic}/${bpStats.avgDiastolic} mmHg`);
      lines.push(`Total BP Readings: ${bpStats.count}`);
    } else {
      lines.push('Blood Pressure: No data available');
    }
    lines.push(`Heart Rate: ${healthReadings?.heartRate ? `${healthReadings.heartRate} bpm` : 'No data'}`);
    lines.push(`Temperature: ${healthReadings?.temperature ? `${healthReadings.temperature}°F` : 'No data'}`);
    lines.push(`SpO2: ${healthReadings?.spO2 ? `${healthReadings.spO2}%` : 'No data'}`);
    lines.push('');

    lines.push('-'.repeat(40));
    lines.push('BLOOD GLUCOSE');
    lines.push('-'.repeat(40));
    if (glucoseStats) {
      if (glucoseStats.latest?.fasting) lines.push(`Latest Fasting: ${glucoseStats.latest.fasting} mg/dL`);
      if (glucoseStats.latest?.postMeal) lines.push(`Latest Post-Meal: ${glucoseStats.latest.postMeal} mg/dL`);
      if (glucoseStats.avgFasting) lines.push(`Average Fasting: ${glucoseStats.avgFasting} mg/dL`);
      if (glucoseStats.avgPostMeal) lines.push(`Average Post-Meal: ${glucoseStats.avgPostMeal} mg/dL`);
      lines.push(`Total Glucose Readings: ${glucoseStats.count}`);
    } else {
      lines.push('Blood Glucose: No data available');
    }
    lines.push('');

    lines.push('-'.repeat(40));
    lines.push('MEDICATIONS & CONDITIONS');
    lines.push('-'.repeat(40));
    lines.push(`Medications: ${medicalId?.medications?.join(', ') || 'None reported'}`);
    lines.push(`Conditions: ${medicalId?.conditions?.join(', ') || 'None reported'}`);
    lines.push('');

    if (aiSummary) {
      lines.push('-'.repeat(40));
      lines.push('AI CLINICAL SUMMARY');
      lines.push('-'.repeat(40));
      lines.push(aiSummary);
      lines.push('');
    }

    lines.push('=' .repeat(60));
    lines.push('END OF REPORT');
    lines.push('=' .repeat(60));

    return lines.join('\n');
  };

  // Copy to clipboard
  const handleCopyToClipboard = async () => {
    try {
      const reportText = generateReportText();
      await navigator.clipboard.writeText(reportText);
      toast.success('Report copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy report');
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      let yPos = 20;
      const lineHeight = 7;
      const pageHeight = 280;
      
      const addText = (text: string, fontSize = 10, isBold = false) => {
        if (yPos > pageHeight) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        doc.text(text, 14, yPos);
        yPos += lineHeight;
      };

      // Header
      doc.setFillColor(20, 184, 166);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('HEALTHSCAN - PHYSICIAN HEALTH REPORT', 14, 10);
      
      doc.setTextColor(0, 0, 0);
      yPos = 25;
      
      addText(`Report Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 9);
      addText(`Date Range: ${dateRange === 'all' ? 'All Time' : `Last ${dateRange.replace('days', ' Days')}`}`, 9);
      yPos += 5;

      // Patient Information
      addText('PATIENT INFORMATION', 12, true);
      addText(`Name: ${patientProfile?.name || 'Not provided'}`);
      addText(`Age: ${patientProfile?.age || 'Not provided'}`);
      addText(`Gender: ${patientProfile?.gender || 'Not provided'}`);
      addText(`Blood Type: ${medicalId?.bloodType || 'Not provided'}`);
      addText(`Allergies: ${medicalId?.allergies?.join(', ') || 'None reported'}`);
      yPos += 5;

      // Vital Signs
      addText('VITAL SIGNS', 12, true);
      if (bpStats) {
        addText(`Latest BP: ${bpStats.latest.systolic}/${bpStats.latest.diastolic} mmHg`);
        addText(`Average BP: ${bpStats.avgSystolic}/${bpStats.avgDiastolic} mmHg`);
      }
      addText(`Heart Rate: ${healthReadings?.heartRate ? `${healthReadings.heartRate} bpm` : 'No data'}`);
      addText(`Temperature: ${healthReadings?.temperature ? `${healthReadings.temperature}°F` : 'No data'}`);
      addText(`SpO2: ${healthReadings?.spO2 ? `${healthReadings.spO2}%` : 'No data'}`);
      yPos += 5;

      // Blood Glucose
      addText('BLOOD GLUCOSE', 12, true);
      if (glucoseStats) {
        if (glucoseStats.latest?.fasting) addText(`Latest Fasting: ${glucoseStats.latest.fasting} mg/dL`);
        if (glucoseStats.latest?.postMeal) addText(`Latest Post-Meal: ${glucoseStats.latest.postMeal} mg/dL`);
        if (glucoseStats.avgFasting) addText(`Average Fasting: ${glucoseStats.avgFasting} mg/dL`);
      } else {
        addText('No glucose data available');
      }
      yPos += 5;

      // Medications & Conditions
      addText('MEDICATIONS & CONDITIONS', 12, true);
      addText(`Medications: ${medicalId?.medications?.join(', ') || 'None reported'}`);
      addText(`Conditions: ${medicalId?.conditions?.join(', ') || 'None reported'}`);

      if (aiSummary) {
        yPos += 5;
        addText('AI CLINICAL SUMMARY', 12, true);
        const summaryLines = doc.splitTextToSize(aiSummary, 180);
        summaryLines.forEach((line: string) => {
          addText(line, 9);
        });
      }

      doc.save(`health-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('PDF library not available. Using print instead.');
      handlePrint();
    }
  };

  // Share via email
  const handleShareEmail = () => {
    const reportText = generateReportText();
    const subject = encodeURIComponent(`HealthScan Report - ${format(new Date(), 'MMM dd, yyyy')}`);
    const body = encodeURIComponent(reportText);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // Print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>HealthScan Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #14b8a6; border-bottom: 2px solid #14b8a6; padding-bottom: 10px; }
            h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .label { font-weight: bold; color: #444; }
            .value { color: #666; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .stat-box { background: #f5f5f5; padding: 15px; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #14b8a6; }
            .stat-label { font-size: 12px; color: #888; }
            .ai-summary { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #14b8a6; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>HealthScan - Physician Report</h1>
          <div class="meta">
            Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}<br>
            Date Range: ${dateRange === 'all' ? 'All Time' : `Last ${dateRange.replace('days', ' Days')}`}
          </div>

          <h2>Patient Information</h2>
          <div class="section">
            <p><span class="label">Name:</span> <span class="value">${patientProfile?.name || 'Not provided'}</span></p>
            <p><span class="label">Age:</span> <span class="value">${patientProfile?.age || 'Not provided'}</span></p>
            <p><span class="label">Gender:</span> <span class="value">${patientProfile?.gender || 'Not provided'}</span></p>
            <p><span class="label">Blood Type:</span> <span class="value">${medicalId?.bloodType || 'Not provided'}</span></p>
            <p><span class="label">Allergies:</span> <span class="value">${medicalId?.allergies?.join(', ') || 'None reported'}</span></p>
          </div>

          <h2>Vital Signs</h2>
          <div class="section grid">
            <div class="stat-box">
              <div class="stat-value">${bpStats ? `${bpStats.latest.systolic}/${bpStats.latest.diastolic}` : '--/--'}</div>
              <div class="stat-label">Latest BP (mmHg)</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${bpStats ? `${bpStats.avgSystolic}/${bpStats.avgDiastolic}` : '--/--'}</div>
              <div class="stat-label">Average BP (mmHg)</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${healthReadings?.heartRate || '--'}</div>
              <div class="stat-label">Heart Rate (bpm)</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${healthReadings?.spO2 || '--'}</div>
              <div class="stat-label">SpO2 (%)</div>
            </div>
          </div>

          <h2>Blood Glucose</h2>
          <div class="section grid">
            <div class="stat-box">
              <div class="stat-value">${glucoseStats?.latest?.fasting || '--'}</div>
              <div class="stat-label">Latest Fasting (mg/dL)</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${glucoseStats?.avgFasting || '--'}</div>
              <div class="stat-label">Average Fasting (mg/dL)</div>
            </div>
          </div>

          <h2>Medications & Conditions</h2>
          <div class="section">
            <p><span class="label">Medications:</span> <span class="value">${medicalId?.medications?.join(', ') || 'None reported'}</span></p>
            <p><span class="label">Conditions:</span> <span class="value">${medicalId?.conditions?.join(', ') || 'None reported'}</span></p>
          </div>

          ${aiSummary ? `
            <h2>AI Clinical Summary</h2>
            <div class="ai-summary">
              ${aiSummary.replace(/\n/g, '<br>')}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  const hasAnyData = bpReadings.length > 0 || glucoseReadings.length > 0 || healthReadings || patientProfile || medicalId;

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">Filter Historical Interval</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selected: {dateRangeOptions.find(o => o.value === dateRange)?.label}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                dateRange === option.value
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Summary Card */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/30 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Patient Demographics & Identifiers</h3>
        </div>
        {patientProfile || medicalId ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-3 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Full Name</p>
              <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{patientProfile?.name || 'Not provided'}</p>
            </div>
            <div className="p-3 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Age</p>
              <p className="text-slate-900 dark:text-white font-bold text-sm">{patientProfile?.age ? `${patientProfile.age} yrs` : 'Not provided'}</p>
            </div>
            <div className="p-3 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Gender</p>
              <p className="text-slate-900 dark:text-white font-bold text-sm capitalize">{patientProfile?.gender || 'Not provided'}</p>
            </div>
            <div className="p-3 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Blood Type</p>
              <p className="text-slate-900 dark:text-white font-bold text-sm">{medicalId?.bloodType || 'Not provided'}</p>
            </div>
            <div className="p-3 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Known Allergies</p>
              <p className="text-slate-900 dark:text-white font-bold text-sm truncate">
                {medicalId?.allergies?.length ? medicalId.allergies.join(', ') : 'None reported'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <User className="w-10 h-10 text-slate-300 dark:text-white/20 mx-auto mb-2" />
            <p className="text-slate-600 dark:text-slate-400 text-sm">No patient profile configured</p>
          </div>
        )}
      </div>

      {/* Vital Signs Summary */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/30 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Vital Signs Telemetry</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Blood Pressure */}
          <div className="bg-rose-50/40 dark:bg-rose-950/15 border border-rose-200/60 dark:border-rose-800/30 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-rose-700 dark:text-rose-300 text-xs font-semibold">Blood Pressure</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {bpStats ? `${bpStats.latest.systolic}/${bpStats.latest.diastolic}` : '--/--'}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">mmHg (latest)</p>
            {bpStats && (
              <p className="text-teal-700 dark:text-teal-300 text-xs font-semibold mt-2">
                Avg: {bpStats.avgSystolic}/{bpStats.avgDiastolic}
              </p>
            )}
          </div>

          {/* Glucose */}
          <div className="bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-200/60 dark:border-emerald-800/30 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Droplet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">Blood Glucose</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {glucoseStats?.latest?.fasting || glucoseStats?.latest?.postMeal || '--'}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">mg/dL (latest)</p>
            {glucoseStats?.avgFasting && (
              <p className="text-teal-700 dark:text-teal-300 text-xs font-semibold mt-2">
                Avg: {glucoseStats.avgFasting}
              </p>
            )}
          </div>

          {/* Heart Rate */}
          <div className="bg-purple-50/40 dark:bg-purple-950/15 border border-purple-200/60 dark:border-purple-800/30 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-purple-700 dark:text-purple-300 text-xs font-semibold">Pulse</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {healthReadings?.heartRate || '--'}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">bpm</p>
          </div>

          {/* Temperature */}
          <div className="bg-amber-50/40 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-800/30 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Thermometer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-amber-700 dark:text-amber-300 text-xs font-semibold">Body Temp</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {healthReadings?.temperature || '--'}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">°F</p>
          </div>

          {/* SpO2 */}
          <div className="bg-blue-50/40 dark:bg-blue-950/15 border border-blue-200/60 dark:border-blue-800/30 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300 text-xs font-semibold">Oxygen (SpO2)</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {healthReadings?.spO2 || '--'}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">%</p>
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      {(bpChartData.length > 0 || glucoseChartData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BP Trend */}
          {bpChartData.length > 0 && (
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-rose-500" />
                <h3 className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">Blood Pressure Trajectory</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={bpChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis domain={[60, 180]} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Line type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} name="Systolic" />
                  <Line type="monotone" dataKey="diastolic" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} name="Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Glucose Trend */}
          {glucoseChartData.length > 0 && (
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h3 className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">Glucose Trajectory</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={glucoseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis domain={[50, 300]} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Line type="monotone" dataKey="fasting" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Fasting" />
                  <Line type="monotone" dataKey="postMeal" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} name="Post-Meal" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Medications & Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medications */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/30 rounded-xl">
              <Pill className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Prescribed Medications</h3>
          </div>
          {medicalId?.medications?.length ? (
            <div className="flex flex-wrap gap-2">
              {medicalId.medications.map((med, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/30 rounded-lg text-xs font-semibold"
                >
                  {med}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <Pill className="w-8 h-8 text-slate-300 dark:text-white/20 mx-auto mb-1.5" />
              <p className="text-slate-500 dark:text-slate-400 text-xs">No active medications recorded</p>
            </div>
          )}
        </div>

        {/* Conditions */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Active Medical Conditions</h3>
          </div>
          {medicalId?.conditions?.length ? (
            <div className="flex flex-wrap gap-2">
              {medicalId.conditions.map((cond, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/30 rounded-lg text-xs font-semibold"
                >
                  {cond}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-white/20 mx-auto mb-1.5" />
              <p className="text-slate-500 dark:text-slate-400 text-xs">No chronic conditions recorded</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/30 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Clinical AI Summary</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Synthesized clinical observations for physician review</p>
            </div>
          </div>
          <Button
            onClick={generateAISummary}
            disabled={isGeneratingAI || !hasAnyData}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 py-2 text-xs font-semibold h-auto shadow-sm disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Analyzing Metrics...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate AI Synthesis
              </>
            )}
          </Button>
        </div>
        {aiError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-xl mb-4">
            <p className="text-rose-700 dark:text-rose-300 text-xs font-medium">{aiError}</p>
          </div>
        )}
        {aiSummary ? (
          <div className="p-5 bg-teal-50/40 dark:bg-teal-950/15 border border-teal-200/60 dark:border-teal-800/30 rounded-xl">
            <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="w-10 h-10 text-slate-300 dark:text-white/20 mx-auto mb-2" />
            <p className="text-slate-600 dark:text-slate-400 text-xs">Click "Generate AI Synthesis" to evaluate longitudinal trends</p>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/30 rounded-xl">
            <FileDown className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Export & Share Documents</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleCopyToClipboard}
            variant="ghost"
            className="bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold h-auto"
          >
            <Copy className="w-4 h-4 mr-2 text-slate-500" />
            Copy Text Summary
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="ghost"
            className="bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold h-auto"
          >
            <Download className="w-4 h-4 mr-2 text-slate-500" />
            Download PDF Report
          </Button>
          <Button
            onClick={handleShareEmail}
            variant="ghost"
            className="bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold h-auto"
          >
            <Mail className="w-4 h-4 mr-2 text-slate-500" />
            Share via Email
          </Button>
          <Button
            onClick={handlePrint}
            variant="ghost"
            className="bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold h-auto"
          >
            <Printer className="w-4 h-4 mr-2 text-slate-500" />
            Print Format
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {!hasAnyData && (
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Clinical Data Recorded Yet</h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
            Take a quick health lab screening or enter vitals to populate your physician report.
          </p>
        </div>
      )}
    </div>
  );
};

