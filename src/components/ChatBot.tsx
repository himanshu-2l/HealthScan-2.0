import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { X, Send, Bot, User, Loader2, Settings, Sparkles } from 'lucide-react';
import { VoiceInputButton } from './ui/VoiceInputButton';
import { useSettings } from '@/contexts/SettingsContext';
import { HealthTestResult } from '@/types/health';
import { callAIProxy } from '@/services/aiProxyService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  reportContext?: HealthTestResult;
}

// Helper function to validate Gemini API key format
const isValidApiKey = (apiKey: string): boolean => {
  return apiKey.length > 20 && apiKey.startsWith('AIza');
};

// Helper function to detect if text contains Hindi/Hinglish/English
const detectLanguage = (text: string): 'hindi' | 'hinglish' | 'english' => {
  // Check for Devanagari script characters (Hindi)
  const hindiRegex = /[\u0900-\u097F]/;
  // Check for common Hindi words in Roman script (Hinglish)
  const hinglishWords = [
    'ky', 'kya', 'tum', 'aap', 'mein', 'mujhe', 'ko', 'ka', 'ki', 'ke', 'se', 'par', 'hai', 'hain',
    'ho', 'hoga', 'hogi', 'smjha', 'smjhao', 'bataye', 'batao', 'bata', 'bhai', 'yaar', 'acha',
    'theek', 'sahi', 'nahi', 'nah', 'haan', 'han', 'bilkul', 'zaroor', 'kabhi', 'kab', 'kaise',
    'kahan', 'kya', 'kyun', 'kab', 'kitna', 'kitni', 'kabhi', 'aisa', 'aisi', 'aise', 'wahi',
    'woh', 'yeh', 'ye', 'us', 'un', 'in', 'is', 'iss', 'unka', 'unke', 'unki', 'iska', 'iske',
    'iski', 'mera', 'mere', 'meri', 'tera', 'tere', 'teri', 'hamara', 'hamare', 'hamari',
    'karo', 'karein', 'dekh', 'dekho', 'sun', 'suno', 'ja', 'jao', 'aa', 'aao', 'le', 'lo',
    'de', 'do', 'padh', 'padho', 'likh', 'likho', 'bol', 'bolo', 'chup', 'bas', 'ruk', 'ruko'
  ];

  const lowerText = text.toLowerCase();

  // Check for Devanagari script (pure Hindi)
  if (hindiRegex.test(text)) {
    return 'hindi';
  }

  // Check for Hinglish words
  const words = lowerText.split(/\s+/);
  const hinglishCount = words.filter(word =>
    hinglishWords.some(hindiWord => word.includes(hindiWord))
  ).length;

  // If more than 20% of words are Hinglish, consider it Hinglish
  if (words.length > 0 && (hinglishCount / words.length) > 0.2) {
    return 'hinglish';
  }

  return 'english';
};

