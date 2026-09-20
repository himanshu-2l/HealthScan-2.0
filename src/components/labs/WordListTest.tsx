import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Brain, Clock, Eye, Mic, MicOff, Volume2, CheckCircle, XCircle, AlertTriangle, FileText, RotateCcw, Play, Pause, Timer } from 'lucide-react';
import { saveTestResult, generateTestResultId } from '@/services/healthDataService';
import { HealthTestResult } from '@/types/health';

// Types
type TestPhase = 'instructions' | 'learning' | 'immediate-recall' | 'distractor' | 'delayed-recall' | 'recognition' | 'results';
type DistractorType = 'counting' | 'arithmetic' | 'category' | 'stroop';

interface WordData {
  word: string;
  category: string;
}

interface RecallData {
  phase: 'immediate' | 'delayed';
  wordsRecalled: string[];
  correctWords: string[];
  intrusionErrors: string[];
  perseverationErrors: string[];
  responseTime: number;
  score: number;
}

interface RecognitionData {
  correctIdentifications: number;
  falsePositives: number;
  falseNegatives: number;
  score: number;
  responseTime: number;
}

interface TestResults {
  testWords: string[];
  immediateRecall: RecallData;
  delayedRecall: RecallData;
  recognition: RecognitionData;
  totalDuration: number;
  interpretation: {
    delayedRecallLevel: 'Normal' | 'Mild Concern' | 'High Concern';
    recognitionLevel: 'Normal' | 'Impaired';
    overallRisk: 'Low' | 'Medium' | 'High';
    recommendations: string[];
  };
}

// Comprehensive word database with Indian context
const WORD_DATABASE: WordData[] = [
  // Common objects
  { word: 'Apple', category: 'fruit' },
  { word: 'Book', category: 'object' },
  { word: 'Chair', category: 'furniture' },
  { word: 'Door', category: 'object' },
  { word: 'Elephant', category: 'animal' },
  { word: 'Flower', category: 'nature' },
  { word: 'Glass', category: 'object' },
  { word: 'House', category: 'building' },
  { word: 'Ice', category: 'nature' },
  { word: 'Jacket', category: 'clothing' },

  // Indian context words
  { word: 'Mango', category: 'fruit' },
  { word: 'Rice', category: 'food' },
  { word: 'Temple', category: 'building' },
  { word: 'Saree', category: 'clothing' },
  { word: 'Lotus', category: 'flower' },
  { word: 'Tiger', category: 'animal' },
  { word: 'River', category: 'nature' },
  { word: 'Mountain', category: 'nature' },
  { word: 'Train', category: 'transport' },
  { word: 'Market', category: 'place' },

  // More common words
  { word: 'Table', category: 'furniture' },
  { word: 'Phone', category: 'object' },
  { word: 'Water', category: 'nature' },
  { word: 'Sun', category: 'nature' },
  { word: 'Moon', category: 'nature' },
  { word: 'Tree', category: 'nature' },
  { word: 'Bird', category: 'animal' },
  { word: 'Fish', category: 'animal' },
  { word: 'Car', category: 'transport' },
  { word: 'Road', category: 'place' },

  // Additional words for variety
  { word: 'Bread', category: 'food' },
  { word: 'Milk', category: 'food' },
  { word: 'Pen', category: 'object' },
  { word: 'Paper', category: 'object' },
  { word: 'Clock', category: 'object' },
  { word: 'Mirror', category: 'object' },
  { word: 'Lamp', category: 'object' },
  { word: 'Bed', category: 'furniture' },
  { word: 'Window', category: 'object' },
  { word: 'Garden', category: 'place' },

  // More variety for recognition test
  { word: 'Banana', category: 'fruit' },
  { word: 'Orange', category: 'fruit' },
  { word: 'Coconut', category: 'fruit' },
  { word: 'Potato', category: 'food' },
  { word: 'Onion', category: 'food' },
  { word: 'Tomato', category: 'food' },
  { word: 'Carrot', category: 'food' },
  { word: 'Cabbage', category: 'food' },
  { word: 'Spinach', category: 'food' },
  { word: 'Wheat', category: 'food' },

  { word: 'Dog', category: 'animal' },
  { word: 'Cat', category: 'animal' },
  { word: 'Cow', category: 'animal' },
  { word: 'Buffalo', category: 'animal' },
  { word: 'Goat', category: 'animal' },
  { word: 'Horse', category: 'animal' },
  { word: 'Monkey', category: 'animal' },
  { word: 'Peacock', category: 'animal' },
  { word: 'Parrot', category: 'animal' },
  { word: 'Crow', category: 'animal' },

  { word: 'Shirt', category: 'clothing' },
  { word: 'Pant', category: 'clothing' },
  { word: 'Dress', category: 'clothing' },
  { word: 'Shoe', category: 'clothing' },
  { word: 'Hat', category: 'clothing' },
  { word: 'Scarf', category: 'clothing' },
  { word: 'Belt', category: 'clothing' },
  { word: 'Sock', category: 'clothing' },
  { word: 'Glove', category: 'clothing' },
  { word: 'Ring', category: 'jewelry' },

  { word: 'School', category: 'building' },
  { word: 'Hospital', category: 'building' },
  { word: 'Office', category: 'building' },
  { word: 'Shop', category: 'building' },
  { word: 'Bank', category: 'building' },
  { word: 'Library', category: 'building' },
  { word: 'Cinema', category: 'building' },
  { word: 'Restaurant', category: 'building' },
  { word: 'Hotel', category: 'building' },
  { word: 'Factory', category: 'building' },

  { word: 'Bus', category: 'transport' },
  { word: 'Bicycle', category: 'transport' },
  { word: 'Boat', category: 'transport' },
  { word: 'Plane', category: 'transport' },
  { word: 'Truck', category: 'transport' },
  { word: 'Motorcycle', category: 'transport' },
  { word: 'Rickshaw', category: 'transport' },
  { word: 'Taxi', category: 'transport' },
  { word: 'Metro', category: 'transport' },
  { word: 'Ship', category: 'transport' }
];

