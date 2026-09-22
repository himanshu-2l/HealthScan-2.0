/**
 * Vision & Hearing Lab Component
 * Visual acuity, color blindness, hearing tests, and peripheral vision
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Ear, Target, TrendingUp, CheckCircle, XCircle, Play, RotateCcw, Volume2 } from 'lucide-react';
import { calculateVisualAcuity, analyzeColorBlindness, analyzePeripheralVision, calculateOverallVisionScore } from '@/utils/visionTests';
import { analyzeHearingTest } from '@/utils/hearingTests';
import { saveTestResult, generateTestResultId } from '@/services/healthDataService';
import { HealthTestResult } from '@/types/health';

export const VisionHearingLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vision' | 'hearing' | 'results'>('vision');

  // Vision test state
  const [visionTestAnswers, setVisionTestAnswers] = useState<boolean[]>([]);
  const [colorBlindAnswers, setColorBlindAnswers] = useState<boolean[]>([]);
  const [peripheralAnswers, setPeripheralAnswers] = useState<boolean[]>([]);

  // Hearing test state
  const [detectedFrequencies, setDetectedFrequencies] = useState<number[]>([]);
  const [leftEarResponses, setLeftEarResponses] = useState<boolean[]>([]);
  const [rightEarResponses, setRightEarResponses] = useState<boolean[]>([]);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    return () => {
      stopHearingTest();
    };
  }, []);

  // Vision Acuity Test (Simplified Snellen chart)
  const visionTestLetters = ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D'];
  const [currentVisionLetter, setCurrentVisionLetter] = useState(0);

  const handleVisionAnswer = (correct: boolean) => {
    const newAnswers = [...visionTestAnswers, correct];
    setVisionTestAnswers(newAnswers);

    if (currentVisionLetter < visionTestLetters.length - 1) {
      setCurrentVisionLetter(currentVisionLetter + 1);
    } else {
      // Move to color blindness test
      setActiveTab('vision'); // Keep on vision tab but switch content internally if we separated them
    }
  };

  // Color Blindness Test (Simplified Ishihara)
  const colorBlindTests = [
    { correct: true, description: 'Can you see the number 12?', number: '12' },
    { correct: true, description: 'Can you see the number 8?', number: '8' },
    { correct: false, description: 'Can you see the number 5?', number: '5' },
    { correct: true, description: 'Can you see the number 29?', number: '29' },
    { correct: false, description: 'Can you see the number 74?', number: '74' },
  ];
  const [currentColorTest, setCurrentColorTest] = useState(0);

  const handleColorBlindAnswer = (answer: boolean) => {
    const newAnswers = [...colorBlindAnswers, answer === colorBlindTests[currentColorTest].correct];
    setColorBlindAnswers(newAnswers);

    if (currentColorTest < colorBlindTests.length - 1) {
      setCurrentColorTest(currentColorTest + 1);
    }
  };

  // Hearing Test
  const testFrequencies = [250, 500, 1000, 2000, 4000, 8000]; // Hz
  const [currentFreqIndex, setCurrentFreqIndex] = useState(0);
  const [hearingTestEar, setHearingTestEar] = useState<'left' | 'right'>('left');

  const playFrequency = (frequency: number) => {
    try {
      setIsPlaying(true);
      setWaitingForResponse(true);

      // Stop any existing oscillator first
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {
          // Oscillator may already be stopped
        }
        oscillatorRef.current = null;
      }

      // Reuse existing audio context if available, otherwise create new one
      let audioContext = audioContextRef.current;
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
      }

      // Resume audio context if suspended (required for user interaction)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Create stereo panner to direct sound to specific ear
      const panner = audioContext.createStereoPanner();

      // Set pan value: -1 = left ear, 1 = right ear, 0 = center
      // This works with stereo speakers and Bluetooth headphones
      panner.pan.value = hearingTestEar === 'left' ? -1 : 1;

      oscillator.frequency.value = frequency;

      // Fade in/out to avoid clicking sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.0);

      // Connect: oscillator -> gain -> panner -> destination
      oscillator.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(audioContext.destination);

      oscillatorRef.current = oscillator;
      setCurrentFrequency(frequency);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1); // Play for 1 second

      setTimeout(() => {
        setIsPlaying(false);
        // Note: We do NOT set currentFrequency to null here, so buttons stay visible
      }, 1000);
    } catch (error) {
      console.error('Error playing frequency:', error);
      setIsPlaying(false);
      setWaitingForResponse(false);
    }
  };

  const handleHearingResponse = (heard: boolean) => {
    setWaitingForResponse(false);
    setCurrentFrequency(null); // Reset frequency display

    if (hearingTestEar === 'left') {
      const newResponses = [...leftEarResponses, heard];
      setLeftEarResponses(newResponses);
      if (heard) {
        setDetectedFrequencies([...detectedFrequencies, testFrequencies[currentFreqIndex]]);
      }

      if (currentFreqIndex < testFrequencies.length - 1) {
        setCurrentFreqIndex(currentFreqIndex + 1);
      } else {
        // Switch to right ear
        setHearingTestEar('right');
        setCurrentFreqIndex(0);
      }
    } else {
      const newResponses = [...rightEarResponses, heard];
      setRightEarResponses(newResponses);
      if (heard) {
        setDetectedFrequencies([...detectedFrequencies, testFrequencies[currentFreqIndex]]);
      }

      if (currentFreqIndex < testFrequencies.length - 1) {
        setCurrentFreqIndex(currentFreqIndex + 1);
      } else {
        // Test complete
        calculateResults();
      }
    }
  };

  const stopHearingTest = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsPlaying(false);
  };

  const calculateResults = () => {
    // Validate that we have enough data before calculating
    if (visionTestAnswers.length === 0 || colorBlindAnswers.length === 0) {
      // Allow calculating just hearing results if vision not done, or vice versa
      if (detectedFrequencies.length === 0 && leftEarResponses.length === 0) {
        console.error('Cannot calculate results: insufficient data');
        return;
      }
    }

    let visionOverall = { overallScore: 0, recommendations: [] as string[] };
    let visualAcuity: any = { snellenEquivalent: 'N/A' };
    let colorBlindness: any = { type: 'N/A' };
    let peripheralVision: any = { score: 0 };

    // Vision results
    if (visionTestAnswers.length > 0) {
      visualAcuity = calculateVisualAcuity(
        visionTestAnswers.filter(a => a).length,
        visionTestAnswers.length
      );

      colorBlindness = analyzeColorBlindness(
        colorBlindAnswers.filter(a => a).length,
        colorBlindAnswers.length,
        { redGreen: 2, blueYellow: 1 } // Simplified error pattern
      );

      peripheralVision = peripheralAnswers.length > 0
        ? analyzePeripheralVision(
          peripheralAnswers.filter(a => a).length,
          peripheralAnswers.length,
          peripheralAnswers.filter(a => !a).length
        )
        : {
          score: 100, // Default to normal if test not taken
          blindSpots: 0,
          fieldOfVision: 180,
          interpretation: 'Peripheral vision test not completed.'
        };

      visionOverall = calculateOverallVisionScore(visualAcuity, colorBlindness, peripheralVision);
    }

    // Hearing results
    const hearingResult = analyzeHearingTest(
      detectedFrequencies.length > 0 ? detectedFrequencies : [],
      leftEarResponses,
      rightEarResponses
    );

    const combinedResults = {
      timestamp: new Date().toISOString(),
      vision: {
        visualAcuity,
        colorBlindness,
        peripheralVision,
        overallScore: visionOverall.overallScore,
        recommendations: visionOverall.recommendations
      },
      hearing: hearingResult
    };

    setResults(combinedResults);
    setActiveTab('results');

    // Save vision test if data exists
    if (visionTestAnswers.length > 0) {
      try {
        const visionTestResult: HealthTestResult = {
          id: generateTestResultId('vision-test'),
          testType: 'vision-test',
          category: 'vision-hearing',
          testDate: combinedResults.timestamp,
          timestamp: combinedResults.timestamp,
          data: combinedResults.vision,
          score: visionOverall.overallScore,
          maxScore: 100,
          scorePercentage: visionOverall.overallScore,
          riskLevel: visionOverall.overallScore >= 80 ? 'low' : visionOverall.overallScore >= 60 ? 'medium' : 'high',
          interpretation: `Visual Acuity: ${visualAcuity.snellenEquivalent} | Color Vision: ${colorBlindness.type}`,
          recommendations: visionOverall.recommendations,
          status: 'final',
        };
        saveTestResult(visionTestResult);
      } catch (error) {
        console.error('Error saving vision test:', error);
      }
    }

    // Save hearing test if data exists
    if (leftEarResponses.length > 0) {
      try {
        const hearingTestResult: HealthTestResult = {
          id: generateTestResultId('hearing-test'),
          testType: 'hearing-test',
          category: 'vision-hearing',
          testDate: combinedResults.timestamp,
          timestamp: combinedResults.timestamp,
          data: combinedResults.hearing,
          score: hearingResult.overallScore,
          maxScore: 100,
          scorePercentage: hearingResult.overallScore,
          riskLevel: hearingResult.overallScore >= 80 ? 'low' : hearingResult.overallScore >= 60 ? 'medium' : 'high',
          interpretation: `Frequency Range: ${hearingResult.frequencyRange.lowFreq}-${hearingResult.frequencyRange.highFreq}Hz | Sensitivity: ${hearingResult.sensitivity.average}%`,
          recommendations: hearingResult.recommendations,
          status: 'final',
        };
        saveTestResult(hearingTestResult);
      } catch (error) {
        console.error('Error saving hearing test:', error);
      }
    }
  };

  // Vision test is complete when all letters are answered AND all color blindness tests are done
  const visionComplete = visionTestAnswers.length >= visionTestLetters.length && colorBlindAnswers.length >= colorBlindTests.length;
  const hearingComplete = leftEarResponses.length >= testFrequencies.length && rightEarResponses.length >= testFrequencies.length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="text-center space-y-3 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Eye className="w-5 h-5" />
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
            <Ear className="w-5 h-5" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Vision & Hearing Lab</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Comprehensive assessment for visual acuity, color discrimination, and calibrated auditory sensitivity
        </p>
        <div className="flex justify-center gap-2 pt-1">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/30">Interactive Tests</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/30">Calibrated Audio</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-1 sm:px-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <div className="flex justify-center max-w-md mx-auto">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-1 rounded-xl">
              <TabsTrigger
                value="vision"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm font-semibold text-slate-600 dark:text-slate-400 text-xs sm:text-sm transition-all"
              >
                Vision
              </TabsTrigger>
              <TabsTrigger
                value="hearing"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-sm font-semibold text-slate-600 dark:text-slate-400 text-xs sm:text-sm transition-all"
              >
                Hearing
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm font-semibold text-slate-600 dark:text-slate-400 text-xs sm:text-sm transition-all disabled:opacity-40"
                disabled={(!visionComplete && !hearingComplete)}
              >
                Results
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="vision" className="space-y-6">
            {/* Visual Acuity Test */}
            <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4 px-6">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-500" />
                  Visual Acuity Test
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-xs">
                  Identify the letters shown (Test {currentVisionLetter + 1} of {visionTestLetters.length})
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {currentVisionLetter < visionTestLetters.length ? (
                  <div className="text-center space-y-6 py-2">
                    <div className="bg-slate-100 dark:bg-white rounded-2xl w-44 h-44 mx-auto flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-300">
                      <div className="text-8xl font-black text-slate-950 font-serif select-none">
                        {visionTestLetters[currentVisionLetter]}
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Stand approximately 2 meters (6.5 feet) away from your screen</p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => handleVisionAnswer(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm min-w-[130px] font-semibold"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Correct
                      </Button>
                      <Button
                        onClick={() => handleVisionAnswer(false)}
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm min-w-[130px] font-semibold"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Incorrect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30 rounded-xl flex items-center justify-center mx-auto">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Visual Acuity Complete</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Proceed to color discrimination test below.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Color Blindness Test */}
            {visionTestAnswers.length >= visionTestLetters.length && (
              <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4 px-6">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    Color Discrimination Test (Ishihara Matrix)
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 text-xs">
                    Plate {currentColorTest + 1} of {colorBlindTests.length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {currentColorTest < colorBlindTests.length ? (
                    <div className="text-center space-y-6 py-2">
                      <div className="flex items-center justify-center">
                        <div className="w-56 h-56 rounded-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400 flex items-center justify-center relative overflow-hidden shadow-md ring-4 ring-slate-200/50 dark:ring-white/10">
                          {/* Noise overlay to simulate Ishihara plates */}
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50"></div>
                          <div className="relative z-10 text-white text-6xl font-black font-serif drop-shadow-lg select-none">
                            {colorBlindTests[currentColorTest].number}
                          </div>
                        </div>
                      </div>
                      <div className="text-base font-semibold text-slate-900 dark:text-white">
                        {colorBlindTests[currentColorTest].description}
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => handleColorBlindAnswer(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm min-w-[120px] font-semibold"
                        >
                          Yes, Visible
                        </Button>
                        <Button
                          onClick={() => handleColorBlindAnswer(false)}
                          className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm min-w-[120px] font-semibold"
                        >
                          No, Not Visible
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30 rounded-xl flex items-center justify-center mx-auto">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vision Assessment Complete</h3>
                      <Button
                        onClick={() => setActiveTab('hearing')}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm font-semibold px-6"
                      >
                        Proceed to Hearing Test →
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="hearing" className="space-y-6">
            <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4 px-6">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Ear className="w-5 h-5 text-purple-500" />
                      Pure-Tone Hearing Audiometry
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                      Testing <span className="font-bold text-purple-600 dark:text-purple-400 uppercase">{hearingTestEar} EAR</span> • Frequency {currentFreqIndex + 1} of {testFrequencies.length}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-purple-200 dark:border-purple-800/30 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/20 font-semibold text-xs">
                    Use Headphones
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center space-y-8 py-4">
                  <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                    {isPlaying && (
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping"></div>
                    )}
                    <div className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 ${
                      isPlaying
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-[0_0_25px_rgba(168,85,247,0.25)]'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]'
                    }`}>
                      <Volume2 className={`w-10 h-10 mb-1.5 transition-colors ${isPlaying ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                      <div className="text-xl font-black text-slate-900 dark:text-white">
                        {testFrequencies[currentFreqIndex]} <span className="text-xs font-normal text-slate-500">Hz</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {!waitingForResponse ? (
                      <Button
                        onClick={() => playFrequency(testFrequencies[currentFreqIndex])}
                        className="bg-purple-600 hover:bg-purple-700 text-white h-11 px-8 rounded-xl font-semibold shadow-sm"
                        disabled={isPlaying}
                      >
                        {isPlaying ? (
                          <span>Emitting Tone...</span>
                        ) : (
                          <span className="flex items-center">
                            <Play className="w-4 h-4 mr-2 fill-current" /> Play Tone
                          </span>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Did you hear the acoustic tone?</p>
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={() => handleHearingResponse(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm min-w-[140px] font-semibold"
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Yes, Heard It
                          </Button>
                          <Button
                            onClick={() => handleHearingResponse(false)}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm min-w-[140px] font-semibold"
                          >
                            <XCircle className="w-4 h-4 mr-1.5" />
                            No, Inaudible
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playFrequency(testFrequencies[currentFreqIndex])}
                          className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs mt-1"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Replay Tone
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-white/[0.02] rounded-xl p-3.5 max-w-md mx-auto border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-200">Protocol:</strong> Press "Play Tone". A frequency will play for 1 second in your {hearingTestEar} ear.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {results ? (
              <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Vision & Hearing Assessment Results</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                        Generated: {new Date(results.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/30 px-3 py-1 rounded-full text-xs font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Analysis Complete</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {/* Vision Results */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-500" />
                      Vision Assessment
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-200/60 dark:border-indigo-800/30">
                        <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Visual Acuity</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{results.vision.visualAcuity.snellenEquivalent || 'N/A'}</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200/60 dark:border-purple-800/30">
                        <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Color Vision</div>
                        <div className="text-base font-bold text-slate-900 dark:text-white leading-tight mt-1">{results.vision.colorBlindness.type || 'N/A'}</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200/60 dark:border-blue-800/30">
                        <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Peripheral</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{results.vision.peripheralVision.score}%</div>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-800/30">
                        <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Overall Vision Score</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{results.vision.overallScore}<span className="text-xs font-normal text-slate-500">/100</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Hearing Results */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Ear className="w-4 h-4 text-purple-500" />
                      Hearing Assessment
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200/60 dark:border-purple-800/30">
                        <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Frequency Range</div>
                        <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {results.hearing.frequencyRange.lowFreq}-{results.hearing.frequencyRange.highFreq} <span className="text-xs font-normal text-slate-500">Hz</span>
                        </div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/60 dark:border-amber-800/30">
                        <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Left Ear Sensitivity</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{results.hearing.sensitivity.leftEar}%</div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/60 dark:border-amber-800/30">
                        <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Right Ear Sensitivity</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{results.hearing.sensitivity.rightEar}%</div>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-800/30">
                        <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Overall Hearing Score</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{results.hearing.overallScore}<span className="text-xs font-normal text-slate-500">/100</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-3 bg-slate-50 dark:bg-white/[0.02] p-5 rounded-xl border border-slate-200/80 dark:border-white/10">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Clinical Recommendations</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {results.vision.recommendations.map((rec: string, idx: number) => (
                        <li key={`vision-${idx}`} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                      {results.hearing.recommendations.map((rec: string, idx: number) => (
                        <li key={`hearing-${idx}`} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Disclaimer */}
                  <div className="text-xs text-amber-800 dark:text-amber-200 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/40 flex gap-2.5">
                    <div className="text-base">⚠️</div>
                    <div className="leading-relaxed">
                      <strong className="text-amber-900 dark:text-amber-300 block mb-0.5">Clinical Disclaimer</strong>
                      These tests are calibrated screening tools for preliminary evaluation. They do not replace formal examinations by an optometrist or audiologist.
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm text-center py-12 p-6">
                <CardContent>
                  <div className="opacity-40 mb-3 text-4xl">📊</div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Results Yet</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                    Complete the vision and hearing screening protocols to generate your integrated report.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VisionHearingLab;