export const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose, reportContext }) => {
  const { settings } = useSettings();

  const apiKey = 'proxy-mode';

  // Initialize messages based on whether report context is provided
  const getInitialMessage = (): Message => {
    if (reportContext) {
      const testTypeLabel = reportContext.testType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return {
        id: '1',
        content: `Hello! I'm analyzing your **${testTypeLabel}** report from ${new Date(reportContext.testDate).toLocaleDateString()}. I can help you understand the results, interpret the scores, explain what the data means, and answer any questions about this specific test. What would you like to know?`,
        sender: 'bot',
        timestamp: new Date()
      };
    }
    return {
      id: '1',
      content: 'Hello! I\'m your Health Scan assistant. I can help you understand the lab tests, interpret results, and answer questions about health screening. How can I assist you today?',
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

  // Reset messages when report context changes
  useEffect(() => {
    if (isOpen) {
      const initialMsg = reportContext
        ? {
          id: '1',
          content: `Hello! I'm analyzing your **${reportContext.testType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}** report from ${new Date(reportContext.testDate).toLocaleDateString()}. I can help you understand the results, interpret the scores, explain what the data means, and answer any questions about this specific test. What would you like to know?`,
          sender: 'bot' as const,
          timestamp: new Date()
        }
        : {
          id: '1',
          content: 'Hello! I\'m your Health Scan assistant. I can help you understand the lab tests, interpret results, and answer questions about health screening. How can I assist you today?',
          sender: 'bot' as const,
          timestamp: new Date()
        };
      setMessages([initialMsg]);
    }
  }, [reportContext, isOpen]);

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

      // Detect the language of user input
      const detectedLanguage = detectLanguage(inputValue);
      let languageInstruction = '';
      
      if (detectedLanguage === 'hindi') {
        languageInstruction = 'CRITICAL: User is asking in pure Hindi (Devanagari script). Respond ONLY in pure Hindi using Devanagari script. Keep response SHORT (2-3 sentences max), accurate and to the point. Use simple, clear Hindi.';
      } else if (detectedLanguage === 'hinglish') {
        languageInstruction = 'CRITICAL: User is asking in Hinglish (Roman Hindi + English mix). Respond in Hinglish only - mix Hindi words in Roman script with English naturally. Keep response SHORT (2-3 sentences max), accurate and conversational. Example: "Aapka BP thoda high hai, tension mat lo."';
      } else {
        languageInstruction = 'CRITICAL: User is asking in English. Respond ONLY in English. Keep response SHORT (2-3 sentences max), accurate and to the point. Be concise and direct.';
      }

      // Build context-aware prompt
      let prompt = '';

      if (reportContext) {
        // Include report context in the prompt
        const reportSummary = `
REPORT CONTEXT:
- Test Type: ${reportContext.testType}
- Category: ${reportContext.category}
- Test Date: ${new Date(reportContext.testDate).toLocaleDateString()}
- Score: ${reportContext.score !== undefined ? `${reportContext.score}${reportContext.maxScore ? ` / ${reportContext.maxScore}` : ''}` : 'N/A'}
- Score Percentage: ${reportContext.scorePercentage !== undefined ? `${Math.round(reportContext.scorePercentage)}%` : 'N/A'}
- Risk Level: ${reportContext.riskLevel || 'N/A'}
- Interpretation: ${reportContext.interpretation || 'N/A'}
- Recommendations: ${reportContext.recommendations && reportContext.recommendations.length > 0 ? reportContext.recommendations.join(', ') : 'None'}
- Duration: ${reportContext.duration ? `${Math.floor(reportContext.duration / 1000)}s` : 'N/A'}
- Status: ${reportContext.status || 'N/A'}

Full Report Data:
${JSON.stringify(reportContext.data, null, 2)}

The user is asking about THIS SPECIFIC REPORT. Please provide detailed, accurate, and helpful answers about this test result. Explain what the scores mean, what the risk level indicates, interpret the data, and provide insights based on the report context.`;

        prompt = `You are a helpful assistant for Health Scan, a health screening platform. Be concise and accurate.

${reportSummary}

User Question: "${inputValue}"

${languageInstruction}

Provide a brief, accurate response (max 3 sentences). Focus on the key information the user needs.`;
      } else {
        prompt = `You are a helpful assistant for Health Scan, a health screening platform. Be concise and accurate.

The user asked: "${inputValue}"

${languageInstruction}

Provide a brief, accurate response (max 3 sentences) about health screening, tests, or general health questions. Focus on key information only.`;
      }

      const res = await callAIProxy('chat', { prompt });

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

  // Suggested prompts for empty state
  const suggestedPrompts = reportContext
    ? [
        "What does my score mean?",
        "Explain the risk level",
        "What should I improve?",
        "Compare to normal ranges"
      ]
    : [
        "What's my health score?",
        "Explain BP readings",
        "Diet recommendations",
        "How to improve sleep?"
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
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {reportContext ? 'Report Analysis' : 'Health Assistant'}
              </h2>
              <p className="text-sm text-white/50">
                {reportContext ? 'AI-powered insights for your report' : 'Your personal health companion'}
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
              <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-teal-400 font-medium">Connected</span>
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
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-teal-400" />
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
                    <div className="text-[15px] leading-relaxed text-white/90 prose prose-invert prose-p:my-2 prose-headings:text-white prose-strong:text-white prose-a:text-teal-400">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
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
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-teal-400" />
                </div>
                <div className="bg-white/[0.04] rounded-2xl rounded-bl-md px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-teal-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-teal-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-teal-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
                    // Auto-resize textarea
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
                      : "Ask me anything about your health..."
                  }
                  className="w-full min-h-[52px] max-h-[150px] px-5 py-3.5 text-[15px] text-white placeholder:text-white/30 bg-white/[0.06] border border-white/[0.08] rounded-xl focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.08] transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="h-[52px] w-[52px] bg-teal-500 hover:bg-teal-400 text-white rounded-xl disabled:opacity-30 disabled:bg-white/[0.08] transition-all duration-200 flex-shrink-0"
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