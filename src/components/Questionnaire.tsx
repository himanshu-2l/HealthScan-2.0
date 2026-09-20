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
    <Card className="glass-panel border-0 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
      <CardHeader className="bg-white/5 border-b border-white/5">
        <CardTitle className="text-foreground">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
        <Progress value={progress} className="mt-4 h-2 bg-white/10" indicatorClassName="bg-blue-500" />
        <p className="text-sm text-muted-foreground mt-2">
          {answers.filter(a => a !== undefined && a !== null).length} of {questions.length} questions answered
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {questions.map((question, index) => {
          const isCurrent = currentQuestion === undefined || currentQuestion === index;
          const isAnswered = answers[index] !== undefined && answers[index] !== null;

          return (
            <div
              key={question.id}
              className={`p-4 rounded-lg border transition-all ${isCurrent && !isAnswered
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : isAnswered
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
            >
              <Label className="text-base font-semibold text-foreground mb-3 block">
                {index + 1}. {question.text}
              </Label>
              <RadioGroup
                value={answers[index]?.toString() || ''}
                onValueChange={(value) => onAnswerChange(index, parseInt(value))}
                className="mt-3"
              >
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value.toString()}
                        id={`${question.id}-${option.value}`}
                        className="border-white/30 text-blue-500"
                      />
                      <Label
                        htmlFor={`${question.id}-${option.value}`}
                        className="text-muted-foreground/90 cursor-pointer flex-1 user-select-none hover:text-foreground transition-colors"
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

