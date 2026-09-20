import React from 'react';
import { Button } from '@/components/ui/button';
import { Brain, ArrowLeft, Settings, HelpCircle, MessageCircle } from 'lucide-react';

interface HeaderProps {
  showBack?: boolean;
  onBackClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ showBack, onBackClick }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            {showBack && onBackClick && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onBackClick}
                className="shrink-0 text-gray-300 hover:text-white min-h-[44px] min-w-[44px]"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-400" />
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Health Scan
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">
                  Privacy-first health screening
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></div>
              <span className="text-xs font-medium text-green-400">On-Device</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px]"
              aria-label="Open chat"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px]"
              aria-label="Help and FAQ"
            >
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px]"
              aria-label="Open settings"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};