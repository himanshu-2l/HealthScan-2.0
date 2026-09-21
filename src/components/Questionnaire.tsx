/**
 * Reusable Questionnaire Component
 * For PHQ-9, GAD-7, and other mental health assessments
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export interface Question {
  id: string;
  text: string;
  options: { value: number; label: string }[];
}

interface QuestionnaireProps {
  title: string;
  description: string;
  questions: Question[];
  answers: number[];
  onAnswerChange: (questionIndex: number, value: number) => void;
  currentQuestion?: number;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({
  title,
  description,
  questions,
  answers,
  onAnswerChange,
  currentQuestion
}) => {
  const progress = questions.length > 0
    ? ((answers.filter(a => a !== undefined && a !== null).length / questions.length) * 100)
    : 0;

  return (
    <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4 sm:py-5 px-5 sm:px-6">
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">{title}</CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">{description}</CardDescription>
        <Progress value={progress} className="mt-4 h-2 bg-slate-100 dark:bg-white/10" indicatorClassName="bg-teal-500" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
          {answers.filter(a => a !== undefined && a !== null).length} of {questions.length} questions answered
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-5 sm:p-6">
        {questions.map((question, index) => {
          const isCurrent = currentQuestion === undefined || currentQuestion === index;
          const isAnswered = answers[index] !== undefined && answers[index] !== null;

          return (
            <div
              key={question.id}
              className={`p-4 rounded-xl border transition-all ${
                isAnswered
                  ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/15'
                  : isCurrent
                    ? 'border-teal-300 dark:border-teal-700/50 bg-teal-50/30 dark:bg-teal-950/15'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]'
              }`}
            >
              <Label className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white mb-3 block">
                {index + 1}. {question.text}
              </Label>
              <RadioGroup
                value={answers[index]?.toString() || ''}
                onValueChange={(value) => onAnswerChange(index, parseInt(value))}
                className="mt-3"
              >
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <div 
                      key={option.value} 
                      className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100/70 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                        answers[index] === option.value ? 'bg-teal-50/60 dark:bg-teal-950/30 font-medium' : ''
                      }`}
                      onClick={() => onAnswerChange(index, option.value)}
                    >
                      <RadioGroupItem
                        value={option.value.toString()}
                        id={`${question.id}-${option.value}`}
                        className="border-slate-300 dark:border-white/30 text-teal-600 focus:ring-teal-500"
                      />
                      <Label
                        htmlFor={`${question.id}-${option.value}`}
                        className="text-slate-700 dark:text-slate-300 cursor-pointer flex-1 text-sm select-none"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

