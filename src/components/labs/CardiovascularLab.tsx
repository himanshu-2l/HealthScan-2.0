/**
 * Cardiovascular Lab Component
 * Camera-based heart rate detection, HRV analysis, SpO2 blood oxygen estimation,
 * and cardiovascular risk assessment with hardware flashlight (torch) integration,
 * real-time pulse audio ("brap/bip" sound), and rich cardiac pulse visuals.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Camera, 
  Play, 
  Square, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  Volume2,
  VolumeX,
  Radio,
  Plus,
  Minus,
  User,
  RotateCcw
} from 'lucide-react';
import { 
  pulseDetector, 
  PPGMode, 
  checkTorchSupport, 
  setTorchState 
} from '@/utils/pulseDetection';
import { pulseAudio } from '@/utils/pulseAudio';
import { calculateHRV, estimateBloodPressure, calculateCardiovascularRisk } from '@/utils/hrvAnalysis';
import { saveTestResult, generateTestResultId } from '@/services/healthDataService';
import { HealthTestResult, ClinicalDataProvenance } from '@/types/health';

interface CardiovascularResults {
  timestamp: string;
  heartRate: number;
  spo2?: number | null;
  hrvMetrics: ReturnType<typeof calculateHRV>;
  estimatedBP: { systolic: number; diastolic: number; confidence: number };
  riskAssessment: ReturnType<typeof calculateCardiovascularRisk>;
  testDuration: number;
  confidence: number;
  provenance?: {
    heartRate: ClinicalDataProvenance;
    spo2: ClinicalDataProvenance;
    hrv: ClinicalDataProvenance;
  };
}

export const CardiovascularLab: React.FC = () => {
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [ppgMode, setPpgMode] = useState<PPGMode>('fingertip');
  const [isRecording, setIsRecording] = useState(false);
  const [testDuration, setTestDuration] = useState(0);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [spo2, setSpo2] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [fingerDetected, setFingerDetected] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isPulseAudioMuted, setIsPulseAudioMuted] = useState(false);
  const [isBeatActive, setIsBeatActive] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const [status, setStatus] = useState('Select mode and click "Enable Camera" to begin assessment');
  const [results, setResults] = useState<CardiovascularResults | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveAnimRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const rrIntervalsRef = useRef<number[]>([]);
  const heartRateRef = useRef<number | null>(null);
  const spo2Ref = useRef<number | null>(null);
  const confidenceRef = useRef(0);
  const testDurationRef = useRef(0);
  const lastBeatTimeRef = useRef<number | null>(null);
  const lastBeatTickRef = useRef<number>(0);
  const lastUiUpdateRef = useRef<number>(0);
  const isBeatActiveRef = useRef<boolean>(false);
  const isFingerActiveRef = useRef<boolean>(false);
  const beatTimeoutRef = useRef<number | null>(null);
  const [age, setAge] = useState<number | string>(35);

  const handleAgeChange = (val: string) => {
    if (val === '') {
      setAge('');
      return;
    }
    const cleaned = val.replace(/\D/g, '');
    if (cleaned === '') {
      setAge('');
    } else {
      const num = parseInt(cleaned, 10);
      setAge(Math.min(120, num));
    }
  };

  const handleAgeBlur = () => {
    const num = typeof age === 'number' ? age : parseInt(String(age), 10);
    if (isNaN(num) || num < 18) {
      setAge(18);
    } else if (num > 100) {
      setAge(100);
    } else {
      setAge(num);
    }
  };

  const adjustAge = (delta: number) => {
    if (isRecording) return;
    const current = typeof age === 'number' ? age : (parseInt(String(age), 10) || 35);
    const next = Math.max(18, Math.min(100, current + delta));
    setAge(next);
  };

  // Trigger pulse sound ("brap/bip" medical audio) and visual systolic pulsation
  const triggerPulseBeat = useCallback((currentSpo2?: number | null) => {
    const now = Date.now();
    // Guard against firing faster than physiological maximum (<= 220 BPM = 270ms)
    if (now - lastBeatTickRef.current < 270) return;
    lastBeatTickRef.current = now;

    // 1. Play clinical "bip/brap" pulse audio tone (null defaults to neutral tone without fake SpO2 pitch)
    pulseAudio.playBeat(currentSpo2 !== undefined && currentSpo2 !== null ? currentSpo2 : (spo2 ?? null));

    // 2. Set visual pulse active state
    setIsBeatActive(true);
    isBeatActiveRef.current = true;
    setBeatCount(prev => prev + 1);

    if (beatTimeoutRef.current) {
      window.clearTimeout(beatTimeoutRef.current);
    }
    beatTimeoutRef.current = window.setTimeout(() => {
      setIsBeatActive(false);
      isBeatActiveRef.current = false;
    }, 160);
  }, [spo2]);

  // Clean up all hardware streams, audio, animation loops, and torch on unmount
  useEffect(() => {
    return () => {
      pulseDetector.stop();
      if (waveAnimRef.current) {
        cancelAnimationFrame(waveAnimRef.current);
        waveAnimRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (beatTimeoutRef.current) {
        clearTimeout(beatTimeoutRef.current);
      }
      if (streamRef.current) {
        setTorchState(streamRef.current, false).catch(() => {});
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      pulseAudio.close();
    };
  }, []);

  const initCamera = async (overrideMode?: PPGMode) => {
    const activeMode = overrideMode || ppgMode;
    try {
      setStatus(`Requesting ${activeMode === 'fingertip' ? 'rear camera for contact fingertip PPG' : 'front camera for facial scan'}...`);
      pulseAudio.init();

      // Safely turn off torch and release existing stream before re-requesting
      if (streamRef.current) {
        if (isTorchOn) {
          await setTorchState(streamRef.current, false).catch(() => {});
          setIsTorchOn(false);
        }
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const videoConstraints: MediaStreamConstraints = {
        video: activeMode === 'fingertip'
          ? {
              facingMode: { ideal: 'environment' },
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          : {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
      } catch (err) {
        console.warn('Preferred camera facingMode failed, falling back to any camera:', err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setPermission('granted');

        // Wait for video metadata to resolve width and height
        await new Promise<void>((resolve) => {
          if (videoRef.current && videoRef.current.readyState >= 1 && videoRef.current.videoWidth > 0) {
            resolve();
          } else if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
            setTimeout(resolve, 500);
          } else {
            resolve();
          }
        });

        // Check if camera hardware has flashlight (torch)
        const torchAvailable = await checkTorchSupport(stream);
        setIsTorchSupported(torchAvailable);

        if (activeMode === 'fingertip') {
          if (torchAvailable) {
            const turnedOn = await setTorchState(stream, true);
            setIsTorchOn(turnedOn);
            setStatus('Flashlight & rear camera engaged! Gently place and hold your index finger over the lens and LED.');
          } else {
            setIsTorchOn(false);
            setStatus('Camera enabled. Place your fingertip gently over the lens under good ambient light.');
          }
        } else {
          setIsTorchOn(false);
          setStatus('Front camera enabled. Position your face in the frame and click "Start Assessment".');
        }

        // Initialize pulse detector
        if (canvasRef.current) {
          pulseDetector.initialize(videoRef.current, canvasRef.current);
          pulseDetector.setMode(activeMode);
        }
      }
    } catch (error) {
      setPermission('denied');
      setStatus('Camera access denied. Please allow camera permissions in your browser to proceed.');
      console.error('Camera error:', error);
    }
  };

  const handleModeToggle = async (mode: PPGMode) => {
    if (mode === ppgMode) return;
    if (isRecording) {
      stopTest();
    }
    setPpgMode(mode);
    setFingerDetected(false);
    pulseDetector.setMode(mode);
    if (permission === 'granted') {
      await initCamera(mode);
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current || !isTorchSupported) return;
    const nextState = !isTorchOn;
    const ok = await setTorchState(streamRef.current, nextState);
    if (ok) {
      setIsTorchOn(nextState);
    }
  };

  const toggleAudio = () => {
    const nextMuted = pulseAudio.toggleMute();
    setIsPulseAudioMuted(nextMuted);
  };

  const startWaveformAnimation = () => {
    if (waveAnimRef.current) {
      cancelAnimationFrame(waveAnimRef.current);
      waveAnimRef.current = null;
    }

    const renderWave = () => {
      if (waveCanvasRef.current) {
        const cvs = waveCanvasRef.current;
        if (cvs.clientWidth > 0 && (cvs.width !== cvs.clientWidth || cvs.height !== cvs.clientHeight)) {
          cvs.width = cvs.clientWidth;
          cvs.height = cvs.clientHeight;
        }
        const ctx = cvs.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, cvs.width, cvs.height);

          // 1. Draw subtle clinical telemetry grid
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          for (let x = 0; x < cvs.width; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, cvs.height);
            ctx.stroke();
          }
          for (let y = 0; y < cvs.height; y += 18) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(cvs.width, y);
            ctx.stroke();
          }

          const waveform = pulseDetector.getWaveform();
          const samples = waveform.samples.slice(-100);

          if (samples.length > 5) {
            const min = Math.min(...samples);
            const max = Math.max(...samples);
            const range = max - min || 1;

            // Gradient fill under waveform for clinical ICU monitor look
            const grad = ctx.createLinearGradient(0, 0, 0, cvs.height);
            grad.addColorStop(0, isBeatActiveRef.current ? 'rgba(239, 68, 68, 0.3)' : 'rgba(20, 184, 166, 0.18)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            samples.forEach((val, idx) => {
              const x = (idx / (samples.length - 1)) * cvs.width;
              const normalized = (val - min) / range;
              const y = cvs.height - (normalized * (cvs.height * 0.72) + cvs.height * 0.14);
              if (idx === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.lineTo(cvs.width, cvs.height);
            ctx.lineTo(0, cvs.height);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            // Trace stroke line
            ctx.beginPath();
            ctx.strokeStyle = isBeatActiveRef.current ? '#F87171' : '#14B8A6';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.shadowColor = isBeatActiveRef.current ? '#EF4444' : '#2DD4BF';
            ctx.shadowBlur = isBeatActiveRef.current ? 12 : 6;

            let lastX = 0;
            let lastY = 0;
            samples.forEach((val, idx) => {
              const x = (idx / (samples.length - 1)) * cvs.width;
              const normalized = (val - min) / range;
              const y = cvs.height - (normalized * (cvs.height * 0.72) + cvs.height * 0.14);
              if (idx === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
              lastX = x;
              lastY = y;
            });
            ctx.stroke();

            // Glowing cursor head at wave front
            ctx.beginPath();
            ctx.fillStyle = isBeatActiveRef.current ? '#EF4444' : '#FFFFFF';
            ctx.shadowColor = isBeatActiveRef.current ? '#EF4444' : '#FFFFFF';
            ctx.shadowBlur = 10;
            ctx.arc(lastX, lastY, isBeatActiveRef.current ? 4.5 : 3.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Idle gentle baseline
            const time = Date.now() / 250;
            ctx.beginPath();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            for (let x = 0; x < cvs.width; x += 4) {
              const y = cvs.height / 2 + Math.sin(time + x * 0.05) * 8;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }
      }
      waveAnimRef.current = requestAnimationFrame(renderWave);
    };

    waveAnimRef.current = requestAnimationFrame(renderWave);
  };

  const startTest = async () => {
    if (permission !== 'granted' || !streamRef.current) {
      await initCamera();
    }

    if (!videoRef.current || !canvasRef.current) {
      setStatus('Please grant camera access to begin cardiovascular assessment.');
      return;
    }
    if (!streamRef.current) {
      setStatus('Camera access is required before starting the assessment.');
      return;
    }

    pulseAudio.init();
    setIsRecording(true);
    setTestDuration(0);
    setHeartRate(null);
    heartRateRef.current = null;
    setSpo2(null);
    spo2Ref.current = null;
    setConfidence(0);
    confidenceRef.current = 0;
    testDurationRef.current = 0;
    setResults(null);
    setBeatCount(0);
    rrIntervalsRef.current = [];
    lastBeatTimeRef.current = null;
    lastBeatTickRef.current = Date.now();
    startTimeRef.current = Date.now();

    // Ensure mode is set
    pulseDetector.setMode(ppgMode);

    // Auto-engage torch if in fingertip mode, supported, but currently off
    if (ppgMode === 'fingertip' && isTorchSupported && !isTorchOn && streamRef.current) {
      setTorchState(streamRef.current, true).then(on => setIsTorchOn(on)).catch(() => {});
    }

    // Start wave visualizer
    startWaveformAnimation();

    // Start pulse detection
    pulseDetector.start(
      (bpm, conf, intervals, currentSpo2, fingerActive, isBeat) => {
        const isContact = Boolean(fingerActive);
        setFingerDetected(isContact);
        isFingerActiveRef.current = isContact;

        if (ppgMode === 'fingertip' && !isContact) {
          // No finger on camera: immediately clear reading and prevent false beats
          setHeartRate(null);
          heartRateRef.current = null;
          setConfidence(0);
          confidenceRef.current = 0;
          setSpo2(null);
          spo2Ref.current = null;
          return;
        }

        // Only process pulse when verified contact is active
        if (bpm > 40 && bpm < 200 && conf >= 0.18) {
          heartRateRef.current = bpm;
          confidenceRef.current = conf;
          if (currentSpo2 !== undefined && currentSpo2 > 0) {
            spo2Ref.current = currentSpo2;
          }

          // Throttle React state updates so we do not re-render at 60 FPS
          const now = Date.now();
          if (isBeat || now - lastUiUpdateRef.current >= 250) {
            lastUiUpdateRef.current = now;
            setHeartRate(bpm);
            setConfidence(conf);
            if (currentSpo2 !== undefined && currentSpo2 > 0) {
              setSpo2(currentSpo2);
            }
          }

          // Real-time physiological beat detected!
          if (isBeat) {
            triggerPulseBeat(currentSpo2);
          }

          // Collect genuine RR intervals from peak detection
          if (isBeat && intervals && intervals.length > 0) {
            const latestInterval = intervals[intervals.length - 1];
            if (latestInterval >= 300 && latestInterval <= 2000) {
              rrIntervalsRef.current.push(latestInterval);
            }
            if (rrIntervalsRef.current.length > 120) {
              rrIntervalsRef.current = rrIntervalsRef.current.slice(-120);
            }
          }
        }
      },
      (error) => {
        setStatus(`Error: ${error}`);
      }
    );

    // Start timer with rhythmic heartbeat watchdog
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      testDurationRef.current = elapsed;
      setTestDuration(elapsed);

      // Rhythm watchdog: only fire when finger is actively in contact (in fingertip mode)
      if (ppgMode === 'fingertip' && !isFingerActiveRef.current) {
        return;
      }

      // If we have a locked physiological BPM, ensure visual & audio pulse fire steadily
      const liveHeartRate = heartRateRef.current;
      const liveConfidence = confidenceRef.current;
      const currentBpm = (liveHeartRate && liveHeartRate >= 40 && liveHeartRate <= 190 && liveConfidence >= 0.35) ? liveHeartRate : null;
      if (currentBpm) {
        const beatIntervalMs = 60000 / currentBpm;
        if (Date.now() - lastBeatTickRef.current >= beatIntervalMs) {
          triggerPulseBeat(spo2Ref.current);
        }
      }

      // Auto-stop after 60 seconds
      if (elapsed >= 60) {
        stopTest();
      }
    }, 100);

    setStatus(ppgMode === 'fingertip'
      ? 'Recording fingertip PPG... Keep finger gently on camera and flash. 60-second assessment underway.'
      : 'Recording facial rPPG... Keep your head still and face well-lit. 60-second assessment underway.'
    );
  };

  const stopTest = () => {
    setIsRecording(false);
    pulseDetector.stop();

    if (waveAnimRef.current) {
      cancelAnimationFrame(waveAnimRef.current);
      waveAnimRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setStatus('Analyzing cardiovascular & arterial plethysmography data...');

    // Wait a moment for final data collection
    setTimeout(() => {
      analyzeResults();
    }, 1000);
  };

  const analyzeResults = () => {
    const finalBpm = heartRateRef.current || (rrIntervalsRef.current.length > 0
      ? Math.round(60000 / (rrIntervalsRef.current.reduce((a, b) => a + b, 0) / rrIntervalsRef.current.length))
      : null);

    if (!finalBpm) {
      setStatus(ppgMode === 'fingertip'
        ? 'No pulsatile signal detected. Please ensure your fingertip completely and gently covers the rear camera lens & flashlight.'
        : 'No pulse signal detected. Please ensure your face is well-lit and centered in the frame.'
      );
      setIsRecording(false);
      return;
    }

    // Clinical Safety: Insufficient genuine cardiac beats must NEVER be supplemented with synthetic data
    if (rrIntervalsRef.current.length < 10 || confidenceRef.current < 0.4 || testDurationRef.current < 10) {
      setStatus(
        'Insufficient clean cardiac data (requires at least 10 valid beats, 10 seconds, and Moderate signal quality). ' +
        'Cannot compute clinical HRV or cardiovascular risk from insufficient data. ' +
        'Please ensure steady sensor contact and repeat the measurement.'
      );
      setResults(null);
      setIsRecording(false);
      return;
    }

    // SpO2: Use genuine optical estimate or explicit null (never fabricate a fake normal 98% fallback)
    const detectedSpo2 = spo2Ref.current ?? pulseDetector.getLatestSpo2();
    const finalSpo2 = (typeof detectedSpo2 === 'number' && !isNaN(detectedSpo2) && detectedSpo2 >= 50 && detectedSpo2 <= 100)
      ? detectedSpo2
      : null;

    // Calculate HRV metrics strictly from genuine detected cardiac intervals
    const hrvMetrics = calculateHRV(rrIntervalsRef.current);

    // Estimate blood pressure
    const numericAge = typeof age === 'number' && !isNaN(age) && age > 0 ? age : (parseInt(String(age), 10) || 35);
    const estimatedBP = estimateBloodPressure(
      hrvMetrics.meanRR,
      confidenceRef.current,
      numericAge
    );

    // Calculate cardiovascular risk
    const riskAssessment = calculateCardiovascularRisk(
      finalBpm,
      hrvMetrics,
      estimatedBP,
      numericAge
    );

    const cardiovascularResults: CardiovascularResults = {
      timestamp: new Date().toISOString(),
      heartRate: finalBpm,
      spo2: finalSpo2,
      hrvMetrics,
      estimatedBP,
      riskAssessment,
      testDuration: Math.round(testDurationRef.current),
      confidence: confidenceRef.current,
      provenance: {
        heartRate: 'MEASURED',
        spo2: finalSpo2 !== null ? 'ESTIMATED' : 'UNAVAILABLE',
        hrv: 'MEASURED'
      }
    };

    setResults(cardiovascularResults);
    setStatus('Analysis complete! View your cardiovascular assessment report below.');

    // Save to unified health data storage
    try {
      const healthTestResult: HealthTestResult = {
        id: generateTestResultId('cardiovascular-test'),
        testType: 'cardiovascular-test',
        category: 'cardiovascular',
        testDate: cardiovascularResults.timestamp,
        timestamp: cardiovascularResults.timestamp,
        data: {
          ...cardiovascularResults,
          heartRate: finalBpm,
          spo2: finalSpo2,
          hrv: hrvMetrics.rmssd || hrvMetrics.sdnn,
          provenance: cardiovascularResults.provenance
        },
        score: 100 - riskAssessment.riskScore,
        maxScore: 100,
        scorePercentage: 100 - riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel === 'low' ? 'low' :
          riskAssessment.riskLevel === 'moderate' ? 'medium' :
            riskAssessment.riskLevel === 'high' ? 'high' : 'critical',
        interpretation: `Heart Rate: ${finalBpm} BPM | SpO2: ${finalSpo2 !== null ? `${finalSpo2}% (Optical Estimate)` : 'Unavailable'} | HRV Score: ${hrvMetrics.hrvScore}/100 | Risk Level: ${riskAssessment.riskLevel}`,
        recommendations: riskAssessment.recommendations,
        duration: testDurationRef.current * 1000,
        status: 'final',
      };
      saveTestResult(healthTestResult);
      console.log('Cardiovascular test result saved with SpO2 and HRV to storage');
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
          <div className="relative w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            {isBeatActive && (
              <span className="absolute inset-0 rounded-xl bg-red-500/30 animate-ping" />
            )}
            <Heart className={`w-6 h-6 transition-transform duration-100 ${isBeatActive ? 'scale-125 text-red-600 fill-red-600' : 'scale-100'}`} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Cardiovascular Lab</h1>
        </div>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">{status}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Badge className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40 text-xs px-3 py-1 rounded-full">
            Dual-Mode Optical PPG & Flashlight
          </Badge>
          {isTorchSupported && isTorchOn && (
            <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
              Torch Active
            </Badge>
          )}
          {!isPulseAudioMuted && (
            <Badge className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-teal-600" />
              Pulse Beep Active
            </Badge>
          )}
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-white/10">
          <button
            onClick={() => handleModeToggle('fingertip')}
            disabled={isRecording}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              ppgMode === 'fingertip'
                ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm border border-slate-200/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className={`w-4 h-4 ${ppgMode === 'fingertip' ? 'text-amber-500 fill-amber-500' : ''}`} />
            <span>Contact Fingertip & Torch (Rear Cam)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold ml-1">
              SpO2 + Pulse Tone
            </span>
          </button>

          <button
            onClick={() => handleModeToggle('face')}
            disabled={isRecording}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              ppgMode === 'face'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Contactless Facial rPPG (Front Cam)</span>
          </button>
        </div>
      </div>

      {/* Patient Information */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-3.5 px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Patient Calibration</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 dark:border-white/10">
                Normative Baseline
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Calibrating patient age optimizes physiological HRV reference bands and blood pressure calculation
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Direct Input with Stepper Buttons */}
              <div className="flex items-center gap-2">
                <label className="text-slate-800 dark:text-slate-200 font-medium text-sm">Age:</label>
                
                <div className="flex items-center bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 rounded-xl p-0.5 shadow-inner">
                  <button
                    type="button"
                    onClick={() => adjustAge(-1)}
                    disabled={isRecording || (typeof age === 'number' && age <= 18)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95"
                    title="Decrease age by 1"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={age}
                    onChange={(e) => handleAgeChange(e.target.value)}
                    onBlur={handleAgeBlur}
                    className="bg-transparent border-0 w-12 text-center text-slate-900 dark:text-white text-base font-bold font-mono focus:outline-none focus:ring-0"
                    disabled={isRecording}
                    placeholder="35"
                  />

                  <button
                    type="button"
                    onClick={() => adjustAge(1)}
                    disabled={isRecording || (typeof age === 'number' && age >= 100)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95"
                    title="Increase age by 1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">years old</span>
              </div>

              {/* Quick Age Preset Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Presets:</span>
                {[20, 30, 40, 50, 60, 70].map((preset) => {
                  const isSelected = Number(age) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={isRecording}
                      onClick={() => setAge(preset)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition active:scale-95 ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-sm font-bold'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Smooth Slider for Touch Ergonomics */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span>Young Adult (18)</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400 font-mono">
                  {typeof age === 'number' ? `${age} years old` : '35 years old'}
                </span>
                <span>Senior (90+)</span>
              </div>
              <input
                type="range"
                min={18}
                max={90}
                step={1}
                value={typeof age === 'number' ? age : (parseInt(String(age), 10) || 35)}
                onChange={(e) => setAge(parseInt(e.target.value, 10))}
                disabled={isRecording}
                className="w-full accent-teal-600 dark:accent-teal-400 cursor-pointer disabled:opacity-40"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Bar with Pulse Audio Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{status}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Audio Beep Toggle */}
          <Button
            onClick={toggleAudio}
            variant="outline"
            size="sm"
            className={`rounded-xl border transition-all ${
              !isPulseAudioMuted 
                ? 'border-teal-500/40 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300' 
                : 'border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500'
            }`}
            title={isPulseAudioMuted ? "Enable pulse beep sound" : "Mute pulse sound"}
          >
            {!isPulseAudioMuted ? (
              <>
                <Volume2 className="w-3.5 h-3.5 mr-1.5 text-teal-600 dark:text-teal-400 animate-pulse" />
                Pulse Sound: ON
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Pulse Sound: Muted
              </>
            )}
          </Button>

          {/* Torch Manual Toggle Button if Hardware Supported */}
          {isTorchSupported && permission === 'granted' && (
            <Button
              onClick={toggleTorch}
              variant="outline"
              size="sm"
              className={`rounded-xl border transition-all ${
                isTorchOn 
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 shadow-sm' 
                  : 'border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 mr-1.5 ${isTorchOn ? 'fill-amber-500 text-amber-500 animate-pulse' : 'text-slate-400'}`} />
              Flashlight: {isTorchOn ? 'ON' : 'OFF'}
            </Button>
          )}

          <Button
            onClick={() => initCamera()}
            variant="outline"
            className="border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 rounded-xl"
            disabled={isRecording}
          >
            <Camera className="w-4 h-4 mr-2" /> Enable Camera
          </Button>

          <Button
            onClick={isRecording ? stopTest : startTest}
            disabled={permission === 'denied'}
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

      {/* Video + Telemetry Grid */}
      <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Camera Feed & Optical Waveform */}
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                  {ppgMode === 'fingertip' ? 'Fingertip Optical Sensor' : 'Face Tracker Feed'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {ppgMode === 'fingertip' 
                    ? 'Cover rear camera & flashlight with finger' 
                    : 'Position face in frame for optical rPPG detection'}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-slate-200 dark:border-white/10">
                {ppgMode === 'fingertip' ? 'Rear Sensor' : 'Front Cam'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-3">
            {/* Video container with vascular pulse glow border on systole */}
            <div className={`relative bg-slate-950 rounded-xl overflow-hidden aspect-video border transition-all duration-150 shadow-inner ${
              isBeatActive && isRecording 
                ? 'border-red-500 ring-2 ring-red-500/50 shadow-[0_0_24px_rgba(239,68,68,0.5)]' 
                : 'border-slate-200/80 dark:border-white/10'
            }`}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover opacity-90"
                autoPlay
                playsInline
                muted
                style={{ transform: ppgMode === 'face' ? 'scaleX(-1)' : 'none' }}
              />
              <canvas ref={canvasRef} width={640} height={480} className="hidden" />

              {/* In-Frame Recording Indicator */}
              {isRecording && (
                <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Recording PPG
                </div>
              )}

              {/* Live Beating Systolic Pulse Badge inside Video */}
              {isRecording && (
                <div className={`absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full backdrop-blur-md text-xs font-bold flex items-center gap-1.5 transition-all duration-100 ${
                  isBeatActive 
                    ? 'bg-red-600 text-white scale-110 shadow-lg shadow-red-600/50' 
                    : 'bg-black/60 text-slate-200 scale-100'
                }`}>
                  <Heart className={`w-3.5 h-3.5 transition-transform duration-100 ${isBeatActive ? 'fill-white text-white scale-125' : 'text-red-400 fill-red-400/40'}`} />
                  <span className="font-mono">{heartRate ? `${heartRate} BPM` : 'Acquiring...'}</span>
                </div>
              )}

              {/* Torch indicator badge */}
              {isTorchSupported && isTorchOn && (
                <div className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-sm text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                  <Zap className="w-3 h-3 fill-slate-950" />
                  Flashlight ON
                </div>
              )}
            </div>

            {/* Fingertip Contact Feedback Banner */}
            {ppgMode === 'fingertip' && permission === 'granted' && (
              <div>
                {fingerDetected ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Fingertip in position & illuminated • Arterial pulse detected</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Place and gently hold your fingertip over the rear camera lens & flashlight</span>
                  </div>
                )}
              </div>
            )}

            {/* Plethysmogram Oscilloscope Canvas */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
                <span className="flex items-center gap-1.5 text-[11px] text-teal-400 font-semibold">
                  <Activity className={`w-3.5 h-3.5 ${isBeatActive ? 'text-red-400 scale-125' : 'text-teal-400'} transition-transform duration-100`} />
                  Live Arterial Plethysmogram (PPG)
                </span>
                <span className="text-[10px] text-slate-500">
                  {isBeatActive ? '⚡ Peak Inflow' : '30 FPS Live Trace'}
                </span>
              </div>
              <canvas 
                ref={waveCanvasRef} 
                width={380} 
                height={70} 
                className="w-full h-16 rounded bg-black/60 border border-white/[0.04]" 
              />
            </div>

            {/* Sub-feed Quick Indicators */}
            {heartRate && (
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Instant HR</div>
                  <span className="text-red-600 dark:text-red-400 font-bold text-lg">{heartRate} BPM</span>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Estimated SpO2</div>
                  <span className="text-teal-600 dark:text-teal-400 font-bold text-lg">{spo2 !== null && spo2 !== undefined ? `${spo2}%` : '--'}</span>
                </div>
                <div className="col-span-2 text-xs text-slate-500 dark:text-slate-400">
                  Elapsed: <span className="font-semibold text-slate-700 dark:text-slate-300">{testDuration.toFixed(1)}s</span> (Recommended: 30s-60s)
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Telemetry Metrics */}
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Live Telemetry</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Real-time cardiovascular biometrics & sound</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-4">
              {heartRate ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Beating Heart Monitor Card */}
                    <div className="relative overflow-hidden text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200/60 dark:border-red-800/30 transition-all duration-150">
                      {/* Systolic flash glow backdrop */}
                      <div 
                        className={`absolute inset-0 bg-red-500/15 transition-opacity duration-150 pointer-events-none ${
                          isBeatActive ? 'opacity-100' : 'opacity-0'
                        }`}
                      />

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Heart Rate</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                          isBeatActive ? 'bg-red-600 text-white scale-105' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isBeatActive ? 'bg-white animate-ping' : 'bg-red-500'}`} />
                          {isBeatActive ? 'SYSTOLE' : 'DIASTOLE'}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-2 my-1">
                        {/* Animated Heart with systolic pulse expansion & radiating acoustic wave */}
                        <div className="relative flex items-center justify-center">
                          {isBeatActive && (
                            <span className="absolute w-8 h-8 rounded-full bg-red-500/30 animate-ping" />
                          )}
                          <Heart 
                            className={`w-7 h-7 text-red-600 dark:text-red-400 transition-transform duration-100 ${
                              isBeatActive ? 'scale-125 fill-red-600 dark:fill-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'scale-100 fill-red-500/20'
                            }`} 
                          />
                        </div>
                        <div className="text-4xl font-extrabold text-red-600 dark:text-red-400 tracking-tight font-mono">
                          {heartRate}
                        </div>
                      </div>
                      <div className="text-[11px] text-red-600/70 dark:text-red-300/70">
                        BPM • {beatCount} Beats Counted
                      </div>
                    </div>

                    {/* SpO2 Blood Oxygen Card */}
                    <div className="text-center p-4 bg-teal-50 dark:bg-teal-950/20 rounded-xl border border-teal-200/60 dark:border-teal-800/30">
                      <div className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider mb-1">Blood Oxygen</div>
                      <div className="text-4xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">{spo2 !== null && spo2 !== undefined ? `${spo2}%` : '--'}</div>
                      <div className="text-[11px] text-teal-600/70 dark:text-teal-300/70">{spo2 !== null && spo2 !== undefined ? 'SpO2 (Optical Est.)' : 'SpO2 Unavailable'}</div>
                    </div>
                  </div>

                  {/* Arterial Capillary Pulse Wave Visualizer */}
                  <div className="p-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200/80 dark:border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Radio className={`w-3.5 h-3.5 ${isBeatActive ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                        Arterial Capillary Pulse Wave
                      </span>
                      <span className={`font-mono text-[10px] font-semibold ${isBeatActive ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
                        {isBeatActive ? '⚡ Peak Inflow' : '○ Diastolic Recoil'}
                      </span>
                    </div>

                    {/* Real-time pulse amplitude visual track */}
                    <div className="relative h-2 w-full bg-slate-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-150 ${
                          isBeatActive 
                            ? 'w-full bg-gradient-to-r from-teal-500 via-rose-500 to-red-600 shadow-[0_0_12px_rgba(239,68,68,0.8)]' 
                            : 'w-1/4 bg-slate-300 dark:bg-white/20'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="text-sm space-y-2.5 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Signal Quality:</span>
                      <span className={`font-semibold ${confidence > 0.7 ? 'text-emerald-600 dark:text-emerald-400' : confidence > 0.4 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {confidence > 0.7 ? 'Optimal (Peak Locked)' : confidence > 0.4 ? 'Moderate' : 'Noisy'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>RR Intervals Collected:</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold font-mono">{rrIntervalsRef.current.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Optical Mode:</span>
                      <span className="text-slate-900 dark:text-white font-medium">
                        {ppgMode === 'fingertip' ? 'Transillumination Fingertip' : 'Ambient Facial rPPG'}
                      </span>
                    </div>
                    {testDuration > 10 && (
                      <div className="text-xs text-blue-700 dark:text-blue-300 mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-800/30 leading-relaxed">
                        💡 Keep recording for at least 30 seconds for diagnostic HRV (RMSSD/SDNN) and blood pressure accuracy.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 dark:text-slate-500 py-12">
                  <Activity className="w-10 h-10 mx-auto mb-2.5 opacity-40 text-slate-400" />
                  <p className="text-sm">Click "Start Assessment" to begin live telemetry capture</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {ppgMode === 'fingertip' 
                      ? 'Flashlight will illuminate finger capillary beds • Pulse sound active' 
                      : 'Ensure good lighting on your forehead and face'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Report Card */}
      {results && (
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden max-w-4xl mx-auto">
          <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-lg">
                  <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  Cardiovascular Assessment Report
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Generated: {new Date(results.timestamp).toLocaleString()} • Assessment Duration: {results.testDuration}s
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setResults(null);
                  startTest();
                }}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl self-start sm:self-auto font-medium text-xs shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Retake Assessment
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-5 sm:p-6">
            {/* 5 Key Metrics: HR, SpO2, HRV, BP, Risk */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div className="text-center p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/30">
                <div className="text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">Heart Rate</div>
                <div className="text-xl font-bold text-red-700 dark:text-red-300 font-mono">{results.heartRate} BPM</div>
              </div>

              <div className="text-center p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/30">
                <div className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider mb-1">Blood Oxygen</div>
                <div className="text-xl font-bold text-teal-700 dark:text-teal-300 font-mono">{results.spo2 !== null && results.spo2 !== undefined ? `${results.spo2}% SpO2` : 'Unavailable'}</div>
                <div className="text-[10px] text-teal-600/70 dark:text-teal-300/70">{results.spo2 !== null && results.spo2 !== undefined ? 'Optical Estimate' : 'Not Recorded'}</div>
              </div>

              <div className="text-center p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30">
                <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">HRV Score</div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300 font-mono">{results.hrvMetrics.hrvScore}/100</div>
              </div>

              <div className="text-center p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/30">
                <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">Est. BP</div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300 font-mono">
                  {results.estimatedBP.systolic}/{results.estimatedBP.diastolic}
                </div>
                <div className="text-[10px] text-purple-600/70 dark:text-purple-400/70">mmHg</div>
              </div>

              <div className="col-span-2 sm:col-span-1 text-center p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
                <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">Risk Score</div>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-300 font-mono">{results.riskAssessment.riskScore}</div>
                <Badge className={`mt-1 ${getRiskBadgeVariant(results.riskAssessment.riskLevel)} border-0 text-[10px]`}>
                  {results.riskAssessment.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* HRV Detailed Metrics */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Heart Rate Variability (HRV) Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                  <div className="text-xs text-slate-500 dark:text-slate-400">RMSSD</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono">{results.hrvMetrics.rmssd} ms</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                  <div className="text-xs text-slate-500 dark:text-slate-400">SDNN</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono">{results.hrvMetrics.sdnn} ms</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                  <div className="text-xs text-slate-500 dark:text-slate-400">pNN50</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono">{results.hrvMetrics.pnn50.toFixed(1)}%</div>
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
              Blood oxygen (SpO2) and blood pressure estimations are calculated via dual-wavelength optical analysis and pulse transit approximations, and are not intended to replace diagnostic medical instruments.
              Always consult healthcare professionals for formal clinical evaluation.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CardiovascularLab;
