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
      <div className="min-h-screen flex flex-col">
        <GlassNavbar />
        <div className="pt-24 pb-20 px-3 sm:px-4 flex-1 overflow-x-hidden">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header skeleton */}
            <div className="text-center space-y-4 animate-pulse">
              <div className="h-10 bg-white/10 rounded-lg w-64 mx-auto" />
              <div className="h-5 bg-white/5 rounded w-96 mx-auto" />
            </div>
            {/* Filter bar skeleton */}
            <div className="h-14 bg-white/5 rounded-xl" />
            {/* Report cards skeleton */}
            <div className="space-y-4">
              <CardSkeleton />
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
    <div className="min-h-screen flex flex-col">
      <GlassNavbar />

      <div className="pt-24 pb-20 px-3 sm:px-4 flex-1 overflow-x-hidden">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="text-center space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Health Reports
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              View and generate comprehensive health reports
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-full text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {reports.length} Total Report{reports.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Filter Controls Bar */}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {/* Filter Pills Row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-sm text-white/50 mr-1">Filter:</span>
              
              {/* Report Type Pills */}
              {[
                { key: 'all' as ReportFilter, label: 'All' },
                { key: 'lab-results' as ReportFilter, label: 'Lab Results' },
                { key: 'bp-reports' as ReportFilter, label: 'BP Reports' },
                { key: 'health-score' as ReportFilter, label: 'Health Score' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`
                    px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                    ${activeFilter === key 
                      ? 'bg-white/[0.10] border-white/[0.15] text-white' 
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-white/70 hover:text-white'
                    }
                    border
                  `}
                >
                  {label}
                </button>
              ))}

              <div className="flex-1" />

              {/* Date Range Selector */}
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-full p-1 border border-white/[0.06]">
                {[
                  { key: '7days' as DateRangeFilter, label: '7 days' },
                  { key: '30days' as DateRangeFilter, label: '30 days' },
                  { key: 'all' as DateRangeFilter, label: 'All time' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setDateRange(key)}
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                      ${dateRange === key 
                        ? 'bg-white/[0.10] text-white' 
                        : 'text-white/50 hover:text-white/70'
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
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reports by test name, date, or interpretation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-white placeholder-white/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                <span className="text-sm text-white/50">
                  Showing {filteredReports.length} of {reports.length} reports
                </span>
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            /* Empty State */
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-12 text-center animate-scale-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal-500/20 border border-teal-500/30 mb-6">
                <FileText className="w-10 h-10 text-teal-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">
                {reports.length === 0 ? 'No Reports Yet' : 'No Matching Reports'}
              </h3>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                {reports.length === 0
                  ? 'Start by taking your first health assessment to generate your personalized health report.'
                  : 'Try adjusting your search or filter criteria to find the reports you\'re looking for.'}
              </p>
              {reports.length === 0 ? (
                <Link to="/labs">
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-teal-500/20">
                    <Plus className="w-5 h-5 mr-2" />
                    Generate Your First Report
                  </Button>
                </Link>
              ) : (
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-white font-medium transition-all"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report, index) => {
                const isExpanded = expandedReports.has(report.id);
                const isGenerating = generatingReport === report.id;
                
                return (
                  <div
                    key={report.id}
                    className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl overflow-hidden animate-fade-in-up hover:bg-white/[0.06] transition-all duration-300"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Report Card Header */}
                    <div 
                      className="p-5 cursor-pointer"
                      onClick={() => toggleExpand(report.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Left: Icon + Info */}
                        <div className="flex items-start gap-4 flex-1">
                          {/* Category Icon */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(report.category)}`}>
                            {getCategoryIcon(report.category)}
                          </div>
                          
                          {/* Report Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white mb-1 truncate">
                              {getTestTypeLabel(report.testType)}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {formatDate(report.testDate)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {formatTime(report.testDate)}
                              </span>
                              {report.duration && (
                                <span className="text-white/40">
                                  Duration: {formatDuration(report.duration)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Status + Expand */}
                        <div className="flex items-center gap-3">
                          {/* Risk Level Badge */}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeClass(report.riskLevel)}`}>
                            {report.riskLevel || 'N/A'}
                          </span>
                          
                          {/* Expand Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(report.id);
                            }}
                            className="p-2 rounded-lg hover:bg-white/[0.08] text-white/50 hover:text-white transition-all"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-white/[0.06] pt-4">
                        {/* Score and Performance */}
                        {(report.score !== undefined || report.scorePercentage !== undefined) && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {report.score !== undefined && (
                              <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                                <div className="text-sm text-white/50 mb-1">Score</div>
                                <div className="text-2xl font-bold text-white">
                                  {report.score}
                                  {report.maxScore && <span className="text-white/40 text-lg"> / {report.maxScore}</span>}
                                </div>
                              </div>
                            )}
                            {report.scorePercentage !== undefined && (
                              <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                                <div className="text-sm text-white/50 mb-1">Performance</div>
                                <div className="text-2xl font-bold text-white">
                                  {Math.round(report.scorePercentage)}%
                                </div>
                                <div className="h-1.5 bg-white/[0.08] rounded-full mt-2 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                                    style={{ width: `${report.scorePercentage}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {report.status && (
                              <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                                <div className="text-sm text-white/50 mb-1">Status</div>
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                                  report.status === 'final' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-white/10 text-white/60'
                                }`}>
                                  {report.status}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interpretation */}
                        {report.interpretation && (
                          <div className="bg-blue-500/10 rounded-xl p-4 border-l-4 border-blue-500">
                            <div className="flex items-start gap-2 mb-2">
                              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                              <h4 className="font-semibold text-white">Interpretation</h4>
                            </div>
                            <p className="text-white/70 ml-7">{report.interpretation}</p>
                          </div>
                        )}

                        {/* Recommendations */}
                        {report.recommendations && report.recommendations.length > 0 && (
                          <div className="bg-green-500/10 rounded-xl p-4 border-l-4 border-green-500">
                            <div className="flex items-start gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <h4 className="font-semibold text-white">Recommendations</h4>
                            </div>
                            <ul className="space-y-1 ml-7">
                              {report.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-white/70 flex items-start gap-2">
                                  <span className="text-green-400 mt-1">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Raw Data (Collapsible) */}
                        <details className="bg-white/[0.04] rounded-xl border border-white/[0.06] overflow-hidden">
                          <summary className="cursor-pointer px-4 py-3 font-medium text-white hover:bg-white/[0.04] transition-all">
                            View Raw Data
                          </summary>
                          <pre className="p-4 bg-black/30 text-xs overflow-x-auto border-t border-white/[0.06] text-white/60">
                            {JSON.stringify(report.data, null, 2)}
                          </pre>
                        </details>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/[0.06]">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReportForChat(report);
                              setChatOpen(true);
                            }}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat with AI
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleGeneratePDF(report)}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/20"
                          >
                            {isGenerating ? (
                              <>
                                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4 mr-2" />
                                Download PDF
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(report)}
                            className="bg-white/[0.04] border-white/[0.10] text-white/70 hover:bg-white/[0.08] hover:text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            JSON
                          </Button>
                          
                          <div className="flex-1" />

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(report.id)}
                            className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
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
            <div className="bg-teal-500/10 backdrop-blur-sm border border-teal-500/20 rounded-2xl p-6 text-center animate-fade-in-up">
              <h3 className="text-lg font-semibold text-white mb-2">Need More Tests?</h3>
              <p className="text-white/50 mb-4">Take additional health assessments to get a complete picture of your health.</p>
              <Link to="/labs">
                <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-teal-500/20">
                  <Plus className="w-5 h-5 mr-2" />
                  Take New Assessment
                </Button>
              </Link>
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
