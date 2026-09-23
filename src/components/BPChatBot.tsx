/**
 * BP Analysis ChatBot Component
 * Specialized chatbot for analyzing blood pressure data
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { X, Send, User, Loader2, Settings, Heart, Activity } from 'lucide-react';
import { VoiceInputButton } from './ui/VoiceInputButton';
import { useSettings } from '@/contexts/SettingsContext';
import { BPReading, BPStats, calculateBPStats, getBPCategory, detectBPAlerts } from '@/services/bpService';
import { format, parseISO } from 'date-fns';
import { callAIProxy } from '@/services/aiProxyService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface BPChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  readings: BPReading[];
  stats: BPStats | null;
}

const isValidApiKey = (apiKey: string): boolean => {
  return apiKey.length > 20 && apiKey.startsWith('AIza');
};

const detectLanguage = (text: string): 'hindi' | 'english' => {
  const hindiRegex = /[\u0900-\u097F]/;
  const hinglishWords = [
    'ky', 'kya', 'tum', 'aap', 'mein', 'mujhe', 'ko', 'ka', 'ki', 'ke', 'se', 'par', 'hai', 'hain',
    'ho', 'hoga', 'hogi', 'smjha', 'smjhao', 'bataye', 'batao', 'bata', 'bhai', 'yaar', 'acha',
    'theek', 'sahi', 'nahi', 'nah', 'haan', 'han', 'bilkul', 'zaroor', 'kabhi', 'kab', 'kaise',
    'kahan', 'kya', 'kyun', 'kab', 'kitna', 'kitni', 'kabhi', 'aisa', 'aisi', 'aise', 'wahi',
    'woh', 'yeh', 'ye', 'us', 'un', 'in', 'is', 'iss', 'unka', 'unke', 'unki', 'iska', 'iske',
    'iski', 'mera', 'mere', 'meri', 'tera', 'tere', 'teri', 'hamara', 'hamare', 'hamari'
  ];

  const lowerText = text.toLowerCase();

  if (hindiRegex.test(text)) {
    return 'hindi';
  }

  const words = lowerText.split(/\s+/);
  const hinglishCount = words.filter(word =>
    hinglishWords.some(hindiWord => word.includes(hindiWord))
  ).length;

  if (words.length > 0 && (hinglishCount / words.length) > 0.2) {
    return 'hindi';
  }

  return 'english';
};

export const BPChatBot: React.FC<BPChatBotProps> = ({ isOpen, onClose, readings, stats }) => {
  const { settings } = useSettings();
  const apiKey = 'proxy-mode';

  const getInitialMessage = (): Message => {
    if (readings.length === 0) {
      return {
        id: '1',
        content: 'Hello! I\'m your BP Analysis Assistant. I can help you understand your blood pressure readings, identify patterns, provide insights, and answer questions about your BP data. Start by adding some BP readings to get personalized analysis!',
        sender: 'bot',
        timestamp: new Date()
      };
    }

    const recentReading = readings[0];
    const category = getBPCategory(recentReading.systolic, recentReading.diastolic);
    const alerts = detectBPAlerts(readings);

    return {
      id: '1',
      content: `Hello! I'm your **BP Analysis Assistant**. I can see you have ${readings.length} BP reading${readings.length !== 1 ? 's' : ''} recorded. Your latest reading is **${recentReading.systolic}/${recentReading.diastolic} mmHg** (${category.category}). ${alerts.length > 0 ? `⚠️ I've detected ${alerts.length} alert${alerts.length !== 1 ? 's' : ''} that need attention.` : ''} I can help you understand your BP trends, provide insights, answer questions, and give personalized recommendations. What would you like to know?`,
      sender: 'bot',
      timestamp: new Date()
    };
  };

  const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      const initialMsg = getInitialMessage();
      setMessages([initialMsg]);
    }
  }, [isOpen, readings.length]);

  const buildBPContext = (): string => {
    if (readings.length === 0) {
      return 'No BP readings available yet.';
    }

    const alerts = detectBPAlerts(readings);
    const recentReadings = readings.slice(0, 10);
    const weeklyStats = calculateBPStats(readings.filter(r => {
      const date = parseISO(r.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }));

    let context = `BLOOD PRESSURE DATA ANALYSIS CONTEXT:

Total Readings: ${readings.length}
Latest Reading: ${readings[0].systolic}/${readings[0].diastolic} mmHg (${format(parseISO(readings[0].timestamp), 'MMM dd, yyyy HH:mm')})
${readings[0].pulse ? `Pulse: ${readings[0].pulse} bpm` : ''}
${readings[0].notes ? `Notes: ${readings[0].notes}` : ''}

Overall Statistics:
- Average BP: ${stats?.averageSystolic || 'N/A'}/${stats?.averageDiastolic || 'N/A'} mmHg
- Range: Systolic ${stats?.minSystolic || 'N/A'}-${stats?.maxSystolic || 'N/A'} | Diastolic ${stats?.minDiastolic || 'N/A'}-${stats?.maxDiastolic || 'N/A'}
- Total Readings: ${stats?.readingCount || 0}

Weekly Statistics (Last 7 days):
- Average BP: ${weeklyStats.averageSystolic}/${weeklyStats.averageDiastolic} mmHg
- Readings: ${weeklyStats.readingCount}

Recent Readings (Last 10):
${recentReadings.map((r, idx) => {
      const date = parseISO(r.timestamp);
      const cat = getBPCategory(r.systolic, r.diastolic);
      return `${idx + 1}. ${format(date, 'MMM dd, HH:mm')} - ${r.systolic}/${r.diastolic} mmHg (${cat.category})${r.pulse ? `, Pulse: ${r.pulse} bpm` : ''}${r.notes ? ` - ${r.notes}` : ''}`;
    }).join('\n')}

Alerts Detected: ${alerts.length}
${alerts.length > 0 ? alerts.map(a => `- ${a.message}`).join('\n') : 'None'}

BP Categories:
- Normal: Below 120/80 mmHg
- Elevated: 120-129/<80 mmHg
- High Stage 1: 130-139/80-89 mmHg
- High Stage 2: 140+/90+ mmHg
- Crisis: 180+/120+ mmHg (requires immediate medical attention)`;

    return context;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const detectedLanguage = detectLanguage(inputValue);
      const languageInstruction = detectedLanguage === 'hindi'
        ? 'IMPORTANT: The user is asking in Hindi/Hinglish. Please respond ONLY in Hindi (Devanagari script or Roman script as appropriate). Use simple, easy-to-understand Hindi language.'
        : 'IMPORTANT: The user is asking in English. Please respond ONLY in English.';

      const bpContext = buildBPContext();

      const prompt = `You are a specialized Blood Pressure Analysis Assistant for Health Scan platform.

${bpContext}

User Question: "${inputValue}"

${languageInstruction}

Please provide helpful, accurate, and personalized analysis about the user's BP data. You can:
- Analyze trends and patterns in their BP readings
- Explain what their BP values mean
- Provide insights about their BP category
- Give personalized recommendations based on their data
- Answer questions about blood pressure management
- Explain the alerts detected
- Compare current readings with averages
- Suggest lifestyle modifications if needed

Remember: ${languageInstruction}`;

      const res = await callAIProxy('bp-chat', { prompt });

      if (!res.ok) {
        throw new Error('AI analysis unavailable, try again or consult a clinician');
      }

      const botResponse = res.data || 'I apologize, but I encountered an error receiving a valid response. Please try again.';

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'AI analysis unavailable, try again or consult a clinician.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Suggested prompts for BP analysis
  const suggestedPrompts = readings.length === 0
    ? [
        "What is normal BP?",
        "How to measure BP correctly?",
        "Signs of high blood pressure",
        "Lifestyle changes for BP"
      ]
    : [
        "Analyze my BP trend",
        "Is my BP normal?",
        "What do my readings mean?",
        "Tips to lower BP"
      ];

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  if (!isOpen) return null;

  const isApiReady = apiKey && apiKey.trim() !== '' && isValidApiKey(apiKey);
  const showEmptyState = messages.length === 1 && messages[0].sender === 'bot';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-3xl h-[85vh] max-h-[800px] flex flex-col bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                BP Analysis
              </h2>
              <p className="text-sm text-white/50">
                {readings.length > 0 
                  ? `${readings.length} reading${readings.length !== 1 ? 's' : ''} tracked`
                  : 'Your blood pressure companion'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!apiKey || apiKey.trim() === '' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">API Key Required</span>
              </div>
            ) : !isValidApiKey(apiKey) ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <Settings className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-400 font-medium">Invalid Key</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-rose-400 font-medium">Connected</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/40 hover:text-white hover:bg-white/[0.08] rounded-xl h-10 w-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && (
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Heart className="w-5 h-5 text-rose-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] ${
                    message.sender === 'user'
                      ? 'bg-white/[0.08] rounded-2xl rounded-br-md'
                      : 'bg-white/[0.04] rounded-2xl rounded-bl-md'
                  }`}
                >
                  <div className="px-5 py-4">
                    <div className="text-[15px] leading-relaxed text-white/90 prose prose-invert prose-p:my-2 prose-headings:text-white prose-strong:text-white prose-a:text-rose-400">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="text-white/90 mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc list-inside text-white/90 space-y-1 my-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside text-white/90 space-y-1 my-2">{children}</ol>,
                          li: ({ children }) => <li className="text-white/90">{children}</li>,
                          a: ({ href, children }) => <a href={href} className="text-rose-400 hover:text-rose-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <span className="text-[11px] text-white/30 mt-3 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {message.sender === 'user' && (
                  <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5 text-white/60" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-rose-400" />
                </div>
                <div className="bg-white/[0.04] rounded-2xl rounded-bl-md px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-rose-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-rose-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-rose-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Empty State / Suggested Prompts */}
          {showEmptyState && !isLoading && isApiReady && (
            <div className="max-w-2xl mx-auto mt-8">
              <p className="text-sm text-white/40 mb-4 text-center">Try asking:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="px-4 py-2.5 text-sm text-white/70 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all duration-200 hover:text-white hover:border-white/[0.12]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 pb-6 pt-2">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    !apiKey || apiKey.trim() === ''
                      ? "Configure API key in Settings to start chatting..."
                      : readings.length === 0
                        ? "Ask me about blood pressure, readings, or how to get started..."
                        : "Ask about your BP trends, what readings mean, or get insights..."
                  }
                  className="w-full min-h-[52px] max-h-[150px] px-5 py-3.5 text-[15px] text-white placeholder:text-white/30 bg-white/[0.06] border border-white/[0.08] rounded-xl focus:outline-none focus:border-rose-500/50 focus:bg-white/[0.08] transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !isApiReady}
                  rows={1}
                />
              </div>
              <VoiceInputButton
                onTranscript={(text) => setInputValue(text)}
                placeholder="Speak your question"
                size="md"
                disabled={isLoading || !isApiReady}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading || !isApiReady}
                className="h-[52px] w-[52px] bg-rose-500 hover:bg-rose-400 text-white rounded-xl disabled:opacity-30 disabled:bg-white/[0.08] transition-all duration-200 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-white/30 text-center mt-3">
              Powered by Gemini AI. Press Enter to send.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