// Word Display Component
const WordDisplay: React.FC<{
  word: string;
  isVisible: boolean;
  currentIndex: number;
  totalWords: number;
  onSpeak?: () => void;
}> = ({ word, isVisible, currentIndex, totalWords, onSpeak }) => {
  return (
    <div className="text-center space-y-6">
      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="text-sm text-muted-foreground">
          Word {currentIndex + 1} of {totalWords}
        </span>
        {onSpeak && (
          <Button variant="outline" size="sm" onClick={onSpeak} className="border-white/10 bg-white/5 hover:bg-white/10 text-foreground">
            <Volume2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-center h-32">
        <div className={`text-6xl font-bold transition-all duration-500 ${isVisible
          ? 'opacity-100 scale-100 text-foreground drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'
          : 'opacity-0 scale-75 text-muted-foreground'
          }`}>
          {isVisible ? word : ''}
        </div>
      </div>

      <Progress value={((currentIndex + 1) / totalWords) * 100} className="w-full max-w-md mx-auto bg-white/10" indicatorClassName="bg-blue-500" />
    </div>
  );
};

// Recall Input Component
const RecallInput: React.FC<{
  onSubmit: (words: string[]) => void;
  phase: 'immediate' | 'delayed';
  isListening?: boolean;
  onToggleListening?: () => void;
  supportsSpeech?: boolean;
}> = ({ onSubmit, phase, isListening, onToggleListening, supportsSpeech }) => {
  const [inputValue, setInputValue] = useState('');
  const [recalledWords, setRecalledWords] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addWord = () => {
    const word = inputValue.trim();
    if (word && !recalledWords.includes(word.toLowerCase())) {
      setRecalledWords(prev => [...prev, word]);
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const removeWord = (index: number) => {
    setRecalledWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addWord();
    }
  };

  const handleSubmit = () => {
    onSubmit(recalledWords);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">
          {phase === 'immediate' ? 'Immediate Recall' : 'Delayed Recall'}
        </h3>
        <p className="text-muted-foreground">
          {phase === 'immediate'
            ? 'Type all the words you remember from the list you just saw'
            : 'Type all the words you remember from the original list (before the counting task)'
          }
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a word and press Enter"
          className="flex-1 bg-black/20 border-white/10 text-foreground placeholder:text-white/20 focus:border-blue-500/50"
          autoFocus
        />
        <Button onClick={addWord} disabled={!inputValue.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
          Add Word
        </Button>
        {supportsSpeech && (
          <Button
            variant={isListening ? "destructive" : "outline"}
            className={isListening ? "" : "border-white/10 bg-white/5 hover:bg-white/10 text-foreground"}
            onClick={onToggleListening}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-foreground">Words Recalled ({recalledWords.length}):</h4>
        <div className="flex flex-wrap gap-2 min-h-[60px] p-4 border border-white/10 rounded-lg bg-black/20">
          {recalledWords.map((word, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer bg-blue-500/20 text-blue-300 hover:bg-red-500/20 hover:text-red-300 border border-blue-500/20 transition-colors"
              onClick={() => removeWord(index)}
            >
              {word} ×
            </Badge>
          ))}
          {recalledWords.length === 0 && (
            <span className="text-muted-foreground italic">No words added yet...</span>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0">
          {phase === 'immediate' ? 'Continue to Distractor Task' : 'Continue to Recognition Test'}
        </Button>
      </div>
    </div>
  );
};

// Distractor Task Component
const DistractorTask: React.FC<{
  onComplete: () => void;
  taskType: DistractorType;
  duration: number; // in seconds
}> = ({ onComplete, taskType, duration }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [currentNumber, setCurrentNumber] = useState(50);
  const [userInput, setUserInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft, onComplete]);

  const startTask = () => {
    setIsActive(true);
  };

  const handleCountingInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = parseInt(userInput);
      if (!isNaN(value)) {
        setResponses(prev => [...prev, userInput]);
        setCurrentNumber(value);
        setUserInput('');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTaskInstructions = () => {
    switch (taskType) {
      case 'counting':
        return 'Count backwards from 50 by 2s (50, 48, 46, 44...)';
      case 'arithmetic':
        return 'Solve simple math problems as they appear';
      case 'category':
        return 'Name as many animals as you can';
      case 'stroop':
        return 'Name the color of the words, not what they say';
      default:
        return 'Complete the distractor task';
    }
  };

  return (
    <Card className="glass-panel border-0 max-w-2xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50"></div>
      <CardHeader className="bg-white/5 border-b border-white/5">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Timer className="w-5 h-5 text-orange-400" />
          Distractor Task
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          This simple task helps clear your short-term memory before the final recall test
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2 text-foreground">{formatTime(timeLeft)}</div>
          <Progress value={((duration - timeLeft) / duration) * 100} className="w-full bg-white/10" indicatorClassName="bg-orange-500" />
        </div>

        {!isActive ? (
          <div className="text-center space-y-4">
            <p className="text-lg text-foreground">{getTaskInstructions()}</p>
            <Button onClick={startTask} size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
              <Play className="w-4 h-4 mr-2" />
              Start Distractor Task
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center font-medium text-foreground">{getTaskInstructions()}</p>

            {taskType === 'counting' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Last number: {currentNumber}</p>
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleCountingInput}
                    placeholder="Enter next number"
                    className="text-center text-xl bg-black/20 border-white/10 text-foreground"
                    autoFocus
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Responses: {responses.slice(-5).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {taskType === 'category' && (
              <div className="space-y-4">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && userInput.trim()) {
                      setResponses(prev => [...prev, userInput.trim()]);
                      setUserInput('');
                    }
                  }}
                  placeholder="Type an animal name and press Enter"
                  className="text-center bg-black/20 border-white/10 text-foreground"
                  autoFocus
                />
                <div className="text-center">
                  <p className="text-sm text-foreground">Animals named: {responses.length}</p>
                  <p className="text-xs text-muted-foreground">
                    Recent: {responses.slice(-3).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Recognition Test Component
const RecognitionTest: React.FC<{
  originalWords: string[];
  onComplete: (results: { selectedWords: string[]; correctCount: number }) => void;
}> = ({ originalWords, onComplete }) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [testWords, setTestWords] = useState<string[]>([]);

  useEffect(() => {
    // Create recognition test with 10 original + 10 new words
    const availableWords = WORD_DATABASE.filter(
      item => !originalWords.includes(item.word)
    );

    // Shuffle and take 10 new words
    const shuffledNew = [...availableWords].sort(() => Math.random() - 0.5);
    const newWords = shuffledNew.slice(0, 10).map(item => item.word);

    // Combine and shuffle all 20 words
    const allWords = [...originalWords, ...newWords].sort(() => Math.random() - 0.5);
    setTestWords(allWords);
  }, [originalWords]);

  const toggleWord = (word: string) => {
    setSelectedWords(prev =>
      prev.includes(word)
        ? prev.filter(w => w !== word)
        : [...prev, word]
    );
  };

  const handleSubmit = () => {
    console.log('Recognition test submit clicked:', {
      selectedWords,
      originalWords,
      selectedCount: selectedWords.length
    });

    const correctCount = selectedWords.filter(word => originalWords.includes(word)).length;
    console.log('Correct count:', correctCount);

    onComplete({ selectedWords, correctCount });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Recognition Test</h3>
        <p className="text-muted-foreground">
          Select all the words that were in the ORIGINAL list (before the distractor task)
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Selected: {selectedWords.length} words
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {testWords.map((word, index) => (
          <Button
            key={index}
            variant={selectedWords.includes(word) ? "default" : "outline"}
            className={`h-16 text-lg transition-all ${selectedWords.includes(word)
              ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'
              : 'bg-white/5 border-white/10 text-foreground hover:bg-white/10 hover:border-white/20'
              }`}
            onClick={() => toggleWord(word)}
          >
            {word}
          </Button>
        ))}
      </div>

      <div className="text-center">
        <Button onClick={handleSubmit} size="lg" className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-blue-900/20">
          Complete Test
        </Button>
      </div>
    </div>
  );
};

// Results Summary Component
const ResultsSummary: React.FC<{
  results: TestResults;
  onRestart: () => void;
  onExport: () => void;
}> = ({ results, onRestart, onExport }) => {
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (level: string) => {
    switch (level) {
      case 'Normal': return 'default';
      case 'Mild Concern': return 'secondary';
      case 'High Concern': case 'Impaired': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Word List Recall Test Results</h2>
        <p className="text-muted-foreground">Comprehensive memory assessment complete</p>
      </div>

      {/* Overall Risk Assessment */}
      {/* Overall Risk Assessment */}
      <Card className="glass-panel border-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
        <CardHeader className="bg-white/5 border-b border-white/5">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Brain className="w-5 h-5 text-blue-400" />
            Overall Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              {results.interpretation.overallRisk === 'Low' && <CheckCircle className="w-8 h-8 text-green-400" />}
              {results.interpretation.overallRisk === 'Medium' && <AlertTriangle className="w-8 h-8 text-yellow-500" />}
              {results.interpretation.overallRisk === 'High' && <XCircle className="w-8 h-8 text-red-500" />}
              <span className={`text-2xl font-bold ${results.interpretation.overallRisk === 'Low' ? 'text-green-400' :
                results.interpretation.overallRisk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                {results.interpretation.overallRisk} Risk
              </span>
            </div>
            <Badge variant="outline" className={`text-lg px-4 py-2 border-0 ${results.interpretation.delayedRecallLevel === 'Normal' ? 'bg-green-500/20 text-green-300' :
              results.interpretation.delayedRecallLevel === 'Mild Concern' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
              }`}>
              {results.interpretation.delayedRecallLevel}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-0">
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle className="text-center text-foreground">Immediate Recall</CardTitle>
            <CardDescription className="text-center text-muted-foreground">Right after learning</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className={`text-4xl font-bold ${getScoreColor(results.immediateRecall.score, 10)}`}>
                {results.immediateRecall.score}/10
              </div>
              <p className="text-sm text-muted-foreground">
                {results.immediateRecall.score >= 7 ? 'Good' : results.immediateRecall.score >= 5 ? 'Fair' : 'Poor'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0 border-l-2 border-l-blue-500">
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle className="text-center text-foreground">Delayed Recall</CardTitle>
            <CardDescription className="text-center text-muted-foreground">After 5-minute delay (Primary Metric)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className={`text-4xl font-bold ${getScoreColor(results.delayedRecall.score, 10)}`}>
                {results.delayedRecall.score}/10
              </div>
              <Badge variant="outline" className="border-0 bg-white/10 text-foreground">
                {results.interpretation.delayedRecallLevel}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Normal: 6-10 | Concern: 4-5 | High Concern: 0-3
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0">
          <CardHeader className="bg-white/5 border-b border-white/5">
            <CardTitle className="text-center text-foreground">Recognition</CardTitle>
            <CardDescription className="text-center text-muted-foreground">Identifying original words</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className={`text-4xl font-bold ${getScoreColor(results.recognition.score, 10)}`}>
                {results.recognition.score}/10
              </div>
              <Badge variant="outline" className="border-0 bg-white/10 text-foreground">
                {results.interpretation.recognitionLevel}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Normal: 9-10 | Impaired: &lt;8
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      {/* Detailed Analysis */}
      <Card className="glass-panel border-0">
        <CardHeader className="bg-white/5 border-b border-white/5">
          <CardTitle className="text-foreground">Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-foreground">Error Analysis</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between p-2 bg-white/5 rounded">
                  <span>Intrusion Errors (Immediate):</span>
                  <span className="text-foreground font-medium">{results.immediateRecall.intrusionErrors.length}</span>
                </div>
                <div className="flex justify-between p-2 bg-white/5 rounded">
                  <span>Intrusion Errors (Delayed):</span>
                  <span className="text-foreground font-medium">{results.delayedRecall.intrusionErrors.length}</span>
                </div>
                <div className="flex justify-between p-2 bg-white/5 rounded">
                  <span>Perseveration Errors:</span>
                  <span className="text-foreground font-medium">{results.immediateRecall.perseverationErrors.length + results.delayedRecall.perseverationErrors.length}</span>
                </div>
                <div className="flex justify-between p-2 bg-white/5 rounded">
                  <span>Recognition False Positives:</span>
                  <span className="text-foreground font-medium">{results.recognition.falsePositives}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-foreground">Performance Metrics</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between p-2 bg-white/5 rounded">
                  <span>Learning Efficiency:</span>
                  <span className="text-foreground font-medium">{((results.immediateRecall.score / 10) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between p-2 bg-white/5 rounded">
                  <span>Retention Rate:</span>
                  <span className="text-foreground font-medium">{results.immediateRecall.score > 0 ? ((results.delayedRecall.score / results.immediateRecall.score) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="flex justify-between p-2 bg-white/5 rounded">
                  <span>Recognition Accuracy:</span>
                  <span className="text-foreground font-medium">{((results.recognition.score / 10) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between p-2 bg-white/5 rounded">
                  <span>Total Test Duration:</span>
                  <span className="text-foreground font-medium">{Math.round(results.totalDuration / 60000)} min</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Recommendations */}
      {/* Clinical Recommendations */}
      <Card className="glass-panel border-0">
        <CardHeader className="bg-white/5 border-b border-white/5">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="w-5 h-5 text-blue-400" />
            Clinical Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {results.interpretation.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/10">
                <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{recommendation}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={onRestart} variant="outline" className="flex-1 border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:text-white">
          <RotateCcw className="w-4 h-4 mr-2" />
          Take Test Again
        </Button>
        <Button onClick={onExport} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0">
          <FileText className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
};

// Main Component
export const WordListTest: React.FC = () => {
  // Core state
  const [testPhase, setTestPhase] = useState<TestPhase>('instructions');
  const [testWords, setTestWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showWord, setShowWord] = useState(false);

  // Results tracking
  const [immediateRecallData, setImmediateRecallData] = useState<RecallData | null>(null);
  const [delayedRecallData, setDelayedRecallData] = useState<RecallData | null>(null);
  const [recognitionData, setRecognitionData] = useState<RecognitionData | null>(null);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [phaseStartTime, setPhaseStartTime] = useState<number>(0);
  const [testResults, setTestResults] = useState<TestResults | null>(null);

  // Speech support
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Refs
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
    }
  }, []);

  // Generate test words with no semantic clustering
  const generateTestWords = useCallback((): string[] => {
    const categories = [...new Set(WORD_DATABASE.map(item => item.category))];
    const selectedWords: string[] = [];
    const usedCategories: string[] = [];

    // Ensure no more than 2 words from same category
    while (selectedWords.length < 10) {
      const availableWords = WORD_DATABASE.filter(item =>
        !selectedWords.includes(item.word) &&
        usedCategories.filter(cat => cat === item.category).length < 2
      );

      if (availableWords.length === 0) break;

      const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
      selectedWords.push(randomWord.word);
      usedCategories.push(randomWord.category);
    }

    return selectedWords;
  }, []);

  // Start test
  const startTest = () => {
    const words = generateTestWords();
    setTestWords(words);
    setTestStartTime(Date.now());
    setPhaseStartTime(Date.now());
    setTestPhase('learning');
    setCurrentWordIndex(0);

    // Start learning phase
    setTimeout(() => {
      showLearningSequence(words);
    }, 1000);
  };

  // Show learning sequence
  const showLearningSequence = useCallback((words: string[]) => {
    let index = 0;

    const showNextWord = () => {
      if (index < words.length) {
        setCurrentWordIndex(index);
        setShowWord(true);

        // Speak word if supported
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(words[index]);
          utterance.rate = 0.8;
          speechSynthesis.speak(utterance);
        }

        timeoutRef.current = setTimeout(() => {
          setShowWord(false);

          timeoutRef.current = setTimeout(() => {
            index++;
            if (index < words.length) {
              showNextWord();
            } else {
              // Learning complete, start immediate recall
              setTestPhase('immediate-recall');
              setPhaseStartTime(Date.now());
            }
          }, 500);
        }, 2000);
      }
    };

    showNextWord();
  }, []);

  // Handle recall submission
  const handleRecallSubmit = (phase: 'immediate' | 'delayed', recalledWords: string[]) => {
    const responseTime = Date.now() - phaseStartTime;
    const correctWords = recalledWords.filter(word =>
      testWords.some(testWord => testWord.toLowerCase() === word.toLowerCase())
    );
    const intrusionErrors = recalledWords.filter(word =>
      !testWords.some(testWord => testWord.toLowerCase() === word.toLowerCase())
    );
    const perseverationErrors = recalledWords.filter((word, index) =>
      recalledWords.indexOf(word) !== index
    );

    const recallData: RecallData = {
      phase,
      wordsRecalled: recalledWords,
      correctWords,
      intrusionErrors,
      perseverationErrors,
      responseTime,
      score: correctWords.length
    };

    if (phase === 'immediate') {
      setImmediateRecallData(recallData);
      setTestPhase('distractor');
      setPhaseStartTime(Date.now());
    } else {
      setDelayedRecallData(recallData);
      setTestPhase('recognition');
      setPhaseStartTime(Date.now());
    }
  };

  // Handle distractor task completion
  const handleDistractorComplete = () => {
    setTestPhase('delayed-recall');
    setPhaseStartTime(Date.now());
  };

  // Handle recognition test completion
  const handleRecognitionComplete = (results: { selectedWords: string[]; correctCount: number }) => {
    console.log('Recognition complete callback received:', results);

    const responseTime = Date.now() - phaseStartTime;
    const falsePositives = results.selectedWords.filter(word => !testWords.includes(word)).length;
    const falseNegatives = testWords.filter(word => !results.selectedWords.includes(word)).length;

    const recognitionResults: RecognitionData = {
      correctIdentifications: results.correctCount,
      falsePositives,
      falseNegatives,
      score: results.correctCount,
      responseTime
    };

    setRecognitionData(recognitionResults);

    // Use a small delay to ensure state updates have completed
    setTimeout(() => {
      generateFinalResults(recognitionResults);
    }, 100);
  };

  // Generate final results
  const generateFinalResults = (recognition: RecognitionData) => {
    // Get the latest state values
    const currentImmediate = immediateRecallData;
    const currentDelayed = delayedRecallData;

    console.log('Generating final results with data:', { currentImmediate, currentDelayed, recognition });

    if (!currentImmediate || !currentDelayed) {
      console.error('Missing recall data:', {
        currentImmediate,
        currentDelayed,
        immediateIsNull: currentImmediate === null,
        delayedIsNull: currentDelayed === null,
        immediateIsUndefined: currentImmediate === undefined,
        delayedIsUndefined: currentDelayed === undefined
      });

      // Try again after a short delay
      setTimeout(() => {
        const retryImmediate = immediateRecallData;
        const retryDelayed = delayedRecallData;
        console.log('Retry - recall data:', { retryImmediate, retryDelayed });

        if (retryImmediate && retryDelayed) {
          generateFinalResultsWithData(retryImmediate, retryDelayed, recognition);
        } else {
          console.error('Still missing recall data after retry');
        }
      }, 200);
      return;
    }

    generateFinalResultsWithData(currentImmediate, currentDelayed, recognition);
  };

  // Helper function to generate results with guaranteed data
  const generateFinalResultsWithData = (immediate: RecallData, delayed: RecallData, recognition: RecognitionData) => {

    const totalDuration = Date.now() - testStartTime;

    // Interpret results
    const delayedRecallLevel =
      delayed.score >= 6 ? 'Normal' :
        delayed.score >= 4 ? 'Mild Concern' : 'High Concern';

    const recognitionLevel = recognition.score >= 8 ? 'Normal' : 'Impaired';

    const overallRisk =
      delayedRecallLevel === 'High Concern' || recognitionLevel === 'Impaired' ? 'High' :
        delayedRecallLevel === 'Mild Concern' ? 'Medium' : 'Low';

    // Generate recommendations
    const recommendations: string[] = [];

    if (delayedRecallLevel === 'High Concern') {
      recommendations.push('Urgent neurological evaluation recommended for memory concerns');
      recommendations.push('Consider comprehensive neuropsychological testing');
    } else if (delayedRecallLevel === 'Mild Concern') {
      recommendations.push('Follow-up memory assessment recommended in 6 months');
      recommendations.push('Consider lifestyle interventions for cognitive health');
    }

    if (recognitionLevel === 'Impaired') {
      recommendations.push('Recognition memory impairment detected - clinical evaluation advised');
    }

    if (immediate.intrusionErrors.length > 2 || delayed.intrusionErrors.length > 2) {
      recommendations.push('High intrusion error rate - consider attention and executive function assessment');
    }

    if (overallRisk === 'Low') {
      recommendations.push('Continue regular cognitive monitoring and healthy lifestyle habits');
    }

    recommendations.push('Maintain regular physical exercise and social engagement for cognitive health');
    recommendations.push('Consider Mediterranean diet and adequate sleep for brain health');

    const finalResults: TestResults = {
      testWords,
      immediateRecall: immediate,
      delayedRecall: delayed,
      recognition,
      totalDuration,
      interpretation: {
        delayedRecallLevel,
        recognitionLevel,
        overallRisk,
        recommendations
      }
    };

    // Store results using new health data service
    const healthTestResult: HealthTestResult = {
      id: generateTestResultId('word-list-recall'),
      testType: 'word-list-recall',
      category: 'neurological',
      testDate: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      data: finalResults,
      score: delayed.score,
      maxScore: 10,
      scorePercentage: (delayed.score / 10) * 100,
      riskLevel: overallRisk === 'Low' ? 'low' : overallRisk === 'Medium' ? 'medium' : 'high',
      interpretation: `${delayedRecallLevel} - Delayed Recall: ${delayed.score}/10, Recognition: ${recognition.score}/10`,
      recommendations: recommendations,
      duration: totalDuration,
      status: 'final',
    };

    saveTestResult(healthTestResult);

    // Also save to legacy format for backward compatibility
    const existingResults = JSON.parse(localStorage.getItem('wordListHistory') || '[]');
    existingResults.push({ ...finalResults, timestamp: new Date().toISOString() });
    localStorage.setItem('wordListHistory', JSON.stringify(existingResults));

    setTestResults(finalResults);
    setTestPhase('results');
  };

  // Export results
  const exportResults = () => {
    if (!testResults) return;

    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `word-list-recall-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Reset test
  const resetTest = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setTestPhase('instructions');
    setTestWords([]);
    setCurrentWordIndex(0);
    setShowWord(false);
    setImmediateRecallData(null);
    setDelayedRecallData(null);
    setRecognitionData(null);
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
    <div className="space-y-8 animate-fade-in pt-24">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Brain className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Word List Recall Test</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Gold standard memory assessment for Alzheimer's disease screening
        </p>
        <Badge variant="secondary" className="w-fit mx-auto flex items-center gap-2">
          <Eye className="w-3 h-3" /> Memory Assessment
        </Badge>
      </div>

      {testPhase === 'instructions' && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
            <CardDescription>Please read carefully - this is a comprehensive memory test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">1</span>
                  Learning Phase
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  You'll see 10 words displayed one at a time for 2 seconds each. Try to remember all of them.
                </p>
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">2</span>
                  Immediate Recall
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  Right after seeing all words, you'll type all the words you remember.
                </p>
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">3</span>
                  Distractor Task (1 minute)
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  You'll complete a simple counting task to clear your short-term memory.
                </p>
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">4</span>
                  Delayed Recall (Most Important)
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  After the distractor task, you'll recall the original words again.
                </p>
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">5</span>
                  Recognition Test
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  Finally, you'll identify the original words from a list of 20 words.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Important:</strong> This test takes about 15-20 minutes total.
                The delayed recall score is the most important measure for Alzheimer's screening.
              </p>
            </div>

            <Button onClick={startTest} size="lg" className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Start Memory Test
            </Button>
          </CardContent>
        </Card>
      )}

      {testPhase === 'learning' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Learning Phase</CardTitle>
            <CardDescription className="text-center">
              Watch each word carefully and try to remember them all
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WordDisplay
              word={testWords[currentWordIndex] || ''}
              isVisible={showWord}
              currentIndex={currentWordIndex}
              totalWords={testWords.length}
              onSpeak={() => {
                if ('speechSynthesis' in window && testWords[currentWordIndex]) {
                  const utterance = new SpeechSynthesisUtterance(testWords[currentWordIndex]);
                  utterance.rate = 0.8;
                  speechSynthesis.speak(utterance);
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {(testPhase === 'immediate-recall' || testPhase === 'delayed-recall') && (
        <RecallInput
          onSubmit={(words) => handleRecallSubmit(
            testPhase === 'immediate-recall' ? 'immediate' : 'delayed',
            words
          )}
          phase={testPhase === 'immediate-recall' ? 'immediate' : 'delayed'}
          isListening={isListening}
          onToggleListening={() => setIsListening(!isListening)}
          supportsSpeech={speechSupported}
        />
      )}

      {testPhase === 'distractor' && (
        <DistractorTask
          onComplete={handleDistractorComplete}
          taskType="counting"
          duration={60} // 1 minute
        />
      )}

      {testPhase === 'recognition' && (
        <RecognitionTest
          originalWords={testWords}
          onComplete={handleRecognitionComplete}
        />
      )}

      {testPhase === 'results' && testResults && (
        <ResultsSummary
          results={testResults}
          onRestart={resetTest}
          onExport={exportResults}
        />
      )}

      {testPhase !== 'instructions' && testPhase !== 'results' && (
        <div className="text-center">
          <Button variant="outline" onClick={resetTest}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Test
          </Button>
        </div>
      )}
    </div>
  );
};
