/**
 * PCOS Risk Detector Component
 * AI-powered PCOS screening and risk detection
 */

import React, { useState, useEffect } from 'react';
import {
  calculatePCOSRisk,
  generatePCOSReport,
  getHormonalData,
} from '@/services/hormonalHealthService';
import { getCycleData } from '@/services/periodTrackerService';
import {
  PCOSRiskAssessment,
  PCOSIndicator,
  RiskLevel,
} from '@/types/hormonal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Copy,
  Activity,
  Info,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// PCOS Indicators educational content
const PCOS_INDICATORS_INFO = [
  {
    name: 'Long menstrual cycles (>35 days)',
    description: 'Cycles longer than 35 days may indicate irregular ovulation, a common sign of PCOS.',
  },
  {
    name: 'Short menstrual cycles (<21 days)',
    description: 'Very short cycles can also indicate hormonal imbalances associated with PCOS.',
  },
  {
    name: 'Irregular cycle length (variance >7 days)',
    description: 'High variability in cycle length suggests hormonal dysregulation.',
  },
  {
    name: 'Persistent acne (possible androgen excess)',
    description: 'Hormonal acne, especially along the jawline, can indicate elevated androgen levels.',
  },
  {
    name: 'Chronic fatigue (low energy logged frequently)',
    description: 'Persistent fatigue may be related to insulin resistance common in PCOS.',
  },
  {
    name: 'Persistent bloating',
    description: 'Ongoing bloating can be a symptom of hormonal imbalance and metabolic issues.',
  },
  {
    name: 'Non-cyclical mood instability',
    description: 'Mood changes outside the typical luteal phase may indicate hormonal disruption.',
  },
  {
    name: 'Weight concerns mentioned',
    description: 'Difficulty managing weight is a common PCOS symptom due to metabolic factors.',
  },
  {
    name: 'Hair-related concerns',
    description: 'Changes in hair growth or loss can indicate androgen excess.',
  },
];

