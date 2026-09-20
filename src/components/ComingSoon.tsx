import React from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title = 'Coming Soon',
  description = 'This feature is currently under development and will be available soon.'
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-cyan-400" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {title}
          </h1>
          <p className="text-white/60 mb-6">
            {description}
          </p>

          {/* Decorative progress bar */}
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-pulse"
              style={{ width: '65%' }}
            />
          </div>

          {/* Go Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-medium transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
