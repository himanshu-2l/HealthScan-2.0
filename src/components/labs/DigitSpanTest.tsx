  import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Play, RotateCcw, CheckCircle, XCircle, Clock, Target, AlertTriangle, FileText, Zap, Activity } from 'lucide-react';
import { saveTestResult, generateTestResultId } from '@/services/healthDataService';
import { HealthTestResult } from '@/types/health';

// Types
type TestType = 'forward' | 'backward' | null;
type TestPhase = 'instructions' | 'practice' | 'running' | 'input' | 'feedback' | 'complete';

interface TrialData {
  level: number;
  sequence: number[];
  userInput: number[];
  correct: boolean;
  responseTime: number;
  timestamp: string;
}

interface TestResults {
  forwardSpan: number;
  backwardSpan: number;
  forwardTrials: TrialData[];
  backwardTrials: TrialData[];
  totalDuration: number;
  interpretation: {
    forwardLevel: 'Normal' | 'Mild Concern' | 'High Concern';
    backwardLevel: 'Normal' | 'Mild Concern' | 'High Concern';
    overallRisk: 'Low' | 'Medium' | 'High';
  };
}

// Digit Display Component
const DigitDisplay: React.FC<{ digit: number | null; isVisible: boolean }> = ({ digit, isVisible }) => {
  return (
    <div className="flex items-center justify-center h-40 w-40 mx-auto">
      <div className={`text-8xl font-bold transition-all duration-300 ${isVisible && digit !== null
        ? 'opacity-100 scale-100 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]'
        : 'opacity-0 scale-75 text-muted-foreground'
        }`}>
        {digit !== null ? digit : ''}
      </div>
    </div>
  );
};

