/**
 * Cardiovascular Lab Component
 * Camera-based heart rate detection, HRV analysis, and cardiovascular risk assessment
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Camera, Play, Square, Activity, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { pulseDetector } from '@/utils/pulseDetection';
import { calculateHRV, estimateBloodPressure, calculateCardiovascularRisk } from '@/utils/hrvAnalysis';
import { saveTestResult, generateTestResultId } from '@/services/healthDataService';
import { HealthTestResult } from '@/types/health';

interface CardiovascularResults {
  timestamp: string;
  heartRate: number;
  hrvMetrics: ReturnType<typeof calculateHRV>;
  estimatedBP: { systolic: number; diastolic: number; confidence: number };
  riskAssessment: ReturnType<typeof calculateCardiovascularRisk>;
  testDuration: number;
  confidence: number;
}

export const CardiovascularLab: React.FC = () => {
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [testDuration, setTestDuration] = useState(0);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [status, setStatus] = useState('Click "Enable Camera" to begin cardiovascular assessment');
  const [results, setResults] = useState<CardiovascularResults | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const rrIntervalsRef = useRef<number[]>([]);
  const lastBeatTimeRef = useRef<number | null>(null);
  const [age, setAge] = useState<number>(35);

  useEffect(() => {
    return () => {
      pulseDetector.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initCamera = async () => {
    try {
      setStatus('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPermission('granted');
        setStatus('Camera enabled. Position your face in the frame and click "Start Test".');

        // Initialize pulse detector
        if (canvasRef.current) {
          pulseDetector.initialize(videoRef.current, canvasRef.current);
        }
      }
    } catch (error) {
      setPermission('denied');
      setStatus('Camera access denied. Please allow camera access to use this lab.');
      console.error('Camera error:', error);
    }
  };

  const startTest = () => {
    if (permission !== 'granted' || !videoRef.current || !canvasRef.current) {
      setStatus('Please enable camera first');
      return;
    }

    setIsRecording(true);
    setTestDuration(0);
    setHeartRate(null);
    setConfidence(0);
    setResults(null);
    rrIntervalsRef.current = [];
    lastBeatTimeRef.current = null;
    startTimeRef.current = Date.now();

    // Start pulse detection
    pulseDetector.start(
      (bpm, conf) => {
        setHeartRate(bpm);
        setConfidence(conf);

        // Calculate RR interval from BPM
        const rrInterval = (60000 / bpm); // Convert BPM to ms
        const currentTime = Date.now();

        if (lastBeatTimeRef.current !== null) {
          const interval = currentTime - lastBeatTimeRef.current;
          if (interval > 300 && interval < 2000) { // Valid RR interval range
            rrIntervalsRef.current.push(interval);
            // Keep only recent intervals (last 60 seconds)
            if (rrIntervalsRef.current.length > 60) {
              rrIntervalsRef.current.shift();
            }
          }
        }

        lastBeatTimeRef.current = currentTime;
      },
      (error) => {
        setStatus(`Error: ${error}`);
      }
    );

    // Start timer
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setTestDuration(elapsed);

      // Auto-stop after 60 seconds
      if (elapsed >= 60) {
        stopTest();
      }
    }, 100);

    setStatus('Recording... Keep your face still and well-lit. Test will run for 60 seconds.');
  };

  const stopTest = () => {
    setIsRecording(false);
    pulseDetector.stop();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setStatus('Analyzing cardiovascular data...');

    // Wait a moment for final data collection
    setTimeout(() => {
      analyzeResults();
    }, 1000);
  };

  const analyzeResults = () => {
    if (!heartRate || rrIntervalsRef.current.length < 5) {
      setStatus('Insufficient data collected. Please try again with better lighting and keep your face still.');
      setIsRecording(false);
      return;
    }

    // Calculate HRV metrics
    const hrvMetrics = calculateHRV(rrIntervalsRef.current);

    // Estimate blood pressure
    const estimatedBP = estimateBloodPressure(
      hrvMetrics.meanRR,
      confidence / 100,
      age
    );

    // Calculate cardiovascular risk
    const riskAssessment = calculateCardiovascularRisk(
      heartRate,
      hrvMetrics,
      estimatedBP,
      age
    );

    const cardiovascularResults: CardiovascularResults = {
      timestamp: new Date().toISOString(),
      heartRate,
      hrvMetrics,
      estimatedBP,
      riskAssessment,
      testDuration: Math.round(testDuration),
      confidence
    };

    setResults(cardiovascularResults);
    setStatus('Analysis complete! View your cardiovascular assessment below.');

    // Save to unified health data storage
    try {
      const healthTestResult: HealthTestResult = {
        id: generateTestResultId('cardiovascular-test'),
        testType: 'cardiovascular-test',
        category: 'cardiovascular',
        testDate: cardiovascularResults.timestamp,
        timestamp: cardiovascularResults.timestamp,
        data: cardiovascularResults,
        score: 100 - riskAssessment.riskScore, // Invert risk score to get health score
        maxScore: 100,
        scorePercentage: 100 - riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel === 'low' ? 'low' :
          riskAssessment.riskLevel === 'moderate' ? 'medium' :
            riskAssessment.riskLevel === 'high' ? 'high' : 'critical',
        interpretation: `Heart Rate: ${heartRate} BPM | HRV Score: ${hrvMetrics.hrvScore}/100 | Risk Level: ${riskAssessment.riskLevel}`,
        recommendations: riskAssessment.recommendations,
        duration: testDuration * 1000,
        status: 'final',
      };
      saveTestResult(healthTestResult);
      console.log('Cardiovascular test result saved to localStorage');
    } catch (error) {
      console.error('Error saving cardiovascular test result:', error);
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-600 text-white';
      case 'moderate':
        return 'bg-yellow-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'very-high':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="text-center space-y-3 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 shadow-sm max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Cardiovascular Lab</h1>
        </div>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">{status}</p>
        <Badge className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40 text-xs px-3 py-1 rounded-full">
          Camera-Based PPG Analysis
        </Badge>
      </div>

      {/* Patient Information */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Patient Calibration</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Age calibration optimizes HRV and cardiovascular risk estimates</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <label className="text-slate-800 dark:text-slate-200 font-medium text-sm">Age:</label>
              <input
                type="number"
                min="18"
                max="100"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 35)}
                className="bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-1.5 w-24 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
                disabled={isRecording}
              />
              <span className="text-slate-500 dark:text-slate-400 text-sm">years old</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{status}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={initCamera}
            variant="outline"
            className="border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 rounded-xl"
            disabled={isRecording}
          >
            <Camera className="w-4 h-4 mr-2" /> Enable Camera
          </Button>
          <Button
            onClick={isRecording ? stopTest : startTest}
            disabled={permission !== 'granted' || (!isRecording && !heartRate && testDuration > 0)}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 mr-2" /> Stop Test ({testDuration.toFixed(0)}s)
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Start Assessment
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Video + Metrics */}
      <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Camera Feed */}
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Camera Feed</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Position face in frame for optical PPG pulse detection</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-200/80 dark:border-white/10 shadow-inner">
              <video
                ref={videoRef}
                className="w-full h-full object-cover opacity-90"
                autoPlay
                playsInline
                muted
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />
              {isRecording && (
                <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Recording PPG
                </div>
              )}
            </div>
            {heartRate && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Instant HR</div>
                  <span className="text-red-600 dark:text-red-400 font-bold text-lg">{heartRate} BPM</span>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Confidence</div>
                  <span className="text-teal-600 dark:text-teal-400 font-bold text-lg">{Math.round(confidence * 100)}%</span>
                </div>
                <div className="col-span-2 text-xs text-slate-500 dark:text-slate-400">
                  Elapsed: <span className="font-semibold text-slate-700 dark:text-slate-300">{testDuration.toFixed(1)}s</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Metrics */}
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Live Metrics</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Real-time cardiovascular telemetry</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-4">
              {heartRate ? (
                <>
                  <div className="text-center p-5 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200/60 dark:border-red-800/30">
                    <div className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">Current Heart Rate</div>
                    <div className="text-4xl font-extrabold text-red-600 dark:text-red-400">{heartRate}</div>
                    <div className="text-xs text-red-600/70 dark:text-red-300/70 mt-0.5">Beats Per Minute</div>
                  </div>
                  <div className="text-sm space-y-2.5 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Signal Quality:</span>
                      <span className={`font-semibold ${confidence > 0.7 ? 'text-emerald-600 dark:text-emerald-400' : confidence > 0.4 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {confidence > 0.7 ? 'Optimal' : confidence > 0.4 ? 'Moderate' : 'Noisy'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>RR Intervals Collected:</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{rrIntervalsRef.current.length}</span>
                    </div>
                    {testDuration > 10 && (
                      <div className="text-xs text-blue-700 dark:text-blue-300 mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-800/30 leading-relaxed">
                        💡 Keep recording for at least 30 seconds for diagnostic HRV accuracy
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 dark:text-slate-500 py-12">
                  <Activity className="w-10 h-10 mx-auto mb-2.5 opacity-40 text-slate-400" />
                  <p className="text-sm">Start test to see live metrics</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden max-w-4xl mx-auto">
          <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-lg">
              <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Cardiovascular Assessment Report
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Generated: {new Date(results.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-5 sm:p-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/30">
                <div className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">Heart Rate</div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{results.heartRate} BPM</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30">
                <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">HRV Score</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{results.hrvMetrics.hrvScore}/100</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/30">
                <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">Est. BP</div>
                <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                  {results.estimatedBP.systolic}/{results.estimatedBP.diastolic}
                </div>
                <div className="text-[11px] text-purple-600/70 dark:text-purple-400/70">mmHg</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">Risk Score</div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{results.riskAssessment.riskScore}</div>
                <Badge className={`mt-1.5 ${getRiskBadgeVariant(results.riskAssessment.riskLevel)} border-0 text-xs`}>
                  {results.riskAssessment.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* HRV Metrics */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Heart Rate Variability (HRV) Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                  <div className="text-xs text-slate-500 dark:text-slate-400">RMSSD</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{results.hrvMetrics.rmssd} ms</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                  <div className="text-xs text-slate-500 dark:text-slate-400">SDNN</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{results.hrvMetrics.sdnn} ms</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                  <div className="text-xs text-slate-500 dark:text-slate-400">pNN50</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{results.hrvMetrics.pnn50.toFixed(1)}%</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Stress State</div>
                  <Badge className={`mt-1 ${getRiskBadgeVariant(results.hrvMetrics.stressLevel)} border-0 text-xs`}>
                    {results.hrvMetrics.stressLevel.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="bg-teal-50 dark:bg-teal-950/20 p-3.5 rounded-xl border border-teal-200/60 dark:border-teal-800/30 text-sm text-teal-900 dark:text-teal-200">
                {results.hrvMetrics.interpretation}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Cardiovascular Risk Assessment</h3>
              {results.riskAssessment.factors.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/60 dark:border-amber-800/30 text-sm">
                  <strong className="text-amber-800 dark:text-amber-300">Risk Factors Identified:</strong>
                  <ul className="list-disc list-inside mt-1.5 space-y-1 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                    {results.riskAssessment.factors.map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Clinical Recommendations</h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {results.hrvMetrics.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
                {results.riskAssessment.recommendations.map((rec, idx) => (
                  <li key={`risk-${idx}`}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-amber-800 dark:text-amber-300 p-4 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 leading-relaxed">
              <strong className="text-amber-900 dark:text-amber-200">⚠️ Clinical Notice:</strong> This assessment uses camera-based photoplethysmography (PPG).
              Blood pressure estimation is approximate and not a replacement for medical-grade measurement.
              Always consult healthcare professionals for accurate cardiovascular diagnosis and treatment.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CardiovascularLab;

