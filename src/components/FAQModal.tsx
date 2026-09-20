import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { X, HelpCircle, Brain, Mic, Activity, Eye } from 'lucide-react';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const faqs = [
    {
      id: 'general-1',
      category: 'General',
      icon: Brain,
      question: 'What is HealthScan?',
      answer: 'HealthScan is a privacy-first browser-based platform for early neurological and health screening. All processing happens securely on your device using advanced AI and signal processing techniques.'
    },
    {
      id: 'general-2',
      category: 'General',
      icon: Brain,
      question: 'Is my data secure?',
      answer: 'Yes, absolutely. All analysis happens locally on your device. No audio, video, or personal data is ever sent to external servers. Your privacy is our top priority.'
    },
    {
      id: 'voice-1',
      category: 'Voice Lab',
      icon: Mic,
      question: 'How does voice analysis work?',
      answer: 'Our voice lab analyzes pitch stability, jitter, vocal quality, and speech patterns using advanced signal processing. Simply record a sustained "aaaa" sound for 5 seconds.'
    },
    {
      id: 'voice-2',
      category: 'Voice Lab',
      icon: Mic,
      question: 'What can voice analysis detect?',
      answer: 'Voice analysis can provide insights into vocal cord health, respiratory function, and neurological conditions that affect speech production. Results are for screening purposes only.'
    },
    {
      id: 'motor-1',
      category: 'Motor Lab',
      icon: Activity,
      question: 'What does the finger tapping test measure?',
      answer: 'The finger tapping test measures motor speed, rhythm consistency, and coordination. It can help identify early signs of movement disorders and track motor function over time.'
    },
    {
      id: 'motor-2',
      category: 'Motor Lab',
      icon: Activity,
      question: 'How accurate is tremor detection?',
      answer: 'Our computer vision algorithms can detect tremor frequency and amplitude with high precision. However, results should always be discussed with a healthcare professional.'
    },
    {
      id: 'eye-1',
      category: 'Eye & Cognition Lab',
      icon: Eye,
      question: 'What cognitive tests are available?',
      answer: 'We offer saccade tests for eye movement, Stroop tests for cognitive interference, and N-back tests for working memory assessment.'
    },
    {
      id: 'eye-2',
      category: 'Eye & Cognition Lab',
      icon: Eye,
      question: 'How do I interpret reaction time results?',
      answer: 'Faster reaction times generally indicate better cognitive processing speed. Our system provides context-aware interpretations and tracks changes over time.'
    },
    {
      id: 'technical-1',
      category: 'Technical',
      icon: Brain,
      question: 'What browsers are supported?',
      answer: 'HealthScan works best on modern browsers like Chrome, Firefox, Safari, and Edge. Make sure to allow camera and microphone permissions when prompted.'
    },
    {
      id: 'technical-2',
      category: 'Technical',
      icon: Brain,
      question: 'Can I export my results?',
      answer: 'Yes, you can export your session data and generate PDF reports for sharing with healthcare providers. All data remains on your device.'
    }
  ];

  const categories = ['General', 'Voice Lab', 'Motor Lab', 'Eye & Cognition Lab', 'Technical'];
  const [selectedCategory, setSelectedCategory] = useState('General');

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Auto-focus close button when modal opens
      closeButtonRef.current?.focus();
    }
    
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const filteredFAQs = faqs.filter(faq => faq.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="faq-modal-title"
    >
      <Card className="glass-panel w-full max-w-4xl max-h-[80vh] overflow-hidden border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle id="faq-modal-title" className="flex items-center gap-2 text-white">
            <HelpCircle className="w-6 h-6 text-purple-400" aria-hidden="true" />
            Frequently Asked Questions
          </CardTitle>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px]"
            aria-label="Close FAQ"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Category Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "ghost"}
                    className={`w-full justify-start text-left ${selectedCategory === category
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                      }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* FAQ Content */}
            <div className="lg:col-span-3">
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFAQs.map((faq) => {
                  const IconComponent = faq.icon;
                  return (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className="glass-panel border-white/5"
                    >
                      <AccordionTrigger className="text-left hover:no-underline px-4 py-3">
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5 text-purple-400 flex-shrink-0" />
                          <span className="text-white font-medium">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <p className="text-gray-300 leading-relaxed pl-8">
                          {faq.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};