// Input Interface Component
const InputInterface: React.FC<{
  onSubmit: (digits: number[]) => void;
  onClear: () => void;
  currentInput: number[];
  expectedLength: number;
  isBackward: boolean;
  onInputChange: (input: number[]) => void;
}> = ({ onSubmit, onClear, currentInput, expectedLength, isBackward, onInputChange }) => {
  const handleNumberClick = (num: number) => {
    if (currentInput.length < expectedLength) {
      const newInput = [...currentInput, num];
      onInputChange(newInput);
      if (newInput.length === expectedLength) {
        setTimeout(() => onSubmit(newInput), 100);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Enter the digits {isBackward ? 'in REVERSE order' : 'in the same order'}
        </h3>
        <div className="flex justify-center gap-3 mb-5">
          {Array.from({ length: expectedLength }, (_, i) => (
            <div
              key={i}
              className={`w-16 h-16 border rounded-lg flex items-center justify-center text-2xl font-bold transition-all ${currentInput[i] !== undefined
                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                : 'border-white/10 bg-white/5 text-muted-foreground'
                }`}
            >
              {currentInput[i] !== undefined ? currentInput[i] : '?'}
            </div>
          ))}
        </div>
        <p className="text-base text-muted-foreground font-medium">
          0-9 / {currentInput.length} {currentInput.length === 1 ? 'digit' : 'digits'} entered
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            size="lg"
            className="h-20 text-2xl font-bold bg-white/5 border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 hover:text-white disabled:opacity-50 transition-all"
            onClick={() => handleNumberClick(num)}
            disabled={currentInput.length >= expectedLength}
          >
            {num}
          </Button>
        ))}
        <Button
          variant="outline"
          size="lg"
          className="h-20 text-2xl font-bold bg-white/5 border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 hover:text-white disabled:opacity-50 transition-all"
          onClick={() => handleNumberClick(0)}
          disabled={currentInput.length >= expectedLength}
        >
          0
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-20 col-span-2 bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 font-bold transition-all"
          onClick={() => {
            onInputChange([]);
            onClear();
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

// Results Display Component
const ResultsDisplay: React.FC<{ results: TestResults; onRestart: () => void }> = ({ results, onRestart }) => {
  const getScoreColor = (level: string) => {
    switch (level) {
      case 'Normal': return 'text-green-500';
      case 'Mild Concern': return 'text-yellow-500';
      case 'High Concern': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getScoreBadge = (level: string) => {
    switch (level) {
      case 'Normal': return 'default';
      case 'Mild Concern': return 'secondary';
      case 'High Concern': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center glass-panel p-6 border-l-4 border-indigo-500">
        <h2 className="text-3xl font-bold text-foreground mb-3">Digit Span Test Results</h2>
        <p className="text-lg text-muted-foreground">Memory assessment complete</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-panel border-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Forward Span
            </CardTitle>
            <CardDescription className="text-muted-foreground">Digits remembered in correct order</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-5xl font-bold text-blue-400 drop-shadow-md">{results.forwardSpan}</div>
              <Badge className={
                results.interpretation.forwardLevel === 'Normal' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border-0' :
                  results.interpretation.forwardLevel === 'Mild Concern' ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border-0' :
                    'bg-red-500/20 text-red-300 hover:bg-red-500/30 border-0'
              }>
                {results.interpretation.forwardLevel}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Normal: 7±2 | Concern: &lt;5
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50"></div>
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle className="text-foreground flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-400" />
              Backward Span
            </CardTitle>
            <CardDescription className="text-muted-foreground">Digits remembered in reverse order</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-5xl font-bold text-purple-400 drop-shadow-md">{results.backwardSpan}</div>
              <Badge className={
                results.interpretation.backwardLevel === 'Normal' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border-0' :
                  results.interpretation.backwardLevel === 'Mild Concern' ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border-0' :
                    'bg-red-500/20 text-red-300 hover:bg-red-500/30 border-0'
              }>
                {results.interpretation.backwardLevel}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Normal: 5±2 | Concern: &lt;3
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
        <CardHeader className="bg-white/5 border-b border-white/5">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-green-400" />
            Overall Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              {results.interpretation.overallRisk === 'Low' && <CheckCircle className="w-8 h-8 text-green-400" />}
              {results.interpretation.overallRisk === 'Medium' && <AlertTriangle className="w-8 h-8 text-yellow-400" />}
              {results.interpretation.overallRisk === 'High' && <XCircle className="w-8 h-8 text-red-400" />}
              <span className={`text-2xl font-bold ${results.interpretation.overallRisk === 'Low' ? 'text-green-400' :
                results.interpretation.overallRisk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                {results.interpretation.overallRisk} Risk
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-4">
              <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="font-semibold text-foreground mb-1">Test Duration</div>
                <div className="text-xl font-bold text-blue-400">{Math.round(results.totalDuration / 1000)}s</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="font-semibold text-foreground mb-1">Forward Trials</div>
                <div className="text-xl font-bold text-green-400">{results.forwardTrials.length}</div>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="font-semibold text-foreground mb-1">Backward Trials</div>
                <div className="text-xl font-bold text-purple-400">{results.backwardTrials.length}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={onRestart} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          <Play className="w-4 h-4 mr-2" />
          Take Test Again
        </Button>
        <Button variant="outline" className="flex-1 border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:text-white" onClick={() => {
          const dataStr = JSON.stringify(results, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `digit-span-results-${new Date().toISOString().split('T')[0]}.json`;
          link.click();
          URL.revokeObjectURL(url);
        }}>
          <FileText className="w-4 h-4 mr-2" />
          Export Results
        </Button>
      </div>
    </div>
  );
};

// Main Component
export const DigitSpanTest: React.FC = () => {
  // State management
  const [currentTest, setCurrentTest] = useState<TestType>(null);
  const [testPhase, setTestPhase] = useState<TestPhase>('instructions');
  const [currentLevel, setCurrentLevel] = useState(3);
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [showDigit, setShowDigit] = useState(false);
  const [currentDigit, setCurrentDigit] = useState<number | null>(null);

  // Results tracking
  const [forwardTrials, setForwardTrials] = useState<TrialData[]>([]);
  const [backwardTrials, setBackwardTrials] = useState<TrialData[]>([]);
  const [forwardSpan, setForwardSpan] = useState(0);
  const [backwardSpan, setBackwardSpan] = useState(0);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [trialStartTime, setTrialStartTime] = useState<number>(0);
  const [testResults, setTestResults] = useState<TestResults | null>(null);

  // Refs
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random sequence
  const generateSequence = useCallback((length: number): number[] => {
    return Array.from({ length }, () => Math.floor(Math.random() * 10));
  }, []);

  // Start test
  const startTest = (testType: TestType) => {
    if (!testType) return;

    setCurrentTest(testType);
    setCurrentLevel(testType === 'forward' ? 3 : 2);
    setTestPhase('practice');
    setForwardTrials([]);
    setBackwardTrials([]);
    setForwardSpan(0);
    setBackwardSpan(0);
    setTestStartTime(Date.now());
    setTestResults(null);

    // Start with practice trial (always 2 digits for practice)
    setTimeout(() => {
      startTrial(2, true);
    }, 2000);
  };

  // Start individual trial
  const startTrial = useCallback((level: number, isPractice: boolean = false) => {
    const sequence = generateSequence(level);
    console.log(`Starting trial - Level: ${level}, Sequence: [${sequence.join(', ')}], Length: ${sequence.length}, Practice: ${isPractice}`);
    setCurrentSequence(sequence);
    setCurrentLevel(level); // Ensure level is set correctly
    setCurrentDigitIndex(0);
    setUserInput([]);
    setTrialStartTime(Date.now());

    if (!isPractice) {
      setTestPhase('running');
    }

    // Start showing digits
    showSequence(sequence);
  }, [generateSequence]);

  // Show digit sequence
  const showSequence = useCallback((sequence: number[]) => {
    let index = 0;

    const showNextDigit = () => {
      if (index < sequence.length) {
        setCurrentDigitIndex(index);
        setCurrentDigit(sequence[index]);
        setShowDigit(true);

        timeoutRef.current = setTimeout(() => {
          setShowDigit(false);
          setCurrentDigit(null);

          timeoutRef.current = setTimeout(() => {
            index++;
            if (index < sequence.length) {
              showNextDigit();
            } else {
              // Sequence complete, show input interface
              setCurrentDigitIndex(sequence.length);
              setTestPhase('input');
            }
          }, 200);
        }, 1000);
      }
    };

    showNextDigit();
  }, []);

  // Handle user input submission
  const handleInputSubmit = useCallback((input: number[]) => {
    const responseTime = Date.now() - trialStartTime;
    const expectedSequence = currentTest === 'backward' ? [...currentSequence].reverse() : currentSequence;
    const isCorrect = JSON.stringify(input) === JSON.stringify(expectedSequence);
    const isPractice = testPhase === 'practice';

    const trialData: TrialData = {
      level: currentLevel,
      sequence: currentSequence,
      userInput: input,
      correct: isCorrect,
      responseTime,
      timestamp: new Date().toISOString()
    };

    // Only add to trials array if not practice
    if (!isPractice) {
      if (currentTest === 'forward') {
        setForwardTrials(prev => [...prev, trialData]);
      } else {
        setBackwardTrials(prev => [...prev, trialData]);
      }
    }

    setTestPhase('feedback');

    // Show feedback
    setTimeout(() => {
      if (isPractice) {
        // After practice, start real test
        setTestPhase('running');
        const realStartLevel = currentTest === 'forward' ? 3 : 2;
        startTrial(realStartLevel);
      } else if (isCorrect) {
        // Correct answer - increase level
        const nextLevel = currentLevel + 1;
        const maxLevel = currentTest === 'forward' ? 9 : 7;

        if (nextLevel <= maxLevel) {
          startTrial(nextLevel);
        } else {
          // Reached maximum level
          finishCurrentTest(currentLevel);
        }
      } else {
        // Incorrect answer - finish current test
        finishCurrentTest(currentLevel - 1);
      }
    }, 2000);
  }, [currentTest, currentLevel, currentSequence, trialStartTime, testPhase, startTrial]);

  // Finish current test
  const finishCurrentTest = useCallback((finalSpan: number) => {
    if (currentTest === 'forward') {
      setForwardSpan(finalSpan);
      // Start backward test
      setCurrentTest('backward');
      setTestPhase('practice');
      setTimeout(() => startTrial(2, true), 1000); // Practice trial for backward test
    } else {
      setBackwardSpan(finalSpan);
      // Both tests complete
      completeAllTests(forwardSpan, finalSpan);
    }
  }, [currentTest, forwardSpan, startTrial]);

  // Complete all tests and generate results
  const completeAllTests = useCallback((fSpan: number, bSpan: number) => {
    const totalDuration = Date.now() - testStartTime;

    // Interpret results
    const forwardLevel = fSpan >= 5 ? 'Normal' : fSpan >= 4 ? 'Mild Concern' : 'High Concern';
    const backwardLevel = bSpan >= 3 ? 'Normal' : bSpan >= 2 ? 'Mild Concern' : 'High Concern';
    const overallRisk = (forwardLevel === 'High Concern' || backwardLevel === 'High Concern') ? 'High' :
      (forwardLevel === 'Mild Concern' || backwardLevel === 'Mild Concern') ? 'Medium' : 'Low';

    const results: TestResults = {
      forwardSpan: fSpan,
      backwardSpan: bSpan,
      forwardTrials,
      backwardTrials,
      totalDuration,
      interpretation: {
        forwardLevel,
        backwardLevel,
        overallRisk
      }
    };

    // Store results using new health data service
    const healthTestResult: HealthTestResult = {
      id: generateTestResultId('digit-span'),
      testType: 'digit-span',
      category: 'neurological',
      testDate: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      data: results,
      score: fSpan,
      maxScore: 9,
      scorePercentage: (fSpan / 9) * 100,
      riskLevel: overallRisk === 'Low' ? 'low' : overallRisk === 'Medium' ? 'medium' : 'high',
      interpretation: `Forward Span: ${fSpan}, Backward Span: ${bSpan}`,
      recommendations: [],
      duration: totalDuration,
      status: 'final',
    };

    saveTestResult(healthTestResult);

    // Also save to legacy format for backward compatibility
    const existingResults = JSON.parse(localStorage.getItem('digitSpanHistory') || '[]');
    existingResults.push({ ...results, timestamp: new Date().toISOString() });
    localStorage.setItem('digitSpanHistory', JSON.stringify(existingResults));

    setTestResults(results);
    setTestPhase('complete');
  }, [testStartTime, forwardTrials, backwardTrials]);

  // Clear input
  const clearInput = () => {
    setUserInput([]);
  };

  // Handle input change
  const handleInputChange = (input: number[]) => {
    setUserInput(input);
  };

  // Reset test
  const resetTest = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCurrentTest(null);
    setTestPhase('instructions');
    setCurrentLevel(3);
    setCurrentSequence([]);
    setUserInput([]);
    setShowDigit(false);
    setCurrentDigit(null);
    setTestResults(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-8 pt-24 min-h-screen pb-12">
      {/* Header */}
      <div className="text-center space-y-4 glass-panel p-6 relative overflow-hidden max-w-4xl mx-auto">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-indigo-400" />
          <h1 className="text-4xl font-bold text-foreground">Digit Span Test</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Assess working memory and cognitive function through digit sequence recall
        </p>
        <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/20 mt-2 flex items-center gap-2 w-fit mx-auto">
          <Target className="w-3 h-3" /> Memory Assessment
        </Badge>
      </div>

      {testPhase === 'instructions' && (
        <div className="max-w-2xl mx-auto px-4">
          <Card className="glass-panel border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-foreground">Test Instructions</CardTitle>
              <CardDescription className="text-muted-foreground">Please read carefully before starting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Forward Test:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You'll see a sequence of digits displayed one at a time. After the sequence ends,
                    enter the digits in the same order you saw them.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Backward Test:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Similar to forward test, but you must enter the digits in reverse order.
                  </p>
                </div>
                <div className="bg-yellow-500/10 p-5 rounded-lg border border-yellow-500/20">
                  <p className="text-sm text-yellow-100/80">
                    <strong className="text-yellow-400">Note:</strong> The test will start with a practice trial, then gradually
                    increase difficulty. The test ends when you make an error or reach the maximum level.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <Button onClick={() => startTest('forward')} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(testPhase === 'practice' || testPhase === 'running') && (
        <div className="max-w-lg mx-auto px-4">
          <Card className="glass-panel border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50"></div>
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-foreground text-center text-xl">
                {testPhase === 'practice' ? 'Practice Trial' : `${currentTest?.toUpperCase()} Test`}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-center">
                Level {currentLevel} - {currentLevel} digits
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <p className="text-base text-muted-foreground font-medium">
                  Watch the digits carefully...
                </p>
                <DigitDisplay digit={currentDigit} isVisible={showDigit} />
                <div className="space-y-2">
                  <Progress value={(currentDigitIndex / currentSequence.length) * 100} className="h-2 bg-white/10" indicatorClassName="bg-purple-500" />
                  <p className="text-sm text-muted-foreground">
                    Digit {currentDigitIndex + 1} of {currentSequence.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {testPhase === 'input' && (
        <div className="max-w-lg mx-auto px-4">
          <Card className="glass-panel border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-foreground text-center text-xl">Enter the Digits</CardTitle>
              <CardDescription className="text-muted-foreground text-center">
                Level {currentLevel} - {currentTest === 'backward' ? 'Reverse Order' : 'Same Order'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <InputInterface
                onSubmit={handleInputSubmit}
                onClear={clearInput}
                currentInput={userInput}
                expectedLength={currentLevel}
                isBackward={currentTest === 'backward'}
                onInputChange={handleInputChange}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {testPhase === 'feedback' && (
        <div className="max-w-lg mx-auto px-4">
          <Card className="glass-panel border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/50"></div>
            <CardContent className="text-center py-10">
              <div className="space-y-5">
                {JSON.stringify(userInput) === JSON.stringify(
                  currentTest === 'backward' ? [...currentSequence].reverse() : currentSequence
                ) ? (
                  <>
                    <CheckCircle className="w-20 h-20 text-green-400 mx-auto drop-shadow-lg" />
                    <h3 className="text-2xl font-bold text-green-400">Correct!</h3>
                    <p className="text-base text-muted-foreground">Well done! Moving to next level...</p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-20 h-20 text-red-400 mx-auto drop-shadow-lg" />
                    <h3 className="text-2xl font-bold text-red-400">Incorrect</h3>
                    <p className="text-base text-muted-foreground">
                      Correct sequence: <span className="font-semibold text-foreground">{(currentTest === 'backward' ? [...currentSequence].reverse() : currentSequence).join(' ')}</span>
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {testPhase === 'complete' && testResults && (
        <div className="max-w-4xl mx-auto px-4">
          <ResultsDisplay results={testResults} onRestart={resetTest} />
        </div>
      )}

      {currentTest && testPhase !== 'complete' && (
        <div className="text-center">
          <Button variant="outline" onClick={resetTest} className="border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:text-white">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Test
          </Button>
        </div>
      )}
    </div>
  );
};