const PCOSRiskDetector: React.FC = () => {
  const [assessment, setAssessment] = useState<PCOSRiskAssessment | null>(null);
  const [cyclesLogged, setCyclesLogged] = useState<number>(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cycleData = getCycleData();
    const hormonalData = getHormonalData();
    
    // Count cycles with logged data
    const sortedLogs = [...cycleData.logs].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    let cycleCount = 0;
    if (sortedLogs.length >= 2) {
      for (let i = 1; i < sortedLogs.length; i++) {
        const prevStart = new Date(sortedLogs[i - 1].startDate);
        const currStart = new Date(sortedLogs[i].startDate);
        const cycleLength = Math.round(
          (currStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (cycleLength >= 21 && cycleLength <= 90) {
          cycleCount++;
        }
      }
    }
    
    setCyclesLogged(cycleCount + (sortedLogs.length > 0 ? 1 : 0));
    
    // Only calculate PCOS risk if we have enough data
    if (cycleCount >= 2 || hormonalData.dailyLogs.length >= 14) {
      const pcosAssessment = calculatePCOSRisk();
      setAssessment(pcosAssessment);
    }
  };

  const getRiskLevelColor = (level: RiskLevel): string => {
    switch (level) {
      case 'low':
        return 'text-emerald-400';
      case 'moderate':
        return 'text-amber-400';
      case 'high':
        return 'text-orange-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-white/60';
    }
  };

  const getRiskLevelBg = (level: RiskLevel): string => {
    switch (level) {
      case 'low':
        return 'bg-emerald-500/20 border-emerald-500/30';
      case 'moderate':
        return 'bg-amber-500/20 border-amber-500/30';
      case 'high':
        return 'bg-orange-500/20 border-orange-500/30';
      case 'critical':
        return 'bg-red-500/20 border-red-500/30';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score <= 2) return '#10b981'; // green
    if (score <= 4) return '#f59e0b'; // yellow
    if (score <= 6) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getScoreLabel = (score: number): string => {
    if (score <= 2) return 'Low Risk';
    if (score <= 4) return 'Moderate Risk';
    if (score <= 6) return 'High Risk';
    return 'Critical Risk';
  };

  // SVG Gauge Component
  const RiskGauge: React.FC<{ score: number; maxScore: number }> = ({ score, maxScore }) => {
    const radius = 80;
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / maxScore) * circumference * 0.75; // 75% of circle
    const color = getScoreColor(score);

    return (
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-[135deg]"
        >
          {/* Background arc */}
          <circle
            stroke="rgba(255,255,255,0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress arc */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white">{score}</span>
          <span className="text-sm text-white/50">/ {maxScore}</span>
          <span className="text-xs font-medium mt-1" style={{ color }}>
            {getScoreLabel(score)}
          </span>
        </div>
      </div>
    );
  };

  const handleGenerateReport = () => {
    const report = generatePCOSReport();
    setReportContent(report);
    setReportDialogOpen(true);
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Minimum data guard
  if (cyclesLogged < 3) {
    const progress = (cyclesLogged / 3) * 100;
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white">PCOS Risk Detector</h2>
              <p className="text-xs sm:text-sm text-white/50">AI-powered screening for PCOS indicators</p>
            </div>
          </div>
        </div>

        {/* Minimum Data Guard */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 text-center space-y-6">
          <div className="p-4 bg-purple-500/10 rounded-2xl w-fit mx-auto">
            <Activity className="w-12 h-12 text-purple-400/60" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Building Your Profile</h3>
            <p className="text-white/60 max-w-md mx-auto">
              PCOS screening requires at least 3 complete menstrual cycles for accurate analysis.
            </p>
          </div>
          
          <div className="max-w-sm mx-auto space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Progress</span>
              <span className="text-white font-medium">{cyclesLogged} of 3 cycles</span>
            </div>
            <Progress value={progress} className="h-3 bg-white/10" />
            <p className="text-sm text-white/50">
              {cyclesLogged === 0 
                ? "Start by logging your period dates in the Period Tracker."
                : cyclesLogged === 1
                ? "Great start! Log 2 more cycles to enable screening."
                : "Almost there! Log 1 more cycle to enable PCOS screening."
              }
            </p>
          </div>
        </div>

        {/* Educational Section */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-400" />
              What is PCOS?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/70">
              Polycystic Ovary Syndrome (PCOS) is a common hormonal disorder affecting 1 in 10 women of reproductive age. 
              It is characterized by hormonal imbalances that can affect menstrual cycles, fertility, and metabolism.
            </p>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="indicators" className="border-white/10">
                <AccordionTrigger className="text-white hover:text-purple-400">
                  The 9 PCOS Indicators We Monitor
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3 pt-2">
                    {PCOS_INDICATORS_INFO.map((indicator, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-white/70">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-medium text-white">{indicator.name}</span>
                          <p className="text-sm text-white/50">{indicator.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="why-early" className="border-white/10">
                <AccordionTrigger className="text-white hover:text-purple-400">
                  Why Early Detection Matters
                </AccordionTrigger>
                <AccordionContent className="text-white/70">
                  Early detection of PCOS can help prevent long-term complications such as type 2 diabetes, 
                  cardiovascular disease, and fertility issues. With proper management including lifestyle changes 
                  and medical treatment when needed, most women with PCOS can lead healthy lives and achieve 
                  their fertility goals.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Medical Disclaimer */}
        <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-amber-300 font-semibold mb-1">Medical Disclaimer</h3>
              <p className="text-amber-200/70 text-sm">
                This screening tool identifies potential risk patterns. It is not a diagnosis. 
                Please consult a gynecologist for proper evaluation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">PCOS Risk Detector</h2>
            <p className="text-xs sm:text-sm text-white/50">AI-powered screening for PCOS indicators</p>
          </div>
        </div>
        <Button
          onClick={handleGenerateReport}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 h-auto text-sm sm:text-base w-full sm:w-auto"
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Doctor Report
        </Button>
      </div>

      {/* Risk Level Banner */}
      <div className={`rounded-2xl p-6 border ${getRiskLevelBg(assessment.riskLevel)}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${getRiskLevelBg(assessment.riskLevel)}`}>
            <AlertTriangle className={`w-6 h-6 ${getRiskLevelColor(assessment.riskLevel)}`} />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <span className="text-white/60 text-sm">Overall Risk Level:</span>
              <Badge 
                variant="outline" 
                className={`${getRiskLevelColor(assessment.riskLevel)} border-current capitalize`}
              >
                {assessment.riskLevel}
              </Badge>
            </div>
            <p className="text-white/80">{assessment.recommendation}</p>
            <p className="text-white/50 text-sm mt-2">
              Based on {assessment.cyclesAnalyzed} cycles analyzed • Last updated: {format(parseISO(assessment.generatedAt), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Risk Score Gauge & Indicators Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score Gauge */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white text-lg">Risk Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <RiskGauge score={assessment.score} maxScore={assessment.totalIndicators} />
            <div className="mt-6 grid grid-cols-2 gap-3 w-full">
              <div className="text-center p-3 bg-white/[0.04] rounded-xl">
                <span className="text-2xl font-bold text-white">{assessment.score}</span>
                <p className="text-xs text-white/50">Indicators Detected</p>
              </div>
              <div className="text-center p-3 bg-white/[0.04] rounded-xl">
                <span className="text-2xl font-bold text-white">{assessment.cyclesAnalyzed}</span>
                <p className="text-xs text-white/50">Cycles Analyzed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indicators List */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg">PCOS Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {assessment.indicators.map((indicator, idx) => (
                <IndicatorCard key={idx} indicator={indicator} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Educational Section */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-purple-400" />
            Understanding PCOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-is" className="border-white/10">
              <AccordionTrigger className="text-white hover:text-purple-400">
                What is PCOS?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                Polycystic Ovary Syndrome (PCOS) is a common hormonal disorder affecting 1 in 10 women 
                of reproductive age. It involves elevated androgens (male hormones), irregular ovulation, 
                and sometimes multiple small cysts on the ovaries. PCOS can affect menstrual cycles, 
                fertility, and metabolism.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="indicators" className="border-white/10">
              <AccordionTrigger className="text-white hover:text-purple-400">
                The 9 PCOS Indicators We Monitor
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 pt-2">
                  {PCOS_INDICATORS_INFO.map((indicator, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white/70">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        assessment.indicators[idx]?.detected 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {assessment.indicators[idx]?.detected ? '!' : '✓'}
                      </span>
                      <div>
                        <span className="font-medium text-white">{indicator.name}</span>
                        <p className="text-sm text-white/50">{indicator.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="why-early" className="border-white/10">
              <AccordionTrigger className="text-white hover:text-purple-400">
                Why Early Detection Matters
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                Early detection of PCOS can help prevent long-term complications such as type 2 diabetes, 
                cardiovascular disease, and fertility issues. With proper management including lifestyle changes 
                (diet, exercise) and medical treatment when needed, most women with PCOS can lead healthy lives 
                and achieve their fertility goals. Regular monitoring and early intervention are key.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Medical Disclaimer */}
      <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-xl bg-amber-500/20">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-amber-300 font-semibold mb-1">Medical Disclaimer</h3>
            <p className="text-amber-200/70 text-sm">
              This screening tool identifies potential risk patterns based on your logged data. 
              It is not a medical diagnosis. Please consult a gynecologist or endocrinologist 
              for proper evaluation and diagnosis.
            </p>
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              PCOS Risk Assessment Report
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
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
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

// Individual Indicator Card Component
const IndicatorCard: React.FC<{ indicator: PCOSIndicator }> = ({ indicator }) => {
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      indicator.detected 
        ? 'bg-red-500/10 border-red-500/20' 
        : 'bg-emerald-500/5 border-emerald-500/10'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${indicator.detected ? 'text-red-400' : 'text-emerald-400'}`}>
          {indicator.detected ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white text-sm">{indicator.name}</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                indicator.detected 
                  ? 'text-red-400 border-red-400/30' 
                  : 'text-emerald-400 border-emerald-400/30'
              }`}
            >
              {indicator.detected ? 'Detected' : 'Not Detected'}
            </Badge>
          </div>
          <p className="text-xs text-white/60">{indicator.evidence}</p>
          {indicator.dates && indicator.dates.length > 0 && (
            <p className="text-xs text-white/40 mt-2">
              Dates: {indicator.dates.map(d => format(parseISO(d), 'MMM dd')).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PCOSRiskDetector;
