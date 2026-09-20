import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  text, 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-cyan-400 animate-spin`} />
      {text && (
        <p className="text-white/60 text-sm font-medium">{text}</p>
      )}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
}

export const CardSkeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
      <div className="animate-pulse space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        </div>
        {/* Value */}
        <div className="h-8 bg-white/10 rounded w-1/2" />
        {/* Footer */}
        <div className="h-3 bg-white/5 rounded w-2/3" />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
      <div className="animate-pulse space-y-4">
        {/* Chart title */}
        <div className="flex items-center justify-between">
          <div className="h-5 bg-white/10 rounded w-1/4" />
          <div className="h-4 bg-white/5 rounded w-20" />
        </div>
        {/* Chart area */}
        <div className="h-48 bg-white/5 rounded-lg flex items-end justify-around px-4 pb-4 gap-2">
          {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
            <div
              key={i}
              className="w-full bg-white/10 rounded-t"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-4">
          <div className="h-3 bg-white/5 rounded w-16" />
          <div className="h-3 bg-white/5 rounded w-16" />
        </div>
      </div>
    </div>
  );
};

interface ListSkeletonProps extends SkeletonProps {
  rows?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ 
  rows = 5, 
  className = '' 
}) => {
  return (
    <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
      <div className="animate-pulse space-y-4">
        {/* Header */}
        <div className="h-5 bg-white/10 rounded w-1/3 mb-6" />
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
            <div className="h-4 bg-white/5 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

interface PageLoaderProps {
  text?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ text = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <LoadingSpinner text={text} size="lg" />
      </div>
    </div>
  );
};

// Default export for convenience
const LoadingState = {
  Spinner: LoadingSpinner,
  Card: CardSkeleton,
  Chart: ChartSkeleton,
  List: ListSkeleton,
  Page: PageLoader,
};

export default LoadingState;
