/**
 * HbA1c Estimator Component
 * Visualizes estimated HbA1c using a semicircular gauge
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { estimateHbA1c, HbA1cEstimate } from '@/services/glucoseService';
import { TrendingUp, TrendingDown, Minus, Info, Target, ChevronDown, ChevronUp } from 'lucide-react';

const HBA1C_MIN = 4.0;
const HBA1C_MAX = 14.0;
const HBA1C_TARGET = 7.0;

// Color segments for the gauge
const COLOR_SEGMENTS = [
  { end: 5.7, color: '#22c55e', label: 'Normal' },      // green-500
  { end: 6.5, color: '#84cc16', label: 'Pre-diabetic' }, // lime-500
  { end: 7.0, color: '#3b82f6', label: 'Well-controlled' }, // blue-500
  { end: 8.0, color: '#eab308', label: 'Needs improvement' }, // yellow-500
  { end: 10.0, color: '#f97316', label: 'Poor control' }, // orange-500
  { end: 14.0, color: '#ef4444', label: 'Critical' },    // red-500
];

export function HbA1cEstimator() {
  const [estimate, setEstimate] = useState<HbA1cEstimate | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const result = estimateHbA1c();
    setEstimate(result);
  }, []);

  // Calculate gauge position
  const gaugeValue = useMemo(() => {
    if (!estimate || estimate.value === 0) return HBA1C_MIN;
    return Math.min(Math.max(estimate.value, HBA1C_MIN), HBA1C_MAX);
  }, [estimate]);

  // Convert HbA1c value to angle (180 degrees = semicircle)
  const valueToAngle = (value: number): number => {
    const percentage = (value - HBA1C_MIN) / (HBA1C_MAX - HBA1C_MIN);
    return percentage * 180; // 0 to 180 degrees
  };

  // Calculate needle position
  const needleAngle = valueToAngle(gaugeValue);
  const needleRadians = (needleAngle - 90) * (Math.PI / 180);
  const needleLength = 80;
  const needleX = 100 + needleLength * Math.cos(needleRadians);
  const needleY = 100 + needleLength * Math.sin(needleRadians);

  // Calculate target line position
  const targetAngle = valueToAngle(HBA1C_TARGET);
  const targetRadians = (targetAngle - 90) * (Math.PI / 180);
  const targetX = 100 + 85 * Math.cos(targetRadians);
  const targetY = 100 + 85 * Math.sin(targetRadians);

  // Get trend icon and color
  const getTrendInfo = () => {
    if (!estimate || estimate.previousMonthValue === null) {
      return { icon: Minus, color: 'text-gray-400', text: 'No previous data' };
    }
    
    const diff = estimate.value - estimate.previousMonthValue;
    const absDiff = Math.abs(diff).toFixed(1);
    
    if (estimate.trend === 'improving') {
      return { 
        icon: TrendingDown, 
        color: 'text-green-500', 
        text: `Improved ${absDiff}% from last month` 
      };
    } else if (estimate.trend === 'worsening') {
      return { 
        icon: TrendingUp, 
        color: 'text-red-500', 
        text: `Increased ${absDiff}% from last month` 
      };
    } else {
      return { 
        icon: Minus, 
        color: 'text-blue-500', 
        text: 'Stable compared to last month' 
      };
    }
  };

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;

  // Get current segment color
  const getCurrentColor = (value: number): string => {
    for (const segment of COLOR_SEGMENTS) {
      if (value <= segment.end) return segment.color;
    }
    return COLOR_SEGMENTS[COLOR_SEGMENTS.length - 1].color;
  };

  // Generate arc path for a segment
  const generateArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number): string => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = 100 + innerRadius * Math.cos(startRad);
    const y1 = 100 + innerRadius * Math.sin(startRad);
    const x2 = 100 + outerRadius * Math.cos(startRad);
    const y2 = 100 + outerRadius * Math.sin(startRad);
    const x3 = 100 + outerRadius * Math.cos(endRad);
    const y3 = 100 + outerRadius * Math.sin(endRad);
    const x4 = 100 + innerRadius * Math.cos(endRad);
    const y4 = 100 + innerRadius * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}`;
  };

  // Generate color segments
  const generateSegments = () => {
    const segments = [];
    let currentAngle = 0;
    
    for (const segment of COLOR_SEGMENTS) {
      const segmentStart = currentAngle;
      const segmentEnd = valueToAngle(segment.end);
      
      segments.push({
        path: generateArcPath(segmentStart, segmentEnd, 60, 90),
        color: segment.color,
        label: segment.label,
      });
      
      currentAngle = segmentEnd;
    }
    
    return segments;
  };

  const segments = generateSegments();

  if (!estimate) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = estimate.readingsCount > 0;
  const currentColor = getCurrentColor(estimate.value);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Estimated HbA1c
            </CardTitle>
            <CardDescription>
              Based on your glucose readings
            </CardDescription>
          </div>
          {hasData && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trendInfo.color}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{trendInfo.text}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-2">
        {/* Main Gauge */}
        <div className="relative flex flex-col items-center">
          <div className="relative w-full max-w-[280px] aspect-[2/1]">
            <svg 
              viewBox="0 0 200 110" 
              className="w-full h-full"
              preserveAspectRatio="xMidYMax meet"
            >
              {/* Background arc */}
              <path
                d={generateArcPath(0, 180, 60, 90)}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              
              {/* Color segments */}
              {segments.map((segment, index) => (
                <path
                  key={index}
                  d={segment.path}
                  fill={segment.color}
                  opacity={0.9}
                />
              ))}
              
              {/* Target line at 7.0% */}
              <line
                x1="100"
                y1="100"
                x2={targetX}
                y2={targetY}
                stroke="#1f2937"
                strokeWidth="2"
                strokeDasharray="4,2"
              />
              <circle
                cx={targetX}
                cy={targetY}
                r="4"
                fill="#1f2937"
              />
              
              {/* Target label */}
              <text
                x={targetX + (targetX > 100 ? 8 : -8)}
                y={targetY - 5}
                fontSize="8"
                fill="#1f2937"
                textAnchor={targetX > 100 ? 'start' : 'end'}
                fontWeight="500"
              >
                Target 7.0%
              </text>
              
              {/* Needle */}
              {hasData && (
                <>
                  <line
                    x1="100"
                    y1="100"
                    x2={needleX}
                    y2={needleY}
                    stroke="#1f2937"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="8"
                    fill="#1f2937"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="4"
                    fill="white"
                  />
                </>
              )}
              
              {/* Scale labels */}
              <text x="15" y="105" fontSize="8" fill="#6b7280" textAnchor="middle">4%</text>
              <text x="100" y="15" fontSize="8" fill="#6b7280" textAnchor="middle">9%</text>
              <text x="185" y="105" fontSize="8" fill="#6b7280" textAnchor="middle">14%</text>
            </svg>
            
            {/* Center value display */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 text-center">
              {hasData ? (
                <>
                  <div 
                    className="text-4xl font-bold"
                    style={{ color: currentColor }}
                  >
                    {estimate.value.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Estimated HbA1c
                  </div>
                </>
              ) : (
                <div className="text-2xl font-semibold text-muted-foreground">
                  No Data
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile trend indicator */}
          {hasData && (
            <div className={`sm:hidden flex items-center gap-1 text-sm font-medium mt-8 ${trendInfo.color}`}>
              <TrendIcon className="w-4 h-4" />
              <span>{trendInfo.text}</span>
            </div>
          )}
        </div>
        
        {/* Statistics Row */}
        {hasData && (
          <div className="grid grid-cols-3 gap-4 mt-10 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-lg font-semibold">{estimate.averageGlucose}</div>
              <div className="text-xs text-muted-foreground">Avg Glucose (mg/dL)</div>
            </div>
            <div className="text-center border-x border-border/50">
              <div className="text-lg font-semibold">{estimate.readingsCount}</div>
              <div className="text-xs text-muted-foreground">Readings Used</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{estimate.periodDays}</div>
              <div className="text-xs text-muted-foreground">Data Period (days)</div>
            </div>
          </div>
        )}
        
        {/* Interpretation Card */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-foreground leading-relaxed">
            {estimate.interpretation}
          </p>
        </div>
        
        {/* HbA1c Guide - Collapsible */}
        <div className="mt-4">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center justify-between w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Understanding HbA1c Levels</span>
            </div>
            {showGuide ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          
          {showGuide && (
            <div className="mt-2 p-4 rounded-lg bg-muted/30 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                <div className="text-sm">
                  <span className="font-medium">&lt; 5.7%</span> — Normal range
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-lime-500 flex-shrink-0"></div>
                <div className="text-sm">
                  <span className="font-medium">5.7% - 6.4%</span> — Pre-diabetic (increased risk)
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                <div className="text-sm">
                  <span className="font-medium">6.5% - 7.0%</span> — Well-controlled diabetes
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></div>
                <div className="text-sm">
                  <span className="font-medium">7.0% - 8.0%</span> — Needs improvement
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0"></div>
                <div className="text-sm">
                  <span className="font-medium">8.0% - 10.0%</span> — Poor control
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                <div className="text-sm">
                  <span className="font-medium">&gt; 10.0%</span> — Critical — see your doctor
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                <p>
                  HbA1c reflects your average blood glucose over the past 2-3 months. 
                  This estimate uses the ADAG formula based on your logged readings.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default HbA1cEstimator;
