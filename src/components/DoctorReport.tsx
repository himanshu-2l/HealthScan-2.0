/**
 * Doctor Report Component
 * A shareable health report generator for physicians
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setAiError('AI API key not configured');
      return;
    }

    setIsGeneratingAI(true);
    setAiError('');

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiSummary(response.text());
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20">
            <FileText className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Doctor Report</h2>
            <p className="text-sm text-white/50">Generate comprehensive health reports</p>
          </div>
        </div>
        <Badge className="bg-teal-500/15 text-teal-400 border border-teal-500/20 px-4 py-2 rounded-full self-start sm:self-auto">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Report
        </Badge>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-white/60" />
          <span className="text-white font-medium">Report Date Range</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                dateRange === option.value
                  ? 'bg-white/[0.12] text-white border border-white/[0.15]'
                  : 'bg-white/[0.04] text-white/60 border border-transparent hover:bg-white/[0.08]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Summary Card */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/15 rounded-xl">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Patient Summary</h3>
        </div>
        {patientProfile || medicalId ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            <div>
              <p className="text-white/40 text-sm mb-1">Name</p>
              <p className="text-white font-medium">{patientProfile?.name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">Age</p>
              <p className="text-white font-medium">{patientProfile?.age ? `${patientProfile.age} years` : 'Not provided'}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">Gender</p>
              <p className="text-white font-medium capitalize">{patientProfile?.gender || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">Blood Type</p>
              <p className="text-white font-medium">{medicalId?.bloodType || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">Allergies</p>
              <p className="text-white font-medium">
                {medicalId?.allergies?.length ? medicalId.allergies.join(', ') : 'None reported'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No patient information available</p>
            <p className="text-white/30 text-sm mt-1">Add patient profile to see information here</p>
          </div>
        )}
      </div>

      {/* Vital Signs Summary */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-rose-500/15 rounded-xl">
            <Activity className="w-5 h-5 text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Vital Signs Summary</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Blood Pressure */}
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="text-white/50 text-xs">Blood Pressure</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {bpStats ? `${bpStats.latest.systolic}/${bpStats.latest.diastolic}` : '--/--'}
            </div>
            <p className="text-white/40 text-xs mt-1">mmHg (latest)</p>
            {bpStats && (
              <p className="text-teal-400/80 text-xs mt-2">
                Avg: {bpStats.avgSystolic}/{bpStats.avgDiastolic}
              </p>
            )}
          </div>

          {/* Glucose */}
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplet className="w-4 h-4 text-emerald-400" />
              <span className="text-white/50 text-xs">Glucose</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {glucoseStats?.latest?.fasting || glucoseStats?.latest?.postMeal || '--'}
            </div>
            <p className="text-white/40 text-xs mt-1">mg/dL (latest)</p>
            {glucoseStats?.avgFasting && (
              <p className="text-teal-400/80 text-xs mt-2">
                Avg: {glucoseStats.avgFasting}
              </p>
            )}
          </div>

          {/* Heart Rate */}
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-violet-400" />
              <span className="text-white/50 text-xs">Heart Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {healthReadings?.heartRate || '--'}
            </div>
            <p className="text-white/40 text-xs mt-1">bpm</p>
          </div>

          {/* Temperature */}
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span className="text-white/50 text-xs">Temperature</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {healthReadings?.temperature || '--'}
            </div>
            <p className="text-white/40 text-xs mt-1">°F</p>
          </div>

          {/* SpO2 */}
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-white/50 text-xs">SpO2</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {healthReadings?.spO2 || '--'}
            </div>
            <p className="text-white/40 text-xs mt-1">%</p>
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      {(bpChartData.length > 0 || glucoseChartData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BP Trend */}
          {bpChartData.length > 0 && (
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-rose-400" />
                <h3 className="text-white font-medium">Blood Pressure Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={bpChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 10 }} />
                  <YAxis domain={[60, 180]} stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 10, 15, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
                  <Line type="monotone" dataKey="diastolic" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Glucose Trend */}
          {glucoseChartData.length > 0 && (
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-medium">Glucose Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={glucoseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 10 }} />
                  <YAxis domain={[50, 300]} stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 10, 15, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="fasting" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Fasting" />
                  <Line type="monotone" dataKey="postMeal" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Post-Meal" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Medications & Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medications */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-500/15 rounded-xl">
              <Pill className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Medications</h3>
          </div>
          {medicalId?.medications?.length ? (
            <div className="flex flex-wrap gap-2">
              {medicalId.medications.map((med, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full text-sm"
                >
                  {med}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Pill className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">No medications recorded</p>
            </div>
          )}
        </div>

        {/* Conditions */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/15 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Medical Conditions</h3>
          </div>
          {medicalId?.conditions?.length ? (
            <div className="flex flex-wrap gap-2">
              {medicalId.conditions.map((cond, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-sm"
                >
                  {cond}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">No conditions recorded</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/15 rounded-xl">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI Clinical Summary</h3>
              <p className="text-white/40 text-sm">Powered by Gemini AI</p>
            </div>
          </div>
          <Button
            onClick={generateAISummary}
            disabled={isGeneratingAI || !hasAnyData}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 h-auto disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
        {aiError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4">
            <p className="text-rose-400 text-sm">{aiError}</p>
          </div>
        )}
        {aiSummary ? (
          <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">Click "Generate Summary" to create an AI-powered clinical summary</p>
            {!import.meta.env.VITE_GEMINI_API_KEY && (
              <p className="text-amber-400/80 text-sm mt-2">Note: Gemini API key not configured</p>
            )}
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/15 rounded-xl">
            <FileDown className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Export & Share</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleCopyToClipboard}
            variant="ghost"
            className="bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl px-5 py-3 h-auto"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="ghost"
            className="bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl px-5 py-3 h-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={handleShareEmail}
            variant="ghost"
            className="bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl px-5 py-3 h-auto"
          >
            <Mail className="w-4 h-4 mr-2" />
            Share via Email
          </Button>
          <Button
            onClick={handlePrint}
            variant="ghost"
            className="bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl px-5 py-3 h-auto"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {!hasAnyData && (
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-teal-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-teal-400/60" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">No Health Data Available</h3>
          <p className="text-white/50 max-w-md mx-auto">
            Start tracking your health metrics to generate comprehensive reports for your physician.
            Add blood pressure readings, glucose levels, and update your patient profile.
          </p>
        </div>
      )}
    </div>
  );
};

