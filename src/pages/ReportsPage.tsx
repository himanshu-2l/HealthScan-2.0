/**
 * Reports Page
 * Displays all past health test reports stored locally
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { ChatBot } from '@/components/ChatBot';
import { CardSkeleton } from '@/components/LoadingState';
import {
  FileText,
  Calendar,
  Download,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Brain,
  Heart,
  Wind,
  Smile,
  Eye,
  Leaf,
  Trash2,
  Sparkles,
  Plus
} from 'lucide-react';
import { getAllResults, deleteTestResult } from '@/services/healthDataService';
import { generateDiagnosticPDF } from '@/services/pdfReportService';
import { HealthTestResult, TestCategory, TestType } from '../types/health';

// Filter types for reports
type ReportFilter = 'all' | 'lab-results' | 'bp-reports' | 'health-score';
type DateRangeFilter = '7days' | '30days' | 'all';

export default function ReportsPage() {
  const [reports, setReports] = useState<HealthTestResult[]>([]);
  const [filteredReports, setFilteredReports] = useState<HealthTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | 'all'>('all');
  const [selectedTestType, setSelectedTestType] = useState<TestType | 'all'>('all');
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedReportForChat, setSelectedReportForChat] = useState<HealthTestResult | null>(null);
  
  // New filter states
  const [activeFilter, setActiveFilter] = useState<ReportFilter>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, selectedCategory, selectedTestType, activeFilter, dateRange]);

  const loadReports = () => {
    try {
      const allReports = getAllResults();
      setReports(allReports);
      setFilteredReports(allReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = dateRange === '7days' ? 7 : 30;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(report => new Date(report.testDate) >= cutoffDate);
    }

    // Filter by report type pill
    if (activeFilter !== 'all') {
      if (activeFilter === 'lab-results') {
        filtered = filtered.filter(report => 
          report.category === 'neurological' || 
          report.category === 'vision-hearing'
        );
      } else if (activeFilter === 'bp-reports') {
        filtered = filtered.filter(report => 
          report.testType === 'blood-pressure-check' || 
          report.category === 'cardiovascular'
        );
      } else if (activeFilter === 'health-score') {
        filtered = filtered.filter(report => 
          report.scorePercentage !== undefined
        );
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        getTestTypeLabel(report.testType).toLowerCase().includes(query) ||
        report.interpretation?.toLowerCase().includes(query) ||
        report.testDate.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(report => report.category === selectedCategory);
    }

    // Filter by test type
    if (selectedTestType !== 'all') {
      filtered = filtered.filter(report => report.testType === selectedTestType);
    }

    setFilteredReports(filtered);
  };

  const getTestTypeLabel = (testType: TestType): string => {
    const labels: Record<TestType, string> = {
      'digit-span': 'Digit Span Recall',
      'word-list-recall': 'Word List Memory Test',
      'saccade': 'Saccadic Eye Movement',
      'stroop': 'Stroop Color-Word Test',
      'alzheimers': 'Alzheimer\'s Risk Screen',
      'parkinsons': 'Parkinson\'s Assessment',
      'epilepsy': 'Epilepsy Marker Check',
      'cognitive': 'Cognitive Function Test',
      'neuro-assessment': 'Neurological Assessment',
      'voice': 'Vocal Biomarker Analysis',
      'eye': 'Visual Reflex Test',
      'motor': 'Fine Motor Control Test',
      'blood-pressure-check': 'Blood Pressure Check',
      'cardiovascular-test': 'Cardiovascular Assessment',
      'heart-rate-test': 'Heart Rate Analysis',
      'respiratory-test': 'Respiratory Efficiency',
      'mental-health-assessment': 'Mental Wellbeing Scan',
      'vision-test': 'Acuity & Vision Test',
      'hearing-test': 'Auditory Response Test',
      'lifestyle-survey': 'Health Habits Survey',
    };
    return labels[testType] || testType;
  };

  const getCategoryLabel = (category: TestCategory): string => {
    const labels: Record<TestCategory, string> = {
      'neurological': 'Neurological',
      'cardiovascular': 'Cardiovascular',
      'respiratory': 'Respiratory',
      'mental-health': 'Mental Health',
      'vision-hearing': 'Vision & Hearing',
      'lifestyle': 'Lifestyle',
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: TestCategory) => {
    const iconClass = "w-5 h-5";
    switch (category) {
      case 'neurological': return <Brain className={iconClass} />;
      case 'cardiovascular': return <Heart className={iconClass} />;
      case 'respiratory': return <Wind className={iconClass} />;
      case 'mental-health': return <Smile className={iconClass} />;
      case 'vision-hearing': return <Eye className={iconClass} />;
      case 'lifestyle': return <Leaf className={iconClass} />;
      default: return <Activity className={iconClass} />;
    }
  };

  const getCategoryColor = (category: TestCategory): string => {
    switch (category) {
      case 'neurological': return 'bg-purple-500/20 text-purple-400';
      case 'cardiovascular': return 'bg-red-500/20 text-red-400';
      case 'respiratory': return 'bg-cyan-500/20 text-cyan-400';
      case 'mental-health': return 'bg-pink-500/20 text-pink-400';
      case 'vision-hearing': return 'bg-blue-500/20 text-blue-400';
      case 'lifestyle': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusBadgeClass = (risk?: string): string => {
    if (!risk) return 'status-badge-info';
    switch (risk.toLowerCase()) {
      case 'low': return 'status-badge-good';
      case 'medium': return 'status-badge-warning';
      case 'high': 
      case 'critical': return 'status-badge-danger';
      default: return 'status-badge-info';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration?: number): string => {
    if (!duration) return 'N/A';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const toggleExpand = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  const handleDelete = (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      const success = deleteTestResult(reportId);
      if (success) {
        loadReports();
      }
    }
  };

  const handleGeneratePDF = async (report: HealthTestResult) => {
    setGeneratingReport(report.id);
    try {
      await generateDiagnosticPDF(report);
    } finally {
      setGeneratingReport(null);
    }
  };

  const downloadReport = (report: HealthTestResult) => {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-report-${report.testType}-${report.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTestType('all');
    setActiveFilter('all');
    setDateRange('all');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedTestType !== 'all' || activeFilter !== 'all' || dateRange !== 'all';

  const categories: TestCategory[] = ['neurological', 'cardiovascular', 'respiratory', 'mental-health', 'vision-hearing', 'lifestyle'];
  const testTypes: TestType[] = Array.from(new Set(reports.map(r => r.testType)));

  // Loading State with CardSkeleton
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <GlassNavbar />
        <div className="pt-24 pb-20 px-3 sm:px-4 flex-1 overflow-x-hidden">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header skeleton */}
            <div className="text-center space-y-3 animate-pulse">
              <div className="h-8 bg-slate-200 dark:bg-white/10 rounded-lg w-64 mx-auto" />
              <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-80 mx-auto" />
            </div>
            {/* Filter bar skeleton */}
            <div className="h-14 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/10" />
            {/* Report cards skeleton */}
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <GlassNavbar />

      <div className="pt-24 pb-20 px-3 sm:px-4 flex-1 overflow-x-hidden">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="text-center space-y-2 animate-fade-in-up">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/30 text-teal-600 dark:text-teal-400">
                <FileText className="w-7 h-7" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Diagnostic Health Records
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Review and export your comprehensive medical screening history
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/30">
                {reports.length} Total Report{reports.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Filter Controls Bar */}
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 space-y-4">
            {/* Filter Pills Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
              
              {/* Report Type Pills */}
              {[
                { key: 'all' as ReportFilter, label: 'All Records' },
                { key: 'lab-results' as ReportFilter, label: 'Lab Screenings' },
                { key: 'bp-reports' as ReportFilter, label: 'BP Diagnostics' },
                { key: 'health-score' as ReportFilter, label: 'Health Score' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`
                    px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                    ${activeFilter === key 
                      ? 'bg-teal-600 text-white shadow-sm' 
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5'
                    }
                  `}
                >
                  {label}
                </button>
              ))}

              <div className="flex-1" />

              {/* Date Range Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] rounded-full p-1 border border-slate-200/60 dark:border-white/5">
                {[
                  { key: '7days' as DateRangeFilter, label: '7d' },
                  { key: '30days' as DateRangeFilter, label: '30d' },
                  { key: 'all' as DateRangeFilter, label: 'All' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setDateRange(key)}
                    className={`
                      px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200
                      ${dateRange === key 
                        ? 'bg-teal-600 text-white shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search reports by test name, date, or clinical finding..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 text-xs sm:text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-white/10">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {filteredReports.length} of {reports.length} reports
                </span>
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-10 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {reports.length === 0 ? 'No Reports Generated Yet' : 'No Matching Reports Found'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mb-6 max-w-md mx-auto">
                {reports.length === 0
                  ? 'Perform a diagnostic assessment in any of our Health Labs to generate your first clinical report.'
                  : 'Try adjusting your search criteria or resetting filters to find records.'}
              </p>
              {reports.length === 0 ? (
                <Link to="/labs">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm text-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Enter Health Labs
                  </Button>
                </Link>
              ) : (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredReports.map((report, index) => {
                const isExpanded = expandedReports.has(report.id);
                const isGenerating = generatingReport === report.id;
                
                return (
                  <div
                    key={report.id}
                    className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden hover:border-teal-400/50 transition-all duration-300"
                  >
                    {/* Report Card Header */}
                    <div 
                      className="p-4 sm:p-5 cursor-pointer"
                      onClick={() => toggleExpand(report.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Left: Icon + Info */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Category Icon */}
                          <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${getCategoryColor(report.category)}`}>
                            {getCategoryIcon(report.category)}
                          </div>
                          
                          {/* Report Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">
                              {getTestTypeLabel(report.testType)}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(report.testDate)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {formatTime(report.testDate)}
                              </span>
                              {report.duration && (
                                <span className="opacity-80">
                                  Duration: {formatDuration(report.duration)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Status + Expand */}
                        <div className="flex items-center gap-2.5">
                          {/* Risk Level Badge */}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadgeClass(report.riskLevel)}`}>
                            {report.riskLevel || 'N/A'}
                          </span>
                          
                          {/* Expand Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(report.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-slate-200/80 dark:border-white/5 pt-4">
                        {/* Score and Performance */}
                        {(report.score !== undefined || report.scorePercentage !== undefined) && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {report.score !== undefined && (
                              <div className="bg-slate-50 dark:bg-white/[0.02] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10">
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Raw Score</div>
                                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                  {report.score}
                                  {report.maxScore && <span className="text-slate-500 text-sm font-normal"> / {report.maxScore}</span>}
                                </div>
                              </div>
                            )}
                            {report.scorePercentage !== undefined && (
                              <div className="bg-slate-50 dark:bg-white/[0.02] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10">
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Index Performance</div>
                                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                  {Math.round(report.scorePercentage)}%
                                </div>
                                <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all"
                                    style={{ width: `${report.scorePercentage}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {report.status && (
                              <div className="bg-slate-50 dark:bg-white/[0.02] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10">
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Diagnostic Status</div>
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/30 capitalize">
                                  {report.status}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interpretation */}
                        {report.interpretation && (
                          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200/60 dark:border-blue-800/30">
                            <div className="flex items-start gap-2 mb-1.5">
                              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Clinical Interpretation</h4>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed ml-6">{report.interpretation}</p>
                          </div>
                        )}

                        {/* Recommendations */}
                        {report.recommendations && report.recommendations.length > 0 && (
                          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200/60 dark:border-emerald-800/30">
                            <div className="flex items-start gap-2 mb-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Clinical Recommendations</h4>
                            </div>
                            <ul className="space-y-1 ml-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                              {report.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Raw Data (Collapsible) */}
                        <details className="bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden text-xs">
                          <summary className="cursor-pointer px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all">
                            View Raw Telemetry Payload
                          </summary>
                          <pre className="p-4 bg-slate-100 dark:bg-black/30 text-xs overflow-x-auto border-t border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-300">
                            {JSON.stringify(report.data, null, 2)}
                          </pre>
                        </details>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/10">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReportForChat(report);
                              setChatOpen(true);
                            }}
                            className="bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/30 rounded-xl text-xs font-semibold h-8"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                            Consult HealthScan AI
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleGeneratePDF(report)}
                            disabled={isGenerating}
                            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold h-8 shadow-sm"
                          >
                            {isGenerating ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                Download PDF
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(report)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold h-8"
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            JSON Payload
                          </Button>
                          
                          <div className="flex-1" />

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(report.id)}
                            className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/30 rounded-xl text-xs font-semibold h-8"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Generate Report CTA (if reports exist) */}
          {reports.length > 0 && (
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Need Additional Biomarker Screening?</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto">Take additional computer-vision health lab assessments to complete your profile.</p>
              <div className="pt-2">
                <Link to="/labs">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm text-xs sm:text-sm">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Enter Health Labs
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <SiteFooter />

      {/* ChatBot with Report Context */}
      <ChatBot
        isOpen={chatOpen}
        onClose={() => {
          setChatOpen(false);
          setSelectedReportForChat(null);
        }}
        reportContext={selectedReportForChat || undefined}
      />
    </div>
  );
}
