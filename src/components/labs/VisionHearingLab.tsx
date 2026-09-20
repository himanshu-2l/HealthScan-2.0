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
import { GlassNavbar } from '@/components/GlassNavbar';
import { SiteFooter } from '@/components/SiteFooter';

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
    let visualAcuity = { snellenEquivalent: 'N/A' };
    let colorBlindness = { type: 'N/A' };
    let peripheralVision = { score: 0 };

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center space-y-4 glass-panel p-8 mb-8 border-l-4 border-indigo-500">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-indigo-500/20 rounded-full">
              <Eye className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="p-3 bg-purple-500/20 rounded-full">
              <Ear className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">Vision & Hearing Lab</h1>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Comprehensive assessment for visual acuity, color blindness, and audio frequency sensitivity
          </p>
          <div className="flex justify-center gap-2">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Interactive Tests</Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Calibrated Audio</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="glass-pill p-1 bg-white/5 border border-white/10">
              <TabsTrigger
                value="vision"
                className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-gray-400 rounded-full px-6 transition-all"
              >
                Vision Tests
              </TabsTrigger>
              <TabsTrigger
                value="hearing"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-gray-400 rounded-full px-6 transition-all"
              >
                Hearing Test
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white text-gray-400 rounded-full px-6 transition-all"
                disabled={(!visionComplete && !hearingComplete)}
              >
                Results
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="vision" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Visual Acuity Test */}
            <Card className="glass-panel border-l-4 border-indigo-500">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-400" />
                  Visual Acuity Test
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Identify the letters shown (Test {currentVisionLetter + 1} of {visionTestLetters.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentVisionLetter < visionTestLetters.length ? (
                  <div className="text-center space-y-8 py-4">
                    <div className="bg-white rounded-lg w-48 h-48 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <div className="text-9xl font-bold text-black font-serif">
                        {visionTestLetters[currentVisionLetter]}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">Stand 2 meters (6.5 feet) away from your screen</p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={() => handleVisionAnswer(true)}
                        className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Correct
                      </Button>
                      <Button
                        onClick={() => handleVisionAnswer(false)}
                        className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Incorrect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Visual acuity test complete!</h3>
                    <p className="text-gray-400">Proceed to color blindness test below.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Color Blindness Test */}
            {visionTestAnswers.length >= visionTestLetters.length && (
              <Card className="glass-panel border-l-4 border-pink-500 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-pink-400" />
                    Color Blindness Test
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Test {currentColorTest + 1} of {colorBlindTests.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentColorTest < colorBlindTests.length ? (
                    <div className="text-center space-y-6 py-4">
                      <div className="flex items-center justify-center">
                        <div className="w-64 h-64 rounded-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400 flex items-center justify-center relative overflow-hidden ring-4 ring-white/10">
                          {/* Noise overlay to simulate Ishihara plates */}
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50"></div>
                          <div className="relative z-10 text-white/90 text-7xl font-bold font-serif drop-shadow-md">
                            {colorBlindTests[currentColorTest].number}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg text-white font-medium">
                        {colorBlindTests[currentColorTest].description}
                      </div>
                      <div className="flex gap-4 justify-center">
                        <Button
                          onClick={() => handleColorBlindAnswer(true)}
                          className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                        >
                          Yes
                        </Button>
                        <Button
                          onClick={() => handleColorBlindAnswer(false)}
                          className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">All vision tests complete!</h3>
                      <Button
                        onClick={() => setActiveTab('hearing')}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Proceed to Hearing Test
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="hearing" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="glass-panel border-l-4 border-purple-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Ear className="w-5 h-5 text-purple-400" />
                      Hearing Sensitivity Test
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      Testing <span className="font-bold text-purple-400 uppercase">{hearingTestEar} EAR</span> • Frequency {currentFreqIndex + 1} of {testFrequencies.length}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/10">
                    Use Headphones
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-10 py-8">
                  <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                    {isPlaying && (
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping"></div>
                    )}
                    <div className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 ${isPlaying
                      ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                      : 'border-white/10 bg-white/5'
                      }`}>
                      <Volume2 className={`w-12 h-12 mb-2 transition-colors ${isPlaying ? 'text-purple-400' : 'text-gray-500'}`} />
                      <div className="text-2xl font-bold text-white">
                        {testFrequencies[currentFreqIndex]} <span className="text-sm font-normal text-gray-400">Hz</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {!waitingForResponse ? (
                      <Button
                        onClick={() => playFrequency(testFrequencies[currentFreqIndex])}
                        className="bg-purple-600 hover:bg-purple-700 text-white h-12 px-8 text-lg shadow-lg shadow-purple-900/20"
                        disabled={isPlaying}
                      >
                        {isPlaying ? (
                          <span className="flex items-center">Playing Tone...</span>
                        ) : (
                          <span className="flex items-center">
                            <Play className="w-5 h-5 mr-2 fill-current" /> Play Tone
                          </span>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-lg text-gray-300">Did you hear the tone?</p>
                        <div className="flex gap-4 justify-center">
                          <Button
                            onClick={() => handleHearingResponse(true)}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[140px] h-12 text-lg"
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Yes, I heard it
                          </Button>
                          <Button
                            onClick={() => handleHearingResponse(false)}
                            className="bg-red-600 hover:bg-red-700 text-white min-w-[140px] h-12 text-lg"
                          >
                            <XCircle className="w-5 h-5 mr-2" />
                            No, I didn't
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playFrequency(testFrequencies[currentFreqIndex])}
                          className="text-gray-400 hover:text-white mt-2"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Replay Tone
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 max-w-md mx-auto border border-white/10">
                    <p className="text-sm text-gray-400">
                      <strong className="text-gray-300">Instruction:</strong> Press "Play Tone". A sound will play for 1 second in your {hearingTestEar} ear. Indicate if you heard it.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {results ? (
              <Card className="glass-panel border-l-4 border-green-500">
                <CardHeader className="border-b border-white/10 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-2xl">Vision & Hearing Assessment Results</CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        Generated: {new Date(results.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    {/* Overall Score Badge */}
                    <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-500/30">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-green-300 font-bold">Analysis Complete</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  {/* Vision Results */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                      <Eye className="w-5 h-5 text-indigo-400" />
                      Vision Assessment
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                        <div className="text-sm text-indigo-300 mb-1">Visual Acuity</div>
                        <div className="text-2xl font-bold text-white">{results.vision.visualAcuity.snellenEquivalent || 'N/A'}</div>
                      </div>
                      <div className="bg-pink-500/10 p-4 rounded-xl border border-pink-500/20">
                        <div className="text-sm text-pink-300 mb-1">Color Vision</div>
                        <div className="text-lg font-bold text-white leading-tight mt-1">{results.vision.colorBlindness.type || 'N/A'}</div>
                      </div>
                      <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                        <div className="text-sm text-blue-300 mb-1">Peripheral</div>
                        <div className="text-2xl font-bold text-white">{results.vision.peripheralVision.score}%</div>
                      </div>
                      <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                        <div className="text-sm text-emerald-300 mb-1">Overall Score</div>
                        <div className="text-2xl font-bold text-white">{results.vision.overallScore}/100</div>
                      </div>
                    </div>
                  </div>

                  {/* Hearing Results */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                      <Ear className="w-5 h-5 text-purple-400" />
                      Hearing Assessment
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                        <div className="text-sm text-purple-300 mb-1">Frequency Range</div>
                        <div className="text-lg font-bold text-white">
                          {results.hearing.frequencyRange.lowFreq}-{results.hearing.frequencyRange.highFreq}Hz
                        </div>
                      </div>
                      <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
                        <div className="text-sm text-orange-300 mb-1">Left Ear Sensitivity</div>
                        <div className="text-2xl font-bold text-white">{results.hearing.sensitivity.leftEar}%</div>
                      </div>
                      <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
                        <div className="text-sm text-orange-300 mb-1">Right Ear Sensitivity</div>
                        <div className="text-2xl font-bold text-white">{results.hearing.sensitivity.rightEar}%</div>
                      </div>
                      <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                        <div className="text-sm text-emerald-300 mb-1">Overall Score</div>
                        <div className="text-2xl font-bold text-white">{results.hearing.overallScore}/100</div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-4 bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="font-semibold text-lg text-white">Clinical Recommendations</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {results.vision.recommendations.map((rec: string, idx: number) => (
                        <li key={`vision-${idx}`} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                      {results.hearing.recommendations.map((rec: string, idx: number) => (
                        <li key={`hearing-${idx}`} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Disclaimer */}
                  <div className="text-xs text-yellow-200/80 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20 flex gap-3">
                    <div className="text-xl">⚠️</div>
                    <div>
                      <strong className="text-yellow-200 block mb-1">Important Disclaimer</strong>
                      These tests are simplified screening tools. They do not replace professional eye or hearing examinations.
                      Always consult qualified healthcare professionals for accurate vision and hearing assessments.
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-panel text-center py-12">
                <CardContent>
                  <div className="opacity-50 mb-4 text-6xl">📊</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Results Yet</h3>
                  <p className="text-gray-400 max-w-sm mx-auto">
                    Complete both the vision and hearing tests to generate your comprehensive medical report.
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

