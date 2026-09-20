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
    <div className="space-y-8 pt-24 min-h-screen pb-12">
      {/* Header */}
      <div className="text-center space-y-4 glass-panel p-6 relative overflow-hidden max-w-4xl mx-auto">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Heart className="w-8 h-8 text-red-500" />
          <h1 className="text-4xl font-bold text-foreground">Cardiovascular Lab</h1>
        </div>
        <p className="text-lg text-muted-foreground">{status}</p>
        <Badge className="bg-red-500/20 text-red-300 border-red-500/20 mt-2">Camera-Based PPG</Badge>
      </div>

      {/* Age Input */}
      <div className="max-w-4xl mx-auto px-4">
        {/* Age Input */}
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-panel border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-foreground">Patient Information</CardTitle>
              <CardDescription className="text-muted-foreground">Age helps improve risk assessment accuracy</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-foreground font-medium">Age:</label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 35)}
                  className="bg-black/20 border border-white/10 rounded px-3 py-2 w-24 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
                  disabled={isRecording}
                />
                <span className="text-muted-foreground text-sm">years</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto px-4">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={initCamera}
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-foreground hover:text-white"
            disabled={isRecording}
          >
            <Camera className="w-4 h-4 mr-2" /> Enable Camera
          </Button>
          <Button
            onClick={isRecording ? stopTest : startTest}
            disabled={permission !== 'granted' || (!isRecording && !heartRate && testDuration > 0)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 mr-2" /> Stop Test ({testDuration.toFixed(0)}s)
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Start Test
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Video + Metrics */}
      <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto px-4">
        {/* Camera Feed */}
        <Card className="glass-panel border-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle className="text-foreground">Camera Feed</CardTitle>
            <CardDescription className="text-muted-foreground">Position face in frame for pulse detection</CardDescription>
          </CardHeader>
          <CardContent className="bg-transparent pt-6">
            <div className="relative bg-black/50 rounded-lg overflow-hidden aspect-video border border-white/10">
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
                <div className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg shadow-red-900/50">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Recording
                </div>
              )}
            </div>
            {heartRate && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <strong className="text-foreground">Heart Rate:</strong>{' '}
                  <span className="text-red-400 font-bold text-lg">{heartRate} BPM</span>
                </div>
                <div>
                  <strong className="text-foreground">Confidence:</strong>{' '}
                  <span className="text-blue-400 font-semibold">{Math.round(confidence * 100)}%</span>
                </div>
                <div className="col-span-2">
                  <strong className="text-foreground">Test Duration:</strong>{' '}
                  <span className="text-green-400 font-semibold">{testDuration.toFixed(1)}s</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Metrics */}
        <Card className="glass-panel border-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle className="text-foreground">Live Metrics</CardTitle>
            <CardDescription className="text-muted-foreground">Real-time cardiovascular data</CardDescription>
          </CardHeader>
          <CardContent className="bg-transparent pt-6">
            <div className="space-y-4">
              {heartRate ? (
                <>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="text-sm text-red-200">Current Heart Rate</div>
                    <div className="text-4xl font-bold text-red-400">{heartRate}</div>
                    <div className="text-sm text-red-200/80">BPM</div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div>
                      <strong>Signal Quality:</strong>{' '}
                      <span className={confidence > 0.7 ? 'text-green-400' : confidence > 0.4 ? 'text-yellow-400' : 'text-red-400'}>
                        {confidence > 0.7 ? 'Excellent' : confidence > 0.4 ? 'Good' : 'Poor'}
                      </span>
                    </div>
                    <div>
                      <strong>RR Intervals Collected:</strong>{' '}
                      <span className="text-blue-400 font-semibold">{rrIntervalsRef.current.length}</span>
                    </div>
                    {testDuration > 10 && (
                      <div className="text-xs text-blue-200 mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                        💡 Tip: Keep recording for at least 30 seconds for accurate HRV analysis
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Start test to see live metrics</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <Card className="glass-panel border-0 relative overflow-hidden max-w-6xl mx-auto px-4">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Cardiovascular Assessment Report
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Generated: {new Date(results.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 bg-transparent">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-sm text-red-200">Heart Rate</div>
                <div className="text-2xl font-bold text-red-400">{results.heartRate} BPM</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-sm text-blue-200">HRV Score</div>
                <div className="text-2xl font-bold text-blue-400">{results.hrvMetrics.hrvScore}/100</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="text-sm text-purple-200">Est. BP</div>
                <div className="text-lg font-bold text-purple-400">
                  {results.estimatedBP.systolic}/{results.estimatedBP.diastolic}
                </div>
                <div className="text-xs text-purple-200/50">mmHg</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="text-sm text-orange-200">Risk Score</div>
                <div className="text-2xl font-bold text-orange-400">{results.riskAssessment.riskScore}</div>
                <Badge className={`mt-2 ${getRiskBadgeVariant(results.riskAssessment.riskLevel)} border-0`}>
                  {results.riskAssessment.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* HRV Metrics */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground">Heart Rate Variability (HRV) Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white/5 p-3 rounded border border-white/10">
                  <div className="text-muted-foreground">RMSSD</div>
                  <div className="text-lg font-bold text-foreground">{results.hrvMetrics.rmssd} ms</div>
                </div>
                <div className="bg-white/5 p-3 rounded border border-white/10">
                  <div className="text-muted-foreground">SDNN</div>
                  <div className="text-lg font-bold text-foreground">{results.hrvMetrics.sdnn} ms</div>
                </div>
                <div className="bg-white/5 p-3 rounded border border-white/10">
                  <div className="text-muted-foreground">pNN50</div>
                  <div className="text-lg font-bold text-foreground">{results.hrvMetrics.pnn50.toFixed(1)}%</div>
                </div>
                <div className="bg-white/5 p-3 rounded border border-white/10">
                  <div className="text-muted-foreground">Stress Level</div>
                  <Badge className={`mt-1 ${getRiskBadgeVariant(results.hrvMetrics.stressLevel)} border-0`}>
                    {results.hrvMetrics.stressLevel.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                <p className="text-muted-foreground">{results.hrvMetrics.interpretation}</p>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground">Cardiovascular Risk Assessment</h3>
              {results.riskAssessment.factors.length > 0 && (
                <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                  <strong className="text-yellow-200">Risk Factors Identified:</strong>
                  <ul className="list-disc list-inside mt-2 text-yellow-100/80">
                    {results.riskAssessment.factors.map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground">Recommendations</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground/90">
                {results.hrvMetrics.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
                {results.riskAssessment.recommendations.map((rec, idx) => (
                  <li key={`risk-${idx}`}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-yellow-100/80 p-4 bg-yellow-500/10 rounded-lg border-l-4 border-yellow-500 border border-yellow-500/20">
              <strong className="text-yellow-400">⚠️ Important Disclaimer:</strong> This assessment uses camera-based photoplethysmography (PPG).
              Blood pressure estimation is approximate and not a replacement for medical-grade measurement.
              Always consult healthcare professionals for accurate cardiovascular assessment and diagnosis.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CardiovascularLab;

